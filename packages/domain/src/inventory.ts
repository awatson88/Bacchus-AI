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

export const createIntakeRequestSchema = z.object({
  message: z.string().min(1),
  quantity: z.number().int().positive().max(24).default(1),
  location: z.string().optional(),
  images: z.array(intakeImageSchema).min(1)
});

export type InventoryCategory = z.infer<typeof inventoryCategorySchema>;
export type InventoryStatus = z.infer<typeof inventoryStatusSchema>;
export type InventoryRecord = z.infer<typeof inventoryRecordSchema>;
export type InventoryQuery = z.infer<typeof inventoryQuerySchema>;
export type CreateIntakeRequest = z.infer<typeof createIntakeRequestSchema>;

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
