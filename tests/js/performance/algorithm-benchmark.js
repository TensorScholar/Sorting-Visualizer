// tests/js/performance/algorithm-benchmark.test.js

/**
 * Comprehensive performance benchmarking suite for sorting algorithms
 * 
 * This suite provides rigorous performance analysis of all sorting algorithms
 * implemented in the platform. It measures execution time, operation counts,
 * and memory characteristics across various input distributions and sizes.
 * 
 * The benchmarks are designed to:
 * 1. Provide reproducible, consistent performance metrics
 * 2. Enable comparative analysis between algorithms
 * 3. Evaluate algorithmic behavior across different input characteristics
 * 4. Measure the impact of optimization strategies
 * 5. Generate performance profiles for educational insights
 * 
 * @author Advanced Sorting Visualization Platform Team
 * @version 1.0.0
 */

import { performance } from 'perf_hooks';
import { generateDataSet } from '../../../src/data/generators';

// Import all algorithm implementations
import BubbleSort from '../../../src/algorithms/comparison/bubble';
import CocktailShakerSort from '../../../src/algorithms/comparison/cocktail-shaker';
import CombSort from '../../../src/algorithms/comparison/comb';
import CycleSort from '../../../src/algorithms/comparison/cycle';
import GnomeSort from '../../../src/algorithms/comparison/gnome';
import HeapSort from '../../../src/algorithms/comparison/heap';
import InsertionSort from '../../../src/algorithms/comparison/insertion';
import BinaryInsertionSort from '../../../src/algorithms/comparison/binary-insertion';
import IntroSort from '../../../src/algorithms/comparison/intro';
import MergeSort from '../../../src/algorithms/comparison/merge';
import OddEvenSort from '../../../src/algorithms/comparison/odd-even';
import QuickSort from '../../../src/algorithms/comparison/quick';
import SelectionSort from '../../../src/algorithms/comparison/selection';
import ShellSort from '../../../src/algorithms/comparison/shell';
import TimSort from '../../../src/algorithms/comparison/tim';

import BucketSort from '../../../src/algorithms/distribution/bucket';
import CountingSort from '../../../src/algorithms/distribution/counting';
import PigeonholeSort from '../../../src/algorithms/distribution/pigeonhole';
import RadixSort from '../../../src/algorithms/distribution/radix';

import BitonicSort from '../../../src/algorithms/network/bitonic';
import OddEvenMergeSort from '../../../src/algorithms/network/odd-even-merge';

import BogoSort from '../../../src/algorithms/special/bogo';
import PancakeSort from '../../../src/algorithms/special/pancake';

import QuickSelect from '../../../src/algorithms/selection/quick-select';
import MedianOfMedians from '../../../src/algorithms/selection/median-of-medians';

// Test configuration
const TEST_CONFIG = {
  // Array sizes to benchmark (powers of 10 for logarithmic scale)
  arraySizes: [10, 100, 1000, 10000],
  
  // Array sizes for slow algorithms only
  slowAlgorithmSizes: [10, 100, 1000],
  
  // Very slow algorithms (for educational purposes only)
  verySlowAlgorithmSizes: [10, 100],
  
  // Data distributions to test
  distributions: [
    'random',          // Random distribution
    'nearly-sorted',   // Nearly sorted arrays
    'reversed',        // Reverse sorted arrays
    'few-unique',      // Few unique values
    'sorted'           // Already sorted arrays
  ],
  
  // Number of runs for each test to get stable average metrics
  runsPerTest: 5,
  
  // Timeout for tests in milliseconds (prevent infinite loops)
  timeout: 30000,
  
  // Whether to collect memory metrics (uses more resources)
  collectMemoryMetrics: true
};

/**
 * Algorithm categorization for test organization and reporting
 */
