"use client";

import { create } from "zustand";
import type { PosibleTarget, CreateTargetData, UpdateTargetData, AddNoteData } from "./types";

interface TargetsStore {
  targets: PosibleTarget[];
  loading: boolean;
  error: string | null;
  
  // Acciones
  fetchTargets: () => Promise<void>;
  createTarget: (data: CreateTargetData) => Promise<void>;
  updateTarget: (id: string, data: UpdateTargetData) => Promise<void>;
  deleteTarget: (id: string) => Promise<void>;
  addNote: (data: AddNoteData) => Promise<void>;
  claimTarget: (id: string) => Promise<void>;
  releaseTarget: (id: string) => Promise<void>;
}

// Mock data actualizado
const mockTargets: PosibleTarget[] = [
  {
    id: "1",
    titulo: "Construcción Residencial Las Condes",
    descripcion: "Posible construcción de casa en zona residencial de Las Condes",
    ubicacion: {
      direccion: "Av. Las Condes 12345, Las Condes, Santiago",
      lat: -33.4053,
      lng: -70.5774,
      googleMapsUrl: "https://maps.google.com/?q=-33.4053,-70.5774",
      ciudad: "Santiago",
      region: "Metropolitana"
    },
    contacto: {
      nombre: "María González",
      telefono: "+56912345678",
      email: "maria@gmail.com",
      empresa: "Inmobiliaria González"
    },
    estado: "pendiente",
    prioridad: "alta",
    fechaCreacion: "2024-01-15T10:30:00Z",
    creadoPor: "vendedor1",
    tipoObra: "Residencial",
    observaciones: "Visto por vendedor durante ronda matutina",
    notas: []
  },
  {
    id: "2", 
    titulo: "Ampliación Local Comercial Providencia",
    descripcion: "Local comercial que planea ampliar su espacio",
    ubicacion: {
      direccion: "Av. Providencia 2456, Providencia, Santiago", 
      lat: -33.4242,
      lng: -70.6053,
      googleMapsUrl: "https://maps.google.com/?q=-33.4242,-70.6053",
      ciudad: "Santiago",
      region: "Metropolitana"
    },
    contacto: {
      nombre: "Carlos Pérez",
      telefono: "+56987654321",
      empresa: "Comercial Pérez Ltda."
    },
    estado: "contactado",
    prioridad: "media", 
    fechaCreacion: "2024-01-10T14:20:00Z",
    fechaContacto: "2024-01-12T09:15:00Z",
    creadoPor: "vendedor2",
    gestionadoPor: "vendedor1",
    nombreGestionadoPor: "Juan Vendedor",
    tipoObra: "Comercial",
    notas: [
      {
        id: "n1",
        texto: "Cliente interesado, programar visita técnica",
        fecha: "2024-01-12T09:15:00Z",
        autor: "Juan Vendedor"
      }
    ]
  },
  {
    id: "3",
    titulo: "Proyecto Industrial Quilicura",
    descripcion: "Construcción de nueva bodega para productos electrónicos",
    ubicacion: {
      direccion: "Los Robles 500, Quilicura, Santiago",
      lat: -33.3605,
      lng: -70.7394,
      googleMapsUrl: "https://maps.google.com/?q=-33.3605,-70.7394",
      ciudad: "Santiago", 
      region: "Metropolitana"
    },
    contacto: {
      nombre: "Roberto Silva",
      telefono: "+56988776655",
      email: "roberto.silva@electrotech.cl",
      empresa: "ElectroTech Industrial Ltda."
    },
    estado: "gestionando",
    prioridad: "alta",
    fechaCreacion: "2024-01-05T16:00:00Z",
    fechaContacto: "2024-01-07T13:30:00Z",
    creadoPor: "vendedor3",
    gestionadoPor: "vendedor1",
    nombreGestionadoPor: "Juan Vendedor",
    tipoObra: "Industrial",
    fechaEstimadaInicio: "2024-03-01",
    observaciones: "Cliente muy interesado, necesita cotización urgente para materiales eléctricos",
    notas: [
      {
        id: "n2",
        texto: "Reunión programada para el viernes próximo",
        fecha: "2024-01-07T14:00:00Z",
        autor: "Juan Vendedor"
      },
      {
        id: "n3",
        texto: "Enviada cotización preliminar por email",
        fecha: "2024-01-10T10:15:00Z",
        autor: "Juan Vendedor"
      }
    ]
  },
  {
    id: "4",
    titulo: "Centro Comercial Ñuñoa",
    descripcion: "Ampliación de centro comercial existente, nueva ala de tiendas",
    ubicacion: {
      direccion: "Av. Grecia 8000, Ñuñoa, Santiago",
      lat: -33.4569,
      lng: -70.5871,
      googleMapsUrl: "https://maps.google.com/?q=-33.4569,-70.5871",
      ciudad: "Santiago",
      region: "Metropolitana"
    },
    contacto: {
      nombre: "Andrea Morales",
      telefono: "+56977889900",
      email: "a.morales@mallnunoa.cl",
      empresa: "Mall Ñuñoa S.A."
    },
    estado: "cerrado",
    prioridad: "alta",
    fechaCreacion: "2023-12-20T11:20:00Z",
    fechaContacto: "2023-12-21T09:45:00Z",
    creadoPor: "vendedor2",
    gestionadoPor: "vendedor3",
    nombreGestionadoPor: "María Vendedora",
    tipoObra: "Comercial",
    fechaEstimadaInicio: "2024-02-15",
    observaciones: "Proyecto aprobado, contrato firmado",
    notas: [
      {
        id: "n4",
        texto: "Primera reunión muy exitosa. Cliente decidido a avanzar",
        fecha: "2023-12-21T10:30:00Z",
        autor: "María Vendedora"
      },
      {
        id: "n5",
        texto: "Cotización enviada y aprobada. Procediendo con contrato",
        fecha: "2024-01-05T14:20:00Z",
        autor: "María Vendedora"
      },
      {
        id: "n6",
        texto: "Contrato firmado! Inicio de obras confirmado",
        fecha: "2024-01-15T16:45:00Z",
        autor: "María Vendedora"
      }
    ]
  }
];

