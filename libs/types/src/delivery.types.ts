export type DeliveryStatus = 'PENDING' | 'ASSIGNED' | 'IN_TRANSIT' | 'COMPLETED' | 'CANCELLED';

export interface Delivery {
  publicId: string;
  status: DeliveryStatus;
  address: string;
}

export interface CreateDeliveryInput {
  address: string;
}

export interface DeliveryFilters {
  page?: number;
  size?: number;
  status?: DeliveryStatus;
}

export interface SpringPage<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}
