import { useState, useEffect, useCallback } from "react";
import { publicClient } from "../config/client";
import {
  BULWARC_ADDRESS,
  BULWARC_ABI,
  ORACLE_ABI,
  ORACLE_ADDRESS,
} from "../config/contracts";

export interface Shield {
  id: number;
  subscriber: string;
  strike: bigint;
  notional: bigint;
  premium: bigint;
  subscriberFee: bigint;
  filled: bigint;
  expiry: bigint;
  status: number;
}

export interface Fill {
  guardian: string;
  amount: bigint;
}

export function useShields() {
  const [shields, setShields] = useState<Shield[]>([]);
  const [oraclePrice, setOraclePrice] = useState<bigint>(0n);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const count = await publicClient.readContract({
        address: BULWARC_ADDRESS,
        abi: BULWARC_ABI,
        functionName: "getShieldCount",
      });

      const n = Number(count);
      const results: Shield[] = [];

      for (let i = 0; i < n; i++) {
        const data = await publicClient.readContract({
          address: BULWARC_ADDRESS,
          abi: BULWARC_ABI,
          functionName: "getShield",
          args: [BigInt(i)],
        });
        results.push({
          id: i,
          subscriber: data.subscriber,
          strike: data.strike,
          notional: data.notional,
          premium: data.premium,
          subscriberFee: data.subscriberFee,
          filled: data.filled,
          expiry: data.expiry,
          status: data.status,
        });
      }
      setShields(results);

      const [price] = await publicClient.readContract({
        address: ORACLE_ADDRESS,
        abi: ORACLE_ABI,
        functionName: "getPrice",
      });
      setOraclePrice(price);
    } catch (e) {
      console.error("Failed to fetch shields:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 15_000);
    return () => clearInterval(interval);
  }, [refresh]);

  return { shields, oraclePrice, loading, refresh };
}

export async function getFills(shieldId: number): Promise<Fill[]> {
  const fills = await publicClient.readContract({
    address: BULWARC_ADDRESS,
    abi: BULWARC_ABI,
    functionName: "getFills",
    args: [BigInt(shieldId)],
  });
  return fills.map((f) => ({ guardian: f.guardian, amount: f.amount }));
}
