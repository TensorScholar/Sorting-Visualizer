/**
 * @file instrumentation.js
 * @module AlgorithmInstrumentation
 * @author Advanced Sorting Algorithm Visualization Platform
 * @description Advanced instrumentation system for tracking algorithm performance metrics
 * and collecting detailed execution data for visualization and analysis. This system
 * provides sophisticated metrics collection, memory access pattern analysis, cache
 * simulation, and state recording for algorithm visualization.
 * 
 * The instrumentation is designed to be used with the Algorithm base class and provides
 * a comprehensive suite of tools for understanding algorithm behavior, performance
 * characteristics, and execution patterns.
 */

/**
 * Comprehensive algorithm instrumentation system
 * Provides detailed metrics collection and analysis for algorithm execution
 * 
 * Features:
 * - Basic operation counting (comparisons, swaps, reads, writes)
 * - Memory access pattern analysis
 * - Cache behavior simulation
 * - Branch prediction modeling
 * - Element movement tracking
 * - Call stack and recursion monitoring
 * - Algorithm phase detection
 * - Performance analytics and reporting
 * 
 * @class AlgorithmInstrumentation
 */
class AlgorithmInstrumentation {
  /**
   * Create a new instrumentation instance with default configuration
   * 
   * @constructor
   * @param {Object} [options] - Configuration options
   * @param {boolean} [options.trackMemoryAccess=true] - Enable memory access tracking
   * @param {boolean} [options.simulateCache=true] - Enable cache simulation
   * @param {boolean} [options.trackCallStack=true] - Enable call stack tracking
   * @param {boolean} [options.monitorBranches=true] - Enable branch monitoring
   * @param {boolean} [options.collectAccessPatterns=true] - Enable access pattern collection
   * @param {boolean} [options.trackElementMovement=true] - Enable element movement tracking
   * @param {boolean} [options.detectPhases=true] - Enable algorithm phase detection
   * @param {number} [options.cacheSize=64] - Simulated cache size in elements
   * @param {number} [options.maxTimelineEvents=10000] - Maximum timeline events to record
   */
  constructor(options = {}) {
    // Configuration
    this.config = {
      trackMemoryAccess: true,
      simulateCache: true,
      trackCallStack: true,
      monitorBranches: true,
      collectAccessPatterns: true,
      trackElementMovement: true,
      detectPhases: true,
      cacheSize: 64,
      maxTimelineEvents: 10000,
      ...options
    };
    
    // Initialize instrumentation state
    this.initializeState();
  }
  
  /**
   * Initialize or reset all instrumentation state
   * Creates a clean state for new algorithm execution
   * 
   * @private
   */
  initializeState() {
    // Runtime metrics
    this.metrics = {
      // Basic operation counts
      comparisons: 0,
      swaps: 0,
      reads: 0,
      writes: 0,
      
      // Memory-related metrics
      memoryAccesses: 0,
      memoryUsage: 0,
      auxiliarySpace: 0,
      maxAuxiliarySpace: 0,
      
      // Call statistics
      functionCalls: 0,
      recursiveCalls: 0,
      recursionDepth: 0,
      maxRecursionDepth: 0,
      
      // Time measurements
      startTime: 0,
      endTime: 0,
      executionTime: 0,
      
      // Conditional branches
      branches: 0,
      branchHits: {
        true: 0,
        false: 0
      },
      
      // Cache simulation
      cacheHits: 0,
      cacheMisses: 0,
      cacheEvictions: 0,
      
      // Element movements
      elementMoves: 0,
      totalMoveDistance: 0,
      maxMoveDistance: 0,
      avgMoveDistance: 0,
      
      // Operation frequency
      opsPerElement: 0,
      comparisonRatio: 0,
      readWriteRatio: 0
    };
    
    // Performance profile
    this.profile = {
      operationTimeline: [],           // Chronological sequence of operations
      memoryUsageTimeline: [],         // Memory usage over time
      callStack: [],                   // Active function call stack
      hotspots: {},                    // Function execution time hotspots
      timeDistribution: {},            // Time distribution across phases
      activeTime: 0                    // Time spent in active processing
    };
    
    // Array access patterns
    this.accessPatterns = {
      readIndices: [],                 // Sequence of read operations
      writeIndices: [],                // Sequence of write operations
      accessFrequency: {},             // Frequency of access by index
      sequentialAccesses: 0,           // Number of sequential accesses
      randomAccesses: 0,               // Number of non-sequential accesses
      accessHeatmap: {}                // Heatmap of access frequency
    };
    
    // Cache simulation
    this.cacheSimulation = {
      cacheSize: this.config.cacheSize,
      cacheHits: 0,
      cacheMisses: 0,
      cache: new Map(),                // Cache model (LRU implementation)
      evictions: 0,
      missRatio: 0,
      hitRatio: 0,
      missDistribution: {}             // Distribution of cache misses
    };
    
    // Element movement tracking
    this.elementMovements = {
      paths: {},                       // Paths of elements through the array
      distances: {},                   // Distance traveled by each element
      totalDistance: 0,                // Total movement distance
      movesPerElement: {}              // Number of moves per element
    };
    
    // Phase detection
    this.phases = {
      current: 'initialization',
      transitions: [],                 // Phase transition history
      durations: {},                   // Duration of each phase
      startTimes: {},                  // Start time of each phase
      phaseStats: {}                   // Statistics for each phase
    };
    
    // Operation flags
    this.isTrackingPaused = false;     // Flag to pause tracking temporarily
    this.operationFilterMap = null;    // Optional filter for operations to track
    
    // Performance tracking
    this._lastOperationTime = 0;
    this._operationOverhead = 0;
    this._pausedTime = 0;
    this._pauseStartTime = 0;
  }

