"use client";

import React, { useState, useEffect, useRef } from 'react';
import { FiSearch, FiUser, FiCheck, FiX } from 'react-icons/fi';
import { useClients } from '@/features/clients/model/useClients';
import { ClientInfo } from '@/core/domain/quote/Quote';
import { Client } from '@/features/clients/model/clients';

interface ClientAutocompleteProps {
  value: string;
  onClientSelect: (clientData: Partial<ClientInfo>) => void;
  onValueChange: (value: string) => void;
  placeholder: string;
  field: 'rut' | 'razonSocial';
}

export function ClientAutocomplete({ 
  value, 
  onClientSelect, 
  onValueChange, 
  placeholder, 
  field 
}: ClientAutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<Client[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const { searchClients } = useClients();
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Buscar clientes cuando cambia el valor
  useEffect(() => {
    if (value && value.length >= 2) {
      const results = searchClients(value);
      setSearchResults(results);
      setIsOpen(results.length > 0);
      setSelectedIndex(-1);
    } else {
      setSearchResults([]);
      setIsOpen(false);
    }
  }, [value, searchClients]);

  // Cerrar cuando se hace click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Manejar teclas
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < searchResults.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : searchResults.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && searchResults[selectedIndex]) {
          handleClientSelect(searchResults[selectedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSelectedIndex(-1);
        break;
    }
  };

  // Seleccionar cliente
  const handleClientSelect = (client: Client) => {
    const clientData: Partial<ClientInfo> = {
      razonSocial: client.razonSocial,
      rut: client.rut,
      nombreFantasia: client.razonSocial, // Podríamos agregar este campo a Client si es necesario
      giro: client.giro,
      direccion: client.direccion,
      ciudad: client.ciudad,
      comuna: client.comuna,
      telefono: client.contactoTelefono,
      email: client.contactoEmail,
      nombreContacto: client.contactoNombre,
      telefonoContacto: client.contactoTelefono
    };

    onClientSelect(clientData);
    setIsOpen(false);
    setSelectedIndex(-1);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onValueChange(e.target.value);
  };

  const handleClearSelection = () => {
    onValueChange('');
    setIsOpen(false);
    setSelectedIndex(-1);
    inputRef.current?.focus();
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <FiSearch className="w-5 h-5" style={{ color: 'var(--text-muted)' }} />
        </div>
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          className="w-full pl-10 pr-10 py-3 rounded-lg border transition-colors focus:ring-2 focus:ring-offset-2"
          style={{
            backgroundColor: 'var(--input-bg)',
            borderColor: isOpen ? 'var(--accent-primary)' : 'var(--border)',
            color: 'var(--text-primary)'
          }}
          placeholder={placeholder}
          autoComplete="off"
        />
        {value && (
          <button
            onClick={handleClearSelection}
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
            type="button"
          >
            <FiX className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
          </button>
        )}
      </div>

      {/* Dropdown de resultados */}
      {isOpen && searchResults.length > 0 && (
        <div 
          className="absolute z-50 w-full mt-1 rounded-lg shadow-lg border overflow-hidden"
          style={{ 
            backgroundColor: 'var(--card-bg)', 
            borderColor: 'var(--border)',
            maxHeight: '300px',
            overflowY: 'auto'
          }}
        >
          <div className="p-2 border-b" style={{ borderColor: 'var(--border)' }}>
            <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
              {searchResults.length} cliente(s) encontrado(s)
            </span>
          </div>
          
          {searchResults.map((client, index) => (
            <button
              key={client.id}
              onClick={() => handleClientSelect(client)}
              className={`w-full text-left p-3 hover:bg-opacity-50 transition-colors ${
                index === selectedIndex ? 'ring-2 ring-inset' : ''
              }`}
              style={{
                backgroundColor: index === selectedIndex ? 'var(--accent-bg)' : 'transparent',
                color: 'var(--text-primary)'
              }}
            >
              <div className="flex items-start gap-3">
                <div 
                  className="p-2 rounded-lg flex-shrink-0 mt-1"
                  style={{ backgroundColor: 'var(--bg-secondary)' }}
                >
                  <FiUser className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium truncate">
                      {client.razonSocial}
                    </span>
                    <span 
                      className="text-xs px-2 py-0.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: 'var(--info-bg)', color: 'var(--info-text)' }}
                    >
                      {client.tipoEmpresa}
                    </span>
                  </div>
                  <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    RUT: {client.rut}
                  </div>
                  <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    {client.giro}
                  </div>
                  <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                    📍 {client.direccion}, {client.comuna}
                  </div>
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    👤 {client.contactoNombre} • 📞 {client.contactoTelefono}
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <FiCheck className="w-4 h-4" style={{ color: 'var(--success-text)' }} />
                </div>
              </div>
            </button>
          ))}

          <div className="p-3 border-t text-center" style={{ borderColor: 'var(--border)' }}>
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Usa las flechas ↑↓ para navegar, Enter para seleccionar
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
