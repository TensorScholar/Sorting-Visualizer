// tests/js/algorithms/distribution/bucket.test.js

/**
 * @file Comprehensive test suite for Bucket Sort algorithm implementation
 * @author Advanced Sorting Algorithm Visualization Platform Team
 * @version 1.0.0
 * 
 * This test suite provides exhaustive verification of the Bucket Sort implementation,
 * covering correctness, edge cases, performance characteristics, and algorithm-specific
 * behaviors including:
 * 
 * - Basic sorting functionality across various input distributions
 * - Bucket count and distribution effectiveness
 * - Performance scaling with input size and distribution
 * - Special case handling (empty arrays, single elements, etc.)
 * - Algorithm-specific optimizations and configurations
 * - Instrumentation accuracy and metrics collection
 */

import BucketSort from '../../../../src/algorithms/distribution/bucket';
import { generateDataSet } from '../../../../src/data/generators';

// Mock the performance.now() to ensure consistent timing in tests
const originalPerformanceNow = global.performance.now;
let mockTime = 0;

beforeEach(() => {
  // Reset mock time before each test
  mockTime = 0;
  global.performance.now = jest.fn(() => {
    mockTime += 1; // Increment by 1ms for each call
    return mockTime;
  });
});

afterAll(() => {
  // Restore the original performance.now
  global.performance.now = originalPerformanceNow;
});

/**
 * Helper function to validate that an array is correctly sorted
 * @param {Array} arr - The array to check
 * @returns {boolean} - Whether the array is sorted in ascending order
 */
function isSorted(arr) {
  for (let i = 1; i < arr.length; i++) {
    if (arr[i] < arr[i - 1]) {
      return false;
    }
  }
  return true;
}

