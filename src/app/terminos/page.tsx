import React from "react";
import LegalShell from "@/components/legal/LegalShell";
export default function TerminosPage() {
  const fecha = new Date().toLocaleDateString("es-CL", { day: "2-digit", month: "2-digit", year: "numeric" });

  const toc = [
    { id: "definiciones", label: "1. Definiciones" },
    { id: "aceptacion", label: "2. Aceptación" },
    { id: "servicio", label: "3. Descripción del Servicio" },
    { id: "cuentas", label: "4. Registro y Cuentas" },
    { id: "uso", label: "5. Uso Aceptable" },
    { id: "propiedad", label: "6. Contenido y Propiedad Intelectual" },
    { id: "privacidad", label: "7. Privacidad y Datos" },
    { id: "disponibilidad", label: "8. Disponibilidad" },
    { id: "precios", label: "9. Precios y Pagos" },
    { id: "responsabilidad", label: "10. Responsabilidad" },
    { id: "indemnizacion", label: "11. Indemnización" },
    { id: "terminacion", label: "12. Terminación" },
    { id: "modificaciones", label: "13. Modificaciones" },
    { id: "ley", label: "14. Ley Aplicable" },
    { id: "disputas", label: "15. Disputas" },
    { id: "generales", label: "16. Disposiciones Generales" },
    { id: "retracto", label: "17. Retracto (e-commerce)" },
    { id: "contacto", label: "18. Contacto" },
  ];

  return (
    <LegalShell
      title="Términos y Condiciones de Servicio"
      version="1.1"
      updatedAt={new Date()}
      toc={toc}
    >
          <section id="definiciones" className="mb-8 scroll-mt-24">
            <h2 className="text-2xl font-semibold">1. Definiciones</h2>
            <ul className="list-disc pl-6 mt-3">
              <li><strong>“Servicio”</strong>: la plataforma web de gestión de cotizaciones y funcionalidades asociadas.</li>
              <li><strong>“Usuario”</strong>: persona natural o jurídica que accede o utiliza el Servicio.</li>
              <li><strong>“Contenido del Usuario”</strong>: información o materiales que el Usuario ingresa en el Servicio.</li>
              <li><strong>“Datos Personales”</strong>: información sobre personas naturales identificadas o identificables.</li>
              <li><strong>“Proveedor”</strong>: la entidad que opera el Servicio (en adelante, “la Empresa”).</li>
            </ul>
          </section>

          <section id="aceptacion" className="mb-8 scroll-mt-24">
            <h2 className="text-2xl font-semibold">2. Aceptación</h2>
            <p>Al acceder o usar el Servicio declara que ha leído y acepta estos términos; que posee capacidad legal; y, cuando actúa por cuenta de una empresa, que cuenta con facultades suficientes. Si no está de acuerdo, debe abstenerse de usar el Servicio.</p>
          </section>

          <section id="servicio" className="mb-8 scroll-mt-24">
            <h2 className="text-2xl font-semibold">3. Descripción del Servicio</h2>
            <p>El Servicio es un software de tipo SaaS para gestión de cotizaciones, clientes, reportes (p. ej., PDF/XLSX), inventario, estadísticas, autenticación/autorización y APIs de integración. La disponibilidad objetivo es 99,5% mensual, pudiendo existir mantenciones programadas o contingencias técnicas.</p>
          </section>

          <section id="cuentas" className="mb-8 scroll-mt-24">
            <h2 className="text-2xl font-semibold ">4. Registro y Cuentas</h2>
            <ul className="list-disc pl-6">
              <li>Proveer información veraz y mantenerla actualizada.</li>
              <li>Proteger credenciales; notificar accesos no autorizados.</li>
              <li>No compartir cuentas ni suplantar identidades.</li>
              <li>Usar correos válidos y de su titularidad.</li>
            </ul>
          </section>

          <section id="uso" className="mb-8 scroll-mt-24">
            <h2 className="text-2xl font-semibold ">5. Uso Aceptable y Prohibiciones</h2>
            <p>Se permite el uso legítimo y conforme a derecho del Servicio para fines empresariales. Está prohibido, entre otros: vulnerar la ley o derechos de terceros; acceder sin autorización; distribuir código malicioso; defraudar; enviar spam; descompilar o hacer ingeniería inversa; usar el Servicio para competir deslealmente; o exceder límites que afecten la estabilidad del sistema.</p>
          </section>

          <section id="propiedad" className="mb-8 scroll-mt-24">
            <h2 className="text-2xl font-semibold ">6. Contenido del Usuario y Propiedad Intelectual</h2>
            <p>El Usuario mantiene la titularidad sobre su Contenido y otorga a la Empresa una licencia limitada para alojarlo, procesarlo y mostrarlo con el único fin de prestar el Servicio. El software, interfaces, diseños, bases de datos y documentación del Servicio son propiedad de la Empresa o sus licenciantes.</p>
          </section>

          <section id="privacidad" className="mb-8 scroll-mt-24">
            <h2 className="text-2xl font-semibold ">7. Privacidad y Protección de Datos</h2>
            <p>El tratamiento de Datos Personales se rige por la <em>Política de Privacidad</em> y por la normativa chilena vigente, incluyendo la Ley N° 19.628. Cuando proceda, se aplicarán además buenas prácticas del Reglamento de Comercio Electrónico y leyes de consumo.</p>
          </section>

          <section id="disponibilidad" className="mb-8 scroll-mt-24">
            <h2 className="text-2xl font-semibold ">8. Disponibilidad y Mantenimiento</h2>
            <ul className="list-disc pl-6">
              <li>Las mantenciones programadas se comunicarán con 48 horas de antelación cuando sea posible.</li>
              <li>Las mantenciones de emergencia pueden ejecutarse sin aviso previo para resguardar seguridad/estabilidad.</li>
            </ul>
          </section>

          <section id="precios" className="mb-8 scroll-mt-24">
            <h2 className="text-2xl font-semibold ">9. Precios y Pagos</h2>
            <p>Los precios y condiciones vigentes se informan previamente y de forma clara (precio total, impuestos, cargos, medios de pago, restricciones y plazos). La facturación puede ser mensual o anual con renovación automática, salvo cancelación o políticas específicas informadas.</p>
          </section>

          <section id="responsabilidad" className="mb-8 scroll-mt-24">
            <h2 className="text-2xl font-semibold ">10. Limitación de Responsabilidad</h2>
            <p>En la máxima medida permitida por la ley, la Empresa no responde por daños indirectos, pérdida de datos, lucro cesante ni interrupciones del negocio. La responsabilidad total, de existir, se limita a los pagos efectivamente realizados por el Usuario en los 12 meses previos al evento.</p>
          </section>

          <section id="indemnizacion" className="mb-8 scroll-mt-24">
            <h2 className="text-2xl font-semibold ">11. Indemnización</h2>
            <p>El Usuario mantendrá indemne a la Empresa frente a reclamos derivados de su uso del Servicio, infracción de estos términos o vulneración de derechos de terceros.</p>
          </section>

          <section id="terminacion" className="mb-8 scroll-mt-24">
            <h2 className="text-2xl font-semibold ">12. Terminación</h2>
            <p>El Usuario puede cerrar su cuenta en cualquier momento. La Empresa podrá suspender o terminar el acceso ante incumplimientos graves, fraude, impago o riesgos de seguridad.</p>
          </section>

          <section id="modificaciones" className="mb-8 scroll-mt-24">
            <h2 className="text-2xl font-semibold ">13. Modificaciones</h2>
            <p>Los términos pueden actualizarse. Los cambios regirán desde su publicación y, en casos relevantes, se informarán por medios idóneos con antelación razonable.</p>
          </section>

          <section id="ley" className="mb-8 scroll-mt-24">
            <h2 className="text-2xl font-semibold ">14. Ley Aplicable y Jurisdicción</h2>
            <p>Estos términos se rigen por las leyes de la República de Chile. Cualquier controversia se someterá a los tribunales ordinarios de justicia de Temuco, Región de La Araucanía.</p>
          </section>

          <section id="disputas" className="mb-8 scroll-mt-24">
            <h2 className="text-2xl font-semibold ">15. Resolución de Disputas</h2>
            <p>Antes de acudir a tribunales, las partes procurarán una solución mediante negociación de buena fe y, si corresponde, mediación.</p>
          </section>

          <section id="generales" className="mb-8 scroll-mt-24">
            <h2 className="text-2xl font-semibold ">16. Disposiciones Generales</h2>
            <ul className="list-disc pl-6">
              <li><strong>Divisibilidad:</strong> la nulidad de una cláusula no afecta el resto.</li>
              <li><strong>Cesión:</strong> el Usuario no podrá ceder su posición contractual sin autorización previa por escrito.</li>
              <li><strong>Integridad:</strong> estos términos constituyen el acuerdo íntegro sobre el Servicio.</li>
              <li><strong>Contratación electrónica:</strong> las manifestaciones de voluntad por medios electrónicos y el uso de firmas electrónicas se rigen por la Ley N° 19.799.</li>
            </ul>
          </section>

          <section id="retracto" className="mb-8 scroll-mt-24">
            <h2 className="text-2xl font-semibold ">17. Derecho a Retracto (comercio electrónico)</h2>
            <p>De conformidad con la Ley N° 19.496 sobre Protección de los Derechos de los Consumidores, el consumidor tiene derecho a retractarse de la contratación efectuada por medios remotos dentro del plazo de 10 días corridos desde la celebración del contrato, sin expresión de causa y sin penalidad alguna. El retracto deberá ejercerse por escrito ante el proveedor.</p>
          </section>

          <section id="contacto" className="mb-0 scroll-mt-24">
            <h2 className="text-2xl font-semibold ">18. Contacto</h2>
            <p>Escríbanos mediante el enlace de contacto en el pie de página de la aplicación. Canalizamos soporte, solicitudes de consumidores y requerimientos de autoridades por esa vía.</p>
          </section>
    </LegalShell>
  );
}
