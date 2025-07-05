/**
 * tests/__fixtures__/predefined-arrays.js
 * 
 * A comprehensive collection of predefined arrays for testing sorting algorithms.
 * Each array is designed to test specific characteristics, edge cases, or known
 * challenging patterns for various sorting algorithms.
 * 
 * These fixtures enable consistent and reproducible testing across all algorithms,
 * allowing for precise comparative analysis of algorithm behavior and performance.
 * 
 * @module TestFixtures/PredefinedArrays
 * @author Advanced Algorithm Visualization Platform
 */

/**
 * Standard test arrays for basic algorithm validation
 * These arrays test common scenarios and patterns
 */
export const standardArrays = {
  /**
   * Random arrays of various sizes with uniform distribution
   * Designed to test average-case performance and general correctness
   */
  random: {
    /** Tiny random array for visual verification */
    tiny: [9, 3, 7, 1, 5],
    
    /** Small random array with uniform distribution */
    small: [42, 17, 9, 79, 24, 13, 68, 5, 53, 91],
    
    /** Medium random array with uniform distribution */
    medium: [
      42, 17, 9, 79, 24, 13, 68, 5, 53, 91, 
      61, 30, 16, 88, 72, 51, 28, 45, 33, 11, 
      39, 93, 84, 27, 80, 3, 19, 38, 50, 55
    ],
    
    /**
     * Array with seed 12345 to ensure repeatability
     * Generated using a seeded pseudo-random number generator
     */
    seeded: [
      47, 23, 81, 95, 6, 62, 37, 14, 35, 76,
      29, 83, 97, 8, 48, 22, 69, 41, 10, 92
    ]
  },
  
  /**
   * Sorted arrays for testing best-case performance
   * Algorithms like Insertion Sort perform best on already sorted arrays
   */
  sorted: {
    /** Tiny sorted array */
    tiny: [1, 2, 3, 4, 5],
    
    /** Small sorted array */
    small: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    
    /** Medium sorted array */
    medium: Array.from({ length: 30 }, (_, i) => i + 1),
    
    /** Sorted array with duplicates */
    withDuplicates: [1, 2, 2, 3, 3, 3, 4, 4, 5, 5, 5, 5]
  },
  
  /**
   * Reversed arrays for testing worst-case performance
   * Many algorithms like Insertion Sort and Bubble Sort perform worst on reversed arrays
   */
  reversed: {
    /** Tiny reversed array */
    tiny: [5, 4, 3, 2, 1],
    
    /** Small reversed array */
    small: [10, 9, 8, 7, 6, 5, 4, 3, 2, 1],
    
    /** Medium reversed array */
    medium: Array.from({ length: 30 }, (_, i) => 30 - i)
  },
  
  /**
   * Arrays with duplicates for testing stability and duplicate handling
   */
  duplicates: {
    /** Array with many duplicates */
    high: [3, 1, 4, 1, 5, 9, 2, 6, 5, 3, 5, 8, 9, 7, 9, 3, 2, 3, 8, 4],
    
    /** Array with few distinct values */
    binary: [1, 0, 1, 0, 0, 1, 1, 0, 1, 0, 1, 0, 0, 1, 0],
    
    /** Array with all elements the same */
    allSame: [42, 42, 42, 42, 42, 42, 42, 42, 42, 42]
  },
  
  /**
   * Nearly sorted arrays where elements are close to their sorted positions
   * Many practical datasets are nearly sorted, making this an important test case
   */
  nearlySorted: {
    /** Array with few elements out of place */
    small: [1, 2, 4, 3, 5, 6, 8, 7, 9, 10],
    
    /** Array with swapped pairs at regular intervals */
    swappedPairs: [2, 1, 4, 3, 6, 5, 8, 7, 10, 9, 12, 11],
    
    /** Array where each element is at most 3 positions from its sorted position */
    medium: [2, 1, 3, 6, 4, 5, 9, 7, 8, 12, 10, 11, 13, 15, 14, 16, 18, 17, 19, 20]
  }
};

/**
 * Edge case arrays for testing boundary conditions
 * These arrays test special cases that can cause errors in algorithms
 */
