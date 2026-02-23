// src/components/ChangePassword.jsx
import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

export default function ChangePassword({ onClose }) {
  const [nickname, setNickname] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.user_metadata?.nickname) {
        setNickname(user.user_metadata.nickname);
      }
    });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!nickname.trim()) { setError('닉네임을 입력해주세요'); return; }
    if (newPassword && newPassword.length < 6) { setError('비밀번호는 6자 이상이어야 합니다'); return; }
    if (newPassword && newPassword !== confirm) { setError('비밀번호가 일치하지 않습니다'); return; }

    setLoading(true);
    const updates = { data: { nickname: nickname.trim() } };
    if (newPassword) updates.password = newPassword;

    const { error: updateError } = await supabase.auth.updateUser(updates);
    if (updateError) { setError(updateError.message); setLoading(false); return; }

    setSuccess(true);
    setLoading(false);
    setTimeout(() => onClose(), 1500);
  };

  const inputStyle = {
    width: '100%', padding: '10px 12px', border: '2px solid #e2e8f0',
    borderRadius: '8px', fontSize: '1rem', boxSizing: 'border-box',
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
        <h2 style={{ margin: '0 0 1.5rem', fontSize: '1.3rem' }}>설정</h2>

        {success ? (
          <p style={{ color: 'green', textAlign: 'center', fontSize: '1.1rem' }}>저장 완료!</p>
        ) : (
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '1.2rem' }}>
              <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.9rem', color: '#555', fontWeight: 600 }}>
                닉네임
              </label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="생산자 이름 (예: 홍길동)"
                style={inputStyle}
                disabled={loading}
                maxLength={20}
              />
              <p style={{ margin: '0.3rem 0 0', fontSize: '0.8rem', color: '#888' }}>더보기 생산자란에 표시됩니다</p>
            </div>

            <div style={{ borderTop: '1px solid #e2e8f0', margin: '1rem 0', paddingTop: '1rem' }}>
              <p style={{ margin: '0 0 1rem', fontSize: '0.85rem', color: '#888' }}>
                비밀번호 변경 (선택 — 바꾸지 않을 경우 비워두세요)
              </p>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.9rem', color: '#555' }}>새 비밀번호</label>
              <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                placeholder="6자 이상 (변경 시에만 입력)" style={inputStyle} disabled={loading} />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.9rem', color: '#555' }}>비밀번호 확인</label>
              <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)}
                placeholder="비밀번호 재입력" style={inputStyle} disabled={loading} />
            </div>

            {error && (
              <div style={{ background: '#fed7d7', color: '#c53030', padding: '10px 12px', borderRadius: '8px', fontSize: '0.9rem', marginBottom: '1rem', borderLeft: '4px solid #fc8181' }}>
                {error}
              </div>
            )}

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button type="submit" disabled={loading}
                style={{ flex: 1, padding: '12px', background: '#667eea', color: 'white', border: 'none', borderRadius: '8px', fontSize: '1rem', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1 }}>
                {loading ? '저장 중...' : '저장'}
              </button>
              <button type="button" onClick={onClose} disabled={loading}
                style={{ flex: 1, padding: '12px', background: '#e2e8f0', color: '#4a5568', border: 'none', borderRadius: '8px', fontSize: '1rem', fontWeight: 600, cursor: 'pointer' }}>
                취소
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}