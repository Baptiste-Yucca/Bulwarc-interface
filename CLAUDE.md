# BulwArc - FX Hedge Frontend MVP

## Project Overview

**Purpose**: Build a React frontend for BulwArc, an FX hedging protocol on Arc testnet. Users create shields (EUR/USD options) and guardians fill them. At expiry, subscribers can exercise (if ITM) or claim guardians' capital.

**Stack**: React 18 + Vite, Viem, Tailwind CSS, TypeScript, lightweight Node.js backend

**Target Users**:
- **Oneshot**: Americans traveling to Europe in 6-12 months (single shield)
- **Multi-period**: European remote workers earning USD (monthly/quarterly shields)

---

## On-Chain Protocol Spec

### Smart Contract: BulwArc (Arc testnet)

**Key Types**:
```solidity
enum ShieldStatus { CREATED, PENDING, LOCKED, EXERCISED, EXPIRED }

struct Shield {
  address subscriber;      // creator of the shield
  uint256 strike;          // EUR/USD strike price (1e8 decimals)
  uint256 notional;        // total amount to cover (USDC, 1e6)
  uint256 premium;         // total premium paid by subscriber (USDC, 1e6)
  uint256 filled;          // total amount filled by guardians
  uint256 expiry;          // unix timestamp
  ShieldStatus status;
}

struct Fill {
  address guardian;        // counterparty who fills the shield
  uint256 amount;          // amount filled (USDC, 1e6)
}
```

### Core Flows

**1. CREATION (Oneshot or Batch)**
- User calls `createShield(strike, notional, premium, expiry)` or `createShieldBatch([...])`
- Status: `CREATED`
- No USDC transferred yet
- Event: `ShieldCreated(shieldId, subscriber, strike, notional, premium, expiry)`

**2. FUNDING**
- Subscriber calls `fundShield(shieldId)` to deposit premium
- Status: `CREATED` → `PENDING`
- Transfers `premium` USDC from subscriber to contract
- Event: `ShieldFunded(shieldId, funder)`
- Multiple guardians can fund the same shield (batch-style)

**3. MATCHING / FILLING**
- Guardian calls `matchShield(shieldId, guardian_address, amount)` to cover part/all of shield
- Requires: status is `PENDING`, amount ≤ remaining unfilled
- Guardian deposits `amount` USDC
- Guardian receives pro-rata premium: `premium * amount / notional`
- Fills[shieldId] records (guardian, amount)
- Event: `ShieldFilled(shieldId, guardian, amount)`
- When filled == notional: status → `LOCKED`, event `ShieldLocked(shieldId)`

**4. EXERCISE (at or before expiry)**
- Subscriber calls `exercise(shieldId)` if shield is `PENDING` or `LOCKED` and filled > 0
- Requires: oracle price < strike (ITM), timestamp ≤ expiry
- Payoff per unit: `strike - spot` (1e8 decimals)
- For each guardian fill, pay: `payoff * guardian_amount / 1e8` (capped at guardian_amount)
- Remaining capital returned to guardian
- Subscriber gets total payoff
- Status: `EXERCISED`
- Event: `ShieldExercised(shieldId, totalPayoff)`

**5. EXPIRE (after expiry)**
- Anyone calls `expire(shieldId)` if shield is `PENDING` or `LOCKED` and timestamp > expiry
- All guardian capital returned
- Status: `EXPIRED`
- Event: `ShieldExpired(shieldId)`

**6. CANCEL (only CREATED or PENDING, no fills)**
- Subscriber calls `cancel(shieldId)`
- If `PENDING`, refund premium to subscriber
- Status: `EXPIRED`

### Read Functions

- `getShield(shieldId) → Shield`
- `getFills(shieldId) → Fill[]`
- `getFillCount(shieldId) → uint256`
- `getShieldCount() → uint256`
- `shields[id]` and `fills[id][index]` (public storage)

### Events (Backend Listens)

