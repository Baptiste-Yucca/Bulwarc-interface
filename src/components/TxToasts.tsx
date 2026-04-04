import type { TxToast } from "../hooks/useTxToast";
import { ARCSCAN_TX } from "../hooks/useShields";

interface Props {
  toasts: TxToast[];
}

export function TxToasts({ toasts }: Props) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-16 right-4 z-[60] flex flex-col gap-2 max-w-sm">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`
            flex items-center gap-3 px-4 py-3 rounded-xl border font-mono text-xs
            backdrop-blur-md transition-all animate-slide-in
            ${t.status === "pending"
              ? "bg-accent/10 border-accent/30 text-accent"
              : t.status === "ok"
                ? "bg-neon-green/10 border-neon-green/30 text-neon-green"
                : "bg-neon-pink/10 border-neon-pink/30 text-neon-pink"
            }
          `}
        >
          {/* Status indicator */}
          {t.status === "pending" ? (
            <span className="w-3 h-3 rounded-full border-2 border-accent border-t-transparent animate-spin shrink-0" />
          ) : t.status === "ok" ? (
            <span className="text-sm shrink-0">&#10003;</span>
          ) : (
            <span className="text-sm shrink-0">&#10007;</span>
          )}

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="font-bold text-[10px] uppercase tracking-wider mb-0.5">
              {t.status === "pending" ? "Pending" : t.status === "ok" ? "Confirmed" : "Failed"}
            </div>
            <div className="truncate text-[11px]">{t.label}</div>
          </div>

          {/* Tx link */}
          <a
            href={`${ARCSCAN_TX}${t.hash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 hover:underline text-[10px]"
          >
            {t.hash.slice(0, 6)}...{t.hash.slice(-4)}
          </a>
        </div>
      ))}
    </div>
  );
}
