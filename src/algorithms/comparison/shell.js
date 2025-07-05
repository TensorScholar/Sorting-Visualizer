// src/algorithms/comparison/shell.js

import Algorithm from '../core/algorithm-base';

/**
 * Implementation of Shell Sort with multiple gap sequence strategies and optimizations.
 * 
 * Shell Sort is a generalization of insertion sort that allows the exchange of items that are
 * far apart. The algorithm sorts elements that are distant from each other, gradually reducing
 * the gap between elements to be compared until the gap is 1 (regular insertion sort).
 * 
 * This implementation includes multiple gap sequences and optimizations:
 * - Original Shell sequence: N/2, N/4, ..., 1
 * - Knuth sequence: (3^k - 1)/2, where k ≥ 1 and (3^k - 1)/2 < N
 * - Sedgewick sequence: 1, 8, 23, 77, 281, 1073, 4193, 16577, ...
 * - Hibbard sequence: 2^k - 1, where k ≥ 1
 * - Pratt sequence: 2^i * 3^j, where i,j ≥ 0
 * 
 * Time Complexity:
 * - Best:    O(n log n) - Depends on gap sequence
 * - Average: O(n log² n) to O(n^(4/3)) depending on gap sequence
 * - Worst:   O(n²) for original Shell sequence, O(n^(3/2)) for Hibbard
 * 
 * Space Complexity: O(1) - In-place sorting algorithm
 * 
 * @class ShellSort
 * @extends Algorithm
 */
class ShellSort extends Algorithm {
  /**
   * Create a new ShellSort instance with configurable options
   * 
   * @param {Object} options - Configuration options
   * @param {string} [options.gapSequence='sedgewick'] - Gap sequence to use
   * @param {boolean} [options.optimizedComparisons=true] - Use binary search for large gaps
   * @param {boolean} [options.visualizeGaps=true] - Visualize gap sequences
   * @param {boolean} [options.enhancedInstrumentation=true] - Use enhanced operation instrumentation
   */
  constructor(options = {}) {
    super('Shell Sort', 'comparison', options);
    
    // Default options
    this.options = {
      gapSequence: 'sedgewick',     // Gap sequence strategy
      optimizedComparisons: true,   // Use optimized comparisons
      visualizeGaps: true,          // Visualize gap sequences
      enhancedInstrumentation: true, // Enhanced operation instrumentation
      ...options
    };
    
    // Gap sequence generators
    this.gapGenerators = {
      'shell': this.shellSequence,
      'knuth': this.knuthSequence,
      'sedgewick': this.sedgewickSequence,
      'hibbard': this.hibbardSequence,
      'pratt': this.prattSequence
    };
  }
  
  /**
   * Execute Shell Sort on the input array
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
    
    this.setPhase('sorting');
    
    // Get gap sequence
    const gapSequenceName = options.gapSequence || 'sedgewick';
    const gapGenerator = this.gapGenerators[gapSequenceName.toLowerCase()] || this.gapGenerators.sedgewick;
    
    // Generate gaps
    const gaps = gapGenerator(n);
    
    // Record the selected gap sequence
    this.recordState(result, {
      type: 'gap-sequence-selected',
      sequence: gapSequenceName,
      gaps: gaps,
      message: `Using ${gapSequenceName} gap sequence: [${gaps.join(', ')}]`
    });
    
    // For each gap in the sequence
    for (let g = 0; g < gaps.length; g++) {
      const gap = gaps[g];
      
      // Record current gap
      if (options.visualizeGaps) {
        this.recordState(result, {
          type: 'gap-change',
          gap: gap,
          message: `Processing elements with gap ${gap}`
        });
      }
      
      // Perform an insertion sort for elements at the current gap
      for (let i = gap; i < n; i++) {
        // Store current element
        const temp = this.read(result, i);
        let j = i;
        
        // Optimization: Use binary search for finding insertion position for large gaps
        if (options.optimizedComparisons && gap > 10) {
          // Find insertion position with binary search
          const insertPos = this.binarySearchInsertionPos(result, temp, i - gap, gap);
          
          // Shift elements to the right
          if (insertPos < i) {
            for (let k = i; k >= insertPos + gap; k -= gap) {
              this.write(result, k, this.read(result, k - gap));
              
              // Record shift with large gap
              if (options.enhancedInstrumentation) {
                this.recordState(result, {
                  type: 'gap-shift',
                  source: k - gap,
                  target: k,
                  gap: gap,
                  message: `Shifted element ${result[k]} from position ${k-gap} to ${k} (gap = ${gap})`
                });
              }
            }
            
            // Insert at correct position
            this.write(result, insertPos, temp);
            
            // Record insertion
            this.recordState(result, {
              type: 'gap-insert',
              position: insertPos,
              value: temp,
              gap: gap,
              message: `Inserted element ${temp} at position ${insertPos} (gap = ${gap})`
            });
          }
        } else {
          // Standard comparison-based gap insertion
          while (j >= gap && this.compare(this.read(result, j - gap), temp) > 0) {
            // Record comparison
            if (options.enhancedInstrumentation) {
              this.recordState(result, {
                type: 'gap-comparison',
                indices: [j - gap, i],
                values: [result[j - gap], temp],
                gap: gap,
                message: `Comparing elements at positions ${j-gap} and ${i} with gap ${gap}`
              });
            }
            
            // Shift element right by gap
            this.write(result, j, this.read(result, j - gap));
            
            // Record shift
            if (options.enhancedInstrumentation) {
              this.recordState(result, {
                type: 'gap-shift',
                source: j - gap,
                target: j,
                gap: gap,
                message: `Shifted element ${result[j]} from position ${j-gap} to ${j} (gap = ${gap})`
              });
            }
            
            j -= gap;
          }
          
          // Put temp in its correct position
          if (j !== i) {
            this.write(result, j, temp);
            
            // Record insertion
            this.recordState(result, {
              type: 'gap-insert',
              position: j,
              value: temp,
              gap: gap,
              message: `Inserted element ${temp} at position ${j} (gap = ${gap})`
            });
          }
        }
      }
      
      // Record completion of current gap phase
      this.recordState(result, {
        type: 'gap-complete',
        gap: gap,
        message: `Completed sorting with gap ${gap}`
      });
    }
    
    this.setPhase('completed');
    return result;
  }
  
  /**
   * Find insertion position using binary search for a given gap
   * This optimization reduces comparisons for large gaps
   * 
   * @param {Array} array - Array to search
   * @param {*} key - Value to insert
   * @param {number} end - End index (inclusive)
   * @param {number} gap - Current gap
   * @returns {number} - Index where key should be inserted
   */
  binarySearchInsertionPos(array, key, end, gap) {
    let start = 0;
    
    // Binary search on the gap-separated subarray
    while (start <= end) {
      const mid = Math.floor((start + end) / 2);
      const midIndex = mid * gap;
      
      const cmp = this.compare(array[midIndex], key);
      
      if (cmp < 0) {
        start = mid + 1;
      } else if (cmp > 0) {
        end = mid - 1;
      } else {
        // Found an equal element, insert after it (stable)
        return midIndex + gap;
      }
    }
    
    return start * gap;
  }
  
