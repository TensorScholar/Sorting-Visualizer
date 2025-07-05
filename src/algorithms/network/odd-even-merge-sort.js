// src/algorithms/network/odd-even-merge.js

import Algorithm from '../core/algorithm-base';

/**
 * Implementation of Odd-Even Merge Sort (Batcher's Merge Exchange Sort) algorithm.
 * 
 * Odd-Even Merge Sort is a sorting network algorithm that builds a network of
 * compare-and-swap operations in a recursive divide-and-conquer approach. It sorts
 * a list by recursively sorting its odd and even indexed sublists, then merging
 * them using an odd-even merging network.
 * 
 * This implementation includes:
 * - Complete visualization of the sorting network structure
 * - Detailed tracking of each compare-and-swap operation
 * - Recursive network construction with explainable steps
 * - Optimal network generation for educational purposes
 * 
 * Time Complexity:
 * - Sequential execution: O(n log² n) for all cases
 * - Parallel execution: O(log² n) with O(n log² n) processors
 * 
 * Space Complexity: O(n) for network representation, O(1) for execution
 * 
 * Stability: Not stable - compare-and-swap operations do not preserve order of equal elements
 * 
 * Parallelization: Highly parallelizable with predictable execution path
 * 
 * @class OddEvenMergeSort
 * @extends Algorithm
 */
class OddEvenMergeSort extends Algorithm {
  /**
   * Create a new OddEvenMergeSort instance
   * 
   * @param {Object} options - Configuration options
   * @param {boolean} [options.visualizeNetwork=true] - Visualize the sorting network
   * @param {boolean} [options.optimizeNetworkSize=true] - Generate optimal network
   * @param {boolean} [options.simulateParallel=false] - Simulate parallel execution
   */
  constructor(options = {}) {
    super('Odd-Even Merge Sort', 'network', options);
    
    // Default options
    this.options = {
      visualizeNetwork: true,      // Visualize the sorting network
      optimizeNetworkSize: true,   // Generate an optimal network
      simulateParallel: false,     // Simulate parallel execution
      ...options
    };
    
    // Sorting network representation
    this.network = [];
    this.executionSteps = [];
  }
  
  /**
   * Execute Odd-Even Merge Sort on the input array
   * 
   * @param {Array} array - Input array to be sorted
   * @param {Object} options - Runtime options
   * @returns {Array} - Sorted array
   */
  run(array, options) {
    // Clone array to avoid modifying the original
    const result = [...array];
    const n = result.length;
    
    // Ensure the array size is a power of 2 by padding
    const padded = this.padToPowerOfTwo(result);
    const paddedLength = padded.length;
    
    this.setPhase('network-generation');
    
    // Generate the sorting network
    this.generateSortingNetwork(paddedLength);
    
    // Record the generated network
    if (this.options.visualizeNetwork) {
      this.recordState(padded, {
        type: 'network-generated',
        network: this.network,
        message: `Generated sorting network with ${this.network.length} comparators`
      });
    }
    
    this.setPhase('sorting');
    
    // Execute the sorting network
    this.executeSortingNetwork(padded);
    
    // Extract the sorted result (removing padding if added)
    const sortedResult = padded.slice(0, n);
    
    this.setPhase('completed');
    return sortedResult;
  }
  
  /**
   * Pad the array to the next power of 2 in length
   * 
   * @param {Array} array - The input array
   * @returns {Array} - Padded array with length that is a power of 2
   * @private
   */
  padToPowerOfTwo(array) {
    const n = array.length;
    
    // If array length is already a power of 2, return a copy
    if ((n & (n - 1)) === 0) {
      return [...array];
    }
    
    // Calculate next power of 2
    const nextPowerOfTwo = Math.pow(2, Math.ceil(Math.log2(n)));
    
    // Create a new array with original elements and padding
    const padded = [...array];
    
    // Pad with the largest value to ensure they go to the end
    // Find the maximum value in the array
    const maxValue = Math.max(...array.filter(x => typeof x === 'number'), Number.MIN_SAFE_INTEGER);
    
    // For non-numeric arrays, use the largest element for padding
    const paddingValue = (typeof maxValue === 'number' && isFinite(maxValue)) ? 
                        Number.MAX_SAFE_INTEGER : 
                        array.reduce((a, b) => (this.compare(a, b) > 0 ? a : b), array[0]);
    
    // Pad the array
    for (let i = n; i < nextPowerOfTwo; i++) {
      padded.push(paddingValue);
    }
    
    // Record the padding operation
    this.recordState(padded, {
      type: 'array-padding',
      originalLength: n,
      paddedLength: nextPowerOfTwo,
      paddingValue: paddingValue,
      message: `Padded array from length ${n} to ${nextPowerOfTwo} with padding value ${paddingValue}`
    });
    
    return padded;
  }
  
