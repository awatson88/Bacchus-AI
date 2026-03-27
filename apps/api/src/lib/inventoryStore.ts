import { type DatabaseSync } from "node:sqlite";
import {
  initializeDatabase,
  openDatabase,
  resolveDatabasePath
} from "@bartendergpt/db";
import type {
  ApproveIntakeJobRequest,
  CreateIntakeRequest,
  CreateInventoryEventRequest,
  CreateInventoryItemRequest,
  IntakeCandidate,
  IntakeJobQuery,
  IntakeJob,
  IntakeJobStatus,
  InventoryEvent,
  InventoryEventType,
  InventoryQuery,
  InventoryRecord,
  UpdateIntakeCandidate,
  UpdateInventoryItemRequest
} from "@bartendergpt/domain";
import { createInventoryItemRequestSchema } from "@bartendergpt/domain";
import { demoInventory } from "../data/demoInventory.js";
import type { BartenderGptAppContext } from "./appContext.js";
import { extractIntakeCandidates } from "./intakeExtraction.js";

export type StoreMode = "memory" | "sqlite";
export type InventorySourceSystem =
  | "manual"
  | "cellartracker_import"
  | "image_intake";

export type InventoryStore = {
  list(query?: InventoryQuery): Promise<InventoryRecord[]>;
  getById(id: string): Promise<InventoryRecord | null>;
  createItems(
    request: CreateInventoryItemRequest,
    sourceSystem?: InventorySourceSystem
  ): Promise<InventoryRecord[]>;
  updateItem(
    id: string,
    request: UpdateInventoryItemRequest
  ): Promise<InventoryRecord | null>;
  createEvent(
    id: string,
    request: CreateInventoryEventRequest
  ): Promise<InventoryRecord | null>;
  listEvents(id: string): Promise<InventoryEvent[]>;
  importRecords(
    records: InventoryRecord[],
    sourceSystem: InventorySourceSystem
  ): Promise<InventoryRecord[]>;
  recordImportRun(
    source: string,
    totalRows: number,
    expandedBottleCount: number,
    warnings: string[]
  ): Promise<void>;
  createIntakeJob(request: CreateIntakeRequest): Promise<IntakeJob>;
  listIntakeJobs(query?: IntakeJobQuery): Promise<IntakeJob[]>;
  getIntakeJob(id: string): Promise<IntakeJob | null>;
  updateIntakeJobCandidate(
    id: string,
    candidateId: string,
    patch: UpdateIntakeCandidate
  ): Promise<IntakeJob | null>;
  reprocessIntakeJob(id: string): Promise<IntakeJob | null>;
  approveIntakeJob(
    id: string,
    request?: ApproveIntakeJobRequest
  ): Promise<{ job: IntakeJob; created: InventoryRecord[] } | null>;
  dispose(): Promise<void>;
};

type InventoryItemRow = {
  id: string;
  category: InventoryRecord["category"];
  producer: string;
  label: string;
  vintage: number | null;
  country: string | null;
  region: string | null;
  style: string | null;
  grape_varieties: string;
  base_spirit: string | null;
  size_ml: number | null;
  abv: number | null;
  location: string;
  bin: string | null;
  status: InventoryRecord["status"];
  fill_percent: number | null;
  drink_from: string | null;
  drink_to: string | null;
  quality_score: number | null;
  estimated_price_usd: number | null;
  price_tier: InventoryRecord["priceTier"] | null;
  confidence: number | null;
  pairing_tags: string;
  cocktail_tags: string;
  notes: string | null;
};

type InventoryEventRow = {
  id: number;
  inventory_item_id: string;
  event_type: InventoryEventType;
  quantity_delta: number | null;
  notes: string | null;
  created_at: string;
};

type IntakeJobRow = {
  id: string;
  status: IntakeJobStatus;
  message: string;
  quantity: number;
  location: string | null;
  candidate_json: string | null;
  candidates_json: string | null;
  approved_item_ids_json: string;
  error: string | null;
  created_at: string;
  updated_at: string;
};

type IntakeImageRow = {
  filename: string;
  content_type: string;
  url: string | null;
  storage_key: string | null;
};

function matchesQuery(item: InventoryRecord, query?: InventoryQuery): boolean {
  if (!query) {
    return true;
  }

  if (query.category && item.category !== query.category) {
    return false;
  }

  if (query.location && item.location !== query.location) {
    return false;
  }

  if (query.bin && item.bin !== query.bin) {
    return false;
  }

  if (query.status && item.status !== query.status) {
    return false;
  }

  return true;
}

function parseJsonArray(value: string): string[] {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed)
      ? parsed.filter((entry) => typeof entry === "string")
      : [];
  } catch {
    return [];
  }
}

function mapRowToInventoryRecord(row: InventoryItemRow): InventoryRecord {
  return {
    id: row.id,
    category: row.category,
    producer: row.producer,
    label: row.label,
    vintage: row.vintage ?? undefined,
    country: row.country ?? undefined,
    region: row.region ?? undefined,
    style: row.style ?? undefined,
    grapeVarieties: parseJsonArray(row.grape_varieties),
    baseSpirit: row.base_spirit ?? undefined,
    sizeMl: row.size_ml ?? undefined,
    abv: row.abv ?? undefined,
    location: row.location,
    bin: row.bin ?? undefined,
    status: row.status,
    fillPercent: row.fill_percent ?? undefined,
    drinkFrom: row.drink_from ?? undefined,
    drinkTo: row.drink_to ?? undefined,
    qualityScore: row.quality_score ?? undefined,
    estimatedPriceUsd: row.estimated_price_usd ?? undefined,
    priceTier: row.price_tier ?? undefined,
    confidence: row.confidence ?? undefined,
    pairingTags: parseJsonArray(row.pairing_tags),
    cocktailTags: parseJsonArray(row.cocktail_tags),
    notes: row.notes ?? undefined
  };
}

