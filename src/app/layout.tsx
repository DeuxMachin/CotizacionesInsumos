// app/layout.tsx
export const metadata = { title: "Panel Administrativo - Cotizaciones" };

import "./globals.css";
import { Playfair_Display, Source_Sans_3 } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { AuthorizationMiddleware } from "@/middleware/AuthorizationMiddleware";
import Script from "next/script";

const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-display" });
const sourceSans = Source_Sans_3({ subsets: ["latin"], variable: "--font-sans" });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${sourceSans.variable} ${playfair.variable}`} suppressHydrationWarning>
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
      <body className="antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
          storageKey="theme"
        >
          <AuthorizationMiddleware>
            {children}
          </AuthorizationMiddleware>
        </ThemeProvider>
      </body>
    </html>
  );
}
