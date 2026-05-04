import { AssetCategory, MarketType, Transaction } from './Transaction';
import { SpecialEvent } from './SpecialEvent';

export type ProcessedDataSummary = {
  assetPositions: AssetPosition[];
  incomeRecords: IncomeRecord[];
  // tradeResults: TradeResult[],
  monthlyResults: MonthlyResult[];
};

export interface ProcessedDataSummaryWithInconsistencies extends ProcessedDataSummary {
  inconsistencies: Inconsistency[];
}

export interface ProcessedDataSummaryWithSourceData extends ProcessedDataSummary {
  transactions: Transaction[];
  specialEvents: SpecialEvent[];
}

export interface Inconsistency {
  type: 'error' | 'warning';
  message: string;
  details: string;
  assetCode?: string;
  date?: Date;
  locationInfo?: string;
}

/**
 * Represents an asset position
 */
export interface AssetPosition {
  /**
   * The asset code (ticker)
   */
  assetCode: string;

  /**
   * The asset name
   */
  assetName: string;

  /**
   * The asset category
   */
  assetCategory: AssetCategory;

  /**
   * The market type
   */
  marketType: MarketType;

  /**
   * The quantity of assets
   */
  quantity: number;

  /**
   * The average price
   */
  averagePrice: number;

  /**
   * The total cost
   */
  totalCost: number;

  /**
   * The current price
   */
  currentPrice?: number;

  /**
   * The current value
   */
  currentValue?: number;

  /**
   * The acquisition date
   */
  acquisitionDate: Date;

  /**
   * The last update date
   */
  lastUpdateDate: Date;

  /**
   * The broker name
   */
  brokerName: string;

  /**
   * The broker code
   */
  brokerCode: string;

  /**
   * The transactions history
   */
  transactionsHistory: TransactionHistory[];

  // --- Campos Adicionados ---
  /**
   * CNPJ da empresa ou FII.
   * Pode ser necessário buscar essa informação externamente ou adicioná-la durante o processamento.
   */
  cnpj?: string;

  /**
   * Quantidade base utilizada exclusivamente para cálculo histórico do preço médio, 
   * separada de eventos sem custo (como bonificações).
   */
  baseQuantity?: number;

  /**
   * Valor total do ativo em 31/12 do ano anterior.
   * Precisa ser calculado ou obtido das posições iniciais.
   */
  previousYearValue?: number;
  // --- Fim dos Campos Adicionados ---
}

/**
 * Represents a transaction history entry
 */
export interface TransactionHistory {
  /**
   * The date of the transaction
   */
  date: Date;

  /**
   * The type of transaction (buy, sell, split, bonus, etc.)
   */
  type: 'buy' | 'sell' | 'event' | string;

  /**
   * A descriptive name for the entry
   */
  description?: string;

  /**
   * The quantity of assets changed in this entry
   */
  quantity: number;

  /**
   * The unit price used in this entry
   */
  unitPrice: number;

  /**
   * The total value of the entry
   */
  totalValue: number;

  /**
   * The fees
   */
  fees: number;

  /**
   * The taxes
   */
  taxes: number;

  /**
   * The net value
   */
  netValue: number;

  /**
   * The quantity of assets after this entry
   */
  resultingQuantity?: number;

  /**
   * The average price of the asset after this entry
   */
  resultingAveragePrice?: number;

  /**
   * The total cost of the position after this entry
   */
  resultingTotalCost?: number;
}

/**
 * Represents a trade result
 */
export interface TradeResult {
  /**
   * The asset code (ticker)
   */
  assetCode: string;

  /**
   * The asset name
   */
  assetName: string;

  /**
   * The asset category
   */
  assetCategory: AssetCategory;

  /**
   * The market type
   */
  marketType: MarketType;

  /**
   * The date of the trade
   */
  date: Date;

  /**
   * The month of the trade
   */
  month: number;

  /**
   * The year of the trade
   */
  year: number;

  /**
   * The quantity of assets
   */
  quantity: number;

  /**
   * The purchase price
   */
  purchasePrice: number;

  /**
   * The purchase cost
   */
  purchaseCost: number;

  /**
   * The sale price
   */
  salePrice: number;

  /**
   * The sale value
   */
  saleValue: number;

  /**
   * The fees
   */
  fees: number;

  /**
   * The taxes
   */
  taxes: number;

  /**
   * The profit or loss
   */
  profitOrLoss: number;

  /**
   * Whether the trade is exempt from taxes
   */
  isExempt: boolean;
}

/**
 * Represents a monthly result
 */
export interface MonthlyResult {
  /**
   * The month
   */
  month: number;

  /**
   * The year
   */
  year: number;

  /**
   * The total sales value
   */
  totalSalesValue: number;

  /**
   * The total profit
   */
  totalProfit: number;

  /**
   * The total loss
   */
  totalLoss: number;

  /**
   * The net result
   */
  netResult: number;

  /**
   * The compensated loss
   */
  compensatedLoss: number;

  /**
   * The taxable profit
   */
  taxableProfit: number;

  /**
   * The tax rate
   */
  taxRate: number;

  /**
   * The tax due
   */
  taxDue: number;

  /**
   * The tax withheld
   */
  taxWithheld: number;

  /**
   * The tax to pay
   */
  taxToPay: number;

  /**
   * The remaining loss to compensate
   */
  remainingLoss: number;

  /**
   * The trade results
   */
  tradeResults: TradeResult[];

  // --- Campos Adicionados ---
  /**
   * Categoria do ativo principal relacionado a este resultado mensal (para agrupamento).
   */
  assetCategory?: AssetCategory; // Ou string se preferir
  /**
   * Tipo de trade predominante no mês (para agrupamento).
   */
  tradeType?: 'Common' | 'DayTrade';
  // --- Fim dos Campos Adicionados ---
}

/**
 * Represents an income record
 */
// ATENÇÃO: Renomeada para IncomeRecord para refletir melhor o propósito
export interface IncomeRecord {
  /**
   * The asset code (ticker)
   */
  assetCode: string;

  /**
   * The asset name
   */
  assetName: string;

  /**
   * The asset category
   */
  assetCategory: string; // Ou usar AssetCategory enum?

  /**
   * The type of income
   */
  incomeType: string; // e.g., 'Dividendos', 'Juros sobre Capital Próprio', 'Rendimentos'

  /**
   * The date of the income event (e.g., payment date)
   */
  date: Date;

  /**
   * The month of the income event
   */
  month: number;

  /**
   * The year of the income event
   */
  year: number;

  /**
   * The gross value
   */
  grossValue: number;

  /**
   * The tax withheld (e.g., IRRF for JSCP)
   */
  taxWithheld: number;

  /**
   * The net value
   */
  netValue: number;

  /**
   * The broker name (if applicable)
   */
  brokerName: string;

  /**
   * The broker code (if applicable)
   */
  brokerCode: string;

  // --- Campos Adicionados ---
  /**
   * CNPJ da fonte pagadora do rendimento.
   */
  cnpj?: string;
  /**
   * Nome da fonte pagadora do rendimento.
   */
  sourceName?: string;
  /**
   * Status do pagamento (útil para JSCP/Crédito não pago).
   */
  status?: 'PAGO' | 'CREDITADO_NAO_PAGO';
  // --- Fim dos Campos Adicionados ---
}