const ALGORITHM_CATEGORIES = {
  // Fast, general-purpose algorithms suitable for most cases
  primary: [
    { name: 'Quick Sort', instance: new QuickSort() },
    { name: 'Merge Sort', instance: new MergeSort() },
    { name: 'Heap Sort', instance: new HeapSort() },
    { name: 'Tim Sort', instance: new TimSort() },
    { name: 'Intro Sort', instance: new IntroSort() }
  ],
  
  // Simple algorithms, often slower but instructive
  elementary: [
    { name: 'Bubble Sort', instance: new BubbleSort() },
    { name: 'Selection Sort', instance: new SelectionSort() },
    { name: 'Insertion Sort', instance: new InsertionSort() },
    { name: 'Binary Insertion Sort', instance: new BinaryInsertionSort() },
    { name: 'Shell Sort', instance: new ShellSort() }
  ],
  
  // Variations of elementary sorts with optimizations
  variations: [
    { name: 'Cocktail Shaker Sort', instance: new CocktailShakerSort() },
    { name: 'Comb Sort', instance: new CombSort() },
    { name: 'Cycle Sort', instance: new CycleSort() },
    { name: 'Gnome Sort', instance: new GnomeSort() },
    { name: 'Odd-Even Sort', instance: new OddEvenSort() }
  ],
  
  // Non-comparison based sorting algorithms
  distribution: [
    { name: 'Counting Sort', instance: new CountingSort() },
    { name: 'Radix Sort', instance: new RadixSort() },
    { name: 'Bucket Sort', instance: new BucketSort() },
    { name: 'Pigeonhole Sort', instance: new PigeonholeSort() }
  ],
  
  // Parallel/network sorting algorithms
  network: [
    { name: 'Bitonic Sort', instance: new BitonicSort() },
    { name: 'Odd-Even Merge Sort', instance: new OddEvenMergeSort() }
  ],
  
  // Special-case algorithms, mainly for educational purposes
  special: [
    { name: 'Pancake Sort', instance: new PancakeSort() },
    { name: 'Bogo Sort', instance: new BogoSort(), verySlowOnly: true }
  ],
  
  // Selection algorithms (not sorting algorithms)
  selection: [
    { name: 'Quick Select', instance: new QuickSelect() },
    { name: 'Median of Medians', instance: new MedianOfMedians() }
  ]
};

/**
 * Main benchmark function that executes tests for all algorithms
 * 
 * @returns {Object} Complete benchmark results
 */
async function runBenchmarks() {
  console.log('Starting algorithm performance benchmarks...');
  const startTime = performance.now();
  
  // Results storage organized by category
  const results = {};
  
  // Run benchmarks for each category
  for (const [category, algorithms] of Object.entries(ALGORITHM_CATEGORIES)) {
    console.log(`\nBenchmarking ${category} algorithms...`);
    results[category] = {};
    
    // Test each algorithm in the category
    for (const algorithm of algorithms) {
      const { name, instance, verySlowOnly = false, slowOnly = false } = algorithm;
      console.log(`  Testing ${name}...`);
      
      // Select appropriate array sizes based on algorithm speed classification
      const arraySizes = verySlowOnly ? 
        TEST_CONFIG.verySlowAlgorithmSizes : 
        (slowOnly ? TEST_CONFIG.slowAlgorithmSizes : TEST_CONFIG.arraySizes);
      
      // Run the benchmark for this algorithm
      results[category][name] = await benchmarkAlgorithm(instance, name, arraySizes);
    }
  }
  
  const endTime = performance.now();
  console.log(`\nAll benchmarks completed in ${((endTime - startTime) / 1000).toFixed(2)} seconds.`);
  
  return results;
}

/**
 * Benchmarks a single algorithm across multiple array sizes and distributions
 * 
 * @param {Object} algorithmInstance - Instance of the algorithm to benchmark
 * @param {string} algorithmName - Name of the algorithm for reporting
 * @param {Array<number>} arraySizes - Array sizes to test
 * @returns {Object} Benchmark results for this algorithm
 */
