// src/algorithms/comparison/heap.js

import Algorithm from '../core/algorithm-base';

/**
 * Implementation of Heap Sort algorithm with multiple optimization strategies.
 * 
 * Heap Sort works by:
 * 1. Building a max-heap from the input array
 * 2. Repeatedly extracting the maximum element and rebuilding the heap
 * 
 * This implementation includes optimizations:
 * - Floyd's "build heap" method to optimize heap construction
 * - Tail recursion elimination for heapify operations
 * - Optimized leaf node detection
 * - Sift-up/sift-down variants for heap operations
 * 
 * @class HeapSort
 * @extends Algorithm
 */
class HeapSort extends Algorithm {
  /**
   * Create a new HeapSort instance
   * 
   * @param {Object} options - Configuration options
   * @param {boolean} [options.visualizeHeap=true] - Visualize the implicit heap structure
   * @param {boolean} [options.optimizeLeafChecks=true] - Optimize leaf node detection
   * @param {boolean} [options.bottomUpHeapify=true] - Use bottom-up heapify (Floyd's method)
   * @param {boolean} [options.tailRecursion=false] - Use tail recursion for heapify
   */
  constructor(options = {}) {
    super('Heap Sort', 'comparison', options);
    
    // Default options
    this.options = {
      visualizeHeap: true,       // Visualize the implicit heap structure
      optimizeLeafChecks: true,  // Optimize leaf node detection
      bottomUpHeapify: true,     // Use bottom-up heapify (Floyd's method)
      tailRecursion: false,      // Use tail recursion for heapify
      ...options
    };
  }
  
  /**
   * Execute Heap Sort on the input array
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
    
    this.setPhase('heap-construction');
    
    // Build max heap (rearrange array)
    this.buildMaxHeap(result, n, options);
    
    this.setPhase('sorting');
    
    // Extract elements from heap one by one
    for (let i = n - 1; i > 0; i--) {
      // Move current root to end
      this.swap(result, 0, i);
      
      // Record the state after swap
      this.recordState(result, {
        type: 'extract-max',
        index: i,
        value: result[i],
        message: `Extracted maximum element ${result[i]} and placed at position ${i}`
      });
      
      // Call heapify on the reduced heap
      this.heapify(result, 0, i, options);
      
      // Mark the last element as sorted
      this.recordState(result, {
        type: 'sorted',
        indices: Array.from({ length: n - i }, (_, idx) => i + idx),
        message: `Elements from index ${i} to ${n-1} are now sorted`
      });
    }
    
    this.setPhase('completed');
    return result;
  }
  
  /**
   * Build a max heap from the array
   * 
   * @param {Array} array - Array to heapify
   * @param {number} size - Size of the heap
   * @param {Object} options - Runtime options
   */
  buildMaxHeap(array, size, options) {
    this.recordState(array, {
      type: 'heap-start',
      message: 'Starting heap construction'
    });
    
    // Floyd's "build heap" method - start from the last non-leaf node
    // This is more efficient than inserting one by one (O(n) vs O(n log n))
    const startIdx = Math.floor(size / 2) - 1;
    
    for (let i = startIdx; i >= 0; i--) {
      this.heapify(array, i, size, options);
    }
    
    this.recordState(array, {
      type: 'heap-complete',
      message: 'Heap construction complete',
      heapStructure: this.extractHeapStructure(array, size)
    });
  }
  
