# Transformações de Dados

## Introdução

Este documento descreve, em alto nível, as transformações aplicadas aos dados desde os arquivos brutos da B3 até o arquivo `.DBK` final. Os nomes de campo usados aqui são os reais do código (ver [02-modelos-dominio.md](../architecture/02-modelos-dominio.md)); a lógica de cálculo detalhada vive em `AssetProcessor.ts` e `DBKFileGenerator.ts` — este documento não reproduz esse código linha a linha para evitar divergir dele no futuro.

## Visão Geral das Transformações

1. **Extração e Normalização** — `B3FileParser` lê os `.xlsx` e produz `Transaction[]`/`SpecialEvent[]`.
2. **Processamento** — `AssetProcessor` (via `AssetProcessorPort.analyzeTransactionsAndSpecialEvents`) calcula posições, resultados e rendimentos.
3. **Geração da declaração** — `DBKFileGenerator.generateDeclaration` monta o `IRPFDeclaration` (com as `DeclarationSection`/`DeclarationItem` já no formato esperado pela Receita Federal).
4. **Geração do arquivo** — `DBKFileGenerator.generateFile` (via `WritterDBKFileEditor`) serializa o `IRPFDeclaration` para o layout `.DBK`.

## Extração e Normalização (`B3FileParser`)

| Dado Original (planilha) | Campo resultante | Observação |
|---|---|---|
| Data do Negócio | `Transaction.date` | convertida para `Date` |
| Tipo de Operação (C/V) | `Transaction.type` | `'buy'` \| `'sell'` (não é mais um enum `OperationType`) |
| Código de Negociação | `Transaction.assetCode` | normalizado (maiúsculas, sem espaços) |
| Especificação do Ativo | `Transaction.assetCategory` | `AssetCategory.STOCK`/`FII`/`ETF`/`BDR`/`OPTION`/`DEBENTURE`/`TREASURY`/`OTHER` — nota: FIIs usam `FII`, não `REAL_ESTATE_FUND` |
| Quantidade / Preço / Valor | `quantity` / `unitPrice` / `totalValue` | convertidos para número; `price` não existe mais como nome de campo |
| Mercado (Vista, Fracionário, ...) | `Transaction.marketType` | `MarketType.SPOT`/`FRACTIONAL`/`OPTIONS`/`TERM`/`FUTURES`/`OTHER` |

O arquivo de movimentação segue o mesmo princípio, produzindo `SpecialEvent[]` com `type: SpecialEventType` (ex.: `SpecialEventType.DIVIDEND`, `.JCP`, `.STOCK_SPLIT`, `.REVERSE_SPLIT`, `.STOCK_DIVIDEND`) a partir do texto original da B3 (preservado em `originalType`).

A classificação de categoria do ativo (ação, FII, ETF, BDR) é feita por padrões no código do ticker e/ou na especificação do ativo — a lógica exata está em `B3FileParser.ts`, não reproduzida aqui para não divergir.

## Processamento (`AssetProcessor`)

As transações e eventos são ordenados cronologicamente e aplicados sequencialmente sobre cada `AssetPosition`:

- **Compra**: recalcula `averagePrice` e `totalCost`, e registra uma entrada em `transactionsHistory`.
- **Venda**: mantém `averagePrice`, reduz `quantity`, e gera um `TradeResult` (com `profitOrLoss` e `isExempt` — vendas de ações até R$ 20.000/mês são isentas).
- **Eventos especiais**: desdobramento/grupamento ajustam `quantity`/`averagePrice` pelo `factor` do evento; bonificação aumenta `quantity` sem alterar `totalCost` (diluindo `averagePrice`); dividendos/JCP/rendimentos não alteram a posição, mas geram um `IncomeRecord`.

Os `TradeResult` são agregados em `MonthlyResult` por mês/ano, separando por categoria de ativo (`assetCategory`) e aplicando a regra de isenção de R$ 20.000/mês para ações e tributação integral para FIIs. A compensação de prejuízos de meses anteriores é refletida em `compensatedLoss`/`remainingLoss`.

Para o detalhe exato de cada cálculo (inclusive casos de borda como vendas a descoberto, conversões e amortizações), consulte `src/infrastructure/adapters/AssetProcessor.ts` e os testes gerados por ativo (ver [06-estrategia-testes.md](../architecture/06-estrategia-testes.md)) — eles são a referência mais confiável porque são executados contra dados reais a cada `npm test`.

## Geração da Declaração e do Arquivo `.DBK`

`DBKFileGenerator.generateDeclaration` consolida `AssetPosition[]`, `MonthlyResult[]` e `IncomeRecord[]` em um `IRPFDeclaration`, organizando os itens em `DeclarationSection`/`DeclarationItem` com os códigos oficiais da Receita Federal (ex.: código 31 para ações em Bens e Direitos, 09 para dividendos em Rendimentos Isentos, 10 para JCP em Rendimentos de Tributação Exclusiva — ver [documentation/INPUTS-TO-IA.txt](../INPUTS-TO-IA.txt) para a lista de códigos usada como referência inicial). `DBKFileGenerator.generateFile` então serializa essas seções no layout de texto posicional do `.DBK` (via `WritterDBKFileEditor`, pasta `LayoutDBK2025/`), opcionalmente partindo de um `originalContent` (quando o usuário importou uma declaração anterior).

## Qualidade e Validação

A validação de inconsistências (`AssetProcessorPort.validateData`) produz uma lista de `Inconsistency` (tipo `'error'`/`'warning'`, com mensagem e detalhes) exibida ao usuário na tela de processamento — não interrompe o fluxo, mas sinaliza casos como vendas a descoberto ou dados incompletos. Não há, hoje, logging estruturado de transformações, metadados de proveniência ou versionamento de dados processados além do que já é salvo por sessão no IndexedDB.
