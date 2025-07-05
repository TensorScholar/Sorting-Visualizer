// tests/js/algorithms/comparison/shell.test.js

import ShellSort from '../../../../src/algorithms/comparison/shell';
import { generateDataSet } from '../../../../src/data/generators';

/**
 * Comprehensive test suite for Shell Sort algorithm implementation.
 * 
 * Tests cover:
 * 1. Core algorithm correctness across various inputs
 * 2. Gap sequence behavior and optimizations
 * 3. Edge case handling
 * 4. Performance characteristics validation
 * 5. Algorithmic properties (stability, in-place, etc.)
 */
describe('ShellSort Algorithm', () => {
  // Default instance with standard configuration
  let shellSort;
  
  // Create a fresh instance before each test
  beforeEach(() => {
    shellSort = new ShellSort({
      gapSequence: 'knuth', // Knuth sequence: h = 3h + 1
    });
  });
  
  /**
   * Core functionality tests - verify sorting correctness
   */
  describe('Core Functionality', () => {
    test('sorts an empty array', () => {
      const array = [];
      const result = shellSort.execute(array);
      expect(result).toEqual([]);
      expect(result).not.toBe(array); // Should return a new array
    });
    
    test('sorts an array with a single element', () => {
      const array = [5];
      const result = shellSort.execute(array);
      expect(result).toEqual([5]);
    });
    
    test('sorts a small array in ascending order', () => {
      const array = [5, 3, 8, 4, 2, 9, 1, 7, 6];
      const expected = [1, 2, 3, 4, 5, 6, 7, 8, 9];
      const result = shellSort.execute(array);
      expect(result).toEqual(expected);
    });
    
    test('maintains input array integrity', () => {
      const array = [5, 3, 8, 4, 2];
      const original = [...array];
      shellSort.execute(array);
      expect(array).toEqual(original); // Input should not be modified
    });
    
    test('handles arrays with duplicate elements', () => {
      const array = [5, 3, 8, 4, 2, 5, 3, 8, 4, 2];
      const expected = [2, 2, 3, 3, 4, 4, 5, 5, 8, 8];
      const result = shellSort.execute(array);
      expect(result).toEqual(expected);
    });
    
    test('sorts array with negative numbers', () => {
      const array = [5, -3, 8, -4, 0, 2, -5, 1];
      const expected = [-5, -4, -3, 0, 1, 2, 5, 8];
      const result = shellSort.execute(array);
      expect(result).toEqual(expected);
    });
    
    test('sorts array with decimal values', () => {
      const array = [5.5, 3.3, 8.8, 4.4, 2.2];
      const expected = [2.2, 3.3, 4.4, 5.5, 8.8];
      const result = shellSort.execute(array);
      expect(result).toEqual(expected);
    });
    
    test('sorts custom objects with comparator', () => {
      const objects = [
        { id: 5, value: 'e' },
        { id: 3, value: 'c' },
        { id: 8, value: 'h' },
        { id: 1, value: 'a' }
      ];
      
      const comparator = (a, b) => a.id - b.id;
      
      const result = shellSort.execute(objects, { comparator });
      expect(result[0].id).toBe(1);
      expect(result[1].id).toBe(3);
      expect(result[2].id).toBe(5);
      expect(result[3].id).toBe(8);
    });
  });
  
  /**
   * Gap sequence behavior and optimizations
   */
  describe('Gap Sequence Behavior', () => {
    test('uses Knuth sequence by default', () => {
      // The Knuth sequence is 1, 4, 13, 40, 121, ...
      const generateSequenceSpy = jest.spyOn(shellSort, 'generateGapSequence');
      
      // Run with a large array to ensure multiple gap values
      const array = generateDataSet('random', 100);
      shellSort.execute(array);
      
      // Verify the sequence was generated with Knuth method
      expect(generateSequenceSpy).toHaveBeenCalledWith(expect.anything(), 'knuth');
      
      // Get the actual sequence that was generated
      const sequence = generateSequenceSpy.mock.results[0].value;
      
      // Verify it follows Knuth pattern (reverse order: h = 3h + 1)
      // The sequence in reverse should be 1, 4, 13, 40, ...
      let previousGap = sequence[sequence.length - 1];
      expect(previousGap).toBe(1); // Last gap should always be 1
      
      for (let i = sequence.length - 2; i >= 0; i--) {
        expect(sequence[i]).toBe(previousGap * 3 + 1);
        previousGap = sequence[i];
      }
      
      generateSequenceSpy.mockRestore();
    });
    
    test('supports Shell\'s original sequence', () => {
      // Create a Shell Sort with original sequence
      const originalShellSort = new ShellSort({ gapSequence: 'shell' });
      const generateSequenceSpy = jest.spyOn(originalShellSort, 'generateGapSequence');
      
      const array = generateDataSet('random', 100);
      originalShellSort.execute(array);
      
      // Verify the sequence was generated with Shell's method
      expect(generateSequenceSpy).toHaveBeenCalledWith(expect.anything(), 'shell');
      
      // Get the actual sequence that was generated
      const sequence = generateSequenceSpy.mock.results[0].value;
      
      // Shell's original sequence divides by 2: n/2, n/4, n/8, ..., 1
      let expectedGap = Math.floor(array.length / 2);
      for (let i = 0; i < sequence.length - 1; i++) {
        expect(sequence[i]).toBe(expectedGap);
        expectedGap = Math.floor(expectedGap / 2);
      }
      expect(sequence[sequence.length - 1]).toBe(1); // Last gap should always be 1
      
      generateSequenceSpy.mockRestore();
    });
    
    test('supports Sedgewick sequence', () => {
      // Create a Shell Sort with Sedgewick sequence
      const sedgewickShellSort = new ShellSort({ gapSequence: 'sedgewick' });
      const generateSequenceSpy = jest.spyOn(sedgewickShellSort, 'generateGapSequence');
      
      const array = generateDataSet('random', 1000);
      sedgewickShellSort.execute(array);
      
      // Verify the sequence was generated with Sedgewick's method
      expect(generateSequenceSpy).toHaveBeenCalledWith(expect.anything(), 'sedgewick');
      
      // Get the actual sequence that was generated
      const sequence = generateSequenceSpy.mock.results[0].value;
      
      // Sedgewick sequence starts with 1, 8, 23, 77, 281, ...
      // This sequence has a complex formula, so we'll just check a few known values
      const expectedStart = [1, 8, 23, 77, 281, 1073, 4193];
      for (let i = 0; i < Math.min(expectedStart.length, sequence.length); i++) {
        expect(sequence[sequence.length - i - 1]).toBe(expectedStart[i]);
      }
      
      generateSequenceSpy.mockRestore();
    });
    
    test('supports Ciura sequence', () => {
      // Create a Shell Sort with Ciura sequence
      const ciuraShellSort = new ShellSort({ gapSequence: 'ciura' });
      const generateSequenceSpy = jest.spyOn(ciuraShellSort, 'generateGapSequence');
      
      const array = generateDataSet('random', 1000);
      ciuraShellSort.execute(array);
      
      // Verify the sequence was generated with Ciura's method
      expect(generateSequenceSpy).toHaveBeenCalledWith(expect.anything(), 'ciura');
      
      // Get the actual sequence that was generated
      const sequence = generateSequenceSpy.mock.results[0].value;
      
      // Ciura sequence starts with 1, 4, 10, 23, 57, 132, 301, 701, ...
      const expectedStart = [1, 4, 10, 23, 57, 132, 301, 701];
      for (let i = 0; i < Math.min(expectedStart.length, sequence.length); i++) {
        expect(sequence[sequence.length - i - 1]).toBe(expectedStart[i]);
      }
      
      generateSequenceSpy.mockRestore();
    });
    
    test('applies correct gap-based insertion sorting', () => {
      // Create spy on the gapped insertion sort method
      const gappedInsertionSortSpy = jest.spyOn(shellSort, 'gappedInsertionSort');
      
      const array = [5, 3, 8, 4, 2, 9, 1, 7, 6];
      shellSort.execute(array);
      
      // Verify the method was called with different gap values
      const gapSequence = shellSort.generateGapSequence(array.length, 'knuth');
      
      // Verify each gap was used
      const usedGaps = gappedInsertionSortSpy.mock.calls.map(call => call[2]);
      expect(usedGaps).toEqual(gapSequence);
      
      gappedInsertionSortSpy.mockRestore();
    });
  });
  
  /**
   * Edge cases and special input handling
   */
  describe('Edge Cases', () => {
    test('handles already sorted array efficiently', () => {
      const sortedArray = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      
      // Track operations
      const compareSpy = jest.spyOn(shellSort, 'compare');
      const writeSpy = jest.spyOn(shellSort, 'write');
      
      shellSort.execute(sortedArray);
      
      // Should perform comparisons but minimal writes for sorted array
      // Shell sort should be efficient on already sorted arrays
      expect(compareSpy.mock.calls.length).toBeGreaterThan(0);
      expect(writeSpy.mock.calls.length).toBe(0); // No writes needed for sorted array
      
      compareSpy.mockRestore();
      writeSpy.mockRestore();
    });
    
    test('handles reverse sorted array more efficiently than insertion sort', () => {
      const reverseSortedArray = [10, 9, 8, 7, 6, 5, 4, 3, 2, 1];
      
      // Create an insertion sort for comparison
      const InsertionSort = require('../../../../src/algorithms/comparison/insertion').default;
      const insertionSort = new InsertionSort();
      
      // Track operations
      const shellCompareSpy = jest.spyOn(shellSort, 'compare');
      const insertionCompareSpy = jest.spyOn(insertionSort, 'compare');
      
      shellSort.execute([...reverseSortedArray]);
      insertionSort.execute([...reverseSortedArray]);
      
      // Shell sort should perform fewer comparisons than insertion sort
      // on a reverse-sorted array
      expect(shellCompareSpy.mock.calls.length).toBeLessThan(insertionCompareSpy.mock.calls.length);
      
      shellCompareSpy.mockRestore();
      insertionCompareSpy.mockRestore();
    });
    
    test('handles array with all identical elements', () => {
      const allSameArray = [5, 5, 5, 5, 5, 5, 5, 5, 5, 5];
      
      // Track operations
      const writeSpy = jest.spyOn(shellSort, 'write');
      
      const result = shellSort.execute(allSameArray);
      
      expect(result).toEqual(allSameArray);
      
      // Should not perform any writes when all elements are the same
      expect(writeSpy.mock.calls.length).toBe(0);
      
      writeSpy.mockRestore();
    });
    
    test('sorts very large arrays successfully', () => {
      const largeArray = generateDataSet('random', 1000, { min: 1, max: 10000 });
      
      const result = shellSort.execute(largeArray);
      
      // Verify the array is sorted
      for (let i = 1; i < result.length; i++) {
        expect(result[i]).toBeGreaterThanOrEqual(result[i - 1]);
      }
    });
  });
  
  /**
   * Performance characteristics validation
   */
  describe('Performance Characteristics', () => {
    // Different gap sequences to test
    const gapSequences = ['shell', 'knuth', 'sedgewick', 'ciura'];
    
    test('different gap sequences affect performance', () => {
      // Generate a large random array for testing
      const array = generateDataSet('random', 500, { min: 1, max: 1000 });
      
      // Record comparison counts for each gap sequence
      const comparisonCounts = {};
      
      for (const sequence of gapSequences) {
        const sequenceShellSort = new ShellSort({ gapSequence: sequence });
        const compareSpy = jest.spyOn(sequenceShellSort, 'compare');
        
        sequenceShellSort.execute([...array]);
        comparisonCounts[sequence] = compareSpy.mock.calls.length;
        
        compareSpy.mockRestore();
      }
      
      // Shell's original sequence is known to be less efficient
      expect(comparisonCounts['shell']).toBeGreaterThan(comparisonCounts['knuth']);
      
      // Sedgewick and Ciura sequences are often more efficient
      expect(comparisonCounts['sedgewick']).toBeLessThan(comparisonCounts['shell']);
      expect(comparisonCounts['ciura']).toBeLessThan(comparisonCounts['shell']);
    });
    
    test('outperforms insertion sort on random data', () => {
      // Create an insertion sort for comparison
      const InsertionSort = require('../../../../src/algorithms/comparison/insertion').default;
      const insertionSort = new InsertionSort();
      
      // Generate a random array
      const array = generateDataSet('random', 500, { min: 1, max: 1000 });
      
      // Track operations
      const shellCompareSpy = jest.spyOn(shellSort, 'compare');
      const insertionCompareSpy = jest.spyOn(insertionSort, 'compare');
      
      shellSort.execute([...array]);
      insertionSort.execute([...array]);
      
      // Shell sort should perform fewer comparisons than insertion sort
      expect(shellCompareSpy.mock.calls.length).toBeLessThan(insertionCompareSpy.mock.calls.length);
      
      shellCompareSpy.mockRestore();
      insertionCompareSpy.mockRestore();
    });
    
    test('handles nearly sorted arrays efficiently', () => {
      // Nearly sorted arrays are a good case for shell sort
      const nearlySortedArray = generateDataSet('nearly-sorted', 500, { 
        min: 1, 
        max: 1000,
        sortedRatio: 0.9
      });
      
      // Create a standard shell sort and a shell sort with Ciura sequence
      const standardShellSort = new ShellSort({ gapSequence: 'shell' });
      const ciuraShellSort = new ShellSort({ gapSequence: 'ciura' });
      
      // Track operations
      const standardCompareSpy = jest.spyOn(standardShellSort, 'compare');
      const ciuraCompareSpy = jest.spyOn(ciuraShellSort, 'compare');
      
      standardShellSort.execute([...nearlySortedArray]);
      ciuraShellSort.execute([...nearlySortedArray]);
      
      // Both should perform well on nearly sorted arrays
      // The standard n^2 complexity of insertion sort would be O(n^2) = 250,000 for n=500
      expect(standardCompareSpy.mock.calls.length).toBeLessThan(50000); // Much less than O(n^2)
      expect(ciuraCompareSpy.mock.calls.length).toBeLessThan(50000);
      
      // Ciura sequence should be more efficient
      expect(ciuraCompareSpy.mock.calls.length).toBeLessThan(standardCompareSpy.mock.calls.length);
      
      standardCompareSpy.mockRestore();
      ciuraCompareSpy.mockRestore();
    });
    
    test('exhibits sub-quadratic complexity on average', () => {
      // Generate arrays of increasing sizes
      const sizes = [100, 200, 400];
      const arrays = sizes.map(size => generateDataSet('random', size, { min: 1, max: 1000 }));
      
      // Record operation counts for each size
      const comparisonCounts = [];
      
      for (const array of arrays) {
        const compareSpy = jest.spyOn(shellSort, 'compare');
        shellSort.execute([...array]);
        comparisonCounts.push(compareSpy.mock.calls.length);
        compareSpy.mockRestore();
      }
      
      // Calculate scaling factors between sizes
      const scalingFactors = [];
      for (let i = 1; i < comparisonCounts.length; i++) {
        // Ratio of comparisons / ratio of sizes
        const comparisonRatio = comparisonCounts[i] / comparisonCounts[i - 1];
        const sizeRatio = sizes[i] / sizes[i - 1];
        scalingFactors.push(comparisonRatio / sizeRatio);
      }
      
      // Verify sub-quadratic complexity
      // If complexity is O(n^2), scaling factor would be approximately 2 when size doubles
      // For n log n, it would be approximately 1.1 (since log(2n)/log(n) ≈ 1.1)
      // For sub-quadratic (between n log n and n^2), it should be less than 2
      for (const factor of scalingFactors) {
        expect(factor).toBeLessThan(2);
      }
    });
  });
  
  /**
   * Algorithmic properties
   */
  describe('Algorithm Properties', () => {
    test('reports correct time complexity', () => {
      const complexity = shellSort.getComplexity();
      
      // Shell sort complexity depends on gap sequence
      // With optimal sequences, it's between O(n log n) and O(n^(4/3))
      expect(complexity.time.best).toBe('O(n log n)');
      expect(complexity.time.average).toMatch(/O\(n\^[1-2]\)/); // Should be between n and n^2
      expect(complexity.time.worst).toMatch(/O\(n\^[1-2]\)/);   // Depends on gap sequence
    });
    
    test('reports correct space complexity', () => {
      const complexity = shellSort.getComplexity();
      
      expect(complexity.space.best).toBe('O(1)');
      expect(complexity.space.average).toBe('O(1)');
      expect(complexity.space.worst).toBe('O(1)');
    });
    
    test('is not stable', () => {
      // Shell sort is not stable as it can make long-distance exchanges
      expect(shellSort.isStable()).toBe(false);
      
      // Verify with objects that have the same key
      const objectArray = [
        { key: 1, value: 'a' },
        { key: 5, value: 'b' },
        { key: 1, value: 'c' },
        { key: 3, value: 'd' }
      ];
      
      // Custom comparator that only looks at keys
      const comparator = (a, b) => a.key - b.key;
      
      const result = shellSort.execute(objectArray, { comparator });
      
      // The relative order of elements with key 1 might change
      // due to the long-distance swaps in shell sort
      expect(shellSort.isStable()).toBe(false);
    });
    
    test('is an in-place sorting algorithm', () => {
      expect(shellSort.isInPlace()).toBe(true);
      
      // Verify auxiliary space usage is minimal
      const largeArray = generateDataSet('random', 1000, { min: 1, max: 10000 });
      
      shellSort.execute(largeArray);
      
      // Auxiliary space should be constant regardless of input size
      expect(shellSort.metrics.auxiliarySpace).toBeLessThan(10);
    });
  });
});
