import type { Shield } from "../hooks/useShields";
import csvRaw from "./mock-salary.csv?raw";

export function parseMockShields(): Shield[] {
  const lines = csvRaw.trim().split("\n").slice(1); // skip header
  return lines.map((line) => {
    const [id, subscriber, strike, notional, premium, subscriberFee, filled, expiry, status, txHash, timestamp, isReverse, deliveryRate, validator] =
      line.split(",");
    return {
      id: parseInt(id),
      subscriber,
      strike: BigInt(strike),
      notional: BigInt(notional),
      premium: BigInt(premium),
      subscriberFee: BigInt(subscriberFee),
      filled: BigInt(filled),
      expiry: BigInt(expiry),
      status: parseInt(status),
      isReverse: isReverse === "true",
      deliveryRate: parseInt(deliveryRate),
      validator,
      createdEvent: {
        txHash,
        blockNumber: 0n,
        timestamp: parseInt(timestamp),
      },
    };
  });
}
