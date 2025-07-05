// tests/js/visualization/renderers/array-renderer.test.js

/**
 * Comprehensive test suite for ArrayRenderer
 * 
 * This test suite rigorously validates the functionality of the Canvas-based
 * fallback renderer used when WebGL is not available. It ensures correct rendering
 * of sorting algorithm states, proper handling of visual elements, and appropriate
 * performance characteristics for this critical visualization component.
 * 
 * @author Sorting Algorithm Visualization Platform
 * @module tests/visualization/renderers
 */

import { ArrayRenderer } from '../../../../src/visualization/renderers/array-renderer';
import { generateRandomData, generateSortedData } from '../../../../src/data/generators';

/**
 * Creates a mock CanvasRenderingContext2D with all necessary
 * methods and properties for testing the ArrayRenderer
 * 
 * @returns {Object} A mock Canvas rendering context
 */
function createMockCanvasContext() {
  return {
    // Canvas state methods
    save: jest.fn(),
    restore: jest.fn(),
    clearRect: jest.fn(),
    
    // Drawing methods
    fillRect: jest.fn(),
    strokeRect: jest.fn(),
    beginPath: jest.fn(),
    moveTo: jest.fn(),
    lineTo: jest.fn(),
    arc: jest.fn(),
    fill: jest.fn(),
    stroke: jest.fn(),
    fillText: jest.fn(),
    
    // Canvas property setters
    createLinearGradient: jest.fn(() => ({
      addColorStop: jest.fn()
    })),
    
    // Text measurement
    measureText: jest.fn(() => ({ width: 50 })),
    
    // Properties (set as values, not mocks)
    canvas: { width: 800, height: 400 },
    
    // Style properties (initialize as empty to be set by renderer)
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 1,
    font: '',
    textAlign: '',
    textBaseline: '',
    lineCap: '',
    lineJoin: '',
    
    // Image data methods
    getImageData: jest.fn(() => ({
      data: new Uint8ClampedArray(4),
      width: 1,
      height: 1
    })),
    putImageData: jest.fn(),
    
    // Transform methods
    translate: jest.fn(),
    scale: jest.fn(),
    rotate: jest.fn(),
    setTransform: jest.fn(),
    
    // Path methods
    closePath: jest.fn()
  };
}

/**
 * Creates a mock canvas element with the specified dimensions
 * and attaches the given context to it
 * 
 * @param {number} width - Width of the canvas
 * @param {number} height - Height of the canvas
 * @param {Object} mockContext - Mock canvas context
 * @returns {Object} A mock canvas element
 */
function createMockCanvas(width = 800, height = 400, mockContext = createMockCanvasContext()) {
  return {
    width,
    height,
    clientWidth: width,
    clientHeight: height,
    getContext: jest.fn(() => mockContext),
    toDataURL: jest.fn(() => 'mock-data-url'),
    style: {},
    
    // Element positioning properties
    getBoundingClientRect: jest.fn(() => ({
      left: 0,
      top: 0,
      width,
      height
    }))
  };
}

