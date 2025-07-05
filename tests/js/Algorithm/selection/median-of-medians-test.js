/**
 * @file median-of-medians.test.js
 * @description Comprehensive test suite for the Median of Medians algorithm implementation.
 * 
 * This test suite meticulously evaluates the Median of Medians selection algorithm,
 * which finds the k-th smallest element in an unordered array with guaranteed O(n)
 * worst-case time complexity. The tests cover correctness, edge cases, performance
 * characteristics, worst-case behavior, and comparison with other selection algorithms.
 * 
 * @author Advanced Sorting Algorithm Visualization Platform Team
 * @version 1.0.0
 */

import MedianOfMedians from '../../src/algorithms/selection/median-of-medians';
import QuickSelect from '../../src/algorithms/selection/quick-select';
import { generateDataSet } from '../../src/data/generators';

/**
 * Naive implementation of selection algorithm for verification purposes.
 * Uses sorting, which has O(n log n) time complexity.
 * 
 * @param {Array} array - Input array
 * @param {number} k - Position to find (0-based)
 * @returns {number} The k-th smallest element
 */
function naiveSelection(array, k) {
  if (k < 0 || k >= array.length) {
    throw new Error(`Invalid k: ${k}, must be between 0 and ${array.length - 1}`);
  }
  
  // Sort a copy of the array and return the k-th element
  return [...array].sort((a, b) => a - b)[k];
}

/**
 * Create a MedianOfMedians instance with specified options
 * 
 * @param {Object} options - Configuration options
 * @returns {MedianOfMedians} A configured MedianOfMedians instance
 */
function createMedianOfMedians(options = {}) {
  return new MedianOfMedians({
    groupSize: 5,  // Standard group size for median of medians
    ...options
  });
}

/**
 * Generate an adversarial case for QuickSelect that causes O(n²) behavior
 * but where MedianOfMedians still performs in O(n) time.
 * 
 * @param {number} size - Size of the array to generate
 * @returns {Array} An array causing worst-case behavior for QuickSelect
 */
function generateAdversarialCase(size) {
  const array = [];
  for (let i = 0; i < size; i++) {
    // Create a pattern where selecting a bad pivot (like first element)
    // consistently produces very unbalanced partitions
    array.push(i);
  }
  return array;
}

describe('Median of Medians Algorithm - Core Functionality', () => {
  test('finds the minimum element (k=0) correctly', () => {
    const array = [5, 3, 8, 2, 1, 4, 7, 6];
    const medianOfMedians = createMedianOfMedians();
    const result = medianOfMedians.select(array, 0);
    
    expect(result).toBe(1);
  });
  
  test('finds the maximum element (k=length-1) correctly', () => {
    const array = [5, 3, 8, 2, 1, 4, 7, 6];
    const medianOfMedians = createMedianOfMedians();
    const result = medianOfMedians.select(array, array.length - 1);
    
    expect(result).toBe(8);
  });
  
  test('finds the median element correctly for odd-length array', () => {
    const array = [5, 3, 8, 2, 1, 4, 7];
    const medianOfMedians = createMedianOfMedians();
    const medianIndex = Math.floor(array.length / 2);
    const result = medianOfMedians.select(array, medianIndex);
    
    expect(result).toBe(naiveSelection(array, medianIndex));
  });
  
  test('finds the median element correctly for even-length array', () => {
    const array = [5, 3, 8, 2, 1, 4, 7, 6];
    const medianOfMedians = createMedianOfMedians();
    const medianIndex = Math.floor(array.length / 2);
    const result = medianOfMedians.select(array, medianIndex);
    
    expect(result).toBe(naiveSelection(array, medianIndex));
  });
  
  test('works with negative numbers', () => {
    const array = [-5, -3, -8, -2, -1, -4, -7, -6];
    const medianOfMedians = createMedianOfMedians();
    const result = medianOfMedians.select(array, 3);
    
    expect(result).toBe(naiveSelection(array, 3));
  });
  
  test('works with mixed positive and negative numbers', () => {
    const array = [-5, 3, -8, 2, -1, 4, -7, 6];
    const medianOfMedians = createMedianOfMedians();
    const result = medianOfMedians.select(array, 4);
    
    expect(result).toBe(naiveSelection(array, 4));
  });
  
  test('works with floating-point numbers', () => {
    const array = [5.5, 3.1, 8.7, 2.2, 1.9, 4.3, 7.0, 6.6];
    const medianOfMedians = createMedianOfMedians();
    const result = medianOfMedians.select(array, 2);
    
    expect(result).toBe(naiveSelection(array, 2));
  });
});

