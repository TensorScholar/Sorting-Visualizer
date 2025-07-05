// src/visualization/components/distribution-visualizer.js

/**
 * @file Distribution Sort Visualizer Component
 * @author Algorithm Visualization Platform Team
 * @version 1.0.0
 * 
 * @description
 * A specialized visualization component for distribution-based sorting algorithms
 * (Counting Sort, Radix Sort, Bucket Sort, Pigeonhole Sort).
 * 
 * This component provides visualizations specific to the unique characteristics
 * of distribution sorts, including:
 * 1. Auxiliary data structures visualization (count arrays, buckets, digit groups)
 * 2. Distribution and collection phase animations
 * 3. Digit-by-digit processing for radix sorts
 * 4. Distribution range visualization
 * 
 * The implementation follows principles of information visualization theory,
 * focusing on clear representation of algorithm-specific operations while
 * maintaining a cohesive and intuitive visual language.
 */

import React, { useRef, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { WebGLRenderer } from '../renderers/webgl-renderer';

/**
 * Color schemes specifically optimized for distribution algorithm visualization
 * @constant
 * @type {Object}
 * @private
 */
const DISTRIBUTION_COLOR_SCHEMES = {
  // Color scheme for buckets - perceptually distinct colors
  BUCKETS: [
    '#4285F4', // Blue
    '#EA4335', // Red
    '#FBBC05', // Yellow
    '#34A853', // Green
    '#8B43EE', // Purple
    '#F57C00', // Orange
    '#0097A7', // Teal
    '#757575', // Gray
    '#9C27B0', // Magenta
    '#3949AB', // Indigo
    '#039BE5', // Light Blue
    '#7CB342', // Light Green
    '#C2185B', // Pink
    '#FF5722', // Deep Orange
    '#00BCD4', // Cyan
    '#FFA000', // Amber
  ],
  
  // Scientifically designed color scheme for count arrays - sequential blue
  COUNTS: [
    '#E3F2FD', '#BBDEFB', '#90CAF9', '#64B5F6', 
    '#42A5F5', '#2196F3', '#1E88E5', '#1976D2', 
    '#1565C0', '#0D47A1'
  ],
  
  // Color scheme for digit positions in radix sort - categorical
  DIGITS: [
    '#C8E6C9', // Light Green
    '#B3E5FC', // Light Blue
    '#FFCCBC', // Light Orange
    '#D1C4E9', // Light Purple
    '#F8BBD0', // Light Pink
  ],
  
  // Grayscale for the original array visualization
  GRAYSCALE: ['#F5F5F5', '#E0E0E0', '#BDBDBD', '#9E9E9E', '#757575', '#616161', '#424242', '#212121'],
};

/**
 * Utility functions for distribution algorithm visualization
 * @namespace
 * @private
 */
const DistributionVisualizationUtils = {
  /**
   * Get a color for a bucket index using a consistent mapping
   * @param {number} index - Bucket index
   * @param {number} total - Total number of buckets
   * @returns {string} Color in hex format
   */
  getBucketColor(index, total) {
    const colors = DISTRIBUTION_COLOR_SCHEMES.BUCKETS;
    // Use modulo to handle more buckets than colors
    return colors[index % colors.length];
  },
  
  /**
   * Get a color for a count value
   * @param {number} count - Count value
   * @param {number} maxCount - Maximum count for normalization
   * @returns {string} Color in hex format
   */
  getCountColor(count, maxCount) {
    const normalizedValue = Math.min(Math.max(count / maxCount, 0), 1);
    const index = Math.floor(normalizedValue * (DISTRIBUTION_COLOR_SCHEMES.COUNTS.length - 1));
    return DISTRIBUTION_COLOR_SCHEMES.COUNTS[index];
  },
  
  /**
   * Get a color for a digit position in radix sort
   * @param {number} position - Digit position
   * @returns {string} Color in hex format
   */
  getDigitPositionColor(position) {
    const colors = DISTRIBUTION_COLOR_SCHEMES.DIGITS;
    return colors[position % colors.length];
  },
  
  /**
   * Convert a hex color to RGBA
   * @param {string} hex - Hex color string
   * @param {number} alpha - Alpha value
   * @returns {Array<number>} RGBA array [r, g, b, a] with values in 0-1 range
   */
  hexToRgba(hex, alpha = 1) {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    return [r, g, b, alpha];
  },
  
  /**
   * Generate bucket labels based on range and count
   * @param {number} min - Minimum value in range
   * @param {number} max - Maximum value in range
   * @param {number} count - Number of buckets
   * @returns {Array<string>} Array of bucket labels
   */
  generateBucketLabels(min, max, count) {
    const range = max - min;
    const step = range / count;
    
    return Array.from({ length: count }, (_, i) => {
      const lowerBound = min + i * step;
      const upperBound = min + (i + 1) * step;
      return `${Math.floor(lowerBound)}–${Math.ceil(upperBound) - 1}`;
    });
  },
  
  /**
   * Create a distribution mapping function for a specific algorithm
   * @param {string} algorithm - Algorithm type ('counting', 'radix', 'bucket', 'pigeonhole')
   * @param {Object} options - Algorithm-specific options
   * @returns {Function} Mapping function from value to bucket index
   */
  createDistributionMapper(algorithm, options) {
    const { min = 0, max = 100, bucketCount = 10, digitPosition = 0, radix = 10 } = options;
    
    switch (algorithm) {
      case 'counting':
      case 'pigeonhole':
        // Direct mapping based on value
        return (value) => value - min;
        
      case 'bucket':
        // Map to bucket based on range subdivision
        const range = max - min;
        return (value) => Math.min(bucketCount - 1, Math.floor(((value - min) / range) * bucketCount));
        
      case 'radix':
        // Map based on digit at specified position
        return (value) => {
          // Extract the digit at the specified position
          const positiveValue = Math.abs(value);
          let digit;
          
          if (digitPosition === 0) {
            // Least significant digit
            digit = positiveValue % radix;
          } else {
            // Higher position digits
            digit = Math.floor(positiveValue / Math.pow(radix, digitPosition)) % radix;
          }
          
          return digit;
        };
        
      default:
        // Default identity mapping
        return (value) => value;
    }
  }
};

/**
 * DistributionVisualizer Component
 * 
 * A specialized React component for visualizing distribution-based sorting algorithms.
 * Renders both the array being sorted and the auxiliary data structures used in the sorting process.
 * 
 * @component
 */
const DistributionVisualizer = ({
  // Algorithm data
  algorithm,
  data,
  auxiliaryData,
  step,
  
  // Canvas dimensions
  width = 800,
  height = 500,
  
  // Visualization options
  options = {}
}) => {
  // Merge default options
  const visualizationOptions = {
    barWidth: 4,
    spacing: 1,
    bucketSpacing: 20,
    bucketLabelHeight: 20,
    countBarWidth: 30,
    countBarSpacing: 5,
    animationDuration: 300,
    showLabels: true,
    colorScheme: 'spectrum',
    backgroundColor: [0.1, 0.1, 0.15, 1.0],
    ...options
  };
  
  // Canvas references
  const mainCanvasRef = useRef(null);
  const auxiliaryCanvasRef = useRef(null);
  
  // State for rendering
  const [mainRenderer, setMainRenderer] = useState(null);
  const [auxRenderer, setAuxRenderer] = useState(null);
  const [animatedData, setAnimatedData] = useState([]);
  const [bucketData, setBucketData] = useState([]);
  const [countData, setCountData] = useState([]);
  const [currentDigit, setCurrentDigit] = useState(0);
  
  // Determine algorithm-specific properties
  const isRadixSort = algorithm === 'radix-sort';
  const isCountingSort = algorithm === 'counting-sort' || algorithm === 'pigeonhole-sort';
  const isBucketSort = algorithm === 'bucket-sort';
  
  // Initialize renderers on mount
  useEffect(() => {
    // Initialize main array renderer
    if (mainCanvasRef.current) {
      const renderer = new WebGLRenderer(mainCanvasRef.current, {
        barWidth: visualizationOptions.barWidth,
        spacing: visualizationOptions.spacing,
        colorScheme: visualizationOptions.colorScheme,
        background: visualizationOptions.backgroundColor,
        animationDuration: visualizationOptions.animationDuration
      });
      
      setMainRenderer(renderer);
      
      if (data && data.length > 0) {
        renderer.setData(data);
      }
    }
    
    // Initialize auxiliary visualization renderer
    if (auxiliaryCanvasRef.current) {
      // For auxiliary structures, we use a 2D canvas for more flexibility
      const canvas = auxiliaryCanvasRef.current;
      const ctx = canvas.getContext('2d');
      
      // Store the context in a renderer-like object for consistency
      setAuxRenderer({ ctx, canvas });
    }
    
    // Cleanup function
    return () => {
      if (mainRenderer) {
        mainRenderer.dispose();
      }
    };
  }, []);
  
  // Update data when it changes
  useEffect(() => {
    if (mainRenderer && data && data.length > 0) {
      mainRenderer.setData(data);
      setAnimatedData([...data]);
    }
  }, [data]);
  
  // Update auxiliary data visualization when it changes
  useEffect(() => {
    if (!auxiliaryData) return;
    
    if (isCountingSort && auxiliaryData.counts) {
      setCountData(auxiliaryData.counts);
    } else if (isBucketSort && auxiliaryData.buckets) {
      setBucketData(auxiliaryData.buckets);
    } else if (isRadixSort) {
      if (auxiliaryData.currentDigit !== undefined) {
        setCurrentDigit(auxiliaryData.currentDigit);
      }
      if (auxiliaryData.buckets) {
        setBucketData(auxiliaryData.buckets);
      }
    }
    
    // Render the auxiliary data
    renderAuxiliaryData();
  }, [auxiliaryData, auxRenderer]);
  
  // Update visualization based on the current step
  useEffect(() => {
    if (!step || !mainRenderer) return;
    
    // Apply step-specific visualization
    if (step.type === 'distribution') {
      // Highlight elements being distributed
      mainRenderer.highlight(step.indices || []);
      
      // Update bucket or count visualization
      renderAuxiliaryData();
    } else if (step.type === 'collection') {
      // Highlight elements being collected back
      mainRenderer.highlight(step.indices || []);
      
      // Update main array with collected elements
      if (step.array) {
        mainRenderer.setData(step.array, false);
      }
    } else if (step.type === 'counting') {
      // Highlight the element being counted
      mainRenderer.highlight([step.index]);
      
      // Highlight the corresponding count
      renderAuxiliaryData(step.countIndex);
    } else if (step.type === 'digit-extraction') {
      // For radix sort, highlight the element and its current digit
      mainRenderer.highlight([step.index]);
      setCurrentDigit(step.digitPosition);
    }
  }, [step, mainRenderer]);
  
  /**
   * Render auxiliary data structures (buckets, counts, etc.)
   * @param {number} [highlightIndex] - Optional index to highlight
   */
  const renderAuxiliaryData = (highlightIndex) => {
    if (!auxRenderer || !auxRenderer.ctx) return;
    
    const { ctx, canvas } = auxRenderer;
    const width = canvas.width;
    const height = canvas.height;
    
    // Clear the canvas
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = 'rgb(24, 24, 36)'; // Dark background
    ctx.fillRect(0, 0, width, height);
    
    // Render based on algorithm type
    if (isCountingSort && countData && countData.length > 0) {
      renderCountArray(ctx, countData, width, height, highlightIndex);
    } else if ((isBucketSort || isRadixSort) && bucketData && bucketData.length > 0) {
      renderBuckets(ctx, bucketData, width, height, highlightIndex);
    }
  };
  
  /**
   * Render the count array for Counting Sort or Pigeonhole Sort
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {Array<number>} counts - Count array
   * @param {number} width - Canvas width
   * @param {number} height - Canvas height
   * @param {number} [highlightIndex] - Optional index to highlight
   * @private
   */
  const renderCountArray = (ctx, counts, width, height, highlightIndex) => {
    const { countBarWidth, countBarSpacing, showLabels } = visualizationOptions;
    
    // Calculate dimensions
    const maxCount = Math.max(...counts, 1);
    const totalBars = counts.length;
    const availableWidth = width - 40; // Padding
    const barWidth = Math.min(countBarWidth, availableWidth / totalBars - countBarSpacing);
    const startX = (width - (barWidth + countBarSpacing) * totalBars) / 2;
    const maxBarHeight = height - 60; // Leave room for labels
    
    // Title
    ctx.fillStyle = 'white';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Count Array', width / 2, 25);
    
    // Draw count bars
    counts.forEach((count, i) => {
      const x = startX + i * (barWidth + countBarSpacing);
      const barHeight = (count / maxCount) * maxBarHeight;
      const y = height - 30 - barHeight; // Bottom-aligned
      
      // Determine color
      let fillColor = DistributionVisualizationUtils.getCountColor(count, maxCount);
      
      // Highlight specific count if requested
      if (highlightIndex !== undefined && i === highlightIndex) {
        fillColor = '#FFEB3B'; // Yellow highlight
        
        // Draw highlight effect
        ctx.fillStyle = 'rgba(255, 235, 59, 0.3)';
        ctx.fillRect(x - 5, y - 5, barWidth + 10, barHeight + 10);
      }
      
      // Draw bar
      ctx.fillStyle = fillColor;
      ctx.fillRect(x, y, barWidth, barHeight);
      
      // Draw border
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y, barWidth, barHeight);
      
      // Draw count value
      ctx.fillStyle = 'black';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(count.toString(), x + barWidth / 2, y - 5);
      
      // Draw index labels
      if (showLabels) {
        ctx.fillStyle = 'white';
        ctx.fillText(i.toString(), x + barWidth / 2, height - 10);
      }
    });
  };
  
  /**
   * Render buckets for Bucket Sort or Radix Sort
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {Array<Array>} buckets - Array of bucket contents
   * @param {number} width - Canvas width
   * @param {number} height - Canvas height
   * @param {number} [highlightIndex] - Optional bucket index to highlight
   * @private
   */
  const renderBuckets = (ctx, buckets, width, height, highlightIndex) => {
    const { barWidth, spacing, bucketSpacing, bucketLabelHeight, showLabels } = visualizationOptions;
    
    // Calculate dimensions
    const totalBuckets = buckets.length;
    const maxBucketSize = Math.max(...buckets.map(bucket => bucket.length), 1);
    const availableWidth = width - 40; // Padding
    const bucketWidth = availableWidth / totalBuckets - bucketSpacing;
    
    // Calculate maximum bar height
    const maxBarHeight = (height - 60 - bucketLabelHeight) / maxBucketSize;
    const effectiveBarHeight = Math.min(25, maxBarHeight);
    
    // Title
    ctx.fillStyle = 'white';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    
    const title = isRadixSort 
      ? `Radix Sort - Digit Position: ${currentDigit}` 
      : 'Bucket Distribution';
    ctx.fillText(title, width / 2, 25);
    
    // Draw buckets
    buckets.forEach((bucket, bucketIndex) => {
      const bucketX = 20 + bucketIndex * (bucketWidth + bucketSpacing);
      const bucketY = 40;
      const bucketHeight = height - bucketY - 20;
      
      // Determine bucket color
      const bucketColor = DistributionVisualizationUtils.getBucketColor(bucketIndex, totalBuckets);
      
      // Highlight specific bucket if requested
      if (highlightIndex !== undefined && bucketIndex === highlightIndex) {
        // Draw highlight effect around bucket
        ctx.fillStyle = 'rgba(255, 235, 59, 0.2)';
        ctx.fillRect(bucketX - 5, bucketY - 5, bucketWidth + 10, bucketHeight + 10);
      }
      
      // Draw bucket container
      ctx.fillStyle = 'rgba(30, 30, 45, 0.8)';
      ctx.fillRect(bucketX, bucketY, bucketWidth, bucketHeight);
      
      // Draw bucket border
      ctx.strokeStyle = bucketColor;
      ctx.lineWidth = 2;
      ctx.strokeRect(bucketX, bucketY, bucketWidth, bucketHeight);
      
      // Draw bucket label
      if (showLabels) {
        ctx.fillStyle = bucketColor;
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        
        let label;
        if (isRadixSort) {
          label = `Digit: ${bucketIndex}`;
        } else {
          label = `Bucket ${bucketIndex}`;
        }
        
        ctx.fillText(label, bucketX + bucketWidth / 2, bucketY + 20);
      }
      
      // Draw bucket elements
      bucket.forEach((value, elementIndex) => {
        const elementY = bucketY + 30 + elementIndex * (effectiveBarHeight + 2);
        const elementHeight = effectiveBarHeight;
        
        // Draw element bar
        ctx.fillStyle = bucketColor;
        ctx.fillRect(bucketX + 10, elementY, bucketWidth - 20, elementHeight);
        
        // Draw element value
        ctx.fillStyle = 'white';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(value.toString(), bucketX + bucketWidth / 2, elementY + elementHeight / 2 + 4);
      });
      
      // Draw bucket size
      ctx.fillStyle = 'white';
      ctx.font = '12px Arial';
      ctx.textAlign = 'right';
      ctx.fillText(`Size: ${bucket.length}`, bucketX + bucketWidth - 10, bucketY + bucketHeight - 10);
    });
  };
  
  return (
    <div className="distribution-visualizer" style={{ width, height: height + 50 }}>
      <div className="visualization-container" style={{ display: 'flex', flexDirection: 'column' }}>
        <div className="main-array-container" style={{ marginBottom: '20px' }}>
          <h3 className="visualization-title" style={{ margin: '0 0 10px 0', fontSize: '16px' }}>
            Main Array
          </h3>
          <canvas
            ref={mainCanvasRef}
            width={width}
            height={height / 2 - 30}
            className="main-canvas"
            style={{ border: '1px solid #2d3748', borderRadius: '4px' }}
          />
        </div>
        
        <div className="auxiliary-container">
          <h3 className="visualization-title" style={{ margin: '0 0 10px 0', fontSize: '16px' }}>
            {isCountingSort 
              ? 'Count Array' 
              : isRadixSort 
                ? `Digit Buckets (Position: ${currentDigit})` 
                : 'Buckets'}
          </h3>
          <canvas
            ref={auxiliaryCanvasRef}
            width={width}
            height={height / 2 - 30}
            className="auxiliary-canvas"
            style={{ border: '1px solid #2d3748', borderRadius: '4px' }}
          />
        </div>
      </div>
      
      {step && (
        <div className="step-description" style={{ 
          padding: '10px', 
          background: '#f8fafc', 
          borderRadius: '4px',
          marginTop: '10px',
          fontSize: '14px'
        }}>
          <strong>Current Operation:</strong> {step.message || 'No description available'}
        </div>
      )}
    </div>
  );
};

