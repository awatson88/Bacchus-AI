import Fastify from "fastify";
import cors from "@fastify/cors";
import sensible from "@fastify/sensible";
import type { BacchusAppContext } from "./lib/appContext.js";
import { isAuthorizedRequest, shouldRequireApiAuth } from "./lib/auth.js";
import { chatGptRoutes } from "./routes/chatgpt.js";
import { healthRoutes } from "./routes/health.js";
import { importRoutes } from "./routes/imports.js";
import { intakeRoutes } from "./routes/intake.js";
import { inventoryRoutes } from "./routes/inventory.js";
import { recommendationRoutes } from "./routes/recommendations.js";

export function buildApp(context: BacchusAppContext) {
  const app = Fastify({
    logger: true
  });

  app.register(cors, {
    origin: true
  });
  app.register(sensible);

  app.addHook("onRequest", async (request, reply) => {
    const expectedToken = process.env.BACCHUS_API_TOKEN;
    if (!expectedToken || !shouldRequireApiAuth(request)) {
      return;
    }

    if (!isAuthorizedRequest(request, expectedToken)) {
      return reply.code(401).send({
        error: "Unauthorized",
        message: "Provide a valid Bearer token for Bacchus API access."
      });
    }
  });

  app.addHook("onClose", async () => {
    await context.inventoryStore.dispose();
  });

  app.register(chatGptRoutes(context), { prefix: "/api/v1/chatgpt" });
  app.register(healthRoutes(context), { prefix: "/health" });
  app.register(inventoryRoutes(context), { prefix: "/api/v1/inventory" });
  app.register(intakeRoutes(context), { prefix: "/api/v1/intake" });
  app.register(importRoutes(context), { prefix: "/api/v1/imports" });
  app.register(recommendationRoutes(context), {
    prefix: "/api/v1/recommendations"
  });

  return app;
}
