/**
 * Legacy portfolio types used only by the original LONG/SHORT dashboard helpers.
 *
 * Regnant Pocket's current demo terminal uses the UP/DOWN contracts in
 * `types/trading.ts`. Keep these types separate so the old dashboard model
 * cannot leak into the current demo trade lifecycle.
 */
export type LegacyDirection = 'LONG' | 'SHORT';

export interface LegacyPosition {
  id: string;
  symbol: string;
  direction: LegacyDirection;
  qty: number;
  entryPrice: number;
  currentPrice: number;
  openedAt: string;
}
