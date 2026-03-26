import type { CreateIntakeRequest, IntakeCandidate } from "@bartendergpt/domain";

type ExtractedBottle = {
  category: IntakeCandidate["category"];
  producer?: string;
  label?: string;
  vintage?: number;
  baseSpirit?: string;
  style?: string;
  grapeVarieties?: string[];
  quantity?: number;
  confidence: number;
  reasoning?: string[];
  notes?: string;
};

const brandMatchers = [
  {
    keyword: "cynar",
    category: "liqueur",
    producer: "Cynar",
    label: "Amaro"
  },
  {
    keyword: "campari",
    category: "aperitif",
    producer: "Campari",
    label: "Campari"
  },
  {
    keyword: "aperol",
    category: "aperitif",
    producer: "Aperol",
    label: "Aperol"
  },
  {
    keyword: "chartreuse",
    category: "liqueur",
    producer: "Chartreuse",
    label: "Liqueur"
  },
  {
    keyword: "fernet",
    category: "liqueur",
    producer: "Fernet",
    label: "Amaro"
  }
] as const;

const spiritMatchers = [
  { keyword: "bourbon", category: "spirit", baseSpirit: "bourbon" },
  { keyword: "rye", category: "spirit", baseSpirit: "rye" },
  { keyword: "scotch", category: "spirit", baseSpirit: "scotch" },
  { keyword: "whiskey", category: "spirit", baseSpirit: "whiskey" },
  { keyword: "whisky", category: "spirit", baseSpirit: "whisky" },
  { keyword: "gin", category: "spirit", baseSpirit: "gin" },
  { keyword: "rum", category: "spirit", baseSpirit: "rum" },
  { keyword: "tequila", category: "spirit", baseSpirit: "tequila" },
  { keyword: "mezcal", category: "spirit", baseSpirit: "mezcal" },
  { keyword: "vodka", category: "spirit", baseSpirit: "vodka" },
  { keyword: "amaro", category: "liqueur", baseSpirit: undefined },
  { keyword: "vermouth", category: "aperitif", baseSpirit: undefined },
  { keyword: "bitters", category: "bitters", baseSpirit: undefined },
  { keyword: "syrup", category: "syrup", baseSpirit: undefined }
] as const;

const wineHints = [
  "cabernet",
  "pinot",
  "chardonnay",
  "barolo",
  "riesling",
  "champagne",
  "wine"
];

function omitUndefined<T extends Record<string, unknown>>(value: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(value).filter(([, entry]) => entry !== undefined)
  ) as Partial<T>;
}

function buildCandidate(
  bottle: ExtractedBottle,
  request: CreateIntakeRequest,
  index: number
): IntakeCandidate {
  return {
    id: `candidate_${index + 1}`,
    decision: "pending",
    approvedItemIds: [],
    category: bottle.category,
    producer: bottle.producer,
    label: bottle.label,
    vintage: bottle.vintage,
    baseSpirit: bottle.baseSpirit,
    style: bottle.style,
    grapeVarieties: bottle.grapeVarieties ?? [],
    location: request.location,
    quantity: bottle.quantity ?? 1,
    confidence: bottle.confidence,
    notes: bottle.notes,
    reasoning: bottle.reasoning ?? []
  };
}

export function heuristicExtractCandidates(
  request: CreateIntakeRequest
): IntakeCandidate[] {
  const message = request.message.trim();
  const segments = message
    .split(/\s*(?:,|;|\n| and | & )\s*/i)
    .map((segment) => segment.trim())
    .filter(Boolean);

  const candidateInputs = segments.length > 1 ? segments : [message];
  const candidates = candidateInputs
    .map((segment, index) =>
      heuristicExtractSingleCandidate(
        segment,
        {
          ...request,
          quantity: segments.length > 1 ? 1 : request.quantity
        },
        index
      )
    )
    .filter((candidate): candidate is IntakeCandidate => Boolean(candidate));

  const deduped = new Map<string, IntakeCandidate>();
  for (const candidate of candidates) {
    const key = [
      candidate.category,
      candidate.producer ?? "",
      candidate.label ?? "",
      candidate.vintage ?? "",
      candidate.baseSpirit ?? ""
    ].join("|");
    if (!deduped.has(key)) {
      deduped.set(key, candidate);
    }
  }

  return [...deduped.values()];
}

