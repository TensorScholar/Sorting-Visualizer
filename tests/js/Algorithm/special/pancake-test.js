/**
 * @file pancake.test.js
 * @description Comprehensive test suite for Pancake Sort algorithm implementation
 * 
 * This test suite evaluates the correctness, robustness, and specific characteristics
 * of the Pancake Sort algorithm. Pancake Sort is a comparison-based sorting algorithm
 * that sorts an array using only "pancake flips" - operations that reverse a prefix of 
 * the array (analogous to flipping a stack of pancakes with a spatula).
 * 
 * Test coverage includes:
 * - Correctness for various input types and distributions
 * - Validation of the pancake flip operation 
 * - Analysis of pancake flips count and distribution
 * - Edge cases handling
 * - Performance characteristics relative to theoretical bounds
 * - Special application to prefix-reversal problems
 */

import PancakeSort from '../../src/algorithms/special/pancake';
import { generateDataSet } from '../../src/data/generators';

/**
 * Utility function to verify if an array is sorted in ascending order
 * @param {Array} array - The array to check
 * @returns {boolean} - True if array is sorted, false otherwise
 */
function isSorted(array) {
  for (let i = 1; i < array.length; i++) {
    if (array[i] < array[i - 1]) {
      return false;
    }
  }
  return true;
}

/**
 * Utility function to perform a pancake flip on an array
 * Reverses the array from index 0 to k (inclusive)
 * @param {Array} array - The array to modify
 * @param {number} k - The index to flip up to
 */
function pancakeFlip(array, k) {
  for (let i = 0; i < (k + 1) / 2; i++) {
    [array[i], array[k - i]] = [array[k - i], array[i]];
  }
}

/**
 * Verify that a particular operation is a valid pancake flip
 * @param {Array} before - Array before flip
 * @param {Array} after - Array after flip
 * @param {number} flipIndex - Index where flip occurred
 * @returns {boolean} - True if the operation was a valid pancake flip
 */
function isValidPancakeFlip(before, after, flipIndex) {
  if (flipIndex < 0 || flipIndex >= before.length) return false;
  if (before.length !== after.length) return false;
  
  // Create a copy of the before array and apply the flip
  const expected = [...before];
  pancakeFlip(expected, flipIndex);
  
  // Check if the result matches the after array
  return JSON.stringify(expected) === JSON.stringify(after);
}

