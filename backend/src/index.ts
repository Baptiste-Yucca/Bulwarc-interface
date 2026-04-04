import "dotenv/config";
import { createPublicClient, http, type Log } from "viem";
import { arcTestnet, BULWARC_ADDRESS, BULWARC_EVENTS } from "./config.js";

const client = createPublicClient({
  chain: arcTestnet,
  transport: http(),
});

function formatUsdc(value: bigint): string {
  return `${(Number(value) / 1e6).toFixed(2)} USDC`;
}

function formatRate(value: bigint): string {
  return (Number(value) / 1e8).toFixed(4);
}

function short(addr: string): string {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function handleLog(log: Log) {
  const event = log as any;
  const name = event.eventName as string;
  const args = event.args;
  const block = event.blockNumber;

  const ts = new Date().toISOString();

  switch (name) {
    case "ShieldCreated":
      console.log(
        `[${ts}] SHIELD_CREATED #${args.shieldId} by ${short(args.subscriber)} | strike=${formatRate(args.strike)} notional=${formatUsdc(args.notional)} premium=${formatUsdc(args.premium)} block=${block}`
      );
      break;
    case "ShieldFunded":
      console.log(
        `[${ts}] SHIELD_FUNDED #${args.shieldId} by ${short(args.funder)} block=${block}`
      );
      break;
    case "ShieldFilled":
      console.log(
        `[${ts}] SHIELD_FILLED #${args.shieldId} guardian=${short(args.guardian)} amount=${formatUsdc(args.amount)} block=${block}`
      );
      break;
    case "ShieldLocked":
      console.log(
        `[${ts}] SHIELD_LOCKED #${args.shieldId} block=${block}`
      );
      break;
    case "ShieldExercised":
      console.log(
        `[${ts}] SHIELD_EXERCISED #${args.shieldId} payoff=${formatUsdc(args.payoff)} block=${block}`
      );
      break;
    case "ShieldExpired":
      console.log(
        `[${ts}] SHIELD_EXPIRED #${args.shieldId} block=${block}`
      );
      break;
    default:
      console.log(`[${ts}] UNKNOWN_EVENT`, log);
  }
}

async function main() {
  const blockNumber = await client.getBlockNumber();
  console.log(`BulwArc watcher started at block ${blockNumber}`);
  console.log(`Watching contract ${BULWARC_ADDRESS} on Arc Testnet`);
  console.log("---");

  client.watchContractEvent({
    address: BULWARC_ADDRESS,
    abi: BULWARC_EVENTS,
    onLogs: (logs) => {
      for (const log of logs) {
        handleLog(log);
      }
    },
    onError: (error) => {
      console.error("Watcher error:", error.message);
    },
    pollingInterval: 4_000,
  });
}

main().catch(console.error);