function heuristicExtractSingleCandidate(
  message: string,
  request: CreateIntakeRequest,
  index: number
): IntakeCandidate | undefined {
  const lower = message.toLowerCase();
  const reasons: string[] = [];

  const matchedBrand = brandMatchers.find((entry) => lower.includes(entry.keyword));
  const matchedSpirit = spiritMatchers.find((entry) =>
    lower.includes(entry.keyword)
  );

  let category: IntakeCandidate["category"] | undefined;
  let baseSpirit: string | undefined;
  let producer: string | undefined;
  let label: string | undefined;

  if (matchedBrand) {
    category = matchedBrand.category;
    producer = matchedBrand.producer;
    label = matchedBrand.label;
    reasons.push(`Detected "${matchedBrand.keyword}" in the message.`);
  } else if (matchedSpirit) {
    category = matchedSpirit.category;
    baseSpirit = matchedSpirit.baseSpirit;
    reasons.push(`Detected "${matchedSpirit.keyword}" in the message.`);
  } else if (wineHints.some((hint) => lower.includes(hint))) {
    category = "wine";
    reasons.push("Detected wine-related keywords in the message.");
  }

  if (!category) {
    return undefined;
  }

  const vintageMatch = message.match(/\b(19|20)\d{2}\b/);
  const cleanedMessage = message
    .replace(
      /\b(i just bought|bought|new bottle of|bottle of|picked up|just grabbed|this is|this)\b/gi,
      ""
    )
    .replace(/^\s*(a|an)\s+/i, "")
    .replace(/\bfor the [a-z ]+$/i, "")
    .replace(/\s+/g, " ")
    .trim();

  if (!producer || !label) {
    const parts = cleanedMessage
      .split(/[-,:]/)
      .map((part) => part.trim())
      .filter(Boolean);

    if (parts.length >= 2) {
      [producer, label] = parts;
    } else {
      const words = cleanedMessage
        .replace(/\b(19|20)\d{2}\b/g, "")
        .trim()
        .split(/\s+/);
      if (!producer && words.length >= 3) {
        producer = words.slice(0, 2).join(" ");
        label = words.slice(2).join(" ");
      } else if (!label) {
        label = cleanedMessage || undefined;
      }
    }
  }

  if (!matchedBrand && matchedSpirit?.keyword === "amaro" && cleanedMessage) {
    const words = cleanedMessage.split(/\s+/);
    producer = words[0];
    label = "Amaro";
  }

  const candidate = buildCandidate(
    omitUndefined({
      category,
      producer,
      label,
      vintage: vintageMatch ? Number(vintageMatch[0]) : undefined,
      baseSpirit,
      quantity: request.quantity,
      confidence: matchedBrand ? 0.9 : matchedSpirit ? 0.82 : 0.68,
      reasoning: reasons,
      notes:
        request.images.length > 0
          ? "Image-based extraction is stubbed for now; this candidate is based primarily on message text."
          : undefined
    }) as ExtractedBottle,
    request,
    index
  );

  return candidate;
}

export async function extractIntakeCandidates(
  request: CreateIntakeRequest
): Promise<IntakeCandidate[]> {
  const openAiApiKey = process.env.OPENAI_API_KEY;
  const usableImages = request.images.filter((image) => image.url);

  if (!openAiApiKey || usableImages.length === 0) {
    return heuristicExtractCandidates(request);
  }

  const model = process.env.OPENAI_VISION_MODEL ?? "gpt-4o-mini";

  const input = [
    {
      role: "user",
      content: [
        {
          type: "input_text",
          text:
            "You are extracting bottles from shopping photos. Detect each distinct bottle product visible across the provided images. Return one entry per distinct bottle product, not per photo. Include quantity when multiple copies of the same bottle appear. Focus on wine, spirits, liqueurs, aperitifs, bitters, syrups, and mixers. Keep confidence conservative."
        },
        {
          type: "input_text",
          text: `User hint: ${request.message}. Preferred storage location: ${
            request.location ?? "unknown"
          }.`
        },
        ...usableImages.map((image) => ({
          type: "input_image",
          image_url: image.url as string
        }))
      ]
    }
  ];

  const schema = {
    type: "object",
    additionalProperties: false,
    properties: {
      bottles: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            category: {
              type: "string",
              enum: [
                "wine",
                "spirit",
                "liqueur",
                "aperitif",
                "bitters",
                "syrup",
                "mixer"
              ]
            },
            producer: { type: "string" },
            label: { type: "string" },
            vintage: { type: "integer" },
            baseSpirit: { type: "string" },
            style: { type: "string" },
            grapeVarieties: {
              type: "array",
              items: { type: "string" }
            },
            quantity: { type: "integer" },
            confidence: { type: "number" },
            reasoning: {
              type: "array",
              items: { type: "string" }
            },
            notes: { type: "string" }
          },
          required: ["category", "confidence"]
        }
      }
    },
    required: ["bottles"]
  };

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openAiApiKey}`
      },
      body: JSON.stringify({
        model,
        input,
        text: {
          format: {
            type: "json_schema",
            name: "intake_bottle_candidates",
            strict: true,
            schema
          }
        }
      })
    });

    if (!response.ok) {
      return heuristicExtractCandidates(request);
    }

    const payload = (await response.json()) as { output_text?: string };
    const parsed = JSON.parse(payload.output_text ?? "{}") as {
      bottles?: ExtractedBottle[];
    };

    const bottles = (parsed.bottles ?? []).filter(
      (bottle) => bottle.category && bottle.confidence !== undefined
    );

    if (bottles.length === 0) {
      return heuristicExtractCandidates(request);
    }

    return bottles.map((bottle, index) => buildCandidate(bottle, request, index));
  } catch {
    return heuristicExtractCandidates(request);
  }
}
