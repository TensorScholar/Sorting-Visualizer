// src/visualization/effects/color-schemes.js

/**
 * @file Advanced color scheme system for algorithm visualization
 * @module visualization/effects/color-schemes
 * @author Algorithm Visualization Platform Team
 * @version 2.0.0
 * 
 * @description
 * A comprehensive color scheme system that provides perceptually optimized
 * visualizations for algorithm operations. This implementation leverages
 * principles from color theory, perception research, and information
 * visualization to create maximally informative and accessible representations.
 * 
 * The system includes:
 * - Sequential schemes for ordered data with perceptual uniformity
 * - Diverging schemes for highlighting differences from a central value
 * - Categorical schemes for distinct algorithm operations
 * - Specialized schemes for algorithm-specific visualizations
 * - Accessibility considerations for color vision deficiencies
 * 
 * Reference materials:
 * - Color Universal Design (CUD): https://jfly.uni-koeln.de/color/
 * - ColorBrewer: https://colorbrewer2.org/
 * - Perceptually Uniform Color Maps: https://www.kennethmoreland.com/color-maps/
 */

/**
 * @typedef {Object} ColorDefinition
 * @property {function(number): Array<number>} colorFn - Function that maps a value in range [0,1] to RGBA
 * @property {boolean} [isPerceptuallyUniform=false] - Whether the scheme is perceptually uniform
 * @property {boolean} [isCVDFriendly=false] - Whether the scheme is color vision deficiency (CVD) friendly
 * @property {string} description - Description of the color scheme
 * @property {string} category - Category of the color scheme (sequential, diverging, categorical)
 * @property {Array<number>} [domain=[0,1]] - Value domain for the scheme
 * @property {Object} [metadata] - Additional information about the scheme
 */

/**
 * Utility functions for color manipulation and conversion
 * @namespace ColorUtils
 * @private
 */
