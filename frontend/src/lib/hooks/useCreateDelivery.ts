import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deliveryService } from '@dispatchiq/api-client';
import { CreateDeliveryInput } from '@dispatchiq/types';

export function useCreateDelivery() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateDeliveryInput) => deliveryService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deliveries'] });
    },
  });
}
