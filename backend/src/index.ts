import "dotenv/config";
import { startIndexer } from "./indexer.js";
import { startApi } from "./api.js";

async function main() {
  console.log("=== BulwArc Backend ===");
  await startIndexer();
  startApi();
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
