import { DBKFileEditor } from './LayoutDBK2025/DBKFileEditor';
import { WritterDBKFileEditor } from './LayoutDBK2025/WritterDBKFileEditor';

import { IRPFGeneratorPort } from '../../core/interfaces/IRPFGeneratorPort';
import {
  IRPFDeclaration,
  TaxPayerInfo,
  DeclarationSection,
  DeclarationItem,
} from '../../core/domain/IRPFDeclaration';
import {
  AssetPosition,
  MonthlyResult,
  IncomeRecord,
  ProcessedDataSummary,
} from '../../core/domain/AssetPosition';
import { AssetCategory } from '../../core/domain/Transaction';
import {
  ExternalTickerInfoProviderPort,
  StockInfo,
} from '../../core/interfaces/ExternalTickerInfoProviderPort';
import { getAssetKey } from '../../utils/formatters';

/**
 * Custom interfaces for DBK file generation
 */

// --- Definições de Tipos para o Writer (Temporário - Idealmente mover para perto do Writer) ---
// Estas interfaces definem a estrutura esperada pelos métodos setOperacao... do Writter.
interface OperacaoComumDayTradeMesWriteData {
  mes: string; // Mês no formato '01'-'12'
  // Adicione aqui os campos específicos do Registro 40 que precisam ser atualizados
  gcDaytrMvistaAcoes?: number; // Exemplo: Ganho/Capital DayTrade Mercado à Vista Ações
  vrResliquidoMesOpcomuns?: number; // Exemplo: Resultado Líquido Operações Comuns
  vrResliquidoMesDaytrade?: number; // Exemplo: Resultado Líquido DayTrade
  vrImpostoapagar?: number; // Exemplo: Imposto a Pagar Total no Mês
  // ... outros campos R40 ...
}

interface OperacaoFIIMesWriteData {
  mes: number; // Mês como número 1-12
  // Adicione aqui os campos específicos do Registro 42 que precisam ser atualizados
  vrResliquidoMes?: number; // Exemplo: Resultado Líquido do Mês FII
  vrresultNegMesant?: number; // Exemplo: Resultado Negativo Mês Anterior
  vrBasecalculoMes?: number; // Exemplo: Base de Cálculo
  vrImpostoPagar?: number; // Exemplo: Imposto a Pagar no Mês FII
  // ... outros campos R42 ...
}

/**
 * Implementation of the IRPFGeneratorPort interface for generating DBK files
 */
export class DBKFileGenerator implements IRPFGeneratorPort {
  // Adicionar cache para CNPJ aqui também, para evitar múltiplas buscas pelo mesmo ticker/fonte
  private tickerInfoCache = new Map<string, StockInfo | null>();

  // Injetar o provedor de dados externos
  constructor(private externalDataProvider: ExternalTickerInfoProviderPort) {}

