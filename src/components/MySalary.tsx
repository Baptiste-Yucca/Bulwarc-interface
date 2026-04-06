import type { Shield } from "../hooks/useShields";
import { ARCSCAN_TX } from "../hooks/useShields";
import { formatRate, rateLabel, type CurrencyMode } from "../config/display";
import { SHIELD_STATUS, premiumLabel, collateralLabel } from "../config/contracts";

interface Props {
  shields: Shield[];
  loading: boolean;
  currencyMode: CurrencyMode;
  onClose: () => void;
}

const fmt6 = (v: bigint) => (Number(v) / 1e6).toFixed(2);

export function MySalary({ shields, loading, currencyMode, onClose }: Props) {
  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="glass rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6 animate-glow-pulse" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-neon-green glow-green font-mono">My Salary</h2>
          <button onClick={onClose} className="text-dim hover:text-white text-xl leading-none cursor-pointer">&times;</button>
        </div>
        <p className="text-xs text-dim mb-4 font-mono">Settled shields — your FX protection payslips.</p>

        {loading ? (
          <div className="py-10 text-center text-dim text-sm font-mono animate-pulse">Loading...</div>
        ) : shields.length === 0 ? (
          <div className="py-10 text-center">
            <div className="text-dim text-sm font-mono">No settled shields yet.</div>
            <div className="text-dim/50 text-xs mt-2">Settled shields will appear here as payslip records.</div>
          </div>
        ) : (
          <div className="space-y-3">
            {shields.map((s) => {
              const pLabel = premiumLabel(s.isReverse);
              const cLabel = collateralLabel(s.isReverse);
              return (
                <div key={s.id} className="bg-bg/60 rounded-xl p-4 border-l-[3px] border-l-neon-green">
                  <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm font-mono text-neon-green">#{s.id}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${s.isReverse ? "bg-neon-pink/15 text-neon-pink" : "bg-cyan/15 text-cyan"}`}>
                        {s.isReverse ? "USD→EUR" : "EUR→USD"}
                      </span>
                      {s.createdEvent && <span className="text-[10px] text-dim font-mono">{new Date(s.createdEvent.timestamp * 1000).toLocaleDateString()}</span>}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-neon-green/15 text-neon-green">{SHIELD_STATUS[s.status]}</span>
                      {s.createdEvent && (
                        <a href={`${ARCSCAN_TX}${s.createdEvent.txHash}`} target="_blank" rel="noopener noreferrer"
                          className="text-[10px] text-accent hover:underline font-mono">Tx &rarr;</a>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                    <div><span className="text-[9px] text-dim uppercase tracking-widest block">Strike</span>{formatRate(s.strike, currencyMode)}</div>
                    <div><span className="text-[9px] text-dim uppercase tracking-widest block">Notional</span>{fmt6(s.notional)} {cLabel}</div>
                    <div><span className="text-[9px] text-dim uppercase tracking-widest block">Premium</span>{fmt6(s.premium)} {pLabel}</div>
                    <div><span className="text-[9px] text-dim uppercase tracking-widest block">Delivery</span>{s.deliveryRate}%</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
