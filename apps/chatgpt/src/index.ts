import { bacchusToolCatalog } from "./tools.js";

export function getBacchusTools() {
  return bacchusToolCatalog;
}

if (process.env.NODE_ENV !== "production") {
  console.log(
    `Bacchus ChatGPT tool scaffold loaded with ${bacchusToolCatalog.length} tools.`
  );
}
