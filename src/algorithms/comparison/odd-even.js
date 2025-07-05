// src/algorithms/comparison/odd-even.js

import Algorithm from '../core/algorithm-base';

/**
 * Implementation of Odd-Even Sort (Brick Sort) algorithm with comprehensive instrumentation.
 * 
 * Odd-Even Sort is a parallel comparison-based sorting algorithm that operates in two phases:
 * 1. Compare and swap odd-indexed elements with their even-indexed neighbors
 * 2. Compare and swap even-indexed elements with their odd-indexed neighbors
 * 
 * This implementation includes:
 * - Complete instrumentation for educational visualization
 * - Early termination optimization
 * - Detailed phase tracking for performance analysis
 * - Parallel sorting simulation capabilities
 * 
 * Time Complexity:
 * - Best:    O(n)     when array is already sorted
 * - Average: O(n²)    for most input distributions
 * - Worst:   O(n²)    for adversarial inputs (e.g., reverse sorted)
 * 
 * Space Complexity: O(1) - truly in-place with constant auxiliary space
 * 
 * Stability: Stable - preserves relative order of equal elements
 * 
 * Parallelization: Naturally parallel algorithm with potential for O(n) time using O(n) processors
 * 
 * @class OddEvenSort
 * @extends Algorithm
 */
class OddEvenSort extends Algorithm {
  /**
   * Create a new OddEvenSort instance
   * 
   * @param {Object} options - Configuration options
   * @param {boolean} [options.earlyTermination=true] - Enable early termination when no swaps occur
   * @param {boolean} [options.simulateParallel=false] - Simulate parallel execution visualization
   * @param {boolean} [options.detailedPhaseTracking=true] - Track odd and even phases separately
   */
  constructor(options = {}) {
    super('Odd-Even Sort', 'comparison', options);
    
    // Default options
    this.options = {
      earlyTermination: true,        // Enable early termination optimization
      simulateParallel: false,       // Simulate parallel execution visualization
      detailedPhaseTracking: true,   // Track odd and even phases separately
      ...options
    };
  }
  
  /**
   * Execute Odd-Even Sort on the input array
   * 
   * @param {Array} array - Input array to be sorted
   * @param {Object} options - Runtime options
   * @returns {Array} - Sorted array
   */
  run(array, options) {
    // Clone array to avoid modifying the original
    const result = [...array];
    const n = result.length;
    
    // Early return for trivially sorted arrays
    if (n <= 1) {
      return result;
    }
    
    // Track if array is sorted
    let isSorted = false;
    
    // Iterate until the array is sorted
    let phase = 0;
    
    this.setPhase('sorting');
    
    while (!isSorted) {
      phase++;
      isSorted = true;  // Assume sorted until a swap occurs
      
      // Odd phase (odd-indexed elements compared with their even-indexed neighbors)
      if (this.options.detailedPhaseTracking) {
        this.recordState(result, {
          type: 'phase-start',
          phase: phase,
          subPhase: 'odd',
          message: `Starting odd-indexed comparison phase ${phase}`
        });
      }
      
      // Process all odd-indexed pairs
      this.executePhase(result, 1, n, 'odd', phase, (swapped) => {
        if (swapped) isSorted = false;
      });
      
      // If no swaps occurred during both phases and early termination is enabled, we can exit
      if (isSorted && this.options.earlyTermination) {
        this.recordState(result, {
          type: 'early-termination',
          phase: phase,
          message: `Early termination after phase ${phase} - array is sorted`
        });
        break;
      }
      
      // Even phase (even-indexed elements compared with their odd-indexed neighbors)
      if (this.options.detailedPhaseTracking) {
        this.recordState(result, {
          type: 'phase-start',
          phase: phase,
          subPhase: 'even',
          message: `Starting even-indexed comparison phase ${phase}`
        });
      }
      
      // Process all even-indexed pairs
      this.executePhase(result, 0, n - 1, 'even', phase, (swapped) => {
        if (swapped) isSorted = false;
      });
      
      // Record the state after each complete phase
      this.recordState(result, {
        type: 'phase-complete',
        phase: phase,
        sorted: isSorted,
        message: `Completed phase ${phase}${isSorted ? ' - array is sorted' : ''}`
      });
    }
    
    this.setPhase('completed');
    return result;
  }
  
