import type { FastifyInstance } from "fastify";
import type { BacchusAppContext } from "../lib/appContext.js";

export function healthRoutes(context: BacchusAppContext) {
  return async function healthPlugin(app: FastifyInstance) {
    app.get("/", async () => {
      const inventoryCount = (await context.inventoryStore.list()).length;

      return {
        ok: true,
        service: "bacchus-api",
        storeMode: context.storeMode,
        inventoryCount,
        timestamp: new Date().toISOString()
      };
    });
  };
}
