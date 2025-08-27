/** @type {import('tailwindcss').Config} */

export default {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  darkMode: "class", // Habilita el modo oscuro basado en clase
  theme: {
    extend: {
      colors: {
        // Extendemos la paleta de colores para el tema
        primary: "var(--bg-primary)",
        secondary: "var(--bg-secondary)",
        accent: {
          from: "var(--accent-from)",
          to: "var(--accent-to)",
          text: "var(--accent-text)",
          soft: "var(--accent-bg-soft)",
        }
      },
      backgroundColor: {
        primary: "var(--bg-primary)",
        secondary: "var(--bg-secondary)",
        card: "var(--card-bg)",
      },
      textColor: {
        primary: "var(--text-primary)",
        secondary: "var(--text-secondary)",
      },
      borderColor: {
        primary: "var(--border)",
      },
    },
  },
  plugins: [],
  // Esto es importante para asegurarnos de que las clases se generen correctamente
  safelist: [
    'dark',
    'light',
    'dark:bg-gray-700',
    'dark:bg-gray-800',
    'dark:bg-gray-900',
    'dark:text-white',
    'dark:text-gray-100',
    'dark:text-gray-200',
    'dark:text-gray-300',
    'dark:text-gray-400',
    'dark:border-gray-600',
    'dark:border-gray-700',
    'dark:border-gray-800',
    'dark:hover:bg-gray-700',
    'dark:hover:bg-gray-800',
    'dark:hover:border-gray-600',
    'dark:hover:text-gray-100',
    'dark:focus:ring-orange-700',
    'dark:focus:border-orange-500'
  ],
};