  /**
   * Reset all instrumentation data
   * Prepares for a new algorithm execution while preserving configuration
   * 
   * @public
   * @returns {AlgorithmInstrumentation} Self reference for method chaining
   */
  reset() {
    this.initializeState();
    return this;
  }
  
  /**
   * Start timing the algorithm execution
   * Records the start time and initializes the first phase
   * 
   * @public
   * @returns {AlgorithmInstrumentation} Self reference for method chaining
   */
  startTiming() {
    this.metrics.startTime = performance.now();
    this._lastOperationTime = this.metrics.startTime;
    this.setPhase('initialization');
    return this;
  }
  
  /**
   * End timing the algorithm execution
   * Calculates total execution time and finalizes metrics
   * 
   * @public
   * @returns {number} Total execution time in milliseconds
   */
  endTiming() {
    this.metrics.endTime = performance.now();
    this.metrics.executionTime = this.metrics.endTime - this.metrics.startTime - this._pausedTime;
    this.setPhase('completed');
    
    // Calculate derived metrics
    this.calculateDerivedMetrics();
    
    return this.metrics.executionTime;
  }
  
  /**
   * Calculate derived metrics based on collected raw data
   * Computes ratios, averages, and other derived performance characteristics
   * 
   * @private
   */
  calculateDerivedMetrics() {
    const totalOps = this.metrics.comparisons + this.metrics.swaps + 
                    this.metrics.reads + this.metrics.writes;
    const totalElements = Math.max(
      this.accessPatterns.readIndices.length,
      this.accessPatterns.writeIndices.length, 
      1
    );
    
    // Operation ratios
    this.metrics.opsPerElement = totalOps / totalElements;
    this.metrics.comparisonRatio = this.metrics.comparisons / Math.max(totalOps, 1);
    this.metrics.readWriteRatio = this.metrics.reads / Math.max(this.metrics.writes, 1);
    
    // Movement metrics
    const movedElements = Object.keys(this.elementMovements.distances).length;
    this.metrics.avgMoveDistance = movedElements > 0 ? 
      this.elementMovements.totalDistance / movedElements : 0;
    
    // Cache metrics
    const totalCacheOps = this.cacheSimulation.cacheHits + this.cacheSimulation.cacheMisses;
    this.cacheSimulation.hitRatio = totalCacheOps > 0 ? 
      this.cacheSimulation.cacheHits / totalCacheOps : 0;
    this.cacheSimulation.missRatio = totalCacheOps > 0 ? 
      this.cacheSimulation.cacheMisses / totalCacheOps : 0;
    
    // Branch prediction metrics
    this.metrics.branchPredictability = this.metrics.branches > 0 ? 
      Math.max(this.metrics.branchHits.true, this.metrics.branchHits.false) / this.metrics.branches : 0;
  }
  
  /**
   * Temporarily pause tracking
   * Useful for excluding non-algorithm operations from metrics
   * 
   * @public
   * @returns {AlgorithmInstrumentation} Self reference for method chaining
   */
  pauseTracking() {
    if (!this.isTrackingPaused) {
      this.isTrackingPaused = true;
      this._pauseStartTime = performance.now();
    }
    return this;
  }
  
  /**
   * Resume tracking after a pause
   * Adjusts timing to account for paused period
   * 
   * @public
   * @returns {AlgorithmInstrumentation} Self reference for method chaining
   */
  resumeTracking() {
    if (this.isTrackingPaused) {
      this.isTrackingPaused = false;
      this._pausedTime += performance.now() - this._pauseStartTime;
    }
    return this;
  }
  
  /**
   * Set an operation filter to selectively track only specific operations
   * 
   * @public
   * @param {Set<string>} operations - Set of operation types to track ('comparison', 'swap', etc.)
   * @returns {AlgorithmInstrumentation} Self reference for method chaining
   */
  setOperationFilter(operations) {
    if (operations instanceof Set) {
      this.operationFilterMap = operations;
    } else if (Array.isArray(operations)) {
      this.operationFilterMap = new Set(operations);
    } else {
      this.operationFilterMap = null;
    }
    return this;
  }
  
  /**
   * Check if an operation should be tracked based on current filters
   * 
   * @private
   * @param {string} operationType - Type of operation to check
   * @returns {boolean} True if operation should be tracked
   */
  shouldTrackOperation(operationType) {
    if (this.isTrackingPaused) return false;
    if (!this.operationFilterMap) return true;
    return this.operationFilterMap.has(operationType);
  }
  
  /**
   * Track a comparison operation between two elements
   * 
   * @public
   * @param {*} a - First element being compared
   * @param {*} b - Second element being compared
   * @param {number} result - Result of comparison (-1, 0, 1)
   * @param {Object} [metadata={}] - Additional context information
   * @returns {AlgorithmInstrumentation} Self reference for method chaining
   */
  trackComparison(a, b, result, metadata = {}) {
    if (!this.shouldTrackOperation('comparison')) return this;
    
    this.metrics.comparisons++;
    
    // Record operation in timeline if enabled
    if (this.config.collectAccessPatterns) {
      if (this.profile.operationTimeline.length < this.config.maxTimelineEvents) {
        this.profile.operationTimeline.push({
          type: 'comparison',
          time: this.getCurrentTime(),
          result,
          values: [a, b],
          ...metadata
        });
      }
    }
    
    // Track operation overhead for performance analysis
    this.trackOperationOverhead();
    
    return this;
  }
  
