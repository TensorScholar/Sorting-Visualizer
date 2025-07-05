// src/algorithms/comparison/insertion.js

import Algorithm from '../core/algorithm-base';

/**
 * Implementation of Insertion Sort with multiple optimization variants.
 * 
 * Insertion Sort builds the final sorted array one item at a time by repeatedly
 * taking the next unsorted element and inserting it into its correct position
 * within the already-sorted portion of the array.
 *
 * This implementation includes optimizations:
 * - Binary search for finding insertion position (reduces comparisons)
 * - Early termination when no shifts occur in a pass
 * - Gap insertion for improved performance on certain datasets
 * 
 * Time Complexity:
 * - Best:    O(n) when array is already sorted
 * - Average: O(n²)
 * - Worst:   O(n²) when array is in reverse order
 * 
 * Space Complexity: O(1) - truly in-place
 *
 * @class InsertionSort
 * @extends Algorithm
 */
class InsertionSort extends Algorithm {
  /**
   * Create a new InsertionSort instance
   * 
   * @param {Object} options - Configuration options
   * @param {boolean} [options.useBinarySearch=false] - Use binary search to find insertion position
   * @param {boolean} [options.earlyTermination=true] - Stop when no shifts occur
   * @param {number} [options.gapSize=1] - Gap between compared elements (1 for classic)
   */
  constructor(options = {}) {
    super('Insertion Sort', 'comparison', options);
    
    // Default options
    this.options = {
      useBinarySearch: false,   // Use binary search to find insertion position
      earlyTermination: true,   // Stop when no shifts occur in a pass
      gapSize: 1,               // Gap between compared elements (1 for classic)
      ...options
    };
  }
  
  /**
   * Execute Insertion Sort on the input array
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
    
    // Select appropriate insertion sort variant
    if (options.useBinarySearch) {
      this.binaryInsertionSort(result, options);
    } else if (options.gapSize > 1) {
      this.gapInsertionSort(result, options);
    } else {
      this.classicInsertionSort(result, options);
    }
    
    this.setPhase('completed');
    return result;
  }
  
  /**
   * Classic implementation of Insertion Sort
   * 
   * @param {Array} array - Array to be sorted
   * @param {Object} options - Runtime options
   */
  classicInsertionSort(array, options) {
    const n = array.length;
    let shifts = 0;
    
    for (let i = 1; i < n; i++) {
      // Record the current position being processed
      this.recordState(array, {
        type: 'insertion-start',
        index: i,
        message: `Starting insertion for element at index ${i}`
      });
      
      // Current element to be inserted into sorted portion
      const key = this.read(array, i);
      let j = i - 1;
      
      // Find position for key in the sorted portion
      let positionFound = false;
      
      while (j >= 0 && this.compare(this.read(array, j), key) > 0) {
        // Shift elements to make room for key
        this.write(array, j + 1, this.read(array, j));
        j--;
        shifts++;
        
        // Record significant shifting steps
        if (j % 5 === 0 || j === 0) {
          this.recordState(array, {
            type: 'shift-operation',
            movedFrom: j + 1,
            movedTo: j + 2,
            message: `Shifted element right to make room for ${key}`
          });
        }
      }
      
      // Insert the key at its correct position
      if (j + 1 !== i) {
        this.write(array, j + 1, key);
        
        // Record the insertion
        this.recordState(array, {
          type: 'insertion-complete',
          index: j + 1,
          element: key,
          message: `Inserted element ${key} at position ${j + 1}`
        });
      } else {
        // Element already in correct position
        this.recordState(array, {
          type: 'no-movement',
          index: i,
          message: `Element ${key} already in correct position`
        });
      }
      
      // Mark sorted region
      this.recordState(array, {
        type: 'sorted-region',
        endIndex: i,
        message: `Array is now sorted up to index ${i}`
      });
    }
    
    // Check if early termination could be applied (for educational purposes)
    if (options.earlyTermination && shifts === 0) {
      this.recordState(array, {
        type: 'early-termination',
        message: 'Array was already sorted, could have terminated early'
      });
    }
  }
  