function mapEventRow(row: InventoryEventRow): InventoryEvent {
  return {
    id: row.id,
    inventoryItemId: row.inventory_item_id,
    eventType: row.event_type,
    quantityDelta: row.quantity_delta ?? undefined,
    notes: row.notes ?? undefined,
    createdAt: new Date(row.created_at).toISOString()
  };
}

function mapInventoryRecordToDatabaseParams(item: InventoryRecord) {
  return {
    id: item.id,
    category: item.category,
    producer: item.producer,
    label: item.label,
    vintage: item.vintage ?? null,
    country: item.country ?? null,
    region: item.region ?? null,
    style: item.style ?? null,
    grape_varieties: JSON.stringify(item.grapeVarieties),
    base_spirit: item.baseSpirit ?? null,
    size_ml: item.sizeMl ?? null,
    abv: item.abv ?? null,
    location: item.location,
    bin: item.bin ?? null,
    status: item.status,
    fill_percent: item.fillPercent ?? null,
    drink_from: item.drinkFrom ?? null,
    drink_to: item.drinkTo ?? null,
    quality_score: item.qualityScore ?? null,
    estimated_price_usd: item.estimatedPriceUsd ?? null,
    price_tier: item.priceTier ?? null,
    confidence: item.confidence ?? null,
    pairing_tags: JSON.stringify(item.pairingTags),
    cocktail_tags: JSON.stringify(item.cocktailTags),
    notes: item.notes ?? null
  };
}

function mapInventoryRecordToUpdateParams(item: InventoryRecord) {
  return {
    id: item.id,
    producer: item.producer,
    label: item.label,
    vintage: item.vintage ?? null,
    country: item.country ?? null,
    region: item.region ?? null,
    style: item.style ?? null,
    grape_varieties: JSON.stringify(item.grapeVarieties),
    base_spirit: item.baseSpirit ?? null,
    size_ml: item.sizeMl ?? null,
    abv: item.abv ?? null,
    location: item.location,
    bin: item.bin ?? null,
    status: item.status,
    fill_percent: item.fillPercent ?? null,
    drink_from: item.drinkFrom ?? null,
    drink_to: item.drinkTo ?? null,
    quality_score: item.qualityScore ?? null,
    estimated_price_usd: item.estimatedPriceUsd ?? null,
    price_tier: item.priceTier ?? null,
    confidence: item.confidence ?? null,
    pairing_tags: JSON.stringify(item.pairingTags),
    cocktail_tags: JSON.stringify(item.cocktailTags),
    notes: item.notes ?? null
  };
}

function parseCandidates(
  value: string | null,
  legacyValue?: string | null
): IntakeCandidate[] {
  const parsed = parseJsonValue(value);
  if (Array.isArray(parsed)) {
    return parsed
      .map((candidate, index) => normalizeIntakeCandidate(candidate, index))
      .filter((candidate): candidate is IntakeCandidate => Boolean(candidate));
  }

  const legacyCandidate = parseJsonValue(legacyValue);
  const normalizedLegacy = normalizeIntakeCandidate(legacyCandidate, 0);
  return normalizedLegacy ? [normalizedLegacy] : [];
}

function parseJsonValue(value: string | null | undefined): unknown {
  if (!value) {
    return undefined;
  }

  try {
    return JSON.parse(value);
  } catch {
    return undefined;
  }
}

function isIntakeCandidate(value: unknown): value is IntakeCandidate {
  return Boolean(
    value &&
      typeof value === "object" &&
      "category" in value &&
      "confidence" in value
  );
}

function normalizeIntakeCandidate(
  value: unknown,
  index: number
): IntakeCandidate | undefined {
  if (!isIntakeCandidate(value)) {
    return undefined;
  }

  const candidate = value as Partial<IntakeCandidate>;
  return {
    id:
      typeof candidate.id === "string" && candidate.id.length > 0
        ? candidate.id
        : `candidate_${index + 1}`,
    decision:
      candidate.decision === "approved" || candidate.decision === "rejected"
        ? candidate.decision
        : "pending",
    approvedItemIds: Array.isArray(candidate.approvedItemIds)
      ? candidate.approvedItemIds.filter((entry): entry is string => typeof entry === "string")
      : [],
    category: candidate.category as IntakeCandidate["category"],
    producer: candidate.producer,
    label: candidate.label,
    vintage: candidate.vintage,
    country: candidate.country,
    region: candidate.region,
    baseSpirit: candidate.baseSpirit,
    style: candidate.style,
    grapeVarieties: Array.isArray(candidate.grapeVarieties)
      ? candidate.grapeVarieties.filter(
          (entry): entry is string => typeof entry === "string"
        )
      : [],
    drinkFrom: candidate.drinkFrom,
    drinkTo: candidate.drinkTo,
    qualityScore: candidate.qualityScore,
    estimatedPriceUsd: candidate.estimatedPriceUsd,
    priceTier: candidate.priceTier,
    location: candidate.location,
    bin: candidate.bin,
    quantity:
      typeof candidate.quantity === "number" && candidate.quantity > 0
        ? candidate.quantity
        : 1,
    confidence:
      typeof candidate.confidence === "number" ? candidate.confidence : 0.5,
    notes: candidate.notes,
    reasoning: Array.isArray(candidate.reasoning)
      ? candidate.reasoning.filter(
          (entry): entry is string => typeof entry === "string"
        )
      : []
  };
}

function omitUndefined<T extends Record<string, unknown>>(value: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(value).filter(([, entry]) => entry !== undefined)
  ) as Partial<T>;
}

function mapJobRowToIntakeJob(
  row: IntakeJobRow,
  images: IntakeImageRow[]
): IntakeJob {
  const candidates = parseCandidates(row.candidates_json, row.candidate_json);

  return {
    id: row.id,
    status: row.status,
    message: row.message,
    quantity: row.quantity,
    location: row.location ?? undefined,
    images: images.map((image) => ({
      filename: image.filename,
      contentType: image.content_type,
      url: image.url ?? undefined,
      storageKey: image.storage_key ?? undefined
    })),
    candidates,
    approvedItemIds: parseJsonArray(row.approved_item_ids_json),
    error: row.error ?? undefined,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString()
  };
}

