'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, MapPin, Loader2 } from 'lucide-react';

interface PhotonFeature {
  geometry: { coordinates: [number, number] };
  properties: {
    name?: string;
    street?: string;
    city?: string;
    state?: string;
    country?: string;
  };
}

interface GeospatialInputProps {
  placeholder: string;
  value: string;
  onChange: (address: string, lat: number, lng: number) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  className?: string;
  label?: string;
}

function formatPhotonAddress(feature: PhotonFeature): string {
  const p = feature.properties;
  return [p.name, p.street, p.city, p.state, p.country].filter(Boolean).join(', ');
}

async function searchPhoton(query: string): Promise<PhotonFeature[]> {
  const response = await fetch(`/api/photon?q=${encodeURIComponent(query)}&limit=8`);
  if (!response.ok) return [];
  const data = await response.json();
  return data.features ?? [];
}

export default function GeospatialInput({
  placeholder,
  value,
  onChange,
  onFocus,
  onBlur,
  className = '',
  label,
}: GeospatialInputProps) {
  const [inputValue, setInputValue] = useState(value);
  const [suggestions, setSuggestions] = useState<PhotonFeature[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [fetchError, setFetchError] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const selectingRef = useRef(false);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  useEffect(() => {
    const MIN_CHARS = 2;
    if (inputValue.trim().length < MIN_CHARS) {
      setSuggestions([]);
      setIsOpen(false);
      setFetchError(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      setFetchError(false);
      try {
        const results = await searchPhoton(inputValue);
        setSuggestions(results);
        setIsOpen(true);
        if (results.length === 0) setFetchError(true);
      } catch (error) {
        console.error('Photon geocoding error:', error);
        setSuggestions([]);
        setFetchError(true);
        setIsOpen(true);
      } finally {
        setIsLoading(false);
      }
    }, 280);

    return () => clearTimeout(timer);
  }, [inputValue]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (feature: PhotonFeature) => {
    const [lng, lat] = feature.geometry.coordinates;
    const address = formatPhotonAddress(feature);
    selectingRef.current = true;
    onChange(address, lat, lng);
    setInputValue(address);
    setIsOpen(false);
    inputRef.current?.blur();
    setTimeout(() => { selectingRef.current = false; }, 0);
  };

  return (
    <div className={`relative ${className}`} style={{ zIndex: isOpen ? 50 : 'auto' }}>
      {label && (
        <label className="text-[10px] tracking-widest uppercase mb-1 block" style={{ color: '#555' }}>
          {label}
        </label>
      )}

      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 z-10" style={{ color: '#555' }}>
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
        </div>

        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            onChange(e.target.value, 0, 0);
          }}
          onFocus={() => {
            onFocus?.();
            if (inputValue.length >= 2 && suggestions.length > 0) setIsOpen(true);
          }}
          onBlur={() => {
            if (!selectingRef.current) onBlur?.();
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && suggestions.length > 0) {
              e.preventDefault();
              handleSelect(suggestions[0]);
            }
          }}
          placeholder={placeholder}
          className="w-full pl-10 pr-4 py-3 text-sm rounded-xl transition-all placeholder-zinc-600 focus:outline-none"
          style={{ background: '#0a0a0a', border: '1px solid #1a1a1a', color: '#f5f5f5' }}
        />
      </div>

      {isOpen && suggestions.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-[9999] mt-2 w-full rounded-xl shadow-2xl overflow-hidden max-h-72 overflow-y-auto"
          style={{ background: '#0a0a0a', border: '1px solid #1a1a1a' }}
        >
          {suggestions.map((feature, index) => {
            const address = formatPhotonAddress(feature);
            return (
              <button
                key={`${feature.geometry.coordinates.join('-')}-${index}`}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleSelect(feature)}
                className="w-full px-4 py-3 flex items-start gap-3 text-left transition-colors border-b last:border-none"
                style={{ borderColor: '#1a1a1a' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#111'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
              >
                <MapPin className="w-4 h-4 mt-0.5 shrink-0" style={{ color: '#3b82f6' }} />
                <span className="text-sm text-left line-clamp-2" style={{ color: '#ccc' }}>{address}</span>
              </button>
            );
          })}
        </div>
      )}

      {isOpen && suggestions.length === 0 && !isLoading && inputValue.length >= 2 && (
        <div
          className="absolute z-[9999] mt-2 w-full rounded-xl p-4 text-sm"
          style={{ background: '#0a0a0a', border: '1px solid #1a1a1a', color: '#555' }}
        >
          {fetchError ? 'Geocoder unavailable — check Photon on port 2322' : 'No results found'}
        </div>
      )}
    </div>
  );
}
