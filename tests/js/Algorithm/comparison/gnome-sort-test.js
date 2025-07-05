// tests/js/algorithms/comparison/gnome.test.js

/**
 * @file Comprehensive test suite for Gnome Sort algorithm implementation.
 * @author Advanced Sorting Algorithm Visualization Platform
 * @version 1.0.0
 *
 * This test suite provides systematic verification of the Gnome Sort algorithm,
 * validating functional correctness, edge cases, and algorithmic characteristics.
 * Gnome Sort (also called Stupid Sort) is a simple but effective sorting algorithm
 * that works by repeatedly comparing adjacent elements and swapping them if they
 * are in the wrong order, while moving back one step when a swap occurs.
 */

import GnomeSort from '../../../../src/algorithms/comparison/gnome';

// Import test utilities and fixtures
import { 
  generateRandomArray,
  generateSortedArray,
  generateReversedArray,
  generateNearlySortedArray,
  generateArrayWithDuplicates,
  generateEmptyArray,
  generateSingleElementArray,
  isSorted
} from '../../../__fixtures__/array-utils';

// Instantiate algorithm with various configurations for testing
const createDefaultGnomeSort = () => new GnomeSort();
const createOptimizedGnomeSort = () => new GnomeSort({ optimized: true });

/**
 * Comprehensive test suite for Gnome Sort algorithm
 */
