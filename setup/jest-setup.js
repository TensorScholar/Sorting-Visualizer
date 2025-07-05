// setup/jest.setup.js

/**
 * Advanced Jest configuration for the Sorting Algorithm Visualization Platform
 * 
 * This configuration establishes the testing environment and global mocks required
 * for comprehensive testing of algorithm implementations, visualization components,
 * and React integration. It's designed to handle WebGL rendering contexts, 
 * performance timers, and complex DOM interactions specific to algorithm visualization.
 * 
 * @module jest.setup
 * @author Sorting Visualizer Team
 */

// Import Jest DOM extensions for enhanced DOM testing capabilities
import '@testing-library/jest-dom';

// Import performance-related polyfills for accurate algorithm metrics
import 'jest-performance-timers';

// Define global mocks and test environment parameters
global.beforeEach(() => {
  // Reset all mocks before each test to ensure test isolation
  jest.clearAllMocks();
  
  // Reset any accumulated performance metrics
  performance.clearMarks();
  performance.clearMeasures();
});

/**
 * Mock for the WebGL rendering context
 * Simulates the WebGL API for testing visualization components without actual rendering
 */
class MockWebGLRenderingContext {
  constructor() {
    // WebGL constants
    this.ARRAY_BUFFER = 34962;
    this.ELEMENT_ARRAY_BUFFER = 34963;
    this.STATIC_DRAW = 35044;
    this.DYNAMIC_DRAW = 35048;
    this.FLOAT = 5126;
    this.UNSIGNED_INT = 5125;
    this.TRIANGLES = 4;
    this.LINES = 1;
    this.COLOR_BUFFER_BIT = 16384;
    this.DEPTH_BUFFER_BIT = 256;
    this.COMPILE_STATUS = 35713;
    this.LINK_STATUS = 35714;
    this.VERTEX_SHADER = 35633;
    this.FRAGMENT_SHADER = 35632;

    // Track created resources for verification and cleanup
    this.buffers = new Map();
    this.shaders = new Map();
    this.programs = new Map();
    this.textures = new Map();
    this.framebuffers = new Map();
    this.renderbuffers = new Map();
    this.vertexArrays = new Map();

    // Mock function implementations with appropriate return values
    this.createBuffer = jest.fn(() => {
      const id = `buffer-${this.buffers.size + 1}`;
      this.buffers.set(id, { id, data: null });
      return id;
    });

    this.bindBuffer = jest.fn();
    this.bufferData = jest.fn();
    this.deleteBuffer = jest.fn();

    this.createShader = jest.fn((type) => {
      const id = `shader-${this.shaders.size + 1}`;
      this.shaders.set(id, { id, type, source: null, compiled: false });
      return id;
    });

    this.shaderSource = jest.fn();
    this.compileShader = jest.fn();
    this.getShaderParameter = jest.fn().mockReturnValue(true); // Assume successful compilation
    this.getShaderInfoLog = jest.fn().mockReturnValue('');
    this.deleteShader = jest.fn();

    this.createProgram = jest.fn(() => {
      const id = `program-${this.programs.size + 1}`;
      this.programs.set(id, { id, linked: false, shaders: [] });
      return id;
    });

    this.attachShader = jest.fn();
    this.detachShader = jest.fn();
    this.linkProgram = jest.fn();
    this.getProgramParameter = jest.fn().mockReturnValue(true); // Assume successful linking
    this.getProgramInfoLog = jest.fn().mockReturnValue('');
    this.useProgram = jest.fn();
    this.deleteProgram = jest.fn();

    this.getUniformLocation = jest.fn().mockReturnValue({});
    this.getAttribLocation = jest.fn().mockReturnValue(0);
    this.enableVertexAttribArray = jest.fn();
    this.disableVertexAttribArray = jest.fn();
    this.vertexAttribPointer = jest.fn();

    this.drawArrays = jest.fn();
    this.drawElements = jest.fn();
    this.clear = jest.fn();
    this.clearColor = jest.fn();
    this.viewport = jest.fn();

    // WebGL2 specific methods
    this.createVertexArray = jest.fn(() => {
      const id = `vao-${this.vertexArrays.size + 1}`;
      this.vertexArrays.set(id, { id });
      return id;
    });
    
    this.bindVertexArray = jest.fn();
    this.deleteVertexArray = jest.fn();
  }

