/**
 * @file algorithm-base.js
 * @module algorithms/core
 * @description Foundational abstract base class for all algorithmic implementations in the
 * visualization platform. Provides a standardized interface, comprehensive instrumentation,
 * and robust state management for algorithm execution and analysis.
 * @author Advanced Sorting Algorithm Visualization Platform Team
 * @copyright 2025
 */

/**
 * Abstract base class for all algorithms in the visualization platform.
 * Implements the Template Method design pattern, defining the skeleton of
 * algorithmic operations while allowing subclasses to override specific steps.
 * 
 * This architecture ensures consistent instrumentation, state tracking, and
 * visualization capabilities across all algorithm implementations while
 * maintaining separation of concerns between the algorithm logic and its
 * performance measurement.
 * 
 * @abstract
 * @class Algorithm
 */
class Algorithm {
  /**
   * Creates a new Algorithm instance with the specified parameters.
   * 
   * @param {string} name - Human-readable algorithm name
   * @param {string} category - Algorithmic classification category
   * @param {Object} [options={}] - Configuration options for the algorithm
   * @throws {TypeError} If name or category are not provided
   */
  constructor(name, category, options = {}) {
    // Parameter validation
    if (!name || typeof name !== 'string') {
      throw new TypeError('Algorithm name must be a non-empty string');
    }
    
    if (!category || typeof category !== 'string') {
      throw new TypeError('Algorithm category must be a non-empty string');
    }
    
    if (this.constructor === Algorithm) {
      throw new TypeError('Cannot instantiate abstract Algorithm class directly');
    }
    
    // Basic information
    this.name = name;
    this.category = category;
    
    // Default options with override support
    this.options = {
      trackMemoryAccess: true,    // Track memory access operations
      trackOperations: true,      // Track algorithmic operations
      recordHistory: true,        // Record state history for visualization
      animationSpeed: 1,          // Animation playback speed multiplier
      ...options                  // Override with provided options
    };
    
    // Initialize metrics tracking system
    this.metrics = {
      // Operation counts
      comparisons: 0,             // Number of element comparisons
      swaps: 0,                   // Number of element swaps
      reads: 0,                   // Number of read operations
      writes: 0,                  // Number of write operations
      memoryAccesses: 0,          // Total memory access operations (reads + writes)
      recursiveCalls: 0,          // Number of recursive function calls
      
      // Memory usage
      auxiliarySpace: 0,          // Peak additional memory used (bytes)
      
      // Performance timing
      startTime: 0,               // Execution start timestamp (ms)
      endTime: 0,                 // Execution end timestamp (ms)
      executionTime: 0,           // Total execution time (ms)
      
      // Advanced metrics
      branchMispredictions: 0,    // Estimated branch mispredictions
      cacheEfficiency: {          // Cache efficiency simulation
        hits: 0,
        misses: 0,
        hitRate: 0
      }
    };
    
    // State history for visualization and analysis
    this.history = [];            // Array of algorithm states for visualization
    this.currentStep = 0;         // Current step in visualization playback
    
    // Execution status flags
    this.isRunning = false;       // Whether algorithm is currently executing
    this.isPaused = false;        // Whether execution is paused (for step-by-step)
    this.isComplete = false;      // Whether execution has completed
    
    // Event listener registry (Observer pattern)
    this.eventListeners = {
      step: [],                   // Triggered on each visualization step
      comparison: [],             // Triggered on element comparison
      swap: [],                   // Triggered on element swap
      access: [],                 // Triggered on memory access
      complete: [],               // Triggered on execution completion
      phase: []                   // Triggered on algorithm phase change
    };
    
    // Current algorithm phase
    this.currentPhase = 'initialization';
  }
  
  /**
   * Resets the algorithm state and metrics to initial values.
   * Used before each new execution to ensure clean state.
   * 
   * @returns {Algorithm} The algorithm instance for method chaining
   */
  reset() {
    // Reset all metrics
    this.metrics = {
      comparisons: 0,
      swaps: 0,
      reads: 0,
      writes: 0,
      memoryAccesses: 0,
      recursiveCalls: 0,
      auxiliarySpace: 0,
      startTime: 0,
      endTime: 0,
      executionTime: 0,
      branchMispredictions: 0,
      cacheEfficiency: {
        hits: 0,
        misses: 0,
        hitRate: 0
      }
    };
    
    // Reset state
    this.history = [];
    this.currentStep = 0;
    this.isRunning = false;
    this.isPaused = false;
    this.isComplete = false;
    this.currentPhase = 'initialization';
    
    return this;
  }
  
