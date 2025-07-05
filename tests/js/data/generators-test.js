// tests/js/data/generators.test.js

/**
 * Comprehensive test suite for the data generation utilities
 * 
 * These tests ensure that all data generation functions produce arrays with
 * the expected properties, handle edge cases appropriately, and maintain
 * statistical validity across different distribution types.
 * 
 * @module tests/js/data/generators.test.js
 */

import { 
  generateDataSet,
  generateRandomData,
  generateSortedData,
  generateReversedData,
  generateNearlySortedData,
  generateFewUniqueData,
  generateSawtoothData,
  generatePlateauData,
  generateDistribution,
  generateGaussianDistribution,
  generateExponentialDistribution,
  generateBimodalDistribution,
  generateAdversarialCase,
  generateQuicksortAdversarial,
  generateMergesortAdversarial,
  generateInsertionSortAdversarial,
  generateHeapSortAdversarial,
  generateObjectsForStabilityTest,
  generateKSortedArray,
  generateArrayWithSortedRuns,
  generateRotatedSortedArray,
  generateDutchFlagData,
  generateMedianFindingData,
  generateTopKData,
  generateKSortedArrays,
  generateStatisticalDataset,
  generateCustomDistribution,
  isSorted
} from '../../../src/data/generators';

/**
 * Utility function to check if an array is in ascending order
 * We don't use `isSorted` from the generators module to avoid circular testing
 * 
 * @param {Array} arr - The array to check
 * @returns {boolean} - True if array is sorted
 */
function checkSorted(arr) {
  if (arr.length <= 1) return true;
  
  for (let i = 1; i < arr.length; i++) {
    if (arr[i] < arr[i-1]) {
      return false;
    }
  }
  return true;
}

/**
 * Utility function to check if an array is in descending order
 * 
 * @param {Array} arr - The array to check
 * @returns {boolean} - True if array is sorted in descending order
 */
function checkReversed(arr) {
  if (arr.length <= 1) return true;
  
  for (let i = 1; i < arr.length; i++) {
    if (arr[i] > arr[i-1]) {
      return false;
    }
  }
  return true;
}

/**
 * Calculate what percentage of array is already sorted
 * 
 * @param {Array} arr - The array to analyze
 * @returns {number} - Percentage of array that is in sorted order (0-1)
 */
function calculateSortedPercentage(arr) {
  if (arr.length <= 1) return 1;
  
  let sortedPairs = 0;
  for (let i = 1; i < arr.length; i++) {
    if (arr[i] >= arr[i-1]) {
      sortedPairs++;
    }
  }
  return sortedPairs / (arr.length - 1);
}

/**
 * Count unique values in an array
 * 
 * @param {Array} arr - The array to analyze
 * @returns {number} - Count of unique values
 */
function countUniqueValues(arr) {
  return new Set(arr).size;
}

/**
 * Calculate statistical properties of an array
 * 
 * @param {Array} arr - The array to analyze
 * @returns {Object} - Statistical properties
 */
function calculateStats(arr) {
  if (arr.length === 0) return { mean: NaN, median: NaN, min: NaN, max: NaN, stdDev: NaN };
  
  const min = Math.min(...arr);
  const max = Math.max(...arr);
  const sum = arr.reduce((acc, val) => acc + val, 0);
  const mean = sum / arr.length;
  
  // Calculate median
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const median = sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
  
  // Calculate standard deviation
  const squaredDiffs = arr.map(val => Math.pow(val - mean, 2));
  const avgSquaredDiff = squaredDiffs.reduce((acc, val) => acc + val, 0) / arr.length;
  const stdDev = Math.sqrt(avgSquaredDiff);
  
  return { mean, median, min, max, stdDev };
}

/**
 * Measure distribution of values within ranges
 * 
 * @param {Array} arr - The array to analyze
 * @param {number} buckets - Number of buckets to divide range into
 * @returns {Array} - Array of bucket counts
 */
function measureDistribution(arr, buckets = 10) {
  if (arr.length === 0) return Array(buckets).fill(0);
  
  const min = Math.min(...arr);
  const max = Math.max(...arr);
  const range = max - min;
  const bucketSize = range / buckets;
  const distribution = Array(buckets).fill(0);
  
  arr.forEach(val => {
    const bucketIndex = Math.min(
      buckets - 1,
      Math.floor((val - min) / bucketSize)
    );
    distribution[bucketIndex]++;
  });
  
  return distribution;
}

