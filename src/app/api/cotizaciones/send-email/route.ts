import { NextRequest, NextResponse } from 'next/server';
import { sendGmailTest } from '@/services/gmailService';
import { generatePDF } from '@/shared/lib/pdf/generator';
import type { Quote } from '@/core/domain/quote/Quote';

interface SendQuoteEmailRequest {
  quoteId?: string;
  quoteData?: Quote;
  recipientEmail: string;
  recipientName?: string;
  message?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: SendQuoteEmailRequest = await request.json();
    const { quoteId, quoteData, recipientEmail, recipientName, message } = body;

    // Validaciones básicas
    if (!recipientEmail) {
      return NextResponse.json(
        { success: false, error: 'Email del destinatario es requerido' },
        { status: 400 }
      );
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(recipientEmail)) {
      return NextResponse.json(
        { success: false, error: 'Email no válido' },
        { status: 400 }
      );
    }

    // Verificar configuración de Gmail
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
      return NextResponse.json(
        { success: false, error: 'Servicio de email no configurado' },
        { status: 500 }
      );
    }

    let quote: Quote;

    // Obtener datos de la cotización
    if (quoteData) {
      quote = quoteData;
    } else if (quoteId) {
      // Aquí deberías obtener la cotización desde tu base de datos
      const fetchedQuote = await getQuoteById(quoteId);
      if (!fetchedQuote) {
        return NextResponse.json(
          { success: false, error: 'Cotización no encontrada' },
          { status: 404 }
        );
      }
      quote = fetchedQuote;
    } else {
      return NextResponse.json(
        { success: false, error: 'Se requiere quoteId o quoteData' },
        { status: 400 }
      );
    }

    // Generar PDF de la cotización
    const pdfBuffer = await generatePDF(quote, undefined, { condensed: true });
    
    // Convertir buffer a base64 para el adjunto
    const pdfBase64 = Buffer.from(pdfBuffer).toString('base64');
    
    // Preparar el mensaje personalizado
    const clientName = recipientName || quote.cliente.razonSocial || quote.cliente.nombreFantasia || 'Cliente';
    const quoteNumber = quote.numero || 'Nueva';
    
    const htmlMessage = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; line-height: 1.6;">
        <div style="background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 24px;">¡Gracias por cotizar con nosotros!</h1>
        </div>
        
        <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
          <p style="color: #374151; font-size: 16px; margin-bottom: 20px;">
            Estimado/a <strong>${clientName}</strong>,
          </p>
          
          <p style="color: #374151; margin-bottom: 20px;">
            Agradecemos tu interés en nuestros productos y servicios. Adjunto encontrarás la cotización <strong>#${quoteNumber}</strong> con todos los detalles solicitados.
          </p>
          
          ${message ? `
            <div style="background: #f9fafb; border-left: 4px solid #f97316; padding: 15px; margin: 20px 0;">
              <p style="color: #374151; margin: 0; font-style: italic;">
                "${message}"
              </p>
            </div>
          ` : ''}
          
          <div style="background: #fef3ec; border: 1px solid #fed7aa; border-radius: 6px; padding: 15px; margin: 20px 0;">
            <h3 style="color: #ea580c; margin: 0 0 10px 0; font-size: 16px;">Detalles de la cotización:</h3>
            <ul style="color: #92400e; margin: 0; padding-left: 20px;">
              <li><strong>Número:</strong> ${quoteNumber}</li>
              <li><strong>Cliente:</strong> ${quote.cliente.razonSocial}</li>
              <li><strong>Total:</strong> $${quote.total.toLocaleString('es-CL')}</li>
              ${quote.fechaExpiracion ? `<li><strong>Válida hasta:</strong> ${new Date(quote.fechaExpiracion).toLocaleDateString('es-CL')}</li>` : ''}
            </ul>
          </div>
          
          <p style="color: #374151; margin-bottom: 20px;">
            Si tienes alguna pregunta o necesitas modificaciones, no dudes en contactarnos. Estamos aquí para ayudarte.
          </p>
          
          <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px;">
            <p style="color: #6b7280; font-size: 14px; margin: 0;">
              <strong>Equipo de Ventas</strong><br>
              📧 ${process.env.GMAIL_USER}<br>
              🌐 Sistema de Cotizaciones
            </p>
          </div>
        </div>
        
        <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
          Este email fue generado automáticamente desde nuestro sistema de cotizaciones.
        </div>
      </div>
    `;

    // Enviar email con PDF adjunto
    const result = await sendGmailTest({
      toEmail: recipientEmail,
      subject: `Cotización #${quoteNumber} - Gracias por cotizar con nosotros`,
      message: htmlMessage,
      attachmentContent: pdfBase64,
      attachmentName: `cotizacion-${quoteNumber}.pdf`,
      isBase64: true
    });

    return NextResponse.json({
      success: true,
      message: 'Cotización enviada exitosamente',
      emailId: result.data?.messageId || 'N/A',
      service: 'Gmail (Nodemailer)',
      recipientEmail,
      quoteNumber,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error enviando cotización por email:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    
    return NextResponse.json(
      { 
        success: false, 
        error: `Error al enviar cotización: ${errorMessage}`,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// Función mock para obtener cotización - reemplaza con tu lógica real
async function getQuoteById(id: string): Promise<Quote | null> {
  // IMPORTANTE: Reemplaza esto con tu lógica real de base de datos
  // Por ahora retornamos null para indicar que no está implementado
  console.warn('getQuoteById not implemented - using quoteData from request instead');
  return null;
}
