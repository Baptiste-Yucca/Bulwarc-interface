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
  activePage, onNavigate, currencyMode, onToggleCurrency,
  open, onClose, collapsed, onToggleCollapse,
}: Props) {
  const live = useLivePrice();

  const liveDisplay = currencyMode === "EUR/USD"
    ? live.price.toFixed(4)
    : live.price > 0 ? (1 / live.price).toFixed(4) : "-.----";

  const dirColor = live.direction === "up" ? "text-green-400 border-green-500/30"
    : live.direction === "down" ? "text-red-400 border-red-500/30"
    : "text-dim";

  return (
    <>
      {open && (
        <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={onClose} />
      )}

      <aside className={`
        fixed top-0 left-0 bottom-0 z-50
        flex flex-col
        bg-surface border-r border-border
        transition-all duration-200 ease-in-out overflow-hidden
        ${collapsed ? "w-16" : "w-60"}
        ${open ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
      `}>
        {/* Brand */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-border">
          {!collapsed && <h1 className="text-lg font-bold tracking-tight text-white">BulwArc</h1>}
          <button
            onClick={onToggleCollapse}
            className="p-1.5 rounded hover:bg-surface2 text-dim hover:text-white transition-colors"
            title={collapsed ? "Expand" : "Collapse"}
          >
            <svg className={`w-4 h-4 transition-transform ${collapsed ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        </div>

        {/* Live price */}
        <button
          className={`
            mx-2 mt-3 flex items-center gap-2 rounded-lg border
            bg-bg px-3 py-2.5 text-xs font-semibold tabular-nums cursor-pointer
            transition-all ${dirColor}
            ${live.testMode ? "border-warning/40 bg-warning/5" : ""}
            ${collapsed ? "justify-center px-2" : ""}
          `}
          onClick={onToggleCurrency}
          title={collapsed ? `${live.testMode ? "[TEST] " : ""}${rateLabel(currencyMode)} ${liveDisplay}` : undefined}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse-dot shrink-0" />
          {!collapsed && (
            <>
              <span className={`text-[10px] font-bold tracking-widest opacity-70 ${live.testMode ? "text-warning opacity-100" : ""}`}>
                {live.testMode ? "TEST" : "LIVE"}
              </span>
              <span className="flex-1">
                {rateLabel(currencyMode)} {live.price > 0 ? liveDisplay : "-.----"}
              </span>
            </>
          )}
          <span className="text-[10px]">
            {live.direction === "up" ? "▲" : live.direction === "down" ? "▼" : ""}
          </span>
        </button>

        {/* Nav */}
        <nav className="flex flex-col gap-0.5 px-2 pt-4 flex-1">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.page}
              className={`
                flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                transition-all cursor-pointer text-left whitespace-nowrap
                ${activePage === item.page
                  ? "bg-surface2 text-white border-l-[3px] border-blue-500"
                  : "text-dim hover:bg-surface2 hover:text-white border-l-[3px] border-transparent"
                }
                ${collapsed ? "justify-center px-2" : ""}
              `}
              onClick={() => { onNavigate(item.page); onClose(); }}
              title={collapsed ? item.label : undefined}
            >
              <span className={`
                w-[18px] h-[18px] shrink-0 rounded
                icon-${item.icon}
                ${activePage === item.page ? "bg-blue-500" : "bg-border"}
              `} />
              {!collapsed && <span>{item.label}</span>}
            </button>
          ))}
        </nav>
      </aside>
    </>
  );
}
