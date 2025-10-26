"use client";

import React, { useEffect, useState } from 'react';
import { FiHeart, FiMail } from 'react-icons/fi';
import { useSection } from '@/features/navigation/model/useSection';
import { usePathname } from 'next/navigation';

export function Footer() {
  const currentYear = new Date().getFullYear();
  const { sidebarCollapsed } = useSection();
  const pathname = usePathname();
  const [marginLeft, setMarginLeft] = useState('0');

  useEffect(() => {
    const updateMargin = () => {
      if (typeof window !== 'undefined') {
        const isDashboard = pathname?.startsWith('/dashboard');
        const isAdmin = pathname?.startsWith('/admin');
        
        if ((!isDashboard && !isAdmin) || window.innerWidth < 1024) {
          setMarginLeft('0');
        } else {
          setMarginLeft(sidebarCollapsed ? '4rem' : '16rem');
        }
      }
    };
    updateMargin();
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', updateMargin);
      return () => window.removeEventListener('resize', updateMargin);
    }
  }, [sidebarCollapsed, pathname]);

  return (
    <footer
      className="mt-auto border-t relative z-10"
      style={{
        backgroundColor: 'var(--bg-primary)',
        borderColor: 'var(--border-subtle)',
        color: 'var(--text-secondary)',
        marginLeft,
        transition: 'margin-left 0.3s ease-in-out'
      }}
    >
      <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-4 md:py-5 lg:py-6">
        <div className="flex flex-col space-y-4 text-center sm:flex-row sm:justify-between sm:items-center sm:space-y-0 sm:text-left">
          {/* Copyright and Legal */}
          <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-4">
            <p className="text-xs sm:text-sm leading-tight max-w-full">
              © {currentYear} Sistema de Cotizaciones.<br className="sm:hidden" /> Todos los derechos reservados.
            </p>
            <div className="flex items-center justify-center space-x-3 sm:space-x-4 text-xs sm:text-sm">
              <a
                href="/terminos"
                className="hover:underline transition-colors whitespace-nowrap"
                style={{ color: 'var(--accent-text)' }}
              >
                Términos
              </a>
              <span className="hidden sm:inline">•</span>
              <a
                href="/privacidad"
                className="hover:underline transition-colors whitespace-nowrap"
                style={{ color: 'var(--accent-text)' }}
              >
                Privacidad
              </a>
            </div>
          </div>

          {/* Developer Credit */}
          <div className="flex flex-col items-center space-y-1 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-2 max-w-full">
            <span className="text-xs sm:text-sm whitespace-nowrap">Desarrollador:</span>
            <a
              href="mailto:mathias.contreras.a@gmail.com"
              className="flex items-center font-medium hover:underline transition-colors text-xs sm:text-sm min-w-0"
              style={{ color: 'var(--accent-text)' }}
              title="Contactar al desarrollador"
            >
              <FiMail className="w-3 h-3 sm:w-4 sm:h-4 mr-1 flex-shrink-0" />
              <span className="truncate">Edward Contreras</span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}