import type { InventoryStore, StoreMode } from "./inventoryStore.js";

export type BartenderGptAppContext = {
  inventoryStore: InventoryStore;
  storeMode: StoreMode;
};
