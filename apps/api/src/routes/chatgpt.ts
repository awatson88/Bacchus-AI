import type { FastifyInstance } from "fastify";
import {
  approveIntakeJobRequestSchema,
  createChatGptIntakeJobRequestSchema,
  getInventoryDisplayName,
  reviewChatGptIntakeCandidateRequestSchema,
  type IntakeCandidate,
  type IntakeJob,
  type OpenAiFileReferenceInput
} from "@bartendergpt/domain";
import {
  getBartenderGptConversationStarters,
  getBartenderGptCustomGptInstructions
} from "@bartendergpt/chatgpt";
import type { BartenderGptAppContext } from "../lib/appContext.js";
import { buildChatGptActionOpenApiSpec } from "../lib/chatgptActionSpec.js";

type NormalizedOpenAiFileReference = {
  id: string;
  name: string;
  mime_type: string;
  download_link: string;
};

function omitUndefined<T extends Record<string, unknown>>(value: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(value).filter(([, entry]) => entry !== undefined)
  ) as Partial<T>;
}

function normalizeOpenAiFileReferences(
  refs: OpenAiFileReferenceInput[]
): NormalizedOpenAiFileReference[] {
  return refs
    .map((value, index) => normalizeOpenAiFileReference(value, index))
    .filter(
      (value): value is NormalizedOpenAiFileReference => Boolean(value)
    );
}

function normalizeOpenAiFileReference(
  value: OpenAiFileReferenceInput,
  index: number
): NormalizedOpenAiFileReference | undefined {
  if (typeof value === "string") {
    return undefined;
  }

  if (!value || typeof value !== "object") {
    return undefined;
  }

  const downloadLink =
    getStringProperty(value, "download_link") ??
    getStringProperty(value, "downloadLink") ??
    getStringProperty(value, "url");

  if (!downloadLink) {
    return undefined;
  }

  return {
    id: getStringProperty(value, "id") ?? `chatgpt_file_${index + 1}`,
    name: getStringProperty(value, "name") ?? `upload_${index + 1}`,
    mime_type:
      getStringProperty(value, "mime_type") ??
      getStringProperty(value, "mimeType") ??
      "application/octet-stream",
    download_link: downloadLink
  };
}

function getStringProperty(
  value: Record<string, unknown>,
  key: string
): string | undefined {
  const property = value[key];
  return typeof property === "string" && property.length > 0
    ? property
    : undefined;
}

function summarizeCandidate(candidate: IntakeCandidate, index: number) {
  return {
    ordinal: index + 1,
    candidateId: candidate.id,
    displayName:
      [candidate.vintage, candidate.producer, candidate.label]
        .filter(Boolean)
        .join(" ") || `Unlabeled ${candidate.category}`,
    category: candidate.category,
    producer: candidate.producer ?? null,
    label: candidate.label ?? null,
    vintage: candidate.vintage ?? null,
    country: candidate.country ?? null,
    region: candidate.region ?? null,
    estimatedPriceUsd: candidate.estimatedPriceUsd ?? null,
    priceTier: candidate.priceTier ?? null,
    quantity: candidate.quantity,
    confidence: candidate.confidence,
    decision: candidate.decision,
    reasoning: candidate.reasoning,
    notes: candidate.notes ?? null
  };
}

function summarizeJob(job: IntakeJob) {
  const candidates = job.candidates.map(summarizeCandidate);
  return {
    intakeJobId: job.id,
    status: job.status,
    extractedBottleCount: candidates.length,
    candidates,
    nextStep:
      candidates.length === 0
        ? "No bottles were confidently extracted. Ask the user for clearer images or add the bottles manually."
        : "Ask the user which candidate numbers to add, skip, or correct, then call the review or approve actions.",
    confirmationExamples: [
      "Add all of them.",
      "Add bottles 1 and 2 only.",
      "Reject bottle 3.",
      "Bottle 2 is actually Cynar 70."
    ]
  };
}

