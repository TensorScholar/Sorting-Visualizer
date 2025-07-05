// tests/js/utils/python-js-bridge.test.js

/**
 * Comprehensive test suite for the Python-JavaScript bridge module
 * 
 * These tests ensure that the bridge correctly facilitates communication between
 * JavaScript frontend and Python backend implementations, with proper serialization,
 * error handling, and performance characteristics.
 * 
 * @module tests/js/utils/python-js-bridge.test.js
 */

import PythonJSBridge from '../../../src/utils/python-js-bridge';
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

// Mock dependencies
jest.mock('child_process');
jest.mock('fs');
jest.mock('path');

/**
 * Utility function to create a default successful Python process response
 * 
 * @param {Object} data - The data to include in the response
 * @returns {Object} - Mock configuration for spawn
 */
function mockSuccessfulPythonProcess(data) {
  // Create a mock stdout that emits the JSON data
  const stdoutEmit = jest.fn((event, listener) => {
    if (event === 'data') {
      listener(Buffer.from(JSON.stringify(data)));
    }
    return { on: stdoutEmit };
  });
  
  // Create a mock process with stdout, stderr, and close event
  const mockProcess = {
    stdout: { on: stdoutEmit },
    stderr: { on: jest.fn((event, listener) => {
      if (event === 'data') {
        // No stderr output for successful execution
      }
      return { on: jest.fn() };
    })},
    on: jest.fn((event, listener) => {
      if (event === 'close') {
        listener(0); // Exit code 0 indicates success
      }
      return mockProcess;
    })
  };
  
  // Configure spawn mock to return our mock process
  spawn.mockReturnValue(mockProcess);
  
  return { mockProcess, stdoutEmit };
}

/**
 * Utility function to create a failed Python process response
 * 
 * @param {string} errorMessage - The error message to include
 * @param {number} exitCode - The process exit code
 * @returns {Object} - Mock configuration for spawn
 */
function mockFailedPythonProcess(errorMessage, exitCode = 1) {
  // Create a mock stderr that emits the error message
  const stderrEmit = jest.fn((event, listener) => {
    if (event === 'data') {
      listener(Buffer.from(errorMessage));
    }
    return { on: stderrEmit };
  });
  
  // Create a mock process with stdout, stderr, and close event
  const mockProcess = {
    stdout: { on: jest.fn((event, listener) => {
      return { on: jest.fn() };
    })},
    stderr: { on: stderrEmit },
    on: jest.fn((event, listener) => {
      if (event === 'close') {
        listener(exitCode);
      }
      return mockProcess;
    })
  };
  
  // Configure spawn mock to return our mock process
  spawn.mockReturnValue(mockProcess);
  
  return { mockProcess, stderrEmit };
}

