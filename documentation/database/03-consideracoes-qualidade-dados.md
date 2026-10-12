# Considerações sobre Qualidade de Dados

## Introdução

Este documento descreve o que **existe de fato** para lidar com qualidade de dados no Gerador de Arquivo IRPF para Investimentos B3. (Uma versão anterior descrevia métricas de qualidade, correção automática, correção manual assistida e logging estruturado de auditoria — nada disso está implementado; foi substituída por este conteúdo.)

## O mecanismo real: `Inconsistency[]`

A única validação formal de qualidade de dados é `AssetProcessorPort.validateData(transactions, specialEvents)`, implementada em `AssetProcessor.ts` e usada por `ProcessAssetsUseCase`. Ela retorna uma lista de `Inconsistency`:

```typescript
export interface Inconsistency {
  type: 'error' | 'warning';
  message: string;
  details: string;
  assetCode?: string;
  date?: Date;
  locationInfo?: string;
}
```

Essa lista é exibida ao usuário na `ProcessPage` — tipicamente sinalizando casos como vendas a descoberto (venda de uma quantidade maior do que a posição atual) ou dados que não puderam ser totalmente interpretados. **O processamento não é bloqueado por inconsistências de tipo `warning`**; o usuário decide como proceder. Não há, hoje:

- Correção automática de dados (normalização de código de ativo e de data já ocorre no `B3FileParser` durante a extração, não como uma etapa separada de "auto-correção" pós-processamento).
- Interface de correção manual de transações/eventos já importados.
- Validação de CPF com dígito verificador — `DeclarationPage.tsx` valida apenas que o CPF tem 11 dígitos numéricos (`/^\d{11}$/`), sem calcular os dígitos verificadores.
- Métricas agregadas de qualidade (score de completude/precisão/consistência) ou logging estruturado de auditoria do processamento — erros não tratados aparecem apenas no console do navegador.

## Validações que de fato ocorrem na extração (`B3FileParser`)

- Normalização do código do ativo (remove espaços, maiúsculas).
- Identificação de cabeçalhos/colunas esperadas na planilha.
- Classificação de categoria do ativo a partir do código/especificação.
- Filtro de linhas de evento irrelevantes para o cálculo fiscal (ex.: "Transferência - Liquidação", "Reembolso - Empréstimo de ativos" — ver [PORTAL_B3.md](../../PORTAL_B3.md)).

## Recomendação

Se o projeto quiser formalizar dimensões de qualidade (completude, precisão, consistência, validade, integridade, temporalidade) como as de um catálogo de dados tradicional, isso ainda precisa ser desenhado e implementado — este documento deve ser atualizado apenas quando essa lógica existir de fato no código, para não voltar a divergir da implementação real.