class InMemoryInventoryStore implements InventoryStore {
  private readonly items: InventoryRecord[];
  private readonly events: InventoryEvent[];
  private readonly jobs: IntakeJob[];

  constructor(seedItems: InventoryRecord[]) {
    this.items = [...seedItems];
    this.events = seedItems.map((item, index) => ({
      id: index + 1,
      inventoryItemId: item.id,
      eventType: "acquired",
      quantityDelta: 1,
      notes: "seed",
      createdAt: new Date().toISOString()
    }));
    this.jobs = [];
  }

  async list(query?: InventoryQuery): Promise<InventoryRecord[]> {
    return this.items.filter((item) => matchesQuery(item, query));
  }

  async getById(id: string): Promise<InventoryRecord | null> {
    return this.items.find((item) => item.id === id) ?? null;
  }

  async createItems(
    request: CreateInventoryItemRequest,
    sourceSystem: InventorySourceSystem = "manual"
  ): Promise<InventoryRecord[]> {
    const records = Array.from({ length: request.quantity }, () => ({
      ...request,
      id: `inventory_${crypto.randomUUID()}`
    }));
    await this.importRecords(records, sourceSystem);
    return records;
  }

  async updateItem(
    id: string,
    request: UpdateInventoryItemRequest
  ): Promise<InventoryRecord | null> {
    const item = this.items.find((entry) => entry.id === id);
    if (!item) {
      return null;
    }

    if (request.producer !== undefined) {
      item.producer = request.producer;
    }
    if (request.label !== undefined) {
      item.label = request.label;
    }
    if (request.vintage !== undefined) {
      item.vintage = request.vintage;
    }
    if (request.country !== undefined) {
      item.country = request.country;
    }
    if (request.region !== undefined) {
      item.region = request.region;
    }
    if (request.style !== undefined) {
      item.style = request.style;
    }
    if (request.grapeVarieties !== undefined) {
      item.grapeVarieties = request.grapeVarieties;
    }
    if (request.baseSpirit !== undefined) {
      item.baseSpirit = request.baseSpirit;
    }
    if (request.sizeMl !== undefined) {
      item.sizeMl = request.sizeMl;
    }
    if (request.abv !== undefined) {
      item.abv = request.abv;
    }
    if (request.status !== undefined) {
      item.status = request.status;
    }
    if (request.fillPercent !== undefined) {
      item.fillPercent = request.fillPercent;
    }
    if (request.location !== undefined) {
      item.location = request.location;
    }
    if (request.bin !== undefined) {
      item.bin = request.bin;
    }
    if (request.drinkFrom !== undefined) {
      item.drinkFrom = request.drinkFrom;
    }
    if (request.drinkTo !== undefined) {
      item.drinkTo = request.drinkTo;
    }
    if (request.qualityScore !== undefined) {
      item.qualityScore = request.qualityScore;
    }
    if (request.estimatedPriceUsd !== undefined) {
      item.estimatedPriceUsd = request.estimatedPriceUsd;
    }
    if (request.priceTier !== undefined) {
      item.priceTier = request.priceTier;
    }
    if (request.confidence !== undefined) {
      item.confidence = request.confidence;
    }
    if (request.pairingTags !== undefined) {
      item.pairingTags = request.pairingTags;
    }
    if (request.cocktailTags !== undefined) {
      item.cocktailTags = request.cocktailTags;
    }
    if (request.notes !== undefined) {
      item.notes = request.notes;
    }

    const eventType =
      request.eventType ??
      (request.location !== undefined || request.bin !== undefined
        ? "moved"
        : "corrected");
    this.events.push({
      id: this.events.length + 1,
      inventoryItemId: id,
      eventType,
      quantityDelta: request.quantityDelta,
      notes: request.notes,
      createdAt: new Date().toISOString()
    });

    return item;
  }

  async createEvent(
    id: string,
    request: CreateInventoryEventRequest
  ): Promise<InventoryRecord | null> {
    const item = this.items.find((entry) => entry.id === id);
    if (!item) {
      return null;
    }

    applyEventToItem(item, request);
    this.events.push({
      id: this.events.length + 1,
      inventoryItemId: id,
      eventType: request.eventType,
      quantityDelta: request.quantityDelta,
      notes: request.notes,
      createdAt: new Date().toISOString()
    });

    return item;
  }

  async listEvents(id: string): Promise<InventoryEvent[]> {
    return this.events.filter((event) => event.inventoryItemId === id);
  }

  async importRecords(
    records: InventoryRecord[],
    sourceSystem: InventorySourceSystem
  ): Promise<InventoryRecord[]> {
    this.items.push(...records);
    this.events.push(
      ...records.map((record) => ({
        id: this.events.length + 1 + Math.floor(Math.random() * 100000),
        inventoryItemId: record.id,
        eventType: "acquired" as const,
        quantityDelta: 1,
        notes: sourceSystem,
        createdAt: new Date().toISOString()
      }))
    );
    return records;
  }

  async recordImportRun(): Promise<void> {
    return Promise.resolve();
  }

  async createIntakeJob(request: CreateIntakeRequest): Promise<IntakeJob> {
    const candidates = await extractIntakeCandidates(request);
    const now = new Date().toISOString();
    const job: IntakeJob = {
      id: `intake_${crypto.randomUUID()}`,
      status: candidates.length > 0 ? "needs_review" : "queued",
      message: request.message,
      quantity: request.quantity,
      location: request.location,
      images: request.images,
      candidates,
      approvedItemIds: [],
      createdAt: now,
      updatedAt: now
    };

    this.jobs.unshift(job);
    return job;
  }

