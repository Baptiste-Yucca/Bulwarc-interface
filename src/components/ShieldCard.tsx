import { formatRate, type CurrencyMode } from "../config/display";
import { premiumLabel, collateralLabel } from "../config/contracts";
import type { Shield } from "../hooks/useShields";

interface Props {
  shield: Shield;
  onClick: () => void;
  currencyMode: CurrencyMode;
}

const fmt6 = (v: bigint) => (Number(v) / 1e6).toFixed(2);

function daysLeft(expiry: bigint): string {
  const diff = Number(expiry) - Math.floor(Date.now() / 1000);
  if (diff <= 0) return "Expired";
  const d = Math.floor(diff / 86400);
  if (d > 0) return `${d}d`;
  const h = Math.floor(diff / 3600);
  return `${h}h`;
}

export function ShieldCard({ shield, onClick, currencyMode }: Props) {
  const s = shield;
  const cLabel = collateralLabel(s.isReverse);
  const pLabel = premiumLabel(s.isReverse);
  const fillPct = s.notional > 0n ? Number((s.filled * 100n) / s.notional) : 0;
  const remaining = s.notional - s.filled;
  const premiumRemaining = s.notional > 0n
    ? fmt6(s.premium * remaining / s.notional)
    : "0";

  return (
    <div
      onClick={onClick}
      className="px-4 py-3 cursor-pointer transition-all hover:bg-surface2/60 group border-b border-border/30 last:border-b-0"
    >
      {/* Top row */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-[10px] text-dim font-mono">#{s.id}</span>
          <span className="text-sm font-bold font-mono">{formatRate(s.strike, currencyMode)}</span>
          <span className="text-xs text-dim">{fmt6(s.notional)} {cLabel}</span>
          <span className="text-[10px] text-dim">{daysLeft(s.expiry)}</span>
        </div>

        {/* Status badge */}
        {s.status === 0 && (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-accent/15 text-accent border border-accent/30">
            Needs Funding
          </span>
        )}
        {s.status === 2 && (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-cyan/15 text-cyan border border-cyan/30">
            Locked
          </span>
        )}
      </div>

      {/* PENDING: progress bar + earn CTA */}
      {s.status === 1 && (
        <div className="mt-2">
          <div className="h-1 bg-border rounded-full overflow-hidden">
            <div
              className="h-full bg-neon-green rounded-full transition-all"
              style={{ width: `${fillPct}%` }}
            />
          </div>
          <div className="flex justify-between mt-1 text-[10px]">
            <span className="text-dim">{fillPct}% filled</span>
            <span className="text-neon-green font-semibold glow-green">
              Earn {premiumRemaining} {pLabel}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
