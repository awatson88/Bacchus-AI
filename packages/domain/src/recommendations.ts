import { z } from "zod";
import {
  getEffectiveWinePriceTier,
  getDrinkWindowUrgency,
  getInventoryDisplayName,
  inventoryRecordSchema,
  winePriceTierSchema,
  type InventoryRecord,
  type WinePriceTier
} from "./inventory.js";

export const winePairingRequestSchema = z.object({
  meal: z.string().min(1),
  mood: z.string().optional(),
  weatherSummary: z.string().optional(),
  budgetPreference: winePriceTierSchema.optional(),
  maxResults: z.number().int().positive().max(5).default(3)
});

export const wineRecommendationSchema = z.object({
  itemId: z.string(),
  displayName: z.string(),
  score: z.number(),
  urgency: z.enum(["past_due", "drink_now", "hold", "unknown"]),
  estimatedPriceUsd: z.number().positive().optional(),
  priceTier: winePriceTierSchema.optional(),
  reasons: z.array(z.string())
});

export const cocktailSuggestionRequestSchema = z.object({
  mood: z.string().optional(),
  weatherSummary: z.string().optional(),
  preferredBaseSpirit: z.string().optional(),
  maxResults: z.number().int().positive().max(5).default(3),
  assumedPantry: z.array(z.string()).default([
    "lime",
    "lemon",
    "simple syrup",
    "sugar",
    "ice",
    "orange peel"
  ])
});

export const cocktailRecommendationSchema = z.object({
  name: z.string(),
  score: z.number(),
  matchedIngredients: z.array(z.string()),
  missingIngredients: z.array(z.string()),
  reasons: z.array(z.string())
});

export type WinePairingRequest = z.infer<typeof winePairingRequestSchema>;
export type WineRecommendation = z.infer<typeof wineRecommendationSchema>;
export type CocktailSuggestionRequest = z.infer<
  typeof cocktailSuggestionRequestSchema
>;
export type CocktailRecommendation = z.infer<
  typeof cocktailRecommendationSchema
>;

type RecipeDefinition = {
  name: string;
  ingredients: string[];
  tags: string[];
};

const wineInputSchema = z.array(inventoryRecordSchema);
const cocktailInputSchema = z.array(inventoryRecordSchema);

const starterCocktails: RecipeDefinition[] = [
  {
    name: "Negroni",
    ingredients: ["gin", "sweet vermouth", "campari"],
    tags: ["stirred", "aperitivo", "balanced"]
  },
  {
    name: "Old Fashioned",
    ingredients: ["bourbon", "bitters", "sugar", "orange peel"],
    tags: ["stirred", "boozy", "cold-weather"]
  },
  {
    name: "Daiquiri",
    ingredients: ["rum", "lime", "simple syrup"],
    tags: ["refreshing", "warm-weather", "classic"]
  },
  {
    name: "Margarita",
    ingredients: ["tequila", "orange liqueur", "lime"],
    tags: ["citrusy", "party", "warm-weather"]
  },
  {
    name: "Manhattan",
    ingredients: ["rye", "sweet vermouth", "bitters"],
    tags: ["stirred", "nightcap", "classic"]
  },
  {
    name: "Jungle Bird",
    ingredients: ["rum", "campari", "pineapple juice", "lime", "simple syrup"],
    tags: ["tiki", "warm-weather", "playful"]
  }
];

function normalize(value: string | undefined): string {
  return value?.trim().toLowerCase() ?? "";
}

function includesAny(haystack: string, needles: string[]): boolean {
  return needles.some((needle) => haystack.includes(needle));
}

function getWineDescriptor(record: InventoryRecord): string {
  return normalize(
    [
      record.producer,
      record.label,
      record.style,
      record.region,
      record.country,
      record.grapeVarieties.join(" "),
      record.pairingTags.join(" ")
    ].join(" ")
  );
}

function getInventoryDescriptor(record: InventoryRecord): string {
  return normalize(
    [
      record.category,
      record.producer,
      record.label,
      record.baseSpirit,
      record.style,
      record.pairingTags.join(" "),
      record.cocktailTags.join(" ")
    ].join(" ")
  );
}

function inferBudgetPreference(request: WinePairingRequest): {
  priceTier?: WinePriceTier;
  source?: "explicit" | "mood";
} {
  if (request.budgetPreference) {
    return {
      priceTier: request.budgetPreference,
      source: "explicit"
    };
  }

  const mood = normalize(request.mood);
  if (!mood) {
    return {};
  }

  if (
    includesAny(mood, [
      "weekday",
      "weeknight",
      "tuesday",
      "wednesday",
      "thursday",
      "casual",
      "easy",
      "pizza night"
    ])
  ) {
    return {
      priceTier: "everyday",
      source: "mood"
    };
  }

  if (
    includesAny(mood, [
      "date night",
      "anniversary",
      "celebration",
      "special occasion",
      "fancy",
      "birthday"
    ])
  ) {
    return {
      priceTier: "special",
      source: "mood"
    };
  }

  if (includesAny(mood, ["splurge", "treat ourselves", "ball out"])) {
    return {
      priceTier: "splurge",
      source: "mood"
    };
  }

  return {};
}

