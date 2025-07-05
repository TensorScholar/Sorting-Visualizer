// tests/js/algorithms/comparison/merge.test.js

import MergeSort from '../../../../src/algorithms/comparison/merge';
import { generateDataSet, generateMergesortAdversarial } from '../../../../src/data/generators';
import Algorithm from '../../../../src/algorithms/core/algorithm-base';

/**
 * Comprehensive test suite for MergeSort algorithm
 * 
 * MergeSort is a divide-and-conquer sorting algorithm that:
 * 1. Divides the input array into two halves
 * 2. Recursively sorts the two halves
 * 3. Merges the sorted halves to produce the final sorted array
 * 
 * These tests validate:
 * 1. Correctness across various input distributions
 * 2. Variations (top-down, bottom-up, adaptive, in-place)
 * 3. Stability properties
 * 4. Performance characteristics and metrics
 * 5. Advanced optimizations specific to MergeSort
 */
describe('MergeSort Algorithm', () => {
  let mergeSort;
  
  beforeEach(() => {
    // Create a fresh instance before each test
    mergeSort = new MergeSort();
  });
  
  describe('Basic Functionality', () => {
    test('should inherit from base Algorithm class', () => {
      expect(mergeSort).toBeInstanceOf(Algorithm);
    });
    
    test('should have correct algorithm metadata', () => {
      expect(mergeSort.name).toBe('Merge Sort');
      expect(mergeSort.category).toBe('comparison');
    });
    
    test('should correctly sort an empty array', () => {
      const array = [];
      const sorted = mergeSort.execute(array);
      expect(sorted).toEqual([]);
      expect(sorted).not.toBe(array); // Should be a new array reference
    });
    
    test('should correctly sort a single-element array', () => {
      const array = [42];
      const sorted = mergeSort.execute(array);
      expect(sorted).toEqual([42]);
    });
    
    test('should correctly sort a two-element array in wrong order', () => {
      const array = [5, 3];
      const sorted = mergeSort.execute(array);
      expect(sorted).toEqual([3, 5]);
    });
  });
  
  describe('Correctness with Standard Test Cases', () => {
    test('should correctly sort an already sorted array', () => {
      const array = [1, 2, 3, 4, 5, 6, 7, 8];
      const sorted = mergeSort.execute(array);
      expect(sorted).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    });
    
    test('should correctly sort a reversed array', () => {
      const array = [8, 7, 6, 5, 4, 3, 2, 1];
      const sorted = mergeSort.execute(array);
      expect(sorted).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    });
    
    test('should correctly sort an array with duplicate elements', () => {
      const array = [3, 1, 4, 1, 5, 9, 2, 6, 5, 3, 5];
      const sorted = mergeSort.execute(array);
      expect(sorted).toEqual([1, 1, 2, 3, 3, 4, 5, 5, 5, 6, 9]);
    });
    
    test('should correctly sort an array with all identical elements', () => {
      const array = [7, 7, 7, 7, 7, 7, 7];
      const sorted = mergeSort.execute(array);
      expect(sorted).toEqual([7, 7, 7, 7, 7, 7, 7]);
    });
    
    test('should correctly sort an array with negative numbers', () => {
      const array = [5, -3, 0, 8, -4, 2, -1, 7, -6];
      const sorted = mergeSort.execute(array);
      expect(sorted).toEqual([-6, -4, -3, -1, 0, 2, 5, 7, 8]);
    });
    
    test('should correctly sort an array with floating point numbers', () => {
      const array = [5.7, 3.2, 8.1, 4.5, 2.9, 1.3, 7.8, 6.4];
      const sorted = mergeSort.execute(array);
      expect(sorted).toEqual([1.3, 2.9, 3.2, 4.5, 5.7, 6.4, 7.8, 8.1]);
    });
  });
  
  describe('Algorithm Variations', () => {
    test('should correctly sort with top-down (recursive) implementation', () => {
      const topDownMergeSort = new MergeSort({ bottomUp: false });
      const array = [5, 3, 8, 4, 2, 1, 7, 6];
      const sorted = topDownMergeSort.execute(array);
      expect(sorted).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    });
    
    test('should correctly sort with bottom-up (iterative) implementation', () => {
      const bottomUpMergeSort = new MergeSort({ bottomUp: true });
      const array = [5, 3, 8, 4, 2, 1, 7, 6];
      const sorted = bottomUpMergeSort.execute(array);
      expect(sorted).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    });
    
    test('should correctly sort with in-place merge option', () => {
      const inPlaceMergeSort = new MergeSort({ inPlaceMerge: true });
      const array = [5, 3, 8, 4, 2, 1, 7, 6];
      const sorted = inPlaceMergeSort.execute(array);
      expect(sorted).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    });
    
    test('should correctly sort with optimized merge option', () => {
      const optimizedMergeSort = new MergeSort({ optimizeMerge: true });
      const array = [5, 3, 8, 4, 2, 1, 7, 6];
      const sorted = optimizedMergeSort.execute(array);
      expect(sorted).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    });
    
    test('should correctly sort with insertion sort optimization for small arrays', () => {
      const hybridMergeSort = new MergeSort({ 
        insertionThreshold: 10 
      });
      
      // Spy on the insertion sort method
      const insertionSortSpy = jest.spyOn(hybridMergeSort, 'insertionSort');
      
      // Create an array where subarrays would trigger insertion sort
      const array = generateDataSet('random', 50, { min: 1, max: 100 });
      const sorted = hybridMergeSort.execute(array);
      
      // Verify insertion sort was called
      expect(insertionSortSpy).toHaveBeenCalled();
      
      // Verify the array is correctly sorted
      for (let i = 1; i < sorted.length; i++) {
        expect(sorted[i]).toBeGreaterThanOrEqual(sorted[i - 1]);
      }
      
      // Restore the original method
      insertionSortSpy.mockRestore();
    });
  });
  
  describe('Adaptive Optimization', () => {
    test('should use adaptive optimization to skip merging sorted subarrays', () => {
      // Create merge sort with adaptive optimization enabled
      const adaptiveMergeSort = new MergeSort({ adaptive: true });
      
      // Spy on the merge method
      const mergeSpy = jest.spyOn(adaptiveMergeSort, 'merge');
      
      // Create an already sorted array
      const array = generateDataSet('sorted', 100, { min: 1, max: 100 });
      adaptiveMergeSort.execute(array);
      
      // Should skip most merges for an already sorted array
      // For an array of size n, should call merge less than n times
      expect(mergeSpy.mock.calls.length).toBeLessThan(array.length);
      
      // Restore the original method
      mergeSpy.mockRestore();
    });
    
    test('should detect and leverage existing sorted runs', () => {
      // Create MergeSort with adaptive optimization
      const adaptiveMergeSort = new MergeSort({ adaptive: true });
      
      // Create an array with sorted runs
      const array = generateDataSet('nearly-sorted', 100, { min: 1, max: 100, sortedRatio: 0.8 });
      
      // Spy on the isAlreadySorted method
      const isAlreadySortedSpy = jest.spyOn(adaptiveMergeSort, 'isAlreadySorted');
      
      adaptiveMergeSort.execute(array);
      
      // Should check for already sorted subarrays
      expect(isAlreadySortedSpy).toHaveBeenCalled();
      
      // Restore the original method
      isAlreadySortedSpy.mockRestore();
    });
  });
  
  describe('Stability Property', () => {
    test('should maintain stability for equal elements', () => {
      // Create objects with same key but different values to test stability
      const obj1 = { key: 3, value: 'first' };
      const obj2 = { key: 1, value: 'second' };
      const obj3 = { key: 3, value: 'third' };
      const obj4 = { key: 2, value: 'fourth' };
      
      const array = [obj1, obj2, obj3, obj4];
      
      // Custom comparator that only compares the 'key' property
      const comparator = (a, b) => a.key - b.key;
      
      const sorted = mergeSort.execute(array, { comparator });
      
      // Check if the array is sorted by key
      expect(sorted[0].key).toBe(1);
      expect(sorted[1].key).toBe(2);
      expect(sorted[2].key).toBe(3);
      expect(sorted[3].key).toBe(3);
      
      // Check if stability is maintained (original order of equal keys)
      expect(sorted[2].value).toBe('first');
      expect(sorted[3].value).toBe('third');
    });
    
    test('should be stable even with in-place merge variant', () => {
      // In-place merge should still maintain stability
      const inPlaceMergeSort = new MergeSort({ inPlaceMerge: true });
      
      // Create objects with same key but different values
      const obj1 = { key: 3, value: 'first' };
      const obj2 = { key: 1, value: 'second' };
      const obj3 = { key: 3, value: 'third' };
      const obj4 = { key: 2, value: 'fourth' };
      
      const array = [obj1, obj2, obj3, obj4];
      
      // Custom comparator that only compares the 'key' property
      const comparator = (a, b) => a.key - b.key;
      
      const sorted = inPlaceMergeSort.execute(array, { comparator });
      
      // Check if the array is sorted by key
      expect(sorted[0].key).toBe(1);
      expect(sorted[1].key).toBe(2);
      expect(sorted[2].key).toBe(3);
      expect(sorted[3].key).toBe(3);
      
      // Check if stability is maintained (original order of equal keys)
      expect(sorted[2].value).toBe('first');
      expect(sorted[3].value).toBe('third');
    });
    
    test('should correctly report stability property', () => {
      expect(mergeSort.isStable()).toBe(true);
      
      // Even in-place variant should be stable
      const inPlaceMergeSort = new MergeSort({ inPlaceMerge: true });
      expect(inPlaceMergeSort.isStable()).toBe(true);
    });
  });
  
  describe('Performance Characteristics', () => {
    test('should have optimal worst-case time complexity', () => {
      // Generate a large adversarial case for merge sort
      const adversarialArray = generateMergesortAdversarial(1000, 1, 1000);
      
      // Measure performance
      const startTime = performance.now();
      mergeSort.execute(adversarialArray);
      const endTime = performance.now();
      
      // Get the number of comparisons
      const comparisons = mergeSort.metrics.comparisons;
      
      // For an array of size n, merge sort should make O(n log n) comparisons
      // even in the worst case
      const n = adversarialArray.length;
      const nLogN = n * Math.log2(n);
      
      // Allow some overhead in the constant factor but should be O(n log n)
      expect(comparisons).toBeLessThan(nLogN * 10);
      
      // Execution time should also reflect O(n log n) behavior
      const executionTime = endTime - startTime;
      expect(executionTime).toBeLessThan(n * Math.log2(n) * 1);
    });
    
    test('should perform well on already sorted arrays with adaptive optimization', () => {
      // Create adaptive merge sort
      const adaptiveMergeSort = new MergeSort({ adaptive: true });
      
      // Create already sorted array
      const sortedArray = generateDataSet('sorted', 1000, { min: 1, max: 1000 });
      
      // Measure performance
      adaptiveMergeSort.execute(sortedArray);
      
      // For already sorted arrays, adaptive merge sort should use O(n) comparisons
      const comparisons = adaptiveMergeSort.metrics.comparisons;
      const n = sortedArray.length;
      
      // Should be closer to O(n) than O(n log n)
      const nLogN = n * Math.log2(n);
      expect(comparisons).toBeLessThan(nLogN / 2);
    });
    
    test('should record correct metrics during execution', () => {
      const array = [5, 3, 8, 4, 2, 1, 7, 6];
      mergeSort.execute(array);
      
      // Verify metrics are recorded
      expect(mergeSort.metrics.comparisons).toBeGreaterThan(0);
      expect(mergeSort.metrics.reads).toBeGreaterThan(0);
      expect(mergeSort.metrics.writes).toBeGreaterThan(0);
      expect(mergeSort.metrics.memoryAccesses).toBeGreaterThan(0);
      expect(mergeSort.metrics.startTime).toBeGreaterThan(0);
      expect(mergeSort.metrics.endTime).toBeGreaterThan(0);
      expect(mergeSort.metrics.executionTime).toBeGreaterThan(0);
    });
    
    test('should have expected complexity characteristics', () => {
      const complexity = mergeSort.getComplexity();
      
      // Standard merge sort: O(n log n) time, O(n) space
      expect(complexity.time.best).toBeDefined();
      expect(complexity.time.average).toBe('O(n log n)');
      expect(complexity.time.worst).toBe('O(n log n)');
      
      expect(complexity.space.average).toBe('O(n)');
      
      // Test adaptive variant
      const adaptiveMergeSort = new MergeSort({ adaptive: true });
      const adaptiveComplexity = adaptiveMergeSort.getComplexity();
      
      // Adaptive merge sort: O(n) best case (already sorted)
      expect(adaptiveComplexity.time.best).toBe('O(n)');
      
      // Test in-place variant
      const inPlaceMergeSort = new MergeSort({ inPlaceMerge: true });
      const inPlaceComplexity = inPlaceMergeSort.getComplexity();
      
      // In-place merge sort: O(1) space
      expect(inPlaceComplexity.space.best).toBe('O(1)');
      expect(inPlaceComplexity.space.average).toBe('O(1)');
    });
  });
  
  describe('Algorithm Information', () => {
    test('should provide comprehensive algorithm information', () => {
      const info = mergeSort.getInfo();
      
      // Basic info
      expect(info.name).toBe('Merge Sort');
      expect(info.category).toBe('comparison');
      
      // Properties
      expect(info.properties).toBeDefined();
      expect(info.properties.stable).toBe(true);
      expect(info.properties.inPlace).toBe(false); // Standard merge sort is not in-place
      expect(info.properties.divideAndConquer).toBe(true); // Merge sort uses divide and conquer
      
      // Advantages and disadvantages
      expect(info.advantages).toBeDefined();
      expect(info.advantages.length).toBeGreaterThan(0);
      expect(info.disadvantages).toBeDefined();
      expect(info.disadvantages.length).toBeGreaterThan(0);
      
      // Variants
      expect(info.variants).toBeDefined();
      expect(info.variants.length).toBeGreaterThan(0);
      expect(info.variants.some(v => v.includes('Bottom-up'))).toBe(true);
      expect(info.variants.some(v => v.includes('In-place'))).toBe(true);
    });
    
    test('should report correct in-place property based on configuration', () => {
      // Standard merge sort is not in-place
      expect(mergeSort.isInPlace()).toBe(false);
      
      // In-place variant should report as in-place
      const inPlaceMergeSort = new MergeSort({ inPlaceMerge: true });
      expect(inPlaceMergeSort.isInPlace()).toBe(true);
    });
  });
  
  describe('Advanced Features', () => {
    test('should handle custom comparators', () => {
      const array = [
        { value: 5 },
        { value: 3 },
        { value: 8 },
        { value: 1 },
        { value: 6 }
      ];
      
      const comparator = (a, b) => a.value - b.value;
      
      const sorted = mergeSort.execute(array, { comparator });
      
      // Check if the result is sorted by the 'value' property
      for (let i = 1; i < sorted.length; i++) {
        expect(sorted[i].value).toBeGreaterThanOrEqual(sorted[i - 1].value);
      }
    });
    
    test('should record state history for visualization', () => {
      const array = [5, 3, 8, 4, 2, 1, 7, 6];
      
      // Configure to record history
      const options = { recordHistory: true };
      mergeSort.execute(array, options);
      
      // Should have recorded states
      expect(mergeSort.history.length).toBeGreaterThan(0);
      
      // Each state should include array and metrics
      const firstState = mergeSort.history[0];
      expect(firstState.array).toBeDefined();
      expect(firstState.metrics).toBeDefined();
      expect(firstState.timestamp).toBeDefined();
      
      // Last state should be the sorted array
      const lastState = mergeSort.history[mergeSort.history.length - 1];
      expect(lastState.array).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    });
  });
  
  describe('Error Handling', () => {
    test('should handle non-array inputs gracefully', () => {
      expect(() => mergeSort.execute(null)).toThrow();
      expect(() => mergeSort.execute(undefined)).toThrow();
      expect(() => mergeSort.execute('not an array')).toThrow();
      expect(() => mergeSort.execute(123)).toThrow();
    });
    
    test('should handle arrays with non-comparable elements by using default comparator', () => {
      // Mixed types array
      const array = [3, '5', 1, '2', 4];
      
      // Default comparator will use string comparison
      const sorted = mergeSort.execute(array);
      
      // Check the result is ordered in some consistent way
      for (let i = 1; i < sorted.length; i++) {
        const a = String(sorted[i-1]);
        const b = String(sorted[i]);
        expect(a <= b).toBe(true);
      }
    });
  });
});
