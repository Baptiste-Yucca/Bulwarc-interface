import "dotenv/config";
import { startIndexer } from "./indexer.js";
import { startApi } from "./api.js";
import { startSettler } from "./settler.js";
import db from "./db.js";

async function main() {
  console.log("=== BulwArc Backend ===");
  await startIndexer();
  startApi();
  startSettler();
}

// Graceful shutdown — close SQLite so tsx watch can kill cleanly
function shutdown() {
  console.log("\nShutting down...");
  try { db.close(); } catch {}
  process.exit(0);
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
