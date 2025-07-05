// src/algorithms/comparison/bogo.js

import Algorithm from '../core/algorithm-base';

/**
 * Implementation of Bogo Sort (also known as Permutation Sort, Stupid Sort, or Slowsort).
 * 
 * Bogo Sort is a highly inefficient sorting algorithm based on randomly generating permutations
 * of the input array until finding one that is sorted. It serves primarily as an educational
 * example of an exceptionally inefficient algorithm with probabilistic runtime analysis.
 * 
 * Mathematical Foundation:
 * ------------------------
 * The algorithm's expected running time can be calculated using probability theory:
 * - For n elements, there are n! possible permutations
 * - Only one permutation is correctly sorted
 * - The probability of randomly generating the sorted permutation is 1/n!
 * - Using geometric distribution, the expected number of iterations is n!
 * - Each iteration requires O(n) time to check if sorted and generate a new permutation
 * - Therefore, the expected running time is O(n × n!)
 * 
 * Educational Progression Levels:
 * -----------------------------
 * L1: Understanding the concept of permutations and checking for sortedness
 * L2: Analyzing the probability aspects of random permutation generation
 * L3: Calculating the expected runtime using mathematical foundations
 * L4: Comparing with deterministic algorithms to understand efficiency concepts
 * L5: Exploring the implications for computational complexity theory
 * 
 * @class BogoSort
 * @extends Algorithm
 */
class BogoSort extends Algorithm {
  /**
   * Create a new BogoSort instance
   * 
   * @param {Object} options - Configuration options
   * @param {boolean} [options.detailedPermutations=true] - Track detailed permutation information
   * @param {boolean} [options.optimizedShuffle=true] - Use optimized Fisher-Yates shuffle
   * @param {boolean} [options.deterministicSeed=false] - Use deterministic random seed (for educational reproducibility)
   * @param {number} [options.maxIterations=1000] - Maximum number of iterations before giving up
   */
  constructor(options = {}) {
    super('Bogo Sort', 'comparison', options);
    
    // Default options
    this.options = {
      detailedPermutations: true,     // Track detailed permutation information
      optimizedShuffle: true,         // Use optimized Fisher-Yates shuffle
      deterministicSeed: false,       // Use deterministic random seed
      maxIterations: 1000,            // Maximum iterations before giving up
      provideLearningInsights: true,  // Provide educational insights
      ...options
    };
    
    // Random number generator with optional seed
    this.rng = this.options.deterministicSeed 
      ? this.createSeededRandom(123456789) // Fixed seed for reproducibility
      : Math.random;
      
    // Track the number of permutations generated
    this.permutationCount = 0;
  }
  
