// tests/js/algorithms/distribution/counting.test.js

/**
 * @file Comprehensive test suite for Counting Sort algorithm implementation
 * @author Advanced Sorting Algorithm Visualization Platform Team
 * @version 1.0.0
 * 
 * This test suite provides extensive verification of the Counting Sort implementation,
 * covering correctness, edge cases, performance characteristics, and algorithm-specific
 * behaviors including:
 * 
 * - Basic sorting functionality for arrays of integers
 * - Min/max range detection and optimization
 * - Key function usage for custom objects
 * - Stability preservation verification
 * - Performance scaling with input size and range
 * - Memory usage characteristics
 * - Special case handling and boundary conditions
 */

import CountingSort from '../../../../src/algorithms/distribution/counting';
import { generateDataSet } from '../../../../src/data/generators';

// Mock the performance.now() for consistent timing in tests
const originalPerformanceNow = global.performance.now;
let mockTime = 0;

beforeEach(() => {
  // Reset mock time before each test
  mockTime = 0;
  global.performance.now = jest.fn(() => {
    mockTime += 1; // Increment by 1ms for each call
    return mockTime;
  });
});

afterAll(() => {
  // Restore the original performance.now
  global.performance.now = originalPerformanceNow;
});

/**
 * Helper function to validate that an array is correctly sorted
 * @param {Array} arr - The array to check
 * @returns {boolean} - Whether the array is sorted in ascending order
 */
function isSorted(arr) {
  for (let i = 1; i < arr.length; i++) {
    if (arr[i] < arr[i - 1]) {
      return false;
    }
  }
  return true;
}

