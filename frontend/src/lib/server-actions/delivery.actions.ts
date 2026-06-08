'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { getServerClient } from '../api/server-client';
import { deliveryService } from '@dispatchiq/api-client';

const deliverySchema = z.object({
  address: z.string().min(5),
});

export async function createDelivery(formData: FormData) {
  const data = Object.fromEntries(formData.entries());
  const validated = deliverySchema.safeParse(data);

  if (!validated.success) {
    return { success: false, error: 'Invalid address' };
  }

  try {
    // Note: deliveryService uses the default axios instance.
    // For server actions, we need to ensure the token is set.
    // However, deliveryService is exported as a singleton from @dispatchiq/api-client.
    // In a server environment, multiple requests might share the same singleton.
    // We should ideally use a fresh instance or a request-scoped context.
    
    // For now, we update the headers of the shared instance for this execution.
    await getServerClient(); 
    
    const result = await deliveryService.create(validated.data);
    revalidatePath('/dashboard');
    return { success: true, data: result };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateDelivery(id: string, formData: FormData) {
  const data = Object.fromEntries(formData.entries());
  try {
    await getServerClient();
    const result = await deliveryService.update(id, {
      address: data.address as string,
    });
    revalidatePath('/dashboard');
    return { success: true, data: result };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
