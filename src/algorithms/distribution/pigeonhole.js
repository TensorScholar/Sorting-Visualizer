// src/algorithms/distribution/pigeonhole.js

import Algorithm from '../core/algorithm-base';

/**
 * Implementation of Pigeonhole Sort algorithm with comprehensive instrumentation.
 * 
 * Pigeonhole Sort is a non-comparison sorting algorithm that works efficiently
 * when the range of keys (m) is small compared to the number of items (n).
 * The algorithm creates "pigeonholes" for each possible key value, distributes
 * elements into their respective pigeonholes, and then collects them in order.
 * 
 * Key characteristics:
 * - Linear time complexity O(n + m) where m is the range of values
 * - Efficient for integer sorting with limited range
 * - Stable sorting (preserves relative order of equal elements)
 * - Not in-place (requires additional space proportional to range)
 * - Particularly suitable for uniformly distributed data
 * 
 * @class PigeonholeSort
 * @extends Algorithm
 */
class PigeonholeSort extends Algorithm {
  /**
   * Create a new PigeonholeSort instance
   * 
   * @param {Object} options - Configuration options
   * @param {boolean} [options.detectRange=true] - Auto-detect value range
   * @param {boolean} [options.useSetForEmptyCheck=false] - Use Set for faster empty pigeonhole check
   * @param {boolean} [options.dynamicPigeonholes=true] - Use Map or Object for sparse data
   */
  constructor(options = {}) {
    super('Pigeonhole Sort', 'distribution', options);
    
    // Default options
    this.options = {
      detectRange: true,               // Auto-detect the range of values
      useSetForEmptyCheck: false,      // Use Set for faster empty pigeonhole check
      dynamicPigeonholes: true,        // Use Map or Object for sparse data
      minValue: undefined,             // Minimum value in range (auto-detected if not provided)
      maxValue: undefined,             // Maximum value in range (auto-detected if not provided)
      pigeonholeFactory: undefined,    // Custom function to create pigeonholes
      ...options
    };
    
    // Additional metrics specific to Pigeonhole Sort
    this.metrics.range = 0;               // Range of values (max - min + 1)
    this.metrics.emptyPigeonholes = 0;    // Number of empty pigeonholes
    this.metrics.pigeonholeDistribution = {}; // Distribution of elements in pigeonholes
  }
  
  /**
   * Execute Pigeonhole Sort on the input array
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
    
    this.setPhase('analysis');
    
    // Determine the range of values
    let min, max;
    
    if (options.detectRange || options.minValue === undefined || options.maxValue === undefined) {
      [min, max] = this.findMinMax(result);
      
      this.recordState(result, {
        type: 'range-detection',
        min: min,
        max: max,
        range: max - min + 1,
        message: `Detected value range: [${min}, ${max}]`
      });
    } else {
      min = options.minValue;
      max = options.maxValue;
      
      this.recordState(result, {
        type: 'range-provided',
        min: min,
        max: max,
        range: max - min + 1,
        message: `Using provided value range: [${min}, ${max}]`
      });
    }
    
    // Calculate range and update metrics
    const range = max - min + 1;
    this.metrics.range = range;
    
    // Check if range is too large for efficient sorting
    if (range > n * Math.log(n) && !options.forcePigeonhole) {
      this.recordState(result, {
        type: 'range-warning',
        range: range,
        elements: n,
        message: `Range ${range} significantly larger than element count ${n}, consider a different algorithm`
      });
    }
    
    this.setPhase('sorting');
    
    // Create pigeonholes based on the range
    const pigeonholes = this.createPigeonholes(range, options);
    
    this.recordState(result, {
      type: 'pigeonholes-created',
      count: range,
      message: `Created ${range} pigeonholes for sorting`
    });
    
    // 1. Distribution phase: Put each element into its pigeonhole
    for (let i = 0; i < n; i++) {
      const value = this.read(result, i);
      const index = value - min;  // Normalize value to pigeonhole index
      
      this.insertIntoPigeonhole(pigeonholes, index, value, options);
      
      // Record the distribution step
      this.recordState(result, {
        type: 'distribution',
        value: value,
        pigeonhole: index,
        message: `Distributed element ${value} to pigeonhole ${index}`
      });
    }
    
    // Gather statistics about pigeonhole distribution
    this.analyzePigeonholeDistribution(pigeonholes, range, options);
    
    this.setPhase('collection');
    
    // 2. Collection phase: Collect elements in order
    let index = 0;
    
    for (let i = 0; i < range; i++) {
      // Get the current pigeonhole
      const currentPigeonhole = this.getPigeonhole(pigeonholes, i, options);
      
      if (this.isPigeonholeEmpty(currentPigeonhole, options)) {
        // Skip empty pigeonhole
        continue;
      }
      
      // Process elements in the current pigeonhole
      this.collectFromPigeonhole(result, currentPigeonhole, i, index, min, options);
      
      // Advance index by the number of elements in this pigeonhole
      index += (Array.isArray(currentPigeonhole) ? currentPigeonhole.length : 1);
      
      // Record the collection step
      this.recordState(result, {
        type: 'collection',
        pigeonhole: i,
        collectedCount: index,
        message: `Collected elements from pigeonhole ${i}, total collected: ${index}`
      });
    }
    
    this.setPhase('completed');
    
    // Final analysis
    this.recordState(result, {
      type: 'sorting-complete',
      range: range,
      emptyPigeonholes: this.metrics.emptyPigeonholes,
      message: `Sorting completed with ${range} pigeonholes, ${this.metrics.emptyPigeonholes} were empty`
    });
    
    return result;
  }
  
  /**
   * Find the minimum and maximum values in the array
   * 
   * @param {Array} array - The input array
   * @returns {Array} - [min, max] values
   */
  findMinMax(array) {
    let min = Infinity;
    let max = -Infinity;
    
    for (let i = 0; i < array.length; i++) {
      const value = this.read(array, i);
      
      if (value < min) {
        min = value;
      }
      if (value > max) {
        max = value;
      }
    }
    
    return [min, max];
  }
  
