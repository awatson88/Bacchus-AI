import type { FastifyInstance } from "fastify";
import {
  approveIntakeJobRequestSchema,
  createIntakeRequestSchema,
  intakeJobQuerySchema,
  updateIntakeCandidateSchema
} from "@bartendergpt/domain";
import type { BartenderGptAppContext } from "../lib/appContext.js";

function omitUndefined<T extends Record<string, unknown>>(value: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(value).filter(([, entry]) => entry !== undefined)
  ) as Partial<T>;
}

export function intakeRoutes(context: BartenderGptAppContext) {
  return async function intakePlugin(app: FastifyInstance) {
    app.post("/jobs", async (request, reply) => {
      const payload = createIntakeRequestSchema.parse(request.body);
      const job = await context.inventoryStore.createIntakeJob(payload);

      return reply.code(202).send({
        job,
        nextStep:
          job.status === "needs_review"
            ? "Review each detected bottle candidate, reject any extras, then approve the ones you want to add."
            : "Awaiting richer extraction before approval."
      });
    });

    app.get("/jobs", async (request) => {
      const query = intakeJobQuerySchema.parse(request.query);
      const jobs = await context.inventoryStore.listIntakeJobs(query);
      return {
        count: jobs.length,
        jobs
      };
    });

    app.get("/jobs/:id", async (request, reply) => {
      const params = request.params as { id: string };
      const job = await context.inventoryStore.getIntakeJob(params.id);
      if (!job) {
        return reply.notFound("Intake job not found.");
      }

      return { job };
    });

    app.patch("/jobs/:id/candidates/:candidateId", async (request, reply) => {
      const params = request.params as { id: string; candidateId: string };
      const patch = omitUndefined(
        updateIntakeCandidateSchema.parse(request.body ?? {})
      );
      const job = await context.inventoryStore.updateIntakeJobCandidate(
        params.id,
        params.candidateId,
        patch
      );

      if (!job) {
        return reply.notFound("Intake job or candidate not found.");
      }

      return { job };
    });

    app.post("/jobs/:id/reprocess", async (request, reply) => {
      const params = request.params as { id: string };
      const job = await context.inventoryStore.reprocessIntakeJob(params.id);

      if (!job) {
        return reply.notFound("Intake job not found.");
      }

      return { job };
    });

    app.post("/jobs/:id/approve", async (request, reply) => {
      const params = request.params as { id: string };
      const approvalRequest = omitUndefined(
        approveIntakeJobRequestSchema.parse(request.body ?? {})
      );
      const approved = await context.inventoryStore.approveIntakeJob(
        params.id,
        approvalRequest
      );

      if (!approved) {
        return reply.badRequest(
          "Unable to approve the selected bottle candidates. Add missing bottle fields or choose valid pending candidates."
        );
      }

      return {
        job: approved.job,
        createdCount: approved.created.length,
        created: approved.created
      };
    });
  };
}
