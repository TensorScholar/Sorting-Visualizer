// tests/js/algorithms/comparison/tim.test.js

import TimSort from '../../../../src/algorithms/comparison/tim';
import { generateDataSet } from '../../../../src/data/generators';

/**
 * Comprehensive test suite for Tim Sort algorithm implementation.
 * 
 * Tests cover:
 * 1. Core algorithm correctness across various inputs
 * 2. Adaptive behavior and optimizations
 * 3. Run detection and merging strategy
 * 4. Edge case handling
 * 5. Performance characteristics validation
 * 6. Algorithmic properties (stability, complexity, etc.)
 */
describe('TimSort Algorithm', () => {
  // Default instance with standard configuration
  let timSort;
  
  // Create a fresh instance before each test
  beforeEach(() => {
    timSort = new TimSort({
      minRun: 32,               // Minimum run size
      insertionThreshold: 16,   // Threshold for insertion sort
      galloping: true           // Enable galloping mode
    });
  });
  
  /**
   * Core functionality tests - verify sorting correctness
   */
  describe('Core Functionality', () => {
    test('sorts an empty array', () => {
      const array = [];
      const result = timSort.execute(array);
      expect(result).toEqual([]);
      expect(result).not.toBe(array); // Should return a new array
    });
    
    test('sorts an array with a single element', () => {
      const array = [5];
      const result = timSort.execute(array);
      expect(result).toEqual([5]);
    });
    
    test('sorts a small array in ascending order', () => {
      const array = [5, 3, 8, 4, 2, 9, 1, 7, 6];
      const expected = [1, 2, 3, 4, 5, 6, 7, 8, 9];
      const result = timSort.execute(array);
      expect(result).toEqual(expected);
    });
    
    test('maintains input array integrity', () => {
      const array = [5, 3, 8, 4, 2];
      const original = [...array];
      timSort.execute(array);
      expect(array).toEqual(original); // Input should not be modified
    });
    
    test('handles arrays with duplicate elements', () => {
      const array = [5, 3, 8, 4, 2, 5, 3, 8, 4, 2];
      const expected = [2, 2, 3, 3, 4, 4, 5, 5, 8, 8];
      const result = timSort.execute(array);
      expect(result).toEqual(expected);
    });
    
    test('sorts array with negative numbers', () => {
      const array = [5, -3, 8, -4, 0, 2, -5, 1];
      const expected = [-5, -4, -3, 0, 1, 2, 5, 8];
      const result = timSort.execute(array);
      expect(result).toEqual(expected);
    });
    
    test('sorts array with decimal values', () => {
      const array = [5.5, 3.3, 8.8, 4.4, 2.2];
      const expected = [2.2, 3.3, 4.4, 5.5, 8.8];
      const result = timSort.execute(array);
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
      
      const result = timSort.execute(objects, { comparator });
      expect(result[0].id).toBe(1);
      expect(result[1].id).toBe(3);
      expect(result[2].id).toBe(5);
      expect(result[3].id).toBe(8);
    });
  });
  
  /**
   * Tests for adaptive behavior and run detection
   */
  describe('Adaptive Behavior and Run Detection', () => {
    test('identifies natural runs in the data', () => {
      // Create an array with some natural runs
      const array = [
        1, 3, 5, 7, 9,      // Ascending run
        20, 18, 16, 14, 12, // Descending run (should be reversed)
        6, 8, 10, 12, 14,   // Ascending run
        30, 25, 20, 15, 10  // Descending run (should be reversed)
      ];
      
      // Spy on the findRuns and reverseRun methods
      const findRunsSpy = jest.spyOn(timSort, 'findRuns');
      const reverseRunSpy = jest.spyOn(timSort, 'reverseRun');
      
      timSort.execute(array);
      
      // Verify findRuns was called
      expect(findRunsSpy).toHaveBeenCalled();
      
      // Verify that descending runs were reversed
      // In this case, there are 2 descending runs
      expect(reverseRunSpy).toHaveBeenCalledTimes(2);
      
      findRunsSpy.mockRestore();
      reverseRunSpy.mockRestore();
    });
    
    test('uses insertion sort for small runs', () => {
      // Create a spy on the insertionSort method
      const insertionSortSpy = jest.spyOn(timSort, 'insertionSort');
      
      // Generate an array slightly larger than the insertion threshold
      const array = generateDataSet('random', timSort.options.insertionThreshold + 5);
      
      timSort.execute(array);
      
      // Verify insertionSort was called for small runs
      expect(insertionSortSpy).toHaveBeenCalled();
      
      insertionSortSpy.mockRestore();
    });
    
    test('builds runs of at least minRun length', () => {
      // Create a spy on the buildRun method
      const buildRunSpy = jest.spyOn(timSort, 'buildRun');
      
      // Generate an array large enough to require multiple runs
      const array = generateDataSet('random', timSort.options.minRun * 3);
      
      timSort.execute(array);
      
      // Verify buildRun was called
      expect(buildRunSpy).toHaveBeenCalled();
      
      // Check that all built runs are at least minRun length
      for (const call of buildRunSpy.mock.calls) {
        const start = call[1];
        const end = call[2];
        const runLength = end - start + 1;
        
        // Last run might be shorter
        if (end < array.length - 1) {
          expect(runLength).toBeGreaterThanOrEqual(timSort.options.minRun);
        }
      }
      
      buildRunSpy.mockRestore();
    });
    
    test('efficiently merges runs', () => {
      // Create a spy on the mergeRuns method
      const mergeRunsSpy = jest.spyOn(timSort, 'mergeRuns');
      
      // Generate an array large enough to require multiple runs and merges
      const array = generateDataSet('random', timSort.options.minRun * 5);
      
      timSort.execute(array);
      
      // Verify mergeRuns was called
      expect(mergeRunsSpy).toHaveBeenCalled();
      
      mergeRunsSpy.mockRestore();
    });
    
    test('uses galloping mode for efficient merging', () => {
      // Only test if galloping is enabled
      if (timSort.options.galloping) {
        // Create a spy on the gallopLeft and gallopRight methods
        const gallopLeftSpy = jest.spyOn(timSort, 'gallopLeft');
        const gallopRightSpy = jest.spyOn(timSort, 'gallopRight');
        
        // Create an array that would benefit from galloping
        // Two large sorted segments with very different ranges
        const array1 = Array.from({ length: 100 }, (_, i) => i);
        const array2 = Array.from({ length: 100 }, (_, i) => i + 1000);
        const array = [...array1, ...array2];
        
        // Shuffle slightly to avoid being detected as a perfect run
        const shuffleIdx1 = Math.floor(array1.length / 2);
        const shuffleIdx2 = array1.length + Math.floor(array2.length / 2);
        [array[shuffleIdx1], array[shuffleIdx2]] = [array[shuffleIdx2], array[shuffleIdx1]];
        
        timSort.execute(array);
        
        // In this scenario with large runs of very different ranges,
        // galloping should be used at least once
        const gallopingCalled = gallopLeftSpy.mock.calls.length > 0 || 
                                gallopRightSpy.mock.calls.length > 0;
        
        expect(gallopingCalled).toBe(true);
        
        gallopLeftSpy.mockRestore();
        gallopRightSpy.mockRestore();
      } else {
        // Skip test if galloping is disabled
        console.log('Galloping mode is disabled, skipping test');
      }
    });
  });
  
  /**
   * Edge cases and special input handling
   */
  describe('Edge Cases', () => {
    test('performs efficiently on already sorted array', () => {
      const sortedArray = Array.from({ length: 100 }, (_, i) => i);
      
      // Track operations
      const compareSpy = jest.spyOn(timSort, 'compare');
      const writeSpy = jest.spyOn(timSort, 'write');
      
      timSort.execute(sortedArray);
      
      // Tim Sort is highly adaptive and should recognize the array is sorted
      // It should perform minimal comparisons and no writes
      expect(compareSpy.mock.calls.length).toBeLessThan(sortedArray.length * 2);
      expect(writeSpy.mock.calls.length).toBe(0); // No writes needed for sorted array
      
      compareSpy.mockRestore();
      writeSpy.mockRestore();
    });
    
    test('performs efficiently on reverse sorted array', () => {
      const reverseSortedArray = Array.from({ length: 100 }, (_, i) => 99 - i);
      
      // Track operations
      const compareSpy = jest.spyOn(timSort, 'compare');
      
      timSort.execute(reverseSortedArray);
      
      // TimSort should recognize the reverse sorted array as a single run (after reversal)
      // and perform efficiently without excess comparisons
      expect(compareSpy.mock.calls.length).toBeLessThan(reverseSortedArray.length * 2);
      
      compareSpy.mockRestore();
    });
    
    test('handles array with all identical elements', () => {
      const allSameArray = Array(100).fill(5);
      
      // Track operations
      const writeSpy = jest.spyOn(timSort, 'write');
      
      const result = timSort.execute(allSameArray);
      
      expect(result).toEqual(allSameArray);
      
      // Should not perform any writes when all elements are the same
      expect(writeSpy.mock.calls.length).toBe(0);
      
      writeSpy.mockRestore();
    });
    
    test('efficiently handles array with runs', () => {
      // Create an array with multiple sorted runs
      const run1 = Array.from({ length: 20 }, (_, i) => i);
      const run2 = Array.from({ length: 20 }, (_, i) => i + 100);
      const run3 = Array.from({ length: 20 }, (_, i) => i + 200);
      const array = [...run1, ...run2, ...run3];
      
      // Track operations
      const compareSpy = jest.spyOn(timSort, 'compare');
      
      timSort.execute(array);
      
      // Tim Sort should recognize these runs and merge them efficiently
      // Far fewer than O(n log n) comparisons for this case
      expect(compareSpy.mock.calls.length).toBeLessThan(array.length * Math.log2(array.length));
      
      compareSpy.mockRestore();
    });
    
    test('sorts very large arrays successfully', () => {
      const largeArray = generateDataSet('random', 1000, { min: 1, max: 10000 });
      
      const result = timSort.execute(largeArray);
      
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
    test('outperforms merge sort on partially sorted data', () => {
      // Create a merge sort instance for comparison
      const MergeSort = require('../../../../src/algorithms/comparison/merge').default;
      const mergeSort = new MergeSort();
      
      // Generate partially sorted data
      const partiallySortedArray = generateDataSet('nearly-sorted', 500, { 
        min: 1, 
        max: 1000,
        sortedRatio: 0.7 // 70% sorted
      });
      
      // Track comparison operations
      const timCompareSpy = jest.spyOn(timSort, 'compare');
      const mergeCompareSpy = jest.spyOn(mergeSort, 'compare');
      
      // Execute both sorts
      timSort.execute([...partiallySortedArray]);
      mergeSort.execute([...partiallySortedArray]);
      
      // Tim Sort should perform fewer comparisons due to its adaptive nature
      expect(timCompareSpy.mock.calls.length).toBeLessThan(mergeCompareSpy.mock.calls.length);
      
      timCompareSpy.mockRestore();
      mergeCompareSpy.mockRestore();
    });
    
    test('exhibits O(n) performance on already sorted arrays', () => {
      // Generate arrays of increasing size, all sorted
      const sizes = [100, 200, 400];
      const arrays = sizes.map(size => Array.from({ length: size }, (_, i) => i));
      
      // Record comparison counts
      const comparisonCounts = [];
      
      for (const array of arrays) {
        const compareSpy = jest.spyOn(timSort, 'compare');
        timSort.execute([...array]);
        comparisonCounts.push(compareSpy.mock.calls.length);
        compareSpy.mockRestore();
      }
      
      // For sorted arrays, TimSort should exhibit linear scaling (close to O(n))
      // Calculate ratios between each size increase
      for (let i = 1; i < sizes.length; i++) {
        const sizeRatio = sizes[i] / sizes[i - 1];
        const compareRatio = comparisonCounts[i] / comparisonCounts[i - 1];
        
        // The comparison ratio should be close to the size ratio (linear scaling)
        // Allow some variation but should be much better than O(n log n) which would be sizeRatio * log2(sizeRatio)
        expect(compareRatio).toBeLessThan(sizeRatio * 1.2);
      }
    });
    
    test('exhibits O(n log n) worst-case performance', () => {
      // Generate arrays of increasing size with random data (worst case)
      const sizes = [100, 200, 400];
      const arrays = sizes.map(size => generateDataSet('random', size, { min: 1, max: 1000 }));
      
      // Record comparison counts
      const comparisonCounts = [];
      
      for (const array of arrays) {
        const compareSpy = jest.spyOn(timSort, 'compare');
        timSort.execute([...array]);
        comparisonCounts.push(compareSpy.mock.calls.length);
        compareSpy.mockRestore();
      }
      
      // For random arrays, TimSort should not exceed O(n log n) scaling
      for (let i = 1; i < sizes.length; i++) {
        const sizeRatio = sizes[i] / sizes[i - 1];
        const expectedWorstCaseRatio = sizeRatio * (Math.log2(sizes[i]) / Math.log2(sizes[i - 1]));
        const compareRatio = comparisonCounts[i] / comparisonCounts[i - 1];
        
        // The comparison ratio should not exceed the worst-case O(n log n) ratio
        // Allow some variation for implementation details
        expect(compareRatio).toBeLessThanOrEqual(expectedWorstCaseRatio * 1.2);
      }
    });
    
    test('efficiency with different minRun values', () => {
      // Create TimSort instances with different minRun values
      const timSortSmallRun = new TimSort({ minRun: 16, galloping: true });
      const timSortLargeRun = new TimSort({ minRun: 64, galloping: true });
      
      // Generate a random array
      const array = generateDataSet('random', 1000, { min: 1, max: 10000 });
      
      // Track operations
      const smallRunCompareSpy = jest.spyOn(timSortSmallRun, 'compare');
      const largeRunCompareSpy = jest.spyOn(timSortLargeRun, 'compare');
      
      // Execute both variants
      timSortSmallRun.execute([...array]);
      timSortLargeRun.execute([...array]);
      
      // Both should perform reasonably well, but there may be differences
      // The optimal minRun value can depend on the input characteristics
      console.log(`Small minRun comparisons: ${smallRunCompareSpy.mock.calls.length}`);
      console.log(`Large minRun comparisons: ${largeRunCompareSpy.mock.calls.length}`);
      
      smallRunCompareSpy.mockRestore();
      largeRunCompareSpy.mockRestore();
    });
    
    test('galloping mode improves performance on certain inputs', () => {
      // Create TimSort instances with and without galloping
      const timSortWithGalloping = new TimSort({ minRun: 32, galloping: true });
      const timSortNoGalloping = new TimSort({ minRun: 32, galloping: false });
      
      // Create an array that would benefit from galloping
      // Two large sorted segments with very different ranges
      const array1 = Array.from({ length: 500 }, (_, i) => i);
      const array2 = Array.from({ length: 500 }, (_, i) => i + 1000);
      const array = [...array1, ...array2];
      
      // Shuffle slightly to avoid being detected as a perfect run
      for (let i = 0; i < 10; i++) {
        const idx1 = Math.floor(Math.random() * array1.length);
        const idx2 = array1.length + Math.floor(Math.random() * array2.length);
        [array[idx1], array[idx2]] = [array[idx2], array[idx1]];
      }
      
      // Track operations
      const gallopingCompareSpy = jest.spyOn(timSortWithGalloping, 'compare');
      const noGallopingCompareSpy = jest.spyOn(timSortNoGalloping, 'compare');
      
      // Execute both variants
      timSortWithGalloping.execute([...array]);
      timSortNoGalloping.execute([...array]);
      
      // With galloping should perform better on this input
      expect(gallopingCompareSpy.mock.calls.length).toBeLessThan(noGallopingCompareSpy.mock.calls.length);
      
      gallopingCompareSpy.mockRestore();
      noGallopingCompareSpy.mockRestore();
    });
  });
  
  /**
   * Algorithmic properties
   */
  describe('Algorithm Properties', () => {
    test('reports correct time complexity', () => {
      const complexity = timSort.getComplexity();
      
      expect(complexity.time.best).toBe('O(n)');
      expect(complexity.time.average).toBe('O(n log n)');
      expect(complexity.time.worst).toBe('O(n log n)');
    });
    
    test('reports correct space complexity', () => {
      const complexity = timSort.getComplexity();
      
      expect(complexity.space.best).toBe('O(n)');
      expect(complexity.space.average).toBe('O(n)');
      expect(complexity.space.worst).toBe('O(n)');
    });
    
    test('is a stable sorting algorithm', () => {
      expect(timSort.isStable()).toBe(true);
      
      // Verify with objects that have the same key
      const objectArray = [
        { key: 1, value: 'a' },
        { key: 5, value: 'b' },
        { key: 1, value: 'c' },
        { key: 3, value: 'd' }
      ];
      
      // Clone to check original positions
      const objectArrayCopy = [...objectArray];
      
      // Custom comparator that only looks at keys
      const comparator = (a, b) => a.key - b.key;
      
      const result = timSort.execute(objectArray, { comparator });
      
      // Elements with the same key should maintain their relative order
      const originalFirstWithKey1 = objectArrayCopy.findIndex(item => item.key === 1 && item.value === 'a');
      const originalSecondWithKey1 = objectArrayCopy.findIndex(item => item.key === 1 && item.value === 'c');
      
      const resultFirstWithKey1 = result.findIndex(item => item.key === 1 && item.value === 'a');
      const resultSecondWithKey1 = result.findIndex(item => item.key === 1 && item.value === 'c');
      
      // Verify that relative order is preserved
      expect(resultFirstWithKey1).toBeLessThan(resultSecondWithKey1);
    });
    
    test('is a hybrid algorithm', () => {
      // Verify Tim Sort uses both insertion sort and merging
      const insertionSortSpy = jest.spyOn(timSort, 'insertionSort');
      const mergeSpy = jest.spyOn(timSort, 'merge');
      
      // Generate an array large enough to trigger both behaviors
      const array = generateDataSet('random', 100);
      
      timSort.execute(array);
      
      // Both insertion sort and merging should be used
      expect(insertionSortSpy).toHaveBeenCalled();
      expect(mergeSpy).toHaveBeenCalled();
      
      insertionSortSpy.mockRestore();
      mergeSpy.mockRestore();
    });
    
    test('uses natural runs for better performance', () => {
      // Check that TimSort identifies and uses natural runs
      const findRunSpy = jest.spyOn(timSort, 'findRun');
      
      // Create an array with some natural runs
      const run1 = Array.from({ length: 20 }, (_, i) => i);
      const run2 = Array.from({ length: 20 }, (_, i) => i + 100);
      const run3 = Array.from({ length: 20 }, (_, i) => i + 200);
      // Mix them up slightly to avoid perfect sorting
      const array = [...run1.slice(0, 15), ...run2.slice(0, 10), ...run1.slice(15), 
                     ...run2.slice(10), ...run3];
      
      timSort.execute(array);
      
      // Should identify some natural runs
      expect(findRunSpy).toHaveBeenCalled();
      
      findRunSpy.mockRestore();
    });
  });
});
