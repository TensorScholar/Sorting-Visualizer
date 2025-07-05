// src/algorithms/comparison/selection.js

import Algorithm from '../core/algorithm-base';

/**
 * Implementation of Selection Sort with algorithmic optimizations and educational instrumentation.
 * 
 * Selection Sort operates by dividing the input into a sorted and unsorted region,
 * repeatedly selecting the smallest (or largest) element from the unsorted region
 * and moving it to the sorted region. The algorithm maintains two subarrays:
 * 1. The subarray which is already sorted
 * 2. The remaining subarray which remains to be sorted
 * 
 * This implementation includes multiple variants:
 * - Standard Selection Sort (one-way traversal finding minimum elements)
 * - Bidirectional Selection Sort (finding both minimum and maximum each pass)
 * - Stable Selection Sort variant
 * 
 * Time Complexity:
 * - Best:    O(n²) - Even if array is sorted, all comparisons still occur
 * - Average: O(n²)
 * - Worst:   O(n²)
 * 
 * Space Complexity: O(1) for standard implementation
 * 
 * @class SelectionSort
 * @extends Algorithm
 */
class SelectionSort extends Algorithm {
  /**
   * Create a new SelectionSort instance with configurable options
   * 
   * @param {Object} options - Configuration options
   * @param {boolean} [options.bidirectional=false] - Use bidirectional optimization (min+max each pass)
   * @param {boolean} [options.stable=false] - Use stable variant (preserves order of equal elements)
   * @param {boolean} [options.visualizeRegions=true] - Visualize sorted and unsorted regions
   * @param {boolean} [options.enhancedInstrumentation=true] - Use enhanced operation instrumentation
   */
  constructor(options = {}) {
    super('Selection Sort', 'comparison', options);
    
    // Default options
    this.options = {
      bidirectional: false,       // Use bidirectional optimization
      stable: false,              // Use stable variant
      visualizeRegions: true,     // Visualize sorted and unsorted regions
      enhancedInstrumentation: true, // Enhanced operation instrumentation
      ...options
    };
  }
  
  /**
   * Execute Selection Sort on the input array
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
    
    // Select implementation based on options
    if (options.bidirectional) {
      this.bidirectionalSelectionSort(result, n, options);
    } else if (options.stable) {
      this.stableSelectionSort(result, n, options);
    } else {
      this.standardSelectionSort(result, n, options);
    }
    
    this.setPhase('completed');
    return result;
  }
  
  /**
   * Standard Selection Sort algorithm implementation
   * This is the most common implementation, finding the minimum element
   * in each pass and placing it at the beginning of the unsorted region.
   * 
   * @param {Array} array - Array to sort
   * @param {number} n - Array length
   * @param {Object} options - Runtime options
   */
  standardSelectionSort(array, n, options) {
    // In each iteration, the smallest unsorted element is selected and placed
    // at the end of the sorted portion of the array
    for (let i = 0; i < n - 1; i++) {
      // Find the minimum element in the unsorted portion
      let minIndex = i;
      
      // Visualize the current boundary between sorted and unsorted regions
      if (options.visualizeRegions) {
        this.recordState(array, {
          type: 'region-boundary',
          sortedRegion: Array.from({ length: i }, (_, idx) => idx),
          currentPosition: i,
          message: `Elements 0 to ${i-1} are sorted. Finding minimum in remaining elements.`
        });
      }
      
      // Search for minimum element in unsorted region
      for (let j = i + 1; j < n; j++) {
        // Record comparison operation
        if (options.enhancedInstrumentation) {
          this.recordState(array, {
            type: 'comparison',
            indices: [minIndex, j],
            message: `Comparing minimum so far (${array[minIndex]}) with element at position ${j} (${array[j]})`
          });
        }
        
        // Compare current minimum with element at j
        if (this.compare(array[j], array[minIndex]) < 0) {
          minIndex = j;
          
          // Record new minimum found
          if (options.enhancedInstrumentation) {
            this.recordState(array, {
              type: 'new-minimum',
              index: j,
              value: array[j],
              message: `New minimum ${array[j]} found at position ${j}`
            });
          }
        }
      }
      
      // If the minimum element isn't already at position i, swap it
      if (minIndex !== i) {
        this.swap(array, i, minIndex);
        
        // Record swap operation
        this.recordState(array, {
          type: 'swap',
          indices: [i, minIndex],
          message: `Placed minimum element ${array[i]} at position ${i}`
        });
      } else {
        // Record that element is already in correct position
        this.recordState(array, {
          type: 'already-positioned',
          index: i,
          message: `Element ${array[i]} is already the minimum and in correct position ${i}`
        });
      }
      
      // Mark the element as sorted
      this.recordState(array, {
        type: 'sorted',
        indices: Array.from({ length: i + 1 }, (_, idx) => idx),
        message: `Elements 0 to ${i} are now sorted`
      });
    }
  }
  
