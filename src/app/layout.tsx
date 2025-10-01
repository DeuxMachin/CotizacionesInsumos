// app/layout.tsx
import "./globals.css";
import { Inter, JetBrains_Mono, Lexend } from "next/font/google";
import { ThemeProvider } from "next-themes";
import Script from "next/script";
import { AuthInitializer } from "@/components/AuthInitializer";
import { AuthProvider } from "@/contexts/AuthContext";
import { Footer } from "@/components/Footer";
import { CookieConsent } from "@/components/CookieConsent";
import type { Metadata } from "next";

export const metadata: Metadata = { 
  title: "Panel Administrativo - Cotizaciones",
  description: "Sistema de gestión de cotizaciones"
};

// Fuente principal para texto general - muy profesional y legible
const inter = Inter({ 
  subsets: ["latin"], 
  variable: "--font-sans",
  display: "swap"
});

// Fuente para títulos - diseñada para mejor legibilidad
const lexend = Lexend({ 
  subsets: ["latin"], 
  variable: "--font-display",
  display: "swap"
});

// Fuente monospace para código y números
const jetbrainsMono = JetBrains_Mono({ 
  subsets: ["latin"], 
  variable: "--font-mono",
  display: "swap"
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${inter.variable} ${lexend.variable} ${jetbrainsMono.variable}`} suppressHydrationWarning>
      <head>
        {/* Evita parpadeo y asegura .dark en SSR */}
        <Script
          id="theme-script"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  document.documentElement.classList.remove('dark');
                  const saved = localStorage.getItem('theme');
                  let theme; try { theme = JSON.parse(saved); } catch { theme = saved; }
                  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  if (theme === 'dark' || (theme === 'system' && prefersDark) || (!theme && prefersDark)) {
                    document.documentElement.classList.add('dark');
                    document.documentElement.classList.remove('light');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                } catch (e) { /* noop */ }
              })();
            `,
          }}
        />
      </head>
      <body className="antialiased min-h-screen flex flex-col">
        <AuthProvider>
          <AuthInitializer />
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem
            disableTransitionOnChange
            storageKey="theme"
          >
            <div className="flex-1 flex flex-col">
              {children}
            </div>
            <CookieConsent />
            <Footer />
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
