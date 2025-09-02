"use client";

import dynamic from "next/dynamic";

const AdminPanel = dynamic(() => import("@/features/admin/ui/AdminPanel").then(mod => mod.AdminPanel), { 
  ssr: false,
  loading: () => (
    <div className="space-y-6 animate-fadeIn">
      <div className="h-8 rounded w-48 mb-4 animate-pulse" style={{ backgroundColor: 'var(--bg-secondary)' }} />
      <div className="h-4 rounded w-96 mb-6 animate-pulse" style={{ backgroundColor: 'var(--bg-secondary)' }} />
      <div className="h-12 rounded w-full mb-6 animate-pulse" style={{ backgroundColor: 'var(--bg-secondary)' }} />
      <div className="h-96 rounded w-full animate-pulse" style={{ backgroundColor: 'var(--bg-secondary)' }} />
    </div>
  )
});

export default function AdminPage() {
  return <AdminPanel />;
}
