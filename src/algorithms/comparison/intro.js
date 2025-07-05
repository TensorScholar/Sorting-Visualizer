// src/algorithms/comparison/intro.js

import Algorithm from '../core/algorithm-base';

/**
 * Implementation of Intro Sort (Introspective Sort) - a hybrid sorting algorithm
 * that combines Quick Sort, Heap Sort, and Insertion Sort.
 * 
 * Intro Sort was designed by David R. Musser in 1997 to provide a practical
 * sorting algorithm with both optimal asymptotic runtime complexity and
 * excellent practical performance. It is used in the C++ Standard Library (std::sort).
 * 
 * The algorithm works by:
 * 1. Starting with Quick Sort for good average-case performance
 * 2. Switching to Heap Sort when recursion depth exceeds a threshold to avoid
 *    Quick Sort's worst-case behavior (determined by 2*log₂(n))
 * 3. Using Insertion Sort for small sub-arrays for improved performance
 * 
 * This provides an elegant solution that combines the strengths of multiple algorithms:
 * - Quick Sort's excellent average-case performance and cache efficiency
 * - Heap Sort's guaranteed O(n log n) worst-case complexity
 * - Insertion Sort's efficiency for small arrays
 * 
 * @class IntroSort
 * @extends Algorithm
 */
class IntroSort extends Algorithm {
  /**
   * Create a new IntroSort instance
   * 
   * @param {Object} options - Configuration options
   * @param {number} [options.insertionThreshold=16] - Size threshold for using insertion sort
   * @param {string} [options.pivotStrategy='median-of-three'] - Strategy for selecting pivot
   * @param {boolean} [options.optimizeThreshold=true] - Dynamically compute depth threshold
   */
  constructor(options = {}) {
    super('Intro Sort', 'comparison', options);
    
    // Default options
    this.options = {
      insertionThreshold: 16,           // Switch to insertion sort below this size
      pivotStrategy: 'median-of-three', // Strategy for selecting pivot in quicksort phase
      optimizeThreshold: true,          // Dynamically compute depth threshold
      ...options
    };
  }
  
  /**
   * Execute Intro Sort on the input array
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
    
    // Compute maximum recursion depth for quicksort phase
    const maxDepth = this.computeMaxDepth(n, options);
    
    this.setPhase('sorting');
    
    // Begin the sort
    this.introSort(result, 0, n - 1, maxDepth, options);
    
    this.setPhase('completed');
    return result;
  }
  
  /**
   * Compute the maximum recursion depth for the quicksort phase
   * 
   * @param {number} size - Size of the array
   * @param {Object} options - Algorithm options
   * @returns {number} - Maximum recursion depth
   */
  computeMaxDepth(size, options) {
    if (!options.optimizeThreshold) {
      // Fixed at 2*log₂(n)
      return Math.floor(2 * Math.log2(size));
    }
    
    // More sophisticated depth calculation
    // This is based on the observation that the average case quicksort
    // recursion depth is approximately 1.5*log₂(n)
    return Math.floor(2.5 * Math.log2(size));
  }
  
  /**
   * Main Intro Sort recursive implementation
   * 
   * @param {Array} array - The array being sorted
   * @param {number} start - Start index
   * @param {number} end - End index
   * @param {number} depthLimit - Remaining recursion depth limit
   * @param {Object} options - Algorithm options
   */
  introSort(array, start, end, depthLimit, options) {
    const size = end - start + 1;
    
    // Use insertion sort for small arrays
    if (size <= options.insertionThreshold) {
      this.insertionSort(array, start, end);
      
      this.recordState(array, {
        type: 'insertion-complete',
        section: [start, end],
        message: `Completed insertion sort on small range [${start}...${end}]`
      });
      
      return;
    }
    
    // If depth limit is zero, switch to heap sort
    if (depthLimit === 0) {
      this.recordState(array, {
        type: 'algorithm-switch',
        algorithm: 'heap-sort',
        section: [start, end],
        message: `Recursion depth limit reached, switching to Heap Sort for range [${start}...${end}]`
      });
      
      this.heapSort(array, start, end);
      return;
    }
    
    // Otherwise, use quicksort partition
    this.recordState(array, {
      type: 'quicksort-phase',
      section: [start, end],
      depthRemaining: depthLimit,
      message: `Using QuickSort partition for range [${start}...${end}], depth remaining: ${depthLimit}`
    });
    
    // Choose pivot and partition the array
    const pivotIndex = this.partition(array, start, end, options);
    
    // Recursively sort the left partition
    const leftSize = pivotIndex - start;
    if (leftSize > 1) {
      this.introSort(array, start, pivotIndex - 1, depthLimit - 1, options);
    }
    
    // Recursively sort the right partition
    const rightSize = end - pivotIndex;
    if (rightSize > 1) {
      this.introSort(array, pivotIndex + 1, end, depthLimit - 1, options);
    }
  }
  