describe('Python-JavaScript Bridge', () => {
  // Setup for each test
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Mock filesystem operations
    fs.writeFileSync.mockImplementation(() => {});
    path.join.mockImplementation((...args) => args.join('/'));
    
    // Mock dirname and fileURLToPath operations
    const mockDirname = '/mock/path';
    path.dirname.mockReturnValue(mockDirname);
    
    // Mock fileURLToPath to return a dummy file path
    const mockFileURLPath = 'file:///mock/path/to/file.js';
    require('url').fileURLToPath = jest.fn(() => mockFileURLPath);
  });
  
  // Basic functionality tests
  describe('Basic Functionality', () => {
    test('should initialize with default options', () => {
      const bridge = new PythonJSBridge();
      
      expect(bridge.options.pythonPath).toBe('python');
      expect(bridge.options.debug).toBe(false);
      expect(bridge.pythonProcess).toBeNull();
      expect(bridge.algorithmMap).toBeInstanceOf(Map);
      expect(bridge.resultCallbacks).toBeInstanceOf(Map);
    });
    
    test('should initialize with custom options', () => {
      const options = {
        pythonPath: '/usr/bin/python3',
        scriptDir: '/custom/dir',
        debug: true
      };
      
      const bridge = new PythonJSBridge(options);
      
      expect(bridge.options.pythonPath).toBe(options.pythonPath);
      expect(bridge.options.scriptDir).toBe(options.scriptDir);
      expect(bridge.options.debug).toBe(options.debug);
    });
    
    test('should initialize algorithm map with known algorithms', () => {
      const bridge = new PythonJSBridge();
      
      // Check a few expected mappings
      expect(bridge.algorithmMap.has('bubble-sort')).toBe(true);
      expect(bridge.algorithmMap.has('quick-sort')).toBe(true);
      expect(bridge.algorithmMap.has('merge-sort')).toBe(true);
      
      // Check specific mapping structure
      const bubbleSortMapping = bridge.algorithmMap.get('bubble-sort');
      expect(bubbleSortMapping).toHaveProperty('module', 'bubble_sort');
      expect(bubbleSortMapping).toHaveProperty('class', 'BubbleSort');
    });
  });
  
  // Algorithm execution tests
  describe('Algorithm Execution', () => {
    test('should execute Python algorithm with correct parameters', async () => {
      // Mock a successful Python process
      const mockResult = {
        result: [1, 2, 3, 4, 5],
        metrics: {
          comparisons: 10,
          swaps: 4,
          reads: 20,
          writes: 8,
          execution_time: 0.001
        },
        history: [
          { array: [5, 4, 3, 2, 1], type: 'initial' },
          { array: [1, 2, 3, 4, 5], type: 'final' }
        ]
      };
      
      mockSuccessfulPythonProcess(mockResult);
      
      // Create bridge and execute algorithm
      const bridge = new PythonJSBridge({ debug: true });
      const data = [5, 4, 3, 2, 1];
      const options = { optimize: true };
      
      const result = await bridge.executeAlgorithm('bubble-sort', data, options);
      
      // Check spawn was called with correct arguments
      expect(spawn).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining([expect.any(String), expect.any(String)])
      );
      
      // Check file was written with correct data
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        expect.any(String),
        expect.stringContaining(JSON.stringify({
          data: data,
          options: expect.any(Object)
        }, null, 2))
      );
      
      // Check result matches mock
      expect(result).toEqual(mockResult);
    });
    
    test('should handle algorithm execution error', async () => {
      // Mock a failed Python process
      const errorMessage = 'Algorithm execution failed: IndexError: list index out of range';
      mockFailedPythonProcess(errorMessage);
      
      // Create bridge and attempt to execute algorithm
      const bridge = new PythonJSBridge();
      const data = [5, 4, 3, 2, 1];
      
      // Execution should reject with error
      await expect(bridge.executeAlgorithm('bubble-sort', data, {}))
        .rejects.toThrow(errorMessage);
      
      // Check spawn was still called
      expect(spawn).toHaveBeenCalled();
    });
    
    test('should handle unknown algorithm error', async () => {
      const bridge = new PythonJSBridge();
      const data = [5, 4, 3, 2, 1];
      
      // Should throw error for unknown algorithm
      await expect(bridge.executeAlgorithm('non-existent-algorithm', data, {}))
        .rejects.toThrow('Unknown algorithm');
      
      // Spawn should not be called
      expect(spawn).not.toHaveBeenCalled();
    });
    
    test('should handle malformed JSON output', async () => {
      // Create a mock process with malformed stdout
      const stdoutEmit = jest.fn((event, listener) => {
        if (event === 'data') {
          listener(Buffer.from('This is not valid JSON'));
        }
        return { on: stdoutEmit };
      });
      
      const mockProcess = {
        stdout: { on: stdoutEmit },
        stderr: { on: jest.fn(() => ({ on: jest.fn() })) },
        on: jest.fn((event, listener) => {
          if (event === 'close') {
            listener(0); // Exit code 0 but invalid JSON
          }
          return mockProcess;
        })
      };
      
      spawn.mockReturnValue(mockProcess);
      
      // Create bridge and attempt to execute algorithm
      const bridge = new PythonJSBridge();
      const data = [5, 4, 3, 2, 1];
      
      // Execution should reject with error
      await expect(bridge.executeAlgorithm('bubble-sort', data, {}))
        .rejects.toThrow('Failed to parse Python output');
    });
  });
  
  // Option conversion tests
  describe('Option Conversion', () => {
    test('should convert JavaScript camelCase options to Python snake_case', () => {
      const bridge = new PythonJSBridge();
      
      // Use private method directly for testing
      const jsOptions = {
        insertionThreshold: 10,
        optimizeMerge: true,
        threeWayPartition: false,
        maxRecursionDepth: 100
      };
      
      const pythonOptions = bridge._convertOptionsToPython(jsOptions);
      
      // Check conversion
      expect(pythonOptions).toEqual({
        insertion_threshold: 10,
        optimize_merge: true,
        three_way_partition: false,
        max_recursion_depth: 100
      });
    });
  });
  
  // Implementation comparison tests
  describe('Implementation Comparison', () => {
    test('should compare JavaScript and Python implementations', async () => {
      // Mock JavaScript algorithm
      const jsAlgorithm = {
        execute: jest.fn().mockReturnValue([1, 2, 3, 4, 5]),
        metrics: {
          comparisons: 10,
          swaps: 4,
          reads: 20,
          writes: 8,
          executionTime: 1.5
        },
        history: [
          { array: [5, 4, 3, 2, 1], type: 'initial' },
          { array: [1, 2, 3, 4, 5], type: 'final' }
        ]
      };
      
      // Mock Python execution result
      const pyResult = {
        result: [1, 2, 3, 4, 5],
        metrics: {
          comparisons: 10,
          swaps: 4,
          reads: 22,
          writes: 8,
          execution_time: 0.002 // seconds
        },
        history: [
          { array: [5, 4, 3, 2, 1], type: 'initial' },
          { array: [1, 2, 3, 4, 5], type: 'final' }
        ]
      };
      
      mockSuccessfulPythonProcess(pyResult);
      
      // Create bridge and run comparison
      const bridge = new PythonJSBridge();
      bridge.executeAlgorithm = jest.fn().mockResolvedValue(pyResult);
      
      const data = [5, 4, 3, 2, 1];
      const options = { optimize: true };
      
      const comparison = await bridge.compareImplementations(jsAlgorithm, 'bubble-sort', data, options);
      
      // Check JavaScript algorithm was executed
      expect(jsAlgorithm.execute).toHaveBeenCalledWith([...data], options);
      
      // Check Python algorithm was executed
      expect(bridge.executeAlgorithm).toHaveBeenCalledWith('bubble-sort', data, options);
      
      // Check comparison result structure
      expect(comparison).toHaveProperty('algorithm', 'bubble-sort');
      expect(comparison).toHaveProperty('inputSize', data.length);
      expect(comparison).toHaveProperty('javascript.executionTime', jsAlgorithm.metrics.executionTime);
      expect(comparison).toHaveProperty('python.executionTime', pyResult.metrics.execution_time * 1000);
      expect(comparison).toHaveProperty('comparison.resultsMatch', true);
      expect(comparison).toHaveProperty('comparison.speedRatio');
      expect(comparison).toHaveProperty('comparison.operationCounts.comparisons');
      expect(comparison).toHaveProperty('jsHistory', jsAlgorithm.history);
      expect(comparison).toHaveProperty('pyHistory', pyResult.history);
    });
    
    test('should detect differences in sort results', async () => {
      // Mock JavaScript algorithm with different result
      const jsAlgorithm = {
        execute: jest.fn().mockReturnValue([1, 2, 3, 4, 5]),
        metrics: { comparisons: 10, swaps: 4, executionTime: 1.5 },
        history: []
      };
      
      // Mock Python execution with different result
      const pyResult = {
        result: [1, 2, 3, 5, 4], // Different order
        metrics: { comparisons: 10, swaps: 4, execution_time: 0.002 },
        history: []
      };
      
      mockSuccessfulPythonProcess(pyResult);
      
      // Create bridge and run comparison
      const bridge = new PythonJSBridge();
      bridge.executeAlgorithm = jest.fn().mockResolvedValue(pyResult);
      
      const data = [5, 4, 3, 2, 1];
      
      const comparison = await bridge.compareImplementations(jsAlgorithm, 'bubble-sort', data, {});
      
      // Comparison should detect different results
      expect(comparison.comparison.resultsMatch).toBe(false);
    });
  });
  
  // Algorithm history tests
  describe('Algorithm History', () => {
    test('should retrieve and convert algorithm history', async () => {
      // Mock Python execution result with history
      const pyResult = {
        result: [1, 2, 3, 4, 5],
        metrics: { comparisons: 10, swaps: 4, execution_time: 0.002 },
        history: [
          { array: [5, 4, 3, 2, 1], type: 'initial', message: 'Initial state' },
          { array: [4, 5, 3, 2, 1], type: 'swap', indices: [0, 1], message: 'Swapped 5 and 4' },
          { array: [1, 2, 3, 4, 5], type: 'final', message: 'Final state' }
        ]
      };
      
      mockSuccessfulPythonProcess(pyResult);
      
      // Create bridge and get history
      const bridge = new PythonJSBridge();
      bridge.executeAlgorithm = jest.fn().mockResolvedValue(pyResult);
      
      const data = [5, 4, 3, 2, 1];
      const options = { record_history: true };
      
      const history = await bridge.getAlgorithmHistory('bubble-sort', data, {});
      
      // Check Python algorithm was executed with history recording enabled
      expect(bridge.executeAlgorithm).toHaveBeenCalledWith('bubble-sort', data, {
        record_history: true
      });
      
      // Check history was converted to JavaScript format
      expect(history).toEqual(pyResult.history.map(state => ({
        ...state,
        // No conversion needed in this example, but the conversion function would be called
      })));
    });
  });
  
  // State conversion tests
  describe('State Conversion', () => {
    test('should convert Python state format to JavaScript format', () => {
      const bridge = new PythonJSBridge();
      
      // Use private method directly for testing
      const pythonState = {
        array: [1, 2, 3, 4, 5],
        type: 'swap',
        indices: [0, 1],
        message: 'Swapped elements',
        heap_structure: {
          nodes: [
            { id: 0, value: 5, level: 0, is_leaf: false }
          ],
          edges: [
            { from: 0, to: 1, type: 'left' }
          ],
          highlight: 0
        },
        recursive_depth: 3,
        execution_time: 0.001
      };
      
      const jsState = bridge._convertStateFormat(pythonState);
      
      // Check conversion of snake_case to camelCase
      expect(jsState).toHaveProperty('array', pythonState.array);
      expect(jsState).toHaveProperty('type', pythonState.type);
      expect(jsState).toHaveProperty('indices', pythonState.indices);
      expect(jsState).toHaveProperty('message', pythonState.message);
      expect(jsState).toHaveProperty('heapStructure'); // Converted from heap_structure
      expect(jsState).toHaveProperty('recursiveDepth'); // Converted from recursive_depth
      expect(jsState).toHaveProperty('executionTime'); // Converted from execution_time
      
      // Check nested object conversion
      expect(jsState.heapStructure.nodes[0]).toHaveProperty('id', 0);
      expect(jsState.heapStructure.nodes[0]).toHaveProperty('value', 5);
      expect(jsState.heapStructure.nodes[0]).toHaveProperty('level', 0);
      expect(jsState.heapStructure.nodes[0]).toHaveProperty('isLeaf'); // Converted from is_leaf
    });
  });
  
  // Integration tests
  describe('Integration', () => {
    test('should generate correct Python script for execution', () => {
      const bridge = new PythonJSBridge();
      
      // Use private method directly for testing
      const moduleName = 'bubble_sort';
      const className = 'BubbleSort';
      
      const script = bridge._generatePythonScript(moduleName, className);
      
      // Check script structure
      expect(script).toContain('#!/usr/bin/env python3');
      expect(script).toContain(`from algorithms.sorting.${moduleName} import ${className}`);
      expect(script).toContain('algorithm = BubbleSort(options)');
      expect(script).toContain('result = algorithm.execute(data)');
      expect(script).toContain('print(json.dumps(output))');
    });
    
    test('should compare arrays correctly', () => {
      const bridge = new PythonJSBridge();
      
      // Use private method directly for testing
      
      // Equal arrays
      expect(bridge._compareArrays([1, 2, 3], [1, 2, 3])).toBe(true);
      
      // Different length
      expect(bridge._compareArrays([1, 2, 3], [1, 2])).toBe(false);
      
      // Same length but different values
      expect(bridge._compareArrays([1, 2, 3], [1, 2, 4])).toBe(false);
      
      // Empty arrays
      expect(bridge._compareArrays([], [])).toBe(true);
    });
  });
  
  // Performance tests
  describe('Performance', () => {
    test('should accurately report performance ratio between implementations', async () => {
      // Mock JavaScript algorithm with known execution time
      const jsAlgorithm = {
        execute: jest.fn().mockReturnValue([1, 2, 3, 4, 5]),
        metrics: { executionTime: 10 }, // 10ms
        history: []
      };
      
      // Mock Python execution with different execution time
      const pyResult = {
        result: [1, 2, 3, 4, 5],
        metrics: { execution_time: 0.04 }, // 40ms (0.04s)
        history: []
      };
      
      mockSuccessfulPythonProcess(pyResult);
      
      // Create bridge and run comparison
      const bridge = new PythonJSBridge();
      bridge.executeAlgorithm = jest.fn().mockResolvedValue(pyResult);
      
      const data = [5, 4, 3, 2, 1];
      
      const comparison = await bridge.compareImplementations(jsAlgorithm, 'bubble-sort', data, {});
      
      // Check speed ratio calculation (JS time / Python time)
      // JS: 10ms, Python: 40ms => Ratio should be 10/40 = 0.25
      expect(comparison.comparison.speedRatio).toBeCloseTo(0.25, 2);
    });
  });
});
