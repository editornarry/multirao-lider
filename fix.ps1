$content = @"
import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, query, where, orderBy, doc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { ouvirRanking, buscarEventoAtivo } from '../../firebase/db';

export default function CorretorDashboard({ perfil, onRegistrarVenda }) {
  const [vendas, setVendas] = useState([]);
  const [ranking, setRanking] = useState({ porVidas: [], porValor: [] });
  const [eventoAtivo, setEventoAtivo] = useState(null);
  const [meta, setMeta] = useState({ vidas: 0, valor: 0 });

  useEffect(() => {
    buscarEventoAtivo().then(ev => {
      setEventoAtivo(ev);
      if (!ev) return;

      // Minhas vendas
      const q = query(
        collection(db, 'vendas'),
        where('eventoId', '==', ev.id),
        where('corretorId', '==', perfil.uid),
        orderBy('criadoEm', 'desc')
      );
      const unsub1 = onSnapshot(q, snap => setVendas(snap.docs.map(d => d.data())));

      // Ranking geral
      const unsub2 = ouvirRanking(ev.id, setRanking);
      return () => { unsub1(); unsub2(); };
    });

    // Meta do corretor
    const unsubMeta = onSnapshot(doc(db, 'users', perfil.uid), snap => {
      const d = snap.data();
      if (d?.metaDia) setMeta(d.metaDia);
    });
    return () => unsubMeta();
  }, [perfil.uid]);

  const totalVidas = vendas.reduce((s, v) => s + (v.vidas || 0), 0);
  const totalValor = vendas.reduce((s, v) => s + (v.valor || 0), 0);
  const posVidas = ranking.porVidas.findIndex(c => c.corretorId === perfil.uid) + 1;
  const posValor = ranking.porValor.findIndex(c => c.corretorId === perfil.uid) + 1;
  const percVidas = meta.vidas > 0 ? Math.min((totalVidas / meta.vidas) * 100, 100) : 0;
  const percValor = meta.valor > 0 ? Math.min((totalValor / meta.valor) * 100, 100) : 0;

  const posEmoji = (pos) => pos === 1 ? '🥇' : pos === 2 ? '🥈' : pos === 3 ? '🥉' : ``#`${pos}``;

  return (
    <div>
      {!eventoAtivo && (
        <div style={{ background: '#fff8e8', border: '1px solid #ffd60a', borderRadius: 12, padding: '14px 16px', marginBottom: 14, fontSize: '0.85rem', color: '#856404' }}>
          ⚠️ Nenhum evento ativo no momento. Aguarde o admin iniciar o Multirão!
        </div>
      )}

      {/* Resumo do dia */}
      <div className=`"c-card`">
        <div className=`"c-card-titulo`">📊 Meu Dia</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div style={{ textAlign: 'center', padding: '12px 0' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--texto2)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Vidas</div>
            <div style={{ fontFamily: 'Bebas Neue', fontSize: '2.5rem', color: 'var(--azul)', lineHeight: 1, margin: '4px 0' }}>{totalVidas}</div>
            <div className={``tag tag-azul``}>🫀 {posVidas > 0 ? posEmoji(posVidas) : '—'}</div>
          </div>
          <div style={{ textAlign: 'center', padding: '12px 0', borderLeft: '1px solid var(--borda)' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--texto2)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Valor</div>
            <div style={{ fontFamily: 'Bebas Neue', fontSize: '1.6rem', color: 'var(--verde)', lineHeight: 1.1, margin: '4px 0' }}>
              {totalValor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </div>
            <div className=`"tag tag-verde`">💰 {posValor > 0 ? posEmoji(posValor) : '—'}</div>
          </div>
        </div>
      </div>

      {/* Metas */}
      {(meta.vidas > 0 || meta.valor > 0) && (
        <div className=`"c-card`">
          <div className=`"c-card-titulo`">🎯 Minhas Metas</div>
          {meta.vidas > 0 && (
            <div className=`"meta-wrap`">
              <div className=`"meta-header`">
                <span className=`"meta-label`">🫀 Vidas</span>
                <span className=`"meta-valor`">{totalVidas} / {meta.vidas}</span>
              </div>
              <div className=`"meta-bar`">
                <div className={``meta-bar-fill `${percVidas >= 100 ? 'completa' : ''}``} style={{ width: ```${percVidas}%`` }} />
              </div>
            </div>
          )}
          {meta.valor > 0 && (
            <div className=`"meta-wrap`" style={{ marginTop: 12 }}>
              <div className=`"meta-header`">
                <span className=`"meta-label`">💰 Valor</span>
                <span className=`"meta-valor`">
                  {totalValor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} / {meta.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </span>
              </div>
              <div className=`"meta-bar`">
                <div className={``meta-bar-fill `${percValor >= 100 ? 'completa' : ''}``} style={{ width: ```${percValor}%`` }} />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Botão registrar venda */}
      {eventoAtivo && (
        <button className=`"btn btn-primary btn-lg btn-block`" onClick={onRegistrarVenda} style={{ marginBottom: 14 }}>
          ➕ Registrar Nova Venda
        </button>
      )}

      {/* Últimas vendas */}
      <div className=`"c-card`">
        <div className=`"c-card-titulo`">📋 Minhas Vendas Hoje ({vendas.length})</div>
        {vendas.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--texto2)', fontSize: '0.88rem' }}>
            Nenhuma venda registrada ainda. Bora vender! 💪
          </div>
        ) : (
          vendas.slice(0, 10).map(v => (
            <div key={v.id} className=`"venda-item`">
              <div className=`"venda-icone`">📝</div>
              <div className=`"venda-info`">
                <div className=`"venda-desc`">{v.observacao || 'Plano vendido'}</div>
                <div className=`"venda-hora`">
                  {v.criadoEm?.toDate?.().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) || '—'}
                  {v.editadoEm && ' • editado'}
                </div>
              </div>
              <div className=`"venda-valores`">
                <div className=`"venda-vidas`">🫀 {v.vidas}</div>
                <div className=`"venda-valor`">{Number(v.valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className=`"corretor-copyright`">desenvolvido por narry :-) 2026</div>
    </div>
  );
}

"@
Set-Content -Path "src/pages/corretor/CorretorDashboard.js" -Value $content -Encoding UTF8
Write-Host "ok: src/pages/corretor/CorretorDashboard.js"
$content = @"
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
      setRestante(```${h > 0 ? h + 'h ' : ''}`${m}m `${s}s``);
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [prazo]);
  return <span style={{ fontFamily: 'Bebas Neue', color: 'var(--vermelho)', fontSize: '1rem', letterSpacing: '0.05em' }}>⏱ {restante}</span>;
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
        🔥 Provocações ao vivo
      </div>
      <div style={{ maxHeight: 140, overflowY: 'auto', marginBottom: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
        {mensagens.length === 0
          ? <p style={{ fontSize: '0.78rem', color: 'var(--texto2)', textAlign: 'center', padding: '8px 0' }}>Nenhuma provocação ainda... 😴</p>
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
          placeholder=`"Manda uma provocação... 😈`"
          style={{
            flex: 1, padding: '9px 12px', border: '1px solid var(--borda)',
            borderRadius: 10, fontSize: '0.85rem', fontFamily: 'Barlow, sans-serif', outline: 'none'
          }}
          maxLength={120}
        />
        <button className=`"btn btn-danger btn-sm`" onClick={handleEnviar} disabled={loading || !texto.trim()}>
          🔥
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
        titulo: '⚔️ Você foi desafiado!',
        corpo: ```${perfil.nome} quer duelar com você! Meta: `${form.tipo === 'vidas' ? form.meta + ' vidas' : 'R`$ ' + form.meta}``,
        dueloId
      });
      addToast('Duelo proposto! Aguarde o admin aprovar. 🥊');
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
      {/* Botão propor */}
      {eventoAtivo && (
        <button className=`"btn btn-danger btn-lg btn-block`" style={{ marginBottom: 14 }} onClick={() => setModalPropor(true)}>
          ⚔️ Propor Duelo
        </button>
      )}

      {/* Ativos */}
      {ativos.length > 0 && (
        <>
          <div className=`"secao-titulo`">🔥 Duelos Ativos</div>
          {ativos.map(d => (
            <div key={d.id} className=`"duelo-card ativo`">
              <div className=`"duelo-adversario`">
                <span className=`"duelo-vs-mini`">VS</span>
                <div>
                  <div className=`"duelo-nome`">{adversario(d).nome}</div>
                  <div className=`"duelo-meta`">
                    Meta: {d.tipo === 'vidas' ? ```${d.meta} vidas`` : Number(d.meta).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    {d.prazo && <> · <ContadorRegressivo prazo={d.prazo} /></>}
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
          <div className=`"secao-titulo`">⏳ Aguardando Aprovação</div>
          {pendentes.map(d => (
            <div key={d.id} className=`"duelo-card`">
              <div className=`"duelo-adversario`">
                <span className=`"duelo-vs-mini`" style={{ color: 'var(--laranja)' }}>VS</span>
                <div>
                  <div className=`"duelo-nome`">{adversario(d).nome}</div>
                  <div className=`"duelo-meta`">
                    Meta: {d.tipo === 'vidas' ? ```${d.meta} vidas`` : Number(d.meta).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </div>
                </div>
              </div>
              <span className=`"tag tag-laranja`" style={{ marginTop: 4 }}>⏳ Aguardando admin</span>
            </div>
          ))}
        </>
      )}

      {/* Sem duelos */}
      {ativos.length === 0 && pendentes.length === 0 && (
        <div className=`"c-card`" style={{ textAlign: 'center', padding: '32px 20px' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 10 }}>⚔️</div>
          <p style={{ color: 'var(--texto2)', fontSize: '0.9rem' }}>Nenhum duelo ativo.<br />Desafie alguém e esquenta a sala! 🔥</p>
        </div>
      )}

      {/* Histórico */}
      {historico.length > 0 && (
        <>
          <div className=`"secao-titulo`" style={{ marginTop: 8 }}>📜 Histórico</div>
          {historico.map(d => {
            const venceu = d.vencedor === perfil.uid;
            const adv = adversario(d);
            return (
              <div key={d.id} className=`"duelo-card`" style={{ opacity: 0.85 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: '1.4rem' }}>{d.status === 'recusado' ? '❌' : venceu ? '🏆' : '💀'}</span>
                  <div style={{ flex: 1 }}>
                    <div className=`"duelo-nome`">vs {adv.nome}</div>
                    <div className=`"duelo-meta`">
                      {d.tipo === 'vidas' ? ```${d.meta} vidas`` : Number(d.meta).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </div>
                  </div>
                  <span className={``tag `${d.status === 'recusado' ? 'tag-vermelho' : venceu ? 'tag-verde' : 'tag-laranja'}``}>
                    {d.status === 'recusado' ? 'Recusado' : venceu ? 'Vitória!' : 'Derrota'}
                  </span>
                </div>
              </div>
            );
          })}
        </>
      )}

      {/* Modal propor duelo */}
      {modalPropor && (
        <div className=`"modal-overlay`" onClick={() => setModalPropor(false)}>
          <div className=`"modal`" onClick={e => e.stopPropagation()}>
            <div className=`"modal-handle`" />
            <div className=`"modal-titulo`">⚔️ Propor Duelo</div>

            <div className=`"form-field`">
              <label>Desafiar quem?</label>
              <select value={form.desafiadoId} onChange={e => setForm(f => ({ ...f, desafiadoId: e.target.value }))}>
                <option value=`"`">Escolha o adversário...</option>
                {corretores.map(c => <option key={c.uid} value={c.uid}>{c.nome}</option>)}
              </select>
            </div>

            <div className=`"form-field`">
              <label>Tipo de Meta</label>
              <select value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))}>
                <option value=`"vidas`">🫀 Vidas</option>
                <option value=`"valor`">💰 Valor R`$</option>
              </select>
            </div>

            <div className=`"form-field`">
              <label>Meta ({form.tipo === 'vidas' ? 'nº de vidas' : 'R`$'})</label>
              <input type=`"number`" value={form.meta} onChange={e => setForm(f => ({ ...f, meta: e.target.value }))}
                placeholder={form.tipo === 'vidas' ? 'Ex: 5' : 'Ex: 1500'} inputMode=`"numeric`" />
            </div>

            <div className=`"form-field`">
              <label>Prazo</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <select value={form.usarPrazo} onChange={e => setForm(f => ({ ...f, usarPrazo: e.target.value }))} style={{ flex: 1 }}>
                  <option value=`"hora`">Até horário</option>
                  <option value=`"duracao`">Duração (min)</option>
                </select>
                {form.usarPrazo === 'hora'
                  ? <input type=`"time`" value={form.prazoHora} onChange={e => setForm(f => ({ ...f, prazoHora: e.target.value }))} style={{ flex: 1 }} />
                  : <input type=`"number`" value={form.duracaoMinutos} onChange={e => setForm(f => ({ ...f, duracaoMinutos: e.target.value }))} placeholder=`"Ex: 60`" style={{ flex: 1 }} />
                }
              </div>
            </div>

            <div className=`"modal-acoes`">
              <button className=`"btn btn-ghost`" style={{ flex: 1 }} onClick={() => setModalPropor(false)}>Cancelar</button>
              <button className=`"btn btn-danger`" style={{ flex: 2 }} onClick={handlePropor} disabled={loading}>
                {loading ? 'Enviando...' : '⚔️ Desafiar!'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

"@
Set-Content -Path "src/pages/corretor/CorretorDuelos.js" -Value $content -Encoding UTF8
Write-Host "ok: src/pages/corretor/CorretorDuelos.js"
$content = @"
import React, { useEffect, useState } from 'react';
import { ouvirNotificacoes, marcarNotificacaoLida } from '../../firebase/db';

const ICONS = {
  duelo_proposto: '⚔️',
  duelo_aprovado: '✅',
  duelo_recusado: '❌',
  duelo_encerrado: '🏁',
};

export default function CorretorNotificacoes({ perfil, onLidas }) {
  const [notifs, setNotifs] = useState([]);

  useEffect(() => {
    const unsub = ouvirNotificacoes(perfil.uid, (lista) => {
      setNotifs(lista);
      const naoLidas = lista.filter(n => !n.lida).length;
      onLidas?.(naoLidas);
    });
    return unsub;
  }, [perfil.uid, onLidas]);

  const handleMarcarLida = async (n) => {
    if (n.lida) return;
    await marcarNotificacaoLida(perfil.uid, n.id);
  };

  const handleMarcarTodas = async () => {
    const naoLidas = notifs.filter(n => !n.lida);
    await Promise.all(naoLidas.map(n => marcarNotificacaoLida(perfil.uid, n.id)));
  };

  const naoLidas = notifs.filter(n => !n.lida).length;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div className=`"secao-titulo`" style={{ marginBottom: 0 }}>
          🔔 Notificações
          {naoLidas > 0 && (
            <span style={{ background: 'var(--vermelho)', color: '#fff', fontSize: '0.65rem', fontWeight: 700, padding: '2px 8px', borderRadius: 20, marginLeft: 8 }}>
              {naoLidas} nova{naoLidas > 1 ? 's' : ''}
            </span>
          )}
        </div>
        {naoLidas > 0 && (
          <button className=`"btn btn-ghost btn-sm`" onClick={handleMarcarTodas}>
            ✓ Marcar todas
          </button>
        )}
      </div>

      <div className=`"c-card`">
        {notifs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--texto2)' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 10 }}>🔕</div>
            <p style={{ fontSize: '0.88rem' }}>Nenhuma notificação ainda.</p>
          </div>
        ) : (
          notifs.map(n => (
            <div
              key={n.id}
              className={``notif-item `${!n.lida ? 'nao-lida' : ''}``}
              onClick={() => handleMarcarLida(n)}
              style={{ cursor: n.lida ? 'default' : 'pointer' }}
            >
              <div className=`"notif-icone`">{ICONS[n.tipo] || '🔔'}</div>
              <div style={{ flex: 1 }}>
                <div className=`"notif-titulo`">{n.titulo}</div>
                <div className=`"notif-corpo`">{n.corpo}</div>
                <div className=`"notif-hora`">
                  {n.criadoEm?.toDate?.().toLocaleString('pt-BR', {
                    day: '2-digit', month: '2-digit',
                    hour: '2-digit', minute: '2-digit'
                  }) || '—'}
                  {!n.lida && <span style={{ color: 'var(--azul)', fontWeight: 700, marginLeft: 6 }}>● novo</span>}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

"@
Set-Content -Path "src/pages/corretor/CorretorNotificacoes.js" -Value $content -Encoding UTF8
Write-Host "ok: src/pages/corretor/CorretorNotificacoes.js"
$content = @"
import React, { useEffect, useState } from 'react';
import { ouvirRanking, ouvirDuelosAtivos } from '../../firebase/db';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase/config';

export default function AdminDashboard({ eventoAtivo }) {
  const [ranking, setRanking] = useState({ porVidas: [], porValor: [] });
  const [duelosAtivos, setDuelosAtivos] = useState([]);
  const [totalVendas, setTotalVendas] = useState(0);

  useEffect(() => {
    if (!eventoAtivo?.id) return;
    const unsub1 = ouvirRanking(eventoAtivo.id, setRanking);
    const unsub2 = ouvirDuelosAtivos(eventoAtivo.id, setDuelosAtivos);

    const q = query(collection(db, 'vendas'), where('eventoId', '==', eventoAtivo.id));
    const unsub3 = onSnapshot(q, snap => setTotalVendas(snap.size));

    return () => { unsub1(); unsub2(); unsub3(); };
  }, [eventoAtivo?.id]);

  const totalVidas = ranking.porVidas.reduce((s, c) => s + c.totalVidas, 0);
  const totalValor = ranking.porValor.reduce((s, c) => s + c.totalValor, 0);

  return (
    <div>
      {/* Cards de resumo */}
      <div className=`"admin-cards-grid`">
        <div className=`"admin-card`">
          <div className=`"admin-card-icon`">📋</div>
          <div className=`"admin-card-valor`">{totalVendas}</div>
          <div className=`"admin-card-label`">Vendas Registradas</div>
        </div>
        <div className=`"admin-card`">
          <div className=`"admin-card-icon`">🫀</div>
          <div className=`"admin-card-valor`">{totalVidas}</div>
          <div className=`"admin-card-label`">Total de Vidas</div>
        </div>
        <div className=`"admin-card`">
          <div className=`"admin-card-icon`">💰</div>
          <div className=`"admin-card-valor`">
            {totalValor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}
          </div>
          <div className=`"admin-card-label`">Total em Valor</div>
        </div>
        <div className=`"admin-card`">
          <div className=`"admin-card-icon`">⚔️</div>
          <div className=`"admin-card-valor`">{duelosAtivos.length}</div>
          <div className=`"admin-card-label`">Duelos Ativos</div>
        </div>
        <div className=`"admin-card`">
          <div className=`"admin-card-icon`">👥</div>
          <div className=`"admin-card-valor`">{ranking.porVidas.length}</div>
          <div className=`"admin-card-label`">Corretores Ativos</div>
        </div>
      </div>

      {/* Rankings lado a lado */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
        <div className=`"admin-secao`">
          <div className=`"admin-secao-header`">
            <span className=`"admin-secao-titulo`">🫀 Ranking — Vidas</span>
          </div>
          <div className=`"admin-secao-body`">
            {ranking.porVidas.length === 0 ? (
              <div className=`"admin-vazio`"><p>Nenhuma venda ainda</p></div>
            ) : (
              ranking.porVidas.slice(0, 5).map((c, i) => (
                <div key={c.corretorId} className=`"ranking-mini-item`">
                  <span className={``ranking-pos `${i === 0 ? 'ouro' : i === 1 ? 'prata' : i === 2 ? 'bronze' : ''}``}>
                    {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
                  </span>
                  <span className=`"ranking-mini-nome`">{c.corretorNome}</span>
                  <span className=`"ranking-mini-valor`">{c.totalVidas} vidas</span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className=`"admin-secao`">
          <div className=`"admin-secao-header`">
            <span className=`"admin-secao-titulo`">💰 Ranking — Valor</span>
          </div>
          <div className=`"admin-secao-body`">
            {ranking.porValor.length === 0 ? (
              <div className=`"admin-vazio`"><p>Nenhuma venda ainda</p></div>
            ) : (
              ranking.porValor.slice(0, 5).map((c, i) => (
                <div key={c.corretorId} className=`"ranking-mini-item`">
                  <span className={``ranking-pos `${i === 0 ? 'ouro' : i === 1 ? 'prata' : i === 2 ? 'bronze' : ''}``}>
                    {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
                  </span>
                  <span className=`"ranking-mini-nome`">{c.corretorNome}</span>
                  <span className=`"ranking-mini-valor`">
                    {c.totalValor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Duelos ativos */}
      {duelosAtivos.length > 0 && (
        <div className=`"admin-secao`">
          <div className=`"admin-secao-header`">
            <span className=`"admin-secao-titulo`">⚔️ Duelos em Andamento</span>
          </div>
          <div className=`"admin-secao-body`">
            {duelosAtivos.map(d => (
              <div key={d.id} className=`"duelo-card`">
                <span className=`"duelo-vs`">VS</span>
                <div className=`"duelo-info`">
                  <div className=`"duelo-nomes`">{d.desafiante.nome} × {d.desafiado.nome}</div>
                  <div className=`"duelo-meta`">
                    Meta: {d.tipo === 'vidas' ? ```${d.meta} vidas`` : d.meta.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    {d.prazo && `` até `${new Date(d.prazo.toDate()).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}``}
                  </div>
                </div>
                <span className=`"badge badge-ativo`">● AO VIVO</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

"@
Set-Content -Path "src/pages/admin/AdminDashboard.js" -Value $content -Encoding UTF8
Write-Host "ok: src/pages/admin/AdminDashboard.js"
$content = @"
import React, { useEffect, useState } from 'react';
import { criarEvento, encerrarEvento, buscarEventoAtivo, listarCorretores, ouvirRanking } from '../../firebase/db';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';

export default function AdminEvento({ eventoAtivo, setEventoAtivo, addToast }) {
  const [corretores, setCorretores] = useState([]);
  const [ranking, setRanking] = useState({ porVidas: [], porValor: [] });
  const [form, setForm] = useState({ nome: 'Multirão de Vendas Líder - Sextou!!!', inicio: '', fim: '' });
  const [loading, setLoading] = useState(false);
  const [campeoes, setCampeoes] = useState({ vidas: '', valor: '', duelos: '' });
  const [confirmReset, setConfirmReset] = useState(false);

  useEffect(() => { listarCorretores().then(setCorretores); }, []);

  useEffect(() => {
    if (!eventoAtivo?.id) return;
    const unsub = ouvirRanking(eventoAtivo.id, setRanking);
    if (eventoAtivo.campeoes) setCampeoes(eventoAtivo.campeoes);
    return unsub;
  }, [eventoAtivo?.id, eventoAtivo?.campeoes]);

  const handleCriarEvento = async () => {
    if (!form.inicio || !form.fim) { addToast('Defina o horário de início e fim.', 'error'); return; }
    setLoading(true);
    try {
      await criarEvento({ nome: form.nome, data: new Date().toLocaleDateString('pt-BR'), inicio: form.inicio, fim: form.fim });
      const novo = await buscarEventoAtivo();
      setEventoAtivo(novo);
      addToast('Evento criado! SEXTOU!!! 🎉');
    } catch { addToast('Erro ao criar evento.', 'error'); }
    finally { setLoading(false); }
  };

  const handleEncerrar = async () => {
    try {
      await encerrarEvento(eventoAtivo.id);
      setEventoAtivo(null);
      addToast('Evento encerrado. Até a próxima sexta! 👋');
      setConfirmReset(false);
    } catch { addToast('Erro ao encerrar evento.', 'error'); }
  };

  const handleSalvarCampeoes = async () => {
    try {
      await updateDoc(doc(db, 'eventos', eventoAtivo.id), { campeoes });
      addToast('Campeões definidos! 🏆');
    } catch { addToast('Erro ao salvar campeões.', 'error'); }
  };

  const campeaoVidas = ranking.porVidas[0];
  const campeaoValor = ranking.porValor[0];

  return (
    <div>
      {!eventoAtivo ? (
        /* CRIAR EVENTO */
        <div className=`"admin-secao`">
          <div className=`"admin-secao-header`">
            <span className=`"admin-secao-titulo`">🚀 Criar Evento do Dia</span>
          </div>
          <div className=`"admin-secao-body`">
            <div style={{ background: '#fff8e8', border: '1px solid #ffd60a', borderRadius: 10, padding: '14px 16px', marginBottom: 20, fontSize: '0.85rem', color: '#856404' }}>
              ⚠️ Não há nenhum evento ativo no momento. Crie um para iniciar o Multirão!
            </div>
            <div className=`"form-grid`">
              <div className=`"form-field`" style={{ gridColumn: '1/-1' }}>
                <label>Nome do Evento</label>
                <input value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} />
              </div>
              <div className=`"form-field`">
                <label>Horário de Início</label>
                <input type=`"time`" value={form.inicio} onChange={e => setForm(f => ({ ...f, inicio: e.target.value }))} />
              </div>
              <div className=`"form-field`">
                <label>Horário de Fim</label>
                <input type=`"time`" value={form.fim} onChange={e => setForm(f => ({ ...f, fim: e.target.value }))} />
              </div>
            </div>
            <div style={{ marginTop: 20 }}>
              <button className=`"btn btn-success btn-lg`" onClick={handleCriarEvento} disabled={loading}>
                {loading ? 'Criando...' : '🎉 Iniciar Multirão'}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* INFO DO EVENTO ATIVO */}
          <div className=`"admin-secao`" style={{ borderColor: '#2dc653', borderWidth: 2 }}>
            <div className=`"admin-secao-header`" style={{ background: '#f0fff5' }}>
              <span className=`"admin-secao-titulo`">✅ Evento Ativo</span>
              <button className=`"btn btn-danger btn-sm`" onClick={() => setConfirmReset(true)}>🔴 Encerrar Evento</button>
            </div>
            <div className=`"admin-secao-body`">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                <div>
                  <div style={{ fontSize: '0.72rem', color: '#888', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Nome</div>
                  <div style={{ fontWeight: 600 }}>{eventoAtivo.nome}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.72rem', color: '#888', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Data</div>
                  <div style={{ fontWeight: 600 }}>{eventoAtivo.data}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.72rem', color: '#888', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Horário</div>
                  <div style={{ fontWeight: 600 }}>{eventoAtivo.inicio} → {eventoAtivo.fim}</div>
                </div>
              </div>
            </div>
          </div>

          {/* LÍDERES AUTOMÁTICOS */}
          <div className=`"admin-secao`">
            <div className=`"admin-secao-header`">
              <span className=`"admin-secao-titulo`">📊 Líderes Atuais (automático)</span>
            </div>
            <div className=`"admin-secao-body`" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className=`"campeao-card`">
                <span className=`"campeao-trophy`">🫀</span>
                <div className=`"campeao-info`">
                  <div className=`"campeao-titulo`">Líder em Vidas</div>
                  <div className=`"campeao-nome`">{campeaoVidas ? ```${campeaoVidas.corretorNome} — `${campeaoVidas.totalVidas} vidas`` : 'Nenhuma venda ainda'}</div>
                </div>
              </div>
              <div className=`"campeao-card`">
                <span className=`"campeao-trophy`">💰</span>
                <div className=`"campeao-info`">
                  <div className=`"campeao-titulo`">Líder em Valor</div>
                  <div className=`"campeao-nome`">{campeaoValor ? ```${campeaoValor.corretorNome} — `${campeaoValor.totalValor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`` : 'Nenhuma venda ainda'}</div>
                </div>
              </div>
            </div>
          </div>

          {/* CAMPEÕES MANUAIS */}
          <div className=`"admin-secao`">
            <div className=`"admin-secao-header`">
              <span className=`"admin-secao-titulo`">🏆 Definir Campeões do Dia (manual)</span>
            </div>
            <div className=`"admin-secao-body`">
              <p style={{ color: '#4a5568', fontSize: '0.85rem', marginBottom: 16 }}>
                Defina os campeões oficiais do dia. Esses dados ficam registrados no histórico permanente e são exibidos na tela pública ao encerrar o evento.
              </p>
              <div className=`"form-grid`">
                <div className=`"form-field`">
                  <label>🥇 Campeão de Vidas</label>
                  <select value={campeoes.vidas} onChange={e => setCampeoes(c => ({ ...c, vidas: e.target.value }))}>
                    <option value=`"`">Selecione...</option>
                    {corretores.map(c => <option key={c.uid} value={c.uid}>{c.nome}</option>)}
                  </select>
                </div>
                <div className=`"form-field`">
                  <label>💰 Campeão de Valor</label>
                  <select value={campeoes.valor} onChange={e => setCampeoes(c => ({ ...c, valor: e.target.value }))}>
                    <option value=`"`">Selecione...</option>
                    {corretores.map(c => <option key={c.uid} value={c.uid}>{c.nome}</option>)}
                  </select>
                </div>
                <div className=`"form-field`">
                  <label>⚔️ Campeão de Duelos</label>
                  <select value={campeoes.duelos} onChange={e => setCampeoes(c => ({ ...c, duelos: e.target.value }))}>
                    <option value=`"`">Selecione...</option>
                    {corretores.map(c => <option key={c.uid} value={c.uid}>{c.nome}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ marginTop: 16 }}>
                <button className=`"btn btn-warning`" onClick={handleSalvarCampeoes}>🏆 Salvar Campeões</button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Confirm encerrar */}
      {confirmReset && (
        <div className=`"modal-overlay`" onClick={() => setConfirmReset(false)}>
          <div className=`"modal`" style={{ maxWidth: 380 }} onClick={e => e.stopPropagation()}>
            <div className=`"modal-titulo`">🔴 Encerrar Evento</div>
            <p style={{ color: '#4a5568', fontSize: '0.9rem' }}>
              Tem certeza que deseja encerrar o evento de hoje? Os dados ficam salvos no histórico, mas nenhuma nova venda poderá ser registrada.
            </p>
            <div className=`"modal-acoes`">
              <button className=`"btn btn-ghost`" onClick={() => setConfirmReset(false)}>Cancelar</button>
              <button className=`"btn btn-danger`" onClick={handleEncerrar}>Encerrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

"@
Set-Content -Path "src/pages/admin/AdminEvento.js" -Value $content -Encoding UTF8
Write-Host "ok: src/pages/admin/AdminEvento.js"
$content = @"
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
    if (!form.corretorId || !form.vidas || !form.valor) { addToast('Preencha todos os campos obrigatórios.', 'error'); return; }
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
      addToast('Venda excluída.');
      setConfirmExcluir(null);
    } catch { addToast('Erro ao excluir.', 'error'); }
  };

  if (!eventoAtivo) return (
    <div className=`"admin-secao`">
      <div className=`"admin-secao-body`">
        <div className=`"admin-vazio`">
          <div className=`"admin-vazio-icon`">📋</div>
          <p>Nenhum evento ativo. Crie um evento primeiro na aba Evento.</p>
        </div>
      </div>
    </div>
  );

  return (
    <div>
      <div className=`"admin-secao`">
        <div className=`"admin-secao-header`">
          <span className=`"admin-secao-titulo`">📋 Vendas do Evento ({vendas.length})</span>
          <button className=`"btn btn-primary`" onClick={abrirCriar}>+ Registrar Venda</button>
        </div>
        <div className=`"admin-secao-body`" style={{ padding: 0 }}>
          {vendas.length === 0 ? (
            <div className=`"admin-vazio`">
              <div className=`"admin-vazio-icon`">📝</div>
              <p>Nenhuma venda registrada ainda.</p>
            </div>
          ) : (
            <table className=`"admin-table`">
              <thead>
                <tr>
                  <th>Corretor</th>
                  <th>Vidas</th>
                  <th>Valor</th>
                  <th>Observação</th>
                  <th>Horário</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {vendas.map(v => (
                  <tr key={v.id}>
                    <td style={{ fontWeight: 600 }}>{v.corretorNome}</td>
                    <td>
                      <span style={{ background: '#eef3ff', color: '#2366d1', padding: '3px 10px', borderRadius: 20, fontWeight: 700, fontSize: '0.82rem' }}>
                        🫀 {v.vidas}
                      </span>
                    </td>
                    <td style={{ fontWeight: 700, color: '#2dc653' }}>
                      {Number(v.valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </td>
                    <td style={{ color: '#4a5568', fontSize: '0.82rem' }}>{v.observacao || '—'}</td>
                    <td style={{ fontSize: '0.78rem', color: '#888' }}>
                      {v.criadoEm?.toDate?.().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) || '—'}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className=`"btn btn-ghost btn-sm`" onClick={() => abrirEditar(v)}>✏️</button>
                        <button className=`"btn btn-danger btn-sm`" onClick={() => setConfirmExcluir(v)}>🗑️</button>
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
        <div className=`"modal-overlay`" onClick={() => setModalAberto(false)}>
          <div className=`"modal`" onClick={e => e.stopPropagation()}>
            <div className=`"modal-titulo`">{editando ? '✏️ Editar Venda' : '➕ Registrar Venda'}</div>
            <div className=`"form-grid`">
              <div className=`"form-field`" style={{ gridColumn: '1/-1' }}>
                <label>Corretor *</label>
                <select value={form.corretorId} onChange={e => setForm(f => ({ ...f, corretorId: e.target.value }))} disabled={!!editando}>
                  <option value=`"`">Selecione...</option>
                  {corretores.map(c => <option key={c.uid} value={c.uid}>{c.nome}</option>)}
                </select>
              </div>
              <div className=`"form-field`">
                <label>Nº de Vidas *</label>
                <input type=`"number`" min=`"1`" value={form.vidas} onChange={e => setForm(f => ({ ...f, vidas: e.target.value }))} placeholder=`"Ex: 3`" />
              </div>
              <div className=`"form-field`">
                <label>Valor R`$ *</label>
                <input type=`"number`" min=`"0`" step=`"0.01`" value={form.valor} onChange={e => setForm(f => ({ ...f, valor: e.target.value }))} placeholder=`"Ex: 850.00`" />
              </div>
              <div className=`"form-field`" style={{ gridColumn: '1/-1' }}>
                <label>Observação</label>
                <input value={form.observacao} onChange={e => setForm(f => ({ ...f, observacao: e.target.value }))} placeholder=`"Opcional...`" />
              </div>
            </div>
            <div className=`"modal-acoes`">
              <button className=`"btn btn-ghost`" onClick={() => setModalAberto(false)}>Cancelar</button>
              <button className=`"btn btn-primary`" onClick={handleSalvar} disabled={loading}>
                {loading ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmExcluir && (
        <div className=`"modal-overlay`" onClick={() => setConfirmExcluir(null)}>
          <div className=`"modal`" style={{ maxWidth: 360 }} onClick={e => e.stopPropagation()}>
            <div className=`"modal-titulo`">🗑️ Confirmar exclusão</div>
            <p style={{ color: '#4a5568', fontSize: '0.9rem' }}>
              Excluir a venda de <strong>{confirmExcluir.corretorNome}</strong> ({confirmExcluir.vidas} vidas — {Number(confirmExcluir.valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })})?
            </p>
            <div className=`"modal-acoes`">
              <button className=`"btn btn-ghost`" onClick={() => setConfirmExcluir(null)}>Cancelar</button>
              <button className=`"btn btn-danger`" onClick={() => handleExcluir(confirmExcluir.id)}>Excluir</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

"@
Set-Content -Path "src/pages/admin/AdminVendas.js" -Value $content -Encoding UTF8
Write-Host "ok: src/pages/admin/AdminVendas.js"