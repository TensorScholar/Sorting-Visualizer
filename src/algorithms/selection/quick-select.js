// src/algorithms/selection/quick-select.js

import Algorithm from '../core/algorithm-base';

/**
 * Implementation of Quick Select algorithm with multiple optimization strategies.
 * 
 * Quick Select is an efficient selection algorithm to find the k-th smallest element
 * in an unordered list. It's based on the partitioning method from QuickSort but
 * only recursively processes one side of the partition.
 * 
 * This implementation includes optimizations:
 * - Multiple pivot selection strategies
 * - Small array optimization with insertion sort
 * - Deterministic selection with median-of-medians option
 * - Detailed visualization of partitioning process
 * 
 * Average-case time complexity: O(n)
 * Worst-case time complexity: O(n²) with basic implementation, O(n) with median-of-medians
 * 
 * @class QuickSelect
 * @extends Algorithm
 */
class QuickSelect extends Algorithm {
  /**
   * Create a new QuickSelect instance
   * 
   * @param {Object} options - Configuration options
   * @param {string} [options.pivotStrategy='median-of-three'] - Strategy for selecting pivot
   * @param {boolean} [options.useMedianOfMedians=false] - Use deterministic median-of-medians approach
   * @param {number} [options.insertionThreshold=10] - Threshold for switching to insertion sort
   * @param {boolean} [options.visualizePartitioning=true] - Show detailed partitioning steps
   */
  constructor(options = {}) {
    super('Quick Select', 'selection', options);
    
    // Default options
    this.options = {
      pivotStrategy: 'median-of-three',  // Strategy for selecting pivot
      useMedianOfMedians: false,         // Use deterministic median-of-medians approach
      insertionThreshold: 10,            // Threshold for switching to insertion sort
      visualizePartitioning: true,       // Show detailed partitioning steps
      ...options
    };
  }
  
  /**
   * Execute Quick Select to find the k-th smallest element
   * 
   * @param {Array} array - Input array
   * @param {Object} options - Runtime options including k (element to select)
   * @returns {*} - The k-th smallest element
   */
  run(array, options) {
    // Clone array to avoid modifying the original
    const result = [...array];
    const n = result.length;
    
    // Get k (1-based index of element to find)
    const k = options.k || 1;
    
    // Validate k
    if (k < 1 || k > n) {
      throw new Error(`Invalid value of k: ${k}. Must be between 1 and ${n}`);
    }
    
    // Convert to 0-based index
    const index = k - 1;
    
    this.setPhase('selection');
    
    // Find the k-th element
    const kthElement = this.options.useMedianOfMedians 
      ? this.medianOfMediansSelect(result, 0, n - 1, index, options)
      : this.quickSelect(result, 0, n - 1, index, options);
    
    this.setPhase('completed');
    
    // For visualization purposes, mark the k-th element
    this.recordState(result, {
      type: 'final-selection',
      selectedIndex: index,
      selectedValue: kthElement,
      message: `Found the ${k}-th smallest element: ${kthElement}`
    });
    
    return kthElement;
  }
  
  /**
   * Standard Quick Select implementation
   * 
   * @param {Array} array - Array to search in
   * @param {number} low - Start index
   * @param {number} high - End index
   * @param {number} k - Index of element to find (0-based)
   * @param {Object} options - Runtime options
   * @returns {*} - The k-th element
   */
  quickSelect(array, low, high, k, options) {
    // Record the current state
    this.recordState(array, {
      type: 'selection-step',
      range: [low, high],
      target: k,
      message: `Looking for element at position ${k} in range [${low}...${high}]`
    });
    
    // Base case: small array, find element by sorting
    if (high - low < this.options.insertionThreshold) {
      this.insertionSort(array, low, high);
      return array[k];
    }
    
    // Select pivot using chosen strategy
    const pivotIdx = this.selectPivot(array, low, high, this.options.pivotStrategy);
    
    // Record pivot selection
    this.recordState(array, {
      type: 'pivot-selection',
      pivot: pivotIdx,
      pivotValue: array[pivotIdx],
      message: `Selected pivot at index ${pivotIdx} with value ${array[pivotIdx]}`
    });
    
    // Partition the array and get the final position of the pivot
    const pivotPos = this.partition(array, low, high, pivotIdx, options);
    
    // Record partition completion
    this.recordState(array, {
      type: 'partition-complete',
      pivot: pivotPos,
      pivotValue: array[pivotPos],
      message: `Partition complete. Pivot value ${array[pivotPos]} is now at position ${pivotPos}`
    });
    
    // If pivot is at k, we found our element
    if (pivotPos === k) {
      return array[pivotPos];
    }
    
    // Recursively search in the appropriate partition
    if (pivotPos > k) {
      // The k-th element is in the left partition
      return this.quickSelect(array, low, pivotPos - 1, k, options);
    } else {
      // The k-th element is in the right partition
      return this.quickSelect(array, pivotPos + 1, high, k, options);
    }
  }
  