1. `ShieldCreated(shieldId, subscriber, strike, notional, premium, expiry)`
2. `ShieldFunded(shieldId, funder)`
3. `ShieldFilled(shieldId, guardian, amount)` ← key for matching UI
4. `ShieldLocked(shieldId)` ← shield fully funded
5. `ShieldExercised(shieldId, payoff)`
6. `ShieldExpired(shieldId)`

---

## Frontend User Experience

### User Modes

#### Mode A: Oneshot (Traveler)
1. **Create Shield**: Form inputs:
   - "How much USD do I need in 12 months?" → notional
   - "What rate would I be happy with?" → strike
   - "When do I travel?" → expiry date
   - Premium auto-calculated or user specifies
   - Creates 1 shield

2. **Fund & Wait**: 
   - Call `fundShield(shieldId)` to lock in premium
   - Status visible in dashboard (PENDING)

3. **Matching Page**:
   - See all PENDING shields
   - Other users (guardians) fill by paying capital
   - Once fully filled → LOCKED

4. **Exercise or Expire**:
   - On travel date, if EUR is weak (price < strike): exercise
   - If EUR is strong (price ≥ strike): expire
   - Get payoff or refund

#### Mode B: Multi-period (Remote Worker)
1. **Create Shields Batch**:
   - "I earn $5k/month for 12 months"
   - Create 12 shields, 1 per month, each $5k notional
   - Same strike (EUR/USD forecast), different expiry dates
   - Uses `createShieldBatch(CreateParams[])`

2. **Fund All**:
   - Can fund in batch: `fundShieldBatch(shieldIds[])`
   - Or individually over time

3. **Matching**:
   - Guardians fill shields on monthly basis
   - Dashboard shows pipeline of upcoming shields

4. **Exercise Monthly**:
   - Each month, exercise current shield (if ITM)
   - Gets payoff if EUR dipped below strike
   - Hedge cost already paid (premium)

---

## Interface Components & Pages

### Page 1: Dashboard / Shield List
**Shows**: All shields (mine + marketplace)
- **Cards/Rows**:
  - Shield ID
  - Strike rate
  - Notional (USDC)
  - Premium (USDC)
  - Filled / Notional (progress bar)
  - Expiry (countdown or date)
  - Status (CREATED, PENDING, LOCKED, EXERCISED, EXPIRED)
  - Action buttons (Fund, Match, Exercise, Cancel, Expire)

**Filters**:
- Status (PENDING, LOCKED, etc.)
- My shields vs. Marketplace
- Expiry date range

**Demo UX**: 
- Green for good deals (high premium, early expiry)
- Yellow for marginal
- Show real-time oracle price as reference

### Page 2: Create Shield (Modal / Dedicated)

#### Step 1: Mode Selection
- Radio: "Single hedge (traveling)" vs. "Recurring shields (employed)"

#### Step 2: Oneshot Mode
- **Strike**: Input or slider (1.08, 1.10, 1.15 EUR/USD)
- **Notional**: $5k, $10k, $50k, $100k (presets + custom)
- **Expiry**: Date picker (3, 6, 12 months)
- **Premium**: Auto-calculated (≈5-10% of notional as UX hint) or input
- Preview: "Protect $100k at 1.10, pay $8k premium, expires Dec 2025"
- **Button**: "Create & Sign"

#### Step 3: Multi-period Mode
- **Total amount**: $60k (12 months × $5k/month)
- **Monthly amount**: $5k
- **Period**: 12 months (select count)
- **Strike**: Single rate for all
- **Expiry pattern**: Auto-calculate monthly expiries
- **Batch preview**: Table of 12 shields
- **Button**: "Create Batch & Sign"

### Page 3: Shield Detail & Matching
- **Info section**: Strike, notional, premium, expiry, status, subscriber, oracle price
- **Fill section**:
  - Table of all fills (guardian address, amount, premium received)
  - "Fill amount needed" indicator
- **If PENDING**:
  - Input "How much do I cover?" (as guardian)
  - Shows premium I'll receive
  - Button: "Fill This Shield" (sign + send amount)
- **If LOCKED**:
  - Status badge: "Fully matched"
  - Exercise/Expire buttons (if subscriber)
