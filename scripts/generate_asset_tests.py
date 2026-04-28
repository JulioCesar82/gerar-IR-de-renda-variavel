# python scripts/generate_asset_tests.py --year 2024

import json
import os
import re
import argparse
from collections import defaultdict
from pathlib import Path

# --- Configuration ---
DEFAULT_NEGOCIACAO_PATH = '../documentation/example-b3-files/negociacao-exemplo.json'
DEFAULT_MOVIMENTACAO_PATH = '../documentation/example-b3-files/movimentacao-exemplo.json'
DECLARATION_YEAR = 2025 # Default year, can be overridden


OUTPUT_HISTORY_DIR = '../src/infrastructure/adapters/__tests__/calculation/history'
OUTPUT_TEST_DIR = '../src/infrastructure/adapters/__tests__/calculation'

# --- Configurable JSON Field Names ---
FIELD_INDEX = '_original_index'

# Adjust these if your source JSON uses different keys
FIELD_NEG_TICKER = 'Código de Negociação'
FIELD_NEG_DATE = 'Data do Negócio'
FIELD_NEG_QUANTITY = 'Quantidade'
FIELD_NEG_UNIT_PRICE = 'Preço'
FIELD_NEG_TOTAL_COST = 'Valor'
FIELD_NEG_FACTOR = 'Fator'
FIELD_NEG_TYPE = 'Tipo de Movimentação' # Or 'Compra/Venda'
FIELD_NEG_MARKET_TYPE = 'Mercado'
FIELD_NEG_BROKER_NAME = 'Instituição'

FIELD_MOV_TICKER = 'Produto'
FIELD_MOV_DATE = 'Data'
FIELD_MOV_TYPE = 'Movimentação'
FIELD_MOV_STATUS = 'Status' # Optional field to indicate 'CREDITADO_NAO_PAGO'
FIELD_MOV_DIRECTION = 'Entrada/Saída'
FIELD_MOV_UNIT_PRICE = 'Preço unitário'
FIELD_MOV_TOTAL_COST = 'Valor da Operação'

# --- Constants for Calculation Logic ---
MOV_TYPE_DIVIDEND = 'Dividendo'
MOV_TYPE_JCP = 'Juros sobre Capital Próprio'
MOV_TYPE_FII_INCOME = 'Rendimento' # Assuming this is the type for FII income
STATUS_NOT_PAID = 'CREDITADO_NAO_PAGO' # Status indicating item goes to Bens e Direitos 99
NEG_TYPE_SELL = 'Venda' # Or 'V' depending on your data


# --- Constants for Template ---
TEMPLATE_NEW_LINE = '\\n'

# --- Helper Functions ---

def normalize_ticker(ticker_raw: str) -> str:
    """
    Normalizes a raw ticker string to its base alphabetic part.
    Examples: 'ITSA4' -> 'ITSA', 'PETR4F' -> 'PETR', 'BBDC3' -> 'BBDC'
    Handles cases like 'XYZW11 - FII XPTO' by taking the part before ' - '.
    """
    if not isinstance(ticker_raw, str):
        print(f"Warning: Invalid ticker input type: {type(ticker_raw)}, value: {ticker_raw}. Returning 'UNKNOWN'.")
        return 'UNKNOWN'
    
    # Take the part before ' - ' if it exists
    ticker_part = ticker_raw.split(' - ')[0]
    
    # Remove trailing 'F' and any digits
    match = re.match(r"([A-Z]+)", ticker_part.upper())
    if match:
        return match.group(1)
    else:
        print(f"Warning: Could not normalize ticker: {ticker_raw}. Returning as is (uppercase).")
        return ticker_part.upper() # Fallback

def load_json_data(file_path: str) -> list:
    """Loads data from a JSON file."""
    # Ensure the file path exists before opening
    if not Path(file_path).is_file():
        print(f"Error: Input file not found at {file_path}")
        exit(1)
        
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
            if not isinstance(data, list):
                # Allow empty list for cases where one file exists but not the other
                if data is None or data == '':
                    print(f"Warning: File {file_path} is empty or contains non-list data. Treating as empty list.")
                    return []
                raise ValueError("JSON content must be a list of records.")
            return data
    except FileNotFoundError:
        print(f"Error: Input file not found at {file_path}")
        exit(1)
    except json.JSONDecodeError:
        print(f"Error: Could not decode JSON from {file_path}")
        exit(1)
    except ValueError as e:
        print(f"Error loading {file_path}: {e}")
        exit(1)

def fragment_data(negociacao_data: list, movimentacao_data: list) -> dict:
    """Fragments data by normalized ticker."""
    fragmented = defaultdict(lambda: {"transactions": [], "movements": []})

    # Process Negociação
    for i, record in enumerate(negociacao_data):
        raw_ticker = record.get(FIELD_NEG_TICKER)
        if raw_ticker:
            normalized = normalize_ticker(raw_ticker)
            if normalized != 'UNKNOWN':
                 # Add original index for potential debugging
                 record[FIELD_INDEX] = i
                 fragmented[normalized]["transactions"].append(record)
        else:
            print(f"Warning: Negotiation record at index {i} missing '{FIELD_NEG_TICKER}': {record}")


    # Process Movimentação
    for i, record in enumerate(movimentacao_data):
        raw_ticker = record.get(FIELD_MOV_TICKER)
        if raw_ticker:
            normalized = normalize_ticker(raw_ticker)
            if normalized != 'UNKNOWN':
                 record[FIELD_INDEX] = i
                 fragmented[normalized]["movements"].append(record)
        else:
             print(f"Warning: Movement record at index {i} missing '{FIELD_MOV_TICKER}': {record}")

    return fragmented

def save_fragmented_files(fragmented_data: dict, output_dir: str):
    """Saves fragmented data into separate JSON files."""
    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)

    for ticker, data in fragmented_data.items():
        transactions_path = output_path / f"{ticker}_transactions.json"
        movements_path = output_path / f"{ticker}_movements.json"

        with open(transactions_path, 'w', encoding='utf-8') as f:
            json.dump(data["transactions"], f, indent=2, ensure_ascii=False)
        #print(f"Saved: {transactions_path}")

        with open(movements_path, 'w', encoding='utf-8') as f:
            json.dump(data["movements"], f, indent=2, ensure_ascii=False)
        #print(f"Saved: {movements_path}")


