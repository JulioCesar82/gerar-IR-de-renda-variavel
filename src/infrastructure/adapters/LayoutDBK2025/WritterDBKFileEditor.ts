import { DBKFileEditor } from './DBKFileEditor';
import { FieldDefinition, layout, buildRecordLine } from './layout';

// --- Helper Functions ---
function padRight(str: string | undefined, length: number): string {
  return (str ?? '').padEnd(length, ' ');
}
function padLeftZero(str: string | number | undefined, length: number): string {
  return (str?.toString() ?? '').padStart(length, '0');
}
function formatNumeric(value: number | undefined, length: number, decimals: number): string {
  if (value === undefined || value === null) return padLeftZero('', length);

  value = Number.parseFloat(value as any);

  const fixedValue = value.toFixed(decimals);
  const [integerPart, decimalPart] = fixedValue.split('.');
  const combined = integerPart + (decimalPart || '');
  return padLeftZero(combined, length);
}
function formatNegativeNumeric(
  value: number | undefined,
  length: number,
  decimals: number
): string {
  if (value === undefined || value === null) return padLeftZero('', length); // Or '+'+padLeftZero... ?
  const isNegative = value < 0;
  const fixedValue = Math.abs(value).toFixed(decimals);
  const [integerPart, decimalPart] = fixedValue.split('.');
  const combined = integerPart + (decimalPart || '');
  const paddedAbs = padLeftZero(combined, length - 1); // Reserve one char for sign
  return (isNegative ? '-' : '+') + paddedAbs; // Assuming '+' for positive NN
}
function formatBoolean(value: boolean | undefined, format: 'S/N' | '1/0'): string {
  if (value === undefined || value === null) return ' '; // Or '0' depending on specific field default
  if (format === 'S/N') {
    return value ? 'S' : 'N';
  } else {
    return value ? '1' : '0';
  }
}

// --- Data Interfaces for Writing ---
// These should ideally be defined in a shared domain types file

interface DeclaranteData {
  cpf?: string; // NR_CPF - Declarant's CPF
  nome?: string;
  tipoLogradouro?: string;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cep?: string;
  municipioCodigo?: number;
  municipioNome?: string;
  uf?: string;
  paisCodigo?: string; // e.g., '105' for Brasil
  email?: string;
  nitPisPasep?: string;
  cpfConjuge?: string;
  dddTelefone?: string;
  telefone?: string;
  dataNascimento?: Date; // Or string 'DDMMYYYY'
  tituloEleitor?: string;
  ocupacaoCodigo?: string; // e.g., '001'
  naturezaOcupacaoCodigo?: string; // e.g., '10'
  // Add other relevant fields from Record 16
  bancoCodigo?: string;
  agenciaCodigo?: string;
  contaNumero?: string;
  contaDV?: string;
  tipoConta?: string; // e.g., '1' for Corrente
}

// interface BemData {
//     codigo?: string; // e.g., '31' for Ações
//     localizacaoPaisCodigo?: string; // e.g., '105'
//     discriminacao?: string;
//     valorAnoAnterior?: number;
//     valorAnoAtual?: number;
//     // Add other relevant fields from Record 27
//     itemNumero?: number; // To identify which R27 record to update
// }

// R27 - Bens e Direitos
interface BemDireitoWriteData {
  codigoBem: string; // e.g., '31', '73', '99'
  cnpj?: string; // NM_CPFCNPJ (pos 1042-1055)
  discriminacao: string; // TX_BEM (pos 20-531)
  ticker?: string; // To be embedded in discriminacao
  valorAnoAnterior?: number; // VR_ANTER
  valorAnoAtual?: number; // VR_ATUAL
  // Add other optional fields from R27 as needed
  localizacaoPaisCodigo?: string; // CD_PAIS (default '105')
  negociadoBolsa?: boolean; // IN_BOLSA
  codigoNegociacaoBolsa?: string; // NR_COD_NEGOCIACAO_BOLSA
}

// R84 - Rendimento Isento (Dividendo - Cod 09)
interface RendimentoIsentoDividendoWriteData {
  cnpjFontePagadora: string; // NR_PAGADORA
  nomeFontePagadora: string; // NM_NOME
  valor: number; // VR_VALOR
  tipoBeneficiario?: 'T' | 'D'; // IN_TIPO (Default 'T')
  cpfBeneficiario?: string; // NR_CPF_BENEFIC (Required if IN_TIPO='D')
}

