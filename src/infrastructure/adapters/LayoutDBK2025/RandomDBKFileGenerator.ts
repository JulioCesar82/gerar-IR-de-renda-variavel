import { format, subYears } from 'date-fns';
import { layout, buildRecordLine } from './layout';

// --- Random Data Generation Helpers ---

function generateRandomString(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ ';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function generateRandomDigits(length: number): string {
  const digits = '0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += digits.charAt(Math.floor(Math.random() * digits.length));
  }
  return result;
}

function generateRandomCPF(): string {
  // Basic CPF format generation (doesn't calculate check digits)
  return generateRandomDigits(11);
}

function generateRandomCNPJ(): string {
  // Basic CNPJ format generation
  return generateRandomDigits(14);
}

function generateRandomDate(year: number): string {
  const month = Math.floor(Math.random() * 12) + 1;
  const day = Math.floor(Math.random() * 28) + 1; // Keep it simple, avoid month length issues
  return `${String(day).padStart(2, '0')}${String(month).padStart(2, '0')}${year}`;
}

// --- Random Data Generation Logic ---

export class RandomDBKFileGenerator {
  private year: number;
  private baseYear: number;
  private recordCounts: Record<string, number> = {};

  constructor(year: number = new Date().getFullYear()) {
    this.year = year;
    this.baseYear = year - 1;
    this.resetCounts();
  }

  private resetCounts() {
    this.recordCounts = Object.keys(layout).reduce((acc, key) => {
      acc[key] = 0;
      return acc;
    }, {} as Record<string, number>);
    this.recordCounts['IR'] = 0; // Explicitly add IR if not in layout keys
    this.recordCounts['T9'] = 0; // Explicitly add T9 if not in layout keys
  }

  private incrementCount(recordPrefix: string) {
    if (this.recordCounts[recordPrefix] !== undefined) {
      this.recordCounts[recordPrefix]++;
    } else {
        // Handle prefixes like '16', '21' etc.
        const numericPrefix = recordPrefix.match(/^\d+$/);
        if (numericPrefix) {
            const key = `R${recordPrefix}`; // Match T9 format like QT_R16
             if (this.recordCounts[key] !== undefined) {
                 this.recordCounts[key]++;
             } else {
                 console.warn(`Record count key ${key} not found in T9 layout definition for prefix ${recordPrefix}`);
                 this.recordCounts[recordPrefix] = (this.recordCounts[recordPrefix] || 0) + 1; // Fallback
             }
        } else {
             console.warn(`Record count key not found for prefix ${recordPrefix}`);
             this.recordCounts[recordPrefix] = (this.recordCounts[recordPrefix] || 0) + 1; // Fallback
        }
    }
  }