  /**
   * Executes the algorithm on the provided input data.
   * This is the main public interface for algorithm execution.
   * Implements the Template Method pattern by defining the execution
   * workflow while delegating specific algorithm logic to the run() method.
   * 
   * @param {Array} array - The input array to process
   * @param {Object} [options={}] - Runtime options that override instance options
   * @returns {Array} The processed result array
   * @throws {Error} If execution fails
   */
  execute(array, options = {}) {
    try {
      // Reset algorithm state before execution
      this.reset();
      
      // Merge instance options with runtime options
      const mergedOptions = { ...this.options, ...options };
      
      // Set execution flags
      this.isRunning = true;
      
      // Start performance timer
      this.metrics.startTime = performance.now();
      
      // Create a defensive copy of the input array to avoid mutating the original
      const arrayCopy = Array.isArray(array) ? [...array] : Array.from(array);
      
      // Record initial state if history tracking is enabled
      if (mergedOptions.recordHistory) {
        this.recordState(arrayCopy, {
          type: 'initial',
          message: 'Initial array state'
        });
      }
      
      // Execute the specific algorithm implementation (delegated to subclasses)
      const result = this.run(arrayCopy, mergedOptions);
      
      // Stop performance timer and calculate metrics
      this.metrics.endTime = performance.now();
      this.metrics.executionTime = this.metrics.endTime - this.metrics.startTime;
      
      // Calculate cache efficiency ratio if applicable
      const { hits, misses } = this.metrics.cacheEfficiency;
      if (hits > 0 || misses > 0) {
        this.metrics.cacheEfficiency.hitRate = hits / (hits + misses);
      }
      
      // Update execution flags
      this.isRunning = false;
      this.isComplete = true;
      
      // Record final state if history tracking is enabled
      if (mergedOptions.recordHistory) {
        this.recordState(result, {
          type: 'final',
          message: 'Final processed state'
        });
      }
      
      // Emit execution completion event
      this.emit('complete', {
        metrics: this.metrics,
        result
      });
      
      return result;
    } catch (error) {
      // Set error state
      this.isRunning = false;
      this.isComplete = false;
      
      // Enhance error with algorithm context
      const contextError = new Error(
        `Execution of ${this.name} algorithm failed: ${error.message}`
      );
      contextError.originalError = error;
      contextError.algorithmName = this.name;
      contextError.algorithmCategory = this.category;
      
      // Rethrow enhanced error
      throw contextError;
    }
  }
  
  /**
   * Abstract method that implements the specific algorithm logic.
   * Must be overridden by concrete algorithm subclasses.
   * 
   * @abstract
   * @param {Array} array - The input array to process
   * @param {Object} options - Runtime options
   * @returns {Array} The processed array
   * @throws {Error} If not implemented by subclass
   */
  run(array, options) {
    throw new Error(`Method run() must be implemented by ${this.name} algorithm subclass`);
  }
  
  /**
   * Compare two elements with comprehensive instrumentation.
   * Serves as a standard comparison operation for all algorithms.
   * 
   * @param {*} a - First element
   * @param {*} b - Second element
   * @param {Function} [comparator=null] - Optional custom comparator function
   * @returns {number} - Negative if a < b, 0 if a === b, positive if a > b
   */
  compare(a, b, comparator = null) {
    // Increment comparison counter
    this.metrics.comparisons++;
    
    // Perform comparison
    let result;
    
    if (typeof comparator === 'function') {
      // Use custom comparator if provided
      result = comparator(a, b);
    } else {
      // Default comparison logic
      result = a < b ? -1 : (a > b ? 1 : 0);
    }
    
    // Simulate branch prediction
    // In a real CPU, branch predictors work best when branches are consistent
    // This is a simple model of misprediction for educational purposes
    if (this.metrics.comparisons > 1) {
      const lastComparisonResult = this._lastComparisonResult || 0;
      if (Math.sign(lastComparisonResult) !== Math.sign(result)) {
        this.metrics.branchMispredictions++;
      }
    }
    this._lastComparisonResult = result;
    
    // Emit comparison event
    this.emit('comparison', { a, b, result });
    
    return result;
  }
  