  /**
   * Create pigeonholes based on the range
   * 
   * @param {number} range - Range of values
   * @param {Object} options - Algorithm options
   * @returns {*} - Pigeonhole data structure
   */
  createPigeonholes(range, options) {
    // Use custom factory if provided
    if (typeof options.pigeonholeFactory === 'function') {
      return options.pigeonholeFactory(range);
    }
    
    // Choose the appropriate data structure based on options
    if (options.dynamicPigeonholes) {
      // Use Map for sparse data (when range is large but many pigeonholes might be empty)
      return new Map();
    } else {
      // Use Array for dense data (when most pigeonholes will be used)
      const pigeonholes = new Array(range);
      
      // Initialize pigeonholes
      for (let i = 0; i < range; i++) {
        pigeonholes[i] = [];
      }
      
      return pigeonholes;
    }
  }
  
  /**
   * Insert a value into its pigeonhole
   * 
   * @param {*} pigeonholes - Pigeonhole data structure
   * @param {number} index - Pigeonhole index
   * @param {*} value - Value to insert
   * @param {Object} options - Algorithm options
   */
  insertIntoPigeonhole(pigeonholes, index, value, options) {
    if (options.dynamicPigeonholes) {
      // Using Map or dynamic structure
      if (!pigeonholes.has(index)) {
        pigeonholes.set(index, []);
      }
      pigeonholes.get(index).push(value);
    } else {
      // Using Array
      pigeonholes[index].push(value);
    }
    
    // Update metrics
    if (!this.metrics.pigeonholeDistribution[index]) {
      this.metrics.pigeonholeDistribution[index] = 0;
    }
    this.metrics.pigeonholeDistribution[index]++;
  }
  
  /**
   * Get a specific pigeonhole
   * 
   * @param {*} pigeonholes - Pigeonhole data structure
   * @param {number} index - Pigeonhole index
   * @param {Object} options - Algorithm options
   * @returns {*} - The pigeonhole container
   */
  getPigeonhole(pigeonholes, index, options) {
    if (options.dynamicPigeonholes) {
      // Using Map or dynamic structure
      return pigeonholes.get(index) || [];
    } else {
      // Using Array
      return pigeonholes[index];
    }
  }
  
  /**
   * Check if a pigeonhole is empty
   * 
   * @param {*} pigeonhole - The pigeonhole to check
   * @param {Object} options - Algorithm options
   * @returns {boolean} - True if the pigeonhole is empty
   */
  isPigeonholeEmpty(pigeonhole, options) {
    if (options.useSetForEmptyCheck) {
      // Using Set for faster empty check
      return pigeonhole.size === 0;
    } else {
      // Standard check for Arrays
      return !pigeonhole || pigeonhole.length === 0;
    }
  }
  
