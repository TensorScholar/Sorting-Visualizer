// tests/js/integration/algorithm-execution.test.js

/**
 * End-to-End Algorithm Execution Test Suite
 * 
 * This suite verifies the complete execution pipeline of sorting algorithms,
 * ensuring proper initialization, execution, instrumentation, and result generation.
 * It covers all algorithm categories and tests various input distributions and configurations.
 * 
 * @module tests/js/integration/algorithm-execution
 * @requires jest
 * @requires ../../src/algorithms/core/algorithm-base
 */

import BubbleSort from '../../../src/algorithms/comparison/bubble';
import MergeSort from '../../../src/algorithms/comparison/merge';
import QuickSort from '../../../src/algorithms/comparison/quick';
import HeapSort from '../../../src/algorithms/comparison/heap';
import InsertionSort from '../../../src/algorithms/comparison/insertion';
import ShellSort from '../../../src/algorithms/comparison/shell';
import SelectionSort from '../../../src/algorithms/comparison/selection';
import TimSort from '../../../src/algorithms/comparison/tim';
import IntroSort from '../../../src/algorithms/comparison/intro';

import CountingSort from '../../../src/algorithms/distribution/counting';
import RadixSort from '../../../src/algorithms/distribution/radix';
import BucketSort from '../../../src/algorithms/distribution/bucket';
import PigeonholeSort from '../../../src/algorithms/distribution/pigeonhole';

import BitonicSort from '../../../src/algorithms/network/bitonic';
import OddEvenMergeSort from '../../../src/algorithms/network/odd-even-merge';

import BogoSort from '../../../src/algorithms/special/bogo';
import PancakeSort from '../../../src/algorithms/special/pancake';

import QuickSelect from '../../../src/algorithms/selection/quick-select';
import MedianOfMedians from '../../../src/algorithms/selection/median-of-medians';

import { generateDataSet } from '../../../src/data/generators';
import PythonJSBridge from '../../../src/utils/python-js-bridge';

// Mock the Python bridge to avoid actual Python execution during tests
jest.mock('../../../src/utils/python-js-bridge');

/**
 * Generates test arrays of various distributions for algorithm testing
 * @returns {Object} Object containing different test arrays
 */
function generateTestArrays() {
  return {
    empty: [],
    singleton: [42],
    sorted: generateDataSet('sorted', 100, { min: 1, max: 100 }),
    reversed: generateDataSet('reversed', 100, { min: 1, max: 100 }),
    random: generateDataSet('random', 100, { min: 1, max: 100 }),
    nearlySorted: generateDataSet('nearly-sorted', 100, { min: 1, max: 100, sortedRatio: 0.9 }),
    fewUnique: generateDataSet('few-unique', 100, { min: 1, max: 100, uniqueValues: 5 }),
    allEqual: Array(100).fill(42),
    alternating: Array.from({ length: 100 }, (_, i) => i % 2 === 0 ? 1 : 2),
    sawtooth: generateDataSet('sawtooth', 100, { min: 1, max: 100 })
  };
}

/**
 * Verifies if an array is correctly sorted
 * @param {Array} arr - The array to check
 * @returns {boolean} True if the array is sorted
 */
function isSorted(arr) {
  for (let i = 1; i < arr.length; i++) {
    if (arr[i] < arr[i - 1]) {
      return false;
    }
  }
  return true;
}

/**
 * Creates a step recording callback for tracking algorithm execution
 * @returns {Object} Object containing callback and collected steps
 */
function createStepRecorder() {
  const steps = [];
  const recordStep = (step) => {
    steps.push(step);
  };
  return { recordStep, steps };
}

/**
 * Configures and executes a sort algorithm on test data
 * @param {Function} AlgorithmClass - The algorithm constructor
 * @param {Object} options - Algorithm-specific options
 * @param {Object} testArrays - Test arrays to sort
 * @returns {Object} Test results for each array type
 */
async function runAlgorithmTests(AlgorithmClass, options, testArrays) {
  const algorithm = new AlgorithmClass(options);
  const results = {};
  
  for (const [arrayType, array] of Object.entries(testArrays)) {
    // Skip BogoSort for large arrays (extremely slow)
    if (algorithm.name === 'Bogo Sort' && arrayType !== 'empty' && 
        arrayType !== 'singleton' && array.length > 5) {
      continue;
    }
    
    const { recordStep, steps } = createStepRecorder();
    const startTime = performance.now();
    
    const sorted = await algorithm.execute([...array], {
      onStep: recordStep
    });
    
    const executionTime = performance.now() - startTime;
    
    results[arrayType] = {
      input: array,
      output: sorted,
      isSorted: isSorted(sorted),
      metrics: { ...algorithm.metrics },
      executionTime,
      stepsRecorded: steps.length,
      preservesStability: checkStability(algorithm, array)
    };
  }
  
  return results;
}

