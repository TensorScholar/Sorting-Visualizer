// src/algorithms/distribution/radix.js

import Algorithm from '../core/algorithm-base';

/**
 * Implementation of Radix Sort with both LSD and MSD variants.
 * 
 * Radix Sort is a non-comparison integer sorting algorithm that processes
 * individual digits, sorting numbers by their positional notation. It has
 * two primary variants:
 * 
 * 1. LSD (Least Significant Digit): Processes digits from right to left
 *    - Stable sort
 *    - Simpler implementation
 *    - Requires a single pass through the data for each digit position
 * 
 * 2. MSD (Most Significant Digit): Processes digits from left to right
 *    - Not inherently stable without extra work
 *    - More complex recursive implementation
 *    - Can early-terminate for partially ordered data
 * 
 * Time Complexity: O(w * n) where w is the number of digits and n is the array size
 * Space Complexity: O(n + k) where k is the range of digit values (typically 10 for decimal)
 * 
 * @class RadixSort
 * @extends Algorithm
 */
class RadixSort extends Algorithm {
  /**
   * Create a new RadixSort instance
   * 
   * @param {Object} options - Configuration options
   * @param {string} [options.variant='lsd'] - Variant to use: 'lsd' or 'msd'
   * @param {number} [options.radix=10] - The base of the number system (default: decimal)
   * @param {boolean} [options.useCountingSort=true] - Use counting sort for digit sorting
   * @param {boolean} [options.inPlace=false] - Attempt to use less auxiliary memory (MSD only)
   * @param {boolean} [options.stable=true] - Ensure stability (matters for MSD)
   */
  constructor(options = {}) {
    super('Radix Sort', 'distribution', options);
    
    // Default options
    this.options = {
      variant: 'lsd',           // 'lsd' (Least Significant Digit) or 'msd' (Most Significant Digit)
      radix: 10,                // Base of the number system (default: decimal)
      useCountingSort: true,    // Use counting sort for digit sorting
      inPlace: false,           // Attempt to use less auxiliary memory (MSD only)
      stable: true,             // Ensure stability (matters for MSD)
      ...options
    };
  }
  
  /**
   * Execute Radix Sort on the input array
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
    
    // Find the maximum number to determine number of digits
    let max = Math.abs(result[0]);
    for (let i = 1; i < n; i++) {
      max = Math.max(max, Math.abs(result[i]));
    }
    
    // Handle arrays with negative numbers
    const hasNegative = result.some(num => num < 0);
    
    // Record initial state
    this.recordState(result, {
      type: 'initialization',
      max: max,
      hasNegative: hasNegative,
      message: `Analyzing input: max value = ${max}, contains negative numbers: ${hasNegative}`
    });
    
    // Choose sorting implementation based on variant
    if (options.variant === 'msd') {
      if (hasNegative) {
        // Handle negative numbers for MSD variant
        this.handleNegativeNumbersMSD(result, max, options);
      } else {
        // Sort positive numbers with MSD Radix Sort
        this.msdRadixSort(result, 0, n - 1, this.getMaxDigitCount(max, options.radix), options);
      }
    } else {
      // Default to LSD variant
      if (hasNegative) {
        // Handle negative numbers for LSD variant
        this.handleNegativeNumbersLSD(result, max, options);
      } else {
        // Sort positive numbers with LSD Radix Sort
        this.lsdRadixSort(result, max, options);
      }
    }
    
    this.setPhase('completed');
    return result;
  }
  
  /**
   * LSD (Least Significant Digit) Radix Sort implementation
   * 
   * @param {Array} array - Array to be sorted
   * @param {number} max - Maximum value in the array
   * @param {Object} options - Runtime options
   */
  lsdRadixSort(array, max, options) {
    this.setPhase('lsd-sorting');
    
    const n = array.length;
    const radix = options.radix;
    
    // Get the number of digits in the maximum number
    const maxDigitCount = this.getMaxDigitCount(max, radix);
    
    this.recordState(array, {
      type: 'radix-info',
      radix: radix,
      maxDigits: maxDigitCount,
      message: `Starting LSD Radix Sort with base ${radix}, maximum of ${maxDigitCount} digits`
    });
    
    // Process each digit position, starting from the least significant (rightmost)
    let exp = 1; // Start with the 1's place
    for (let digitPlace = 0; digitPlace < maxDigitCount; digitPlace++) {
      // Record current digit position
      this.recordState(array, {
        type: 'digit-position',
        position: digitPlace,
        exponent: exp,
        message: `Sorting by digit position ${digitPlace} (${exp}'s place)`
      });
      
      // Sort array elements according to the current digit
      if (options.useCountingSort) {
        this.countingSortByDigit(array, exp, radix, options);
      } else {
        this.bucketSortByDigit(array, exp, radix, options);
      }
      
      // Move to next digit position
      exp *= radix;
      
      // Record the array state after sorting this digit position
      this.recordState(array, {
        type: 'lsd-pass-complete',
        position: digitPlace,
        message: `Completed sorting pass for digit position ${digitPlace}`
      });
    }
  }
  
