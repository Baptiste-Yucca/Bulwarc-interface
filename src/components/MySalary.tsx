import type { Shield } from "../hooks/useShields";
import { ARCSCAN_TX } from "../hooks/useShields";
import { formatRate, rateLabel, type CurrencyMode } from "../config/display";
import { SHIELD_STATUS, premiumLabel, collateralLabel } from "../config/contracts";

interface Props {
  shields: Shield[];
  loading: boolean;
  currencyMode: CurrencyMode;
}

const fmt6 = (v: bigint) => (Number(v) / 1e6).toFixed(2);

export function MySalary({ shields, loading, currencyMode }: Props) {
  const exercised = shields;

  if (loading) return <div className="card"><p>Loading...</p></div>;

  return (
    <div className="salary-page">
      <div className="salary-header">
        <h2>My Salary</h2>
        <p className="salary-description">
          Archive of exercised shields — your FX protection payslips.
        </p>
      </div>

      {exercised.length === 0 ? (
        <div className="card empty-state">
          <p>No exercised shields yet.</p>
          <p className="text-dim">
            When you exercise a shield, it will appear here as a payslip record.
          </p>
        </div>
      ) : (
        <>
          <div className="salary-summary card">
            <div className="salary-stat">
              <span className="label">Total Shields Exercised</span>
              <span className="value">{exercised.length}</span>
            </div>
          </div>

          <div className="payslips">
            {exercised.map((s) => {
              const pLabel = premiumLabel(s.isReverse);
              const cLabel = collateralLabel(s.isReverse);
              return (
                <div key={s.id} className="card payslip">
                  <div className="payslip-header">
                    <span className="payslip-id">
                      Shield #{s.id}
                      <span className={`dir-badge ${s.isReverse ? "reverse" : "normal"}`}>
                        {s.isReverse ? "USD→EUR" : "EUR→USD"}
                      </span>
                      {s.createdEvent && (
                        <span className="payslip-date">
                          {new Date(s.createdEvent.timestamp * 1000).toLocaleDateString()}
                        </span>
                      )}
                    </span>
                    <div className="payslip-actions">
                      <span className="status-badge exercised">
                        {SHIELD_STATUS[s.status]}
                      </span>
                      {s.createdEvent && (
                        <a
                          href={`${ARCSCAN_TX}${s.createdEvent.txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="tx-link"
                        >
                          View Tx
                        </a>
                      )}
                    </div>
                  </div>
                  <div className="payslip-grid">
                    <div>
                      <span className="label">Strike</span>
                      <span className="value">{formatRate(s.strike, currencyMode)} {rateLabel(currencyMode)}</span>
                    </div>
                    <div>
                      <span className="label">Notional ({cLabel})</span>
                      <span className="value">{fmt6(s.notional)} {cLabel}</span>
                    </div>
                    <div>
                      <span className="label">Premium ({pLabel})</span>
                      <span className="value">{fmt6(s.premium)} {pLabel}</span>
                    </div>
                    <div>
                      <span className="label">Delivery</span>
                      <span className="value">{s.deliveryRate}%</span>
                    </div>
                    <div>
                      <span className="label">Expiry</span>
                      <span className="value">
                        {new Date(Number(s.expiry) * 1000).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
