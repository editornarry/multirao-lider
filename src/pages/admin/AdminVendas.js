import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, query, where, orderBy } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { registrarVenda, editarVenda, excluirVenda, listarCorretores } from '../../firebase/db';


export default function AdminVendas({ eventoAtivo, addToast }) {
  const [vendas, setVendas] = useState([]);
  const [corretores, setCorretores] = useState([]);
  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState({ corretorId: '', vidas: '', valor: '', observacao: '' });
  const [loading, setLoading] = useState(false);
  const [confirmExcluir, setConfirmExcluir] = useState(null);
  

  useEffect(() => {
    if (!eventoAtivo?.id) return;
    const q = query(collection(db, 'vendas'), where('eventoId', '==', eventoAtivo.id), orderBy('criadoEm', 'desc'));
    return onSnapshot(q, snap => setVendas(snap.docs.map(d => d.data())));
  }, [eventoAtivo?.id]);

  useEffect(() => {
    listarCorretores().then(setCorretores);
  }, []);

  const abrirCriar = () => {
    setEditando(null);
    setForm({ corretorId: '', vidas: '', valor: '', observacao: '' });
    setModalAberto(true);
  };

  const abrirEditar = (v) => {
    setEditando(v);
    setForm({ corretorId: v.corretorId, vidas: v.vidas, valor: v.valor, observacao: v.observacao || '' });
    setModalAberto(true);
  };

  const handleSalvar = async () => {
    if (!form.corretorId || !form.vidas || !form.valor) { addToast('Preencha todos os campos obrigatÃ³rios.', 'error'); return; }
    setLoading(true);
    try {
      const corretor = corretores.find(c => c.uid === form.corretorId);
      if (editando) {
        await editarVenda(editando.id, {
          vidas: Number(form.vidas), valor: Number(form.valor), observacao: form.observacao
        });
        addToast('Venda atualizada!');
      } else {
        await registrarVenda({
          eventoId: eventoAtivo.id,
          corretorId: form.corretorId,
          corretorNome: corretor?.nome || '',
          vidas: Number(form.vidas),
          valor: Number(form.valor),
          observacao: form.observacao,
          registradoPorAdmin: true
        });
        addToast('Venda registrada!');
      }
      setModalAberto(false);
    } catch (err) {
      addToast('Erro ao salvar venda.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleExcluir = async (id) => {
    try {
      await excluirVenda(id);
      addToast('Venda excluÃ­da.');
      setConfirmExcluir(null);
    } catch { addToast('Erro ao excluir.', 'error'); }
  };

  if (!eventoAtivo) return (
    <div className="admin-secao">
      <div className="admin-secao-body">
        <div className="admin-vazio">
          <div className="admin-vazio-icon">ðŸ“‹</div>
          <p>Nenhum evento ativo. Crie um evento primeiro na aba Evento.</p>
        </div>
      </div>
    </div>
  );

  return (
    <div>
      <div className="admin-secao">
        <div className="admin-secao-header">
          <span className="admin-secao-titulo">ðŸ“‹ Vendas do Evento ({vendas.length})</span>
          <button className="btn btn-primary" onClick={abrirCriar}>+ Registrar Venda</button>
        </div>
        <div className="admin-secao-body" style={{ padding: 0 }}>
          {vendas.length === 0 ? (
            <div className="admin-vazio">
              <div className="admin-vazio-icon">ðŸ“</div>
              <p>Nenhuma venda registrada ainda.</p>
            </div>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Corretor</th>
                  <th>Vidas</th>
                  <th>Valor</th>
                  <th>ObservaÃ§Ã£o</th>
                  <th>HorÃ¡rio</th>
                  <th>AÃ§Ãµes</th>
                </tr>
              </thead>
              <tbody>
                {vendas.map(v => (
                  <tr key={v.id}>
                    <td style={{ fontWeight: 600 }}>{v.corretorNome}</td>
                    <td>
                      <span style={{ background: '#eef3ff', color: '#2366d1', padding: '3px 10px', borderRadius: 20, fontWeight: 700, fontSize: '0.82rem' }}>
                        ðŸ«€ {v.vidas}
                      </span>
                    </td>
                    <td style={{ fontWeight: 700, color: '#2dc653' }}>
                      {Number(v.valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </td>
                    <td style={{ color: '#4a5568', fontSize: '0.82rem' }}>{v.observacao || 'â€”'}</td>
                    <td style={{ fontSize: '0.78rem', color: '#888' }}>
                      {v.criadoEm?.toDate?.().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) || 'â€”'}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => abrirEditar(v)}>âœï¸</button>
                        <button className="btn btn-danger btn-sm" onClick={() => setConfirmExcluir(v)}>ðŸ—‘ï¸</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {modalAberto && (
        <div className="modal-overlay" onClick={() => setModalAberto(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-titulo">{editando ? 'âœï¸ Editar Venda' : 'âž• Registrar Venda'}</div>
            <div className="form-grid">
              <div className="form-field" style={{ gridColumn: '1/-1' }}>
                <label>Corretor *</label>
                <select value={form.corretorId} onChange={e => setForm(f => ({ ...f, corretorId: e.target.value }))} disabled={!!editando}>
                  <option value="">Selecione...</option>
                  {corretores.map(c => <option key={c.uid} value={c.uid}>{c.nome}</option>)}
                </select>
              </div>
              <div className="form-field">
                <label>NÂº de Vidas *</label>
                <input type="number" min="1" value={form.vidas} onChange={e => setForm(f => ({ ...f, vidas: e.target.value }))} placeholder="Ex: 3" />
              </div>
              <div className="form-field">
                <label>Valor R$ *</label>
                <input type="number" min="0" step="0.01" value={form.valor} onChange={e => setForm(f => ({ ...f, valor: e.target.value }))} placeholder="Ex: 850.00" />
              </div>
              <div className="form-field" style={{ gridColumn: '1/-1' }}>
                <label>ObservaÃ§Ã£o</label>
                <input value={form.observacao} onChange={e => setForm(f => ({ ...f, observacao: e.target.value }))} placeholder="Opcional..." />
              </div>
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

      {confirmExcluir && (
        <div className="modal-overlay" onClick={() => setConfirmExcluir(null)}>
          <div className="modal" style={{ maxWidth: 360 }} onClick={e => e.stopPropagation()}>
            <div className="modal-titulo">ðŸ—‘ï¸ Confirmar exclusÃ£o</div>
            <p style={{ color: '#4a5568', fontSize: '0.9rem' }}>
              Excluir a venda de <strong>{confirmExcluir.corretorNome}</strong> ({confirmExcluir.vidas} vidas â€” {Number(confirmExcluir.valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })})?
            </p>
            <div className="modal-acoes">
              <button className="btn btn-ghost" onClick={() => setConfirmExcluir(null)}>Cancelar</button>
              <button className="btn btn-danger" onClick={() => handleExcluir(confirmExcluir.id)}>Excluir</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

