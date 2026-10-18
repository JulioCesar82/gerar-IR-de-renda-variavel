import { DBKFileEditor } from './LayoutDBK2025/DBKFileEditor';
import { WritterDBKFileEditor } from './LayoutDBK2025/WritterDBKFileEditor';
import { DeclarationBuilder } from './DeclarationBuilder';

import { IRPFGeneratorPort } from '../../core/interfaces/IRPFGeneratorPort';
import {
  IRPFDeclaration,
  TaxPayerInfo,
  DeclarationSection,
  DeclarationItem,
} from '../../core/domain/IRPFDeclaration';
import { ProcessedDataSummary } from '../../core/domain/AssetPosition';
import { ExternalTickerInfoProviderPort } from '../../core/interfaces/ExternalTickerInfoProviderPort';

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
 * Implementation of the IRPFGeneratorPort interface for generating DBK files.
 *
 * Responsibility is deliberately narrow: building the DeclarationSection/Item structure
 * (the apuração/tax-calculation summary) is delegated to DeclarationBuilder; this class only
 * serializes an already-built IRPFDeclaration into the .DBK byte format via WritterDBKFileEditor.
 */
export class DBKFileGenerator implements IRPFGeneratorPort {
  private declarationBuilder: DeclarationBuilder;

  constructor(externalDataProvider: ExternalTickerInfoProviderPort) {
    this.declarationBuilder = new DeclarationBuilder(externalDataProvider);
  }

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
    return this.declarationBuilder.build(processedDataSummary, taxPayerInfo, year);
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

      this.writeDadosDeclarante(writterEditor, declaration.taxPayerInfo, declaration.year);
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
    taxPayerInfo: TaxPayerInfo,
    year: number
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

    writterEditor.setIdentificacaoDeclarante(declaranteData, year);
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
        opsPorMes[item.month].dt!.vrResliquidoMesDaytrade = item.value;
      } else if (item.type === 'COMMON_ACOES') {
        if (!opsPorMes[item.month].dt) {
          opsPorMes[item.month].dt = { mes: item.month.toString().padStart(2, '0') };
        }
        opsPorMes[item.month].dt!.vrResliquidoMesOpcomuns = item.value;
      } else if (item.type === 'FII') {
        if (!opsPorMes[item.month].fii) {
          opsPorMes[item.month].fii = { mes: item.month };
        }
        opsPorMes[item.month].fii!.vrResliquidoMes = item.value;
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
}
