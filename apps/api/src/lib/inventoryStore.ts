import { type DatabaseSync } from "node:sqlite";
import {
  initializeDatabase,
  openDatabase,
  resolveDatabasePath
} from "@bacchus/db";
import type { InventoryQuery, InventoryRecord } from "@bacchus/domain";
import { demoInventory } from "../data/demoInventory.js";
import type { BacchusAppContext } from "./appContext.js";

export type StoreMode = "memory" | "sqlite";
export type InventorySourceSystem = "manual" | "cellartracker_import";

export type InventoryStore = {
  list(query?: InventoryQuery): Promise<InventoryRecord[]>;
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
    return Array.isArray(parsed) ? parsed.filter((entry) => typeof entry === "string") : [];
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

class InMemoryInventoryStore implements InventoryStore {
  private readonly items: InventoryRecord[];

  constructor(seedItems: InventoryRecord[]) {
    this.items = [...seedItems];
  }

  async list(query?: InventoryQuery): Promise<InventoryRecord[]> {
    return this.items.filter((item) => matchesQuery(item, query));
  }

  async importRecords(
    records: InventoryRecord[],
    _sourceSystem: InventorySourceSystem
  ): Promise<InventoryRecord[]> {
    const normalized = records.map((record) => ({
      ...record,
      id: record.id || `inventory_${crypto.randomUUID()}`
    }));

    this.items.push(...normalized);
    return normalized;
  }

  async dispose(): Promise<void> {
    return Promise.resolve();
  }

  async recordImportRun(): Promise<void> {
    return Promise.resolve();
  }
}

class SqliteInventoryStore implements InventoryStore {
  private readonly listAllStatement;
  private readonly listFilteredStatement;
  private readonly insertInventoryStatement;
  private readonly insertEventStatement;
  private readonly countStatement;
  private readonly insertImportRunStatement;

  constructor(private readonly database: DatabaseSync) {
    this.listAllStatement = database.prepare(`
      SELECT
        id,
        category,
        producer,
        label,
        vintage,
        country,
        region,
        style,
        grape_varieties,
        base_spirit,
        size_ml,
        abv,
        location,
        bin,
        status,
        fill_percent,
        drink_from,
        drink_to,
        quality_score,
        confidence,
        pairing_tags,
        cocktail_tags,
        notes
      FROM inventory_items
      ORDER BY created_at DESC
    `);

    this.listFilteredStatement = database.prepare(`
      SELECT
        id,
        category,
        producer,
        label,
        vintage,
        country,
        region,
        style,
        grape_varieties,
        base_spirit,
        size_ml,
        abv,
        location,
        bin,
        status,
        fill_percent,
        drink_from,
        drink_to,
        quality_score,
        confidence,
        pairing_tags,
        cocktail_tags,
        notes
      FROM inventory_items
      WHERE
        (@category IS NULL OR category = @category) AND
        (@location IS NULL OR location = @location) AND
        (@bin IS NULL OR bin = @bin) AND
        (@status IS NULL OR status = @status)
      ORDER BY created_at DESC
    `);

    this.insertInventoryStatement = database.prepare(`
      INSERT INTO inventory_items (
        id,
        category,
        producer,
        label,
        vintage,
        country,
        region,
        style,
        grape_varieties,
        base_spirit,
        size_ml,
        abv,
        location,
        bin,
        status,
        fill_percent,
        drink_from,
        drink_to,
        quality_score,
        confidence,
        pairing_tags,
        cocktail_tags,
        notes,
        source_system,
        updated_at
      ) VALUES (
        @id,
        @category,
        @producer,
        @label,
        @vintage,
        @country,
        @region,
        @style,
        @grape_varieties,
        @base_spirit,
        @size_ml,
        @abv,
        @location,
        @bin,
        @status,
        @fill_percent,
        @drink_from,
        @drink_to,
        @quality_score,
        @confidence,
        @pairing_tags,
        @cocktail_tags,
        @notes,
        @source_system,
        datetime('now')
      )
    `);

    this.insertEventStatement = database.prepare(`
      INSERT INTO inventory_events (
        inventory_item_id,
        event_type,
        quantity_delta,
        notes
      ) VALUES (
        @inventory_item_id,
        @event_type,
        @quantity_delta,
        @notes
      )
    `);

    this.countStatement = database.prepare(
      "SELECT COUNT(*) AS count FROM inventory_items"
    );

    this.insertImportRunStatement = database.prepare(`
      INSERT INTO import_runs (
        source,
        total_rows,
        expanded_bottle_count,
        warnings_json
      ) VALUES (
        @source,
        @total_rows,
        @expanded_bottle_count,
        @warnings_json
      )
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

  async importRecords(
    records: InventoryRecord[],
    sourceSystem: InventorySourceSystem
  ): Promise<InventoryRecord[]> {
    try {
      this.database.exec("BEGIN");

      for (const item of records) {
        const id = item.id || `inventory_${crypto.randomUUID()}`;
        this.insertInventoryStatement.run({
          id,
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
          inventory_item_id: id,
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

  private listRecentlyInserted(limit: number): InventoryRecord[] {
    const statement = this.database.prepare(`
      SELECT
        id,
        category,
        producer,
        label,
        vintage,
        country,
        region,
        style,
        grape_varieties,
        base_spirit,
        size_ml,
        abv,
        location,
        bin,
        status,
        fill_percent,
        drink_from,
        drink_to,
        quality_score,
        confidence,
        pairing_tags,
        cocktail_tags,
        notes
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
