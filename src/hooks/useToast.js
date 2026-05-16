import { useState, useCallback } from 'react';

export function useToast() {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((mensagem, tipo = 'success') => {
    const id = Date.now();
    setToasts(t => [...t, { id, mensagem, tipo }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500);
  }, []);

  return { toasts, addToast };
}

export function ToastContainer({ toasts }) {
  const icons = { success: '✅', error: '❌', info: 'ℹ️' };
  return (
    <div className="toast-wrap">
      {toasts.map(t => (
        <div key={t.id} className={`toast toast-${t.tipo}`}>
          {icons[t.tipo]} {t.mensagem}
        </div>
      ))}
    </div>
  );
}
