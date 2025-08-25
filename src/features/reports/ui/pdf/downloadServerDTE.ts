import type { DTEDocument } from "./ChileanTaxUtils";

export async function downloadServerDTE(doc: DTEDocument, filename?: string) {
  const res = await fetch("/api/dte", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(doc),
  });
  if (!res.ok) throw new Error("PDF render failed");
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename || `DTE_${doc.tipo}_${doc.folio || "s-n"}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
