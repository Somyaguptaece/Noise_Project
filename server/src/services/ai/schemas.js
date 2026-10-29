import { z } from 'zod';

export const EvidenceItemSchema = z.object({
  sourceType: z.enum(['POLICY', 'ORDER', 'CUSTOMER', 'PRODUCT', 'KNOWLEDGE_BASE']),
  sourceId: z.string().min(1),
  sourceTitle: z.string().min(1),
  excerpt: z.string().min(1),
  relevanceScore: z.number().min(0).max(1),
  explanation: z.string().min(1)
});

export const AIDraftResponseSchema = z.object({
  ticketSummary: z.string().min(5, 'Summary must be at least 5 characters'),
  category: z.enum([
    'DELIVERY_DELAY',
    'REFUND_REQUEST',
    'RETURN_REQUEST',
    'WARRANTY_CLAIM',
    'DAMAGED_PRODUCT',
    'BATTERY_CHARGING',
    'BLUETOOTH_PAIRING',
    'GENERAL_INQUIRY',
    'MALICIOUS_INJECTION'
  ]),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
  recommendedAction: z.string().min(2),
  draftReply: z.string().min(20, 'Draft reply must be professional and detailed'),
  confidence: z.number().min(0).max(1),
  requiresHumanReview: z.boolean(),
  missingInformation: z.array(z.string()).default([]),
  evidence: z.array(EvidenceItemSchema).min(1, 'At least one evidence item must ground the draft'),
  policyFlags: z.array(z.string()).default([])
});

export const DraftEditSchema = z.object({
  editableReply: z.string().min(10, 'Edited reply must be at least 10 characters')
});

export const DraftApprovalSchema = z.object({
  agentName: z.string().min(2, 'Agent name is required')
});

export const DraftRejectionSchema = z.object({
  reason: z.string().min(5, 'Rejection reason must be provided'),
  agentName: z.string().min(2, 'Agent name is required')
});
