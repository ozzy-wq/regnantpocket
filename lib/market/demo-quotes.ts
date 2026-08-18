const BASE_PRICES: Record<string, number> = {
  'EUR/USD': 1.0924,
  'GBP/USD': 1.2817,
  'BTC/USD': 64250,
  'ETH/USD': 3260,
  'XAU/USD': 2394
};

function symbolSeed(symbol: string) {
  return [...symbol].reduce((sum, char) => sum + char.charCodeAt(0), 0);
}

export function getDemoQuote(symbol: string, at = new Date()) {
  const base = BASE_PRICES[symbol] ?? 100;
  const seed = symbolSeed(symbol);
  const seconds = Math.floor(at.getTime() / 1000);
  const slow = Math.sin((seconds + seed * 13) / 37);
  const fast = Math.sin((seconds + seed * 7) / 9) * 0.35;
  const micro = Math.cos((seconds + seed) / 3) * 0.08;
  const amplitude = symbol.includes('BTC') ? 420 : symbol.includes('ETH') ? 25 : symbol.includes('XAU') ? 7 : 0.0026;
  const price = base + amplitude * (slow + fast + micro);
  const decimals = base > 1000 ? 2 : base > 10 ? 3 : 5;
  return Number(price.toFixed(decimals));
}

export function getDemoHistory(symbol: string, points = 80, intervalSeconds = 5) {
  const now = Date.now();
  return Array.from({ length: points }, (_, index) => {
    const timestamp = new Date(now - (points - 1 - index) * intervalSeconds * 1000);
    return { timestamp: timestamp.toISOString(), price: getDemoQuote(symbol, timestamp) };
  });
}
