# Segurança

## Introdução

A segurança é um aspecto fundamental da aplicação Gerador de Arquivo IRPF para Investimentos B3, especialmente considerando a natureza sensível dos dados financeiros e fiscais processados. Este documento descreve as considerações de segurança, medidas implementadas e boas práticas adotadas para proteger os dados dos usuários e garantir a integridade da aplicação.

## Princípios de Segurança

A abordagem de segurança da aplicação é baseada nos seguintes princípios:

1. **Privacidade por Design**: A privacidade é considerada desde o início do desenvolvimento, não como um complemento.
2. **Processamento Local**: Transações, cálculos de custo médio/resultado e geração do arquivo `.DBK` são processados localmente no dispositivo do usuário. Exceção: a tela de resultados envia o CNPJ (dado público) de cada empresa à API pública BrasilAPI para obter a razão social exibida na interface — ver "Exceção: Consulta de Razão Social" abaixo.
3. **Minimização de Dados**: Apenas os dados necessários são coletados e armazenados.
4. **Transparência**: O usuário tem visibilidade sobre quais dados são utilizados e como são processados.
5. **Segurança por Padrão**: Configurações seguras são aplicadas por padrão, sem necessidade de ação do usuário.

## Modelo de Ameaças

### Ativos a Proteger

1. **Dados Financeiros**: Informações sobre transações, posições de ativos e resultados financeiros.
2. **Dados Pessoais**: Informações como nome, CPF e outros dados do contribuinte.
3. **Arquivos Gerados**: Arquivos de importação para a declaração de imposto de renda.

### Potenciais Ameaças

1. **Acesso Não Autorizado**: Acesso aos dados por pessoas não autorizadas.
2. **Manipulação de Dados**: Alteração maliciosa dos dados processados.
3. **Vazamento de Dados**: Exposição não intencional de dados sensíveis.
4. **Ataques de Injeção**: Tentativas de injetar código malicioso através de entradas do usuário.
5. **Vulnerabilidades em Dependências**: Riscos introduzidos por bibliotecas de terceiros.

## Medidas de Segurança

### Processamento Local

O cálculo de posições, custo médio, resultados e a geração do `.DBK` (classe `AssetProcessor`, que implementa `AssetProcessorPort`) ocorrem inteiramente no navegador do usuário, sem chamadas de rede.

### Exceção: Consulta de Razão Social

A tela de resultados (`ResultPage.tsx`) faz uma chamada `fetch` direta para `https://brasilapi.com.br/api/cnpj/v1/{cnpj}` para obter a razão social de cada empresa, usando apenas o CNPJ (dado público) extraído dos dados já processados localmente. Nenhum dado de transação, posição ou resultado fiscal é enviado — apenas o CNPJ da empresa.

Vale notar que essa chamada é feita diretamente no componente de UI, sem passar por um adaptador/porta (`ExternalTickerInfoProviderPort`). Existem adaptadores para esse fim (`BrapiAdapter`, `BrasilApiAdapter`, `CNPJInfoAdapter`, `Investidor10ScraperAdapter`), mas nenhum está conectado no `Container` de injeção de dependências — o container usa apenas `StaticTickerInfoAdapter`, que é local. Padronizar essa consulta através da porta é um débito técnico em aberto.

### Armazenamento Seguro

Os dados são armazenados localmente usando IndexedDB, que oferece isolamento por origem (same-origin policy), garantindo que apenas a aplicação possa acessar os dados armazenados.

```typescript
export class IndexedDBStorage implements StoragePort {
  private readonly DB_NAME = 'IRPFGeneratorDB';
  private readonly DB_VERSION = 1;
  
  // IndexedDB é isolado por origem, garantindo que apenas a aplicação
  // possa acessar os dados armazenados
}
```

### Validação de Entrada

