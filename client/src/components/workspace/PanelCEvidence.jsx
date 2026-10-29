import React, { useState } from 'react';
import {
  BookOpen,
  FileText,
  AlertTriangle,
  History,
  CheckCircle2,
  ExternalLink,
  ShieldAlert,
  Info
} from 'lucide-react';
import { Button } from '../common/Button.jsx';

export function PanelCEvidence({
  ticket,
  latestDraft,
  onOpenAuditTrail
}) {
  let evidenceList = [];
  let policyFlags = [];
  let missingInfo = [];

  if (latestDraft) {
    try {
      evidenceList = typeof latestDraft.evidenceCitations === 'string'
        ? JSON.parse(latestDraft.evidenceCitations)
        : latestDraft.evidenceCitations || [];
    } catch {
      evidenceList = [];
    }

    try {
      policyFlags = typeof latestDraft.policyFlags === 'string'
        ? JSON.parse(latestDraft.policyFlags)
        : latestDraft.policyFlags || [];
    } catch {
      policyFlags = [];
    }

    try {
      missingInfo = typeof latestDraft.missingInformation === 'string'
        ? JSON.parse(latestDraft.missingInformation)
        : latestDraft.missingInformation || [];
    } catch {
      missingInfo = [];
    }
  }

  return (
    <div className="flex flex-col h-full bg-slate-50 overflow-y-auto">
      {/* 1. Header with Audit Trail Button */}
      <div className="p-4 bg-white border-b border-slate-200/80 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-900 leading-none">
            Evidence & Policy Grounding
          </h3>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Verified Citations & Compliance Guardrails
          </p>
        </div>

        <Button
          variant="secondary"
          size="sm"
          icon={History}
          onClick={onOpenAuditTrail}
        >
          Audit Trail
        </Button>
      </div>

      <div className="flex-1 p-4 space-y-4 overflow-y-auto">
        {/* 2. Policy Warnings / Conflicts / Guardrail Flags */}
        {policyFlags.length > 0 && (
          <div className="rounded-xl border border-amber-300 bg-amber-50 p-3.5 space-y-2">
            <div className="flex items-center space-x-2 text-amber-900 font-bold text-xs">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Policy Evaluation & Guardrail Flags</span>
            </div>
            <ul className="space-y-1.5 pl-5 list-disc text-[11px] text-amber-900 leading-relaxed">
              {policyFlags.map((flag, idx) => (
                <li key={idx}>{flag}</li>
              ))}
            </ul>
          </div>
        )}

        {/* 3. Missing Information Warnings */}
        {missingInfo.length > 0 && (
          <div className="rounded-xl border border-sky-300 bg-sky-50 p-3.5 space-y-2">
            <div className="flex items-center space-x-2 text-sky-900 font-bold text-xs">
              <Info className="w-4 h-4 text-sky-600 shrink-0" />
              <span>Information Required Before Final Approval</span>
            </div>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {missingInfo.map((item, idx) => (
                <span
                  key={idx}
                  className="font-mono text-[10px] font-semibold bg-white text-sky-800 px-2 py-0.5 rounded border border-sky-200 uppercase"
                >
                  {item.replace(/_/g, ' ')}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* 4. Retrieved Evidence Citations */}
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Grounded Citations ({evidenceList.length})
            </span>
            <span className="text-[10px] text-slate-400">TF-IDF & DB Grounded</span>
          </div>

          {evidenceList.length > 0 ? (
            <div className="space-y-3">
              {evidenceList.map((item, idx) => {
                const isPolicy = item.sourceType === 'POLICY';
                const isOrder = item.sourceType === 'ORDER';
                const isKB = item.sourceType === 'KNOWLEDGE_BASE';

                return (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl bg-white border border-slate-200/90 shadow-sm space-y-2"
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200">
                          {item.sourceId}
                        </span>
                        <span className="text-[10px] font-semibold text-slate-500 uppercase">
                          {item.sourceType}
                        </span>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                        {Math.round((item.relevanceScore || 0.9) * 100)}% match
                      </span>
                    </div>

                    {/* Title */}
                    <h5 className="text-xs font-bold text-slate-900 leading-snug">
                      {item.sourceTitle}
                    </h5>

                    {/* Excerpt Citation */}
                    <blockquote className="p-2.5 rounded-lg bg-slate-50 border-l-2 border-rose-500 text-[11px] text-slate-700 italic leading-relaxed">
                      &ldquo;{item.excerpt}&rdquo;
                    </blockquote>

                    {/* Explanation */}
                    {item.explanation && (
                      <p className="text-[11px] text-slate-500 leading-relaxed pt-1 border-t border-slate-100">
                        <strong className="text-slate-700 font-semibold">Grounding: </strong>
                        {item.explanation}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-6 rounded-xl border border-dashed border-slate-200 text-center bg-white">
              <BookOpen className="w-6 h-6 text-slate-300 mx-auto mb-2" />
              <p className="text-xs text-slate-500 font-medium">
                No citations loaded yet.
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Generate an AI resolution draft to fetch relevant policy clauses.
              </p>
            </div>
          )}
        </div>

        {/* 5. Synthetic Policy Disclaimer (Mandated by Section 7) */}
        <div className="p-3 rounded-lg bg-slate-100/70 border border-slate-200 text-[10px] text-slate-500 leading-relaxed">
          <strong className="text-slate-700 block mb-0.5">Note on Demo Policies:</strong>
          These policies are synthetic demo representations for the Noise assignment evaluation. They do not constitute actual legal policies of Nexxbase Technologies (Noise).
        </div>
      </div>
    </div>
  );
}