  /**
   * Generate the complete sorting network for Odd-Even Merge Sort
   * 
   * @param {number} n - Size of the array
   * @private
   */
  generateSortingNetwork(n) {
    this.network = [];
    this.executionSteps = [];
    
    // Generate the network recursively
    this.oddEvenMergeSort(0, n - 1);
    
    // Optimize the network if enabled
    if (this.options.optimizeNetworkSize) {
      this.optimizeNetwork();
    }
  }
  
  /**
   * Recursive implementation of Odd-Even Merge Sort network generation
   * 
   * @param {number} low - Starting index
   * @param {number} high - Ending index
   * @private
   */
  oddEvenMergeSort(low, high) {
    if (high <= low) {
      return;
    }
    
    // Middle point
    const mid = Math.floor((low + high) / 2);
    
    // Record the division step
    this.executionSteps.push({
      type: 'division',
      ranges: [[low, mid], [mid + 1, high]],
      message: `Dividing range [${low}...${high}] into [${low}...${mid}] and [${mid + 1}...${high}]`
    });
    
    // Sort the two halves recursively
    this.oddEvenMergeSort(low, mid);
    this.oddEvenMergeSort(mid + 1, high);
    
    // Merge the sorted halves
    this.oddEvenMerge(low, high, 1);
  }
  
  /**
   * Odd-Even merge operation for network generation
   * 
   * @param {number} low - Starting index
   * @param {number} high - Ending index
   * @param {number} r - Stride for comparisons
   * @private
   */
  oddEvenMerge(low, high, r) {
    const step = r * 2;
    
    if (step < high - low + 1) {
      // Record the merge step
      this.executionSteps.push({
        type: 'merge',
        range: [low, high],
        stride: r,
        message: `Merging elements in range [${low}...${high}] with stride ${r}`
      });
      
      // Recursively merge even and odd sublists
      this.oddEvenMerge(low, high, step);
      this.oddEvenMerge(low + r, high, step);
      
      // Compare-and-swap elements at stride distance
      for (let i = low + r; i < high; i += step) {
        this.addComparator(i, i + r);
      }
    } else {
      // Base case: Just add a single comparator
      if (r === 1 && low < high) {
        this.addComparator(low, high);
      }
    }
  }
  
  /**
   * Add a comparator to the network
   * 
   * @param {number} i - First index
   * @param {number} j - Second index
   * @private
   */
  addComparator(i, j) {
    // Ensure i < j
    if (i > j) {
      [i, j] = [j, i];
    }
    
    // Add comparator to network
    this.network.push([i, j]);
    
    // Record the comparator addition
    this.executionSteps.push({
      type: 'add-comparator',
      indices: [i, j],
      message: `Adding comparator between indices ${i} and ${j}`
    });
  }
  
  /**
   * Optimize the network by removing redundant comparators
   * 
   * @private
   */
  optimizeNetwork() {
    // This is a simplified optimization - in practice more sophisticated techniques exist
    const originalSize = this.network.length;
    
    // Remove duplicate comparators
    const uniqueComparators = new Set();
    this.network = this.network.filter(([i, j]) => {
      const key = `${i},${j}`;
      if (uniqueComparators.has(key)) {
        return false;
      }
      uniqueComparators.add(key);
      return true;
    });
    
    // Record the optimization step
    this.executionSteps.push({
      type: 'optimize-network',
      originalSize: originalSize,
      optimizedSize: this.network.length,
      reduction: originalSize - this.network.length,
      message: `Optimized network from ${originalSize} to ${this.network.length} comparators`
    });
  }
  