  /**
   * Execute Bogo Sort on the input array
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
    
    // Educational insight: probability calculation
    if (options.provideLearningInsights && n > 3) {
      const factorial = this.calculateFactorial(n);
      const probability = 1 / factorial;
      const expectedIterations = factorial;
      
      this.recordState(result, {
        type: 'educational',
        concept: 'probability',
        message: `For an array of ${n} elements:`,
        details: [
          `Total possible permutations: ${n}! = ${this.formatLargeNumber(factorial)}`,
          `Probability of randomly generating sorted array: 1/${this.formatLargeNumber(factorial)} ≈ ${probability.toExponential(6)}`,
          `Expected number of iterations: ${this.formatLargeNumber(expectedIterations)}`,
          `This highlights why Bogo Sort is impractical for arrays larger than size 10`
        ]
      });
    }
    
    this.setPhase('sorting');
    this.permutationCount = 0;
    
    // Record initial array state
    this.recordState(result, {
      type: 'initial',
      message: 'Starting Bogo Sort with initial array'
    });
    
    let iterations = 0;
    
    // Keep generating permutations until sorted or max iterations reached
    while (!this.isSorted(result) && iterations < options.maxIterations) {
      // Shuffle the array
      this.shuffle(result, options);
      iterations++;
      this.permutationCount++;
      
      // Record the permutation
      if (options.detailedPermutations) {
        this.recordState(result, {
          type: 'permutation',
          iteration: iterations,
          message: `Generated permutation #${iterations}`,
          isSorted: this.isSorted(result, false) // Check without recording
        });
      } else if (iterations % 10 === 0 || iterations < 10) {
        // Record fewer states for performance
        this.recordState(result, {
          type: 'progress',
          iteration: iterations,
          message: `Generated ${iterations} permutations so far`
        });
      }
      
      // Educational insight: demonstrate futility of large arrays
      if (options.provideLearningInsights && iterations === 100 && n > 7) {
        this.recordState(result, {
          type: 'educational',
          concept: 'computational-limits',
          message: 'Practical Limitation Demonstration:',
          details: [
            `After ${iterations} random permutations, probability suggests we've explored only ` +
            `${(iterations / this.calculateFactorial(n) * 100).toExponential(6)}% of possible arrangements`,
            'This illustrates why randomized approaches with exponential search spaces are impractical',
            'Compare with deterministic algorithms that guarantee O(n log n) complexity'
          ]
        });
      }
    }
    
    // Mark termination status
    if (this.isSorted(result)) {
      this.recordState(result, {
        type: 'sorted',
        indices: Array.from({ length: n }, (_, i) => i),
        iterations: iterations,
        message: `Array sorted after ${iterations} permutations`
      });
    } else {
      this.recordState(result, {
        type: 'timeout',
        iterations: iterations,
        message: `Maximum iterations (${options.maxIterations}) reached without finding sorted permutation`
      });
      
      // Educational insight: sorting manually for demonstration
      if (options.provideLearningInsights) {
        // Sort the array using a reliable method for educational purposes
        result.sort((a, b) => this.compare(a, b));
        
        this.recordState(result, {
          type: 'educational',
          concept: 'algorithm-selection',
          message: 'Key Learning Outcome:',
          details: [
            'Bogo Sort failed to sort the array within a reasonable time frame',
            'This demonstrates why algorithm selection is critical for practical applications',
            'Deterministic algorithms like Merge Sort, Quick Sort, or Heap Sort provide guaranteed performance',
            'For this demonstration, we've applied a deterministic sort to complete the visualization'
          ]
        });
      }
    }
    
    this.setPhase('completed');
    return result;
  }
  
  /**
   * Shuffle an array using Fisher-Yates algorithm
   * 
   * @param {Array} array - The array to shuffle
   * @param {Object} options - Runtime options
   */
  shuffle(array, options) {
    const n = array.length;
    
    if (options.optimizedShuffle) {
      // Optimized Fisher-Yates shuffle
      for (let i = n - 1; i > 0; i--) {
        // Generate a random index from 0 to i
        const j = Math.floor(this.rng() * (i + 1));
        
        // Swap elements at i and j
        this.swap(array, i, j);
      }
    } else {
      // Naive shuffle (less efficient but easier to understand)
      for (let i = 0; i < n; i++) {
        // Generate a random index from 0 to n-1
        const j = Math.floor(this.rng() * n);
        
        // Swap elements at i and j
        this.swap(array, i, j);
      }
    }
  }
  
  /**
   * Check if an array is sorted
   * 
   * @param {Array} array - The array to check
   * @param {boolean} record - Whether to record comparisons
   * @returns {boolean} - True if the array is sorted
   */
  isSorted(array, record = true) {
    for (let i = 1; i < array.length; i++) {
      // Check if current element is less than previous element
      if (record) {
        if (this.compare(array[i - 1], array[i]) > 0) {
          return false;
        }
      } else {
        // Don't record the comparison for efficiency
        if (array[i - 1] > array[i]) {
          return false;
        }
      }
    }
    return true;
  }
  
  /**
   * Create a seeded random number generator
   * 
   * @param {number} seed - Seed value
   * @returns {Function} - Seeded random function
   */
  createSeededRandom(seed) {
    return function() {
      // Simple LCG (Linear Congruential Generator)
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };
  }
  
