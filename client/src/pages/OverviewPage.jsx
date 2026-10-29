import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Inbox,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Sparkles,
  TrendingUp,
  BarChart2,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';
import { dashboardService } from '../services/dashboardService.js';
import { Card } from '../components/common/Card.jsx';
import { Button } from '../components/common/Button.jsx';
import { Skeleton } from '../components/common/Skeleton.jsx';
import { TICKET_STATUSES, TICKET_CATEGORIES } from '../utils/constants.js';
import { timeAgo } from '../utils/formatters.js';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const STATUS_COLORS = {
  NEW: '#3b82f6',
  PROCESSING: '#f59e0b',
  DRAFT_READY: '#8b5cf6',
  NEEDS_REVIEW: '#f97316',
  APPROVED: '#10b981',
  REJECTED: '#ef4444',
  RESOLVED: '#64748b'
};

export function OverviewPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = () => {
    setLoading(true);
    dashboardService.getStats()
      .then((res) => setData(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading || !data) {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
        </div>
      </div>
    );
  }

  const { metrics, charts, recentTickets } = data;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* 1. Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Noise Resolve AI Dashboard</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 font-semibold">
              Live Operations
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Enterprise customer resolution copilot with deterministic warranty & policy grounding.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Button variant="secondary" size="sm" icon={RefreshCw} onClick={fetchStats}>
            Refresh
          </Button>
          <Link to="/inbox">
            <Button variant="primary" size="sm" icon={Inbox}>
              Open Support Inbox
            </Button>
          </Link>
        </div>
      </div>

      {/* 2. Key Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Tickets */}
        <Card className="hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Support Tickets
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Inbox className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900">{metrics.totalTickets}</div>
            <p className="text-[11px] text-slate-400 mt-0.5">Total ingested tickets across all channels</p>
          </div>
        </Card>

        {/* Open Tickets */}
        <Card className="hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Active In Progress
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900">{metrics.openTickets}</div>
            <p className="text-[11px] text-amber-600 mt-0.5 font-medium">New, Processing & Needs Review</p>
          </div>
        </Card>

        {/* Pending Human Approval */}
        <Card className="hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Pending Human Sign-off
            </span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900">{metrics.pendingApprovalTickets}</div>
            <p className="text-[11px] text-purple-600 mt-0.5 font-medium">AI Draft Ready for Agent Approval</p>
          </div>
        </Card>

        {/* Simulated Resolution Time */}
        <Card className="hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Avg Resolution SLA
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900">{metrics.avgResolutionHours} hrs</div>
            <p className="text-[10px] text-slate-400 mt-0.5 italic">
              * {metrics.avgResolutionNote}
            </p>
          </div>
        </Card>
      </div>

      {/* 3. Operational Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Ticket Volume by Category (Col-span 7) */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Ticket Volume by Issue Category</h3>
              <p className="text-xs text-slate-400">Classified by intent extraction pipeline</p>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 bg-slate-100 text-slate-700 rounded">
              Real DB Aggregations
            </span>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.byCategory} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
                <XAxis
                  dataKey="category"
                  tick={{ fontSize: 10, fill: '#64748b' }}
                  interval={0}
                  angle={-20}
                  textAnchor="end"
                />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
                <Bar dataKey="count" fill="#e11d48" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Ticket Status Distribution (Col-span 5) */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Ticket State Lifecycle</h3>
              <p className="text-xs text-slate-400">Active status distribution across inbox</p>
            </div>
          </div>

          <div className="h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={charts.byStatus}
                  dataKey="count"
                  nameKey="status"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  innerRadius={50}
                  paddingAngle={3}
                >
                  {charts.byStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.status] || '#94a3b8'} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px] pt-3 border-t border-slate-100">
            {charts.byStatus.map((s) => (
              <div key={s.status} className="flex items-center space-x-1.5">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: STATUS_COLORS[s.status] || '#94a3b8' }}
                />
                <span className="text-slate-600 truncate">{s.status}:</span>
                <span className="font-bold text-slate-800">{s.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 4. Recent Support Tickets Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Recent Support Queue</h3>
            <p className="text-xs text-slate-500">Latest customer issues received from seed dataset</p>
          </div>
          <Link
            to="/inbox"
            className="text-xs font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1"
          >
            <span>View All Tickets</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="divide-y divide-slate-100">
          {recentTickets.map((ticket) => {
            const statusInfo = TICKET_STATUSES[ticket.status] || TICKET_STATUSES.NEW;
            const categoryInfo = TICKET_CATEGORIES[ticket.category] || TICKET_CATEGORIES.GENERAL_INQUIRY;

            return (
              <Link
                key={ticket.id}
                to={`/tickets/${ticket.id}`}
                className="p-4 hover:bg-slate-50 flex items-center justify-between transition-colors text-xs"
              >
                <div className="flex items-center space-x-3 min-w-0 pr-4">
                  <span className="font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded shrink-0">
                    {ticket.ticketNumber}
                  </span>
                  <div className="truncate">
                    <p className="font-semibold text-slate-900 truncate">{ticket.subject}</p>
                    <p className="text-slate-400 text-[11px] mt-0.5 truncate">
                      {ticket.customer?.name} • {ticket.product?.name || 'Wearable'} • {timeAgo(ticket.createdAt)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2.5 shrink-0">
                  <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${categoryInfo.badge}`}>
                    {categoryInfo.label}
                  </span>
                  <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${statusInfo.color}`}>
                    {statusInfo.label}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
