import { SHIELD_STATUS } from "../config/contracts";
import { formatRate, rateLabel, type CurrencyMode } from "../config/display";
import type { Shield } from "../hooks/useShields";

interface Props {
  shields: Shield[];
  loading: boolean;
  selectedId: number | null;
  onSelect: (id: number) => void;
  currencyMode: CurrencyMode;
}

const formatUsdc = (v: bigint) => (Number(v) / 1e6).toFixed(2);
const formatDate = (v: bigint) =>
  new Date(Number(v) * 1000).toLocaleDateString();

const statusClass = (s: number) => {
  const map = ["created", "pending", "locked", "exercised", "expired"];
  return map[s] ?? "";
};

export function ShieldList({ shields, loading, selectedId, onSelect, currencyMode }: Props) {
  if (loading) return <div className="card"><p>Loading shields...</p></div>;
  if (shields.length === 0) return <div className="card"><p>No shields yet.</p></div>;

  return (
    <div className="card">
      <h2>Shields ({shields.length})</h2>
      <div className="shield-table">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Strike ({rateLabel(currencyMode)})</th>
              <th>Notional</th>
              <th>Premium</th>
              <th>Filled</th>
              <th>Expiry</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {shields.map((s) => (
              <tr
                key={s.id}
                className={`shield-row ${selectedId === s.id ? "selected" : ""} status-${statusClass(s.status)}`}
                onClick={() => onSelect(s.id)}
              >
                <td>{s.id}</td>
                <td>{formatRate(s.strike, currencyMode)}</td>
                <td>{formatUsdc(s.notional)}</td>
                <td>{formatUsdc(s.premium)}</td>
                <td>
                  {formatUsdc(s.filled)} / {formatUsdc(s.notional)}
                </td>
                <td>{formatDate(s.expiry)}</td>
                <td>
                  <span className={`status-badge ${statusClass(s.status)}`}>
                    {SHIELD_STATUS[s.status]}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
