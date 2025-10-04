"use client";

import { Modal } from "@/shared/ui/Modal";
import { ConvertToObraPanel } from "./ConvertToObraPanel";
import { FiHome, FiX } from "react-icons/fi";

interface ConvertToObraModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetId: number;
  defaultDireccion?: { direccion?: string; comuna?: string | null; ciudad?: string | null };
  onConverted?: (obraId: number) => void;
}

export function ConvertToObraModal({
  isOpen,
  onClose,
  targetId,
  defaultDireccion,
  onConverted
}: ConvertToObraModalProps) {
  return (
    <Modal open={isOpen} onClose={onClose}>
      <div className="w-full max-h-[80vh] overflow-y-auto custom-scrollbar">
        <div className="p-4">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex items-center gap-2 flex-1">
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: 'var(--accent-bg)' }}
              >
                <FiHome className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
              </div>
              <div>
                <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                  Crear Nueva Obra
                </h2>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  Convierte este target en una obra formal con la información necesaria.
                </p>
              </div>
            </div>
            
            {/* Botón de cerrar */}
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:opacity-80 transition-opacity"
              style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}
              title="Cerrar"
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>

          <ConvertToObraPanel
            targetId={targetId}
            defaultDireccion={defaultDireccion}
            onClose={onClose}
            onConverted={onConverted}
          />
        </div>
      </div>
    </Modal>
  );
}