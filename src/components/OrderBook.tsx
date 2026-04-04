import type { CurrencyMode } from "../config/display";
import type { Shield } from "../hooks/useShields";
import { ShieldCard } from "./ShieldCard";
import type { Filters } from "./FilterModal";

interface Props {
  shields: Shield[];
  loading: boolean;
  onSelect: (id: number) => void;
  currencyMode: CurrencyMode;
  filters: Filters;
}

function sortShields(list: Shield[], filters: Filters): Shield[] {
  const sorted = [...list].sort((a, b) => {
    let cmp = 0;
    switch (filters.sortBy) {
      case "strike": cmp = Number(a.strike - b.strike); break;
      case "notional": cmp = Number(a.notional - b.notional); break;
      case "expiry": cmp = Number(a.expiry - b.expiry); break;
      case "premium": {
        // Premium remaining proportional to unfilled
        const remA = a.notional > 0n ? a.premium * (a.notional - a.filled) / a.notional : 0n;
        const remB = b.notional > 0n ? b.premium * (b.notional - b.filled) / b.notional : 0n;
        cmp = Number(remA - remB);
        break;
      }
    }
    return filters.descending ? -cmp : cmp;
  });
  return sorted;
}

function EmptyColumn({ label }: { label: string }) {
  return (
    <div className="px-4 py-10 text-center text-dim text-xs font-mono">
      No active {label} shields
    </div>
  );
}

export function OrderBook({ shields, loading, onSelect, currencyMode, filters }: Props) {
  const active = shields.filter((s) => s.status <= 2 && !filters.hiddenStatuses.has(s.status));

  const showNormal = filters.direction === "all" || filters.direction === "normal";
  const showReverse = filters.direction === "all" || filters.direction === "reverse";

  const normal = showNormal ? sortShields(active.filter((s) => !s.isReverse), filters) : [];
  const reverse = showReverse ? sortShields(active.filter((s) => s.isReverse), filters) : [];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-dim font-mono text-sm animate-pulse">
        Loading market data...
      </div>
    );
  }

  // Single column mode when one direction is hidden
  if (!showNormal) {
    return (
      <div className="rounded-xl border border-neon-pink/20 bg-surface overflow-hidden">
        <ColumnHeader color="neon-pink" label="USD → EUR" count={reverse.length} sub="Travelers locking EUR rate" premiumIn="EURC" />
        {reverse.length === 0 ? <EmptyColumn label="USD→EUR" /> : reverse.map((s) => (
          <ShieldCard key={s.id} shield={s} onClick={() => onSelect(s.id)} currencyMode={currencyMode} />
        ))}
      </div>
    );
  }
  if (!showReverse) {
    return (
      <div className="rounded-xl border border-cyan/20 bg-surface overflow-hidden">
        <ColumnHeader color="cyan" label="EUR → USD" count={normal.length} sub="Workers protecting EUR income" premiumIn="USDC" />
        {normal.length === 0 ? <EmptyColumn label="EUR→USD" /> : normal.map((s) => (
          <ShieldCard key={s.id} shield={s} onClick={() => onSelect(s.id)} currencyMode={currencyMode} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="rounded-xl border border-cyan/20 bg-surface overflow-hidden">
        <ColumnHeader color="cyan" label="EUR → USD" count={normal.length} sub="Workers protecting EUR income" premiumIn="USDC" />
        {normal.length === 0 ? <EmptyColumn label="EUR→USD" /> : normal.map((s) => (
          <ShieldCard key={s.id} shield={s} onClick={() => onSelect(s.id)} currencyMode={currencyMode} />
        ))}
      </div>
      <div className="rounded-xl border border-neon-pink/20 bg-surface overflow-hidden">
        <ColumnHeader color="neon-pink" label="USD → EUR" count={reverse.length} sub="Travelers locking EUR rate" premiumIn="EURC" />
        {reverse.length === 0 ? <EmptyColumn label="USD→EUR" /> : reverse.map((s) => (
          <ShieldCard key={s.id} shield={s} onClick={() => onSelect(s.id)} currencyMode={currencyMode} />
        ))}
      </div>
    </div>
  );
}

function ColumnHeader({ color, label, count, sub, premiumIn }: { color: string; label: string; count: number; sub: string; premiumIn: string }) {
  const textCls = color === "cyan" ? "text-cyan glow-cyan" : "text-neon-pink glow-pink";
  const borderCls = color === "cyan" ? "border-cyan/20" : "border-neon-pink/20";
  return (
    <>
      <div className={`px-4 py-3 border-b ${borderCls} flex items-center justify-between`}>
        <h2 className={`text-sm font-bold ${textCls} tracking-wide`}>{label}</h2>
        <span className="text-[10px] text-dim font-mono">{count} active</span>
      </div>
      <div className="text-xs text-dim px-4 py-1.5 border-b border-border/30 flex justify-between">
        <span>{sub}</span>
        <span>Premium in {premiumIn}</span>
      </div>
    </>
  );
}