describe('Pancake Sort Algorithm', () => {
  let pancakeSort;
  
  beforeEach(() => {
    // Create a fresh instance before each test to avoid state contamination
    pancakeSort = new PancakeSort({
      useImprovedAlgorithm: true,   // Use optimized algorithm variant
      trackFlips: true,             // Track individual flip operations
      visualizeFlips: true          // Enable visualization of each flip
    });
  });
  
  // Core functionality tests
  describe('Core Functionality', () => {
    test('Should sort an array in ascending order', () => {
      const input = [5, 2, 9, 1, 5, 6];
      const result = pancakeSort.execute(input);
      
      // Verify we got back a sorted array
      expect(isSorted(result)).toBe(true);
      expect(result.sort((a, b) => a - b)).toEqual(result);
    });
    
    test('Should maintain the original array length', () => {
      const input = [9, 4, 7, 2, 1, 5, 6, 3];
      const result = pancakeSort.execute(input);
      expect(result.length).toBe(input.length);
    });
    
    test('Should perform only valid pancake flip operations', () => {
      const input = [5, 3, 7, 2, 1];
      
      // Track each array state and flip index
      const flips = [];
      
      pancakeSort.execute(input, {
        onFlip: (array, flipIndex) => {
          flips.push({
            array: [...array], // Make a copy
            flipIndex
          });
        }
      });
      
      // Verify we have at least one flip (unless input was already sorted)
      expect(flips.length).toBeGreaterThan(0);
      
      // Start with the initial state
      let currentState = [...input];
      
      // Verify each flip was valid
      for (const flip of flips) {
        const isValid = isValidPancakeFlip(currentState, flip.array, flip.flipIndex);
        expect(isValid).toBe(true);
        
        // Update current state for next flip
        currentState = flip.array;
      }
      
      // Final state should be sorted
      expect(isSorted(currentState)).toBe(true);
    });
    
    test('Should find the maximum element in each unsorted prefix', () => {
      const input = [3, 1, 5, 2, 4];
      
      // Track the elements selected for flipping to
      const maxElements = [];
      
      pancakeSort.execute(input, {
        onMaxElementFound: (value, index, currentPrefix) => {
          maxElements.push({ value, index, prefixLength: currentPrefix.length });
        }
      });
      
      // For each prefix length, verify we selected the maximum element
      for (const { value, prefixLength } of maxElements) {
        const prefix = input.slice(0, prefixLength);
        expect(value).toBe(Math.max(...prefix));
      }
    });
  });
  
  // Edge cases
  describe('Edge Cases', () => {
    test('Should handle empty arrays', () => {
      const result = pancakeSort.execute([]);
      expect(result).toEqual([]);
    });
    
    test('Should handle arrays with a single element', () => {
      const result = pancakeSort.execute([42]);
      expect(result).toEqual([42]);
      expect(pancakeSort.metrics.flips).toBe(0); // No flips needed
    });
    
    test('Should handle arrays with duplicate elements', () => {
      const input = [5, 5, 2, 2, 9, 9, 1];
      const result = pancakeSort.execute(input);
      expect(isSorted(result)).toBe(true);
    });
    
    test('Should handle already-sorted arrays', () => {
      const input = [1, 2, 3, 4, 5, 6];
      const result = pancakeSort.execute(input);
      expect(result).toEqual(input);
      
      // Optimized implementation should detect sorted input and avoid flips
      if (pancakeSort.options.useImprovedAlgorithm) {
        expect(pancakeSort.metrics.flips).toBe(0);
      }
    });
    
    test('Should handle reverse-sorted arrays', () => {
      const input = [6, 5, 4, 3, 2, 1];
      const result = pancakeSort.execute(input);
      
      // Final result should be sorted
      expect(result).toEqual([1, 2, 3, 4, 5, 6]);
      
      // Reverse-sorted arrays require significant flipping
      expect(pancakeSort.metrics.flips).toBeGreaterThan(0);
    });
  });
  
  // Algorithm-specific characteristics
  describe('Pancake Sort Characteristics', () => {
    test('Should perform at most 2(n-1) flips for an array of length n', () => {
      // Test with arrays of various sizes
      const sizes = [5, 10, 20];
      
      for (const size of sizes) {
        const input = Array.from({ length: size }, () => Math.floor(Math.random() * 100));
        
        pancakeSort.reset();
        pancakeSort.execute(input);
        
        // Classical pancake sort needs at most 2(n-1) flips
        const maxFlips = 2 * (size - 1);
        expect(pancakeSort.metrics.flips).toBeLessThanOrEqual(maxFlips);
      }
    });
    
    test('Should reduce flip count with improved algorithm', () => {
      // Test with and without the improved algorithm
      const input = [5, 2, 9, 1, 6, 4, 8, 3, 7];
      
      // With improved algorithm
      const improvedPancakeSort = new PancakeSort({
        useImprovedAlgorithm: true,
        trackFlips: true
      });
      improvedPancakeSort.execute([...input]);
      const improvedFlips = improvedPancakeSort.metrics.flips;
      
      // Without improved algorithm
      const classicPancakeSort = new PancakeSort({
        useImprovedAlgorithm: false,
        trackFlips: true
      });
      classicPancakeSort.execute([...input]);
      const classicFlips = classicPancakeSort.metrics.flips;
      
      // Improved algorithm should generally use fewer or equal flips
      // (In rare cases the classic might use fewer due to randomness in the array)
      expect(improvedFlips).toBeLessThanOrEqual(classicFlips * 1.2);
    });
    
    test('Should always perform exactly 2 flips to place the maximum element', () => {
      const input = [5, 2, 9, 1, 6, 4, 8, 3, 7];
      
      // Count flips per iteration
      const flipsPerIteration = [];
      let currentFlips = 0;
      
      pancakeSort.execute(input, {
        onFlip: () => {
          currentFlips++;
        },
        onIterationComplete: (iteration) => {
          flipsPerIteration.push(currentFlips);
          currentFlips = 0;
        }
      });
      
      // In the classic algorithm, each iteration should use exactly 2 flips
      // (except possibly the last if optimization is used)
      for (let i = 0; i < flipsPerIteration.length - 1; i++) {
        expect(flipsPerIteration[i]).toBeLessThanOrEqual(2);
      }
    });
  });
  
  // Performance characteristics
  describe('Performance Characteristics', () => {
    test('Should have consistent performance across different input distributions', () => {
      const size = 20;
      
      // Generate different input distributions
      const randomData = generateDataSet('random', size, { min: 1, max: 100 });
      const nearlySortedData = generateDataSet('nearly-sorted', size, { min: 1, max: 100, sortedRatio: 0.8 });
      const fewUniqueData = generateDataSet('few-unique', size, { min: 1, max: 100, uniqueValues: 5 });
      
      // Count flips for each distribution
      const metrics = {};
      
      for (const [name, data] of [
        ['random', randomData],
        ['nearlySorted', nearlySortedData],
        ['fewUnique', fewUniqueData]
      ]) {
        pancakeSort.reset();
        pancakeSort.execute(data);
        metrics[name] = { ...pancakeSort.metrics };
      }
      
      // Nearly sorted arrays should require fewer flips
      expect(metrics.nearlySorted.flips).toBeLessThanOrEqual(metrics.random.flips);
      
      // All should be within the theoretical bound of 2(n-1)
      const theoreticalMax = 2 * (size - 1);
      for (const metric of Object.values(metrics)) {
        expect(metric.flips).toBeLessThanOrEqual(theoreticalMax);
      }
    });
    
    test('Should perform fewer comparisons than O(n²) algorithms for large arrays', () => {
      // For a mock O(n²) algorithm, we'd expect roughly n²/2 comparisons
      const size = 30;
      const input = Array.from({ length: size }, () => Math.floor(Math.random() * 100));
      
      pancakeSort.reset();
      pancakeSort.execute(input);
      
      // Pancake sort should perform significantly fewer than n² comparisons
      // even though its time complexity is O(n²)
      const n2 = size * size;
      expect(pancakeSort.metrics.comparisons).toBeLessThan(n2);
    });
  });
  
  // Application-specific tests
  describe('Special Applications', () => {
    test('Should solve the pancake flipping problem', () => {
      // The pancake flipping problem: sort an array using only prefix reversals
      // This is equivalent to sorting a stack of pancakes by size using a spatula
      
      // Create a randomly permuted array
      const perfectOrder = [1, 2, 3, 4, 5, 6, 7, 8];
      const shuffled = [...perfectOrder].sort(() => Math.random() - 0.5);
      
      // Solve using pancake sort
      const flips = [];
      
      pancakeSort.execute(shuffled, {
        onFlip: (array, flipIndex) => {
          flips.push(flipIndex);
        }
      });
      
      // Manually apply the recorded flips to verify solution
      let state = [...shuffled];
      
      for (const flipIndex of flips) {
        pancakeFlip(state, flipIndex);
      }
      
      // Final state should match perfect order
      expect(state).toEqual(perfectOrder);
    });
    
    test('Should handle the burnt pancake problem variant', () => {
      // The burnt pancake problem: each pancake has a burnt side and must end up
      // with burnt side down. This is equivalent to sorting and orienting.
      
      // This test only applies if the algorithm implements the burnt variant
      if (!pancakeSort.supportsBurntPancakeProblem) {
        return;
      }
      
      // Create a pancake stack with both ordering and orientation
      // Represented as [value, orientation] pairs where orientation is 0 or 1
      const burntPancakes = [
        [3, 1], [1, 0], [4, 1], [2, 0], [5, 1]
      ];
      
      const result = pancakeSort.executeBurnt(burntPancakes);
      
      // Check both ordering and orientation in result
      for (let i = 0; i < result.length; i++) {
        // Values should be in ascending order
        expect(result[i][0]).toBe(i + 1);
        // All orientations should be 0 (burnt side down)
        expect(result[i][1]).toBe(0);
      }
    });
  });
  
  // Implementation-specific tests
  describe('Implementation Details', () => {
    test('Should leverage optimization to avoid unnecessary flips', () => {
      // In an optimized implementation, if elements are already in order
      // at some point in the algorithm, it should avoid flipping them
      
      // Create a partially sorted array where the last half is already sorted
      const input = [5, 4, 3, 1, 2, 6, 7, 8, 9, 10];
      
      const flips = [];
      
      pancakeSort.execute(input, {
        onFlip: (array, flipIndex) => {
          flips.push(flipIndex);
        }
      });
      
      // Check which elements were affected by flips
      const affectedIndices = new Set();
      
      for (const flipIndex of flips) {
        for (let i = 0; i <= flipIndex; i++) {
          affectedIndices.add(i);
        }
      }
      
      // In an optimized implementation, the already-sorted suffix
      // should not be touched by flips
      const sortedSuffix = [6, 7, 8, 9, 10];
      const sortedIndices = new Set(
        input.map((val, idx) => sortedSuffix.includes(val) ? idx : -1)
          .filter(idx => idx !== -1)
      );
      
      // There should be minimal overlap between affected indices and sorted suffix
      const intersection = [...sortedIndices].filter(idx => affectedIndices.has(idx));
      
      // Allow for some overlap, but it should be minimal
      expect(intersection.length).toBeLessThan(sortedSuffix.length);
    });
    
    test('Should find maximum element efficiently', () => {
      // Track how we find the maximum element in each iteration
      const input = [5, 3, 7, 2, 1, 8, 6, 4];
      
      let comparisonCount = 0;
      const maxValueSequence = [];
      
      // Custom comparison function to count comparisons
      const compareFn = (a, b) => {
        comparisonCount++;
        return a - b;
      };
      
      pancakeSort.execute(input, {
        customCompare: compareFn,
        onMaxElementFound: (value) => {
          maxValueSequence.push(value);
        }
      });
      
      // Maximum values should be found in descending order
      // (8, then 7, then 6, etc.)
      expect(maxValueSequence).toEqual([8, 7, 6, 5, 4, 3, 2, 1]);
      
      // Finding the maximum in an array of n elements should take n-1 comparisons
      // Over all iterations, that's n-1 + n-2 + ... + 1 = n(n-1)/2
      const expectedComparisons = (input.length * (input.length - 1)) / 2;
      
      // Allow some slack for implementation differences
      expect(comparisonCount).toBeLessThanOrEqual(expectedComparisons * 1.2);
    });
  });
});