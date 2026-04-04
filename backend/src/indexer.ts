import { createPublicClient, http, type Log } from "viem";
import {
  arcTestnet,
  BULWARC_ADDRESS,
  BULWARC_ABI,
  ORACLE_ADDRESS,
  ORACLE_ABI,
  DEPLOY_BLOCK,
} from "./config.js";
import db, {
  getLastIndexedBlock,
  setLastIndexedBlock,
  upsertShield,
  insertEvent,
  insertFill,
} from "./db.js";

const client = createPublicClient({
  chain: arcTestnet,
  transport: http(),
});

/** Fetch full shield state from chain and upsert into DB */
async function syncShield(shieldId: number, createdTx?: string, createdAt?: number) {
  const data = await client.readContract({
    address: BULWARC_ADDRESS,
    abi: BULWARC_ABI,
    functionName: "getShield",
    args: [BigInt(shieldId)],
  });

  upsertShield({
    id: shieldId,
    subscriber: data.subscriber,
    strike: data.strike.toString(),
    notional: data.notional.toString(),
    premium: data.premium.toString(),
    subscriberFee: data.subscriberFee.toString(),
    filled: data.filled.toString(),
    expiry: data.expiry.toString(),
    deliveryRate: data.deliveryRate,
    validator: data.validator,
    isReverse: data.isReverse,
    status: data.status,
    createdTx,
    createdAt,
  });

  // Fills are inserted via ShieldFilled events only — no duplicate sync
}

/** Process a single event log */
async function processLog(log: Log, blockTimestamp: number) {
  const event = log as any;
  const name = event.eventName as string;
  const args = event.args;
  const shieldId = Number(args.shieldId);
  const txHash = log.transactionHash || "";
  const blockNumber = Number(log.blockNumber || 0);

  insertEvent({
    eventName: name,
    shieldId,
    txHash,
    blockNumber,
    blockTimestamp,
    args,
  });

  if (name === "ShieldFilled") {
    insertFill({
      shieldId,
      guardian: args.guardian,
      amount: args.amount.toString(),
      txHash,
    });
  }

  // Re-sync shield state from chain after any event
  const createdTx = name === "ShieldCreated" ? txHash : undefined;
  const createdAt = name === "ShieldCreated" ? blockTimestamp : undefined;
  await syncShield(shieldId, createdTx, createdAt);

  console.log(`  [${name}] shield #${shieldId} block=${blockNumber}`);
}

const CHUNK_SIZE = 9_999n; // RPC limited to 10,000 block range

/** Catch up on historical events from lastBlock to latest */
async function catchUp() {
  const lastBlock = getLastIndexedBlock();
  const latestBlock = await client.getBlockNumber();

  if (lastBlock >= latestBlock) {
    console.log(`Already up to date at block ${latestBlock}`);
    return latestBlock;
  }

  let from = lastBlock > 0n ? lastBlock + 1n : DEPLOY_BLOCK;
  console.log(`Catching up: block ${from} → ${latestBlock}`);
  let totalEvents = 0;

  while (from <= latestBlock) {
    const to = from + CHUNK_SIZE > latestBlock ? latestBlock : from + CHUNK_SIZE;

    const logs = await client.getContractEvents({
      address: BULWARC_ADDRESS,
      abi: BULWARC_ABI,
      fromBlock: from,
      toBlock: to,
    });

    if (logs.length > 0) {
      // Get block timestamps
      const uniqueBlocks = [...new Set(logs.map((l) => l.blockNumber).filter((b): b is bigint => b != null))];
      const blockTimestamps = new Map<bigint, number>();
      for (const bn of uniqueBlocks) {
        const block = await client.getBlock({ blockNumber: bn });
        blockTimestamps.set(bn, Number(block.timestamp));
      }

      for (const log of logs) {
        const ts = blockTimestamps.get(log.blockNumber!) ?? 0;
        await processLog(log, ts);
      }
      totalEvents += logs.length;
    }

    setLastIndexedBlock(to);
    from = to + 1n;
  }

  console.log(`  Indexed ${totalEvents} events up to block ${latestBlock}`);
  return latestBlock;
}

/** Also do a full shield sync to pick up any shields we may have missed */
async function fullShieldSync() {
  const count = await client.readContract({
    address: BULWARC_ADDRESS,
    abi: BULWARC_ABI,
    functionName: "getShieldCount",
  });
  const n = Number(count);
  console.log(`Full sync: ${n} shields on chain`);
  for (let i = 0; i < n; i++) {
    await syncShield(i);
  }
}

/** Watch for new events in real-time */
function watchLive() {
  console.log("Watching for new events...");

  client.watchContractEvent({
    address: BULWARC_ADDRESS,
    abi: BULWARC_ABI,
    onLogs: async (logs) => {
      for (const log of logs) {
        const bn = log.blockNumber;
        let ts = Math.floor(Date.now() / 1000);
        if (bn != null) {
          try {
            const block = await client.getBlock({ blockNumber: bn });
            ts = Number(block.timestamp);
          } catch {}
        }
        await processLog(log, ts);
        if (bn != null) setLastIndexedBlock(bn);
      }
    },
    onError: (error) => {
      console.error("Watcher error:", error.message);
    },
    pollingInterval: 4_000,
  });
}

/** Get oracle price (cached, refreshed every 10s) */
let cachedOraclePrice = { price: "0", updatedAt: 0 };

async function refreshOracle() {
  try {
    const [price, updatedAt] = await client.readContract({
      address: ORACLE_ADDRESS,
      abi: ORACLE_ABI,
      functionName: "getPrice",
    });
    cachedOraclePrice = {
      price: price.toString(),
      updatedAt: Number(updatedAt),
    };
  } catch (e) {
    console.error("Oracle fetch error:", e);
  }
}

export function getOraclePrice() {
  return cachedOraclePrice;
}

/** Main entry point */
export async function startIndexer() {
  console.log(`Indexer starting for ${BULWARC_ADDRESS}`);

  // Clean up duplicate fills from previous sync bugs
  db.exec(`
    DELETE FROM fills WHERE rowid NOT IN (
      SELECT MIN(rowid) FROM fills GROUP BY shield_id, guardian, amount
    )
  `);

  await catchUp();
  await fullShieldSync();
  await refreshOracle();

  // Refresh oracle every 10s
  setInterval(refreshOracle, 10_000);

  watchLive();
}
