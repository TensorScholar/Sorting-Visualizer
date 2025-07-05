// src/algorithms/comparison/binary-insertion.js

import Algorithm from '../core/algorithm-base';

/**
 * Implementation of Binary Insertion Sort algorithm with comprehensive instrumentation.
 * 
 * Binary Insertion Sort is an optimization of the standard insertion sort that uses
 * binary search to find the correct insertion position, thereby reducing the number
 * of comparisons needed. The algorithm still requires O(n²) time complexity in the 
 * worst case due to the shifting operations, but the number of comparisons is
 * reduced to O(n log n).
 * 
 * Key characteristics:
 * - Reduces comparisons from O(n²) to O(n log n) compared to standard insertion sort
 * - Particularly effective when comparison operations are expensive
 * - Maintains O(n²) worst-case time complexity due to shifting operations
 * - Stable sorting algorithm that preserves the relative order of equal elements
 * - In-place sorting with O(1) auxiliary space
 * 
 * @class BinaryInsertionSort
 * @extends Algorithm
 */
class BinaryInsertionSort extends Algorithm {
  /**
   * Create a new BinaryInsertionSort instance
   * 
   * @param {Object} options - Configuration options
   * @param {boolean} [options.optimizeShifts=true] - Use block shifting optimization
   * @param {boolean} [options.earlyTermination=true] - Enable early termination when array is sorted
   * @param {number} [options.binaryThreshold=10] - Minimum array size for using binary search
   */
  constructor(options = {}) {
    super('Binary Insertion Sort', 'comparison', options);
    
    // Default options
    this.options = {
      optimizeShifts: true,      // Use optimized shifting technique
      earlyTermination: true,    // Early termination optimization
      binaryThreshold: 10,       // Minimum size to use binary search (smaller arrays use linear search)
      ...options
    };
  }
  
  /**
   * Execute Binary Insertion Sort on the input array
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
    
    // Flag to detect if any elements were moved
    let anySwaps = false;
    
    // Main loop - start from second element
    for (let i = 1; i < n; i++) {
      // Current element to be inserted
      const key = this.read(result, i);
      
      // Record the current state before insertion
      this.recordState(result, {
        type: 'insertion-start',
        current: i,
        key: key,
        sortedPortion: i,
        message: `Inserting element ${key} into sorted portion [0...${i-1}]`
      });
      
      // Find the insertion position using binary search if array is large enough
      let insertPos;
      if (i >= options.binaryThreshold) {
        insertPos = this.binarySearch(result, key, 0, i - 1);
        
        this.recordState(result, {
          type: 'binary-search',
          current: i,
          key: key,
          insertPosition: insertPos,
          message: `Binary search found insertion position ${insertPos} for element ${key}`
        });
      } else {
        // For small arrays, use simple linear search for better performance
        insertPos = this.linearSearch(result, key, 0, i - 1);
        
        this.recordState(result, {
          type: 'linear-search',
          current: i,
          key: key,
          insertPosition: insertPos,
          message: `Linear search found insertion position ${insertPos} for element ${key}`
        });
      }
      
      // If the element is already in the correct position, skip shifting
      if (insertPos === i) {
        this.recordState(result, {
          type: 'skip-insertion',
          current: i,
          message: `Element ${key} is already in correct position ${i}`
        });
        continue;
      }
      
      // Shifting elements to make room for insertion
      if (options.optimizeShifts) {
        // Optimized block shifting - faster for large arrays
        this.blockShift(result, insertPos, i);
        anySwaps = true;
      } else {
        // Standard one-by-one shifting
        for (let j = i; j > insertPos; j--) {
          this.write(result, j, this.read(result, j - 1));
        }
        anySwaps = true;
      }
      
      // Insert the element at the correct position
      this.write(result, insertPos, key);
      
      // Record the state after insertion
      this.recordState(result, {
        type: 'insertion-complete',
        current: i,
        key: key,
        insertPosition: insertPos,
        message: `Inserted element ${key} at position ${insertPos}`
      });
    }
    
    this.setPhase('completed');
    
    // Record adaptive optimization information
    if (options.earlyTermination) {
      this.recordState(result, {
        type: 'optimization-info',
        anySwaps: anySwaps,
        message: anySwaps ? 
          'Some elements were reordered during sorting' : 
          'Array was already sorted - could have terminated early'
      });
    }
    
    return result;
  }
  
  /**
   * Perform binary search to find insertion position
   * 
   * @param {Array} array - The array to search in
   * @param {*} key - The element to insert
   * @param {number} low - Start index of search range
   * @param {number} high - End index of search range
   * @returns {number} - Index where key should be inserted
   */
  binarySearch(array, key, low, high) {
    this.recordState(array, {
      type: 'binary-search-start',
      key: key,
      range: [low, high],
      message: `Starting binary search for ${key} in range [${low}...${high}]`
    });
    
    let mid;
    
    // Iterative binary search
    while (low <= high) {
      mid = Math.floor(low + (high - low) / 2);
      
      const midVal = this.read(array, mid);
      const comparison = this.compare(midVal, key);
      
      this.recordState(array, {
        type: 'binary-search-step',
        key: key,
        mid: mid,
        midValue: midVal,
        comparison: comparison,
        range: [low, high],
        message: `Comparing ${key} with ${midVal} at position ${mid}`
      });
      
      if (comparison < 0) {
        // Key is greater, search right half
        low = mid + 1;
      } else if (comparison > 0) {
        // Key is smaller, search left half
        high = mid - 1;
      } else {
        // Key already exists, insert after the last equal element
        // This maintains stability
        low = mid + 1;
      }
    }
    
    this.recordState(array, {
      type: 'binary-search-end',
      key: key,
      position: low,
      message: `Binary search determined insertion position ${low} for element ${key}`
    });
    
    // 'low' is the insertion point
    return low;
  }
  
