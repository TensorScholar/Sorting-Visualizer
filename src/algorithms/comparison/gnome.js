// src/algorithms/comparison/gnome.js

import Algorithm from '../core/algorithm-base';

/**
 * Implementation of Gnome Sort algorithm with optimization strategies.
 * 
 * Gnome Sort (also called Stupid Sort) is a simple comparison-based sorting algorithm
 * that works by moving an element to its proper position in the sorted portion of the array
 * using a single position variable, without nested loops.
 * 
 * The basic algorithm concept:
 * 1. Start at the first element
 * 2. If the current element is greater than or equal to the previous one, move forward one step
 * 3. If the current element is less than the previous one, swap them and move backward one step
 * 4. If at the start of the array, move forward one step
 * 5. If at the end of the array, the array is sorted
 * 
 * This implementation includes optimizations:
 * - Optimized movement (remembering the position to continue from)
 * - Early termination when the array is already sorted
 * - Enhanced visualization of the algorithm's progress
 * 
 * @class GnomeSort
 * @extends Algorithm
 */
class GnomeSort extends Algorithm {
  /**
   * Create a new GnomeSort instance
   * 
   * @param {Object} options - Configuration options
   * @param {boolean} [options.optimizedMovement=true] - Use optimized movement strategy
   * @param {boolean} [options.detectSorted=true] - Detect if array is already sorted
   * @param {boolean} [options.visualizePosition=true] - Visualize current position pointer
   */
  constructor(options = {}) {
    super('Gnome Sort', 'comparison', options);
    
    // Default options
    this.options = {
      optimizedMovement: true,   // Use optimized movement strategy
      detectSorted: true,        // Detect if array is already sorted
      visualizePosition: true,   // Visualize current position pointer
      ...options
    };
  }
  
  /**
   * Execute Gnome Sort on the input array
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
    
    // Check if already sorted (optimization)
    if (options.detectSorted && this.isSorted(result)) {
      this.recordState(result, {
        type: 'optimization',
        message: 'Array is already sorted, no operations needed'
      });
      
      this.recordState(result, {
        type: 'sorted',
        indices: Array.from({ length: n }, (_, i) => i),
        message: 'Array is fully sorted'
      });
      
      this.setPhase('completed');
      return result;
    }
    
    // Record initial state
    this.recordState(result, {
      type: 'initial',
      position: 0,
      message: 'Starting Gnome Sort'
    });
    
    // Standard Gnome Sort
    if (!options.optimizedMovement) {
      let position = 0;
      
      while (position < n) {
        // Record current position
        if (options.visualizePosition) {
          this.recordState(result, {
            type: 'position',
            position: position,
            message: `Current position: ${position}`
          });
        }
        
        // At the start of array or in correct order
        if (position === 0 || this.compare(result[position - 1], result[position]) <= 0) {
          // Move forward
          position++;
          
          // Record the forward movement
          this.recordState(result, {
            type: 'forward',
            position: position,
            message: `Moving forward to position ${position}`
          });
        } else {
          // Swap and move backward
          this.swap(result, position, position - 1);
          position--;
          
          // Record the swap and backward movement
          this.recordState(result, {
            type: 'backward',
            position: position,
            indices: [position, position + 1],
            message: `Swapped elements and moved backward to position ${position}`
          });
        }
      }
    } 
    // Optimized Gnome Sort
    else {
      let position = 0;
      
      while (position < n) {
        // Record current position
        if (options.visualizePosition) {
          this.recordState(result, {
            type: 'position',
            position: position,
            message: `Current position: ${position}`
          });
        }
        
        if (position === 0) {
          // At the start, always move forward
          position++;
          
          // Record the forward movement
          this.recordState(result, {
            type: 'forward',
            position: position,
            message: `At the start of array, moving forward to position ${position}`
          });
        } else if (this.compare(result[position - 1], result[position]) <= 0) {
          // Elements are in order, move forward
          position++;
          
          // Record the forward movement
          this.recordState(result, {
            type: 'forward',
            position: position,
            message: `Elements in order, moving forward to position ${position}`
          });
        } else {
          // Swap and move backward
          this.swap(result, position, position - 1);
          
          // Record the swap
          this.recordState(result, {
            type: 'swap',
            position: position - 1,
            indices: [position, position - 1],
            message: `Swapped elements at positions ${position-1} and ${position}`
          });
          
          // Move backward
          position--;
          
          // Record the backward movement
          this.recordState(result, {
            type: 'backward',
            position: position,
            message: `Moving backward to position ${position}`
          });
        }
      }
    }
    
    // Mark array as fully sorted
    this.recordState(result, {
      type: 'sorted',
      indices: Array.from({ length: n }, (_, i) => i),
      message: 'Array is fully sorted'
    });
    
    this.setPhase('completed');
    return result;
  }
  
  /**
   * Check if an array is already sorted
   * 
   * @param {Array} array - The array to check
   * @returns {boolean} - True if the array is sorted
   */
  isSorted(array) {
    for (let i = 1; i < array.length; i++) {
      if (this.compare(array[i - 1], array[i]) > 0) {
        return false;
      }
    }
    return true;
  }
  
  /**
   * Get the time and space complexity of Gnome Sort
   * 
   * @returns {Object} - Complexity information
   */
  getComplexity() {
    return {
      time: {
        best: 'O(n)', // When array is already sorted
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
   * Whether Gnome Sort is stable
   * 
   * @returns {boolean} - True as Gnome Sort is stable
   */
  isStable() {
    return true;
  }
  
  /**
   * Whether Gnome Sort is in-place
   * 
   * @returns {boolean} - True as Gnome Sort is in-place
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
    
    // Add algorithm-specific information
    info.optimization = {
      optimizedMovement: this.options.optimizedMovement,
      detectSorted: this.options.detectSorted,
      visualizePosition: this.options.visualizePosition
    };
    
    info.properties = {
      comparisonBased: true,
      stable: true,
      inPlace: true,
      online: false,
      adaptivity: 'O(n)' // Performs optimally on already sorted arrays
    };
    
    info.suitable = {
      smallArrays: true,
      largeArrays: false,
      nearlySortedArrays: true,
      educationalContext: true
    };
    
    info.advantages = [
      'Simple to implement with minimal code',
      'More efficient than bubble sort in some cases',
      'Stable (preserves relative order of equal elements)',
      'In-place (requires constant extra space)',
      'Performs well on nearly sorted arrays'
    ];
    
    info.disadvantages = [
      'O(n²) complexity makes it inefficient for large arrays',
      'Generally slower than insertion sort despite similar complexity',
      'No mechanism to avoid unnecessary comparisons',
      'Not suitable for production use with large datasets'
    ];
    
    info.origins = {
      name: 'Named "Gnome Sort" by Dick Grune, after the Dutch garden gnome who organizes flower pots',
      year: '2000',
      inventors: ['Hamid Sarbazi-Azad'],
      alternateNames: ['Stupid Sort']
    };
    
    info.educationalInsights = [
      'Demonstrates how to create a sorting algorithm with a single position variable',
      'Shows the fundamental concept of moving elements to their correct position',
      'Illustrates the trade-off between code simplicity and performance',
      'Provides insight into how different optimization strategies affect performance'
    ];
    
    return info;
  }
}

export default GnomeSort;