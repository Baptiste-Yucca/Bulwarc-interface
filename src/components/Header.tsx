import type { Address } from "viem";
import { formatRate, rateLabel, type CurrencyMode } from "../config/display";
import { useLivePrice } from "../hooks/useLivePrice";

interface Props {
  address: Address | null;
  connecting: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
  oraclePrice: bigint;
  currencyMode: CurrencyMode;
  onToggleCurrency: () => void;
}

export function Header({
  address,
  connecting,
  onConnect,
  onDisconnect,
  oraclePrice,
  currencyMode,
  onToggleCurrency,
}: Props) {
  const live = useLivePrice();
  const short = address
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : null;

  const liveDisplay =
    currencyMode === "EUR/USD"
      ? live.price.toFixed(4)
      : live.price > 0
        ? (1 / live.price).toFixed(4)
        : "-.----";

  return (
    <header className="header">
      <div className="header-left">
        <h1>BulwArc</h1>
        <span className="subtitle">FX Protection Protocol</span>
      </div>
      <div className="header-right">
        {/* Live market price */}
        {live.price > 0 && (
          <span className={`live-price live-${live.direction}`}>
            <span className="live-dot" />
            {rateLabel(currencyMode)} {liveDisplay}
            <span className="live-arrow">
              {live.direction === "up" ? "▲" : live.direction === "down" ? "▼" : ""}
            </span>
          </span>
        )}

        {/* Oracle on-chain price */}
        {oraclePrice > 0n && (
          <button className="oracle-badge currency-toggle" onClick={onToggleCurrency}>
            Oracle: {formatRate(oraclePrice, currencyMode)}
            <span className="swap-icon">⇄</span>
          </button>
        )}

        {address ? (
          <div className="wallet-info">
            <span className="address-badge">{short}</span>
            <button className="btn btn-outline" onClick={onDisconnect}>
              Disconnect
            </button>
          </div>
        ) : (
          <button
            className="btn btn-primary"
            onClick={onConnect}
            disabled={connecting}
          >
            {connecting ? "Connecting..." : "Connect Wallet"}
          </button>
        )}
      </div>
    </header>
  );
}
