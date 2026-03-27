import sharp from "sharp";
import type { CreateIntakeRequest, IntakeCandidate } from "@bartendergpt/domain";

type BoundingBox = {
  x: number;
  y: number;
  width: number;
  height: number;
};

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
  sourceImageIndex?: number;
  boundingBox?: BoundingBox;
};

const lowConfidenceThreshold = 0.84;
const modelDefault = "gpt-4o-mini";

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

function normalizeBoundingBox(value: unknown): BoundingBox | undefined {
  if (!value || typeof value !== "object") {
    return undefined;
  }

  const candidate = value as Record<string, unknown>;
  const x = normalizeUnitNumber(candidate.x);
  const y = normalizeUnitNumber(candidate.y);
  const width = normalizeUnitNumber(candidate.width);
  const height = normalizeUnitNumber(candidate.height);

  if (
    x === undefined ||
    y === undefined ||
    width === undefined ||
    height === undefined ||
    width <= 0 ||
    height <= 0
  ) {
    return undefined;
  }

  return { x, y, width, height };
}

function normalizeUnitNumber(value: unknown): number | undefined {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return undefined;
  }

  return Math.max(0, Math.min(1, value));
}

function normalizeExtractedBottle(value: unknown): ExtractedBottle | undefined {
  if (!value || typeof value !== "object") {
    return undefined;
  }

  const bottle = value as Record<string, unknown>;
  if (
    typeof bottle.category !== "string" ||
    typeof bottle.confidence !== "number"
  ) {
    return undefined;
  }

  return omitUndefined({
    category: bottle.category as IntakeCandidate["category"],
    producer: typeof bottle.producer === "string" ? bottle.producer : undefined,
    label: typeof bottle.label === "string" ? bottle.label : undefined,
    vintage:
      typeof bottle.vintage === "number" ? Math.trunc(bottle.vintage) : undefined,
    baseSpirit:
      typeof bottle.baseSpirit === "string" ? bottle.baseSpirit : undefined,
    style: typeof bottle.style === "string" ? bottle.style : undefined,
    grapeVarieties: Array.isArray(bottle.grapeVarieties)
      ? bottle.grapeVarieties.filter(
          (entry): entry is string => typeof entry === "string"
        )
      : undefined,
    quantity:
      typeof bottle.quantity === "number" ? Math.max(1, Math.trunc(bottle.quantity)) : undefined,
    confidence: Math.max(0, Math.min(1, bottle.confidence)),
    reasoning: Array.isArray(bottle.reasoning)
      ? bottle.reasoning.filter((entry): entry is string => typeof entry === "string")
      : undefined,
    notes: typeof bottle.notes === "string" ? bottle.notes : undefined,
    sourceImageIndex:
      typeof bottle.sourceImageIndex === "number"
        ? Math.max(0, Math.trunc(bottle.sourceImageIndex))
        : undefined,
    boundingBox: normalizeBoundingBox(bottle.boundingBox)
  }) as ExtractedBottle;
}

function needsRefinement(bottle: ExtractedBottle): boolean {
  if (bottle.confidence < lowConfidenceThreshold) {
    return true;
  }

  if (!bottle.producer || !bottle.label) {
    return true;
  }

  const ambiguousText = [
    bottle.producer,
    bottle.label,
    bottle.notes,
    ...(bottle.reasoning ?? [])
  ]
    .filter((entry): entry is string => Boolean(entry))
    .join(" ")
    .toLowerCase();

  return /(unclear|unknown|likely|approx|partial|blue label|can't read|cannot read)/.test(
    ambiguousText
  );
}

function mergeRefinedBottle(
  original: ExtractedBottle,
  refined: ExtractedBottle
): ExtractedBottle {
  return omitUndefined({
    ...original,
    producer: refined.producer ?? original.producer,
    label: refined.label ?? original.label,
    vintage: refined.vintage ?? original.vintage,
    baseSpirit: refined.baseSpirit ?? original.baseSpirit,
    style: refined.style ?? original.style,
    grapeVarieties:
      refined.grapeVarieties && refined.grapeVarieties.length > 0
        ? refined.grapeVarieties
        : original.grapeVarieties,
    quantity: refined.quantity ?? original.quantity,
    confidence: Math.max(original.confidence, refined.confidence),
    notes: refined.notes ?? original.notes,
    reasoning: [
      ...(original.reasoning ?? []),
      ...(refined.reasoning ?? []),
      "Refined from a cropped bottle image."
    ],
    sourceImageIndex: original.sourceImageIndex,
    boundingBox: original.boundingBox
  }) as ExtractedBottle;
}

