// @ts-nocheck
// src/TreeModal.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, ReferenceLine } from 'recharts';


// ---------- HELPER FUNCTIONS ---------- //

// Converts "YYYY-MM-DD" to "MM/DD/YYYY"
function formatDateForDisplay(isoDate) {
  if (!isoDate) return "";
  const parts = isoDate.split('-');
  return `${parts[1]}/${parts[2]}/${parts[0]}`; // MM/DD/YYYY
}

// Converts "MM/DD/YYYY" to "YYYY-MM-DD" (for saving to Supabase)
function parseDateForSupabase(mmddyyyy) {
  if (!mmddyyyy) return null;
  const parts = mmddyyyy.split('/');
  if(parts.length !== 3) return null;
  return `${parts[2]}-${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}`;
}

// Returns today's date in MM/DD/YYYY format.
function getTodayMMDDYYYY() {
  return formatDateForDisplay(new Date().toISOString().slice(0, 10));
}

// ---------- CONFIGURATION OPTIONS ---------- //

// For Power, Balance, and Bugs button groups.
const POWER_OPTIONS = ['판단불가/지켜봐야함', '1', '2', '3', '4', '5'];
const BALANCE_OPTIONS = ['판단불가/지켜봐야함', '1', '2', '3', '4', '5'];
const BUG_OPTIONS = [0, 1, 2, 3, 4, 5];

// For season-specific items:
// Seasons 1..6: Number of checkboxes for each season.
const SEASON_CHECKBOX_COUNTS = { 1: 5, 2: 4, 3: 6, 4: 6, 5: 3, 6: 3 };

const SEASON_OPTION_LABELS = {
  1: ['지켜봄', '맹아정리 (약한 것들)', '맹아정리 (센 것들)', '가지배치', '해충잡기'],
  2: ['약한가지 세력조절 - 어깨송이, 3번과제거, 꽃송이제거', '강한가지 세력조절 - 적심 및 제거', '해충잡기', '개화직전 세력조절 - 꽃송이 본격적 제거, (강한가지) 적심'],
  3: ['4-5엽기~개화기: 꽃송이로 세력조절', '개화 3-7일전: 송이손질', '개화직전: 최종송이결정 - 잎수(세력)에 따른', '가지뉘임', '개화시작**', '만개**'],
  4: ['송이털기', '송이크기정리', '알솎이', '세력조절 (강한가지)', '세력조절 (약한가지/송이떨구기)', '가지정리'],
  5: ['세력조절 (강한가지)', '세력조절 (약한가지/송이떨구기)', '알솎이'],
  6: ['세력조절 (강한가지)', '세력조절 (약한가지/송이떨구기)', '알솎이'],
};

// Season 7: 5 qualities with a 5-scale Likert rating.
const SEASON7_QUALITIES = ['착색', '당도', '등숙', '잎상태', '열매품질'];
const SEASON7_SCORES = [1, 2, 3, 4, 5];

// Valid season values (1 through 7)
const SEASONS = [1, 2, 3, 4, 5, 6, 7];

const SEASON_INSTRUCTIONS = {
  1: `조금이라도 적용되었거나, 시도했던 기술에는 체크해주세요.
영농일지 리포트로 기록에 남습니다.`,
  2: `평균수준의 세력을 관찰하고, 가장 약한 가지들이 세력을 따라갈 수 있게
포도송이의 짐을 덜어줍니다. (매일 매일 조금씩 관찰)
강하게 먼저 4‑5엽기가 오거나 도장하는 가지들은 적심, 또는 제거합니다.
균형있게 자랄 수 있게 하는 것이 4‑5엽기의 핵심입니다.
균형있게 자라야 꽃이 안정적으로 피고, 수정이 잘 이루어집니다.`,
  3: `개화기 (14일)`,
  4: `착과기,비대기 (14일)`,
  5: `경핵기 (25일) 끝순이 죽지 않아야한다. 세력통제를 확실하게해야한다.`,
  6: `성숙기 (40일) `,
};

const SEASON_NAMES = {
  1: '맹아기',
  2: '4-5엽기',
  3: '개화기',
  4: '착과기',
  5: '경핵기',
  6: '성숙기',
  7: '수확기',
};