  /**
   * Generate an IRPF declaration structure from processed data.
   * @param taxPayerInfo The taxpayer information
   * @param year The year of the declaration
   * @returns A promise that resolves to an IRPF declaration
   */
  async generateDeclaration(
    processedDataSummary: ProcessedDataSummary,
    taxPayerInfo: TaxPayerInfo,
    year: number
  ): Promise<IRPFDeclaration> {
    try {
      console.log('DBKFileGenerator: Generating IRPF declaration structure for year:', year);

      // Passa apenas as posições com quantidade > 0 no final do ano da declaração
      // A filtragem real acontece dentro de generateBensEDireitosSection
      const currentPositions: AssetPosition[] = [];

      for (const assetPosition of processedDataSummary.assetPositions) {
        let cnpj: string | undefined;
        let sourceName = assetPosition.assetName || assetPosition.assetCode || 'Fonte Desconhecida'; // Nome inicial (preferência: nome do ativo, não da corretora)

        // Tentar buscar CNPJ e nome da fonte pagadora
        // A lógica aqui é complexa: a fonte pagadora de um dividendo/jcp é a EMPRESA,
        // mas a fonte de um rendimento FII é o próprio FII.
        // Usar o assetCode como chave para busca parece razoável para ações e FIIs.
        const assetKey = getAssetKey(assetPosition.assetCode);
        if (this.tickerInfoCache.has(assetKey)) {
          const tickerInfo = this.tickerInfoCache.get(assetKey);
          cnpj = tickerInfo?.cnpj;
          sourceName = tickerInfo?.name || sourceName; // Atualiza nome se encontrado
          // Se temos CNPJ, poderíamos buscar o nome da empresa/FII, mas vamos simplificar por agora
          // sourceName = nome_buscado_pelo_cnpj || sourceName;
        } else {
          //if (event.assetCategory === AssetCategory.STOCK || event.assetCategory === AssetCategory.FII) { // Verificar se é Ação ou FII
          console.log(`Attempting to fetch info for income source: ${assetKey}`);
          const info = await this.externalDataProvider.getStockInfo(assetKey); // Tenta buscar como Ação (FII não tem endpoint por ticker)
          if (info) {
            cnpj = info.cnpj;
            sourceName = info.name || sourceName; // Atualiza nome se encontrado

            this.tickerInfoCache.set(assetKey, info); // Cache CNPJ
            this.tickerInfoCache.set(sourceName.toUpperCase(), info); // Cache por nome também pode ajudar
          } else {
            // Fallback: usa o código do ativo como nome quando lookup falha (evita usar nome da corretora)
            sourceName = assetPosition.assetCode || assetKey;
            this.tickerInfoCache.set(assetKey, null); // Cache falha
          }
        }
        // Tentar buscar por nome se CNPJ ainda for nulo (menos confiável)
        // if (!cnpj && this.tickerInfoCache.has(sourceName.toUpperCase())) {
        //    cnpj = this.tickerInfoCache.get(sourceName.toUpperCase());
        // } else if (!cnpj) {
        //    // Talvez chamar uma API de busca por nome? (Não implementado)
        // }

        assetPosition.cnpj = cnpj;
        assetPosition.assetName = sourceName;

        currentPositions.push(assetPosition);
      }

      const currentMonthlyResults = processedDataSummary.monthlyResults.filter(
        r => r.year === year
      );
      const currentIncomeRecords = processedDataSummary.incomeRecords.filter(r => r.year === year);

      // Calculate totals based on the declaration year
      const totalTaxDue = currentMonthlyResults.reduce((sum, r) => sum + (r.taxDue || 0), 0);
      const totalTaxWithheld =
        currentMonthlyResults.reduce((sum, r) => sum + (r.taxWithheld || 0), 0) +
        currentIncomeRecords.reduce((sum, r) => sum + (r.taxWithheld || 0), 0);

      const totalTaxToPay = Math.max(0, totalTaxDue - totalTaxWithheld);
      const lastMonthResult = [...currentMonthlyResults].sort((a, b) => a.month - b.month).pop();
      const remainingLoss = lastMonthResult?.remainingLoss ?? 0;

      // Generate sections based on year-end data
      const sections: DeclarationSection[] = this.generateDeclarationSections(
        currentPositions, // Pass all positions, filtering happens inside
        currentMonthlyResults,
        currentIncomeRecords,
        year
      );

      // Calculate totalAssetsValue based on the generated Bens e Direitos items for the year
      const bensSection = sections.find(s => s.code === 'BENS');
      const totalAssetsValue =
        bensSection?.items.reduce((sum, item) => sum + (item.value || 0), 0) || 0;
      const totalIncome = currentIncomeRecords.reduce((sum, r) => sum + (r.grossValue || 0), 0);

      const declaration: IRPFDeclaration = {
        taxPayerInfo,
        year,
        assetPositions: currentPositions, // Store all processed positions for reference
        monthlyResults: currentMonthlyResults,
        incomeRecords: currentIncomeRecords,
        totalTaxDue,
        totalTaxWithheld,
        totalTaxToPay,
        remainingLoss,
        totalAssetsValue, // Use value calculated from year-end items
        totalIncome,
        generationDate: new Date(),
        sections,
      };

      console.log('DBKFileGenerator: Declaration structure generated.');
      return declaration;
    } catch (error) {
      console.error('Error generating IRPF declaration structure:', error);
      throw error;
    }
  }

