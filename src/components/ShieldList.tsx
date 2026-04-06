import { SHIELD_STATUS } from "../config/contracts";
import { formatRate, rateLabel, type CurrencyMode } from "../config/display";
import { collateralLabel } from "../config/contracts";
import type { Shield } from "../hooks/useShields";
import { ARCSCAN_TX } from "../hooks/useShields";

interface Props {
  shields: Shield[];
  loading: boolean;
  selectedId: number | null;
  onSelect: (id: number) => void;
  currencyMode: CurrencyMode;
  emptyMessage?: string;
}

const fmt6 = (v: bigint) => (Number(v) / 1e6).toFixed(2);
const statusColor: Record<string, string> = {
  created: "bg-slate-500/15 text-slate-400",
  pending: "bg-amber-500/15 text-amber-400",
  locked: "bg-blue-500/15 text-blue-400",
  settled: "bg-emerald-500/15 text-emerald-400",
};
const statusClass = (s: number) => ["created","pending","locked","settled","settled"][s] ?? "created";

export function ShieldList({ shields, loading, selectedId, onSelect, currencyMode, emptyMessage }: Props) {
  if (loading) return <div className="bg-surface border border-border rounded-xl p-8 text-center text-dim">Loading shields...</div>;
  if (shields.length === 0) return <div className="bg-surface border border-border rounded-xl p-10 text-center text-dim">{emptyMessage || "No shields yet."}</div>;

  return (
    <div className="bg-surface border border-border rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-border">
        <h2 className="text-sm font-semibold">Shields ({shields.length})</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-dim border-b border-border">
              <th className="text-left px-3 py-2 font-medium">#</th>
              <th className="text-left px-3 py-2 font-medium">Dir</th>
              <th className="text-left px-3 py-2 font-medium">Created</th>
              <th className="text-left px-3 py-2 font-medium">Strike</th>
              <th className="text-left px-3 py-2 font-medium">Notional</th>
              <th className="text-left px-3 py-2 font-medium">Filled</th>
              <th className="text-left px-3 py-2 font-medium">Del.</th>
              <th className="text-left px-3 py-2 font-medium">Status</th>
              <th className="text-left px-3 py-2 font-medium">Tx</th>
            </tr>
          </thead>
          <tbody>
            {shields.map((s) => {
              const cToken = collateralLabel(s.isReverse);
              const cls = statusClass(s.status);
              return (
                <tr key={s.id}
                  onClick={() => onSelect(s.id)}
                  className={`cursor-pointer border-b border-border/50 transition-colors whitespace-nowrap
                    ${selectedId === s.id ? "bg-surface2 border-l-[3px] border-l-blue-500" : "hover:bg-surface2/60"}
                  `}
                >
                  <td className="px-3 py-2.5 font-medium">{s.id}</td>
                  <td className="px-3 py-2.5">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${s.isReverse ? "bg-purple/15 text-purple" : "bg-blue-500/15 text-blue-400"}`}>
                      {s.isReverse ? "USD→EUR" : "EUR→USD"}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-dim">
                    {s.createdEvent ? new Date(s.createdEvent.timestamp * 1000).toLocaleDateString() : "-"}
                  </td>
                  <td className="px-3 py-2.5">{formatRate(s.strike, currencyMode)}</td>
                  <td className="px-3 py-2.5">{fmt6(s.notional)} {cToken}</td>
                  <td className="px-3 py-2.5">{fmt6(s.filled)}/{fmt6(s.notional)}</td>
                  <td className="px-3 py-2.5">{s.deliveryRate}%</td>
                  <td className="px-3 py-2.5">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide ${statusColor[cls]}`}>
                      {SHIELD_STATUS[s.status]}
                    </span>
                  </td>
                  <td className="px-3 py-2.5">
                    {s.createdEvent && (
                      <a href={`${ARCSCAN_TX}${s.createdEvent.txHash}`} target="_blank" rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-blue-400 hover:underline font-mono text-[10px]">
                        {s.createdEvent.txHash.slice(0, 8)}...
                      </a>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
