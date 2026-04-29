import type { FastifyInstance } from "fastify";
import { mobileManifest, renderMobileAppHtml } from "../lib/mobileApp.js";

export function mobileRoutes() {
  return async function mobilePlugin(app: FastifyInstance) {
    app.get("/mobile", async (request, reply) => {
      reply.header("content-type", "text/html; charset=utf-8");
      return reply.send(renderMobileAppHtml());
    });

    app.get("/mobile/", async (request, reply) => {
      reply.header("content-type", "text/html; charset=utf-8");
      return reply.send(renderMobileAppHtml());
    });

    app.get("/mobile/manifest.webmanifest", async (request, reply) => {
      reply.header("content-type", "application/manifest+json; charset=utf-8");
      return reply.send(mobileManifest);
    });
  };
}
