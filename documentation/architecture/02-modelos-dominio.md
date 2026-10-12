# Modelos de Domínio

## Introdução

Os modelos de domínio representam os conceitos centrais da aplicação e encapsulam a lógica de negócio. Ficam em `src/core/domain/`. Este documento reflete as interfaces TypeScript reais (não um design inicial) — consulte o código-fonte para o detalhe exato de cada campo.

## Transaction (`src/core/domain/Transaction.ts`)

Representa uma transação (compra ou venda) extraída do arquivo de negociação da B3.

```typescript
export interface Transaction {
  date: Date;
  year: number;
  month: number;
  type: 'buy' | 'sell';
  marketType: MarketType;
  assetCode: string;
  assetName: string;
  quantity: number;
  unitPrice: number;
  totalValue: number;
  fees: number;
  taxes: number;
  netValue: number;
  assetCategory: AssetCategory;
  brokerName: string;
  brokerCode: string;
  rowNumber?: number;  // para debug
  fileName?: string;   // para debug
}

export enum MarketType {
  SPOT = 'SPOT',
  OPTIONS = 'OPTIONS',
  TERM = 'TERM',
  FUTURES = 'FUTURES',
  FRACTIONAL = 'FRACTIONAL',
  OTHER = 'OTHER',
}

export enum AssetCategory {
  STOCK = 'STOCK',
  ETF = 'ETF',
  FII = 'FII',
  BDR = 'BDR',
  OPTION = 'OPTION',
  DEBENTURE = 'DEBENTURE',
  TREASURY = 'TREASURY',
  OTHER = 'OTHER',
}
```

## SpecialEvent (`src/core/domain/SpecialEvent.ts`)

Representa um evento especial extraído do arquivo de movimentação da B3 (dividendos, JCP, desdobramentos, etc.).

```typescript
export interface SpecialEvent {
  date: Date;
  year: number;
  month: number;
  type: SpecialEventType;
  originalType?: string;           // texto original da B3, antes do mapeamento
  operationType?: 'Credito' | 'Debito';
  assetCode: string;
  assetName: string;
  quantity: number;
  unitPrice: number;
  totalValue: number;
  fees: number;
  taxes: number;
  netValue: number;
  assetCategory: string;
  brokerName: string;
  brokerCode: string;
  description?: string;
  rowNumber?: number;
  fileName?: string;
  factor?: number;                 // fator de desdobramento/grupamento
}

export enum SpecialEventType {
  DIVIDEND = 'Dividendo',
  JCP = 'Juros sobre capital próprio',
  STOCK_DIVIDEND = 'Bonificação em ações',
  STOCK_SPLIT = 'Desdobro',
  REVERSE_SPLIT = 'Grupamento',
  AMORTIZATION = 'Amortização',
  INCOME = 'Rendimento',
  AUCTION = 'Leilão',
  OTHER = 'Outros',
}
```

As datas e fatores de eventos que a B3 não informa diretamente (bonificação, desdobramento, grupamento, conversões) são preenchidos manualmente em `src/infrastructure/data` e consultados via `ExternalEventInfoProviderPort` (implementação local, `StaticEventInfoAdapter` — ver [03-portas-interfaces.md](./03-portas-interfaces.md)).

## AssetPosition e tipos relacionados (`src/core/domain/AssetPosition.ts`)

