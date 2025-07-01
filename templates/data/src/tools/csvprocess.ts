import { Tool, MCPError } from '../types';

/**
 * CSV Process Tool - Demonstrates text processing and data transformation
 * 
 * This tool shows:
 * - Text parsing and validation
 * - Data transformation and filtering
 * - Statistical analysis
 * - Memory-efficient processing
 */
export const csvProcessTool: Tool = {
  name: 'csv_process',
  description: 'Parse and analyze CSV data with filtering and statistics',
  inputSchema: {
    type: 'object',
    properties: {
      csv_data: {
        type: 'string',
        description: 'CSV data as a string',
        minLength: 1,
        maxLength: 50000
      },
      delimiter: {
        type: 'string',
        description: 'CSV delimiter character',
        default: ',',
        maxLength: 1
      },
      has_header: {
        type: 'boolean',
        description: 'Whether the first row contains column headers',
        default: true
      },
      filter_column: {
        type: 'string',
        description: 'Column name or index to filter by',
        maxLength: 50
      },
      filter_value: {
        type: 'string',
        description: 'Value to filter for in the specified column',
        maxLength: 100
      },
      analyze_columns: {
        type: 'array',
        description: 'Column names or indices to analyze statistically',
        items: {
          type: 'string',
          maxLength: 50
        },
        maxItems: 10
      },
      max_rows: {
        type: 'number',
        description: 'Maximum number of rows to process',
        minimum: 1,
        maximum: 1000,
        default: 100
      }
    },
    required: ['csv_data']
  },
  handler: async (args: {
    csv_data: string;
    delimiter?: string;
    has_header?: boolean;
    filter_column?: string;
    filter_value?: string;
    analyze_columns?: string[];
    max_rows?: number;
  }) => {
    const {
      csv_data,
      delimiter = ',',
      has_header = true,
      filter_column,
      filter_value,
      analyze_columns = [],
      max_rows = 100
    } = args;
    
    // Validate inputs
    if (!csv_data || typeof csv_data !== 'string') {
      throw new MCPError('INVALID_PARAMS', 'csv_data is required and must be a string');
    }
    
    if (csv_data.length > 50000) {
      throw new MCPError('INVALID_PARAMS', 'CSV data too large (max 50,000 characters)');
    }
    
    if (delimiter.length !== 1) {
      throw new MCPError('INVALID_PARAMS', 'Delimiter must be a single character');
    }
    
    try {
      // Parse CSV
      const parsed = parseCSV(csv_data, delimiter, has_header, max_rows);
      
      const result: any = {
        success: true,
        metadata: {
          total_rows: parsed.rows.length,
          total_columns: parsed.headers.length,
          has_header,
          delimiter,
          processed_at: new Date().toISOString()
        },
        headers: parsed.headers,
        sample_data: parsed.rows.slice(0, 5), // First 5 rows as sample
        statistics: {
          row_count: parsed.rows.length,
          column_count: parsed.headers.length,
          empty_cells: countEmptyCells(parsed.rows),
          data_types: analyzeDataTypes(parsed.rows, parsed.headers)
        }
      };
      
      // Apply filtering if requested
      if (filter_column && filter_value !== undefined) {
        const filtered = filterData(parsed, filter_column, filter_value);
        result.filtered = {
          filter: { column: filter_column, value: filter_value },
          matching_rows: filtered.length,
          data: filtered.slice(0, 10) // First 10 matching rows
        };
      }
      
      // Perform statistical analysis if requested
      if (analyze_columns.length > 0) {
        result.analysis = analyzeColumns(parsed, analyze_columns);
      }
      
      return result;
      
    } catch (error) {
      throw new MCPError('INVALID_PARAMS', `CSV processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
};

/**
 * Parse CSV data into structured format
 */
function parseCSV(data: string, delimiter: string, hasHeader: boolean, maxRows: number): {
  headers: string[];
  rows: string[][];
} {
  const lines = data.trim().split('\n');
  
  if (lines.length === 0) {
    throw new Error('CSV data is empty');
  }
  
  // Limit processing to max_rows + header
  const limitedLines = lines.slice(0, hasHeader ? maxRows + 1 : maxRows);
  
  let headers: string[] = [];
  let dataStartIndex = 0;
  
  if (hasHeader && limitedLines.length > 0) {
    headers = parseCSVLine(limitedLines[0], delimiter);
    dataStartIndex = 1;
  } else {
    // Generate default headers
    const firstLine = parseCSVLine(limitedLines[0] || '', delimiter);
    headers = firstLine.map((_, index) => `Column_${index + 1}`);
  }
  
  const rows: string[][] = [];
  
  for (let i = dataStartIndex; i < limitedLines.length; i++) {
    const line = limitedLines[i].trim();
    if (line) {
      const row = parseCSVLine(line, delimiter);
      // Ensure row has same number of columns as headers
      while (row.length < headers.length) {
        row.push('');
      }
      rows.push(row.slice(0, headers.length));
    }
  }
  
  return { headers, rows };
}

/**
 * Parse a single CSV line handling quoted values
 */
function parseCSVLine(line: string, delimiter: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  let i = 0;
  
  while (i < line.length) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // Escaped quote
        current += '"';
        i += 2;
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
        i++;
      }
    } else if (char === delimiter && !inQuotes) {
      // End of field
      result.push(current.trim());
      current = '';
      i++;
    } else {
      current += char;
      i++;
    }
  }
  
  result.push(current.trim());
  return result;
}

/**
 * Count empty cells in the dataset
 */
function countEmptyCells(rows: string[][]): number {
  let count = 0;
  
  rows.forEach(row => {
    row.forEach(cell => {
      if (!cell || cell.trim() === '') {
        count++;
      }
    });
  });
  
  return count;
}

/**
 * Analyze data types for each column
 */
function analyzeDataTypes(rows: string[][], headers: string[]): Record<string, any> {
  const analysis: Record<string, any> = {};
  
  headers.forEach((header, colIndex) => {
    const values = rows.map(row => row[colIndex]).filter(val => val && val.trim());
    
    if (values.length === 0) {
      analysis[header] = { type: 'empty', sample_values: [] };
      return;
    }
    
    const types = {
      number: 0,
      date: 0,
      boolean: 0,
      string: 0
    };
    
    values.forEach(value => {
      if (isNumber(value)) {
        types.number++;
      } else if (isDate(value)) {
        types.date++;
      } else if (isBoolean(value)) {
        types.boolean++;
      } else {
        types.string++;
      }
    });
    
    const dominantType = Object.entries(types).reduce((a, b) => 
      types[a[0]] > types[b[0]] ? a : b
    )[0];
    
    analysis[header] = {
      type: dominantType,
      type_distribution: types,
      sample_values: values.slice(0, 3),
      unique_count: new Set(values).size,
      total_count: values.length
    };
  });
  
  return analysis;
}

/**
 * Filter data based on column and value
 */
function filterData(parsed: { headers: string[]; rows: string[][] }, filterColumn: string, filterValue: string): string[][] {
  let columnIndex: number;
  
  // Determine if filter_column is an index or header name
  if (/^\d+$/.test(filterColumn)) {
    columnIndex = parseInt(filterColumn, 10);
    if (columnIndex < 0 || columnIndex >= parsed.headers.length) {
      throw new Error(`Column index ${columnIndex} out of range`);
    }
  } else {
    columnIndex = parsed.headers.indexOf(filterColumn);
    if (columnIndex === -1) {
      throw new Error(`Column "${filterColumn}" not found`);
    }
  }
  
  return parsed.rows.filter(row => 
    row[columnIndex] && row[columnIndex].toLowerCase().includes(filterValue.toLowerCase())
  );
}

/**
 * Analyze specified columns statistically
 */
function analyzeColumns(parsed: { headers: string[]; rows: string[][] }, analyzeColumns: string[]): Record<string, any> {
  const analysis: Record<string, any> = {};
  
  analyzeColumns.forEach(column => {
    let columnIndex: number;
    
    if (/^\d+$/.test(column)) {
      columnIndex = parseInt(column, 10);
      if (columnIndex < 0 || columnIndex >= parsed.headers.length) {
        analysis[column] = { error: `Column index ${columnIndex} out of range` };
        return;
      }
    } else {
      columnIndex = parsed.headers.indexOf(column);
      if (columnIndex === -1) {
        analysis[column] = { error: `Column "${column}" not found` };
        return;
      }
    }
    
    const headerName = parsed.headers[columnIndex];
    const values = parsed.rows
      .map(row => row[columnIndex])
      .filter(val => val && val.trim());
    
    if (values.length === 0) {
      analysis[headerName] = { error: 'No non-empty values found' };
      return;
    }
    
    // Check if values are numeric for statistical analysis
    const numericValues = values
      .filter(val => isNumber(val))
      .map(val => parseFloat(val));
    
    if (numericValues.length > 0) {
      analysis[headerName] = {
        type: 'numeric',
        count: numericValues.length,
        min: Math.min(...numericValues),
        max: Math.max(...numericValues),
        mean: numericValues.reduce((a, b) => a + b, 0) / numericValues.length,
        median: calculateMedian(numericValues),
        unique_values: new Set(numericValues).size
      };
    } else {
      // String analysis
      analysis[headerName] = {
        type: 'text',
        count: values.length,
        unique_values: new Set(values).size,
        most_common: findMostCommon(values),
        avg_length: values.reduce((sum, val) => sum + val.length, 0) / values.length
      };
    }
  });
  
  return analysis;
}

// Helper functions
function isNumber(value: string): boolean {
  return !isNaN(Number(value)) && isFinite(Number(value));
}

function isDate(value: string): boolean {
  const date = new Date(value);
  return !isNaN(date.getTime()) && value.length > 4;
}

function isBoolean(value: string): boolean {
  const lower = value.toLowerCase();
  return ['true', 'false', 'yes', 'no', '1', '0'].includes(lower);
}

function calculateMedian(numbers: number[]): number {
  const sorted = [...numbers].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  
  return sorted.length % 2 !== 0 
    ? sorted[mid] 
    : (sorted[mid - 1] + sorted[mid]) / 2;
}

function findMostCommon(values: string[]): { value: string; count: number } {
  const counts: Record<string, number> = {};
  
  values.forEach(value => {
    counts[value] = (counts[value] || 0) + 1;
  });
  
  const entries = Object.entries(counts);
  const mostCommon = entries.reduce((a, b) => a[1] > b[1] ? a : b);
  
  return { value: mostCommon[0], count: mostCommon[1] };
}