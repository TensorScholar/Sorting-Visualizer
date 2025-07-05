// tests/js/algorithms/core/algorithm-base.test.js

/**
 * Comprehensive test suite for the Algorithm base class
 * 
 * This suite validates the foundational behavior of the abstract Algorithm class
 * that serves as the basis for all sorting algorithm implementations. It ensures
 * correctness of initialization, instrumentation, lifecycle management, and proper
 * abstraction enforcement.
 * 
 * @author Advanced Sorting Algorithm Visualization Platform
 */

import Algorithm from '../../../../src/algorithms/core/algorithm-base';

// Mock implementation of Algorithm for testing abstract class
class MockAlgorithm extends Algorithm {
  constructor(options = {}) {
    super('Mock Algorithm', 'test', options);
  }
  
  run(array, options) {
    // Simple implementation that just records array state at each step
    for (let i = 0; i < array.length - 1; i++) {
      this.recordState(array, { type: 'test', index: i });
      
      if (this.compare(array[i], array[i + 1]) > 0) {
        this.swap(array, i, i + 1);
      }
    }
    return array;
  }
  
  getComplexity() {
    return {
      time: {
        best: 'O(n)',
        average: 'O(n²)',
        worst: 'O(n²)'
      },
      space: {
        best: 'O(1)',
        average: 'O(1)',
        worst: 'O(1)'
      }
    };
  }
  
  isStable() {
    return true;
  }
  
  isInPlace() {
    return true;
  }
}

