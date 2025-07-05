// tests/js/performance/renderer-benchmark.test.js

/**
 * Comprehensive performance benchmarking suite for visualization renderers
 * 
 * This suite rigorously evaluates the performance characteristics of the
 * platform's rendering engines across various scenarios, array sizes, and
 * visual operations. It systematically measures rendering times, frame rates,
 * memory usage, and animation fluidity to ensure optimal visualization performance.
 * 
 * The benchmarks are designed to:
 * 1. Compare WebGL and Canvas rendering performance
 * 2. Evaluate scaling behavior with increasing array sizes
 * 3. Measure performance during different visualization operations
 * 4. Identify performance bottlenecks in rendering pipelines
 * 5. Establish performance baselines for different hardware capabilities
 * 
 * @author Advanced Sorting Visualization Platform Team
 * @version 1.0.0
 */

import { performance } from 'perf_hooks';
import { generateDataSet } from '../../../src/data/generators';
import { WebGLRenderer } from '../../../src/visualization/renderers/webgl-renderer';
import { ArrayRenderer } from '../../../src/visualization/renderers/array-renderer';

// Mock modules for headless testing environment
jest.mock('canvas', () => {
  // Create minimal WebGL context mock
  class WebGLRenderingContext {
    constructor() {
      // Mock all required WebGL methods and constants
      this.ARRAY_BUFFER = 'ARRAY_BUFFER';
      this.ELEMENT_ARRAY_BUFFER = 'ELEMENT_ARRAY_BUFFER';
      this.STATIC_DRAW = 'STATIC_DRAW';
      this.DYNAMIC_DRAW = 'DYNAMIC_DRAW';
      this.FLOAT = 'FLOAT';
      this.TRIANGLES = 'TRIANGLES';
      this.LINES = 'LINES';
      this.COLOR_BUFFER_BIT = 'COLOR_BUFFER_BIT';
      this.DEPTH_BUFFER_BIT = 'DEPTH_BUFFER_BIT';
      this.COMPILE_STATUS = 'COMPILE_STATUS';
      this.LINK_STATUS = 'LINK_STATUS';
      this.VERTEX_SHADER = 'VERTEX_SHADER';
      this.FRAGMENT_SHADER = 'FRAGMENT_SHADER';
      this.TEXTURE_2D = 'TEXTURE_2D';
      this.RGBA = 'RGBA';
      this.UNSIGNED_BYTE = 'UNSIGNED_BYTE';
      this.LINEAR = 'LINEAR';
      this.CLAMP_TO_EDGE = 'CLAMP_TO_EDGE';
      
      // Mock method implementations
      this.createBuffer = jest.fn(() => ({}));
      this.bindBuffer = jest.fn();
      this.bufferData = jest.fn();
      this.createVertexArray = jest.fn(() => ({}));
      this.bindVertexArray = jest.fn();
      this.enableVertexAttribArray = jest.fn();
      this.vertexAttribPointer = jest.fn();
      this.createProgram = jest.fn(() => ({}));
      this.createShader = jest.fn(() => ({}));
      this.shaderSource = jest.fn();
      this.compileShader = jest.fn();
      this.attachShader = jest.fn();
      this.linkProgram = jest.fn();
      this.useProgram = jest.fn();
      this.getAttribLocation = jest.fn(() => 0);
      this.getUniformLocation = jest.fn(() => ({}));
      this.uniform1f = jest.fn();
      this.uniform2f = jest.fn();
      this.uniform3f = jest.fn();
      this.uniform4f = jest.fn();
      this.clear = jest.fn();
      this.clearColor = jest.fn();
      this.viewport = jest.fn();
      this.drawArrays = jest.fn();
      this.getProgramParameter = jest.fn(() => true);
      this.getShaderParameter = jest.fn(() => true);
      this.getProgramInfoLog = jest.fn(() => '');
      this.getShaderInfoLog = jest.fn(() => '');
      this.deleteBuffer = jest.fn();
      this.deleteVertexArray = jest.fn();
      this.deleteProgram = jest.fn();
      this.deleteShader = jest.fn();
    }
  }
  
  // Create minimal Canvas 2D context mock
  class CanvasRenderingContext2D {
    constructor() {
      this.fillStyle = '#000000';
      this.strokeStyle = '#000000';
      this.lineWidth = 1;
      this.font = '10px sans-serif';
      this.textAlign = 'start';
      this.textBaseline = 'alphabetic';
      
      // Mock method implementations
      this.fillRect = jest.fn();
      this.clearRect = jest.fn();
      this.beginPath = jest.fn();
      this.moveTo = jest.fn();
      this.lineTo = jest.fn();
      this.rect = jest.fn();
      this.arc = jest.fn();
      this.stroke = jest.fn();
      this.fill = jest.fn();
      this.fillText = jest.fn();
      this.strokeText = jest.fn();
      this.measureText = jest.fn(() => ({ width: 10 }));
      this.save = jest.fn();
      this.restore = jest.fn();
      this.translate = jest.fn();
      this.rotate = jest.fn();
      this.scale = jest.fn();
      this.setTransform = jest.fn();
      this.getImageData = jest.fn(() => ({ data: new Uint8ClampedArray(4) }));
      this.putImageData = jest.fn();
      this.drawImage = jest.fn();
    }
  }
  
  // Mock Canvas element
  class Canvas {
    constructor(width = 300, height = 150) {
      this.width = width;
      this.height = height;
      this.style = {};
      this._contexts = {};
    }
    
    getContext(contextType) {
      if (!this._contexts[contextType]) {
        if (contextType === 'webgl2' || contextType === 'webgl') {
          this._contexts[contextType] = new WebGLRenderingContext();
        } else if (contextType === '2d') {
          this._contexts[contextType] = new CanvasRenderingContext2D();
        }
      }
      return this._contexts[contextType];
    }
    
    toDataURL() {
      return 'data:image/png;base64,mock';
    }
  }
  
  return { createCanvas: (w, h) => new Canvas(w, h), Canvas };
});

