// tests/js/visualization/renderers/webgl-renderer.test.js

/**
 * Comprehensive test suite for WebGLRenderer
 * 
 * This test suite verifies the functionality, performance, and visual correctness
 * of the WebGL-based renderer used for algorithm visualization. It tests both
 * the core rendering capabilities and the specific features used for algorithm
 * visualization, such as highlighting, animation, and color mapping.
 * 
 * @author Sorting Algorithm Visualization Platform
 * @module tests/visualization/renderers
 */

import { WebGLRenderer } from '../../../../src/visualization/renderers/webgl-renderer';
import { generateRandomData } from '../../../../src/data/generators';

// Mock WebGL context and related objects
jest.mock('../../../../src/utils/webgl-utils', () => {
  return {
    createShader: jest.fn(() => 'mock-shader'),
    createProgram: jest.fn(() => 'mock-program'),
    resizeCanvasToDisplaySize: jest.fn(),
  };
});

/**
 * Creates a mock WebGL context with all necessary methods and properties
 * that the WebGLRenderer would use during normal operation
 * 
 * @returns {Object} A mock WebGL context
 */
function createMockWebGLContext() {
  return {
    // WebGL constants
    VERTEX_SHADER: 'VERTEX_SHADER',
    FRAGMENT_SHADER: 'FRAGMENT_SHADER',
    COMPILE_STATUS: 'COMPILE_STATUS',
    LINK_STATUS: 'LINK_STATUS',
    COLOR_BUFFER_BIT: 'COLOR_BUFFER_BIT',
    ARRAY_BUFFER: 'ARRAY_BUFFER',
    STATIC_DRAW: 'STATIC_DRAW',
    FLOAT: 'FLOAT',
    TRIANGLES: 'TRIANGLES',
    
    // WebGL methods with Jest mock functions
    createShader: jest.fn(() => 'mock-shader'),
    shaderSource: jest.fn(),
    compileShader: jest.fn(),
    getShaderParameter: jest.fn(() => true),
    getShaderInfoLog: jest.fn(() => ''),
    createProgram: jest.fn(() => 'mock-program'),
    attachShader: jest.fn(),
    linkProgram: jest.fn(),
    getProgramParameter: jest.fn(() => true),
    getProgramInfoLog: jest.fn(() => ''),
    deleteShader: jest.fn(),
    useProgram: jest.fn(),
    getAttribLocation: jest.fn((program, name) => {
      if (name === 'a_position') return 0;
      if (name === 'a_color') return 1;
      return -1;
    }),
    getUniformLocation: jest.fn(() => 'mock-uniform-location'),
    enableVertexAttribArray: jest.fn(),
    createBuffer: jest.fn(() => 'mock-buffer'),
    bindBuffer: jest.fn(),
    bufferData: jest.fn(),
    vertexAttribPointer: jest.fn(),
    uniform1f: jest.fn(),
    uniform2f: jest.fn(),
    uniform4f: jest.fn(),
    clear: jest.fn(),
    viewport: jest.fn(),
    drawArrays: jest.fn(),
    createVertexArray: jest.fn(() => 'mock-vertex-array'),
    bindVertexArray: jest.fn(),
    deleteBuffer: jest.fn(),
    deleteProgram: jest.fn(),
    deleteVertexArray: jest.fn(),
    clearColor: jest.fn(),
  };
}

/**
 * Creates a mock canvas element with the specified dimensions
 * and attaches the given WebGL context to it
 * 
 * @param {number} width - Width of the canvas
 * @param {number} height - Height of the canvas
 * @param {Object} mockContext - Mock WebGL context
 * @returns {Object} A mock canvas element
 */
function createMockCanvas(width = 800, height = 400, mockContext = createMockWebGLContext()) {
  return {
    width,
    height,
    clientWidth: width,
    clientHeight: height,
    getContext: jest.fn(() => mockContext),
    toDataURL: jest.fn(() => 'mock-data-url'),
    style: {},
  };
}

