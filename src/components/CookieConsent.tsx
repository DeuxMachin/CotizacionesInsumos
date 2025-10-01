"use client";

import { useEffect, useState } from 'react';

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const consent = localStorage.getItem('cookie-consent');
      // Mostrar si nunca decidió; ocultar si aceptó o rechazó explícitamente
      if (consent !== 'accepted' && consent !== 'declined') setVisible(true);
    } catch {
      // ignore
    }
  }, []);

  const accept = () => {
    try { localStorage.setItem('cookie-consent', 'accepted'); } catch {}
    setVisible(false);
  };

  const decline = () => {
    try { localStorage.setItem('cookie-consent', 'declined'); } catch {}
    setVisible(false);
  };

  if (!visible) return null;

  return (
  <div className="fixed bottom-0 inset-x-0 z-50 p-4" role="dialog" aria-live="polite" aria-label="Aviso de uso de cookies">
      <div
        className="mx-auto max-w-3xl rounded-lg border"
        style={{
          backgroundColor: 'var(--card-bg)',
          color: 'var(--text-primary)',
          borderColor: 'var(--border-subtle)',
          boxShadow: 'var(--shadow)'
        }}
      >
        <div className="p-4">
          <h3 className="font-semibold mb-1">Uso de cookies</h3>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Utilizamos cookies esenciales para el funcionamiento del sitio y cookies analíticas opcionales para mejorar la experiencia. Puede aceptar o rechazar el uso de cookies no esenciales.
          </p>
          <div className="mt-3 flex gap-2 justify-end">
            <button
              onClick={decline}
              className="px-3 py-1.5 rounded border"
              style={{
                backgroundColor: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                borderColor: 'var(--border)'
              }}
            >
              Rechazar
            </button>
            <button
              onClick={accept}
              className="px-3 py-1.5 rounded text-white"
              style={{
                background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))'
              }}
            >
              Aceptar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
