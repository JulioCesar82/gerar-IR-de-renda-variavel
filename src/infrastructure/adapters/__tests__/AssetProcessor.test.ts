import { AssetProcessor } from '../AssetProcessor';
import { ExternalEventInfoProviderPort } from '../../../core/interfaces/ExternalEventInfoProviderPort';
import { Transaction, AssetCategory, MarketType } from '../../../core/domain/Transaction';
import { SpecialEvent, SpecialEventType } from '../../../core/domain/SpecialEvent';
import { AssetPosition, TransactionHistory } from '../../../core/domain/AssetPosition';

function buildTransaction(overrides: Partial<Transaction> = {}): Transaction {
  const date = overrides.date ?? new Date(2025, 0, 15);
  return {
    date,
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    type: 'buy',
    marketType: MarketType.SPOT,
    assetCode: 'PETR4',
    assetName: 'Petrobras PN',
    quantity: 100,
    unitPrice: 10,
    totalValue: 1000,
    fees: 0,
    taxes: 0,
    netValue: 1000,
    assetCategory: AssetCategory.STOCK,
    brokerName: 'Broker',
    brokerCode: 'B1',
    ...overrides,
  };
}

function buildEvent(overrides: Partial<SpecialEvent> = {}): SpecialEvent {
  const date = overrides.date ?? new Date(2025, 0, 20);
  return {
    date,
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    type: SpecialEventType.OTHER,
    assetCode: 'PETR4',
    assetName: 'Petrobras PN',
    quantity: 0,
    unitPrice: 0,
    totalValue: 0,
    fees: 0,
    taxes: 0,
    netValue: 0,
    assetCategory: 'STOCK',
    brokerName: 'Broker',
    brokerCode: 'B1',
    ...overrides,
  };
}

// AssetProcessor.processAssets() takes already-mapped events (type = SpecialEventType enum
// value, plus the original B3 string on `_originalStringType`) — the string -> enum mapping
// itself only happens inside analyzeTransactionsAndSpecialEvents(). Use this helper, not
// buildEvent() directly, for any processAssets()-level special-event test.
function buildMappedEvent(
  originalStringType: string,
  mappedType: SpecialEventType,
  overrides: Partial<SpecialEvent> = {}
): SpecialEvent & { _originalStringType: string } {
  return {
    ...buildEvent({ type: mappedType, ...overrides }),
    _originalStringType: originalStringType,
  };
}

function buildHistoryEntry(overrides: Partial<TransactionHistory> = {}): TransactionHistory {
  const date = overrides.date ?? new Date(2025, 0, 15);
  return {
    date,
    type: 'buy',
    quantity: 100,
    unitPrice: 10,
    totalValue: 1000,
    fees: 0,
    taxes: 0,
    netValue: 1000,
    ...overrides,
  };
}

function buildPosition(overrides: Partial<AssetPosition> = {}): AssetPosition {
  return {
    assetCode: 'PETR4',
    assetName: 'Petrobras PN',
    assetCategory: AssetCategory.STOCK,
    marketType: MarketType.SPOT,
    quantity: 0,
    averagePrice: 0,
    totalCost: 0,
    acquisitionDate: new Date(2025, 0, 15),
    lastUpdateDate: new Date(2025, 0, 15),
    brokerName: 'Broker',
    brokerCode: 'B1',
    transactionsHistory: [],
    ...overrides,
  };
}

function buildMockProvider(
  overrides: Partial<ExternalEventInfoProviderPort> = {}
): jest.Mocked<ExternalEventInfoProviderPort> {
  return {
    getEventsForAsset: jest.fn().mockResolvedValue([]),
    getEventFactor: jest.fn().mockResolvedValue(null),
    getSpecialEventAveragePrice: jest.fn().mockResolvedValue(null),
    ...overrides,
  } as jest.Mocked<ExternalEventInfoProviderPort>;
}

