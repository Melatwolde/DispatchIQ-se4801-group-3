import { useMutation, useQueryClient } from '@tanstack/react-query';
import { assignmentService } from '@dispatchiq/api-client';
import { AssignmentRequest } from '@dispatchiq/types';

export function useAssignDriver() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ data, idempotencyKey }: { data: AssignmentRequest; idempotencyKey: string }) => 
      assignmentService.assign(data, idempotencyKey),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deliveries'] });
    },
  });
}
