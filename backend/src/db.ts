import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = process.env.DB_PATH || path.join(__dirname, "..", "bulwarc.db");

const db = new Database(DB_PATH);

// WAL mode for better concurrent read/write
db.pragma("journal_mode = WAL");

db.exec(`
  CREATE TABLE IF NOT EXISTS indexer_state (
    key   TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS events (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    event_name  TEXT NOT NULL,
    shield_id   INTEGER NOT NULL,
    tx_hash     TEXT NOT NULL,
    block_number INTEGER NOT NULL,
    block_timestamp INTEGER NOT NULL,
    args_json   TEXT NOT NULL,
    UNIQUE(tx_hash, event_name, shield_id)
  );

  CREATE TABLE IF NOT EXISTS shields (
    id              INTEGER PRIMARY KEY,
    subscriber      TEXT NOT NULL,
    strike          TEXT NOT NULL,
    notional        TEXT NOT NULL,
    premium         TEXT NOT NULL,
    subscriber_fee  TEXT NOT NULL DEFAULT '0',
    filled          TEXT NOT NULL DEFAULT '0',
    expiry          TEXT NOT NULL,
    delivery_rate   INTEGER NOT NULL DEFAULT 0,
    validator       TEXT NOT NULL DEFAULT '0x0000000000000000000000000000000000000000',
    is_reverse      INTEGER NOT NULL DEFAULT 0,
    status          INTEGER NOT NULL DEFAULT 0,
    created_tx      TEXT,
    created_at      INTEGER
  );

  CREATE TABLE IF NOT EXISTS fills (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    shield_id   INTEGER NOT NULL,
    guardian    TEXT NOT NULL,
    amount      TEXT NOT NULL,
    tx_hash     TEXT NOT NULL,
    UNIQUE(shield_id, guardian, tx_hash)
  );

  CREATE INDEX IF NOT EXISTS idx_events_shield ON events(shield_id);
  CREATE INDEX IF NOT EXISTS idx_shields_subscriber ON shields(subscriber);
  CREATE INDEX IF NOT EXISTS idx_shields_status ON shields(status);
  CREATE INDEX IF NOT EXISTS idx_fills_shield ON fills(shield_id);
`);

export default db;

// --- Helpers ---

export function getLastIndexedBlock(): bigint {
  const row = db.prepare("SELECT value FROM indexer_state WHERE key = 'last_block'").get() as
    | { value: string }
    | undefined;
  return row ? BigInt(row.value) : 0n;
}

export function setLastIndexedBlock(block: bigint) {
  db.prepare(
    "INSERT INTO indexer_state (key, value) VALUES ('last_block', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value"
  ).run(block.toString());
}

export function upsertShield(shield: {
  id: number;
  subscriber: string;
  strike: string;
  notional: string;
  premium: string;
  subscriberFee: string;
  filled: string;
  expiry: string;
  deliveryRate: number;
  validator: string;
  isReverse: boolean;
  status: number;
  createdTx?: string;
  createdAt?: number;
}) {
  db.prepare(`
    INSERT INTO shields (id, subscriber, strike, notional, premium, subscriber_fee, filled, expiry, delivery_rate, validator, is_reverse, status, created_tx, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      subscriber = excluded.subscriber,
      strike = excluded.strike,
      notional = excluded.notional,
      premium = excluded.premium,
      subscriber_fee = excluded.subscriber_fee,
      filled = excluded.filled,
      expiry = excluded.expiry,
      delivery_rate = excluded.delivery_rate,
      validator = excluded.validator,
      is_reverse = excluded.is_reverse,
      status = excluded.status,
      created_tx = COALESCE(excluded.created_tx, shields.created_tx),
      created_at = COALESCE(excluded.created_at, shields.created_at)
  `).run(
    shield.id,
    shield.subscriber,
    shield.strike,
    shield.notional,
    shield.premium,
    shield.subscriberFee,
    shield.filled,
    shield.expiry,
    shield.deliveryRate,
    shield.validator,
    shield.isReverse ? 1 : 0,
    shield.status,
    shield.createdTx ?? null,
    shield.createdAt ?? null
  );
}

export function insertEvent(event: {
  eventName: string;
  shieldId: number;
  txHash: string;
  blockNumber: number;
  blockTimestamp: number;
  args: Record<string, unknown>;
}) {
  db.prepare(`
    INSERT OR IGNORE INTO events (event_name, shield_id, tx_hash, block_number, block_timestamp, args_json)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    event.eventName,
    event.shieldId,
    event.txHash,
    event.blockNumber,
    event.blockTimestamp,
    JSON.stringify(event.args, (_k, v) => (typeof v === "bigint" ? v.toString() : v))
  );
}

export function insertFill(fill: {
  shieldId: number;
  guardian: string;
  amount: string;
  txHash: string;
}) {
  db.prepare(`
    INSERT OR IGNORE INTO fills (shield_id, guardian, amount, tx_hash)
    VALUES (?, ?, ?, ?)
  `).run(fill.shieldId, fill.guardian, fill.amount, fill.txHash);
}
