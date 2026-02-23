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

  const stageRef = useRef(null);
  const lastDistRef = useRef(null);
  const scaleRef = useRef(1);
  const posRef = useRef({ x: 0, y: 0 });

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

  // 데스크탑에서 초기 스케일 키우기
  useEffect(() => {
    const isDesktop = window.innerWidth >= 1025;
    if (isDesktop) {
      const initScale = Math.min(window.innerWidth / 500, 2.5);
      scaleRef.current = initScale;
      posRef.current = { x: 20, y: 20 };
      if (stageRef.current) {
        stageRef.current.scale({ x: initScale, y: initScale });
        stageRef.current.position({ x: 20, y: 20 });
        stageRef.current.batchDraw();
      }
    }
  }, [stageHeight]);

  const { tree: treeImg, bug: bugImg, clock: clockImg } = useIcons();
  const { signalOn } = useSignalLights();
  const { labels, upsert } = useLabels();
  const [editId, setEditId] = useState(null);

  const handleWheel = (e) => {
    e.evt.preventDefault();
    const stage = stageRef.current;
    const oldScale = scaleRef.current;
    const pointer = stage.getPointerPosition();
    const mousePointTo = {
      x: (pointer.x - posRef.current.x) / oldScale,
      y: (pointer.y - posRef.current.y) / oldScale,
    };
    const newScale = Math.max(0.5, Math.min(4, e.evt.deltaY > 0 ? oldScale * 0.9 : oldScale * 1.1));
    const newPos = {
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    };
    scaleRef.current = newScale;
    posRef.current = newPos;
    stage.scale({ x: newScale, y: newScale });
    stage.position(newPos);
    stage.batchDraw();
  };

  // 핀치줌: DOM 직접 → Konva 직접 조작 (React setState 없음 = 렉 없음)
  useEffect(() => {
    const container = stageRef.current?.container();
    if (!container) return;

    const onTouchStart = (e) => {
      if (e.touches.length === 2) {
        lastDistRef.current = Math.hypot(
          e.touches[1].clientX - e.touches[0].clientX,
          e.touches[1].clientY - e.touches[0].clientY
        );
      }
    };

    const onTouchMove = (e) => {
      if (e.touches.length < 2) return;
      e.preventDefault();
      e.stopPropagation();

      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      if (lastDistRef.current === null) { lastDistRef.current = dist; return; }

      const ratio = dist / lastDistRef.current;
      lastDistRef.current = dist;

      const stage = stageRef.current;
      const oldScale = scaleRef.current;
      const newScale = Math.max(0.5, Math.min(4, oldScale * ratio));

      const mid = {
        x: (t1.clientX + t2.clientX) / 2 - container.getBoundingClientRect().left,
        y: (t1.clientY + t2.clientY) / 2 - container.getBoundingClientRect().top,
      };
      const oldPos = posRef.current;
      const newPos = {
        x: mid.x - ((mid.x - oldPos.x) / oldScale) * newScale,
        y: mid.y - ((mid.y - oldPos.y) / oldScale) * newScale,
      };

      scaleRef.current = newScale;
      posRef.current = newPos;

      // React state 없이 Konva 직접 업데이트
      stage.scale({ x: newScale, y: newScale });
      stage.position(newPos);
      stage.batchDraw();
    };

    const onTouchEnd = () => { lastDistRef.current = null; };

    container.addEventListener('touchstart', onTouchStart, { passive: false });
    container.addEventListener('touchmove', onTouchMove, { passive: false });
    container.addEventListener('touchend', onTouchEnd);
    return () => {
      container.removeEventListener('touchstart', onTouchStart);
      container.removeEventListener('touchmove', onTouchMove);
      container.removeEventListener('touchend', onTouchEnd);
    };
  }, [stageHeight]);

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
          posRef.current = { x: e.target.x(), y: e.target.y() };
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