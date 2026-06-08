import type { FastifyInstance } from "fastify";
import {
  createWorkoutRequestSchema,
  similarWorkoutQuerySchema,
  workoutMovementSummaryQuerySchema,
  workoutQuerySchema
} from "@bartendergpt/domain";
import type { BartenderGptAppContext } from "../lib/appContext.js";

export function workoutRoutes(context: BartenderGptAppContext) {
  return async function workoutPlugin(app: FastifyInstance) {
    app.post("/", async (request, reply) => {
      const payload = createWorkoutRequestSchema.parse(request.body);
      const workout = await context.workoutStore.create(payload);

      return reply.code(201).send({ workout });
    });

    app.get("/", async (request) => {
      const query = workoutQuerySchema.parse(request.query);
      const workouts = await context.workoutStore.list(query);

      return {
        count: workouts.length,
        workouts
      };
    });

    app.get("/similar", async (request) => {
      const query = similarWorkoutQuerySchema.parse(request.query);
      const results = await context.workoutStore.findSimilar(query);

      return {
        count: results.length,
        results
      };
    });

    app.get("/movements/summary", async (request) => {
      const query = workoutMovementSummaryQuerySchema.parse(request.query);
      const movements = await context.workoutStore.summarizeMovements(query);

      return {
        count: movements.length,
        movements
      };
    });

    app.get("/:id", async (request, reply) => {
      const params = request.params as { id: string };
      const workout = await context.workoutStore.getById(params.id);
      if (!workout) {
        return reply.notFound("Workout not found.");
      }

      return { workout };
    });
  };
}