  async listIntakeJobs(query?: IntakeJobQuery): Promise<IntakeJob[]> {
    if (!query?.status) {
      return this.jobs;
    }

    return this.jobs.filter((job) => job.status === query.status);
  }

  async getIntakeJob(id: string): Promise<IntakeJob | null> {
    return this.jobs.find((job) => job.id === id) ?? null;
  }

  async updateIntakeJobCandidate(
    id: string,
    candidateId: string,
    patch: UpdateIntakeCandidate
  ): Promise<IntakeJob | null> {
    const job = this.jobs.find((entry) => entry.id === id);
    if (!job) {
      return null;
    }

    const candidate = job.candidates.find((entry) => entry.id === candidateId);
    if (!candidate) {
      return null;
    }

    const nextCandidate: IntakeCandidate = {
      ...candidate,
      ...omitUndefined(patch),
      id: candidate.id,
      decision: patch.decision ?? candidate.decision,
      approvedItemIds: candidate.approvedItemIds,
      category: patch.category ?? candidate.category,
      quantity: patch.quantity ?? candidate.quantity,
      confidence: patch.confidence ?? candidate.confidence,
      reasoning: patch.reasoning ?? candidate.reasoning ?? [],
      grapeVarieties: patch.grapeVarieties ?? candidate.grapeVarieties ?? []
    };

    job.candidates = job.candidates.map((entry) =>
      entry.id === candidateId ? nextCandidate : entry
    );
    job.status = getReviewJobStatus(job.candidates);
    job.updatedAt = new Date().toISOString();
    return job;
  }

  async reprocessIntakeJob(id: string): Promise<IntakeJob | null> {
    const job = this.jobs.find((entry) => entry.id === id);
    if (!job) {
      return null;
    }

    job.candidates = await extractIntakeCandidates({
      message: job.message,
      quantity: job.quantity,
      location: job.location,
      images: job.images
    });
    job.approvedItemIds = [];
    job.status = job.candidates.length > 0 ? "needs_review" : "queued";
    job.updatedAt = new Date().toISOString();
    return job;
  }

  async approveIntakeJob(
    id: string,
    request?: ApproveIntakeJobRequest
  ): Promise<{ job: IntakeJob; created: InventoryRecord[] } | null> {
    const job = this.jobs.find((entry) => entry.id === id);
    if (!job) {
      return null;
    }

    const candidateIds =
      request?.candidateIds ??
      job.candidates
        .filter((candidate) => candidate.decision !== "rejected")
        .map((candidate) => candidate.id);
    const selectedCandidates = job.candidates.filter((candidate) =>
      candidateIds.includes(candidate.id)
    );
    const eligibleCandidates = selectedCandidates.filter(
      (candidate) =>
        candidate.decision !== "rejected" &&
        candidate.approvedItemIds.length === 0
    );

    if (eligibleCandidates.length === 0) {
      return null;
    }

    const pendingRequests = buildCreateRequestsFromCandidates(
      job,
      eligibleCandidates,
      request?.overridesByCandidateId
    );
    if (!pendingRequests) {
      return null;
    }

    const created: InventoryRecord[] = [];

    for (const pendingRequest of pendingRequests) {
      const candidateRecords = await this.createItems(
        pendingRequest.request,
        "image_intake"
      );
      created.push(...candidateRecords);
      pendingRequest.candidate.approvedItemIds = candidateRecords.map(
        (item) => item.id
      );
      pendingRequest.candidate.decision = "approved";
      pendingRequest.candidate.producer = pendingRequest.request.producer;
      pendingRequest.candidate.label = pendingRequest.request.label;
      pendingRequest.candidate.vintage = pendingRequest.request.vintage;
      pendingRequest.candidate.baseSpirit = pendingRequest.request.baseSpirit;
      pendingRequest.candidate.style = pendingRequest.request.style;
      pendingRequest.candidate.grapeVarieties =
        pendingRequest.request.grapeVarieties;
      pendingRequest.candidate.location = pendingRequest.request.location;
      pendingRequest.candidate.bin = pendingRequest.request.bin;
      pendingRequest.candidate.quantity = pendingRequest.request.quantity;
      pendingRequest.candidate.notes = pendingRequest.request.notes;
      pendingRequest.candidate.confidence =
        pendingRequest.request.confidence ??
        pendingRequest.candidate.confidence ??
        1;
    }

    job.approvedItemIds = job.candidates.flatMap(
      (candidate) => candidate.approvedItemIds
    );
    job.status = getPostApprovalJobStatus(job.candidates);
    job.updatedAt = new Date().toISOString();
    return { job, created };
  }

  async dispose(): Promise<void> {
    return Promise.resolve();
  }
}

class SqliteInventoryStore implements InventoryStore {
  private readonly listAllStatement;
  private readonly listFilteredStatement;
  private readonly getByIdStatement;
  private readonly insertInventoryStatement;
  private readonly updateInventoryStatement;
  private readonly insertEventStatement;
  private readonly listEventsStatement;
  private readonly countStatement;
  private readonly insertImportRunStatement;
  private readonly createIntakeJobStatement;
  private readonly createIntakeImageStatement;
  private readonly listIntakeJobsStatement;
  private readonly getIntakeJobStatement;
  private readonly getIntakeImagesStatement;
  private readonly updateIntakeJobStatement;

