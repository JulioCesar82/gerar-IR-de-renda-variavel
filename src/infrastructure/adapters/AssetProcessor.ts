import { AssetProcessorPort } from '../../core/interfaces/AssetProcessorPort';
import { ExternalEventInfoProviderPort } from '../../core/interfaces/ExternalEventInfoProviderPort';
import { Transaction, AssetCategory /*, MarketType */ } from '../../core/domain/Transaction';
import { SpecialEvent, SpecialEventType } from '../../core/domain/SpecialEvent';
import {
  AssetPosition,
  TradeResult,
  MonthlyResult,
  IncomeRecord,
  ProcessedDataSummary,
  Inconsistency
} from '../../core/domain/AssetPosition';
import { getAssetKey } from '../../utils/formatters';

// Define a type for the mapped event, ensuring type can be string or enum
type MappedSpecialEvent = SpecialEvent & {
  type: SpecialEventType | string;
  _originalStringType?: string;
};

// Define a type for the combined timeline items
type TimelineItem =
  | (Transaction & { _timelineType: 'transaction' })
  | (MappedSpecialEvent & { _timelineType: 'event' });

/**
 * Implementation of the AssetProcessorPort interface
 */
export class AssetProcessor implements AssetProcessorPort {
  constructor(private externalEventInfoProvider: ExternalEventInfoProviderPort) {}

  private mapEventType(eventType: SpecialEventType | string): SpecialEventType | string {
    if (typeof eventType === 'string') {
      const normalized = eventType.trim();
      // Resiliente a codificações UTF-8 (çã)
      if (normalized === 'Bonificação em Ativos' || normalized === 'Bonificação em ações' || normalized.includes('Bonifica')) {
        return SpecialEventType.STOCK_DIVIDEND;
      }
      if (normalized === 'Desdobramento' || normalized === 'Desdobro') {
        return SpecialEventType.STOCK_SPLIT;
      }
      if (normalized === 'Grupamento') {
        return SpecialEventType.REVERSE_SPLIT;
      }
      if (normalized === 'Fração em Ativos' || normalized.includes('Fra')) {
        return SpecialEventType.OTHER; // Tratado no case OTHER com o originalStringType
      }
      if (normalized === 'Atualização') {
        return SpecialEventType.OTHER;
      }
      // ... rest of mappings
      switch (normalized) {
        case 'Dividendos':
          return SpecialEventType.DIVIDEND;
        case 'Juros sobre Capital Próprio':
        case 'Juros Sobre Capital Próprio':
          return SpecialEventType.JCP;
        case 'Rendimento':
          return SpecialEventType.INCOME;
        default:
          return normalized;
      }
    }
    return eventType;
  }

  // --- Helper method to map event types ---
  private mapEventTypeToIncomeType(
    eventType: SpecialEventType | string,
    originalStringType?: string
  ): string {
    // Prioritize mapped enum type first
    if (typeof eventType !== 'string') {
      // It's an enum value
      switch (eventType) {
        case SpecialEventType.DIVIDEND:
          return 'Dividendos';
        case SpecialEventType.JCP:
          return 'Juros sobre Capital Próprio';
        case SpecialEventType.INCOME:
          return 'Rendimentos';
      }
    }
    // Fallback to checking original string type
    if (originalStringType) {
      switch (originalStringType) {
        case 'Dividendos':
          return 'Dividendos';
        case 'Juros sobre Capital Próprio':
          return 'Juros sobre Capital Próprio';
        case 'Rendimento':
          return 'Rendimentos';
      }
    }
    // Final fallback if neither matched
    if (typeof eventType === 'string') {
      return eventType;
    } else {
      // Safely access enum name - check if it's a valid enum key
      const enumName = Object.keys(SpecialEventType).find(
        key => SpecialEventType[key as keyof typeof SpecialEventType] === eventType
      );
      return `Enum(${enumName || eventType})`;
    }
  }

  async analyzeTransactionsAndSpecialEvents(
    transactions: Transaction[],
    specialEvents: SpecialEvent[],
    selectedYear: number,
    includeInitialPosition: boolean
  ): Promise<ProcessedDataSummary> {
    console.log(`AssetProcessor: Data loaded with ${transactions.length} transactions and ${specialEvents.length} special events`);

    // Map event types consistently upfront
    const mappedSpecialEvents: MappedSpecialEvent[] = specialEvents.map(e => {
      // Prioritize using originalType if provided by the parser
      const originalStringType = e.originalType || (typeof e.type === 'string' ? e.type : undefined);
      const mappedType = this.mapEventType(e.type || originalStringType);
      return {
        ...e,
        type: mappedType,
        _originalStringType: originalStringType,
      } as MappedSpecialEvent;
    });

    // --- Inject missing events from external provider ---
    // Identify all unique assets in the transactions
    const uniqueAssets = new Set<string>();
    transactions.forEach(t => uniqueAssets.add(getAssetKey(t.assetCode)));

    console.log(`AssetProcessor: Checking for missing events for ${uniqueAssets.size} unique assets`);

    for (const assetCode of uniqueAssets) {
      // Fetch known events for this asset from the provider
      const externalEvents = await this.externalEventInfoProvider.getEventsForAsset(assetCode);

      for (const extEvent of externalEvents) {
        const mappedExtType = this.mapEventType(extEvent.type);

        // Check if this event already exists in the B3 data
        // Use a window of ±5 days to avoid duplicates if dates are slightly different
        const alreadyExists = mappedSpecialEvents.some(
          e =>
            getAssetKey(e.assetCode) === assetCode &&
            e.type === mappedExtType &&
            Math.abs(e.date.getTime() - extEvent.date.getTime()) <= 5 * 24 * 60 * 60 * 1000
        );

        if (!alreadyExists) {
          console.log(
            `AssetProcessor: Injecting missing ${extEvent.type} for ${assetCode} on ${extEvent.date.toLocaleDateString()}`
          );
          mappedSpecialEvents.push({
            ...extEvent,
            type: mappedExtType,
            _originalStringType: typeof extEvent.type === 'string' ? extEvent.type : undefined
          } as MappedSpecialEvent);
        }
      }
    }

    let filteredTransactions = transactions;
    let filteredMappedSpecialEvents = mappedSpecialEvents;

    if (!includeInitialPosition) {
      filteredTransactions = transactions.filter(
        transaction => transaction.date && transaction.date.getFullYear() == selectedYear
      );
      filteredMappedSpecialEvents = mappedSpecialEvents.filter(
        specialEvent => specialEvent.date && specialEvent.date.getFullYear() == selectedYear
      );

      console.log(`AssetProcessor: Filtered session data loaded with ${filteredTransactions.length} transactions and ${filteredMappedSpecialEvents.length} special events in the selected year`);
    }

    // Filter data up to the end of selectedYear for position calculation
    const transactionsForPosition = filteredTransactions.filter(
      t => t.date && t.date.getFullYear() <= selectedYear
    );
    const specialEventsForPosition = filteredMappedSpecialEvents.filter(
      e => e.date && e.date.getFullYear() <= selectedYear
    );

    // Process assets up to the end of selectedYear
    console.log(`AssetProcessor: Processing assets up to end of ${selectedYear}`);
    const assetPositions = await this.processAssets(
      transactionsForPosition,
      specialEventsForPosition // Pass mapped events for position calculation
      /*sessionData.initialPositions*/ // TODO: Rever se isso eh importante
    );
    console.log(`AssetProcessor: Processed ${assetPositions.length} asset positions for end of ${selectedYear}`);

    // Calculate trade results (uses original, potentially unfiltered, transactions/events history within positions)
    console.log(`AssetProcessor: Calculating trade results`);
    const tradeResults = await this.calculateTradeResults(
      assetPositions, // Positions contain the history needed
      selectedYear // Pass the selected year
    );

    console.log(`AssetProcessor: Calculated ${tradeResults.length} trade results`);

    // Calculate monthly results
    console.log(`AssetProcessor: Calculating monthly results for year ${selectedYear}`);
    const monthlyResults = await this.calculateMonthlyResults(
      tradeResults,
      selectedYear // Pass the selected year
    );
    console.log(`AssetProcessor: Calculated ${monthlyResults.length} monthly results`);
    console.log(`AssetProcessor: Monthly results:`, monthlyResults);

    // Extract income records using the initially mapped events
    console.log(`AssetProcessor: Extracting income records`);
    const incomeRecords = await this.extractIncomeRecords(
      mappedSpecialEvents // Use the mapped events from the start
    );
    console.log(`AssetProcessor: Extracted ${incomeRecords.length} income records`);

    // Perform validation using consistently mapped events
    // const inconsistencies = await this.validateData(transactions, mappedSpecialEvents);
    // console.log(`AssetProcessor: Validation found ${inconsistencies.length} inconsistencies.`);

    return {
      assetPositions,
      incomeRecords,
      //tradeResults,
      monthlyResults
      //inconsistencies // Include inconsistencies in the summary
    };
  }

