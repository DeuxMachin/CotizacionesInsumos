import { NextRequest, NextResponse } from 'next/server';
import { sendGmailTest, getGmailConfig } from '@/services/gmailService';

// Función de validación de email
function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, email, subject, message, attachmentContent, attachmentName } = body;

    // Validaciones básicas
    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email es requerido' },
        { status: 400 }
      );
    }

    if (!validateEmail(email)) {
      return NextResponse.json(
        { success: false, error: 'Email no válido' },
        { status: 400 }
      );
    }

    // Verificar configuración de Gmail
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
      return NextResponse.json(
        { success: false, error: 'Gmail no configurado. Se requiere GMAIL_USER y GMAIL_APP_PASSWORD' },
        { status: 500 }
      );
    }

    let result;

    // Usar solo Gmail con Nodemailer
    switch (action) {
      case 'simple':
        result = await sendGmailTest({
          toEmail: email,
          subject: subject || 'Email de prueba simple',
          message: message || 'Este es un email de prueba básico.',
        });
        break;

      case 'attachment':
        if (!attachmentContent) {
          return NextResponse.json(
            { success: false, error: 'Contenido del adjunto es requerido' },
            { status: 400 }
          );
        }
        result = await sendGmailTest({
          toEmail: email,
          subject: subject || 'Email con adjunto de prueba',
          message: message || 'Este email incluye un archivo adjunto.',
          attachmentContent,
          attachmentName: attachmentName || 'prueba.txt'
        });
        break;

      default:
        return NextResponse.json(
          { success: false, error: 'Acción no válida. Use "simple" o "attachment"' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      emailId: result.data?.messageId || 'N/A',
      service: 'Gmail (Nodemailer)',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error en API test-email:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    
    return NextResponse.json(
      { 
        success: false, 
        error: errorMessage,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// Endpoint GET para verificar configuración
export async function GET() {
  try {
    const gmailConfig = getGmailConfig();

    return NextResponse.json({
      gmail: {
        configured: gmailConfig.configured,
        userPreview: gmailConfig.userPreview,
        service: gmailConfig.service,
        limitation: 'Puede enviar a cualquier destinatario'
      },
      endpoints: {
        simple: 'POST /api/test-email con action: "simple"',
        attachment: 'POST /api/test-email con action: "attachment"'
      }
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Error al verificar configuración' },
      { status: 500 }
    );
  }
}
