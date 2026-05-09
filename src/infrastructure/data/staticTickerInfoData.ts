import { StockInfo } from '../../core/interfaces/ExternalTickerInfoProviderPort';

// Data extracted from https://anexo3contabilidade.com.br/lista-CNPJ-empresas-listadas-na-B3.html and https://anexo3contabilidade.com.br/lista-CNPJ-fundos-imobiliarios-listados-na-B3.html
// IMPORTANT: This data is static and may become outdated. Manual updates are required.

// Helper function to clean CNPJ
const cleanCnpj = (cnpj: string | null | undefined): string => {
  return cnpj ? cnpj.replace(/[^\d]/g, '') : '';
};

export const normalizeTicker = (ticker: string): string => {
  return ticker.trim().toUpperCase().replace(/[0-9]/g, ''); // Only letters
};

// Helper function to split tickers and create map entries
const addEntries = (
  map: Map<string, StockInfo>,
  name: string,
  tickers: string | null | undefined,
  cnpj: string
) => {
  if (!tickers) return;

  const cleanedCnpj = cleanCnpj(cnpj);

  if (!cleanedCnpj) return; // Skip if CNPJ is invalid after cleaning

  const tickerList = tickers.split(/[\s/]+/); // Split by space or slash
  tickerList.forEach(ticker => {
    const normalizedTicker = normalizeTicker(ticker);

    if (normalizedTicker) {
      // Ensure ticker is not empty after trimming
      map.set(normalizedTicker, { cnpj: cleanedCnpj, name: name.trim() });
      //console.log(`Added StockInfo ${normalizedTicker}`);
    }
  });
};

export const cnpjDataMap = new Map<string, StockInfo>();

