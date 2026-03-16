import Fastify from "fastify";
import cors from "@fastify/cors";
import sensible from "@fastify/sensible";
import { healthRoutes } from "./routes/health.js";
import { intakeRoutes } from "./routes/intake.js";
import { inventoryRoutes } from "./routes/inventory.js";
import { recommendationRoutes } from "./routes/recommendations.js";

export function buildApp() {
  const app = Fastify({
    logger: true
  });

  app.register(cors, {
    origin: true
  });
  app.register(sensible);

  app.register(healthRoutes, { prefix: "/health" });
  app.register(inventoryRoutes, { prefix: "/api/v1/inventory" });
  app.register(intakeRoutes, { prefix: "/api/v1/intake" });
  app.register(recommendationRoutes, { prefix: "/api/v1/recommendations" });

  return app;
}