describe('Algorithm Base Class', () => {
  // Utility function to create a properly instrumented algorithm instance
  const createAlgorithm = (options = {}) => new MockAlgorithm(options);
  
  // Test data sets with various characteristics
  const testArrays = {
    empty: [],
    singleElement: [5],
    sorted: [1, 2, 3, 4, 5],
    reversed: [5, 4, 3, 2, 1],
    duplicate: [3, 1, 4, 1, 5, 9],
    random: [8, 4, 6, 2, 9, 5, 1, 7, 3]
  };
  
  /**
   * Initialization and Configuration
   * 
   * These tests verify proper instantiation and default values of the algorithm class.
   */
  describe('Initialization and Configuration', () => {
    test('should initialize with correct defaults', () => {
      const algorithm = createAlgorithm();
      
      // Verify basic properties
      expect(algorithm.name).toBe('Mock Algorithm');
      expect(algorithm.category).toBe('test');
      expect(algorithm.options).toEqual(expect.objectContaining({
        trackMemoryAccess: true,
        trackOperations: true,
        recordHistory: true
      }));
      
      // Verify metrics initialization
      expect(algorithm.metrics).toEqual(expect.objectContaining({
        comparisons: 0,
        swaps: 0,
        reads: 0,
        writes: 0,
        memoryAccesses: 0,
        recursiveCalls: 0,
        auxiliarySpace: 0
      }));
      
      // Verify state
      expect(algorithm.history).toEqual([]);
      expect(algorithm.currentStep).toBe(0);
      expect(algorithm.isRunning).toBe(false);
      expect(algorithm.isComplete).toBe(false);
    });
    
    test('should override default options with provided options', () => {
      const customOptions = {
        trackMemoryAccess: false,
        recordHistory: false,
        animationSpeed: 2,
        customOption: 'value'
      };
      
      const algorithm = createAlgorithm(customOptions);
      
      // Verify options override
      expect(algorithm.options.trackMemoryAccess).toBe(false);
      expect(algorithm.options.recordHistory).toBe(false);
      expect(algorithm.options.animationSpeed).toBe(2);
      expect(algorithm.options.customOption).toBe('value');
      
      // Verify untouched defaults remain
      expect(algorithm.options.trackOperations).toBe(true);
    });
    
    test('should enforce implementation of abstract methods', () => {
      class IncompleteAlgorithm extends Algorithm {
        constructor() {
          super('Incomplete', 'test');
        }
        // Missing required method implementations
      }
      
      const incomplete = new IncompleteAlgorithm();
      
      // Should throw when abstract methods are called
      expect(() => incomplete.run([], {})).toThrow('Method run() must be implemented by subclass');
      expect(() => incomplete.getComplexity()).toThrow(); // Implementation-specific error message
      expect(() => incomplete.isStable()).toThrow(); // Implementation-specific error message
      expect(() => incomplete.isInPlace()).toThrow(); // Implementation-specific error message
    });
  });
  
  /**
   * Algorithm Lifecycle Methods
   * 
   * These tests verify the core algorithm execution lifecycle.
   */
  describe('Algorithm Lifecycle Methods', () => {
    test('should reset algorithm state correctly', () => {
      const algorithm = createAlgorithm();
      
      // Run algorithm to populate metrics and history
      algorithm.execute(testArrays.random);
      
      // Verify state is populated
      expect(algorithm.metrics.comparisons).toBeGreaterThan(0);
      expect(algorithm.history.length).toBeGreaterThan(0);
      
      // Reset algorithm
      algorithm.reset();
      
      // Verify reset state
      expect(algorithm.metrics.comparisons).toBe(0);
      expect(algorithm.metrics.swaps).toBe(0);
      expect(algorithm.metrics.reads).toBe(0);
      expect(algorithm.metrics.writes).toBe(0);
      expect(algorithm.history).toEqual([]);
      expect(algorithm.currentStep).toBe(0);
      expect(algorithm.isRunning).toBe(false);
      expect(algorithm.isComplete).toBe(false);
    });
    
    test('should execute algorithm and track metrics', () => {
      const algorithm = createAlgorithm();
      
      // Execute algorithm
      const result = algorithm.execute(testArrays.reversed);
      
      // Verify execution state
      expect(algorithm.isRunning).toBe(false);
      expect(algorithm.isComplete).toBe(true);
      
      // Verify metrics were tracked
      expect(algorithm.metrics.comparisons).toBeGreaterThan(0);
      expect(algorithm.metrics.swaps).toBeGreaterThan(0);
      expect(algorithm.metrics.executionTime).toBeGreaterThan(0);
      
      // Verify result is sorted
      for (let i = 1; i < result.length; i++) {
        expect(result[i - 1]).toBeLessThanOrEqual(result[i]);
      }
    });
    
    test('should handle empty arrays', () => {
      const algorithm = createAlgorithm();
      
      // Execute algorithm on empty array
      const result = algorithm.execute([]);
      
      // Should not error and return empty array
      expect(result).toEqual([]);
      expect(algorithm.isComplete).toBe(true);
    });
    
    test('should handle single-element arrays', () => {
      const algorithm = createAlgorithm();
      
      // Execute algorithm on single-element array
      const result = algorithm.execute([42]);
      
      // Should not error and return the same array
      expect(result).toEqual([42]);
      expect(algorithm.isComplete).toBe(true);
    });
    
    test('should not modify the original array', () => {
      const algorithm = createAlgorithm();
      
      // Create test array and copy for comparison
      const original = [...testArrays.reversed];
      
      // Execute algorithm
      algorithm.execute(original);
      
      // Verify original array was not modified
      expect(original).toEqual(testArrays.reversed);
    });
    
    test('should merge additional options with defaults during execution', () => {
      const algorithm = createAlgorithm({ 
        trackOperations: true,
        customOption: 'default'
      });
      
      // Create spy to monitor options passed to run
      const runSpy = jest.spyOn(algorithm, 'run');
      
      // Execute with runtime options
      algorithm.execute(testArrays.random, { 
        customOption: 'runtime',
        runtimeOption: true 
      });
      
      // Verify options were merged correctly
      expect(runSpy).toHaveBeenCalledWith(
        expect.any(Array),
        expect.objectContaining({
          trackOperations: true,
          customOption: 'runtime',
          runtimeOption: true
        })
      );
      
      runSpy.mockRestore();
    });
  });
  
  /**
   * Basic Operations Testing
   * 
   * These tests verify the fundamental array operations used by algorithms.
   */
  describe('Basic Array Operations', () => {
    test('compare operation should increment comparisons counter', () => {
      const algorithm = createAlgorithm();
      
      // Perform comparisons
      const result1 = algorithm.compare(1, 2);
      const result2 = algorithm.compare(2, 1);
      const result3 = algorithm.compare(1, 1);
      
      // Verify comparison results
      expect(result1).toBeLessThan(0);
      expect(result2).toBeGreaterThan(0);
      expect(result3).toBe(0);
      
      // Verify metrics
      expect(algorithm.metrics.comparisons).toBe(3);
    });
    
    test('swap operation should interchange elements and update metrics', () => {
      const algorithm = createAlgorithm();
      const array = [1, 2, 3];
      
      // Perform swap
      algorithm.swap(array, 0, 2);
      
      // Verify array state
      expect(array).toEqual([3, 2, 1]);
      
      // Verify metrics
      expect(algorithm.metrics.swaps).toBe(1);
      expect(algorithm.metrics.reads).toBe(2);
      expect(algorithm.metrics.writes).toBe(2);
      expect(algorithm.metrics.memoryAccesses).toBe(4);
    });
    
    test('read operation should retrieve element and update metrics', () => {
      const algorithm = createAlgorithm();
      const array = [1, 2, 3];
      
      // Perform read
      const value = algorithm.read(array, 1);
      
      // Verify value
      expect(value).toBe(2);
      
      // Verify metrics
      expect(algorithm.metrics.reads).toBe(1);
      expect(algorithm.metrics.memoryAccesses).toBe(1);
    });
    
    test('write operation should update element and metrics', () => {
      const algorithm = createAlgorithm();
      const array = [1, 2, 3];
      
      // Perform write
      algorithm.write(array, 1, 5);
      
      // Verify array state
      expect(array).toEqual([1, 5, 3]);
      
      // Verify metrics
      expect(algorithm.metrics.writes).toBe(1);
      expect(algorithm.metrics.memoryAccesses).toBe(1);
    });
    
    test('should support custom comparator functions', () => {
      const algorithm = createAlgorithm();
      
      // Custom comparator that sorts in descending order
      const descendingComparator = (a, b) => b - a;
      
      // Test with custom comparator
      const result1 = algorithm.compare(1, 2, descendingComparator);
      const result2 = algorithm.compare(2, 1, descendingComparator);
      
      // Verify comparison results (opposite of default)
      expect(result1).toBeGreaterThan(0); // Descending: 1 comes after 2
      expect(result2).toBeLessThan(0);    // Descending: 2 comes before 1
    });
  });
  
  /**
   * State Recording and History
   * 
   * These tests verify the state recording and history tracking functionality.
   */
  describe('State Recording and History', () => {
    test('should record state during algorithm execution', () => {
      const algorithm = createAlgorithm();
      
      // Execute algorithm
      algorithm.execute(testArrays.random);
      
      // Verify history was recorded
      expect(algorithm.history.length).toBeGreaterThan(0);
      
      // Verify history entry structure
      const entry = algorithm.history[0];
      expect(entry).toHaveProperty('array');
      expect(entry).toHaveProperty('metrics');
      expect(entry).toHaveProperty('timestamp');
    });
    
    test('should include initial and final states in history', () => {
      const algorithm = createAlgorithm();
      const testArray = [...testArrays.reversed];
      
      // Execute algorithm
      const result = algorithm.execute(testArray);
      
      // Verify initial state
      expect(algorithm.history[0].array).toEqual(testArray);
      expect(algorithm.history[0].type).toBe('initial');
      
      // Verify final state
      const lastIndex = algorithm.history.length - 1;
      expect(algorithm.history[lastIndex].array).toEqual(result);
      expect(algorithm.history[lastIndex].type).toBe('final');
    });
    
    test('should not record history when disabled in options', () => {
      const algorithm = createAlgorithm({ recordHistory: false });
      
      // Execute algorithm
      algorithm.execute(testArrays.random);
      
      // Verify no history was recorded
      expect(algorithm.history.length).toBe(0);
    });
    
    test('should retrieve specific step from history', () => {
      const algorithm = createAlgorithm();
      
      // Execute algorithm
      algorithm.execute(testArrays.random);
      
      // Get middle step
      const stepIndex = Math.floor(algorithm.history.length / 2);
      const step = algorithm.getStep(stepIndex);
      
      // Verify step retrieval
      expect(step).toEqual(algorithm.history[stepIndex]);
      expect(algorithm.currentStep).toBe(stepIndex);
    });
    
    test('should handle invalid step indices', () => {
      const algorithm = createAlgorithm();
      
      // Execute algorithm
      algorithm.execute(testArrays.random);
      
      // Test invalid indices
      expect(algorithm.getStep(-1)).toBeNull();
      expect(algorithm.getStep(1000)).toBeNull();
    });
    
    test('should include custom metadata in recorded state', () => {
      const algorithm = createAlgorithm();
      const array = [1, 2, 3];
      const metadata = {
        type: 'custom',
        message: 'Custom state',
        someValue: 42
      };
      
      // Record state with metadata
      algorithm.recordState(array, metadata);
      
      // Verify state was recorded with metadata
      expect(algorithm.history.length).toBe(1);
      expect(algorithm.history[0].type).toBe('custom');
      expect(algorithm.history[0].message).toBe('Custom state');
      expect(algorithm.history[0].someValue).toBe(42);
    });
  });
  
  /**
   * Event System
   * 
   * These tests verify the event handling system.
   */
  describe('Event System', () => {
    test('should register and trigger event listeners', () => {
      const algorithm = createAlgorithm();
      
      // Create mock event handlers
      const stepHandler = jest.fn();
      const comparisonHandler = jest.fn();
      const swapHandler = jest.fn();
      const completeHandler = jest.fn();
      
      // Register event handlers
      algorithm.on('step', stepHandler);
      algorithm.on('comparison', comparisonHandler);
      algorithm.on('swap', swapHandler);
      algorithm.on('complete', completeHandler);
      
      // Execute algorithm
      algorithm.execute(testArrays.random);
      
      // Verify handlers were called
      expect(stepHandler).toHaveBeenCalled();
      expect(comparisonHandler).toHaveBeenCalled();
      expect(swapHandler).toHaveBeenCalled();
      expect(completeHandler).toHaveBeenCalled();
    });
    
    test('should pass correct event data to handlers', () => {
      const algorithm = createAlgorithm();
      
      // Create mock event handlers
      const comparisonHandler = jest.fn();
      const swapHandler = jest.fn();
      
      // Register event handlers
      algorithm.on('comparison', comparisonHandler);
      algorithm.on('swap', swapHandler);
      
      // Perform operations
      const array = [5, 2];
      algorithm.compare(array[0], array[1]);
      algorithm.swap(array, 0, 1);
      
      // Verify comparison event data
      expect(comparisonHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          a: 5,
          b: 2,
          result: expect.any(Number)
        })
      );
      
      // Verify swap event data
      expect(swapHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          indices: [0, 1],
          values: [2, 5]
        })
      );
    });
    
    test('should chain event registration calls', () => {
      const algorithm = createAlgorithm();
      
      // Create mock event handlers
      const handler1 = jest.fn();
      const handler2 = jest.fn();
      
      // Chain registration calls
      algorithm
        .on('step', handler1)
        .on('swap', handler2);
      
      // Verify chain returns algorithm instance
      expect(algorithm.on('comparison', jest.fn())).toBe(algorithm);
      
      // Execute algorithm
      algorithm.execute([3, 1, 2]);
      
      // Verify handlers were called
      expect(handler1).toHaveBeenCalled();
      expect(handler2).toHaveBeenCalled();
    });
    
    test('should handle multiple listeners for same event', () => {
      const algorithm = createAlgorithm();
      
      // Create mock event handlers
      const handler1 = jest.fn();
      const handler2 = jest.fn();
      
      // Register multiple handlers for same event
      algorithm.on('step', handler1);
      algorithm.on('step', handler2);
      
      // Execute algorithm
      algorithm.execute([3, 1, 2]);
      
      // Verify both handlers were called
      expect(handler1).toHaveBeenCalled();
      expect(handler2).toHaveBeenCalled();
      
      // Verify they were called same number of times
      expect(handler1.mock.calls.length).toBe(handler2.mock.calls.length);
    });
    
    test('should ignore unknown event types', () => {
      const algorithm = createAlgorithm();
      
      // Should not throw when registering unknown event
      expect(() => {
        algorithm.on('unknownEvent', jest.fn());
      }).not.toThrow();
      
      // Should not throw when emitting unknown event
      expect(() => {
        algorithm.emit('unknownEvent', {});
      }).not.toThrow();
    });
  });
  
  /**
   * Algorithm Metadata
   * 
   * These tests verify the metadata and information methods.
   */
  describe('Algorithm Metadata', () => {
    test('should return correct algorithm information', () => {
      const algorithm = createAlgorithm();
      
      // Get algorithm info
      const info = algorithm.getInfo();
      
      // Verify info structure
      expect(info).toHaveProperty('name', 'Mock Algorithm');
      expect(info).toHaveProperty('category', 'test');
      expect(info).toHaveProperty('metrics');
      expect(info).toHaveProperty('complexity');
      expect(info).toHaveProperty('stability');
      expect(info).toHaveProperty('inPlace');
      
      // Verify complexity info
      expect(info.complexity).toHaveProperty('time');
      expect(info.complexity).toHaveProperty('space');
      expect(info.complexity.time).toHaveProperty('best');
      expect(info.complexity.time).toHaveProperty('average');
      expect(info.complexity.time).toHaveProperty('worst');
    });
    
    test('should report correct stability property', () => {
      const stableAlgorithm = createAlgorithm();
      expect(stableAlgorithm.isStable()).toBe(true);
      
      // Mock unstable algorithm
      class UnstableAlgorithm extends MockAlgorithm {
        isStable() {
          return false;
        }
      }
      
      const unstableAlgorithm = new UnstableAlgorithm();
      expect(unstableAlgorithm.isStable()).toBe(false);
    });
    
    test('should report correct in-place property', () => {
      const inPlaceAlgorithm = createAlgorithm();
      expect(inPlaceAlgorithm.isInPlace()).toBe(true);
      
      // Mock not-in-place algorithm
      class NotInPlaceAlgorithm extends MockAlgorithm {
        isInPlace() {
          return false;
        }
      }
      
      const notInPlaceAlgorithm = new NotInPlaceAlgorithm();
      expect(notInPlaceAlgorithm.isInPlace()).toBe(false);
    });
    
    test('should report correct complexity information', () => {
      const algorithm = createAlgorithm();
      
      // Get complexity info
      const complexity = algorithm.getComplexity();
      
      // Verify complexity structure
      expect(complexity.time.best).toBe('O(n)');
      expect(complexity.time.average).toBe('O(n²)');
      expect(complexity.time.worst).toBe('O(n²)');
      expect(complexity.space.best).toBe('O(1)');
      expect(complexity.space.average).toBe('O(1)');
      expect(complexity.space.worst).toBe('O(1)');
    });
  });
});