  /**
   * Process transactions and special events to calculate asset positions
   */
  async processAssets(
    transactions: Transaction[],
    mappedSpecialEvents: MappedSpecialEvent[], // Accept mapped events
    initialPositions?: AssetPosition[]
  ): Promise<AssetPosition[]> {
    try {
      // Get the year from the most recent transaction or event
      const allDates = [
        ...transactions.map(t => t.date),
        ...mappedSpecialEvents.map(e => e.date)
      ].filter(date => date instanceof Date);
      
      const currentYear = allDates.length > 0 
        ? Math.max(...allDates.map(date => date.getFullYear())) 
        : new Date().getFullYear();
      
      const previousYear = currentYear - 1;

      // Combine transactions and mapped special events into a single timeline
      const timeline: TimelineItem[] = [
        ...transactions.map(t => ({ ...t, _timelineType: 'transaction' as const })),
        // Use mappedSpecialEvents passed as parameter
        ...mappedSpecialEvents.map(e => ({ ...e, _timelineType: 'event' as const }))
      ];

      // Sort the combined timeline chronologically
      timeline.sort((a, b) => {
        const dateComparison = a.date.getTime() - b.date.getTime();
        if (dateComparison !== 0) return dateComparison;
        // Prioritize transactions over events when dates are equal
        if (a._timelineType === 'transaction' && b._timelineType === 'event') {
          return -1;
        } else if (a._timelineType === 'event' && b._timelineType === 'transaction') {
          return 1;
        }
        return 0;
      });

      // Initialize positions map
      const positionsMap = new Map<string, AssetPosition>();
      if (initialPositions) {
        for (const position of initialPositions) {
          const key = getAssetKey(position.assetCode);
          positionsMap.set(key, position);
        }
      } else {
        console.warn("No initial positions provided. Starting calculations from zero.");
      }

      // Create a map to track positions at the end of the previous year
      const previousYearPositions = new Map<string, number>();

      // Process the combined timeline
      for (const item of timeline) {
        // Check if this item is from the previous year or earlier
        const itemYear = item.date.getFullYear();
        const key = getAssetKey(item.assetCode);
        
        // Process the item
        if (item._timelineType === 'transaction') {
          await this.processTransaction(item as Transaction, positionsMap);
        } else if (item._timelineType === 'event') {
          // Pass the mapped event (which includes _originalStringType)
          await this.processSpecialEvent(
            item as MappedSpecialEvent & { _timelineType: 'event' },
            positionsMap
          );
        }
        
        // If we're at the end of the previous year, store the position
        if (itemYear <= previousYear) {
          const position = positionsMap.get(key);
          if (position) {
            previousYearPositions.set(key, position.quantity);
          }
        }
      }

      // Set the previousYearValue for each position
      for (const [key, position] of positionsMap.entries()) {
        position.previousYearValue = previousYearPositions.get(key) || 0;
      }

      // Filter out zeroed positions
      const finalPositions = Array.from(positionsMap.values()).filter(
        p => p.quantity > 0.0001 || p.transactionsHistory?.length > 0
      );
      return finalPositions;
    } catch (error) {
      console.error('Error processing assets:', error);
      throw error;
    }
  }

  /**
   * Extract income records from special events
   */
  async extractIncomeRecords(
    mappedSpecialEvents: MappedSpecialEvent[] // Accept mapped events
  ): Promise<IncomeRecord[]> {
    try {
      const incomeRecords: IncomeRecord[] = [];
      // Filter based on the mapped type or original string type
      const incomeEvents = mappedSpecialEvents.filter(
        e =>
          e.type === SpecialEventType.DIVIDEND ||
          e.type === SpecialEventType.JCP ||
          e.type === SpecialEventType.INCOME ||
          e._originalStringType === 'Dividendos' ||
          e._originalStringType === 'Juros sobre Capital Próprio' ||
          e._originalStringType === 'Rendimento'
      );

      for (const event of incomeEvents) {
        // Pass both mapped type and original string to helper
        const incomeType = this.mapEventTypeToIncomeType(event.type, event._originalStringType);
        const grossValue = event.totalValue ?? 0; // Use nullish coalescing

        if (isNaN(grossValue)) {
          console.error(`NaN detected for grossValue in income record:`, event);
          // Handle NaN case, perhaps push a record with 0 value or log differently
          incomeRecords.push({
            assetCode: event.assetCode,
            assetName: event.assetName,
            assetCategory: event.assetCategory,
            incomeType,
            date: event.date,
            month: event.month,
            year: event.year,
            grossValue: 0,
            taxWithheld: event.taxes,
            netValue: 0, // Use 0 for values
            brokerName: event.brokerName,
            brokerCode: event.brokerCode,
            cnpj: undefined,
            sourceName: event.assetName,
            status: (event as any).status
          });
        } else {
          incomeRecords.push({
            assetCode: event.assetCode,
            assetName: event.assetName,
            assetCategory: event.assetCategory,
            incomeType,
            date: event.date,
            month: event.month,
            year: event.year,
            grossValue: grossValue,
            taxWithheld: event.taxes,
            netValue: event.netValue,
            brokerName: event.brokerName,
            brokerCode: event.brokerCode,
            cnpj: undefined,
            sourceName: event.assetName,
            status: (event as any).status
          });
        }
      }

      return incomeRecords.sort((a, b) => a.date.getTime() - b.date.getTime());
    } catch (error) {
      console.error('Error extracting income records:', error);
      throw error;
    }
  }

