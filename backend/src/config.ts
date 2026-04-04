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

export const BULWARC_ADDRESS = (process.env.BULWARC_ADDRESS || "0xb252aaf5Cd1D4827844F777293EB6eaEe0063E3a") as Address;

export const BULWARC_EVENTS = [
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
    inputs: [
      { name: "shieldId", type: "uint256", indexed: true },
    ],
  },
  {
    type: "event",
    name: "ShieldExercised",
    inputs: [
      { name: "shieldId", type: "uint256", indexed: true },
      { name: "payoff", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "ShieldExpired",
    inputs: [
      { name: "shieldId", type: "uint256", indexed: true },
    ],
  },
] as const;
