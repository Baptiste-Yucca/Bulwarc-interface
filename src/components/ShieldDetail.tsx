import { useState, useEffect } from "react";
import type { WalletClient, Address } from "viem";
import { parseUnits } from "viem";
import {
  SHIELD_STATUS, premiumToken, collateralToken, premiumLabel, collateralLabel,
} from "../config/contracts";
import { formatRate, rateLabel, type CurrencyMode } from "../config/display";
import type { Shield } from "../hooks/useShields";
import { getFills, ARCSCAN_TX, type Fill } from "../hooks/useShields";
import { useContractWrite } from "../hooks/useContractWrite";

interface Props {
  shield: Shield;
  walletClient: WalletClient | null;
  address: Address | null;
  oraclePrice: bigint;
  currencyMode: CurrencyMode;
  onSuccess: () => void;
  onClose: () => void;
}

const fmt6 = (v: bigint) => (Number(v) / 1e6).toFixed(2);

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-widest text-dim mb-0.5 font-mono">{label}</div>
      <div className="text-sm font-medium font-mono">{children}</div>
    </div>
  );
}

export function ShieldDetail({ shield, walletClient, address, oraclePrice, currencyMode, onSuccess, onClose }: Props) {
  const [fills, setFills] = useState<Fill[]>([]);
  const [matchAmount, setMatchAmount] = useState("");
  const [deliveryInput, setDeliveryInput] = useState("100");
  const { exec, pending } = useContractWrite(walletClient);
  const s = shield;

  useEffect(() => { getFills(s.id).then(setFills).catch(console.error); }, [s.id, s.filled]);

  const isSubscriber = address?.toLowerCase() === s.subscriber.toLowerCase();
  const isValidator = address?.toLowerCase() === s.validator.toLowerCase() && s.validator !== "0x0000000000000000000000000000000000000000";
  const isExpired = BigInt(Math.floor(Date.now() / 1000)) > s.expiry;
  const isInTheMoney = oraclePrice > 0n && (s.isReverse ? oraclePrice > s.strike : oraclePrice < s.strike);
  const remaining = s.notional - s.filled;
  const pLabel = premiumLabel(s.isReverse);
  const cLabel = collateralLabel(s.isReverse);
  const dirColor = s.isReverse ? "text-neon-pink" : "text-cyan";
  const dirGlow = s.isReverse ? "glow-pink" : "glow-cyan";

  const handleFund = () => exec("fundShield", [BigInt(s.id)], { token: premiumToken(s.isReverse), amount: s.premium }).then(onSuccess);
  const handleMatch = () => { const a = parseUnits(matchAmount, 6); exec("matchShield", [BigInt(s.id), address!, a], { token: collateralToken(s.isReverse), amount: a }).then(onSuccess); };
  const handleValidate = () => exec("validateDelivery", [BigInt(s.id), parseInt(deliveryInput)]).then(onSuccess);
  const handleExercise = () => exec("exercise", [BigInt(s.id)]).then(onSuccess);
  const handleExpire = () => exec("expire", [BigInt(s.id)]).then(onSuccess);
  const handleCancel = () => exec("cancel", [BigInt(s.id)]).then(onSuccess);

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="glass rounded-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto p-6 animate-glow-pulse" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <h2 className={`text-lg font-bold font-mono ${dirColor} ${dirGlow}`}>
              Shield #{s.id}
            </h2>
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${s.isReverse ? "bg-neon-pink/15 text-neon-pink" : "bg-cyan/15 text-cyan"}`}>
              {s.isReverse ? "USD→EUR" : "EUR→USD"}
            </span>
          </div>
          <button onClick={onClose} className="text-dim hover:text-white text-xl leading-none cursor-pointer">&times;</button>
        </div>

        {/* Tx link */}
        {s.createdEvent && (
          <a href={`${ARCSCAN_TX}${s.createdEvent.txHash}`} target="_blank" rel="noopener noreferrer"
            className="inline-block mb-4 text-xs text-accent hover:underline font-mono">
            View on ArcScan &rarr;
          </a>
        )}

        {/* Fields */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {s.createdEvent && <Field label="Created">{new Date(s.createdEvent.timestamp * 1000).toLocaleString()}</Field>}
          <Field label="Subscriber"><span className="text-xs">{s.subscriber.slice(0, 6)}...{s.subscriber.slice(-4)}</span></Field>
          <Field label="Strike">{formatRate(s.strike, currencyMode)} {rateLabel(currencyMode)}</Field>
          <Field label={`Notional`}>{fmt6(s.notional)} {cLabel}</Field>
          <Field label={`Premium`}>{fmt6(s.premium)} {pLabel}</Field>
          <Field label={`Filled`}>{fmt6(s.filled)} / {fmt6(s.notional)} {cLabel}</Field>
          <Field label="Delivery">{s.deliveryRate}%</Field>
          <Field label="Expiry">{new Date(Number(s.expiry) * 1000).toLocaleString()}</Field>
          <Field label="Status">
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
              ["bg-dim/15 text-dim","bg-accent/15 text-accent","bg-cyan/15 text-cyan","bg-neon-green/15 text-neon-green","bg-dim/15 text-dim"][s.status]
            }`}>{SHIELD_STATUS[s.status]}</span>
          </Field>
          {oraclePrice > 0n && (
            <Field label="In the money?">
              <span className={isInTheMoney ? "text-neon-green glow-green" : "text-dim"}>
                {isInTheMoney ? "YES" : "NO"} <span className="text-[10px] font-normal">(oracle: {formatRate(oraclePrice, currencyMode)})</span>
              </span>
            </Field>
          )}
        </div>

        {/* Guardian suggestion */}
        {s.status === 1 && remaining > 0n && !isSubscriber && (
          <div className="bg-neon-green/8 border border-neon-green/20 rounded-lg px-4 py-2.5 text-xs text-neon-green mb-4">
            This shield needs <strong>{fmt6(remaining)} {cLabel}</strong>.
            Earn <strong>{fmt6(s.premium * remaining / s.notional)} {pLabel}</strong> premium.
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-2 pt-3 border-t border-border/50">
          {s.status === 0 && (
            <button onClick={handleFund} disabled={pending || !walletClient}
              className="px-4 py-2 bg-accent hover:bg-accent/80 text-black text-xs font-bold rounded-lg transition-all disabled:opacity-50 cursor-pointer">
              {pending ? "..." : `Fund Premium (${pLabel})`}
            </button>
          )}
          {(s.status === 1 || s.status === 2) && !isSubscriber && remaining > 0n && (
            <div className="flex gap-2 w-full">
              <input type="number" placeholder={`${fmt6(remaining)} ${cLabel}`} value={matchAmount} onChange={(e) => setMatchAmount(e.target.value)}
                className="flex-1 px-3 py-2 bg-bg border border-neon-green/30 rounded-lg text-xs text-neon-green font-mono focus:border-neon-green focus:outline-none" />
              <button onClick={handleMatch} disabled={pending || !walletClient || !matchAmount}
                className="px-4 py-2 bg-neon-green/15 border border-neon-green/40 text-neon-green text-xs font-bold rounded-lg hover:bg-neon-green/25 disabled:opacity-50 transition-all cursor-pointer">
                {pending ? "..." : "Match"}
              </button>
            </div>
          )}
          {isValidator && s.status !== 4 && s.status !== 3 && (
            <div className="flex gap-2 w-full">
              <input type="number" min="0" max="100" placeholder="0-100%" value={deliveryInput} onChange={(e) => setDeliveryInput(e.target.value)}
                className="w-24 px-3 py-2 bg-bg border border-accent/30 rounded-lg text-xs text-accent font-mono focus:border-accent focus:outline-none" />
              <button onClick={handleValidate} disabled={pending}
                className="px-4 py-2 bg-accent/15 border border-accent/40 text-accent text-xs font-bold rounded-lg hover:bg-accent/25 disabled:opacity-50 transition-all cursor-pointer">
                {pending ? "..." : "Validate Delivery"}
              </button>
            </div>
          )}
          {(s.status === 1 || s.status === 2) && isSubscriber && !isExpired && isInTheMoney && s.deliveryRate > 0 && (
            <button onClick={handleExercise} disabled={pending}
              className="px-4 py-2 bg-neon-green/15 border border-neon-green/40 text-neon-green text-xs font-bold rounded-lg hover:bg-neon-green/25 disabled:opacity-50 transition-all cursor-pointer">
              {pending ? "..." : "Exercise"}
            </button>
          )}
          {(s.status === 1 || s.status === 2) && isExpired && (
            <button onClick={handleExpire} disabled={pending}
              className="px-4 py-2 border border-border text-dim text-xs rounded-lg hover:border-dim transition-all cursor-pointer">
              {pending ? "..." : "Expire"}
            </button>
          )}
          {(s.status === 0 || s.status === 1) && s.filled === 0n && (
            <button onClick={handleCancel} disabled={pending}
              className="px-4 py-2 bg-neon-pink/15 border border-neon-pink/40 text-neon-pink text-xs font-bold rounded-lg hover:bg-neon-pink/25 disabled:opacity-50 transition-all cursor-pointer">
              {pending ? "..." : "Cancel"}
            </button>
          )}
        </div>

        {/* Fills */}
        {fills.length > 0 && (
          <div className="mt-4 pt-3 border-t border-border/50">
            <h3 className="text-[10px] font-bold text-dim uppercase tracking-widest mb-2 font-mono">Guardians ({fills.length})</h3>
            <div className="space-y-1">
              {fills.map((f, i) => (
                <div key={i} className="flex justify-between px-3 py-1.5 bg-bg/60 rounded text-xs font-mono">
                  <span className="text-dim">{f.guardian.slice(0, 6)}...{f.guardian.slice(-4)}</span>
                  <span>{fmt6(f.amount)} {cLabel}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