export const useTargets = create<TargetsStore>((set, get) => ({
  targets: [],
  loading: false,
  error: null,

  fetchTargets: async () => {
    set({ loading: true, error: null });
    try {
      // Simulación de API call
      await new Promise(resolve => setTimeout(resolve, 800));
      set({ targets: mockTargets, loading: false });
  } catch {
      set({ error: "Error al cargar targets", loading: false });
    }
  },

  createTarget: async (data: CreateTargetData) => {
    set({ loading: true, error: null });
    try {
      const newTarget: PosibleTarget = {
        id: Date.now().toString(),
        titulo: data.titulo,
        descripcion: data.descripcion,
        ubicacion: {
          direccion: data.direccion,
          lat: data.lat,
          lng: data.lng,
          ciudad: data.ciudad,
          region: data.region,
          googleMapsUrl: `https://maps.google.com/?q=${data.lat},${data.lng}`
        },
        contacto: {
          nombre: data.contactoNombre,
          telefono: data.contactoTelefono,
          email: data.contactoEmail,
          empresa: data.contactoEmpresa
        },
        estado: "pendiente",
        prioridad: data.prioridad,
        fechaCreacion: new Date().toISOString(),
        creadoPor: "current_user", // TODO: Get from auth
        tipoObra: data.tipoObra,
        fechaEstimadaInicio: data.fechaEstimadaInicio,
        observaciones: data.observaciones,
        notas: []
      };

      await new Promise(resolve => setTimeout(resolve, 500));
      const currentTargets = get().targets;
      set({ targets: [...currentTargets, newTarget], loading: false });
    } catch (e) {
      set({ error: "Error al crear target", loading: false });
      throw e;
    }
  },

  updateTarget: async (id: string, data: UpdateTargetData) => {
    set({ loading: true, error: null });
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      const currentTargets = get().targets;
      const updatedTargets = currentTargets.map(target => 
        target.id === id ? { ...target, ...data } : target
      );
      set({ targets: updatedTargets, loading: false });
    } catch (e) {
      set({ error: "Error al actualizar target", loading: false });
      throw e;
    }
  },

  deleteTarget: async (id: string) => {
    set({ loading: true, error: null });
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      const currentTargets = get().targets;
      const filteredTargets = currentTargets.filter(target => target.id !== id);
      set({ targets: filteredTargets, loading: false });
    } catch (e) {
      set({ error: "Error al eliminar target", loading: false });
      throw e;
    }
  },

  addNote: async (data: AddNoteData) => {
    set({ loading: true, error: null });
    try {
      const newNote = {
        id: Date.now().toString(),
        texto: data.texto,
        fecha: new Date().toISOString(),
        autor: "Usuario Actual" // TODO: Get from auth
      };

      await new Promise(resolve => setTimeout(resolve, 300));
      const currentTargets = get().targets;
      const updatedTargets = currentTargets.map(target => 
        target.id === data.targetId 
          ? { ...target, notas: [...target.notas, newNote] }
          : target
      );
      set({ targets: updatedTargets, loading: false });
    } catch (error) {
      set({ error: "Error al agregar nota", loading: false });
      throw error;
    }
  },

  claimTarget: async (id: string) => {
    set({ loading: true, error: null });
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      const currentTargets = get().targets;
      const updatedTargets = currentTargets.map(target => 
        target.id === id 
          ? { 
              ...target, 
              gestionadoPor: "current_user",
              nombreGestionadoPor: "Usuario Actual",
              estado: target.estado === "pendiente" ? "contactado" : target.estado,
              fechaContacto: target.fechaContacto || new Date().toISOString()
            }
          : target
      );
      set({ targets: updatedTargets, loading: false });
    } catch (error) {
      set({ error: "Error al tomar target", loading: false });
      throw error;
    }
  },

  releaseTarget: async (id: string) => {
    set({ loading: true, error: null });
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      const currentTargets = get().targets;
      const updatedTargets = currentTargets.map(target => 
        target.id === id 
          ? { 
              ...target, 
              gestionadoPor: undefined,
              nombreGestionadoPor: undefined
            }
          : target
      );
      set({ targets: updatedTargets, loading: false });
    } catch (error) {
      set({ error: "Error al liberar target", loading: false });
      throw error;
    }
  }
}));
