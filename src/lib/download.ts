// Minimal helper to trigger a file download from a fetch Response in the browser
// Used by client components to download generated files from API endpoints
export async function downloadFileFromResponse(response: Response, filename: string): Promise<void> {
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}
