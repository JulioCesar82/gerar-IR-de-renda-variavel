# Visão do Produto

## Introdução

O Gerador de Arquivo IRPF para Investimentos B3 é uma aplicação web projetada para auxiliar investidores brasileiros na preparação de suas declarações de imposto de renda. A aplicação processa extratos da B3 (Brasil, Bolsa, Balcão), calcula o custo médio de ativos, apura resultados de operações e gera um arquivo no formato aceito pela Receita Federal para importação direta no programa IRPF.

## Problema

Investidores que operam na bolsa de valores brasileira enfrentam desafios significativos na hora de declarar seus investimentos no Imposto de Renda:

1. **Complexidade**: As regras fiscais para investimentos em renda variável são complexas e sujeitas a mudanças.
2. **Volume de Dados**: Investidores ativos podem ter centenas ou milhares de operações ao longo do ano.
3. **Cálculos Manuais**: O cálculo manual de custo médio e apuração de resultados é trabalhoso e propenso a erros.
4. **Eventos Especiais**: Desdobramentos, bonificações e outros eventos corporativos complicam ainda mais os cálculos.
5. **Formato Específico**: A Receita Federal exige um formato específico para importação de dados.

Esses desafios resultam em:
- Tempo excessivo gasto na preparação da declaração
- Risco de erros e inconsistências
- Possibilidade de multas e penalidades
- Estresse e ansiedade durante o período de declaração

## Solução

O Gerador de Arquivo IRPF para Investimentos B3 resolve esses problemas através de:

1. **Importação Automatizada**: Leitura direta dos extratos fornecidos pela B3.
2. **Processamento Inteligente**: Cálculo automático de custo médio, considerando eventos especiais.
3. **Apuração de Resultados**: Cálculo de lucros, prejuízos e impostos devidos.
4. **Geração de Arquivo**: Criação de arquivo no formato aceito pela Receita Federal.
5. **Processamento Local**: Todos os dados são processados localmente, garantindo privacidade e segurança.

## Personas

### Investidor Individual

**Nome**: Carlos Silva  
**Idade**: 35 anos  
**Ocupação**: Engenheiro de Software  
**Perfil de Investimento**: Investe regularmente em ações e FIIs há 3 anos  
**Desafios**:
- Realiza cerca de 20-30 operações por mês
- Tem dificuldade em acompanhar o custo médio de seus ativos
- Gasta muito tempo organizando dados para a declaração de IR
- Preocupa-se com a possibilidade de cometer erros

### Investidor Ativo

**Nome**: Mariana Costa  
**Idade**: 42 anos  
**Ocupação**: Administradora  
**Perfil de Investimento**: Day trader e investidora de médio prazo  
**Desafios**:
- Realiza centenas de operações por mês
- Precisa acompanhar resultados mensais para recolhimento de DARF
- Tem dificuldade em consolidar grande volume de dados
- Necessita de uma solução eficiente para não perder tempo com burocracia

### Contador

**Nome**: Roberto Almeida  
**Idade**: 50 anos  
**Ocupação**: Contador, especialista em planejamento tributário  
**Perfil**: Atende diversos clientes investidores  
**Desafios**:
- Precisa processar dados de múltiplos clientes
- Necessita de precisão nos cálculos para orientação fiscal
- Busca eficiência para atender mais clientes durante a temporada de IR
- Precisa de uma solução confiável e auditável

## Funcionalidades Principais

### MVP (Minimum Viable Product)

1. **Upload de Extratos B3**
   - Importação de arquivos de negociação (compras e vendas)
   - Importação de arquivos de movimentação (eventos corporativos)
   - Importação de uma declaração `.DBK` anterior, para pré-preencher automaticamente os dados do contribuinte (disponível desde a v1.1.0)

2. **Processamento de Dados**
   - Cálculo de custo médio de ativos
   - Tratamento de eventos especiais (desdobramentos, bonificações, etc.)
   - Apuração de resultados (lucros e prejuízos)

3. **Geração de Arquivo IRPF**
   - Criação de arquivo no formato aceito pela Receita Federal
   - Inclusão de bens e direitos (posição de ativos)
   - Inclusão de rendimentos isentos (dividendos)
   - Inclusão de rendimentos tributados exclusivamente na fonte (JCP)
   - Inclusão de operações de renda variável

4. **Interface de Usuário**
   - Fluxo guiado de importação e processamento
   - Visualização de resultados e inconsistências
   - Download do arquivo gerado

### Futuras Versões

1. **Gestão de Múltiplos Anos**
   - Armazenamento de dados históricos
   - Importação de posições de anos anteriores
   - Geração de declarações para múltiplos anos

2. **Análise Fiscal Avançada**
   - Simulações de operações e impacto fiscal
   - Sugestões de estratégias para otimização tributária
   - Alertas de oportunidades de compensação de prejuízos

3. **Exportação de Relatórios**
   - Relatórios detalhados de operações
   - Relatórios de performance de investimentos
   - Exportação em diversos formatos (PDF, Excel, etc.)

4. **Integração com Outras Plataformas**
   - Importação de dados de outras corretoras
   - Integração com plataformas de controle de investimentos

## Benefícios

1. **Economia de Tempo**: Redução drástica no tempo gasto na preparação da declaração de IR.
2. **Precisão**: Cálculos automáticos reduzem a possibilidade de erros humanos.
3. **Conformidade Fiscal**: Garantia de que os dados estão de acordo com as exigências da Receita Federal.
4. **Tranquilidade**: Menos estresse durante o período de declaração de IR.
5. **Privacidade**: Processamento local garante que dados sensíveis não são compartilhados.

## Métricas de Sucesso

1. **Adoção**: Número de usuários ativos durante a temporada de IR.
2. **Retenção**: Percentual de usuários que retornam no ano seguinte.
3. **Eficiência**: Tempo médio para completar o processo de geração do arquivo.
4. **Satisfação**: Avaliações e feedback dos usuários.
5. **Precisão**: Taxa de sucesso na importação do arquivo gerado no programa da Receita Federal.

## Restrições e Limitações

1. **Compatibilidade de Arquivos**: A aplicação depende do formato dos extratos fornecidos pela B3, que podem mudar ao longo do tempo.
2. **Regras Fiscais**: Mudanças na legislação tributária podem requerer atualizações na lógica de processamento.
3. **Processamento Local**: O desempenho pode variar dependendo do hardware do usuário e do volume de dados.
4. **Sem Aconselhamento Fiscal**: A aplicação não substitui o aconselhamento profissional de contadores e especialistas tributários.

## Conclusão

O Gerador de Arquivo IRPF para Investimentos B3 visa simplificar significativamente um processo que é tradicionalmente complexo, demorado e propenso a erros. Ao automatizar a importação, processamento e geração de arquivos para declaração de imposto de renda, a aplicação permite que investidores foquem em suas estratégias de investimento, em vez de se preocuparem com a burocracia fiscal.

A abordagem de processamento local garante privacidade e segurança, enquanto a interface intuitiva torna o processo acessível mesmo para usuários menos técnicos. Com o crescimento contínuo do número de investidores individuais no Brasil, esta solução atende a uma necessidade crescente e mal atendida no mercado.
