import { NextRequest } from "next/server";
import { readFile } from "fs/promises";
import path from "node:path";
import { mapToTemplateModel } from "@/features/reports/ui/pdf/server/mapToTemplate";
import { renderHtmlWithTemplate, renderPdfFromHtml } from "@/features/reports/ui/pdf/server/renderHtmlPdf";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const doc = await req.json();
    const data = mapToTemplateModel(doc);
    // Resolve logo to data URI if it's a local /public path
    if (data.logo_url && !data.logo_url.startsWith("http") && !data.logo_url.startsWith("data:")) {
      let logoPath = data.logo_url;
      if (logoPath.startsWith("/")) {
        logoPath = path.join(process.cwd(), "public", logoPath.replace(/^\//, ""));
      } else if (!path.isAbsolute(logoPath)) {
        // fallback: relative to project root
        logoPath = path.join(process.cwd(), logoPath);
      }
      try {
        const buf = await readFile(logoPath);
        const ext = path.extname(logoPath).toLowerCase();
        const mime = ext === ".png" ? "image/png"
          : ext === ".jpg" || ext === ".jpeg" ? "image/jpeg"
          : ext === ".svg" || ext === ".svgz" ? "image/svg+xml" : "application/octet-stream";
        const b64 = buf.toString("base64");
        data.logo_url = `data:${mime};base64,${b64}`;
      } catch {}
    }
  const tplPath = path.join(process.cwd(), "src", "features", "reports", "ui", "pdf", "template", "dte-template.hbs");
  const template = await readFile(tplPath, "utf8");
  const html = await renderHtmlWithTemplate(template, data);
  const pdf = await renderPdfFromHtml(html);
  const ab = new ArrayBuffer(pdf.length);
  const view = new Uint8Array(ab);
  view.set(pdf);
  return new Response(ab, { headers: { "Content-Type": "application/pdf" } });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || "render failed" }), { status: 500 });
  }
}
