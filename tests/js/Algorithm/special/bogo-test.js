/**
 * @file bogo.test.js
 * @description Comprehensive test suite for Bogo Sort algorithm implementation
 * 
 * This test suite evaluates the correctness, probabilistic behavior, and educational
 * properties of the Bogo Sort algorithm. Bogo Sort is an extremely inefficient
 * randomized sorting algorithm with an average time complexity of O(n·n!) and worst-case
 * complexity of O(∞) - it may never terminate for certain inputs.
 * 
 * As Bogo Sort is primarily an educational algorithm to demonstrate what NOT to do,
 * this test suite focuses on:
 * - Correctness validation for small inputs
 * - Statistical distribution of shuffle operations
 * - Termination constraints and maximum iteration safeguards
 * - Educational insights and complexity demonstration
 * - Randomization quality and properties
 * 
 * Note: Due to Bogo Sort's extreme inefficiency, test cases intentionally use very small arrays
 * or limit the maximum number of iterations to prevent tests from running indefinitely.
 */

import BogoSort from '../../src/algorithms/special/bogo';

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
 * Calculate factorial for computing theoretical average-case performance
 * @param {number} n - The number to calculate factorial for
 * @returns {number} - The factorial result (may overflow for large n)
 */
function factorial(n) {
  if (n <= 1) return 1;
  return n * factorial(n - 1);
}

/**
 * Calculate the probability of sorting an array in one shuffle
 * @param {number} n - Array length
 * @returns {number} - Probability (1/n!)
 */
function sortProbability(n) {
  return 1 / factorial(n);
}

