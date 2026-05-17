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
        <div className="secao-titulo" style={{ marginBottom: 0 }}>
          🔔 Notificações
          {naoLidas > 0 && (
            <span style={{ background: 'var(--vermelho)', color: '#fff', fontSize: '0.65rem', fontWeight: 700, padding: '2px 8px', borderRadius: 20, marginLeft: 8 }}>
              {naoLidas} nova{naoLidas > 1 ? 's' : ''}
            </span>
          )}
        </div>
        {naoLidas > 0 && (
          <button className="btn btn-ghost btn-sm" onClick={handleMarcarTodas}>
            ✓ Marcar todas
          </button>
        )}
      </div>

      <div className="c-card">
        {notifs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--texto2)' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 10 }}>🔕</div>
            <p style={{ fontSize: '0.88rem' }}>Nenhuma notificação ainda.</p>
          </div>
        ) : (
          notifs.map(n => (
            <div
              key={n.id}
              className={`notif-item ${!n.lida ? 'nao-lida' : ''}`}
              onClick={() => handleMarcarLida(n)}
              style={{ cursor: n.lida ? 'default' : 'pointer' }}
            >
              <div className="notif-icone">{ICONS[n.tipo] || '🔔'}</div>
              <div style={{ flex: 1 }}>
                <div className="notif-titulo">{n.titulo}</div>
                <div className="notif-corpo">{n.corpo}</div>
                <div className="notif-hora">
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
