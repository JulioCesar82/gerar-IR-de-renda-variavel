import React, { useState } from 'react';
import { 
  Typography, 
  Button, 
  Paper, 
  Box, 
  Alert, 
  CircularProgress,
  Stack,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';

import { createPortal } from 'react-dom';
import { useAppContext } from '../context/AppContext';
import { useNavFooter } from '../context/NavFooterContext';
import { formatCurrency } from '../../utils/formatters';

/**
 * Process page component
 */
export const ProcessPage: React.FC = () => {
  const { state, actions } = useAppContext();
  const { currentSessionData, isProcessing, processingError, inconsistencies } = state;
  const { processAssets, setActiveStep, setForceActiveStep } = actions;
  const navFooter = useNavFooter();
  
  // State
  const [showInconsistencies, setShowInconsistencies] = useState(false);
  
  /**
   * Handle process click
   */
  const handleProcessClick = async () => {
    // Set force active step to ensure we stay on the process page
    console.log('ProcessPage: Setting forceActiveStep to 2 before processing');
    setForceActiveStep(2);
    
    try {
      await processAssets();
    } catch (error) {
      // If there's an error, clear the force active step
      console.log('ProcessPage: Clearing forceActiveStep due to error');
      setForceActiveStep(null);
    }
  };
  
  /**
   * Handle back click
   */
  const handleBackClick = () => {
    setActiveStep(1);
  };
  
  /**
   * Handle next click
   */
  const handleNextClick = () => {
    console.log('ProcessPage: Navigating to next step (Declaration Page)');
    setActiveStep(3);
  };
  
  /**
   * Handle toggle inconsistencies
   */
  const handleToggleInconsistencies = () => {
    setShowInconsistencies(!showInconsistencies);
  };
  
  // Check if data is processed
  const isProcessed = currentSessionData?.processedData !== undefined;
  
  // Get transaction count
  const transactionCount = currentSessionData?.transactions.length || 0;
  
  // Get special event count
  const specialEventCount = currentSessionData?.specialEvents.length || 0;
  
  // Get asset count
  const assetCount = currentSessionData?.processedData?.assetPositions.length || 0;
  
  // Get monthly result count
  const monthlyResultCount = currentSessionData?.processedData?.monthlyResults.length || 0;
  
  // Get income record count
  const incomeRecordCount = currentSessionData?.processedData?.incomeRecords.length || 0;
  
  // Debug: Log processed data
  console.log('ProcessPage: Current session data:', JSON.stringify(currentSessionData, null, 2));
  console.log('ProcessPage: Processed data:', JSON.stringify(currentSessionData, null, 2));
  console.log('ProcessPage: Is processed:', isProcessed);
  console.log('ProcessPage: Monthly results:', JSON.stringify(currentSessionData?.processedData?.monthlyResults, null, 2));
  
  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Processar Dados
      </Typography>
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="body1" paragraph>
          Processe os dados importados para gerar as posições de ativos, resultados mensais e registros de rendimentos.
        </Typography>
        
        <Stack spacing={3}>
          <Box>
            <Typography variant="h6" gutterBottom>
              Dados Importados
            </Typography>
            
            <Stack direction="row" spacing={3} divider={<Divider orientation="vertical" flexItem />}>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Transações
                </Typography>
                <Typography variant="h6">
                  {transactionCount}
                </Typography>
              </Box>
              
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Eventos Especiais
                </Typography>
                <Typography variant="h6">
                  {specialEventCount}
                </Typography>
              </Box>
            </Stack>
          </Box>
          
          {isProcessed && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Dados Processados
              </Typography>
              
              <Stack direction="row" spacing={3} divider={<Divider orientation="vertical" flexItem />}>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Ativos
                  </Typography>
                  <Typography variant="h6">
                    {assetCount}
                  </Typography>
                </Box>
                
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Resultados Mensais
                  </Typography>
                  <Typography variant="h6">
                    {monthlyResultCount}
                  </Typography>
                </Box>
                
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Registros de Rendimentos
                  </Typography>
                  <Typography variant="h6">
                    {incomeRecordCount}
                  </Typography>
                </Box>
              </Stack>
            </Box>
          )}
          
          {inconsistencies.length > 0 && (
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="h6">
                  Inconsistências ({inconsistencies.length})
                </Typography>
                
                <Button
                  variant="text"
                  onClick={handleToggleInconsistencies}
                >
                  {showInconsistencies ? 'Ocultar' : 'Mostrar'}
                </Button>
              </Box>
              
              {showInconsistencies && (
                <TableContainer component={Paper} sx={{ maxHeight: 300 }}>
                  <Table stickyHeader size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Tipo</TableCell>
                        <TableCell>Ativo</TableCell>
                        <TableCell>Data</TableCell>
                        <TableCell>Localização</TableCell>
                        <TableCell>Descrição</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {inconsistencies.map((inconsistency, index) => (
                        <TableRow key={`inconsistency-${index}-${inconsistency.assetCode || ''}-${inconsistency.date?.getTime() || ''}`}>
                          <TableCell>{inconsistency.type}</TableCell>
                          <TableCell>{inconsistency.assetCode || '-'}</TableCell>
                          <TableCell>{inconsistency.date?.toLocaleDateString() || '-'}</TableCell>
                          <TableCell>{inconsistency.locationInfo || '-'}</TableCell>
                          <TableCell>{inconsistency.message}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Box>
          )}
          
          {processingError && (
            <Alert severity="error">{processingError}</Alert>
          )}
        </Stack>
      {navFooter && createPortal(
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <Button
            variant="outlined"
            onClick={handleBackClick}
            disabled={isProcessing}
          >
            Voltar
          </Button>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleProcessClick}
              disabled={isProcessing}
              startIcon={isProcessing ? <CircularProgress size={20} /> : undefined}
            >
              {isProcessing ? 'Processando...' : 'Processar'}
            </Button>
            <Button
              variant="contained"
              color="primary"
              onClick={handleNextClick}
              disabled={!isProcessed || isProcessing}
            >
              Próximo
            </Button>
          </Box>
        </Box>,
        navFooter
      )}
      </Paper>
      
      {isProcessed && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Resultados Mensais
          </Typography>
          
          {currentSessionData?.processedData?.monthlyResults.length === 0 ? (
            <Alert severity="info" sx={{ mt: 2 }}>
              Não foram encontrados resultados mensais. Isso pode ocorrer quando não há vendas de ativos nos dados importados.
            </Alert>
          ) : (
            <>
              {/* Define columns for the Monthly Results DataGrid */}
              {(() => {
                const monthlyResultsColumns: GridColDef[] = [
                  { 
                    field: 'monthDisplay', 
                    headerName: 'Mês', 
                    width: 150,
                    valueGetter: (params) => {
                      const date = new Date(params.row.year, params.row.month - 1, 1);
                      return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
                    }
                  },
                  { 
                    field: 'totalSalesValue', 
                    headerName: 'Vendas', 
                    type: 'number',
                    width: 150,
                    align: 'right',
                    headerAlign: 'right',
                    valueFormatter: (params) => formatCurrency(params.value)
                  },
                  { 
                    field: 'netResult', 
                    headerName: 'Lucro/Prejuízo', 
                    type: 'number',
                    width: 150,
                    align: 'right',
                    headerAlign: 'right',
                    valueFormatter: (params) => formatCurrency(params.value),
                    cellClassName: (params) => params.value < 0 ? 'negative-value' : 'positive-value'
                  },
                  { 
                    field: 'taxDue', 
                    headerName: 'Imposto Devido', 
                    type: 'number',
                    width: 150,
                    align: 'right',
                    headerAlign: 'right',
                    valueFormatter: (params) => formatCurrency(params.value)
                  },
                  { 
                    field: 'taxWithheld', 
                    headerName: 'Imposto Retido', 
                    type: 'number',
                    width: 150,
                    align: 'right',
                    headerAlign: 'right',
                    valueFormatter: (params) => formatCurrency(params.value)
                  },
                  { 
                    field: 'taxToPay', 
                    headerName: 'Imposto a Pagar', 
                    type: 'number',
                    width: 150,
                    align: 'right',
                    headerAlign: 'right',
                    valueFormatter: (params) => formatCurrency(params.value)
                  }
                ];
                
                // Prepare rows for the Monthly Results DataGrid
                const monthlyResultsRows = currentSessionData?.processedData?.monthlyResults.map((result, index) => ({
                  id: `${result.year}-${result.month}`, // Unique ID for each row
                  ...result
                })) || [];
                
                return (
                  <Box sx={{ height: 400, width: '100%' }}>
                    <DataGrid
                      rows={monthlyResultsRows}
                      columns={monthlyResultsColumns}
                      initialState={{
                        pagination: {
                          paginationModel: { page: 0, pageSize: 12 },
                        },
                        sorting: {
                          sortModel: [{ field: 'month', sort: 'asc' }],
                        },
                      }}
                      pageSizeOptions={[5, 12]}
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
                );
              })()}
            </>
          )}
        </Paper>
      )}
    </Box>
  );
};
