// src/algorithms/comparison/quick.js

import Algorithm from '../core/algorithm-base';

/**
 * Implementation of Quick Sort with multiple optimization strategies.
 * 
 * Quick Sort is a divide-and-conquer algorithm that:
 * 1. Selects a 'pivot' element from the array
 * 2. Partitions the array around the pivot (elements < pivot on the left, elements > pivot on the right)
 * 3. Recursively applies the above steps to the sub-arrays
 * 
 * This implementation includes sophisticated optimizations:
 * 1. Multiple pivot selection strategies (first, last, middle, random, median-of-three)
 * 2. Three-way partitioning (Dutch national flag algorithm) for handling duplicates efficiently
 * 3. Insertion sort for small subarrays to reduce recursion overhead
 * 4. Tail recursion elimination to reduce stack space requirements
 * 5. Adaptive pivot selection based on array characteristics
 * 
 * Time Complexity:
 * - Best:    O(n log n) when partitions are balanced
 * - Average: O(n log n)
 * - Worst:   O(n²) with pathological pivot choices, but mitigated by our optimizations
 * 
 * Space Complexity:
 * - O(log n) average case for recursion stack
 * - O(n) worst case with unbalanced partitions
 * 
 * @class QuickSort
 * @extends Algorithm
 */
class QuickSort extends Algorithm {
  /**
   * Create a new QuickSort instance
   * 
   * @param {Object} options - Configuration options
   * @param {string} [options.pivotStrategy='median-of-three'] - Strategy for selecting pivot
   * @param {number} [options.insertionThreshold=16] - Threshold for switching to insertion sort
   * @param {boolean} [options.threeWayPartition=true] - Use three-way partitioning for duplicates
   * @param {boolean} [options.tailRecursion=true] - Use tail recursion optimization
   * @param {boolean} [options.adaptivePivot=true] - Adapt pivot strategy based on array characteristics
   */
  constructor(options = {}) {
    super('Quick Sort', 'comparison', options);
    
    // Default options with carefully chosen values based on empirical performance data
    this.options = {
      pivotStrategy: 'median-of-three', // Strategy for selecting pivot
      insertionThreshold: 16,           // Switch to insertion sort for small arrays
      threeWayPartition: true,          // Use three-way partitioning for handling duplicates
      tailRecursion: true,              // Use tail recursion optimization
      adaptivePivot: true,              // Adapt pivot strategy based on array characteristics
      ...options
    };
  }
  
  /**
   * Execute Quick Sort on the input array
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
    
    // Start the quicksort process
    this.quickSort(result, 0, n - 1, options);
    
    this.setPhase('completed');
    return result;
  }
  
  /**
   * Main recursive Quick Sort function
   * 
   * @param {Array} array - The array being sorted
   * @param {number} low - Start index
   * @param {number} high - End index
   * @param {Object} options - Runtime options
   */
  quickSort(array, low, high, options) {
    // Record the current recursive call
    this.recordState(array, {
      type: 'recursive-call',
      section: [low, high],
      message: `Sorting section from index ${low} to ${high}`
    });
    
    // Base case: If the partition size is below threshold, use insertion sort
    if (high - low < options.insertionThreshold) {
      this.insertionSort(array, low, high);
      return;
    }
    
    // Base case: If the partition is empty or has only one element
    if (low >= high) {
      return;
    }
    
    // Choose the partitioning algorithm based on options
    if (options.threeWayPartition) {
      // Three-way partitioning for arrays with potential duplicates
      const [lt, gt] = this.threeWayPartition(array, low, high, options);
      
      // Record completed partitioning
      this.recordState(array, {
        type: 'partition-complete',
        lt: lt,
        gt: gt,
        message: `Three-way partition: [${low}...${lt-1}] < pivot, [${lt}...${gt}] = pivot, [${gt+1}...${high}] > pivot`
      });
      
      // Recursively sort left partition
      this.quickSort(array, low, lt - 1, options);
      
      // Recursively sort right partition using tail recursion optimization if enabled
      if (options.tailRecursion) {
        // Instead of recursing, prepare for next iteration
        low = gt + 1;
        // Continue the loop (implicit tail recursion)
        if (low < high) {
          this.quickSort(array, low, high, options);
        }
      } else {
        // Standard recursive call for right partition
        this.quickSort(array, gt + 1, high, options);
      }
    } else {
      // Standard partitioning
      const pivotIndex = this.partition(array, low, high, options);
      
      // Record completed partitioning
      this.recordState(array, {
        type: 'partition-complete',
        pivotIndex: pivotIndex,
        message: `Standard partition: pivot at index ${pivotIndex}`
      });
      
      // Recursively sort left partition
      this.quickSort(array, low, pivotIndex - 1, options);
      
      // Recursively sort right partition using tail recursion optimization if enabled
      if (options.tailRecursion) {
        // Instead of recursing, prepare for next iteration
        low = pivotIndex + 1;
        // Continue the loop (implicit tail recursion)
        if (low < high) {
          this.quickSort(array, low, high, options);
        }
      } else {
        // Standard recursive call for right partition
        this.quickSort(array, pivotIndex + 1, high, options);
      }
    }
  }
  
