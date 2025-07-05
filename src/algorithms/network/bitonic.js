// src/algorithms/parallel/bitonic.js

import Algorithm from '../core/algorithm-base';

/**
 * Implementation of Bitonic Sort algorithm with visualization of the sorting network.
 * 
 * Bitonic Sort is a parallel sorting algorithm that leverages a sorting network architecture.
 * It works by:
 * 1. Recursively constructing a bitonic sequence (a sequence that first increases then decreases)
 * 2. Recursively splitting and merging bitonic sequences to sort the array
 * 
 * Key properties:
 * - Highly parallelizable with O(log²n) time complexity on n processors
 * - Fixed data-independent comparison sequence, making it suitable for hardware implementation
 * - Works optimally on arrays with length = 2^n
 * 
 * This implementation includes:
 * - Visualization of the bitonic sorting network
 * - Parallelization simulation
 * - Support for non-power-of-2 array sizes
 * - Stage-by-stage execution for educational purposes
 * 
 * @class BitonicSort
 * @extends Algorithm
 */
class BitonicSort extends Algorithm {
  /**
   * Create a new BitonicSort instance
   * 
   * @param {Object} options - Configuration options
   * @param {boolean} [options.visualizeNetwork=true] - Visualize the sorting network
   * @param {boolean} [options.simulateParallelism=true] - Simulate parallel execution
   * @param {boolean} [options.supportNonPowerOfTwo=true] - Support non-power-of-2 array sizes
   * @param {boolean} [options.stageByStage=true] - Execute and visualize stage by stage
   */
  constructor(options = {}) {
    super('Bitonic Sort', 'parallel', options);
    
    // Default options
    this.options = {
      visualizeNetwork: true,     // Visualize the sorting network
      simulateParallelism: true,  // Simulate parallel execution
      supportNonPowerOfTwo: true, // Support non-power-of-2 array sizes
      stageByStage: true,         // Execute and visualize stage by stage
      ...options
    };
    
    // Network visualization data
    this.network = {
      stages: [],          // Stages of the sorting network
      comparators: [],     // Comparator connections
      currentStage: 0,     // Current stage being executed
      totalStages: 0       // Total number of stages
    };
  }
  
  /**
   * Execute Bitonic Sort on the input array
   * 
   * @param {Array} array - Input array to be sorted
   * @param {Object} options - Runtime options
   * @returns {Array} - Sorted array
   */
  run(array, options) {
    // Clone array to avoid modifying the original
    const result = [...array];
    const n = result.length;
    
    // Early return for small arrays
    if (n <= 1) {
      return result;
    }
    
    this.setPhase('initialization');
    
    // Handle non-power-of-2 array sizes if enabled
    if (options.supportNonPowerOfTwo) {
      const paddedArray = this.padToPowerOfTwo(result);
      
      // Record padding operation
      if (paddedArray.length > n) {
        this.recordState(paddedArray, {
          type: 'padding',
          originalLength: n,
          paddedLength: paddedArray.length,
          message: `Padded array to length ${paddedArray.length} (next power of 2)`
        });
      }
      
      // Sort the padded array
      this.bitonicSort(paddedArray, 0, paddedArray.length, true, options);
      
      // Return only the original elements (removing padding)
      return paddedArray.slice(0, n);
    }
    
    // Sort the array directly if it's already a power of 2
    this.bitonicSort(result, 0, n, true, options);
    
    this.setPhase('completed');
    return result;
  }
  
  /**
   * Main Bitonic Sort recursive implementation
   * 
   * @param {Array} array - Array to sort
   * @param {number} low - Starting index
   * @param {number} count - Number of elements to sort
   * @param {boolean} direction - Sorting direction (true for ascending, false for descending)
   * @param {Object} options - Runtime options
   */
  bitonicSort(array, low, count, direction, options) {
    if (count <= 1) {
      return;
    }
    
    // Divide the array into two halves
    const mid = Math.floor(count / 2);
    
    // Record the division
    this.recordState(array, {
      type: 'divide',
      low: low,
      mid: low + mid,
      high: low + count - 1,
      message: `Dividing array section [${low}...${low + count - 1}] at ${low + mid - 1}`
    });
    
    // Recursively sort the first half in ascending order
    this.bitonicSort(array, low, mid, true, options);
    
    // Recursively sort the second half in descending order (to create bitonic sequence)
    this.bitonicSort(array, low + mid, mid, false, options);
    
    // Merge the bitonic sequence
    this.bitonicMerge(array, low, count, direction, options);
  }
  
  /**
   * Merge a bitonic sequence
   * 
   * @param {Array} array - Array containing the bitonic sequence
   * @param {number} low - Starting index
   * @param {number} count - Number of elements to merge
   * @param {boolean} direction - Merge direction (true for ascending, false for descending)
   * @param {Object} options - Runtime options
   */
  bitonicMerge(array, low, count, direction, options) {
    if (count <= 1) {
      return;
    }
    
    const mid = Math.floor(count / 2);
    
    // Perform comparisons between pairs of elements
    for (let i = low; i < low + mid; i++) {
      this.bitonicCompare(array, i, i + mid, direction, options);
    }
    
    // Record the comparison phase
    if (options.visualizeNetwork) {
      const stageInfo = {
        type: 'merge-stage',
        low: low,
        count: count,
        comparisons: Array.from({ length: mid }, (_, i) => [low + i, low + mid + i]),
        direction: direction,
        message: `Merging bitonic sequence [${low}...${low + count - 1}], direction: ${direction ? 'ascending' : 'descending'}`
      };
      
      this.network.stages.push(stageInfo);
      this.network.currentStage = this.network.stages.length - 1;
      this.network.totalStages = this.network.stages.length;
      
      this.recordState(array, {
        ...stageInfo,
        network: { ...this.network }
      });
    }
    
    // Recursively merge the two halves
    this.bitonicMerge(array, low, mid, direction, options);
    this.bitonicMerge(array, low + mid, mid, direction, options);
  }
  
