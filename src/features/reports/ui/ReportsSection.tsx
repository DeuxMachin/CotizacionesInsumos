"use client";

import React from "react";

export function ReportsSection({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3 sm:space-y-4">
      <div>
        <h2 className="text-base sm:text-lg font-semibold text-gray-900">{title}</h2>
        {description && <p className="text-sm text-gray-500 mt-0.5">{description}</p>}
      </div>
      <div className="grid gap-3 sm:gap-4 lg:gap-6 xl:grid-cols-2">
        {children}
      </div>
    </section>
  );
}