  constructor(private readonly database: DatabaseSync) {
    this.listAllStatement = database.prepare(`
      SELECT id, category, producer, label, vintage, country, region, style,
        grape_varieties, base_spirit, size_ml, abv, location, bin, status,
        fill_percent, drink_from, drink_to, quality_score, estimated_price_usd,
        price_tier, confidence,
        pairing_tags, cocktail_tags, notes
      FROM inventory_items
      ORDER BY created_at DESC
    `);

    this.listFilteredStatement = database.prepare(`
      SELECT id, category, producer, label, vintage, country, region, style,
        grape_varieties, base_spirit, size_ml, abv, location, bin, status,
        fill_percent, drink_from, drink_to, quality_score, estimated_price_usd,
        price_tier, confidence,
        pairing_tags, cocktail_tags, notes
      FROM inventory_items
      WHERE
        (@category IS NULL OR category = @category) AND
        (@location IS NULL OR location = @location) AND
        (@bin IS NULL OR bin = @bin) AND
        (@status IS NULL OR status = @status)
      ORDER BY created_at DESC
    `);

    this.getByIdStatement = database.prepare(`
      SELECT id, category, producer, label, vintage, country, region, style,
        grape_varieties, base_spirit, size_ml, abv, location, bin, status,
        fill_percent, drink_from, drink_to, quality_score, estimated_price_usd,
        price_tier, confidence,
        pairing_tags, cocktail_tags, notes
      FROM inventory_items
      WHERE id = ?
      LIMIT 1
    `);

    this.insertInventoryStatement = database.prepare(`
      INSERT INTO inventory_items (
        id, category, producer, label, vintage, country, region, style,
        grape_varieties, base_spirit, size_ml, abv, location, bin, status,
        fill_percent, drink_from, drink_to, quality_score, estimated_price_usd,
        price_tier, confidence,
        pairing_tags, cocktail_tags, notes, source_system, updated_at
      ) VALUES (
        @id, @category, @producer, @label, @vintage, @country, @region, @style,
        @grape_varieties, @base_spirit, @size_ml, @abv, @location, @bin, @status,
        @fill_percent, @drink_from, @drink_to, @quality_score, @estimated_price_usd,
        @price_tier, @confidence,
        @pairing_tags, @cocktail_tags, @notes, @source_system, datetime('now')
      )
    `);

    this.updateInventoryStatement = database.prepare(`
      UPDATE inventory_items
      SET
        producer = @producer,
        label = @label,
        vintage = @vintage,
        country = @country,
        region = @region,
        style = @style,
        grape_varieties = @grape_varieties,
        base_spirit = @base_spirit,
        size_ml = @size_ml,
        abv = @abv,
        location = @location,
        bin = @bin,
        status = @status,
        fill_percent = @fill_percent,
        drink_from = @drink_from,
        drink_to = @drink_to,
        quality_score = @quality_score,
        estimated_price_usd = @estimated_price_usd,
        price_tier = @price_tier,
        confidence = @confidence,
        pairing_tags = @pairing_tags,
        cocktail_tags = @cocktail_tags,
        notes = @notes,
        updated_at = datetime('now')
      WHERE id = @id
    `);

    this.insertEventStatement = database.prepare(`
      INSERT INTO inventory_events (
        inventory_item_id, event_type, quantity_delta, notes
      ) VALUES (
        @inventory_item_id, @event_type, @quantity_delta, @notes
      )
    `);

    this.listEventsStatement = database.prepare(`
      SELECT id, inventory_item_id, event_type, quantity_delta, notes, created_at
      FROM inventory_events
      WHERE inventory_item_id = ?
      ORDER BY id DESC
    `);

    this.countStatement = database.prepare(
      "SELECT COUNT(*) AS count FROM inventory_items"
    );

    this.insertImportRunStatement = database.prepare(`
      INSERT INTO import_runs (
        source, total_rows, expanded_bottle_count, warnings_json
      ) VALUES (
        @source, @total_rows, @expanded_bottle_count, @warnings_json
      )
    `);

    this.createIntakeJobStatement = database.prepare(`
      INSERT INTO intake_jobs (
        id, status, message, quantity, location, candidate_json, candidates_json,
        approved_item_ids_json, error, updated_at
      ) VALUES (
        @id, @status, @message, @quantity, @location, @candidate_json,
        @candidates_json, @approved_item_ids_json, @error, datetime('now')
      )
    `);

    this.createIntakeImageStatement = database.prepare(`
      INSERT INTO intake_images (
        intake_job_id, filename, content_type, url, storage_key
      ) VALUES (
        @intake_job_id, @filename, @content_type, @url, @storage_key
      )
    `);

    this.listIntakeJobsStatement = database.prepare(`
      SELECT id, status, message, quantity, location, candidate_json,
        candidates_json, approved_item_ids_json, error, created_at, updated_at
      FROM intake_jobs
      WHERE (@status IS NULL OR status = @status)
      ORDER BY created_at DESC, id DESC
    `);

    this.getIntakeJobStatement = database.prepare(`
      SELECT id, status, message, quantity, location, candidate_json,
        candidates_json, approved_item_ids_json, error, created_at, updated_at
      FROM intake_jobs
      WHERE id = ?
      LIMIT 1
    `);

    this.getIntakeImagesStatement = database.prepare(`
      SELECT filename, content_type, url, storage_key
      FROM intake_images
      WHERE intake_job_id = ?
      ORDER BY id ASC
    `);

    this.updateIntakeJobStatement = database.prepare(`
      UPDATE intake_jobs
      SET
        status = @status,
        candidate_json = @candidate_json,
        candidates_json = @candidates_json,
        approved_item_ids_json = @approved_item_ids_json,
        error = @error,
        updated_at = datetime('now')
      WHERE id = @id
    `);
  }

  async seedIfEmpty(seedItems: InventoryRecord[]): Promise<void> {
    const row = this.countStatement.get() as { count: number };
    if (row.count > 0) {
      return;
    }

    await this.importRecords(seedItems, "manual");
  }

  async list(query?: InventoryQuery): Promise<InventoryRecord[]> {
    const rows = query
      ? (this.listFilteredStatement.all({
          category: query.category ?? null,
          location: query.location ?? null,
          bin: query.bin ?? null,
          status: query.status ?? null
        }) as InventoryItemRow[])
      : (this.listAllStatement.all() as InventoryItemRow[]);

    return rows.map(mapRowToInventoryRecord);
  }