  /**
   * Process a transaction
   */
  private async processTransaction(
    transaction: Transaction,
    positionsMap: Map<string, AssetPosition>
  ): Promise<void> {
    const key = getAssetKey(transaction.assetCode);
    let position = positionsMap.get(key);

    if (!position) {
      position = {
        assetCode: transaction.assetCode,
        assetName: transaction.assetName,
        assetCategory: transaction.assetCategory,
        marketType: transaction.marketType,
        quantity: 0,
        baseQuantity: 0, // Memória base para o PM
        averagePrice: 0,
        totalCost: 0,
        acquisitionDate: transaction.date,
        lastUpdateDate: transaction.date,
        brokerName: transaction.brokerName,
        brokerCode: transaction.brokerCode,
        transactionsHistory: [],
        cnpj: undefined
      };

      positionsMap.set(key, position);
    }

    if (transaction.type === 'buy') {
      // Add debug log before processing buy transaction
      console.log(`[DEBUG] Before buy: ${position.assetCode}, Qtd=${position.quantity.toFixed(4)}, TotalCost=${position.totalCost.toFixed(4)}, AvgPrice=${position.averagePrice.toFixed(4)}, BuyQtd=${transaction.quantity}, Date=${transaction.date.toLocaleDateString()}`);

      const newQuantity = position.quantity + transaction.quantity;
      const newBaseQuantity = (position.baseQuantity || 0) + transaction.quantity;
      // Calculate cost based on quantity * unit price, ignoring fees/taxes as per test mapping
      const costOfBuy = transaction.quantity * transaction.unitPrice;
      const newTotalCost = position.totalCost + costOfBuy;

      position.quantity = newQuantity;
      position.baseQuantity = newBaseQuantity;
      position.totalCost = newTotalCost;
      position.averagePrice = newBaseQuantity > 0 ? newTotalCost / newBaseQuantity : 0;

      if (position.quantity === transaction.quantity) {
        position.acquisitionDate = transaction.date;
      }

      // Add debug log after processing buy transaction
      console.log(`[DEBUG] After buy: ${position.assetCode}, Qtd=${position.quantity.toFixed(4)}, TotalCost=${position.totalCost.toFixed(4)}, AvgPrice=${position.averagePrice.toFixed(4)}, Date=${transaction.date.toLocaleDateString()}`);
    } else {
      // Sell transaction
      // Add debug log before processing sell transaction
      console.log(`[DEBUG] Before sell: ${position.assetCode}, Qtd=${position.quantity.toFixed(4)}, TotalCost=${position.totalCost.toFixed(4)}, AvgPrice=${position.averagePrice.toFixed(4)}, SellQtd=${transaction.quantity}, Date=${transaction.date.toLocaleDateString()}`);

      if (transaction.quantity > position.quantity + 0.0001) {
        // Add tolerance for float comparison
        console.warn(`[${position.assetCode}] Attempt to sell ${transaction.quantity} on ${transaction.date.toLocaleDateString()} when only ${position.quantity.toFixed(4)} available. Selling available quantity.`);

        // Sell only the available quantity and zero out the position
        position.totalCost = 0; // Cost becomes zero as all shares are sold
        position.quantity = 0;
        position.averagePrice = 0; // Avoid division by zero if quantity becomes zero unexpectedly
      } else {
        // Sufficient quantity available, proceed as before
        position.quantity -= transaction.quantity;
        const currentBaseQty = position.baseQuantity || 0;
        position.baseQuantity = currentBaseQty - transaction.quantity;

        if (position.quantity > 0.0001) {
          // Use tolerance for floating point
          // Subtrair o custo baseado na quantidade vendida usando o PM da base
          position.totalCost -= (position.averagePrice * transaction.quantity);
          if (position.totalCost < 0) position.totalCost = 0; // Prevent negative
        } else {
          // If quantity becomes zero or negligible after selling
          position.quantity = 0; // Ensure it's exactly zero
          position.baseQuantity = 0;
          position.totalCost = 0;
          position.averagePrice = 0;
        }
      }

      // Add debug log after processing sell transaction
      console.log(`[DEBUG] After sell: ${position.assetCode}, Qtd=${position.quantity.toFixed(4)}, TotalCost=${position.totalCost.toFixed(4)}, AvgPrice=${position.averagePrice.toFixed(4)}, Date=${transaction.date.toLocaleDateString()}`);
    }

    // Update history with resulting state
    const historyEntry = {
      date: transaction.date,
      type: transaction.type,
      description: transaction.type === 'buy' ? 'Compra' : 'Venda',
      quantity: transaction.quantity,
      unitPrice: transaction.unitPrice,
      totalValue: transaction.totalValue,
      fees: transaction.fees,
      taxes: transaction.taxes,
      netValue: transaction.netValue,
      resultingQuantity: position.quantity,
      resultingAveragePrice: position.averagePrice,
      resultingTotalCost: position.totalCost
    };

    position.transactionsHistory.push(historyEntry);

    console.log(`[DEBUG - processTransaction] After processing: ${position.assetCode}, Qtd=${position.quantity.toFixed(4)}, TotalCost=${position.totalCost.toFixed(4)}, AvgPrice=${position.averagePrice.toFixed(4)}, Date=${transaction.date.toLocaleDateString()}`);
    position.lastUpdateDate = transaction.date;
  }

