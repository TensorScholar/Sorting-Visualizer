// src/algorithms/distribution/bucket.js

import Algorithm from '../core/algorithm-base';

/**
 * Implementation of Bucket Sort with adaptive bucket sizing and multiple bucket variants.
 * 
 * Bucket Sort is a distribution sort algorithm that:
 * 1. Distributes elements into a number of buckets based on their values
 * 2. Sorts each bucket individually (using another sorting algorithm)
 * 3. Concatenates the sorted buckets to produce the final sorted array
 * 
 * Time Complexity:
 * - Best:    O(n + k) when elements uniformly distributed and insertion sort on small buckets
 * - Average: O(n + k) when elements uniformly distributed
 * - Worst:   O(n²) when all elements fall into one bucket
 * 
 * Space Complexity: O(n + k) where k is the number of buckets
 * 
 * @class BucketSort
 * @extends Algorithm
 */
class BucketSort extends Algorithm {
  /**
   * Create a new BucketSort instance
   * 
   * @param {Object} options - Configuration options
   * @param {number} [options.bucketCount=10] - Number of buckets to use
   * @param {string} [options.bucketSizing='adaptive'] - Bucket sizing strategy ('uniform', 'adaptive', 'sqrt')
   * @param {string} [options.bucketSort='insertion'] - Algorithm to sort individual buckets
   * @param {boolean} [options.optimizeSingleton=true] - Skip sorting for buckets with 0-1 elements
   * @param {boolean} [options.detectUniformity=true] - Detect and optimize for uniform distributions
   */
  constructor(options = {}) {
    super('Bucket Sort', 'distribution', options);
    
    // Default options
    this.options = {
      bucketCount: 10,               // Number of buckets to use
      bucketSizing: 'adaptive',      // 'uniform', 'adaptive', or 'sqrt'
      bucketSort: 'insertion',       // Algorithm to sort individual buckets
      optimizeSingleton: true,       // Skip sorting for buckets with 0-1 elements
      detectUniformity: true,        // Detect and optimize for uniform distributions
      ...options
    };
  }
  