  async getById(id: string): Promise<InventoryRecord | null> {
    const row = this.getByIdStatement.get(id) as InventoryItemRow | undefined;
    return row ? mapRowToInventoryRecord(row) : null;
  }

  async createItems(
    request: CreateInventoryItemRequest,
    sourceSystem: InventorySourceSystem = "manual"
  ): Promise<InventoryRecord[]> {
    const records: InventoryRecord[] = Array.from(
      { length: request.quantity },
      () => ({
        ...request,
        id: `inventory_${crypto.randomUUID()}`
      })
    );

    return this.importRecords(records, sourceSystem);
  }

  async updateItem(
    id: string,
    request: UpdateInventoryItemRequest
  ): Promise<InventoryRecord | null> {
    const item = await this.getById(id);
    if (!item) {
      return null;
    }

    const nextItem: InventoryRecord = {
      ...item,
      producer: request.producer ?? item.producer,
      label: request.label ?? item.label,
      vintage: request.vintage ?? item.vintage,
      country: request.country ?? item.country,
      region: request.region ?? item.region,
      style: request.style ?? item.style,
      grapeVarieties: request.grapeVarieties ?? item.grapeVarieties,
      baseSpirit: request.baseSpirit ?? item.baseSpirit,
      sizeMl: request.sizeMl ?? item.sizeMl,
      abv: request.abv ?? item.abv,
      status: request.status ?? item.status,
      fillPercent: request.fillPercent ?? item.fillPercent,
      location: request.location ?? item.location,
      bin: request.bin ?? item.bin,
      drinkFrom: request.drinkFrom ?? item.drinkFrom,
      drinkTo: request.drinkTo ?? item.drinkTo,
      qualityScore: request.qualityScore ?? item.qualityScore,
      estimatedPriceUsd:
        request.estimatedPriceUsd ?? item.estimatedPriceUsd,
      priceTier: request.priceTier ?? item.priceTier,
      confidence: request.confidence ?? item.confidence,
      pairingTags: request.pairingTags ?? item.pairingTags,
      cocktailTags: request.cocktailTags ?? item.cocktailTags,
      notes: request.notes ?? item.notes
    };

    this.updateInventoryStatement.run({
      ...mapInventoryRecordToUpdateParams(nextItem)
    });

    this.insertEventStatement.run({
      inventory_item_id: id,
      event_type:
        request.eventType ??
        (request.location !== undefined || request.bin !== undefined
          ? "moved"
          : "corrected"),
      quantity_delta: request.quantityDelta ?? null,
      notes: request.notes ?? null
    });

    return this.getById(id);
  }

  async createEvent(
    id: string,
    request: CreateInventoryEventRequest
  ): Promise<InventoryRecord | null> {
    const item = await this.getById(id);
    if (!item) {
      return null;
    }

    const nextItem = applyEventToItem({ ...item }, request);
    this.updateInventoryStatement.run({
      ...mapInventoryRecordToUpdateParams(nextItem)
    });

    this.insertEventStatement.run({
      inventory_item_id: id,
      event_type: request.eventType,
      quantity_delta: request.quantityDelta ?? null,
      notes: request.notes ?? null
    });

    return this.getById(id);
  }

  async listEvents(id: string): Promise<InventoryEvent[]> {
    return (this.listEventsStatement.all(id) as InventoryEventRow[]).map(
      mapEventRow
    );
  }

  async importRecords(
    records: InventoryRecord[],
    sourceSystem: InventorySourceSystem
  ): Promise<InventoryRecord[]> {
    try {
      this.database.exec("BEGIN");

      for (const item of records) {
        this.insertInventoryStatement.run({
          ...mapInventoryRecordToDatabaseParams(item),
          source_system: sourceSystem
        });

        this.insertEventStatement.run({
          inventory_item_id: item.id,
          event_type: "acquired",
          quantity_delta: 1,
          notes: sourceSystem
        });
      }

      this.database.exec("COMMIT");
      return this.listRecentlyInserted(records.length);
    } catch (error) {
      this.database.exec("ROLLBACK");
      throw error;
    }
  }

  async recordImportRun(
    source: string,
    totalRows: number,
    expandedBottleCount: number,
    warnings: string[]
  ): Promise<void> {
    this.insertImportRunStatement.run({
      source,
      total_rows: totalRows,
      expanded_bottle_count: expandedBottleCount,
      warnings_json: JSON.stringify(warnings)
    });
  }

  async createIntakeJob(request: CreateIntakeRequest): Promise<IntakeJob> {
    const candidates = await extractIntakeCandidates(request);
    const status: IntakeJobStatus =
      candidates.length > 0 ? "needs_review" : "queued";
    const id = `intake_${crypto.randomUUID()}`;

    try {
      this.database.exec("BEGIN");
      this.createIntakeJobStatement.run({
        id,
        status,
        message: request.message,
        quantity: request.quantity,
        location: request.location ?? null,
        candidate_json: null,
        candidates_json: JSON.stringify(candidates),
        approved_item_ids_json: "[]",
        error: null
      });

      for (const image of request.images) {
        this.createIntakeImageStatement.run({
          intake_job_id: id,
          filename: image.filename,
          content_type: image.contentType,
          url: image.url ?? null,
          storage_key: image.storageKey ?? null
        });
      }
      this.database.exec("COMMIT");
    } catch (error) {
      this.database.exec("ROLLBACK");
      throw error;
    }

    const job = await this.getIntakeJob(id);
    if (!job) {
      throw new Error(`Failed to load intake job ${id} after creation.`);
    }
    return job;
  }

  async listIntakeJobs(query?: IntakeJobQuery): Promise<IntakeJob[]> {
    const rows = this.listIntakeJobsStatement.all({
      status: query?.status ?? null
    }) as IntakeJobRow[];
    return rows.map((row) =>
      mapJobRowToIntakeJob(
        row,
        this.getIntakeImagesStatement.all(row.id) as IntakeImageRow[]
      )
    );
  }

