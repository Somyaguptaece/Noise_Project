import React, { useState, useEffect } from 'react';
import { analyticsService } from '../services/dashboardService.js';
import { Card } from '../components/common/Card.jsx';
import { Button } from '../components/common/Button.jsx';
import { Skeleton } from '../components/common/Skeleton.jsx';
import {
  BarChart3,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';
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

const COLORS = ['#e11d48', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4', '#64748b'];

export function AnalyticsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = () => {
    setLoading(true);
    analyticsService.getAnalytics()
      .then((res) => setData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (loading || !data) {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
        <Skeleton className="h-80" />
      </div>
    );
  }

  const { draftMetrics, auditEvents, distribution, aiPerformance } = data;

  const approvalPieData = [
    { name: 'Approved Drafts', value: draftMetrics.approvedDrafts, color: '#10b981' },
    { name: 'Rejected Drafts', value: draftMetrics.rejectedDrafts, color: '#ef4444' },
    { name: 'Pending Review', value: draftMetrics.pendingReviewDrafts, color: '#f59e0b' }
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-rose-600" />
            <span>Resolution & AI Quality Analytics</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Persisted resolution metrics, agent approval rates, and factual grounding compliance.
          </p>
        </div>

        <Button variant="secondary" size="sm" icon={RefreshCw} onClick={fetchAnalytics}>
          Refresh Analytics
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total AI Drafts Generated */}
        <Card>
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold uppercase">
            <span>Total Drafts Generated</span>
            <Sparkles className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{draftMetrics.totalDrafts}</div>
          <p className="text-[11px] text-slate-400 mt-0.5">Across all support categories</p>
        </Card>

        {/* Human Approval Rate */}
        <Card>
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold uppercase">
            <span>Agent Approval Rate</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-600 mt-2">
            {draftMetrics.approvalRatePercent}%
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {draftMetrics.approvedDrafts} approved vs {draftMetrics.rejectedDrafts} rejected
          </p>
        </Card>

        {/* Audit Logged Approvals */}
        <Card>
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold uppercase">
            <span>Audit Trail Events</span>
            <ShieldCheck className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-purple-600 mt-2">
            {auditEvents.approvedAuditCount + auditEvents.rejectedAuditCount}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Persistent audit ledger records</p>
        </Card>

        {/* Human Intervention Compliance */}
        <Card>
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold uppercase">
            <span>Human-in-the-Loop SLA</span>
            <Clock className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-blue-600 mt-2">100%</div>
          <p className="text-[11px] text-slate-400 mt-0.5">Zero unapproved customer sends</p>
        </Card>
      </div>

      {/* Visual Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Draft Approval vs Rejection vs Pending Pie */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">AI Draft Outcomes</h3>
            <p className="text-xs text-slate-400">Agent approval, rejection, and review ratios</p>
          </div>

          <div className="h-60 flex items-center justify-center my-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={approvalPieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={75}
                  innerRadius={45}
                  paddingAngle={4}
                >
                  {approvalPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center text-xs pt-3 border-t border-slate-100">
            <div>
              <span className="text-emerald-700 font-bold block">{draftMetrics.approvedDrafts}</span>
              <span className="text-[10px] text-slate-400">Approved</span>
            </div>
            <div>
              <span className="text-rose-700 font-bold block">{draftMetrics.rejectedDrafts}</span>
              <span className="text-[10px] text-slate-400">Rejected</span>
            </div>
            <div>
              <span className="text-amber-700 font-bold block">{draftMetrics.pendingReviewDrafts}</span>
              <span className="text-[10px] text-slate-400">Pending</span>
            </div>
          </div>
        </div>

        {/* Priority Breakdown Bar Chart */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-slate-900">Tickets by Urgency & Priority</h3>
            <p className="text-xs text-slate-400">Workload distribution across support urgency tiers</p>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={distribution.byPriority} margin={{ top: 10, right: 10, left: -20, bottom: 10 }}>
                <XAxis dataKey="priority" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Safety & Factual Compliance Card */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900 mb-3">Model Grounding & Safety Guarantees</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200/70">
            <span className="text-slate-500 font-semibold uppercase text-[10px] block">Average Grounding Confidence</span>
            <span className="font-bold text-emerald-700 text-sm mt-1 block">
              {Math.round(aiPerformance.avgGroundingConfidence * 100)}%
            </span>
            <p className="text-[11px] text-slate-500 mt-1">Based on policy retrieval match scores</p>
          </div>

          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200/70">
            <span className="text-slate-500 font-semibold uppercase text-[10px] block">Hallucination Prevention</span>
            <span className="font-bold text-slate-900 text-sm mt-1 block">
              {aiPerformance.zeroHallucinationStrictGuards}
            </span>
            <p className="text-[11px] text-slate-500 mt-1">Order and warranty dates checked in code</p>
          </div>

          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200/70">
            <span className="text-slate-500 font-semibold uppercase text-[10px] block">Human Agent Sign-off</span>
            <span className="font-bold text-rose-700 text-sm mt-1 block">
              {aiPerformance.humanInterventionRate}
            </span>
            <p className="text-[11px] text-slate-500 mt-1">Outbound sending strictly gated by humans</p>
          </div>
        </div>
      </div>
    </div>
  );
}
