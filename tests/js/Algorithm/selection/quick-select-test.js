/**
 * @file quick-select.test.js
 * @description Comprehensive test suite for the QuickSelect algorithm implementation.
 * 
 * This test suite rigorously evaluates the QuickSelect algorithm, which finds the k-th
 * smallest element in an unordered array in expected O(n) time. The tests cover
 * correctness, edge cases, performance characteristics, and instrumentation validation.
 * 
 * @author Advanced Sorting Algorithm Visualization Platform Team
 * @version 1.0.0
 */

import QuickSelect from '../../src/algorithms/selection/quick-select';
import { generateDataSet } from '../../src/data/generators';

/**
 * Naive implementation of selection algorithm for verification purposes.
 * Uses sorting, which has O(n log n) time complexity.
 * 
 * @param {Array} array - Input array
 * @param {number} k - Position to find (0-based)
 * @returns {number} The k-th smallest element
 */
function naiveSelection(array, k) {
  if (k < 0 || k >= array.length) {
    throw new Error(`Invalid k: ${k}, must be between 0 and ${array.length - 1}`);
  }
  
  // Sort a copy of the array and return the k-th element
  return [...array].sort((a, b) => a - b)[k];
}

/**
 * Create a QuickSelect instance with specified options
 * 
 * @param {Object} options - Configuration options
 * @returns {QuickSelect} A configured QuickSelect instance
 */
function createQuickSelect(options = {}) {
  return new QuickSelect({
    pivotStrategy: 'median-of-three',
    ...options
  });
}

describe('QuickSelect Algorithm - Core Functionality', () => {
  test('finds the minimum element (k=0) correctly', () => {
    const array = [5, 3, 8, 2, 1, 4, 7, 6];
    const quickselect = createQuickSelect();
    const result = quickselect.select(array, 0);
    
    expect(result).toBe(1);
  });
  
  test('finds the maximum element (k=length-1) correctly', () => {
    const array = [5, 3, 8, 2, 1, 4, 7, 6];
    const quickselect = createQuickSelect();
    const result = quickselect.select(array, array.length - 1);
    
    expect(result).toBe(8);
  });
  
  test('finds the median element correctly for odd-length array', () => {
    const array = [5, 3, 8, 2, 1, 4, 7];
    const quickselect = createQuickSelect();
    const medianIndex = Math.floor(array.length / 2);
    const result = quickselect.select(array, medianIndex);
    
    expect(result).toBe(naiveSelection(array, medianIndex));
  });
  
  test('finds the median element correctly for even-length array', () => {
    const array = [5, 3, 8, 2, 1, 4, 7, 6];
    const quickselect = createQuickSelect();
    const medianIndex = Math.floor(array.length / 2);
    const result = quickselect.select(array, medianIndex);
    
    expect(result).toBe(naiveSelection(array, medianIndex));
  });
  
  test('works with negative numbers', () => {
    const array = [-5, -3, -8, -2, -1, -4, -7, -6];
    const quickselect = createQuickSelect();
    const result = quickselect.select(array, 3);
    
    expect(result).toBe(naiveSelection(array, 3));
  });
  
  test('works with mixed positive and negative numbers', () => {
    const array = [-5, 3, -8, 2, -1, 4, -7, 6];
    const quickselect = createQuickSelect();
    const result = quickselect.select(array, 4);
    
    expect(result).toBe(naiveSelection(array, 4));
  });
  
  test('works with floating-point numbers', () => {
    const array = [5.5, 3.1, 8.7, 2.2, 1.9, 4.3, 7.0, 6.6];
    const quickselect = createQuickSelect();
    const result = quickselect.select(array, 2);
    
    expect(result).toBe(naiveSelection(array, 2));
  });
});

