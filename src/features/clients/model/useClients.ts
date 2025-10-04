"use client";

import { useState, useCallback } from 'react';
import { useAuthHeaders } from '@/hooks/useAuthHeaders';

// Eliminados helpers de mocks; ahora la data proviene de la API/Supabase
import { Toast } from '@/shared/ui/Toast';

// Tipo para el nuevo cliente (sin campos calculados) - ya no dependemos del tipo Client mock
export interface NewClientData {
  rut: string;
  razonSocial?: string;
  giro?: string | null;
  direccion?: string | null;
  region?: string;
  ciudad?: string | null;
  comuna?: string | null;
  tipoEmpresa?: string;
  // Tipo de Cliente (FK a cliente_tipos.id)
  clientTypeId?: number | null;
  contactoNombre?: string;
  contactoEmail?: string;
  contactoTelefono?: string;
  fantasyName?: string;
  business?: string;
  paymentResponsible?: string;
  paymentPhone?: string;
  credit?: number;
  additionalDays?: number;
  creditLine?: number;
  retention?: "SI" | "NO";
  discount?: number;
  email?: string;
  phone?: string;
  mobile?: string;
  contactName?: string;
  contactPhone?: string;
  paymentEmail?: string;
  transferInfo?: string;
}

export function useClients() {
  const [loading, setLoading] = useState(false);
  const [clientTypes, setClientTypes] = useState<Array<{ id: number; nombre: string }>>([]);

  // Función para formatear RUT
  const formatRUT = useCallback((rut: string): string => {
    // Remover puntos, guiones y espacios
    const cleanRut = rut.replace(/[.-\s]/g, '');
    
    if (cleanRut.length < 2) return cleanRut;
    
    // Separar dígito verificador
    const body = cleanRut.slice(0, -1);
    const dv = cleanRut.slice(-1);
    
    // Formatear con puntos
    const formattedBody = body.replace(/(\d)(?=(\d{3})+$)/g, '$1.');
    
    return `${formattedBody}-${dv}`;
  }, []);

  // Función para validar RUT
  const validateRUT = useCallback((rut: string): boolean => {
    const cleanRut = rut.replace(/[.-\s]/g, '');
    if (cleanRut.length < 2) return false;
    const body = cleanRut.slice(0, -1);
    const dv = cleanRut.slice(-1).toUpperCase();
    
    // Validar que el cuerpo del RUT sean números
    if (!/^\d+$/.test(body)) return false;
    
    // Para RUTs de empresas (77.352.551-5, etc.)
    // Cálculo de DV modo 11: dv = 0..9 o K
    let sum = 0;
    let multiplier = 2;
    for (let i = body.length - 1; i >= 0; i--) {
      const n = parseInt(body.charAt(i), 10);
      sum += n * multiplier;
      multiplier = multiplier === 7 ? 2 : multiplier + 1;
    }
    const remainder = 11 - (sum % 11);
    let calculatedDV: string;
    if (remainder === 11) calculatedDV = '0';
    else if (remainder === 10) calculatedDV = 'K';
    else calculatedDV = String(remainder);
    return dv === calculatedDV;
  }, []);

  // Hook para headers de autenticación
  const { createHeaders } = useAuthHeaders();

  // Función para crear un nuevo cliente
  const crearCliente = useCallback(async (clientData: NewClientData): Promise<boolean> => {
    setLoading(true);
    
    try {
      // Validar RUT
      if (!validateRUT(clientData.rut)) {
        Toast.error('El RUT ingresado no es válido');
        setLoading(false);
        return false;
      }

      console.log('🔍 useClients.crearCliente - Datos recibidos:', clientData);

      // Preparar array de contactos
      const contactos = [];
      
      // Contacto principal (siempre es obligatorio)
      if (clientData.contactoNombre && clientData.contactoEmail) {
        const contactoPrincipal = {
          tipo: 'principal' as const,
          nombre: clientData.contactoNombre,
          cargo: null,
          email: clientData.contactoEmail,
          telefono: clientData.contactoTelefono || null,
          celular: null,
          es_principal: true,
          notas: null,
          activo: true
        };
        contactos.push(contactoPrincipal);
        console.log('✅ Contacto Principal preparado:', contactoPrincipal);
      } else {
        console.warn('⚠️ Contacto Principal NO tiene datos completos:', {
          nombre: clientData.contactoNombre,
          email: clientData.contactoEmail
        });
      }
      
      // Responsable de pago (solo agregar si tiene al menos nombre Y email O teléfono)
      if (clientData.paymentResponsible && 
          (clientData.paymentEmail || clientData.paymentPhone)) {
        // Verificar que no sea duplicado del contacto principal
        const isDuplicate = clientData.paymentResponsible === clientData.contactoNombre;
        
        if (!isDuplicate) {
          const responsablePago = {
            tipo: 'pago' as const,
            nombre: clientData.paymentResponsible,
            cargo: null,
            email: clientData.paymentEmail || null,
            telefono: clientData.paymentPhone || null,
            celular: null,
            es_principal: false,
            notas: null,
            activo: true
          };
          contactos.push(responsablePago);
          console.log('✅ Responsable de Pago preparado:', responsablePago);
        } else {
          console.log('ℹ️ Responsable de pago es igual al contacto principal, se omite');
        }
      } else {
        console.log('ℹ️ No hay responsable de pago con datos completos');
      }
      
      // Contacto secundario (solo agregar si tiene nombre Y al menos email O teléfono)
      if (clientData.contactName && 
          (clientData.email || clientData.contactPhone) &&
          clientData.contactName !== clientData.contactoNombre &&
          clientData.contactName !== clientData.paymentResponsible) {
        const contactoSecundario = {
          tipo: 'secundario' as const,
          nombre: clientData.contactName,
          cargo: null,
          email: clientData.email || null,
          telefono: clientData.contactPhone || null,
          celular: null,
          es_principal: false,
          notas: null,
          activo: true
        };
        contactos.push(contactoSecundario);
        console.log('✅ Contacto Secundario preparado:', contactoSecundario);
      } else {
        console.log('ℹ️ No hay contacto secundario válido o es duplicado');
      }

      console.log('📋 Total de contactos preparados:', contactos.length, contactos);

      // Preparar el payload
      const payload = {
        rut: clientData.rut,
        nombre_razon_social: clientData.razonSocial || clientData.fantasyName || clientData.rut,
        nombre_fantasia: clientData.fantasyName || null,
        tipo: 'empresa',
        giro: clientData.business || clientData.giro || null,
        direccion: clientData.direccion || null,
        ciudad: clientData.ciudad || null,
        comuna: clientData.comuna || null,
        telefono: clientData.phone || null,
        celular: clientData.mobile || null,
        forma_pago: clientData.transferInfo || null,
        // Tipo de cliente (relación a cliente_tipos)
        cliente_tipo_id: clientData.clientTypeId ?? null,
        // Campos legacy para compatibilidad
        contacto_pago: clientData.paymentResponsible || null,
        email_pago: clientData.paymentEmail || null,
        telefono_pago: clientData.paymentPhone || null,
        linea_credito: clientData.creditLine || 0,
        descuento_cliente_pct: clientData.discount || 0,
        estado: 'vigente',
        // Nuevos contactos estructurados
        contactos: contactos
      };

      console.log('📤 Payload a enviar al API:', payload);

      // Llamada real a la API
      const res = await fetch('/api/clientes', {
        method: 'POST',
        headers: createHeaders(),
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Error al crear el cliente');
      }
      
      Toast.success('Cliente creado exitosamente');
      setLoading(false);
      return true;
      
    } catch (error) {
      console.error('Error creating client:', error);
      Toast.error('Error al crear el cliente');
      setLoading(false);
      return false;
    }
  }, [validateRUT, createHeaders]);

  // Función para validar email
  const validateEmail = useCallback((email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }, []);

  // Función para validar teléfono chileno
  const validatePhone = useCallback((phone: string): boolean => {
    // Formato chileno: +56 9 XXXX XXXX o 9 XXXX XXXX
    const phoneRegex = /^(\+56\s?)?[2-9]\d{8}$|^(\+56\s?)?9\d{8}$/;
    const cleanPhone = phone.replace(/[\s-]/g, '');
    return phoneRegex.test(cleanPhone);
  }, []);

  // Función para formatear teléfono
  const formatPhone = useCallback((phone: string): string => {
    const cleanPhone = phone.replace(/[^\d+]/g, '');
    
    // Si empieza con +56, formatear como +56 9 XXXX XXXX
    if (cleanPhone.startsWith('+56')) {
      const number = cleanPhone.slice(3);
      if (number.length === 9) {
        return `+56 ${number.charAt(0)} ${number.slice(1, 5)} ${number.slice(5)}`;
      }
      return cleanPhone;
    }
    
    // Si es un número de 9 dígitos, formatear como 9 XXXX XXXX
    if (cleanPhone.length === 9) {
      return `${cleanPhone.charAt(0)} ${cleanPhone.slice(1, 5)} ${cleanPhone.slice(5)}`;
    }
    
    return cleanPhone;
  }, []);

  // Obtener regiones de Chile
  const getRegiones = useCallback(() => {
    return [
      'Arica y Parinacota',
      'Tarapacá',
      'Antofagasta',
      'Atacama',
      'Coquimbo',
      'Valparaíso',
      'Metropolitana',
      'Libertador General Bernardo O\'Higgins',
      'Maule',
      'Ñuble',
      'Biobío',
      'Araucanía',
      'Los Ríos',
      'Los Lagos',
      'Aysén',
      'Magallanes'
    ];
  }, []);

  // Obtener tipos de empresa
  const getTiposEmpresa = useCallback(() => {
    return [
      { value: 'Ltda.', label: 'Sociedad de Responsabilidad Limitada (Ltda.)' },
      { value: 'S.A.', label: 'Sociedad Anónima (S.A.)' },
      { value: 'SpA', label: 'Sociedad por Acciones (SpA)' },
      { value: 'E.I.R.L.', label: 'Empresa Individual de Responsabilidad Limitada (E.I.R.L.)' },
      { value: 'Otra', label: 'Otra' }
    ];
  }, []);

  // Cargar tipos de cliente desde API
  const fetchClientTypes = useCallback(async () => {
    try {
      const res = await fetch('/api/clientes/tipos');
      if (!res.ok) throw new Error('Error al obtener tipos de cliente');
      const body = await res.json();
      setClientTypes(body.data || []);
      return body.data as Array<{ id: number; nombre: string }>;
    } catch (e) {
      console.error('Error fetching client types', e);
      return [] as Array<{ id: number; nombre: string }>;
    }
  }, []);

  return {
    loading,
    crearCliente,
    formatRUT,
    validateRUT,
    validateEmail,
    validatePhone,
    formatPhone,
    getRegiones,
    getTiposEmpresa,
    clientTypes,
    fetchClientTypes,
  // Ya no exponemos funciones locales de búsqueda; el consumo debe hacerse vía API
  };
}
