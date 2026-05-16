import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../firebase/config';
import { db } from '../../firebase/config';
import { criarUsuario, atualizarUsuario, excluirUsuario } from '../../firebase/db';

function fotoParaBase64(file) {
  return new Promise((res, rej) => {
    const reader = new FileReader();
    reader.onload = () => res(reader.result);
    reader.onerror = rej;
    reader.readAsDataURL(file);
  });
}

function AvatarCorretor({ corretor, size = 36 }) {
  if (corretor.fotoBase64) {
    return <img src={corretor.fotoBase64} alt={corretor.nome}
      style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', border: '2px solid #d1daea' }} />;
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', background: '#2366d1',
      color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontWeight: 700, fontSize: size * 0.38, flexShrink: 0
    }}>
      {corretor.nome?.charAt(0).toUpperCase()}
    </div>
  );
}

export default function AdminCorretores({ addToast }) {
  const [corretores, setCorretores] = useState([]);
  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState({ nome: '', email: '', senha: '', fotoBase64: null });
  const [loading, setLoading] = useState(false);
  const [confirmExcluir, setConfirmExcluir] = useState(null);

  useEffect(() => {
    const q = query(collection(db, 'users'), where('role', '==', 'corretor'));
    return onSnapshot(q, snap => setCorretores(snap.docs.map(d => d.data())));
  }, []);

  const abrirCriar = () => {
    setEditando(null);
    setForm({ nome: '', email: '', senha: '', fotoBase64: null });
    setModalAberto(true);
  };

  const abrirEditar = (c) => {
    setEditando(c);
    setForm({ nome: c.nome, email: c.email, senha: '', fotoBase64: c.fotoBase64 });
    setModalAberto(true);
  };

  const handleFoto = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 500000) { addToast('Foto muito grande. Use imagens até 500kb.', 'error'); return; }
    const b64 = await fotoParaBase64(file);
    setForm(f => ({ ...f, fotoBase64: b64 }));
  };

  const handleSalvar = async () => {
    if (!form.nome || !form.email) { addToast('Nome e e-mail são obrigatórios.', 'error'); return; }
    setLoading(true);
    try {
      if (editando) {
        const dados = { nome: form.nome, email: form.email };
        if (form.fotoBase64 !== editando.fotoBase64) dados.fotoBase64 = form.fotoBase64;
        await atualizarUsuario(editando.uid, dados);
        addToast('Corretor atualizado!');
      } else {
        if (!form.senha || form.senha.length < 6) { addToast('Senha deve ter pelo menos 6 caracteres.', 'error'); setLoading(false); return; }
        const cred = await createUserWithEmailAndPassword(auth, form.email, form.senha);
        await criarUsuario(cred.user.uid, {
          nome: form.nome, email: form.email,
          role: 'corretor', fotoBase64: form.fotoBase64
        });
        addToast('Corretor criado com sucesso!');
      }
      setModalAberto(false);
    } catch (err) {
      addToast(err.message || 'Erro ao salvar corretor.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleExcluir = async (uid) => {
    try {
      await excluirUsuario(uid);
      addToast('Corretor desativado.');
      setConfirmExcluir(null);
    } catch { addToast('Erro ao excluir.', 'error'); }
  };

  return (
    <div>
      <div className="admin-secao">
        <div className="admin-secao-header">
          <span className="admin-secao-titulo">👥 Corretores Cadastrados ({corretores.filter(c => c.ativo).length})</span>
          <button className="btn btn-primary" onClick={abrirCriar}>+ Novo Corretor</button>
        </div>
        <div className="admin-secao-body" style={{ padding: 0 }}>
          {corretores.length === 0 ? (
            <div className="admin-vazio">
              <div className="admin-vazio-icon">👤</div>
              <p>Nenhum corretor cadastrado ainda.</p>
            </div>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Corretor</th>
                  <th>E-mail</th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {corretores.map(c => (
                  <tr key={c.uid}>
                    <td>
                      <div className="corretor-info">
                        <AvatarCorretor corretor={c} />
                        <span style={{ fontWeight: 600 }}>{c.nome}</span>
                      </div>
                    </td>
                    <td style={{ color: '#4a5568', fontSize: '0.82rem' }}>{c.email}</td>
                    <td>
                      <span className={`badge ${c.ativo ? 'badge-ativo' : 'badge-encerrado'}`}>
                        {c.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => abrirEditar(c)}>✏️ Editar</button>
                        <button className="btn btn-danger btn-sm" onClick={() => setConfirmExcluir(c)}>🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal criar/editar */}
      {modalAberto && (
        <div className="modal-overlay" onClick={() => setModalAberto(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-titulo">{editando ? '✏️ Editar Corretor' : '➕ Novo Corretor'}</div>

            <div className="foto-upload-wrap">
              <div className="foto-preview">
                {form.fotoBase64
                  ? <img src={form.fotoBase64} alt="preview" />
                  : <span>📷</span>}
              </div>
              <div>
                <label className="btn btn-ghost btn-sm" style={{ cursor: 'pointer' }}>
                  📁 Escolher foto
                  <input type="file" accept="image/*" onChange={handleFoto} style={{ display: 'none' }} />
                </label>
                <p style={{ fontSize: '0.72rem', color: '#888', marginTop: 4 }}>JPG/PNG até 500kb</p>
              </div>
            </div>

            <div className="form-grid">
              <div className="form-field">
                <label>Nome *</label>
                <input value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} placeholder="Nome completo" />
              </div>
              <div className="form-field">
                <label>E-mail *</label>
                <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="corretor@email.com" disabled={!!editando} />
              </div>
              {!editando && (
                <div className="form-field" style={{ gridColumn: '1/-1' }}>
                  <label>Senha *</label>
                  <input type="password" value={form.senha} onChange={e => setForm(f => ({ ...f, senha: e.target.value }))} placeholder="Mínimo 6 caracteres" />
                </div>
              )}
            </div>

            <div className="modal-acoes">
              <button className="btn btn-ghost" onClick={() => setModalAberto(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={handleSalvar} disabled={loading}>
                {loading ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm excluir */}
      {confirmExcluir && (
        <div className="modal-overlay" onClick={() => setConfirmExcluir(null)}>
          <div className="modal" style={{ maxWidth: 360 }} onClick={e => e.stopPropagation()}>
            <div className="modal-titulo">🗑️ Confirmar exclusão</div>
            <p style={{ color: '#4a5568', fontSize: '0.9rem' }}>
              Deseja desativar o corretor <strong>{confirmExcluir.nome}</strong>? Ele não conseguirá mais fazer login.
            </p>
            <div className="modal-acoes">
              <button className="btn btn-ghost" onClick={() => setConfirmExcluir(null)}>Cancelar</button>
              <button className="btn btn-danger" onClick={() => handleExcluir(confirmExcluir.uid)}>Desativar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
