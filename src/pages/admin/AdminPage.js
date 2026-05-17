import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { buscarEventoAtivo, ouvirDuelosPendentes } from '../../firebase/db';
import { ToastContainer, useToast } from '../../hooks/useToast';
import AdminDashboard from './AdminDashboard';
import AdminCorretores from './AdminCorretores';
import AdminVendas from './AdminVendas';
import AdminDuelos from './AdminDuelos';
import AdminEvento from './AdminEvento';
import logo from '../../assets/logo.png';
import './Admin.css';

const ABAS = [
  { id: 'dashboard', label: 'Dashboard', icon: '📊' },
  { id: 'corretores', label: 'Corretores', icon: '👥' },
  { id: 'vendas', label: 'Vendas', icon: '📋' },
  { id: 'duelos', label: 'Duelos', icon: '⚔️', badge: true },
  { id: 'evento', label: 'Evento', icon: '🎯' },
];

export default function AdminPage() {
  const { perfil, logout } = useAuth();
  const navigate = useNavigate();
  const [abaAtiva, setAbaAtiva] = useState('dashboard');
  const [eventoAtivo, setEventoAtivo] = useState(null);
  const [duelosPendentes, setDuelosPendentes] = useState([]);
  const { toasts, addToast } = useToast();

  useEffect(() => {
    buscarEventoAtivo().then(setEventoAtivo);
    const unsub = ouvirDuelosPendentes(setDuelosPendentes);
    return unsub;
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const inicialNome = perfil?.nome?.charAt(0).toUpperCase() || 'A';

  return (
    <div className="admin-root">
      <ToastContainer toasts={toasts} />

      <aside className="admin-sidebar">
        <div className="admin-sidebar-logo">
          <img src={logo} alt="Líder Corretora" />
          <div className="admin-sidebar-logo-text">
            <h2>MULTIRÃO LÍDER</h2>
            <span>SEXTOU!!!</span>
          </div>
        </div>

        <nav className="admin-nav">
          {ABAS.map(aba => (
            <button
              key={aba.id}
              className={`admin-nav-item ${abaAtiva === aba.id ? 'ativo' : ''}`}
              onClick={() => setAbaAtiva(aba.id)}
            >
              <span className="nav-icon">{aba.icon}</span>
              {aba.label}
              {aba.badge && duelosPendentes.length > 0 && (
                <span className="admin-nav-badge">{duelosPendentes.length}</span>
              )}
            </button>
          ))}
        </nav>

        <div className="admin-sidebar-footer">
          <div className="admin-user-info">
            <div className="admin-user-avatar">{inicialNome}</div>
            <div>
              <div className="admin-user-nome">{perfil?.nome}</div>
              <div className="admin-user-role">Administrador</div>
            </div>
          </div>
          <button className="admin-btn-sair" onClick={handleLogout}>
            🚪 Sair
          </button>
        </div>
      </aside>

      <main className="admin-main">
        <div className="admin-topbar">
          <span className="admin-topbar-title">
            {ABAS.find(a => a.id === abaAtiva)?.icon} {ABAS.find(a => a.id === abaAtiva)?.label}
          </span>
          <div className="admin-topbar-right">
            <div className={`admin-evento-badge ${eventoAtivo ? 'ativo' : 'inativo'}`}>
              <span className="dot" />
              {eventoAtivo ? `Evento ativo • ${eventoAtivo.inicio}–${eventoAtivo.fim}` : 'Sem evento ativo'}
            </div>
          </div>
        </div>

        <div className="admin-content">
          {abaAtiva === 'dashboard' && <AdminDashboard eventoAtivo={eventoAtivo} />}
          {abaAtiva === 'corretores' && <AdminCorretores addToast={addToast} />}
          {abaAtiva === 'vendas' && <AdminVendas eventoAtivo={eventoAtivo} addToast={addToast} />}
          {abaAtiva === 'duelos' && <AdminDuelos eventoAtivo={eventoAtivo} addToast={addToast} />}
          {abaAtiva === 'evento' && <AdminEvento eventoAtivo={eventoAtivo} setEventoAtivo={setEventoAtivo} addToast={addToast} />}
        </div>
      </main>
    </div>
  );
}

'@ -Encoding UTF8
Write-Host 'AdminPage.js reescrito com sucesso!'
