import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { ToastContainer, useToast } from '../../hooks/useToast';
import CorretorDashboard from './CorretorDashboard';
import CorretorRegistrarVenda from './CorretorRegistrarVenda';
import CorretorDuelos from './CorretorDuelos';
import CorretorNotificacoes from './CorretorNotificacoes';
import CorretorPerfil from './CorretorPerfil';
import logo from '../../assets/logo.png';
import './Corretor.css';

const ABAS = [
  { id: 'dashboard', label: 'Início', icon: '🏠' },
  { id: 'venda', label: 'Venda', icon: '➕' },
  { id: 'duelos', label: 'Duelos', icon: '⚔️' },
  { id: 'notificacoes', label: 'Avisos', icon: '🔔', badge: true },
  { id: 'perfil', label: 'Perfil', icon: '👤' },
];

export default function CorretorPage() {
  const { perfil, logout } = useAuth();
  const navigate = useNavigate();
  const [abaAtiva, setAbaAtiva] = useState('dashboard');
  const [naoLidas, setNaoLidas] = useState(0);
  const { toasts, addToast } = useToast();

  const handleLogout = async () => { await logout(); navigate('/login'); };
  const irParaVenda = () => setAbaAtiva('venda');

  if (!perfil) return null;

  return (
    <div className="corretor-root">
      <ToastContainer toasts={toasts} />

      <header className="corretor-topbar">
        <div className="corretor-topbar-logo">
          <img src={logo} alt="Líder Corretora" />
          <div className="corretor-topbar-titulo">
            MULTIRÃO LÍDER
            <span>SEXTOU!!!</span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button className="corretor-topbar-notif" onClick={() => setAbaAtiva('notificacoes')}>
            🔔
            {naoLidas > 0 && <span className="notif-badge">{naoLidas}</span>}
          </button>
          <button className="btn btn-ghost btn-sm" onClick={handleLogout} style={{ fontSize: '0.75rem', padding: '5px 10px' }}>
            Sair
          </button>
        </div>
      </header>

      {abaAtiva === 'dashboard' && (
        <div style={{ background: 'linear-gradient(135deg, var(--azul), #4a8af4)', padding: '16px 20px', color: '#fff' }}>
          <div style={{ fontFamily: 'Barlow Condensed', fontSize: '1.2rem', fontWeight: 700 }}>
            Olá, {perfil.nome?.split(' ')[0]}! 👋
          </div>
          <div style={{ fontSize: '0.8rem', opacity: 0.85, marginTop: 2 }}>
            Bora vender hoje? 💪 A Líder conta com você!
          </div>
        </div>
      )}

      <div className="corretor-content">
        {abaAtiva === 'dashboard' && <CorretorDashboard perfil={perfil} onRegistrarVenda={irParaVenda} />}
        {abaAtiva === 'venda' && <CorretorRegistrarVenda perfil={perfil} addToast={addToast} onSucesso={() => setAbaAtiva('dashboard')} />}
        {abaAtiva === 'duelos' && <CorretorDuelos perfil={perfil} addToast={addToast} />}
        {abaAtiva === 'notificacoes' && <CorretorNotificacoes perfil={perfil} onLidas={setNaoLidas} />}
        {abaAtiva === 'perfil' && <CorretorPerfil perfil={perfil} addToast={addToast} />}
      </div>

      <nav className="corretor-bottom-nav">
        {ABAS.map(aba => (
          <button
            key={aba.id}
            className={`bottom-nav-item ${abaAtiva === aba.id ? 'ativo' : ''}`}
            onClick={() => setAbaAtiva(aba.id)}
          >
            <span className="nav-icon">{aba.icon}</span>
            {aba.label}
            {aba.badge && naoLidas > 0 && <span className="bottom-nav-badge">{naoLidas}</span>}
          </button>
        ))}
      </nav>
    </div>
  );
}