  /**
   * Process a special event
   */
  private async processSpecialEvent(
    // Use the mapped event type which includes _originalStringType
    event: MappedSpecialEvent & { _timelineType: 'event' }, // Use MappedSpecialEvent here
    positionsMap: Map<string, AssetPosition>
  ): Promise<void> {
    const key = getAssetKey(event.assetCode);
    const position = positionsMap.get(key);
    if (!position) {
      console.warn(`Special event received for non-existing position: ${event.assetCode} on ${event.date.toLocaleDateString()}`);
      return;
    }

    // Use the mapped type and original string from the event object
    const eventTypeForSwitch = event.type;
    const originalStringType = event._originalStringType;

    // Lógica de atualização da posição baseada no evento
    let eventDescription = originalStringType || (typeof eventTypeForSwitch === 'string' ? eventTypeForSwitch : 'Evento Especial');
    let eventApplied = false;

    switch (
      eventTypeForSwitch // Switch on the mapped type (can be enum or string)
    ) {
      case SpecialEventType.STOCK_DIVIDEND: {
        let factor = event.factor;
        if (!factor || factor <= 1) {
          if (!event.quantity) {
            const staticFactor = await this.externalEventInfoProvider.getEventFactor(
              event.assetCode,
              SpecialEventType.STOCK_DIVIDEND,
              event.date
            );
            if (staticFactor) factor = staticFactor;
          }
        }

        const oldQuantity = position.quantity;

        if (factor && factor > 1) {
          position.quantity *= factor;
          eventApplied = true;
          eventDescription = `Bonificação (Fator ${factor})`;
        } else if (event.quantity && event.quantity > 0) {
          position.quantity += event.quantity;
          eventApplied = true;
          eventDescription = 'Bonificação';
        }

        if (eventApplied) {
          const addedQuantity = position.quantity - oldQuantity;
          // BONIFICAÇÃO NÃO ALTERA CUSTO TOTAL NEM PREÇO MÉDIO
          // Apenas aumenta a quantidade. O Preço Médio "Real" (de aquisição)
          // permanece o mesmo sobre a base que gerou custo.
          console.info(
            `[APP-BONUS] ${position.assetCode} +${addedQuantity.toFixed(4)} shares. PM and TotalCost remained stable.`
          );
        }
        break;
      }

      case SpecialEventType.STOCK_SPLIT: {
        // Add debug log before processing stock split
        console.log(`[DEBUG] Before stock split: ${position.assetCode}, Qtd=${position.quantity.toFixed(4)}, TotalCost=${position.totalCost.toFixed(4)}, AvgPrice=${position.averagePrice.toFixed(4)}, Factor=${event.factor}, Date=${event.date.toLocaleDateString()}`);

        if (position.quantity === 0) {
          // Avoid division by zero if split happens before buy
          console.warn(`Stock split event for ${position.assetCode} but quantity is zero.`);
          break;
        }

        // Use the event.factor for splits (e.g., factor 10 means 1 share becomes 10)
        // Ensure event.factor exists and is greater than 1 for a split
        // Also check if event.factor is a number
        let factor = event.factor;
        if (!factor) {
          // Pass the mapped type (which is STOCK_SPLIT here)
          const staticFactor = await this.externalEventInfoProvider.getEventFactor(
            event.assetCode,
            SpecialEventType.STOCK_SPLIT,
            event.date
          );
          if (staticFactor) factor = staticFactor;
        }

        if (factor && typeof factor === 'number' && factor > 1) {
          console.info(`Applying Stock Split: Qtd before=${position.quantity.toFixed(4)}, Factor=${factor}, Date=${event.date.toLocaleDateString('pt-BR')}`);

          position.quantity *= factor;
          position.baseQuantity = (position.baseQuantity || 0) * factor; // Dilute base
          // Recalculate average price: total cost remains the same, base quantity increases
          if (position.baseQuantity > 0) {
            position.averagePrice = position.totalCost / position.baseQuantity;
          } else {
            position.averagePrice = 0; // Avoid division by zero if quantity becomes zero unexpectedly
          }
          console.info(` -> Qtd after=${position.quantity.toFixed(4)}, New Avg Price=${position.averagePrice.toFixed(4)}`);
          eventApplied = true;
          eventDescription = `Desdobramento (1:${factor})`;
        } else {
          // Fator é OBRIGATÓRIO para Desdobramento/Grupamento
          console.warn(`Stock split event for ${position.assetCode} is missing a valid factor > 1:`, event);
        }

        // Add debug log after processing stock split
        console.log(`[DEBUG] After stock split: ${position.assetCode}, Qtd=${position.quantity.toFixed(4)}, TotalCost=${position.totalCost.toFixed(4)}, AvgPrice=${position.averagePrice.toFixed(4)}, Date=${event.date.toLocaleDateString()}`);

        break;
      }
      case SpecialEventType.REVERSE_SPLIT: {
        if (position.quantity === 0) {
          // Avoid issues if reverse split happens before buy
          console.warn(`Reverse split event for ${position.assetCode} but quantity is zero.`);
          break;
        }

        // Ensure event.factor exists and is greater than 1 for a reverse split
        // Also check if event.factor is a number
        const factor = event.factor;
        let updatedFactor = factor;
        if (!updatedFactor) {
          // Pass the mapped type (which is REVERSE_SPLIT here)
          const staticFactor = await this.externalEventInfoProvider.getEventFactor(
            event.assetCode,
            event.type,
            event.date
          );

          if (staticFactor) 
            updatedFactor = staticFactor;
        }

        if (updatedFactor && typeof updatedFactor === 'number' && updatedFactor > 1) {
          console.info(`Applying Reverse Split: Qtd before=${position.quantity.toFixed(4)}, Factor=${updatedFactor}, Date=${event.date.toLocaleDateString('pt-BR')}`);

          position.quantity /= updatedFactor; // Divide quantity by the factor
          position.baseQuantity = (position.baseQuantity || 0) / updatedFactor; // Aggregate base
          // Recalculate average price: total cost remains the same, base quantity decreases
          if (position.baseQuantity > 0) {
            position.averagePrice = position.totalCost / position.baseQuantity;
          } else {
            position.averagePrice = 0; // Avoid division by zero if quantity becomes zero unexpectedly
          }
          // Consider rounding quantity after division if needed
          // position.quantity = Math.round(position.quantity * 10000) / 10000;
          console.info(` -> Qtd after=${position.quantity.toFixed(4)}, New Avg Price=${position.averagePrice.toFixed(4)}`);
          eventApplied = true;
          eventDescription = `Grupamento (${updatedFactor}:1)`;
        } else {
          // Fator é OBRIGATÓRIO para Desdobramento/Grupamento
          console.warn(`Reverse split event for ${position.assetCode} is missing a valid factor > 1:`, event);
        }
        break;
      }
          // case SpecialEventType.SUBSCRIPTION: // Ignorando esses eventos porque a B3 já adionou esse evento como "Compra"
      //   // Subscription adds quantity and increases total cost
      //   position.quantity += event.quantity;
      //   position.totalCost += event.netValue; // Assuming netValue is the cost of subscribed shares

      //   // Recalculate average price
      //   if (position.quantity > 0.0001) {
      //     // Use tolerance
      //     position.averagePrice = position.totalCost / position.quantity;
      //   } else {
      //     position.averagePrice = 0;
      //     position.totalCost = 0; // Ensure cost is zero if quantity is zero
      //   }
      //   console.info(`Applying Subscription: Qtd after=${position.quantity.toFixed(4)}, New Total Cost=${position.totalCost.toFixed(4)}, New Avg Price=${position.averagePrice.toFixed(4)}, Date=${event.date.toLocaleDateString('pt-BR')}`);

      //   break;

      case SpecialEventType.OTHER: {
        if (
          originalStringType === 'Atualização'
          // || originalStringType === 'Direito de Subscrição' // Ignorando esses eventos porque a B3 já adionou esse evento como "Compra"
        ) {
          // These events increase quantity. Cost adjustment depends on the retrieved price.
          let averagePrice = 0; // Default to 0 if not found or provider doesn't support it
          // Get the average price from the external provider
          const price = await this.externalEventInfoProvider.getSpecialEventAveragePrice(
            event.assetCode,
            originalStringType,
            event.date
          );

          if (price !== null) averagePrice = price;
          else console.warn(`[${position.assetCode}] Average price for event '${originalStringType}' on ${event.date.toLocaleDateString()} not found in static data. Assuming price 0.`);

          const addedQuantity = event.quantity;
          position.quantity += addedQuantity;

          if (averagePrice > 0) {
            position.baseQuantity = (position.baseQuantity || 0) + addedQuantity; // Aumenta base
            const addedCost = addedQuantity * averagePrice;
            position.totalCost += addedCost;
            console.info(`Applying ${originalStringType} (Price > 0): Qtd added=${addedQuantity.toFixed(4)}, Price=${averagePrice.toFixed(4)}, Cost added=${addedCost.toFixed(4)}, Date=${event.date.toLocaleDateString('pt-BR')}`);

          } else {
            // Price is 0, treat like Bonificação (no cost change)
            // NO baseQuantity change
            console.info(`Applying ${originalStringType} (Price = 0): Qtd added=${addedQuantity.toFixed(4)}, No cost change, Date=${event.date.toLocaleDateString('pt-BR')}`);
          }

          // Recalculate average price using baseQuantity
          if (position.baseQuantity && position.baseQuantity > 0.0001)
            position.averagePrice = position.totalCost / position.baseQuantity;
          else {
            position.averagePrice = 0;
            position.totalCost = 0;
          }
          console.info(` -> Qtd after=${position.quantity.toFixed(4)}, New Total Cost=${position.totalCost.toFixed(4)}, New Avg Price=${position.averagePrice.toFixed(4)}`);
          eventApplied = true;
          eventDescription = originalStringType;
        } 
           // else if (originalStringType === 'Cessão de Direitos - Solicitada') { // Ignorando esses eventos porque a B3 já adionou esse evento como "Compra"
        //   // This event decreases quantity and removes cost based on the retrieved price.
        //   let averagePrice = 0; // Default to 0 if not found or provider doesn't support it
        //   // Get the average price from the external provider
        //   const price = await this.externalEventInfoProvider.getSpecialEventAveragePrice(
        //     event.assetCode,
        //     originalStringType,
        //     event.date
        //   );
        //   if (price !== null) averagePrice = price;
        //   else {
        //     console.warn(`[${position.assetCode}] Average price for event '${originalStringType}' on ${event.date.toLocaleDateString()} not found in static data. Cannot adjust cost accurately.`);

        //     // Decide fallback: maybe use current average price? For now, use 0.
        //     // averagePrice = position.averagePrice; // Alternative fallback
        //   }

        //   const removedQuantity = event.quantity;
        //   const costToRemove = removedQuantity * averagePrice; // Cost basis of the ceded rights
        //   console.info(`Applying ${originalStringType}: Qtd removed=${removedQuantity.toFixed(4)}, Price=${averagePrice.toFixed(4)}, Cost removed=${costToRemove.toFixed(4)}, Date=${event.date.toLocaleDateString('pt-BR')}`);

        //   if (removedQuantity > position.quantity + 0.0001) {
        //     // Add tolerance
        //     console.warn(`[${position.assetCode}] Attempt to cede ${removedQuantity} rights on ${event.date.toLocaleDateString()} when only ${position.quantity.toFixed(4)} available. Ceding available quantity.`);

        //     // Adjust cost removal based on available quantity?
        //     // For simplicity, let's assume the event data is correct and proceed,
        //     // negative balance check will catch inconsistencies later.
        //     // Or adjust costToRemove: costToRemove = position.quantity * averagePrice;
        //   }

        //   position.quantity -= removedQuantity;
        //   position.totalCost -= costToRemove;

        //   // Ensure cost doesn't go negative due to potential inaccuracies
        //   if (position.totalCost < 0) {
        //     console.warn(`[${position.assetCode}] Total cost went negative (${position.totalCost.toFixed(4)}) after '${originalStringType}'. Setting cost to 0.`);

        //     position.totalCost = 0;
        //   }

        //   // Recalculate average price
        //   if (position.quantity > 0.0001)
        //     position.averagePrice = position.totalCost / position.quantity;
        //   else {
        //     position.quantity = 0;
        //     position.averagePrice = 0;
        //     position.totalCost = 0;
        //   }
        //   console.info(` -> Qtd after=${position.quantity.toFixed(4)}, New Total Cost=${position.totalCost.toFixed(4)}, New Avg Price=${position.averagePrice.toFixed(4)}`);

        // }
        else if (originalStringType === 'Fração em Ativos') {
          const quantityToRemove = event.quantity;
          if (quantityToRemove > 0 && position.quantity >= quantityToRemove - 0.0001) {
            const priceBefore = position.averagePrice;
            // MANTER PREÇO MÉDIO ESTÁVEL: Remove custo proporcional
            position.totalCost -= quantityToRemove * priceBefore;
            if (position.totalCost < 0) position.totalCost = 0; // Prevent negative
            position.quantity -= quantityToRemove;
            position.baseQuantity = (position.baseQuantity || 0) - quantityToRemove;
            
            if (position.quantity < 0.0001) {
              position.quantity = 0;
              position.baseQuantity = 0;
              position.totalCost = 0;
              position.averagePrice = 0;
            } else {
              if (position.baseQuantity && position.baseQuantity > 0.0001) {
                  position.averagePrice = position.totalCost / position.baseQuantity;
              } else {
                  position.averagePrice = 0;
                  position.totalCost = 0;
              }
            }
            
            console.info(`[APP-FRACTION] ${position.assetCode} -${quantityToRemove.toFixed(4)} shares. Removed cost based on PM R$ ${priceBefore.toFixed(4)}`);
          } else {
            console.warn(`[${position.assetCode}] Attempt to remove fraction ${quantityToRemove} on ${event.date.toLocaleDateString()} when only ${position.quantity.toFixed(4)} available. Zeroing position.`);
            position.quantity = 0;
            position.baseQuantity = 0;
            position.totalCost = 0;
            position.averagePrice = 0;
            eventApplied = true;
            eventDescription = 'Fração em Ativos (Venda - Zerou)';
          }
        } else {
          // Log for other strings mapped to OTHER
          console.log(`[${position.assetCode}] Skipping unhandled original special event string type mapped to OTHER: ${originalStringType} on ${event.date.toLocaleDateString()}`);
        }
        break;
      }
      // Events like DIVIDEND, JCP, INCOME don't affect position cost/avg price here
      case SpecialEventType.DIVIDEND:
      case SpecialEventType.JCP:
      case SpecialEventType.INCOME:
        // No action needed here, handled by extractIncomeRecords
        break;
      default:
        // Handle unmapped strings or unexpected enum values
        if (typeof eventTypeForSwitch === 'string') {
          console.log(`[${position.assetCode}] Skipping unhandled special event string type: ${eventTypeForSwitch} on ${event.date.toLocaleDateString()}`);
        } else {
          // This case should ideally not be reached if mapping is comprehensive
          // Safely access enum name
          const enumName = Object.keys(SpecialEventType).find(
            key => SpecialEventType[key as keyof typeof SpecialEventType] === eventTypeForSwitch
          );
          console.log(`[${position.assetCode}] Skipping unhandled special event enum type: ${enumName || eventTypeForSwitch} on ${event.date.toLocaleDateString()}`);
        }
        break;
    }

    if (eventApplied) {
      position.transactionsHistory.push({
        date: event.date,
        type: 'event',
        description: eventDescription,
        quantity: event.quantity,
        unitPrice: event.unitPrice || 0,
        totalValue: event.totalValue || 0,
        fees: event.fees || 0,
        taxes: event.taxes || 0,
        netValue: event.netValue || 0,
        resultingQuantity: position.quantity,
        resultingAveragePrice: position.averagePrice,
        resultingTotalCost: position.totalCost
      });
    }

    console.log(`[DEBUG - processSpecialEvent] After processing: ${position.assetCode}, Qtd=${position.quantity.toFixed(4)}, TotalCost=${position.totalCost.toFixed(4)}, AvgPrice=${position.averagePrice.toFixed(4)}, Date=${event.date.toLocaleDateString()}, EventType=${event.type}, OriginalStringType=${event._originalStringType}`);
    position.lastUpdateDate = event.date;
  }