  /**
   * Track a swap operation between two array elements
   * Comprehensive tracking including memory access, cache effects, and element movement
   * 
   * @public
   * @param {Array} array - The array being operated on
   * @param {number} i - First index
   * @param {number} j - Second index
   * @param {Object} [metadata={}] - Additional context information
   * @returns {AlgorithmInstrumentation} Self reference for method chaining
   */
  trackSwap(array, i, j, metadata = {}) {
    if (!this.shouldTrackOperation('swap')) return this;
    if (i === j) return this; // No actual swap
    
    this.metrics.swaps++;
    this.metrics.reads += 2;
    this.metrics.writes += 2;
    this.metrics.memoryAccesses += 4;
    
    // Track element movements
    if (this.config.trackElementMovement) {
      const elementA = array[i];
      const elementB = array[j];
      
      // Initialize paths if they don't exist
      if (!this.elementMovements.paths[elementA]) {
        this.elementMovements.paths[elementA] = [i];
      }
      if (!this.elementMovements.paths[elementB]) {
        this.elementMovements.paths[elementB] = [j];
      }
      
      // Record the new positions
      this.elementMovements.paths[elementA].push(j);
      this.elementMovements.paths[elementB].push(i);
      
      // Track move counts
      this.elementMovements.movesPerElement[elementA] = 
        (this.elementMovements.movesPerElement[elementA] || 0) + 1;
      this.elementMovements.movesPerElement[elementB] = 
        (this.elementMovements.movesPerElement[elementB] || 0) + 1;
      
      // Update total distance moved
      const distance = Math.abs(j - i);
      this.elementMovements.totalDistance += distance * 2; // Both elements move
      this.metrics.totalMoveDistance += distance * 2;
      this.metrics.elementMoves += 2;
      
      // Update individual element distances
      if (!this.elementMovements.distances[elementA]) {
        this.elementMovements.distances[elementA] = 0;
      }
      if (!this.elementMovements.distances[elementB]) {
        this.elementMovements.distances[elementB] = 0;
      }
      this.elementMovements.distances[elementA] += distance;
      this.elementMovements.distances[elementB] += distance;
      
      // Track maximum distance moved by any element
      this.metrics.maxMoveDistance = Math.max(
        this.metrics.maxMoveDistance,
        this.elementMovements.distances[elementA],
        this.elementMovements.distances[elementB]
      );
    }
    
    // Simulate cache behavior for both reads and writes if enabled
    if (this.config.simulateCache) {
      this.simulateCacheAccess(i, 'read');
      this.simulateCacheAccess(j, 'read');
      this.simulateCacheAccess(i, 'write');
      this.simulateCacheAccess(j, 'write');
    }
    
    // Record the operation in timeline if enabled
    if (this.profile.operationTimeline.length < this.config.maxTimelineEvents) {
      this.profile.operationTimeline.push({
        type: 'swap',
        time: this.getCurrentTime(),
        indices: [i, j],
        values: [array[i], array[j]],
        ...metadata
      });
    }
    
    // Track operation overhead
    this.trackOperationOverhead();
    
    return this;
  }
  
  /**
   * Track a read operation from an array
   * 
   * @public
   * @param {Array} array - The array being read from
   * @param {number} index - The index being read
   * @param {Object} [metadata={}] - Additional context information
   * @returns {*} The value read from the array
   */
  trackRead(array, index, metadata = {}) {
    const value = array[index];
    
    if (!this.shouldTrackOperation('read')) return value;
    
    this.metrics.reads++;
    this.metrics.memoryAccesses++;
    
    // Record access pattern
    if (this.config.collectAccessPatterns) {
      this.accessPatterns.readIndices.push(index);
      
      // Track access frequency
      this.accessPatterns.accessFrequency[index] = 
        (this.accessPatterns.accessFrequency[index] || 0) + 1;
      
      // Update heat map
      this.accessPatterns.accessHeatmap[index] = 
        (this.accessPatterns.accessHeatmap[index] || 0) + 1;
      
      // Check if this is a sequential or random access
      const lastReadIndex = this.accessPatterns.readIndices.length > 1 
        ? this.accessPatterns.readIndices[this.accessPatterns.readIndices.length - 2] 
        : null;
        
      if (lastReadIndex !== null) {
        if (Math.abs(index - lastReadIndex) === 1) {
          this.accessPatterns.sequentialAccesses++;
        } else {
          this.accessPatterns.randomAccesses++;
        }
      }
    }
    
    // Simulate cache behavior
    if (this.config.simulateCache) {
      this.simulateCacheAccess(index, 'read');
    }
    
    // Record the operation in timeline if enabled
    if (this.profile.operationTimeline.length < this.config.maxTimelineEvents) {
      this.profile.operationTimeline.push({
        type: 'read',
        time: this.getCurrentTime(),
        index,
        value,
        ...metadata
      });
    }
    
    // Track operation overhead
    this.trackOperationOverhead();
    
    return value;
  }
  