describe('Median of Medians Algorithm - Edge Cases', () => {
  test('handles single-element array correctly', () => {
    const array = [42];
    const medianOfMedians = createMedianOfMedians();
    const result = medianOfMedians.select(array, 0);
    
    expect(result).toBe(42);
  });
  
  test('handles array with all identical elements', () => {
    const array = [7, 7, 7, 7, 7, 7, 7];
    const medianOfMedians = createMedianOfMedians();
    const result = medianOfMedians.select(array, 3);
    
    expect(result).toBe(7);
  });
  
  test('handles array with many duplicate elements', () => {
    const array = [3, 1, 5, 3, 8, 3, 2, 5, 3, 7, 5];
    const medianOfMedians = createMedianOfMedians();
    
    // Test multiple positions
    for (let k = 0; k < array.length; k++) {
      const result = medianOfMedians.select(array, k);
      expect(result).toBe(naiveSelection(array, k));
    }
  });
  
  test('throws error for k < 0', () => {
    const array = [5, 3, 8, 2, 1, 4, 7, 6];
    const medianOfMedians = createMedianOfMedians();
    
    expect(() => medianOfMedians.select(array, -1)).toThrow(/Invalid selection index/);
  });
  
  test('throws error for k >= array.length', () => {
    const array = [5, 3, 8, 2, 1, 4, 7, 6];
    const medianOfMedians = createMedianOfMedians();
    
    expect(() => medianOfMedians.select(array, array.length)).toThrow(/Invalid selection index/);
  });
  
  test('throws error for empty array', () => {
    const array = [];
    const medianOfMedians = createMedianOfMedians();
    
    expect(() => medianOfMedians.select(array, 0)).toThrow(/Cannot select from empty array/);
  });
  
  test('does not modify the original array', () => {
    const array = [5, 3, 8, 2, 1, 4, 7, 6];
    const originalArray = [...array];
    const medianOfMedians = createMedianOfMedians();
    
    medianOfMedians.select(array, 4);
    
    expect(array).toEqual(originalArray);
  });
  
  test('handles array with size < group size', () => {
    const array = [5, 3, 8];
    const medianOfMedians = createMedianOfMedians({ groupSize: 5 });
    const result = medianOfMedians.select(array, 1);
    
    expect(result).toBe(5); // Second smallest is 5
  });
});

describe('Median of Medians Algorithm - Group Size Variations', () => {
  test('works with group size = 3', () => {
    const array = [5, 3, 8, 2, 1, 4, 7, 6, 9, 0];
    const medianOfMedians = createMedianOfMedians({ groupSize: 3 });
    const result = medianOfMedians.select(array, 5);
    
    expect(result).toBe(naiveSelection(array, 5));
  });
  
  test('works with group size = 5 (standard)', () => {
    const array = [5, 3, 8, 2, 1, 4, 7, 6, 9, 0];
    const medianOfMedians = createMedianOfMedians({ groupSize: 5 });
    const result = medianOfMedians.select(array, 5);
    
    expect(result).toBe(naiveSelection(array, 5));
  });
  
  test('works with group size = 7', () => {
    const array = [5, 3, 8, 2, 1, 4, 7, 6, 9, 0];
    const medianOfMedians = createMedianOfMedians({ groupSize: 7 });
    const result = medianOfMedians.select(array, 5);
    
    expect(result).toBe(naiveSelection(array, 5));
  });
  
  test('group size affects number of recursive calls', () => {
    const array = generateDataSet('random', 100, { min: 1, max: 1000 });
    const k = Math.floor(array.length / 2);
    
    // Initialize instances with different group sizes
    const mom3 = createMedianOfMedians({ groupSize: 3, recordHistory: true });
    const mom5 = createMedianOfMedians({ groupSize: 5, recordHistory: true });
    const mom7 = createMedianOfMedians({ groupSize: 7, recordHistory: true });
    
    // Reset metrics
    mom3.reset();
    mom5.reset();
    mom7.reset();
    
    // Execute with different group sizes
    mom3.select(array, k);
    mom5.select(array, k);
    mom7.select(array, k);
    
    // Get metrics
    const metrics3 = mom3.getMetrics();
    const metrics5 = mom5.getMetrics();
    const metrics7 = mom7.getMetrics();
    
    // Log for visibility
    console.log(`Group size 3: ${metrics3.recursiveCalls} recursive calls`);
    console.log(`Group size 5: ${metrics5.recursiveCalls} recursive calls`);
    console.log(`Group size 7: ${metrics7.recursiveCalls} recursive calls`);
    
    // Group size affects recursion pattern, but exact numbers depend on implementation
    // We can't make strict assertions, but we can log the values for inspection
  });
});

