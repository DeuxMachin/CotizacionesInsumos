export const metadata = { title: "Panel Administrativo - Cotizaciones" };

import "./globals.css";
import { Playfair_Display, Source_Sans_3 } from "next/font/google";
import { ThemeProvider } from "next-themes";
import Script from "next/script";
import { ThemeDebugger } from "@/features/theme/ui/ThemeDebugger";

const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-display" });
const sourceSans = Source_Sans_3({ subsets: ["latin"], variable: "--font-sans" });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${sourceSans.variable} ${playfair.variable}`} suppressHydrationWarning>
      <head>
        {/* Este script evita parpadeos del tema antes de cargar */}
        <Script
          id="theme-script"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  // Limpiar primero cualquier clase dark que pudiera estar presente
                  document.documentElement.classList.remove('dark');
                  
                  // Revisar preferencia guardada
                  const storageValue = localStorage.getItem('theme');
                  let theme;
                  try {
                    theme = JSON.parse(storageValue);
                  } catch {
                    theme = storageValue;
                  }

                  // Detectar preferencia del sistema
                  const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  
                  // Aplicar tema oscuro si:
                  // 1. El usuario ha seleccionado explícitamente el tema oscuro, o
                  // 2. El usuario ha seleccionado "system" y el sistema prefiere oscuro, o
                  // 3. No hay preferencia guardada y el sistema prefiere oscuro
                  if (
                    theme === 'dark' ||
                    (theme === 'system' && systemPrefersDark) ||
                    (!theme && systemPrefersDark)
                  ) {
                    document.documentElement.classList.add('dark');
                    document.documentElement.classList.remove('light');
                  } else {
                    // Asegurarnos que el tema claro se aplica correctamente
                    document.documentElement.classList.remove('dark');
                  }
                  
                  console.log('Theme script executed:', { 
                    theme, 
                    systemPrefersDark, 
                    isDarkMode: document.documentElement.classList.contains('dark')
                  });
                } catch (e) {
                  console.error('Error applying theme:', e);
                }
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
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
