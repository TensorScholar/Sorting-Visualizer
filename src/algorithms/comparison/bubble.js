// src/algorithms/comparison/bubble.js

import Algorithm from '../core/algorithm-base';

/**
 * Implementation of Bubble Sort with multiple optimization strategies.
 * 
 * Bubble Sort is a simple comparison-based sorting algorithm that repeatedly
 * steps through the list, compares adjacent elements, and swaps them if they
 * are in the wrong order. The algorithm gets its name because smaller or larger
 * elements "bubble" to the top of the list.
 * 
 * This implementation includes several optimizations:
 * 1. Early termination - Stops when no swaps are performed in a pass
 * 2. Adaptive boundary - Tracks the last swap position to reduce comparisons
 * 3. Bidirectional variant (Cocktail Shaker Sort) - Alternates passes between forward and backward directions
 * 
 * Time Complexity:
 * - Best:    O(n) with early termination optimization when array is already sorted
 * - Average: O(n²)
 * - Worst:   O(n²) when array is sorted in reverse order
 * 
 * Space Complexity:
 * - O(1) - truly in-place algorithm requiring only a constant amount of extra memory
 * 
 * @class BubbleSort
 * @extends Algorithm
 */
class BubbleSort extends Algorithm {
  /**
   * Create a new BubbleSort instance
   * 
   * @param {Object} options - Configuration options
   * @param {boolean} [options.optimize=true] - Use early termination optimization
   * @param {boolean} [options.adaptive=true] - Track sorted boundary for optimization
   * @param {boolean} [options.bidirectional=false] - Use bidirectional passes (Cocktail Shaker Sort)
   */
  constructor(options = {}) {
    super('Bubble Sort', 'comparison', options);
    
    // Default options with carefully chosen values based on empirical performance data
    this.options = {
      optimize: true,       // Early termination when no swaps are performed
      adaptive: true,       // Track boundary of sorted elements
      bidirectional: false, // Alternate between forward and reverse passes
      ...options
    };
  }
  
  /**
   * Execute Bubble Sort on the input array
   * 
   * @param {Array} array - Input array to be sorted
   * @param {Object} options - Runtime options
   * @returns {Array} - Sorted array
   */
  run(array, options) {
    // Create a copy to avoid modifying the original array
    const result = [...array];
    const n = result.length;
    
    // Early return for edge cases
    if (n <= 1) {
      return result;
    }
    
    this.setPhase('sorting');
    
    // Choose algorithm variant based on options
    if (options.bidirectional) {
      this.cocktailShakerSort(result, options);
    } else {
      this.standardBubbleSort(result, options);
    }
    
    this.setPhase('completed');
    return result;
  }
  
