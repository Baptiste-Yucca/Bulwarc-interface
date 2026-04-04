export type SortKey = "strike" | "notional" | "expiry" | "premium";
export type DirectionFilter = "all" | "normal" | "reverse";

export interface Filters {
  sortBy: SortKey;
  descending: boolean;
  direction: DirectionFilter;
  hiddenStatuses: Set<number>;
}

export const DEFAULT_FILTERS: Filters = {
  sortBy: "strike",
  descending: true,
  direction: "all",
  hiddenStatuses: new Set(),
};

interface Props {
  filters: Filters;
  onChange: (f: Filters) => void;
  onClose: () => void;
}

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "strike", label: "Strike" },
  { key: "notional", label: "Amount" },
  { key: "expiry", label: "Expiration" },
  { key: "premium", label: "Premium to earn" },
];

const STATUS_TOGGLES: { status: number; label: string }[] = [
  { status: 0, label: "Funding" },
  { status: 1, label: "Earn" },
  { status: 2, label: "Locked" },
];

const DIR_OPTIONS: { key: DirectionFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "normal", label: "EUR → USD" },
  { key: "reverse", label: "USD → EUR" },
];

export function FilterModal({ filters, onChange, onClose }: Props) {
  const set = (partial: Partial<Filters>) => onChange({ ...filters, ...partial });

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="glass rounded-2xl max-w-sm w-full p-6 animate-glow-pulse" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-bold text-accent glow-amber font-mono">Filters</h2>
          <button onClick={onClose} className="text-dim hover:text-white text-xl leading-none cursor-pointer">&times;</button>
        </div>

        {/* Sort by */}
        <div className="mb-5">
          <div className="text-[10px] uppercase tracking-widest text-dim font-mono mb-2">Sort by</div>
          <div className="grid grid-cols-2 gap-2">
            {SORT_OPTIONS.map((opt) => (
              <button
                key={opt.key}
                onClick={() => set({ sortBy: opt.key })}
                className={`px-3 py-2 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer border ${
                  filters.sortBy === opt.key
                    ? "border-accent/50 bg-accent/10 text-accent"
                    : "border-border bg-bg text-dim hover:border-dim"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Order */}
        <div className="mb-5">
          <div className="text-[10px] uppercase tracking-widest text-dim font-mono mb-2">Order</div>
          <div className="flex gap-2">
            <button
              onClick={() => set({ descending: true })}
              className={`flex-1 px-3 py-2 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer border ${
                filters.descending
                  ? "border-accent/50 bg-accent/10 text-accent"
                  : "border-border bg-bg text-dim hover:border-dim"
              }`}
            >
              Descending
            </button>
            <button
              onClick={() => set({ descending: false })}
              className={`flex-1 px-3 py-2 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer border ${
                !filters.descending
                  ? "border-accent/50 bg-accent/10 text-accent"
                  : "border-border bg-bg text-dim hover:border-dim"
              }`}
            >
              Ascending
            </button>
          </div>
        </div>

        {/* Direction filter */}
        <div className="mb-5">
          <div className="text-[10px] uppercase tracking-widest text-dim font-mono mb-2">Direction</div>
          <div className="flex gap-2">
            {DIR_OPTIONS.map((opt) => (
              <button
                key={opt.key}
                onClick={() => set({ direction: opt.key })}
                className={`flex-1 px-3 py-2 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer border ${
                  filters.direction === opt.key
                    ? opt.key === "normal" ? "border-cyan/50 bg-cyan/10 text-cyan"
                      : opt.key === "reverse" ? "border-neon-pink/50 bg-neon-pink/10 text-neon-pink"
                      : "border-accent/50 bg-accent/10 text-accent"
                    : "border-border bg-bg text-dim hover:border-dim"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Hide statuses */}
        <div className="mb-5">
          <div className="text-[10px] uppercase tracking-widest text-dim font-mono mb-2">Hide status</div>
          <div className="flex gap-2">
            {STATUS_TOGGLES.map((opt) => {
              const hidden = filters.hiddenStatuses.has(opt.status);
              return (
                <button
                  key={opt.status}
                  onClick={() => {
                    const next = new Set(filters.hiddenStatuses);
                    if (hidden) next.delete(opt.status); else next.add(opt.status);
                    set({ hiddenStatuses: next });
                  }}
                  className={`flex-1 px-3 py-2 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer border ${
                    hidden
                      ? "border-neon-pink/40 bg-neon-pink/10 text-neon-pink line-through"
                      : "border-border bg-bg text-dim hover:border-dim"
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Reset */}
        <button
          onClick={() => onChange(DEFAULT_FILTERS)}
          className="w-full px-3 py-2 border border-border rounded-lg text-xs text-dim hover:text-white hover:border-dim transition-all cursor-pointer font-mono"
        >
          Reset to defaults
        </button>
      </div>
    </div>
  );
}
