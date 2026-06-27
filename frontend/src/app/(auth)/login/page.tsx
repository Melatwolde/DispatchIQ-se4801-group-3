'use client';

import React, { useState, useTransition } from 'react';
import { Navigation2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import styles from './../Auth.module.css';
import { login } from '../../../lib/server-actions/auth.actions';

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    
    startTransition(async () => {
      const result = await login(formData);
      if (result && !result.success) {
        setError(result.error);
      }
    });
  };

  const isPendingApproval = error?.toLowerCase().includes('pending');

  return (
    <>
      <div className={styles.header}>
        <div className={styles.logo}>
          <Navigation2 className={styles.logoIcon} size={28} />
          <span>DispatchIQ</span>
        </div>
        <p className={styles.subtitle}>Welcome back. Please log in to your account.</p>
      </div>

      <form onSubmit={handleSubmit}>
        {error && (
          <div 
            className={styles.errorAlert} 
            style={{ 
              color: isPendingApproval ? '#b45309' : 'red', 
              backgroundColor: isPendingApproval ? 'rgba(245, 158, 11, 0.15)' : 'transparent',
              border: isPendingApproval ? '1px solid rgba(245, 158, 11, 0.3)' : 'none',
              padding: isPendingApproval ? '12px' : '0',
              borderRadius: isPendingApproval ? '6px' : '0',
              marginBottom: '16px', 
              fontSize: '14px',
              lineHeight: '1.4'
            }}
          >
            {isPendingApproval ? `⏳ ${error}` : error}
          </div>
        )}
        
        <Input 
          label="Email" 
          type="email" 
          name="email"
          placeholder="you@example.com" 
          required 
        />
        <Input 
          label="Password" 
          type="password" 
          name="password"
          placeholder="••••••••" 
          required 
        />

        <div className={styles.checkboxContainer} style={{ justifyContent: 'space-between' }}>
          <label className={styles.checkboxLabel} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input type="checkbox" className={styles.checkbox} name="remember" />
            Remember me
          </label>
          <Link href="#" className={styles.link}>Forgot password?</Link>
        </div>

        <Button type="submit" fullWidth disabled={isPending}>
          {isPending ? 'Logging in...' : 'Log In'}
        </Button>
      </form>

      <div className={styles.footer}>
        Don't have an account? <Link href="/register" className={styles.link}>Sign up</Link>
      </div>
    </>
  );
}