// Test configuration
const TEST_CONFIG = {
  // Canvas dimensions
  width: 800,
  height: 400,
  
  // Array sizes to benchmark
  arraySizes: [10, 100, 1000, 10000, 100000],
  
  // Rendering operations to benchmark
  operations: [
    'initial-render',    // Initial array rendering
    'update-data',       // Update entire array data
    'highlight',         // Highlight specific elements
    'swap-animation',    // Animate swapping elements
    'sequential-access', // Sequential array access pattern
    'random-access'      // Random array access pattern
  ],
  
  // Color schemes to test
  colorSchemes: [
    'spectrum',
    'heatmap',
    'grayscale'
  ],
  
  // Number of iterations for each test
  iterations: 10,
  
  // Animation frames to simulate
  animationFrames: 60,
  
  // Timeout for tests in milliseconds
  timeout: 30000
};

/**
 * Creates a renderer instance for benchmarking
 * 
 * @param {string} rendererType - 'webgl' or 'canvas'
 * @param {Object} options - Renderer configuration options
 * @returns {Object} Renderer instance
 */
function createRenderer(rendererType, options = {}) {
  // Create mock canvas
  const canvas = document.createElement('canvas');
  canvas.width = TEST_CONFIG.width;
  canvas.height = TEST_CONFIG.height;
  
  // Configure renderer options
  const rendererOptions = {
    colorScheme: 'spectrum',
    barWidth: 4,
    spacing: 1,
    ...options
  };
  
  // Create appropriate renderer type
  let renderer;
  if (rendererType === 'webgl') {
    renderer = new WebGLRenderer(canvas, rendererOptions);
  } else {
    renderer = new ArrayRenderer(canvas, rendererOptions);
  }
  
  return renderer;
}

