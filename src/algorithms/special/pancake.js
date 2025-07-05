// src/algorithms/special/pancake.js

import Algorithm from '../core/algorithm-base';

/**
 * Implementation of Pancake Sort algorithm with visualization of the flipping operations.
 * 
 * Pancake Sort is a sorting algorithm that sorts an array by repeatedly flipping 
 * prefixes of the array (like flipping pancakes on a griddle with a spatula).
 * It works by:
 * 1. Finding the maximum element in the unsorted portion of the array
 * 2. Flipping the array from start to the position of this maximum element (bringing it to the front)
 * 3. Flipping the array from start to the boundary of sorted/unsorted regions (moving the maximum to its correct position)
 * 4. Reducing the unsorted region by one element and repeating
 * 
 * Pancake Sort is primarily of theoretical interest with connections to prefix reversal problems
 * in computational biology and genome rearrangement.
 * 
 * This implementation includes:
 * - Visualization of the flipping operations
 * - Optimized flip sequence computation
 * - Variant with fewer flips (optimized strategy)
 * - Connection to the pancake problem and its applications
 * 
 * @class PancakeSort
 * @extends Algorithm
 */
class PancakeSort extends Algorithm {
  /**
   * Create a new PancakeSort instance
   * 
   * @param {Object} options - Configuration options
   * @param {boolean} [options.visualizeFlips=true] - Visualize the flipping operations
   * @param {boolean} [options.optimizedStrategy=true] - Use optimized flipping strategy to reduce flip count
   * @param {boolean} [options.findMinimum=false] - Find minimum instead of maximum (alternate strategy)
   * @param {boolean} [options.trackFlipMetrics=true] - Track and analyze flip operations
   */
  constructor(options = {}) {
    super('Pancake Sort', 'special', options);
    
    // Default options
    this.options = {
      visualizeFlips: true,       // Visualize the flipping operations
      optimizedStrategy: true,    // Use optimized flipping strategy 
      findMinimum: false,         // Find minimum instead of maximum (alternate strategy)
      trackFlipMetrics: true,     // Track and analyze flip operations
      ...options
    };
    
    // Track flip operations
    this.flipCount = 0;
    this.flipSequence = [];
  }
  
  /**
   * Execute Pancake Sort on the input array
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
    
    // Reset flip metrics
    this.flipCount = 0;
    this.flipSequence = [];
    
    // Optimized strategy reduces the number of flips
    if (options.optimizedStrategy) {
      return this.optimizedPancakeSort(result, options);
    }
    
    // Basic pancake sort
    return this.basicPancakeSort(result, options);
  }
  
  /**
   * Basic pancake sort implementation
   * 
   * @param {Array} array - Array to sort
   * @param {Object} options - Runtime options
   * @returns {Array} - Sorted array
   */
  basicPancakeSort(array, options) {
    const n = array.length;
    
    // For each position in the array (from the largest to the smallest)
    for (let curr_size = n; curr_size > 1; curr_size--) {
      // Find the index of the maximum element in the current window
      const maxIdx = this.findMaxIndex(array, curr_size);
      
      this.recordState(array, {
        type: 'find-max',
        maxIndex: maxIdx,
        currentSize: curr_size,
        message: `Found maximum element ${array[maxIdx]} at index ${maxIdx} in window [0..${curr_size-1}]`
      });
      
      // If the maximum element is already at the end of the current window, no need to flip
      if (maxIdx === curr_size - 1) {
        continue;
      }
      
      // If the maximum element is not at the beginning, flip from 0 to maxIdx
      if (maxIdx !== 0) {
        // Flip from 0 to maxIdx (bring the maximum to the front)
        this.flip(array, maxIdx, options);
        
        this.recordState(array, {
          type: 'flip',
          flipIndex: maxIdx,
          message: `Flipped subarray [0..${maxIdx}] to bring maximum to front`
        });
      }
      
      // Now flip from 0 to curr_size-1 (bring the maximum to its final position)
      this.flip(array, curr_size - 1, options);
      
      this.recordState(array, {
        type: 'flip',
        flipIndex: curr_size - 1,
        message: `Flipped subarray [0..${curr_size-1}] to place maximum at position ${curr_size-1}`
      });
      
      // Mark the element as in its correct final position
      this.recordState(array, {
        type: 'sorted',
        indices: [curr_size - 1],
        message: `Element ${array[curr_size-1]} is now in its correct position ${curr_size-1}`
      });
    }
    
    this.setPhase('completed');
    return array;
  }
  
