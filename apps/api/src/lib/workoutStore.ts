import { type DatabaseSync } from "node:sqlite";
import {
  buildWorkoutSearchText,
  normalizeMovementSlug,
  type CreateWorkoutRequest,
  type SimilarWorkoutQuery,
  type WorkoutImage,
  type WorkoutMovement,
  type WorkoutMovementSummaryQuery,
  type WorkoutQuery,
  type WorkoutRecord
} from "@bartendergpt/domain";

export type MovementSummary = {
  movement: string;
  slug: string;
  workoutCount: number;
  lastPerformedAt: string;
  totalReps?: number;
  totalCalories?: number;
  totalDurationSeconds?: number;
};

export type SimilarWorkoutResult = {
  workout: WorkoutRecord;
  similarityScore: number;
  matchedTerms: string[];
};

export type WorkoutStore = {
  create(request: CreateWorkoutRequest): Promise<WorkoutRecord>;
  list(query?: WorkoutQuery): Promise<WorkoutRecord[]>;
  getById(id: string): Promise<WorkoutRecord | null>;
  findSimilar(query: SimilarWorkoutQuery): Promise<SimilarWorkoutResult[]>;
  summarizeMovements(
    query?: WorkoutMovementSummaryQuery
  ): Promise<MovementSummary[]>;
};

type WorkoutRow = {
  id: string;
  performed_at: string;
  title: string | null;
  workout_type: WorkoutRecord["workoutType"];
  summary: string;
  raw_text: string | null;
  duration_seconds: number | null;
  score_type: WorkoutRecord["scoreType"];
  score_value: number | null;
  score_unit: string | null;
  notes: string | null;
  source_system: WorkoutRecord["sourceSystem"];
  created_at: string;
  updated_at: string;
};

type WorkoutMovementRow = {
  id: string;
  workout_id: string;
  movement_name: string;
  movement_slug: string;
  category: string | null;
  equipment: string | null;
  body_regions_json: string;
  load_value: number | null;
  load_unit: string | null;
  reps: number | null;
  distance_value: number | null;
  distance_unit: string | null;
  calories: number | null;
  duration_seconds: number | null;
  order_index: number;
};

type WorkoutImageRow = {
  filename: string;
  content_type: string;
  url: string | null;
  storage_key: string | null;
};

function parseJsonArray(value: string): string[] {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed)
      ? parsed.filter((entry): entry is string => typeof entry === "string")
      : [];
  } catch {
    return [];
  }
}

function mapMovementRow(row: WorkoutMovementRow): WorkoutMovement {
  return {
    id: row.id,
    workoutId: row.workout_id,
    name: row.movement_name,
    slug: row.movement_slug,
    category: row.category ?? undefined,
    equipment: row.equipment ?? undefined,
    bodyRegions: parseJsonArray(row.body_regions_json),
    loadValue: row.load_value ?? undefined,
    loadUnit: row.load_unit ?? undefined,
    reps: row.reps ?? undefined,
    distanceValue: row.distance_value ?? undefined,
    distanceUnit: row.distance_unit ?? undefined,
    calories: row.calories ?? undefined,
    durationSeconds: row.duration_seconds ?? undefined,
    orderIndex: row.order_index
  };
}

function mapImageRow(row: WorkoutImageRow): WorkoutImage {
  return {
    filename: row.filename,
    contentType: row.content_type,
    url: row.url ?? undefined,
    storageKey: row.storage_key ?? undefined
  };
}

function mapWorkoutRow(
  row: WorkoutRow,
  movements: WorkoutMovement[],
  images: WorkoutImage[]
): WorkoutRecord {
  return {
    id: row.id,
    performedAt: new Date(row.performed_at).toISOString(),
    title: row.title ?? undefined,
    workoutType: row.workout_type,
    summary: row.summary,
    rawText: row.raw_text ?? undefined,
    durationSeconds: row.duration_seconds ?? undefined,
    scoreType: row.score_type,
    scoreValue: row.score_value ?? undefined,
    scoreUnit: row.score_unit ?? undefined,
    notes: row.notes ?? undefined,
    sourceSystem: row.source_system,
    movements,
    images,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString()
  };
}

function matchesWorkoutQuery(workout: WorkoutRecord, query?: WorkoutQuery) {
  if (!query) {
    return true;
  }

  if (query.workoutType && workout.workoutType !== query.workoutType) {
    return false;
  }

  if (query.from && workout.performedAt < query.from) {
    return false;
  }

  if (query.to && workout.performedAt > query.to) {
    return false;
  }

  if (query.movement) {
    const slug = normalizeMovementSlug(query.movement);
    const hasMovement = workout.movements.some(
      (movement) => movement.slug === slug || movement.name.toLowerCase() === query.movement?.toLowerCase()
    );
    if (!hasMovement) {
      return false;
    }
  }

  if (query.text) {
    const searchText = buildWorkoutSearchText(workout);
    if (!searchText.includes(query.text.toLowerCase())) {
      return false;
    }
  }

  return true;
}