const ColorUtils = {
  /**
   * Converts HSL color to RGB color
   * @param {number} h - Hue (0-1)
   * @param {number} s - Saturation (0-1)
   * @param {number} l - Lightness (0-1)
   * @returns {Array<number>} RGB values in range [0,1]
   */
  hslToRgb(h, s, l) {
    let r, g, b;

    if (s === 0) {
      r = g = b = l; // Achromatic
    } else {
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = this.hueToRgb(p, q, h + 1/3);
      g = this.hueToRgb(p, q, h);
      b = this.hueToRgb(p, q, h - 1/3);
    }

    return [r, g, b];
  },

  /**
   * Helper function for HSL to RGB conversion
   * @param {number} p
   * @param {number} q
   * @param {number} t
   * @returns {number}
   * @private
   */
  hueToRgb(p, q, t) {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1/6) return p + (q - p) * 6 * t;
    if (t < 1/2) return q;
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
    return p;
  },

  /**
   * Converts RGB color to HSL color
   * @param {number} r - Red (0-1)
   * @param {number} g - Green (0-1)
   * @param {number} b - Blue (0-1)
   * @returns {Array<number>} HSL values in range [0,1]
   */
  rgbToHsl(r, g, b) {
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max === min) {
      h = s = 0; // Achromatic
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }

    return [h, s, l];
  },

  /**
   * Interpolates between two colors in RGBA space
   * @param {Array<number>} color1 - First color (RGBA)
   * @param {Array<number>} color2 - Second color (RGBA)
   * @param {number} t - Interpolation factor (0-1)
   * @returns {Array<number>} Interpolated color (RGBA)
   */
  interpolateRgba(color1, color2, t) {
    return [
      color1[0] + (color2[0] - color1[0]) * t,
      color1[1] + (color2[1] - color1[1]) * t,
      color1[2] + (color2[2] - color1[2]) * t,
      color1[3] + (color2[3] - color1[3]) * t
    ];
  },

  /**
   * Interpolates between two colors in HSL space (better for perceptual interpolation)
   * @param {Array<number>} color1 - First color (RGB)
   * @param {Array<number>} color2 - Second color (RGB)
   * @param {number} t - Interpolation factor (0-1)
   * @returns {Array<number>} Interpolated color (RGB)
   */
  interpolateHsl(color1, color2, t) {
    const hsl1 = this.rgbToHsl(color1[0], color1[1], color1[2]);
    const hsl2 = this.rgbToHsl(color2[0], color2[1], color2[2]);
    
    // Use shortest path for hue interpolation
    let h;
    const dh = hsl2[0] - hsl1[0];
    if (Math.abs(dh) > 0.5) {
      // Go the other way around the color wheel
      if (hsl2[0] > hsl1[0]) {
        h = (hsl1[0] + 1) * (1 - t) + hsl2[0] * t;
        h = h % 1;
      } else {
        h = hsl1[0] * (1 - t) + (hsl2[0] + 1) * t;
        h = h % 1;
      }
    } else {
      // Normal interpolation
      h = hsl1[0] * (1 - t) + hsl2[0] * t;
    }
    
    const s = hsl1[1] * (1 - t) + hsl2[1] * t;
    const l = hsl1[2] * (1 - t) + hsl2[2] * t;
    
    const rgb = this.hslToRgb(h, s, l);
    // Add alpha interpolation
    const a = color1[3] * (1 - t) + color2[3] * t;
    return [...rgb, a];
  },

  /**
   * Creates a multi-stop color interpolator
   * @param {Array<Array<number>>} colors - Array of colors (RGBA)
   * @param {Array<number>} stops - Array of stop positions (0-1)
   * @returns {function(number): Array<number>} Interpolation function
   */
  createMultiInterpolator(colors, stops) {
    if (colors.length !== stops.length) {
      throw new Error('Number of colors must match number of stops');
    }
    
    return (t) => {
      // Clamp t to range [0,1]
      t = Math.max(0, Math.min(1, t));
      
      // Find the segment containing t
      let segment = 0;
      while (segment < stops.length - 1 && t > stops[segment + 1]) {
        segment++;
      }
      
      // If we're at the end, return the last color
      if (segment === stops.length - 1) {
        return colors[segment];
      }
      
      // Calculate interpolation factor within this segment
      const segmentT = (t - stops[segment]) / (stops[segment + 1] - stops[segment]);
      
      // Interpolate between the two colors in this segment
      return this.interpolateHsl(colors[segment], colors[segment + 1], segmentT);
    };
  },

  /**
   * Applies a gamma correction to a color
   * @param {Array<number>} color - RGB or RGBA color
   * @param {number} gamma - Gamma value
   * @returns {Array<number>} Gamma-corrected color
   */
  applyGamma(color, gamma) {
    const result = color.slice(0, 3).map(c => Math.pow(c, gamma));
    return color.length > 3 ? [...result, color[3]] : result;
  },

  /**
   * Adjusts a color to be safe for color vision deficiencies
   * @param {Array<number>} color - RGB or RGBA color
   * @param {string} type - Type of CVD ('protanopia', 'deuteranopia', 'tritanopia')
   * @returns {Array<number>} Adjusted color
   */
  adjustForCVD(color, type = 'deuteranopia') {
    // Simplified simulation matrices for common color vision deficiencies
    const matrices = {
      protanopia: [
        [0.567, 0.433, 0.000],
        [0.558, 0.442, 0.000],
        [0.000, 0.242, 0.758]
      ],
      deuteranopia: [
        [0.625, 0.375, 0.000],
        [0.700, 0.300, 0.000],
        [0.000, 0.300, 0.700]
      ],
      tritanopia: [
        [0.950, 0.050, 0.000],
        [0.000, 0.433, 0.567],
        [0.000, 0.475, 0.525]
      ]
    };
    
    if (!matrices[type]) {
      return color; // Unknown type
    }
    
    const matrix = matrices[type];
    const rgb = color.slice(0, 3);
    
    // Apply transformation matrix
    const adjusted = [
      matrix[0][0] * rgb[0] + matrix[0][1] * rgb[1] + matrix[0][2] * rgb[2],
      matrix[1][0] * rgb[0] + matrix[1][1] * rgb[1] + matrix[1][2] * rgb[2],
      matrix[2][0] * rgb[0] + matrix[2][1] * rgb[1] + matrix[2][2] * rgb[2]
    ];
    
    return color.length > 3 ? [...adjusted, color[3]] : adjusted;
  }
};

