"use client";

import React from "react";
import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";
import { CLP, DTEDocument, calcularTotales } from "./ChileanTaxUtils";

const styles = StyleSheet.create({
  page: { padding: 24, fontFamily: "Helvetica", fontSize: 10 },
  row: { flexDirection: "row" },
  col: { flexGrow: 1 },
  card: { borderWidth: 1, borderColor: "#9ca3af", padding: 8 },
  h1: { fontSize: 14, fontWeight: 700 },
  h2: { fontSize: 12, fontWeight: 700 },
  small: { fontSize: 9, color: "#6b7280" },
  table: { borderWidth: 1, borderColor: "#9ca3af" },
  tr: { flexDirection: "row" },
  th: { padding: 6, borderRightWidth: 1, borderBottomWidth: 1, fontWeight: 700 },
  td: { padding: 6, borderRightWidth: 1, borderBottomWidth: 1 },
  rightBox: { width: 220, borderWidth: 1, borderColor: "#9ca3af", padding: 8 },
  headerBox: { borderWidth: 1, borderColor: "#9ca3af", padding: 8 },
});

export function DTEPdf({ doc }: { doc: DTEDocument }) {
  const totals = calcularTotales(doc);
  const numberCL = (n: number) => new Intl.NumberFormat("es-CL").format(n);
  const longDate = (iso: string) => {
    const d = new Date(iso);
    const day = d.toLocaleString("es-CL", { day: "numeric" });
    const month = d.toLocaleString("es-CL", { month: "long" });
    const year = d.toLocaleString("es-CL", { year: "numeric" });
    return `${day} de ${month} de ${year}`;
  };
  const tipoDisplay = (() => {
    switch (doc.tipo) {
      case "FACTURA":
      case "BOLETA":
      case "NOTA DE CRÉDITO":
      case "NOTA DE DÉBITO":
        return `${doc.tipo} ELECTRÓNICA`;
      default:
        return doc.tipo;
    }
  })();
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header con logo y caja de RUT/tipo a la derecha */}
        <View style={[styles.row, { justifyContent: "space-between", marginBottom: 10 }]}> 
          <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 8, flexGrow: 1 }}>
            {doc.emisor.logoUrl && (
              <Image src={doc.emisor.logoUrl} style={{ width: 110, height: 36 }} />
            )}
            <View style={{ flexGrow: 1 }}>
              {doc.emisor.encabezadoSuperior ? (
                <>
                  <Text style={styles.h2}>{doc.emisor.encabezadoSuperior}</Text>
                  {doc.emisor.encabezadoInferior && <Text style={styles.h2}>{doc.emisor.encabezadoInferior}</Text>}
                </>
              ) : (
                <Text style={styles.h2}>{doc.emisor.razonSocial}</Text>
              )}
              <Text>{doc.emisor.giro}</Text>
              <Text>Dirección: {doc.emisor.direccion}{doc.emisor.ciudad ? `, ${doc.emisor.ciudad}` : ""}</Text>
              {doc.emisor.email && <Text>Email: {doc.emisor.email}</Text>}
              {doc.emisor.telefono && <Text>Teléfono: {doc.emisor.telefono}</Text>}
            </View>
          </View>
          <View style={styles.rightBox}> 
            <Text style={styles.h2}>R.U.T.: {doc.emisor.rut}</Text>
            <Text style={[styles.h1, { textAlign: "center", marginTop: 4 }]}>{tipoDisplay}</Text>
            {doc.folio && <Text style={{ fontSize: 12, textAlign: "center" }}>N° {doc.folio}</Text>}
            {doc.sucursal && <Text style={{ textAlign: "center", marginTop: 4 }}>{doc.sucursal}</Text>}
          </View>
        </View>
        <View style={{ alignItems: "flex-end", marginBottom: 8 }}>
          <View style={{ borderWidth: 1, borderColor: "#9ca3af", padding: 4 }}>
            <Text>Fecha emisión: {longDate(doc.fechaEmision)}</Text>
          </View>
        </View>

        {/* Receptor */}
        <View style={[styles.headerBox, { marginBottom: 10 }]}> 
          {/* Fila 1: Señor(es) / RUT */}
          <View style={[styles.row, { gap: 12 }]}> 
            <View style={{ flex: 1 }}>
              <Text style={styles.small}>Señor(es):</Text>
              <Text>{doc.receptor.razonSocial}</Text>
            </View>
            <View style={{ width: 200 }}>
              <Text style={styles.small}>RUT:</Text>
              <Text>{doc.receptor.rut || "-"}</Text>
            </View>
          </View>
          {/* Fila 2: Dirección / Comuna */}
          <View style={[styles.row, { gap: 12, marginTop: 4 }]}> 
            <View style={{ flex: 1 }}>
              <Text style={styles.small}>Dirección:</Text>
              <Text>{doc.receptor.direccion || "-"}</Text>
            </View>
            <View style={{ width: 200 }}>
              <Text style={styles.small}>Comuna:</Text>
              <Text>{doc.receptor.comuna || "-"}</Text>
            </View>
          </View>
          {/* Fila 3: Giro / Ciudad */}
          <View style={[styles.row, { gap: 12, marginTop: 4 }]}> 
            <View style={{ flex: 1 }}>
              <Text style={styles.small}>Giro:</Text>
              <Text>{doc.receptor.giro || "-"}</Text>
            </View>
            <View style={{ width: 200 }}>
              <Text style={styles.small}>Ciudad:</Text>
              <Text>{doc.receptor.ciudad || "-"}</Text>
            </View>
          </View>
        </View>

        {/* Tabla items */}
        <View style={{ marginBottom: 10 }}>
          <View style={styles.table}>
            <View style={styles.tr}>
              <View style={[styles.td, { width: 90 }]}><Text style={styles.th}>Código</Text></View>
              <View style={[styles.td, { width: 250 }]}><Text style={styles.th}>Descripción</Text></View>
              <View style={[styles.td, { width: 50 }]}><Text style={{ textAlign: "right", fontWeight: 700 }}>Cant.</Text></View>
              <View style={[styles.td, { width: 70 }]}><Text style={{ textAlign: "right", fontWeight: 700 }}>Precio</Text></View>
              <View style={[styles.td, { width: 60 }]}><Text style={{ textAlign: "right", fontWeight: 700 }}>Dscto.(%)</Text></View>
              <View style={[styles.td, { width: 60 }]}><Text style={{ textAlign: "right", fontWeight: 700 }}>Recargo</Text></View>
              <View style={[styles.td, { width: 50 }]}><Text style={{ fontWeight: 700 }}>Af/Ex</Text></View>
              <View style={[styles.td, { width: 80 }]}><Text style={{ textAlign: "right", fontWeight: 700 }}>Valor</Text></View>
            </View>
            {doc.items.map((it, idx) => {
              const desc = it.descuentoPct ? (it.precio * it.descuentoPct) / 100 : 0;
              const precioFinal = Math.max(0, it.precio - desc);
              const recargo = it.recargo ? Math.round(it.recargo) : 0;
              const valor = Math.round(precioFinal * it.cantidad + recargo);
              return (
                <View key={idx} style={styles.tr}>
                  <View style={[styles.td, { width: 90 }]}><Text>{it.codigo}</Text></View>
                  <View style={[styles.td, { width: 250 }]}><Text>{it.descripcion}</Text></View>
                  <View style={[styles.td, { width: 50 }]}><Text style={{ textAlign: "right" }}>{it.cantidad}</Text></View>
                  <View style={[styles.td, { width: 70 }]}><Text style={{ textAlign: "right" }}>{numberCL(it.precio)}</Text></View>
                  <View style={[styles.td, { width: 60 }]}><Text style={{ textAlign: "right" }}>{it.descuentoPct ? `${it.descuentoPct}` : "0"}</Text></View>
                  <View style={[styles.td, { width: 60 }]}><Text style={{ textAlign: "right" }}>{recargo ? numberCL(recargo) : ""}</Text></View>
                  <View style={[styles.td, { width: 50 }]}><Text>{it.afecto === false ? "EXENTO" : "AFECTO"}</Text></View>
                  <View style={[styles.td, { width: 80 }]}><Text style={{ textAlign: "right" }}>{numberCL(valor)}</Text></View>
                </View>
              );
            })}
          </View>
        </View>

        {/* Línea resumen (N° líneas / Cant) */}
        <View style={{ borderTopWidth: 1, borderColor: "#9ca3af", marginTop: 6, paddingTop: 6 }}>
          <Text>N° líneas: {doc.items.length} / Cant: {doc.items.reduce((a, b) => a + (b.cantidad || 0), 0)}</Text>
        </View>

        {/* Totales (sin caja) */}
        <View style={{ marginTop: 8 }}>
          <View style={[styles.row, { justifyContent: "flex-end" }]}> 
            <View>
              <View style={[styles.row, { justifyContent: "space-between" }]}>
                <Text style={{ fontWeight: 700 }}>Subtotal: </Text>
                <Text>{CLP(totals.neto + (totals.exento || 0))}</Text>
              </View>
              <View style={[styles.row, { justifyContent: "space-between" }]}>
                <Text style={{ fontWeight: 700 }}>Descto. global: </Text>
                <Text>$0</Text>
              </View>
              <View style={[styles.row, { justifyContent: "space-between" }]}>
                <Text style={{ fontWeight: 700 }}>Monto neto: </Text>
                <Text>{CLP(totals.neto)}</Text>
              </View>
              <View style={[styles.row, { justifyContent: "space-between" }]}>
                <Text style={{ fontWeight: 700 }}>IVA (19%): </Text>
                <Text>{CLP(totals.iva)}</Text>
              </View>
              <View style={[styles.row, { justifyContent: "space-between", marginTop: 4 }]}> 
                <Text style={{ fontWeight: 700 }}>Total: </Text>
                <Text style={{ fontWeight: 700 }}>{CLP(totals.total)}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Referencias */}
        {doc.referencias && doc.referencias.length > 0 && (
          <View style={{ marginTop: 10, borderTopWidth: 1, borderColor: "#9ca3af", paddingTop: 6 }}>
            <Text>
              <Text style={{ fontWeight: 700 }}>Referencias: </Text>
              {doc.referencias.join(" | ")}
            </Text>
          </View>
        )}

        {/* Observaciones */}
        {doc.observaciones !== undefined && (
          <View style={{ marginTop: 6 }}>
            <Text>
              <Text style={{ fontWeight: 700 }}>Observaciones: </Text>
              {doc.observaciones || ""}
            </Text>
          </View>
        )}
      </Page>
    </Document>
  );
}