async function benchmarkAlgorithm(algorithmInstance, algorithmName, arraySizes) {
  const results = {
    name: algorithmName,
    metrics: {}
  };
  
  // Test each array size
  for (const size of arraySizes) {
    results.metrics[size] = {};
    
    // Test each distribution
    for (const distribution of TEST_CONFIG.distributions) {
      // Generate consistent test data for this distribution and size
      const testData = generateTestData(size, distribution);
      
      // Run multiple times and average the results
      const runResults = [];
      
      for (let run = 0; run < TEST_CONFIG.runsPerTest; run++) {
        try {
          // Clone the test data for each run to ensure consistency
          const data = [...testData];
          
          // Prepare the algorithm instance
          algorithmInstance.reset();
          
          // Set a timeout to prevent infinite loops
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Benchmark timeout')), TEST_CONFIG.timeout);
          });
          
          // Execute algorithm with promise to handle timeout
          const executionPromise = new Promise(resolve => {
            // Collect memory usage before execution
            const memBefore = TEST_CONFIG.collectMemoryMetrics ? process.memoryUsage() : null;
            const startTime = performance.now();
            
            // Execute the algorithm
            const result = algorithmInstance.execute(data);
            
            const endTime = performance.now();
            const executionTime = endTime - startTime;
            
            // Collect memory usage after execution
            const memAfter = TEST_CONFIG.collectMemoryMetrics ? process.memoryUsage() : null;
            
            // Verify the result is sorted
            const isSorted = verifySorted(result);
            
            // Collect metrics
            const metrics = algorithmInstance.metrics;
            
            resolve({
              executionTime,
              metrics,
              memorySample: memBefore && memAfter ? {
                heapUsed: memAfter.heapUsed - memBefore.heapUsed,
                heapTotal: memAfter.heapTotal - memBefore.heapTotal,
                external: memAfter.external - memBefore.external,
                rss: memAfter.rss - memBefore.rss
              } : null,
              isSorted
            });
          });
          
          // Race the execution against the timeout
          const runResult = await Promise.race([executionPromise, timeoutPromise]);
          runResults.push(runResult);
          
        } catch (error) {
          console.error(`Error benchmarking ${algorithmName} with size=${size}, distribution=${distribution}: ${error.message}`);
          // Store error information in results
          runResults.push({
            error: error.message,
            executionTime: TEST_CONFIG.timeout,
            metrics: {},
            memorySample: null,
            isSorted: false
          });
          
          // Don't continue with more runs if we hit a timeout
          if (error.message === 'Benchmark timeout') {
            break;
          }
        }
      }
      
      // Aggregate results from multiple runs
      results.metrics[size][distribution] = aggregateResults(runResults);
    }
  }
  
  return results;
}

/**
 * Generates consistent test data for benchmarking
 * 
 * @param {number} size - Size of the array to generate
 * @param {string} distribution - Type of distribution to generate
 * @returns {Array} Generated test data
 */
function generateTestData(size, distribution) {
  // Set consistent seed for each test to ensure reproducibility
  const options = {
    min: 1,
    max: 1000,
    seed: `${distribution}-${size}` // Use string seed for consistency
  };
  
  // Special case for few-unique distribution
  if (distribution === 'few-unique') {
    options.uniqueValues = Math.max(2, Math.min(Math.floor(Math.sqrt(size)), 20));
  }
  
  // Generate the dataset
  return generateDataSet(distribution, size, options);
}

/**
 * Verifies that an array is properly sorted
 * 
 * @param {Array} array - Array to check
 * @returns {boolean} Whether the array is sorted
 */
function verifySorted(array) {
  if (!array || !array.length) return true;
  
  for (let i = 1; i < array.length; i++) {
    if (array[i] < array[i - 1]) {
      return false;
    }
  }
  
  return true;
}

/**
 * Aggregates results from multiple runs into a single result
 * 
 * @param {Array} runResults - Results from multiple runs
 * @returns {Object} Aggregated results
 */
function aggregateResults(runResults) {
  if (!runResults.length) return { error: 'No results' };
  
  // Filter out error runs
  const validRuns = runResults.filter(run => !run.error);
  const errorRuns = runResults.filter(run => run.error);
  
  // If all runs errored, return the first error
  if (!validRuns.length) {
    return {
      error: errorRuns[0].error,
      executionTime: TEST_CONFIG.timeout,
      successRate: 0
    };
  }
  
  // Calculate the success rate
  const successRate = validRuns.length / runResults.length;
  
  // Aggregate execution time
  const totalExecutionTime = validRuns.reduce((sum, run) => sum + run.executionTime, 0);
  const avgExecutionTime = totalExecutionTime / validRuns.length;
  
  // Find min and max execution times
  const minExecutionTime = Math.min(...validRuns.map(run => run.executionTime));
  const maxExecutionTime = Math.max(...validRuns.map(run => run.executionTime));
  
  // Aggregate metrics
  const aggregatedMetrics = {};
  
  if (validRuns.length > 0 && validRuns[0].metrics) {
    Object.keys(validRuns[0].metrics).forEach(metricKey => {
      // Skip non-numeric metrics
      if (typeof validRuns[0].metrics[metricKey] !== 'number') return;
      
      const values = validRuns.map(run => run.metrics[metricKey]);
      aggregatedMetrics[metricKey] = {
        avg: values.reduce((sum, val) => sum + val, 0) / values.length,
        min: Math.min(...values),
        max: Math.max(...values)
      };
    });
  }
  
  // Aggregate memory samples if available
  let memoryStats = null;
  if (validRuns[0].memorySample) {
    memoryStats = {};
    Object.keys(validRuns[0].memorySample).forEach(memKey => {
      const values = validRuns.map(run => run.memorySample[memKey]);
      memoryStats[memKey] = {
        avg: values.reduce((sum, val) => sum + val, 0) / values.length,
        min: Math.min(...values),
        max: Math.max(...values)
      };
    });
  }
  
  // Return aggregated results
  return {
    executionTime: {
      avg: avgExecutionTime,
      min: minExecutionTime,
      max: maxExecutionTime
    },
    metrics: aggregatedMetrics,
    memoryStats,
    successRate,
    errorRate: 1 - successRate,
    errorMessage: errorRuns.length ? errorRuns[0].error : null,
    sortCorrectness: validRuns.every(run => run.isSorted) ? 1 : 0
  };
}

