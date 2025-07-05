// tests/js/algorithms/comparison/intro.test.js

import IntroSort from '../../../../src/algorithms/comparison/intro';
import { generateDataSet, generateAdversarialCase } from '../../../../src/data/generators';
import Algorithm from '../../../../src/algorithms/core/algorithm-base';

/**
 * Comprehensive test suite for IntroSort algorithm
 * 
 * IntroSort is a hybrid sorting algorithm that combines QuickSort, HeapSort,
 * and InsertionSort to achieve both optimal average-case performance and
 * guaranteed worst-case performance.
 * 
 * These tests validate:
 * 1. Correctness across various input distributions
 * 2. Phase transitions between the three internal sorting methods
 * 3. Algorithmic complexity guarantees
 * 4. Performance characteristics and metrics
 * 5. Proper instrumentation and state recording
 */
describe('IntroSort Algorithm', () => {
  let introSort;
  
  beforeEach(() => {
    // Create a fresh instance before each test
    introSort = new IntroSort();
  });
  
  describe('Basic Functionality', () => {
    test('should inherit from base Algorithm class', () => {
      expect(introSort).toBeInstanceOf(Algorithm);
    });
    
    test('should have correct algorithm metadata', () => {
      expect(introSort.name).toBe('Intro Sort');
      expect(introSort.category).toBe('comparison');
    });
    
    test('should correctly sort an empty array', () => {
      const array = [];
      const sorted = introSort.execute(array);
      expect(sorted).toEqual([]);
      expect(sorted).not.toBe(array); // Should be a new array reference
    });
    
    test('should correctly sort a single-element array', () => {
      const array = [42];
      const sorted = introSort.execute(array);
      expect(sorted).toEqual([42]);
    });
    
    test('should correctly sort a two-element array in wrong order', () => {
      const array = [5, 3];
      const sorted = introSort.execute(array);
      expect(sorted).toEqual([3, 5]);
    });
  });
  
  describe('Correctness with Standard Test Cases', () => {
    test('should correctly sort an already sorted array', () => {
      const array = [1, 2, 3, 4, 5, 6, 7, 8];
      const sorted = introSort.execute(array);
      expect(sorted).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    });
    
    test('should correctly sort a reversed array', () => {
      const array = [8, 7, 6, 5, 4, 3, 2, 1];
      const sorted = introSort.execute(array);
      expect(sorted).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    });
    
    test('should correctly sort an array with duplicate elements', () => {
      const array = [3, 1, 4, 1, 5, 9, 2, 6, 5, 3, 5];
      const sorted = introSort.execute(array);
      expect(sorted).toEqual([1, 1, 2, 3, 3, 4, 5, 5, 5, 6, 9]);
    });
    
    test('should correctly sort an array with all identical elements', () => {
      const array = [7, 7, 7, 7, 7, 7, 7];
      const sorted = introSort.execute(array);
      expect(sorted).toEqual([7, 7, 7, 7, 7, 7, 7]);
    });
    
    test('should correctly sort an array with negative numbers', () => {
      const array = [5, -3, 0, 8, -4, 2, -1, 7, -6];
      const sorted = introSort.execute(array);
      expect(sorted).toEqual([-6, -4, -3, -1, 0, 2, 5, 7, 8]);
    });
    
    test('should correctly sort an array with floating point numbers', () => {
      const array = [5.7, 3.2, 8.1, 4.5, 2.9, 1.3, 7.8, 6.4];
      const sorted = introSort.execute(array);
      expect(sorted).toEqual([1.3, 2.9, 3.2, 4.5, 5.7, 6.4, 7.8, 8.1]);
    });
  });
  
  describe('Handling of Different Data Distributions', () => {
    test('should correctly sort a random array', () => {
      const array = generateDataSet('random', 100, { min: 1, max: 1000 });
      const manualSorted = [...array].sort((a, b) => a - b);
      const sorted = introSort.execute(array);
      expect(sorted).toEqual(manualSorted);
    });
    
    test('should correctly sort a nearly-sorted array', () => {
      const array = generateDataSet('nearly-sorted', 100, { min: 1, max: 1000, sortedRatio: 0.9 });
      const manualSorted = [...array].sort((a, b) => a - b);
      const sorted = introSort.execute(array);
      expect(sorted).toEqual(manualSorted);
    });
    
    test('should correctly sort a few-unique array', () => {
      const array = generateDataSet('few-unique', 100, { min: 1, max: 1000, uniqueValues: 5 });
      const manualSorted = [...array].sort((a, b) => a - b);
      const sorted = introSort.execute(array);
      expect(sorted).toEqual(manualSorted);
    });
    
    test('should correctly sort a sawtooth pattern array', () => {
      const array = generateDataSet('sawtooth', 100, { min: 1, max: 1000 });
      const manualSorted = [...array].sort((a, b) => a - b);
      const sorted = introSort.execute(array);
      expect(sorted).toEqual(manualSorted);
    });
  });
  
  describe('Algorithm Phase Transitions', () => {
    test('should use QuickSort for general cases', () => {
      // Create a medium-sized array that would use QuickSort as the main algorithm
      const array = generateDataSet('random', 100, { min: 1, max: 1000 });
      
      // Spy on the QuickSort method
      const quickSortSpy = jest.spyOn(introSort, 'quickSort');
      
      introSort.execute(array);
      
      // Verify QuickSort was called
      expect(quickSortSpy).toHaveBeenCalled();
      
      // Restore the original method
      quickSortSpy.mockRestore();
    });
    
    test('should use HeapSort when recursion depth exceeds limit', () => {
      // Create an IntroSort with very low depth limit to force HeapSort
      const introSortWithLowDepthLimit = new IntroSort({ 
        maxDepth: 5,
        depthLimit: 'low'
      });
      
      // Create an array that would cause deep recursion (worst case for QuickSort)
      const worstCaseArray = generateAdversarialCase('quicksort', 100, { 
        pivotStrategy: 'first' 
      });
      
      // Spy on the HeapSort method
      const heapSortSpy = jest.spyOn(introSortWithLowDepthLimit, 'heapSort');
      
      introSortWithLowDepthLimit.execute(worstCaseArray);
      
      // Verify HeapSort was called
      expect(heapSortSpy).toHaveBeenCalled();
      
      // Restore the original method
      heapSortSpy.mockRestore();
    });
    
    test('should use InsertionSort for small subarrays', () => {
      // Configure IntroSort with a high insertion threshold
      const introSortWithHighThreshold = new IntroSort({ insertionThreshold: 50 });
      
      // Create a small array that should be sorted with insertion sort
      const smallArray = generateDataSet('random', 40, { min: 1, max: 100 });
      
      // Spy on the InsertionSort method
      const insertionSortSpy = jest.spyOn(introSortWithHighThreshold, 'insertionSort');
      
      introSortWithHighThreshold.execute(smallArray);
      
      // Verify that InsertionSort was called
      expect(insertionSortSpy).toHaveBeenCalled();
      
      // Restore the original method
      insertionSortSpy.mockRestore();
    });
  });
  
  describe('Performance and Metrics', () => {
    test('should record correct metrics for large arrays', () => {
      const array = generateDataSet('random', 1000, { min: 1, max: 10000 });
      introSort.execute(array);
      
      // Verify metrics are recorded
      expect(introSort.metrics.comparisons).toBeGreaterThan(0);
      expect(introSort.metrics.reads).toBeGreaterThan(0);
      expect(introSort.metrics.writes).toBeGreaterThan(0);
      expect(introSort.metrics.executionTime).toBeGreaterThan(0);
      
      // IntroSort should require approximately O(n log n) comparisons
      const nLogN = array.length * Math.log2(array.length);
      expect(introSort.metrics.comparisons).toBeLessThan(nLogN * 5); // Allow reasonable overhead
    });
    
    test('should have consistent performance across different input distributions', () => {
      // Generate arrays of the same size but different distributions
      const size = 500;
      const randomArray = generateDataSet('random', size, { min: 1, max: 1000 });
      const sortedArray = generateDataSet('sorted', size, { min: 1, max: 1000 });
      const reversedArray = generateDataSet('reversed', size, { min: 1, max: 1000 });
      
      // Execute on each array and capture metrics
      introSort.execute(randomArray);
      const randomMetrics = { ...introSort.metrics };
      introSort.reset();
      
      introSort.execute(sortedArray);
      const sortedMetrics = { ...introSort.metrics };
      introSort.reset();
      
      introSort.execute(reversedArray);
      const reversedMetrics = { ...introSort.metrics };
      
      // IntroSort should maintain O(n log n) performance even on sorted/reversed arrays
      // Unlike pure QuickSort which degrades to O(n²) on these inputs
      const nLogN = size * Math.log2(size);
      
      expect(sortedMetrics.comparisons).toBeLessThan(nLogN * 5);
      expect(reversedMetrics.comparisons).toBeLessThan(nLogN * 5);
      
      // Performance should be relatively consistent across distributions
      const maxRatio = 5; // Allow some variance but not orders of magnitude
      expect(sortedMetrics.comparisons / randomMetrics.comparisons).toBeLessThan(maxRatio);
      expect(reversedMetrics.comparisons / randomMetrics.comparisons).toBeLessThan(maxRatio);
    });
  });
  
  describe('Algorithmic Guarantees', () => {
    test('should have expected complexity characteristics', () => {
      const complexity = introSort.getComplexity();
      
      // IntroSort is designed to guarantee O(n log n) worst-case
      expect(complexity.time.best).toBeDefined();
      expect(complexity.time.average).toBe('O(n log n)');
      expect(complexity.time.worst).toBe('O(n log n)');
      
      // Space complexity should be O(log n) for recursion stack
      expect(complexity.space.worst).toBe('O(log n)');
    });
    
    test('should not be stable', () => {
      expect(introSort.isStable()).toBe(false);
      
      // Verify lack of stability with a test case
      const a1 = { value: 5, index: 1 };
      const a2 = { value: 5, index: 2 };
      const b = { value: 3, index: 3 };
      
      const array = [a1, b, a2];
      const comparator = (x, y) => x.value - y.value;
      
      const sorted = introSort.execute(array, { comparator });
      
      // The elements with value 5 might be reordered
      const fives = sorted.filter(x => x.value === 5);
      expect(fives.length).toBe(2);
      // We don't assert on the order since the algorithm is not stable
    });
    
    test('should be in-place', () => {
      expect(introSort.isInPlace()).toBe(true);
    });
  });
  
  describe('Algorithm Information', () => {
    test('should provide comprehensive algorithm information', () => {
      const info = introSort.getInfo();
      
      // Basic info
      expect(info.name).toBe('Intro Sort');
      expect(info.category).toBe('comparison');
      
      // Properties
      expect(info.properties).toBeDefined();
      expect(info.properties.hybrid).toBe(true);
      expect(info.properties.inPlace).toBe(true);
      expect(info.properties.stable).toBe(false);
      
      // Advantages and disadvantages
      expect(info.advantages).toBeDefined();
      expect(info.advantages.length).toBeGreaterThan(0);
      expect(info.disadvantages).toBeDefined();
      expect(info.disadvantages.length).toBeGreaterThan(0);
      
      // Should mention its constituent algorithms
      const infoText = JSON.stringify(info);
      expect(infoText).toMatch(/quick/i);
      expect(infoText).toMatch(/heap/i);
      expect(infoText).toMatch(/insertion/i);
    });
  });
  
  describe('Advanced Configuration', () => {
    test('should allow customizing QuickSort pivot strategy', () => {
      const customIntroSort = new IntroSort({ 
        pivotStrategy: 'median-of-three'
      });
      
      const array = generateDataSet('random', 100, { min: 1, max: 1000 });
      const sorted = customIntroSort.execute(array);
      
      // Verify the array is correctly sorted
      for (let i = 1; i < sorted.length; i++) {
        expect(sorted[i]).toBeGreaterThanOrEqual(sorted[i - 1]);
      }
    });
    
    test('should allow customizing the depth limit calculation', () => {
      // Standard depth limit is 2*log2(n)
      const standardIntroSort = new IntroSort();
      
      // Custom with higher depth limit
      const customIntroSort = new IntroSort({ 
        depthLimit: 'high', 
        maxDepthFactor: 3 // 3*log2(n) instead of 2*log2(n)
      });
      
      const array = generateDataSet('random', 100, { min: 1, max: 1000 });
      
      // Spy on the HeapSort method for both instances
      const standardHeapSortSpy = jest.spyOn(standardIntroSort, 'heapSort');
      const customHeapSortSpy = jest.spyOn(customIntroSort, 'heapSort');
      
      // Execute both with the same input
      standardIntroSort.execute([...array]);
      customIntroSort.execute([...array]);
      
      // With a higher depth limit, the custom instance should potentially
      // call HeapSort less often since it allows deeper recursion
      expect(customHeapSortSpy.mock.calls.length).toBeLessThanOrEqual(
        standardHeapSortSpy.mock.calls.length + 1 // Allow a small margin
      );
      
      // Restore the original methods
      standardHeapSortSpy.mockRestore();
      customHeapSortSpy.mockRestore();
    });
  });
  
  describe('Error Handling', () => {
    test('should handle non-array inputs gracefully', () => {
      expect(() => introSort.execute(null)).toThrow();
      expect(() => introSort.execute(undefined)).toThrow();
      expect(() => introSort.execute('not an array')).toThrow();
      expect(() => introSort.execute(123)).toThrow();
    });
    
    test('should handle arrays with non-comparable elements by using default comparator', () => {
      // Mixed types array
      const array = [3, '5', 1, '2', 4];
      
      // Default comparator will use string comparison
      const sorted = introSort.execute(array);
      
      // Check the result is ordered in some consistent way
      for (let i = 1; i < sorted.length; i++) {
        const a = String(sorted[i-1]);
        const b = String(sorted[i]);
        expect(a <= b).toBe(true);
      }
    });
  });
});