  /**
   * Execute Bucket Sort on the input array
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
    
    this.setPhase('analysis');
    
    // Analyze the array
    const analysis = this.analyzeArray(result);
    const { min, max, range, isInteger, hasNegative } = analysis;
    
    // Record the analysis
    this.recordState(result, {
      type: 'array-analysis',
      analysis,
      message: `Analyzed array: range [${min} to ${max}], ${isInteger ? 'integer' : 'float'} values, negative numbers: ${hasNegative}`
    });
    
    // Handle negative numbers if present
    if (hasNegative) {
      return this.handleNegativeNumbers(result, analysis, options);
    }
    
    // Determine optimal bucket count
    const bucketCount = this.determineBucketCount(n, range, options);
    
    this.recordState(result, {
      type: 'bucket-setup',
      bucketCount,
      message: `Using ${bucketCount} buckets with ${options.bucketSizing} sizing strategy`
    });
    
    this.setPhase('distribution');
    
    // Create buckets
    const buckets = Array.from({ length: bucketCount }, () => []);
    
    // Distribute elements into buckets
    for (let i = 0; i < n; i++) {
      const value = this.read(result, i);
      const bucketIndex = this.getBucketIndex(value, min, max, bucketCount);
      
      buckets[bucketIndex].push(value);
      
      // Record significant distribution steps
      if (i % Math.max(1, Math.floor(n / 20)) === 0 || i === n - 1) {
        this.recordState(result, {
          type: 'element-distribution',
          index: i,
          value,
          bucketIndex,
          message: `Placed element ${value} into bucket ${bucketIndex}`
        });
      }
    }
    
    // Record bucket distribution
    const bucketSizes = buckets.map(b => b.length);
    this.recordState(result, {
      type: 'buckets-filled',
      buckets: buckets.map(b => [...b]),
      bucketSizes,
      message: `Distributed elements into buckets: [${bucketSizes.join(', ')}]`
    });
    
    this.setPhase('bucket-sorting');
    
    // Sort individual buckets
    for (let i = 0; i < bucketCount; i++) {
      const bucket = buckets[i];
      
      // Skip empty buckets or singleton buckets if optimization enabled
      if (bucket.length <= (options.optimizeSingleton ? 1 : 0)) {
        if (bucket.length === 1) {
          this.recordState(result, {
            type: 'singleton-optimization',
            bucketIndex: i,
            message: `Skipped sorting bucket ${i} with single element`
          });
        }
        continue;
      }
      
      this.recordState(result, {
        type: 'bucket-sort-start',
        bucketIndex: i,
        bucketSize: bucket.length,
        message: `Sorting bucket ${i} with ${bucket.length} elements`
      });
      
      // Choose sorting algorithm for this bucket
      this.sortBucket(bucket, options);
      
      this.recordState(result, {
        type: 'bucket-sorted',
        bucketIndex: i,
        bucket: [...bucket],
        message: `Completed sorting bucket ${i}`
      });
    }
    
    this.setPhase('concatenation');
    
    // Concatenate sorted buckets
    let index = 0;
    for (let i = 0; i < bucketCount; i++) {
      const bucket = buckets[i];
      
      // Record bucket concatenation
      if (bucket.length > 0) {
        this.recordState(result, {
          type: 'bucket-concatenation',
          bucketIndex: i,
          bucketSize: bucket.length,
          outputIndex: index,
          message: `Concatenating bucket ${i} to positions ${index} through ${index + bucket.length - 1}`
        });
      }
      
      // Copy bucket elements to the result array
      for (let j = 0; j < bucket.length; j++) {
        this.write(result, index++, bucket[j]);
      }
    }
    
    this.setPhase('completed');
    return result;
  }
  
  /**
   * Analyze the array to determine key properties for sorting
   * 
   * @param {Array} array - Array to analyze
   * @returns {Object} - Analysis results
   */
  analyzeArray(array) {
    const n = array.length;
    let min = Infinity;
    let max = -Infinity;
    let sum = 0;
    let isInteger = true;
    let hasNegative = false;
    
    // Scan array to find min, max, and detect if all elements are integers
    for (let i = 0; i < n; i++) {
      const value = array[i];
      
      min = Math.min(min, value);
      max = Math.max(max, value);
      sum += value;
      
      if (value < 0) {
        hasNegative = true;
      }
      
      if (isInteger && !Number.isInteger(value)) {
        isInteger = false;
      }
    }
    
    const range = max - min;
    const average = sum / n;
    
    // Calculate distribution properties
    let variance = 0;
    for (let i = 0; i < n; i++) {
      variance += Math.pow(array[i] - average, 2);
    }
    variance /= n;
    
    const standardDeviation = Math.sqrt(variance);
    const coefficient = standardDeviation / average;
    
    // Detect uniform distribution
    const isUniform = coefficient < 0.25; // Heuristic for uniform-like distribution
    
    return {
      min,
      max,
      range,
      average,
      variance,
      standardDeviation,
      coefficient,
      isInteger,
      hasNegative,
      isUniform
    };
  }
  
  /**
   * Determine the optimal number of buckets based on array properties
   * 
   * @param {number} n - Array length
   * @param {number} range - Range of values in the array
   * @param {Object} options - Runtime options
   * @returns {number} - Number of buckets to use
   */
  determineBucketCount(n, range, options) {
    if (options.bucketSizing === 'sqrt') {
      // Square root of array size - common heuristic
      return Math.max(2, Math.floor(Math.sqrt(n)));
    } else if (options.bucketSizing === 'adaptive') {
      // Adaptive bucket count based on array size and range
      if (n < 10) {
        return Math.min(n, 5);
      } else if (n < 100) {
        return Math.min(n, 10);
      } else if (n < 1000) {
        return Math.min(n, Math.max(10, n / 50));
      } else {
        return Math.min(n, Math.max(20, Math.sqrt(n)));
      }
    } else {
      // Default to fixed bucket count
      return options.bucketCount;
    }
  }
  
