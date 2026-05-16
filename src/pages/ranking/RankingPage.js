import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function RankingPage() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const handleLogout = async () => { await logout(); navigate('/login'); };

  return (
    <div style={{ minHeight: '100vh', background: '#050a14', color: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif', gap: 16 }}>
      <h1 style={{ fontSize: '2rem', color: '#f4a261' }}>📺 TELA PÚBLICA — RANKING</h1>
      <p style={{ color: 'rgba(255,255,255,0.5)' }}>Em construção... A tela mais bonita do sistema!</p>
      <button onClick={handleLogout} style={{ background: '#f4a261', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: 8, cursor: 'pointer', fontSize: '0.9rem' }}>Sair</button>
    </div>
  );
}
