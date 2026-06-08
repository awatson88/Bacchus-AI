import type { InventoryStore, StoreMode } from "./inventoryStore.js";
import type { WorkoutStore } from "./workoutStore.js";

export type BartenderGptAppContext = {
  inventoryStore: InventoryStore;
  workoutStore: WorkoutStore;
  storeMode: StoreMode;
};
