'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import type {
  DeliveryRequest,
  DeliveryUrgency,
  PhotonFeature,
  RouteMetrics,
} from '@/types/delivery';
import type { MapComponentProps } from '@/components/MapComponent';


const MapComponent = dynamic<MapComponentProps>(
  () => import('@/components/MapComponent'),
  {
    ssr: false,
    loading: () => (
      <div className="map-loading-skeleton">
        <div className="map-loading-pulse" />
        <span className="map-loading-text">Loading map…</span>
      </div>
    ),
  }
);


const PHOTON_BASE = 'https://photon.komoot.io/api';
const OSRM_BASE = 'http://localhost:5000';
const BACKEND_URL = '/api/deliveries';
const DEBOUNCE_MS = 300;

function formatPhotonAddress(props: PhotonFeature['properties']): string {
  return [props.name, props.street, props.housenumber, props.city, props.state, props.country]
    .filter((p): p is string => typeof p === 'string' && p.length > 0)
    .join(', ');
}

interface AddressInputProps {
  id: string;
  label: string;
  placeholder: string;
  value: string;
  onSelect: (address: string, lat: number, lng: number) => void;
  onChange: (value: string) => void;
}

function AddressInput({ id, label, placeholder, value, onSelect, onChange }: AddressInputProps) {
  const [suggestions, setSuggestions] = useState<PhotonFeature[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      onChange(val);

      if (timerRef.current) clearTimeout(timerRef.current);

      if (val.trim().length < 2) {
        setSuggestions([]);
        setIsOpen(false);
        return;
      }

      timerRef.current = setTimeout(async () => {
        setLoading(true);
        try {
          const res = await fetch(
            `${PHOTON_BASE}?q=${encodeURIComponent(val)}&limit=6`
          );
          if (!res.ok) throw new Error('Photon request failed');
          const data = await res.json();
          setSuggestions(data.features ?? []);
          setIsOpen(true);
        } catch {
          setSuggestions([]);
        } finally {
          setLoading(false);
        }
      }, DEBOUNCE_MS);
    },
    [onChange]
  );

  const handleSelect = useCallback(
    (feature: PhotonFeature) => {
      const [lng, lat] = feature.geometry.coordinates;
      const address = formatPhotonAddress(feature.properties);
      onSelect(address, lat, lng);
      setIsOpen(false);
    },
    [onSelect]
  );

  return (
    <div ref={containerRef} className="address-input-wrapper">
      <label htmlFor={id} className="field-label">
        {label}
      </label>
      <div className="input-container">
        <svg className="input-icon" viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
          <path
            fillRule="evenodd"
            d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
            clipRule="evenodd"
          />
        </svg>
        <input
          id={id}
          type="text"
          value={value}
          onChange={handleInputChange}
          onFocus={() => {
            if (value.length >= 2 && suggestions.length > 0) setIsOpen(true);
          }}
          placeholder={placeholder}
          className="text-input with-icon"
          autoComplete="off"
        />
        {loading && <div className="input-spinner" />}
      </div>

      {isOpen && suggestions.length > 0 && (
        <ul className="suggestion-dropdown">
          {suggestions.map((feature, idx) => {
            const addr = formatPhotonAddress(feature.properties);
            return (
              <li key={`${feature.geometry.coordinates.join('-')}-${idx}`}>
                <button
                  type="button"
                  className="suggestion-item"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleSelect(feature)}
                >
                  <svg viewBox="0 0 20 20" fill="currentColor" width="14" height="14" className="suggestion-icon">
                    <path
                      fillRule="evenodd"
                      d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="suggestion-text">{addr}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

/* ── Main page component ── */
export default function DispatchDashboardPage() {
  const [pickupAddress, setPickupAddress] = useState('');
  const [pickupLat, setPickupLat] = useState(0);
  const [pickupLng, setPickupLng] = useState(0);
  const [dropoffAddress, setDropoffAddress] = useState('');
  const [dropoffLat, setDropoffLat] = useState(0);
  const [dropoffLng, setDropoffLng] = useState(0);
  const [requestedPickupTime, setRequestedPickupTime] = useState('');
  const [deadline, setDeadline] = useState('');
  const [urgency, setUrgency] = useState<DeliveryUrgency>('NORMAL');
  const [notes, setNotes] = useState('');
  const [routeMetrics, setRouteMetrics] = useState<RouteMetrics | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  const [summaryStats, setSummaryStats] = useState<{
    distanceKm: number;
    estimatedTime: string;
    costBirr: number;
  } | null>(null);
  const routeAbortRef = useRef<AbortController | null>(null);

  /* ── Fetch OSRM route when both coords are set ── */
  useEffect(() => {
    if (pickupLat === 0 || pickupLng === 0 || dropoffLat === 0 || dropoffLng === 0) {
      setRouteMetrics(null);
      return;
    }

    if (routeAbortRef.current) routeAbortRef.current.abort();
    const controller = new AbortController();
    routeAbortRef.current = controller;

    const url =
      `${OSRM_BASE}/route/v1/driving/` +
      `${pickupLng},${pickupLat};${dropoffLng},${dropoffLat}` +
      `?overview=full&geometries=geojson`;

    fetch(url, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error(`OSRM HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        const route = data.routes?.[0];
        if (!route) return;
        setRouteMetrics({
          distanceKm: route.distance / 1000,
          durationMins: route.duration / 60,
          geometry: route.geometry as GeoJSON.LineString,
        });
      })
      .catch((err: Error) => {
        if (err.name !== 'AbortError') {
          console.error('OSRM routing error:', err);
          setRouteMetrics(null);
        }
      });

    return () => controller.abort();
  }, [pickupLat, pickupLng, dropoffLat, dropoffLng]);

  /* ── Handlers ── */
  const handlePickupSelect = useCallback((address: string, lat: number, lng: number) => {
    setPickupAddress(address);
    setPickupLat(lat);
    setPickupLng(lng);
  }, []);

  const handleDropoffSelect = useCallback((address: string, lat: number, lng: number) => {
    setDropoffAddress(address);
    setDropoffLat(lat);
    setDropoffLng(lng);
  }, []);

  const calculateHaversineDistance = useCallback(
    (lat1: number, lon1: number, lat2: number, lon2: number) => {
      const toRad = (value: number) => (value * Math.PI) / 180;
      const R = 6371; // Earth radius in km
      const dLat = toRad(lat2 - lat1);
      const dLon = toRad(lon2 - lon1);
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    },
    []
  );

  const formatDuration = useCallback((hours: number) => {
    const totalMinutes = Math.round(hours * 60);
    if (totalMinutes >= 60) {
      const hrs = Math.floor(totalMinutes / 60);
      const mins = totalMinutes % 60;
      return `${hrs} hr${mins ? ` ${mins} min` : ''}`;
    }
    return `${totalMinutes} min`;
  }, []);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      setErrorMessage('');

      const distanceKm = calculateHaversineDistance(
        pickupLat,
        pickupLng,
        dropoffLat,
        dropoffLng
      );
      const costBirr = Math.max(0, Math.round(distanceKm * 40));
      const estimatedTime = formatDuration(distanceKm / 30);

      setSummaryStats({ distanceKm, costBirr, estimatedTime });
      setIsSummaryOpen(true);
    },
    [calculateHaversineDistance, formatDuration, pickupLat, pickupLng, dropoffLat, dropoffLng]
  );

  const handleConfirmPayment = useCallback(async () => {
    if (!summaryStats) return;

    setSubmitting(true);
    setSubmitStatus('idle');
    setErrorMessage('');

    const payload: DeliveryRequest = {
      status: 'PENDING',
      pickupAddress,
      pickupLatitude: pickupLat,
      pickupLongitude: pickupLng,
      dropoffAddress,
      dropoffLatitude: dropoffLat,
      dropoffLongitude: dropoffLng,
      urgency,
      notes,
    };

    try {
      const res = await fetch(BACKEND_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const body = await res.text();
        throw new Error(body || `HTTP ${res.status}`);
      }

      setSubmitStatus('success');
      setPickupAddress('');
      setPickupLat(0);
      setPickupLng(0);
      setDropoffAddress('');
      setDropoffLat(0);
      setDropoffLng(0);
      setRequestedPickupTime('');
      setDeadline('');
      setUrgency('NORMAL');
      setNotes('');
      setRouteMetrics(null);
      setIsSummaryOpen(false);
      setSummaryStats(null);
    } catch (err) {
      setSubmitStatus('error');
      setErrorMessage(err instanceof Error ? err.message : 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  }, [
    pickupAddress,
    pickupLat,
    pickupLng,
    dropoffAddress,
    dropoffLat,
    dropoffLng,
    urgency,
    notes,
    summaryStats,
  ]);

  const handleCancelSummary = useCallback(() => {
    setIsSummaryOpen(false);
  }, []);

  const canSubmit =
    pickupAddress.length > 0 &&
    dropoffAddress.length > 0 &&
    pickupLat !== 0 &&
    dropoffLat !== 0;

  return (
    <>
      {isSummaryOpen && summaryStats && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
        >
          <div
            style={{
              width: 'min(520px, calc(100% - 40px))',
              background: '#ffffff',
              borderRadius: '24px',
              padding: '28px',
              boxShadow: '0 24px 64px rgba(0, 0, 0, 0.22)',
              color: '#111827',
            }}
          >
            <h2 style={{ margin: 0, marginBottom: '16px', fontSize: '1.45rem' }}>
              Delivery Summary
            </h2>
            <p style={{ margin: 0, marginBottom: '22px', color: '#6b7280' }}>
              Review this cost estimate before confirming payment.
            </p>
            <div style={{ display: 'grid', gap: '14px', marginBottom: '24px' }}>
              <div style={{ fontSize: '1rem', lineHeight: 1.6 }}>
                <strong>⏱️ Avg Delivery Time:</strong> {summaryStats.estimatedTime}
              </div>
              <div style={{ fontSize: '1rem', lineHeight: 1.6 }}>
                <strong>📍 Total Distance:</strong> {summaryStats.distanceKm.toFixed(2)} km
              </div>
              <div style={{ fontSize: '1rem', lineHeight: 1.6 }}>
                <strong>💰 Total Balance to Pay:</strong>{' '}
                <span style={{ color: '#111827', fontWeight: 700 }}>
                  {summaryStats.costBirr} ETB
                </span>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                type="button"
                onClick={handleCancelSummary}
                style={{
                  padding: '12px 18px',
                  background: '#f3f4f6',
                  border: '1px solid #d1d5db',
                  borderRadius: '12px',
                  color: '#111827',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmPayment}
                disabled={submitting}
                style={{
                  padding: '12px 18px',
                  background: submitting ? '#93c5fd' : '#3b82f6',
                  border: 'none',
                  borderRadius: '12px',
                  color: '#ffffff',
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  fontWeight: 700,
                }}
              >
                {submitting ? 'Processing…' : 'Confirm Payment'}
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="dispatch-page">
        {/* ── Left sidebar ── */}
        <aside className="dispatch-sidebar">
          <div className="sidebar-header">
            <h1 className="sidebar-title">New Delivery</h1>
            <p className="sidebar-subtitle">Create a dispatch request</p>
          </div>

          <form onSubmit={handleSubmit} className="dispatch-form">
            {/* ── Addresses ── */}
            <div className="form-section">
              <div className="section-label">
                <span className="section-dot section-dot--blue" />
                Route
              </div>

              <AddressInput
                id="pickup-address"
                label="Pickup Location"
                placeholder="Search pickup address…"
                value={pickupAddress}
                onSelect={handlePickupSelect}
                onChange={setPickupAddress}
              />

              <div className="route-connector">
                <div className="connector-line" />
                <div className="connector-dot" />
                <div className="connector-line" />
              </div>

              <AddressInput
                id="dropoff-address"
                label="Drop-off Location"
                placeholder="Search drop-off address…"
                value={dropoffAddress}
                onSelect={handleDropoffSelect}
                onChange={setDropoffAddress}
              />
            </div>

            {/* ── Route metrics ── */}
            {routeMetrics && routeMetrics.distanceKm > 0 && (
              <div className="metrics-card">
                <div className="metric">
                  <span className="metric-label">Distance</span>
                  <span className="metric-value">{routeMetrics.distanceKm.toFixed(2)} km</span>
                </div>
                <div className="metric-divider" />
                <div className="metric">
                  <span className="metric-label">ETA</span>
                  <span className="metric-value">{routeMetrics.durationMins.toFixed(1)} min</span>
                </div>
              </div>
            )}

            {/* ── Schedule ── */}
            <div className="form-section">
              <div className="section-label">
                <span className="section-dot section-dot--green" />
                Schedule
              </div>

              <div className="field-group">
                <label htmlFor="pickup-time" className="field-label">
                  Requested Pickup Time
                </label>
                <input
                  id="pickup-time"
                  type="datetime-local"
                  value={requestedPickupTime}
                  onChange={(e) => setRequestedPickupTime(e.target.value)}
                  className="text-input"
                />
              </div>

              <div className="field-group">
                <label htmlFor="deadline" className="field-label">
                  Deadline
                </label>
                <input
                  id="deadline"
                  type="datetime-local"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="text-input"
                />
              </div>
            </div>

            {/* ── Priority ── */}
            <div className="form-section">
              <div className="section-label">
                <span className="section-dot section-dot--amber" />
                Options
              </div>

              <div className="field-group">
                <label htmlFor="priority" className="field-label">
                  Priority
                </label>
                <select
                  id="priority"
                  value={urgency}
                  onChange={(e) => setUrgency(e.target.value as DeliveryUrgency)}
                  className="text-input select-input"
                >
                  <option value="LOW">Low</option>
                  <option value="NORMAL">Normal</option>
                  <option value="URGENT">Urgent</option>
                  <option value="CRITICAL">Critical</option>
                </select>
              </div>

              <div className="field-group">
                <label htmlFor="notes" className="field-label">
                  Notes
                </label>
                <textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Gate codes, handling notes, etc."
                  className="text-input textarea-input"
                  rows={3}
                />
              </div>
            </div>

            {/* ── Submit ── */}
            <button
              type="submit"
              disabled={!canSubmit || submitting}
              className="submit-btn"
            >
              {submitting ? (
                <span className="submit-loading">
                  <div className="btn-spinner" />
                  Ordering…
                </span>
              ) : (
                'Order Delivery'
              )}
            </button>

            {submitStatus === 'success' && (
              <div className="status-banner status-success">
                <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                Delivery Orderd successfully
              </div>
            )}

            {submitStatus === 'error' && (
              <div className="status-banner status-error">
                <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                {errorMessage}
              </div>
            )}
          </form>
        </aside>

        {/* ── Right map panel ── */}
        <main className="dispatch-map-panel">
          <MapComponent
            pickupLat={pickupLat}
            pickupLng={pickupLng}
            pickupAddress={pickupAddress}
            dropoffLat={dropoffLat}
            dropoffLng={dropoffLng}
            dropoffAddress={dropoffAddress}
            routeMetrics={routeMetrics}
          />
        </main>
      </div>

      <style>{`
        /* ── Page layout ── */
        .dispatch-page {
          display: flex;
          height: 100vh;
          overflow: hidden;
          background: #050505;
        }

        /* ── Sidebar ── */
        .dispatch-sidebar {
          width: 420px;
          min-width: 420px;
          height: 100vh;
          overflow-y: auto;
          background: #0a0a0a;
          border-right: 1px solid rgba(255, 255, 255, 0.06);
          display: flex;
          flex-direction: column;
          scrollbar-width: thin;
          scrollbar-color: #222 transparent;
        }
        .dispatch-sidebar::-webkit-scrollbar {
          width: 5px;
        }
        .dispatch-sidebar::-webkit-scrollbar-track {
          background: transparent;
        }
        .dispatch-sidebar::-webkit-scrollbar-thumb {
          background: #222;
          border-radius: 10px;
        }

        .sidebar-header {
          padding: 28px 24px 20px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.04);
        }
        .sidebar-title {
          font-size: 22px;
          font-weight: 700;
          color: #f5f5f5;
          letter-spacing: -0.02em;
          margin: 0;
        }
        .sidebar-subtitle {
          font-size: 13px;
          color: #555;
          margin: 4px 0 0;
        }

        /* ── Form ── */
        .dispatch-form {
          padding: 20px 24px 32px;
          display: flex;
          flex-direction: column;
          gap: 20px;
          flex: 1;
        }

        .form-section {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .section-label {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: #666;
        }
        .section-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
        }
        .section-dot--blue { background: #3b82f6; }
        .section-dot--green { background: #10b981; }
        .section-dot--amber { background: #f59e0b; }

        .field-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .field-label {
          font-size: 11px;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: #555;
        }

        /* ── Inputs ── */
        .text-input {
          width: 100%;
          padding: 10px 12px;
          font-size: 13px;
          color: #f0f0f0;
          background: #111;
          border: 1px solid #1a1a1a;
          border-radius: 10px;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
          font-family: inherit;
        }
        .text-input::placeholder {
          color: #444;
        }
        .text-input:focus {
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.12);
        }
        .text-input.with-icon {
          padding-left: 36px;
        }
        .select-input {
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23666' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 12px center;
          padding-right: 32px;
          cursor: pointer;
        }
        .select-input option {
          background: #111;
          color: #f0f0f0;
        }
        .textarea-input {
          resize: vertical;
          min-height: 60px;
        }

        /* ── Address input ── */
        .address-input-wrapper {
          position: relative;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .input-container {
          position: relative;
        }
        .input-icon {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: #444;
          pointer-events: none;
          z-index: 1;
        }
        .input-spinner {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          width: 14px;
          height: 14px;
          border: 2px solid #222;
          border-top-color: #3b82f6;
          border-radius: 50%;
          animation: spin 0.6s linear infinite;
        }

        /* ── Route connector ── */
        .route-connector {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0;
          padding: 2px 0;
          margin-left: 18px;
        }
        .connector-line {
          width: 1px;
          height: 8px;
          background: #222;
        }
        .connector-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: #333;
        }

        /* ── Suggestion dropdown ── */
        .suggestion-dropdown {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          z-index: 9999;
          margin-top: 6px;
          padding: 4px;
          background: #0d0d0d;
          border: 1px solid #1a1a1a;
          border-radius: 12px;
          list-style: none;
          max-height: 260px;
          overflow-y: auto;
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.7);
        }
        .suggestion-item {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          width: 100%;
          padding: 10px 12px;
          text-align: left;
          color: #ccc;
          background: none;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-size: 12px;
          font-family: inherit;
          line-height: 1.4;
          transition: background 0.15s;
        }
        .suggestion-item:hover {
          background: rgba(59, 130, 246, 0.08);
        }
        .suggestion-icon {
          color: #3b82f6;
          margin-top: 2px;
          flex-shrink: 0;
        }
        .suggestion-text {
          overflow: hidden;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
        }

        /* ── Metrics card ── */
        .metrics-card {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 20px;
          padding: 14px 20px;
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.06), rgba(239, 68, 68, 0.06));
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 12px;
        }
        .metric {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2px;
        }
        .metric-label {
          font-size: 10px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: #555;
        }
        .metric-value {
          font-size: 18px;
          font-weight: 700;
          color: #f5f5f5;
          letter-spacing: -0.02em;
        }
        .metric-divider {
          width: 1px;
          height: 32px;
          background: rgba(255, 255, 255, 0.06);
        }

        /* ── Submit button ── */
        .submit-btn {
          width: 100%;
          padding: 14px 20px;
          font-size: 14px;
          font-weight: 600;
          color: #fff;
          background: linear-gradient(135deg, #3b82f6, #2563eb);
          border: none;
          border-radius: 12px;
          cursor: pointer;
          transition: opacity 0.2s, transform 0.1s;
          font-family: inherit;
          letter-spacing: 0.01em;
          margin-top: 8px;
        }
        .submit-btn:hover:not(:disabled) {
          opacity: 0.92;
        }
        .submit-btn:active:not(:disabled) {
          transform: scale(0.985);
        }
        .submit-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }
        .submit-loading {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
        .btn-spinner {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255, 255, 255, 0.25);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.6s linear infinite;
        }

        /* ── Status banners ── */
        .status-banner {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 16px;
          font-size: 13px;
          border-radius: 10px;
          font-weight: 500;
        }
        .status-success {
          background: rgba(16, 185, 129, 0.08);
          color: #10b981;
          border: 1px solid rgba(16, 185, 129, 0.15);
        }
        .status-error {
          background: rgba(239, 68, 68, 0.08);
          color: #ef4444;
          border: 1px solid rgba(239, 68, 68, 0.15);
        }

        /* ── Map panel ── */
        .dispatch-map-panel {
          flex: 1;
          height: 100vh;
          position: relative;
          overflow: hidden;
        }

        /* ── Map loading skeleton ── */
        .map-loading-skeleton {
          height: 100%;
          width: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: #0a0a0a;
          gap: 16px;
        }
        .map-loading-pulse {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: rgba(59, 130, 246, 0.15);
          animation: pulse-scale 1.5s ease-in-out infinite;
        }
        .map-loading-text {
          font-size: 13px;
          color: #444;
          letter-spacing: 0.02em;
        }

        /* ── Animations ── */
        @keyframes spin {
          to { transform: translateY(-50%) rotate(360deg); }
        }
        @keyframes pulse-scale {
          0%, 100% { transform: scale(1); opacity: 0.4; }
          50% { transform: scale(1.4); opacity: 0.15; }
        }

        /* ── Responsive ── */
        @media (max-width: 768px) {
          .dispatch-page {
            flex-direction: column;
          }
          .dispatch-sidebar {
            width: 100%;
            min-width: unset;
            height: auto;
            max-height: 50vh;
            border-right: none;
            border-bottom: 1px solid rgba(255, 255, 255, 0.06);
          }
          .dispatch-map-panel {
            height: 50vh;
          }
        }
      `}</style>
    </>
  );
}
