# Adaptadores

## Introdução

Os adaptadores são implementações concretas das portas definidas em `src/core/interfaces/`. Ficam principalmente em `src/infrastructure/adapters/`. Este documento lista os adaptadores reais do código e como se conectam (ver `src/infrastructure/di/Container.ts` para a montagem).

## B3FileParser

`src/infrastructure/adapters/B3FileParser.ts` — implementa `FileParserPort`. Lê os arquivos `.xlsx` de negociação e movimentação (via SheetJS/`xlsx`), identifica cabeçalhos, normaliza datas/valores/códigos de ativo e mapeia para `Transaction[]` / `SpecialEvent[]`. Também contém a lógica que filtra eventos irrelevantes para o cálculo (ex.: "Transferência - Liquidação", "Reembolso - Empréstimo de ativos").

## DBKFileParser e DBKFileGenerator

`src/infrastructure/adapters/DBKFileParser.ts` e `DBKFileGenerator.ts` implementam, respectivamente, a extração de dados de um `.DBK` existente (usada para importar uma declaração pré-preenchida) e a geração do `.DBK` final (`IRPFGeneratorPort`). Ambos delegam a manipulação de baixo nível do layout da Receita Federal para as classes em `src/infrastructure/adapters/LayoutDBK2025/`:

- `layout.ts` — único módulo com o schema do layout `.DBK` vigente (declaração 2025, ano-calendário 2024): as interfaces `FieldDefinition`/`RecordDefinition`, o objeto `layout` (campos posicionais de cada registro — IR, 16, 27, 23, 24, 40, 42, 84, 86, 88, T9) e `buildRecordLine()`, que monta uma linha de um registro a partir desse schema (campos não informados recebem um default neutro — espaço/zero — pelo formato do campo). `ReaderDBKFileEditor.ts`, `WritterDBKFileEditor.ts` e `RandomDBKFileGenerator.ts` importam esse módulo em vez de manter cópias próprias (anteriormente havia 3 cópias divergentes; a do `WritterDBKFileEditor.ts` estava incompleta para os registros `IR`/`16`/`40`/`42`, o que impedia a escrita correta desses campos — ver histórico do card CODE-DEBT-001).
- `DBKFileEditor.ts` — editor de baixo nível, agnóstico de schema: manipula linhas/campos por posição (`start`/`end`) recebidos de quem chama; não conhece o `layout`.
- `ReaderDBKFileEditor.ts` — leitura/parsing de um `.DBK`.
- `WritterDBKFileEditor.ts` — escrita/geração de um `.DBK`. `setIdentificacaoDeclarante()` grava os campos do Declarante (registro 16) usando o schema de `layout.ts` diretamente com `DBKFileEditor.updateFieldInLine()`. Quando o editor está completamente vazio (nenhum `.DBK` anterior foi importado), `createBlankDeclarationSkeleton()` cria do zero os registros IR, 16, doze R40, doze R42 e T9 via `buildRecordLine()` antes de preencher os dados do contribuinte — um esqueleto best-effort: campos do cabeçalho IR sem posição documentada neste projeto (bytes 257–1193) ficam em branco/zero, então o arquivo gerado sem importação prévia deve ser revisado no programa oficial da Receita Federal antes da transmissão.
- `RandomDBKFileGenerator.ts` — gerador de dados aleatórios para testes, hoje reutilizando o schema de `layout.ts` (fora da pasta `todo-mudar/`, removida após a unificação).

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