  /**
   * Deterministic median-of-medians selection algorithm
   * Guarantees O(n) worst-case time complexity
   * 
   * @param {Array} array - Array to search in
   * @param {number} low - Start index
   * @param {number} high - End index
   * @param {number} k - Index of element to find (0-based)
   * @param {Object} options - Runtime options
   * @returns {*} - The k-th element
   */
  medianOfMediansSelect(array, low, high, k, options) {
    const size = high - low + 1;
    
    // Base case: small array, use insertion sort
    if (size <= this.options.insertionThreshold) {
      this.insertionSort(array, low, high);
      return array[k];
    }
    
    // Record the current state
    this.recordState(array, {
      type: 'median-step',
      range: [low, high],
      target: k,
      message: `Using median-of-medians to find element at position ${k} in range [${low}...${high}]`
    });
    
    // Divide array into groups of 5 and find median of each group
    const numGroups = Math.ceil(size / 5);
    const medians = [];
    
    for (let i = 0; i < numGroups; i++) {
      const groupStart = low + i * 5;
      const groupEnd = Math.min(groupStart + 4, high);
      
      // Find median of this group
      this.insertionSort(array, groupStart, groupEnd);
      const medianIdx = groupStart + Math.floor((groupEnd - groupStart) / 2);
      medians.push(array[medianIdx]);
      
      // Record group median identification
      if (this.options.visualizePartitioning) {
        this.recordState(array, {
          type: 'group-median',
          group: [groupStart, groupEnd],
          median: medianIdx,
          medianValue: array[medianIdx],
          message: `Found median of group [${groupStart}...${groupEnd}]: ${array[medianIdx]}`
        });
      }
    }
    
    // Find the median of medians recursively
    const medianOfMedians = medians.length === 1 
      ? medians[0] 
      : this.medianOfMediansSelect(medians, 0, medians.length - 1, Math.floor(medians.length / 2), options);
    
    // Record median of medians
    this.recordState(array, {
      type: 'median-of-medians',
      medianValue: medianOfMedians,
      message: `Found median of medians: ${medianOfMedians}`
    });
    
    // Find the index of the median of medians in the original array
    let pivotIdx = low;
    for (let i = low; i <= high; i++) {
      if (array[i] === medianOfMedians) {
        pivotIdx = i;
        break;
      }
    }
    
    // Partition around the median of medians
    const pivotPos = this.partition(array, low, high, pivotIdx, options);
    
    // Record partition completion
    this.recordState(array, {
      type: 'partition-complete',
      pivot: pivotPos,
      pivotValue: array[pivotPos],
      message: `Partition complete. Pivot value ${array[pivotPos]} is now at position ${pivotPos}`
    });
    
    // If pivot is at k, we found our element
    if (pivotPos === k) {
      return array[pivotPos];
    }
    
    // Recursively search in the appropriate partition
    if (pivotPos > k) {
      // The k-th element is in the left partition
      return this.medianOfMediansSelect(array, low, pivotPos - 1, k, options);
    } else {
      // The k-th element is in the right partition
      return this.medianOfMediansSelect(array, pivotPos + 1, high, k, options);
    }
  }
  
  /**
   * Partition the array around a pivot
   * 
   * @param {Array} array - Array to partition
   * @param {number} low - Start index
   * @param {number} high - End index
   * @param {number} pivotIdx - Index of the pivot element
   * @param {Object} options - Runtime options
   * @returns {number} - Final position of the pivot
   */
  partition(array, low, high, pivotIdx, options) {
    // Move pivot to the end temporarily
    this.swap(array, pivotIdx, high);
    
    // Record pivot movement
    if (this.options.visualizePartitioning) {
      this.recordState(array, {
        type: 'pivot-move',
        from: pivotIdx,
        to: high,
        message: `Moving pivot from index ${pivotIdx} to ${high}`
      });
    }
    
    // Get pivot value
    const pivot = this.read(array, high);
    
    // Partition the array
    let i = low; // Position for elements less than pivot
    
    for (let j = low; j < high; j++) {
      // Compare current element with pivot
      if (this.compare(this.read(array, j), pivot) < 0) {
        // Element is less than pivot, move to left partition
        this.swap(array, i, j);
        
        // Record the swap for visualization
        if (this.options.visualizePartitioning) {
          this.recordState(array, {
            type: 'partition-swap',
            indices: [i, j],
            message: `Moving element ${array[i]} (< pivot) to left partition`
          });
        }
        
        i++;
      } else {
        // Element stays in right partition
        if (this.options.visualizePartitioning) {
          this.recordState(array, {
            type: 'partition-compare',
            index: j,
            message: `Element ${array[j]} ≥ pivot, stays in right partition`
          });
        }
      }
    }
    
    // Move pivot to its final position
    this.swap(array, i, high);
    
    // Record final pivot position
    this.recordState(array, {
      type: 'pivot-final',
      index: i,
      message: `Placed pivot ${array[i]} at its final position ${i}`
    });
    
    return i;
  }
  
