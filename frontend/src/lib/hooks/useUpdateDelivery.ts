import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deliveryService } from '../../../../libs/api-client/src';
import { CreateDeliveryInput } from '../../../../libs/types/src';

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
