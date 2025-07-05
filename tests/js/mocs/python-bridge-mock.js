/**
 * @file python-bridge.js
 * @description Mock implementation of the Python-JavaScript bridge for testing algorithm execution
 * without requiring the actual Python backend. This allows testing the frontend visualization
 * components with simulated Python algorithm execution results.
 * 
 * @module tests/__mocks__/python-bridge
 * @author Advanced Sorting Algorithm Visualization Platform Team
 * @version 1.0.0
 * @license MIT
 */

/**
 * Simulated Python algorithm execution result
 * @typedef {Object} AlgorithmExecutionResult
 * @property {Array} result - The sorted array
 * @property {Object} metrics - Performance metrics for the algorithm execution
 * @property {Array} history - Array of algorithm state snapshots for visualization
 */

/**
 * Simulated Python algorithm step
 * @typedef {Object} AlgorithmStep
 * @property {Array} array - Current array state
 * @property {Object} metrics - Metrics at this step
 * @property {number} timestamp - Time when this step occurred
 * @property {string} type - Step type (e.g., 'comparison', 'swap', 'partition')
 * @property {string} message - Human-readable description of the step
 */

/**
 * Mock implementation of the Python-JavaScript bridge
 * Simulates Python algorithm executions for testing purposes
 */
class MockPythonJSBridge {
  /**
   * Create a new bridge mock instance
   * @param {Object} options - Configuration options
   * @param {boolean} options.simulateLatency - Whether to simulate network latency
   * @param {number} options.minLatency - Minimum latency in milliseconds
   * @param {number} options.maxLatency - Maximum latency in milliseconds
   * @param {boolean} options.simulateErrors - Whether to occasionally simulate errors
   * @param {number} options.errorRate - Rate of simulated errors (0-1)
   * @param {boolean} options.debug - Enable debug logging
   */
  constructor(options = {}) {
    this.options = {
      simulateLatency: true,
      minLatency: 50,
      maxLatency: 300,
      simulateErrors: false,
      errorRate: 0.05,
      debug: false,
      ...options
    };
    
    // Store pre-defined execution results for specific algorithms and inputs
    this.preDefinedResults = new Map();
    
    // History of mock executions for testing assertions
    this.executionHistory = [];
    
    // Initialize algorithm implementations
    this._initializeAlgorithmMocks();
  }
  
  /**
   * Initialize mock implementations for various sorting algorithms
   * @private
   */
  _initializeAlgorithmMocks() {
    // Map of algorithm name to implementation function
    this.algorithmImplementations = {
      'bubble-sort': this._mockBubbleSort.bind(this),
      'quick-sort': this._mockQuickSort.bind(this),
      'merge-sort': this._mockMergeSort.bind(this),
      'heap-sort': this._mockHeapSort.bind(this),
      'counting-sort': this._mockCountingSort.bind(this),
      'radix-sort': this._mockRadixSort.bind(this),
      'bucket-sort': this._mockBucketSort.bind(this),
      'selection-sort': this._mockSelectionSort.bind(this),
      'insertion-sort': this._mockInsertionSort.bind(this),
      'quick-select': this._mockQuickSelect.bind(this),
      // Add other algorithms as needed
    };
  }
  
  /**
   * Execute a Python algorithm implementation
   * @param {string} algorithmName - Name of the algorithm to execute
   * @param {Array} data - Input data array
   * @param {Object} options - Algorithm options
   * @returns {Promise<AlgorithmExecutionResult>} - Execution results
   */
  async executeAlgorithm(algorithmName, data, options = {}) {
    // Log execution request if debug is enabled
    if (this.options.debug) {
      console.log(`MockPythonJSBridge: Executing ${algorithmName} with ${data.length} elements`);
    }
    
    // Record this execution attempt
    this.executionHistory.push({
      algorithm: algorithmName,
      dataLength: data.length,
      options,
      timestamp: Date.now()
    });
    
    // Simulate potential errors
    if (this.options.simulateErrors && Math.random() < this.options.errorRate) {
      await this._simulateLatency();
      throw new Error(`Mock Python execution failed for ${algorithmName}: Simulated random error`);
    }
    
    // Check for pre-defined results for this algorithm and input
    const resultKey = this._getResultKey(algorithmName, data, options);
    if (this.preDefinedResults.has(resultKey)) {
      const result = this.preDefinedResults.get(resultKey);
      await this._simulateLatency();
      return { ...result }; // Return a copy to prevent modification
    }
    
    // If no pre-defined result, generate mock execution result
    let result;
    try {
      // Get the mock implementation for this algorithm
      const implementationFn = this.algorithmImplementations[algorithmName];
      if (!implementationFn) {
        throw new Error(`No mock implementation for algorithm: ${algorithmName}`);
      }
      
      // Execute the mock implementation
      result = await implementationFn(data, options);
    } catch (error) {
      // Log error if debug is enabled
      if (this.options.debug) {
        console.error(`MockPythonJSBridge: Error executing ${algorithmName}:`, error);
      }
      throw error;
    }
    
    // Simulate network latency
    await this._simulateLatency();
    
    return result;
  }
  
  /**
   * Compare JavaScript and Python implementations of the same algorithm
   * @param {Object} jsAlgorithm - JavaScript algorithm instance
   * @param {string} algorithmName - Algorithm name for Python mapping
   * @param {Array} data - Input data array
   * @param {Object} options - Algorithm options
   * @returns {Promise<Object>} - Comparison results
   */
  async compareImplementations(jsAlgorithm, algorithmName, data, options = {}) {
    // Execute JavaScript implementation
    const jsStartTime = performance.now();
    const jsResult = jsAlgorithm.execute([...data], options);
    const jsEndTime = performance.now();
    const jsExecutionTime = jsEndTime - jsStartTime;
    
    // Execute mock Python implementation
    const pyResult = await this.executeAlgorithm(algorithmName, data, options);
    
    // Calculate accuracy (whether both implementations produce the same result)
    const sortedDataMatches = this._compareArrays(jsResult, pyResult.result);
    
    // Create comparison report
    return {
      algorithm: algorithmName,
      inputSize: data.length,
      javascript: {
        executionTime: jsExecutionTime,
        metrics: jsAlgorithm.metrics
      },
      python: {
        executionTime: pyResult.metrics.execution_time * 1000, // Convert to ms
        metrics: pyResult.metrics
      },
      comparison: {
        resultsMatch: sortedDataMatches,
        speedRatio: jsExecutionTime / (pyResult.metrics.execution_time * 1000),
        operationCounts: {
          comparisons: {
            js: jsAlgorithm.metrics.comparisons,
            py: pyResult.metrics.comparisons,
            difference: jsAlgorithm.metrics.comparisons - pyResult.metrics.comparisons
          },
          swaps: {
            js: jsAlgorithm.metrics.swaps,
            py: pyResult.metrics.swaps,
            difference: jsAlgorithm.metrics.swaps - pyResult.metrics.swaps
          }
        }
      },
      jsHistory: jsAlgorithm.history,
      pyHistory: pyResult.history
    };
  }
  
