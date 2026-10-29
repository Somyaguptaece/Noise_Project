import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, History, Shield, Sparkles } from 'lucide-react';
import { PanelACustomer } from './PanelACustomer.jsx';
import { PanelBAICopilot } from './PanelBAICopilot.jsx';
import { PanelCEvidence } from './PanelCEvidence.jsx';
import { AuditTrailModal } from './AuditTrailModal.jsx';
import { ApprovalModal, RejectionModal, ResolveModal } from './ConfirmationDialog.jsx';
import { TICKET_STATUSES, TICKET_CATEGORIES } from '../../utils/constants.js';

export function TicketWorkspace({
  ticket,
  loadingAction,
  onGenerateDraft,
  onEditDraft,
  onApproveDraft,
  onRejectDraft,
  onResolveTicket
}) {
  const [activeMobileTab, setActiveMobileTab] = useState('copilot'); // 'customer', 'copilot', 'evidence'
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showResolveModal, setShowResolveModal] = useState(false);

  const latestDraft = ticket.drafts?.[0] || null;
  const statusInfo = TICKET_STATUSES[ticket.status] || TICKET_STATUSES.NEW;
  const categoryInfo = TICKET_CATEGORIES[ticket.category] || TICKET_CATEGORIES.GENERAL_INQUIRY;

  return (
    <div className="flex flex-col h-[calc(100vh-65px)] bg-slate-100">
      {/* Workspace Sub-header */}
      <div className="bg-white border-b border-slate-200/90 px-4 sm:px-6 py-2.5 flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-3 min-w-0">
          <Link
            to="/inbox"
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors shrink-0"
            title="Back to Support Inbox"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>

          <div className="flex items-center space-x-2.5 truncate">
            <span className="font-mono text-xs font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 shrink-0">
              {ticket.ticketNumber}
            </span>
            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border shrink-0 ${categoryInfo.badge}`}>
              {categoryInfo.label}
            </span>
            <h2 className="text-xs sm:text-sm font-semibold text-slate-900 truncate">
              {ticket.subject}
            </h2>
          </div>
        </div>

        <div className="flex items-center space-x-2.5 shrink-0">
          <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${statusInfo.color}`}>
            {statusInfo.label}
          </span>
        </div>
      </div>

      {/* Mobile Tab Selector (Visible on small screens) */}
      <div className="flex md:hidden bg-white border-b border-slate-200 px-2 text-xs font-medium">
        <button
          onClick={() => setActiveMobileTab('customer')}
          className={`flex-1 py-2 text-center border-b-2 ${
            activeMobileTab === 'customer'
              ? 'border-rose-600 text-rose-600 font-bold'
              : 'border-transparent text-slate-500'
          }`}
        >
          Customer & Order
        </button>
        <button
          onClick={() => setActiveMobileTab('copilot')}
          className={`flex-1 py-2 text-center border-b-2 ${
            activeMobileTab === 'copilot'
              ? 'border-rose-600 text-rose-600 font-bold'
              : 'border-transparent text-slate-500'
          }`}
        >
          AI Copilot
        </button>
        <button
          onClick={() => setActiveMobileTab('evidence')}
          className={`flex-1 py-2 text-center border-b-2 ${
            activeMobileTab === 'evidence'
              ? 'border-rose-600 text-rose-600 font-bold'
              : 'border-transparent text-slate-500'
          }`}
        >
          Evidence & Policy
        </button>
      </div>

      {/* Three Panel Grid on Desktop / Tabbed on Mobile */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-12 overflow-hidden">
        {/* Panel A: Customer Profile & Order History (30% desktop -> col-span-3 or 4) */}
        <div
          className={`h-full overflow-hidden md:col-span-3 lg:col-span-4 ${
            activeMobileTab === 'customer' ? 'block' : 'hidden md:block'
          }`}
        >
          <PanelACustomer ticket={ticket} />
        </div>

        {/* Panel B: AI Resolution Copilot (45% desktop -> col-span-5) */}
        <div
          className={`h-full overflow-hidden md:col-span-5 lg:col-span-5 ${
            activeMobileTab === 'copilot' ? 'block' : 'hidden md:block'
          }`}
        >
          <PanelBAICopilot
            ticket={ticket}
            latestDraft={latestDraft}
            loading={loadingAction}
            onGenerateDraft={onGenerateDraft}
            onEditDraft={onEditDraft}
            onOpenApproveModal={() => setShowApproveModal(true)}
            onOpenRejectModal={() => setShowRejectModal(true)}
            onOpenResolveModal={() => setShowResolveModal(true)}
          />
        </div>

        {/* Panel C: Evidence & Policy Grounding (25% desktop -> col-span-4 or 3) */}
        <div
          className={`h-full overflow-hidden md:col-span-4 lg:col-span-3 ${
            activeMobileTab === 'evidence' ? 'block' : 'hidden md:block'
          }`}
        >
          <PanelCEvidence
            ticket={ticket}
            latestDraft={latestDraft}
            onOpenAuditTrail={() => setShowAuditModal(true)}
          />
        </div>
      </div>

      {/* Modal Dialogs */}
      <AuditTrailModal
        isOpen={showAuditModal}
        onClose={() => setShowAuditModal(false)}
        auditLogs={ticket.auditLogs}
        ticketNumber={ticket.ticketNumber}
      />

      <ApprovalModal
        isOpen={showApproveModal}
        onClose={() => setShowApproveModal(false)}
        loading={loadingAction}
        onConfirm={async (agentName) => {
          await onApproveDraft(agentName);
          setShowApproveModal(false);
        }}
      />

      <RejectionModal
        isOpen={showRejectModal}
        onClose={() => setShowRejectModal(false)}
        loading={loadingAction}
        onConfirm={async ({ reason, agentName }) => {
          await onRejectDraft(reason, agentName);
          setShowRejectModal(false);
        }}
      />

      <ResolveModal
        isOpen={showResolveModal}
        onClose={() => setShowResolveModal(false)}
        loading={loadingAction}
        onConfirm={async ({ agentName, notes }) => {
          await onResolveTicket(agentName, notes);
          setShowResolveModal(false);
        }}
      />
    </div>
  );
}
