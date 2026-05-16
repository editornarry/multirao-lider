import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, query, where, orderBy } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { aprovarDuelo, recusarDuelo, encerrarDuelo, criarDuelo, enviarNotificacao, listarCorretores } from '../../firebase/db';
import { Timestamp } from 'firebase/firestore';

export default function AdminDuelos({ eventoAtivo, addToast }) {
  const [duelos, setDuelos] = useState([]);
  const [corretores, setCorretores] = useState([]);
  const [modalCriar, setModalCriar] = useState(false);
  const [form, setForm] = useState({ desafianteId: '', desafiadoId: '', tipo: 'vidas', meta: '', prazoHora: '', duracaoMinutos: '', usarPrazo: 'hora' });
  const [loading, setLoading] = useState(false);
  const [confirmEncerrar, setConfirmEncerrar] = useState(null);
  const [vencedor, setVencedor] = useState('');

  useEffect(() => {
    if (!eventoAtivo?.id) return;
    const q = query(collection(db, 'duelos'), where('eventoId', '==', eventoAtivo.id), orderBy('criadoEm', 'desc'));
    return onSnapshot(q, snap => setDuelos(snap.docs.map(d => d.data())));
  }, [eventoAtivo?.id]);

  useEffect(() => { listarCorretores().then(setCorretores); }, []);

  const handleAprovar = async (d) => {
    try {
      await aprovarDuelo(d.id);
      await enviarNotificacao(d.desafiante.uid, { tipo: 'duelo_aprovado', titulo: '✅ Duelo aprovado!', corpo: `Seu duelo contra ${d.desafiado.nome} foi aprovado! Boa sorte!`, dueloId: d.id });
      await enviarNotificacao(d.desafiado.uid, { tipo: 'duelo_aprovado', titulo: '⚔️ Duelo iniciado!', corpo: `${d.desafiante.nome} te desafiou e o admin aprovou! Bora!`, dueloId: d.id });
      addToast('Duelo aprovado e corretores notificados!');
    } catch { addToast('Erro ao aprovar duelo.', 'error'); }
  };

  const handleRecusar = async (d) => {
    try {
      await recusarDuelo(d.id);
      await enviarNotificacao(d.desafiante.uid, { tipo: 'duelo_recusado', titulo: '❌ Duelo recusado', corpo: `Seu duelo contra ${d.desafiado.nome} foi recusado pelo admin.`, dueloId: d.id });
      await enviarNotificacao(d.desafiado.uid, { tipo: 'duelo_recusado', titulo: '❌ Duelo recusado', corpo: `O duelo proposto por ${d.desafiante.nome} foi recusado pelo admin.`, dueloId: d.id });
      addToast('Duelo recusado.');
    } catch { addToast('Erro ao recusar duelo.', 'error'); }
  };

  const handleEncerrar = async () => {
    if (!vencedor) { addToast('Selecione o vencedor.', 'error'); return; }
    try {
      const d = confirmEncerrar;
      await encerrarDuelo(d.id, vencedor);
      const venc = vencedor === d.desafiante.uid ? d.desafiante.nome : d.desafiado.nome;
      await enviarNotificacao(d.desafiante.uid, { tipo: 'duelo_encerrado', titulo: '🏁 Duelo encerrado', corpo: `Vencedor: ${venc}!`, dueloId: d.id });
      await enviarNotificacao(d.desafiado.uid, { tipo: 'duelo_encerrado', titulo: '🏁 Duelo encerrado', corpo: `Vencedor: ${venc}!`, dueloId: d.id });
      addToast('Duelo encerrado!');
      setConfirmEncerrar(null);
      setVencedor('');
    } catch { addToast('Erro ao encerrar duelo.', 'error'); }
  };

  const handleCriarDuelo = async () => {
    if (!form.desafianteId || !form.desafiadoId || !form.meta) { addToast('Preencha todos os campos.', 'error'); return; }
    if (form.desafianteId === form.desafiadoId) { addToast('Escolha corretores diferentes.', 'error'); return; }
    setLoading(true);
    try {
      const c1 = corretores.find(c => c.uid === form.desafianteId);
      const c2 = corretores.find(c => c.uid === form.desafiadoId);
      let prazo = null;
      if (form.usarPrazo === 'hora' && form.prazoHora) {
        const [h, m] = form.prazoHora.split(':');
        const d = new Date();
        d.setHours(Number(h), Number(m), 0);
        prazo = Timestamp.fromDate(d);
      }
      await criarDuelo({
        eventoId: eventoAtivo.id,
        desafiante: { uid: c1.uid, nome: c1.nome, fotoBase64: c1.fotoBase64 || null },
        desafiado: { uid: c2.uid, nome: c2.nome, fotoBase64: c2.fotoBase64 || null },
        tipo: form.tipo, meta: Number(form.meta),
        prazo, duracaoMinutos: form.usarPrazo === 'duracao' ? Number(form.duracaoMinutos) : null,
        criadoPor: 'admin', status: 'ativo', iniciadoEm: Timestamp.now()
      });
      await enviarNotificacao(c1.uid, { tipo: 'duelo_aprovado', titulo: '⚔️ Admin criou um duelo!', corpo: `Você está duelando contra ${c2.nome}!`, dueloId: null });
      await enviarNotificacao(c2.uid, { tipo: 'duelo_aprovado', titulo: '⚔️ Admin criou um duelo!', corpo: `Você está duelando contra ${c1.nome}!`, dueloId: null });
      addToast('Duelo criado e iniciado!');
      setModalCriar(false);
    } catch (err) { addToast('Erro ao criar duelo: ' + err.message, 'error'); }
    finally { setLoading(false); }
  };

  const pendentes = duelos.filter(d => d.status === 'pendente');
  const ativos = duelos.filter(d => d.status === 'ativo');
  const encerrados = duelos.filter(d => d.status === 'encerrado' || d.status === 'recusado');

  const statusLabel = { pendente: 'badge-pendente', ativo: 'badge-ativo', encerrado: 'badge-encerrado', recusado: 'badge-recusado' };

  if (!eventoAtivo) return (
    <div className="admin-secao"><div className="admin-secao-body">
      <div className="admin-vazio"><div className="admin-vazio-icon">⚔️</div><p>Nenhum evento ativo.</p></div>
    </div></div>
  );

  return (
    <div>
      {/* Pendentes */}
      {pendentes.length > 0 && (
        <div className="admin-secao" style={{ borderColor: '#f4a261', borderWidth: 2 }}>
          <div className="admin-secao-header" style={{ background: '#fff8f0' }}>
            <span className="admin-secao-titulo">⏳ Aguardando Aprovação ({pendentes.length})</span>
          </div>
          <div className="admin-secao-body">
            {pendentes.map(d => (
              <div key={d.id} className="duelo-card">
                <span className="duelo-vs">VS</span>
                <div className="duelo-info">
                  <div className="duelo-nomes">{d.desafiante.nome} × {d.desafiado.nome}</div>
                  <div className="duelo-meta">
                    {d.tipo === 'vidas' ? `${d.meta} vidas` : Number(d.meta).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    {d.prazo && ` até ${new Date(d.prazo.toDate()).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`}
                  </div>
                </div>
                <div className="duelo-acoes">
                  <button className="btn btn-success btn-sm" onClick={() => handleAprovar(d)}>✅ Aprovar</button>
                  <button className="btn btn-danger btn-sm" onClick={() => handleRecusar(d)}>❌ Recusar</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Ativos */}
      <div className="admin-secao">
        <div className="admin-secao-header">
          <span className="admin-secao-titulo">⚔️ Duelos Ativos ({ativos.length})</span>
          <button className="btn btn-primary" onClick={() => setModalCriar(true)}>+ Criar Duelo</button>
        </div>
        <div className="admin-secao-body">
          {ativos.length === 0 ? (
            <div className="admin-vazio"><p>Nenhum duelo ativo no momento.</p></div>
          ) : ativos.map(d => (
            <div key={d.id} className="duelo-card">
              <span className="duelo-vs" style={{ color: '#e63946' }}>🔥</span>
              <div className="duelo-info">
                <div className="duelo-nomes">{d.desafiante.nome} × {d.desafiado.nome}</div>
                <div className="duelo-meta">
                  Meta: {d.tipo === 'vidas' ? `${d.meta} vidas` : Number(d.meta).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  {d.prazo && ` • até ${new Date(d.prazo.toDate()).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`}
                </div>
              </div>
              <div className="duelo-acoes">
                <span className="badge badge-ativo">● AO VIVO</span>
                <button className="btn btn-warning btn-sm" onClick={() => { setConfirmEncerrar(d); setVencedor(''); }}>🏁 Encerrar</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Histórico */}
      {encerrados.length > 0 && (
        <div className="admin-secao">
          <div className="admin-secao-header">
            <span className="admin-secao-titulo">📜 Histórico ({encerrados.length})</span>
          </div>
          <div className="admin-secao-body" style={{ padding: 0 }}>
            <table className="admin-table">
              <thead><tr><th>Duelo</th><th>Meta</th><th>Vencedor</th><th>Status</th></tr></thead>
              <tbody>
                {encerrados.map(d => {
                  const venc = d.vencedor === d.desafiante.uid ? d.desafiante.nome : d.vencedor === d.desafiado.uid ? d.desafiado.nome : '—';
                  return (
                    <tr key={d.id}>
                      <td style={{ fontWeight: 600 }}>{d.desafiante.nome} × {d.desafiado.nome}</td>
                      <td>{d.tipo === 'vidas' ? `${d.meta} vidas` : Number(d.meta).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                      <td>{d.status === 'encerrado' ? <strong>🏆 {venc}</strong> : '—'}</td>
                      <td><span className={`badge ${statusLabel[d.status]}`}>{d.status}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal criar duelo */}
      {modalCriar && (
        <div className="modal-overlay" onClick={() => setModalCriar(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-titulo">⚔️ Criar Duelo Manual</div>
            <div className="form-grid">
              <div className="form-field">
                <label>Corretor A (Desafiante)</label>
                <select value={form.desafianteId} onChange={e => setForm(f => ({ ...f, desafianteId: e.target.value }))}>
                  <option value="">Selecione...</option>
                  {corretores.map(c => <option key={c.uid} value={c.uid}>{c.nome}</option>)}
                </select>
              </div>
              <div className="form-field">
                <label>Corretor B (Desafiado)</label>
                <select value={form.desafiadoId} onChange={e => setForm(f => ({ ...f, desafiadoId: e.target.value }))}>
                  <option value="">Selecione...</option>
                  {corretores.map(c => <option key={c.uid} value={c.uid}>{c.nome}</option>)}
                </select>
              </div>
              <div className="form-field">
                <label>Tipo de Meta</label>
                <select value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))}>
                  <option value="vidas">🫀 Vidas</option>
                  <option value="valor">💰 Valor R$</option>
                </select>
              </div>
              <div className="form-field">
                <label>Meta ({form.tipo === 'vidas' ? 'nº de vidas' : 'valor R$'})</label>
                <input type="number" value={form.meta} onChange={e => setForm(f => ({ ...f, meta: e.target.value }))} placeholder={form.tipo === 'vidas' ? 'Ex: 5' : 'Ex: 1500'} />
              </div>
              <div className="form-field" style={{ gridColumn: '1/-1' }}>
                <label>Prazo</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <select value={form.usarPrazo} onChange={e => setForm(f => ({ ...f, usarPrazo: e.target.value }))} style={{ flex: 1 }}>
                    <option value="hora">Até horário fixo</option>
                    <option value="duracao">Duração em minutos</option>
                  </select>
                  {form.usarPrazo === 'hora'
                    ? <input type="time" value={form.prazoHora} onChange={e => setForm(f => ({ ...f, prazoHora: e.target.value }))} style={{ flex: 1 }} />
                    : <input type="number" value={form.duracaoMinutos} onChange={e => setForm(f => ({ ...f, duracaoMinutos: e.target.value }))} placeholder="Ex: 60" style={{ flex: 1 }} />
                  }
                </div>
              </div>
            </div>
            <div className="modal-acoes">
              <button className="btn btn-ghost" onClick={() => setModalCriar(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={handleCriarDuelo} disabled={loading}>
                {loading ? 'Criando...' : '⚔️ Iniciar Duelo'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal encerrar */}
      {confirmEncerrar && (
        <div className="modal-overlay" onClick={() => setConfirmEncerrar(null)}>
          <div className="modal" style={{ maxWidth: 380 }} onClick={e => e.stopPropagation()}>
            <div className="modal-titulo">🏁 Encerrar Duelo</div>
            <p style={{ color: '#4a5568', fontSize: '0.9rem', marginBottom: 16 }}>
              {confirmEncerrar.desafiante.nome} × {confirmEncerrar.desafiado.nome}
            </p>
            <div className="form-field">
              <label>Vencedor</label>
              <select value={vencedor} onChange={e => setVencedor(e.target.value)}>
                <option value="">Selecione o vencedor...</option>
                <option value={confirmEncerrar.desafiante.uid}>{confirmEncerrar.desafiante.nome}</option>
                <option value={confirmEncerrar.desafiado.uid}>{confirmEncerrar.desafiado.nome}</option>
              </select>
            </div>
            <div className="modal-acoes">
              <button className="btn btn-ghost" onClick={() => setConfirmEncerrar(null)}>Cancelar</button>
              <button className="btn btn-warning" onClick={handleEncerrar}>🏁 Confirmar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
