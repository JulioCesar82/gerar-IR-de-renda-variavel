import { B3FileParser } from '../B3FileParser';
import { Transaction } from '../../../core/domain/Transaction';

class TestableB3FileParser extends B3FileParser {
  public parseNegotiationData(data: any[]): Transaction[] {
    return this.processNegotiationData(data);
  }
}

describe('B3FileParser', () => {
  describe('processNegotiationData - fees/taxes (BUG-003)', () => {
    const parser = new TestableB3FileParser();

    it('should not double-count "I.R.R.F." and "Impostos" in fees + taxes for a day-trade sell', () => {
      const row = {
        'Data do Negócio': '10/01/2025',
        'Código de Negociação': 'PETR4',
        'Compra/Venda': 'Venda',
        'Mercado': 'Mercado a Vista',
        'Quantidade': '100',
        'Preço': '30,00',
        'Valor': '3000,00',
        'Taxa de Liquidação': '0,50',
        'Emolumentos': '0,30',
        'I.R.R.F.': '2,00',
        'Impostos': '1,00',
      };

      const [transaction] = parser.parseNegotiationData([row]);

      // fees = Taxa de Liquidação + Emolumentos = 0.80 (IRRF/Impostos must NOT be here)
      expect(transaction.fees).toBeCloseTo(0.8, 2);
      // taxes = I.R.R.F. + Impostos = 3.00
      expect(transaction.taxes).toBeCloseTo(3.0, 2);
      // netValue (sell) = totalValue - fees - taxes = 3000 - 0.80 - 3.00 = 2996.20
      // (previously: 3000 - (0.80 + 3.00) - 3.00 = 2993.20, double counting IRRF/Impostos)
      expect(transaction.netValue).toBeCloseTo(2996.2, 2);
    });

    it('should not double-count "I.R.R.F." and "Impostos" in fees + taxes for a buy', () => {
      const row = {
        'Data do Negócio': '10/01/2025',
        'Código de Negociação': 'PETR4',
        'Compra/Venda': 'Compra',
        'Mercado': 'Mercado a Vista',
        'Quantidade': '100',
        'Preço': '30,00',
        'Valor': '3000,00',
        'Taxa de Liquidação': '0,50',
        'I.R.R.F.': '2,00',
        'Impostos': '1,00',
      };

      const [transaction] = parser.parseNegotiationData([row]);

      expect(transaction.fees).toBeCloseTo(0.5, 2);
      expect(transaction.taxes).toBeCloseTo(3.0, 2);
      // netValue (buy) = totalValue + fees + taxes = 3000 + 0.50 + 3.00 = 3003.50
      expect(transaction.netValue).toBeCloseTo(3003.5, 2);
    });
  });
});
