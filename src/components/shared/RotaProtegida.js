import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export default function RotaProtegida({ children, modoPermitido }) {
  const { user, modo, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#050a14',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#2366d1',
        fontFamily: 'sans-serif',
        fontSize: '1.2rem',
        letterSpacing: '0.2em'
      }}>
        CARREGANDO...
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  if (modoPermitido && modo !== modoPermitido) {
    if (modo === 'admin') return <Navigate to="/admin" replace />;
    if (modo === 'ranking') return <Navigate to="/ranking" replace />;
    if (modo === 'corretor') return <Navigate to="/corretor" replace />;
    return <Navigate to="/login" replace />;
  }

  return children;
}