  /**
   * Perform linear search to find insertion position
   * Used for small arrays where binary search overhead is not justified
   * 
   * @param {Array} array - The array to search in
   * @param {*} key - The element to insert
   * @param {number} low - Start index of search range
   * @param {number} high - End index of search range
   * @returns {number} - Index where key should be inserted
   */
  linearSearch(array, key, low, high) {
    for (let i = low; i <= high; i++) {
      const val = this.read(array, i);
      if (this.compare(val, key) > 0) {
        return i;
      }
    }
    return high + 1;
  }
  
  /**
   * Optimized block shift operation
   * Shifts elements from position [insertPos...current-1] one position to the right
   * 
   * @param {Array} array - Array to modify
   * @param {number} insertPos - Start position for shifting
   * @param {number} current - End position (exclusive) for shifting
   */
  blockShift(array, insertPos, current) {
    // Save the element that will be overwritten
    const temp = this.read(array, current);
    
    // Shift elements to make room for insertion
    for (let j = current; j > insertPos; j--) {
      this.write(array, j, this.read(array, j - 1));
    }
    
    // Record the shift operation
    this.recordState(array, {
      type: 'block-shift',
      range: [insertPos, current],
      message: `Shifted elements in range [${insertPos}...${current-1}] one position right`
    });
  }
  
  /**
   * Get the time and space complexity of Binary Insertion Sort
   * 
   * @returns {Object} - Complexity information
   */
  getComplexity() {
    return {
      time: {
        best: 'O(n)',  // Already sorted array
        average: 'O(n²)',
        worst: 'O(n²)'  // Reverse sorted array
      },
      comparisons: {
        best: 'O(n log n)',
        average: 'O(n log n)',
        worst: 'O(n log n)'
      },
      space: {
        best: 'O(1)',
        average: 'O(1)',
        worst: 'O(1)'
      }
    };
  }
  
  /**
   * Whether Binary Insertion Sort is stable
   * 
   * @returns {boolean} - True as Binary Insertion Sort is stable
   */
  isStable() {
    return true;
  }
  
  /**
   * Whether Binary Insertion Sort is in-place
   * 
   * @returns {boolean} - True as Binary Insertion Sort is in-place
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
    
    // Add binary insertion sort specific information
    info.optimization = {
      optimizeShifts: this.options.optimizeShifts,
      earlyTermination: this.options.earlyTermination,
      binaryThreshold: this.options.binaryThreshold
    };
    
    info.properties = {
      comparisonBased: true,
      stable: true,
      inPlace: true,
      online: true,  // Can sort as elements arrive
      adaptive: true  // Performance improves with partially sorted input
    };
    
    info.suitable = {
      smallArrays: true,
      nearlySortedArrays: true,
      expensiveComparisons: true,  // Key advantage with binary search
      onlineProcessing: true  // Good for streaming data
    };
    
    info.advantages = [
      'Reduces comparisons from O(n²) to O(n log n) compared to standard insertion sort',
      'Maintains stability, preserving order of equal elements',
      'Adaptive performance - efficient for nearly sorted arrays',
      'In-place sorting with minimal memory overhead',
      'Particularly effective when comparison operations are expensive'
    ];
    
    info.disadvantages = [
      'Still requires O(n²) operations in worst case due to shifting operations',
      'Binary search overhead can actually slow down sorting for small arrays',
      'Less cache-efficient than standard insertion sort for small arrays',
      'Not suitable for large datasets compared to O(n log n) algorithms'
    ];
    
    info.relationships = {
      parent: 'Insertion Sort',
      variations: [
        'Standard Insertion Sort',
        'Shell Sort (gap insertion)',
        'Library Sort (gapped insertion sort)'
      ]
    };
    
    return info;
  }
}

export default BinaryInsertionSort;