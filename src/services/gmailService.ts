import nodemailer from 'nodemailer';

// Configuración para Gmail
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER, // Tu email de Gmail
    pass: process.env.GMAIL_APP_PASSWORD, // Contraseña de aplicación (no la normal)
  },
});

export async function sendGmailTest({
  toEmail,
  subject,
  message,
  attachmentContent,
  attachmentName
}: {
  toEmail: string;
  subject: string;
  message: string;
  attachmentContent?: string;
  attachmentName?: string;
}) {
  try {
    const mailOptions: any = {
      from: process.env.GMAIL_USER,
      to: toEmail,
      subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Email de Prueba</h2>
          <p>${message}</p>
          <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">
          <p style="font-size: 12px; color: #666;">
            Enviado desde la aplicación de cotizaciones usando Gmail.
          </p>
        </div>
      `
    };

    // Agregar adjunto si se proporciona
    if (attachmentContent && attachmentName) {
      mailOptions.attachments = [
        {
          filename: attachmentName,
          content: Buffer.from(attachmentContent, 'utf-8'),
        }
      ];
    }

    const result = await transporter.sendMail(mailOptions);
    
    return {
      success: true,
      data: result,
      message: 'Email enviado exitosamente con Gmail'
    };

  } catch (error) {
    console.error('Error enviando email con Gmail:', error);
    throw new Error(
      error instanceof Error 
        ? error.message 
        : 'Error desconocido al enviar el correo'
    );
  }
}

// Función para verificar configuración de Gmail
export function getGmailConfig() {
  return {
    configured: !!(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD),
    service: 'Gmail (Nodemailer)',
    userPreview: process.env.GMAIL_USER 
      ? `${process.env.GMAIL_USER.slice(0, 3)}***@${process.env.GMAIL_USER.split('@')[1]}`
      : 'No configurado'
  };
}
