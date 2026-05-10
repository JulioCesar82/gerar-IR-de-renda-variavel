import React, { useState } from 'react';
import { 
  Typography, 
  Button, 
  Paper, 
  Box, 
  List, 
  ListItem, 
  ListItemText, 
  ListItemSecondaryAction, 
  IconButton, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogContentText, 
  DialogActions,
  TextField,
  Divider
} from '@mui/material';
import { 
  Add as AddIcon, 
  Delete as DeleteIcon, 
  Archive as ArchiveIcon, 
  Folder as FolderIcon,
  FileUpload as FileUploadIcon,
  FileDownload as FileDownloadIcon
} from '@mui/icons-material';

import { useAppContext } from '../context/AppContext';
import { SessionStatus } from '../../core/interfaces/StoragePort';
import { tryDownloadFile } from '../../utils/presentation';

/**
 * Home page component
 */
export const HomePage: React.FC = () => {
  const { state, actions } = useAppContext();
  const { sessions } = state;
  const { 
    loadSession, 
    createSession, 
    deleteSession, 
    archiveSession, 
    exportSession, 
    importSession
  } = actions;
  
  // State
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importData, setImportData] = useState('');
  
  /**
   * Handle session click
   * @param sessionId The session ID
   */
  const handleSessionClick = (sessionId: string) => {
    loadSession(sessionId);
  };
  
  /**
   * Handle delete click
   * @param sessionId The session ID
   * @param event The event
   */
  const handleDeleteClick = (sessionId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setSessionToDelete(sessionId);
    setDeleteDialogOpen(true);
  };
  
  /**
   * Handle delete confirm
   */
  const handleDeleteConfirm = async () => {
    if (sessionToDelete) {
      await deleteSession(sessionToDelete);
      setDeleteDialogOpen(false);
      setSessionToDelete(null);
    }
  };
  
  /**
   * Handle delete cancel
   */
  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setSessionToDelete(null);
  };
  
  /**
   * Handle archive click
   * @param sessionId The session ID
   * @param event The event
   */
  const handleArchiveClick = async (sessionId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    await archiveSession(sessionId);
  };
  
  /**
   * Handle export click
   * @param sessionId The session ID
   * @param event The event
   */
  const handleExportClick = async (sessionId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    
    try {
      const data = await exportSession(sessionId);
      
      // Create a blob and download it
      const blob = new Blob([data], { type: 'application/json' });

      tryDownloadFile(blob, `session-${sessionId}.json`);
    } catch (error) {
      console.error('Error exporting session:', error);
      alert('Erro ao exportar sessão');
    }
  };
  
  /**
   * Handle import click
   */
  const handleImportClick = () => {
    setImportDialogOpen(true);
  };
  
  /**
   * Handle import confirm
   */
  const handleImportConfirm = async () => {
    try {
      await importSession(importData);
      setImportDialogOpen(false);
      setImportData('');
    } catch (error) {
      console.error('Error importing session:', error);
      alert('Erro ao importar sessão');
    }
  };
  
  /**
   * Handle import cancel
   */
  const handleImportCancel = () => {
    setImportDialogOpen(false);
    setImportData('');
  };
  
  /**
   * Handle import file
   * @param event The event
   */
  const handleImportFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    
    if (file) {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setImportData(content);
      };
      
      reader.readAsText(file);
    }
  };
  
  /**
   * Get status text
   * @param status The status
   * @returns The status text
   */
  const getStatusText = (status: SessionStatus): string => {
    switch (status) {
      case SessionStatus.DRAFT:
        return 'Rascunho';
      case SessionStatus.PROCESSED:
        return 'Processado';
      case SessionStatus.GENERATED:
        return 'Gerado';
      case SessionStatus.ARCHIVED:
        return 'Arquivado';
      default:
        return 'Desconhecido';
    }
  };
  
  // Group sessions by year
  const sessionsByYear = sessions.reduce((acc, session) => {
    const year = session.year.toString();
    
    if (!acc[year]) {
      acc[year] = [];
    }
    
    acc[year].push(session);
    
    return acc;
  }, {} as Record<string, typeof sessions>);
  
  // Sort years in descending order
  const years = Object.keys(sessionsByYear).sort((a, b) => parseInt(b) - parseInt(a));
  
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Sessões
        </Typography>
        
        <Box>
          <Button
            variant="contained"
            color="primary"
            startIcon={<FileUploadIcon />}
            onClick={handleImportClick}
            sx={{ mr: 1 }}
          >
            Importar
          </Button>
          
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={async () => {
              try {
                const sessionId = await createSession();
                loadSession(sessionId);
              } catch (error) {
                console.error('Error creating session:', error);
                alert('Erro ao criar nova sessão');
              }
            }}
          >
            Nova Sessão
          </Button>
        </Box>
      </Box>
      
      {years.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="body1" color="textSecondary">
            Nenhuma sessão encontrada
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={async () => {
              try {
                const sessionId = await createSession();
                loadSession(sessionId);
              } catch (error) {
                console.error('Error creating session:', error);
                alert('Erro ao criar nova sessão');
              }
            }}
            sx={{ mt: 2 }}
          >
            Criar Nova Sessão
          </Button>
        </Paper>
      ) : (
        years.map((year) => (
          <Box key={year} sx={{ mb: 3 }}>
            <Typography variant="h6" component="h2" sx={{ mb: 1 }}>
              {year}
            </Typography>
            
            <Paper>
              <List>
                {sessionsByYear[year].map((session, index) => (
                  <React.Fragment key={session.id}>
                    {index > 0 && <Divider />}
                    <ListItem onClick={() => handleSessionClick(session.id)}>
                      <FolderIcon sx={{ mr: 2, color: 'primary.main' }} />
                      <ListItemText
                        primary={session.description || `Sessão ${session.id.slice(0, 8)}`}
                        secondary={`Criado em ${new Date(session.createdAt).toLocaleDateString()} - ${getStatusText(session.status)}`}
                      />
                      <ListItemSecondaryAction>
                        <IconButton
                          edge="end"
                          aria-label="export"
                          onClick={(e) => handleExportClick(session.id, e)}
                          sx={{ mr: 1 }}
                        >
                          <FileDownloadIcon />
                        </IconButton>
                        <IconButton
                          edge="end"
                          aria-label="archive"
                          onClick={(e) => handleArchiveClick(session.id, e)}
                          sx={{ mr: 1 }}
                        >
                          <ArchiveIcon />
                        </IconButton>
                        <IconButton
                          edge="end"
                          aria-label="delete"
                          onClick={(e) => handleDeleteClick(session.id, e)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  </React.Fragment>
                ))}
              </List>
            </Paper>
          </Box>
        ))
      )}
      
      {/* Delete Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
      >
        <DialogTitle id="delete-dialog-title">Confirmar exclusão</DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-dialog-description">
            Tem certeza que deseja excluir esta sessão? Esta ação não pode ser desfeita.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel} color="primary">
            Cancelar
          </Button>
          <Button onClick={handleDeleteConfirm} color="error" autoFocus>
            Excluir
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Import Dialog */}
      <Dialog
        open={importDialogOpen}
        onClose={handleImportCancel}
        aria-labelledby="import-dialog-title"
        aria-describedby="import-dialog-description"
        maxWidth="md"
        fullWidth
      >
        <DialogTitle id="import-dialog-title">Importar Sessão</DialogTitle>
        <DialogContent>
          <DialogContentText id="import-dialog-description" sx={{ mb: 2 }}>
            Cole o conteúdo do arquivo JSON ou selecione um arquivo para importar.
          </DialogContentText>
          
          <Button
            variant="outlined"
            component="label"
            sx={{ mb: 2 }}
          >
            Selecionar Arquivo
            <input
              type="file"
              accept=".json"
              hidden
              onChange={handleImportFile}
            />
          </Button>
          
          <TextField
            label="Conteúdo JSON"
            multiline
            rows={10}
            fullWidth
            value={importData}
            onChange={(e) => setImportData(e.target.value)}
            variant="outlined"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleImportCancel} color="primary">
            Cancelar
          </Button>
          <Button 
            onClick={handleImportConfirm} 
            color="primary" 
            disabled={!importData}
            autoFocus
          >
            Importar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