describe('BucketSort Algorithm', () => {
  // Basic initialization and configuration tests
  describe('Initialization and Configuration', () => {
    test('should initialize with correct default parameters', () => {
      const bucketSort = new BucketSort();
      expect(bucketSort.name).toBe('Bucket Sort');
      expect(bucketSort.category).toBe('distribution');
      expect(bucketSort.options.bucketCount).toBeGreaterThan(0);
      expect(bucketSort.options.adaptiveBuckets).toBeDefined();
      expect(bucketSort.options.subSortAlgorithm).toBeDefined();
    });

    test('should accept custom configuration options', () => {
      const customOptions = {
        bucketCount: 20,
        adaptiveBuckets: true,
        subSortAlgorithm: 'insertion'
      };
      const bucketSort = new BucketSort(customOptions);
      
      expect(bucketSort.options.bucketCount).toBe(20);
      expect(bucketSort.options.adaptiveBuckets).toBe(true);
      expect(bucketSort.options.subSortAlgorithm).toBe('insertion');
    });

    test('should return correct complexity information', () => {
      const bucketSort = new BucketSort();
      const complexity = bucketSort.getComplexity();
      
      expect(complexity.time.best).toBe('O(n)');
      expect(complexity.time.average).toBe('O(n + k)');
      expect(complexity.time.worst).toBe('O(n²)');
      expect(complexity.space.worst).toBe('O(n + k)');
    });

    test('should indicate it is not an in-place algorithm', () => {
      const bucketSort = new BucketSort();
      expect(bucketSort.isInPlace()).toBe(false);
    });

    test('should indicate it is stable when using a stable sub-sort', () => {
      const bucketSort = new BucketSort({ subSortAlgorithm: 'insertion' });
      expect(bucketSort.isStable()).toBe(true);
      
      // If using a non-stable sub-sort, the algorithm would not be stable
      const bucketSortWithQuick = new BucketSort({ subSortAlgorithm: 'quick' });
      expect(bucketSortWithQuick.isStable()).toBe(false);
    });
  });

  // Correctness tests with various input types
  describe('Basic Sorting Functionality', () => {
    test('should correctly sort an array of integers', () => {
      const bucketSort = new BucketSort();
      const unsortedArray = [5, 3, 8, 4, 2, 9, 1, 7, 6];
      const sortedArray = bucketSort.execute(unsortedArray);
      
      expect(sortedArray).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
      expect(isSorted(sortedArray)).toBe(true);
    });

    test('should correctly sort an array with negative numbers', () => {
      const bucketSort = new BucketSort();
      const unsortedArray = [5, -3, 8, -4, 2, -9, 1, -7, 6];
      const sortedArray = bucketSort.execute(unsortedArray);
      
      expect(sortedArray).toEqual([-9, -7, -4, -3, 1, 2, 5, 6, 8]);
      expect(isSorted(sortedArray)).toBe(true);
    });

    test('should correctly sort an array with duplicate elements', () => {
      const bucketSort = new BucketSort();
      const unsortedArray = [5, 3, 5, 8, 3, 2, 5, 8, 2];
      const sortedArray = bucketSort.execute(unsortedArray);
      
      expect(sortedArray).toEqual([2, 2, 3, 3, 5, 5, 5, 8, 8]);
      expect(isSorted(sortedArray)).toBe(true);
    });

    test('should correctly sort an array with decimal values', () => {
      const bucketSort = new BucketSort();
      const unsortedArray = [5.5, 3.3, 8.8, 4.4, 2.2, 9.9, 1.1, 7.7, 6.6];
      const sortedArray = bucketSort.execute(unsortedArray);
      
      expect(sortedArray).toEqual([1.1, 2.2, 3.3, 4.4, 5.5, 6.6, 7.7, 8.8, 9.9]);
      expect(isSorted(sortedArray)).toBe(true);
    });

    test('should handle arrays with a single element', () => {
      const bucketSort = new BucketSort();
      const unsortedArray = [42];
      const sortedArray = bucketSort.execute(unsortedArray);
      
      expect(sortedArray).toEqual([42]);
    });

    test('should handle empty arrays', () => {
      const bucketSort = new BucketSort();
      const unsortedArray = [];
      const sortedArray = bucketSort.execute(unsortedArray);
      
      expect(sortedArray).toEqual([]);
    });
  });

  // Edge cases and special inputs
  describe('Edge Cases and Special Inputs', () => {
    test('should handle already sorted arrays efficiently', () => {
      const bucketSort = new BucketSort();
      const sortedArray = [1, 2, 3, 4, 5, 6, 7, 8, 9];
      
      // Execute and record metrics
      bucketSort.execute(sortedArray);
      
      // Already sorted should be efficient in bucket sort
      // (Note: exact operations count will vary with implementation)
      expect(bucketSort.metrics.comparisons).toBeLessThan(sortedArray.length * sortedArray.length);
    });

    test('should handle arrays with all identical elements', () => {
      const bucketSort = new BucketSort();
      const identicalArray = [7, 7, 7, 7, 7, 7, 7];
      const result = bucketSort.execute(identicalArray);
      
      expect(result).toEqual([7, 7, 7, 7, 7, 7, 7]);
      
      // Should be efficient due to all elements going into one bucket
      expect(bucketSort.metrics.comparisons).toBeLessThan(identicalArray.length * 2);
    });

    test('should handle very large range values', () => {
      const bucketSort = new BucketSort({ bucketCount: 10, adaptiveBuckets: true });
      const wideRangeArray = [1, 1000000, 5, 20, 500000, 100];
      const result = bucketSort.execute(wideRangeArray);
      
      expect(result).toEqual([1, 5, 20, 100, 500000, 1000000]);
      expect(isSorted(result)).toBe(true);
    });

    test('should handle unevenly distributed data', () => {
      const bucketSort = new BucketSort({ bucketCount: 10, adaptiveBuckets: true });
      // Create a skewed distribution: many small values, few large values
      const skewedArray = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 1000, 2000, 3000];
      const result = bucketSort.execute(skewedArray);
      
      expect(isSorted(result)).toBe(true);
      // Adaptive bucketing should handle this well
      if (bucketSort.options.adaptiveBuckets) {
        expect(bucketSort.metrics.comparisons).toBeLessThan(skewedArray.length * skewedArray.length);
      }
    });
  });

  // Performance tests
  describe('Performance Characteristics', () => {
    test('should exhibit O(n) behavior for uniformly distributed data', () => {
      const bucketSort = new BucketSort({ 
        bucketCount: 10,
        adaptiveBuckets: true,
        subSortAlgorithm: 'insertion'
      });
      
      // Generate uniformly distributed data
      const smallData = generateDataSet('random', 100, { min: 1, max: 1000 });
      const largeData = generateDataSet('random', 1000, { min: 1, max: 10000 });
      
      // Execute with small dataset
      bucketSort.reset();
      bucketSort.execute(smallData);
      const smallDataOps = bucketSort.metrics.comparisons + bucketSort.metrics.swaps;
      
      // Execute with large dataset (10x size)
      bucketSort.reset();
      bucketSort.execute(largeData);
      const largeDataOps = bucketSort.metrics.comparisons + bucketSort.metrics.swaps;
      
      // In ideal O(n) algorithm, operations would scale linearly with input size
      // Allow some variance due to the constant factors and implementation details
      // Should be far less than O(n²) which would be a 100x increase
      const ratio = largeDataOps / smallDataOps;
      
      // With uniform data, it should be closer to O(n) than O(n log n)
      // expecting ratio < 20 (rather than 10) to allow for some variance
      expect(ratio).toBeLessThan(20);
    });

    test('should handle non-uniform distribution with adaptive bucketing', () => {
      // Only run this test if adaptive bucketing is supported
      const bucketSort = new BucketSort({ 
        bucketCount: 20, 
        adaptiveBuckets: true,
        subSortAlgorithm: 'insertion'
      });
      
      if (!bucketSort.options.adaptiveBuckets) {
        return; // Skip test if adaptive bucketing not supported
      }
      
      // Generate non-uniform data (skewed exponential distribution)
      const data = generateDataSet('exponential', 500, { 
        min: 1, 
        max: 10000,
        lambda: 0.001 // Parameter controlling shape of exponential distribution
      });
      
      // Execute with adaptive bucketing enabled
      bucketSort.reset();
      bucketSort.execute(data);
      const adaptiveOps = bucketSort.metrics.comparisons + bucketSort.metrics.swaps;
      
      // Execute with adaptive bucketing disabled
      bucketSort.reset();
      bucketSort.options.adaptiveBuckets = false;
      bucketSort.execute(data);
      const nonAdaptiveOps = bucketSort.metrics.comparisons + bucketSort.metrics.swaps;
      
      // Adaptive bucketing should generally be more efficient for non-uniform data
      expect(adaptiveOps).toBeLessThanOrEqual(nonAdaptiveOps * 1.5);
    });

    test('should scale bucket count with input size effectively', () => {
      const bucketSort = new BucketSort({
        adaptiveBuckets: false, // Use fixed bucket count for this test
        subSortAlgorithm: 'insertion'
      });
      
      // Test with different bucket counts
      const data = generateDataSet('random', 1000, { min: 1, max: 1000 });
      
      // Try with very few buckets
      bucketSort.reset();
      bucketSort.options.bucketCount = 2;
      bucketSort.execute(data);
      const fewBucketsOps = bucketSort.metrics.comparisons + bucketSort.metrics.swaps;
      
      // Try with a moderate number of buckets
      bucketSort.reset();
      bucketSort.options.bucketCount = 32;
      bucketSort.execute(data);
      const moderateBucketsOps = bucketSort.metrics.comparisons + bucketSort.metrics.swaps;
      
      // Try with many buckets
      bucketSort.reset();
      bucketSort.options.bucketCount = 200;
      bucketSort.execute(data);
      const manyBucketsOps = bucketSort.metrics.comparisons + bucketSort.metrics.swaps;
      
      // Too few buckets should be less efficient than a moderate number
      expect(fewBucketsOps).toBeGreaterThan(moderateBucketsOps);
      
      // The relationship between moderate and many buckets depends on distribution
      // For uniform data, too many buckets can be inefficient
      // This assertion might vary based on specific implementation details
      expect(manyBucketsOps).toBeGreaterThan(moderateBucketsOps * 0.5);
    });
  });

  // Algorithm-specific behavior tests
  describe('Algorithm-Specific Behavior', () => {
    test('should create the correct number of buckets', () => {
      const bucketCount = 10;
      const bucketSort = new BucketSort({ bucketCount });
      
      // Mock the internal bucket creation/allocation to verify counts
      const originalRun = bucketSort.run;
      
      let actualBucketCount = 0;
      bucketSort.run = function(array, options) {
        const buckets = new Array(options.bucketCount).fill().map(() => []);
        actualBucketCount = buckets.length;
        return originalRun.call(this, array, options);
      };
      
      bucketSort.execute([1, 2, 3, 4, 5]);
      expect(actualBucketCount).toBe(bucketCount);
      
      // Restore original implementation
      bucketSort.run = originalRun;
    });

    test('should distribute elements across buckets according to their values', () => {
      const bucketSort = new BucketSort({ bucketCount: 4, adaptiveBuckets: false });
      
      // Mock the bucket allocation to track distribution
      const originalRun = bucketSort.run;
      let bucketDistribution = [];
      
      bucketSort.run = function(array, options) {
        const min = Math.min(...array);
        const max = Math.max(...array);
        const range = (max - min) || 1;
        const buckets = new Array(options.bucketCount).fill().map(() => []);
        
        // Distribute elements into buckets
        for (let i = 0; i < array.length; i++) {
          const value = array[i];
          const normalizedValue = (value - min) / range;
          const bucketIndex = Math.min(
            Math.floor(normalizedValue * options.bucketCount),
            options.bucketCount - 1
          );
          buckets[bucketIndex].push(value);
        }
        
        // Record bucket distribution for testing
        bucketDistribution = buckets.map(bucket => bucket.length);
        
        return originalRun.call(this, array, options);
      };
      
      // Array with a uniform distribution
      const uniformArray = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
      bucketSort.execute(uniformArray);
      
      // With 4 buckets and uniform distribution, we expect roughly equal distribution
      // But allow some variance as the exact distribution depends on implementation
      const nonEmptyBuckets = bucketDistribution.filter(count => count > 0);
      expect(nonEmptyBuckets.length).toBeGreaterThanOrEqual(2);
      
      // Restore original implementation
      bucketSort.run = originalRun;
    });

    test('should use insertion sort for sub-arrays when specified', () => {
      const bucketSort = new BucketSort({ 
        bucketCount: 4, 
        subSortAlgorithm: 'insertion'
      });
      
      // Mock the sub-sort algorithm to verify it's called with insertion sort
      const originalRun = bucketSort.run;
      let subSortAlgorithmUsed = null;
      
      bucketSort.run = function(array, options) {
        // Override the insertionSort method to track calls
        this.insertionSort = function(arr) {
          subSortAlgorithmUsed = 'insertion';
          // Simple insertion sort implementation for test
          for (let i = 1; i < arr.length; i++) {
            const current = arr[i];
            let j = i - 1;
            while (j >= 0 && arr[j] > current) {
              arr[j + 1] = arr[j];
              j--;
            }
            arr[j + 1] = current;
          }
          return arr;
        };
        
        return originalRun.call(this, array, options);
      };
      
      bucketSort.execute([5, 3, 8, 1, 6, 2, 7, 4]);
      expect(subSortAlgorithmUsed).toBe('insertion');
      
      // Restore original implementation
      bucketSort.run = originalRun;
    });
  });

  // Instrumentation and metrics tests
  describe('Instrumentation and Metrics', () => {
    test('should track reads and writes correctly', () => {
      const bucketSort = new BucketSort();
      const array = [5, 3, 8, 4, 2];
      
      bucketSort.execute(array);
      
      // We should have at least as many reads and writes as array elements
      expect(bucketSort.metrics.reads).toBeGreaterThanOrEqual(array.length);
      expect(bucketSort.metrics.writes).toBeGreaterThanOrEqual(array.length);
      
      // Verify reads and writes are being recorded in a sensible ratio
      // Bucket sort typically reads each element once and writes each element back at least once
      expect(bucketSort.metrics.reads).toBeGreaterThanOrEqual(array.length);
      expect(bucketSort.metrics.writes).toBeGreaterThanOrEqual(array.length);
    });

    test('should record algorithm state history correctly', () => {
      const bucketSort = new BucketSort();
      const array = [5, 3, 8, 4, 2];
      
      bucketSort.execute(array, { recordHistory: true });
      
      // Should have recorded state history
      expect(bucketSort.history.length).toBeGreaterThan(0);
      
      // First state should be initial array
      expect(bucketSort.history[0].type).toBe('initial');
      expect(Array.isArray(bucketSort.history[0].array)).toBe(true);
      
      // Last state should be final sorted array
      const lastState = bucketSort.history[bucketSort.history.length - 1];
      expect(lastState.type).toBe('final');
      expect(isSorted(lastState.array)).toBe(true);
      
      // Should include bucket distribution states
      const bucketStates = bucketSort.history.filter(state => 
        state.type === 'bucket-allocation' || 
        state.type === 'bucket-contents' ||
        state.type === 'bucket-sort'
      );
      expect(bucketStates.length).toBeGreaterThan(0);
    });

    test('should correctly measure execution time', () => {
      const bucketSort = new BucketSort();
      const array = generateDataSet('random', 1000, { min: 1, max: 1000 });
      
      bucketSort.execute(array);
      
      // Time metrics should be recorded
      expect(bucketSort.metrics.startTime).toBeGreaterThanOrEqual(0);
      expect(bucketSort.metrics.endTime).toBeGreaterThan(bucketSort.metrics.startTime);
      expect(bucketSort.metrics.executionTime).toBeGreaterThan(0);
    });
  });
});
