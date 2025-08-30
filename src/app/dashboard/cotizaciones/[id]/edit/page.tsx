import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Quote } from '@/core/domain/quote/Quote';
import { updateQuote } from '@/app/actions/quotes';
import { QuoteForm } from '@/features/quotes/ui/QuoteForm';

// Mock de datos (en producción, esto vendría de una base de datos real)
const quotesDB: Quote[] = [
  {
    id: 'COT-001',
    client: 'Constructora XYZ',
    date: '2023-08-15',
    status: 'pending',
    amount: 1250000
  },
  {
    id: 'COT-002',
    client: 'Inmobiliaria ABC',
    date: '2023-08-20',
    status: 'approved',
    amount: 785000
  }
];

// Función para obtener una cotización por ID
async function getQuoteById(id: string): Promise<Quote | null> {
  // En producción, esta sería una consulta a la base de datos
  const quote = quotesDB.find(q => q.id === id);
  return quote || null;
}

export default async function EditQuotePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const quote = await getQuoteById(id);
  
  // Si no se encuentra la cotización, mostrar la página 404
  if (!quote) {
    notFound();
  }
  
  // Server action para actualizar la cotización
  async function handleUpdateQuote(formData: FormData) {
    'use server';
    return updateQuote(id, formData);
  }
  
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Editar Cotización</h1>
        <Link 
          href={`/dashboard/cotizaciones/${id}`}
          className="text-blue-600 hover:underline"
        >
          Volver a detalles
        </Link>
      </div>
      
      <div className="bg-white shadow-md rounded-lg p-6">
        <QuoteForm 
          quote={quote} 
          onSubmit={handleUpdateQuote} 
          submitButtonText="Actualizar Cotización"
        />
      </div>
    </div>
  );
}
