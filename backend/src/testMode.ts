/** Simple in-memory test mode state */

let _testMode = false;
let _savedRatio = 0; // Binance price at the time of GET /currentRatio

export function isTestMode(): boolean {
  return _testMode;
}

export function enterTestMode(binancePrice: number) {
  _testMode = true;
  _savedRatio = binancePrice;
  console.log(`[TestMode] ENTERED — saved Binance ratio: ${binancePrice}`);
}

export function exitTestMode(): number {
  _testMode = false;
  const ratio = _savedRatio;
  _savedRatio = 0;
  console.log(`[TestMode] EXITED — restored ratio: ${ratio}`);
  return ratio;
}

export function getSavedRatio(): number {
  return _savedRatio;
}