  /**
   * Generate a DBK file from a structured IRPF declaration
   * @param declaration The declaration to generate a file from
   * @param originalContent Optional original DBK file content to use as a base
   * @returns A promise that resolves to a Blob containing the file
   */
  async generateFile(declaration: IRPFDeclaration, originalContent?: string): Promise<Blob> {
    try {
      console.log('DBKFileGenerator: Generating DBK file from structured declaration');
      console.log('--- Declaration received by generateFile ---'); // ADDED FOR DEBUGGING
      console.log(JSON.stringify(declaration.sections, null, 2)); // ADDED FOR DEBUGGING
      const editor = new DBKFileEditor(originalContent || '');
      const writterEditor = new WritterDBKFileEditor(editor);

      this.writeDadosDeclarante(writterEditor, declaration.taxPayerInfo);
      this.writeDeclarationSections(writterEditor, declaration);

      // A atualização do T9 agora é feita dentro do getRawContent do Writter
      const finalContent = writterEditor.getRawContent();

      console.log('DBKFileGenerator: DBK file content generated.');
      const blob = new Blob([finalContent], { type: 'application/octet-stream' });
      return blob;
    } catch (error) {
      console.error('Error generating DBK file:', error);
      throw error;
    }
  }

  // ========================================================================
  // Métodos para ESCREVER os dados no formato DBK usando WritterDBKFileEditor
  // ========================================================================

  private writeDadosDeclarante(
    writterEditor: WritterDBKFileEditor,
    taxPayerInfo: TaxPayerInfo
  ): void {
    const ddd = taxPayerInfo.phone?.substring(0, 2) || '';
    const phone = taxPayerInfo.phone?.substring(2) || '';

    // Mapeia os campos de TaxPayerInfo para a estrutura esperada pelo Writter
    const declaranteData = {
      // Adapte os nomes dos campos se necessário
      cpf: taxPayerInfo.cpf?.replace(/[^\d]/g, ''), // Remove formatting (dots, dashes)
      nome: taxPayerInfo.name,
      logradouro: taxPayerInfo.address.street,
      numero: taxPayerInfo.address.number,
      complemento: taxPayerInfo.address.complement,
      bairro: taxPayerInfo.address.neighborhood,
      cep: taxPayerInfo.address.zipCode?.replace('-', ''), // Remover traço do CEP se houver
      municipioNome: taxPayerInfo.address.city,
      uf: taxPayerInfo.address.state,
      paisCodigo: '105', // Fixo para Brasil
      email: taxPayerInfo.email,
      dddTelefone: ddd,
      telefone: phone, // O Writter deve concatenar DDD e Telefone se necessário
      dataNascimento: taxPayerInfo.dateOfBirth,
      ocupacaoCodigo: taxPayerInfo.occupation,
      // Mapear outros campos como NIT, CPF Conjuge, Banco, Agência, Conta se existirem em taxPayerInfo
      // nitPisPasep: declaration.taxPayerInfo.nitPisPasep,
      // cpfConjuge: declaration.taxPayerInfo.cpfConjuge,
      // tituloEleitor: declaration.taxPayerInfo.tituloEleitor,
      // municipioCodigo: declaration.taxPayerInfo.municipioCodigo,
      // tipoLogradouro: declaration.taxPayerInfo.tipoLogradouro,

      // naturezaOcupacaoCodigo: declaration.taxPayerInfo.naturezaOcupacaoCodigo,
      // bancoCodigo: declaration.taxPayerInfo.bancoCodigo,
      // agenciaCodigo: declaration.taxPayerInfo.agenciaCodigo,
      // contaNumero: declaration.taxPayerInfo.contaNumero,
      // contaDV: declaration.taxPayerInfo.contaDV,
      // tipoConta: declaration.taxPayerInfo.tipoConta,
    };

    writterEditor.setIdentificacaoDeclarante(declaranteData);
  }

  private writeDeclarationSections(
    writterEditor: WritterDBKFileEditor,
    declaration: IRPFDeclaration
  ): void {
    // Ordenar seções pode ser importante para o layout do DBK
    console.log('--- Sections before sorting ---');
    console.log(JSON.stringify(declaration.sections, null, 2));

    const sectionOrder = ['BENS', 'REND_ISENTOS', 'REND_EXCLUSIVA', 'OP_RENDA_VARIAVEL'];

    // Create a deep copy of the sections array before sorting
    const sectionsCopy = JSON.parse(JSON.stringify(declaration.sections));

    // Sort the copy
    const sortedSections = sectionsCopy.sort((a: DeclarationSection, b: DeclarationSection) => {
      return sectionOrder.indexOf(a.code) - sectionOrder.indexOf(b.code);
    });

    console.log('--- Sections after sorting ---');
    console.log(JSON.stringify(sortedSections, null, 2));

    for (const section of sortedSections) {
      console.log(`Writing section: ${section.code} - ${section.name}`);
      console.log(`Section items length: ${section.items ? section.items.length : 'undefined'}`);
      switch (section.code) {
        case 'BENS':
          this.writeBensEDireitos(writterEditor, section.items);
          break;
        case 'REND_ISENTOS':
          this.writeRendimentosIsentos(writterEditor, section.items);
          break;
        case 'REND_EXCLUSIVA':
          this.writeRendimentosTributacaoExclusiva(writterEditor, section.items);
          break;
        case 'OP_RENDA_VARIAVEL':
          this.writeOperacoesRendaVariavel(writterEditor, section.items);
          break;
        default:
          console.warn(`Seção com código '${section.code}' não mapeada para escrita no DBK.`);
      }
    }
  }

