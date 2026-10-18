# Portas (Interfaces)

## Introdução

Na arquitetura hexagonal, as portas são interfaces que definem como o domínio da aplicação se comunica com o mundo exterior. Ficam em `src/core/interfaces/`. Este documento reflete as interfaces reais do código.

## FileParserPort

Analisa arquivos da B3 e os converte em objetos de domínio.

```typescript
export interface FileParserPort {
  parseNegotiationFile(file: File): Promise<Transaction[]>;
  parseMovementFile(file: File): Promise<SpecialEvent[]>;
}
```

**Implementação:** `B3FileParser` (`src/infrastructure/adapters/B3FileParser.ts`).

## AssetProcessorPort

Processa transações e eventos especiais, calculando posições, resultados e rendimentos.

```typescript
export interface AssetProcessorPort {
  analyzeTransactionsAndSpecialEvents(
    transactions: Transaction[],
    specialEvents: SpecialEvent[],
    selectedYear: number,
    includeInitialPosition: boolean
  ): Promise<ProcessedDataSummary>;

  processAssets(
    transactions: Transaction[],
    specialEvents: SpecialEvent[],
    initialPositions?: AssetPosition[]
  ): Promise<AssetPosition[]>;

  calculateTradeResults(
    assetPositions: AssetPosition[],
    selectedYear: number
  ): Promise<TradeResult[]>;

  calculateMonthlyResults(
    tradeResults: TradeResult[],
    selectedYear: number
  ): Promise<MonthlyResult[]>;

  extractIncomeRecords(specialEvents: SpecialEvent[]): Promise<IncomeRecord[]>;

  validateData(
    transactions: Transaction[],
    specialEvents: SpecialEvent[]
  ): Promise<Inconsistency[]>;
}
```

**Implementação:** `AssetProcessor` (`src/infrastructure/adapters/AssetProcessor.ts`). `analyzeTransactionsAndSpecialEvents` é o método de entrada usado pela UI — orquestra os demais métodos e devolve um `ProcessedDataSummary` já consolidado.

## IRPFGeneratorPort

Gera a declaração IRPF e o arquivo final a partir dos dados processados.

```typescript
export interface IRPFGeneratorPort {
  generateDeclaration(
    processedDataSummary: ProcessedDataSummary,
    taxPayerInfo: TaxPayerInfo,
    year: number
  ): Promise<IRPFDeclaration>;

  generateFile(declaration: IRPFDeclaration, originalContent?: string): Promise<Blob>;
}
```

**Implementação:** `DBKFileGenerator` (`src/infrastructure/adapters/DBKFileGenerator.ts`). `generateDeclaration` é delegado a `DeclarationBuilder` (`src/infrastructure/adapters/DeclarationBuilder.ts`), que constrói a estrutura `DeclarationSection`/`DeclarationItem` a partir dos dados processados; `generateFile` usa `WritterDBKFileEditor` (`src/infrastructure/adapters/LayoutDBK2025/`) para serializar essa estrutura no formato `.DBK`. Essa separação existe para manter a lógica de apuração (quanto cada seção/item vale) isolada da lógica de serialização (como isso é escrito em bytes). `originalContent` permite basear a geração em um `.DBK` previamente importado, preservando campos não gerenciados pela aplicação.

Há também `DBKFileParser` (`src/infrastructure/adapters/DBKFileParser.ts`), que usa `ReaderDBKFileEditor` para extrair `TaxPayerInfo` (e, opcionalmente, dados parciais da declaração) de um `.DBK` existente — usado na funcionalidade "Importar Declaração Pré-Preenchida".

## ReportGeneratorPort

Gera um relatório auxiliar (hoje, Excel) a partir de uma declaração IRPF já estruturada.

```typescript
export interface ReportGeneratorPort {
  generate(declaration: IRPFDeclaration): Blob;
}
```

**Implementação:** `ExcelReportGenerator` (`src/infrastructure/adapters/ExcelReportGenerator.ts`), usando SheetJS/`xlsx`.

## StoragePort

Armazena e recupera dados de sessão localmente.

