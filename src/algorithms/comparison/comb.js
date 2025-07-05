// src/algorithms/comparison/comb.js

import Algorithm from '../core/algorithm-base';

/**
 * Implementation of Comb Sort algorithm with multiple optimization strategies.
 * 
 * Comb Sort improves on Bubble Sort by using a gap sequence to eliminate
 * turtles (small values near the end of the array) early in the sorting process.
 * It works by:
 * 1. Starting with a large gap and comparing elements that are gap positions apart
 * 2. Gradually reducing the gap until it becomes 1 (at which point it is equivalent to Bubble Sort)
 * 3. Using a shrink factor (commonly 1.3) to reduce the gap in each iteration
 * 
 * This implementation includes optimizations:
 * - Early termination when no swaps occur in a complete pass
 * - Multiple shrink factor options
 * - Final phase optimization with bubble sort
 * - Adaptive gap sequence adjustments
 * 
 * @class CombSort
 * @extends Algorithm
 */
class CombSort extends Algorithm {
  /**
   * Create a new CombSort instance
   * 
   * @param {Object} options - Configuration options
   * @param {boolean} [options.earlyTermination=true] - Stop when no swaps occur in a pass
   * @param {number} [options.shrinkFactor=1.3] - Factor by which to shrink the gap (common values: 1.3, 1.25)
   * @param {boolean} [options.bubbleSortFinalization=true] - Use bubble sort for final phase
   * @param {boolean} [options.adaptiveGapSequence=true] - Adjust gap sequence based on array characteristics
   */
  constructor(options = {}) {
    super('Comb Sort', 'comparison', options);
    
    // Default options
    this.options = {
      earlyTermination: true,        // Stop when no swaps occur
      shrinkFactor: 1.3,             // Commonly used shrink factor (Knuth factor: 1.3)
      bubbleSortFinalization: true,  // Use bubble sort for final phase
      adaptiveGapSequence: true,     // Adjust gap sequence based on array characteristics
      ...options
    };
  }
  
  /**
   * Execute Comb Sort on the input array
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
    
    this.setPhase('gap-reduction');
    
    // Initialize gap to array length
    let gap = n;
    
    // Flag to check if array is sorted
    let isSorted = false;
    
    // Main sorting loop
    while (!isSorted) {
      // Update gap using shrink factor
      gap = Math.floor(gap / options.shrinkFactor);
      
      // Ensure gap doesn't go below 1
      if (gap < 1) {
        gap = 1;
      }
      
      // Apply adaptive gap adjustment if enabled
      if (options.adaptiveGapSequence && gap > 1) {
        // Adjust gap to avoid certain sequences that can lead to worst-case behavior
        if (gap == 9 || gap == 10) gap = 11;
        if (gap == 8) gap = 7;
      }
      
      // Record current gap
      this.recordState(result, {
        type: 'gap-update',
        gap: gap,
        message: `Updated gap to ${gap}`
      });
      
      // Assume the array will be sorted after this pass
      isSorted = true;
      
      // Perform a single pass with current gap
      for (let i = 0; i + gap < n; i++) {
        // Compare elements that are gap positions apart
        if (this.compare(result[i], result[i + gap]) > 0) {
          // Elements are out of order, swap them
          this.swap(result, i, i + gap);
          
          // Array might not be sorted yet
          isSorted = false;
          
          // Record the swap
          this.recordState(result, {
            type: 'swap',
            indices: [i, i + gap],
            gap: gap,
            message: `Swapped elements at indices ${i} and ${i + gap} with gap ${gap}`
          });
        }
      }
      
      // If gap is 1 and no swaps were made, the array is sorted
      if (gap === 1 && isSorted) {
        this.recordState(result, {
          type: 'sorted',
          message: 'Array is sorted with no swaps in final pass'
        });
        break;
      }
      
      // Transition to final bubble sort phase if enabled
      if (gap === 1 && options.bubbleSortFinalization) {
        this.setPhase('bubble-finalization');
      }
    }
    
    // Apply bubble sort optimization for final phase if enabled
    if (options.bubbleSortFinalization && !isSorted) {
      this.bubbleSortFinalization(result, options);
    }
    
    this.setPhase('completed');
    return result;
  }
  
  /**
   * Bubble sort final pass to ensure array is sorted
   * 
   * @param {Array} array - Array to sort
   * @param {Object} options - Runtime options
   */
  bubbleSortFinalization(array, options) {
    const n = array.length;
    let swapped;
    
    this.recordState(array, {
      type: 'phase-start',
      message: 'Starting bubble sort finalization phase'
    });
    
    // Traditional bubble sort with early termination
    do {
      swapped = false;
      
      for (let i = 1; i < n; i++) {
        if (this.compare(array[i - 1], array[i]) > 0) {
          this.swap(array, i - 1, i);
          swapped = true;
          
          // Record the swap
          this.recordState(array, {
            type: 'swap',
            indices: [i - 1, i],
            message: `Bubble sort finalization: Swapped elements at indices ${i - 1} and ${i}`
          });
        }
      }
      
      // Mark the last element as sorted after each pass
      n--;
      
    } while (swapped);
    
    this.recordState(array, {
      type: 'sorted',
      message: 'Bubble sort finalization complete, array is sorted'
    });
  }
  
  /**
   * Get the time and space complexity of Comb Sort
   * 
   * @returns {Object} - Complexity information
   */
  getComplexity() {
    return {
      time: {
        best: 'O(n log n)',
        average: 'O(n² / 2ᵏ)',  // where k is number of increments
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
   * Whether Comb Sort is stable
   * 
   * @returns {boolean} - False as Comb Sort is not stable
   */
  isStable() {
    return false;
  }
  
  /**
   * Whether Comb Sort is in-place
   * 
   * @returns {boolean} - True as Comb Sort is in-place
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
    
    // Add comb sort specific information
    info.optimization = {
      earlyTermination: this.options.earlyTermination,
      shrinkFactor: this.options.shrinkFactor,
      bubbleSortFinalization: this.options.bubbleSortFinalization,
      adaptiveGapSequence: this.options.adaptiveGapSequence
    };
    
    info.properties = {
      comparisonBased: true,
      stable: false,
      inPlace: true,
      online: false,
      gapSequenceBased: true
    };
    
    info.suitable = {
      smallArrays: true,
      nearlySortedArrays: true,
      reverseOrderedArrays: true,
      largeArrays: false
    };
    
    info.variants = [
      'Standard Comb Sort',
      'Comb Sort 11 (gap avoids multiples of 9, 10, or 11)',
      'Comb Sort with specific gap sequences',
      'Dobosiewicz Sort (variant with different gap reduction)'
    ];
    
    info.advantages = [
      'Simple implementation, only slightly more complex than bubble sort',
      'Significantly outperforms bubble sort on average',
      'Addresses the "turtle problem" effectively with gap sequence',
      'In-place with O(1) auxiliary space',
      'Does well on reversed or nearly-sorted data'
    ];
    
    info.disadvantages = [
      'Generally outperformed by more advanced algorithms like quicksort',
      'Not stable (does not preserve order of equal elements)',
      'Still O(n²) in worst case',
      'Performance highly dependent on chosen shrink factor'
    ];
    
    info.history = {
      inventors: 'Stephen Lacey and Richard Box',
      yearInvented: 1991,
      originalPaper: 'A Variation of Shell's Sort',
      evolutionNotes: 'Developed as an improvement over bubble sort to handle the "turtle problem"'
    };
    
    return info;
  }
}

export default CombSort;