  /**
   * MSD (Most Significant Digit) Radix Sort implementation
   * Recursive implementation that sorts from most significant to least significant digit
   * 
   * @param {Array} array - Array to be sorted
   * @param {number} start - Start index for current recursion
   * @param {number} end - End index for current recursion
   * @param {number} digitPosition - Current digit position (max to 0)
   * @param {Object} options - Runtime options
   */
  msdRadixSort(array, start, end, digitPosition, options) {
    this.setPhase('msd-sorting');
    
    // Base cases
    if (start >= end || digitPosition < 0) {
      return;
    }
    
    // Small subarray optimization
    if (end - start < 10) {
      this.insertionSort(array, start, end);
      return;
    }
    
    const radix = options.radix;
    const exp = Math.pow(radix, digitPosition);
    
    // Record the current recursion state
    this.recordState(array, {
      type: 'msd-recursion',
      start: start,
      end: end,
      digitPosition: digitPosition,
      exponent: exp,
      message: `MSD sorting from index ${start} to ${end} at digit position ${digitPosition}`
    });
    
    // Use counting sort to order by the current digit
    if (options.useCountingSort) {
      this.countingSortByDigitRange(array, exp, radix, start, end, options);
    } else {
      // Alternative: bucket sort for this digit
      this.bucketSortByDigitRange(array, exp, radix, start, end, options);
    }
    
    // Now recursively sort each bucket (group of elements with the same digit)
    const digitCounts = new Array(radix).fill(0);
    
    // Count the frequency of each digit value at the current position
    for (let i = start; i <= end; i++) {
      const digit = Math.floor(Math.abs(array[i]) / exp) % radix;
      digitCounts[digit]++;
    }
    
    // Calculate starting position of each digit group
    let startIndex = start;
    for (let digit = 0; digit < radix; digit++) {
      const count = digitCounts[digit];
      if (count > 0) {
        const endIndex = startIndex + count - 1;
        
        // Record the bucket boundaries
        this.recordState(array, {
          type: 'msd-bucket',
          digit: digit,
          start: startIndex,
          end: endIndex,
          message: `Processing bucket for digit value ${digit} (indices ${startIndex} to ${endIndex})`
        });
        
        // Recursively sort this bucket by the next digit position
        this.msdRadixSort(array, startIndex, endIndex, digitPosition - 1, options);
        
        startIndex = endIndex + 1;
      }
    }
  }
  
  /**
   * Sort array elements by a specific digit using counting sort
   * 
   * @param {Array} array - Array to be sorted
   * @param {number} exp - Exponent for the current digit position (1, 10, 100, etc.)
   * @param {number} radix - Base of the number system
   * @param {Object} options - Runtime options
   */
  countingSortByDigit(array, exp, radix, options) {
    const n = array.length;
    const output = new Array(n).fill(0);
    const count = new Array(radix).fill(0);
    
    // Store count of occurrences of each digit
    for (let i = 0; i < n; i++) {
      const digit = Math.floor(Math.abs(array[i]) / exp) % radix;
      count[digit]++;
      
      // Record the digit extraction
      if (i % Math.max(1, Math.floor(n / 10)) === 0) { // Record only some steps for large arrays
        this.recordState(array, {
          type: 'digit-extraction',
          index: i,
          value: array[i],
          digit: digit,
          position: exp,
          message: `Extracted digit ${digit} at position ${exp} from value ${array[i]}`
        });
      }
    }
    
    // Record the digit counts
    this.recordState(array, {
      type: 'digit-counts',
      counts: [...count],
      message: `Digit frequency counts at position ${exp}: [${count.join(', ')}]`
    });
    
    // Change count[i] so that count[i] contains the position of this digit in output[]
    for (let i = 1; i < radix; i++) {
      count[i] += count[i - 1];
    }
    
    // Record the cumulative counts
    this.recordState(array, {
      type: 'cumulative-counts',
      counts: [...count],
      message: `Cumulative counts for stable positioning: [${count.join(', ')}]`
    });
    
    // Build the output array
    // Process elements in reverse to maintain stability
    for (let i = n - 1; i >= 0; i--) {
      const digit = Math.floor(Math.abs(array[i]) / exp) % radix;
      const position = count[digit] - 1;
      output[position] = array[i];
      count[digit]--;
      
      // Record significant placement operations
      if (i % Math.max(1, Math.floor(n / 10)) === 0) { // Record only some steps for large arrays
        this.recordState([...array], {
          type: 'element-placement',
          index: i,
          value: array[i],
          digit: digit,
          position: position,
          message: `Placing element ${array[i]} with digit ${digit} at output position ${position}`
        });
      }
    }
    
    // Copy the output array to the original array
    for (let i = 0; i < n; i++) {
      this.write(array, i, output[i]);
    }
    
    // Record the completed pass
    this.recordState(array, {
      type: 'counting-sort-complete',
      exponent: exp,
      message: `Completed counting sort pass for digit position ${exp}`
    });
  }
  
