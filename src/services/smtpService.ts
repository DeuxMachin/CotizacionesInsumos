import nodemailer, { type SendMailOptions } from 'nodemailer';
import Imap from 'imap';

// Configuración SMTP para Mailhostbox
const smtpTransporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false, // true para 465, false para 587 con STARTTLS
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
  tls: {
    ciphers: 'SSLv3',
  },
});

// Configuración IMAP para guardar en enviados
const imapConfig = {
  user: process.env.SMTP_USER!,
  password: process.env.SMTP_PASSWORD!,
  host: process.env.IMAP_HOST!,
  port: parseInt(process.env.IMAP_PORT || '993'),
  tls: true,
  tlsOptions: { rejectUnauthorized: false }
};

/**
 * Guarda una copia del correo enviado en la carpeta de enviados usando IMAP
 */
async function saveToSentFolder(mailOptions: SendMailOptions): Promise<void> {
  return new Promise((resolve) => {
    const imap = new Imap(imapConfig);
    let connected = false;

    const timeout = setTimeout(() => {
      if (!connected) {
        console.warn('⏱️ Timeout de conexión IMAP, continuando sin guardar en enviados');
        try {
          imap.end();
        } catch (e) {
          // Ignorar errores al cerrar
        }
        resolve();
      }
    }, 10000); // 10 segundos de timeout

    imap.once('ready', () => {
      connected = true;
      
      // Intentar diferentes variantes de nombres de carpetas de enviados
      const sentFolderVariants = ['Sent', 'Elementos enviados'];
      let attemptIndex = 0;

      function tryNextFolder() {
        if (attemptIndex >= sentFolderVariants.length) {
          console.warn('⚠️ No se encontró carpeta de enviados');
          clearTimeout(timeout);
          imap.end();
          resolve();
          return;
        }

        const folderName = sentFolderVariants[attemptIndex];
        attemptIndex++;

        imap.openBox(folderName, false, (err: Error | null) => {
          if (err) {
            tryNextFolder();
            return;
          }
          
          appendMessage(folderName);
        });
      }

      function appendMessage(folderName: string) {
        // Construir el mensaje en formato RFC822 con zona horaria de Chile
        const chileTime = new Date().toLocaleString('es-CL', {
          timeZone: 'America/Santiago',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false
        }).replace(/(\d{2})\/(\d{2})\/(\d{4}), (\d{2}):(\d{2}):(\d{2})/, '$3-$2-$1 $4:$5:$6');

        const message = [
          `From: ${mailOptions.from}`,
          `To: ${mailOptions.to}`,
          `Subject: ${mailOptions.subject}`,
          `Date: ${chileTime} -0300`,
          `MIME-Version: 1.0`,
          `Content-Type: text/html; charset=utf-8`,
          `Message-ID: <${Date.now()}@miportalventas.cl>`,
          ``,
          mailOptions.html || mailOptions.text || ''
        ].join('\r\n');

        imap.append(message, { mailbox: folderName, flags: ['\\Seen'] }, (err: Error | null) => {
          clearTimeout(timeout);
          if (err) {
            console.error(`❌ Error al guardar en "${folderName}":`, err.message);
          } else {
            console.log(`✅ Correo guardado en carpeta "${folderName}"`);
          }
          imap.end();
          resolve();
        });
      }

      tryNextFolder();
    });

    imap.once('error', (err: Error) => {
      clearTimeout(timeout);
      console.error('❌ Error IMAP:', err.message);
      resolve(); // No rechazamos para que el envío continúe
    });

    imap.once('end', () => {
      clearTimeout(timeout);
    });

    try {
      imap.connect();
    } catch (err) {
      clearTimeout(timeout);
      console.error('❌ Error al conectar IMAP:', err);
      resolve();
    }
  });
}

/**
 * Envía un email usando SMTP (Mailhostbox)
 * Incluye guardado automático en carpeta de enviados vía IMAP
 */
export async function sendSMTPEmail({
  toEmail,
  subject,
  message,
  attachmentContent,
  attachmentName,
  isBase64 = false,
  /** If true, use `message` as the full HTML without wrapping */
  useRawHtml = false,
  /** Additional attachments (e.g., inline images with cid) */
  extraAttachments,
}: {
  toEmail: string;
  subject: string;
  message: string;
  attachmentContent?: string;
  attachmentName?: string;
  isBase64?: boolean;
  useRawHtml?: boolean;
  extraAttachments?: SendMailOptions['attachments'];
}) {
  try {
    const mailOptions: SendMailOptions = {
      from: process.env.SMTP_USER,
      to: toEmail,
      bcc: process.env.SMTP_USER, // Copia oculta para registro
      subject,
      html: useRawHtml
        ? message
        : `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Email de Prueba</h2>
          <div>${message}</div>
          <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">
          <p style="font-size: 12px; color: #666;">
            Enviado desde la aplicación de cotizaciones.
          </p>
        </div>
      `
    };

    // Construir adjuntos (PDF + adjuntos extra como imágenes inline con cid)
    const attachments: NonNullable<SendMailOptions['attachments']> = [];
    if (attachmentContent && attachmentName) {
      attachments.push({
        filename: attachmentName,
        content: isBase64
          ? Buffer.from(attachmentContent, 'base64')
          : Buffer.from(attachmentContent, 'utf-8'),
      });
    }

    if (extraAttachments && Array.isArray(extraAttachments) && extraAttachments.length > 0) {
      attachments.push(...extraAttachments);
    }

    if (attachments.length > 0) {
      mailOptions.attachments = attachments;
    }

    const result = await smtpTransporter.sendMail(mailOptions);

    // Guardar copia en la carpeta de enviados usando IMAP (sin bloquear el envío)
    saveToSentFolder(mailOptions).catch((err) => {
      console.warn('⚠️ No se pudo guardar en enviados, pero el correo se envió correctamente:', err);
    });
    
    return {
      success: true,
      data: result,
      message: 'Email enviado exitosamente con SMTP'
    };

  } catch (error) {
    console.error('Error enviando email con SMTP:', error);
    throw new Error(
      error instanceof Error 
        ? error.message 
        : 'Error desconocido al enviar el correo'
    );
  }
}

/**
 * Verifica la configuración de SMTP
 */
export function getSMTPConfig() {
  const smtpUser = process.env.SMTP_USER;
  return {
    configured: !!(smtpUser && process.env.SMTP_PASSWORD),
    service: 'SMTP (Mailhostbox)',
    userPreview: smtpUser 
      ? `${smtpUser.slice(0, 3)}***@${smtpUser.split('@')[1]}`
      : 'No configurado'
  };
}

// Mantener compatibilidad con código existente
export { sendSMTPEmail as sendGmailTest };
export { getSMTPConfig as getGmailConfig };