  /**
   * Select a pivot index based on the specified strategy
   * 
   * @param {Array} array - The array
   * @param {number} low - Start index
   * @param {number} high - End index
   * @param {string} strategy - Pivot selection strategy
   * @returns {number} - Index of the selected pivot
   */
  selectPivot(array, low, high, strategy) {
    if (low === high) {
      return low;
    }
    
    switch (strategy) {
      case 'first':
        return low;
      
      case 'last':
        return high;
      
      case 'middle':
        return Math.floor((low + high) / 2);
      
      case 'random':
        return low + Math.floor(Math.random() * (high - low + 1));
      
      case 'median-of-three':
        // Select median of first, middle, and last elements
        const mid = Math.floor((low + high) / 2);
        
        // Find median directly
        if (this.compare(array[low], array[mid]) > 0) {
          if (this.compare(array[low], array[high]) <= 0) {
            return low;
          } else if (this.compare(array[mid], array[high]) > 0) {
            return mid;
          } else {
            return high;
          }
        } else {
          if (this.compare(array[mid], array[high]) <= 0) {
            return mid;
          } else if (this.compare(array[low], array[high]) > 0) {
            return low;
          } else {
            return high;
          }
        }
      
      default:
        console.warn(`Unknown pivot strategy: ${strategy}, using median-of-three`);
        return this.selectPivot(array, low, high, 'median-of-three');
    }
  }
  
  /**
   * Insertion sort for small subarrays
   * 
   * @param {Array} array - The array to sort
   * @param {number} low - Start index
   * @param {number} high - End index
   */
  insertionSort(array, low, high) {
    for (let i = low + 1; i <= high; i++) {
      const key = this.read(array, i);
      let j = i - 1;
      
      while (j >= low && this.compare(this.read(array, j), key) > 0) {
        this.write(array, j + 1, this.read(array, j));
        j--;
      }
      
      if (j + 1 !== i) {
        this.write(array, j + 1, key);
      }
    }
  }
  
  /**
   * Get the time and space complexity of Quick Select
   * 
   * @returns {Object} - Complexity information
   */
  getComplexity() {
    const worstTime = this.options.useMedianOfMedians ? 'O(n)' : 'O(n²)';
    
    return {
      time: {
        best: 'O(n)',
        average: 'O(n)',
        worst: worstTime
      },
      space: {
        best: 'O(log n)',
        average: 'O(log n)',
        worst: 'O(n)'
      }
    };
  }
  
  /**
   * Whether the algorithm is stable
   * 
   * @returns {boolean} - Always false as QuickSelect isn't stable
   */
  isStable() {
    return false;
  }
  
  /**
   * Whether the algorithm is in-place
   * 
   * @returns {boolean} - True as QuickSelect is in-place
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
    
    // Add QuickSelect specific information
    info.optimization = {
      pivotStrategy: this.options.pivotStrategy,
      useMedianOfMedians: this.options.useMedianOfMedians,
      insertionThreshold: this.options.insertionThreshold,
      visualizePartitioning: this.options.visualizePartitioning
    };
    
    info.properties = {
      selectionAlgorithm: true,
      inPlace: true,
      stable: false,
      deterministic: this.options.useMedianOfMedians
    };
    
    info.applications = [
      'Finding k-th smallest/largest element',
      'Computing medians and quantiles',
      'Order statistics',
      'Nearest neighbor search',
      'Data stream processing'
    ];
    
    info.variants = [
      'Basic Quick Select',
      'Median-of-Medians (BFPRT algorithm)',
      'Introselect (hybrid algorithm)',
      'Dual-pivot Quick Select'
    ];
    
    info.advantages = [
      'Average O(n) time complexity',
      'In-place algorithm with low memory usage',
      'Can be made deterministic with median-of-medians approach',
      'Efficient for finding order statistics',
      'Works well with virtual memory systems'
    ];
    
    info.disadvantages = [
      'Not stable (doesn\'t preserve relative order of equal elements)',
      'Basic version has O(n²) worst-case time complexity',
      'Median-of-medians variant has higher overhead',
      'Randomized version lacks guarantees for critical applications'
    ];
    
    return info;
  }
}

export default QuickSelect;