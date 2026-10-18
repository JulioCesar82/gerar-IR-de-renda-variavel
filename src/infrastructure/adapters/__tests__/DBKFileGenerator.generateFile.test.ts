import { DBKFileGenerator } from '../DBKFileGenerator';
import { ReaderDBKFileEditor } from '../LayoutDBK2025/ReaderDBKFileEditor';
import { ExternalTickerInfoProviderPort } from '../../../core/interfaces/ExternalTickerInfoProviderPort';
import { IRPFDeclaration, TaxPayerInfo, DeclarationSection } from '../../../core/domain/IRPFDeclaration';

const mockTickerInfoProvider: ExternalTickerInfoProviderPort = {
  getStockInfo: jest.fn().mockResolvedValue(null),
};

function buildTaxPayerInfo(overrides: Partial<TaxPayerInfo> = {}): TaxPayerInfo {
  return {
    name: 'JOSE DA SILVA',
    cpf: '123.456.789-00',
    dateOfBirth: new Date(1980, 0, 1),
    occupation: '111',
    email: 'jose@example.com',
    phone: '11987654321',
    address: {
      street: 'Rua das Flores',
      number: '100',
      complement: '',
      neighborhood: 'Centro',
      city: 'Sao Paulo',
      state: 'SP',
      zipCode: '01000-000',
      country: 'Brasil',
    },
    ...overrides,
  };
}

function emptySections(): DeclarationSection[] {
  return [
    { code: 'BENS', name: '', description: '', items: [] },
    { code: 'REND_ISENTOS', name: '', description: '', items: [] },
    { code: 'REND_EXCLUSIVA', name: '', description: '', items: [] },
    { code: 'OP_RENDA_VARIAVEL', name: '', description: '', items: [] },
  ];
}

function buildDeclaration(overrides: Partial<IRPFDeclaration> = {}): IRPFDeclaration {
  return {
    taxPayerInfo: buildTaxPayerInfo(),
    year: 2025,
    assetPositions: [],
    monthlyResults: [],
    incomeRecords: [],
    totalTaxDue: 0,
    totalTaxWithheld: 0,
    totalTaxToPay: 0,
    remainingLoss: 0,
    totalAssetsValue: 0,
    totalIncome: 0,
    generationDate: new Date(),
    sections: emptySections(),
    ...overrides,
  };
}

function blobToText(blob: Blob): Promise<string> {
  // This project's jsdom/Node test environment doesn't implement Blob.text()/arrayBuffer(),
  // but FileReader is available.
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsText(blob);
  });
}

describe('DBKFileGenerator.generateFile', () => {
  const generator = new DBKFileGenerator(mockTickerInfoProvider);

  // BUG-001: taxpayer data (name/CPF/address) was never written when generating
  // without importing a previous .DBK, because the editor started out empty and
  // WritterDBKFileEditor had no way to create the IR/16 records from scratch.
  it('BUG-001: creates the IR/16 records from scratch with the taxpayer data when no .DBK was imported', async () => {
    const declaration = buildDeclaration();

    const blob = await generator.generateFile(declaration);
    const content = await blobToText(blob);

    const reader = new ReaderDBKFileEditor(content);
    const declarante = reader.getDadosDeclarante();

    expect(declarante).not.toBeNull();
    expect(declarante.nrCpf).toBe('12345678900');
    expect(declarante.nmNome).toBe('JOSE DA SILVA');
    expect(declarante.nmLogra).toBe('Rua das Flores');
    expect(declarante.nrNumero).toBe('100');
    expect(declarante.nmBairro).toBe('Centro');
    expect(declarante.nmMunicip).toBe('Sao Paulo');
    expect(declarante.sgUf).toBe('SP');
    expect(declarante.nmEmail).toBe('jose@example.com');

    const header = reader.getHeaderInfo();
    expect(header).not.toBeNull();
    expect(header.exercicio).toBe(2025);
    expect(header.anoBase).toBe(2024);
  });

  // BUG-001 (second part): importing a previous .DBK and editing the taxpayer data on
  // screen used to be silently ignored (setField always failed), leaving the OLD data
  // from the imported file in the generated output.
  it('BUG-001: overwrites the taxpayer data from an imported .DBK with the edited values', async () => {
    const original = buildDeclaration({
      taxPayerInfo: buildTaxPayerInfo({ name: 'OLD NAME', cpf: '000.000.000-00' }),
    });
    const originalBlob = await generator.generateFile(original);
    const originalContent = await blobToText(originalBlob);

    const edited = buildDeclaration({
      taxPayerInfo: buildTaxPayerInfo({ name: 'NEW NAME', cpf: '111.111.111-11' }),
    });
    const editedBlob = await generator.generateFile(edited, originalContent);
    const editedContent = await blobToText(editedBlob);

    const declarante = new ReaderDBKFileEditor(editedContent).getDadosDeclarante();
    expect(declarante.nmNome).toBe('NEW NAME');
    expect(declarante.nrCpf).toBe('11111111111');
  });

  // BUG-002: the monthly net result (resultado líquido) was never copied into the R40/R42
  // write objects, so Day-Trade, Common (non day-trade) and FII monthly results were all
  // missing from the generated .DBK.
  it('BUG-002: writes the monthly net result into R40 (day-trade and common) and R42 (FII)', async () => {
    const declaration = buildDeclaration({
      sections: [
        { code: 'BENS', name: '', description: '', items: [] },
        { code: 'REND_ISENTOS', name: '', description: '', items: [] },
        { code: 'REND_EXCLUSIVA', name: '', description: '', items: [] },
        {
          code: 'OP_RENDA_VARIAVEL',
          name: '',
          description: '',
          items: [
            { code: 'RV_DT_ACOES.3', description: '', value: 1500.5, month: 3, type: 'DAY_TRADE_ACOES' },
            { code: 'RV_COMUM_ACOES.3', description: '', value: -200.25, month: 3, type: 'COMMON_ACOES' },
            { code: 'RV_FII.5', description: '', value: 777.77, month: 5, type: 'FII' },
          ],
        },
      ],
    });

    const blob = await generator.generateFile(declaration);
    const content = await blobToText(blob);
    const reader = new ReaderDBKFileEditor(content);

    // NOTE: ReaderDBKFileEditor derives each parsed key mechanically from the layout's
    // field name (e.g. RV_MES -> rvMes, NR_MES -> nrMes) - the hand-written `mes` field
    // in the OperacaoComumDayTradeMes/OperacaoFIIMes interfaces doesn't match it.
    const marchCommonDayTrade = reader
      .getOperacoesComunsMes()
      .find((op: any) => op.rvMes === '03');
    expect(marchCommonDayTrade?.vrResliquidoMesDaytrade).toBeCloseTo(1500.5, 2);
    expect(marchCommonDayTrade?.vrResliquidoMesOpcomuns).toBeCloseTo(-200.25, 2);

    const mayFii = reader.getOperacoesFIIMes().find((op: any) => op.nrMes === 5);
    expect(mayFii?.vrResliquidoMes).toBeCloseTo(777.77, 2);
  });
});