function tokenize(value: string): Set<string> {
  const stopWords = new Set([
    "and",
    "the",
    "for",
    "with",
    "from",
    "then",
    "every",
    "minute"
  ]);
  return new Set(
    value
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .map((term) =>
        term.length > 4 && term.endsWith("s") ? term.slice(0, -1) : term
      )
      .filter((term) => term.length >= 3 && !stopWords.has(term))
  );
}

function compareSimilarity(anchor: string, candidate: string) {
  const anchorTerms = tokenize(anchor);
  const candidateTerms = tokenize(candidate);
  const matchedTerms = [...anchorTerms].filter((term) =>
    candidateTerms.has(term)
  );
  const denominator = Math.max(anchorTerms.size, 1);

  return {
    similarityScore: matchedTerms.length / denominator,
    matchedTerms
  };
}

function omitUndefined<T extends Record<string, unknown>>(value: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(value).filter(([, entry]) => entry !== undefined)
  ) as Partial<T>;
}

export class SqliteWorkoutStore implements WorkoutStore {
  private readonly insertWorkoutStatement;
  private readonly insertMovementStatement;
  private readonly insertImageStatement;
  private readonly upsertSearchTextStatement;
  private readonly listWorkoutsStatement;
  private readonly getWorkoutStatement;
  private readonly getMovementsStatement;
  private readonly getImagesStatement;
  private readonly movementSummaryStatement;

  constructor(private readonly database: DatabaseSync) {
    this.insertWorkoutStatement = database.prepare(`
      INSERT INTO workouts (
        id, performed_at, title, workout_type, summary, raw_text,
        duration_seconds, score_type, score_value, score_unit, notes,
        source_system, updated_at
      ) VALUES (
        @id, @performed_at, @title, @workout_type, @summary, @raw_text,
        @duration_seconds, @score_type, @score_value, @score_unit, @notes,
        @source_system, datetime('now')
      )
    `);

    this.insertMovementStatement = database.prepare(`
      INSERT INTO workout_movements (
        id, workout_id, movement_name, movement_slug, category, equipment,
        body_regions_json, load_value, load_unit, reps, distance_value,
        distance_unit, calories, duration_seconds, order_index
      ) VALUES (
        @id, @workout_id, @movement_name, @movement_slug, @category, @equipment,
        @body_regions_json, @load_value, @load_unit, @reps, @distance_value,
        @distance_unit, @calories, @duration_seconds, @order_index
      )
    `);

    this.insertImageStatement = database.prepare(`
      INSERT INTO workout_images (
        workout_id, filename, content_type, url, storage_key
      ) VALUES (
        @workout_id, @filename, @content_type, @url, @storage_key
      )
    `);

    this.upsertSearchTextStatement = database.prepare(`
      INSERT INTO workout_embeddings (
        workout_id, model, searchable_text, embedding_json, updated_at
      ) VALUES (
        @workout_id, @model, @searchable_text, NULL, datetime('now')
      )
      ON CONFLICT(workout_id, model) DO UPDATE SET
        searchable_text = excluded.searchable_text,
        updated_at = datetime('now')
    `);

    this.listWorkoutsStatement = database.prepare(`
      SELECT id, performed_at, title, workout_type, summary, raw_text,
        duration_seconds, score_type, score_value, score_unit, notes,
        source_system, created_at, updated_at
      FROM workouts
      ORDER BY performed_at DESC, created_at DESC
    `);

    this.getWorkoutStatement = database.prepare(`
      SELECT id, performed_at, title, workout_type, summary, raw_text,
        duration_seconds, score_type, score_value, score_unit, notes,
        source_system, created_at, updated_at
      FROM workouts
      WHERE id = ?
      LIMIT 1
    `);

    this.getMovementsStatement = database.prepare(`
      SELECT id, workout_id, movement_name, movement_slug, category, equipment,
        body_regions_json, load_value, load_unit, reps, distance_value,
        distance_unit, calories, duration_seconds, order_index
      FROM workout_movements
      WHERE workout_id = ?
      ORDER BY order_index ASC
    `);

    this.getImagesStatement = database.prepare(`
      SELECT filename, content_type, url, storage_key
      FROM workout_images
      WHERE workout_id = ?
      ORDER BY id ASC
    `);

    this.movementSummaryStatement = database.prepare(`
      SELECT
        movement_name,
        movement_slug,
        COUNT(DISTINCT workouts.id) AS workout_count,
        MAX(workouts.performed_at) AS last_performed_at,
        SUM(COALESCE(reps, 0)) AS total_reps,
        SUM(COALESCE(calories, 0)) AS total_calories,
        SUM(COALESCE(workout_movements.duration_seconds, 0)) AS total_duration_seconds
      FROM workout_movements
      INNER JOIN workouts ON workouts.id = workout_movements.workout_id
      WHERE
        (@movement_slug IS NULL OR movement_slug = @movement_slug) AND
        (@from_date IS NULL OR workouts.performed_at >= @from_date)
      GROUP BY movement_slug
      ORDER BY last_performed_at DESC
    `);
  }