export const edgeCaseArrays = {
  /** Empty array */
  empty: [],
  
  /** Array with a single element */
  single: [42],
  
  /** Array with two elements in order */
  twoInOrder: [1, 2],
  
  /** Array with two elements in reverse order */
  twoReversed: [2, 1],
  
  /** Array with negative numbers */
  negative: [-5, -3, -9, -1, -7],
  
  /** Array mixing negative and positive numbers */
  mixedSigns: [-5, 3, -9, 1, -7, 8, -2, 6],
  
  /** Array with very large integers */
  largeNumbers: [1000000, 5000000, 3000000, 8000000, 2000000],
  
  /** Array with floating point numbers */
  floatingPoint: [3.14, 1.59, 2.65, 5.35, 8.97, 9.32],
  
  /** Array with very small differences between elements */
  smallDifferences: [1.0001, 1.0003, 1.0002, 1.0005, 1.0004],
  
  /** Array with maximum integer in JavaScript */
  maxIntegers: [Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER - 1, Number.MAX_SAFE_INTEGER - 2],
  
  /** Array with potential integer rounding issues */
  roundingIssues: [0.1 + 0.2, 0.3, 0.4 - 0.1, 0.5 - 0.2]
};

/**
 * Special pattern arrays that create interesting visualization patterns
 * or challenge specific algorithmic assumptions
 */
export const patternArrays = {
  /**
   * Sawtooth pattern arrays with repeating ascending sequences
   * These arrays test handling of repeating patterns
   */
  sawtooth: {
    /** Small sawtooth pattern: 1,2,3,1,2,3,1,2,3 */
    small: [1, 2, 3, 1, 2, 3, 1, 2, 3],
    
    /** Medium sawtooth pattern with higher teeth */
    medium: [10, 20, 30, 40, 10, 20, 30, 40, 10, 20, 30, 40]
  },
  
  /**
   * Plateau pattern arrays with flat regions
   * These arrays test handling of multiple constant regions
   */
  plateau: {
    /** Small plateau pattern: 1,1,1,5,5,5,9,9,9 */
    small: [1, 1, 1, 5, 5, 5, 9, 9, 9],
    
    /** Medium plateau pattern with multiple levels */
    medium: [2, 2, 2, 2, 5, 5, 5, 8, 8, 8, 8, 8, 12, 12, 15, 15, 15, 15]
  },
  
  /**
   * Staggered pattern arrays with alternating values
   * These arrays test handling of alternating sequential values
   */
  staggered: {
    /** Small staggered pattern: high, low alternating */
    small: [10, 1, 9, 2, 8, 3, 7, 4, 6, 5],
    
    /** Strictly alternating pattern */
    alternating: [1, 10, 2, 9, 3, 8, 4, 7, 5, 6]
  },
  
  /**
   * Pipe organ pattern arrays that ascend then descend
   * These arrays test bidirectional patterns
   */
  pipeOrgan: {
    /** Small pipe organ pattern: 1,2,3,4,5,4,3,2,1 */
    small: [1, 2, 3, 4, 5, 4, 3, 2, 1],
    
    /** Medium pipe organ pattern */
    medium: [1, 3, 5, 7, 9, 11, 13, 15, 13, 11, 9, 7, 5, 3, 1]
  },
  
  /**
   * Arrays with outliers (extremely high or low values)
   * These arrays test handling of outliers and asymmetric distributions
   */
  outliers: {
    /** Array with high outliers */
    high: [5, 8, 12, 15, 18, 100, 6, 9, 13, 16],
    
    /** Array with low outliers */
    low: [100, 97, 94, 1, 98, 95, 92, 2, 99, 96, 93]
  }
};

/**
 * Algorithm-specific challenge arrays
 * Each array is designed to challenge specific algorithms
 */
export const algorithmChallengeArrays = {
  /**
   * Arrays challenging for QuickSort
   * These arrays test various pathological cases for different pivot strategies
   */
  quickSort: {
    /** Challenges first-element pivot strategy - already sorted array */
    firstPivotWorst: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    
    /** Challenges last-element pivot strategy - reversed array */
    lastPivotWorst: [10, 9, 8, 7, 6, 5, 4, 3, 2, 1],
    
    /** Challenges median-of-three pivot strategy */
    medianPivotChallenge: [10, 1, 9, 2, 8, 3, 7, 4, 6, 5],
    
    /** Challenges quicksort with many duplicates */
    manyDuplicates: [3, 3, 3, 3, 3, 1, 1, 1, 2, 2, 3, 3, 1, 2, 3, 1, 2]
  },
  
  /**
   * Arrays challenging for MergeSort
   * Although MergeSort is generally O(n log n), certain patterns can be suboptimal
   */
  mergeSort: {
    /** Pattern requiring maximum number of comparisons during merge */
    maxComparisons: [2, 4, 6, 8, 10, 1, 3, 5, 7, 9],
    
    /** Already sorted sections that need merging */
    blockMerge: [1, 3, 5, 7, 9, 2, 4, 6, 8, 10, 12, 14]
  },
  
  /**
   * Arrays challenging for HeapSort
   * These arrays exercise specific aspects of heap construction and extraction
   */
  heapSort: {
    /** Pattern maximizing the number of sift-down operations */
    maxSiftDown: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].reverse(),
    
    /** Pattern for testing heap property maintenance */
    heapPropertyTest: [5, 13, 2, 25, 7, 17, 20, 8, 4]
  },
  
  /**
   * Arrays challenging for RadixSort
   * These arrays test handling of different digit patterns
   */
  radixSort: {
    /** Numbers with varying digit counts */
    mixedLength: [1, 10, 100, 1000, 2, 20, 200, 2000, 3, 30, 300],
    
    /** Numbers requiring handling of leading zeros */
    leadingZeros: [1, 10, 100, 1000, 10000, 100000]
  },
  
  /**
   * Arrays challenging for BucketSort
   * These arrays test handling of different distributions
   */
  bucketSort: {
    /** Clustered values that may fall into the same bucket */
    clustered: [0.1, 0.11, 0.12, 0.5, 0.51, 0.52, 0.9, 0.91, 0.92],
    
    /** Non-uniform distribution that challenges bucket allocation */
    nonUniform: [0.1, 0.2, 0.2, 0.2, 0.1, 0.9, 0.9, 0.9, 0.8, 0.8]
  }
};

