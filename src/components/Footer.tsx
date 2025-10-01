"use client";

import React from 'react';
import { FiHeart, FiMail } from 'react-icons/fi';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer
      className="mt-auto border-t"
      style={{
        backgroundColor: 'var(--bg-primary)',
        borderColor: 'var(--border-subtle)',
        color: 'var(--text-secondary)'
      }}
    >
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 text-sm">
          {/* Copyright and Legal */}
          <div className="flex flex-col md:flex-row items-center gap-4">
            <p>
              © {currentYear} Sistema de Cotizaciones. Todos los derechos reservados.
            </p>
            <div className="flex items-center gap-4">
              <a
                href="/terminos"
                className="hover:underline transition-colors"
                style={{ color: 'var(--accent-text)' }}
              >
                Términos
              </a>
              <span>•</span>
              <a
                href="/privacidad"
                className="hover:underline transition-colors"
                style={{ color: 'var(--accent-text)' }}
              >
                Privacidad
              </a>
            </div>
          </div>

          {/* Developer Credit */}
          <div className="flex items-center gap-2 text-sm">
            <span>Desarrollador, Contacto:</span>
            <a
              href="mailto:mathias.contreras.a@gmail.com"
              className="flex items-center gap-1 font-medium hover:underline transition-colors"
              style={{ color: 'var(--accent-text)' }}
              title="Contactar al desarrollador"
            >
              <FiMail className="w-3 h-3" />
              Edward Contreras
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}