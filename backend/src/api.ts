import { createServer, type IncomingMessage, type ServerResponse } from "http";
import db from "./db.js";
import { getOraclePrice } from "./indexer.js";
import { PORT } from "./config.js";

function json(res: ServerResponse, data: unknown, status = 200) {
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  });
  res.end(JSON.stringify(data));
}

function notFound(res: ServerResponse) {
  json(res, { error: "not found" }, 404);
}

function handleRequest(req: IncomingMessage, res: ServerResponse) {
  // CORS preflight
  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    });
    res.end();
    return;
  }

  const url = new URL(req.url || "/", `http://localhost:${PORT}`);
  const path = url.pathname;

  // GET /shields — all shields
  if (path === "/shields" && req.method === "GET") {
    const subscriber = url.searchParams.get("subscriber");
    const status = url.searchParams.get("status");

    let query = "SELECT * FROM shields WHERE 1=1";
    const params: unknown[] = [];

    if (subscriber) {
      query += " AND LOWER(subscriber) = LOWER(?)";
      params.push(subscriber);
    }
    if (status !== null && status !== "") {
      query += " AND status = ?";
      params.push(parseInt(status));
    }

    query += " ORDER BY id DESC";
    const shields = db.prepare(query).all(...params);
    return json(res, shields);
  }

  // GET /shields/:id
  const shieldMatch = path.match(/^\/shields\/(\d+)$/);
  if (shieldMatch && req.method === "GET") {
    const id = parseInt(shieldMatch[1]);
    const shield = db.prepare("SELECT * FROM shields WHERE id = ?").get(id);
    if (!shield) return notFound(res);
    return json(res, shield);
  }

  // GET /shields/:id/fills
  const fillsMatch = path.match(/^\/shields\/(\d+)\/fills$/);
  if (fillsMatch && req.method === "GET") {
    const id = parseInt(fillsMatch[1]);
    const fills = db.prepare("SELECT * FROM fills WHERE shield_id = ? ORDER BY id").all(id);
    return json(res, fills);
  }

  // GET /shields/:id/events
  const eventsMatch = path.match(/^\/shields\/(\d+)\/events$/);
  if (eventsMatch && req.method === "GET") {
    const id = parseInt(eventsMatch[1]);
    const events = db
      .prepare("SELECT * FROM events WHERE shield_id = ? ORDER BY block_number, id")
      .all(id);
    return json(res, events);
  }

  // GET /events — all events, optional ?limit=N
  if (path === "/events" && req.method === "GET") {
    const limit = parseInt(url.searchParams.get("limit") || "100");
    const events = db
      .prepare("SELECT * FROM events ORDER BY block_number DESC, id DESC LIMIT ?")
      .all(limit);
    return json(res, events);
  }

  // GET /oracle
  if (path === "/oracle" && req.method === "GET") {
    return json(res, getOraclePrice());
  }

  // GET /stats
  if (path === "/stats" && req.method === "GET") {
    const total = db.prepare("SELECT COUNT(*) as count FROM shields").get() as { count: number };
    const byStatus = db
      .prepare("SELECT status, COUNT(*) as count FROM shields GROUP BY status")
      .all();
    return json(res, { totalShields: total.count, byStatus });
  }

  notFound(res);
}

export function startApi() {
  const server = createServer(handleRequest);
  server.listen(PORT, () => {
    console.log(`API listening on http://localhost:${PORT}`);
  });
}