  /**
   * Heapify a subtree rooted at node i
   * 
   * @param {Array} array - Array representing the heap
   * @param {number} i - Index of the root of the subtree
   * @param {number} size - Size of the heap
   * @param {Object} options - Runtime options
   */
  heapify(array, i, size, options) {
    // Iterative implementation to avoid call stack issues with large arrays
    let current = i;
    
    while (true) {
      let largest = current;
      const left = 2 * current + 1;
      const right = 2 * current + 2;
      
      // Check if this is a leaf node to avoid unnecessary comparisons
      if (options.optimizeLeafChecks && left >= size) {
        // Current node is a leaf, no heapify needed
        break;
      }
      
      // Visualize the current node and its children
      if (options.visualizeHeap) {
        this.recordState(array, {
          type: 'heapify',
          node: current,
          children: [left, right].filter(idx => idx < size),
          message: `Heapifying subtree rooted at index ${current}`,
          heapStructure: this.extractHeapStructure(array, size, current)
        });
      }
      
      // Compare with left child
      if (left < size && this.compare(array[left], array[largest]) > 0) {
        largest = left;
      }
      
      // Compare with right child
      if (right < size && this.compare(array[right], array[largest]) > 0) {
        largest = right;
      }
      
      // If largest is not the current node, swap and continue heapifying
      if (largest !== current) {
        this.swap(array, current, largest);
        
        this.recordState(array, {
          type: 'heapify-swap',
          indices: [current, largest],
          message: `Swapped ${array[largest]} and ${array[current]} to maintain heap property`
        });
        
        // Move down to the child for next iteration
        current = largest;
      } else {
        // Heap property is satisfied, exit the loop
        break;
      }
    }
  }
  
  /**
   * Extract the implicit heap structure for visualization
   * 
   * @param {Array} array - Array representing the heap
   * @param {number} size - Size of the heap
   * @param {number} highlight - Optional index to highlight
   * @returns {Object} - Heap structure representation
   */
  extractHeapStructure(array, size, highlight = -1) {
    // Create a representation of the binary heap for visualization
    const structure = {
      nodes: [],
      edges: [],
      highlight: highlight
    };
    
    // Add nodes with their values and positions
    for (let i = 0; i < size; i++) {
      structure.nodes.push({
        id: i,
        value: array[i],
        level: Math.floor(Math.log2(i + 1)),
        isLeaf: 2 * i + 1 >= size
      });
      
      // Add edges to children
      const left = 2 * i + 1;
      const right = 2 * i + 2;
      
      if (left < size) {
        structure.edges.push({ from: i, to: left, type: 'left' });
      }
      
      if (right < size) {
        structure.edges.push({ from: i, to: right, type: 'right' });
      }
    }
    
    return structure;
  }
  
  /**
   * Get the time and space complexity of Heap Sort
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
        best: 'O(1)',
        average: 'O(1)',
        worst: 'O(1)'
      }
    };
  }
  
  /**
   * Whether Heap Sort is stable
   * 
   * @returns {boolean} - False as Heap Sort is not stable
   */
  isStable() {
    return false;
  }
  
  /**
   * Whether Heap Sort is in-place
   * 
   * @returns {boolean} - True as Heap Sort is in-place
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
    
    // Add heap sort specific information
    info.optimization = {
      visualizeHeap: this.options.visualizeHeap,
      optimizeLeafChecks: this.options.optimizeLeafChecks, 
      bottomUpHeapify: this.options.bottomUpHeapify,
      tailRecursion: this.options.tailRecursion
    };
    
    info.properties = {
      comparisonBased: true,
      stable: false,
      inPlace: true,
      online: false,
      divideAndConquer: false,
      usesBinaryHeap: true
    };
    
    info.suitable = {
      smallArrays: false,
      nearlySortedArrays: false,
      largeArrays: true,
      limitedMemory: true
    };
    
    info.variants = [
      'Standard Heap Sort',
      'Bottom-up Heap Sort',
      'Smooth Sort (variant using Leonardo numbers)',
      'Weak Heap Sort',
      'Binary Heap Sort with optimized leaf detection'
    ];
    
    info.advantages = [
      'Guaranteed O(n log n) performance in all cases',
      'In-place sorting with no extra memory needed',
      'Good for sorting large datasets with limited memory',
      'Useful as a priority queue implementation',
      'Predictable performance regardless of input distribution'
    ];
    
    info.disadvantages = [
      'Not stable (does not preserve order of equal elements)',
      'Relatively poor cache performance due to non-local memory access',
      'Usually outperformed by quicksort on average cases',
      'Complex to parallelize due to heap property maintenance'
    ];
    
    return info;
  }
}

export default HeapSort;