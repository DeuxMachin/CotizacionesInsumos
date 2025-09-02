// Funcionalidad de generación/descarga de PDF deshabilitada temporalmente.
// Evita importar módulos pesados (puppeteer/handlebars) y siempre informa al usuario.

export async function downloadServerDTE(): Promise<void> {
  if (typeof window !== "undefined") {
    alert("Descarga de PDF deshabilitada temporalmente.");
  }
}