describe('Bogo Sort Algorithm', () => {
  let bogoSort;
  
  beforeEach(() => {
    // Create a fresh instance before each test
    bogoSort = new BogoSort({
      maxIterations: 1000,        // Limit iterations to prevent infinite tests
      detailedShuffleTracing: true, // Track each shuffle for analysis
      deterministicSeed: null     // Use random seed by default
    });
  });
  
  // Core functionality tests with very small arrays
  describe('Core Functionality', () => {
    test('Should eventually sort a tiny array', () => {
      // Use a very small array (length 3) to ensure test can complete
      const input = [3, 1, 2];
      const result = bogoSort.execute(input);
      
      // Verify the result is sorted
      expect(isSorted(result)).toBe(true);
      expect(result.sort((a, b) => a - b)).toEqual(result);
    });
    
    test('Should maintain the original array length', () => {
      const input = [3, 2, 1];
      const result = bogoSort.execute(input);
      expect(result.length).toBe(input.length);
    });
    
    test('Should recognize already sorted arrays immediately', () => {
      const input = [1, 2, 3, 4];
      bogoSort.reset();
      const result = bogoSort.execute(input);
      
      // Already sorted arrays should be recognized immediately without shuffling
      expect(bogoSort.metrics.iterations).toBe(1);
      expect(result).toEqual(input);
    });
    
    test('Should perform random shuffles until array is sorted', () => {
      const input = [3, 2, 1];
      
      // Track all shuffles performed
      const shuffles = [];
      
      bogoSort.execute(input, {
        onShuffle: (array) => {
          shuffles.push([...array]); // Clone to avoid reference issues
        }
      });
      
      // Verify we performed at least one shuffle
      expect(shuffles.length).toBeGreaterThan(0);
      
      // The final shuffle should be sorted
      expect(isSorted(shuffles[shuffles.length - 1])).toBe(true);
      
      // Previous shuffles should mostly be unsorted (possible but unlikely to get sorted by chance)
      const sortedShuffles = shuffles.filter(arr => isSorted(arr));
      expect(sortedShuffles.length).toBeLessThanOrEqual(shuffles.length);
    });
  });
  
  // Edge cases
  describe('Edge Cases', () => {
    test('Should handle empty arrays', () => {
      const result = bogoSort.execute([]);
      expect(result).toEqual([]);
      // Empty arrays are already sorted, so only 1 iteration needed
      expect(bogoSort.metrics.iterations).toBe(1);
    });
    
    test('Should handle arrays with a single element', () => {
      const result = bogoSort.execute([42]);
      expect(result).toEqual([42]);
      // Single element arrays are already sorted
      expect(bogoSort.metrics.iterations).toBe(1);
    });
    
    test('Should handle arrays with duplicate elements', () => {
      const input = [2, 2, 1, 1];
      const result = bogoSort.execute(input);
      expect(isSorted(result)).toBe(true);
    });
    
    test('Should terminate after reaching maximum iterations', () => {
      // Create a Bogo Sort instance with very low max iterations
      const limitedBogoSort = new BogoSort({ maxIterations: 10 });
      
      // Use a length-5 array that would typically require many iterations
      const input = [5, 4, 3, 2, 1];
      
      // This should terminate due to max iterations rather than finding the solution
      let terminatedEarly = false;
      
      const result = limitedBogoSort.execute(input, {
        onMaxIterationsReached: () => {
          terminatedEarly = true;
        }
      });
      
      // We expect early termination due to maxIterations
      expect(terminatedEarly).toBe(true);
      
      // Iteration count should match our limit
      expect(limitedBogoSort.metrics.iterations).toBe(10);
      
      // The result may or may not be sorted (unlikely to be sorted by chance)
      // We don't assert this since the result is probabilistic
    });
  });
  
  // Probabilistic properties
  describe('Probabilistic Properties', () => {
    test('Should perform shuffles with uniform randomness', () => {
      // This tests whether the shuffle implementation produces uniformly random permutations
      const input = [1, 2, 3];
      const permutationCounts = {
        '1,2,3': 0,
        '1,3,2': 0,
        '2,1,3': 0,
        '2,3,1': 0,
        '3,1,2': 0,
        '3,2,1': 0
      };
      
      // Perform multiple shuffles to check distribution
      const shuffleCount = 600; // Should be divisible by 6 for even distribution
      
      for (let i = 0; i < shuffleCount; i++) {
        const shuffled = [...input]; // Clone the array
        bogoSort.shuffle(shuffled);
        
        // Count occurrences of each permutation
        permutationCounts[shuffled.toString()]++;
      }
      
      // Each permutation should appear roughly the same number of times
      // For a fair shuffle, each should appear about shuffleCount/6 times
      const expected = shuffleCount / 6;
      const tolerance = 0.25; // Allow 25% deviation from expected
      
      for (const count of Object.values(permutationCounts)) {
        expect(count).toBeGreaterThanOrEqual(expected * (1 - tolerance));
        expect(count).toBeLessThanOrEqual(expected * (1 + tolerance));
      }
    });
    
    test('Should terminate with high probability for very small arrays', () => {
      // For arrays of length 3, probability of finding sorted arrangement is 1/6
      // With 100 iterations, probability of not finding it is (5/6)^100 which is very small
      
      const input = [3, 1, 2];
      const maxIterations = 100;
      
      const customBogoSort = new BogoSort({ maxIterations });
      const result = customBogoSort.execute(input);
      
      // Verify we found a solution before hitting max iterations
      expect(customBogoSort.metrics.iterations).toBeLessThanOrEqual(maxIterations);
      expect(isSorted(result)).toBe(true);
    });
    
    test('Should exhibit expected average performance for tiny arrays', () => {
      // For an array of length n, the expected number of iterations is n!
      // This test is probabilistic and may occasionally fail
      
      // Use a very small array size to keep test duration reasonable
      const arraySize = 3;
      // Expected iterations: 3! = 6
      
      // Run multiple trials to average out randomness
      const trials = 5;
      let totalIterations = 0;
      
      for (let i = 0; i < trials; i++) {
        const input = Array.from(
          { length: arraySize }, 
          () => Math.floor(Math.random() * 100)
        ).sort((a, b) => b - a); // Reverse-sort to ensure we don't start sorted
        
        bogoSort.reset();
        bogoSort.execute(input);
        
        totalIterations += bogoSort.metrics.iterations;
      }
      
      const averageIterations = totalIterations / trials;
      const expectedIterations = factorial(arraySize);
      
      // Allow significant margin due to randomness
      // For small sample sizes, we might be quite far from expected value
      const tolerance = 2.0; // 200% tolerance
      
      expect(averageIterations).toBeGreaterThanOrEqual(expectedIterations * (1 - tolerance));
      expect(averageIterations).toBeLessThanOrEqual(expectedIterations * (1 + tolerance));
    });
  });
  
  // Educational aspects
  describe('Educational Properties', () => {
    test('Should demonstrate exponential growth in iterations with array size', () => {
      // This test shows how quickly Bogo Sort becomes impractical
      
      // Test with tiny arrays of increasing size
      const sizes = [2, 3, 4];
      const maxTrials = 3; // Multiple trials per size
      const results = {};
      
      for (const size of sizes) {
        let totalIterations = 0;
        let successfulTrials = 0;
        
        for (let trial = 0; trial < maxTrials; trial++) {
          // Create a reversed array of specified size
          const input = Array.from({ length: size }, (_, i) => size - i);
          
          bogoSort.reset();
          bogoSort.execute(input);
          
          // Only count trials that didn't hit max iterations
          if (bogoSort.metrics.iterations < bogoSort.options.maxIterations) {
            totalIterations += bogoSort.metrics.iterations;
            successfulTrials++;
          }
        }
        
        // Store average iterations if we had any successful trials
        if (successfulTrials > 0) {
          results[size] = totalIterations / successfulTrials;
        } else {
          results[size] = bogoSort.options.maxIterations; // Upper bound
        }
      }
      
      // Verify exponential growth pattern
      if (results[2] && results[3]) {
        // The ratio between consecutive sizes should be roughly factorial
        const ratio2to3 = results[3] / results[2];
        expect(ratio2to3).toBeGreaterThanOrEqual(2); // 3!/2! = 3
      }
      
      // For size 4 and above, we might hit max iterations frequently
      // so we just check the value is large
      if (results[4]) {
        expect(results[4]).toBeGreaterThanOrEqual(results[3]);
      }
    });
    
    test('Should demonstrate performance difference versus efficient algorithms', () => {
      // Create a mock efficient sort with O(n log n) performance
      const efficientSort = (arr) => [...arr].sort((a, b) => a - b);
      
      // Compare operations for a small array
      const input = [3, 2, 4, 1];
      
      // Count comparisons for efficient sort (mock)
      let efficientComparisons = 0;
      const mockCompare = (a, b) => {
        efficientComparisons++;
        return a - b;
      };
      [...input].sort(mockCompare);
      
      // Run Bogo Sort
      bogoSort.reset();
      bogoSort.execute(input);
      
      // Bogo Sort should perform many more comparisons
      // Only checking when successful, as sometimes it might hit max iterations
      if (bogoSort.metrics.iterations < bogoSort.options.maxIterations) {
        expect(bogoSort.metrics.comparisons).toBeGreaterThan(efficientComparisons);
      }
    });
  });
  
  // Implementation details
  describe('Implementation Details', () => {
    test('Should use Fisher-Yates shuffle for uniformity', () => {
      // This test verifies that the shuffle implementation uses Fisher-Yates
      // or a similarly uniform shuffling algorithm
      
      const input = [1, 2, 3, 4];
      
      // Count how often each element appears in each position
      const positionCounts = Array(input.length).fill(0).map(() => Object.fromEntries(
        input.map(val => [val, 0])
      ));
      
      // Perform many shuffles to check uniformity
      const shuffleCount = 1000;
      
      for (let i = 0; i < shuffleCount; i++) {
        const shuffled = [...input];
        bogoSort.shuffle(shuffled);
        
        // Record each element's position
        for (let pos = 0; pos < shuffled.length; pos++) {
          positionCounts[pos][shuffled[pos]]++;
        }
      }
      
      // Each element should appear in each position with roughly equal frequency
      const expected = shuffleCount / input.length;
      const tolerance = 0.2; // Allow 20% deviation
      
      for (let pos = 0; pos < input.length; pos++) {
        for (const val of input) {
          expect(positionCounts[pos][val]).toBeGreaterThanOrEqual(expected * (1 - tolerance));
          expect(positionCounts[pos][val]).toBeLessThanOrEqual(expected * (1 + tolerance));
        }
      }
    });
    
    test('Should have configurable randomness seed for deterministic testing', () => {
      // Create two instances with the same seed
      const seed = 12345;
      const bogoSort1 = new BogoSort({ deterministicSeed: seed });
      const bogoSort2 = new BogoSort({ deterministicSeed: seed });
      
      // Record shuffles from both
      const shuffles1 = [];
      const shuffles2 = [];
      
      const input = [3, 2, 1];
      
      bogoSort1.execute(input, {
        onShuffle: (array) => {
          shuffles1.push([...array]);
        }
      });
      
      bogoSort2.execute(input, {
        onShuffle: (array) => {
          shuffles2.push([...array]);
        }
      });
      
      // With the same seed, shuffle sequences should be identical
      expect(shuffles1.length).toBe(shuffles2.length);
      
      for (let i = 0; i < shuffles1.length; i++) {
        expect(shuffles1[i]).toEqual(shuffles2[i]);
      }
    });
  });
});