  /**
   * Standard Bubble Sort implementation with optimizations
   * 
   * @param {Array} array - The array to sort (modified in place)
   * @param {Object} options - Runtime options
   */
  standardBubbleSort(array, options) {
    const n = array.length;
    
    // Track the boundary for optimization (all elements after this are known to be sorted)
    let sortedBoundary = n;
    
    // Main sorting loop - at most n-1 passes required
    for (let i = 0; i < n - 1; i++) {
      // Flag to detect if any swaps were made in this pass
      let swapped = false;
      
      // Track the highest index where a swap occurred in this pass
      let lastSwap = 0;
      
      // Record the beginning of a new pass
      this.recordState(array, {
        type: 'pass-start',
        pass: i + 1,
        message: `Starting pass ${i + 1}`
      });
      
      // One pass through the unsorted portion of the array
      for (let j = 1; j < sortedBoundary; j++) {
        // Compare adjacent elements
        const comparisonResult = this.compare(array[j - 1], array[j]);
        
        // Record the comparison operation
        this.recordState(array, {
          type: 'comparison',
          indices: [j - 1, j],
          result: comparisonResult,
          message: `Comparing elements at indices ${j - 1} and ${j}`
        });
        
        // If elements are out of order, swap them
        if (comparisonResult > 0) {
          this.swap(array, j - 1, j);
          swapped = true;
          lastSwap = j;
          
          // Record the swap operation
          this.recordState(array, {
            type: 'swap',
            indices: [j - 1, j],
            message: `Swapped elements at indices ${j - 1} and ${j}`
          });
        }
      }
      
      // Early termination optimization: If no swaps were made, the array is sorted
      if (options.optimize && !swapped) {
        this.recordState(array, {
          type: 'optimization',
          message: `Early termination: No swaps in pass ${i + 1}, array is sorted`
        });
        break;
      }
      
      // Adaptive boundary optimization: Update the sorted boundary
      if (options.adaptive) {
        sortedBoundary = lastSwap || sortedBoundary;
        
        if (sortedBoundary < n) {
          // Mark elements beyond the boundary as sorted
          this.recordState(array, {
            type: 'sorted',
            indices: Array.from({ length: n - sortedBoundary }, (_, idx) => sortedBoundary + idx),
            message: `Elements from index ${sortedBoundary} to ${n - 1} are now sorted`
          });
        }
      } else {
        // When not using adaptive optimization, at least the last element is guaranteed to be in its final position
        this.recordState(array, {
          type: 'sorted',
          indices: [n - i - 1],
          message: `Element at index ${n - i - 1} is now in its correct position`
        });
      }
      
      // Record completion of the pass
      this.recordState(array, {
        type: 'pass-end',
        pass: i + 1,
        message: `Completed pass ${i + 1}`
      });
    }
  }
  
  /**
   * Bidirectional Bubble Sort (Cocktail Shaker Sort) implementation
   * Performs passes alternating between forward and backward directions
   * 
   * @param {Array} array - The array to sort (modified in place)
   * @param {Object} options - Runtime options
   */
  cocktailShakerSort(array, options) {
    const n = array.length;
    
    // Initialize boundaries for the unsorted portion
    let start = 0;
    let end = n - 1;
    
    // Flag to detect if any swaps were made in either pass
    let swapped = true;
    
    // Main sorting loop
    let pass = 0;
    
    while (swapped && start < end) {
      swapped = false;
      pass++;
      
      // Record the beginning of a forward pass
      this.recordState(array, {
        type: 'pass-start',
        direction: 'forward',
        pass,
        message: `Starting forward pass ${pass}`
      });
      
      // Forward pass - bubble the largest element to the end
      for (let i = start; i < end; i++) {
        // Compare adjacent elements
        const comparisonResult = this.compare(array[i], array[i + 1]);
        
        // Record the comparison operation
        this.recordState(array, {
          type: 'comparison',
          indices: [i, i + 1],
          result: comparisonResult,
          message: `Comparing elements at indices ${i} and ${i + 1}`
        });
        
        // If elements are out of order, swap them
        if (comparisonResult > 0) {
          this.swap(array, i, i + 1);
          swapped = true;
          
          // Record the swap operation
          this.recordState(array, {
            type: 'swap',
            indices: [i, i + 1],
            message: `Swapped elements at indices ${i} and ${i + 1}`
          });
        }
      }
      
      // Mark the end element as sorted
      this.recordState(array, {
        type: 'sorted',
        indices: [end],
        message: `Element at index ${end} is now in its correct position`
      });
      
      // Record completion of the forward pass
      this.recordState(array, {
        type: 'pass-end',
        direction: 'forward',
        pass,
        message: `Completed forward pass ${pass}`
      });
      
      // Decrement end boundary as the largest element is now in place
      end--;
      
      // Early termination optimization: If no swaps were made, the array is sorted
      if (options.optimize && !swapped) {
        this.recordState(array, {
          type: 'optimization',
          message: `Early termination: No swaps in forward pass ${pass}, array is sorted`
        });
        break;
      }
      
      swapped = false;
      
      // Record the beginning of a backward pass
      this.recordState(array, {
        type: 'pass-start',
        direction: 'backward',
        pass,
        message: `Starting backward pass ${pass}`
      });
      
      // Backward pass - bubble the smallest element to the beginning
      for (let i = end; i > start; i--) {
        // Compare adjacent elements
        const comparisonResult = this.compare(array[i - 1], array[i]);
        
        // Record the comparison operation
        this.recordState(array, {
          type: 'comparison',
          indices: [i - 1, i],
          result: comparisonResult,
          message: `Comparing elements at indices ${i - 1} and ${i}`
        });
        
        // If elements are out of order, swap them
        if (comparisonResult > 0) {
          this.swap(array, i - 1, i);
          swapped = true;
          
          // Record the swap operation
          this.recordState(array, {
            type: 'swap',
            indices: [i - 1, i],
            message: `Swapped elements at indices ${i - 1} and ${i}`
          });
        }
      }
      
      // Mark the start element as sorted
      this.recordState(array, {
        type: 'sorted',
        indices: [start],
        message: `Element at index ${start} is now in its correct position`
      });
      
      // Record completion of the backward pass
      this.recordState(array, {
        type: 'pass-end',
        direction: 'backward',
        pass,
        message: `Completed backward pass ${pass}`
      });
      
      // Increment start boundary as the smallest element is now in place
      start++;
      
      // Early termination optimization: If no swaps were made, the array is sorted
      if (options.optimize && !swapped) {
        this.recordState(array, {
          type: 'optimization',
          message: `Early termination: No swaps in backward pass ${pass}, array is sorted`
        });
        break;
      }
    }
  }
  