  generateDeclaration(): string {
    this.resetCounts();
    const lines: string[] = [];
    const cpf = generateRandomCPF();
    const nome = `CONTRIBUINTE ${generateRandomString(15)}`.substring(0, 60);
    const isCompleta = Math.random() > 0.5;

    // --- Generate Header (IR) ---
    const headerData = {
      SISTEMA: 'IRPF    ',
      EXERCICIO: this.year,
      ANO_BASE: this.baseYear,
      CODIGO_RECNET: 3500, // Ajuste Anual (assuming)
      IN_RETIFICADORA: '0',
      NR_CPF: cpf,
      NI_FILLER: '   ',
      TIPO_NI: 1,
      NR_VERSAO: 100, // Example version
      NM_NOME: nome,
      SG_UF: 'SP',
      NR_HASH: generateRandomDigits(10), // Placeholder hash
      IN_CERTIFICAVEL: 0,
      DT_NASCIM: generateRandomDate(this.baseYear - 30),
      IN_COMPLETA: isCompleta ? 'S' : 'N',
      IN_RESULTADO_IMPOSTO: Math.floor(Math.random() * 4).toString(), // 0-3
      IN_GERADA: 'S',
      NR_RECIBO_ULTIMA_DEC_EX_ATUAL: ''.padEnd(10, ' '),
      FILLER_134: ' ',
      NOME_SO: 'WINDOWS 11'.padEnd(14, ' '),
      VERSAO_SO: '10.0'.padEnd(7, ' '),
      VERSAO_JVM: '11.0.15'.padEnd(9, ' '),
      NR_RECIBO_DECLARACAO_TRANSMITIDA: generateRandomDigits(10), // Placeholder
      CD_MUNICIP: 3550308, // Example: Sao Paulo
      NR_CONJ: ''.padEnd(11, ' '),
      IN_OBRIGAT_ENTREGA: '1',
      VR_IMPDEVIDO: Math.random() * 10000,
      NR_RECIBO_ULTIMA_DEC_EX_ANTERIOR: generateRandomDigits(10),
      IN_SEGURANCA: Math.floor(Math.random() * 3).toString(), // 0-2
      IN_IMPOSTO_PAGO: '00', // Example
      IN_IMPOSTO_ANTECIPADO: '0', // Example
      IN_MUDA_ENDERECO: '0',
      NR_CEP: generateRandomDigits(8),
      IN_DEBITO_PRIMEIRA_QUOTA: '0',
      NR_BANCO: '001', // Example Banco do Brasil
      NR_AGENCIA: generateRandomDigits(4),
      IN_SOBREPARTILHA: '0',
      DATA_TRANSITO_JULGADO_LAVRATURA: ''.padEnd(8, ' '),
      VR__SOMA_IMPOSTO_PAGAR: Math.random() * 11000,
      // ... fill other IR fields with random/default data
      NR_CONTROLE: generateRandomDigits(10),
    };
    lines.push(buildRecordLine('IR', headerData));
    this.incrementCount('IR');


    // --- Generate Declarante (16) ---
     const declaranteData = {
        NR_REG: 16,
        NR_CPF: cpf,
        NM_NOME: nome,
        TIP_LOGRA: 'RUA'.padEnd(15, ' '),
        NM_LOGRA: `LOGRADOURO ${generateRandomString(10)}`.substring(0, 40),
        NR_NUMERO: generateRandomDigits(4).padEnd(6, ' '),
        NM_COMPLEM: `APTO ${generateRandomDigits(3)}`.padEnd(21, ' '),
        NM_BAIRRO: `BAIRRO ${generateRandomString(5)}`.substring(0, 19),
        NR_CEP: headerData.NR_CEP.padEnd(9, ' '), // Use same CEP as header
        CD_MUNICIP: headerData.CD_MUNICIP,
        NM_MUNICIP: 'SAO PAULO'.padEnd(40, ' '), // Example
        SG_UF: headerData.SG_UF,
        CD_EX: '   ',
        CD_PAIS: '105', // Brasil
        NM_EMAIL: `${nome.replace(/\s+/g, '.').toLowerCase()}@email.com`.substring(0, 90),
        NR_NITPISPASEP: generateRandomDigits(11),
        NR_CPF_CONJUGE: ''.padEnd(11, ' '),
        NR_DDD_TELEFONE: '11'.padEnd(4, ' '),
        Filler_352: ''.padEnd(9, ' '),
        DT_NASCIM: headerData.DT_NASCIM,
        NR_TITELEITOR: generateRandomDigits(13),
        CD_OCUP: '001', // Example code
        CD_NATUR: '10', // Example code
        NR_QUOTAS: 1,
        IN_COMPLETA: headerData.IN_COMPLETA,
        IN_RETIFICADORA: headerData.IN_RETIFICADORA,
        IN_GERADO: headerData.IN_GERADA,
        IN_ENDERECO: headerData.IN_MUDA_ENDERECO,
        NR_CONTROLE_ORIGINAL: ''.padEnd(12, ' '),
        NR_BANCO: headerData.NR_BANCO,
        NR_AGENCIA: headerData.NR_AGENCIA,
        IN_DOENCA_DEFICIENCIA: 'N',
        IN_PREPREENCHIDA: '0',
        DT_DIA_UTIL_RECIBO: format(new Date(), 'yyyyMMdd'), // Example
        Filler_421: ''.padEnd(5, ' '),
        NR_DV_CONTA: generateRandomDigits(2),
        IN_DEBITO_AUTOM: 'N',
        IN_DEBITO_PRIMEIRA_QUOTA: headerData.IN_DEBITO_PRIMEIRA_QUOTA,
        NR_FONTE_PRINCIPAL: generateRandomCNPJ(),
        NR_RECIBO_ULTIMA_DEC_ANO_ANTERIOR: headerData.NR_RECIBO_ULTIMA_DEC_EX_ANTERIOR,
        IN_TIPODECLARACAO: 'A', // Ajuste
        NR_CPF_PROCURADOR: ''.padEnd(11, ' '),
        NR_REGISTRO_PROFISSIONAL: ''.padEnd(20, ' '),
        NR_DDD_CELULAR: '11',
        NR_CELULAR: generateRandomDigits(9),
        IN_CONJUGE: 'N',
        NR_TELEFONE: generateRandomDigits(11),
        IN_TIPO_CONTA: '1', // Conta Corrente
        NR_CONTA: generateRandomDigits(10).padEnd(20, ' '),
        NR_NUMERO_PROCESSO: ''.padEnd(17, ' '),
        CPF_RESPONSAVEL: cpf,
        NR_DATA_ORIGINAL_RETIFICADORA: format(subYears(new Date(), 1), 'yyyyMMdd'), // Example
        NR_HORA_ORIGINAL_RETIFICADORA: format(new Date(), 'HHmmss'), // Example
        TX_MENSAGEM_RECIBO: ''.padEnd(300, ' '),
        NR_CONTROLE: generateRandomDigits(10),
     };
    lines.push(buildRecordLine('16', declaranteData));
    this.incrementCount('16');

    // --- Generate other records randomly (Example: Add R21 if needed) ---
    // if (Math.random() > 0.3) { // Example: 70% chance of having R21
    //     const r21Data = { ... };
    //     lines.push(buildRecordLine('21', r21Data));
    //     this.incrementCount('21');
    // }

    // --- Generate Trailer (T9) ---
    const trailerData: Record<string, any> = {
        NR_REG: 'T9',
        NR_CPF: cpf,
        QT_TOTAL: lines.length + 1, // +1 for the T9 itself (Header is counted in lines.length here)
    };
    // Populate QT_Rxx fields from recordCounts
    for (const key in this.recordCounts) {
        if (key.startsWith('R')) { // e.g., R16, R21
            trailerData[`QT_${key}`] = this.recordCounts[key];
        } else if (key === 'IR') {
             // Header is included in QT_TOTAL, not a separate QT_ field in T9
        }
         // Add specific handling if T9 layout uses different keys than Rxx
    }
     // Ensure all QT_Rxx fields defined in the layout exist, even if count is 0
     layout.T9.fields.forEach(field => {
         if (field.name.startsWith('QT_R') && !trailerData[field.name]) {
             trailerData[field.name] = 0;
         }
     });

    trailerData['NR_CONTROLE'] = generateRandomDigits(10);

    lines.push(buildRecordLine('T9', trailerData));
    // Don't increment T9 count for itself

    return lines.join('\r\n') + '\r\n'; // Use CRLF line endings as is common
  }
}

// Example Usage (can be removed or used for testing)
// const generator = new RandomDBKFileGenerator(2025);
// const randomFileContent = generator.generateDeclaration();
// console.log(randomFileContent);
