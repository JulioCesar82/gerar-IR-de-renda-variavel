/**
 * Represents a special event from B3
 */
export interface SpecialEvent {
  /**
   * The date of the event
   */
  date: Date;
  
  /**
   * The year of the event
   */
  year: number;
  
  /**
   * The month of the event
   */
  month: number;
  
  /**
   * The type of event
   */
  type: SpecialEventType;

  /**
   * The original type string from the source file
   */
  originalType?: string;

  /**
   * The operation type (Credit or Debit)
   */
  operationType?: 'Credito' | 'Debito';
  
  /**
   * The asset code (ticker)
   */
  assetCode: string;
  
  /**
   * The asset name
   */
  assetName: string;
  
  /**
   * The quantity of assets
   */
  quantity: number;
  
  /**
   * The unit price
   */
  unitPrice: number;
  
  /**
   * The total value
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
   * The asset category
   */
  assetCategory: string;
  
  /**
   * The broker name
   */
  brokerName: string;
  
  /**
   * The broker code
   */
  brokerCode: string;
  
  /**
   * Additional information about the event
   */
  description?: string;
  
  /**
   * The row number in the original file (for debugging)
   */
  rowNumber?: number;
  
  /**
   * The file name (for debugging)
   */
  fileName?: string;

  factor?: number;
}

/**
 * Special event types
 */
export enum SpecialEventType {
  DIVIDEND = 'Dividendo',                                // Dividendos
  JCP = 'Juros sobre capital próprio',                   // Juros sobre capital próprio
  STOCK_DIVIDEND = 'Bonificação em ações',               // Bonificação em ações
  STOCK_SPLIT = 'Desdobro',                              // Desdobramento
  REVERSE_SPLIT = 'Grupamento',                          // Grupamento
  // SUBSCRIPTION = 'Subscrição',                           // Subscrição
  AMORTIZATION = 'Amortização',                          // Amortização
  INCOME = 'Rendimento',                                 // Rendimentos
  // RIGHTS_EXERCISE = 'Cessão de Direitos - Solicitada',   // Exercício de direitos
  AUCTION = 'Leilão',                                    // Leilão
  OTHER = 'Outros'                                       // Outros
}