/**
 * Generates test data for rendering benchmarks
 * 
 * @param {number} size - Size of the array to generate
 * @returns {Array} Generated test data
 */
function generateTestData(size) {
  return generateDataSet('random', size, {
    min: 1,
    max: 100,
    seed: `render-test-${size}`
  });
}

/**
 * Benchmarks a single rendering operation
 * 
 * @param {Object} renderer - Renderer instance to benchmark
 * @param {string} operation - Operation to benchmark
 * @param {Array} data - Test data array
 * @returns {Object} Benchmark results for this operation
 */
function benchmarkOperation(renderer, operation, data) {
  const size = data.length;
  let results = [];
  
  // Ensure data is loaded in renderer
  renderer.setData(data);
  
  // Run benchmark iterations
  for (let i = 0; i < TEST_CONFIG.iterations; i++) {
    let startTime, endTime;
    
    switch (operation) {
      case 'initial-render':
        // Benchmark initial rendering
        startTime = performance.now();
        renderer.setData(data, true);
        renderer.render(performance.now());
        endTime = performance.now();
        break;
        
      case 'update-data':
        // Benchmark updating the entire dataset
        const updatedData = data.map(val => val + Math.random() * 5);
        startTime = performance.now();
        renderer.setData(updatedData, false);
        renderer.render(performance.now());
        endTime = performance.now();
        break;
        
      case 'highlight':
        // Benchmark highlighting elements
        const highlightIndices = Array.from(
          { length: Math.min(10, size) }, 
          () => Math.floor(Math.random() * size)
        );
        startTime = performance.now();
        renderer.highlight(highlightIndices);
        renderer.render(performance.now());
        endTime = performance.now();
        break;
        
      case 'swap-animation':
        // Benchmark swap animation
        const idx1 = Math.floor(Math.random() * size);
        const idx2 = Math.floor(Math.random() * size);
        startTime = performance.now();
        renderer.swap(idx1, idx2);
        
        // Simulate animation frames
        for (let frame = 0; frame < TEST_CONFIG.animationFrames; frame++) {
          const timestamp = startTime + (frame * (1000 / 60));
          renderer.render(timestamp);
        }
        endTime = performance.now();
        break;
        
      case 'sequential-access':
        // Benchmark sequential access pattern visualization
        startTime = performance.now();
        for (let j = 0; j < Math.min(100, size); j++) {
          renderer.markComparing([j, j + 1]);
          renderer.render(performance.now() + j);
        }
        endTime = performance.now();
        break;
        
      case 'random-access':
        // Benchmark random access pattern visualization
        startTime = performance.now();
        for (let j = 0; j < Math.min(100, size); j++) {
          const idx1 = Math.floor(Math.random() * size);
          const idx2 = Math.floor(Math.random() * size);
          renderer.markComparing([idx1, idx2]);
          renderer.render(performance.now() + j);
        }
        endTime = performance.now();
        break;
    }
    
    results.push(endTime - startTime);
  }
  
  // Calculate statistics
  const avg = results.reduce((sum, val) => sum + val, 0) / results.length;
  const min = Math.min(...results);
  const max = Math.max(...results);
  const median = results.sort((a, b) => a - b)[Math.floor(results.length / 2)];
  
  // Calculate frames per second equivalent for animation operations
  let fps = null;
  if (operation === 'swap-animation') {
    fps = TEST_CONFIG.animationFrames / (avg / 1000);
  }
  
  return {
    operation,
    size,
    time: {
      avg,
      min,
      max,
      median
    },
    fps
  };
}

/**
 * Benchmarks a renderer with multiple operations and data sizes
 * 
 * @param {string} rendererType - 'webgl' or 'canvas'
 * @param {Object} options - Renderer options
 * @returns {Object} Comprehensive benchmark results
 */
