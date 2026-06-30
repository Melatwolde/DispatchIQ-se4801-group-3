'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { authService } from '../../../../libs/api-client/src/services/auth.service';
import { UserRole } from '../../../../libs/types/src/auth.types';
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  fullName: z.string().min(2),
  phone: z.string().optional(),
  role: z.enum(['ADMIN', 'DISPATCHER', 'DRIVER', 'MANAGER', 'CUSTOMER']),
  licensePlate: z.string().optional(),
  vin: z.string().optional(),
  capacity: z.string().optional(),
  currentLocation: z.string().optional(),
  maintenanceStatus: z.string().optional(),
  vehicleStatus: z.string().optional(),
});

function getDashboardRoute(role: UserRole): string {
  switch (role) {
    case 'ADMIN':
    case 'MANAGER':
      return '/dashboard/admin';
    case 'DISPATCHER':
      return '/dashboard/dispatcher';
    case 'DRIVER':
    case 'CUSTOMER':
      return '/dashboard/user';
    default:
      console.warn(`No explicit route mapping for role: ${role}. Falling back to /dashboard/user`);
      return '/dashboard/user';
  }
}

export async function login(formData: FormData) {
  const data = Object.fromEntries(formData.entries());
  const validated = loginSchema.safeParse(data);
  if (!validated.success) {
    console.error('[Login Validation Error]', validated.error.format());
    return { success: false, error: 'Invalid input data' };
  }

  try {
    const response = await authService.login(validated.data);
    const cookieStore = await cookies();
    cookieStore.set('auth_token', response.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });
    const route = getDashboardRoute(response.role);
    redirect(route);
  } catch (error: any) {
    if (error?.digest?.startsWith('NEXT_REDIRECT')) throw error;
    console.error('[Login Service Error]', error);
    const backendMessage = error?.response?.data?.message || error?.message || 'Login failed';
    return { success: false, error: backendMessage };
  }
}

export async function register(formData: FormData) {
  const data = Object.fromEntries(formData.entries());
  const validated = registerSchema.safeParse(data);
  if (!validated.success) {
    console.error('[Register Validation Error]', validated.error.format());
    return { success: false, error: 'Invalid input data' };
  }

  try {
    const response = await authService.register(validated.data);
    if (validated.data.role === 'DISPATCHER') return { success: true };

    const cookieStore = await cookies();
    cookieStore.set('auth_token', response.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });
    const route = getDashboardRoute(response.role);
    redirect(route);
  } catch (error: any) {
    if (error?.digest?.startsWith('NEXT_REDIRECT')) throw error;
    console.error('[Register Service Error]', error);
    const backendMessage = error?.response?.data?.message || error?.message || 'Registration failed';
    return { success: false, error: backendMessage };
  }
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete('auth_token');
  redirect('/login');
}

export async function getAuthToken() {
  const cookieStore = await cookies();
  return cookieStore.get('auth_token')?.value || null;
}

export async function getPendingDispatchers() {
  const token = await getAuthToken();
  console.log("[DEBUG] Fetching pending dispatchers. Token present:", !!token);

  const response = await fetch('http://localhost:8080/api/v1/admin/pending-dispatchers', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[DEBUG] Backend Error (${response.status}):`, errorText);
    return [];
  }

  return await response.json();
}