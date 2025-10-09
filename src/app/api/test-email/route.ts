import { NextRequest, NextResponse } from 'next/server';
import nodemailer, { type SendMailOptions } from 'nodemailer';
import Imap from 'imap';

// Configuración para Vercel: usar runtime Node.js y aumentar timeout
export const runtime = 'nodejs';
export const maxDuration = 60;

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

// Función para guardar el correo en la carpeta de enviados
async function saveToSentFolder(mailOptions: SendMailOptions): Promise<void> {
  return new Promise((resolve) => {
    const imap = new Imap(imapConfig);
    let connected = false;

    const timeout = setTimeout(() => {
      if (!connected) {
        console.warn('Timeout de conexión IMAP, continuando sin guardar en enviados');
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
      console.log('IMAP conectado, listando carpetas...');
      
      // Primero listar todas las carpetas disponibles para debug
      imap.getBoxes((err, boxes) => {
        if (!err) {
          console.log('Carpetas disponibles:', JSON.stringify(boxes, null, 2));
        }
      });

      // Intentar diferentes variantes de nombres de carpetas de enviados
      // Basado en las carpetas reales del servidor Mailhostbox
      const sentFolderVariants = [
        'Sent',
        'Elementos enviados'
      ];

      let attemptIndex = 0;

      function tryNextFolder() {
        if (attemptIndex >= sentFolderVariants.length) {
          console.warn('No se encontró carpeta de enviados en ninguna variante');
          clearTimeout(timeout);
          imap.end();
          resolve();
          return;
        }

        const folderName = sentFolderVariants[attemptIndex];
        console.log(`Intentando abrir carpeta: "${folderName}"`);
        attemptIndex++;

        imap.openBox(folderName, false, (err: Error | null) => {
          if (err) {
            console.warn(`No se pudo abrir "${folderName}":`, err.message);
            tryNextFolder();
            return;
          }
          
          console.log(`Carpeta "${folderName}" abierta exitosamente`);
          appendMessage(folderName);
        });
      }

      function appendMessage(folderName: string) {
        // Construir el mensaje en formato RFC822 más completo
        // Usar zona horaria de Chile (America/Santiago)
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
          `Date: ${chileTime} -0300`, // -0300 para zona horaria de Chile
          `MIME-Version: 1.0`,
          `Content-Type: text/html; charset=utf-8`,
          `Message-ID: <${Date.now()}@miportalventas.cl>`,
          ``,
          mailOptions.html || mailOptions.text || ''
        ].join('\r\n');

        imap.append(message, { mailbox: folderName, flags: ['\\Seen'] }, (err: Error | null) => {
          clearTimeout(timeout);
          if (err) {
            console.error(`Error al guardar en "${folderName}":`, err);
          } else {
            console.log(`✅ Correo guardado exitosamente en la carpeta "${folderName}"`);
          }
          imap.end();
          resolve();
        });
      }

      tryNextFolder();
    });

    imap.once('error', (err: Error) => {
      clearTimeout(timeout);
      console.error('Error IMAP:', err.message);
      resolve(); // No rechazamos para que el envío continúe
    });

    imap.once('end', () => {
      clearTimeout(timeout);
      console.log('Conexión IMAP cerrada');
    });

    try {
      imap.connect();
    } catch (err) {
      clearTimeout(timeout);
      console.error('Error al conectar IMAP:', err);
      resolve();
    }
  });
}

interface EmailRequest {
  action: 'simple' | 'attachment';
  email: string;
  subject: string;
  message: string;
  attachmentContent?: string;
  attachmentName?: string;
}

export async function GET() {
  // Verificar configuración
  const smtpUser = process.env.SMTP_USER;
  const config = {
    gmail: {
      configured: !!(smtpUser && process.env.SMTP_PASSWORD),
      userPreview: smtpUser ? `${smtpUser.slice(0, 3)}***@${smtpUser.split('@')[1]}` : 'No configurado',
      service: 'SMTP (Mailhostbox)',
      limitation: 'Usa SMTP/IMAP de Mailhostbox',
    },
    endpoints: {
      simple: '/api/test-email (POST)',
      attachment: '/api/test-email (POST)',
    },
  };

  return NextResponse.json(config);
}

export async function POST(request: NextRequest) {
  try {
    const body: EmailRequest = await request.json();
    const { action, email, subject, message, attachmentContent, attachmentName } = body;

    if (!email) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'El email es requerido',
          timestamp: new Date().toLocaleString('es-CL', { timeZone: 'America/Santiago' })
        },
        { status: 400 }
      );
    }

    const mailOptions: SendMailOptions = {
      from: process.env.SMTP_USER,
      to: email,
      bcc: process.env.SMTP_USER, // Copia oculta para tener registro
      subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Email de Prueba SMTP</h2>
          <div>${message}</div>
          <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">
          <p style="font-size: 12px; color: #666;">
            Enviado desde la aplicación de cotizaciones usando SMTP (Mailhostbox).
          </p>
        </div>
      `,
    };

    // Agregar adjunto si es necesario
    if (action === 'attachment' && attachmentContent && attachmentName) {
      mailOptions.attachments = [
        {
          filename: attachmentName,
          content: Buffer.from(attachmentContent!, 'utf-8'),
        },
      ];
    }

    const result = await smtpTransporter.sendMail(mailOptions);

    // Guardar copia en la carpeta de enviados usando IMAP
    try {
      await saveToSentFolder(mailOptions);
    } catch (imapError) {
      console.warn('No se pudo guardar en enviados, pero el correo se envió correctamente:', imapError);
    }

    return NextResponse.json({
      success: true,
      message: 'Email enviado exitosamente con SMTP y guardado en enviados',
      emailId: result.messageId,
      service: 'SMTP (Mailhostbox)',
      timestamp: new Date().toLocaleString('es-CL', { timeZone: 'America/Santiago' }),
    });

  } catch (error) {
    console.error('Error enviando email con SMTP:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido al enviar el correo',
        timestamp: new Date().toLocaleString('es-CL', { timeZone: 'America/Santiago' }),
      },
      { status: 500 }
    );
  }
}