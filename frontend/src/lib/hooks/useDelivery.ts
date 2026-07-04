import { useQuery } from '@tanstack/react-query';
import { deliveryService } from '../../../../libs/api-client/src';

export function useDelivery(id: string) {
  return useQuery({
    queryKey: ['delivery', id],
    queryFn: () => deliveryService.getById(id),
    enabled: !!id,
  });
}