// == Populate with Stock Data ==
addEntries(cnpjDataMap, '3R PETROLEUM', 'RRRP3', '12.091.809/0001-55');
addEntries(cnpjDataMap, '3TENTOS', 'TTEN3', '94.813.102/0001-70');
addEntries(cnpjDataMap, 'AERIS', 'AERI3', '12.528.708/0001-07');
addEntries(cnpjDataMap, 'AES TIETE ENERGIA', 'TIET11 TIET3 TIET4', '04.128.563/0001-10');
addEntries(cnpjDataMap, 'AGROGALAXY', 'AGXY3', '21.240.146/0001-84');
addEntries(cnpjDataMap, 'ALLIED', 'ALLD3', '20.247.322/0001-47');
addEntries(cnpjDataMap, 'ALPARGATAS', 'ALPA3 ALPA4', '61.079.117/0001-05');
addEntries(cnpjDataMap, 'ALPHAVILLE', 'AVLL3', '16.811.931/0001-00');
addEntries(cnpjDataMap, 'ALUPAR INVESTIMENTO', 'ALUP11 ALUP3 ALUP4', '08.364.948/0001-38');
addEntries(cnpjDataMap, 'AMBEV', 'ABEV3', '07.526.557/0001-00');
addEntries(cnpjDataMap, 'AMBIPAR', 'AMBP3', '12.648.266/0001-24');
addEntries(cnpjDataMap, 'ANIMA HOLDING', 'ANIM3', '09.288.252/0001-32');
addEntries(cnpjDataMap, 'AREZZO INDÚSTRIA E COMÉRCIO', 'ARZZ3', '16.590.234/0001-76');
addEntries(cnpjDataMap, 'ARMAC', 'ARML3', '00.242.184/0001-04');
addEntries(cnpjDataMap, 'ATACADÃO', 'CRFB3', '75.315.333/0001-09');
addEntries(cnpjDataMap, 'ATOM', 'ATOM3', '00.359.742/0001-08');
addEntries(cnpjDataMap, 'AUREN ENERGIA', 'AURE3', '28.594.234/0001-23');
addEntries(cnpjDataMap, 'AZUL', 'AZUL4', '09.305.994/0001-29');
addEntries(cnpjDataMap, 'B2W – COMPANHIA DIGITAL', 'BTOW3', '00.776.574/0001-56'); // Note: AMER3 uses this CNPJ too
addEntries(cnpjDataMap, 'B3 – BRASIL – BOLSA – BALCÃO', 'B3SA3', '09.346.601/0001-25');
addEntries(cnpjDataMap, 'BANCO ABC BRASIL', 'ABCB4', '28.195.667/0001-06');
addEntries(cnpjDataMap, 'BANCO BMG', 'BMGB4', '61.186.680/0001-74');
addEntries(cnpjDataMap, 'BANCO BRADESCO', 'BBDC3 BBDC4', '60.746.948/0001-12');
addEntries(cnpjDataMap, 'BANCO BTG PACTUAL', 'BPAC11 BPAC3 BPAC5', '30.306.294/0001-45');
addEntries(cnpjDataMap, 'BANCO DO BRASIL', 'BBAS3', '00.000.000/0001-91');
addEntries(cnpjDataMap, 'BANCO PAN', 'BPAN4', '59.285.411/0001-13');
addEntries(cnpjDataMap, 'BANCO PINE', 'PINE3 PINE4', '62.144.175/0001-20');
addEntries(cnpjDataMap, 'BANCO SANTANDER', 'SANB11 SANB3 SANB4', '90.400.888/0001-42');
addEntries(cnpjDataMap, 'BANRISUL', 'BRSR3 BRSR5 BRSR6', '92.702.067/0001-96');
addEntries(cnpjDataMap, 'BB SEGURIDADE', 'BBSE3', '17.344.597/0001-94');
addEntries(cnpjDataMap, 'BEMOBI', 'BMOB3', '09.042.817/0001-05');
addEntries(cnpjDataMap, 'BIOSEV', 'BSEV3', '15.527.906/0001-36');
addEntries(cnpjDataMap, 'BLAU FARMACÊUTICA', 'BLAU3', '58.430.828/0001-60');
addEntries(cnpjDataMap, 'BOA SAFRA', 'SOJA3', '10.807.374/0001-77');
addEntries(cnpjDataMap, 'BOA VISTA', 'BOAS3', '11.725.176/0001-27');
addEntries(cnpjDataMap, 'BOMBRIL', 'BOBR3 BOBR4', '50.564.053/0001-03');
addEntries(cnpjDataMap, 'BR MALLS PARTICIPACOES', 'BRML3', '06.977.745/0001-91');
addEntries(cnpjDataMap, 'BR PARTNERS', 'BRBI11', '10.739.356/0001-03');
addEntries(cnpjDataMap, 'BR PROPERTIES', 'BRPR3', '06.977.751/0001-49');
addEntries(cnpjDataMap, 'BRADESPAR', 'BRAP3 BRAP4', '03.847.461/0001-92');
addEntries(cnpjDataMap, 'BRASIL BROKERS', 'BBRK3', '08.613.550/0001-98');
addEntries(cnpjDataMap, 'BRASILAGRO', 'AGRO3', '07.628.528/0001-59');
addEntries(cnpjDataMap, 'BRASKEM', 'BRKM3 BRKM5 BRKM6', '42.150.391/0001-70');
addEntries(cnpjDataMap, 'BRF', 'BRFS3', '01.838.723/0001-27');
addEntries(cnpjDataMap, 'BRISANET', 'BRIT3', '19.796.586/0001-70');
addEntries(cnpjDataMap, 'C&A MODAS', 'CEAB3', '45.242.914/0001-05');
addEntries(cnpjDataMap, 'CAIXA SEGURIDADE', 'CXSE3', '22.543.331/0001-00');
addEntries(cnpjDataMap, 'CAMIL ALIMENTOS', 'CAML3', '64.904.295/0001-03');
addEntries(cnpjDataMap, 'CBA', 'CBAV3', '61.409.892/0001-73');
addEntries(cnpjDataMap, 'CCR', 'CCRO3', '02.846.056/0001-97');
addEntries(cnpjDataMap, 'CENTAURO', 'CNTO3', '13.217.485/0001-11'); // Note: SBFG3 uses this CNPJ too
addEntries(cnpjDataMap, 'CENTRO DE IMAGEM DIAGNOSTICOS', 'AALR3', '42.771.949/0001-35');
addEntries(cnpjDataMap, 'CIA BRASILEIRA DE DISTRIBUICAO', 'PCAR3 PCAR4', '47.508.411/0001-56');
addEntries(
  cnpjDataMap,
  'CIA ENERGETICA DE MINAS GERAIS – CEMIG',
  'CMIG3 CMIG4',
  '17.155.730/0001-64'
);
addEntries(
  cnpjDataMap,
  'CIA ENERGETICA DE PERNAMBUCO – CELPE',
  'CEPE3 CEPE5 CEPE6',
  '10.835.932/0001-08'
);
addEntries(
  cnpjDataMap,
  'CIA ENERGETICA DO CEARA – COELCE',
  'COCE3 COCE5 COCE6',
  '07.047.251/0001-70'
);
addEntries(cnpjDataMap, 'CIA FERRO LIGAS DA BAHIA – FERBASA', 'FESA3 FESA4', '15.141.799/0001-03');
addEntries(cnpjDataMap, 'CIA GAS DE SAO PAULO – COMGAS', 'CGAS3 CGAS5', '61.856.571/0001-17');
addEntries(cnpjDataMap, 'CIA LOCAÇÃO DAS AMÉRICAS', 'LCAM3', '10.215.988/0001-60');
addEntries(cnpjDataMap, 'CIA SANEAMENTO BASICO SAO PAULO – SABESP', 'SBSP3', '43.776.517/0001-80');
addEntries(cnpjDataMap, 'CIA SANEAMENTO DE MINAS GERAIS – COPASA', 'CSMG3', '17.281.106/0001-03');
addEntries(
  cnpjDataMap,
  'CIA SANEAMENTO DO PARANA – SANEPAR',
  'SAPR11 SAPR3 SAPR4',
  '76.484.013/0001-45'
);
addEntries(cnpjDataMap, 'CIA SIDERURGICA NACIONAL', 'CSNA3', '33.042.730/0001-04');
addEntries(
  cnpjDataMap,
  'CIA TECIDOS NORTE DE MINAS COTEMINAS',
  'CTNM3 CTNM4',
  '22.677.520/0001-76'
);
addEntries(
  cnpjDataMap,
  'CIA TRANSMISSÃO ENERGIA ELÉTRICA PAULISTA – CTEEP',
  'TRPL3 TRPL4',
  '02.998.611/0001-04'
); // Note: ISA ENERGIA uses this CNPJ too
addEntries(cnpjDataMap, 'CIELO', 'CIEL3', '01.027.058/0001-91');
addEntries(cnpjDataMap, 'CLEAR SALE', 'CLSA3', '03.802.115/0001-98');
addEntries(cnpjDataMap, 'COGNA EDUCAÇÃO', 'COGN3', '02.800.026/0001-40');
addEntries(cnpjDataMap, 'CONSTRUTORA TENDA', 'TEND3', '71.476.527/0001-35');
addEntries(cnpjDataMap, 'COSAN', 'CSAN3', '50.746.577/0001-15');
addEntries(cnpjDataMap, 'CPFL ENERGIA', 'CPFE3', '02.429.144/0001-93');
addEntries(cnpjDataMap, 'CREMER', 'CREM3', '82.641.325/0001-18');
addEntries(cnpjDataMap, 'CRUZEIRO DO SUL EDUCACIONAL', 'CSED3', '62.984.091/0001-02');
addEntries(cnpjDataMap, 'CSN MINERAÇÃO', 'CMIN3', '08.902.291/0001-15');
addEntries(cnpjDataMap, 'CSU CARDSYSTEM', 'CARD3', '01.896.779/0001-38');
addEntries(cnpjDataMap, 'CURY', 'CURY3', '08.797.760/0001-83');
addEntries(cnpjDataMap, 'CVC BRASIL OPERADORA E AGÊNCIA DE VIAGENS', 'CVCB3', '10.760.260/0001-19');
addEntries(cnpjDataMap, 'CYRELA BRAZIL REALTYEMPREEND E PART', 'CYRE3', '73.178.600/0001-18');
addEntries(cnpjDataMap, 'CYRELA COMMERCIAL PROPERTIES', 'CCPR3', '08.801.621/0001-86'); // Note: SYN PROP E TECH uses this CNPJ too
addEntries(cnpjDataMap, 'D1000', 'DMVF3', '12.108.897/0001-50');
addEntries(cnpjDataMap, 'DESKTOP', 'DESK3', '08.170.849/0001-15');
addEntries(cnpjDataMap, 'DEXCO', 'DXCO3', '97.837.181/0001-47');
addEntries(cnpjDataMap, 'DIRECIONAL ENGENHARIA', 'DIRR3', '16.614.075/0001-00');
addEntries(cnpjDataMap, 'DOMMO', 'DMMO3', '08.926.302/0001-05');
addEntries(cnpjDataMap, 'DOTZ', 'DOTZ3', '10.221.279/0001-97'); // Note: Different CNPJ from previous list
addEntries(cnpjDataMap, 'DUFRY A.G.', 'DAGB33', '11.423.623/0001-93');
addEntries(cnpjDataMap, 'ECORODOVIAS INFRAESTRUTURA E LOGÍSTICA', 'ECOR3', '04.149.454/0001-80');
addEntries(cnpjDataMap, 'EDP – ENERGIAS DO BRASIL', 'ENBR3', '03.983.431/0001-03');
addEntries(cnpjDataMap, 'ELEKEIROZ', 'ELEK3/ELEK4', '13.788.120/0001-47');
addEntries(cnpjDataMap, 'ELETROBRAS', 'ELET3 ELET6', '00.001.180/0001-26');
addEntries(cnpjDataMap, 'ELETROMIDIA', 'ELMD3', '09.347.516/0001-81');
addEntries(cnpjDataMap, 'ELETROPAULO', 'ELPL3', '61.695.227/0001-93');
addEntries(cnpjDataMap, 'EMBRAER', 'EMBR3', '07.689.002/0001-89');
addEntries(cnpjDataMap, 'ENAUTA PARTICIPAÇÕES', 'ENAT3', '11.669.021/0001-10');
addEntries(cnpjDataMap, 'ENERGISA', 'ENGI11 ENGI3 ENGI4', '00.864.214/0001-06');
addEntries(cnpjDataMap, 'ENEVA', 'ENEV3', '04.423.567/0001-21');
addEntries(cnpjDataMap, 'ENGIE BRASIL ENERGIA', 'EGIE3', '02.474.103/0001-19');
addEntries(cnpjDataMap, 'ENJOEI', 'ENJU3', '16.922.038/0001-51');
addEntries(cnpjDataMap, 'EQUATORIAL ENERGIA', 'EQTL3', '03.220.438/0001-73');
addEntries(cnpjDataMap, 'ESPAÇO LASER', 'ESPA3', '26.659.061/0001-59');
addEntries(cnpjDataMap, 'ESTAPAR', 'ALPK3', '60.537.263/0001-66');
addEntries(cnpjDataMap, 'ETERNIT', 'ETER3', '61.092.037/0001-81');
addEntries(cnpjDataMap, 'EUCATEX', 'EUCA3 EUCA4', '56.643.018/0001-66');
addEntries(cnpjDataMap, 'EVEN CONSTRUTORA E INCORPORADORA', 'EVEN3', '43.470.988/0001-65');
addEntries(cnpjDataMap, 'EXCELSIOR ALIMENTOS', 'BAUH3 BAUH4', '95.426.862/0001-97');
addEntries(cnpjDataMap, 'EZ TEC', 'EZTC3', '08.312.229/0001-73');
addEntries(cnpjDataMap, 'FERTILIZANTES HERINGER', 'FHER3', '22.266.175/0001-88');
addEntries(cnpjDataMap, 'FLEURY', 'FLRY3', '60.840.055/0001-31');
addEntries(cnpjDataMap, 'FOCUS ENERGIA', 'POWE3', '26.735.020/0001-02');
addEntries(cnpjDataMap, 'FRAS-LE', 'FRAS3', '88.610.126/0001-29');
addEntries(cnpjDataMap, 'GAFISA', 'GFSA3', '01.545.826/0001-07');
addEntries(cnpjDataMap, 'GENERAL SHOPPING BRASIL', 'GSHP3', '08.764.621/0001-53');
addEntries(cnpjDataMap, 'GERDAU', 'GGBR3 GGBR4', '33.611.500/0001-19');
addEntries(cnpjDataMap, 'GET NINJAS', 'NINJ3', '14.127.813/0001-51');
addEntries(cnpjDataMap, 'GOL LINHAS AEREAS INTELIGENTES', 'GOLL4', '06.164.253/0001-87');
addEntries(cnpjDataMap, 'GRAZZIOTIN', 'CGRA3/CGRA4', '92.012.467/0001-70');
addEntries(cnpjDataMap, 'GRENDENE', 'GRND3', '89.850.341/0001-60');
addEntries(cnpjDataMap, 'GRUPO GPS', 'GGPS3', '09.229.201/0001-30');
addEntries(cnpjDataMap, 'GRUPO MATEUS', 'GMAT3', '24.990.777/0001-09');
addEntries(cnpjDataMap, 'GRUPO SOMA', 'SOMA3', '10.285.590/0001-08');
addEntries(cnpjDataMap, 'GRUPO VAMOS', 'VAMO3', '23.373.000/0001-32');
addEntries(cnpjDataMap, 'GUARARAPES CONFECCOES', 'GUAR3 GUAR4', '08.402.943/0001-52');
addEntries(cnpjDataMap, 'HAPVIDA', 'HAPV3', '63.554.067/0001-98');
addEntries(cnpjDataMap, 'HBR REALTY', 'HBRE3', '14.785.152/0001-51');
addEntries(cnpjDataMap, 'HELBOR EMPREENDIMENTOS', 'HBOR3', '49.263.189/0001-02');
addEntries(cnpjDataMap, 'HERING', 'HGTX3', '78.876.950/0001-71');
addEntries(cnpjDataMap, 'HIDROVIAS DO BRASIL', 'HBSA3', '12.648.327/0001-53');
addEntries(cnpjDataMap, 'HOSPITAL MATER DEI', 'MATD3', '16.676.520/0001-59');
addEntries(cnpjDataMap, 'HOTEIS OTHON', 'HOOT3 HOOT4', '33.200.049/0001-47');
addEntries(cnpjDataMap, 'HYPERA PHARMA', 'HYPE3', '02.932.074/0001-91');
addEntries(cnpjDataMap, 'IDEIASNET', 'IDNT3', '02.365.069/0001-44'); // Note: PADTEC uses this CNPJ too
addEntries(cnpjDataMap, 'IGUATEMI EMPRESA DE SHOPPING CENTERS', 'IGTA3', '51.218.147/0001-93');
addEntries(cnpjDataMap, 'INDUSTRIAS ROMI', 'ROMI3', '56.720.428/0001-63');
addEntries(cnpjDataMap, 'INFRACOMMERCE', 'IFCM3', '38.456.921/0001-36'); // Typo in original table? Assuming 38.546.921/0001-36
addEntries(cnpjDataMap, 'INSTITUTO HERMES PARDINI', 'PARD3', '19.378.769/0001-76');
addEntries(cnpjDataMap, 'INTELBRAS', 'INTB3', '82.901.000/0001-27');
addEntries(cnpjDataMap, 'IOCHPE MAXION', 'MYPK3', '61.156.113/0001-75');
addEntries(cnpjDataMap, 'IRB – BRASIL RESSEGUROS', 'IRBR3', '33.376.989/0001-91');
addEntries(cnpjDataMap, 'ITAU UNIBANCO HOLDING', 'ITUB3 ITUB4', '60.872.504/0001-23');
addEntries(cnpjDataMap, 'ITAUSA INVESTIMENTOS', 'ITSA3 ITSA4', '61.532.644/0001-15');
addEntries(cnpjDataMap, 'JALLES MACHADO', 'JALL3', '02.635.522/0001-95');
addEntries(cnpjDataMap, 'JBS', 'JBSS3', '02.916.265/0001-60');
addEntries(cnpjDataMap, 'JHSF PARTICIPACOES', 'JHSF3', '08.294.224/0001-65');
addEntries(cnpjDataMap, 'JSL', 'JSLG3', '52.548.435/0001-79');
addEntries(cnpjDataMap, 'KARSTEN', 'CTKA3/CTKA4', '82.640.558/0001-04');
addEntries(cnpjDataMap, 'KEPLER WEBER', 'KEPL3', '91.983.056/0001-69');
addEntries(cnpjDataMap, 'KLABIN', 'KLBN11 KLBN3 KLBN4', '89.637.490/0001-45');
addEntries(cnpjDataMap, 'KORA SAÚDE', 'KRSA3', '13.270.520/0001-66');
addEntries(cnpjDataMap, 'LAVVI', 'LAVV3', '26.462.693/0001-28');
addEntries(cnpjDataMap, 'LIGHT', 'LIGT3', '03.378.521/0001-75');
addEntries(cnpjDataMap, 'LINX', 'LINX3', '06.948.969/0001-75');
addEntries(cnpjDataMap, 'LIVETECH DA BAHIA', 'LVTC3', '05.917.486/0001-40');
addEntries(cnpjDataMap, 'LOCALIZA RENT A CAR', 'RENT3', '16.670.085/0001-55');
addEntries(cnpjDataMap, 'LOCAWEB', 'LWSA3', '02.351.877/0001-52');
addEntries(cnpjDataMap, 'LOG COMMERCIAL PROPERTIES', 'LOGG3', '09.041.168/0001-10');
addEntries(cnpjDataMap, 'LOG-IN LOGISTICA INTERMODAL', 'LOGN3', '42.278.291/0001-24');
addEntries(cnpjDataMap, 'LOJAS AMERICANAS', 'LAME3 LAME4', '33.014.556/0001-96');
addEntries(cnpjDataMap, 'LOJAS MARISA', 'AMAR3', '61.189.288/0001-89');
addEntries(cnpjDataMap, 'LOJAS RENNER', 'LREN3', '92.754.738/0001-62');
addEntries(cnpjDataMap, 'LPS BRASIL – CONSULTORIA DE IMOVEIS', 'LPSB3', '08.078.847/0001-09');
addEntries(cnpjDataMap, 'LUPATECH', 'LUPA3', '89.463.822/0001-12');
addEntries(cnpjDataMap, 'M.DIAS BRANCO IND COM DE ALIMENTOS', 'MDIA3', '07.206.816/0001-15');
addEntries(cnpjDataMap, 'MAGAZINE LUIZA', 'MGLU3', '47.960.950/0001-21');
addEntries(cnpjDataMap, 'MAGNESITA REFRATARIOS', 'MAGG3', '08.684.547/0001-65');
addEntries(cnpjDataMap, 'MAHLE-METAL LEVE', 'LEVE3', '60.476.884/0001-87');
addEntries(cnpjDataMap, 'MANUFATURA DE BRINQUEDOS ESTRELA', 'ESTR3 ESTR4', '61.082.004/0001-50');
addEntries(cnpjDataMap, 'MARCOPOLO', 'POMO3 POMO4', '88.611.835/0001-29');
addEntries(cnpjDataMap, 'MARFRIG GLOBAL FOODS', 'MRFG3', '03.853.896/0001-40');
addEntries(cnpjDataMap, 'MÉLIUZ', 'CASH3', '14.110.585/0001-07');
addEntries(cnpjDataMap, 'MELNICK EVEN', 'MELK3', '12.181.987/0001-77');
addEntries(cnpjDataMap, 'METALFRIO SOLUTIONS', 'FRIO3', '04.821.041/0001-08');
addEntries(cnpjDataMap, 'METALURGICA GERDAU', 'GOAU3 GOAU4', '92.690.783/0001-09');
addEntries(cnpjDataMap, 'MILLS ESTRUTURAS E SERVIÇOS DE ENGENHARIA', 'MILS3', '27.093.558/0001-15');
addEntries(cnpjDataMap, 'MINERVA', 'BEEF3', '67.620.377/0001-14');
addEntries(cnpjDataMap, 'MITRE', 'MTRE3', '07.882.930/0001-65');
addEntries(cnpjDataMap, 'MITRE REALTY', 'MTRE3', '07.882.930/0001-65');
addEntries(cnpjDataMap, 'MMX MINERACAO E METALICOS', 'MMXM3', '02.762.115/0001-49');
addEntries(cnpjDataMap, 'MOBLY', 'MBLY3', '31.553.627/0001-01');
addEntries(cnpjDataMap, 'MODAL MAIS', 'MODL11', '30.723.886/0001-62');
addEntries(cnpjDataMap, 'MOSAICO VENTURES', 'MOSI3', '09.083.175/0001-84');
addEntries(cnpjDataMap, 'MOURA DUBEUX', 'MDNE3', '12.049.631/0001-84');
addEntries(cnpjDataMap, 'MOVIDA', 'MOVI3', '21.314.559/0001-66');
addEntries(cnpjDataMap, 'MRV ENGENHARIA', 'MRVE3', '08.343.492/0001-20');
addEntries(cnpjDataMap, 'MULTILASER', 'MLAS3', '59.717.553/0001-02');
addEntries(cnpjDataMap, 'MULTIPLAN', 'MULT3', '07.816.890/0001-53');
addEntries(cnpjDataMap, 'MULTIPLUS', 'MPLU3', '11.094.546/0001-75');
addEntries(cnpjDataMap, 'MUNDIAL – PRODUTOS DE CONSUMO', 'MNDL3', '88.610.191/0001-54');
addEntries(cnpjDataMap, 'NADIR FIGUEIREDO', 'NAFG3 NAFG4', '61.067.161/0001-97');
addEntries(cnpjDataMap, 'NATURA COSMETICOS', 'NTCO3', '71.673.990/0001-77');
addEntries(cnpjDataMap, 'NEOENERGIA', 'NEOE3', '01.083.200/0001-18');
addEntries(cnpjDataMap, 'NEOGRID', 'NGRD3', '10.139.870/0001-08');
addEntries(cnpjDataMap, 'NOTRE DAME INTERMÉDICA', 'GNDI3', '19.853.511/0001-84');
addEntries(cnpjDataMap, 'NTERNATIONAL MEAL COMPANY ALIMENTACAO', 'MEAL3', '17.314.329/0001-20');
addEntries(cnpjDataMap, 'OCEAN PACT', 'OPCT3', '09.114.805/0001-30');
addEntries(cnpjDataMap, 'ODONTOPREV', 'ODPV3', '58.119.199/0001-51');
addEntries(cnpjDataMap, 'OI', 'OIBR3 OIBR4', '76.535.764/0001-43');
addEntries(cnpjDataMap, 'ONCOCLÍNICAS', 'ONCO3', '12.104.241/0004-02');
addEntries(cnpjDataMap, 'ORIZON', 'ORVR3', '11.421.994/0001-36');
addEntries(cnpjDataMap, 'OSX BRASIL', 'OSXB3', '09.112.685/0001-32');
addEntries(cnpjDataMap, 'OURO FINO SAUDE ANIMAL', 'OFSA3', '20.258.278/0001-70');
addEntries(cnpjDataMap, 'PAGUE MENOS', 'PGMN3', '06.626.253/0001-51');
addEntries(cnpjDataMap, 'PARANAPANEMA', 'PMAM3', '60.398.369/0004-79');
addEntries(cnpjDataMap, 'PDG REALTY', 'PDGR3', '02.950.811/0001-89');
addEntries(cnpjDataMap, 'PETRO RECÔNCAVO', 'RECV3', '03.342.704/0001-30');
addEntries(cnpjDataMap, 'PETRO RIO', 'PRIO3', '10.629.105/0001-68');
addEntries(cnpjDataMap, 'PETROLEO BRASILEIRO PETROBRAS', 'PETR3 PETR4', '33.000.167/0001-01');
addEntries(cnpjDataMap, 'PETZ', 'PETZ3', '18.328.118/0001-09');
addEntries(cnpjDataMap, 'PLANO & PLANO', 'PLPL3', '24.230.275/0001-80');
addEntries(cnpjDataMap, 'PORTO SEGURO', 'PSSA3', '02.149.205/0001-69');
addEntries(cnpjDataMap, 'PORTOBELLO', 'PTBL3', '83.475.913/0001-91');
addEntries(cnpjDataMap, 'POSITIVO TECNOLOGIA', 'POSI3', '81.243.735/0001-48');
addEntries(cnpjDataMap, 'PRINER', 'PRNR3', '18.593.815/0001-97');
addEntries(cnpjDataMap, 'PROFARMA DISTRIB PROD FARMACEUTICOS', 'PFRM3', '45.453.214/0001-51');
addEntries(cnpjDataMap, 'QUALICORP', 'QUAL3', '11.992.680/0001-93');
addEntries(cnpjDataMap, 'QUERO-QUERO', 'LJQQ3', '96.418.264/0218-02');
addEntries(cnpjDataMap, 'RAIA DROGASIL', 'RADL3', '61.585.865/0001-51');
addEntries(cnpjDataMap, 'RAÍZEN', 'RAIZ4', '33.453.598/0001-23');
addEntries(cnpjDataMap, 'RANDON IMPLEMENTOS', 'RAPT3/RAPT4', '89.086.144/0001-16');
addEntries(cnpjDataMap, 'RECRUSUL', 'RCSL3 RCSL4', '91.333.666/0001-17');
addEntries(cnpjDataMap, 'REDE D’OR', 'RDOR3', '06.047.087/0001-39');
addEntries(cnpjDataMap, 'REDE ENERGIA', 'REDE3', '61.584.140/0001-49');
addEntries(cnpjDataMap, 'REFINARIA DE PETROLEOS MANGUINHOS', 'RPMG3', '33.412.081/0001-96');
addEntries(cnpjDataMap, 'RENOVA ENERGIA', 'RNEW11 RNEW3 RNEW4', '08.534.605/0001-74');
addEntries(cnpjDataMap, 'RESTOQUE COMÉRCIO E CONFECÇÕES DE ROUPAS', 'LLIS3', '49.669.856/0001-43');
addEntries(cnpjDataMap, 'RIO PARANAPANEMA ENERGIA', 'GEPA3 GEPA4', '02.998.301/0001-81');
addEntries(cnpjDataMap, 'ROSSI RESIDENCIAL', 'RSID3', '61.065.751/0001-80');
addEntries(cnpjDataMap, 'RUMO', 'RAIL3', '02.387.241/0001-60');
addEntries(cnpjDataMap, 'SANTOS BRASIL', 'STBP3', '02.762.121/0001-04');
addEntries(cnpjDataMap, 'SAO CARLOS', 'SCAR3', '29.780.061/0001-09');
addEntries(cnpjDataMap, 'SAO MARTINHO', 'SMTO3', '51.466.860/0001-56');
addEntries(cnpjDataMap, 'SARAIVA LIVREIROS EDITORES', 'SLED3 SLED4', '60.500.139/0001-26');
addEntries(cnpjDataMap, 'SCHULZ', 'SHUL3 SHUL4', '84.693.183/0001-68');
addEntries(cnpjDataMap, 'SEQUOIA', 'SEQL3', '01.599.101/0001-93');
addEntries(cnpjDataMap, 'SER EDUCACIONAL', 'SEER3', '04.986.320/0001-13');
addEntries(cnpjDataMap, 'SIMPAR', 'SIMH3', '07.415.333/0001-20');
addEntries(cnpjDataMap, 'SINQIA', 'SQIA3', '04.065.791/0001-99');
addEntries(cnpjDataMap, 'SLC AGRICOLA', 'SLCE3', '89.096.457/0001-55');
addEntries(cnpjDataMap, 'SMARTFIT', 'SMFT3', '07.594.978/0001-78');
addEntries(cnpjDataMap, 'SMILES FIDELIDADE', 'SMLS3', '05.730.375/0001-20');
addEntries(cnpjDataMap, 'SOMOS EDUCAÇÃO', 'SEDU3', '02.541.982/0001-54');
addEntries(cnpjDataMap, 'SONAE SIERRA BRASIL', 'SSBR3', '05.878.397/0001-32'); // Note: ALLOS/ALIANSCE use this CNPJ too
addEntries(cnpjDataMap, 'SPRINGS GLOBAL', 'SGPS3', '07.718.269/0001-57');
addEntries(cnpjDataMap, 'SUL AMERICA', 'SULA11 SULA3 SULA4', '29.978.814/0001-87');
addEntries(cnpjDataMap, 'SUZANO PAPEL E CELULOSE', 'SUZB3', '16.404.287/0001-55');
addEntries(cnpjDataMap, 'T4F ENTRETENIMENTO', 'SHOW3', '02.860.694/0001-62');
addEntries(cnpjDataMap, 'TAURUS ARMAS', 'TASA3 TASA4', '92.781.335/0001-02');
addEntries(cnpjDataMap, 'TC', 'TRAD3', '26.345.998/0001-50');
addEntries(cnpjDataMap, 'TECHNOS', 'TECN3', '09.295.063/0001-97');
addEntries(cnpjDataMap, 'TECNISA', 'TCSA3', '08.065.557/0001-12');
addEntries(cnpjDataMap, 'TECNOSOLO ENGENHARIA', 'TCNO3 TCNO4', '33.111.246/0001-90');
addEntries(cnpjDataMap, 'TEGMA GESTAO LOGISTICA', 'TGMA3', '02.351.144/0001-18');
addEntries(cnpjDataMap, 'TEGRA', 'TEGA3', '30.213.493/0001-09');
addEntries(cnpjDataMap, 'TEKA-TECELAGEM KUEHNRICH', 'TEKA3 TEKA4', '82.636.986/0001-55');
addEntries(cnpjDataMap, 'TELEFÔNICA BRASIL', 'VIVT3 VIVT4', '02.558.157/0001-62');
addEntries(cnpjDataMap, 'TERRA SANTA AGRO', 'TESA3', '05.799.312/0001-20');
addEntries(cnpjDataMap, 'TIM', 'TIMP3', '02.558.115/0001-21');
addEntries(cnpjDataMap, 'TOTVS', 'TOTS3', '53.113.791/0001-22');
addEntries(cnpjDataMap, 'TRACK & FIELD', 'TFCO4', '59.418.806/0001-47');
addEntries(
  cnpjDataMap,
  'TRANSMISSORA ALIANÇA DE ENERGIA ELÉTRICA',
  'TAEE11 TAEE3 TAEE4',
  '07.859.971/0001-30'
);
addEntries(cnpjDataMap, 'TRISUL', 'TRIS3', '08.811.643/0001-27');
addEntries(cnpjDataMap, 'TRIUNFO PART', 'TPIS3', '03.014.553/0001-91');
addEntries(cnpjDataMap, 'TUPY', 'TUPY3', '84.683.374/0001-49');
addEntries(cnpjDataMap, 'ULTRAPAR PARTICIPACOES', 'UGPA3', '33.256.439/0001-39');
addEntries(cnpjDataMap, 'UNICASA INDÚSTRIA DE MÓVEIS', 'UCAS3', '90.441.460/0001-48');
addEntries(cnpjDataMap, 'UNIFIQUE', 'FIQE3', '02.255.187/0001-08'); // Corrected CNPJ format
addEntries(cnpjDataMap, 'UNIPAR CARBOCLORO S.A.', 'UNIP3 UNIP5 UNIP6', '33.958.695/0001-78');
addEntries(
  cnpjDataMap,
  'USINAS SIDERÚRGICAS DE MINAS GERAIS – USIMINAS',
  'USIM3 USIM5 USIM6',
  '60.894.730/0001-05'
);
addEntries(cnpjDataMap, 'VALE', 'VALE3', '33.592.510/0001-54');
addEntries(cnpjDataMap, 'VALID SOLUÇÕES', 'VLID3', '33.113.309/0001-47');
addEntries(cnpjDataMap, 'VIA VAREJO', 'VIIA3', '33.041.260/0652-90');
addEntries(cnpjDataMap, 'VIBRA ENERGIA', 'VBBR3', '34.274.233/0001-02');
addEntries(cnpjDataMap, 'VITTIA', 'VITT3', '45.365.558/0001-09');
addEntries(cnpjDataMap, 'VIVARA', 'VIVA3', '33.839.910/0001-11');
addEntries(cnpjDataMap, 'VIVEO', 'VVEO3', '12.420.164/0001-57');
addEntries(cnpjDataMap, 'VULCABRAS/AZALEIA', 'VULC3', '50.926.955/0001-42');
addEntries(cnpjDataMap, 'WEG', 'WEGE3', '84.429.695/0001-11');
addEntries(cnpjDataMap, 'WESTWING', 'WEST3', '14.776.142/0001-50');
addEntries(cnpjDataMap, 'WHIRLPOOL', 'WHRL3 WHRL4', '59.105.999/0001-86');
addEntries(cnpjDataMap, 'WILSON SONS', 'WSON33', '05.721.735/0001-28');
addEntries(cnpjDataMap, 'WIZ SOLUÇÕES E CORRETAGEM DE SEGUROS', 'WIZC3', '42.278.473/0001-03');
addEntries(cnpjDataMap, 'YDUQS', 'YDUQ3', '08.807.432/0001-10');
addEntries(cnpjDataMap, 'ZAMP SA', 'ZAMP3', '13.574.594/0001-96');

