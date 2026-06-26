export type DeliveryPriority = 'LOW' | 'NORMAL' | 'URGENT';
export type DeliveryUrgency = 'LOW' | 'NORMAL' | 'URGENT' | 'CRITICAL';

export type DeliveryStatus =
  | 'PENDING'
  | 'ASSIGNED'
  | 'PICKED_UP'
  | 'IN_TRANSIT'
  | 'DELIVERED'
  | 'CANCELLED';

export interface DeliveryRequest {
  status: DeliveryStatus;
  pickupAddress: string;
  pickupLatitude: number;
  pickupLongitude: number;
  dropoffAddress: string;
  dropoffLatitude: number;
  dropoffLongitude: number;
  urgency: DeliveryUrgency;
  notes: string;
}

export interface DeliveryResponse {
  id: string;
  status: DeliveryStatus;
  pickupAddress: string;
  pickupLatitude: number;
  pickupLongitude: number;
  dropoffAddress: string;
  dropoffLatitude: number;
  dropoffLongitude: number;
  requestedPickupTime: string;
  deadline: string;
  priority: DeliveryPriority;
  specialInstructions: string;
}

export interface PhotonFeature {
  type: 'Feature';
  geometry: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };
  properties: {
    osm_id?: number;
    osm_type?: string;
    name?: string;
    street?: string;
    housenumber?: string;
    postcode?: string;
    city?: string;
    state?: string;
    country?: string;
  };
}

export interface PhotonResponse {
  type: 'FeatureCollection';
  features: PhotonFeature[];
}

export interface OsrmRouteStep {
  distance: number;
  duration: number;
  geometry: GeoJSON.LineString;
  name: string;
  maneuver: {
    type: string;
    modifier?: string;
    location: [number, number];
  };
}

export interface OsrmRouteLeg {
  distance: number;
  duration: number;
  steps: OsrmRouteStep[];
  summary: string;
}

export interface OsrmRoute {
  distance: number;
  duration: number;
  geometry: GeoJSON.LineString;
  legs: OsrmRouteLeg[];
  weight: number;
  weight_name: string;
}

export interface OsrmResponse {
  code: string;
  routes: OsrmRoute[];
  waypoints: Array<{
    hint: string;
    distance: number;
    name: string;
    location: [number, number];
  }>;
}

export interface RouteMetrics {
  distanceKm: number;
  durationMins: number;
  geometry: GeoJSON.LineString | null;
}