/**
 * Perceptually uniform sequential color schemes
 * @namespace SequentialSchemes
 * @private
 */
const SequentialSchemes = {
  /**
   * Viridis colormap (perceptually uniform)
   * Adapted from the matplotlib viridis colormap
   * @param {number} t - Value in range [0,1]
   * @returns {Array<number>} RGBA color
   */
  viridis: (t) => {
    // Approximation of the viridis colormap
    const x = Math.max(0, Math.min(1, t));
    return [
      Math.max(0, Math.min(1, (0.0 + 4.5 * x - 5.5 * x * x + 1.25 * x * x * x))),
      Math.max(0, Math.min(1, (0.0 + 0.9 * x + 1.1 * x * x - 1.5 * x * x * x))),
      Math.max(0, Math.min(1, (0.3 + 0.4 * x - 1.2 * x * x + 0.6 * x * x * x))),
      1.0
    ];
  },

  /**
   * Plasma colormap (perceptually uniform)
   * @param {number} t - Value in range [0,1]
   * @returns {Array<number>} RGBA color
   */
  plasma: (t) => {
    // Approximation of the plasma colormap
    const x = Math.max(0, Math.min(1, t));
    return [
      Math.max(0, Math.min(1, (0.05 + 3.0 * x - 2.0 * x * x))),
      Math.max(0, Math.min(1, (0.0 + 1.3 * x - 1.5 * x * x + 0.5 * x * x * x))),
      Math.max(0, Math.min(1, (0.5 + 0.8 * x - 1.5 * x * x + 0.4 * x * x * x))),
      1.0
    ];
  },

  /**
   * Inferno colormap (perceptually uniform)
   * @param {number} t - Value in range [0,1]
   * @returns {Array<number>} RGBA color
   */
  inferno: (t) => {
    // Approximation of the inferno colormap
    const x = Math.max(0, Math.min(1, t));
    return [
      Math.max(0, Math.min(1, (0.0 + 5.0 * x - 7.5 * x * x + 3.0 * x * x * x))),
      Math.max(0, Math.min(1, (0.0 + 0.7 * x - 1.5 * x * x + 0.9 * x * x * x))),
      Math.max(0, Math.min(1, (0.0 + 0.5 * x - 1.0 * x * x + 0.5 * x * x * x))),
      1.0
    ];
  },

  /**
   * Magma colormap (perceptually uniform)
   * @param {number} t - Value in range [0,1]
   * @returns {Array<number>} RGBA color
   */
  magma: (t) => {
    // Approximation of the magma colormap
    const x = Math.max(0, Math.min(1, t));
    return [
      Math.max(0, Math.min(1, (0.0 + 4.0 * x - 5.0 * x * x + 2.0 * x * x * x))),
      Math.max(0, Math.min(1, (0.0 + 0.5 * x + 1.0 * x * x - 1.0 * x * x * x))),
      Math.max(0, Math.min(1, (0.0 + 0.7 * x - 0.3 * x * x - 0.2 * x * x * x))),
      1.0
    ];
  },

  /**
   * Blues colormap (perceptually improved)
   * @param {number} t - Value in range [0,1]
   * @returns {Array<number>} RGBA color
   */
  blues: (t) => {
    // Adaptive blue-scale colormap
    const x = Math.max(0, Math.min(1, t));
    return [
      Math.max(0, Math.min(1, 0.9 - 0.5 * x)),
      Math.max(0, Math.min(1, 0.9 - 0.2 * x)),
      Math.max(0, Math.min(1, 0.9 + 0.1 * x)),
      1.0
    ];
  },

  /**
   * Greens colormap (perceptually improved)
   * @param {number} t - Value in range [0,1]
   * @returns {Array<number>} RGBA color
   */
  greens: (t) => {
    // Adaptive green-scale colormap
    const x = Math.max(0, Math.min(1, t));
    return [
      Math.max(0, Math.min(1, 0.9 - 0.7 * x)),
      Math.max(0, Math.min(1, 0.9 - 0.1 * x)),
      Math.max(0, Math.min(1, 0.9 - 0.7 * x)),
      1.0
    ];
  }
};

