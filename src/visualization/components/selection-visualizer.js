// src/visualization/components/selection-visualizer.js

/**
 * @file Selection Algorithm Visualizer Component
 * @author Algorithm Visualization Platform Team
 * @version 1.0.0
 * @license MIT
 * 
 * @description
 * Specialized visualization component for selection algorithms (QuickSelect, Median of Medians).
 * This component renders the key operations, state transitions, and recursive subproblems in
 * selection algorithms, with particular focus on visualizing:
 * 
 * 1. Partitioning operations and pivot selection
 * 2. Search space narrowing and target identification
 * 3. Recursive subproblems and their solutions
 * 4. Median-of-medians grouping and hierarchical median finding
 * 
 * The component leverages WebGL for high-performance rendering while adding specialized
 * overlays and visual elements to illuminate the conceptual model of selection algorithms.
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { WebGLRenderer } from '../renderers/webgl-renderer';
import PropTypes from 'prop-types';

/**
 * SVG path strings for custom elements
 * @constant
 * @private
 */
const SVG_PATHS = {
  targetMarker: 'M -6,-8 L 6,-8 L 0,0 Z',
  medianIndicator: 'M -8,0 L 8,0 M 0,-8 L 0,8',
  groupBracket: 'M 0,0 L 0,10 L $WIDTH,10 L $WIDTH,0'
};

/**
 * SelectionVisualizer component for visualizing selection algorithms
 * 
 * @component
 * @param {Object} props - Component properties
 * @param {Array} props.data - The data array being processed
 * @param {Object} props.algorithm - The selection algorithm instance
 * @param {Object} props.currentStep - Current algorithm step data
 * @param {number} props.targetIndex - The k-th element index being selected
 * @param {number} props.width - Canvas width
 * @param {number} props.height - Canvas height
 * @param {Object} props.rendererOptions - Options for the WebGL renderer
 * @param {Function} props.onStepChange - Callback when step changes
 * @returns {JSX.Element} React component
 */
