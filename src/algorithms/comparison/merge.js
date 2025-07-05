// src/algorithms/comparison/merge.js

import Algorithm from '../core/algorithm-base';

/**
 * Implementation of the Merge Sort algorithm with multiple optimization variants.
 * 
 * Merge Sort is a divide-and-conquer algorithm that:
 * 1. Divides the input array into two halves
 * 2. Recursively sorts the two halves
 * 3. Merges the sorted halves to produce the final sorted array
 * 
 * This implementation includes several optimizations:
 * - Bottom-up iterative implementation to avoid recursion overhead
 * - Insertion sort for small subarrays
 * - Adaptive optimizations for already-sorted runs
 * - In-place merging option to reduce memory usage
 * - Enhanced sentinels for avoiding array bound checks during merge
 * 
 * @class MergeSort
 * @extends Algorithm
 */
class MergeSort extends Algorithm {
  /**
   * Create a new MergeSort instance
   * 
   * @param {Object} options - Configuration options
   * @param {boolean} [options.bottomUp=false] - Use bottom-up (iterative) implementation
   * @param {boolean} [options.adaptive=true] - Use adaptive optimization for partially sorted data
   * @param {boolean} [options.inPlaceMerge=false] - Use in-place merging (trades speed for memory efficiency)
   * @param {number} [options.insertionThreshold=10] - Threshold for switching to insertion sort
   * @param {boolean} [options.optimizeMerge=true] - Use optimized merge implementation with sentinels
   */
  constructor(options = {}) {
    super('Merge Sort', 'comparison', options);
    
    // Default options
    this.options = {
      bottomUp: false,          // Use bottom-up (iterative) implementation
      adaptive: true,           // Use adaptive optimization for partially sorted data
      inPlaceMerge: false,      // Use in-place merging (trades speed for memory efficiency)
      insertionThreshold: 10,   // Threshold for switching to insertion sort
      optimizeMerge: true,      // Use optimized merge implementation with sentinels
      ...options
    };
  }
  
  /**
   * Execute Merge Sort on the input array
   * 
   * @param {Array} array - Input array to be sorted
   * @param {Object} options - Runtime options
   * @returns {Array} - Sorted array
   */
  run(array, options) {
    // Clone the array to avoid modifying the original
    const result = [...array];
    const n = result.length;
    
    // Early return for small arrays
    if (n <= 1) {
      return result;
    }
    
    this.setPhase('sorting');
    
    // Choose implementation based on options
    if (options.bottomUp) {
      this.bottomUpMergeSort(result, options);
    } else {
      // Allocate auxiliary array once to avoid repeated allocations
      const aux = new Array(n);
      this.topDownMergeSort(result, 0, n - 1, aux, options);
    }
    
    this.setPhase('completed');
    return result;
  }
  
  /**
   * Top-down (recursive) Merge Sort implementation
   * 
   * @param {Array} array - The array being sorted
   * @param {number} low - Start index
   * @param {number} high - End index
   * @param {Array} aux - Auxiliary array for merging
   * @param {Object} options - Runtime options
   */
  topDownMergeSort(array, low, high, aux, options) {
    // Record current recursive call
    this.recordState(array, {
      type: 'recursive_call',
      section: [low, high],
      message: `Sorting section from index ${low} to ${high}`
    });
    
    // Base case: Array of size 1 or smaller is already sorted
    if (high <= low) return;
    
    // Use insertion sort for small arrays
    if (high - low < options.insertionThreshold) {
      this.insertionSort(array, low, high);
      return;
    }
    
    // Adaptive optimization: Check if the subarray is already sorted
    if (options.adaptive && this.isAlreadySorted(array, low, high)) {
      this.recordState(array, {
        type: 'optimization',
        section: [low, high],
        message: `Subarray from ${low} to ${high} is already sorted`
      });
      return;
    }
    
    // Calculate middle point
    const mid = Math.floor(low + (high - low) / 2);
    
    // Record the division step
    this.recordState(array, {
      type: 'divide',
      section: [low, high],
      middle: mid,
      message: `Dividing at index ${mid}`
    });
    
    // Recursively sort left and right halves
    this.topDownMergeSort(array, low, mid, aux, options);
    this.topDownMergeSort(array, mid + 1, high, aux, options);
    
    // Adaptive optimization: Skip merge if largest element in first half
    // is smaller than smallest element in second half
    if (options.adaptive && this.compare(array[mid], array[mid + 1]) <= 0) {
      this.recordState(array, {
        type: 'optimization',
        section: [low, high],
        message: `Skipping merge because array[${mid}] <= array[${mid+1}]`
      });
      return;
    }
    
    // Merge the two sorted halves
    if (options.inPlaceMerge) {
      this.mergeInPlace(array, low, mid, high);
    } else if (options.optimizeMerge) {
      this.mergeOptimized(array, low, mid, high, aux);
    } else {
      this.merge(array, low, mid, high, aux);
    }
  }
  
