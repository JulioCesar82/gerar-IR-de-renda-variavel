import React from 'react';
import { 
  Typography, 
  Button, 
  Paper, 
  Box, 
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Divider,
  Collapse,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Link,
  Tooltip,
  Snackbar
} from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import CloseIcon from '@mui/icons-material/Close';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { DataGrid, GridColDef } from '@mui/x-data-grid';

import { createPortal } from 'react-dom';
import { useAppContext } from '../context/AppContext';
import { useNavFooter } from '../context/NavFooterContext';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { Container } from '../../infrastructure/di/Container';
import { tryDownloadFile } from '../../utils/presentation';
import { AssetPosition } from 'src/core/domain/AssetPosition';
import { AssetCategory } from '../../core/domain/Transaction';

/**
 * Returns the Grupo and Código values shown in the IRPF program's
 * "Bens e Direitos" section for a given asset position.
 */
const getIRPFGrupoCodigo = (pos: AssetPosition): { grupo: string; codigo: string } => {
  switch (pos.assetCategory) {
    case AssetCategory.STOCK:
      return { grupo: '03', codigo: '01' };
    case AssetCategory.BDR:
      return { grupo: '04', codigo: '04' };
    case AssetCategory.FII:
      return { grupo: '07', codigo: '03' };
    case AssetCategory.ETF:
      return { grupo: '07', codigo: '10' };
    default:
      return { grupo: '99', codigo: '99' };
  }
};

/**
 * Builds the "Discriminação" text for an asset position,
 * matching the format used in the generated DBK / Excel files.
 */
const buildDiscriminacao = (pos: AssetPosition): string => {
  const qty = pos.quantity.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 4 });
  const pm  = pos.averagePrice.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 4 });
  const total = pos.totalCost.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const cnpj = pos.cnpj || 'CNPJ_NAO_ENCONTRADO';
  const suffix = ' administrado por Nu Investimentos S.A., CNPJ 62.169.875/0001-79.';

  if (pos.assetCategory === AssetCategory.FII) {
    return `${qty} Cotas do FII ${pos.assetName} (${pos.assetCode}), Custo Médio R$ ${pm} que totaliza R$ ${total}. CNPJ: ${cnpj}${suffix}`;
  }
  return `${qty} Ações de ${pos.assetName} (${pos.assetCode}), Custo Médio R$ ${pm} que totaliza R$ ${total}. CNPJ: ${cnpj}${suffix}`;
};

/**
 * Dialog to show asset calculation details
 */
const AssetDetailsDialog: React.FC<{ 
  asset: AssetPosition | null, 
  open: boolean, 
  onClose: () => void 
}> = ({ asset, open, onClose }) => {
  if (!asset) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">
          Detalhamento de Cálculo: {asset.assetCode} - {asset.assetName}
        </Typography>
        <IconButton aria-label="close" onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <TableContainer component={Paper} variant="outlined">
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Data</TableCell>
                <TableCell>Operação/Evento</TableCell>
                <TableCell align="right">Qtd</TableCell>
                <TableCell align="right">Preço Unit.</TableCell>
                <TableCell align="right">Valor Total</TableCell>
                <TableCell align="right" sx={{ bgcolor: 'action.hover', fontWeight: 'bold' }}>Qtd Final</TableCell>
                <TableCell align="right" sx={{ bgcolor: 'action.hover', fontWeight: 'bold' }}>Preço Médio</TableCell>
                <TableCell align="right" sx={{ bgcolor: 'action.hover', fontWeight: 'bold' }}>Custo Total</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {asset.transactionsHistory.map((entry, idx) => (
                <TableRow key={idx}>
                  <TableCell>{formatDate(entry.date)}</TableCell>
                  <TableCell>{entry.description || entry.type}</TableCell>
                  <TableCell align="right">{entry.quantity.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 4 })}</TableCell>
                  <TableCell align="right">{formatCurrency(entry.unitPrice)}</TableCell>
                  <TableCell align="right">{formatCurrency(entry.totalValue)}</TableCell>
                  <TableCell align="right" sx={{ bgcolor: 'action.hover' }}>
                    {entry.resultingQuantity?.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 4 })}
                  </TableCell>
                  <TableCell align="right" sx={{ bgcolor: 'action.hover' }}>
                    {formatCurrency(entry.resultingAveragePrice || 0)}
                  </TableCell>
                  <TableCell align="right" sx={{ bgcolor: 'action.hover' }}>
                    {formatCurrency(entry.resultingTotalCost || 0)}
                  </TableCell>
                </TableRow>
              ))}
              {asset.transactionsHistory.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} align="center">Nenhum histórico disponível.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <Box sx={{ mt: 2 }}>
          <Typography variant="caption" color="text.secondary">
            * O Preço Médio e Custo Total são recalculados após cada operação de compra ou evento que altere o custo (ex: bonificação com custo atribuído).
            Vendas reduzem a quantidade e o custo total proporcionalmente, mantendo o preço médio inalterado.
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary">Fechar</Button>
      </DialogActions>
    </Dialog>
  );
};