  async create(request: CreateWorkoutRequest): Promise<WorkoutRecord> {
    const id = `workout_${crypto.randomUUID()}`;
    const performedAt = request.performedAt ?? new Date().toISOString();
    const movements = request.movements.map((movement, index) => ({
      ...movement,
      id: `workout_movement_${crypto.randomUUID()}`,
      workoutId: id,
      slug: movement.slug ?? normalizeMovementSlug(movement.name),
      orderIndex: movement.orderIndex ?? index
    }));
    const workout: WorkoutRecord = {
      ...request,
      id,
      performedAt,
      sourceSystem: request.sourceSystem ?? "manual",
      movements,
      images: request.images ?? []
    };

    try {
      this.database.exec("BEGIN");
      this.insertWorkoutStatement.run({
        id,
        performed_at: performedAt,
        title: workout.title ?? null,
        workout_type: workout.workoutType,
        summary: workout.summary,
        raw_text: workout.rawText ?? null,
        duration_seconds: workout.durationSeconds ?? null,
        score_type: workout.scoreType,
        score_value: workout.scoreValue ?? null,
        score_unit: workout.scoreUnit ?? null,
        notes: workout.notes ?? null,
        source_system: workout.sourceSystem
      });

      for (const movement of movements) {
        this.insertMovementStatement.run({
          id: movement.id,
          workout_id: id,
          movement_name: movement.name,
          movement_slug: movement.slug,
          category: movement.category ?? null,
          equipment: movement.equipment ?? null,
          body_regions_json: JSON.stringify(movement.bodyRegions ?? []),
          load_value: movement.loadValue ?? null,
          load_unit: movement.loadUnit ?? null,
          reps: movement.reps ?? null,
          distance_value: movement.distanceValue ?? null,
          distance_unit: movement.distanceUnit ?? null,
          calories: movement.calories ?? null,
          duration_seconds: movement.durationSeconds ?? null,
          order_index: movement.orderIndex ?? 0
        });
      }

      for (const image of workout.images) {
        this.insertImageStatement.run({
          workout_id: id,
          filename: image.filename,
          content_type: image.contentType,
          url: image.url ?? null,
          storage_key: image.storageKey ?? null
        });
      }

      this.upsertSearchTextStatement.run({
        workout_id: id,
        model: "lexical-v1",
        searchable_text: buildWorkoutSearchText(workout)
      });

      this.database.exec("COMMIT");
    } catch (error) {
      this.database.exec("ROLLBACK");
      throw error;
    }

    const created = await this.getById(id);
    if (!created) {
      throw new Error(`Failed to load workout ${id} after creation.`);
    }
    return created;
  }

  async list(query?: WorkoutQuery): Promise<WorkoutRecord[]> {
    return (this.listWorkoutsStatement.all() as WorkoutRow[])
      .map((row) => this.hydrateWorkout(row))
      .filter((workout) => matchesWorkoutQuery(workout, query))
      .slice(0, query?.limit ?? 25);
  }

  async getById(id: string): Promise<WorkoutRecord | null> {
    const row = this.getWorkoutStatement.get(id) as WorkoutRow | undefined;
    return row ? this.hydrateWorkout(row) : null;
  }

  async findSimilar(query: SimilarWorkoutQuery): Promise<SimilarWorkoutResult[]> {
    const anchorWorkout = query.workoutId
      ? await this.getById(query.workoutId)
      : null;
    const anchorText =
      query.query ??
      (anchorWorkout ? buildWorkoutSearchText(anchorWorkout) : undefined);

    if (!anchorText) {
      return [];
    }

    return (await this.list({ limit: 100, movement: query.movement }))
      .filter((workout) => workout.id !== query.workoutId)
      .map((workout) => ({
        workout,
        ...compareSimilarity(anchorText, buildWorkoutSearchText(workout))
      }))
      .filter((result) => result.similarityScore > 0)
      .sort((left, right) => right.similarityScore - left.similarityScore)
      .slice(0, query.limit);
  }

