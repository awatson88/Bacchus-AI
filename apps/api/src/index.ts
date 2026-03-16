import "dotenv/config";
import { buildApp } from "./app.js";
import { createAppContext } from "./lib/inventoryStore.js";

const port = Number(process.env.API_PORT ?? 3000);
const host = process.env.API_HOST ?? "0.0.0.0";

const context = await createAppContext();
const app = buildApp(context);

try {
  await app.listen({ port, host });
} catch (error) {
  app.log.error(error);
  process.exit(1);
}
