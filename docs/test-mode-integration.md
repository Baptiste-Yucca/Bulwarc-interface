# BulwArc — Test Mode Integration Guide

## Overview

The BulwArc webapp exposes a test mode API that lets blockchain test scripts control the price displayed on the frontend. In normal mode, the webapp shows the live Binance EUR/USD price. In test mode, it reads the on-chain MockOracle price instead.

This lets you run demo scenarios where the oracle price is manipulated on-chain, and the frontend reflects those changes in real-time.

## Prerequisites

- Backend running: `cd backend && npm run dev` (or `npm run dev` from root)
- API defaults to `http://localhost:3001`

## API Routes

### 1. `GET /currentRatio` — Enter test mode

Call this **before** your test script starts. Returns the current live Binance EUR/USD rate and switches the webapp to test mode.

```bash
curl http://localhost:3001/currentRatio
```

Response:
```json
{
  "ratio": 1.1517,
  "pair": "EUR/USD",
  "source": "binance",
  "testMode": true
}
```

Use `ratio` as the "real" market rate to decide what strike price to set in your test.

### 2. `POST /endTest` — Exit test mode

Call this **after** your test script finishes. The webapp reverts to showing the live Binance price.

```bash
curl -X POST http://localhost:3001/endTest
```

Response:
```json
{
  "testMode": false,
  "restoredRatio": 1.1517,
  "pair": "EUR/USD"
}
```

### 3. `GET /mode` — Check current mode

```bash
curl http://localhost:3001/mode
```

Response:
```json
{
  "testMode": true,
  "savedRatio": 1.1517,
  "oraclePrice": "92000000",
  "oracleUpdatedAt": 1775332745
}
```

- `oraclePrice` is the on-chain MockOracle value in 1e8 format (92000000 = 0.92 EUR/USD)

### 4. `GET /oracle` — Oracle price (always available)

```bash
curl http://localhost:3001/oracle
```

Response:
```json
{
  "price": "92000000",
  "updatedAt": 1775332745,
  "testMode": true
}
```

## MockOracle On-Chain

The MockOracle contract exposes a `price()` view function:

| | |
|---|---|
| Contract | Value of `VITE_ORACLE_ADDRESS` in `.env` |
| Function | `price()` — selector `0xa035b1fe` |
| Returns | `int256` — EUR/USD in 1e8 (e.g. `92000000` = 0.92) |

To set the oracle price in your test script:

```bash
# Set oracle to 0.85 EUR/USD
cast send $ORACLE_ADDRESS "setPrice(int256)" 85000000 --private-key $PK --rpc-url $RPC
```

## Typical Test Script Flow

```bash
#!/bin/bash

API="http://localhost:3001"

# 1. Get current market rate + enter test mode
RATIO=$(curl -s $API/currentRatio | jq -r '.ratio')
echo "Market rate: $RATIO EUR/USD"

# 2. Set oracle to a known starting price
cast send $ORACLE_ADDRESS "setPrice(int256)" 92000000 ...

# 3. Run your scenario (create shield, fund, match, etc.)
cast send $BULWARC_ADDRESS "createAndFundShield(uint256,uint256,uint256,uint256,address,bool)" ...

# 4. Move oracle price to trigger exercise
cast send $ORACLE_ADDRESS "setPrice(int256)" 85000000 ...

# 5. Exercise / expire
cast send $BULWARC_ADDRESS "exercise(uint256)" 0 ...

# 6. End test mode — webapp goes back to Binance price
curl -s -X POST $API/endTest
echo "Test complete"
```

## What the Frontend Shows

| Mode | Price source | Badge |
|---|---|---|
| Normal | Binance WebSocket (real-time) | `LIVE` (green/red) |
| Test | On-chain MockOracle (polled every 3s) | `TEST` (amber) |

The `TEST` badge is amber-colored in the sidebar. The price updates every 3 seconds from the on-chain oracle, so any `setPrice` call will be reflected within 3s.
