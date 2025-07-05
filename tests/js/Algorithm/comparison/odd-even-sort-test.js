// tests/js/algorithms/comparison/odd_even.test.js

import OddEvenSort from '../../../../src/algorithms/comparison/odd-even';
import { generateDataSet } from '../../../../src/data/generators';
import Algorithm from '../../../../src/algorithms/core/algorithm-base';

/**
 * Comprehensive test suite for OddEvenSort algorithm
 * 
 * Odd-Even Sort (also known as Brick Sort) is a variant of Bubble Sort.
 * The algorithm:
 * 1. First compares and swaps all odd-indexed pairs (1,2), (3,4), ...
 * 2. Then compares and swaps all even-indexed pairs (0,1), (2,3), ...
 * 3. Repeats until the array is sorted
 * 
 * These tests validate:
 * 1. Correctness across various input distributions
 * 2. Proper phase alternation between odd and even indices
 * 3. Stability properties
 * 4. Performance characteristics and metrics
 * 5. Parallelizability implications
 */
describe('OddEvenSort Algorithm', () => {
  let oddEvenSort;
  
  beforeEach(() => {
    // Create a fresh instance before each test
    oddEvenSort = new OddEvenSort();
  });
  
  describe('Basic Functionality', () => {
    test('should inherit from base Algorithm class', () => {
      expect(oddEvenSort).toBeInstanceOf(Algorithm);
    });
    
    test('should have correct algorithm metadata', () => {
      expect(oddEvenSort.name).toBe('Odd-Even Sort');
      expect(oddEvenSort.category).toBe('comparison');
    });
    
    test('should correctly sort an empty array', () => {
      const array = [];
      const sorted = oddEvenSort.execute(array);
      expect(sorted).toEqual([]);
      expect(sorted).not.toBe(array); // Should be a new array reference
    });
    
    test('should correctly sort a single-element array', () => {
      const array = [42];
      const sorted = oddEvenSort.execute(array);
      expect(sorted).toEqual([42]);
    });
    
    test('should correctly sort a two-element array in wrong order', () => {
      const array = [5, 3];
      const sorted = oddEvenSort.execute(array);
      expect(sorted).toEqual([3, 5]);
    });
  });
  
  describe('Correctness with Standard Test Cases', () => {
    test('should correctly sort an already sorted array', () => {
      const array = [1, 2, 3, 4, 5, 6, 7, 8];
      const sorted = oddEvenSort.execute(array);
      expect(sorted).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    });
    
    test('should correctly sort a reversed array', () => {
      const array = [8, 7, 6, 5, 4, 3, 2, 1];
      const sorted = oddEvenSort.execute(array);
      expect(sorted).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    });
    
    test('should correctly sort an array with duplicate elements', () => {
      const array = [3, 1, 4, 1, 5, 9, 2, 6, 5, 3, 5];
      const sorted = oddEvenSort.execute(array);
      expect(sorted).toEqual([1, 1, 2, 3, 3, 4, 5, 5, 5, 6, 9]);
    });
    
    test('should correctly sort an array with all identical elements', () => {
      const array = [7, 7, 7, 7, 7, 7, 7];
      const sorted = oddEvenSort.execute(array);
      expect(sorted).toEqual([7, 7, 7, 7, 7, 7, 7]);
    });
    
    test('should correctly sort an array with negative numbers', () => {
      const array = [5, -3, 0, 8, -4, 2, -1, 7, -6];
      const sorted = oddEvenSort.execute(array);
      expect(sorted).toEqual([-6, -4, -3, -1, 0, 2, 5, 7, 8]);
    });
    
    test('should correctly sort an array with floating point numbers', () => {
      const array = [5.7, 3.2, 8.1, 4.5, 2.9, 1.3, 7.8, 6.4];
      const sorted = oddEvenSort.execute(array);
      expect(sorted).toEqual([1.3, 2.9, 3.2, 4.5, 5.7, 6.4, 7.8, 8.1]);
    });
  });
  
  describe('Special Cases for Array Length', () => {
    test('should correctly sort arrays of even length', () => {
      const array = [6, 4, 8, 2, 10, 12];
      const sorted = oddEvenSort.execute(array);
      expect(sorted).toEqual([2, 4, 6, 8, 10, 12]);
    });
    
    test('should correctly sort arrays of odd length', () => {
      const array = [7, 3, 5, 1, 9];
      const sorted = oddEvenSort.execute(array);
      expect(sorted).toEqual([1, 3, 5, 7, 9]);
    });
    
    test('should correctly handle edge case length of 2', () => {
      const array = [2, 1];
      const sorted = oddEvenSort.execute(array);
      expect(sorted).toEqual([1, 2]);
    });
    
    test('should correctly handle edge case length of 3', () => {
      const array = [3, 1, 2];
      const sorted = oddEvenSort.execute(array);
      expect(sorted).toEqual([1, 2, 3]);
    });
  });
  
  describe('Phase Alternation', () => {
    test('should correctly alternate between odd and even phases', () => {
      // We'll track the pairs being compared to ensure proper alternation
      const comparedPairs = [];
      
      // Spy on the compare method to track indices
      const originalCompare = oddEvenSort.compare;
      oddEvenSort.compare = function(a, b, indices) {
        if (indices) {
          comparedPairs.push([indices.left, indices.right]);
        }
        return originalCompare.call(this, a, b);
      };
      
      // Use a deliberately unordered array to ensure multiple phases
      const array = [5, 3, 8, 4, 2, 1, 7, 6];
      oddEvenSort.execute(array);
      
      // Check for proper odd/even alternation in the first few comparisons
      // Odd phase: pairs with first index being odd (1,2), (3,4), etc.
      // Even phase: pairs with first index being even (0,1), (2,3), etc.
      let currentPhase = null;
      let previousIndex = null;
      
      // Extract the first N pairs where phase changes are likely to occur
      const pairsToAnalyze = comparedPairs.slice(0, 20); 
      
      for (const [left, right] of pairsToAnalyze) {
        // If this is the start of a new phase
        if (previousIndex !== null && left <= previousIndex) {
          // Phase should alternate between odd and even
          if (currentPhase === 'odd') {
            currentPhase = 'even';
            expect(left % 2).toBe(0); // Even phase starts with even index
          } else if (currentPhase === 'even') {
            currentPhase = 'odd';
            expect(left % 2).toBe(1); // Odd phase starts with odd index
          }
        } else if (currentPhase === null) {
          // Determine the initial phase based on first comparison
          currentPhase = left % 2 === 1 ? 'odd' : 'even';
        }
        
        previousIndex = left;
      }
      
      // Restore the original method
      oddEvenSort.compare = originalCompare;
      
      // We should have detected at least one phase change
      expect(comparedPairs.length).toBeGreaterThan(0);
    });
    
    test('should call performPhase with correct parity parameter', () => {
      // Create a spy on the performPhase method
      const performPhaseSpy = jest.spyOn(oddEvenSort, 'performPhase');
      
      const array = [5, 3, 8, 4, 2, 1, 7, 6];
      oddEvenSort.execute(array);
      
      // Extract the parity parameters from all calls
      const parityParameters = performPhaseSpy.mock.calls.map(call => call[1]);
      
      // Should have at least one odd and one even phase
      expect(parityParameters).toContain(0); // Even phase
      expect(parityParameters).toContain(1); // Odd phase
      
      // Should alternate between odd and even
      for (let i = 1; i < parityParameters.length; i++) {
        expect(parityParameters[i]).not.toBe(parityParameters[i-1]);
      }
      
      // Restore the original method
      performPhaseSpy.mockRestore();
    });
  });
  
  describe('Optimization Features', () => {
    test('should perform early termination when sorted', () => {
      // Configure OddEvenSort with early termination enabled
      const optimizedOddEvenSort = new OddEvenSort({ earlyTermination: true });
      
      // Create an already sorted array
      const array = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      
      // Spy on the phase execution
      const performPhaseSpy = jest.spyOn(optimizedOddEvenSort, 'performPhase');
      
      optimizedOddEvenSort.execute(array);
      
      // Verify that early termination occurred
      // For an already sorted array, it should only need one complete pass
      // (one odd phase and one even phase) to determine it's sorted
      expect(performPhaseSpy.mock.calls.length).toBeLessThanOrEqual(3);
      
      // Restore the original method
      performPhaseSpy.mockRestore();
    });
    
    test('should provide configuration for parallel execution', () => {
      // Create OddEvenSort with parallel configuration
      const parallelOddEvenSort = new OddEvenSort({ 
        parallelExecution: true,
        threadCount: 4
      });
      
      // Check if the configuration was saved properly
      expect(parallelOddEvenSort.options.parallelExecution).toBe(true);
      expect(parallelOddEvenSort.options.threadCount).toBe(4);
      
      // Note: Actual parallel execution would be tested in a different way,
      // potentially using workers or a parallel execution simulation
    });
  });
  
  describe('Performance Characteristics', () => {
    test('should have quadratic time complexity for random arrays', () => {
      // Use smaller arrays since Odd-Even Sort is O(n²)
      const smallArray = generateDataSet('random', 50, { min: 1, max: 100 });
      const mediumArray = generateDataSet('random', 100, { min: 1, max: 100 });
      
      // Execute and measure comparisons
      oddEvenSort.execute(smallArray);
      const smallComparisons = oddEvenSort.metrics.comparisons;
      oddEvenSort.reset();
      
      oddEvenSort.execute(mediumArray);
      const mediumComparisons = oddEvenSort.metrics.comparisons;
      
      // For quadratic complexity, doubling the input size should
      // increase comparisons by approximately 4x
      // Allow some wiggle room with a factor of 0.5 to 2
      const ratio = mediumComparisons / smallComparisons;
      const expectedRatio = (mediumArray.length / smallArray.length) ** 2;
      
      expect(ratio).toBeGreaterThan(expectedRatio * 0.5);
      expect(ratio).toBeLessThan(expectedRatio * 2);
    });
    
    test('should have linear time complexity for already sorted arrays with early termination', () => {
      // Configure OddEvenSort with early termination
      const optimizedOddEvenSort = new OddEvenSort({ earlyTermination: true });
      
      // Create already sorted arrays of different sizes
      const smallArray = generateDataSet('sorted', 100, { min: 1, max: 100 });
      const largeArray = generateDataSet('sorted', 1000, { min: 1, max: 1000 });
      
      // Execute and measure comparisons
      optimizedOddEvenSort.execute(smallArray);
      const smallComparisons = optimizedOddEvenSort.metrics.comparisons;
      optimizedOddEvenSort.reset();
      
      optimizedOddEvenSort.execute(largeArray);
      const largeComparisons = optimizedOddEvenSort.metrics.comparisons;
      
      // For already sorted arrays with early termination, should be O(n)
      // So 10x the size should result in approximately 10x the comparisons
      const ratio = largeComparisons / smallComparisons;
      const expectedRatio = largeArray.length / smallArray.length;
      
      // Allow some overhead, but should be roughly linear
      expect(ratio).toBeLessThan(expectedRatio * 2);
    });
    
    test('should record correct metrics during execution', () => {
      const array = [5, 3, 8, 4, 2, 1, 7, 6];
      oddEvenSort.execute(array);
      
      // Verify metrics are recorded
      expect(oddEvenSort.metrics.comparisons).toBeGreaterThan(0);
      expect(oddEvenSort.metrics.swaps).toBeGreaterThanOrEqual(0);
      expect(oddEvenSort.metrics.reads).toBeGreaterThan(0);
      expect(oddEvenSort.metrics.writes).toBeGreaterThan(0);
      expect(oddEvenSort.metrics.executionTime).toBeGreaterThan(0);
      
      // For an array of length n, the number of comparisons should be
      // on the order of n²
      const n = array.length;
      expect(oddEvenSort.metrics.comparisons).toBeLessThan(n * n * 2);
    });
    
    test('should have expected complexity characteristics', () => {
      const complexity = oddEvenSort.getComplexity();
      
      // Odd-Even Sort is O(n²) like Bubble Sort
      expect(complexity.time.best).toBe('O(n)');
      expect(complexity.time.average).toBe('O(n²)');
      expect(complexity.time.worst).toBe('O(n²)');
      
      // Space complexity should be O(1) as it's in-place
      expect(complexity.space.worst).toBe('O(1)');
    });
  });
  
  describe('Stability and In-Place Properties', () => {
    test('should be stable for equal elements', () => {
      // Create objects with same key but different values to test stability
      const obj1 = { key: 3, value: 'first' };
      const obj2 = { key: 1, value: 'second' };
      const obj3 = { key: 3, value: 'third' };
      const obj4 = { key: 2, value: 'fourth' };
      
      const array = [obj1, obj2, obj3, obj4];
      
      // Custom comparator that only compares the 'key' property
      const comparator = (a, b) => a.key - b.key;
      
      const sorted = oddEvenSort.execute(array, { comparator });
      
      // Check if the array is sorted by key
      expect(sorted[0].key).toBe(1);
      expect(sorted[1].key).toBe(2);
      expect(sorted[2].key).toBe(3);
      expect(sorted[3].key).toBe(3);
      
      // Check if stability is maintained (original order of equal keys)
      expect(sorted[2].value).toBe('first');
      expect(sorted[3].value).toBe('third');
    });
    
    test('should correctly report stability property', () => {
      expect(oddEvenSort.isStable()).toBe(true);
    });
    
    test('should correctly report in-place property', () => {
      expect(oddEvenSort.isInPlace()).toBe(true);
    });
    
    test('should be parallelizable', () => {
      const info = oddEvenSort.getInfo();
      expect(info.properties.parallelizable).toBe(true);
    });
  });
  
  describe('Algorithm Information', () => {
    test('should provide comprehensive algorithm information', () => {
      const info = oddEvenSort.getInfo();
      
      // Basic info
      expect(info.name).toBe('Odd-Even Sort');
      expect(info.category).toBe('comparison');
      
      // Properties
      expect(info.properties).toBeDefined();
      expect(info.properties.stable).toBe(true);
      expect(info.properties.inPlace).toBe(true);
      expect(info.properties.parallelizable).toBe(true);
      
      // Advantages and disadvantages
      expect(info.advantages).toBeDefined();
      expect(info.advantages.length).toBeGreaterThan(0);
      expect(info.disadvantages).toBeDefined();
      expect(info.disadvantages.length).toBeGreaterThan(0);
      
      // Relationship to other algorithms
      expect(info.related).toBeDefined();
      expect(info.related.length).toBeGreaterThan(0);
      // Should mention its relationship to bubble sort or other similar algorithms
      expect(info.related.some(r => r.toLowerCase().includes('bubble'))).toBe(true);
    });
  });
  
  describe('Advanced Features', () => {
    test('should handle custom comparators', () => {
      const array = [
        { value: 5 },
        { value: 3 },
        { value: 8 },
        { value: 1 },
        { value: 6 }
      ];
      
      const comparator = (a, b) => a.value - b.value;
      
      const sorted = oddEvenSort.execute(array, { comparator });
      
      // Check if the result is sorted by the 'value' property
      for (let i = 1; i < sorted.length; i++) {
        expect(sorted[i].value).toBeGreaterThanOrEqual(sorted[i - 1].value);
      }
    });
    
    test('should record state history for visualization', () => {
      const array = [5, 3, 8, 4, 2, 1, 7, 6];
      
      // Configure to record history
      const options = { recordHistory: true };
      oddEvenSort.execute(array, options);
      
      // Should have recorded states
      expect(oddEvenSort.history.length).toBeGreaterThan(0);
      
      // Each state should include array and metrics
      const firstState = oddEvenSort.history[0];
      expect(firstState.array).toBeDefined();
      expect(firstState.metrics).toBeDefined();
      expect(firstState.timestamp).toBeDefined();
      
      // Last state should be the sorted array
      const lastState = oddEvenSort.history[oddEvenSort.history.length - 1];
      expect(lastState.array).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    });
  });
  
  describe('Error Handling', () => {
    test('should handle non-array inputs gracefully', () => {
      expect(() => oddEvenSort.execute(null)).toThrow();
      expect(() => oddEvenSort.execute(undefined)).toThrow();
      expect(() => oddEvenSort.execute('not an array')).toThrow();
      expect(() => oddEvenSort.execute(123)).toThrow();
    });
    
    test('should handle arrays with non-comparable elements by using default comparator', () => {
      // Mixed types array
      const array = [3, '5', 1, '2', 4];
      
      // Default comparator will use string comparison
      const sorted = oddEvenSort.execute(array);
      
      // Check the result is ordered in some consistent way
      for (let i = 1; i < sorted.length; i++) {
        const a = String(sorted[i-1]);
        const b = String(sorted[i]);
        expect(a <= b).toBe(true);
      }
    });
  });
  
  describe('Special Cases and Edge Behaviors', () => {
    test('should handle arrays with challenging patterns', () => {
      // Create an array with alternating high/low values
      // This pattern can be challenging for some sorting algorithms
      const array = [10, 1, 9, 2, 8, 3, 7, 4, 6, 5];
      const sorted = oddEvenSort.execute(array);
      expect(sorted).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    });
    
    test('should work correctly with repeated executions on different arrays', () => {
      // First execution
      const array1 = [5, 3, 8, 4];
      const sorted1 = oddEvenSort.execute(array1);
      expect(sorted1).toEqual([3, 4, 5, 8]);
      
      // Second execution with a different array
      const array2 = [9, 1, 7, 2];
      const sorted2 = oddEvenSort.execute(array2);
      expect(sorted2).toEqual([1, 2, 7, 9]);
    });
  });
});