// PropTypes for documentation and runtime type checking
DistributionVisualizer.propTypes = {
  /** The distribution algorithm being visualized ('counting-sort', 'radix-sort', 'bucket-sort', 'pigeonhole-sort') */
  algorithm: PropTypes.string.isRequired,
  
  /** The current array data being sorted */
  data: PropTypes.arrayOf(PropTypes.number).isRequired,
  
  /** Auxiliary data structures used by the algorithm */
  auxiliaryData: PropTypes.shape({
    /** Count array for counting sort */
    counts: PropTypes.arrayOf(PropTypes.number),
    
    /** Buckets for bucket sort or radix sort */
    buckets: PropTypes.arrayOf(PropTypes.array),
    
    /** Current digit position for radix sort */
    currentDigit: PropTypes.number,
    
    /** Range information */
    min: PropTypes.number,
    max: PropTypes.number
  }),
  
  /** Current algorithm step information */
  step: PropTypes.shape({
    /** Type of operation ('distribution', 'collection', 'counting', 'digit-extraction') */
    type: PropTypes.string,
    
    /** Array indices involved in current operation */
    indices: PropTypes.arrayOf(PropTypes.number),
    
    /** Description message */
    message: PropTypes.string,
    
    /** Current array state if applicable */
    array: PropTypes.arrayOf(PropTypes.number),
    
    /** Index being processed */
    index: PropTypes.number,
    
    /** Count array index if applicable */
    countIndex: PropTypes.number,
    
    /** Digit position for radix sort */
    digitPosition: PropTypes.number
  }),
  
  /** Canvas width in pixels */
  width: PropTypes.number,
  
  /** Canvas height in pixels */
  height: PropTypes.number,
  
  /** Visualization options */
  options: PropTypes.object
};

export default DistributionVisualizer;
