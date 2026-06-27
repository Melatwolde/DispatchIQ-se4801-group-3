'use client';

import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

const MAP_STYLE = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';
const DEFAULT_CENTER: [number, number] = [38.7525, 9.0192];
const DEFAULT_ZOOM = 13;
const OSRM_URL = process.env.NEXT_PUBLIC_OSRM_URL || 'http://localhost:5000';
const PHOTON_URL = process.env.NEXT_PUBLIC_PHOTON_URL || 'http://localhost:2322/api';
const ROUTE_SOURCE_ID = 'delivery-route-source';
const ROUTE_LAYER_ID = 'delivery-route-layer';
const ROUTE_GLOW_LAYER_ID = 'delivery-route-glow-layer';
const FIT_PADDING = 60;

export interface DeliveryStop {
  id: string;
  type: 'origin' | 'destination';
  address: string;
  lat: number;
  lng: number;
}

export interface RouteCalculatedMetrics {
  distance: number;
  duration: number;
  geometry?: GeoJSON.Geometry;
}

export interface DeliveryMapProps {
  pickup: DeliveryStop;
  dropoff: DeliveryStop;
  focusedField: 'pickup' | 'dropoff' | null;
  onLocationUpdate: (
    field: 'pickup' | 'dropoff',
    updates: Partial<Pick<DeliveryStop, 'lat' | 'lng' | 'address'>>
  ) => void;
  onRouteCalculated?: (metrics: RouteCalculatedMetrics) => void;
}

export interface DeliveryMapRef {
  updateRoute: (geometry: GeoJSON.Geometry) => void;
}

function isValidCoord(lat: number, lng: number): boolean {
  return lat !== 0 && lng !== 0 && Number.isFinite(lat) && Number.isFinite(lng);
}

function formatPhotonAddress(properties: Record<string, unknown>): string {
  return [properties.name, properties.street, properties.city, properties.country]
    .filter((part) => typeof part === 'string' && part.length > 0)
    .join(', ');
}

async function reverseGeocode(lat: number, lng: number): Promise<string> {
  const fallback = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  try {
    const response = await fetch(`${PHOTON_URL}?lon=${lng}&lat=${lat}&limit=1`);
    if (!response.ok) return fallback;
    const data = await response.json();
    const feature = data.features?.[0];
    if (!feature?.properties) return fallback;
    const formatted = formatPhotonAddress(feature.properties);
    return formatted || fallback;
  } catch {
    return fallback;
  }
}

function boundsFromGeometry(geometry: GeoJSON.Geometry): maplibregl.LngLatBoundsLike | null {
  const points: [number, number][] = [];

  if (geometry.type === 'LineString') {
    points.push(...(geometry.coordinates as [number, number][]));
  } else if (geometry.type === 'MultiLineString') {
    for (const line of geometry.coordinates) {
      points.push(...(line as [number, number][]));
    }
  } else {
    return null;
  }

  if (points.length === 0) return null;

  let minLng = Infinity;
  let minLat = Infinity;
  let maxLng = -Infinity;
  let maxLat = -Infinity;

  for (const [lng, lat] of points) {
    minLng = Math.min(minLng, lng);
    minLat = Math.min(minLat, lat);
    maxLng = Math.max(maxLng, lng);
    maxLat = Math.max(maxLat, lat);
  }

  return [
    [minLng, minLat],
    [maxLng, maxLat],
  ];
}

function createPickupMarkerElement(): HTMLDivElement {
  const el = document.createElement('div');
  el.innerHTML = `
    <div style="position:relative;width:28px;height:28px;">
      <div style="
        position:absolute;inset:0;border-radius:50%;
        background:#3b82f6;opacity:0.35;
        animation:delivery-map-pulse 2s ease-in-out infinite;
      "></div>
      <div style="
        position:absolute;inset:5px;border-radius:50%;
        background:#3b82f6;border:2px solid #93c5fd;
        box-shadow:0 0 12px rgba(59,130,246,0.85);
      "></div>
    </div>`;
  return el;
}

function createDropoffMarkerElement(): HTMLDivElement {
  const el = document.createElement('div');
  el.innerHTML = `
    <div style="
      width:24px;height:24px;border-radius:50%;
      background:#ef4444;border:2px solid #fca5a5;
      box-shadow:0 0 14px rgba(239,68,68,0.9),0 0 28px rgba(239,68,68,0.45);
    "></div>`;
  return el;
}