// R86 - Rendimento Isento (Outros - Cod 26 - FII)
interface RendimentoIsentoFIIWriteData {
  cnpjFontePagadora: string; // NR_PAGADORA
  nomeFontePagadora: string; // NM_NOME
  valor: number; // VR_VALOR
  descricao: string; // NM_DESCRICAO (e.g., "Rendimentos FII XPTO")
  tipoBeneficiario?: 'T' | 'D'; // IN_TIPO (Default 'T')
  cpfBeneficiario?: string; // NR_CPF_BENEFIC (Required if IN_TIPO='D')
}

// R88 - Rendimento Exclusivo (JSCP - Cod 10)
interface RendimentoExclusivoJSCPWriteData {
  cnpjFontePagadora: string; // NR_PAGADORA
  nomeFontePagadora: string; // NM_NOME
  valor: number; // VR_VALOR
  tipoBeneficiario?: 'T' | 'D'; // IN_TIPO (Default 'T')
  cpfBeneficiario?: string; // NR_CPF_BENEFIC (Required if IN_TIPO='D')
}

// R40 - Operações Comuns/Day Trade
interface OperacaoComumDayTradeMesWriteData {
  mes: string; // '01' to '12'
  // Provide the specific result fields to update
  gcDaytrMvistaAcoes?: number;
  // ... other GC_DAYTR... fields
  // ... other GC_COMUM... fields
  vrResliquidoMesOpcomuns?: number;
  vrResliquidoMesDaytrade?: number;
  vrImpostoapagar?: number; // Added this field
  // ... other VR_... fields for R40
  tipoBeneficiario?: 'T' | 'D'; // E_DEPENDENTE (S/N) -> Default 'N' (Titular)
  cpfDependente?: string; // NR_CPF_DEPEN (Required if tipoBeneficiario='D')
}

// R42 - Operações FII
interface OperacaoFIIMesWriteData {
  mes: number; // 1 to 12
  // Provide the specific result fields to update
  vrResliquidoMes?: number;
  vrresultNegMesant?: number;
  vrBasecalculoMes?: number;
  vrPrejacompensarMesOpcomuns?: number;
  vrImpostodevidoMesOpcomuns?: number;
  vrImpostodevidoMesDaytrade?: number;
  vrImpostoPagar?: number; // Added this field
  // ... other relevant fields from R40
  tipoBeneficiario?: 'T' | 'D'; // E_DEPENDENTE (S/N) -> Default 'N' (Titular)
  cpfDependente?: string; // NR_CPF_DEPEN (Required if tipoBeneficiario='D')
  controle?: string;
}

// --- Writter Abstraction Class ---

export class WritterDBKFileEditor {
  private editor: DBKFileEditor;
  private currentCpf: string = ''; // Store CPF from header/R16 for linking records
  private lastControlNumber: number = 0; // Simple sequence for NR_CONTROLE

  constructor(editor: DBKFileEditor) {
    this.editor = editor;
    this.initializeState();
  }

  private initializeState(): void {
    // Try to extract CPF from existing R16 if loading a file
    const r16Lines = this.editor.findLinesByRecordType('16');
    if (r16Lines.length > 0) {
      this.currentCpf = this.editor.getFieldFromLine(r16Lines[0].index, 3, 13) || '';
    } else {
      // Try header if R16 not found
      const irLine = this.editor.getLine(0);
      if (irLine?.startsWith('IR')) {
        this.currentCpf = irLine.substring(21, 32).trim(); // Pos 22-32 -> index 21-32
      }
    }
    // Find the highest existing control number to avoid duplicates
    const allLines = this.editor.getAllLines();
    allLines.forEach(line => {
      const controlStr = line.slice(-10); // Assuming NR_CONTROLE is always last 10 chars
      const controlNum = parseInt(controlStr, 10);
      if (!isNaN(controlNum) && controlNum > this.lastControlNumber) {
        this.lastControlNumber = controlNum;
      }
    });
    console.log(
      `Initialized Writer. CPF: ${this.currentCpf || 'Not Found'}, Last Control #: ${this.lastControlNumber}`
    );
  }

