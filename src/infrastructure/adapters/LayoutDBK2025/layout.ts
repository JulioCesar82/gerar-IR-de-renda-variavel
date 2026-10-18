import { format as formatDateFns } from 'date-fns';

// --- Interfaces based on Layout ---
// Shared by ReaderDBKFileEditor, WritterDBKFileEditor and RandomDBKFileGenerator.
// Previously each of those files kept its own (partially diverging and, in the
// Writter's case, incomplete) copy of these interfaces and the `layout` object.

export interface FieldDefinition {
  name: string;
  start: number; // 1-based index
  end: number;
  size: number;
  decimals?: number;
  format: 'N' | 'NN' | 'A' | 'C' | 'I' | 'D'; // Added 'D' for Date
}

export interface RecordDefinition {
  prefix: string;
  fields: FieldDefinition[];
  totalLength: number;
}

// --- Layout Definition ---
export const layout: { [key: string]: RecordDefinition } = {
  IR: {
    prefix: 'IR',
    totalLength: 1203,
    fields: [
      { name: 'SISTEMA', start: 1, end: 8, size: 8, format: 'C' },
      { name: 'EXERCICIO', start: 9, end: 12, size: 4, format: 'N' },
      { name: 'ANO_BASE', start: 13, end: 16, size: 4, format: 'N' },
      { name: 'CODIGO_RECNET', start: 17, end: 20, size: 4, format: 'N' },
      { name: 'IN_RETIFICADORA', start: 21, end: 21, size: 1, format: 'C' },
      { name: 'NR_CPF', start: 22, end: 32, size: 11, format: 'C' },
      { name: 'NI_FILLER', start: 33, end: 35, size: 3, format: 'C' },
      { name: 'TIPO_NI', start: 36, end: 36, size: 1, format: 'N' },
      { name: 'NR_VERSAO', start: 37, end: 39, size: 3, format: 'N' },
      { name: 'NM_NOME', start: 40, end: 99, size: 60, format: 'A' },
      { name: 'SG_UF', start: 100, end: 101, size: 2, format: 'A' },
      { name: 'NR_HASH', start: 102, end: 111, size: 10, format: 'N' },
      { name: 'IN_CERTIFICAVEL', start: 112, end: 112, size: 1, format: 'N' },
      { name: 'DT_NASCIM', start: 113, end: 120, size: 8, format: 'D' }, // Format D for Date
      { name: 'IN_COMPLETA', start: 121, end: 121, size: 1, format: 'C' },
      { name: 'IN_RESULTADO_IMPOSTO', start: 122, end: 122, size: 1, format: 'C' },
      { name: 'IN_GERADA', start: 123, end: 123, size: 1, format: 'C' },
      { name: 'NR_RECIBO_ULTIMA_DEC_EX_ATUAL', start: 124, end: 133, size: 10, format: 'C' },
      { name: 'FILLER_134', start: 134, end: 134, size: 1, format: 'C' },
      { name: 'NOME_SO', start: 135, end: 148, size: 14, format: 'C' },
      { name: 'VERSAO_SO', start: 149, end: 155, size: 7, format: 'C' },
      { name: 'VERSAO_JVM', start: 156, end: 164, size: 9, format: 'C' },
      { name: 'NR_RECIBO_DECLARACAO_TRANSMITIDA', start: 165, end: 174, size: 10, format: 'C' },
      { name: 'CD_MUNICIP', start: 175, end: 178, size: 4, format: 'N' },
      { name: 'NR_CONJ', start: 179, end: 189, size: 11, format: 'C' },
      { name: 'IN_OBRIGAT_ENTREGA', start: 190, end: 190, size: 1, format: 'C' },
      { name: 'VR_IMPDEVIDO', start: 191, end: 203, size: 13, decimals: 2, format: 'N' },
      { name: 'NR_RECIBO_ULTIMA_DEC_EX_ANTERIOR', start: 204, end: 213, size: 10, format: 'C' },
      { name: 'IN_SEGURANCA', start: 214, end: 214, size: 1, format: 'N' },
      { name: 'IN_IMPOSTO_PAGO', start: 215, end: 216, size: 2, format: 'N' },
      { name: 'IN_IMPOSTO_ANTECIPADO', start: 217, end: 217, size: 1, format: 'N' },
      { name: 'IN_MUDA_ENDERECO', start: 218, end: 218, size: 1, format: 'N' },
      { name: 'NR_CEP', start: 219, end: 226, size: 8, format: 'N' },
      { name: 'IN_DEBITO_PRIMEIRA_QUOTA', start: 227, end: 227, size: 1, format: 'N' },
      { name: 'NR_BANCO', start: 228, end: 230, size: 3, format: 'N' },
      { name: 'NR_AGENCIA', start: 231, end: 234, size: 4, format: 'N' },
      { name: 'IN_SOBREPARTILHA', start: 235, end: 235, size: 1, format: 'C' },
      { name: 'DATA_TRANSITO_JULGADO_LAVRATURA', start: 236, end: 243, size: 8, format: 'D' }, // Format D
      { name: 'VR__SOMA_IMPOSTO_PAGAR', start: 244, end: 256, size: 13, decimals: 2, format: 'N' },
      // Positions 257-1193 are not yet mapped (undocumented in the layout spec available to
      // this project). Do NOT rely on this record for fields other than the ones listed above.
      { name: 'NR_CONTROLE', start: 1194, end: 1203, size: 10, format: 'N' },
    ],
  },
  '16': {
    prefix: '16',
    totalLength: 881,
    fields: [
      { name: 'NR_REG', start: 1, end: 2, size: 2, format: 'N' },
      { name: 'NR_CPF', start: 3, end: 13, size: 11, format: 'C' },
      { name: 'NM_NOME', start: 14, end: 73, size: 60, format: 'A' },
      { name: 'TIP_LOGRA', start: 74, end: 88, size: 15, format: 'A' },
      { name: 'NM_LOGRA', start: 89, end: 128, size: 40, format: 'C' },
      { name: 'NR_NUMERO', start: 129, end: 134, size: 6, format: 'C' },
      { name: 'NM_COMPLEM', start: 135, end: 155, size: 21, format: 'C' },
      { name: 'NM_BAIRRO', start: 156, end: 174, size: 19, format: 'C' },
      { name: 'NR_CEP', start: 175, end: 183, size: 9, format: 'C' },
      { name: 'CD_MUNICIP', start: 184, end: 187, size: 4, format: 'N' },
      { name: 'NM_MUNICIP', start: 188, end: 227, size: 40, format: 'C' },
      { name: 'SG_UF', start: 228, end: 229, size: 2, format: 'A' },
      { name: 'CD_EX', start: 230, end: 232, size: 3, format: 'C' },
      { name: 'CD_PAIS', start: 233, end: 235, size: 3, format: 'C' },
      { name: 'NM_EMAIL', start: 236, end: 325, size: 90, format: 'C' },
      { name: 'NR_NITPISPASEP', start: 326, end: 336, size: 11, format: 'C' },
      { name: 'NR_CPF_CONJUGE', start: 337, end: 347, size: 11, format: 'C' },
      { name: 'NR_DDD_TELEFONE', start: 348, end: 351, size: 4, format: 'C' },
      { name: 'Filler_352', start: 352, end: 360, size: 9, format: 'C' },
      { name: 'DT_NASCIM', start: 361, end: 368, size: 8, format: 'D' }, // Format D
      { name: 'NR_TITELEITOR', start: 369, end: 381, size: 13, format: 'C' },
      { name: 'CD_OCUP', start: 382, end: 384, size: 3, format: 'A' },
      { name: 'CD_NATUR', start: 385, end: 386, size: 2, format: 'A' },
      { name: 'NR_QUOTAS', start: 387, end: 387, size: 1, format: 'N' },
      { name: 'IN_COMPLETA', start: 388, end: 388, size: 1, format: 'C' },
      { name: 'IN_RETIFICADORA', start: 389, end: 389, size: 1, format: 'C' },
      { name: 'IN_GERADO', start: 390, end: 390, size: 1, format: 'C' },
      { name: 'IN_ENDERECO', start: 391, end: 391, size: 1, format: 'C' },
      { name: 'NR_CONTROLE_ORIGINAL', start: 392, end: 403, size: 12, format: 'C' },
      { name: 'NR_BANCO', start: 404, end: 406, size: 3, format: 'N' },
      { name: 'NR_AGENCIA', start: 407, end: 410, size: 4, format: 'N' },
      { name: 'IN_DOENCA_DEFICIENCIA', start: 411, end: 411, size: 1, format: 'C' },
      { name: 'IN_PREPREENCHIDA', start: 412, end: 412, size: 1, format: 'C' },
      { name: 'DT_DIA_UTIL_RECIBO', start: 413, end: 420, size: 8, format: 'D' }, // Format D
      { name: 'Filler_421', start: 421, end: 425, size: 5, format: 'C' },
      { name: 'NR_DV_CONTA', start: 426, end: 427, size: 2, format: 'C' },
      { name: 'IN_DEBITO_AUTOM', start: 428, end: 428, size: 1, format: 'A' },
      { name: 'IN_DEBITO_PRIMEIRA_QUOTA', start: 429, end: 429, size: 1, format: 'N' },
      { name: 'NR_FONTE_PRINCIPAL', start: 430, end: 443, size: 14, format: 'C' },
      { name: 'NR_RECIBO_ULTIMA_DEC_ANO_ANTERIOR', start: 444, end: 453, size: 10, format: 'C' },
      { name: 'IN_TIPODECLARACAO', start: 454, end: 454, size: 1, format: 'C' },
      { name: 'NR_CPF_PROCURADOR', start: 455, end: 465, size: 11, format: 'C' },
      { name: 'NR_REGISTRO_PROFISSIONAL', start: 466, end: 485, size: 20, format: 'A' },
      { name: 'NR_DDD_CELULAR', start: 486, end: 487, size: 2, format: 'C' },
      { name: 'NR_CELULAR', start: 488, end: 496, size: 9, format: 'C' },
      { name: 'IN_CONJUGE', start: 497, end: 497, size: 1, format: 'C' },
      { name: 'NR_TELEFONE', start: 498, end: 508, size: 11, format: 'C' },
      { name: 'IN_TIPO_CONTA', start: 509, end: 509, size: 1, format: 'C' },
      { name: 'NR_CONTA', start: 510, end: 529, size: 20, format: 'C' },
      { name: 'NR_NUMERO_PROCESSO', start: 530, end: 546, size: 17, format: 'C' },
      { name: 'CPF_RESPONSAVEL', start: 547, end: 557, size: 11, format: 'C' },
      { name: 'NR_DATA_ORIGINAL_RETIFICADORA', start: 558, end: 565, size: 8, format: 'D' }, // Format D
      { name: 'NR_HORA_ORIGINAL_RETIFICADORA', start: 566, end: 571, size: 6, format: 'N' }, // Time as number HHMMSS
      { name: 'TX_MENSAGEM_RECIBO', start: 572, end: 871, size: 300, format: 'C' },
      { name: 'NR_CONTROLE', start: 872, end: 881, size: 10, format: 'N' },
    ],
  },
  '27': {
    prefix: '27',
    totalLength: 1174,
    fields: [
      { name: 'NR_REG', start: 1, end: 2, size: 2, format: 'N' },
      { name: 'NR_CPF', start: 3, end: 13, size: 11, format: 'C' },
      { name: 'CD_BEM', start: 14, end: 15, size: 2, format: 'N' },
      { name: 'IN_EXTERIOR', start: 16, end: 16, size: 1, format: 'N' }, // 0 or 1
      { name: 'CD_PAIS', start: 17, end: 19, size: 3, format: 'N' }, // Should be N based on usage
      { name: 'TX_BEM', start: 20, end: 531, size: 512, format: 'C' },
      { name: 'VR_ANTER', start: 532, end: 544, size: 13, decimals: 2, format: 'N' },
      { name: 'VR_ATUAL', start: 545, end: 557, size: 13, decimals: 2, format: 'N' },
      { name: 'NM_LOGRA', start: 558, end: 597, size: 40, format: 'C' },
      { name: 'NR_NUMERO', start: 598, end: 603, size: 6, format: 'C' },
      { name: 'NM_COMPLEM', start: 604, end: 643, size: 40, format: 'C' },
      { name: 'NM_BAIRRO', start: 644, end: 683, size: 40, format: 'C' },
      { name: 'NR_CEP', start: 684, end: 692, size: 9, format: 'C' },
      { name: 'SG_UF', start: 693, end: 694, size: 2, format: 'C' }, // Should be C or A
      { name: 'CD_MUNICIP', start: 695, end: 698, size: 4, format: 'N' },
      { name: 'NM_MUNICIP', start: 699, end: 738, size: 40, format: 'C' },
      { name: 'NM_IND_REG_IMOV', start: 739, end: 739, size: 1, format: 'N' }, // 0, 1, 2
      { name: 'MATRIC_IMOV', start: 740, end: 779, size: 40, format: 'A' },
      { name: 'Filler_780', start: 780, end: 819, size: 40, format: 'A' }, // Marked as Filler in doc
      { name: 'AREA', start: 820, end: 830, size: 11, decimals: 1, format: 'N' },
      { name: 'NM_UNID', start: 831, end: 831, size: 1, format: 'N' }, // 0, 1, 2
      { name: 'NM_CARTORIO', start: 832, end: 891, size: 60, format: 'A' },
      { name: 'NR_CHAVE_BEM', start: 892, end: 896, size: 5, format: 'N' },
      { name: 'DT_AQUISICAO', start: 897, end: 904, size: 8, format: 'D' }, // Format D
      { name: 'Filler_905', start: 905, end: 924, size: 20, format: 'C' },
      { name: 'FILLER_925', start: 925, end: 932, size: 8, format: 'N' }, // Marked as FILLER
      { name: 'NR_RENAVAN', start: 933, end: 962, size: 30, format: 'C' },
      { name: 'NR_DEP_AVIACAO_CIVIL', start: 963, end: 992, size: 30, format: 'C' },
      { name: 'NR_CAPITANIA_PORTOS', start: 993, end: 1022, size: 30, format: 'C' },
      { name: 'NR_AGENCIA', start: 1023, end: 1026, size: 4, format: 'N' },
      { name: 'Filler_1027', start: 1027, end: 1039, size: 13, format: 'C' },
      { name: 'NR_DV_CONTA', start: 1040, end: 1041, size: 2, format: 'C' },
      { name: 'NM_CPFCNPJ', start: 1042, end: 1055, size: 14, format: 'C' },
      { name: 'NR_IPTU', start: 1056, end: 1085, size: 30, format: 'C' },
      { name: 'NR_BANCO', start: 1086, end: 1088, size: 3, format: 'N' },
      { name: 'IN_TIPO_BENEFIC', start: 1089, end: 1089, size: 1, format: 'C' }, // T or D
      { name: 'NR_CPF_BENEFIC', start: 1090, end: 1100, size: 11, format: 'C' },
      { name: 'CD_GRUPO_BEM', start: 1101, end: 1102, size: 2, format: 'C' }, // Should be C or N?
      { name: 'IN_BEM_INVENTARIAR', start: 1103, end: 1103, size: 1, format: 'N' }, // 0 or 1
      { name: 'NR_CONTA', start: 1104, end: 1123, size: 20, format: 'C' },
      { name: 'NR_CIB', start: 1124, end: 1131, size: 8, format: 'A' },
      { name: 'NR_CEI_CNO', start: 1132, end: 1143, size: 12, format: 'N' },
      { name: 'IN_BOLSA', start: 1144, end: 1144, size: 1, format: 'N' }, // 0 or 1
      { name: 'NR_COD_NEGOCIACAO_BOLSA', start: 1145, end: 1164, size: 20, format: 'A' },
      { name: 'NR_CONTROLE', start: 1165, end: 1174, size: 10, format: 'N' },
    ],
  },
  '23': {
    // Rendimentos Isentos e Não Tributáveis (Summary)
    prefix: '23',
    totalLength: 40,
    fields: [
      { name: 'NR_REG', start: 1, end: 2, size: 2, format: 'N' },
      { name: 'NR_CPF', start: 3, end: 13, size: 11, format: 'C' },
      { name: 'NR_COD_ISENTO', start: 14, end: 17, size: 4, format: 'N' },
      { name: 'VR_VALOR', start: 18, end: 30, size: 13, decimals: 2, format: 'N' },
      { name: 'NR_CONTROLE', start: 31, end: 40, size: 10, format: 'N' },
    ],
  },
  '24': {
    // Rendimentos Sujeitos a Tributação Exclusiva (Summary)
    prefix: '24',
    totalLength: 40,
    fields: [
      { name: 'NR_REG', start: 1, end: 2, size: 2, format: 'N' },
      { name: 'NR_CPF', start: 3, end: 13, size: 11, format: 'C' },
      { name: 'NR_COD_EXCLUSIVO', start: 14, end: 17, size: 4, format: 'N' },
      { name: 'VR_VALOR', start: 18, end: 30, size: 13, decimals: 2, format: 'N' },
      { name: 'NR_CONTROLE', start: 31, end: 40, size: 10, format: 'N' },
    ],
  },
  '40': {
    // Renda Variável - Resumo Mensal Comum/DayTrade
    prefix: '40',
    totalLength: 641,
    fields: [
      { name: 'NR_REG', start: 1, end: 2, size: 2, format: 'N' },
      { name: 'NR_CPF', start: 3, end: 13, size: 11, format: 'C' },
      { name: 'RV_MES', start: 14, end: 15, size: 2, format: 'C' }, // Month 01-12
      { name: 'GC_COMUM_MVISTA_ACOES', start: 16, end: 28, size: 13, decimals: 2, format: 'NN' },
      { name: 'GC_COMUM_MVISTA_OURO', start: 29, end: 41, size: 13, decimals: 2, format: 'NN' },
      { name: 'GC_COMUM_MVISTA_OUROFORA', start: 42, end: 54, size: 13, decimals: 2, format: 'NN' },
      { name: 'GC_COMUM_MOPC_ACOES', start: 55, end: 67, size: 13, decimals: 2, format: 'NN' },
      { name: 'GC_COMUM_MOPC_OURO', start: 68, end: 80, size: 13, decimals: 2, format: 'NN' },
      { name: 'GC_COMUM_MOPC_OUROFORA', start: 81, end: 93, size: 13, decimals: 2, format: 'NN' },
      { name: 'GC_COMUM_MOPC_OUTROS', start: 94, end: 106, size: 13, decimals: 2, format: 'NN' },
      { name: 'GC_COMUM_MFUT_DOLAR', start: 107, end: 119, size: 13, decimals: 2, format: 'NN' },
      { name: 'GC_COMUM_MFUT_INDICES', start: 120, end: 132, size: 13, decimals: 2, format: 'NN' },
      { name: 'GC_COMUM_MFUT_JUROS', start: 133, end: 145, size: 13, decimals: 2, format: 'NN' },
      { name: 'GC_COMUM_MFUT_OUTROS', start: 146, end: 158, size: 13, decimals: 2, format: 'NN' },
      {
        name: 'GC_COMUM_MTERMO_ACOESOURO',
        start: 159,
        end: 171,
        size: 13,
        decimals: 2,
        format: 'NN',
      },
      { name: 'GC_COMUM_MTERMO_OUTROS', start: 172, end: 184, size: 13, decimals: 2, format: 'NN' },
      { name: 'GC_DAYTR_MVISTA_ACOES', start: 185, end: 197, size: 13, decimals: 2, format: 'NN' },
      { name: 'GC_DAYTR_MVISTA_OURO', start: 198, end: 210, size: 13, decimals: 2, format: 'NN' },
      {
        name: 'GC_DAYTR_MVISTA_OUROFORA',
        start: 211,
        end: 223,
        size: 13,
        decimals: 2,
        format: 'NN',
      },
      { name: 'GC_DAYTR_MOPC_ACOES', start: 224, end: 236, size: 13, decimals: 2, format: 'NN' },
      { name: 'GC_DAYTR_MOPC_OURO', start: 237, end: 249, size: 13, decimals: 2, format: 'NN' },
      { name: 'GC_DAYTR_MOPC_OUROFORA', start: 250, end: 262, size: 13, decimals: 2, format: 'NN' },
      { name: 'GC_DAYTR_MOPC_OUTROS', start: 263, end: 275, size: 13, decimals: 2, format: 'NN' },
      { name: 'GC_DAYTR_MFUT_DOLAR', start: 276, end: 288, size: 13, decimals: 2, format: 'NN' },
      { name: 'GC_DAYTR_MFUT_INDICES', start: 289, end: 301, size: 13, decimals: 2, format: 'NN' },
      { name: 'GC_DAYTR_MFUT_JUROS', start: 302, end: 314, size: 13, decimals: 2, format: 'NN' },
      { name: 'GC_DAYTR_MFUT_OUTROS', start: 315, end: 327, size: 13, decimals: 2, format: 'NN' },
      {
        name: 'GC_DAYTR_MTERMO_ACOESOURO',
        start: 328,
        end: 340,
        size: 13,
        decimals: 2,
        format: 'NN',
      },
      { name: 'GC_DAYTR_MTERMO_OUTROS', start: 341, end: 353, size: 13, decimals: 2, format: 'NN' },
      { name: 'VR_FONTE_DAYTRADE', start: 354, end: 366, size: 13, decimals: 2, format: 'N' },
      { name: 'VR_IMPOSTOPAGO', start: 367, end: 379, size: 13, decimals: 2, format: 'N' },
      { name: 'VR_IMPRENDAFONTE', start: 380, end: 392, size: 13, decimals: 2, format: 'N' },
      {
        name: 'VRRESULT_NEG_MESANT_COMUM',
        start: 393,
        end: 405,
        size: 13,
        decimals: 2,
        format: 'N',
      },
      {
        name: 'VRRESULT_NEG_MESANT_DAYTR',
        start: 406,
        end: 418,
        size: 13,
        decimals: 2,
        format: 'N',
      },
      {
        name: 'VR_FONTE_DAYTRADEANTERIORJANEIRO',
        start: 419,
        end: 431,
        size: 13,
        decimals: 2,
        format: 'N',
      },
      {
        name: 'VR_RESLIQUIDO_MES_OPCOMUNS',
        start: 432,
        end: 444,
        size: 13,
        decimals: 2,
        format: 'NN',
      },
      {
        name: 'VR_RESLIQUIDO_MES_DAYTRADE',
        start: 445,
        end: 457,
        size: 13,
        decimals: 2,
        format: 'NN',
      },
      {
        name: 'VR_BASECALCULO_MES_OPCOMUNS',
        start: 458,
        end: 470,
        size: 13,
        decimals: 2,
        format: 'N',
      },
      {
        name: 'VR_BASECALCULO_MES_DAYTRADE',
        start: 471,
        end: 483,
        size: 13,
        decimals: 2,
        format: 'N',
      },
      {
        name: 'VR_PREJACOMPENSAR_MES_OPCOMUNS',
        start: 484,
        end: 496,
        size: 13,
        decimals: 2,
        format: 'N',
      },
      {
        name: 'VR_PREJACOMPENSAR_MES_DAYTRADE',
        start: 497,
        end: 509,
        size: 13,
        decimals: 2,
        format: 'N',
      },
      { name: 'VR_ALIQUOTA_IMPOSTO_OPCOMUNS', start: 510, end: 512, size: 3, format: 'N' }, // e.g., 150 for 15.0%? No decimals in doc
      { name: 'VR_ALIQUOTA_IMPOSTO_DAYTRADE', start: 513, end: 515, size: 3, format: 'N' }, // e.g., 200 for 20.0%?
      {
        name: 'VR_IMPOSTODEVIDO_MES_OPCOMUNS',
        start: 516,
        end: 528,
        size: 13,
        decimals: 2,
        format: 'N',
      },
      {
        name: 'VR_IMPOSTODEVIDO_MES_DAYTRADE',
        start: 529,
        end: 541,
        size: 13,
        decimals: 2,
        format: 'N',
      },
      { name: 'VR_TOTAL_IMPDEVIDO', start: 542, end: 554, size: 13, decimals: 2, format: 'N' },
      {
        name: 'VR_IRFONTE_MESESANT_DAYTRADE',
        start: 555,
        end: 567,
        size: 13,
        decimals: 2,
        format: 'N',
      },
      {
        name: 'VR_IRFONTE_DAYTRADE_ACOMPENSAR',
        start: 568,
        end: 580,
        size: 13,
        decimals: 2,
        format: 'N',
      },
      { name: 'VR_IMPOSTOAPAGAR', start: 581, end: 593, size: 13, decimals: 2, format: 'N' },
      { name: 'VR_IRF_MESESANT', start: 594, end: 606, size: 13, decimals: 2, format: 'N' },
      { name: 'VR_IRF_COMPENSAR', start: 607, end: 619, size: 13, decimals: 2, format: 'N' },
      { name: 'E_DEPENDENTE', start: 620, end: 620, size: 1, format: 'I' }, // S/N
      { name: 'NR_CPF_DEPEN', start: 621, end: 631, size: 11, format: 'C' },
      { name: 'NR_CONTROLE', start: 632, end: 641, size: 10, format: 'N' },
    ],
  },
  '42': {
    // Renda Variável - FII Mensal
    prefix: '42',
    totalLength: 170,
    fields: [
      { name: 'NR_REG', start: 1, end: 2, size: 2, format: 'N' },
      { name: 'NR_CPF', start: 3, end: 13, size: 11, format: 'C' },
      { name: 'NR_MES', start: 14, end: 15, size: 2, format: 'N' }, // Month 01-12
      { name: 'VR_RESLIQUIDO_MES', start: 16, end: 28, size: 13, decimals: 2, format: 'NN' },
      { name: 'VRRESULT_NEG_MESANT', start: 29, end: 41, size: 13, decimals: 2, format: 'N' },
      { name: 'VR_BASECALCULO_MES', start: 42, end: 54, size: 13, decimals: 2, format: 'N' },
      {
        name: 'VR_PREJACOMPENSAR_MES_OPCOMUNS',
        start: 55,
        end: 67,
        size: 13,
        decimals: 2,
        format: 'N',
      }, // Name seems generic, but context is FII
      { name: 'VR_ALIQUOTA_IMPOSTO_OPCOMUNS', start: 68, end: 70, size: 3, format: 'N' }, // Name seems generic, value is 200 (20%)
      {
        name: 'VR_IMPOSTODEVIDO_MES_OPCOMUNS',
        start: 71,
        end: 83,
        size: 13,
        decimals: 2,
        format: 'N',
      }, // Name seems generic
      {
        name: 'VR_IMPOSTO_RETIDO_MESES_ANTERIORES',
        start: 84,
        end: 96,
        size: 13,
        decimals: 2,
        format: 'N',
      },
      { name: 'VR_IMPOSTO_RETIDO_FONTE', start: 97, end: 109, size: 13, decimals: 2, format: 'N' },
      {
        name: 'VR_IMPOSTO_RETIDO_COMPENSAR',
        start: 110,
        end: 122,
        size: 13,
        decimals: 2,
        format: 'N',
      },
      { name: 'VR_IMPOSTO_PAGAR', start: 123, end: 135, size: 13, decimals: 2, format: 'N' },
      { name: 'VR_IMPOSTOPAGO', start: 136, end: 148, size: 13, decimals: 2, format: 'N' },
      { name: 'E_DEPENDENTE', start: 149, end: 149, size: 1, format: 'I' }, // S/N
      { name: 'NR_CPF_DEPEN', start: 150, end: 160, size: 11, format: 'C' },
      { name: 'NR_CONTROLE', start: 161, end: 170, size: 10, format: 'N' },
    ],
  },
  '84': {
    // Rendimento Isento - Tipo 3 (Dividendos - Cod 09)
    prefix: '84',
    totalLength: 144,
    fields: [
      { name: 'NR_REG', start: 1, end: 2, size: 2, format: 'N' },
      { name: 'NR_CPF', start: 3, end: 13, size: 11, format: 'C' },
      { name: 'IN_TIPO', start: 14, end: 14, size: 1, format: 'C' }, // T or D
      { name: 'NR_CPF_BENEFIC', start: 15, end: 25, size: 11, format: 'C' },
      { name: 'NR_COD', start: 26, end: 29, size: 4, format: 'N' }, // Should be 0009 for dividends
      { name: 'NR_PAGADORA', start: 30, end: 43, size: 14, format: 'C' }, // CNPJ
      { name: 'NM_NOME', start: 44, end: 103, size: 60, format: 'C' }, // Nome Fonte Pagadora
      { name: 'VR_VALOR', start: 104, end: 116, size: 13, decimals: 2, format: 'N' },
      { name: 'VR_VALOR_13', start: 117, end: 129, size: 13, decimals: 2, format: 'N' }, // Not applicable for dividends
      { name: 'NR_CHAVE_BEM', start: 130, end: 134, size: 5, format: 'N' }, // Link to R27?
      { name: 'NR_CONTROLE', start: 135, end: 144, size: 10, format: 'N' },
    ],
  },
  '86': {
    // Rendimento Isento - Tipo 5 (Outros - Cod 26 - Used for FII Rendimentos)
    prefix: '86',
    totalLength: 191,
    fields: [
      { name: 'NR_REG', start: 1, end: 2, size: 2, format: 'N' },
      { name: 'NR_CPF', start: 3, end: 13, size: 11, format: 'C' },
      { name: 'IN_TIPO', start: 14, end: 14, size: 1, format: 'C' }, // T or D
      { name: 'NR_CPF_BENEFIC', start: 15, end: 25, size: 11, format: 'C' },
      { name: 'NR_COD', start: 26, end: 29, size: 4, format: 'N' }, // Should be 0026
      { name: 'NR_PAGADORA', start: 30, end: 43, size: 14, format: 'C' }, // CNPJ
      { name: 'NM_NOME', start: 44, end: 103, size: 60, format: 'C' }, // Nome Fonte Pagadora
      { name: 'VR_VALOR', start: 104, end: 116, size: 13, decimals: 2, format: 'N' },
      { name: 'NM_DESCRICAO', start: 117, end: 176, size: 60, format: 'C' }, // Description (e.g., "Rendimentos FII XPTO")
      { name: 'NR_CHAVE_BEM', start: 177, end: 181, size: 5, format: 'N' }, // Link to R27?
      { name: 'NR_CONTROLE', start: 182, end: 191, size: 10, format: 'N' },
    ],
  },
  '88': {
    // Rendimento Exclusivo - Tipo 2 (JSCP - Cod 10)
    prefix: '88',
    totalLength: 131,
    fields: [
      { name: 'NR_REG', start: 1, end: 2, size: 2, format: 'N' },
      { name: 'NR_CPF', start: 3, end: 13, size: 11, format: 'C' },
      { name: 'IN_TIPO', start: 14, end: 14, size: 1, format: 'C' }, // T or D
      { name: 'NR_CPF_BENEFIC', start: 15, end: 25, size: 11, format: 'C' },
      { name: 'NR_COD', start: 26, end: 29, size: 4, format: 'N' }, // Should be 0010 for JSCP
      { name: 'NR_PAGADORA', start: 30, end: 43, size: 14, format: 'C' }, // CNPJ
      { name: 'NM_NOME', start: 44, end: 103, size: 60, format: 'C' }, // Nome Fonte Pagadora
      { name: 'VR_VALOR', start: 104, end: 116, size: 13, decimals: 2, format: 'N' },
      { name: 'NR_CHAVE_BEM', start: 117, end: 121, size: 5, format: 'N' }, // Link to R27?
      { name: 'NR_CONTROLE', start: 122, end: 131, size: 10, format: 'N' },
    ],
  },
  // T9 definition might need updates if new record types are added frequently
  T9: {
    prefix: 'T9',
    totalLength: 449, // Adjust based on actual layout if different
    fields: [
      { name: 'NR_REG', start: 1, end: 2, size: 2, format: 'C' },
      { name: 'NR_CPF', start: 3, end: 13, size: 11, format: 'N' }, // Format N in doc, but CPF is usually C
      { name: 'QT_TOTAL', start: 14, end: 19, size: 6, format: 'N' },
      { name: 'QT_R16', start: 20, end: 24, size: 5, format: 'N' },
      { name: 'QT_R17', start: 25, end: 29, size: 5, format: 'N' },
      { name: 'QT_R18', start: 30, end: 34, size: 5, format: 'N' },
      { name: 'QT_R19', start: 35, end: 39, size: 5, format: 'N' },
      { name: 'QT_R20', start: 40, end: 44, size: 5, format: 'N' },
      { name: 'QT_R21', start: 45, end: 49, size: 5, format: 'N' },
      { name: 'QT_R22', start: 50, end: 54, size: 5, format: 'N' },
      { name: 'QT_R23', start: 55, end: 59, size: 5, format: 'N' },
      { name: 'QT_R24', start: 60, end: 64, size: 5, format: 'N' },
      { name: 'QT_R25', start: 65, end: 69, size: 5, format: 'N' },
      { name: 'QT_R26', start: 70, end: 74, size: 5, format: 'N' },
      { name: 'QT_R27', start: 75, end: 79, size: 5, format: 'N' },
      { name: 'QT_R28', start: 80, end: 84, size: 5, format: 'N' },
      // ... Add all QT_Rxx fields from layout doc...
      { name: 'QT_R83', start: 355, end: 359, size: 5, format: 'N' },
      { name: 'QT_R84', start: 360, end: 364, size: 5, format: 'N' },
      { name: 'QT_R85', start: 365, end: 369, size: 5, format: 'N' },
      { name: 'QT_R86', start: 370, end: 374, size: 5, format: 'N' },
      { name: 'QT_R87', start: 375, end: 379, size: 5, format: 'N' },
      { name: 'QT_R88', start: 380, end: 384, size: 5, format: 'N' },
      { name: 'QT_R89', start: 385, end: 389, size: 5, format: 'N' },
      { name: 'QT_R90', start: 390, end: 394, size: 5, format: 'N' },
      { name: 'QT_R91', start: 395, end: 399, size: 5, format: 'N' },
      { name: 'QT_R92', start: 400, end: 404, size: 5, format: 'N' },
      // ... Fillers ...
      { name: 'NR_CONTROLE', start: 440, end: 449, size: 10, format: 'N' },
    ],
  },
};