  /**
   * Determine the bucket index for a given value
   * 
   * @param {number} value - Value to place in a bucket
   * @param {number} min - Minimum value in the array
   * @param {number} max - Maximum value in the array
   * @param {number} bucketCount - Number of buckets
   * @returns {number} - Bucket index
   */
  getBucketIndex(value, min, max, bucketCount) {
    // Handle edge case where all values are the same
    if (max === min) {
      return 0;
    }
    
    // Normalize the value to 0-1 range, then scale to bucket count
    const normalizedValue = (value - min) / (max - min);
    let bucketIndex = Math.floor(normalizedValue * bucketCount);
    
    // Ensure index is within bounds (for floating point precision issues)
    return Math.min(bucketCount - 1, Math.max(0, bucketIndex));
  }
  
  /**
   * Sort elements within a bucket
   * 
   * @param {Array} bucket - Bucket to sort
   * @param {Object} options - Runtime options
   */
  sortBucket(bucket, options) {
    switch (options.bucketSort) {
      case 'insertion':
        this.insertionSort(bucket);
        break;
      case 'quick':
        this.quickSort(bucket, 0, bucket.length - 1);
        break;
      case 'merge':
        this.mergeSort(bucket, 0, bucket.length - 1);
        break;
      default:
        // Default to insertion sort for small buckets
        this.insertionSort(bucket);
    }
  }
  
  /**
   * Insertion sort implementation for bucket sorting
   * 
   * @param {Array} array - Array to sort
   */
  insertionSort(array) {
    const n = array.length;
    
    for (let i = 1; i < n; i++) {
      const key = array[i];
      let j = i - 1;
      
      while (j >= 0 && array[j] > key) {
        array[j + 1] = array[j];
        j--;
      }
      
      array[j + 1] = key;
    }
  }
  
  /**
   * Quick sort implementation for bucket sorting
   * 
   * @param {Array} array - Array to sort
   * @param {number} low - Start index
   * @param {number} high - End index
   */
  quickSort(array, low, high) {
    if (low < high) {
      const pivotIndex = this.partition(array, low, high);
      this.quickSort(array, low, pivotIndex - 1);
      this.quickSort(array, pivotIndex + 1, high);
    }
  }
  
  /**
   * Helper function for quicksort
   * 
   * @param {Array} array - Array to partition
   * @param {number} low - Start index
   * @param {number} high - End index
   * @returns {number} - Pivot index
   */
  partition(array, low, high) {
    // Use middle element as pivot to avoid worst case for sorted arrays
    const mid = Math.floor((low + high) / 2);
    const pivotValue = array[mid];
    
    // Move pivot to end
    [array[mid], array[high]] = [array[high], array[mid]];
    
    let i = low;
    
    for (let j = low; j < high; j++) {
      if (array[j] < pivotValue) {
        [array[i], array[j]] = [array[j], array[i]];
        i++;
      }
    }
    
    [array[i], array[high]] = [array[high], array[i]];
    return i;
  }
  
  /**
   * Merge sort implementation for bucket sorting
   * 
   * @param {Array} array - Array to sort
   * @param {number} left - Start index
   * @param {number} right - End index
   */
  mergeSort(array, left, right) {
    if (left < right) {
      const mid = Math.floor((left + right) / 2);
      
      this.mergeSort(array, left, mid);
      this.mergeSort(array, mid + 1, right);
      
      this.merge(array, left, mid, right);
    }
  }
  
