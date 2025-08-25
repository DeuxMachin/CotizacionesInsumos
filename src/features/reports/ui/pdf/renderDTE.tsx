"use client";

import React from "react";
import { pdf } from "@react-pdf/renderer";
import { DTEPdf } from "./DTEPdf";
import type { DTEDocument } from "./ChileanTaxUtils";

export async function downloadDTE(doc: DTEDocument, filename?: string) {
  // Usar pdf() con una función que devuelva un Document; encapsulamos para evitar JSX directo en algunos parsers
  const instance = pdf();
  instance.updateContainer(<DTEPdf doc={doc} />);
  const blob = await instance.toBlob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename || `DTE_${doc.tipo}_${doc.folio || "s-n"}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
