import { parse } from "csv-parse/sync";
import type { InventoryRecord } from "@bartendergpt/domain";

type ParsedCsvRow = Record<string, string>;

export type CellarTrackerPreview = {
  headers: string[];
  totalRows: number;
  expandedBottleCount: number;
  warnings: string[];
  records: InventoryRecord[];
};

const headerAliases = {
  vintage: ["vintage"],
  producer: ["producer", "winery", "vineyard"],
  label: [
    "wine",
    "wine name",
    "name",
    "designation",
    "label",
    "master description"
  ],
  country: ["country"],
  region: ["region", "appellation"],
  location: ["location", "storage location"],
  bin: ["bin", "storage bin"],
  style: ["type", "wine type"],
  varietal: ["varietal", "variety", "grape varieties", "grapes"],
  quantity: ["quantity", "qty", "in stock", "count"],
  size: ["size", "bottle size"],
  score: ["score", "community score", "reviewer score", "rating"],
  notes: ["notes", "private notes", "tasting note"],
  drinkFrom: ["drink from", "begin consume", "window start", "from"],
  drinkTo: ["drink to", "end consume", "window end", "to"]
} as const;

function normalizeHeader(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function buildRowLookup(row: ParsedCsvRow): Map<string, string> {
  return new Map(
    Object.entries(row).map(([key, value]) => [normalizeHeader(key), value?.trim() ?? ""])
  );
}

function pickValue(
  lookup: Map<string, string>,
  aliases: readonly string[]
): string | undefined {
  for (const alias of aliases) {
    const value = lookup.get(normalizeHeader(alias));
    if (value) {
      return value;
    }
  }

  return undefined;
}

function parseYear(value: string | undefined): number | undefined {
  if (!value) {
    return undefined;
  }

  const match = value.match(/\b(19|20)\d{2}\b/);
  if (!match) {
    return undefined;
  }

  return Number(match[0]);
}

function parseBottleSize(value: string | undefined): number | undefined {
  if (!value) {
    return undefined;
  }

  const normalized = value.toLowerCase().replace(/\s+/g, "");
  if (normalized.endsWith("ml")) {
    return Number(normalized.replace("ml", ""));
  }

  if (normalized.endsWith("l")) {
    return Math.round(Number(normalized.replace("l", "")) * 1000);
  }

  const maybeNumber = Number(normalized);
  return Number.isFinite(maybeNumber) ? maybeNumber : undefined;
}

function parseScore(value: string | undefined): number | undefined {
  if (!value) {
    return undefined;
  }

  const match = value.match(/\d+(\.\d+)?/);
  return match ? Number(match[0]) : undefined;
}

function parseWindowDate(
  value: string | undefined,
  position: "start" | "end"
): string | undefined {
  if (!value) {
    return undefined;
  }

  const trimmed = value.trim();
  if (/^\d{4}$/.test(trimmed)) {
    return position === "start"
      ? `${trimmed}-01-01T00:00:00.000Z`
      : `${trimmed}-12-31T00:00:00.000Z`;
  }

  const parsed = new Date(trimmed);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString();
}

function splitVarietals(value: string | undefined): string[] {
  if (!value) {
    return [];
  }

  return value
    .split(/[;,/]/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function buildLabel(
  producer: string,
  explicitLabel: string | undefined,
  masterDescription: string | undefined,
  vintage: number | undefined
): string {
  if (explicitLabel) {
    return explicitLabel;
  }

  if (!masterDescription) {
    return "Unknown wine";
  }

  let label = masterDescription;
  if (vintage) {
    label = label.replace(String(vintage), "").trim();
  }

  if (producer) {
    const producerPattern = new RegExp(`^${producer}\\s+`, "i");
    label = label.replace(producerPattern, "").trim();
  }

  return label || masterDescription;
}

export function parseCellarTrackerCsv(
  csv: string,
  options?: {
    locationOverride?: string;
  }
): CellarTrackerPreview {
  const rows = parse(csv, {
    bom: true,
    columns: true,
    relax_column_count: true,
    skip_empty_lines: true,
    trim: true
  }) as ParsedCsvRow[];

  const warnings: string[] = [];
  const records: InventoryRecord[] = [];
  const headers = rows[0] ? Object.keys(rows[0]) : [];

  rows.forEach((row, index) => {
    const lookup = buildRowLookup(row);
    const vintage = parseYear(pickValue(lookup, headerAliases.vintage));
    const producer = pickValue(lookup, headerAliases.producer) ?? "Unknown producer";
    const masterDescription = pickValue(lookup, ["master description"]);
    const label = buildLabel(
      producer,
      pickValue(lookup, headerAliases.label),
      masterDescription,
      vintage
    );

    if (!label) {
      warnings.push(`Row ${index + 1} was skipped because no wine name could be found.`);
      return;
    }

    const location =
      options?.locationOverride ??
      pickValue(lookup, headerAliases.location) ??
      "Imported Cellar";
    const bin = pickValue(lookup, headerAliases.bin);
    const quantity = Math.max(
      Number.parseInt(pickValue(lookup, headerAliases.quantity) ?? "1", 10) || 1,
      1
    );

    for (let bottleIndex = 0; bottleIndex < quantity; bottleIndex += 1) {
      records.push({
        id: `ct_${crypto.randomUUID()}`,
        category: "wine",
        producer,
        label,
        vintage,
        country: pickValue(lookup, headerAliases.country),
        region: pickValue(lookup, headerAliases.region),
        style: pickValue(lookup, headerAliases.style),
        grapeVarieties: splitVarietals(pickValue(lookup, headerAliases.varietal)),
        sizeMl: parseBottleSize(pickValue(lookup, headerAliases.size)),
        location,
        bin,
        status: "sealed",
        drinkFrom: parseWindowDate(
          pickValue(lookup, headerAliases.drinkFrom),
          "start"
        ),
        drinkTo: parseWindowDate(pickValue(lookup, headerAliases.drinkTo), "end"),
        qualityScore: parseScore(pickValue(lookup, headerAliases.score)),
        confidence: 0.9,
        pairingTags: [],
        cocktailTags: [],
        notes: pickValue(lookup, headerAliases.notes)
      });
    }
  });

  return {
    headers,
    totalRows: rows.length,
    expandedBottleCount: records.length,
    warnings,
    records
  };
}
