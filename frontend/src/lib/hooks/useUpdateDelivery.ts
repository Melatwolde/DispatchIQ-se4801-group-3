import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deliveryService } from '@dispatchiq/api-client';
import { CreateDeliveryInput } from '@dispatchiq/types';

export function useUpdateDelivery() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateDeliveryInput> }) => 
      deliveryService.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['deliveries'] });
      queryClient.invalidateQueries({ queryKey: ['delivery', id] });
    },
  });
}