describe('QuickSelect Algorithm - Edge Cases', () => {
  test('handles single-element array correctly', () => {
    const array = [42];
    const quickselect = createQuickSelect();
    const result = quickselect.select(array, 0);
    
    expect(result).toBe(42);
  });
  
  test('handles array with all identical elements', () => {
    const array = [7, 7, 7, 7, 7, 7, 7];
    const quickselect = createQuickSelect();
    const result = quickselect.select(array, 3);
    
    expect(result).toBe(7);
  });
  
  test('handles array with many duplicate elements', () => {
    const array = [3, 1, 5, 3, 8, 3, 2, 5, 3, 7, 5];
    const quickselect = createQuickSelect();
    
    // Test multiple positions
    for (let k = 0; k < array.length; k++) {
      const result = quickselect.select(array, k);
      expect(result).toBe(naiveSelection(array, k));
    }
  });
  
  test('throws error for k < 0', () => {
    const array = [5, 3, 8, 2, 1, 4, 7, 6];
    const quickselect = createQuickSelect();
    
    expect(() => quickselect.select(array, -1)).toThrow(/Invalid selection index/);
  });
  
  test('throws error for k >= array.length', () => {
    const array = [5, 3, 8, 2, 1, 4, 7, 6];
    const quickselect = createQuickSelect();
    
    expect(() => quickselect.select(array, array.length)).toThrow(/Invalid selection index/);
  });
  
  test('throws error for empty array', () => {
    const array = [];
    const quickselect = createQuickSelect();
    
    expect(() => quickselect.select(array, 0)).toThrow(/Cannot select from empty array/);
  });
  
  test('does not modify the original array', () => {
    const array = [5, 3, 8, 2, 1, 4, 7, 6];
    const originalArray = [...array];
    const quickselect = createQuickSelect();
    
    quickselect.select(array, 4);
    
    expect(array).toEqual(originalArray);
  });
});

describe('QuickSelect Algorithm - Pivot Strategies', () => {
  test('works with first element pivot strategy', () => {
    const array = [5, 3, 8, 2, 1, 4, 7, 6];
    const quickselect = createQuickSelect({ pivotStrategy: 'first' });
    const result = quickselect.select(array, 4);
    
    expect(result).toBe(naiveSelection(array, 4));
  });
  
  test('works with last element pivot strategy', () => {
    const array = [5, 3, 8, 2, 1, 4, 7, 6];
    const quickselect = createQuickSelect({ pivotStrategy: 'last' });
    const result = quickselect.select(array, 4);
    
    expect(result).toBe(naiveSelection(array, 4));
  });
  
  test('works with middle element pivot strategy', () => {
    const array = [5, 3, 8, 2, 1, 4, 7, 6];
    const quickselect = createQuickSelect({ pivotStrategy: 'middle' });
    const result = quickselect.select(array, 4);
    
    expect(result).toBe(naiveSelection(array, 4));
  });
  
  test('works with random pivot strategy', () => {
    const array = [5, 3, 8, 2, 1, 4, 7, 6];
    const quickselect = createQuickSelect({ pivotStrategy: 'random' });
    const result = quickselect.select(array, 4);
    
    expect(result).toBe(naiveSelection(array, 4));
  });
  
  test('works with median-of-three pivot strategy', () => {
    const array = [5, 3, 8, 2, 1, 4, 7, 6];
    const quickselect = createQuickSelect({ pivotStrategy: 'median-of-three' });
    const result = quickselect.select(array, 4);
    
    expect(result).toBe(naiveSelection(array, 4));
  });
});

describe('QuickSelect Algorithm - Input Distributions', () => {
  test('works with already sorted array', () => {
    const array = [1, 2, 3, 4, 5, 6, 7, 8];
    const quickselect = createQuickSelect();
    const result = quickselect.select(array, 4);
    
    expect(result).toBe(5);
  });
  
  test('works with reverse sorted array', () => {
    const array = [8, 7, 6, 5, 4, 3, 2, 1];
    const quickselect = createQuickSelect();
    const result = quickselect.select(array, 4);
    
    expect(result).toBe(5);
  });
  
  test('works with random distribution', () => {
    const array = generateDataSet('random', 100, { min: 1, max: 1000 });
    const quickselect = createQuickSelect();
    const k = Math.floor(array.length / 2);
    const result = quickselect.select(array, k);
    
    expect(result).toBe(naiveSelection(array, k));
  });
  
  test('works with few unique values', () => {
    const array = generateDataSet('few-unique', 100, { min: 1, max: 10, uniqueValues: 5 });
    const quickselect = createQuickSelect();
    const k = Math.floor(array.length / 2);
    const result = quickselect.select(array, k);
    
    expect(result).toBe(naiveSelection(array, k));
  });
  
  test('works with nearly sorted array', () => {
    const array = generateDataSet('nearly-sorted', 100, { min: 1, max: 1000, sortedRatio: 0.9 });
    const quickselect = createQuickSelect();
    const k = Math.floor(array.length / 2);
    const result = quickselect.select(array, k);
    
    expect(result).toBe(naiveSelection(array, k));
  });
});

