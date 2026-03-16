import {
  PrismaClient,
  type Prisma
} from "@prisma/client";
import type {
  InventoryCategory,
  InventoryQuery,
  InventoryRecord,
  InventoryStatus
} from "@bacchus/domain";
import { demoInventory } from "../data/demoInventory.js";
import type { BacchusAppContext } from "./appContext.js";

export type StoreMode = "memory" | "prisma";

export type InventoryStore = {
  list(query?: InventoryQuery): Promise<InventoryRecord[]>;
  importRecords(
    records: InventoryRecord[],
    sourceSystem: "manual" | "cellartracker_import"
  ): Promise<InventoryRecord[]>;
  dispose(): Promise<void>;
};

type PrismaInventoryItemPayload = Prisma.InventoryItemGetPayload<{
  include: {
    location: true;
    variant: {
      include: {
        product: true;
      };
    };
  };
}>;

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
    _sourceSystem: "manual" | "cellartracker_import"
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
}

class PrismaInventoryStore implements InventoryStore {
  constructor(private readonly prisma: PrismaClient) {}

  private async listItemsWithRelations(where?: Prisma.InventoryItemWhereInput) {
    return this.prisma.inventoryItem.findMany({
      ...(where ? { where } : {}),
      include: {
        location: true,
        variant: {
          include: {
            product: true
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    });
  }

  async list(query?: InventoryQuery): Promise<InventoryRecord[]> {
    const where: Prisma.InventoryItemWhereInput = {};
    if (query?.status) {
      where.status = mapStatusToPrisma(query.status);
    }
    if (query?.bin) {
      where.bin = query.bin;
    }
    if (query?.location) {
      where.location = {
        name: query.location
      };
    }
    if (query?.category) {
      where.variant = {
        product: {
          category: mapCategoryToPrisma(query.category)
        }
      };
    }

    const items = await this.listItemsWithRelations(where);
    return items.map(mapPrismaInventoryItem);
  }

  async importRecords(
    records: InventoryRecord[],
    sourceSystem: "manual" | "cellartracker_import"
  ): Promise<InventoryRecord[]> {
    const created: InventoryRecord[] = [];

    for (const record of records) {
      const location = await this.ensureLocation(record.location);
      const product = await this.ensureProduct(record);
      const variant = await this.ensureVariant(product.id, record);
      const data: Prisma.InventoryItemCreateInput = {
        variant: {
          connect: {
            id: variant.id
          }
        },
        location: {
          connect: {
            id: location.id
          }
        },
        status: mapStatusToPrisma(record.status),
        sourceSystem:
          sourceSystem === "cellartracker_import"
            ? "CELLARTRACKER_IMPORT"
            : "MANUAL",
        ...(record.bin ? { bin: record.bin } : {}),
        ...(record.fillPercent !== undefined
          ? { fillPercent: record.fillPercent }
          : {}),
        ...(record.drinkFrom ? { drinkFrom: new Date(record.drinkFrom) } : {}),
        ...(record.drinkTo ? { drinkTo: new Date(record.drinkTo) } : {}),
        ...(record.qualityScore !== undefined
          ? { qualityScore: record.qualityScore }
          : {}),
        ...(record.confidence !== undefined
          ? { confidence: record.confidence }
          : {}),
        ...(record.notes ? { notes: record.notes } : {})
      };

      const inventoryItem = await this.prisma.inventoryItem.create({
        data,
        include: {
          location: true,
          variant: {
            include: {
              product: true
            }
          }
        }
      });

      created.push(mapPrismaInventoryItem(inventoryItem));
    }

    return created;
  }

  async dispose(): Promise<void> {
    await this.prisma.$disconnect();
  }

  private async ensureLocation(name: string) {
    const type = inferLocationType(name);
    return this.prisma.location.upsert({
      where: {
        name_type: {
          name,
          type
        }
      },
      update: {},
      create: {
        name,
        type
      }
    });
  }

  private async ensureProduct(record: InventoryRecord) {
    const existing = await this.prisma.product.findFirst({
      where: {
        category: mapCategoryToPrisma(record.category),
        producer: record.producer,
        name: record.label
      }
    });

    if (existing) {
      return existing;
    }

    return this.prisma.product.create({
      data: {
        category: mapCategoryToPrisma(record.category),
        producer: record.producer,
        name: record.label,
        grapeVarieties: record.grapeVarieties,
        ...(record.country ? { country: record.country } : {}),
        ...(record.region ? { region: record.region } : {}),
        ...(record.style ? { style: record.style } : {}),
        ...(record.baseSpirit ? { baseSpirit: record.baseSpirit } : {}),
        ...(record.abv !== undefined ? { defaultAbv: record.abv } : {})
      }
    });
  }

  private async ensureVariant(productId: string, record: InventoryRecord) {
    const where: Prisma.VariantWhereInput = {
      productId,
      bottlingName: record.label
    };
    if (record.vintage !== undefined) {
      where.vintage = record.vintage;
    }
    if (record.sizeMl !== undefined) {
      where.sizeMl = record.sizeMl;
    }

    const existing = await this.prisma.variant.findFirst({
      where
    });

    if (existing) {
      return existing;
    }

    return this.prisma.variant.create({
      data: {
        productId,
        bottlingName: record.label,
        ...(record.vintage !== undefined ? { vintage: record.vintage } : {}),
        ...(record.sizeMl !== undefined ? { sizeMl: record.sizeMl } : {}),
        ...(record.abv !== undefined ? { abv: record.abv } : {})
      }
    });
  }
}

function mapCategoryToPrisma(recordCategory: InventoryCategory) {
  return recordCategory.toUpperCase() as
    | "WINE"
    | "SPIRIT"
    | "LIQUEUR"
    | "APERITIF"
    | "BITTERS"
    | "SYRUP"
    | "MIXER";
}

function mapStatusToPrisma(recordStatus: InventoryStatus) {
  return recordStatus.toUpperCase() as
    | "SEALED"
    | "OPEN"
    | "LOW"
    | "EMPTY"
    | "CONSUMED"
    | "MISSING";
}

function inferLocationType(name: string) {
  const normalized = name.toLowerCase();
  if (normalized.includes("fridge")) {
    return "FRIDGE" as const;
  }

  if (normalized.includes("bar")) {
    return "BAR_CART" as const;
  }

  if (normalized.includes("kitchen")) {
    return "KITCHEN" as const;
  }

  if (normalized.includes("cabinet")) {
    return "CABINET" as const;
  }

  return "CELLAR" as const;
}

function mapPrismaInventoryItem(item: PrismaInventoryItemPayload): InventoryRecord {
  return {
    id: item.id,
    category: item.variant.product.category.toLowerCase() as InventoryRecord["category"],
    producer: item.variant.product.producer,
    label: item.variant.bottlingName ?? item.variant.product.name,
    vintage: item.variant.vintage ?? undefined,
    country: item.variant.product.country ?? undefined,
    region: item.variant.product.region ?? undefined,
    style: item.variant.product.style ?? undefined,
    grapeVarieties: item.variant.product.grapeVarieties,
    baseSpirit: item.variant.product.baseSpirit ?? undefined,
    sizeMl: item.variant.sizeMl ?? undefined,
    abv: item.variant.abv ?? item.variant.product.defaultAbv ?? undefined,
    location: item.location?.name ?? "Unassigned",
    bin: item.bin ?? undefined,
    status: item.status.toLowerCase() as InventoryRecord["status"],
    fillPercent: item.fillPercent ?? undefined,
    drinkFrom: item.drinkFrom?.toISOString(),
    drinkTo: item.drinkTo?.toISOString(),
    qualityScore: item.qualityScore ?? undefined,
    confidence: item.confidence ?? undefined,
    pairingTags: [],
    cocktailTags: [],
    notes: item.notes ?? undefined
  };
}

export async function createAppContext(): Promise<BacchusAppContext> {
  if (process.env.DATABASE_URL) {
    const prisma = new PrismaClient();

    try {
      await prisma.$connect();
      return {
        inventoryStore: new PrismaInventoryStore(prisma),
        storeMode: "prisma"
      };
    } catch (error) {
      console.warn(
        "DATABASE_URL is set but Prisma could not connect. Falling back to the in-memory inventory store.",
        error
      );
      await prisma.$disconnect().catch(() => undefined);
    }
  }

  return {
    inventoryStore: new InMemoryInventoryStore(demoInventory),
    storeMode: "memory"
  };
}
