import { useState, useEffect, useCallback } from "react";
import { publicClient } from "../config/client";
import {
  BULWARC_ADDRESS,
  BULWARC_ABI,
  ORACLE_ABI,
  ORACLE_ADDRESS,
} from "../config/contracts";
import { parseMockShields } from "../config/mockData";

export interface ShieldEvent {
  txHash: string;
  blockNumber: bigint;
  timestamp: number;
}

export interface Shield {
  id: number;
  subscriber: string;
  strike: bigint;
  notional: bigint;
  premium: bigint;
  subscriberFee: bigint;
  filled: bigint;
  expiry: bigint;
  deliveryRate: number;
  validator: string;
  isReverse: boolean;
  status: number;
  createdEvent?: ShieldEvent;
}

export interface Fill {
  guardian: string;
  amount: bigint;
}

export const ARCSCAN_TX = "https://testnet.arcscan.app/tx/";

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

      // Fetch all ShieldCreated events in one call
      const logs = await publicClient.getContractEvents({
        address: BULWARC_ADDRESS,
        abi: BULWARC_ABI,
        eventName: "ShieldCreated",
        fromBlock: 0n,
      });

      // Map shieldId -> log
      const logByShieldId = new Map<number, typeof logs[number]>();
      for (const log of logs) {
        const id = Number((log as any).args.shieldId);
        logByShieldId.set(id, log);
      }

      // Fetch block timestamps for unique blocks
      const uniqueBlocks = [...new Set(logs.map((l) => l.blockNumber))];
      const blockTimestamps = new Map<bigint, number>();
      await Promise.all(
        uniqueBlocks.map(async (bn) => {
          if (bn == null) return;
          const block = await publicClient.getBlock({ blockNumber: bn });
          blockTimestamps.set(bn, Number(block.timestamp));
        })
      );

      const results: Shield[] = [];
      for (let i = 0; i < n; i++) {
        const data = await publicClient.readContract({
          address: BULWARC_ADDRESS,
          abi: BULWARC_ABI,
          functionName: "getShield",
          args: [BigInt(i)],
        });

        const log = logByShieldId.get(i);
        let createdEvent: ShieldEvent | undefined;
        if (log && log.transactionHash && log.blockNumber != null) {
          createdEvent = {
            txHash: log.transactionHash,
            blockNumber: log.blockNumber,
            timestamp: blockTimestamps.get(log.blockNumber) ?? 0,
          };
        }

        results.push({
          id: i,
          subscriber: data.subscriber,
          strike: data.strike,
          notional: data.notional,
          premium: data.premium,
          subscriberFee: data.subscriberFee,
          filled: data.filled,
          expiry: data.expiry,
          deliveryRate: data.deliveryRate,
          validator: data.validator,
          isReverse: data.isReverse,
          status: data.status,
          createdEvent,
        });
      }
      // Append mock data for demo
      const mockShields = parseMockShields();
      setShields([...results, ...mockShields]);

      const [price] = await publicClient.readContract({
        address: ORACLE_ADDRESS,
        abi: ORACLE_ABI,
        functionName: "getPrice",
      });
      setOraclePrice(price);
    } catch (e) {
      console.error("Failed to fetch shields:", e);
      const mockShields = parseMockShields();
      setShields(mockShields);
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