def generate_calculation_helper_file(test_dir: str):
    """Generates a Calculation Helper test file"""

    test_calculation_helper_file_path = Path(test_dir) / f"calculation_helper.ts" # Use .ts extension

    # --- Calculation Helper Test File Template ---
    template = f"""// Generated by scripts/generate_asset_tests.py

import {{ ExternalEventInfoProviderPort }} from '../../../../core/interfaces/ExternalEventInfoProviderPort';
import {{ StaticEventInfoAdapter }} from '../../../adapters/StaticEventInfoAdapter';

import {{ B3FileParser }} from '../../B3FileParser';
import {{ Transaction }} from '../../../../core/domain/Transaction';
import {{ SpecialEvent }} from '../../../../core/domain/SpecialEvent';

import {{ ExternalTickerInfoProviderPort }} from '../../../../core/interfaces/ExternalTickerInfoProviderPort';
import {{ StaticTickerInfoAdapter }} from '../../../adapters/ExternalTickerInfoProviderPort/StaticTickerInfoAdapter';

import {{ TaxPayerInfo, Address }} from '../../../../core/domain/IRPFDeclaration';


// Basic mock for ExternalTickerInfoProviderPort
export const mockExternalTickerInfoProvider: ExternalTickerInfoProviderPort = {{
  getStockInfo: new StaticTickerInfoAdapter().getStockInfo,
  //getStockInfo: jest.fn().mockResolvedValue(null), // Default mock returns null

  // Add mocks for other methods if AssetProcessor uses them
}};

// Basic mock for ExternalStaticEventInfoAdapter
export const mockStaticEventInfoProvider: ExternalEventInfoProviderPort = {{
    getEventsForAsset: new StaticEventInfoAdapter().getEventsForAsset,
    getEventFactor: new StaticEventInfoAdapter().getEventFactor,
    //getEventFactor: jest.fn().mockResolvedValue(null), // Default mock returns null

    getSpecialEventAveragePrice: new StaticEventInfoAdapter().getSpecialEventAveragePrice
    //getSpecialEventAveragePrice: jest.fn().mockResolvedValue(null), // Default mock returns null
    
    // Add mocks for other methods if AssetProcessor uses them
}};

// Basic mock for FileParserPort
class MockB3FileParser extends B3FileParser /*: FileParserPort*/ {{
    public parseNegotiationData(data: any[]): Transaction[] {{
        return this.processNegotiationData(data);
    }}
    //parseNegotiationData: jest.fn().mockResolvedValue(null), // Default mock returns null

    public parseMovementData(data: any[]): SpecialEvent[] {{
        return this.processMovementData(data);
    }}
    //parseMovementData: jest.fn().mockResolvedValue(null), // Default mock returns null

    // Add mocks for other methods if AssetProcessor uses them
}}

export const mockB3FileParser = new MockB3FileParser();


export const mockTaxPayerInfo: TaxPayerInfo = {{
    name: 'Test User',
    cpf: '12345678900',
    dateOfBirth: new Date(1980, 0, 1),
    occupation: '999', // Example occupation code
    email: 'test@example.com',
    phone: '11999998888',
    address: {{
        street: 'Test Street',
        number: '123',
        complement: '',
        neighborhood: 'Test Neighborhood',
        city: 'Test City',
        state: 'TS',
        zipCode: '12345000',
    }} as Address,
    // Add other required fields if any
}};

// Interfaces para tipagem

interface TransacaoBase {{
  '{FIELD_NEG_DATE}': string;
  '{FIELD_NEG_TYPE}': string; // Pode ser mais específico: 'Compra' | '{NEG_TYPE_SELL}' etc.
  '{FIELD_NEG_QUANTITY}': string; // Vem como string do input
  '{FIELD_NEG_TOTAL_COST}': string;      // Vem como string do input
  '{FIELD_NEG_UNIT_PRICE}'?: string;     // Opcional, usado na segunda função
  '{FIELD_NEG_TICKER}'?: string; // Opcional, usado na segunda função
  // Permite outras propriedades que possam existir no objeto original
  [key: string]: any;
}}

// Interface específica para a primeira função (pode herdar ou ser igual a Base)
interface TransacaoSimples extends TransacaoBase {{
  '{FIELD_NEG_TYPE}': 'Compra' | '{NEG_TYPE_SELL}' | string; // Exemplo de união
}}

// Interface para Movimentações (segunda função)
interface Movement {{
  '{FIELD_MOV_TICKER}': string;
  '{FIELD_MOV_DATE}': string;
  '{FIELD_MOV_TYPE}': string; // Ex: "Bonificação em Ativos", "Fração em Ativos"
  '{FIELD_MOV_DIRECTION}': 'Credito' | 'Debito' | string; // Tipagem mais específica
  '{FIELD_NEG_QUANTITY}': string; // Vem como string do input
  // Permite outras propriedades
  [key: string]: any;
}}

// Interface para o evento combinado interno na segunda função
interface CombinedEvent {{
  date: Date;
  eventType: string; // Poderia ser uma união mais específica de tipos de Transacao e Movement
  assetCode: string | null; // Resultado de getAssetCode
  quantity: number;
  factor?: number; // Opcional, presente em agrupamento,desdobramento
  value?: number; // Opcional, presente em transações de Compra/Venda
  price?: number; // Opcional, presente em transações
  direction?: 'Credito' | 'Debito' | string; // Opcional, presente em movements
  source: 'transaction' | 'movement';
}}

// Interface para o resultado anual
export interface ResumoAnual {{
  ano: number;
  quantidadeFinal: number;
  precoMedio: number;
  totalInvestido: number;
}}

// Interface para o resultado de vendas anual
export interface ResumoVendasAnual {{
  month: number;
  total: number;
}}

// --- Funções Auxiliares Tipadas ---

/**
 * Converte uma string de data DD/MM/YYYY para um objeto Date.
 * Retorna null se a string for inválida.
 */
export function parseDate(dateString: string | null | undefined): Date | null {{
  // Checagem inicial mais robusta
  if (!dateString || typeof dateString !== 'string') {{
    return null;
  }}

  const parts = dateString.split('/');
  if (parts.length !== 3) {{
    return null;
  }}

  // Usar parseInt explicitamente com base 10
  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const year = parseInt(parts[2], 10);

  // Checar se a conversão resultou em números válidos
  if (isNaN(day) || isNaN(month) || isNaN(year) || year < 1000 || year > 3000 || month < 1 || month > 12 || day < 1 || day > 31) {{
      return null;
  }}

  // Mês no objeto Date é 0-indexado (Janeiro=0, Dezembro=11)
  const dateObj = new Date(year, month - 1, day);

  // Validar se a data criada corresponde aos valores (evita datas inválidas como 31/02)
  if (dateObj.getFullYear() !== year || dateObj.getMonth() !== month - 1 || dateObj.getDate() !== day) {{
      return null;
  }}

  return dateObj;
}}


/**
 * Tenta converter um valor para float, tratando vírgula decimal e retornando 0.0 em caso de falha.
 */
export function parseFloatSafe(value: string | number | undefined): number {{
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {{
        // Remove R$, handle potential thousand separators (.) and decimal comma (,)
        
        // 1. Remove R$ and trim whitespace
        let cleanedValue = value.replace('R$', '').trim();
       
        // 2. Check if it contains a comma (likely Brazilian format)
        if (cleanedValue.includes(',')) {{
            // Remove dots (thousand separators), replace comma with dot (decimal)
            cleanedValue = cleanedValue.replace(/\./g, '').replace(',', '.');
        }}

        // 3. If no comma, assume dot is the decimal separator (or it's an integer)
        //    No replacement needed in this case, parseFloat handles it.
        //    We already removed R$ and trimmed.

        const number = parseFloat(cleanedValue);
        return isNaN(number) ? 0 : number;
    }}
    return 0;
}}

/**
 * Tenta converter um valor para int (base 10), retornando 0 em caso de falha.
 */
const parseIntSafe = (value: any): number => {{
    // Checa se é string e não vazia/inválida
    if (typeof value !== 'string' || value.trim() === '-' || value.trim() === '') {{
        return 0;
    }}

    // Garante que value é uma string antes de passar para parseInt
    const number = parseInt(String(value), 10);
    return isNaN(number) ? 0 : number;
}};

/**
 * Extrai o código base do ativo (ex: 'ITSA4' de 'ITSA4 - ITAUSA S.A.' ou 'ITSA4F').
 */
export function getAssetCode(productOrCode: string | null | undefined): string | null {{
    if (!productOrCode || typeof productOrCode !== 'string') {{
        return null;
    }}

    // Pega 4 letras maiúsculas seguidas por 1 ou mais dígitos no início da string
    const match = productOrCode.match(/^[A-Z]{{4}}\d+/);
    return match ? match[0] : null;
}}


// --- Funções Principais Convertidas ---

/**
 * Calcula o resumo anual de investimento com base em uma lista de transações simples (Compra/Venda).
 */
export function calcularResumoAnual(transacoes: TransacaoSimples[]): ResumoAnual[] {{

  // 2. Ordenar as transações por data (mais antiga para mais recente)
  transacoes.sort((a, b) => {{
      const dateA = parseDate(a['{FIELD_NEG_DATE}']);
      const dateB = parseDate(b['{FIELD_NEG_DATE}']);

      // Tratamento para datas nulas na ordenação
      if (!dateA && !dateB) 
        return 0;
      
      if (!dateA) 
        return 1; // Coloca nulos/inválidos no final
    
      if (!dateB) 
        return -1; // Coloca nulos/inválidos no final
    
      return dateA.getTime() - dateB.getTime(); // Compara milissegundos
  }});

  let totalQuantidade: number = 0;
  let valorTotalInvestido: number = 0.0;
  
  // Usar Record para tipar objetos usados como mapas (chave: ano, valor: ResumoAnual)
  const resumoAnual: Record<number, ResumoAnual> = {{}};
  
  // Evitar problemas com ponto flutuante e quantidade/valor negativo
  // Usar uma pequena tolerância (epsilon) para comparação com zero
  const epsilon = 0.0001; // Tolerância para comparação de ponto flutuante

  // 3. Iterar sobre as transações ordenadas
  for (const transacao of transacoes) {{
      const tipo = transacao['{FIELD_NEG_TYPE}'];

      // Usar as funções seguras de parse
      const quantidade = parseIntSafe(transacao['{FIELD_NEG_QUANTITY}']);
      const valor = parseFloatSafe(transacao['{FIELD_NEG_TOTAL_COST}']);
      const dataNegocio = transacao['{FIELD_NEG_DATE}'];
      const dateObject = parseDate(dataNegocio);

      // Pular transação se data ou valores numéricos forem inválidos
      if (!dateObject || quantidade <= 0 || valor < 0) {{
          console.warn(`Transação (simples) ignorada por dados inválidos: ${{JSON.stringify(transacao)}}`);
          continue;
      }}

      const ano = dateObject.getFullYear();

      // 4. Atualizar totais acumulados
      if (tipo === 'Compra') {{
          totalQuantidade += quantidade;
          valorTotalInvestido += valor;
      }} else if (tipo === '{NEG_TYPE_SELL}') {{
          // Para calcular o resumo do *investimento*, vendas reduzem a quantidade
          // e o custo proporcional. O lucro/prejuízo é outra análise.
          if (totalQuantidade > 0) {{
            // Calcular custo médio ANTES da venda ser efetivada  
            const custoMedioAntesVenda = valorTotalInvestido / totalQuantidade;
              
              // Garantir que não estamos vendendo mais do que temos
              const quantidadeRealVendida = Math.min(quantidade, totalQuantidade);
              const custoRealDaVenda = quantidadeRealVendida * custoMedioAntesVenda;

              if (quantidade > totalQuantidade) {{
                   console.warn(`Venda simples: Tentativa de venda de ${{quantidade}} quando havia ${{totalQuantidade}} em ${{dataNegocio}}. Vendendo ${{totalQuantidade}}.`);
              }}

              valorTotalInvestido -= custoRealDaVenda;
              totalQuantidade -= quantidadeRealVendida;

              if (totalQuantidade < epsilon) {{
                  totalQuantidade = 0;
                  valorTotalInvestido = 0; // Se zerou a quantidade, zera o custo
              }}

          }} else {{
              console.warn(`Venda simples ignorada pois não havia quantidade: ${{JSON.stringify(transacao)}}`);
          }}
      }} // Adicionar outros tipos se necessário (Bonificação, Desdobramento, etc.)

      // 5. Calcular preço médio atual (se houver quantidade)
      const precoMedioAtual = totalQuantidade > epsilon ? valorTotalInvestido / totalQuantidade : 0;

      // 6. Armazenar o estado no final daquele ano
      // A cada transação, atualizamos o estado para aquele ano.
      // A última atualização dentro de um ano representará o estado no fim daquele ano.
      resumoAnual[ano] = {{
          ano: ano,
          quantidadeFinal: totalQuantidade,
          // Arredondar ou formatar o preço médio pode ser útil na exibição, mas guardar o valor preciso aqui
          precoMedio: precoMedioAtual,
          totalInvestido: valorTotalInvestido
      }};
  }}

  // 7. Verificar e replicar dados para anos futuros sem movimentação
    const anosProcessadosSimples = Object.keys(resumoAnual).map(Number).sort((a, b) => a - b);

    if (anosProcessadosSimples.length > 0) {{ // Only proceed if there are any processed years
        const minAnoProcessadoSimples = anosProcessadosSimples[0];
        const maxAnoProcessadoSimples = anosProcessadosSimples[anosProcessadosSimples.length - 1];
        const anoAtualSimples = new Date().getFullYear();
        const anoFinalParaLoopSimples = Math.max(maxAnoProcessadoSimples, anoAtualSimples);

        let ultimoResumoValidoSimples = null;

        for (let anoIterSimples = minAnoProcessadoSimples; anoIterSimples <= anoFinalParaLoopSimples; anoIterSimples++) {{
            if (resumoAnual[anoIterSimples]) {{
                ultimoResumoValidoSimples = resumoAnual[anoIterSimples];
            }} else {{
                if (ultimoResumoValidoSimples && ultimoResumoValidoSimples.quantidadeFinal > epsilon) {{
                    resumoAnual[anoIterSimples] = {{
                        ...ultimoResumoValidoSimples,
                        ano: anoIterSimples
                    }};
                    console.log(`INFO (Simples): Replicando dados de ${{ultimoResumoValidoSimples.ano}} para ${{anoIterSimples}}.`);
                }} else {{
                     console.log(`INFO (Simples): Não replicando para ${{anoIterSimples}} pois último resumo (${{ultimoResumoValidoSimples?.ano}}) tinha qtd zero ou não existe.`);
                     ultimoResumoValidoSimples = null; // Reset chain
                }}
            }}
        }}
    }} else {{
       console.log("INFO (Simples): Nenhuma transação processada, resumo anual vazio.");
    }}

  // 8. Retornar os resumos anuais ordenados por ano (era passo 7)
  // Object.values retorna o tipo derivado do Record, que é ResumoAnual[]
  return Object.values(resumoAnual).sort((a, b) => a.ano - b.ano);
}}


/**
 * Calcula o resumo anual considerando transações (Compra/Venda) e eventos de proventos
 * que afetam a quantidade ou custo (Bonificação, Fração).
 */
export async function calcularResumoAnualComEventos(
    transactions: TransacaoBase[], // Usar a interface base mais genérica
    movements: Movement[],
    targetAssetCode: string // Parâmetro não utilizado na lógica atual do JS (comentada)
): Promise<ResumoAnual[]> {{

    // 1. Mapear e Padronizar Dados (Transações e Movimentos)
    const allEvents: CombinedEvent[] = [];

    transactions.forEach(t => {{
        const assetCode = getAssetCode(t['{FIELD_NEG_TICKER}']);
        /* Lógica comentada no JS original
        if (assetCode !== targetAssetCode && assetCode !== `${{targetAssetCode}}F`) {{
             // console.log(`Ignorando transação de outro ativo: ${{t['{FIELD_NEG_TICKER}']}}`);
             return; // Ignora outros ativos ou formatos não reconhecidos
        }}
        */

        const date = parseDate(t['{FIELD_NEG_DATE}']);
        if (!date) {{
            console.warn(`Transação ignorada por data inválida: ${{JSON.stringify(t)}}`);
            return; // Ignora se data inválida
        }}

        // Validar valores numéricos antes de adicionar
        const quantity = parseIntSafe(t['{FIELD_NEG_QUANTITY}']);
        const value = parseFloatSafe(t['{FIELD_NEG_TOTAL_COST}']); // Valor total da operação
        const price = parseFloatSafe(t['{FIELD_NEG_UNIT_PRICE}']); // Preço unitário

        // Compras/Vendas devem ter quantidade e valor/preço positivos
        // Permite preço 0, mas valor deve ser > 0 para custo. Quantidade deve ser > 0.
        if (quantity <= 0 || value < 0 ) {{ // Valor pode ser 0 em bonificação, mas não em compra. Preço pode ser 0.
             console.warn(`Transação ignorada por quantidade/valor inválido: Qtd=${{quantity}}, Valor=${{value}}, Preço=${{price}}. ${{JSON.stringify(t)}}`);
             return;
        }}


        allEvents.push({{
            date: date,
            eventType: t['{FIELD_NEG_TYPE}'], // Compra, Venda
            assetCode: assetCode, //t['{FIELD_NEG_TICKER}'] ?? null, // Usar o código original, ou null
            quantity: quantity,
            value: value,
            price: price, // Adicionado para referência, cálculo usa '{FIELD_NEG_TOTAL_COST}'
            source: 'transaction'
            // direction é undefined aqui
        }});
    }});

    // 1. Mapear e Padronizar Dados (Movimentos Relevantes)
    // Use for...of loop to handle async/await correctly when fetching factors
    for (const m of movements) {{
        const assetCode = getAssetCode(m['{FIELD_MOV_TICKER}']);
        if (!assetCode || !assetCode.startsWith(targetAssetCode)) {{ // Lógica comentada no JS
            // console.log(`Ignorando movimento de outro produto: ${{m['{FIELD_MOV_TICKER}']}}`);
            continue; // Ignora eventos de outros produtos ou sem código válido
        }}

        const date = parseDate(m['{FIELD_MOV_DATE}']);
        if (!date) {{
             console.warn(`Movimento ignorado por data inválida: ${{JSON.stringify(m)}}`);
             continue; // Ignora se data inválida
        }}

        const eventType = m['{FIELD_MOV_TYPE}'];

        // Garantir que direction seja um dos tipos esperados ou tratar como string genérica
        const direction: 'Credito' | 'Debito' | string = m['{FIELD_MOV_DIRECTION}'];
        // Quantidade em movimentos PODE ser float (ex: bonificação)
        const quantity = parseFloatSafe(m['{FIELD_NEG_QUANTITY}']); // Pode ser fracionado

         // Quantidade deve ser positiva
         if (quantity <= 0) {{
             console.warn(`Movimento ignorado por quantidade inválida (${{quantity}}): ${{JSON.stringify(m)}}`);
             continue; // Skip to next movement
         }}

        // Filtra eventos NÃO relevantes para quantidade/custo (serão ignorados no mapeamento)
        const irrelevantMovements: string[] = [
            //"Fração em Ativos", // Decidimos processar Fração
            "Dividendo",
            "Juros sobre Capital Próprio",
            "Rendimento",
         
            "Cessão de Direitos - Não Exercido",
            "Cessão de Direitos",
            "Direito de Subscrição",
            "Direito de Subscrição - Não Exercido",
            "Direitos de Subscrição",
            "Direitos de Subscrição - Não Exercido",

            "Direito de Subscrição - Exercido", // Ignorando esses eventos porque a B3 já adionou esse evento como "Compra"
            "Direitos de Subscrição - Exercido", // Ignorando esses eventos porque a B3 já adionou esse evento como "Compra"
            "Cessão de Direitos - Solicitada", // Ignorando esses eventos porque a B3 já adionou esse evento como "Compra"

            "Leilão de Fração", // Geralmente informa o valor recebido, não muda custo/qtd antes
            "Leilão", // Similar ao anterior
            "Empréstimo" // Explicitly ignore loans
            // Add others to ignore if needed
        ];

        // Filter events NOT relevant for quantity/cost calculation in this helper
        if (irrelevantMovements.includes(eventType)) {{
             // console.log(`Helper ignorando evento não relevante para qtd/custo: ${{eventType}} em ${{date.toLocaleDateString('pt-BR')}}`);
             continue; // Skip events like Dividend, JCP, etc.
        }}
        
        // Process only Bonificação, Desdobramento, Grupamento, Fração, and new event types here
        const quantityCostEvents = [
            "Bonificação em Ativos",
            "Bonificação em ações",
            "Desdobramento",
            "Desdobro",
            "Grupamento",
            "Atualização",

            "Direito de Subscrição - Exercido",
            "Direitos de Subscrição - Exercido",
            "Cessão de Direitos - Solicitada",

            "Fração em Ativos", // Ensure we process fractions
            "Fraao em Ativos",
            "Fraao em Ativos"
        ];

        // This check might be redundant now due to the irrelevantMovements filter,
        // but kept for clarity/safety.
        if (!quantityCostEvents.includes(eventType)) {{
            console.warn(`Helper: Evento ${{eventType}} em ${{date.toLocaleDateString('pt-BR')}} passou pelo filtro inicial mas não está na lista quantityCostEvents.`);
            continue; // Skip to next movement
        }}

        let factor = 1; // Fator padrão

        // Se for Desdobramento ou Grupamento, busca o fator e valida
        if (eventType === "Desdobramento" || eventType === "Desdobro" || eventType === "Grupamento") {{
            if (m['{FIELD_NEG_FACTOR}']) {{ // Verifica se o campo '{FIELD_NEG_FACTOR}' existe
                const parsedFactor = parseFloatSafe(m['{FIELD_NEG_FACTOR}']);
                if (parsedFactor > 0) {{
                    factor = parsedFactor;
                    // Para estes eventos, a quantidade explícita no JSON original pode não ser relevante
                    // A mudança na quantidade será calculada usando o fator sobre a posição atual
                    //quantity = 0; // Anula a quantidade lida se o fator for válido
                }} else {{
                    console.warn(`Fator inválido para ${{eventType}} em ${{m['{FIELD_MOV_DATE}']}}: ${{m['Fator']}}. Evento será ignorado.`);
                    continue; // Pula evento se fator for inválido
                }}
            }} else {{
                // Tentar buscar fator externo (mockado aqui) - await works correctly in for...of
                const staticFactor = await mockStaticEventInfoProvider.getEventFactor(assetCode, eventType, date);
                if (!staticFactor)
                {{
                    // Fator é OBRIGATÓRIO para Desdobramento/Grupamento
                    console.error(`ERRO: ${{eventType}} em ${{m['{FIELD_MOV_DATE}']}} não possui o campo '{FIELD_NEG_FACTOR}' especificado nem foi encontrado externamente! Evento será ignorado.`);
                    continue; // Pula evento se fator estiver faltando
                }}

                factor = staticFactor;
            }}
        }}

        // Push the event after potentially awaiting the factor
        allEvents.push({{
            date: date,
            eventType: eventType,
            assetCode: assetCode, // Usa o código base parseado
            quantity: quantity, // Quantidade lida (relevante para Bonificação/Fração) ou 0 (para Desd./Grup.)
            factor: factor, // Fator (relevante para Desd./Grup.) - now correctly awaited
            direction: direction, // Credito/Debito é importante
            source: 'movement'
            // value e price são undefined aqui
        }});
    }}

    // --- Inject missing events from external provider (similar to AssetProcessor) ---
    const externalEvents = await mockStaticEventInfoProvider.getEventsForAsset(targetAssetCode);
    for (const extEvent of externalEvents) {{
        // Check if this event already exists in allEvents
        // Use a window of ±5 days to avoid duplicates if dates are slightly different
        const alreadyExists = allEvents.some(
          e =>
            (e.eventType === extEvent.type || (e.eventType === 'Bonificação em Ativos' && extEvent.type === 'Bonificação em ações') || (e.eventType === 'Bonificação em ações' && extEvent.type === 'Bonificação em Ativos')) &&
            Math.abs(e.date.getTime() - extEvent.date.getTime()) <= 5 * 24 * 60 * 60 * 1000
        );

        if (!alreadyExists) {{
            console.log(`Helper: Injecting missing ${{extEvent.type}} for ${{targetAssetCode}} on ${{extEvent.date.toLocaleDateString()}}`);
            allEvents.push({{
                date: extEvent.date,
                eventType: extEvent.type,
                assetCode: targetAssetCode,
                quantity: extEvent.quantity || 0,
                factor: extEvent.factor || 1,
                direction: 'Credito', // Assuming credit for injected events like bonus/split
                source: 'movement'
            }});
        }}
    }}

    // 2. Ordenar todos os eventos por data
    allEvents.sort((a, b) => {{
      if (a.date.getTime() !== b.date.getTime()) {{
        return a.date.getTime() - b.date.getTime();
      }}
    
      // Se as datas forem iguais, priorizar Venda/Fração (Débito) antes de Compra/Bonificação (Crédito)
      // Isso ajuda a evitar vender/debitar antes de uma compra/bonificação no mesmo dia
      const priority: Record<string, number> = {{
          'Venda': 1,
          'Fração em Ativos': 2, // Processar fração antes de outros créditos no mesmo dia
         
          'Cessão de Direitos - Solicitada': 2, // Também é um débito, mesma prioridade da fração
          'Direito de Subscrição - Exercido': 2, // Crédito, mesma prioridade da bonificação
          'Direitos de Subscrição - Exercido': 2, // Crédito, mesma prioridade da bonificação
        
          'Compra': 3,
          'Bonificação em Ativos': 4,
          'Bonificação em ações': 4,
          'Atualização': 4, // Crédito, mesma prioridade da bonificação
          'Desdobramento': 5,
          'Desdobro': 5,
          'Grupamento': 5
      }};
      
      const priorityA = priority[a.eventType] || 99;
      const priorityB = priority[b.eventType] || 99;
      return priorityA - priorityB;
    }});


    // 3. Calcular Posição Anual
    let totalQuantity: number = 0.0; // Usar float por causa das frações/bonificações
    let baseQuantity: number = 0.0; // Memória histórica da base de custo para o Preço Médio
    let valorTotalInvestido: number = 0.0;
    const resumoAnual: Record<number, ResumoAnual> = {{}};
    const epsilon = 0.0001; // Tolerância para comparação de ponto flutuante

    let lastEventDate = null; // Para depuração


    // --- ADDED FOR DUPLICATE CHECK ---
    const duplicateCheckEventTypes = [
        'Atualização', 
        'Direito de Subscrição', 
        'Direito de Subscrição - Exercido', 
        'Direitos de Subscrição - Exercido', 
        'Cessão de Direitos - Solicitada'
    ];
    const duplicateTimeWindowDays = 20; // Configurable window (e.g., 20 days)
    const dayInMs = 24 * 60 * 60 * 1000;
    const lastSeenEventTimestamp = new Map<string, Date>(); // Map<assetCode-eventType-quantity, lastProcessedDate>
    // --- END ADDED ---

    for (const event of allEvents) {{
        // --- ADDED TIME-WINDOW DUPLICATE CHECK ---
        let isDuplicate = false;
        if (duplicateCheckEventTypes.includes(event.eventType) && event.assetCode) {{
            const eventKey = `${{event.assetCode}}-${{event.eventType}}-${{event.quantity}}`;
            const lastTimestamp = lastSeenEventTimestamp.get(eventKey);
    
            if (lastTimestamp) {{
                const timeDifference = event.date.getTime() - lastTimestamp.getTime();
                const daysDifference = timeDifference / dayInMs;
    
                // Check if the current event is within the window *after* the last processed one
                if (daysDifference >= 0 && daysDifference <= duplicateTimeWindowDays) {{
                     console.warn(`DUPLICATE SKIPPED (within ${{duplicateTimeWindowDays}} days): Evento ${{event.eventType}} em ${{event.date.toLocaleDateString('pt-BR')}} (Qtd: ${{event.quantity}}, Key: ${{eventKey}}) é similar a um evento processado em ${{lastTimestamp.toLocaleDateString('pt-BR')}}.`);
                     isDuplicate = true;
                }}
            }}
        }}
        
        if (isDuplicate) {{
            // Update the timestamp map even for skipped duplicates to handle sequences correctly
            if (duplicateCheckEventTypes.includes(event.eventType) && event.assetCode) {{
                 const eventKey = `${{event.assetCode}}-${{event.eventType}}-${{event.quantity}}`;
                 lastSeenEventTimestamp.set(eventKey, event.date);
            }}
            continue; // Skip processing this duplicate event
        }}
        // --- END DUPLICATE CHECK ---

        const ano = event.date.getFullYear();
        // Calcular preço médio ANTES de processar o evento atual usando nossa base de memória
        const currentAveragePriceBeforeEvent = (baseQuantity > epsilon) ? valorTotalInvestido / baseQuantity : 0;

        // Debug Log (opcional)
        console.log(`{TEMPLATE_NEW_LINE}Processando ${{event.source}}: ${{event.eventType}} em ${{event.date.toLocaleDateString('pt-BR')}} (Data anterior: ${{lastEventDate ? lastEventDate.toLocaleDateString('pt-BR') : 'N/A'}})`);
        console.log(`Antes: Qtd=${{totalQuantity.toFixed(4)}}, CustoTotal=${{valorTotalInvestido.toFixed(4)}}, PrecoMedio=${{currentAveragePriceBeforeEvent.toFixed(4)}}`);
        console.log(`Evento: Qtd=${{event.quantity}}, Valor=${{event.value}}, Preço=${{event.price}}, Fator=${{event.factor}}, Direção=${{event.direction}}`);

        switch (event.eventType) {{
            case 'Compra':
                // Checa se 'value' existe e é positivo (vem de 'transaction')
                if (event.source === 'transaction' && event.quantity > 0 && event.value !== undefined && event.value >= 0) {{ // Permitir valor 0?
                    totalQuantity += event.quantity;
                    baseQuantity += event.quantity; // Adiciona na memória base
                    valorTotalInvestido += event.value; // Usa o valor total da transação
                }} else {{
                    console.warn("Compra inválida ou sem valor ignorada:", event);
                }}
                break;

            case '{NEG_TYPE_SELL}':
                if (event.source === 'transaction' && event.quantity > 0) {{
                    if (totalQuantity >= event.quantity - epsilon) {{ // Permite pequena margem de erro
                        const custoDaVenda = event.quantity * currentAveragePriceBeforeEvent;
                        valorTotalInvestido -= custoDaVenda;
                        totalQuantity -= event.quantity;
                        baseQuantity -= event.quantity; // Deduz da memória base
                    }} else {{
                        console.warn(`Tentativa de venda de ${{event.quantity}} quando havia apenas ${{totalQuantity.toFixed(4)}} em ${{event.date.toLocaleDateString('pt-BR')}}. Zerando posição.`);
                        valorTotalInvestido = 0;
                        totalQuantity = 0;
                        baseQuantity = 0;
                    }}

                    // Prevenir valores negativos por imprecisão de float
                    if (totalQuantity < epsilon) {{
                        totalQuantity = 0;
                        baseQuantity = 0;
                        valorTotalInvestido = 0; // Zera custo se quantidade for zero
                    }}
                }} else {{
                    console.warn("Venda inválida ou sem quantidade ignorada:", event);
                }}
                break;

            case 'Bonificação em Ativos':
            case 'Bonificação em ações':
                if (event.source === 'movement') {{
                    const oldQuantity = totalQuantity;
                    
                    if (event.factor && event.factor > 1) {{
                        totalQuantity *= event.factor;
                    }} else if (event.quantity && event.quantity > 0) {{
                        totalQuantity += event.quantity;
                    }}

                    const addedQuantity = totalQuantity - oldQuantity;
                    if (addedQuantity > 0) {{
                        // BONIFICAÇÃO NÃO ALTERA CUSTO TOTAL NEM PREÇO MÉDIO
                        // O Custo Total permanece igual e o Preço Médio usando a memória base
                        // também se mantém estável, pois a bonificação não altera baseQuantity.
                        // Para este helper, apenas aumentamos a quantidade total.
                        console.info(`[BONUS] ${{event.assetCode}} +${{addedQuantity.toFixed(4)}} shares. PM and TotalCost remained stable.`);
                    }}
                }}
                break;

            case 'Fração em Ativos':
            case 'Fraao em Ativos':
            case 'Fraao em Ativos':
                if (event.source === 'movement' && event.quantity > 0) {{
                    const priceBefore = (baseQuantity > 0.0001) ? valorTotalInvestido / baseQuantity : 0;
                    const quantityToRemove = event.quantity;
                    if (totalQuantity >= quantityToRemove - 0.0001) {{
                        // REMOVE CUSTO PROPORCIONAL PARA MANTER O PREÇO MÉDIO ESTÁVEL
                        const costToRemove = quantityToRemove * priceBefore;
                        valorTotalInvestido -= costToRemove;
                        totalQuantity -= quantityToRemove;
                        baseQuantity -= quantityToRemove; // Deduz na memória base
                        console.info(`[FRACTION] ${{event.assetCode}} -${{quantityToRemove.toFixed(4)}} shares. Removed cost R$ ${{costToRemove.toFixed(2)}} based on PM R$ ${{priceBefore.toFixed(4)}}`);
                    }}
                }}
                break;

            case 'Desdobramento': // Ex: fator 2 (1 vira 2)
            case 'Desdobro':
                   if (event.source === 'movement' && event.factor !== undefined && event.factor > 1) {{
                      // Multiplica a quantidade pelo fator. Custo total permanece. Preço médio diminui.
                      // console.info(`Aplicando Desdobramento: Qtd antes=${{totalQuantity.toFixed(4)}}, Fator=${{event.factor}}, Data=${{event.date.toLocaleDateString('pt-BR')}}`);
                      totalQuantity *= event.factor;
                      baseQuantity *= event.factor; // Dilui a base também
                      // console.info(` -> Qtd depois=${{totalQuantity.toFixed(4)}}`);
                      // Custo total não muda, preço médio é recalculado
                   }} else {{
                        console.warn(`Desdobramento inválido/ignorado:`, event);
                   }}
                 break;
            case 'Grupamento': // Ex: fator 10 (10 viram 1)
                 if (event.source === 'movement' && event.factor !== undefined && event.factor > 1) {{
                    // Divide a quantidade pelo fator. Custo total permanece. Preço médio aumenta.
                    // console.info(`Aplicando Grupamento: Qtd antes=${{totalQuantity.toFixed(4)}}, Fator=${{event.factor}}, Data=${{event.date.toLocaleDateString('pt-BR')}}`);

                    totalQuantity /= event.factor;
                    baseQuantity /= event.factor; // Agrupa a base para aumentar o PM calculado

                    // console.info(` -> Qtd depois=${{totalQuantity.toFixed(4)}}`);
                    // Custo total não muda, preço médio é recalculado
                    // NOTA: Grupamentos podem gerar frações que serão tratadas por eventos "Fração em Ativos" subsequentes.

                  }} else {{
                        console.warn(`Grupamento inválido/ignorado:`, event);
                   }}
                 break;

            case 'Atualização':
            case 'Direito de Subscrição':
            case 'Direito de Subscrição - Exercido':
            case 'Direitos de Subscrição - Exercido':
            case 'Cessão de Direitos - Solicitada':
                // Estes eventos aumentam a quantidade e podem ajustar o custo com base no preço médio
                if (event.source === 'movement' && event.quantity > 0) {{
                    // Buscar o preço médio do evento
                    let averagePrice = null;
                    if (event.assetCode) {{ // Verificar se assetCode não é null
                        averagePrice = await mockStaticEventInfoProvider.getSpecialEventAveragePrice(
                            event.assetCode, 
                            event.eventType, 
                            event.date
                        );
                    }}
                    
                    // Se tiver preço médio, ajustar o custo
                    if (averagePrice !== null) {{
                        if (averagePrice > 0) {{
                            // Adicionar a quantidade
                            totalQuantity += event.quantity;
                            baseQuantity += event.quantity; // Adiciona a base pois gerou custo

                            const addedCost = event.quantity * averagePrice;
                            valorTotalInvestido += addedCost;
                            console.info(`Aplicando ${{event.eventType}}: Qtd adicionada=${{event.quantity.toFixed(4)}}, Preço=${{averagePrice.toFixed(4)}}, Custo adicionado=${{addedCost.toFixed(4)}}, Data=${{event.date.toLocaleDateString('pt-BR')}}`);
                        }} else {{
                            // Se tiver preço 0 (merger/rename), apenas adiciona a quantidade sem custo (como bonificação)
                            totalQuantity += event.quantity;
                            // Aumentamos a baseQuantity para manter o preço médio consistente em caso de renomeio 1:1
                            baseQuantity += event.quantity;
                            console.info(`Aplicando ${{event.eventType}} (preço 0): Qtd adicionada=${{event.quantity.toFixed(4)}}, Base Qtd aumentada, Sem custo adicional (preservando custo existente), Data=${{event.date.toLocaleDateString('pt-BR')}}`);
                        }}
                    }} else if (event.eventType === 'Atualização') {{
                        console.log(`Helper: Ignorando 'Atualização' para ${{event.assetCode}} pois não há preço estático (provável repetição de saldo) em ${{event.date.toLocaleDateString('pt-BR')}}`);
                    }} else {{
                        // Se não for Atualização mas não tiver preço, tratamos como bonificação (histórico)
                        totalQuantity += event.quantity;
                        console.info(`Aplicando ${{event.eventType}} (sem preço): Qtd adicionada=${{event.quantity.toFixed(4)}}, Sem custo adicional, Data=${{event.date.toLocaleDateString('pt-BR')}}`);
                    }}
                }} else {{
                    console.warn(`${{event.eventType}} inválido/sem crédito ignorado:`, event);
                }}
                break;

            default:
                // Ignora outros tipos filtrados anteriormente
                console.log(`Evento ignorado por tipo não tratado no switch: ${{event.eventType}}`);
                break;
        }}

        // Recalcular preço médio APÓS o evento usando a memória base
        const precoMedioAtual = (baseQuantity > epsilon) ? valorTotalInvestido / baseQuantity : 0;

        // Clamp valor total investido para não ser negativo devido a erros de float
        if (valorTotalInvestido < 0 && valorTotalInvestido > -epsilon) {{
            valorTotalInvestido = 0;
        }} else if (valorTotalInvestido < -epsilon) {{
             console.warn(`Custo total ficou negativo (${{valorTotalInvestido.toFixed(4)}}) após evento em ${{event.date.toLocaleDateString('pt-BR')}}. Revise a lógica ou dados.`);
             // Por segurança, clamp para zero para não quebrar matemática futura
             valorTotalInvestido = 0;
        }}

        // Zera custo explicitamente se quantidade for zero
        if (totalQuantity < epsilon) {{
            totalQuantity = 0; // Garante que seja exatamente 0
            baseQuantity = 0;
            valorTotalInvestido = 0;
        }}

        // Debug Log (opcional)
        // console.log(`Depois: Qtd=${{totalQuantity.toFixed(4)}}, CustoTotal=${{valorTotalInvestido.toFixed(4)}}, PrecoMedio=${{precoMedioAtual.toFixed(4)}}`);
        // console.log('---')

        // Armazena o estado final após o processamento do evento para aquele ano
        resumoAnual[ano] = {{
            ano: ano,
            // Arredondar a quantidade final pode fazer sentido dependendo do ativo
            quantidadeFinal: totalQuantity, // Ou: parseFloat(totalQuantity.toFixed(8)) para limitar casas decimais
            precoMedio: precoMedioAtual,
            totalInvestido: valorTotalInvestido
        }};

        lastEventDate = event.date; // Guarda a data para depuração da ordem

        // --- UPDATE LAST SEEN TIMESTAMP (AFTER PROCESSING) ---
        // Update the timestamp only *after* successfully processing the event
        if (duplicateCheckEventTypes.includes(event.eventType) && event.assetCode) {{
             const eventKey = `${{event.assetCode}}-${{event.eventType}}-${{event.quantity}}`;
             lastSeenEventTimestamp.set(eventKey, event.date);
        }}
        // --- END UPDATE ---
    }}

    // 4. Fill gaps and replicate data for missing years
    const anosProcessados = Object.keys(resumoAnual).map(Number).sort((a, b) => a - b);

    if (anosProcessados.length > 0) {{ // Only proceed if there are any processed years
        const minAnoProcessado = anosProcessados[0];
        const maxAnoProcessado = anosProcessados[anosProcessados.length - 1];
        const anoAtual = new Date().getFullYear();
        const anoFinalParaLoop = Math.max(maxAnoProcessado, anoAtual); // Ensure we loop at least up to the current year or the last processed year

        let ultimoResumoValido = null; // Keep track of the last valid summary to replicate from

        for (let anoIter = minAnoProcessado; anoIter <= anoFinalParaLoop; anoIter++) {{
            if (resumoAnual[anoIter]) {{
                // Year exists, update the last known valid summary
                // Importantly, check if quantity is positive before marking as valid for replication
                if (resumoAnual[anoIter]) {{
                    ultimoResumoValido = resumoAnual[anoIter];
                }} else {{
                    // If quantity is zero, this year exists but cannot be used to replicate forward
                    ultimoResumoValido = null; // Reset
                }}
            }} else {{
                // Year is missing (a gap or a future year)
                if (ultimoResumoValido) {{ // Check if we have a valid previous year to replicate from
                    // Replicate from the last valid summary
                    resumoAnual[anoIter] = {{
                        ...ultimoResumoValido,
                        ano: anoIter
                    }};
                    console.log(`INFO: Replicando dados de ${{ultimoResumoValido.ano}} para ${{anoIter}} (gap ou ano futuro).`);
                    // Keep ultimoResumoValido as is, so it can be used for the next missing year
                }} else {{
                     // If there's no valid previous summary (either first year or after a zero quantity year), we can't replicate
                     console.log(`INFO: Não replicando para ${{anoIter}} pois não há resumo anterior válido com quantidade positiva.`);
                     // Do not create the entry for this missing year
                }}
            }}
        }}
    }} else {{
         console.log("INFO: Nenhum evento processado, resumo anual vazio.");
    }}

    // 5. Retornar os resumos anuais ordenados por ano
    return Object.values(resumoAnual).sort((a, b) => a.ano - b.ano);
}}


/**
* Calcula o resumo de vendas anual considerando transações (Compra/Venda).
*/
export function calcularVendasDoAno(transactions: TransacaoBase[], selectedYear: number): ResumoVendasAnual[] {{

    const expectedSoldTransactions = transactions.filter(
        r => r['{FIELD_NEG_TYPE}'] === 'Venda' && // Filter for 'Dividendos'
            parseDate(r['{FIELD_NEG_DATE}'])?.getFullYear() === selectedYear
    );

    const monthlySoldsMap = new Map<number, object[]>();

    for (const soldTransaction of expectedSoldTransactions) {{
        const currentSoldMonth = (parseDate(soldTransaction['Data do Negócio'])?.getMonth() ?? 0) + 1;

        if (!monthlySoldsMap.has(currentSoldMonth)) {{
            monthlySoldsMap.set(currentSoldMonth, []);
        }}

        const currentMonthSold = monthlySoldsMap.get(currentSoldMonth)!;
        currentMonthSold.push(soldTransaction);
    }}

    const monthlyResults = Array.from(monthlySoldsMap.entries()).map(
        ([month, transactions]: [number, any[]]) => {{
            const total = transactions.reduce((sum, r) => sum + parseFloatSafe(r['Valor']), 0);

            return {{ month, total }}; 
    }});

    return monthlyResults;
}}



export function printSummaryPosition(resumo: ResumoAnual[], title: string): void {{
    let resumoAnualOutputText = `${{title}}{TEMPLATE_NEW_LINE}`;
    resumoAnualOutputText += "==================================={TEMPLATE_NEW_LINE}{TEMPLATE_NEW_LINE}";

    resumo.forEach(anual => {{
        resumoAnualOutputText += `Ano: ${{anual.ano}}{TEMPLATE_NEW_LINE}`;
        resumoAnualOutputText += `  Quantidade Final: ${{anual.quantidadeFinal.toLocaleString('pt-BR', {{ minimumFractionDigits: 2, maximumFractionDigits: 2 }})}}{TEMPLATE_NEW_LINE}`;
        resumoAnualOutputText += `  Preço Médio: R$ ${{anual.precoMedio.toLocaleString('pt-BR', {{ minimumFractionDigits: 2, maximumFractionDigits: 4 }})}}{TEMPLATE_NEW_LINE}`; // Formata para 2 casas decimais
        resumoAnualOutputText += `  Total Investido Acumulado: R$ ${{anual.totalInvestido.toLocaleString('pt-BR', {{ minimumFractionDigits: 2, maximumFractionDigits: 2 }})}}{TEMPLATE_NEW_LINE}`; // Formata para 2 casas decimais
    }});

    console.log(resumoAnualOutputText);
}}
"""
    # --- End Template ---

    output_calculation_helper_test_path = Path(test_dir)
    output_calculation_helper_test_path.mkdir(parents=True, exist_ok=True)

    with open(test_calculation_helper_file_path, 'w', encoding='utf-8') as f:
        f.write(template)

    print(f"Generated calculation helper test file: {test_calculation_helper_file_path}")



