// src/algorithms/comparison/tim.js

import Algorithm from '../core/algorithm-base';

/**
 * Implementation of Tim Sort - an adaptive, stable, natural merging sort
 * derived from merge sort and insertion sort.
 * 
 * Tim Sort was developed by Tim Peters in 2002 for the Python programming language.
 * It's a hybrid stable sorting algorithm that combines the strengths of merge sort
 * and insertion sort, designed to perform well on many real-world data patterns.
 * 
 * Key features:
 * - Stable (preserves relative order of equal elements)
 * - Adaptive (exploits existing order in the input data)
 * - Natural (identifies and merges pre-sorted subsequences or "runs")
 * - O(n log n) worst-case time complexity
 * - O(n) best-case time complexity for already-sorted inputs
 * 
 * The algorithm includes several optimizations:
 * 1. Identification and utilization of natural runs
 * 2. Binary insertion sort for small runs
 * 3. Galloping mode for merge operation
 * 4. Run length computation based on input size
 * 5. Merge operations designed to maintain stability
 * 6. Specialized merging for adjacent runs
 * 
 * @class TimSort
 * @extends Algorithm
 */
class TimSort extends Algorithm {
  /**
   * Create a new TimSort instance
   * 
   * @param {Object} options - Configuration options
   * @param {number} [options.minRun=32] - Minimum run size (or compute automatically if 0)
   * @param {boolean} [options.useGalloping=true] - Enable galloping mode for merges
   * @param {boolean} [options.useNaturalRuns=true] - Identify and use natural runs
   * @param {number} [options.gallopingThreshold=7] - Consecutive wins to enter galloping mode
   */
  constructor(options = {}) {
    super('Tim Sort', 'comparison', options);
    
    // Default options
    this.options = {
      minRun: 32,                  // Minimum length of a run
      useGalloping: true,          // Use galloping mode for merges
      useNaturalRuns: true,        // Identify and use natural runs
      gallopingThreshold: 7,       // Consecutive wins to enter galloping mode
      ...options
    };
  }
  
  /**
   * Execute Tim Sort on the input array
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
    
    this.setPhase('run-identification');
    
    // Compute the minimum run length
    const minRun = options.minRun === 0 
      ? this.computeMinRun(n) 
      : options.minRun;
    
    // Stack of pending runs to be merged
    const runStack = [];
    
    // Process the array by identifying runs and merging them
    let currentPosition = 0;
    
    while (currentPosition < n) {
      // Identify a run (either natural or forced)
      const runStart = currentPosition;
      
      // Look for a natural run if enabled
      if (options.useNaturalRuns) {
        currentPosition = this.identifyNaturalRun(result, currentPosition, n);
      } else {
        // Always process at least two elements
        currentPosition = Math.min(n - 1, currentPosition + 1);
      }
      
      // Check if the run is ascending, descending, or a single element
      const isDescending = currentPosition > runStart && 
                          this.compare(result[runStart], result[runStart + 1]) > 0;
      
      // If descending, reverse the run
      if (isDescending) {
        this.reverseRun(result, runStart, currentPosition);
        
        this.recordState(result, {
          type: 'run-reversal',
          runStart: runStart,
          runEnd: currentPosition,
          message: `Reversed descending run from index ${runStart} to ${currentPosition}`
        });
      } else if (currentPosition === runStart) {
        // If single element run, move to next position
        currentPosition++;
      }
      
      // Extend run to minRun length if it's too short (unless we reached the end)
      let runEnd = currentPosition;
      if (runEnd < n) {
        runEnd = Math.min(n - 1, runStart + minRun - 1);
        
        // Sort this segment with insertion sort
        this.binaryInsertionSort(result, runStart, runEnd);
        currentPosition = runEnd + 1;
      }
      
      // Record the identified and potentially extended run
      this.recordState(result, {
        type: 'run-identification',
        runStart: runStart,
        runEnd: runEnd,
        message: `Identified run from index ${runStart} to ${runEnd}`
      });
      
      // Push the current run onto the stack
      runStack.push({
        start: runStart,
        length: runEnd - runStart + 1
      });
      
      // Merge runs if necessary to maintain the invariants
      this.mergeCollapse(result, runStack);
    }
    
    this.setPhase('final-merging');
    
    // Final merging of all remaining runs
    this.mergeForce(result, runStack);
    
    this.setPhase('completed');
    return result;
  }
  
  /**
   * Compute the minimum run length for efficiency
   * Original Tim Sort computes this based on array size
   * 
   * @param {number} n - Array length
   * @returns {number} - Minimum run length
   */
  computeMinRun(n) {
    // Compute a value in the range [16, 32] such that
    // n/minRun is close to, but not less than, a power of 2
    let r = 0;
    while (n >= 64) {
      r |= n & 1;
      n >>= 1;
    }
    return n + r;
  }
  