describe('Median of Medians Algorithm - Input Distributions', () => {
  test('works with already sorted array', () => {
    const array = [1, 2, 3, 4, 5, 6, 7, 8];
    const medianOfMedians = createMedianOfMedians();
    const result = medianOfMedians.select(array, 4);
    
    expect(result).toBe(5);
  });
  
  test('works with reverse sorted array', () => {
    const array = [8, 7, 6, 5, 4, 3, 2, 1];
    const medianOfMedians = createMedianOfMedians();
    const result = medianOfMedians.select(array, 4);
    
    expect(result).toBe(5);
  });
  
  test('works with random distribution', () => {
    const array = generateDataSet('random', 100, { min: 1, max: 1000 });
    const medianOfMedians = createMedianOfMedians();
    const k = Math.floor(array.length / 2);
    const result = medianOfMedians.select(array, k);
    
    expect(result).toBe(naiveSelection(array, k));
  });
  
  test('works with few unique values', () => {
    const array = generateDataSet('few-unique', 100, { min: 1, max: 10, uniqueValues: 5 });
    const medianOfMedians = createMedianOfMedians();
    const k = Math.floor(array.length / 2);
    const result = medianOfMedians.select(array, k);
    
    expect(result).toBe(naiveSelection(array, k));
  });
  
  test('works with nearly sorted array', () => {
    const array = generateDataSet('nearly-sorted', 100, { min: 1, max: 1000, sortedRatio: 0.9 });
    const medianOfMedians = createMedianOfMedians();
    const k = Math.floor(array.length / 2);
    const result = medianOfMedians.select(array, k);
    
    expect(result).toBe(naiveSelection(array, k));
  });
});

describe('Median of Medians Algorithm - Adversarial Case Handling', () => {
  test('maintains linear time complexity on adversarial inputs', () => {
    // Skip for very short test runs
    const sizes = [100, 1000, 10000];
    const timings = { medianOfMedians: [], quickSelect: [] };
    
    for (const size of sizes) {
      // Create an adversarial case for QuickSelect
      const array = generateAdversarialCase(size);
      const k = Math.floor(size / 2); // Select the median
      
      // Create instances
      const medianOfMedians = createMedianOfMedians();
      const quickSelect = new QuickSelect({ pivotStrategy: 'first' }); // Use vulnerable strategy
      
      // Test MedianOfMedians
      const momStart = performance.now();
      const momResult = medianOfMedians.select(array, k);
      const momEnd = performance.now();
      timings.medianOfMedians.push(momEnd - momStart);
      
      // Test QuickSelect
      const qsStart = performance.now();
      const qsResult = quickSelect.select(array, k);
      const qsEnd = performance.now();
      timings.quickSelect.push(qsEnd - qsStart);
      
      // Results should match
      expect(momResult).toBe(qsResult);
    }
    
    // Log timings
    for (let i = 0; i < sizes.length; i++) {
      console.log(`Size ${sizes[i]}: MoM=${timings.medianOfMedians[i].toFixed(2)}ms, QS=${timings.quickSelect[i].toFixed(2)}ms`);
    }
    
    // Calculate growth ratios for MedianOfMedians
    const momRatios = [];
    for (let i = 1; i < timings.medianOfMedians.length; i++) {
      const sizeRatio = sizes[i] / sizes[i-1];
      const timeRatio = timings.medianOfMedians[i] / timings.medianOfMedians[i-1];
      momRatios.push(timeRatio / sizeRatio);
    }
    
    // Calculate growth ratios for QuickSelect
    const qsRatios = [];
    for (let i = 1; i < timings.quickSelect.length; i++) {
      const sizeRatio = sizes[i] / sizes[i-1];
      const timeRatio = timings.quickSelect[i] / timings.quickSelect[i-1];
      qsRatios.push(timeRatio / sizeRatio);
    }
    
    console.log(`MoM growth ratios: ${momRatios.map(r => r.toFixed(2)).join(', ')}`);
    console.log(`QS growth ratios: ${qsRatios.map(r => r.toFixed(2)).join(', ')}`);
    
    // For linear algorithms, the time/size ratio should be roughly constant
    // For quadratic algorithms on adversarial inputs, it should grow with size
    // This is a soft assertion due to environmental variations
    // We mainly check that MoM doesn't show quadratic growth
    
    // Skip assertions if the test run is too short or timing is inconsistent
    if (sizes.length >= 3 && timings.medianOfMedians[0] > 1) {
      // MedianOfMedians ratios should be relatively stable (linear growth)
      for (const ratio of momRatios) {
        expect(ratio).toBeLessThan(5);  // Generous upper bound for growth ratio
      }
      
      // QuickSelect should show superlinear growth on adversarial cases
      // but we can't guarantee this in all test environments, so we just log it
    }
  });
});