function ensurePulseKeyframes(): void {
  if (document.getElementById('delivery-map-pulse-style')) return;
  const style = document.createElement('style');
  style.id = 'delivery-map-pulse-style';
  style.textContent =
    '@keyframes delivery-map-pulse{0%,100%{transform:scale(1);opacity:.35}50%{transform:scale(1.55);opacity:.08}}';
  document.head.appendChild(style);
}

const DeliveryMap = forwardRef<DeliveryMapRef, DeliveryMapProps>(
  ({ pickup, dropoff, focusedField, onLocationUpdate, onRouteCalculated }, ref) => {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<maplibregl.Map | null>(null);
    const markersRef = useRef<Map<'pickup' | 'dropoff', maplibregl.Marker>>(new Map());
    const focusedFieldRef = useRef(focusedField);
    const onLocationUpdateRef = useRef(onLocationUpdate);
    const onRouteCalculatedRef = useRef(onRouteCalculated);
    const routeRequestIdRef = useRef(0);
    const [mapReady, setMapReady] = useState(false);

    focusedFieldRef.current = focusedField;
    onLocationUpdateRef.current = onLocationUpdate;
    onRouteCalculatedRef.current = onRouteCalculated;

    const pickupValid = isValidCoord(pickup.lat, pickup.lng);
    const dropoffValid = isValidCoord(dropoff.lat, dropoff.lng);

    const hasBothCoords = useMemo(
      () => pickupValid && dropoffValid,
      [pickupValid, dropoffValid]
    );

    const hasAnyCoord = pickupValid || dropoffValid;

    const clearRoute = useCallback((mapInstance: maplibregl.Map) => {
      if (mapInstance.getLayer(ROUTE_GLOW_LAYER_ID)) {
        mapInstance.removeLayer(ROUTE_GLOW_LAYER_ID);
      }
      if (mapInstance.getLayer(ROUTE_LAYER_ID)) {
        mapInstance.removeLayer(ROUTE_LAYER_ID);
      }
      if (mapInstance.getSource(ROUTE_SOURCE_ID)) {
        mapInstance.removeSource(ROUTE_SOURCE_ID);
      }
    }, []);

    const renderRoute = useCallback(
      (mapInstance: maplibregl.Map, geometry: GeoJSON.Geometry) => {
        if (!mapInstance.isStyleLoaded()) return;

        const feature: GeoJSON.Feature = { type: 'Feature', geometry, properties: {} };
        clearRoute(mapInstance);

        mapInstance.addSource(ROUTE_SOURCE_ID, { type: 'geojson', data: feature });

        mapInstance.addLayer({
          id: ROUTE_GLOW_LAYER_ID,
          type: 'line',
          source: ROUTE_SOURCE_ID,
          layout: { 'line-join': 'round', 'line-cap': 'round' },
          paint: {
            'line-color': '#ef4444',
            'line-width': 9,
            'line-opacity': 0.25,
            'line-blur': 2,
          },
        });

        mapInstance.addLayer({
          id: ROUTE_LAYER_ID,
          type: 'line',
          source: ROUTE_SOURCE_ID,
          layout: { 'line-join': 'round', 'line-cap': 'round' },
          paint: {
            'line-color': '#ef4444',
            'line-width': 5,
            'line-opacity': 0.9,
          },
        });

        const bounds = boundsFromGeometry(geometry);
        if (bounds) {
          mapInstance.fitBounds(bounds, {
            padding: FIT_PADDING,
            maxZoom: 15,
            duration: 700,
          });
        }
      },
      [clearRoute]
    );

    useImperativeHandle(ref, () => ({
      updateRoute: (geometry: GeoJSON.Geometry) => {
        const mapInstance = mapRef.current;
        if (!mapInstance) return;
        renderRoute(mapInstance, geometry);
      },
    }));

    const clearAllMarkers = useCallback(() => {
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current.clear();
    }, []);

    const resetMapView = useCallback((mapInstance: maplibregl.Map) => {
      mapInstance.easeTo({
        center: DEFAULT_CENTER,
        zoom: DEFAULT_ZOOM,
        duration: 600,
      });
    }, []);

    // Initialize MapLibre once (client-only component)
    useEffect(() => {
      if (!mapContainerRef.current || mapRef.current) return;

      ensurePulseKeyframes();

      const mapInstance = new maplibregl.Map({
        container: mapContainerRef.current,
        style: MAP_STYLE,
        center: DEFAULT_CENTER,
        zoom: DEFAULT_ZOOM,
        attributionControl: false,
      });

      mapInstance.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
      mapRef.current = mapInstance;

      mapInstance.on('load', () => {
        setMapReady(true);
        mapInstance.resize();
      });

      mapInstance.on('click', async (event) => {
        const field = focusedFieldRef.current;
        if (!field) return;

        const { lng, lat } = event.lngLat;
        const address = await reverseGeocode(lat, lng);
        onLocationUpdateRef.current(field, { lat, lng, address });
      });

      const resizeObserver = new ResizeObserver(() => mapInstance.resize());
      resizeObserver.observe(mapContainerRef.current);

      return () => {
        resizeObserver.disconnect();
        clearAllMarkers();
        mapInstance.remove();
        mapRef.current = null;
        setMapReady(false);
      };
    }, [clearAllMarkers]);

    // Sync markers and viewport when stops change
    useEffect(() => {
      const mapInstance = mapRef.current;
      if (!mapInstance || !mapReady) return;

      clearAllMarkers();

      const entries: Array<{
        field: 'pickup' | 'dropoff';
        stop: DeliveryStop;
        createElement: () => HTMLDivElement;
      }> = [
        { field: 'pickup', stop: pickup, createElement: createPickupMarkerElement },
        { field: 'dropoff', stop: dropoff, createElement: createDropoffMarkerElement },
      ];

      for (const { field, stop, createElement } of entries) {
        if (!isValidCoord(stop.lat, stop.lng)) continue;

        const marker = new maplibregl.Marker({
          element: createElement(),
          anchor: 'center',
          draggable: true,
        })
          .setLngLat([stop.lng, stop.lat])
          .addTo(mapInstance);

        marker.on('dragend', async () => {
          const { lat, lng } = marker.getLngLat();
          const address = await reverseGeocode(lat, lng);
          onLocationUpdateRef.current(field, { lat, lng, address });
        });

        markersRef.current.set(field, marker);
      }

      if (!hasAnyCoord) {
        clearRoute(mapInstance);
        resetMapView(mapInstance);
        return;
      }

      if (pickupValid && !dropoffValid) {
        clearRoute(mapInstance);
        mapInstance.easeTo({
          center: [pickup.lng, pickup.lat],
          zoom: DEFAULT_ZOOM,
          duration: 600,
        });
        return;
      }

      if (dropoffValid && !pickupValid) {
        clearRoute(mapInstance);
        mapInstance.easeTo({
          center: [dropoff.lng, dropoff.lat],
          zoom: DEFAULT_ZOOM,
          duration: 600,
        });
      }
    }, [
      pickup,
      dropoff,
      pickupValid,
      dropoffValid,
      hasAnyCoord,
      mapReady,
      clearAllMarkers,
      clearRoute,
      resetMapView,
    ]);

    // OSRM routing when both coordinates are valid
    useEffect(() => {
      const mapInstance = mapRef.current;
      if (!mapInstance || !mapReady) return;

      if (!hasBothCoords) {
        clearRoute(mapInstance);
        return;
      }

      const requestId = ++routeRequestIdRef.current;
      const controller = new AbortController();

      const osrmPath =
        `${OSRM_URL}/route/v1/driving/` +
        `${pickup.lng},${pickup.lat};${dropoff.lng},${dropoff.lat}` +
        `?overview=full&geometries=geojson&steps=true`;

      fetch(osrmPath, { signal: controller.signal })
        .then((response) => {
          if (!response.ok) throw new Error(`OSRM HTTP ${response.status}`);
          return response.json();
        })
        .then((data) => {
          if (requestId !== routeRequestIdRef.current) return;
          const route = data.routes?.[0];
          if (!route?.geometry) return;

          renderRoute(mapInstance, route.geometry as GeoJSON.Geometry);
          onRouteCalculatedRef.current?.({
            distance: route.distance,
            duration: route.duration,
            geometry: route.geometry,
          });
        })
        .catch((error: Error) => {
          if (error.name === 'AbortError') return;
          console.error('OSRM routing error:', error);
          clearRoute(mapInstance);
        });

      return () => {
        controller.abort();
      };
    }, [
      pickup.lat,
      pickup.lng,
      dropoff.lat,
      dropoff.lng,
      hasBothCoords,
      mapReady,
      clearRoute,
      renderRoute,
    ]);

    return <div ref={mapContainerRef} className="absolute inset-0 h-full w-full" />;
  }
);

DeliveryMap.displayName = 'DeliveryMap';

export default DeliveryMap;