  /**
   * Extract algorithm state history from Python implementation for visualization
   * @param {string} algorithmName - Name of the algorithm
   * @param {Array} data - Input data array
   * @param {Object} options - Algorithm options
   * @returns {Promise<Array>} - Array of algorithm states for visualization
   */
  async getAlgorithmHistory(algorithmName, data, options = {}) {
    // Add history recording option
    const executionOptions = {
      ...options,
      record_history: true
    };
    
    // Execute algorithm with history recording
    const result = await this.executeAlgorithm(algorithmName, data, executionOptions);
    
    // Convert Python state history to JavaScript format
    return result.history.map(state => this._convertStateFormat(state));
  }
  
  /**
   * Set a pre-defined result for a specific algorithm and input combination
   * Useful for creating deterministic test scenarios
   * @param {string} algorithmName - Algorithm name
   * @param {Array} data - Input data array (or data length if exactMatch is false)
   * @param {Object} result - Result to return when this algorithm and input are used
   * @param {Object} options - Algorithm options
   * @param {boolean} exactMatch - Whether to require exact data array match or just length match
   */
  setPreDefinedResult(algorithmName, data, result, options = {}, exactMatch = false) {
    const key = exactMatch 
      ? this._getExactResultKey(algorithmName, data, options)
      : this._getResultKey(algorithmName, data, options);
    
    this.preDefinedResults.set(key, { ...result }); // Store a copy to prevent modification
  }
  
  /**
   * Reset all pre-defined results
   */
  resetPreDefinedResults() {
    this.preDefinedResults.clear();
  }
  
  /**
   * Clear execution history
   */
  clearExecutionHistory() {
    this.executionHistory = [];
  }
  
  /**
   * Generate a key for pre-defined results lookup based on algorithm and data length
   * @param {string} algorithmName - Algorithm name
   * @param {Array} data - Input data array
   * @param {Object} options - Algorithm options
   * @returns {string} - Lookup key
   * @private
   */
  _getResultKey(algorithmName, data, options) {
    const dataLength = Array.isArray(data) ? data.length : data;
    const optionsStr = JSON.stringify(options);
    return `${algorithmName}:${dataLength}:${optionsStr}`;
  }
  
  /**
   * Generate a key for pre-defined results lookup based on exact data array
   * @param {string} algorithmName - Algorithm name
   * @param {Array} data - Input data array
   * @param {Object} options - Algorithm options
   * @returns {string} - Lookup key
   * @private
   */
  _getExactResultKey(algorithmName, data, options) {
    const dataStr = JSON.stringify(data);
    const optionsStr = JSON.stringify(options);
    return `${algorithmName}:${dataStr}:${optionsStr}`;
  }
  
  /**
   * Simulate network latency for more realistic mocking
   * @returns {Promise<void>} Promise that resolves after the simulated latency
   * @private
   */
  _simulateLatency() {
    if (!this.options.simulateLatency) {
      return Promise.resolve();
    }
    
    const latency = Math.random() * 
      (this.options.maxLatency - this.options.minLatency) + 
      this.options.minLatency;
    
    return new Promise(resolve => setTimeout(resolve, latency));
  }
  
  /**
   * Compare two arrays for equality
   * @param {Array} arr1 - First array
   * @param {Array} arr2 - Second array
   * @returns {boolean} - True if arrays have the same elements in the same order
   * @private
   */
  _compareArrays(arr1, arr2) {
    if (arr1.length !== arr2.length) {
      return false;
    }
    
    for (let i = 0; i < arr1.length; i++) {
      if (arr1[i] !== arr2[i]) {
        return false;
      }
    }
    
    return true;
  }
  
  /**
   * Convert Python state format to JavaScript format
   * @param {Object} state - Python state object
   * @returns {Object} - JavaScript format state object
   * @private
   */
  _convertStateFormat(state) {
    // Convert snake_case keys to camelCase
    const convertKey = (key) => key.replace(/_([a-z])/g, (m, p1) => p1.toUpperCase());
    
    const result = {};
    
    for (const [key, value] of Object.entries(state)) {
      const jsKey = convertKey(key);
      
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        result[jsKey] = this._convertStateFormat(value);
      } else {
        result[jsKey] = value;
      }
    }
    
