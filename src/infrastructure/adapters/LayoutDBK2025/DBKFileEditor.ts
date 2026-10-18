/**
 * DBKFileEditor - Core class for editing DBK files
 *
 * This class provides low-level operations for manipulating DBK files:
 * - Reading and writing fields based on their position in the file
 * - Finding records by type
 * - Inserting and removing lines
 * - Calculating control numbers
 */
export class DBKFileEditor {
  private lines: string[] = [];
  private lineEnding: string = '\r\n'; // Default to Windows-style line endings

  /**
   * Create a new DBKFileEditor
   * @param content Optional initial content
   */
  constructor(content?: string) {
    if (content) {
      this.loadContent(content);
    }
  }

  /**
   * Load content into the editor
   * @param content The content to load
   */
  public loadContent(content: string): void {
    // Detect line ending
    if (content.includes('\r\n')) {
      this.lineEnding = '\r\n';
    } else if (content.includes('\n')) {
      this.lineEnding = '\n';
    }

    // Split content into lines
    this.lines = content.split(this.lineEnding);

    // Remove any trailing empty line
    if (this.lines.length > 0 && this.lines[this.lines.length - 1] === '') {
      this.lines.pop();
    }
  }

  /**
   * Get all lines in the file
   * @returns Array of all lines
   */
  public getAllLines(): string[] {
    return [...this.lines]; // Return a copy to prevent direct modification
  }

  /**
   * Get a specific line by index
   * @param index The line index (0-based)
   * @returns The line content or undefined if index is out of bounds
   */
  public getLine(index: number): string | undefined {
    return this.lines[index];
  }

  /**
   * Get the number of lines in the file
   * @returns The number of lines
   */
  public getLineCount(): number {
    return this.lines.length;
  }

  /**
   * Find lines by record type (first 2 characters of the line)
   * @param recordType The record type to find (e.g., '16', '27', 'T9')
   * @returns Array of objects containing the index and content of matching lines
   */
  public findLinesByRecordType(recordType: string): { index: number; content: string }[] {
    const result: { index: number; content: string }[] = [];

    for (let i = 0; i < this.lines.length; i++) {
      const line = this.lines[i];
      if (line.startsWith(recordType)) {
        result.push({ index: i, content: line });
      }
    }

    return result;
  }

  /**
   * Get a field value from a line based on its position
   * @param lineIndex The line index (0-based)
   * @param start The start position (1-based, inclusive)
   * @param end The end position (1-based, inclusive)
   * @returns The field value or undefined if the line doesn't exist
   */
  public getFieldFromLine(lineIndex: number, start: number, end: number): string | undefined {
    const line = this.getLine(lineIndex);
    if (!line) return undefined;

    // Convert 1-based positions to 0-based
    const startIndex = start - 1;
    const endIndex = end;

    if (startIndex < 0 || endIndex > line.length) {
      console.warn(`Field position (${start}-${end}) out of bounds for line ${lineIndex} (length ${line.length})`);

      return undefined;
    }

    return line.substring(startIndex, endIndex).trim();
  }

