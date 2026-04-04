import { useState, useEffect } from "react";
import type { WalletClient, Address } from "viem";
import { parseUnits } from "viem";
import { SHIELD_STATUS, USDC_ADDRESS, EURC_ADDRESS } from "../config/contracts";
import { formatRate, rateLabel, type CurrencyMode } from "../config/display";
import type { Shield } from "../hooks/useShields";
import { getFills, type Fill } from "../hooks/useShields";
import { useContractWrite } from "../hooks/useContractWrite";

interface Props {
  shield: Shield;
  walletClient: WalletClient | null;
  address: Address | null;
  oraclePrice: bigint;
  currencyMode: CurrencyMode;
  onSuccess: () => void;
}

const formatUsdc = (v: bigint) => (Number(v) / 1e6).toFixed(2);

export function ShieldDetail({
  shield,
  walletClient,
  address,
  oraclePrice,
  currencyMode,
  onSuccess,
}: Props) {
  const [fills, setFills] = useState<Fill[]>([]);
  const [matchAmount, setMatchAmount] = useState("");
  const { exec, pending } = useContractWrite(walletClient);

  useEffect(() => {
    getFills(shield.id).then(setFills).catch(console.error);
  }, [shield.id, shield.filled]);

  const isSubscriber =
    address?.toLowerCase() === shield.subscriber.toLowerCase();
  const isExpired = BigInt(Math.floor(Date.now() / 1000)) > shield.expiry;
  const isInTheMoney = oraclePrice > 0n && oraclePrice < shield.strike;
  const remaining = shield.notional - shield.filled;

  // Subscriber pays premium in USDC, guardian provides collateral in EURC
  const handleFund = async () => {
    await exec("fundShield", [BigInt(shield.id)], {
      token: USDC_ADDRESS,
      amount: shield.premium,
    });
    onSuccess();
  };

  const handleMatch = async () => {
    if (!address) return;
    const amount = parseUnits(matchAmount, 6);
    // Guardian deposits EURC as collateral
    await exec("matchShield", [BigInt(shield.id), address, amount], {
      token: EURC_ADDRESS,
      amount,
    });
    onSuccess();
  };

  const handleExercise = async () => {
    await exec("exercise", [BigInt(shield.id)]);
    onSuccess();
  };

  const handleExpire = async () => {
    await exec("expire", [BigInt(shield.id)]);
    onSuccess();
  };

  const handleCancel = async () => {
    await exec("cancel", [BigInt(shield.id)]);
    onSuccess();
  };

  return (
    <div className="card shield-detail">
      <h2>Shield #{shield.id}</h2>
      <div className="detail-grid">
        <div>
          <span className="label">Subscriber</span>
          <span className="value mono">
            {shield.subscriber.slice(0, 6)}...{shield.subscriber.slice(-4)}
          </span>
        </div>
        <div>
          <span className="label">Strike</span>
          <span className="value">{formatRate(shield.strike, currencyMode)} {rateLabel(currencyMode)}</span>
        </div>
        <div>
          <span className="label">Notional (USDC)</span>
          <span className="value">{formatUsdc(shield.notional)} USDC</span>
        </div>
        <div>
          <span className="label">Premium (USDC)</span>
          <span className="value">{formatUsdc(shield.premium)} USDC</span>
        </div>
        {shield.subscriberFee > 0n && (
          <div>
            <span className="label">Fee</span>
            <span className="value">{formatUsdc(shield.subscriberFee)} USDC</span>
          </div>
        )}
        <div>
          <span className="label">Filled (EURC)</span>
          <span className="value">
            {formatUsdc(shield.filled)} / {formatUsdc(shield.notional)} EURC
          </span>
        </div>
        <div>
          <span className="label">Expiry</span>
          <span className="value">
            {new Date(Number(shield.expiry) * 1000).toLocaleString()}
          </span>
        </div>
        <div>
          <span className="label">Status</span>
          <span className={`status-badge ${["created", "pending", "locked", "exercised", "expired"][shield.status]}`}>
            {SHIELD_STATUS[shield.status]}
          </span>
        </div>
        {oraclePrice > 0n && (
          <div>
            <span className="label">In the money?</span>
            <span className={`value ${isInTheMoney ? "itm" : "otm"}`}>
              {isInTheMoney ? "Yes" : "No"} (oracle: {formatRate(oraclePrice, currencyMode)} {rateLabel(currencyMode)})
            </span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="actions">
        {shield.status === 0 && (
          <button className="btn btn-primary" onClick={handleFund} disabled={pending || !walletClient}>
            {pending ? "Processing..." : "Fund Premium (USDC)"}
          </button>
        )}

        {(shield.status === 1 || shield.status === 2) && !isSubscriber && (
          <div className="match-form">
            <input
              type="number"
              placeholder={`Max ${formatUsdc(remaining)} EURC`}
              value={matchAmount}
              onChange={(e) => setMatchAmount(e.target.value)}
            />
            <button
              className="btn btn-primary"
              onClick={handleMatch}
              disabled={pending || !walletClient || !matchAmount}
            >
              {pending ? "Processing..." : "Match Shield (EURC)"}
            </button>
          </div>
        )}

        {(shield.status === 1 || shield.status === 2) &&
          isSubscriber &&
          !isExpired &&
          isInTheMoney && (
            <button className="btn btn-accent" onClick={handleExercise} disabled={pending}>
              {pending ? "Processing..." : "Exercise"}
            </button>
          )}

        {(shield.status === 1 || shield.status === 2) && isExpired && (
          <button className="btn btn-outline" onClick={handleExpire} disabled={pending}>
            {pending ? "Processing..." : "Expire"}
          </button>
        )}

        {(shield.status === 0 || shield.status === 1) &&
          shield.filled === 0n && (
            <button className="btn btn-danger" onClick={handleCancel} disabled={pending}>
              {pending ? "Processing..." : "Cancel"}
            </button>
          )}
      </div>

      {/* Fills */}
      {fills.length > 0 && (
        <div className="fills">
          <h3>Guardians ({fills.length})</h3>
          <table>
            <thead>
              <tr>
                <th>Guardian</th>
                <th>Amount (EURC)</th>
              </tr>
            </thead>
            <tbody>
              {fills.map((f, i) => (
                <tr key={i}>
                  <td className="mono">
                    {f.guardian.slice(0, 6)}...{f.guardian.slice(-4)}
                  </td>
                  <td>{formatUsdc(f.amount)} EURC</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