describe('Data Generation Utilities', () => {
  // Basic validation tests
  describe('Parameter Validation', () => {
    test('generateDataSet should return an array of specified size', () => {
      const sizes = [0, 1, 10, 100, 1000];
      
      sizes.forEach(size => {
        const data = generateDataSet('random', size);
        expect(Array.isArray(data)).toBe(true);
        expect(data.length).toBe(size);
      });
    });
    
    test('generated arrays should be within specified bounds', () => {
      const bounds = [
        { min: 1, max: 100 },
        { min: -50, max: 50 },
        { min: 0, max: 1 },
        { min: 1000, max: 2000 }
      ];
      
      bounds.forEach(({ min, max }) => {
        const data = generateRandomData(100, min, max);
        
        // Check every element is within bounds
        data.forEach(val => {
          expect(val).toBeGreaterThanOrEqual(min);
          expect(val).toBeLessThanOrEqual(max);
        });
        
        // Check min and max are represented (or close)
        expect(Math.min(...data)).toBeLessThanOrEqual(min + (max - min) * 0.1);
        expect(Math.max(...data)).toBeGreaterThanOrEqual(max - (max - min) * 0.1);
      });
    });
    
    test('should handle edge case of empty arrays', () => {
      const emptyArray = generateRandomData(0);
      expect(emptyArray).toEqual([]);
      
      const emptySorted = generateSortedData(0);
      expect(emptySorted).toEqual([]);
    });
    
    test('should handle edge case of size 1 arrays', () => {
      const singletonArray = generateRandomData(1);
      expect(singletonArray.length).toBe(1);
      
      const singletonSorted = generateSortedData(1);
      expect(singletonSorted.length).toBe(1);
    });
  });
  
  // Basic generation functions
  describe('Basic Generation Functions', () => {
    test('generateRandomData should produce random distribution', () => {
      const size = 1000;
      const data = generateRandomData(size, 1, 100);
      
      // Check statistical properties
      const stats = calculateStats(data);
      
      // Mean should be roughly in the middle of the range (50 ± 10)
      expect(stats.mean).toBeGreaterThan(40);
      expect(stats.mean).toBeLessThan(60);
      
      // Standard deviation should be roughly 1/4 of the range
      expect(stats.stdDev).toBeGreaterThan(20);
      expect(stats.stdDev).toBeLessThan(30);
      
      // Distribution should be relatively uniform
      const distribution = measureDistribution(data, 10);
      const expectedCount = size / 10;
      
      // No bucket should have significantly more or less than expected
      distribution.forEach(count => {
        expect(count).toBeGreaterThan(expectedCount * 0.7);
        expect(count).toBeLessThan(expectedCount * 1.3);
      });
    });
    
    test('generateSortedData should produce sorted array', () => {
      const sizes = [10, 100, 1000];
      
      sizes.forEach(size => {
        const data = generateSortedData(size, 1, 100);
        
        // Array should be sorted
        expect(checkSorted(data)).toBe(true);
        
        // Elements should be evenly distributed across range
        if (size > 1) {
          const firstDiff = data[1] - data[0];
          const lastDiff = data[data.length - 1] - data[data.length - 2];
          
          // First and last differences should be roughly the same
          expect(Math.abs(firstDiff - lastDiff)).toBeLessThan(2);
        }
      });
    });
    
    test('generateReversedData should produce reversed array', () => {
      const sizes = [10, 100, 1000];
      
      sizes.forEach(size => {
        const data = generateReversedData(size, 1, 100);
        
        // Array should be in descending order
        expect(checkReversed(data)).toBe(true);
        
        // First element should be large, last should be small
        if (size > 1) {
          expect(data[0]).toBeGreaterThan(data[data.length - 1]);
        }
      });
    });
    
    test('generateReversedData with ratio parameter', () => {
      const ratios = [0.5, 0.8, 1.0];
      
      ratios.forEach(ratio => {
        const data = generateReversedData(100, 1, 100, ratio);
        
        if (ratio === 1.0) {
          // Should be completely reversed
          expect(checkReversed(data)).toBe(true);
        } else {
          // Should not be completely reversed
          expect(checkReversed(data)).toBe(false);
          
          // But should be mostly reversed
          const reversedPairs = data.slice(1).filter((val, i) => val > data[i]).length;
          const reversedRatio = reversedPairs / (data.length - 1);
          
          // Reversed ratio should be close to specified ratio
          expect(reversedRatio).toBeGreaterThan(ratio - 0.2);
          expect(reversedRatio).toBeLessThan(ratio + 0.2);
        }
      });
    });
    
    test('generateNearlySortedData should produce partially sorted array', () => {
      const ratios = [0.7, 0.9, 1.0];
      
      ratios.forEach(ratio => {
        const data = generateNearlySortedData(100, 1, 100, ratio);
        
        if (ratio === 1.0) {
          // Should be completely sorted
          expect(checkSorted(data)).toBe(true);
        } else {
          // Calculate how sorted the array is
          const sortedPercentage = calculateSortedPercentage(data);
          
          // Should be close to specified ratio
          expect(sortedPercentage).toBeGreaterThan(ratio - 0.15);
          expect(sortedPercentage).toBeLessThan(ratio + 0.15);
        }
      });
    });
    
    test('generateFewUniqueData should produce array with limited unique values', () => {
      const uniqueCounts = [1, 5, 10, 20];
      
      uniqueCounts.forEach(uniqueCount => {
        const data = generateFewUniqueData(100, 1, 100, uniqueCount);
        
        // Count actual unique values
        const actualUnique = countUniqueValues(data);
        
        // Should have at most the specified number of unique values
        expect(actualUnique).toBeLessThanOrEqual(uniqueCount);
        
        // Should be close to the specified number
        if (uniqueCount > 1) {
          expect(actualUnique).toBeGreaterThanOrEqual(uniqueCount * 0.8);
        }
      });
    });
  });
  
  // Pattern generation functions
  describe('Pattern Generation Functions', () => {
    test('generateSawtoothData should produce sawtooth pattern', () => {
      const data = generateSawtoothData(100, 1, 100);
      
      // Find local maxima and minima
      let maxima = [];
      let minima = [];
      
      for (let i = 1; i < data.length - 1; i++) {
        if (data[i] > data[i-1] && data[i] > data[i+1]) {
          maxima.push(i);
        }
        if (data[i] < data[i-1] && data[i] < data[i+1]) {
          minima.push(i);
        }
      }
      
      // Should have multiple peaks and valleys
      expect(maxima.length).toBeGreaterThan(1);
      expect(minima.length).toBeGreaterThan(0);
      
      // Calculate average peak distance
      if (maxima.length > 1) {
        const avgPeakDistance = (maxima[maxima.length - 1] - maxima[0]) / (maxima.length - 1);
        
        // Peaks should be roughly evenly spaced
        let prevPeak = maxima[0];
        for (let i = 1; i < maxima.length; i++) {
          const distance = maxima[i] - prevPeak;
          expect(distance).toBeGreaterThan(avgPeakDistance * 0.5);
          expect(distance).toBeLessThan(avgPeakDistance * 1.5);
          prevPeak = maxima[i];
        }
      }
    });
    
    test('generatePlateauData should produce plateau pattern', () => {
      const data = generatePlateauData(100, 1, 100);
      
      // Count stretches of identical values
      let plateaus = [];
      let currentValue = data[0];
      let currentStretch = 1;
      
      for (let i = 1; i < data.length; i++) {
        if (data[i] === currentValue) {
          currentStretch++;
        } else {
          if (currentStretch > 1) {
            plateaus.push({ value: currentValue, length: currentStretch });
          }
          currentValue = data[i];
          currentStretch = 1;
        }
      }
      
      // Add last plateau if needed
      if (currentStretch > 1) {
        plateaus.push({ value: currentValue, length: currentStretch });
      }
      
      // Should have multiple plateaus
      expect(plateaus.length).toBeGreaterThan(1);
      
      // Plateaus should have reasonable sizes
      plateaus.forEach(plateau => {
        expect(plateau.length).toBeGreaterThan(1);
      });
    });
    
    test('generateKSortedArray should keep elements close to sorted positions', () => {
      const k = 5;
      const data = generateKSortedArray(100, k, 1, 100);
      
      // Generate fully sorted array for comparison
      const sortedData = [...data].sort((a, b) => a - b);
      
      // Check each element's displacement from its sorted position
      data.forEach((val, i) => {
        const sortedPos = sortedData.indexOf(val);
        const displacement = Math.abs(sortedPos - i);
        
        // Displacement should not exceed k
        expect(displacement).toBeLessThanOrEqual(k);
      });
    });
    
    test('generateArrayWithSortedRuns should create array with sorted subsequences', () => {
      const runSize = 10;
      const data = generateArrayWithSortedRuns(100, runSize);
      
      // Identify sorted runs
      let runs = [];
      let currentRun = [0];
      
      for (let i = 1; i < data.length; i++) {
        if (data[i] >= data[i-1]) {
          currentRun.push(i);
        } else {
          if (currentRun.length > 1) {
            runs.push(currentRun);
          }
          currentRun = [i];
        }
      }
      
      // Add last run if needed
      if (currentRun.length > 1) {
        runs.push(currentRun);
      }
      
      // Should have multiple runs
      expect(runs.length).toBeGreaterThan(1);
      
      // Average run length should be close to specified size
      const avgRunLength = runs.reduce((sum, run) => sum + run.length, 0) / runs.length;
      expect(avgRunLength).toBeGreaterThan(runSize * 0.5);
      expect(avgRunLength).toBeLessThan(runSize * 2);
    });
    
    test('generateRotatedSortedArray should rotate a sorted array', () => {
      const size = 100;
      const rotationPoint = 30;
      const data = generateRotatedSortedArray(size, rotationPoint, 1, 100);
      
      // First part (after rotation point) should be sorted
      expect(checkSorted(data.slice(0, size - rotationPoint))).toBe(true);
      
      // Second part (before rotation point) should be sorted
      expect(checkSorted(data.slice(size - rotationPoint))).toBe(true);
      
      // First element of second part should be less than last element of first part
      if (rotationPoint > 0 && rotationPoint < size) {
        expect(data[size - rotationPoint]).toBeLessThan(data[size - rotationPoint - 1]);
      }
      
      // Array should become sorted if properly rotated back
      const rotatedBack = [
        ...data.slice(size - rotationPoint),
        ...data.slice(0, size - rotationPoint)
      ];
      expect(checkSorted(rotatedBack)).toBe(true);
    });
  });
  
  // Distribution generation functions
  describe('Statistical Distribution Functions', () => {
    test('generateGaussianDistribution should produce normal distribution', () => {
      const size = 1000;
      const mean = 50;
      const stdDev = 10;
      const data = generateGaussianDistribution(size, { mean, stdDev, min: 1, max: 100 });
      
      // Calculate stats
      const stats = calculateStats(data);
      
      // Mean should be close to specified
      expect(stats.mean).toBeGreaterThan(mean - 3);
      expect(stats.mean).toBeLessThan(mean + 3);
      
      // Standard deviation should be close to specified
      expect(stats.stdDev).toBeGreaterThan(stdDev * 0.7);
      expect(stats.stdDev).toBeLessThan(stdDev * 1.3);
      
      // Median should be close to mean (normal distribution property)
      expect(Math.abs(stats.median - stats.mean)).toBeLessThan(2);
      
      // Generate histogram for distribution shape analysis
      const buckets = 20;
      const histogram = measureDistribution(data, buckets);
      
      // Middle buckets should have more elements than edge buckets
      const middleIndex = Math.floor(buckets / 2);
      const middleBuckets = histogram.slice(middleIndex - 2, middleIndex + 3);
      const edgeBuckets = [
        ...histogram.slice(0, 3),
        ...histogram.slice(buckets - 3)
      ];
      
      const avgMiddleCount = middleBuckets.reduce((a, b) => a + b, 0) / middleBuckets.length;
      const avgEdgeCount = edgeBuckets.reduce((a, b) => a + b, 0) / edgeBuckets.length;
      
      // Middle should have more than edges
      expect(avgMiddleCount).toBeGreaterThan(avgEdgeCount);
    });
    
    test('generateExponentialDistribution should produce exponential distribution', () => {
      const size = 1000;
      const lambda = 0.1;
      const data = generateExponentialDistribution(size, { lambda, min: 1, max: 100 });
      
      // Generate histogram for distribution shape analysis
      const buckets = 10;
      const histogram = measureDistribution(data, buckets);
      
      // Exponential distribution should have more elements in earlier buckets
      for (let i = 1; i < buckets; i++) {
        expect(histogram[i - 1]).toBeGreaterThan(histogram[i] * 0.7);
      }
    });
    
    test('generateBimodalDistribution should produce bimodal distribution', () => {
      const size = 1000;
      const options = {
        mean1: 25,
        stdDev1: 5,
        mean2: 75,
        stdDev2: 5,
        ratio: 0.5,
        min: 1,
        max: 100
      };
      
      const data = generateBimodalDistribution(size, options);
      
      // Generate histogram for distribution shape analysis
      const buckets = 20;
      const histogram = measureDistribution(data, buckets);
      
      // Find local maxima
      let maxima = [];
      for (let i = 1; i < buckets - 1; i++) {
        if (histogram[i] > histogram[i-1] && histogram[i] > histogram[i+1]) {
          maxima.push(i);
        }
      }
      
      // Should have two peaks
      expect(maxima.length).toBeGreaterThanOrEqual(2);
      
      // If exactly two peaks, they should be separated
      if (maxima.length === 2) {
        expect(Math.abs(maxima[0] - maxima[1])).toBeGreaterThan(buckets / 4);
      }
    });
    
    test('generateStatisticalDataset should honor statistical parameters', () => {
      const size = 1000;
      const mean = 50;
      const stdDev = 15;
      const data = generateStatisticalDataset(size, { mean, stdDev, min: 1, max: 100 });
      
      // Calculate stats
      const stats = calculateStats(data);
      
      // Mean should be close to specified
      expect(stats.mean).toBeGreaterThan(mean - 5);
      expect(stats.mean).toBeLessThan(mean + 5);
      
      // Standard deviation should be close to specified
      expect(stats.stdDev).toBeGreaterThan(stdDev * 0.7);
      expect(stats.stdDev).toBeLessThan(stdDev * 1.3);
    });
  });
  
  // Adversarial case generation
  describe('Adversarial Case Generation', () => {
    test('generateQuicksortAdversarial should create difficult cases for quicksort', () => {
      const pivotStrategies = ['first', 'last', 'middle', 'median-of-three'];
      
      pivotStrategies.forEach(strategy => {
        const data = generateQuicksortAdversarial(100, 1, 100, { pivotStrategy: strategy });
        
        // Data should be valid
        expect(data.length).toBe(100);
        
        // For 'first' and 'last' strategies, check specific patterns
        if (strategy === 'first') {
          // Worst case for first-element pivot is already sorted
          expect(checkSorted(data)).toBe(true);
        } else if (strategy === 'last') {
          // Worst case for last-element pivot is reversed
          expect(checkReversed(data)).toBe(true);
        }
      });
    });
    
    test('generateAdversarialCase should create appropriate cases for each algorithm', () => {
      const algorithms = ['quicksort', 'mergesort', 'insertionsort', 'heapsort'];
      
      algorithms.forEach(algorithm => {
        const data = generateAdversarialCase(algorithm, 100, { min: 1, max: 100 });
        
        // Data should be valid
        expect(data.length).toBe(100);
        
        // Specific checks for algorithms with known adversarial patterns
        if (algorithm === 'insertionsort') {
          // Worst case for insertion sort is reversed
          expect(checkReversed(data)).toBe(true);
        }
      });
    });
  });
  
  // Special-purpose generation functions
  describe('Special-Purpose Generation Functions', () => {
    test('generateObjectsForStabilityTest should create objects with duplicate keys', () => {
      const size = 100;
      const keyRange = 10;
      const data = generateObjectsForStabilityTest(size, { keyRange });
      
      // Check all objects have required properties
      data.forEach(obj => {
        expect(obj).toHaveProperty('key');
        expect(obj).toHaveProperty('originalIndex');
        expect(obj).toHaveProperty('value');
      });
      
      // Count unique keys
      const uniqueKeys = new Set(data.map(obj => obj.key)).size;
      
      // Should have fewer unique keys than objects
      expect(uniqueKeys).toBeLessThanOrEqual(keyRange);
      expect(uniqueKeys).toBeLessThan(size);
      
      // Original indices should be sequential
      const indices = data.map(obj => obj.originalIndex);
      expect(indices).toEqual([...Array(size).keys()]);
    });
    
    test('generateDutchFlagData should create small set of values for partitioning', () => {
      const size = 100;
      const numValues = 3;
      const data = generateDutchFlagData(size, numValues);
      
      // Check array size
      expect(data.length).toBe(size);
      
      // Count unique values
      const uniqueValues = new Set(data).size;
      
      // Should have exactly the specified number of unique values
      expect(uniqueValues).toBe(numValues);
      
      // All values should be within expected range
      data.forEach(val => {
        expect(val).toBeGreaterThanOrEqual(0);
        expect(val).toBeLessThan(numValues);
      });
    });
    
    test('generateTopKData should include identifiable top-K elements', () => {
      const size = 100;
      const k = 10;
      const { data, topK } = generateTopKData(size, k, { min: 1, max: 100 });
      
      // Check sizes
      expect(data.length).toBe(size);
      expect(topK.length).toBe(k);
      
      // topK should contain the k largest elements
      const sorted = [...data].sort((a, b) => b - a);
      const actualTopK = sorted.slice(0, k);
      
      // Should have the same elements (possibly in different order)
      expect(new Set(topK)).toEqual(new Set(actualTopK));
    });
    
    test('generateKSortedArrays should create multiple sorted arrays', () => {
      const k = 5;
      const avgSize = 20;
      const arrays = generateKSortedArrays(k, avgSize, { min: 1, max: 100 });
      
      // Should create k arrays
      expect(arrays.length).toBe(k);
      
      // Each array should be sorted
      arrays.forEach(arr => {
        expect(checkSorted(arr)).toBe(true);
      });
      
      // Sizes should be around the average
      const totalSize = arrays.reduce((sum, arr) => sum + arr.length, 0);
      const actualAvgSize = totalSize / k;
      
      expect(actualAvgSize).toBeGreaterThan(avgSize * 0.5);
      expect(actualAvgSize).toBeLessThan(avgSize * 1.5);
    });
  });
  
  // Utility functions
  describe('Utility Functions', () => {
    test('isSorted should correctly identify sorted arrays', () => {
      // Sorted arrays
      expect(isSorted([])).toBe(true);
      expect(isSorted([1])).toBe(true);
      expect(isSorted([1, 2, 3, 4, 5])).toBe(true);
      expect(isSorted([1, 1, 2, 3, 3])).toBe(true);
      
      // Unsorted arrays
      expect(isSorted([5, 4, 3, 2, 1])).toBe(false);
      expect(isSorted([1, 3, 2, 4, 5])).toBe(false);
    });
    
    test('isSorted should work with custom comparator', () => {
      const descComparator = (a, b) => b - a;
      
      // Descending arrays (sorted with descComparator)
      expect(isSorted([5, 4, 3, 2, 1], descComparator)).toBe(true);
      
      // Ascending arrays (unsorted with descComparator)
      expect(isSorted([1, 2, 3, 4, 5], descComparator)).toBe(false);
    });
    
    test('generateCustomDistribution should combine multiple distributions', () => {
      const size = 1000;
      const distributions = [
        { type: 'gaussian', ratio: 0.5, params: { mean: 25, stdDev: 5 } },
        { type: 'gaussian', ratio: 0.5, params: { mean: 75, stdDev: 5 } }
      ];
      
      const data = generateCustomDistribution(size, distributions, 1, 100);
      
      // Check size
      expect(data.length).toBe(size);
      
      // Generate histogram
      const buckets = 20;
      const histogram = measureDistribution(data, buckets);
      
      // Should have peaks corresponding to the distribution means
      const firstPeakBucket = Math.floor((25 - 1) / (100 - 1) * buckets);
      const secondPeakBucket = Math.floor((75 - 1) / (100 - 1) * buckets);
      
      // Check for peaks near expected locations
      const firstPeakArea = histogram.slice(Math.max(0, firstPeakBucket - 1), 
                                           Math.min(buckets, firstPeakBucket + 2));
      const secondPeakArea = histogram.slice(Math.max(0, secondPeakBucket - 1), 
                                            Math.min(buckets, secondPeakBucket + 2));
      
      const firstPeakMax = Math.max(...firstPeakArea);
      const secondPeakMax = Math.max(...secondPeakArea);
      
      // Both peak areas should have significantly more elements than average
      const avgCount = size / buckets;
      expect(firstPeakMax).toBeGreaterThan(avgCount * 1.2);
      expect(secondPeakMax).toBeGreaterThan(avgCount * 1.2);
    });
  });
});
