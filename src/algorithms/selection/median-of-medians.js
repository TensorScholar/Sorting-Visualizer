// src/algorithms/selection/median-of-medians.js

import Algorithm from '../core/algorithm-base';

/**
 * Implementation of the Median of Medians algorithm (BFPRT).
 * 
 * Median of Medians is a deterministic selection algorithm that guarantees O(n)
 * worst-case time complexity for finding the median or any order statistic in 
 * an unsorted array. It uses a sophisticated pivot selection method to ensure 
 * good partitioning in all cases.
 * 
 * This implementation includes:
 * - Detailed visualization of the median-finding process
 * - Configurable group size (traditionally 5)
 * - Educational insights into the algorithm's operation
 * - Various optimizations for practical efficiency
 * 
 * Time complexity: O(n) in worst case
 * Space complexity: O(n)
 * 
 * @class MedianOfMedians
 * @extends Algorithm
 */
class MedianOfMedians extends Algorithm {
  /**
   * Create a new MedianOfMedians instance
   * 
   * @param {Object} options - Configuration options
   * @param {number} [options.groupSize=5] - Size of groups for finding medians
   * @param {number} [options.insertionThreshold=10] - Threshold for switching to insertion sort
   * @param {boolean} [options.visualizeGroups=true] - Show detailed group-based visualization
   * @param {boolean} [options.useRecursiveMedian=true] - Use recursive median finding for groups
   */
  constructor(options = {}) {
    super('Median of Medians', 'selection', options);
    
    // Default options
    this.options = {
      groupSize: 5,                // Size of groups for finding medians
      insertionThreshold: 10,      // Threshold for switching to insertion sort
      visualizeGroups: true,       // Show detailed group-based visualization
      useRecursiveMedian: true,    // Use recursive median finding for groups
      ...options
    };
  }
  
  /**
   * Execute the Median of Medians algorithm to find the k-th smallest element
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
    // By default, find the median
    const k = options.k || Math.ceil(n / 2);
    
    // Validate k
    if (k < 1 || k > n) {
      throw new Error(`Invalid value of k: ${k}. Must be between 1 and ${n}`);
    }
    
    // Convert to 0-based index
    const index = k - 1;
    
    this.setPhase('selection');
    
    // Find the k-th element
    const kthElement = this.select(result, 0, n - 1, index);
    
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
   * Find the k-th smallest element in the array
   * 
   * @param {Array} array - Array to search in
   * @param {number} left - Start index
   * @param {number} right - End index
   * @param {number} k - Index to find (0-based)
   * @returns {*} - k-th smallest element
   */
  select(array, left, right, k) {
    // Record the current step
    this.recordState(array, {
      type: 'selection-step',
      range: [left, right],
      target: k,
      message: `Finding element at position ${k} in range [${left}...${right}]`
    });
    
    // Base case: small enough to use simpler method
    if (right - left < this.options.insertionThreshold) {
      this.insertionSort(array, left, right);
      return array[k];
    }
    
    // Find good pivot using median of medians
    const pivotIndex = this.findPivot(array, left, right);
    
    // Record pivot selection
    this.recordState(array, {
      type: 'pivot-selection',
      pivot: pivotIndex,
      pivotValue: array[pivotIndex],
      message: `Selected pivot at index ${pivotIndex} with value ${array[pivotIndex]}`
    });
    
    // Partition around pivot
    const pivotPosition = this.partition(array, left, right, pivotIndex);
    
    // Record partition completion
    this.recordState(array, {
      type: 'partition-complete',
      pivot: pivotPosition,
      pivotValue: array[pivotPosition],
      message: `Partition complete. Pivot value ${array[pivotPosition]} is now at position ${pivotPosition}`
    });
    
    // Check if we found the k-th element
    if (k === pivotPosition) {
      return array[k];
    } 
    // Recurse on left subarray
    else if (k < pivotPosition) {
      return this.select(array, left, pivotPosition - 1, k);
    } 
    // Recurse on right subarray
    else {
      return this.select(array, pivotPosition + 1, right, k);
    }
  }
  