// ---------- MAIN COMPONENT ---------- //
const TreeModal = ({ treeId, initialData, onClose }) => {
  const todayMMDDYYYY = getTodayMMDDYYYY();

  const [treeData, setTreeData] = useState(() => ({
    date: todayMMDDYYYY,
    season: '',
    power: '',
    balance: '',
    bugs: '',
    images: [],
    comments: '',
    season_data: {},
  }));

  const [newImage, setNewImage] = useState(null);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    async function fetchHistory() {
     const numericPart = treeId.split(' ')[0];      
     const realId      = `Tree-${numericPart}`;     
     const { data, error } = await supabase
      .from('trees')
      .select('*')
      .eq('id', realId)                             // use the actual PK
      .order('date');
      if (!error && data) {
        const formattedData = data.map(d => ({
          date: d.date,
          power: parseInt(d.power) || 0,
          balance: parseInt(d.balance) || 0,
          bugs: parseInt(d.bugs) || 0,
        }));
        setHistory(formattedData);
      }
    }
    fetchHistory();
  }, [treeId]);

  
  // Generic change handler for text inputs.
  function handleChange(field, value) {
    setTreeData((prev) => ({ ...prev, [field]: value }));
  }

  // For button groups, we'll use a simple style.
  const buttonStyle = (active) => ({
    padding: '1rem 1.5rem',
    margin: '0.3rem',
    fontSize: '1.2rem',
    border: active ? '2px solid blue' : '2px solid #ccc',
    borderRadius: '0.5rem',
    backgroundColor: active ? '#e0f0ff' : '#fff',
    cursor: 'pointer',
  });

  // ---------- HANDLERS FOR SEASON-SPECIFIC ITEMS ---------- //

  // For seasons 1–6: Handle checkbox toggles.
  function handleCheckboxChange(season, optionKey, checked) {
    setTreeData((prev) => ({
      ...prev,
      season_data: {
        ...prev.season_data,
        [season]: { ...(prev.season_data[season] || {}), [optionKey]: checked },
      },
    }));
  }

  // For season 7: Handle Likert radio buttons.
  function handleLikertChange(seasonKey, quality, score) {
    setTreeData((prev) => ({
      ...prev,
      season_data: {
        ...prev.season_data,
        [seasonKey]: { ...(prev.season_data[seasonKey] || {}), [quality]: score },
      },
    }));
  }

  // ---------- IMAGE HANDLERS ---------- //
  async function handleImageUpload() {
    if (!newImage || treeData.images.length >= 5) return;
    const fileName = `${treeId}-${Date.now()}-${newImage.name}`;
    const { error } = await supabase.storage.from('tree-images').upload(fileName, newImage);
    if (error) {
      console.error('Error uploading image:', error.message);
      return;
    }
    const { data: urlData } = supabase.storage.from('tree-images').getPublicUrl(fileName);
    if (urlData?.publicUrl) {
      setTreeData((prev) => ({ ...prev, images: [...prev.images, urlData.publicUrl] }));
    }
    setNewImage(null);
  }

  async function handleImageDelete(url) {
    const bucketName = 'tree-images';
    const filePath = url.split(`${bucketName}/`)[1];
    if (!filePath) {
      console.error('Could not parse file path from URL:', url);
      return;
    }
    const { error } = await supabase.storage.from(bucketName).remove([filePath]);
    if (error) {
      console.error('Error deleting image:', error.message);
      return;
    }
    setTreeData((prev) => ({
      ...prev,
      images: prev.images.filter((img) => img !== url),
    }));
  }