  /**
   * Sort a range of array elements by a specific digit using counting sort
   * Used for MSD Radix Sort on subarrays
   * 
   * @param {Array} array - Array to be sorted
   * @param {number} exp - Exponent for the current digit position
   * @param {number} radix - Base of the number system
   * @param {number} start - Start index of the range
   * @param {number} end - End index of the range
   * @param {Object} options - Runtime options
   */
  countingSortByDigitRange(array, exp, radix, start, end, options) {
    const range = end - start + 1;
    const output = new Array(range);
    const count = new Array(radix).fill(0);
    
    // Store count of occurrences of each digit in the range
    for (let i = start; i <= end; i++) {
      const digit = Math.floor(Math.abs(array[i]) / exp) % radix;
      count[digit]++;
    }
    
    // Record the digit counts
    this.recordState(array, {
      type: 'digit-counts',
      counts: [...count],
      start: start,
      end: end,
      message: `Digit frequency counts at position ${exp} for range [${start}..${end}]: [${count.join(', ')}]`
    });
    
    // Change count[i] so that count[i] contains the position of this digit in output[]
    for (let i = 1; i < radix; i++) {
      count[i] += count[i - 1];
    }
    
    // Build the output array
    // Process elements in reverse to maintain stability
    for (let i = end; i >= start; i--) {
      const digit = Math.floor(Math.abs(array[i]) / exp) % radix;
      const position = count[digit] - 1;
      output[position] = array[i];
      count[digit]--;
      
      // Record significant placement operations
      if ((i - start) % Math.max(1, Math.floor(range / 10)) === 0) {
        this.recordState([...array], {
          type: 'element-placement',
          index: i,
          value: array[i],
          digit: digit,
          message: `Placing element ${array[i]} with digit ${digit} in output`
        });
      }
    }
    
    // Copy back to original array
    for (let i = 0; i < range; i++) {
      this.write(array, start + i, output[i]);
    }
    
    // Record the completed pass
    this.recordState(array, {
      type: 'counting-sort-complete',
      exponent: exp,
      start: start,
      end: end,
      message: `Completed counting sort pass for digit position ${exp} in range [${start}..${end}]`
    });
  }
  
  /**
   * Sort array elements by a specific digit using bucket sort approach
   * Alternative to counting sort for digit sorting
   * 
   * @param {Array} array - Array to be sorted
   * @param {number} exp - Exponent for the current digit position
   * @param {number} radix - Base of the number system
   * @param {Object} options - Runtime options
   */
  bucketSortByDigit(array, exp, radix, options) {
    const n = array.length;
    const buckets = Array.from({ length: radix }, () => []);
    
    // Distribute elements into buckets based on the current digit
    for (let i = 0; i < n; i++) {
      const digit = Math.floor(Math.abs(array[i]) / exp) % radix;
      buckets[digit].push(array[i]);
      
      // Record bucket distribution
      if (i % Math.max(1, Math.floor(n / 10)) === 0) {
        this.recordState([...array], {
          type: 'bucket-distribution',
          index: i,
          value: array[i],
          digit: digit,
          message: `Placing ${array[i]} into bucket ${digit} (${exp}'s place digit)`
        });
      }
    }
    
    // Record bucket state
    this.recordState(array, {
      type: 'buckets-filled',
      buckets: buckets.map(b => [...b]),
      message: `Elements distributed into ${radix} buckets by digit at position ${exp}`
    });
    
    // Concatenate all buckets back into the original array
    let index = 0;
    for (let digit = 0; digit < radix; digit++) {
      const bucket = buckets[digit];
      
      // Record that we're processing this bucket
      if (bucket.length > 0) {
        this.recordState([...array], {
          type: 'bucket-processing',
          digit: digit,
          bucketSize: bucket.length,
          message: `Transferring ${bucket.length} elements from bucket ${digit} back to array`
        });
      }
      
      for (let j = 0; j < bucket.length; j++) {
        this.write(array, index++, bucket[j]);
      }
    }
    
    // Record the completed pass
    this.recordState(array, {
      type: 'bucket-sort-complete',
      exponent: exp,
      message: `Completed bucket sort pass for digit position ${exp}`
    });
  }
  
