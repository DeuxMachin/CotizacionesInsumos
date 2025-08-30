'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { Quote, QuoteStatus } from '@/core/domain/quote/Quote';
import { z } from 'zod';

// Esquema de validación para la cotización
const QuoteSchema = z.object({
  id: z.string().optional(),
  client: z.string(),
  date: z.string(),
  status: z.enum(['pending', 'approved', 'rejected']).default('pending'),
  amount: z.number().positive(),
});

type QuoteFormData = z.infer<typeof QuoteSchema>;

// Mock de base de datos (en producción, esto sería una conexión real a la BD)
let quotesDB: Quote[] = [];

/**
 * Server Action para crear una nueva cotización
 */
export async function createQuote(formData: FormData) {
  // Validar y parsear los datos del formulario
  const rawData = Object.fromEntries(formData.entries());
  
  // Procesamiento de datos para adaptarlos al formato esperado
  const quoteData: QuoteFormData = {
    client: rawData.client as string,
    date: rawData.date as string || new Date().toISOString().split('T')[0], // Formato YYYY-MM-DD
    status: (rawData.status as QuoteStatus) || 'pending',
    amount: parseFloat(rawData.amount as string),
  };
  
  try {
    // Validar los datos
    const validatedData = QuoteSchema.parse(quoteData);
    
    // Generar un ID único para la nueva cotización
    const newId = `COT-${Date.now()}`;
    
    // Crear la nueva cotización
    const newQuote: Quote = {
      ...validatedData,
      id: newId,
    };
    
    // En producción, aquí iría la lógica para guardar en la base de datos
    quotesDB.push(newQuote);
    
    // Registrar la acción en el log de auditoría
    await logAuditAction('create_quote', newId);
    
    // Revalidar la ruta para actualizar los datos mostrados
    revalidatePath('/dashboard/cotizaciones');
    
    // Redirigir a la página de detalle de la cotización
    redirect(`/dashboard/cotizaciones/${newId}`);
  } catch (error) {
    // Manejar errores de validación o de servidor
    if (error instanceof z.ZodError) {
      return { success: false, error: 'Datos de cotización inválidos', validationErrors: error.errors };
    }
    
    return { success: false, error: 'Error al crear la cotización' };
  }
}

/**
 * Server Action para actualizar una cotización existente
 */
export async function updateQuote(quoteId: string, formData: FormData) {
  // Validar y parsear los datos del formulario
  const rawData = Object.fromEntries(formData.entries());
  
  // Procesamiento de datos para adaptarlos al formato esperado
  const quoteData: QuoteFormData = {
    id: quoteId,
    client: rawData.client as string,
    date: rawData.date as string,
    status: (rawData.status as QuoteStatus) || 'pending',
    amount: parseFloat(rawData.amount as string),
  };
  
  try {
    // Validar los datos
    const validatedData = QuoteSchema.parse(quoteData);
    
    // Buscar la cotización existente
    const quoteIndex = quotesDB.findIndex(q => q.id === quoteId);
    
    if (quoteIndex === -1) {
      return { success: false, error: 'Cotización no encontrada' };
    }
    
    // Actualizar la cotización
    const updatedQuote: Quote = {
      ...validatedData,
      id: quoteId, // Asegurarnos que el ID esté definido
    };
    
    // En producción, aquí iría la lógica para actualizar en la base de datos
    quotesDB[quoteIndex] = updatedQuote;
    
    // Registrar la acción en el log de auditoría
    await logAuditAction('update_quote', quoteId);
    
    // Revalidar la ruta para actualizar los datos mostrados
    revalidatePath('/dashboard/cotizaciones');
    revalidatePath(`/dashboard/cotizaciones/${quoteId}`);
    
    return { success: true };
  } catch (error) {
    // Manejar errores de validación o de servidor
    if (error instanceof z.ZodError) {
      return { success: false, error: 'Datos de cotización inválidos', validationErrors: error.errors };
    }
    
    return { success: false, error: 'Error al actualizar la cotización' };
  }
}

/**
 * Server Action para cambiar el estado de una cotización
 */
export async function changeQuoteStatus(quoteId: string, newStatus: QuoteStatus) {
  try {
    // Buscar la cotización existente
    const quoteIndex = quotesDB.findIndex(q => q.id === quoteId);
    
    if (quoteIndex === -1) {
      return { success: false, error: 'Cotización no encontrada' };
    }
    
    // Actualizar el estado de la cotización
    quotesDB[quoteIndex] = {
      ...quotesDB[quoteIndex],
      status: newStatus,
    };
    
    // Registrar la acción en el log de auditoría
    await logAuditAction('change_quote_status', quoteId, { status: newStatus });
    
    // Revalidar las rutas para actualizar los datos mostrados
    revalidatePath('/dashboard/cotizaciones');
    revalidatePath(`/dashboard/cotizaciones/${quoteId}`);
    
    return { success: true };
  } catch (error) {
    return { success: false, error: 'Error al cambiar el estado de la cotización' };
  }
}

/**
 * Server Action para eliminar una cotización
 */
export async function deleteQuote(quoteId: string) {
  try {
    // Verificar si la cotización existe
    const quoteIndex = quotesDB.findIndex(q => q.id === quoteId);
    
    if (quoteIndex === -1) {
      return { success: false, error: 'Cotización no encontrada' };
    }
    
    // Eliminar la cotización (en producción, podría ser una eliminación lógica)
    quotesDB.splice(quoteIndex, 1);
    
    // Registrar la acción en el log de auditoría
    await logAuditAction('delete_quote', quoteId);
    
    // Revalidar la ruta para actualizar los datos mostrados
    revalidatePath('/dashboard/cotizaciones');
    
    return { success: true };
  } catch (error) {
    return { success: false, error: 'Error al eliminar la cotización' };
  }
}

/**
 * Función auxiliar para registrar acciones en el log de auditoría
 */
async function logAuditAction(action: string, resourceId: string, details?: Record<string, any>) {
  // Aquí iría la lógica para registrar en el log de auditoría
  console.log(`[AUDIT] ${action} - Resource: ${resourceId}`, details || '');
}
