import { useState } from "react";
import type { WalletClient } from "viem";
import { parseUnits } from "viem";
import { USDC_ADDRESS } from "../config/contracts";
import { useContractWrite } from "../hooks/useContractWrite";
import { rateLabel, type CurrencyMode } from "../config/display";

interface Props {
  walletClient: WalletClient | null;
  currencyMode: CurrencyMode;
  onSuccess: () => void;
}

export function CreateShield({ walletClient, currencyMode, onSuccess }: Props) {
  const [strike, setStrike] = useState(currencyMode === "EUR/USD" ? "0.92" : "1.0870");
  const [notional, setNotional] = useState("1000");
  const [premium, setPremium] = useState("5");
  const [days, setDays] = useState("30");
  const [fundNow, setFundNow] = useState(true);
  const { exec, pending } = useContractWrite(walletClient);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Always convert to EUR/USD (contract format) before sending
    const inputRate = parseFloat(strike);
    const eurUsdRate = currencyMode === "EUR/USD" ? inputRate : 1 / inputRate;
    const strikeVal = BigInt(Math.round(eurUsdRate * 1e8));
    const notionalVal = parseUnits(notional, 6);
    const premiumVal = parseUnits(premium, 6);
    const expiryVal = BigInt(Math.floor(Date.now() / 1000) + parseInt(days) * 86400);

    if (fundNow) {
      await exec(
        "createAndFundShield",
        [strikeVal, notionalVal, premiumVal, expiryVal],
        { token: USDC_ADDRESS, amount: premiumVal }
      );
    } else {
      await exec("createShield", [strikeVal, notionalVal, premiumVal, expiryVal]);
    }
    onSuccess();
  };

  return (
    <div className="card">
      <h2>Create Shield</h2>
      <form onSubmit={handleSubmit} className="form">
        <div className="form-row">
          <label>
            Strike ({rateLabel(currencyMode)})
            <input
              type="number"
              step="0.0001"
              value={strike}
              onChange={(e) => setStrike(e.target.value)}
              required
            />
          </label>
          <label>
            Notional (USDC)
            <input
              type="number"
              step="1"
              value={notional}
              onChange={(e) => setNotional(e.target.value)}
              required
            />
          </label>
        </div>
        <div className="form-row">
          <label>
            Premium (USDC)
            <input
              type="number"
              step="0.01"
              value={premium}
              onChange={(e) => setPremium(e.target.value)}
              required
            />
          </label>
          <label>
            Duration (days)
            <input
              type="number"
              step="1"
              value={days}
              onChange={(e) => setDays(e.target.value)}
              required
            />
          </label>
        </div>
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={fundNow}
            onChange={(e) => setFundNow(e.target.checked)}
          />
          Fund premium now (requires USDC approval)
        </label>
        <button className="btn btn-primary" type="submit" disabled={pending || !walletClient}>
          {pending ? "Processing..." : fundNow ? "Create & Fund Shield" : "Create Shield"}
        </button>
      </form>
    </div>
  );
}
