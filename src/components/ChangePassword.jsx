// src/components/ChangePassword.jsx
import { useState } from 'react';
import { supabase } from '../supabaseClient';

export default function ChangePassword({ onClose }) {
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (newPassword !== confirm) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
    setTimeout(() => onClose(), 1500);
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999,
    }}>
      <div style={{
        background: 'white', padding: '2rem', borderRadius: '12px',
        width: '90%', maxWidth: '400px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
      }}>
        <h2 style={{ margin: '0 0 1.5rem', fontSize: '1.3rem' }}>Change Password</h2>

        {success ? (
          <p style={{ color: 'green', textAlign: 'center', fontSize: '1.1rem' }}>
            ✅ Password changed!
          </p>
        ) : (
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.9rem', color: '#555' }}>
                New Password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 6 characters"
                style={{
                  width: '100%', padding: '10px 12px', border: '2px solid #e2e8f0',
                  borderRadius: '8px', fontSize: '1rem', boxSizing: 'border-box',
                }}
                disabled={loading}
              />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.9rem', color: '#555' }}>
                Confirm Password
              </label>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Re-enter password"
                style={{
                  width: '100%', padding: '10px 12px', border: '2px solid #e2e8f0',
                  borderRadius: '8px', fontSize: '1rem', boxSizing: 'border-box',
                }}
                disabled={loading}
              />
            </div>

            {error && (
              <div style={{
                background: '#fed7d7', color: '#c53030', padding: '10px 12px',
                borderRadius: '8px', fontSize: '0.9rem', marginBottom: '1rem',
                borderLeft: '4px solid #fc8181',
              }}>
                ⚠️ {error}
              </div>
            )}

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="submit"
                disabled={loading}
                style={{
                  flex: 1, padding: '12px', background: '#667eea', color: 'white',
                  border: 'none', borderRadius: '8px', fontSize: '1rem',
                  fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.6 : 1,
                }}
              >
                {loading ? 'Saving...' : 'Save'}
              </button>
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                style={{
                  flex: 1, padding: '12px', background: '#e2e8f0', color: '#4a5568',
                  border: 'none', borderRadius: '8px', fontSize: '1rem',
                  fontWeight: 600, cursor: 'pointer',
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}