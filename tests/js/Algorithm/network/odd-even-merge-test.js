/**
 * @file odd-even-merge.test.js
 * @description Comprehensive test suite for Odd-Even Merge Sort algorithm implementation
 * 
 * This test suite evaluates the correctness, robustness, and performance characteristics
 * of the Odd-Even Merge Sort algorithm. Odd-Even Merge Sort is a parallel sorting
 * algorithm based on comparison networks with a time complexity of O(log²n) when
 * executed on O(n) parallel processors.
 * 
 * Test coverage includes:
 * - Correctness for various input types and distributions
 * - Validation of the odd-even merge process 
 * - Edge cases handling (empty arrays, single elements, power-of-two sizes)
 * - Performance characteristics compared to other parallel sorting algorithms
 * - Network structure validation and comparison count verification
 */

import OddEvenMergeSort from '../../src/algorithms/network/odd-even-merge';
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
 * Utility function to pad an array to the next power of 2
 * Odd-Even Merge Sort works best with power-of-2 sizes
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

/**
 * Utility function to calculate the theoretical number of comparisons
 * in Odd-Even Merge Sort for a power-of-2 size
 * @param {number} n - Array size (must be a power of 2)
 * @returns {number} - Theoretical comparison count
 */
function theoreticalComparisonCount(n) {
  if (n <= 1) return 0;
  
  const logN = Math.log2(n);
  return (n * logN * (logN + 1)) / 4;
}

