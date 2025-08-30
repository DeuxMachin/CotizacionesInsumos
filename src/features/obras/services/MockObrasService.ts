"use client";

import type { Obra, EstadoObra, FiltroObras, EstadisticasObras, EtapaObra } from "../model/types";
import { mockObras } from "../model/mock";
import type { IObrasService } from "./ObrasService";

export class MockObrasService implements IObrasService {
  private obras: Obra[] = [...mockObras];

  async getObras(filtros: FiltroObras, userId?: string, isAdmin?: boolean): Promise<Obra[]> {
    // Simulamos un delay para emular una API real
    await new Promise(resolve => setTimeout(resolve, 300));

    let obras = [...this.obras];

    // Filtrar por vendedor si no es admin
    if (!isAdmin && userId) {
      obras = obras.filter(obra => obra.vendedorAsignado === userId);
    }

    // Aplicar filtros
    if (filtros.estado && filtros.estado.length > 0) {
      obras = obras.filter(obra => filtros.estado!.includes(obra.estado));
    }

    if (filtros.etapa && filtros.etapa.length > 0) {
      obras = obras.filter(obra => filtros.etapa!.includes(obra.etapaActual));
    }

    if (filtros.vendedor) {
      obras = obras.filter(obra => obra.vendedorAsignado === filtros.vendedor);
    }

    if (filtros.fechaDesde) {
      obras = obras.filter(obra => obra.fechaInicio >= filtros.fechaDesde!);
    }

    if (filtros.fechaHasta) {
      obras = obras.filter(obra => obra.fechaInicio <= filtros.fechaHasta!);
    }

    if (filtros.busqueda) {
      const busqueda = filtros.busqueda.toLowerCase();
      obras = obras.filter(obra => 
        obra.nombreEmpresa.toLowerCase().includes(busqueda) ||
        obra.constructora.nombre.toLowerCase().includes(busqueda) ||
        obra.direccionObra.toLowerCase().includes(busqueda) ||
        obra.constructora.rut.includes(busqueda)
      );
    }

    return obras;
  }

  async getObraById(id: string): Promise<Obra | null> {
    // Simulamos un delay para emular una API real
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const obra = this.obras.find(o => o.id === id);
    return obra || null;
  }

  getEstadisticas(obras: Obra[]): EstadisticasObras {
    const obrasPorEstado = obras.reduce((acc, obra) => {
      acc[obra.estado] = (acc[obra.estado] || 0) + 1;
      return acc;
    }, {} as Record<EstadoObra, number>);

    const obrasPorEtapa = obras.reduce((acc, obra) => {
      acc[obra.etapaActual] = (acc[obra.etapaActual] || 0) + 1;
      return acc;
    }, {} as Record<EtapaObra, number>);

    const valorTotalEstimado = obras.reduce((acc, obra) => acc + (obra.valorEstimado || 0), 0);
    const materialVendidoTotal = obras.reduce((acc, obra) => acc + obra.materialVendido, 0);

    return {
      totalObras: obras.length,
      obrasPorEstado,
      obrasPorEtapa,
      valorTotalEstimado,
      materialVendidoTotal
    };
  }

  async actualizarEstadoObra(id: string, nuevoEstado: EstadoObra): Promise<boolean> {
    // Simulamos un delay para emular una API real
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const obraIndex = this.obras.findIndex(o => o.id === id);
    if (obraIndex === -1) return false;
    
    this.obras[obraIndex] = {
      ...this.obras[obraIndex],
      estado: nuevoEstado,
      fechaActualizacion: new Date()
    };
    
    return true;
  }

  async eliminarObra(id: string): Promise<boolean> {
    // Simulamos un delay para emular una API real
    await new Promise(resolve => setTimeout(resolve, 600));
    
    const obraIndex = this.obras.findIndex(o => o.id === id);
    if (obraIndex === -1) return false;
    
    this.obras.splice(obraIndex, 1);
    return true;
  }
}
