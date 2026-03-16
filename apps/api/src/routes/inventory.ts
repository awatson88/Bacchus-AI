import type { FastifyInstance } from "fastify";
import {
  createInventoryEventRequestSchema,
  createInventoryItemRequestSchema,
  getDrinkWindowUrgency,
  inventoryQuerySchema,
  updateInventoryItemRequestSchema
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

    app.get("/items/:id", async (request, reply) => {
      const params = request.params as { id: string };
      const item = await context.inventoryStore.getById(params.id);
      if (!item) {
        return reply.notFound("Inventory item not found.");
      }

      return { item };
    });

    app.post("/items", async (request, reply) => {
      const payload = createInventoryItemRequestSchema.parse(request.body);
      const created = await context.inventoryStore.createItems(payload);

      return reply.code(201).send({
        createdCount: created.length,
        items: created
      });
    });

    app.patch("/items/:id", async (request, reply) => {
      const params = request.params as { id: string };
      const payload = updateInventoryItemRequestSchema.parse(request.body);
      const item = await context.inventoryStore.updateItem(params.id, payload);

      if (!item) {
        return reply.notFound("Inventory item not found.");
      }

      return { item };
    });

    app.get("/items/:id/events", async (request, reply) => {
      const params = request.params as { id: string };
      const item = await context.inventoryStore.getById(params.id);
      if (!item) {
        return reply.notFound("Inventory item not found.");
      }

      const events = await context.inventoryStore.listEvents(params.id);
      return {
        count: events.length,
        events
      };
    });

    app.post("/items/:id/events", async (request, reply) => {
      const params = request.params as { id: string };
      const payload = createInventoryEventRequestSchema.parse(request.body);
      const item = await context.inventoryStore.createEvent(params.id, payload);

      if (!item) {
        return reply.notFound("Inventory item not found.");
      }

      return { item };
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
