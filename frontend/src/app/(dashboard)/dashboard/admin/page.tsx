'use client';

import React, { useEffect, useState } from 'react';
import { RegisterVehicleModal } from './RegisterVehicleModal';
import { ReviewPendingModal } from './ReviewPendingModal';
import { StatCard } from '../../../../components/ui/StatCard';
import { DataTable } from '../../../../components/ui/DataTable';
import { Users, AlertTriangle, Truck, Route, Bell } from 'lucide-react';
import { getAuthToken } from '../../../../lib/server-actions/auth.actions';

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

  // Fetch real pending registrations from our new Spring Boot endpoint
  const fetchPendingData = async () => {
    try {
      const token = await getAuthToken();
      const response = await fetch('http://localhost:8080/api/v1/admin/pending-dispatchers', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setPendingRegistrations(data);
      }
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
      {/* Dynamic Admin Review Notification Bar */}
      {pendingRegistrations.length > 0 && (
        <div 
          onClick={handleNotificationClick}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            backgroundColor: '#fef3c7',
            border: '1px solid #f59e0b',
            color: '#b45309',
            padding: '12px 16px',
            borderRadius: '6px',
            marginBottom: '24px',
            cursor: 'pointer',
            fontWeight: 500,
            fontSize: '14px',
            transition: 'background-color 0.2s'
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#fde68a')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#fef3c7')}
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
            style={{ backgroundColor: '#2563eb', color: '#ffffff', border: 'none', padding: '6px 12px', borderRadius: '4px', fontSize: '14px', fontWeight: 500, cursor: 'pointer', marginRight: '12px' }}
          >
            Add Vehicle
          </button>
          <button style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-text)', border: '1px solid var(--color-border)', padding: '6px 12px', borderRadius: '4px', fontSize: '14px', cursor: 'pointer' }}>
            Add User
          </button>
        </div>
      </div>

      <DataTable 
        data={usersData} 
        columns={columns} 
        actions={() => <button style={{ background: 'none', border: '1px solid var(--color-border)', borderRadius: '4px', padding: '4px 8px', color: 'var(--color-text-muted)', cursor: 'pointer' }}>Edit</button>}
      />

      {/* Add Fleet Vehicle Modal */}
      <RegisterVehicleModal 
        isOpen={isVehicleModalOpen} 
        onClose={() => setIsVehicleModalOpen(false)} 
      />

      {/* Verification & Approval Review Modal */}
      <ReviewPendingModal 
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        data={selectedRegistration}
        onApprovalSuccess={fetchPendingData}
      />
    </div>
  );
}