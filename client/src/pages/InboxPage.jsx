import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ticketService } from '../services/ticketService.js';
import { TicketFilterBar } from '../components/inbox/TicketFilterBar.jsx';
import { TicketList } from '../components/inbox/TicketList.jsx';
import { useToast } from '../hooks/useToast.jsx';
import { RefreshCw, Inbox, ShieldCheck } from 'lucide-react';
import { Button } from '../components/common/Button.jsx';

export function InboxPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { showToast } = useToast();

  const [tickets, setTickets] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    status: searchParams.get('status') || 'ALL',
    category: searchParams.get('category') || 'ALL',
    priority: searchParams.get('priority') || 'ALL',
    page: parseInt(searchParams.get('page'), 10) || 1,
    limit: 10
  });

  const fetchTickets = () => {
    setLoading(true);
    const query = {
      search: filters.search,
      status: filters.status,
      category: filters.category,
      priority: filters.priority,
      page: filters.page,
      limit: filters.limit
    };

    ticketService.listTickets(query)
      .then((res) => {
        setTickets(res.data.tickets);
        setPagination(res.data.pagination);
      })
      .catch((err) => {
        showToast(err.message, 'error');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchTickets();

    const newParams = {};
    if (filters.search) newParams.search = filters.search;
    if (filters.status && filters.status !== 'ALL') newParams.status = filters.status;
    if (filters.category && filters.category !== 'ALL') newParams.category = filters.category;
    if (filters.priority && filters.priority !== 'ALL') newParams.priority = filters.priority;
    if (filters.page > 1) newParams.page = filters.page;
    setSearchParams(newParams, { replace: true });
  }, [filters.search, filters.status, filters.category, filters.priority, filters.page]);

  const handleResetFilters = () => {
    setFilters({
      search: '',
      status: 'ALL',
      category: 'ALL',
      priority: 'ALL',
      page: 1,
      limit: 10
    });
  };

  const handlePageChange = (newPage) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-4">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Inbox className="w-5 h-5 text-rose-600" />
            <span>Support Inbox</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time queue of customer support inquiries awaiting AI draft review and human dispatch.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="secondary"
            size="sm"
            icon={RefreshCw}
            loading={loading}
            onClick={fetchTickets}
          >
            Refresh Queue
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <TicketFilterBar
        filters={filters}
        setFilters={setFilters}
        onReset={handleResetFilters}
      />

      {/* Tickets List */}
      <TicketList
        tickets={tickets}
        loading={loading}
        pagination={pagination}
        onPageChange={handlePageChange}
      />
    </div>
  );
}
