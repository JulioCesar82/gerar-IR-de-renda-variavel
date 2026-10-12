# Roadmap de Produto

## Introdução

Este documento lista o que já foi entregue e o que está no backlog, **sem compromisso de data** — uma versão anterior tinha um cronograma por sprint/mês que ficou obsoleto rapidamente e não refletia o ritmo real de desenvolvimento (projeto mantido por poucas pessoas, sem equipe dedicada por fase). Para o que já existe hoje em detalhe, ver [documentation/architecture/](../architecture/) e o [CHANGELOG.md](../../CHANGELOG.md).

## Entregue

- **Importação dos extratos da B3** (negociação e movimentação, `.xlsx`, com suporte a JSON para testes).
- **Processamento de ativos**: custo médio, resultado de vendas, eventos especiais (desdobramento, grupamento, bonificação), rendimentos (dividendos, JCP, FIIs).
- **Geração do arquivo `.DBK`** no layout vigente da Receita Federal (`LayoutDBK2025`).
- **Importação de um `.DBK` anterior** para pré-preencher os dados do contribuinte.
- **Persistência local de sessões** via IndexedDB (salvar, reabrir, reimportar arquivos, exportar/importar sessão).
- **Exibição de razão social** das empresas na tela de resultados (consulta à BrasilAPI pelo CNPJ).
- **Seletor de corretora** por linha de ativo na tela de resultados.

## Backlog (sem data definida)

Itens que já foram considerados desejáveis, mas ainda não têm compromisso de implementação:

- Suporte a múltiplos anos fiscais (importar posição inicial de anos anteriores, comparar anos).
- Simulação de operações e impacto fiscal (ex.: estimar imposto antes de vender).
- Exportação de relatórios detalhados (PDF/Excel) além do `.DBK`.
- Melhorias de interface: tema claro/escuro, responsividade mobile mais trabalhada.
- Suporte a extratos de outras corretoras/plataformas, além da B3.
- Padronizar a busca de dados de ativos (CNPJ, nome) por trás da porta `ExternalTickerInfoProviderPort`, em vez da chamada direta à BrasilAPI dentro de `ResultPage.tsx` (ver [07-seguranca.md](../architecture/07-seguranca.md)).
- Pipeline de CI (rodar `npm test`/`npm run lint` automaticamente a cada PR).

## Fora de escopo por ora

- Distribuição como app desktop (Electron) ou PWA.
- Integração via API com plataformas de controle de investimentos de terceiros.
- Recursos colaborativos (compartilhamento de dados entre usuários, comentários, controle de acesso).

## Como contribuir com o roadmap

Este arquivo é atualizado de forma pontual, não em um ritmo fixo. Para propor um item novo ou discutir prioridade, abra uma [issue](https://github.com/JulioCesar82/gerar-IR-de-renda-variavel/issues) — ver [CONTRIBUTING.md](../../CONTRIBUTING.md).
