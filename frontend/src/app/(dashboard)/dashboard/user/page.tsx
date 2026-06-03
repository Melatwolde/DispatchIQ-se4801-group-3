'use client';

import React from 'react';
import { StatCard } from '../../../../components/ui/StatCard';
import { DataTable } from '../../../../components/ui/DataTable';
import { Package, Clock, CheckCircle } from 'lucide-react';

export default function UserDashboard() {
  const deliveriesData = [
    { id: '#DEL-104', date: 'Oct 12, 2026', origin: 'Warehouse A', status: 'Completed' },
    { id: '#DEL-105', date: 'Oct 14, 2026', origin: 'Partner Store B', status: 'Completed' },
  ];

  const columns = [
    { key: 'id', header: 'Delivery ID' },
    { key: 'date', header: 'Date' },
    { key: 'origin', header: 'Origin' },
    { 
      key: 'status', 
      header: 'Status',
      render: (row: any) => <span style={{ color: 'var(--color-success)' }}>{row.status}</span>
    },
  ];

  return (
    <div>
      <div className="grid-container" style={{ marginBottom: '32px' }}>
        <div className="col-span-4"><StatCard title="Active Deliveries" value="0" icon={Package} /></div>
        <div className="col-span-4"><StatCard title="Pending Review" value="1" icon={Clock} /></div>
        <div className="col-span-4"><StatCard title="Completed Life-time" value="84" icon={CheckCircle} /></div>
      </div>

      <div style={{ marginBottom: '16px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 600 }}>Delivery History</h2>
      </div>
      <DataTable 
        data={deliveriesData} 
        columns={columns}
      />
    </div>
  );
}