  /**
   * Calculate factorial of n (n!)
   * 
   * @param {number} n - Input value
   * @returns {number} - n!
   */
  calculateFactorial(n) {
    if (n <= 1) return 1;
    
    let result = 1;
    for (let i = 2; i <= n; i++) {
      result *= i;
    }
    return result;
  }
  
  /**
   * Format large numbers for display
   * 
   * @param {number} num - Number to format
   * @returns {string} - Formatted number
   */
  formatLargeNumber(num) {
    if (num < 1000) return num.toString();
    
    if (num < 1000000) {
      return (num / 1000).toFixed(2) + 'K';
    }
    
    if (num < 1000000000) {
      return (num / 1000000).toFixed(2) + 'M';
    }
    
    if (num < 1000000000000) {
      return (num / 1000000000).toFixed(2) + 'B';
    }
    
    return num.toExponential(6);
  }
  
  /**
   * Get the time and space complexity of Bogo Sort
   * 
   * @returns {Object} - Complexity information
   */
  getComplexity() {
    return {
      time: {
        best: 'O(n)', // When already sorted (extremely unlikely)
        average: 'O(n × n!)', // Expected number of iterations is n!
        worst: 'Unbounded' // Theoretically could run forever
      },
      space: {
        best: 'O(1)',
        average: 'O(1)',
        worst: 'O(1)'
      }
    };
  }
  
  /**
   * Whether Bogo Sort is stable
   * 
   * @returns {boolean} - False as Bogo Sort is not stable
   */
  isStable() {
    return false;
  }
  
  /**
   * Whether Bogo Sort is in-place
   * 
   * @returns {boolean} - True as Bogo Sort is in-place
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
    
    // Add algorithm-specific information
    info.optimization = {
      detailedPermutations: this.options.detailedPermutations,
      optimizedShuffle: this.options.optimizedShuffle,
      deterministicSeed: this.options.deterministicSeed,
      maxIterations: this.options.maxIterations
    };
    
    info.properties = {
      comparisonBased: true,
      stable: false,
      inPlace: true,
      deterministic: false,
      probabilistic: true
    };
    
    info.suitable = {
      smallArrays: false,
      largeArrays: false,
      practicalUse: false,
      educationalContext: true
    };
    
    info.mathematicalFoundations = {
      probabilityModel: 'Uniform random permutation generation',
      expectedIterations: 'n! (factorial of array length)',
      worstCaseScenario: 'Unbounded (theoretically infinite)',
      convergenceProperties: 'Almost surely converges to the solution as iterations approach infinity'
    };
    
    info.learningObjectives = [
      {
        level: 'Foundational',
        concept: 'Permutation Generation',
        understanding: 'Learn how random permutations are generated and how to implement the Fisher-Yates shuffle'
      },
      {
        level: 'Intermediate',
        concept: 'Probability Theory',
        understanding: 'Calculate the probability of randomly generating a sorted permutation and understand expected running time'
      },
      {
        level: 'Advanced',
        concept: 'Algorithmic Efficiency',
        understanding: 'Compare randomized algorithms with deterministic approaches and understand complexity classes'
      },
      {
        level: 'Expert',
        concept: 'Computational Limitations',
        understanding: 'Explore the boundaries of computability and the practical limitations of randomized approaches'
      }
    ];
    
    info.reflectiveQuestions = [
      'How would the expected running time change if we only kept permutations that improved the number of elements in their correct positions?',
      'What mathematical principle explains why Bogo Sort becomes exponentially more inefficient as array size increases?',
      'How does Bogo Sort illustrate the difference between theoretical computability and practical feasibility?',
      'In what scenarios might randomized algorithms actually outperform deterministic ones, unlike Bogo Sort?'
    ];
    
    info.historicalContext = {
      origin: 'Created primarily as a joke or educational example',
      significance: 'Serves as a canonical example of an inefficient algorithm in computer science education',
      alternatives: 'Variants include Bogobogosort (recursively apply Bogo Sort) and Quantum Bogosort (theoretical joke algorithm)'
    };
    
    return info;
  }
}

export default BogoSort;