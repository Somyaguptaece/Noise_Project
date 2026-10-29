import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Sparkles, AlertTriangle, ShieldAlert } from 'lucide-react';
import { TICKET_STATUSES, TICKET_CATEGORIES, TICKET_PRIORITIES } from '../../utils/constants.js';
import { timeAgo } from '../../utils/formatters.js';

export function TicketItem({ ticket }) {
  const statusInfo = TICKET_STATUSES[ticket.status] || TICKET_STATUSES.NEW;
  const categoryInfo = TICKET_CATEGORIES[ticket.category] || TICKET_CATEGORIES.GENERAL_INQUIRY;
  const priorityInfo = TICKET_PRIORITIES[ticket.priority] || TICKET_PRIORITIES.MEDIUM;

  const isPromptInjection = ticket.category === 'MALICIOUS_INJECTION';

  return (
    <Link
      to={`/tickets/${ticket.id}`}
      className="group block bg-white hover:bg-slate-50/80 border-b border-slate-100 last:border-b-0 transition-colors px-5 py-4"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Left Side: Ticket Number, Subject, Customer */}
        <div className="flex-1 min-w-0 pr-4">
          <div className="flex items-center space-x-2.5 mb-1.5">
            <span className="font-mono text-xs font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
              {ticket.ticketNumber}
            </span>
            <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${categoryInfo.badge}`}>
              {categoryInfo.label}
            </span>
            {isPromptInjection && (
              <span className="flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-800 border border-red-300">
                <ShieldAlert className="w-3 h-3 text-red-600" />
                Security Guardrail
              </span>
            )}
          </div>

          <h3 className="text-sm font-semibold text-slate-900 group-hover:text-rose-600 transition-colors line-clamp-1 mb-1">
            {ticket.subject}
          </h3>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
            <span>Customer: <strong className="font-medium text-slate-700">{ticket.customer?.name}</strong></span>
            {ticket.order && (
              <span>Order: <span className="font-mono text-slate-700">{ticket.order.orderNumber}</span></span>
            )}
            <span>Received: {timeAgo(ticket.createdAt)}</span>
          </div>
        </div>

        {/* Right Side: Badges, AI Status, Arrow */}
        <div className="flex items-center space-x-3 shrink-0 self-start sm:self-center">
          {/* Priority Pill */}
          <span className={`text-[11px] font-medium px-2 py-0.5 rounded ${priorityInfo.badge}`}>
            {priorityInfo.label}
          </span>

          {/* AI Copilot Badge */}
          {ticket.aiStatus === 'COMPLETED' ? (
            <span
              title={`AI Grounded Confidence: ${Math.round((ticket.confidenceScore || 0.9) * 100)}%`}
              className="flex items-center space-x-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200"
            >
              <Sparkles className="w-3 h-3 text-emerald-600" />
              <span>{Math.round((ticket.confidenceScore || 0.9) * 100)}% Match</span>
            </span>
          ) : ticket.aiStatus === 'ANALYZING' ? (
            <span className="flex items-center space-x-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 animate-pulse">
              <Sparkles className="w-3 h-3" />
              <span>Analyzing...</span>
            </span>
          ) : (
            <span className="text-[11px] text-slate-400 font-medium px-2 py-0.5 rounded border border-dashed border-slate-200">
              Draft Pending
            </span>
          )}

          {/* Ticket Status Pill */}
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${statusInfo.color}`}>
            {statusInfo.label}
          </span>

          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700 transition-colors group-hover:translate-x-0.5" />
        </div>
      </div>
    </Link>
  );
}
