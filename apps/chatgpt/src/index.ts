import { bartenderGptToolCatalog } from "./tools.js";
import {
  bartenderGptConversationStarters,
  bartenderGptCustomGptInstructions
} from "./customGpt.js";

export function getBartenderGptTools() {
  return bartenderGptToolCatalog;
}

export function getBartenderGptCustomGptInstructions() {
  return bartenderGptCustomGptInstructions;
}

export function getBartenderGptConversationStarters() {
  return bartenderGptConversationStarters;
}

if (process.env.NODE_ENV !== "production") {
  console.log(
    `BartenderGPT ChatGPT tool scaffold loaded with ${bartenderGptToolCatalog.length} tools.`
  );
}