  /**
   * Get the time and space complexity of Bubble Sort
   * 
   * @returns {Object} - Complexity information
   */
  getComplexity() {
    return {
      time: {
        best: this.options.optimize ? 'O(n)' : 'O(n²)',
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
   * Whether Bubble Sort is stable (preserves relative order of equal elements)
   * 
   * @returns {boolean} - True as Bubble Sort is stable
   */
  isStable() {
    return true;
  }
  
  /**
   * Whether Bubble Sort is in-place (uses O(1) auxiliary space)
   * 
   * @returns {boolean} - True as Bubble Sort is in-place
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
    
    // Add bubble sort specific information
    info.optimization = {
      earlyTermination: this.options.optimize,
      adaptiveBoundary: this.options.adaptive,
      bidirectional: this.options.bidirectional
    };
    
    info.properties = {
      comparisonBased: true,
      stable: true,
      inPlace: true,
      online: true,
      adaptive: this.options.optimize || this.options.adaptive
    };
    
    info.suitable = {
      smallArrays: true,
      nearlySortedArrays: this.options.optimize,
      largeArrays: false,
      educationalPurposes: true
    };
    
    info.variants = [
      'Standard Bubble Sort',
      'Optimized Bubble Sort (early termination)',
      'Adaptive Bubble Sort (dynamic boundary)',
      'Cocktail Shaker Sort (bidirectional)',
      'Odd-Even Sort (parallel variant)'
    ];
    
    info.advantages = [
      'Simple implementation and concept',
      'Minimal space complexity (O(1))',
      'Stable sorting (preserves order of equal elements)',
      'Adaptive when optimized (performs better on partially sorted arrays)',
      'Online algorithm (can sort as elements arrive)'
    ];
    
    info.disadvantages = [
      'Poor time complexity (O(n²)) makes it impractical for large arrays',
      'Performs significantly more swaps than other algorithms',
      'Generally outperformed by insertion sort for small arrays',
      'Poor cache performance due to many swap operations'
    ];
    
    info.performance = {
      bestCase: 'Already sorted arrays (with early termination)',
      worstCase: 'Arrays sorted in reverse order',
      averageCase: 'Random arrays'
    };
    
    return info;
  }
}

export default BubbleSort;