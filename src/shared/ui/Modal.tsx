"use client";
import { ReactNode } from "react";
import { createPortal } from "react-dom";

export function Modal({ open, onClose, children }: { open: boolean; onClose: ()=>void; children: ReactNode; }) {
  if (typeof document === "undefined") return null;
  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center animate-fadeIn" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-[min(92vw,520px)] animate-slideUp" onClick={(e)=>e.stopPropagation()}>
        {children}
      </div>
    </div>,
    document.body
  );
}
