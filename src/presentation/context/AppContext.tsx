import React, { 
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode 
} from 'react';

import { Container } from '../../infrastructure/di/Container';
import { StoredSession, StoredData, SessionStatus } from '../../core/interfaces/StoragePort';
import { Inconsistency /* AssetPosition, MonthlyResult, IncomeRecord*/ } from '../../core/domain/AssetPosition';
import { TaxPayerInfo } from '../../core/domain/IRPFDeclaration';

/**
 * App context state
 */
interface AppContextState {
  // Session management
  sessions: StoredSession[];
  currentSessionId: string | null;
  currentSessionData: StoredData | null;
  
  // File import
  isImporting: boolean;
  importError: string | null;
  
  // Processing
  isProcessing: boolean;
  processingError: string | null;
  inconsistencies: Inconsistency[];
  
  // Declaration generation
  isGenerating: boolean;
  generationError: string | null;
  taxPayerInfo: TaxPayerInfo | null;
  
  // UI state
  activeStep: number;
}

/**
 * App context actions
 */
interface AppContextActions {
  // Session management
  loadSessions: () => Promise<void>;
  createSession: (description?: string, year?: number) => Promise<string>;
  loadSession: (sessionId: string) => Promise<void>;
  deleteSession: (sessionId: string) => Promise<void>;
  archiveSession: (sessionId: string) => Promise<void>;
  exportSession: (sessionId: string) => Promise<string>;
  importSession: (sessionData: string) => Promise<string>;
  
  // File import
  importFiles: (negotiationFile: File, movementFile: File | null, year: number, description?: string) => Promise<void>;
  reimportFiles: (negotiationFile: File, movementFile: File | null) => Promise<void>;
  
  // Processing
  processAssets: () => Promise<void>;
  
  // Declaration generation
  importDBKFile: (file: File) => Promise<TaxPayerInfo>;
  generateDeclaration: (taxPayerInfo: TaxPayerInfo, includeInitialPosition: boolean) => Promise<void>;
  generateDBKFile: () => Promise<Blob>;
  generateExcelFile: () => Promise<Blob>;
  
  // UI actions
  setActiveStep: (step: number) => void;
  setTaxPayerInfo: (info: TaxPayerInfo) => void;
  setForceActiveStep: (step: number | null) => void;
}

/**
 * App context
 */
interface AppContextType {
  state: AppContextState;
  actions: AppContextActions;
}

// Create context
const AppContext = createContext<AppContextType | undefined>(undefined);

/**
 * App context provider props
 */
interface AppContextProviderProps {
  children: ReactNode;
}

/**
 * App context provider
 */