  /**
   * Binary Insertion Sort - uses binary search to find insertion position
   * Reduces number of comparisons but not assignments
   * 
   * @param {Array} array - Array to be sorted
   * @param {Object} options - Runtime options
   */
  binaryInsertionSort(array, options) {
    const n = array.length;
    let shifts = 0;
    
    for (let i = 1; i < n; i++) {
      // Record the current position being processed
      this.recordState(array, {
        type: 'insertion-start',
        index: i,
        message: `Starting binary insertion for element at index ${i}`
      });
      
      // Current element to be inserted
      const key = this.read(array, i);
      
      // Use binary search to find insertion position
      const insertionPos = this.findInsertionPosition(array, key, 0, i - 1);
      
      // Record binary search result
      this.recordState(array, {
        type: 'binary-search',
        element: key,
        position: insertionPos,
        message: `Binary search found insertion position ${insertionPos} for element ${key}`
      });
      
      // If the element is already in correct position, skip shifting
      if (insertionPos === i) {
        this.recordState(array, {
          type: 'no-movement',
          index: i,
          message: `Element ${key} already in correct position`
        });
        continue;
      }
      
      // Shift all elements to the right
      for (let j = i - 1; j >= insertionPos; j--) {
        this.write(array, j + 1, this.read(array, j));
        shifts++;
        
        // Record significant shifting steps
        if ((j - insertionPos) % 5 === 0 || j === insertionPos) {
          this.recordState(array, {
            type: 'shift-operation',
            movedFrom: j,
            movedTo: j + 1,
            message: `Shifted element right to make room for ${key}`
          });
        }
      }
      
      // Insert the element
      this.write(array, insertionPos, key);
      
      // Record the insertion
      this.recordState(array, {
        type: 'insertion-complete',
        index: insertionPos,
        element: key,
        message: `Inserted element ${key} at position ${insertionPos}`
      });
      
      // Mark sorted region
      this.recordState(array, {
        type: 'sorted-region',
        endIndex: i,
        message: `Array is now sorted up to index ${i}`
      });
    }
  }
  
  /**
   * Gap Insertion Sort - generalization that allows sorting with a gap
   * Setting gap > 1 implements a single pass of Shell Sort
   * 
   * @param {Array} array - Array to be sorted
   * @param {Object} options - Runtime options
   */
  gapInsertionSort(array, options) {
    const n = array.length;
    const gap = options.gapSize;
    
    this.recordState(array, {
      type: 'gap-insertion',
      gap: gap,
      message: `Performing insertion sort with gap size ${gap}`
    });
    
    // Sort each subarray defined by the gap
    for (let start = 0; start < gap; start++) {
      // Record subarray start
      this.recordState(array, {
        type: 'gap-subarray',
        start: start,
        gap: gap,
        message: `Sorting subarray starting at index ${start} with gap ${gap}`
      });
      
      // Insertion sort on the subarray
      for (let i = start + gap; i < n; i += gap) {
        const key = this.read(array, i);
        let j = i - gap;
        
        while (j >= 0 && this.compare(this.read(array, j), key) > 0) {
          this.write(array, j + gap, this.read(array, j));
          j -= gap;
          
          // Record shift operation
          this.recordState(array, {
            type: 'gap-shift',
            from: j + gap,
            to: j + 2 * gap,
            gap: gap,
            message: `Shifted element at index ${j + gap} with gap ${gap}`
          });
        }
        
        this.write(array, j + gap, key);
        
        // Record insertion with gap
        this.recordState(array, {
          type: 'gap-insertion-complete',
          index: j + gap,
          element: key,
          gap: gap,
          message: `Inserted element ${key} at position ${j + gap} with gap ${gap}`
        });
      }
    }
    
    // Final state after all subarrays sorted
    this.recordState(array, {
      type: 'gap-complete',
      gap: gap,
      message: `Completed insertion sort with gap size ${gap}`
    });
  }
  
