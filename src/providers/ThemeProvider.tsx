"use client";

import { ThemeProvider as NextThemeProvider } from "next-themes";
import { ComponentProps } from "react";

type ThemeProviderProps = ComponentProps<typeof NextThemeProvider>;

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemeProvider {...props}>{children}</NextThemeProvider>;
}
