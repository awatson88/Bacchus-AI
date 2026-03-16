import type { FastifyInstance } from "fastify";
import { createIntakeRequestSchema } from "@bacchus/domain";

export async function intakeRoutes(app: FastifyInstance) {
  app.post("/jobs", async (request, reply) => {
    const payload = createIntakeRequestSchema.parse(request.body);
    const jobId = `intake_${crypto.randomUUID()}`;

    return reply.code(202).send({
      jobId,
      status: "queued",
      receivedAt: new Date().toISOString(),
      summary: {
        quantity: payload.quantity,
        imageCount: payload.images.length,
        message: payload.message,
        location: payload.location ?? null
      },
      nextStep: "Run vision extraction, candidate matching, and review if confidence is low."
    });
  });
}
