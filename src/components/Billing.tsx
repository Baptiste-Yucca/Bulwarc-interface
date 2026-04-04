import type { Shield } from "../hooks/useShields";
import { ARCSCAN_TX } from "../hooks/useShields";
import { premiumLabel, collateralLabel } from "../config/contracts";
import { formatRate, rateLabel, type CurrencyMode } from "../config/display";

interface Props {
  shields: Shield[];
  currencyMode: CurrencyMode;
  onClose: () => void;
}

const fmt6 = (v: bigint) => (Number(v) / 1e6).toFixed(2);

export function Billing({ shields, currencyMode, onClose }: Props) {
  // Exclude CREATED (status 0) — only funded shields are billable
  const billable = shields.filter((s) => s.status >= 1);

  const exercised = billable.filter((s) => s.status === 3);
  const expired = billable.filter((s) => s.status === 4);
  const active = billable.filter((s) => s.status >= 1 && s.status <= 2);

  // Totals — group by direction since tokens differ
  const totalPremiumNormal = billable.filter((s) => !s.isReverse).reduce((a, s) => a + s.premium, 0n);
  const totalFeeNormal = billable.filter((s) => !s.isReverse).reduce((a, s) => a + s.subscriberFee, 0n);
  const totalPremiumReverse = billable.filter((s) => s.isReverse).reduce((a, s) => a + s.premium, 0n);
  const totalFeeReverse = billable.filter((s) => s.isReverse).reduce((a, s) => a + s.subscriberFee, 0n);

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="glass rounded-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto p-6 animate-glow-pulse" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-accent glow-amber font-mono">Billing</h2>
          <button onClick={onClose} className="text-dim hover:text-white text-xl leading-none cursor-pointer">&times;</button>
        </div>

        {billable.length === 0 ? (
          <div className="py-10 text-center">
            <div className="text-dim text-sm font-mono">No billable shields yet.</div>
            <div className="text-dim/50 text-xs mt-2">Only funded shields appear here.</div>
          </div>
        ) : (
          <>
            {/* Summary cards */}
            <div className="grid grid-cols-3 gap-3 mb-5">
              <SummaryCard label="Exercised" count={exercised.length} color="text-neon-green" />
              <SummaryCard label="Expired" count={expired.length} color="text-dim" />
              <SummaryCard label="Active" count={active.length} color="text-cyan" />
            </div>

            {/* Cost breakdown */}
            <div className="bg-bg/60 rounded-xl p-4 mb-5 space-y-2">
              <div className="text-[10px] uppercase tracking-widest text-dim font-mono mb-2">Total Cost</div>
              {(totalPremiumNormal > 0n || totalFeeNormal > 0n) && (
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-dim">EUR→USD shields</span>
                  <span>{fmt6(totalPremiumNormal)} + {fmt6(totalFeeNormal)} fee <span className="text-dim">USDC</span></span>
                </div>
              )}
              {(totalPremiumReverse > 0n || totalFeeReverse > 0n) && (
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-dim">USD→EUR shields</span>
                  <span>{fmt6(totalPremiumReverse)} + {fmt6(totalFeeReverse)} fee <span className="text-dim">EURC</span></span>
                </div>
              )}
              <div className="border-t border-border/50 pt-2 mt-2 flex justify-between text-xs font-mono font-bold">
                <span className="text-accent">Total premiums</span>
                <span className="text-accent">{fmt6(totalPremiumNormal + totalPremiumReverse)}</span>
              </div>
            </div>

            {/* Shield list */}
            <div className="space-y-1.5">
              {billable
                .sort((a, b) => (b.createdEvent?.timestamp ?? 0) - (a.createdEvent?.timestamp ?? 0))
                .map((s) => (
                  <BillingRow key={s.id} shield={s} currencyMode={currencyMode} />
                ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function SummaryCard({ label, count, color }: { label: string; count: number; color: string }) {
  return (
    <div className="bg-bg/60 rounded-xl p-3 text-center">
      <div className={`text-xl font-bold font-mono ${color}`}>{count}</div>
      <div className="text-[10px] uppercase tracking-widest text-dim font-mono mt-0.5">{label}</div>
    </div>
  );
}

function BillingRow({ shield, currencyMode }: { shield: Shield; currencyMode: CurrencyMode }) {
  const s = shield;
  const pLabel = premiumLabel(s.isReverse);

  const statusTag = s.status === 3
    ? { label: "EXERCISED", cls: "bg-neon-green/15 text-neon-green" }
    : s.status === 4
      ? { label: "EXPIRED", cls: "bg-dim/15 text-dim" }
      : s.status === 2
        ? { label: "LOCKED", cls: "bg-cyan/15 text-cyan" }
        : { label: "PENDING", cls: "bg-accent/15 text-accent" };

  const fillPct = s.notional > 0n ? Number((s.filled * 100n) / s.notional) : 0;

  return (
    <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-surface hover:bg-surface2 transition-all">
      {/* Status dot */}
      <div className={`w-2 h-2 rounded-full shrink-0 ${
        s.status === 3 ? "bg-neon-green" : s.status === 4 ? "bg-dim/40" : "bg-cyan"
      }`} />

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold font-mono">#{s.id}</span>
          <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${statusTag.cls}`}>
            {statusTag.label}
          </span>
          <span className={`text-[9px] font-mono ${
            s.isReverse ? "text-neon-pink" : "text-cyan"
          }`}>
            {s.isReverse ? "USD→EUR" : "EUR→USD"}
          </span>
        </div>
        <div className="text-[10px] text-dim font-mono mt-0.5">
          {formatRate(s.strike, currencyMode)} strike — {fillPct}% covered
          {s.createdEvent && (
            <> — {new Date(s.createdEvent.timestamp * 1000).toLocaleDateString()}</>
          )}
        </div>
      </div>

      {/* Cost */}
      <div className="text-right shrink-0">
        <div className="text-xs font-bold font-mono">{fmt6(s.premium)} {pLabel}</div>
        {s.subscriberFee > 0n && (
          <div className="text-[9px] text-dim font-mono">+{fmt6(s.subscriberFee)} fee</div>
        )}
      </div>

      {/* Tx */}
      {s.createdEvent && (
        <a href={`${ARCSCAN_TX}${s.createdEvent.txHash}`} target="_blank" rel="noopener noreferrer"
          className="text-[9px] text-accent hover:underline font-mono shrink-0">
          Tx
        </a>
      )}
    </div>
  );
}
