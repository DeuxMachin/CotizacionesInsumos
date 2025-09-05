"use client";

import { useState, useCallback } from 'react';

import { Client, searchClients, getAllClients, getClientById } from './clients';
import { Toast } from '@/shared/ui/Toast';

// Tipo para el nuevo cliente (sin campos calculados)
export interface NewClientData extends Omit<Client, 'id'> {
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
    
    // Calcular dígito verificador
    let sum = 0;
    let multiplier = 2;
    
    for (let i = body.length - 1; i >= 0; i--) {
      sum += parseInt(body.charAt(i)) * multiplier;
      multiplier = multiplier === 7 ? 2 : multiplier + 1;
    }
    
    const remainder = sum % 11;
    const calculatedDV = remainder < 2 ? remainder.toString() : (11 - remainder === 10 ? 'K' : (11 - remainder).toString());
    
    return dv === calculatedDV;
  }, []);

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

      // Simular llamada a la API
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Aquí iría la lógica real para crear el cliente
      console.log('Creando cliente:', clientData);
      
      Toast.success('Cliente creado exitosamente');
      setLoading(false);
      return true;
      
    } catch (error) {
      console.error('Error creating client:', error);
      Toast.error('Error al crear el cliente');
      setLoading(false);
      return false;
    }
  }, [validateRUT]);

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
    searchClients,
    getAllClients,
    getClientById
  };
}