function buildVisionRequest(
  textParts: string[],
  imageUrls: string[]
): Array<{
  role: string;
  content: Array<{ type: string; text?: string; image_url?: string }>;
}> {
  return [
    {
      role: "user",
      content: [
        ...textParts.map((text) => ({
          type: "input_text",
          text
        })),
        ...imageUrls.map((imageUrl) => ({
          type: "input_image",
          image_url: imageUrl
        }))
      ]
    }
  ];
}

async function runStructuredVisionRequest(
  model: string,
  openAiApiKey: string,
  input: ReturnType<typeof buildVisionRequest>,
  schemaName: string,
  schema: Record<string, unknown>
): Promise<unknown> {
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
          name: schemaName,
          strict: true,
          schema
        }
      }
    })
  });

  if (!response.ok) {
    throw new Error(`OpenAI vision request failed with status ${response.status}.`);
  }

  const payload = (await response.json()) as { output_text?: string };
  return JSON.parse(payload.output_text ?? "{}");
}

async function fetchImageBuffer(imageUrl: string): Promise<Buffer> {
  const response = await fetch(imageUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch image at ${imageUrl}.`);
  }

  return Buffer.from(await response.arrayBuffer());
}

async function cropImageToDataUrl(
  imageUrl: string,
  boundingBox: BoundingBox
): Promise<string | null> {
  const imageBuffer = await fetchImageBuffer(imageUrl);
  const image = sharp(imageBuffer, { failOn: "none" });
  const metadata = await image.metadata();

  if (!metadata.width || !metadata.height) {
    return null;
  }

  const width = metadata.width;
  const height = metadata.height;
  const padding = 0.08;

  const left = Math.max(0, Math.floor((boundingBox.x - padding) * width));
  const top = Math.max(0, Math.floor((boundingBox.y - padding) * height));
  const right = Math.min(
    width,
    Math.ceil((boundingBox.x + boundingBox.width + padding) * width)
  );
  const bottom = Math.min(
    height,
    Math.ceil((boundingBox.y + boundingBox.height + padding) * height)
  );

  const extractWidth = right - left;
  const extractHeight = bottom - top;
  if (extractWidth < 64 || extractHeight < 64) {
    return null;
  }

  const croppedBuffer = await image
    .extract({
      left,
      top,
      width: extractWidth,
      height: extractHeight
    })
    .jpeg({ quality: 88 })
    .toBuffer();

  return `data:image/jpeg;base64,${croppedBuffer.toString("base64")}`;
}

async function runInitialVisionPass(
  request: CreateIntakeRequest,
  usableImageUrls: string[],
  model: string,
  openAiApiKey: string
): Promise<ExtractedBottle[]> {
  const input = buildVisionRequest(
    [
      "You are extracting bottles from shopping photos. Detect each distinct bottle product visible across the provided images.",
      "Return one entry per distinct bottle product, not per photo. Include quantity when multiple copies of the same bottle appear.",
      "Focus on wine, spirits, liqueurs, aperitifs, bitters, syrups, and mixers. Keep confidence conservative.",
      "For each bottle, include an approximate normalized bounding box for the visible bottle in the source image. Use sourceImageIndex to indicate which input image contains the bottle crop.",
      `User hint: ${request.message}. Preferred storage location: ${
        request.location ?? "unknown"
      }.`
    ],
    usableImageUrls
  );

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
            notes: { type: "string" },
            sourceImageIndex: { type: "integer" },
            boundingBox: {
              type: "object",
              additionalProperties: false,
              properties: {
                x: { type: "number" },
                y: { type: "number" },
                width: { type: "number" },
                height: { type: "number" }
              },
              required: ["x", "y", "width", "height"]
            }
          },
          required: ["category", "confidence", "sourceImageIndex", "boundingBox"]
        }
      }
    },
    required: ["bottles"]
  };

  const parsed = (await runStructuredVisionRequest(
    model,
    openAiApiKey,
    input,
    "intake_bottle_candidates",
    schema
  )) as { bottles?: unknown[] };

  return (parsed.bottles ?? [])
    .map(normalizeExtractedBottle)
    .filter((bottle): bottle is ExtractedBottle => Boolean(bottle));
}

async function runRefinementPass(
  bottle: ExtractedBottle,
  croppedImageDataUrl: string,
  request: CreateIntakeRequest,
  model: string,
  openAiApiKey: string
): Promise<ExtractedBottle | null> {
  const input = buildVisionRequest(
    [
      "You are looking at a cropped image of a single bottle product.",
      "Identify the exact producer and label if readable. If text is partial or obscured, do not invent details.",
      "Prefer improving precision over recall. If you cannot confidently read a producer or label, leave it blank and explain why in notes or reasoning.",
      `Current guess: ${
        [bottle.producer, bottle.label].filter(Boolean).join(" ") ||
        "unknown bottle"
      }.`,
      `User hint: ${request.message}.`
    ],
    [croppedImageDataUrl]
  );

  const schema = {
    type: "object",
    additionalProperties: false,
    properties: {
      bottle: {
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
    },
    required: ["bottle"]
  };

  const parsed = (await runStructuredVisionRequest(
    model,
    openAiApiKey,
    input,
    "refined_bottle_candidate",
    schema
  )) as { bottle?: unknown };

  return normalizeExtractedBottle(parsed.bottle ?? null) ?? null;
}

async function refineAmbiguousBottles(
  bottles: ExtractedBottle[],
  request: CreateIntakeRequest,
  usableImageUrls: string[],
  model: string,
  openAiApiKey: string
): Promise<ExtractedBottle[]> {
  const nextBottles: ExtractedBottle[] = [];

  for (const bottle of bottles) {
    if (
      !needsRefinement(bottle) ||
      bottle.sourceImageIndex === undefined ||
      !bottle.boundingBox
    ) {
      nextBottles.push(bottle);
      continue;
    }

    const imageUrl = usableImageUrls[bottle.sourceImageIndex];
    if (!imageUrl) {
      nextBottles.push(bottle);
      continue;
    }

    try {
      const croppedImageDataUrl = await cropImageToDataUrl(
        imageUrl,
        bottle.boundingBox
      );
      if (!croppedImageDataUrl) {
        nextBottles.push(bottle);
        continue;
      }

      const refinedBottle = await runRefinementPass(
        bottle,
        croppedImageDataUrl,
        request,
        model,
        openAiApiKey
      );
      if (!refinedBottle) {
        nextBottles.push(bottle);
        continue;
      }

      nextBottles.push(mergeRefinedBottle(bottle, refinedBottle));
    } catch {
      nextBottles.push(bottle);
    }
  }

  return nextBottles;
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

  const matchedBrand = brandMatchers.find((entry) =>
    lower.includes(entry.keyword)
  );
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

  return buildCandidate(
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
}

export async function extractIntakeCandidates(
  request: CreateIntakeRequest
): Promise<IntakeCandidate[]> {
  const openAiApiKey = process.env.OPENAI_API_KEY;
  const usableImageUrls = request.images
    .map((image) => image.url)
    .filter((imageUrl): imageUrl is string => Boolean(imageUrl));

  if (!openAiApiKey || usableImageUrls.length === 0) {
    return heuristicExtractCandidates(request);
  }

  const model = process.env.OPENAI_VISION_MODEL ?? modelDefault;

  try {
    const bottles = await runInitialVisionPass(
      request,
      usableImageUrls,
      model,
      openAiApiKey
    );

    if (bottles.length === 0) {
      return heuristicExtractCandidates(request);
    }

    const refinedBottles = await refineAmbiguousBottles(
      bottles,
      request,
      usableImageUrls,
      model,
      openAiApiKey
    );

    return refinedBottles.map((bottle, index) =>
      buildCandidate(bottle, request, index)
    );
  } catch {
    return heuristicExtractCandidates(request);
  }
}
