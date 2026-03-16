import type { FastifyInstance } from "fastify";
import {
  getDrinkWindowUrgency,
  inventoryQuerySchema
} from "@bacchus/domain";
import type { BacchusAppContext } from "../lib/appContext.js";

export function inventoryRoutes(context: BacchusAppContext) {
  return async function inventoryPlugin(app: FastifyInstance) {
    app.get("/items", async (request) => {
      const query = inventoryQuerySchema.parse(request.query);
      const items = await context.inventoryStore.list(query);

      return {
        count: items.length,
        items
      };
    });

    app.get("/drink-now", async () => {
      const items = (await context.inventoryStore.list({ category: "wine" }))
        .map((item) => ({
          ...item,
          urgency: getDrinkWindowUrgency(item)
        }))
        .filter(
          (item) =>
            item.urgency === "drink_now" || item.urgency === "past_due"
        );

      return {
        count: items.length,
        items
      };
    });
  };
}
