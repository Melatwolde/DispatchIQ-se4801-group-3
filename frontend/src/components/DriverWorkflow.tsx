'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import toast, { Toaster } from 'react-hot-toast';
import { Check, ChevronRight, Clock, MapPin, Navigation, X } from 'lucide-react';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080';
const OSRM_URL = process.env.NEXT_PUBLIC_OSRM_URL || 'http://localhost:5000';
const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8080/ws/telemetry';
const TELEMETRY_INTERVAL_MS = 15_000;
const OFFLINE_QUEUE_KEY = 'dispatchiq:driver:accept-queue';

export interface DriverAssignment {
  id: string;
  driverId: string;
  pickupAddress: string;
  dropoffAddress: string;
  pickupLat: number;
  pickupLng: number;
  dropoffLat: number;
  dropoffLng: number;
}

interface TelemetryUpdate {
  type: string;
  driverId: string;
  lat: number;
  lng: number;
  remainingDistanceMeters: number;
  remainingDurationSeconds: number;
  eta?: string;
  assignmentId?: string;
}

interface QueuedAccept {
  assignmentId: string;
  queuedAt: string;
}

function formatDistance(meters: number): string {
  return meters >= 1000 ? `${(meters / 1000).toFixed(1)} km` : `${Math.round(meters)} m`;
}

