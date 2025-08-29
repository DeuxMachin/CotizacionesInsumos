"use client";

import React from "react";

export function PeriodToggle({ value, onChange }: { value: "month" | "year"; onChange: (v: "month" | "year") => void }) {
  return (
    <div 
      className="inline-flex rounded-lg overflow-hidden"
      style={{ 
        backgroundColor: 'var(--bg-primary)',
        border: '1px solid var(--border-subtle)'
      }}
    >
      <button
        className="px-3 py-1.5 text-sm transition-colors"
        style={{
          backgroundColor: value === "month" ? 'var(--accent-bg)' : 'transparent',
          color: value === "month" ? 'var(--accent-primary)' : 'var(--text-secondary)'
        }}
        onMouseEnter={(e) => {
          if (value !== "month") {
            e.currentTarget.style.backgroundColor = 'var(--bg-secondary)';
          }
        }}
        onMouseLeave={(e) => {
          if (value !== "month") {
            e.currentTarget.style.backgroundColor = 'transparent';
          }
        }}
        onClick={() => onChange("month")}
      >
        Mes
      </button>
      <button
        className="px-3 py-1.5 text-sm transition-colors"
        style={{
          borderLeft: '1px solid var(--border-subtle)',
          backgroundColor: value === "year" ? 'var(--accent-bg)' : 'transparent',
          color: value === "year" ? 'var(--accent-primary)' : 'var(--text-secondary)'
        }}
        onMouseEnter={(e) => {
          if (value !== "year") {
            e.currentTarget.style.backgroundColor = 'var(--bg-secondary)';
          }
        }}
        onMouseLeave={(e) => {
          if (value !== "year") {
            e.currentTarget.style.backgroundColor = 'transparent';
          }
        }}
        onClick={() => onChange("year")}
      >
        Año
      </button>
    </div>
  );
}
