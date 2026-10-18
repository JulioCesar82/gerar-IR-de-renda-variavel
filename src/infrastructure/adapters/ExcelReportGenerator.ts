import * as XLSX from 'xlsx';

import { IRPFDeclaration } from '../../core/domain/IRPFDeclaration';
import { ReportGeneratorPort } from '../../core/interfaces/ReportGeneratorPort';

export class ExcelReportGenerator implements ReportGeneratorPort {
  /**
   * Gera um arquivo Excel a partir dos dados da declaração do IRPF.
   *
   * @param declaration Os dados da declaração do IRPF.
   * @returns O arquivo Excel no formato de um Blob.
   */
  public generate(declaration: IRPFDeclaration): Blob {
    // 1. Criar um novo workbook (arquivo Excel)
    const workbook = XLSX.utils.book_new();

    // 2. Criar uma nova worksheet (planilha)
    const worksheet = XLSX.utils.aoa_to_sheet([
      [
        'Ativo',
        'Tipo',
        'Data',
        'Quantidade',
        'Preço Unitário',
        'Custo/Taxa',
        'Resultado',
        'CNPJ',
        'Discriminação',
        'Situação 31/12/(ano-1)',
        'Situação 31/12/(ano)',
      ], // Cabeçalhos
    ]);

    // 3. Preencher a planilha com os dados
    const row = 2; // Começar na linha 2 após os cabeçalhos
    const allData: (string | number | null)[][] = [];

    // 3. Processar "Bens e Direitos"
    const bensSection = declaration.sections.find(section => section.code === 'BENS');
    if (bensSection) {
      bensSection.items.forEach(item => {
        allData.push([
          item.code, // Ativo (Código do Bem)
          'Bem/Direito', // Tipo
          '', // Data
          '', // Quantidade
          '', // Preço Unitário
          '', // Custo/Taxa
          '', // Resultado
          item.cnpj ?? '', // CNPJ
          item.details ?? item.description ?? '', // Discriminação
          item.previousYearValue ?? null, // Situação 31/12/(ano-1)
          item.value ?? null // Situação 31/12/(ano)
        ]);
      });
    }

    // 4. Processar "Rendimentos Isentos e Não Tributáveis"
    const rendIsentosSection = declaration.sections.find(
      section => section.code === 'REND_ISENTOS'
    );
    if (rendIsentosSection) {
      rendIsentosSection.items.forEach(item => {
        allData.push([
          item.code, // Ativo (Código do Rendimento)
          'Rendimento Isento', // Tipo
          '', // Data
          '', // Quantidade
          '', // Preço Unitário
          '', // Custo/Taxa
          item.value ?? null, // Resultado (Valor do Rendimento)
          item.cnpj ?? '', // CNPJ
          item.sourceName ?? '', // Discriminação (Nome da Fonte Pagadora)
          '', // Situação 31/12/(ano-1)
          '' // Situação 31/12/(ano)
        ]);
      });
    }

    // 5. Processar "Rendimentos Sujeitos à Tributação Exclusiva/Definitiva"
    const rendExclusivaSection = declaration.sections.find(
      section => section.code === 'REND_EXCLUSIVA'
    );
    if (rendExclusivaSection) {
      rendExclusivaSection.items.forEach(item => {
        allData.push([
          item.code, // Ativo (Código do Rendimento)
          'Rendimento Exclusivo', // Tipo
          '', // Data
          '', // Quantidade
          '', // Preço Unitário
          '', // Custo/Taxa
          item.value ?? null, // Resultado (Valor do Rendimento)
          item.cnpj ?? '', // CNPJ
          item.sourceName ?? '', // Discriminação (Nome da Fonte Pagadora)
          '', // Situação 31/12/(ano-1)
          '' // Situação 31/12/(ano)
        ]);
      });
    }

    // 6. Processar "Renda Variável"
    const rendaVariavelSection = declaration.sections.find(
      section => section.code === 'OP_RENDA_VARIAVEL'
    );
    if (rendaVariavelSection) {
      rendaVariavelSection.items.forEach(item => {
        allData.push([
          '', // Ativo
          'Resultado Mensal RV', // Tipo
          item.month ?? '', // Data (Mês)
          '', // Quantidade
          '', // Preço Unitário
          '', // Custo/Taxa
          item.value ?? null, // Resultado (Lucro/Prejuízo)
          '', // CNPJ
          '', // Discriminação
          '', // Situação 31/12/(ano-1)
          '' // Situação 31/12/(ano)
        ]);
      });
    }

    // Adicionar todos os dados de uma vez
    XLSX.utils.sheet_add_aoa(worksheet, allData, { origin: `A${row}` });

    // Ajustar largura das colunas (opcional, mas melhora a visualização)
    const colsWidth = [
      { wch: 15 }, // Ativo
      { wch: 20 }, // Tipo
      { wch: 12 }, // Data
      { wch: 12 }, // Quantidade
      { wch: 15 }, // Preço Unitário
      { wch: 12 }, // Custo/Taxa
      { wch: 15 }, // Resultado
      { wch: 18 }, // CNPJ
      { wch: 50 }, // Discriminação
      { wch: 20 }, // Situação 31/12/(ano-1)
      { wch: 20 } // Situação 31/12/(ano)
    ];
    worksheet['!cols'] = colsWidth;

    // 7. Adicionar a planilha ao workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Dados IRPF');

    // 8. Gerar o arquivo Excel como um Blob (para download no navegador)
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const excelBlob = new Blob([excelBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });

    return excelBlob;
  }
}
