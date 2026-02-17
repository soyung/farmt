// src/App.jsx
import React, { useState, useEffect } from 'react';
import FarmMap from './FarmMap.jsx';
import TreeModal from './TreeModal.jsx';
import Login from './components/Login.jsx';
import ExportButton from './components/ExportButton.jsx';
import ChangePassword from './components/ChangePassword.jsx';
import { supabase } from './supabaseClient';
import './App.css';

import IconLink from './components/IconLink';
import waterlink from './assets/icons/global_water.svg';
import trtlink from './assets/icons/global_trt.svg';

export default function App() {
  const [treeData, setTreeData] = useState({});
  const [selectedTree, setSelectedTree] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showChangePassword, setShowChangePassword] = useState(false);

  // Check Supabase auth session on mount
  useEffect(() => {
    // Get current session (persists for 30 days automatically)
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes (login/logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Load tree data (only when authenticated)
  useEffect(() => {
    if (!user) return;

    async function loadAllRows() {
      const { data, error } = await supabase
        .from('trees')
        .select('*')
        .order('date', { ascending: false });

      if (error) {
        console.error('Error fetching trees:', error);
        return;
      }

      const grouped = {};
      data.forEach((row) => {
        (grouped[row.id] ??= []).push(row);
      });
      setTreeData(grouped);
    }

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
                  copy[old.id] = copy[old.id].filter((r) => r.date !== old.date);
                  if (copy[old.id].length === 0) delete copy[old.id];
                }
              } else {
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
  }, [user]);

  const handleLogin = (user) => {
    setUser(user);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setTreeData({});
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="app-wrapper">
      <div className="app-container">
        <header className="app-header">
          <div className="header-content">
            <div className="header-title">
              <h1>Podowa App</h1>
              <span className="version">v0.1.0</span>
            </div>
            <div className="header-actions">
              <div className="icon-links">
                <IconLink href="https://example.com/water" src={waterlink} alt="global water" />
                <IconLink href="https://example.com/trt" src={trtlink} alt="global treatment" />
              </div>
              <ExportButton />
              <span className="welcome-text">{user.email}</span>
              <button onClick={() => setShowChangePassword(true)} className="change-password-button">
                Change Password
              </button>
              <button onClick={handleLogout} className="logout-button">
                Logout
              </button>
            </div>
          </div>
        </header>

        <main className="app-content">
          <FarmMap
            treeData={treeData}
            onTreeClick={setSelectedTree}
          />
        </main>

        {selectedTree && (
          <TreeModal
            treeId={selectedTree}
            initialData={null}
            onClose={() => setSelectedTree(null)}
          />
        )}

        {showChangePassword && (
          <ChangePassword onClose={() => setShowChangePassword(false)} />
        )}
      </div>
    </div>
  );
}