  /**
   * Calculate trade results from asset positions
   * @param assetPositions The asset positions to calculate trade results from
   * @param selectedYear The year to filter results for
   * @returns A promise that resolves to an array of trade results
   */
  async calculateTradeResults(
    assetPositions: AssetPosition[],
    selectedYear: number
  ): Promise<TradeResult[]> {
    try {
      const tradeResults: TradeResult[] = [];
      // Check if any transaction history exists within the selected year across all positions
      const hasTransactionsHistoryInSelectedYear = assetPositions.some(assetPosition =>
        assetPosition.transactionsHistory?.some(
          positionHistory =>
            positionHistory.date && positionHistory.date.getFullYear() === selectedYear
        )
      );

      // If no transactions in the selected year, no trade results for that year
      if (selectedYear && !hasTransactionsHistoryInSelectedYear) {
        console.log(`AssetProcessor: No transaction history found in selected year ${selectedYear}. Skipping trade result calculation.`);

        return [];
      }

      for (const position of assetPositions) {
        if (!position.transactionsHistory || position.transactionsHistory.length === 0) continue;

        const buyQueue: { quantity: number; netValue: number; date: Date }[] = [];
        // Process history chronologically to build buy queue and calculate sale costs
        const sortedHistory = [...position.transactionsHistory].sort(
          (a, b) => a.date.getTime() - b.date.getTime()
        );

        for (const tx of sortedHistory) {
          if (tx.type === 'buy') {
            // Use netValue for cost basis in FIFO queue
            buyQueue.push({ quantity: tx.quantity, netValue: tx.netValue, date: tx.date });
          } else if (tx.type === 'sell' || (tx.type === 'event' && tx.quantity > 0)) {
            // Only process sales or events with quantity > 0 (e.g., fraction sales)
            // Only process sales within the selected year for results
            if (selectedYear && tx.date && tx.date.getFullYear() !== selectedYear) {
              continue; // Skip sales outside the target year
            }

            let remainingSellQty = tx.quantity;
            let costOfGoodsSold = 0;
            let totalCostBasisUsed = 0; // Track cost basis used for this sale

            while (remainingSellQty > 0.0001 && buyQueue.length > 0) {
              // Use tolerance
              const buyTx = buyQueue[0];
              const qtyToUse = Math.min(remainingSellQty, buyTx.quantity);

              // Calculate cost per unit from the specific buy transaction
              // Ensure buyTx.quantity is not zero to avoid division by zero
              const costPerUnit = buyTx.quantity > 0 ? buyTx.netValue / buyTx.quantity : 0;

              const costBasisForQty = qtyToUse * costPerUnit;
              costOfGoodsSold += costBasisForQty;
              totalCostBasisUsed += costBasisForQty; // Accumulate cost basis used

              buyTx.quantity -= qtyToUse;
              remainingSellQty -= qtyToUse;

              if (buyTx.quantity <= 0.0001) {
                // Use tolerance for floating point
                buyQueue.shift(); // Remove empty buy transaction
              }
            }

            if (remainingSellQty > 0.0001) {
              // This indicates a sale occurred when the calculated buy queue was empty.
              // This could happen due to missing initial positions or events not fully accounted for.
              // Use the position's *current* average price (calculated at the start of the loop for this position) as a fallback, but log a warning.
              // Corrected: Use average price calculated at the start of this position's loop
              // Fallback using the position's final average price (less accurate for FIFO)
              const fallbackAveragePrice = position.averagePrice; // Use final calculated average price as fallback
              console.warn(`[${position.assetCode}] Sold ${tx.quantity} on ${tx.date.toLocaleDateString()}, but only found FIFO cost for ${tx.quantity - remainingSellQty}. Using final average price (${fallbackAveragePrice.toFixed(4)}) for remaining ${remainingSellQty.toFixed(4)}.`);

              const fallbackCost = remainingSellQty * fallbackAveragePrice;
              costOfGoodsSold += fallbackCost; // Use position average price for the remainder
              totalCostBasisUsed += fallbackCost;
            }

            // Calculate profit/loss for this specific sale using FIFO cost
            const profitOrLoss = tx.netValue - costOfGoodsSold; // Use netValue for sale which usually includes fees/taxes

            tradeResults.push({
              assetCode: position.assetCode,
              assetName: position.assetName,
              assetCategory: position.assetCategory,
              marketType: position.marketType,
              date: tx.date,
              month: tx.date.getMonth() + 1,
              year: tx.date.getFullYear(),
              quantity: tx.quantity,
              // Effective FIFO purchase price per unit for this sale
              purchasePrice: tx.quantity > 0 ? costOfGoodsSold / tx.quantity : 0,
              purchaseCost: costOfGoodsSold,
              salePrice: tx.unitPrice, // Unit price before fees/taxes
              saleValue: tx.totalValue, // Gross sale value
              //netSaleValue: tx.netValue, // Net sale value after fees/taxes
              fees: tx.fees,
              taxes: tx.taxes, // IRRF (dedo-duro) if applicable
              profitOrLoss: profitOrLoss,
              isExempt: false // Recalculate exemption based on monthly sales later
            });

            // Update position's total cost after the sale by removing the cost basis used
            // This is important if average price is recalculated after sales, though not strictly necessary for pure FIFO result calc
            // position.totalCost -= totalCostBasisUsed;
            // if (position.quantity > 0) {
            //     currentAveragePrice = position.totalCost / position.quantity;
            // } else {
            //     currentAveragePrice = 0;
            //     position.totalCost = 0; // Ensure cost is zero if quantity is zero
            // }
          }
        }
      }
      return tradeResults.sort((a, b) => a.date.getTime() - b.date.getTime());
    } catch (error) {
      console.error('Error calculating trade results:', error);
      throw error;
    }
  }

