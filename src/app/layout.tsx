export const metadata = { title: "Panel Administrativo - Cotizaciones" };

import "./globals.css";
import { Playfair_Display, Source_Sans_3 } from "next/font/google";

const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-display" });
const sourceSans = Source_Sans_3({ subsets: ["latin"], variable: "--font-sans" });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${sourceSans.variable} ${playfair.variable}`}>
      <body>{children}</body>
    </html>
  );
}
