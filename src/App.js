import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import RotaProtegida from './components/shared/RotaProtegida';
import Login from './pages/login/Login';
import AdminPage from './pages/admin/AdminPage';
import RankingPage from './pages/ranking/RankingPage';
import CorretorPage from './pages/corretor/CorretorPage';
import './App.css';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/admin" element={
            <RotaProtegida modoPermitido="admin"><AdminPage /></RotaProtegida>
          } />
          <Route path="/ranking" element={
            <RotaProtegida modoPermitido="ranking"><RankingPage /></RotaProtegida>
          } />
          <Route path="/corretor" element={
            <RotaProtegida modoPermitido="corretor"><CorretorPage /></RotaProtegida>
          } />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