  /**
   * Track a write operation to an array
   * 
   * @public
   * @param {Array} array - The array being written to
   * @param {number} index - The index being written to
   * @param {*} value - The value being written
   * @param {Object} [metadata={}] - Additional context information
   * @returns {AlgorithmInstrumentation} Self reference for method chaining
   */
  trackWrite(array, index, value, metadata = {}) {
    if (!this.shouldTrackOperation('write')) {
      array[index] = value;
      return this;
    }
    
    this.metrics.writes++;
    this.metrics.memoryAccesses++;
    
    // Record access pattern
    if (this.config.collectAccessPatterns) {
      this.accessPatterns.writeIndices.push(index);
      
      // Update heat map
      this.accessPatterns.accessHeatmap[index] = 
        (this.accessPatterns.accessHeatmap[index] || 0) + 1;
    }
    
    // Track element movements
    if (this.config.trackElementMovement) {
      // Check if we've seen this element before to track its movement
      if (this.elementMovements.paths[value]) {
        const lastPosition = this.elementMovements.paths[value][this.elementMovements.paths[value].length - 1];
        const distance = Math.abs(index - lastPosition);
        
        this.elementMovements.paths[value].push(index);
        this.elementMovements.totalDistance += distance;
        this.metrics.totalMoveDistance += distance;
        this.metrics.elementMoves++;
        this.elementMovements.movesPerElement[value] = 
          (this.elementMovements.movesPerElement[value] || 0) + 1;
        
        if (!this.elementMovements.distances[value]) {
          this.elementMovements.distances[value] = 0;
        }
        this.elementMovements.distances[value] += distance;
        
        // Track maximum distance moved by any element
        this.metrics.maxMoveDistance = Math.max(
          this.metrics.maxMoveDistance,
          this.elementMovements.distances[value]
        );
      } else {
        // First time seeing this element
        this.elementMovements.paths[value] = [index];
        this.elementMovements.distances[value] = 0;
        this.elementMovements.movesPerElement[value] = 0;
      }
    }
    
    // Simulate cache behavior
    if (this.config.simulateCache) {
      this.simulateCacheAccess(index, 'write');
    }
    
    // Record the operation in timeline if enabled
    if (this.profile.operationTimeline.length < this.config.maxTimelineEvents) {
      this.profile.operationTimeline.push({
        type: 'write',
        time: this.getCurrentTime(),
        index,
        value,
        ...metadata
      });
    }
    
    // Track operation overhead
    this.trackOperationOverhead();
    
    // Perform the write
    array[index] = value;
    
    return this;
  }
  
  /**
   * Track a function call with detailed instrumentation
   * 
   * @public
   * @param {string} functionName - The name of the function
   * @param {Array} args - Function arguments
   * @param {boolean} [isRecursive=false] - Whether this is a recursive call
   * @param {Object} [metadata={}] - Additional context information
   * @returns {AlgorithmInstrumentation} Self reference for method chaining
   */
  trackFunctionCall(functionName, args, isRecursive = false, metadata = {}) {
    if (!this.shouldTrackOperation('call')) return this;
    
    this.metrics.functionCalls++;
    
    // Track recursion metrics
    if (isRecursive) {
      this.metrics.recursiveCalls++;
      this.metrics.recursionDepth++;
      
      if (this.metrics.recursionDepth > this.metrics.maxRecursionDepth) {
        this.metrics.maxRecursionDepth = this.metrics.recursionDepth;
      }
    }
    
    // Update call stack if enabled
    if (this.config.trackCallStack) {
      this.profile.callStack.push({
        function: functionName,
        args: this.cloneArgs(args),
        time: this.getCurrentTime(),
        isRecursive
      });
    }
    
    // Initialize hotspot tracking for this function if needed
    if (!this.profile.hotspots[functionName]) {
      this.profile.hotspots[functionName] = {
        calls: 0,
        totalTime: 0,
        activeTime: 0,
        maxTime: 0,
        minTime: Infinity,
        avgTime: 0,
        recursiveCalls: 0
      };
    }
    
    this.profile.hotspots[functionName].calls++;
    if (isRecursive) {
      this.profile.hotspots[functionName].recursiveCalls++;
    }
    
    // Record the operation in timeline if enabled
    if (this.profile.operationTimeline.length < this.config.maxTimelineEvents) {
      this.profile.operationTimeline.push({
        type: 'call',
        time: this.getCurrentTime(),
        function: functionName,
        isRecursive,
        depth: this.metrics.recursionDepth,
        ...metadata
      });
    }
    
    // Track operation overhead
    this.trackOperationOverhead();
    
    return this;
  }
  
  /**
   * Clone function arguments to avoid reference issues
   * Handles special cases and uses structured cloning for objects
   * 
   * @private
   * @param {Array} args - The arguments to clone
   * @returns {Array} Cloned arguments
   */
  cloneArgs(args) {
    try {
      // For simple cases, create a shallow copy
      if (!args || args.length === 0) return [];
      if (args.length <= 2 && args.every(arg => 
        arg === null || 
        arg === undefined || 
        typeof arg === 'number' || 
        typeof arg === 'string' || 
        typeof arg === 'boolean'
      )) {
        return [...args];
      }
      
      // For complex arguments, just store types and lengths
      return args.map(arg => {
        if (arg === null || arg === undefined) return arg;
        if (['number', 'string', 'boolean'].includes(typeof arg)) return arg;
        if (Array.isArray(arg)) return `Array(${arg.length})`;
        if (typeof arg === 'object') return `Object(${Object.keys(arg).length} keys)`;
        if (typeof arg === 'function') return 'Function';
        return typeof arg;
      });
    } catch (e) {
      // Fallback for any cloning errors
      return ['[Arguments]'];
    }
  }
  
