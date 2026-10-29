import React, { useState, useEffect } from 'react';
import { settingsService } from '../services/dashboardService.js';
import { Card } from '../components/common/Card.jsx';
import { Button } from '../components/common/Button.jsx';
import { Skeleton } from '../components/common/Skeleton.jsx';
import {
  Settings,
  Sparkles,
  Database,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Cpu,
  RefreshCw,
  Terminal
} from 'lucide-react';

export function SettingsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchSettings = () => {
    setLoading(true);
    settingsService.getSettings()
      .then((res) => setData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  if (loading || !data) {
    return (
      <div className="p-6 max-w-5xl mx-auto space-y-4">
        <Skeleton className="h-28" />
        <Skeleton className="h-48" />
        <Skeleton className="h-48" />
      </div>
    );
  }

  const { app, ai, database, guardrails } = data;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Settings className="w-5 h-5 text-rose-600" />
            <span>Application Settings & AI Provider</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            System configuration, active AI provider adapter status, and compliance guardrails.
          </p>
        </div>

        <Button variant="secondary" size="sm" icon={RefreshCw} onClick={fetchSettings}>
          Refresh Config
        </Button>
      </div>

      {/* AI Provider Configuration */}
      <Card title="AI Provider Adapter Status">
        <div className="space-y-4 text-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200/80">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                <Sparkles className="w-5 h-5 text-amber-700" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h4 className="font-bold text-slate-900 text-sm">
                    {ai.isMock ? 'Deterministic Mock Mode Active' : `Live Provider: ${ai.activeProvider.toUpperCase()}`}
                  </h4>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      ai.isMock
                        ? 'bg-amber-100 text-amber-800 border-amber-300'
                        : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                    }`}
                  >
                    {ai.isMock ? 'ZERO-API-COST DEMO' : 'LIVE API'}
                  </span>
                </div>
                <p className="text-slate-500 text-xs mt-0.5">{ai.statusMessage}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-1">
              <span className="text-slate-400 block text-[10px] font-semibold uppercase">Google Gemini API Key</span>
              <span className="font-mono text-slate-700 font-medium">
                {ai.hasGeminiKey ? '•••••••••••••••• (Configured)' : 'Not Set (Optional)'}
              </span>
            </div>

            <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-1">
              <span className="text-slate-400 block text-[10px] font-semibold uppercase">OpenAI API Key</span>
              <span className="font-mono text-slate-700 font-medium">
                {ai.hasOpenAIKey ? '•••••••••••••••• (Configured)' : 'Not Set (Optional)'}
              </span>
            </div>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 text-slate-600 text-[11px] leading-relaxed">
            <strong className="text-slate-800 block mb-0.5">How to toggle Live AI Models:</strong>
            To run live models instead of deterministic mock mode, edit <code>server/.env</code> and set:
            <pre className="mt-1.5 p-2 bg-slate-900 text-slate-200 rounded font-mono text-[10px] overflow-x-auto">
              AI_PROVIDER=gemini{"\n"}GEMINI_API_KEY=your_key_here
            </pre>
          </div>
        </div>
      </Card>

      {/* Database & Seed Status */}
      <Card title="Database & Prisma ORM State">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <span className="text-slate-400 block text-[10px] font-semibold uppercase">Engine Dialect</span>
            <span className="font-bold text-slate-900 mt-1 block">{database.type}</span>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <span className="text-slate-400 block text-[10px] font-semibold uppercase">Seeded Support Tickets</span>
            <span className="font-bold text-rose-700 mt-1 block">{database.ticketCount} Records</span>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <span className="text-slate-400 block text-[10px] font-semibold uppercase">Seeded Policies & Guides</span>
            <span className="font-bold text-emerald-700 mt-1 block">{database.policyCount} Documents</span>
          </div>
        </div>
      </Card>

      {/* Safety Guardrails */}
      <Card title="Active System Guardrails & Enforcements">
        <div className="space-y-2 text-xs">
          <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-50/60 border border-emerald-200/80">
            <div className="flex items-center space-x-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <div>
                <span className="font-semibold text-emerald-950 block">Mandatory Human Sign-off</span>
                <span className="text-[11px] text-emerald-700">Automated outbound emails to customers are strictly forbidden in code.</span>
              </div>
            </div>
            <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">ENFORCED</span>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-50/60 border border-emerald-200/80">
            <div className="flex items-center space-x-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <div>
                <span className="font-semibold text-emerald-950 block">Prompt Injection Neutralizer</span>
                <span className="text-[11px] text-emerald-700">Customer message instructions cannot override policies or release unapproved funds.</span>
              </div>
            </div>
            <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">ENFORCED</span>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-50/60 border border-emerald-200/80">
            <div className="flex items-center space-x-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <div>
                <span className="font-semibold text-emerald-950 block">Deterministic Date & SLA Calculations</span>
                <span className="text-[11px] text-emerald-700">Warranty and return eligibility are computed using strict calendar timestamps, not model guesses.</span>
              </div>
            </div>
            <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">ENFORCED</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
