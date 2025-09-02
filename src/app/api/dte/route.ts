export const runtime = "nodejs";

// No-op temporal: deshabilitar generación de PDF
export async function POST() {
  return new Response(JSON.stringify({ error: "PDF generation is disabled" }), { status: 501 });
}
