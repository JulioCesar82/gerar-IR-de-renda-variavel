# Interface de Usuário

## Introdução

A interface é construída com React, TypeScript e **Material-UI (MUI)**. `tailwindcss` está presente nas `devDependencies` e há um `tailwind.config.js`/`postcss.config.js`, mas os componentes de página usam majoritariamente MUI (`@mui/material`, `@mui/icons-material`, `@mui/x-data-grid`) — confirme no código antes de assumir Tailwind como o sistema de estilos principal de uma tela específica.

## Estrutura de Componentes

```
src/presentation/
├── App.tsx                  # monta o tema MUI e decide qual página renderizar
├── layout/
│   └── MainLayout.tsx       # barra superior + stepper + rodapé de navegação
├── context/
│   ├── AppContext.tsx       # estado global da aplicação (sessões, processamento, geração)
│   └── NavFooterContext.tsx # permite cada página portar seus botões para o rodapé fixo
└── pages/
    ├── HomePage.tsx         # lista de sessões salvas / ponto de entrada
    ├── UploadPage.tsx       # upload dos arquivos de negociação/movimentação da B3
    ├── ProcessPage.tsx      # processamento (posições, resultados, inconsistências)
    ├── DeclarationPage.tsx  # dados do contribuinte + importação opcional de .DBK anterior
    └── ResultPage.tsx       # resultado final, tabela de ativos/CNPJ, download do .DBK
```

Não existem `Header.tsx`/`Footer.tsx`/`Layout.tsx` como componentes separados, nem `NotFoundPage.tsx`.

## Navegação: wizard por estado, não por rotas

`main.tsx` envolve a aplicação em um `<BrowserRouter>`, mas **não há `<Routes>`/`<Route>` em uso em nenhum lugar do código**. A navegação entre telas é feita trocando `state.activeStep` (0 a 4) no `AppContext`, lido por `App.tsx` para decidir qual página renderizar:

| `activeStep` | Página |
|---|---|
| 0 | `HomePage` |
| 1 | `UploadPage` |
| 2 | `ProcessPage` |
| 3 | `DeclarationPage` |
| 4 | `ResultPage` |

`MainLayout` exibe um `Stepper` do MUI (não-linear) quando há uma sessão ativa, permitindo saltar entre os passos já alcançados (controlado por `isStepEnabled` em função dos dados já carregados na sessão). Não há URLs distintas por tela — um F5 sempre volta para o estado inicial da sessão em memória (os dados persistem via `IndexedDBStorage`, mas o passo atual da UI não é restaurado pela URL).

## Gerenciamento de Estado

Todo o estado da aplicação (sessões, arquivo em importação, processamento, geração, `activeStep`) fica centralizado em `AppContext` (`src/presentation/context/AppContext.tsx`), exposto via o hook `useAppContext()`. As páginas leem `state` e chamam `actions` (ex.: `importFiles`, `processAssets`, `generateDeclaration`, `setActiveStep`) — não há Redux, Zustand ou similar. `NavFooterContext` é um context auxiliar só para permitir que cada página renderize seus botões de "Voltar/Avançar" dentro do rodapé fixo do `MainLayout` (via portal), não para estado de domínio.

## Páginas

- **HomePage**: lista as sessões salvas (`IndexedDBStorage`) e permite iniciar uma nova.
- **UploadPage**: upload dos arquivos `.xlsx` de negociação (obrigatório) e movimentação (opcional); aceita também JSON para facilitar testes.
- **ProcessPage**: dispara `analyzeTransactionsAndSpecialEvents` e exibe progresso/inconsistências.
- **DeclarationPage**: coleta dados do contribuinte; permite importar um `.DBK` anterior (via `DBKFileParser`) para pré-preencher nome/CPF/endereço.
- **ResultPage**: tabela de posições/ativos (com coluna de CNPJ e razão social — ver [07-seguranca.md](./07-seguranca.md) sobre a chamada à BrasilAPI feita diretamente nesta página), seletor de corretora por linha, e botões de download do `.DBK` gerado.

## Testes de UI

Ver [06-estrategia-testes.md](./06-estrategia-testes.md) para a estratégia real de testes (Jest + Testing Library; sem Cypress, MSW ou axe no projeto).

## Conclusão

A UI é um wizard de 5 passos com estado centralizado em um único Context, não uma SPA roteada por URL. Isso é uma escolha de produto válida (o fluxo é sempre sequencial), mas deve ser levado em conta ao planejar deep-linking, compartilhamento de URL de uma tela específica, ou testes E2E baseados em navegação por URL.
