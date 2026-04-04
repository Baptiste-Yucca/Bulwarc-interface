import type { Address } from "viem";

export const BULWARC_ADDRESS = import.meta.env.VITE_BULWARC_ADDRESS as Address;
export const ORACLE_ADDRESS = import.meta.env.VITE_ORACLE_ADDRESS as Address;
export const USDC_ADDRESS = import.meta.env.VITE_USDC_ADDRESS as Address;
export const EURC_ADDRESS = import.meta.env.VITE_EURC_ADDRESS as Address;

export const BULWARC_ABI = [
  {
    type: "function",
    name: "createShield",
    inputs: [
      { name: "strike", type: "uint256" },
      { name: "notional", type: "uint256" },
      { name: "premium", type: "uint256" },
      { name: "expiry", type: "uint256" },
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
