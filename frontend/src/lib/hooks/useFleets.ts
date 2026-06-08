import { useQuery } from '@tanstack/react-query';
import { fleetService } from '@dispatchiq/api-client';

export function useFleets() {
  return useQuery({
    queryKey: ['fleets'],
    queryFn: () => fleetService.list(),
  });
}
