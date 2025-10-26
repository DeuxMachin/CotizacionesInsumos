"use client";

import { Sidebar } from "@/features/navigation/ui/Sidebar";
import { Header } from "@/features/navigation/ui/HeaderNew";
import { ToastHost } from "@/shared/ui/Toast";
import { Breadcrumbs } from "@/components/navigation/Breadcrumbs";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import { useSection } from "@/features/navigation/model/useSection";


export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { sidebarCollapsed } = useSection();
  const [marginLeft, setMarginLeft] = useState('0');
  const mainRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const updateMargin = () => {
      if (typeof window !== 'undefined') {
        if (window.innerWidth < 1024) {
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
  }, [sidebarCollapsed]);

  // Reset scroll al cambiar de ruta
  useEffect(() => {
    // Usar setTimeout para asegurar que el DOM esté actualizado
    const resetScroll = () => {
      // Resetear scroll del contenedor principal
      if (mainRef.current) {
        mainRef.current.scrollTo({ top: 0, behavior: 'instant' });
      }
      // También resetear scroll del window por si acaso
      window.scrollTo({ top: 0, behavior: 'instant' });
    };
    
    setTimeout(resetScroll, 0);
  }, [pathname]);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      console.log('[DashboardLayout] Usuario no autenticado, redirigiendo a /login')
      router.replace('/login');
    }
  }, [loading, isAuthenticated, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 border-2 border-current border-t-transparent rounded-full animate-spin" />
          <span>Verificando sesión...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div 
      className="h-full flex"
      style={{ backgroundColor: 'var(--bg-secondary)' }}
    >
      {/* Navegación lateral */}
      <Sidebar />
      
      {/* Contenido principal */}
      <div 
        className="flex-1 flex flex-col h-full overflow-x-hidden transition-all duration-300"
        style={{ marginLeft }}
      >
        {/* Header fijo en la parte superior */}
        <Header />
        
        {/* Contenido scrolleable - con padding-top para compensar header fixed */}
        <main 
          ref={mainRef}
          className="flex-1 overflow-auto overflow-x-hidden h-full pt-14 sm:pt-16"
          style={{ backgroundColor: 'var(--bg-secondary)' }}
        >
          <div className="px-2 sm:px-4 lg:px-6 py-2 sm:py-4 lg:py-6">
            <div className="w-full max-w-none mx-auto space-y-3 sm:space-y-4 lg:space-y-6">
              {/* Breadcrumbs */}
              <Breadcrumbs />
              {children}
            </div>
          </div>
        </main>
      </div>
      <ToastHost />
    </div>
  );
}