describe('AssetProcessor', () => {
  describe('processAssets - transactions', () => {
    it('creates a position from a single buy with correct quantity/cost/averagePrice', async () => {
      const processor = new AssetProcessor(buildMockProvider());
      const positions = await processor.processAssets(
        [buildTransaction({ type: 'buy', quantity: 100, unitPrice: 10, totalValue: 1000 })],
        []
      );

      expect(positions).toHaveLength(1);
      expect(positions[0]).toMatchObject({ quantity: 100, totalCost: 1000, averagePrice: 10 });
    });

    it('averages the price correctly across two buys at different prices', async () => {
      const processor = new AssetProcessor(buildMockProvider());
      const positions = await processor.processAssets(
        [
          buildTransaction({
            date: new Date(2025, 0, 10),
            type: 'buy',
            quantity: 100,
            unitPrice: 10,
            totalValue: 1000,
          }),
          buildTransaction({
            date: new Date(2025, 1, 10),
            type: 'buy',
            quantity: 100,
            unitPrice: 20,
            totalValue: 2000,
          }),
        ],
        []
      );

      expect(positions[0]).toMatchObject({ quantity: 200, totalCost: 3000, averagePrice: 15 });
    });

    it('reduces quantity and cost proportionally on sell, keeping the average price', async () => {
      const processor = new AssetProcessor(buildMockProvider());
      const positions = await processor.processAssets(
        [
          buildTransaction({
            date: new Date(2025, 0, 10),
            type: 'buy',
            quantity: 100,
            unitPrice: 10,
            totalValue: 1000,
          }),
          buildTransaction({
            date: new Date(2025, 1, 10),
            type: 'sell',
            quantity: 40,
            unitPrice: 10,
            totalValue: 400,
          }),
        ],
        []
      );

      expect(positions[0]).toMatchObject({ quantity: 60, totalCost: 600, averagePrice: 10 });
    });

    it('zeroes the position when selling more than available', async () => {
      const processor = new AssetProcessor(buildMockProvider());
      const positions = await processor.processAssets(
        [
          buildTransaction({ date: new Date(2025, 0, 10), type: 'buy', quantity: 100 }),
          buildTransaction({ date: new Date(2025, 1, 10), type: 'sell', quantity: 150 }),
        ],
        []
      );

      // Position stays in the output (history is non-empty) but zeroed out.
      expect(positions[0]).toMatchObject({ quantity: 0, totalCost: 0, averagePrice: 0 });
    });

    it('only sets acquisitionDate from the first buy', async () => {
      const processor = new AssetProcessor(buildMockProvider());
      const firstBuyDate = new Date(2025, 0, 10);
      const positions = await processor.processAssets(
        [
          buildTransaction({ date: firstBuyDate, type: 'buy', quantity: 100 }),
          buildTransaction({ date: new Date(2025, 1, 10), type: 'buy', quantity: 50 }),
        ],
        []
      );

      expect(positions[0].acquisitionDate).toEqual(firstBuyDate);
    });
  });

  describe('processAssets - special events', () => {
    it('Bonificação with a factor multiplies quantity and keeps totalCost unchanged', async () => {
      const processor = new AssetProcessor(buildMockProvider());
      const positions = await processor.processAssets(
        [buildTransaction({ date: new Date(2025, 0, 1), type: 'buy', quantity: 100, unitPrice: 10, totalValue: 1000 })],
        [
          buildMappedEvent('Bonificação em Ativos', SpecialEventType.STOCK_DIVIDEND, {
            date: new Date(2025, 1, 1),
            factor: 2,
          }),
        ]
      );

      expect(positions[0].quantity).toBe(200);
      expect(positions[0].totalCost).toBe(1000);
    });

    it('Bonificação without a factor adds the event quantity directly', async () => {
      const processor = new AssetProcessor(buildMockProvider());
      const positions = await processor.processAssets(
        [buildTransaction({ date: new Date(2025, 0, 1), type: 'buy', quantity: 100 })],
        [
          buildMappedEvent('Bonificação em Ativos', SpecialEventType.STOCK_DIVIDEND, {
            date: new Date(2025, 1, 1),
            quantity: 15,
          }),
        ]
      );

      expect(positions[0].quantity).toBe(115);
    });

    it('Desdobramento (split) multiplies quantity/baseQuantity and recalculates averagePrice', async () => {
      const processor = new AssetProcessor(buildMockProvider());
      const positions = await processor.processAssets(
        [buildTransaction({ date: new Date(2025, 0, 1), type: 'buy', quantity: 100, unitPrice: 10, totalValue: 1000 })],
        [
          buildMappedEvent('Desdobramento', SpecialEventType.STOCK_SPLIT, {
            date: new Date(2025, 1, 1),
            factor: 10,
          }),
        ]
      );

      expect(positions[0]).toMatchObject({ quantity: 1000, baseQuantity: 1000, totalCost: 1000, averagePrice: 1 });
    });

    it('Desdobramento without a factor fetches it from the external event provider', async () => {
      const provider = buildMockProvider({ getEventFactor: jest.fn().mockResolvedValue(4) });
      const processor = new AssetProcessor(provider);
      const positions = await processor.processAssets(
        [buildTransaction({ date: new Date(2025, 0, 1), type: 'buy', quantity: 100 })],
        [
          buildMappedEvent('Desdobramento', SpecialEventType.STOCK_SPLIT, {
            date: new Date(2025, 1, 1),
          }),
        ]
      );

      expect(positions[0].quantity).toBe(400);
      expect(provider.getEventFactor).toHaveBeenCalledWith(
        'PETR4',
        SpecialEventType.STOCK_SPLIT,
        expect.any(Date)
      );
    });

    it('Grupamento (reverse split) divides quantity/baseQuantity and recalculates averagePrice', async () => {
      const processor = new AssetProcessor(buildMockProvider());
      const positions = await processor.processAssets(
        [buildTransaction({ date: new Date(2025, 0, 1), type: 'buy', quantity: 1000, unitPrice: 1, totalValue: 1000 })],
        [
          buildEvent({
            date: new Date(2025, 1, 1),
            type: 'Grupamento' as unknown as SpecialEventType,
            originalType: 'Grupamento',
            factor: 10,
          }),
        ]
      );

      expect(positions[0]).toMatchObject({ quantity: 100, baseQuantity: 100, totalCost: 1000, averagePrice: 10 });
    });

    it('Fração em Ativos removes quantity proportionally, keeping averagePrice stable', async () => {
      const processor = new AssetProcessor(buildMockProvider());
      const positions = await processor.processAssets(
        [buildTransaction({ date: new Date(2025, 0, 1), type: 'buy', quantity: 100, unitPrice: 10, totalValue: 1000 })],
        [
          buildMappedEvent('Fração em Ativos', SpecialEventType.OTHER, {
            date: new Date(2025, 1, 1),
            quantity: 0.4,
          }),
        ]
      );

      expect(positions[0].quantity).toBeCloseTo(99.6, 4);
      expect(positions[0].averagePrice).toBeCloseTo(10, 4);
    });

    it('Fração em Ativos larger than the available quantity zeroes the position', async () => {
      const processor = new AssetProcessor(buildMockProvider());
      const positions = await processor.processAssets(
        [buildTransaction({ date: new Date(2025, 0, 1), type: 'buy', quantity: 10, unitPrice: 10 })],
        [
          buildMappedEvent('Fração em Ativos', SpecialEventType.OTHER, {
            date: new Date(2025, 1, 1),
            quantity: 50,
          }),
        ]
      );

      expect(positions[0]).toMatchObject({ quantity: 0, totalCost: 0, averagePrice: 0 });
    });

    it('Direito de Subscrição with a known price > 0 adds quantity and proportional cost, even without a prior position', async () => {
      const provider = buildMockProvider({
        getSpecialEventAveragePrice: jest.fn().mockResolvedValue(15),
      });
      const processor = new AssetProcessor(provider);
      const positions = await processor.processAssets(
        [],
        [
          buildMappedEvent('Direito de Subscrição', SpecialEventType.OTHER, {
            date: new Date(2025, 1, 1),
            quantity: 50,
          }),
        ]
      );

      expect(positions).toHaveLength(1);
      expect(positions[0]).toMatchObject({ quantity: 50, baseQuantity: 50, totalCost: 750, averagePrice: 15 });
    });

    it('Atualização with price = 0 adds quantity without cost, like a bonus', async () => {
      const provider = buildMockProvider({
        getSpecialEventAveragePrice: jest.fn().mockResolvedValue(0),
      });
      const processor = new AssetProcessor(provider);
      const positions = await processor.processAssets(
        [buildTransaction({ date: new Date(2025, 0, 1), type: 'buy', quantity: 100, unitPrice: 10, totalValue: 1000 })],
        [
          buildMappedEvent('Atualização', SpecialEventType.OTHER, {
            date: new Date(2025, 1, 1),
            quantity: 20,
          }),
        ]
      );

      expect(positions[0].quantity).toBe(120);
      expect(positions[0].totalCost).toBe(1000);
      expect(positions[0].averagePrice).toBeCloseTo(1000 / 120, 4);
    });

    it('ignores an event for an asset with no position when the event does not increase quantity', async () => {
      const processor = new AssetProcessor(buildMockProvider());
      const positions = await processor.processAssets(
        [],
        [
          buildEvent({
            date: new Date(2025, 1, 1),
            type: SpecialEventType.OTHER,
            originalType: 'Fração em Ativos',
            quantity: 5,
          }),
        ]
      );

      expect(positions).toHaveLength(0);
    });

    it('tracks previousYearValue as the quantity at the end of the previous year', async () => {
      const processor = new AssetProcessor(buildMockProvider());
      const positions = await processor.processAssets(
        [
          buildTransaction({ date: new Date(2024, 5, 1), type: 'buy', quantity: 100 }),
          buildTransaction({ date: new Date(2025, 2, 1), type: 'buy', quantity: 50 }),
        ],
        []
      );

      expect(positions[0].quantity).toBe(150);
      expect(positions[0].previousYearValue).toBe(100);
    });
  });

  describe('extractIncomeRecords', () => {
    it('maps Dividendo events to "Dividendos" income records', async () => {
      const processor = new AssetProcessor(buildMockProvider());
      const records = await processor.extractIncomeRecords([
        { ...buildEvent({ type: SpecialEventType.DIVIDEND, totalValue: 123.45 }), _originalStringType: 'Dividendos' } as any,
      ]);

      expect(records).toHaveLength(1);
      expect(records[0]).toMatchObject({ incomeType: 'Dividendos', grossValue: 123.45 });
    });

    it('maps JCP events to "Juros sobre Capital Próprio" income records', async () => {
      const processor = new AssetProcessor(buildMockProvider());
      const records = await processor.extractIncomeRecords([
        {
          ...buildEvent({ type: SpecialEventType.JCP, totalValue: 50 }),
          _originalStringType: 'Juros sobre Capital Próprio',
        } as any,
      ]);

      expect(records[0].incomeType).toBe('Juros sobre Capital Próprio');
    });

    it('maps Rendimento events to "Rendimentos" income records', async () => {
      const processor = new AssetProcessor(buildMockProvider());
      const records = await processor.extractIncomeRecords([
        { ...buildEvent({ type: SpecialEventType.INCOME, totalValue: 10 }), _originalStringType: 'Rendimento' } as any,
      ]);

      expect(records[0].incomeType).toBe('Rendimentos');
    });

    it('excludes events that are not an income type', async () => {
      const processor = new AssetProcessor(buildMockProvider());
      const records = await processor.extractIncomeRecords([
        { ...buildEvent({ type: SpecialEventType.STOCK_SPLIT }), _originalStringType: 'Desdobramento' } as any,
      ]);

      expect(records).toHaveLength(0);
    });

    it('falls back to a zeroed record when totalValue is NaN', async () => {
      const processor = new AssetProcessor(buildMockProvider());
      const records = await processor.extractIncomeRecords([
        {
          ...buildEvent({ type: SpecialEventType.DIVIDEND, totalValue: NaN }),
          _originalStringType: 'Dividendos',
        } as any,
      ]);

      expect(records[0]).toMatchObject({ grossValue: 0, netValue: 0 });
    });

    it('sorts income records by date ascending', async () => {
      const processor = new AssetProcessor(buildMockProvider());
      const records = await processor.extractIncomeRecords([
        {
          ...buildEvent({ date: new Date(2025, 5, 1), type: SpecialEventType.DIVIDEND }),
          _originalStringType: 'Dividendos',
        } as any,
        {
          ...buildEvent({ date: new Date(2025, 0, 1), type: SpecialEventType.DIVIDEND }),
          _originalStringType: 'Dividendos',
        } as any,
      ]);

      expect(records[0].date).toEqual(new Date(2025, 0, 1));
      expect(records[1].date).toEqual(new Date(2025, 5, 1));
    });
  });

  describe('calculateTradeResults', () => {
    it('matches a sale against buys using FIFO across multiple purchase lots', async () => {
      const processor = new AssetProcessor(buildMockProvider());
      const position = buildPosition({
        transactionsHistory: [
          buildHistoryEntry({ date: new Date(2025, 0, 1), type: 'buy', quantity: 100, netValue: 1000 }),
          buildHistoryEntry({ date: new Date(2025, 1, 1), type: 'buy', quantity: 100, netValue: 2500 }),
          buildHistoryEntry({ date: new Date(2025, 2, 1), type: 'sell', quantity: 150, netValue: 3000 }),
        ],
      });

      const results = await processor.calculateTradeResults([position], 2025);

      expect(results).toHaveLength(1);
      // FIFO cost: 100 units @ (1000/100) + 50 units @ (2500/100) = 1000 + 1250 = 2250
      expect(results[0].purchaseCost).toBeCloseTo(2250, 2);
      expect(results[0].profitOrLoss).toBeCloseTo(3000 - 2250, 2);
    });

    it('excludes sales outside the selected year', async () => {
      const processor = new AssetProcessor(buildMockProvider());
      const position = buildPosition({
        transactionsHistory: [
          buildHistoryEntry({ date: new Date(2025, 0, 1), type: 'buy', quantity: 100, netValue: 1000 }),
          buildHistoryEntry({ date: new Date(2025, 1, 1), type: 'sell', quantity: 50, netValue: 600 }),
          buildHistoryEntry({ date: new Date(2026, 1, 1), type: 'sell', quantity: 50, netValue: 700 }),
        ],
      });

      const results = await processor.calculateTradeResults([position], 2025);

      expect(results).toHaveLength(1);
      expect(results[0].date).toEqual(new Date(2025, 1, 1));
    });

    it('returns an empty array when there is no transaction history in the selected year', async () => {
      const processor = new AssetProcessor(buildMockProvider());
      const position = buildPosition({
        transactionsHistory: [
          buildHistoryEntry({ date: new Date(2024, 0, 1), type: 'buy', quantity: 100, netValue: 1000 }),
        ],
      });

      const results = await processor.calculateTradeResults([position], 2025);

      expect(results).toEqual([]);
    });

    it('falls back to the position average price when a sale has no matching FIFO buy history', async () => {
      const processor = new AssetProcessor(buildMockProvider());
      const position = buildPosition({
        averagePrice: 12,
        transactionsHistory: [
          buildHistoryEntry({ date: new Date(2025, 0, 1), type: 'sell', quantity: 10, netValue: 150 }),
        ],
      });

      const results = await processor.calculateTradeResults([position], 2025);

      expect(results[0].purchaseCost).toBeCloseTo(120, 2); // 10 * 12 fallback
      expect(results[0].profitOrLoss).toBeCloseTo(150 - 120, 2);
    });
  });

  describe('calculateMonthlyResults', () => {
    it('computes netResult and taxDue for a profitable, non-exempt month', async () => {
      const processor = new AssetProcessor(buildMockProvider());
      const results = await processor.calculateMonthlyResults(
        [
          {
            assetCode: 'PETR4',
            assetName: 'Petrobras',
            assetCategory: AssetCategory.STOCK,
            marketType: MarketType.SPOT,
            date: new Date(2025, 2, 1),
            month: 3,
            year: 2025,
            quantity: 1000,
            purchasePrice: 20,
            purchaseCost: 20000,
            salePrice: 25,
            saleValue: 25000, // above the R$20k exemption threshold
            fees: 0,
            taxes: 0,
            profitOrLoss: 5000,
            isExempt: false,
          },
        ],
        2025
      );

      expect(results).toHaveLength(1);
      expect(results[0].netResult).toBe(5000);
      expect(results[0].taxableProfit).toBe(5000);
      expect(results[0].taxDue).toBeCloseTo(5000 * 0.15, 2);
    });

    it('exempts STOCK sales from tax when monthly sales are at or below R$20,000', async () => {
      const processor = new AssetProcessor(buildMockProvider());
      const results = await processor.calculateMonthlyResults(
        [
          {
            assetCode: 'PETR4',
            assetName: 'Petrobras',
            assetCategory: AssetCategory.STOCK,
            marketType: MarketType.SPOT,
            date: new Date(2025, 2, 1),
            month: 3,
            year: 2025,
            quantity: 100,
            purchasePrice: 10,
            purchaseCost: 1000,
            salePrice: 15,
            saleValue: 1500, // below the exemption threshold
            fees: 0,
            taxes: 0,
            profitOrLoss: 500,
            isExempt: false,
          },
        ],
        2025
      );

      expect(results[0].taxDue).toBe(0);
    });

    it('carries losses forward and compensates them against later profits in the same category', async () => {
      const processor = new AssetProcessor(buildMockProvider());
      const results = await processor.calculateMonthlyResults(
        [
          {
            assetCode: 'PETR4',
            assetName: 'Petrobras',
            assetCategory: AssetCategory.STOCK,
            marketType: MarketType.SPOT,
            date: new Date(2025, 0, 1),
            month: 1,
            year: 2025,
            quantity: 1000,
            purchasePrice: 30,
            purchaseCost: 30000,
            salePrice: 25,
            saleValue: 25000,
            fees: 0,
            taxes: 0,
            profitOrLoss: -5000,
            isExempt: false,
          },
          {
            assetCode: 'PETR4',
            assetName: 'Petrobras',
            assetCategory: AssetCategory.STOCK,
            marketType: MarketType.SPOT,
            date: new Date(2025, 1, 1),
            month: 2,
            year: 2025,
            quantity: 1000,
            purchasePrice: 20,
            purchaseCost: 20000,
            salePrice: 23,
            saleValue: 23000,
            fees: 0,
            taxes: 0,
            profitOrLoss: 3000,
            isExempt: false,
          },
        ],
        2025
      );

      expect(results[0].remainingLoss).toBe(5000);
      expect(results[1].compensatedLoss).toBe(3000);
      expect(results[1].taxableProfit).toBe(0);
      expect(results[1].remainingLoss).toBe(2000);
    });

    it('applies the 20% FII tax rate without the R$20,000 exemption', async () => {
      const processor = new AssetProcessor(buildMockProvider());
      const results = await processor.calculateMonthlyResults(
        [
          {
            assetCode: 'BCFF11',
            assetName: 'BTG FII',
            assetCategory: AssetCategory.FII,
            marketType: MarketType.SPOT,
            date: new Date(2025, 2, 1),
            month: 3,
            year: 2025,
            quantity: 100,
            purchasePrice: 10,
            purchaseCost: 1000,
            salePrice: 15,
            saleValue: 1500, // well below R$20k, but FIIs have no such exemption
            fees: 0,
            taxes: 0,
            profitOrLoss: 500,
            isExempt: false,
          },
        ],
        2025
      );

      expect(results[0].taxRate).toBe(0.2);
      expect(results[0].taxDue).toBeCloseTo(100, 2);
    });

    it('returns an empty array when no trades fall in the selected year', async () => {
      const processor = new AssetProcessor(buildMockProvider());
      const results = await processor.calculateMonthlyResults(
        [
          {
            assetCode: 'PETR4',
            assetName: 'Petrobras',
            assetCategory: AssetCategory.STOCK,
            marketType: MarketType.SPOT,
            date: new Date(2024, 2, 1),
            month: 3,
            year: 2024,
            quantity: 100,
            purchasePrice: 10,
            purchaseCost: 1000,
            salePrice: 15,
            saleValue: 1500,
            fees: 0,
            taxes: 0,
            profitOrLoss: 500,
            isExempt: false,
          },
        ],
        2025
      );

      expect(results).toEqual([]);
    });
  });

  describe('validateData', () => {
    it('flags duplicate transactions', async () => {
      const processor = new AssetProcessor(buildMockProvider());
      const tx = buildTransaction({ fileName: 'a.xlsx', rowNumber: 2 });
      const duplicate = buildTransaction({ fileName: 'a.xlsx', rowNumber: 3 });

      const inconsistencies = await processor.validateData([tx, duplicate], []);

      expect(inconsistencies).toContainEqual(
        expect.objectContaining({ type: 'warning', message: 'Transação duplicada detectada' })
      );
    });

    it('does not flag non-duplicate transactions for the same asset/date', async () => {
      const processor = new AssetProcessor(buildMockProvider());
      const tx = buildTransaction({ quantity: 100 });
      const different = buildTransaction({ quantity: 200 });

      const inconsistencies = await processor.validateData([tx, different], []);

      expect(inconsistencies).not.toContainEqual(
        expect.objectContaining({ message: 'Transação duplicada detectada' })
      );
    });

    it('flags a transaction with zero or negative quantity', async () => {
      const processor = new AssetProcessor(buildMockProvider());
      const inconsistencies = await processor.validateData([buildTransaction({ quantity: 0 })], []);

      expect(inconsistencies).toContainEqual(
        expect.objectContaining({ type: 'error', message: 'Quantidade inválida na transação' })
      );
    });

    it('flags an invalid transaction date', async () => {
      const processor = new AssetProcessor(buildMockProvider());
      const inconsistencies = await processor.validateData(
        [buildTransaction({ date: new Date('invalid') })],
        []
      );

      expect(inconsistencies).toContainEqual(
        expect.objectContaining({ type: 'error', message: 'Data inválida na transação' })
      );
    });

    it('flags a future transaction date', async () => {
      const processor = new AssetProcessor(buildMockProvider());
      const farFuture = new Date();
      farFuture.setFullYear(farFuture.getFullYear() + 5);

      const inconsistencies = await processor.validateData([buildTransaction({ date: farFuture })], []);

      expect(inconsistencies).toContainEqual(
        expect.objectContaining({ type: 'warning', message: 'Data futura na transação' })
      );
    });

    it('flags a transaction with a missing asset code', async () => {
      const processor = new AssetProcessor(buildMockProvider());
      const inconsistencies = await processor.validateData([buildTransaction({ assetCode: '' })], []);

      expect(inconsistencies).toContainEqual(
        expect.objectContaining({ type: 'error', message: 'Código do ativo ausente na transação' })
      );
    });

    it('flags an event with a missing asset code', async () => {
      const processor = new AssetProcessor(buildMockProvider());
      const inconsistencies = await processor.validateData([], [{ ...buildEvent({ assetCode: '' }) } as any]);

      expect(inconsistencies).toContainEqual(
        expect.objectContaining({ type: 'error', message: 'Código do ativo ausente no evento' })
      );
    });

    it('flags a negative balance when selling more than was bought', async () => {
      const processor = new AssetProcessor(buildMockProvider());
      const inconsistencies = await processor.validateData(
        [
          buildTransaction({ date: new Date(2025, 0, 1), type: 'buy', quantity: 100 }),
          buildTransaction({ date: new Date(2025, 1, 1), type: 'sell', quantity: 150 }),
        ],
        []
      );

      expect(inconsistencies).toContainEqual(
        expect.objectContaining({ type: 'warning', message: 'Saldo negativo detectado durante a validação' })
      );
    });

    it('does not flag a negative balance for a sale within the available quantity', async () => {
      const processor = new AssetProcessor(buildMockProvider());
      const inconsistencies = await processor.validateData(
        [
          buildTransaction({ date: new Date(2025, 0, 1), type: 'buy', quantity: 100 }),
          buildTransaction({ date: new Date(2025, 1, 1), type: 'sell', quantity: 50 }),
        ],
        []
      );

      expect(inconsistencies).not.toContainEqual(
        expect.objectContaining({ message: 'Saldo negativo detectado durante a validação' })
      );
    });
  });

  describe('analyzeTransactionsAndSpecialEvents', () => {
    it('filters transactions/events to the selected year when includeInitialPosition is false', async () => {
      const processor = new AssetProcessor(buildMockProvider());
      const summary = await processor.analyzeTransactionsAndSpecialEvents(
        [
          buildTransaction({ date: new Date(2024, 0, 1), type: 'buy', quantity: 100 }),
          buildTransaction({ date: new Date(2025, 0, 1), type: 'buy', quantity: 50 }),
        ],
        [],
        2025,
        false
      );

      // Only the 2025 buy should count: quantity 50, not 150.
      expect(summary.assetPositions[0].quantity).toBe(50);
    });

    it('injects missing events reported by the external event provider', async () => {
      const injectedDate = new Date(2025, 3, 1);
      const provider = buildMockProvider({
        getEventsForAsset: jest.fn().mockResolvedValue([
          {
            ...buildEvent({ date: injectedDate, type: 'Desdobramento', factor: 2 }),
          },
        ]),
      });
      const processor = new AssetProcessor(provider);

      const summary = await processor.analyzeTransactionsAndSpecialEvents(
        [buildTransaction({ date: new Date(2025, 0, 1), type: 'buy', quantity: 100 })],
        [],
        2025,
        true
      );

      expect(summary.assetPositions[0].quantity).toBe(200);
    });

    it('does not duplicate an externally-reported event that already exists in the B3 data within a 5-day window', async () => {
      const b3EventDate = new Date(2025, 3, 1);
      const provider = buildMockProvider({
        getEventsForAsset: jest.fn().mockResolvedValue([
          { ...buildEvent({ date: new Date(2025, 3, 3), type: 'Desdobramento', factor: 2 }) },
        ]),
      });
      const processor = new AssetProcessor(provider);

      const summary = await processor.analyzeTransactionsAndSpecialEvents(
        [buildTransaction({ date: new Date(2025, 0, 1), type: 'buy', quantity: 100 })],
        [
          buildEvent({
            date: b3EventDate,
            type: 'Desdobramento' as unknown as SpecialEventType,
            originalType: 'Desdobramento',
            factor: 2,
          }),
        ],
        2025,
        true
      );

      // Factor 2 applied only once: 100 -> 200, not 400.
      expect(summary.assetPositions[0].quantity).toBe(200);
    });

    it('returns a complete summary with positions, income records and monthly results', async () => {
      const processor = new AssetProcessor(buildMockProvider());
      const summary = await processor.analyzeTransactionsAndSpecialEvents(
        [
          buildTransaction({ date: new Date(2025, 0, 1), type: 'buy', quantity: 100, unitPrice: 10, totalValue: 1000, netValue: 1000 }),
          buildTransaction({ date: new Date(2025, 5, 1), type: 'sell', quantity: 100, unitPrice: 15, totalValue: 1500, netValue: 1500 }),
        ],
        [
          {
            ...buildEvent({ date: new Date(2025, 2, 1), type: SpecialEventType.DIVIDEND, totalValue: 80 }),
            _originalStringType: 'Dividendos',
          } as any,
        ],
        2025,
        true
      );

      expect(summary.incomeRecords).toHaveLength(1);
      expect(summary.monthlyResults.length).toBeGreaterThan(0);
      // Fully sold (quantity 0), but still returned: processAssets keeps positions with history.
      expect(summary.assetPositions).toHaveLength(1);
      expect(summary.assetPositions[0].quantity).toBe(0);
    });
  });
});
