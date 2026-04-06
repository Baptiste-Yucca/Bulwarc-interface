import {
  createPublicClient,
  createWalletClient,
  http,
  type Address,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { arcTestnet, BULWARC_ADDRESS, BULWARC_ABI } from "./config.js";
import db from "./db.js";

const SETTLE_ABI = [
  {
    type: "function",
    name: "settle",
    inputs: [{ name: "shieldId", type: "uint256" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
] as const;

const POLL_INTERVAL = 10_000; // 10s

export function startSettler() {
  const pk = process.env.AI_AGENT_PRIVATE_KEY;
  if (!pk || pk.length < 10) {
    console.log("[Settler] No AI_AGENT_PRIVATE_KEY configured — settler disabled");
    return;
  }

  const account = privateKeyToAccount(pk as `0x${string}`);
  console.log(`[Settler] Agent address: ${account.address}`);

  const publicClient = createPublicClient({
    chain: arcTestnet,
    transport: http(),
  });

  const walletClient = createWalletClient({
    account,
    chain: arcTestnet,
    transport: http(),
  });

  async function checkAndSettle() {
    try {
      // Find shields that are PENDING (1) or LOCKED (2) and past expiry
      const now = Math.floor(Date.now() / 1000);
      const candidates = db.prepare(
        "SELECT id, expiry, status FROM shields WHERE status IN (1, 2) AND CAST(expiry AS INTEGER) <= ?"
      ).all(now) as { id: number; expiry: string; status: number }[];

      if (candidates.length === 0) return;

      console.log(`[Settler] Found ${candidates.length} settleable shield(s)`);

      for (const c of candidates) {
        try {
          // Simulate first to check if it will revert
          await publicClient.simulateContract({
            address: BULWARC_ADDRESS,
            abi: SETTLE_ABI,
            functionName: "settle",
            args: [BigInt(c.id)],
            account: account,
          });

          // Execute
          const hash = await walletClient.writeContract({
            address: BULWARC_ADDRESS,
            abi: SETTLE_ABI,
            functionName: "settle",
            args: [BigInt(c.id)],
          });

          console.log(`[Settler] Settled shield #${c.id} — tx: ${hash}`);

          await publicClient.waitForTransactionReceipt({ hash });
          console.log(`[Settler] Shield #${c.id} confirmed`);
        } catch (err: any) {
          // Don't spam logs for shields that can't be settled yet
          const msg = err?.shortMessage || err?.message || "";
          if (msg.includes("revert")) {
            // Expected — shield not yet settleable (e.g. delivery not set)
          } else {
            console.error(`[Settler] Failed to settle #${c.id}:`, msg);
          }
        }
      }
    } catch (err) {
      console.error("[Settler] Poll error:", err);
    }
  }

  // Initial check + poll
  checkAndSettle();
  setInterval(checkAndSettle, POLL_INTERVAL);
}