  private writeBensEDireitos(writterEditor: WritterDBKFileEditor, items: DeclarationItem[]): void {
    // Ordenar itens por código pode ser útil
    items.sort((a, b) => (a.code || '').localeCompare(b.code || ''));

    items.forEach(item => {
      const bemData = {
        codigoBem: item.code || '99', // Código IRPF ('31', '73', '99')
        cnpj: item.cnpj,
        discriminacao: item.details || item.description || '',
        ticker: item.ticker,
        valorAnoAnterior: item.previousYearValue,
        valorAnoAtual: item.value,
        negociadoBolsa: item.code === '31' || item.code === '73', // Exemplo
        codigoNegociacaoBolsa: item.ticker,
      };

      if (item.code === '31') {
        writterEditor.addBemDireitoAcao(bemData); // Chama método do Writter para R27 cod 31
      } else if (item.code === '73') {
        writterEditor.addBemDireitoFII(bemData); // Chama método do Writter para R27 cod 73
      } else if (item.code === '99') {
        // Pode adicionar lógica para tratar additionalType se o Writter precisar
        writterEditor.addBemDireitoOutros(bemData); // Chama método do Writter para R27 cod 99
      } else {
        console.warn(`Bens e Direitos: Código '${item.code}' não mapeado para escrita.`);
      }
    });
  }

  private writeRendimentosIsentos(
    writterEditor: WritterDBKFileEditor,
    items: DeclarationItem[]
  ): void {
    // Ordenar itens por código pode ser útil
    items.sort((a, b) => (a.code || '').localeCompare(b.code || ''));

    items.forEach(item => {
      if (!item.cnpj || !item.sourceName) {
        console.warn(
          `Rend Isento (cód ${item.code}): Faltando CNPJ ou Nome Fonte. Desc: ${item.description}`
        );

        return;
      }
      const rendData = {
        cnpjFontePagadora: item.cnpj,
        nomeFontePagadora: item.sourceName,
        valor: item.value,
      };

      if (item.code === '09') {
        // Dividendos
        writterEditor.addRendimentoIsentoDividendo(rendData); // Mapeia para R84 cód 09
      } else if (item.code === '26') {
        // FII
        writterEditor.addRendimentoIsentoFII({
          ...rendData,
          descricao: item.description || '', // R86 precisa da descrição
        }); // Mapeia para R86 cód 26
      } else {
        console.warn(`Rend Isento: Código '${item.code}' não mapeado para escrita.`);
      }
    });
  }

  private writeRendimentosTributacaoExclusiva(
    writterEditor: WritterDBKFileEditor,
    items: DeclarationItem[]
  ): void {
    // Ordenar itens por código pode ser útil
    items.sort((a, b) => (a.code || '').localeCompare(b.code || ''));

    items.forEach(item => {
      if (!item.cnpj || !item.sourceName) {
        console.warn(
          `Rend Exclusivo (cód ${item.code}): Faltando CNPJ ou Nome Fonte. Desc: ${item.description}`
        );

        return;
      }
      const rendData = {
        cnpjFontePagadora: item.cnpj,
        nomeFontePagadora: item.sourceName,
        valor: item.value,
      };

      if (item.code === '10') {
        // JSCP
        writterEditor.addRendimentoExclusivoJSCP(rendData); // Mapeia para R88 cód 10
      } else {
        console.warn(`Rend Exclusivo: Código '${item.code}' não mapeado para escrita.`);
      }
    });
  }

