import { useState } from "react";
import type { WalletClient } from "viem";
import { parseUnits } from "viem";
import { premiumToken, premiumLabel, collateralLabel } from "../config/contracts";
import { useContractWrite, type TxCallbacks } from "../hooks/useContractWrite";
import { rateLabel, type CurrencyMode } from "../config/display";

interface Props {
  walletClient: WalletClient | null;
  currencyMode: CurrencyMode;
  txCallbacks?: TxCallbacks;
  onSuccess: () => void;
  onClose: () => void;
}

export function CreateShield({ walletClient, currencyMode, txCallbacks, onSuccess, onClose }: Props) {
  const [strike, setStrike] = useState(currencyMode === "EUR/USD" ? "0.92" : "1.0870");
  const [notional, setNotional] = useState("1000");
  const [premium, setPremium] = useState("5");
  const [days, setDays] = useState("30");
  const [validator, setValidator] = useState("");
  const [isReverse, setIsReverse] = useState(false);
  const [fundNow, setFundNow] = useState(true);
  const { exec, pending } = useContractWrite(walletClient, txCallbacks);

  const pLabel = premiumLabel(isReverse);
  const cLabel = collateralLabel(isReverse);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const inputRate = parseFloat(strike);
    const eurUsdRate = currencyMode === "EUR/USD" ? inputRate : 1 / inputRate;
    const strikeVal = BigInt(Math.round(eurUsdRate * 1e8));
    const notionalVal = parseUnits(notional, 6);
    const premiumVal = parseUnits(premium, 6);
    const expiryVal = BigInt(Math.floor(Date.now() / 1000) + parseInt(days) * 86400);
    const validatorAddr = validator || "0x0000000000000000000000000000000000000000";
    const args = [strikeVal, notionalVal, premiumVal, expiryVal, validatorAddr, isReverse];

    if (fundNow) {
      await exec("createAndFundShield", args, { token: premiumToken(isReverse), amount: premiumVal });
    } else {
      await exec("createShield", args);
    }
    onSuccess();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="glass rounded-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto p-6 animate-glow-pulse" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-accent glow-amber font-mono">Create Shield</h2>
          <button onClick={onClose} className="text-dim hover:text-white text-xl leading-none cursor-pointer">&times;</button>
        </div>

        {/* Direction toggle */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <button type="button" onClick={() => setIsReverse(false)}
            className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
              !isReverse ? "border-cyan/50 bg-cyan/8 text-cyan" : "border-border bg-bg text-dim hover:border-dim"
            }`}>
            <div className="font-bold text-sm font-mono">EUR → USD</div>
            <div className="text-[10px] opacity-70 mt-0.5">Protect EUR income</div>
          </button>
          <button type="button" onClick={() => setIsReverse(true)}
            className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
              isReverse ? "border-neon-pink/50 bg-neon-pink/8 text-neon-pink" : "border-border bg-bg text-dim hover:border-dim"
            }`}>
            <div className="font-bold text-sm font-mono">USD → EUR</div>
            <div className="text-[10px] opacity-70 mt-0.5">Lock EUR rate</div>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1 text-[10px] uppercase tracking-widest text-dim font-mono">
              Strike ({rateLabel(currencyMode)})
              <input type="number" step="0.0001" value={strike} onChange={(e) => setStrike(e.target.value)} required
                className="px-3 py-2 bg-bg border border-border rounded-lg text-sm text-white font-mono focus:border-accent focus:outline-none" />
            </label>
            <label className="flex flex-col gap-1 text-[10px] uppercase tracking-widest text-dim font-mono">
              Notional ({cLabel})
              <input type="number" step="1" value={notional} onChange={(e) => setNotional(e.target.value)} required
                className="px-3 py-2 bg-bg border border-border rounded-lg text-sm text-white font-mono focus:border-accent focus:outline-none" />
            </label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1 text-[10px] uppercase tracking-widest text-dim font-mono">
              Premium ({pLabel})
              <input type="number" step="0.01" value={premium} onChange={(e) => setPremium(e.target.value)} required
                className="px-3 py-2 bg-bg border border-border rounded-lg text-sm text-white font-mono focus:border-accent focus:outline-none" />
            </label>
            <label className="flex flex-col gap-1 text-[10px] uppercase tracking-widest text-dim font-mono">
              Duration (days)
              <input type="number" step="1" value={days} onChange={(e) => setDays(e.target.value)} required
                className="px-3 py-2 bg-bg border border-border rounded-lg text-sm text-white font-mono focus:border-accent focus:outline-none" />
            </label>
          </div>
          <label className="flex flex-col gap-1 text-[10px] uppercase tracking-widest text-dim font-mono">
            Validator (optional)
            <input type="text" placeholder="0x..." value={validator} onChange={(e) => setValidator(e.target.value)}
              className="px-3 py-2 bg-bg border border-border rounded-lg text-sm text-white font-mono focus:border-accent focus:outline-none" />
          </label>
          <label className="flex items-center gap-2 text-xs text-white cursor-pointer font-mono">
            <input type="checkbox" checked={fundNow} onChange={(e) => setFundNow(e.target.checked)} className="accent-accent" />
            Fund premium now ({pLabel})
          </label>
          <button type="submit" disabled={pending || !walletClient}
            className="px-5 py-2.5 bg-accent hover:bg-accent/80 text-black text-sm font-bold rounded-lg transition-all disabled:opacity-50 cursor-pointer">
            {pending ? "Processing..." : fundNow ? "Create & Fund Shield" : "Create Shield"}
          </button>
        </form>
      </div>
    </div>
  );
}