function formatDuration(seconds: number): string {
  const mins = Math.round(seconds / 60);
  return mins < 60 ? `${mins} min` : `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

function readQueue(): QueuedAccept[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(OFFLINE_QUEUE_KEY) || '[]');
  } catch {
    return [];
  }
}

function writeQueue(queue: QueuedAccept[]) {
  localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
}

function enqueueAccept(assignmentId: string) {
  const queue = readQueue();
  if (!queue.some((q) => q.assignmentId === assignmentId)) {
    queue.push({ assignmentId, queuedAt: new Date().toISOString() });
    writeQueue(queue);
  }
}

function dequeueAccept(assignmentId: string) {
  writeQueue(readQueue().filter((q) => q.assignmentId !== assignmentId));
}

async function postAccept(assignmentId: string): Promise<void> {
  const res = await fetch(`${BACKEND_URL}/api/v1/assignments/${assignmentId}/accept`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || `Accept failed (${res.status})`);
  }
}

interface DriverWorkflowProps {
  assignment: DriverAssignment;
  onAccepted?: () => void;
  onRejected?: () => void;
}

export default function DriverWorkflow({ assignment, onAccepted, onRejected }: DriverWorkflowProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const driverMarkerRef = useRef<maplibregl.Marker | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const lastTelemetryRef = useRef(0);
  const routeSourceId = 'driver-route';

  const [panelOpen, setPanelOpen] = useState(true);
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [tripDistance, setTripDistance] = useState<number | null>(null);
  const [etaSeconds, setEtaSeconds] = useState<number | null>(null);
  const [driverPos, setDriverPos] = useState<{ lat: number; lng: number } | null>(null);

  const flushOfflineQueue = useCallback(async () => {
    if (!navigator.onLine) return;
    for (const item of readQueue()) {
      try {
        await postAccept(item.assignmentId);
        dequeueAccept(item.assignmentId);
        toast.success('Queued assignment accepted');
        if (item.assignmentId === assignment.id) {
          setAccepted(true);
          onAccepted?.();
        }
      } catch {
        break;
      }
    }
  }, [assignment.id, onAccepted]);

  const sendTelemetry = useCallback(
    (lat: number, lng: number) => {
      const now = Date.now();
      if (now - lastTelemetryRef.current < TELEMETRY_INTERVAL_MS) return;
      lastTelemetryRef.current = now;

      const payload = JSON.stringify({
        driverId: assignment.driverId,
        lat,
        lng,
        assignmentId: assignment.id,
      });

      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(payload);
      }
    },
    [assignment.driverId, assignment.id]
  );

  const updateDriverMarker = useCallback((lat: number, lng: number) => {
    if (!mapRef.current) return;

    if (!driverMarkerRef.current) {
      const el = document.createElement('div');
      el.className = 'driver-vehicle-marker';
      el.innerHTML = `
        <div style="
          width:18px;height:18px;border-radius:50%;
          background:#fff;border:3px solid #22d3ee;
          box-shadow:0 0 12px #22d3ee,0 0 24px rgba(34,211,238,0.4);
        "></div>`;
      driverMarkerRef.current = new maplibregl.Marker({ element: el, anchor: 'center' })
        .setLngLat([lng, lat])
        .addTo(mapRef.current);
    } else {
      driverMarkerRef.current.setLngLat([lng, lat]);
    }
  }, []);

  const drawRoute = useCallback((geometry: GeoJSON.Geometry) => {
    const map = mapRef.current;
    if (!map) return;

    const add = () => {
      if (map.getSource(routeSourceId)) {
        (map.getSource(routeSourceId) as maplibregl.GeoJSONSource).setData({
          type: 'Feature',
          geometry,
          properties: {},
        });
        return;
      }

      map.addSource(routeSourceId, {
        type: 'geojson',
        data: { type: 'Feature', geometry, properties: {} },
      });

      map.addLayer({
        id: routeSourceId,
        type: 'line',
        source: routeSourceId,
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': '#ef4444',
          'line-width': 6,
          'line-opacity': 0.9,
          'line-blur': 1.5,
        },
      });
    };

    if (map.isStyleLoaded()) add();
    else map.once('load', add);
  }, []);

  const addPin = useCallback((lng: number, lat: number, type: 'pickup' | 'dropoff') => {
    const map = mapRef.current;
    if (!map) return;

    const el = document.createElement('div');
    if (type === 'pickup') {
      el.innerHTML = `
        <div style="position:relative;width:28px;height:28px;">
          <div style="position:absolute;inset:0;border-radius:50%;background:#3b82f6;opacity:0.35;animation:pulse 2s infinite;"></div>
          <div style="position:absolute;inset:4px;border-radius:50%;background:#3b82f6;border:2px solid #93c5fd;box-shadow:0 0 10px #3b82f6;"></div>
        </div>`;
    } else {
      el.innerHTML = `
        <div style="
          width:24px;height:24px;border-radius:50%;
          background:#ef4444;border:2px solid #fca5a5;
          box-shadow:0 0 14px #ef4444,0 0 28px rgba(239,68,68,0.5);
        "></div>`;
    }

    new maplibregl.Marker({ element: el, anchor: 'center' })
      .setLngLat([lng, lat])
      .addTo(map);
  }, []);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
      center: [assignment.pickupLng, assignment.pickupLat],
      zoom: 13,
      pitch: 0,
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
    mapRef.current = map;

    map.on('load', () => {
      addPin(assignment.pickupLng, assignment.pickupLat, 'pickup');
      addPin(assignment.dropoffLng, assignment.dropoffLat, 'dropoff');

      fetch(
        `${OSRM_URL}/route/v1/driving/${assignment.pickupLng},${assignment.pickupLat};${assignment.dropoffLng},${assignment.dropoffLat}?geometries=geojson&overview=full`
      )
        .then((r) => r.json())
        .then((data) => {
          if (data.routes?.[0]) {
            drawRoute(data.routes[0].geometry);
            setTripDistance(data.routes[0].distance);
            setEtaSeconds(data.routes[0].duration);
          }
        })
        .catch(() => toast.error('Route calculation failed'));

      map.fitBounds(
        [
          [Math.min(assignment.pickupLng, assignment.dropoffLng), Math.min(assignment.pickupLat, assignment.dropoffLat)],
          [Math.max(assignment.pickupLng, assignment.dropoffLng), Math.max(assignment.pickupLat, assignment.dropoffLat)],
        ],
        { padding: 80, maxZoom: 14 }
      );
    });

    return () => {
      driverMarkerRef.current?.remove();
      map.remove();
      mapRef.current = null;
    };
  }, [assignment, addPin, drawRoute]);

  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `@keyframes pulse { 0%,100%{transform:scale(1);opacity:0.35} 50%{transform:scale(1.6);opacity:0.1} }`;
    document.head.appendChild(style);
    return () => { document.head.removeChild(style); };
  }, []);

  useEffect(() => {
    window.addEventListener('online', flushOfflineQueue);
    flushOfflineQueue();
    return () => window.removeEventListener('online', flushOfflineQueue);
  }, [flushOfflineQueue]);

  useEffect(() => {
    if (!accepted) return;

    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onmessage = (evt) => {
      try {
        const data: TelemetryUpdate = JSON.parse(evt.data);
        if (data.remainingDurationSeconds != null) {
          setEtaSeconds(data.remainingDurationSeconds);
        }
        if (data.remainingDistanceMeters != null) {
          setTripDistance(data.remainingDistanceMeters);
        }
      } catch { /* ignore */ }
    };

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        setDriverPos({ lat, lng });
        updateDriverMarker(lat, lng);
        sendTelemetry(lat, lng);
      },
      () => toast.error('Geolocation unavailable'),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
    );

    return () => {
      ws.close();
      if (watchIdRef.current != null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [accepted, sendTelemetry, updateDriverMarker]);

  const handleAccept = async () => {
    setLoading(true);
    try {
      if (!navigator.onLine) {
        enqueueAccept(assignment.id);
        toast('Saved offline — will sync when connected', { icon: '📡' });
        return;
      }
      await postAccept(assignment.id);
      setAccepted(true);
      toast.success('Assignment accepted');
      onAccepted?.();
    } catch (err) {
      if (!navigator.onLine) {
        enqueueAccept(assignment.id);
        toast('Saved offline — will sync when connected', { icon: '📡' });
      } else {
        toast.error(err instanceof Error ? err.message : 'Accept failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/v1/assignments/${assignment.id}/reject`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Reject failed');
      toast.success('Assignment rejected');
      onRejected?.();
    } catch {
      toast.error('Reject failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative w-full h-screen overflow-hidden" style={{ background: '#050505', fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif" }}>
      <Toaster position="top-center" toastOptions={{ style: { background: '#111', color: '#fff', border: '1px solid #222' } }} />
      <div ref={mapContainerRef} className="absolute inset-0" />

      <button
        onClick={() => setPanelOpen((o) => !o)}
        className="absolute top-6 right-6 z-20 flex items-center gap-2 px-4 py-2 rounded-full text-xs tracking-widest uppercase"
        style={{ background: 'rgba(5,5,5,0.85)', color: '#aaa', border: '1px solid #222' }}
      >
        {panelOpen ? 'Hide' : 'Orders'}
        <ChevronRight size={14} className={panelOpen ? 'rotate-180' : ''} />
      </button>

      <aside
        className="absolute top-0 left-0 z-10 h-full transition-transform duration-300 ease-out"
        style={{
          width: 360,
          background: 'rgba(5,5,5,0.92)',
          borderRight: '1px solid #1a1a1a',
          transform: panelOpen ? 'translateX(0)' : 'translateX(-100%)',
          backdropFilter: 'blur(12px)',
        }}
      >
        <div className="p-8 flex flex-col h-full">
          <p className="text-[10px] tracking-[0.3em] uppercase mb-2" style={{ color: '#555' }}>Active Order</p>
          <h1 className="text-2xl font-light tracking-tight mb-8" style={{ color: '#f5f5f5' }}>
            {accepted ? 'En Route' : 'New Assignment'}
          </h1>

          <div className="space-y-6 flex-1">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <MapPin size={14} style={{ color: '#3b82f6' }} />
                <span className="text-[10px] tracking-widest uppercase" style={{ color: '#555' }}>Pickup</span>
              </div>
              <p className="text-sm leading-relaxed" style={{ color: '#ccc' }}>{assignment.pickupAddress}</p>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-1">
                <Navigation size={14} style={{ color: '#ef4444' }} />
                <span className="text-[10px] tracking-widest uppercase" style={{ color: '#555' }}>Dropoff</span>
              </div>
              <p className="text-sm leading-relaxed" style={{ color: '#ccc' }}>{assignment.dropoffAddress}</p>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4" style={{ borderTop: '1px solid #1a1a1a' }}>
              <div>
                <p className="text-[10px] tracking-widest uppercase mb-1" style={{ color: '#555' }}>Distance</p>
                <p className="text-lg font-light" style={{ color: '#f5f5f5' }}>
                  {tripDistance != null ? formatDistance(tripDistance) : '—'}
                </p>
              </div>
              <div>
                <div className="flex items-center gap-1 mb-1">
                  <Clock size={12} style={{ color: '#555' }} />
                  <p className="text-[10px] tracking-widest uppercase" style={{ color: '#555' }}>ETA</p>
                </div>
                <p className="text-lg font-light" style={{ color: '#ef4444' }}>
                  {etaSeconds != null ? formatDuration(etaSeconds) : '—'}
                </p>
              </div>
            </div>

            {driverPos && (
              <p className="text-[10px] tracking-wider" style={{ color: '#444' }}>
                GPS {driverPos.lat.toFixed(5)}, {driverPos.lng.toFixed(5)}
              </p>
            )}
          </div>

          {!accepted && (
            <div className="flex gap-3 pt-6">
              <button
                onClick={handleReject}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm tracking-wide transition-opacity"
                style={{ background: '#111', color: '#888', border: '1px solid #222' }}
              >
                <X size={16} /> Reject
              </button>
              <button
                onClick={handleAccept}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm tracking-wide font-medium transition-opacity"
                style={{ background: '#ef4444', color: '#fff', boxShadow: '0 0 20px rgba(239,68,68,0.35)' }}
              >
                <Check size={16} /> Accept
              </button>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