  /**
   * Builds, from scratch, the minimal set of records a declaration needs (IR header,
   * Declarante R16, twelve R40 and twelve R42 monthly records, and the T9 trailer)
   * when no previous .DBK was imported (the editor starts out completely empty).
   * Every field this program doesn't have authoritative data for is left at a neutral
   * default (blank/zero) by `buildRecordLine` — this is a best-effort skeleton, not a
   * byte-perfect reproduction of what Receita's own software would generate.
   */
  private createBlankDeclarationSkeleton(cpf: string, exercicioYear: number): void {
    console.warn(
      'Nenhum .DBK anterior foi importado: gerando os registros IR/16/40/42/T9 do zero. ' +
        'Vários campos do cabeçalho IR não são conhecidos por este programa e ficarão em branco/zero. ' +
        'Revise cuidadosamente o arquivo gerado no programa oficial da Receita Federal antes de transmitir.'
    );

    const irLine = buildRecordLine('IR', {
      EXERCICIO: exercicioYear,
      ANO_BASE: exercicioYear - 1,
      NR_CPF: cpf,
      IN_RETIFICADORA: '0',
      IN_COMPLETA: 'N',
      IN_GERADA: 'N',
    });
    this.editor.insertLine(0, irLine);

    const r16Line = buildRecordLine('16', { NR_CPF: cpf });
    this.editor.insertLine(1, r16Line);

    for (let mes = 1; mes <= 12; mes++) {
      const r40Line = buildRecordLine('40', {
        NR_CPF: cpf,
        RV_MES: String(mes).padStart(2, '0'),
      });
      this.editor.insertLine(this.editor.getLineCount(), r40Line);
    }

    for (let mes = 1; mes <= 12; mes++) {
      const r42Line = buildRecordLine('42', { NR_CPF: cpf, NR_MES: mes });
      this.editor.insertLine(this.editor.getLineCount(), r42Line);
    }

    const t9Line = buildRecordLine('T9', { NR_CPF: cpf });
    this.editor.insertLine(this.editor.getLineCount(), t9Line);
  }

  /**
   * Updates the main fields of the Declarante record (Record 16).
   * Assumes only one Record 16 exists (recordIndex 0). If the editor is completely
   * empty (no .DBK was imported as a base), the base records are first created from
   * scratch via `createBlankDeclarationSkeleton`.
   * @param data The data to write.
   * @param exercicioYear The declaration's exercício year, used only when creating a
   * brand-new declaration (ignored otherwise).
   * @returns True if all attempted fields were set successfully, false otherwise.
   */
  public setIdentificacaoDeclarante(
    data: Partial<DeclaranteData>,
    exercicioYear: number = new Date().getFullYear()
  ): boolean {
    if (this.editor.getLineCount() === 0) {
      const cpfDigits = data.cpf?.replace(/\D/g, '') || '';
      if (!cpfDigits) {
        console.error('Não é possível gerar uma declaração do zero sem o CPF do contribuinte.');
        return false;
      }
      this.createBlankDeclarationSkeleton(cpfDigits, exercicioYear);
      this.currentCpf = cpfDigits;
    }

    let success = true;
    const prefix = '16';
    const index = 0; // Assuming only one R16

    const records = this.editor.findLinesByRecordType(prefix);
    if (records.length <= index) {
      console.warn(`Record ${prefix} with index ${index} not found`);
      return false;
    }
    const lineIndex = records[index].index;

    // Helper function to set field and track success. Looks up the field's position/format
    // directly in the shared layout and writes it through the low-level editor, instead of
    // relying on DBKFileEditor.setField (which has no knowledge of any layout and always fails).
    const setField = (fieldName: string, value: any | undefined) => {
      if (value === undefined) return;
      const fieldDef: FieldDefinition | undefined = layout[prefix].fields.find(
        f => f.name === fieldName
      );
      if (!fieldDef) {
        console.warn(`Field definition for ${fieldName} in record ${prefix} not found`);
        success = false;
        return;
      }
      const result = this.editor.updateFieldInLine(
        lineIndex,
        fieldDef.start,
        fieldDef.end,
        value,
        fieldDef
      );
      if (!result) {
        console.warn(`Failed to set field ${fieldName} in record ${prefix}`);
        success = false;
      }
    };

    // Set CPF and store it in currentCpf for later use with other records
    if (data.cpf) {
      setField('NR_CPF', data.cpf);
      this.currentCpf = data.cpf; // Store CPF for use with Bens e Direitos and other records
    }

    setField('NM_NOME', data.nome);
    setField('TIP_LOGRA', data.tipoLogradouro);
    setField('NM_LOGRA', data.logradouro);
    setField('NR_NUMERO', data.numero);
    setField('NM_COMPLEM', data.complemento);
    setField('NM_BAIRRO', data.bairro);
    setField('NR_CEP', data.cep);
    setField('CD_MUNICIP', data.municipioCodigo);
    setField('NM_MUNICIP', data.municipioNome);
    setField('SG_UF', data.uf);
    setField('CD_PAIS', data.paisCodigo);
    setField('NM_EMAIL', data.email);
    setField('NR_NITPISPASEP', data.nitPisPasep);
    setField('NR_CPF_CONJUGE', data.cpfConjuge);
    setField('NR_DDD_TELEFONE', data.dddTelefone);
    setField('NR_TELEFONE', data.telefone);
    setField('DT_NASCIM', data.dataNascimento); // Pass Date object or 'DDMMYYYY' string
    setField('NR_TITELEITOR', data.tituloEleitor);
    setField('CD_OCUP', data.ocupacaoCodigo);
    setField('CD_NATUR', data.naturezaOcupacaoCodigo);
    setField('NR_BANCO', data.bancoCodigo);
    setField('NR_AGENCIA', data.agenciaCodigo);
    setField('NR_CONTA', data.contaNumero);
    setField('NR_DV_CONTA', data.contaDV);
    setField('IN_TIPO_CONTA', data.tipoConta);
    // ... set other fields from DeclaranteData

    return success;
  }