/**
 * Diverging color schemes for highlighting differences
 * @namespace DivergingSchemes
 * @private
 */
const DivergingSchemes = {
  /**
   * Red-Blue diverging colormap (perceptually uniform)
   * @param {number} t - Value in range [0,1]
   * @returns {Array<number>} RGBA color
   */
  redBlue: (t) => {
    // Convert from [0,1] to [-1,1]
    const x = Math.max(0, Math.min(1, t)) * 2 - 1;
    
    // Positive values -> red, negative -> blue, 0 -> white
    if (x >= 0) {
      return [
        0.8 + 0.2 * x, // Red increases
        0.8 - 0.6 * x, // Green decreases
        0.8 - 0.8 * x, // Blue decreases
        1.0
      ];
    } else {
      return [
        0.8 - 0.8 * Math.abs(x), // Red decreases
        0.8 - 0.6 * Math.abs(x), // Green decreases
        0.8 + 0.2 * Math.abs(x), // Blue increases
        1.0
      ];
    }
  },

  /**
   * Brown-Teal diverging colormap (CVD-friendly)
   * @param {number} t - Value in range [0,1]
   * @returns {Array<number>} RGBA color
   */
  brownTeal: (t) => {
    // Convert from [0,1] to [-1,1]
    const x = Math.max(0, Math.min(1, t)) * 2 - 1;
    
    // Positive values -> brown, negative -> teal, 0 -> light gray
    if (x >= 0) {
      return [
        0.7 + 0.3 * x,      // Red increases
        0.7 - 0.5 * x,      // Green decreases
        0.7 - 0.6 * x,      // Blue decreases
        1.0
      ];
    } else {
      return [
        0.7 - 0.6 * Math.abs(x),  // Red decreases
        0.7 + 0.1 * Math.abs(x),  // Green increases slightly
        0.7 + 0.3 * Math.abs(x),  // Blue increases
        1.0
      ];
    }
  },

  /**
   * Purple-Green diverging colormap (perceptually uniform)
   * @param {number} t - Value in range [0,1]
   * @returns {Array<number>} RGBA color
   */
  purpleGreen: (t) => {
    // Convert from [0,1] to [-1,1]
    const x = Math.max(0, Math.min(1, t)) * 2 - 1;
    
    // Positive values -> purple, negative -> green, 0 -> light gray
    if (x >= 0) {
      return [
        0.7 + 0.3 * x,      // Red increases
        0.7 - 0.4 * x,      // Green decreases
        0.7 + 0.3 * x,      // Blue increases
        1.0
      ];
    } else {
      return [
        0.7 - 0.6 * Math.abs(x),  // Red decreases
        0.7 + 0.3 * Math.abs(x),  // Green increases
        0.7 - 0.5 * Math.abs(x),  // Blue decreases
        1.0
      ];
    }
  }
};

/**
 * Algorithmic-specific color schemes for visualization
 * @namespace AlgorithmicSchemes
 * @private
 */
