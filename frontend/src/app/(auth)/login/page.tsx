'use client';

import React, { useState } from 'react';
import { Navigation2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '../../../components/ui/Button';
import { Input, Select } from '../../../components/ui/Input';
import styles from './../Auth.module.css';

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState('user');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Mock login delay
    setTimeout(() => {
      setLoading(false);
      router.push(`/dashboard/${role}`);
    }, 800);
  };

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
        <Input 
          label="Email" 
          type="email" 
          placeholder="you@example.com" 
          required 
        />
        <Input 
          label="Password" 
          type="password" 
          placeholder="••••••••" 
          required 
        />
        
        <Select 
          label="Select Role (For Demo)"
          value={role}
          onChange={(e) => setRole(e.target.value)}
          options={[
            { value: 'admin', label: 'Admin' },
            { value: 'dispatcher', label: 'Dispatcher' },
            { value: 'user', label: 'User' }
          ]}
        />

        <div className={styles.checkboxContainer} style={{ justifyContent: 'space-between' }}>
          <label className={styles.checkboxLabel} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input type="checkbox" className={styles.checkbox} />
            Remember me
          </label>
          <Link href="#" className={styles.link}>Forgot password?</Link>
        </div>

        <Button type="submit" fullWidth disabled={loading}>
          {loading ? 'Logging in...' : 'Log In'}
        </Button>
      </form>

      <div className={styles.footer}>
        Don't have an account? <Link href="/register" className={styles.link}>Sign up</Link>
      </div>
    </>
  );
}