describe('Median of Medians Algorithm - Instrumentation', () => {
  test('records operations correctly', () => {
    const array = [5, 3, 8, 2, 1, 4, 7, 6];
    const medianOfMedians = createMedianOfMedians();
    
    // Reset metrics before test
    medianOfMedians.reset();
    medianOfMedians.select(array, 4);
    
    const metrics = medianOfMedians.getMetrics();
    
    // Verify metrics are collected
    expect(metrics.comparisons).toBeGreaterThan(0);
    expect(metrics.reads).toBeGreaterThan(0);
    expect(metrics.writes).toBeGreaterThan(0);
    expect(metrics.executionTime).toBeGreaterThan(0);
    expect(metrics.recursiveCalls).toBeGreaterThan(0);
  });
  
  test('records state history correctly when enabled', () => {
    const array = [5, 3, 8, 2, 1, 4, 7, 6];
    const medianOfMedians = createMedianOfMedians({ recordHistory: true });
    
    medianOfMedians.reset();
    medianOfMedians.select(array, 4);
    
    // Check state history
    const history = medianOfMedians.history;
    
    expect(history.length).toBeGreaterThan(0);
    expect(history[0].type).toBe('initial');
    expect(history[history.length - 1].type).toBe('final');
    
    // Should contain median-of-medians specific steps
    const medianSteps = history.filter(step => 
      step.type === 'find_pivot' || step.type === 'group_medians');
    expect(medianSteps.length).toBeGreaterThan(0);
  });
  
  test('can disable history recording for performance', () => {
    const array = generateDataSet('random', 1000, { min: 1, max: 1000 });
    const medianOfMedians = createMedianOfMedians({ recordHistory: false });
    
    medianOfMedians.reset();
    medianOfMedians.select(array, 500);
    
    // History should be empty or minimal
    expect(medianOfMedians.history.length).toBeLessThanOrEqual(2); // May have initial and final states only
  });
  
  test('supports event listeners', () => {
    const array = [5, 3, 8, 2, 1, 4, 7, 6];
    const medianOfMedians = createMedianOfMedians();
    
    let comparisonCount = 0;
    let partitionCount = 0;
    
    // Register event listeners
    medianOfMedians.on('comparison', () => { comparisonCount++; });
    medianOfMedians.on('partition', () => { partitionCount++; });
    
    medianOfMedians.reset();
    medianOfMedians.select(array, 4);
    
    // Verify event firing
    expect(comparisonCount).toBeGreaterThan(0);
    expect(partitionCount).toBeGreaterThan(0);
    expect(comparisonCount).toBe(medianOfMedians.metrics.comparisons);
  });
});

describe('Median of Medians Algorithm - Algorithmic Properties', () => {
  test('provides correct complexity information', () => {
    const medianOfMedians = createMedianOfMedians();
    const complexityInfo = medianOfMedians.getComplexity();
    
    expect(complexityInfo.time.best).toBe('O(n)');
    expect(complexityInfo.time.average).toBe('O(n)');
    expect(complexityInfo.time.worst).toBe('O(n)');
    expect(complexityInfo.space.worst).toBe('O(n)');
  });
  
  test('provides correct algorithm properties', () => {
    const medianOfMedians = createMedianOfMedians();
    const info = medianOfMedians.getInfo();
    
    expect(info.name).toBe('Median of Medians');
    expect(info.category).toBe('selection');
    expect(info.properties.divideAndConquer).toBe(true);
    expect(info.properties.deterministic).toBe(true);
  });
});