  /**
   * Generate Shell's original gap sequence: N/2, N/4, ..., 1
   * 
   * @param {number} n - Array length
   * @returns {Array} - Gap sequence
   */
  shellSequence(n) {
    const gaps = [];
    let gap = Math.floor(n / 2);
    
    while (gap > 0) {
      gaps.push(gap);
      gap = Math.floor(gap / 2);
    }
    
    return gaps;
  }
  
  /**
   * Generate Knuth's gap sequence: (3^k - 1)/2, where k ≥ 1 and (3^k - 1)/2 < N
   * 
   * @param {number} n - Array length
   * @returns {Array} - Gap sequence
   */
  knuthSequence(n) {
    const gaps = [];
    let gap = 1;
    
    // Generate sequence in ascending order first
    while (gap < n / 3) {
      gap = 3 * gap + 1;
    }
    
    // Add in descending order
    while (gap > 0) {
      gaps.push(gap);
      gap = Math.floor(gap / 3);
    }
    
    return gaps;
  }
  
  /**
   * Generate Sedgewick's gap sequence
   * 1, 8, 23, 77, 281, 1073, 4193, 16577, ...
   * 
   * @param {number} n - Array length
   * @returns {Array} - Gap sequence
   */
  sedgewickSequence(n) {
    const gaps = [];
    let k = 0;
    let gap = 0;
    
    // Generate sequence in ascending order first
    do {
      if (k % 2 === 0) {
        gap = 9 * Math.pow(4, Math.floor(k / 2)) - 9 * Math.pow(2, Math.floor(k / 2)) + 1;
      } else {
        gap = Math.pow(4, Math.floor(k / 2 + 1)) - 3 * Math.pow(2, Math.floor(k / 2)) + 1;
      }
      
      if (gap < n) {
        gaps.push(gap);
      }
      
      k++;
    } while (gap < n);
    
    // Reverse to get descending sequence
    return gaps.reverse();
  }
  
  /**
   * Generate Hibbard's gap sequence: 2^k - 1, where k ≥ 1
   * 1, 3, 7, 15, 31, 63, 127, 255, ...
   * 
   * @param {number} n - Array length
   * @returns {Array} - Gap sequence
   */
  hibbardSequence(n) {
    const gaps = [];
    let k = 1;
    let gap = Math.pow(2, k) - 1;
    
    // Generate sequence in ascending order first
    while (gap < n) {
      gaps.push(gap);
      k++;
      gap = Math.pow(2, k) - 1;
    }
    
    // Reverse to get descending sequence
    return gaps.reverse();
  }
  