// --- Generic record-line builder ---
// Builds one fixed-width line for a record type from the `layout` definition above.
// Any field not present in `data` is filled with a neutral default for its format
// (spaces for text, zeros for numbers, 'N' for booleans, blank for dates).
// Used to create brand-new records (e.g. a fresh IR/16/T9 skeleton when no base
// .DBK was imported) and by RandomDBKFileGenerator to produce random test fixtures.

function getDefaultFieldValue(field: FieldDefinition): string | number | boolean {
  switch (field.format) {
    case 'N':
    case 'NN':
      return 0;
    case 'I':
      return false;
    case 'A':
    case 'C':
    case 'D':
    default:
      return '';
  }
}

function formatFieldValue(
  value: string | number | boolean | Date | undefined,
  field: FieldDefinition
): string {
  if (value instanceof Date) {
    if (field.format === 'D') {
      return formatDateFns(value, 'ddMMyyyy');
    }
    value = formatDateFns(value, 'ddMMyyyy');
  }

  switch (field.format) {
    case 'N': {
      const num = typeof value === 'number' ? value : parseFloat(String(value)) || 0;
      const digits = field.decimals ? num.toFixed(field.decimals).replace('.', '') : String(num);
      return digits.padStart(field.size, '0').slice(-field.size);
    }
    case 'NN': {
      const num = typeof value === 'number' ? value : parseFloat(String(value)) || 0;
      const isNegative = num < 0;
      const digits = Math.abs(num)
        .toFixed(field.decimals ?? 0)
        .replace('.', '');
      const paddedAbs = digits.padStart(field.size - 1, '0').slice(-(field.size - 1));
      return (isNegative ? '-' : '+') + paddedAbs;
    }
    case 'A':
      return String(value ?? '').toUpperCase().padEnd(field.size, ' ').slice(0, field.size);
    case 'C':
      return String(value ?? '').padEnd(field.size, ' ').slice(0, field.size);
    case 'I':
      return value ? 'S' : 'N';
    case 'D':
      return String(value ?? '').padEnd(field.size, ' ').slice(0, field.size);
    default:
      return String(value ?? '').padEnd(field.size, ' ').slice(0, field.size);
  }
}

export function buildRecordLine(recordPrefix: string, data: Record<string, any> = {}): string {
  const definition = layout[recordPrefix];
  if (!definition) {
    throw new Error(`Layout definition not found for record prefix: ${recordPrefix}`);
  }

  // Every record is identified by its first bytes (SISTEMA for IR, NR_REG for the
  // others, e.g. '16000...'.startsWith('16')). Default that identifying field to the
  // record prefix so a freshly-built line is always findable by findLinesByRecordType,
  // even when the caller supplies no data at all.
  const identifierDefaults: Record<string, any> =
    recordPrefix === 'IR' ? { SISTEMA: 'IRPF' } : { NR_REG: recordPrefix };

  let line = '';
  let currentPos = 1;

  definition.fields.forEach(field => {
    if (field.start > currentPos) {
      line += ' '.repeat(field.start - currentPos);
    }

    const value = data[field.name] ?? identifierDefaults[field.name] ?? getDefaultFieldValue(field);
    line += formatFieldValue(value, field);
    currentPos = field.end + 1;
  });

  if (line.length < definition.totalLength) {
    line = line.padEnd(definition.totalLength, ' ');
  } else if (line.length > definition.totalLength) {
    line = line.substring(0, definition.totalLength);
  }

  return line;
}
