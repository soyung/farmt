// src/FarmMap.jsx – filled layers inside square, green>blue>red, cleaned JSX
import React from 'react';
import { Stage, Layer, Rect, Text, Group, Line } from 'react-konva';

/* ───────────── Friendly nicknames (optional) ─────────── */
const TREE_NICKNAMES = {
  'Tree-1-3': '소평옥 2021',
  'Tree-1-6': '루비피치 2021',
  'Tree-1-8': '머스켓함부르크 2021',
  'Tree-1-12': '루비피치 2021',
  'Tree-1-19': '머스켓함부르크2021',
  'Tree-1-20': '머스켓함부르크2021',
  'Tree-1-23': '머스켓함부르크2021',
  'Tree-1-25': '까버네쇼비농 2020',
  'Tree-2-3': '머스켓함부르크2021',
  'Tree-2-7': '블랑블랑 2020',
  'Tree-2-10': '알렉산드리아 2021',
  'Tree-2-12': '알렉산드리아 2021',
  'Tree-2-14': '알렉산드리아 2021',
  'Tree-2-16': '알렉산드리아 2021',
  'Tree-2-20': '알렉산드리아 2021',
  'Tree-2-22': '알렉산드리아 2021',
  'Tree-3-2': '루비시들리스 2021',
  'Tree-3-8': '샤인머스켓 2021',
  'Tree-3-11': '알렉산드리아 2021',
  'Tree-3-14': '매니큐이핑거 2021',
  'Tree-3-15': '매니큐어핑거 2020',
  'Tree-3-21': '블랑블랑 2020',
  'Tree-3-23': '루비시들리스 2021',
  'Tree-3-25': '샤인머스켓 2021',
  'Tree-4-2': '플레임시들리스 2020',
  'Tree-4-12': '매니큐어핑거 2021',
  'Tree-4-14': '흑바라드 2021',
  'Tree-4-15': '흑바라드 2021',
  'Tree-4-16': '흑바라드 2021',
  'Tree-4-17': '머스켓함부르크 2021',
  'Tree-4-19': '루비피치 2021',
  'Tree-4-22': '루비피치 2021',
  'Tree-4-23': '흑바라드 2021',
  'Tree-4-25': '플레임시들리스 2021'
};
/* ───────────── Threshold helpers ───────────── */
const overBugThreshold     = (bugs)    => Number(bugs) >= 4;               // red layer
const overBalanceThreshold = (balance) => [1, 2, '1', '2'].includes(balance); // blue layer
const overPowerThreshold   = (power)   => [1, 5, '1', '5'].includes(power);   // green layer

// Days without entries to trigger yellow override
const STALE_DAYS_THRESHOLD = 3;

// Helper to compute days difference
function daysSince(dateStr) {
  return (Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24);
}
// Build color rings and detect staleness
function computeCurrentColors(records) {
  if (!records || records.length === 0) {
    return { stale: true, bug: null, balance: null, power: null };
  }
  // records sorted newest first by `date` string
  const latestDate = records[0].date;
  const stale = daysSince(latestDate) > STALE_DAYS_THRESHOLD;
  if (stale) {
    return { stale: true, bug: null, balance: null, power: null };
  }
  let bug = null, bal = null, pow = null;
  for (const row of records) {
    if (row.bugs ?? row.balance ?? row.power) {
      if (bug === null && overBugThreshold(row.bugs))       bug = 'red';
      if (bal === null && overBalanceThreshold(row.balance)) bal = 'blue';
      if (pow === null && overPowerThreshold(row.power))     pow = 'green';
      if (bug !== null && bal !== null && pow !== null) break;
    }
  }
  return { stale: false, bug, balance: bal, power: pow };
}

const FarmMap = ({ treeData = {}, onTreeClick }) => {
  const rows = 25;
  const cols = 8;
  const size = 20;   // outer size
  const step = 4;    // inset for each layer
  const spacing = 10;

  const gridW = cols * (size + spacing);
  const gridH = rows * (size + spacing);

  const getRecords = (id) => {
    const val = treeData[id];
    return !val ? [] : Array.isArray(val) ? val : [val];
  };

  const nodes = [];

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const id = `Tree-${r + 1}-${c + 1}`;
      const records = getRecords(id);
      const { stale, bug, balance, power } = computeCurrentColors(records);

      const x = c * (size + spacing);
      const y = r * (size + spacing);

      // Override: stale data -> full yellow square
      if (stale) {
        nodes.push(
          <Group key={id} onClick={() => onTreeClick(id)} onTap={() => onTreeClick(id)}>
            <Rect x={x} y={y} width={size} height={size} fill="yellow" />
            <Text
              x={x + size / 2}
              y={y + size + 2}
              text={TREE_NICKNAMES[id] ?? id}
              fontSize={10}
              fill="black"
              align="center"
              offsetX={(TREE_NICKNAMES[id] ?? id).length * 5}
            />
          </Group>
        );
        continue;
      }

      // Normal ring rendering

          const sliceWidth = size / 3;
    nodes.push(
      <Group key={id} onClick={()=>onTreeClick(id)}>
        {/* border & hitbox */}
        <Rect x={x} y={y} width={size} height={size} stroke="#ccc" strokeWidth={1} fillEnabled={false} />
        <Rect x={x} y={y} width={size} height={size} fill="rgba(0,0,0,0.001)" />
        {/* vertical slices: green, blue, red */}
        {power   && <Rect x={x}               y={y} width={sliceWidth}   height={size} fill="green" />}  
        {balance && <Rect x={x + sliceWidth} y={y} width={sliceWidth}   height={size} fill="blue" />}  
        {bug     && <Rect x={x + 2*sliceWidth} y={y} width={sliceWidth} height={size} fill="red" />}    


          {/* label */}
          <Text
            x={x + size / 2}
            y={y + size + 2}
            text={TREE_NICKNAMES[id] ?? id}
            fontSize={10}
            fill="black"
            align="center"
            offsetX={(TREE_NICKNAMES[id] ?? id).length * 5}
          />
        </Group>
      );
    }
  }

  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'auto' }}>
      <Stage width={gridW} height={gridH}>
        <Layer>{nodes}</Layer>
      </Stage>
    </div>
  );
};

export default FarmMap;