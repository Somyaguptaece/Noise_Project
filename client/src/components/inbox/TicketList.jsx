import React from 'react';
import { TicketItem } from './TicketItem.jsx';
import { TicketRowSkeleton } from '../common/Skeleton.jsx';
import { Inbox, ChevronLeft, ChevronRight } from 'lucide-react';

export function TicketList({
  tickets,
  loading,
  pagination,
  onPageChange
}) {
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
        <TicketRowSkeleton />
        <TicketRowSkeleton />
        <TicketRowSkeleton />
        <TicketRowSkeleton />
        <TicketRowSkeleton />
      </div>
    );
  }

  if (!tickets || tickets.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200/80 p-12 text-center shadow-sm">
        <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center mb-3">
          <Inbox className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-semibold text-slate-800">No support tickets found</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
          No tickets match your active filter criteria. Try adjusting the search query, category, or status filter.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
      {/* Ticket Rows */}
      <div className="divide-y divide-slate-100">
        {tickets.map((ticket) => (
          <TicketItem key={ticket.id} ticket={ticket} />
        ))}
      </div>

      {/* Pagination Footer */}
      {pagination && pagination.totalPages > 1 && (
        <div className="px-5 py-3.5 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
          <div>
            Showing <span className="font-semibold">{tickets.length}</span> of{' '}
            <span className="font-semibold">{pagination.total}</span> tickets
          </div>
          <div className="flex items-center space-x-2">
            <button
              disabled={pagination.page <= 1}
              onClick={() => onPageChange(pagination.page - 1)}
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-medium px-2">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <button
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => onPageChange(pagination.page + 1)}
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