def generate_jest_test_file(ticker: str, test_dir: str, history_dir_relative: str):
    """Generates a Jest test file for a given ticker, including expected counts."""

    test_file_path = Path(test_dir) / f"{ticker}.test.ts" # Use .ts extension

    history_dir_relative_posix = history_dir_relative.replace('\\', '/') # Ensure posix paths for imports

    # --- Jest Test File Template ---
    template = f"""// Generated by scripts/generate_asset_tests.py

import {{ 
    mockExternalTickerInfoProvider,
    mockStaticEventInfoProvider,
    mockB3FileParser,
    mockTaxPayerInfo,

    calcularResumoAnual,
    calcularResumoAnualComEventos,
    calcularVendasDoAno,
    ResumoAnual,

    printSummaryPosition,
    
    parseFloatSafe,
    parseDate
}} from './calculation_helper';

import {{ AssetProcessor }} from '../../AssetProcessor';
import {{ DBKFileGenerator }} from '../../DBKFileGenerator';
import {{ IRPFDeclaration }} from '../../../../core/domain/IRPFDeclaration';


import transactionsData from './{history_dir_relative_posix}/{ticker}_transactions.json';
import movementsData from './{history_dir_relative_posix}/{ticker}_movements.json';

const DECLARATION_YEAR = {DECLARATION_YEAR};
const includeInitialPosition = true;

const defaultResumoComEventos: ResumoAnual = {{
    ano: 0,
    quantidadeFinal: 0,
    precoMedio: 0,
    totalInvestido: 0
}};

const resumo: ResumoAnual[] = calcularResumoAnual(transactionsData);
const resumoDoAnoEsperado: ResumoAnual = resumo.find(dado => dado.ano == DECLARATION_YEAR) ?? defaultResumoComEventos;

// It will be loaded in Async method
let expectedResumoComEventos: ResumoAnual[] = [];
let expectedResumoComEventosDoAnoEsperado: ResumoAnual;
let expectedResumoComEventosDoAnoAnteriorEsperado: ResumoAnual;


const expectedSoldMonthlyResults = calcularVendasDoAno(transactionsData, DECLARATION_YEAR);

const expectedDividends = (movementsData as any[])
    .filter(m => m['{FIELD_MOV_TYPE}']?.startsWith('{MOV_TYPE_DIVIDEND}') && parseDate(m['{FIELD_MOV_DATE}'])?.getFullYear() === DECLARATION_YEAR)
    .reduce((sum, m) => sum + parseFloatSafe(m['{FIELD_MOV_TOTAL_COST}']), 0);

const expectedJCP = (movementsData as any[])
    .filter(m => m['{FIELD_MOV_TYPE}'] === '{MOV_TYPE_JCP}' && parseDate(m['{FIELD_MOV_DATE}'])?.getFullYear() === DECLARATION_YEAR)
    .reduce((sum, m) => sum + parseFloatSafe(m['{FIELD_MOV_TOTAL_COST}']), 0);

const expectedTotalDividends = (movementsData as any[])
    .filter(r => r['{FIELD_MOV_TYPE}']?.startsWith('{MOV_TYPE_FII_INCOME}') && parseDate(r['{FIELD_MOV_DATE}'])?.getFullYear() === DECLARATION_YEAR)
    .reduce((sum, r) => sum + parseFloatSafe(r['{FIELD_MOV_TOTAL_COST}']), 0);


describe('{ticker} Asset Calculation and DBK Generation', () => {{
  let assetProcessor: AssetProcessor;
  let dbkGenerator: DBKFileGenerator;
  let declaration: IRPFDeclaration; // To store result from DBKFileGenerator

  beforeAll(async () => {{
    // Instantiate with mock
    assetProcessor = new AssetProcessor(mockStaticEventInfoProvider);
    dbkGenerator = new DBKFileGenerator(mockExternalTickerInfoProvider);

    // Map the data using helper functions
    const parsedTransactions = mockB3FileParser.parseNegotiationData(transactionsData);
    const parsedMovementsData = mockB3FileParser.parseMovementData(movementsData);

    console.log(`Processing {ticker} with ${{transactionsData.length}} raw transactions and ${{movementsData.length}} raw movements...`);

    try {{
        expectedResumoComEventos = await calcularResumoAnualComEventos(transactionsData, movementsData, '{ticker}');
        expectedResumoComEventosDoAnoEsperado = expectedResumoComEventos.find(dado => dado.ano == DECLARATION_YEAR) ?? defaultResumoComEventos;
        expectedResumoComEventosDoAnoAnteriorEsperado = expectedResumoComEventos.find(dado => dado.ano == DECLARATION_YEAR - 1) ?? defaultResumoComEventos;

        const processedDataSummary = await assetProcessor.analyzeTransactionsAndSpecialEvents(parsedTransactions, parsedMovementsData, DECLARATION_YEAR, includeInitialPosition);

        declaration = await dbkGenerator.generateDeclaration(
            processedDataSummary,
            mockTaxPayerInfo,
            DECLARATION_YEAR
        );
    }} catch (error) {{
        console.error("Error during test setup:", error);
        // Throw error to fail the test suite if setup fails
        throw error;
    }}

    console.log(`{ticker} processing and declaration generation complete.`);

    printSummaryPosition(resumo, "Resumo Anual da Posição");
    printSummaryPosition(expectedResumoComEventos, "Resumo Anual da Posição (incluindo eventos)");
    console.log(`Generated Declaration`, JSON.stringify(declaration, null, 2));
  }});

  
   test('calculation_helper: just checking last/recently calculated final Asset Position', () => {{
    const currentYear = new Date().getFullYear();

    const resumoDoUltimoAnoEsperado = resumo.find(dado => dado.ano == currentYear) ?? defaultResumoComEventos;
    const expectedResumoComEventosDoUltimoAnoEsperado = expectedResumoComEventos.find(dado => dado.ano == currentYear) ?? defaultResumoComEventos; 

    // Se houver eventos, a quantidade final pode ser diferente (ex: bonificação, split)
    // Então só comparamos se forem iguais ou se permitimos a diferença
    if (resumoDoUltimoAnoEsperado.quantidadeFinal === expectedResumoComEventosDoUltimoAnoEsperado?.quantidadeFinal) {{
        expect(expectedResumoComEventosDoUltimoAnoEsperado?.quantidadeFinal).toBeCloseTo(resumoDoUltimoAnoEsperado.quantidadeFinal, 4);
        expect(expectedResumoComEventosDoUltimoAnoEsperado.totalInvestido).toBeCloseTo(resumoDoUltimoAnoEsperado.totalInvestido, 2);
    }} else {{
        console.log(`Diferença aceitável detectada devido a eventos: Simples=${{resumoDoUltimoAnoEsperado.quantidadeFinal}}, Com Eventos=${{expectedResumoComEventosDoUltimoAnoEsperado?.quantidadeFinal}}`);
        expect(expectedResumoComEventosDoUltimoAnoEsperado?.quantidadeFinal).toBeGreaterThan(0);
    }}
  }});

  // --- AssetProcessor Tests ---
  test('AssetProcessor: should calculate final Asset Position correctly', () => {{
    expect(declaration).toBeDefined();
    expect(declaration?.assetPositions).toBeDefined();

    // Use optional chaining and provide a default value for find
    const finalPosition = declaration.assetPositions?.find(p => p.assetCode?.startsWith('{ticker}'));

    if (finalPosition) {{
        expect(finalPosition?.quantity).toBeCloseTo(expectedResumoComEventosDoAnoEsperado.quantidadeFinal, 4);
        
        // Compare total cost (Situação em 31/12) instead of average price directly
        expect(finalPosition?.totalCost).toBeCloseTo(expectedResumoComEventosDoAnoEsperado.totalInvestido, 2);
        
        expect(finalPosition?.averagePrice).toBeCloseTo(expectedResumoComEventosDoAnoEsperado.precoMedio, 4);
   }} else {{
        expect(expectedResumoComEventosDoAnoEsperado.quantidadeFinal).toBeCloseTo(0, 2);
    }}
  }});

   test('AssetProcessor: should extract Exempt Income Records correctly', () => {{
    expect(declaration?.incomeRecords).toBeDefined();

    // Check extracted exempt income records
    const actualDividends = declaration.incomeRecords
        .filter(r => (r.incomeType.startsWith('{MOV_TYPE_DIVIDEND}') || r.incomeType.startsWith('{MOV_TYPE_FII_INCOME}')) && r.date.getFullYear() === DECLARATION_YEAR)
        .reduce((sum, r) => sum + (r.netValue || r.grossValue || 0), 0);

    const expectedTotalIsentos = expectedDividends + expectedTotalDividends;
    expect(actualDividends).toBeCloseTo(expectedTotalIsentos, 2);
  }});

  test('AssetProcessor: should extract Income Records correctly', () => {{
    expect(declaration?.incomeRecords).toBeDefined();

    // Check extracted income records
    const actualJCP = declaration.incomeRecords
        .filter(r => r.incomeType === '{MOV_TYPE_JCP}' && r.date.getFullYear() === DECLARATION_YEAR)
        .reduce((sum, r) => sum + (r.netValue || r.grossValue || 0), 0);

    expect(actualJCP).toBeCloseTo(expectedJCP, 2);

    // Check for unpaid JCP (Status 'Provisionado' or similar) - Assuming 'Creditado' means paid for this test
    //const unpaidJCP = declaration.incomeRecords
    //    .filter(r => r.incomeType === '{MOV_TYPE_JCP}' && r.date.getFullYear() === DECLARATION_YEAR /*&& r.status === '{STATUS_NOT_PAID}'*/); // Using the status enum from AssetPosition.ts

    // TODO: Verify how 'paid' status is determined in AssetProcessor based on '{ticker}' field ('Creditado', 'Provisionado', etc.)
    // For now, let's assume 'Creditado' means paid.
    // We determine unpaid count based on the processed incomeRecords' status,
    // as the raw data lacks a reliable status field.
  }});

  test('AssetProcessor: should calculate Monthly Results correctly', () => {{
    expect(declaration?.monthlyResults).toBeDefined();

    const finalPosition = declaration?.monthlyResults;

     expect(finalPosition.length).toBe(expectedSoldMonthlyResults.length);

    // General check: Ensure results are for the correct year
    finalPosition.forEach(result => {{
        expect(result.year).toBe(DECLARATION_YEAR);
    }});
  }});


  // --- DBKFileGenerator Tests ---
  test('DBKFileGenerator: should generate Bens e Direitos section correctly (Asset Position)', () => {{
    expect(declaration?.sections).toBeDefined();
    const bensSection = declaration.sections.find(s => s.code === 'BENS');
    expect(bensSection).toBeDefined();

    const assetItem = bensSection?.items.find(item => /*item.code === '31' &&*/ item.ticker?.startsWith('{ticker}'));

    if (expectedResumoComEventosDoAnoEsperado.quantidadeFinal > 0) {{
        expect(assetItem).toBeDefined();
       
        // Check Situação em 31/12/(ano)
        expect(assetItem?.value).toBeCloseTo(expectedResumoComEventosDoAnoEsperado.totalInvestido, 2);
        
        // Check Situação em 31/12/(ano-1)
        expect(assetItem?.previousYearValue).toBeCloseTo(expectedResumoComEventosDoAnoAnteriorEsperado.quantidadeFinal, 2);
      
        expect(assetItem?.cnpj).toBeDefined(); // Check if CNPJ was fetched/provided
     
        expect(assetItem?.description).toContain('{ticker}');
    }} else {{
        // If no position at year end, no item should be generated for this asset code (31)
        expect(assetItem).toBeUndefined();
    }}

    // Check for unpaid JCP (Code 59)
    const unpaidJCPItems = bensSection?.items.filter(item => item.code === '59' && item.description?.includes('JCP') && item.description?.includes('{ticker}'));
    const expectedUnpaidJCPValue = declaration.incomeRecords
        .filter(r => r.incomeType === '{MOV_TYPE_JCP}' && r.date.getFullYear() === DECLARATION_YEAR /*&& r.status === '{STATUS_NOT_PAID}'*/)
        .reduce((sum, r) => sum + (r.netValue || r.grossValue || 0), 0);

    if (expectedUnpaidJCPValue > 0) {{
        expect(unpaidJCPItems?.length).toBeGreaterThanOrEqual(1); // Might be multiple if different CNPJs
       
        const totalUnpaidJCPValue = unpaidJCPItems?.reduce((sum, item) => sum + (item.value ?? 0), 0) ?? 0;
        expect(totalUnpaidJCPValue).toBeCloseTo(expectedUnpaidJCPValue, 2);
    }} else {{
        expect(unpaidJCPItems?.length ?? 0).toBe(0);
    }}
  }});

  test('DBKFileGenerator: should generate Rendimentos Isentos section correctly (Exempt Income Records)', () => {{
    const rendIsentosSection = declaration.sections.find(s => s.code === 'REND_ISENTOS');
    expect(rendIsentosSection).toBeDefined();

    const assetItem = rendIsentosSection?.items.find(item => item.sourceName?.includes('{ticker}'));

    const expectedTotalIsentos = expectedDividends + expectedTotalDividends;

    if (expectedTotalIsentos > 0) {{
       // expect(rendIsentosSection).toBeDefined();
       
       // const dividendItems = rendIsentosSection?.items.filter(item => item.code === '09'); // Code 09 for Dividends

       // expect(dividendItems?.length).toBeGreaterThanOrEqual(1); // Might be grouped by CNPJ
       // expect(totalDividends).toBeCloseTo(expectedDividends, 2);
        
        console.log('expectedTotalDividends', expectedTotalDividends);
        expect(assetItem).toBeDefined();
        expect(assetItem?.value).toBeCloseTo(expectedTotalIsentos, 2);

       // expect(totalDividends).toBeCloseTo(expectedTotalDividends, 2); // Should now expect 0 based on test data

       // const totalDividendValue = dividendItems?.reduce((sum, item) => sum + (item.value ?? 0), 0) ?? 0;
       // expect(totalDividendValue).toBeCloseTo(expectedTotalDividends, 2);
    }} else {{
      // Check if the section exists but has no items, or if the section itself is absent
      const dividendItems = rendIsentosSection?.items.filter(item => item.code === '09' || item.code === '26');
      expect(dividendItems?.length ?? 0).toBe(0);
     }}

    // TODO: Add checks for Rendimento FII (Code 26) if applicable
  }});

  test('DBKFileGenerator: should generate Rendimentos Tributacao Exclusiva section correctly (Income Records)', () => {{
    const rendExclusivaSection = declaration.sections.find(s => s.code === 'REND_EXCLUSIVA');

     const finalJCP = declaration.incomeRecords
        .filter(r => r.incomeType === '{MOV_TYPE_JCP}' && r.date.getFullYear() === DECLARATION_YEAR /*&& r.status === 'PAGO'*/) // Only paid JCP
        .reduce((sum, r) => sum + (r.netValue || r.grossValue || 0), 0);

       const assetItemList = rendExclusivaSection?.items.filter(item => item.ticker?.startsWith('{ticker}')) ?? [];

        const jcpItems = assetItemList.filter(item => item.code === '10'); // Code 10 for JCP

    if (finalJCP > 0) {{
        expect(rendExclusivaSection).toBeDefined();
 
        expect(jcpItems?.length).toBeGreaterThanOrEqual(1); // Might be grouped by CNPJ
       
        const totalJcpValue = jcpItems?.reduce((sum, item) => sum + (item.value ?? 0), 0) ?? 0;
        expect(totalJcpValue).toBeCloseTo(finalJCP, 2);
    }} else {{
         expect(jcpItems?.length ?? 0).toBe(0);
    }}
  }});

  test('DBKFileGenerator: should generate Operacoes Renda Variavel section correctly (Monthly Results)', () => {{
    const opRendaVariavelSection = declaration.sections.find(s => s.code === 'OP_RENDA_VARIAVEL');
    expect(opRendaVariavelSection).toBeDefined();

    const assetItemList = opRendaVariavelSection?.items.filter(item => item.ticker?.startsWith('{ticker}'));

    const resultsForYear = declaration.monthlyResults.filter(r => r.year === DECLARATION_YEAR);

    // if (resultsForYear.length > 0) {{
        // expect(opRendaVariavelSection).toBeDefined();
        // Check if items match monthly results
        // resultsForYear.forEach(monthlyResult => {{
        //     const correspondingItem = opRendaVariavelSection?.items.find(item =>
        //         item.month === monthlyResult.month &&
        //         item.type === monthlyResult.assetCategory // Assuming type maps to AssetCategory (ACAO/FII)
        //     );
          
        //     expect(correspondingItem).toBeDefined();
          
        //     expect(correspondingItem?.value).toBeCloseTo(monthlyResult.netResult, 2);
        //     // TODO: Add checks for tax, exemption status etc. if needed
        // }});

        expectedSoldMonthlyResults.forEach(monthlyResult => {{
            const correspondingItem = resultsForYear.find(item => item.month === monthlyResult.month);
          
            expect(correspondingItem).toBeDefined();
          
            //expect(correspondingItem?.value).toBeCloseTo(monthlyResult.netResult, 2);
            expect(correspondingItem?.totalSalesValue).toBeCloseTo(monthlyResult.total, 2);
            // TODO: Add checks for tax, exemption status etc. if needed
        }});

        // Check total number of items matches number of monthly results with non-zero sales/result?
        //expect(opRendaVariavelSection?.items.length).toBe(resultsForYear.length);
        expect(resultsForYear.length).toBe(expectedSoldMonthlyResults.length);

    // }} else {{
    //     // If no monthly results, expect no items in this section
    //      expect(opRendaVariavelSection?.items?.length ?? 0).toBe(0);
    // }}
  }});

  // Add more specific tests as needed

}});
"""
    # --- End Template ---

    output_test_path = Path(test_dir)
    output_test_path.mkdir(parents=True, exist_ok=True)

    with open(test_file_path, 'w', encoding='utf-8') as f:
        f.write(template)

    #print(f"Generated test file: {test_file_path}")


