// tests/js/algorithms/comparison/bubble.test.js

/**
 * @fileoverview Comprehensive test suite for Bubble Sort algorithm implementation.
 * 
 * This test suite validates the correctness, performance characteristics,
 * and optimization behaviors of the Bubble Sort algorithm. It examines
 * the algorithm's behavior across various input types, sizes, and distributions
 * while verifying expected computational complexity and optimization efficacy.
 */

import BubbleSort from '../../../../src/algorithms/comparison/bubble';
import { generateDataSet } from '../../../../src/data/generators';

// Test fixture data
const TEST_ARRAYS = {
  empty: [],
  single: [42],
  sorted: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  reversed: [10, 9, 8, 7, 6, 5, 4, 3, 2, 1],
  nearlySorted: [1, 2, 3, 5, 4, 6, 7, 8, 10, 9],
  randomSmall: [42, 17, 34, 12, 59, 23],
  withDuplicates: [7, 3, 7, 5, 1, 3, 9, 5],
  negativeValues: [-5, -10, -3, -1, -7]
};

/**
 * Verify that an array is correctly sorted
 * @param {Array} arr - The array to check
 * @returns {boolean} - True if the array is sorted
 */
function isSorted(arr) {
  for (let i = 1; i < arr.length; i++) {
    if (arr[i] < arr[i - 1]) return false;
  }
  return true;
}

/**
 * Create a stable sort test array with objects containing equal keys
 * @returns {Array} - Array of objects with keys and original indices
 */
function createStabilitySortTestArray() {
  return [
    { key: 3, originalIndex: 0 },
    { key: 1, originalIndex: 1 },
    { key: 3, originalIndex: 2 },
    { key: 2, originalIndex: 3 },
    { key: 1, originalIndex: 4 }
  ];
}

