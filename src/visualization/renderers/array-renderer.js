// src/visualization/renderers/array-renderer.js

/**
 * @file Canvas-based renderer for algorithm visualization
 * @author Algorithm Visualization Platform Team
 * @version 2.0.0
 * 
 * @description
 * Canvas-based renderer that provides a fallback when WebGL isn't supported.
 * This implementation uses the standard Canvas 2D API to render visualization
 * elements with a focus on compatibility, correctness, and reasonable performance
 * for moderate dataset sizes (up to ~10,000 elements).
 * 
 * The renderer implements the same interface as the WebGL renderer to ensure
 * seamless fallback, while optimizing Canvas-specific rendering techniques
 * for maximum possible performance within the constraints of the 2D context.
 * 
 * Performance characteristics:
 * - Time complexity: O(n) for rendering n elements
 * - Space complexity: O(n) for state tracking
 * - Rendering performance: ~60fps for up to 1,000 elements on most devices
 *                          ~30fps for 1,000-5,000 elements
 *                          ~10-15fps for 5,000-10,000 elements
 * 
 * Features:
 * - Identical API to WebGL renderer for simple substitution
 * - Performance optimizations specific to Canvas rendering
 * - Multiple rendering strategies based on data size
 * - Canvas-specific color handling and transformations
 * - Optimized animation with minimal redraws
 */

/**
 * Color utilities for Canvas rendering
 * @namespace CanvasColors
 * @private
 */
const CanvasColors = {
  /**
   * Convert normalized RGBA array (0-1) to CSS color string
   * @param {Array<number>} rgba - RGBA color values in 0-1 range
   * @returns {string} CSS rgba color string
   */
  rgbaArrayToString(rgba) {
    const r = Math.floor(rgba[0] * 255);
    const g = Math.floor(rgba[1] * 255);
    const b = Math.floor(rgba[2] * 255);
    const a = rgba[3];
    return `rgba(${r}, ${g}, ${b}, ${a})`;
  },
  
  /**
   * Convert background color array to CSS color string
   * @param {Array<number>} background - RGBA background color (0-1 range)
   * @returns {string} CSS rgba color string
   */
  backgroundToString(background) {
    return this.rgbaArrayToString(background);
  },
  
  /**
   * Color schemes with CSS color string generation
   */
  schemes: {
    // Spectrum (blue to red)
    spectrum: (value) => {
      const rgba = [
        Math.sin(value * Math.PI) * 0.5 + 0.5,
        Math.sin(value * Math.PI + Math.PI * 2/3) * 0.5 + 0.5,
        Math.sin(value * Math.PI + Math.PI * 4/3) * 0.5 + 0.5,
        1.0
      ];
      return CanvasColors.rgbaArrayToString(rgba);
    },
    
    // Heatmap (blue to red)
    heatmap: (value) => {
      const rgba = [value, 0.2, 1.0 - value, 1.0];
      return CanvasColors.rgbaArrayToString(rgba);
    },
    
    // Grayscale
    grayscale: (value) => {
      const v = Math.floor(value * 255);
      return `rgba(${v}, ${v}, ${v}, 1.0)`;
    },
    
    // Rainbow
    rainbow: (value) => {
      const r = 0.5 + 0.5 * Math.sin(Math.PI * value);
      const g = 0.5 + 0.5 * Math.sin(Math.PI * (value + 0.33));
      const b = 0.5 + 0.5 * Math.sin(Math.PI * (value + 0.67));
      return `rgba(${Math.floor(r*255)}, ${Math.floor(g*255)}, ${Math.floor(b*255)}, 1.0)`;
    },
    
    // Monochromatic blue
    blue: (value) => {
      return `rgba(0, ${Math.floor(value * 127)}, ${Math.floor(127 + value * 128)}, 1.0)`;
    },
    
    // Monochromatic green
    green: (value) => {
      return `rgba(0, ${Math.floor(127 + value * 128)}, ${Math.floor(value * 77)}, 1.0)`;
    },
    
    // Viridis-inspired colormap (perceptually uniform)
    viridis: (value) => {
      // Approximation of the Viridis colormap
      const x = value;
      const r = Math.max(0, Math.min(1, (0.0 + 4.5 * x - 5.5 * x * x + 1.25 * x * x * x)));
      const g = Math.max(0, Math.min(1, (0.0 + 0.9 * x + 1.1 * x * x - 1.5 * x * x * x)));
      const b = Math.max(0, Math.min(1, (0.3 + 0.4 * x - 1.2 * x * x + 0.6 * x * x * x)));
      return `rgba(${Math.floor(r*255)}, ${Math.floor(g*255)}, ${Math.floor(b*255)}, 1.0)`;
    }
  },
  
  /**
   * Get a color from a scheme
   * @param {string} scheme - The name of the color scheme
   * @param {number} value - Normalized value (0-1)
   * @returns {string} CSS color string
   */
  getColor(scheme, value) {
    const colorFn = this.schemes[scheme] || this.schemes.spectrum;
    return colorFn(Math.max(0, Math.min(1, value)));
  },
  
  /**
   * Get special highlight colors
   * @param {string} type - Type of highlight ('highlight', 'comparing', 'sorted', 'read', 'write')
   * @returns {string} CSS color string
   */
  getHighlightColor(type) {
    switch (type) {
      case 'highlight':
        return 'rgba(255, 255, 0, 1.0)'; // Yellow
      case 'comparing':
        return 'rgba(255, 0, 0, 1.0)';   // Red
      case 'sorted':
        return 'rgba(0, 255, 0, 1.0)';   // Green
      case 'read':
        return 'rgba(0, 128, 255, 1.0)'; // Light blue
      case 'write':
        return 'rgba(255, 128, 0, 1.0)'; // Orange
      default:
        return 'rgba(255, 255, 255, 1.0)'; // White
    }
  }
};

