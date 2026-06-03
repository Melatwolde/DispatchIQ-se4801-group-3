'use client';

import React, { useState, useEffect } from 'react';
import { Navigation2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '../../../components/ui/Button';
import { Input, Select } from '../../../components/ui/Input';
import styles from './../Auth.module.css';

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState('');
  const [strength, setStrength] = useState(0);

  // Simple password strength calculator
  useEffect(() => {
    let s = 0;
    if (password.length > 5) s += 1;
    if (password.match(/[A-Z]/)) s += 1;
    if (password.match(/[0-9]/)) s += 1;
    if (password.match(/[^A-Za-z0-9]/)) s += 1;
    setStrength(Math.min(3, Math.floor(s / 1.3))); // Scale 0-3
  }, [password]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      router.push('/login');
    }, 800);
  };

  return (
    <>
      <div className={styles.header}>
        <div className={styles.logo}>
          <Navigation2 className={styles.logoIcon} size={28} />
          <span>DispatchIQ</span>
        </div>
        <p className={styles.subtitle}>Create a new account.</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <Input label="First Name" placeholder="John" required />
          <Input label="Last Name" placeholder="Doe" required />
        </div>

        <Input label="Email" type="email" placeholder="you@example.com" required />
        <Input label="Phone" type="tel" placeholder="+1 (555) 000-0000" />

        <Select
          label="Role"
          options={[
            { value: 'user', label: 'User (Default)' },
            { value: 'dispatcher', label: 'Dispatcher' },
            { value: 'admin', label: 'Admin' }
          ]}
        />

        <div style={{ marginBottom: '16px' }}>
          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ marginBottom: 0 }}
          />
          <div className={styles.passwordStrength}>
            <div className={`${styles.strengthBar} ${strength >= 1 ? styles.strengthWeak : ''}`} />
            <div className={`${styles.strengthBar} ${strength >= 2 ? styles.strengthMedium : ''}`} />
            <div className={`${styles.strengthBar} ${strength >= 3 ? styles.strengthStrong : ''}`} />
          </div>
        </div>

        <Input label="Confirm Password" type="password" placeholder="••••••••" required />

        <div className={styles.checkboxContainer}>
          <label className={styles.checkboxLabel} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
            <input type="checkbox" className={styles.checkbox} required style={{ marginTop: '2px' }} />
            <span>I agree to the <Link href="#" className={styles.link}>Terms of Service</Link> and Privacy Policy</span>
          </label>
        </div>

        <Button type="submit" fullWidth disabled={loading}>
          {loading ? 'Creating...' : 'Sign Up'}
        </Button>
      </form>

      <div className={styles.footer}>
        Already have an account? <Link href="/login" className={styles.link}>Log in</Link>
      </div>
    </>
  );
}
