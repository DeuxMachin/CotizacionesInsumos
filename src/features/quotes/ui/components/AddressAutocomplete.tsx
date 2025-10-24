"use client";

import React, { useState, useEffect, useRef } from 'react';
import { FiMapPin, FiNavigation, FiSearch } from 'react-icons/fi';

interface AddressSuggestion {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
  lat: number;
  lng: number;
  address: Record<string, unknown>;
}

interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onAddressSelect?: (addressData: {
    direccion: string;
    ciudad?: string;
    comuna?: string;
    region?: string;
    lat?: number;
    lng?: number;
  }) => void;
  placeholder?: string;
  className?: string;
  showCurrentLocation?: boolean;
}

export function AddressAutocomplete({
  value,
  onChange,
  onAddressSelect,
  placeholder = "Buscar dirección...",
  className = "",
  showCurrentLocation = true
}: AddressAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Buscar direcciones usando la API
  const searchAddresses = async (query: string) => {
    if (query.length < 3) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/geocoding?action=search&q=${encodeURIComponent(query)}`);
      if (response.ok) {
        const data = await response.json();
        setSuggestions(data.results || []);
        setShowSuggestions(true);
      }
    } catch (error) {
      console.error('Error searching addresses:', error);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Obtener ubicación actual
  const getCurrentLocation = async () => {
    setIsGettingLocation(true);
    try {
      if (!navigator.geolocation) {
        alert('Geolocalización no soportada en este navegador');
        return;
      }

      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000
        });
      });

      const { latitude, longitude } = position.coords;

      // Obtener dirección usando reverse geocoding
      const response = await fetch(`/api/geocoding?action=reverse&lat=${latitude}&lng=${longitude}`);
      if (response.ok) {
        const data = await response.json();
        const addressData = {
          direccion: data.formatted_address || `${latitude}, ${longitude}`,
          ciudad: data.ciudad,
          comuna: data.comuna,
          region: data.region,
          lat: latitude,
          lng: longitude
        };

        onChange(addressData.direccion);
        onAddressSelect?.(addressData);
      }
    } catch (error) {
      console.error('Error getting location:', error);
      alert('Error al obtener la ubicación actual');
    } finally {
      setIsGettingLocation(false);
    }
  };

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (value) {
        searchAddresses(value);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [value]);

  // Click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSuggestionClick = (suggestion: AddressSuggestion) => {
    const addr = suggestion.address || {};
    const addressData = {
      direccion: suggestion.description,
      ciudad: (typeof addr['city'] === 'string' && addr['city']) ||
              (typeof addr['town'] === 'string' && addr['town']) ||
              (typeof addr['village'] === 'string' && addr['village']) || undefined,
      comuna: (typeof addr['municipality'] === 'string' && addr['municipality']) ||
              (typeof addr['city_district'] === 'string' && addr['city_district']) ||
              (typeof addr['county'] === 'string' && addr['county']) || undefined,
      region: (typeof addr['state'] === 'string' && addr['state']) ||
              (typeof addr['region'] === 'string' && addr['region']) || undefined,
      lat: suggestion.lat,
      lng: suggestion.lng
    };

    onChange(suggestion.description);
    onAddressSelect?.(addressData);
    setShowSuggestions(false);
  };

  return (
    <div className="relative">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <FiMapPin className="w-5 h-5" style={{ color: 'var(--text-muted)' }} />
        </div>
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => value && suggestions.length > 0 && setShowSuggestions(true)}
          className={`w-full pl-10 pr-12 py-3 rounded-lg border transition-colors focus:ring-2 focus:ring-offset-2 placeholder-gray-500 dark:placeholder-gray-400 ${className}`}
          style={{
            backgroundColor: 'var(--input-bg)',
            borderColor: 'var(--border)',
            color: 'var(--text-primary)'
          }}
          placeholder={placeholder}
        />
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 gap-1">
          {isLoading && (
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-t-transparent" style={{ borderColor: 'var(--text-muted)' }}></div>
          )}
          {showCurrentLocation && (
            <button
              type="button"
              onClick={getCurrentLocation}
              disabled={isGettingLocation}
              className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
              title="Usar ubicación actual"
            >
              {isGettingLocation ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-t-transparent" style={{ borderColor: 'var(--accent-primary)' }}></div>
              ) : (
                <FiNavigation className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
              )}
            </button>
          )}
        </div>
      </div>

      {/* Suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute z-50 w-full mt-1 rounded-lg shadow-lg max-h-60 overflow-y-auto"
          style={{
            backgroundColor: 'var(--card-bg)',
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-lg)'
          }}
        >
          {suggestions.map((suggestion) => (
            <button
              key={suggestion.place_id}
              type="button"
              onClick={() => handleSuggestionClick(suggestion)}
              className="w-full px-4 py-3 text-left border-b last:border-b-0 transition-colors"
              style={{
                borderColor: 'var(--border-subtle)',
                color: 'var(--text-primary)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--bg-secondary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <div className="flex items-start gap-3">
                <FiSearch className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: 'var(--accent-primary)' }} />
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-sm truncate" style={{ color: 'var(--text-primary)' }}>
                    {suggestion.structured_formatting.main_text}
                  </div>
                  <div className="text-xs truncate" style={{ color: 'var(--text-secondary)' }}>
                    {suggestion.structured_formatting.secondary_text}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}