const AlgorithmicSchemes = {
  /**
   * Spectral color scheme for general algorithm visualization
   * @param {number} t - Value in range [0,1]
   * @returns {Array<number>} RGBA color
   */
  spectrum: (t) => {
    // Sinusoidal spectrum for visually distinct colors
    return [
      Math.sin(t * Math.PI) * 0.5 + 0.5,
      Math.sin(t * Math.PI + Math.PI * 2/3) * 0.5 + 0.5,
      Math.sin(t * Math.PI + Math.PI * 4/3) * 0.5 + 0.5,
      1.0
    ];
  },

  /**
   * Heatmap for memory access visualization
   * @param {number} t - Value in range [0,1]
   * @returns {Array<number>} RGBA color
   */
  heatmap: (t) => {
    // Blue to red heatmap
    return [
      Math.min(1, t * 2),
      Math.max(0, Math.min(1, 1 - 2 * Math.abs(t - 0.5))),
      Math.max(0, 1 - t * 2),
      1.0
    ];
  },

  /**
   * Color scheme for heap structure visualization
   * @param {number} t - Value in range [0,1] (normalized level in heap)
   * @returns {Array<number>} RGBA color
   */
  heapLevels: (t) => {
    // Color transitions based on heap level
    return [
      0.2 + 0.4 * t,          // Red increases with depth
      0.7 - 0.4 * t,          // Green decreases with depth
      0.9 - 0.5 * t,          // Blue decreases with depth
      1.0
    ];
  },

  /**
   * Color scheme for partition visualization (QuickSort, etc.)
   * @param {number} t - Value in range [0,1]
   * @returns {Array<number>} RGBA color
   */
  partition: (t) => {
    // Three discrete regions with smooth transitions
    if (t < 0.33) {
      return [0.8, 0.3, 0.3, 1.0]; // Red for left partition
    } else if (t < 0.67) {
      return [0.8, 0.8, 0.3, 1.0]; // Yellow for middle/pivot
    } else {
      return [0.3, 0.3, 0.8, 1.0]; // Blue for right partition
    }
  },

  /**
   * Color scheme for distribution sort visualization
   * @param {number} t - Value in range [0,1]
   * @returns {Array<number>} RGBA color
   */
  distribution: (t) => {
    // Generate colors for buckets in distribution sorts
    return ColorUtils.hslToRgb(t, 0.7, 0.5).concat([1.0]);
  },

  /**
   * Color scheme for merge visualization
   * @param {number} t - Value in range [0,1]
   * @returns {Array<number>} RGBA color
   */
  merge: (t) => {
    // Two source arrays and the merged result
    if (t < 0.33) {
      return [0.3, 0.6, 0.9, 1.0]; // Blue for first array
    } else if (t < 0.67) {
      return [0.9, 0.6, 0.3, 1.0]; // Orange for second array
    } else {
      return [0.3, 0.9, 0.3, 1.0]; // Green for merged result
    }
  }
};

/**
 * Operation-specific highlight colors
 * @type {Object<string, Array<number>>}
 * @private
 */
const OperationColors = {
  // Base operations
  comparison: [1.0, 0.0, 0.0, 1.0],         // Red for comparisons
  swap: [1.0, 0.8, 0.0, 1.0],               // Amber for swaps
  read: [0.0, 0.5, 1.0, 1.0],               // Light blue for reads
  write: [1.0, 0.5, 0.0, 1.0],              // Orange for writes
  sorted: [0.0, 0.8, 0.0, 1.0],             // Green for sorted elements
  
  // Algorithm-specific operations
  pivot: [1.0, 0.0, 1.0, 1.0],              // Magenta for pivot elements
  merge: [0.5, 0.0, 0.5, 1.0],              // Purple for merge operations
  partition: [0.0, 0.8, 0.8, 1.0],          // Teal for partition boundaries
  heapify: [0.8, 0.4, 0.0, 1.0],            // Brown for heapify operations
  bucket: [0.5, 0.5, 0.0, 1.0],             // Olive for bucket operations
  
  // State indicators
  active: [1.0, 1.0, 1.0, 1.0],             // White for active elements
  inactive: [0.3, 0.3, 0.3, 1.0],           // Dark gray for inactive elements
  error: [0.8, 0.0, 0.0, 1.0]               // Bright red for errors
};

/**
 * @class ColorSchemes
 * @classdesc Advanced color scheme system for algorithm visualization
 */
