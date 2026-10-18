import { B3FileParser } from '../adapters/B3FileParser';
import { AssetProcessor } from '../adapters/AssetProcessor';

import { DBKFileGenerator } from '../adapters/DBKFileGenerator';
import { DBKFileParser } from '../adapters/DBKFileParser';
import { ExcelReportGenerator } from '../adapters/ExcelReportGenerator';

import { IndexedDBStorage } from '../adapters/IndexedDBStorage';
import { StaticEventInfoAdapter } from '../adapters/StaticEventInfoAdapter'; 
import { StaticTickerInfoAdapter } from '../adapters/ExternalTickerInfoProviderPort/StaticTickerInfoAdapter'; 

import { ImportFilesUseCase } from '../../core/usecases/ImportFilesUseCase';
import { ProcessAssetsUseCase } from '../../core/usecases/ProcessAssetsUseCase';
import { GenerateDeclarationUseCase } from '../../core/usecases/GenerateDeclarationUseCase';
import { SessionManagementUseCase } from '../../core/usecases/SessionManagementUseCase';

import { ExternalTickerInfoProviderPort } from '../../core/interfaces/ExternalTickerInfoProviderPort';
import { ReportGeneratorPort } from '../../core/interfaces/ReportGeneratorPort';

/**
 * Dependency injection container
 */
export class Container {
  // Singleton instance
  private static instance: Container;

  // Adapters
  private b3FileParser: B3FileParser;
  private assetProcessor: AssetProcessor;

  private dbkFileParser: DBKFileParser;
  private dbkFileGenerator: DBKFileGenerator;
  private excelFileGenerator: ReportGeneratorPort;

  private storage: IndexedDBStorage;
  private externalTickerInfoProvider: ExternalTickerInfoProviderPort;

  // Use cases
  private importFilesUseCase: ImportFilesUseCase;
  private processAssetsUseCase: ProcessAssetsUseCase;
  private generateDeclarationUseCase: GenerateDeclarationUseCase;
  private sessionManagementUseCase: SessionManagementUseCase;

  /**
   * Private constructor to prevent direct instantiation
   */
  private constructor() {
    // Initialize adapters
    this.storage = new IndexedDBStorage();

    this.b3FileParser = new B3FileParser();
    this.externalTickerInfoProvider = new StaticTickerInfoAdapter();
    this.assetProcessor = new AssetProcessor(new StaticEventInfoAdapter()); 
    
    this.dbkFileGenerator = new DBKFileGenerator(this.externalTickerInfoProvider);
    this.dbkFileParser = new DBKFileParser();
    this.excelFileGenerator = new ExcelReportGenerator();

    // Initialize use cases
    this.importFilesUseCase = new ImportFilesUseCase(this.b3FileParser, this.storage);
    this.processAssetsUseCase = new ProcessAssetsUseCase(this.assetProcessor, this.storage);
    this.generateDeclarationUseCase = new GenerateDeclarationUseCase(this.assetProcessor, this.storage);
    this.sessionManagementUseCase = new SessionManagementUseCase(this.storage);
  }

  // --- Getters
  public static getInstance(): Container {
    if (!Container.instance) {
      Container.instance = new Container();
    }
    return Container.instance;
  }
  
  public getImportFilesUseCase(): ImportFilesUseCase { return this.importFilesUseCase; }
  public getProcessAssetsUseCase(): ProcessAssetsUseCase { return this.processAssetsUseCase; }
  public getGenerateDeclarationUseCase(): GenerateDeclarationUseCase { return this.generateDeclarationUseCase; }
  public getSessionManagementUseCase(): SessionManagementUseCase { return this.sessionManagementUseCase; }
  
  public getAssetProcessor(): AssetProcessor { return this.assetProcessor; }
  public getStorage(): IndexedDBStorage { return this.storage; }
  
  public getDBKFileGenerator(): DBKFileGenerator { return this.dbkFileGenerator; }
  public getDBKFileParser(): DBKFileParser { return this.dbkFileParser; }
  public getExcelFileGenerator(): ReportGeneratorPort { return this.excelFileGenerator; }

  public getExternalTickerInfoProvider(): ExternalTickerInfoProviderPort { return this.externalTickerInfoProvider; }
}