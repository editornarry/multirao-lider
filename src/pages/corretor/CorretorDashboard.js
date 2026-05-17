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

  const posEmoji = (pos) => pos === 1 ? 'ðŸ¥‡' : pos === 2 ? 'ðŸ¥ˆ' : pos === 3 ? 'ðŸ¥‰' : `#${pos}`;

  return (
    <div>
      {!eventoAtivo && (
        <div style={{ background: '#fff8e8', border: '1px solid #ffd60a', borderRadius: 12, padding: '14px 16px', marginBottom: 14, fontSize: '0.85rem', color: '#856404' }}>
          âš ï¸ Nenhum evento ativo no momento. Aguarde o admin iniciar o MultirÃ£o!
        </div>
      )}

      {/* Resumo do dia */}
      <div className="c-card">
        <div className="c-card-titulo">ðŸ“Š Meu Dia</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div style={{ textAlign: 'center', padding: '12px 0' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--texto2)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Vidas</div>
            <div style={{ fontFamily: 'Bebas Neue', fontSize: '2.5rem', color: 'var(--azul)', lineHeight: 1, margin: '4px 0' }}>{totalVidas}</div>
            <div className={`tag tag-azul`}>ðŸ«€ {posVidas > 0 ? posEmoji(posVidas) : 'â€”'}</div>
          </div>
          <div style={{ textAlign: 'center', padding: '12px 0', borderLeft: '1px solid var(--borda)' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--texto2)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Valor</div>
            <div style={{ fontFamily: 'Bebas Neue', fontSize: '1.6rem', color: 'var(--verde)', lineHeight: 1.1, margin: '4px 0' }}>
              {totalValor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </div>
            <div className="tag tag-verde">ðŸ’° {posValor > 0 ? posEmoji(posValor) : 'â€”'}</div>
          </div>
        </div>
      </div>

      {/* Metas */}
      {(meta.vidas > 0 || meta.valor > 0) && (
        <div className="c-card">
          <div className="c-card-titulo">ðŸŽ¯ Minhas Metas</div>
          {meta.vidas > 0 && (
            <div className="meta-wrap">
              <div className="meta-header">
                <span className="meta-label">ðŸ«€ Vidas</span>
                <span className="meta-valor">{totalVidas} / {meta.vidas}</span>
              </div>
              <div className="meta-bar">
                <div className={`meta-bar-fill ${percVidas >= 100 ? 'completa' : ''}`} style={{ width: `${percVidas}%` }} />
              </div>
            </div>
          )}
          {meta.valor > 0 && (
            <div className="meta-wrap" style={{ marginTop: 12 }}>
              <div className="meta-header">
                <span className="meta-label">ðŸ’° Valor</span>
                <span className="meta-valor">
                  {totalValor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} / {meta.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </span>
              </div>
              <div className="meta-bar">
                <div className={`meta-bar-fill ${percValor >= 100 ? 'completa' : ''}`} style={{ width: `${percValor}%` }} />
              </div>
            </div>
          )}
        </div>
      )}

      {/* BotÃ£o registrar venda */}
      {eventoAtivo && (
        <button className="btn btn-primary btn-lg btn-block" onClick={onRegistrarVenda} style={{ marginBottom: 14 }}>
          âž• Registrar Nova Venda
        </button>
      )}

      {/* Ãšltimas vendas */}
      <div className="c-card">
        <div className="c-card-titulo">ðŸ“‹ Minhas Vendas Hoje ({vendas.length})</div>
        {vendas.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--texto2)', fontSize: '0.88rem' }}>
            Nenhuma venda registrada ainda. Bora vender! ðŸ’ª
          </div>
        ) : (
          vendas.slice(0, 10).map(v => (
            <div key={v.id} className="venda-item">
              <div className="venda-icone">ðŸ“</div>
              <div className="venda-info">
                <div className="venda-desc">{v.observacao || 'Plano vendido'}</div>
                <div className="venda-hora">
                  {v.criadoEm?.toDate?.().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) || 'â€”'}
                  {v.editadoEm && ' â€¢ editado'}
                </div>
              </div>
              <div className="venda-valores">
                <div className="venda-vidas">ðŸ«€ {v.vidas}</div>
                <div className="venda-valor">{Number(v.valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="corretor-copyright">desenvolvido por narry :-) 2026</div>
    </div>
  );
}

