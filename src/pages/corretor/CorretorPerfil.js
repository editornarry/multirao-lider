import React, { useEffect, useState } from 'react';
import { doc, onSnapshot, updateDoc, collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { atualizarUsuario } from '../../firebase/db';

function fotoParaBase64(file) {
  return new Promise((res, rej) => {
    const reader = new FileReader();
    reader.onload = () => res(reader.result);
    reader.onerror = rej;
    reader.readAsDataURL(file);
  });
}

export default function CorretorPerfil({ perfil: perfilInicial, addToast }) {
  const [perfil, setPerfil] = useState(perfilInicial);
  const [editandoMeta, setEditandoMeta] = useState(false);
  const [meta, setMeta] = useState({ vidas: '', valor: '' });
  const [historico, setHistorico] = useState([]);
  const [loading, setLoading] = useState(false);
  const [salvandoFoto, setSalvandoFoto] = useState(false);

  // Escuta perfil em tempo real
  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'users', perfilInicial.uid), snap => {
      if (snap.exists()) {
        const d = snap.data();
        setPerfil(d);
        if (d.metaDia) setMeta({ vidas: d.metaDia.vidas || '', valor: d.metaDia.valor || '' });
      }
    });
    return unsub;
  }, [perfilInicial.uid]);

  // Histórico de eventos
  useEffect(() => {
    const buscarHistorico = async () => {
      const eventosSnap = await getDocs(query(collection(db, 'eventos'), orderBy('criadoEm', 'desc')));
      const eventos = eventosSnap.docs.map(d => d.data());

      const resultado = [];
      for (const ev of eventos.slice(0, 10)) {
        const vendasSnap = await getDocs(query(
          collection(db, 'vendas'),
          where('eventoId', '==', ev.id),
          where('corretorId', '==', perfilInicial.uid)
        ));
        if (vendasSnap.empty) continue;
        const vendas = vendasSnap.docs.map(d => d.data());
        const totalVidas = vendas.reduce((s, v) => s + (v.vidas || 0), 0);
        const totalValor = vendas.reduce((s, v) => s + (v.valor || 0), 0);
        resultado.push({ evento: ev, totalVidas, totalValor, qtdVendas: vendas.length });
      }
      setHistorico(resultado);
    };
    buscarHistorico();
  }, [perfilInicial.uid]);

  const handleFoto = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 500000) { addToast('Foto muito grande. Use até 500kb.', 'error'); return; }
    setSalvandoFoto(true);
    try {
      const b64 = await fotoParaBase64(file);
      await atualizarUsuario(perfilInicial.uid, { fotoBase64: b64 });
      addToast('Foto atualizada! 📸');
    } catch { addToast('Erro ao salvar foto.', 'error'); }
    finally { setSalvandoFoto(false); }
  };

  const handleSalvarMeta = async () => {
    setLoading(true);
    try {
      await updateDoc(doc(db, 'users', perfilInicial.uid), {
        metaDia: {
          vidas: Number(meta.vidas) || 0,
          valor: Number(meta.valor) || 0
        }
      });
      addToast('Meta salva! 🎯');
      setEditandoMeta(false);
    } catch { addToast('Erro ao salvar meta.', 'error'); }
    finally { setLoading(false); }
  };

  const totalGeralVidas = historico.reduce((s, h) => s + h.totalVidas, 0);
  const totalGeralValor = historico.reduce((s, h) => s + h.totalValor, 0);
  const totalGeralVendas = historico.reduce((s, h) => s + h.qtdVendas, 0);

  return (
    <div>
      {/* Header do perfil */}
      <div className="c-card" style={{ textAlign: 'center', paddingTop: 24 }}>
        <div className="avatar-wrap" style={{ display: 'inline-block', marginBottom: 12 }}>
          <div className="avatar" style={{ margin: '0 auto', width: 80, height: 80, fontSize: '2rem' }}>
            {perfil.fotoBase64
              ? <img src={perfil.fotoBase64} alt={perfil.nome} />
              : perfil.nome?.charAt(0).toUpperCase()
            }
          </div>
          <label className="avatar-edit-btn" style={{ cursor: 'pointer' }}>
            {salvandoFoto ? '⏳' : '📷'}
            <input type="file" accept="image/*" onChange={handleFoto} style={{ display: 'none' }} />
          </label>
        </div>

        <div style={{ fontFamily: 'Barlow Condensed', fontSize: '1.4rem', fontWeight: 700 }}>{perfil.nome}</div>
        <div style={{ fontSize: '0.78rem', color: 'var(--texto2)', marginBottom: 16 }}>{perfil.email}</div>

        {/* Stats gerais */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, borderTop: '1px solid var(--borda)', paddingTop: 14 }}>
          <div>
            <div style={{ fontFamily: 'Bebas Neue', fontSize: '1.5rem', color: 'var(--azul)' }}>{totalGeralVendas}</div>
            <div style={{ fontSize: '0.65rem', color: 'var(--texto2)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Vendas</div>
          </div>
          <div>
            <div style={{ fontFamily: 'Bebas Neue', fontSize: '1.5rem', color: 'var(--azul)' }}>{totalGeralVidas}</div>
            <div style={{ fontSize: '0.65rem', color: 'var(--texto2)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Vidas</div>
          </div>
          <div>
            <div style={{ fontFamily: 'Bebas Neue', fontSize: '1.1rem', color: 'var(--verde)' }}>
              {totalGeralValor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}
            </div>
            <div style={{ fontSize: '0.65rem', color: 'var(--texto2)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Total</div>
          </div>
        </div>
      </div>

      {/* Meta do dia */}
      <div className="c-card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div className="c-card-titulo" style={{ marginBottom: 0 }}>🎯 Minha Meta do Dia</div>
          <button className="btn btn-ghost btn-sm" onClick={() => setEditandoMeta(!editandoMeta)}>
            {editandoMeta ? 'Cancelar' : '✏️ Editar'}
          </button>
        </div>

        {editandoMeta ? (
          <>
            <div className="form-field">
              <label>Meta de Vidas</label>
              <input type="number" min="0" value={meta.vidas} onChange={e => setMeta(m => ({ ...m, vidas: e.target.value }))} placeholder="Ex: 20" inputMode="numeric" />
            </div>
            <div className="form-field">
              <label>Meta de Valor R$</label>
              <input type="number" min="0" value={meta.valor} onChange={e => setMeta(m => ({ ...m, valor: e.target.value }))} placeholder="Ex: 5000" inputMode="numeric" />
            </div>
            <button className="btn btn-primary btn-block" onClick={handleSalvarMeta} disabled={loading}>
              {loading ? 'Salvando...' : '💾 Salvar Meta'}
            </button>
          </>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{ textAlign: 'center', padding: '12px 0', background: 'var(--azul-bg)', borderRadius: 10 }}>
              <div style={{ fontFamily: 'Bebas Neue', fontSize: '1.8rem', color: 'var(--azul)' }}>
                {perfil.metaDia?.vidas || '—'}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--texto2)', fontWeight: 700, textTransform: 'uppercase' }}>🫀 Vidas</div>
            </div>
            <div style={{ textAlign: 'center', padding: '12px 0', background: '#e8f8ee', borderRadius: 10 }}>
              <div style={{ fontFamily: 'Bebas Neue', fontSize: '1.3rem', color: 'var(--verde)' }}>
                {perfil.metaDia?.valor
                  ? Number(perfil.metaDia.valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
                  : '—'}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--texto2)', fontWeight: 700, textTransform: 'uppercase' }}>💰 Valor</div>
            </div>
          </div>
        )}
      </div>

      {/* Histórico de eventos */}
      {historico.length > 0 && (
        <div className="c-card">
          <div className="c-card-titulo">📅 Histórico de Eventos</div>
          {historico.map((h, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--bg)' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{h.evento.nome}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--texto2)' }}>{h.evento.data}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontFamily: 'Bebas Neue', fontSize: '1rem', color: 'var(--azul)' }}>🫀 {h.totalVidas}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--verde)', fontWeight: 700 }}>
                  {h.totalValor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="corretor-copyright">desenvolvido por narry :-) 2026</div>
    </div>
  );
}