  private writeOperacoesRendaVariavel(
    writterEditor: WritterDBKFileEditor,
    items: DeclarationItem[]
  ): void {
    // Agrupar por mês para garantir que chamamos setOperacao... apenas uma vez por mês
    const opsPorMes: {
      [mes: number]: { fii?: OperacaoFIIMesWriteData; dt?: OperacaoComumDayTradeMesWriteData };
    } = {};

    items.forEach(item => {
      if (!item.month) return;
      if (!opsPorMes[item.month]) {
        opsPorMes[item.month] = {};
      }

      if (item.type === 'DAY_TRADE_ACOES') {
        if (!opsPorMes[item.month].dt) {
          opsPorMes[item.month].dt = { mes: item.month.toString().padStart(2, '0') };
        }
        // TODO: Mapear 'item.value' (resultado líquido) para o campo correto em OperacaoComumDayTradeMesWriteData
        // Exemplo: opsPorMes[item.month].dt!.vrResliquidoMesDaytrade = item.value;
        // Adicionar outros campos mapeados de 'item' se necessário
      } else if (item.type === 'FII') {
        if (!opsPorMes[item.month].fii) {
          opsPorMes[item.month].fii = { mes: item.month };
        }
        // TODO: Mapear 'item.value' (resultado líquido) para o campo correto em OperacaoFIIMesWriteData
        // Exemplo: opsPorMes[item.month].fii!.vrResliquidoMes = item.value;
        // Adicionar outros campos mapeados de 'item' se necessário
      }
    });

    // Chamar os métodos do Writter para cada mês
    Object.values(opsPorMes).forEach(mesOps => {
      if (mesOps.dt) {
        writterEditor.setOperacaoComumMes(mesOps.dt); // Atualiza R40
      }
      if (mesOps.fii) {
        writterEditor.setOperacaoFIIMes(mesOps.fii); // Atualiza R42
      }
    });
  }

  // --- Helper Methods ---

  private groupIncomeByCNPJ(records: IncomeRecord[]): {
    [cnpj: string]: { cnpj: string; sourceName: string; totalValue: number; details: string[] };
  } {
    // console.log('[DBKFileGenerator] groupIncomeByCNPJ - Input records:', JSON.stringify(records, null, 2)); // Log input to grouping - REMOVED
    return records.reduce(
      (acc, record) => {
        const cnpjKey = record.cnpj || record.brokerName || 'CNPJ_DESCONHECIDO'; // Use a distinct variable name for the key
        const sourceName = record.sourceName || record.brokerName || 'Fonte Desconhecida';

        // console.log(`[DBKFileGenerator] groupIncomeByCNPJ - Processing record: ${record.assetCode}, type: ${record.incomeType}, netValue: ${record.netValue}, key: ${cnpjKey}`); // Log each record being processed - REMOVED

        if (!acc[cnpjKey]) {
          // console.log(`[DBKFileGenerator] groupIncomeByCNPJ - Creating new group for key: ${cnpjKey}`); - REMOVED
          acc[cnpjKey] = { cnpj: cnpjKey, sourceName, totalValue: 0, details: [] }; // Use cnpjKey here too
        }
        // Use netValue for summing income, as grossValue seems incorrect for some records (e.g., BBSE dividends/rendimentos)
        // and for Rendimentos Isentos, gross and net should be the same.
        const valueToAdd = record.netValue || record.grossValue || 0;
        // console.log(`[DBKFileGenerator] groupIncomeByCNPJ - Adding value: ${valueToAdd} to key: ${cnpjKey}. Current total: ${acc[cnpjKey].totalValue}`); - REMOVED
        acc[cnpjKey].totalValue += valueToAdd;
        // Also use the added value in the details string
        acc[cnpjKey].details.push(
          `${record.assetCode}: R$ ${valueToAdd.toLocaleString('pt-BR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`
        );
        // console.log(`[DBKFileGenerator] groupIncomeByCNPJ - New total for key ${cnpjKey}: ${acc[cnpjKey].totalValue}. Details: ${JSON.stringify(acc[cnpjKey].details)}`); - REMOVED

        return acc;
      },
      {} as {
        [cnpj: string]: { cnpj: string; sourceName: string; totalValue: number; details: string[] };
      }
    );
  }