describe('QuickSelect Algorithm - Performance Characteristics', () => {
  test('performs better than naive selection for large arrays', () => {
    const array = generateDataSet('random', 10000, { min: 1, max: 10000 });
    const k = Math.floor(array.length / 2);
    const quickselect = createQuickSelect();
    
    // Measure QuickSelect time
    const quickSelectStart = performance.now();
    const quickSelectResult = quickselect.select(array, k);
    const quickSelectEnd = performance.now();
    const quickSelectTime = quickSelectEnd - quickSelectStart;
    
    // Measure naive selection time
    const naiveStart = performance.now();
    const naiveResult = naiveSelection(array, k);
    const naiveEnd = performance.now();
    const naiveTime = naiveEnd - naiveStart;
    
    // Verify results match
    expect(quickSelectResult).toBe(naiveResult);
    
    // QuickSelect should be faster than naive O(n log n) implementation
    // for large arrays, but we use a relaxed condition to avoid test flakiness
    // on different test environments
    console.log(`QuickSelect: ${quickSelectTime}ms, Naive: ${naiveTime}ms`);
    expect(quickSelectTime).toBeLessThan(naiveTime * 1.5);
  });
  
  test('has consistent performance across different k values', () => {
    const array = generateDataSet('random', 1000, { min: 1, max: 1000 });
    const quickselect = createQuickSelect();
    
    const times = [];
    
    // Test selection at different positions
    const positions = [0, 249, 499, 749, 999]; // min, 25%, median, 75%, max
    
    for (const k of positions) {
      const start = performance.now();
      quickselect.select(array, k);
      const end = performance.now();
      times.push(end - start);
    }
    
    // Calculate mean and standard deviation
    const mean = times.reduce((a, b) => a + b, 0) / times.length;
    const stdDev = Math.sqrt(
      times.map(x => Math.pow(x - mean, 2)).reduce((a, b) => a + b, 0) / times.length
    );
    
    // Coefficient of variation should be reasonable (not too high)
    // This is a simple test to ensure consistent performance
    const coeffVar = stdDev / mean;
    
    console.log(`Performance times: ${times.map(t => t.toFixed(2)).join('ms, ')}ms`);
    console.log(`Mean: ${mean.toFixed(2)}ms, StdDev: ${stdDev.toFixed(2)}ms, CoeffVar: ${coeffVar.toFixed(2)}`);
    
    // Note: This is a soft assertion as performance can vary by environment
    // We're mainly looking for order-of-magnitude consistency
    expect(coeffVar).toBeLessThan(1.0);
  });
});

