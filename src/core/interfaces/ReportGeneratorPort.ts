import { IRPFDeclaration } from '../domain/IRPFDeclaration';

/**
 * Interface for generating an auxiliary report (e.g. Excel) from a structured IRPF declaration.
 */
export interface ReportGeneratorPort {
  /**
   * Generate a report file from an IRPF declaration.
   * @param declaration The IRPF declaration to generate the report from
   * @returns A Blob containing the report file
   */
  generate(declaration: IRPFDeclaration): Blob;
}
