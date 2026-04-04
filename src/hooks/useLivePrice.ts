import { useState, useEffect, useRef } from "react";

export interface LivePrice {
  price: number;
  direction: "up" | "down" | "flat";
}

const BINANCE_WS = "wss://stream.binance.com:9443/ws/eurusdt@trade";

export function useLivePrice(): LivePrice {
  const [price, setPrice] = useState(0);
  const [direction, setDirection] = useState<"up" | "down" | "flat">("flat");
  const prevPrice = useRef(0);

  useEffect(() => {
    let ws: WebSocket;
    let reconnectTimer: ReturnType<typeof setTimeout>;

    function connect() {
      ws = new WebSocket(BINANCE_WS);

      ws.onmessage = (event) => {
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

      ws.onclose = () => {
        reconnectTimer = setTimeout(connect, 3000);
      };

      ws.onerror = () => {
        ws.close();
      };
    }

    connect();

    return () => {
      clearTimeout(reconnectTimer);
      ws?.close();
    };
  }, []);

  return { price, direction };
}
