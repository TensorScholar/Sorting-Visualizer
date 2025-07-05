// tests/js/algorithms/comparison/insertion.test.js

/**
 * @file Comprehensive test suite for Insertion Sort algorithm implementation.
 * @author Advanced Sorting Algorithm Visualization Platform
 * @version 1.0.0
 *
 * This test suite provides systematic verification of the Insertion Sort algorithm,
 * validating functional correctness, edge cases, and algorithmic characteristics.
 * Insertion Sort builds the final sorted array one element at a time by repeatedly
 * inserting the next unsorted element into its correct position within the already
 * sorted portion of the array.
 */

import InsertionSort from '../../../../src/algorithms/comparison/insertion';

// Import test utilities and fixtures
import { 
  generateRandomArray,
  generateSortedArray,
  generateReversedArray,
  generateNearlySortedArray,
  generateArrayWithDuplicates,
  generateEmptyArray,
  generateSingleElementArray,
  isSorted
} from '../../../__fixtures__/array-utils';

// Instantiate algorithm with various configurations for testing
const createDefaultInsertionSort = () => new InsertionSort();
const createInsertionSortWithEarlyTermination = () => new InsertionSort({ earlyTermination: true });
const createInsertionSortWithoutEarlyTermination = () => new InsertionSort({ earlyTermination: false });
const createGappedInsertionSort = () => new InsertionSort({ gapSize: 3 });

/**
 * Comprehensive test suite for Insertion Sort algorithm
 */
