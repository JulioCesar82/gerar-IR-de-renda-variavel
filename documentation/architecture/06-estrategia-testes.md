# Estratégia de Testes

## Introdução

Este documento descreve a estratégia de testes **realmente implementada** no projeto. (Uma versão anterior deste documento descrevia uma estratégia aspiracional — Cypress, Mock Service Worker, testes de acessibilidade com axe, CI no GitHub Actions — que nunca foi implementada; foi substituída por este conteúdo.)

## Ferramentas

- **Jest** (`jest.config.js`, preset `ts-jest`, ambiente `jsdom`).
- **React Testing Library** / `@testing-library/jest-dom` / `@testing-library/user-event` (para os poucos testes de componente, se/quando existirem).
- Setup em `src/setupTests.ts` (referenciado por `setupFilesAfterEnv`).
- **Não há** Cypress, Mock Service Worker, axe-core, husky/lint-staged ou pipeline de CI configurados no repositório.

## Testes versionados no repositório

Hoje existem três arquivos de teste comitados:

- `src/core/domain/__tests__/IRPFDeclaration.test.ts`
- `src/core/interfaces/__tests__/StoragePort.test.ts`
- `src/utils/__tests__/formatters.test.ts`

## Geração dinâmica de testes por ativo (a particularidade deste projeto)

O comando principal de teste é:

```json
"test": "python scripts/generate_asset_tests.py --year 2025 && jest"
```

`scripts/generate_asset_tests.py`:

1. Lê os arquivos de exemplo `documentation/example-b3-files/negociacao-exemplo.json` e `movimentacao-exemplo.json` (o README orienta o contribuidor a substituir esses arquivos pelos seus próprios extratos convertidos de Excel para JSON).
2. Agrupa as operações por ativo (ticker).
3. Gera, para cada ativo, um arquivo de teste e um fixture de histórico em `src/infrastructure/adapters/__tests__/calculation/` (e subpasta `history/`).
4. Esses arquivos gerados **não são versionados** (estão em `.gitignore`) — são recriados a cada execução de `npm test`, a partir do ano passado via `--year`.

Isso permite validar o cálculo de custo médio, resultado de vendas e classificação de rendimentos para cada ativo presente nos extratos de exemplo (ou nos extratos reais do contribuidor, se ele os usar), sem precisar escrever manualmente um teste por ticker.

Para rodar o teste de um único ativo depois de gerado:

```bash
npm run test:specific-asset   # roda src/infrastructure/adapters/__tests__/calculation/CMIG.test.ts
```

## Cobertura

`jest.config.js` define uma meta de cobertura **global de 90%** (branches, functions, lines, statements):

```javascript
coverageThreshold: {
  global: { branches: 90, functions: 90, lines: 90, statements: 90 },
},
```

Não há metas diferentes por camada (domínio/portas/UI) — é um único limiar global.

## O que não existe (e não deveria ser assumido em planejamento)

- Testes end-to-end (Cypress, Playwright).
- Mock de requisições de rede (MSW) — a única chamada de rede do app (busca de razão social via BrasilAPI, ver [07-seguranca.md](./07-seguranca.md)) não tem teste de integração dedicado hoje.
- Testes de acessibilidade automatizados (axe).
- Pipeline de CI (GitHub Actions ou outro) executando testes a cada push/PR.
- Hooks de pre-commit (husky/lint-staged).

Essas são lacunas reais, não decisões documentadas — qualquer uma pode ser adotada no futuro, mas hoje a verificação de testes/lint é manual (executada localmente pelo contribuidor antes do PR).