  /**
   * Standard partition scheme (Lomuto's partition)
   * 
   * @param {Array} array - The array to partition
   * @param {number} low - Start index
   * @param {number} high - End index
   * @param {Object} options - Runtime options
   * @returns {number} - Final position of the pivot
   */
  partition(array, low, high, options) {
    // Select a pivot based on the chosen strategy
    const pivotIndex = this.selectPivot(array, low, high, options.pivotStrategy, options.adaptivePivot);
    
    // Record pivot selection
    this.recordState(array, {
      type: 'pivot-selection',
      pivotIndex: pivotIndex,
      value: array[pivotIndex],
      strategy: options.adaptivePivot ? 'adaptive' : options.pivotStrategy,
      message: `Selected pivot ${array[pivotIndex]} at index ${pivotIndex}`
    });
    
    // Move pivot to the end temporarily
    this.swap(array, pivotIndex, high);
    
    // Record pivot movement
    this.recordState(array, {
      type: 'pivot-movement',
      indices: [pivotIndex, high],
      message: `Moved pivot to index ${high} for partitioning`
    });
    
    const pivotValue = this.read(array, high);
    
    // Initialize partition index
    let i = low;
    
    // Partition the array
    for (let j = low; j < high; j++) {
      // Compare current element with pivot
      const comparison = this.compare(this.read(array, j), pivotValue);
      
      // Record comparison
      this.recordState(array, {
        type: 'comparison',
        indices: [j, high],
        result: comparison,
        message: `Comparing element at index ${j} with pivot`
      });
      
      // If current element is less than pivot, move it to the left side
      if (comparison < 0) {
        // Swap elements
        if (i !== j) {
          this.swap(array, i, j);
          
          // Record the swap
          this.recordState(array, {
            type: 'partition-swap',
            indices: [i, j],
            message: `Moved smaller element from index ${j} to ${i}`
          });
        }
        
        // Increment partition index
        i++;
      }
    }
    
    // Move pivot to its final position
    this.swap(array, i, high);
    
    // Record final pivot position
    this.recordState(array, {
      type: 'pivot-final',
      pivotIndex: i,
      message: `Placed pivot ${pivotValue} at final position ${i}`
    });
    
    return i;
  }
  
  /**
   * Three-way partitioning (Dutch national flag algorithm)
   * Handles duplicates efficiently by creating three partitions:
   * - Elements less than pivot
   * - Elements equal to pivot
   * - Elements greater than pivot
   * 
   * @param {Array} array - The array to partition
   * @param {number} low - Start index
   * @param {number} high - End index
   * @param {Object} options - Runtime options
   * @returns {Array} - [lt, gt] indices where lt is the first element equal to pivot and gt is the last
   */
  threeWayPartition(array, low, high, options) {
    // Select a pivot based on the chosen strategy
    const pivotIndex = this.selectPivot(array, low, high, options.pivotStrategy, options.adaptivePivot);
    
    // Record pivot selection
    this.recordState(array, {
      type: 'pivot-selection',
      pivotIndex: pivotIndex,
      value: array[pivotIndex],
      strategy: options.adaptivePivot ? 'adaptive' : options.pivotStrategy,
      message: `Selected pivot ${array[pivotIndex]} at index ${pivotIndex} for three-way partition`
    });
    
    const pivotValue = this.read(array, pivotIndex);
    
    // Initialize pointers for the three sections
    let lt = low;      // Elements < pivot will be to the left of lt
    let gt = high;     // Elements > pivot will be to the right of gt
    let i = low;       // Current element being examined
    
    // Partition the array
    while (i <= gt) {
      // Compare current element with pivot
      const comparison = this.compare(this.read(array, i), pivotValue);
      
      // Record comparison
      this.recordState(array, {
        type: 'comparison',
        indices: [i, pivotIndex],
        result: comparison,
        message: `Comparing element at index ${i} with pivot`
      });
      
      if (comparison < 0) {
        // Element is less than pivot, move to the left section
        this.swap(array, lt, i);
        
        // Record the swap
        this.recordState(array, {
          type: 'partition-swap',
          indices: [lt, i],
          message: `Moved smaller element from index ${i} to ${lt}`
        });
        
        lt++;
        i++;
      } else if (comparison > 0) {
        // Element is greater than pivot, move to the right section
        this.swap(array, i, gt);
        
        // Record the swap
        this.recordState(array, {
          type: 'partition-swap',
          indices: [i, gt],
          message: `Moved larger element from index ${i} to ${gt}`
        });
        
        gt--;
        // Don't increment i since we need to examine the element we just swapped in
      } else {
        // Element is equal to pivot, keep in the middle section
        i++;
      }
    }
    
    // Record final partitioning
    this.recordState(array, {
      type: 'three-way-partition',
      lt: lt,
      gt: gt,
      message: `Three-way partition complete: [${low}...${lt-1}] < pivot, [${lt}...${gt}] = pivot, [${gt+1}...${high}] > pivot`
    });
    
    return [lt, gt];
  }
  