/**
 * Easing functions for animations
 * @namespace Easings
 * @private
 */
const Easings = {
  // Linear interpolation (no easing)
  linear: (t) => t,
  
  // Quadratic easing
  easeInQuad: (t) => t * t,
  easeOutQuad: (t) => t * (2 - t),
  easeInOutQuad: (t) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
  
  // Cubic easing
  easeInCubic: (t) => t * t * t,
  easeOutCubic: (t) => (--t) * t * t + 1,
  easeInOutCubic: (t) => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,
  
  // Elastic easing
  easeOutElastic: (t) => {
    const p = 0.3;
    return Math.pow(2, -10 * t) * Math.sin((t - p / 4) * (2 * Math.PI) / p) + 1;
  },
  
  // Bounce easing
  easeOutBounce: (t) => {
    if (t < (1 / 2.75)) {
      return 7.5625 * t * t;
    } else if (t < (2 / 2.75)) {
      return 7.5625 * (t -= (1.5 / 2.75)) * t + 0.75;
    } else if (t < (2.5 / 2.75)) {
      return 7.5625 * (t -= (2.25 / 2.75)) * t + 0.9375;
    } else {
      return 7.5625 * (t -= (2.625 / 2.75)) * t + 0.984375;
    }
  }
};

/**
 * Performance optimization strategies for Canvas rendering
 * @namespace RenderStrategies
 * @private
 */
const RenderStrategies = {
  /**
   * Strategy for small datasets (<= 500 elements)
   * - Full rendering with rounded corners and shadows
   * - Individual bar rendering with all visual effects
   */
  DETAILED: 'detailed',
  
  /**
   * Strategy for medium datasets (501-2000 elements)
   * - Simplified rendering without shadows
   * - Rectangular bars without rounded corners
   * - Batch rendering with minimal state changes
   */
  OPTIMIZED: 'optimized',
  
  /**
   * Strategy for large datasets (2001-10000 elements)
   * - Minimal visual effects
   * - Direct pixel manipulation for maximum speed
   * - Reduced animation complexity
   */
  PERFORMANCE: 'performance',
  
  /**
   * Determine the best strategy based on data size
   * @param {number} dataSize - Number of elements to render
   * @returns {string} The optimal rendering strategy
   */
  getBestStrategy(dataSize) {
    if (dataSize <= 500) {
      return this.DETAILED;
    } else if (dataSize <= 2000) {
      return this.OPTIMIZED;
    } else {
      return this.PERFORMANCE;
    }
  }
};

/**
 * @class ArrayRenderer
 * @description Canvas-based renderer for sorting algorithm visualization
 */