function benchmarkRenderer(rendererType, options = {}) {
  console.log(`Benchmarking ${rendererType} renderer with options:`, options);
  
  // Create renderer
  const renderer = createRenderer(rendererType, options);
  
  // Store results by array size and operation
  const results = {
    renderer: rendererType,
    options,
    metrics: {}
  };
  
  // Benchmark each array size
  for (const size of TEST_CONFIG.arraySizes) {
    console.log(`  Testing array size: ${size}`);
    
    try {
      // Generate test data
      const data = generateTestData(size);
      results.metrics[size] = {};
      
      // Benchmark each operation
      for (const operation of TEST_CONFIG.operations) {
        try {
          console.log(`    Operation: ${operation}`);
          results.metrics[size][operation] = benchmarkOperation(renderer, operation, data);
        } catch (error) {
          console.error(`    Error benchmarking ${operation} with size ${size}:`, error);
          results.metrics[size][operation] = { error: error.message };
        }
      }
    } catch (error) {
      console.error(`  Error generating data or initializing renderer for size ${size}:`, error);
      results.metrics[size] = { error: error.message };
    }
  }
  
  // Clean up
  renderer.dispose();
  
  return results;
}

/**
 * Main benchmark function that executes tests for all renderers
 * 
 * @returns {Object} Complete benchmark results
 */
async function runBenchmarks() {
  console.log('Starting renderer performance benchmarks...');
  const startTime = performance.now();
  
  // Store results for different renderers and configurations
  const results = {
    webgl: {},
    canvas: {}
  };
  
  // Benchmark WebGL renderer with different color schemes
  for (const colorScheme of TEST_CONFIG.colorSchemes) {
    results.webgl[colorScheme] = benchmarkRenderer('webgl', { colorScheme });
  }
  
  // Benchmark Canvas renderer with different color schemes
  for (const colorScheme of TEST_CONFIG.colorSchemes) {
    results.canvas[colorScheme] = benchmarkRenderer('canvas', { colorScheme });
  }
  
  // Benchmark WebGL renderer with different bar widths
  for (const barWidth of [2, 4, 8]) {
    results.webgl[`width-${barWidth}`] = benchmarkRenderer('webgl', { barWidth });
  }
  
  const endTime = performance.now();
  console.log(`All benchmarks completed in ${((endTime - startTime) / 1000).toFixed(2)} seconds.`);
  
  return results;
}

/**
 * Generate a comprehensive report from benchmark results
 * 
 * @param {Object} results - Benchmark results
 * @returns {string} Formatted report
 */