  /**
   * Helper function for merge sort
   * 
   * @param {Array} array - Array to merge
   * @param {number} left - Left start index
   * @param {number} mid - Middle index
   * @param {number} right - Right end index
   */
  merge(array, left, mid, right) {
    const n1 = mid - left + 1;
    const n2 = right - mid;
    
    // Create temporary arrays
    const leftArray = new Array(n1);
    const rightArray = new Array(n2);
    
    // Copy data to temporary arrays
    for (let i = 0; i < n1; i++) {
      leftArray[i] = array[left + i];
    }
    for (let j = 0; j < n2; j++) {
      rightArray[j] = array[mid + 1 + j];
    }
    
    // Merge the arrays back
    let i = 0, j = 0, k = left;
    
    while (i < n1 && j < n2) {
      if (leftArray[i] <= rightArray[j]) {
        array[k] = leftArray[i];
        i++;
      } else {
        array[k] = rightArray[j];
        j++;
      }
      k++;
    }
    
    // Copy remaining elements
    while (i < n1) {
      array[k] = leftArray[i];
      i++;
      k++;
    }
    
    while (j < n2) {
      array[k] = rightArray[j];
      j++;
      k++;
    }
  }
  
  /**
   * Handle arrays with negative numbers by splitting and sorting separately
   * 
   * @param {Array} array - Array with negative numbers
   * @param {Object} analysis - Array analysis results
   * @param {Object} options - Runtime options
   * @returns {Array} - Sorted array
   */
  handleNegativeNumbers(array, analysis, options) {
    this.setPhase('handling-negatives');
    
    const n = array.length;
    const positives = [];
    const negatives = [];
    const zeros = [];
    
    // Separate positive, negative and zero values
    for (let i = 0; i < n; i++) {
      const value = this.read(array, i);
      if (value < 0) {
        negatives.push(-value); // Store as positive for sorting
      } else if (value > 0) {
        positives.push(value);
      } else {
        zeros.push(value); // Keep zeros separate
      }
    }
    
    this.recordState(array, {
      type: 'negative-handling',
      positiveCount: positives.length,
      negativeCount: negatives.length,
      zeroCount: zeros.length,
      message: `Separated into ${positives.length} positive, ${negatives.length} negative, and ${zeros.length} zero values`
    });
    
    // Create positive analysis
    const positiveAnalysis = positives.length > 0 ? this.analyzeArray(positives) : null;
    
    // Create negative analysis (using absolute values)
    const negativeAnalysis = negatives.length > 0 ? this.analyzeArray(negatives) : null;
    
    // Sort positive numbers if any
    if (positives.length > 0) {
      this.recordState(array, {
        type: 'sorting-positives',
        count: positives.length,
        message: `Sorting ${positives.length} positive values`
      });
      
      // Determine bucket count for positives
      const positiveBucketCount = this.determineBucketCount(
        positives.length, 
        positiveAnalysis.range, 
        options
      );
      
      // Create buckets for positives
      const positiveBuckets = Array.from(
        { length: positiveBucketCount }, 
        () => []
      );
      
      // Distribute positive elements
      for (let i = 0; i < positives.length; i++) {
        const value = positives[i];
        const bucketIndex = this.getBucketIndex(
          value, 
          positiveAnalysis.min, 
          positiveAnalysis.max, 
          positiveBucketCount
        );
        positiveBuckets[bucketIndex].push(value);
      }
      
      // Sort each positive bucket
      for (let i = 0; i < positiveBucketCount; i++) {
        if (positiveBuckets[i].length > 0) {
          this.sortBucket(positiveBuckets[i], options);
        }
      }
      
      // Concatenate positive buckets
      positives.length = 0; // Clear array
      for (let i = 0; i < positiveBucketCount; i++) {
        positives.push(...positiveBuckets[i]);
      }
    }
    
    // Sort negative numbers if any
    if (negatives.length > 0) {
      this.recordState(array, {
        type: 'sorting-negatives',
        count: negatives.length,
        message: `Sorting ${negatives.length} negative values (as absolute values)`
      });
      
      // Determine bucket count for negatives
      const negativeBucketCount = this.determineBucketCount(
        negatives.length, 
        negativeAnalysis.range, 
        options
      );
      
      // Create buckets for negatives
      const negativeBuckets = Array.from(
        { length: negativeBucketCount }, 
        () => []
      );
      
      // Distribute negative elements (as positive values)
      for (let i = 0; i < negatives.length; i++) {
        const value = negatives[i];
        const bucketIndex = this.getBucketIndex(
          value, 
          negativeAnalysis.min, 
          negativeAnalysis.max, 
          negativeBucketCount
        );
        negativeBuckets[bucketIndex].push(value);
      }
      
      // Sort each negative bucket
      for (let i = 0; i < negativeBucketCount; i++) {
        if (negativeBuckets[i].length > 0) {
          this.sortBucket(negativeBuckets[i], options);
        }
      }
      
      // Concatenate negative buckets and negate values
      negatives.length = 0; // Clear array
      for (let i = negativeBucketCount - 1; i >= 0; i--) {
        for (let j = negativeBuckets[i].length - 1; j >= 0; j--) {
          negatives.push(-negativeBuckets[i][j]);
        }
      }
    }
    
    // Combine results: negatives + zeros + positives
    const result = [...negatives, ...zeros, ...positives];
    
    // Copy back to original array
    for (let i = 0; i < n; i++) {
      this.write(array, i, result[i]);
    }
    
    this.recordState(array, {
      type: 'combined-result',
      message: 'Combined sorted negative, zero, and positive values'
    });
    
    return array;
  }
  