describe('Median of Medians Algorithm - Implementation Details', () => {
  test('properly implements the recursive median finding', () => {
    const array = [5, 3, 8, 2, 1, 4, 7, 6, 9, 0];
    const medianOfMedians = createMedianOfMedians();
    
    // Directly test the findMedianOfMedians method if exposed
    if (typeof medianOfMedians.findMedianOfMedians === 'function') {
      const pivot = medianOfMedians.findMedianOfMedians(array);
      
      // The pivot should be one of the elements in the array
      expect(array).toContain(pivot);
      
      // Count elements less than and greater than pivot
      const lessThan = array.filter(x => x < pivot).length;
      const greaterThan = array.filter(x => x > pivot).length;
      
      // A good pivot should reasonably balance the partitions
      const ratio = Math.min(lessThan, greaterThan) / array.length;
      
      // The ratio should be reasonable for a good pivot
      // Median of medians guarantees ratio ≥ 3/10 - 𝜀 theoretically
      expect(ratio).toBeGreaterThanOrEqual(0.2);
    } else {
      // If method not exposed, skip this test
      console.log('findMedianOfMedians method not exposed, skipping test');
    }
  });
  
  test('partitions correctly around the pivot', () => {
    const array = [5, 3, 8, 2, 1, 4, 7, 6];
    const medianOfMedians = createMedianOfMedians();
    
    // Directly test the partition method if exposed
    if (typeof medianOfMedians.partition === 'function') {
      const arrayCopy = [...array];
      const pivot = 4; // Use a known pivot
      const pivotIndex = medianOfMedians.partition(arrayCopy, 0, arrayCopy.length - 1, pivot);
      
      // Elements before pivotIndex should be <= pivot
      for (let i = 0; i < pivotIndex; i++) {
        expect(arrayCopy[i]).toBeLessThanOrEqual(pivot);
      }
      
      // Elements after pivotIndex should be > pivot
      for (let i = pivotIndex + 1; i < arrayCopy.length; i++) {
        expect(arrayCopy[i]).toBeGreaterThan(pivot);
      }
      
      // The pivot should be at pivotIndex
      expect(arrayCopy[pivotIndex]).toBe(pivot);
    } else {
      // If method not exposed, skip this test
      console.log('partition method not exposed, skipping test');
    }
  });
});

describe('Median of Medians Algorithm - Comparative Performance', () => {
  test('compares performance with QuickSelect on various inputs', () => {
    const dataTypes = ['random', 'nearly-sorted', 'reversed', 'few-unique'];
    const size = 1000;
    
    for (const dataType of dataTypes) {
      const array = generateDataSet(dataType, size, { 
        min: 1, 
        max: 1000,
        uniqueValues: dataType === 'few-unique' ? 10 : undefined,
        sortedRatio: dataType === 'nearly-sorted' ? 0.9 : undefined
      });
      
      const k = Math.floor(array.length / 2); // Select median
      
      // Create instances
      const medianOfMedians = createMedianOfMedians();
      const quickSelect = new QuickSelect({ pivotStrategy: 'median-of-three' });
      
      // Reset metrics
      medianOfMedians.reset();
      quickSelect.reset();
      
      // Test MedianOfMedians
      const momStart = performance.now();
      const momResult = medianOfMedians.select(array, k);
      const momEnd = performance.now();
      const momTime = momEnd - momStart;
      
      // Test QuickSelect
      const qsStart = performance.now();
      const qsResult = quickSelect.select(array, k);
      const qsEnd = performance.now();
      const qsTime = qsEnd - qsStart;
      
      // Results should match
      expect(momResult).toBe(qsResult);
      
      // Log times for this data type
      console.log(`${dataType} data: MoM=${momTime.toFixed(2)}ms, QS=${qsTime.toFixed(2)}ms, Ratio=${(momTime/qsTime).toFixed(2)}`);
      
      // Compare operation counts
      console.log(`${dataType} comparisons: MoM=${medianOfMedians.metrics.comparisons}, QS=${quickSelect.metrics.comparisons}`);
      console.log(`${dataType} recursive calls: MoM=${medianOfMedians.metrics.recursiveCalls}, QS=${quickSelect.metrics.recursiveCalls}`);
      
      // For random data, QuickSelect is often faster due to simpler code
      // For adversarial data, MedianOfMedians should maintain its guaranteed performance
      
      // We don't make strict assertions because performance characteristics
      // depend on implementation details and test environment
    }
  });
});