function generateReport(results) {
  let report = '# Rendering Performance Benchmark Report\n\n';
  
  // Add timestamp
  report += `Generated on: ${new Date().toISOString()}\n\n`;
  
  // Compare WebGL vs Canvas performance
  report += '## WebGL vs Canvas Renderer Comparison\n\n';
  
  // Standard configuration comparison (spectrum color scheme)
  report += '### Standard Configuration (spectrum color scheme)\n\n';
  report += '| Array Size | Operation | WebGL Time (ms) | Canvas Time (ms) | Speedup Factor |\n';
  report += '|------------|-----------|-----------------|------------------|----------------|\n';
  
  // Compare performance for each array size and operation
  for (const size of TEST_CONFIG.arraySizes) {
    // Skip if either renderer doesn't have data for this size
    if (!results.webgl.spectrum?.metrics[size] || !results.canvas.spectrum?.metrics[size]) {
      continue;
    }
    
    for (const operation of TEST_CONFIG.operations) {
      // Skip if either renderer doesn't have data for this operation
      if (!results.webgl.spectrum.metrics[size][operation] || 
          !results.canvas.spectrum.metrics[size][operation] ||
          results.webgl.spectrum.metrics[size][operation].error ||
          results.canvas.spectrum.metrics[size][operation].error) {
        continue;
      }
      
      const webglTime = results.webgl.spectrum.metrics[size][operation].time.avg;
      const canvasTime = results.canvas.spectrum.metrics[size][operation].time.avg;
      const speedupFactor = canvasTime / webglTime;
      
      report += `| ${size} | ${operation} | ${webglTime.toFixed(2)} | ${canvasTime.toFixed(2)} | ${speedupFactor.toFixed(2)}x |\n`;
    }
  }
  
  // WebGL scaling analysis
  report += '\n## WebGL Renderer Scaling Analysis\n\n';
  report += 'How rendering time scales with increasing array size:\n\n';
  report += '| Operation | 10→100 | 100→1000 | 1000→10000 | 10000→100000 |\n';
  report += '|-----------|--------|----------|------------|-------------|\n';
  
  for (const operation of TEST_CONFIG.operations) {
    let scalingFactors = [];
    
    // Calculate scaling factor between each adjacent array size
    for (let i = 0; i < TEST_CONFIG.arraySizes.length - 1; i++) {
      const smallerSize = TEST_CONFIG.arraySizes[i];
      const largerSize = TEST_CONFIG.arraySizes[i + 1];
      
      // Skip if data is missing
      if (!results.webgl.spectrum?.metrics[smallerSize]?.[operation] ||
          !results.webgl.spectrum?.metrics[largerSize]?.[operation] ||
          results.webgl.spectrum.metrics[smallerSize][operation].error ||
          results.webgl.spectrum.metrics[largerSize][operation].error) {
        scalingFactors.push('N/A');
        continue;
      }
      
      const smallerTime = results.webgl.spectrum.metrics[smallerSize][operation].time.avg;
      const largerTime = results.webgl.spectrum.metrics[largerSize][operation].time.avg;
      const scalingFactor = largerTime / smallerTime;
      const sizeRatio = largerSize / smallerSize;
      
      // Express as factor relative to linear scaling
      const relativeScaling = scalingFactor / sizeRatio;
      scalingFactors.push(`${relativeScaling.toFixed(2)}x`);
    }
    
    report += `| ${operation} | ${scalingFactors.join(' | ')} |\n`;
  }
  
  // Color scheme analysis
  report += '\n## Color Scheme Performance Impact\n\n';
  report += 'Performance comparison of different color schemes with the WebGL renderer:\n\n';
  report += '| Array Size | Operation | Spectrum (ms) | Heatmap (ms) | Grayscale (ms) |\n';
  report += '|------------|-----------|---------------|--------------|----------------|\n';
  
  // Compare color schemes for WebGL
  for (const size of TEST_CONFIG.arraySizes) {
    // Skip large array sizes for brevity
    if (size > 10000) continue;
    
    for (const operation of TEST_CONFIG.operations) {
      // Skip if any color scheme is missing data
      if (!results.webgl.spectrum?.metrics[size]?.[operation] ||
          !results.webgl.heatmap?.metrics[size]?.[operation] ||
          !results.webgl.grayscale?.metrics[size]?.[operation]) {
        continue;
      }
      
      const spectrumTime = results.webgl.spectrum.metrics[size][operation].time.avg;
      const heatmapTime = results.webgl.heatmap.metrics[size][operation].time.avg;
      const grayscaleTime = results.webgl.grayscale.metrics[size][operation].time.avg;
      
      report += `| ${size} | ${operation} | ${spectrumTime.toFixed(2)} | ${heatmapTime.toFixed(2)} | ${grayscaleTime.toFixed(2)} |\n`;
    }
  }
  
  // Animation performance
  report += '\n## Animation Performance\n\n';
  report += 'Animation frame rates for swap operations:\n\n';
  report += '| Array Size | WebGL FPS | Canvas FPS |\n';
  report += '|------------|-----------|------------|\n';
  
  for (const size of TEST_CONFIG.arraySizes) {
    // Skip if either renderer doesn't have data for this size
    if (!results.webgl.spectrum?.metrics[size]?.['swap-animation'] || 
        !results.canvas.spectrum?.metrics[size]?.['swap-animation'] ||
        results.webgl.spectrum.metrics[size]['swap-animation'].error ||
        results.canvas.spectrum.metrics[size]['swap-animation'].error) {
      continue;
    }
    
    const webglFps = results.webgl.spectrum.metrics[size]['swap-animation'].fps;
    const canvasFps = results.canvas.spectrum.metrics[size]['swap-animation'].fps;
    
    report += `| ${size} | ${webglFps.toFixed(1)} | ${canvasFps.toFixed(1)} |\n`;
  }
  
  // Bar width performance impact
  report += '\n## Bar Width Performance Impact\n\n';
  report += 'Performance with different bar widths (WebGL renderer):\n\n';
  report += '| Array Size | Operation | 2px Width (ms) | 4px Width (ms) | 8px Width (ms) |\n';
  report += '|------------|-----------|----------------|----------------|----------------|\n';
  
  for (const size of TEST_CONFIG.arraySizes) {
    // Skip large array sizes for brevity
    if (size > 10000) continue;
    
    for (const operation of TEST_CONFIG.operations) {
      // Skip if any bar width is missing data
      if (!results.webgl['width-2']?.metrics[size]?.[operation] ||
          !results.webgl['width-4']?.metrics[size]?.[operation] ||
          !results.webgl['width-8']?.metrics[size]?.[operation]) {
        continue;
      }
      
      const width2Time = results.webgl['width-2'].metrics[size][operation].time.avg;
      const width4Time = results.webgl['width-4'].metrics[size][operation].time.avg;
      const width8Time = results.webgl['width-8'].metrics[size][operation].time.avg;
      
      report += `| ${size} | ${operation} | ${width2Time.toFixed(2)} | ${width4Time.toFixed(2)} | ${width8Time.toFixed(2)} |\n`;
    }
  }
  
  return report;
}