  private getNextControlNumber(): string {
    this.lastControlNumber++;
    return padLeftZero(this.lastControlNumber, 10);
  }

  // --- Helper to find insertion point ---
  private findInsertionIndex(beforeRecordTypes: string[]): number {
    let lastKnownIndex = -1;
    const allLines = this.editor.getAllLines(); // Get current lines

    // Find the index of the first record type from the 'before' list
    for (let i = 0; i < allLines.length; i++) {
      const linePrefix = allLines[i].substring(0, 2);
      if (beforeRecordTypes.includes(linePrefix)) {
        return i; // Insert before this line
      }
      // Keep track of the last known index in case none of the 'before' types are found
      lastKnownIndex = i;
    }

    // If no 'before' record types were found, insert at the end (before T9 if it exists)
    if (lastKnownIndex >= 0 && allLines[lastKnownIndex].startsWith('T9')) {
      return lastKnownIndex; // Insert before T9
    }

    return this.editor.getLineCount(); // Insert at the very end if T9 isn't found either
  }

  // --- Bens e Direitos (R27) ---

  private addOrUpdateBemDireitoInternal(data: BemDireitoWriteData, codigoBem: string): void {
    if (!this.currentCpf) {
      throw new Error('CPF do declarante não encontrado. Defina o R16 primeiro.');
    }

    const fullDiscriminacao = data.ticker
      ? `${padRight(data.discriminacao, 512 - ` (Ticker: ${data.ticker})`.length)} (Ticker: ${
          data.ticker
        })`
      : padRight(data.discriminacao, 512);

    // TODO: Implement update logic - find existing R27 based on CNPJ/Ticker/Desc keywords
    // For now, we only add

    const lineContent =
      padRight('27', 2) +
      padRight(this.currentCpf, 11) +
      padLeftZero(codigoBem, 2) +
      formatBoolean(
        data.localizacaoPaisCodigo !== '105' && data.localizacaoPaisCodigo !== undefined,
        '1/0'
      ) + // IN_EXTERIOR (1 if not Brasil)
      padLeftZero(data.localizacaoPaisCodigo || '105', 3) + // CD_PAIS
      padRight(fullDiscriminacao, 512) + // TX_BEM
      formatNumeric(data.valorAnoAnterior, 13, 2) + // VR_ANTER
      formatNumeric(data.valorAnoAtual, 13, 2) + // VR_ATUAL
      // --- Fill remaining R27 fields with defaults/blanks ---
      padRight('', 40) + // NM_LOGRA
      padRight('', 6) + // NR_NUMERO
      padRight('', 40) + // NM_COMPLEM
      padRight('', 40) + // NM_BAIRRO
      padRight('', 9) + // NR_CEP
      padRight('', 2) + // SG_UF
      padLeftZero('', 4) + // CD_MUNICIP
      padRight('', 40) + // NM_MUNICIP
      padLeftZero('2', 1) + // NM_IND_REG_IMOV (Default '2' - Vazio)
      padRight('', 40) + // MATRIC_IMOV
      padRight('', 40) + // Filler_780
      padLeftZero('', 11) + // AREA (includes 1 decimal)
      padLeftZero('2', 1) + // NM_UNID (Default '2' - Vazio)
      padRight('', 60) + // NM_CARTORIO
      padLeftZero('', 5) + // NR_CHAVE_BEM (Auto-generated?)
      padRight('', 8) + // DT_AQUISICAO (Format D)
      padRight('', 20) + // Filler_905
      padRight('', 8) + // FILLER_925
      padRight('', 30) + // NR_RENAVAN
      padRight('', 30) + // NR_DEP_AVIACAO_CIVIL
      padRight('', 30) + // NR_CAPITANIA_PORTOS
      padLeftZero('', 4) + // NR_AGENCIA
      padRight('', 13) + // Filler_1027
      padRight('', 2) + // NR_DV_CONTA
      padRight(data.cnpj, 14) + // NM_CPFCNPJ
      padRight('', 30) + // NR_IPTU
      padLeftZero('', 3) + // NR_BANCO
      padRight('T', 1) + // IN_TIPO_BENEFIC (Default 'T')
      padRight(this.currentCpf, 11) + // NR_CPF_BENEFIC (Default Titular)
      padRight(codigoBem.substring(0, 2), 2) + // CD_GRUPO_BEM (First 2 digits of CD_BEM)
      formatBoolean(false, '1/0') + // IN_BEM_INVENTARIAR (Default false)
      padRight('', 20) + // NR_CONTA
      padRight('', 8) + // NR_CIB
      padLeftZero('', 12) + // NR_CEI_CNO
      formatBoolean(data.negociadoBolsa, '1/0') + // IN_BOLSA
      padRight(data.codigoNegociacaoBolsa, 20) + // NR_COD_NEGOCIACAO_BOLSA
      this.getNextControlNumber(); // NR_CONTROLE

    const finalLine = padRight(lineContent, 1174);
    const insertIndex = this.findInsertionIndex(['28', 'T9']); // Insert before R28 or T9
    this.editor.insertLine(insertIndex, finalLine);
    this.updateT9Counts(); // Update T9 after insertion
  }

