import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import logo from '../../assets/logo.png';
import './Login.css';

const MODOS = [
  {
    id: 'admin',
    label: 'ADMIN',
    icon: '⚙️',
    desc: 'Painel de controle total',
    cor: '#1a1a2e',
    destaque: '#e63946'
  },
  {
    id: 'ranking',
    label: 'RANKING',
    icon: '📺',
    desc: 'Tela pública ao vivo',
    cor: '#0d1b2a',
    destaque: '#f4a261'
  },
  {
    id: 'corretor',
    label: 'CORRETOR',
    icon: '🏆',
    desc: 'App do corretor',
    cor: '#1b2838',
    destaque: '#2dc653'
  }
];

export default function Login() {
  const [modoSelecionado, setModoSelecionado] = useState(null);
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!modoSelecionado) { setErro('Selecione um modo de acesso.'); return; }
    setErro('');
    setCarregando(true);
    try {
      await login(email, senha, modoSelecionado);
      if (modoSelecionado === 'admin') navigate('/admin');
      else if (modoSelecionado === 'ranking') navigate('/ranking');
      else navigate('/corretor');
    } catch (err) {
      setErro(err.message || 'Erro ao fazer login.');
    } finally {
      setCarregando(false);
    }
  };

  const modoAtual = MODOS.find(m => m.id === modoSelecionado);

  return (
    <div className="login-root">
      {/* Partículas de fundo */}
      <div className="login-particles">
        {[...Array(20)].map((_, i) => (
          <div key={i} className="particle" style={{ '--i': i }} />
        ))}
      </div>

      <div className="login-container">
        {/* Logo */}
        <div className="login-logo-wrap">
          <img src={logo} alt="Líder Corretora" className="login-logo" />
          <h1 className="login-title">MULTIRÃO DE VENDAS LÍDER</h1>
          <span className="login-subtitle">SEXTOU!!!</span>
        </div>

        {/* Seleção de modo */}
        <div className="login-modos">
          <p className="login-modos-label">Escolha seu modo de acesso:</p>
          <div className="login-modos-grid">
            {MODOS.map(m => (
              <button
                key={m.id}
                className={`modo-btn ${modoSelecionado === m.id ? 'modo-btn--ativo' : ''}`}
                style={{ '--destaque': m.destaque }}
                onClick={() => { setModoSelecionado(m.id); setErro(''); }}
              >
                <span className="modo-icon">{m.icon}</span>
                <span className="modo-label">{m.label}</span>
                <span className="modo-desc">{m.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Formulário */}
        <form className="login-form" onSubmit={handleLogin}>
          <div className="login-field">
            <label>E-mail</label>
            <input
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>
          <div className="login-field">
            <label>Senha</label>
            <input
              type="password"
              placeholder="••••••••"
              value={senha}
              onChange={e => setSenha(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>

          {erro && <div className="login-erro">{erro}</div>}

          <button
            type="submit"
            className="login-btn-entrar"
            disabled={carregando || !modoSelecionado}
            style={{ '--destaque': modoAtual?.destaque || '#2366d1' }}
          >
            {carregando ? (
              <span className="login-spinner" />
            ) : (
              <>ENTRAR {modoAtual ? `como ${modoAtual.label}` : ''}</>
            )}
          </button>
        </form>

        <p className="login-copyright">desenvolvido por narry :-) 2026</p>
      </div>
    </div>
  );
}