  async getIntakeJob(id: string): Promise<IntakeJob | null> {
    const row = this.getIntakeJobStatement.get(id) as IntakeJobRow | undefined;
    if (!row) {
      return null;
    }

    const images = this.getIntakeImagesStatement.all(id) as IntakeImageRow[];
    return mapJobRowToIntakeJob(row, images);
  }

  async updateIntakeJobCandidate(
    id: string,
    candidateId: string,
    patch: UpdateIntakeCandidate
  ): Promise<IntakeJob | null> {
    const job = await this.getIntakeJob(id);
    if (!job) {
      return null;
    }

    const candidate = job.candidates.find((entry) => entry.id === candidateId);
    if (!candidate) {
      return null;
    }

    const nextCandidates = job.candidates.map((entry) =>
      entry.id === candidateId
        ? ({
            ...entry,
            ...omitUndefined(patch),
            id: entry.id,
            decision: patch.decision ?? entry.decision,
            approvedItemIds: entry.approvedItemIds,
            category: patch.category ?? entry.category,
            quantity: patch.quantity ?? entry.quantity,
            confidence: patch.confidence ?? entry.confidence,
            reasoning: patch.reasoning ?? entry.reasoning ?? [],
            grapeVarieties: patch.grapeVarieties ?? entry.grapeVarieties ?? []
          } as IntakeCandidate)
        : entry
    );

    this.updateIntakeJobStatement.run({
      id,
      status: getReviewJobStatus(nextCandidates),
      candidate_json: null,
      candidates_json: JSON.stringify(nextCandidates),
      approved_item_ids_json: JSON.stringify(job.approvedItemIds),
      error: job.error ?? null
    });

    return this.getIntakeJob(id);
  }

  async reprocessIntakeJob(id: string): Promise<IntakeJob | null> {
    const job = await this.getIntakeJob(id);
    if (!job) {
      return null;
    }

    const nextCandidates = await extractIntakeCandidates({
      message: job.message,
      quantity: job.quantity,
      location: job.location,
      images: job.images
    });

    this.updateIntakeJobStatement.run({
      id,
      status: nextCandidates.length > 0 ? "needs_review" : "queued",
      candidate_json: null,
      candidates_json: JSON.stringify(nextCandidates),
      approved_item_ids_json: "[]",
      error: null
    });

    return this.getIntakeJob(id);
  }

  async approveIntakeJob(
    id: string,
    request?: ApproveIntakeJobRequest
  ): Promise<{ job: IntakeJob; created: InventoryRecord[] } | null> {
    const job = await this.getIntakeJob(id);
    if (!job) {
      return null;
    }

    const candidateIds =
      request?.candidateIds ??
      job.candidates
        .filter((candidate) => candidate.decision !== "rejected")
        .map((candidate) => candidate.id);
    const selectedCandidates = job.candidates.filter((candidate) =>
      candidateIds.includes(candidate.id)
    );
    const eligibleCandidates = selectedCandidates.filter(
      (candidate) =>
        candidate.decision !== "rejected" &&
        candidate.approvedItemIds.length === 0
    );

    if (eligibleCandidates.length === 0) {
      return null;
    }

    const nextCandidates = job.candidates.map((candidate) => ({ ...candidate }));
    const candidatesToCreate = nextCandidates.filter((candidate) =>
      eligibleCandidates.some((eligible) => eligible.id === candidate.id)
    );
    const pendingRequests = buildCreateRequestsFromCandidates(
      job,
      candidatesToCreate,
      request?.overridesByCandidateId
    );
    if (!pendingRequests) {
      return null;
    }

    const created: InventoryRecord[] = [];

    for (const pendingRequest of pendingRequests) {
      const candidateRecords = await this.createItems(
        pendingRequest.request,
        "image_intake"
      );
      created.push(...candidateRecords);

      pendingRequest.candidate.approvedItemIds = candidateRecords.map(
        (item) => item.id
      );
      pendingRequest.candidate.decision = "approved";
      pendingRequest.candidate.producer = pendingRequest.request.producer;
      pendingRequest.candidate.label = pendingRequest.request.label;
      pendingRequest.candidate.vintage = pendingRequest.request.vintage;
      pendingRequest.candidate.baseSpirit = pendingRequest.request.baseSpirit;
      pendingRequest.candidate.style = pendingRequest.request.style;
      pendingRequest.candidate.grapeVarieties =
        pendingRequest.request.grapeVarieties;
      pendingRequest.candidate.location = pendingRequest.request.location;
      pendingRequest.candidate.bin = pendingRequest.request.bin;
      pendingRequest.candidate.quantity = pendingRequest.request.quantity;
      pendingRequest.candidate.notes = pendingRequest.request.notes;
      pendingRequest.candidate.confidence =
        pendingRequest.request.confidence ??
        pendingRequest.candidate.confidence ??
        1;
    }

    const approvedItemIds = nextCandidates.flatMap(
      (candidate) => candidate.approvedItemIds
    );
    const nextStatus = getPostApprovalJobStatus(nextCandidates);

    this.updateIntakeJobStatement.run({
      id,
      status: nextStatus,
      candidate_json: null,
      candidates_json: JSON.stringify(nextCandidates),
      approved_item_ids_json: JSON.stringify(approvedItemIds),
      error: null
    });

    const updatedJob = await this.getIntakeJob(id);
    if (!updatedJob) {
      throw new Error(`Failed to reload approved intake job ${id}.`);
    }

    return {
      job: updatedJob,
      created
    };
  }

  private listRecentlyInserted(limit: number): InventoryRecord[] {
    const statement = this.database.prepare(`
      SELECT id, category, producer, label, vintage, country, region, style,
        grape_varieties, base_spirit, size_ml, abv, location, bin, status,
        fill_percent, drink_from, drink_to, quality_score, estimated_price_usd,
        price_tier, confidence,
        pairing_tags, cocktail_tags, notes
      FROM inventory_items
      ORDER BY created_at DESC, rowid DESC
      LIMIT ?
    `);

    return (statement.all(limit) as InventoryItemRow[])
      .map(mapRowToInventoryRecord)
      .reverse();
  }

