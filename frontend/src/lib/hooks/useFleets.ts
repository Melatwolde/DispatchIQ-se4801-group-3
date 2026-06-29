import { useQuery } from '@tanstack/react-query';
import { fleetService } from '../../../../libs/api-client/src';

export function useFleets() {
  return useQuery({
    queryKey: ['fleets'],
    queryFn: () => fleetService.list(),
  });
}