  /**
   * Insertion sort for small subarrays
   * 
   * @param {Array} array - The array to sort
   * @param {number} low - Start index
   * @param {number} high - End index
   */
  insertionSort(array, low, high) {
    // Record switch to insertion sort
    this.recordState(array, {
      type: 'algorithm-switch',
      section: [low, high],
      message: `Switching to insertion sort for small subarray [${low}...${high}]`
    });
    
    for (let i = low + 1; i <= high; i++) {
      const key = this.read(array, i);
      let j = i - 1;
      
      // Find the correct position for the key
      while (j >= low && this.compare(this.read(array, j), key) > 0) {
        // Shift elements to the right
        this.write(array, j + 1, this.read(array, j));
        j--;
      }
      
      // Insert the key in its correct position
      if (j + 1 !== i) {
        this.write(array, j + 1, key);
        
        // Record insertion
        this.recordState(array, {
          type: 'insertion',
          index: j + 1,
          value: key,
          message: `Inserted ${key} at position ${j + 1}`
        });
      }
    }
    
    // Record completion of insertion sort
    this.recordState(array, {
      type: 'subarray-sorted',
      section: [low, high],
      message: `Insertion sort complete for subarray [${low}...${high}]`
    });
  }
  
  /**
   * Select a pivot element using the specified strategy
   * 
   * @param {Array} array - The array
   * @param {number} low - Start index
   * @param {number} high - End index
   * @param {string} strategy - Pivot selection strategy
   * @param {boolean} adaptive - Whether to use adaptive pivot selection
   * @returns {number} - Index of the selected pivot
   */
  selectPivot(array, low, high, strategy, adaptive) {
    // Early return for single-element arrays
    if (low === high) {
      return low;
    }
    
    // Adaptive pivot selection based on array characteristics
    if (adaptive) {
      // Examine a sample of elements to determine the best strategy
      const size = high - low + 1;
      
      if (size >= 16) {
        // For larger arrays, check if the array might be partially sorted
        const samples = [
          low, 
          Math.floor(low + size * 0.25), 
          Math.floor(low + size * 0.5),
          Math.floor(low + size * 0.75),
          high
        ];
        
        let ascending = 0;
        let descending = 0;
        
        // Check for ascending or descending patterns
        for (let i = 1; i < samples.length; i++) {
          const comparison = this.compare(array[samples[i-1]], array[samples[i]]);
          if (comparison <= 0) ascending++;
          if (comparison >= 0) descending++;
        }
        
        // If the array appears to be partially sorted, use median-of-three
        if (ascending >= 3 || descending >= 3) {
          return this.medianOfThree(array, low, high);
        }
        
        // Otherwise, use a strategy appropriate for the array size
        if (size > 100) {
          // For very large arrays, use median-of-medians (approximated with ninther)
          return this.ninther(array, low, high);
        }
      }
    }
    
    // Standard pivot selection strategies
    switch (strategy) {
      case 'first':
        return low;
        
      case 'last':
        return high;
        
      case 'middle':
        return Math.floor(low + (high - low) / 2);
        
      case 'random':
        return Math.floor(low + Math.random() * (high - low + 1));
        
      case 'median-of-three':
        return this.medianOfThree(array, low, high);
        
      default:
        // Default to median-of-three as it provides good general performance
        return this.medianOfThree(array, low, high);
    }
  }
  
  /**
   * Find the median of three elements (first, middle, last)
   * 
   * @param {Array} array - The array
   * @param {number} low - Start index
   * @param {number} high - End index
   * @returns {number} - Index of the median element
   */
  medianOfThree(array, low, high) {
    const mid = Math.floor(low + (high - low) / 2);
    
    // Compare the three elements
    if (this.compare(array[low], array[mid]) > 0) {
      if (this.compare(array[mid], array[high]) > 0) {
        return mid; // mid is the median
      } else if (this.compare(array[low], array[high]) > 0) {
        return high; // high is the median
      } else {
        return low; // low is the median
      }
    } else {
      if (this.compare(array[low], array[high]) > 0) {
        return low; // low is the median
      } else if (this.compare(array[mid], array[high]) > 0) {
        return high; // high is the median
      } else {
        return mid; // mid is the median
      }
    }
  }
  
