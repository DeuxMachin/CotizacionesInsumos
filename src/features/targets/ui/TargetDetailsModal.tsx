"use client";

import { Modal } from "@/shared/ui/Modal";
import type { PosibleTarget } from "../model/types";

interface TargetDetailsModalProps {
  target: PosibleTarget;
  isOpen: boolean;
  onClose: () => void;
}

export function TargetDetailsModal({ target, isOpen, onClose }: TargetDetailsModalProps) {
  return (
    <Modal open={isOpen} onClose={onClose}>
      <div className="p-6">
        <h2 className="text-xl font-bold mb-4">{target.titulo}</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">{target.descripcion}</p>
        <div className="space-y-2">
          <p><strong>Estado:</strong> {target.estado}</p>
          <p><strong>Prioridad:</strong> {target.prioridad}</p>
          <p><strong>Ubicación:</strong> {target.ubicacion.direccion}</p>
          {target.contacto.nombre && (
            <p><strong>Contacto:</strong> {target.contacto.nombre}</p>
          )}
          {target.contacto.telefono && (
            <p><strong>Teléfono:</strong> {target.contacto.telefono}</p>
          )}
        </div>
      </div>
    </Modal>
  );
}