  /**
   * Calculate monthly results from trade results
   */
  async calculateMonthlyResults(
    tradeResults: TradeResult[],
    selectedYear: number
  ): Promise<MonthlyResult[]> {
    try {
      // Filter trade results to only include those from the selected year
      const filteredTradeResults = selectedYear
        ? tradeResults.filter(result => result.year === selectedYear)
        : tradeResults;

      console.log(`AssetProcessor: Calculating monthly results for ${selectedYear || 'all years'} with ${filteredTradeResults.length} trades.`);

      // If there are no trades in the selected year, return an empty array
      // This ensures positions closed in previous years are not included in the declaration
      if (selectedYear && filteredTradeResults.length === 0) {
        return [];
      }

      // Create maps to store monthly results and sales
      const monthlyResultsMap = new Map<string, MonthlyResult>();
      const monthlySalesMap = new Map<string, number>(); // Track monthly sales for exemption check

      // Passo 1: Agrupar vendas e calcular resultados brutos por mês/ano/tipo
      // Only process trades from the selected year
      for (const trade of filteredTradeResults) {
        // Determine key based on asset category and potentially market type (DayTrade vs Common)
        // For now, group by month/year/category
        const key = `${trade.year}-${String(trade.month).padStart(2, '0')}-${trade.assetCategory}`;
        const salesKey = `${trade.year}-${String(trade.month).padStart(2, '0')}-${
          trade.assetCategory
        }`; // Key for sales exemption check (Stocks only)

        // Acumular vendas mensais de ações (exceto DayTrade)
        if (
          trade.assetCategory ===
          AssetCategory.STOCK /*&& trade.marketType !== MarketType.DAY_TRADE - precisa do tipo no TradeResult*/
        ) {
          monthlySalesMap.set(
            salesKey,
            (monthlySalesMap.get(salesKey) || 0) + /*trade.netSaleValue ??*/ trade.saleValue
          ); // Use net sale value if available
        }

        if (!monthlyResultsMap.has(key)) {
          monthlyResultsMap.set(key, {
            month: trade.month,
            year: trade.year,
            assetCategory: trade.assetCategory,
            totalSalesValue: 0, // Will be summed up later
            totalProfit: 0,
            totalLoss: 0,
            netResult: 0,
            compensatedLoss: 0,
            taxableProfit: 0,
            // Determine tax rate based on category (and potentially type)
            taxRate: trade.assetCategory === AssetCategory.FII ? 0.20 : 0.15, // Example: 20% FII, 15% Stock (adjust for DayTrade)
            taxDue: 0,
            taxWithheld: 0, // Sum IRRF from trades
            taxToPay: 0,
            remainingLoss: 0, // Will be calculated sequentially
            tradeResults: [],
          });
        }

        const monthlyResult = monthlyResultsMap.get(key)!;
        monthlyResult.tradeResults.push(trade);
        monthlyResult.taxWithheld += trade.taxes ?? 0; // Accumulate IRRF (dedo-duro)

        // Aggregate profits and losses
        if (trade.profitOrLoss > 0) {
          monthlyResult.totalProfit += trade.profitOrLoss;
        } else {
          monthlyResult.totalLoss += Math.abs(trade.profitOrLoss);
        }
        // Sum net sales value for the month
        monthlyResult.totalSalesValue += /*trade.netSaleValue ??*/ trade.saleValue;
      }

      // Passo 2: Calcular resultados líquidos e aplicar compensações sequencialmente
      const monthlyResults = Array.from(monthlyResultsMap.values()).sort((a, b) => {
        if (a.year !== b.year) return a.year - b.year;
        return a.month - b.month;
      });

      // Track remaining loss separately for Stocks and FIIs (and potentially DayTrade)
      let currentRemainingLossStock = 0;
      let currentRemainingLossFII = 0;
      // let currentRemainingLossDayTrade = 0; // If tracking DayTrade separately

      for (const result of monthlyResults) {
        result.netResult = result.totalProfit - result.totalLoss;
        result.compensatedLoss = 0;
        result.taxableProfit = 0;
        result.taxDue = 0;
        result.taxToPay = 0;

        let currentRemainingLossCategory = 0;
        if (result.assetCategory === AssetCategory.STOCK) {
          currentRemainingLossCategory = currentRemainingLossStock;
        } else if (result.assetCategory === AssetCategory.FII) {
          currentRemainingLossCategory = currentRemainingLossFII;
        }
        // Add logic for DayTrade if needed

        // Apply accumulated loss (from previous months/years within the same category)
        if (result.netResult > 0 && currentRemainingLossCategory > 0) {
          const lossToCompensate = Math.min(result.netResult, currentRemainingLossCategory);
          result.compensatedLoss = lossToCompensate;
          currentRemainingLossCategory -= lossToCompensate;
        } else if (result.netResult < 0) {
          currentRemainingLossCategory += Math.abs(result.netResult);
        }

        result.taxableProfit = Math.max(0, result.netResult - result.compensatedLoss);

        // Update the remaining loss for the category
        if (result.assetCategory === AssetCategory.STOCK) {
          currentRemainingLossStock = currentRemainingLossCategory;
          result.remainingLoss = currentRemainingLossStock;
        } else if (result.assetCategory === AssetCategory.FII) {
          currentRemainingLossFII = currentRemainingLossCategory;
          result.remainingLoss = currentRemainingLossFII;
        }
        // Add logic for DayTrade if needed

        // Check exemption for Stocks (sales < R$ 20,000 in the month, common operations)
        const salesKey = `${result.year}-${String(result.month).padStart(2, '0')}-${
          AssetCategory.STOCK
        }`;
        const monthlyStockSales = monthlySalesMap.get(salesKey) || 0;
        // Assuming result.tradeType exists or can be inferred
        const isExempt =
          result.assetCategory === AssetCategory.STOCK /*&& result.tradeType === 'Common'*/ &&
          monthlyStockSales <= 20000;

        // Calculate tax due (considering exemption and different rates)
        if (result.taxableProfit > 0 && !isExempt) {
          // TODO: Refine tax rate based on trade type (DayTrade vs Common) if available
          // result.taxRate = (result.assetCategory === AssetCategory.FII || result.tradeType === 'DayTrade') ? 0.20 : 0.15;
          result.taxDue = result.taxableProfit * result.taxRate;
        }

        // Calculate tax to pay (Due - Withheld)
        result.taxToPay = Math.max(0, result.taxDue - result.taxWithheld); // Cannot be negative

        console.log(`Monthly Result - ${result.month}/${result.year} (${result.assetCategory}): Net=${result.netResult.toFixed(2)}, CompLoss=${result.compensatedLoss.toFixed(2)}, Taxable=${result.taxableProfit.toFixed(2)}, TaxDue=${result.taxDue.toFixed(2)}, RemLoss=${result.remainingLoss.toFixed(2)}`);

      }
      return monthlyResults;
    } catch (error) {
      console.error('Error calculating monthly results:', error);
      throw error;
    }
  }

