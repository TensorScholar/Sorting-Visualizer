// tests/js/algorithms/comparison/binaryinsertion.test.js

/**
 * @file Comprehensive test suite for Binary Insertion Sort algorithm implementation.
 * @author Advanced Sorting Algorithm Visualization Platform
 * @version 1.0.0
 *
 * This test suite provides systematic verification of the Binary Insertion Sort algorithm,
 * validating functional correctness, edge cases, algorithmic characteristics, and optimization
 * effectiveness. Binary Insertion Sort is a variant of Insertion Sort that uses binary search
 * to find the correct position to insert the next element, reducing the number of comparisons
 * required for sorting.
 */

import BinaryInsertionSort from '../../../../src/algorithms/comparison/binary-insertion';
import InsertionSort from '../../../../src/algorithms/comparison/insertion';

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
const createDefaultBinaryInsertionSort = () => new BinaryInsertionSort();
const createBinaryInsertionSortWithEarlyTermination = () => new BinaryInsertionSort({ 
  earlyTermination: true 
});
const createInsertionSort = () => new InsertionSort();

/**
 * Comprehensive test suite for Binary Insertion Sort algorithm
 */
describe('Binary Insertion Sort Algorithm', () => {
  /**
   * Core functionality tests that verify sorting capabilities
   * across various input distributions
   */
  describe('Functional Correctness', () => {
    test('sorts a random array correctly', () => {
      // Arrange
      const array = generateRandomArray(100, 1, 1000);
      const binaryInsertionSort = createDefaultBinaryInsertionSort();
      
      // Act
      const result = binaryInsertionSort.execute(array);
      
      // Assert
      expect(isSorted(result)).toBe(true);
      expect(result.length).toBe(array.length);
    });
    
    test('handles already sorted array correctly', () => {
      // Arrange
      const array = generateSortedArray(100, 1, 1000);
      const binaryInsertionSort = createDefaultBinaryInsertionSort();
      
      // Act
      const result = binaryInsertionSort.execute(array);
      
      // Assert
      expect(isSorted(result)).toBe(true);
      expect(result.length).toBe(array.length);
    });
    
    test('sorts reversed array correctly', () => {
      // Arrange
      const array = generateReversedArray(100, 1, 1000);
      const binaryInsertionSort = createDefaultBinaryInsertionSort();
      
      // Act
      const result = binaryInsertionSort.execute(array);
      
      // Assert
      expect(isSorted(result)).toBe(true);
      expect(result.length).toBe(array.length);
    });
    
    test('sorts array with duplicate values correctly', () => {
      // Arrange
      const array = generateArrayWithDuplicates(100, 20);
      const binaryInsertionSort = createDefaultBinaryInsertionSort();
      
      // Act
      const result = binaryInsertionSort.execute(array);
      
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
      const binaryInsertionSort = createDefaultBinaryInsertionSort();
      
      // Create custom comparator for objects
      const comparator = (a, b) => a.key - b.key;
      
      // Act
      const result = binaryInsertionSort.execute(array, { comparator });
      
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
      const binaryInsertionSort = createDefaultBinaryInsertionSort();
      
      // Act
      const result = binaryInsertionSort.execute(array);
      
      // Assert
      expect(result).toEqual([]);
      expect(binaryInsertionSort.metrics.comparisons).toBe(0);
      expect(binaryInsertionSort.metrics.swaps).toBe(0);
    });
    
    test('handles single element array correctly', () => {
      // Arrange
      const array = generateSingleElementArray(42);
      const binaryInsertionSort = createDefaultBinaryInsertionSort();
      
      // Act
      const result = binaryInsertionSort.execute(array);
      
      // Assert
      expect(result).toEqual([42]);
      expect(binaryInsertionSort.metrics.comparisons).toBe(0);
      expect(binaryInsertionSort.metrics.swaps).toBe(0);
    });
    
    test('handles array with negative values correctly', () => {
      // Arrange
      const array = [-5, 10, -15, 20, -25];
      const binaryInsertionSort = createDefaultBinaryInsertionSort();
      
      // Act
      const result = binaryInsertionSort.execute(array);
      
      // Assert
      expect(result).toEqual([-25, -15, -5, 10, 20]);
    });
    
    test('handles non-numeric values with custom comparator', () => {
      // Arrange
      const array = ['banana', 'apple', 'cherry', 'date'];
      const binaryInsertionSort = createDefaultBinaryInsertionSort();
      const comparator = (a, b) => a.localeCompare(b);
      
      // Act
      const result = binaryInsertionSort.execute(array, { comparator });
      
      // Assert
      expect(result).toEqual(['apple', 'banana', 'cherry', 'date']);
    });
  });
  
  /**
   * Algorithm-specific tests that verify the characteristic
   * behaviors and optimizations of Binary Insertion Sort
   */
  describe('Algorithm Characteristics', () => {
    test('uses fewer comparisons than standard insertion sort', () => {
      // Arrange
      const array = generateRandomArray(100, 1, 1000);
      const binaryInsertionSort = createDefaultBinaryInsertionSort();
      const standardInsertionSort = createInsertionSort();
      
      // Act
      binaryInsertionSort.execute([...array]);
      standardInsertionSort.execute([...array]);
      
      // Assert
      // Binary insertion sort should use logarithmically fewer comparisons
      expect(binaryInsertionSort.metrics.comparisons).toBeLessThan(standardInsertionSort.metrics.comparisons);
    });
    
    test('requires same number of swaps/shifts as standard insertion sort', () => {
      // Arrange
      const array = generateRandomArray(100, 1, 1000);
      const binaryInsertionSort = createDefaultBinaryInsertionSort();
      const standardInsertionSort = createInsertionSort();
      
      // Act
      binaryInsertionSort.execute([...array]);
      standardInsertionSort.execute([...array]);
      
      // Assert
      // Both algorithms should perform the same number of shifts/swaps
      // Allow minor differences due to implementation details
      const swapDifference = Math.abs(binaryInsertionSort.metrics.swaps - standardInsertionSort.metrics.swaps);
      expect(swapDifference).toBeLessThanOrEqual(5);
    });
    
    test('binary search reduces comparisons logarithmically with array size', () => {
      // Arrange
      const smallArray = generateRandomArray(50, 1, 1000);
      const largeArray = generateRandomArray(200, 1, 1000);
      const binaryInsertionSort = createDefaultBinaryInsertionSort();
      const standardInsertionSort = createInsertionSort();
      
      // Act - Small array
      binaryInsertionSort.execute([...smallArray]);
      const binarySmallComparisons = binaryInsertionSort.metrics.comparisons;
      
      standardInsertionSort.execute([...smallArray]);
      const standardSmallComparisons = standardInsertionSort.metrics.comparisons;
      
      // Reset and run with large array
      binaryInsertionSort.reset();
      standardInsertionSort.reset();
      
      binaryInsertionSort.execute([...largeArray]);
      const binaryLargeComparisons = binaryInsertionSort.metrics.comparisons;
      
      standardInsertionSort.execute([...largeArray]);
      const standardLargeComparisons = standardInsertionSort.metrics.comparisons;
      
      // Assert
      // Calculate improvement ratios
      const smallArrayImprovement = standardSmallComparisons / binarySmallComparisons;
      const largeArrayImprovement = standardLargeComparisons / binaryLargeComparisons;
      
      // The improvement factor should be greater for larger arrays
      expect(largeArrayImprovement).toBeGreaterThan(smallArrayImprovement);
    });
    
    test('finds correct insertion position using binary search', () => {
      // Arrange
      const binaryInsertionSort = createDefaultBinaryInsertionSort();
      
      // Create spy to access internal findInsertionPosition method
      const findPositionSpy = jest.spyOn(binaryInsertionSort, 'findInsertionPosition');
      
      // Prepare test cases
      const sortedSegment = [10, 20, 30, 40, 50, 60, 70, 80, 90];
      const testCases = [
        { value: 5, expectedPosition: 0 },
        { value: 15, expectedPosition: 1 },
        { value: 45, expectedPosition: 4 },
        { value: 95, expectedPosition: 9 },
        { value: 30, expectedPosition: 2 } // Exact match should insert after existing element
      ];
      
      // Act & Assert
      for (const { value, expectedPosition } of testCases) {
        const position = binaryInsertionSort.findInsertionPosition(sortedSegment, value, 0, sortedSegment.length - 1);
        expect(position).toBe(expectedPosition);
      }
      
      expect(findPositionSpy).toHaveBeenCalled();
      findPositionSpy.mockRestore();
    });
    
    test('verifies binary insertion sort is stable', () => {
      // Arrange
      const binaryInsertionSort = createDefaultBinaryInsertionSort();
      
      // Act
      const isStable = binaryInsertionSort.isStable();
      
      // Assert
      expect(isStable).toBe(true);
    });
    
    test('verifies binary insertion sort is in-place', () => {
      // Arrange
      const binaryInsertionSort = createDefaultBinaryInsertionSort();
      
      // Act
      const isInPlace = binaryInsertionSort.isInPlace();
      
      // Assert
      expect(isInPlace).toBe(true);
    });
    
    test('validates time complexity information', () => {
      // Arrange
      const binaryInsertionSort = createDefaultBinaryInsertionSort();
      
      // Act
      const complexity = binaryInsertionSort.getComplexity();
      
      // Assert
      expect(complexity.time.best).toBe('O(n)');
      expect(complexity.time.average).toBe('O(n log n)'); // For comparisons
      expect(complexity.time.worst).toBe('O(n²)'); // Still O(n²) due to shifting elements
      
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
    test('records binary search operations correctly', () => {
      // Arrange
      const array = [5, 3, 8, 4, 2];
      const binaryInsertionSort = createDefaultBinaryInsertionSort();
      
      // Collect binary search states
      const binarySearchStates = [];
      binaryInsertionSort.on('step', (data) => {
        if (data.state.type === 'binary-search') {
          binarySearchStates.push(data.state);
        }
      });
      
      // Act
      binaryInsertionSort.execute(array);
      
      // Assert
      expect(binarySearchStates.length).toBeGreaterThan(0);
      
      // Check that binary search states have the expected structure
      binarySearchStates.forEach(state => {
        expect(state).toHaveProperty('low');
        expect(state).toHaveProperty('mid');
        expect(state).toHaveProperty('high');
        expect(state).toHaveProperty('target');
      });
    });
    
    test('records state history appropriately', () => {
      // Arrange
      const array = [5, 3, 8, 4, 2];
      const binaryInsertionSort = createDefaultBinaryInsertionSort();
      
      // Act
      binaryInsertionSort.execute(array);
      
      // Assert
      expect(binaryInsertionSort.history.length).toBeGreaterThan(0);
      
      // First state should be initial array
      expect(binaryInsertionSort.history[0].type).toBe('initial');
      
      // Last state should be final sorted array
      const lastState = binaryInsertionSort.history[binaryInsertionSort.history.length - 1];
      expect(lastState.type).toBe('final');
      expect(lastState.array).toEqual([2, 3, 4, 5, 8]);
      
      // Should include both binary search and insertion steps
      const binarySearchSteps = binaryInsertionSort.history.filter(s => s.type === 'binary-search');
      const insertionSteps = binaryInsertionSort.history.filter(s => s.type === 'insertion');
      
      expect(binarySearchSteps.length).toBeGreaterThan(0);
      expect(insertionSteps.length).toBeGreaterThan(0);
    });
    
    test('provides detailed algorithm information', () => {
      // Arrange
      const binaryInsertionSort = createDefaultBinaryInsertionSort();
      
      // Act
      const info = binaryInsertionSort.getInfo();
      
      // Assert
      expect(info.name).toBe('Binary Insertion Sort');
      expect(info.category).toBe('comparison');
      expect(info.complexity).toBeDefined();
      expect(info.stability).toBe(true);
      expect(info.inPlace).toBe(true);
      
      // Should include algorithm-specific information
      expect(info.advantages).toContainEqual(expect.stringContaining('comparisons'));
      expect(info.disadvantages).toBeDefined();
    });
  });
  
  /**
   * Comparative tests that verify the improvement over standard insertion sort
   */
  describe('Comparative Analysis', () => {
    test('performance comparison with standard insertion sort', () => {
      // Arrange - create test cases with different characteristics
      const testCases = [
        { name: 'Random Array', array: generateRandomArray(100, 1, 1000) },
        { name: 'Sorted Array', array: generateSortedArray(100, 1, 1000) },
        { name: 'Reversed Array', array: generateReversedArray(100, 1, 1000) },
        { name: 'Nearly Sorted Array', array: generateNearlySortedArray(100, 1, 1000, 0.9) },
        { name: 'Array with Duplicates', array: generateArrayWithDuplicates(100, 20) }
      ];
      
      // Instance algorithms
      const binaryInsertionSort = createDefaultBinaryInsertionSort();
      const standardInsertionSort = createInsertionSort();
      
      // Act & Assert
      for (const { name, array } of testCases) {
        // Run both algorithms
        const arrayCopy1 = [...array];
        const arrayCopy2 = [...array];
        
        binaryInsertionSort.reset();
        standardInsertionSort.reset();
        
        binaryInsertionSort.execute(arrayCopy1);
        standardInsertionSort.execute(arrayCopy2);
        
        // Check functional correctness
        expect(isSorted(arrayCopy1)).toBe(true);
        expect(isSorted(arrayCopy2)).toBe(true);
        
        // Verify comparison reduction
        expect(binaryInsertionSort.metrics.comparisons).toBeLessThan(
          standardInsertionSort.metrics.comparisons
        );
        
        // Verify similar number of swaps/shifts (core operation)
        const swapDifference = Math.abs(
          binaryInsertionSort.metrics.swaps - standardInsertionSort.metrics.swaps
        );
        const swapPercentageDifference = swapDifference / standardInsertionSort.metrics.swaps;
        
        // Allow up to 5% difference in swap count due to implementation differences
        expect(swapPercentageDifference).toBeLessThan(0.05);
      }
    });
    
    test('early termination effectiveness on different distributions', () => {
      // Arrange
      const arrays = {
        random: generateRandomArray(100, 1, 1000),
        sorted: generateSortedArray(100, 1, 1000),
        nearlySorted: generateNearlySortedArray(100, 1, 1000, 0.9)
      };
      
      const standardBinaryInsertionSort = createDefaultBinaryInsertionSort();
      const optimizedBinaryInsertionSort = createBinaryInsertionSortWithEarlyTermination();
      
      // Act & Assert
      for (const [type, array] of Object.entries(arrays)) {
        // Reset algorithms
        standardBinaryInsertionSort.reset();
        optimizedBinaryInsertionSort.reset();
        
        // Execute both variants
        standardBinaryInsertionSort.execute([...array]);
        optimizedBinaryInsertionSort.execute([...array]);
        
        // For sorted/nearly sorted arrays, early termination should show benefits
        if (type === 'sorted' || type === 'nearlySorted') {
          expect(optimizedBinaryInsertionSort.metrics.comparisons).toBeLessThan(
            standardBinaryInsertionSort.metrics.comparisons
          );
        }
        
        // Both should produce correct results
        expect(isSorted(standardBinaryInsertionSort.history[standardBinaryInsertionSort.history.length - 1].array)).toBe(true);
        expect(isSorted(optimizedBinaryInsertionSort.history[optimizedBinaryInsertionSort.history.length - 1].array)).toBe(true);
      }
    });
  });
});
