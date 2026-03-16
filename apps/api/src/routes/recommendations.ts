import type { FastifyInstance } from "fastify";
import {
  cocktailSuggestionRequestSchema,
  recommendCocktails,
  recommendWines,
  winePairingRequestSchema
} from "@bacchus/domain";
import { demoInventory } from "../data/demoInventory.js";

export async function recommendationRoutes(app: FastifyInstance) {
  app.post("/wine", async (request) => {
    const payload = winePairingRequestSchema.parse(request.body);
    const recommendations = recommendWines(payload, demoInventory);

    return {
      meal: payload.meal,
      mood: payload.mood ?? null,
      weatherSummary: payload.weatherSummary ?? null,
      recommendations
    };
  });

  app.post("/cocktails", async (request) => {
    const payload = cocktailSuggestionRequestSchema.parse(request.body);
    const recommendations = recommendCocktails(payload, demoInventory);

    return {
      mood: payload.mood ?? null,
      weatherSummary: payload.weatherSummary ?? null,
      preferredBaseSpirit: payload.preferredBaseSpirit ?? null,
      recommendations
    };
  });
}