  /**
   * Validate data for inconsistencies
   */
  async validateData(
    transactions: Transaction[],
    mappedSpecialEvents: MappedSpecialEvent[] // Accept mapped events
  ): Promise<Inconsistency[]> {
    const inconsistencies: Inconsistency[] = [];
    this.checkDuplicateTransactions(transactions, inconsistencies);

    // Pass original specialEvents to checkNegativeQuantities as it checks raw quantity
    // Let's pass mapped ones, but checkNegativeQuantities needs adjustment if it relies on original structure
    // For now, assuming checkNegativeQuantities works with MappedSpecialEvent structure
    this.checkNegativeQuantities(transactions, mappedSpecialEvents, inconsistencies); // Pass mapped
    this.checkInvalidDates(transactions, mappedSpecialEvents, inconsistencies); // Pass mapped
    this.checkMissingAssetCodes(transactions, mappedSpecialEvents, inconsistencies); // Pass mapped

    // Pass mappedSpecialEvents to checkNegativeBalances
    this.checkNegativeBalances(transactions, mappedSpecialEvents, inconsistencies); // Pass mapped
    return inconsistencies;
  }

  // --- Métodos de Validação (Adaptações podem ser necessárias se checkNegativeBalances virar async) ---
  private checkDuplicateTransactions(
    transactions: Transaction[],
    inconsistencies: Inconsistency[]
  ): void {
    const processedRows = new Set<string>(); // Usar chave composta: fileName|rowNumber
    const dateAssetTypeGroups = new Map<string, Transaction[]>();

    for (const transaction of transactions) {
      // Ensure transaction and date are valid before proceeding
      if (!transaction || !transaction.date || !transaction.assetCode) continue;

      const normalizedAssetCode = getAssetKey(transaction.assetCode);
      const key = `${transaction.date.toISOString()}|${normalizedAssetCode}|${transaction.type}`;

      if (!dateAssetTypeGroups.has(key)) {
        dateAssetTypeGroups.set(key, []);
      }
      dateAssetTypeGroups.get(key)!.push(transaction);
    }

    for (const group of dateAssetTypeGroups.values()) {
      if (group.length <= 1) continue;

      for (let i = 0; i < group.length; i++) {
        const tx1 = group[i];
        const rowKey1 = `${tx1.fileName || ''}|${tx1.rowNumber || i}`;
        if (processedRows.has(rowKey1)) continue;

        const duplicates = [tx1];
        for (let j = i + 1; j < group.length; j++) {
          const tx2 = group[j];
          const rowKey2 = `${tx2.fileName || ''}|${tx2.rowNumber || j}`;
          if (processedRows.has(rowKey2)) continue;

          // Ensure properties exist before comparison
          if (
            tx1.quantity === tx2.quantity &&
            Math.abs((tx1.unitPrice ?? 0) - (tx2.unitPrice ?? 0)) < 0.0001 &&
            Math.abs((tx1.totalValue ?? 0) - (tx2.totalValue ?? 0)) < 0.01 &&
            Math.abs((tx1.fees ?? 0) - (tx2.fees ?? 0)) < 0.01 &&
            Math.abs((tx1.taxes ?? 0) - (tx2.taxes ?? 0)) < 0.01
          ) {
            duplicates.push(tx2);
            processedRows.add(rowKey2);
          }
        }

        if (duplicates.length > 1) {
          const locationInfo = duplicates
            .map(d => (d.rowNumber ? `${d.fileName || 'Arquivo'}: L${d.rowNumber}` : null))
            .filter(Boolean)
            .join(', ');

          inconsistencies.push({
            type: 'warning',
            message: 'Transação duplicada detectada',
            details: `Existem ${duplicates.length} transações idênticas para ${
              tx1.assetCode
            } em ${tx1.date.toLocaleDateString()}`,
            assetCode: tx1.assetCode,
            date: tx1.date,
            locationInfo: locationInfo || undefined,
          });

          processedRows.add(rowKey1); // Marca a original como processada também
        }
      }
    }
  }

  // Adjusted to accept MappedSpecialEvent
  private checkNegativeQuantities(
    transactions: Transaction[],
    specialEvents: MappedSpecialEvent[], // Accept mapped events
    inconsistencies: Inconsistency[]
  ): void {
    transactions.forEach(t => {
      // Ensure transaction and quantity are valid
      if (!t || t.quantity === undefined || t.quantity === null) return;
      if (t.quantity <= 0) {
        inconsistencies.push({
          type: 'error',
          message: 'Quantidade inválida na transação',
          details: `Ativo ${t.assetCode}, Data ${t.date?.toLocaleDateString()}, Qtd ${t.quantity}`,
          assetCode: t.assetCode,
          date: t.date,
          locationInfo: t.fileName && t.rowNumber ? `${t.fileName}:L${t.rowNumber}` : undefined,
        });
      }
    });

    specialEvents.forEach(e => {
      // Ensure event and quantity are valid
      if (!e || e.quantity === undefined || e.quantity === null) return;
      // Quantidade 0 é válida para alguns eventos (split, jcp, dividend), < 0 não é.
      // Allow 0 for specific types if needed, otherwise check for < 0
      // Use original event type 'e.type' for this check
      const allowZeroQuantity = [
        SpecialEventType.STOCK_SPLIT,
        SpecialEventType.REVERSE_SPLIT,
        SpecialEventType.DIVIDEND,
        SpecialEventType.JCP,
        SpecialEventType.INCOME
      ].includes(e.type as SpecialEventType); // Cast might be needed if type is string | enum

      if (e.quantity < 0 || (!allowZeroQuantity && e.quantity === 0)) {
        inconsistencies.push({
          type: 'error',
          message: 'Quantidade inválida no evento',
          // Display original string type if available for clarity
          details: `Ativo ${e.assetCode}, Tipo ${
            e._originalStringType ?? e.type
          }, Data ${e.date?.toLocaleDateString()}, Qtd ${e.quantity}`,
          assetCode: e.assetCode,
          date: e.date,
          locationInfo: e.fileName && e.rowNumber ? `${e.fileName}:L${e.rowNumber}` : undefined,
        });
      }
    });
  }

  // Adjusted to accept MappedSpecialEvent
  private checkInvalidDates(
    transactions: Transaction[],
    specialEvents: MappedSpecialEvent[], // Accept mapped events
    inconsistencies: Inconsistency[]
  ): void {
    const now = new Date();
    now.setHours(23, 59, 59, 999); // Considerar até o fim do dia atual

    transactions.forEach(t => {
      if (!t || !t.date || !(t.date instanceof Date) || isNaN(t.date.getTime())) {
        inconsistencies.push({
          type: 'error',
          message: 'Data inválida na transação',
          details: `Ativo ${t?.assetCode}, Data ${t?.date}`,
          assetCode: t?.assetCode,
          locationInfo: t?.fileName && t?.rowNumber ? `${t.fileName}:L${t.rowNumber}` : undefined,
        });
      } else if (t.date > now) {
        inconsistencies.push({
          type: 'warning',
          message: 'Data futura na transação',
          details: `Ativo ${t.assetCode}, Data ${t.date.toLocaleDateString()}`,
          assetCode: t.assetCode,
          date: t.date,
          locationInfo: t.fileName && t.rowNumber ? `${t.fileName}:L${t.rowNumber}` : undefined,
        });
      }
    });
    specialEvents.forEach(e => {
      if (!e || !e.date || !(e.date instanceof Date) || isNaN(e.date.getTime())) {
        inconsistencies.push({
          type: 'error',
          message: 'Data inválida no evento',
          details: `Ativo ${e?.assetCode}, Tipo ${e?._originalStringType ?? e?.type}, Data ${
            e?.date
          }`,
          assetCode: e?.assetCode,
          locationInfo: e?.fileName && e?.rowNumber ? `${e.fileName}:L${e.rowNumber}` : undefined,
        });
      } else if (e.date > now) {
        inconsistencies.push({
          type: 'warning',
          message: 'Data futura no evento',
          details: `Ativo ${e.assetCode}, Tipo ${
            e._originalStringType ?? e.type
          }, Data ${e.date.toLocaleDateString()}`,
          assetCode: e.assetCode,
          date: e.date,
          locationInfo: e.fileName && e.rowNumber ? `${e.fileName}:L${e.rowNumber}` : undefined,
        });
      }
    });
  }

