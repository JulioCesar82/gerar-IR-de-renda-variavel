import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Container,
  Box,
  Stepper,
  Step,
  StepButton,
  Paper,
  IconButton,
  Tooltip,
} from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';

import { useAppContext } from '../context/AppContext';
import { NavFooterContext } from '../context/NavFooterContext';

/**
 * Main layout props
 */
interface MainLayoutProps {
  children: React.ReactNode;
}

const STEPS = [
  { label: 'Selecionar Arquivos', appStep: 1 },
  { label: 'Processar Dados',     appStep: 2 },
  { label: 'Gerar Declaração',    appStep: 3 },
  { label: 'Resultado',           appStep: 4 },
];

/**
 * Main layout component — full-viewport flex column so the stepper sticks to
 * the top and the nav-button bar sticks to the bottom while the content scrolls.
 */
export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const { state, actions } = useAppContext();
  const { activeStep, currentSessionId, currentSessionData } = state;
  const { setActiveStep } = actions;

  // The footer Paper's DOM node is stored here and shared via context so
  // each page can portal its navigation buttons into it.
  const [navContainer, setNavContainer] = useState<HTMLDivElement | null>(null);

  // The Stepper works on a 0-based index; pages use 1-based activeStep.
  const stepperIndex = activeStep === 0 ? -1 : activeStep - 1;

  const isStepEnabled = (idx: number): boolean => {
    if (!currentSessionId || activeStep === 0) return false;
    switch (idx) {
      case 0: return true; // Upload always reachable
      case 1: return (currentSessionData?.transactions?.length ?? 0) > 0;
      case 2: return currentSessionData?.processedData !== undefined;
      case 3: return currentSessionData?.generatedDeclaration !== undefined;
      default: return false;
    }
  };

  return (
    <NavFooterContext.Provider value={navContainer}>
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>

        {/* ── Top bar (with inline stepper when a session is active) ── */}
        <AppBar position="static">
          <Toolbar sx={{ gap: 1 }}>
            <Tooltip title="Ir para a lista de sessões">
              <IconButton
                color="inherit"
                onClick={() => setActiveStep(0)}
                edge="start"
                sx={{ mr: 1, flexShrink: 0 }}
              >
                <HomeIcon />
              </IconButton>
            </Tooltip>

            <Typography variant="h6" component="div" sx={{ flexShrink: 0, mr: 3 }}>
              Gerador de Relatório IRRF via B3
            </Typography>

            {currentSessionId && (
              <Stepper
                activeStep={stepperIndex}
                nonLinear
                sx={{ flexGrow: 1, px: 8, opacity: activeStep === 0 ? 0.45 : 1, transition: 'opacity 0.2s', '& .MuiStepLabel-label': { color: 'rgba(255,255,255,0.7)', fontSize: '0.75rem' }, '& .MuiStepLabel-label.Mui-active': { color: '#fff', fontWeight: 600 }, '& .MuiStepIcon-root': { color: 'rgba(255,255,255,0.3)' }, '& .MuiStepIcon-root.Mui-active': { color: '#fff', outline: '2px solid rgba(255,255,255,0.85)', outlineOffset: '2px', borderRadius: '50%' }, '& .MuiStepIcon-root.Mui-active .MuiStepIcon-text': { fill: '#1976d2' }, '& .MuiStepConnector-line': { borderColor: 'rgba(255,255,255,0.3)' } }}
              >
                {STEPS.map((s, idx) => (
                  <Step key={s.label}>
                    <StepButton
                      disabled={!isStepEnabled(idx)}
                      onClick={() => setActiveStep(s.appStep)}
                      sx={{ py: 0.5 }}
                    >
                      {s.label}
                    </StepButton>
                  </Step>
                ))}
              </Stepper>
            )}
          </Toolbar>
        </AppBar>

        {/* ── Scrollable content ─────────────────────────────────── */}
        <Box component="main" sx={{ flexGrow: 1, overflowY: 'auto' }}>
          <Container maxWidth={false} sx={{ py: 3 }}>
            {children}
          </Container>
        </Box>

        {/* ── Fixed navigation footer ────────────────────────────── */}
        {/* Pages portal their nav buttons into this element via NavFooterContext. */}
        {activeStep > 0 && (
          <Paper
            square
            elevation={4}
            ref={(el: HTMLDivElement | null) => setNavContainer(el)}
            sx={{
              px: 3,
              py: 1.5,
              borderTop: 1,
              borderColor: 'divider',
              display: 'flex',
              alignItems: 'center',
              minHeight: 64,
            }}
          />
        )}

      </Box>
    </NavFooterContext.Provider>
  );
};
