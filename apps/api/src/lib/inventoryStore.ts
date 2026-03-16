import { type DatabaseSync } from "node:sqlite";
import {
  initializeDatabase,
  openDatabase,
  resolveDatabasePath
} from "@bacchus/db";
import type {
  CreateIntakeRequest,
  CreateInventoryEventRequest,
  CreateInventoryItemRequest,
  IntakeCandidate,
  IntakeJob,
  IntakeJobStatus,
  InventoryEvent,
  InventoryEventType,
  InventoryQuery,
  InventoryRecord,
  UpdateInventoryItemRequest
} from "@bacchus/domain";
import { createInventoryItemRequestSchema } from "@bacchus/domain";
import { demoInventory } from "../data/demoInventory.js";
import type { BacchusAppContext } from "./appContext.js";

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
  listIntakeJobs(): Promise<IntakeJob[]>;
  getIntakeJob(id: string): Promise<IntakeJob | null>;
  approveIntakeJob(
    id: string,
    overrides?: Partial<CreateInventoryItemRequest>
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

function parseCandidate(value: string | null): IntakeCandidate | undefined {
  if (!value) {
    return undefined;
  }

  try {
    return JSON.parse(value) as IntakeCandidate;
  } catch {
    return undefined;
  }
}

function mapJobRowToIntakeJob(
  row: IntakeJobRow,
  images: IntakeImageRow[]
): IntakeJob {
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
    candidate: parseCandidate(row.candidate_json),
    approvedItemIds: parseJsonArray(row.approved_item_ids_json),
    error: row.error ?? undefined,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString()
  };
}

