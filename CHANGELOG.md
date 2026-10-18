# Changelog

Todas as alterações notáveis neste projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/),
e este projeto adere ao [Versionamento Semântico](https://semver.org/lang/pt-BR/).

## [Não lançado]

### Adicionado

- Exibição da razão social da empresa (via BrasilAPI, a partir do CNPJ) na coluna de CNPJ da página de resultados
- Seletor de corretora por linha na tela de resultados, incluída no texto de discriminação do bem
- Funcionalidade de reimportação de arquivos em sessões existentes

### Corrigido

- Correção no fator de desdobramento e no cálculo de bonificação
- `MainLayout` ajustado para permitir container em largura total

## [1.1.0] - 2025-04-09

### Adicionado

- Funcionalidade de importação de arquivos .DBK da Receita Federal para preenchimento automático dos dados do contribuinte
- Suporte para extração de informações do contribuinte a partir de arquivos .DBK no formato oficial da Receita Federal
- Validação e sanitização dos dados extraídos de arquivos .DBK
- Testes unitários para o parser de arquivos .DBK

### Alterado

- Melhorada a segurança para evitar o armazenamento de dados sensíveis como valores padrão no código
- Atualizada a documentação para incluir informações sobre a nova funcionalidade de importação de arquivos .DBK

### Corrigido

- Corrigido o problema de extração incorreta de campos de endereço a partir de arquivos .DBK

## [1.0.0] - 2025-03-15

### Adicionado

- Importação de arquivos de negociação e movimentação da B3
- Processamento de transações e eventos especiais
- Cálculo de posições de ativos, resultados mensais e registros de rendimentos
- Interface de usuário para interação com a aplicação
- Armazenamento local de dados usando IndexedDB
- Documentação completa da arquitetura e fluxo de dados