  /**
   * Track a function return with timing and performance metrics
   * 
   * @public
   * @param {string} functionName - The name of the function
   * @param {*} returnValue - The returned value
   * @param {boolean} [isRecursive=false] - Whether this was a recursive call
   * @param {Object} [metadata={}] - Additional context information
   * @returns {AlgorithmInstrumentation} Self reference for method chaining
   */
  trackFunctionReturn(functionName, returnValue, isRecursive = false, metadata = {}) {
    if (!this.shouldTrackOperation('return')) return this;
    
    // Get current time for timing calculations
    const currentTime = this.getCurrentTime();
    
    // Pop from call stack if tracking is enabled
    if (this.config.trackCallStack) {
      const call = this.profile.callStack.pop();
      
      if (!call || call.function !== functionName) {
        console.warn(`Call stack mismatch: expected ${functionName}, got ${call?.function}`);
      } else {
        const callDuration = currentTime - call.time;
        
        // Update hotspot stats
        this.profile.hotspots[functionName].totalTime += callDuration;
        
        if (callDuration > this.profile.hotspots[functionName].maxTime) {
          this.profile.hotspots[functionName].maxTime = callDuration;
        }
        
        if (callDuration < this.profile.hotspots[functionName].minTime) {
          this.profile.hotspots[functionName].minTime = callDuration;
        }
        
        // Update average time
        this.profile.hotspots[functionName].avgTime = 
          this.profile.hotspots[functionName].totalTime / this.profile.hotspots[functionName].calls;
      }
    }
    
    // Update recursion depth if recursive
    if (isRecursive) {
      this.metrics.recursionDepth--;
    }
    
    // Record the operation in timeline if enabled
    if (this.profile.operationTimeline.length < this.config.maxTimelineEvents) {
      this.profile.operationTimeline.push({
        type: 'return',
        time: currentTime,
        function: functionName,
        isRecursive,
        depth: this.metrics.recursionDepth,
        hasReturnValue: returnValue !== undefined && returnValue !== null,
        ...metadata
      });
    }
    
    // Track operation overhead
    this.trackOperationOverhead();
    
    return this;
  }
  
  /**
   * Track a branch/conditional operation for branching pattern analysis
   * 
   * @public
   * @param {boolean} condition - The branch condition result
   * @param {Object} [metadata={}] - Additional context information
   * @returns {AlgorithmInstrumentation} Self reference for method chaining
   */
  trackBranch(condition, metadata = {}) {
    if (!this.shouldTrackOperation('branch') || !this.config.monitorBranches) return this;
    
    this.metrics.branches++;
    this.metrics.branchHits[condition ? 'true' : 'false']++;
    
    // Record the operation in timeline if enabled
    if (this.profile.operationTimeline.length < this.config.maxTimelineEvents) {
      this.profile.operationTimeline.push({
        type: 'branch',
        time: this.getCurrentTime(),
        condition,
        ...metadata
      });
    }
    
    // Track operation overhead
    this.trackOperationOverhead();
    
    return this;
  }
  
  /**
   * Set the current algorithm phase and record phase transition
   * 
   * @public
   * @param {string} phase - The new phase name (e.g., 'initialization', 'partitioning', 'merging')
   * @param {Object} [metadata={}] - Additional information about the phase
   * @returns {AlgorithmInstrumentation} Self reference for method chaining
   */
  setPhase(phase, metadata = {}) {
    if (!this.config.detectPhases || phase === this.phases.current) return this;
    
    const now = this.getCurrentTime();
    
    // Record duration of previous phase
    if (this.phases.transitions.length > 0) {
      const prevPhase = this.phases.current;
      const prevStartTime = this.phases.startTimes[prevPhase] || this.metrics.startTime;
      const duration = now - prevStartTime;
      
      if (!this.phases.durations[prevPhase]) {
        this.phases.durations[prevPhase] = 0;
      }
      
      this.phases.durations[prevPhase] += duration;
      
      // Track phase-specific metrics
      if (!this.phases.phaseStats[prevPhase]) {
        this.phases.phaseStats[prevPhase] = {
          visits: 0,
          totalDuration: 0,
          comparisons: 0,
          swaps: 0,
          reads: 0,
          writes: 0
        };
      }
      
      // Get operation counts since last phase change
      const prevStats = this.phases.phaseStats[prevPhase];
      prevStats.visits++;
      prevStats.totalDuration += duration;
      
      // Update time distribution
      this.profile.timeDistribution[prevPhase] = 
        (this.profile.timeDistribution[prevPhase] || 0) + duration;
    }
    
    // Record the current phase start time
    this.phases.startTimes[phase] = now;
    
    // Initialize phase stats if needed
    if (!this.phases.phaseStats[phase]) {
      this.phases.phaseStats[phase] = {
        visits: 0,
        totalDuration: 0,
        comparisons: 0,
        swaps: 0,
        reads: 0,
        writes: 0,
        startMetrics: { ...this.metrics }
      };
    } else {
      // Update phase start metrics
      this.phases.phaseStats[phase].startMetrics = { ...this.metrics };
    }
    
    // Record the transition
    this.phases.transitions.push({
      phase,
      time: now,
      previousPhase: this.phases.current,
      ...metadata
    });
    
    this.phases.current = phase;
    
    return this;
  }
  
