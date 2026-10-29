import React from 'react';
import { Modal } from '../common/Modal.jsx';
import { Button } from '../common/Button.jsx';
import { formatDateTime } from '../../utils/formatters.js';
import { ShieldCheck, User, Bot, Clock } from 'lucide-react';

export function AuditTrailModal({ isOpen, onClose, auditLogs, ticketNumber }) {
  const getEventBadge = (eventType) => {
    switch (eventType) {
      case 'DRAFT_GENERATED':
        return <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">DRAFT GENERATED</span>;
      case 'DRAFT_EDITED':
        return <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">DRAFT EDITED</span>;
      case 'DRAFT_APPROVED':
        return <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">DRAFT APPROVED</span>;
      case 'DRAFT_REJECTED':
        return <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200">DRAFT REJECTED</span>;
      case 'TICKET_RESOLVED':
        return <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200">TICKET RESOLVED</span>;
      default:
        return <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">{eventType}</span>;
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Immutable Audit Trail — ${ticketNumber}`}
      maxWidth="max-w-xl"
      footer={
        <Button variant="secondary" size="sm" onClick={onClose}>
          Close Audit Log
        </Button>
      }
    >
      <div className="space-y-4">
        <p className="text-xs text-slate-500 leading-relaxed">
          Every AI proposal, human agent modification, approval, and resolution event is immutably logged in the database for compliance and quality assurance.
        </p>

        {auditLogs && auditLogs.length > 0 ? (
          <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
            {auditLogs.map((log) => {
              const isAI = log.actorType === 'AI';
              let metadata = {};
              try {
                metadata = typeof log.metadataJson === 'string' ? JSON.parse(log.metadataJson) : log.metadataJson || {};
              } catch {
                metadata = {};
              }

              return (
                <div key={log.id} className="relative text-xs">
                  {/* Timeline bullet */}
                  <div
                    className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full flex items-center justify-center border ${
                      isAI
                        ? 'bg-rose-50 border-rose-300 text-rose-600'
                        : 'bg-slate-800 border-slate-900 text-white'
                    }`}
                  >
                    {isAI ? <Bot className="w-3 h-3" /> : <User className="w-3 h-3" />}
                  </div>

                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/80 space-y-1.5">
                    <div className="flex items-center justify-between">
                      {getEventBadge(log.eventType)}
                      <span className="text-[11px] text-slate-400">
                        {formatDateTime(log.timestamp)}
                      </span>
                    </div>

                    <div className="text-slate-800 font-semibold">
                      {log.actorName}{' '}
                      <span className="text-[11px] font-normal text-slate-500">
                        ({log.actorType})
                      </span>
                    </div>

                    {metadata && Object.keys(metadata).length > 0 && (
                      <div className="mt-1 pt-1 border-t border-slate-200/60 text-[11px] text-slate-600 font-mono space-y-0.5">
                        {Object.entries(metadata).map(([k, v]) => (
                          <div key={k}>
                            <span className="text-slate-400">{k}:</span> {String(v)}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-8 text-center text-slate-400 text-xs">
            No audit events recorded for this ticket yet.
          </div>
        )}
      </div>
    </Modal>
  );
}
