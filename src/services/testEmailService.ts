import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendTestEmail(
  toEmail: string,
  subject: string = 'Email de prueba',
  message: string = 'Este es un email de prueba desde tu aplicación.',
  fromEmail: string = 'onboarding@resend.dev'
) {
  try {
    if (!process.env.RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY no está configurada');
    }

    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: [toEmail],
      subject: subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb; margin-bottom: 10px;">🧪 Email de Prueba</h1>
            <hr style="border: none; height: 2px; background: linear-gradient(to right, #2563eb, #3b82f6); margin: 20px 0;">
          </div>
          
          <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h2 style="color: #1f2937; margin-top: 0;">Mensaje:</h2>
            <p style="line-height: 1.6; color: #374151; white-space: pre-line;">${message}</p>
          </div>
          
          <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin-bottom: 20px;">
            <p style="margin: 0; font-size: 14px; color: #92400e;">
              <strong>✅ Estado:</strong> Email enviado exitosamente a través de Resend
            </p>
            <p style="margin: 5px 0 0 0; font-size: 12px; color: #92400e;">
              <strong>Timestamp:</strong> ${new Date().toLocaleString('es-ES')}
            </p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <p style="margin: 0; color: #6b7280; font-size: 14px;">
              Email enviado desde tu aplicación de Cotizaciones
            </p>
          </div>
        </div>
      `,
    });

    if (error) {
      console.error('Error de Resend:', error);
      throw new Error(`Error al enviar email: ${error.message}`);
    }

    return { 
      success: true, 
      data,
      message: 'Email enviado exitosamente',
      emailId: data?.id 
    };

  } catch (error) {
    console.error('Error en sendTestEmail:', error);
    throw error;
  }
}

export async function sendEmailWithAttachment(
  toEmail: string,
  subject: string,
  message: string,
  attachmentContent: string,
  attachmentName: string = 'archivo.txt'
) {
  try {
    if (!process.env.RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY no está configurada');
    }

    const { data, error } = await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: [toEmail],
      subject: subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #2563eb;">📎 Email con Adjunto</h1>
          <p style="line-height: 1.6;">${message}</p>
          <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; font-size: 14px;">
              <strong>📄 Archivo adjunto:</strong> ${attachmentName}
            </p>
          </div>
        </div>
      `,
      attachments: [
        {
          filename: attachmentName,
          content: Buffer.from(attachmentContent),
        },
      ],
    });

    if (error) {
      throw new Error(`Error al enviar email: ${error.message}`);
    }

    return { 
      success: true, 
      data,
      message: 'Email con adjunto enviado exitosamente' 
    };

  } catch (error) {
    console.error('Error en sendEmailWithAttachment:', error);
    throw error;
  }
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