  // Adjusted to accept MappedSpecialEvent
  private checkMissingAssetCodes(
    transactions: Transaction[],
    specialEvents: MappedSpecialEvent[], // Accept mapped events
    inconsistencies: Inconsistency[]
  ): void {
    transactions.forEach(t => {
      if (!t || !t.assetCode) {
        inconsistencies.push({
          type: 'error',
          message: 'Código do ativo ausente na transação',
          details: `Data ${t?.date?.toLocaleDateString()}, Tipo ${t?.type}`,
          date: t?.date,
          locationInfo: t?.fileName && t?.rowNumber ? `${t.fileName}:L${t.rowNumber}` : undefined,
        });
      }
    });
    specialEvents.forEach(e => {
      if (!e || !e.assetCode) {
        inconsistencies.push({
          type: 'error',
          message: 'Código do ativo ausente no evento',
          details: `Data ${e?.date?.toLocaleDateString()}, Tipo ${
            e?._originalStringType ?? e?.type
          }`,
          date: e?.date,
          locationInfo: e?.fileName && e?.rowNumber ? `${e.fileName}:L${e.rowNumber}` : undefined,
        });
      }
    });
  }

  // Adjusted to accept MappedSpecialEvent
  private checkNegativeBalances(
    transactions: Transaction[],
    mappedSpecialEvents: MappedSpecialEvent[], // Accept mapped events
    inconsistencies: Inconsistency[]
  ): void {
    const assetTimelines = new Map<string, any[]>(); // key = assetKey

    // Agrupar transações e eventos por ativo
    transactions.forEach(t => {
      if (!t || !t.assetCode) return; // Skip invalid transactions
      const key = getAssetKey(t.assetCode);
      if (!assetTimelines.has(key)) assetTimelines.set(key, []);
      // Add transaction with its type marker
      assetTimelines.get(key)!.push({ ...t, _type: 'transaction' });
    });
    // Iterate over the mappedSpecialEvents passed as argument
    mappedSpecialEvents.forEach(e => {
      if (!e || !e.assetCode) return; // Skip invalid events
      const key = getAssetKey(e.assetCode);
      if (!assetTimelines.has(key)) assetTimelines.set(key, []);
      // Add events that affect quantity, using the mapped type for relevance check
      const mappedEventType = e.type; // Already mapped
      const originalStringType = e._originalStringType; // Get original string type if present
      const isRelevantEvent =
        mappedEventType === SpecialEventType.STOCK_DIVIDEND ||
        mappedEventType === SpecialEventType.STOCK_SPLIT ||
        mappedEventType === SpecialEventType.REVERSE_SPLIT ||
        // mappedEventType === SpecialEventType.SUBSCRIPTION || // Ignorando esses eventos porque a B3 já adionou esse evento como "Compra"
        // Check original string type for events mapped to OTHER 
        (mappedEventType === SpecialEventType.OTHER &&
          (originalStringType === 'Atualização' ||
            // originalStringType === 'Direito de Subscrição' || // Ignorando esses eventos porque a B3 já adionou esse evento como "Compra"
            // originalStringType === 'Cessão de Direitos - Solicitada' || // Ignorando esses eventos porque a B3 já adionou esse evento como "Compra"
            originalStringType === 'Fração em Ativos')); // Include fraction here too

      if (isRelevantEvent) {
        // Push the mapped event 'e' which includes _originalStringType and add type marker
        assetTimelines.get(key)!.push({ ...e, _type: 'event' });
      }
    });

    // Processar cada timeline
    for (const [key, timeline] of assetTimelines.entries()) {
      timeline.sort((a, b) => a.date.getTime() - b.date.getTime()); // Ordena por data

      let quantity = 0;
      let initialQty = 0; // Track quantity before splits/reverse splits for ratio calc
      const assetCode = key; // Key is just the asset code now

      for (const item of timeline) {
        initialQty = quantity; // Store qty before processing item

        if (item._type === 'transaction') {
          if (item.type === 'buy') {
            quantity += item.quantity;
          } else {
            // Sell
            quantity -= item.quantity;
            // Negative balance check moved after processing item
          }
        } else {
          // Event (item here is the mapped event from assetTimelines)
          // Map string alias for switch consistency if needed here too
          const mappedEventType = item.type; // Already mapped
          const originalStringType = item._originalStringType; // Get original string

          if (mappedEventType === SpecialEventType.STOCK_DIVIDEND) {
            quantity += item.quantity;
          // } else if (mappedEventType === SpecialEventType.SUBSCRIPTION) { // Ignorando esses eventos porque a B3 já adionou esse evento como "Compra"
          //   quantity += item.quantity;
          } else if (mappedEventType === SpecialEventType.STOCK_SPLIT) {
            // Use factor if available and valid
            if (
              item.factor &&
              typeof item.factor === 'number' &&
              item.factor > 1 &&
              initialQty !== 0
            ) {
              quantity = initialQty * item.factor;
            } else if (initialQty === 0) {
              console.warn(`[${assetCode}] Split event on ${item.date.toLocaleDateString()} but initial quantity was 0.`);

            } else {
              // Only warn if factor is missing/invalid AND initialQty was non-zero
              console.warn(`[${assetCode}] Split event on ${item.date.toLocaleDateString()} missing valid factor, using quantity from event: ${item.quantity}`);

              // Fallback or alternative logic if factor is missing/invalid?
            }
          } else if (mappedEventType === SpecialEventType.REVERSE_SPLIT) {
            // Use factor if available and valid
            if (
              item.factor &&
              typeof item.factor === 'number' &&
              item.factor > 1 &&
              initialQty !== 0
            ) {
              quantity = initialQty / item.factor;
            } else if (initialQty === 0) {
              console.warn(`[${assetCode}] Reverse split event on ${item.date.toLocaleDateString()} but initial quantity was 0.`);

            } else {
              console.warn(`[${assetCode}] Reverse split event on ${item.date.toLocaleDateString()} missing valid factor, using quantity from event: ${item.quantity}`);

              // Fallback logic?
            }
          } else if (mappedEventType === SpecialEventType.OTHER) {
            // Check original string type
            if (
              originalStringType === 'Atualização' 
              // || originalStringType === 'Direito de Subscrição' // Ignorando esses eventos porque a B3 já adionou esse evento como "Compra"
            ) {
              quantity += item.quantity;
            } else if (
              // originalStringType === 'Cessão de Direitos - Solicitada' || // Ignorando esses eventos porque a B3 já adionou esse evento como "Compra"
              originalStringType === 'Fração em Ativos'
            ) {
              quantity -= item.quantity;
            }
          }
          // Rounding to avoid float issues
          // Default case is handled implicitly - no action for unrecognized event types
          // Arredondar para evitar problemas com floats em splits/grupamentos
          quantity = Math.round(quantity * 10000) / 10000;
        }

        // Check for negative balance immediately after processing the item
        if (quantity < -0.0001) {
          // Allow small tolerance for floating point
          inconsistencies.push({
            type: 'warning',
            message: 'Saldo negativo detectado durante a validação',
            details: `Operação/Evento ${item._type} (${item._originalStringType ?? item.type}) de ${
              item.quantity
            } ${
              item.assetCode
            } em ${item.date.toLocaleDateString()} resultou em saldo ${quantity.toFixed(
              4
            )}. Verifique dados faltantes.`,
            assetCode: item.assetCode,
            date: item.date,
            locationInfo:
              item.fileName && item.rowNumber ? `${item.fileName}:L${item.rowNumber}` : undefined,
          });
          // Não resetar quantity para permitir ver o tamanho da discrepância
        }
      }
    }
  }
}
