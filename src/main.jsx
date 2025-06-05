// src/main.jsx
import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import App from './App.jsx';

/* ➡️  1. import the provider  */
import { SignalLightsProvider } from './SignalLightsContext';
import { LabelProvider } from './LabelContext.jsx';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* ➡️  2. wrap EVERYTHING inside the provider */}
    <SignalLightsProvider>
        <LabelProvider>
          <BrowserRouter basename="/farmt">
            <App />
          </BrowserRouter>
        </LabelProvider>
    </SignalLightsProvider>
    {/*    ↑———————————————————————————↑
            this guarantees every component, including FarmMap,
            can call useSignalLights() safely                      */}
  </React.StrictMode>
);
