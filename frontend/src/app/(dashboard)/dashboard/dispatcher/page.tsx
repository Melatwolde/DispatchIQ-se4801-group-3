'use client';

import React from 'react';
import { StatCard } from '../../../../components/ui/StatCard';
import { DataTable } from '../../../../components/ui/DataTable';
import { Clock, MapPin, Truck, CheckCircle } from 'lucide-react';

export default function DispatcherDashboard() {
  const jobsData = [
    { id: '#JOB-881', destination: '123 Market St.', driver: 'Mike T.', eta: '14:30', status: 'In Transit' },
    { id: '#JOB-882', destination: '456 Union Sq.', driver: 'Sarah W.', eta: '15:45', status: 'Pending' },
    { id: '#JOB-883', destination: '789 Broadway', driver: 'Dave B.', eta: 'Delivered', status: 'Completed' },
  ];

  const columns = [
    { key: 'id', header: 'Job ID' },
    { key: 'destination', header: 'Destination' },
    { key: 'driver', header: 'Assigned Driver' },
    { key: 'eta', header: 'ETA' },
    { 
      key: 'status', 
      header: 'Status',
      render: (row: any) => {
        let color = 'var(--color-text-muted)';
        if (row.status === 'In Transit') color = 'var(--color-accent)';
        if (row.status === 'Completed') color = 'var(--color-success)';
        return <span style={{ color }}>{row.status}</span>
      }
    },
  ];

  return (
    <div>
      <div className="grid-container" style={{ marginBottom: '32px' }}>
        <div className="col-span-3"><StatCard title="Active Jobs" value="24" icon={MapPin} trend="6" trendUp={true} /></div>
        <div className="col-span-3"><StatCard title="Pending Jobs" value="12" icon={Clock} trend="2" trendUp={false} /></div>
        <div className="col-span-3"><StatCard title="Drivers En Route" value="18" icon={Truck} /></div>
        <div className="col-span-3"><StatCard title="Completed Today" value="142" icon={CheckCircle} /></div>
      </div>

      <div style={{ marginBottom: '16px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 600 }}>Active Dispatch Board</h2>
      </div>
      <DataTable 
        data={jobsData} 
        columns={columns}
        actions={() => <button style={{ background: 'none', border: '1px solid var(--color-border)', borderRadius: '4px', padding: '4px 8px', color: 'var(--color-text-muted)', cursor: 'pointer' }}>View Details</button>}
      />
    </div>
  );
}