```typescript
export interface AssetPosition {
  assetCode: string;
  assetName: string;
  assetCategory: AssetCategory;
  marketType: MarketType;
  quantity: number;
  averagePrice: number;
  totalCost: number;
  currentPrice?: number;
  currentValue?: number;
  acquisitionDate: Date;
  lastUpdateDate: Date;
  brokerName: string;
  brokerCode: string;
  transactionsHistory: TransactionHistory[];
  cnpj?: string;                   // CNPJ da empresa/FII, quando disponível
  baseQuantity?: number;           // base para custo médio, exclui eventos sem custo (ex: bonificação)
  previousYearValue?: number;      // valor em 31/12 do ano anterior
}

export interface TransactionHistory {
  date: Date;
  type: 'buy' | 'sell' | 'event' | string;
  description?: string;
  quantity: number;
  unitPrice: number;
  totalValue: number;
  fees: number;
  taxes: number;
  netValue: number;
  resultingQuantity?: number;
  resultingAveragePrice?: number;
  resultingTotalCost?: number;
}

export interface TradeResult {
  assetCode: string;
  assetName: string;
  assetCategory: AssetCategory;
  marketType: MarketType;
  date: Date;
  month: number;
  year: number;
  quantity: number;
  purchasePrice: number;
  purchaseCost: number;
  salePrice: number;
  saleValue: number;
  fees: number;
  taxes: number;
  profitOrLoss: number;
  isExempt: boolean;
}

export interface MonthlyResult {
  month: number;
  year: number;
  totalSalesValue: number;
  totalProfit: number;
  totalLoss: number;
  netResult: number;
  compensatedLoss: number;
  taxableProfit: number;
  taxRate: number;
  taxDue: number;
  taxWithheld: number;
  taxToPay: number;
  remainingLoss: number;
  tradeResults: TradeResult[];
  assetCategory?: AssetCategory;   // categoria predominante, para agrupamento
  tradeType?: 'Common' | 'DayTrade';
}

export interface IncomeRecord {
  assetCode: string;
  assetName: string;
  assetCategory: string;
  incomeType: string;              // 'Dividendos', 'Juros sobre Capital Próprio', 'Rendimentos', ...
  date: Date;
  month: number;
  year: number;
  grossValue: number;
  taxWithheld: number;
  netValue: number;
  brokerName: string;
  brokerCode: string;
  cnpj?: string;
  sourceName?: string;
  status?: 'PAGO' | 'CREDITADO_NAO_PAGO';
}

export interface Inconsistency {
  type: 'error' | 'warning';
  message: string;
  details: string;
  assetCode?: string;
  date?: Date;
  locationInfo?: string;
}

// Agrupamento usado como retorno do AssetProcessorPort
export type ProcessedDataSummary = {
  assetPositions: AssetPosition[];
  incomeRecords: IncomeRecord[];
  monthlyResults: MonthlyResult[];
};
```

## IRPFDeclaration e tipos relacionados (`src/core/domain/IRPFDeclaration.ts`)

```typescript
export interface IRPFDeclaration {
  taxPayerInfo: TaxPayerInfo;
  year: number;
  assetPositions: AssetPosition[];
  monthlyResults: MonthlyResult[];
  incomeRecords: IncomeRecord[];
  totalTaxDue: number;
  totalTaxWithheld: number;
  totalTaxToPay: number;           // positivo = a pagar, negativo = a restituir
  remainingLoss: number;
  totalAssetsValue: number;
  totalIncome: number;
  generationDate: Date;
  sections: DeclarationSection[];  // seções já formatadas para geração do .DBK
}

export interface TaxPayerInfo {
  name: string;
  cpf: string;
  dateOfBirth: Date;
  address: Address;
  phone: string;
  email: string;
  occupation: string;
}

export interface Address {
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface DeclarationSection {
  code: string;          // ex: 'BENS', 'REND_ISENTOS'
  name: string;
  description: string;
  items: DeclarationItem[];
}

export interface DeclarationItem {
  code: string;           // código IRPF do item (ex: '31', '73', '09', '10', '26')
  description: string;
  value: number;
  details?: string;
  cnpj?: string;
  sourceName?: string;
  ticker?: string;
  previousYearValue?: number;
  month?: number;
  tradedValue?: number;
  additionalType?: 'JUROS_CAPITAL_NAO_PAGOS' | 'CREDITO_TRANSITO_NAO_PAGOS' | string;
  type?: 'DAY_TRADE_ACOES' | 'FII' | 'COMMON_ACOES' | string;
}
```

## Observações

- Não existem mais `OperationType`, `EventType` (genérico) ou `AssetCategory.REAL_ESTATE_FUND` — foram substituídos por `type: 'buy'|'sell'`, `SpecialEventType` e `AssetCategory.FII`, respectivamente.
- Os campos `fees`, `taxes` e `netValue` aparecem tanto em `Transaction` quanto em `SpecialEvent` e `TransactionHistory` — refletem valores já líquidos de custos da B3, não apenas o valor bruto.
- `AssetPosition.cnpj` é opcional: é preenchido quando disponível, mas não há uma busca automática confiável embutida por padrão (ver [07-seguranca.md](./07-seguranca.md) sobre a exceção de busca de razão social).