  /**
   * QuickSort partition operation
   * 
   * @param {Array} array - The array to partition
   * @param {number} start - Start index
   * @param {number} end - End index
   * @param {Object} options - Algorithm options
   * @returns {number} - Final position of the pivot
   */
  partition(array, start, end, options) {
    // Select pivot based on specified strategy
    const pivotIndex = this.selectPivot(array, start, end, options.pivotStrategy);
    
    // Move pivot to the end
    this.swap(array, pivotIndex, end);
    
    const pivotValue = this.read(array, end);
    
    this.recordState(array, {
      type: 'pivot-selection',
      originalPivotIndex: pivotIndex,
      pivotValue: pivotValue,
      message: `Selected pivot ${pivotValue} (originally at index ${pivotIndex})`
    });
    
    // Partition the array
    let i = start; // Position for elements less than pivot
    
    for (let j = start; j < end; j++) {
      if (this.compare(this.read(array, j), pivotValue) <= 0) {
        // Element is less than or equal to pivot, move to left partition
        if (i !== j) {
          this.swap(array, i, j);
          
          this.recordState(array, {
            type: 'partition-step',
            pivotValue: pivotValue,
            swapped: [i, j],
            message: `Swapped elements at ${i} and ${j} during partitioning`
          });
        }
        i++;
      }
    }
    
    // Place pivot in its final position
    this.swap(array, i, end);
    
    this.recordState(array, {
      type: 'partition-complete',
      pivotIndex: i,
      pivotValue: pivotValue,
      leftSection: [start, i - 1],
      rightSection: [i + 1, end],
      message: `Completed partitioning with pivot ${pivotValue} at position ${i}`
    });
    
    return i;
  }
  
  /**
   * Select a pivot using the specified strategy
   * 
   * @param {Array} array - The array
   * @param {number} start - Start index
   * @param {number} end - End index
   * @param {string} strategy - Pivot selection strategy
   * @returns {number} - Index of the selected pivot
   */
  selectPivot(array, start, end, strategy) {
    switch (strategy) {
      case 'first':
        return start;
        
      case 'last':
        return end;
        
      case 'middle':
        return Math.floor(start + (end - start) / 2);
        
      case 'random':
        return Math.floor(start + Math.random() * (end - start + 1));
        
      case 'median-of-three':
      default:
        // Get first, middle, and last elements
        const mid = Math.floor(start + (end - start) / 2);
        
        // Select median of three values
        const a = this.read(array, start);
        const b = this.read(array, mid);
        const c = this.read(array, end);
        
        // Return the index of the median value
        if (this.compare(a, b) <= 0) {
          if (this.compare(b, c) <= 0) return mid;    // a <= b <= c
          if (this.compare(a, c) <= 0) return end;    // a <= c < b
          return start;                               // c < a <= b
        } else {
          if (this.compare(a, c) <= 0) return start;  // b < a <= c
          if (this.compare(b, c) <= 0) return end;    // b <= c < a
          return mid;                                 // c < b < a
        }
    }
  }
  
  /**
   * Insertion sort implementation for small subarrays
   * 
   * @param {Array} array - The array to sort
   * @param {number} start - Start index
   * @param {number} end - End index
   */
  insertionSort(array, start, end) {
    this.recordState(array, {
      type: 'insertion-start',
      section: [start, end],
      message: `Starting insertion sort for range [${start}...${end}]`
    });
    
    for (let i = start + 1; i <= end; i++) {
      const key = this.read(array, i);
      let j = i - 1;
      
      // Find insertion position
      while (j >= start && this.compare(this.read(array, j), key) > 0) {
        this.write(array, j + 1, this.read(array, j));
        j--;
      }
      
      // Insert element at correct position
      if (j + 1 !== i) {
        this.write(array, j + 1, key);
        
        // Record this insertion step
        this.recordState(array, {
          type: 'insertion-step',
          key: key,
          position: j + 1,
          message: `Inserted ${key} at position ${j + 1}`
        });
      }
    }
  }
  
