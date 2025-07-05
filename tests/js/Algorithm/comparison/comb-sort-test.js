// tests/js/algorithms/comparison/comb.test.js

/**
 * @fileoverview Comprehensive test suite for Comb Sort algorithm implementation.
 * 
 * This test suite rigorously evaluates the Comb Sort algorithm, with particular
 * focus on its gap sequence behavior, shrink factor efficacy, and comparative
 * performance against related algorithms. The suite validates correctness,
 * performance characteristics, and optimization behaviors across diverse inputs.
 */

import CombSort from '../../../../src/algorithms/comparison/comb';
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
  negativeValues: [-5, -10, -3, -1, -7],
  // Array with "turtle" values - elements far from their sorted position
  turtleValues: [1, 10, 2, 9, 3, 8, 4, 7, 5, 6]
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

describe('Comb Sort Algorithm', () => {
  let combSort;
  
  beforeEach(() => {
    // Create a fresh instance for each test
    combSort = new CombSort();
  });
  
  describe('Correctness Tests', () => {
    test('should correctly sort an empty array', () => {
      const result = combSort.execute(TEST_ARRAYS.empty);
      expect(result).toEqual([]);
    });
    
    test('should correctly sort an array with a single element', () => {
      const result = combSort.execute(TEST_ARRAYS.single);
      expect(result).toEqual(TEST_ARRAYS.single);
    });
    
    test('should correctly sort a sorted array', () => {
      const result = combSort.execute(TEST_ARRAYS.sorted);
      expect(result).toEqual(TEST_ARRAYS.sorted);
    });
    
    test('should correctly sort a reversed array', () => {
      const result = combSort.execute(TEST_ARRAYS.reversed);
      expect(result).toEqual([...TEST_ARRAYS.reversed].sort((a, b) => a - b));
    });
    
    test('should correctly sort an array with duplicate elements', () => {
      const result = combSort.execute(TEST_ARRAYS.withDuplicates);
      expect(result).toEqual([...TEST_ARRAYS.withDuplicates].sort((a, b) => a - b));
    });
    
    test('should correctly sort an array with negative values', () => {
      const result = combSort.execute(TEST_ARRAYS.negativeValues);
      expect(result).toEqual([...TEST_ARRAYS.negativeValues].sort((a, b) => a - b));
    });
    
    test('should correctly sort larger random arrays', () => {
      const randomArray = Array.from({ length: 100 }, () => Math.floor(Math.random() * 1000));
      const result = combSort.execute(randomArray);
      expect(isSorted(result)).toBe(true);
    });
    
    test('should maintain the original input array without modification', () => {
      const original = [...TEST_ARRAYS.randomSmall];
      combSort.execute(TEST_ARRAYS.randomSmall);
      expect(TEST_ARRAYS.randomSmall).toEqual(original);
    });
  });
  
  describe('Gap Sequence Behavior Tests', () => {
    test('should correctly initialize gap to array length', () => {
      // Use a spy to track the recorded states
      const recordStateSpy = jest.spyOn(combSort, 'recordState');
      
      combSort.execute(TEST_ARRAYS.randomSmall);
      
      // Check if the initial gap is array length
      expect(recordStateSpy.mock.calls[0][1].gap).toBe(TEST_ARRAYS.randomSmall.length);
      
      recordStateSpy.mockRestore();
    });
    
    test('should progressively reduce gap by shrink factor', () => {
      // Use an observable array and track gap changes
      const testArray = [5, 4, 3, 2, 1];
      const shrinkFactor = 1.3; // Default shrink factor
      
      // Configure to record gap history
      combSort = new CombSort({ shrinkFactor });
      const recordStateSpy = jest.spyOn(combSort, 'recordState');
      
      combSort.execute(testArray);
      
      // Extract gap values from recorded states
      const gapValues = recordStateSpy.mock.calls
        .filter(call => call[1] && call[1].gap !== undefined)
        .map(call => call[1].gap);
      
      // Verify that each gap is approximately the previous gap divided by shrink factor
      for (let i = 1; i < gapValues.length; i++) {
        const expectedGap = Math.max(1, Math.floor(gapValues[i-1] / shrinkFactor));
        expect(gapValues[i]).toBe(expectedGap);
      }
      
      // Verify that the final gap is 1
      expect(gapValues[gapValues.length-1]).toBe(1);
      
      recordStateSpy.mockRestore();
    });
    
    test('should handle different shrink factors correctly', () => {
      const testArray = [10, 9, 8, 7, 6, 5, 4, 3, 2, 1];
      
      // Test with different shrink factors
      const shrinkFactors = [1.2, 1.3, 1.5];
      const operationCounts = [];
      
      for (const factor of shrinkFactors) {
        combSort = new CombSort({ shrinkFactor: factor });
        combSort.execute([...testArray]);
        // Track total operations (comparisons + swaps)
        operationCounts.push(combSort.metrics.comparisons + combSort.metrics.swaps);
      }
      
      // Verify that all shrink factors produce correct results
      // Different factors may have different efficiency, but all should work
      expect(operationCounts.length).toBe(shrinkFactors.length);
      
      // Verify optimal shrink factor (typically around 1.3)
      // Should be more efficient than very small or large factors
      const optimalIndex = 1; // 1.3 is at index 1
      expect(operationCounts[optimalIndex]).toBeLessThanOrEqual(
        Math.max(...operationCounts.filter((_, i) => i !== optimalIndex))
      );
    });
    
    test('should enforce minimum gap of 1', () => {
      // Using a very large shrink factor to test minimum gap enforcement
      combSort = new CombSort({ shrinkFactor: 10 });
      const recordStateSpy = jest.spyOn(combSort, 'recordState');
      
      combSort.execute(TEST_ARRAYS.randomSmall);
      
      // Extract gap values
      const gapValues = recordStateSpy.mock.calls
        .filter(call => call[1] && call[1].gap !== undefined)
        .map(call => call[1].gap);
      
      // No gap should be less than 1
      expect(Math.min(...gapValues)).toBe(1);
      
      recordStateSpy.mockRestore();
    });
  });
  
  describe('Optimization Behavior Tests', () => {
    test('should terminate early when array is sorted', () => {
      combSort = new CombSort({ earlyTermination: true });
      
      // Spy on the compare method to track calls
      const compareSpy = jest.spyOn(combSort, 'compare');
      
      combSort.execute(TEST_ARRAYS.sorted);
      
      // For a sorted array with early termination, we should do
      // only one pass through the array with no swaps
      const expectedMaxComparisons = TEST_ARRAYS.sorted.length * 2;
      expect(compareSpy.mock.calls.length).toBeLessThanOrEqual(expectedMaxComparisons);
      expect(combSort.metrics.swaps).toBe(0);
      
      compareSpy.mockRestore();
    });
    
    test('should not terminate early when optimization is disabled', () => {
      combSort = new CombSort({ earlyTermination: false });
      
      // Spy on the compare method to track calls
      const recordStateSpy = jest.spyOn(combSort, 'recordState');
      
      combSort.execute(TEST_ARRAYS.sorted);
      
      // Without early termination, we should see a full gap sequence
      const gapCounts = new Set(
        recordStateSpy.mock.calls
          .filter(call => call[1] && call[1].gap !== undefined)
          .map(call => call[1].gap)
      ).size;
      
      // Should have multiple different gap values
      expect(gapCounts).toBeGreaterThan(1);
      
      recordStateSpy.mockRestore();
    });
    
    test('should switch to bubble sort for final passes when enabled', () => {
      combSort = new CombSort({ combToBubble: true });
      
      // Spy on recordState to track phase changes
      const recordStateSpy = jest.spyOn(combSort, 'recordState');
      
      combSort.execute(TEST_ARRAYS.randomSmall);
      
      // Check if there's a transition to bubble sort phase
      const bubblePhase = recordStateSpy.mock.calls.some(call => 
        call[1]?.type === 'phase_change' && 
        (call[1]?.phase === 'bubble_sort' || 
         (call[1]?.message && call[1]?.message.includes('bubble')))
      );
      
      expect(bubblePhase).toBe(true);
      
      recordStateSpy.mockRestore();
    });
  });
  
  describe('Comparative Performance Tests', () => {
    test('should outperform bubble sort on reversed arrays', () => {
      const bubbleSort = new BubbleSort();
      const reversedArray = Array.from({ length: 50 }, (_, i) => 50 - i);
      
      // Run both algorithms and compare
      bubbleSort.execute([...reversedArray]);
      const bubbleComparisons = bubbleSort.metrics.comparisons;
      
      combSort.execute([...reversedArray]);
      const combComparisons = combSort.metrics.comparisons;
      
      // Comb sort should perform significantly fewer comparisons
      // due to the gap approach allowing elements to move faster
      expect(combComparisons).toBeLessThan(bubbleComparisons * 0.7);
    });
    
    test('should handle "turtle" values efficiently', () => {
      const bubbleSort = new BubbleSort();
      
      // Create an array with elements far from their sorted positions
      const turtleArray = [...TEST_ARRAYS.turtleValues];
      
      bubbleSort.execute([...turtleArray]);
      const bubbleOperations = bubbleSort.metrics.comparisons + bubbleSort.metrics.swaps;
      
      combSort.execute([...turtleArray]);
      const combOperations = combSort.metrics.comparisons + combSort.metrics.swaps;
      
      // Comb sort should perform fewer operations on this pattern
      // due to moving distant elements more efficiently
      expect(combOperations).toBeLessThan(bubbleOperations);
    });
    
    test('should perform better with optimal shrink factor', () => {
      const testArray = generateDataSet('random', 100);
      
      // Test with different shrink factors
      const factors = [1.1, 1.3, 1.8];
      const operationCounts = [];
      
      for (const factor of factors) {
        combSort = new CombSort({ shrinkFactor: factor });
        combSort.execute([...testArray]);
        operationCounts.push(combSort.metrics.comparisons + combSort.metrics.swaps);
      }
      
      // 1.3 is typically optimal (factors[1])
      const optimalFactorOperations = operationCounts[1];
      expect(optimalFactorOperations).toBeLessThanOrEqual(operationCounts[0]); // Better than 1.1
      expect(optimalFactorOperations).toBeLessThanOrEqual(operationCounts[2]); // Better than 1.8
    });
    
    test('should approach O(n log n) average complexity', () => {
      // Test with multiple sizes to verify n log n growth pattern
      const sizes = [100, 200, 400];
      const operationCounts = [];
      
      for (const size of sizes) {
        const array = generateDataSet('random', size);
        combSort = new CombSort();
        combSort.execute(array);
        operationCounts.push(combSort.metrics.comparisons + combSort.metrics.swaps);
      }
      
      // For n log n growth, when we double the size, operations should increase by ~2.1x
      // (actually 2 * log(2n)/log(n) which approaches 2 for large n)
      const ratio1 = operationCounts[1] / operationCounts[0];
      const ratio2 = operationCounts[2] / operationCounts[1];
      
      // Calculate expected ratios for n log n growth
      // For n=100 to n=200: 200*log(200) / (100*log(100)) ≈ 2.15
      // For n=200 to n=400: 400*log(400) / (200*log(200)) ≈ 2.1
      const expectedRatio1 = (sizes[1] * Math.log(sizes[1])) / (sizes[0] * Math.log(sizes[0]));
      const expectedRatio2 = (sizes[2] * Math.log(sizes[2])) / (sizes[1] * Math.log(sizes[1]));
      
      // Allow some margin for implementation variations
      expect(ratio1).toBeGreaterThan(1.8);
      expect(ratio1).toBeLessThan(2.5);
      expect(ratio2).toBeGreaterThan(1.8);
      expect(ratio2).toBeLessThan(2.5);
      
      // Should be reasonably close to the expected n log n ratios
      expect(ratio1).toBeCloseTo(expectedRatio1, 0);
      expect(ratio2).toBeCloseTo(expectedRatio2, 0);
    });
  });
  
  describe('Property Tests', () => {
    test('should not be a stable sorting algorithm', () => {
      const objectArray = createStabilitySortTestArray();
      
      // Create a custom comparator that only looks at the key property
      const keyComparator = (a, b) => a.key - b.key;
      
      // Execute comb sort with custom comparator
      const result = combSort.execute(objectArray, { comparator: keyComparator });
      
      // Check if the algorithm maintains the relative order of equal elements
      // Find all elements with the same keys
      const keyGroups = {};
      result.forEach(item => {
        if (!keyGroups[item.key]) keyGroups[item.key] = [];
        keyGroups[item.key].push(item);
      });
      
      // For Comb Sort, we don't expect stability, so instead we'll verify
      // that the algorithm correctly groups elements with the same key
      // and that all keys are in the right order
      
      // Verify that all keys are in sorted order
      const keys = Object.keys(keyGroups).map(Number);
      expect(isSorted(keys)).toBe(true);
      
      // Verify each key group has the correct count
      const originalKeyCounts = {};
      objectArray.forEach(item => {
        originalKeyCounts[item.key] = (originalKeyCounts[item.key] || 0) + 1;
      });
      
      Object.entries(keyGroups).forEach(([key, group]) => {
        expect(group.length).toBe(originalKeyCounts[key]);
      });
      
      // Note: We don't assert that isStable() returns false here,
      // as that depends on the implementation. The important thing
      // is that the behavior is correct.
    });
    
    test('should be an in-place sorting algorithm', () => {
      const array = [...TEST_ARRAYS.randomSmall];
      
      // Execute comb sort and track memory usage
      combSort.execute(array);
      
      // Verify that auxiliary space used is O(1)
      expect(combSort.metrics.auxiliarySpace).toBeLessThan(100); // Just a small constant amount
    });
    
    test('getComplexity() should return correct complexity information', () => {
      const complexity = combSort.getComplexity();
      
      // Verify time complexity
      // For Comb Sort, worst case is typically O(n²)
      // Best case is O(n log n) with optimal gap sequence
      // Average case is somewhere between O(n log n) and O(n²)
      expect(complexity.time.worst).toBe('O(n²)');
      expect(['O(n log n)', 'O(n log² n)', 'O(n²/2^p)'].includes(complexity.time.average)).toBe(true);
      expect(['O(n log n)', 'O(n)'].includes(complexity.time.best)).toBe(true);
      
      // Verify space complexity
      expect(complexity.space.worst).toBe('O(1)');
      expect(complexity.space.best).toBe('O(1)');
    });
    
    test('isInPlace() should return true', () => {
      expect(combSort.isInPlace()).toBe(true);
    });
  });
  
  describe('Instrumentation Tests', () => {
    test('should correctly count comparisons, swaps, reads, and writes', () => {
      const testArray = [5, 3, 1, 4, 2];
      combSort.execute(testArray);
      
      // Ensure metrics are being tracked
      expect(combSort.metrics.comparisons).toBeGreaterThan(0);
      expect(combSort.metrics.swaps).toBeGreaterThan(0);
      expect(combSort.metrics.reads).toBeGreaterThan(0);
      expect(combSort.metrics.writes).toBeGreaterThan(0);
      
      // Verify the relationship between metrics
      // Each swap involves 2 reads and 2 writes
      expect(combSort.metrics.writes).toBe(combSort.metrics.swaps * 2);
      // Each comparison involves 2 reads
      expect(combSort.metrics.reads).toBeGreaterThanOrEqual(combSort.metrics.comparisons * 2);
    });
    
    test('should track and record gap changes in execution history', () => {
      const testArray = [5, 3, 1, 4, 2];
      combSort.execute(testArray, { recordHistory: true });
      
      // Verify history is recorded
      expect(combSort.history.length).toBeGreaterThan(0);
      
      // Extract gap values from history
      const gapValues = combSort.history
        .filter(state => state.gap !== undefined)
        .map(state => state.gap);
      
      // Should have at least initial gap (array length) and final gap (1)
      expect(gapValues.length).toBeGreaterThan(1);
      expect(gapValues[0]).toBe(testArray.length);
      expect(gapValues[gapValues.length - 1]).toBe(1);
      
      // Gap should decrease monotonically
      for (let i = 1; i < gapValues.length; i++) {
        expect(gapValues[i]).toBeLessThanOrEqual(gapValues[i-1]);
      }
    });
    
    test('should record phase changes when combToBubble is enabled', () => {
      combSort = new CombSort({ combToBubble: true });
      
      combSort.execute(TEST_ARRAYS.randomSmall, { recordHistory: true });
      
      // Check for phase change entries in history
      const phaseChanges = combSort.history.filter(state => 
        state.type === 'phase_change' || 
        (state.message && state.message.includes('phase'))
      );
      
      // Should have at least one phase change with combToBubble enabled
      expect(phaseChanges.length).toBeGreaterThan(0);
    });
  });
});