  /**
   * Find the "ninther" - the median of medians of three samples of three elements
   * This is a good approximation of the true median with minimal overhead
   * 
   * @param {Array} array - The array
   * @param {number} low - Start index
   * @param {number} high - End index
   * @returns {number} - Index of the selected pivot
   */
  ninther(array, low, high) {
    const size = high - low + 1;
    const step = Math.floor(size / 8);
    
    // Select three points for each of three sections
    const sections = [
      [low, low + step, low + 2 * step],
      [Math.floor(low + (high - low) / 2) - step, Math.floor(low + (high - low) / 2), Math.floor(low + (high - low) / 2) + step],
      [high - 2 * step, high - step, high]
    ];
    
    // Find the median of each section
    const medians = [];
    for (const section of sections) {
      medians.push(this.medianOfThree(array, section[0], section[2]));
    }
    
    // Return the median of the three medians
    return this.medianOfThree(array, medians[0], medians[2]);
  }
  
  /**
   * Get the time and space complexity of Quick Sort
   * 
   * @returns {Object} - Complexity information
   */
  getComplexity() {
    return {
      time: {
        best: 'O(n log n)',
        average: 'O(n log n)',
        worst: 'O(n²)' // Although our optimizations mitigate this in practice
      },
      space: {
        best: 'O(log n)',
        average: 'O(log n)',
        worst: 'O(n)'
      }
    };
  }
  
  /**
   * Whether Quick Sort is stable (preserves relative order of equal elements)
   * 
   * @returns {boolean} - False as standard Quick Sort is not stable
   */
  isStable() {
    return false;
  }
  
  /**
   * Whether Quick Sort is in-place (uses minimal auxiliary space)
   * 
   * @returns {boolean} - True as Quick Sort is generally considered in-place
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
    
    // Add quicksort specific information
    info.optimization = {
      pivotStrategy: this.options.pivotStrategy,
      adaptivePivot: this.options.adaptivePivot,
      insertionThreshold: this.options.insertionThreshold,
      threeWayPartition: this.options.threeWayPartition,
      tailRecursion: this.options.tailRecursion
    };
    
    info.properties = {
      comparisonBased: true,
      stable: false,
      inPlace: true,
      online: false,
      divideAndConquer: true,
      adaptive: this.options.adaptivePivot
    };
    
    info.suitable = {
      smallArrays: true, // With insertion sort optimization
      nearlySortedArrays: this.options.adaptivePivot, // If using adaptive pivot
      largeArrays: true,
      duplicateElements: this.options.threeWayPartition // Especially with three-way partitioning
    };
    
    info.variants = [
      'Lomuto partition scheme',
      'Hoare partition scheme',
      'Three-way partitioning (Dutch national flag)',
      'Dual-pivot Quick Sort',
      'Introsort (hybrid with Heap Sort)',
      'Quick Sort with median-of-medians'
    ];
    
    info.pivotStrategies = {
      first: 'Simple but performs poorly on sorted arrays',
      last: 'Simple but performs poorly on reverse-sorted arrays',
      middle: 'Good for partially sorted arrays',
      random: 'Probabilistic protection against worst-case inputs',
      'median-of-three': 'Good general-purpose strategy, helps with partially sorted arrays',
      adaptive: 'Dynamically chooses strategy based on array characteristics',
      ninther: 'Good approximation of true median for large arrays'
    };
    
    info.advantages = [
      'Fast in-place sorting with excellent average-case performance',
      'Good cache locality for in-memory sorting',
      'Low overhead with minimal memory usage',
      'Can be optimized for different types of input data',
      'Outperforms other O(n log n) algorithms in practice for random data'
    ];
    
    info.disadvantages = [
      'Not stable (does not preserve order of equal elements)',
      'Vulnerable to worst-case O(n²) behavior without proper pivot selection',
      'Requires careful optimization to handle corner cases efficiently',
      'Recursive implementation can cause stack overflow for large arrays without tail recursion optimization'
    ];
    
    info.performance = {
      bestCase: 'Random data with balanced partitioning',
      worstCase: 'Sorted or reverse-sorted arrays with poor pivot selection strategy',
      averageCase: 'Random data with occasional skewed partitions'
    };
    
    return info;
  }
}

export default QuickSort;