  /**
   * Optimized pancake sort with reduced flips
   * 
   * @param {Array} array - Array to sort
   * @param {Object} options - Runtime options
   * @returns {Array} - Sorted array
   */
  optimizedPancakeSort(array, options) {
    const n = array.length;
    
    // Sort from smallest to largest position (bottom-up)
    for (let i = 0; i < n; i++) {
      // Strategy can either find maximum or minimum elements
      const targetIndex = options.findMinimum 
        ? this.findMinIndex(array, i, n) 
        : this.findMaxIndex(array, n - i);
      
      const targetValue = array[targetIndex];
      const targetPosition = options.findMinimum ? i : n - i - 1;
      
      this.recordState(array, {
        type: options.findMinimum ? 'find-min' : 'find-max',
        targetIndex: targetIndex,
        targetPosition: targetPosition,
        currentWindow: options.findMinimum ? [i, n-1] : [0, n-i-1],
        message: `Found ${options.findMinimum ? 'minimum' : 'maximum'} element ${targetValue} at index ${targetIndex}`
      });
      
      // If element is already in position, continue
      if (targetIndex === targetPosition) {
        this.recordState(array, {
          type: 'skip-flip',
          index: targetIndex,
          message: `Element ${targetValue} is already in its correct position ${targetPosition}`
        });
        continue;
      }
      
      // Optimized flip sequence to minimize operations
      if (options.findMinimum) {
        // Bringing minimum to front
        if (targetIndex > i) {
          // Bring target to beginning of unsorted region
          if (targetIndex > i + 1) {
            this.flip(array, targetIndex, options);
            this.recordState(array, {
              type: 'flip',
              flipIndex: targetIndex,
              message: `Flipped subarray [${i}..${targetIndex}] to bring minimum to position ${i}`
            });
          }
        } else {
          // No flip needed, already at beginning of unsorted region
        }
      } else {
        // Bringing maximum to end
        if (targetIndex < targetPosition) {
          // If not at front, bring to front first
          if (targetIndex > 0) {
            this.flip(array, targetIndex, options);
            this.recordState(array, {
              type: 'flip',
              flipIndex: targetIndex,
              message: `Flipped subarray [0..${targetIndex}] to bring maximum to front`
            });
          }
          
          // Then flip to final position
          this.flip(array, targetPosition, options);
          this.recordState(array, {
            type: 'flip',
            flipIndex: targetPosition,
            message: `Flipped subarray [0..${targetPosition}] to place maximum at position ${targetPosition}`
          });
        }
      }
      
      // Mark element as sorted
      this.recordState(array, {
        type: 'sorted',
        indices: [targetPosition],
        message: `Element ${array[targetPosition]} is now in its correct position ${targetPosition}`
      });
    }
    
    this.setPhase('completed');
    return array;
  }
  
  /**
   * Find the index of the maximum element in a subarray
   * 
   * @param {Array} array - Input array
   * @param {number} size - Size of the subarray (from start)
   * @returns {number} - Index of the maximum element
   */
  findMaxIndex(array, size) {
    let maxIdx = 0;
    
    for (let i = 0; i < size; i++) {
      if (this.compare(array[i], array[maxIdx]) > 0) {
        maxIdx = i;
      }
    }
    
    return maxIdx;
  }
  
  /**
   * Find the index of the minimum element in a range
   * 
   * @param {Array} array - Input array
   * @param {number} start - Start index (inclusive)
   * @param {number} end - End index (exclusive)
   * @returns {number} - Index of the minimum element
   */
  findMinIndex(array, start, end) {
    let minIdx = start;
    
    for (let i = start; i < end; i++) {
      if (this.compare(array[i], array[minIdx]) < 0) {
        minIdx = i;
      }
    }
    
    return minIdx;
  }
  
  /**
   * Flip a subarray from index 0 to k
   * 
   * @param {Array} array - Array to modify
   * @param {number} k - End index of flip operation (inclusive)
   * @param {Object} options - Runtime options
   */
  flip(array, k, options) {
    // Increment flip count
    this.flipCount++;
    
    // Record flip operation if tracking metrics
    if (options.trackFlipMetrics) {
      this.flipSequence.push(k + 1); // 1-indexed for conventional pancake notation
    }
    
    // Reverse the elements from 0 to k
    let i = 0;
    while (i < k) {
      // Swap elements at i and k
      this.swap(array, i, k);
      i++;
      k--;
    }
  }
  
  /**
   * Get the time and space complexity of Pancake Sort
   * 
   * @returns {Object} - Complexity information
   */
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
      },
      flips: {
        upper_bound: '2n - 3', // Upper bound on the number of flips
        lower_bound: '15n/14'  // Lower bound (Heydari-Sobhi)
      }
    };
  }
  
  /**
   * Whether Pancake Sort is stable
   * 
   * @returns {boolean} - False as Pancake Sort is not stable
   */
  isStable() {
    return false;
  }
  
  /**
   * Whether Pancake Sort is in-place
   * 
   * @returns {boolean} - True as Pancake Sort is in-place
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
    
    // Add pancake sort specific information
    info.optimization = {
      visualizeFlips: this.options.visualizeFlips,
      optimizedStrategy: this.options.optimizedStrategy,
      findMinimum: this.options.findMinimum,
      trackFlipMetrics: this.options.trackFlipMetrics
    };
    
    info.properties = {
      comparisonBased: true,
      stable: false,
      inPlace: true,
      online: false,
      prefixReversal: true
    };
    
    info.suitable = {
      smallArrays: true,
      prefixReversalProblems: true,
      theoreticalStudy: true,
      genomicsResearch: true
    };
    
    info.variants = [
      'Standard Pancake Sort',
      'Optimized Pancake Sort (fewer flips)',
      'Burnt Pancake Sort (both sides matter)',
      'Prefix Reversal Problem variant'
    ];
    
    info.advantages = [
      'Simple to understand and implement',
      'In-place with O(1) auxiliary space',
      'Useful for studying prefix reversal problems',
      'Connected to problems in computational biology',
      'Interesting theoretical properties'
    ];
    
    info.disadvantages = [
      'Not practical for real-world sorting applications',
      'O(n²) time complexity is inefficient for large arrays',
      'Not stable (does not preserve order of equal elements)',
      'Requires more element movements than other sorting algorithms'
    ];
    
    info.applicationDomains = [
      'Computational Biology (genome rearrangement problems)',
      'Network routing (permutation routing)',
      'Parallel processing task scheduling',
      'Theoretical Computer Science (prefix reversal distance problems)'
    ];
    
    info.history = {
      origin: 'Puzzle problem introduced by mathematician Jacob E. Goodman (under pseudonym Harry Dweighter - "harried waiter")',
      notes: 'Named after the problem of sorting a stack of pancakes by size using a spatula to flip prefixes'
    };
    
    info.metrics = {
      flipCount: this.flipCount,
      flipSequence: this.flipSequence
    };
    
    return info;
  }
}

export default PancakeSort;