```typescript
export interface StoragePort {
  saveSession(sessionId: string, description: string | undefined, year: number): Promise<void>;
  saveOriginalDBK(sessionId: string, content: string): Promise<void>;
  getOriginalDBK(sessionId: string): Promise<string | null>;
  saveTransactions(sessionId: string, transactions: Transaction[]): Promise<void>;
  saveSpecialEvents(sessionId: string, specialEvents: SpecialEvent[]): Promise<void>;
  saveProcessedData(
    sessionId: string,
    assetPositions: AssetPosition[],
    monthlyResults: MonthlyResult[],
    incomeRecords: IncomeRecord[]
  ): Promise<void>;
  saveDeclaration(sessionId: string, declaration: IRPFDeclaration): Promise<void>;
  getSessions(): Promise<StoredSession[]>;
  getSessionData(sessionId: string): Promise<StoredData | null>;
  deleteSession(sessionId: string): Promise<void>;
}

export interface StoredSession {
  id: string;
  createdAt: Date;
  lastModified: Date;
  year: number;
  description?: string;
  status: SessionStatus;
}

export interface StoredData {
  sessionId: string;
  transactions: Transaction[];
  specialEvents: SpecialEvent[];
  initialPositions?: AssetPosition[];
  processedData?: ProcessedDataSummary;
  generatedDeclaration?: IRPFDeclaration;
}

export enum SessionStatus {
  DRAFT = 'DRAFT',
  PROCESSED = 'PROCESSED',
  GENERATED = 'GENERATED',
  ARCHIVED = 'ARCHIVED',
}
```

**Implementação:** `IndexedDBStorage` (`src/infrastructure/adapters/IndexedDBStorage.ts`), usando IndexedDB.

## ExternalTickerInfoProviderPort

Busca dados complementares de um ativo (hoje, principalmente o CNPJ) a partir do ticker.

```typescript
export interface StockInfo {
  cnpj: string;
  name: string;
}

export interface ExternalTickerInfoProviderPort {
  getStockInfo(ticker: string): Promise<StockInfo | null>;
}
```

**Implementações existentes** (`src/infrastructure/adapters/ExternalTickerInfoProviderPort/`):

- `StaticTickerInfoAdapter` — local, sem rede. **É a implementação atualmente conectada no `Container`** de injeção de dependências.
- `BrapiAdapter`, `BrasilApiAdapter`, `CNPJInfoAdapter`, `Investidor10ScraperAdapter` — consultam APIs externas (brapi.dev, brasilapi.com.br, cnpj.info, investidor10.com.br respectivamente). Existem no código mas **não estão conectadas no `Container`** — são candidatas a implementação alternativa, não código morto a esmo, mas também não utilizadas em produção hoje.

Separadamente, a tela de resultados (`ResultPage.tsx`) faz uma chamada direta (fora dessa porta) à BrasilAPI para exibir a razão social — ver [07-seguranca.md](./07-seguranca.md).

## ExternalEventInfoProviderPort

Busca dados de eventos especiais que a B3 não informa (datas e fatores de desdobramento, grupamento, bonificação, conversão).

```typescript
export interface EventInfo {
  ticker: string;
  type: string;
  date: Date;
  factor: number;
}

export interface ExternalEventInfoProviderPort {
  getEventsForAsset(ticker: string, year?: number): Promise<any[]>;
  getEventFactor(ticker: string, eventType: string, eventDate: Date): Promise<number | null>;
  getSpecialEventAveragePrice(
    ticker: string,
    eventType: string,
    eventDate: Date
  ): Promise<number | null>;
}
```

**Implementação:** `StaticEventInfoAdapter` (`src/infrastructure/adapters/StaticEventInfoAdapter.ts`) — apesar do nome "External", é uma implementação **local**, que lê os dados preenchidos manualmente em `src/infrastructure/data` (não faz chamadas de rede).

## Relacionamentos entre Portas

```
┌─────────────────────────────────────────────────────────────────┐
│                        Interface de Usuário                      │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                                ▼
┌─────────────┐ ┌──────────────────┐ ┌──────────────────┐ ┌───────────────┐
│FileParserPort│ │AssetProcessorPort│ │IRPFGeneratorPort │ │  StoragePort  │
└──────┬───────┘ └────────┬─────────┘ └────────┬─────────┘ └───────┬───────┘
       │                  │                    │                   │
       │         ┌────────┴─────────┐          │                   │
       │         │ ExternalTicker/  │          │                   │
       │         │ EventInfoProvider│          │                   │
       │         └──────────────────┘          │                   │
       ▼                  ▼                    ▼                   ▼
┌─────────────────────────────────────────────────────────────────┐
│                            Domínio                               │
└─────────────────────────────────────────────────────────────────┘
```

## Princípios de Design

As portas seguem inversão de dependência e segregação de interfaces: o domínio depende apenas destas abstrações, e cada porta tem uma responsabilidade única. Isso permite trocar `StaticTickerInfoAdapter` por `BrapiAdapter`, por exemplo, sem alterar `AssetProcessor` ou a UI.
