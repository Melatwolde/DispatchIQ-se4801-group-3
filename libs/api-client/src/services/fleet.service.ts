import api from '../lib/axios-instance';
import { handleApiError } from '../lib/error-handler';
import { Vehicle, UpdateVehicleInput, SpringPage, FleetDto } from '@dispatchiq/types';

export const fleetService = {
  async list(): Promise<SpringPage<FleetDto>> {
    try {
      const response = await api.get<SpringPage<FleetDto>>('/fleets');
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  async update(id: string, data: UpdateVehicleInput): Promise<FleetDto> {
    try {
      const response = await api.put<FleetDto>(`/fleets/${id}`, data);
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },
};
