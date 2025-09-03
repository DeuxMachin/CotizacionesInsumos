"use client";

import dynamic from "next/dynamic";

const NewClientPage = dynamic(() => import("@/features/clients/ui/NewClientPage"), { 
  ssr: false,
  loading: () => (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-primary)' }}>
      {/* Header skeleton */}
      <div 
        className="sticky top-0 z-10 border-b"
        style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border)' }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <div className="h-9 w-9 rounded-lg animate-pulse" style={{ backgroundColor: 'var(--bg-secondary)' }} />
              <div className="h-6 w-48 rounded animate-pulse" style={{ backgroundColor: 'var(--bg-secondary)' }} />
            </div>
            <div className="flex items-center gap-2">
              <div className="h-9 w-32 rounded animate-pulse" style={{ backgroundColor: 'var(--bg-secondary)' }} />
              <div className="h-9 w-24 rounded animate-pulse" style={{ backgroundColor: 'var(--bg-secondary)' }} />
            </div>
          </div>
        </div>
      </div>

      {/* Content skeleton */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div 
          className="rounded-lg p-6 space-y-6"
          style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)' }}
        >
          {[...Array(6)].map((_, i) => (
            <div key={i} className="space-y-3">
              <div className="h-4 w-32 rounded animate-pulse" style={{ backgroundColor: 'var(--bg-secondary)' }} />
              <div className="h-10 w-full rounded animate-pulse" style={{ backgroundColor: 'var(--bg-secondary)' }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
});

export default function NuevoClientePage() {
  return <NewClientPage />;
}
