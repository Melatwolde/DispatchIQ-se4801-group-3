import React from 'react';
import type { LucideIcon } from 'lucide-react';
import styles from './StatCard.module.css';

export interface StatCardProps {
  title: string;
  value: string | number;
  trend?: string;
  trendUp?: boolean;
  icon?: LucideIcon;
}

export const StatCard: React.FC<StatCardProps> = ({ title, value, trend, trendUp, icon: Icon }) => {
  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <span className={styles.title}>{title}</span>
        {Icon && <Icon size={20} className={styles.icon} />}
      </div>
      <div className={styles.value}>{value}</div>
      {trend && (
        <span className={`${styles.trendBadge} ${trendUp ? styles.trendUp : styles.trendDown}`}>
          {trendUp ? '↑' : '↓'} {trend}
        </span>
      )}
    </div>
  );
};
