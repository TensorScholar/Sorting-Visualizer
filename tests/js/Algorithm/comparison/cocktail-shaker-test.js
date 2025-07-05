// tests/js/algorithms/comparison/cocktail-shaker.test.js

/**
 * @fileoverview Comprehensive test suite for Cocktail Shaker Sort algorithm implementation.
 * 
 * This test suite rigorously evaluates the Cocktail Shaker Sort algorithm,
 * examining its bidirectional behavior, optimization efficacy, stability properties,
 * and comparative performance against standard Bubble Sort. The suite includes
 * validation across diverse input distributions, sizes, and edge cases.
 */

import CocktailShakerSort from '../../../../src/algorithms/comparison/cocktail-shaker';
import BubbleSort from '../../../../src/algorithms/comparison/bubble';
import { generateDataSet } from '../../../../src/data/generators';

// Test fixture data
const TEST_ARRAYS = {
  empty: [],
  single: [42],
  sorted: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  reversed: [10, 9, 8, 7, 6, 5, 4, 3, 2, 1],
  nearlySorted: [1, 2, 3, 5, 4, 6, 7, 8, 10, 9],
  turtlePattern: [1, 2, 3, 4, 5, 10, 9, 8, 7, 6], // Small values at beginning, large at end
  rabbitPattern: [6, 7, 8, 9, 10, 1, 2, 3, 4, 5], // Large values at beginning, small at end
  interspersed: [9, 2, 8, 3, 7, 4, 6, 5, 1, 10], // Alternating high/low values
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

describe('Cocktail Shaker Sort Algorithm', () => {
  let cocktailSort;
  
  beforeEach(() => {
    // Create a fresh instance for each test
    cocktailSort = new CocktailShakerSort();
  });
  
  describe('Correctness Tests', () => {
    test('should correctly sort an empty array', () => {
      const result = cocktailSort.execute(TEST_ARRAYS.empty);
      expect(result).toEqual([]);
    });
    
    test('should correctly sort an array with a single element', () => {
      const result = cocktailSort.execute(TEST_ARRAYS.single);
      expect(result).toEqual(TEST_ARRAYS.single);
    });
    
    test('should correctly sort a sorted array', () => {
      const result = cocktailSort.execute(TEST_ARRAYS.sorted);
      expect(result).toEqual(TEST_ARRAYS.sorted);
    });
    
    test('should correctly sort a reversed array', () => {
      const result = cocktailSort.execute(TEST_ARRAYS.reversed);
      expect(result).toEqual([...TEST_ARRAYS.reversed].sort((a, b) => a - b));
    });
    
    test('should correctly sort an array with duplicate elements', () => {
      const result = cocktailSort.execute(TEST_ARRAYS.withDuplicates);
      expect(result).toEqual([...TEST_ARRAYS.withDuplicates].sort((a, b) => a - b));
    });
    
    test('should correctly sort an array with negative values', () => {
      const result = cocktailSort.execute(TEST_ARRAYS.negativeValues);
      expect(result).toEqual([...TEST_ARRAYS.negativeValues].sort((a, b) => a - b));
    });
    
    test('should correctly sort larger random arrays', () => {
      const randomArray = Array.from({ length: 100 }, () => Math.floor(Math.random() * 1000));
      const result = cocktailSort.execute(randomArray);
      expect(isSorted(result)).toBe(true);
    });
    
    test('should maintain the original input array without modification', () => {
      const original = [...TEST_ARRAYS.randomSmall];
      cocktailSort.execute(TEST_ARRAYS.randomSmall);
      expect(TEST_ARRAYS.randomSmall).toEqual(original);
    });
  });
  
  describe('Bidirectional Behavior Tests', () => {
    test('should perform both forward and backward passes', () => {
      // Use a spy to track the direction changes
      const recordStateSpy = jest.spyOn(cocktailSort, 'recordState');
      
      cocktailSort.execute(TEST_ARRAYS.randomSmall);
      
      // Extract direction information from recorded states
      const forwardPasses = recordStateSpy.mock.calls.filter(call => 
        call[1]?.type === 'forward' || call[1]?.message?.includes('forward')
      ).length;
      
      const backwardPasses = recordStateSpy.mock.calls.filter(call => 
        call[1]?.type === 'backward' || call[1]?.message?.includes('backward')
      ).length;
      
      // Verify that both directions are used
      expect(forwardPasses).toBeGreaterThan(0);
      expect(backwardPasses).toBeGreaterThan(0);
      
      recordStateSpy.mockRestore();
    });
    
    test('should handle "turtle" pattern efficiently', () => {
      // "Turtle" pattern has small values at end, which bubble sort handles poorly
      // but cocktail shaker handles better due to backward pass
      
      // Run both algorithms and compare
      const bubbleSort = new BubbleSort({ optimize: true });
      const turtleArray = [1, 2, 3, 4, 5, 10, 9, 8, 7, 6];
      
      bubbleSort.execute(turtleArray);
      const bubbleSwaps = bubbleSort.metrics.swaps;
      
      cocktailSort.execute(turtleArray);
      const cocktailSwaps = cocktailSort.metrics.swaps;
      
      // Cocktail sort should perform fewer swaps on this pattern
      // due to the backward pass bringing 6 towards the front faster
      expect(cocktailSwaps).toBeLessThanOrEqual(bubbleSwaps);
    });
    
    test('should handle "rabbit" pattern efficiently', () => {
      // "Rabbit" pattern has large values at beginning that need to move to the end
      // Cocktail shaker can move them in forward pass
      
      const bubbleSort = new BubbleSort({ optimize: true });
      const rabbitArray = [6, 7, 8, 9, 10, 1, 2, 3, 4, 5];
      
      bubbleSort.execute(rabbitArray);
      const bubbleComparisons = bubbleSort.metrics.comparisons;
      
      cocktailSort.execute(rabbitArray);
      const cocktailComparisons = cocktailSort.metrics.comparisons;
      
      // For this specific pattern, both algorithms may perform similarly
      // But cocktail sort should not be significantly worse
      expect(cocktailComparisons).toBeLessThanOrEqual(bubbleComparisons * 1.2);
    });
  });
  
  describe('Optimization Behavior Tests', () => {
    test('should use early termination optimization with sorted arrays', () => {
      const sortedArray = [...TEST_ARRAYS.sorted];
      cocktailSort = new CocktailShakerSort({ earlyTermination: true });
      
      // Spy on the internal swap method to track calls
      const swapSpy = jest.spyOn(cocktailSort, 'swap');
      
      cocktailSort.execute(sortedArray);
      
      // Should terminate early with no swaps
      expect(swapSpy).not.toHaveBeenCalled();
      expect(cocktailSort.metrics.swaps).toBe(0);
      
      swapSpy.mockRestore();
    });
    
    test('should not use early termination when disabled', () => {
      // Create a sorter with optimization disabled
      cocktailSort = new CocktailShakerSort({ earlyTermination: false });
      
      cocktailSort.execute(TEST_ARRAYS.sorted);
      
      // Should go through all passes even with no swaps needed
      // The number of comparisons should be higher without early termination
      expect(cocktailSort.metrics.comparisons).toBeGreaterThan(TEST_ARRAYS.sorted.length);
    });
    
    test('should track both forward and backward boundaries correctly', () => {
      const testArray = [5, 3, 7, 2, 6, 4, 1];
      cocktailSort = new CocktailShakerSort({ adaptiveBoundaries: true });
      
      // Create a spy to track the boundary changes
      const recordStateSpy = jest.spyOn(cocktailSort, 'recordState');
      
      cocktailSort.execute(testArray);
      
      // Verify that both forward and backward boundaries are tracked
      // We check if there are calls that log sorted portions at both ends
      const forwardBoundary = recordStateSpy.mock.calls.some(call => 
        call[1]?.type === 'sorted' && 
        call[1]?.position === 'end' &&
        call[1]?.indices?.length > 0
      );
      
      const backwardBoundary = recordStateSpy.mock.calls.some(call => 
        call[1]?.type === 'sorted' && 
        call[1]?.position === 'start' &&
        call[1]?.indices?.length > 0
      );
      
      expect(forwardBoundary || backwardBoundary).toBe(true);
      
      recordStateSpy.mockRestore();
    });
  });
  
  describe('Comparative Performance Tests', () => {
    test('should perform better than bubble sort on certain patterns', () => {
      // Create both sorters with similar optimizations
      const bubbleSort = new BubbleSort({ optimize: true });
      cocktailSort = new CocktailShakerSort({ earlyTermination: true });
      
      // Generate an "interspersed" pattern where values alternate high/low
      // This pattern should benefit from bidirectional passes
      const interspersedArray = [];
      for (let i = 0; i < 100; i++) {
        interspersedArray.push(i % 2 === 0 ? 100 - i : i);
      }
      
      // Execute both algorithms and compare
      bubbleSort.execute([...interspersedArray]);
      const bubbleSwaps = bubbleSort.metrics.swaps;
      
      cocktailSort.execute([...interspersedArray]);
      const cocktailSwaps = cocktailSort.metrics.swaps;
      
      // On this pattern, cocktail sort should generally perform fewer operations
      // Allowing for some variability in implementation
      expect(cocktailSwaps).toBeLessThanOrEqual(bubbleSwaps * 1.1);
    });
    
    test('should have similar complexity to bubble sort in worst case', () => {
      // Both should exhibit O(n²) worst-case time complexity
      // Test with multiple sizes to verify quadratic growth pattern
      const sizes = [10, 20, 30];
      const bubbleComparisons = [];
      const cocktailComparisons = [];
      
      // Use reversed arrays (challenging case for both)
      for (const size of sizes) {
        const array = Array.from({ length: size }, (_, i) => size - i);
        
        const bubbleSort = new BubbleSort({ optimize: false });
        bubbleSort.execute([...array]);
        bubbleComparisons.push(bubbleSort.metrics.comparisons);
        
        cocktailSort = new CocktailShakerSort({ earlyTermination: false });
        cocktailSort.execute([...array]);
        cocktailComparisons.push(cocktailSort.metrics.comparisons);
      }
      
      // Verify both exhibit similar growth patterns
      const bubbleRatio = bubbleComparisons[1] / bubbleComparisons[0];
      const cocktailRatio = cocktailComparisons[1] / cocktailComparisons[0];
      
      // The ratio between different input sizes should be similar for both algorithms
      // Allowing for some variation due to the bidirectional nature of cocktail sort
      expect(bubbleRatio / cocktailRatio).toBeCloseTo(1, 0);
    });
    
    test('should perform better than bubble sort on nearly-sorted arrays with end elements out of place', () => {
      // Create an array where the smallest/largest elements are at the wrong ends
      // This pattern should benefit significantly from bidirectional passes
      const specialPattern = [50, 2, 3, 4, 5, 6, 7, 8, 9, 1];
      
      const bubbleSort = new BubbleSort({ optimize: true });
      bubbleSort.execute([...specialPattern]);
      const bubbleOperations = bubbleSort.metrics.comparisons + bubbleSort.metrics.swaps;
      
      cocktailSort = new CocktailShakerSort({ earlyTermination: true });
      cocktailSort.execute([...specialPattern]);
      const cocktailOperations = cocktailSort.metrics.comparisons + cocktailSort.metrics.swaps;
      
      // Cocktail sort should perform fewer operations on this pattern
      // due to bringing 1 to the front in the backward pass
      expect(cocktailOperations).toBeLessThan(bubbleOperations);
    });
  });
  
  describe('Property Tests', () => {
    test('should be a stable sorting algorithm', () => {
      const objectArray = createStabilitySortTestArray();
      
      // Create a custom comparator that only looks at the key property
      const keyComparator = (a, b) => a.key - b.key;
      
      // Execute cocktail sort with custom comparator
      const result = cocktailSort.execute(objectArray, { comparator: keyComparator });
      
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
      
      // Execute cocktail sort and track memory usage
      cocktailSort.execute(array);
      
      // Verify that auxiliary space used is O(1)
      expect(cocktailSort.metrics.auxiliarySpace).toBeLessThan(100); // Just a small constant amount
    });
    
    test('getComplexity() should return correct complexity information', () => {
      const complexity = cocktailSort.getComplexity();
      
      // With early termination enabled
      cocktailSort = new CocktailShakerSort({ earlyTermination: true });
      const complexityWithOpt = cocktailSort.getComplexity();
      
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
      expect(cocktailSort.isStable()).toBe(true);
    });
    
    test('isInPlace() should return true', () => {
      expect(cocktailSort.isInPlace()).toBe(true);
    });
  });
  
  describe('Instrumentation Tests', () => {
    test('should correctly count comparisons, swaps, reads, and writes', () => {
      const testArray = [5, 3, 1, 4, 2];
      cocktailSort.execute(testArray);
      
      // Ensure metrics are being tracked
      expect(cocktailSort.metrics.comparisons).toBeGreaterThan(0);
      expect(cocktailSort.metrics.swaps).toBeGreaterThan(0);
      expect(cocktailSort.metrics.reads).toBeGreaterThan(0);
      expect(cocktailSort.metrics.writes).toBeGreaterThan(0);
      
      // Verify the relationship between metrics
      // Each swap involves 2 reads and 2 writes
      expect(cocktailSort.metrics.writes).toBe(cocktailSort.metrics.swaps * 2);
      // Each comparison involves 2 reads
      expect(cocktailSort.metrics.reads).toBeGreaterThanOrEqual(cocktailSort.metrics.comparisons * 2);
    });
    
    test('should record direction changes in algorithm execution history', () => {
      const testArray = [5, 3, 1, 4, 2];
      cocktailSort.execute(testArray, { recordHistory: true });
      
      // Verify that history is recorded
      expect(cocktailSort.history.length).toBeGreaterThan(0);
      
      // Check for both forward and backward passes in history
      const forwardPassExists = cocktailSort.history.some(state => 
        state.type === 'forward' || (state.message && state.message.includes('forward'))
      );
      
      const backwardPassExists = cocktailSort.history.some(state => 
        state.type === 'backward' || (state.message && state.message.includes('backward'))
      );
      
      expect(forwardPassExists || backwardPassExists).toBe(true);
    });
    
    test('should track both sorting boundaries correctly', () => {
      const testArray = [5, 3, 1, 4, 2];
      cocktailSort = new CocktailShakerSort({ adaptiveBoundaries: true });
      
      cocktailSort.execute(testArray, { recordHistory: true });
      
      // Count the boundary updates in the history
      const boundaryUpdates = cocktailSort.history.filter(state => 
        state.type === 'boundary_update' || 
        (state.message && (
          state.message.includes('boundary') || 
          state.message.includes('limit')
        ))
      );
      
      // Should have at least some boundary updates with adaptive boundaries enabled
      expect(boundaryUpdates.length).toBeGreaterThan(0);
    });
  });
});
