// src/algorithms/distribution/counting.js

import Algorithm from '../core/algorithm-base';

/**
 * Implementation of Counting Sort algorithm with multiple visualization options.
 * 
 * Counting Sort works by:
 * 1. Counting occurrences of each element in the input array
 * 2. Computing cumulative counts to determine positions
 * 3. Building the output array by placing elements in their correct positions
 * 
 * This is a non-comparison based sort with O(n+k) time complexity,
 * where k is the range of input values.
 * 
 * @class CountingSort
 * @extends Algorithm
 */
class CountingSort extends Algorithm {
  /**
   * Create a new CountingSort instance
   * 
   * @param {Object} options - Configuration options
   * @param {boolean} [options.visualizeCountingArray=true] - Visualize the counting array
   * @param {boolean} [options.visualizeCumulativeCounts=true] - Visualize cumulative count calculation
   * @param {boolean} [options.stableSort=true] - Use stable sorting for equal elements
   * @param {boolean} [options.autoDetectRange=true] - Automatically detect input range
   */
  constructor(options = {}) {
    super('Counting Sort', 'distribution', options);
    
    // Default options
    this.options = {
      visualizeCountingArray: true,     // Visualize the counting array
      visualizeCumulativeCounts: true,  // Visualize cumulative count calculation
      stableSort: true,                 // Use stable sorting for equal elements
      autoDetectRange: true,            // Automatically detect input range
      minValue: 0,                      // Minimum value in array (used if autoDetectRange is false)
      maxValue: 100,                    // Maximum value in array (used if autoDetectRange is false)
      ...options
    };
  }
  
  /**
   * Execute Counting Sort on the input array
   * 
   * @param {Array} array - Input array to be sorted
   * @param {Object} options - Runtime options
   * @returns {Array} - Sorted array
   */
  run(array, options) {
    // Clone array to avoid modifying the original
    const result = [...array];
    const n = result.length;
    
    // Early return for empty or single-element arrays
    if (n <= 1) {
      return result;
    }
    
    this.setPhase('range-detection');
    
    // Determine range of values
    let min = options.minValue;
    let max = options.maxValue;
    
    if (options.autoDetectRange) {
      min = Infinity;
      max = -Infinity;
      
      for (let i = 0; i < n; i++) {
        const value = this.read(result, i);
        if (value < min) min = value;
        if (value > max) max = value;
      }
      
      this.recordState(result, {
        type: 'range-detection',
        min,
        max,
        message: `Detected value range: [${min}, ${max}]`
      });
    }
    
    this.setPhase('counting');
    
    // Create counting array
    const range = max - min + 1;
    const count = new Array(range).fill(0);
    
    // Count occurrences of each element
    for (let i = 0; i < n; i++) {
      const value = this.read(result, i);
      const index = value - min;
      count[index]++;
      
      if (options.visualizeCountingArray) {
        this.recordState(result, {
          type: 'counting',
          value,
          countIndex: index,
          countArray: [...count],
          message: `Counting occurrences: count[${value}] = ${count[index]}`
        });
      }
    }
    
    this.setPhase('cumulative-counting');
    
    // Compute cumulative counts
    if (options.visualizeCumulativeCounts) {
      this.recordState(result, {
        type: 'cumulative-init',
        countArray: [...count],
        message: `Initial counting array: [${count.join(', ')}]`
      });
    }
    
    for (let i = 1; i < range; i++) {
      count[i] += count[i - 1];
      
      if (options.visualizeCumulativeCounts) {
        this.recordState(result, {
          type: 'cumulative-update',
          index: i,
          countArray: [...count],
          message: `Updated cumulative count: count[${i + min}] = ${count[i]}`
        });
      }
    }
    
    this.setPhase('building-output');
    
    // Build the output array
    const output = new Array(n);
    
    // Process array from right to left for stability
    for (let i = n - 1; i >= 0; i--) {
      const value = this.read(result, i);
      const countIndex = value - min;
      const position = count[countIndex] - 1;
      
      this.write(output, position, value);
      count[countIndex]--;
      
      this.recordState([...output], {
        type: 'placement',
        value,
        sourceIndex: i,
        targetIndex: position,
        countArray: [...count],
        originalArray: [...result],
        message: `Placing value ${value} from index ${i} to position ${position}`
      });
    }
    
    // Copy output back to result array
    for (let i = 0; i < n; i++) {
      this.write(result, i, output[i]);
    }
    
    this.setPhase('completed');
    
    this.recordState(result, {
      type: 'final',
      message: 'Sorting completed'
    });
    
    return result;
  }
  
  /**
   * Get the time and space complexity of Counting Sort
   * 
   * @returns {Object} - Complexity information
   */
  getComplexity() {
    return {
      time: {
        best: 'O(n+k)',
        average: 'O(n+k)',
        worst: 'O(n+k)'
      },
      space: {
        best: 'O(n+k)',
        average: 'O(n+k)',
        worst: 'O(n+k)'
      }
    };
  }
  
  /**
   * Whether Counting Sort is stable
   * 
   * @returns {boolean} - True if using stable sort option
   */
  isStable() {
    return this.options.stableSort;
  }
  
  /**
   * Whether Counting Sort is in-place
   * 
   * @returns {boolean} - False as Counting Sort requires O(n+k) extra space
   */
  isInPlace() {
    return false;
  }
  
  /**
   * Get detailed algorithm information
   * 
   * @returns {Object} - Detailed algorithm metadata
   */
  getInfo() {
    const info = super.getInfo();
    
    // Add counting sort specific information
    info.optimization = {
      visualizeCountingArray: this.options.visualizeCountingArray,
      visualizeCumulativeCounts: this.options.visualizeCumulativeCounts,
      stableSort: this.options.stableSort,
      autoDetectRange: this.options.autoDetectRange
    };
    
    info.properties = {
      comparisonBased: false,
      stable: this.options.stableSort,
      inPlace: false,
      online: false,
      distributional: true
    };
    
    info.suitable = {
      smallArrays: true,
      nearlySortedArrays: true,
      largeArrays: true,
      limitedRange: true
    };
    
    info.variants = [
      'Standard Counting Sort',
      'Counting Sort with stability preservation',
      'Object Counting Sort (sorting objects by keys)',
      'Radix Sort (uses Counting Sort as a subroutine)'
    ];
    
    info.advantages = [
      'O(n+k) time complexity, which can be O(n) when k is O(n)',
      'Can be faster than comparison-based sorts for suitable inputs',
      'Stable sorting when implemented properly',
      'Works well for discrete data with limited range'
    ];
    
    info.disadvantages = [
      'Requires O(n+k) extra space',
      'Inefficient when the range (k) is much larger than the input size (n)',
      'Only applicable to non-negative integers or data that can be mapped to them',
      'Requires knowledge of the range of input values'
    ];
    
    return info;
  }
}

export default CountingSort;