function scoreWineCandidate(
  record: InventoryRecord,
  request: WinePairingRequest
): WineRecommendation {
  const descriptor = getWineDescriptor(record);
  const meal = normalize(request.meal);
  const mood = normalize(request.mood);
  const weather = normalize(request.weatherSummary);
  const requestedBudget = inferBudgetPreference(request);
  const priceTier = getEffectiveWinePriceTier(record);
  const reasons: string[] = [];
  let score = 55;

  if (
    includesAny(meal, ["steak", "lamb", "burger", "short rib", "braise"]) &&
    includesAny(descriptor, ["cabernet", "nebbiolo", "syrah", "barolo", "bold"])
  ) {
    score += 20;
    reasons.push("Structured red profile should stand up to richer meat dishes.");
  }

  if (
    includesAny(meal, ["salmon", "fish", "seafood", "oyster", "shrimp"]) &&
    includesAny(descriptor, ["chablis", "chardonnay", "sauvignon", "champagne", "sparkling"])
  ) {
    score += 20;
    reasons.push("Bright acidity and freshness line up well with seafood.");
  }

  if (
    includesAny(meal, ["pizza", "pasta", "tomato", "mushroom", "truffle"]) &&
    includesAny(descriptor, ["pinot noir", "sangiovese", "nebbiolo", "barbera"])
  ) {
    score += 16;
    reasons.push("This should play nicely with savory tomato or mushroom flavors.");
  }

  if (
    includesAny(meal, ["spicy", "thai", "curry", "sichuan"]) &&
    includesAny(descriptor, ["riesling", "sparkling", "off-dry", "rose"])
  ) {
    score += 18;
    reasons.push("A fresher or slightly softer style helps with heat and spice.");
  }

  if (
    includesAny(weather, ["warm", "sunny", "hot", "spring", "summer"]) &&
    includesAny(descriptor, ["sparkling", "pinot noir", "chablis", "sauvignon", "fresh"])
  ) {
    score += 10;
    reasons.push("The style feels right for a warmer day.");
  }

  if (
    includesAny(weather, ["cold", "snow", "winter"]) &&
    includesAny(descriptor, ["cabernet", "syrah", "nebbiolo", "oaked", "rich"])
  ) {
    score += 10;
    reasons.push("A broader, deeper style fits colder weather well.");
  }

  if (includesAny(mood, ["celebration", "festive", "fun"]) && includesAny(descriptor, ["sparkling", "champagne"])) {
    score += 8;
    reasons.push("Sparkling always plays well when the mood is celebratory.");
  }

  if (requestedBudget.priceTier && priceTier) {
    if (requestedBudget.priceTier === "everyday") {
      if (priceTier === "everyday") {
        score += 12;
        reasons.push("This stays in everyday-bottle territory for a casual night.");
      } else if (priceTier === "special") {
        score -= 4;
        reasons.push("It is a bit nicer than an everyday bottle, so it may be better saved.");
      } else {
        score -= 18;
        reasons.push("This reads more like a splurge bottle than a Tuesday-night pick.");
      }
    } else if (requestedBudget.priceTier === "special") {
      if (priceTier === "special") {
        score += 10;
        reasons.push("The bottle value lines up well with a nicer dinner.");
      } else if (priceTier === "splurge") {
        score += 4;
        reasons.push("This leans upscale enough for a bigger occasion.");
      } else {
        score -= 8;
        reasons.push("It may drink more casually than the occasion calls for.");
      }
    } else if (requestedBudget.priceTier === "splurge") {
      if (priceTier === "splurge") {
        score += 12;
        reasons.push("This fits the brief for opening something truly special.");
      } else if (priceTier === "special") {
        score += 4;
        reasons.push("This is still a strong special-occasion bottle.");
      } else {
        score -= 10;
        reasons.push("It is more everyday than splurge-tier.");
      }
    }
  } else if (
    requestedBudget.priceTier === "everyday" &&
    requestedBudget.source === "mood" &&
    record.estimatedPriceUsd !== undefined
  ) {
    reasons.push("Budget preference was inferred from the casual mood.");
  }

  const urgency = getDrinkWindowUrgency(record);
  if (urgency === "past_due") {
    score += 18;
    reasons.push("This bottle is already past its ideal window, so it should be prioritized.");
  } else if (urgency === "drink_now") {
    score += 12;
    reasons.push("It is in or near its prime drinking window.");
  }

  if (reasons.length === 0) {
    reasons.push("It is a solid all-around match from the current inventory.");
  }

  return {
    itemId: record.id,
    displayName: getInventoryDisplayName(record),
    score,
    urgency,
    estimatedPriceUsd: record.estimatedPriceUsd,
    priceTier,
    reasons
  };
}