describe('Bubble Sort Algorithm', () => {
  let bubbleSort;
  
  beforeEach(() => {
    // Create a fresh instance for each test
    bubbleSort = new BubbleSort();
  });
  
  describe('Correctness Tests', () => {
    test('should correctly sort an empty array', () => {
      const result = bubbleSort.execute(TEST_ARRAYS.empty);
      expect(result).toEqual([]);
    });
    
    test('should correctly sort an array with a single element', () => {
      const result = bubbleSort.execute(TEST_ARRAYS.single);
      expect(result).toEqual(TEST_ARRAYS.single);
    });
    
    test('should correctly sort a sorted array', () => {
      const result = bubbleSort.execute(TEST_ARRAYS.sorted);
      expect(result).toEqual(TEST_ARRAYS.sorted);
    });
    
    test('should correctly sort a reversed array', () => {
      const result = bubbleSort.execute(TEST_ARRAYS.reversed);
      expect(result).toEqual([...TEST_ARRAYS.reversed].sort((a, b) => a - b));
    });
    
    test('should correctly sort an array with duplicate elements', () => {
      const result = bubbleSort.execute(TEST_ARRAYS.withDuplicates);
      expect(result).toEqual([...TEST_ARRAYS.withDuplicates].sort((a, b) => a - b));
    });
    
    test('should correctly sort an array with negative values', () => {
      const result = bubbleSort.execute(TEST_ARRAYS.negativeValues);
      expect(result).toEqual([...TEST_ARRAYS.negativeValues].sort((a, b) => a - b));
    });
    
    test('should correctly sort larger random arrays', () => {
      const randomArray = Array.from({ length: 100 }, () => Math.floor(Math.random() * 1000));
      const result = bubbleSort.execute(randomArray);
      expect(isSorted(result)).toBe(true);
    });
    
    test('should maintain the original input array without modification', () => {
      const original = [...TEST_ARRAYS.randomSmall];
      bubbleSort.execute(TEST_ARRAYS.randomSmall);
      expect(TEST_ARRAYS.randomSmall).toEqual(original);
    });
  });
  
  describe('Optimization Behavior Tests', () => {
    test('should use early termination optimization with sorted arrays', () => {
      const sortedArray = [...TEST_ARRAYS.sorted];
      bubbleSort = new BubbleSort({ optimize: true });
      
      // Spy on the internal swap method to track calls
      const swapSpy = jest.spyOn(bubbleSort, 'swap');
      
      bubbleSort.execute(sortedArray);
      
      // Should terminate early with no swaps
      expect(swapSpy).not.toHaveBeenCalled();
      expect(bubbleSort.metrics.swaps).toBe(0);
    });
    
    test('should not use early termination when disabled', () => {
      // Create a sorter with optimization disabled
      bubbleSort = new BubbleSort({ optimize: false });
      
      // Spy on the internal swap method to track calls
      const swapSpy = jest.spyOn(bubbleSort, 'swap');
      
      bubbleSort.execute(TEST_ARRAYS.sorted);
      
      // Should go through all n-1 passes even with no swaps needed
      // The number of comparisons should be higher without early termination
      expect(bubbleSort.metrics.comparisons).toBeGreaterThan(TEST_ARRAYS.sorted.length);
      
      swapSpy.mockRestore();
    });
    
    test('should track the sorted boundary correctly when adaptive mode is enabled', () => {
      const testArray = [3, 5, 1, 2, 4];
      bubbleSort = new BubbleSort({ adaptive: true });
      
      // Create a spy to track the boundary changes
      const recordStateSpy = jest.spyOn(bubbleSort, 'recordState');
      
      bubbleSort.execute(testArray);
      
      // Verify that the boundary is updated correctly during execution
      // We check if there's at least one call that logs a sorted portion
      expect(recordStateSpy.mock.calls.some(call => 
        call[1]?.type === 'sorted' && call[1]?.indices?.length > 0
      )).toBe(true);
      
      recordStateSpy.mockRestore();
    });
  });
  
  describe('Performance Characteristic Tests', () => {
    test('should perform better on nearly-sorted arrays with optimization enabled', () => {
      const randomArray = generateDataSet('random', 100);
      const nearlySortedArray = generateDataSet('nearly-sorted', 100, { sortedRatio: 0.9 });
      
      // With optimization
      bubbleSort = new BubbleSort({ optimize: true });
      
      // Measure performance on random array
      bubbleSort.execute(randomArray);
      const randomComparisons = bubbleSort.metrics.comparisons;
      
      // Reset metrics
      bubbleSort.reset();
      
      // Measure performance on nearly-sorted array
      bubbleSort.execute(nearlySortedArray);
      const nearlySortedComparisons = bubbleSort.metrics.comparisons;
      
      // Should perform fewer comparisons on nearly-sorted array due to early termination
      expect(nearlySortedComparisons).toBeLessThan(randomComparisons);
    });
    
    test('should exhibit O(n²) worst-case time complexity', () => {
      // Test with multiple sizes to verify quadratic growth pattern
      const sizes = [10, 20, 30];
      const comparisonCounts = [];
      
      // Use reversed arrays (worst case for bubble sort)
      for (const size of sizes) {
        const array = Array.from({ length: size }, (_, i) => size - i);
        bubbleSort = new BubbleSort({ optimize: false }); // Disable optimizations
        
        bubbleSort.execute(array);
        comparisonCounts.push(bubbleSort.metrics.comparisons);
      }
      
      // Verify that comparison counts grow approximately quadratically
      // For a quadratic algorithm, if we double the input size, the operations
      // should increase by approximately 4x
      // We use a tolerance factor since the exact counts may vary
      
      const ratio1 = comparisonCounts[1] / comparisonCounts[0];
      const ratio2 = comparisonCounts[2] / comparisonCounts[1];
      
      // Expected ratio for n²: (2n)²/n² = 4
      // We allow some margin for implementation variations
      const expectedRatio = (sizes[1] / sizes[0]) ** 2;
      
      expect(ratio1).toBeCloseTo(expectedRatio, 0);
      expect(ratio2).toBeCloseTo(expectedRatio, 0);
    });
    
    test('should exhibit O(n) best-case time complexity with optimization', () => {
      // Test with increasing sizes to verify linear performance on sorted arrays
      const sizes = [100, 200, 300];
      const operationCounts = [];
      
      // Use already sorted arrays
      for (const size of sizes) {
        const array = Array.from({ length: size }, (_, i) => i);
        bubbleSort = new BubbleSort({ optimize: true });
        
        bubbleSort.execute(array);
        // We add comparisons and swaps to get total operations
        operationCounts.push(bubbleSort.metrics.comparisons + bubbleSort.metrics.swaps);
      }
      
      // Verify that operation counts grow approximately linearly
      // For a linear algorithm, if we double the input size, the operations
      // should increase by approximately 2x
      
      const ratio1 = operationCounts[1] / operationCounts[0];
      const ratio2 = operationCounts[2] / operationCounts[1];
      
      // Expected ratio for n: (2n)/n = 2
      // We allow some margin for implementation variations
      const expectedRatio = sizes[1] / sizes[0];
      
      expect(ratio1).toBeCloseTo(expectedRatio, 0);
      expect(ratio2).toBeCloseTo(expectedRatio, 0);
    });
  });
  
  describe('Property Tests', () => {
    test('should be a stable sorting algorithm', () => {
      const objectArray = createStabilitySortTestArray();
      
      // Create a custom comparator that only looks at the key property
      const keyComparator = (a, b) => a.key - b.key;
      
      // Execute bubble sort with custom comparator
      bubbleSort = new BubbleSort();
      const result = bubbleSort.execute(objectArray, { comparator: keyComparator });
      
      // Check if the algorithm maintains the relative order of equal elements
      // Elements with the same key should maintain their original relative order
      
      // First find all elements with the same keys
      const keyGroups = {};
      result.forEach(item => {
        if (!keyGroups[item.key]) keyGroups[item.key] = [];
        keyGroups[item.key].push(item);
      });
      
      // Check if original indices are still in ascending order within each key group
      Object.values(keyGroups).forEach(group => {
        const originalIndices = group.map(item => item.originalIndex);
        const sortedIndices = [...originalIndices].sort((a, b) => a - b);
        expect(originalIndices).toEqual(sortedIndices);
      });
    });
    
    test('should be an in-place sorting algorithm', () => {
      const array = [...TEST_ARRAYS.randomSmall];
      
      // Execute bubble sort and track memory usage
      bubbleSort.execute(array);
      
      // Verify that auxiliary space used is O(1) - should be constant regardless of input size
      // Bubble sort should not allocate arrays proportional to input size
      expect(bubbleSort.metrics.auxiliarySpace).toBeLessThan(100); // Just a small constant amount
    });
    
    test('getComplexity() should return correct complexity information', () => {
      const complexity = bubbleSort.getComplexity();
      
      // With optimization enabled
      bubbleSort = new BubbleSort({ optimize: true });
      const complexityWithOpt = bubbleSort.getComplexity();
      
      // Verify time complexity
      expect(complexity.time.worst).toBe('O(n²)');
      expect(complexity.time.average).toBe('O(n²)');
      // Best case should be O(n) with optimization, O(n²) without
      expect(complexityWithOpt.time.best).toBe('O(n)');
      
      // Verify space complexity
      expect(complexity.space.worst).toBe('O(1)');
      expect(complexity.space.best).toBe('O(1)');
    });
    
    test('isStable() should return true', () => {
      expect(bubbleSort.isStable()).toBe(true);
    });
    
    test('isInPlace() should return true', () => {
      expect(bubbleSort.isInPlace()).toBe(true);
    });
  });
  
  describe('Instrumentation Tests', () => {
    test('should correctly count comparisons, swaps, reads, and writes', () => {
      const testArray = [5, 3, 1, 4, 2];
      bubbleSort.execute(testArray);
      
      // Ensure metrics are being tracked
      expect(bubbleSort.metrics.comparisons).toBeGreaterThan(0);
      expect(bubbleSort.metrics.swaps).toBeGreaterThan(0);
      expect(bubbleSort.metrics.reads).toBeGreaterThan(0);
      expect(bubbleSort.metrics.writes).toBeGreaterThan(0);
      
      // Verify the relationship between metrics
      // Each swap involves 2 reads and 2 writes
      expect(bubbleSort.metrics.writes).toBe(bubbleSort.metrics.swaps * 2);
      expect(bubbleSort.metrics.reads).toBe(bubbleSort.metrics.comparisons * 2 + bubbleSort.metrics.swaps * 2);
    });
    
    test('should record algorithm execution history when enabled', () => {
      const testArray = [5, 3, 1, 4, 2];
      bubbleSort.execute(testArray, { recordHistory: true });
      
      // Verify that history is recorded
      expect(bubbleSort.history.length).toBeGreaterThan(0);
      
      // First state should be initial array
      expect(bubbleSort.history[0].type).toBe('initial');
      expect(bubbleSort.history[0].array).toEqual(testArray);
      
      // Last state should be final sorted array
      const lastState = bubbleSort.history[bubbleSort.history.length - 1];
      expect(lastState.type).toBe('final');
      expect(lastState.array).toEqual([1, 2, 3, 4, 5]);
    });
    
    test('should not record history when disabled', () => {
      bubbleSort.execute(TEST_ARRAYS.randomSmall, { recordHistory: false });
      expect(bubbleSort.history.length).toBe(0);
    });
  });
});
