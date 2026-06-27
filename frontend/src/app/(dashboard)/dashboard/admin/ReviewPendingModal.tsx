'use client';

import React, { useState } from 'react';
import { X, Check } from 'lucide-react';
import { getAuthToken } from '../../../../lib/server-actions/auth.actions';

interface PendingRegistration {
  userId: string;
  fullName: string;
  email: string;
  phone: number | null;
  vehicleId: string | null;
  licensePlate: string | null;
  vin: string | null;
  capacity: string | null;
  currentLocation: string | null;
}

interface ReviewPendingModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: PendingRegistration | null;
  onApprovalSuccess: () => void;
}

export function ReviewPendingModal({ isOpen, onClose, data, onApprovalSuccess }: ReviewPendingModalProps) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  if (!isOpen || !data) return null;

  const handleApprove = async () => {
    setMessage({ type: '', text: '' });
    setLoading(true);

    try {
      const token = await getAuthToken();

      const response = await fetch(`http://localhost:8080/api/v1/admin/dispatchers/${data.userId}/approve`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Registration and vehicle approved successfully! Notification sent.' });
        setTimeout(() => {
          onApprovalSuccess();
          onClose();
          setMessage({ type: '', text: '' });
        }, 2000);
      } else {
        setMessage({ type: 'error', text: 'Failed to approve. Please try again.' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Connection to backend failed.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '16px' }}>
      <div style={{ backgroundColor: 'var(--color-surface, #ffffff)', color: 'var(--color-text, #000000)', width: '100%', maxWidth: '650px', borderRadius: '8px', border: '1px solid var(--color-border)', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', overflow: 'hidden' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderBottom: '1px solid var(--color-border)' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 600 }}>Verify Registration & Attached Vehicle</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}>
            <X size={20} />
          </button>
        </div>

        {/* Content Body */}
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {message.text && (
            <div style={{ padding: '10px', borderRadius: '4px', fontSize: '14px', fontWeight: 500, backgroundColor: message.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)', color: message.type === 'success' ? '#10b981' : '#ef4444' }}>
              {message.text}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            {/* Driver Section */}
            <div style={{ borderRight: '1px solid var(--color-border)', paddingRight: '16px' }}>
              <h4 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '12px', color: '#2563eb' }}>Driver Profile</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px' }}>
                <p><strong>Name:</strong> {data.fullName || 'N/A'}</p>
                <p><strong>Email:</strong> {data.email}</p>
                <p><strong>Phone:</strong> {data.phone ? `+251${data.phone}` : 'N/A'}</p>
              </div>
            </div>

            {/* Vehicle Section */}
            <div>
              <h4 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '12px', color: '#10b981' }}>Attached Vehicle</h4>
              {data.vehicleId ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px' }}>
                  <p><strong>License Plate:</strong> {data.licensePlate}</p>
                  <p><strong>VIN:</strong> {data.vin}</p>
                  <p><strong>Capacity:</strong> {data.capacity || 'N/A'}</p>
                  <p><strong>Status:</strong> Pending Approval</p>
                </div>
              ) : (
                <p style={{ fontSize: '14px', color: 'var(--color-text-muted)' }}>No vehicle attached to this user.</p>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px', borderTop: '1px solid var(--color-border)', paddingTop: '16px' }}>
            <button type="button" onClick={onClose} disabled={loading} style={{ padding: '8px 16px', borderRadius: '4px', border: '1px solid var(--color-border)', background: 'none', cursor: 'pointer', color: 'inherit' }}>
              Cancel
            </button>
            <button type="button" onClick={handleApprove} disabled={loading} style={{ padding: '8px 16px', borderRadius: '4px', border: 'none', backgroundColor: '#10b981', color: '#ffffff', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Check size={16} />
              {loading ? 'Processing Approval...' : 'Direct Verification & Approval'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}