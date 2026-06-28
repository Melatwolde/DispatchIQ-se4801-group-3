'use client';

import React, { useEffect, useState } from 'react';
import { RegisterVehicleModal } from './RegisterVehicleModal';
import { ReviewPendingModal } from './ReviewPendingModal';
import { StatCard } from '../../../../components/ui/StatCard';
import { DataTable } from '../../../../components/ui/DataTable';
import { Users, AlertTriangle, Truck, Route, Bell } from 'lucide-react';
import { getPendingDispatchers } from '../../../../lib/server-actions/auth.actions';

export default function AdminDashboard() {
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [pendingRegistrations, setPendingRegistrations] = useState<any[]>([]);
  const [selectedRegistration, setSelectedRegistration] = useState<any>(null);

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


  const fetchPendingData = async () => {
    try {
      const data = await getPendingDispatchers();
      setPendingRegistrations(data);
    } catch (error) {
      console.error('Error fetching pending registrations:', error);
    }
  };

  useEffect(() => {
    fetchPendingData();
  }, []);

  const handleNotificationClick = () => {
    if (pendingRegistrations.length > 0) {
      setSelectedRegistration(pendingRegistrations[0]);
      setIsReviewModalOpen(true);
    }
  };

  return (
    <div>
      {pendingRegistrations.length > 0 && (
        <div 
          onClick={handleNotificationClick}
          style={{
            display: 'flex', alignItems: 'center', gap: '12px',
            backgroundColor: '#fef3c7', border: '1px solid #f59e0b',
            color: '#b45309', padding: '12px 16px', borderRadius: '6px',
            marginBottom: '24px', cursor: 'pointer', fontWeight: 500
          }}
        >
          <Bell size={18} className="animate-bounce" />
          <span>New Dispatcher & Vehicle Registration Pending Approval ({pendingRegistrations.length})</span>
        </div>
      )}

      <div className="grid-container" style={{ marginBottom: '32px' }}>
        <div className="col-span-3"><StatCard title="Total Users" value="1,284" icon={Users} trend="12%" trendUp={true} /></div>
        <div className="col-span-3"><StatCard title="Active Routes" value="342" icon={Route} trend="4%" trendUp={true} /></div>
        <div className="col-span-3"><StatCard title="Fleet Status" value="98%" icon={Truck} trend="2%" trendUp={false} /></div>
        <div className="col-span-3"><StatCard title="Alerts" value={String(3 + pendingRegistrations.length)} icon={AlertTriangle} trend="1" trendUp={false} /></div>
      </div>

      <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 600 }}>System Users</h2>
        <div>
          <button 
            onClick={() => setIsVehicleModalOpen(true)}
            style={{ backgroundColor: '#2563eb', color: '#ffffff', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', marginRight: '12px' }}
          >
            Add Vehicle
          </button>
        </div>
      </div>

      <DataTable data={usersData} columns={columns} />

      <RegisterVehicleModal isOpen={isVehicleModalOpen} onClose={() => setIsVehicleModalOpen(false)} />
      <ReviewPendingModal 
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        data={selectedRegistration}
        onApprovalSuccess={fetchPendingData}
      />
    </div>
  );
}