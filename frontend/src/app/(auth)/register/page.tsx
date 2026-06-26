'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { Navigation2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '../../../components/ui/Button';
import { Input, Select } from '../../../components/ui/Input';
import styles from './../Auth.module.css';
import { register } from '../../../lib/server-actions/auth.actions';

export default function RegisterPage() {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
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

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);

    // Combine first and last name into fullName
    const firstName = formData.get('firstName') as string;
    const lastName = formData.get('lastName') as string;
    formData.set('fullName', `${firstName} ${lastName}`.trim());

    // Check if passwords match
    const confirmPassword = formData.get('confirmPassword') as string;
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    startTransition(async () => {
      const result = await register(formData);
      if (result && !result.success) {
        setError(result.error);
      }
    });
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
        {error && <div className={styles.errorAlert} style={{ color: 'red', marginBottom: '16px', fontSize: '14px' }}>{error}</div>}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <Input label="First Name" name="firstName" placeholder="John" required />
          <Input label="Last Name" name="lastName" placeholder="Doe" required />
        </div>

        <Input label="Email" type="email" name="email" placeholder="you@example.com" required />
        <Input label="Phone" type="tel" name="phone" placeholder="+1 (555) 000-0000" />

        <Select
          label="Role"
          name="role"
          options={[
            { value: 'CUSTOMER', label: 'User (Default)' },
            { value: 'DISPATCHER', label: 'Dispatcher' },
            { value: 'ADMIN', label: 'Admin' }
          ]}
        />

        <div style={{ marginBottom: '16px' }}>
          <Input
            label="Password"
            type="password"
            name="password"
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

        <Input label="Confirm Password" type="password" name="confirmPassword" placeholder="••••••••" required />

        <div className={styles.checkboxContainer}>
          <label className={styles.checkboxLabel} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
            <input type="checkbox" className={styles.checkbox} required style={{ marginTop: '2px' }} />
            <span>I agree to the <Link href="#" className={styles.link}>Terms of Service</Link> and Privacy Policy</span>
          </label>
        </div>

        <Button type="submit" fullWidth disabled={isPending}>
          {isPending ? 'Creating...' : 'Sign Up'}
        </Button>
      </form>

      <div className={styles.footer}>
        Already have an account? <Link href="/login" className={styles.link}>Log in</Link>
      </div>
    </>
  );
}
