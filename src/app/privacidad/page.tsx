import React from "react";
import LegalShell from "@/components/legal/LegalShell";
export default function PrivacidadPage() {
  const fecha = new Date().toLocaleDateString("es-CL", { day: "2-digit", month: "2-digit", year: "numeric" });

  const toc = [
    { id: "alcance", label: "1. Alcance y marco normativo" },
    { id: "responsable", label: "2. Responsable del tratamiento" },
    { id: "datos", label: "3. Datos que tratamos" },
    { id: "finalidades", label: "4. Finalidades y bases" },
    { id: "encargados", label: "5. Encargados y transferencias" },
    { id: "conservacion", label: "6. Plazos de conservación" },
    { id: "seguridad", label: "7. Seguridad" },
    { id: "derechos", label: "8. Derechos de titulares" },
    { id: "cookies", label: "9. Cookies" },
    { id: "incidentes", label: "10. Incidentes y notificación" },
    { id: "autoridades", label: "11. Autoridades y reclamos" },
    { id: "cambios", label: "12. Cambios a esta política" },
  ];

  return (
    <LegalShell
      title="Política de Privacidad y Protección de Datos Personales"
      version="1.1"
      updatedAt={new Date()}
      toc={toc}
    >
      <section id="alcance" className="mb-8 scroll-mt-24">
        <h2 className="text-2xl font-semibold">1. Alcance y marco normativo</h2>
        <p>Esta política aplica al uso del Servicio en Chile y a los titulares de datos que interactúan con la plataforma. El tratamiento se realiza conforme a la Ley N° 19.628 sobre protección de datos personales y normativa de consumo y comercio electrónico aplicable. Cuando operen transferencias o almacenamiento fuera de Chile, se aplicarán salvaguardas contractuales y de seguridad equivalentes.</p>
      </section>

      <section id="responsable" className="mb-8 scroll-mt-24">
        <h2 className="text-2xl font-semibold">2. Responsable del tratamiento</h2>
        <div className="rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
          <p className="mb-1"><strong>Identidad:</strong> La Empresa que opera la plataforma de cotizaciones.</p>
          <p className="mb-1"><strong>Canal de contacto:</strong> enlace de contacto disponible en el footer de la aplicación.</p>
          <p className="mb-0"><strong>Finalidades principales:</strong> prestación del Servicio, soporte, facturación y mejora continua.</p>
        </div>
      </section>

      <section id="datos" className="mb-8 scroll-mt-24">
        <h2 className="text-2xl font-semibold">3. Datos que tratamos</h2>
        <ul className="list-disc pl-6">
          <li><strong>Registro y perfil:</strong> nombre, correo, empresa, cargo, teléfono.</li>
          <li><strong>Facturación:</strong> RUT, dirección, medios de pago (tokenizados por el proveedor de pagos).</li>
          <li><strong>Operación del Servicio:</strong> contenidos cargados por el Usuario (p. ej., cotizaciones).</li>
          <li><strong>Datos técnicos y de uso:</strong> IP, agente de usuario, páginas vistas, eventos, cookies/tokens.</li>
        </ul>
        <p className="mt-3">No solicitamos categorías especiales de datos. Si el Usuario incorpora datos sensibles, deberá contar con base jurídica y minimización; la Empresa aplicará medidas reforzadas de seguridad.</p>
      </section>

      <section id="finalidades" className="mb-8 scroll-mt-24">
        <h2 className="text-2xl font-semibold">4. Finalidades y bases de legitimación</h2>
        <ul className="list-disc pl-6">
          <li><strong>Prestación del Servicio y soporte</strong> (ejecución de contrato).</li>
          <li><strong>Facturación y cumplimiento legal</strong> (obligación legal).</li>
          <li><strong>Seguridad y prevención de fraude</strong> (interés legítimo proporcional).</li>
          <li><strong>Comunicaciones comerciales</strong> (consentimiento revocable cuando proceda).</li>
          <li><strong>Mejora de producto y analítica</strong> (interés legítimo con anonimización/seudonimización).</li>
        </ul>
      </section>

      <section id="encargados" className="mb-8 scroll-mt-24">
        <h2 className="text-2xl font-semibold">5. Encargados y transferencias</h2>
        <p>Podemos compartir datos con proveedores que actúan como encargados (hosting, correo, analítica, pagos), bajo contratos que obligan a confidencialidad, medidas de seguridad y finalidades limitadas. Para transferencias internacionales, utilizamos cláusulas contractuales y controles técnicos equivalentes. No vendemos datos personales.</p>
      </section>

      <section id="conservacion" className="mb-8 scroll-mt-24">
        <h2 className="text-2xl font-semibold">6. Plazos de conservación</h2>
        <ul className="list-disc pl-6">
          <li><strong>Cuenta y operación:</strong> vigencia de la cuenta + 3 años.</li>
          <li><strong>Facturación:</strong> 7 años para fines tributarios.</li>
          <li><strong>Soporte:</strong> 2 años desde el cierre del ticket.</li>
          <li><strong>Analítica agregada/anonimizada:</strong> sin plazo definido.</li>
        </ul>
      </section>

      <section id="seguridad" className="mb-8 scroll-mt-24">
        <h2 className="text-2xl font-semibold">7. Seguridad</h2>
        <ul className="list-disc pl-6">
          <li>Cifrado en tránsito (TLS) y en reposo donde aplique.</li>
          <li>Control de accesos (RBAC), MFA en cuentas administrativas y registro de auditoría.</li>
          <li>Backups encriptados y pruebas periódicas de restauración.</li>
          <li>Monitoreo, gestión de vulnerabilidades y respuesta a incidentes.</li>
        </ul>
      </section>

      <section id="derechos" className="mb-8 scroll-mt-24">
        <h2 className="text-2xl font-semibold">8. Derechos de los titulares</h2>
        <p>Puede ejercer derechos de acceso, rectificación, cancelación/eliminación y oposición, además de revocar consentimientos y solicitar portabilidad cuando corresponda. Responderemos dentro de los plazos legales y solicitaremos antecedentes mínimos para verificar identidad.</p>
      </section>

      <section id="cookies" className="mb-8 scroll-mt-24">
        <h2 className="text-2xl font-semibold">9. Cookies</h2>
        <p>Usamos cookies esenciales, de autenticación, preferencias y analíticas. Puede gestionarlas desde su navegador. Las cookies esenciales son necesarias para operar el Servicio.</p>
      </section>

      <section id="incidentes" className="mb-8 scroll-mt-24">
        <h2 className="text-2xl font-semibold">10. Incidentes y notificación</h2>
        <p>Ante un incidente de seguridad que afecte datos personales, informaremos al Usuario afectado y a las autoridades competentes cuando corresponda, con detalle de naturaleza, alcance y medidas adoptadas. Nuestro objetivo interno es notificar con prontitud razonable una vez verificado el incidente.</p>
      </section>

      <section id="autoridades" className="mb-8 scroll-mt-24">
        <h2 className="text-2xl font-semibold">11. Autoridades y reclamos</h2>
        <p>Sin perjuicio de nuestras vías de contacto, los consumidores pueden acudir al SERNAC respecto de materias de consumo; y, en protección de datos, a las autoridades competentes según evolucione la institucionalidad chilena. También puede ejercer acciones ante tribunales chilenos.</p>
      </section>

      <section id="cambios" className="mb-0 scroll-mt-24">
        <h2 className="text-2xl font-semibold">12. Cambios a esta política</h2>
        <p>Publicaremos versiones actualizadas en esta página. Para cambios sustantivos, emplearemos avisos razonables en la aplicación.</p>
      </section>
    </LegalShell>
  );
}