  /**
   * Heap sort implementation
   * 
   * @param {Array} array - The array to sort
   * @param {number} start - Start index
   * @param {number} end - End index
   */
  heapSort(array, start, end) {
    const size = end - start + 1;
    
    // Build max heap
    this.recordState(array, {
      type: 'heap-construction',
      section: [start, end],
      message: `Building max heap for range [${start}...${end}]`
    });
    
    // Heapify from the middle to the start
    for (let i = Math.floor(size / 2) - 1 + start; i >= start; i--) {
      this.siftDown(array, i, end, start);
    }
    
    this.recordState(array, {
      type: 'heap-ready',
      section: [start, end],
      message: `Max heap constructed`
    });
    
    // Extract elements from the heap one by one
    for (let i = end; i > start; i--) {
      // Swap first (max) element with the current last element
      this.swap(array, start, i);
      
      this.recordState(array, {
        type: 'extract-max',
        extracted: i,
        value: array[i],
        message: `Extracted max element ${array[i]} to position ${i}`
      });
      
      // Sift down the new root to maintain heap property
      this.siftDown(array, start, i - 1, start);
    }
  }
  
  /**
   * Sift down operation for heap sort
   * 
   * @param {Array} array - The array containing the heap
   * @param {number} root - Index of the root node
   * @param {number} end - End index of the heap
   * @param {number} offset - Start index offset
   */
  siftDown(array, root, end, offset) {
    let current = root;
    
    while (true) {
      const left = 2 * (current - offset) + 1 + offset;
      const right = left + 1;
      let largest = current;
      
      // Compare with left child
      if (left <= end && this.compare(this.read(array, left), this.read(array, largest)) > 0) {
        largest = left;
      }
      
      // Compare with right child
      if (right <= end && this.compare(this.read(array, right), this.read(array, largest)) > 0) {
        largest = right;
      }
      
      // If largest is not the current node, swap and continue
      if (largest !== current) {
        this.swap(array, current, largest);
        
        this.recordState(array, {
          type: 'sift-down',
          swapped: [current, largest],
          message: `Swapped ${array[largest]} and ${array[current]} during sift down`
        });
        
        current = largest;
      } else {
        // Heap property is satisfied
        break;
      }
    }
  }
  
  /**
   * Get the time and space complexity of Intro Sort
   * 
   * @returns {Object} - Complexity information
   */
  getComplexity() {
    return {
      time: {
        best: 'O(n log n)',
        average: 'O(n log n)',
        worst: 'O(n log n)'
      },
      space: {
        best: 'O(log n)',
        average: 'O(log n)',
        worst: 'O(log n)'
      }
    };
  }
  
  /**
   * Whether Intro Sort is stable
   * 
   * @returns {boolean} - False as Intro Sort is not stable
   */
  isStable() {
    return false;
  }
  
  /**
   * Whether Intro Sort is in-place
   * 
   * @returns {boolean} - True as Intro Sort is in-place
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
    
    // Add Intro Sort specific information
    info.optimization = {
      insertionThreshold: this.options.insertionThreshold,
      pivotStrategy: this.options.pivotStrategy,
      optimizeThreshold: this.options.optimizeThreshold
    };
    
    info.properties = {
      comparisonBased: true,
      stable: false,
      inPlace: true,
      hybrid: true,
      adaptive: true,
      deterministic: this.options.pivotStrategy !== 'random'
    };
    
    info.suitable = {
      smallArrays: true,
      largeArrays: true,
      nearlySortedArrays: true,
      randomData: true,
      productionSystems: true
    };
    
    info.variants = [
      'Standard IntroSort (quicksort → heapsort)',
      'C++ STL std::sort implementation',
      'Dual Pivot IntroSort',
      '.NET Framework Array.Sort implementation (introspective sort variant)'
    ];
    
    info.advantages = [
      'Guaranteed O(n log n) worst-case performance',
      'Excellent average-case performance inherited from quicksort',
      'Good performance on small arrays using insertion sort',
      'In-place sorting (no extra memory needed except stack)',
      'Used in production systems (C++ STL, .NET Framework)'
    ];
    
    info.disadvantages = [
      'Not stable (does not preserve order of equal elements)',
      'More complex implementation than single-algorithm approaches',
      'May perform unnecessary algorithm switches in some edge cases'
    ];
    
    info.citations = [
      {
        author: 'David R. Musser',
        title: 'Introspective Sorting and Selection Algorithms',
        year: 1997,
        reference: 'Software—Practice and Experience 27(8): 983–993'
      }
    ];
    
    return info;
  }
}

export default IntroSort;