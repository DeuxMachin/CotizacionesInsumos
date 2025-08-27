"use client";

// Este componente ya no se usa activamente, pero lo mantenemos para compatibilidad
// Ya estamos utilizando ThemeProvider de next-themes en src/app/layout.tsx
import { ReactNode } from "react";

export function ThemeProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
