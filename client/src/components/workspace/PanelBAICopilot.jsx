import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  RefreshCw,
  Edit3,
  CheckCircle,
  XCircle,
  Send,
  AlertCircle,
  Check,
  ShieldAlert,
  Save
} from 'lucide-react';
import { Button } from '../common/Button.jsx';
import { TICKET_CATEGORIES, TICKET_PRIORITIES } from '../../utils/constants.js';

export function PanelBAICopilot({
  ticket,
  latestDraft,
  loading,
  onGenerateDraft,
  onEditDraft,
  onOpenApproveModal,
  onOpenRejectModal,
  onOpenResolveModal
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState('');
  const [saveLoading, setSaveLoading] = useState(false);

  useEffect(() => {
    if (latestDraft) {
      setEditedText(latestDraft.editableReply || latestDraft.draftReply || '');
      setIsEditing(false);
    }
  }, [latestDraft]);

  const handleSaveEdit = async () => {
    setSaveLoading(true);
    try {
      await onEditDraft(editedText);
      setIsEditing(false);
    } finally {
      setSaveLoading(false);
    }
  };

  const categoryInfo = TICKET_CATEGORIES[ticket.category] || TICKET_CATEGORIES.GENERAL_INQUIRY;
  const isSecurityFlagged = ticket.category === 'MALICIOUS_INJECTION';
  const isApproved = ticket.status === 'APPROVED';
  const isResolved = ticket.status === 'RESOLVED';
  const isRejected = ticket.status === 'REJECTED';

  const confidenceScore = latestDraft
    ? Math.round((latestDraft.confidence || 0.9) * 100)
    : ticket.confidenceScore
    ? Math.round(ticket.confidenceScore * 100)
    : null;

  return (
    <div className="flex flex-col h-full bg-white border-r border-slate-200/80 overflow-y-auto">
      {/* 1. Panel Header & Primary Action Bar */}
      <div className="p-4 border-b border-slate-200/80 bg-white">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-200">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 leading-none">
                AI Resolution Copilot
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Evidence-Grounded Recommendation Engine
              </p>
            </div>
          </div>

          {/* Regenerate Action */}
          <Button
            variant="secondary"
            size="sm"
            loading={loading}
            icon={RefreshCw}
            onClick={onGenerateDraft}
          >
            {latestDraft ? 'Regenerate Draft' : 'Generate AI Draft'}
          </Button>
        </div>

        {/* Category & Confidence Summary Banner */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-100 text-xs">
          <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
            <span className="text-slate-400 block text-[10px] font-semibold uppercase">Detected Category</span>
            <span className="font-semibold text-slate-800 text-[11px]">{categoryInfo.label}</span>
          </div>

          <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
            <span className="text-slate-400 block text-[10px] font-semibold uppercase">Urgency</span>
            <span className="font-semibold text-slate-800 text-[11px]">{ticket.priority}</span>
          </div>

          <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
            <span className="text-slate-400 block text-[10px] font-semibold uppercase">Evidence Grounding</span>
            <span className="font-semibold text-emerald-700 text-[11px] flex items-center gap-1">
              {confidenceScore ? `${confidenceScore}% Grounded` : 'Awaiting Draft'}
            </span>
          </div>

          <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
            <span className="text-slate-400 block text-[10px] font-semibold uppercase">Review Mandate</span>
            <span className="font-semibold text-rose-700 text-[11px]">Human Required</span>
          </div>
        </div>
      </div>

      {/* 2. AI Reasoning & Recommended Action */}
      {latestDraft ? (
        <div className="flex-1 p-4 space-y-4 overflow-y-auto">
          {/* Executive Summary & Recommended Action Box */}
          <div className="rounded-xl border border-slate-200/90 bg-slate-50/70 p-3.5 space-y-2">
            <div>
              <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                Ticket Context Summary
              </span>
              <p className="text-xs text-slate-800 font-medium mt-0.5 leading-relaxed">
                {latestDraft.ticketSummary}
              </p>
            </div>

            <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block">
                  Recommended Action
                </span>
                <span className="inline-block mt-0.5 text-xs font-mono font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                  {latestDraft.recommendedAction}
                </span>
              </div>
              <span className="text-[11px] text-slate-400 font-medium">
                Engine: {latestDraft.generatedBy}
              </span>
            </div>
          </div>

          {/* Security Alert if flagged */}
          {isSecurityFlagged && (
            <div className="rounded-xl border border-red-300 bg-red-50 p-3.5 text-xs text-red-900">
              <div className="flex items-center space-x-2 font-bold mb-1 text-red-800">
                <ShieldAlert className="w-4 h-4 text-red-600" />
                <span>Security Filter Activated</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                Untrusted prompt manipulation patterns detected in customer input. Output was neutralized deterministically. No internal instructions or automatic refunds were exposed.
              </p>
            </div>
          )}

          {/* Editable Draft Area */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden flex flex-col">
            <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-slate-800">Professional Draft Reply</span>
                {isEditing ? (
                  <span className="text-[10px] bg-amber-100 text-amber-800 font-semibold px-2 py-0.5 rounded">
                    Editing Mode
                  </span>
                ) : (
                  <span className="text-[10px] bg-slate-200/70 text-slate-600 font-medium px-2 py-0.5 rounded">
                    Human Review Pending
                  </span>
                )}
              </div>

              <div className="flex items-center space-x-2">
                {isEditing ? (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditedText(latestDraft.editableReply || latestDraft.draftReply);
                        setIsEditing(false);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      icon={Save}
                      loading={saveLoading}
                      onClick={handleSaveEdit}
                    >
                      Save Changes
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={Edit3}
                    onClick={() => setIsEditing(true)}
                  >
                    Edit Draft
                  </Button>
                )}
              </div>
            </div>

            <div className="p-3">
              {isEditing ? (
                <textarea
                  rows={10}
                  value={editedText}
                  onChange={(e) => setEditedText(e.target.value)}
                  className="w-full text-xs font-sans text-slate-800 p-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 leading-relaxed resize-y"
                  placeholder="Edit the draft response before approving..."
                />
              ) : (
                <div className="p-3 bg-slate-50/50 rounded-lg border border-slate-100 text-xs text-slate-800 whitespace-pre-wrap leading-relaxed font-sans min-h-[160px]">
                  {latestDraft.editableReply || latestDraft.draftReply}
                </div>
              )}
            </div>

            {/* Approval Status Footer */}
            {isApproved && (
              <div className="px-4 py-2.5 bg-emerald-50 border-t border-emerald-100 flex items-center justify-between text-xs text-emerald-800">
                <span className="flex items-center gap-1.5 font-semibold">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  <span>Approved — ready to send</span>
                </span>
                <span className="text-[11px] text-emerald-600">
                  Approved by {latestDraft.approvedBy || 'Agent'}
                </span>
              </div>
            )}

            {isRejected && (
              <div className="px-4 py-2.5 bg-rose-50 border-t border-rose-100 flex items-center justify-between text-xs text-rose-800">
                <span className="flex items-center gap-1.5 font-semibold">
                  <XCircle className="w-4 h-4 text-rose-600" />
                  <span>Draft Rejected</span>
                </span>
                <span className="text-[11px] text-rose-600 truncate max-w-xs">
                  Reason: {latestDraft.rejectionReason || 'Policy mismatch'}
                </span>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Empty State: Draft not generated yet */
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-50/50">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mb-4 border border-rose-200/80 shadow-sm">
            <Sparkles className="w-7 h-7" />
          </div>
          <h4 className="text-sm font-bold text-slate-900">No Resolution Draft Yet</h4>
          <p className="text-xs text-slate-500 mt-1.5 max-w-sm leading-relaxed">
            Click &ldquo;Generate AI Draft&rdquo; to retrieve policy grounding, evaluate order dates, and create an evidence-backed resolution reply.
          </p>
          <div className="mt-5">
            <Button
              variant="primary"
              size="md"
              loading={loading}
              icon={Sparkles}
              onClick={onGenerateDraft}
            >
              Run AI Resolution Pipeline
            </Button>
          </div>
        </div>
      )}

      {/* 3. Human Approval Workflow Bottom Bar */}
      <div className="p-4 border-t border-slate-200/80 bg-slate-50/90 flex flex-wrap items-center justify-between gap-3">
        <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
          <Check className="w-3.5 h-3.5 text-slate-400" />
          <span>Status: <strong>{ticket.status}</strong></span>
        </div>

        <div className="flex items-center space-x-2.5">
          {latestDraft && !isApproved && !isResolved && (
            <>
              <Button
                variant="secondary"
                size="sm"
                icon={XCircle}
                onClick={onOpenRejectModal}
              >
                Reject Draft
              </Button>
              <Button
                variant="success"
                size="sm"
                icon={CheckCircle}
                onClick={onOpenApproveModal}
              >
                Approve (Ready to Send)
              </Button>
            </>
          )}

          {!isResolved && (
            <Button
              variant="secondary"
              size="sm"
              onClick={onOpenResolveModal}
            >
              Mark Ticket Resolved
            </Button>
          )}

          {isResolved && (
            <span className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-200 text-slate-700 border border-slate-300">
              ✓ Ticket Resolved
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
