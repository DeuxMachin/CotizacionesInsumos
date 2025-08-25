import Handlebars from "handlebars";
import puppeteer from "puppeteer";

export type HtmlPdfData = Record<string, any>;

export async function renderHtmlWithTemplate(templateSource: string, data: HtmlPdfData) {
  const template = Handlebars.compile(templateSource, { noEscape: true });
  return template(data);
}

export async function renderPdfFromHtml(html: string) {
  const browser = await puppeteer.launch({ args: ["--no-sandbox", "--font-render-hinting=none"] });
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });
    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      preferCSSPageSize: true,
      margin: { top: "0", right: "0", bottom: "0", left: "0" }
    });
    await page.close();
    return pdf;
  } finally {
    await browser.close();
  }
}
