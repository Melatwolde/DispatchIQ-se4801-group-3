import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  trendUp?: boolean;
}

export const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, trend, trendUp }) => {
  return (
    <div style={{
      backgroundColor: 'var(--color-surface)',
      border: '1px solid var(--color-border)',
      borderRadius: '12px',
      padding: '24px',
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
      transition: 'all 0.2s ease',
      cursor: 'default'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ 
          backgroundColor: 'rgba(59, 130, 246, 0.1)', 
          padding: '10px', 
          borderRadius: '10px',
          color: 'var(--color-accent)'
        }}>
          <Icon size={24} />
        </div>
        {trend && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '14px',
            fontWeight: 600,
            color: trendUp ? 'var(--color-success)' : 'var(--color-error)',
            backgroundColor: trendUp ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            padding: '4px 8px',
            borderRadius: '6px'
          }}>
            {trendUp ? '↑' : '↓'} {trend}
          </div>
        )}
      </div>
      <div>
        <h3 style={{ 
          color: 'var(--color-text-muted)', 
          fontSize: '14px', 
          fontWeight: 500,
          marginBottom: '4px'
        }}>
          {title}
        </h3>
        <p style={{ 
          color: 'var(--color-text)', 
          fontSize: '28px', 
          fontWeight: 700,
          letterSpacing: '-0.02em'
        }}>
          {value}
        </p>
      </div>
    </div>
  );
};
