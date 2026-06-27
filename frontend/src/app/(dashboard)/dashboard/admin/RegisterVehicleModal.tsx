'use client';

import React, { useState } from 'react';
import { X } from 'lucide-react';
// Imported the secure cookie helper action
import { getAuthToken } from '../../../../lib/server-actions/auth.actions';

interface RegisterVehicleModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function RegisterVehicleModal({ isOpen, onClose }: RegisterVehicleModalProps) {
  const [formData, setFormData] = useState({
    licensePlate: '',
    vin: '',
    capacity: '',
    currentLocation: '',
    maintenanceStatus: 'ACTIVE',
    vehicleStatus: 'AVAILABLE',
    lastMaintenanceDate: ''
  });

  const [message, setMessage] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });
    setLoading(true);

    try {
      // 
      const token = await getAuthToken(); 

      const response = await fetch('http://localhost:8080/api/admin/vehicles/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (response.status === 201) {
        setMessage({ type: 'success', text: 'Vehicle registered successfully!' });
        setFormData({
          licensePlate: '',
          vin: '',
          capacity: '',
          currentLocation: '',
          maintenanceStatus: 'ACTIVE',
          vehicleStatus: 'AVAILABLE',
          lastMaintenanceDate: ''
        });
        setTimeout(() => {
          onClose();
          setMessage({ type: '', text: '' });
        }, 1500);
      } else if (response.status === 403) {
        setMessage({ type: 'error', text: 'Access Denied: Admin authorization failed.' });
      } else {
        setMessage({ type: 'error', text: 'Failed to register vehicle. Please check inputs.' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to connect to backend server.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '16px' }}>
      <div style={{ backgroundColor: 'var(--color-surface, #ffffff)', color: 'var(--color-text, #000000)', width: '100%', maxWidth: '500px', borderRadius: '8px', border: '1px solid var(--color-border)', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', overflow: 'hidden' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderBottom: '1px solid var(--color-border)' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 600 }}>Register Fleet Vehicle</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}>
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {message.text && (
            <div style={{ padding: '10px', borderRadius: '4px', fontSize: '14px', fontWeight: 500, backgroundColor: message.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)', color: message.type === 'success' ? '#10b981' : '#ef4444' }}>
              {message.text}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '14px', fontWeight: 500 }}>License Plate *</label>
            <input type="text" name="licensePlate" value={formData.licensePlate} onChange={handleChange} required style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid var(--color-border)', background: 'transparent', color: 'inherit' }} placeholder="e.g. AA-12345" />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '14px', fontWeight: 500 }}>VIN *</label>
            <input type="text" name="vin" value={formData.vin} onChange={handleChange} required style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid var(--color-border)', background: 'transparent', color: 'inherit' }} placeholder="17-character vehicle code" />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '14px', fontWeight: 500 }}>Cargo Capacity</label>
            <input type="text" name="capacity" value={formData.capacity} onChange={handleChange} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid var(--color-border)', background: 'transparent', color: 'inherit' }} placeholder="e.g. 15,000 lbs" />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '14px', fontWeight: 500 }}>Current Location Coordinates</label>
            <input type="text" name="currentLocation" value={formData.currentLocation} onChange={handleChange} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid var(--color-border)', background: 'transparent', color: 'inherit' }} placeholder="e.g. 9.03, 38.74" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '14px', fontWeight: 500 }}>Maintenance</label>
              <select name="maintenanceStatus" value={formData.maintenanceStatus} onChange={handleChange} style={{ padding: '8px', borderRadius: '4px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'inherit' }}>
                <option value="ACTIVE">Active</option>
                <option value="UNDER_MAINTENANCE">Under Maint.</option>
                <option value="DECOMMISSIONED">Decommissioned</option>
              </select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '14px', fontWeight: 500 }}>Vehicle Status</label>
              <select name="vehicleStatus" value={formData.vehicleStatus} onChange={handleChange} style={{ padding: '8px', borderRadius: '4px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'inherit' }}>
                <option value="AVAILABLE">Available</option>
                <option value="ON_DELIVERY">On Delivery</option>
                <option value="OUT_OF_SERVICE">Out of Service</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '14px', fontWeight: 500 }}>Last Maintenance Date</label>
            <input type="date" name="lastMaintenanceDate" value={formData.lastMaintenanceDate} onChange={handleChange} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid var(--color-border)', background: 'transparent', color: 'inherit' }} />
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px', borderTop: '1px solid var(--color-border)', paddingTop: '16px' }}>
            <button type="button" onClick={onClose} style={{ padding: '8px 16px', borderRadius: '4px', border: '1px solid var(--color-border)', background: 'none', cursor: 'pointer', color: 'inherit' }}>
              Cancel
            </button>
            <button type="submit" disabled={loading} style={{ padding: '8px 16px', borderRadius: '4px', border: 'none', backgroundColor: '#2563eb', color: '#ffffff', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer' }}>
              {loading ? 'Registering...' : 'Register Vehicle'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}