class ColorSchemes {
  /**
   * All available color schemes
   * @type {Object<string, ColorDefinition>}
   * @static
   */
  static schemes = {
    // Sequential schemes
    viridis: {
      colorFn: SequentialSchemes.viridis,
      isPerceptuallyUniform: true,
      isCVDFriendly: true,
      description: "Perceptually uniform sequential colormap, excellent for representing continuous data",
      category: "sequential",
      metadata: { origin: "matplotlib", reference: "https://bids.github.io/colormap/" }
    },
    plasma: {
      colorFn: SequentialSchemes.plasma,
      isPerceptuallyUniform: true,
      isCVDFriendly: true,
      description: "Perceptually uniform sequential colormap with more saturated colors",
      category: "sequential",
      metadata: { origin: "matplotlib", reference: "https://bids.github.io/colormap/" }
    },
    inferno: {
      colorFn: SequentialSchemes.inferno,
      isPerceptuallyUniform: true,
      isCVDFriendly: true,
      description: "Perceptually uniform sequential colormap with high contrast",
      category: "sequential",
      metadata: { origin: "matplotlib", reference: "https://bids.github.io/colormap/" }
    },
    magma: {
      colorFn: SequentialSchemes.magma,
      isPerceptuallyUniform: true,
      isCVDFriendly: true,
      description: "Perceptually uniform sequential colormap with purple to yellow transition",
      category: "sequential",
      metadata: { origin: "matplotlib", reference: "https://bids.github.io/colormap/" }
    },
    blues: {
      colorFn: SequentialSchemes.blues,
      isPerceptuallyUniform: true,
      isCVDFriendly: true,
      description: "Blue-scale sequential colormap",
      category: "sequential"
    },
    greens: {
      colorFn: SequentialSchemes.greens,
      isPerceptuallyUniform: true,
      isCVDFriendly: true,
      description: "Green-scale sequential colormap",
      category: "sequential"
    },
    
    // Diverging schemes
    redBlue: {
      colorFn: DivergingSchemes.redBlue,
      isPerceptuallyUniform: true,
      isCVDFriendly: false,
      description: "Classic red-blue diverging colormap for highlighting positive/negative differences",
      category: "diverging"
    },
    brownTeal: {
      colorFn: DivergingSchemes.brownTeal,
      isPerceptuallyUniform: true,
      isCVDFriendly: true,
      description: "Color vision deficiency friendly diverging colormap",
      category: "diverging"
    },
    purpleGreen: {
      colorFn: DivergingSchemes.purpleGreen,
      isPerceptuallyUniform: true,
      isCVDFriendly: false,
      description: "Purple-green diverging colormap with good contrast",
      category: "diverging"
    },
    
    // Algorithmic-specific schemes
    spectrum: {
      colorFn: AlgorithmicSchemes.spectrum,
      isPerceptuallyUniform: false,
      isCVDFriendly: false,
      description: "Spectrum colormap for general algorithm visualization",
      category: "algorithmic"
    },
    heatmap: {
      colorFn: AlgorithmicSchemes.heatmap,
      isPerceptuallyUniform: false,
      isCVDFriendly: false,
      description: "Heatmap for visualizing access frequency",
      category: "algorithmic"
    },
    heapLevels: {
      colorFn: AlgorithmicSchemes.heapLevels,
      isPerceptuallyUniform: false,
      isCVDFriendly: true,
      description: "Color scheme for visualizing heap levels",
      category: "algorithmic"
    },
    partition: {
      colorFn: AlgorithmicSchemes.partition,
      isPerceptuallyUniform: false,
      isCVDFriendly: true,
      description: "Color scheme for visualizing partitioning in divide-and-conquer algorithms",
      category: "algorithmic"
    },
    distribution: {
      colorFn: AlgorithmicSchemes.distribution,
      isPerceptuallyUniform: false,
      isCVDFriendly: false,
      description: "Color scheme for visualizing distribution sorts",
      category: "algorithmic"
    },
    merge: {
      colorFn: AlgorithmicSchemes.merge,
      isPerceptuallyUniform: false,
      isCVDFriendly: true,
      description: "Color scheme for visualizing merge operations",
      category: "algorithmic"
    }
  };

