import { parse, isValid } from 'date-fns';
import { FieldDefinition, layout } from './layout';

// --- Data Interfaces for Reading ---
// TODO: Move these to shared domain types

interface HeaderData {
  sistema?: string;
  exercicio?: number;
  anoBase?: number;
  codigoRecnet?: number;
  isRetificadora?: boolean;
  cpf?: string;
  tipoNI?: number;
  versaoPrograma?: number;
  nomeContribuinteHeader?: string;
  uf?: string;
  hash?: string;
  isCertificavel?: boolean;
  dataNascimento?: Date | null;
  isCompleta?: boolean;
  resultadoImposto?: string; // 0, 1, 2, 3
  isGerada?: boolean;
  reciboUltimaDecExAtual?: string;
  nomeSO?: string;
  versaoSO?: string;
  versaoJVM?: string;
  reciboDeclaracaoTransmitida?: string;
  municipioCodigo?: number;
  cpfConjuge?: string;
  isObrigatoriaEntrega?: boolean;
  impostoDevido?: number;
  reciboUltimaDecExAnterior?: string;
  indicadorSeguranca?: number; // 0, 1, 2
  indicadorImpostoPago?: string; // '00', '01', etc.
  indicadorImpostoAntecipado?: boolean;
  mudouEndereco?: boolean;
  cep?: string;
  debitoPrimeiraQuota?: boolean;
  bancoCodigo?: string;
  agenciaCodigo?: string;
  isSobrepartilha?: boolean;
  dataTransitoJulgadoLavratura?: Date | null;
  somaImpostoPagar?: number;
  // Add other relevant fields from IR Header
  controle?: string;
}

interface DeclaranteData {
  cpf?: string;
  nome?: string;
  tipoLogradouro?: string;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cep?: string;
  municipioCodigo?: number;
  municipio?: string;
  uf?: string;
  codigoExterior?: string;
  codigoPais?: string;
  email?: string;
  nitPisPasep?: string;
  cpfConjuge?: string;
  dddTelefone?: string;
  dataNascimento?: Date | null;
  tituloEleitor?: string;
  codigoOcupacao?: string;
  codigoNaturezaOcupacao?: string;
  numeroQuotas?: number;
  isCompleta?: boolean;
  isRetificadora?: boolean;
  isGerada?: boolean;
  mudouEndereco?: boolean;
  numeroControleOriginal?: string;
  bancoCodigo?: string;
  agenciaCodigo?: string;
  temDoencaDeficiencia?: string; // 'S', 'N', '1', '2'
  isPreenchida?: boolean;
  dataDiaUtilRecibo?: Date | null;
  contaDV?: string;
  temDebitoAutomatico?: boolean;
  debitoPrimeiraQuota?: boolean;
  cpfCnpjFontePrincipal?: string;
  reciboUltimaDecAnoAnterior?: string;
  tipoDeclaracao?: string; // A, E, S
  cpfProcurador?: string;
  registroProfissional?: string;
  dddCelular?: string;
  celular?: string;
  temConjuge?: boolean;
  telefone?: string;
  tipoConta?: string; // '0', '1', '2', '3', '4'
  contaNumero?: string;
  numeroProcessoDigital?: string;
  cpfResponsavel?: string;
  dataOriginalRetificadora?: Date | null;
  horaOriginalRetificadora?: string; // HHMMSS
  mensagemRecibo?: string;
  controle?: string;
}

// Interface for R23 Summary Record
interface RendimentoIsentoSummary {
  cpf?: string;
  codigoIsento?: number; // NR_COD_ISENTO
  valorTotal?: number; // VR_VALOR
  controle?: string;
}

// Interface for R84 Detail Record (Dividends - Code 09)
interface RendimentoIsentoDividendo {
  cpf?: string;
  tipoBeneficiario?: string; // T or D
  cpfBeneficiario?: string;
  codigo: number; // Should be 9
  cnpjFontePagadora?: string; // NR_PAGADORA
  nomeFontePagadora?: string; // NM_NOME
  valor?: number; // VR_VALOR
  // VR_VALOR_13 is ignored for dividends
  chaveBem?: number; // NR_CHAVE_BEM (Optional link to R27)
  controle?: string;
}