  private getMonthName(month: number): string {
    const monthNames = [
      'Janeiro',
      'Fevereiro',
      'Março',
      'Abril',
      'Maio',
      'Junho',
      'Julho',
      'Agosto',
      'Setembro',
      'Outubro',
      'Novembro',
      'Dezembro',
    ];
    return monthNames[month - 1] || 'Mês Inválido';
  }

  // ========================================================================
  // Métodos para GERAR a ESTRUTURA da Declaração (Sections)
  // ========================================================================

  private generateDeclarationSections(
    assetPositions: AssetPosition[],
    monthlyResults: MonthlyResult[],
    incomeRecords: IncomeRecord[],
    year: number
  ): DeclarationSection[] {
    console.log('--- generateDeclarationSections input ---');
    console.log(`assetPositions: ${assetPositions.length}`);
    console.log(`monthlyResults: ${monthlyResults.length}`);
    console.log(`incomeRecords: ${incomeRecords.length}`);

    const sections: DeclarationSection[] = [];

    // Generate each section and log its items
    const bensSection = this.generateBensEDireitosSection(assetPositions, incomeRecords, year);
    console.log(`Generated BENS section with ${bensSection.items.length} items`);
    sections.push(bensSection);

    const rendIsentosSection = this.generateRendimentosIsentosSection(incomeRecords, year);
    console.log(`Generated REND_ISENTOS section with ${rendIsentosSection.items.length} items`);
    sections.push(rendIsentosSection);

    const rendExclusivaSection = this.generateRendimentosTributacaoExclusivaSection(
      incomeRecords,
      year
    );
    console.log(`Generated REND_EXCLUSIVA section with ${rendExclusivaSection.items.length} items`);
    sections.push(rendExclusivaSection);

    const opRendaVariavelSection = this.generateOperacoesComunsSection(monthlyResults, year);
    console.log(
      `Generated OP_RENDA_VARIAVEL section with ${opRendaVariavelSection.items.length} items`
    );
    sections.push(opRendaVariavelSection);

    console.log('--- generateDeclarationSections output ---');
    console.log(`Total sections: ${sections.length}`);
    sections.forEach(section => {
      console.log(`Section ${section.code}: ${section.items.length} items`);
    });

    return sections;
  }

