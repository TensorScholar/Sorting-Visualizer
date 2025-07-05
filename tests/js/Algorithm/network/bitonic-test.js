/**
 * @file bitonic.test.js
 * @description Comprehensive test suite for Bitonic Sort algorithm implementation
 * 
 * This test suite evaluates the correctness, robustness, and performance characteristics
 * of the Bitonic Sort algorithm. Bitonic Sort is a parallel sorting algorithm with a
 * time complexity of O(log²n) when executed on O(n) parallel processors.
 * 
 * Test coverage includes:
 * - Correctness for various input types and distributions
 * - Behavioral verification of the bitonic sequence formation
 * - Edge cases handling (empty arrays, single elements, power-of-two sizes)
 * - Performance characteristics under different input distributions
 * - Validation of parallel execution simulation
 */

import BitonicSort from '../../src/algorithms/network/bitonic';
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
 * Utility function to check if an array is a valid bitonic sequence
 * A bitonic sequence is one that first increases, then decreases (or vice versa)
 * @param {Array} array - The array to check
 * @returns {boolean} - True if array is a valid bitonic sequence
 */
function isBitonicSequence(array) {
  if (array.length <= 2) return true;
  
  // Find the turning point
  let i = 1;
  while (i < array.length && array[i] >= array[i - 1]) i++;
  
  // If no turning point, check if sequence is strictly decreasing
  if (i === array.length) {
    return array[0] >= array[array.length - 1];
  }
  
  // Check if sequence strictly decreases after turning point
  while (i < array.length) {
    if (array[i] > array[i - 1]) return false;
    i++;
  }
  
  return true;
}

/**
 * Utility function to pad an array to the next power of 2
 * Bitonic sort requires input sizes to be a power of 2
 * @param {Array} array - The array to pad
 * @returns {Array} - Padded array with length as a power of 2
 */
function padToPowerOfTwo(array) {
  const nextPow2 = Math.pow(2, Math.ceil(Math.log2(array.length)));
  if (array.length === nextPow2) return [...array];
  
  // Padding value should be beyond the range of existing values
  const paddingValue = Math.max(...array) + 1;
  const result = [...array];
  while (result.length < nextPow2) {
    result.push(paddingValue);
  }
  return result;
}

