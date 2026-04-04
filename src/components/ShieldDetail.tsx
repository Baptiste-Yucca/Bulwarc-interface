import { useState, useEffect } from "react";
import type { WalletClient, Address } from "viem";
import { parseUnits } from "viem";
import {
  SHIELD_STATUS,
  premiumToken,
  collateralToken,
  premiumLabel,
  collateralLabel,
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
}

const fmt6 = (v: bigint) => (Number(v) / 1e6).toFixed(2);

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
  const [deliveryInput, setDeliveryInput] = useState("100");
  const { exec, pending } = useContractWrite(walletClient);

  useEffect(() => {
    getFills(shield.id).then(setFills).catch(console.error);
  }, [shield.id, shield.filled]);

  const isSubscriber =
    address?.toLowerCase() === shield.subscriber.toLowerCase();
  const isValidator =
    address?.toLowerCase() === shield.validator.toLowerCase() &&
    shield.validator !== "0x0000000000000000000000000000000000000000";
  const isExpired = BigInt(Math.floor(Date.now() / 1000)) > shield.expiry;

  // Exercise condition depends on direction
  const isInTheMoney = oraclePrice > 0n && (
    shield.isReverse
      ? oraclePrice > shield.strike   // reverse: EUR weakens
      : oraclePrice < shield.strike   // normal: USD weakens
  );

  const remaining = shield.notional - shield.filled;
  const pLabel = premiumLabel(shield.isReverse);
  const cLabel = collateralLabel(shield.isReverse);

  const handleFund = async () => {
    await exec("fundShield", [BigInt(shield.id)], {
      token: premiumToken(shield.isReverse),
      amount: shield.premium,
    });
    onSuccess();
  };

  const handleMatch = async () => {
    if (!address) return;
    const amount = parseUnits(matchAmount, 6);
    await exec("matchShield", [BigInt(shield.id), address, amount], {
      token: collateralToken(shield.isReverse),
      amount,
    });
    onSuccess();
  };

  const handleValidate = async () => {
    const rate = parseInt(deliveryInput);
    if (rate < 0 || rate > 100) return;
    await exec("validateDelivery", [BigInt(shield.id), rate]);
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
      <h2>
        Shield #{shield.id}
        <span className={`dir-badge ${shield.isReverse ? "reverse" : "normal"}`}>
          {shield.isReverse ? "USD→EUR" : "EUR→USD"}
        </span>
        {shield.createdEvent && (
          <a
            href={`${ARCSCAN_TX}${shield.createdEvent.txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="tx-link detail-tx"
          >
            View on ArcScan
          </a>
        )}
      </h2>
      <div className="detail-grid">
        {shield.createdEvent && (
          <div>
            <span className="label">Created</span>
            <span className="value">
              {new Date(shield.createdEvent.timestamp * 1000).toLocaleString()}
            </span>
          </div>
        )}
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
          <span className="label">Notional ({cLabel})</span>
          <span className="value">{fmt6(shield.notional)} {cLabel}</span>
        </div>
        <div>
          <span className="label">Premium ({pLabel})</span>
          <span className="value">{fmt6(shield.premium)} {pLabel}</span>
        </div>
        {shield.subscriberFee > 0n && (
          <div>
            <span className="label">Fee</span>
            <span className="value">{fmt6(shield.subscriberFee)} {pLabel}</span>
          </div>
        )}
        <div>
          <span className="label">Filled ({cLabel})</span>
          <span className="value">
            {fmt6(shield.filled)} / {fmt6(shield.notional)} {cLabel}
          </span>
        </div>
        <div>
          <span className="label">Delivery</span>
          <span className="value">{shield.deliveryRate}%</span>
        </div>
        <div>
          <span className="label">Validator</span>
          <span className="value mono">
            {shield.validator === "0x0000000000000000000000000000000000000000"
              ? "None"
              : `${shield.validator.slice(0, 6)}...${shield.validator.slice(-4)}`}
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

      {/* Suggestion banner for guardians */}
      {(shield.status === 1) && remaining > 0n && !isSubscriber && (
        <div className="suggestion-banner">
          This shield needs {fmt6(remaining)} {cLabel} in collateral.
          Earn {fmt6(shield.premium * remaining / shield.notional)} {pLabel} premium by matching it.
        </div>
      )}

      {/* Actions */}
      <div className="actions">
        {shield.status === 0 && (
          <button className="btn btn-primary" onClick={handleFund} disabled={pending || !walletClient}>
            {pending ? "Processing..." : `Fund Premium (${pLabel})`}
          </button>
        )}

        {(shield.status === 1 || shield.status === 2) && !isSubscriber && remaining > 0n && (
          <div className="match-form">
            <input
              type="number"
              placeholder={`Max ${fmt6(remaining)} ${cLabel}`}
              value={matchAmount}
              onChange={(e) => setMatchAmount(e.target.value)}
            />
            <button
              className="btn btn-primary"
              onClick={handleMatch}
              disabled={pending || !walletClient || !matchAmount}
            >
              {pending ? "Processing..." : `Match (${cLabel})`}
            </button>
          </div>
        )}

        {/* Validator: confirm delivery */}
        {isValidator && shield.status !== 4 && shield.status !== 3 && (
          <div className="match-form">
            <input
              type="number"
              min="0"
              max="100"
              placeholder="Delivery % (0-100)"
              value={deliveryInput}
              onChange={(e) => setDeliveryInput(e.target.value)}
            />
            <button
              className="btn btn-accent"
              onClick={handleValidate}
              disabled={pending}
            >
              {pending ? "Processing..." : "Validate Delivery"}
            </button>
          </div>
        )}

        {(shield.status === 1 || shield.status === 2) &&
          isSubscriber &&
          !isExpired &&
          isInTheMoney &&
          shield.deliveryRate > 0 && (
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
                <th>Amount ({cLabel})</th>
              </tr>
            </thead>
            <tbody>
              {fills.map((f, i) => (
                <tr key={i}>
                  <td className="mono">
                    {f.guardian.slice(0, 6)}...{f.guardian.slice(-4)}
                  </td>
                  <td>{fmt6(f.amount)} {cLabel}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
