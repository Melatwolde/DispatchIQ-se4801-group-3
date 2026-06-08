import api from '../lib/axios-instance';
import { handleApiError } from '../lib/error-handler';
import { Delivery, CreateDeliveryInput, DeliveryFilters, SpringPage } from '@dispatchiq/types';

export const deliveryService = {
  async list(filters?: DeliveryFilters): Promise<SpringPage<Delivery>> {
    try {
      const response = await api.get<SpringPage<Delivery>>('/deliveries', {
        params: filters,
      });
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  async getById(id: string): Promise<Delivery> {
    try {
      const response = await api.get<Delivery>(`/deliveries/${id}`);
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  async create(data: CreateDeliveryInput): Promise<Delivery> {
    try {
      const response = await api.post<Delivery>('/deliveries', data);
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  async update(id: string, data: Partial<CreateDeliveryInput>): Promise<Delivery> {
    try {
      if (process.env.NODE_ENV === 'development') {
        return { publicId: id, status: 'PENDING', address: data.address || 'Updated St' };
      }
      const response = await api.put<Delivery>(`/deliveries/${id}`, data);
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },
};
