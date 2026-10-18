# Domínios do Sistema

## Introdução

Este documento mapeia os grandes domínios (capacidades de negócio) do gerador de IR de Renda Variável, cruzando-os com a arquitetura hexagonal já descrita em [01-visao-geral.md](./01-visao-geral.md). Enquanto aquele documento organiza o código por **camada** (domínio/portas/adaptadores), este organiza por **domínio de negócio** — cada um atravessando várias camadas.

Levantamento feito a partir de uma extração automática de entidades/relações do código (domain mapping) cruzada com leitura manual dos arquivos relevantes. Card relacionado: `ARCH-001` (kanban do workspace).

## Mapa de domínios

### 1. Importação/Parsing de Arquivos

Converte arquivos externos (extratos `.xlsx` da B3, `.DBK` de uma declaração anterior) em objetos de domínio.

- Porta: `FileParserPort` (`src/core/interfaces/FileParserPort.ts`)
- Adaptadores: `B3FileParser.ts` (negociação + movimentação), `DBKFileParser.ts` (extração de dados de um `.DBK` importado, via `ReaderDBKFileEditor`)
- Caso de uso: `ImportFilesUseCase.ts`
- UI: `UploadPage.tsx`

### 2. Processamento de Ativos (núcleo de cálculo)

Calcula posições, custo médio (FIFO), aplica eventos especiais (bonificação, desdobramento, grupamento, fração) e apura resultados mensais e rendimentos.

- Porta: `AssetProcessorPort` (`src/core/interfaces/AssetProcessorPort.ts`)
- Adaptador: `AssetProcessor.ts`
- Porta auxiliar: `ExternalEventInfoProviderPort` (datas/fatores de eventos não informados pela B3) — adaptador padrão `StaticEventInfoAdapter.ts`
- Modelos de domínio: `Transaction`, `SpecialEvent`, `AssetPosition`, `MonthlyResult`, `IncomeRecord`, `TradeResult`, `Inconsistency` (`src/core/domain/`)
- Caso de uso: `ProcessAssetsUseCase.ts`
- UI: `ProcessPage.tsx`

### 3. Geração/Leitura do arquivo `.DBK` (layout Receita Federal)

Serializa a declaração apurada no formato posicional de largura fixa exigido pelo programa da Receita Federal, e lê um `.DBK` existente para reaproveitar dados.

- Porta: `IRPFGeneratorPort` (`src/core/interfaces/IRPFGeneratorPort.ts`)
- Adaptador: `DBKFileGenerator.ts` — ver observação de acoplamento abaixo
- `src/infrastructure/adapters/LayoutDBK2025/`:
  - `layout.ts` — schema único do layout (`FieldDefinition`, `RecordDefinition`, `layout`, `buildRecordLine`), compartilhado pelos 3 arquivos abaixo (unificado no card CODE-DEBT-001)
  - `DBKFileEditor.ts` — editor de baixo nível, agnóstico de schema
  - `ReaderDBKFileEditor.ts` — leitura de um `.DBK`
  - `WritterDBKFileEditor.ts` — escrita/geração de um `.DBK`
  - `RandomDBKFileGenerator.ts` — gerador de dados aleatórios para testes
- Modelos de domínio: `IRPFDeclaration`, `DeclarationSection`, `DeclarationItem`, `TaxPayerInfo`, `Address` (`src/core/domain/IRPFDeclaration.ts`)
- Caso de uso: `GenerateDeclarationUseCase.ts`
- UI: `DeclarationPage.tsx` (dados do contribuinte), `ResultPage.tsx` (download do `.DBK` gerado)

**Observação de acoplamento**: `DBKFileGenerator.ts` mistura duas responsabilidades de domínios adjacentes: (a) construir a estrutura `DeclarationSection`/`DeclarationItem` a partir de `AssetPosition`/`MonthlyResult`/`IncomeRecord` — que é lógica de apuração, pertencente ao domínio de Processamento de Ativos — e (b) orquestrar a serialização byte-a-byte via `WritterDBKFileEditor` — que é o domínio de geração do `.DBK` propriamente. Hoje isso está tudo dentro da mesma classe (`generateDeclaration()` vs `generateFile()`). Separar os dois em componentes distintos deixaria a fronteira entre os dois domínios explícita no código, não só na documentação.

### 4. Enriquecimento externo de dados de ativos

Busca informações (CNPJ, razão social) de um ticker/ativo, usadas para preencher o `.DBK` e exibir na tela de resultados.

- Porta: `ExternalTickerInfoProviderPort` (`src/core/interfaces/ExternalTickerInfoProviderPort.ts`)
- Adaptador conectado: `StaticTickerInfoAdapter.ts` (dados locais em `src/infrastructure/data/staticTickerInfoData.ts`)
- Adaptadores **não conectados** no `Container`: `BrapiAdapter.ts`, `BrasilApiAdapter.ts`, `CNPJInfoAdapter.ts`, `Investidor10ScraperAdapter.ts` — rastreado em `CODE-DEBT-002` (decidir se conectam, removem, ou ficam como alternativas documentadas)

### 5. Persistência/Sessão

Guarda localmente (IndexedDB) as transações, eventos, dados processados, a declaração gerada e o conteúdo original de um `.DBK` importado, por sessão.

- Porta: `StoragePort` (`src/core/interfaces/StoragePort.ts`)
- Adaptador: `IndexedDBStorage.ts`
- Caso de uso: `SessionManagementUseCase.ts`
- UI: `HomePage.tsx` (lista/gerencia sessões)

### 6. Relatórios (Excel)

Gera um relatório `.xlsx` auxiliar (fora do fluxo de geração do `.DBK`).

- Adaptador: `ExcelReportGenerator.ts`

**Observação de acoplamento**: este domínio não tem porta própria em `core/interfaces/` — `ExcelReportGenerator` é instanciado e exposto direto pelo `Container` (`getExcelFileGenerator()`), e `ResultPage.tsx` o acessa importando `Container` diretamente, em vez de passar pelo `AppContext` como as demais páginas fazem. É o único ponto da UI que fura essa camada de orquestração (`ResultPage.tsx` também acessa `getDBKFileGenerator()` do `Container` diretamente, pelo mesmo motivo).

### 7. Apresentação/Orquestração de UI

Estado global da aplicação, navegação entre as etapas do fluxo (upload → processamento → dados do contribuinte → resultado) e composição visual.

- `AppContext.tsx` — estado global; orquestra os casos de uso acima via `Container`
- `NavFooterContext.tsx` — estado do rodapé de navegação entre etapas
- `MainLayout.tsx` — layout (header/footer)
- Páginas: `HomePage.tsx`, `UploadPage.tsx`, `ProcessPage.tsx`, `DeclarationPage.tsx`, `ResultPage.tsx`

## Resumo das observações de acoplamento

| Observação | Onde | Severidade |
|---|---|---|
| Lógica de apuração (domínio 2) misturada com serialização do `.DBK` (domínio 3) na mesma classe | `DBKFileGenerator.ts` | Débito técnico, não bug |
| UI acessando `Container` diretamente em vez de via `AppContext` | `ResultPage.tsx` | Menor, inconsistência de padrão |
| Domínio de Relatórios sem porta própria | `ExcelReportGenerator.ts` | Menor |
| 4 de 5 adaptadores do domínio 4 não conectados | `ExternalTickerInfoProviderPort/*Adapter.ts` | Já rastreado em CODE-DEBT-002 |

Nenhuma dessas observações indica um bug funcional — são pontos de possível reorganização para manter os limites de domínio mais explícitos no código, caso o projeto cresça.
