import { NextRequest, NextResponse } from 'next/server';
import { sendSMTPEmail } from '@/services/smtpService';
import { generatePDF } from '@/shared/lib/pdf/generator';
import { verifyToken, type JWTPayload } from '@/lib/auth/tokens';
import { AuditLogger } from '@/services/auditLogger';
import type { Quote, QuoteItem } from '@/core/domain/quote/Quote';
import fs from 'fs';
import path from 'path';

interface AuthenticatedUser {
  id: string;
  email: string;
  nombre: string;
  apellido: string;
  rol: string;
  fullName: string;
}

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

    // Obtener información del usuario autenticado desde JWT y headers
    const token = request.cookies.get('auth-token')?.value;
    let user: { id: string; email: string; nombre?: string; apellido?: string; rol?: string; fullName?: string } | null = null;
    if (token) {
      try {
        const decoded: { sub: string; email?: string; nombre?: string; apellido?: string; rol?: string; type?: string } = await verifyToken(token);
        
        // Obtener información adicional desde headers (enviados por el frontend)
        const userNameFromHeader = request.headers.get('x-user-name');
        const userEmailFromHeader = request.headers.get('x-user-email');
        
        user = {
          id: decoded.sub,
          email: decoded.email || userEmailFromHeader || '',
          nombre: decoded.nombre,
          apellido: decoded.apellido,
          rol: decoded.rol,
          // Usar el nombre completo desde header si está disponible
          fullName: userNameFromHeader || undefined
        };
      } catch {
        // token inválido -> user queda null
      }
    }

    console.log('🔍 Sending quote email with user info:', { user, recipientEmail });

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

    // Verificar configuración de SMTP
    if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
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

    // Enriquecer items con ficha_técnica si faltara (antes de generar PDF)
    const items = Array.isArray(quote.items) ? quote.items : [];
    const productIds = Array.from(new Set(items.map(it => it?.productId).filter(v => v != null))) as number[];
    let enrichedQuote = quote;
    try {
      if (productIds.length > 0) {
        const { supabase } = await import('@/lib/supabase');
        const { data: productos } = await supabase
          .from('productos')
          .select('id, ficha_tecnica')
          .in('id', productIds);
        const fichaMap = new Map<number, string | undefined>((productos || []).map((p: { id: number; ficha_tecnica: string | null }) => [p.id, p.ficha_tecnica || undefined]));
        const newItems = items.map(it => {
          if (it.fichaTecnica || !it.productId) return it;
          const ficha = fichaMap.get(Number(it.productId));
          return ficha ? { ...it, fichaTecnica: ficha } : it;
        });
        enrichedQuote = { ...quote, items: newItems };
      }
    } catch (err) {
      console.warn('Error enriqueciendo fichas técnicas:', err);
    }

    // Generar PDF de la cotización
  const pdfBuffer = await generatePDF(enrichedQuote, undefined, { condensed: true, docType: 'cotizacion' });
    
    // Convertir buffer a base64 para el adjunto
    const pdfBase64 = Buffer.from(pdfBuffer).toString('base64');
    
    // Preparar el mensaje personalizado
    const clientName = recipientName || quote.cliente.razonSocial || quote.cliente.nombreFantasia || 'Cliente';
    const quoteNumber = quote.numero || 'Nueva';

    // Intentar cargar logo para inline CID
    const logoPngPath = path.join(process.cwd(), 'public', 'logo.png');
    let logoAttachment: { filename: string; content: Buffer; cid: string } | null = null;
    try {
      const logoBuffer = fs.readFileSync(logoPngPath);
      logoAttachment = {
        filename: 'logo.png',
        content: logoBuffer,
        cid: 'company-logo@cotizaciones'
      };
    } catch (e) {
      console.warn('No se pudo adjuntar el logo PNG para inline CID:', e);
    }

    const logoImgTag = logoAttachment
      ? `<img src="cid:${logoAttachment.cid}" alt="Logo Empresa" style="height: 60px; display: block;">`
      : '';

    const htmlMessage = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; line-height: 1.6;">
        <div style="background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
          ${logoImgTag ? `<div style="background: white; display: inline-block; padding: 10px; border-radius: 8px; margin-bottom: 15px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">${logoImgTag}</div>` : ''}
          <h1 style="margin: 0; font-size: 24px;">¡Gracias por cotizar con nosotros!</h1>
        </div>
        
        <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
          <p style="color: #374151; font-size: 16px; margin-bottom: 20px;">
            Estimado/a <strong>${clientName}</strong>,
          </p>
          
          <p style="color: #374151; margin-bottom: 20px;">
            Junto con saludar, agradecemos su preferencia en nuestros productos y servicios. Adjunto encontrarás la cotización y un enlace mediante un icono para la descarga de la ficha técnica de cada producto. <strong>#${quoteNumber}</strong> con todos los detalles solicitados.
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
            <ul style="color: #374151; margin: 10px 0; padding-left: 20px;">
              <li><strong>Número:</strong> #${quoteNumber}</li>
              <li><strong>Fecha:</strong> ${new Date().toLocaleDateString('es-ES')}</li>
              <li><strong>Cliente:</strong> ${clientName}</li>
            </ul>
          </div>
          
          <p style="color: #374151; margin-bottom: 25px;">
            Si tienes alguna pregunta sobre esta cotización, no dudes en contactarnos. Estamos aquí para ayudarte.
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <p style="color: #6b7280; font-size: 14px; margin: 0;">
              ¡Gracias por confiar en nosotros!
            </p>
          </div>
        </div>
      </div>
    `;

    // Enviar email con la cotización
    const result = await sendSMTPEmail({
      toEmail: recipientEmail,
      subject: `Cotización #${quoteNumber} - Gracias por cotizar con nosotros`,
      message: htmlMessage,
      attachmentContent: pdfBase64,
      attachmentName: `cotizacion-${quoteNumber}.pdf`,
      isBase64: true,
      useRawHtml: true,
      extraAttachments: logoAttachment ? [logoAttachment] : undefined
    });

    // Registrar en audit log que se envió la cotización
    if (user) {
      // Prioridad: 1) nombre completo del header, 2) nombre + apellido del JWT, 3) solo nombre del JWT, 4) email como fallback
      const userName = user.fullName || 
                      (user.nombre && user.apellido ? `${user.nombre} ${user.apellido}` : user.nombre) || 
                      user.email.split('@')[0];
      
      await AuditLogger.logEvent({
        usuario_id: user.id,
        evento: 'cotizacion_enviada',
        descripcion: `${userName} envió cotización #${quoteNumber} por email a ${recipientEmail}`,
        detalles: {
          folio: quoteNumber,
          destinatario: recipientEmail,
          destinatario_nombre: recipientName,
          mensaje_personalizado: message || null,
          email_id: result.data?.messageId,
          user_email: user.email,
          user_name: userName,
          cliente: {
            nombre: clientName,
            razon_social: quote.cliente.razonSocial
          }
        },
        tabla_afectada: 'cotizaciones',
        registro_id: quoteId || 'unknown'
      });
      console.log('✅ Audit log: Cotización enviada registrada');
    } else {
      console.warn('⚠️ No se pudo registrar en audit log: usuario no autenticado');
    }

    return NextResponse.json({
      success: true,
      message: 'Cotización enviada exitosamente',
      emailId: result.data?.messageId || 'N/A',
      service: 'SMTP (Mailhostbox)',
      recipientEmail,
      quoteNumber,
      timestamp: new Date().toLocaleString('es-CL', { timeZone: 'America/Santiago' })
    });

  } catch (error) {
    console.error('Error enviando cotización por email:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    
    return NextResponse.json(
      { 
        success: false, 
        error: `Error al enviar cotización: ${errorMessage}`,
        timestamp: new Date().toLocaleString('es-CL', { timeZone: 'America/Santiago' })
      },
      { status: 500 }
    );
  }
}


async function getQuoteById(_id: string): Promise<Quote | null> {
  // IMPORTANTE: Reemplaza esto con tu lógica real de base de datos
  // Por ahora retornamos null para indicar que no está implementado
  console.warn('getQuoteById not implemented - using quoteData from request instead');
  return null;
}
