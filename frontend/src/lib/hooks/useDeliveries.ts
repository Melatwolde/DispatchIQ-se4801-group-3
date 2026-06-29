import { useQuery } from '@tanstack/react-query';
import { deliveryService } from '../../../../libs/api-client/src';
import { DeliveryFilters } from '../../../../libs/types/src';

export function useDeliveries(filters?: DeliveryFilters) {
  return useQuery({
    queryKey: ['deliveries', filters],
    queryFn: () => deliveryService.list(filters),
  });
}