  public addBemDireitoAcao(data: any /*BemDireitoWriteData*/): void {
    this.addOrUpdateBemDireitoInternal({ ...data, codigoBem: '31' }, '31');
  }

  public addBemDireitoFII(data: any /*BemDireitoWriteData*/): void {
    this.addOrUpdateBemDireitoInternal({ ...data, codigoBem: '73' }, '73');
  }

  public addBemDireitoOutros(data: any /*BemDireitoWriteData*/): void {
    // Used for JSCP não pago / Crédito FII em trânsito
    // Ensure description clearly identifies the item type
    this.addOrUpdateBemDireitoInternal({ ...data, codigoBem: '99' }, '99');
  }

  // --- Rendimentos Isentos (R84 / R86) ---

  public addRendimentoIsentoDividendo(data: RendimentoIsentoDividendoWriteData): void {
    if (!this.currentCpf) throw new Error('CPF do declarante não encontrado.');
    const tipoBenef = data.tipoBeneficiario || 'T';
    const cpfBenef = tipoBenef === 'D' ? data.cpfBeneficiario : this.currentCpf;
    if (!cpfBenef) throw new Error('CPF do beneficiário não encontrado para R84.');

    const lineContent =
      '84' +
      padRight(this.currentCpf, 11) +
      padRight(tipoBenef, 1) +
      padRight(cpfBenef, 11) +
      padLeftZero('9', 4) + // NR_COD = 0009
      padRight(data.cnpjFontePagadora, 14) +
      padRight(data.nomeFontePagadora, 60) +
      formatNumeric(data.valor, 13, 2) +
      formatNumeric(0, 13, 2) + // VR_VALOR_13 (N/A for dividends)
      padLeftZero('', 5) + // NR_CHAVE_BEM (Optional)
      this.getNextControlNumber();

    const finalLine = padRight(lineContent, 144);
    const insertIndex = this.findInsertionIndex(['85', '86', '87', '88', '89', '90', 'T9']); // Insert after last R84 or before next block
    this.editor.insertLine(insertIndex, finalLine);
    this.updateT9Counts();
    // TODO: Update R23 summary for code 09
  }

