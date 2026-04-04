import { useState, useEffect, useCallback } from "react";

const API = import.meta.env.VITE_API_URL || "http://localhost:3001";

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

interface ApiShield {
  id: number;
  subscriber: string;
  strike: string;
  notional: string;
  premium: string;
  subscriber_fee: string;
  filled: string;
  expiry: string;
  delivery_rate: number;
  validator: string;
  is_reverse: number;
  status: number;
  created_tx: string | null;
  created_at: number | null;
}

function mapShield(s: ApiShield): Shield {
  return {
    id: s.id,
    subscriber: s.subscriber,
    strike: BigInt(s.strike),
    notional: BigInt(s.notional),
    premium: BigInt(s.premium),
    subscriberFee: BigInt(s.subscriber_fee),
    filled: BigInt(s.filled),
    expiry: BigInt(s.expiry),
    deliveryRate: s.delivery_rate,
    validator: s.validator,
    isReverse: s.is_reverse === 1,
    status: s.status,
    createdEvent: s.created_tx
      ? {
          txHash: s.created_tx,
          blockNumber: 0n,
          timestamp: s.created_at ?? 0,
        }
      : undefined,
  };
}

export function useShields() {
  const [shields, setShields] = useState<Shield[]>([]);
  const [oraclePrice, setOraclePrice] = useState<bigint>(0n);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const [shieldsRes, oracleRes] = await Promise.all([
        fetch(`${API}/shields`),
        fetch(`${API}/oracle`),
      ]);

      const apiShields: ApiShield[] = await shieldsRes.json();
      const oracle = await oracleRes.json();

      const mapped = apiShields.map(mapShield);
      setShields(mapped);
      setOraclePrice(BigInt(oracle.price));
    } catch (e) {
      console.error("Failed to fetch from API:", e);
      setShields([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 5_000);
    return () => clearInterval(interval);
  }, [refresh]);

  return { shields, oraclePrice, loading, refresh };
}

export async function getFills(shieldId: number): Promise<Fill[]> {
  // Mock shields (id >= 100) don't have real fills
  if (shieldId >= 100) return [];

  try {
    const res = await fetch(`${API}/shields/${shieldId}/fills`);
    const data = await res.json();
    return data.map((f: { guardian: string; amount: string }) => ({
      guardian: f.guardian,
      amount: BigInt(f.amount),
    }));
  } catch {
    return [];
  }
}
