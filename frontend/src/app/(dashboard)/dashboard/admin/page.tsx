'use client';

import React from 'react';
import { StatCard } from '../../../../components/ui/StatCard';
import { DataTable } from '../../../../components/ui/DataTable';
import { Users, AlertTriangle, Truck, Route } from 'lucide-react';

export default function AdminDashboard() {
  const usersData = [
    { id: 1, name: 'Zoe', email: 'zoe@dispatchiq.com', role: 'Admin', status: 'Active' },
    { id: 2, name: 'John', email: 'john@dispatchiq.com', role: 'Dispatcher', status: 'Active' },
    { id: 3, name: 'Alice', email: 'alice@dispatchiq.com', role: 'User', status: 'Inactive' },
  ];

  const columns = [
    { key: 'name', header: 'Name' },
    { key: 'email', header: 'Email' },
    { key: 'role', header: 'Role' },
    { 
      key: 'status', 
      header: 'Status',
      render: (row: any) => (
        <span style={{ color: row.status === 'Active' ? 'var(--color-success)' : 'var(--color-text-muted)' }}>
          {row.status}
        </span>
      )
    },
  ];

  return (
    <div>
      <div className="grid-container" style={{ marginBottom: '32px' }}>
        <div className="col-span-3"><StatCard title="Total Users" value="1,284" icon={Users} trend="12%" trendUp={true} /></div>
        <div className="col-span-3"><StatCard title="Active Routes" value="342" icon={Route} trend="4%" trendUp={true} /></div>
        <div className="col-span-3"><StatCard title="Fleet Status" value="98%" icon={Truck} trend="2%" trendUp={false} /></div>
        <div className="col-span-3"><StatCard title="Alerts" value="3" icon={AlertTriangle} trend="1" trendUp={false} /></div>
      </div>

      <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 600 }}>System Users</h2>
        <button style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-text)', border: '1px solid var(--color-border)', padding: '6px 12px', borderRadius: '4px', fontSize: '14px', cursor: 'pointer' }}>
          Add User
        </button>
      </div>
      <DataTable 
        data={usersData} 
        columns={columns} 
        actions={() => <button style={{ background: 'none', border: '1px solid var(--color-border)', borderRadius: '4px', padding: '4px 8px', color: 'var(--color-text-muted)', cursor: 'pointer' }}>Edit</button>}
      />
    </div>
  );
}
