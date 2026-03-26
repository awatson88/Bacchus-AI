import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { BartenderGptAppContext } from "../lib/appContext.js";
import { parseCellarTrackerCsv } from "../lib/cellarTrackerImport.js";

const cellarTrackerImportSchema = z.object({
  csv: z.string().min(1),
  locationOverride: z.string().optional(),
  maxPreviewRows: z.number().int().positive().max(25).default(10)
});

export function importRoutes(context: BartenderGptAppContext) {
  return async function importPlugin(app: FastifyInstance) {
    app.post("/cellartracker/preview", async (request) => {
      const payload = cellarTrackerImportSchema.parse(request.body);
      const preview = parseCellarTrackerCsv(
        payload.csv,
        payload.locationOverride
          ? {
              locationOverride: payload.locationOverride
            }
          : undefined
      );

      return {
        headers: preview.headers,
        totalRows: preview.totalRows,
        expandedBottleCount: preview.expandedBottleCount,
        warnings: preview.warnings,
        preview: preview.records.slice(0, payload.maxPreviewRows)
      };
    });

    app.post("/cellartracker/commit", async (request) => {
      const payload = cellarTrackerImportSchema.parse(request.body);
      const parsed = parseCellarTrackerCsv(
        payload.csv,
        payload.locationOverride
          ? {
              locationOverride: payload.locationOverride
            }
          : undefined
      );
      const created = await context.inventoryStore.importRecords(
        parsed.records,
        "cellartracker_import"
      );
      await context.inventoryStore.recordImportRun(
        "cellartracker",
        parsed.totalRows,
        parsed.expandedBottleCount,
        parsed.warnings
      );

      return {
        totalRows: parsed.totalRows,
        expandedBottleCount: parsed.expandedBottleCount,
        warnings: parsed.warnings,
        createdCount: created.length,
        created: created.slice(0, payload.maxPreviewRows)
      };
    });
  };
}