  /**
   * Bottom-up (iterative) Merge Sort implementation
   * Avoids recursion overhead by using nested loops
   * 
   * @param {Array} array - The array to sort
   * @param {Object} options - Runtime options
   */
  bottomUpMergeSort(array, options) {
    const n = array.length;
    const aux = new Array(n);
    
    // Record initial state
    this.recordState(array, {
      type: 'initialization',
      message: 'Starting bottom-up merge sort'
    });
    
    // Start with subarrays of size 1, then 2, 4, 8, ...
    for (let width = 1; width < n; width *= 2) {
      // Record the current width
      this.recordState(array, {
        type: 'width_update',
        width: width,
        message: `Merging subarrays of width ${width}`
      });
      
      // Merge subarrays of size width
      for (let i = 0; i < n - width; i += width * 2) {
        // Calculate boundaries for merge
        const low = i;
        const mid = i + width - 1;
        const high = Math.min(i + width * 2 - 1, n - 1);
        
        // Use insertion sort for small subarrays
        if (high - low < options.insertionThreshold) {
          this.insertionSort(array, low, high);
          continue;
        }
        
        // Adaptive optimization: Skip merge if already sorted
        if (options.adaptive && this.compare(array[mid], array[mid + 1]) <= 0) {
          continue;
        }
        
        // Record the merge step
        this.recordState(array, {
          type: 'merge_step',
          section: [low, high],
          middle: mid,
          message: `Merging sections [${low}...${mid}] and [${mid+1}...${high}]`
        });
        
        // Merge the two subarrays
        if (options.inPlaceMerge) {
          this.mergeInPlace(array, low, mid, high);
        } else if (options.optimizeMerge) {
          this.mergeOptimized(array, low, mid, high, aux);
        } else {
          this.merge(array, low, mid, high, aux);
        }
      }
    }
  }
  
  /**
   * Standard merge operation that combines two sorted subarrays
   * 
   * @param {Array} array - The array containing subarrays to merge
   * @param {number} low - Start index
   * @param {number} mid - Middle index
   * @param {number} high - End index
   * @param {Array} aux - Auxiliary array for merging
   */
  merge(array, low, mid, high, aux) {
    // Record merge operation start
    this.recordState(array, {
      type: 'merge_begin',
      section: [low, high],
      middle: mid,
      message: `Beginning merge of [${low}...${mid}] and [${mid+1}...${high}]`
    });
    
    // Copy elements to auxiliary array
    for (let k = low; k <= high; k++) {
      aux[k] = this.read(array, k);
    }
    
    // Merge back into original array
    let i = low;      // Index for left subarray
    let j = mid + 1;  // Index for right subarray
    
    for (let k = low; k <= high; k++) {
      // If left subarray is exhausted, take from right
      if (i > mid) {
        this.write(array, k, this.read(aux, j++));
      }
      // If right subarray is exhausted, take from left
      else if (j > high) {
        this.write(array, k, this.read(aux, i++));
      }
      // Compare elements and take smaller one
      else if (this.compare(aux[i], aux[j]) <= 0) {
        this.write(array, k, this.read(aux, i++));
      } else {
        this.write(array, k, this.read(aux, j++));
      }
      
      // Record merge progress periodically
      if ((k - low) % 10 === 0 || k === high) {
        this.recordState(array, {
          type: 'merge_progress',
          section: [low, high],
          progress: (k - low) / (high - low),
          message: `Merge progress: ${Math.floor(((k - low) / (high - low)) * 100)}%`
        });
      }
    }
    
    // Record merge completion
    this.recordState(array, {
      type: 'merge_complete',
      section: [low, high],
      message: `Completed merge for section [${low}...${high}]`
    });
  }
  
