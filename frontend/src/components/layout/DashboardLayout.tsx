'use client';

import React, { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import styles from './DashboardLayout.module.css';
import { usePathname } from 'next/navigation';

export const DashboardLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  // Simple role determination based on path (mock logic)
  const role = pathname.includes('/admin') ? 'admin' 
             : pathname.includes('/dispatcher') ? 'dispatcher' 
             : 'user';

  // Close sidebar on navigation on mobile
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  return (
    <div className={styles.container}>
      <Sidebar isOpen={sidebarOpen} role={role} />
      
      <div className={styles.mainWrapper}>
        <TopBar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        
        <main className={styles.mainContent}>
          {children}
        </main>
      </div>

      <div 
        className={`${styles.overlay} ${sidebarOpen ? styles.visible : ''}`} 
        onClick={() => setSidebarOpen(false)}
      />
    </div>
  );
};
