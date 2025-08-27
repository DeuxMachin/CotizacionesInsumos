"use client";

import React from "react";

export function PeriodToggle({ value, onChange }: { value: "month" | "year"; onChange: (v: "month" | "year") => void }) {
  return (
    <div className="inline-flex rounded-lg border border-gray-200 bg-white overflow-hidden">
      <button
        className={`px-3 py-1.5 text-sm ${value === "month" ? "bg-orange-50 text-orange-700" : "text-gray-700 hover:bg-gray-50"}`}
        onClick={() => onChange("month")}
      >Mes</button>
      <button
        className={`px-3 py-1.5 text-sm border-l border-gray-200 dark:border-gray-700 ${value === "year" ? "bg-orange-50 text-orange-700" : "text-gray-700 hover:bg-gray-50"}`}
        onClick={() => onChange("year")}
      >Año</button>
    </div>
  );
}
