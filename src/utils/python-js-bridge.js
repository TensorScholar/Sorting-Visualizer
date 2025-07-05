// src/utils/python-js-bridge.js

/**
 * @file Python-JavaScript Communication Bridge
 * @module PythonJSBridge
 * @author Algorithm Visualization Platform Team
 * @version 2.1.0
 * 
 * @description
 * A sophisticated bidirectional communication bridge between JavaScript frontend and Python
 * backend for algorithm visualization. This module enables seamless execution of Python-implemented
 * algorithms within the JavaScript environment, facilitating educational comparison of
 * language-specific algorithm implementations.
 * 
 * The bridge implements a client-server architecture with HTTP/WebSocket communication,
 * JSON-based state serialization, and comprehensive error handling. It is designed to
 * support the visualization and analysis of complex algorithm execution across language
 * boundaries while maintaining performance monitoring capabilities.
 * 
 * Architecture:
 * - Communication Layer: Asynchronous HTTP requests with WebSocket fallback
 * - Serialization Layer: Bidirectional state transformation with schema validation
 * - Execution Layer: Algorithm invocation with comprehensive instrumentation
 * - Analysis Layer: Cross-language performance metrics and comparison
 * 
 * Design Principles:
 * - Language Boundary Transparency: Abstract away language differences
 * - Execution Fidelity: Preserve algorithmic behavior across implementations
 * - Instrumentation Non-interference: Minimize measurement impact
 * - Serialization Efficiency: Optimize state transfer for visualization
 */

/**
 * Serialization utilities for cross-language state transformation
 * @private
 */
class StateSerializer {
  /**
   * Convert JavaScript camelCase objects to Python snake_case
   * @param {Object} jsObject - Object with JavaScript-style property names
   * @returns {Object} Equivalent object with Python-style property names
   */
  static toPythonFormat(jsObject) {
    if (jsObject === null || typeof jsObject !== 'object') {
      return jsObject;
    }
    
    if (Array.isArray(jsObject)) {
      return jsObject.map(item => this.toPythonFormat(item));
    }
    
    const pythonObject = {};
    
    for (const [key, value] of Object.entries(jsObject)) {
      // Convert camelCase to snake_case
      const pythonKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
      pythonObject[pythonKey] = this.toPythonFormat(value);
    }
    
    return pythonObject;
  }
  
  /**
   * Convert Python snake_case objects to JavaScript camelCase
   * @param {Object} pythonObject - Object with Python-style property names
   * @returns {Object} Equivalent object with JavaScript-style property names
   */
  static toJavaScriptFormat(pythonObject) {
    if (pythonObject === null || typeof pythonObject !== 'object') {
      return pythonObject;
    }
    
    if (Array.isArray(pythonObject)) {
      return pythonObject.map(item => this.toJavaScriptFormat(item));
    }
    
    const jsObject = {};
    
    for (const [key, value] of Object.entries(pythonObject)) {
      // Convert snake_case to camelCase
      const jsKey = key.replace(/_([a-z])/g, (_, character) => character.toUpperCase());
      jsObject[jsKey] = this.toJavaScriptFormat(value);
    }
    
    return jsObject;
  }
  
  /**
   * Validate structure of Python response against expected schema
   * @param {Object} response - Response object from Python
   * @param {Array<string>} requiredFields - Required fields in the response
   * @throws {Error} If validation fails
   */
  static validateResponse(response, requiredFields) {
    for (const field of requiredFields) {
      if (response[field] === undefined) {
        throw new Error(`Invalid response: missing required field '${field}'`);
      }
    }
  }
  
  /**
   * Optimize array data for transmission by using compact representation
   * @param {Array} array - Array of numbers
   * @returns {Object} Compact representation of the array
   */
  static optimizeArrayData(array) {
    if (!array || !array.length) return array;
    
    // For small arrays, just return the original array
    if (array.length < 1000) return array;
    
    // For large arrays of numbers, use TypedArray binary representation
    if (array.every(item => typeof item === 'number')) {
      const typedArray = new Float64Array(array);
      return {
        type: 'typedarray',
        data: typedArray.buffer,
        length: array.length
      };
    }
    
    return array;
  }
  
