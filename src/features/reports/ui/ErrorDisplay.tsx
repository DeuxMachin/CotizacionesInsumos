"use client";

import React from "react";
import { FiAlertTriangle } from "react-icons/fi";

interface ErrorDisplayProps {
  message: string;
  retry?: () => void;
}

export function ErrorDisplay({ message, retry }: ErrorDisplayProps) {
  return (
    <div className="flex flex-col items-center justify-center p-4 sm:p-6 rounded-xl border text-center" style={{ 
      backgroundColor: 'var(--danger-bg)',
      borderColor: 'var(--danger-border)',
      color: 'var(--danger-text)'
    }}>
      <FiAlertTriangle className="w-8 h-8 mb-3" />
      <p className="mb-2 font-medium">Error al cargar datos</p>
      <p className="text-sm mb-4">{message}</p>
      {retry && (
        <button
          onClick={retry}
          className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
          style={{ 
            backgroundColor: 'var(--danger-text)', 
            color: 'var(--danger-bg)' 
          }}
        >
          Reintentar
        </button>
      )}
    </div>
  );
}