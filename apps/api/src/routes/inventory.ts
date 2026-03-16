import type { FastifyInstance } from "fastify";
import {
  getDrinkWindowUrgency,
  inventoryQuerySchema
} from "@bacchus/domain";
import { demoInventory } from "../data/demoInventory.js";

export async function inventoryRoutes(app: FastifyInstance) {
  app.get("/items", async (request) => {
    const query = inventoryQuerySchema.parse(request.query);

    const items = demoInventory.filter((item) => {
      if (query.category && item.category !== query.category) {
        return false;
      }

      if (query.location && item.location !== query.location) {
        return false;
      }

      if (query.status && item.status !== query.status) {
        return false;
      }

      return true;
    });

    return {
      count: items.length,
      items
    };
  });

  app.get("/drink-now", async () => {
    const items = demoInventory
      .filter((item) => item.category === "wine")
      .map((item) => ({
        ...item,
        urgency: getDrinkWindowUrgency(item)
      }))
      .filter((item) => item.urgency === "drink_now" || item.urgency === "past_due");

    return {
      count: items.length,
      items
    };
  });
}
