'use server';

import { revalidatePath } from 'next/cache';
import { getServerClient } from '../api/server-client';
import { fleetService } from '@dispatchiq/api-client';

export async function updateFleet(id: string, formData: FormData) {
  const data = Object.fromEntries(formData.entries());
  try {
    await getServerClient();
    const result = await fleetService.update(id, {
      name: data.name as string,
      region: data.region as string,
    });
    revalidatePath('/dashboard/admin');
    return { success: true, data: result };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