const SelectionVisualizer = ({
  data = [],
  algorithm = null,
  currentStep = null,
  targetIndex = 0,
  width = 800,
  height = 400,
  rendererOptions = {},
  onStepChange = () => {}
}) => {
  // Canvas references
  const canvasRef = useRef(null);
  const overlayRef = useRef(null);
  
  // Renderer state
  const [renderer, setRenderer] = useState(null);
  
  // Algorithm state tracking
  const [partitionRange, setPartitionRange] = useState(null);
  const [pivotIndex, setPivotIndex] = useState(null);
  const [medianGroups, setMedianGroups] = useState([]);
  const [recursiveRanges, setRecursiveRanges] = useState([]);
  const [selectedElement, setSelectedElement] = useState(null);
  const [completedRanges, setCompletedRanges] = useState([]);
  
  // Track the overall context of the algorithm (which phase we're in)
  const [algorithmStage, setAlgorithmStage] = useState('initial');
  
  // Memoized selection-specific colors
  const colors = useMemo(() => ({
    targetIndicator: '#FF5722',
    pivotIndicator: '#FFC107',
    rangeHighlight: 'rgba(33, 150, 243, 0.2)',
    completedRange: 'rgba(76, 175, 80, 0.3)',
    groupBorder: '#9C27B0',
    medianIndicator: '#E91E63',
    textAnnotation: '#212121',
    secondaryText: '#757575'
  }), []);
  
  /**
   * Initialize WebGL renderer on mount
   */
  useEffect(() => {
    if (!canvasRef.current) return;
    
    try {
      const defaultOptions = {
        barWidth: 8,
        spacing: 2,
        colorScheme: 'viridis',
        background: [0.1, 0.1, 0.15, 1.0]
      };
      
      const newRenderer = new WebGLRenderer(canvasRef.current, {
        ...defaultOptions,
        ...rendererOptions
      });
      
      setRenderer(newRenderer);
      
      // Set initial data if available
      if (data.length > 0) {
        newRenderer.setData(data);
      }
      
      return () => {
        if (newRenderer) {
          newRenderer.dispose();
        }
      };
    } catch (error) {
      console.error('Failed to initialize WebGL renderer:', error);
    }
  }, []);
  
  /**
   * Update renderer when data changes
   */
  useEffect(() => {
    if (renderer && data.length > 0) {
      renderer.setData(data);
    }
  }, [data, renderer]);
  
  /**
   * Process current algorithm step and update visualization state
   */
  useEffect(() => {
    if (!currentStep || !renderer) return;
    
    // Extract step data and update visualization state
    const { type, array, section, pivot, groups, k, result } = currentStep;
    
    // Update array data to reflect current step (if provided)
    if (array) {
      renderer.setData(array, false);
    }
    
    // Update algorithm stage based on step type
    setAlgorithmStage(type);
    
    // Process step data based on type
    switch (type) {
      case 'partition_start':
        // Starting a new partition operation
        setPartitionRange(section);
        setPivotIndex(pivot);
        if (pivot !== null) {
          renderer.highlight([pivot]);
        }
        break;
        
      case 'partition_progress':
        // Ongoing partition operation
        setPartitionRange(section);
        if (currentStep.comparing) {
          renderer.markComparing(currentStep.comparing);
        }
        if (currentStep.swapped) {
          renderer.highlight(currentStep.swapped);
        }
        break;
        
      case 'partition_complete':
        // Completed partition operation
        setPartitionRange(section);
        setPivotIndex(pivot);
        // Highlight the pivot in its final position
        if (pivot !== null) {
          renderer.highlight([pivot]);
        }
        break;
        
      case 'median_grouping':
        // Median of medians grouping visualization
        setMedianGroups(groups || []);
        break;
        
      case 'median_selection':
        // Median selection within groups
        setMedianGroups(groups || []);
        if (currentStep.medians) {
          renderer.highlight(currentStep.medians);
        }
        break;
        
      case 'recursive_subproblem':
        // Tracking recursive subproblems
        if (section) {
          setRecursiveRanges(prev => [...prev, section]);
          setPartitionRange(section);
        }
        break;
        
      case 'recursive_return':
        // Returning from a recursive call
        if (currentStep.completedSection) {
          setCompletedRanges(prev => [...prev, currentStep.completedSection]);
        }
        setRecursiveRanges(prev => prev.filter(range => 
          range[0] !== currentStep.section[0] || range[1] !== currentStep.section[1]
        ));
        break;
        
      case 'element_found':
        // K-th element has been found
        setSelectedElement({
          index: result.index,
          value: result.value
        });
        renderer.markSorted([result.index]);
        break;
        
      case 'algorithm_complete':
        // Algorithm execution completed
        if (result && result.index !== undefined) {
          setSelectedElement({
            index: result.index,
            value: result.value
          });
          renderer.markSorted([result.index]);
        }
        break;
        
      default:
        // For other step types, reset special visual indicators
        break;
    }
  }, [currentStep, renderer]);
  
  /**
   * Draw overlay visualizations using Canvas API
   */
  useEffect(() => {
    if (!overlayRef.current) return;
    
    const overlay = overlayRef.current;
    const ctx = overlay.getContext('2d');
    ctx.clearRect(0, 0, overlay.width, overlay.height);
    
    // Don't draw overlays if we don't have data or algorithm context
    if (data.length === 0) return;
    
    // Calculate bar width and spacing (must match WebGL renderer)
    const barWidth = rendererOptions.barWidth || 8;
    const spacing = rendererOptions.spacing || 2;
    const totalWidth = barWidth + spacing;
    
    // Draw target index indicator (the k-th element being searched for)
    if (targetIndex !== null && targetIndex >= 0 && targetIndex < data.length) {
      drawTargetIndicator(ctx, targetIndex, totalWidth);
    }
    
    // Draw current partition range
    if (partitionRange && partitionRange.length === 2) {
      drawPartitionRange(ctx, partitionRange, totalWidth);
    }
    
    // Draw recursive subproblem ranges
    if (recursiveRanges.length > 0) {
      drawRecursiveRanges(ctx, recursiveRanges, totalWidth);
    }
    
    // Draw completed ranges
    if (completedRanges.length > 0) {
      drawCompletedRanges(ctx, completedRanges, totalWidth);
    }
    
    // Draw median-of-medians groups
    if (medianGroups.length > 0) {
      drawMedianGroups(ctx, medianGroups, totalWidth);
    }
    
    // Draw found element indicator
    if (selectedElement) {
      drawSelectedElement(ctx, selectedElement, totalWidth);
    }
    
  }, [
    data, 
    partitionRange, 
    pivotIndex, 
    recursiveRanges, 
    completedRanges, 
    medianGroups, 
    selectedElement, 
    targetIndex, 
    rendererOptions
  ]);
  
  /**
   * Draw the target index indicator (the k-th element being searched for)
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {number} index - Target index
   * @param {number} totalWidth - Width of each bar including spacing
   * @private
   */
  const drawTargetIndicator = (ctx, index, totalWidth) => {
    const x = index * totalWidth + totalWidth / 2;
    const y = height - 30;
    
    ctx.save();
    
    // Draw a triangle pointing to the target element
    ctx.fillStyle = colors.targetIndicator;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x - 8, y + 15);
    ctx.lineTo(x + 8, y + 15);
    ctx.closePath();
    ctx.fill();
    
    // Draw label text
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center';
    ctx.fillStyle = colors.textAnnotation;
    ctx.fillText(`k=${targetIndex}`, x, y + 30);
    
    ctx.restore();
  };
  
  /**
   * Draw the current partition range
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {Array<number>} range - [start, end] indices of the range
   * @param {number} totalWidth - Width of each bar including spacing
   * @private
   */
  const drawPartitionRange = (ctx, range, totalWidth) => {
    const [start, end] = range;
    const startX = start * totalWidth;
    const endX = (end + 1) * totalWidth - spacing;
    const y = 20;
    const height = overlay.height - 50;
    
    ctx.save();
    
    // Draw range background
    ctx.fillStyle = colors.rangeHighlight;
    ctx.fillRect(startX, y, endX - startX, height);
    
    // Draw range borders
    ctx.strokeStyle = 'rgba(33, 150, 243, 0.7)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(startX, y);
    ctx.lineTo(startX, y + height);
    ctx.moveTo(endX, y);
    ctx.lineTo(endX, y + height);
    ctx.stroke();
    
    // Draw range label
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillStyle = colors.textAnnotation;
    const midX = startX + (endX - startX) / 2;
    ctx.fillText(`Range [${start}...${end}]`, midX, y - 5);
    
    // If pivot is within this range, draw pivot indicator
    if (pivotIndex !== null && pivotIndex >= start && pivotIndex <= end) {
      const pivotX = pivotIndex * totalWidth + totalWidth / 2;
      
      // Draw pivot line
      ctx.strokeStyle = colors.pivotIndicator;
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 3]);
      ctx.beginPath();
      ctx.moveTo(pivotX, y);
      ctx.lineTo(pivotX, y + height);
      ctx.stroke();
      ctx.setLineDash([]);
      
      // Draw pivot label
      ctx.font = 'bold 12px Arial';
      ctx.textAlign = 'center';
      ctx.fillStyle = colors.pivotIndicator;
      ctx.fillText('PIVOT', pivotX, y + height + 15);
    }
    
    ctx.restore();
  };
  
  /**
   * Draw visualization of recursive subproblems
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {Array<Array<number>>} ranges - Array of [start, end] ranges
   * @param {number} totalWidth - Width of each bar including spacing
   * @private
   */
  const drawRecursiveRanges = (ctx, ranges, totalWidth) => {
    ctx.save();
    
    ranges.forEach((range, index) => {
      const [start, end] = range;
      const startX = start * totalWidth;
      const endX = (end + 1) * totalWidth - spacing;
      const y = 5 + index * 10; // Stack the borders for nested recursion visualization
      
      // Draw range indicator (just top border to avoid clutter)
      ctx.strokeStyle = `rgba(156, 39, 176, ${0.8 - index * 0.2})`; // Fade for deeper recursion
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(startX, y);
      ctx.lineTo(endX, y);
      ctx.stroke();
      
      // Draw small labels on the top
      ctx.font = '10px Arial';
      ctx.fillStyle = `rgba(156, 39, 176, ${0.8 - index * 0.2})`;
      ctx.textAlign = 'left';
      ctx.fillText(`R${index+1}`, startX + 2, y - 2);
    });
    
    ctx.restore();
  };
  
  /**
   * Draw completed (resolved) ranges
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {Array<Array<number>>} ranges - Array of [start, end] ranges
   * @param {number} totalWidth - Width of each bar including spacing
   * @private
   */
  const drawCompletedRanges = (ctx, ranges, totalWidth) => {
    ctx.save();
    
    ranges.forEach(range => {
      const [start, end] = range;
      const startX = start * totalWidth;
      const endX = (end + 1) * totalWidth - spacing;
      const y = 20;
      const height = overlay.height - 50;
      
      // Draw semi-transparent green background
      ctx.fillStyle = colors.completedRange;
      ctx.fillRect(startX, y, endX - startX, height);
      
      // Draw checkmark to indicate completion
      if (end - start > 3) { // Only if range is wide enough
        const centerX = startX + (endX - startX) / 2;
        const centerY = y + 20;
        
        ctx.strokeStyle = 'rgba(76, 175, 80, 0.7)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(centerX - 10, centerY);
        ctx.lineTo(centerX - 5, centerY + 5);
        ctx.lineTo(centerX + 10, centerY - 10);
        ctx.stroke();
      }
    });
    
    ctx.restore();
  };
  
  /**
   * Draw median-of-medians groups
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {Array<Array<number>>} groups - Array of index groups
   * @param {number} totalWidth - Width of each bar including spacing
   * @private
   */
  const drawMedianGroups = (ctx, groups, totalWidth) => {
    ctx.save();
    
    groups.forEach((group, groupIndex) => {
      if (group.length === 0) return;
      
      // Calculate group dimensions
      const startIndex = Math.min(...group);
      const endIndex = Math.max(...group);
      const startX = startIndex * totalWidth;
      const endX = (endIndex + 1) * totalWidth - spacing;
      const width = endX - startX;
      const y = 40 + (groupIndex % 3) * 15; // Stagger groups vertically to avoid overlap
      
      // Draw group bracket
      ctx.strokeStyle = colors.groupBorder;
      ctx.lineWidth = 2;
      ctx.beginPath();
      
      // Top line with small vertical segments at ends
      ctx.moveTo(startX, y);
      ctx.lineTo(startX, y - 5);
      ctx.lineTo(endX, y - 5);
      ctx.lineTo(endX, y);
      
      ctx.stroke();
      
      // If group has computed median, mark it
      if (group.median !== undefined) {
        const medianIndex = group.median;
        const medianX = medianIndex * totalWidth + totalWidth / 2;
        
        // Draw median indicator
        ctx.strokeStyle = colors.medianIndicator;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(medianX, y - 8);
        ctx.lineTo(medianX, y + 8);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(medianX - 5, y);
        ctx.lineTo(medianX + 5, y);
        ctx.stroke();
        
        // Small "M" label
        ctx.font = '10px Arial';
        ctx.fillStyle = colors.medianIndicator;
        ctx.textAlign = 'center';
        ctx.fillText('M', medianX, y - 10);
      }
      
      // Group number
      ctx.font = '10px Arial';
      ctx.fillStyle = colors.groupBorder;
      ctx.textAlign = 'left';
      ctx.fillText(`G${groupIndex+1}`, startX + 2, y - 7);
    });
    
    ctx.restore();
  };
  
  /**
   * Draw the selected (found) element
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {Object} element - The selected element {index, value}
   * @param {number} totalWidth - Width of each bar including spacing
   * @private
   */
  const drawSelectedElement = (ctx, element, totalWidth) => {
    const { index, value } = element;
    const x = index * totalWidth + totalWidth / 2;
    const y = height / 2;
    
    ctx.save();
    
    // Draw highlight effect
    const gradient = ctx.createRadialGradient(x, y, 5, x, y, 40);
    gradient.addColorStop(0, 'rgba(255, 193, 7, 0.8)');
    gradient.addColorStop(1, 'rgba(255, 193, 7, 0)');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, 40, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw result text
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.fillStyle = colors.targetIndicator;
    ctx.fillText(`Found: ${value}`, x, height - 60);
    ctx.font = '12px Arial';
    ctx.fillStyle = colors.secondaryText;
    ctx.fillText(`at index ${index}`, x, height - 45);
    
    ctx.restore();
  };
  
  /**
   * Get algorithm stage description text
   * @returns {string} Description of current algorithm stage
   */
  const getStageDescription = () => {
    switch (algorithmStage) {
      case 'initial':
        return 'Algorithm initialized';
      case 'partition_start':
        return 'Starting partition operation';
      case 'partition_progress':
        return 'Partitioning elements around pivot';
      case 'partition_complete':
        return 'Partition complete, pivot in final position';
      case 'median_grouping':
        return 'Grouping elements for median-of-medians';
      case 'median_selection':
        return 'Selecting medians from groups';
      case 'recursive_subproblem':
        return 'Entering recursive subproblem';
      case 'recursive_return':
        return 'Returning from recursive call';
      case 'element_found':
        return `Element at index ${targetIndex} found`;
      case 'algorithm_complete':
        return 'Algorithm execution complete';
      default:
        return 'Processing...';
    }
  };
  
  // Render component
  return (
    <div className="selection-visualizer">
      <div className="visualization-container" style={{ position: 'relative', width, height }}>
        {/* Primary visualization canvas (WebGL) */}
        <canvas 
          ref={canvasRef}
          width={width}
          height={height}
          className="visualization-canvas"
          style={{ position: 'absolute', top: 0, left: 0 }}
        />
        
        {/* Overlay canvas for additional visualizations */}
        <canvas
          ref={overlayRef}
          width={width}
          height={height}
          className="visualization-overlay"
          style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}
        />
        
        {/* Algorithm status display */}
        <div 
          className="algorithm-status"
          style={{
            position: 'absolute',
            top: 10,
            right: 10,
            padding: '8px 12px',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            color: 'white',
            borderRadius: '4px',
            fontSize: '12px',
            zIndex: 10
          }}
        >
          <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
            {algorithm?.name || 'Selection Algorithm'}
          </div>
          <div>{getStageDescription()}</div>
          {targetIndex !== null && (
            <div style={{ marginTop: '4px' }}>
              Target: {targetIndex === 0 ? 'Minimum' : 
                      targetIndex === data.length - 1 ? 'Maximum' : 
                      `${targetIndex+1}${['st','nd','rd'][targetIndex % 10 - 1] || 'th'} element`}
            </div>
          )}
        </div>
      </div>
      
      {/* Legend */}
      <div className="selection-legend" style={{ marginTop: '10px', fontSize: '12px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ display: 'inline-block', width: '12px', height: '12px', backgroundColor: colors.rangeHighlight, marginRight: '5px', border: '1px solid rgba(33, 150, 243, 0.7)' }}></span>
            <span>Current Range</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ display: 'inline-block', width: '12px', height: '12px', backgroundColor: colors.pivotIndicator, marginRight: '5px' }}></span>
            <span>Pivot Element</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ display: 'inline-block', width: '12px', height: '12px', backgroundColor: colors.targetIndicator, marginRight: '5px' }}></span>
            <span>Target Index</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ display: 'inline-block', width: '12px', height: '12px', backgroundColor: colors.groupBorder, marginRight: '5px' }}></span>
            <span>Median Groups</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ display: 'inline-block', width: '12px', height: '12px', backgroundColor: colors.completedRange, marginRight: '5px' }}></span>
            <span>Completed Sections</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// PropTypes for documentation and type checking
SelectionVisualizer.propTypes = {
  data: PropTypes.array,
  algorithm: PropTypes.object,
  currentStep: PropTypes.object,
  targetIndex: PropTypes.number,
  width: PropTypes.number,
  height: PropTypes.number,
  rendererOptions: PropTypes.object,
  onStepChange: PropTypes.func
};

export default SelectionVisualizer;
