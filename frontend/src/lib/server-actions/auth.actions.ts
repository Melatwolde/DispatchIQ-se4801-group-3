'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { authService } from '@dispatchiq/api-client';
import { UserRole } from '@dispatchiq/types';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  fullName: z.string().min(2),
  role: z.enum(['ADMIN', 'DISPATCHER', 'DRIVER', 'MANAGER', 'CUSTOMER']),
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

    // Set HTTP-only secure cookie
    const cookieStore = await cookies();
    cookieStore.set('auth_token', response.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: '/',
    });

    const route = getDashboardRoute(response.role);

    // ✅ CRITICAL: Call redirect() OUTSIDE try/catch or re-throw NEXT_REDIRECT
    redirect(route);

  } catch (error: any) {
    // ✅ Re-throw redirect errors so Next.js can handle them
    if (error?.digest?.startsWith('NEXT_REDIRECT')) {
      throw error;
    }

    // Log actual errors (network failures, validation, etc.)
    console.error('[Login Service Error]', error);
    return { success: false, error: error.message || 'Login failed' };
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

    const cookieStore = await cookies();
    cookieStore.set('auth_token', response.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    const route = getDashboardRoute(response.role);

    // ✅ Call redirect() outside try/catch or re-throw
    redirect(route);

  } catch (error: any) {
    if (error?.digest?.startsWith('NEXT_REDIRECT')) {
      throw error;
    }

    console.error('[Register Service Error]', error);
    return { success: false, error: error.message || 'Registration failed' };
  }
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete('auth_token');
  redirect('/login');
}