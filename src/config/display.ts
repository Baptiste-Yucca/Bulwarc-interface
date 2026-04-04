export type CurrencyMode = "EUR/USD" | "USD/EUR";

/** Format a strike/oracle price (stored as EUR/USD in 1e8) for display */
export function formatRate(value: bigint, mode: CurrencyMode): string {
  const eurUsd = Number(value) / 1e8;
  if (mode === "EUR/USD") return eurUsd.toFixed(4);
  return (1 / eurUsd).toFixed(4);
}

/** Label shown next to the rate */
export function rateLabel(mode: CurrencyMode): string {
  return mode;
}