  /**
   * Get a color from the specified scheme
   * @param {string} scheme - The name of the color scheme
   * @param {number} value - Normalized value (0-1)
   * @returns {Array<number>} RGBA color
   * @throws {Error} If scheme is not found
   * @static
   */
  static getColor(scheme, value) {
    if (!this.schemes[scheme]) {
      throw new Error(`Unknown color scheme: ${scheme}`);
    }
    
    return this.schemes[scheme].colorFn(Math.max(0, Math.min(1, value)));
  }

  /**
   * Get a color for a specific algorithm operation
   * @param {string} operation - The operation type
   * @returns {Array<number>} RGBA color
   * @static
   */
  static getOperationColor(operation) {
    return OperationColors[operation] || OperationColors.active;
  }

  /**
   * Create a custom color scheme from control points
   * @param {Array<Array<number>>} colors - Array of colors (RGBA)
   * @param {Array<number>} [stops] - Array of stop positions (0-1), defaults to evenly spaced
   * @returns {function(number): Array<number>} Color function
   * @static
   */
  static createCustomScheme(colors, stops) {
    if (!stops) {
      // Create evenly spaced stops
      stops = colors.map((_, i) => i / (colors.length - 1));
    }
    
    return ColorUtils.createMultiInterpolator(colors, stops);
  }

  /**
   * Get a color scheme adjusted for color vision deficiency
   * @param {string} scheme - The name of the color scheme
   * @param {string} cvdType - Type of CVD ('protanopia', 'deuteranopia', 'tritanopia')
   * @returns {function(number): Array<number>} Adjusted color function
   * @static
   */
  static getCVDFriendlyScheme(scheme, cvdType = 'deuteranopia') {
    if (!this.schemes[scheme]) {
      throw new Error(`Unknown color scheme: ${scheme}`);
    }
    
    const originalColorFn = this.schemes[scheme].colorFn;
    
    return (value) => {
      const color = originalColorFn(value);
      return ColorUtils.adjustForCVD(color, cvdType);
    };
  }

  /**
   * Get a list of available color schemes by category
   * @param {string} [category] - Optional category filter
   * @returns {Object<string, Object>} Dictionary of scheme names and metadata
   * @static
   */
  static getAvailableSchemes(category) {
    const result = {};
    
    for (const [name, scheme] of Object.entries(this.schemes)) {
      if (!category || scheme.category === category) {
        result[name] = {
          description: scheme.description,
          category: scheme.category,
          isPerceptuallyUniform: scheme.isPerceptuallyUniform,
          isCVDFriendly: scheme.isCVDFriendly,
          metadata: scheme.metadata
        };
      }
    }
    
    return result;
  }

  /**
   * Generate a palette of discrete colors from a scheme
   * @param {string} scheme - The name of the color scheme
   * @param {number} count - Number of colors to generate
   * @returns {Array<Array<number>>} Array of RGBA colors
   * @static
   */
  static generatePalette(scheme, count) {
    if (!this.schemes[scheme]) {
      throw new Error(`Unknown color scheme: ${scheme}`);
    }
    
    const colors = [];
    for (let i = 0; i < count; i++) {
      const t = count <= 1 ? 0.5 : i / (count - 1);
      colors.push(this.schemes[scheme].colorFn(t));
    }
    
    return colors;
  }

  /**
   * Convert an RGBA color array to a CSS color string
   * @param {Array<number>} color - RGBA color array
   * @returns {string} CSS color string
   * @static
   */
  static toCssColor(color) {
    if (color.length === 3) {
      const [r, g, b] = color.map(c => Math.round(c * 255));
      return `rgb(${r}, ${g}, ${b})`;
    } else {
      const [r, g, b, a] = color;
      const rgb = [r, g, b].map(c => Math.round(c * 255));
      return `rgba(${rgb.join(', ')}, ${a})`;
    }
  }

  /**
   * Get color utils for advanced manipulations
   * @returns {Object} Color utility functions
   * @static
   */
  static getUtils() {
    return { ...ColorUtils };
  }
}

export default ColorSchemes;
