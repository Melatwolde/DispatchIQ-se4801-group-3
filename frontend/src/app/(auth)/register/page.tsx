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
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [password, setPassword] = useState('');
  const [strength, setStrength] = useState(0);
  const [selectedRole, setSelectedRole] = useState('CUSTOMER');

  useEffect(() => {
    let s = 0;
    if (password.length > 5) s += 1;
    if (password.match(/[A-Z]/)) s += 1;
    if (password.match(/[0-9]/)) s += 1;
    if (password.match(/[^A-Za-z0-9]/)) s += 1;
    setStrength(Math.min(3, Math.floor(s / 1.3)));
  }, [password]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    const formData = new FormData(e.currentTarget);
    
    const firstName = formData.get('firstName') as string;
    const lastName = formData.get('lastName') as string;
    formData.set('fullName', `${firstName} ${lastName}`.trim());
    
    const confirmPassword = formData.get('confirmPassword') as string;
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    startTransition(async () => {
      const result = await register(formData);
      if (result && !result.success) {
        setError(result.error);
      } else {
        if (selectedRole === 'DISPATCHER') {
          setSuccessMessage('Registered successfully! Please wait for admin approval before logging in.');
        } else {
          setSuccessMessage('Account created successfully! You can now proceed to log in.');
        }
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

      {successMessage ? (
        <div style={{ textAlign: 'center', padding: '24px 16px' }}>
          <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#10b981', padding: '16px', borderRadius: '8px', fontSize: '15px', fontWeight: 500, marginBottom: '24px', lineHeight: '1.5' }}>
             {successMessage}
          </div>
          <Link href="/login">
            <Button fullWidth>Return to Login</Button>
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          {error && <div className={styles.errorAlert} style={{ color: 'red', marginBottom: '16px', fontSize: '14px' }}>{error}</div>}
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <Input label="First Name" name="firstName" placeholder="John" required />
            <Input label="Last Name" name="lastName" placeholder="Doe" required />
          </div>

          <Input label="Email" type="email" name="email" placeholder="you@example.com" required />
          <Input label="Phone" type="tel" name="phone" placeholder="+251 9..." required={selectedRole === 'DISPATCHER'} />

          <Select
            label="Role"
            name="role"
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            options={[
              { value: 'CUSTOMER', label: 'User (Default)' },
              { value: 'DISPATCHER', label: 'Dispatcher (Driver with Vehicle)' },
              { value: 'ADMIN', label: 'Admin' }
            ]}
          />

          {selectedRole === 'DISPATCHER' && (
            <div style={{ margin: '20px 0', padding: '16px', border: '1px dashed var(--color-border)', borderRadius: '8px', backgroundColor: 'rgba(37, 99, 235, 0.03)' }}>
              <h4 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '12px', color: '#2563eb' }}>Vehicle Information</h4>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <Input label="License Plate *" name="licensePlate" placeholder="e.g. AA-12345" required />
                <Input label="VIN *" name="vin" placeholder="17-character code" required />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <Input label="Cargo Capacity" name="capacity" placeholder="e.g. 15,000 lbs" />
                <Input label="Current Location" name="currentLocation" placeholder="e.g. 9.03, 38.74" />
              </div>
              
              <input type="hidden" name="maintenanceStatus" value="ACTIVE" />
              <input type="hidden" name="vehicleStatus" value="AVAILABLE" />
            </div>
          )}

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
            {isPending ? 'Submitting Application...' : 'Sign Up'}
          </Button>
        </form>
      )}

      {!successMessage && (
        <div className={styles.footer}>
          Already have an account? <Link href="/login" className={styles.link}>Log in</Link>
        </div>
      )}
    </>
  );
}