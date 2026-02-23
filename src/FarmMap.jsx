// src/FarmMap.jsx
import React, { useState, useRef, useEffect } from "react";
import {
  Stage,
  Layer,
  Group,
  Rect,
  Text,
  Image as KImage,
} from "react-konva";

import useIcons from "./hooks/useIcons";
import { useSignalLights } from "./SignalLightsContext";
import RenamePopup from "./RenamePopup";
import { useLabels } from "./LabelContext";

const daysSince = (isoDate) =>
  (Date.now() - new Date(isoDate).getTime()) / (1000 * 60 * 60 * 24);

function computeTriggers(records) {
  if (!records || records.length === 0) {
    return { stale: true, treeOn: false, bugOn: false, clockOn: true };
  }

  const newestDate = records[0].date;
  const stale = daysSince(newestDate) >= 3;

  let treeOn = false;
  let bugOn = false;

  for (const row of records) {
    if (!treeOn && (["1", "2", 1, 2].includes(row.balance) ||
                    ["1", "5", 1, 5].includes(row.power))) {
      treeOn = true;
    }
    if (!bugOn && Number(row.bugs) >= 4) bugOn = true;

    if (treeOn && bugOn) break;
  }

  return { stale, treeOn, bugOn, clockOn: stale };
}

export default function FarmMap({ treeData = {}, onTreeClick }) {
  const rows     = 25;
  const cols     = 8;
  const cellW    = 44;
  const cellH    = 26;
  const gapX     = 6;
  const gapY     = 8;
  const iconSize = 12;
  const iconGap  = 2;

  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const stageRef = useRef(null);
  const rafRef = useRef(null);           // throttle ref
  const lastDistRef = useRef(null);      // pinch distance ref
  const gestureRef = useRef({ scale: 1, position: { x: 0, y: 0 } });

  // 헤더 높이만큼 Stage 높이 줄이기
  const [stageHeight, setStageHeight] = useState(window.innerHeight);
  useEffect(() => {
    function calcHeight() {
      const header = document.querySelector('.app-header-bar');
      const headerH = header ? header.getBoundingClientRect().height : 50;
      setStageHeight(window.innerHeight - headerH);
    }
    calcHeight();
    window.addEventListener('resize', calcHeight);
    return () => window.removeEventListener('resize', calcHeight);
  }, []);

  const { tree: treeImg, bug: bugImg, clock: clockImg } = useIcons();
  const { signalOn } = useSignalLights();
  const { labels, upsert } = useLabels();
  const [editId, setEditId] = useState(null);

  const handleWheel = (e) => {
    e.evt.preventDefault();
    const stage = stageRef.current;
    const oldScale = scale;
    const pointer = stage.getPointerPosition();
    const mousePointTo = {
      x: (pointer.x - position.x) / oldScale,
      y: (pointer.y - position.y) / oldScale,
    };
    const newScale = Math.max(0.5, Math.min(4, e.evt.deltaY > 0 ? oldScale * 0.9 : oldScale * 1.1));
    setScale(newScale);
    setPosition({
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    });
  };

  // 핀치줌 전용 핸들러 (Konva 이벤트 아닌 DOM 이벤트로 처리)
  useEffect(() => {
    const container = stageRef.current?.container();
    if (!container) return;

    const onTouchMove = (e) => {
      if (e.touches.length < 2) return;
      e.preventDefault();

      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const dist = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      );

      if (lastDistRef.current === null) { lastDistRef.current = dist; return; }

      const delta = dist - lastDistRef.current;
      lastDistRef.current = dist;

      const oldScale = gestureRef.current.scale;
      const newScale = Math.max(0.5, Math.min(4, oldScale * (1 + delta * 0.01)));
      const pos = gestureRef.current.position;

      const midpoint = {
        x: (touch1.clientX + touch2.clientX) / 2,
        y: (touch1.clientY + touch2.clientY) / 2,
      };
      const mousePointTo = {
        x: (midpoint.x - pos.x) / oldScale,
        y: (midpoint.y - pos.y) / oldScale,
      };
      const newPos = {
        x: midpoint.x - mousePointTo.x * newScale,
        y: midpoint.y - mousePointTo.y * newScale,
      };

      gestureRef.current = { scale: newScale, position: newPos };

      if (rafRef.current) return;
      rafRef.current = requestAnimationFrame(() => {
        setScale(gestureRef.current.scale);
        setPosition(gestureRef.current.position);
        rafRef.current = null;
      });
    };

    const onTouchEnd = () => { lastDistRef.current = null; };

    container.addEventListener('touchmove', onTouchMove, { passive: false });
    container.addEventListener('touchend', onTouchEnd);
    return () => {
      container.removeEventListener('touchmove', onTouchMove);
      container.removeEventListener('touchend', onTouchEnd);
    };
  }, [scale, position]);

  const handleTouchEnd = () => {};  // DOM 핸들러로 대체됨

  const nodes = [];

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const id = `Tree-${c + 1}-${r + 1}`;
      const numericId = `${c + 1}-${r + 1}`;
      const lbl = labels[id] || {};
      const displayId = lbl.name ? `${numericId} ${lbl.name}` : numericId;
      const isDisabled = lbl.disabled === true;

      // ✅ 수정: numericId("1-1")로 조회 (DB 키와 일치)
      const records = treeData[numericId] || [];
      const { treeOn, bugOn, clockOn } = computeTriggers(records);

      const x = c * (cellW + gapX);
      const y = r * (cellH + gapY);

      if (isDisabled) {
        nodes.push(
          <Group key={id} x={x} y={y}>
            <Rect
              width={cellW}
              height={cellH}
              fill="#d3d3d3"
              opacity={0.5}
            />
          </Group>
        );
      } else {
        nodes.push(
          <Group
            key={id}
            x={x}
            y={y}
            onClick={() => onTreeClick(id)}
            onTap={() => onTreeClick(id)}
          >
            <Rect
              width={cellW}
              height={cellH}
              fill="transparent"
              listening={false}
            />

            <KImage
              image={treeImg}
              x={xCenter(cellW, iconSize, 0, iconGap)}
              y={(cellH - iconSize) / 2}
              width={iconSize}
              height={iconSize}
              opacity={signalOn && treeOn ? 1 : 0.25}
            />
            <KImage
              image={bugImg}
              x={xCenter(cellW, iconSize, 1, iconGap)}
              y={(cellH - iconSize) / 2}
              width={iconSize}
              height={iconSize}
              opacity={signalOn && bugOn ? 1 : 0.25}
            />
            <KImage
              image={clockImg}
              x={xCenter(cellW, iconSize, 2, iconGap)}
              y={(cellH - iconSize) / 2}
              width={iconSize}
              height={iconSize}
              opacity={signalOn && clockOn ? 1 : 0.25}
            />
          </Group>
        );
      }

      if (!FarmMap._textSizer) {
        const offscreenCanvas = document.createElement('canvas');
        FarmMap._textSizer = offscreenCanvas.getContext('2d');
      }
      const ctx = FarmMap._textSizer;

      const baseFont = 'sans-serif';
      let fontSize = 8;
      const minFontSize = 4;
      const cellPadding = 2;

      ctx.font = `${fontSize}px ${baseFont}`;
      let textWidth = ctx.measureText(displayId).width;
      while (textWidth + cellPadding * 2 > cellW && fontSize > minFontSize) {
        fontSize--;
        ctx.font = `${fontSize}px ${baseFont}`;
        textWidth = ctx.measureText(displayId).width;
      }

      nodes.push(
        <Group
          key={`${id}-label`}
          x={x}
          y={y + iconSize + 8}
          onClick={() => setEditId(id)}
          onTap={() => setEditId(id)}
        >
          <Rect
            width={cellW}
            height={10}
            fill={isDisabled ? '#999999' : (lbl.color || '#ffffff')}
            listening={false}
          />
          <Text
            width={cellW}
            height={10}
            text={displayId}
            fontSize={fontSize}
            fontFamily={baseFont}
            align="center"
            verticalAlign="middle"
            ellipsis={true}
            fill={isDisabled ? '#666666' : '#000000'}
          />
        </Group>
      );
    }
  }

  const stageW = cols * (cellW + gapX);
  const stageH = rows * (cellH + gapY);

  // 브라우저 터치 이벤트 DOM 레벨에서 직접 차단
  useEffect(() => {
    const container = stageRef.current?.container();
    if (!container) return;

    container.style.touchAction = 'none';
    container.style.userSelect = 'none';

    const preventDefault = (e) => {
      if (e.touches.length >= 2) e.preventDefault(); // 핀치줌 차단
    };

    // passive: false 필수 — 이게 없으면 preventDefault 무시됨
    container.addEventListener('touchstart', preventDefault, { passive: false });
    container.addEventListener('touchmove', preventDefault, { passive: false });

    return () => {
      container.removeEventListener('touchstart', preventDefault);
      container.removeEventListener('touchmove', preventDefault);
    };
  }, []);

  return (
    <div style={{ 
      overflow: "hidden", 
      width: "100%",
      touchAction: "none"
    }}>
      <Stage
        ref={stageRef}
        width={window.innerWidth}
        height={stageHeight}
        scaleX={scale}
        scaleY={scale}
        x={position.x}
        y={position.y}
        draggable
        onWheel={handleWheel}
        onDragEnd={(e) => {
          setPosition({ x: e.target.x(), y: e.target.y() });
          gestureRef.current.position = { x: e.target.x(), y: e.target.y() };
        }}
        pixelRatio={window.devicePixelRatio} 
      >
        <Layer>{nodes}</Layer>
      </Stage>
      {editId && (
        <RenamePopup
          id={editId}
          current={labels[editId]}
          onSave={(payload) => upsert(editId, payload)}
          onClose={() => setEditId(null)}
        />
      )}
    </div>
  );
}

function xCenter(cellWidth, icon, i, gap) {
  const stripW = 3 * icon + 2 * gap;
  return (cellWidth - stripW) / 2 + i * (icon + gap);
}