  public addRendimentoIsentoFII(data: RendimentoIsentoFIIWriteData): void {
    if (!this.currentCpf) throw new Error('CPF do declarante não encontrado.');
    const tipoBenef = data.tipoBeneficiario || 'T';
    const cpfBenef = tipoBenef === 'D' ? data.cpfBeneficiario : this.currentCpf;
    if (!cpfBenef) throw new Error('CPF do beneficiário não encontrado para R86.');

    const lineContent =
      '86' +
      padRight(this.currentCpf, 11) +
      padRight(tipoBenef, 1) +
      padRight(cpfBenef, 11) +
      padLeftZero('26', 4) + // NR_COD = 0026
      padRight(data.cnpjFontePagadora, 14) +
      padRight(data.nomeFontePagadora, 60) +
      formatNumeric(data.valor, 13, 2) +
      padRight(data.descricao, 60) + // NM_DESCRICAO
      padLeftZero('', 5) + // NR_CHAVE_BEM (Optional)
      this.getNextControlNumber();

    const finalLine = padRight(lineContent, 191);
    const insertIndex = this.findInsertionIndex(['87', '88', '89', '90', 'T9']); // Insert after last R86 or before next block
    this.editor.insertLine(insertIndex, finalLine);
    this.updateT9Counts();
    // TODO: Update R23 summary for code 26
  }

  // --- Rendimentos Exclusivos (R88) ---

  public addRendimentoExclusivoJSCP(data: RendimentoExclusivoJSCPWriteData): void {
    if (!this.currentCpf) throw new Error('CPF do declarante não encontrado.');
    const tipoBenef = data.tipoBeneficiario || 'T';
    const cpfBenef = tipoBenef === 'D' ? data.cpfBeneficiario : this.currentCpf;
    if (!cpfBenef) throw new Error('CPF do beneficiário não encontrado para R88.');

    const lineContent =
      '88' +
      padRight(this.currentCpf, 11) +
      padRight(tipoBenef, 1) +
      padRight(cpfBenef, 11) +
      padLeftZero('10', 4) + // NR_COD = 0010
      padRight(data.cnpjFontePagadora, 14) +
      padRight(data.nomeFontePagadora, 60) +
      formatNumeric(data.valor, 13, 2) +
      padLeftZero('', 5) + // NR_CHAVE_BEM (Optional)
      this.getNextControlNumber();

    const finalLine = padRight(lineContent, 131);
    const insertIndex = this.findInsertionIndex(['89', '90', 'T9']); // Insert after last R88 or before next block
    this.editor.insertLine(insertIndex, finalLine);
    this.updateT9Counts();
    // TODO: Update R24 summary for code 10
  }

  // --- Operações Comuns/Day Trade (R40 / R42) ---
  // These methods UPDATE existing monthly records, they don't add new months easily