/**
 * Arrays with specific statistical properties
 * These arrays test handling of different distributions and statistical patterns
 */
export const statisticalArrays = {
  /**
   * Gaussian (normal) distribution approximation
   * Each value is approximately normally distributed with mean 50 and stddev 15
   * Generated using Box-Muller transform
   */
  gaussian: [
    44, 67, 53, 38, 51, 46, 55, 38, 73, 29,
    65, 50, 42, 46, 55, 31, 47, 66, 69, 34
  ],
  
  /**
   * Exponential distribution approximation
   * Each value follows an approximate exponential distribution with lambda = 0.1
   * Generated using the inverse transform method
   */
  exponential: [
    2, 15, 3, 25, 19, 5, 8, 42, 27, 1,
    32, 10, 14, 6, 37, 9, 22, 29, 45, 11
  ],
  
  /**
   * Bimodal distribution approximation
   * Values cluster around two distinct modes (peaks)
   */
  bimodal: [
    12, 15, 13, 10, 18, 14, 11, 16, 12, 15,
    45, 42, 48, 38, 44, 47, 41, 39, 46, 43
  ],
  
  /**
   * Uniform distribution with values evenly distributed across the range
   */
  uniform: [
    5, 15, 25, 35, 45, 55, 65, 75, 85, 95,
    10, 20, 30, 40, 50, 60, 70, 80, 90, 100
  ],
  
  /**
   * Long-tail distribution with majority of values concentrated at the low end
   * and a few high outliers
   */
  longTail: [
    2, 3, 5, 7, 8, 10, 12, 14, 16, 18,
    22, 27, 35, 42, 56, 78, 103, 156, 214, 357
  ],
  
  /**
   * Zipfian distribution approximation, where the frequency of an element
   * is inversely proportional to its rank
   */
  zipfian: [
    1, 1, 1, 1, 1, 1, 1, 2, 2, 2,
    2, 3, 3, 3, 4, 4, 5, 6, 7, 10
  ]
};

/**
 * Arrays of various sizes for performance testing
 * These arrays test algorithm scaling with input size
 */
export const performanceTestArrays = {
  /**
   * Random arrays of increasing size for performance scaling tests
   * These are deliberately kept small for unit testing, larger arrays
   * should be generated dynamically for actual performance testing
   */
  scaling: {
    /** 10 elements */
    tiny: Array.from({ length: 10 }, () => Math.floor(Math.random() * 100)),
    
    /** 100 elements */
    small: Array.from({ length: 100 }, () => Math.floor(Math.random() * 1000)),
    
    /** 1,000 elements */
    medium: Array.from({ length: 1000 }, () => Math.floor(Math.random() * 10000)),
    
    /** 
     * Reference to larger arrays - not actually stored in this file
     * For actual testing, these should be generated on demand
     */
    large: "10,000 elements - generate dynamically",
    xLarge: "100,000 elements - generate dynamically",
    huge: "1,000,000 elements - generate dynamically"
  },
  
  /**
   * Arrays for testing specific algorithmic complexity behaviors
   * Used to verify that algorithms meet their theoretical time complexity
   */
  complexityValidation: {
    /** Tests O(n) best-case for adaptive sorts like insertion sort */
    bestCase: Array.from({ length: 100 }, (_, i) => i),
    
    /** Tests O(n²) worst-case for comparison sorts like bubble sort */
    worstCase: Array.from({ length: 100 }, (_, i) => 100 - i),
    
    /** Tests O(n log n) average case for efficient sorts */
    averageCase: Array.from({ length: 100 }, () => Math.floor(Math.random() * 1000))
  }
};

