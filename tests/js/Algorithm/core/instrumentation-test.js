// tests/js/algorithms/core/instrumentation.test.js

/**
 * Comprehensive test suite for the Algorithm Instrumentation system
 * 
 * This suite validates the advanced instrumentation capabilities that enable
 * detailed analysis of algorithm behavior, including performance metrics,
 * memory access patterns, call stack tracking, and cache simulation.
 * 
 * The system under test provides critical observability into algorithm execution
 * that powers the visualizations and educational components of the platform.
 * 
 * @author Advanced Sorting Algorithm Visualization Platform
 */

import AlgorithmInstrumentation from '../../../../src/algorithms/core/instrumentation';

describe('Algorithm Instrumentation System', () => {
  // Utility function to create a fresh instrumentation instance
  const createInstrumentation = () => new AlgorithmInstrumentation();
  
  // Sample array for consistent testing
  const testArray = [5, 3, 8, 1, 4];
  
  /**
   * Basic Initialization and Reset
   * 
   * These tests verify proper instantiation and reset functionality.
   */
  describe('Initialization and Reset', () => {
    test('should initialize with zeroed metrics', () => {
      const instrumentation = createInstrumentation();
      
      // Verify basic operation metrics
      expect(instrumentation.metrics.comparisons).toBe(0);
      expect(instrumentation.metrics.swaps).toBe(0);
      expect(instrumentation.metrics.reads).toBe(0);
      expect(instrumentation.metrics.writes).toBe(0);
      expect(instrumentation.metrics.memoryAccesses).toBe(0);
      
      // Verify call stack metrics
      expect(instrumentation.metrics.functionCalls).toBe(0);
      expect(instrumentation.metrics.recursiveCalls).toBe(0);
      expect(instrumentation.metrics.recursionDepth).toBe(0);
      expect(instrumentation.metrics.maxRecursionDepth).toBe(0);
      
      // Verify timing metrics
      expect(instrumentation.metrics.startTime).toBe(0);
      expect(instrumentation.metrics.endTime).toBe(0);
      expect(instrumentation.metrics.executionTime).toBe(0);
      
      // Verify cache simulation metrics
      expect(instrumentation.cacheSimulation.cacheHits).toBe(0);
      expect(instrumentation.cacheSimulation.cacheMisses).toBe(0);
      expect(instrumentation.cacheSimulation.evictions).toBe(0);
    });
    
    test('should initialize with empty tracking structures', () => {
      const instrumentation = createInstrumentation();
      
      // Verify profile is initialized
      expect(instrumentation.profile.operationTimeline).toEqual([]);
      expect(instrumentation.profile.memoryUsageTimeline).toEqual([]);
      expect(instrumentation.profile.callStack).toEqual([]);
      expect(instrumentation.profile.hotspots).toEqual({});
      
      // Verify access patterns are initialized
      expect(instrumentation.accessPatterns.readIndices).toEqual([]);
      expect(instrumentation.accessPatterns.writeIndices).toEqual([]);
      expect(instrumentation.accessPatterns.accessFrequency).toEqual({});
      expect(instrumentation.accessPatterns.sequentialAccesses).toBe(0);
      expect(instrumentation.accessPatterns.randomAccesses).toBe(0);
      
      // Verify movement tracking is initialized
      expect(instrumentation.elementMovements.paths).toEqual({});
      expect(instrumentation.elementMovements.distances).toEqual({});
      expect(instrumentation.elementMovements.totalDistance).toBe(0);
      
      // Verify phase tracking is initialized
      expect(instrumentation.phases.current).toBe('initialization');
      expect(instrumentation.phases.transitions).toEqual([]);
      expect(Object.keys(instrumentation.phases.durations).length).toBe(0);
    });
    
    test('should reset to initial state', () => {
      const instrumentation = createInstrumentation();
      
      // Perform some operations to populate metrics
      instrumentation.trackComparison(1, 2, -1);
      instrumentation.trackSwap(testArray, 0, 1);
      instrumentation.trackFunctionCall('test', []);
      
      // Reset instrumentation
      instrumentation.reset();
      
      // Verify metrics are reset
      expect(instrumentation.metrics.comparisons).toBe(0);
      expect(instrumentation.metrics.swaps).toBe(0);
      expect(instrumentation.metrics.reads).toBe(0);
      expect(instrumentation.metrics.writes).toBe(0);
      expect(instrumentation.metrics.functionCalls).toBe(0);
      
      // Verify profile is reset
      expect(instrumentation.profile.operationTimeline).toEqual([]);
      expect(instrumentation.profile.callStack).toEqual([]);
      
      // Verify phase tracking is reset
      expect(instrumentation.phases.current).toBe('initialization');
      expect(instrumentation.phases.transitions).toEqual([]);
    });
  });
  
  /**
   * Basic Operation Tracking
   * 
   * These tests verify tracking of fundamental operations.
   */
  describe('Basic Operation Tracking', () => {
    test('should track comparison operations', () => {
      const instrumentation = createInstrumentation();
      
      // Track comparison operations
      instrumentation.trackComparison(5, 3, 1, { type: 'test' });
      instrumentation.trackComparison(3, 8, -1);
      
      // Verify metrics
      expect(instrumentation.metrics.comparisons).toBe(2);
      
      // Verify operation timeline
      expect(instrumentation.profile.operationTimeline.length).toBe(2);
      expect(instrumentation.profile.operationTimeline[0].type).toBe('comparison');
      expect(instrumentation.profile.operationTimeline[0].values).toEqual([5, 3]);
      expect(instrumentation.profile.operationTimeline[0].result).toBe(1);
      
      // Verify custom metadata is included
      expect(instrumentation.profile.operationTimeline[0].type).toBe('test');
    });
    
    test('should track swap operations', () => {
      const instrumentation = createInstrumentation();
      const array = [...testArray]; // Clone test array
      
      // Track swap operation
      instrumentation.trackSwap(array, 0, 2);
      
      // Verify metrics
      expect(instrumentation.metrics.swaps).toBe(1);
      expect(instrumentation.metrics.reads).toBe(2);
      expect(instrumentation.metrics.writes).toBe(2);
      expect(instrumentation.metrics.memoryAccesses).toBe(4);
      
      // Verify operation timeline
      expect(instrumentation.profile.operationTimeline.length).toBe(1);
      expect(instrumentation.profile.operationTimeline[0].type).toBe('swap');
      expect(instrumentation.profile.operationTimeline[0].indices).toEqual([0, 2]);
      
      // Verify element movements
      expect(instrumentation.elementMovements.totalDistance).toBe(4); // 2 elements moved 2 positions
      expect(instrumentation.elementMovements.paths[array[0]]).toEqual([2, 0]);
      expect(instrumentation.elementMovements.paths[array[2]]).toEqual([0, 2]);
    });
    
    test('should track read operations', () => {
      const instrumentation = createInstrumentation();
      
      // Track read operations
      const value1 = instrumentation.trackRead(testArray, 0);
      const value2 = instrumentation.trackRead(testArray, 1);
      
      // Verify returned values
      expect(value1).toBe(testArray[0]);
      expect(value2).toBe(testArray[1]);
      
      // Verify metrics
      expect(instrumentation.metrics.reads).toBe(2);
      expect(instrumentation.metrics.memoryAccesses).toBe(2);
      
      // Verify access patterns
      expect(instrumentation.accessPatterns.readIndices).toEqual([0, 1]);
      expect(instrumentation.accessPatterns.sequentialAccesses).toBe(1); // Sequential: 0 -> 1
      expect(instrumentation.accessPatterns.randomAccesses).toBe(0);
      
      // Verify frequency tracking
      expect(instrumentation.accessPatterns.accessFrequency[0]).toBe(1);
      expect(instrumentation.accessPatterns.accessFrequency[1]).toBe(1);
    });
    
    test('should track write operations', () => {
      const instrumentation = createInstrumentation();
      const array = [...testArray]; // Clone test array
      
      // Track write operations
      instrumentation.trackWrite(array, 0, 10);
      instrumentation.trackWrite(array, 2, 20);
      
      // Verify array is modified
      expect(array[0]).toBe(10);
      expect(array[2]).toBe(20);
      
      // Verify metrics
      expect(instrumentation.metrics.writes).toBe(2);
      expect(instrumentation.metrics.memoryAccesses).toBe(2);
      
      // Verify access patterns
      expect(instrumentation.accessPatterns.writeIndices).toEqual([0, 2]);
      expect(instrumentation.accessPatterns.randomAccesses).toBe(1); // Non-sequential: 0 -> 2
      
      // Verify element movement tracking
      expect(instrumentation.elementMovements.paths[10]).toEqual([0]);
      expect(instrumentation.elementMovements.paths[20]).toEqual([2]);
    });
    
    test('should detect sequential and random access patterns', () => {
      const instrumentation = createInstrumentation();
      
      // Sequential access pattern
      instrumentation.trackRead(testArray, 0);
      instrumentation.trackRead(testArray, 1);
      instrumentation.trackRead(testArray, 2);
      
      // Random access pattern
      instrumentation.trackRead(testArray, 4);
      instrumentation.trackRead(testArray, 1);
      
      // Verify pattern detection
      expect(instrumentation.accessPatterns.sequentialAccesses).toBe(2); // 0->1, 1->2
      expect(instrumentation.accessPatterns.randomAccesses).toBe(2); // 2->4, 4->1
    });
  });
  
  /**
   * Function Call Tracking
   * 
   * These tests verify tracking of function calls and the call stack.
   */
  describe('Function Call Tracking', () => {
    test('should track function calls and returns', () => {
      const instrumentation = createInstrumentation();
      
      // Track function calls
      instrumentation.trackFunctionCall('function1', [1, 2]);
      instrumentation.trackFunctionCall('function2', ['test']);
      instrumentation.trackFunctionReturn('function2', true);
      instrumentation.trackFunctionReturn('function1', 42);
      
      // Verify metrics
      expect(instrumentation.metrics.functionCalls).toBe(2);
      
      // Verify operation timeline
      const timeline = instrumentation.profile.operationTimeline;
      expect(timeline.length).toBe(4);
      expect(timeline[0].type).toBe('call');
      expect(timeline[0].function).toBe('function1');
      expect(timeline[1].type).toBe('call');
      expect(timeline[1].function).toBe('function2');
      expect(timeline[2].type).toBe('return');
      expect(timeline[2].function).toBe('function2');
      expect(timeline[3].type).toBe('return');
      expect(timeline[3].function).toBe('function1');
    });
    
    test('should track recursive calls and maintain recursion depth', () => {
      const instrumentation = createInstrumentation();
      
      // Track recursive function calls
      instrumentation.trackFunctionCall('recursiveFunc', [5], true);
      instrumentation.trackFunctionCall('recursiveFunc', [4], true);
      instrumentation.trackFunctionCall('recursiveFunc', [3], true);
      instrumentation.trackFunctionReturn('recursiveFunc', 3, true);
      instrumentation.trackFunctionReturn('recursiveFunc', 4, true);
      instrumentation.trackFunctionReturn('recursiveFunc', 5, true);
      
      // Verify metrics
      expect(instrumentation.metrics.functionCalls).toBe(3);
      expect(instrumentation.metrics.recursiveCalls).toBe(3);
      expect(instrumentation.metrics.maxRecursionDepth).toBe(3);
      expect(instrumentation.metrics.recursionDepth).toBe(0); // Back to zero after all returns
    });
    
    test('should maintain proper call stack', () => {
      const instrumentation = createInstrumentation();
      
      // Series of nested calls
      instrumentation.trackFunctionCall('main', []);
      instrumentation.trackFunctionCall('helper', []);
      instrumentation.trackFunctionCall('utility', []);
      
      // Verify call stack depth
      expect(instrumentation.profile.callStack.length).toBe(3);
      
      // Return from inner function
      instrumentation.trackFunctionReturn('utility', null);
      expect(instrumentation.profile.callStack.length).toBe(2);
      
      // Return from middle function
      instrumentation.trackFunctionReturn('helper', null);
      expect(instrumentation.profile.callStack.length).toBe(1);
      
      // Return from outer function
      instrumentation.trackFunctionReturn('main', null);
      expect(instrumentation.profile.callStack.length).toBe(0);
    });
    
    test('should handle call stack mismatch gracefully', () => {
      const instrumentation = createInstrumentation();
      
      // Log warning spy
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      // Correct call/return sequence
      instrumentation.trackFunctionCall('function1', []);
      instrumentation.trackFunctionReturn('function1', null);
      
      // Incorrect sequence - return wrong function
      instrumentation.trackFunctionCall('function2', []);
      instrumentation.trackFunctionReturn('function3', null);
      
      // Verify warning was logged
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Call stack mismatch'));
      
      consoleSpy.mockRestore();
    });
    
    test('should track hotspot statistics for functions', () => {
      const instrumentation = createInstrumentation();
      
      // Mock performance.now to return predictable values
      const originalNow = performance.now;
      let time = 1000;
      performance.now = jest.fn(() => {
        time += 100;
        return time;
      });
      
      // Track function calls with timing
      instrumentation.trackFunctionCall('hotFunc', []);
      instrumentation.trackFunctionReturn('hotFunc', null);
      
      instrumentation.trackFunctionCall('hotFunc', []);
      instrumentation.trackFunctionReturn('hotFunc', null);
      
      // Restore original performance.now
      performance.now = originalNow;
      
      // Verify hotspot tracking
      expect(instrumentation.profile.hotspots).toHaveProperty('hotFunc');
      expect(instrumentation.profile.hotspots.hotFunc.calls).toBe(2);
      expect(instrumentation.profile.hotspots.hotFunc.totalTime).toBeGreaterThan(0);
      expect(instrumentation.profile.hotspots.hotFunc.minTime).toBeLessThanOrEqual(
        instrumentation.profile.hotspots.hotFunc.maxTime
      );
    });
  });
  
  /**
   * Branch and Condition Tracking
   * 
   * These tests verify tracking of branch operations and condition outcomes.
   */
  describe('Branch and Condition Tracking', () => {
    test('should track branch operations', () => {
      const instrumentation = createInstrumentation();
      
      // Track branch operations
      instrumentation.trackBranch(true, { location: 'if-block-1' });
      instrumentation.trackBranch(false, { location: 'if-block-2' });
      instrumentation.trackBranch(true, { location: 'while-loop' });
      
      // Verify metrics
      expect(instrumentation.metrics.branches).toBe(3);
      expect(instrumentation.metrics.branchHits.true).toBe(2);
      expect(instrumentation.metrics.branchHits.false).toBe(1);
      
      // Verify operation timeline
      expect(instrumentation.profile.operationTimeline.length).toBe(3);
      expect(instrumentation.profile.operationTimeline[0].type).toBe('branch');
      expect(instrumentation.profile.operationTimeline[0].condition).toBe(true);
      expect(instrumentation.profile.operationTimeline[0].location).toBe('if-block-1');
    });
    
    test('should calculate branch predictability', () => {
      const instrumentation = createInstrumentation();
      
      // Track branches with varying predictability
      for (let i = 0; i < 8; i++) {
        instrumentation.trackBranch(i % 2 === 0); // Alternating true/false
      }
      
      // Generate report
      const report = instrumentation.generateReport();
      
      // Verify predictability metric
      expect(report.performance.branchPredictability).toBe(0.5); // 4 true / 8 total
    });
  });
  
  /**
   * Memory Management Tracking
   * 
   * These tests verify tracking of memory allocation and deallocation.
   */
  describe('Memory Management Tracking', () => {
    test('should track memory allocation and deallocation', () => {
      const instrumentation = createInstrumentation();
      
      // Track memory operations
      instrumentation.trackMemoryAllocation(100, 'auxiliary array');
      instrumentation.trackMemoryAllocation(50, 'temp variable');
      instrumentation.trackMemoryDeallocation(50, 'temp variable');
      
      // Verify metrics
      expect(instrumentation.metrics.auxiliarySpace).toBe(150);
      expect(instrumentation.metrics.memoryUsage).toBe(100); // 150 allocated - 50 deallocated
      
      // Verify timeline
      expect(instrumentation.profile.memoryUsageTimeline.length).toBe(3);
      expect(instrumentation.profile.memoryUsageTimeline[0].operation).toBe('allocate');
      expect(instrumentation.profile.memoryUsageTimeline[0].bytes).toBe(100);
      expect(instrumentation.profile.memoryUsageTimeline[0].purpose).toBe('auxiliary array');
      expect(instrumentation.profile.memoryUsageTimeline[2].operation).toBe('deallocate');
    });
  });
  
  /**
   * Phase Tracking
   * 
   * These tests verify tracking of algorithm execution phases.
   */
  describe('Phase Tracking', () => {
    test('should track algorithm phases and transitions', () => {
      const instrumentation = createInstrumentation();
      
      // Mock performance.now to return predictable values
      const originalNow = performance.now;
      let time = 1000;
      performance.now = jest.fn(() => {
        time += 100;
        return time;
      });
      
      // Track phase transitions
      instrumentation.setPhase('initialization');
      instrumentation.setPhase('sorting');
      instrumentation.setPhase('merging');
      instrumentation.setPhase('completed');
      
      // Restore original performance.now
      performance.now = originalNow;
      
      // Verify phase tracking
      expect(instrumentation.phases.current).toBe('completed');
      expect(instrumentation.phases.transitions.length).toBe(4);
      expect(instrumentation.phases.transitions[1].phase).toBe('sorting');
      expect(instrumentation.phases.transitions[1].previousPhase).toBe('initialization');
      
      // Verify durations are tracked
      expect(Object.keys(instrumentation.phases.durations).length).toBe(3); // All phases except current
      expect(instrumentation.phases.durations.initialization).toBeGreaterThan(0);
      expect(instrumentation.phases.durations.sorting).toBeGreaterThan(0);
      expect(instrumentation.phases.durations.merging).toBeGreaterThan(0);
    });
    
    test('should not record duplicate phase transitions', () => {
      const instrumentation = createInstrumentation();
      
      // Track with duplicate phases
      instrumentation.setPhase('phase1');
      instrumentation.setPhase('phase1'); // Duplicate
      instrumentation.setPhase('phase2');
      
      // Verify only unique transitions recorded
      expect(instrumentation.phases.transitions.length).toBe(2);
      expect(instrumentation.phases.transitions[0].phase).toBe('phase1');
      expect(instrumentation.phases.transitions[1].phase).toBe('phase2');
    });
  });
  
  /**
   * Cache Simulation
   * 
   * These tests verify the cache behavior simulation.
   */
  describe('Cache Simulation', () => {
    test('should simulate cache hits and misses', () => {
      const instrumentation = createInstrumentation();
      
      // First access - cache miss
      instrumentation.simulateCacheAccess(0, 'read');
      
      // Same index - cache hit
      instrumentation.simulateCacheAccess(0, 'read');
      
      // Different index - cache miss
      instrumentation.simulateCacheAccess(1, 'read');
      
      // Verify cache metrics
      expect(instrumentation.cacheSimulation.cacheHits).toBe(1);
      expect(instrumentation.cacheSimulation.cacheMisses).toBe(2);
    });
    
    test('should implement LRU eviction policy when cache is full', () => {
      const instrumentation = createInstrumentation();
      
      // Override cache size for testing
      instrumentation.cacheSimulation.cacheSize = 2;
      
      // Fill cache
      instrumentation.simulateCacheAccess(0, 'read');
      instrumentation.simulateCacheAccess(1, 'read');
      
      // Access index 0 to make it most recently used
      instrumentation.simulateCacheAccess(0, 'read');
      
      // Access index 2, should evict index 1 (least recently used)
      instrumentation.simulateCacheAccess(2, 'read');
      
      // Verify cache state
      expect(instrumentation.cacheSimulation.cache.has('0')).toBe(true); // Still in cache
      expect(instrumentation.cacheSimulation.cache.has('1')).toBe(false); // Evicted
      expect(instrumentation.cacheSimulation.cache.has('2')).toBe(true); // Added to cache
      expect(instrumentation.cacheSimulation.evictions).toBe(1);
      
      // Now access index 1 again, should be a miss
      instrumentation.simulateCacheAccess(1, 'read');
      expect(instrumentation.cacheSimulation.cacheMisses).toBe(3); // 0, 1, 2 initially + 1 again
    });
    
    test('should generate cache hit rate metrics', () => {
      const instrumentation = createInstrumentation();
      
      // Create specific hit/miss pattern
      instrumentation.simulateCacheAccess(0, 'read'); // Miss
      instrumentation.simulateCacheAccess(1, 'read'); // Miss
      instrumentation.simulateCacheAccess(0, 'read'); // Hit
      instrumentation.simulateCacheAccess(1, 'read'); // Hit
      instrumentation.simulateCacheAccess(2, 'read'); // Miss
      
      // Generate report
      const report = instrumentation.generateReport();
      
      // Verify cache hit rate
      expect(report.performance.cacheHitRate).toBe(0.4); // 2 hits / 5 total
    });
  });
  
  /**
   * Report Generation
   * 
   * These tests verify the generation of comprehensive reports.
   */
  describe('Report Generation', () => {
    test('should generate comprehensive analysis report', () => {
      const instrumentation = createInstrumentation();
      
      // Perform various operations to populate metrics
      instrumentation.trackComparison(1, 2, -1);
      instrumentation.trackSwap(testArray, 0, 1);
      instrumentation.trackRead(testArray, 2);
      instrumentation.trackWrite(testArray, 3, 10);
      instrumentation.trackBranch(true);
      
      // Generate report
      const report = instrumentation.generateReport();
      
      // Verify report structure
      expect(report).toHaveProperty('metrics');
      expect(report).toHaveProperty('performance');
      expect(report).toHaveProperty('accessPatterns');
      expect(report).toHaveProperty('movementEfficiency');
      expect(report).toHaveProperty('phaseAnalysis');
      expect(report).toHaveProperty('profile');
      expect(report).toHaveProperty('efficiency');
      
      // Verify key metrics are present
      expect(report.metrics.comparisons).toBe(1);
      expect(report.metrics.swaps).toBe(1);
      expect(report.metrics.reads).toBe(3); // 1 explicit + 2 from swap
      expect(report.metrics.writes).toBe(3); // 1 explicit + 2 from swap
      
      // Verify derived metrics are calculated
      expect(report.performance.operationsPerSecond).toBeGreaterThanOrEqual(0);
      expect(report.performance.averageTimePerOperation).toBeGreaterThanOrEqual(0);
      
      // Verify work metric is calculated
      expect(report.efficiency.workDone).toBeGreaterThan(0);
    });
    
    test('should identify access patterns and hotspots', () => {
      const instrumentation = createInstrumentation();
      
      // Create specific access patterns
      for (let i = 0; i < 5; i++) {
        instrumentation.trackRead(testArray, 2); // Access index 2 multiple times
        instrumentation.trackRead(testArray, i); // Access each index once
      }
      
      // Generate report
      const report = instrumentation.generateReport();
      
      // Verify access pattern analysis
      expect(report.accessPatterns.mostAccessedIndices.length).toBeGreaterThan(0);
      
      // Index 2 should be the most accessed
      expect(report.accessPatterns.mostAccessedIndices[0].index).toBe(2);
      expect(report.accessPatterns.mostAccessedIndices[0].count).toBe(6); // 5 direct + 1 in loop
      
      // Verify hotspots are identified
      expect(report.accessPatterns.hotspots.length).toBeGreaterThan(0);
    });
    
    test('should track element movement distances', () => {
      const instrumentation = createInstrumentation();
      const array = [1, 2, 3, 4, 5];
      
      // Create specific movement pattern
      instrumentation.trackSwap(array, 0, 4); // Move elements by 4 positions
      instrumentation.trackSwap(array, 1, 3); // Move elements by 2 positions
      
      // Generate report
      const report = instrumentation.generateReport();
      
      // Verify movement analysis
      expect(report.movementEfficiency.totalDistance).toBe(12); // (4*2) + (2*2)
      expect(report.movementEfficiency.averageDistance).toBe(3); // 12/4 elements
      expect(report.movementEfficiency.farthestMovingElements.length).toBeGreaterThan(0);
      
      // Elements that moved farthest should be first
      expect(report.movementEfficiency.farthestMovingElements[0].distance).toBe(4);
    });
  });
  
  /**
   * Integration Tests
   * 
   * These tests verify instrumentation behavior in realistic scenarios.
   */
  describe('Integration Tests', () => {
    test('should work with bubble sort operations', () => {
      const instrumentation = createInstrumentation();
      const array = [5, 3, 8, 1, 4];
      
      // Simulate bubble sort pass
      instrumentation.setPhase('sorting');
      
      for (let i = 0; i < array.length - 1; i++) {
        // Compare adjacent elements
        const comparison = instrumentation.trackComparison(array[i], array[i + 1], 
          array[i] > array[i + 1] ? 1 : -1);
        
        // Swap if needed
        if (comparison > 0) {
          instrumentation.trackSwap(array, i, i + 1);
        }
      }
      
      instrumentation.setPhase('completed');
      
      // Generate report
      const report = instrumentation.generateReport();
      
      // Verify correct instrumentation
      expect(report.metrics.comparisons).toBe(4); // n-1 comparisons
      expect(array).toEqual([3, 5, 1, 4, 8]); // Partially sorted after one pass
      
      // Verify phase timing
      expect(report.phaseAnalysis.phases.sorting).toBeGreaterThan(0);
    });
    
    test('should work with merge sort operations', () => {
      const instrumentation = createInstrumentation();
      
      // Simulate merge operation of two sorted halves
      const left = [1, 5];
      const right = [2, 8];
      const merged = [];
      
      instrumentation.setPhase('merging');
      
      let i = 0, j = 0;
      
      // Merge with instrumentation
      while (i < left.length && j < right.length) {
        // Compare elements from both arrays
        const comparison = instrumentation.trackComparison(left[i], right[j],
          left[i] <= right[j] ? -1 : 1);
        
        if (comparison <= 0) {
          // Take from left array
          merged.push(instrumentation.trackRead(left, i));
          i++;
        } else {
          // Take from right array
          merged.push(instrumentation.trackRead(right, j));
          j++;
        }
      }
      
      // Add remaining elements
      while (i < left.length) {
        merged.push(instrumentation.trackRead(left, i));
        i++;
      }
      
      while (j < right.length) {
        merged.push(instrumentation.trackRead(right, j));
        j++;
      }
      
      instrumentation.setPhase('completed');
      
      // Verify results
      expect(merged).toEqual([1, 2, 5, 8]);
      
      // Generate report
      const report = instrumentation.generateReport();
      
      // Verify metrics
      expect(report.metrics.comparisons).toBe(3); // Number of comparisons in merge
    });
  });
});