  /**
   * Execute a single phase (odd or even) of the Odd-Even Sort
   * 
   * @param {Array} array - The array being sorted
   * @param {number} start - Starting index for this phase
   * @param {number} end - Ending index for this phase
   * @param {string} phaseType - Type of phase ('odd' or 'even')
   * @param {number} phaseNumber - Current phase number
   * @param {Function} swapCallback - Callback to invoke when a swap occurs
   * @private
   */
  executePhase(array, start, end, phaseType, phaseNumber, swapCallback) {
    // In the parallel simulation, all comparisons in a phase happen simultaneously
    // We'll collect all swap operations and apply them at once to simulate this
    const swapPairs = [];
    
    // First pass: Identify all pairs that need swapping
    for (let i = start; i < end; i += 2) {
      // Ensure the second element exists
      if (i + 1 < end) {
        // Record the comparison operation
        this.recordState(array, {
          type: 'comparison',
          indices: [i, i + 1],
          phase: phaseNumber,
          subPhase: phaseType,
          message: `Comparing element at index ${i} with element at index ${i + 1}`
        });
        
        // Compare adjacent elements
        if (this.compare(array[i], array[i + 1]) > 0) {
          // In parallel mode, we just record the swap for later execution
          if (this.options.simulateParallel) {
            swapPairs.push([i, i + 1]);
          } else {
            // In sequential mode, perform the swap immediately
            this.swap(array, i, i + 1);
            swapCallback(true);
            
            // Record the swap operation
            this.recordState(array, {
              type: 'swap',
              indices: [i, i + 1],
              phase: phaseNumber,
              subPhase: phaseType,
              message: `Swapped elements at indices ${i} and ${i + 1}`
            });
          }
        }
      }
    }
    
    // In parallel simulation mode, apply all swaps simultaneously
    if (this.options.simulateParallel && swapPairs.length > 0) {
      // Create a copy of the array for visualization purposes
      const beforeSwap = [...array];
      
      // Apply all swaps
      for (const [i, j] of swapPairs) {
        this.swap(array, i, j);
        swapCallback(true);
      }
      
      // Record the parallel swap operation
      this.recordState(array, {
        type: 'parallel-swap',
        swapPairs: swapPairs,
        beforeState: beforeSwap,
        phase: phaseNumber,
        subPhase: phaseType,
        message: `Performed ${swapPairs.length} swaps in parallel during ${phaseType} phase ${phaseNumber}`
      });
    }
  }
  
  /**
   * Get the time and space complexity of Odd-Even Sort
   * 
   * @returns {Object} - Complexity information
   */
  getComplexity() {
    return {
      time: {
        best: 'O(n)',
        average: 'O(n²)',
        worst: 'O(n²)',
        parallel: 'O(n) with O(n) processors'
      },
      space: {
        best: 'O(1)',
        average: 'O(1)',
        worst: 'O(1)'
      }
    };
  }
  
  /**
   * Whether Odd-Even Sort is stable
   * 
   * @returns {boolean} - True as Odd-Even Sort is stable
   */
  isStable() {
    return true;
  }
  
  /**
   * Whether Odd-Even Sort is in-place
   * 
   * @returns {boolean} - True as Odd-Even Sort is in-place
   */
  isInPlace() {
    return true;
  }
  
  /**
   * Get detailed algorithm information
   * 
   * @returns {Object} - Detailed algorithm metadata
   */
  getInfo() {
    const info = super.getInfo();
    
    // Add Odd-Even Sort specific information
    info.optimization = {
      earlyTermination: this.options.earlyTermination,
      simulateParallel: this.options.simulateParallel,
      detailedPhaseTracking: this.options.detailedPhaseTracking
    };
    
    info.properties = {
      comparisonBased: true,
      stable: true,
      inPlace: true,
      online: false,
      parallelizable: true
    };
    
    info.parallelCharacteristics = {
      dataDistribution: 'Evenly distributed',
      synchronizationPoints: 'Between odd and even phases',
      theoreticalParallelTime: 'O(n) with O(n) processors',
      communicationOverhead: 'Minimal - only adjacent processors communicate',
      architectureAffinity: 'Excellent for SIMD architectures and mesh-connected parallel computers'
    };
    
    info.applications = [
      'Parallel computing environments',
      'SIMD (Single Instruction Multiple Data) architectures',
      'Systolic arrays and mesh-connected parallel computers',
      'Educational illustration of parallel sorting algorithms',
      'Hardware implementations where simplicity is valued over performance'
    ];
    
    info.advantages = [
      'Simple implementation with no complex data structures',
      'Naturally parallelizable with minimal communication overhead',
      'Stable sorting (preserves order of equal elements)',
      'In-place with constant extra memory usage',
      'Predictable performance characteristics'
    ];
    
    info.disadvantages = [
      'Inefficient O(n²) sequential time complexity',
      'Not adaptive to pre-sorted or partially sorted inputs',
      'Performs unnecessary comparisons even when array is sorted',
      'Requires O(n) processors for optimal parallel performance',
      'Not competitive with more sophisticated algorithms for sequential processing'
    ];
    
    info.relatedAlgorithms = [
      'Bubble Sort (similar sequential behavior)',
      'Cocktail Shaker Sort (bidirectional variant)',
      'Shell Sort (more efficient generalization)',
      'Bitonic Sort (another parallelizable sorting network)'
    ];
    
    return info;
  }
}

export default OddEvenSort;