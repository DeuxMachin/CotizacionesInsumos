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
    <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-6">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h3 className="text-sm sm:text-base font-semibold text-gray-900">{title}</h3>
          {subtitle && (
            <p className="text-xs sm:text-sm text-gray-500 mt-1">{subtitle}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {right}
          <button
            type="button"
            className="text-gray-500 hover:text-gray-700 text-xs sm:text-sm"
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
            <div className="text-base font-semibold text-gray-900">{title}</div>
            {subtitle && <div className="text-sm text-gray-500">{subtitle}</div>}
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
