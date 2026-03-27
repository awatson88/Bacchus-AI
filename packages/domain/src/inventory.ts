import { z } from "zod";

export const inventoryCategorySchema = z.enum([
  "wine",
  "spirit",
  "liqueur",
  "aperitif",
  "bitters",
  "syrup",
  "mixer"
]);

export const inventoryStatusSchema = z.enum([
  "sealed",
  "open",
  "low",
  "empty",
  "consumed",
  "missing"
]);

export const inventoryEventTypeSchema = z.enum([
  "acquired",
  "opened",
  "poured",
  "consumed",
  "moved",
  "corrected",
  "deleted"
]);

export const intakeJobStatusSchema = z.enum([
  "queued",
  "processing",
  "needs_review",
  "approved",
  "completed",
  "failed"
]);

export const intakeCandidateDecisionSchema = z.enum([
  "pending",
  "approved",
  "rejected"
]);

export const inventoryRecordSchema = z.object({
  id: z.string(),
  category: inventoryCategorySchema,
  producer: z.string(),
  label: z.string(),
  vintage: z.number().int().min(1800).max(2100).optional(),
  country: z.string().optional(),
  region: z.string().optional(),
  style: z.string().optional(),
  grapeVarieties: z.array(z.string()).default([]),
  baseSpirit: z.string().optional(),
  sizeMl: z.number().int().positive().optional(),
  abv: z.number().min(0).max(100).optional(),
  location: z.string(),
  bin: z.string().optional(),
  status: inventoryStatusSchema,
  fillPercent: z.number().int().min(0).max(100).optional(),
  drinkFrom: z.string().datetime().optional(),
  drinkTo: z.string().datetime().optional(),
  qualityScore: z.number().min(0).max(100).optional(),
  confidence: z.number().min(0).max(1).optional(),
  pairingTags: z.array(z.string()).default([]),
  cocktailTags: z.array(z.string()).default([]),
  notes: z.string().optional()
});

export const inventoryQuerySchema = z.object({
  category: inventoryCategorySchema.optional(),
  location: z.string().optional(),
  bin: z.string().optional(),
  status: inventoryStatusSchema.optional()
});

export const intakeImageSchema = z
  .object({
    filename: z.string().min(1),
    contentType: z.string().min(1),
    url: z.string().url().optional(),
    storageKey: z.string().min(1).optional()
  })
  .refine((value) => Boolean(value.url || value.storageKey), {
    message: "Each image needs either a URL or a storage key."
  });

export const openAiFileReferenceSchema = z
  .object({
    name: z.string().min(1).optional(),
    id: z.string().min(1).optional(),
    mime_type: z.string().min(1).optional(),
    mimeType: z.string().min(1).optional(),
    download_link: z.string().url().optional(),
    downloadLink: z.string().url().optional(),
    url: z.string().url().optional()
  })
  .passthrough();

export const openAiFileReferenceInputSchema = z.union([
  z.string().min(1),
  openAiFileReferenceSchema,
  z.record(z.unknown())
]);

export const createIntakeRequestSchema = z.object({
  message: z.string().min(1),
  quantity: z.number().int().positive().max(24).default(1),
  location: z.string().optional(),
  images: z.array(intakeImageSchema).min(1)
});

export const createInventoryItemRequestSchema = z.object({
  category: inventoryCategorySchema,
  producer: z.string().min(1),
  label: z.string().min(1),
  quantity: z.number().int().positive().max(24).default(1),
  vintage: z.number().int().min(1800).max(2100).optional(),
  country: z.string().optional(),
  region: z.string().optional(),
  style: z.string().optional(),
  grapeVarieties: z.array(z.string()).default([]),
  baseSpirit: z.string().optional(),
  sizeMl: z.number().int().positive().optional(),
  abv: z.number().min(0).max(100).optional(),
  location: z.string().min(1),
  bin: z.string().optional(),
  status: inventoryStatusSchema.default("sealed"),
  fillPercent: z.number().int().min(0).max(100).optional(),
  drinkFrom: z.string().datetime().optional(),
  drinkTo: z.string().datetime().optional(),
  qualityScore: z.number().min(0).max(100).optional(),
  confidence: z.number().min(0).max(1).optional(),
  pairingTags: z.array(z.string()).default([]),
  cocktailTags: z.array(z.string()).default([]),
  notes: z.string().optional()
});

export const updateInventoryItemRequestSchema = z.object({
  status: inventoryStatusSchema.optional(),
  fillPercent: z.number().int().min(0).max(100).optional(),
  location: z.string().optional(),
  bin: z.string().optional(),
  notes: z.string().optional(),
  eventType: inventoryEventTypeSchema.optional(),
  quantityDelta: z.number().optional()
});

export const createInventoryEventRequestSchema = z.object({
  eventType: inventoryEventTypeSchema,
  quantityDelta: z.number().optional(),
  notes: z.string().optional(),
  fillPercent: z.number().int().min(0).max(100).optional(),
  status: inventoryStatusSchema.optional(),
  location: z.string().optional(),
  bin: z.string().optional()
});