describe('Bitonic Sort Algorithm', () => {
  let bitonicSort;
  
  beforeEach(() => {
    // Create a fresh instance before each test to avoid state contamination
    bitonicSort = new BitonicSort({
      parallelSimulation: true,  // Enable parallel execution simulation
      recursiveTracing: true,    // Enable tracing of recursive calls
      visualizeBitonic: true     // Enable visualization of bitonic sequences
    });
  });
  
  // Core functionality tests
  describe('Core Functionality', () => {
    test('Should sort an array in ascending order', () => {
      const input = [5, 2, 9, 1, 5, 6];
      const paddedInput = padToPowerOfTwo(input);
      const result = bitonicSort.execute(paddedInput);
      
      // Verify we got back a sorted array (initial elements)
      const sortedOriginal = result.slice(0, input.length);
      expect(isSorted(sortedOriginal)).toBe(true);
    });
    
    test('Should maintain the original array length', () => {
      const input = [9, 4, 7, 2, 1, 5, 6, 3];
      const result = bitonicSort.execute(input);
      expect(result.length).toBe(input.length);
    });
    
    test('Should pad non-power-of-two arrays and sort correctly', () => {
      const input = [5, 3, 7, 9, 1, 2];  // Length 6, not a power of 2
      const result = bitonicSort.execute(input);
      
      // Verify we got back a sorted array
      expect(isSorted(result.slice(0, input.length))).toBe(true);
      
      // Verify length is a power of 2
      const nextPow2 = Math.pow(2, Math.ceil(Math.log2(input.length)));
      expect(result.length).toBe(nextPow2);
    });
    
    test('Should generate correct bitonic sequences during sorting', () => {
      const input = [5, 2, 9, 1, 5, 6, 3, 8];
      
      // Access internal state to trace bitonic sequences
      // This requires special instrumentation in the algorithm
      let bitonicSequences = [];
      
      const result = bitonicSort.execute(input, {
        onBitonicSequence: (sequence) => {
          bitonicSequences.push(sequence);
        }
      });
      
      // Verify that at least some of the intermediate sequences are bitonic
      let bitonicCount = 0;
      for (const sequence of bitonicSequences) {
        if (isBitonicSequence(sequence)) {
          bitonicCount++;
        }
      }
      
      // At least some sequences should be bitonic
      expect(bitonicCount).toBeGreaterThan(0);
      
      // Final result should be sorted
      expect(isSorted(result)).toBe(true);
    });
  });
  
  // Edge cases
  describe('Edge Cases', () => {
    test('Should handle empty arrays', () => {
      const result = bitonicSort.execute([]);
      expect(result).toEqual([]);
    });
    
    test('Should handle arrays with a single element', () => {
      const result = bitonicSort.execute([42]);
      expect(result).toEqual([42]);
    });
    
    test('Should handle arrays with duplicate elements', () => {
      const input = [5, 5, 5, 2, 2, 9, 9, 1];
      const result = bitonicSort.execute(input);
      expect(isSorted(result)).toBe(true);
    });
    
    test('Should handle already-sorted arrays', () => {
      const input = [1, 2, 3, 4, 5, 6, 7, 8];
      const result = bitonicSort.execute(input);
      expect(result).toEqual(input);
    });
    
    test('Should handle reverse-sorted arrays', () => {
      const input = [8, 7, 6, 5, 4, 3, 2, 1];
      const result = bitonicSort.execute(input);
      expect(result).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    });
    
    test('Should handle powers of 2 array lengths efficiently', () => {
      // Array with length 16 (2^4)
      const input = Array.from({ length: 16 }, () => Math.floor(Math.random() * 100));
      
      // Time the execution
      const startTime = performance.now();
      const result = bitonicSort.execute(input);
      const endTime = performance.now();
      
      // Verify result is correct
      expect(isSorted(result)).toBe(true);
      
      // Execution should be relatively fast for a power-of-2 length
      // This is a soft assertion as exact timing depends on the environment
      expect(endTime - startTime).toBeLessThan(1000); // 1 second is very generous
    });
  });
  
  // Performance characteristics
  describe('Performance Characteristics', () => {
    test('Should execute in O(log²n) parallel steps for power-of-2 sizes', () => {
      // For powers of 2, we can predict the exact number of parallel steps
      const sizes = [8, 16, 32];
      
      for (const size of sizes) {
        const input = Array.from({ length: size }, () => Math.floor(Math.random() * 100));
        
        // Reset step counter
        let parallelSteps = 0;
        
        bitonicSort.execute(input, {
          onParallelStep: () => {
            parallelSteps++;
          }
        });
        
        // For n = 2^k, Bitonic Sort takes O(k²) = O(log²n) parallel steps
        // The exact formula is k(k+1)/2 steps
        const k = Math.log2(size);
        const expectedSteps = (k * (k + 1)) / 2;
        
        // Allow for small implementation variations
        expect(parallelSteps).toBeGreaterThanOrEqual(expectedSteps);
        expect(parallelSteps).toBeLessThanOrEqual(expectedSteps * 1.5);
      }
    });
    
    test('Should perform consistently across different input distributions', () => {
      const size = 32; // Power of 2 for consistent comparison
      
      // Generate different input distributions
      const randomData = generateDataSet('random', size, { min: 1, max: 100 });
      const nearlySortedData = generateDataSet('nearly-sorted', size, { min: 1, max: 100, sortedRatio: 0.8 });
      const fewUniqueData = generateDataSet('few-unique', size, { min: 1, max: 100, uniqueValues: 5 });
      
      // Count operations for each distribution
      const metrics = {};
      
      for (const [name, data] of [
        ['random', randomData],
        ['nearlySorted', nearlySortedData],
        ['fewUnique', fewUniqueData]
      ]) {
        bitonicSort.reset();
        bitonicSort.execute(data);
        metrics[name] = { ...bitonicSort.metrics };
      }
      
      // Bitonic Sort should have relatively consistent performance
      // regardless of input distribution, especially for comparisons
      
      // Compare comparison counts across distributions
      // Allow for some variation but shouldn't be drastically different
      const comparisonCounts = [
        metrics.random.comparisons,
        metrics.nearlySorted.comparisons,
        metrics.fewUnique.comparisons
      ];
      
      const maxComparisons = Math.max(...comparisonCounts);
      const minComparisons = Math.min(...comparisonCounts);
      
      // The ratio between max and min should be relatively small
      // Bitonic Sort's comparison count shouldn't vary too much with distribution
      expect(maxComparisons / minComparisons).toBeLessThan(1.5);
    });
  });
  
  // Algorithm-specific behavior
  describe('Algorithm-Specific Behavior', () => {
    test('Should correctly trace the recursive subdivision of the array', () => {
      const input = [5, 2, 9, 1, 5, 6, 3, 8];
      
      // Collect information about recursive calls
      const recursiveCalls = [];
      
      bitonicSort.execute(input, {
        onRecursiveCall: (info) => {
          recursiveCalls.push(info);
        }
      });
      
      // Check that we've recorded recursive calls
      expect(recursiveCalls.length).toBeGreaterThan(0);
      
      // For a length-8 array, verify expected subdivision pattern:
      // The first subdivision should split the array in half
      const firstCall = recursiveCalls[0];
      expect(firstCall.start).toBe(0);
      expect(firstCall.end).toBe(input.length - 1);
      
      // Find calls that operate on smaller subdivisions
      const halfSizeCalls = recursiveCalls.filter(
        call => call.end - call.start + 1 === input.length / 2
      );
      expect(halfSizeCalls.length).toBeGreaterThan(0);
      
      // Should eventually reach single-element subdivisions
      const singleElementCalls = recursiveCalls.filter(
        call => call.start === call.end
      );
      expect(singleElementCalls.length).toBeGreaterThan(0);
    });
    
    test('Should perform parallel comparisons within each recursion level', () => {
      const input = [8, 7, 6, 5, 4, 3, 2, 1];
      
      // Collect information about parallel comparison batches
      const parallelBatches = [];
      let currentBatch = [];
      
      bitonicSort.execute(input, {
        onComparison: (indices, values) => {
          currentBatch.push({ indices, values });
        },
        onParallelStep: () => {
          if (currentBatch.length > 0) {
            parallelBatches.push([...currentBatch]);
            currentBatch = [];
          }
        }
      });
      
      // Should have multiple parallel batches
      expect(parallelBatches.length).toBeGreaterThan(1);
      
      // In a true parallel implementation, comparisons within a batch 
      // should be independent (no overlapping indices)
      for (const batch of parallelBatches) {
        if (batch.length > 1) {
          const touchedIndices = new Set();
          let hasOverlap = false;
          
          for (const { indices } of batch) {
            for (const idx of indices) {
              if (touchedIndices.has(idx)) {
                hasOverlap = true;
                break;
              }
              touchedIndices.add(idx);
            }
            if (hasOverlap) break;
          }
          
          expect(hasOverlap).toBe(false);
        }
      }
    });
  });
  
  // Additional theoretical tests
  describe('Theoretical Properties', () => {
    test('Metrics should match theoretical operation counts', () => {
      // For an array of size n=2^k, Bitonic Sort performs:
      // - Exactly n·log(n)·(log(n)+1)/4 comparisons
      // - Exactly n·log(n)·(log(n)+1)/4 potential swaps
      
      const powers = [3, 4, 5]; // Testing 2^3=8, 2^4=16, 2^5=32
      
      for (const power of powers) {
        const size = Math.pow(2, power);
        const input = Array.from({ length: size }, () => Math.floor(Math.random() * 100));
        
        bitonicSort.reset();
        bitonicSort.execute(input);
        
        // Calculate theoretical counts
        const n = size;
        const logN = Math.log2(n);
        const theoreticalComparisons = (n * logN * (logN + 1)) / 4;
        
        // Allow small margin of error for implementation differences
        const allowedError = 0.1; // 10% margin
        
        // Verify comparisons are within expected range
        expect(bitonicSort.metrics.comparisons).toBeGreaterThanOrEqual(
          theoreticalComparisons * (1 - allowedError)
        );
        expect(bitonicSort.metrics.comparisons).toBeLessThanOrEqual(
          theoreticalComparisons * (1 + allowedError)
        );
      }
    });
    
    test('Should achieve perfect sorting network for powers of 2', () => {
      // A perfect sorting network means the algorithm produces
      // a correct sorting for any input permutation
      
      // For small arrays, we can test all permutations
      const testArray = [1, 2, 3, 4]; // Size 4 = 2^2
      const permutations = generatePermutations(testArray);
      
      // Test each permutation
      for (const perm of permutations) {
        const result = bitonicSort.execute(perm);
        expect(result).toEqual([1, 2, 3, 4]);
      }
    });
  });
});

/**
 * Utility function to generate all permutations of an array
 * Warning: This function has factorial complexity, so only use with small arrays
 * @param {Array} array - Input array
 * @returns {Array<Array>} - Array of all permutations
 */
function generatePermutations(array) {
  // Base case
  if (array.length <= 1) return [array];
  
  const result = [];
  
  // For each element, use it as the first and recurse on the rest
  for (let i = 0; i < array.length; i++) {
    const current = array[i];
    // Create array without current element
    const remaining = [...array.slice(0, i), ...array.slice(i + 1)];
    // Get permutations of remaining elements
    const permutationsOfRemaining = generatePermutations(remaining);
    
    // Add current element to beginning of each permutation of remaining
    for (const perm of permutationsOfRemaining) {
      result.push([current, ...perm]);
    }
  }
  
  return result;
}