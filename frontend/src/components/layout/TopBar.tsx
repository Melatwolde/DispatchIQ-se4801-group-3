'use client';

import React from 'react';
import { Menu, Bell, Moon, Search } from 'lucide-react';
import styles from './TopBar.module.css';
import { usePathname } from 'next/navigation';

interface TopBarProps {
  onToggleSidebar: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ onToggleSidebar }) => {
  const pathname = usePathname();
  
  // Format pathname to a viewable title
  const title = pathname.split('/').pop()?.replace('-', ' ') || 'Dashboard';

  return (
    <header className={styles.topbar}>
      <div className={styles.left}>
        <button className={styles.menuBtn} onClick={onToggleSidebar}>
          <Menu size={20} />
        </button>
        <span className={styles.title} style={{ textTransform: 'capitalize' }}>{title}</span>
      </div>

      <div className={styles.right}>
        <div className={styles.searchBar}>
          <Search size={16} color="var(--color-text-muted)" />
          <input type="text" placeholder="Search..." />
        </div>
        
        <button className={styles.iconBtn}>
          <Bell size={20} />
          <span className={styles.badge}></span>
        </button>
        
        <button className={styles.iconBtn}>
          <Moon size={20} />
        </button>
      </div>
    </header>
  );
};