  /**
   * Reconstruct array from optimized representation
   * @param {Object|Array} optimized - Optimized array representation
   * @returns {Array} Original array
   */
  static reconstructArray(optimized) {
    if (!optimized || !optimized.type) return optimized;
    
    if (optimized.type === 'typedarray') {
      return Array.from(new Float64Array(optimized.data));
    }
    
    return optimized;
  }
}

/**
 * Network communication layer for Python-JavaScript interaction
 * @private
 */
class CommunicationLayer {
  /**
   * Create a communication layer instance
   * @param {Object} options - Configuration options
   * @param {string} options.serverUrl - URL of the Python bridge server
   * @param {number} options.timeout - Request timeout in milliseconds
   * @param {boolean} options.useWebSockets - Whether to use WebSockets when available
   */
  constructor(options) {
    this.serverUrl = options.serverUrl || 'http://localhost:5000/api';
    this.timeout = options.timeout || 30000;
    this.useWebSockets = options.useWebSockets !== false;
    this.websocket = null;
    this.websocketReady = false;
    this.pendingRequests = new Map();
    this.requestCounter = 0;
    
    if (this.useWebSockets) {
      this.initWebSocket();
    }
  }
  
  /**
   * Initialize WebSocket connection if supported and enabled
   * @private
   */
  initWebSocket() {
    try {
      const wsUrl = this.serverUrl.replace(/^http/, 'ws') + '/ws';
      this.websocket = new WebSocket(wsUrl);
      
      this.websocket.onopen = () => {
        this.websocketReady = true;
        console.debug('WebSocket connection established');
      };
      
      this.websocket.onmessage = (event) => {
        try {
          const response = JSON.parse(event.data);
          const requestId = response.requestId;
          
          if (requestId && this.pendingRequests.has(requestId)) {
            const { resolve, reject } = this.pendingRequests.get(requestId);
            this.pendingRequests.delete(requestId);
            
            if (response.error) {
              reject(new Error(response.error));
            } else {
              resolve(response.data);
            }
          }
        } catch (error) {
          console.error('Error processing WebSocket message:', error);
        }
      };
      
      this.websocket.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.websocketReady = false;
      };
      
      this.websocket.onclose = () => {
        this.websocketReady = false;
        console.debug('WebSocket connection closed');
        
        // Retry WebSocket connection after delay
        setTimeout(() => this.initWebSocket(), 5000);
      };
    } catch (error) {
      console.error('Failed to initialize WebSocket:', error);
      this.useWebSockets = false;
    }
  }
  
  /**
   * Send a request to the Python server
   * @param {string} endpoint - API endpoint
   * @param {Object} data - Request payload
   * @returns {Promise<Object>} Response from server
   * @throws {Error} If communication fails
   */
  async sendRequest(endpoint, data) {
    // Try WebSocket if available
    if (this.useWebSockets && this.websocketReady) {
      try {
        return await this.sendWebSocketRequest(endpoint, data);
      } catch (wsError) {
        console.warn('WebSocket request failed, falling back to HTTP:', wsError);
        // Fall back to HTTP on WebSocket failure
      }
    }
    
    // Use HTTP request
    return this.sendHttpRequest(endpoint, data);
  }
  
  /**
   * Send request via WebSocket
   * @param {string} endpoint - API endpoint
   * @param {Object} data - Request payload
   * @returns {Promise<Object>} Response from server
   * @private
   */
  async sendWebSocketRequest(endpoint, data) {
    const requestId = ++this.requestCounter;
    
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        this.pendingRequests.delete(requestId);
        reject(new Error('WebSocket request timeout'));
      }, this.timeout);
      
      this.pendingRequests.set(requestId, {
        resolve: (data) => {
          clearTimeout(timeoutId);
          resolve(data);
        },
        reject: (error) => {
          clearTimeout(timeoutId);
          reject(error);
        }
      });
      
      const message = JSON.stringify({
        requestId,
        endpoint,
        data
      });
      
      this.websocket.send(message);
    });
  }
  
  /**
   * Send request via HTTP
   * @param {string} endpoint - API endpoint
   * @param {Object} data - Request payload
   * @returns {Promise<Object>} Response from server
   * @private
   */
  async sendHttpRequest(endpoint, data) {
    const url = `${this.serverUrl}/${endpoint}`;
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error ${response.status}: ${errorText}`);
      }
      
      return await response.json();
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error(`Request to ${endpoint} timed out after ${this.timeout}ms`);
      }
      throw error;
    }
  }
}

/**
 * Algorithm execution environment with cross-language capabilities
 * @private
 */
class AlgorithmExecutor {
  /**
   * Create an algorithm executor
   * @param {CommunicationLayer} communicationLayer - Communication layer for Python execution
   * @param {Object} options - Configuration options
   */
  constructor(communicationLayer, options = {}) {
    this.communicationLayer = communicationLayer;
    this.options = {
      recordHistory: true,
      recordMetrics: true,
      timeoutMultiplier: 10,
      ...options
    };
    
    // Map of algorithm names to Python module/class names
    this.algorithmMapping = {
      // Comparison-based algorithms
      'bubble-sort': { module: 'comparison.bubble_sort', class: 'BubbleSort' },
      'cocktail-shaker-sort': { module: 'comparison.cocktail_shaker_sort', class: 'CocktailShakerSort' },
      'comb-sort': { module: 'comparison.comb_sort', class: 'CombSort' },
      'cycle-sort': { module: 'comparison.cycle_sort', class: 'CycleSort' },
      'gnome-sort': { module: 'comparison.gnome_sort', class: 'GnomeSort' },
      'heap-sort': { module: 'comparison.heap_sort', class: 'HeapSort' },
      'insertion-sort': { module: 'comparison.insertion_sort', class: 'InsertionSort' },
      'binary-insertion-sort': { module: 'comparison.binary_insertion_sort', class: 'BinaryInsertionSort' },
      'intro-sort': { module: 'comparison.intro_sort', class: 'IntroSort' },
      'merge-sort': { module: 'comparison.merge_sort', class: 'MergeSort' },
      'odd-even-sort': { module: 'comparison.odd_even_sort', class: 'OddEvenSort' },
      'quick-sort': { module: 'comparison.quick_sort', class: 'QuickSort' },
      'selection-sort': { module: 'comparison.selection_sort', class: 'SelectionSort' },
      'shell-sort': { module: 'comparison.shell_sort', class: 'ShellSort' },
      'tim-sort': { module: 'comparison.tim_sort', class: 'TimSort' },
      
      // Distribution algorithms
      'bucket-sort': { module: 'distribution.bucket_sort', class: 'BucketSort' },
      'counting-sort': { module: 'distribution.counting_sort', class: 'CountingSort' },
      'pigeonhole-sort': { module: 'distribution.pigeonhole_sort', class: 'PigeonholeSort' },
      'radix-sort': { module: 'distribution.radix_sort', class: 'RadixSort' },
      
      // Network algorithms
      'bitonic-sort': { module: 'network.bitonic_sort', class: 'BitonicSort' },
      'odd-even-merge-sort': { module: 'network.odd_even_merge_sort', class: 'OddEvenMergeSort' },
      
      // Special algorithms
      'bogo-sort': { module: 'special.bogo_sort', class: 'BogoSort' },
      'pancake-sort': { module: 'special.pancake_sort', class: 'PancakeSort' },
      
      // Selection algorithms
      'quick-select': { module: 'selection.quick_select', class: 'QuickSelect' },
      'median-of-medians': { module: 'selection.median_of_medians', class: 'MedianOfMedians' }
    };
  }
  
  /**
   * Execute a Python algorithm implementation
   * @param {string} algorithmName - Name of the algorithm to execute
   * @param {Array} data - Input data array
   * @param {Object} options - Algorithm options
   * @returns {Promise<Object>} Execution results with sorted array and metrics
   * @throws {Error} If execution fails
   */
  async executeAlgorithm(algorithmName, data, options = {}) {
    const mapping = this.algorithmMapping[algorithmName];
    
    if (!mapping) {
      throw new Error(`Unknown algorithm: ${algorithmName}`);
    }
    
    // Determine timeout based on input size and algorithm
    const timeout = this.calculateTimeout(algorithmName, data.length);
    
    // Prepare execution options
    const executionOptions = {
      ...this.options,
      ...options,
      timeout
    };
    
    // Convert options to Python format
    const pythonOptions = StateSerializer.toPythonFormat(executionOptions);
    
    // Prepare request payload
    const payload = {
      algorithm: {
        module: mapping.module,
        class: mapping.class
      },
      data: StateSerializer.optimizeArrayData(data),
      options: pythonOptions
    };
    
    try {
      // Send execution request
      const response = await this.communicationLayer.sendRequest('execute', payload);
      
      // Validate response
      StateSerializer.validateResponse(response, ['result', 'metrics']);
      
      // Convert response to JavaScript format
      return StateSerializer.toJavaScriptFormat(response);
    } catch (error) {
      throw new Error(`Failed to execute algorithm ${algorithmName}: ${error.message}`);
    }
  }
  
  /**
   * Calculate an appropriate timeout for algorithm execution
   * @param {string} algorithmName - Name of the algorithm
   * @param {number} dataSize - Size of the input data
   * @returns {number} Timeout in milliseconds
   * @private
   */
  calculateTimeout(algorithmName, dataSize) {
    // Base timeout
    let baseTimeout = 30000; // 30 seconds
    
    // Adjust for algorithm complexity
    const complexityMultipliers = {
      'bogo-sort': 0.1,            // Very restricted timeout for bogosort
      'bubble-sort': 1.5,          // O(n²)
      'selection-sort': 1.5,       // O(n²)
      'insertion-sort': 1.5,       // O(n²)
      'cocktail-shaker-sort': 1.5, // O(n²)
      'gnome-sort': 1.5,           // O(n²)
      'quick-sort': 1.0,           // O(n log n) average
      'merge-sort': 1.0,           // O(n log n)
      'heap-sort': 1.0,            // O(n log n)
      'tim-sort': 0.8,             // O(n log n) with optimizations
      'counting-sort': 0.5,        // O(n+k)
      'radix-sort': 0.7            // O(d*n)
    };
    
    const multiplier = complexityMultipliers[algorithmName] || 1.0;
    
    // Scale timeout based on data size
    // Use different scaling functions based on algorithm complexity
    let sizeAdjustedTimeout;
    
    if (['bogo-sort'].includes(algorithmName)) {
      // Very restricted for exponential algorithms
      sizeAdjustedTimeout = baseTimeout * Math.min(1.0, 10 / dataSize);
    } else if (['bubble-sort', 'selection-sort', 'insertion-sort', 'cocktail-shaker-sort', 'gnome-sort'].includes(algorithmName)) {
      // Quadratic algorithms: scale with n²
      const scaleFactor = Math.pow(dataSize / 1000, 2);
      sizeAdjustedTimeout = baseTimeout * Math.min(10, 1 + scaleFactor);
    } else {
      // For n log n algorithms and better
      const scaleFactor = (dataSize / 1000) * Math.log10(Math.max(dataSize, 10));
      sizeAdjustedTimeout = baseTimeout * Math.min(5, 1 + scaleFactor / 10);
    }
    
    return Math.ceil(sizeAdjustedTimeout * multiplier * this.options.timeoutMultiplier);
  }
}

/**
 * Performance analysis utilities for cross-language algorithm comparison
 * @private
 */
class PerformanceAnalyzer {
  /**
   * Analyze performance differences between JavaScript and Python implementations
   * @param {Object} jsMetrics - JavaScript performance metrics
   * @param {Object} pyMetrics - Python performance metrics
   * @returns {Object} Detailed performance comparison
   */
  static compareImplementations(jsMetrics, pyMetrics) {
    // Convert Python time to milliseconds (if it's in seconds)
    const pyTimeInMs = pyMetrics.executionTime < 10 ? 
      pyMetrics.executionTime * 1000 : 
      pyMetrics.executionTime;
    
    // Calculate speed ratio
    const speedRatio = jsMetrics.executionTime / pyTimeInMs;
    
    // Determine which implementation is faster
    const fasterImplementation = speedRatio < 1 ? 'python' : 'javascript';
    const speedDifference = speedRatio < 1 ? 1 / speedRatio : speedRatio;
    
    // Compare operation counts
    const operationComparison = {
      comparisons: {
        js: jsMetrics.comparisons,
        py: pyMetrics.comparisons,
        difference: jsMetrics.comparisons - pyMetrics.comparisons,
        percentageDiff: this.calculatePercentageDifference(
          jsMetrics.comparisons, 
          pyMetrics.comparisons
        )
      },
      swaps: {
        js: jsMetrics.swaps,
        py: pyMetrics.swaps,
        difference: jsMetrics.swaps - pyMetrics.swaps,
        percentageDiff: this.calculatePercentageDifference(
          jsMetrics.swaps, 
          pyMetrics.swaps
        )
      },
      memoryAccesses: {
        js: jsMetrics.memoryAccesses || (jsMetrics.reads + jsMetrics.writes),
        py: pyMetrics.memoryAccesses || (pyMetrics.reads + pyMetrics.writes),
        difference: (jsMetrics.memoryAccesses || (jsMetrics.reads + jsMetrics.writes)) - 
                   (pyMetrics.memoryAccesses || (pyMetrics.reads + pyMetrics.writes)),
        percentageDiff: this.calculatePercentageDifference(
          jsMetrics.memoryAccesses || (jsMetrics.reads + jsMetrics.writes),
          pyMetrics.memoryAccesses || (pyMetrics.reads + pyMetrics.writes)
        )
      }
    };
    
    // Return comprehensive comparison
    return {
      executionTime: {
        js: jsMetrics.executionTime,
        py: pyTimeInMs,
        difference: jsMetrics.executionTime - pyTimeInMs,
        percentageDiff: this.calculatePercentageDifference(
          jsMetrics.executionTime, 
          pyTimeInMs
        )
      },
      speedRatio,
      fasterImplementation,
      speedDifference: speedDifference.toFixed(2) + 'x',
      operations: operationComparison,
      summary: this.generatePerformanceSummary(
        fasterImplementation, 
        speedDifference, 
        operationComparison
      )
    };
  }
  
  /**
   * Calculate percentage difference between two values
   * @param {number} a - First value
   * @param {number} b - Second value
   * @returns {number} Percentage difference
   * @private
   */
  static calculatePercentageDifference(a, b) {
    if (a === b) return 0;
    if (a === 0 || b === 0) return a === 0 ? -100 : 100;
    
    const avg = (a + b) / 2;
    return ((a - b) / avg) * 100;
  }
  
  /**
   * Generate a human-readable performance summary
   * @param {string} fasterImpl - Identifier of faster implementation
   * @param {number} speedDiff - Speed difference factor
   * @param {Object} operations - Operation count comparison
   * @returns {string} Human-readable summary
   * @private
   */
  static generatePerformanceSummary(fasterImpl, speedDiff, operations) {
    const comparisonEfficiency = operations.comparisons.percentageDiff;
    const memoryEfficiency = operations.memoryAccesses.percentageDiff;
    
    let summary = `The ${fasterImpl} implementation is approximately ${speedDiff.toFixed(2)}x faster. `;
    
    if (Math.abs(comparisonEfficiency) > 10) {
      summary += `It performs ${Math.abs(comparisonEfficiency).toFixed(0)}% ${comparisonEfficiency > 0 ? 'more' : 'fewer'} comparisons. `;
    }
    
    if (Math.abs(memoryEfficiency) > 10) {
      summary += `It makes ${Math.abs(memoryEfficiency).toFixed(0)}% ${memoryEfficiency > 0 ? 'more' : 'fewer'} memory accesses.`;
    }
    
    return summary;
  }
}

/**
 * Error handling and validation utilities for the bridge
 * @private
 */
class BridgeErrorHandler {
  /**
   * Error categories for structured error handling
   * @enum {string}
   */
  static ErrorCategories = {
    COMMUNICATION: 'communication',
    EXECUTION: 'execution',
    SERIALIZATION: 'serialization',
    VALIDATION: 'validation',
    UNKNOWN: 'unknown'
  };
  
  /**
   * Process an error to create a structured error object
   * @param {Error} error - Original error
   * @param {string} context - Error context
   * @returns {Object} Structured error object
   */
  static processError(error, context) {
    // Determine error category
    const category = this.categorizeError(error);
    
    // Create structured error object
    return {
      category,
      context,
      message: error.message,
      originalError: error,
      timestamp: new Date().toISOString(),
      recoverable: this.isRecoverable(category)
    };
  }
  
  /**
   * Categorize an error based on its properties
   * @param {Error} error - Error to categorize
   * @returns {string} Error category
   * @private
   */
  static categorizeError(error) {
    const { message } = error;
    
    if (message.includes('timeout') || 
        message.includes('network') ||
        message.includes('connection') ||
        message.includes('HTTP error')) {
      return this.ErrorCategories.COMMUNICATION;
    }
    
    if (message.includes('execution') ||
        message.includes('algorithm') ||
        message.includes('runtime')) {
      return this.ErrorCategories.EXECUTION;
    }
    
    if (message.includes('serialize') ||
        message.includes('parse') ||
        message.includes('JSON')) {
      return this.ErrorCategories.SERIALIZATION;
    }
    
    if (message.includes('validation') ||
        message.includes('invalid') ||
        message.includes('missing')) {
      return this.ErrorCategories.VALIDATION;
    }
    
    return this.ErrorCategories.UNKNOWN;
  }
  
  /**
   * Determine if an error is potentially recoverable
   * @param {string} category - Error category
   * @returns {boolean} Whether the error is potentially recoverable
   * @private
   */
  static isRecoverable(category) {
    // Communication errors might be temporary and recoverable
    return category === this.ErrorCategories.COMMUNICATION;
  }
  
  /**
   * Create a validation error
   * @param {string} message - Error message
   * @returns {Error} Validation error
   */
  static createValidationError(message) {
    const error = new Error(`Validation error: ${message}`);
    error.name = 'ValidationError';
    return error;
  }
}

/**
 * @class PythonJSBridge
 * @description High-performance communication bridge for executing Python algorithms in JavaScript
 */
class PythonJSBridge {
  /**
   * Create a new Python-JavaScript bridge
   * @param {Object} options - Configuration options
   * @param {string} [options.serverUrl='http://localhost:5000/api'] - URL of the Python bridge server
   * @param {number} [options.timeout=30000] - Request timeout in milliseconds
   * @param {boolean} [options.useWebSockets=true] - Whether to use WebSockets when available
   * @param {boolean} [options.debug=false] - Enable debug logging
   * @param {Object} [options.execution] - Algorithm execution options
   * @param {boolean} [options.cacheResults=true] - Cache execution results for identical inputs
   */
  constructor(options = {}) {
    this.options = {
      serverUrl: 'http://localhost:5000/api',
      timeout: 30000,
      useWebSockets: true,
      debug: false,
      cacheResults: true,
      ...options
    };
    
    // Initialize communication layer
    this.communicationLayer = new CommunicationLayer({
      serverUrl: this.options.serverUrl,
      timeout: this.options.timeout,
      useWebSockets: this.options.useWebSockets
    });
    
    // Initialize algorithm executor
    this.algorithmExecutor = new AlgorithmExecutor(this.communicationLayer, {
      recordHistory: true,
      recordMetrics: true,
      timeoutMultiplier: options.timeoutMultiplier || 1.0
    });
    
    // Initialize execution cache
    this.executionCache = new Map();
    
    // Log initialization status
    if (this.options.debug) {
      console.debug('PythonJSBridge initialized with options:', this.options);
    }
  }
  
  /**
   * Execute a Python algorithm implementation
   * @param {string} algorithmName - Name of the algorithm to execute
   * @param {Array} data - Input data array
   * @param {Object} options - Algorithm options
   * @returns {Promise<Object>} Execution results including sorted array and metrics
   * @throws {Error} If execution fails
   */
  async executeAlgorithm(algorithmName, data, options = {}) {
    try {
      // Generate cache key for this execution
      const cacheKey = this.generateCacheKey(algorithmName, data, options);
      
      // Check cache if enabled
      if (this.options.cacheResults && this.executionCache.has(cacheKey)) {
        if (this.options.debug) {
          console.debug(`Using cached result for ${algorithmName}`);
        }
        return this.executionCache.get(cacheKey);
      }
      
      // Log execution start
      if (this.options.debug) {
        console.debug(`Executing ${algorithmName} on ${data.length} elements`);
        console.time(`${algorithmName}-execution`);
      }
      
      // Execute algorithm
      const result = await this.algorithmExecutor.executeAlgorithm(algorithmName, data, options);
      
      // Log execution complete
      if (this.options.debug) {
        console.timeEnd(`${algorithmName}-execution`);
        console.debug(`${algorithmName} metrics:`, result.metrics);
      }
      
      // Cache result if enabled
      if (this.options.cacheResults) {
        this.executionCache.set(cacheKey, result);
      }
      
      return result;
    } catch (error) {
      // Process error for more structured handling
      const processedError = BridgeErrorHandler.processError(error, 'algorithm-execution');
      
      // Log error details
      if (this.options.debug) {
        console.error(`Error executing ${algorithmName}:`, processedError);
      }
      
      throw new Error(`Failed to execute ${algorithmName}: ${error.message}`);
    }
  }
  
  /**
   * Compare JavaScript and Python implementations of the same algorithm
   * @param {Object} jsAlgorithm - JavaScript algorithm instance
   * @param {string} algorithmName - Algorithm name for Python mapping
   * @param {Array} data - Input data array
   * @param {Object} options - Algorithm options
   * @returns {Promise<Object>} Comparison results
   */
  async compareImplementations(jsAlgorithm, algorithmName, data, options = {}) {
    // Validate inputs
    if (!jsAlgorithm || typeof jsAlgorithm.execute !== 'function') {
      throw BridgeErrorHandler.createValidationError('Invalid JavaScript algorithm instance');
    }
    
    if (!algorithmName || typeof algorithmName !== 'string') {
      throw BridgeErrorHandler.createValidationError('Invalid algorithm name');
    }
    
    if (!Array.isArray(data)) {
      throw BridgeErrorHandler.createValidationError('Data must be an array');
    }
    
    try {
      // Clone data to avoid mutations affecting comparisons
      const inputData = [...data];
      
      if (this.options.debug) {
        console.debug(`Starting comparison of ${algorithmName} implementations`);
        console.time('comparison-total');
      }
      
      // Execute JavaScript implementation
      const jsStartTime = performance.now();
      const jsResult = await Promise.resolve(jsAlgorithm.execute([...inputData], options));
      const jsEndTime = performance.now();
      const jsExecutionTime = jsEndTime - jsStartTime;
      
      if (this.options.debug) {
        console.debug(`JS ${algorithmName} completed in ${jsExecutionTime.toFixed(2)}ms`);
      }
      
      // Execute Python implementation
      const pyResult = await this.executeAlgorithm(algorithmName, inputData, options);
      
      if (this.options.debug) {
        console.timeEnd('comparison-total');
      }
      
      // Get metrics
      const jsMetrics = {
        ...jsAlgorithm.metrics,
        executionTime: jsExecutionTime
      };
      
      // Analyze performance difference
      const performanceAnalysis = PerformanceAnalyzer.compareImplementations(
        jsMetrics,
        pyResult.metrics
      );
      
      // Verify results match (both implementations produced same output)
      const resultsMatch = this.compareArrays(jsResult, pyResult.result);
      
      // Return comprehensive comparison report
      return {
        algorithm: algorithmName,
        inputSize: data.length,
        options: options,
        javascript: {
          result: jsResult,
          metrics: jsMetrics,
          history: jsAlgorithm.history || []
        },
        python: {
          result: pyResult.result,
          metrics: pyResult.metrics,
          history: pyResult.history || []
        },
        performance: performanceAnalysis,
        correctness: {
          resultsMatch,
          message: resultsMatch ? 
            'Both implementations produced identical results' : 
            'Implementations produced different results'
        },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      const processedError = BridgeErrorHandler.processError(error, 'implementation-comparison');
      
      if (this.options.debug) {
        console.error('Comparison failed:', processedError);
      }
      
      throw new Error(`Comparison failed: ${error.message}`);
    }
  }
  
  /**
   * Execute all steps of a Python algorithm to extract execution history
   * @param {string} algorithmName - Name of the algorithm
   * @param {Array} data - Input data array
   * @param {Object} options - Algorithm options
   * @returns {Promise<Array>} Execution history steps
   */
  async getAlgorithmHistory(algorithmName, data, options = {}) {
    // Add history recording option
    const executionOptions = {
      ...options,
      recordHistory: true
    };
    
    try {
      // Execute algorithm
      const result = await this.executeAlgorithm(algorithmName, data, executionOptions);
      
      // Return the execution history
      return result.history || [];
    } catch (error) {
      throw new Error(`Failed to get algorithm history: ${error.message}`);
    }
  }
  
  /**
   * Test Python server connection and API availability
   * @returns {Promise<Object>} Connection test results
   */
  async testConnection() {
    try {
      const startTime = performance.now();
      const response = await this.communicationLayer.sendRequest('ping', { timestamp: startTime });
      const endTime = performance.now();
      
      return {
        success: true,
        roundTripTime: endTime - startTime,
        serverInfo: response.serverInfo || {},
        algorithms: response.algorithms || []
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Generate a cache key for an algorithm execution
   * @param {string} algorithmName - Algorithm name
   * @param {Array} data - Input data
   * @param {Object} options - Execution options
   * @returns {string} Cache key
   * @private
   */
  generateCacheKey(algorithmName, data, options) {
    // For large arrays, use a hash of the data instead of the full array
    const dataDigest = this.generateDataDigest(data);
    const optionsString = JSON.stringify(options);
    
    return `${algorithmName}:${dataDigest}:${optionsString}`;
  }
  
  /**
   * Generate a digest of the data array for caching
   * @param {Array} data - Input data array
   * @returns {string} Data digest
   * @private
   */
  generateDataDigest(data) {
    if (!data || !data.length) return 'empty';
    
    if (data.length <= 10) {
      return JSON.stringify(data);
    }
    
    // For large arrays, use key statistical properties and samples
    const firstTen = data.slice(0, 10);
    const lastTen = data.slice(-10);
    
    // Calculate basic statistics
    const sum = data.reduce((acc, val) => acc + val, 0);
    const mean = sum / data.length;
    
    // Get min and max
    const min = Math.min(...data);
    const max = Math.max(...data);
    
    // Calculate a simple hash from these properties
    return `len:${data.length};mean:${mean.toFixed(2)};min:${min};max:${max};samples:${JSON.stringify([...firstTen, ...lastTen])}`;
  }
  
  /**
   * Compare two arrays for equality
   * @param {Array} arr1 - First array
   * @param {Array} arr2 - Second array
   * @returns {boolean} True if arrays are equal
   * @private
   */
  compareArrays(arr1, arr2) {
    if (!arr1 || !arr2) return false;
    if (arr1.length !== arr2.length) return false;
    
    for (let i = 0; i < arr1.length; i++) {
      // Use approximate comparison for floating point values
      if (typeof arr1[i] === 'number' && typeof arr2[i] === 'number') {
        // Allow small floating point differences
        if (Math.abs(arr1[i] - arr2[i]) > 1e-10) {
          return false;
        }
      } else if (arr1[i] !== arr2[i]) {
        return false;
      }
    }
    
    return true;
  }
  
  /**
   * Clear the execution cache
   */
  clearCache() {
    this.executionCache.clear();
    
    if (this.options.debug) {
      console.debug('Execution cache cleared');
    }
  }
  
  /**
   * Get the list of available Python algorithms
   * @returns {Promise<Array<string>>} List of available algorithm names
   */
  async getAvailableAlgorithms() {
    try {
      const response = await this.communicationLayer.sendRequest('algorithms', {});
      return response.algorithms || [];
    } catch (error) {
      throw new Error(`Failed to get available algorithms: ${error.message}`);
    }
  }
}

export default PythonJSBridge;