describe('Gnome Sort Algorithm', () => {
  /**
   * Core functionality tests that verify sorting capabilities
   * across various input distributions
   */
  describe('Functional Correctness', () => {
    test('sorts a random array correctly', () => {
      // Arrange
      const array = generateRandomArray(100, 1, 1000);
      const gnomeSort = createDefaultGnomeSort();
      
      // Act
      const result = gnomeSort.execute(array);
      
      // Assert
      expect(isSorted(result)).toBe(true);
      expect(result.length).toBe(array.length);
    });
    
    test('handles already sorted array efficiently', () => {
      // Arrange
      const array = generateSortedArray(100, 1, 1000);
      const gnomeSort = createDefaultGnomeSort();
      
      // Act
      const result = gnomeSort.execute(array);
      
      // Assert
      expect(isSorted(result)).toBe(true);
      expect(result.length).toBe(array.length);
      // Should be relatively few comparisons for a sorted array
      expect(gnomeSort.metrics.comparisons).toBeLessThan(array.length * 2);
    });
    
    test('sorts reversed array correctly', () => {
      // Arrange
      const array = generateReversedArray(100, 1, 1000);
      const gnomeSort = createDefaultGnomeSort();
      
      // Act
      const result = gnomeSort.execute(array);
      
      // Assert
      expect(isSorted(result)).toBe(true);
      expect(result.length).toBe(array.length);
    });
    
    test('sorts array with duplicate values correctly', () => {
      // Arrange
      const array = generateArrayWithDuplicates(100, 20);
      const gnomeSort = createDefaultGnomeSort();
      
      // Act
      const result = gnomeSort.execute(array);
      
      // Assert
      expect(isSorted(result)).toBe(true);
      expect(result.length).toBe(array.length);
    });
    
    test('maintains correct order of equal elements (stability test)', () => {
      // Arrange
      const array = [
        { key: 3, value: 'A' },
        { key: 1, value: 'B' },
        { key: 2, value: 'C' },
        { key: 1, value: 'D' },
        { key: 3, value: 'E' },
        { key: 2, value: 'F' }
      ];
      const gnomeSort = createDefaultGnomeSort();
      
      // Create custom comparator for objects
      const comparator = (a, b) => a.key - b.key;
      
      // Act
      const result = gnomeSort.execute(array, { comparator });
      
      // Assert
      expect(result[0].key).toBe(1);
      expect(result[1].key).toBe(1);
      expect(result[0].value).toBe('B'); // 'B' should come before 'D' (stability check)
      expect(result[1].value).toBe('D');
      
      expect(result[2].key).toBe(2);
      expect(result[3].key).toBe(2);
      expect(result[2].value).toBe('C'); // 'C' should come before 'F' (stability check)
      expect(result[3].value).toBe('F');
      
      expect(result[4].key).toBe(3);
      expect(result[5].key).toBe(3);
      expect(result[4].value).toBe('A'); // 'A' should come before 'E' (stability check)
      expect(result[5].value).toBe('E');
    });
  });
  
  /**
   * Edge case tests that verify algorithm robustness
   * when handling unusual or boundary inputs
   */
  describe('Edge Cases', () => {
    test('handles empty array correctly', () => {
      // Arrange
      const array = generateEmptyArray();
      const gnomeSort = createDefaultGnomeSort();
      
      // Act
      const result = gnomeSort.execute(array);
      
      // Assert
      expect(result).toEqual([]);
      expect(gnomeSort.metrics.comparisons).toBe(0);
      expect(gnomeSort.metrics.swaps).toBe(0);
    });
    
    test('handles single element array correctly', () => {
      // Arrange
      const array = generateSingleElementArray(42);
      const gnomeSort = createDefaultGnomeSort();
      
      // Act
      const result = gnomeSort.execute(array);
      
      // Assert
      expect(result).toEqual([42]);
      expect(gnomeSort.metrics.comparisons).toBe(0);
      expect(gnomeSort.metrics.swaps).toBe(0);
    });
    
    test('handles array with negative values correctly', () => {
      // Arrange
      const array = [-5, 10, -15, 20, -25];
      const gnomeSort = createDefaultGnomeSort();
      
      // Act
      const result = gnomeSort.execute(array);
      
      // Assert
      expect(result).toEqual([-25, -15, -5, 10, 20]);
    });
    
    test('handles array with non-numeric values using custom comparator', () => {
      // Arrange
      const array = ['banana', 'apple', 'cherry', 'date'];
      const gnomeSort = createDefaultGnomeSort();
      const comparator = (a, b) => a.localeCompare(b);
      
      // Act
      const result = gnomeSort.execute(array, { comparator });
      
      // Assert
      expect(result).toEqual(['apple', 'banana', 'cherry', 'date']);
    });
  });
  
  /**
   * Algorithm-specific tests that verify the characteristic
   * behaviors and optimizations of Gnome Sort
   */
  describe('Algorithm Characteristics', () => {
    test('verifies expected worst-case performance characteristics', () => {
      // Arrange
      const array = generateReversedArray(30, 1, 1000);
      const gnomeSort = createDefaultGnomeSort();
      
      // Act
      gnomeSort.execute(array);
      
      // Assert
      // For reversed array of size n, standard Gnome Sort should perform ~n² operations
      const n = array.length;
      const expectedOperations = n * n;
      const totalOperations = gnomeSort.metrics.comparisons + gnomeSort.metrics.swaps;
      
      // Allow some variation but ensure order of growth is quadratic
      expect(totalOperations).toBeGreaterThan(n * n / 4);
      expect(totalOperations).toBeLessThan(n * n * 2);
    });
    
    test('optimized variant performs fewer operations for nearly sorted arrays', () => {
      // Arrange
      const array = generateNearlySortedArray(100, 1, 1000, 0.9);
      const standardGnomeSort = createDefaultGnomeSort();
      const optimizedGnomeSort = createOptimizedGnomeSort();
      
      // Act
      standardGnomeSort.execute([...array]);
      optimizedGnomeSort.execute([...array]);
      
      // Assert - optimized should use fewer operations
      const standardOperations = standardGnomeSort.metrics.comparisons + standardGnomeSort.metrics.swaps;
      const optimizedOperations = optimizedGnomeSort.metrics.comparisons + optimizedGnomeSort.metrics.swaps;
      
      expect(optimizedOperations).toBeLessThan(standardOperations);
    });
    
    test('verifies gnome sort is stable', () => {
      // Arrange
      const gnomeSort = createDefaultGnomeSort();
      
      // Act
      const isStable = gnomeSort.isStable();
      
      // Assert
      expect(isStable).toBe(true);
    });
    
    test('verifies gnome sort is in-place', () => {
      // Arrange
      const gnomeSort = createDefaultGnomeSort();
      
      // Act
      const isInPlace = gnomeSort.isInPlace();
      
      // Assert
      expect(isInPlace).toBe(true);
    });
    
    test('validates time complexity information', () => {
      // Arrange
      const gnomeSort = createDefaultGnomeSort();
      
      // Act
      const complexity = gnomeSort.getComplexity();
      
      // Assert
      expect(complexity.time.best).toBe('O(n)');
      expect(complexity.time.average).toBe('O(n²)');
      expect(complexity.time.worst).toBe('O(n²)');
      
      expect(complexity.space.best).toBe('O(1)');
      expect(complexity.space.average).toBe('O(1)');
      expect(complexity.space.worst).toBe('O(1)');
    });
  });
  
  /**
   * Tests that verify proper instrumentation is provided
   * for visualization and analytics
   */
  describe('Instrumentation', () => {
    test('records the correct number of array accesses', () => {
      // Arrange
      const array = [5, 3, 8, 4, 2];
      const gnomeSort = createDefaultGnomeSort();
      
      // Act
      gnomeSort.execute(array);
      
      // Assert
      // Each swap involves 4 array accesses (2 reads + 2 writes)
      expect(gnomeSort.metrics.reads + gnomeSort.metrics.writes).toBe(
        gnomeSort.metrics.swaps * 4 + gnomeSort.metrics.comparisons * 2
      );
    });
    
    test('records state history during execution', () => {
      // Arrange
      const array = [5, 3, 8, 4, 2];
      const gnomeSort = createDefaultGnomeSort();
      
      // Act
      gnomeSort.execute(array);
      
      // Assert
      expect(gnomeSort.history.length).toBeGreaterThan(0);
      
      // First state should be initial array
      expect(gnomeSort.history[0].type).toBe('initial');
      
      // Last state should be final sorted array
      const lastState = gnomeSort.history[gnomeSort.history.length - 1];
      expect(lastState.type).toBe('final');
      expect(lastState.array).toEqual([2, 3, 4, 5, 8]);
    });
    
    test('provides detailed algorithm information', () => {
      // Arrange
      const gnomeSort = createDefaultGnomeSort();
      
      // Act
      const info = gnomeSort.getInfo();
      
      // Assert
      expect(info.name).toBe('Gnome Sort');
      expect(info.category).toBe('comparison');
      expect(info.complexity).toBeDefined();
      expect(info.stability).toBe(true);
      expect(info.inPlace).toBe(true);
    });
  });
});