- **If EXERCISED/EXPIRED**:
  - Results: payoff amount or refund amount

### Page 4: My Shields (User-specific dashboard)
- All shields where user is subscriber or guardian
- Tabs: "Created", "Filled", "History"
- Quick stats: Total capital at risk, pending payoffs, P&L

---

## Technical Architecture

### Frontend Stack
- **React 18** + **Vite**
- **TypeScript** (strict mode)
- **Viem** (all contract calls)
- **Tailwind CSS** (styling)
- **React Hook Form** + **Zod** (form validation)
- **Zustand** or React Context (state: wallet, shields, filters)
- **axios** or fetch (backend API)

### Folder Structure
```
src/
├── components/
│   ├── Layout/
│   │   ├── Header.tsx         (wallet connect, nav)
│   │   ├── Footer.tsx
│   │   └── Sidebar.tsx        (optional)
│   ├── Shields/
│   │   ├── ShieldList.tsx     (dashboard grid)
│   │   ├── ShieldCard.tsx     (card component)
│   │   ├── ShieldDetail.tsx   (modal or page)
│   │   ├── ShieldFilters.tsx  (filter controls)
│   │   └── ShieldActions.tsx  (buttons: exercise, expire, cancel)
│   ├── Forms/
│   │   ├── CreateShieldForm.tsx (oneshot + batch)
│   │   ├── FundShieldForm.tsx
│   │   ├── MatchShieldForm.tsx
│   │   └── ModeSelector.tsx   (oneshot vs. multi-period)
│   ├── Common/
│   │   ├── Button.tsx
│   │   ├── Modal.tsx
│   │   ├── Input.tsx
│   │   ├── Card.tsx
│   │   └── Badge.tsx
│   └── Widgets/
│       ├── OraclePrice.tsx    (current EUR/USD)
│       └── Countdown.tsx      (time until expiry)
├── hooks/
│   ├── useWallet.ts           (connect, address, chainId)
│   ├── useShields.ts          (fetch from backend)
│   ├── useShieldDetail.ts     (read single shield from contract)
│   ├── useCreateShield.ts     (writeContract: createShield / createShieldBatch)
│   ├── useFundShield.ts       (writeContract: fundShield)
│   ├── useMatchShield.ts      (writeContract: matchShield)
│   ├── useExercise.ts         (writeContract: exercise)
│   ├── useExpire.ts           (writeContract: expire)
│   ├── useCancel.ts           (writeContract: cancel)
│   ├── useOraclePrice.ts      (read oracle price from contract)
│   └── useWebSocket.ts        (real-time updates from backend)
├── services/
│   ├── viemClient.ts          (publicClient & walletClient setup)
│   ├── api.ts                 (backend API calls)
│   ├── contracts.ts           (ABI + contract address)
│   └── oracle.ts              (fetch & cache oracle prices)
├── store/
│   ├── walletStore.ts         (address, connected, chainId)
│   ├── shieldsStore.ts        (all shields, filters, cache)
│   └── uiStore.ts             (modal states, loading, toasts)
├── types/
│   └── index.ts               (Shield, Fill, CreateParams, MatchParams, etc.)
├── utils/
│   ├── format.ts              (formatUSDC, formatDate, formatRate)
│   ├── math.ts                (premium calc, payoff calc, fill percentage)
│   └── validation.ts          (form validators)
├── pages/
│   ├── Home.tsx               (dashboard)
│   ├── MyShields.tsx          (user's shields)
│   ├── ShieldDetail.tsx       (detail page / modal)
│   └── NotFound.tsx
├── App.tsx
├── main.tsx
└── index.css                  (Tailwind setup)
```

### State Management (Zustand Example)

