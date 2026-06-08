import { useQuery } from '@tanstack/react-query';
import { deliveryService } from '@dispatchiq/api-client';
import { DeliveryFilters } from '@dispatchiq/types';

export function useDeliveries(filters?: DeliveryFilters) {
  return useQuery({
    queryKey: ['deliveries', filters],
    queryFn: () => deliveryService.list(filters),
  });
}