  /**
   * Identify a natural run in the array
   * A run is a sequence of already sorted elements
   * 
   * @param {Array} array - The array to examine
   * @param {number} start - Start index
   * @param {number} length - Array length
   * @returns {number} - End index of the run (inclusive)
   */
  identifyNaturalRun(array, start, length) {
    // Handle case where we're at the end of the array
    if (start >= length - 1) {
      return start;
    }
    
    // Determine if the run is ascending or descending
    let descending = false;
    
    // Start by checking the first two elements
    if (this.compare(array[start], array[start + 1]) > 0) {
      descending = true;
    }
    
    // Continue the run as long as elements maintain the established order
    let end = start + 1;
    
    if (descending) {
      // Look for a descending run
      while (end < length - 1 && this.compare(array[end], array[end + 1]) >= 0) {
        end++;
      }
    } else {
      // Look for an ascending run
      while (end < length - 1 && this.compare(array[end], array[end + 1]) <= 0) {
        end++;
      }
    }
    
    // Record the natural run info
    this.recordState(array, {
      type: 'natural-run',
      runStart: start,
      runEnd: end,
      isDescending: descending,
      message: `Identified ${descending ? 'descending' : 'ascending'} natural run from ${start} to ${end}`
    });
    
    return end;
  }
  
  /**
   * Reverse a run in-place
   * 
   * @param {Array} array - The array containing the run
   * @param {number} start - Start index
   * @param {number} end - End index (inclusive)
   */
  reverseRun(array, start, end) {
    while (start < end) {
      this.swap(array, start++, end--);
    }
  }
  
  /**
   * Sort a small range using binary insertion sort
   * 
   * @param {Array} array - The array to sort
   * @param {number} start - Start index
   * @param {number} end - End index (inclusive)
   */
  binaryInsertionSort(array, start, end) {
    this.recordState(array, {
      type: 'insertion-start',
      section: [start, end],
      message: `Sorting range [${start}...${end}] with binary insertion sort`
    });
    
    for (let i = start + 1; i <= end; i++) {
      const pivotValue = this.read(array, i);
      
      // Find insertion position using binary search
      let insertPos = this.binarySearch(array, pivotValue, start, i - 1);
      
      // Shift elements to make room for the pivot
      for (let j = i - 1; j >= insertPos; j--) {
        this.write(array, j + 1, this.read(array, j));
      }
      
      // Insert the pivot value
      this.write(array, insertPos, pivotValue);
      
      // Record this insertion operation
      this.recordState(array, {
        type: 'insertion-step',
        pivot: pivotValue,
        insertPosition: insertPos,
        section: [start, end],
        message: `Inserted value ${pivotValue} at position ${insertPos}`
      });
    }
    
    this.recordState(array, {
      type: 'insertion-complete',
      section: [start, end],
      message: `Completed insertion sort for range [${start}...${end}]`
    });
  }
  
