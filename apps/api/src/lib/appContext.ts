import type { InventoryStore, StoreMode } from "./inventoryStore.js";

export type BacchusAppContext = {
  inventoryStore: InventoryStore;
  storeMode: StoreMode;
};
