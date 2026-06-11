'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CreateDeliveryPage() {
  const router = useRouter();
  
  // State to hold form data
  const [formData, setFormData] = useState({
    pickupLocation: '',
    dropoffLocation: '',
    urgency: 'NORMAL',
    notes: ''
  });

  // Handle typing inside input boxes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle Form Submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Delivery Order Data:', formData);
    
    // For now, let's just alert the data and send them back to the main user dashboard
    alert('Delivery Request Created Successfully! (Mocking database save)');
    router.push('/dashboard/user');
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px', color: '#fff' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '24px' }}>Create New Delivery Order</h1>
      
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* Pickup Input */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={{ fontWeight: 500 }}>Pickup Location</label>
          <input 
            type="text" 
            name="pickupLocation" 
            value={formData.pickupLocation}
            onChange={handleChange}
            placeholder="e.g. Warehouse A or Fuel Terminal 1"
            required
            style={{ padding: '10px', borderRadius: '6px', border: '1px solid #333', backgroundColor: '#111', color: '#fff' }}
          />
        </div>

        {/* Drop-off Input */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={{ fontWeight: 500 }}>Drop-off Location</label>
          <input 
            type="text" 
            name="dropoffLocation" 
            value={formData.dropoffLocation}
            onChange={handleChange}
            placeholder="e.g. Partner Store B or Fuel Station 4"
            required
            style={{ padding: '10px', borderRadius: '6px', border: '1px solid #333', backgroundColor: '#111', color: '#fff' }}
          />
        </div>

        {/* Urgency Dropdown */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={{ fontWeight: 500 }}>Urgency Level</label>
          <select 
            name="urgency" 
            value={formData.urgency}
            onChange={handleChange}
            style={{ padding: '10px', borderRadius: '6px', border: '1px solid #333', backgroundColor: '#111', color: '#fff' }}
          >
            <option value="LOW">Low (Flexible)</option>
            <option value="NORMAL">Normal</option>
            <option value="URGENT">Urgency Level (High)</option>
            <option value="CRITICAL">Critical (Immediate dispatch required)</option>
          </select>
        </div>

        {/* Special Notes */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={{ fontWeight: 500 }}>Special Logistics / Staff Notes</label>
          <textarea 
            name="notes" 
            value={formData.notes}
            onChange={handleChange}
            placeholder="Add specific instructions for the crew or driver..."
            rows={4}
            style={{ padding: '10px', borderRadius: '6px', border: '1px solid #333', backgroundColor: '#111', color: '#fff', resize: 'vertical' }}
          />
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
          <button 
            type="submit" 
            style={{ padding: '12px 24px', borderRadius: '6px', border: 'none', backgroundColor: '#2563eb', color: '#fff', fontWeight: 600, cursor: 'pointer' }}
          >
            Submit Request
          </button>
          <button 
            type="button" 
            onClick={() => router.push('/dashboard/user')}
            style={{ padding: '12px 24px', borderRadius: '6px', border: '1px solid #333', backgroundColor: 'transparent', color: '#ccc', cursor: 'pointer' }}
          >
            Cancel
          </button>
        </div>

      </form>
    </div>
  );
}