Entradas do usuário e dados extraídos dos arquivos Excel/`.DBK` são validados antes do processamento, para evitar dados inconsistentes. A validação é feita manualmente nos próprios adaptadores (`B3FileParser`, `DBKFileParser`), não com uma biblioteca de schema como `zod` — **`zod` não é uma dependência deste projeto**; o exemplo abaixo é apenas ilustrativo de como essa validação poderia ser formalizada.

```typescript
// Exemplo ilustrativo (não implementado) de validação com uma lib de schema
export function validateTransaction(transaction: unknown): Transaction {
  const schema = z.object({
    assetCode: z.string().min(1).max(10),
    quantity: z.number().positive(),
    unitPrice: z.number().positive(),
    totalValue: z.number(),
  });

  return schema.parse(transaction);
}
```

### Sanitização de Dados

Os dados extraídos de arquivos externos são sanitizados para remover possíveis conteúdos maliciosos.

```typescript
// Exemplo de sanitização de dados
function sanitizeAssetCode(assetCode: string): string {
  // Remove caracteres especiais e limita o tamanho
  return assetCode.replace(/[^\w]/g, '').substring(0, 10);
}
```

### Proteção Contra XSS

React escapa por padrão o conteúdo renderizado, reduzindo o risco de XSS. **Não há, hoje, uma Content Security Policy (CSP) configurada em `index.html`.** O exemplo abaixo é uma sugestão de política a adotar — ao implementá-la, lembrar de liberar `connect-src` para `brasilapi.com.br` (consulta de razão social).

```html
<!-- Sugestão de CSP para index.html (ainda não implementada) -->
<meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self' https://brasilapi.com.br">
```

### Gerenciamento de Dependências

As dependências são regularmente atualizadas e verificadas quanto a vulnerabilidades conhecidas, usando ferramentas como npm audit.

```json
// package.json
{
  "scripts": {
    "audit": "npm audit",
    "audit:fix": "npm audit fix"
  }
}
```

## Conformidade com Regulamentos

A aplicação foi projetada para estar em conformidade com regulamentos de privacidade e proteção de dados, incluindo:

### LGPD (Lei Geral de Proteção de Dados)

