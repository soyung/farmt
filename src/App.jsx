// src/App.jsx
import React, { useState, useEffect } from 'react';
import FarmMap from './FarmMap.jsx';
import TreeModal from './TreeModal.jsx';
import { supabase } from './supabaseClient';

export default function App() {
  const [treeData, setTreeData] = useState({});     // { id: [rows...] }
  const [selectedTree, setSelectedTree] = useState(null);

  /* ─────────────────────────── LOAD ALL ROWS ────────────────────────── */
  useEffect(() => {
    async function loadAllRows() {
      const { data, error } = await supabase
        .from('trees')
        .select('*')
        .order('date', { ascending: false });   // newest first

      if (error) {
        console.error('Error fetching trees:', error);
        return;
      }

      const grouped = {};
      data.forEach((row) => {
        (grouped[row.id] ??= []).push(row);     // push into array
      });
      setTreeData(grouped);
    }

    /* ─────────────── realtime subscription (insert / update) ───────── */
    function subscribeRows() {
      return supabase
        .channel('farm-tracker-channel')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'trees' },
          ({ eventType, new: row, old }) => {
            setTreeData((prev) => {
              const copy = { ...prev };

              if (eventType === 'DELETE') {
                if (copy[old.id]) {
                  copy[old.id] = copy[old.id].filter(
                    (r) => !(r.date === old.date)
                  );
                  if (copy[old.id].length === 0) delete copy[old.id];
                }
              } else {
                // INSERT or UPDATE → prepend newest row
                (copy[row.id] ??= []).unshift(row);
              }
              return copy;
            });
          }
        )
        .subscribe();
    }

    loadAllRows();
    const channel = subscribeRows();
    return () => supabase.removeChannel(channel);
  }, []);

  /* ───────────────────────────── UI ───────────────────────────── */
  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: '1rem' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
        Podowa App v0.0.3
      </h1>

      <FarmMap
        treeData={treeData}          // arrays per id
        onTreeClick={setSelectedTree}
      />

      {selectedTree && (
        <TreeModal
          treeId={selectedTree}
          initialData={null}         // blank sheet each day
          onClose={() => setSelectedTree(null)}
        />
      )}
    </div>
  );
}