class ArrayRenderer {
  /**
   * Create a new Canvas renderer
   * @param {HTMLCanvasElement} canvas - The canvas element to render to
   * @param {Object} options - Configuration options
   * @param {number} [options.maxElements=10000] - Maximum number of elements to render
   * @param {number} [options.barWidth=4] - Width of each bar in pixels
   * @param {number} [options.spacing=1] - Spacing between bars in pixels
   * @param {string} [options.colorScheme='spectrum'] - Color scheme to use
   * @param {Array<number>} [options.background=[0.1, 0.1, 0.1, 1.0]] - Background color (RGBA)
   * @param {string|Array<number>} [options.highlightColor] - Color for highlighted elements
   * @param {string|Array<number>} [options.comparingColor] - Color for elements being compared
   * @param {string|Array<number>} [options.sortedColor] - Color for sorted elements
   * @param {string|Array<number>} [options.readColor] - Color for elements being read
   * @param {string|Array<number>} [options.writeColor] - Color for elements being written
   * @param {number} [options.animationDuration=300] - Duration of animations in ms
   * @param {string} [options.easingFunction='easeOutCubic'] - Easing function for animations
   * @param {number} [options.effectMode=0] - Visual effect mode (0-3)
   * @param {number} [options.amplitude=0.05] - Animation amplitude for effects
   * @param {boolean} [options.usePixelManipulation=true] - Use direct pixel manipulation for large datasets
   */
  constructor(canvas, options = {}) {
    this.canvas = canvas;
    
    // Store options with defaults
    this.options = {
      maxElements: 10000,
      barWidth: 4,
      spacing: 1,
      colorScheme: 'spectrum',
      background: [0.1, 0.1, 0.1, 1.0],
      highlightColor: CanvasColors.getHighlightColor('highlight'),
      comparingColor: CanvasColors.getHighlightColor('comparing'),
      sortedColor: CanvasColors.getHighlightColor('sorted'),
      readColor: CanvasColors.getHighlightColor('read'),
      writeColor: CanvasColors.getHighlightColor('write'),
      animationDuration: 300,
      easingFunction: 'easeOutCubic',
      effectMode: 0,
      amplitude: 0.05,
      usePixelManipulation: true,
      ...options
    };
    
    // Get 2D context
    this.ctx = canvas.getContext('2d', { 
      alpha: true,
      desynchronized: true // Potential performance optimization
    });
    
    if (!this.ctx) {
      throw new Error('Failed to create Canvas 2D context.');
    }
    
    // Initialize renderer state
    this.initRenderer();
    
    // State for rendering
    this.data = [];
    this.originalData = [];
    this.highlights = new Set();
    this.comparing = new Set();
    this.sortedIndices = new Set();
    this.readIndices = new Set();
    this.writeIndices = new Set();
    
    // State for animation
    this.positions = [];      // Current positions of elements
    this.targetPositions = []; // Target positions for animation
    this.isAnimating = false;
    this.animationStartTime = 0;
    this.animationProgress = 0;
    
    // ImageData optimization for large datasets
    this.imageData = null;
    this.renderStrategy = RenderStrategies.DETAILED;
    
    // Renderer metrics
    this.metrics = {
      fps: 0,
      renderTime: 0,
      elementsRendered: 0,
      renderStrategy: this.renderStrategy,
      frameCount: 0
    };
    
    // Performance monitoring
    this.lastFrameTime = 0;
    this.frameCount = 0;
    this.fpsUpdateInterval = 500; // ms
    this.lastFpsUpdate = 0;
  }
  
  /**
   * Initialize the Canvas renderer
   * @private
   */
  initRenderer() {
    // Convert background array to CSS color
    const bgColor = CanvasColors.backgroundToString(this.options.background);
    
    // Set initial canvas state
    this.ctx.fillStyle = bgColor;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Convert array colors to strings if needed
    if (Array.isArray(this.options.highlightColor)) {
      this.options.highlightColor = CanvasColors.rgbaArrayToString(this.options.highlightColor);
    }
    
    if (Array.isArray(this.options.comparingColor)) {
      this.options.comparingColor = CanvasColors.rgbaArrayToString(this.options.comparingColor);
    }
    
    if (Array.isArray(this.options.sortedColor)) {
      this.options.sortedColor = CanvasColors.rgbaArrayToString(this.options.sortedColor);
    }
    
    if (Array.isArray(this.options.readColor)) {
      this.options.readColor = CanvasColors.rgbaArrayToString(this.options.readColor);
    }
    
    if (Array.isArray(this.options.writeColor)) {
      this.options.writeColor = CanvasColors.rgbaArrayToString(this.options.writeColor);
    }
    
    // Initialize off-screen canvas for performance optimization
    this.offscreenCanvas = document.createElement('canvas');
    this.offscreenCanvas.width = this.canvas.width;
    this.offscreenCanvas.height = this.canvas.height;
    this.offscreenCtx = this.offscreenCanvas.getContext('2d', {
      alpha: true,
      desynchronized: true
    });
  }
  
  /**
   * Set the data array to visualize
   * @param {Array} data - Array of numerical values
   * @param {boolean} [resetState=true] - Whether to reset visualization state
   * @throws {Error} If data array exceeds maximum elements
   */
  setData(data, resetState = true) {
    // Validate data
    if (!Array.isArray(data)) {
      throw new TypeError('Data must be an array.');
    }
    
    // Limit the number of elements to render
    if (data.length > this.options.maxElements) {
      console.warn(`Data array exceeds maximum elements (${this.options.maxElements}). Truncating.`);
      data = data.slice(0, this.options.maxElements);
    }
    
    // Store data
    this.data = [...data];
    
    // Determine rendering strategy based on data size
    this.renderStrategy = RenderStrategies.getBestStrategy(data.length);
    this.metrics.renderStrategy = this.renderStrategy;
    
    // Reset visualization state if needed
    if (resetState) {
      this.originalData = [...data];
      this.highlights = new Set();
      this.comparing = new Set();
      this.sortedIndices = new Set();
      this.readIndices = new Set();
      this.writeIndices = new Set();
      
      // Initialize positions for animation
      this.positions = data.map((_, i) => i);
      this.targetPositions = [...this.positions];
    }
    
    // Render the initial state
    this.render(performance.now());
  }
  
  /**
   * Highlight specific indices in the visualization
   * @param {Array|Set} indices - Indices to highlight
   */
  highlight(indices) {
    this.highlights = new Set(indices);
    if (!this.isAnimating) {
      this.render(performance.now());
    }
  }
  