```typescript
// walletStore
export interface WalletState {
  address: string | null;
  connected: boolean;
  chainId: number | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  switchChain: (chainId: number) => Promise<void>;
}

// shieldsStore
export interface ShieldsState {
  shields: Shield[];
  filters: ShieldFilter;
  loading: boolean;
  error: string | null;
  setShields: (shields: Shield[]) => void;
  setFilter: (filter: ShieldFilter) => void;
  refetch: () => Promise<void>;
}

// uiStore
export interface UIState {
  modal: { type: 'create' | 'detail' | 'fund' | 'match' | null; shieldId?: number };
  loading: boolean;
  toast: { message: string; type: 'success' | 'error' | 'info' } | null;
  openModal: (type, shieldId?) => void;
  closeModal: () => void;
  showToast: (msg, type) => void;
}
```

### Viem Integration

**Contract Interaction Points**:

1. **Read Contract** (publicClient)
   ```typescript
   // Get single shield
   const shield = await publicClient.readContract({
     address: CONTRACT_ADDRESS,
     abi: BULWARC_ABI,
     functionName: 'getShield',
     args: [shieldId]
   });

   // Get all fills
   const fills = await publicClient.readContract({
     address: CONTRACT_ADDRESS,
     abi: BULWARC_ABI,
     functionName: 'getFills',
     args: [shieldId]
   });

   // Get shield count
   const count = await publicClient.readContract({
     address: CONTRACT_ADDRESS,
     abi: BULWARC_ABI,
     functionName: 'getShieldCount',
     args: []
   });
   ```

2. **Write Contract** (walletClient)
   ```typescript
   // Create shield
   const hash = await walletClient.writeContract({
     address: CONTRACT_ADDRESS,
     abi: BULWARC_ABI,
     functionName: 'createShield',
     args: [strike, notional, premium, expiry],
     account: userAddress
   });

   // Fund shield
   const hash = await walletClient.writeContract({
     address: CONTRACT_ADDRESS,
     abi: BULWARC_ABI,
     functionName: 'fundShield',
     args: [shieldId],
     account: userAddress
   });

   // Match shield (guardian fills)
   const hash = await walletClient.writeContract({
     address: CONTRACT_ADDRESS,
     abi: BULWARC_ABI,
     functionName: 'matchShield',
     args: [shieldId, guardianAddress, amount],
     account: userAddress
   });

   // Exercise
   const hash = await walletClient.writeContract({
     address: CONTRACT_ADDRESS,
     abi: BULWARC_ABI,
     functionName: 'exercise',
     args: [shieldId],
     account: userAddress
   });

   // Batch operations
   const hash = await walletClient.writeContract({
     address: CONTRACT_ADDRESS,
     abi: BULWARC_ABI,
     functionName: 'createShieldBatch',
     args: [[...CreateParams[]]],
     account: userAddress
   });
   ```

3. **Watch Events** (backend, not frontend directly)
   ```typescript
   const unwatch = publicClient.watchContractEvent({
     address: CONTRACT_ADDRESS,
     abi: BULWARC_ABI,
     eventName: 'ShieldCreated',
     onLogs: (logs) => {
       // Index to DB, emit to frontend via WebSocket
     }
   });
   ```

### TypeScript Types (from Solidity)

```typescript
// Core types
type ShieldStatus = 'CREATED' | 'PENDING' | 'LOCKED' | 'EXERCISED' | 'EXPIRED';

interface Shield {
  subscriber: `0x${string}`;
  strike: bigint;              // 1e8 decimals
  notional: bigint;            // 1e6 decimals (USDC)
  premium: bigint;             // 1e6 decimals
  filled: bigint;
  expiry: bigint;              // unix timestamp
  status: ShieldStatus;
}

interface Fill {
  guardian: `0x${string}`;
  amount: bigint;              // 1e6 decimals
}

interface CreateParams {
  strike: bigint;
  notional: bigint;
  premium: bigint;
  expiry: bigint;
}

interface MatchParams {
  shieldId: bigint;
  guardian: `0x${string}`;
  amount: bigint;
}

interface ShieldFilter {
  status?: ShieldStatus[];
  subscriber?: `0x${string}`;
  expireBefore?: number;       // unix timestamp
  expireAfter?: number;
  minNotional?: bigint;
  maxNotional?: bigint;
}
```

---

## Backend (Lightweight Event Listener)