  /**
   * Perform a bitonic compare-exchange operation
   * 
   * @param {Array} array - Array to operate on
   * @param {number} i - First index
   * @param {number} j - Second index
   * @param {boolean} direction - Comparison direction (true for ascending, false for descending)
   * @param {Object} options - Runtime options
   */
  bitonicCompare(array, i, j, direction, options) {
    // Skip if indices are out of bounds
    if (i >= array.length || j >= array.length) {
      return;
    }
    
    // Compare elements
    const compResult = this.compare(array[i], array[j]);
    
    // Swap if needed based on direction
    if ((direction && compResult > 0) || (!direction && compResult < 0)) {
      this.swap(array, i, j);
      
      // Record the swap
      this.recordState(array, {
        type: 'compare-exchange',
        indices: [i, j],
        direction: direction,
        message: `Compare-exchange: Swapped elements at indices ${i} and ${j} (direction: ${direction ? 'ascending' : 'descending'})`
      });
    } else {
      // Record the comparison (no swap needed)
      this.recordState(array, {
        type: 'compare-no-exchange',
        indices: [i, j],
        direction: direction,
        message: `Compare-exchange: No swap needed between indices ${i} and ${j} (direction: ${direction ? 'ascending' : 'descending'})`
      });
    }
    
    // Add this comparator to the network visualization
    if (options.visualizeNetwork) {
      this.network.comparators.push({
        from: i,
        to: j,
        direction: direction,
        swapped: (direction && compResult > 0) || (!direction && compResult < 0)
      });
    }
  }
  
  /**
   * Pad array to next power of 2 for Bitonic Sort
   * 
   * @param {Array} array - Original array
   * @returns {Array} - Padded array with length = next power of 2
   */
  padToPowerOfTwo(array) {
    const n = array.length;
    
    // Check if already a power of 2
    if ((n & (n - 1)) === 0) {
      return array.slice();
    }
    
    // Calculate next power of 2
    const nextPow2 = Math.pow(2, Math.ceil(Math.log2(n)));
    
    // Create padded array
    const result = array.slice();
    
    // Fill remaining slots with a value larger than any in the original array
    // This ensures these elements end up at the end after sorting
    const maxVal = Math.max(...array, Number.MIN_SAFE_INTEGER) + 1;
    for (let i = n; i < nextPow2; i++) {
      result.push(maxVal);
    }
    
    return result;
  }
  
  /**
   * Get the time and space complexity of Bitonic Sort
   * 
   * @returns {Object} - Complexity information
   */
  getComplexity() {
    return {
      time: {
        best: 'O(log²n)',     // With n processors
        average: 'O(log²n)',  // With n processors
        worst: 'O(log²n)',    // With n processors
        sequential: 'O(n log²n)'  // Sequential implementation
      },
      space: {
        best: 'O(1)',
        average: 'O(1)',
        worst: 'O(1)'
      },
      comparisons: {
        total: 'O(n log²n)'
      }
    };
  }
  
  /**
   * Whether Bitonic Sort is stable
   * 
   * @returns {boolean} - False as Bitonic Sort is not stable
   */
  isStable() {
    return false;
  }
  
  /**
   * Whether Bitonic Sort is in-place
   * 
   * @returns {boolean} - True as Bitonic Sort is in-place
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
    
    // Add bitonic sort specific information
    info.optimization = {
      visualizeNetwork: this.options.visualizeNetwork,
      simulateParallelism: this.options.simulateParallelism,
      supportNonPowerOfTwo: this.options.supportNonPowerOfTwo,
      stageByStage: this.options.stageByStage
    };
    
    info.properties = {
      comparisonBased: true,
      stable: false,
      inPlace: true,
      online: false,
      parallelizable: true,
      deterministicNetwork: true
    };
    
    info.suitable = {
      parallelHardware: true,
      gpuImplementation: true,
      fixedSizeArrays: true,
      powerOfTwoSizes: true,
      fpgaImplementation: true
    };
    
    info.variants = [
      'Standard Bitonic Sort',
      'Odd-Even Bitonic Merge Sort',
      'Parallel Bitonic Sort',
      'Adaptive Bitonic Sort'
    ];
    
    info.advantages = [
      'Highly parallelizable with O(log²n) parallel time complexity',
      'Fixed comparison pattern regardless of input data',
      'Well-suited for hardware implementation (FPGA, GPU)',
      'In-place with O(1) auxiliary space',
      'Predictable performance across all inputs'
    ];
    
    info.disadvantages = [
      'Not stable (does not preserve order of equal elements)',
      'Requires power-of-2 array size (or padding)',
      'O(n log²n) sequential time complexity is worse than O(n log n) algorithms',
      'Complex to understand and implement correctly',
      'Less efficient for serial processing compared to quicksort or mergesort'
    ];
    
    info.applications = [
      'GPU sorting implementations',
      'FPGA-based sorting networks',
      'High-performance computing where parallel resources are available',
      'Fixed-size sorting applications in hardware',
      'Data routing in network switches'
    ];
    
    return info;
  }
}

export default BitonicSort;