# --- Main Execution ---
if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Fragment B3 JSON data and generate Jest tests per asset.")
    parser.add_argument(
        "--negociacao",
        default=DEFAULT_NEGOCIACAO_PATH,
        help=f"Path to the B3 negociacao JSON file (default: {DEFAULT_NEGOCIACAO_PATH})"
    )
    parser.add_argument(
        "--movimentacao",
        default=DEFAULT_MOVIMENTACAO_PATH,
        help=f"Path to the B3 movimentacao JSON file (default: {DEFAULT_MOVIMENTACAO_PATH})"
    )
    parser.add_argument(
        "--history-dir",
        default=OUTPUT_HISTORY_DIR,
        help=f"Output directory for fragmented JSON files (default: {OUTPUT_HISTORY_DIR})"
    )
    parser.add_argument(
        "--test-dir",
        default=OUTPUT_TEST_DIR,
        help=f"Output directory for generated Jest test files (default: {OUTPUT_TEST_DIR})"
    )
    parser.add_argument(
        "--year",
        default=DECLARATION_YEAR,
        help=f"Declaration year for calculations (default: {DECLARATION_YEAR})"
    )


    args = parser.parse_args()
    declaration_year = int(args.year.strip())

    # Adjust relative paths to be relative to the script's location
    script_dir = Path(__file__).parent
    negociacao_path = script_dir / args.negociacao
    movimentacao_path = script_dir / args.movimentacao
    history_output_dir = script_dir / args.history_dir
    test_output_dir = script_dir / args.test_dir

    print("Starting test generation process...")
    print(f"Negociação file: {negociacao_path}")
    print(f"Movimentação file: {movimentacao_path}")
    print(f"History output directory: {history_output_dir}")
    print(f"Test output directory: {test_output_dir}")


    # 1. Load Data
    negociacao_data = load_json_data(negociacao_path)
    movimentacao_data = load_json_data(movimentacao_path)
    print(f"Loaded {len(negociacao_data)} negotiation records and {len(movimentacao_data)} movement records.")

    # 2. Fragment Data
    fragmented_data = fragment_data(negociacao_data, movimentacao_data)
    print(f"Fragmented data into {len(fragmented_data)} asset groups.")

    # 3. Save Fragmented Files
    save_fragmented_files(fragmented_data, history_output_dir)

    # 4. Generate Test Files
    # Calculate relative path from test_dir to history_dir for imports
    history_dir_relative = os.path.relpath(history_output_dir, test_output_dir)

    generate_calculation_helper_file(test_output_dir)

    for ticker, data in fragmented_data.items():
        print(f"Processing asset group: {ticker}")
        # Calculate expected counts for this group
        
        # Generate the test file with counts
        generate_jest_test_file(ticker, test_output_dir, history_dir_relative)

    print("Test generation process completed.")
