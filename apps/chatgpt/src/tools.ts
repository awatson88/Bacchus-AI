export type BartenderGptToolDefinition = {
  name: string;
  description: string;
  inputExample: Record<string, unknown>;
};

export const bartenderGptToolCatalog: BartenderGptToolDefinition[] = [
  {
    name: "extract_intake_from_uploads",
    description: "Create a bottle-review job from images uploaded in ChatGPT and return detected wine or liquor candidates by number.",
    inputExample: {
      message: "Add these bottles to my bar inventory.",
      openaiFileIdRefs: ["file-uploaded-in-chatgpt"]
    }
  },
  {
    name: "review_intake_candidate",
    description: "Correct, keep pending, or reject one extracted bottle candidate before it is added to inventory.",
    inputExample: {
      jobId: "intake_123",
      candidateId: "candidate_2",
      decision: "rejected"
    }
  },
  {
    name: "approve_intake_candidates",
    description: "Approve one or more confirmed bottle candidates and write them into BartenderGPT inventory.",
    inputExample: {
      jobId: "intake_123",
      candidateIds: ["candidate_1", "candidate_2"]
    }
  },
  {
    name: "search_inventory",
    description: "Search current wine, spirits, and pantry inventory by category, status, or location.",
    inputExample: {
      category: "wine",
      location: "Wine Fridge"
    }
  },
  {
    name: "add_inventory_item",
    description: "Create a new bottle or pantry item from a confirmed intake result.",
    inputExample: {
      producer: "Vietti",
      label: "Barolo Castiglione",
      vintage: 2016,
      quantity: 2
    }
  },
  {
    name: "mark_item_consumed",
    description: "Mark one physical bottle as finished or consumed and append an inventory event.",
    inputExample: {
      itemId: "wine-barolo-2016"
    }
  },
  {
    name: "suggest_wines_for_meal",
    description: "Return the best in-stock wine candidates for a meal, mood, weather, and budget tier.",
    inputExample: {
      meal: "mushroom pasta",
      mood: "cozy",
      weatherSummary: "cool and rainy in Chicago",
      budgetPreference: "everyday"
    }
  },
  {
    name: "suggest_cocktails",
    description: "Return cocktails that can be made from current liquor inventory plus pantry assumptions.",
    inputExample: {
      mood: "tiki",
      weatherSummary: "warm spring evening",
      preferredBaseSpirit: "rum"
    }
  },
  {
    name: "get_drink_now_candidates",
    description: "List wines approaching or passing the end of their drink window.",
    inputExample: {}
  }
];
