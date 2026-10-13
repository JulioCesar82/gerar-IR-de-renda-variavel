# Visão Geral do Fluxo de Dados

## Introdução

Este documento descreve o fluxo de dados no Gerador de Arquivo IRPF para Investimentos B3, desde a importação dos arquivos da B3 até a geração do arquivo para importação no programa da Receita Federal. O objetivo é fornecer uma visão clara de como os dados são processados, transformados e armazenados ao longo do ciclo de vida da aplicação.

## Diagrama de Fluxo de Dados

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Arquivos   │     │   Parser    │     │Processamento│     │ Armazenamento│
│    B3       │────>│  (Adapter)  │────>│  (Domain)   │────>│  (Adapter)  │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
                                                                   │
                                                                   ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Arquivo    │     │   Gerador   │     │ Visualização│     │  Recuperação │
│    IRPF     │<────│  (Adapter)  │<────│    (UI)     │<────│  (Adapter)  │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
                          ▲
                          │
┌─────────────┐     ┌─────────────┐
│  Arquivo    │     │   Parser    │
│    DBK      │────>│  (Adapter)  │
└─────────────┘     └─────────────┘
```

## Fontes de Dados

### Arquivo de Negociação da B3

O arquivo de negociação da B3 é um arquivo Excel (.xlsx) que contém informações sobre as operações de compra e venda realizadas pelo investidor. Este arquivo é gerado pela B3 e disponibilizado para download no site da instituição.

**Estrutura típica do arquivo:**
- Data do Negócio
- Tipo de Operação (C - Compra, V - Venda)
- Mercado (Vista, Fracionário, etc.)
- Prazo/Vencimento
- Código de Negociação
- Quantidade
- Preço
- Valor Total
- Fator de Cotação
- Especificação do Ativo

### Arquivo de Movimentação da B3

O arquivo de movimentação da B3 é um arquivo Excel (.xlsx) que contém informações sobre eventos corporativos, como dividendos, JCP, desdobramentos, bonificações, etc. Este arquivo também é gerado pela B3 e disponibilizado para download.

**Estrutura típica do arquivo:**
- Data da Movimentação
- Tipo de Movimentação (Dividendo, JCP, Desdobramento, etc.)
- Código de Negociação
- Quantidade
- Preço/Valor
- Valor Total
- Especificação do Evento

### Arquivo DBK da Receita Federal

O arquivo DBK (.dbk) é um arquivo gerado pelo programa da Receita Federal que contém informações da declaração de imposto de renda. Este arquivo pode ser importado para preencher automaticamente os dados do contribuinte.

**Estrutura do arquivo:**
- Formato de texto com posições fixas
- Contém informações do contribuinte (nome, CPF, endereço, etc.)
- Pode conter informações sobre bens, rendimentos e operações financeiras

## Processamento de Dados

### 1. Parsing de Arquivos

O primeiro passo no fluxo de dados é o parsing dos arquivos da B3. Esta etapa é realizada pelo adaptador `B3FileParser`, que implementa a interface `FileParserPort`.

**Entradas:**
- Arquivo de negociação da B3 (.xlsx)
- Arquivo de movimentação da B3 (.xlsx) (opcional)

**Saídas:**
- Lista de transações (`Transaction[]`)
- Lista de eventos especiais (`SpecialEvent[]`)

**Transformações:**
- Identificação de cabeçalhos e colunas relevantes
- Extração de dados das células
- Normalização de datas, valores e códigos
- Mapeamento para os modelos de domínio
- Validação básica de dados

### 1.1. Parsing de Arquivos DBK

Alternativamente, o usuário pode importar um arquivo DBK da Receita Federal para preencher automaticamente os dados do contribuinte. Esta etapa é realizada pelo adaptador `DBKFileParser` (`src/infrastructure/adapters/DBKFileParser.ts`), que usa `ReaderDBKFileEditor` (`LayoutDBK2025/`) internamente.

**Entradas:**
- Arquivo DBK da Receita Federal (.dbk)

**Saídas:**
- Informações do contribuinte (`TaxPayerInfo`)
- Opcionalmente, dados parciais da declaração (`Partial<IRPFDeclaration>`)

**Transformações:**
- Extração de dados de posições fixas no arquivo
- Mapeamento para o modelo de domínio
- Validação e sanitização dos dados extraídos

### 2. Processamento de Transações

Após o parsing, as transações são processadas para calcular posições, custo médio e resultados. Esta etapa é realizada pelo domínio da aplicação, especificamente pelo serviço `AssetProcessor`.

**Entradas:**
- Lista de transações (`Transaction[]`)
- Lista de eventos especiais (`SpecialEvent[]`)
- Posições iniciais (opcional)

**Saídas:**
- Lista de posições de ativos (`AssetPosition[]`)
- Lista de resultados de operações (`TradeResult[]`)
- Lista de resultados mensais (`MonthlyResult[]`)
- Lista de registros de rendimentos (`IncomeRecord[]`)
- Lista de inconsistências (`Inconsistency[]`)

**Transformações:**
- Ordenação cronológica de transações e eventos
- Cálculo de custo médio para cada ativo
- Aplicação de eventos especiais (desdobramentos, bonificações, etc.)
- Cálculo de resultados de vendas (lucro/prejuízo)
- Cálculo de resultados mensais e imposto devido
- Identificação de inconsistências nos dados

### 3. Armazenamento de Dados

Os dados processados são armazenados localmente para uso posterior. Esta etapa é realizada pelo adaptador `IndexedDBStorage`, que implementa a interface `StoragePort`.

**Entradas:**
- Lista de posições de ativos (`AssetPosition[]`)
- Lista de resultados mensais (`MonthlyResult[]`)
- Lista de registros de rendimentos (`IncomeRecord[]`)
- Dados originais (transações e eventos especiais)

**Saídas:**
- Confirmação de armazenamento bem-sucedido

**Transformações:**
- Serialização de objetos complexos
- Organização em estruturas de armazenamento (stores)
- Indexação para recuperação eficiente

### 4. Visualização de Dados

Os dados processados são recuperados do armazenamento e apresentados ao usuário através da interface gráfica. Esta etapa é realizada pelos componentes de UI.

**Entradas:**
- Dados recuperados do armazenamento

**Saídas:**
- Representação visual dos dados (tabelas, gráficos, etc.)

**Transformações:**
- Formatação de valores para exibição
- Agregação e sumarização de dados
- Filtragem e ordenação conforme interação do usuário

### 5. Geração de Arquivo IRPF

Finalmente, os dados processados são utilizados para gerar um arquivo no formato aceito pela Receita Federal. Esta etapa é realizada pelo adaptador `DBKFileGenerator`, que implementa a interface `IRPFGeneratorPort` (usando `WritterDBKFileEditor` internamente).

**Entradas:**
- Lista de posições de ativos (`AssetPosition[]`)
- Lista de resultados mensais (`MonthlyResult[]`)
- Lista de registros de rendimentos (`IncomeRecord[]`)
- Dados do contribuinte (nome, CPF, etc.)

**Saídas:**
- Arquivo .DBK para importação no programa da Receita Federal
- Opcionalmente, arquivo .DBK para backup e compartilhamento

**Transformações:**
- Mapeamento de dados para o formato da Receita Federal
- Codificação conforme especificações
- Geração de registros para bens e direitos, rendimentos isentos, rendimentos com tributação exclusiva e operações de renda variável

## Modelo de Dados

Os modelos de domínio (`Transaction`, `SpecialEvent`, `AssetPosition`, `TradeResult`, `MonthlyResult`, `IncomeRecord`, `IRPFDeclaration`) estão descritos em detalhe em [02-modelos-dominio.md](../architecture/02-modelos-dominio.md) — não são repetidos aqui para evitar duas fontes divergentes.

### Estrutura de Armazenamento

O armazenamento local (`IndexedDBStorage`, ver [03-portas-interfaces.md](../architecture/03-portas-interfaces.md#storageport)) usa duas stores principais, espelhando `StoredSession` e `StoredData`:

- **sessions**: metadados de cada sessão (`id`, `createdAt`, `lastModified`, `year`, `description`, `status`).
- **sessionData**: dados completos da sessão — transações, eventos especiais, posições iniciais, `processedData` (posições, resultados mensais, rendimentos) e a declaração gerada, além do conteúdo original de um `.DBK` importado (`saveOriginalDBK`/`getOriginalDBK`).

## Considerações sobre Escalabilidade

### Volume de Dados

O volume de dados processados pela aplicação pode variar significativamente dependendo do perfil do investidor:

- **Investidor Casual**: Poucas dezenas de transações por ano
- **Investidor Ativo**: Centenas de transações por ano
- **Day Trader**: Milhares de transações por ano

Hoje o processamento roda inteiramente na thread principal (não há Web Workers) e não há paginação, compressão de dados históricos, monitoramento de uso de armazenamento ou políticas automáticas de expiração de sessões antigas — são melhorias possíveis, não implementadas. O que já existe: o usuário pode exportar/importar uma sessão (`exportSession`/`importSession` em `AppContext`) e excluir sessões manualmente pela `HomePage`.

### Limitações do Armazenamento Local

O IndexedDB tem limitações de armazenamento que variam conforme o navegador e o dispositivo; a aplicação não implementa hoje nenhuma mitigação automática para isso além da exclusão manual de sessões pelo usuário.

## Conclusão

O fluxo de dados no Gerador de Arquivo IRPF para Investimentos B3 é projetado para ser eficiente, confiável e escalável. A arquitetura hexagonal permite uma clara separação entre o processamento de dados (domínio) e as fontes/destinos de dados (adaptadores), facilitando a manutenção e evolução da aplicação.

O modelo de dados é estruturado para representar com precisão os conceitos do domínio, enquanto o armazenamento local garante que os dados do usuário permaneçam privados e acessíveis mesmo offline.

As estratégias de escalabilidade implementadas permitem que a aplicação atenda a diferentes perfis de usuários, desde investidores casuais até traders ativos com grandes volumes de dados.
