import React from 'react';
import styles from './Auth.module.css';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.container}>
      <div className={styles.card}>
        {children}
      </div>
    </div>
  );
}
