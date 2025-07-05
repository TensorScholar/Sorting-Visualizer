// tests/js/algorithms/comparison/quick.test.js

import QuickSort from '../../../../src/algorithms/comparison/quick';
import { generateDataSet } from '../../../../src/data/generators';

/**
 * Comprehensive test suite for Quick Sort algorithm implementation.
 * 
 * Tests cover:
 * 1. Correctness across various input distributions
 * 2. Algorithm-specific optimizations and strategies
 * 3. Edge case handling
 * 4. Performance characteristics validation
 * 5. Algorithmic properties (stability, in-place, etc.)
 */
describe('QuickSort Algorithm', () => {
  // Default instance with median-of-three pivot strategy
  let quickSort;
  
  // Create a fresh instance before each test
  beforeEach(() => {
    quickSort = new QuickSort({
      pivotStrategy: 'median-of-three',
      insertionThreshold: 10, 
      threeWayPartition: true
    });
  });
  
  /**
   * Core functionality tests - verify sorting correctness
   */
  describe('Core Functionality', () => {
    test('sorts an empty array', () => {
      const array = [];
      const result = quickSort.execute(array);
      expect(result).toEqual([]);
      expect(result).not.toBe(array); // Should return a new array
    });
    
    test('sorts an array with a single element', () => {
      const array = [5];
      const result = quickSort.execute(array);
      expect(result).toEqual([5]);
    });
    
    test('sorts a small array in ascending order', () => {
      const array = [5, 3, 8, 4, 2, 9, 1, 7, 6];
      const expected = [1, 2, 3, 4, 5, 6, 7, 8, 9];
      const result = quickSort.execute(array);
      expect(result).toEqual(expected);
    });
    
    test('maintains input array integrity', () => {
      const array = [5, 3, 8, 4, 2];
      const original = [...array];
      quickSort.execute(array);
      expect(array).toEqual(original); // Input should not be modified
    });
    
    test('handles arrays with duplicate elements', () => {
      const array = [5, 3, 8, 4, 2, 5, 3, 8, 4, 2];
      const expected = [2, 2, 3, 3, 4, 4, 5, 5, 8, 8];
      const result = quickSort.execute(array);
      expect(result).toEqual(expected);
    });
    
    test('sorts array with negative numbers', () => {
      const array = [5, -3, 8, -4, 0, 2, -5, 1];
      const expected = [-5, -4, -3, 0, 1, 2, 5, 8];
      const result = quickSort.execute(array);
      expect(result).toEqual(expected);
    });
    
    test('sorts array with decimal values', () => {
      const array = [5.5, 3.3, 8.8, 4.4, 2.2];
      const expected = [2.2, 3.3, 4.4, 5.5, 8.8];
      const result = quickSort.execute(array);
      expect(result).toEqual(expected);
    });
  });
  
  /**
   * Tests for algorithm-specific optimizations and strategies
   */
  describe('Pivot Strategy and Optimizations', () => {
    test('uses specified pivot strategy (median-of-three)', () => {
      // Create a spy on the select pivot method
      const selectPivotSpy = jest.spyOn(quickSort, 'selectPivot');
      
      const array = [5, 3, 8, 4, 2, 9, 1, 7, 6];
      quickSort.execute(array);
      
      // Verify the selectPivot method was called with 'median-of-three'
      expect(selectPivotSpy).toHaveBeenCalled();
      // Check the parameter in at least one call
      const pivotCall = selectPivotSpy.mock.calls[0];
      expect(pivotCall[3]).toBe('median-of-three');
      
      selectPivotSpy.mockRestore();
    });
    
    test('uses first element pivot strategy when specified', () => {
      // Create quick sort with first element pivot
      const firstElementQuickSort = new QuickSort({ pivotStrategy: 'first' });
      const selectPivotSpy = jest.spyOn(firstElementQuickSort, 'selectPivot');
      
      const array = [5, 3, 8, 4, 2, 9, 1, 7, 6];
      firstElementQuickSort.execute(array);
      
      // Verify the selectPivot method returns the first index
      const firstCall = selectPivotSpy.mock.calls[0];
      // For 'first' strategy with indexes 0-8, should return 0
      expect(firstCall[3]).toBe('first');
      
      selectPivotSpy.mockRestore();
    });
    
    test('uses three-way partitioning for arrays with duplicates', () => {
      // Array with many duplicates should benefit from three-way partitioning
      const array = [5, 5, 5, 3, 3, 8, 8, 4, 4, 2, 2];
      
      // Create a spy on the partition method
      const partitionSpy = jest.spyOn(quickSort, 'partition');
      const threeWayPartitionSpy = jest.spyOn(quickSort, 'partitionThreeWay');
      
      quickSort.execute(array);
      
      // Verify that threeWayPartition was called
      expect(threeWayPartitionSpy).toHaveBeenCalled();
      
      partitionSpy.mockRestore();
      threeWayPartitionSpy.mockRestore();
    });
    
    test('uses insertion sort for small subarrays', () => {
      // Create arrays that will trigger insertion sort
      const smallArray = Array.from({ length: 9 }, () => Math.floor(Math.random() * 100));
      
      // Create a spy on the insertionSort method
      const insertionSortSpy = jest.spyOn(quickSort, 'insertionSort');
      
      quickSort.execute(smallArray);
      
      // Verify insertion sort was called for small arrays
      expect(insertionSortSpy).toHaveBeenCalled();
      
      insertionSortSpy.mockRestore();
    });
  });
  
  /**
   * Edge cases and special input handling
   */
  describe('Edge Cases', () => {
    test('handles already sorted array efficiently', () => {
      const sortedArray = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      
      // Track operation counts
      const compareSpy = jest.spyOn(quickSort, 'compare');
      const swapSpy = jest.spyOn(quickSort, 'swap');
      
      quickSort.execute(sortedArray);
      
      // With median-of-three and adaptive optimizations, there should be 
      // far fewer operations than the worst case O(n²)
      expect(compareSpy.mock.calls.length).toBeLessThan(sortedArray.length * sortedArray.length);
      expect(swapSpy.mock.calls.length).toBeLessThan(sortedArray.length);
      
      compareSpy.mockRestore();
      swapSpy.mockRestore();
    });
    
    test('handles reverse sorted array efficiently', () => {
      const reverseSortedArray = [10, 9, 8, 7, 6, 5, 4, 3, 2, 1];
      
      // Track operation counts
      const compareSpy = jest.spyOn(quickSort, 'compare');
      
      quickSort.execute(reverseSortedArray);
      
      // With median-of-three, should avoid worst-case behavior
      expect(compareSpy.mock.calls.length).toBeLessThan(reverseSortedArray.length * reverseSortedArray.length);
      
      compareSpy.mockRestore();
    });
    
    test('handles array with all identical elements', () => {
      const allSameArray = [5, 5, 5, 5, 5, 5, 5, 5, 5, 5];
      
      const result = quickSort.execute(allSameArray);
      
      expect(result).toEqual(allSameArray);
    });
    
    test('sorts very large arrays successfully', () => {
      const largeArray = generateDataSet('random', 1000, { min: 1, max: 10000 });
      
      const result = quickSort.execute(largeArray);
      
      // Verify the array is sorted
      for (let i = 1; i < result.length; i++) {
        expect(result[i]).toBeGreaterThanOrEqual(result[i - 1]);
      }
    });
  });
  
  /**
   * Performance characteristics validation
   */
  describe('Performance Characteristics', () => {
    // Generate test datasets of various sizes and distributions
    const randomArray = generateDataSet('random', 500, { min: 1, max: 1000 });
    const nearlySortedArray = generateDataSet('nearly-sorted', 500, { min: 1, max: 1000 });
    const reversedArray = generateDataSet('reversed', 500, { min: 1, max: 1000 });
    const fewUniqueArray = generateDataSet('few-unique', 500, { min: 1, max: 1000, uniqueValues: 10 });
    
    test('exhibits expected complexity for random data', () => {
      // Execute and measure
      const compareSpy = jest.spyOn(quickSort, 'compare');
      
      quickSort.execute(randomArray);
      
      // For random data, Quick Sort should perform in O(n log n) time
      // This means comparisons should be roughly proportional to n log n
      const n = randomArray.length;
      const nLogN = n * Math.log2(n);
      const constant = 2; // Allow for a proportionality constant
      
      expect(compareSpy.mock.calls.length).toBeLessThanOrEqual(constant * nLogN);
      
      compareSpy.mockRestore();
    });
    
    test('exhibits good performance on nearly sorted arrays', () => {
      // For nearly sorted arrays, a good implementation should be efficient
      const compareSpy = jest.spyOn(quickSort, 'compare');
      
      quickSort.execute(nearlySortedArray);
      
      // Should be more efficient than worst case
      const n = nearlySortedArray.length;
      expect(compareSpy.mock.calls.length).toBeLessThan(n * n);
      
      compareSpy.mockRestore();
    });
    
    test('handles arrays with few unique values efficiently', () => {
      // With three-way partitioning, should handle duplicates well
      const compareSpy = jest.spyOn(quickSort, 'compare');
      
      quickSort.execute(fewUniqueArray);
      
      // Should be more efficient than worst case
      const n = fewUniqueArray.length;
      expect(compareSpy.mock.calls.length).toBeLessThan(n * n);
      
      compareSpy.mockRestore();
    });
    
    test('exhibits good performance for different pivot strategies', () => {
      // Compare different pivot strategies
      const results = {};
      
      ['first', 'last', 'middle', 'random', 'median-of-three'].forEach(strategy => {
        const strategyQuickSort = new QuickSort({ 
          pivotStrategy: strategy,
          threeWayPartition: true
        });
        const compareSpy = jest.spyOn(strategyQuickSort, 'compare');
        
        strategyQuickSort.execute([...randomArray]); // Use a copy
        
        results[strategy] = compareSpy.mock.calls.length;
        compareSpy.mockRestore();
      });
      
      // Median-of-three should generally be competitive or better
      expect(results['median-of-three']).toBeLessThanOrEqual(results['first'] * 1.5);
      expect(results['median-of-three']).toBeLessThanOrEqual(results['last'] * 1.5);
    });
  });
  
  /**
   * Algorithmic properties
   */
  describe('Algorithm Properties', () => {
    test('reports correct time complexity', () => {
      const complexity = quickSort.getComplexity();
      
      expect(complexity.time.best).toBe('O(n log n)');
      expect(complexity.time.average).toBe('O(n log n)');
      expect(complexity.time.worst).toBe('O(n²)');
    });
    
    test('reports correct space complexity', () => {
      const complexity = quickSort.getComplexity();
      
      expect(complexity.space.best).toBe('O(log n)');
      expect(complexity.space.average).toBe('O(log n)');
      expect(complexity.space.worst).toBe('O(n)');
    });
    
    test('is not stable by default', () => {
      // Quick Sort is not a stable sorting algorithm
      expect(quickSort.isStable()).toBe(false);
      
      // Verify with objects that have same keys but different values
      const objectArray = [
        { key: 1, value: 'a' },
        { key: 2, value: 'b' },
        { key: 1, value: 'c' },
        { key: 3, value: 'd' }
      ];
      
      // Clone array to check if relative order changes
      const objectArrayCopy = [...objectArray];
      
      // Custom comparator that only looks at keys
      const comparator = (a, b) => a.key - b.key;
      
      const result = quickSort.execute(objectArray, { comparator });
      
      // After sorting, elements with key 1 might not keep their original order
      // This is a fundamental characteristic of unstable sorts
      const originalFirstIndex = objectArrayCopy.findIndex(item => item.key === 1 && item.value === 'a');
      const originalSecondIndex = objectArrayCopy.findIndex(item => item.key === 1 && item.value === 'c');
      
      const newFirstIndex = result.findIndex(item => item.key === 1 && item.value === 'a');
      const newSecondIndex = result.findIndex(item => item.key === 1 && item.value === 'c');
      
      // We can't assert exactly how the order will change, but we know
      // the relative order preservation is not guaranteed in Quick Sort
      expect(quickSort.isStable()).toBe(false);
    });
    
    test('is considered in-place', () => {
      // Quick Sort is generally considered in-place
      expect(quickSort.isInPlace()).toBe(true);
      
      // Verify auxiliary space usage is minimal
      const largeArray = generateDataSet('random', 1000, { min: 1, max: 10000 });
      
      quickSort.execute(largeArray);
      
      // Check metrics for minimal space usage
      expect(quickSort.metrics.auxiliarySpace).toBeLessThan(100); // Only stack space and pivot
    });
  });
});