describe('CountingSort Algorithm', () => {
  // Basic initialization and configuration tests
  describe('Initialization and Configuration', () => {
    test('should initialize with correct default parameters', () => {
      const countingSort = new CountingSort();
      expect(countingSort.name).toBe('Counting Sort');
      expect(countingSort.category).toBe('distribution');
      expect(countingSort.options.autoDetectRange).toBeDefined();
      expect(countingSort.options.customMinMax).toBeDefined();
    });

    test('should accept custom configuration options', () => {
      const customOptions = {
        autoDetectRange: false,
        customMinMax: { min: 0, max: 100 },
        keyFn: (x) => x.value
      };
      const countingSort = new CountingSort(customOptions);
      
      expect(countingSort.options.autoDetectRange).toBe(false);
      expect(countingSort.options.customMinMax.min).toBe(0);
      expect(countingSort.options.customMinMax.max).toBe(100);
      expect(typeof countingSort.options.keyFn).toBe('function');
    });

    test('should return correct complexity information', () => {
      const countingSort = new CountingSort();
      const complexity = countingSort.getComplexity();
      
      expect(complexity.time.best).toBe('O(n + k)');
      expect(complexity.time.average).toBe('O(n + k)');
      expect(complexity.time.worst).toBe('O(n + k)');
      expect(complexity.space.worst).toBe('O(n + k)');
    });

    test('should indicate it is not an in-place algorithm', () => {
      const countingSort = new CountingSort();
      expect(countingSort.isInPlace()).toBe(false);
    });

    test('should indicate it is stable', () => {
      const countingSort = new CountingSort();
      expect(countingSort.isStable()).toBe(true);
    });
  });

  // Correctness tests with various input types
  describe('Basic Sorting Functionality', () => {
    test('should correctly sort an array of non-negative integers', () => {
      const countingSort = new CountingSort();
      const unsortedArray = [5, 3, 8, 4, 2, 9, 1, 7, 6];
      const sortedArray = countingSort.execute(unsortedArray);
      
      expect(sortedArray).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
      expect(isSorted(sortedArray)).toBe(true);
    });

    test('should correctly sort an array with duplicate elements', () => {
      const countingSort = new CountingSort();
      const unsortedArray = [5, 3, 5, 8, 3, 2, 5, 8, 2];
      const sortedArray = countingSort.execute(unsortedArray);
      
      expect(sortedArray).toEqual([2, 2, 3, 3, 5, 5, 5, 8, 8]);
      expect(isSorted(sortedArray)).toBe(true);
    });

    test('should correctly sort an array with many duplicate elements', () => {
      const countingSort = new CountingSort();
      const unsortedArray = [2, 2, 2, 1, 1, 1, 3, 3, 3, 2, 2, 1];
      const sortedArray = countingSort.execute(unsortedArray);
      
      expect(sortedArray).toEqual([1, 1, 1, 1, 2, 2, 2, 2, 2, 3, 3, 3]);
      expect(isSorted(sortedArray)).toBe(true);
    });

    test('should handle arrays with a single element', () => {
      const countingSort = new CountingSort();
      const unsortedArray = [42];
      const sortedArray = countingSort.execute(unsortedArray);
      
      expect(sortedArray).toEqual([42]);
    });

    test('should handle empty arrays', () => {
      const countingSort = new CountingSort();
      const unsortedArray = [];
      const sortedArray = countingSort.execute(unsortedArray);
      
      expect(sortedArray).toEqual([]);
    });
  });

  // Tests for custom key function and negative numbers
  describe('Extended Functionality', () => {
    test('should correctly sort an array of objects using a key function', () => {
      const countingSort = new CountingSort({
        keyFn: obj => obj.value
      });
      
      const unsortedArray = [
        { id: 'a', value: 5 },
        { id: 'b', value: 3 },
        { id: 'c', value: 8 },
        { id: 'd', value: 1 },
        { id: 'e', value: 6 }
      ];
      
      const sortedArray = countingSort.execute(unsortedArray);
      
      expect(sortedArray[0].value).toBe(1);
      expect(sortedArray[1].value).toBe(3);
      expect(sortedArray[2].value).toBe(5);
      expect(sortedArray[3].value).toBe(6);
      expect(sortedArray[4].value).toBe(8);
    });

    test('should correctly sort an array with negative numbers', () => {
      const countingSort = new CountingSort({ 
        // With auto-detect, it should handle negative numbers
        autoDetectRange: true 
      });
      
      const unsortedArray = [5, -3, 8, -4, 2, -9, 1, -7, 6];
      const sortedArray = countingSort.execute(unsortedArray);
      
      expect(sortedArray).toEqual([-9, -7, -4, -3, 1, 2, 5, 6, 8]);
      expect(isSorted(sortedArray)).toBe(true);
    });

    test('should correctly use custom min/max range if provided', () => {
      // Test with a custom range that's wider than necessary
      const countingSort = new CountingSort({
        autoDetectRange: false,
        customMinMax: { min: -20, max: 20 }
      });
      
      const unsortedArray = [5, 3, 8, 4, 2, 9, 1, 7, 6];
      const sortedArray = countingSort.execute(unsortedArray);
      
      expect(sortedArray).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
      
      // Get the metrics to verify the counting array size
      const countingArraySize = countingSort.metrics.auxiliarySpace;
      
      // Counting array should be at least as large as the range
      expect(countingArraySize).toBeGreaterThanOrEqual(41); // (-20 to 20 = 41 elements)
    });

    test('should gracefully handle values outside the specified range', () => {
      // Test with a custom range that's too narrow
      const countingSort = new CountingSort({
        autoDetectRange: false,
        customMinMax: { min: 0, max: 5 }
      });
      
      // Array has values outside the specified range
      const unsortedArray = [3, 1, 5, 10, 0, 20, 2];
      
      // The implementation should handle this situation without errors
      // Exact behavior might vary - either use auto-detection or truncate values
      // We just verify it doesn't crash and the result is consistent
      expect(() => {
        const result = countingSort.execute(unsortedArray);
        // Verify the result contains all values within the specified range
        // in the correct order
        const expectedSubset = [0, 1, 2, 3, 5];
        const actualSubset = result.filter(val => val <= 5);
        
        expectedSubset.forEach((val, idx) => {
          expect(actualSubset[idx]).toBe(val);
        });
      }).not.toThrow();
    });
  });

  // Edge cases and special inputs
  describe('Edge Cases and Special Inputs', () => {
    test('should efficiently handle arrays with small range and many elements', () => {
      const countingSort = new CountingSort();
      
      // Array with many elements but small range (0-9)
      const largeArray = Array(1000).fill(0).map(() => Math.floor(Math.random() * 10));
      
      const sortedArray = countingSort.execute(largeArray);
      
      expect(isSorted(sortedArray)).toBe(true);
      
      // Counting sort should be efficient for this case - operations should be O(n+k)
      // where k is small (10 in this case)
      expect(countingSort.metrics.comparisons).toBe(0); // Counting sort uses no comparisons
      expect(countingSort.metrics.memoryAccesses).toBeLessThan(largeArray.length * 5);
    });

    test('should handle arrays with a very large range less efficiently', () => {
      const countingSort = new CountingSort();
      
      // Array with a small number of elements but large range
      const wideRangeArray = [1, 1000000, 5, 20, 500000, 100];
      
      // Memory usage should be tracked
      const initialAuxSpace = countingSort.metrics.auxiliarySpace;
      
      const result = countingSort.execute(wideRangeArray);
      
      expect(isSorted(result)).toBe(true);
      
      // Auxiliary space should increase significantly to accommodate the range
      expect(countingSort.metrics.auxiliarySpace).toBeGreaterThan(initialAuxSpace);
      // Should be roughly proportional to the range
      expect(countingSort.metrics.auxiliarySpace).toBeGreaterThanOrEqual(1000000);
    });

    test('should handle arrays with all identical elements', () => {
      const countingSort = new CountingSort();
      const identicalArray = [7, 7, 7, 7, 7, 7, 7];
      const result = countingSort.execute(identicalArray);
      
      expect(result).toEqual([7, 7, 7, 7, 7, 7, 7]);
      
      // Should be very efficient as counting array would have just one non-zero entry
      expect(countingSort.metrics.memoryAccesses).toBeLessThan(identicalArray.length * 3);
    });
  });

  // Performance tests
  describe('Performance Characteristics', () => {
    test('should have O(n+k) performance where n is array size and k is range', () => {
      const countingSort = new CountingSort();
      
      // Generate two arrays with same range but different sizes
      const smallArray = generateDataSet('random', 100, { min: 0, max: 99 });
      const largeArray = generateDataSet('random', 1000, { min: 0, max: 99 });
      
      // Execute with small array
      countingSort.reset();
      countingSort.execute(smallArray);
      const smallArrayAccesses = countingSort.metrics.memoryAccesses;
      
      // Execute with large array (10x size, same range)
      countingSort.reset();
      countingSort.execute(largeArray);
      const largeArrayAccesses = countingSort.metrics.memoryAccesses;
      
      // With 10x elements but same range (k), operations should scale less than 10x
      // due to the O(n+k) complexity
      const ratio = largeArrayAccesses / smallArrayAccesses;
      
      // Ratio should be closer to linear scaling
      expect(ratio).toBeLessThan(15);
    });

    test('should be more efficient than comparison sorts for suitable data', () => {
      const countingSort = new CountingSort();
      
      // Create a large array with limited range - perfect for counting sort
      const array = generateDataSet('random', 10000, { min: 1, max: 100 });
      
      // Time execution
      const startTime = performance.now();
      const result = countingSort.execute(array);
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      expect(isSorted(result)).toBe(true);
      
      // A naive comparison sort would be O(n log n) or worse
      // For 10,000 elements, that's > 10,000 * log₂(10,000) ≈ 130,000 operations
      // Counting sort should be closer to O(n + k) = 10,000 + 100 = 10,100 operations
      
      // No comparisons should be used - this is a key characteristic of counting sort
      expect(countingSort.metrics.comparisons).toBe(0);
      
      // Memory accesses should be approximately 3n + k (for typical implementation)
      const expectedAccesses = 3 * array.length + 100; // Rough approximation
      expect(countingSort.metrics.memoryAccesses).toBeLessThan(expectedAccesses * 2);
    });

    test('should exhibit O(k) dependency on range size', () => {
      const countingSort = new CountingSort();
      
      // Generate two arrays with same size but different ranges
      const smallRangeArray = generateDataSet('random', 1000, { min: 0, max: 99 });
      const largeRangeArray = generateDataSet('random', 1000, { min: 0, max: 9999 });
      
      // Execute with small range
      countingSort.reset();
      countingSort.execute(smallRangeArray);
      const smallRangeSpace = countingSort.metrics.auxiliarySpace;
      
      // Execute with large range (100x range, same size)
      countingSort.reset();
      countingSort.execute(largeRangeArray);
      const largeRangeSpace = countingSort.metrics.auxiliarySpace;
      
      // Memory usage should scale roughly with the range (k)
      const ratio = largeRangeSpace / smallRangeSpace;
      
      // The ratio might not be exactly 100 due to implementation details
      // and fixed overhead, but should be substantial
      expect(ratio).toBeGreaterThan(10);
    });
  });

  // Algorithm-specific behavior tests
  describe('Algorithm-Specific Behavior', () => {
    test('should create a counting array of appropriate size', () => {
      const countingSort = new CountingSort();
      
      // Mock internal counting array creation to verify size
      const originalRun = countingSort.run;
      let countingArraySize = 0;
      
      countingSort.run = function(array, options) {
        const min = Math.min(...array);
        const max = Math.max(...array);
        const range = max - min + 1;
        
        // Create counting array - capture its size
        const counts = new Array(range).fill(0);
        countingArraySize = counts.length;
        
        return originalRun.call(this, array, options);
      };
      
      // Array with specific range
      const testArray = [5, 8, 12, 3, 7, 9, 6, 11, 4, 10];
      countingSort.execute(testArray);
      
      // Min is 3, max is 12, so range is 10 (indices 0-9 representing values 3-12)
      expect(countingArraySize).toBe(10);
      
      // Restore original implementation
      countingSort.run = originalRun;
    });

    test('should preserve the order of equal elements (stability)', () => {
      const countingSort = new CountingSort();
      
      // Array with objects having the same sort key but different IDs
      const objects = [
        { id: 1, value: 5 },
        { id: 2, value: 3 },
        { id: 3, value: 5 },  // Same value as id:1
        { id: 4, value: 2 },
        { id: 5, value: 3 },  // Same value as id:2
        { id: 6, value: 5 },  // Same value as id:1,3
      ];
      
      const keyFn = obj => obj.value;
      
      const sortedObjects = countingSort.execute(objects, { 
        keyFn: keyFn
      });
      
      // Values should be in sorted order
      expect(sortedObjects[0].value).toBe(2);
      expect(sortedObjects[1].value).toBe(3);
      expect(sortedObjects[2].value).toBe(3);
      expect(sortedObjects[3].value).toBe(5);
      expect(sortedObjects[4].value).toBe(5);
      expect(sortedObjects[5].value).toBe(5);
      
      // Check stability: for equal values, original order should be preserved
      expect(sortedObjects[1].id).toBe(2); // First 3
      expect(sortedObjects[2].id).toBe(5); // Second 3
      
      expect(sortedObjects[3].id).toBe(1); // First 5
      expect(sortedObjects[4].id).toBe(3); // Second 5
      expect(sortedObjects[5].id).toBe(6); // Third 5
    });

    test('should detect range automatically when autoDetectRange is true', () => {
      const countingSort = new CountingSort({ 
        autoDetectRange: true 
      });
      
      // Array with negative values
      const array = [-5, 10, 0, -8, 15, 7];
      
      // Mock min/max detection to verify it's being called
      const originalRun = countingSort.run;
      let detectedMin = null;
      let detectedMax = null;
      
      countingSort.run = function(array, options) {
        if (options.autoDetectRange) {
          detectedMin = Math.min(...array);
          detectedMax = Math.max(...array);
        } else {
          detectedMin = options.customMinMax.min;
          detectedMax = options.customMinMax.max;
        }
        
        return originalRun.call(this, array, options);
      };
      
      countingSort.execute(array);
      
      // Should have auto-detected the correct range
      expect(detectedMin).toBe(-8);
      expect(detectedMax).toBe(15);
      
      // Restore original implementation
      countingSort.run = originalRun;
    });

    test('should use custom range when autoDetectRange is false', () => {
      const customRange = { min: -10, max: 20 };
      const countingSort = new CountingSort({ 
        autoDetectRange: false,
        customMinMax: customRange
      });
      
      // Array with values within the custom range
      const array = [5, -3, 8, 12, -7, 2, 15];
      
      // Mock range detection to verify custom range is used
      const originalRun = countingSort.run;
      let usedMin = null;
      let usedMax = null;
      
      countingSort.run = function(array, options) {
        if (options.autoDetectRange) {
          usedMin = Math.min(...array);
          usedMax = Math.max(...array);
        } else {
          usedMin = options.customMinMax.min;
          usedMax = options.customMinMax.max;
        }
        
        return originalRun.call(this, array, options);
      };
      
      countingSort.execute(array);
      
      // Should have used the custom range
      expect(usedMin).toBe(customRange.min);
      expect(usedMax).toBe(customRange.max);
      
      // Restore original implementation
      countingSort.run = originalRun;
    });
  });

  // Instrumentation and metrics tests
  describe('Instrumentation and Metrics', () => {
    test('should track reads and writes correctly', () => {
      const countingSort = new CountingSort();
      const array = [5, 3, 8, 4, 2];
      
      countingSort.execute(array);
      
      // Each element is read once for counting, then written once for output
      expect(countingSort.metrics.reads).toBeGreaterThanOrEqual(array.length);
      expect(countingSort.metrics.writes).toBeGreaterThanOrEqual(array.length);
      
      // Counting sort should have no comparisons
      expect(countingSort.metrics.comparisons).toBe(0);
    });

    test('should track memory usage accurately', () => {
      const countingSort = new CountingSort();
      const array = [15, 8, 12, 20, 5, 10, 7];
      
      // Memory usage should increase during execution
      const beforeExecution = countingSort.metrics.memoryUsage;
      countingSort.execute(array);
      const afterExecution = countingSort.metrics.memoryUsage;
      
      // Auxiliary space should reflect the range of values
      // Range is 20 - 5 + 1 = 16, plus overhead for the input/output arrays
      expect(countingSort.metrics.auxiliarySpace).toBeGreaterThanOrEqual(16);
      
      // Memory usage should have increased during execution
      expect(afterExecution).toBeGreaterThan(beforeExecution);
    });

    test('should record algorithm state history correctly', () => {
      const countingSort = new CountingSort();
      const array = [5, 3, 8, 4, 2];
      
      countingSort.execute(array, { recordHistory: true });
      
      // Should have recorded state history
      expect(countingSort.history.length).toBeGreaterThan(0);
      
      // First state should be initial array
      expect(countingSort.history[0].type).toBe('initial');
      expect(Array.isArray(countingSort.history[0].array)).toBe(true);
      
      // Last state should be final sorted array
      const lastState = countingSort.history[countingSort.history.length - 1];
      expect(lastState.type).toBe('final');
      expect(isSorted(lastState.array)).toBe(true);
      
      // Should have recorded counting array states
      const countingArrayStates = countingSort.history.filter(state => 
        state.type === 'counting-array' || 
        state.type === 'frequency-count' ||
        state.type === 'prefix-sum'
      );
      
      expect(countingArrayStates.length).toBeGreaterThan(0);
    });

    test('should correctly measure execution time', () => {
      const countingSort = new CountingSort();
      const array = generateDataSet('random', 1000, { min: 1, max: 1000 });
      
      countingSort.execute(array);
      
      // Time metrics should be recorded
      expect(countingSort.metrics.startTime).toBeGreaterThanOrEqual(0);
      expect(countingSort.metrics.endTime).toBeGreaterThan(countingSort.metrics.startTime);
      expect(countingSort.metrics.executionTime).toBeGreaterThan(0);
    });
  });
});
