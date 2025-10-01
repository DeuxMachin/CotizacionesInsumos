"use client";
import { QuoteStatus } from "@/core/domain/quote/Quote";

// Definir colores usando variables CSS del tema
const getStatusColors = (status: QuoteStatus) => {
  const colorMap: Record<QuoteStatus, { bg: string; text: string }> = {
    borrador: { bg: 'var(--warning-bg)', text: 'var(--warning-text)' },
    enviada: { bg: 'var(--info-bg)', text: 'var(--info-text)' },
    aceptada: { bg: 'var(--success-bg)', text: 'var(--success-text)' },
    rechazada: { bg: 'var(--danger-bg)', text: 'var(--danger-text)' },
    expirada: { bg: 'var(--neutral-bg)', text: 'var(--neutral-text)' }
  };
  return colorMap[status] || colorMap.borrador;
};

const statusLabels: Record<QuoteStatus, string> = {
  borrador: "Borrador",
  enviada: "Enviada",
  aceptada: "Aceptada",
  rechazada: "Rechazada",
  expirada: "Expirada"
};

export function Badge({ status }: { status: QuoteStatus }) {
  const colors = getStatusColors(status);
  return (
    <span
      className="inline-block px-2.5 py-1 text-xs font-semibold rounded-2xl transition-colors"
      style={{ backgroundColor: colors.bg, color: colors.text }}
    >
      {statusLabels[status]}
    </span>
  );
}
