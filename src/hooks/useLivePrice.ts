import { useState, useEffect, useRef } from "react";

const API = import.meta.env.VITE_API_URL || "http://localhost:3001";
const BINANCE_WS = "wss://stream.binance.com:9443/ws/eurusdt@trade";

export interface LivePrice {
  price: number;
  direction: "up" | "down" | "flat";
  testMode: boolean;
}

export function useLivePrice(): LivePrice {
  const [price, setPrice] = useState(0);
  const [direction, setDirection] = useState<"up" | "down" | "flat">("flat");
  const [testMode, setTestMode] = useState(false);
  const prevPrice = useRef(0);

  // Binance WebSocket for live price
  useEffect(() => {
    let ws: WebSocket;
    let reconnectTimer: ReturnType<typeof setTimeout>;

    function connect() {
      ws = new WebSocket(BINANCE_WS);
      ws.onmessage = (event) => {
        if (testMode) return; // ignore Binance in test mode
        const data = JSON.parse(event.data);
        const newPrice = parseFloat(data.p);
        if (prevPrice.current !== 0) {
          if (newPrice > prevPrice.current) setDirection("up");
          else if (newPrice < prevPrice.current) setDirection("down");
          else setDirection("flat");
        }
        prevPrice.current = newPrice;
        setPrice(newPrice);
      };
      ws.onclose = () => { reconnectTimer = setTimeout(connect, 3000); };
      ws.onerror = () => { ws.close(); };
    }

    connect();
    return () => { clearTimeout(reconnectTimer); ws?.close(); };
  }, [testMode]);

  // Poll /mode to detect test mode + read oracle price
  useEffect(() => {
    let active = true;

    async function poll() {
      try {
        const res = await fetch(`${API}/mode`);
        const data = await res.json();
        if (!active) return;

        setTestMode(data.testMode);

        if (data.testMode && data.oraclePrice) {
          const oracleEurUsd = Number(data.oraclePrice) / 1e8;
          if (prevPrice.current !== 0) {
            if (oracleEurUsd > prevPrice.current) setDirection("up");
            else if (oracleEurUsd < prevPrice.current) setDirection("down");
            else setDirection("flat");
          }
          prevPrice.current = oracleEurUsd;
          setPrice(oracleEurUsd);
        }
      } catch {}
    }

    poll();
    const interval = setInterval(poll, 3_000);
    return () => { active = false; clearInterval(interval); };
  }, []);

  return { price, direction, testMode };
}
