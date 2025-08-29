"use client";
import { ReactNode, useEffect } from "react";
import { createPortal } from "react-dom";

export function FullscreenModal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title?: ReactNode; children: ReactNode; }) {
  // Hooks must be called unconditionally
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    if (typeof document !== "undefined") {
      document.addEventListener("keydown", onKey);
      return () => document.removeEventListener("keydown", onKey);
    }
    return;
  }, [onClose]);

  if (!open) return null;
  if (typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-50 bg-black/40 animate-fadeIn" onClick={onClose}>
      <div 
        className="fixed inset-0 animate-slideUp" 
        style={{ backgroundColor: 'var(--bg-secondary)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div 
          className="sticky top-0 z-10 h-16 flex items-center justify-between px-4 sm:px-6"
          style={{ 
            backgroundColor: 'var(--bg-primary)', 
            borderBottom: '1px solid var(--border)' 
          }}
        >
          <div className="min-w-0">
            {typeof title === "string" ? (
              <h3 className="text-lg font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{title}</h3>
            ) : (
              title
            )}
          </div>
          <button onClick={onClose} className="btn-ghost" aria-label="Cerrar">✖</button>
        </div>
        {/* Body */}
        <div className="h-[calc(100vh-4rem)] overflow-auto">{children}</div>
      </div>
    </div>,
    document.body
  );
}