describe('Odd-Even Merge Sort Algorithm', () => {
  let oddEvenMergeSort;
  
  beforeEach(() => {
    // Create a fresh instance before each test to avoid state contamination
    oddEvenMergeSort = new OddEvenMergeSort({
      parallelSimulation: true,   // Enable parallel execution simulation
      visualizeNetwork: true,     // Enable visualization of comparison network
      traceRecursion: true        // Enable tracing of recursive calls
    });
  });
  
  // Core functionality tests
  describe('Core Functionality', () => {
    test('Should sort an array in ascending order', () => {
      const input = [5, 2, 9, 1, 5, 6];
      const paddedInput = padToPowerOfTwo(input);
      const result = oddEvenMergeSort.execute(paddedInput);
      
      // Verify we got back a sorted array (initial elements)
      const sortedOriginal = result.slice(0, input.length);
      expect(isSorted(sortedOriginal)).toBe(true);
    });
    
    test('Should maintain the original array length', () => {
      const input = [8, 4, 2, 1, 5, 7, 3, 6];  // Power of 2 length
      const result = oddEvenMergeSort.execute(input);
      expect(result.length).toBe(input.length);
    });
    
    test('Should pad non-power-of-two arrays and sort correctly', () => {
      const input = [5, 3, 7, 9, 1, 2];  // Length 6, not a power of 2
      const result = oddEvenMergeSort.execute(input);
      
      // Verify we got back a sorted array
      expect(isSorted(result.slice(0, input.length))).toBe(true);
      
      // Verify length is a power of 2
      const nextPow2 = Math.pow(2, Math.ceil(Math.log2(input.length)));
      expect(result.length).toBe(nextPow2);
    });
    
    test('Should correctly implement the odd-even merge pattern', () => {
      // This test verifies that the algorithm follows the odd-even merge pattern
      // by tracking comparisons between odd and even indices
      
      const input = [8, 4, 2, 1, 5, 7, 3, 6];
      
      // Collect comparison information
      const comparisons = [];
      
      oddEvenMergeSort.execute(input, {
        onComparison: (indices, values) => {
          comparisons.push(indices);
        }
      });
      
      // In odd-even merge, we should see comparisons between:
      // 1. Elements at indices i and i+1 (adjacent)
      // 2. Elements at indices i and i+2 (odd-even pairs)
      
      // Count adjacent comparisons
      const adjacentComparisons = comparisons.filter(
        indices => Math.abs(indices[1] - indices[0]) === 1
      );
      
      // Count odd-even stride comparisons
      const strideComparisons = comparisons.filter(
        indices => Math.abs(indices[1] - indices[0]) === 2
      );
      
      // Both patterns should be present in significant numbers
      expect(adjacentComparisons.length).toBeGreaterThan(0);
      expect(strideComparisons.length).toBeGreaterThan(0);
    });
  });
  
  // Edge cases
  describe('Edge Cases', () => {
    test('Should handle empty arrays', () => {
      const result = oddEvenMergeSort.execute([]);
      expect(result).toEqual([]);
    });
    
    test('Should handle arrays with a single element', () => {
      const result = oddEvenMergeSort.execute([42]);
      expect(result).toEqual([42]);
    });
    
    test('Should handle arrays with duplicate elements', () => {
      const input = [5, 5, 5, 2, 2, 9, 9, 1];
      const result = oddEvenMergeSort.execute(input);
      expect(isSorted(result)).toBe(true);
    });
    
    test('Should handle already-sorted arrays', () => {
      const input = [1, 2, 3, 4, 5, 6, 7, 8];
      const result = oddEvenMergeSort.execute(input);
      expect(result).toEqual(input);
    });
    
    test('Should handle reverse-sorted arrays', () => {
      const input = [8, 7, 6, 5, 4, 3, 2, 1];
      const result = oddEvenMergeSort.execute(input);
      expect(result).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    });
    
    test('Should handle powers of 2 array lengths efficiently', () => {
      // Array with length 16 (2^4)
      const input = Array.from({ length: 16 }, () => Math.floor(Math.random() * 100));
      
      // Time the execution
      const startTime = performance.now();
      const result = oddEvenMergeSort.execute(input);
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
      // For powers of 2, we can predict the number of parallel steps
      const sizes = [8, 16, 32];
      
      for (const size of sizes) {
        const input = Array.from({ length: size }, () => Math.floor(Math.random() * 100));
        
        // Reset step counter
        let parallelSteps = 0;
        
        oddEvenMergeSort.execute(input, {
          onParallelStep: () => {
            parallelSteps++;
          }
        });
        
        // For n = 2^k, Odd-Even Merge Sort takes roughly O(k²) = O(log²n) parallel steps
        const k = Math.log2(size);
        
        // The exact formula is more complex than Bitonic Sort, but should be O(log²n)
        expect(parallelSteps).toBeGreaterThan(k);
        expect(parallelSteps).toBeLessThanOrEqual(k * k);
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
        oddEvenMergeSort.reset();
        oddEvenMergeSort.execute(data);
        metrics[name] = { ...oddEvenMergeSort.metrics };
      }
      
      // Like Bitonic Sort, Odd-Even Merge Sort should have relatively consistent performance
      // regardless of input distribution, especially for comparisons
      
      // Compare comparison counts across distributions
      const comparisonCounts = [
        metrics.random.comparisons,
        metrics.nearlySorted.comparisons,
        metrics.fewUnique.comparisons
      ];
      
      const maxComparisons = Math.max(...comparisonCounts);
      const minComparisons = Math.min(...comparisonCounts);
      
      // The ratio between max and min should be relatively small
      expect(maxComparisons / minComparisons).toBeLessThan(1.5);
    });
    
    test('Should compare favorably with Bitonic Sort on operation counts', () => {
      const size = 16; // Power of 2 length for fair comparison
      const input = Array.from({ length: size }, () => Math.floor(Math.random() * 100));
      const inputCopy = [...input]; // Make a copy for the second algorithm
      
      // Create Bitonic Sort instance for comparison
      const bitonicSort = new BitonicSort({
        parallelSimulation: true
      });
      
      // Execute both algorithms
      oddEvenMergeSort.reset();
      oddEvenMergeSort.execute(input);
      
      bitonicSort.reset();
      bitonicSort.execute(inputCopy);
      
      // Both should produce correct results
      expect(isSorted(input)).toBe(true);
      expect(isSorted(inputCopy)).toBe(true);
      
      // Compare metrics - Odd-Even Merge Sort should be comparable 
      // Both algorithms have the same asymptotic complexity
      expect(oddEvenMergeSort.metrics.comparisons).toBeLessThanOrEqual(
        bitonicSort.metrics.comparisons * 1.5
      );
      
      // The difference should not be extreme either way
      expect(oddEvenMergeSort.metrics.comparisons).toBeGreaterThanOrEqual(
        bitonicSort.metrics.comparisons * 0.5
      );
    });
  });
  
  // Algorithm-specific behavior
  describe('Algorithm-Specific Behavior', () => {
    test('Should decompose the sorting problem recursively', () => {
      const input = [8, 4, 2, 1, 5, 7, 3, 6];
      
      // Collect information about recursive calls
      const recursiveCalls = [];
      
      oddEvenMergeSort.execute(input, {
        onRecursiveCall: (info) => {
          recursiveCalls.push(info);
        }
      });
      
      // Check that we've recorded recursive calls
      expect(recursiveCalls.length).toBeGreaterThan(0);
      
      // Verify the recursive pattern of Odd-Even Merge Sort:
      
      // Should have calls that sort the first half
      const firstHalfCalls = recursiveCalls.filter(
        call => call.type === 'sort' && 
               call.start === 0 && 
               call.end === input.length / 2 - 1
      );
      expect(firstHalfCalls.length).toBeGreaterThan(0);
      
      // Should have calls that sort the second half
      const secondHalfCalls = recursiveCalls.filter(
        call => call.type === 'sort' && 
               call.start === input.length / 2 && 
               call.end === input.length - 1
      );
      expect(secondHalfCalls.length).toBeGreaterThan(0);
      
      // Should have merge calls that combine sorted halves
      const mergeCalls = recursiveCalls.filter(
        call => call.type === 'merge'
      );
      expect(mergeCalls.length).toBeGreaterThan(0);
    });
    
    test('Should perform the correct merge pattern for odd-even indices', () => {
      const input = [8, 4, 2, 1, 5, 7, 3, 6];
      
      // Track specific comparison patterns
      const oddEvenComparisons = [];
      
      oddEvenMergeSort.execute(input, {
        onMergeStep: (info) => {
          if (info.type === 'odd-even-comparison') {
            oddEvenComparisons.push(info);
          }
        }
      });
      
      // Check that we have odd-even comparisons
      expect(oddEvenComparisons.length).toBeGreaterThan(0);
      
      // In odd-even merge, we compare and possibly swap elements at positions
      // where one index is odd and one is even
      for (const comparison of oddEvenComparisons) {
        const [idx1, idx2] = comparison.indices;
        
        // One index should be odd and one should be even
        expect((idx1 % 2 === 0 && idx2 % 2 === 1) || 
               (idx1 % 2 === 1 && idx2 % 2 === 0)).toBe(true);
      }
    });
  });
  
  // Theoretical properties
  describe('Theoretical Properties', () => {
    test('Metrics should match theoretical operation counts', () => {
      // Test with multiple power-of-2 sizes
      const powers = [3, 4, 5]; // Testing 2^3=8, 2^4=16, 2^5=32
      
      for (const power of powers) {
        const size = Math.pow(2, power);
        const input = Array.from({ length: size }, () => Math.floor(Math.random() * 100));
        
        oddEvenMergeSort.reset();
        oddEvenMergeSort.execute(input);
        
        // Calculate theoretical comparison count
        const theoretical = theoreticalComparisonCount(size);
        
        // Allow small margin of error for implementation differences
        const allowedError = 0.2; // 20% margin
        
        // Verify comparisons are within expected range
        expect(oddEvenMergeSort.metrics.comparisons).toBeGreaterThanOrEqual(
          theoretical * (1 - allowedError)
        );
        expect(oddEvenMergeSort.metrics.comparisons).toBeLessThanOrEqual(
          theoretical * (1 + allowedError)
        );
      }
    });
    
    test('Should create a valid sorting network for any input', () => {
      // For small arrays, we can test multiple permutations
      const baseArray = [1, 2, 3, 4]; // Size 4 = 2^2
      
      // Generate some permutations
      const permutations = [
        [1, 2, 3, 4], // Already sorted
        [4, 3, 2, 1], // Reverse sorted
        [2, 1, 4, 3], // Mixed order
        [3, 1, 4, 2]  // Another mixed order
      ];
      
      // Test each permutation
      for (const perm of permutations) {
        const result = oddEvenMergeSort.execute(perm);
        expect(result).toEqual([1, 2, 3, 4]);
      }
    });
    
    test('Should always perform the same comparisons regardless of input', () => {
      // A key property of sorting networks is that the comparison pattern
      // is independent of the input data
      
      const size = 8;
      
      // Generate two different arrays
      const array1 = Array.from({ length: size }, () => Math.floor(Math.random() * 100));
      const array2 = Array.from({ length: size }, () => Math.floor(Math.random() * 100));
      
      // Track comparison indices for both runs
      const comparisons1 = [];
      const comparisons2 = [];
      
      oddEvenMergeSort.reset();
      oddEvenMergeSort.execute(array1, {
        onComparison: (indices) => {
          comparisons1.push([...indices]); // Clone to avoid reference issues
        }
      });
      
      oddEvenMergeSort.reset();
      oddEvenMergeSort.execute(array2, {
        onComparison: (indices) => {
          comparisons2.push([...indices]); // Clone to avoid reference issues
        }
      });
      
      // Both arrays should produce the same comparison pattern
      // (same indices compared in the same order)
      expect(comparisons1.length).toBe(comparisons2.length);
      
      for (let i = 0; i < comparisons1.length; i++) {
        expect(comparisons1[i]).toEqual(comparisons2[i]);
      }
    });
  });
});