  /**
   * Optimized merge operation with sentinels to avoid bounds checking
   * 
   * @param {Array} array - The array containing subarrays to merge
   * @param {number} low - Start index
   * @param {number} mid - Middle index
   * @param {number} high - End index
   * @param {Array} aux - Auxiliary array for merging
   */
  mergeOptimized(array, low, mid, high, aux) {
    // Copy with sentinel values to avoid bounds checking
    for (let i = low; i <= mid; i++) {
      aux[i] = this.read(array, i);
    }
    
    // Copy right subarray in reverse order
    for (let j = high; j > mid; j--) {
      aux[j] = this.read(array, j);
    }
    
    // Merge with sentinels
    let i = low;      // Start of left subarray
    let j = high;     // Start of right subarray (in reverse)
    
    for (let k = low; k <= high; k++) {
      // Compare and take smaller element
      if (this.compare(aux[i], aux[j]) <= 0) {
        this.write(array, k, this.read(aux, i++));
      } else {
        this.write(array, k, this.read(aux, j--));
      }
      
      // Record merge progress periodically
      if ((k - low) % 10 === 0 || k === high) {
        this.recordState(array, {
          type: 'merge_progress',
          section: [low, high],
          progress: (k - low) / (high - low),
          message: `Merge progress: ${Math.floor(((k - low) / (high - low)) * 100)}%`
        });
      }
    }
  }
  
  /**
   * In-place merge operation that uses O(1) extra space
   * Note: This is slower than standard merge but uses less memory
   * 
   * @param {Array} array - The array containing subarrays to merge
   * @param {number} low - Start index
   * @param {number} mid - Middle index
   * @param {number} high - End index
   */
  mergeInPlace(array, low, mid, high) {
    // Record in-place merge start
    this.recordState(array, {
      type: 'merge_begin',
      section: [low, high],
      middle: mid,
      message: `Beginning in-place merge of [${low}...${mid}] and [${mid+1}...${high}]`
    });
    
    // Base case for already-sorted ranges
    if (this.compare(array[mid], array[mid + 1]) <= 0) {
      return;
    }
    
    // In-place merge using rotations
    let first = low;    // Current position in first subarray
    let second = mid + 1; // Current position in second subarray
    
    // Skip elements that are already in place
    while (first <= mid && second <= high) {
      // If element is already in place, move to next element
      if (this.compare(array[first], array[second]) <= 0) {
        first++;
      } else {
        // Save the value to insert
        const value = this.read(array, second);
        let index = second;
        
        // Shift elements to make room for insertion
        while (index > first) {
          this.write(array, index, this.read(array, index - 1));
          index--;
        }
        
        // Insert the value in the correct position
        this.write(array, first, value);
        
        // Adjust pointers
        first++;
        mid++;
        second++;
        
        // Record significant steps
        this.recordState(array, {
          type: 'merge_in_place',
          section: [low, high],
          insertion: first - 1,
          value: value,
          message: `Inserted element ${value} at position ${first - 1}`
        });
      }
    }
    
    // Record merge completion
    this.recordState(array, {
      type: 'merge_complete',
      section: [low, high],
      message: `Completed in-place merge for section [${low}...${high}]`
    });
  }
  
