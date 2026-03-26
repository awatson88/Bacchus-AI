import type { FastifyInstance } from "fastify";
import {
  cocktailSuggestionRequestSchema,
  recommendCocktails,
  recommendWines,
  winePairingRequestSchema
} from "@bartendergpt/domain";
import type { BartenderGptAppContext } from "../lib/appContext.js";

export function recommendationRoutes(context: BartenderGptAppContext) {
  return async function recommendationPlugin(app: FastifyInstance) {
    app.post("/wine", async (request) => {
      const payload = winePairingRequestSchema.parse(request.body);
      const inventory = await context.inventoryStore.list();
      const recommendations = recommendWines(payload, inventory);

      return {
        meal: payload.meal,
        mood: payload.mood ?? null,
        weatherSummary: payload.weatherSummary ?? null,
        recommendations
      };
    });

    app.post("/cocktails", async (request) => {
      const payload = cocktailSuggestionRequestSchema.parse(request.body);
      const inventory = await context.inventoryStore.list();
      const recommendations = recommendCocktails(payload, inventory);

      return {
        mood: payload.mood ?? null,
        weatherSummary: payload.weatherSummary ?? null,
        preferredBaseSpirit: payload.preferredBaseSpirit ?? null,
        recommendations
      };
    });
  };
}
