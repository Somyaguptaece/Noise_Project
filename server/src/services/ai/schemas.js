import { z } from 'zod';

export const EvidenceItemSchema = z.object({
  sourceType: z.enum(['POLICY', 'ORDER', 'CUSTOMER', 'PRODUCT', 'KNOWLEDGE_BASE']),
  sourceId: z.string().min(1),
  sourceTitle: z.string().min(1),
  excerpt: z.string().min(1),
  relevanceScore: z.number().min(0).max(1),
  explanation: z.string().min(1)
});

export const ToolCallRecordSchema = z.object({
  toolName: z.string(),
  arguments: z.record(z.any()),
  result: z.any(),
  isError: z.boolean().default(false),
  timestamp: z.string()
});

export const AIDraftResponseSchema = z.object({
  // 1. Ticket summary
  ticketSummary: z.string().min(5, 'Summary must be at least 5 characters'),

  // 2. Detected category and customer intent
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
  customerIntent: z.string().default('Customer inquiry resolution'),

  // 3. Identified order/device information
  identifiedOrderOrDevice: z.string().nullable().default(null),

  // 4. Missing information
  missingInformation: z.array(z.string()).default([]),

  // 5. Proposed customer-facing reply
  draftReply: z.string().min(15, 'Draft reply must be professional and detailed'),

  // 6. Internal next-action summary
  internalNextAction: z.string().min(5, 'Internal next action guidance is required for agent'),

  // 7. Supporting evidence with source IDs
  evidence: z.array(EvidenceItemSchema).min(1, 'At least one evidence item must ground the draft'),

  // 8. Escalation flag and reason
  escalationFlag: z.boolean().default(false),
  escalationReason: z.string().nullable().default(null),

  // 9. Human-review requirement
  requiresHumanReview: z.boolean().default(true),

  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  recommendedAction: z.string().default('REVIEW_AND_DISPATCH'),
  confidence: z.number().min(0).max(1).default(0.9),
  policyFlags: z.array(z.string()).default([]),
  toolCalls: z.array(z.any()).default([])
});

export const DraftEditSchema = z.object({
  editableReply: z.string().min(10, 'Edited reply must be at least 10 characters'),
  agentName: z.string().optional()
});

export const DraftApprovalSchema = z.object({
  agentName: z.string().min(2, 'Agent name is required')
});

export const DraftRejectionSchema = z.object({
  reason: z.string().min(5, 'Rejection reason must be provided'),
  agentName: z.string().min(2, 'Agent name is required')
});

export const AddMessageSchema = z.object({
  messageText: z.string().min(1, 'Message text is required'),
  senderType: z.enum(['CUSTOMER', 'AGENT', 'SYSTEM']).default('CUSTOMER'),
  senderName: z.string().optional(),
  attachments: z.array(z.object({
    type: z.string(),
    filename: z.string(),
    verifiedReceipt: z.boolean().default(false),
    url: z.string().optional()
  })).default([])
});
