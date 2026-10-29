import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Inbox,
  ShoppingBag,
  BookOpen,
  BarChart3,
  Settings,
  Cpu,
  ShieldCheck,
  Headphones
} from 'lucide-react';

export function Sidebar({ mobileOpen, setMobileOpen }) {
  const navItems = [
    { name: 'Overview', to: '/', icon: LayoutDashboard },
    { name: 'Support Inbox', to: '/inbox', icon: Inbox },
    { name: 'Orders & Customers', to: '/orders', icon: ShoppingBag },
    { name: 'Knowledge Base', to: '/knowledge', icon: BookOpen },
    { name: 'Analytics', to: '/analytics', icon: BarChart3 },
    { name: 'Settings', to: '/settings', icon: Settings }
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full bg-navy-950 text-slate-300 border-r border-slate-800 select-none">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-lg bg-rose-600 flex items-center justify-center text-white shadow-md shadow-rose-950">
            <Headphones className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="font-bold text-white text-base tracking-tight">NOISE</span>
              <span className="text-xs px-1.5 py-0.2 bg-rose-500/20 text-rose-400 font-semibold rounded border border-rose-500/30">
                AI
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">Resolve AI Copilot</p>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
          Support Operations
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-rose-600 text-white shadow-sm font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* AI Guardrail Status Card */}
      <div className="p-3 m-3 rounded-lg bg-slate-900 border border-slate-800 text-xs">
        <div className="flex items-center space-x-2 text-rose-400 font-medium mb-1">
          <ShieldCheck className="w-4 h-4" />
          <span>Human-in-the-Loop</span>
        </div>
        <p className="text-[11px] text-slate-400 leading-relaxed">
          Outbound auto-send is disabled. Every AI draft requires human verification and approval.
        </p>
        <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>AI Ready</span>
          </span>
          <span className="font-mono text-[10px] text-slate-400">v1.0.0</span>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 fixed inset-y-0 z-30">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative w-64 max-w-xs flex-1">{sidebarContent}</div>
        </div>
      )}
    </>
  );
}
