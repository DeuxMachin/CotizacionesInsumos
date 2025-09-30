'use client';

import React from "react";
import Link from "next/link";

type TocItem = { id: string; label: string };
export default function LegalShell({
  title,
  version = "1.1",
  updatedAt = new Date(),
  toc = [],
  children,
}: {
  title: string;
  version?: string;
  updatedAt?: Date;
  toc?: TocItem[];
  children: React.ReactNode;
}) {
  const fechaCL = updatedAt.toLocaleDateString("es-CL", { day: "2-digit", month: "2-digit", year: "numeric" });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-100 dark:via-slate-200 dark:to-slate-300">
      {/* HERO */}
      <header className="relative overflow-hidden bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 dark:from-blue-600 dark:via-indigo-600 dark:to-purple-600">
        <div className="absolute inset-0 bg-black/5 dark:bg-black/10"></div>
        <div className="relative mx-auto max-w-6xl px-6 py-16 md:py-20">
          <nav aria-label="breadcrumb" className="text-sm text-white/90 mb-4">
            <ol className="flex gap-2">
              <li><Link className="hover:text-white transition-colors" href="/">Inicio</Link></li>
              <li aria-hidden className="text-white/70">/</li>
              <li className="text-white font-medium">{title}</li>
            </ol>
          </nav>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight tracking-tight">
            {title}
          </h1>
          <div className="mt-6 flex flex-wrap items-center gap-4 text-white/90">
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 border border-white/20">
              <span className="text-sm font-medium text-white">Versión {version}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-white/90">Última actualización: <strong className="text-white">{fechaCL}</strong></span>
            </div>
          </div>
        </div>
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -translate-y-48 translate-x-48"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full translate-y-32 -translate-x-32"></div>
      </header>

      {/* CONTENIDO + TOC */}
      <main className="relative mx-auto max-w-7xl px-6 py-12 md:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-[280px_minmax(0,1fr)] gap-12">
          {/* TOC */}
          <aside className="hidden lg:block">
            <div className="sticky top-8">
              <nav aria-label="Índice de contenidos" className="bg-white dark:bg-slate-50 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-300 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-1 h-6 bg-gradient-to-b from-blue-400 to-purple-400 rounded-full"></div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-800 uppercase tracking-wide">Contenido</p>
                </div>
                <ul className="space-y-2">
                  {toc.map((item) => (
                    <li key={item.id}>
                      <a
                        href={`#${item.id}`}
                        className="block rounded-lg px-3 py-2 text-sm text-slate-700 dark:text-slate-600 hover:text-slate-900 dark:hover:text-slate-800 hover:bg-slate-50 dark:hover:bg-slate-100 transition-all duration-200 font-medium"
                      >
                        {item.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
            </div>
          </aside>

          {/* BODY */}
          <article className="prose prose-lg max-w-none">
            <div className="bg-white dark:bg-slate-50 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-300 p-8 md:p-12">
              <div className="prose-headings:text-slate-900 dark:prose-headings:text-slate-800 prose-headings:font-bold prose-headings:tracking-tight prose-p:text-slate-800 dark:prose-p:text-slate-700 prose-p:leading-relaxed prose-strong:text-slate-900 dark:prose-strong:text-slate-800 prose-ul:text-slate-800 dark:prose-ul:text-slate-700 prose-li:text-slate-800 dark:prose-li:text-slate-700 max-w-none">
                {children}
              </div>
            </div>

            {/* Back to top */}
            <div className="mt-12 text-center">
              <a
                href="#top"
                className="inline-flex items-center gap-2 text-slate-700 dark:text-slate-600 hover:text-slate-900 dark:hover:text-slate-800 transition-colors font-medium"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
                Volver arriba
              </a>
            </div>
          </article>
        </div>
      </main>

     

      {/* PRINT: oculta TOC, bordes y fondos para PDF limpio */}
      <style jsx global>{`
        @media print {
          header, footer, aside, nav, .backdrop-blur, .shadow-lg, .shadow-xl { display: none !important; }
          main { padding: 0 !important; }
          article > div { border: none !important; background: white !important; box-shadow: none !important; }
          a[href]:after { content: "" !important; }
          body { background: white !important; }
        }
      `}</style>
    </div>
  );
}
