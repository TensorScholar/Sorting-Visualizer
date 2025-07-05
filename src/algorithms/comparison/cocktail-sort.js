// src/algorithms/comparison/cocktail.js

import Algorithm from '../core/algorithm-base';

/**
 * Implementation of Cocktail Shaker Sort (also known as Bidirectional Bubble Sort)
 * with multiple optimization strategies.
 * 
 * Cocktail Shaker Sort is a variation of Bubble Sort that sorts bidirectionally.
 * It works by:
 * 1. Traversing the array from left to right, bubbling the largest element to the end
 * 2. Then traversing from right to left, bubbling the smallest element to the beginning
 * 3. Repeating until the array is sorted
 * 
 * This bidirectional approach addresses the "turtle problem" in Bubble Sort,
 * where small elements at the end of the array (turtles) take a long time to move
 * to their correct positions.
 * 
 * This implementation includes optimizations:
 * - Early termination when no swaps occur in a complete bidirectional pass
 * - Shrinking boundaries to avoid re-scanning already sorted portions
 * - Detailed tracking of sorted regions
 * - Optimized comparisons for improved performance
 * 
 * @class CocktailShakerSort
 * @extends Algorithm
 */
class CocktailShakerSort extends Algorithm {
  /**
   * Create a new CocktailShakerSort instance
   * 
   * @param {Object} options - Configuration options
   * @param {boolean} [options.earlyTermination=true] - Stop when no swaps occur in a pass
   * @param {boolean} [options.shrinkBoundaries=true] - Shrink scan boundaries for sorted portions
   * @param {boolean} [options.optimizedComparisons=true] - Use optimized comparison sequence
   * @param {boolean} [options.trackSortedRegions=true] - Track and visualize sorted regions
   */
  constructor(options = {}) {
    super('Cocktail Shaker Sort', 'comparison', options);
    
    // Default options
    this.options = {
      earlyTermination: true,        // Stop when no swaps occur
      shrinkBoundaries: true,        // Shrink scan boundaries for sorted portions
      optimizedComparisons: true,    // Use optimized comparison sequence
      trackSortedRegions: true,      // Track and visualize sorted regions
      ...options
    };
  }
  
  /**
   * Execute Cocktail Shaker Sort on the input array
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
    
    // Initialize boundaries
    let start = 0;
    let end = n - 1;
    
    // Track if any swaps were made in a pass
    let swapped = true;
    
    // Initialize sorted regions
    const sortedIndices = new Set();
    
    // Main sorting loop
    while (swapped && start < end) {
      // Reset swapped flag for this pass
      swapped = false;
      
      // Forward pass: bubble largest elements to the end
      this.recordState(result, {
        type: 'phase-start',
        direction: 'forward',
        boundaries: [start, end],
        message: `Starting forward pass from index ${start} to ${end}`
      });
      
      for (let i = start; i < end; i++) {
        // Compare adjacent elements
        if (this.compare(result[i], result[i + 1]) > 0) {
          // Elements are out of order, swap them
          this.swap(result, i, i + 1);
          swapped = true;
          
          // Record the swap
          this.recordState(result, {
            type: 'swap',
            indices: [i, i + 1],
            message: `Swapped elements at indices ${i} and ${i + 1}`
          });
        }
      }
      
      // If no swaps were made in the forward pass and early termination is enabled
      if (!swapped && options.earlyTermination) {
        this.recordState(result, {
          type: 'optimization',
          message: 'Early termination: No swaps in forward pass, array is sorted'
        });
        break;
      }
      
      // Mark the last element as sorted (largest element is now at the end)
      if (options.trackSortedRegions) {
        sortedIndices.add(end);
        this.recordState(result, {
          type: 'sorted',
          indices: Array.from(sortedIndices),
          message: `Element at index ${end} is now in its sorted position`
        });
      }
      
      // Shrink the end boundary
      if (options.shrinkBoundaries) {
        end--;
      }
      
      // Reset swapped flag for backward pass
      swapped = false;
      
      // Backward pass: bubble smallest elements to the beginning
      this.recordState(result, {
        type: 'phase-start',
        direction: 'backward',
        boundaries: [start, end],
        message: `Starting backward pass from index ${end} to ${start}`
      });
      
      for (let i = end; i > start; i--) {
        // Compare adjacent elements
        if (this.compare(result[i - 1], result[i]) > 0) {
          // Elements are out of order, swap them
          this.swap(result, i - 1, i);
          swapped = true;
          
          // Record the swap
          this.recordState(result, {
            type: 'swap',
            indices: [i - 1, i],
            message: `Swapped elements at indices ${i - 1} and ${i}`
          });
        }
      }
      
      // Mark the first element as sorted (smallest element is now at the beginning)
      if (options.trackSortedRegions) {
        sortedIndices.add(start);
        this.recordState(result, {
          type: 'sorted',
          indices: Array.from(sortedIndices),
          message: `Element at index ${start} is now in its sorted position`
        });
      }
      
      // Shrink the start boundary
      if (options.shrinkBoundaries) {
        start++;
      }
    }
    
    // Mark all elements as sorted
    this.recordState(result, {
      type: 'sorted',
      indices: Array.from({ length: n }, (_, i) => i),
      message: 'All elements are now sorted'
    });
    
    this.setPhase('completed');
    return result;
  }
  
  /**
   * Get the time and space complexity of Cocktail Shaker Sort
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
      }
    };
  }
  
  /**
   * Whether Cocktail Shaker Sort is stable
   * 
   * @returns {boolean} - True as Cocktail Shaker Sort is stable
   */
  isStable() {
    return true;
  }
  
  /**
   * Whether Cocktail Shaker Sort is in-place
   * 
   * @returns {boolean} - True as Cocktail Shaker Sort is in-place
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
    
    // Add cocktail sort specific information
    info.optimization = {
      earlyTermination: this.options.earlyTermination,
      shrinkBoundaries: this.options.shrinkBoundaries,
      optimizedComparisons: this.options.optimizedComparisons,
      trackSortedRegions: this.options.trackSortedRegions
    };
    
    info.properties = {
      comparisonBased: true,
      stable: true,
      inPlace: true,
      online: true,
      adaptiveToPresortedness: true,
      bidirectional: true
    };
    
    info.suitable = {
      smallArrays: true,
      nearlySortedArrays: true,
      reverseOrderedArrays: true,
      largeArrays: false
    };
    
    info.variants = [
      'Standard Bubble Sort',
      'Cocktail Shaker Sort (Bidirectional)',
      'Comb Sort (Bubble sort with diminishing gaps)',
      'Odd-Even Sort (Parallel variant)'
    ];
    
    info.advantages = [
      'Simple implementation and easy to understand',
      'Performs better than standard Bubble Sort for certain inputs',
      'Addresses the "turtle problem" of small values at the end of the array',
      'Stable sorting (preserves order of equal elements)',
      'In-place with O(1) auxiliary space'
    ];
    
    info.disadvantages = [
      'Still O(n²) performance in average and worst cases',
      'Significantly slower than more advanced algorithms for large arrays',
      'Limited practical applications due to performance characteristics',
      'Not suitable for large datasets'
    ];
    
    return info;
  }
}

export default CocktailShakerSort;