  /**
   * Binary search to find insertion position
   * 
   * @param {Array} array - The array to search
   * @param {*} value - The value to insert
   * @param {number} lo - Lower bound
   * @param {number} hi - Upper bound
   * @returns {number} - Insertion position
   */
  binarySearch(array, value, lo, hi) {
    while (lo <= hi) {
      const mid = lo + ((hi - lo) >> 1);
      const midValue = this.read(array, mid);
      
      const comparison = this.compare(midValue, value);
      
      if (comparison < 0) {
        lo = mid + 1;
      } else if (comparison > 0) {
        hi = mid - 1;
      } else {
        // For stability, insert after equal elements
        lo = mid + 1;
      }
    }
    
    return lo;
  }
  
  /**
   * Check stack invariants and merge runs if necessary
   * 
   * @param {Array} array - The array being sorted
   * @param {Array} runStack - Stack of pending runs
   */
  mergeCollapse(array, runStack) {
    // Merge adjacent runs if they don't satisfy the invariants:
    // 1. runStack[n-2].length > runStack[n-1].length
    // 2. runStack[n-3].length > runStack[n-2].length + runStack[n-1].length
    
    while (runStack.length > 1) {
      let n = runStack.length - 1;
      
      if ((n >= 1 && runStack[n-1].length <= runStack[n].length) ||
          (n >= 2 && runStack[n-2].length <= runStack[n-1].length + runStack[n].length)) {
        
        if (n >= 2 && runStack[n-2].length < runStack[n].length) {
          // Merge run n-2 and n-1
          this.mergeRuns(array, runStack, n-2);
        } else {
          // Merge run n-1 and n
          this.mergeRuns(array, runStack, n-1);
        }
      } else {
        // Invariants satisfied, no merging needed
        break;
      }
    }
  }
  
  /**
   * Force merging of all runs in the stack
   * 
   * @param {Array} array - The array being sorted
   * @param {Array} runStack - Stack of pending runs
   */
  mergeForce(array, runStack) {
    while (runStack.length > 1) {
      const n = runStack.length - 1;
      if (n > 0) {
        this.mergeRuns(array, runStack, n-1);
      }
    }
  }
  
  /**
   * Merge two adjacent runs
   * 
   * @param {Array} array - The array being sorted
   * @param {Array} runStack - Stack of pending runs
   * @param {number} i - Index of the first run to merge
   */
  mergeRuns(array, runStack, i) {
    const run1 = runStack[i];
    const run2 = runStack[i+1];
    
    const start1 = run1.start;
    const end1 = start1 + run1.length - 1;
    const start2 = run2.start;
    const end2 = start2 + run2.length - 1;
    
    // Record the merge operation
    this.recordState(array, {
      type: 'merge-start',
      run1: [start1, end1],
      run2: [start2, end2],
      message: `Starting merge of runs [${start1}...${end1}] and [${start2}...${end2}]`
    });
    
    // Merge the two runs
    this.mergeAdjacentRuns(array, start1, end1, end2, this.options);
    
    // Update the stack
    runStack[i] = {
      start: start1,
      length: run1.length + run2.length
    };
    runStack.splice(i+1, 1);
    
    // Record the merge completion
    this.recordState(array, {
      type: 'merge-complete',
      mergedRun: [start1, end2],
      message: `Completed merge of runs into [${start1}...${end2}]`
    });
  }
  