describe('WebGLRenderer', () => {
  let canvas, mockContext, renderer;

  beforeEach(() => {
    // Create fresh mocks for each test to avoid interactions between tests
    mockContext = createMockWebGLContext();
    canvas = createMockCanvas(800, 400, mockContext);
    
    // Default renderer options
    const options = {
      maxElements: 1000,
      barWidth: 4,
      spacing: 1,
      colorScheme: 'spectrum',
      background: [0.1, 0.1, 0.1, 1.0],
    };

    // Create renderer instance
    renderer = new WebGLRenderer(canvas, options);
  });

  afterEach(() => {
    // Clean up
    if (renderer) {
      renderer.dispose();
    }
    jest.resetAllMocks();
  });

  describe('Initialization', () => {
    test('should initialize WebGL context properly', () => {
      expect(canvas.getContext).toHaveBeenCalledWith('webgl2', expect.any(Object));
      expect(mockContext.clearColor).toHaveBeenCalledWith(0.1, 0.1, 0.1, 1.0);
      expect(mockContext.viewport).toHaveBeenCalledWith(0, 0, 800, 400);
    });

    test('should create shader program during initialization', () => {
      expect(mockContext.createShader).toHaveBeenCalledTimes(2); // Vertex and fragment shaders
      expect(mockContext.createProgram).toHaveBeenCalled();
      expect(mockContext.attachShader).toHaveBeenCalledTimes(2);
      expect(mockContext.linkProgram).toHaveBeenCalled();
      expect(mockContext.useProgram).toHaveBeenCalled();
    });

    test('should initialize attribute and uniform locations', () => {
      expect(mockContext.getAttribLocation).toHaveBeenCalledWith('mock-program', 'a_position');
      expect(mockContext.getAttribLocation).toHaveBeenCalledWith('mock-program', 'a_color');
      expect(mockContext.getUniformLocation).toHaveBeenCalledWith('mock-program', 'u_resolution');
      expect(mockContext.getUniformLocation).toHaveBeenCalledWith('mock-program', 'u_time');
    });

    test('should create vertex buffers and VAO', () => {
      expect(mockContext.createBuffer).toHaveBeenCalledTimes(2); // Position and color buffers
      expect(mockContext.createVertexArray).toHaveBeenCalled();
      expect(mockContext.bindVertexArray).toHaveBeenCalled();
    });

    test('should throw error when WebGL is not supported', () => {
      // Create canvas that doesn't support WebGL
      const failCanvas = {
        ...canvas,
        getContext: jest.fn(() => null),
      };
      
      expect(() => new WebGLRenderer(failCanvas, {})).toThrow(/WebGL2 not supported/);
    });
  });

  describe('Data Handling', () => {
    test('should set data and update buffers', () => {
      const testData = [5, 10, 15, 20, 25];
      renderer.setData(testData);
      
      // Should update buffers
      expect(mockContext.bindBuffer).toHaveBeenCalledTimes(4); // 2 for init, 2 for update
      expect(mockContext.bufferData).toHaveBeenCalledTimes(4);
    });

    test('should limit data to maxElements option', () => {
      // Create renderer with low max elements
      const smallRenderer = new WebGLRenderer(canvas, { maxElements: 3 });
      const testData = [1, 2, 3, 4, 5, 6];
      
      // Clear mock calls from initialization
      mockContext.bindBuffer.mockClear();
      mockContext.bufferData.mockClear();
      
      smallRenderer.setData(testData);
      
      // Should update buffers with truncated data
      expect(mockContext.bufferData).toHaveBeenCalledTimes(2);
      
      // Verify the data was truncated
      // This is complex to verify directly since bufferData receives a Float32Array
      // We'll check if console.warn was called to indicate truncation
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('Data array exceeds maximum elements'),
        expect.anything()
      );
    });

    test('should update data without resetting state when resetState is false', () => {
      // First set with reset
      const initialData = [5, 10, 15];
      renderer.setData(initialData);
      
      // Clear mock calls
      mockContext.bindBuffer.mockClear();
      mockContext.bufferData.mockClear();
      
      // Set again without reset
      const newData = [25, 20, 15];
      renderer.setData(newData, false);
      
      // Should update buffers but not reset state
      expect(mockContext.bindBuffer).toHaveBeenCalledTimes(2);
      expect(mockContext.bufferData).toHaveBeenCalledTimes(2);
    });
  });

  describe('Visualization Features', () => {
    beforeEach(() => {
      // Set some data to work with
      renderer.setData([10, 20, 30, 40, 50]);
      
      // Clear mock calls from initialization and data setting
      mockContext.bindBuffer.mockClear();
      mockContext.bufferData.mockClear();
      mockContext.drawArrays.mockClear();
    });

    test('should highlight specific indices', () => {
      renderer.highlight([1, 3]);
      
      // Should update buffers for highlighting
      expect(mockContext.bindBuffer).toHaveBeenCalledTimes(2);
      expect(mockContext.bufferData).toHaveBeenCalledTimes(2);
      
      // Should render the frame
      expect(mockContext.drawArrays).toHaveBeenCalledTimes(1);
    });

    test('should mark indices as being compared', () => {
      renderer.markComparing([0, 4]);
      
      // Should update buffers for comparison highlighting
      expect(mockContext.bindBuffer).toHaveBeenCalledTimes(2);
      expect(mockContext.bufferData).toHaveBeenCalledTimes(2);
      
      // Should render the frame
      expect(mockContext.drawArrays).toHaveBeenCalledTimes(1);
    });

    test('should mark indices as sorted', () => {
      renderer.markSorted([2, 3, 4]);
      
      // Should update buffers for sorted indices
      expect(mockContext.bindBuffer).toHaveBeenCalledTimes(2);
      expect(mockContext.bufferData).toHaveBeenCalledTimes(2);
      
      // Should render the frame
      expect(mockContext.drawArrays).toHaveBeenCalledTimes(1);
    });

    test('should swap elements with animation', () => {
      // Start animation
      renderer.swap(1, 3);
      
      // Animation should be started
      expect(renderer.isAnimating).toBe(true);
      
      // Should trigger render for animation start
      expect(mockContext.drawArrays).toHaveBeenCalledTimes(1);
      
      // Simulate animation frame
      jest.spyOn(window, 'requestAnimationFrame').mockImplementation(cb => {
        // Call the animation callback with a timestamp
        cb(performance.now() + 100);
        return 123; // Return an animation frame ID
      });
      
      // Complete the animation
      renderer.animationProgress = 1;
      renderer.animate(performance.now() + 300);
      
      // Animation should be complete
      expect(renderer.isAnimating).toBe(false);
      
      // Positions should be finalized
      expect(renderer.positions).toEqual(renderer.targetPositions);
    });
  });

  describe('Rendering', () => {
    beforeEach(() => {
      // Set some data to work with
      renderer.setData([10, 20, 30, 40, 50]);
      
      // Clear mock calls
      mockContext.clear.mockClear();
      mockContext.drawArrays.mockClear();
      mockContext.uniform1f.mockClear();
    });

    test('should render the current state', () => {
      const timestamp = 1000;
      renderer.render(timestamp);
      
      // Should clear the canvas
      expect(mockContext.clear).toHaveBeenCalledTimes(1);
      
      // Should set time uniform
      expect(mockContext.uniform1f).toHaveBeenCalledWith('mock-uniform-location', timestamp);
      
      // Should update buffers
      expect(mockContext.bindBuffer).toHaveBeenCalledTimes(2);
      
      // Should draw the arrays
      expect(mockContext.drawArrays).toHaveBeenCalledWith('TRIANGLES', 0, 30); // 5 elements * 6 vertices
    });

    test('should update fps calculation periodically', () => {
      // Mock timestamp for consistent testing
      const timestamp = 1000;
      renderer.lastFpsUpdate = 0;
      renderer.frameCount = 0;
      
      // Render multiple frames
      for (let i = 0; i < 10; i++) {
        renderer.render(timestamp + i * 100);
      }
      
      // FPS should be updated
      expect(renderer.metrics.fps).toBeGreaterThan(0);
    });

    test('should update render metrics', () => {
      // Mock performance.now to return consistent values
      const originalNow = performance.now;
      performance.now = jest.fn()
        .mockReturnValueOnce(1000) // Start time
        .mockReturnValueOnce(1020); // End time - 20ms later
      
      renderer.render(1000);
      
      // Metrics should be updated
      expect(renderer.metrics.renderTime).toBe(20);
      expect(renderer.metrics.elementsRendered).toBe(5);
      
      // Restore original function
      performance.now = originalNow;
    });
  });

  describe('Resizing', () => {
    test('should resize canvas and update viewport', () => {
      // Modify canvas dimensions to simulate resize
      canvas.clientWidth = 1000;
      canvas.clientHeight = 500;
      canvas.width = 800; // Different from client width to trigger resize
      canvas.height = 400; // Different from client height to trigger resize
      
      // Clear mock calls
      mockContext.viewport.mockClear();
      mockContext.uniform2f.mockClear();
      
      // Call resize method
      renderer.resize();
      
      // Should update canvas dimensions
      expect(canvas.width).toBe(1000);
      expect(canvas.height).toBe(500);
      
      // Should update viewport
      expect(mockContext.viewport).toHaveBeenCalledWith(0, 0, 1000, 500);
      
      // Should update resolution uniform
      expect(mockContext.uniform2f).toHaveBeenCalledWith('mock-uniform-location', 1000, 500);
      
      // Should trigger a render
      expect(mockContext.drawArrays).toHaveBeenCalled();
    });

    test('should not resize if dimensions are unchanged', () => {
      // Set canvas dimensions to be same as client dimensions
      canvas.clientWidth = 800;
      canvas.clientHeight = 400;
      canvas.width = 800;
      canvas.height = 400;
      
      // Clear mock calls
      mockContext.viewport.mockClear();
      mockContext.uniform2f.mockClear();
      mockContext.drawArrays.mockClear();
      
      // Call resize method
      renderer.resize();
      
      // Should not update viewport or trigger render
      expect(mockContext.viewport).not.toHaveBeenCalled();
      expect(mockContext.uniform2f).not.toHaveBeenCalled();
      expect(mockContext.drawArrays).not.toHaveBeenCalled();
    });
  });

  describe('Color Scheme', () => {
    test('should apply spectrum color scheme correctly', () => {
      // Create renderer with spectrum color scheme
      const spectrumRenderer = new WebGLRenderer(canvas, { colorScheme: 'spectrum' });
      
      // Get color for a normalized value
      const colorMethod = spectrumRenderer.getColorFromScheme.bind(spectrumRenderer);
      const color = colorMethod(0.5);
      
      // Spectrum should generate RGB colors
      expect(color).toHaveLength(4); // RGBA
      expect(color[3]).toBe(1.0); // Alpha should be 1.0
      
      // Values should be in valid ranges
      color.forEach(component => {
        expect(component).toBeGreaterThanOrEqual(0);
        expect(component).toBeLessThanOrEqual(1);
      });
    });

    test('should apply heatmap color scheme correctly', () => {
      // Create renderer with heatmap color scheme
      const heatmapRenderer = new WebGLRenderer(canvas, { colorScheme: 'heatmap' });
      
      // Get colors for different values
      const colorMethod = heatmapRenderer.getColorFromScheme.bind(heatmapRenderer);
      const lowColor = colorMethod(0.1);
      const highColor = colorMethod(0.9);
      
      // Heatmap goes from blue to red
      expect(lowColor[0]).toBeLessThan(highColor[0]); // Red increases
      expect(lowColor[2]).toBeGreaterThan(highColor[2]); // Blue decreases
    });

    test('should apply grayscale color scheme correctly', () => {
      // Create renderer with grayscale color scheme
      const grayscaleRenderer = new WebGLRenderer(canvas, { colorScheme: 'grayscale' });
      
      // Get colors for different values
      const colorMethod = grayscaleRenderer.getColorFromScheme.bind(grayscaleRenderer);
      const lowColor = colorMethod(0.2);
      const highColor = colorMethod(0.8);
      
      // Grayscale has equal RGB components
      expect(lowColor[0]).toBe(lowColor[1]);
      expect(lowColor[1]).toBe(lowColor[2]);
      
      expect(highColor[0]).toBe(highColor[1]);
      expect(highColor[1]).toBe(highColor[2]);
      
      // Higher value should be brighter
      expect(lowColor[0]).toBeLessThan(highColor[0]);
    });

    test('should use custom color function when provided', () => {
      // Create custom color function
      const customColorFn = (value) => [value, 0, 1 - value, 1];
      
      // Create renderer with custom color scheme
      const customRenderer = new WebGLRenderer(canvas, { 
        colorScheme: 'custom',
        customColorFn
      });
      
      // Get color from custom function
      const colorMethod = customRenderer.getColorFromScheme.bind(customRenderer);
      const color = colorMethod(0.5);
      
      // Should match our custom function
      expect(color).toEqual([0.5, 0, 0.5, 1]);
    });
  });

  describe('Resource Management', () => {
    test('should dispose resources properly', () => {
      // Call dispose method
      renderer.dispose();
      
      // Should delete buffers
      expect(mockContext.deleteBuffer).toHaveBeenCalledTimes(2);
      
      // Should delete vertex array
      expect(mockContext.deleteVertexArray).toHaveBeenCalled();
      
      // Should delete program
      expect(mockContext.deleteProgram).toHaveBeenCalled();
    });

    test('should cancel animation when disposing while animating', () => {
      // Start animation
      renderer.isAnimating = true;
      renderer.animationRef = 123;
      
      // Mock cancelAnimationFrame
      const cancelAnimationFrame = jest.spyOn(window, 'cancelAnimationFrame');
      
      // Call dispose
      renderer.dispose();
      
      // Should cancel animation frame
      expect(cancelAnimationFrame).toHaveBeenCalledWith(123);
    });
  });

  describe('Animation Utilities', () => {
    test('should calculate linear interpolation correctly', () => {
      // Test various interpolation values
      expect(renderer.lerp(0, 10, 0)).toBe(0);
      expect(renderer.lerp(0, 10, 0.5)).toBe(5);
      expect(renderer.lerp(0, 10, 1)).toBe(10);
      expect(renderer.lerp(10, 20, 0.25)).toBe(12.5);
      
      // Negative values
      expect(renderer.lerp(-10, 10, 0.5)).toBe(0);
    });

    test('should implement easing function correctly', () => {
      // Test various easing values
      const ease = renderer.easeInOutCubic.bind(renderer);
      
      // Should start and end at correct values
      expect(ease(0)).toBe(0);
      expect(ease(1)).toBe(1);
      
      // Test middle point - should be 0.5 in linear but different in cubic
      expect(ease(0.5)).not.toBe(0.5);
      
      // Symmetry - should have same effect from both ends
      expect(ease(0.2)).toBeCloseTo(1 - ease(0.8), 5);
    });
  });

  describe('Performance with Large Datasets', () => {
    test('should handle large datasets efficiently', () => {
      // Create large dataset
      const largeData = generateRandomData(10000, 1, 100);
      
      // Measure time to set data
      const startTime = performance.now();
      renderer.setData(largeData);
      const endTime = performance.now();
      
      // Setting large data should be reasonably fast
      const duration = endTime - startTime;
      expect(duration).toBeLessThan(500); // Arbitrary limit, adjust based on expected performance
      
      // Should successfully render the large data
      mockContext.drawArrays.mockClear();
      renderer.render(performance.now());
      expect(mockContext.drawArrays).toHaveBeenCalled();
    });
  });

  describe('Image Capture', () => {
    test('should capture the current visualization state as an image', () => {
      // Get image data
      const imageData = renderer.getImageData();
      
      // Should call canvas.toDataURL
      expect(canvas.toDataURL).toHaveBeenCalledWith('image/png');
      
      // Should return data URL
      expect(imageData).toBe('mock-data-url');
    });
  });

  describe('Option Updates', () => {
    test('should update options correctly', () => {
      // Clear clearColor mock
      mockContext.clearColor.mockClear();
      
      // Update options including background color
      renderer.setOptions({
        colorScheme: 'heatmap',
        barWidth: 6,
        spacing: 2,
        background: [0.2, 0.2, 0.2, 1.0]
      });
      
      // Should apply new background color
      expect(mockContext.clearColor).toHaveBeenCalledWith(0.2, 0.2, 0.2, 1.0);
      
      // Should update buffers
      expect(mockContext.bindBuffer).toHaveBeenCalled();
      expect(mockContext.bufferData).toHaveBeenCalled();
    });
  });
});
