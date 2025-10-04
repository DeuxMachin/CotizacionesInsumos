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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div className="flex flex-col space-y-4 sm:flex-row sm:justify-between sm:items-center sm:space-y-0">
          {/* Copyright and Legal */}
          <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-4 text-center sm:text-left">
            <p className="text-sm">
              © {currentYear} Sistema de Cotizaciones. Todos los derechos reservados.
            </p>
            <div className="flex items-center justify-center space-x-4 text-sm">
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
          <div className="flex items-center justify-center sm:justify-end text-sm">
            <span className="mr-2">Desarrollador, Contacto:</span>
            <a
              href="mailto:mathias.contreras.a@gmail.com"
              className="flex items-center font-medium hover:underline transition-colors"
              style={{ color: 'var(--accent-text)' }}
              title="Contactar al desarrollador"
            >
              <FiMail className="w-3 h-3 mr-1" />
              Edward Contreras
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}