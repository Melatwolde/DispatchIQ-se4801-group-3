'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { getServerClient } from '../api/server-client';
import { deliveryService } from '../../../../libs/api-client/src';

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
