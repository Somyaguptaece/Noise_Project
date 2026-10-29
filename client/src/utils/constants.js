export const TICKET_STATUSES = {
  NEW: { label: 'New', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  PROCESSING: { label: 'Processing', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  DRAFT_READY: { label: 'Draft Ready', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  NEEDS_REVIEW: { label: 'Needs Review', color: 'bg-orange-50 text-orange-700 border-orange-200' },
  APPROVED: { label: 'Approved (Ready to Send)', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  REJECTED: { label: 'Rejected', color: 'bg-rose-50 text-rose-700 border-rose-200' },
  RESOLVED: { label: 'Resolved', color: 'bg-slate-100 text-slate-700 border-slate-300' }
};

export const TICKET_CATEGORIES = {
  DELIVERY_DELAY: { label: 'Delivery Delay', badge: 'bg-sky-50 text-sky-700 border-sky-200' },
  REFUND_REQUEST: { label: 'Refund Request', badge: 'bg-amber-50 text-amber-700 border-amber-200' },
  RETURN_REQUEST: { label: 'Return Request', badge: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  WARRANTY_CLAIM: { label: 'Warranty Claim', badge: 'bg-violet-50 text-violet-700 border-violet-200' },
  DAMAGED_PRODUCT: { label: 'Damaged Product (DOA)', badge: 'bg-rose-50 text-rose-700 border-rose-200' },
  BATTERY_CHARGING: { label: 'Battery & Charging', badge: 'bg-yellow-50 text-yellow-800 border-yellow-200' },
  BLUETOOTH_PAIRING: { label: 'Bluetooth Pairing', badge: 'bg-teal-50 text-teal-700 border-teal-200' },
  GENERAL_INQUIRY: { label: 'General Inquiry', badge: 'bg-slate-100 text-slate-700 border-slate-200' },
  MALICIOUS_INJECTION: { label: 'Security Flagged', badge: 'bg-red-100 text-red-800 border-red-300' }
};

export const TICKET_PRIORITIES = {
  LOW: { label: 'Low', badge: 'bg-slate-100 text-slate-600' },
  MEDIUM: { label: 'Medium', badge: 'bg-blue-50 text-blue-600' },
  HIGH: { label: 'High', badge: 'bg-amber-50 text-amber-700' },
  URGENT: { label: 'Urgent', badge: 'bg-rose-50 text-rose-700' }
};

export const AI_STATUSES = {
  PENDING: { label: 'AI Pending', badge: 'bg-slate-100 text-slate-600' },
  ANALYZING: { label: 'Analyzing...', badge: 'bg-amber-100 text-amber-800 animate-pulse' },
  COMPLETED: { label: 'AI Ready', badge: 'bg-emerald-100 text-emerald-800' },
  FAILED: { label: 'AI Failed', badge: 'bg-red-100 text-red-800' }
};
