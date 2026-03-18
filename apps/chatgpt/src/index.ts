import { bacchusToolCatalog } from "./tools.js";
import {
  bacchusConversationStarters,
  bacchusCustomGptInstructions
} from "./customGpt.js";

export function getBacchusTools() {
  return bacchusToolCatalog;
}

export function getBacchusCustomGptInstructions() {
  return bacchusCustomGptInstructions;
}

export function getBacchusConversationStarters() {
  return bacchusConversationStarters;
}

if (process.env.NODE_ENV !== "production") {
  console.log(
    `Bacchus ChatGPT tool scaffold loaded with ${bacchusToolCatalog.length} tools.`
  );
}
