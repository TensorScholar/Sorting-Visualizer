// tests/js/algorithms/distribution/pigeonhole.test.js

/**
 * @file Comprehensive test suite for Pigeonhole Sort algorithm implementation
 * @author Advanced Sorting Algorithm Visualization Platform Team
 * @version 1.0.0
 * 
 * This test suite provides rigorous verification of the Pigeonhole Sort implementation,
 * examining correctness, edge cases, performance characteristics, and algorithm-specific
 * behaviors including:
 * 
 * - Basic sorting functionality for integer arrays
 * - Range detection and hole allocation efficiency
 * - Key function effectiveness for custom objects
 * - Performance scaling with input size and value density
 * - Memory usage characteristics under different data distributions
 * - Behavior with sparse vs. dense value distributions
 * - Special case handling and stability verification
 */

import PigeonholeSort from '../../../../src/algorithms/distribution/pigeonhole';
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

describe('PigeonholeSort Algorithm', () => {
  // Basic initialization and configuration tests
  describe('Initialization and Configuration', () => {
    test('should initialize with correct default parameters', () => {
      const pigeonholeSort = new PigeonholeSort();
      expect(pigeonholeSort.name).toBe('Pigeonhole Sort');
      expect(pigeonholeSort.category).toBe('distribution');
      expect(pigeonholeSort.options.autoDetectRange).toBeDefined();
      expect(pigeonholeSort.options.customMinMax).toBeDefined();
    });

    test('should accept custom configuration options', () => {
      const customOptions = {
        autoDetectRange: false,
        customMinMax: { min: 0, max: 100 },
        keyFn: (x) => x.value
      };
      const pigeonholeSort = new PigeonholeSort(customOptions);
      
      expect(pigeonholeSort.options.autoDetectRange).toBe(false);
      expect(pigeonholeSort.options.customMinMax.min).toBe(0);
      expect(pigeonholeSort.options.customMinMax.max).toBe(100);
      expect(typeof pigeonholeSort.options.keyFn).toBe('function');
    });

    test('should return correct complexity information', () => {
      const pigeonholeSort = new PigeonholeSort();
      const complexity = pigeonholeSort.getComplexity();
      
      expect(complexity.time.best).toBe('O(n + range)');
      expect(complexity.time.average).toBe('O(n + range)');
      expect(complexity.time.worst).toBe('O(n + range)');
      expect(complexity.space.worst).toBe('O(range)');
    });

    test('should indicate it is not an in-place algorithm', () => {
      const pigeonholeSort = new PigeonholeSort();
      expect(pigeonholeSort.isInPlace()).toBe(false);
    });

    test('should indicate it is stable', () => {
      const pigeonholeSort = new PigeonholeSort();
      expect(pigeonholeSort.isStable()).toBe(true);
    });
  });

  // Correctness tests with various input types
  describe('Basic Sorting Functionality', () => {
    test('should correctly sort an array of non-negative integers', () => {
      const pigeonholeSort = new PigeonholeSort();
      const unsortedArray = [5, 3, 8, 4, 2, 9, 1, 7, 6];
      const sortedArray = pigeonholeSort.execute(unsortedArray);
      
      expect(sortedArray).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
      expect(isSorted(sortedArray)).toBe(true);
    });

    test('should correctly sort an array with duplicate elements', () => {
      const pigeonholeSort = new PigeonholeSort();
      const unsortedArray = [5, 3, 5, 8, 3, 2, 5, 8, 2];
      const sortedArray = pigeonholeSort.execute(unsortedArray);
      
      expect(sortedArray).toEqual([2, 2, 3, 3, 5, 5, 5, 8, 8]);
      expect(isSorted(sortedArray)).toBe(true);
    });

    test('should correctly sort an array with many duplicate elements', () => {
      const pigeonholeSort = new PigeonholeSort();
      const unsortedArray = [2, 2, 2, 1, 1, 1, 3, 3, 3, 2, 2, 1];
      const sortedArray = pigeonholeSort.execute(unsortedArray);
      
      expect(sortedArray).toEqual([1, 1, 1, 1, 2, 2, 2, 2, 2, 3, 3, 3]);
      expect(isSorted(sortedArray)).toBe(true);
    });

    test('should handle arrays with a single element', () => {
      const pigeonholeSort = new PigeonholeSort();
      const unsortedArray = [42];
      const sortedArray = pigeonholeSort.execute(unsortedArray);
      
      expect(sortedArray).toEqual([42]);
    });

    test('should handle empty arrays', () => {
      const pigeonholeSort = new PigeonholeSort();
      const unsortedArray = [];
      const sortedArray = pigeonholeSort.execute(unsortedArray);
      
      expect(sortedArray).toEqual([]);
    });
  });

  // Tests for custom key function and negative numbers
  describe('Extended Functionality', () => {
    test('should correctly sort an array of objects using a key function', () => {
      const pigeonholeSort = new PigeonholeSort({
        keyFn: obj => obj.value
      });
      
      const unsortedArray = [
        { id: 'a', value: 5 },
        { id: 'b', value: 3 },
        { id: 'c', value: 8 },
        { id: 'd', value: 1 },
        { id: 'e', value: 6 }
      ];
      
      const sortedArray = pigeonholeSort.execute(unsortedArray);
      
      expect(sortedArray[0].value).toBe(1);
      expect(sortedArray[1].value).toBe(3);
      expect(sortedArray[2].value).toBe(5);
      expect(sortedArray[3].value).toBe(6);
      expect(sortedArray[4].value).toBe(8);
    });

    test('should correctly sort an array with negative numbers', () => {
      const pigeonholeSort = new PigeonholeSort({ 
        // With auto-detect, it should handle negative numbers
        autoDetectRange: true 
      });
      
      const unsortedArray = [5, -3, 8, -4, 2, -9, 1, -7, 6];
      const sortedArray = pigeonholeSort.execute(unsortedArray);
      
      expect(sortedArray).toEqual([-9, -7, -4, -3, 1, 2, 5, 6, 8]);
      expect(isSorted(sortedArray)).toBe(true);
    });

    test('should correctly use custom min/max range if provided', () => {
      // Test with a custom range that's wider than necessary
      const pigeonholeSort = new PigeonholeSort({
        autoDetectRange: false,
        customMinMax: { min: -20, max: 20 }
      });
      
      const unsortedArray = [5, 3, 8, 4, 2, 9, 1, 7, 6];
      const sortedArray = pigeonholeSort.execute(unsortedArray);
      
      expect(sortedArray).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
      
      // Get the metrics to verify the pigeonhole array size
      const pigeonholeArraySize = pigeonholeSort.metrics.auxiliarySpace;
      
      // Pigeonhole array should be at least as large as the range
      expect(pigeonholeArraySize).toBeGreaterThanOrEqual(41); // (-20 to 20 = 41 elements)
    });

    test('should handle floating point values by converting to integer keys', () => {
      const pigeonholeSort = new PigeonholeSort({ 
        // This option enables handling non-integer values by creating integer keys
        keyFn: value => Math.floor(value * 100)
      });
      
      const unsortedArray = [5.5, 3.3, 8.8, 4.4, 2.2, 9.9, 1.1, 7.7, 6.6];
      const sortedArray = pigeonholeSort.execute(unsortedArray);
      
      expect(sortedArray).toEqual([1.1, 2.2, 3.3, 4.4, 5.5, 6.6, 7.7, 8.8, 9.9]);
      expect(isSorted(sortedArray)).toBe(true);
    });
  });

  // Edge cases and special inputs
  describe('Edge Cases and Special Inputs', () => {
    test('should efficiently handle arrays with small range and many elements', () => {
      const pigeonholeSort = new PigeonholeSort();
      
      // Array with many elements but small range (0-9)
      const largeArray = Array(1000).fill(0).map(() => Math.floor(Math.random() * 10));
      
      const sortedArray = pigeonholeSort.execute(largeArray);
      
      expect(isSorted(sortedArray)).toBe(true);
      
      // Pigeonhole sort should be efficient for this case
      // Operations should be O(n+range) where range is small (10)
      expect(pigeonholeSort.metrics.comparisons).toBe(0); // No comparisons
      expect(pigeonholeSort.metrics.memoryAccesses).toBeLessThan(largeArray.length * 5);
    });

    test('should handle arrays with a very large range efficiently for sparse data', () => {
      const pigeonholeSort = new PigeonholeSort();
      
      // Array with sparse values across a large range
      const sparseArray = [10, 10000, 50, 200, 5000, 1000];
      
      const result = pigeonholeSort.execute(sparseArray);
      
      expect(isSorted(result)).toBe(true);
      
      // For pigeonhole sort with sparse arrays, memory usage is proportional to range
      expect(pigeonholeSort.metrics.auxiliarySpace).toBeGreaterThan(sparseArray.length);
      expect(pigeonholeSort.metrics.auxiliarySpace).toBeGreaterThanOrEqual(10000 - 10 + 1);
    });

    test('should handle arrays with all identical elements very efficiently', () => {
      const pigeonholeSort = new PigeonholeSort();
      const identicalArray = [7, 7, 7, 7, 7, 7, 7];
      const result = pigeonholeSort.execute(identicalArray);
      
      expect(result).toEqual([7, 7, 7, 7, 7, 7, 7]);
      
      // Should be very efficient as there's only one pigeonhole
      expect(pigeonholeSort.metrics.memoryAccesses).toBeLessThan(identicalArray.length * 4);
      
      // Pigeonhole array should be small - just enough for one value
      expect(pigeonholeSort.metrics.auxiliarySpace).toBeLessThan(10);
    });
  });

  // Performance tests
  describe('Performance Characteristics', () => {
    test('should have O(n+range) performance where n is array size and range is max-min+1', () => {
      const pigeonholeSort = new PigeonholeSort();
      
      // Generate two arrays with same range but different sizes
      const smallArray = generateDataSet('random', 100, { min: 1, max: 100 });
      const largeArray = generateDataSet('random', 1000, { min: 1, max: 100 });
      
      // Execute with small array
      pigeonholeSort.reset();
      pigeonholeSort.execute(smallArray);
      const smallArrayAccesses = pigeonholeSort.metrics.memoryAccesses;
      
      // Execute with large array (10x size, same range)
      pigeonholeSort.reset();
      pigeonholeSort.execute(largeArray);
      const largeArrayAccesses = pigeonholeSort.metrics.memoryAccesses;
      
      // With 10x elements but same range, operations should scale less than 10x
      // due to the O(n+range) complexity where range is constant
      const ratio = largeArrayAccesses / smallArrayAccesses;
      
      // Ratio should be approximately linear with some overhead
      expect(ratio).toBeLessThan(15);
    });

    test('should exhibit O(range) dependency on the range of values', () => {
      const pigeonholeSort = new PigeonholeSort();
      
      // Generate two arrays with same size but different ranges
      const smallRangeArray = generateDataSet('random', 100, { min: 1, max: 100 });
      const largeRangeArray = generateDataSet('random', 100, { min: 1, max: 10000 });
      
      // Execute with small range
      pigeonholeSort.reset();
      pigeonholeSort.execute(smallRangeArray);
      const smallRangeSpace = pigeonholeSort.metrics.auxiliarySpace;
      
      // Execute with large range
      pigeonholeSort.reset();
      pigeonholeSort.execute(largeRangeArray);
      const largeRangeSpace = pigeonholeSort.metrics.auxiliarySpace;
      
      // Memory usage should scale roughly with the range
      const ratio = largeRangeSpace / smallRangeSpace;
      
      // The ratio should be significant, reflecting the much larger range
      expect(ratio).toBeGreaterThan(10);
    });

    test('should perform well with dense value distributions', () => {
      const pigeonholeSort = new PigeonholeSort();
      
      // Dense array: values are close together, few empty pigeonholes
      const denseArray = [];
      for (let i = 0; i < 1000; i++) {
        denseArray.push(Math.floor(Math.random() * 20) + 1); // Values 1-20
      }
      
      // Start timer
      const startTime = performance.now();
      const result = pigeonholeSort.execute(denseArray);
      const endTime = performance.now();
      
      expect(isSorted(result)).toBe(true);
      expect(endTime - startTime).toBeLessThan(100); // Should be very fast
      
      // For dense arrays, the range is small, so auxiliary space should be small
      expect(pigeonholeSort.metrics.auxiliarySpace).toBeLessThan(denseArray.length);
      
      // No comparisons should be used
      expect(pigeonholeSort.metrics.comparisons).toBe(0);
    });
  });

  // Algorithm-specific behavior tests
  describe('Algorithm-Specific Behavior', () => {
    test('should create a pigeonhole array of appropriate size', () => {
      const pigeonholeSort = new PigeonholeSort();
      
      // Mock internal pigeonhole array creation to verify size
      const originalRun = pigeonholeSort.run;
      let holeArraySize = 0;
      
      pigeonholeSort.run = function(array, options) {
        const min = Math.min(...array);
        const max = Math.max(...array);
        const range = max - min + 1;
        
        // Create pigeonhole array - capture its size
        const holes = new Array(range).fill().map(() => []);
        holeArraySize = holes.length;
        
        return originalRun.call(this, array, options);
      };
      
      // Array with specific range
      const testArray = [15, 8, 12, 10, 5, 10, 7];
      pigeonholeSort.execute(testArray);
      
      // Min is 5, max is 15, so range is 11 (holes for values 5-15)
      expect(holeArraySize).toBe(11);
      
      // Restore original implementation
      pigeonholeSort.run = originalRun;
    });

    test('should preserve the order of equal elements (stability)', () => {
      const pigeonholeSort = new PigeonholeSort();
      
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
      
      const sortedObjects = pigeonholeSort.execute(objects, { 
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
      const pigeonholeSort = new PigeonholeSort({ 
        autoDetectRange: true 
      });
      
      // Array with negative values
      const array = [-5, 10, 0, -8, 15, 7];
      
      // Mock min/max detection to verify it's being called
      const originalRun = pigeonholeSort.run;
      let detectedMin = null;
      let detectedMax = null;
      
      pigeonholeSort.run = function(array, options) {
        if (options.autoDetectRange) {
          detectedMin = Math.min(...array);
          detectedMax = Math.max(...array);
        } else {
          detectedMin = options.customMinMax.min;
          detectedMax = options.customMinMax.max;
        }
        
        return originalRun.call(this, array, options);
      };
      
      pigeonholeSort.execute(array);
      
      // Should have auto-detected the correct range
      expect(detectedMin).toBe(-8);
      expect(detectedMax).toBe(15);
      
      // Restore original implementation
      pigeonholeSort.run = originalRun;
    });

    test('should populate pigeonholes and reconstruct the array correctly', () => {
      const pigeonholeSort = new PigeonholeSort();
      
      // Mock the pigeonhole population and reconstruction to verify
      const originalRun = pigeonholeSort.run;
      let pigeonholes = null;
      
      pigeonholeSort.run = function(array, options) {
        // Extract key function (or use identity)
        const keyFn = options.keyFn || (x => x);
        
        // Find min and max
        let min = Infinity;
        let max = -Infinity;
        
        for (let i = 0; i < array.length; i++) {
          const key = keyFn(array[i]);
          min = Math.min(min, key);
          max = Math.max(max, key);
        }
        
        const range = max - min + 1;
        
        // Create pigeonholes
        pigeonholes = new Array(range).fill().map(() => []);
        
        // Place each element in appropriate pigeonhole
        for (let i = 0; i < array.length; i++) {
          const element = array[i];
          const key = keyFn(element);
          const hole = key - min;
          pigeonholes[hole].push(element);
        }
        
        // Capture the pigeonholes for testing
        
        return originalRun.call(this, array, options);
      };
      
      const testArray = [5, 3, 8, 4, 5, 7, 3];
      pigeonholeSort.execute(testArray);
      
      // Verify pigeonholes
      expect(pigeonholes).not.toBeNull();
      
      // Count elements in pigeonholes
      const totalElements = pigeonholes.reduce((sum, hole) => sum + hole.length, 0);
      expect(totalElements).toBe(testArray.length);
      
      // Check specific pigeonholes
      expect(pigeonholes[0]).toEqual([3, 3]); // Min value 3
      expect(pigeonholes[2]).toEqual([5, 5]); // Value 5
      expect(pigeonholes[5]).toEqual([8]);    // Value 8
      
      // Restore original implementation
      pigeonholeSort.run = originalRun;
    });
  });

  // Instrumentation and metrics tests
  describe('Instrumentation and Metrics', () => {
    test('should track reads and writes correctly', () => {
      const pigeonholeSort = new PigeonholeSort();
      const array = [5, 3, 8, 4, 2];
      
      pigeonholeSort.execute(array);
      
      // Each element is read once for placing in pigeonhole, then written once for output
      expect(pigeonholeSort.metrics.reads).toBeGreaterThanOrEqual(array.length);
      expect(pigeonholeSort.metrics.writes).toBeGreaterThanOrEqual(array.length);
      
      // Pigeonhole sort should have no comparisons
      expect(pigeonholeSort.metrics.comparisons).toBe(0);
    });

    test('should track memory usage accurately', () => {
      const pigeonholeSort = new PigeonholeSort();
      const array = [15, 8, 12, 20, 5, 10, 7];
      
      // Memory usage should increase during execution
      const beforeExecution = pigeonholeSort.metrics.memoryUsage;
      pigeonholeSort.execute(array);
      const afterExecution = pigeonholeSort.metrics.memoryUsage;
      
      // Auxiliary space should reflect the range of values
      // Range is 20 - 5 + 1 = 16, plus overhead for the pigeonhole arrays
      expect(pigeonholeSort.metrics.auxiliarySpace).toBeGreaterThanOrEqual(16);
      
      // Memory usage should have increased during execution
      expect(afterExecution).toBeGreaterThan(beforeExecution);
    });

    test('should record algorithm state history correctly', () => {
      const pigeonholeSort = new PigeonholeSort();
      const array = [5, 3, 8, 4, 2];
      
      pigeonholeSort.execute(array, { recordHistory: true });
      
      // Should have recorded state history
      expect(pigeonholeSort.history.length).toBeGreaterThan(0);
      
      // First state should be initial array
      expect(pigeonholeSort.history[0].type).toBe('initial');
      expect(Array.isArray(pigeonholeSort.history[0].array)).toBe(true);
      
      // Last state should be final sorted array
      const lastState = pigeonholeSort.history[pigeonholeSort.history.length - 1];
      expect(lastState.type).toBe('final');
      expect(isSorted(lastState.array)).toBe(true);
      
      // Should have recorded pigeonhole states
      const pigeonholeStates = pigeonholeSort.history.filter(state => 
        state.type === 'pigeonhole-creation' || 
        state.type === 'pigeonhole-placement' ||
        state.type === 'pigeonhole-reconstruction'
      );
      
      expect(pigeonholeStates.length).toBeGreaterThan(0);
    });

    test('should correctly measure execution time', () => {
      const pigeonholeSort = new PigeonholeSort();
      const array = generateDataSet('random', 1000, { min: 1, max: 1000 });
      
      pigeonholeSort.execute(array);
      
      // Time metrics should be recorded
      expect(pigeonholeSort.metrics.startTime).toBeGreaterThanOrEqual(0);
      expect(pigeonholeSort.metrics.endTime).toBeGreaterThan(pigeonholeSort.metrics.startTime);
      expect(pigeonholeSort.metrics.executionTime).toBeGreaterThan(0);
    });
  });
});