function inferCandidateFromIntake(request: CreateIntakeRequest): IntakeCandidate | undefined {
  const message = request.message.trim();
  const lower = message.toLowerCase();
  const quantity = request.quantity;
  const reasons: string[] = [];

  const spiritMatchers = [
    { keyword: "bourbon", category: "spirit", baseSpirit: "bourbon" },
    { keyword: "rye", category: "spirit", baseSpirit: "rye" },
    { keyword: "scotch", category: "spirit", baseSpirit: "scotch" },
    { keyword: "whiskey", category: "spirit", baseSpirit: "whiskey" },
    { keyword: "whisky", category: "spirit", baseSpirit: "whisky" },
    { keyword: "gin", category: "spirit", baseSpirit: "gin" },
    { keyword: "rum", category: "spirit", baseSpirit: "rum" },
    { keyword: "tequila", category: "spirit", baseSpirit: "tequila" },
    { keyword: "mezcal", category: "spirit", baseSpirit: "mezcal" },
    { keyword: "vodka", category: "spirit", baseSpirit: "vodka" },
    { keyword: "cognac", category: "spirit", baseSpirit: "cognac" },
    { keyword: "armagnac", category: "spirit", baseSpirit: "armagnac" },
    { keyword: "amaro", category: "liqueur", baseSpirit: undefined },
    { keyword: "liqueur", category: "liqueur", baseSpirit: undefined },
    { keyword: "campari", category: "aperitif", baseSpirit: undefined },
    { keyword: "aperol", category: "aperitif", baseSpirit: undefined },
    { keyword: "vermouth", category: "aperitif", baseSpirit: undefined },
    { keyword: "chartreuse", category: "liqueur", baseSpirit: undefined },
    { keyword: "bitters", category: "bitters", baseSpirit: undefined },
    { keyword: "syrup", category: "syrup", baseSpirit: undefined }
  ] as const;

  const wineHints = ["cabernet", "pinot", "chardonnay", "barolo", "riesling", "champagne", "wine"];
  const matchedSpirit = spiritMatchers.find((entry) => lower.includes(entry.keyword));
  const vintageMatch = message.match(/\b(19|20)\d{2}\b/);

  let category: IntakeCandidate["category"] | undefined;
  let baseSpirit: string | undefined;
  if (matchedSpirit) {
    category = matchedSpirit.category;
    baseSpirit = matchedSpirit.baseSpirit;
    reasons.push(`Detected "${matchedSpirit.keyword}" in the message.`);
  } else if (wineHints.some((hint) => lower.includes(hint))) {
    category = "wine";
    reasons.push("Detected wine-related keywords in the message.");
  }

  if (!category) {
    return undefined;
  }

  const cleanedMessage = message
    .replace(/\b(i just bought|bought|new bottle of|bottle of|picked up|just grabbed|this is|this)\b/gi, "")
    .replace(/^\s*(a|an)\s+/i, "")
    .replace(/\bfor the [a-z ]+$/i, "")
    .replace(/\s+/g, " ")
    .trim();

  const parts = cleanedMessage
    .split(/[-,:]/)
    .map((part) => part.trim())
    .filter(Boolean);

  let producer: string | undefined;
  let label: string | undefined;

  if (parts.length >= 2) {
    [producer, label] = parts;
  } else {
    const words = cleanedMessage.replace(/\b(19|20)\d{2}\b/g, "").trim().split(/\s+/);
    if (words.length >= 3) {
      producer = words.slice(0, 2).join(" ");
      label = words.slice(2).join(" ");
    } else {
      label = cleanedMessage || undefined;
    }
  }

  if (matchedSpirit?.keyword === "amaro" && cleanedMessage) {
    const words = cleanedMessage.split(/\s+/);
    producer = words[0];
    label = "Amaro";
  }

  const confidence = matchedSpirit ? 0.82 : 0.68;

  return {
    category,
    producer,
    label,
    vintage: vintageMatch ? Number(vintageMatch[0]) : undefined,
    baseSpirit,
    grapeVarieties: [],
    location: request.location,
    quantity,
    confidence,
    reasoning: reasons,
    notes:
      request.images.length > 0
        ? "Image-based extraction is stubbed for now; this candidate is based primarily on message text."
        : undefined
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
    const candidate = inferCandidateFromIntake(request);
    const now = new Date().toISOString();
    const job: IntakeJob = {
      id: `intake_${crypto.randomUUID()}`,
      status: candidate ? "needs_review" : "queued",
      message: request.message,
      quantity: request.quantity,
      location: request.location,
      images: request.images,
      candidate,
      approvedItemIds: [],
      createdAt: now,
      updatedAt: now
    };

    this.jobs.unshift(job);
    return job;
  }

  async listIntakeJobs(): Promise<IntakeJob[]> {
    return this.jobs;
  }

  async getIntakeJob(id: string): Promise<IntakeJob | null> {
    return this.jobs.find((job) => job.id === id) ?? null;
  }

  async approveIntakeJob(
    id: string,
    overrides?: Partial<CreateInventoryItemRequest>
  ): Promise<{ job: IntakeJob; created: InventoryRecord[] } | null> {
    const job = this.jobs.find((entry) => entry.id === id);
    if (!job) {
      return null;
    }

    const merged = buildCreateRequestFromCandidate(job, overrides);
    if (!merged) {
      return null;
    }

    const created = await this.createItems(merged, "image_intake");
    job.status = "completed";
    job.approvedItemIds = created.map((item) => item.id);
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
        fill_percent, drink_from, drink_to, quality_score, confidence,
        pairing_tags, cocktail_tags, notes
      FROM inventory_items
      ORDER BY created_at DESC
    `);

    this.listFilteredStatement = database.prepare(`
      SELECT id, category, producer, label, vintage, country, region, style,
        grape_varieties, base_spirit, size_ml, abv, location, bin, status,
        fill_percent, drink_from, drink_to, quality_score, confidence,
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
        fill_percent, drink_from, drink_to, quality_score, confidence,
        pairing_tags, cocktail_tags, notes
      FROM inventory_items
      WHERE id = ?
      LIMIT 1
    `);

    this.insertInventoryStatement = database.prepare(`
      INSERT INTO inventory_items (
        id, category, producer, label, vintage, country, region, style,
        grape_varieties, base_spirit, size_ml, abv, location, bin, status,
        fill_percent, drink_from, drink_to, quality_score, confidence,
        pairing_tags, cocktail_tags, notes, source_system, updated_at
      ) VALUES (
        @id, @category, @producer, @label, @vintage, @country, @region, @style,
        @grape_varieties, @base_spirit, @size_ml, @abv, @location, @bin, @status,
        @fill_percent, @drink_from, @drink_to, @quality_score, @confidence,
        @pairing_tags, @cocktail_tags, @notes, @source_system, datetime('now')
      )
    `);

    this.updateInventoryStatement = database.prepare(`
      UPDATE inventory_items
      SET
        location = @location,
        bin = @bin,
        status = @status,
        fill_percent = @fill_percent,
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
        id, status, message, quantity, location, candidate_json,
        approved_item_ids_json, error, updated_at
      ) VALUES (
        @id, @status, @message, @quantity, @location, @candidate_json,
        @approved_item_ids_json, @error, datetime('now')
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
        approved_item_ids_json, error, created_at, updated_at
      FROM intake_jobs
      ORDER BY created_at DESC, id DESC
    `);

    this.getIntakeJobStatement = database.prepare(`
      SELECT id, status, message, quantity, location, candidate_json,
        approved_item_ids_json, error, created_at, updated_at
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
      status: request.status ?? item.status,
      fillPercent: request.fillPercent ?? item.fillPercent,
      location: request.location ?? item.location,
      bin: request.bin ?? item.bin,
      notes: request.notes ?? item.notes
    };

    this.updateInventoryStatement.run({
      id,
      location: nextItem.location,
      bin: nextItem.bin ?? null,
      status: nextItem.status,
      fill_percent: nextItem.fillPercent ?? null,
      notes: nextItem.notes ?? null
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
      id,
      location: nextItem.location,
      bin: nextItem.bin ?? null,
      status: nextItem.status,
      fill_percent: nextItem.fillPercent ?? null,
      notes: nextItem.notes ?? null
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
          confidence: item.confidence ?? null,
          pairing_tags: JSON.stringify(item.pairingTags),
          cocktail_tags: JSON.stringify(item.cocktailTags),
          notes: item.notes ?? null,
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
    const candidate = inferCandidateFromIntake(request);
    const status: IntakeJobStatus = candidate ? "needs_review" : "queued";
    const id = `intake_${crypto.randomUUID()}`;

    try {
      this.database.exec("BEGIN");
      this.createIntakeJobStatement.run({
        id,
        status,
        message: request.message,
        quantity: request.quantity,
        location: request.location ?? null,
        candidate_json: candidate ? JSON.stringify(candidate) : null,
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

  async listIntakeJobs(): Promise<IntakeJob[]> {
    const rows = this.listIntakeJobsStatement.all() as IntakeJobRow[];
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

  async approveIntakeJob(
    id: string,
    overrides?: Partial<CreateInventoryItemRequest>
  ): Promise<{ job: IntakeJob; created: InventoryRecord[] } | null> {
    const job = await this.getIntakeJob(id);
    if (!job) {
      return null;
    }

    const request = buildCreateRequestFromCandidate(job, overrides);
    if (!request) {
      return null;
    }

    const created = await this.createItems(request, "image_intake");
    this.updateIntakeJobStatement.run({
      id,
      status: "completed",
      candidate_json: job.candidate ? JSON.stringify(job.candidate) : null,
      approved_item_ids_json: JSON.stringify(created.map((item) => item.id)),
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
        fill_percent, drink_from, drink_to, quality_score, confidence,
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
  overrides?: Partial<CreateInventoryItemRequest>
): CreateInventoryItemRequest | null {
  const candidate = job.candidate;
  const merged = {
    category: overrides?.category ?? candidate?.category,
    producer: overrides?.producer ?? candidate?.producer,
    label: overrides?.label ?? candidate?.label,
    quantity: overrides?.quantity ?? candidate?.quantity ?? job.quantity,
    vintage: overrides?.vintage ?? candidate?.vintage,
    country: overrides?.country,
    region: overrides?.region,
    style: overrides?.style ?? candidate?.style,
    grapeVarieties: overrides?.grapeVarieties ?? candidate?.grapeVarieties ?? [],
    baseSpirit: overrides?.baseSpirit ?? candidate?.baseSpirit,
    sizeMl: overrides?.sizeMl,
    abv: overrides?.abv,
    location: overrides?.location ?? candidate?.location ?? job.location,
    bin: overrides?.bin ?? candidate?.bin,
    status: overrides?.status ?? "sealed",
    fillPercent: overrides?.fillPercent,
    drinkFrom: overrides?.drinkFrom,
    drinkTo: overrides?.drinkTo,
    qualityScore: overrides?.qualityScore,
    confidence: overrides?.confidence ?? candidate?.confidence,
    pairingTags: overrides?.pairingTags ?? [],
    cocktailTags: overrides?.cocktailTags ?? [],
    notes: overrides?.notes ?? candidate?.notes
  };

  const parsed = createInventoryItemRequestSchema.safeParse(merged);
  return parsed.success ? parsed.data : null;
}

export async function createAppContext(): Promise<BacchusAppContext> {
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
