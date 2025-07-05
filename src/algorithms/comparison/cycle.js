// src/algorithms/comparison/cycle.js

import Algorithm from '../core/algorithm-base';

/**
 * Implementation of Cycle Sort algorithm with comprehensive instrumentation.
 * 
 * Cycle Sort is an in-place, unstable comparison sorting algorithm that is
 * theoretically optimal in terms of the number of memory writes. It works by
 * dividing the array into cycles where each element is placed directly into
 * its correct position, minimizing the total number of writes.
 * 
 * Key characteristics:
 * - Optimal in terms of memory writes (each element is written exactly once to its final position)
 * - Useful when write operations are significantly more expensive than reads
 * - Not stable (does not preserve the relative order of equal elements)
 * - In-place sorting algorithm (requires O(1) auxiliary space)
 * 
 * @class CycleSort
 * @extends Algorithm
 */
class CycleSort extends Algorithm {
  /**
   * Create a new CycleSort instance
   * 
   * @param {Object} options - Configuration options
   * @param {boolean} [options.enableOptimization=true] - Enable optimization for repeated elements
   * @param {boolean} [options.countCycles=true] - Track and report cycle information
   */
  constructor(options = {}) {
    super('Cycle Sort', 'comparison', options);
    
    // Default options
    this.options = {
      enableOptimization: true,  // Optimization for handling repeated elements
      countCycles: true,         // Count and report cycle information
      ...options
    };
    
    // Additional metrics specific to Cycle Sort
    this.metrics.cycles = 0;       // Number of cycles found
    this.metrics.cycleLength = 0;  // Total length of all cycles
    this.metrics.maxCycleLength = 0; // Length of longest cycle
  }
  
  /**
   * Execute Cycle Sort on the input array
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
    
    this.setPhase('sorting');
    
    // Reset cycle metrics
    this.metrics.cycles = 0;
    this.metrics.cycleLength = 0;
    this.metrics.maxCycleLength = 0;
    
    // For each array element
    for (let cycleStart = 0; cycleStart < n - 1; cycleStart++) {
      let item = this.read(result, cycleStart);
      
      // Find correct position for the current element
      let pos = cycleStart;
      for (let i = cycleStart + 1; i < n; i++) {
        if (this.compare(this.read(result, i), item) < 0) {
          pos++;
        }
      }
      
      // If the element is already in the correct position
      if (pos === cycleStart) {
        this.recordState(result, {
          type: 'skip-cycle',
          index: cycleStart,
          message: `Element ${item} at index ${cycleStart} is already in its correct position`
        });
        continue;
      }
      
      // Handle repeated elements
      // For duplicate elements, pos is the position of the first occurrence
      if (options.enableOptimization) {
        while (item === this.read(result, pos)) {
          pos++;
        }
      }
      
      // Start tracking this cycle
      let cycleLength = 1;
      let cycleElements = [item];
      this.metrics.cycles++;
      
      // Put the item into its correct position and rotate the cycle
      let temp = this.read(result, pos);
      this.write(result, pos, item);
      item = temp;
      cycleElements.push(item);
      
      this.recordState(result, {
        type: 'cycle-start',
        index: cycleStart,
        position: pos,
        item: item,
        message: `Starting cycle at index ${cycleStart}, moved element ${cycleElements[0]} to position ${pos}`
      });
      
      // Continue the cycle by placing each displaced element
      while (pos !== cycleStart) {
        // Find the correct position for the current item
        pos = cycleStart;
        for (let i = cycleStart + 1; i < n; i++) {
          if (this.compare(this.read(result, i), item) < 0) {
            pos++;
          }
        }
        
        // Handle repeated elements
        if (options.enableOptimization) {
          while (item === this.read(result, pos)) {
            pos++;
          }
        }
        
        // Continue the cycle with the next element
        cycleLength++;
        
        // Swap the current item with the element at its correct position
        temp = this.read(result, pos);
        this.write(result, pos, item);
        item = temp;
        cycleElements.push(item);
        
        this.recordState(result, {
          type: 'cycle-continue',
          position: pos,
          cycleStart: cycleStart,
          item: item,
          cycleLength: cycleLength,
          message: `Continuing cycle from index ${cycleStart}, placed element at position ${pos}`
        });
      }
      
      // Update cycle metrics
      this.metrics.cycleLength += cycleLength;
      this.metrics.maxCycleLength = Math.max(this.metrics.maxCycleLength, cycleLength);
      
      // Record the completion of a cycle
      this.recordState(result, {
        type: 'cycle-complete',
        cycleStart: cycleStart,
        cycleLength: cycleLength,
        cycleElements: cycleElements,
        message: `Completed cycle of length ${cycleLength} starting at index ${cycleStart}`
      });
    }
    
    this.setPhase('completed');
    
    // Record final analysis
    this.recordState(result, {
      type: 'analysis',
      cycles: this.metrics.cycles,
      avgCycleLength: this.metrics.cycleLength / (this.metrics.cycles || 1),
      maxCycleLength: this.metrics.maxCycleLength,
      message: `Found ${this.metrics.cycles} cycles with average length ${(this.metrics.cycleLength / (this.metrics.cycles || 1)).toFixed(2)}`
    });
    
    return result;
  }
  
  /**
   * Get the time and space complexity of Cycle Sort
   * 
   * @returns {Object} - Complexity information
   */
  getComplexity() {
    return {
      time: {
        best: 'O(n²)',
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
  
  /**
   * Whether Cycle Sort is stable
   * 
   * @returns {boolean} - False as Cycle Sort is not stable
   */
  isStable() {
    return false;
  }
  
  /**
   * Whether Cycle Sort is in-place
   * 
   * @returns {boolean} - True as Cycle Sort is in-place
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
    
    // Add cycle sort specific information
    info.optimization = {
      enableOptimization: this.options.enableOptimization,
      countCycles: this.options.countCycles
    };
    
    info.properties = {
      comparisonBased: true,
      stable: false,
      inPlace: true,
      online: false,
      writeOptimal: true  // Key characteristic of Cycle Sort
    };
    
    info.suitable = {
      smallArrays: false,
      nearlySortedArrays: false,
      largeArrays: false,
      expensiveWrites: true   // Optimal when writes are expensive
    };
    
    info.advantages = [
      'Minimizes the number of memory writes (each value is written exactly once to its final position)',
      'Useful for flash memory or EEPROM where writes are expensive',
      'In-place algorithm requiring no additional memory',
      'Simple implementation with no recursion'
    ];
    
    info.disadvantages = [
      'Quadratic time complexity in all cases (O(n²))',
      'Not stable (does not preserve order of equal elements)',
      'Performs poorly compared to other quadratic sorts like insertion sort in practice',
      'Not adaptive to partially sorted input'
    ];
    
    info.performance = {
      writes: 'O(n)',  // The key advantage of Cycle Sort
      reads: 'O(n²)',  // But requires many reads
      comparisons: 'O(n²)'
    };
    
    // Add cycle statistics if available
    if (this.options.countCycles && this.metrics.cycles > 0) {
      info.cycleStatistics = {
        totalCycles: this.metrics.cycles,
        averageCycleLength: this.metrics.cycleLength / this.metrics.cycles,
        maxCycleLength: this.metrics.maxCycleLength
      };
    }
    
    return info;
  }
}

export default CycleSort;