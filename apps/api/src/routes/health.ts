import type { FastifyInstance } from "fastify";
import type { BartenderGptAppContext } from "../lib/appContext.js";

export function healthRoutes(context: BartenderGptAppContext) {
  return async function healthPlugin(app: FastifyInstance) {
    app.get("/", async () => {
      const inventoryCount = (await context.inventoryStore.list()).length;

      return {
        ok: true,
        service: "bartendergpt-api",
        storeMode: context.storeMode,
        inventoryCount,
        timestamp: new Date().toISOString()
      };
    });
  };
}