  async dispose(): Promise<void> {
    this.database.close();
  }
}

function applyEventToItem(
  item: InventoryRecord,
  request: CreateInventoryEventRequest
): InventoryRecord {
  if (request.location !== undefined) {
    item.location = request.location;
  }
  if (request.bin !== undefined) {
    item.bin = request.bin;
  }
  if (request.fillPercent !== undefined) {
    item.fillPercent = request.fillPercent;
  }
  if (request.notes !== undefined) {
    item.notes = request.notes;
  }

  switch (request.eventType) {
    case "opened":
      item.status = request.status ?? "open";
      if (item.fillPercent === undefined) {
        item.fillPercent = 100;
      }
      break;
    case "poured":
      item.status = request.status ?? item.status;
      break;
    case "consumed":
      item.status = request.status ?? "consumed";
      item.fillPercent = request.fillPercent ?? 0;
      break;
    case "moved":
      item.status = request.status ?? item.status;
      break;
    case "corrected":
      item.status = request.status ?? item.status;
      break;
    case "deleted":
      item.status = request.status ?? "missing";
      break;
    case "acquired":
      item.status = request.status ?? item.status;
      break;
  }

  return item;
}

function buildCreateRequestFromCandidate(
  job: IntakeJob,
  candidate: IntakeCandidate,
  overrides?: Partial<CreateInventoryItemRequest>
): CreateInventoryItemRequest | null {
  const merged = {
    category: overrides?.category ?? candidate?.category,
    producer: overrides?.producer ?? candidate?.producer,
    label: overrides?.label ?? candidate?.label,
    quantity: overrides?.quantity ?? candidate?.quantity ?? job.quantity,
    vintage: overrides?.vintage ?? candidate?.vintage,
    country: overrides?.country ?? candidate?.country,
    region: overrides?.region ?? candidate?.region,
    style: overrides?.style ?? candidate?.style,
    grapeVarieties: overrides?.grapeVarieties ?? candidate?.grapeVarieties ?? [],
    baseSpirit: overrides?.baseSpirit ?? candidate?.baseSpirit,
    sizeMl: overrides?.sizeMl,
    abv: overrides?.abv,
    location: overrides?.location ?? candidate?.location ?? job.location,
    bin: overrides?.bin ?? candidate?.bin,
    status: overrides?.status ?? "sealed",
    fillPercent: overrides?.fillPercent,
    drinkFrom: overrides?.drinkFrom ?? candidate?.drinkFrom,
    drinkTo: overrides?.drinkTo ?? candidate?.drinkTo,
    qualityScore: overrides?.qualityScore ?? candidate?.qualityScore,
    estimatedPriceUsd:
      overrides?.estimatedPriceUsd ?? candidate?.estimatedPriceUsd,
    priceTier: overrides?.priceTier ?? candidate?.priceTier,
    confidence: overrides?.confidence ?? candidate?.confidence,
    pairingTags: overrides?.pairingTags ?? [],
    cocktailTags: overrides?.cocktailTags ?? [],
    notes: overrides?.notes ?? candidate?.notes
  };

  const parsed = createInventoryItemRequestSchema.safeParse(merged);
  return parsed.success ? parsed.data : null;
}

function buildCreateRequestsFromCandidates(
  job: IntakeJob,
  candidates: IntakeCandidate[],
  overridesByCandidateId?: ApproveIntakeJobRequest["overridesByCandidateId"]
):
  | Array<{
      candidate: IntakeCandidate;
      request: CreateInventoryItemRequest;
    }>
  | null {
  const requests: Array<{
    candidate: IntakeCandidate;
    request: CreateInventoryItemRequest;
  }> = [];

  for (const candidate of candidates) {
    const request = buildCreateRequestFromCandidate(
      job,
      candidate,
      sanitizeCreateItemOverrides(overridesByCandidateId?.[candidate.id])
    );
    if (!request) {
      return null;
    }

    requests.push({
      candidate,
      request
    });
  }

  return requests;
}

function getPostApprovalJobStatus(
  candidates: IntakeCandidate[]
): IntakeJobStatus {
  return candidates.some((candidate) => candidate.decision === "pending")
    ? "approved"
    : "completed";
}

function getReviewJobStatus(candidates: IntakeCandidate[]): IntakeJobStatus {
  if (candidates.length === 0) {
    return "queued";
  }

  return candidates.some((candidate) => candidate.decision === "pending")
    ? "needs_review"
    : "completed";
}

function sanitizeCreateItemOverrides(
  overrides:
    | NonNullable<ApproveIntakeJobRequest["overridesByCandidateId"]>[string]
    | undefined
): Partial<CreateInventoryItemRequest> {
  const parsed = createInventoryItemRequestSchema
    .partial()
    .safeParse(omitUndefined((overrides ?? {}) as Record<string, unknown>));

  return parsed.success
    ? (omitUndefined(parsed.data as Record<string, unknown>) as Partial<CreateInventoryItemRequest>)
    : {};
}

export async function createAppContext(): Promise<BartenderGptAppContext> {
  try {
    const database = openDatabase();
    initializeDatabase(database);

    const inventoryStore = new SqliteInventoryStore(database);
    await inventoryStore.seedIfEmpty(demoInventory);

    return {
      inventoryStore,
      storeMode: "sqlite"
    };
  } catch (error) {
    console.warn(
      `SQLite database initialization failed at ${resolveDatabasePath()}. Falling back to the in-memory inventory store.`,
      error
    );

    return {
      inventoryStore: new InMemoryInventoryStore(demoInventory),
      storeMode: "memory"
    };
  }
}
