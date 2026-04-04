import { useLivePrice } from "../hooks/useLivePrice";
import { rateLabel, type CurrencyMode } from "../config/display";

export type Page = "your-shields" | "all-offers" | "my-salary";

interface Props {
  activePage: Page;
  onNavigate: (page: Page) => void;
  currencyMode: CurrencyMode;
  onToggleCurrency: () => void;
  open: boolean;
  onClose: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

const NAV_ITEMS: { page: Page; label: string; icon: string }[] = [
  { page: "your-shields", label: "Your Shields", icon: "shield" },
  { page: "all-offers", label: "All Offers", icon: "market" },
  { page: "my-salary", label: "My Salary", icon: "salary" },
];

export function Sidebar({
  activePage,
  onNavigate,
  currencyMode,
  onToggleCurrency,
  open,
  onClose,
  collapsed,
  onToggleCollapse,
}: Props) {
  const live = useLivePrice();

  const liveDisplay =
    currencyMode === "EUR/USD"
      ? live.price.toFixed(4)
      : live.price > 0
        ? (1 / live.price).toFixed(4)
        : "-.----";

  return (
    <>
      {open && <div className="sidebar-overlay" onClick={onClose} />}

      <aside className={`sidebar ${open ? "sidebar-open" : ""} ${collapsed ? "collapsed" : ""}`}>
        {/* Brand + collapse toggle */}
        <div className="sidebar-brand">
          <div className="sidebar-brand-row">
            {!collapsed && <h1>BulwArc</h1>}
            <button
              className="collapse-btn"
              onClick={onToggleCollapse}
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              title={collapsed ? "Expand" : "Collapse"}
            >
              <span className={`collapse-arrow ${collapsed ? "pointing-right" : "pointing-left"}`} />
            </button>
          </div>
          {!collapsed && <span className="sidebar-subtitle">FX Protection</span>}
        </div>

        {/* Live price */}
        <button
          className={`sidebar-live live-${live.direction} ${live.testMode ? "test-mode" : ""}`}
          onClick={onToggleCurrency}
          title={collapsed ? `${live.testMode ? "[TEST] " : ""}${rateLabel(currencyMode)} ${liveDisplay}` : undefined}
        >
          <span className="live-dot" />
          {!collapsed && (
            <>
              <span className="sidebar-live-label">{live.testMode ? "TEST" : "LIVE"}</span>
              <span className="sidebar-live-price">
                {rateLabel(currencyMode)} {live.price > 0 ? liveDisplay : "-.----"}
              </span>
            </>
          )}
          <span className="live-arrow">
            {live.direction === "up" ? "▲" : live.direction === "down" ? "▼" : ""}
          </span>
        </button>

        {/* Nav */}
        <nav className="sidebar-nav">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.page}
              className={`sidebar-item ${activePage === item.page ? "active" : ""}`}
              onClick={() => { onNavigate(item.page); onClose(); }}
              title={collapsed ? item.label : undefined}
            >
              <span className={`sidebar-icon icon-${item.icon}`} />
              {!collapsed && <span className="sidebar-label">{item.label}</span>}
            </button>
          ))}
        </nav>
      </aside>
    </>
  );
}