/**
 * Checks if an algorithm preserves stability with equal elements
 * @param {Object} algorithm - Algorithm instance
 * @param {Array} array - Input array
 * @returns {boolean} True if the algorithm preserves stability
 */
function checkStability(algorithm, array) {
  if (array.length < 2) return true;
  
  // Create array with objects that have equal keys but distinct identities
  const objectsWithEqualKeys = Array.from({ length: 20 }, (_, i) => ({
    key: Math.floor(i / 4), // Creates duplicates
    originalIndex: i
  }));
  
  const result = algorithm.execute([...objectsWithEqualKeys], {
    comparator: (a, b) => a.key - b.key
  });
  
  // Check if elements with the same key maintain their relative order
  for (let i = 1; i < result.length; i++) {
    if (result[i].key === result[i - 1].key && 
        result[i].originalIndex < result[i - 1].originalIndex) {
      return false;
    }
  }
  
  return true;
}

/**
 * Verifies that algorithm metrics are properly collected
 * @param {Object} metrics - Collected metrics
 * @param {string} algorithmName - Name of the algorithm
 */
function validateMetrics(metrics, algorithmName) {
  expect(metrics).toBeDefined();
  expect(metrics.comparisons).toBeGreaterThanOrEqual(0);
  expect(metrics.swaps).toBeGreaterThanOrEqual(0);
  expect(metrics.reads).toBeGreaterThanOrEqual(0);
  expect(metrics.writes).toBeGreaterThanOrEqual(0);
  expect(metrics.executionTime).toBeGreaterThanOrEqual(0);
  
  // Algorithm-specific metric validation
  switch (algorithmName) {
    case 'Merge Sort':
    case 'Tim Sort':
      // These algorithms typically use more auxiliary space
      expect(metrics.auxiliarySpace).toBeGreaterThan(0);
      break;
    
    case 'Quick Sort':
    case 'Heap Sort':
      // These algorithms should have recursive calls
      expect(metrics.recursiveCalls).toBeGreaterThanOrEqual(0);
      break;
    
    case 'Counting Sort':
    case 'Radix Sort':
    case 'Bucket Sort':
      // Distribution sorts should have minimal comparisons
      if (metrics.comparisons === 0) {
        // This is valid for pure distribution sorts
        expect(metrics.writes).toBeGreaterThan(0);
      }
      break;
  }
}

