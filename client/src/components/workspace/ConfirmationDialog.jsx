import React, { useState } from 'react';
import { Modal } from '../common/Modal.jsx';
import { Button } from '../common/Button.jsx';
import { CheckCircle2, AlertTriangle, Check } from 'lucide-react';

export function ApprovalModal({ isOpen, onClose, onConfirm, loading }) {
  const [agentName, setAgentName] = useState('Sonia K. (Senior Specialist)');

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Approve Customer Resolution Draft"
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant="success"
            size="sm"
            icon={CheckCircle2}
            loading={loading}
            onClick={() => onConfirm(agentName)}
          >
            Confirm Approval
          </Button>
        </>
      }
    >
      <div className="space-y-3.5 text-xs text-slate-700">
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-900 leading-relaxed">
          <strong className="block font-semibold mb-0.5">Outbound Safety Confirmation:</strong>
          Upon approval, this draft will be designated <strong>&ldquo;Approved — ready to send&rdquo;</strong>. In accordance with system policy, customer responses are never sent automatically without human verification.
        </div>

        <div>
          <label className="block font-semibold text-slate-800 mb-1">
            Authorizing Agent Identity
          </label>
          <input
            type="text"
            value={agentName}
            onChange={(e) => setAgentName(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          />
        </div>
      </div>
    </Modal>
  );
}

export function RejectionModal({ isOpen, onClose, onConfirm, loading }) {
  const [reason, setReason] = useState('');
  const [agentName, setAgentName] = useState('Sonia K. (Senior Specialist)');
  const [error, setError] = useState('');

  const handleSubmit = () => {
    if (!reason.trim() || reason.trim().length < 5) {
      setError('Please provide a substantive rejection reason (at least 5 characters).');
      return;
    }
    setError('');
    onConfirm({ reason: reason.trim(), agentName });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Reject AI Draft Reply"
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant="danger"
            size="sm"
            loading={loading}
            onClick={handleSubmit}
          >
            Confirm Rejection
          </Button>
        </>
      }
    >
      <div className="space-y-3.5 text-xs text-slate-700">
        <p className="text-slate-600 leading-relaxed">
          Please document why this AI resolution draft is being rejected. This feedback will be recorded in the audit log for model calibration and compliance.
        </p>

        {error && (
          <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 font-medium">
            {error}
          </div>
        )}

        <div>
          <label className="block font-semibold text-slate-800 mb-1">
            Rejection Reason <span className="text-rose-600">*</span>
          </label>
          <textarea
            rows={3}
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              if (error) setError('');
            }}
            placeholder="e.g. Policy condition not met, requires invoice re-check, customer requested warranty replacement instead..."
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 resize-none"
          />
        </div>

        <div>
          <label className="block font-semibold text-slate-800 mb-1">
            Reviewing Agent
          </label>
          <input
            type="text"
            value={agentName}
            onChange={(e) => setAgentName(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
          />
        </div>
      </div>
    </Modal>
  );
}

export function ResolveModal({ isOpen, onClose, onConfirm, loading }) {
  const [notes, setNotes] = useState('');
  const [agentName, setAgentName] = useState('Sonia K. (Senior Specialist)');

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Mark Ticket as Resolved"
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            loading={loading}
            icon={Check}
            onClick={() => onConfirm({ agentName, notes })}
          >
            Mark Resolved
          </Button>
        </>
      }
    >
      <div className="space-y-3.5 text-xs text-slate-700">
        <p className="text-slate-600 leading-relaxed">
          Closing this ticket will transition its status to <strong>RESOLVED</strong> and stamp the resolution timestamp in the analytics dashboard.
        </p>

        <div>
          <label className="block font-semibold text-slate-800 mb-1">
            Resolution Notes (Optional)
          </label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Courier delivered package; RMA replacement dispatched; customer satisfied"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
          />
        </div>
      </div>
    </Modal>
  );
}