  /**
   * Merge two adjacent runs in-place
   * 
   * @param {Array} array - The array being sorted
   * @param {number} start1 - Start of first run
   * @param {number} end1 - End of first run
   * @param {number} end2 - End of second run
   * @param {Object} options - Algorithm options
   */
  mergeAdjacentRuns(array, start1, end1, end2, options) {
    // If first run is small enough, use in-place merge
    // Otherwise, use temporary buffer
    const len1 = end1 - start1 + 1;
    const len2 = end2 - (end1 + 1) + 1;
    
    // Create a temporary buffer for the first run
    const buffer = new Array(len1);
    for (let i = 0; i < len1; i++) {
      buffer[i] = this.read(array, start1 + i);
    }
    
    // Track galloping mode state
    let galloping = false;
    let consecutiveWins = 0;
    
    // Merge positions
    let dest = start1;
    let cursor1 = 0;         // Position in buffer
    let cursor2 = end1 + 1;  // Position in second run
    
    while (cursor1 < len1 && cursor2 <= end2) {
      // Compare current elements
      if (this.compare(buffer[cursor1], this.read(array, cursor2)) <= 0) {
        // Element from first run is smaller
        this.write(array, dest++, buffer[cursor1++]);
        consecutiveWins = galloping ? consecutiveWins + 1 : 1;
      } else {
        // Element from second run is smaller
        this.write(array, dest++, this.read(array, cursor2++));
        consecutiveWins = 0;
      }
      
      // Check for galloping mode transition
      if (options.useGalloping && consecutiveWins >= options.gallopingThreshold) {
        if (!galloping) {
          galloping = true;
          this.recordState(array, {
            type: 'galloping-mode',
            position: dest - 1,
            message: 'Entering galloping mode'
          });
        }
        
        // Gallop through the winning run
        dest = this.gallopMerge(array, buffer, cursor1, len1, cursor2, end2, dest, galloping);
        
        // Reset galloping after a gallop merge
        galloping = false;
        consecutiveWins = 0;
      }
      
      // Periodically record the merging progress
      if ((dest - start1) % 10 === 0 || dest > end2 - 5) {
        this.recordState(array, {
          type: 'merge-progress',
          progress: (dest - start1) / (end2 - start1 + 1),
          buffer1Cursor: cursor1,
          array2Cursor: cursor2,
          message: `Merge progress: ${Math.floor(((dest - start1) / (end2 - start1 + 1)) * 100)}%`
        });
      }
    }
    
    // Copy any remaining elements from buffer (first run)
    while (cursor1 < len1) {
      this.write(array, dest++, buffer[cursor1++]);
    }
    
    // Second run is already in place
    
    this.recordState(array, {
      type: 'merge-cleanup',
      mergedSection: [start1, end2],
      message: `Final cleanup of merged section [${start1}...${end2}]`
    });
  }
  
  /**
   * Perform galloping merge to skip through runs when consecutive elements
   * come from the same run
   * 
   * @param {Array} array - The array being sorted
   * @param {Array} buffer - Buffer containing the first run
   * @param {number} cursor1 - Current position in buffer
   * @param {number} len1 - Length of first run
   * @param {number} cursor2 - Current position in second run
   * @param {number} end2 - End position of second run
   * @param {number} dest - Current destination position
   * @param {boolean} winning1 - Whether run1 has consecutive wins
   * @returns {number} - Updated destination position
   */
  gallopMerge(array, buffer, cursor1, len1, cursor2, end2, dest, winning1) {
    if (winning1) {
      // Find how many elements from run1 are less than the first element of run2
      const run2Element = this.read(array, cursor2);
      const advanceCount = this.gallopSearch(buffer, run2Element, cursor1, len1, true);
      
      // Copy these elements in one go
      for (let i = 0; i < advanceCount; i++) {
        this.write(array, dest++, buffer[cursor1++]);
      }
      
      this.recordState(array, {
        type: 'gallop-advance',
        count: advanceCount,
        run: 1,
        message: `Galloped ${advanceCount} elements from run 1`
      });
    } else {
      // Find how many elements from run2 are less than or equal to the first element of buffer
      const run1Element = buffer[cursor1];
      const advanceCount = this.gallopSearch(array, run1Element, cursor2, end2 - cursor2 + 1, false);
      
      // Copy these elements in one go
      for (let i = 0; i < advanceCount; i++) {
        this.write(array, dest++, this.read(array, cursor2++));
      }
      
      this.recordState(array, {
        type: 'gallop-advance',
        count: advanceCount,
        run: 2,
        message: `Galloped ${advanceCount} elements from run 2`
      });
    }
    
    return dest;
  }
  
