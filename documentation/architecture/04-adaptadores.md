# Adaptadores

## Introdução

Os adaptadores são implementações concretas das portas definidas em `src/core/interfaces/`. Ficam principalmente em `src/infrastructure/adapters/`. Este documento lista os adaptadores reais do código e como se conectam (ver `src/infrastructure/di/Container.ts` para a montagem).

## B3FileParser

`src/infrastructure/adapters/B3FileParser.ts` — implementa `FileParserPort`. Lê os arquivos `.xlsx` de negociação e movimentação (via SheetJS/`xlsx`), identifica cabeçalhos, normaliza datas/valores/códigos de ativo e mapeia para `Transaction[]` / `SpecialEvent[]`. Também contém a lógica que filtra eventos irrelevantes para o cálculo (ex.: "Transferência - Liquidação", "Reembolso - Empréstimo de ativos").

## DBKFileParser e DBKFileGenerator

`src/infrastructure/adapters/DBKFileParser.ts` e `DBKFileGenerator.ts` implementam, respectivamente, a extração de dados de um `.DBK` existente (usada para importar uma declaração pré-preenchida) e a geração do `.DBK` final (`IRPFGeneratorPort`). Ambos delegam a manipulação de baixo nível do layout da Receita Federal para as classes em `src/infrastructure/adapters/LayoutDBK2025/`:

- `DBKFileEditor.ts` — estrutura/schema do layout `.DBK` vigente (declaração 2025, ano-calendário 2024).
- `ReaderDBKFileEditor.ts` — leitura/parsing de um `.DBK`.
- `WritterDBKFileEditor.ts` — escrita/geração de um `.DBK`.
- `todo-mudar/RandomDBKFileGenerator.ts` — gerador de dados aleatórios para testes; há uma duplicação de estrutura conhecida com `DBKFileEditor.ts`, rastreada em [CODE-DEBT-001](#) (card do kanban do workspace).

## IndexedDBStorage

`src/infrastructure/adapters/IndexedDBStorage.ts` — implementa `StoragePort` usando IndexedDB para persistir sessões, transações, eventos, dados processados e a declaração gerada (inclusive o conteúdo original de um `.DBK` importado, via `saveOriginalDBK`/`getOriginalDBK`).

## AssetProcessor

`src/infrastructure/adapters/AssetProcessor.ts` — implementa `AssetProcessorPort` com a lógica de negócio: ordenação cronológica, cálculo de custo médio, aplicação de eventos especiais, apuração de resultados de venda e mensais, extração de rendimentos e validação de inconsistências. Recebe um `ExternalEventInfoProviderPort` no construtor (hoje, `StaticEventInfoAdapter`) para resolver datas/fatores de eventos não informados pela B3.

## Adaptadores de busca externa de ativos (`ExternalTickerInfoProviderPort/`)

Ver [03-portas-interfaces.md](./03-portas-interfaces.md#externaltickerinfoproviderport) para a lista completa (`StaticTickerInfoAdapter` conectado por padrão; `BrapiAdapter`, `BrasilApiAdapter`, `CNPJInfoAdapter`, `Investidor10ScraperAdapter` existem mas não estão conectados no `Container`).

## Adaptadores de UI

A UI (`src/presentation/`) funciona como adaptador primário. Não há roteamento por URL (`react-router-dom` está instalado e o app é envolvido em um `BrowserRouter`, mas não há `<Routes>`/`<Route>` em uso) — a navegação é um wizard de passos controlado por `activeStep` no `AppContext` (0 a 4):

| `activeStep` | Página renderizada |
|---|---|
| 0 | `HomePage` (lista/seleção de sessões) |
| 1 | `UploadPage` |
| 2 | `ProcessPage` |
| 3 | `DeclarationPage` (dados do contribuinte + geração) |
| 4 | `ResultPage` |

`MainLayout` (`src/presentation/layout/MainLayout.tsx`) renderiza a barra superior (com um `Stepper` do Material-UI quando há sessão ativa) e um rodapé fixo onde cada página faz "portal" dos seus próprios botões de navegação, via `NavFooterContext`. Não existem componentes `Header`/`Footer`/`Layout` separados nem uma `NotFoundPage` (não há rotas para "não encontrar").

## Relacionamentos entre Adaptadores

```
┌─────────────────────────────────────────────────────────────────┐
│                     Adaptador Primário (UI)                      │
│   HomePage → UploadPage → ProcessPage → DeclarationPage → ResultPage │
│         (navegação por activeStep, não por URL/rotas)             │
└───────────────────────────────┬───────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                          Domínio / Portas                        │
└───────────┬────────────────────┬────────────────────┬───────────┘
            │                    │                    │
            ▼                    ▼                    ▼
┌─────────────────┐  ┌──────────────────┐  ┌─────────────────────┐
│  B3FileParser    │  │  AssetProcessor   │  │ DBKFileParser/       │
│  IndexedDBStorage│  │  StaticEventInfo  │  │ DBKFileGenerator      │
│                  │  │  Adapter          │  │ (+ LayoutDBK2025/*)   │
└─────────────────┘  └──────────────────┘  └─────────────────────┘
```