### Purpose
- Listen to contract events from Arc testnet
- Index shields and fills to database
- Expose REST API to frontend
- Optional: WebSocket for real-time updates

### Architecture

```
backend/
├── listener.ts       (Viem watchContractEvent)
├── db.ts             (simple SQLite or Mongo)
├── api.ts            (Express server)
├── types.ts
└── config.ts
```

### Event Listener (Viem)

```typescript
import { createPublicClient, http } from 'viem';
import { arcTestnet } from 'viem/chains';

const publicClient = createPublicClient({
  chain: arcTestnet,
  transport: http('https://arc-rpc-url')
});

// ShieldCreated
publicClient.watchContractEvent({
  address: CONTRACT_ADDRESS,
  abi: BULWARC_ABI,
  eventName: 'ShieldCreated',
  onLogs: (logs) => {
    logs.forEach(log => {
      const { shieldId, subscriber, strike, notional, premium, expiry } = log.args;
      // Save to DB
      db.shields.insert({
        id: shieldId,
        subscriber,
        strike: strike.toString(),
        notional: notional.toString(),
        premium: premium.toString(),
        expiry: expiry.toString(),
        status: 'CREATED',
        createdAt: new Date()
      });
      // Emit to WebSocket clients
      io.emit('shieldCreated', { shieldId, ... });
    });
  }
});

// ShieldFilled
publicClient.watchContractEvent({
  address: CONTRACT_ADDRESS,
  abi: BULWARC_ABI,
  eventName: 'ShieldFilled',
  onLogs: (logs) => {
    logs.forEach(log => {
      const { shieldId, guardian, amount } = log.args;
      // Update DB
      db.fills.insert({ shieldId, guardian, amount: amount.toString() });
      db.shields.update({ id: shieldId }, { lastFilled: new Date() });
      // Emit
      io.emit('shieldFilled', { shieldId, guardian, amount: amount.toString() });
    });
  }
});

// ... listen to other events
```

### REST API Endpoints

**GET /api/shields**
- Query: `?status=PENDING&page=0&limit=20`
- Returns: `{ shields: Shield[], total: number }`

**GET /api/shields/:id**
- Returns: `{ shield: Shield, fills: Fill[] }`

**GET /api/shields/:id/fills**
- Returns: `{ fills: Fill[], count: number }`

**GET /api/user/:address/shields**
- Returns: `{ created: Shield[], filled: Shield[] }`

**GET /api/rates**
- Returns: `{ eurusd: number, timestamp: number }`

**WebSocket**: `/ws`
- Subscribe to events: `shieldCreated`, `shieldFilled`, `shieldLocked`, `shieldExercised`, `shieldExpired`

---

## Workflow Examples

### Example 1: American Traveler (Oneshot)

1. **Create**: Form → "I need $100k in 9 months" → strike 1.10 → premium $8k
   - Calls `createShield(1.10e8, 100000e6, 8000e6, expiry_9mo)`
   - Status: CREATED

2. **Fund**: Calls `fundShield(shieldId)` → deposits $8k premium
   - Status: PENDING

3. **Wait for Guardians**: 
   - Guardian A fills $40k at 1.10 rate (gets $3200 premium)
   - Guardian B fills $60k at 1.10 rate (gets $4800 premium)
   - Shield fully matched → Status: LOCKED

4. **Exercise** (9 months later):
   - Oracle price: 1.07 (EUR weaker, ITM)
   - Subscriber calls `exercise(shieldId)`
   - Payoff = (1.10 - 1.07) × $100k = $300k (capped)
   - Guardians get back unused capital
   - Traveler protected, has stable cost ($8k premium)

### Example 2: European Remote Worker (Multi-period)

1. **Create Batch**: Form → "I earn $5k/month for 12 months"
   - Calls `createShieldBatch([
       { strike: 1.10e8, notional: 5000e6, premium: 400e6, expiry: 1mo },
       { strike: 1.10e8, notional: 5000e6, premium: 400e6, expiry: 2mo },
       ...
     ])`
   - 12 shields created, status CREATED

