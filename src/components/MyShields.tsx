import { formatRate, rateLabel, type CurrencyMode } from "../config/display";
import { SHIELD_STATUS, collateralLabel } from "../config/contracts";
import type { Shield } from "../hooks/useShields";
import { ARCSCAN_TX } from "../hooks/useShields";

interface Props {
  shields: Shield[];
  loading: boolean;
  currencyMode: CurrencyMode;
  onSelect: (id: number) => void;
  onClose: () => void;
}

const fmt6 = (v: bigint) => (Number(v) / 1e6).toFixed(2);

function timeAgo(ts: number): string {
  const diff = Math.floor(Date.now() / 1000) - ts;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function statusInfo(s: Shield): { label: string; color: string; detail: string } {
  const cLabel = collateralLabel(s.isReverse);
  const fillPct = s.notional > 0n ? Number((s.filled * 100n) / s.notional) : 0;

  switch (s.status) {
    case 0: return { label: "CREATED", color: "text-dim", detail: "Awaiting premium funding" };
    case 1: return { label: "PENDING", color: "text-accent", detail: `${fillPct}% covered (${fmt6(s.filled)}/${fmt6(s.notional)} ${cLabel})` };
    case 2: return { label: "LOCKED", color: "text-cyan glow-cyan", detail: "Fully covered, awaiting settlement" };
    case 3: return { label: "SETTLED", color: "text-neon-green glow-green", detail: `Settled — ${s.deliveryRate}% delivery` };
    case 4: {
      const wasFull = s.filled === s.notional;
      return { label: "SETTLED", color: "text-dim", detail: wasFull ? "Settled, fully covered" : `Settled, ${fillPct}% covered` };
    }
    default: return { label: "UNKNOWN", color: "text-dim", detail: "" };
  }
}

export function MyShields({ shields, loading, currencyMode, onSelect, onClose }: Props) {
  // Sort by creation time, most recent first
  const sorted = [...shields].sort((a, b) => {
    const tsA = a.createdEvent?.timestamp ?? 0;
    const tsB = b.createdEvent?.timestamp ?? 0;
    return tsB - tsA;
  });

  // Split into active and past
  const active = sorted.filter((s) => s.status <= 2);
  const past = sorted.filter((s) => s.status > 2);

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="glass rounded-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto p-6 animate-glow-pulse" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-cyan glow-cyan font-mono">My Shields</h2>
          <button onClick={onClose} className="text-dim hover:text-white text-xl leading-none cursor-pointer">&times;</button>
        </div>

        {loading ? (
          <div className="py-10 text-center text-dim text-sm font-mono animate-pulse">Loading...</div>
        ) : sorted.length === 0 ? (
          <div className="py-10 text-center">
            <div className="text-dim text-sm font-mono">No shields yet.</div>
            <div className="text-dim/50 text-xs mt-2">Create your first shield to protect your income.</div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Active shields */}
            {active.length > 0 && (
              <div>
                <div className="text-[10px] uppercase tracking-widest text-accent font-mono mb-3 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse-dot" />
                  Active ({active.length})
                </div>
                <div className="space-y-2">
                  {active.map((s) => (
                    <ShieldRow key={s.id} shield={s} currencyMode={currencyMode} onSelect={onSelect} />
                  ))}
                </div>
              </div>
            )}

            {/* Past shields */}
            {past.length > 0 && (
              <div>
                <div className="text-[10px] uppercase tracking-widest text-dim font-mono mb-3">
                  History ({past.length})
                </div>
                <div className="space-y-2">
                  {past.map((s) => (
                    <ShieldRow key={s.id} shield={s} currencyMode={currencyMode} onSelect={onSelect} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ShieldRow({ shield, currencyMode, onSelect }: { shield: Shield; currencyMode: CurrencyMode; onSelect: (id: number) => void }) {
  const s = shield;
  const info = statusInfo(s);
  const cLabel = collateralLabel(s.isReverse);
  const isActive = s.status <= 2;

  return (
    <div
      onClick={() => onSelect(s.id)}
      className={`flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-all ${
        isActive ? "bg-surface hover:bg-surface2" : "bg-bg/40 hover:bg-surface/60"
      }`}
    >
      {/* Left: status indicator */}
      <div className="pt-1">
        <div className={`w-2.5 h-2.5 rounded-full ${
          s.status === 3 ? "bg-neon-green" : s.status === 4 ? "bg-dim/40" : s.status === 2 ? "bg-cyan" : "bg-accent"
        } ${isActive ? "animate-pulse-dot" : ""}`} />
      </div>

      {/* Center: info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-sm font-bold font-mono">#{s.id}</span>
          <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
            s.isReverse ? "bg-neon-pink/15 text-neon-pink" : "bg-cyan/15 text-cyan"
          }`}>
            {s.isReverse ? "USD→EUR" : "EUR→USD"}
          </span>
          <span className={`text-[10px] font-bold font-mono uppercase ${info.color}`}>
            {info.label}
          </span>
        </div>
        <div className="text-xs text-dim font-mono">{info.detail}</div>
        <div className="flex items-center gap-3 mt-1 text-[10px] text-dim font-mono">
          <span>{formatRate(s.strike, currencyMode)} strike</span>
          <span>{fmt6(s.notional)} {cLabel}</span>
          {s.createdEvent && <span>{timeAgo(s.createdEvent.timestamp)}</span>}
        </div>
      </div>

      {/* Right: tx link */}
      <div className="flex flex-col items-end gap-1 shrink-0">
        {s.createdEvent && (
          <a
            href={`${ARCSCAN_TX}${s.createdEvent.txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="text-[9px] text-accent hover:underline font-mono"
          >
            Tx &rarr;
          </a>
        )}
        {/* Coverage bar for visual */}
        {s.notional > 0n && (
          <div className="w-12 h-1 bg-border rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${s.status === 3 ? "bg-neon-green" : s.status === 4 ? "bg-dim/40" : "bg-cyan"}`}
              style={{ width: `${Number((s.filled * 100n) / s.notional)}%` }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