  /**
   * Bidirectional Selection Sort implementation
   * This optimization finds both minimum and maximum elements in each pass,
   * reducing the number of passes by approximately half.
   * 
   * @param {Array} array - Array to sort
   * @param {number} n - Array length
   * @param {Object} options - Runtime options
   */
  bidirectionalSelectionSort(array, n, options) {
    let left = 0;
    let right = n - 1;
    
    // Continue until the pointers meet in the middle
    while (left < right) {
      // Initialize min and max indices
      let minIndex = left;
      let maxIndex = right;
      
      // Visualize the current boundaries
      if (options.visualizeRegions) {
        this.recordState(array, {
          type: 'region-boundary',
          sortedLeftRegion: Array.from({ length: left }, (_, idx) => idx),
          sortedRightRegion: Array.from({ length: n - right - 1 }, (_, idx) => right + 1 + idx),
          unsortedRegion: Array.from({ length: right - left + 1 }, (_, idx) => left + idx),
          message: `Elements 0 to ${left-1} and ${right+1} to ${n-1} are sorted. Processing middle region.`
        });
      }
      
      // Find both minimum and maximum in a single pass
      for (let i = left; i <= right; i++) {
        // Compare with current minimum
        if (this.compare(array[i], array[minIndex]) < 0) {
          minIndex = i;
          
          if (options.enhancedInstrumentation) {
            this.recordState(array, {
              type: 'new-minimum',
              index: i,
              value: array[i],
              message: `New minimum ${array[i]} found at position ${i}`
            });
          }
        }
        // Compare with current maximum
        else if (this.compare(array[i], array[maxIndex]) > 0) {
          maxIndex = i;
          
          if (options.enhancedInstrumentation) {
            this.recordState(array, {
              type: 'new-maximum',
              index: i,
              value: array[i],
              message: `New maximum ${array[i]} found at position ${i}`
            });
          }
        }
      }
      
      // Special case: if the minimum element is at the right boundary
      // or the maximum element is at the left boundary, there is potential 
      // for a value to be overwritten, so we need to handle these cases carefully
      
      // If the minimum element is at the right boundary
      if (minIndex === right) {
        // If the maximum element is at the left boundary, and we move the 
        // minimum element to the left boundary first, then we'd lose track
        // of the maximum element's new position
        if (maxIndex === left) {
          maxIndex = minIndex; // Update maxIndex to the new position
        }
      }
      // If the maximum element is at the left boundary
      else if (maxIndex === left) {
        // If we move the maximum element to the right boundary first, 
        // and the minimum element is at the right boundary, then we'd lose
        // track of the minimum element's new position
        if (minIndex === right) {
          minIndex = maxIndex; // Update minIndex to the new position
        }
      }
      
      // Place minimum element at the left boundary
      if (minIndex !== left) {
        this.swap(array, left, minIndex);
        
        // If the maximum was at the position we just swapped with,
        // update its new position
        if (maxIndex === left) {
          maxIndex = minIndex;
        }
        
        this.recordState(array, {
          type: 'swap',
          indices: [left, minIndex],
          message: `Placed minimum element ${array[left]} at position ${left}`
        });
      } else {
        this.recordState(array, {
          type: 'already-positioned',
          index: left,
          message: `Element ${array[left]} is already the minimum and in correct position ${left}`
        });
      }
      
      // Place maximum element at the right boundary
      if (maxIndex !== right) {
        this.swap(array, right, maxIndex);
        
        this.recordState(array, {
          type: 'swap',
          indices: [right, maxIndex],
          message: `Placed maximum element ${array[right]} at position ${right}`
        });
      } else {
        this.recordState(array, {
          type: 'already-positioned',
          index: right,
          message: `Element ${array[right]} is already the maximum and in correct position ${right}`
        });
      }
      
      // Mark elements as sorted
      this.recordState(array, {
        type: 'sorted',
        indices: [
          ...Array.from({ length: left + 1 }, (_, idx) => idx), 
          ...Array.from({ length: n - right }, (_, idx) => right + idx)
        ],
        message: `Elements 0 to ${left} and ${right} to ${n-1} are now sorted`
      });
      
      // Move boundaries inward
      left++;
      right--;
    }
  }
  
