// tests/js/algorithms/comparison/heap.test.js

/**
 * @file Comprehensive test suite for Heap Sort algorithm implementation.
 * @author Advanced Sorting Algorithm Visualization Platform
 * @version 1.0.0
 *
 * This test suite provides systematic verification of the Heap Sort algorithm,
 * validating functional correctness, edge cases, algorithmic characteristics,
 * and heap-specific behaviors. Heap Sort operates by first building a max-heap
 * from the input array, then repeatedly extracting the maximum element and
 * rebuilding the heap until the array is sorted.
 */

import HeapSort from '../../../../src/algorithms/comparison/heap';

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
const createDefaultHeapSort = () => new HeapSort();
const createHeapSortWithoutVisualization = () => new HeapSort({ visualizeHeap: false });
const createHeapSortWithOptimizedLeafChecks = () => new HeapSort({ 
  optimizeLeafChecks: true,
  bottomUpHeapify: true
});

/**
 * Comprehensive test suite for Heap Sort algorithm
 */
describe('Heap Sort Algorithm', () => {
  /**
   * Core functionality tests that verify sorting capabilities
   * across various input distributions
   */
  describe('Functional Correctness', () => {
    test('sorts a random array correctly', () => {
      // Arrange
      const array = generateRandomArray(100, 1, 1000);
      const heapSort = createDefaultHeapSort();
      
      // Act
      const result = heapSort.execute(array);
      
      // Assert
      expect(isSorted(result)).toBe(true);
      expect(result.length).toBe(array.length);
    });
    
    test('handles already sorted array correctly', () => {
      // Arrange
      const array = generateSortedArray(100, 1, 1000);
      const heapSort = createDefaultHeapSort();
      
      // Act
      const result = heapSort.execute(array);
      
      // Assert
      expect(isSorted(result)).toBe(true);
      expect(result.length).toBe(array.length);
    });
    
    test('sorts reversed array correctly', () => {
      // Arrange
      const array = generateReversedArray(100, 1, 1000);
      const heapSort = createDefaultHeapSort();
      
      // Act
      const result = heapSort.execute(array);
      
      // Assert
      expect(isSorted(result)).toBe(true);
      expect(result.length).toBe(array.length);
    });
    
    test('sorts array with duplicate values correctly', () => {
      // Arrange
      const array = generateArrayWithDuplicates(100, 20);
      const heapSort = createDefaultHeapSort();
      
      // Act
      const result = heapSort.execute(array);
      
      // Assert
      expect(isSorted(result)).toBe(true);
      expect(result.length).toBe(array.length);
    });
    
    test('maintains correctness with custom comparator function', () => {
      // Arrange
      const array = [
        { value: 5, priority: 3 },
        { value: 2, priority: 1 },
        { value: 8, priority: 2 },
        { value: 1, priority: 5 },
        { value: 3, priority: 4 }
      ];
      const heapSort = createDefaultHeapSort();
      
      // Custom comparator for sorting by priority (high to low)
      const comparator = (a, b) => b.priority - a.priority;
      
      // Act
      const result = heapSort.execute(array, { comparator });
      
      // Assert
      expect(result[0].priority).toBe(5);
      expect(result[1].priority).toBe(4);
      expect(result[2].priority).toBe(3);
      expect(result[3].priority).toBe(2);
      expect(result[4].priority).toBe(1);
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
      const heapSort = createDefaultHeapSort();
      
      // Act
      const result = heapSort.execute(array);
      
      // Assert
      expect(result).toEqual([]);
      expect(heapSort.metrics.comparisons).toBe(0);
      expect(heapSort.metrics.swaps).toBe(0);
    });
    
    test('handles single element array correctly', () => {
      // Arrange
      const array = generateSingleElementArray(42);
      const heapSort = createDefaultHeapSort();
      
      // Act
      const result = heapSort.execute(array);
      
      // Assert
      expect(result).toEqual([42]);
      expect(heapSort.metrics.comparisons).toBe(0);
      expect(heapSort.metrics.swaps).toBe(0);
    });
    
    test('handles array with negative values correctly', () => {
      // Arrange
      const array = [-5, 10, -15, 20, -25];
      const heapSort = createDefaultHeapSort();
      
      // Act
      const result = heapSort.execute(array);
      
      // Assert
      expect(result).toEqual([-25, -15, -5, 10, 20]);
    });
    
    test('handles array with all identical values', () => {
      // Arrange
      const array = [5, 5, 5, 5, 5];
      const heapSort = createDefaultHeapSort();
      
      // Act
      const result = heapSort.execute(array);
      
      // Assert
      expect(result).toEqual([5, 5, 5, 5, 5]);
    });
  });
  
  /**
   * Algorithm-specific tests that verify the characteristic
   * behaviors and optimizations of Heap Sort
   */
  describe('Algorithm Characteristics', () => {
    test('performs in O(n log n) time regardless of input distribution', () => {
      // Arrange
      // Use three different distributions to verify consistent performance
      const randomArray = generateRandomArray(300, 1, 1000);
      const sortedArray = generateSortedArray(300, 1, 1000);
      const reversedArray = generateReversedArray(300, 1, 1000);
      
      const heapSort = createDefaultHeapSort();
      
      // Act
      heapSort.execute([...randomArray]);
      const randomComparisons = heapSort.metrics.comparisons;
      
      heapSort.reset();
      heapSort.execute([...sortedArray]);
      const sortedComparisons = heapSort.metrics.comparisons;
      
      heapSort.reset();
      heapSort.execute([...reversedArray]);
      const reversedComparisons = heapSort.metrics.comparisons;
      
      // Assert
      // Calculate expected range for n log n growth
      const n = 300;
      const expectedLowerBound = n * Math.log2(n) * 0.5;
      const expectedUpperBound = n * Math.log2(n) * 2;
      
      // Verify all distributions have similar performance in the expected range
      expect(randomComparisons).toBeGreaterThan(expectedLowerBound);
      expect(randomComparisons).toBeLessThan(expectedUpperBound);
      
      expect(sortedComparisons).toBeGreaterThan(expectedLowerBound);
      expect(sortedComparisons).toBeLessThan(expectedUpperBound);
      
      expect(reversedComparisons).toBeGreaterThan(expectedLowerBound);
      expect(reversedComparisons).toBeLessThan(expectedUpperBound);
      
      // Verify that performance is consistent across distributions
      // (unlike QuickSort which degrades on sorted arrays)
      const maxVariation = 1.5; // Allow up to 50% variation due to heapify optimizations
      expect(sortedComparisons / randomComparisons).toBeLessThan(maxVariation);
      expect(reversedComparisons / randomComparisons).toBeLessThan(maxVariation);
    });
    
    test('optimized leaf checks reduce unnecessary comparisons', () => {
      // Arrange
      const array = generateRandomArray(200, 1, 1000);
      const standardHeapSort = createDefaultHeapSort();
      const optimizedHeapSort = createHeapSortWithOptimizedLeafChecks();
      
      // Act
      standardHeapSort.execute([...array]);
      optimizedHeapSort.execute([...array]);
      
      // Assert
      // Optimized version should make fewer comparisons
      expect(optimizedHeapSort.metrics.comparisons).toBeLessThan(standardHeapSort.metrics.comparisons);
    });
    
    test('verifies heap sort is not stable', () => {
      // Arrange
      const heapSort = createDefaultHeapSort();
      
      // Act
      const isStable = heapSort.isStable();
      
      // Assert
      expect(isStable).toBe(false);
    });
    
    test('verifies heap sort is in-place', () => {
      // Arrange
      const heapSort = createDefaultHeapSort();
      
      // Act
      const isInPlace = heapSort.isInPlace();
      
      // Assert
      expect(isInPlace).toBe(true);
    });
    
    test('validates time complexity information', () => {
      // Arrange
      const heapSort = createDefaultHeapSort();
      
      // Act
      const complexity = heapSort.getComplexity();
      
      // Assert
      expect(complexity.time.best).toBe('O(n log n)');
      expect(complexity.time.average).toBe('O(n log n)');
      expect(complexity.time.worst).toBe('O(n log n)');
      
      expect(complexity.space.best).toBe('O(1)');
      expect(complexity.space.average).toBe('O(1)');
      expect(complexity.space.worst).toBe('O(1)');
    });
  });
  
  /**
   * Tests specific to heap construction and structure
   */
  describe('Heap-Specific Behavior', () => {
    test('correctly builds a max heap from unordered array', () => {
      // Arrange
      const array = [3, 7, 1, 9, 4, 6, 2, 8, 5];
      const heapSort = createDefaultHeapSort();
      
      // Create a spy to capture heap state
      let heapState = null;
      heapSort.on('step', (data) => {
        if (data.state.type === 'heap-complete') {
          heapState = data.state.array.slice();
        }
      });
      
      // Act
      heapSort.execute(array);
      
      // Assert
      // Verify max heap property: for all i, array[i] >= array[2i+1] && array[i] >= array[2i+2]
      expect(heapState).not.toBeNull();
      
      for (let i = 0; i < Math.floor(heapState.length / 2); i++) {
        const leftChildIdx = 2 * i + 1;
        const rightChildIdx = 2 * i + 2;
        
        if (leftChildIdx < heapState.length) {
          expect(heapState[i]).toBeGreaterThanOrEqual(heapState[leftChildIdx]);
        }
        
        if (rightChildIdx < heapState.length) {
          expect(heapState[i]).toBeGreaterThanOrEqual(heapState[rightChildIdx]);
        }
      }
    });
    
    test('extracts elements in descending order during sort phase', () => {
      // Arrange
      const array = [3, 7, 1, 9, 4, 6, 2, 8, 5];
      const heapSort = createDefaultHeapSort();
      
      // Collect extracted elements
      const extractedElements = [];
      heapSort.on('step', (data) => {
        if (data.state.type === 'extract-max') {
          extractedElements.push(data.state.value);
        }
      });
      
      // Act
      heapSort.execute(array);
      
      // Assert
      // Verify extracted elements are in descending order
      for (let i = 1; i < extractedElements.length; i++) {
        expect(extractedElements[i - 1]).toBeGreaterThanOrEqual(extractedElements[i]);
      }
    });
    
    test('generates heap structure data for visualization when enabled', () => {
      // Arrange
      const array = [5, 3, 8, 4, 2];
      const heapSortWithVisualization = createDefaultHeapSort();
      const heapSortWithoutVisualization = createHeapSortWithoutVisualization();
      
      // Tracking variables
      let heapStructureFound = false;
      let heapStructureNotFound = true;
      
      // Register listeners
      heapSortWithVisualization.on('step', (data) => {
        if (data.state.heapStructure) {
          heapStructureFound = true;
        }
      });
      
      heapSortWithoutVisualization.on('step', (data) => {
        if (data.state.heapStructure) {
          heapStructureNotFound = false;
        }
      });
      
      // Act
      heapSortWithVisualization.execute([...array]);
      heapSortWithoutVisualization.execute([...array]);
      
      // Assert
      expect(heapStructureFound).toBe(true);
      expect(heapStructureNotFound).toBe(true);
    });
  });
  
  /**
   * Tests that verify proper instrumentation is provided
   * for visualization and analytics
   */
  describe('Instrumentation', () => {
    test('records the correct number of array accesses', () => {
      // Arrange
      const array = generateRandomArray(50, 1, 100);
      const heapSort = createDefaultHeapSort();
      
      // Act
      heapSort.execute(array);
      
      // Assert
      // Each swap involves 4 array accesses (2 reads + 2 writes)
      expect(heapSort.metrics.memoryAccesses).toBe(
        heapSort.metrics.reads + heapSort.metrics.writes
      );
      expect(heapSort.metrics.swaps * 4).toBeLessThanOrEqual(heapSort.metrics.memoryAccesses);
    });
    
    test('records state history appropriately during phases', () => {
      // Arrange
      const array = [5, 3, 8, 4, 2];
      const heapSort = createDefaultHeapSort();
      
      // Tracking variables for phases
      let heapConstructionPhase = false;
      let sortingPhase = false;
      
      // Register listener
      heapSort.on('step', (data) => {
        if (data.state.type === 'heap-start') {
          heapConstructionPhase = true;
        } else if (data.state.type === 'extract-max') {
          sortingPhase = true;
        }
      });
      
      // Act
      heapSort.execute(array);
      
      // Assert
      expect(heapConstructionPhase).toBe(true);
      expect(sortingPhase).toBe(true);
      expect(heapSort.history.length).toBeGreaterThan(0);
      
      // First state should be initial array
      expect(heapSort.history[0].type).toBe('initial');
      
      // Last state should be final sorted array
      const lastState = heapSort.history[heapSort.history.length - 1];
      expect(lastState.type).toBe('final');
      expect(lastState.array).toEqual([2, 3, 4, 5, 8]);
    });
    
    test('provides detailed algorithm information', () => {
      // Arrange
      const heapSort = createDefaultHeapSort();
      
      // Act
      const info = heapSort.getInfo();
      
      // Assert
      expect(info.name).toBe('Heap Sort');
      expect(info.category).toBe('comparison');
      expect(info.properties.usesBinaryHeap).toBe(true);
      expect(info.complexity).toBeDefined();
      expect(info.stability).toBe(false);
      expect(info.inPlace).toBe(true);
      expect(info.advantages).toBeDefined();
      expect(info.disadvantages).toBeDefined();
    });
  });
});
