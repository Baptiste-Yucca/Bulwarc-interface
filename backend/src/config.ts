import { defineChain, type Address } from "viem";

const rpcUrl = process.env.RPC_URL || "https://rpc.testnet.arc.network";

export const arcTestnet = defineChain({
  id: 5_042_002,
  name: "Arc Testnet",
  nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: { http: [rpcUrl] },
  },
});

export const BULWARC_ADDRESS = (process.env.BULWARC_ADDRESS || "0xA23B7bdf94717Ae9A0d0C468Ad84fDD0D485ea1d") as Address;
export const ORACLE_ADDRESS = (process.env.ORACLE_ADDRESS || "0x3462614cd401DD667B3A30D1c7E8b731DCE7E003") as Address;

export const PORT = parseInt(process.env.PORT || "3001");
export const DEPLOY_BLOCK = BigInt(process.env.DEPLOY_BLOCK || "35486300");

export const BULWARC_ABI = [
  // --- Read ---
  {
    type: "function",
    name: "getShield",
    inputs: [{ name: "shieldId", type: "uint256" }],
    outputs: [
      {
        name: "",
        type: "tuple",
        components: [
          { name: "subscriber", type: "address" },
          { name: "strike", type: "uint256" },
          { name: "notional", type: "uint256" },
          { name: "premium", type: "uint256" },
          { name: "subscriberFee", type: "uint256" },
          { name: "filled", type: "uint256" },
          { name: "expiry", type: "uint256" },
          { name: "deliveryRate", type: "uint8" },
          { name: "validator", type: "address" },
          { name: "isReverse", type: "bool" },
          { name: "status", type: "uint8" },
        ],
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getShieldCount",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getFills",
    inputs: [{ name: "shieldId", type: "uint256" }],
    outputs: [
      {
        name: "",
        type: "tuple[]",
        components: [
          { name: "guardian", type: "address" },
          { name: "amount", type: "uint256" },
        ],
      },
    ],
    stateMutability: "view",
  },
  // --- Events ---
  {
    type: "event",
    name: "ShieldCreated",
    inputs: [
      { name: "shieldId", type: "uint256", indexed: true },
      { name: "subscriber", type: "address", indexed: true },
      { name: "strike", type: "uint256", indexed: false },
      { name: "notional", type: "uint256", indexed: false },
      { name: "premium", type: "uint256", indexed: false },
      { name: "expiry", type: "uint256", indexed: false },
      { name: "isReverse", type: "bool", indexed: false },
    ],
  },
  {
    type: "event",
    name: "ShieldFunded",
    inputs: [
      { name: "shieldId", type: "uint256", indexed: true },
      { name: "funder", type: "address", indexed: true },
    ],
  },
  {
    type: "event",
    name: "ShieldFilled",
    inputs: [
      { name: "shieldId", type: "uint256", indexed: true },
      { name: "guardian", type: "address", indexed: true },
      { name: "amount", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "ShieldLocked",
    inputs: [{ name: "shieldId", type: "uint256", indexed: true }],
  },
  {
    type: "event",
    name: "ShieldSettled",
    inputs: [
      { name: "shieldId", type: "uint256", indexed: true },
      { name: "inTheMoney", type: "bool", indexed: false },
      { name: "payoff", type: "uint256", indexed: false },
    ],
  },
] as const;

export const ORACLE_ABI = [
  {
    type: "function",
    name: "getPrice",
    inputs: [],
    outputs: [
      { name: "price", type: "int256" },
      { name: "updatedAt", type: "uint256" },
    ],
    stateMutability: "view",
  },
] as const;