  /**
   * Binary gallop search to find position for insertion
   * 
   * @param {Array} array - The array to search in
   * @param {*} key - The value to search for
   * @param {number} start - Start index
   * @param {number} len - Length to search
   * @param {boolean} isBuffer - Whether we're searching in the buffer
   * @returns {number} - Number of elements to advance
   */
  gallopSearch(array, key, start, len, isBuffer) {
    // Gallop by powers of 2 to find an upper bound
    let offset = 1;
    let lastOffset = 0;
    
    // When searching run1 (buffer), we're looking for the rightmost position
    // where buffer[pos] < key
    
    // When searching run2 (array), we're looking for the rightmost position
    // where array[pos] <= key (note the equality for stability)
    
    const compare = (a, b) => isBuffer ? this.compare(a, b) : this.compare(a, b) <= 0;
    
    // Find an offset that overshoots
    while (offset < len) {
      const pos = start + offset - 1;
      const element = isBuffer ? array[pos] : this.read(array, pos);
      
      if (!compare(element, key)) {
        break;
      }
      
      lastOffset = offset;
      offset = Math.min(offset * 2, len);
    }
    
    // Cap the offset at the length
    offset = Math.min(offset, len);
    
    // Binary search between the last good offset and current offset
    let low = start + lastOffset - 1;
    let high = start + offset - 1;
    
    while (low <= high) {
      const mid = low + ((high - low) >> 1);
      const element = isBuffer ? array[mid] : this.read(array, mid);
      
      if (compare(element, key)) {
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }
    
    return low - start;
  }
  
  /**
   * Get the time and space complexity of Tim Sort
   * 
   * @returns {Object} - Complexity information
   */
  getComplexity() {
    return {
      time: {
        best: 'O(n)',
        average: 'O(n log n)',
        worst: 'O(n log n)'
      },
      space: {
        best: 'O(n)',
        average: 'O(n)',
        worst: 'O(n)'
      }
    };
  }
  
  /**
   * Whether Tim Sort is stable
   * 
   * @returns {boolean} - True as Tim Sort is stable
   */
  isStable() {
    return true;
  }
  
  /**
   * Whether Tim Sort is in-place
   * 
   * @returns {boolean} - False as Tim Sort uses auxiliary space
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
    
    // Add Tim Sort specific information
    info.optimization = {
      minRun: this.options.minRun,
      useGalloping: this.options.useGalloping,
      useNaturalRuns: this.options.useNaturalRuns,
      gallopingThreshold: this.options.gallopingThreshold
    };
    
    info.properties = {
      comparisonBased: true,
      stable: true,
      inPlace: false,
      online: false,
      adaptive: true,
      natural: true,
      hybrid: true
    };
    
    info.suitable = {
      smallArrays: true,
      nearlySortedArrays: true,
      largeArrays: true,
      realWorldData: true
    };
    
    info.variants = [
      'Standard Tim Sort',
      'Python\'s Tim Sort implementation',
      'Java\'s Tim Sort implementation',
      'Android\'s DualPivotQuicksort (hybrid with similarities to Tim Sort)'
    ];
    
    info.advantages = [
      'Excellent real-world performance',
      'Handles ordered subsequences (runs) very efficiently',
      'Stable sorting (preserves order of equal elements)',
      'Adaptive to input patterns',
      'O(n) best case for already sorted or nearly sorted data',
      'Used in production libraries (Python, Java)'
    ];
    
    info.disadvantages = [
      'More complex implementation than basic sorting algorithms',
      'Requires O(n) auxiliary space',
      'Slightly higher constant factors than some simpler algorithms',
      'Less cache-efficient than in-place algorithms for some workloads'
    ];
    
    info.citations = [
      {
        author: 'Tim Peters',
        title: 'TimSort implementation in Python',
        year: 2002,
        reference: 'Python 2.3 and later'
      }
    ];
    
    return info;
  }
}

export default TimSort;