  /**
   * Sort a range of array elements by a specific digit using bucket sort
   * Used for MSD Radix Sort on subarrays
   * 
   * @param {Array} array - Array to be sorted
   * @param {number} exp - Exponent for the current digit position
   * @param {number} radix - Base of the number system
   * @param {number} start - Start index of the range
   * @param {number} end - End index of the range
   * @param {Object} options - Runtime options
   */
  bucketSortByDigitRange(array, exp, radix, start, end, options) {
    const range = end - start + 1;
    const buckets = Array.from({ length: radix }, () => []);
    
    // Distribute elements into buckets
    for (let i = start; i <= end; i++) {
      const digit = Math.floor(Math.abs(array[i]) / exp) % radix;
      buckets[digit].push(array[i]);
    }
    
    // Record bucket state
    this.recordState(array, {
      type: 'buckets-filled',
      buckets: buckets.map(b => [...b]),
      start: start,
      end: end,
      message: `Elements from range [${start}..${end}] distributed into buckets by digit at position ${exp}`
    });
    
    // Concatenate buckets back into the original array
    let index = start;
    for (let digit = 0; digit < radix; digit++) {
      const bucket = buckets[digit];
      
      for (let j = 0; j < bucket.length; j++) {
        this.write(array, index++, bucket[j]);
      }
    }
    
    // Record the completed pass
    this.recordState(array, {
      type: 'bucket-sort-complete',
      exponent: exp,
      start: start,
      end: end,
      message: `Completed bucket sort pass for digit position ${exp} in range [${start}..${end}]`
    });
  }
  
  /**
   * Simple insertion sort for small subarrays
   * 
   * @param {Array} array - Array to be sorted
   * @param {number} start - Start index
   * @param {number} end - End index
   */
  insertionSort(array, start, end) {
    for (let i = start + 1; i <= end; i++) {
      const key = this.read(array, i);
      let j = i - 1;
      
      while (j >= start && this.compare(this.read(array, j), key) > 0) {
        this.write(array, j + 1, this.read(array, j));
        j--;
      }
      
      this.write(array, j + 1, key);
    }
    
    this.recordState(array, {
      type: 'insertion-sort',
      start: start,
      end: end,
      message: `Applied insertion sort on small range [${start}..${end}]`
    });
  }
  
  /**
   * Handle arrays with negative numbers for LSD variant
   * 
   * @param {Array} array - Array containing negative numbers
   * @param {number} max - Maximum absolute value in the array
   * @param {Object} options - Runtime options
   */
  handleNegativeNumbersLSD(array, max, options) {
    this.setPhase('handling-negatives');
    
    const n = array.length;
    const positives = [];
    const negatives = [];
    
    // Separate positive and negative numbers
    for (let i = 0; i < n; i++) {
      const value = this.read(array, i);
      if (value < 0) {
        negatives.push(-value); // Store absolute value for sorting
      } else {
        positives.push(value);
      }
    }
    
    this.recordState(array, {
      type: 'negative-handling',
      positiveCount: positives.length,
      negativeCount: negatives.length,
      message: `Separated into ${positives.length} positive and ${negatives.length} negative numbers`
    });
    
    // Sort positive and negative parts separately
    if (positives.length > 0) {
      this.lsdRadixSort(positives, max, options);
    }
    
    if (negatives.length > 0) {
      this.lsdRadixSort(negatives, max, options);
      // Reverse and negate the sorted negative numbers
      negatives.reverse();
      for (let i = 0; i < negatives.length; i++) {
        negatives[i] = -negatives[i];
      }
    }
    
    // Combine the results: negatives followed by positives
    const combined = [...negatives, ...positives];
    
    // Copy back to the original array
    for (let i = 0; i < n; i++) {
      this.write(array, i, combined[i]);
    }
    
    this.recordState(array, {
      type: 'negatives-combined',
      message: `Combined sorted negative and positive partitions`
    });
  }
  
