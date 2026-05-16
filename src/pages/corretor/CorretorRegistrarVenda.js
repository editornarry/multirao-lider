import React, { useEffect, useState } from 'react';
import { registrarVenda, buscarEventoAtivo } from '../../firebase/db';

export default function CorretorRegistrarVenda({ perfil, addToast, onSucesso }) {
  const [eventoAtivo, setEventoAtivo] = useState(null);
  const [form, setForm] = useState({ vidas: '', valor: '', observacao: '' });
  const [loading, setLoading] = useState(false);
  const [sucesso, setSucesso] = useState(false);

  useEffect(() => { buscarEventoAtivo().then(setEventoAtivo); }, []);

  const handleSubmit = async () => {
    if (!form.vidas || !form.valor) { addToast('Informe o número de vidas e o valor.', 'error'); return; }
    if (Number(form.vidas) < 1) { addToast('Mínimo 1 vida.', 'error'); return; }
    if (Number(form.valor) <= 0) { addToast('Valor deve ser maior que zero.', 'error'); return; }
    if (!eventoAtivo) { addToast('Nenhum evento ativo no momento.', 'error'); return; }

    setLoading(true);
    try {
      await registrarVenda({
        eventoId: eventoAtivo.id,
        corretorId: perfil.uid,
        corretorNome: perfil.nome,
        vidas: Number(form.vidas),
        valor: Number(form.valor),
        observacao: form.observacao,
        registradoPorAdmin: false
      });
      setSucesso(true);
      addToast('Venda registrada! 🎉');
      setForm({ vidas: '', valor: '', observacao: '' });
      setTimeout(() => { setSucesso(false); onSucesso?.(); }, 1800);
    } catch (err) {
      addToast('Erro ao registrar venda.', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!eventoAtivo) return (
    <div className="c-card" style={{ textAlign: 'center', padding: '40px 20px' }}>
      <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>⏳</div>
      <p style={{ color: 'var(--texto2)', fontSize: '0.9rem' }}>
        Nenhum evento ativo no momento.<br />Aguarde o admin iniciar o Multirão!
      </p>
    </div>
  );

  if (sucesso) return (
    <div style={{ textAlign: 'center', padding: '60px 20px', animation: 'fadeIn 0.3s ease' }}>
      <div style={{ fontSize: '4rem', marginBottom: 16 }}>🎉</div>
      <div style={{ fontFamily: 'Bebas Neue', fontSize: '1.8rem', color: 'var(--verde)', letterSpacing: '0.05em' }}>
        VENDA REGISTRADA!
      </div>
      <p style={{ color: 'var(--texto2)', marginTop: 8 }}>Continue assim! 💪</p>
    </div>
  );

  return (
    <div>
      <div className="c-card">
        <div className="c-card-titulo">➕ Nova Venda</div>

        <div className="form-field">
          <label>Número de Vidas *</label>
          <input
            type="number" min="1"
            value={form.vidas}
            onChange={e => setForm(f => ({ ...f, vidas: e.target.value }))}
            placeholder="Quantas pessoas no plano?"
            inputMode="numeric"
          />
        </div>

        <div className="form-field">
          <label>Valor do Plano R$ *</label>
          <input
            type="number" min="0.01" step="0.01"
            value={form.valor}
            onChange={e => setForm(f => ({ ...f, valor: e.target.value }))}
            placeholder="Ex: 850.00"
            inputMode="decimal"
          />
        </div>

        <div className="form-field">
          <label>Observação (opcional)</label>
          <input
            value={form.observacao}
            onChange={e => setForm(f => ({ ...f, observacao: e.target.value }))}
            placeholder="Ex: Plano família, empresa, etc."
          />
        </div>

        {/* Preview */}
        {(form.vidas || form.valor) && (
          <div style={{
            background: 'var(--azul-bg)', border: '1px solid var(--azul)',
            borderRadius: 10, padding: '12px 14px', marginBottom: 16,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center'
          }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--texto2)' }}>Preview:</span>
            <div style={{ display: 'flex', gap: 12 }}>
              {form.vidas && <span className="tag tag-azul">🫀 {form.vidas} vida{form.vidas > 1 ? 's' : ''}</span>}
              {form.valor && <span className="tag tag-verde">💰 {Number(form.valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>}
            </div>
          </div>
        )}

        <button
          className="btn btn-success btn-lg btn-block"
          onClick={handleSubmit}
          disabled={loading || !form.vidas || !form.valor}
        >
          {loading ? 'Registrando...' : '✅ Confirmar Venda'}
        </button>
      </div>
    </div>
  );
}
