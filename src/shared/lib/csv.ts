import { Quote } from "@/entities/quote/model/types";

export function quotesToCSV(data: Quote[]) {
  const headers = ["ID","Cliente","Fecha","Estado","Monto"].join(",");
  const rows = data.map(q => [q.id, q.client, q.date, q.status, q.amount].join(","));
  return [headers, ...rows].join("\n");
}

export function downloadCSV(content: string, filename: string) {
  const blob = new Blob([content], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
}