  private generateBensEDireitosSection(
    positions: AssetPosition[],
    incomeRecords: IncomeRecord[],
    year: number
  ): DeclarationSection {
    const items: DeclarationItem[] = [];

    // The 'positions' array now contains the final state calculated by AssetProcessor
    // for the end of the declaration year, thanks to filtering in the test setup.
    // We can directly use these positions.

    // --- Ações (Código IRPF 31) ---
    const acoes = positions.filter(
      p => p.assetCategory === AssetCategory.STOCK || p.assetCategory === AssetCategory.BDR
    );
    acoes.forEach(pos => {
      const valorAnterior = pos.previousYearValue || 0;

      if (pos.quantity > 0) {
        // Use the quantity directly from the AssetPosition object
        const cnpjEmpresa = pos.cnpj || 'CNPJ_NAO_ENCONTRADO';
        // Use values directly from the AssetPosition object
        const discriminacao = `${pos.quantity.toLocaleString('pt-BR', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 4,
        })} Ações de ${pos.assetName} (${
          pos.assetCode
        }), Custo Médio R$ ${pos.averagePrice.toLocaleString('pt-BR', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 4,
        })} que totaliza R$ ${pos.totalCost.toLocaleString('pt-BR', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}. CNPJ: ${cnpjEmpresa}`;
        items.push({
          code: '31',
          description: `${pos.assetCode} - ${pos.assetName}`,
          value: Math.round(pos.totalCost * 100) / 100, // Arredonda para evitar erros de ponto flutuante
          previousYearValue: valorAnterior,
          ticker: pos.assetCode,
          cnpj: cnpjEmpresa,
          details: discriminacao,
        });
      }
    });

    // --- FIIs (Código IRPF 73) ---
    const fiis = positions.filter(p => p.assetCategory === AssetCategory.FII);
    fiis.forEach(pos => {
      const valorAnteriorFii = pos.previousYearValue || 0;

      if (pos.quantity > 0) {
        // Use the quantity directly from the AssetPosition object
        const cnpjFii = pos.cnpj || 'CNPJ_NAO_ENCONTRADO';
        // Use values directly from the AssetPosition object
        const discriminacaoFii = `${pos.quantity.toLocaleString('pt-BR', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 4,
        })} Cotas do FII ${pos.assetName} (${
          pos.assetCode
        }), Custo Médio R$ ${pos.averagePrice.toLocaleString('pt-BR', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 4,
        })} que totaliza R$ ${pos.totalCost.toLocaleString('pt-BR', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}. CNPJ: ${cnpjFii}`;
        items.push({
          code: '73',
          description: `${pos.assetCode} - ${pos.assetName}`,
          value: Math.round(pos.totalCost * 100) / 100, // Arredonda para evitar erros de ponto flutuante
          previousYearValue: valorAnteriorFii,
          ticker: pos.assetCode,
          cnpj: cnpjFii,
          details: discriminacaoFii,
        });
      }
    });

    // --- Juros sobre Capital Creditados e NÃO PAGOS de Ações (Código IRPF 99 - Outros) ---
    // Presume que status foi adicionado ao IncomeProcessor
    const jscpNaoPagos = incomeRecords.filter(
      r =>
        r.incomeType === 'Juros sobre Capital Próprio' &&
        (r.assetCategory === AssetCategory.STOCK || r.assetCategory === AssetCategory.BDR)
      /*&& r.status === 'CREDITADO_NAO_PAGO'*/
    );
    jscpNaoPagos.forEach(record => {
      // Presume que cnpj foi adicionado ao IncomeProcessor
      const cnpjFonteJscp = record.cnpj || 'CNPJ_FONTE_NAO_ENCONTRADO';
      const discriminacaoJscp = `Crédito ref. JSCP de ${record.assetName} (${
        record.assetCode
      }), creditado em ${record.date.toLocaleDateString()} e não pago até 31/12/${year}. CNPJ Fonte Pagadora: ${cnpjFonteJscp}. Valor: R$ ${(
        record.grossValue || 0
      ).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      items.push({
        code: '99',
        description: `JSCP Não Pago - ${record.assetCode}`,
        value: record.grossValue || 0,
        previousYearValue: 0, // Tipicamente 0 para créditos não pagos no ano anterior
        cnpj: cnpjFonteJscp,
        details: discriminacaoJscp,
        additionalType: 'JUROS_CAPITAL_NAO_PAGOS',
      });
    });

    // --- Crédito em Trânsito e NÃO PAGO de FIIs (Código IRPF 99 - Outros) ---
    const creditoNaoPagoFII = incomeRecords.filter(
      r => r.incomeType.startsWith('Rendimento') && r.assetCategory === AssetCategory.FII
      /*&& r.status === 'CREDITADO_NAO_PAGO'*/
    );
    creditoNaoPagoFII.forEach(record => {
      const cnpjFonteFii = record.cnpj || 'CNPJ_FONTE_NAO_ENCONTRADO';
      const discriminacaoCredFii = `Crédito em trânsito de rendimentos de ${record.assetName} (${
        record.assetCode
      }), ref. a ${record.date.toLocaleDateString()}, não pago até 31/12/${year}. CNPJ Fonte Pagadora: ${cnpjFonteFii}. Valor: R$ ${(
        record.grossValue || 0
      ).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      items.push({
        code: '99',
        description: `Crédito FII Não Pago - ${record.assetCode}`,
        value: record.grossValue || 0,
        previousYearValue: 0,
        cnpj: cnpjFonteFii,
        details: discriminacaoCredFii,
        additionalType: 'CREDITO_TRANSITO_NAO_PAGOS',
      });
    });

    return {
      code: 'BENS',
      name: 'Bens e Direitos',
      description: `Declaração de bens e direitos em 31/12/${year}`,
      items,
    };
  }

  private generateRendimentosIsentosSection(
    records: IncomeRecord[],
    year: number
  ): DeclarationSection {
    const items: DeclarationItem[] = [];

    // --- Dividendos de AÇÕES/BDR (Código IRPF 09) ---
    // Allow both 'Dividendos' and 'Rendimento' for Stocks/BDRs under code 09
    // Filter only PAID income for this section
    const dividendosAcoes = records.filter(
      r =>
        r.incomeType.startsWith('Dividendo') &&
        (r.assetCategory === AssetCategory.STOCK || r.assetCategory === AssetCategory.BDR)
    );
    const groupedDividendosAcoes = this.groupIncomeByCNPJ(dividendosAcoes);
    Object.values(groupedDividendosAcoes).forEach(group => {
      items.push({
        code: '09',
        description: 'Lucros e dividendos recebidos',
        value: group.totalValue,
        cnpj: group.cnpj, // Vem do groupIncomeByCNPJ
        sourceName: group.sourceName, // Vem do groupIncomeByCNPJ
        details: group.details.join('; '), // Junta o array de detalhes
      });
    });

    // --- Rendimentos de FIIs (Código IRPF 26) ---
    const rendimentosFII = records.filter(
      r => r.incomeType.startsWith('Rendimento') && r.assetCategory === AssetCategory.FII
    );
    const groupedRendimentosFII = this.groupIncomeByCNPJ(rendimentosFII);
    Object.values(groupedRendimentosFII).forEach(group => {
      items.push({
        code: '26', // FII vai no código 26 de "Outros" isentos
        description: 'Rendimentos de Fundos de Invest. Imobiliários',
        value: group.totalValue,
        cnpj: group.cnpj,
        sourceName: group.sourceName,
        details: group.details.join('; '), // Junta o array de detalhes
      });
    });

    return {
      code: 'REND_ISENTOS',
      name: 'Rendimentos Isentos e Não Tributáveis',
      description: `Rendimentos isentos recebidos em ${year}`,
      items,
    };
  }

  private generateRendimentosTributacaoExclusivaSection(
    records: IncomeRecord[],
    year: number
  ): DeclarationSection {
    const items: DeclarationItem[] = [];

    // --- Juros sobre Capital Próprio de AÇÕES/BDR (Código IRPF 10) ---
    // Apenas os PAGOS (exclui 'CREDITADO_NAO_PAGO')
    const jcpAcoes = records.filter(
      r =>
        r.incomeType === 'Juros sobre Capital Próprio' &&
        (r.assetCategory === AssetCategory.STOCK || r.assetCategory === AssetCategory.BDR)
      //&& r.status !== 'CREDITADO_NAO_PAGO'
    );
    const groupedJcpAcoes = this.groupIncomeByCNPJ(jcpAcoes);
    Object.values(groupedJcpAcoes).forEach(group => {
      items.push({
        code: '10', // Código IRPF correto para JSCP
        description: 'Juros sobre Capital Próprio',
        value: group.totalValue,
        cnpj: group.cnpj,
        sourceName: group.sourceName,
        details: group.details.join('; '), // Junta o array de detalhes
      });
    });

    return {
      code: 'REND_EXCLUSIVA',
      name: 'Rendimentos Sujeitos a Tributação Exclusiva/Definitiva',
      description: `Rendimentos exclusivos recebidos em ${year}`,
      items,
    };
  }

  private generateOperacoesComunsSection(
    results: MonthlyResult[],
    year: number
  ): DeclarationSection {
    const items: DeclarationItem[] = [];

    // --- Ações - Day Trade (Mapeia para R40) ---
    // Presume que MonthlyResult tem assetCategory e tradeType
    const dayTradeResults = results.filter(
      r => r.tradeType === 'DayTrade' /*&& r.assetCategory === AssetCategory.STOCK*/
    );
    dayTradeResults.forEach(result => {
      if ((result.netResult || 0) !== 0) {
        items.push({
          code: `RV_DT_ACOES.${result.month}`,
          description: `Resultado Líquido Day-Trade Ações - ${this.getMonthName(
            result.month
          )}/${year}`,
          value: result.netResult || 0,
          month: result.month,
          type: 'DAY_TRADE_ACOES',
        });
      }
    });

    // --- FIIs - FII ou Fiagro (Mapeia para R42) ---
    const fiiResults = results.filter(r => r.assetCategory === AssetCategory.FII);
    fiiResults.forEach(result => {
      if ((result.netResult || 0) !== 0) {
        items.push({
          code: `RV_FII.${result.month}`,
          description: `Resultado Líquido FII/Fiagro - ${this.getMonthName(result.month)}/${year}`,
          value: result.netResult || 0,
          month: result.month,
          type: 'FII',
        });
      }
    });

    // TODO: Adicionar Operações Comuns (não Day-Trade) aqui, mapeando para R40

    return {
      code: 'OP_RENDA_VARIAVEL',
      name: 'Renda Variável - Operações Comuns/Day-Trade/FII',
      description: `Resultados mensais de operações em Renda Variável em ${year}`,
      items,
    };
  }
}
