'use client';

import React, { useEffect, useState } from 'react';
import { StatCard } from '../../../../components/ui/StatCard';
import { DataTable } from '../../../../components/ui/DataTable';
import { Clock, MapPin, Truck, CheckCircle, XCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function DispatcherDashboard() {
  const router = useRouter();

  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [myAssignments, setMyAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  // const [processingId, setProcessingId] = useState<string | null>(null);

  // 1. ADD THIS NOTIFICATION STATE REGISTER
  const [notifications, setNotifications] = useState<{ id: string; type: 'success' | 'error'; message: string }[]>([]);

  // 2. ADD THIS LOGICAL HELPER EMITTER PIPELINE
  const showNotification = (type: 'success' | 'error', message: string) => {
    const id = crypto.randomUUID();
    setNotifications((prev) => [...prev, { id, type, message }]);
    
    // Automatically dismiss the message alert card block after 4 seconds
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 4000);
  };
  
  // Track selected driver globally if using manual assignment overlays (or null for true automated dispatch)
  const [selectedDriverId, setSelectedDriverId] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [delRes, assignRes] = await Promise.all([
        fetch('/api/deliveries/available?page=0&size=50', { credentials: 'include' }),
        fetch('/api/v1/assignments/dispatcher-review', { credentials: 'include' })
      ]);

      if (delRes.ok) {
        const delData = await delRes.json();
        setDeliveries(Array.isArray(delData?.content) ? delData.content : []);
      } else {
        console.error('Failed to fetch available deliveries', delRes.status, await delRes.text().catch(() => '<no body>'));
        setDeliveries([]);
      }

      if (assignRes.ok) {
        const assignData = await assignRes.json();
        setMyAssignments(Array.isArray(assignData) ? assignData : []);
      } else {
        setMyAssignments([]);
      }
    } catch (error) {
      console.error('Error loading dispatcher data:', error);
      setDeliveries([]);
      setMyAssignments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Add a processing guard state at the top of your component definition
  const [processingId, setProcessingId] = useState<string | null>(null);

  const handleAutoMatch = async (deliveryId: string) => {
    // Abort if already processing to completely fix the duplicate double-thread invocation
    if (processingId === deliveryId) return;
    
    setProcessingId(deliveryId);
    try {
      console.log("Auto matching delivery:", deliveryId);

      const createRes = await fetch('/api/v1/assignments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': crypto.randomUUID()
        },
        body: JSON.stringify({
          orderId: deliveryId,
          driverId: selectedDriverId || null,
          priority: 1,
          notes: 'Auto-assigned by dispatcher'
        })
      });

      if (!createRes.ok) {
        const err = await createRes.json().catch(() => ({}));
        showNotification('error', `Create failed: ${err.message || 'Unknown server error'}`);
        return;
      }

      const assignment = await createRes.json();
      const assignmentId = assignment.publicId || assignment.id;

      if (!assignmentId) {
        showNotification('error', "Failed to extract operational assignment ID");
        return;
      }

      // Chain approval sequence step directly onto the newly established orchestration ID
      const approveRes = await fetch(`/api/v1/assignments/${assignmentId}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (approveRes.ok) {
        showNotification('success', 'Delivery workflow cleanly finalized and approved!');
        loadData();
      } else {
        // EXPLICIT LOGGING: Read and display the exact reason the backend is failing the acceptance step
        const errPayload = await approveRes.json().catch(() => ({}));
        console.error("Auto-acceptance sequence rejection payload:", errPayload);
        showNotification('error', `Assignment wrapper built, but accept failed: ${errPayload.message || 'Workflow locked'}`);
      }
    } catch (error) {
      console.error(error);
      showNotification('error', 'Error triggered during auto match processing operation');
    } finally {
      // Clear the processing debouncer flag guard
      setProcessingId(null);
    }
  };


  const handleAction = async (assignmentId: string, action: 'accept' | 'reject') => {
    try {
      console.log(`Executing execution pipeline for status: ${action} on sequence:`, assignmentId);

      const res = await fetch(`/api/v1/assignments/${assignmentId}/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (res.ok) {
        alert(`✅ Assignment ${action}ed successfully!`);
        loadData();
      } else {
        const errorData = await res.json().catch(() => ({}));
        console.error("Error payload structure received:", errorData);

        if (errorData.message?.includes("another driver")) {
          alert("Conflict warning: This assignment has already been allocated or completed by another asset.");
        } else {
          alert(`Action state mutation target failed to ${action}: ${errorData.message || 'Unknown execution variance'}`);
        }
      }
    } catch (error) {
      console.error(`${action} request thread fault event:`, error);
      alert(`Critical network connectivity or transport issue during ${action} operation.`);
    }
  };

  // Map state sets into consistent application-level tracking grids
  const myAssignmentsData = myAssignments.map(a => ({
    id: a.assignmentId?.substring(0, 8) || 'N/A',
    fullId: a.assignmentId,
    destination: a.dropoffAddress || 'Pending Details',
    origin: a.pickupAddress || 'Warehouse Node',
    eta: a.requestedPickupTime ? new Date(a.requestedPickupTime).toLocaleString() : 'N/A',
    priority: a.priority || 'MEDIUM',
    status: a.status || 'PENDING'
  }));

  myAssignmentsData.sort((a, b) => b.eta.localeCompare(a.eta));

  const myAssignmentsColumns = [
    { key: 'id', header: 'Assignment ID' },
    { key: 'origin', header: 'Pickup Location' },
    { key: 'destination', header: 'Destination Drop' },
    { key: 'eta', header: 'Scheduled Time' },
    { key: 'priority', header: 'Priority Level' },
    {
      key: 'status',
      header: 'Status',
      render: (row: any) => <span style={{ color: '#2563eb', fontWeight: 600 }}>{row.status}</span>
    },
  ];

  const pendingDeliveriesData = deliveries
    .filter(d => d.status === 'PENDING')
    .map(d => ({
      id: d.id?.substring(0, 8) || '',
      fullId: d.id,
      origin: d.pickupAddress || 'Central Depot',
      destination: d.dropoffAddress || 'Unassigned Destination',
      date: d.requestedPickupTime || d.created_at ? new Date(d.requestedPickupTime || d.created_at).toLocaleString() : 'N/A',
      priority: d.priority || 'MEDIUM',
      status: d.status
    }));
    
  const pendingDeliveriesColumns = [
    { key: 'id', header: 'Delivery ID' },
    { key: 'origin', header: 'Origin Node' },
    { key: 'destination', header: 'Destination Node' },
    { key: 'priority', header: 'Database Priority' },
    { key: 'date', header: 'Ingestion Date' },
    {
      key: 'status',
      header: 'System Status',
      render: (row: any) => <span style={{ color: '#d97706', fontWeight: 600 }}>{row.status}</span>
    },
  ];

  return (
    <div style={{ padding: '16px' }}>
      {/* Structural Metric KPI Grid Context */}
      <div className="grid-container" style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '16px', marginBottom: '32px' }}>
        <div style={{ gridColumn: 'span 3' }}><StatCard title="Active Jobs" value="24" icon={MapPin} trend="6" trendUp={true} /></div>
        <div style={{ gridColumn: 'span 3' }}><StatCard title="My Pending Actions" value={myAssignments.length.toString()} icon={Clock} trendUp={false} /></div>
        <div style={{ gridColumn: 'span 3' }}><StatCard title="Drivers En Route" value="18" icon={Truck} /></div>
        <div style={{ gridColumn: 'span 3' }}><StatCard title="Completed Today" value="142" icon={CheckCircle} /></div>
      </div>

      {/* Review Queue Block */}
      <div style={{ marginBottom: '16px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 600 }}>My Pending Assignments</h2>
        <p style={{ color: '#9ca3af', fontSize: '14px' }}>Accept or reject incoming matches flagged for driver deployment reviews.</p>
      </div>

      {loading ? (
        <div style={{ padding: '24px', background: '#111827', borderRadius: '16px', color: '#f9fafb', marginBottom: '32px' }}>
          Querying remote datastore streams...
        </div>
      ) : myAssignmentsData.length === 0 ? (
        <div style={{ padding: '24px', background: '#111827', borderRadius: '16px', color: '#f9fafb', marginBottom: '32px' }}>
          No records currently pending dispatch action review.
        </div>
      ) : (
        <div style={{ marginBottom: '32px' }}>
          <DataTable
            data={myAssignmentsData}
            columns={myAssignmentsColumns}
            actions={(row) => (
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => handleAction(row.fullId, 'accept')}
                  style={{ background: '#16a34a', border: 'none', borderRadius: '6px', padding: '6px 14px', color: '#fff', cursor: 'pointer', fontWeight: 600 }}
                >
                  Accept
                </button>
                <button
                  onClick={() => handleAction(row.fullId, 'reject')}
                  style={{ background: '#dc2626', border: 'none', borderRadius: '6px', padding: '6px 14px', color: '#fff', cursor: 'pointer', fontWeight: 600 }}
                >
                  Reject
                </button>
              </div>
            )}
          />
        </div>
      )}

      {/* Global Ledger Context Section */}
      <div style={{ marginBottom: '16px', marginTop: '32px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 600 }}>Available Orders (Global Base Registry)</h2>
        <p style={{ color: '#9ca3af', fontSize: '14px' }}>Unassigned incoming records currently written to backend layer with state <code style={{color:'#f59e0b'}}>PENDING</code>.</p>
      </div>

      {loading ? (
        <div style={{ padding: '24px', background: '#111827', borderRadius: '16px', color: '#f9fafb' }}>
          Synchronizing ledger indexes...
        </div>
      ) : pendingDeliveriesData.length === 0 ? (
        <div style={{ padding: '24px', background: '#111827', borderRadius: '16px', color: '#f9fafb' }}>
          Database complete; no system-wide PENDING delivery records found.
        </div>
      ) : (
        <DataTable
          data={pendingDeliveriesData}
          columns={pendingDeliveriesColumns}
          actions={(row: any) => (
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => handleAutoMatch(row.fullId)}
                style={{
                  background: '#2563eb',
                  color: '#ffffff',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: 600
                }}
              >
                <CheckCircle size={18} />
                Auto Match Order
              </button>
            </div>
          )}
        />
      )}
    </div>
  );
}