  /**
   * Handle arrays with negative numbers for MSD variant
   * 
   * @param {Array} array - Array containing negative numbers
   * @param {number} max - Maximum absolute value in the array
   * @param {Object} options - Runtime options
   */
  handleNegativeNumbersMSD(array, max, options) {
    this.setPhase('handling-negatives');
    
    const n = array.length;
    const positives = [];
    const negatives = [];
    
    // Separate positive and negative numbers
    for (let i = 0; i < n; i++) {
      const value = this.read(array, i);
      if (value < 0) {
        negatives.push(-value); // Store absolute value for sorting
      } else {
        positives.push(value);
      }
    }
    
    this.recordState(array, {
      type: 'negative-handling',
      positiveCount: positives.length,
      negativeCount: negatives.length,
      message: `Separated into ${positives.length} positive and ${negatives.length} negative numbers`
    });
    
    // Sort positive and negative parts separately with MSD
    const maxDigits = this.getMaxDigitCount(max, options.radix);
    
    if (positives.length > 0) {
      this.msdRadixSort(positives, 0, positives.length - 1, maxDigits - 1, options);
    }
    
    if (negatives.length > 0) {
      this.msdRadixSort(negatives, 0, negatives.length - 1, maxDigits - 1, options);
      // Reverse and negate the sorted negative numbers
      negatives.reverse();
      for (let i = 0; i < negatives.length; i++) {
        negatives[i] = -negatives[i];
      }
    }
    
    // Combine the results: negatives followed by positives
    const combined = [...negatives, ...positives];
    
    // Copy back to the original array
    for (let i = 0; i < n; i++) {
      this.write(array, i, combined[i]);
    }
    
    this.recordState(array, {
      type: 'negatives-combined',
      message: `Combined sorted negative and positive partitions`
    });
  }
  
  /**
   * Calculate the number of digits in a number given a radix
   * 
   * @param {number} num - Number to analyze
   * @param {number} radix - Base of the number system
   * @returns {number} - Number of digits
   */
  getMaxDigitCount(num, radix) {
    if (num === 0) return 1;
    return Math.floor(Math.log(num) / Math.log(radix)) + 1;
  }
  
  /**
   * Get the time and space complexity of Radix Sort
   * 
   * @returns {Object} - Complexity information
   */
  getComplexity() {
    const variant = this.options.variant;
    
    return {
      time: {
        best: 'O(w * n)',
        average: 'O(w * n)',
        worst: 'O(w * n)'
      },
      space: {
        best: variant === 'msd' && this.options.inPlace ? 'O(log n)' : 'O(n + k)',
        average: 'O(n + k)',
        worst: 'O(n + k)'
      }
    };
  }
  
  /**
   * Whether Radix Sort is stable
   * 
   * @returns {boolean} - True if LSD variant or if MSD with stability option
   */
  isStable() {
    return this.options.variant === 'lsd' || 
           (this.options.variant === 'msd' && this.options.stable);
  }
  
  /**
   * Whether Radix Sort is in-place
   * 
   * @returns {boolean} - False as Radix Sort requires auxiliary space
   */
  isInPlace() {
    return false; // Standard implementation requires O(n) auxiliary space
  }
  
  /**
   * Get detailed algorithm information
   * 
   * @returns {Object} - Detailed algorithm metadata
   */
  getInfo() {
    const info = super.getInfo();
    
    // Add radix sort specific information
    info.optimization = {
      variant: this.options.variant,
      radix: this.options.radix,
      useCountingSort: this.options.useCountingSort,
      inPlace: this.options.inPlace,
      stable: this.options.stable
    };
    
    info.properties = {
      comparisonBased: false,
      stable: this.isStable(),
      inPlace: this.isInPlace(),
      online: false,
      divideAndConquer: this.options.variant === 'msd'
    };
    
    info.suitable = {
      smallArrays: false,
      integerData: true,
      fixedLengthKeys: true,
      limitedRange: true,
      stringData: true
    };
    
    info.variants = [
      'Least Significant Digit (LSD) Radix Sort',
      'Most Significant Digit (MSD) Radix Sort',
      'American Flag Sort (more efficient MSD variant)',
      'Flashsort (MSD variant)',
      'In-place MSD Radix Sort'
    ];
    
    info.advantages = [
      'Linear time complexity O(w * n) independent of input distribution',
      'Can be faster than O(n log n) comparison sorts for fixed-length keys',
      'Stable (for LSD variant)',
      'Suitable for parallel implementation',
      'Good for string/integer sorting with fixed-length keys'
    ];
    
    info.disadvantages = [
      'Limited to integers and strings (lexicographical ordering)',
      'Space intensive due to auxiliary memory requirements',
      'Performance highly dependent on key length and distribution',
      'Often slower than quicksort for general purpose sorting',
      'Complex implementation for variable-length keys'
    ];
    
    return info;
  }
}

export default RadixSort;