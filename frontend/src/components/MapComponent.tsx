'use client';

import React, { useEffect, useMemo } from 'react';
import L from 'leaflet';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import type { RouteMetrics } from '@/types/delivery';

/* ── Leaflet asset fix ── */
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

/* ── Custom marker icons ── */
const pickupIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
  className: 'pickup-marker-icon',
});

const dropoffIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
  className: 'dropoff-marker-icon',
});

/* ── Props ── */
export interface MapComponentProps {
  pickupLat: number;
  pickupLng: number;
  pickupAddress: string;
  dropoffLat: number;
  dropoffLng: number;
  dropoffAddress: string;
  routeMetrics: RouteMetrics | null;
}

const DEFAULT_CENTER: [number, number] = [9.0192, 38.7525];
const DEFAULT_ZOOM = 13;

/* ── Auto-fit helper ── */
function FitBounds({
  pickupLat,
  pickupLng,
  dropoffLat,
  dropoffLng,
  routeGeometry,
}: {
  pickupLat: number;
  pickupLng: number;
  dropoffLat: number;
  dropoffLng: number;
  routeGeometry: GeoJSON.LineString | null;
}) {
  const map = useMap();

  useEffect(() => {
    if (routeGeometry && routeGeometry.coordinates.length > 0) {
      const latLngs = routeGeometry.coordinates.map(
        (coord) => L.latLng(coord[1], coord[0])
      );
      const bounds = L.latLngBounds(latLngs);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
    } else if (pickupLat !== 0 && dropoffLat !== 0) {
      const bounds = L.latLngBounds(
        L.latLng(pickupLat, pickupLng),
        L.latLng(dropoffLat, dropoffLng)
      );
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
    } else if (pickupLat !== 0) {
      map.setView([pickupLat, pickupLng], 15);
    } else if (dropoffLat !== 0) {
      map.setView([dropoffLat, dropoffLng], 15);
    }
  }, [map, pickupLat, pickupLng, dropoffLat, dropoffLng, routeGeometry]);

  return null;
}

/* ── Main component ── */
export default function MapComponent({
  pickupLat,
  pickupLng,
  pickupAddress,
  dropoffLat,
  dropoffLng,
  dropoffAddress,
  routeMetrics,
}: MapComponentProps) {
  const hasPickup = pickupLat !== 0 && pickupLng !== 0;
  const hasDropoff = dropoffLat !== 0 && dropoffLng !== 0;

  const routePositions: [number, number][] = useMemo(() => {
    if (!routeMetrics?.geometry?.coordinates) return [];
    return routeMetrics.geometry.coordinates.map(
      (coord) => [coord[1], coord[0]] as [number, number]
    );
  }, [routeMetrics]);

  const center: [number, number] = hasPickup
    ? [pickupLat, pickupLng]
    : hasDropoff
      ? [dropoffLat, dropoffLng]
      : DEFAULT_CENTER;

  return (
    <div className="map-component-root">
      <MapContainer
        center={center}
        zoom={DEFAULT_ZOOM}
        scrollWheelZoom={true}
        style={{ height: '100%', width: '100%' }}
        className="map-container-instance"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> contributors &copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />

        <FitBounds
          pickupLat={pickupLat}
          pickupLng={pickupLng}
          dropoffLat={dropoffLat}
          dropoffLng={dropoffLng}
          routeGeometry={routeMetrics?.geometry ?? null}
        />

        {hasPickup && (
          <Marker position={[pickupLat, pickupLng]} icon={pickupIcon}>
            <Popup>
              <div style={{ minWidth: 160 }}>
                <strong style={{ color: '#3b82f6' }}>⬤ Pickup</strong>
                <br />
                <span style={{ fontSize: 12, color: '#666' }}>{pickupAddress || 'Selected location'}</span>
              </div>
            </Popup>
          </Marker>
        )}

        {hasDropoff && (
          <Marker position={[dropoffLat, dropoffLng]} icon={dropoffIcon}>
            <Popup>
              <div style={{ minWidth: 160 }}>
                <strong style={{ color: '#ef4444' }}>⬤ Drop-off</strong>
                <br />
                <span style={{ fontSize: 12, color: '#666' }}>{dropoffAddress || 'Selected location'}</span>
              </div>
            </Popup>
          </Marker>
        )}

        {routePositions.length > 0 && (
          <Polyline
            positions={routePositions}
            pathOptions={{ color: 'red', weight: 5, opacity: 0.85 }}
          />
        )}
      </MapContainer>

      {routeMetrics && routeMetrics.distanceKm > 0 && (
        <div className="route-info-badge">
          <div className="route-info-row">
            <span className="route-info-icon">📏</span>
            <span className="route-info-value">{routeMetrics.distanceKm.toFixed(2)} km</span>
          </div>
          <div className="route-info-divider" />
          <div className="route-info-row">
            <span className="route-info-icon">⏱</span>
            <span className="route-info-value">{routeMetrics.durationMins.toFixed(1)} min</span>
          </div>
        </div>
      )}

      <style>{`
        .map-component-root {
          position: relative;
          height: 100%;
          width: 100%;
        }
        .map-container-instance {
          border-radius: 12px;
          z-index: 1;
        }
        .map-container-instance .leaflet-control-zoom a {
          background: rgba(17, 17, 17, 0.9) !important;
          color: #e5e5e5 !important;
          border-color: #333 !important;
        }
        .map-container-instance .leaflet-control-attribution {
          background: rgba(0, 0, 0, 0.6) !important;
          color: #888 !important;
          font-size: 10px !important;
        }
        .map-container-instance .leaflet-control-attribution a {
          color: #aaa !important;
        }
        .pickup-marker-icon {
          filter: hue-rotate(200deg) saturate(1.5);
        }
        .dropoff-marker-icon {
          filter: hue-rotate(320deg) saturate(2) brightness(1.1);
        }
        .route-info-badge {
          position: absolute;
          bottom: 20px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 1000;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 20px;
          background: rgba(10, 10, 10, 0.92);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 12px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
        }
        .route-info-row {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .route-info-icon {
          font-size: 14px;
        }
        .route-info-value {
          font-size: 13px;
          font-weight: 600;
          color: #f5f5f5;
          letter-spacing: 0.02em;
        }
        .route-info-divider {
          width: 1px;
          height: 20px;
          background: rgba(255, 255, 255, 0.12);
        }
      `}</style>
    </div>
  );
}
