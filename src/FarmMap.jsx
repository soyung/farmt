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
  const size     = 28;   // width & height of each square
  const spacing  = 12;   // gap between squares
  const iconSize = 12;   // width & height of each PNG inside the square

  /* ─── shared assets & state ────────────────────────────────────── */
  const { tree: treeImg, bug: bugImg, clock: clockImg } = useIcons();
  const { signalOn } = useSignalLights();   // true = colored, false = gray

  /* ─── build all Konva nodes ───────────────────────────────────── */
  const nodes = [];

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const id = `Tree-${r + 1}-${c + 1}`;
      const records = treeData[id] || [];

      const { treeOn, bugOn, clockOn } = computeTriggers(records);

      const x = c * (size + spacing);
      const y = r * (size + spacing);

      /* ----- icon strip (single click target) -------------------- */
      nodes.push(
        <Group
          key={id}
          x={x}
          y={y}
          onClick={() => onTreeClick(id)}
          onTap={() => onTreeClick(id)}
        >
          {/* border for pointer feedback */}
          <Rect
            width={size}
            height={size}
            stroke="#999"
            strokeWidth={1}
            fillEnabled={false}
          />

          {/* three icons, horizontally centered */}
          <KImage
            image={treeImg}
            x={xCenter(size, iconSize, 0)}
            y={(size - iconSize) / 2}
            width={iconSize}
            height={iconSize}
            opacity={signalOn && treeOn ? 1 : 0.25}
          />
          <KImage
            image={bugImg}
            x={xCenter(size, iconSize, 1)}
            y={(size - iconSize) / 2}
            width={iconSize}
            height={iconSize}
            opacity={signalOn && bugOn ? 1 : 0.25}
          />
          <KImage
            image={clockImg}
            x={xCenter(size, iconSize, 2)}
            y={(size - iconSize) / 2}
            width={iconSize}
            height={iconSize}
            opacity={signalOn && clockOn ? 1 : 0.25}
          />
        </Group>
      );

      /* ----- (optional) tiny label under each square ------------- */
      nodes.push(
        <Text
          key={`${id}-label`}
          x={x}
          y={y + size + 2}
          width={size}
          text={`${r + 1}-${c + 1}`}          // shows “1-1”, “1-2”, …
          fontSize={10}
          align="center"
        />
      );
    }
  }

  /* ─── Stage size ──────────────────────────────────────────────── */
  const stageW = cols * (size + spacing);
  const stageH = rows * (size + spacing) + 12;  // +label height

  return (
    <div style={{ overflow: "auto", maxHeight: "90vh" }}>
      <Stage width={stageW} height={stageH}>
        <Layer>{nodes}</Layer>
      </Stage>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Helper: center each icon with a small offset                       */
/* i = 0,1,2 → first/second/third icon                                */
/* ------------------------------------------------------------------ */
function xCenter(square, icon, i) {
  const stripW = 3 * icon;
  const left   = (square - stripW) / 2;
  return left + i * icon;
}