/**
 * Collapsible row for monthly results
 */
const CollapsibleRow: React.FC<{ row: any, onAssetClick: (assetCode: string) => void }> = (props) => {
  const { row, onAssetClick } = props;
  const [open, setOpen] = React.useState(false);

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  return (
    <React.Fragment>
      <TableRow sx={{ '& > *': { borderBottom: 'unset' } }}>
        <TableCell width="50">
          <IconButton
            aria-label="expand row"
            size="small"
            onClick={() => setOpen(!open)}
          >
            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </TableCell>
        <TableCell component="th" scope="row">
          {monthNames[row.month - 1]}
        </TableCell>
        <TableCell align="right">{formatCurrency(row.totalSalesValue)}</TableCell>
        <TableCell align="right" sx={{ color: row.netResult < 0 ? 'error.main' : 'success.main' }}>
          {formatCurrency(row.netResult)}
        </TableCell>
        <TableCell align="right">{formatCurrency(row.taxDue)}</TableCell>
        <TableCell align="right">{formatCurrency(row.taxWithheld)}</TableCell>
        <TableCell align="right">{formatCurrency(row.taxToPay)}</TableCell>
      </TableRow>
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={7}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ margin: 1 }}>
              <Typography variant="subtitle2" gutterBottom component="div" sx={{ fontWeight: 'bold' }}>
                Detalhamento dos Ativos ({row.assetCategory})
              </Typography>
              <Table size="small" aria-label="trades">
                <TableHead>
                  <TableRow>
                    <TableCell>Código</TableCell>
                    <TableCell>Nome</TableCell>
                    <TableCell align="right">Qtd</TableCell>
                    <TableCell align="right">Preço Médio</TableCell>
                    <TableCell align="right">Preço Venda</TableCell>
                    <TableCell align="right">Venda Bruta</TableCell>
                    <TableCell align="right">Resultado</TableCell>
                    <TableCell align="right">Isento</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {row.tradeResults.map((trade: any, idx: number) => (
                    <TableRow key={idx}>
                      <TableCell>{trade.assetCode}</TableCell>
                      <TableCell>
                        <Link 
                          component="button" 
                          variant="body2" 
                          onClick={() => onAssetClick(trade.assetCode)}
                          sx={{ textAlign: 'left' }}
                        >
                          {trade.assetName}
                        </Link>
                      </TableCell>
                      <TableCell align="right">{trade.quantity}</TableCell>
                      <TableCell align="right">{formatCurrency(trade.purchasePrice)}</TableCell>
                      <TableCell align="right">{formatCurrency(trade.salePrice)}</TableCell>
                      <TableCell align="right">{formatCurrency(trade.saleValue)}</TableCell>
                      <TableCell align="right" sx={{ color: trade.profitOrLoss < 0 ? 'error.main' : 'success.main' }}>
                        {formatCurrency(trade.profitOrLoss)}
                      </TableCell>
                      <TableCell align="right">{trade.isExempt ? 'Sim' : 'Não'}</TableCell>
                    </TableRow>
                  ))}
                  {row.tradeResults.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} align="center">Nenhum trade detalhado para este mês.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </React.Fragment>
  );
};

