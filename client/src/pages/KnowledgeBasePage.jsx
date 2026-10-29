import React, { useState, useEffect } from 'react';
import { knowledgeService } from '../services/dashboardService.js';
import { Modal } from '../components/common/Modal.jsx';
import { Button } from '../components/common/Button.jsx';
import { Skeleton } from '../components/common/Skeleton.jsx';
import { formatDate } from '../utils/formatters.js';
import {
  BookOpen,
  Search,
  FileText,
  Shield,
  Tag,
  ExternalLink,
  Info
} from 'lucide-react';

export function KnowledgeBasePage() {
  const [documents, setDocuments] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedDoc, setSelectedDoc] = useState(null);

  useEffect(() => {
    setLoading(true);
    knowledgeService.getDocuments({ search, category })
      .then((res) => setDocuments(res.data.documents))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [search, category]);

  const categories = [
    { label: 'All Documents', value: '' },
    { label: 'Returns', value: 'RETURN' },
    { label: 'Refunds', value: 'REFUND' },
    { label: 'Warranty', value: 'WARRANTY' },
    { label: 'Replacements', value: 'REPLACEMENT' },
    { label: 'Shipping & Delivery', value: 'SHIPPING' },
    { label: 'Troubleshooting & Guides', value: 'TROUBLESHOOTING' }
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-rose-600" />
            <span>Policy & Knowledge Grounding Base</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Authoritative policy documents indexed by TF-IDF lexical search and used to ground AI draft recommendations.
          </p>
        </div>

        <div className="px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-center gap-1.5">
          <Shield className="w-4 h-4 text-amber-600 shrink-0" />
          <span>Synthetic Demo Corpus for Evaluation</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search policies by title, stable ID (e.g. POL-WAR-01), or tags..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 shadow-sm"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="text-xs font-medium py-2 px-3 rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 shadow-sm"
          >
            {categories.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Documents Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
      ) : documents.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200/80 p-12 text-center shadow-sm">
          <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <h4 className="text-sm font-semibold text-slate-700">No policy documents found</h4>
          <p className="text-xs text-slate-400 mt-1">Try another search term or reset category filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {documents.map((doc) => (
            <div
              key={doc.id}
              onClick={() => setSelectedDoc(doc)}
              className="group bg-white rounded-xl border border-slate-200/90 p-5 shadow-sm hover:border-rose-400 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200">
                    {doc.id}
                  </span>
                  <span className="text-[10px] font-semibold uppercase text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-100">
                    {doc.category}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-slate-900 group-hover:text-rose-600 transition-colors line-clamp-2 leading-snug">
                  {doc.title}
                </h3>

                <p className="text-xs text-slate-500 line-clamp-3 mt-2 leading-relaxed">
                  {doc.content.replace('DEMO POLICY ONLY - NOT OFFICIAL NOISE POLICY:', '').trim()}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                <span>v{doc.version} • {formatDate(doc.effectiveDate)}</span>
                <span className="text-rose-600 font-semibold group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                  <span>View Policy</span>
                  <ExternalLink className="w-3 h-3" />
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Policy Details Modal */}
      {selectedDoc && (
        <Modal
          isOpen={Boolean(selectedDoc)}
          onClose={() => setSelectedDoc(null)}
          title={`${selectedDoc.id} — ${selectedDoc.title}`}
          maxWidth="max-w-2xl"
          footer={
            <Button variant="secondary" size="sm" onClick={() => setSelectedDoc(null)}>
              Close Policy View
            </Button>
          }
        >
          <div className="space-y-4 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono font-bold text-xs bg-slate-100 text-slate-800 px-2 py-0.5 rounded border">
                ID: {selectedDoc.id}
              </span>
              <span className="bg-rose-50 text-rose-700 font-semibold px-2 py-0.5 rounded border border-rose-200">
                Category: {selectedDoc.category}
              </span>
              <span className="text-slate-500">Version {selectedDoc.version}</span>
              <span className="text-slate-500">• Effective {formatDate(selectedDoc.effectiveDate)}</span>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 leading-relaxed text-[11px]">
              <strong className="block font-semibold">Evaluation Notice:</strong>
              This policy document is synthetic mock policy created specifically for the Noise assignment. It illustrates realistic wearable device return, RMA, and battery troubleshooting rules.
            </div>

            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 text-slate-800 font-sans whitespace-pre-wrap leading-relaxed text-xs">
              {selectedDoc.content}
            </div>

            {selectedDoc.tags && (
              <div className="flex items-center space-x-1.5 text-slate-500 text-[11px] pt-1">
                <Tag className="w-3.5 h-3.5 text-slate-400" />
                <span>Tags: {selectedDoc.tags}</span>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