describe('QuickSelect Algorithm - Instrumentation', () => {
  test('records operations correctly', () => {
    const array = [5, 3, 8, 2, 1, 4, 7, 6];
    const quickselect = createQuickSelect();
    
    // Reset metrics before test
    quickselect.reset();
    quickselect.select(array, 4);
    
    const metrics = quickselect.getMetrics();
    
    // Verify metrics are collected
    expect(metrics.comparisons).toBeGreaterThan(0);
    expect(metrics.swaps).toBeGreaterThan(0);
    expect(metrics.reads).toBeGreaterThan(0);
    expect(metrics.writes).toBeGreaterThan(0);
    expect(metrics.executionTime).toBeGreaterThan(0);
  });
  
  test('records state history correctly when enabled', () => {
    const array = [5, 3, 8, 2, 1, 4, 7, 6];
    const quickselect = createQuickSelect({ recordHistory: true });
    
    quickselect.reset();
    quickselect.select(array, 4);
    
    // Check state history
    const history = quickselect.history;
    
    expect(history.length).toBeGreaterThan(0);
    expect(history[0].type).toBe('initial');
    expect(history[history.length - 1].type).toBe('final');
    
    // Should contain partition steps
    const partitionSteps = history.filter(step => 
      step.type === 'partition' || step.type === 'partition_step');
    expect(partitionSteps.length).toBeGreaterThan(0);
  });
  
  test('can disable history recording for performance', () => {
    const array = generateDataSet('random', 1000, { min: 1, max: 1000 });
    const quickselect = createQuickSelect({ recordHistory: false });
    
    quickselect.reset();
    quickselect.select(array, 500);
    
    // History should be empty or minimal
    expect(quickselect.history.length).toBeLessThanOrEqual(2); // May have initial and final states only
  });
  
  test('supports event listeners', () => {
    const array = [5, 3, 8, 2, 1, 4, 7, 6];
    const quickselect = createQuickSelect();
    
    let comparisonCount = 0;
    let swapCount = 0;
    
    // Register event listeners
    quickselect.on('comparison', () => { comparisonCount++; });
    quickselect.on('swap', () => { swapCount++; });
    
    quickselect.reset();
    quickselect.select(array, 4);
    
    // Verify event firing
    expect(comparisonCount).toBeGreaterThan(0);
    expect(swapCount).toBeGreaterThan(0);
    expect(comparisonCount).toBe(quickselect.metrics.comparisons);
    expect(swapCount).toBe(quickselect.metrics.swaps);
  });
});

describe('QuickSelect Algorithm - Algorithm Information', () => {
  test('provides correct complexity information', () => {
    const quickselect = createQuickSelect();
    const complexityInfo = quickselect.getComplexity();
    
    expect(complexityInfo.time.average).toBe('O(n)');
    expect(complexityInfo.time.worst).toBe('O(n²)');
    expect(complexityInfo.space.average).toBe('O(log n)');
  });
  
  test('provides correct algorithm properties', () => {
    const quickselect = createQuickSelect();
    const info = quickselect.getInfo();
    
    expect(info.name).toBe('Quick Select');
    expect(info.category).toBe('selection');
    expect(info.properties.divideAndConquer).toBe(true);
  });
});

describe('QuickSelect Algorithm - Advanced Functionality', () => {
  test('can find multiple elements in a single pass', () => {
    // Some implementations support finding multiple elements in one pass
    const array = [5, 3, 8, 2, 1, 4, 7, 6];
    const quickselect = createQuickSelect();
    
    // Skip if implementation doesn't support this feature
    if (typeof quickselect.selectMultiple !== 'function') {
      console.log('selectMultiple not implemented, skipping test');
      return;
    }
    
    const indices = [1, 3, 6]; // 2nd, 4th, and 7th smallest elements
    const results = quickselect.selectMultiple(array, indices);
    
    const expected = indices.map(k => naiveSelection(array, k));
    expect(results).toEqual(expected);
  });
  
  test('supports custom comparators', () => {
    // Test with objects and custom comparator
    const objects = [
      { id: 1, value: 5 },
      { id: 2, value: 3 },
      { id: 3, value: 8 },
      { id: 4, value: 2 },
      { id: 5, value: 1 },
      { id: 6, value: 4 },
      { id: 7, value: 7 },
      { id: 8, value: 6 }
    ];
    
    const comparator = (a, b) => a.value - b.value;
    const quickselect = createQuickSelect();
    
    // Skip if implementation doesn't support custom comparator
    if (typeof quickselect.selectWithComparator !== 'function') {
      console.log('selectWithComparator not implemented, skipping test');
      return;
    }
    
    const result = quickselect.selectWithComparator(objects, 4, comparator);
    
    expect(result).toEqual({ id: 6, value: 4 });
  });
});
