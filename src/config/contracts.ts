import type { Address } from "viem";

export const BULWARC_ADDRESS = import.meta.env.VITE_BULWARC_ADDRESS as Address;
export const ORACLE_ADDRESS = import.meta.env.VITE_ORACLE_ADDRESS as Address;

// Native stablecoins on Arc — these never change
export const USDC_ADDRESS = "0x3600000000000000000000000000000000000000" as Address;
export const EURC_ADDRESS = "0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a" as Address;

/** Returns the premium token for a shield direction */
export function premiumToken(isReverse: boolean): Address {
  return isReverse ? EURC_ADDRESS : USDC_ADDRESS;
}

/** Returns the collateral token for a shield direction */
export function collateralToken(isReverse: boolean): Address {
  return isReverse ? USDC_ADDRESS : EURC_ADDRESS;
}

/** Human-readable labels */
export function premiumLabel(isReverse: boolean): string {
  return isReverse ? "EURC" : "USDC";
}

export function collateralLabel(isReverse: boolean): string {
  return isReverse ? "USDC" : "EURC";
}

export const BULWARC_ABI = [
  // --- Write ---
  {
    type: "function",
    name: "createShield",
    inputs: [
      { name: "strike", type: "uint256" },
      { name: "notional", type: "uint256" },
      { name: "premium", type: "uint256" },
      { name: "expiry", type: "uint256" },
      { name: "validator", type: "address" },
      { name: "isReverse", type: "bool" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "createAndFundShield",
    inputs: [
      { name: "strike", type: "uint256" },
      { name: "notional", type: "uint256" },
      { name: "premium", type: "uint256" },
      { name: "expiry", type: "uint256" },
      { name: "validator", type: "address" },
      { name: "isReverse", type: "bool" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "fundShield",
    inputs: [{ name: "shieldId", type: "uint256" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "matchShield",
    inputs: [
      { name: "shieldId", type: "uint256" },
      { name: "guardian", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "validateDelivery",
    inputs: [
      { name: "shieldId", type: "uint256" },
      { name: "rate", type: "uint8" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "exercise",
    inputs: [{ name: "shieldId", type: "uint256" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "expire",
    inputs: [{ name: "shieldId", type: "uint256" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "cancel",
    inputs: [{ name: "shieldId", type: "uint256" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
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
  {
    type: "function",
    name: "getFillCount",
    inputs: [{ name: "shieldId", type: "uint256" }],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "feeBps",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
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
    name: "ShieldExercised",
    inputs: [
      { name: "shieldId", type: "uint256", indexed: true },
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

export const ERC20_ABI = [
  {
    type: "function",
    name: "approve",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "allowance",
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "balanceOf",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
] as const;

export const SHIELD_STATUS = ["CREATED", "PENDING", "LOCKED", "EXERCISED", "EXPIRED"] as const;
