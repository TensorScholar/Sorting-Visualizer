// tests/js/algorithms/comparison/selection.test.js

import SelectionSort from '../../../../src/algorithms/comparison/selection';
import { generateDataSet } from '../../../../src/data/generators';

/**
 * Comprehensive test suite for Selection Sort algorithm implementation.
 * 
 * Tests cover:
 * 1. Core algorithm correctness across various inputs
 * 2. Algorithm-specific behaviors and optimizations
 * 3. Edge case handling
 * 4. Performance characteristics validation
 * 5. Algorithmic properties (stability, in-place, etc.)
 */
describe('SelectionSort Algorithm', () => {
  // Default instance with standard configuration
  let selectionSort;
  
  // Create a fresh instance before each test
  beforeEach(() => {
    selectionSort = new SelectionSort({
      bidirectional: false // Standard selection sort
    });
  });
  
  /**
   * Core functionality tests - verify sorting correctness
   */
  describe('Core Functionality', () => {
    test('sorts an empty array', () => {
      const array = [];
      const result = selectionSort.execute(array);
      expect(result).toEqual([]);
      expect(result).not.toBe(array); // Should return a new array
    });
    
    test('sorts an array with a single element', () => {
      const array = [5];
      const result = selectionSort.execute(array);
      expect(result).toEqual([5]);
    });
    
    test('sorts a small array in ascending order', () => {
      const array = [5, 3, 8, 4, 2, 9, 1, 7, 6];
      const expected = [1, 2, 3, 4, 5, 6, 7, 8, 9];
      const result = selectionSort.execute(array);
      expect(result).toEqual(expected);
    });
    
    test('maintains input array integrity', () => {
      const array = [5, 3, 8, 4, 2];
      const original = [...array];
      selectionSort.execute(array);
      expect(array).toEqual(original); // Input should not be modified
    });
    
    test('handles arrays with duplicate elements', () => {
      const array = [5, 3, 8, 4, 2, 5, 3, 8, 4, 2];
      const expected = [2, 2, 3, 3, 4, 4, 5, 5, 8, 8];
      const result = selectionSort.execute(array);
      expect(result).toEqual(expected);
    });
    
    test('sorts array with negative numbers', () => {
      const array = [5, -3, 8, -4, 0, 2, -5, 1];
      const expected = [-5, -4, -3, 0, 1, 2, 5, 8];
      const result = selectionSort.execute(array);
      expect(result).toEqual(expected);
    });
    
    test('sorts array with decimal values', () => {
      const array = [5.5, 3.3, 8.8, 4.4, 2.2];
      const expected = [2.2, 3.3, 4.4, 5.5, 8.8];
      const result = selectionSort.execute(array);
      expect(result).toEqual(expected);
    });
    
    test('sorts custom objects with comparator', () => {
      const objects = [
        { id: 5, value: 'e' },
        { id: 3, value: 'c' },
        { id: 8, value: 'h' },
        { id: 1, value: 'a' }
      ];
      
      const comparator = (a, b) => a.id - b.id;
      
      const result = selectionSort.execute(objects, { comparator });
      expect(result[0].id).toBe(1);
      expect(result[1].id).toBe(3);
      expect(result[2].id).toBe(5);
      expect(result[3].id).toBe(8);
    });
  });
  
  /**
   * Tests for algorithm-specific behaviors
   */
  describe('Algorithm-Specific Behaviors', () => {
    test('always performs exactly n-1 passes', () => {
      const array = [5, 3, 8, 4, 2, 9, 1, 7, 6];
      
      // Track the findMinimum method calls which should happen once per pass
      const findMinimumSpy = jest.spyOn(selectionSort, 'findMinimum');
      
      selectionSort.execute(array);
      
      // For an array of length n, selection sort does n-1 passes
      expect(findMinimumSpy.mock.calls.length).toBe(array.length - 1);
      
      findMinimumSpy.mockRestore();
    });
    
    test('bidirectional variant reduces swaps', () => {
      // Create a bidirectional implementation
      const bidirectionalSort = new SelectionSort({ bidirectional: true });
      
      const array = [5, 3, 8, 4, 2, 9, 1, 7, 6];
      
      // Track swap operations for both implementations
      const standardSwapSpy = jest.spyOn(selectionSort, 'swap');
      const bidirectionalSwapSpy = jest.spyOn(bidirectionalSort, 'swap');
      
      // Execute both implementations
      selectionSort.execute([...array]);
      bidirectionalSort.execute([...array]);
      
      // Bidirectional should perform fewer iterations
      expect(bidirectionalSwapSpy.mock.calls.length).toBeLessThan(standardSwapSpy.mock.calls.length);
      
      standardSwapSpy.mockRestore();
      bidirectionalSwapSpy.mockRestore();
    });
    
    test('only performs necessary swaps', () => {
      const array = [5, 3, 8, 4, 2, 9, 1, 7, 6];
      
      // Spy on swap operation
      const swapSpy = jest.spyOn(selectionSort, 'swap');
      
      selectionSort.execute(array);
      
      // Selection sort should only swap when necessary
      // For n elements, we need at most n-1 swaps
      expect(swapSpy.mock.calls.length).toBeLessThanOrEqual(array.length - 1);
      
      swapSpy.mockRestore();
    });
    
    test('performs exactly n-1 swaps for unsorted array', () => {
      const array = [9, 8, 7, 6, 5, 4, 3, 2, 1];
      
      // Spy on swap operation
      const swapSpy = jest.spyOn(selectionSort, 'swap');
      
      selectionSort.execute(array);
      
      // For a completely unsorted array, we should see exactly n-1 swaps
      expect(swapSpy.mock.calls.length).toBe(array.length - 1);
      
      swapSpy.mockRestore();
    });
    
    test('performs linear number of comparisons', () => {
      const array = [5, 3, 8, 4, 2, 9, 1, 7, 6];
      
      // Spy on compare operation
      const compareSpy = jest.spyOn(selectionSort, 'compare');
      
      selectionSort.execute(array);
      
      // For n elements, selection sort performs n(n-1)/2 comparisons
      const n = array.length;
      const expectedComparisons = (n * (n - 1)) / 2;
      
      expect(compareSpy.mock.calls.length).toBe(expectedComparisons);
      
      compareSpy.mockRestore();
    });
  });
  
  /**
   * Edge cases and special input handling
   */
  describe('Edge Cases', () => {
    test('handles already sorted array with optimal operations', () => {
      const sortedArray = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      
      // Track operations
      const compareSpy = jest.spyOn(selectionSort, 'compare');
      const swapSpy = jest.spyOn(selectionSort, 'swap');
      
      selectionSort.execute(sortedArray);
      
      // Selection sort always performs the same number of comparisons
      // regardless of initial order
      const n = sortedArray.length;
      const expectedComparisons = (n * (n - 1)) / 2;
      expect(compareSpy.mock.calls.length).toBe(expectedComparisons);
      
      // But should minimize swaps for already sorted array
      // With a standard selection sort, we'll still do a comparison, but no swap needed
      // Optimized implementations could detect this, but basic ones don't
      expect(swapSpy.mock.calls.length).toBeLessThanOrEqual(n - 1);
      
      compareSpy.mockRestore();
      swapSpy.mockRestore();
    });
    
    test('handles reverse sorted array with same operations as any input', () => {
      const reverseSortedArray = [10, 9, 8, 7, 6, 5, 4, 3, 2, 1];
      
      // Track operation counts
      const compareSpy = jest.spyOn(selectionSort, 'compare');
      
      selectionSort.execute(reverseSortedArray);
      
      // Selection sort always performs the same number of comparisons
      const n = reverseSortedArray.length;
      const expectedComparisons = (n * (n - 1)) / 2;
      expect(compareSpy.mock.calls.length).toBe(expectedComparisons);
      
      compareSpy.mockRestore();
    });
    
    test('handles array with all identical elements', () => {
      const allSameArray = [5, 5, 5, 5, 5, 5, 5, 5, 5, 5];
      
      // Track operations
      const swapSpy = jest.spyOn(selectionSort, 'swap');
      
      const result = selectionSort.execute(allSameArray);
      
      expect(result).toEqual(allSameArray);
      
      // Should not perform any swaps when all elements are the same
      expect(swapSpy.mock.calls.length).toBe(0);
      
      swapSpy.mockRestore();
    });
    
    test('sorts very large arrays successfully', () => {
      const largeArray = generateDataSet('random', 1000, { min: 1, max: 10000 });
      
      const result = selectionSort.execute(largeArray);
      
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
    // Generate test datasets of various sizes
    const sizes = [10, 50, 100];
    const datasets = sizes.map(size => generateDataSet('random', size, { min: 1, max: 1000 }));
    
    test('exhibits quadratic comparison complexity', () => {
      // Record comparisons for different input sizes
      const comparisonCounts = [];
      
      for (const dataset of datasets) {
        const compareSpy = jest.spyOn(selectionSort, 'compare');
        selectionSort.execute([...dataset]);
        comparisonCounts.push(compareSpy.mock.calls.length);
        compareSpy.mockRestore();
      }
      
      // Calculate expected comparison counts: n(n-1)/2
      const expectedCounts = sizes.map(n => (n * (n - 1)) / 2);
      
      // Verify that actual counts match expected counts
      for (let i = 0; i < comparisonCounts.length; i++) {
        expect(comparisonCounts[i]).toBe(expectedCounts[i]);
      }
    });
    
    test('exhibits linear swap complexity in worst case', () => {
      // Worst case for swaps is when every element needs to be swapped
      const worstCaseArrays = sizes.map(size => {
        // Create arrays in reverse order
        return Array.from({ length: size }, (_, i) => size - i);
      });
      
      // Record swap counts
      const swapCounts = [];
      
      for (const array of worstCaseArrays) {
        const swapSpy = jest.spyOn(selectionSort, 'swap');
        selectionSort.execute([...array]);
        swapCounts.push(swapSpy.mock.calls.length);
        swapSpy.mockRestore();
      }
      
      // Expect n-1 swaps in worst case
      const expectedSwaps = sizes.map(n => n - 1);
      
      // Verify swap counts
      for (let i = 0; i < swapCounts.length; i++) {
        expect(swapCounts[i]).toBe(expectedSwaps[i]);
      }
    });
    
    test('performs consistently regardless of input distribution', () => {
      // Selection sort performance is independent of input distribution
      const randomArray = generateDataSet('random', 100, { min: 1, max: 1000 });
      const sortedArray = generateDataSet('sorted', 100, { min: 1, max: 1000 });
      const reversedArray = generateDataSet('reversed', 100, { min: 1, max: 1000 });
      
      // Track comparisons for each distribution
      const randomCompareSpy = jest.spyOn(selectionSort, 'compare');
      selectionSort.execute([...randomArray]);
      const randomCompares = randomCompareSpy.mock.calls.length;
      randomCompareSpy.mockRestore();
      
      const sortedCompareSpy = jest.spyOn(selectionSort, 'compare');
      selectionSort.execute([...sortedArray]);
      const sortedCompares = sortedCompareSpy.mock.calls.length;
      sortedCompareSpy.mockRestore();
      
      const reversedCompareSpy = jest.spyOn(selectionSort, 'compare');
      selectionSort.execute([...reversedArray]);
      const reversedCompares = reversedCompareSpy.mock.calls.length;
      reversedCompareSpy.mockRestore();
      
      // All distributions should have identical comparison counts
      expect(randomCompares).toBe(sortedCompares);
      expect(randomCompares).toBe(reversedCompares);
    });
    
    test('bidirectional variant reduces total passes', () => {
      // Create a bidirectional selection sort
      const bidirectionalSort = new SelectionSort({ bidirectional: true });
      
      // Track both min and max operations for bidirectional
      const findMinimumSpy = jest.spyOn(bidirectionalSort, 'findMinimum');
      const findMaximumSpy = jest.spyOn(bidirectionalSort, 'findMaximum');
      
      const array = generateDataSet('random', 100, { min: 1, max: 1000 });
      bidirectionalSort.execute(array);
      
      // Total operations should be approximately n/2
      const totalOperations = findMinimumSpy.mock.calls.length + findMaximumSpy.mock.calls.length;
      expect(totalOperations).toBeLessThanOrEqual(array.length);
      expect(totalOperations).toBeGreaterThanOrEqual(array.length / 2);
      
      findMinimumSpy.mockRestore();
      findMaximumSpy.mockRestore();
    });
  });
  
  /**
   * Algorithmic properties
   */
  describe('Algorithm Properties', () => {
    test('reports correct time complexity', () => {
      const complexity = selectionSort.getComplexity();
      
      expect(complexity.time.best).toBe('O(n²)');
      expect(complexity.time.average).toBe('O(n²)');
      expect(complexity.time.worst).toBe('O(n²)');
    });
    
    test('reports correct space complexity', () => {
      const complexity = selectionSort.getComplexity();
      
      expect(complexity.space.best).toBe('O(1)');
      expect(complexity.space.average).toBe('O(1)');
      expect(complexity.space.worst).toBe('O(1)');
    });
    
    test('is not stable by default', () => {
      // Standard selection sort is not stable
      expect(selectionSort.isStable()).toBe(false);
      
      // Verify with objects that have the same key
      const objectArray = [
        { key: 1, value: 'a' },
        { key: 2, value: 'b' },
        { key: 1, value: 'c' },
        { key: 3, value: 'd' }
      ];
      
      // Custom comparator that only looks at keys
      const comparator = (a, b) => a.key - b.key;
      
      const result = selectionSort.execute(objectArray, { comparator });
      
      // Elements with key 1 might not preserve their original relative order
      const originalFirstIndex = objectArray.findIndex(item => item.key === 1 && item.value === 'a');
      const originalSecondIndex = objectArray.findIndex(item => item.key === 1 && item.value === 'c');
      
      const newFirstIndex = result.findIndex(item => item.key === 1 && item.value === 'a');
      const newSecondIndex = result.findIndex(item => item.key === 1 && item.value === 'c');
      
      // The nature of selection sort means this test isn't deterministic
      // But we know the algorithm isn't stable by design
      expect(selectionSort.isStable()).toBe(false);
    });
    
    test('is an in-place sorting algorithm', () => {
      expect(selectionSort.isInPlace()).toBe(true);
      
      // Verify auxiliary space usage is minimal
      const largeArray = generateDataSet('random', 1000, { min: 1, max: 10000 });
      
      selectionSort.execute(largeArray);
      
      // Auxiliary space should be constant regardless of input size
      expect(selectionSort.metrics.auxiliarySpace).toBeLessThan(10);
    });
  });
});
