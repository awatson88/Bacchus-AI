export type BacchusToolDefinition = {
  name: string;
  description: string;
  inputExample: Record<string, unknown>;
};

export const bacchusToolCatalog: BacchusToolDefinition[] = [
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
    description: "Mark a bottle as finished or empty and append an inventory event.",
    inputExample: {
      itemId: "wine-barolo-2016"
    }
  },
  {
    name: "suggest_wines_for_meal",
    description: "Return the best in-stock wine candidates for a meal, mood, and weather.",
    inputExample: {
      meal: "mushroom pasta",
      mood: "cozy",
      weatherSummary: "cool and rainy in Chicago"
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