/**
 * Result page component
 */
export const ResultPage: React.FC = () => {
  const { state, actions } = useAppContext();
  const { currentSessionData, currentSessionId } = state;
  const { generateDBKFile, generateExcelFile, setActiveStep } = actions;
  const navFooter = useNavFooter();

  // State for asset details dialog
  const [selectedAsset, setSelectedAsset] = React.useState<AssetPosition | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = React.useState<boolean>(false);

  // Snackbar for copy feedback
  const [copySnackbar, setCopySnackbar] = React.useState(false);
  
  // State to track if original DBK file exists
  const [hasOriginalDBK, setHasOriginalDBK] = React.useState<boolean>(false);
  
  // Check if original DBK file exists
  React.useEffect(() => {
    const checkOriginalDBK = async () => {
      if (currentSessionId) {
        try {
          const storage = Container.getInstance().getStorage();
          const originalContent = await storage.getOriginalDBK(currentSessionId);
          setHasOriginalDBK(!!originalContent);
        } catch (error) {
          console.error('Error checking original DBK file:', error);
          setHasOriginalDBK(false);
        }
      } else {
        setHasOriginalDBK(false);
      }
    };
    
    checkOriginalDBK();
  }, [currentSessionId]);

  /**
   * Handle DBK download click
   */
  const handleDBKDownloadClick = async () => {
    try {
      const blob = await generateDBKFile();
      
      tryDownloadFile(blob, `irpf_${new Date().getFullYear()}.dbk`);    
    } catch (error) {
      console.error('Error generating .DBK file:', error);
      alert('Erro ao gerar arquivo .DBK');
    }
  };

   /**
   * Handle Excel download click
   */
  const handleDownloadExcel = async () => {
    try {
      const excelBlob = await generateExcelFile();
  
      tryDownloadFile(excelBlob, `irpf_${new Date().getFullYear()}.xlsx`);    
    } catch (error) {
      console.error('Error generating Excel file:', error);
      alert('Erro ao gerar arquivo Excel');
    }
  };
  
  /**
   * Handle original DBK download click
   */
  const handleOriginalDBKDownloadClick = async () => {
    try {
      if (!currentSessionId) {
        throw new Error('No session selected');
      }
      
      // Get original DBK content
      const storage = Container.getInstance().getStorage();
      const originalContent = await storage.getOriginalDBK(currentSessionId);
      
      if (!originalContent) {
        alert('Arquivo DBK original não encontrado');
        return;
      }
      
      // Create a Blob with the original content
      const blob = new Blob([originalContent], { type: 'application/octet-stream' });
      
      tryDownloadFile(blob, `irpf_original_${new Date().getFullYear()}.dbk`);    
    } catch (error) {
      console.error('Error downloading original DBK file:', error);
      alert('Erro ao baixar arquivo DBK original');
    }
  };
  
  /**
   * Handle back click
   */
  const handleBackClick = () => {
    setActiveStep(2);
  };
  
  /**
   * Handle new declaration click
   */
  const handleNewDeclarationClick = () => {
    setActiveStep(0);
  };
  
  // Check if declaration is generated
  const isGenerated = currentSessionData?.generatedDeclaration !== undefined;
  
  if (!isGenerated) {
    return (
      <Box>
        <Typography variant="h4" component="h1" gutterBottom>
          Resultado
        </Typography>
        
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="body1" paragraph>
            Nenhuma declaração foi gerada ainda.
          </Typography>
          
          <Button
            variant="contained"
            color="primary"
            onClick={() => setActiveStep(2)}
          >
            Gerar Declaração
          </Button>
        </Paper>
      </Box>
    );
  }
  
  const declaration = currentSessionData!.generatedDeclaration!;
  const taxPayerInfo = declaration.taxPayerInfo;
  
  /**
   * Handle asset name click
   */
  const handleAssetClick = (assetCode: string) => {
    const asset = declaration.assetPositions.find(p => p.assetCode === assetCode);
    if (asset) {
      setSelectedAsset(asset);
      setIsDetailsOpen(true);
    }
  };

  /**
   * Handle details dialog close
   */
  const handleDetailsClose = () => {
    setIsDetailsOpen(false);
  };

  // Define columns for the Assets DataGrid
  const assetColumns: GridColDef[] = [
    { field: 'assetCode', headerName: 'Código', width: 110 },
    { 
      field: 'assetName', 
      headerName: 'Nome', 
      width: 190,
      renderCell: (params) => (
        <Link 
          component="button" 
          variant="body2" 
          onClick={() => handleAssetClick(params.row.assetCode)}
          sx={{ textAlign: 'left' }}
        >
          {params.value}
        </Link>
      )
    },
    { field: 'assetCategory', headerName: 'Categoria', width: 120 },
    {
      field: '_grupo',
      headerName: 'Grupo',
      width: 70,
      sortable: false,
      filterable: false,
      renderCell: (params) => getIRPFGrupoCodigo(params.row as AssetPosition).grupo,
    },
    {
      field: '_codigo',
      headerName: 'Código',
      width: 70,
      sortable: false,
      filterable: false,
      renderCell: (params) => getIRPFGrupoCodigo(params.row as AssetPosition).codigo,
    },
    { 
      field: 'quantity', 
      headerName: 'Quantidade', 
      type: 'number',
      width: 120,
      align: 'right',
      headerAlign: 'right'
    },
    { 
      field: 'averagePrice', 
      headerName: 'Preço Médio', 
      type: 'number',
      width: 140,
      align: 'right',
      headerAlign: 'right',
      valueFormatter: (params) => formatCurrency(params.value)
    },
    { 
      field: 'totalCost', 
      headerName: 'Valor Total', 
      type: 'number',
      width: 140,
      align: 'right',
      headerAlign: 'right',
      valueFormatter: (params) => formatCurrency(params.value)
    },
    {
      field: '_copy',
      headerName: 'Discriminação',
      width: 120,
      sortable: false,
      filterable: false,
      renderCell: (params) => {
        const pos = params.row as AssetPosition;
        const text = buildDiscriminacao(pos);
        return (
          <Tooltip title={text} placement="left">
            <IconButton
              size="small"
              onClick={() => {
                navigator.clipboard.writeText(text);
                setCopySnackbar(true);
              }}
            >
              <ContentCopyIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        );
      }
    }
  ];
  
  // Prepare rows for the Assets DataGrid
  const assetRows = declaration.assetPositions.map((asset, index) => ({
    id: index, // DataGrid requires a unique id for each row
    ...asset
  }));
  
  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Resultado
      </Typography>
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Declaração Gerada com Sucesso
        </Typography>
        
        <Typography variant="body1" paragraph>
          A declaração foi gerada com sucesso e está pronta para ser importada no programa da Receita Federal.
        </Typography>
        
        <Divider sx={{ my: 3 }} />
        
        <Typography variant="h6" gutterBottom>
          Resumo da Declaração
        </Typography>
        
        <Stack spacing={3}>
          <Box>
            <Typography variant="subtitle1" gutterBottom>
              Informações do Contribuinte
            </Typography>
            
            <Stack spacing={1}>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Nome
                </Typography>
                <Typography variant="body1">
                  {taxPayerInfo.name}
                </Typography>
              </Box>
              
              <Box>
                <Typography variant="body2" color="text.secondary">
                  CPF
                </Typography>
                <Typography variant="body1">
                  {taxPayerInfo.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')}
                </Typography>
              </Box>
              
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Endereço
                </Typography>
                <Typography variant="body1">
                  {`${taxPayerInfo.address.street}, ${taxPayerInfo.address.number}${taxPayerInfo.address.complement ? `, ${taxPayerInfo.address.complement}` : ''}`}
                </Typography>
                <Typography variant="body1">
                  {`${taxPayerInfo.address.neighborhood}, ${taxPayerInfo.address.city} - ${taxPayerInfo.address.state}, ${taxPayerInfo.address.zipCode.replace(/(\d{5})(\d{3})/, '$1-$2')}`}
                </Typography>
              </Box>
            </Stack>
          </Box>
          
          <Box>
            <Typography variant="subtitle1" gutterBottom>
              Resumo Financeiro
            </Typography>
            
            <TableContainer>
              <Table size="small">
                <TableBody>
                  <TableRow>
                    <TableCell component="th" scope="row">Total de Rendimentos</TableCell>
                    <TableCell align="right">{formatCurrency(declaration.totalIncome)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell component="th" scope="row">Total de Bens</TableCell>
                    <TableCell align="right">{formatCurrency(declaration.totalAssetsValue)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell component="th" scope="row">Imposto Devido</TableCell>
                    <TableCell align="right">{formatCurrency(declaration.totalTaxDue)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell component="th" scope="row">Imposto Retido na Fonte</TableCell>
                    <TableCell align="right">{formatCurrency(declaration.totalTaxWithheld)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell component="th" scope="row">Imposto a Pagar</TableCell>
                    <TableCell align="right">{formatCurrency(declaration.totalTaxToPay)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell component="th" scope="row">Prejuízo a Compensar</TableCell>
                    <TableCell align="right">{formatCurrency(declaration.remainingLoss)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
          
          <Box>
            <Typography variant="subtitle1" gutterBottom>
              Ativos
            </Typography>
            
            <Box sx={{ width: '100%' }}>
              <DataGrid
                rows={assetRows}
                columns={assetColumns}
                initialState={{
                  sorting: {
                    sortModel: [{ field: 'assetCode', sort: 'asc' }],
                  },
                }}
                hideFooter
                checkboxSelection={false}
                disableRowSelectionOnClick
                density="standard"
                sx={{ 
                  '& .MuiDataGrid-cell': { fontSize: '0.875rem' },
                  '& .MuiDataGrid-columnHeader': { fontSize: '0.875rem', fontWeight: 'bold' },
                  '& .negative-value': { color: 'error.main' },
                  '& .positive-value': { color: 'success.main' }
                }}
              />
            </Box>
          </Box>
          
          <Box>
            <Typography variant="subtitle1" gutterBottom>
              Resultados Mensais
            </Typography>
            
            <TableContainer component={Paper} variant="outlined">
              <Table aria-label="collapsible table" size="small">
                <TableHead>
                  <TableRow>
                    <TableCell width="50" />
                    <TableCell>Mês</TableCell>
                    <TableCell align="right">Vendas</TableCell>
                    <TableCell align="right">Lucro/Prejuízo</TableCell>
                    <TableCell align="right">Imp. Devido</TableCell>
                    <TableCell align="right">Imp. Retido</TableCell>
                    <TableCell align="right">Imp. a Pagar</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {declaration.monthlyResults.map((row, idx) => (
                    <CollapsibleRow 
                      key={`${row.year}-${row.month}-${idx}`} 
                      row={row} 
                      onAssetClick={handleAssetClick}
                    />
                  ))}
                  {declaration.monthlyResults.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} align="center">Nenhum resultado mensal encontrado.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </Stack>
      </Paper>

      <AssetDetailsDialog 
        asset={selectedAsset}
        open={isDetailsOpen}
        onClose={handleDetailsClose}
      />

      <Snackbar
        open={copySnackbar}
        autoHideDuration={2000}
        onClose={() => setCopySnackbar(false)}
        message="Discriminação copiada!"
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
      {navFooter && createPortal(
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <Button variant="outlined" onClick={handleBackClick}>Voltar</Button>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button variant="contained" color="primary" onClick={handleDBKDownloadClick}>Baixar Arquivo .DBK</Button>
            <Button variant="contained" color="primary" onClick={handleDownloadExcel}>Baixar Relatório Excel</Button>
            {hasOriginalDBK && (
              <Button variant="outlined" color="secondary" onClick={handleOriginalDBKDownloadClick}>Baixar DBK Original</Button>
            )}
            <Button variant="outlined" onClick={() => setActiveStep(1)}>Reimportar Arquivos</Button>
            <Button variant="outlined" onClick={handleNewDeclarationClick}>Nova Declaração</Button>
          </Box>
        </Box>,
        navFooter
      )}
    </Box>
  );
};
