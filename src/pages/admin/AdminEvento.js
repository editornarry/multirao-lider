import React, { useEffect, useState } from 'react';
import { criarEvento, encerrarEvento, buscarEventoAtivo, listarCorretores, ouvirRanking } from '../../firebase/db';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';

export default function AdminEvento({ eventoAtivo, setEventoAtivo, addToast }) {
  const [corretores, setCorretores] = useState([]);
  const [ranking, setRanking] = useState({ porVidas: [], porValor: [] });
  const [form, setForm] = useState({ nome: 'MultirÃ£o de Vendas LÃ­der - Sextou!!!', inicio: '', fim: '' });
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
    if (!form.inicio || !form.fim) { addToast('Defina o horÃ¡rio de inÃ­cio e fim.', 'error'); return; }
    setLoading(true);
    try {
      await criarEvento({ nome: form.nome, data: new Date().toLocaleDateString('pt-BR'), inicio: form.inicio, fim: form.fim });
      const novo = await buscarEventoAtivo();
      setEventoAtivo(novo);
      addToast('Evento criado! SEXTOU!!! ðŸŽ‰');
    } catch { addToast('Erro ao criar evento.', 'error'); }
    finally { setLoading(false); }
  };

  const handleEncerrar = async () => {
    try {
      await encerrarEvento(eventoAtivo.id);
      setEventoAtivo(null);
      addToast('Evento encerrado. AtÃ© a prÃ³xima sexta! ðŸ‘‹');
      setConfirmReset(false);
    } catch { addToast('Erro ao encerrar evento.', 'error'); }
  };

  const handleSalvarCampeoes = async () => {
    try {
      await updateDoc(doc(db, 'eventos', eventoAtivo.id), { campeoes });
      addToast('CampeÃµes definidos! ðŸ†');
    } catch { addToast('Erro ao salvar campeÃµes.', 'error'); }
  };

  const campeaoVidas = ranking.porVidas[0];
  const campeaoValor = ranking.porValor[0];

  return (
    <div>
      {!eventoAtivo ? (
        /* CRIAR EVENTO */
        <div className="admin-secao">
          <div className="admin-secao-header">
            <span className="admin-secao-titulo">ðŸš€ Criar Evento do Dia</span>
          </div>
          <div className="admin-secao-body">
            <div style={{ background: '#fff8e8', border: '1px solid #ffd60a', borderRadius: 10, padding: '14px 16px', marginBottom: 20, fontSize: '0.85rem', color: '#856404' }}>
              âš ï¸ NÃ£o hÃ¡ nenhum evento ativo no momento. Crie um para iniciar o MultirÃ£o!
            </div>
            <div className="form-grid">
              <div className="form-field" style={{ gridColumn: '1/-1' }}>
                <label>Nome do Evento</label>
                <input value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} />
              </div>
              <div className="form-field">
                <label>HorÃ¡rio de InÃ­cio</label>
                <input type="time" value={form.inicio} onChange={e => setForm(f => ({ ...f, inicio: e.target.value }))} />
              </div>
              <div className="form-field">
                <label>HorÃ¡rio de Fim</label>
                <input type="time" value={form.fim} onChange={e => setForm(f => ({ ...f, fim: e.target.value }))} />
              </div>
            </div>
            <div style={{ marginTop: 20 }}>
              <button className="btn btn-success btn-lg" onClick={handleCriarEvento} disabled={loading}>
                {loading ? 'Criando...' : 'ðŸŽ‰ Iniciar MultirÃ£o'}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* INFO DO EVENTO ATIVO */}
          <div className="admin-secao" style={{ borderColor: '#2dc653', borderWidth: 2 }}>
            <div className="admin-secao-header" style={{ background: '#f0fff5' }}>
              <span className="admin-secao-titulo">âœ… Evento Ativo</span>
              <button className="btn btn-danger btn-sm" onClick={() => setConfirmReset(true)}>ðŸ”´ Encerrar Evento</button>
            </div>
            <div className="admin-secao-body">
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
                  <div style={{ fontSize: '0.72rem', color: '#888', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>HorÃ¡rio</div>
                  <div style={{ fontWeight: 600 }}>{eventoAtivo.inicio} â†’ {eventoAtivo.fim}</div>
                </div>
              </div>
            </div>
          </div>

          {/* LÃDERES AUTOMÃTICOS */}
          <div className="admin-secao">
            <div className="admin-secao-header">
              <span className="admin-secao-titulo">ðŸ“Š LÃ­deres Atuais (automÃ¡tico)</span>
            </div>
            <div className="admin-secao-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="campeao-card">
                <span className="campeao-trophy">ðŸ«€</span>
                <div className="campeao-info">
                  <div className="campeao-titulo">LÃ­der em Vidas</div>
                  <div className="campeao-nome">{campeaoVidas ? `${campeaoVidas.corretorNome} â€” ${campeaoVidas.totalVidas} vidas` : 'Nenhuma venda ainda'}</div>
                </div>
              </div>
              <div className="campeao-card">
                <span className="campeao-trophy">ðŸ’°</span>
                <div className="campeao-info">
                  <div className="campeao-titulo">LÃ­der em Valor</div>
                  <div className="campeao-nome">{campeaoValor ? `${campeaoValor.corretorNome} â€” ${campeaoValor.totalValor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}` : 'Nenhuma venda ainda'}</div>
                </div>
              </div>
            </div>
          </div>

          {/* CAMPEÃ•ES MANUAIS */}
          <div className="admin-secao">
            <div className="admin-secao-header">
              <span className="admin-secao-titulo">ðŸ† Definir CampeÃµes do Dia (manual)</span>
            </div>
            <div className="admin-secao-body">
              <p style={{ color: '#4a5568', fontSize: '0.85rem', marginBottom: 16 }}>
                Defina os campeÃµes oficiais do dia. Esses dados ficam registrados no histÃ³rico permanente e sÃ£o exibidos na tela pÃºblica ao encerrar o evento.
              </p>
              <div className="form-grid">
                <div className="form-field">
                  <label>ðŸ¥‡ CampeÃ£o de Vidas</label>
                  <select value={campeoes.vidas} onChange={e => setCampeoes(c => ({ ...c, vidas: e.target.value }))}>
                    <option value="">Selecione...</option>
                    {corretores.map(c => <option key={c.uid} value={c.uid}>{c.nome}</option>)}
                  </select>
                </div>
                <div className="form-field">
                  <label>ðŸ’° CampeÃ£o de Valor</label>
                  <select value={campeoes.valor} onChange={e => setCampeoes(c => ({ ...c, valor: e.target.value }))}>
                    <option value="">Selecione...</option>
                    {corretores.map(c => <option key={c.uid} value={c.uid}>{c.nome}</option>)}
                  </select>
                </div>
                <div className="form-field">
                  <label>âš”ï¸ CampeÃ£o de Duelos</label>
                  <select value={campeoes.duelos} onChange={e => setCampeoes(c => ({ ...c, duelos: e.target.value }))}>
                    <option value="">Selecione...</option>
                    {corretores.map(c => <option key={c.uid} value={c.uid}>{c.nome}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ marginTop: 16 }}>
                <button className="btn btn-warning" onClick={handleSalvarCampeoes}>ðŸ† Salvar CampeÃµes</button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Confirm encerrar */}
      {confirmReset && (
        <div className="modal-overlay" onClick={() => setConfirmReset(false)}>
          <div className="modal" style={{ maxWidth: 380 }} onClick={e => e.stopPropagation()}>
            <div className="modal-titulo">ðŸ”´ Encerrar Evento</div>
            <p style={{ color: '#4a5568', fontSize: '0.9rem' }}>
              Tem certeza que deseja encerrar o evento de hoje? Os dados ficam salvos no histÃ³rico, mas nenhuma nova venda poderÃ¡ ser registrada.
            </p>
            <div className="modal-acoes">
              <button className="btn btn-ghost" onClick={() => setConfirmReset(false)}>Cancelar</button>
              <button className="btn btn-danger" onClick={handleEncerrar}>Encerrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

