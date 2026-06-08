'use client';

import React from 'react';
import { useDeliveries } from '../hooks/useDeliveries';

export function DeliveriesDashboardExample() {
  const { data, isLoading, error, isError, refetch } = useDeliveries({ page: 0, size: 10 });

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
          <div className="h-8 w-24 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-50 border border-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="m-6 p-6 border border-red-100 rounded-xl bg-red-50 text-center">
        <p className="text-red-700 font-medium mb-4">
          Error loading deliveries: {error instanceof Error ? error.message : 'Unknown connection error'}
        </p>
        <button
          onClick={() => refetch()}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors shadow-sm"
        >
          Try Connection Again
        </button>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Active Deliveries</h1>
          <p className="text-gray-500 text-sm">Real-time status from backend</p>
        </div>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-2 text-sm font-medium text-blue-600 bg-blue-50 px-4 py-2 rounded-lg hover:bg-blue-100 transition-colors"
        >
          <span className="w-2 h-2 bg-blue-600 rounded-full animate-ping"></span>
          Refresh List
        </button>
      </div>

      <div className="grid gap-4">
        {data?.content.map((delivery) => (
          <div
            key={delivery.publicId}
            className="p-5 bg-white border border-gray-100 rounded-xl flex justify-between items-center shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                📍
              </div>
              <div>
                <p className="font-semibold text-gray-900">{delivery.address}</p>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-gray-400">ID: {delivery.publicId.slice(0, 8)}...</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <StatusBadge status={delivery.status} />
              <div className="text-gray-300">→</div>
            </div>
          </div>
        ))}

        {data?.content.length === 0 && (
          <div className="text-center py-20 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
            <p className="text-gray-400">No active deliveries scheduled.</p>
          </div>
        )}
      </div>

      {data && data.totalPages > 1 && (
        <div className="mt-8 flex justify-center gap-2">
          <p className="text-sm text-gray-400">Showing {data.size} items of {data.totalElements}</p>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    PENDING: 'bg-amber-50 text-amber-700 border-amber-100',
    ASSIGNED: 'bg-blue-50 text-blue-700 border-blue-100',
    IN_TRANSIT: 'bg-indigo-50 text-indigo-700 border-indigo-100',
    COMPLETED: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    CANCELLED: 'bg-rose-50 text-rose-700 border-rose-100',
  };

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${styles[status] || 'bg-gray-50 text-gray-600 border-gray-100'}`}>
      {status}
    </span>
  );
}
