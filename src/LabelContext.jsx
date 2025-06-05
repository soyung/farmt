import { createContext, useContext, useState } from 'react';

const LabelContext = createContext();
export const useLabels = () => useContext(LabelContext);

export function LabelProvider({ children }) {
  // { "Tree-1-1": { name: "머스켓", color: "#ffeacc" }, ... }
  const [labels, setLabels] = useState({});

  function upsert(id, payload) {
    setLabels(prev => ({ ...prev, [id]: { ...prev[id], ...payload } }));
  }

  return (
    <LabelContext.Provider value={{ labels, upsert }}>
      {children}
    </LabelContext.Provider>
  );
}