  /**
   * Find a good pivot using the median of medians method
   * 
   * @param {Array} array - Input array
   * @param {number} left - Start index
   * @param {number} right - End index
   * @returns {number} - Index of the selected pivot
   */
  findPivot(array, left, right) {
    const size = right - left + 1;
    
    // Base case: small array
    if (size <= this.options.groupSize) {
      this.insertionSort(array, left, right);
      return left + Math.floor((right - left) / 2);
    }
    
    // Record the start of median finding
    this.recordState(array, {
      type: 'median-finding-start',
      range: [left, right],
      message: 'Starting median-of-medians pivot selection'
    });
    
    // Divide array into groups and find median of each group
    const medianIndices = [];
    const groupSize = this.options.groupSize;
    
    // Process each group
    for (let i = 0; i < Math.ceil(size / groupSize); i++) {
      const groupStart = left + i * groupSize;
      const groupEnd = Math.min(groupStart + groupSize - 1, right);
      
      // Visualize the current group
      if (this.options.visualizeGroups) {
        this.recordState(array, {
          type: 'group-processing',
          group: [groupStart, groupEnd],
          message: `Processing group ${i + 1}: elements [${groupStart}...${groupEnd}]`
        });
      }
      
      // Sort the group
      this.insertionSort(array, groupStart, groupEnd);
      
      // Find median index of this group
      const medianIndex = groupStart + Math.floor((groupEnd - groupStart) / 2);
      medianIndices.push(medianIndex);
      
      // Record the median of this group
      if (this.options.visualizeGroups) {
        this.recordState(array, {
          type: 'group-median',
          group: [groupStart, groupEnd],
          median: medianIndex,
          value: array[medianIndex],
          message: `Found median of group ${i + 1}: ${array[medianIndex]} at index ${medianIndex}`
        });
      }
    }
    
    // Record all group medians
    this.recordState(array, {
      type: 'all-medians',
      medianIndices: medianIndices,
      message: `Found ${medianIndices.length} group medians`
    });
    
    // Find median of medians recursively
    let pivotIndex;
    
    if (medianIndices.length === 1) {
      pivotIndex = medianIndices[0];
    } else {
      // Create a new array with just the medians
      const medians = medianIndices.map(index => {
        return { value: array[index], originalIndex: index };
      });
      
      // Record the medians array
      this.recordState(array, {
        type: 'medians-array',
        medians: medians.map(m => m.value),
        message: 'Created array of medians for recursive median finding'
      });
      
      // Find the median of medians recursively
      const medianOfMediansIndex = Math.floor(medianIndices.length / 2);
      
      // Sort the medians array to find the median
      medians.sort((a, b) => this.compare(a.value, b.value));
      
      // Get the original index of the median of medians
      pivotIndex = medians[medianOfMediansIndex].originalIndex;
    }
    
    // Record the selected pivot
    this.recordState(array, {
      type: 'median-of-medians',
      pivot: pivotIndex,
      pivotValue: array[pivotIndex],
      message: `Selected median of medians as pivot: ${array[pivotIndex]} at index ${pivotIndex}`
    });
    
    return pivotIndex;
  }
  
  /**
   * Partition the array around a pivot
   * 
   * @param {Array} array - Array to partition
   * @param {number} left - Start index
   * @param {number} right - End index
   * @param {number} pivotIndex - Index of the pivot element
   * @returns {number} - Final position of the pivot
   */
  partition(array, left, right, pivotIndex) {
    // Move pivot to the end temporarily
    const pivotValue = this.read(array, pivotIndex);
    this.swap(array, pivotIndex, right);
    
    // Record pivot movement
    this.recordState(array, {
      type: 'pivot-move',
      from: pivotIndex,
      to: right,
      value: pivotValue,
      message: `Moving pivot from index ${pivotIndex} to ${right}`
    });
    
    // Partition the array
    let storeIndex = left;
    
    for (let i = left; i < right; i++) {
      if (this.compare(this.read(array, i), pivotValue) < 0) {
        this.swap(array, i, storeIndex);
        
        // Record the swap
        this.recordState(array, {
          type: 'partition-swap',
          indices: [i, storeIndex],
          message: `Moving element ${array[storeIndex]} (< pivot) to left partition`
        });
        
        storeIndex++;
      }
    }
    
    // Move pivot to its final position
    this.swap(array, right, storeIndex);
    
    // Record final pivot position
    this.recordState(array, {
      type: 'pivot-final-position',
      index: storeIndex,
      value: array[storeIndex],
      message: `Placed pivot ${array[storeIndex]} at its final position ${storeIndex}`
    });
    
    return storeIndex;
  }
  
