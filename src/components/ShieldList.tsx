import { SHIELD_STATUS } from "../config/contracts";
import { formatRate, rateLabel, type CurrencyMode } from "../config/display";
import type { Shield } from "../hooks/useShields";
import { ARCSCAN_TX } from "../hooks/useShields";
import { collateralLabel } from "../config/contracts";

interface Props {
  shields: Shield[];
  loading: boolean;
  selectedId: number | null;
  onSelect: (id: number) => void;
  currencyMode: CurrencyMode;
  emptyMessage?: string;
}

const fmt6 = (v: bigint) => (Number(v) / 1e6).toFixed(2);

const statusClass = (s: number) => {
  const map = ["created", "pending", "locked", "exercised", "expired"];
  return map[s] ?? "";
};

export function ShieldList({ shields, loading, selectedId, onSelect, currencyMode, emptyMessage }: Props) {
  if (loading) return <div className="card"><p>Loading shields...</p></div>;
  if (shields.length === 0) return <div className="card empty-state"><p>{emptyMessage || "No shields yet."}</p></div>;

  return (
    <div className="card">
      <h2>Shields ({shields.length})</h2>
      <div className="shield-table">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Direction</th>
              <th>Created</th>
              <th>Strike ({rateLabel(currencyMode)})</th>
              <th>Notional</th>
              <th>Filled</th>
              <th>Delivery</th>
              <th>Status</th>
              <th>Tx</th>
            </tr>
          </thead>
          <tbody>
            {shields.map((s) => {
              const cToken = collateralLabel(s.isReverse);
              return (
                <tr
                  key={s.id}
                  className={`shield-row ${selectedId === s.id ? "selected" : ""} status-${statusClass(s.status)}`}
                  onClick={() => onSelect(s.id)}
                >
                  <td>{s.id}</td>
                  <td>
                    <span className={`dir-badge ${s.isReverse ? "reverse" : "normal"}`}>
                      {s.isReverse ? "USD→EUR" : "EUR→USD"}
                    </span>
                  </td>
                  <td className="text-dim">
                    {s.createdEvent
                      ? new Date(s.createdEvent.timestamp * 1000).toLocaleDateString()
                      : "-"}
                  </td>
                  <td>{formatRate(s.strike, currencyMode)}</td>
                  <td>{fmt6(s.notional)} {cToken}</td>
                  <td>
                    {fmt6(s.filled)} / {fmt6(s.notional)}
                  </td>
                  <td>{s.deliveryRate}%</td>
                  <td>
                    <span className={`status-badge ${statusClass(s.status)}`}>
                      {SHIELD_STATUS[s.status]}
                    </span>
                  </td>
                  <td>
                    {s.createdEvent && (
                      <a
                        href={`${ARCSCAN_TX}${s.createdEvent.txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="tx-link"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {s.createdEvent.txHash.slice(0, 6)}...
                      </a>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