    return result;
  }
  
  /**
   * Generate metrics for mock algorithm execution
   * @param {number} comparisons - Number of comparisons
   * @param {number} swaps - Number of swaps
   * @param {number} reads - Number of reads
   * @param {number} writes - Number of writes
   * @param {number} executionTime - Execution time in seconds
   * @returns {Object} - Metrics object
   * @private
   */
  _generateMetrics(comparisons, swaps, reads, writes, executionTime) {
    return {
      comparisons,
      swaps,
      reads,
      writes,
      memory_accesses: reads + writes,
      recursive_calls: 0, // Default value
      auxiliary_space: 0, // Default value
      start_time: Date.now() / 1000 - executionTime,
      end_time: Date.now() / 1000,
      execution_time: executionTime
    };
  }
  
  /**
   * Generate a mock history step
   * @param {Array} array - Current array state
   * @param {Object} metrics - Current metrics
   * @param {string} type - Step type
   * @param {string} message - Step message
   * @param {Object} additionalData - Additional step data
   * @returns {AlgorithmStep} - Algorithm step object
   * @private
   */
  _generateHistoryStep(array, metrics, type, message, additionalData = {}) {
    return {
      array: [...array],
      metrics: { ...metrics },
      timestamp: Date.now() / 1000,
      type,
      message,
      ...additionalData
    };
  }
  
  /******************************************************************************
   * Mock Algorithm Implementations
   * 
   * Each of these functions simulates the execution of a Python algorithm
   * and returns a structure similar to what would be returned by the Python
   * implementation, including sorted result, metrics, and execution history.
   ******************************************************************************/
  
  /**
   * Mock Bubble Sort implementation
   * @param {Array} data - Input data array
   * @param {Object} options - Algorithm options
   * @returns {AlgorithmExecutionResult} - Execution results
   * @private
   */
  _mockBubbleSort(data, options) {
    // Create a copy of the input data
    const array = [...data];
    const n = array.length;
    
    // Initialize metrics and history
    const startTime = performance.now();
    let comparisons = 0;
    let swaps = 0;
    let reads = 0;
    let writes = 0;
    
    // Create history array with initial state
    const history = [];
    
    // Add initial state to history
    const initialMetrics = this._generateMetrics(0, 0, 0, 0, 0);
    history.push(this._generateHistoryStep(
      array, initialMetrics, 'initial', 'Initial array state'
    ));
    
    // Bubble sort algorithm with history recording
    for (let i = 0; i < n; i++) {
      let swapped = false;
      
      for (let j = 0; j < n - i - 1; j++) {
        // Read elements for comparison
        const a = array[j];
        const b = array[j + 1];
        reads += 2;
        
        // Record comparison step
        comparisons++;
        
        // Add comparison step to history
        const comparisonMetrics = this._generateMetrics(
          comparisons, swaps, reads, writes, (performance.now() - startTime) / 1000
        );
        history.push(this._generateHistoryStep(
          array, 
          comparisonMetrics, 
          'comparison', 
          `Comparing elements at indices ${j} and ${j+1}`,
          { indices: [j, j+1] }
        ));
        
        // Compare and swap if needed
        if (a > b) {
          // Swap elements
          array[j] = b;
          array[j + 1] = a;
          writes += 2;
          swaps++;
          swapped = true;
          
          // Add swap step to history
          const swapMetrics = this._generateMetrics(
            comparisons, swaps, reads, writes, (performance.now() - startTime) / 1000
          );
          history.push(this._generateHistoryStep(
            array, 
            swapMetrics, 
            'swap', 
            `Swapped elements at indices ${j} and ${j+1}`,
            { indices: [j, j+1] }
          ));
        }
      }
      
      // Mark last element as sorted
      const sortedMetrics = this._generateMetrics(
        comparisons, swaps, reads, writes, (performance.now() - startTime) / 1000
      );
      history.push(this._generateHistoryStep(
        array, 
        sortedMetrics, 
        'sorted', 
        `Element at index ${n-i-1} is now sorted`,
        { indices: [n-i-1] }
      ));
      
      // Early termination
      if (options.optimize && !swapped) {
        const earlyExitMetrics = this._generateMetrics(
          comparisons, swaps, reads, writes, (performance.now() - startTime) / 1000
        );
        history.push(this._generateHistoryStep(
          array, 
          earlyExitMetrics, 
          'optimization', 
          `Early termination: No swaps in pass ${i+1}`
        ));
        break;
      }
    }
    
    // Calculate execution time and final metrics
    const executionTime = (performance.now() - startTime) / 1000;
    const finalMetrics = this._generateMetrics(
      comparisons, swaps, reads, writes, executionTime
    );
    
    // Add final state to history
    history.push(this._generateHistoryStep(
      array, finalMetrics, 'final', 'Final sorted state'
    ));
    
    return {
      result: array,
      metrics: finalMetrics,
      history
    };
  }
  
  /**
   * Mock Merge Sort implementation
   * @param {Array} data - Input data array
   * @param {Object} options - Algorithm options
   * @returns {AlgorithmExecutionResult} - Execution results
   * @private
   */
  _mockMergeSort(data, options) {
    // Create a copy of the input data
    const array = [...data];
    const n = array.length;
    
    // Initialize metrics and history
    const startTime = performance.now();
    let comparisons = 0;
    let swaps = 0;
    let reads = 0;
    let writes = 0;
    let recursiveCalls = 0;
    
    // Create history array with initial state
    const history = [];
    
    // Add initial state to history
    const initialMetrics = this._generateMetrics(0, 0, 0, 0, 0);
    initialMetrics.recursive_calls = 0;
    history.push(this._generateHistoryStep(
      array, initialMetrics, 'initial', 'Initial array state'
    ));
    
    // Simplified merge sort implementation
    const merge = (arr, low, mid, high) => {
      const left = arr.slice(low, mid + 1);
      const right = arr.slice(mid + 1, high + 1);
      reads += high - low + 1;
      
      // Record the merge start
      const mergeStartMetrics = { ...this._getCurrentMetrics() };
      history.push(this._generateHistoryStep(
        array, 
        mergeStartMetrics, 
        'merge_begin', 
        `Beginning merge of sections [${low}...${mid}] and [${mid+1}...${high}]`,
        { section: [low, high], middle: mid }
      ));
      
      let i = 0, j = 0, k = low;
      
      while (i < left.length && j < right.length) {
        // Compare elements
        comparisons++;
        
        // Record comparison
        const comparisonMetrics = { ...this._getCurrentMetrics() };
        history.push(this._generateHistoryStep(
          array, 
          comparisonMetrics, 
          'comparison', 
          `Comparing ${left[i]} and ${right[j]}`,
          { indices: [low + i, mid + 1 + j] }
        ));
        
        if (left[i] <= right[j]) {
          // Take from left array
          arr[k++] = left[i++];
        } else {
          // Take from right array
          arr[k++] = right[j++];
        }
        reads++;
        writes++;
      }
      
      // Copy remaining elements
      while (i < left.length) {
        arr[k++] = left[i++];
        reads++;
        writes++;
      }
      
      while (j < right.length) {
        arr[k++] = right[j++];
        reads++;
        writes++;
      }
      
      // Record the merge completion
      const mergeCompleteMetrics = { ...this._getCurrentMetrics() };
      history.push(this._generateHistoryStep(
        array, 
        mergeCompleteMetrics, 
        'merge_complete', 
        `Completed merge for section [${low}...${high}]`,
        { section: [low, high] }
      ));
    };
    
    const mergeSort = (arr, low, high) => {
      if (low < high) {
        recursiveCalls++;
        
        // Record recursive call
        const callMetrics = { ...this._getCurrentMetrics() };
        history.push(this._generateHistoryStep(
          array, 
          callMetrics, 
          'recursive_call', 
          `Sorting section from index ${low} to ${high}`,
          { section: [low, high] }
        ));
        
        const mid = Math.floor((low + high) / 2);
        
        // Divide the array
        const divideMetrics = { ...this._getCurrentMetrics() };
        history.push(this._generateHistoryStep(
          array, 
          divideMetrics, 
          'divide', 
          `Dividing at index ${mid}`,
          { section: [low, high], middle: mid }
        ));
        
        // Recursively sort left and right halves
        mergeSort(arr, low, mid);
        mergeSort(arr, mid + 1, high);
        
        // Merge the sorted halves
        merge(arr, low, mid, high);
      }
    };
    
    // Helper to get current metrics
    const _getCurrentMetrics = () => {
      return this._generateMetrics(
        comparisons, swaps, reads, writes, (performance.now() - startTime) / 1000
      );
    };
    
    // Run the merge sort
    mergeSort(array, 0, array.length - 1);
    
    // Calculate execution time and final metrics
    const executionTime = (performance.now() - startTime) / 1000;
    const finalMetrics = this._generateMetrics(
      comparisons, swaps, reads, writes, executionTime
    );
    finalMetrics.recursive_calls = recursiveCalls;
    
    // Add final state to history
    history.push(this._generateHistoryStep(
      array, finalMetrics, 'final', 'Final sorted state'
    ));
    
    return {
      result: array,
      metrics: finalMetrics,
      history
    };
  }
  
  /**
   * Mock Quick Sort implementation
   * @param {Array} data - Input data array
   * @param {Object} options - Algorithm options
   * @returns {AlgorithmExecutionResult} - Execution results
   * @private
   */
  _mockQuickSort(data, options) {
    // Create a copy of the input data
    const array = [...data];
    const n = array.length;
    
    // Initialize metrics and history
    const startTime = performance.now();
    let comparisons = 0;
    let swaps = 0;
    let reads = 0;
    let writes = 0;
    let recursiveCalls = 0;
    
    // Create history array with initial state
    const history = [];
    
    // Add initial state to history
    const initialMetrics = this._generateMetrics(0, 0, 0, 0, 0);
    initialMetrics.recursive_calls = 0;
    history.push(this._generateHistoryStep(
      array, initialMetrics, 'initial', 'Initial array state'
    ));
    
    // Helper to get current metrics
    const _getCurrentMetrics = () => {
      const executionTime = (performance.now() - startTime) / 1000;
      const metrics = this._generateMetrics(
        comparisons, swaps, reads, writes, executionTime
      );
      metrics.recursive_calls = recursiveCalls;
      return metrics;
    };
    
    // Simplified partition function
    const partition = (arr, low, high) => {
      // Select pivot based on strategy (default: last element)
      const pivotStrategy = options.pivotStrategy || 'last';
      let pivotIndex;
      
      switch(pivotStrategy) {
        case 'first':
          pivotIndex = low;
          break;
        case 'middle':
          pivotIndex = Math.floor((low + high) / 2);
          break;
        case 'median-of-three': {
          const mid = Math.floor((low + high) / 2);
          // Simple implementation - actually find median of three
          const values = [arr[low], arr[mid], arr[high]];
          values.sort((a, b) => a - b);
          const median = values[1];
          pivotIndex = arr[low] === median ? low :
                       arr[mid] === median ? mid : high;
          comparisons += 3;
          reads += 3;
          break;
        }
        case 'random':
          pivotIndex = low + Math.floor(Math.random() * (high - low + 1));
          break;
        case 'last':
        default:
          pivotIndex = high;
      }
      
      // Record pivot selection
      history.push(this._generateHistoryStep(
        array, 
        _getCurrentMetrics(), 
        'pivot_selection', 
        `Selected pivot at index ${pivotIndex} with value ${arr[pivotIndex]}`,
        { pivot_idx: pivotIndex }
      ));
      
      // Move pivot to the end for simplicity
      if (pivotIndex !== high) {
        [arr[pivotIndex], arr[high]] = [arr[high], arr[pivotIndex]];
        swaps++;
        reads += 2;
        writes += 2;
      }
      
      const pivot = arr[high];
      reads++;
      
      let i = low - 1;
      
      // Partition around pivot
      for (let j = low; j < high; j++) {
        // Compare with pivot
        comparisons++;
        const elemJ = arr[j];
        reads++;
        
        // Record comparison
        history.push(this._generateHistoryStep(
          array, 
          _getCurrentMetrics(), 
          'comparison', 
          `Comparing ${elemJ} with pivot ${pivot}`,
          { indices: [j, high] }
        ));
        
        if (elemJ < pivot) {
          i++;
          // Swap if needed
          if (i !== j) {
            [arr[i], arr[j]] = [arr[j], arr[i]];
            swaps++;
            reads += 2;
            writes += 2;
            
            // Record swap
            history.push(this._generateHistoryStep(
              array, 
              _getCurrentMetrics(), 
              'swap', 
              `Swapped elements at indices ${i} and ${j}`,
              { indices: [i, j] }
            ));
          }
        }
      }
      
      // Move pivot to its final position
      const pivotPos = i + 1;
      [arr[pivotPos], arr[high]] = [arr[high], arr[pivotPos]];
      swaps++;
      reads += 2;
      writes += 2;
      
      // Record pivot placement
      history.push(this._generateHistoryStep(
        array, 
        _getCurrentMetrics(), 
        'pivot_final', 
        `Placed pivot ${pivot} at final position ${pivotPos}`,
        { pivot_idx: pivotPos }
      ));
      
      return pivotPos;
    };
    
    // Quicksort implementation
    const quickSort = (arr, low, high) => {
      if (low < high) {
        recursiveCalls++;
        
        // Record recursive call
        history.push(this._generateHistoryStep(
          array, 
          _getCurrentMetrics(), 
          'recursive_call', 
          `Sorting section from index ${low} to ${high}`,
          { section: [low, high] }
        ));
        
        // Partition the array
        const pi = partition(arr, low, high);
        
        // Record the partitioning result
        history.push(this._generateHistoryStep(
          array, 
          _getCurrentMetrics(), 
          'partition', 
          `Partition around pivot at index ${pi}`,
          { pivot_idx: pi }
        ));
        
        // Recursively sort left and right of pivot
        quickSort(arr, low, pi - 1);
        quickSort(arr, pi + 1, high);
      }
    };
    
    // Run the quicksort
    quickSort(array, 0, array.length - 1);
    
    // Calculate execution time and final metrics
    const executionTime = (performance.now() - startTime) / 1000;
    const finalMetrics = this._generateMetrics(
      comparisons, swaps, reads, writes, executionTime
    );
    finalMetrics.recursive_calls = recursiveCalls;
    
    // Add final state to history
    history.push(this._generateHistoryStep(
      array, finalMetrics, 'final', 'Final sorted state'
    ));
    
    return {
      result: array,
      metrics: finalMetrics,
      history
    };
  }
  
  /**
   * Mock Heap Sort implementation
   * @param {Array} data - Input data array
   * @param {Object} options - Algorithm options
   * @returns {AlgorithmExecutionResult} - Execution results
   * @private
   */
  _mockHeapSort(data, options) {
    // Create a copy of the input data
    const array = [...data];
    const n = array.length;
    
    // Initialize metrics and history
    const startTime = performance.now();
    let comparisons = 0;
    let swaps = 0;
    let reads = 0;
    let writes = 0;
    
    // Create history array with initial state
    const history = [];
    
    // Add initial state to history
    const initialMetrics = this._generateMetrics(0, 0, 0, 0, 0);
    history.push(this._generateHistoryStep(
      array, initialMetrics, 'initial', 'Initial array state'
    ));
    
    // Helper to get current metrics
    const _getCurrentMetrics = () => {
      return this._generateMetrics(
        comparisons, swaps, reads, writes, (performance.now() - startTime) / 1000
      );
    };
    
    // Helper to extract the binary heap structure for visualization
    const extractHeapStructure = (arr, size, highlight = -1) => {
      const structure = {
        nodes: [],
        edges: [],
        highlight
      };
      
      for (let i = 0; i < size; i++) {
        structure.nodes.push({
          id: i,
          value: arr[i],
          level: Math.floor(Math.log2(i + 1)),
          is_leaf: 2 * i + 1 >= size
        });
        
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
    };
    
    // Heapify function
    const heapify = (arr, n, i) => {
      let largest = i;
      const left = 2 * i + 1;
      const right = 2 * i + 2;
      
      // Record heapify operation
      history.push(this._generateHistoryStep(
        array, 
        _getCurrentMetrics(), 
        'heapify', 
        `Heapifying subtree rooted at index ${i}`,
        {
          node: i,
          children: [left, right].filter(idx => idx < n),
          heap_structure: extractHeapStructure(arr, n, i)
        }
      ));
      
      // Compare with left child
      if (left < n) {
        comparisons++;
        reads += 2;
        if (arr[left] > arr[largest]) {
          largest = left;
        }
      }
      
      // Compare with right child
      if (right < n) {
        comparisons++;
        reads += 2;
        if (arr[right] > arr[largest]) {
          largest = right;
        }
      }
      
      // If largest is not root
      if (largest !== i) {
        // Swap
        [arr[i], arr[largest]] = [arr[largest], arr[i]];
        swaps++;
        reads += 2;
        writes += 2;
        
        // Record swap
        history.push(this._generateHistoryStep(
          array, 
          _getCurrentMetrics(), 
          'heapify_swap', 
          `Swapped ${arr[largest]} and ${arr[i]} to maintain heap property`,
          { indices: [i, largest] }
        ));
        
        // Recursively heapify the affected sub-tree
        heapify(arr, n, largest);
      }
    };
    
    // Build max heap (rearrange array)
    history.push(this._generateHistoryStep(
      array, 
      _getCurrentMetrics(), 
      'heap_start', 
      'Starting heap construction'
    ));
    
    for (let i = Math.floor(n / 2) - 1; i >= 0; i--) {
      heapify(array, n, i);
    }
    
    // Record heap construction completion
    history.push(this._generateHistoryStep(
      array, 
      _getCurrentMetrics(), 
      'heap_complete', 
      'Heap construction complete',
      { heap_structure: extractHeapStructure(array, n) }
    ));
    
    // Extract elements from heap one by one
    for (let i = n - 1; i > 0; i--) {
      // Move current root to end
      [array[0], array[i]] = [array[i], array[0]];
      swaps++;
      reads += 2;
      writes += 2;
      
      // Record extraction
      history.push(this._generateHistoryStep(
        array, 
        _getCurrentMetrics(), 
        'extract_max', 
        `Extracted maximum element ${array[i]} and placed at position ${i}`,
        { index: i, value: array[i] }
      ));
      
      // Call heapify on the reduced heap
      heapify(array, i, 0);
      
      // Mark the current maximum as sorted
      history.push(this._generateHistoryStep(
        array, 
        _getCurrentMetrics(), 
        'sorted', 
        `Elements from index ${i} to ${n-1} are now sorted`,
        { indices: Array.from({ length: n - i }, (_, idx) => i + idx) }
      ));
    }
    
    // Calculate execution time and final metrics
    const executionTime = (performance.now() - startTime) / 1000;
    const finalMetrics = this._generateMetrics(
      comparisons, swaps, reads, writes, executionTime
    );
    
    // Add final state to history
    history.push(this._generateHistoryStep(
      array, finalMetrics, 'final', 'Final sorted state'
    ));
    
    return {
      result: array,
      metrics: finalMetrics,
      history
    };
  }
  
  /**
   * Mock Counting Sort implementation
   * @param {Array} data - Input data array
   * @param {Object} options - Algorithm options
   * @returns {AlgorithmExecutionResult} - Execution results
   * @private
   */
  _mockCountingSort(data, options) {
    // Create a copy of the input data
    const array = [...data];
    const n = array.length;
    
    // Initialize metrics and history
    const startTime = performance.now();
    let comparisons = 0;
    let swaps = 0;
    let reads = n; // Initial read to find max
    let writes = n; // Final write back to array
    
    // Create history array with initial state
    const history = [];
    
    // Add initial state to history
    const initialMetrics = this._generateMetrics(0, 0, 0, 0, 0);
    history.push(this._generateHistoryStep(
      array, initialMetrics, 'initial', 'Initial array state'
    ));
    
    // Helper to get current metrics
    const _getCurrentMetrics = () => {
      return this._generateMetrics(
        comparisons, swaps, reads, writes, (performance.now() - startTime) / 1000
      );
    };
    
    // Find the maximum element in the array
    const max = Math.max(...array);
    
    // Create a count array for storing count of individual elements
    const count = new Array(max + 1).fill(0);
    
    // Store count of each element
    for (let i = 0; i < n; i++) {
      count[array[i]]++;
      reads++;
      writes++;
      
      // Record count increment
      history.push(this._generateHistoryStep(
        array, 
        _getCurrentMetrics(), 
        'count_increment', 
        `Incrementing count for value ${array[i]}`,
        { 
          value: array[i], 
          count: count[array[i]],
          frequency_array: [...count]
        }
      ));
    }
    
    // Modify count array to store cumulative count
    for (let i = 1; i <= max; i++) {
      count[i] += count[i - 1];
      reads++;
      writes++;
      
      // Record cumulative count
      history.push(this._generateHistoryStep(
        array, 
        _getCurrentMetrics(), 
        'cumulative_count', 
        `Computing cumulative count for value ${i}`,
        { 
          value: i, 
          cumulative_count: count[i],
          frequency_array: [...count]
        }
      ));
    }
    
    // Create output array
    const output = new Array(n);
    
    // Build the output array
    for (let i = n - 1; i >= 0; i--) {
      const value = array[i];
      const position = count[value] - 1;
      output[position] = value;
      count[value]--;
      reads += 2;
      writes += 2;
      
      // Record output placement
      history.push(this._generateHistoryStep(
        array, 
        _getCurrentMetrics(), 
        'output_placement', 
        `Placing value ${value} at position ${position} in output array`,
        { 
          value,
          source_index: i,
          target_index: position,
          output_array: [...output]
        }
      ));
    }
    
    // Copy the output array to the original array
    for (let i = 0; i < n; i++) {
      array[i] = output[i];
      reads++;
      writes++;
      
      // Record final placement
      history.push(this._generateHistoryStep(
        array, 
        _getCurrentMetrics(), 
        'final_placement', 
        `Copying value ${output[i]} back to original array at position ${i}`,
        { index: i, value: output[i] }
      ));
    }
    
    // Calculate execution time and final metrics
    const executionTime = (performance.now() - startTime) / 1000;
    const finalMetrics = this._generateMetrics(
      comparisons, swaps, reads, writes, executionTime
    );
    
    // Add final state to history
    history.push(this._generateHistoryStep(
      array, finalMetrics, 'final', 'Final sorted state'
    ));
    
    return {
      result: array,
      metrics: finalMetrics,
      history
    };
  }
  
  /**
   * Mock Radix Sort implementation
   * @param {Array} data - Input data array
   * @param {Object} options - Algorithm options
   * @returns {AlgorithmExecutionResult} - Execution results
   * @private
   */
  _mockRadixSort(data, options) {
    // Create a copy of the input data
    const array = [...data];
    const n = array.length;
    
    // Initialize metrics and history
    const startTime = performance.now();
    let comparisons = 0;
    let swaps = 0;
    let reads = n; // Initial read to find max
    let writes = n; // First copy to output array
    
    // Create history array with initial state
    const history = [];
    
    // Add initial state to history
    const initialMetrics = this._generateMetrics(0, 0, 0, 0, 0);
    history.push(this._generateHistoryStep(
      array, initialMetrics, 'initial', 'Initial array state'
    ));
    
    // Helper to get current metrics
    const _getCurrentMetrics = () => {
      return this._generateMetrics(
        comparisons, swaps, reads, writes, (performance.now() - startTime) / 1000
      );
    };
    
    // Find the maximum number to know number of digits
    const max = Math.max(...array);
    
    // Do counting sort for every digit
    for (let exp = 1; Math.floor(max / exp) > 0; exp *= 10) {
      // Record start of pass for this digit
      history.push(this._generateHistoryStep(
        array, 
        _getCurrentMetrics(), 
        'digit_pass_start', 
        `Starting pass for digit at position ${Math.log10(exp)}`,
        { digit_position: Math.log10(exp) }
      ));
      
      const output = new Array(n);
      const count = new Array(10).fill(0);
      
      // Store count of occurrences in count[]
      for (let i = 0; i < n; i++) {
        const digit = Math.floor(array[i] / exp) % 10;
        count[digit]++;
        reads++;
        writes++;
        
        // Record digit extraction
        history.push(this._generateHistoryStep(
          array, 
          _getCurrentMetrics(), 
          'extract_digit', 
          `Extracted digit ${digit} from value ${array[i]}`,
          { 
            value: array[i], 
            digit,
            digit_position: Math.log10(exp),
            bucket_counts: [...count]
          }
        ));
      }
      
      // Change count[i] so that count[i] contains actual
      // position of this digit in output[]
      for (let i = 1; i < 10; i++) {
        count[i] += count[i - 1];
        reads++;
        writes++;
      }
      
      // Build the output array
      for (let i = n - 1; i >= 0; i--) {
        const digit = Math.floor(array[i] / exp) % 10;
        output[count[digit] - 1] = array[i];
        count[digit]--;
        reads += 2;
        writes += 2;
        
        // Record placement in output array
        history.push(this._generateHistoryStep(
          array, 
          _getCurrentMetrics(), 
          'bucket_placement', 
          `Placing value ${array[i]} in bucket for digit ${digit}`,
          { 
            value: array[i],
            digit,
            bucket: digit,
            position_in_bucket: count[digit]
          }
        ));
      }
      
      // Copy the output array to the original array
      for (let i = 0; i < n; i++) {
        array[i] = output[i];
        reads++;
        writes++;
      }
      
      // Record the array after this digit pass
      history.push(this._generateHistoryStep(
        array, 
        _getCurrentMetrics(), 
        'digit_pass_complete', 
        `Completed pass for digit at position ${Math.log10(exp)}`,
        { 
          digit_position: Math.log10(exp),
          current_array: [...array]
        }
      ));
    }
    
    // Calculate execution time and final metrics
    const executionTime = (performance.now() - startTime) / 1000;
    const finalMetrics = this._generateMetrics(
      comparisons, swaps, reads, writes, executionTime
    );
    
    // Add final state to history
    history.push(this._generateHistoryStep(
      array, finalMetrics, 'final', 'Final sorted state'
    ));
    
    return {
      result: array,
      metrics: finalMetrics,
      history
    };
  }
  
  /**
   * Mock Bucket Sort implementation
   * @param {Array} data - Input data array
   * @param {Object} options - Algorithm options
   * @returns {AlgorithmExecutionResult} - Execution results
   * @private
   */
  _mockBucketSort(data, options) {
    // Create a copy of the input data
    const array = [...data];
    const n = array.length;
    
    // Initialize metrics and history
    const startTime = performance.now();
    let comparisons = 0;
    let swaps = 0;
    let reads = 2 * n; // Initial reads to find min/max and place items
    let writes = 2 * n; // Placing in buckets and copying back
    
    // Create history array with initial state
    const history = [];
    
    // Add initial state to history
    const initialMetrics = this._generateMetrics(0, 0, 0, 0, 0);
    history.push(this._generateHistoryStep(
      array, initialMetrics, 'initial', 'Initial array state'
    ));
    
    // Helper to get current metrics
    const _getCurrentMetrics = () => {
      return this._generateMetrics(
        comparisons, swaps, reads, writes, (performance.now() - startTime) / 1000
      );
    };
    
    // Find min and max values
    const min = Math.min(...array);
    const max = Math.max(...array);
    
    // Number of buckets (use sqrt(n) by default)
    const bucketCount = options.bucketCount || Math.ceil(Math.sqrt(n));
    
    // Create buckets
    const buckets = Array.from({ length: bucketCount }, () => []);
    
    // Record bucket creation
    history.push(this._generateHistoryStep(
      array, 
      _getCurrentMetrics(), 
      'create_buckets', 
      `Created ${bucketCount} buckets for range [${min}..${max}]`,
      { 
        bucket_count: bucketCount, 
        min_value: min,
        max_value: max
      }
    ));
    
    // Place elements into buckets
    for (let i = 0; i < n; i++) {
      const value = array[i];
      // Normalize to 0-1 range and scale to bucket count
      const bucketIndex = Math.min(
        bucketCount - 1, 
        Math.floor(bucketCount * (value - min) / (max - min + 1))
      );
      buckets[bucketIndex].push(value);
      reads++;
      writes++;
      
      // Record placement in bucket
      history.push(this._generateHistoryStep(
        array, 
        _getCurrentMetrics(), 
        'bucket_placement', 
        `Placing value ${value} in bucket ${bucketIndex}`,
        { 
          value,
          bucket_index: bucketIndex,
          buckets: buckets.map(b => [...b])
        }
      ));
    }
    
    // Sort individual buckets (insertion sort)
    for (let i = 0; i < bucketCount; i++) {
      // Only sort if bucket has elements
      if (buckets[i].length > 0) {
        // Record start of bucket sort
        history.push(this._generateHistoryStep(
          array, 
          _getCurrentMetrics(), 
          'sort_bucket_start', 
          `Sorting bucket ${i} with ${buckets[i].length} elements`,
          { 
            bucket_index: i,
            bucket_content: [...buckets[i]]
          }
        ));
        
        // Simple insertion sort for the bucket
        for (let j = 1; j < buckets[i].length; j++) {
          const key = buckets[i][j];
          let k = j - 1;
          
          while (k >= 0 && buckets[i][k] > key) {
            comparisons++;
            reads++;
            
            buckets[i][k + 1] = buckets[i][k];
            writes++;
            k--;
          }
          
          buckets[i][k + 1] = key;
          writes++;
        }
        
        // Record end of bucket sort
        history.push(this._generateHistoryStep(
          array, 
          _getCurrentMetrics(), 
          'sort_bucket_end', 
          `Completed sorting bucket ${i}`,
          { 
            bucket_index: i,
            bucket_content: [...buckets[i]]
          }
        ));
      }
    }
    
    // Concatenate all buckets back into the original array
    let index = 0;
    for (let i = 0; i < bucketCount; i++) {
      for (let j = 0; j < buckets[i].length; j++) {
        array[index] = buckets[i][j];
        reads++;
        writes++;
        
        // Record placement back in original array
        history.push(this._generateHistoryStep(
          array, 
          _getCurrentMetrics(), 
          'bucket_extraction', 
          `Extracting value ${buckets[i][j]} from bucket ${i} to position ${index}`,
          { 
            value: buckets[i][j],
            bucket_index: i,
            array_index: index
          }
        ));
        
        index++;
      }
    }
    
    // Calculate execution time and final metrics
    const executionTime = (performance.now() - startTime) / 1000;
    const finalMetrics = this._generateMetrics(
      comparisons, swaps, reads, writes, executionTime
    );
    
    // Add final state to history
    history.push(this._generateHistoryStep(
      array, finalMetrics, 'final', 'Final sorted state'
    ));
    
    return {
      result: array,
      metrics: finalMetrics,
      history
    };
  }
  
  /**
   * Mock Selection Sort implementation
   * @param {Array} data - Input data array
   * @param {Object} options - Algorithm options
   * @returns {AlgorithmExecutionResult} - Execution results
   * @private
   */
  _mockSelectionSort(data, options) {
    // Create a copy of the input data
    const array = [...data];
    const n = array.length;
    
    // Initialize metrics and history
    const startTime = performance.now();
    let comparisons = 0;
    let swaps = 0;
    let reads = 0;
    let writes = 0;
    
    // Create history array with initial state
    const history = [];
    
    // Add initial state to history
    const initialMetrics = this._generateMetrics(0, 0, 0, 0, 0);
    history.push(this._generateHistoryStep(
      array, initialMetrics, 'initial', 'Initial array state'
    ));
    
    // Helper to get current metrics
    const _getCurrentMetrics = () => {
      return this._generateMetrics(
        comparisons, swaps, reads, writes, (performance.now() - startTime) / 1000
      );
    };
    
    // Selection sort algorithm
    for (let i = 0; i < n - 1; i++) {
      // Record start of pass
      history.push(this._generateHistoryStep(
        array, 
        _getCurrentMetrics(), 
        'pass_start', 
        `Starting pass ${i+1} to find minimum element`,
        { current_index: i }
      ));
      
      // Find the minimum element in unsorted portion
      let minIdx = i;
      
      for (let j = i + 1; j < n; j++) {
        comparisons++;
        reads += 2;
        
        // Record comparison
        history.push(this._generateHistoryStep(
          array, 
          _getCurrentMetrics(), 
          'comparison', 
          `Comparing ${array[j]} with current minimum ${array[minIdx]}`,
          { 
            indices: [j, minIdx],
            current_min_idx: minIdx
          }
        ));
        
        if (array[j] < array[minIdx]) {
          minIdx = j;
          
          // Record new minimum
          history.push(this._generateHistoryStep(
            array, 
            _getCurrentMetrics(), 
            'new_minimum', 
            `Found new minimum ${array[minIdx]} at index ${minIdx}`,
            { current_min_idx: minIdx }
          ));
        }
      }
      
      // Swap the found minimum element with the first element
      if (minIdx !== i) {
        [array[i], array[minIdx]] = [array[minIdx], array[i]];
        swaps++;
        reads += 2;
        writes += 2;
        
        // Record swap
        history.push(this._generateHistoryStep(
          array, 
          _getCurrentMetrics(), 
          'swap', 
          `Swapped minimum element ${array[i]} to position ${i}`,
          { indices: [i, minIdx] }
        ));
      }
      
      // Mark element as sorted
      history.push(this._generateHistoryStep(
        array, 
        _getCurrentMetrics(), 
        'sorted', 
        `Element at index ${i} is now sorted`,
        { indices: [i] }
      ));
    }
    
    // Mark last element as sorted
    history.push(this._generateHistoryStep(
      array, 
      _getCurrentMetrics(), 
      'sorted', 
      `Element at index ${n-1} is now sorted`,
      { indices: [n-1] }
    ));
    
    // Calculate execution time and final metrics
    const executionTime = (performance.now() - startTime) / 1000;
    const finalMetrics = this._generateMetrics(
      comparisons, swaps, reads, writes, executionTime
    );
    
    // Add final state to history
    history.push(this._generateHistoryStep(
      array, finalMetrics, 'final', 'Final sorted state'
    ));
    
    return {
      result: array,
      metrics: finalMetrics,
      history
    };
  }
  
  /**
   * Mock Insertion Sort implementation
   * @param {Array} data - Input data array
   * @param {Object} options - Algorithm options
   * @returns {AlgorithmExecutionResult} - Execution results
   * @private
   */
  _mockInsertionSort(data, options) {
    // Create a copy of the input data
    const array = [...data];
    const n = array.length;
    
    // Initialize metrics and history
    const startTime = performance.now();
    let comparisons = 0;
    let swaps = 0;
    let reads = 0;
    let writes = 0;
    
    // Create history array with initial state
    const history = [];
    
    // Add initial state to history
    const initialMetrics = this._generateMetrics(0, 0, 0, 0, 0);
    history.push(this._generateHistoryStep(
      array, initialMetrics, 'initial', 'Initial array state'
    ));
    
    // Helper to get current metrics
    const _getCurrentMetrics = () => {
      return this._generateMetrics(
        comparisons, swaps, reads, writes, (performance.now() - startTime) / 1000
      );
    };
    
    // Insertion sort algorithm
    for (let i = 1; i < n; i++) {
      const key = array[i];
      reads++;
      
      // Record current key selection
      history.push(this._generateHistoryStep(
        array, 
        _getCurrentMetrics(), 
        'key_selection', 
        `Selected key ${key} at index ${i}`,
        { key_index: i, key_value: key }
      ));
      
      let j = i - 1;
      
      // Move elements greater than key one position ahead
      while (j >= 0 && array[j] > key) {
        comparisons++;
        reads++;
        
        // Record comparison
        history.push(this._generateHistoryStep(
          array, 
          _getCurrentMetrics(), 
          'comparison', 
          `Comparing key ${key} with element ${array[j]} at index ${j}`,
          { indices: [i, j] }
        ));
        
        // Shift element
        array[j + 1] = array[j];
        writes++;
        
        // Record shift
        history.push(this._generateHistoryStep(
          array, 
          _getCurrentMetrics(), 
          'shift', 
          `Shifting element ${array[j]} one position right`,
          { from_index: j, to_index: j + 1 }
        ));
        
        j--;
      }
      
      // Place key in its correct position
      array[j + 1] = key;
      writes++;
      
      // Record insertion
      history.push(this._generateHistoryStep(
        array, 
        _getCurrentMetrics(), 
        'insertion', 
        `Inserting key ${key} at position ${j+1}`,
        { key_value: key, insertion_index: j + 1 }
      ));
      
      // Mark sorted portion
      history.push(this._generateHistoryStep(
        array, 
        _getCurrentMetrics(), 
        'sorted_portion', 
        `Elements from index 0 to ${i} are now sorted`,
        { indices: Array.from({ length: i + 1 }, (_, idx) => idx) }
      ));
    }
    
    // Calculate execution time and final metrics
    const executionTime = (performance.now() - startTime) / 1000;
    const finalMetrics = this._generateMetrics(
      comparisons, swaps, reads, writes, executionTime
    );
    
    // Add final state to history
    history.push(this._generateHistoryStep(
      array, finalMetrics, 'final', 'Final sorted state'
    ));
    
    return {
      result: array,
      metrics: finalMetrics,
      history
    };
  }
  
  /**
   * Mock QuickSelect implementation
   * @param {Array} data - Input data array
   * @param {Object} options - Algorithm options
   * @returns {AlgorithmExecutionResult} - Execution results with the k-th element
   * @private
   */
  _mockQuickSelect(data, options) {
    // Create a copy of the input data
    const array = [...data];
    const n = array.length;
    
    // Get k (position to find) from options, default to median
    const k = options.k !== undefined ? options.k : Math.floor(n / 2);
    
    // Initialize metrics and history
    const startTime = performance.now();
    let comparisons = 0;
    let swaps = 0;
    let reads = 0;
    let writes = 0;
    let recursiveCalls = 0;
    
    // Create history array with initial state
    const history = [];
    
    // Add initial state to history
    const initialMetrics = this._generateMetrics(0, 0, 0, 0, 0);
    initialMetrics.recursive_calls = 0;
    history.push(this._generateHistoryStep(
      array, initialMetrics, 'initial', 'Initial array state'
    ));
    
    // Helper to get current metrics
    const _getCurrentMetrics = () => {
      const executionTime = (performance.now() - startTime) / 1000;
      const metrics = this._generateMetrics(
        comparisons, swaps, reads, writes, executionTime
      );
      metrics.recursive_calls = recursiveCalls;
      return metrics;
    };
    
    // Simplified partition function (similar to quicksort)
    const partition = (arr, low, high) => {
      // Use last element as pivot
      const pivot = arr[high];
      reads++;
      
      // Record pivot selection
      history.push(this._generateHistoryStep(
        array, 
        _getCurrentMetrics(), 
        'pivot_selection', 
        `Selected pivot ${pivot} at index ${high}`,
        { pivot_index: high, pivot_value: pivot }
      ));
      
      let i = low - 1;
      
      for (let j = low; j <= high - 1; j++) {
        comparisons++;
        reads++;
        
        // Record comparison
        history.push(this._generateHistoryStep(
          array, 
          _getCurrentMetrics(), 
          'comparison', 
          `Comparing ${arr[j]} with pivot ${pivot}`,
          { compared_index: j, pivot_index: high }
        ));
        
        if (arr[j] <= pivot) {
          i++;
          
          // Swap if needed
          if (i !== j) {
            [arr[i], arr[j]] = [arr[j], arr[i]];
            swaps++;
            reads += 2;
            writes += 2;
            
            // Record swap
            history.push(this._generateHistoryStep(
              array, 
              _getCurrentMetrics(), 
              'swap', 
              `Swapped elements at indices ${i} and ${j}`,
              { indices: [i, j] }
            ));
          }
        }
      }
      
      // Swap pivot to its final position
      [arr[i + 1], arr[high]] = [arr[high], arr[i + 1]];
      swaps++;
      reads += 2;
      writes += 2;
      
      // Record pivot placement
      history.push(this._generateHistoryStep(
        array, 
        _getCurrentMetrics(), 
        'pivot_placement', 
        `Placed pivot ${pivot} at final position ${i+1}`,
        { pivot_index: i + 1, pivot_value: pivot }
      ));
      
      return i + 1;
    };
    
    // QuickSelect implementation
    const quickSelect = (arr, low, high, k) => {
      recursiveCalls++;
      
      // Record recursive call
      history.push(this._generateHistoryStep(
        array, 
        _getCurrentMetrics(), 
        'recursive_call', 
        `QuickSelect for k=${k} on segment [${low}...${high}]`,
        { segment: [low, high], target_k: k }
      ));
      
      if (low === high) {
        // Found the element
        history.push(this._generateHistoryStep(
          array, 
          _getCurrentMetrics(), 
          'found_element', 
          `Found ${k}th element: ${arr[low]} at index ${low}`,
          { found_index: low, found_value: arr[low], k }
        ));
        return arr[low];
      }
      
      // Partition the array and get the pivot position
      const pivotIndex = partition(arr, low, high);
      
      // Record partition result
      history.push(this._generateHistoryStep(
        array, 
        _getCurrentMetrics(), 
        'partition_result', 
        `Partition resulted in pivot at index ${pivotIndex}`,
        { pivot_index: pivotIndex, pivot_value: arr[pivotIndex] }
      ));
      
      // If pivot is the kth element
      if (pivotIndex === k) {
        history.push(this._generateHistoryStep(
          array, 
          _getCurrentMetrics(), 
          'found_element', 
          `Found ${k}th element: ${arr[pivotIndex]} at index ${pivotIndex}`,
          { found_index: pivotIndex, found_value: arr[pivotIndex], k }
        ));
        return arr[pivotIndex];
      }
      
      // If pivot is greater than k, search in left subarray
      if (pivotIndex > k) {
        history.push(this._generateHistoryStep(
          array, 
          _getCurrentMetrics(), 
          'search_left', 
          `Pivot index ${pivotIndex} > k=${k}, searching left subarray`,
          { segment: [low, pivotIndex - 1], target_k: k }
        ));
        return quickSelect(arr, low, pivotIndex - 1, k);
      }
      
      // If pivot is less than k, search in right subarray
      history.push(this._generateHistoryStep(
        array, 
        _getCurrentMetrics(), 
        'search_right', 
        `Pivot index ${pivotIndex} < k=${k}, searching right subarray`,
        { segment: [pivotIndex + 1, high], target_k: k }
      ));
      return quickSelect(arr, pivotIndex + 1, high, k);
    };
    
    // Execute the algorithm
    const result = quickSelect(array, 0, n - 1, k);
    
    // Calculate execution time and final metrics
    const executionTime = (performance.now() - startTime) / 1000;
    const finalMetrics = this._generateMetrics(
      comparisons, swaps, reads, writes, executionTime
    );
    finalMetrics.recursive_calls = recursiveCalls;
    
    // Add final state to history
    history.push(this._generateHistoryStep(
      array, finalMetrics, 'final', 'Algorithm completed'
    ));
    
    return {
      result: array,  // The whole array is returned, but it will be partially sorted
      kth_element: result, // The k-th element value
      k: k,           // The position k that was found
      metrics: finalMetrics,
      history
    };
  }
}

module.exports = MockPythonJSBridge;
