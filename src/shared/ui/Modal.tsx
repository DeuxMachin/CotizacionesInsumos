"use client";
import { ReactNode, CSSProperties } from "react";
import { createPortal } from "react-dom";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  // Optional styles to override the inner container (card) sizing/styling
  contentStyle?: CSSProperties;
};

export function Modal({ open, onClose, children, contentStyle }: ModalProps) {
  if (typeof document === "undefined") return null;
  if (!open) return null;
  return createPortal(
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center animate-fadeIn" 
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.4)' }}
      onClick={onClose}
    >
      <div 
        className="rounded-xl animate-slideUp overflow-y-auto" 
        style={{ 
          backgroundColor: 'var(--card-bg)',
          border: '1px solid var(--border)',
          boxShadow: 'var(--shadow-md)',
          width: 'min(95vw, 1400px)',
          maxHeight: '95vh',
          ...contentStyle
        }}
        onClick={(e)=>e.stopPropagation()}
      >
        {children}
      </div>
    </div>,
    document.body
  );
}
