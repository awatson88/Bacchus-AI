import type { FastifyInstance } from "fastify";
import {
  createInventoryItemRequestSchema,
  createIntakeRequestSchema,
  type CreateInventoryItemRequest
} from "@bacchus/domain";
import type { BacchusAppContext } from "../lib/appContext.js";

const approveIntakeJobSchema = createInventoryItemRequestSchema.partial();

function omitUndefined<T extends Record<string, unknown>>(value: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(value).filter(([, entry]) => entry !== undefined)
  ) as Partial<T>;
}

export function intakeRoutes(context: BacchusAppContext) {
  return async function intakePlugin(app: FastifyInstance) {
    app.post("/jobs", async (request, reply) => {
      const payload = createIntakeRequestSchema.parse(request.body);
      const job = await context.inventoryStore.createIntakeJob(payload);

      return reply.code(202).send({
        job,
        nextStep:
          job.status === "needs_review"
            ? "Review and approve the candidate to add bottles into inventory."
            : "Awaiting richer extraction before approval."
      });
    });

    app.get("/jobs", async () => {
      const jobs = await context.inventoryStore.listIntakeJobs();
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

    app.post("/jobs/:id/approve", async (request, reply) => {
      const params = request.params as { id: string };
      const overrides = omitUndefined(
        approveIntakeJobSchema.parse(request.body ?? {})
      ) as Partial<CreateInventoryItemRequest>;
      const approved = await context.inventoryStore.approveIntakeJob(
        params.id,
        overrides
      );

      if (!approved) {
        return reply.badRequest(
          "Unable to approve the intake job. Add overrides for missing bottle fields."
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