  /**
   * Execute the sorting network on the input array
   * 
   * @param {Array} array - Array to be sorted
   * @private
   */
  executeSortingNetwork(array) {
    // In parallel simulation, we execute stages of the network
    if (this.options.simulateParallel) {
      this.executeParallelNetwork(array);
    } else {
      this.executeSequentialNetwork(array);
    }
  }
  
  /**
   * Execute the network sequentially
   * 
   * @param {Array} array - Array to be sorted
   * @private
   */
  executeSequentialNetwork(array) {
    // Execute each comparator sequentially
    for (let comparatorIdx = 0; comparatorIdx < this.network.length; comparatorIdx++) {
      const [i, j] = this.network[comparatorIdx];
      
      // Record the comparison operation
      this.recordState(array, {
        type: 'comparator',
        indices: [i, j],
        comparatorIndex: comparatorIdx,
        values: [array[i], array[j]],
        message: `Comparing elements at indices ${i} and ${j}`
      });
      
      // Perform compare-and-swap
      if (this.compare(array[i], array[j]) > 0) {
        this.swap(array, i, j);
        
        // Record the swap operation
        this.recordState(array, {
          type: 'network-swap',
          indices: [i, j],
          comparatorIndex: comparatorIdx,
          message: `Swapped elements at indices ${i} and ${j}`
        });
      }
    }
  }
  
  /**
   * Execute the network in parallel stages
   * 
   * @param {Array} array - Array to be sorted
   * @private
   */
  executeParallelNetwork(array) {
    // Identify parallelizable stages in the network
    const stages = this.identifyParallelStages();
    
    // Execute each stage
    for (let stageIdx = 0; stageIdx < stages.length; stageIdx++) {
      const stage = stages[stageIdx];
      
      // Record the stage beginning
      this.recordState(array, {
        type: 'parallel-stage-begin',
        stage: stageIdx + 1,
        comparators: stage,
        message: `Beginning parallel stage ${stageIdx + 1} with ${stage.length} comparators`
      });
      
      // Collect all swaps to perform in this stage
      const swapsToPerform = [];
      
      // Evaluate all comparators in this stage
      for (const [i, j] of stage) {
        // Record the comparison
        this.compare(array[i], array[j]);
        
        // If swap needed, record it
        if (array[i] > array[j]) {
          swapsToPerform.push([i, j]);
        }
      }
      
      // Perform all swaps for this stage in parallel
      if (swapsToPerform.length > 0) {
        // Create a copy for visualization
        const beforeSwap = [...array];
        
        // Apply all swaps
        for (const [i, j] of swapsToPerform) {
          this.swap(array, i, j);
        }
        
        // Record the parallel swap operation
        this.recordState(array, {
          type: 'parallel-stage-swap',
          stage: stageIdx + 1,
          swaps: swapsToPerform,
          beforeState: beforeSwap,
          message: `Performed ${swapsToPerform.length} swaps in parallel during stage ${stageIdx + 1}`
        });
      }
      
      // Record the stage completion
      this.recordState(array, {
        type: 'parallel-stage-complete',
        stage: stageIdx + 1,
        message: `Completed parallel stage ${stageIdx + 1}`
      });
    }
  }
  
  /**
   * Identify parallelizable stages in the network
   * 
   * @returns {Array} - Array of parallel stages, each containing comparators that can execute in parallel
   * @private
   */
  identifyParallelStages() {
    const stages = [];
    const usedIndices = new Set();
    
    // Create a copy of the network for processing
    const remainingComparators = [...this.network];
    
    // While there are comparators left to process
    while (remainingComparators.length > 0) {
      const currentStage = [];
      usedIndices.clear();
      
      // Find all comparators that can execute in parallel
      for (let i = 0; i < remainingComparators.length; i++) {
        const [a, b] = remainingComparators[i];
        
        // If neither index is used in this stage, add to current stage
        if (!usedIndices.has(a) && !usedIndices.has(b)) {
          currentStage.push(remainingComparators[i]);
          usedIndices.add(a);
          usedIndices.add(b);
          
          // Remove from remaining comparators (adjust i to account for removal)
          remainingComparators.splice(i, 1);
          i--;
        }
      }
      
      // Add the current stage
      if (currentStage.length > 0) {
        stages.push(currentStage);
      }
    }
    
    return stages;
  }
  