  public setOperacaoComumMes(data: OperacaoComumDayTradeMesWriteData): boolean {
    if (!this.currentCpf) throw new Error('CPF do declarante não encontrado.');
    const tipoBenef = data.tipoBeneficiario === 'D' ? 'S' : 'N'; // E_DEPENDENTE is S/N
    const targetCpf = tipoBenef === 'S' ? data.cpfDependente : this.currentCpf;
    if (!targetCpf) throw new Error('CPF do beneficiário/dependente não fornecido para R40.');

    const lines = this.editor.findLinesByRecordType('40');
    let lineIndex = -1;

    for (const { index, content } of lines) {
      const mes = content.substring(13, 15); // Pos 14-15
      const cpfRec = content.substring(2, 13); // Pos 3-13
      const depIndicatorRec = content.substring(619, 620); // Pos 620
      const cpfDepRec = content.substring(620, 631); // Pos 621-631

      const isMatch =
        mes === data.mes &&
        cpfRec === this.currentCpf && // Match main CPF
        depIndicatorRec === tipoBenef &&
        (tipoBenef === 'N' || cpfDepRec === data.cpfDependente);

      if (isMatch) {
        lineIndex = index;
        break;
      }
    }

    if (lineIndex === -1) {
      console.warn(
        `R40 record for CPF ${this.currentCpf}, Beneficiary ${targetCpf}, Month ${data.mes} not found. Cannot update.`
      );

      // TODO: Implement logic to ADD a new R40 line if needed (complex due to ordering)
      return false;
    }

    // Update specific fields provided in data
    let success = true;
    const updateField = (
      fieldName: string,
      value: number | undefined,
      format: 'N' | 'NN',
      decimals: number
    ) => {
      if (value !== undefined) {
        const fieldDef = layout['40'].fields.find(f => f.name === fieldName);
        if (fieldDef) {
          try {
            // Formatting is now handled within updateFieldInLine
            const updateSuccess = this.editor.updateFieldInLine(
              lineIndex,
              fieldDef.start,
              fieldDef.end,
              value,
              fieldDef
            );
            if (!updateSuccess) {
              success = false; // Propagate failure
            }
          } catch (e) {
            console.error(`Error updating field ${fieldName} in R40:`, e);
            success = false;
          }
        } else {
          console.warn(`Field definition ${fieldName} not found in R40 layout.`);
          success = false;
        }
      }
    };

    updateField('GC_DAYTR_MVISTA_ACOES', data.gcDaytrMvistaAcoes, 'NN', 2);
    updateField('VR_RESLIQUIDO_MES_OPCOMUNS', data.vrResliquidoMesOpcomuns, 'NN', 2);
    updateField('VR_RESLIQUIDO_MES_DAYTRADE', data.vrResliquidoMesDaytrade, 'NN', 2);
    // ... update other fields from OperacaoComumDayTradeMesWriteData ...
    updateField('VR_IMPOSTOAPAGAR', data.vrImpostoapagar, 'N', 2);

    return success;
  }

  public setOperacaoFIIMes(data: OperacaoFIIMesWriteData): boolean {
    if (!this.currentCpf) throw new Error('CPF do declarante não encontrado.');
    const tipoBenef = data.tipoBeneficiario === 'D' ? 'S' : 'N'; // E_DEPENDENTE is S/N
    const targetCpf = tipoBenef === 'S' ? data.cpfDependente : this.currentCpf;
    if (!targetCpf) throw new Error('CPF do beneficiário/dependente não fornecido para R42.');

    const lines = this.editor.findLinesByRecordType('42');
    let lineIndex = -1;
    const mesStr = padLeftZero(data.mes, 2); // Ensure month is 2 digits

    for (const { index, content } of lines) {
      const mesRec = content.substring(13, 15); // Pos 14-15
      const cpfRec = content.substring(2, 13); // Pos 3-13
      const depIndicatorRec = content.substring(148, 149); // Pos 149
      const cpfDepRec = content.substring(149, 160); // Pos 150-160

      const isMatch =
        mesRec === mesStr &&
        cpfRec === this.currentCpf && // Match main CPF
        depIndicatorRec === tipoBenef &&
        (tipoBenef === 'N' || cpfDepRec === data.cpfDependente);

      if (isMatch) {
        lineIndex = index;
        break;
      }
    }

    if (lineIndex === -1) {
      console.warn(
        `R42 record for CPF ${this.currentCpf}, Beneficiary ${targetCpf}, Month ${mesStr} not found. Cannot update.`
      );

      // TODO: Implement logic to ADD a new R42 line if needed
      return false;
    }

    // Update specific fields
    let success = true;
    const updateField = (
      fieldName: string,
      value: number | undefined,
      format: 'N' | 'NN',
      decimals: number
    ) => {
      if (value !== undefined) {
        const fieldDef = layout['42'].fields.find(f => f.name === fieldName);
        if (fieldDef) {
          try {
            const formatted =
              format === 'NN'
                ? formatNegativeNumeric(value, fieldDef.size, decimals)
                : formatNumeric(value, fieldDef.size, decimals);
            this.editor.updateFieldInLine(
              lineIndex,
              fieldDef.start,
              fieldDef.end,
              formatted,
              fieldDef
            );
          } catch (e) {
            console.error(`Error updating field ${fieldName} in R42:`, e);
            success = false;
          }
        } else {
          console.warn(`Field definition ${fieldName} not found in R42 layout.`);
          success = false;
        }
      }
    };

    updateField('VR_RESLIQUIDO_MES', data.vrResliquidoMes, 'NN', 2);
    updateField('VRRESULT_NEG_MESANT', data.vrresultNegMesant, 'N', 2);
    updateField('VR_BASECALCULO_MES', data.vrBasecalculoMes, 'N', 2);
    updateField('VR_PREJACOMPENSAR_MES_OPCOMUNS', data.vrPrejacompensarMesOpcomuns, 'N', 2);
    updateField('VR_IMPOSTODEVIDO_MES_OPCOMUNS', data.vrImpostodevidoMesOpcomuns, 'N', 2);
    updateField('VR_IMPOSTO_PAGAR', data.vrImpostoPagar, 'N', 2);
    // ... update other fields from OperacaoFIIMesWriteData ...

    return success;
  }

