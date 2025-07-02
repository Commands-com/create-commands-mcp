import { describe, it, expect } from 'vitest';
import { csvprocessTool } from '../src/tools/csvprocess.js';

describe('CSV Processing Tool', () => {
  it('should calculate average salary from sample CSV data', async () => {
    const result = await csvprocessTool.handler({
      operation: 'calculate_average',
      column: 'salary',
      csv_path: './samples/users.csv'
    });

    expect(result).toBeDefined();
    expect(result.average).toBeCloseTo(75100, 1); // Expected average of sample data
    expect(result.count).toBe(10);
  });

  it('should filter CSV data by department', async () => {
    const result = await csvprocessTool.handler({
      operation: 'filter',
      column: 'department',
      value: 'Engineering',
      csv_path: './samples/users.csv'
    });

    expect(result).toBeDefined();
    expect(result.filtered_rows).toBeDefined();
    expect(result.filtered_rows.length).toBe(4); // 4 engineers in sample data
  });

  it('should handle missing CSV file gracefully', async () => {
    const result = await csvprocessTool.handler({
      operation: 'calculate_average',
      column: 'salary',
      csv_path: './samples/nonexistent.csv'
    });

    expect(result).toBeDefined();
    expect(result.error).toBeDefined();
    expect(result.available).toBe(false);
  });

  // TODO: Implement this test once group_by operation is added
  it.todo('should group data by department and calculate statistics');
});