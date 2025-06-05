// src/FarmMap.jsx
import React from "react";
import {
  Stage,
  Layer,
  Group,
  Rect,
  Text,
  Image as KImage,
} from "react-konva";

import useIcons from "./hooks/useIcons";
import { useSignalLights } from "./SignalLightsContext"; // ← make sure this file exists!
import RenamePopup from "./RenamePopup";
import { useState } from "react";
import { useLabels } from "./LabelContext";

/* ------------------------------------------------------------------ */
/* Utility helpers                                                    */
/* ------------------------------------------------------------------ */

// How many days have passed since a YYYY-MM-DD string?
const daysSince = (isoDate) =>
  (Date.now() - new Date(isoDate).getTime()) / (1000 * 60 * 60 * 24);

// Decide which icons should light up for *one* tree’s history
function computeTriggers(records) {
  if (!records || records.length === 0) {
    return { stale: true, treeOn: false, bugOn: false, clockOn: true };
  }

  // 1️⃣  Staleness = days since newest row
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

    if (treeOn && bugOn) break; // no need to scan further
  }

  return { stale, treeOn, bugOn, clockOn: stale };
}

/* ------------------------------------------------------------------ */
/* Main component                                                     */
/* ------------------------------------------------------------------ */

export default function FarmMap({ treeData = {}, onTreeClick }) {
  /* ─── layout constants ─────────────────────────────────────────── */
  const rows     = 25;
  const cols     = 8;
  const cellW    = 44;   // ⬅️ width of one tree zone  (fits 3 icons + margin)
  const cellH    = 26;   // ⬅️ height (icon 12px + 3px gap + 8px text)
  const gapX     = 6;    // horizontal gap
  const gapY     = 8;    // vertical gap
  const iconSize = 12;   // width & height of each PNG inside the square

  /* ─── shared assets & state ────────────────────────────────────── */
  const { tree: treeImg, bug: bugImg, clock: clockImg } = useIcons();
  const { signalOn } = useSignalLights();   // true = colored, false = gray
  const { labels, upsert } = useLabels();
  const [editId, setEditId] = useState(null); 

  /* ─── build all Konva nodes ───────────────────────────────────── */
  const nodes = [];

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const id = `Tree-${r + 1}-${c + 1}`;
      const numericId = `${r + 1}-${c + 1}`;      // "1-1"
      const lbl       = labels[id] || {};         // {name,color} or {}
      const displayId = lbl.name ? `${numericId} ${lbl.name}` : numericId;

      const records = treeData[id] || [];

      const { treeOn, bugOn, clockOn } = computeTriggers(records);

      const x = c * (cellW + gapX);
      const y = r * (cellH + gapY);

      /* ----- icon strip (single click target) -------------------- */
      nodes.push(
        <Group
          key={id}
          x={x}
          y={y}
          onClick={() => onTreeClick(displayId)}
          onTap={() => onTreeClick(displayId)}
        >

          {/* invisible hit-box so the whole icon strip is easy to tap */}
          <Rect
            width={cellW}
            height={cellH}
            fill="transparent"   // 0.1 % opaque – visible? no. clickable? yes.
            listening={false}
        />

          {/* three icons, horizontally centered */}
          <KImage
            image={treeImg}
            x={xCenter(cellW, iconSize, 0)}
            y={(cellH - iconSize) / 2}
            width={iconSize}
            height={iconSize}
            opacity={signalOn && treeOn ? 1 : 0.25}
          />
          <KImage
            image={bugImg}
            x={xCenter(cellW, iconSize, 1)}
            y={(cellH - iconSize) / 2}
            width={iconSize}
            height={iconSize}
            opacity={signalOn && bugOn ? 1 : 0.25}
          />
          <KImage
            image={clockImg}
            x={xCenter(cellW, iconSize, 2)}
            y={(cellH - iconSize) / 2}
            width={iconSize}
            height={iconSize}
            opacity={signalOn && clockOn ? 1 : 0.25}
          />
        </Group>
      );

      /* ----- tiny label under each square ------------- */


  nodes.push(
    <Group
      key={`${id}-label`}
      x={x}
      y={y + iconSize + 8}          /* closer to icons */
      onClick={() => setEditId(id)}
      onTap={() => setEditId(id)}
    >
     <Rect width={cellW} height={10} fill={lbl.color || '#ffffff'} listening={false}/>
    <Text
      width={cellW}
      height={10}
      text={displayId}
      fontSize={8}
      align="center"
      verticalAlign="middle"
    />
     </Group>
   );

    }
  }

  /* ─── Stage size ──────────────────────────────────────────────── */
  const stageW = cols * (cellW + gapX);
  const stageH = rows * (cellH + gapY);  // +label height

  const stageRef = React.useRef(null);

  React.useEffect(() => {
  if (stageRef.current) {
    stageRef.current.container().style.touchAction = 'pinch-zoom'; // ← key line
  }
    }, []);


  return (
    <div style={{ overflow: "auto", maxHeight: "90vh" }}>
      <Stage width={stageW} height={stageH} preventDefault={false} >
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

const iconGap = 2;
/* ------------------------------------------------------------------ */
/* Helper: center each icon with a small offset                       */
/* i = 0,1,2 → first/second/third icon                                */
/* ------------------------------------------------------------------ */
function xCenter(cellWidth, icon, i) {
  const stripW = 3 * icon + 2 * iconGap;
  return (cellWidth - stripW) / 2 + i * (icon + iconGap);
}