// Interface for R86 Detail Record (Outros - Code 26 - Used for FIIs)
interface RendimentoIsentoOutro {
  cpf?: string;
  tipoBeneficiario?: string; // T or D
  cpfBeneficiario?: string;
  codigo: number; // Should be 26
  cnpjFontePagadora?: string; // NR_PAGADORA
  nomeFontePagadora?: string; // NM_NOME
  valor?: number; // VR_VALOR
  descricao?: string; // NM_DESCRICAO
  chaveBem?: number; // NR_CHAVE_BEM (Optional link to R27)
  controle?: string;
}

// Interface for R24 Summary Record
interface RendimentoExclusivoSummary {
  cpf?: string;
  codigoExclusivo?: number; // NR_COD_EXCLUSIVO
  valorTotal?: number; // VR_VALOR
  controle?: string;
}

// Interface for R88 Detail Record (JSCP - Code 10)
interface RendimentoExclusivoJSCP {
  cpf?: string;
  tipoBeneficiario?: string; // T or D
  cpfBeneficiario?: string;
  codigo: number; // Should be 10
  cnpjFontePagadora?: string; // NR_PAGADORA
  nomeFontePagadora?: string; // NM_NOME
  valor?: number; // VR_VALOR
  chaveBem?: number; // NR_CHAVE_BEM (Optional link to R27)
  controle?: string;
}

interface BemDireitoData {
  cpf?: string;
  codigoBem?: number;
  ticker?: string; // Extracted from description
  isExterior?: boolean;
  paisCodigo?: number;
  discriminacao?: string;
  valorAnoAnterior?: number;
  valorAnoAtual?: number;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cep?: string;
  uf?: string;
  municipioCodigo?: number;
  municipio?: string;
  indicadorRegistroImovel?: number; // 0, 1, 2
  matriculaImovel?: string;
  areaImovel?: number;
  unidadeArea?: number; // 0, 1, 2
  nomeCartorio?: string;
  chaveBem?: number;
  dataAquisicao?: Date | null;
  renavam?: string;
  registroAeronave?: string;
  registroEmbarcacao?: string;
  agenciaCodigo?: string; // Para contas
  contaDV?: string; // Para contas
  cpfCnpjRelacionado?: string; // Para participações, créditos, etc.
  iptu?: string;
  bancoCodigo?: string; // Para contas
  tipoBeneficiario?: string; // T ou D
  cpfBeneficiario?: string;
  grupoBem?: string;
  isBemInventariar?: boolean;
  contaNumero?: string; // Para contas
  cib?: string;
  ceiCno?: string;
  negociadoBolsa?: boolean;
  codigoNegociacaoBolsa?: string;
  controle?: string;
}

// Interface for R40 Monthly Results (Comum/DayTrade)
interface OperacaoComumDayTradeMes {
  cpf?: string;
  mes?: string; // 01-12
  // Add fields as needed, e.g.:
  gcDaytrMvistaAcoes?: number; // GC_DAYTR_MVISTA_ACOES
  vrResliquidoMesOpcomuns?: number;
  vrResliquidoMesDaytrade?: number;
  vrBasecalculoMesOpcomuns?: number;
  vrBasecalculoMesDaytrade?: number;
  vrPrejacompensarMesOpcomuns?: number;
  vrPrejacompensarMesDaytrade?: number;
  vrImpostodevidoMesOpcomuns?: number;
  vrImpostodevidoMesDaytrade?: number;
  vrImpostoapagar?: number;
  // ... other relevant fields from R40
  controle?: string;
}

// Interface for R42 Monthly Results (FII)
interface OperacaoFIIMes {
  cpf?: string;
  mes?: number; // 01-12
  vrResliquidoMes?: number;
  vrresultNegMesant?: number;
  vrBasecalculoMes?: number;
  vrPrejacompensarMesOpcomuns?: number; // Name is generic in layout
  vrImpostodevidoMesOpcomuns?: number; // Name is generic in layout
  vrImpostoPagar?: number;
  // ... other relevant fields from R42
  controle?: string;
}

// --- Helper Function ---

// Regex to extract ticker like (Ticker: XXXX) or [XXXX] from the end of a string
const tickerRegex = /(?:\(Ticker:\s*([^)]+)\)|\[([A-Z0-9]+)\])\s*$/i; // Removed unnecessary escape \)

