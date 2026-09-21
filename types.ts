
export enum TransactionType {
  BUY = 'BUY',
  SELL = 'SELL'
}

export interface Transaction {
  id: string;
  date: string;
  ticker: string;
  name: string;
  type: TransactionType;
  quantity: number;
  price: number;
  fees: number;
  rate?: number;
  notes?: string;
}

export interface Dividend {
  id: string;
  date: string;
  ticker: string;
  name: string;
  amount: number;
  rate?: number;
  rawAmount?: number;
  notes?: string;
}

export interface Holding {
  ticker: string;
  name: string;
  quantity: number;
  averageCost: number;
  totalInvested: number;
  estimatedDividendPerShare?: number; // 新增：預估每股股利
  estimatedTotalDividend?: number;    // 新增：預估總股利
}

export interface PortfolioStats {
  totalInvested: number;
  totalDividend: number;
  holdingCount: number;
  topHolding: string;
}