  /**
   * Insertion sort for small subarrays
   * 
   * @param {Array} array - The array to sort
   * @param {number} low - Start index
   * @param {number} high - End index
   */
  insertionSort(array, low, high) {
    this.recordState(array, {
      type: 'insertion_sort',
      section: [low, high],
      message: `Using insertion sort for small section [${low}...${high}]`
    });
    
    for (let i = low + 1; i <= high; i++) {
      const key = this.read(array, i);
      let j = i - 1;
      
      // Find insertion position
      while (j >= low && this.compare(this.read(array, j), key) > 0) {
        this.write(array, j + 1, this.read(array, j));
        j--;
      }
      
      // Insert element at correct position
      if (j + 1 !== i) {
        this.write(array, j + 1, key);
        
        // Record insertion operation
        this.recordState(array, {
          type: 'insertion_step',
          section: [low, high],
          insertion: j + 1,
          value: key,
          message: `Inserted ${key} at position ${j + 1}`
        });
      }
    }
  }
  
  /**
   * Check if a subarray is already sorted
   * 
   * @param {Array} array - The array to check
   * @param {number} low - Start index
   * @param {number} high - End index
   * @returns {boolean} - True if the subarray is sorted
   */
  isAlreadySorted(array, low, high) {
    for (let i = low + 1; i <= high; i++) {
      if (this.compare(array[i - 1], array[i]) > 0) {
        return false;
      }
    }
    return true;
  }
  
  /**
   * Get the time and space complexity of Merge Sort
   * 
   * @returns {Object} - Complexity information
   */
  getComplexity() {
    return {
      time: {
        best: this.options.adaptive ? 'O(n)' : 'O(n log n)',
        average: 'O(n log n)',
        worst: 'O(n log n)'
      },
      space: {
        best: this.options.inPlaceMerge ? 'O(1)' : 'O(n)',
        average: this.options.inPlaceMerge ? 'O(1)' : 'O(n)',
        worst: this.options.inPlaceMerge ? 'O(1)' : 'O(n)'
      }
    };
  }
  
  /**
   * Whether Merge Sort is stable
   * 
   * @returns {boolean} - True as Merge Sort is stable
   */
  isStable() {
    return true;
  }
  
  /**
   * Whether Merge Sort is in-place
   * 
   * @returns {boolean} - True only if using in-place merge option
   */
  isInPlace() {
    return this.options.inPlaceMerge;
  }
  
  /**
   * Get detailed algorithm information
   * 
   * @returns {Object} - Detailed algorithm metadata
   */
  getInfo() {
    const info = super.getInfo();
    
    // Add merge sort specific information
    info.optimization = {
      bottomUp: this.options.bottomUp,
      adaptive: this.options.adaptive,
      inPlaceMerge: this.options.inPlaceMerge,
      insertionThreshold: this.options.insertionThreshold,
      optimizeMerge: this.options.optimizeMerge
    };
    
    info.properties = {
      comparisonBased: true,
      stable: true,
      inPlace: this.options.inPlaceMerge,
      online: false,
      divideAndConquer: true
    };
    
    info.suitable = {
      smallArrays: false,
      nearlySortedArrays: true,
      largeArrays: true,
      linkedLists: true
    };
    
    info.variants = [
      'Top-down (recursive) Merge Sort',
      'Bottom-up (iterative) Merge Sort',
      'Natural Merge Sort (adaptive)',
      'In-place Merge Sort',
      'Timsort (hybrid with insertion sort)',
      'Parallel Merge Sort'
    ];
    
    info.advantages = [
      'Guaranteed O(n log n) performance in worst case',
      'Stable sorting (preserves order of equal elements)',
      'Well-suited for external sorting (disk-based)',
      'Parallelizes well for multi-threaded implementations',
      'Excellent for linked lists (requires only pointer manipulation)'
    ];
    
    info.disadvantages = [
      'Requires O(n) extra space in standard implementation',
      'Not cache-efficient due to non-local memory references',
      'Slower than quicksort for in-memory sorting in many cases',
      'In-place variants have significantly worse performance'
    ];
    
    return info;
  }
}

export default MergeSort;