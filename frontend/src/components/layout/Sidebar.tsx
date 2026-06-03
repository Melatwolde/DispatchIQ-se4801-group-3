'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, Truck, Map, Settings, LogOut, Navigation2 } from 'lucide-react';
import styles from './Sidebar.module.css';

interface SidebarProps {
  isOpen: boolean;
  role: 'admin' | 'dispatcher' | 'user';
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, role }) => {
  const pathname = usePathname();

  const roleMenus = {
    admin: [
      { name: 'Dashboard', path: '/dashboard/admin', icon: LayoutDashboard },
      { name: 'Users', path: '/dashboard/admin/users', icon: Users },
      { name: 'Settings', path: '/dashboard/admin/settings', icon: Settings },
    ],
    dispatcher: [
      { name: 'Dashboard', path: '/dashboard/dispatcher', icon: LayoutDashboard },
      { name: 'Active Jobs', path: '/dashboard/dispatcher/jobs', icon: Map },
      { name: 'Fleet', path: '/dashboard/dispatcher/fleet', icon: Truck },
    ],
    user: [
      { name: 'Dashboard', path: '/dashboard/user', icon: LayoutDashboard },
      { name: 'My Deliveries', path: '/dashboard/user/deliveries', icon: Truck },
    ]
  };

  const navItems = roleMenus[role] || roleMenus['user'];

  return (
    <aside className={`${styles.sidebar} ${isOpen ? styles.open : ''}`}>
      <div className={styles.logoSection}>
        <Navigation2 className={styles.logoIcon} />
        <span>DispatchIQ</span>
      </div>

      <nav className={styles.navigation}>
        {navItems.map((item) => {
          const isActive = pathname === item.path;
          return (
            <Link 
              key={item.path} 
              href={item.path}
              className={`${styles.navItem} ${isActive ? styles.navItemActive : ''}`}
            >
              <item.icon size={18} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className={styles.userSection}>
        <div className={styles.avatar}>Z</div>
        <div className={styles.userInfo}>
          <span className={styles.userName}>Zoe</span>
          <span className={styles.userRole}>{role}</span>
        </div>
        <button className={styles.logoutBtn} title="Logout" onClick={() => window.location.href = '/login'}>
          <LogOut size={18} />
        </button>
      </div>
    </aside>
  );
};