export const inventoryEventSchema = z.object({
  id: z.number().int().nonnegative(),
  inventoryItemId: z.string(),
  eventType: inventoryEventTypeSchema,
  quantityDelta: z.number().optional(),
  notes: z.string().optional(),
  createdAt: z.string().datetime()
});

export const intakeCandidateSchema = z.object({
  id: z.string().min(1),
  decision: intakeCandidateDecisionSchema.default("pending"),
  approvedItemIds: z.array(z.string()).default([]),
  category: inventoryCategorySchema,
  producer: z.string().optional(),
  label: z.string().optional(),
  vintage: z.number().int().min(1800).max(2100).optional(),
  baseSpirit: z.string().optional(),
  style: z.string().optional(),
  grapeVarieties: z.array(z.string()).default([]),
  location: z.string().optional(),
  bin: z.string().optional(),
  quantity: z.number().int().positive().default(1),
  confidence: z.number().min(0).max(1),
  notes: z.string().optional(),
  reasoning: z.array(z.string()).default([])
});

export const intakeJobSchema = z.object({
  id: z.string(),
  status: intakeJobStatusSchema,
  message: z.string(),
  quantity: z.number().int().positive(),
  location: z.string().optional(),
  images: z.array(intakeImageSchema),
  candidates: z.array(intakeCandidateSchema).default([]),
  approvedItemIds: z.array(z.string()).default([]),
  error: z.string().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});

export const updateIntakeCandidateSchema = intakeCandidateSchema
  .omit({
    id: true,
    approvedItemIds: true
  })
  .partial();

export const approveIntakeJobRequestSchema = z.object({
  candidateIds: z.array(z.string().min(1)).min(1).optional(),
  overridesByCandidateId: z
    .record(createInventoryItemRequestSchema.partial())
    .optional()
});

export const createChatGptIntakeJobRequestSchema = z.object({
  message: z.string().min(1).default("Add these bottles to my inventory."),
  location: z.string().optional(),
  openaiFileIdRefs: z.array(openAiFileReferenceInputSchema).min(1).max(10)
});

export const reviewChatGptIntakeCandidateRequestSchema =
  updateIntakeCandidateSchema.extend({
    candidateId: z.string().min(1)
  });

export const intakeJobQuerySchema = z.object({
  status: intakeJobStatusSchema.optional()
});

export type InventoryCategory = z.infer<typeof inventoryCategorySchema>;
export type InventoryStatus = z.infer<typeof inventoryStatusSchema>;
export type InventoryEventType = z.infer<typeof inventoryEventTypeSchema>;
export type IntakeJobStatus = z.infer<typeof intakeJobStatusSchema>;
export type IntakeCandidateDecision = z.infer<
  typeof intakeCandidateDecisionSchema
>;
export type InventoryRecord = z.infer<typeof inventoryRecordSchema>;
export type InventoryQuery = z.infer<typeof inventoryQuerySchema>;
export type CreateIntakeRequest = z.infer<typeof createIntakeRequestSchema>;
export type CreateInventoryItemRequest = z.infer<
  typeof createInventoryItemRequestSchema
>;
export type UpdateInventoryItemRequest = z.infer<
  typeof updateInventoryItemRequestSchema
>;
export type CreateInventoryEventRequest = z.infer<
  typeof createInventoryEventRequestSchema
>;
export type InventoryEvent = z.infer<typeof inventoryEventSchema>;
export type IntakeCandidate = z.infer<typeof intakeCandidateSchema>;
export type IntakeJob = z.infer<typeof intakeJobSchema>;
export type UpdateIntakeCandidate = z.infer<typeof updateIntakeCandidateSchema>;
export type IntakeJobQuery = z.infer<typeof intakeJobQuerySchema>;
export type ApproveIntakeJobRequest = z.infer<
  typeof approveIntakeJobRequestSchema
>;
export type OpenAiFileReference = z.infer<typeof openAiFileReferenceSchema>;
export type OpenAiFileReferenceInput = z.infer<
  typeof openAiFileReferenceInputSchema
>;
export type CreateChatGptIntakeJobRequest = z.infer<
  typeof createChatGptIntakeJobRequestSchema
>;
export type ReviewChatGptIntakeCandidateRequest = z.infer<
  typeof reviewChatGptIntakeCandidateRequestSchema
>;

export function getInventoryDisplayName(record: InventoryRecord): string {
  return [record.vintage, record.producer, record.label].filter(Boolean).join(" ");
}

export function getDrinkWindowUrgency(
  record: InventoryRecord,
  now = new Date()
): "past_due" | "drink_now" | "hold" | "unknown" {
  if (!record.drinkTo) {
    return "unknown";
  }

  const drinkTo = new Date(record.drinkTo);
  if (Number.isNaN(drinkTo.getTime())) {
    return "unknown";
  }

  if (drinkTo < now) {
    return "past_due";
  }

  const millisecondsUntilDeadline = drinkTo.getTime() - now.getTime();
  const daysUntilDeadline = millisecondsUntilDeadline / (1000 * 60 * 60 * 24);

  return daysUntilDeadline <= 365 ? "drink_now" : "hold";
}
