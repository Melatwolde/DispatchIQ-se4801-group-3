import { useQuery } from '@tanstack/react-query';
import { deliveryService } from '@dispatchiq/api-client';

export function useDelivery(id: string) {
  return useQuery({
    queryKey: ['delivery', id],
    queryFn: () => deliveryService.getById(id),
    enabled: !!id,
  });
}
