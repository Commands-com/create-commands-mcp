import { Tool, MCPError } from '../types';

/**
 * JSON Parse Tool - Demonstrates data validation and transformation
 * 
 * This tool shows:
 * - Input validation and sanitization
 * - JSON parsing with error handling
 * - Data transformation and analysis
 * - Safe handling of untrusted input
 */
export const jsonParseTool: Tool = {
  name: 'json_parse',
  description: 'Parse and validate JSON data with optional transformation',
  inputSchema: {
    type: 'object',
    properties: {
      json_string: {
        type: 'string',
        description: 'JSON string to parse and validate',
        minLength: 1,
        maxLength: 10000
      },
      validate_schema: {
        type: 'boolean',
        description: 'Perform basic schema validation',
        default: false
      },
      extract_path: {
        type: 'string',
        description: 'JSONPath-like string to extract specific data (e.g., "user.name")',
        maxLength: 100
      },
      pretty_print: {
        type: 'boolean',
        description: 'Return formatted JSON',
        default: true
      }
    },
    required: ['json_string']
  },
  handler: async (args: { 
    json_string: string; 
    validate_schema?: boolean; 
    extract_path?: string;
    pretty_print?: boolean;
  }) => {
    const { json_string, validate_schema = false, extract_path, pretty_print = true } = args;
    
    // Validate input
    if (!json_string || typeof json_string !== 'string') {
      throw new MCPError('INVALID_PARAMS', 'json_string is required and must be a string');
    }
    
    if (json_string.length > 10000) {
      throw new MCPError('INVALID_PARAMS', 'JSON string too large (max 10,000 characters)');
    }
    
    let parsedData: any;
    
    try {
      // Parse JSON with security considerations
      parsedData = JSON.parse(json_string);
    } catch (error) {
      throw new MCPError('INVALID_PARAMS', `Invalid JSON: ${error instanceof Error ? error.message : 'Parse error'}`);
    }
    
    const result: any = {
      valid: true,
      data: parsedData,
      analysis: analyzeJSON(parsedData),
      timestamp: new Date().toISOString()
    };
    
    // Extract specific path if requested
    if (extract_path) {
      try {
        const extracted = extractJSONPath(parsedData, extract_path);
        result.extracted = {
          path: extract_path,
          value: extracted,
          found: extracted !== undefined
        };
      } catch (error) {
        result.extracted = {
          path: extract_path,
          error: error instanceof Error ? error.message : 'Extraction failed',
          found: false
        };
      }
    }
    
    // Schema validation if requested
    if (validate_schema) {
      result.schema = validateBasicSchema(parsedData);
    }
    
    // Pretty print if requested
    if (pretty_print && typeof parsedData === 'object') {
      result.formatted = JSON.stringify(parsedData, null, 2);
    }
    
    return result;
  }
};

/**
 * Analyze JSON structure and provide insights
 */
function analyzeJSON(data: any): any {
  const analysis: any = {
    type: Array.isArray(data) ? 'array' : typeof data,
    size: 0,
    keys: [],
    depth: 0
  };
  
  if (data === null) {
    analysis.type = 'null';
    return analysis;
  }
  
  if (typeof data === 'object') {
    if (Array.isArray(data)) {
      analysis.size = data.length;
      analysis.item_types = getArrayItemTypes(data);
      analysis.depth = getMaxDepth(data);
    } else {
      analysis.keys = Object.keys(data);
      analysis.size = analysis.keys.length;
      analysis.depth = getMaxDepth(data);
      analysis.key_types = getObjectValueTypes(data);
    }
  } else if (typeof data === 'string') {
    analysis.length = data.length;
    analysis.size = data.length;
  }
  
  return analysis;
}

/**
 * Get types of items in an array
 */
function getArrayItemTypes(arr: any[]): Record<string, number> {
  const types: Record<string, number> = {};
  
  arr.forEach(item => {
    const type = Array.isArray(item) ? 'array' : typeof item;
    types[type] = (types[type] || 0) + 1;
  });
  
  return types;
}

/**
 * Get types of values in an object
 */
function getObjectValueTypes(obj: Record<string, any>): Record<string, number> {
  const types: Record<string, number> = {};
  
  Object.values(obj).forEach(value => {
    const type = Array.isArray(value) ? 'array' : typeof value;
    types[type] = (types[type] || 0) + 1;
  });
  
  return types;
}

/**
 * Calculate maximum depth of nested structure
 */
function getMaxDepth(obj: any, currentDepth = 0): number {
  if (typeof obj !== 'object' || obj === null) {
    return currentDepth;
  }
  
  let maxDepth = currentDepth;
  
  if (Array.isArray(obj)) {
    obj.forEach(item => {
      maxDepth = Math.max(maxDepth, getMaxDepth(item, currentDepth + 1));
    });
  } else {
    Object.values(obj).forEach(value => {
      maxDepth = Math.max(maxDepth, getMaxDepth(value, currentDepth + 1));
    });
  }
  
  return maxDepth;
}

/**
 * Simple JSONPath-like extraction (supports dot notation)
 */
function extractJSONPath(data: any, path: string): any {
  const parts = path.split('.');
  let current = data;
  
  for (const part of parts) {
    if (current === null || current === undefined) {
      return undefined;
    }
    
    // Handle array indices
    if (Array.isArray(current) && /^\d+$/.test(part)) {
      const index = parseInt(part, 10);
      current = current[index];
    } else if (typeof current === 'object') {
      current = current[part];
    } else {
      return undefined;
    }
  }
  
  return current;
}

/**
 * Basic schema validation
 */
function validateBasicSchema(data: any): any {
  const validation: any = {
    is_valid: true,
    issues: [],
    recommendations: []
  };
  
  // Check for common issues
  if (typeof data === 'object' && data !== null) {
    // Check for deeply nested structures
    const depth = getMaxDepth(data);
    if (depth > 10) {
      validation.issues.push(`Very deep nesting (${depth} levels) may cause performance issues`);
    }
    
    // Check for large arrays
    if (Array.isArray(data) && data.length > 1000) {
      validation.issues.push(`Large array (${data.length} items) may be slow to process`);
    }
    
    // Check for mixed types in arrays
    if (Array.isArray(data)) {
      const types = getArrayItemTypes(data);
      if (Object.keys(types).length > 2) {
        validation.recommendations.push('Consider using consistent types in arrays');
      }
    }
    
    // Check for empty values
    if (!Array.isArray(data)) {
      const emptyKeys = Object.keys(data).filter(key => 
        data[key] === null || data[key] === undefined || data[key] === ''
      );
      
      if (emptyKeys.length > 0) {
        validation.recommendations.push(`Consider handling empty values: ${emptyKeys.join(', ')}`);
      }
    }
  }
  
  validation.is_valid = validation.issues.length === 0;
  
  return validation;
}