  // Helper for test verification
  getCreatedResourceCount() {
    return {
      buffers: this.buffers.size,
      shaders: this.shaders.size,
      programs: this.programs.size,
      textures: this.textures.size,
      framebuffers: this.framebuffers.size,
      renderbuffers: this.renderbuffers.size,
      vertexArrays: this.vertexArrays.size
    };
  }
}

/**
 * Mock for the HTML Canvas element
 * Enables testing of canvas-based visualizations without actual rendering
 */
class MockCanvasRenderingContext2D {
  constructor() {
    this.canvas = {
      width: 800,
      height: 600
    };
    
    // Drawing state
    this.fillStyle = '#000000';
    this.strokeStyle = '#000000';
    this.lineWidth = 1;
    this.font = '10px sans-serif';
    this.textAlign = 'start';
    this.textBaseline = 'alphabetic';
    
    // Transform state
    this.currentTransform = { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 };
    
    // Mock drawing methods
    this.beginPath = jest.fn();
    this.closePath = jest.fn();
    this.moveTo = jest.fn();
    this.lineTo = jest.fn();
    this.arc = jest.fn();
    this.arcTo = jest.fn();
    this.bezierCurveTo = jest.fn();
    this.quadraticCurveTo = jest.fn();
    this.rect = jest.fn();
    this.fill = jest.fn();
    this.stroke = jest.fn();
    this.clip = jest.fn();
    this.clearRect = jest.fn();
    this.fillRect = jest.fn();
    this.strokeRect = jest.fn();
    this.fillText = jest.fn();
    this.strokeText = jest.fn();
    this.measureText = jest.fn().mockReturnValue({ width: 10 });
    
    // Transform methods
    this.save = jest.fn();
    this.restore = jest.fn();
    this.scale = jest.fn();
    this.rotate = jest.fn();
    this.translate = jest.fn();
    this.transform = jest.fn();
    this.setTransform = jest.fn();
    this.resetTransform = jest.fn();
    
    // Track drawing operations for test assertions
    this.operations = [];
  }
  
  // Helper for recording operations
  _recordOperation(type, args) {
    this.operations.push({ type, args });
  }
}

/**
 * Extend the HTML canvas element for testing
 * This mock allows us to verify canvas operations in algorithm visualizations
 */
HTMLCanvasElement.prototype.getContext = jest.fn(function(contextType) {
  if (contextType === 'webgl' || contextType === 'webgl2') {
    return new MockWebGLRenderingContext();
  } else if (contextType === '2d') {
    return new MockCanvasRenderingContext2D();
  }
  return null;
});

/**
 * Mock for window.requestAnimationFrame to control animation in tests
 */
global.requestAnimationFrame = jest.fn(callback => {
  return setTimeout(() => callback(performance.now()), 0);
});

global.cancelAnimationFrame = jest.fn(id => {
  clearTimeout(id);
});

/**
 * Custom Jest matchers for algorithm testing
 */
expect.extend({
  /**
   * Check if an array is sorted according to a custom comparator
   * @param {Array} received - The array to check
   * @param {Function} comparator - Optional custom comparator
   */
  toBeSorted(received, comparator = (a, b) => a - b) {
    if (!Array.isArray(received)) {
      return {
        pass: false,
        message: () => `Expected ${received} to be an array`
      };
    }
    
    for (let i = 1; i < received.length; i++) {
      if (comparator(received[i-1], received[i]) > 0) {
        return {
          pass: false,
          message: () => 
            `Expected array to be sorted, but found elements ${received[i-1]} and ${received[i]} at positions ${i-1} and ${i} that are out of order`
        };
      }
    }
    
    return {
      pass: true,
      message: () => 'Expected array not to be sorted'
    };
  },
  
  /**
   * Check if an algorithm execution preserves stability
   * @param {Function} algorithm - The sorting algorithm function
   * @param {Array} initialArray - Initial array with potentially equal elements
   */
  toPreserveStability(algorithm, initialArray) {
    // Create array with equal keys but unique identifiers
    const inputWithIds = initialArray.map((value, index) => ({ key: value, id: index }));
    
    // Run algorithm, sorting by key
    const sorted = algorithm([...inputWithIds], (a, b) => a.key - b.key);
    
    // Check if equal keys maintain their relative order
    let isStable = true;
    let firstViolation = null;
    
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i].key === sorted[i-1].key && sorted[i].id < sorted[i-1].id) {
        isStable = false;
        firstViolation = { prev: sorted[i-1], current: sorted[i], index: i };
        break;
      }
    }
    
    return {
      pass: isStable,
      message: () => isStable 
        ? 'Expected algorithm not to preserve stability'
        : `Expected algorithm to preserve stability, but found elements with equal keys in wrong order: ${JSON.stringify(firstViolation)}`
    };
  }
});