  /**
   * Swap two elements in an array with comprehensive instrumentation.
   * Serves as a standard swap operation for all algorithms.
   * 
   * @param {Array} array - The array to modify
   * @param {number} i - First index
   * @param {number} j - Second index
   * @throws {RangeError} If either index is out of bounds
   */
  swap(array, i, j) {
    // Validate indices
    if (i < 0 || i >= array.length || j < 0 || j >= array.length) {
      throw new RangeError(`Swap indices (${i}, ${j}) out of bounds for array of length ${array.length}`);
    }
    
    // Skip redundant swap of same index
    if (i === j) return;
    
    // Update metrics
    this.metrics.swaps++;
    this.metrics.writes += 2;
    this.metrics.reads += 2;
    this.metrics.memoryAccesses += 4;
    
    // Perform the swap
    const temp = array[i];
    array[i] = array[j];
    array[j] = temp;
    
    // Emit swap event
    this.emit('swap', { 
      array, 
      indices: [i, j], 
      values: [array[i], array[j]] 
    });
  }
  
  /**
   * Read a value from an array with instrumentation.
   * Serves as a standard read operation for all algorithms.
   * 
   * @param {Array} array - The array to read from
   * @param {number} index - The index to read
   * @returns {*} The value at the specified index
   * @throws {RangeError} If the index is out of bounds
   */
  read(array, index) {
    // Validate index
    if (index < 0 || index >= array.length) {
      throw new RangeError(`Read index ${index} out of bounds for array of length ${array.length}`);
    }
    
    // Update metrics
    this.metrics.reads++;
    this.metrics.memoryAccesses++;
    
    // Simulate cache behavior
    this._simulateCacheAccess(index);
    
    // Perform the read
    const value = array[index];
    
    // Emit access event
    this.emit('access', { type: 'read', index, value });
    
    return value;
  }
  
  /**
   * Write a value to an array with instrumentation.
   * Serves as a standard write operation for all algorithms.
   * 
   * @param {Array} array - The array to write to
   * @param {number} index - The index to write
   * @param {*} value - The value to write
   * @throws {RangeError} If the index is out of bounds
   */
  write(array, index, value) {
    // Validate index
    if (index < 0 || index >= array.length) {
      throw new RangeError(`Write index ${index} out of bounds for array of length ${array.length}`);
    }
    
    // Update metrics
    this.metrics.writes++;
    this.metrics.memoryAccesses++;
    
    // Simulate cache behavior
    this._simulateCacheAccess(index);
    
    // Perform the write
    array[index] = value;
    
    // Emit access event
    this.emit('access', { type: 'write', index, value });
  }
  
  /**
   * Record the current algorithm state for visualization and analysis.
   * 
   * @param {Array} array - The current array state
   * @param {Object} [metadata={}] - Additional information about this state
   */
  recordState(array, metadata = {}) {
    // Skip if history recording is disabled
    if (!this.options.recordHistory) return;
    
    // Create state snapshot with current metrics
    const state = {
      array: [...array],                // Defensive copy of array
      metrics: { ...this.metrics },     // Copy of current metrics
      timestamp: performance.now(),     // Precise timestamp
      phase: this.currentPhase,         // Current algorithm phase
      ...metadata                       // Additional metadata
    };
    
    // Add to history
    this.history.push(state);
    
    // Emit step event
    this.emit('step', { 
      step: this.history.length - 1,
      state: state
    });
  }
  
  /**
   * Set the current phase of the algorithm execution.
   * Useful for tracking major stages in algorithm progress.
   * 
   * @param {string} phase - The current algorithm phase
   */
  setPhase(phase) {
    if (phase === this.currentPhase) return;
    
    const previousPhase = this.currentPhase;
    this.currentPhase = phase;
    
    // Emit phase change event
    this.emit('phase', {
      from: previousPhase,
      to: phase,
      timestamp: performance.now()
    });
  }
  