export const AppContextProvider: React.FC<AppContextProviderProps> = ({ children }) => {
  // Get container
  const container = Container.getInstance();
  
  // State
  const [sessions, setSessions] = useState<StoredSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [currentSessionData, setCurrentSessionData] = useState<StoredData | null>(null);
  
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const [importError, setImportError] = useState<string | null>(null);
  
  // Flag to disable loadSessionData during import
  const [skipSessionDataLoad, setSkipSessionDataLoad] = useState<boolean>(false);
  
  // Flag to force a specific active step regardless of session status
  const [forceActiveStep, setForceActiveStep] = useState<number | null>(null);
  
  // In-memory session status to avoid database sync issues
  const [inMemorySessionStatus, setInMemorySessionStatus] = useState<Map<string, SessionStatus>>(new Map());
  
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [processingError, setProcessingError] = useState<string | null>(null);
  const [inconsistencies, setInconsistencies] = useState<Inconsistency[]>([]);
  
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [taxPayerInfo, setTaxPayerInfo] = useState<TaxPayerInfo | null>(null);
  
  const [activeStep, setActiveStep] = useState<number>(0);
  
  // Load sessions on mount
  useEffect(() => {
    loadSessions();
  }, []);
  
  // Load session data when current session ID changes
  useEffect(() => {
    if (currentSessionId && !skipSessionDataLoad) {
      loadSessionData(currentSessionId);
    } else if (!currentSessionId) {
      setCurrentSessionData(null);
    }
  }, [currentSessionId, skipSessionDataLoad]);
  
  /**
   * Load sessions
   */
  const loadSessions = async (): Promise<void> => {
    try {
      const sessionManagementUseCase = container.getSessionManagementUseCase();
      const sessions = await sessionManagementUseCase.getSessions();
      setSessions(sessions);
    } catch (error) {
      console.error('Error loading sessions:', error);
    }
  };
  
  /**
   * Create a session
   * @param description The session description
   * @param year The session year
   * @returns The session ID
   */
  const createSession = async (description?: string, year?: number): Promise<string> => {
    try {
      const sessionId = crypto.randomUUID();
      const sessionManagementUseCase = container.getSessionManagementUseCase();
      
      await container.getStorage().saveSession(
        sessionId,
        description,
        year || new Date().getFullYear() - 1
      );
      
      await loadSessions();
      
      return sessionId;
    } catch (error) {
      console.error('Error creating session:', error);
      throw error;
    }
  };
  
  /**
   * Load a session
   * @param sessionId The session ID
   */
  const loadSession = async (sessionId: string): Promise<void> => {
    try {
      setCurrentSessionId(sessionId);
    } catch (error) {
      console.error('Error loading session:', error);
      throw error;
    }
  };
  
  /**
   * Load session data
   * @param sessionId The session ID
   */
  const loadSessionData = async (sessionId: string): Promise<void> => {
    try {
      console.log('AppContext: Loading session data for session ID:', sessionId);
      const sessionManagementUseCase = container.getSessionManagementUseCase();
      const sessionData = await sessionManagementUseCase.getSessionData(sessionId);
      console.log('AppContext: Session data loaded:', sessionData ? 'success' : 'null');
      
      setCurrentSessionData(sessionData);

      // Restore taxPayerInfo from the saved declaration if available
      if (sessionData?.generatedDeclaration?.taxPayerInfo) {
        setTaxPayerInfo(sessionData.generatedDeclaration.taxPayerInfo);
      }
      
      // If forceActiveStep is set, use that value
      if (forceActiveStep !== null) {
        console.log('AppContext: Using forced active step:', forceActiveStep);
        setActiveStep(forceActiveStep);
      } else {
        // Check if we have an in-memory status for this session
        const inMemoryStatus = inMemorySessionStatus.get(sessionId);
        
        if (inMemoryStatus) {
          console.log('AppContext: Using in-memory session status:', inMemoryStatus);
          let newActiveStep = 0;
          
          switch (inMemoryStatus) {
            case SessionStatus.DRAFT:
              newActiveStep = 1;
              break;
            case SessionStatus.PROCESSED:
              newActiveStep = 2;
              break;
            case SessionStatus.GENERATED:
              newActiveStep = 4;
              break;
            default:
              newActiveStep = 0;
          }
          
          console.log('AppContext: Setting active step to:', newActiveStep);
          setActiveStep(newActiveStep);
        } else {
          // Otherwise, set active step based on session status from database
          const session = sessions.find(s => s.id === sessionId);
          console.log('AppContext: Found session in sessions array:', session);
          
          if (session) {
            console.log('AppContext: Setting active step based on session status:', session.status);
            let newActiveStep = 0;
            
            switch (session.status) {
              case SessionStatus.DRAFT:
                newActiveStep = 1;
                break;
              case SessionStatus.PROCESSED:
                newActiveStep = 2;
                break;
              case SessionStatus.GENERATED:
                newActiveStep = 4;
                break;
              default:
                newActiveStep = 0;
            }
            
            console.log('AppContext: Setting active step to:', newActiveStep);
            setActiveStep(newActiveStep);
            
            // Update in-memory status
            const newInMemoryStatus = new Map(inMemorySessionStatus);
            newInMemoryStatus.set(sessionId, session.status);
            setInMemorySessionStatus(newInMemoryStatus);
          } else {
            console.log('AppContext: Session not found in sessions array, defaulting to step 0');
            setActiveStep(0);
          }
        }
      }
    } catch (error) {
      console.error('Error loading session data:', error);
      throw error;
    }
  };
  
  /**
   * Delete a session
   * @param sessionId The session ID
   */
  const deleteSession = async (sessionId: string): Promise<void> => {
    try {
      const sessionManagementUseCase = container.getSessionManagementUseCase();
      await sessionManagementUseCase.deleteSession(sessionId);
      
      if (currentSessionId === sessionId) {
        setCurrentSessionId(null);
      }
      
      await loadSessions();
    } catch (error) {
      console.error('Error deleting session:', error);
      throw error;
    }
  };
  
  /**
   * Archive a session
   * @param sessionId The session ID
   */
  const archiveSession = async (sessionId: string): Promise<void> => {
    try {
      const sessionManagementUseCase = container.getSessionManagementUseCase();
      await sessionManagementUseCase.archiveSession(sessionId);
      
      await loadSessions();
    } catch (error) {
      console.error('Error archiving session:', error);
      throw error;
    }
  };
  
  /**
   * Export a session
   * @param sessionId The session ID
   * @returns The session data as a JSON string
   */
  const exportSession = async (sessionId: string): Promise<string> => {
    try {
      const sessionManagementUseCase = container.getSessionManagementUseCase();
      return await sessionManagementUseCase.exportSessionData(sessionId);
    } catch (error) {
      console.error('Error exporting session:', error);
      throw error;
    }
  };
  
  /**
   * Import a session
   * @param sessionData The session data as a JSON string
   * @returns The session ID
   */
  const importSession = async (sessionData: string): Promise<string> => {
    try {
      const sessionManagementUseCase = container.getSessionManagementUseCase();
      const sessionId = await sessionManagementUseCase.importSessionData(sessionData);
      
      await loadSessions();
      
      return sessionId;
    } catch (error) {
      console.error('Error importing session:', error);
      throw error;
    }
  };
  

  /**
   * Import files
   * @param negotiationFile The negotiation file
   * @param movementFile The movement file
   * @param year The year
   * @param description The description
   */
  const importFiles = async (
    negotiationFile: File,
    movementFile: File | null,
    year: number,
    description?: string
  ): Promise<void> => {
    try {
      console.log('AppContext: Starting import files process');
      setIsImporting(true);
      setImportError(null);
      
      // Create a new session
      console.log('AppContext: Creating new session');
      const sessionId = await createSession(description, year);
      console.log('AppContext: Session created with ID:', sessionId);
      
      // Import files
      console.log('AppContext: Importing files into session');
      const importFilesUseCase = container.getImportFilesUseCase();
      
      try {
        const result = await importFilesUseCase.execute(
          sessionId,
          negotiationFile,
          movementFile,
          year,
          description
        );
        console.log('AppContext: Files imported successfully:', result);
        
        // Update session status to PROCESSED
        console.log('AppContext: Updating session status to PROCESSED');
        const allSessions = await container.getSessionManagementUseCase().getSessions();
        const session = allSessions.find(s => s.id === sessionId);
        
        if (session) {
          session.status = SessionStatus.PROCESSED;
          await container.getStorage().saveSession(
            session.id,
            session.description,
            session.year
          );
          console.log('AppContext: Session status updated to PROCESSED');
          
          // Update in-memory session status
          const newInMemoryStatus = new Map(inMemorySessionStatus);
          newInMemoryStatus.set(sessionId, SessionStatus.PROCESSED);
          setInMemorySessionStatus(newInMemoryStatus);
          console.log('AppContext: In-memory session status updated to PROCESSED');
        }
      } catch (importError) {
        console.error('AppContext: Error in ImportFilesUseCase.execute:', importError);
        throw importError;
      }
      
      // Load session data directly without going through loadSession
      console.log('AppContext: Loading session data directly');
      const sessionData = await container.getSessionManagementUseCase().getSessionData(sessionId);
      
      // Set force active step to ensure we stay on the process page
      console.log('AppContext: Setting forceActiveStep to 2');
      setForceActiveStep(2);
      
      // Set current session ID and data
      setCurrentSessionId(sessionId);
      setCurrentSessionData(sessionData);
      
      // Set active step to the next step (processing) directly
      console.log('AppContext: Setting active step to 2 (processing)');
      setActiveStep(2);
      
      // Reset force active step after a delay to allow the UI to update
      // and to ensure that any subsequent loadSessionData calls will use the correct step
      setTimeout(() => {
        console.log('AppContext: Clearing forceActiveStep');
        setForceActiveStep(null);
      }, 2000); // Longer delay to ensure all async operations complete
      
      // Reload sessions in the background
      loadSessions().catch(error => {
        console.error('AppContext: Error reloading sessions:', error);
      });
      
      setIsImporting(false);
      console.log('AppContext: Import process completed successfully');
    } catch (error) {
      console.error('AppContext: Error importing files:', error);
      setImportError((error as Error).message);
      setIsImporting(false);
      throw error;
    }
  };
  

  /**
   * Re-import files into the current session (without creating a new session)
   * @param negotiationFile The negotiation file
   * @param movementFile The movement file
   */
  const reimportFiles = async (
    negotiationFile: File,
    movementFile: File | null
  ): Promise<void> => {
    try {
      if (!currentSessionId) {
        throw new Error('No session selected');
      }
      console.log('AppContext: Starting re-import files process for session:', currentSessionId);
      setIsImporting(true);
      setImportError(null);

      // Get session year and description from the sessions list
      const session = sessions.find(s => s.id === currentSessionId);
      const year = session?.year ?? new Date().getFullYear() - 1;
      const description = session?.description;

      // Import files into the existing session (overwrites transactions/events)
      const importFilesUseCase = container.getImportFilesUseCase();

      try {
        const result = await importFilesUseCase.execute(
          currentSessionId,
          negotiationFile,
          movementFile,
          year,
          description
        );
        console.log('AppContext: Files re-imported successfully:', result);

        // Update in-memory session status back to PROCESSED
        const newInMemoryStatus = new Map(inMemorySessionStatus);
        newInMemoryStatus.set(currentSessionId, SessionStatus.PROCESSED);
        setInMemorySessionStatus(newInMemoryStatus);
      } catch (importError) {
        console.error('AppContext: Error in ImportFilesUseCase.execute during re-import:', importError);
        throw importError;
      }

      // Reload session data
      const sessionData = await container.getSessionManagementUseCase().getSessionData(currentSessionId);

      // Set force active step so we land on the process page
      setForceActiveStep(2);
      setCurrentSessionData(sessionData);
      setActiveStep(2);

      setTimeout(() => {
        setForceActiveStep(null);
      }, 2000);

      // Reload sessions list in the background
      loadSessions().catch(error => {
        console.error('AppContext: Error reloading sessions after re-import:', error);
      });

      setIsImporting(false);
      console.log('AppContext: Re-import process completed successfully');
    } catch (error) {
      console.error('AppContext: Error re-importing files:', error);
      setImportError((error as Error).message);
      setIsImporting(false);
      throw error;
    }
  };


  /**
   * Process assets
   */
  const processAssets = async (): Promise<void> => {
    try {
      if (!currentSessionId) {
        throw new Error('No session selected');
      }
      
      setIsProcessing(true);
      setProcessingError(null);
      
      // Process assets
      const processAssetsUseCase = container.getProcessAssetsUseCase();
      const result = await processAssetsUseCase.execute(currentSessionId);
      
      // Set inconsistencies
      setInconsistencies(result.inconsistencies);
      
      // Update session status to PROCESSED
      console.log('AppContext: Updating session status to PROCESSED after processing');
      const allSessions = await container.getSessionManagementUseCase().getSessions();
      const session = allSessions.find(s => s.id === currentSessionId);
      
      if (session) {
        session.status = SessionStatus.PROCESSED;
        await container.getStorage().saveSession(
          session.id,
          session.description,
          session.year
        );
        console.log('AppContext: Session status updated to PROCESSED after processing');
        
        // Update in-memory session status
        const newInMemoryStatus = new Map(inMemorySessionStatus);
        newInMemoryStatus.set(currentSessionId, SessionStatus.PROCESSED);
        setInMemorySessionStatus(newInMemoryStatus);
        console.log('AppContext: In-memory session status updated to PROCESSED');
      }
      
      // Set force active step to ensure we stay on the process page
      console.log('AppContext: Setting forceActiveStep to 2 after processing');
      setForceActiveStep(2);
      
      // Reload session data
      await loadSessionData(currentSessionId);
      
      // Reset force active step after a delay
      setTimeout(() => {
        console.log('AppContext: Clearing forceActiveStep after processing');
        setForceActiveStep(null);
      }, 2000);
      
      setIsProcessing(false);
    } catch (error) {
      console.error('Error processing assets:', error);
      setProcessingError((error as Error).message);
      setIsProcessing(false);
      throw error;
    }
  };
  
  
  /**
   * Import a DBK file
   * @param file The DBK file to import
   * @returns The taxPayer info extracted from the file
   */
  const importDBKFile = async (file: File): Promise<TaxPayerInfo> => {
    try {
      setIsImporting(true);
      setImportError(null);
      
      // Parse DBK file
      const dbkFileParser = container.getDBKFileParser();
      const result = await dbkFileParser.parseDBKFile(file);
      
      // Set taxPayer info
      setTaxPayerInfo(result.taxPayerInfo);
      
      // Store original DBK content if we have a session
      if (currentSessionId) {


        console.log('AppContext: Storing original DBK content for session', currentSessionId);
        await container.getStorage().saveOriginalDBK(currentSessionId, result.originalContent);
      }
      
      setIsImporting(false);
      
      return result.taxPayerInfo;
    } catch (error) {
      console.error('Error importing DBK file:', error);
      setImportError((error as Error).message);
      setIsImporting(false);
      throw error;
    }
  };


  /**
   * Generate declaration
   * @param taxPayerInfo The taxPayer information
   * @param includeInitialPosition Whether to include the initial position
   */
  const generateDeclaration = async (
    taxPayerInfo: TaxPayerInfo,
    includeInitialPosition: boolean
  ): Promise<void> => {
    try {
      if (!currentSessionId) {
        throw new Error('No session selected');
      }
      
      setIsGenerating(true);
      setGenerationError(null);
      
      // Loading current session
      const allSessions = await container.getSessionManagementUseCase().getSessions();
      const session = allSessions.find(s => s.id === currentSessionId);
      if (!session)
        throw new Error('Session not found');

      // Generate declaration
      const generateDeclarationUseCase = container.getGenerateDeclarationUseCase();
      const dbkFileGenerator = container.getDBKFileGenerator();

      await generateDeclarationUseCase.execute(
        currentSessionId,
        taxPayerInfo,
        includeInitialPosition,
        dbkFileGenerator,
        session.year
      );
      
      // Save taxPayer info
      setTaxPayerInfo(taxPayerInfo);
      
      // Update session status to GENERATED
      console.log('AppContext: Updating session status to GENERATED after declaration generation');
      
      session.status = SessionStatus.GENERATED;
      await container.getStorage().saveSession(
        session.id,
        session.description,
        session.year
      );
      console.log('AppContext: Session status updated to GENERATED');
      
      // Update in-memory session status
      const newInMemoryStatus = new Map(inMemorySessionStatus);
      newInMemoryStatus.set(currentSessionId, SessionStatus.GENERATED);
      setInMemorySessionStatus(newInMemoryStatus);
      console.log('AppContext: In-memory session status updated to GENERATED');
    
      
      // Set force active step to ensure we go to the results page
      console.log('AppContext: Setting forceActiveStep to 4 after declaration generation');
      setForceActiveStep(4);
      
      // Reload session data
      await loadSessionData(currentSessionId);
      
      // Reset force active step after a delay
      setTimeout(() => {
        console.log('AppContext: Clearing forceActiveStep after declaration generation');
        setForceActiveStep(null);
      }, 2000);
      
      setIsGenerating(false);
    } catch (error) {
      console.error('Error generating declaration:', error);
      setGenerationError((error as Error).message);
      setIsGenerating(false);
      throw error;
    }
  };
  
  /**
   * Generate .DBK file
   * @returns The .DBK file as a Blob
   */
  const generateDBKFile = async (): Promise<Blob> => {
    try {
      if (!currentSessionId || !currentSessionData?.generatedDeclaration) {
        throw new Error('No declaration generated');
      }
      
      // Generate .DBK file
      const generateDeclarationUseCase = container.getGenerateDeclarationUseCase();
      const dbkFileGenerator = container.getDBKFileGenerator();
      
      return await generateDeclarationUseCase.generateFile(
        currentSessionData.generatedDeclaration,
        dbkFileGenerator,
        currentSessionId
      );
    } catch (error) {
      console.error('Error generating .DBK file:', error);
      throw error;
    }
  };  

   /**
   * Generate Excel file
   * @returns The Excel file as a Blob
   */
   const generateExcelFile = async (): Promise<Blob> => {
    try {
      if (!currentSessionId || !currentSessionData?.generatedDeclaration) {
        throw new Error('No declaration generated');
      }
      
      // Generate Excel file
      const excelFileGenerator = container.getExcelFileGenerator();
      
      return await excelFileGenerator.generate(currentSessionData.generatedDeclaration);
    } catch (error) {
      console.error('Error generating Excel file:', error);
      throw error;
    }
  };  
  
  // Context value
  const contextValue: AppContextType = {
    state: {
      sessions,
      currentSessionId,
      currentSessionData,
      isImporting,
      importError,
      isProcessing,
      processingError,
      inconsistencies,
      isGenerating,
      generationError,
      taxPayerInfo,
      activeStep
    },
    actions: {
      loadSessions,
      createSession,
      loadSession,
      deleteSession,
      archiveSession,
      exportSession,
      importSession,
      
      importFiles,
      reimportFiles,
      processAssets,
      generateDeclaration,

      generateDBKFile,
      generateExcelFile,
      importDBKFile,

      setActiveStep: (step) => {
        console.log('Setting active step to:', step);
        setActiveStep(step);
      },
      setTaxPayerInfo,
      setForceActiveStep
    }
  };
  
  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};

/**
 * Use app context hook
 * @returns The app context
 */
export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  
  if (!context) {
    throw new Error('useAppContext must be used within an AppContextProvider');
  }
  
  return context;
};