/**
 * Configure Jest global timeouts
 * Algorithms with large inputs might need extended timeouts
 */
jest.setTimeout(30000); // 30 seconds for standard tests

/**
 * Configure fake timers for controlled timing in tests
 */
jest.useFakeTimers({
  legacyFakeTimers: false,
  doNotFake: [
    'performance',    // Keep performance real for algorithm metrics
    'requestAnimationFrame',
    'cancelAnimationFrame'
  ]
});

/**
 * Suppress console warnings during tests to reduce noise
 * This is particularly useful when testing error conditions
 */
beforeAll(() => {
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterAll(() => {
  console.warn.mockRestore();
  console.error.mockRestore();
});

/**
 * Configure additional globals for algorithm testing
 */
global.AlgorithmTestUtil = {
  /**
   * Generate test cases for sorting algorithms
   * @param {Object} options - Configuration options
   * @returns {Array} - Array of test cases
   */
  generateTestCases: (options = {}) => {
    const { 
      maxSize = 1000, 
      includeEdgeCases = true,
      includeLarge = true 
    } = options;
    
    const testCases = [
      { name: 'empty array', array: [] },
      { name: 'single element', array: [1] },
      { name: 'sorted array', array: [1, 2, 3, 4, 5] },
      { name: 'reverse sorted', array: [5, 4, 3, 2, 1] },
      { name: 'random small', array: [3, 1, 4, 1, 5, 9, 2, 6, 5, 3] },
      { name: 'duplicate elements', array: [3, 1, 4, 1, 5, 9, 2, 6, 5, 3] },
      { name: 'mostly sorted', array: [1, 2, 3, 5, 4, 6, 7, 8, 9, 10] }
    ];
    
    if (includeEdgeCases) {
      testCases.push(
        { name: 'all equal elements', array: [42, 42, 42, 42, 42] },
        { name: 'negative numbers', array: [-5, -4, -3, -2, -1] },
        { name: 'mixed positive & negative', array: [-5, 3, -1, 0, 2, -4] }
      );
    }
    
    if (includeLarge) {
      // Generate large random array
      const largeArray = Array.from({ length: Math.min(1000, maxSize) }, 
        () => Math.floor(Math.random() * 1000));
      
      testCases.push({ name: 'large random', array: largeArray });
    }
    
    return testCases;
  },
  
  /**
   * Verify algorithm correctness by checking if result is sorted
   * @param {Function} algorithmFn - Sorting function to test
   * @param {Array} input - Input array
   * @returns {boolean} - Whether algorithm correctly sorts the input
   */
  verifyAlgorithm: (algorithmFn, input) => {
    const result = algorithmFn([...input]);
    
    // Check array length hasn't changed
    if (result.length !== input.length) {
      return false;
    }
    
    // Check if sorted
    for (let i = 1; i < result.length; i++) {
      if (result[i] < result[i-1]) {
        return false;
      }
    }
    
    return true;
  }
};

// Export the configured Jest environment
module.exports = {
  setupFilesAfterEnv: ['<rootDir>/setup/jest.setup.js'],
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.(js|jsx)$': 'babel-jest'
  },
  moduleNameMapper: {
    '\\.(css|less|scss)$': 'identity-obj-proxy'
  },
  collectCoverageFrom: [
    'src/**/*.{js,jsx}',
    '!src/**/*.test.{js,jsx}',
    '!src/index.js',
    '!src/**/index.js'
  ],
  coverageThreshold: {
    global: {
      statements: 80,
      branches: 70,
      functions: 80,
      lines: 80
    }
  }
};