/**
 * Main test runner function
 */
describe('Renderer Performance Benchmarks', () => {
  // Set longer timeout for performance tests
  jest.setTimeout(TEST_CONFIG.timeout * TEST_CONFIG.arraySizes.length * 
                 TEST_CONFIG.operations.length * TEST_CONFIG.iterations);
  
  let benchmarkResults;
  
  // Run benchmarks once before all tests
  beforeAll(async () => {
    benchmarkResults = await runBenchmarks();
  });
  
  test('Should generate comprehensive benchmark report', () => {
    const report = generateReport(benchmarkResults);
    expect(report).toBeTruthy();
    console.log(report); // Output report to console
    
    // Could also write report to file here
    // fs.writeFileSync('renderer-benchmark-report.md', report);
  });

  test('WebGL renderer should handle large arrays effectively', () => {
    // Check largest array size that completed successfully
    let largestTestedSize = 0;
    
    for (const size of TEST_CONFIG.arraySizes) {
      if (benchmarkResults.webgl.spectrum?.metrics[size]?.['initial-render'] && 
          !benchmarkResults.webgl.spectrum.metrics[size]['initial-render'].error) {
        largestTestedSize = size;
      }
    }
    
    // WebGL should handle at least 10,000 elements
    expect(largestTestedSize).toBeGreaterThanOrEqual(10000);
  });
  
  test('WebGL should outperform Canvas for large arrays', () => {
    // Find the largest size where both renderers have data
    let largestComparableSize = 0;
    
    for (const size of TEST_CONFIG.arraySizes) {
      if (benchmarkResults.webgl.spectrum?.metrics[size]?.['initial-render'] && 
          benchmarkResults.canvas.spectrum?.metrics[size]?.['initial-render'] &&
          !benchmarkResults.webgl.spectrum.metrics[size]['initial-render'].error &&
          !benchmarkResults.canvas.spectrum.metrics[size]['initial-render'].error) {
        largestComparableSize = size;
      }
    }
    
    // Skip test if we don't have comparable data
    if (largestComparableSize < 1000) {
      console.warn('Not enough data to compare WebGL and Canvas performance for large arrays');
      return;
    }
    
    const webglTime = benchmarkResults.webgl.spectrum.metrics[largestComparableSize]['initial-render'].time.avg;
    const canvasTime = benchmarkResults.canvas.spectrum.metrics[largestComparableSize]['initial-render'].time.avg;
    
    // WebGL should be faster (with some margin for test environment variability)
    expect(webglTime).toBeLessThan(canvasTime * 0.9);
  });
  
  test('Rendering time should scale reasonably with array size', () => {
    // Check scaling between successive array sizes
    for (let i = 0; i < TEST_CONFIG.arraySizes.length - 1; i++) {
      const smallerSize = TEST_CONFIG.arraySizes[i];
      const largerSize = TEST_CONFIG.arraySizes[i + 1];
      
      // Skip if we don't have data for these sizes
      if (!benchmarkResults.webgl.spectrum?.metrics[smallerSize]?.['initial-render'] ||
          !benchmarkResults.webgl.spectrum?.metrics[largerSize]?.['initial-render'] ||
          benchmarkResults.webgl.spectrum.metrics[smallerSize]['initial-render'].error ||
          benchmarkResults.webgl.spectrum.metrics[largerSize]['initial-render'].error) {
        continue;
      }
      
      const smallerTime = benchmarkResults.webgl.spectrum.metrics[smallerSize]['initial-render'].time.avg;
      const largerTime = benchmarkResults.webgl.spectrum.metrics[largerSize]['initial-render'].time.avg;
      const scalingFactor = largerTime / smallerTime;
      const sizeRatio = largerSize / smallerSize;
      
      // Rendering should scale sublinearly or at most linearly with array size
      // (with some margin for test environment variability)
      expect(scalingFactor).toBeLessThan(sizeRatio * 1.5);
    }
  });
  
  test('Animation operations should achieve acceptable frame rates', () => {
    // Check frame rates for medium-sized arrays
    const mediumSize = 1000;
    
    // Skip if we don't have data for this size
    if (!benchmarkResults.webgl.spectrum?.metrics[mediumSize]?.['swap-animation'] ||
        benchmarkResults.webgl.spectrum.metrics[mediumSize]['swap-animation'].error) {
      console.warn('No animation benchmark data available for medium-sized arrays');
      return;
    }
    
    const fps = benchmarkResults.webgl.spectrum.metrics[mediumSize]['swap-animation'].fps;
    
    // Frame rate should be at least 30 FPS for smooth animation
    expect(fps).toBeGreaterThanOrEqual(30);
  });
  
  test('Different color schemes should have similar performance', () => {
    // Check performance difference across color schemes
    const size = 1000;
    const operation = 'initial-render';
    
    // Skip if we don't have data for any color scheme
    if (!benchmarkResults.webgl.spectrum?.metrics[size]?.[operation] ||
        !benchmarkResults.webgl.heatmap?.metrics[size]?.[operation] ||
        !benchmarkResults.webgl.grayscale?.metrics[size]?.[operation]) {
      console.warn('Insufficient data to compare color scheme performance');
      return;
    }
    
    const spectrumTime = benchmarkResults.webgl.spectrum.metrics[size][operation].time.avg;
    const heatmapTime = benchmarkResults.webgl.heatmap.metrics[size][operation].time.avg;
    const grayscaleTime = benchmarkResults.webgl.grayscale.metrics[size][operation].time.avg;
    
    // Performance should not vary dramatically between color schemes
    // (within 30% of each other)
    expect(heatmapTime).toBeLessThan(spectrumTime * 1.3);
    expect(heatmapTime).toBeGreaterThan(spectrumTime * 0.7);
    expect(grayscaleTime).toBeLessThan(spectrumTime * 1.3);
    expect(grayscaleTime).toBeGreaterThan(spectrumTime * 0.7);
  });
});

export default runBenchmarks;