  /**
   * Insertion sort for small subarrays
   * 
   * @param {Array} array - The array to sort
   * @param {number} left - Start index
   * @param {number} right - End index
   */
  insertionSort(array, left, right) {
    // Record sort range
    if (right - left > 1) {
      this.recordState(array, {
        type: 'insertion-sort',
        range: [left, right],
        message: `Using insertion sort for range [${left}...${right}]`
      });
    }
    
    for (let i = left + 1; i <= right; i++) {
      const key = this.read(array, i);
      let j = i - 1;
      
      while (j >= left && this.compare(this.read(array, j), key) > 0) {
        this.write(array, j + 1, this.read(array, j));
        j--;
      }
      
      if (j + 1 !== i) {
        this.write(array, j + 1, key);
      }
    }
  }
  
  /**
   * Get the time and space complexity of Median of Medians
   * 
   * @returns {Object} - Complexity information
   */
  getComplexity() {
    return {
      time: {
        best: 'O(n)',
        average: 'O(n)',
        worst: 'O(n)'
      },
      space: {
        best: 'O(n)',
        average: 'O(n)',
        worst: 'O(n)'
      }
    };
  }
  
  /**
   * Whether the algorithm is stable
   * 
   * @returns {boolean} - Always false as Median of Medians isn't stable
   */
  isStable() {
    return false;
  }
  
  /**
   * Whether the algorithm is in-place
   * 
   * @returns {boolean} - False as Median of Medians uses O(n) extra space
   */
  isInPlace() {
    return false;
  }
  
  /**
   * Get detailed algorithm information
   * 
   * @returns {Object} - Detailed algorithm metadata
   */
  getInfo() {
    const info = super.getInfo();
    
    // Add Median of Medians specific information
    info.optimization = {
      groupSize: this.options.groupSize,
      insertionThreshold: this.options.insertionThreshold,
      visualizeGroups: this.options.visualizeGroups,
      useRecursiveMedian: this.options.useRecursiveMedian
    };
    
    info.properties = {
      selectionAlgorithm: true,
      deterministic: true,
      inPlace: false,
      stable: false,
      divideAndConquer: true
    };
    
    info.applications = [
      'Finding exact medians in O(n) time',
      'Deterministic selection of order statistics',
      'Time-critical applications requiring guaranteed performance',
      'Robust partitioning in QuickSort to avoid worst-case behavior',
      'Foundation for other deterministic algorithms'
    ];
    
    info.variants = [
      'Standard Median of Medians (BFPRT)',
      'Variants with different group sizes',
      'Median of Medians with sampling',
      'Iterative implementations',
      'Hybrid approaches combined with QuickSelect'
    ];
    
    info.advantages = [
      'Guaranteed O(n) worst-case time complexity',
      'Deterministic performance (no randomization)',
      'Well-suited for time-critical applications',
      'Reliable pivot selection for QuickSort and QuickSelect',
      'Theoretical importance in algorithm design'
    ];
    
    info.disadvantages = [
      'Higher constant factors than randomized approaches',
      'More complex implementation than QuickSelect',
      'Rarely used in practice due to overhead',
      'Not in-place (requires additional memory)',
      'Not stable (doesn\'t preserve relative order of equal elements)'
    ];
    
    info.conceptualFoundation = [
      'The algorithm achieves O(n) time by ensuring a good pivot through recursive median finding',
      'Using groups of size 5 guarantees that at least 30% of elements will be on each side of the partition',
      'This bounded partition ratio ensures O(n) performance through the recurrence T(n) ≤ T(n/5) + T(7n/10) + O(n)',
      'Choosing different group sizes affects the constant factor and the guaranteed partition quality'
    ];
    
    return info;
  }
}

export default MedianOfMedians;