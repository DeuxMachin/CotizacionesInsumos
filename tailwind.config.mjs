/** @type {import('tailwindcss').Config} */

export default {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  darkMode: "class", // Habilita el modo oscuro basado en clase
  theme: {
    extend: {
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
  plugins: [],
};
