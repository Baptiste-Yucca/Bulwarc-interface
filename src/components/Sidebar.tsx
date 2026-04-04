import { useLivePrice } from "../hooks/useLivePrice";
import { rateLabel, type CurrencyMode } from "../config/display";

export type Page = "your-shields" | "all-offers" | "my-salary";

interface Props {
  activePage: Page;
  onNavigate: (page: Page) => void;
  currencyMode: CurrencyMode;
  onToggleCurrency: () => void;
}

const NAV_ITEMS: { page: Page; label: string; icon: string }[] = [
  { page: "your-shields", label: "Your Shields", icon: "shield" },
  { page: "all-offers", label: "All Offers", icon: "market" },
  { page: "my-salary", label: "My Salary", icon: "salary" },
];

export function Sidebar({ activePage, onNavigate, currencyMode, onToggleCurrency }: Props) {
  const live = useLivePrice();

  const liveDisplay =
    currencyMode === "EUR/USD"
      ? live.price.toFixed(4)
      : live.price > 0
        ? (1 / live.price).toFixed(4)
        : "-.----";

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <h1>BulwArc</h1>
        <span className="sidebar-subtitle">FX Protection</span>
      </div>

      {/* Live price ticker */}
      <button
        className={`sidebar-live live-${live.direction}`}
        onClick={onToggleCurrency}
      >
        <span className="live-dot" />
        <span className="sidebar-live-label">LIVE</span>
        <span className="sidebar-live-price">
          {rateLabel(currencyMode)} {live.price > 0 ? liveDisplay : "-.----"}
        </span>
        <span className="live-arrow">
          {live.direction === "up" ? "▲" : live.direction === "down" ? "▼" : ""}
        </span>
      </button>

      <nav className="sidebar-nav">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.page}
            className={`sidebar-item ${activePage === item.page ? "active" : ""}`}
            onClick={() => onNavigate(item.page)}
          >
            <span className={`sidebar-icon icon-${item.icon}`} />
            {item.label}
          </button>
        ))}
      </nav>
    </aside>
  );
}