/**
 * Generate a comprehensive report from benchmark results
 * 
 * @param {Object} results - Benchmark results
 * @returns {string} Formatted report
 */
function generateReport(results) {
  let report = '# Sorting Algorithm Benchmark Report\n\n';
  
  // Add timestamp
  report += `Generated on: ${new Date().toISOString()}\n\n`;
  
  // Add configuration information
  report += '## Benchmark Configuration\n\n';
  report += `- **Array Sizes**: ${TEST_CONFIG.arraySizes.join(', ')}\n`;
  report += `- **Distributions**: ${TEST_CONFIG.distributions.join(', ')}\n`;
  report += `- **Runs per Test**: ${TEST_CONFIG.runsPerTest}\n\n`;
  
  // Add summary for each category
  for (const [category, algorithms] of Object.entries(results)) {
    report += `## ${category.charAt(0).toUpperCase() + category.slice(1)} Algorithms\n\n`;
    
    // Create performance tables for each array size
    for (const size of TEST_CONFIG.arraySizes) {
      report += `### Array Size: ${size}\n\n`;
      
      // Create table header
      report += '| Algorithm | Distribution | Execution Time (ms) | Comparisons | Swaps | Memory Accesses | Success Rate |\n';
      report += '|-----------|--------------|---------------------|-------------|-------|-----------------|-------------|\n';
      
      // Add a row for each algorithm and distribution
      for (const [algoName, algoResults] of Object.entries(algorithms)) {
        // Skip if this size wasn't tested for this algorithm
        if (!algoResults.metrics[size]) continue;
        
        for (const [distName, distResults] of Object.entries(algoResults.metrics[size])) {
          // Skip if there was an error
          if (distResults.error) {
            report += `| ${algoName} | ${distName} | ERROR: ${distResults.error} | - | - | - | ${distResults.successRate * 100}% |\n`;
            continue;
          }
          
          const execTime = distResults.executionTime.avg.toFixed(2);
          const comparisons = distResults.metrics.comparisons ? 
            distResults.metrics.comparisons.avg.toLocaleString() : '-';
          const swaps = distResults.metrics.swaps ? 
            distResults.metrics.swaps.avg.toLocaleString() : '-';
          const memAccesses = distResults.metrics.memoryAccesses ? 
            distResults.metrics.memoryAccesses.avg.toLocaleString() : '-';
          const successRate = `${(distResults.successRate * 100).toFixed(0)}%`;
          
          report += `| ${algoName} | ${distName} | ${execTime} | ${comparisons} | ${swaps} | ${memAccesses} | ${successRate} |\n`;
        }
      }
      
      report += '\n';
    }
  }
  
  // Add performance analysis
  report += '## Performance Analysis\n\n';
  
  // Create overall performance ranking
  report += '### Overall Performance Ranking\n\n';
  
  // Analyze and rank algorithms based on average performance
  // across all distributions and array sizes
  const rankingData = [];
  
  for (const category of Object.values(results)) {
    for (const [algoName, algoResults] of Object.entries(category)) {
      let totalTime = 0;
      let totalTests = 0;
      
      // Collect performance data across all tests for this algorithm
      for (const size of Object.keys(algoResults.metrics)) {
        for (const [distName, distResults] of Object.entries(algoResults.metrics[size])) {
          if (!distResults.error && distResults.executionTime) {
            totalTime += distResults.executionTime.avg;
            totalTests++;
          }
        }
      }
      
      // Calculate average execution time across all tests
      const avgTime = totalTests > 0 ? totalTime / totalTests : Infinity;
      
      // Find what category this algorithm belongs to
      let algorithmCategory = '';
      for (const [catName, algorithms] of Object.entries(ALGORITHM_CATEGORIES)) {
        if (algorithms.some(algo => algo.name === algoName)) {
          algorithmCategory = catName;
          break;
        }
      }
      
      rankingData.push({
        name: algoName,
        category: algorithmCategory,
        avgExecutionTime: avgTime,
        testsRun: totalTests
      });
    }
  }
  
  // Sort algorithms by average execution time (fastest first)
  rankingData.sort((a, b) => a.avgExecutionTime - b.avgExecutionTime);
  
  // Display ranking table
  report += '| Rank | Algorithm | Category | Avg Execution Time (ms) |\n';
  report += '|------|-----------|----------|-------------------------|\n';
  
  rankingData.forEach((algo, index) => {
    if (algo.testsRun > 0 && algo.avgExecutionTime < Infinity) {
      report += `| ${index + 1} | ${algo.name} | ${algo.category} | ${algo.avgExecutionTime.toFixed(2)} |\n`;
    }
  });
  
  report += '\n### Distribution-Specific Performance\n\n';
  report += 'Some algorithms perform better or worse on specific distributions:\n\n';
  
  // Find best algorithms for each distribution
  for (const distribution of TEST_CONFIG.distributions) {
    report += `#### ${distribution}\n\n`;
    
    // Collect performance data for this distribution
    const distribData = [];
    
    for (const category of Object.values(results)) {
      for (const [algoName, algoResults] of Object.entries(category)) {
        // Use the largest dataset size that has data for all algorithms
        const size = TEST_CONFIG.arraySizes.find(size => 
          algoResults.metrics[size] && 
          algoResults.metrics[size][distribution] &&
          !algoResults.metrics[size][distribution].error
        );
        
        if (size && algoResults.metrics[size][distribution]) {
          const distResults = algoResults.metrics[size][distribution];
          
          if (!distResults.error) {
            distribData.push({
              name: algoName,
              executionTime: distResults.executionTime.avg,
              size
            });
          }
        }
      }
    }
    
    // Sort by execution time for this distribution
    distribData.sort((a, b) => a.executionTime - b.executionTime);
    
    // Take top 3 algorithms
    const top3 = distribData.slice(0, 3);
    
    report += 'Best performing algorithms for this distribution:\n\n';
    report += '| Algorithm | Execution Time (ms) | Array Size |\n';
    report += '|-----------|---------------------|------------|\n';
    
    top3.forEach(algo => {
      report += `| ${algo.name} | ${algo.executionTime.toFixed(2)} | ${algo.size} |\n`;
    });
    
    report += '\n';
  }
  
  return report;
}