  /**
   * Mark indices as being compared
   * @param {Array|Set} indices - Indices being compared
   */
  markComparing(indices) {
    this.comparing = new Set(indices);
    if (!this.isAnimating) {
      this.render(performance.now());
    }
  }
  
  /**
   * Mark indices as sorted
   * @param {Array|Set} indices - Indices that are in sorted position
   */
  markSorted(indices) {
    this.sortedIndices = new Set(indices);
    if (!this.isAnimating) {
      this.render(performance.now());
    }
  }
  
  /**
   * Mark indices as being read from
   * @param {Array|Set} indices - Indices being read
   */
  markRead(indices) {
    this.readIndices = new Set(indices);
    if (!this.isAnimating) {
      this.render(performance.now());
    }
  }
  
  /**
   * Mark indices as being written to
   * @param {Array|Set} indices - Indices being written
   */
  markWrite(indices) {
    this.writeIndices = new Set(indices);
    if (!this.isAnimating) {
      this.render(performance.now());
    }
  }
  
  /**
   * Swap two elements in the visualization with animation
   * @param {number} i - First index
   * @param {number} j - Second index
   */
  swap(i, j) {
    // Swap data values
    [this.data[i], this.data[j]] = [this.data[j], this.data[i]];
    
    // Update target positions for animation
    [this.targetPositions[i], this.targetPositions[j]] = [this.targetPositions[j], this.targetPositions[i]];
    
    // Start animation if not already running
    if (!this.isAnimating) {
      this.startAnimation();
    }
  }
  
  /**
   * Update a single value in the array
   * @param {number} index - Array index
   * @param {number} value - New value
   */
  updateValue(index, value) {
    this.data[index] = value;
    if (!this.isAnimating) {
      this.render(performance.now());
    }
  }
  
  /**
   * Start the animation sequence
   * @private
   */
  startAnimation() {
    this.isAnimating = true;
    this.animationStartTime = performance.now();
    this.animationProgress = 0;
    this.requestAnimationFrame();
  }
  
  /**
   * Request a new animation frame
   * @private
   */
  requestAnimationFrame() {
    requestAnimationFrame((timestamp) => this.animate(timestamp));
  }
  
  /**
   * Animate one frame of the visualization
   * @param {number} timestamp - Current time from requestAnimationFrame
   * @private
   */
  animate(timestamp) {
    // Calculate elapsed time and animation progress
    const elapsed = timestamp - this.animationStartTime;
    this.animationProgress = Math.min(1, elapsed / this.options.animationDuration);
    
    // Apply easing function
    const easingFn = Easings[this.options.easingFunction] || Easings.linear;
    const easedProgress = easingFn(this.animationProgress);
    
    // Update element positions based on animation progress
    for (let i = 0; i < this.positions.length; i++) {
      this.positions[i] = this.lerp(
        this.positions[i],
        this.targetPositions[i],
        easedProgress
      );
    }
    
    // Render the frame
    this.render(timestamp);
    
    // Continue animation if not finished
    if (this.animationProgress < 1) {
      this.requestAnimationFrame();
    } else {
      // Animation complete
      this.isAnimating = false;
      
      // Snap to final positions
      this.positions = [...this.targetPositions];
      this.render(timestamp);
    }
  }
  
  /**
   * Render the current state of the visualization
   * @param {number} timestamp - Current time
   */
  render(timestamp) {
    const startTime = performance.now();
    const ctx = this.ctx;
    const { barWidth, spacing, colorScheme, background, amplitude, effectMode } = this.options;
    
    // Clear the canvas
    ctx.fillStyle = CanvasColors.backgroundToString(background);
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Find the maximum value for scaling
    const maxValue = Math.max(...this.data, 1); // Avoid division by zero
    
    // Calculate available height accounting for potential animation amplitude
    const availableHeight = this.canvas.height * 0.9; // Use 90% of canvas height
    const maxAmplitude = this.canvas.height * 0.05 * amplitude;
    
    // Choose rendering strategy based on data size and current strategy
    switch (this.renderStrategy) {
      case RenderStrategies.DETAILED:
        this.renderDetailed(
          maxValue, 
          availableHeight, 
          maxAmplitude, 
          timestamp, 
          colorScheme
        );
        break;
        
      case RenderStrategies.OPTIMIZED:
        this.renderOptimized(
          maxValue, 
          availableHeight, 
          maxAmplitude, 
          timestamp, 
          colorScheme
        );
        break;
        
      case RenderStrategies.PERFORMANCE:
        if (this.options.usePixelManipulation && this.data.length > 5000) {
          this.renderWithPixelManipulation(
            maxValue, 
            availableHeight, 
            colorScheme
          );
        } else {
          this.renderPerformance(
            maxValue, 
            availableHeight, 
            maxAmplitude, 
            timestamp, 
            colorScheme
          );
        }
        break;
    }
    
    // Update metrics
    this.metrics.renderTime = performance.now() - startTime;
    this.metrics.elementsRendered = this.data.length;
    this.updateFPS(timestamp);
  }
  
