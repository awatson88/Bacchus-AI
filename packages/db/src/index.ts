import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { fileURLToPath } from "node:url";

export const databaseProvider = "sqlite";
export const databasePathEnvVar = "BARTENDERGPT_DB_PATH";
export const legacyDatabasePathEnvVar = "BACCHUS_DB_PATH";
export const defaultDatabasePath = "./bartendergpt_ai.db";
const packageDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(packageDir, "../../..");

const schemaSql = `
CREATE TABLE IF NOT EXISTS inventory_items (
  id TEXT PRIMARY KEY,
  category TEXT NOT NULL,
  producer TEXT NOT NULL,
  label TEXT NOT NULL,
  vintage INTEGER,
  country TEXT,
  region TEXT,
  style TEXT,
  grape_varieties TEXT NOT NULL DEFAULT '[]',
  base_spirit TEXT,
  size_ml INTEGER,
  abv REAL,
  location TEXT NOT NULL,
  bin TEXT,
  status TEXT NOT NULL,
  fill_percent INTEGER,
  drink_from TEXT,
  drink_to TEXT,
  quality_score REAL,
  estimated_price_usd REAL,
  price_tier TEXT,
  confidence REAL,
  pairing_tags TEXT NOT NULL DEFAULT '[]',
  cocktail_tags TEXT NOT NULL DEFAULT '[]',
  notes TEXT,
  source_system TEXT NOT NULL DEFAULT 'manual',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_inventory_category_status
  ON inventory_items (category, status);
CREATE INDEX IF NOT EXISTS idx_inventory_location_bin
  ON inventory_items (location, bin);

CREATE TABLE IF NOT EXISTS inventory_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  inventory_item_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  quantity_delta REAL,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (inventory_item_id) REFERENCES inventory_items(id)
);

CREATE INDEX IF NOT EXISTS idx_inventory_events_item_created
  ON inventory_events (inventory_item_id, created_at);

CREATE TABLE IF NOT EXISTS import_runs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source TEXT NOT NULL,
  total_rows INTEGER NOT NULL,
  expanded_bottle_count INTEGER NOT NULL,
  warnings_json TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS intake_jobs (
  id TEXT PRIMARY KEY,
  status TEXT NOT NULL,
  message TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  location TEXT,
  candidate_json TEXT,
  candidates_json TEXT NOT NULL DEFAULT '[]',
  approved_item_ids_json TEXT NOT NULL DEFAULT '[]',
  error TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_intake_jobs_status_created
  ON intake_jobs (status, created_at);

CREATE TABLE IF NOT EXISTS intake_images (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  intake_job_id TEXT NOT NULL,
  filename TEXT NOT NULL,
  content_type TEXT NOT NULL,
  url TEXT,
  storage_key TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (intake_job_id) REFERENCES intake_jobs(id)
);

CREATE INDEX IF NOT EXISTS idx_intake_images_job
  ON intake_images (intake_job_id);
`;

export function resolveDatabasePath(
  pathOverride = process.env[databasePathEnvVar] ??
    process.env[legacyDatabasePathEnvVar] ??
    defaultDatabasePath
): string {
  return resolve(repoRoot, pathOverride);
}

export function openDatabase(pathOverride?: string): DatabaseSync {
  const databasePath = resolveDatabasePath(pathOverride);
  mkdirSync(dirname(databasePath), { recursive: true });
  return new DatabaseSync(databasePath);
}

export function initializeDatabase(
  database: DatabaseSync,
  options?: {
    enableForeignKeys?: boolean;
  }
): void {
  if (options?.enableForeignKeys ?? true) {
    database.exec("PRAGMA foreign_keys = ON;");
  }

  database.exec(schemaSql);
  ensureColumn(
    database,
    "intake_jobs",
    "candidates_json",
    "TEXT NOT NULL DEFAULT '[]'"
  );
  ensureColumn(database, "inventory_items", "estimated_price_usd", "REAL");
  ensureColumn(database, "inventory_items", "price_tier", "TEXT");
}

function ensureColumn(
  database: DatabaseSync,
  tableName: string,
  columnName: string,
  columnDefinition: string
): void {
  const tableInfo = database
    .prepare(`PRAGMA table_info(${tableName})`)
    .all() as Array<{ name: string }>;

  if (tableInfo.some((column) => column.name === columnName)) {
    return;
  }

  database.exec(
    `ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnDefinition};`
  );
}