  /**
   * Generate Pratt's gap sequence: 2^i * 3^j, where i,j ≥ 0
   * 1, 2, 3, 4, 6, 8, 9, 12, 16, 18, 24, 27, ...
   * 
   * @param {number} n - Array length
   * @returns {Array} - Gap sequence
   */
  prattSequence(n) {
    const gaps = new Set([1]); // Use Set to avoid duplicates
    
    // Generate all possible 2^i * 3^j combinations
    for (let i = 0; i < 20; i++) {
      const powI = Math.pow(2, i);
      if (powI >= n) break;
      
      for (let j = 0; j < 15; j++) {
        const powJ = Math.pow(3, j);
        const gap = powI * powJ;
        
        if (gap < n) {
          gaps.add(gap);
        } else {
          break;
        }
      }
    }
    
    // Convert to array, sort, and reverse
    return Array.from(gaps).sort((a, b) => b - a);
  }
  
  /**
   * Get the time and space complexity of Shell Sort
   * 
   * @returns {Object} - Complexity information
   */
  getComplexity() {
    let timeWorst;
    let timeAverage;
    
    // Complexity depends on gap sequence
    switch (this.options.gapSequence.toLowerCase()) {
      case 'shell':
        timeWorst = 'O(n²)';
        timeAverage = 'O(n²)';
        break;
      case 'hibbard':
        timeWorst = 'O(n^(3/2))';
        timeAverage = 'O(n^(5/4))';
        break;
      case 'sedgewick':
        timeWorst = 'O(n^(4/3))';
        timeAverage = 'O(n^(4/3))';
        break;
      case 'knuth':
        timeWorst = 'O(n^(3/2))';
        timeAverage = 'O(n^(3/2))';
        break;
      case 'pratt':
        timeWorst = 'O(n log² n)';
        timeAverage = 'O(n log² n)';
        break;
      default:
        timeWorst = 'O(n²)';
        timeAverage = 'O(n log² n)';
    }
    
    return {
      time: {
        best: 'O(n log n)',
        average: timeAverage,
        worst: timeWorst
      },
      space: {
        best: 'O(1)',
        average: 'O(1)',
        worst: 'O(1)'
      }
    };
  }
  
  /**
   * Whether Shell Sort is stable
   * 
   * @returns {boolean} - False as Shell Sort is not stable
   */
  isStable() {
    return false;
  }
  
  /**
   * Whether Shell Sort is in-place
   * 
   * @returns {boolean} - True as Shell Sort is in-place
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
    
    // Add shell sort specific information
    info.optimization = {
      gapSequence: this.options.gapSequence,
      optimizedComparisons: this.options.optimizedComparisons,
      visualizeGaps: this.options.visualizeGaps,
      enhancedInstrumentation: this.options.enhancedInstrumentation
    };
    
    info.properties = {
      comparisonBased: true,
      stable: false,
      inPlace: true,
      adaptive: true,
      online: false
    };
    
    info.suitable = {
      smallArrays: true,
      mediumArrays: true,
      nearlySortedArrays: true,
      largeArrays: false,
      limitedMemory: true
    };
    
    info.gapSequences = {
      shell: {
        description: "Original Shell sequence: N/2, N/4, ..., 1",
        complexity: "O(n²)",
        formula: "floor(n/2^k)"
      },
      knuth: {
        description: "Knuth sequence: (3^k - 1)/2",
        complexity: "O(n^(3/2))",
        formula: "floor((3^k - 1) / 2)"
      },
      sedgewick: {
        description: "Sedgewick's sequence: 1, 8, 23, 77, 281, 1073, ...",
        complexity: "O(n^(4/3))",
        formula: "4^k + 3*2^(k-1) + 1 or 9*4^k - 9*2^k + 1"
      },
      hibbard: {
        description: "Hibbard's sequence: 2^k - 1",
        complexity: "O(n^(3/2))",
        formula: "2^k - 1"
      },
      pratt: {
        description: "Pratt's sequence: 2^i * 3^j where i,j ≥ 0",
        complexity: "O(n log² n)",
        formula: "2^i * 3^j"
      }
    };
    
    info.advantages = [
      "Improved version of insertion sort with better performance",
      "In-place algorithm with O(1) space complexity",
      "Simple implementation with few lines of code",
      "Excellent for medium-sized arrays (few hundred to few thousand elements)",
      "Adaptive to partially sorted arrays",
      "Performs well on arrays that are already partially sorted"
    ];
    
    info.disadvantages = [
      "Not stable (does not preserve order of equal elements)",
      "Complexity heavily depends on gap sequence chosen",
      "Performance not competitive with quicksort or mergesort for large arrays",
      "Gap sequence selection requires careful consideration"
    ];
    
    info.historyAndContext = {
      inventor: "Donald Shell",
      year: 1959,
      significance: "First algorithm to improve insertion sort from O(n²) complexity",
      developmentContext: "Shell published the algorithm in the Communications of the ACM, " +
        "proposing it as a significant improvement over existing sorting methods"
    };
    
    return info;
  }
}

export default ShellSort;