  /**
   * Render with detailed visuals for small datasets
   * @param {number} maxValue - Maximum value in the dataset
   * @param {number} availableHeight - Available height for rendering
   * @param {number} maxAmplitude - Maximum amplitude for animations
   * @param {number} timestamp - Current time
   * @param {string} colorScheme - Color scheme to use
   * @private
   */
  renderDetailed(maxValue, availableHeight, maxAmplitude, timestamp, colorScheme) {
    const ctx = this.ctx;
    const { barWidth, spacing } = this.options;
    
    // Enhanced rendering for small datasets
    this.data.forEach((value, i) => {
      const normValue = value / maxValue;
      const height = normValue * availableHeight;
      
      // Calculate position (using animation position)
      const x = this.positions[i] * (barWidth + spacing);
      
      // Apply subtle animation based on height and time
      let wobble = 0;
      if (this.options.effectMode !== 0) {
        wobble = Math.sin(timestamp * 0.005 + i * 0.1) * maxAmplitude * normValue;
      }
      
      // Determine bar color based on state
      let color;
      
      if (this.comparing.has(i)) {
        color = this.options.comparingColor;
      } else if (this.highlights.has(i)) {
        color = this.options.highlightColor;
      } else if (this.sortedIndices.has(i)) {
        color = this.options.sortedColor;
      } else if (this.readIndices.has(i)) {
        color = this.options.readColor;
      } else if (this.writeIndices.has(i)) {
        color = this.options.writeColor;
      } else {
        // Use color scheme for regular elements
        color = CanvasColors.getColor(colorScheme, normValue);
      }
      
      // Draw bar with rounded corners
      const barHeight = Math.max(1, height + wobble);
      const cornerRadius = Math.min(2, barWidth / 2);
      
      ctx.beginPath();
      ctx.moveTo(x + cornerRadius, this.canvas.height);
      ctx.lineTo(x + cornerRadius, this.canvas.height - barHeight + cornerRadius);
      ctx.arc(x + cornerRadius, this.canvas.height - barHeight + cornerRadius, cornerRadius, Math.PI, 1.5 * Math.PI);
      ctx.lineTo(x + barWidth - cornerRadius, this.canvas.height - barHeight);
      ctx.arc(x + barWidth - cornerRadius, this.canvas.height - barHeight + cornerRadius, cornerRadius, 1.5 * Math.PI, 0);
      ctx.lineTo(x + barWidth, this.canvas.height);
      ctx.closePath();
      
      // Fill with color
      ctx.fillStyle = color;
      ctx.fill();
      
      // Add subtle shadow for 3D effect
      if (barHeight > 5) {
        ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
        ctx.shadowBlur = 2;
        ctx.shadowOffsetX = 1;
        ctx.shadowOffsetY = 1;
        ctx.fill();
        
        // Reset shadow
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
      }
      
      // Add a highlight effect on top for sorted elements
      if (this.sortedIndices.has(i) && this.options.effectMode > 1) {
        const gradient = ctx.createLinearGradient(
          x, this.canvas.height - barHeight,
          x, this.canvas.height
        );
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.3)');
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        
        ctx.fillStyle = gradient;
        ctx.fill();
      }
    });
  }
  
  /**
   * Render with optimized visuals for medium datasets
   * @param {number} maxValue - Maximum value in the dataset
   * @param {number} availableHeight - Available height for rendering
   * @param {number} maxAmplitude - Maximum amplitude for animations
   * @param {number} timestamp - Current time
   * @param {string} colorScheme - Color scheme to use
   * @private
   */
  renderOptimized(maxValue, availableHeight, maxAmplitude, timestamp, colorScheme) {
    const ctx = this.ctx;
    const { barWidth, spacing } = this.options;
    
    // Group elements by state for batch rendering
    const groups = {
      normal: [],
      comparing: [],
      highlighted: [],
      sorted: [],
      read: [],
      write: []
    };
    
    // Categorize elements
    this.data.forEach((value, i) => {
      const normValue = value / maxValue;
      const height = normValue * availableHeight;
      
      // Calculate position (using animation position)
      const x = this.positions[i] * (barWidth + spacing);
      
      // Apply subtle animation based on height
      let wobble = 0;
      if (this.options.effectMode !== 0) {
        wobble = Math.sin(timestamp * 0.005 + i * 0.1) * maxAmplitude * normValue;
      }
      
      const y = this.canvas.height - (height + wobble);
      
      // Categorize by state
      if (this.comparing.has(i)) {
        groups.comparing.push({ x, y, width: barWidth, height: height + wobble, normValue });
      } else if (this.highlights.has(i)) {
        groups.highlighted.push({ x, y, width: barWidth, height: height + wobble, normValue });
      } else if (this.sortedIndices.has(i)) {
        groups.sorted.push({ x, y, width: barWidth, height: height + wobble, normValue });
      } else if (this.readIndices.has(i)) {
        groups.read.push({ x, y, width: barWidth, height: height + wobble, normValue });
      } else if (this.writeIndices.has(i)) {
        groups.write.push({ x, y, width: barWidth, height: height + wobble, normValue });
      } else {
        groups.normal.push({ x, y, width: barWidth, height: height + wobble, normValue });
      }
    });
    
    // Render groups in batches for better performance
    
    // Render normal elements (by color value for fewer state changes)
    const colorMap = new Map();
    groups.normal.forEach(elem => {
      const color = CanvasColors.getColor(colorScheme, elem.normValue);
      if (!colorMap.has(color)) {
        colorMap.set(color, []);
      }
      colorMap.get(color).push(elem);
    });
    
    colorMap.forEach((elements, color) => {
      ctx.fillStyle = color;
      elements.forEach(elem => {
        ctx.fillRect(elem.x, elem.y, elem.width, Math.max(1, elem.height));
      });
    });
    
    // Render special state elements
    this.renderElementGroup(ctx, groups.comparing, this.options.comparingColor);
    this.renderElementGroup(ctx, groups.highlighted, this.options.highlightColor);
    this.renderElementGroup(ctx, groups.sorted, this.options.sortedColor);
    this.renderElementGroup(ctx, groups.read, this.options.readColor);
    this.renderElementGroup(ctx, groups.write, this.options.writeColor);
  }
  
  /**
   * Render element group with same color
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {Array} elements - Elements to render
   * @param {string} color - Color to use
   * @private
   */
  renderElementGroup(ctx, elements, color) {
    if (elements.length === 0) return;
    
    ctx.fillStyle = color;
    elements.forEach(elem => {
      ctx.fillRect(elem.x, elem.y, elem.width, Math.max(1, elem.height));
    });
  }
  
  /**
   * Render with minimal visual effects for large datasets
   * @param {number} maxValue - Maximum value in the dataset
   * @param {number} availableHeight - Available height for rendering
   * @param {number} maxAmplitude - Maximum amplitude for animations
   * @param {number} timestamp - Current time
   * @param {string} colorScheme - Color scheme to use
   * @private
   */
  renderPerformance(maxValue, availableHeight, maxAmplitude, timestamp, colorScheme) {
    const ctx = this.ctx;
    const { barWidth, spacing } = this.options;
    const totalWidth = barWidth + spacing;
    
    // Pre-calculate to avoid redundant calculations in loop
    const baseY = this.canvas.height;
    const heightFactor = availableHeight / maxValue;
    
    // Use path batching for fewer draw calls
    
    // Draw normal elements in a single path
    const specialIndices = new Set([
      ...this.comparing,
      ...this.highlights,
      ...this.sortedIndices,
      ...this.readIndices,
      ...this.writeIndices
    ]);
    
    // Group elements by color value ranges to reduce state changes
    const colorRanges = [
      { min: 0.0, max: 0.2, elements: [] },
      { min: 0.2, max: 0.4, elements: [] },
      { min: 0.4, max: 0.6, elements: [] },
      { min: 0.6, max: 0.8, elements: [] },
      { min: 0.8, max: 1.0, elements: [] }
    ];
    
    // Categorize normal elements by value range
    this.data.forEach((value, i) => {
      if (specialIndices.has(i)) return;
      
      const normValue = value / maxValue;
      const range = colorRanges.find(r => normValue >= r.min && normValue < r.max);
      if (range) {
        range.elements.push({
          index: i,
          normValue: normValue,
          x: this.positions[i] * totalWidth,
          height: value * heightFactor
        });
      }
    });
    
    // Render normal elements by color range
    colorRanges.forEach(range => {
      if (range.elements.length === 0) return;
      
      // Get color for this range
      const avgValue = (range.min + range.max) / 2;
      ctx.fillStyle = CanvasColors.getColor(colorScheme, avgValue);
      
      // Draw all elements in this range at once
      range.elements.forEach(elem => {
        const barHeight = Math.max(1, elem.height);
        ctx.fillRect(elem.x, baseY - barHeight, barWidth, barHeight);
      });
    });
    
    // Draw special state elements
    this.renderSpecialStates(
      baseY, 
      heightFactor, 
      totalWidth, 
      barWidth, 
      maxValue,
      colorScheme
    );
  }
  
  /**
   * Render elements with special states
   * @param {number} baseY - Base Y position
   * @param {number} heightFactor - Factor to convert values to heights
   * @param {number} totalWidth - Total width of each element
   * @param {number} barWidth - Width of each bar
   * @param {number} maxValue - Maximum value
   * @param {string} colorScheme - Color scheme
   * @private
   */
  renderSpecialStates(baseY, heightFactor, totalWidth, barWidth, maxValue, colorScheme) {
    const ctx = this.ctx;
    
    // Comparing elements
    if (this.comparing.size > 0) {
      ctx.fillStyle = this.options.comparingColor;
      this.comparing.forEach(i => {
        const value = this.data[i];
        const barHeight = Math.max(1, value * heightFactor);
        const x = this.positions[i] * totalWidth;
        ctx.fillRect(x, baseY - barHeight, barWidth, barHeight);
      });
    }
    
    // Highlighted elements
    if (this.highlights.size > 0) {
      ctx.fillStyle = this.options.highlightColor;
      this.highlights.forEach(i => {
        const value = this.data[i];
        const barHeight = Math.max(1, value * heightFactor);
        const x = this.positions[i] * totalWidth;
        ctx.fillRect(x, baseY - barHeight, barWidth, barHeight);
      });
    }
    
    // Sorted elements
    if (this.sortedIndices.size > 0) {
      ctx.fillStyle = this.options.sortedColor;
      this.sortedIndices.forEach(i => {
        const value = this.data[i];
        const barHeight = Math.max(1, value * heightFactor);
        const x = this.positions[i] * totalWidth;
        ctx.fillRect(x, baseY - barHeight, barWidth, barHeight);
      });
    }
    
    // Read elements
    if (this.readIndices.size > 0) {
      ctx.fillStyle = this.options.readColor;
      this.readIndices.forEach(i => {
        const value = this.data[i];
        const barHeight = Math.max(1, value * heightFactor);
        const x = this.positions[i] * totalWidth;
        ctx.fillRect(x, baseY - barHeight, barWidth, barHeight);
      });
    }
    
    // Write elements
    if (this.writeIndices.size > 0) {
      ctx.fillStyle = this.options.writeColor;
      this.writeIndices.forEach(i => {
        const value = this.data[i];
        const barHeight = Math.max(1, value * heightFactor);
        const x = this.positions[i] * totalWidth;
        ctx.fillRect(x, baseY - barHeight, barWidth, barHeight);
      });
    }
  }
  
  /**
   * Render using direct pixel manipulation for large datasets
   * @param {number} maxValue - Maximum value in the dataset
   * @param {number} availableHeight - Available height for rendering
   * @param {string} colorScheme - Color scheme to use
   * @private
   */
  renderWithPixelManipulation(maxValue, availableHeight, colorScheme) {
    // This is the most performant but least visually appealing rendering method
    const { barWidth, spacing } = this.options;
    const totalWidth = barWidth + spacing;
    
    // Create or reuse ImageData
    if (!this.imageData || 
        this.imageData.width !== this.canvas.width || 
        this.imageData.height !== this.canvas.height) {
      this.imageData = this.ctx.createImageData(this.canvas.width, this.canvas.height);
    }
    
    const data = this.imageData.data;
    const width = this.canvas.width;
    const height = this.canvas.height;
    
    // Clear the image data
    for (let i = 0; i < data.length; i += 4) {
      data[i] = Math.floor(this.options.background[0] * 255);     // R
      data[i + 1] = Math.floor(this.options.background[1] * 255); // G
      data[i + 2] = Math.floor(this.options.background[2] * 255); // B
      data[i + 3] = Math.floor(this.options.background[3] * 255); // A
    }
    
    // Calculate the normalization factor
    const heightFactor = availableHeight / maxValue;
    
    // Draw the bars directly into the image data
    this.data.forEach((value, i) => {
      const normValue = value / maxValue;
      const barHeight = Math.max(1, Math.floor(value * heightFactor));
      const xPos = Math.floor(this.positions[i] * totalWidth);
      
      // Skip if out of bounds
      if (xPos + barWidth >= width || xPos < 0) return;
      
      // Determine bar color
      let color;
      
      if (this.comparing.has(i)) {
        color = [255, 0, 0, 255]; // Red for comparing
      } else if (this.highlights.has(i)) {
        color = [255, 255, 0, 255]; // Yellow for highlights
      } else if (this.sortedIndices.has(i)) {
        color = [0, 255, 0, 255]; // Green for sorted
      } else if (this.readIndices.has(i)) {
        color = [0, 128, 255, 255]; // Light blue for read
      } else if (this.writeIndices.has(i)) {
        color = [255, 128, 0, 255]; // Orange for write
      } else {
        // Parse color scheme
        const rgbaColor = CanvasColors.getColor(colorScheme, normValue);
        const match = rgbaColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d+(?:\.\d+)?))?\)/);
        
        if (match) {
          color = [
            parseInt(match[1]), // R
            parseInt(match[2]), // G
            parseInt(match[3]), // B
            match[4] ? Math.floor(parseFloat(match[4]) * 255) : 255 // A
          ];
        } else {
          color = [100, 100, 100, 255]; // Default gray
        }
      }
      
      // Fill the bar by setting individual pixels
      for (let x = 0; x < barWidth; x++) {
        const xCoord = xPos + x;
        if (xCoord >= width) continue;
        
        for (let y = 0; y < barHeight; y++) {
          const yCoord = height - y - 1;
          if (yCoord < 0 || yCoord >= height) continue;
          
          const pixelIndex = (yCoord * width + xCoord) * 4;
          data[pixelIndex] = color[0];     // R
          data[pixelIndex + 1] = color[1]; // G
          data[pixelIndex + 2] = color[2]; // B
          data[pixelIndex + 3] = color[3]; // A
        }
      }
    });
    
    // Put the image data back to the canvas
    this.ctx.putImageData(this.imageData, 0, 0);
  }
  
  /**
   * Update FPS calculation
   * @param {number} timestamp - Current time
   * @private
   */
  updateFPS(timestamp) {
    // Count frames
    this.frameCount++;
    
    // Update FPS every interval
    if (timestamp - this.lastFpsUpdate >= this.fpsUpdateInterval) {
      const elapsed = timestamp - this.lastFpsUpdate;
      this.metrics.fps = Math.round((this.frameCount * 1000) / elapsed);
      
      this.lastFpsUpdate = timestamp;
      this.frameCount = 0;
    }
  }
  
  /**
   * Resize the renderer to match canvas size
   */
  resize() {
    // Get canvas display size
    const displayWidth = this.canvas.clientWidth;
    const displayHeight = this.canvas.clientHeight;
    
    // Check if canvas size has changed
    if (this.canvas.width !== displayWidth || this.canvas.height !== displayHeight) {
      // Update canvas size to match display size
      this.canvas.width = displayWidth;
      this.canvas.height = displayHeight;
      
      // Update offscreen canvas
      this.offscreenCanvas.width = displayWidth;
      this.offscreenCanvas.height = displayHeight;
      
      // Clear image data cache
      this.imageData = null;
      
      // Redraw
      this.render(performance.now());
    }
  }
  
  /**
   * Set renderer options
   * @param {Object} options - New options to apply
   */
  setOptions(options) {
    // Update options
    this.options = {
      ...this.options,
      ...options
    };
    
    // Convert array colors to strings if needed
    if (options.background) {
      if (Array.isArray(options.background)) {
        options.background = CanvasColors.backgroundToString(options.background);
      }
    }
    
    if (options.highlightColor && Array.isArray(options.highlightColor)) {
      options.highlightColor = CanvasColors.rgbaArrayToString(options.highlightColor);
    }
    
    if (options.comparingColor && Array.isArray(options.comparingColor)) {
      options.comparingColor = CanvasColors.rgbaArrayToString(options.comparingColor);
    }
    
    if (options.sortedColor && Array.isArray(options.sortedColor)) {
      options.sortedColor = CanvasColors.rgbaArrayToString(options.sortedColor);
    }
    
    if (options.readColor && Array.isArray(options.readColor)) {
      options.readColor = CanvasColors.rgbaArrayToString(options.readColor);
    }
    
    if (options.writeColor && Array.isArray(options.writeColor)) {
      options.writeColor = CanvasColors.rgbaArrayToString(options.writeColor);
    }
    
    // Redraw if needed
    if (options.colorScheme || 
        options.barWidth || 
        options.spacing || 
        options.background ||
        options.highlightColor ||
        options.comparingColor ||
        options.sortedColor ||
        options.readColor ||
        options.writeColor) {
      this.render(performance.now());
    }
  }
  
  /**
   * Clean up resources
   */
  dispose() {
    // Clear references
    this.data = [];
    this.originalData = [];
    this.positions = [];
    this.targetPositions = [];
    
    // Clear image data
    this.imageData = null;
    this.offscreenCanvas = null;
    this.offscreenCtx = null;
    
    // Clear render state
    this.highlights = new Set();
    this.comparing = new Set();
    this.sortedIndices = new Set();
    this.readIndices = new Set();
    this.writeIndices = new Set();
  }
  
  /**
   * Get current performance metrics
   * @returns {Object} Performance metrics object
   */
  getMetrics() {
    return { ...this.metrics };
  }
  
  /**
   * Reset the visualization to original data
   */
  reset() {
    this.data = [...this.originalData];
    this.highlights = new Set();
    this.comparing = new Set();
    this.sortedIndices = new Set();
    this.readIndices = new Set();
    this.writeIndices = new Set();
    this.positions = this.data.map((_, i) => i);
    this.targetPositions = [...this.positions];
    this.render(performance.now());
  }
  
  /**
   * Linear interpolation between two values
   * @param {number} a - Start value
   * @param {number} b - End value
   * @param {number} t - Interpolation factor (0-1)
   * @returns {number} Interpolated value
   * @private
   */
  lerp(a, b, t) {
    return a + (b - a) * t;
  }
  
  /**
   * Get an image of the current visualization state
   * @returns {string} Data URL of the image
   */
  getImageData() {
    return this.canvas.toDataURL('image/png');
  }
  
  /**
   * Toggle animation amplitude
   * @param {number} amplitude - Animation amplitude (0-1)
   */
  setAmplitude(amplitude) {
    this.options.amplitude = Math.max(0, Math.min(1, amplitude));
    if (!this.isAnimating) {
      this.render(performance.now());
    }
  }
  
  /**
   * Set visual effect mode
   * @param {number} mode - Effect mode (0: none, 1: basic, 2: enhanced)
   */
  setEffectMode(mode) {
    this.options.effectMode = mode;
    if (!this.isAnimating) {
      this.render(performance.now());
    }
  }
}

export { ArrayRenderer };
