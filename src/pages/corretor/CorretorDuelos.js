import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, query, where, orderBy } from 'firebase/firestore';
import { Timestamp } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { criarDuelo, enviarMensagem, ouvirMensagensDuelo, listarCorretores, buscarEventoAtivo, enviarNotificacao } from '../../firebase/db';

function ContadorRegressivo({ prazo }) {
  const [restante, setRestante] = useState('');
  useEffect(() => {
    if (!prazo) return;
    const tick = () => {
      const diff = prazo.toDate() - new Date();
      if (diff <= 0) { setRestante('Encerrado'); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setRestante(`${h > 0 ? h + 'h ' : ''}${m}m ${s}s`);
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [prazo]);
  return <span style={{ fontFamily: 'Bebas Neue', color: 'var(--vermelho)', fontSize: '1rem', letterSpacing: '0.05em' }}>â± {restante}</span>;
}

function ChatDuelo({ dueloId, perfil }) {
  const [mensagens, setMensagens] = useState([]);
  const [texto, setTexto] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const unsub = ouvirMensagensDuelo(dueloId, setMensagens);
    return unsub;
  }, [dueloId]);

  const handleEnviar = async () => {
    if (!texto.trim()) return;
    setLoading(true);
    try {
      await enviarMensagem({ dueloId, autorId: perfil.uid, autorNome: perfil.nome, texto: texto.trim() });
      setTexto('');
    } catch { }
    finally { setLoading(false); }
  };

  return (
    <div style={{ marginTop: 12, borderTop: '1px solid var(--borda)', paddingTop: 12 }}>
      <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--texto2)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
        ðŸ”¥ ProvocaÃ§Ãµes ao vivo
      </div>
      <div style={{ maxHeight: 140, overflowY: 'auto', marginBottom: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
        {mensagens.length === 0
          ? <p style={{ fontSize: '0.78rem', color: 'var(--texto2)', textAlign: 'center', padding: '8px 0' }}>Nenhuma provocaÃ§Ã£o ainda... ðŸ˜´</p>
          : mensagens.map(m => (
            <div key={m.id} style={{
              background: m.autorId === perfil.uid ? 'var(--azul-bg)' : '#fff',
              border: '1px solid var(--borda)',
              borderRadius: 8,
              padding: '6px 10px',
              fontSize: '0.82rem',
              alignSelf: m.autorId === perfil.uid ? 'flex-end' : 'flex-start',
              maxWidth: '85%'
            }}>
              <span style={{ fontWeight: 700, color: 'var(--azul)', fontSize: '0.72rem' }}>{m.autorNome}: </span>
              {m.texto}
            </div>
          ))
        }
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          value={texto}
          onChange={e => setTexto(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleEnviar()}
          placeholder="Manda uma provocaÃ§Ã£o... ðŸ˜ˆ"
          style={{
            flex: 1, padding: '9px 12px', border: '1px solid var(--borda)',
            borderRadius: 10, fontSize: '0.85rem', fontFamily: 'Barlow, sans-serif', outline: 'none'
          }}
          maxLength={120}
        />
        <button className="btn btn-danger btn-sm" onClick={handleEnviar} disabled={loading || !texto.trim()}>
          ðŸ”¥
        </button>
      </div>
    </div>
  );
}

export default function CorretorDuelos({ perfil, addToast }) {
  const [duelos, setDuelos] = useState([]);
  const [corretores, setCorretores] = useState([]);
  const [eventoAtivo, setEventoAtivo] = useState(null);
  const [modalPropor, setModalPropor] = useState(false);
  const [form, setForm] = useState({ desafiadoId: '', tipo: 'vidas', meta: '', usarPrazo: 'hora', prazoHora: '', duracaoMinutos: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    buscarEventoAtivo().then(setEventoAtivo);
    listarCorretores().then(c => setCorretores(c.filter(x => x.uid !== perfil.uid)));
  }, [perfil.uid]);

  useEffect(() => {
    if (!eventoAtivo?.id) return;
    const q = query(
      collection(db, 'duelos'),
      where('eventoId', '==', eventoAtivo.id),
      orderBy('criadoEm', 'desc')
    );
    return onSnapshot(q, snap => {
      const todos = snap.docs.map(d => d.data());
      setDuelos(todos.filter(d => d.desafiante.uid === perfil.uid || d.desafiado.uid === perfil.uid));
    });
  }, [eventoAtivo?.id, perfil.uid]);

  const handlePropor = async () => {
    if (!form.desafiadoId || !form.meta) { addToast('Preencha todos os campos.', 'error'); return; }
    setLoading(true);
    try {
      const adversario = corretores.find(c => c.uid === form.desafiadoId);
      let prazo = null;
      if (form.usarPrazo === 'hora' && form.prazoHora) {
        const [h, m] = form.prazoHora.split(':');
        const d = new Date(); d.setHours(Number(h), Number(m), 0);
        prazo = Timestamp.fromDate(d);
      }
      const dueloId = await criarDuelo({
        eventoId: eventoAtivo.id,
        desafiante: { uid: perfil.uid, nome: perfil.nome, fotoBase64: perfil.fotoBase64 || null },
        desafiado: { uid: adversario.uid, nome: adversario.nome, fotoBase64: adversario.fotoBase64 || null },
        tipo: form.tipo, meta: Number(form.meta),
        prazo, duracaoMinutos: form.usarPrazo === 'duracao' ? Number(form.duracaoMinutos) : null,
        criadoPor: 'corretor'
      });
      await enviarNotificacao(adversario.uid, {
        tipo: 'duelo_proposto',
        titulo: 'âš”ï¸ VocÃª foi desafiado!',
        corpo: `${perfil.nome} quer duelar com vocÃª! Meta: ${form.tipo === 'vidas' ? form.meta + ' vidas' : 'R$ ' + form.meta}`,
        dueloId
      });
      addToast('Duelo proposto! Aguarde o admin aprovar. ðŸ¥Š');
      setModalPropor(false);
      setForm({ desafiadoId: '', tipo: 'vidas', meta: '', usarPrazo: 'hora', prazoHora: '', duracaoMinutos: '' });
    } catch (err) { addToast('Erro ao propor duelo: ' + err.message, 'error'); }
    finally { setLoading(false); }
  };

  const ativos = duelos.filter(d => d.status === 'ativo');
  const pendentes = duelos.filter(d => d.status === 'pendente');
  const historico = duelos.filter(d => d.status === 'encerrado' || d.status === 'recusado');

  const adversario = (d) => d.desafiante.uid === perfil.uid ? d.desafiado : d.desafiante;

  return (
    <div>
      {/* BotÃ£o propor */}
      {eventoAtivo && (
        <button className="btn btn-danger btn-lg btn-block" style={{ marginBottom: 14 }} onClick={() => setModalPropor(true)}>
          âš”ï¸ Propor Duelo
        </button>
      )}

      {/* Ativos */}
      {ativos.length > 0 && (
        <>
          <div className="secao-titulo">ðŸ”¥ Duelos Ativos</div>
          {ativos.map(d => (
            <div key={d.id} className="duelo-card ativo">
              <div className="duelo-adversario">
                <span className="duelo-vs-mini">VS</span>
                <div>
                  <div className="duelo-nome">{adversario(d).nome}</div>
                  <div className="duelo-meta">
                    Meta: {d.tipo === 'vidas' ? `${d.meta} vidas` : Number(d.meta).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    {d.prazo && <> Â· <ContadorRegressivo prazo={d.prazo} /></>}
                  </div>
                </div>
              </div>
              <ChatDuelo dueloId={d.id} perfil={perfil} />
            </div>
          ))}
        </>
      )}

      {/* Pendentes */}
      {pendentes.length > 0 && (
        <>
          <div className="secao-titulo">â³ Aguardando AprovaÃ§Ã£o</div>
          {pendentes.map(d => (
            <div key={d.id} className="duelo-card">
              <div className="duelo-adversario">
                <span className="duelo-vs-mini" style={{ color: 'var(--laranja)' }}>VS</span>
                <div>
                  <div className="duelo-nome">{adversario(d).nome}</div>
                  <div className="duelo-meta">
                    Meta: {d.tipo === 'vidas' ? `${d.meta} vidas` : Number(d.meta).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </div>
                </div>
              </div>
              <span className="tag tag-laranja" style={{ marginTop: 4 }}>â³ Aguardando admin</span>
            </div>
          ))}
        </>
      )}

      {/* Sem duelos */}
      {ativos.length === 0 && pendentes.length === 0 && (
        <div className="c-card" style={{ textAlign: 'center', padding: '32px 20px' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 10 }}>âš”ï¸</div>
          <p style={{ color: 'var(--texto2)', fontSize: '0.9rem' }}>Nenhum duelo ativo.<br />Desafie alguÃ©m e esquenta a sala! ðŸ”¥</p>
        </div>
      )}

      {/* HistÃ³rico */}
      {historico.length > 0 && (
        <>
          <div className="secao-titulo" style={{ marginTop: 8 }}>ðŸ“œ HistÃ³rico</div>
          {historico.map(d => {
            const venceu = d.vencedor === perfil.uid;
            const adv = adversario(d);
            return (
              <div key={d.id} className="duelo-card" style={{ opacity: 0.85 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: '1.4rem' }}>{d.status === 'recusado' ? 'âŒ' : venceu ? 'ðŸ†' : 'ðŸ’€'}</span>
                  <div style={{ flex: 1 }}>
                    <div className="duelo-nome">vs {adv.nome}</div>
                    <div className="duelo-meta">
                      {d.tipo === 'vidas' ? `${d.meta} vidas` : Number(d.meta).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </div>
                  </div>
                  <span className={`tag ${d.status === 'recusado' ? 'tag-vermelho' : venceu ? 'tag-verde' : 'tag-laranja'}`}>
                    {d.status === 'recusado' ? 'Recusado' : venceu ? 'VitÃ³ria!' : 'Derrota'}
                  </span>
                </div>
              </div>
            );
          })}
        </>
      )}

      {/* Modal propor duelo */}
      {modalPropor && (
        <div className="modal-overlay" onClick={() => setModalPropor(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-handle" />
            <div className="modal-titulo">âš”ï¸ Propor Duelo</div>

            <div className="form-field">
              <label>Desafiar quem?</label>
              <select value={form.desafiadoId} onChange={e => setForm(f => ({ ...f, desafiadoId: e.target.value }))}>
                <option value="">Escolha o adversÃ¡rio...</option>
                {corretores.map(c => <option key={c.uid} value={c.uid}>{c.nome}</option>)}
              </select>
            </div>

            <div className="form-field">
              <label>Tipo de Meta</label>
              <select value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))}>
                <option value="vidas">ðŸ«€ Vidas</option>
                <option value="valor">ðŸ’° Valor R$</option>
              </select>
            </div>

            <div className="form-field">
              <label>Meta ({form.tipo === 'vidas' ? 'nÂº de vidas' : 'R$'})</label>
              <input type="number" value={form.meta} onChange={e => setForm(f => ({ ...f, meta: e.target.value }))}
                placeholder={form.tipo === 'vidas' ? 'Ex: 5' : 'Ex: 1500'} inputMode="numeric" />
            </div>

            <div className="form-field">
              <label>Prazo</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <select value={form.usarPrazo} onChange={e => setForm(f => ({ ...f, usarPrazo: e.target.value }))} style={{ flex: 1 }}>
                  <option value="hora">AtÃ© horÃ¡rio</option>
                  <option value="duracao">DuraÃ§Ã£o (min)</option>
                </select>
                {form.usarPrazo === 'hora'
                  ? <input type="time" value={form.prazoHora} onChange={e => setForm(f => ({ ...f, prazoHora: e.target.value }))} style={{ flex: 1 }} />
                  : <input type="number" value={form.duracaoMinutos} onChange={e => setForm(f => ({ ...f, duracaoMinutos: e.target.value }))} placeholder="Ex: 60" style={{ flex: 1 }} />
                }
              </div>
            </div>

            <div className="modal-acoes">
              <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setModalPropor(false)}>Cancelar</button>
              <button className="btn btn-danger" style={{ flex: 2 }} onClick={handlePropor} disabled={loading}>
                {loading ? 'Enviando...' : 'âš”ï¸ Desafiar!'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

