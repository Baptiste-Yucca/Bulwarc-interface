import type { CurrencyMode } from "../config/display";
import type { Shield } from "../hooks/useShields";
import { ShieldCard } from "./ShieldCard";

interface Props {
  shields: Shield[];
  loading: boolean;
  onSelect: (id: number) => void;
  currencyMode: CurrencyMode;
}

function EmptyColumn({ label }: { label: string }) {
  return (
    <div className="px-4 py-10 text-center text-dim text-xs">
      No active {label} shields
    </div>
  );
}

export function OrderBook({ shields, loading, onSelect, currencyMode }: Props) {
  const active = shields.filter((s) => s.status <= 2);
  const normal = active.filter((s) => !s.isReverse);
  const reverse = active.filter((s) => s.isReverse);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-dim font-mono text-sm animate-pulse">
        Loading market data...
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* EUR → USD column */}
      <div className="rounded-xl border border-cyan/20 bg-surface overflow-hidden">
        <div className="px-4 py-3 border-b border-cyan/20 flex items-center justify-between">
          <h2 className="text-sm font-bold text-cyan glow-cyan tracking-wide">
            EUR → USD
          </h2>
          <span className="text-[10px] text-dim font-mono">{normal.length} active</span>
        </div>
        <div className="text-xs text-dim px-4 py-1.5 border-b border-border/30 flex justify-between">
          <span>Workers protecting EUR income</span>
          <span>Premium in USDC</span>
        </div>
        {normal.length === 0 ? (
          <EmptyColumn label="EUR→USD" />
        ) : (
          normal.map((s) => (
            <ShieldCard
              key={s.id}
              shield={s}
              onClick={() => onSelect(s.id)}
              currencyMode={currencyMode}
            />
          ))
        )}
      </div>

      {/* USD → EUR column */}
      <div className="rounded-xl border border-neon-pink/20 bg-surface overflow-hidden">
        <div className="px-4 py-3 border-b border-neon-pink/20 flex items-center justify-between">
          <h2 className="text-sm font-bold text-neon-pink glow-pink tracking-wide">
            USD → EUR
          </h2>
          <span className="text-[10px] text-dim font-mono">{reverse.length} active</span>
        </div>
        <div className="text-xs text-dim px-4 py-1.5 border-b border-border/30 flex justify-between">
          <span>Travelers locking EUR rate</span>
          <span>Premium in EURC</span>
        </div>
        {reverse.length === 0 ? (
          <EmptyColumn label="USD→EUR" />
        ) : (
          reverse.map((s) => (
            <ShieldCard
              key={s.id}
              shield={s}
              onClick={() => onSelect(s.id)}
              currencyMode={currencyMode}
            />
          ))
        )}
      </div>
    </div>
  );
}