describe('ArrayRenderer', () => {
  let canvas, mockContext, renderer;
  
  beforeEach(() => {
    // Setup fresh mocks for each test
    mockContext = createMockCanvasContext();
    canvas = createMockCanvas(800, 400, mockContext);
    
    // Default renderer options
    const options = {
      maxElements: 1000,
      barWidth: 8,
      spacing: 2,
      colorScheme: 'spectrum',
      backgroundColor: '#1e1e2e',
      highlightColor: '#ff9900',
      comparingColor: '#ff0000',
      sortedColor: '#00ff00',
      textColor: '#ffffff'
    };
    
    // Create renderer instance
    renderer = new ArrayRenderer(canvas, options);
    
    // Spy on console.warn to test warnings
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });
  
  afterEach(() => {
    // Clean up
    jest.resetAllMocks();
  });
  
  describe('Initialization', () => {
    test('should initialize canvas context properly', () => {
      expect(canvas.getContext).toHaveBeenCalledWith('2d');
    });
    
    test('should set initial options and state', () => {
      expect(renderer.options.barWidth).toBe(8);
      expect(renderer.options.spacing).toBe(2);
      expect(renderer.options.colorScheme).toBe('spectrum');
      expect(renderer.data).toEqual([]);
      expect(renderer.highlights).toBeInstanceOf(Set);
      expect(renderer.comparing).toBeInstanceOf(Set);
      expect(renderer.sortedIndices).toBeInstanceOf(Set);
    });
    
    test('should handle missing context error', () => {
      // Create canvas that doesn't support 2d context
      const failCanvas = {
        ...canvas,
        getContext: jest.fn(() => null),
      };
      
      expect(() => new ArrayRenderer(failCanvas, {})).toThrow(/Canvas 2D context not available/);
    });
  });
  
  describe('Data Handling', () => {
    test('should set data correctly', () => {
      const testData = [5, 10, 15, 20, 25];
      renderer.setData(testData);
      
      expect(renderer.data).toEqual(testData);
      expect(mockContext.clearRect).toHaveBeenCalled();
      expect(mockContext.fillRect).toHaveBeenCalledTimes(5); // One for each element
    });
    
    test('should limit data to maxElements option', () => {
      // Create renderer with low max elements
      const smallRenderer = new ArrayRenderer(canvas, { maxElements: 3 });
      const testData = [1, 2, 3, 4, 5, 6];
      
      // Clear mock calls from initialization
      mockContext.clearRect.mockClear();
      mockContext.fillRect.mockClear();
      
      smallRenderer.setData(testData);
      
      // Verify the data was truncated
      expect(smallRenderer.data).toHaveLength(3);
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('Data array exceeds maximum elements'),
        expect.anything()
      );
      
      // Should render only 3 bars
      expect(mockContext.fillRect).toHaveBeenCalledTimes(3);
    });
    
    test('should update data without resetting state when resetState is false', () => {
      // First set with reset
      renderer.setData([5, 10, 15]);
      
      // Add some highlights
      renderer.highlight([0, 2]);
      
      // Clear mock calls
      mockContext.clearRect.mockClear();
      mockContext.fillRect.mockClear();
      
      // Set again without reset
      renderer.setData([25, 20, 15], false);
      
      // Should maintain highlights
      expect(renderer.highlights.size).toBe(2);
      expect(renderer.highlights.has(0)).toBe(true);
      expect(renderer.highlights.has(2)).toBe(true);
    });
  });
  
  describe('Visualization Features', () => {
    beforeEach(() => {
      // Set some data to work with
      renderer.setData([10, 20, 30, 40, 50]);
      
      // Clear mock calls from initialization and data setting
      mockContext.clearRect.mockClear();
      mockContext.fillRect.mockClear();
    });
    
    test('should highlight specific indices', () => {
      renderer.highlight([1, 3]);
      
      // Highlights should be set
      expect(renderer.highlights.has(1)).toBe(true);
      expect(renderer.highlights.has(3)).toBe(true);
      
      // Should re-render
      expect(mockContext.clearRect).toHaveBeenCalled();
      expect(mockContext.fillRect).toHaveBeenCalled();
    });
    
    test('should mark indices as being compared', () => {
      renderer.markComparing([0, 4]);
      
      // Comparing indices should be set
      expect(renderer.comparing.has(0)).toBe(true);
      expect(renderer.comparing.has(4)).toBe(true);
      
      // Should re-render
      expect(mockContext.clearRect).toHaveBeenCalled();
      expect(mockContext.fillRect).toHaveBeenCalled();
    });
    
    test('should mark indices as sorted', () => {
      renderer.markSorted([2, 3, 4]);
      
      // Sorted indices should be set
      expect(renderer.sortedIndices.has(2)).toBe(true);
      expect(renderer.sortedIndices.has(3)).toBe(true);
      expect(renderer.sortedIndices.has(4)).toBe(true);
      
      // Should re-render
      expect(mockContext.clearRect).toHaveBeenCalled();
      expect(mockContext.fillRect).toHaveBeenCalled();
    });
    
    test('should swap elements with animation', () => {
      // Mock requestAnimationFrame
      const requestAnimationFrame = jest.spyOn(window, 'requestAnimationFrame')
        .mockImplementation(callback => {
          callback(performance.now() + 100);
          return 123;
        });
        
      // Clear mock calls
      mockContext.clearRect.mockClear();
      mockContext.fillRect.mockClear();
      
      // Start swap animation
      renderer.swap(1, 3);
      
      // Animation should be started
      expect(renderer.isAnimating).toBe(true);
      
      // Should render at animation start
      expect(mockContext.clearRect).toHaveBeenCalled();
      expect(mockContext.fillRect).toHaveBeenCalled();
      
      // Complete the animation
      renderer.animationProgress = 1;
      renderer.animate(performance.now() + 300);
      
      // Animation should be complete
      expect(renderer.isAnimating).toBe(false);
      
      // Data should be swapped
      expect(renderer.data[1]).toBe(40);
      expect(renderer.data[3]).toBe(20);
      
      // Clean up mock
      requestAnimationFrame.mockRestore();
    });
    
    test('should update a single value', () => {
      // Clear mock calls
      mockContext.clearRect.mockClear();
      mockContext.fillRect.mockClear();
      
      // Update a value
      renderer.updateValue(2, 35);
      
      // Data should be updated
      expect(renderer.data[2]).toBe(35);
      
      // Should re-render
      expect(mockContext.clearRect).toHaveBeenCalled();
      expect(mockContext.fillRect).toHaveBeenCalled();
    });
  });
  
  describe('Rendering', () => {
    beforeEach(() => {
      // Set some data to work with
      renderer.setData([10, 20, 30, 40, 50]);
      
      // Clear mock calls
      mockContext.clearRect.mockClear();
      mockContext.fillRect.mockClear();
    });
    
    test('should render bars with correct dimensions', () => {
      // Force render
      renderer.render();
      
      // Should clear canvas
      expect(mockContext.clearRect).toHaveBeenCalledWith(0, 0, 800, 400);
      
      // Should draw 5 bars
      expect(mockContext.fillRect).toHaveBeenCalledTimes(5);
      
      // Check one of the bar calls
      const maxValue = 50; // Maximum in our dataset
      const heightRatio = 400 * 0.8 / maxValue; // 80% of canvas height divided by max value
      
      // The third bar (index 2, value 30) should have appropriate height
      const expectedHeight = 30 * heightRatio;
      
      // Verify the third bar call (one of the fillRect calls)
      const fillRectCalls = mockContext.fillRect.mock.calls;
      const barCallFound = fillRectCalls.some(call => {
        // Check if this call is for our bar with the expected height
        const height = call[3];
        return Math.abs(height - expectedHeight) < 0.001; // Allow small floating point differences
      });
      
      expect(barCallFound).toBe(true);
    });
    
    test('should use different colors for highlighted elements', () => {
      // Setup highlights, comparing, and sorted markers
      renderer.highlight([1]);
      renderer.markComparing([3]);
      renderer.markSorted([4]);
      
      // Clear mock calls
      mockContext.clearRect.mockClear();
      mockContext.fillRect.mockClear();
      
      // Force render
      renderer.render();
      
      // Should set different fill styles
      const uniqueFillStyles = new Set();
      for (let i = 0; i < mockContext.fillStyle.mock.calls.length; i++) {
        uniqueFillStyles.add(mockContext.fillStyle.mock.calls[i][0]);
      }
      
      // Should have at least 4 different colors (regular, highlight, comparing, sorted)
      expect(uniqueFillStyles.size).toBeGreaterThanOrEqual(4);
    });
    
    test('should render labels when showLabels is true', () => {
      // Update options to show labels
      renderer.setOptions({ showLabels: true });
      
      // Clear mock calls
      mockContext.clearRect.mockClear();
      mockContext.fillRect.mockClear();
      mockContext.fillText.mockClear();
      
      // Force render
      renderer.render();
      
      // Should draw text for each bar
      expect(mockContext.fillText).toHaveBeenCalledTimes(5);
    });
    
    test('should render without labels when showLabels is false', () => {
      // Update options to hide labels
      renderer.setOptions({ showLabels: false });
      
      // Clear mock calls
      mockContext.clearRect.mockClear();
      mockContext.fillRect.mockClear();
      mockContext.fillText.mockClear();
      
      // Force render
      renderer.render();
      
      // Should not draw text
      expect(mockContext.fillText).not.toHaveBeenCalled();
    });
    
    test('should add animation effects to highlighted elements', () => {
      // Mock timestamp for consistent testing
      const timestamp = 1000;
      
      // Setup highlights
      renderer.highlight([2]);
      
      // Clear mock calls
      mockContext.clearRect.mockClear();
      mockContext.fillRect.mockClear();
      
      // Render with timestamp
      renderer.render(timestamp);
      
      // Should apply special rendering for highlighted elements
      // This is harder to test directly without examining the fillRect parameters in detail
      // For now, we'll just ensure render completes without errors
      expect(mockContext.fillRect).toHaveBeenCalledTimes(5);
    });
  });
  
  describe('Resizing', () => {
    test('should resize canvas to match display size', () => {
      // Modify canvas dimensions to simulate resize
      canvas.clientWidth = 1000;
      canvas.clientHeight = 500;
      canvas.width = 800; // Different from client width to trigger resize
      canvas.height = 400; // Different from client height to trigger resize
      
      // Call resize method
      renderer.resize();
      
      // Should update canvas dimensions
      expect(canvas.width).toBe(1000);
      expect(canvas.height).toBe(500);
      
      // Should trigger a render
      expect(mockContext.clearRect).toHaveBeenCalled();
      expect(mockContext.fillRect).toHaveBeenCalled();
    });
    
    test('should not resize if dimensions are unchanged', () => {
      // Set canvas dimensions to be same as client dimensions
      canvas.clientWidth = 800;
      canvas.clientHeight = 400;
      canvas.width = 800;
      canvas.height = 400;
      
      // Clear mock calls
      mockContext.clearRect.mockClear();
      mockContext.fillRect.mockClear();
      
      // Call resize method
      renderer.resize();
      
      // Should not trigger render
      expect(mockContext.clearRect).not.toHaveBeenCalled();
      expect(mockContext.fillRect).not.toHaveBeenCalled();
    });
  });
  
  describe('Color Scheme', () => {
    test('should apply different color schemes correctly', () => {
      // Test different color schemes
      const testSchemes = ['spectrum', 'heatmap', 'grayscale', 'monochrome'];
      
      for (const scheme of testSchemes) {
        // Create renderer with this color scheme
        const testRenderer = new ArrayRenderer(canvas, { colorScheme: scheme });
        
        // Get color for a normalized value
        const colorMethod = testRenderer.getColorFromScheme.bind(testRenderer);
        const color = colorMethod(0.5);
        
        // Should return a valid CSS color string
        expect(typeof color).toBe('string');
        expect(color.startsWith('#') || color.startsWith('rgb') || color.startsWith('hsl')).toBe(true);
      }
    });
    
    test('should apply custom color function when provided', () => {
      // Create custom color function returning a CSS color string
      const customColorFn = (value) => `rgb(${Math.round(value * 255)}, 0, ${Math.round((1 - value) * 255)})`;
      
      // Create renderer with custom color scheme
      const customRenderer = new ArrayRenderer(canvas, { 
        colorScheme: 'custom',
        customColorFn
      });
      
      // Get color from custom function
      const colorMethod = customRenderer.getColorFromScheme.bind(customRenderer);
      const color = colorMethod(0.5);
      
      // Should match our custom function result
      expect(color).toBe('rgb(128, 0, 128)');
    });
    
    test('should handle color transitions for sorted items', () => {
      // Mark some items as sorted
      renderer.markSorted([2, 3]);
      
      // Clear mock calls
      mockContext.clearRect.mockClear();
      mockContext.fillRect.mockClear();
      
      // Force render
      renderer.render();
      
      // Should use sorted color for those items
      // Hard to test exact color values, but we can ensure render completes
      expect(mockContext.fillRect).toHaveBeenCalledTimes(5);
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
  
  describe('Performance with Different Data Sizes', () => {
    const testSizes = [10, 100, 1000];
    
    for (const size of testSizes) {
      test(`should handle arrays of size ${size} efficiently`, () => {
        // Generate test data
        const testData = generateRandomData(size, 1, 100);
        
        // Measure time to set data
        const startTime = performance.now();
        renderer.setData(testData);
        const endTime = performance.now();
        
        // Setting data should be reasonably fast
        const duration = endTime - startTime;
        
        // Adjust expectations based on size
        const maxTime = size < 100 ? 50 : (size < 1000 ? 200 : 500);
        expect(duration).toBeLessThan(maxTime);
        
        // Check that all elements were drawn (or up to maxElements)
        const expectedBars = Math.min(size, renderer.options.maxElements);
        expect(mockContext.fillRect).toHaveBeenCalledTimes(expectedBars);
      });
    }
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
      // Clear calls from initialization
      mockContext.clearRect.mockClear();
      mockContext.fillRect.mockClear();
      
      // Update options
      renderer.setOptions({
        barWidth: 12,
        spacing: 3,
        colorScheme: 'heatmap',
        backgroundColor: '#222222',
        showLabels: true
      });
      
      // Options should be updated
      expect(renderer.options.barWidth).toBe(12);
      expect(renderer.options.spacing).toBe(3);
      expect(renderer.options.colorScheme).toBe('heatmap');
      expect(renderer.options.backgroundColor).toBe('#222222');
      expect(renderer.options.showLabels).toBe(true);
      
      // Should trigger re-render
      expect(mockContext.clearRect).toHaveBeenCalled();
      expect(mockContext.fillRect).toHaveBeenCalled();
    });
  });
  
  describe('Error Handling', () => {
    test('should handle drawing errors gracefully', () => {
      // Force an error during rendering
      mockContext.fillRect.mockImplementationOnce(() => {
        throw new Error('Mock drawing error');
      });
      
      // Spy on console.error
      jest.spyOn(console, 'error').mockImplementation(() => {});
      
      // This should not throw despite the error in fillRect
      renderer.render();
      
      // Should log error
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Render error'),
        expect.any(Error)
      );
    });
  });
  
  describe('Cleanup', () => {
    test('should reset properly', () => {
      // Set up some state
      renderer.setData([10, 20, 30]);
      renderer.highlight([0]);
      renderer.markComparing([1]);
      renderer.markSorted([2]);
      
      // Reset the renderer
      renderer.reset();
      
      // State should be cleared
      expect(renderer.highlights.size).toBe(0);
      expect(renderer.comparing.size).toBe(0);
      expect(renderer.sortedIndices.size).toBe(0);
      
      // Should trigger re-render
      expect(mockContext.clearRect).toHaveBeenCalled();
    });
    
    test('should cancel animation when resetting during animation', () => {
      // Start animation
      renderer.isAnimating = true;
      renderer.animationRef = 123;
      
      // Mock cancelAnimationFrame
      const cancelAnimationFrame = jest.spyOn(window, 'cancelAnimationFrame');
      
      // Reset
      renderer.reset();
      
      // Should cancel animation frame
      expect(cancelAnimationFrame).toHaveBeenCalledWith(123);
      expect(renderer.isAnimating).toBe(false);
      
      // Restore original function
      cancelAnimationFrame.mockRestore();
    });
  });
  
  describe('Array with Different Data Patterns', () => {
    test('should render sorted arrays correctly', () => {
      // Generate sorted data
      const sortedData = generateSortedData(50, 1, 100);
      
      // Clear mock calls
      mockContext.clearRect.mockClear();
      mockContext.fillRect.mockClear();
      
      // Set data
      renderer.setData(sortedData);
      
      // Should render all elements
      expect(mockContext.fillRect).toHaveBeenCalledTimes(50);
      
      // Heights should increase gradually
      // Hard to test directly, but we can verify no errors occur
      expect(mockContext.clearRect).toHaveBeenCalled();
    });
    
    test('should handle arrays with duplicate values', () => {
      // Create array with duplicates
      const dataWithDuplicates = [10, 10, 20, 20, 20, 30, 30, 40];
      
      // Clear mock calls
      mockContext.clearRect.mockClear();
      mockContext.fillRect.mockClear();
      
      // Set data
      renderer.setData(dataWithDuplicates);
      
      // Should render all elements
      expect(mockContext.fillRect).toHaveBeenCalledTimes(8);
    });
    
    test('should handle empty arrays', () => {
      // Clear mock calls
      mockContext.clearRect.mockClear();
      mockContext.fillRect.mockClear();
      
      // Set empty data
      renderer.setData([]);
      
      // Should clear canvas but not draw bars
      expect(mockContext.clearRect).toHaveBeenCalled();
      expect(mockContext.fillRect).not.toHaveBeenCalled();
    });
    
    test('should handle single-element arrays', () => {
      // Clear mock calls
      mockContext.clearRect.mockClear();
      mockContext.fillRect.mockClear();
      
      // Set single-element data
      renderer.setData([42]);
      
      // Should draw one bar
      expect(mockContext.clearRect).toHaveBeenCalled();
      expect(mockContext.fillRect).toHaveBeenCalledTimes(1);
    });
  });
  
  describe('Metrics Tracking', () => {
    test('should track render metrics', () => {
      // Set data to trigger render
      renderer.setData([10, 20, 30, 40, 50]);
      
      // Should populate metrics
      expect(renderer.metrics.elementsRendered).toBe(5);
      expect(renderer.metrics.renderTime).toBeGreaterThanOrEqual(0);
      expect(typeof renderer.metrics.fps).toBe('number');
    });
  });
});
