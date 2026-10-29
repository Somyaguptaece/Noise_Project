import React from 'react';

export function Skeleton({ className = '' }) {
  return (
    <div className={`animate-pulse bg-slate-200/70 rounded-md ${className}`} />
  );
}

export function TicketRowSkeleton() {
  return (
    <div className="p-4 border-b border-slate-100 flex items-center justify-between animate-pulse">
      <div className="flex items-center space-x-3 w-1/3">
        <Skeleton className="w-16 h-5" />
        <div className="space-y-1.5 w-full">
          <Skeleton className="w-3/4 h-4" />
          <Skeleton className="w-1/2 h-3" />
        </div>
      </div>
      <div className="flex items-center space-x-4">
        <Skeleton className="w-24 h-6 rounded-full" />
        <Skeleton className="w-16 h-6 rounded-full" />
        <Skeleton className="w-20 h-6 rounded-full" />
      </div>
    </div>
  );
}