  /**
   * Track memory allocation for auxiliary space usage
   * 
   * @public
   * @param {number} bytes - Number of bytes allocated
   * @param {string} purpose - What the memory is used for
   * @returns {AlgorithmInstrumentation} Self reference for method chaining
   */
  trackMemoryAllocation(bytes, purpose) {
    if (!this.shouldTrackOperation('memory')) return this;
    
    this.metrics.auxiliarySpace += bytes;
    this.metrics.memoryUsage += bytes;
    
    // Update maximum memory usage
    if (this.metrics.memoryUsage > this.metrics.maxAuxiliarySpace) {
      this.metrics.maxAuxiliarySpace = this.metrics.memoryUsage;
    }
    
    // Record the snapshot
    this.profile.memoryUsageTimeline.push({
      time: this.getCurrentTime(),
      totalBytes: this.metrics.memoryUsage,
      operation: 'allocate',
      bytes,
      purpose
    });
    
    return this;
  }
  
  /**
   * Track memory deallocation
   * 
   * @public
   * @param {number} bytes - Number of bytes freed
   * @param {string} purpose - What the memory was used for
   * @returns {AlgorithmInstrumentation} Self reference for method chaining
   */
  trackMemoryDeallocation(bytes, purpose) {
    if (!this.shouldTrackOperation('memory')) return this;
    
    this.metrics.memoryUsage = Math.max(0, this.metrics.memoryUsage - bytes);
    
    // Record the snapshot
    this.profile.memoryUsageTimeline.push({
      time: this.getCurrentTime(),
      totalBytes: this.metrics.memoryUsage,
      operation: 'deallocate',
      bytes,
      purpose
    });
    
    return this;
  }
  
  /**
   * Simulate cache behavior for memory access
   * Models LRU cache behavior with configurable cache size
   * 
   * @public
   * @param {number} index - The array index being accessed
   * @param {string} operation - 'read' or 'write'
   * @returns {boolean} Whether the access was a cache hit
   */
  simulateCacheAccess(index, operation) {
    if (!this.config.simulateCache) return true;
    
    // Simple cache simulation using LRU (Least Recently Used) policy
    const cacheKey = index.toString();
    
    if (this.cacheSimulation.cache.has(cacheKey)) {
      // Cache hit
      this.cacheSimulation.cacheHits++;
      this.metrics.cacheHits++;
      
      // Update LRU status by removing and re-adding
      this.cacheSimulation.cache.delete(cacheKey);
      this.cacheSimulation.cache.set(cacheKey, {
        index,
        lastAccessed: this.getCurrentTime(),
        operation
      });
      
      return true;
    } else {
      // Cache miss
      this.cacheSimulation.cacheMisses++;
      this.metrics.cacheMisses++;
      
      // Track miss distribution
      this.cacheSimulation.missDistribution[index] = 
        (this.cacheSimulation.missDistribution[index] || 0) + 1;
      
      // Check if cache is full
      if (this.cacheSimulation.cache.size >= this.cacheSimulation.cacheSize) {
        // Find least recently used entry
        let oldestKey = null;
        let oldestTime = Infinity;
        
        for (const [key, entry] of this.cacheSimulation.cache.entries()) {
          if (entry.lastAccessed < oldestTime) {
            oldestTime = entry.lastAccessed;
            oldestKey = key;
          }
        }
        
        // Evict the oldest entry
        if (oldestKey) {
          this.cacheSimulation.cache.delete(oldestKey);
          this.cacheSimulation.evictions++;
          this.metrics.cacheEvictions++;
        }
      }
      
      // Add new entry to cache
      this.cacheSimulation.cache.set(cacheKey, {
        index,
        lastAccessed: this.getCurrentTime(),
        operation
      });
      
      return false;
    }
  }
  
  /**
   * Track the instrumentation overhead for self-analysis
   * Measures time spent in instrumentation functions
   * 
   * @private
   */
  trackOperationOverhead() {
    const now = performance.now();
    const elapsed = now - this._lastOperationTime;
    
    // Only count time if it's reasonable (avoid timer precision issues)
    if (elapsed > 0 && elapsed < 10) {
      this._operationOverhead += elapsed;
    }
    
    this._lastOperationTime = now;
  }
  
  /**
   * Get the current time adjusted for paused periods
   * 
   * @private
   * @returns {number} Current adjusted time
   */
  getCurrentTime() {
    return performance.now() - this._pausedTime;
  }
  