  /**
   * Stable Selection Sort implementation
   * This variant preserves the relative order of equal elements,
   * at the cost of increased time complexity.
   * 
   * @param {Array} array - Array to sort
   * @param {number} n - Array length
   * @param {Object} options - Runtime options
   */
  stableSelectionSort(array, n, options) {
    // For each position in the array
    for (let i = 0; i < n - 1; i++) {
      // Find the minimum element
      let minIndex = i;
      
      // Visualize the current boundary
      if (options.visualizeRegions) {
        this.recordState(array, {
          type: 'region-boundary',
          sortedRegion: Array.from({ length: i }, (_, idx) => idx),
          currentPosition: i,
          message: `Elements 0 to ${i-1} are sorted. Finding minimum in remaining elements.`
        });
      }
      
      // Find the minimum element
      for (let j = i + 1; j < n; j++) {
        if (options.enhancedInstrumentation) {
          this.recordState(array, {
            type: 'comparison',
            indices: [minIndex, j],
            message: `Comparing minimum so far (${array[minIndex]}) with element at position ${j} (${array[j]})`
          });
        }
        
        if (this.compare(array[j], array[minIndex]) < 0) {
          minIndex = j;
          
          if (options.enhancedInstrumentation) {
            this.recordState(array, {
              type: 'new-minimum',
              index: j,
              value: array[j],
              message: `New minimum ${array[j]} found at position ${j}`
            });
          }
        }
      }
      
      // To ensure stability, we need to shift elements rather than swap
      if (minIndex !== i) {
        // Save the minimum value to insert at position i
        const minValue = this.read(array, minIndex);
        
        // Shift all elements between i and minIndex one position to the right
        for (let j = minIndex; j > i; j--) {
          this.write(array, j, this.read(array, j - 1));
          
          if (options.enhancedInstrumentation) {
            this.recordState(array, {
              type: 'shift',
              index: j,
              value: array[j],
              message: `Shifted element from position ${j-1} to position ${j}`
            });
          }
        }
        
        // Insert the minimum value at position i
        this.write(array, i, minValue);
        
        this.recordState(array, {
          type: 'insert',
          index: i,
          value: minValue,
          message: `Inserted minimum element ${minValue} at position ${i}`
        });
      } else {
        this.recordState(array, {
          type: 'already-positioned',
          index: i,
          message: `Element ${array[i]} is already the minimum and in correct position ${i}`
        });
      }
      
      // Mark the element as sorted
      this.recordState(array, {
        type: 'sorted',
        indices: Array.from({ length: i + 1 }, (_, idx) => idx),
        message: `Elements 0 to ${i} are now sorted`
      });
    }
  }
  
  /**
   * Get the time and space complexity of Selection Sort
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
        best: this.options.stable ? 'O(1)' : 'O(1)',
        average: this.options.stable ? 'O(1)' : 'O(1)',
        worst: this.options.stable ? 'O(1)' : 'O(1)'
      }
    };
  }
  
  /**
   * Whether Selection Sort is stable
   * Standard implementation is not stable, but stable variant is available
   * 
   * @returns {boolean} - True if using stable variant, otherwise false
   */
  isStable() {
    return this.options.stable;
  }
  
  /**
   * Whether Selection Sort is in-place
   * 
   * @returns {boolean} - True as Selection Sort is in-place
   */
  isInPlace() {
    return true; // Both variants use O(1) auxiliary space
  }
  
  /**
   * Get detailed algorithm information including variants and characteristics
   * 
   * @returns {Object} - Detailed algorithm metadata
   */
  getInfo() {
    const info = super.getInfo();
    
    // Add selection sort specific information
    info.optimization = {
      bidirectional: this.options.bidirectional,
      stable: this.options.stable,
      visualizeRegions: this.options.visualizeRegions,
      enhancedInstrumentation: this.options.enhancedInstrumentation
    };
    
    info.properties = {
      comparisonBased: true,
      stable: this.options.stable,
      inPlace: true,
      online: false,
      adaptive: false
    };
    
    info.suitable = {
      smallArrays: true,
      nearlySortedArrays: false,
      largeArrays: false, 
      limitedMemory: true
    };
    
    info.variants = [
      'Standard Selection Sort',
      'Bidirectional Selection Sort',
      'Stable Selection Sort (preserves order of equal elements)',
      'Heap Selection (Heap Sort)'
    ];
    
    info.advantages = [
      'Simple implementation with minimal conceptual complexity',
      'In-place sorting with O(1) auxiliary space',
      'Minimal number of writes to the original array (O(n))',
      'Performs well for small arrays',
      'Performance is consistent regardless of input distribution'
    ];
    
    info.disadvantages = [
      'O(n²) time complexity makes it inefficient for large arrays',
      'No early termination possibility for already-sorted arrays',
      'Standard implementation is not stable',
      'Doesn\'t utilize hardware caches efficiently'
    ];
    
    info.analysis = {
      comparisons: {
        formula: 'n(n-1)/2',
        exact: true,
        explanation: 'Always performs exactly this many comparisons regardless of input'
      },
      swaps: {
        formula: 'n-1 ≤ swaps ≤ n-1',
        exact: false,
        explanation: 'Minimum when array is already sorted, maximum when each element needs to be swapped'
      },
      writes: {
        bidirectional: 'Approximately 2n writes in the worst case',
        standard: 'Up to 3(n-1) writes in the worst case',
        stable: 'Up to n² writes in the worst case'
      }
    };
    
    return info;
  }
}

export default SelectionSort;