function extractTicker(description: string | undefined): string | undefined {
  if (!description) return undefined;
  const match = description.match(tickerRegex);
  return match ? (match[1] || match[2] || '').trim() : undefined;
}

function parseField<T>(line: string, field: FieldDefinition): T | null {
  if (!line) return null;
  const start = field.start - 1;
  const end = field.end;

  if (start < 0 || end > line.length) {
    console.warn(`Field ${field.name} coordinates [${field.start}-${field.end}] out of bounds for line length ${line.length}.`);

    return null;
  }
  const rawValue = line.substring(start, end);
  const trimmedValue = rawValue.trim();

  try {
    switch (field.format) {
      case 'N':
        if (field.decimals) {
          const integerPart = rawValue.slice(0, -field.decimals);
          const decimalPart = rawValue.slice(-field.decimals);
          return (parseFloat(`${integerPart}.${decimalPart}`) || 0) as T;
        }
        return (parseInt(rawValue, 10) || 0) as T;
      case 'NN': {
        const sign = rawValue.charAt(0);
        const numStr = rawValue.substring(1);
        let num = 0;
        if (field.decimals) {
          const integerPart = numStr.slice(0, -field.decimals);
          const decimalPart = numStr.slice(-field.decimals);
          num = parseFloat(`${integerPart}.${decimalPart}`) || 0;
        } else {
          num = parseInt(numStr, 10) || 0;
        }
        return (sign === '-' ? -num : num) as T;
      }
      case 'A':
      case 'C':
        return trimmedValue as T;
      case 'I': // Boolean 'S'/'N'
        return (trimmedValue.toUpperCase() === 'S') as T;
      case 'D': // Date DDMMYYYY
        if (/^\d{8}$/.test(trimmedValue)) {
          // Use date-fns parse for robustness
          const date = parse(trimmedValue, 'ddMMyyyy', new Date());
          return isValid(date) ? (date as T) : null;
        }
        if (/^\s*$/.test(rawValue)) {
          // Handle empty/space-filled date fields
          return null;
        }
        console.warn(`Invalid date format for field ${field.name}: ${trimmedValue}`);
        return null;
      default:
        return trimmedValue as T;
    }
  } catch (error) {
    console.error(`Error parsing field ${field.name} with value "${rawValue}":`, error);
    return null;
  }
}

// --- Reader Abstraction Class ---

export class ReaderDBKFileEditor {
  private lines: string[];
  private lineEnding: string = '\r\n';

  constructor(content: string) {
    const match = content.match(/\r?\n/);
    this.lineEnding = match ? match[0] : '\r\n';
    this.lines = content.split(this.lineEnding).filter(line => line.length > 0);
  }

  private findRecordLines(recordPrefix: string): string[] {
    const prefixWithSpace = recordPrefix.padEnd(2, ' ');
    return this.lines.filter(line => line.startsWith(prefixWithSpace));
  }

  private parseRecord<T extends object>(line: string, recordPrefix: string): Partial<T> | null {
    const definition = layout[recordPrefix];
    if (!definition) {
      console.error(`Layout definition not found for record prefix: ${recordPrefix}`);
      return null;
    }

    const recordData: Partial<T> = {};

    definition.fields.forEach(field => {
      // Simple camelCase conversion (adjust if needed)
      const key = field.name.toLowerCase().replace(/_([a-z])/g, g => g[1].toUpperCase()) as keyof T;
      const parsedValue = parseField<T[keyof T]>(line, field);
      if (parsedValue !== null) {
        // Only assign if parsing was successful
        recordData[key] = parsedValue;
      }
    });

    return recordData;
  }

  /**
   * Reads the Header (IR) record.
   * @returns A HeaderData object or null if the record is not found.
   */
  public getHeaderInfo(): any /*Partial<HeaderData>*/ | null {
    const headerLine = this.findRecordLines('IR')[0];
    if (!headerLine) return null;
    return this.parseRecord<HeaderData>(headerLine, 'IR');
  }

  /**
   * Reads the Declarante (16) record.
   * @returns A DeclaranteData object or null if the record is not found.
   */
  public getDadosDeclarante(): any /*Partial<DeclaranteData>*/ | null {
    const declaranteLine = this.findRecordLines('16')[0];
    if (!declaranteLine) return null;
    return this.parseRecord<DeclaranteData>(declaranteLine, '16');
  }

