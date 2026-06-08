import { z } from "zod";

export const workoutTypeSchema = z.enum([
  "emom",
  "amrap",
  "for_time",
  "strength",
  "interval",
  "chipper",
  "accessory",
  "other"
]);

export const workoutScoreTypeSchema = z.enum([
  "time",
  "reps",
  "rounds",
  "load",
  "distance",
  "calories",
  "notes",
  "none"
]);

export const workoutSourceSystemSchema = z.enum([
  "manual",
  "chatgpt",
  "image_intake",
  "import"
]);

export const workoutImageSchema = z
  .object({
    filename: z.string().min(1),
    contentType: z.string().min(1),
    url: z.string().url().optional(),
    storageKey: z.string().min(1).optional()
  })
  .refine((value) => Boolean(value.url || value.storageKey), {
    message: "Each image needs either a URL or a storage key."
  });

export const workoutMovementSchema = z.object({
  id: z.string().optional(),
  workoutId: z.string().optional(),
  name: z.string().min(1),
  slug: z.string().min(1).optional(),
  category: z.string().optional(),
  equipment: z.string().optional(),
  bodyRegions: z.array(z.string()).default([]),
  loadValue: z.number().positive().optional(),
  loadUnit: z.string().optional(),
  reps: z.number().int().positive().optional(),
  distanceValue: z.number().positive().optional(),
  distanceUnit: z.string().optional(),
  calories: z.number().positive().optional(),
  durationSeconds: z.number().int().positive().optional(),
  orderIndex: z.number().int().nonnegative().optional()
});

export const workoutRecordSchema = z.object({
  id: z.string(),
  performedAt: z.string().datetime(),
  title: z.string().optional(),
  workoutType: workoutTypeSchema.default("other"),
  summary: z.string().min(1),
  rawText: z.string().optional(),
  durationSeconds: z.number().int().positive().optional(),
  scoreType: workoutScoreTypeSchema.default("none"),
  scoreValue: z.number().optional(),
  scoreUnit: z.string().optional(),
  notes: z.string().optional(),
  sourceSystem: workoutSourceSystemSchema.default("manual"),
  movements: z.array(workoutMovementSchema).default([]),
  images: z.array(workoutImageSchema).default([]),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional()
});

export const createWorkoutRequestSchema = workoutRecordSchema
  .omit({
    id: true,
    sourceSystem: true,
    createdAt: true,
    updatedAt: true
  })
  .extend({
    performedAt: z.string().datetime().optional(),
    sourceSystem: workoutSourceSystemSchema.default("manual")
  });

export const workoutQuerySchema = z.object({
  movement: z.string().optional(),
  workoutType: workoutTypeSchema.optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  text: z.string().optional(),
  limit: z.coerce.number().int().positive().max(100).default(25)
});

export const similarWorkoutQuerySchema = z.object({
  workoutId: z.string().optional(),
  query: z.string().optional(),
  movement: z.string().optional(),
  limit: z.coerce.number().int().positive().max(25).default(5)
});

export const workoutMovementSummaryQuerySchema = z.object({
  movement: z.string().min(1).optional(),
  days: z.coerce.number().int().positive().max(3650).optional()
});

export type WorkoutType = z.infer<typeof workoutTypeSchema>;
export type WorkoutScoreType = z.infer<typeof workoutScoreTypeSchema>;
export type WorkoutSourceSystem = z.infer<typeof workoutSourceSystemSchema>;
export type WorkoutImage = z.infer<typeof workoutImageSchema>;
export type WorkoutMovement = z.infer<typeof workoutMovementSchema>;
export type WorkoutRecord = z.infer<typeof workoutRecordSchema>;
export type CreateWorkoutRequest = z.infer<typeof createWorkoutRequestSchema>;
export type WorkoutQuery = z.infer<typeof workoutQuerySchema>;
export type SimilarWorkoutQuery = z.infer<typeof similarWorkoutQuerySchema>;
export type WorkoutMovementSummaryQuery = z.infer<
  typeof workoutMovementSummaryQuerySchema
>;

export function normalizeMovementSlug(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function buildWorkoutSearchText(
  workout: Pick<
    WorkoutRecord,
    "title" | "summary" | "rawText" | "notes" | "workoutType" | "movements"
  >
): string {
  return [
    workout.title,
    workout.workoutType,
    workout.summary,
    workout.rawText,
    workout.notes,
    ...workout.movements.flatMap((movement) => [
      movement.name,
      movement.category,
      movement.equipment,
      ...movement.bodyRegions
    ])
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}