// == Populate with BDR/ETF Data ==
// BDRs não têm CNPJ próprio; usa-se o CNPJ da instituição depositária brasileira
addEntries(cnpjDataMap, 'ALPHABET INC A (GOOGLE)', 'GOGL34 GOGL35', '33.479.023/0001-80'); // Depositária: Banco Citibank S.A.
addEntries(cnpjDataMap, 'THE COCA-COLA COMPANY', 'COCA34', '02.201.501/0001-61'); // Depositária: BNY Mellon Serviços Financeiros DTVM S/A
addEntries(cnpjDataMap, 'TREND ETF LBMA OURO FI INDICE IE', 'GOLD11', '37.985.763/0001-49');
addEntries(
  cnpjDataMap,
  'BUENA VISTA US HIGH INCOME ETF FDO INDICE',
  'SPYI11',
  '51.949.867/0001-29'
);

// == Populate with FII Data ==
addEntries(
  cnpjDataMap,
  'FUNDO DE INVESTIMENTO IMOBILIÁRIO GRAND PLAZA SHOPPING',
  'ABCP11',
  '01.201.140/0001-90'
);
addEntries(
  cnpjDataMap,
  'AF INVEST CRI FUNDO DE INVESTIMENTO IMOBILIÁRIO RECEBÍVEIS IMOBILIÁRIOS',
  'AFHI11',
  '36.642.293/0001-58'
);
addEntries(
  cnpjDataMap,
  'AUTONOMY EDIFÍCIOS CORPORATIVOS FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'AIEC11',
  '35.765.826/0001-26'
);
addEntries(
  cnpjDataMap,
  'FUNDO DE INVESTIMENTO IMOBILIÁRIO FII TORRE ALMIRANTE',
  'ALMI11',
  '07.122.725/0001-00'
);
addEntries(
  cnpjDataMap,
  'ALIANZA MULTIESTRATÉGIA FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'ALZM11',
  '34.847.063/0001-08'
);
addEntries(
  cnpjDataMap,
  'ALIANZA TRUST RENDA IMOBILIÁRIA FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'ALZR11',
  '28.737.771/0001-85'
);
addEntries(
  cnpjDataMap,
  'FUNDO DE INVESTIMENTO IMOBILIÁRIO ANCAR IC',
  'ANCR11B',
  '07.789.135/0001-27'
);
addEntries(
  cnpjDataMap,
  'NAVI RESIDENCIAL FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'APTO11',
  '42.432.327/0001-82'
);
addEntries(
  cnpjDataMap,
  'FUNDO DE INVESTIMENTO IMOBILIÁRIO APEX MALLS',
  'APXM11',
  '43.010.485/0001-07'
);
addEntries(
  cnpjDataMap,
  'AROEIRA 333 RENDA LOGÍSTICA FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'AROA11',
  '44.674.528/0001-11'
);
addEntries(
  cnpjDataMap,
  'FUNDO DE INVESTIMENTO IMOBILIÁRIO ÁTRIO REIT RECEBÍVEIS IMOBILIÁRIOS',
  'ARRI11',
  '32.006.821/0001-21'
);
addEntries(
  cnpjDataMap,
  'ARX DOVER RECEBÍVEIS FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'ARXD11',
  '44.527.494/0001-32'
);
addEntries(
  cnpjDataMap,
  'ASA METROPOLIS FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'ASMT11',
  '38.293.921/0001-62'
);
addEntries(
  cnpjDataMap,
  'ASA RETROFITS I FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'ASRF11',
  '45.188.033/0001-45'
);
addEntries(cnpjDataMap, 'HAZ FUNDO DE INVESTIMENTO IMOBILIÁRIO', 'ATCR11', '14.631.148/0001-39');
addEntries(
  cnpjDataMap,
  'HEDGE ATRIUM SHOPPING SANTO ANDRÉ FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'ATSA11',
  '12.809.972/0001-00'
);
addEntries(
  cnpjDataMap,
  'AIRPORT TOWN FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'ATWN11',
  '27.773.327/0001-52'
);
addEntries(
  cnpjDataMap,
  'ALIANZA URBAN HUB RENDA FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'AURB11',
  '41.076.823/0001-88'
);
addEntries(
  cnpjDataMap,
  'FUNDO DE INVESTIMENTO IMOBILIÁRIO BARIGUI RENDIMENTOS IMOBILIÁRIOS I FII',
  'BARI11',
  '29.267.567/0001-00'
);
addEntries(
  cnpjDataMap,
  'BB FUNDO DE INVESTIMENTO IMOBILIÁRIO PROGRESSIVO',
  'BBFI11B',
  '07.000.400/0001-46'
);
addEntries(
  cnpjDataMap,
  'BB FUNDO DE FUNDOS FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'BBFO11',
  '37.180.091/0001-02'
);
addEntries(
  cnpjDataMap,
  'BB RECEBÍVEIS IMOBILIÁRIOS FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'BBIM11',
  '20.716.161/0001-93'
);
addEntries(
  cnpjDataMap,
  'BB PROGRESSIVO II FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'BBPO11',
  '14.410.722/0001-29'
);
addEntries(
  cnpjDataMap,
  'BB RENDA CORPORATIVA FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'BBRC11',
  '12.681.340/0001-04'
);
addEntries(
  cnpjDataMap,
  'FUNDO DE INVESTIMENTO IMOBILIÁRIO BTG PACTUAL FUNDO DE FUNDOS',
  'BCFF11',
  '11.026.627/0001-38'
);
addEntries(
  cnpjDataMap,
  'BRADESCO CARTEIRA IMOBILIÁRIA ATIVA FUNDO DE FUNDOS DE INVESTIMENTO IMOBILIÁRIO',
  'BCIA11',
  '20.216.935/0001-17'
);
addEntries(
  cnpjDataMap,
  'BANESTES RECEBÍVEIS IMOBILIÁRIOS FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'BCRI11',
  '22.219.335/0001-38'
);
addEntries(
  cnpjDataMap,
  'BRIO CRÉDITO ESTRUTURADO FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'BICE11',
  '39.332.032/0001-20'
);
addEntries(
  cnpjDataMap,
  'INTER TÍTULOS IMOBILIÁRIOS FUNDO DE INVESTIMENTO IMOBILIARIO',
  'BICR11',
  '34.007.109/0001-72'
);
addEntries(
  cnpjDataMap,
  'BRIO MULTIESTRATÉGIA FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'BIME11',
  '41.081.356/0001-84'
);
addEntries(
  cnpjDataMap,
  'BRIO REAL ESTATE IV FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'BIPD11',
  '42.869.892/0001-01'
);
addEntries(
  cnpjDataMap,
  'BLUEMACAW CATUAÍ TRIPLE A FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'BLCA11',
  '41.076.748/0001-55'
);
addEntries(
  cnpjDataMap,
  'BLUEMACAW CRÉDITO IMOBILIÁRIO FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'BLMC11',
  '38.294.221/0001-92'
);
addEntries(
  cnpjDataMap,
  'BLUEMACAW LOGÍSTICA FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'BLMG11',
  '34.081.637/0001-71'
);
addEntries(
  cnpjDataMap,
  'BLUEMACAW OFFICE FUND II FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'BLMO11',
  '34.895.894/0001-47'
);
addEntries(
  cnpjDataMap,
  'BLUEMACAW RENDA+ FOF FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'BLMR11',
  '36.368.869/0001-30'
);
addEntries(
  cnpjDataMap,
  'FUNDO DE INVESTIMENTO IMOBILIÁRIO BLUE RECEBÍVEIS IMOBILIÁRIOS',
  'BLUR11',
  '38.051.307/0001-94'
);
addEntries(
  cnpjDataMap,
  'FUNDO BRASÍLIO MACHADO DE INVESTIMENTO IMOBILIÁRIO',
  'BMII11',
  '02.027.437/0001-44'
);
addEntries(
  cnpjDataMap,
  'FUNDO DE INVESTIMENTO IMOBILIÁRIO BM BRASCAN LAJES CORPORATIVAS',
  'BMLC11',
  '14.376.247/0001-11'
);
addEntries(
  cnpjDataMap,
  'BANRISUL NOVAS FRONTEIRAS FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'BNFS11',
  '15.570.431/0001-60'
);
addEntries(
  cnpjDataMap,
  'FUNDO DE INVESTIMENTO IMOBILIÁRIO BRASIL PLURAL ABSOLUTO FUNDO DE FUNDOS',
  'BPFF11',
  '17.324.357/0001-28'
);
addEntries(
  cnpjDataMap,
  'BASÍLICA PARTNERS LED CORPORATE FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'BPLC11',
  '28.267.555/0001-13'
);
addEntries(
  cnpjDataMap,
  'FUNDO DE INVESTIMENTO IMOBILIÁRIO BTG PACTUAL SHOPPINGS',
  'BPML11',
  '33.046.142/0001-49'
);
addEntries(
  cnpjDataMap,
  'FUNDO DE INVESTIMENTO IMOBILIÁRIO BRLPROP',
  'BPRP11',
  '29.800.650/0001-01'
);
addEntries(
  cnpjDataMap,
  'BRESCO LOGÍSTICA FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'BRCO11',
  '20.748.515/0001-81'
);
addEntries(
  cnpjDataMap,
  'FUNDO DE INVESTIMENTO IMOBILIÁRIO BTG PACTUAL CORPORATE OFFICE FUND',
  'BRCR11',
  '08.924.783/0001-01'
);
addEntries(
  cnpjDataMap,
  'BRAZIL REAL ESTATE VICTORY FUND I FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'BREV11',
  '26.195.121/0001-20'
);
addEntries(
  cnpjDataMap,
  'FUNDO DE INVESTIMENTO IMOBILIÁRIO BR HOTÉIS',
  'BRHT11B',
  '15.461.076/0001-91'
);
addEntries(
  cnpjDataMap,
  'BRIO REAL ESTATE II FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'BRIM11',
  '23.964.843/0001-03'
);
addEntries(
  cnpjDataMap,
  'BRIO REAL ESTATE III FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'BRIP11',
  '34.895.752/0001-80'
);
addEntries(cnpjDataMap, 'BRIX FUNDO DE INVESTIMENTO IMOBILIÁRIO', 'BRIX11', '35.360.651/0001-77');
addEntries(
  cnpjDataMap,
  'FUNDO DE INVESTIMENTO IMOBILIÁRIO BRL PROP II',
  'BRLA11',
  '35.652.278/0001-28'
);
addEntries(
  cnpjDataMap,
  'BRPR CORPORATE OFFICES FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'BROF11',
  '48.978.859/0001-04'
);
addEntries(
  cnpjDataMap,
  'BR7 SENADO FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'BRSE11',
  '40.944.736/0001-32'
);
addEntries(
  cnpjDataMap,
  'FUNDO DE INVESTIMENTO IMOBILIÁRIO BTG PACTUAL AGRO LOGÍSTICA',
  'BTAL11',
  '36.642.244/0001-15'
);
addEntries(
  cnpjDataMap,
  'FUNDO DE INVESTIMENTO IMOBILIÁRIO BTG PACTUAL CRÉDITO IMOBILIÁRIO',
  'BTCI11',
  '09.552.812/0001-14'
);
addEntries(
  cnpjDataMap,
  'BTG PACTUAL LOGÍSTICA FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'BTLG11',
  '11.839.593/0001-09'
);
addEntries(
  cnpjDataMap,
  'FUNDO DE INVESTIMENTO IMOBILIÁRIO BTG PACTUAL TERRAS AGRÍCOLAS',
  'BTRA11',
  '41.076.607/0001-32'
);
addEntries(cnpjDataMap, 'BTSP I FUNDO DE INVESTIMENTO IMOBILIÁRIO', 'BTSG11', '36.098.375/0001-83');
addEntries(
  cnpjDataMap,
  'BTSP II FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'BTSI11',
  '36.930.464/0001-44'
);
addEntries(
  cnpjDataMap,
  'BTOWERS FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'BTWR11',
  '20.132.453/0001-89'
);
addEntries(
  cnpjDataMap,
  'FUNDO DE INVESTIMENTO IMOBILIÁRIO BRASIL VAREJO',
  'BVAR11',
  '21.126.204/0001-43'
);
addEntries(cnpjDataMap, 'BARZEL FUNDO DE INVESTIMENTO IMOBILIÁRIO', 'BZEL11', '35.507.610/0001-60');
addEntries(
  cnpjDataMap,
  'BRAZIL REALTY FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'BZLI11',
  '14.074.706/0001-02'
);
addEntries(
  cnpjDataMap,
  'CARTESIA RECEBÍVEIS IMOBILIÁRIOS FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'CACR11',
  '32.065.364/0001-46'
);
addEntries(
  cnpjDataMap,
  'BRAZILIAN GRAVEYARD AND DEATH CARE SERVICES FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'CARE11',
  '13.584.584/0001-31'
);
addEntries(
  cnpjDataMap,
  'CASTELLO BRANCO OFFICE PARK FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'CBOP11',
  '17.144.039/0001-85'
);
addEntries(
  cnpjDataMap,
  'FUNDO DE INVESTIMENTO IMOBILIÁRIO CENTRAL LEBLON',
  'CCLB11',
  '45.777.347/0001-83'
);
addEntries(
  cnpjDataMap,
  'CANUMA CAPITAL MULTIESTRATÉGIA FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'CCME11',
  '43.010.844/0001-26'
);
addEntries(
  cnpjDataMap,
  'RBR CRI FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'CCRF11',
  '40.011.268/0001-43'
);
addEntries(
  cnpjDataMap,
  'FUNDO DE INVESTIMENTO IMOBILIÁRIO CEO CYRELA COMMERCIAL PROPERTIES',
  'CEOC11',
  '15.799.397/0001-09'
);
addEntries(cnpjDataMap, 'CF2 FUNDO DE INVESTIMENTO IMOBILIÁRIO', 'CFHI11', '34.508.923/0001-70');
addEntries(cnpjDataMap, 'CF3 FUNDO DE INVESTIMENTO IMOBILIÁRIO', 'CFII11', '41.325.993/0001-59');
addEntries(
  cnpjDataMap,
  'CIX RENDIMENTO FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'CIXR11',
  '47.086.230/0001-89'
);
addEntries(
  cnpjDataMap,
  'CIDADE JARDIM CONTINENTAL TOWER FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'CJCT11',
  '10.347.985/0001-80'
);
addEntries(cnpjDataMap, 'FUNDO DE INVESTIMENTO IMOBILIÁRIO CJ', 'CJFI11', '23.582.914/0001-03');
addEntries(
  cnpjDataMap,
  'FUNDO DE INVESTIMENTO IMOBILIÁRIO FII CENESP',
  'CNES11',
  '13.551.286/0001-45'
);
addEntries(
  cnpjDataMap,
  'CORPORATE OFFICE PROPERTIES FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'COPP11',
  '48.916.699/0001-60'
);
addEntries(
  cnpjDataMap,
  'CAPITÂNIA REIT FOF FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'CPFF11',
  '34.081.611/0001-23'
);
addEntries(
  cnpjDataMap,
  'CAPITÂNIA REIT FOF FUNDO DE INVESTIMENTO IMOBILIÁRIO II',
  'CPFO11',
  '48.916.246/0001-34'
);
addEntries(
  cnpjDataMap,
  'CAPITÂNIA SHOPPINGS FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'CPSH11',
  '47.896.665/0001-99'
);
addEntries(
  cnpjDataMap,
  'CAPITÂNIA SECURITIES II FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'CPTS11',
  '18.979.895/0001-13'
);
addEntries(
  cnpjDataMap,
  'CAIXA RIO BRAVO FUNDO DE FUNDOS DE INVESTIMENTO IMOBILIÁRIO II',
  'CRFF11',
  '31.887.401/0001-39'
);
addEntries(cnpjDataMap, 'COSMIC FUNDO DE INVESTIMENTO IMOBILIARIO', 'CSMC11', '41.081.336/0001-03');
addEntries(
  cnpjDataMap,
  'FUNDO DE INVESTIMENTO IMOBILIÁRIO CENTRO TÊXTIL INTERNACIONAL',
  'CTXT11',
  '00.762.723/0001-28'
);
addEntries(
  cnpjDataMap,
  'FUNDO DE INVESTIMENTO IMOBILIÁRIO VBI CRI',
  'CVBI11',
  '28.729.197/0001-13'
);
addEntries(
  cnpjDataMap,
  'CVPAR FUNDO DE INVESTIMENTO IMOBILIÁRIO DE CRI',
  'CVPR11',
  '38.294.329/0001-85'
);
addEntries(
  cnpjDataMap,
  'FUNDO DE INVESTIMENTO IMOBILIÁRIO CAIXA AGÊNCIAS',
  'CXAG11',
  '40.189.596/0001-34'
);
addEntries(
  cnpjDataMap,
  'FUNDO DE INVESTIMENTO IMOBILIÁRIO CAIXA CEDAE',
  'CXCE11B',
  '10.991.914/0001-15'
);
addEntries(
  cnpjDataMap,
  'FUNDO DE INVESTIMENTO IMOBILIÁRIO CAIXA CARTEIRA IMOBILIÁRIA',
  'CXCI11',
  '42.066.916/0001-94'
);
addEntries(
  cnpjDataMap,
  'FUNDO DE INVESTIMENTO IMOBILIÁRIO CAIXA IMÓVEIS CORPORATIVOS',
  'CXCO11',
  '38.658.984/0001-75'
);
addEntries(
  cnpjDataMap,
  'CAIXA RIO BRAVO FUNDO DE FUNDOS DE INVESTIMENTO IMOBILIÁRIO',
  'CXRI11',
  '17.098.794/0001-70'
);
addEntries(
  cnpjDataMap,
  'FUNDO DE INVESTIMENTO IMOBILIÁRIO CAIXA SEQ LOGÍSTICA RENDA',
  'CXTL11',
  '12.887.506/0001-43'
);
addEntries(
  cnpjDataMap,
  'CYRELA CRÉDITO FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'CYCR11',
  '36.501.233/0001-15'
);
addEntries(
  cnpjDataMap,
  'CYRELA DESENVOLVIMENTO LOGÍSTICO FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'CYLD11',
  '43.010.601/0001-98'
);
addEntries(
  cnpjDataMap,
  'DIAMANTE FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'DAMT11B',
  '26.642.727/0001-66'
);
addEntries(
  cnpjDataMap,
  'DEVANT RECEBÍVEIS IMOBILIÁRIOS FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'DEVA11',
  '37.087.810/0001-37'
);
addEntries(
  cnpjDataMap,
  'DEL MONTE AJAX FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'DLMT11',
  '28.108.193/0001-18'
);
addEntries(cnpjDataMap, 'DOVEL FUNDO DE INVESTIMENTO IMOBILIÁRIO', 'DOVL11B', '10.522.648/0001-81');
addEntries(
  cnpjDataMap,
  'DEVANT PROPERTIES FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'DPRO11',
  '42.922.127/0001-08'
);
addEntries(
  cnpjDataMap,
  'MULTIGESTÃO RENDA COMERCIAL FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'DRIT11B',
  '10.456.810/0001-00'
);
addEntries(
  cnpjDataMap,
  'FUNDO DE INVESTIMENTO IMOBILIÁRIO DEVANT FUNDO DE FUNDOS IMOBILIÁRIOS',
  'DVFF11',
  '39.863.059/0001-49'
);
addEntries(
  cnpjDataMap,
  'FUNDO DE INVESTIMENTO IMOBILIÁRIO EDIFÍCIO OURINVEST',
  'EDFO11B',
  '06.175.262/0001-73'
);
addEntries(
  cnpjDataMap,
  'FUNDO DE INVESTIMENTO IMOBILIÁRIO EDIFÍCIO GALERIA',
  'EDGA11',
  '15.333.306/0001-37'
);
addEntries(
  cnpjDataMap,
  'ENERGY RESORT FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'EGYR11',
  '36.969.658/0001-53'
);
addEntries(
  cnpjDataMap,
  'FUNDO DE INVESTIMENTO IMOBILIÁRIO ELDORADO',
  'ELDO11B',
  '13.022.994/0001-99'
);
addEntries(
  cnpjDataMap,
  'EQI RECEBÍVEIS IMOBILIÁRIOS FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'EQIR11',
  '41.076.380/0001-25'
);
addEntries(
  cnpjDataMap,
  'ESTOQUE RESIDENCIAL E COMERCIAL RIO DE JANEIRO FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'ERCR11',
  '37.266.902/0001-84'
);
addEntries(
  cnpjDataMap,
  'EUROPA 105 FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'ERPA11',
  '31.469.385/0001-64'
);
addEntries(
  cnpjDataMap,
  'FUNDO DE INVESTIMENTO IMOBILIÁRIO POLO ESTOQUE II',
  'ESTQ11',
  '18.497.672/0001-10'
);
addEntries(
  cnpjDataMap,
  'FUNDO DE INVESTIMENTO IMOBILIÁRIO EUROPAR',
  'EURO11',
  '05.437.916/0001-27'
);
addEntries(
  cnpjDataMap,
  'VBI CONSUMO ESSENCIAL FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'EVBI11',
  '34.691.520/0001-00'
);
addEntries(cnpjDataMap, 'EXES FUNDO DE INVESTIMENTO IMOBILIÁRIO', 'EXES11', '41.076.851/0001-03');
addEntries(
  cnpjDataMap,
  'FUNDO DE INVESTIMENTO IMOBILIÁRIO ANHANGUERA EDUCACIONAL',
  'FAED11',
  '11.179.118/0001-45'
);
addEntries(
  cnpjDataMap,
  'FATOR RENDA GALPÃO FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'FAGL11',
  '29.614.033/0001-03'
);
addEntries(
  cnpjDataMap,
  'FUNDO DE INVESTIMENTO IMOBILIÁRIO EDIFÍCIO ALMIRANTE BARROSO',
  'FAMB11B',
  '05.562.312/0001-02'
);
addEntries(
  cnpjDataMap,
  'FATOR RENDA URBANA FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'FARU11',
  '47.240.652/0001-67'
);
addEntries(
  cnpjDataMap,
  'FUNDO DE INVESTIMENTO IMOBILIÁRIO ATHENA I',
  'FATN11',
  '30.567.216/0001-02'
);
addEntries(
  cnpjDataMap,
  'FUNDO DE INVESTIMENTO IMOBILIÁRIO CAMPUS FARIA LIMA',
  'FCFL11',
  '11.602.654/0001-01'
);
addEntries(
  cnpjDataMap,
  'FUNDO DE INVESTIMENTO IMOBILIÁRIO GRAND PLAZA MALL',
  'FGPM11',
  '23.781.227/0001-17'
);
addEntries(
  cnpjDataMap,
  'GENERAL SHOPPING ATIVO E RENDA FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'FIGS11',
  '17.590.518/0001-25'
);
addEntries(
  cnpjDataMap,
  'FUNDO DE INVESTIMENTO IMOBILIÁRIO INDUSTRIAL DO BRASIL',
  'FIIB11',
  '14.217.108/0001-45'
);
addEntries(
  cnpjDataMap,
  'RB CAPITAL RENDA I FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'FIIP11B',
  '08.696.175/0001-97'
);
addEntries(
  cnpjDataMap,
  'FUNDO DE INVESTIMENTO IMOBILIÁRIO INFRA REAL ESTATE',
  'FINF11',
  '18.369.510/0001-04'
);
addEntries(cnpjDataMap, 'FUNDO DE INVESTIMENTO IMOBILIÁRIO SC 401', 'FISC11', '12.804.013/0001-00');
addEntries(
  cnpjDataMap,
  'SÃO DOMINGOS FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'FISD11',
  '16.543.270/0001-89'
);
addEntries(
  cnpjDataMap,
  'FUNDO DE INVESTIMENTO IMOBILIÁRIO VIDA NOVA',
  'FIVN11',
  '17.854.016/0001-64'
);
addEntries(
  cnpjDataMap,
  'FARIA LIMA CAPITAL RECEBÍVEIS IMOBILIÁRIOS I FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'FLCR11',
  '33.884.145/0001-51'
);
addEntries(
  cnpjDataMap,
  'FUNDO DE INVESTIMENTO IMOBILIÁRIO CONTINENTAL SQUARE FARIA LIMA',
  'FLMA11',
  '04.141.645/0001-03'
);
addEntries(
  cnpjDataMap,
  'FUNDO DE INVESTIMENTO IMOBILIÁRIO FLORIPA SHOPPING',
  'FLRP11',
  '10.375.382/0001-91'
);
addEntries(
  cnpjDataMap,
  'FUNDO DE INVESTIMENTO IMOBILIÁRIO MEMORIAL OFFICE',
  'FMOF11',
  '01.633.741/0001-72'
);
addEntries(
  cnpjDataMap,
  'FUNDO DE INVESTIMENTO IMOBILIÁRIO PROJETO ÁGUA BRANCA',
  'FPAB11',
  '03.251.720/0001-18'
);
addEntries(
  cnpjDataMap,
  'FUNDO DE INVESTIMENTO IMOBILIÁRIO PEDRA NEGRA RENDA IMOBILIÁRIA',
  'FPNG11',
  '17.161.979/0001-82'
);
addEntries(
  cnpjDataMap,
  'FRONTEIRA MULTI FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'FRHY11',
  '41.251.077/0001-11'
);
addEntries(
  cnpjDataMap,
  'OPPORTUNITY FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'FTCE11B',
  '01.235.622/0001-61'
);
addEntries(
  cnpjDataMap,
  'FUNDO DE INVESTIMENTO IMOBILIÁRIO VIA PARQUE SHOPPING',
  'FVPQ11',
  '00.332.266/0001-31'
);
addEntries(
  cnpjDataMap,
  'FUNDO DE INVESTIMENTO IMOBILIÁRIO GUARDIAN LOGÍSTICA',
  'GALG11',
  '37.295.919/0001-60'
);
addEntries(
  cnpjDataMap,
  'FUNDO DE INVESTIMENTO IMOBILIÁRIO GUARDIAN MULTIESTRATÉGIA IMOBILIÁRIA I',
  'GAME11',
  '41.269.052/0001-45'
);
addEntries(
  cnpjDataMap,
  'GALAPAGOS FUNDO DE FUNDOS FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'GCFF11',
  '35.652.154/0001-42'
);
addEntries(
  cnpjDataMap,
  'GALAPAGOS SPECIAL OPORTUNITIES FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'GCOI11',
  '46.285.299/0001-79'
);
addEntries(
  cnpjDataMap,
  'GALAPAGOS RECEBÍVEIS IMOBILIÁRIOS FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'GCRI11',
  '38.293.897/0001-61'
);
addEntries(
  cnpjDataMap,
  'FUNDO DE INVESTIMETO IMOBILIÁRIO GENERAL SEVERIANO',
  'GESE11B',
  '17.007.528/0001-95'
);
addEntries(
  cnpjDataMap,
  'GGR COVEPI RENDA FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'GGRC11',
  '26.614.291/0001-00'
);
addEntries(
  cnpjDataMap,
  'GENERAL SHOPPING E OUTLETS DO BRASIL FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'GSFI11',
  '11.769.604/0001-13'
);
addEntries(
  cnpjDataMap,
  'GTIS BRAZIL LOGISTICS FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'GTLG11',
  '36.200.677/0001-10'
);
addEntries(
  cnpjDataMap,
  'FUNDO DE INVESTIMENTO IMOBILIÁRIO GREEN TOWERS',
  'GTWR11',
  '23.740.527/0001-58'
);
addEntries(
  cnpjDataMap,
  'GENIAL RENDA URBANA FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'GURB11',
  '36.501.210/0001-00'
);
addEntries(
  cnpjDataMap,
  'FUNDO DE INVESTIMENTO IMOBILIÁRIO VBI GREENPOWER',
  'GVBI11',
  '49.581.652/0001-56'
);
addEntries(
  cnpjDataMap,
  'GAZIT MALLS FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'GZIT11',
  '15.447.108/0001-02'
);
addEntries(
  cnpjDataMap,
  'HEDGE AAA FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'HAAA11',
  '27.445.482/0001-40'
);
addEntries(
  cnpjDataMap,
  'HABITAT RECEBÍVEIS PULVERIZADOS FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'HABT11',
  '30.578.417/0001-05'
);
addEntries(
  cnpjDataMap,
  'FUNDO DE INVESTIMENTO IMOBILIÁRIO HBC RENDA URBANA',
  'HBCR11',
  '36.501.159/0001-37'
);
addEntries(
  cnpjDataMap,
  'FUNDO DE INVESTIMENTO IMOBILIÁRIO MULTI RENDA URBANA',
  'HBRH11',
  '30.871.698/0001-81'
);
addEntries(
  cnpjDataMap,
  'FUNDO DE INVESTIMENTO IMOBILIÁRIO HABITAT I',
  'HBTT11',
  '26.846.202/0001-42'
);
addEntries(
  cnpjDataMap,
  'HECTARE RECEBÍVEIS HIGH GRADE FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'HCHG11',
  '34.508.959/0001-54'
);
addEntries(
  cnpjDataMap,
  'FUNDO DE INVESTIMENTO IMOBILIÁRIO HOSPITAL DA CRIANÇA',
  'HCRI11',
  '04.066.582/0001-60'
);
addEntries(
  cnpjDataMap,
  'HECTARE DESENVOLVIMENTO STUDENT HOUSING FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'HCST11',
  '31.152.015/0001-07'
);
addEntries(
  cnpjDataMap,
  'HECTARE CE FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'HCTR11',
  '30.248.180/0001-96'
);
addEntries(
  cnpjDataMap,
  'HEDGE DESENVOLVIMENTO LOGÍSTICO FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'HDEL11',
  '44.514.162/0001-13'
);
addEntries(
  cnpjDataMap,
  'HEDGE PALADIN DESIGN OFFICES FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'HDOF11',
  '35.688.460/0001-39'
);
addEntries(
  cnpjDataMap,
  'HEDGE TOP FOFII 3 FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'HFOF11',
  '18.307.582/0001-19'
);
addEntries(
  cnpjDataMap,
  'HEDGE BRASIL SHOPPING FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'HGBS11',
  '08.431.747/0001-06'
);
addEntries(
  cnpjDataMap,
  'CSHG RECEBÍVEIS IMOBILIÁRIOS FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'HGCR11',
  '11.160.521/0001-22'
);
addEntries(
  cnpjDataMap,
  'CSHG IMOBILIÁRIO FOF FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'HGFF11',
  '32.784.898/0001-22'
);
addEntries(
  cnpjDataMap,
  'HGI CRÉDITOS IMOBILIÁRIOS FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'HGIC11',
  '38.456.508/0001-71'
);
addEntries(
  cnpjDataMap,
  'CSHG LOGÍSTICA FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'HGLG11',
  '11.728.688/0001-47'
);
addEntries(
  cnpjDataMap,
  'CSHG PRIME OFFICES FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'HGPO11',
  '11.260.134/0001-68'
);
addEntries(
  cnpjDataMap,
  'CSHG REAL ESTATE FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'HGRE11',
  '09.072.017/0001-29'
);
addEntries(
  cnpjDataMap,
  'CSHG RESIDENCIAL FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'HGRS11',
  '41.922.239/0001-04'
);
addEntries(
  cnpjDataMap,
  'CSHG RENDA URBANA FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'HGRU11',
  '29.641.226/0001-53'
);
addEntries(
  cnpjDataMap,
  'HIRE LOG I FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'HILG11',
  '34.867.728/0001-37'
);
addEntries(
  cnpjDataMap,
  'HEDGE LOGÍSTICA FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'HLOG11',
  '27.486.542/0001-72'
);
addEntries(
  cnpjDataMap,
  'HEDGE OFFICE INCOME FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'HOFC11',
  '31.894.369/0001-19'
);
addEntries(cnpjDataMap, 'FUNDO DE INVESTIMENTO IMOBILIÁRIO HOUSI', 'HOSI11', '34.081.631/0001-02');
addEntries(
  cnpjDataMap,
  'HEDGE SHOPPING PARQUE DOM PEDRO FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'HPDP11',
  '35.586.415/0001-73'
);
addEntries(
  cnpjDataMap,
  'HEDGE REALTY DEVELOPMENT FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'HRDF11',
  '16.929.519/0001-99'
);
addEntries(
  cnpjDataMap,
  'HEDGE RECEBÍVEIS IMOBILIÁRIOS FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'HREC11',
  '35.507.262/0001-21'
);
addEntries(
  cnpjDataMap,
  'HSI ATIVOS FINANCEIROS FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'HSAF11',
  '35.360.687/0001-50'
);
addEntries(
  cnpjDataMap,
  'HSI LOGÍSTICA FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'HSLG11',
  '32.903.621/0001-71'
);
addEntries(
  cnpjDataMap,
  'HSI MALLS FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'HSML11',
  '32.892.018/0001-31'
);
addEntries(
  cnpjDataMap,
  'HSI RENDA IMOBILIÁRIA FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'HSRE11',
  '08.098.114/0001-28'
);
addEntries(
  cnpjDataMap,
  'FUNDO DE INVESTIMENTO IMOBILIÁRIO HOTEL MAXINVEST',
  'HTMX11',
  '08.706.065/0001-69'
);
addEntries(
  cnpjDataMap,
  'FUNDO DE INVESTIMENTO IMOBILIÁRIO HOSPITAL UNIMED CAMPINA GRANDE',
  'HUCG11',
  '39.347.413/0001-82'
);
addEntries(
  cnpjDataMap,
  'FUNDO DE INVESTIMENTO IMOBILIÁRIO HOSPITAL UNIMED SUL CAPIXABA',
  'HUSC11',
  '28.851.767/0001-43'
);
addEntries(cnpjDataMap, 'HUSI FUNDO DE INVESTIMENTO IMOBILIÁRIO', 'HUSI11', '30.017.492/0001-99');
addEntries(
  cnpjDataMap,
  'FUNDO DE INVESTIMENTO IMOBILIÁRIO DE CRI INTEGRAL BREI',
  'IBCR11',
  '40.011.251/0001-96'
);
addEntries(
  cnpjDataMap,
  'FUNDO DE INVESTIMENTO IMOBILIÁRIO DE UNIDADES AUTÔNOMAS',
  'IDFI11',
  '32.774.914/0001-04'
);
addEntries(
  cnpjDataMap,
  'FUNDO DE INVESTIMENTO IMOBILIÁRIO IRIDIUM RECEBÍVEIS IMOBILIÁRIOS',
  'IRDM11',
  '28.830.325/0001-10'
);
addEntries(
  cnpjDataMap,
  'IRIDIUM FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'IRIM11',
  '41.076.564/0001-95'
);
addEntries(
  cnpjDataMap,
  'INTER TEVA ÍNDICE DE PAPEL FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'ITIP11',
  '36.312.772/0001-06'
);
addEntries(
  cnpjDataMap,
  'INTER TEVA ÍNDICE DE TIJOLO FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'ITIT11',
  '36.293.425/0001-83'
);
addEntries(
  cnpjDataMap,
  'JASC RENDA VAREJO ESSENCIAL FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'JASC11',
  '40.886.241/0001-02'
);
addEntries(
  cnpjDataMap,
  'JBFO FOF FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'JBFO11',
  '36.615.915/0001-59'
);
addEntries(
  cnpjDataMap,
  'JACARANDÁ I FUNDO DE INVESTIMENTO IMOBILIARIO',
  'JCDA11',
  '31.772.231/0001-47'
);
addEntries(
  cnpjDataMap,
  'JACARANDÁ 02 FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'JCDB11',
  '35.705.542/0001-44'
);
addEntries(
  cnpjDataMap,
  'JFL LIVING FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'JFLL11',
  '36.501.181/0001-87'
);
addEntries(
  cnpjDataMap,
  'JPP CAPITAL RECEBÍVEIS IMOBILIÁRIOS FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'JPPA11',
  '30.982.880/0001-00'
);
addEntries(
  cnpjDataMap,
  'JPP CAPITAL FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'JPPC11',
  '17.216.625/0001-98'
);
addEntries(
  cnpjDataMap,
  'FUNDO DE INVESTIMENTO IMOBILIÁRIO SHOPPING JARDIM SUL',
  'JRDM11',
  '14.879.856/0001-93'
);
addEntries(
  cnpjDataMap,
  'JS ATIVOS FINANCEIROS FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'JSAF11',
  '42.085.661/0001-07'
);
addEntries(
  cnpjDataMap,
  'JS REAL ESTATE MULTIGESTÃO FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'JSRE11',
  '13.371.132/0001-71'
);
addEntries(
  cnpjDataMap,
  'JT PREV FUNDO DE INVESTIMENTO IMOBILIÁRIO D. HAB',
  'JTPR11',
  '23.876.086/0001-16'
);
addEntries(
  cnpjDataMap,
  'KINEA CREDITAS FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'KCRE11',
  '42.502.802/0001-40'
);
addEntries(
  cnpjDataMap,
  'EVEN II KINEA FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'KEVE11',
  '32.317.313/0001-64'
);
addEntries(
  cnpjDataMap,
  'FUNDO DE FUNDOS DE INVESTIMENTO IMOBILIÁRIO KINEA FII',
  'KFOF11',
  '30.091.444/0001-40'
);
addEntries(
  cnpjDataMap,
  'EVEN PERMUTA KINEA FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'KINP11',
  '24.070.076/0001-51'
);
addEntries(
  cnpjDataMap,
  'KILIMA FUNDO DE INVESTIMENTO EM COTAS DE FUNDOS IMOBILIÁRIOS SUNO 30',
  'KISU11',
  '36.669.660/0001-07'
);
addEntries(
  cnpjDataMap,
  'KILIMA VOLKANO RECEBÍVEIS IMOBILIÁRIOS FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'KIVO11',
  '42.273.325/0001-98'
);
addEntries(
  cnpjDataMap,
  'KINEA RENDIMENTOS IMOBILIÁRIOS FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'KNCR11',
  '16.706.958/0001-32'
);
addEntries(
  cnpjDataMap,
  'KINEA HEDGE FUND FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'KNHF11',
  '42.754.342/0001-47'
);
addEntries(
  cnpjDataMap,
  'KINEA HIGH YIELD CRI FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'KNHY11',
  '30.130.708/0001-28'
);
addEntries(
  cnpjDataMap,
  'KINEA ÍNDICES DE PREÇOS FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'KNIP11',
  '24.960.430/0001-13'
);
addEntries(
  cnpjDataMap,
  'KINEA PREMIUM PROPERTIES FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'KNPR11',
  '42.737.059/0001-07'
);
addEntries(
  cnpjDataMap,
  'KINEA II REAL ESTATE EQUITY FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'KNRE11',
  '14.423.780/0001-97'
);
addEntries(
  cnpjDataMap,
  'KINEA RENDA IMOBILIÁRIA FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'KNRI11',
  '12.005.956/0001-65'
);
addEntries(
  cnpjDataMap,
  'KINEA SECURITIES FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'KNSC11',
  '35.864.448/0001-38'
);
addEntries(
  cnpjDataMap,
  'LEGATUS SHOPPINGS FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'LASC11',
  '30.248.158/0001-46'
);
addEntries(
  cnpjDataMap,
  'LATERES FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'LATR11B',
  '17.209.378/0001-00'
);
addEntries(
  cnpjDataMap,
  'LAVOURA FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'LAVF11',
  '37.467.733/0001-40'
);
addEntries(
  cnpjDataMap,
  'LOFT II FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'LFTT11',
  '24.796.967/0001-90'
);
addEntries(
  cnpjDataMap,
  'LOGCP INTER FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'LGCP11',
  '34.598.181/0001-11'
);
addEntries(
  cnpjDataMap,
  'LIFE CAPITAL PARTNERS FUNDO DE INVESTIMENTOS IMOBILIÁRIO',
  'LIFE11',
  '39.753.295/0001-02'
);
addEntries(
  cnpjDataMap,
  'FUNDO DE INVESTIMENTO IMOBILIÁRIO DEVELOPMENT V1',
  'LKDV11',
  '40.102.445/0001-05'
);
addEntries(
  cnpjDataMap,
  'BS2 ALLINVESTMENTS FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'LLAO11',
  '41.218.404/0001-33'
);
addEntries(
  cnpjDataMap,
  'LOFT I FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'LOFT11B',
  '19.722.048/0001-31'
);
addEntries(
  cnpjDataMap,
  'LAGO DA PEDRA FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'LPLP11',
  '37.262.752/0001-30'
);
addEntries(
  cnpjDataMap,
  'FUNDO DE INVESTIMENTO IMOBILIÁRIO LEBLON REALTY DESENVOLVIMENTO I',
  'LRDI11',
  '41.088.534/0001-07'
);
addEntries(
  cnpjDataMap,
  'LESTE RIVA EQUITY PREFERENCIAL I FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'LSPA11',
  '31.847.293/0001-70'
);
addEntries(cnpjDataMap, 'LUGGO FUNDO DE INVESTIMENTO IMOBILIÁRIO', 'LUGG11', '34.835.191/0001-23');
addEntries(
  cnpjDataMap,
  'FUNDO DE INVESTIMENTO IMOBILIÁRIO VBI LOGÍSTICO',
  'LVBI11',
  '30.629.603/0001-18'
);
addEntries(
  cnpjDataMap,
  'MALLS BRASIL PLURAL FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'MALL11',
  '26.499.833/0001-32'
);
addEntries(
  cnpjDataMap,
  'MANATÍ CAPITAL HEDGE FUND FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'MANA11',
  '42.888.583/0001-89'
);
addEntries(
  cnpjDataMap,
  'MORE GESTÃO ATIVA DE RECEBÍVEIS FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'MATV11',
  '41.076.678/0001-35'
);
addEntries(
  cnpjDataMap,
  'FUNDO DE INVESTIMENTO IMOBILIÁRIO MAX RETAIL',
  'MAXR11',
  '11.274.415/0001-70'
);
addEntries(
  cnpjDataMap,
  'FUNDO DE INVESTIMENTO IMOBILIÁRIO MAUÁ CAPITAL RECEBÍVEIS IMOBILIÁRIOS',
  'MCCI11',
  '23.648.935/0001-84'
);
addEntries(
  cnpjDataMap,
  'MAUÁ CAPITAL HEDGE FUND FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'MCHF11',
  '36.642.139/0001-86'
);
addEntries(
  cnpjDataMap,
  'FUNDO DE INVESTIMENTO IMOBILIÁRIO MAUÁ HIGH YIELD',
  'MCHY11',
  '36.655.973/0001-06'
);
addEntries(
  cnpjDataMap,
  'MÉRITO FUNDOS E AÇÕES IMOBILIÁRIAS FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'MFAI11',
  '32.397.369/0001-76'
);
addEntries(
  cnpjDataMap,
  'MÉRITO RECEBÍVEIS IMOBILIÁRIO FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'MFCR11',
  '45.403.337/0001-88'
);
addEntries(
  cnpjDataMap,
  'MÉRITO DESENVOLVIMENTO IMOBILIÁRIO I FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'MFII11',
  '16.915.968/0001-88'
);
addEntries(
  cnpjDataMap,
  'FUNDO DE INVESTIMENTO IMOBILIÁRIO MOGNO CERTIFICADOS DE RECEBÍVEIS IMOBILIÁRIOS HIGH GRADE',
  'MGCR11',
  '35.652.204/0001-91'
);
addEntries(
  cnpjDataMap,
  'FUNDO DE INVESTIMENTO IMOBILIÁRIO MOGNO FUNDO DE FUNDOS',
  'MGFF11',
  '29.216.463/0001-77'
);
addEntries(
  cnpjDataMap,
  'FUNDO DE INVESTIMENTO IMOBILIÁRIO MOGNO HOTÉIS',
  'MGHT11',
  '34.197.776/0001-65'
);
addEntries(
  cnpjDataMap,
  'MOGNO RENDA URBANA FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'MGRI11',
  '41.320.997/0001-44'
);
addEntries(
  cnpjDataMap,
  'FUNDO DE INVESTIMENTO IMOBILIÁRIO MINT EDUCACIONAL',
  'MINT11',
  '19.872.887/0001-36'
);
addEntries(
  cnpjDataMap,
  'FUNDO DE INVESTIMENTO IMOBILIÁRIO MAUÁ CAPITAL MPD DESENVOLVIMENTO RESIDENCIAL',
  'MMPD11',
  '41.080.968/0001-52'
);
addEntries(
  cnpjDataMap,
  'MARESIAS FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'MMVE11',
  '41.251.337/0001-59'
);
addEntries(
  cnpjDataMap,
  'MULTIOFFICES 2 FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'MOFF11',
  '31.508.219/0001-20'
);
addEntries(
  cnpjDataMap,
  'MORE RECEBÍVEIS IMOBILIÁRIOS FII FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'MORC11',
  '40.102.474/0001-69'
);
addEntries(
  cnpjDataMap,
  'MORE REAL ESTATE FOF FII FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'MORE11',
  '34.197.727/0001-22'
);
addEntries(
  cnpjDataMap,
  'ALIANZA MULTIOFFICES FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'MTOF11',
  '22.862.226/0001-34'
);
addEntries(cnpjDataMap, 'FUNDO DE INVESTIMENTO IMOBILIÁRIO MV9', 'MVFI11', '23.537.203/0001-17');
addEntries(
  cnpjDataMap,
  'MAXI RENDA FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'MXRF11',
  '97.521.225/0001-25'
);
addEntries(
  cnpjDataMap,
  'NAVI IMOBILIÁRIO TOTAL RETURN FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'NAVT11',
  '35.652.252/0001-80'
);
addEntries(
  cnpjDataMap,
  'FUNDO DE INVESTIMENTO IMOBILIÁRIO NCH BRASIL RECEBÍVEIS IMOBILIÁRIOS',
  'NCHB11',
  '18.085.673/0001-57'
);
addEntries(
  cnpjDataMap,
  'NAVI CRÉDITO IMOBILIÁRIO FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'NCRI11',
  '40.041.603/0001-56'
);
addEntries(
  cnpjDataMap,
  'NEWPORT LOGÍSTICA FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'NEWL11',
  '32.527.626/0001-47'
);
addEntries(
  cnpjDataMap,
  'NEWPORT RENDA URBANA FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'NEWU11',
  '14.793.782/0001-78'
);
addEntries(
  cnpjDataMap,
  'FUNDO DE INVESTIMENTO IMOBILIÁRIO HOSPITAL NOSSA SENHORA DE LOURDES',
  'NSLU11',
  '08.014.513/0001-63'
);
addEntries(
  cnpjDataMap,
  'FUNDO DE INVESTIMENTO IMOBILIÁRIO NOVO HORIZONTE',
  'NVHO11',
  '17.025.970/0001-44'
);
addEntries(
  cnpjDataMap,
  'NOVA I FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'NVIF11B',
  '22.003.469/0001-17'
);
addEntries(
  cnpjDataMap,
  'ÓRAMA HIGH YIELD FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'OGHY11',
  '47.240.631/0001-41'
);
addEntries(
  cnpjDataMap,
  'FUNDO DE INVESTIMENTO IMOBILIÁRIO THE ONE',
  'ONEF11',
  '12.948.291/0001-23'
);
addEntries(
  cnpjDataMap,
  'FUNDO DE INVESTIMENTO IMOBILIÁRIO OURINVEST FUNDO DE FUNDOS',
  'OUFF11',
  '30.791.386/0001-68'
);
addEntries(
  cnpjDataMap,
  'OURINVEST JPP FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'OUJP11',
  '26.091.656/0001-50'
);
addEntries(
  cnpjDataMap,
  'FUNDO DE INVESTIMENTO IMOBILIÁRIO OURINVEST LOGÍSTICA',
  'OULG11',
  '13.974.819/0001-00'
);
addEntries(
  cnpjDataMap,
  'FUNDO DE INVESTIMENTO IMOBILIÁRIO OURINVEST RENDA ESTRUTURADA',
  'OURE11',
  '28.516.650/0001-03'
);
addEntries(
  cnpjDataMap,
  'FUNDO DE INVESTIMENTO IMOBILIÁRIO PANAMBY',
  'PABY11',
  '00.613.094/0001-74'
);
addEntries(
  cnpjDataMap,
  'FUNDO DE INVESTIMENTO IMOBILIÁRIO PATEO BANDEIRANTES',
  'PATB11',
  '14.788.492/0001-36'
);
addEntries(
  cnpjDataMap,
  'PÁTRIA EDIFÍCIOS CORPORATIVOS FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'PATC11',
  '30.048.651/0001-12'
);
addEntries(
  cnpjDataMap,
  'PÁTRIA LOGÍSTICA FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'PATL11',
  '35.754.164/0001-99'
);
addEntries(
  cnpjDataMap,
  'PROLOGIS BRAZIL LOGISTICS VENTURE FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'PBLV11',
  '31.962.875/0001-06'
);
addEntries(
  cnpjDataMap,
  'PRAIA DO CASTELO FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'PCAS11',
  '24.514.406/0001-50'
);
addEntries(
  cnpjDataMap,
  'PERFORMA REAL ESTATE FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'PEMA11',
  '34.736.510/0001-43'
);
addEntries(
  cnpjDataMap,
  'PLURAL RECEBÍVEIS IMOBILIÁRIOS FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'PLCR11',
  '32.527.683/0001-26'
);
addEntries(
  cnpjDataMap,
  'PLURAL LOGÍSTICA FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'PLOG11',
  '36.501.198/0001-34'
);
addEntries(cnpjDataMap, 'POLO FII RECEBÍVEIS IMOBILIÁRIOS I', 'PLRI11', '14.080.689/0001-16');
addEntries(
  cnpjDataMap,
  'PANORAMA DESENVOLVIMENTO LOGÍSTICO FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'PNDL11',
  '37.899.400/0001-90'
);
addEntries(
  cnpjDataMap,
  'PANORAMA LAST MILE SBC FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'PNLN11',
  '40.887.170/0001-54'
);
addEntries(
  cnpjDataMap,
  'PANORAMA PROPERTIES FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'PNPR11',
  '26.813.118/0001-22'
);
addEntries(
  cnpjDataMap,
  'PANORAMA REAL ESTATE CRÉDITO FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'PNRC11',
  '46.157.348/0001-98'
);
addEntries(
  cnpjDataMap,
  'POLO CRÉDITO IMOBILIÁRIO FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'PORD11',
  '17.156.502/0001-09'
);
addEntries(
  cnpjDataMap,
  'PARQUE ANHANGUERA FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'PQAG11',
  '12.978.943/0001-72'
);
addEntries(
  cnpjDataMap,
  'FUNDO DE INVESTIMENTO IMOBILIÁRIO PARQUE DOM PEDRO SHOPPING CENTER',
  'PQDP11',
  '10.869.155/0001-12'
);
addEntries(
  cnpjDataMap,
  'PERSONALE I FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'PRSN11B',
  '14.056.001/0001-62'
);
addEntries(
  cnpjDataMap,
  'PRESIDENTE VARGAS FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'PRSV11',
  '11.281.322/0001-72'
);
addEntries(cnpjDataMap, 'PRAZO FUNDO DE INVESTIMENTO IMOBILIÁRIO', 'PRZS11', '30.258.790/0001-70');
addEntries(
  cnpjDataMap,
  'FUNDO DE INVESTIMENTO IMOBILIÁRIO VBI PRIME PROPERTIES',
  'PVBI11',
  '35.652.102/0001-76'
);
addEntries(
  cnpjDataMap,
  'QUASAR AGRO FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'QAGR11',
  '32.754.734/0001-52'
);
addEntries(
  cnpjDataMap,
  'QUASAR CRÉDITO IMOBILIÁRIO FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'QAMI11',
  '32.400.264/0001-29'
);
addEntries(
  cnpjDataMap,
  'RB CAPITAL DESENVOLVIMENTO RESIDENCIAL II FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'RBDS11',
  '11.945.604/0001-27'
);
addEntries(
  cnpjDataMap,
  'FUNDO DE INVESTIMENTO IMOBILIÁRIO RIO BRAVO RENDA EDUCACIONAL',
  'RBED11',
  '13.873.457/0001-52'
);
addEntries(
  cnpjDataMap,
  'RIO BRAVO FUNDO DE FUNDOS DE INVESTIMENTO IMOBILIÁRIO',
  'RBFF11',
  '17.329.029/0001-14'
);
addEntries(
  cnpjDataMap,
  'RIO BRAVO CRÉDITO IMOBILIÁRIO HIGH GRADE FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'RBHG11',
  '30.647.758/0001-87'
);
addEntries(
  cnpjDataMap,
  'RIO BRAVO CRÉDITO IMOBILIÁRIO HIGH YIELD FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'RBHY11',
  '37.899.479/0001-50'
);
addEntries(
  cnpjDataMap,
  'RB CAPITAL DESENVOLVIMENTO RESIDENCIAL IV FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'RBIR11',
  '31.161.410/0001-48'
);
addEntries(
  cnpjDataMap,
  'RB CAPITAL LOGÍSTICO FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'RBLG11',
  '35.652.227/0001-04'
);
addEntries(
  cnpjDataMap,
  'FUNDO DE INVESTIMENTO IMOBILIÁRIO RIO BRAVO OPORTUNIDADES IMOBILIÁRIAS',
  'RBOP11',
  '13.500.306/0001-59'
);
addEntries(
  cnpjDataMap,
  'RB CAPITAL RENDA II FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'RBRD11',
  '09.006.914/0001-34'
);
addEntries(
  cnpjDataMap,
  'RBR ALPHA MULTIESTRATÉGIA REAL ESTATE FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'RBRF11',
  '27.529.279/0001-51'
);
addEntries(
  cnpjDataMap,
  'FUNDO DE INVESTIMENTO IMOBILIÁRIO RBR DESENVOLVIMENTO III',
  'RBRI11',
  '32.441.656/0001-36'
);
addEntries(
  cnpjDataMap,
  'RBR LOG FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'RBRL11',
  '35.705.463/0001-33'
);
addEntries(
  cnpjDataMap,
  'FUNDO DE INVESTIMENTO IMOBILIÁRIO RBR DESENVOLVIMENTO',
  'RBRM11',
  '26.314.437/0001-93'
);
addEntries(
  cnpjDataMap,
  'FUNDO DE INVESTIMENTO IMOBILIÁRIO RBR PROPERTIES',
  'RBRP11',
  '21.408.063/0001-51'
);
addEntries(
  cnpjDataMap,
  'FUNDO DE INVESTIMENTO IMOBILIÁRIO RBR RENDIMENTO HIGH GRADE',
  'RBRR11',
  '29.467.977/0001-03'
);
addEntries(
  cnpjDataMap,
  'FUNDO DE INVESTIMENTO IMOBILIÁRIO RIO BRAVO RENDA RESIDENCIAL',
  'RBRS11',
  '36.517.660/0001-91'
);
addEntries(
  cnpjDataMap,
  'RBR PLUS MULTIESTRATÉGIA REAL ESTATE FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'RBRX11',
  '41.088.458/0001-21'
);
addEntries(
  cnpjDataMap,
  'FUNDO DE INVESTIMENTO IMOBILIÁRIO RBR CRÉDITO IMOBILIÁRIO ESTRUTURADO',
  'RBRY11',
  '30.166.700/0001-11'
);
addEntries(
  cnpjDataMap,
  'RB CAPITAL TFO SITUS FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'RBTS11',
  '29.299.737/0001-39'
);
addEntries(
  cnpjDataMap,
  'FUNDO DE INVESTIMENTO IMOBILIÁRIO RIO BRAVO RENDA VAREJO',
  'RBVA11',
  '15.576.907/0001-70'
);
addEntries(
  cnpjDataMap,
  'RIO BRAVO CRÉDITO IMOBILIÁRIO II FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'RBVO11',
  '15.769.670/0001-44'
);
addEntries(
  cnpjDataMap,
  'GRUPO RCFA FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'RCFA11',
  '27.771.586/0001-44'
);
addEntries(
  cnpjDataMap,
  'RBR DESENVOLVIMENTO COMERCIAL FEEDER FOF FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'RCFF11',
  '35.689.670/0001-41'
);
addEntries(cnpjDataMap, 'ROCK FUNDO DE INVESTIMENTO IMOBILIÁRIO', 'RCKF11', '43.010.139/0001-29');
addEntries(
  cnpjDataMap,
  'FUNDO DE INVESTIMENTO IMOBILIÁRIO RIO BRAVO RENDA CORPORATIVA',
  'RCRB11',
  '03.683.056/0001-86'
);
addEntries(
  cnpjDataMap,
  'BB RENDA DE PAPÉIS IMOBILIÁRIOS II FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'RDPD11',
  '23.120.027/0001-13'
);
addEntries(
  cnpjDataMap,
  'FUNDO DE INVESTIMENTO IMOBILIÁRIO REC RECEBÍVEIS IMOBILIÁRIOS',
  'RECR11',
  '28.152.272/0001-26'
);
addEntries(
  cnpjDataMap,
  'FUNDO DE INVESTIMENTO IMOBILIÁRIO REC RENDA IMOBILIÁRIA',
  'RECT11',
  '32.274.163/0001-59'
);
addEntries(
  cnpjDataMap,
  'FUNDO DE INVESTIMENTO IMOBILIÁRIO REC FUNDO DE FUNDOS',
  'RECX11',
  '36.642.356/0001-76'
);
addEntries(
  cnpjDataMap,
  'SINGULARE FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'REIT11',
  '16.841.067/0001-99'
);
addEntries(
  cnpjDataMap,
  'FUNDO DE INVESTIMENTO IMOBILIÁRIO REC LOGÍSTICA',
  'RELG11',
  '37.112.770/0001-36'
);
addEntries(
  cnpjDataMap,
  'RESIDENCIAIS ONE FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'REON11',
  '20.173.064/0001-00'
);
addEntries(
  cnpjDataMap,
  'FUNDO DE INVESTIMENTO IMOBILIÁRIO RB CAPITAL I FUNDO DE FUNDOS',
  'RFOF11',
  '34.027.774/0001-28'
);
addEntries(
  cnpjDataMap,
  'REAL INVESTOR FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'RINV11',
  '44.625.612/0001-45'
);
addEntries(
  cnpjDataMap,
  'REAG MULTI ATIVOS IMOBILIÁRIOS FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'RMAI11',
  '17.374.696/0001-19'
);
addEntries(
  cnpjDataMap,
  'BB RENDA DE PAPÉIS IMOBILIÁRIOS FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'RNDP11',
  '15.394.563/0001-89'
);
addEntries(
  cnpjDataMap,
  'FUNDO DE INVESTIMENTO IMOBILIÁRIO RIO NEGRO',
  'RNGO11',
  '15.006.286/0001-90'
);
addEntries(
  cnpjDataMap,
  'FUNDO DE INVESTIMENTO IMOBILIÁRIO ROOFTOP I',
  'ROOF11',
  '38.456.598/0001-09'
);
addEntries(
  cnpjDataMap,
  'RBR PREMIUM RECEBÍVEIS IMOBILIÁRIOS FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'RPRI11',
  '42.502.842/0001-91'
);
addEntries(
  cnpjDataMap,
  'RB CAPITAL RECEBÍVEIS IMOBILIÁRIOS FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'RRCI11',
  '35.689.733/0001-60'
);
addEntries(
  cnpjDataMap,
  'RB CAPITAL DESENVOLVIMENTO RESIDENCIAL III FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'RSPD11',
  '19.249.989/0001-08'
);
addEntries(
  cnpjDataMap,
  'VBI REITS FOF FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'RVBI11',
  '35.507.457/0001-71'
);
addEntries(
  cnpjDataMap,
  'RIZA AKIN FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'RZAK11',
  '36.642.219/0001-31'
);
addEntries(
  cnpjDataMap,
  'RIZA ARCTIUM REAL ESTATE FUNDO INVESTIMENTO IMOBILIÁRIO',
  'RZAT11',
  '28.267.696/0001-36'
);
addEntries(
  cnpjDataMap,
  'RIZA DOMUS MULTIESTRATÉGIA FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'RZDM11',
  '45.742.247/0001-11'
);
addEntries(
  cnpjDataMap,
  'FUNDO DE INVESTIMENTO IMOBILIÁRIO RIZA TERRAX',
  'RZTR11',
  '36.501.128/0001-86'
);
addEntries(
  cnpjDataMap,
  'SÃO CARLOS RENDA IMOBILIÁRIA FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'SACL11',
  '41.833.927/0001-90'
);
addEntries(
  cnpjDataMap,
  'SANTANDER PAPÉIS IMOBILIÁRIOS CDI FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'SADI11',
  '32.903.521/0001-45'
);
addEntries(
  cnpjDataMap,
  'FUNDO DE INVESTIMENTO IMOBILIÁRIO SIA CORPORATE',
  'SAIC11B',
  '17.311.079/0001-74'
);
addEntries(cnpjDataMap, 'VÊNUS FUNDO DE INVESTIMENTO IMOBILIÁRIO', 'SALI11', '36.669.535/0001-05');
addEntries(
  cnpjDataMap,
  'SANTANDER RENDA DE ALUGUÉIS FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'SARE11',
  '32.903.702/0001-71'
);
addEntries(
  cnpjDataMap,
  'FRAM CAPITAL SBCLOG FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'SBCL11',
  '34.471.719/0001-22'
);
addEntries(cnpjDataMap, 'SCP FUNDO DE INVESTIMENTO IMOBILIÁRIO', 'SCPF11', '01.657.856/0001-05');
addEntries(
  cnpjDataMap,
  'FUNDO DE INVESTIMENTO IMOBILIÁRIO SDI RIO BRAVO RENDA LOGÍSTICA',
  'SDIL11',
  '16.671.412/0001-93'
);
addEntries(
  cnpjDataMap,
  'HEDGE SEED FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'SEED11',
  '35.689.497/0001-81'
);
addEntries(
  cnpjDataMap,
  'SEQUÓIA III RENDA IMOBILIÁRIA FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'SEQR11',
  '09.517.273/0001-82'
);
addEntries(
  cnpjDataMap,
  'FUNDO DE INVESTIMENTO IMOBILIÁRIO SÃO FERNANDO',
  'SFND11',
  '09.350.920/0001-04'
);
addEntries(
  cnpjDataMap,
  'FUNDO DE INVESTIMENTO IMOBILIÁRIO SHOPPING PARQUE D PEDRO',
  'SHDP11B',
  '07.224.019/0001-60'
);
addEntries(
  cnpjDataMap,
  'MULTI SHOPPINGS FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'SHOP11',
  '22.459.737/0001-00'
);
addEntries(
  cnpjDataMap,
  'FUNDO DE INVESTIMENTO IMOBILIÁRIO SHOPPING PÁTIO HIGIENÓPOLIS',
  'SHPH11',
  '03.507.519/0001-59'
);
addEntries(
  cnpjDataMap,
  'SH SPECIAL OPPS FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'SHSO11',
  '44.527.168/0001-25'
);
addEntries(
  cnpjDataMap,
  'SIG CAPITAL RECEBÍVEIS PULVERIZADOS FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'SIGR11',
  '40.011.324/0001-40'
);
addEntries(
  cnpjDataMap,
  'SJ AU LOGÍSTICA FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'SJAU11',
  '27.771.547/0001-47'
);
addEntries(
  cnpjDataMap,
  'SUNO RECEBÍVEIS IMOBILIÁRIOS FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'SNCI11',
  '41.076.710/0001-82'
);
addEntries(
  cnpjDataMap,
  'SUNO ENERGIAS LIMPAS FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'SNEL11',
  '43.741.171/0001-84'
);
addEntries(
  cnpjDataMap,
  'SUNO FUNDO DE FUNDOS DE INVESTIMENTO IMOBILIÁRIO',
  'SNFF11',
  '40.011.225/0001-68'
);
addEntries(
  cnpjDataMap,
  'SUNO LOG FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'SNLG11',
  '40.041.711/0001-29'
);
addEntries(
  cnpjDataMap,
  'SOLARIUM FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'SOLR11',
  '22.169.671/0001-13'
);
addEntries(cnpjDataMap, 'SPA FUNDO DE INVESTIMENTO IMOBILIÁRIO', 'SPAF11', '18.311.024/0001-27');
addEntries(
  cnpjDataMap,
  'WHG FINVEST SP REALTY FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'SPDE11',
  '43.741.150/0001-69'
);
addEntries(
  cnpjDataMap,
  'SUPREMO FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'SPMO11',
  '40.225.262/0001-79'
);
addEntries(
  cnpjDataMap,
  'SP DOWNTOWN FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'SPTW11',
  '15.538.445/0001-05'
);
addEntries(
  cnpjDataMap,
  'FUNDO DE INVESTIMENTO IMOBILIÁRIO SUCCESPAR VAREJO',
  'SPVJ11',
  '27.538.422/0001-71'
);
addEntries(
  cnpjDataMap,
  'FUNDO DE INVESTIMENTO IMOBILIÁRIO SPX SYN MULTIESTRATÉGIA',
  'SPXS11',
  '43.010.543/0001-00'
);
addEntries(
  cnpjDataMap,
  'SERRA VERDE FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'SRVD11',
  '38.082.796/0001-41'
);
addEntries(cnpjDataMap, 'STARX FUNDO DE INVESTIMENTO IMOBILIÁRIO', 'STRX11', '11.044.355/0001-07');
addEntries(
  cnpjDataMap,
  'G5 CIDADE NOVA FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'TCIN11',
  '34.197.700/0001-30'
);
addEntries(
  cnpjDataMap,
  'TREECORP REAL ESTATE FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'TCPF11',
  '26.990.011/0001-50'
);
addEntries(
  cnpjDataMap,
  'TELLUS DESENVOLVIMENTO LOGÍSTICO FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'TELD11',
  '36.200.701/0001-11'
);
addEntries(
  cnpjDataMap,
  'TELLUS MULTIESTRATÉGIA FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'TELM11',
  '45.188.099/0001-35'
);
addEntries(
  cnpjDataMap,
  'TELLUS PROPERTIES FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'TEPP11',
  '26.681.370/0001-25'
);
addEntries(
  cnpjDataMap,
  'FUNDO DE INVESTIMENTO IMOBILIÁRIO TG ATIVO REAL',
  'TGAR11',
  '25.032.881/0001-53'
);
addEntries(
  cnpjDataMap,
  'TJK RENDA IMOBILIÁRIA FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'TJKB11',
  '39.714.024/0001-48'
);
addEntries(
  cnpjDataMap,
  'TORDESILHAS EI FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'TORD11',
  '30.230.870/0001-18'
);
addEntries(
  cnpjDataMap,
  'FUNDO DE INVESTIMENTO IMOBILIÁRIO TORRE NORTE',
  'TRNT11',
  '04.722.883/0001-02'
);
addEntries(
  cnpjDataMap,
  'TRX REAL ESTATE II FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'TRXB11',
  '36.368.925/0001-37'
);
addEntries(
  cnpjDataMap,
  'TRX REAL ESTATE FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'TRXF11',
  '28.548.288/0001-52'
);
addEntries(
  cnpjDataMap,
  'TISHMAN SPEYER RENDA CORPORATIVA FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'TSER11',
  '34.847.042/0001-84'
);
addEntries(
  cnpjDataMap,
  'TRANSINC FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'TSNC11',
  '17.007.443/0001-07'
);
addEntries(
  cnpjDataMap,
  'URCA PRIME RENDA FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'URPR11',
  '34.508.872/0001-87'
);
addEntries(
  cnpjDataMap,
  'VECTIS JUROS REAL FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'VCJR11',
  '32.400.250/0001-05'
);
addEntries(
  cnpjDataMap,
  'VINCI CREDIT SECURITIES FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'VCRI11',
  '41.081.374/0001-66'
);
addEntries(
  cnpjDataMap,
  'VECTIS RENDA RESIDENCIAL FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'VCRR11',
  '40.041.723/0001-53'
);
addEntries(
  cnpjDataMap,
  'VIC DESENVOLVIMENTO VINTAGE 22/23 FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'VDSV11',
  '43.951.875/0001-81'
);
addEntries(cnpjDataMap, 'FUNDO DE INVESTIMENTO IMOBILIÁRIO VEREDA', 'VERE11', '08.693.497/0001-82');
addEntries(
  cnpjDataMap,
  'VALORA HEDGE FUND FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'VGHF11',
  '36.771.692/0001-19'
);
addEntries(
  cnpjDataMap,
  'VALORA CRI ÍNDICE DE PREÇO FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'VGIP11',
  '34.197.811/0001-46'
);
addEntries(
  cnpjDataMap,
  'VALORA CRI CDI FUNDO DE INVESTIMENTO IMOBILIARIO',
  'VGIR11',
  '29.852.732/0001-91'
);
addEntries(
  cnpjDataMap,
  'VIC DESENVOLVIMENTO VINTAGE 20/21 FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'VIDS11',
  '32.527.552/0001-49'
);
addEntries(
  cnpjDataMap,
  'VINCI INSTRUMENTOS FINANCEIROS FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'VIFI11',
  '31.547.855/0001-60'
);
addEntries(
  cnpjDataMap,
  'VINCI LOGÍSTICA FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'VILG11',
  '24.853.044/0001-22'
);
addEntries(
  cnpjDataMap,
  'VINCI OFFICES FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'VINO11',
  '12.516.185/0001-70'
);
addEntries(
  cnpjDataMap,
  'VINCI SHOPPING CENTERS FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'VISC11',
  '17.554.274/0001-25'
);
addEntries(
  cnpjDataMap,
  'VINCI IMÓVEIS URBANOS FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'VIUR11',
  '36.445.587/0001-90'
);
addEntries(cnpjDataMap, 'JFDCAM FUNDO DE INVESTIMENTO IMOBILIÁRIO', 'VJFD11', '15.489.509/0001-17');
addEntries(
  cnpjDataMap,
  'VECTOR QUELUZ LAJES CORPORATIVAS FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'VLJS11',
  '13.842.683/0001-76'
);
addEntries(
  cnpjDataMap,
  'FUNDO DE INVESTIMENTO IMOBILIÁRIO VILA OLÍMPIA CORPORATE',
  'VLOL11',
  '15.296.696/0001-12'
);
addEntries(
  cnpjDataMap,
  'VOTORANTIM SECURITIES MASTER FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'VOTS11',
  '17.870.926/0001-30'
);
addEntries(
  cnpjDataMap,
  'FUNDO DE INVESTIMENTO IMOBILIÁRIO POLO SHOPPING INDAIATUBA',
  'VPSI11',
  '14.721.889/0001-00'
);
addEntries(
  cnpjDataMap,
  'FATOR VERITÀ FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'VRTA11',
  '11.664.201/0001-00'
);
addEntries(
  cnpjDataMap,
  'FUNDO DE INVESTIMENTO IMOBILIÁRIO VOTORANTIM SECURITIES',
  'VSEC11',
  '10.347.505/0001-80'
);
addEntries(
  cnpjDataMap,
  'FUNDO DE INVESTIMENTO IMOBILIÁRIO VOTORANTIM SHOPPING',
  'VSHO11',
  '23.740.595/0001-17'
);
addEntries(
  cnpjDataMap,
  'VERSALHES RECEBÍVEIS IMOBILIÁRIOS FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'VSLH11',
  '36.244.015/0001-42'
);
addEntries(
  cnpjDataMap,
  'FUNDO DE INVESTIMENTO IMOBILIÁRIO VOTORANTIM LOGÍSTICA',
  'VTLT11',
  '27.368.600/0001-63'
);
addEntries(
  cnpjDataMap,
  'FUNDO DE INVESTIMENTO IMOBILIÁRIO VOTORANTIM PATRIMONIAL V',
  'VTPA11',
  '21.500.481/0001-74'
);
addEntries(
  cnpjDataMap,
  'PARKING PARTNERS FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'VTVI11',
  '21.500.514/0001-86'
);
addEntries(
  cnpjDataMap,
  'FUNDO DE INVESTIMENTO IMOBILIÁRIO VOTORANTIM PATRIMONIAL XII',
  'VTXI11',
  '23.740.552/0001-31'
);
addEntries(
  cnpjDataMap,
  'FUNDO DE INVESTIMENTO IMOBILIÁRIO V2 PROPERTIES',
  'VVPR11',
  '33.045.581/0001-37'
);
addEntries(
  cnpjDataMap,
  'GENESIS MULTIESTRATÉGIA FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'VXXV11',
  '30.982.974/0001-89'
);
addEntries(
  cnpjDataMap,
  'WHG REAL ESTATE FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'WHGR11',
  '41.256.643/0001-88'
);
addEntries(
  cnpjDataMap,
  'SHOPPING WEST PLAZA FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'WPLZ11',
  '09.326.861/0001-39'
);
addEntries(
  cnpjDataMap,
  'WARREN SECURITIES FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'WSEC11',
  '43.440.579/0001-16'
);
addEntries(
  cnpjDataMap,
  'FUNDO DE INVESTIMENTO IMOBILIÁRIO OURINVEST RE I',
  'WTSP11B',
  '28.693.595/0001-27'
);
addEntries(
  cnpjDataMap,
  'R CAP 1810 FUNDO DE FUNDOS FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'XBXO11',
  '36.814.809/0001-02'
);
addEntries(
  cnpjDataMap,
  'XP CRÉDITO IMOBILIÁRIO FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'XPCI11',
  '28.516.301/0001-91'
);
addEntries(
  cnpjDataMap,
  'XP CORPORATE MACAÉ FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'XPCM11',
  '16.802.320/0001-03'
);
addEntries(
  cnpjDataMap,
  'XP HOTÉIS FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'XPHT11',
  '18.308.516/0001-63'
);
addEntries(
  cnpjDataMap,
  'XP INDUSTRIAL FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'XPIN11',
  '28.516.325/0001-40'
);
addEntries(cnpjDataMap, 'XP LOG FUNDO DE INVESTIMENTO IMOBILIÁRIO', 'XPLG11', '26.502.794/0001-85');
addEntries(
  cnpjDataMap,
  'XP MALLS FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'XPML11',
  '28.757.546/0001-00'
);
addEntries(
  cnpjDataMap,
  'XP PROPERTIES FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'XPPR11',
  '30.654.849/0001-40'
);
addEntries(
  cnpjDataMap,
  'XP SELECTION FUNDO DE FUNDOS DE INVESTIMENTO IMOBILIÁRIO',
  'XPSF11',
  '30.983.020/0001-90'
);
addEntries(cnpjDataMap, 'YUCA FUNDO DE INVESTIMENTO IMOBILIÁRIO', 'YUFI11', '36.445.551/0001-06');
addEntries(
  cnpjDataMap,
  'ZAVIT REAL ESTATE FUND FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'ZAVI11',
  '40.575.940/0001-23'
);
addEntries(
  cnpjDataMap,
  'ZION CAPITAL FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  'ZIFI11',
  '35.820.768/0001-96'
);

// Manual inserts

addEntries(cnpjDataMap, 'CIA PARANAENSE DE ENERGIA - COPEL', 'CPLE6', '76.483.817/0001-20');
addEntries(
  cnpjDataMap,
  'FDO DE INVEST IMOB TELLUS RIO BRAVO RENDA LOGISTIC',
  'TRBL11',
  '16.671.412/0001-93'
);
addEntries(
  cnpjDataMap,
  'BTG PACTUAL REAL ESTATE HEDGE FUND FII - RESP LTDA',
  'BTHF11',
  '45.188.176/0001-57'
);

// TODO: Tentar usar esse site como referência:
// https://www.mobills.com.br/blog/investimentos/cnpj-das-empresas-listadas-na-b3/
//
