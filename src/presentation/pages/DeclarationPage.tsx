import React, { useState, useRef } from 'react';
import { 
  Typography, 
  Button, 
  Paper, 
  Box, 
  Alert, 
  CircularProgress,
  Stack,
  TextField,
  FormControlLabel,
  Checkbox
} from '@mui/material';
import { CloudUpload as CloudUploadIcon } from '@mui/icons-material';

import { createPortal } from 'react-dom';
import { useAppContext } from '../context/AppContext';
import { useNavFooter } from '../context/NavFooterContext';
import { TaxPayerInfo } from '../../core/domain/IRPFDeclaration';
import { formatCurrency } from '../../utils/formatters';

/**
 * Declaration page component
 */
export const DeclarationPage: React.FC = () => {
  const { state, actions } = useAppContext();
  const { 
    currentSessionData, 
    isGenerating, 
    isImporting, 
    importError, 
    generationError, 
    taxPayerInfo: savedTaxPayerInfo 
  } = state;
  const { generateDeclaration, importDBKFile, setActiveStep } = actions;
  const navFooter = useNavFooter();
  
  // Refs
  const dbkFileInputRef = useRef<HTMLInputElement>(null);
  
  // State
  const [taxPayerInfo, setTaxPayerInfo] = useState<TaxPayerInfo>(
    savedTaxPayerInfo || {
      name: '',
      cpf: '',
      dateOfBirth: new Date(),
      address: {
        street: '',
        number: '',
        complement: '',
        neighborhood: '',
        city: '',
        state: '',
        zipCode: '',
        country: 'Brasil'
      },
      phone: '',
      email: '',
      occupation: '',
    }
  );
  
  const [includeInitialPosition, setIncludeInitialPosition] = useState(true);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  
  /**
   * Handle taxpayer info change
   * @param field The field to change
   * @param value The new value
   */
  const handleTaxPayerInfoChange = (field: string, value: string) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setTaxPayerInfo({
        ...taxPayerInfo,
        [parent]: {
          ...taxPayerInfo[parent as keyof TaxPayerInfo] as Record<string, any>,
          [child]: value,
        },
      });
    } else {
      setTaxPayerInfo({
        ...taxPayerInfo,
        [field]: value,
      });
    }
    
    // Clear validation error
    if (validationErrors[field]) {
      setValidationErrors({
        ...validationErrors,
        [field]: '',
      });
    }
  };
  
  /**
   * Handle include initial position change
   * @param event The event
   */
  const handleIncludeInitialPositionChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setIncludeInitialPosition(event.target.checked);
  };
  
  /**
   * Validate form
   * @returns Whether the form is valid
   */
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    // Required fields
    if (!taxPayerInfo.name) {
      errors['name'] = 'Nome é obrigatório';
    }
    
    if (!taxPayerInfo.cpf) {
      errors['cpf'] = 'CPF é obrigatório';
    } else if (!/^\d{11}$/.test(taxPayerInfo.cpf)) {
      errors['cpf'] = 'CPF deve conter 11 dígitos';
    }
    
    if (!taxPayerInfo.address.street) {
      errors['address.street'] = 'Rua é obrigatória';
    }
    
    if (!taxPayerInfo.address.number) {
      errors['address.number'] = 'Número é obrigatório';
    }
    
    if (!taxPayerInfo.address.neighborhood) {
      errors['address.neighborhood'] = 'Bairro é obrigatório';
    }
    
    if (!taxPayerInfo.address.city) {
      errors['address.city'] = 'Cidade é obrigatória';
    }
    
    if (!taxPayerInfo.address.state) {
      errors['address.state'] = 'Estado é obrigatório';
    }
    
    if (!taxPayerInfo.address.zipCode) {
      errors['address.zipCode'] = 'CEP é obrigatório';
    } else if (!/^\d{8}$/.test(taxPayerInfo.address.zipCode)) {
      errors['address.zipCode'] = 'CEP deve conter 8 dígitos';
    }
    
    setValidationErrors(errors);
    
    return Object.keys(errors).length === 0;
  };
  
  /**
   * Handle generate click
   */
  const handleGenerateClick = async () => {
    if (validateForm()) {
      try {
        await generateDeclaration(taxPayerInfo, includeInitialPosition);
        
        // After successful generation, navigate to the results page
        setActiveStep(4);
      } catch (error) {
        console.error('Error generating declaration:', error);
      }
    }
  };
  
  /**
   * Handle next page click
   */
  const handleNextPageClick = async () => {
    try {
      console.log('Navigating to results page...');
      // Navigate to the results page where the user can download the file
      setActiveStep(4);
      console.log('Navigation to results page completed');
    } catch (error) {
      console.error('Error navigating to results page:', error);
      alert('Erro ao navegar para a página de resultados');
    }
  };
  
  /**
   * Handle back click
   */
  const handleBackClick = () => {
    setActiveStep(1);
  };
  
  // Check if declaration is generated
  const isGenerated = currentSessionData?.generatedDeclaration !== undefined;
  
  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Gerar Declaração
      </Typography>
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="body1" paragraph>
          Preencha as informações do contribuinte para gerar a declaração.
        </Typography>
        
        <Stack spacing={3}>
          <Box>
            <Typography variant="h6" gutterBottom>
              Informações do Contribuinte
            </Typography>
            
            <Box sx={{ mb: 3 }}>
              <input
                type="file"
                accept=".dbk"
                hidden
                ref={dbkFileInputRef}
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    try {
                      console.log('Importing DBK file:', file.name);
                      const importedTaxPayerInfo = await importDBKFile(file);
                      console.log('Imported taxpayer info:', importedTaxPayerInfo);
                      
                      setTaxPayerInfo(importedTaxPayerInfo);
                      alert('Arquivo importado com sucesso!');
                    } catch (error) {
                      console.error('Error importing DBK file:', error);
                      alert(`Erro ao importar arquivo: ${(error as Error).message}`);
                    }
                  }
                }}
              />
              <Button
                variant="outlined"
                startIcon={<CloudUploadIcon />}
                onClick={() => dbkFileInputRef.current?.click()}
                disabled={isGenerating || isGenerated || isImporting}
                sx={{ mb: 1 }}
              >
                Importar Declaração Pré-Preenchida (arquivo .DBK)
              </Button>
              {isImporting && (
                <Box sx={{ display: 'flex', alignItems: 'center', ml: 2 }}>
                  <CircularProgress size={24} sx={{ mr: 1 }} />
                  <Typography variant="body2">Importando...</Typography>
                </Box>
              )}
              {importError && (
                <Alert severity="error" sx={{ mt: 1 }}>{importError}</Alert>
              )}
            </Box>
            
            <Stack spacing={2}>
              <TextField
                label="Nome Completo"
                fullWidth
                value={taxPayerInfo.name}
                onChange={(e) => handleTaxPayerInfoChange('name', e.target.value)}
                error={!!validationErrors['name']}
                helperText={validationErrors['name']}
                disabled={isGenerating || isGenerated}
              />
              
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField
                  label="CPF (apenas números)"
                  fullWidth
                  value={taxPayerInfo.cpf}
                  onChange={(e) => handleTaxPayerInfoChange('cpf', e.target.value)}
                  error={!!validationErrors['cpf']}
                  helperText={validationErrors['cpf']}
                  disabled={isGenerating || isGenerated}
                />
                
                <TextField
                  label="Data de Nascimento"
                  type="date"
                  fullWidth
                  value={(() => {
                    const dob = taxPayerInfo.dateOfBirth;
                    if (dob instanceof Date && !isNaN(dob.getTime())) return dob.toISOString().split('T')[0];
                    if (typeof dob === 'string' && dob) return (dob as string).substring(0, 10);
                    return '';
                  })()}
                  onChange={(e) => {
                    const parts = e.target.value.split('-').map(Number);
                    if (parts.length === 3 && !parts.some(isNaN)) {
                      // Construct in local time to avoid timezone drift
                      const date = new Date(parts[0], parts[1] - 1, parts[2]);
                      setTaxPayerInfo({ ...taxPayerInfo, dateOfBirth: date });
                    } else {
                      setTaxPayerInfo({ ...taxPayerInfo, dateOfBirth: e.target.value as unknown as Date });
                    }
                  }}
                  InputLabelProps={{ shrink: true }}
                  disabled={isGenerating || isGenerated}
                />
              </Stack>
              
              <Typography variant="subtitle1" gutterBottom>
                Endereço
              </Typography>
              
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField
                  label="Rua"
                  fullWidth
                  value={taxPayerInfo.address.street}
                  onChange={(e) => handleTaxPayerInfoChange('address.street', e.target.value)}
                  error={!!validationErrors['address.street']}
                  helperText={validationErrors['address.street']}
                  disabled={isGenerating || isGenerated}
                  sx={{ flex: 3 }}
                />
                
                <TextField
                  label="Número"
                  fullWidth
                  value={taxPayerInfo.address.number}
                  onChange={(e) => handleTaxPayerInfoChange('address.number', e.target.value)}
                  error={!!validationErrors['address.number']}
                  helperText={validationErrors['address.number']}
                  disabled={isGenerating || isGenerated}
                  sx={{ flex: 1 }}
                />
              </Stack>
              
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField
                  label="Complemento"
                  fullWidth
                  value={taxPayerInfo.address.complement}
                  onChange={(e) => handleTaxPayerInfoChange('address.complement', e.target.value)}
                  disabled={isGenerating || isGenerated}
                />
                
                <TextField
                  label="Bairro"
                  fullWidth
                  value={taxPayerInfo.address.neighborhood}
                  onChange={(e) => handleTaxPayerInfoChange('address.neighborhood', e.target.value)}
                  error={!!validationErrors['address.neighborhood']}
                  helperText={validationErrors['address.neighborhood']}
                  disabled={isGenerating || isGenerated}
                />
              </Stack>
              
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField
                  label="Cidade"
                  fullWidth
                  value={taxPayerInfo.address.city}
                  onChange={(e) => handleTaxPayerInfoChange('address.city', e.target.value)}
                  error={!!validationErrors['address.city']}
                  helperText={validationErrors['address.city']}
                  disabled={isGenerating || isGenerated}
                  sx={{ flex: 3 }}
                />
                
                <TextField
                  label="Estado"
                  fullWidth
                  value={taxPayerInfo.address.state}
                  onChange={(e) => handleTaxPayerInfoChange('address.state', e.target.value)}
                  error={!!validationErrors['address.state']}
                  helperText={validationErrors['address.state']}
                  disabled={isGenerating || isGenerated}
                  sx={{ flex: 1 }}
                />
                
                <TextField
                  label="CEP (apenas números)"
                  fullWidth
                  value={taxPayerInfo.address.zipCode}
                  onChange={(e) => handleTaxPayerInfoChange('address.zipCode', e.target.value)}
                  error={!!validationErrors['address.zipCode']}
                  helperText={validationErrors['address.zipCode']}
                  disabled={isGenerating || isGenerated}
                  sx={{ flex: 2 }}
                />
              </Stack>
              
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField
                  label="Telefone"
                  fullWidth
                  value={taxPayerInfo.phone}
                  onChange={(e) => handleTaxPayerInfoChange('phone', e.target.value)}
                  disabled={isGenerating || isGenerated}
                />
                
                <TextField
                  label="E-mail"
                  fullWidth
                  value={taxPayerInfo.email}
                  onChange={(e) => handleTaxPayerInfoChange('email', e.target.value)}
                  disabled={isGenerating || isGenerated}
                />
              </Stack>
              
              <TextField
                label="Ocupação"
                fullWidth
                value={taxPayerInfo.occupation}
                onChange={(e) => handleTaxPayerInfoChange('occupation', e.target.value)}
                disabled={isGenerating || isGenerated}
              />
              
              <FormControlLabel
                control={
                  <Checkbox
                    checked={includeInitialPosition}
                    onChange={handleIncludeInitialPositionChange}
                    disabled={isGenerating || isGenerated}
                  />
                }
                label="Incluir posição inicial (para declaração de bens)"
              />
            </Stack>
          </Box>
          
          {generationError && (
            <Alert severity="error">{generationError}</Alert>
          )}
        </Stack>
      </Paper>
      {navFooter && createPortal(
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <Button
            variant="outlined"
            onClick={handleBackClick}
            disabled={isGenerating}
          >
            Voltar
          </Button>
          <Box>
            {!isGenerated ? (
              <Button
                variant="contained"
                color="primary"
                onClick={handleGenerateClick}
                disabled={isGenerating}
                startIcon={isGenerating ? <CircularProgress size={20} /> : undefined}
              >
                {isGenerating ? 'Gerando...' : 'Gerar Declaração'}
              </Button>
            ) : (
              <Button
                variant="contained"
                color="primary"
                onClick={handleNextPageClick}
              >
                Visualizar Resultados
              </Button>
            )}
          </Box>
        </Box>,
        navFooter
      )}
      
      {isGenerated && currentSessionData?.generatedDeclaration && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Resumo da Declaração
          </Typography>
          
          <Stack spacing={2}>
            <Box>
              <Typography variant="body2" color="text.secondary">
                Total de Rendimentos
              </Typography>
              <Typography variant="h6">
                {formatCurrency(currentSessionData.generatedDeclaration.totalIncome)}
              </Typography>
            </Box>
            
            <Box>
              <Typography variant="body2" color="text.secondary">
                Total de Bens
              </Typography>
              <Typography variant="h6">
                {formatCurrency(currentSessionData.generatedDeclaration.totalAssetsValue)}
              </Typography>
            </Box>
            
            <Box>
              <Typography variant="body2" color="text.secondary">
                Imposto Retido na Fonte
              </Typography>
              <Typography variant="h6">
                {formatCurrency(currentSessionData.generatedDeclaration.totalTaxWithheld)}
              </Typography>
            </Box>
            
            <Box>
              <Typography variant="body2" color="text.secondary">
                Imposto a Pagar
              </Typography>
              <Typography variant="h6">
                {formatCurrency(currentSessionData.generatedDeclaration.totalTaxToPay)}
              </Typography>
            </Box>
          </Stack>
        </Paper>
      )}
    </Box>
  );
};