  async summarizeMovements(
    query?: WorkoutMovementSummaryQuery
  ): Promise<MovementSummary[]> {
    const fromDate = query?.days
      ? new Date(Date.now() - query.days * 24 * 60 * 60 * 1000).toISOString()
      : null;
    const rows = this.movementSummaryStatement.all({
      movement_slug: query?.movement
        ? normalizeMovementSlug(query.movement)
        : null,
      from_date: fromDate
    }) as Array<{
      movement_name: string;
      movement_slug: string;
      workout_count: number;
      last_performed_at: string;
      total_reps: number;
      total_calories: number;
      total_duration_seconds: number;
    }>;

    return rows.map((row) =>
      omitUndefined({
        movement: row.movement_name,
        slug: row.movement_slug,
        workoutCount: row.workout_count,
        lastPerformedAt: new Date(row.last_performed_at).toISOString(),
        totalReps: row.total_reps || undefined,
        totalCalories: row.total_calories || undefined,
        totalDurationSeconds: row.total_duration_seconds || undefined
      }) as MovementSummary
    );
  }

  private hydrateWorkout(row: WorkoutRow): WorkoutRecord {
    const movements = (this.getMovementsStatement.all(row.id) as WorkoutMovementRow[]).map(
      mapMovementRow
    );
    const images = (this.getImagesStatement.all(row.id) as WorkoutImageRow[]).map(
      mapImageRow
    );
    return mapWorkoutRow(row, movements, images);
  }
}

export class InMemoryWorkoutStore implements WorkoutStore {
  private readonly workouts: WorkoutRecord[] = [];

  async create(request: CreateWorkoutRequest): Promise<WorkoutRecord> {
    const id = `workout_${crypto.randomUUID()}`;
    const workout: WorkoutRecord = {
      ...request,
      id,
      performedAt: request.performedAt ?? new Date().toISOString(),
      sourceSystem: request.sourceSystem ?? "manual",
      movements: request.movements.map((movement, index) => ({
        ...movement,
        id: `workout_movement_${crypto.randomUUID()}`,
        workoutId: id,
        slug: movement.slug ?? normalizeMovementSlug(movement.name),
        orderIndex: movement.orderIndex ?? index
      })),
      images: request.images ?? [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.workouts.unshift(workout);
    return workout;
  }

  async list(query?: WorkoutQuery): Promise<WorkoutRecord[]> {
    return this.workouts
      .filter((workout) => matchesWorkoutQuery(workout, query))
      .slice(0, query?.limit ?? 25);
  }

  async getById(id: string): Promise<WorkoutRecord | null> {
    return this.workouts.find((workout) => workout.id === id) ?? null;
  }

  async findSimilar(query: SimilarWorkoutQuery): Promise<SimilarWorkoutResult[]> {
    const anchorWorkout = query.workoutId
      ? await this.getById(query.workoutId)
      : null;
    const anchorText =
      query.query ??
      (anchorWorkout ? buildWorkoutSearchText(anchorWorkout) : undefined);
    if (!anchorText) {
      return [];
    }

    return (await this.list({ limit: 100, movement: query.movement }))
      .filter((workout) => workout.id !== query.workoutId)
      .map((workout) => ({
        workout,
        ...compareSimilarity(anchorText, buildWorkoutSearchText(workout))
      }))
      .filter((result) => result.similarityScore > 0)
      .sort((left, right) => right.similarityScore - left.similarityScore)
      .slice(0, query.limit);
  }

  async summarizeMovements(
    query?: WorkoutMovementSummaryQuery
  ): Promise<MovementSummary[]> {
    const fromTime = query?.days
      ? Date.now() - query.days * 24 * 60 * 60 * 1000
      : null;
    const movementSlug = query?.movement
      ? normalizeMovementSlug(query.movement)
      : null;
    const summaries = new Map<string, MovementSummary>();

    for (const workout of this.workouts) {
      if (fromTime && new Date(workout.performedAt).getTime() < fromTime) {
        continue;
      }

      for (const movement of workout.movements) {
        const slug = movement.slug ?? normalizeMovementSlug(movement.name);
        if (movementSlug && slug !== movementSlug) {
          continue;
        }

        const existing = summaries.get(slug);
        summaries.set(slug, omitUndefined({
          movement: movement.name,
          slug,
          workoutCount: (existing?.workoutCount ?? 0) + 1,
          lastPerformedAt:
            !existing || workout.performedAt > existing.lastPerformedAt
              ? workout.performedAt
              : existing.lastPerformedAt,
          totalReps: (existing?.totalReps ?? 0) + (movement.reps ?? 0) || undefined,
          totalCalories:
            (existing?.totalCalories ?? 0) + (movement.calories ?? 0) ||
            undefined,
          totalDurationSeconds:
            (existing?.totalDurationSeconds ?? 0) +
              (movement.durationSeconds ?? 0) || undefined
        }) as MovementSummary);
      }
    }

    return [...summaries.values()].sort((left, right) =>
      right.lastPerformedAt.localeCompare(left.lastPerformedAt)
    );
  }
}
