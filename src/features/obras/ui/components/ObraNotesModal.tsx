"use client";

import React, { useEffect, useState } from "react";
import { FiMessageSquare, FiSave, FiX } from "react-icons/fi";

interface ObraNotesModalProps {
  isOpen: boolean;
  initialValue?: string;
  obraName: string;
  onClose: () => void;
  onSave: (value: string) => Promise<boolean>;
}

export function ObraNotesModal({
  isOpen,
  initialValue,
  obraName,
  onClose,
  onSave,
}: ObraNotesModalProps) {
  const [value, setValue] = useState(initialValue ?? "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setValue(initialValue ?? "");
  }, [isOpen, initialValue]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSave = async () => {
    try {
      setSaving(true);
      await onSave(value);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div
        className="relative w-[92vw] max-w-xl rounded-xl overflow-hidden"
        style={{ backgroundColor: "var(--card-bg)", border: "1px solid var(--border)", boxShadow: "var(--shadow-lg)" }}
        role="dialog"
        aria-modal="true"
        aria-label="Notas de la obra"
      >
        <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: "var(--border)" }}>
          <div className="flex items-center gap-2 min-w-0">
            <div className="p-2 rounded" style={{ backgroundColor: "var(--accent-bg)", color: "var(--accent-text)" }}>
              <FiMessageSquare className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-semibold truncate" style={{ color: "var(--text-primary)" }}>
                Nota
              </h3>
              <p className="text-xs truncate" style={{ color: "var(--text-secondary)" }}>
                {obraName}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="btn-secondary text-xs px-2 py-1" title="Cerrar">
            <FiX className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4">
          <label className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
            Comentarios
          </label>
          <textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            rows={6}
            className="mt-1 w-full px-3 py-2 rounded text-sm"
            placeholder="Escribe comentarios sobre esta obra..."
            style={{ backgroundColor: "var(--bg-secondary)", color: "var(--text-primary)", border: "1px solid var(--border)" }}
          />
          <p className="mt-2 text-[11px]" style={{ color: "var(--text-muted)" }}>
            Se guarda en la obra como una nota general.
          </p>
        </div>

        <div className="p-3 border-t flex items-center justify-end gap-2" style={{ borderColor: "var(--border)" }}>
          <button onClick={onClose} className="btn-secondary text-xs px-3 py-2" disabled={saving}>
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="btn-primary text-xs px-3 py-2 flex items-center gap-2"
            disabled={saving}
            title="Guardar nota"
          >
            {saving ? (
              <div className="w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin" />
            ) : (
              <FiSave className="w-4 h-4" />
            )}
            {saving ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  );
}
