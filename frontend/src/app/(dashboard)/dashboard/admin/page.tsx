'use client';

import React, { useEffect, useState } from 'react';
import RegisterVehicleModal from './RegisterVehicleModal';
import { StatCard } from '../../../../components/ui/StatCard';
import { DataTable } from '../../../../components/ui/DataTable';
import { Users, AlertTriangle, Truck } from 'lucide-react';

export default function AdminDashboard() {
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
  const [view, setView] = useState('ALL'); 
  const [stats, setStats] = useState({ totalUsers: 0, totalDispatchers: 0, pendingDispatchers: 0 });
  const [allUsers, setAllUsers] = useState<any[]>([]);

  const columns = [
    { key: 'fullName', header: 'Name' },
    { key: 'email', header: 'Email' },
    { key: 'role', header: 'Role' },
    { key: 'onboardingStatus', header: 'Status' }
  ];

  const fetchData = async () => {
    try {
      const statsRes = await fetch(`http://localhost:8080/api/v1/admin/stats?t=${Date.now()}`, { credentials: 'include' });
      if (statsRes.ok) setStats(await statsRes.json());

      const usersRes = await fetch(`http://localhost:8080/api/v1/admin/all-users?t=${Date.now()}`, { credentials: 'include' });
      if (usersRes.ok) setAllUsers(await usersRes.json());
    } catch (error) {
      console.error('Fetch error:', error);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  const filteredData = allUsers.filter(user => {
    if (view === 'USERS') return user.role === 'CUSTOMER';
    if (view === 'DISPATCHERS') return user.role === 'DISPATCHER';
    if (view === 'PENDING') return user.onboardingStatus === 'PENDING_APPROVAL';
    return true;
  });

  const cardStyle = { cursor: 'pointer', transition: 'all 0.2s ease' };

  return (
    <div>
      <div className="grid-container" style={{ marginBottom: '32px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
        
        {/* Total Customers: Strictly count only where role is 'CUSTOMER' */}
        <div onClick={() => setView('USERS')} style={cardStyle} onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}>
          <StatCard 
            title="Total Customers" 
            value={String(allUsers.filter(u => u.role === 'CUSTOMER').length)} 
            icon={Users} 
          />
        </div>

        {/* Total Dispatchers: Use your API stat */}
        <div onClick={() => setView('DISPATCHERS')} style={cardStyle} onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}>
          <StatCard title="Total Dispatchers" value={String(stats.totalDispatchers)} icon={Truck} />
        </div>

        {/* Pending Approvals: Use your API stat */}
        <div onClick={() => setView('PENDING')} style={cardStyle} onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}>
          <StatCard title="Pending Approvals" value={String(stats.pendingDispatchers)} icon={AlertTriangle} />
        </div>
      </div>

      <div style={{ marginBottom: '16px' }}>
        <h2>System Users ({view})</h2>
      </div>

      <DataTable data={filteredData} columns={columns} />
      <RegisterVehicleModal isOpen={isVehicleModalOpen} onClose={() => setIsVehicleModalOpen(false)} />
    </div>
  );
}