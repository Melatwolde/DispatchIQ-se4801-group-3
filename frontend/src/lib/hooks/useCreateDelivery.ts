import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deliveryService } from '../../../../libs/api-client/src';
import { CreateDeliveryInput } from '../../../../libs/types/src';

export function useCreateDelivery() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateDeliveryInput) => deliveryService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deliveries'] });
    },
  });
}
