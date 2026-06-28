'use client';

import React, { useState } from 'react';
import { X } from 'lucide-react';
import { getAuthToken } from '../../../../lib/server-actions/auth.actions';

// 1. Explicitly define the props
interface RegisterVehicleModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// 2. Use the interface in the component definition
export default function RegisterVehicleModal({ isOpen, onClose }: RegisterVehicleModalProps) {
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
      } else {
        setMessage({ type: 'error', text: 'Failed to register vehicle.' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to connect to backend server.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '16px' }}>
      <div style={{ backgroundColor: '#ffffff', color: '#000000', width: '100%', maxWidth: '500px', borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderBottom: '1px solid #e5e7eb' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 600 }}>Register Fleet Vehicle</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {message.text && (
            <div style={{ padding: '10px', borderRadius: '4px', fontSize: '14px', backgroundColor: message.type === 'success' ? '#d1fae5' : '#fee2e2', color: message.type === 'success' ? '#065f46' : '#991b1b' }}>
              {message.text}
            </div>
          )}

          <input type="text" name="licensePlate" placeholder="License Plate" value={formData.licensePlate} onChange={handleChange} required style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px' }} />
          <input type="text" name="vin" placeholder="VIN" value={formData.vin} onChange={handleChange} required style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px' }} />
          <input type="text" name="capacity" placeholder="Capacity" value={formData.capacity} onChange={handleChange} style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px' }} />
          
          <button type="submit" disabled={loading} style={{ padding: '10px', backgroundColor: '#2563eb', color: '#ffffff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
            {loading ? 'Registering...' : 'Register Vehicle'}
          </button>
        </form>
      </div>
    </div>
  );
}