  /**
   * Update a field in a line based on its position
   * @param lineIndex The line index (0-based)
   * @param start The start position (1-based, inclusive)
   * @param end The end position (1-based, inclusive)
   * @param value The new value
   * @param fieldDef Optional field definition for formatting
   * @returns True if the update was successful, false otherwise
   */
  public updateFieldInLine(
    lineIndex: number,
    start: number,
    end: number,
    value: any,
    fieldDef?: any
  ): boolean {
    if (lineIndex < 0 || lineIndex >= this.lines.length) {
      console.warn(`Line index ${lineIndex} out of bounds`);
      return false;
    }

    const line = this.lines[lineIndex];

    // Convert 1-based positions to 0-based
    const startIndex = start - 1;
    const endIndex = end;

    if (startIndex < 0 || endIndex > line.length) {
      console.warn(`Field position (${start}-${end}) out of bounds for line ${lineIndex} (length ${line.length})`);

      return false;
    }

    // Format the value based on field definition if provided
    let formattedValue: string;

    if (typeof value === 'string') {
      formattedValue = value;
    } else if (fieldDef) {
      // Use field definition to format the value
      const fieldSize = fieldDef.size;
      const format = fieldDef.format;
      const decimals = fieldDef.decimals || 0;

      if (format === 'N') {
        // Numeric format
        formattedValue = this.formatNumeric(value, fieldSize, decimals);
      } else if (format === 'NN') {
        // Negative numeric format
        formattedValue = this.formatNegativeNumeric(value, fieldSize, decimals);
      } else if (format === 'A' || format === 'C') {
        // Alphanumeric format
        formattedValue = this.padRight(String(value), fieldSize);
      } else if (format === 'D') {
        // Date format (DDMMYYYY)
        formattedValue = this.formatDate(value);
      } else {
        // Default to string
        formattedValue = String(value).padEnd(fieldSize);
      }
    } else {
      // No field definition, just convert to string
      formattedValue = String(value);
    }

    // Ensure the formatted value has the correct length
    const fieldLength = endIndex - startIndex;
    if (formattedValue.length !== fieldLength) {
      formattedValue = formattedValue.padEnd(fieldLength).substring(0, fieldLength);
    }

    // Update the line
    this.lines[lineIndex] =
      line.substring(0, startIndex) + formattedValue + line.substring(endIndex);

    return true;
  }

  /**
   * Insert a line at the specified index
   * @param index The index to insert at (0-based)
   * @param content The line content
   */
  public insertLine(index: number, content: string): void {
    if (index < 0 || index > this.lines.length) {
      console.warn(`Insert index ${index} out of bounds, appending to end`);
      this.lines.push(content);
    } else {
      this.lines.splice(index, 0, content);
    }
  }

  /**
   * Remove a line at the specified index
   * @param index The index to remove (0-based)
   * @returns True if the line was removed, false if the index was out of bounds
   */
  public removeLine(index: number): boolean {
    if (index < 0 || index >= this.lines.length) {
      console.warn(`Remove index ${index} out of bounds`);
      return false;
    }

    this.lines.splice(index, 1);
    return true;
  }

  /**
   * Get the raw content of the file
   * @returns The raw content as a string
   */
  public getRawContent(): string {
    return this.lines.join(this.lineEnding) + this.lineEnding;
  }

  // --- Helper methods for formatting ---

  private padRight(str: string | undefined, length: number): string {
    return (str ?? '').padEnd(length, ' ');
  }

  private padLeftZero(str: string | number | undefined, length: number): string {
    return (str?.toString() ?? '').padStart(length, '0');
  }

  private formatNumeric(value: number | undefined, length: number, decimals: number): string {
    if (value === undefined || value === null) return this.padLeftZero('', length);
    const fixedValue = value.toFixed(decimals);
    const [integerPart, decimalPart] = fixedValue.split('.');
    const combined = integerPart + (decimalPart || '');
    return this.padLeftZero(combined, length);
  }

  private formatNegativeNumeric(
    value: number | undefined,
    length: number,
    decimals: number
  ): string {
    if (value === undefined || value === null) return this.padLeftZero('', length);
    const isNegative = value < 0;
    const fixedValue = Math.abs(value).toFixed(decimals);
    const [integerPart, decimalPart] = fixedValue.split('.');
    const combined = integerPart + (decimalPart || '');
    const paddedAbs = this.padLeftZero(combined, length - 1); // Reserve one char for sign
    return (isNegative ? '-' : '+') + paddedAbs; // Assuming '+' for positive NN
  }

  private formatDate(value: Date | string | undefined): string {
    if (value instanceof Date) {
      const day = value.getDate().toString().padStart(2, '0');
      const month = (value.getMonth() + 1).toString().padStart(2, '0');
      const year = value.getFullYear().toString();
      return day + month + year;
    }
    if (typeof value === 'string' && /^\d{8}$/.test(value)) {
      // Allow passing DDMMAAAA string
      return value;
    }
    return this.padRight('', 8); // Default empty date
  }

  // --- Potential Future Methods ---
  // addRecord(recordPrefix: string, data: Record<string, any>, position?: number): boolean
  // removeRecord(recordPrefix: string, recordIndex: number): boolean
  // getRecordCount(recordPrefix: string): number
}
