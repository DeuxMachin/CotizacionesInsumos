'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { Quote } from '@/core/domain/quote/Quote';
import { z } from 'zod';




const quotesDB: Quote[] = [];

/**
 * Server Action para crear una nueva cotización
 */
export async function createQuote() {
  


  
  try {

    
    // Generar un ID único para la nueva cotización
    const newId = `COT-${Date.now()}`;    

    
    
    

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
export async function updateQuote(quoteId: string) {

  // Procesamiento de datos para adaptarlos al formato esperado

  
  try {

    
    // Buscar la cotización existente
    const quoteIndex = quotesDB.findIndex(q => q.id === quoteId);
    
    if (quoteIndex === -1) {
      return { success: false, error: 'Cotización no encontrada' };
    }
    

    
 
    

    
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
export async function changeQuoteStatus(quoteId: string) {
  try {
    // Buscar la cotización existente
    const quoteIndex = quotesDB.findIndex(q => q.id === quoteId);
    
    if (quoteIndex === -1) {
      return { success: false, error: 'Cotización no encontrada' };
    }
    
    // Actualizar el estado de la cotización
    quotesDB[quoteIndex] = {
      ...quotesDB[quoteIndex],
      
    };
    

    
    // Revalidar las rutas para actualizar los datos mostrados
    revalidatePath('/dashboard/cotizaciones');
    revalidatePath(`/dashboard/cotizaciones/${quoteId}`);
    
    return { success: true };
  } catch {
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
    
 
    // Revalidar la ruta para actualizar los datos mostrados
    revalidatePath('/dashboard/cotizaciones');
    
    return { success: true };
  } catch {
    return { success: false, error: 'Error al eliminar la cotización' };
  }
}


