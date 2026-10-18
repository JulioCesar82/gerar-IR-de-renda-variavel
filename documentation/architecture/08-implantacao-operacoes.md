# Implantação e Operações

## Introdução

Este documento descreve o processo de build e deploy **realmente usado** no projeto. (Uma versão anterior descrevia Electron, PWA, Netlify/Vercel/AWS, CI/CD via GitHub Actions, Web Workers e um `Logger`/`ErrorHandler`/`Analytics` dedicados — nada disso existe no código; foi substituída por este conteúdo.)

## Build

A aplicação é uma SPA React/TypeScript, compilada com Vite:

```bash
npm run build
```

Gera os arquivos estáticos em `dist/` (configurado em `vite.config.ts`, com `base: '/gerar-IR-de-renda-variavel/'` em produção).

## Deploy

O deploy é feito para **GitHub Pages**, via o pacote `gh-pages`:

```json
"predeploy": "npm run build",
"deploy": "gh-pages -d dist"
```

```bash
npm run deploy
```

O campo `homepage` em `package.json` (`https://juliocesar82.github.io/gerar-IR-de-renda-variavel`) é o que o Vite usa para calcular o `base` path e o que o `gh-pages` publica. **Não há pipeline de CI/CD** — o deploy é disparado manualmente pelo mantenedor a partir da sua máquina.

## Ambientes

Não há ambientes de homologação/staging configurados — apenas desenvolvimento local (`npm run dev`, porta 3000) e produção (GitHub Pages). Não há arquivo `src/config.ts` nem variáveis `VITE_APP_VERSION`/`VITE_ENABLE_*`.

## O que não existe (e não deveria ser assumido em planejamento)

- Distribuição como app desktop (Electron) ou PWA — citadas no roadmap como possibilidades futuras ("Won't Have"/fases avançadas, ver [vision/03-roadmap.md](../vision/03-roadmap.md)), não implementadas.
- CI/CD (GitHub Actions, Netlify, Vercel) — os testes e o lint são executados manualmente pelo contribuidor antes do PR (ver [06-estrategia-testes.md](./06-estrategia-testes.md)).
- Web Workers para processamento em background — o processamento de transações ocorre na thread principal.
- Módulos dedicados de logging/analytics/error tracking (`src/utils/logger.ts`, `errorHandler.ts`, `analytics.ts`) — não existem; erros não tratados aparecem apenas no console do navegador.

## Scripts auxiliares

A pasta `scripts/` contém wrappers `.sh`/`.bat` (para uso local, fora do npm) que chamam os scripts do `package.json` com uma pausa ao final, úteis para quem roda clicando no arquivo em vez de via terminal: `run-dev`, `build`, `preview-build`, `run-tests`, `run-tests-coverage`, `lint-code`, `format-code`, `clean`, `create-zip`, `setup`, `run-all`.

## Manutenção

Não há processo formal de versionamento (branches `develop`/`release`/`feature`) — o repositório trabalha direto em `main`, com PRs. Use o [CHANGELOG.md](../../CHANGELOG.md) para acompanhar o que mudou entre versões (`package.json` controla a versão atual via SemVer).