  // --- T9 Update ---
  private updateT9Counts(): void {
    console.warn('T9 record count update not fully implemented yet.');
    const t9Lines = this.editor.findLinesByRecordType('T9');
    if (t9Lines.length === 0) {
      console.error('T9 record not found. Cannot update counts.');
      return;
    }
    const t9Index = t9Lines[0].index;
    let totalRecords = 0;

    // Recalculate counts for all relevant record types
    const recordPrefixes = Object.keys(layout).filter(k => k !== 'IR' && k !== 'T9'); // Exclude Header/Trailer itself
    recordPrefixes.forEach(prefix => {
      const count = this.editor.findLinesByRecordType(prefix).length;
      const t9FieldName = `QT_R${prefix}`;
      const fieldDef = layout.T9.fields.find(f => f.name === t9FieldName);
      if (fieldDef) {
        try {
          this.editor.updateFieldInLine(
            t9Index,
            fieldDef.start,
            fieldDef.end,
            padLeftZero(count, 5),
            'N'
          );
          totalRecords += count;
        } catch (e) {
          console.error(`Error updating T9 count for ${t9FieldName}:`, e);
        }
      } else {
        // console.warn(`T9 field ${t9FieldName} not found in layout definition.`);
      }
    });

    // Update QT_TOTAL (includes Header + Body records)
    const headerExists = this.editor.getLine(0)?.startsWith('IR') ? 1 : 0;
    totalRecords += headerExists; // Add header count
    const totalFieldDef = layout.T9.fields.find(f => f.name === 'QT_TOTAL');
    if (totalFieldDef) {
      try {
        this.editor.updateFieldInLine(
          t9Index,
          totalFieldDef.start,
          totalFieldDef.end,
          padLeftZero(totalRecords, 6),
          totalFieldDef
        );
      } catch (e) {
        console.error(`Error updating T9 QT_TOTAL:`, e);
      }
    } else {
      console.warn(`T9 field QT_TOTAL not found in layout definition.`);
    }
  }

  // TODO: Criar todos as seções necessárias
  // --- Potential Future Methods ---
  // addBemDireito(data: BemData): boolean { ... } // Requires line insertion logic
  // removeBemDireito(itemNumero: number): boolean { ... } // Requires line removal logic
  // updateRendimentoPJ(index: number, data: RendimentoPJData): boolean { ... }
  // addRendimentoPJ(data: RendimentoPJData): boolean { ... }

  /**
   * Returns the underlying DBKFileEditor instance.
   * Useful if direct low-level access is needed after using the writer.
   */
  public getEditor(): DBKFileEditor {
    return this.editor;
  }

  /**
   * Returns the complete file content as a single string, including any modifications made.
   * Convenience method that calls the editor's getRawContent.
   * @returns The raw file content string.
   */
  public getRawContent(): string {
    // Optionally update T9 before returning raw content if needed for immediate use
    this.updateT9Counts();
    return this.editor.getRawContent();
  }
}
