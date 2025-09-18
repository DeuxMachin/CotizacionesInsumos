/** @type {import('tailwindcss').Config} */

export default {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  darkMode: "class", // Habilita el modo oscuro basado en clase
  theme: {
    extend: {
      // Configuración de fuentes profesionales
      fontFamily: {
        'sans': ['var(--font-sans)', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
        'display': ['var(--font-display)', 'Lexend', 'system-ui', '-apple-system', 'sans-serif'],
        'mono': ['var(--font-mono)', 'JetBrains Mono', 'SF Mono', 'Consolas', 'Liberation Mono', 'Menlo', 'monospace']
      },
      // Tamaños de fuente más pequeños y proporcionales
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'base': ['0.875rem', { lineHeight: '1.5rem' }], // Cambio principal: base más pequeño
        'lg': ['1rem', { lineHeight: '1.5rem' }],
        'xl': ['1.125rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.25rem', { lineHeight: '1.75rem' }],
        '3xl': ['1.5rem', { lineHeight: '2rem' }],
        '4xl': ['1.75rem', { lineHeight: '2.25rem' }],
        '5xl': ['2rem', { lineHeight: '2.5rem' }],
        '6xl': ['2.25rem', { lineHeight: '2.75rem' }],
      },
      colors: {
        // Colores personalizados usando variables CSS
        theme: {
          bg: {
            primary: "var(--bg-primary)",
            secondary: "var(--bg-secondary)",
            sidebar: "var(--bg-sidebar)",
          },
          text: {
            primary: "var(--text-primary)",
            secondary: "var(--text-secondary)",
            muted: "var(--text-muted)",
          },
          border: {
            DEFAULT: "var(--border)",
            light: "var(--border-light)",
          },
          accent: {
            primary: "var(--accent-primary)",
            secondary: "var(--accent-secondary)",
            hover: "var(--accent-hover)",
            soft: "var(--accent-soft)",
            bg: "var(--accent-bg)",
          },
          success: "var(--success)",
          warning: "var(--warning)",
          danger: "var(--danger)",
          info: "var(--info)",
        },
      },
      backgroundColor: {
        'theme-primary': "var(--bg-primary)",
        'theme-secondary': "var(--bg-secondary)",
        'theme-card': "var(--card-bg)",
        'theme-accent': "var(--accent-bg)",
      },
      textColor: {
        'theme-primary': "var(--text-primary)",
        'theme-secondary': "var(--text-secondary)",
        'theme-muted': "var(--text-muted)",
      },
      borderColor: {
        'theme-primary': "var(--border)",
        'theme-light': "var(--border-light)",
        'theme-subtle': "var(--border-subtle)",
      },
      boxShadow: {
        'theme-sm': "var(--shadow-sm)",
        'theme': "var(--shadow)",
        'theme-md': "var(--shadow-md)",
      },
    },
  },
  plugins: [
    require('@tailwindcss/line-clamp'),
  ],
};
