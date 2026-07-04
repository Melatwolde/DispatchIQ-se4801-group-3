import api from '../lib/axios-instance';
import { handleApiError } from '../lib/error-handler';
import { AssignmentRequest, AssignmentResponse } from '../../../types/src';

export const assignmentService = {
  async assign(data: AssignmentRequest, idempotencyKey: string): Promise<AssignmentResponse> {
    try {
      const response = await api.post<AssignmentResponse>('/assignments', data, {
        headers: {
          'Idempotency-Key': idempotencyKey,
        },
      });
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  async reassign(publicId: string, data: AssignmentRequest, idempotencyKey: string): Promise<AssignmentResponse> {
    try {
      const response = await api.put<AssignmentResponse>(`/assignments/${publicId}/reassign`, data, {
        headers: {
          'Idempotency-Key': idempotencyKey,
        },
      });
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },
};