/**
 * Arrays with custom objects for testing stability and comparator functions
 * These arrays test sorting with custom objects and value extraction
 */
export const customObjectArrays = {
  /**
   * Array of objects with multiple fields
   * Useful for testing stable sorts and custom comparators
   */
  people: [
    { id: 3, name: "Alice", age: 25, weight: 130 },
    { id: 1, name: "Bob", age: 32, weight: 180 },
    { id: 7, name: "Charlie", age: 25, weight: 160 },
    { id: 4, name: "Diana", age: 28, weight: 140 },
    { id: 2, name: "Eve", age: 32, weight: 135 },
    { id: 8, name: "Frank", age: 28, weight: 175 },
    { id: 5, name: "Grace", age: 32, weight: 150 },
    { id: 6, name: "Heidi", age: 25, weight: 145 }
  ],
  
  /**
   * Array of objects with the same key value but different original positions
   * Specifically designed for testing sort stability
   */
  stability: [
    { key: 5, originalIndex: 0, value: "a" },
    { key: 3, originalIndex: 1, value: "b" },
    { key: 5, originalIndex: 2, value: "c" },
    { key: 1, originalIndex: 3, value: "d" },
    { key: 3, originalIndex: 4, value: "e" },
    { key: 1, originalIndex: 5, value: "f" },
    { key: 5, originalIndex: 6, value: "g" },
    { key: 1, originalIndex: 7, value: "h" },
    { key: 3, originalIndex: 8, value: "i" }
  ],
  
  /**
   * Array with objects containing nested properties
   * Tests handling of complex object structures and deep property access
   */
  nested: [
    { id: 1, details: { category: "A", priority: 3 }, values: [5, 2, 8] },
    { id: 2, details: { category: "B", priority: 1 }, values: [3, 7, 4] },
    { id: 3, details: { category: "A", priority: 2 }, values: [9, 1, 6] },
    { id: 4, details: { category: "C", priority: 1 }, values: [2, 6, 3] },
    { id: 5, details: { category: "B", priority: 3 }, values: [7, 3, 9] },
    { id: 6, details: { category: "C", priority: 2 }, values: [1, 8, 5] }
  ]
};

/**
 * Verification functions to check if arrays meet specific criteria
 * These functions are useful for validating the test arrays themselves
 */
export const verificationFunctions = {
  /**
   * Check if an array is sorted in ascending order
   * 
   * @param {Array} array - The array to check
   * @param {Function} [comparator] - Optional custom comparator
   * @returns {boolean} True if the array is sorted
   */
  isSorted: (array, comparator = (a, b) => a - b) => {
    if (array.length <= 1) return true;
    
    for (let i = 1; i < array.length; i++) {
      if (comparator(array[i-1], array[i]) > 0) {
        return false;
      }
    }
    
    return true;
  },
  
  /**
   * Check if an array contains the same elements as the original
   * Useful for verifying that a sort doesn't lose or add elements
   * 
   * @param {Array} original - The original array
   * @param {Array} sorted - The sorted array
   * @returns {boolean} True if arrays contain the same elements
   */
  hasSameElements: (original, sorted) => {
    if (original.length !== sorted.length) return false;
    
    const countMap = new Map();
    
    // Count elements in original array
    for (const item of original) {
      countMap.set(item, (countMap.get(item) || 0) + 1);
    }
    
    // Subtract counts for sorted array
    for (const item of sorted) {
      const count = countMap.get(item);
      if (count === undefined || count === 0) return false;
      countMap.set(item, count - 1);
    }
    
    // Check that all counts are zero
    for (const count of countMap.values()) {
      if (count !== 0) return false;
    }
    
    return true;
  },
  
  /**
   * Check if a sort is stable by comparing object original positions
   * 
   * @param {Array} original - The original array of objects with originalIndex
   * @param {Array} sorted - The sorted array
   * @returns {boolean} True if the sort maintained stability
   */
  isStable: (original, sorted) => {
    // Check same-key elements maintain relative order
    for (let i = 0; i < sorted.length - 1; i++) {
      for (let j = i + 1; j < sorted.length; j++) {
        // If keys are equal, original indices should maintain order
        if (sorted[i].key === sorted[j].key && 
            sorted[i].originalIndex > sorted[j].originalIndex) {
          return false;
        }
      }
    }
    return true;
  }
};

/**
 * Exports a combined set of all arrays for convenience
 */
export default {
  standard: standardArrays,
  edgeCases: edgeCaseArrays,
  patterns: patternArrays,
  algorithmChallenges: algorithmChallengeArrays,
  statistical: statisticalArrays,
  performance: performanceTestArrays,
  customObjects: customObjectArrays,
  verify: verificationFunctions
};