  /**
   * Generate a comprehensive analysis report of algorithm performance
   * 
   * @public
   * @returns {Object} Detailed analysis report
   */
  generateReport() {
    // Ensure derived metrics are calculated
    this.calculateDerivedMetrics();
    
    const totalOperations = this.metrics.comparisons + 
                           this.metrics.swaps + 
                           this.metrics.reads + 
                           this.metrics.writes;
    
    const totalElements = Math.max(
      this.accessPatterns.readIndices.length, 
      this.accessPatterns.writeIndices.length, 
      1
    );
    
    return {
      // Basic metrics
      metrics: { ...this.metrics },
      
      // Performance summary
      performance: {
        operationsPerSecond: totalOperations / (this.metrics.executionTime / 1000 || 1),
        averageTimePerOperation: this.metrics.executionTime / (totalOperations || 1),
        cacheHitRate: this.cacheSimulation.cacheHits / 
                     (this.cacheSimulation.cacheHits + this.cacheSimulation.cacheMisses || 1),
        branchPredictability: this.metrics.branchHits.true / 
                             (this.metrics.branches || 1),
        instrumentationOverhead: this._operationOverhead,
        overheadPercentage: (this._operationOverhead / this.metrics.executionTime) * 100
      },
      
      // Access pattern analysis
      accessPatterns: {
        sequentialRatio: this.accessPatterns.sequentialAccesses / 
                        (this.accessPatterns.sequentialAccesses + this.accessPatterns.randomAccesses || 1),
        mostAccessedIndices: this.getMostAccessedIndices(10),
        accessDistribution: this.getAccessDistribution(),
        hotspots: this.getAccessHotspots(),
        readWriteRatio: this.metrics.reads / (this.metrics.writes || 1)
      },
      
      // Movement efficiency
      movementEfficiency: {
        totalDistance: this.elementMovements.totalDistance,
        averageDistance: this.metrics.avgMoveDistance,
        farthestMovingElements: this.getFarthestMovingElements(10),
        movesPerElement: Object.keys(this.elementMovements.movesPerElement).length > 0 ? 
          this.elementMovements.movesPerElement : undefined
      },
      
      // Time distribution across phases
      phaseAnalysis: {
        phases: this.phases.durations,
        transitionPoints: this.phases.transitions.map(t => ({
          from: t.previousPhase,
          to: t.phase,
          timeMs: t.time - this.metrics.startTime
        })),
        phaseMetrics: this.getPhaseMetrics()
      },
      
      // Execution profile
      profile: {
        hotspots: Object.entries(this.profile.hotspots).map(([name, stats]) => ({
          function: name,
          calls: stats.calls,
          totalTimeMs: stats.totalTime,
          averageTimeMs: stats.avgTime,
          percentageOfTotal: (stats.totalTime / this.metrics.executionTime) * 100
        })).sort((a, b) => b.totalTimeMs - a.totalTimeMs),
        
        callTreeDepth: this.metrics.maxRecursionDepth,
        timelineEvents: this.profile.operationTimeline.length
      },
      
      // Cache analysis
      cacheAnalysis: {
        hitRatio: this.cacheSimulation.hitRatio,
        missRatio: this.cacheSimulation.missRatio,
        evictions: this.cacheSimulation.evictions,
        missHotspots: this.getMissClusters()
      },
      
      // Efficiency metrics
      efficiency: {
        operationsPerElement: totalOperations / totalElements,
        memoryEfficiency: this.metrics.memoryAccesses / (totalOperations || 1),
        algorithmicWork: this.calculateAlgorithmicWork(),
        spaceComplexityRatio: this.metrics.maxAuxiliarySpace / totalElements
      }
    };
  }
  
  /**
   * Get the most frequently accessed indices
   * 
   * @private
   * @param {number} limit - Maximum number of indices to return
   * @returns {Array} Array of [index, count] pairs
   */
  getMostAccessedIndices(limit) {
    return Object.entries(this.accessPatterns.accessFrequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([index, count]) => ({
        index: parseInt(index, 10),
        count,
        percentage: (count / (this.metrics.reads + this.metrics.writes)) * 100
      }));
  }
  
  /**
   * Get access distribution information for visualization and analysis
   * 
   * @private
   * @returns {Object} Distribution data
   */
  getAccessDistribution() {
    const allAccesses = [...this.accessPatterns.readIndices, ...this.accessPatterns.writeIndices];
    
    if (allAccesses.length === 0) {
      return { uniform: true, clusters: [] };
    }
    
    // Calculate simple distribution metrics
    const min = Math.min(...allAccesses);
    const max = Math.max(...allAccesses);
    const range = max - min + 1;
    
    // Create histogram 
    const bucketCount = Math.min(20, range);
    const bucketSize = range / bucketCount;
    const histogram = Array(bucketCount).fill(0);
    
    allAccesses.forEach(index => {
      const bucketIndex = Math.min(
        bucketCount - 1, 
        Math.floor((index - min) / bucketSize)
      );
      histogram[bucketIndex]++;
    });
    
    // Find access clusters (regions of high access frequency)
    const clusters = [];
    let currentCluster = null;
    
    for (let i = 0; i < bucketCount; i++) {
      const density = histogram[i] / allAccesses.length;
      
      if (density > 0.1) { // Arbitrary threshold for a "cluster"
        if (!currentCluster) {
          currentCluster = {
            startBucket: i,
            endBucket: i,
            count: histogram[i],
            startIndex: min + Math.floor(i * bucketSize),
            endIndex: min + Math.floor((i + 1) * bucketSize) - 1
          };
        } else {
          currentCluster.endBucket = i;
          currentCluster.count += histogram[i];
          currentCluster.endIndex = min + Math.floor((i + 1) * bucketSize) - 1;
        }
      } else if (currentCluster) {
        clusters.push(currentCluster);
        currentCluster = null;
      }
    }
    
    if (currentCluster) {
      clusters.push(currentCluster);
    }
    
    // Calculate uniformity measure (how evenly distributed the accesses are)
    const idealCount = allAccesses.length / bucketCount;
    const deviations = histogram.map(count => Math.abs(count - idealCount));
    const uniformity = 1 - (deviations.reduce((sum, dev) => sum + dev, 0) / allAccesses.length);
    
    return {
      histogram,
      bucketSize,
      min,
      max,
      uniformity,
      clusters
    };
  }
  