describe('Insertion Sort Algorithm', () => {
  /**
   * Core functionality tests that verify sorting capabilities
   * across various input distributions
   */
  describe('Functional Correctness', () => {
    test('sorts a random array correctly', () => {
      // Arrange
      const array = generateRandomArray(100, 1, 1000);
      const insertionSort = createDefaultInsertionSort();
      
      // Act
      const result = insertionSort.execute(array);
      
      // Assert
      expect(isSorted(result)).toBe(true);
      expect(result.length).toBe(array.length);
    });
    
    test('handles already sorted array efficiently with minimal operations', () => {
      // Arrange
      const array = generateSortedArray(100, 1, 1000);
      const insertionSort = createDefaultInsertionSort();
      
      // Act
      const result = insertionSort.execute(array);
      
      // Assert
      expect(isSorted(result)).toBe(true);
      expect(result.length).toBe(array.length);
      // For a sorted array, insertion sort should only do n-1 comparisons
      expect(insertionSort.metrics.comparisons).toBe(array.length - 1);
      // And no swaps or shifts
      expect(insertionSort.metrics.swaps).toBe(0);
    });
    
    test('sorts reversed array correctly', () => {
      // Arrange
      const array = generateReversedArray(100, 1, 1000);
      const insertionSort = createDefaultInsertionSort();
      
      // Act
      const result = insertionSort.execute(array);
      
      // Assert
      expect(isSorted(result)).toBe(true);
      expect(result.length).toBe(array.length);
    });
    
    test('sorts array with duplicate values correctly', () => {
      // Arrange
      const array = generateArrayWithDuplicates(100, 20);
      const insertionSort = createDefaultInsertionSort();
      
      // Act
      const result = insertionSort.execute(array);
      
      // Assert
      expect(isSorted(result)).toBe(true);
      expect(result.length).toBe(array.length);
    });
    
    test('maintains correct order of equal elements (stability test)', () => {
      // Arrange
      const array = [
        { key: 3, value: 'A' },
        { key: 1, value: 'B' },
        { key: 2, value: 'C' },
        { key: 1, value: 'D' },
        { key: 3, value: 'E' },
        { key: 2, value: 'F' }
      ];
      const insertionSort = createDefaultInsertionSort();
      
      // Create custom comparator for objects
      const comparator = (a, b) => a.key - b.key;
      
      // Act
      const result = insertionSort.execute(array, { comparator });
      
      // Assert
      // Check that elements with same key maintain their original relative order
      expect(result[0].key).toBe(1);
      expect(result[1].key).toBe(1);
      expect(result[0].value).toBe('B'); // 'B' should come before 'D' (stability check)
      expect(result[1].value).toBe('D');
      
      expect(result[2].key).toBe(2);
      expect(result[3].key).toBe(2);
      expect(result[2].value).toBe('C'); // 'C' should come before 'F' (stability check)
      expect(result[3].value).toBe('F');
      
      expect(result[4].key).toBe(3);
      expect(result[5].key).toBe(3);
      expect(result[4].value).toBe('A'); // 'A' should come before 'E' (stability check)
      expect(result[5].value).toBe('E');
    });
  });
  
  /**
   * Edge case tests that verify algorithm robustness
   * when handling unusual or boundary inputs
   */
  describe('Edge Cases', () => {
    test('handles empty array correctly', () => {
      // Arrange
      const array = generateEmptyArray();
      const insertionSort = createDefaultInsertionSort();
      
      // Act
      const result = insertionSort.execute(array);
      
      // Assert
      expect(result).toEqual([]);
      expect(insertionSort.metrics.comparisons).toBe(0);
      expect(insertionSort.metrics.swaps).toBe(0);
    });
    
    test('handles single element array correctly', () => {
      // Arrange
      const array = generateSingleElementArray(42);
      const insertionSort = createDefaultInsertionSort();
      
      // Act
      const result = insertionSort.execute(array);
      
      // Assert
      expect(result).toEqual([42]);
      expect(insertionSort.metrics.comparisons).toBe(0);
      expect(insertionSort.metrics.swaps).toBe(0);
    });
    
    test('handles array with negative values correctly', () => {
      // Arrange
      const array = [-5, 10, -15, 20, -25];
      const insertionSort = createDefaultInsertionSort();
      
      // Act
      const result = insertionSort.execute(array);
      
      // Assert
      expect(result).toEqual([-25, -15, -5, 10, 20]);
    });
    
    test('handles large values without overflow', () => {
      // Arrange
      const array = [Number.MAX_SAFE_INTEGER, Number.MIN_SAFE_INTEGER, 0];
      const insertionSort = createDefaultInsertionSort();
      
      // Act
      const result = insertionSort.execute(array);
      
      // Assert
      expect(result).toEqual([Number.MIN_SAFE_INTEGER, 0, Number.MAX_SAFE_INTEGER]);
    });
  });
  
  /**
   * Algorithm-specific tests that verify the characteristic
   * behaviors and optimizations of Insertion Sort
   */
  describe('Algorithm Characteristics', () => {
    test('performs well on nearly sorted arrays', () => {
      // Arrange
      const nearlySortedArray = generateNearlySortedArray(100, 1, 1000, 0.95);
      const randomArray = generateRandomArray(100, 1, 1000);
      const insertionSort = createDefaultInsertionSort();
      
      // Act - Nearly sorted
      insertionSort.execute([...nearlySortedArray]);
      const nearlySortedComparisons = insertionSort.metrics.comparisons;
      const nearlySortedSwaps = insertionSort.metrics.swaps;
      
      // Reset and run with random data
      insertionSort.reset();
      insertionSort.execute([...randomArray]);
      const randomComparisons = insertionSort.metrics.comparisons;
      const randomSwaps = insertionSort.metrics.swaps;
      
      // Assert
      // Nearly sorted array should require significantly fewer operations
      expect(nearlySortedComparisons).toBeLessThan(randomComparisons * 0.5);
      expect(nearlySortedSwaps).toBeLessThan(randomSwaps * 0.5);
    });
    
    test('early termination optimization reduces operations on sorted segments', () => {
      // Arrange
      const array = generateNearlySortedArray(100, 1, 1000, 0.9);
      const optimizedSort = createInsertionSortWithEarlyTermination();
      const standardSort = createInsertionSortWithoutEarlyTermination();
      
      // Act
      optimizedSort.execute([...array]);
      standardSort.execute([...array]);
      
      // Assert
      // Optimized version should perform fewer comparisons
      expect(optimizedSort.metrics.comparisons).toBeLessThan(standardSort.metrics.comparisons);
    });
    
    test('gapped insertion sort (Shell sort first pass) performs fewer swaps', () => {
      // Arrange
      const array = generateRandomArray(100, 1, 1000);
      const standardSort = createDefaultInsertionSort();
      const gappedSort = createGappedInsertionSort();
      
      // Act
      standardSort.execute([...array]);
      gappedSort.execute([...array]);
      
      // Assert
      // Gap optimization should reduce the number of swaps needed
      expect(gappedSort.metrics.swaps).toBeLessThan(standardSort.metrics.swaps);
    });
    
    test('showcases worst-case behavior on reversed array', () => {
      // Arrange
      const n = 50; // Small size to avoid excessive test runtime
      const array = generateReversedArray(n, 1, 1000);
      const insertionSort = createDefaultInsertionSort();
      
      // Act
      insertionSort.execute(array);
      
      // Assert
      // For reversed array, insertion sort should perform approximately n²/2 comparisons
      // and n²/2 swaps (up to constant factors)
      const expectedOperationsApprox = (n * n) / 2;
      
      // Allow some margin for implementation specifics
      expect(insertionSort.metrics.comparisons).toBeGreaterThan(expectedOperationsApprox * 0.5);
      expect(insertionSort.metrics.comparisons).toBeLessThan(expectedOperationsApprox * 1.5);
      
      expect(insertionSort.metrics.swaps).toBeGreaterThan(expectedOperationsApprox * 0.5);
      expect(insertionSort.metrics.swaps).toBeLessThan(expectedOperationsApprox * 1.5);
    });
    
    test('verifies insertion sort is stable', () => {
      // Arrange
      const insertionSort = createDefaultInsertionSort();
      
      // Act
      const isStable = insertionSort.isStable();
      
      // Assert
      expect(isStable).toBe(true);
    });
    
    test('verifies insertion sort is in-place', () => {
      // Arrange
      const insertionSort = createDefaultInsertionSort();
      
      // Act
      const isInPlace = insertionSort.isInPlace();
      
      // Assert
      expect(isInPlace).toBe(true);
    });
    
    test('validates time complexity information', () => {
      // Arrange
      const insertionSort = createDefaultInsertionSort();
      
      // Act
      const complexity = insertionSort.getComplexity();
      
      // Assert
      expect(complexity.time.best).toBe('O(n)');
      expect(complexity.time.average).toBe('O(n²)');
      expect(complexity.time.worst).toBe('O(n²)');
      
      expect(complexity.space.best).toBe('O(1)');
      expect(complexity.space.average).toBe('O(1)');
      expect(complexity.space.worst).toBe('O(1)');
    });
  });
  
  /**
   * Tests that verify proper instrumentation is provided
   * for visualization and analytics
   */
  describe('Instrumentation', () => {
    test('records the correct number of array accesses', () => {
      // Arrange
      const array = [5, 3, 8, 4, 2];
      const insertionSort = createDefaultInsertionSort();
      
      // Act
      insertionSort.execute(array);
      
      // Assert
      expect(insertionSort.metrics.memoryAccesses).toBe(
        insertionSort.metrics.reads + insertionSort.metrics.writes
      );
    });
    
    test('properly tracks shifts in insertion sort', () => {
      // Arrange
      const array = [5, 3, 8, 4, 2];
      const insertionSort = createDefaultInsertionSort();
      
      // Collect shift operations
      const shifts = [];
      insertionSort.on('step', (data) => {
        if (data.state.type === 'shift') {
          shifts.push({
            index: data.state.index,
            value: data.state.value
          });
        }
      });
      
      // Act
      insertionSort.execute(array);
      
      // Assert
      expect(shifts.length).toBeGreaterThan(0);
      
      // Verify that shift operations correspond to writes
      expect(shifts.length).toBeLessThanOrEqual(insertionSort.metrics.writes);
    });
    
    test('records state history during execution', () => {
      // Arrange
      const array = [5, 3, 8, 4, 2];
      const insertionSort = createDefaultInsertionSort();
      
      // Act
      insertionSort.execute(array);
      
      // Assert
      expect(insertionSort.history.length).toBeGreaterThan(0);
      
      // First state should be initial array
      expect(insertionSort.history[0].type).toBe('initial');
      
      // Last state should be final sorted array
      const lastState = insertionSort.history[insertionSort.history.length - 1];
      expect(lastState.type).toBe('final');
      expect(lastState.array).toEqual([2, 3, 4, 5, 8]);
    });
    
    test('provides detailed algorithm information', () => {
      // Arrange
      const insertionSort = createDefaultInsertionSort();
      
      // Act
      const info = insertionSort.getInfo();
      
      // Assert
      expect(info.name).toBe('Insertion Sort');
      expect(info.category).toBe('comparison');
      expect(info.complexity).toBeDefined();
      expect(info.stability).toBe(true);
      expect(info.inPlace).toBe(true);
      
      // Should have optimization-specific information
      expect(info.optimization).toBeDefined();
      expect(info.suitable).toBeDefined();
    });
  });
  
  /**
   * Performance tests that verify algorithm behavior on specific use cases
   * Note: These tests are marked as optional as they might be slow on CI
   */
  describe('Performance Characteristics', () => {
    // Skip performance tests in CI environment or when running quick tests
    const runPerformanceTests = process.env.RUN_PERFORMANCE_TESTS === 'true';
    
    (runPerformanceTests ? test : test.skip)('exhibits linear-time behavior on sorted arrays', () => {
      // Arrange
      const sizes = [100, 200, 300, 400, 500];
      const operations = [];
      const insertionSort = createDefaultInsertionSort();
      
      // Act - measure operations for each size
      for (const size of sizes) {
        const array = generateSortedArray(size, 1, 1000);
        insertionSort.reset();
        insertionSort.execute(array);
        operations.push(insertionSort.metrics.comparisons);
      }
      
      // Assert
      // In a sorted array, operations should grow linearly with input size
      for (let i = 1; i < sizes.length; i++) {
        const operationRatio = operations[i] / operations[i-1];
        const sizeRatio = sizes[i] / sizes[i-1];
        
        // Operation growth should match size growth within a margin
        expect(operationRatio).toBeGreaterThan(sizeRatio * 0.8);
        expect(operationRatio).toBeLessThan(sizeRatio * 1.2);
      }
    });
    
    (runPerformanceTests ? test : test.skip)('exhibits quadratic-time behavior on reversed arrays', () => {
      // Arrange
      const sizes = [20, 40, 60, 80, 100]; // Small sizes for quadratic algorithm
      const operations = [];
      const insertionSort = createDefaultInsertionSort();
      
      // Act - measure operations for each size
      for (const size of sizes) {
        const array = generateReversedArray(size, 1, 1000);
        insertionSort.reset();
        insertionSort.execute(array);
        operations.push(insertionSort.metrics.comparisons + insertionSort.metrics.swaps);
      }
      
      // Assert
      // In a reversed array, operations should grow quadratically with input size
      for (let i = 1; i < sizes.length; i++) {
        const operationRatio = operations[i] / operations[i-1];
        const sizeRatio = (sizes[i] * sizes[i]) / (sizes[i-1] * sizes[i-1]);
        
        // Operation growth should match quadratic growth within a margin
        expect(operationRatio).toBeGreaterThan(sizeRatio * 0.7);
        expect(operationRatio).toBeLessThan(sizeRatio * 1.3);
      }
    });
  });
});
