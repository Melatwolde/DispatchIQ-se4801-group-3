import { useMutation, useQueryClient } from '@tanstack/react-query';
import { assignmentService } from '../../../../libs/api-client/src';
import { AssignmentRequest } from '../../../../libs/types/src';

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