/**
 * Main test runner function
 */
describe('Algorithm Performance Benchmarks', () => {
  // Set longer timeout for performance tests
  jest.setTimeout(TEST_CONFIG.timeout * TEST_CONFIG.arraySizes.length * 
                 TEST_CONFIG.distributions.length * TEST_CONFIG.runsPerTest);
  
  let benchmarkResults;
  
  // Run benchmarks once before all tests
  beforeAll(async () => {
    benchmarkResults = await runBenchmarks();
  });
  
  test('Should generate comprehensive benchmark report', () => {
    const report = generateReport(benchmarkResults);
    expect(report).toBeTruthy();
    console.log(report); // Output report to console
    
    // Could also write report to file here
    // fs.writeFileSync('benchmark-report.md', report);
  });
  
  test('All algorithms should complete successfully on small arrays', () => {
    // Check only the smallest array size
    const smallestSize = TEST_CONFIG.arraySizes[0];
    
    for (const [category, algorithms] of Object.entries(benchmarkResults)) {
      for (const [algoName, algoResults] of Object.entries(algorithms)) {
        for (const [distName, distResults] of Object.entries(algoResults.metrics[smallestSize])) {
          expect(distResults.error).toBeUndefined();
          expect(distResults.successRate).toBe(1);
          expect(distResults.sortCorrectness).toBe(1);
        }
      }
    }
  });
  
  test('Primary sorting algorithms should scale with reasonable performance', () => {
    // Get the two smallest sizes to calculate scaling
    const smallSize = TEST_CONFIG.arraySizes[0];
    const largeSize = TEST_CONFIG.arraySizes[1];
    const sizeRatio = largeSize / smallSize;
    
    // Primary algorithms should scale better than O(n²)
    for (const { name, instance } of ALGORITHM_CATEGORIES.primary) {
      // Skip if no data for these sizes
      if (!benchmarkResults.primary[name].metrics[smallSize] || 
          !benchmarkResults.primary[name].metrics[largeSize]) {
        continue;
      }
      
      // Calculate average scaling factor across distributions
      let scalingSum = 0;
      let distributionCount = 0;
      
      for (const distribution of TEST_CONFIG.distributions) {
        const smallResult = benchmarkResults.primary[name].metrics[smallSize][distribution];
        const largeResult = benchmarkResults.primary[name].metrics[largeSize][distribution];
        
        // Skip if either result had an error
        if (smallResult.error || largeResult.error) continue;
        
        const timeRatio = largeResult.executionTime.avg / smallResult.executionTime.avg;
        scalingSum += timeRatio;
        distributionCount++;
      }
      
      // Skip if no valid comparisons
      if (distributionCount === 0) continue;
      
      const avgScaling = scalingSum / distributionCount;
      
      // For N*logN algorithms, with 10x data should be less than 10x slower
      // Specifically, we expect roughly 10 * log(10)/log(1) = 10 * 1 = 10x slower
      // But allowing some overhead, we check for < 15x slower
      expect(avgScaling).toBeLessThan(sizeRatio * 1.5);
    }
  });
  
  // Test specific algorithm characteristics
  test('Quick Sort should perform well on random data', () => {
    const quickSortResults = benchmarkResults.primary['Quick Sort'];
    
    // Get medium-sized array results
    const mediumSize = TEST_CONFIG.arraySizes[1]; // 100 elements
    
    // Compare performance on random vs. sorted data
    const randomPerformance = quickSortResults.metrics[mediumSize]['random'].executionTime.avg;
    const sortedPerformance = quickSortResults.metrics[mediumSize]['sorted'].executionTime.avg;
    
    // QuickSort should be relatively efficient on random data
    expect(randomPerformance).toBeLessThan(sortedPerformance * 2);
  });
  
  test('Insertion Sort should perform well on nearly-sorted data', () => {
    const insertionSortResults = benchmarkResults.elementary['Insertion Sort'];
    
    // Get medium-sized array results
    const mediumSize = TEST_CONFIG.arraySizes[1]; // 100 elements
    
    // Compare performance on nearly-sorted vs. random data
    const nearlySortedPerformance = insertionSortResults.metrics[mediumSize]['nearly-sorted'].executionTime.avg;
    const randomPerformance = insertionSortResults.metrics[mediumSize]['random'].executionTime.avg;
    
    // Insertion sort should be faster on nearly-sorted data
    expect(nearlySortedPerformance).toBeLessThan(randomPerformance);
  });
  
  test('Counting Sort should be efficient for limited range data', () => {
    // Only run if counting sort was benchmarked
    if (!benchmarkResults.distribution || !benchmarkResults.distribution['Counting Sort']) {
      return;
    }
    
    const countingSortResults = benchmarkResults.distribution['Counting Sort'];
    
    // Check performance on the largest array size that has results
    const largestSize = Math.max(
      ...Object.keys(countingSortResults.metrics)
        .map(Number)
        .filter(size => countingSortResults.metrics[size]['random'])
    );
    
    // Get results for random distribution
    const randomResults = countingSortResults.metrics[largestSize]['random'];
    
    // Counting sort should be efficient (linear time)
    // Specifically checking that comparison count should be low
    if (randomResults.metrics.comparisons) {
      // Should be much less than O(n log n) comparisons
      expect(randomResults.metrics.comparisons.avg).toBeLessThan(largestSize * Math.log2(largestSize));
    }
    
    // Execution time should scale linearly
    if (largestSize > TEST_CONFIG.arraySizes[0]) {
      const smallerSize = TEST_CONFIG.arraySizes[
        TEST_CONFIG.arraySizes.indexOf(largestSize) - 1
      ];
      
      const smallerResults = countingSortResults.metrics[smallerSize]['random'];
      
      const timeRatio = randomResults.executionTime.avg / smallerResults.executionTime.avg;
      const sizeRatio = largestSize / smallerSize;
      
      // Should scale approximately linearly (with some tolerance)
      expect(timeRatio).toBeLessThan(sizeRatio * 1.5);
    }
  });
});

export default runBenchmarks;
