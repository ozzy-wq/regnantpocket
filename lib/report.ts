export type DemoReportInput = {
  balance: number;
  openPnl: number;
  equity: number;
  openPositions: number;
  closedTrades: number;
  riskMode: string;
};

function money(value: number) {
  return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function createDemoReport(input: DemoReportInput) {
  return [
    'REGNANT X DEMO REPORT',
    `Balance: ${money(input.balance)}`,
    `Open PnL: ${money(input.openPnl)}`,
    `Equity: ${money(input.equity)}`,
    `Open positions: ${input.openPositions}`,
    `Closed trades: ${input.closedTrades}`,
    `Risk mode: ${input.riskMode}`,
    'Mode: Demo simulation only — no real funds, no custody, no withdrawals, no live execution.'
  ].join('\n');
}
