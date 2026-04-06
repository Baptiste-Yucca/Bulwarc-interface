import { useState, useEffect } from "react";
import { formatRate, rateLabel, type CurrencyMode } from "../config/display";
import { premiumLabel, collateralLabel } from "../config/contracts";
import type { Shield, Fill } from "../hooks/useShields";
import { ARCSCAN_TX, getFills } from "../hooks/useShields";

const API = import.meta.env.VITE_API_URL || "http://localhost:3001";

interface Props {
  shield: Shield;
  currencyMode: CurrencyMode;
  onClose: () => void;
}

interface EventRow {
  event_name: string;
  shield_id: number;
  tx_hash: string;
  block_number: number;
  block_timestamp: number;
  args_json: string;
}

const fmt6 = (v: bigint) => (Number(v) / 1e6).toFixed(2);

// Token flow arrow component
function TokenFlow({ from, to, amount, token, color }: {
  from: string; to: string; amount: string; token: string; color: string;
}) {
  return (
    <div className={`flex items-center gap-2 text-xs font-mono ${color} ml-8 my-0.5`}>
      <span className="text-dim text-[10px] w-20 text-right shrink-0">{from}</span>
      <span className="text-[10px]">──→</span>
      <span className="font-bold">{amount} {token}</span>
      <span className="text-[10px]">──→</span>
      <span className="text-dim text-[10px]">{to}</span>
    </div>
  );
}

// Timeline step node
function Step({ step, title, time, txHash, active, children }: {
  step: string; title: string; time?: string; txHash?: string;
  active?: boolean; children?: React.ReactNode;
}) {
  return (
    <div className="flex gap-4">
      {/* Dot + line */}
      <div className="flex flex-col items-center">
        <div className={`w-3 h-3 rounded-full shrink-0 border-2 ${
          active ? "bg-accent border-accent glow-amber" : "bg-surface2 border-border"
        }`} />
        <div className="w-px flex-1 bg-border/50" />
      </div>

      {/* Content */}
      <div className="pb-6 flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] font-bold text-accent font-mono uppercase tracking-widest">{step}</span>
          <span className="text-sm font-bold">{title}</span>
          {txHash && (
            <a href={`${ARCSCAN_TX}${txHash}`} target="_blank" rel="noopener noreferrer"
              className="text-[9px] text-accent hover:underline font-mono">
              {txHash.slice(0, 8)}...
            </a>
          )}
        </div>
        {time && <div className="text-[10px] text-dim font-mono mt-0.5">{time}</div>}
        <div className="mt-1.5">{children}</div>
      </div>
    </div>
  );
}