  /**
   * Get a specific step from the algorithm history.
   * 
   * @param {number} stepIndex - The step index to retrieve
   * @returns {Object|null} The state at the requested step or null if invalid
   */
  getStep(stepIndex) {
    if (stepIndex < 0 || stepIndex >= this.history.length) {
      return null;
    }
    
    this.currentStep = stepIndex;
    return this.history[stepIndex];
  }
  
  /**
   * Register an event listener
   * 
   * @param {string} event - The event name to listen for
   * @param {Function} callback - The callback function to execute
   * @returns {Algorithm} The algorithm instance for method chaining
   * @throws {TypeError} If event type is invalid or callback is not a function
   */
  on(event, callback) {
    // Validate parameters
    if (!this.eventListeners.hasOwnProperty(event)) {
      throw new TypeError(`Invalid event type: ${event}. Valid events are: ${Object.keys(this.eventListeners).join(', ')}`);
    }
    
    if (typeof callback !== 'function') {
      throw new TypeError('Event callback must be a function');
    }
    
    // Register callback
    this.eventListeners[event].push(callback);
    
    return this;
  }
  
  /**
   * Trigger an event and execute all registered listeners
   * 
   * @param {string} event - The event name to trigger
   * @param {*} data - Event data to pass to listeners
   */
  emit(event, data) {
    // Skip if event type is invalid
    if (!this.eventListeners.hasOwnProperty(event)) return;
    
    // Execute all registered callbacks
    for (const callback of this.eventListeners[event]) {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in ${event} event listener:`, error);
      }
    }
  }
  
  /**
   * Get comprehensive algorithm information for display and analysis
   * 
   * @returns {Object} Algorithm metadata and performance characteristics
   */
  getInfo() {
    return {
      name: this.name,
      category: this.category,
      metrics: { ...this.metrics },
      complexity: this.getComplexity(),
      stability: this.isStable(),
      inPlace: this.isInPlace(),
      options: { ...this.options },
      history: {
        steps: this.history.length,
        currentStep: this.currentStep
      },
      status: {
        isRunning: this.isRunning,
        isPaused: this.isPaused,
        isComplete: this.isComplete,
        currentPhase: this.currentPhase
      }
    };
  }
  
  /**
   * Get algorithm metrics
   * 
   * @returns {Object} Current performance metrics
   */
  getMetrics() {
    return { ...this.metrics };
  }
  
  /**
   * Get the time and space complexity of the algorithm.
   * Must be overridden by subclasses with accurate complexity analysis.
   * 
   * @abstract
   * @returns {Object} Complexity information
   */
  getComplexity() {
    return {
      time: {
        best: 'O(?)',
        average: 'O(?)',
        worst: 'O(?)'
      },
      space: {
        best: 'O(?)',
        average: 'O(?)',
        worst: 'O(?)'
      }
    };
  }
  
  /**
   * Whether the algorithm is stable (preserves relative order of equal elements).
   * Must be overridden by subclasses with accurate stability analysis.
   * 
   * @abstract
   * @returns {boolean} True if the algorithm is stable
   */
  isStable() {
    return false;
  }
  
  /**
   * Whether the algorithm is in-place (uses O(1) auxiliary space).
   * Must be overridden by subclasses with accurate space complexity analysis.
   * 
   * @abstract
   * @returns {boolean} True if the algorithm is in-place
   */
  isInPlace() {
    return false;
  }
  
  /**
   * Simulate cache behavior for memory access
   * This is a simplified model for educational purposes
   * 
   * @private
   * @param {number} index - The array index being accessed
   */
  _simulateCacheAccess(index) {
    // Simple cache model using the last 8 accessed indices
    if (!this._cacheModel) {
      this._cacheModel = new Set();
    }
    
    // Check if index is in cache
    if (this._cacheModel.has(index)) {
      // Cache hit
      this.metrics.cacheEfficiency.hits++;
    } else {
      // Cache miss
      this.metrics.cacheEfficiency.misses++;
      
      // Add to cache, evicting if necessary (LRU approximation)
      if (this._cacheModel.size >= 8) {
        // Evict oldest entry (using Set iteration order as approximation)
        const oldest = this._cacheModel.values().next().value;
        this._cacheModel.delete(oldest);
      }
      
      this._cacheModel.add(index);
    }
  }
}

export default Algorithm;