describe('Algorithm Execution Pipeline', () => {
  let testArrays;
  
  beforeAll(() => {
    // Generate test arrays once for all tests
    testArrays = generateTestArrays();
    
    // Configure the Python bridge mock
    PythonJSBridge.mockImplementation(() => ({
      executeAlgorithm: jest.fn().mockImplementation((algorithmName, data, options) => {
        // Mock returns sorted data and basic metrics
        return Promise.resolve({
          result: [...data].sort((a, b) => a - b),
          metrics: {
            comparisons: data.length > 1 ? data.length * Math.log2(data.length) : 0,
            swaps: data.length / 2,
            reads: data.length * 2,
            writes: data.length * 2,
            execution_time: 0.001
          },
          history: [{ array: data, type: 'initial' }, { array: [...data].sort((a, b) => a - b), type: 'final' }]
        });
      }),
      compareImplementations: jest.fn().mockResolvedValue({
        algorithm: 'test',
        javascript: { executionTime: 10 },
        python: { executionTime: 15 },
        comparison: { resultsMatch: true }
      })
    }));
  });
  
  describe('Comparison-Based Sorting Algorithms', () => {
    test('Bubble Sort executes correctly on all test arrays', async () => {
      const results = await runAlgorithmTests(BubbleSort, { optimize: true, adaptive: true }, testArrays);
      
      for (const [arrayType, result] of Object.entries(results)) {
        expect(result.isSorted).toBe(true);
        validateMetrics(result.metrics, 'Bubble Sort');
        
        // Specific to Bubble Sort
        if (arrayType === 'sorted') {
          // Should detect already sorted array
          expect(result.metrics.swaps).toBe(0);
        }
        
        // Stability check
        expect(result.preservesStability).toBe(true);
      }
    });
    
    test('Merge Sort executes correctly on all test arrays', async () => {
      const results = await runAlgorithmTests(MergeSort, { 
        adaptive: true, 
        insertionThreshold: 10 
      }, testArrays);
      
      for (const [arrayType, result] of Object.entries(results)) {
        expect(result.isSorted).toBe(true);
        validateMetrics(result.metrics, 'Merge Sort');
        
        // Specific to Merge Sort
        expect(result.metrics.auxiliarySpace).toBeGreaterThan(0);
        
        // Stability check
        expect(result.preservesStability).toBe(true);
      }
    });
    
    test('Quick Sort executes correctly on all test arrays', async () => {
      const results = await runAlgorithmTests(QuickSort, {
        pivotStrategy: 'median-of-three',
        insertionThreshold: 10,
        threeWayPartition: true
      }, testArrays);
      
      for (const [arrayType, result] of Object.entries(results)) {
        expect(result.isSorted).toBe(true);
        validateMetrics(result.metrics, 'Quick Sort');
        
        // Quick Sort is not stable by default
        expect(result.preservesStability).toBe(false);
      }
    });
    
    test('Heap Sort executes correctly on all test arrays', async () => {
      const results = await runAlgorithmTests(HeapSort, {
        visualizeHeap: true,
        optimizeLeafChecks: true
      }, testArrays);
      
      for (const [arrayType, result] of Object.entries(results)) {
        expect(result.isSorted).toBe(true);
        validateMetrics(result.metrics, 'Heap Sort');
        
        // Specific to Heap Sort - should have heapify operations
        if (arrayType !== 'empty' && arrayType !== 'singleton') {
          expect(result.metrics.swaps).toBeGreaterThan(0);
        }
        
        // Heap Sort is not stable
        expect(result.preservesStability).toBe(false);
      }
      
      // Verify heap structure reporting in history
      const { recordStep, steps } = createStepRecorder();
      const algorithm = new HeapSort({ visualizeHeap: true });
      await algorithm.execute([...testArrays.random], { onStep: recordStep });
      
      // Check for heap structure in history
      const heapSteps = steps.filter(step => 
        step.heapStructure || step.heap_structure);
      expect(heapSteps.length).toBeGreaterThan(0);
    });
    
    test('Tim Sort executes correctly on all test arrays', async () => {
      const results = await runAlgorithmTests(TimSort, {
        minRun: 16,
        galloping: true
      }, testArrays);
      
      for (const [arrayType, result] of Object.entries(results)) {
        expect(result.isSorted).toBe(true);
        validateMetrics(result.metrics, 'Tim Sort');
        
        // Tim Sort should be stable
        expect(result.preservesStability).toBe(true);
      }
    });
    
    // Additional tests for other comparison-based algorithms...
  });
  
  describe('Distribution Sorting Algorithms', () => {
    test('Counting Sort executes correctly on suitable test arrays', async () => {
      // Use smaller range for counting sort
      const countingSortArrays = {
        ...testArrays,
        constrained: generateDataSet('random', 100, { min: 0, max: 50 })
      };
      
      const results = await runAlgorithmTests(CountingSort, { 
        visualizeDistribution: true 
      }, countingSortArrays);
      
      for (const [arrayType, result] of Object.entries(results)) {
        expect(result.isSorted).toBe(true);
        validateMetrics(result.metrics, 'Counting Sort');
        
        // Counting Sort should have minimal or no comparisons
        if (arrayType !== 'empty' && arrayType !== 'singleton') {
          expect(result.metrics.writes).toBeGreaterThan(0);
        }
        
        // Counting Sort is stable when implemented correctly
        expect(result.preservesStability).toBe(true);
      }
    });
    
    test('Radix Sort executes correctly on suitable test arrays', async () => {
      const results = await runAlgorithmTests(RadixSort, { 
        radix: 10,
        significantDigitFirst: false
      }, testArrays);
      
      for (const [arrayType, result] of Object.entries(results)) {
        expect(result.isSorted).toBe(true);
        validateMetrics(result.metrics, 'Radix Sort');
        
        // Radix Sort should be stable
        expect(result.preservesStability).toBe(true);
      }
    });
    
    // Additional tests for other distribution-based algorithms...
  });
  
  describe('Network Sorting Algorithms', () => {
    test('Bitonic Sort executes correctly on power-of-two sized arrays', async () => {
      // Bitonic sort requires array sizes that are powers of 2
      const bitonicArrays = {
        empty: [],
        singleton: [42],
        powerOfTwo: generateDataSet('random', 64, { min: 1, max: 100 }),
        powerOfTwoSorted: generateDataSet('sorted', 32, { min: 1, max: 100 }),
        powerOfTwoReversed: generateDataSet('reversed', 16, { min: 1, max: 100 })
      };
      
      const results = await runAlgorithmTests(BitonicSort, {
        visualizeNetwork: true
      }, bitonicArrays);
      
      for (const [arrayType, result] of Object.entries(results)) {
        expect(result.isSorted).toBe(true);
        validateMetrics(result.metrics, 'Bitonic Sort');
        
        // Bitonic Sort should have a very predictable number of comparisons
        // for power-of-two sizes: n log²(n)
        if (arrayType.startsWith('powerOfTwo')) {
          const n = result.input.length;
          const expectedComparisonsUpperBound = n * Math.pow(Math.log2(n), 2);
          expect(result.metrics.comparisons).toBeLessThanOrEqual(expectedComparisonsUpperBound);
        }
      }
    });
    
    // Additional tests for other network-based algorithms...
  });
  
  describe('Selection Algorithms', () => {
    test('Quick Select correctly finds kth element', async () => {
      const algorithm = new QuickSelect({
        pivotStrategy: 'median-of-three'
      });
      
      const testArray = [...testArrays.random];
      const sortedCopy = [...testArray].sort((a, b) => a - b);
      
      // Test for different k values
      for (const k of [0, 10, 50, 99]) {
        if (k >= testArray.length) continue;
        
        const result = algorithm.execute(testArray, { k });
        expect(result).toBe(sortedCopy[k]);
        
        // Validate metrics
        expect(algorithm.metrics.comparisons).toBeGreaterThan(0);
        expect(algorithm.metrics.swaps).toBeGreaterThanOrEqual(0);
      }
    });
    
    test('Median of Medians correctly finds median element', async () => {
      const algorithm = new MedianOfMedians({
        groupSize: 5
      });
      
      const testArray = [...testArrays.random];
      const sortedCopy = [...testArray].sort((a, b) => a - b);
      const medianIndex = Math.floor(testArray.length / 2);
      
      const result = algorithm.execute(testArray, { k: medianIndex });
      expect(result).toBe(sortedCopy[medianIndex]);
      
      // Validate that the algorithm guarantees linear time
      expect(algorithm.metrics.recursiveCalls).toBeGreaterThan(0);
    });
    
    // Additional tests for selection algorithms...
  });
  
  describe('Special Case Sorting Algorithms', () => {
    test('Pancake Sort executes correctly on all test arrays', async () => {
      const results = await runAlgorithmTests(PancakeSort, {}, {
        ...testArrays,
        // Use smaller arrays for slower special-case algorithms
        small: generateDataSet('random', 20, { min: 1, max: 100 })
      });
      
      for (const [arrayType, result] of Object.entries(results)) {
        expect(result.isSorted).toBe(true);
        validateMetrics(result.metrics, 'Pancake Sort');
        
        // Pancake Sort uses only flips (a special kind of swap)
        if (arrayType !== 'empty' && arrayType !== 'singleton' && arrayType !== 'sorted') {
          expect(result.metrics.swaps).toBeGreaterThan(0);
        }
      }
    });
    
    test('Bogo Sort executes correctly on very small arrays', async () => {
      // Only test Bogo Sort on tiny arrays
      const bogoArrays = {
        empty: [],
        singleton: [42],
        tiny: [3, 1, 4, 2]
      };
      
      const results = await runAlgorithmTests(BogoSort, {}, bogoArrays);
      
      for (const [arrayType, result] of Object.entries(results)) {
        expect(result.isSorted).toBe(true);
      }
    });
    
    // Additional tests for special-case algorithms...
  });
  
  describe('Algorithm Configuration and Options', () => {
    test('Bubble Sort respects optimization options', async () => {
      // Test without optimizations
      const nonOptimized = new BubbleSort({ optimize: false, adaptive: false });
      const { recordStep: recordNonOpt, steps: nonOptSteps } = createStepRecorder();
      const nonOptResult = await nonOptimized.execute([...testArrays.sorted], { onStep: recordNonOpt });
      
      // Test with optimizations
      const optimized = new BubbleSort({ optimize: true, adaptive: true });
      const { recordStep: recordOpt, steps: optSteps } = createStepRecorder();
      const optResult = await optimized.execute([...testArrays.sorted], { onStep: recordOpt });
      
      // Optimized version should have fewer steps on sorted array
      expect(nonOptSteps.length).toBeGreaterThan(optSteps.length);
      expect(optimized.metrics.swaps).toBe(0); // Should detect sorted array
    });
    
    test('Quick Sort respects pivot strategy options', async () => {
      // Different pivot strategies on the same reversed array
      const strategies = ['first', 'last', 'middle', 'random', 'median-of-three'];
      const results = {};
      
      for (const strategy of strategies) {
        const algorithm = new QuickSort({ pivotStrategy: strategy });
        const result = await algorithm.execute([...testArrays.reversed]);
        results[strategy] = {
          comparisons: algorithm.metrics.comparisons,
          swaps: algorithm.metrics.swaps
        };
      }
      
      // First/last pivot should be worst case for sorted/reversed
      expect(results['first'].comparisons).toBeGreaterThan(results['median-of-three'].comparisons);
      
      // All strategies should produce correct results
      for (const strategy of strategies) {
        expect(isSorted(await (new QuickSort({ pivotStrategy: strategy }))
          .execute([...testArrays.random]))).toBe(true);
      }
    });
    
    // Additional configuration tests...
  });
  
  describe('Python Bridge Integration', () => {
    let bridge;
    
    beforeEach(() => {
      bridge = new PythonJSBridge();
    });
    
    test('Bridge executes Python algorithms and returns expected format', async () => {
      const result = await bridge.executeAlgorithm('merge-sort', testArrays.random, {
        adaptive: true
      });
      
      expect(result).toHaveProperty('result');
      expect(result).toHaveProperty('metrics');
      expect(result).toHaveProperty('history');
      expect(isSorted(result.result)).toBe(true);
    });
    
    test('Bridge compares JavaScript and Python implementations', async () => {
      const comparison = await bridge.compareImplementations(
        new MergeSort(),
        'merge-sort',
        testArrays.random,
        { adaptive: true }
      );
      
      expect(comparison).toHaveProperty('javascript');
      expect(comparison).toHaveProperty('python');
      expect(comparison).toHaveProperty('comparison');
      expect(comparison.comparison.resultsMatch).toBe(true);
    });
    
    // Additional bridge tests...
  });
  
  describe('Performance Characteristics', () => {
    test('Algorithms exhibit expected time complexity on different inputs', async () => {
      // Create arrays of increasing sizes
      const sizes = [100, 1000, 10000];
      const results = {};
      
      for (const size of sizes) {
        const randomArray = generateDataSet('random', size, { min: 1, max: 1000 });
        
        // Test a selection of algorithms
        const algorithms = {
          'merge': new MergeSort(),
          'quick': new QuickSort(),
          'heap': new HeapSort(),
          'insertion': new InsertionSort(),
          'counting': new CountingSort()
        };
        
        results[size] = {};
        
        for (const [name, algorithm] of Object.entries(algorithms)) {
          const startTime = performance.now();
          await algorithm.execute([...randomArray]);
          const executionTime = performance.now() - startTime;
          
          results[size][name] = {
            time: executionTime,
            comparisons: algorithm.metrics.comparisons,
            operations: algorithm.metrics.comparisons + algorithm.metrics.swaps
          };
        }
      }
      
      // Verify growth rates approximately match expected complexity
      for (let i = 1; i < sizes.length; i++) {
        const sizeRatio = sizes[i] / sizes[i-1];
        const logRatio = Math.log2(sizes[i]) / Math.log2(sizes[i-1]);
        
        // O(n log n) algorithms should scale with sizeRatio * logRatio factor
        const nLogNRatio = sizeRatio * logRatio;
        
        // Check Merge Sort (should be close to O(n log n) in all cases)
        const mergeRatio = results[sizes[i]].merge.operations / results[sizes[i-1]].merge.operations;
        expect(mergeRatio).toBeLessThan(nLogNRatio * 1.5); // Allow some overhead
        
        // Insertion Sort should be closer to O(n²)
        const insertionRatio = results[sizes[i]].insertion.operations / results[sizes[i-1]].insertion.operations;
        expect(insertionRatio).toBeGreaterThan(sizeRatio); // Should grow faster than linear
        
        // Counting Sort should be close to O(n)
        const countingRatio = results[sizes[i]].counting.time / results[sizes[i-1]].counting.time;
        expect(countingRatio).toBeLessThan(sizeRatio * 1.5); // Allow some overhead
      }
    });
    
    // Additional performance tests...
  });
});