  /**
   * Reads all Bens e Direitos (27) records.
   * @returns An array of BemDireitoData objects, including extracted ticker where applicable.
   */
  public getBensDireitos(): Partial<BemDireitoData>[] {
    const bemLines = this.findRecordLines('27');
    const results = bemLines
      .map(line => this.parseRecord<BemDireitoData>(line, '27'))
      .filter(bem => bem !== null) as Partial<BemDireitoData>[];

    // Post-process to extract ticker
    results.forEach(bem => {
      if (bem?.discriminacao && (bem.codigoBem === 31 || bem.codigoBem === 73)) {
        bem.ticker = extractTicker(bem.discriminacao);
      }
    });

    return results;
  }

  /**
   * Reads all Rendimentos Isentos - Dividendos (R84 linked to R23 code 09) records.
   * @returns An array of RendimentoIsentoDividendo objects.
   */
  public getRendimentosIsentosDividendos(): Partial<RendimentoIsentoDividendo>[] {
    const r84Lines = this.findRecordLines('84');
    const results: Partial<RendimentoIsentoDividendo>[] = [];

    r84Lines.forEach(line => {
      const parsed = this.parseRecord<RendimentoIsentoDividendo>(line, '84');
      // Filter specifically for code 09 (Lucros e dividendos recebidos)
      if (parsed && parsed.codigo === 9) {
        results.push(parsed);
      }
    });
    return results;
  }

  /**
   * Reads all Rendimentos Isentos - Outros (R86 linked to R23 code 26) records.
   * This is typically used for FII Rendimentos.
   * @returns An array of RendimentoIsentoOutro objects.
   */
  public getRendimentosIsentosFIIs(): Partial<RendimentoIsentoOutro>[] {
    const r86Lines = this.findRecordLines('86');
    const results: Partial<RendimentoIsentoOutro>[] = [];

    r86Lines.forEach(line => {
      const parsed = this.parseRecord<RendimentoIsentoOutro>(line, '86');
      // Filter specifically for code 26 (Outros)
      if (parsed && parsed.codigo === 26) {
        // Optionally, further filter by description keywords if needed
        // if (parsed.descricao?.toUpperCase().includes('FII')) { ... }
        results.push(parsed);
      }
    });
    return results;
  }

  /**
   * Reads all Rendimentos Sujeitos a Tributação Exclusiva - JSCP (R88 linked to R24 code 10) records.
   * @returns An array of RendimentoExclusivoJSCP objects.
   */
  public getRendimentosExclusivosJSCP(): Partial<RendimentoExclusivoJSCP>[] {
    const r88Lines = this.findRecordLines('88');
    const results: Partial<RendimentoExclusivoJSCP>[] = [];

    r88Lines.forEach(line => {
      const parsed = this.parseRecord<RendimentoExclusivoJSCP>(line, '88');
      // Filter specifically for code 10 (Juros sobre Capital Próprio)
      if (parsed && parsed.codigo === 10) {
        results.push(parsed);
      }
    });
    return results;
  }

  /**
   * Reads all Renda Variável - Operações Comuns/Day Trade (R40) monthly records.
   * @returns An array of OperacaoComumDayTradeMes objects.
   */
  public getOperacoesComunsMes(): Partial<OperacaoComumDayTradeMes>[] {
    const r40Lines = this.findRecordLines('40');
    return r40Lines
      .map(line => this.parseRecord<OperacaoComumDayTradeMes>(line, '40'))
      .filter(op => op !== null) as Partial<OperacaoComumDayTradeMes>[];
  }

  /**
   * Reads all Renda Variável - Operações FII (R42) monthly records.
   * @returns An array of OperacaoFIIMes objects.
   */
  public getOperacoesFIIMes(): Partial<OperacaoFIIMes>[] {
    const r42Lines = this.findRecordLines('42');
    return r42Lines
      .map(line => this.parseRecord<OperacaoFIIMes>(line, '42'))
      .filter(op => op !== null) as Partial<OperacaoFIIMes>[];
  }

  // --- Add methods for other records as needed ---
  // public getRendimentosPJ(): Partial<RendimentoPJData>[] { ... }
  // public getPagamentosEfetuados(): Partial<PagamentoData>[] { ... }
  // public getDependentes(): Partial<DependenteData>[] { ... }
  // ... etc.
}
