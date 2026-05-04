import * as XLSX from 'xlsx';

import { FileParserPort } from '../../core/interfaces/FileParserPort';
import { Transaction, MarketType, AssetCategory } from '../../core/domain/Transaction';
import { SpecialEvent, SpecialEventType } from '../../core/domain/SpecialEvent';
import { assetCategoryOverrides } from '../data/staticAssetCategoryOverrides';

/**
 * Implementation of the FileParserPort interface for B3 files
 */
export class B3FileParser implements FileParserPort {
  /**
   * Parse a negotiation file (Excel) from B3
   * @param file The file to parse
   * @returns A promise that resolves to an array of transactions
   */
  async parseNegotiationFile(file: File): Promise<Transaction[]> {
    try {
      console.log('B3FileParser: Starting to parse negotiation file:', file.name, 'Type:', file.type);
      
      let data: any[];
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      
      if (fileExtension === 'json') {
        data = await this.readJsonFile(file);
        console.log('B3FileParser: JSON file read and parsed successfully, row count:', data.length);
      } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
        const workbook = await this.readExcelFile(file);
        console.log('B3FileParser: Excel file read successfully, sheet names:', workbook.SheetNames);
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        console.log('B3FileParser: Using worksheet:', workbook.SheetNames[0]);
        data = XLSX.utils.sheet_to_json(worksheet);
        console.log('B3FileParser: Converted worksheet to JSON, row count:', data.length);
      } else {
        throw new Error(`Unsupported file type: ${fileExtension}. Please provide an Excel (.xlsx, .xls) or JSON (.json) file.`);
      }
      
      console.log('B3FileParser: Sample data (first row):', data.length > 0 ? data[0] : 'No data');
      
      // Log all column names from the first row 
      if (data.length > 0 && typeof data[0] === 'object' && data[0] !== null) {
        console.log('B3FileParser: Column names in Excel file:', Object.keys(data[0]));
      }
      
      const transactions = this.processNegotiationData(data, file.name);
      console.log('B3FileParser: Processed negotiation data, transaction count:', transactions.length);
      
      return transactions;
    } catch (error) {
      console.error('B3FileParser: Error parsing negotiation file:', error);
      throw new Error('Erro ao processar arquivo de negociação: ' + (error as Error).message);
    }
  }
  
  /**
   * Parse a movement file (Excel) from B3
   * @param file The file to parse
   * @returns A promise that resolves to an array of special events
   */
  async parseMovementFile(file: File): Promise<SpecialEvent[]> {
    try {
      console.log('B3FileParser: Starting to parse movement file:', file.name, 'Type:', file.type);
      
      let data: any[];
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      
      if (fileExtension === 'json') {
        data = await this.readJsonFile(file);
        console.log('B3FileParser: JSON file read and parsed successfully, row count:', data.length);
      } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
        const workbook = await this.readExcelFile(file);
        console.log('B3FileParser: Excel file read successfully, sheet names:', workbook.SheetNames);
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        console.log('B3FileParser: Using worksheet:', workbook.SheetNames[0]);
        data = XLSX.utils.sheet_to_json(worksheet);
        console.log('B3FileParser: Converted worksheet to JSON, row count:', data.length);
      } else {
        throw new Error(`Unsupported file type: ${fileExtension}. Please provide an Excel (.xlsx, .xls) or JSON (.json) file.`);
      }
      
      const specialEvents = this.processMovementData(data, file.name);
      console.log('B3FileParser: Processed movement data, event count:', specialEvents.length);
      
      return specialEvents;
    } catch (error) {
      console.error('Error parsing movement file:', error);
      throw new Error('Erro ao processar arquivo de movimentação: ' + (error as Error).message);
    }
  }
  
  /**
   * Read an Excel file
   * @param file The file to read
   * @returns A promise that resolves to a workbook
   */
  private async readExcelFile(file: File): Promise<XLSX.WorkBook> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          resolve(workbook);
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = (error) => {
        reject(error);
      };
      
      reader.readAsArrayBuffer(file);
    });
  }

  /**
   * Read a JSON file
   * @param file The file to read
   * @returns A promise that resolves to an array of objects
   */
  private async readJsonFile(file: File): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          const jsonData = JSON.parse(text);
          if (!Array.isArray(jsonData)) {
            throw new Error('JSON file content must be an array.');
          }
          resolve(jsonData);
        } catch (error) {
          console.error('B3FileParser: Error parsing JSON file:', error);
          reject(new Error('Erro ao processar arquivo JSON: ' + (error as Error).message));
        }
      };

      reader.onerror = (error) => {
        console.error('B3FileParser: Error reading JSON file:', error);
        reject(error);
      };

      reader.readAsText(file);
    });
  }
  
  /**
   * Process negotiation data
   * @param data The data to process
   * @param fileName The name of the file
   * @returns An array of transactions
   */
  protected processNegotiationData(data: any[], fileName: string = 'negociacao.xlsx'): Transaction[] {
    const transactions: Transaction[] = [];
    
    // Log column names from the first row
    if (data.length > 0 && typeof data[0] === 'object' && data[0] !== null) {
      console.log('B3FileParser: Column names in Excel file:', Object.keys(data[0]));
    }
    
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      // Skip header rows or empty rows
      if (!row['Data do Negócio'] || !row['Código de Negociação']) {
        continue;
      }
      
      // Log the raw row data for debugging
      // console.log(`B3FileParser: Processing row ${i + 2}:`, row); 
      
      // Store the row number (add 2 because Excel is 1-indexed and we have a header row)
      const rowNumber = i + 2;
      
      const date = this.parseDate(row['Data do Negócio']);
      
      // Check for transaction type in different possible field names
      let type: 'buy' | 'sell';
      if (row['Compra/Venda'] !== undefined) {
        type = this.parseTransactionType(row['Compra/Venda']);
      } else if (row['Tipo de Movimentação'] !== undefined) {
        type = this.parseTransactionType(row['Tipo de Movimentação']);
      } else if (row['Tipo'] !== undefined) {
        type = this.parseTransactionType(row['Tipo']);
      } else {
        type = 'buy'; // Default
      }
      
      const marketType = this.parseMarketType(row['Mercado']);
      const assetCode = this.getAssetKey(row['Código de Negociação']);
      const assetName = row['Especificação do Ativo'] || assetCode;
      const quantity = this.parseNumber(row['Quantidade']);
      const unitPrice = this.parseNumber(row['Preço'] || row['Preço (R$)']);
      const totalValue = this.parseNumber(row['Valor'] || row['Valor Total (R$)']);
      const fees = this.calculateFees(row);
      const taxes = this.calculateTaxes(row);
      const netValue = type === 'buy' ? totalValue + fees + taxes : totalValue - fees - taxes;
      const assetCategory = this.determineAssetCategory(assetCode, marketType);
      const brokerName = row['Instituição'] || 'B3';
      const brokerCode = row['Código da Instituição'] || '';
      
      transactions.push({
        date,
        year: date.getFullYear(),
        month: date.getMonth() + 1,
        type,
        marketType,
        assetCode,
        assetName,
        quantity,
        unitPrice,
        totalValue,
        fees,
        taxes,
        netValue,
        assetCategory,
        brokerName,
        brokerCode,
        rowNumber,
        fileName
      });
    }
    
    return transactions;
  }
  
  /**
   * Process movement data
   * @param data The data to process
   * @param fileName The name of the file
   * @returns An array of special events
   */
  protected processMovementData(data: any[], fileName: string = 'movimentacao.xlsx'): SpecialEvent[] {
    const specialEvents: SpecialEvent[] = [];

    // Helper to get value from row handling encoding issues
    const getValue = (row: any, possibleNames: string[]) => {
      for (const name of possibleNames) {
        if (row[name] !== undefined && row[name] !== null) return row[name];
      }
      return undefined;
    };
    
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const dateStr = getValue(row, ['Data', 'Data do Evento', 'Data do Negócio']);
      const productStr = getValue(row, ['Produto', 'Ativo', 'Código de Negociação']);

      // Skip header rows or empty rows
      if (!dateStr || !productStr) {
        console.log(`Skipping row ${i + 2} due to missing date or product:`, row);
        continue;
      }
      // Store the row number (add 2 because Excel is 1-indexed and we have a header row)
      const rowNumber = (row as any)._original_index || i + 2;
      
      const date = this.parseDate(dateStr);
      const eventStr = getValue(row, ['Movimentação', 'Movimentacao', 'Tipo de Movimentação']);
      const type = this.parseEventType(eventStr || '');
      const assetCode = this.getAssetKey(productStr);
      const assetName = productStr; // Use raw product string for name
      const quantity = this.parseNumber(getValue(row, ['Quantidade', 'Qtd']) || 0);
      const unitPrice = this.parseNumber(getValue(row, ['Preço unitário', 'Preço Unitário', 'PreÃ§o unitÃ¡rio', 'Preco unitario', 'Preço']) || 0);
      const totalValue = this.parseNumber(getValue(row, ['Valor da Operação', 'Valor da OperaÃ§Ã£o', 'Valor da Operacao', 'Valor']) || 0);
      const fees = this.parseNumber(getValue(row, ['Taxa']) || 0);
      const taxes = this.parseNumber(getValue(row, ['Imposto']) || 0);
      const netValue = totalValue - fees - taxes;
      const assetCategory = this.determineAssetCategory(assetCode, productStr);
      const brokerName = getValue(row, ['Instituição', 'Instituicao', 'Corretora']) || 'B3';
      const brokerCode = getValue(row, ['Código da Instituição', 'Codigo da Instituicao']) || '';
      const description = getValue(row, ['Observação', 'Observacao']) || '';
      
      const rawOperationType = getValue(row, ['Entrada/Saída', 'Entrada/Saida', 'Entrada/SaÃ­da', 'Tipo']);
      let operationType: 'Credito' | 'Debito' | undefined = undefined;
      if (rawOperationType) {
        const normalized = rawOperationType.trim().toUpperCase();
        if (normalized.includes('CREDITO') || normalized.includes('CRÉDITO') || normalized === 'C') operationType = 'Credito';
        else if (normalized.includes('DEBITO') || normalized.includes('DÉBITO') || normalized === 'D') operationType = 'Debito';
      }

      specialEvents.push({
        date,
        year: date.getFullYear(),
        month: date.getMonth() + 1,
        type,
        originalType: eventStr,
        operationType,
        assetCode,
        assetName,
        quantity,
        unitPrice,
        totalValue,
        fees,
        taxes,
        netValue,
        assetCategory,
        brokerName,
        brokerCode,
        description,
        rowNumber,
        fileName
      });
    }
    
    return specialEvents;
  }
  
  /**
   * Parse a date string
   * @param dateStr The date string to parse
   * @returns A Date object
   */
  private parseDate(dateStr: string): Date {
    if (!dateStr) {
      return new Date();
    }
    
    // Handle different date formats
    const formats = [
      /(\d{2})\/(\d{2})\/(\d{4})/, // DD/MM/YYYY
      /(\d{2})-(\d{2})-(\d{4})/, // DD-MM-YYYY
      /(\d{4})-(\d{2})-(\d{2})/ // YYYY-MM-DD
    ];
    
    for (const format of formats) {
      const match = dateStr.match(format);
      if (match) {
        if (format === formats[2]) {
          // YYYY-MM-DD
          return new Date(parseInt(match[1]), parseInt(match[2]) - 1, parseInt(match[3]));
        } else {
          // DD/MM/YYYY or DD-MM-YYYY
          return new Date(parseInt(match[3]), parseInt(match[2]) - 1, parseInt(match[1]));
        }
      }
    }
    
    // Fallback to Date.parse
    const parsedDate = new Date(Date.parse(dateStr));
    if (!isNaN(parsedDate.getTime())) {
      return parsedDate;
    }
    
    throw new Error(`Formato de data inválido: ${dateStr}`);
  }
  
  /**
   * Parse a transaction type
   * @param typeStr The type string to parse
   * @returns The transaction type
   */
  private parseTransactionType(typeStr: string): 'buy' | 'sell' {
    if (!typeStr) {
      return 'buy';
    }
    
    const buyTerms = ['C', 'COMPRA', 'BUY', 'B'];
    const sellTerms = ['V', 'VENDA', 'SELL', 'S'];
    
    const normalizedType = typeStr.trim().toUpperCase();
    
    if (buyTerms.includes(normalizedType)) {
      return 'buy';
    } else if (sellTerms.includes(normalizedType)) {
      return 'sell';
    }
    
    // Check if the type contains any of the terms
    for (const term of buyTerms) {
      if (normalizedType.includes(term)) {
        return 'buy';
      }
    }
    
    for (const term of sellTerms) {
      if (normalizedType.includes(term)) {
        return 'sell';
      }
    }
    
    // Default to buy if unknown
    return 'buy';
  }
  
  /**
   * Parse a market type
   * @param marketStr The market string to parse
   * @returns The market type
   */
  private parseMarketType(marketStr: string): MarketType {
    if (!marketStr) {
      return MarketType.SPOT;
    }
    
    const normalizedMarket = marketStr.trim().toUpperCase();
    
    if (normalizedMarket.includes('VISTA')) {
      return MarketType.SPOT;
    } else if (normalizedMarket.includes('OPÇÃO') || normalizedMarket.includes('OPTION')) {
      return MarketType.OPTIONS;
    } else if (normalizedMarket.includes('TERMO') || normalizedMarket.includes('TERM')) {
      return MarketType.TERM;
    } else if (normalizedMarket.includes('FUTURO') || normalizedMarket.includes('FUTURE')) {
      return MarketType.FUTURES;
    } else if (normalizedMarket.includes('FRACIONÁRIO') || normalizedMarket.includes('FRACTIONAL')) {
      return MarketType.FRACTIONAL;
    }
    
    // Default to spot if unknown
    return MarketType.SPOT;
  }
  
  /**
   * Normalize an asset code
   * @param assetCode The asset code to normalize
   * @returns The normalized asset code
   */
  private getAssetKey(assetCode: string): string {
    // Normalize asset code by removing the 'F' suffix for fractional shares
    // This ensures that ITSA4 and ITSA4F are treated as the same asset
    
    // This ensures that 'PETR4 - PETROBRAS PN' and PETR4 are treated as the same asset

    // Remove spaces and convert to uppercase
    
    const ticker: string = assetCode.split(' - ')[0].toUpperCase().trim();

    return ticker.endsWith('F') ? ticker.slice(0, -1) : ticker;
  }
  
  /**
   * Parse a number
   * @param value The value to parse
   * @returns The parsed number
   */
  private parseNumber(value: any): number {
    if (value === undefined || value === null || value === '') {
      return 0;
    }
    
    if (typeof value === 'number') {
      return value;
    }
    
    if (typeof value === 'string') {
      let normalizedValue = value.replace(/[^\d,.-]/g, ''); // Keep minus sign for negative numbers
      
      // Check if comma exists and is likely the decimal separator
      const commaIndex = normalizedValue.lastIndexOf(',');
      const dotIndex = normalizedValue.lastIndexOf('.');
      
      if (commaIndex > dotIndex) {
        // Comma is likely the decimal separator (e.g., "1.234,56" or "123,45")
        normalizedValue = normalizedValue.replace(/\./g, '').replace(',', '.');
      } else {
        // Dot is likely the decimal separator or no separator exists (e.g., "1234.56" or "123")
        // Remove commas if they exist (as thousand separators)
        normalizedValue = normalizedValue.replace(/,/g, '');
      }
      
      const parsed = parseFloat(normalizedValue);
      return isNaN(parsed) ? 0 : parsed;
    }
    
    return 0;
  }
  
  /**
   * Calculate fees
   * @param row The row to calculate fees from
   * @returns The calculated fees
   */
  private calculateFees(row: any): number {
    let fees = 0;
    
    // Add up all fee fields
    const feeFields = [
      'Taxa de Liquidação',
      'Taxa de Registro',
      'Taxa de Termo/Opções',
      'Taxa A.N.A.',
      'Emolumentos',
      'Taxa Operacional',
      'Execução',
      'Taxa de Custódia',
      'Impostos',
      'I.R.R.F.',
      'Outros'
    ];
    
    for (const field of feeFields) {
      if (row[field]) {
        fees += this.parseNumber(row[field]);
      }
    }
    
    return fees;
  }
  
  /**
   * Calculate taxes
   * @param row The row to calculate taxes from
   * @returns The calculated taxes
   */
  private calculateTaxes(row: any): number {
    let taxes = 0;
    
    // Add up all tax fields
    const taxFields = [
      'I.R.R.F.',
      'Impostos'
    ];
    
    for (const field of taxFields) {
      if (row[field]) {
        taxes += this.parseNumber(row[field]);
      }
    }
    
    return taxes;
  }
  
  /**
   * Determine the asset category
   * @param assetCode The asset code
   * @param marketType The market type
   * @returns The asset category
   */
  private determineAssetCategory(assetCode: string, marketType: MarketType): AssetCategory {
    if (!assetCode) {
      return AssetCategory.OTHER;
    }

    // Check for static overrides first
    if (assetCategoryOverrides[assetCode]) {
      return assetCategoryOverrides[assetCode];
    }
    
    // Check for options
    if (marketType === MarketType.OPTIONS) {
      return AssetCategory.OPTION;
    }
    
    // Check for FIIs (Real Estate Investment Funds)
    if (assetCode.endsWith('11') || assetCode.includes('FII')) {
      return AssetCategory.FII;
    }
    
    // Check for ETFs
    if (assetCode.endsWith('11B') || assetCode.includes('ETF')) {
      return AssetCategory.ETF;
    }
    
    // Check for BDRs (Brazilian Depositary Receipts)
    if (assetCode.endsWith('34') || assetCode.includes('BDR')) {
      return AssetCategory.BDR;
    }
    
    // Check for subscription rights
    // if (assetCode.includes('DIR') || assetCode.includes('SUB')) { // Ignorando esses eventos porque a B3 já adionou esse evento como "Compra"
    //   return AssetCategory.SUBSCRIPTION_RIGHT; // Ignorando esses eventos porque a B3 já adionou esse evento como "Compra"
    // }
    
    // Check for debentures
    if (assetCode.includes('DEB')) {
      return AssetCategory.DEBENTURE;
    }
    
    // Default to stock
    return AssetCategory.STOCK;
  }

  /**
   * Parse an event type
   * @param eventStr The event string to parse
   * @returns The event type
   */
  private parseEventType(eventStr: string): SpecialEventType {
    if (!eventStr) {
      return SpecialEventType.OTHER;
    }
    
    const normalizedEvent = eventStr.trim().toUpperCase();
    
    // Dividends
    if (normalizedEvent.includes('DIVIDENDO') || normalizedEvent.includes('DIVIDEND')) {
      return SpecialEventType.DIVIDEND;
    }
    // JCP (Interest on Own Capital)
    else if (normalizedEvent.includes('JCP') || normalizedEvent.includes('JUROS SOBRE CAPITAL')) {
      return SpecialEventType.JCP;
    }
    // Stock Dividends (Bonificação)
    else if (
      normalizedEvent.includes('BONIFICAÇÃO') ||
      normalizedEvent.includes('BONIFICAÇÃO EM ATIVOS') ||
      normalizedEvent.includes('BONIFICACAO') ||
      normalizedEvent.includes('BONIFICATION')
    ) {
      return SpecialEventType.STOCK_DIVIDEND;
    }
    // Stock Splits
    else if (
      normalizedEvent.includes('DESDOBRAMENTO') ||
      normalizedEvent.includes('SPLIT') ||
      normalizedEvent.includes('DESDOBRO')
    ) {
      return SpecialEventType.STOCK_SPLIT;
    }
    // Reverse Splits
    else if (normalizedEvent.includes('GRUPAMENTO') || normalizedEvent.includes('REVERSE SPLIT')) {
      return SpecialEventType.REVERSE_SPLIT;
    }
    // Subscriptions
    // else if (
    //   normalizedEvent.includes('SUBSCRIÇÃO') || // Ignorando esses eventos porque a B3 já adionou esse evento como "Compra"
    //   normalizedEvent.includes('SUBSCRIPTION') || // Ignorando esses eventos porque a B3 já adionou esse evento como "Compra"
    //   normalizedEvent.includes('SUBSCRICAO') // Ignorando esses eventos porque a B3 já adionou esse evento como "Compra"
    // ) {
    //   return SpecialEventType.SUBSCRIPTION;// Ignorando esses eventos porque a B3 já adionou esse evento como "Compra"
    // }
    // Amortizations
    else if (
      normalizedEvent.includes('AMORTIZAÇÃO') ||
      normalizedEvent.includes('AMORTIZATION') ||
      normalizedEvent.includes('AMORTIZACAO')
    ) {
      return SpecialEventType.AMORTIZATION;
    }
    // Income (Rendimentos)
    else if (normalizedEvent.includes('RENDIMENTO') || normalizedEvent.includes('INCOME')) {
      return SpecialEventType.INCOME;
    }
    // Rights Exercise
    // else if (
    //   normalizedEvent.includes('EXERCÍCIO') || // Ignorando esses eventos porque a B3 já adionou esse evento como "Compra"
    //   normalizedEvent.includes('EXERCISE') || // Ignorando esses eventos porque a B3 já adionou esse evento como "Compra"
    //   normalizedEvent.includes('EXERCICIO') || // Ignorando esses eventos porque a B3 já adionou esse evento como "Compra"
    //   normalizedEvent.includes('CESSÃO DE DIREITOS') // Ignorando esses eventos porque a B3 já adionou esse evento como "Compra"
    // ) {
    //   return SpecialEventType.RIGHTS_EXERCISE;
    // }
    // Auctions
    else if (
      normalizedEvent.includes('LEILÃO') ||
      normalizedEvent.includes('AUCTION') ||
      normalizedEvent.includes('LEILAO') ||
      normalizedEvent.includes('LEILÃO DE FRAÇÃO')
    ) {
      return SpecialEventType.AUCTION;
    }
    // Fractions - Map to OTHER since there's no specific enum value
    else if (
      normalizedEvent.includes('FRAÇÃO') ||
      normalizedEvent.includes('FRACAO') ||
      normalizedEvent.includes('FRAÇÃO EM ATIVOS')
    ) {
      // Fraction events are handled by AssetProcessor under OTHER type
      return SpecialEventType.OTHER;
    }
    // Transfer - Map explicitly to OTHER
    // Use substrings to avoid encoding issues with special characters (Ã, Ã, etc.)
    else if (
      normalizedEvent.includes('TRANSFERÊNCIA - LIQUIDAÇÃO') ||
      (normalizedEvent.includes('TRANSFER') && normalizedEvent.includes('LIQUIDA')) ||
      (normalizedEvent.includes('TRANSFER') && !normalizedEvent.includes('EMPR'))
    ) {
      return SpecialEventType.OTHER;
    }
    // Loans - Map to OTHER since there's no specific enum value
    else if (
      normalizedEvent.includes('EMPRÉSTIMO') ||
      normalizedEvent.includes('EMPRESTIMO') ||
      normalizedEvent.includes('LOAN')
    ) {
      // Log that we're mapping this to OTHER
      console.warn(`B3FileParser: Mapping loan event "${eventStr}" to OTHER`);
      return SpecialEventType.OTHER;
    }

    // Log unrecognized event types to help identify missing mappings
    console.warn(`B3FileParser: Unrecognized event type: "${eventStr}" - mapping to OTHER`);

    // Default to other if unknown
    return SpecialEventType.OTHER;
  }
}