2. **Fund Batch**: Calls `fundShieldBatch(shieldIds)` once
   - All 12 shields status → PENDING
   - Total premium: $4800 locked

3. **Guardians Fill Over Time**:
   - Month 1: 1-2 guardians fill $5k → LOCKED
   - Month 2: new guardians fill next shield → LOCKED
   - ...continuing pipeline

4. **Monthly Exercise**:
   - Each month, if EUR weakens, call `exercise(shieldId_month_X)`
   - Get payoff, move to next month
   - If EUR strengthens, `expire(shieldId)` refunds guardian capital
   - Guaranteed cost: $400/month

---

## Demo UX Flow (5 min walkthrough)

1. **Connect Wallet** (Rabby)
   - Shows testnet balance
   - Network check (Arc testnet)

2. **Dashboard**
   - Pre-loaded mock shields (PENDING, LOCKED statuses)
   - Filter, sort by expiry

3. **Create Shield** (Oneshot)
   - Fill form: $50k notional, 1.10 strike, 6mo expiry
   - Premium auto: ~$4k
   - Sign & broadcast

4. **Fund Shield**
   - Button appears
   - Sign TX, show success

5. **Matching Page**
   - Show available shields to fill
   - Select one, enter amount ($20k)
   - See premium I receive ($1600)
   - Sign & broadcast

6. **Dashboard Update** (via WebSocket)
   - New shield appears filled status update
   - Live progress bar

7. **Exercise** (if oracle < strike)
   - Button enabled
   - Show payoff calculation
   - Sign & see result

---

## MVP Scope

✅ **Included (Phase 1)**:
- Wallet connect (Rabby)
- View shields (from backend API)
- Create shield (oneshot + batch)
- Fund shield
- Match shield (as guardian)
- Read oracle price (from contract)
- Exercise & expire
- Basic filters (status, date)
- Real-time updates (WebSocket or polling)
- User-friendly, demo-ready UI

❌ **Out of Scope (Phase 2+)**:
- Advanced charting (P&L by month)
- Vault strategies
- Complex order types
- Gas optimization UI
- Mobile app
- Advanced analytics

---

## Testing & Deployment

### Local Development
```bash
npm run dev         # Vite dev server
npm run build       # Production build
npm run preview     # Preview build
```

### Backend Local
```bash
node backend/listener.ts    # Start event listener
npm run server              # Express API server
```

### Testnet
- Deploy contract to Arc testnet
- Point frontend to Arc RPC
- Point backend to Arc RPC
- Use Rabby for wallet connection

### Contract Address & ABI
- **CONTRACT_ADDRESS**: Will be provided after deployment
- **ABI**: Included in `services/contracts.ts` (auto-generated from Solidity)
- **ORACLE**: Set in contract constructor

---

## Key Files to Generate

- ✅ `src/types/index.ts` (all TypeScript interfaces)
- ✅ `src/services/viemClient.ts` (publicClient + walletClient)
- ✅ `src/services/contracts.ts` (ABI + address constants)
- ✅ `src/hooks/useShields.ts`, `useCreateShield.ts`, etc. (all contract hooks)
- ✅ `src/store/walletStore.ts`, `shieldsStore.ts` (Zustand stores)
- ✅ `src/components/Shields/*` (all UI components)
- ✅ `backend/listener.ts` (event listener)
- ✅ `backend/api.ts` (Express API)
- ✅ Form validation & utilities

---

## Notes

- **Decimals**: Strike is 1e8, USDC amounts 1e6 (remember when converting for display)
- **Oracle**: Contract assumes oracle.getPrice() returns (int256 price, uint256 updatedAt)
  - Price likely 1e8 decimals (e.g., 1.10e8 = 110000000)
- **Batch operations**: Use for multi-period flows (12 shields at once)
- **Premium distribution**: Guardian gets premium pro-rata when filling (see contract logic)
- **Demo focus**: Show successful create → fund → match → exercise flow in <5 min

---

**Status**: Ready for Claude Code implementation  
**Next**: Generate service files, hooks, components, backend listener
