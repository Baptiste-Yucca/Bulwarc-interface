import { useState } from "react";
import type { WalletClient } from "viem";
import { parseUnits } from "viem";
import { premiumToken, premiumLabel, collateralLabel } from "../config/contracts";
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
  const [validator, setValidator] = useState("");
  const [isReverse, setIsReverse] = useState(false);
  const [fundNow, setFundNow] = useState(true);
  const { exec, pending } = useContractWrite(walletClient);

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
      await exec("createAndFundShield", args, {
        token: premiumToken(isReverse),
        amount: premiumVal,
      });
    } else {
      await exec("createShield", args);
    }
    onSuccess();
  };

  return (
    <div className="card">
      <h2>Create Shield</h2>

      {/* Direction toggle */}
      <div className="direction-toggle">
        <button
          type="button"
          className={`direction-btn ${!isReverse ? "active" : ""}`}
          onClick={() => setIsReverse(false)}
        >
          <span className="direction-icon">EUR → USD</span>
          <span className="direction-desc">Protect EUR income (paid in USDC)</span>
        </button>
        <button
          type="button"
          className={`direction-btn ${isReverse ? "active" : ""}`}
          onClick={() => setIsReverse(true)}
        >
          <span className="direction-icon">USD → EUR</span>
          <span className="direction-desc">Protect USD value (paid in EURC)</span>
        </button>
      </div>

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
            Notional ({cLabel})
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
            Premium ({pLabel})
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
        <label>
          Validator address (employer / HR oracle — optional)
          <input
            type="text"
            placeholder="0x... (leave empty for no validator)"
            value={validator}
            onChange={(e) => setValidator(e.target.value)}
          />
        </label>
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={fundNow}
            onChange={(e) => setFundNow(e.target.checked)}
          />
          Fund premium now ({pLabel} approval required)
        </label>
        <button className="btn btn-primary" type="submit" disabled={pending || !walletClient}>
          {pending ? "Processing..." : fundNow ? "Create & Fund Shield" : "Create Shield"}
        </button>
      </form>
    </div>
  );
}