  /**
   * Collect elements from a pigeonhole into the result array
   * 
   * @param {Array} result - Result array
   * @param {*} pigeonhole - The pigeonhole to collect from
   * @param {number} pigeonholeIndex - Index of the pigeonhole
   * @param {number} resultIndex - Current index in result array
   * @param {number} min - Minimum value for normalization
   * @param {Object} options - Algorithm options
   */
  collectFromPigeonhole(result, pigeonhole, pigeonholeIndex, resultIndex, min, options) {
    // Process all elements in the current pigeonhole
    for (let j = 0; j < pigeonhole.length; j++) {
      const value = pigeonhole[j];
      this.write(result, resultIndex + j, value);
      
      // Record individual element placement
      this.recordState(result, {
        type: 'placement',
        value: value,
        pigeonhole: pigeonholeIndex,
        position: resultIndex + j,
        message: `Placed element ${value} from pigeonhole ${pigeonholeIndex} at position ${resultIndex + j}`
      });
    }
  }
  
  /**
   * Analyze pigeonhole distribution for metrics
   * 
   * @param {*} pigeonholes - Pigeonhole data structure
   * @param {number} range - Range of values
   * @param {Object} options - Algorithm options
   */
  analyzePigeonholeDistribution(pigeonholes, range, options) {
    let emptyCount = 0;
    
    if (options.dynamicPigeonholes) {
      // For dynamic structures (Map, Object)
      emptyCount = range - pigeonholes.size;
    } else {
      // For array-based pigeonholes
      for (let i = 0; i < range; i++) {
        if (this.isPigeonholeEmpty(pigeonholes[i], options)) {
          emptyCount++;
        }
      }
    }
    
    this.metrics.emptyPigeonholes = emptyCount;
    
    // Record distribution analysis
    this.recordState([], {
      type: 'distribution-analysis',
      emptyPigeonholes: emptyCount,
      emptyPercentage: (emptyCount / range) * 100,
      distribution: this.metrics.pigeonholeDistribution,
      message: `Distribution analysis: ${emptyCount} empty pigeonholes (${((emptyCount / range) * 100).toFixed(2)}%)`
    });
  }
  
  /**
   * Get the time and space complexity of Pigeonhole Sort
   * 
   * @returns {Object} - Complexity information
   */
  getComplexity() {
    return {
      time: {
        best: 'O(n + m)',    // When range is small
        average: 'O(n + m)', // Where m is the range (max - min + 1)
        worst: 'O(n + m)'    // When range is large
      },
      space: {
        best: 'O(n + m)',
        average: 'O(n + m)',
        worst: 'O(n + m)'
      }
    };
  }
  
  /**
   * Whether Pigeonhole Sort is stable
   * 
   * @returns {boolean} - True as Pigeonhole Sort is stable
   */
  isStable() {
    return true;
  }
  
  /**
   * Whether Pigeonhole Sort is in-place
   * 
   * @returns {boolean} - False as Pigeonhole Sort is not in-place
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
    
    // Add pigeonhole sort specific information
    info.optimization = {
      detectRange: this.options.detectRange,
      useSetForEmptyCheck: this.options.useSetForEmptyCheck,
      dynamicPigeonholes: this.options.dynamicPigeonholes,
      minValue: this.options.minValue,
      maxValue: this.options.maxValue
    };
    
    info.properties = {
      comparisonBased: false,  // Non-comparison sort
      stable: true,
      inPlace: false,
      online: false,
      distributionSensitive: true  // Sensitive to the distribution of input data
    };
    
    info.suitable = {
      smallArrays: true,
      uniformData: true,         // Best for uniform distributions
      limitedRange: true,        // Best when range is small
      integerSorting: true       // Ideal for integer sorting
    };
    
    info.advantages = [
      'Linear time complexity O(n + m) where m is the range',
      'Very efficient when the range of values is small',
      'Simple implementation with predictable performance',
      'Stable sort that preserves the relative order of equal elements',
      'Useful for pre-processing in more complex algorithms'
    ];
    
    info.disadvantages = [
      'Requires additional space proportional to the range of values',
      'Inefficient when the range is significantly larger than n',
      'Not suitable for floating-point values without modification',
      'Not adaptable to different data distributions',
      'Cannot be easily parallelized'
    ];
    
    info.relationships = {
      family: 'Distribution Sorts',
      related: [
        'Counting Sort',
        'Bucket Sort',
        'Radix Sort'
      ]
    };
    
    // Add range statistics if available
    if (this.metrics.range > 0) {
      info.rangeStatistics = {
        range: this.metrics.range,
        emptyPigeonholes: this.metrics.emptyPigeonholes,
        emptyPercentage: (this.metrics.emptyPigeonholes / this.metrics.range) * 100,
        efficiencyRatio: this.metrics.range / this.metrics.reads
      };
    }
    
    return info;
  }
}

export default PigeonholeSort;