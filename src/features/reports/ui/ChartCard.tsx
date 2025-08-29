"use client";

import React, { useState } from "react";
import { FullscreenModal } from "@/shared/ui/FullscreenModal";

type Props = {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  right?: React.ReactNode;
};

export function ChartCard({ title, subtitle, children, right }: Props) {
  const [open, setOpen] = useState(false);
  return (
    <div 
      className="rounded-xl p-4 sm:p-6"
      style={{ 
        backgroundColor: 'var(--bg-primary)',
        border: '1px solid var(--border-subtle)' 
      }}
    >
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h3 className="text-sm sm:text-base font-semibold text-theme-primary">{title}</h3>
          {subtitle && (
            <p className="text-xs sm:text-sm text-theme-secondary mt-1">{subtitle}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {right}
          <button
            type="button"
            className="text-theme-secondary hover:text-theme-primary text-xs sm:text-sm transition-colors"
            aria-label="Ampliar gráfico"
            onClick={() => setOpen(true)}
          >
            Ampliar
          </button>
        </div>
      </div>
      <div className="h-64 sm:h-72 lg:h-80">
        {children}
      </div>

      {/* Modal de pantalla completa */}
      <FullscreenModal open={open} onClose={() => setOpen(false)} title={
        <div className="flex items-center justify-between w-full">
          <div>
            <div className="text-base font-semibold text-theme-primary">{title}</div>
            {subtitle && <div className="text-sm text-theme-secondary">{subtitle}</div>}
          </div>
        </div>
      }>
        <div className="p-4 sm:p-6">
          <div className="max-w-7xl mx-auto">
            <div className="h-[72vh]">
              {children}
            </div>
          </div>
        </div>
      </FullscreenModal>
    </div>
  );
}