// ---------- SAVE FUNCTION ----------
async function saveChanges() {
  const isoDate = parseDateForSupabase(treeData.date);

  const row = {
    id: treeId,            // tree name (e.g. "Tree-1-1")
    date: isoDate,         // date column must be part of the row
    season: treeData.season ? Number(treeData.season) : null,
    power:   treeData.power,
    balance: treeData.balance,
    bugs:    treeData.bugs === '' ? null : Number(treeData.bugs),
    images:  treeData.images,
    comments: treeData.comments,
    season_data: treeData.season_data,
  };

  // id + date is the composite key
  const { error } = await supabase
    .from('trees')
    .upsert(row, { onConflict: ['id', 'date'] });   // <── important

  if (error) console.error(error);
  onClose();
}

 const jitter = (val, offset = 0.6) => val + (Math.random() - 0.5) * offset;
  // ---------- RENDERING ---------- //
  const currentSeason = Number(treeData.season);
  return (
    <div
      style={{
        position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.75)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999,
      }}
    >
      <div
        style={{
          position: 'relative', backgroundColor: 'white', padding: '0 1rem 1rem', borderRadius: '0.5rem',
          maxWidth: '700px', width: '90%', maxHeight: '90vh', overflowY: 'auto', zIndex: 1000,
        }}
      >
{/* ── Frosted sticky header (no border, inline label) ── */}
<div
  style={{
    position: 'sticky',
    top: 0,
    zIndex: 10,
    padding: '1rem 1rem',
    backdropFilter: 'blur(6px)',
    backgroundColor: 'rgba(255,255,255,0.8)',
    /* removed borderBottom / outlines */
    display: 'flex',
    alignItems: 'center',
  }}
>
  {(() => {
    const parts  = treeId.split(' ');
    const num    = parts[0];               // "1-1"
    const label  = parts.slice(1).join(' '); // optional
    return (
      <>
        <span style={{ fontSize: '1.4rem', fontWeight: 600 }}>
          {num}
        </span>
        {label && (
          <span
            style={{
              marginLeft: 8,          // small gap
              fontSize: '1.1rem',
              color: '#555',
              fontWeight: 500,
            }}
          >
            {label}
          </span>
        )}
      </>
    );
  })()}
</div>


{/* ---------- HISTORICAL DATA CHART ---------- */}
{history.length > 0 && (
  <div style={{ height: 220, marginBottom: 16 }}>
    <ResponsiveContainer width="100%" height="100%">
      {/* jitter once so points don’t overlap */}
      <LineChart
        data={history.map(h => ({
          ...h,
          powerJ: (parseInt(h.power)   || 0) + (Math.random() - 0.5) * 0.5,
          balanceJ:(parseInt(h.balance)|| 0) + (Math.random() - 0.5) * 0.5,
          bugsJ:   (parseInt(h.bugs)   || 0) + (Math.random() - 0.5) * 0.5,
        }))}
        margin={{ top: 10, right: 20 }}
      >
        {/* uniform thin grid */}
        <CartesianGrid vertical={false} horizontal={false} />

        {/* dashed horizontal lines exactly at y = 1-5 */}
        {[1, 2, 3, 4, 5].map((y) => (
          <ReferenceLine
            key={y}
            y={y}
            stroke="#ccc"
            strokeDasharray="3 3"
            ifOverflow="extendDomain"
          />
        ))}


        {/* solid axis lines */}
        <XAxis
            dataKey="date"
            tickFormatter={(d) => {
             const [year, month, day] = d.split('-');
          return `${month}/${day}`;
               }}
          axisLine
            />
        <YAxis
          domain={[0, 5]}
          ticks={[0, 1, 2, 3, 4, 5]}
          tickFormatter={(v) => (v === 0 ? '0/NA' : v)}
          axisLine
        />

        {/* tooltip: no grey cursor line, values rounded */}
        <Tooltip
          cursor={false}
          formatter={(val) => Math.round(val)}
        />

     {/*  custom legend with line + dot  */}
     <Legend
          wrapperStyle={{ display: 'flex', justifyContent: 'center' }}
          content={({ payload }) => (
            <div style={{ display: 'flex', gap: 18 }}>
              {payload.map(({ color, value }) => {
                const label = { powerJ: '세력', balanceJ: '균형', bugsJ: '해충' }[value] || value;
                return (
                  <span key={value} style={{ display: 'flex', alignItems: 'center', fontSize: 12 }}>
                    <svg width="30" height="10" style={{ marginRight: 4 }}>
                      <line x1="0"  y1="5" x2="26" y2="5" stroke={color} strokeWidth="2" />
                      <circle cx="13" cy="5" r="3.5" fill={color} />
                    </svg>
                    {label}
                  </span>
                );
              })}
            </div>
          )}
        />
        {/* series – solid dots */}
        <Line
          type="basis"
          dataKey="powerJ"
          stroke="green"
          strokeWidth={2}
          dot={{ r: 4, fill: 'green' }}
          name="세력"
          isAnimationActive={false}
        />
        <Line
          type="basis"
          dataKey="balanceJ"
          stroke="blue"
          strokeWidth={2}
          dot={{ r: 4, fill: 'blue' }}
          name="균형"
          isAnimationActive={false}
        />
        <Line
          type="basis"
          dataKey="bugsJ"
          stroke="red"
          strokeWidth={2}
          dot={{ r: 4, fill: 'red' }}
          name="해충"
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  </div>
)}



      
        {/* 1. Date */}
        <div style={{ marginBottom: '0.5rem' }}>
          <label>날짜:</label>
          <input
            type="date"
            value={parseDateForSupabase(treeData.date)}
            onChange={(e) => handleChange('date', formatDateForDisplay(e.target.value))}
            style={{ marginLeft: '0.5rem', padding: '0.5rem', fontSize: '1rem' }}
          />
        </div>

        {/* 2. Season */}
        <div style={{ marginBottom: '0.5rem' }}>
          <label>생육시기:</label>
          <div style={{ marginLeft: '0.5rem', display: 'flex', flexWrap: 'wrap' }}>
            {SEASONS.map((s) => (
              <button
                key={s}
                onClick={() => handleChange('season', String(s))}
                style={buttonStyle(treeData.season === String(s))}
              >
                {SEASON_NAMES[s] || `Season ${s}`}
              </button>
            ))}
          </div>
        </div>