  /**
   * Identify access hotspots (regions of high access frequency)
   * 
   * @private
   * @returns {Array} Array of hotspot regions
   */
  getAccessHotspots() {
    const accessDistribution = this.getAccessDistribution();
    
    // Convert the high-frequency clusters to hotspots
    return accessDistribution.clusters.map(cluster => ({
      startIndex: cluster.startIndex,
      endIndex: cluster.endIndex,
      accessCount: cluster.count,
      percentageOfTotal: (cluster.count / 
        (this.metrics.reads + this.metrics.writes)) * 100
    }));
  }
  
  /**
   * Get elements that moved the farthest during sorting
   * 
   * @private
   * @param {number} limit - Maximum number of elements to return
   * @returns {Array} Array of elements and their movement distances
   */
  getFarthestMovingElements(limit) {
    return Object.entries(this.elementMovements.distances)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([element, distance]) => ({
        element,
        distance,
        path: this.elementMovements.paths[element],
        moves: this.elementMovements.movesPerElement[element] || 0
      }));
  }
  
  /**
   * Get metrics broken down by algorithm phase
   * 
   * @private
   * @returns {Object} Phase-specific metrics
   */
  getPhaseMetrics() {
    const result = {};
    
    // Calculate phase-specific metrics
    for (const [phase, stats] of Object.entries(this.phases.phaseStats)) {
      if (phase === 'initialization' || !stats || stats.visits === 0) continue;
      
      // Get next phase with metrics to compute deltas
      const nextPhaseData = this.phases.transitions.find(
        t => t.previousPhase === phase
      );
      
      if (!nextPhaseData) continue;
      
      const nextPhase = nextPhaseData.phase;
      const nextPhaseStats = this.phases.phaseStats[nextPhase];
      
      if (!nextPhaseStats) continue;
      
      // Calculate operation deltas between phases
      result[phase] = {
        duration: stats.totalDuration,
        percentOfTotal: (stats.totalDuration / this.metrics.executionTime) * 100,
        operations: {
          comparisons: nextPhaseStats.startMetrics.comparisons - stats.startMetrics.comparisons,
          swaps: nextPhaseStats.startMetrics.swaps - stats.startMetrics.swaps,
          reads: nextPhaseStats.startMetrics.reads - stats.startMetrics.reads,
          writes: nextPhaseStats.startMetrics.writes - stats.startMetrics.writes
        },
        operationsPerSecond: (
          (nextPhaseStats.startMetrics.comparisons - stats.startMetrics.comparisons) +
          (nextPhaseStats.startMetrics.swaps - stats.startMetrics.swaps) +
          (nextPhaseStats.startMetrics.reads - stats.startMetrics.reads) +
          (nextPhaseStats.startMetrics.writes - stats.startMetrics.writes)
        ) / (stats.totalDuration / 1000)
      };
    }
    
    return result;
  }
  
  /**
   * Identify cache miss hotspots
   * 
   * @private
   * @returns {Array} Cache miss clusters
   */
  getMissClusters() {
    if (Object.keys(this.cacheSimulation.missDistribution).length === 0) return [];
    
    // Find indices with high miss rates
    return Object.entries(this.cacheSimulation.missDistribution)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([index, count]) => ({
        index: parseInt(index, 10),
        missCount: count,
        percentage: (count / this.cacheSimulation.cacheMisses) * 100
      }));
  }
  
  /**
   * Calculate a weighted measure of "algorithmic work"
   * Provides a standardized metric for algorithm efficiency
   * 
   * @private
   * @returns {number} Work metric
   */
  calculateAlgorithmicWork() {
    // Simplified metric: weighted sum of operations
    return (
      this.metrics.comparisons * 1 +
      this.metrics.swaps * 2 +
      this.metrics.reads * 0.5 +
      this.metrics.writes * 1 +
      this.elementMovements.totalDistance * 0.1
    );
  }
  
  /**
   * Get a simplified metrics snapshot for real-time monitoring
   * 
   * @public
   * @returns {Object} Simple metrics overview
   */
  getSimpleMetrics() {
    return {
      comparisons: this.metrics.comparisons,
      swaps: this.metrics.swaps,
      reads: this.metrics.reads,
      writes: this.metrics.writes,
      totalOps: this.metrics.comparisons + this.metrics.swaps + 
                this.metrics.reads + this.metrics.writes,
      executionTime: this.metrics.executionTime,
      recursionDepth: this.metrics.recursionDepth,
      currentPhase: this.phases.current
    };
  }
  
  /**
   * Get memory access heatmap data for visualization
   * 
   * @public
   * @returns {Object} Memory access heatmap
   */
  getMemoryHeatmap() {
    return {
      heatmap: this.accessPatterns.accessHeatmap,
      maxAccess: Math.max(...Object.values(this.accessPatterns.accessHeatmap), 1),
      totalAccesses: this.metrics.reads + this.metrics.writes,
      reads: this.accessPatterns.readIndices,
      writes: this.accessPatterns.writeIndices
    };
  }
  
  /**
   * Export operation timeline for external analysis or playback
   * 
   * @public
   * @param {number} [limit=null] - Maximum number of events to export
   * @returns {Array} Timeline of operations
   */
  exportTimeline(limit = null) {
    const timeline = this.profile.operationTimeline;
    return limit ? timeline.slice(0, limit) : timeline;
  }
}

export default AlgorithmInstrumentation;