  /**
   * Binary search to find insertion position
   * Optimization to reduce the number of comparisons
   * 
   * @param {Array} array - The array to search in
   * @param {*} key - The element to insert
   * @param {number} low - Start index of sorted portion
   * @param {number} high - End index of sorted portion
   * @returns {number} - Index where key should be inserted
   */
  findInsertionPosition(array, key, low, high) {
    // Record binary search start
    this.recordState(array, {
      type: 'binary-search-start',
      element: key,
      low: low,
      high: high,
      message: `Starting binary search for position of ${key} between indices ${low} and ${high}`
    });
    
    // Base case: narrowed down to a single position
    if (high <= low) {
      return (this.compare(key, this.read(array, low)) >= 0) ? low + 1 : low;
    }
    
    // Find the middle point
    const mid = Math.floor((low + high) / 2);
    
    // Record comparison at middle
    this.recordState(array, {
      type: 'binary-comparison',
      element: key,
      compareIndex: mid,
      compareValue: array[mid],
      message: `Comparing ${key} with element at index ${mid} (${array[mid]})`
    });
    
    // Recursive search in appropriate half
    if (this.compare(key, this.read(array, mid)) < 0) {
      return this.findInsertionPosition(array, key, low, mid - 1);
    } else {
      return this.findInsertionPosition(array, key, mid + 1, high);
    }
  }
  
  /**
   * Get the time and space complexity of Insertion Sort
   * 
   * @returns {Object} - Complexity information
   */
  getComplexity() {
    const useBinarySearch = this.options.useBinarySearch;
    
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
      comparisons: {
        best: 'O(n)',
        average: useBinarySearch ? 'O(n log n)' : 'O(n²)',
        worst: useBinarySearch ? 'O(n log n)' : 'O(n²)'
      },
      assignments: {
        best: 'O(n)',
        average: 'O(n²)',
        worst: 'O(n²)'
      }
    };
  }
  
  /**
   * Whether Insertion Sort is stable
   * 
   * @returns {boolean} - True as Insertion Sort is stable
   */
  isStable() {
    return true;
  }
  
  /**
   * Whether Insertion Sort is in-place
   * 
   * @returns {boolean} - True as Insertion Sort is in-place
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
    
    // Add insertion sort specific information
    info.optimization = {
      useBinarySearch: this.options.useBinarySearch,
      earlyTermination: this.options.earlyTermination,
      gapSize: this.options.gapSize
    };
    
    info.properties = {
      comparisonBased: true,
      stable: true,
      inPlace: true,
      online: true, // Can sort as elements arrive
      adaptive: true // Performance improves with partially sorted arrays
    };
    
    info.suitable = {
      smallArrays: true,
      nearlySortedArrays: true,
      continuousInput: true, // Good for ongoing/streaming data
      largeArrays: false
    };
    
    info.variants = [
      'Classic Insertion Sort',
      'Binary Insertion Sort',
      'Gap Insertion Sort (Shell Sort with single gap)',
      'Two-way Insertion Sort',
      'Linked List Insertion Sort'
    ];
    
    info.advantages = [
      'Simple implementation with minimal code',
      'Efficient for small datasets (often used as a base case in recursive sorts)',
      'Adaptive - O(n) time for nearly sorted data',
      'Stable - preserves relative order of equal elements',
      'In-place - requires minimal extra memory',
      'Online - can sort as new elements arrive'
    ];
    
    info.disadvantages = [
      'O(n²) time complexity makes it inefficient for large datasets',
      'Many writes/shifts even when using binary search optimization',
      'Much slower than advanced algorithms like quicksort and mergesort',
      'Poor cache performance due to shifting elements'
    ];
    
    info.educationalInsights = [
      'Demonstrates the concept of growing a sorted region incrementally',
      'Provides intuition for adaptive sorting behavior',
      'Foundation for understanding more complex algorithms like Shell Sort and Timsort',
      'Illustrates the distinction between comparison efficiency and write efficiency'
    ];
    
    return info;
  }
}

export default InsertionSort;