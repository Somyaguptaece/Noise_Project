import React, { useState, useEffect } from 'react';
import { Menu, Sparkles, User, Shield, Search } from 'lucide-react';
import { settingsService } from '../../services/dashboardService.js';
import { useNavigate } from 'react-router-dom';

export function Navbar({ setMobileOpen }) {
  const [settings, setSettings] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    settingsService.getSettings()
      .then(res => setSettings(res.data))
      .catch(() => {});
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/inbox?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const isMock = settings?.ai?.isMock ?? true;

  return (
    <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-sm border-b border-slate-200/80 px-4 sm:px-6 py-3 flex items-center justify-between">
      {/* Left: Mobile hamburger & Global quick search */}
      <div className="flex items-center space-x-3 flex-1 max-w-lg">
        <button
          onClick={() => setMobileOpen(true)}
          className="md:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100"
        >
          <Menu className="w-5 h-5" />
        </button>

        <form onSubmit={handleSearchSubmit} className="relative w-full max-w-sm hidden sm:block">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tickets, customers, or order #..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-rose-500 focus:border-rose-500 transition-colors"
          />
        </form>
      </div>

      {/* Right: AI Engine Pill & Agent Avatar */}
      <div className="flex items-center space-x-3 sm:space-x-4">
        {/* AI Provider Status Pill */}
        <div
          title={settings?.ai?.statusMessage || 'Deterministic Mock Mode Active'}
          className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-medium border cursor-default select-none ${
            isMock
              ? 'bg-amber-50 text-amber-800 border-amber-200'
              : 'bg-emerald-50 text-emerald-800 border-emerald-200'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          <span className="hidden sm:inline">AI Engine:</span>
          <span className="font-semibold uppercase tracking-wider text-[11px]">
            {isMock ? 'Mock (Deterministic)' : settings?.ai?.activeProvider}
          </span>
        </div>

        {/* Support Agent Info */}
        <div className="flex items-center space-x-2.5 pl-3 border-l border-slate-200">
          <div className="w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center font-semibold text-xs shadow-sm">
            SK
          </div>
          <div className="hidden lg:block text-left">
            <p className="text-xs font-semibold text-slate-900 leading-tight">Sonia K.</p>
            <p className="text-[10px] text-slate-500 leading-tight">Senior Resolution Specialist</p>
          </div>
        </div>
      </div>
    </header>
  );
}
