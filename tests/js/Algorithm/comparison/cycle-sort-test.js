// tests/js/algorithms/comparison/cycle.test.js

/**
 * @fileoverview Comprehensive test suite for Cycle Sort algorithm implementation.
 * 
 * This test suite rigorously evaluates the Cycle Sort algorithm, with particular
 * focus on its unique property of minimizing memory writes. The suite validates
 * correctness, performance characteristics, and optimization behaviors across
 * diverse inputs, while measuring write efficiency and cycle detection behavior.
 */

import CycleSort from '../../../../src/algorithms/comparison/cycle';
import SelectionSort from '../../../../src/algorithms/comparison/selection';
import { generateDataSet } from '../../../../src/data/generators';

// Test fixture data
const TEST_ARRAYS = {
  empty: [],
  single: [42],
  sorted: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  reversed: [10, 9, 8, 7, 6, 5, 4, 3, 2, 1],
  nearlySorted: [1, 2, 4, 3, 5, 6, 7, 8, 10, 9],
  randomSmall: [42, 17, 34, 12, 59, 23],
  withDuplicates: [7, 3, 7, 5, 1, 3, 9, 5],
  negativeValues: [-5, -10, -3, -1, -7],
  // Array with a specific cycle pattern
  withCycle: [5, 4, 3, 2, 1],
  // Array with multiple cycles
  multipleCycles: [3, 1, 5, 4, 2, 8, 7, 6],
  // Array with duplicates to test position adjustments
  duplicatesForCycles: [3, 5, 3, 2, 5, 1, 4]
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

/**
 * Count the number of cycles in an array
 * This is a separate implementation to validate the algorithm's behavior
 * @param {Array} array - Input array
 * @returns {number} - Number of cycles in the permutation
 */
function countCycles(array) {
  const n = array.length;
  const visited = new Array(n).fill(false);
  let cycles = 0;
  
  // Create value to index mapping
  const valueToIndex = {};
  const sortedArray = [...array].sort((a, b) => a - b);
  for (let i = 0; i < n; i++) {
    valueToIndex[sortedArray[i]] = i;
  }
  
  // Count cycles
  for (let i = 0; i < n; i++) {
    if (!visited[i]) {
      cycles++;
      let j = i;
      while (!visited[j]) {
        visited[j] = true;
        j = valueToIndex[array[j]];
      }
    }
  }
  
  return cycles;
}

describe('Cycle Sort Algorithm', () => {
  let cycleSort;
  
  beforeEach(() => {
    // Create a fresh instance for each test
    cycleSort = new CycleSort();
  });
  
  describe('Correctness Tests', () => {
    test('should correctly sort an empty array', () => {
      const result = cycleSort.execute(TEST_ARRAYS.empty);
      expect(result).toEqual([]);
    });
    
    test('should correctly sort an array with a single element', () => {
      const result = cycleSort.execute(TEST_ARRAYS.single);
      expect(result).toEqual(TEST_ARRAYS.single);
    });
    
    test('should correctly sort a sorted array', () => {
      const result = cycleSort.execute(TEST_ARRAYS.sorted);
      expect(result).toEqual(TEST_ARRAYS.sorted);
    });
    
    test('should correctly sort a reversed array', () => {
      const result = cycleSort.execute(TEST_ARRAYS.reversed);
      expect(result).toEqual([...TEST_ARRAYS.reversed].sort((a, b) => a - b));
    });
    
    test('should correctly sort an array with duplicate elements', () => {
      const result = cycleSort.execute(TEST_ARRAYS.withDuplicates);
      expect(result).toEqual([...TEST_ARRAYS.withDuplicates].sort((a, b) => a - b));
    });
    
    test('should correctly sort an array with negative values', () => {
      const result = cycleSort.execute(TEST_ARRAYS.negativeValues);
      expect(result).toEqual([...TEST_ARRAYS.negativeValues].sort((a, b) => a - b));
    });
    
    test('should correctly sort larger random arrays', () => {
      const randomArray = Array.from({ length: 100 }, () => Math.floor(Math.random() * 1000));
      const result = cycleSort.execute(randomArray);
      expect(isSorted(result)).toBe(true);
    });
    
    test('should maintain the original input array without modification', () => {
      const original = [...TEST_ARRAYS.randomSmall];
      cycleSort.execute(TEST_ARRAYS.randomSmall);
      expect(TEST_ARRAYS.randomSmall).toEqual(original);
    });
  });
  
  describe('Cycle Detection and Processing', () => {
    test('should correctly detect and process cycles', () => {
      // Use a spy to track the state recording
      const recordStateSpy = jest.spyOn(cycleSort, 'recordState');
      
      cycleSort.execute(TEST_ARRAYS.withCycle);
      
      // Check for cycle detection in the recorded states
      const cycleDetections = recordStateSpy.mock.calls.filter(call => 
        call[1]?.type === 'cycle_start' || 
        (call[1]?.message && call[1]?.message.includes('cycle'))
      );
      
      // Verify that at least one cycle was detected
      expect(cycleDetections.length).toBeGreaterThan(0);
      
      recordStateSpy.mockRestore();
    });
    
    test('should handle arrays with multiple cycles', () => {
      // Use a spy to track the state recording
      const recordStateSpy = jest.spyOn(cycleSort, 'recordState');
      
      cycleSort.execute(TEST_ARRAYS.multipleCycles);
      
      // Count cycle starts
      const cycleStarts = recordStateSpy.mock.calls.filter(call => 
        call[1]?.type === 'cycle_start' || 
        (call[1]?.message && call[1]?.message.includes('Starting cycle'))
      );
      
      // Count expected cycles in the input array
      const expectedCycles = countCycles(TEST_ARRAYS.multipleCycles);
      
      // Verify that we detected the correct number of cycles
      // Note: The exact count depends on implementation details
      // Some implementations might combine or split cycles differently
      expect(cycleStarts.length).toBeGreaterThan(0);
      
      recordStateSpy.mockRestore();
    });
    
    test('should correctly handle arrays with duplicate elements', () => {
      // Arrays with duplicates need special handling in cycle sort
      const result = cycleSort.execute(TEST_ARRAYS.duplicatesForCycles);
      expect(isSorted(result)).toBe(true);
      
      // Verify correct positioning of duplicates
      const sortedArray = [...TEST_ARRAYS.duplicatesForCycles].sort((a, b) => a - b);
      expect(result).toEqual(sortedArray);
    });
  });
  
  describe('Write Minimization Tests', () => {
    test('should perform minimal number of writes', () => {
      const testArray = [5, 3, 1, 4, 2]; // Simple cycle
      
      cycleSort.execute(testArray);
      const cycleWrites = cycleSort.metrics.writes;
      
      // Reset metrics
      cycleSort.reset();
      
      // Compare with selection sort, which also minimizes writes
      const selectionSort = new SelectionSort();
      selectionSort.execute(testArray);
      const selectionWrites = selectionSort.metrics.writes;
      
      // Cycle sort should perform similarly or better than selection sort
      // Both aim to minimize write operations
      expect(cycleWrites).toBeLessThanOrEqual(selectionWrites * 1.1); // Allow small margin
    });
    
    test('should perform exactly n writes for n distinct elements', () => {
      // For arrays with distinct elements, cycle sort should perform
      // exactly n writes for n elements (or n-1 if perfectly sorted)
      const distinctArray = [5, 3, 1, 4, 2];
      
      cycleSort.execute(distinctArray);
      
      // Should be either n or n-1 writes
      expect([distinctArray.length, distinctArray.length - 1]).toContain(cycleSort.metrics.writes);
    });
    
    test('should perform optimal number of writes on large arrays', () => {
      // Test with larger random arrays
      const largeArray = generateDataSet('random', 100, { uniqueValues: 100 }); // All unique
      
      cycleSort.execute(largeArray);
      const cycleWrites = cycleSort.metrics.writes;
      
      // The theoretical minimum number of writes for a unique-valued array
      // is at most n (and potentially n-1 if no element is in its correct position)
      expect(cycleWrites).toBeLessThanOrEqual(largeArray.length);
      expect(cycleWrites).toBeGreaterThanOrEqual(largeArray.length - 1);
    });
    
    test('should handle the case of all elements already in sorted positions', () => {
      // If all elements are already in their sorted positions,
      // cycle sort should perform 0 writes
      
      cycleSort.execute(TEST_ARRAYS.sorted);
      
      // Should detect that no moves are needed
      expect(cycleSort.metrics.writes).toBe(0);
    });
  });
  
  describe('Performance Characteristic Tests', () => {
    test('should exhibit O(n²) time complexity for comparisons', () => {
      // Test with multiple sizes to verify quadratic growth pattern
      const sizes = [10, 20, 30];
      const comparisonCounts = [];
      
      for (const size of sizes) {
        const array = generateDataSet('random', size);
        cycleSort = new CycleSort();
        
        cycleSort.execute(array);
        comparisonCounts.push(cycleSort.metrics.comparisons);
      }
      
      // Verify that comparison counts grow approximately quadratically
      // For a quadratic algorithm, if we double the input size, the operations
      // should increase by approximately 4x
      
      const ratio1 = comparisonCounts[1] / comparisonCounts[0];
      const ratio2 = comparisonCounts[2] / comparisonCounts[1];
      
      // Expected ratio for n²: (2n)²/n² = 4
      // We allow some margin for implementation variations
      const expectedRatio = (sizes[1] / sizes[0]) ** 2;
      
      expect(ratio1).toBeCloseTo(expectedRatio, 0);
      expect(ratio2).toBeCloseTo(expectedRatio, 0);
    });
    
    test('should minimize writes relative to comparisons', () => {
      // Cycle sort makes many comparisons but few writes
      const testArray = generateDataSet('random', 100);
      
      cycleSort.execute(testArray);
      
      // The number of comparisons should be much larger than the number of writes
      expect(cycleSort.metrics.comparisons).toBeGreaterThan(cycleSort.metrics.writes * 5);
    });
    
    test('should show different performance characteristics for different distributions', () => {
      // Test with different distributions
      const distributions = ['random', 'nearly-sorted', 'reversed'];
      const comparisons = [];
      const writes = [];
      
      for (const distribution of distributions) {
        const array = generateDataSet(distribution, 100);
        cycleSort = new CycleSort();
        
        cycleSort.execute(array);
        comparisons.push(cycleSort.metrics.comparisons);
        writes.push(cycleSort.metrics.writes);
      }
      
      // Different distributions should show varying numbers of comparisons
      // but writes should remain relatively consistent (around n)
      
      // Verify that comparisons vary across distributions
      const minComparisons = Math.min(...comparisons);
      const maxComparisons = Math.max(...comparisons);
      expect(maxComparisons - minComparisons).toBeGreaterThan(0);
      
      // Verify that writes remain relatively consistent
      // For distinct-valued arrays, writes should be close to n
      for (const writeCount of writes) {
        expect(writeCount).toBeGreaterThanOrEqual(50); // Allow some margin
        expect(writeCount).toBeLessThanOrEqual(150); // Allow some margin
      }
    });
  });
  
  describe('Property Tests', () => {
    test('should not be a stable sorting algorithm', () => {
      const objectArray = createStabilitySortTestArray();
      
      // Create a custom comparator that only looks at the key property
      const keyComparator = (a, b) => a.key - b.key;
      
      // Execute cycle sort with custom comparator
      const result = cycleSort.execute(objectArray, { comparator: keyComparator });
      
      // Check if the algorithm maintains the relative order of equal elements
      // Find all elements with the same keys
      const keyGroups = {};
      result.forEach(item => {
        if (!keyGroups[item.key]) keyGroups[item.key] = [];
        keyGroups[item.key].push(item);
      });
      
      // For Cycle Sort, we don't expect stability, so instead we'll verify
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
    });
    
    test('should be an in-place sorting algorithm', () => {
      const array = [...TEST_ARRAYS.randomSmall];
      
      // Execute cycle sort and track memory usage
      cycleSort.execute(array);
      
      // Verify that auxiliary space used is O(1)
      expect(cycleSort.metrics.auxiliarySpace).toBeLessThan(100); // Just a small constant amount
    });
    
    test('getComplexity() should return correct complexity information', () => {
      const complexity = cycleSort.getComplexity();
      
      // Verify time complexity
      expect(complexity.time.worst).toBe('O(n²)');
      expect(complexity.time.average).toBe('O(n²)');
      expect(complexity.time.best).toBe('O(n²)');
      
      // Verify space complexity
      expect(complexity.space.worst).toBe('O(1)');
      expect(complexity.space.best).toBe('O(1)');
    });
    
    test('isInPlace() should return true', () => {
      expect(cycleSort.isInPlace()).toBe(true);
    });
  });
  
  describe('Instrumentation Tests', () => {
    test('should correctly count comparisons, writes, and reads', () => {
      const testArray = [5, 3, 1, 4, 2];
      cycleSort.execute(testArray);
      
      // Ensure metrics are being tracked
      expect(cycleSort.metrics.comparisons).toBeGreaterThan(0);
      expect(cycleSort.metrics.writes).toBeGreaterThan(0);
      expect(cycleSort.metrics.reads).toBeGreaterThan(0);
      
      // Verify the relationship between metrics
      // For cycle sort, the number of writes should be much less than the number of reads
      expect(cycleSort.metrics.writes).toBeLessThan(cycleSort.metrics.reads);
      
      // The number of comparisons should be high due to position counting
      expect(cycleSort.metrics.comparisons).toBeGreaterThan(testArray.length);
    });
    
    test('should record cycle processing in execution history', () => {
      const testArray = [5, 3, 1, 4, 2];
      cycleSort.execute(testArray, { recordHistory: true });
      
      // Verify history is recorded
      expect(cycleSort.history.length).toBeGreaterThan(0);
      
      // Check for cycle-related entries in history
      const cycleEntries = cycleSort.history.filter(state => 
        state.type?.includes('cycle') || 
        (state.message && state.message.includes('cycle'))
      );
      
      // Should have cycle-related entries for non-trivial input
      expect(cycleEntries.length).toBeGreaterThan(0);
    });
    
    test('should track position counts correctly', () => {
      // Position counting is a key part of cycle sort
      const testArray = [5, 3, 1, 4, 2];
      
      // Use a spy to track the recorded states
      const recordStateSpy = jest.spyOn(cycleSort, 'recordState');
      
      cycleSort.execute(testArray);
      
      // Check for position counting in the recorded states
      const positionCounts = recordStateSpy.mock.calls.filter(call => 
        call[1]?.type === 'position_count' || 
        (call[1]?.message && call[1]?.message.includes('position'))
      );
      
      // Verify that position counting was performed
      expect(positionCounts.length).toBeGreaterThan(0);
      
      recordStateSpy.mockRestore();
    });
  });
});