function inventoryMatchesIngredient(record: InventoryRecord, ingredient: string): boolean {
  const descriptor = getInventoryDescriptor(record);
  const target = normalize(ingredient);

  if (descriptor.includes(target)) {
    return true;
  }

  const category = normalize(record.category);
  const spirit = normalize(record.baseSpirit);

  if (["gin", "rum", "tequila", "mezcal", "vodka", "bourbon", "rye"].includes(target)) {
    return spirit === target || category === "spirit" && descriptor.includes(target);
  }

  if (target === "orange liqueur") {
    return includesAny(descriptor, ["cointreau", "triple sec", "curacao", "orange liqueur"]);
  }

  if (target === "sweet vermouth") {
    return includesAny(descriptor, ["sweet vermouth", "carpano", "vermouth rosso"]);
  }

  if (target === "campari") {
    return descriptor.includes("campari");
  }

  if (target === "bitters") {
    return category === "bitters" || descriptor.includes("bitters");
  }

  return false;
}

function getRecipeScore(
  recipe: RecipeDefinition,
  inventory: InventoryRecord[],
  request: CocktailSuggestionRequest
): CocktailRecommendation {
  const assumedPantry = new Set(request.assumedPantry.map(normalize));
  const mood = normalize(request.mood);
  const weather = normalize(request.weatherSummary);
  const preferredBaseSpirit = normalize(request.preferredBaseSpirit);
  const matchedIngredients: string[] = [];
  const missingIngredients: string[] = [];
  const reasons: string[] = [];
  let score = 60;

  for (const ingredient of recipe.ingredients) {
    if (inventory.some((record) => inventoryMatchesIngredient(record, ingredient))) {
      matchedIngredients.push(ingredient);
      continue;
    }

    if (assumedPantry.has(normalize(ingredient))) {
      matchedIngredients.push(ingredient);
      reasons.push(`Assuming pantry staple: ${ingredient}.`);
      score -= 2;
      continue;
    }

    missingIngredients.push(ingredient);
    score -= 18;
  }

  if (preferredBaseSpirit && recipe.ingredients.some((ingredient) => normalize(ingredient) === preferredBaseSpirit)) {
    score += 12;
    reasons.push(`Matches the requested base spirit: ${preferredBaseSpirit}.`);
  }

  if (
    includesAny(weather, ["warm", "sunny", "spring", "summer"]) &&
    recipe.tags.some((tag) => ["warm-weather", "refreshing", "tiki"].includes(tag))
  ) {
    score += 10;
    reasons.push("The drink style fits warmer weather.");
  }

  if (
    includesAny(weather, ["cold", "winter", "snow"]) &&
    recipe.tags.some((tag) => ["stirred", "boozy", "nightcap", "cold-weather"].includes(tag))
  ) {
    score += 10;
    reasons.push("The drink leans naturally into colder weather.");
  }

  if (includesAny(mood, ["tiki", "vacation", "playful"]) && recipe.tags.includes("tiki")) {
    score += 8;
    reasons.push("It aligns well with a tiki or vacation mood.");
  }

  if (includesAny(mood, ["classic", "serious", "quiet"]) && recipe.tags.includes("stirred")) {
    score += 6;
    reasons.push("A stirred classic works well for that mood.");
  }

  if (missingIngredients.length === 0) {
    reasons.push("You have everything needed on hand.");
  }

  return {
    name: recipe.name,
    score,
    matchedIngredients,
    missingIngredients,
    reasons
  };
}

export function recommendWines(
  input: WinePairingRequest,
  inventory: InventoryRecord[]
): WineRecommendation[] {
  const request = winePairingRequestSchema.parse(input);
  const wines = wineInputSchema
    .parse(inventory)
    .filter((record) => record.category === "wine" && !["empty", "consumed", "missing"].includes(record.status));

  return wines
    .map((record) => scoreWineCandidate(record, request))
    .sort((left, right) => right.score - left.score)
    .slice(0, request.maxResults);
}

export function recommendCocktails(
  input: CocktailSuggestionRequest,
  inventory: InventoryRecord[]
): CocktailRecommendation[] {
  const request = cocktailSuggestionRequestSchema.parse(input);
  const records = cocktailInputSchema
    .parse(inventory)
    .filter((record) => !["empty", "consumed", "missing"].includes(record.status));

  return starterCocktails
    .map((recipe) => getRecipeScore(recipe, records, request))
    .sort((left, right) => right.score - left.score)
    .slice(0, request.maxResults);
}
