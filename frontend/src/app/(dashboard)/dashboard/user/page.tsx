'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { StatCard } from '../../../../components/ui/StatCard';
import { DataTable } from '../../../../components/ui/DataTable';
import { Package, Clock, CheckCircle, Plus } from 'lucide-react';

interface DeliveryItem {
  id: string;
  status: string;
  pickupAddress: string;
  requestedPickupTime: string;
}

interface PaginatedDeliveryResponse {
  content: DeliveryItem[];
  [key: string]: any;
}

function formatDeliveryDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'N/A';
  }
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default function UserDashboard() {
  const router = useRouter();
  const [deliveries, setDeliveries] = useState<DeliveryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadDeliveries() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/deliveries?page=0&size=50', { credentials: 'include' });
        if (!response.ok) {
          throw new Error(`Failed to fetch deliveries (${response.status})`);
        }

        const payload = (await response.json()) as PaginatedDeliveryResponse;
        const content = Array.isArray(payload?.content) ? payload.content : [];

        if (mounted) {
          setDeliveries(content);
        }
      } catch (fetchError) {
        if (!mounted) return;
        setError(fetchError instanceof Error ? fetchError.message : 'Unable to load deliveries');
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadDeliveries();
    return () => {
      mounted = false;
    };
  }, []);

  const activeStatuses = useMemo(() => new Set(['ASSIGNED', 'EN_ROUTE']), []);

  const activeDeliveriesCount = useMemo(
    () => deliveries.filter((delivery) => activeStatuses.has(delivery.status)).length,
    [deliveries, activeStatuses]
  );

  const pendingReviewCount = useMemo(
    () => deliveries.filter((delivery) => delivery.status === 'PENDING').length,
    [deliveries]
  );

  const completedLifetimeCount = useMemo(
    () => deliveries.filter((delivery) => delivery.status === 'COMPLETED').length,
    [deliveries]
  );

  const tableData = useMemo(
    () =>
      deliveries.map((delivery) => ({
        id: delivery.id.slice(0, 8),
        date: formatDeliveryDate(delivery.requestedPickupTime),
        origin: delivery.pickupAddress,
        status: delivery.status,
      })),
    [deliveries]
  );

  const columns = useMemo(
    () => [
      { key: 'id', header: 'Delivery ID' },
      { key: 'date', header: 'Date' },
      { key: 'origin', header: 'Origin' },
      {
        key: 'status',
        header: 'Status',
        render: (row: any) => {
          const status = row.status as string;
          let color = '#6b7280';
          if (status === 'ASSIGNED' || status === 'EN_ROUTE') color = '#2563eb';
          if (status === 'COMPLETED') color = '#16a34a';
          if (status === 'PENDING') color = '#d97706';
          return <span style={{ color }}>{status}</span>;
        },
      },
    ],
    []
  );

  return (
    <div>
      <div className="grid-container" style={{ marginBottom: '32px' }}>
        <div className="col-span-4"><StatCard title="Active Deliveries" value={String(activeDeliveriesCount)} icon={Package} /></div>
        <div className="col-span-4"><StatCard title="Pending Review" value={String(pendingReviewCount)} icon={Clock} /></div>
        <div className="col-span-4"><StatCard title="Completed Life-time" value={String(completedLifetimeCount)} icon={CheckCircle} /></div>
      </div>


      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px'
      }}>
        <h2 style={{ fontSize: '18px', fontWeight: 600, margin: 0 }}>Delivery History</h2>


        <button
          onClick={() => router.push('/dashboard/user/create-delivery')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: '#2563eb',
            color: '#fff',
            border: 'none',
            padding: '10px 16px',
            borderRadius: '6px',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          <Plus size={16} />
          Order Delivery
        </button>
      </div>

      {/* Data Table */}
      {loading ? (
        <div style={{ padding: '24px', background: '#111827', borderRadius: '16px', color: '#f9fafb' }}>
          Loading deliveries...
        </div>
      ) : error ? (
        <div style={{ padding: '24px', background: '#fee2e2', borderRadius: '16px', color: '#991b1b' }}>
          Error loading deliveries: {error}
        </div>
      ) : (
        <DataTable
          data={tableData}
          columns={columns}
        />
      )
    }
    </div>
  );
}