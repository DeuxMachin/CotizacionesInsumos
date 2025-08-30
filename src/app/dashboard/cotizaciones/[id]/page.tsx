import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Quote } from '@/core/domain/quote/Quote';
import { changeQuoteStatus, deleteQuote } from '@/app/actions/quotes';

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

export default async function QuoteDetailsPage({ params }: { params: { id: string } }) {
  const quote = await getQuoteById(params.id);
  
  // Si no se encuentra la cotización, mostrar la página 404
  if (!quote) {
    notFound();
  }
  
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Detalle de Cotización</h1>
        <span 
          className={`px-3 py-1 rounded-full text-sm font-medium ${
            quote.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
            quote.status === 'approved' ? 'bg-green-100 text-green-800' : 
            'bg-red-100 text-red-800'
          }`}
        >
          {quote.status === 'pending' ? 'Pendiente' : 
           quote.status === 'approved' ? 'Aprobada' : 'Rechazada'}
        </span>
      </div>
      
      <div className="bg-white shadow-md rounded-lg p-6 mb-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">ID de Cotización</p>
            <p className="font-medium">{quote.id}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Cliente</p>
            <p className="font-medium">{quote.client}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Fecha</p>
            <p className="font-medium">{quote.date}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Monto Total</p>
            <p className="font-medium">${quote.amount.toLocaleString()}</p>
          </div>
        </div>
      </div>
      
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-4">Acciones</h2>
        <div className="flex space-x-4">
          {/* Enlace para editar la cotización */}
          <Link 
            href={`/dashboard/cotizaciones/${quote.id}/edit`}
            className="px-4 py-2 bg-blue-500 text-white rounded-md"
          >
            Editar
          </Link>
          
          {/* Formulario para cambiar estado a aprobado */}
          <form action={async () => {
            'use server';
            await changeQuoteStatus(quote.id, 'approved');
          }}>
            <button 
              type="submit"
              disabled={quote.status === 'approved'}
              className="px-4 py-2 bg-green-500 text-white rounded-md disabled:opacity-50"
            >
              Aprobar
            </button>
          </form>
          
          {/* Formulario para cambiar estado a rechazado */}
          <form action={async () => {
            'use server';
            await changeQuoteStatus(quote.id, 'rejected');
          }}>
            <button 
              type="submit"
              disabled={quote.status === 'rejected'}
              className="px-4 py-2 bg-red-500 text-white rounded-md disabled:opacity-50"
            >
              Rechazar
            </button>
          </form>
          
          {/* Formulario para eliminar la cotización */}
          <form action={async () => {
            'use server';
            await deleteQuote(quote.id);
          }}>
            <button 
              type="submit"
              className="px-4 py-2 bg-gray-500 text-white rounded-md"
            >
              Eliminar
            </button>
          </form>
        </div>
      </div>
      
      {/* Aquí podrían ir más detalles como ítems de la cotización, historial, etc. */}
    </div>
  );
}