{/* 3. Season-specific items */}
{treeData.season && currentSeason >= 1 && currentSeason <= 6 && (
  <div style={{ border: '1px solid #ccc', padding: '0.5rem', marginBottom: '1rem' }}>
     <h3 style={{ whiteSpace: 'pre-wrap' }}>
      {SEASON_NAMES[currentSeason] || `Season ${currentSeason}`}:{' '}
      {SEASON_INSTRUCTIONS[currentSeason] || 'Choose All That Apply'}
    </h3>

    {[
      ...Array(SEASON_CHECKBOX_COUNTS[currentSeason])
    ].map((_, i) => {
      const optionKey = `option${i + 1}`;

      /* ---------- NEW LINE: pick the label for this checkbox ---------- */
      const labelText =
        SEASON_OPTION_LABELS[currentSeason]?.[i] ?? `Option ${i + 1}`;

      return (
        <label
          key={optionKey}
          style={{ display: 'block', fontSize: '1rem', margin: '0.3rem 0' }}
        >
          <input
            type="checkbox"
            checked={treeData.season_data[currentSeason]?.[optionKey] || false}
            onChange={(e) =>
              handleCheckboxChange(currentSeason, optionKey, e.target.checked)
            }
            style={{ width: '1.5rem', height: '1.5rem', marginRight: '0.5rem' }}
          />
          {/* ---------- REPLACED TEXT HERE ---------- */}
          {labelText}
        </label>
      );
    })}
  </div>
)}


        {treeData.season && currentSeason === 7 && (
          <div style={{ border: '1px solid #ccc', padding: '0.5rem', marginBottom: '1rem' }}>
            <h3>{SEASON_NAMES[treeData.season] || `Season ${treeData.season}`}:</h3>
            <table style={{ borderCollapse: 'collapse', width: '100%' }}>
              <thead>
                <tr>
                  <th></th>
                  {SEASON7_SCORES.map((score) => (
                    <th key={score} style={{ padding: '0.5rem', border: '1px solid #ccc' }}>{score}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {SEASON7_QUALITIES.map((q) => {
                  const seasonObj = treeData.season_data[7] || {};
                  const currentScore = seasonObj[q] || '';
                  return (
                    <tr key={q}>
                      <td style={{ padding: '0.5rem', border: '1px solid #ccc' }}> {q}</td>
                      {SEASON7_SCORES.map((score) => (
                        <td key={score} style={{ textAlign: 'center', border: '1px solid #ccc' }}>
                          <input
                            type="radio"
                            name={`quality_${q}`}
                            checked={currentScore === score}
                            onChange={() => handleLikertChange(7, q, score)}
                            style={{ width: '1.5rem', height: '1.5rem' }}
                          />
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* 4. Power */}
        <div style={{ marginBottom: '0.5rem' }}>
          <label>나무의 세력:</label>
          <div style={{ marginLeft: '0.5rem', display: 'flex', flexWrap: 'wrap' }}>
            {POWER_OPTIONS.map((p) => (
              <button
                key={p}
                onClick={() => handleChange('power', p)}
                style={buttonStyle(treeData.power === p)}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* 5. Balance */}
        <div style={{ marginBottom: '0.5rem' }}>
          <label>나무의 균형도:</label>
          <div style={{ marginLeft: '0.5rem', display: 'flex', flexWrap: 'wrap' }}>
            {BALANCE_OPTIONS.map((b) => (
              <button
                key={b}
                onClick={() => handleChange('balance', b)}
                style={buttonStyle(treeData.balance === b)}
              >
                {b}
              </button>
            ))}
          </div>
        </div>

        {/* 6. Bugs */}
        <div style={{ marginBottom: '0.5rem' }}>
          <label>해충관리:</label>
          <div style={{ marginLeft: '0.5rem', display: 'flex', flexWrap: 'wrap' }}>
            {BUG_OPTIONS.map((num) => (
              <button
                key={num}
                onClick={() => handleChange('bugs', String(num))}
                style={buttonStyle(treeData.bugs === String(num))}
              >
                {num}
              </button>
            ))}
          </div>
        </div>

        {/* 7. Images */}
        <div style={{ marginBottom: '1rem' }}>
          <label>Images (up to 5):</label>
          <input
            type="file"
            accept="image/*"
            capture="environment"
            onChange={(e) => setNewImage(e.target.files[0])}
            disabled={treeData.images.length >= 5}
            style={{ marginLeft: '0.5rem' }}
          />
          <button
            onClick={handleImageUpload}
            disabled={!newImage || treeData.images.length >= 5}
            style={{
              marginLeft: '0.5rem',
              backgroundColor: 'green',
              color: 'white',
              padding: '0.5rem 1rem',
              border: 'none',
              borderRadius: '0.3rem',
              cursor: 'pointer',
            }}
          >
            Upload
          </button>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', marginBottom: '1rem' }}>
          {treeData.images.map((url, idx) => (
            <div key={idx} style={{ position: 'relative', margin: '0.5rem' }}>
              <img
                src={url}
                alt="Tree"
                style={{ width: '80px', height: '80px', objectFit: 'cover' }}
              />
              <button
                onClick={() => handleImageDelete(url)}
                style={{
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  backgroundColor: 'red',
                  color: 'white',
                  border: 'none',
                  borderRadius: '50%',
                  cursor: 'pointer',
                }}
              >
                X
              </button>
            </div>
          ))}
        </div>
        {treeData.images.length >= 5 && (
          <p style={{ color: 'red' }}>Max 5 images reached</p>
        )}

        {/* 8. Comments */}
        <div style={{ marginBottom: '1rem' }}>
          <label>Comments:</label>
          <textarea
            value={treeData.comments}
            onChange={(e) => handleChange('comments', e.target.value)}
            style={{ display: 'block', width: '100%', height: '60px' }}
          />
        </div>

        {/* SAVE & CANCEL BUTTONS */}
        <button
          onClick={saveChanges}
          style={{
            backgroundColor: 'blue',
            color: 'white',
            padding: '0.5rem 1rem',
            border: 'none',
            borderRadius: '0.3rem',
            cursor: 'pointer',
          }}
        >
          Save & Close
        </button>
        <button
          onClick={onClose}
          style={{
            marginLeft: '0.5rem',
            backgroundColor: '#ccc',
            color: 'black',
            padding: '0.5rem 1rem',
            border: 'none',
            borderRadius: '0.3rem',
            cursor: 'pointer',
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default TreeModal;