  /**
   * Get the time and space complexity of Odd-Even Merge Sort
   * 
   * @returns {Object} - Complexity information
   */
  getComplexity() {
    return {
      time: {
        best: 'O(n log² n)',
        average: 'O(n log² n)',
        worst: 'O(n log² n)',
        parallel: 'O(log² n) with O(n log² n) processors'
      },
      space: {
        best: 'O(n)',   // For network representation
        average: 'O(n)',
        worst: 'O(n)'
      },
      comparators: 'O(n log² n)'  // Network size
    };
  }
  
  /**
   * Whether Odd-Even Merge Sort is stable
   * 
   * @returns {boolean} - False as Odd-Even Merge Sort is not stable
   */
  isStable() {
    return false;
  }
  
  /**
   * Whether Odd-Even Merge Sort is in-place
   * 
   * @returns {boolean} - True for execution, false considering network storage
   */
  isInPlace() {
    return true;  // The sorting itself is in-place, though network generation is not
  }
  
  /**
   * Get detailed algorithm information
   * 
   * @returns {Object} - Detailed algorithm metadata
   */
  getInfo() {
    const info = super.getInfo();
    
    // Add Odd-Even Merge Sort specific information
    info.optimization = {
      visualizeNetwork: this.options.visualizeNetwork,
      optimizeNetworkSize: this.options.optimizeNetworkSize,
      simulateParallel: this.options.simulateParallel
    };
    
    info.properties = {
      isNetwork: true,
      comparisonBased: true,
      stable: false,
      inPlace: true,  // Execution is in-place
      dataOblivious: true,  // Performance is independent of input data
      parallelizable: true
    };
    
    info.networkCharacteristics = {
      size: 'O(n log² n) comparators',
      depth: 'O(log² n) parallel steps',
      regularity: 'Highly regular structure',
      modularity: 'Composed of merge networks',
      verification: 'Provably correct by construction'
    };
    
    info.parallelCharacteristics = {
      granularity: 'Fine-grained',
      synchronization: 'Barrier synchronization between stages',
      communicationPattern: 'Local communication between adjacent processors',
      scalability: 'Excellent with O(n log² n) processors',
      speedup: 'O(n) speedup with sufficient processors'
    };
    
    info.applications = [
      'Hardware sorting networks',
      'FPGA implementations',
      'Systolic arrays',
      'Parallel computing environments',
      'High-throughput sorting applications'
    ];
    
    info.advantages = [
      'Data-oblivious with consistent performance regardless of input',
      'Highly parallelizable with predictable execution path',
      'Well-suited for hardware implementation',
      'No conditional branches or complex data structures',
      'Theoretically elegant with mathematical properties'
    ];
    
    info.disadvantages = [
      'Not competitive sequentially with O(n log n) algorithms',
      'Not adaptive to pre-sorted or partially sorted inputs',
      'Not stable - does not preserve order of equal elements',
      'Network size grows as O(n log² n) rather than O(n log n)',
      'Requires padding to power-of-two size for standard implementation'
    ];
    
    info.relatedAlgorithms = [
      'Bitonic Sort (another network sorting algorithm)',
      'Batcher\'s Odd-Even Mergesort (an optimization of this algorithm)',
      'Pairwise Sorting Networks',
      'Merge Sort (shares divide-and-conquer approach)',
      'Shellsort (also uses incremental sequence of comparisons)'
    ];
    
    info.theoreticalFoundation = [
      'Recursively divides array into odd-indexed and even-indexed elements',
      'Sorts the two subarrays recursively',
      'Merges using a specialized odd-even merging network',
      'Builds a sorting network with O(n log² n) comparators',
      'Achieves optimal O(log² n) parallel time complexity'
    ];
    
    return info;
  }
}

export default OddEvenMergeSort;