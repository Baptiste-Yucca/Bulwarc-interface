import type { Address } from "viem";
import { useLivePrice } from "../hooks/useLivePrice";
import { rateLabel, type CurrencyMode } from "../config/display";

interface Props {
  address: Address | null;
  connecting: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
  currencyMode: CurrencyMode;
  onToggleCurrency: () => void;
  onOpenTreasury: () => void;
}

export function Header({
  address, connecting, onConnect, onDisconnect,
  currencyMode, onToggleCurrency, onOpenTreasury,
}: Props) {
  const live = useLivePrice();
  const short = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : null;

  const liveDisplay = currencyMode === "EUR/USD"
    ? live.price.toFixed(4)
    : live.price > 0 ? (1 / live.price).toFixed(4) : "-.----";

  const dirColor = live.direction === "up" ? "text-neon-green" : live.direction === "down" ? "text-neon-pink" : "text-dim";

  return (
    <header className="sticky top-0 z-50 border-b border-accent/15 bg-bg/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-accent glow-amber animate-flicker tracking-wider font-mono">
            BULWARC
          </h1>
          <span className="hidden sm:inline text-[10px] text-dim uppercase tracking-[0.2em]">FX Hedge on Arc</span>
        </div>

        {/* Live price */}
        <button
          onClick={onToggleCurrency}
          className={`flex items-center gap-2 px-4 py-1.5 rounded-lg border font-mono text-sm transition-all cursor-pointer
            ${live.testMode
              ? "border-accent/40 bg-accent/5 text-accent"
              : `border-neon-green/20 bg-neon-green/5 ${dirColor}`
            }`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse-dot" />
          <span className="text-[9px] font-bold tracking-widest opacity-60">
            {live.testMode ? "TEST" : "LIVE"}
          </span>
          <span className={live.testMode ? "" : dirColor === "text-neon-green" ? "glow-green" : ""}>
            {rateLabel(currencyMode)} {live.price > 0 ? liveDisplay : "-.----"}
          </span>
          <span className="text-[10px]">
            {live.direction === "up" ? "▲" : live.direction === "down" ? "▼" : ""}
          </span>
        </button>

        {/* Treasury + Wallet */}
        <div className="flex items-center gap-2">
          <button onClick={onOpenTreasury} title="Protocol Treasury"
            className="p-2 rounded-lg border border-accent/20 text-accent hover:bg-accent/10 transition-all cursor-pointer">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
          </button>
          {address ? (
            <>
              <span className="hidden sm:inline px-3 py-1.5 bg-surface border border-border rounded-lg text-xs font-mono text-dim">
                {short}
              </span>
              <button onClick={onDisconnect}
                className="px-3 py-1.5 text-xs border border-border rounded-lg text-dim hover:text-white hover:border-accent/30 transition-all cursor-pointer">
                Disconnect
              </button>
            </>
          ) : (
            <button onClick={onConnect} disabled={connecting}
              className="px-4 py-2 bg-accent hover:bg-accent/80 text-black text-sm font-bold rounded-lg transition-all disabled:opacity-50 cursor-pointer">
              {connecting ? "Connecting..." : "Connect Wallet"}
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