function buildServerUrl(request: {
  headers: Record<string, string | string[] | undefined>;
}): string {
  const forwardedProto = request.headers["x-forwarded-proto"];
  const protocol =
    typeof forwardedProto === "string" && forwardedProto.length > 0
      ? forwardedProto
      : "http";
  const host = request.headers.host ?? "localhost:3000";
  const hostValue = Array.isArray(host) ? host[0] : host;
  return `${protocol}://${hostValue}`;
}

export function chatGptRoutes(context: BartenderGptAppContext) {
  return async function chatGptPlugin(app: FastifyInstance) {
    app.get("/openapi.json", async (request, reply) => {
      return reply.send(buildChatGptActionOpenApiSpec(buildServerUrl(request)));
    });

    app.get("/instructions", async () => {
      return {
        name: "BartenderGPT",
        summary:
          "Use BartenderGPT to extract bottles from uploaded photos, confirm each candidate with the user, then approve selected bottles into inventory.",
        instructions: getBartenderGptCustomGptInstructions(),
        conversationStarters: getBartenderGptConversationStarters()
      };
    });

    app.get("/instructions.txt", async (request, reply) => {
      reply.header("content-type", "text/plain; charset=utf-8");
      return getBartenderGptCustomGptInstructions();
    });

    app.post("/intake/extract", async (request, reply) => {
      const payload = createChatGptIntakeJobRequestSchema.parse(request.body);
      const fileRefs = normalizeOpenAiFileReferences(payload.openaiFileIdRefs);

      request.log.info(
        {
          message: payload.message,
          openaiFileIdRefs: payload.openaiFileIdRefs,
          normalizedFileRefs: fileRefs
        },
        "Received ChatGPT intake extract request."
      );

      if (fileRefs.length === 0) {
        return reply.badRequest(
          "No usable uploaded files were provided. ChatGPT should send openaiFileIdRefs with download links."
        );
      }

      const job = await context.inventoryStore.createIntakeJob({
        message: payload.message,
        location: payload.location,
        quantity: 1,
        images: fileRefs.map((fileRef) => ({
          filename: fileRef.name,
          contentType: fileRef.mime_type,
          url: fileRef.download_link
        }))
      });

      return {
        ...summarizeJob(job),
        sourceFiles: fileRefs.map((fileRef) => ({
          id: fileRef.id,
          name: fileRef.name,
          mimeType: fileRef.mime_type
        }))
      };
    });

    app.post("/intake/jobs/:jobId/review", async (request, reply) => {
      const params = request.params as { jobId: string };
      const payload = reviewChatGptIntakeCandidateRequestSchema.parse(
        request.body ?? {}
      );
      const job = await context.inventoryStore.updateIntakeJobCandidate(
        params.jobId,
        payload.candidateId,
        omitUndefined({
          decision: payload.decision,
          category: payload.category,
          producer: payload.producer,
          label: payload.label,
          vintage: payload.vintage,
          country: payload.country,
          region: payload.region,
          baseSpirit: payload.baseSpirit,
          style: payload.style,
          grapeVarieties: payload.grapeVarieties,
          drinkFrom: payload.drinkFrom,
          drinkTo: payload.drinkTo,
          qualityScore: payload.qualityScore,
          estimatedPriceUsd: payload.estimatedPriceUsd,
          priceTier: payload.priceTier,
          location: payload.location,
          bin: payload.bin,
          quantity: payload.quantity,
          confidence: payload.confidence,
          notes: payload.notes,
          reasoning: payload.reasoning
        })
      );

      if (!job) {
        return reply.notFound("Intake job or candidate not found.");
      }

      return summarizeJob(job);
    });

    app.post("/intake/jobs/:jobId/approve", async (request, reply) => {
      const params = request.params as { jobId: string };
      const payload = approveIntakeJobRequestSchema.parse(request.body ?? {});
      const approved = await context.inventoryStore.approveIntakeJob(
        params.jobId,
        payload
      );

      if (!approved) {
        return reply.badRequest(
          "Unable to approve the selected bottle candidates."
        );
      }

      return {
        ...summarizeJob(approved.job),
        createdCount: approved.created.length,
        createdItems: approved.created.map((item) => ({
          itemId: item.id,
          displayName: getInventoryDisplayName(item),
          category: item.category,
          location: item.location,
          status: item.status
        }))
      };
    });
  };
}
