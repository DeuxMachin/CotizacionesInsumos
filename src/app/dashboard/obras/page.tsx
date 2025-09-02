"use client";

import dynamic from "next/dynamic";

const ObrasPage = dynamic(() => import("@/features/obras/ui/ObrasPage").then(mod => mod.ObrasPage), { 
  ssr: false,
  loading: () => (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex justify-between items-center">
        <div className="h-8 rounded w-48 animate-pulse" style={{ backgroundColor: 'var(--bg-secondary)' }} />
        <div className="h-10 rounded w-40 animate-pulse" style={{ backgroundColor: 'var(--bg-secondary)' }} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-64 rounded-lg animate-pulse" style={{ backgroundColor: 'var(--bg-secondary)' }} />
        ))}
      </div>
    </div>
  )
});

export default function ObrasPageRoute() {
  return <ObrasPage />;
}
