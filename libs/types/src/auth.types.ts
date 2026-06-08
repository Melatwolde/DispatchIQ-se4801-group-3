export type UserRole = 'ADMIN' | 'DISPATCHER' | 'DRIVER' | 'MANAGER' | 'CUSTOMER';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
  role: UserRole;
}

export interface AuthResponse {
  accessToken: string;
  userId: string;
  role: UserRole;
}
