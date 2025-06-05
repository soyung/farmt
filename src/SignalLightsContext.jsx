import { createContext, useContext, useState } from 'react';

/* 1️⃣  Create the context */
const SignalLightsContext = createContext();

/* 2️⃣  Provider: keeps a single piece of state, `signalOn` */
export function SignalLightsProvider({ children }) {
  const [signalOn, setSignalOn] = useState(true);   // default = colored

  return (
    <SignalLightsContext.Provider value={{ signalOn, setSignalOn }}>
      {children}
    </SignalLightsContext.Provider>
  );
}

/* 3️⃣  Convenience hook (so components can call `useSignalLights()`) */
export function useSignalLights() {
  return useContext(SignalLightsContext);
}