- **Minimização de Dados**: Apenas os dados necessários são coletados e processados. A única informação enviada a um serviço externo é o CNPJ da empresa (dado público, não pessoal) para consulta de razão social.
- **Finalidade Específica**: Os dados são utilizados apenas para a finalidade declarada.
- **Transparência**: O usuário é informado sobre quais dados são utilizados e como são processados (ver [01-visao-geral.md](./01-visao-geral.md#considerações-de-segurança)).
- **Segurança**: Medidas técnicas e organizacionais são implementadas para proteger os dados.

### Considerações Fiscais

- **Integridade dos Dados**: Garantia de que os dados processados e os arquivos gerados estão em conformidade com as exigências da Receita Federal.
- **Auditabilidade**: Capacidade de rastrear e verificar as operações realizadas.

## Boas Práticas de Segurança

### Princípio do Menor Privilégio

A aplicação segue o princípio do menor privilégio, onde cada componente tem acesso apenas aos recursos e dados necessários para sua função.

```typescript
// Exemplo de aplicação do princípio do menor privilégio
export class B3FileParser implements FileParserPort {
  // Esta classe tem acesso apenas aos métodos necessários para parsing de arquivos,
  // sem acesso a funcionalidades de processamento ou armazenamento
}
```

### Não Armazenamento de Dados Sensíveis no Código

A aplicação evita armazenar dados sensíveis como valores padrão no código, especialmente em parsers e geradores que lidam com informações pessoais.

```typescript
// Exemplo de código que evita dados sensíveis como valores padrão
export class DBKParser {
  private extractTaxPayerInfoFromOfficialDBK(content: string): TaxPayerInfo {
    // ...
    
    // Ao invés de usar valores fixos como:
    // taxPayerInfo.address.number = '97';
    // taxPayerInfo.address.complement = 'APTO 194';
    
    // Usamos valores vazios ou genéricos:
    taxPayerInfo.address.number = '';
    taxPayerInfo.address.complement = '';
    
    // ...
  }
}
```

### Segurança em Profundidade

A aplicação implementa múltiplas camadas de segurança, de modo que a falha de uma camada não comprometa a segurança do sistema como um todo.

1. **Validação de Entrada**: Primeira linha de defesa contra dados maliciosos.
2. **Sanitização de Dados**: Segunda linha de defesa para remover conteúdo potencialmente perigoso.
3. **Isolamento de Componentes**: Terceira linha de defesa para limitar o impacto de possíveis vulnerabilidades.

### Logging e Monitoramento

A aplicação implementa logging de eventos relevantes para segurança, permitindo a detecção e investigação de possíveis incidentes.

```typescript
// Exemplo de logging de eventos de segurança
function logSecurityEvent(event: SecurityEvent): void {
  console.warn(`[Security] ${event.type}: ${event.message}`, event.details);
  
  // Em uma aplicação web, poderíamos armazenar esses logs localmente
  // ou, com consentimento do usuário, enviá-los para análise
}
```

## Testes de Segurança

### Análise Estática de Código

O projeto usa ESLint (`eslint:recommended`, `@typescript-eslint/recommended`, regras de React/React Hooks — ver configuração em `package.json`). **O plugin `eslint-plugin-security` não está instalado**; adotá-lo é uma melhoria possível, não algo já implementado.

### Testes de Penetração

Testes de penetração são realizados periodicamente para identificar e corrigir vulnerabilidades.

### Revisão de Código

Todo o código é revisado por pares, com atenção especial para aspectos de segurança.

## Resposta a Incidentes

### Plano de Resposta

Um plano de resposta a incidentes está em vigor para lidar com possíveis violações de segurança:

1. **Identificação**: Detecção e confirmação do incidente.
2. **Contenção**: Limitação do impacto do incidente.
3. **Erradicação**: Remoção da causa raiz do incidente.
4. **Recuperação**: Restauração de sistemas e dados afetados.
5. **Lições Aprendidas**: Análise do incidente para prevenir recorrências.

### Atualizações de Segurança

Atualizações de segurança são lançadas prontamente em resposta a vulnerabilidades descobertas.

## Considerações Específicas para Aplicações Web

### Armazenamento Local

O armazenamento local (IndexedDB, LocalStorage) é utilizado com cuidado, considerando suas limitações de segurança:

- **Dados Sensíveis**: Dados sensíveis são armazenados apenas em IndexedDB, que oferece maior isolamento.
- **Expiração de Dados**: Dados são removidos quando não são mais necessários.

```typescript
// Exemplo de remoção de dados desnecessários
async function cleanupOldSessions(): Promise<void> {
  const sessions = await storage.getSessions();
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
  
  for (const session of sessions) {
    if (new Date(session.lastModified) < oneYearAgo) {
      await storage.deleteSession(session.id);
    }
  }
}
```

### Proteção Contra CSRF

Embora a aplicação não utilize autenticação tradicional, medidas contra Cross-Site Request Forgery (CSRF) são implementadas para proteger operações sensíveis.

### Segurança de Dependências Frontend

As dependências frontend são verificadas quanto a vulnerabilidades e mantidas atualizadas.

```bash
# Verificação de vulnerabilidades em dependências
npm audit

# Atualização de dependências
npm update
```

## Conclusão

A segurança é uma prioridade na aplicação Gerador de Arquivo IRPF para Investimentos B3. Através da implementação de múltiplas camadas de segurança, processamento local de dados, validação rigorosa de entradas e conformidade com regulamentos de privacidade, a aplicação busca proteger os dados sensíveis dos usuários e garantir a integridade das operações realizadas.

A abordagem de segurança é contínua, com monitoramento constante, atualizações regulares e adaptação a novas ameaças e requisitos de segurança. O compromisso com a segurança e a privacidade dos usuários é fundamental para a confiabilidade e o sucesso da aplicação.