  /**
   * Get the time and space complexity of Bucket Sort
   * 
   * @returns {Object} - Complexity information
   */
  getComplexity() {
    return {
      time: {
        best: 'O(n + k)',
        average: 'O(n + k)',
        worst: 'O(n²)'
      },
      space: {
        best: 'O(n + k)',
        average: 'O(n + k)',
        worst: 'O(n + k)'
      }
    };
  }
  
  /**
   * Whether Bucket Sort is stable
   * 
   * @returns {boolean} - True if using stable sort for buckets
   */
  isStable() {
    // Stability depends on the bucket sorting algorithm
    return this.options.bucketSort === 'insertion' || this.options.bucketSort === 'merge';
  }
  
  /**
   * Whether Bucket Sort is in-place
   * 
   * @returns {boolean} - False as Bucket Sort requires auxiliary space
   */
  isInPlace() {
    return false; // Requires O(n) auxiliary space
  }
  
  /**
   * Get detailed algorithm information
   * 
   * @returns {Object} - Detailed algorithm metadata
   */
  getInfo() {
    const info = super.getInfo();
    
    // Add bucket sort specific information
    info.optimization = {
      bucketCount: this.options.bucketCount,
      bucketSizing: this.options.bucketSizing,
      bucketSort: this.options.bucketSort,
      optimizeSingleton: this.options.optimizeSingleton,
      detectUniformity: this.options.detectUniformity
    };
    
    info.properties = {
      comparisonBased: false, // The distribution phase is not comparison-based
      stable: this.isStable(),
      inPlace: this.isInPlace(),
      online: false,
      divideAndConquer: true // Splits problem into independent parts
    };
    
    info.suitable = {
      smallArrays: false,
      uniformDistribution: true,
      floatingPointData: true,
      limitedRange: true
    };
    
    info.variants = [
      'Standard Bucket Sort',
      'Adaptive Bucket Sort (dynamic bucket sizing)',
      'Proxmap Sort (specialized hash function)',
      'Histogram Sort (counting-based variation)',
      'Postman Sort (specialized for postal codes)'
    ];
    
    info.advantages = [
      'Linear time complexity O(n) for uniform distributions',
      'Works well with floating-point numbers',
      'Parallelizable across buckets',
      'Adaptive to data distribution with proper bucket sizing',
      'Can outperform comparison sorts for suitable data'
    ];
    
    info.disadvantages = [
      'Highly sensitive to data distribution (all elements in one bucket is worst case)',
      'Requires additional space proportional to input size',
      'Performance depends on efficiency of bucket sorting algorithm',
      'Not suitable for linked lists or external sorting',
      'Determining optimal bucket count requires data analysis'
    ];
    
    return info;
  }
}

export default BucketSort;