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
      <div className="admin-cards-grid">
        <div className="admin-card">
          <div className="admin-card-icon">📋</div>
          <div className="admin-card-valor">{totalVendas}</div>
          <div className="admin-card-label">Vendas Registradas</div>
        </div>
        <div className="admin-card">
          <div className="admin-card-icon">🫀</div>
          <div className="admin-card-valor">{totalVidas}</div>
          <div className="admin-card-label">Total de Vidas</div>
        </div>
        <div className="admin-card">
          <div className="admin-card-icon">💰</div>
          <div className="admin-card-valor">
            {totalValor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}
          </div>
          <div className="admin-card-label">Total em Valor</div>
        </div>
        <div className="admin-card">
          <div className="admin-card-icon">⚔️</div>
          <div className="admin-card-valor">{duelosAtivos.length}</div>
          <div className="admin-card-label">Duelos Ativos</div>
        </div>
        <div className="admin-card">
          <div className="admin-card-icon">👥</div>
          <div className="admin-card-valor">{ranking.porVidas.length}</div>
          <div className="admin-card-label">Corretores Ativos</div>
        </div>
      </div>

      {/* Rankings lado a lado */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
        <div className="admin-secao">
          <div className="admin-secao-header">
            <span className="admin-secao-titulo">🫀 Ranking — Vidas</span>
          </div>
          <div className="admin-secao-body">
            {ranking.porVidas.length === 0 ? (
              <div className="admin-vazio"><p>Nenhuma venda ainda</p></div>
            ) : (
              ranking.porVidas.slice(0, 5).map((c, i) => (
                <div key={c.corretorId} className="ranking-mini-item">
                  <span className={`ranking-pos ${i === 0 ? 'ouro' : i === 1 ? 'prata' : i === 2 ? 'bronze' : ''}`}>
                    {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
                  </span>
                  <span className="ranking-mini-nome">{c.corretorNome}</span>
                  <span className="ranking-mini-valor">{c.totalVidas} vidas</span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="admin-secao">
          <div className="admin-secao-header">
            <span className="admin-secao-titulo">💰 Ranking — Valor</span>
          </div>
          <div className="admin-secao-body">
            {ranking.porValor.length === 0 ? (
              <div className="admin-vazio"><p>Nenhuma venda ainda</p></div>
            ) : (
              ranking.porValor.slice(0, 5).map((c, i) => (
                <div key={c.corretorId} className="ranking-mini-item">
                  <span className={`ranking-pos ${i === 0 ? 'ouro' : i === 1 ? 'prata' : i === 2 ? 'bronze' : ''}`}>
                    {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
                  </span>
                  <span className="ranking-mini-nome">{c.corretorNome}</span>
                  <span className="ranking-mini-valor">
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
        <div className="admin-secao">
          <div className="admin-secao-header">
            <span className="admin-secao-titulo">⚔️ Duelos em Andamento</span>
          </div>
          <div className="admin-secao-body">
            {duelosAtivos.map(d => (
              <div key={d.id} className="duelo-card">
                <span className="duelo-vs">VS</span>
                <div className="duelo-info">
                  <div className="duelo-nomes">{d.desafiante.nome} × {d.desafiado.nome}</div>
                  <div className="duelo-meta">
                    Meta: {d.tipo === 'vidas' ? `${d.meta} vidas` : d.meta.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    {d.prazo && ` até ${new Date(d.prazo.toDate()).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`}
                  </div>
                </div>
                <span className="badge badge-ativo">● AO VIVO</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
