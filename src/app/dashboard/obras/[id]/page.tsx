"use client";

import { useRouter, useParams } from 'next/navigation';
import { useObras } from '@/features/obras/model/useObras';
import { ObraDetailPage } from '@/features/obras/ui/ObraDetailPage';
import { useState, useEffect } from 'react';
import type { Obra, EstadoObra, EtapaObra } from '@/features/obras/model/types';

export default function ObraDetailPageRoute() {
  const router = useRouter();
  const params = useParams();
  const { obtenerObra, actualizarEstadoObra } = useObras();
  const [obra, setObra] = useState<Obra | null>(null);
  const [loading, setLoading] = useState(true);

  const obraId = params?.id as string;

  useEffect(() => {
    if (!obraId) {
      router.push('/dashboard/obras');
      return;
    }

    const fetchObra = async () => {
      try {
        const obraData = await obtenerObra(obraId);
        if (!obraData) {
          router.push('/dashboard/obras');
          return;
        }
        setObra(obraData);
      } catch (error) {
        console.error('Error al cargar la obra:', error);
        router.push('/dashboard/obras');
      } finally {
        setLoading(false);
      }
    };

    fetchObra();
  }, [obraId, obtenerObra, router]);

  const handleUpdate = async (updatedObra: Obra): Promise<boolean> => {
    try {
      const success = await actualizarEstadoObra(updatedObra.id, updatedObra.estado);
      if (success) {
        setObra(updatedObra);
      }
      return success;
    } catch (error) {
      console.error('Error al actualizar la obra:', error);
      return false;
    }
  };

  const formatMoney = (amount: number): string => {
    if (typeof amount !== 'number' || isNaN(amount)) return '$0';
    
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getEstadoColor = (estado: EstadoObra) => {
    const colorsMap: Record<EstadoObra, { bg: string; text: string }> = {
      'planificacion': { bg: 'var(--badge-warning-bg)', text: 'var(--badge-warning-text)' },
      'activa': { bg: 'var(--badge-success-bg)', text: 'var(--badge-success-text)' },
      'pausada': { bg: 'var(--badge-error-bg)', text: 'var(--badge-error-text)' },
      'finalizada': { bg: 'var(--badge-info-bg)', text: 'var(--badge-info-text)' },
      'cancelada': { bg: 'var(--badge-error-bg)', text: 'var(--badge-error-text)' },
      'sin_contacto': { bg: 'var(--badge-secondary-bg)', text: 'var(--badge-secondary-text)' },
    };
    return colorsMap[estado] || { bg: 'var(--badge-secondary-bg)', text: 'var(--badge-secondary-text)' };
  };

  const getEtapaColor = (etapa: EtapaObra) => {
    const colorsMap: Record<EtapaObra, { bg: string; text: string }> = {
      'fundacion': { bg: 'var(--badge-warning-bg)', text: 'var(--badge-warning-text)' },
      'estructura': { bg: 'var(--badge-info-bg)', text: 'var(--badge-info-text)' },
      'albanileria': { bg: 'var(--badge-success-bg)', text: 'var(--badge-success-text)' },
      'instalaciones': { bg: 'var(--badge-primary-bg)', text: 'var(--badge-primary-text)' },
      'terminaciones': { bg: 'var(--badge-success-bg)', text: 'var(--badge-success-text)' },
      'entrega': { bg: 'var(--badge-info-bg)', text: 'var(--badge-info-text)' },
    };
    return colorsMap[etapa] || { bg: 'var(--badge-secondary-bg)', text: 'var(--badge-secondary-text)' };
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: 'var(--accent-primary)' }}></div>
      </div>
    );
  }

  if (!obra) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <div className="text-center">
          <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Obra no encontrada</h2>
          <p className="mb-4" style={{ color: 'var(--text-secondary)' }}>La obra que buscas no existe o ha sido eliminada.</p>
          <button 
            onClick={() => router.push('/dashboard/obras')}
            className="btn-primary"
          >
            Volver a Obras
          </button>
        </div>
      </div>
    );
  }

  return (
    <ObraDetailPage
      obra={obra}
      onUpdate={handleUpdate}
      formatMoney={formatMoney}
      getEstadoColor={getEstadoColor}
      getEtapaColor={getEtapaColor}
    />
  );
}
