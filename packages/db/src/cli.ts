import { initializeDatabase, openDatabase, resolveDatabasePath } from "./index.js";

const database = openDatabase();

try {
  initializeDatabase(database);
  console.log(`SQLite database initialized at ${resolveDatabasePath()}`);
} finally {
  database.close();
}