export function CallFlow({ shield, currencyMode, onClose }: Props) {
  const s = shield;
  const [events, setEvents] = useState<EventRow[]>([]);
  const [fills, setFills] = useState<Fill[]>([]);

  const pLabel = premiumLabel(s.isReverse);
  const cLabel = collateralLabel(s.isReverse);
  const pColor = s.isReverse ? "text-neon-pink" : "text-cyan";
  const cColor = s.isReverse ? "text-cyan" : "text-neon-pink";

  useEffect(() => {
    fetch(`${API}/shields/${s.id}/events`).then(r => r.json()).then(setEvents).catch(console.error);
    getFills(s.id).then(setFills).catch(console.error);
  }, [s.id]);

  // Extract events by type
  const findEvent = (name: string) => events.find(e => e.event_name === name);
  const createdEv = findEvent("ShieldCreated");
  const fundedEv = findEvent("ShieldFunded");
  const filledEvs = events.filter(e => e.event_name === "ShieldFilled");
  const lockedEv = findEvent("ShieldLocked");
  const settledEv = findEvent("ShieldSettled");

  const fmtTs = (ts: number) => new Date(ts * 1000).toLocaleString();

  // Settlement calculations
  const fillPct = s.notional > 0n ? Number((s.filled * 100n) / s.notional) : 0;
  const deliveryPct = s.deliveryRate;

  // Fee calculations
  const usedFeePct = s.notional > 0n
    ? Number(s.filled * 100n / s.notional) * deliveryPct / 100
    : 0;
  const feeRefund = s.subscriberFee > 0n
    ? s.subscriberFee - (s.subscriberFee * BigInt(Math.round(usedFeePct)) / 100n)
    : 0n;

  // Get payoff and inTheMoney from ShieldSettled event
  let payoff = 0n;
  let settledInTheMoney = false;
  if (settledEv) {
    try {
      const args = JSON.parse(settledEv.args_json);
      payoff = BigInt(args.payoff || "0");
      settledInTheMoney = args.inTheMoney === true || args.inTheMoney === "true";
    } catch {}
  }

  // Guardian premium earned (pro-rata of total premium based on fill)
  const guardianPremiumEarned = s.notional > 0n ? s.premium * s.filled / s.notional : 0n;

  // Protocol fees
  const protocolPremiumFee = s.subscriberFee - feeRefund;
  // Guardian fees are not stored in shield struct — approximate from feeBps if known
  // For display, we show what we have

  const isSettled = s.status === 3 || s.status === 4;
  const isHit = isSettled && settledInTheMoney;
  const isMiss = isSettled && !settledInTheMoney;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="glass rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 animate-glow-pulse" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-accent glow-amber font-mono">Call Flow</h2>
            <span className="text-sm font-mono text-dim">Shield #{s.id}</span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${s.isReverse ? "bg-neon-pink/15 text-neon-pink" : "bg-cyan/15 text-cyan"}`}>
              {s.isReverse ? "USD→EUR" : "EUR→USD"}
            </span>
          </div>
          <button onClick={onClose} className="text-dim hover:text-white text-xl leading-none cursor-pointer">&times;</button>
        </div>

        {/* Timeline */}
        <div className="mb-6">
          {/* STEP 1: CREATE */}
          <Step step="Step 1" title="Shield Created" active={!!createdEv}
            time={createdEv ? fmtTs(createdEv.block_timestamp) : undefined}
            txHash={createdEv?.tx_hash}>
            <div className="text-xs text-dim font-mono">
              Worker declares protection: {formatRate(s.strike, currencyMode)} {rateLabel(currencyMode)} strike, {fmt6(s.notional)} {cLabel} notional
            </div>
            <div className="text-[10px] text-dim mt-0.5">No token transfer — shield awaits funding</div>
          </Step>

          {/* STEP 2: FUND */}
          <Step step="Step 2" title="Premium Funded" active={!!fundedEv}
            time={fundedEv ? fmtTs(fundedEv.block_timestamp) : undefined}
            txHash={fundedEv?.tx_hash}>
            <div className="text-[10px] text-dim mb-1">Employer deposits premium + protocol fee</div>
            <TokenFlow from="Employer" to="Escrow" amount={fmt6(s.premium)} token={pLabel} color={pColor} />
            {s.subscriberFee > 0n && (
              <TokenFlow from="Employer" to="Protocol" amount={fmt6(s.subscriberFee)} token={pLabel} color="text-accent" />
            )}
          </Step>

          {/* STEP 3: MATCH */}
          <Step step="Step 3" title={`Guardians Match (${fillPct}%)`} active={filledEvs.length > 0}
            time={filledEvs.length > 0 ? fmtTs(filledEvs[0].block_timestamp) : undefined}
            txHash={filledEvs[0]?.tx_hash}>
            <div className="text-[10px] text-dim mb-1">
              {fills.length} guardian(s) deposit collateral, earn premium immediately
            </div>
            {fills.map((f, i) => (
              <div key={i}>
                <TokenFlow from={`Guardian ${i+1}`} to="Escrow" amount={fmt6(f.amount)} token={cLabel} color={cColor} />
              </div>
            ))}
            {guardianPremiumEarned > 0n && (
              <TokenFlow from="Escrow" to="Guardians" amount={fmt6(guardianPremiumEarned)} token={pLabel} color={pColor} />
            )}
            {lockedEv && (
              <div className="text-[10px] text-cyan font-mono mt-1 glow-cyan">Shield fully covered → LOCKED</div>
            )}
          </Step>

          {/* STEP 4: DELIVERY (floating) */}
          <Step step="Step 4" title={`Delivery Validated: ${deliveryPct}%`} active={deliveryPct > 0}>
            <div className="text-[10px] text-dim">
              Validator confirms work delivery rate. Scales future payoff proportionally.
            </div>
            <div className="text-[10px] text-dim mt-0.5">
              {deliveryPct === 100
                ? "Full delivery → full FX protection"
                : deliveryPct === 0
                  ? "No delivery confirmed → exercise blocked"
                  : `${deliveryPct}% delivery → ${deliveryPct}% of payoff available`}
            </div>
          </Step>

          {/* STEP 5: SETTLEMENT */}
          {isHit && (
            <Step step="Step 5" title="HIT — Settled In The Money" active
              time={settledEv ? fmtTs(settledEv.block_timestamp) : undefined}
              txHash={settledEv?.tx_hash}>
              <div className="text-[10px] text-dim mb-1">
                Oracle &lt; strike → USD weakened vs EUR. Worker receives FX compensation.
              </div>
              {payoff > 0n && (
                <>
                  <TokenFlow from="Escrow" to="Worker" amount={fmt6(payoff)} token={cLabel} color="text-neon-green" />
                  <div className="text-[10px] text-dim mt-0.5 ml-8">FX payoff (scaled by {deliveryPct}% delivery)</div>
                </>
              )}
              {s.filled - payoff > 0n && (
                <TokenFlow from="Escrow" to="Guardians" amount={fmt6(s.filled - payoff)} token={cLabel} color={cColor} />
              )}
              {/* Guardian salary share for delivered work */}
              {deliveryPct > 0 && (
                <>
                  <TokenFlow from="Escrow" to="Guardians" amount={fmt6(s.notional * BigInt(deliveryPct) / 100n)} token={pLabel} color={pColor} />
                  <div className="text-[10px] text-dim mt-0.5 ml-8">Salary share ({deliveryPct}% delivered)</div>
                </>
              )}
              {feeRefund > 0n && (
                <TokenFlow from="Protocol" to="Worker" amount={fmt6(feeRefund)} token={pLabel} color="text-accent" />
              )}
            </Step>
          )}

          {isMiss && (
            <Step step="Step 5" title="MISS — Settled Out Of Money" active
              time={settledEv ? fmtTs(settledEv.block_timestamp) : undefined}
              txHash={settledEv?.tx_hash}>
              <div className="text-[10px] text-dim mb-1">
                Oracle ≥ strike → USD stable or stronger. No FX protection triggered.
              </div>
              <TokenFlow from="Escrow" to="Worker" amount={fmt6(s.notional)} token={pLabel} color="text-neon-green" />
              <div className="text-[10px] text-dim mt-0.5 ml-8">Worker gets salary back (no FX loss)</div>
              {s.filled > 0n && (
                <TokenFlow from="Escrow" to="Guardians" amount={fmt6(s.filled)} token={cLabel} color={cColor} />
              )}
              <div className="text-[10px] text-dim mt-0.5 ml-8">Guardians get collateral back + keep premium earned at match</div>
              {feeRefund > 0n && (
                <TokenFlow from="Protocol" to="Worker" amount={fmt6(feeRefund)} token={pLabel} color="text-accent" />
              )}
            </Step>
          )}

          {!isSettled && (
            <Step step="Step 5" title="Pending settlement...">
              <div className="text-[10px] text-dim">Shield is still active. Awaiting expiry or exercise.</div>
            </Step>
          )}
        </div>

        {/* Settlement Summary */}
        {isSettled && (
          <div className="bg-bg/60 rounded-xl p-4 border border-border/50">
            <div className="text-[10px] uppercase tracking-widest text-accent font-mono font-bold mb-3 glow-amber">
              Settlement Summary
            </div>
            <div className="space-y-2 text-xs font-mono">
              {/* Worker */}
              <SummaryRow
                party="Worker"
                paid="-"
                received={
                  isHit
                    ? payoff > 0n ? `${fmt6(payoff)} ${cLabel}` : "-"
                    : `${fmt6(s.notional)} ${pLabel} (salary back)`
                }
                extra={feeRefund > 0n ? `+${fmt6(feeRefund)} ${pLabel} fee refund` : undefined}
                color="text-neon-green"
              />
              {/* Employer */}
              <SummaryRow
                party="Employer"
                paid={`${fmt6(s.premium + s.subscriberFee)} ${pLabel}`}
                received="-"
                color="text-dim"
              />
              {/* Guardians */}
              <SummaryRow
                party={`Guardian${fills.length > 1 ? "s" : ""}`}
                paid={`${fmt6(s.filled)} ${cLabel}`}
                received={isHit
                  ? `${fmt6(s.filled - payoff)} ${cLabel} + ${fmt6(guardianPremiumEarned)} ${pLabel}`
                  : `${fmt6(s.filled)} ${cLabel} + ${fmt6(guardianPremiumEarned)} ${pLabel}`
                }
                color="text-cyan"
              />
              {/* Protocol */}
              <SummaryRow
                party="Protocol"
                paid="-"
                received={protocolPremiumFee > 0n ? `${fmt6(protocolPremiumFee)} ${pLabel} fees` : "Fees refunded"}
                color="text-accent"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SummaryRow({ party, paid, received, extra, color }: {
  party: string; paid: string; received: string; extra?: string; color: string;
}) {
  return (
    <div className="flex items-start gap-4 py-1.5 border-b border-border/30 last:border-b-0">
      <span className={`w-20 shrink-0 font-bold ${color}`}>{party}</span>
      <div className="flex-1 grid grid-cols-2 gap-2">
        <div>
          <span className="text-[9px] text-dim uppercase block">Paid</span>
          <span>{paid}</span>
        </div>
        <div>
          <span className="text-[9px] text-dim uppercase block">Received</span>
          <span>{received}</span>
          {extra && <div className="text-[9px] text-accent">{extra}</div>}
        </div>
      </div>
    </div>
  );
}
