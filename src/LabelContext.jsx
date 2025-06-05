import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from './supabaseClient';

const LabelContext = createContext();
export const useLabels = () => useContext(LabelContext);

export function LabelProvider({ children }) {
  const [labels, setLabels] = useState({});      // { "Tree-1-1": {name,color} }

  /* ─── 1. initial fetch ─────────────────────────────────────────── */
  useEffect(() => {
    async function fetchAll() {
      const { data, error } = await supabase.from('tree_labels').select('*');
      if (!error && data) {
        const obj = {};
        data.forEach(({ id, name, color }) => {
          obj[id] = { name, color };
        });
        setLabels(obj);
      }
    }
    fetchAll();
  }, []);

  /* ─── 2. update helper + save to Supabase ──────────────────────── */
  async function upsert(id, payload) {
    setLabels(prev => ({ ...prev, [id]: { ...prev[id], ...payload } }));

    // Push to DB (ignore result for now; you could add error toast)
    await supabase.from('tree_labels').upsert({
      id,
      name:  payload.name  ?? labels[id]?.name  ?? null,
      color: payload.color ?? labels[id]?.color ?? null,
    });
  }

  /* ─── 3. optional realtime subscription (keeps tabs in sync) ───── */
  useEffect(() => {
    const channel = supabase
      .channel('labels')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tree_labels' },
        ({ new: row }) =>
          setLabels(prev => ({ ...prev, [row.id]: { name: row.name, color: row.color } }))
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  return (
    <LabelContext.Provider value={{ labels, upsert }}>
      {children}
    </LabelContext.Provider>
  );
}
