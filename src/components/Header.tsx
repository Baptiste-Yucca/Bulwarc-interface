import type { Address } from "viem";
import { formatRate, rateLabel, type CurrencyMode } from "../config/display";

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
  const short = address
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : null;

  return (
    <header className="header">
      <div className="header-left">
        <h1>BulwArc</h1>
        <span className="subtitle">FX Protection Protocol</span>
      </div>
      <div className="header-right">
        {oraclePrice > 0n && (
          <button className="oracle-badge currency-toggle" onClick={onToggleCurrency}>
            {rateLabel(currencyMode)} {formatRate(oraclePrice, currencyMode)}
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
