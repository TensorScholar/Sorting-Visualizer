// src/visualization/components/transform-visualizer.js

/**
 * @file TransformVisualizer - Specialized visualization component for transformation-based sorting algorithms
 * @author Algorithm Visualization Platform Team
 * @version 2.0.0
 * 
 * @description
 * This component provides specialized visualization for sorting algorithms that involve
 * non-standard transformations of the array, such as:
 * 
 * - Pancake Sort (prefix reversals)
 * - Cycle Sort (element placement through cycles)
 * - Shell Sort (interleaved subsequence sorting)
 * - Pigeonhole Sort (distribution and collection)
 * 
 * The visualization employs a combination of advanced SVG animations, data-driven 
 * transformations, and specialized visual metaphors to illuminate the unique operational
 * characteristics of these algorithms. Each transformation type has a dedicated
 * rendering strategy optimized for educational clarity.
 * 
 * Performance characteristics:
 * - Time complexity: O(n) for rendering n elements
 * - Animation complexity: O(t) where t is the number of transformations
 * - Memory usage: O(n) for maintaining the visualization state
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import PropTypes from 'prop-types';

/**
 * @constant {Object} TRANSFORM_TYPES - Enumeration of supported transformation types
 * @property {string} PANCAKE - Prefix reversal operations (Pancake Sort)
 * @property {string} CYCLE - Cycle detection and rotation (Cycle Sort)
 * @property {string} SHELL - Interleaved subsequence sorting (Shell Sort)
 * @property {string} PIGEONHOLE - Distribution and collection (Pigeonhole Sort)
 * @property {string} COMB - Gap-based comparison (Comb Sort)
 * @property {string} ODD_EVEN - Parallel even/odd exchanges (Odd-Even Sort)
 * @property {string} GNOME - Local backward stepping (Gnome Sort)
 * @property {string} COCKTAIL - Bidirectional bubble sort (Cocktail Shaker Sort)
 * @property {string} GENERIC - Generic transformation visualization
 */
const TRANSFORM_TYPES = {
  PANCAKE: 'pancake',
  CYCLE: 'cycle',
  SHELL: 'shell',
  PIGEONHOLE: 'pigeonhole',
  COMB: 'comb',
  ODD_EVEN: 'odd-even',
  GNOME: 'gnome',
  COCKTAIL: 'cocktail',
  GENERIC: 'generic'
};

/**
 * @constant {Object} COLOR_PALETTE - Color configuration for visualizations
 */
const COLOR_PALETTE = {
  background: '#f8f9fa',
  barDefault: '#4a6bdf',
  barHighlight: '#ffab00',
  barComparing: '#ff5252',
  barSwap: '#1de9b6',
  barSorted: '#00c853',
  textPrimary: '#212121',
  textSecondary: '#757575',
  gridLines: '#e0e0e0',
  axisLines: '#9e9e9e',
  // Specialized colors for transformations
  pancakeFlip: '#9c27b0',
  cycleDetection: '#1e88e5',
  shellGap: '#f57c00',
  pigeonholeDistribution: '#7cb342',
  combGap: '#6d4c41',
  oddEvenPhase: '#00acc1',
  gnomeStep: '#ec407a',
  cocktailDirection: '#7e57c2'
};

/**
 * TransformVisualizer Component
 * 
 * A specialized visualization component for transformation-based sorting algorithms
 * that renders the unique operations and state transitions in an intuitive, educational manner.
 * 
 * @component
 */
const TransformVisualizer = ({
  data,
  transformationType,
  currentStep,
  stepHistory,
  width,
  height,
  colorPalette,
  animationDuration,
  showLabels,
  showAxes,
  showGrid
}) => {
  // Component state
  const [renderedData, setRenderedData] = useState([]);
  const [highlightedIndices, setHighlightedIndices] = useState([]);
  const [transformState, setTransformState] = useState({});
  const [animations, setAnimations] = useState([]);
  
  // Refs for DOM manipulation and animations
  const svgRef = useRef(null);
  const containerRef = useRef(null);
  const animationRef = useRef(null);
  
  // Derived state using memoization for performance
  const mergedPalette = useMemo(() => ({
    ...COLOR_PALETTE,
    ...colorPalette
  }), [colorPalette]);
  
  // Constants for visualization
  const BAR_PADDING = 2;
  const LABEL_HEIGHT = 20;
  const AXIS_PADDING = showAxes ? 40 : 0;
  const LABEL_PADDING = showLabels ? LABEL_HEIGHT : 0;
  
  // Calculate available dimensions for the visualization
  const availableWidth = width - (2 * AXIS_PADDING);
  const availableHeight = height - LABEL_PADDING - AXIS_PADDING;
  
  // Calculate bar dimensions based on available space and data length
  const barWidth = Math.max(2, (availableWidth / (data.length || 1)) - BAR_PADDING);
  
  /**
   * Find the maximum value in the data array for normalization
   * @type {number}
   */
  const maxValue = useMemo(() => Math.max(...data, 1), [data]);
  
  /**
   * Updates the visualization based on the current step
   */
  useEffect(() => {
    if (!stepHistory || stepHistory.length === 0 || currentStep >= stepHistory.length) {
      return;
    }
    
    // Get the current step data
    const stepData = stepHistory[currentStep];
    const stepArray = stepData.array || [];
    
    // Clear any ongoing animations
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    
    // Update visualization with current state
    setRenderedData(stepArray);
    setHighlightedIndices(stepData.indices || []);
    
    // Extract transformation-specific state
    const newTransformState = extractTransformState(stepData, transformationType);
    setTransformState(newTransformState);
    
    // Generate animations for the current transformation
    const newAnimations = generateAnimations(
      stepData,
      transformationType,
      animationDuration
    );
    setAnimations(newAnimations);
    
  }, [currentStep, stepHistory, transformationType, animationDuration]);

  /**
   * Extracts transformation-specific state from step data
   * @param {Object} stepData - Data for the current step
   * @param {string} transformType - Type of transformation
   * @returns {Object} Transformation state for visualization
   * @private
   */
  const extractTransformState = (stepData, transformType) => {
    // Base state with common properties
    const baseState = {
      type: transformType,
      active: false,
      message: stepData.message || ''
    };
    
    // Early return if step data doesn't contain transformation info
    if (!stepData.type) {
      return baseState;
    }
    
    // Extract transformation-specific data based on algorithm type
    switch (transformType) {
      case TRANSFORM_TYPES.PANCAKE:
        return {
          ...baseState,
          active: stepData.type === 'pancake-flip',
          flipIndex: stepData.flipIndex,
          prevFlipIndex: stepData.prevFlipIndex,
          isFlipping: stepData.isFlipping
        };
        
      case TRANSFORM_TYPES.CYCLE:
        return {
          ...baseState,
          active: stepData.type === 'cycle-detection' || stepData.type === 'cycle-rotation',
          cycleStart: stepData.cycleStart,
          cycleIndices: stepData.cycleIndices || [],
          currentPosition: stepData.currentPosition,
          isRotating: stepData.type === 'cycle-rotation'
        };
        
      case TRANSFORM_TYPES.SHELL:
        return {
          ...baseState,
          active: stepData.type === 'shell-sort-pass',
          gap: stepData.gap,
          groups: stepData.groups || [],
          currentGroup: stepData.currentGroup,
          groupProgress: stepData.groupProgress
        };
        
      case TRANSFORM_TYPES.PIGEONHOLE:
        return {
          ...baseState,
          active: stepData.type === 'distribution' || stepData.type === 'collection',
          phase: stepData.type,
          buckets: stepData.buckets || [],
          bucketIndices: stepData.bucketIndices || {},
          distributionMap: stepData.distributionMap || []
        };
        
      case TRANSFORM_TYPES.COMB:
        return {
          ...baseState,
          active: stepData.type === 'comb-comparison',
          gap: stepData.gap,
          shrinkFactor: stepData.shrinkFactor,
          comparingPairs: stepData.comparingPairs || []
        };
        
      case TRANSFORM_TYPES.ODD_EVEN:
        return {
          ...baseState,
          active: stepData.type === 'odd-phase' || stepData.type === 'even-phase',
          phase: stepData.type === 'odd-phase' ? 'odd' : 'even',
          comparingPairs: stepData.comparingPairs || [],
          swappedPairs: stepData.swappedPairs || []
        };
        
      case TRANSFORM_TYPES.GNOME:
        return {
          ...baseState,
          active: stepData.type === 'gnome-step',
          position: stepData.position,
          direction: stepData.direction, // 'forward' or 'backward'
          comparing: stepData.comparing || []
        };
        
      case TRANSFORM_TYPES.COCKTAIL:
        return {
          ...baseState,
          active: stepData.type === 'cocktail-step',
          direction: stepData.direction, // 'forward' or 'backward'
          rangeLow: stepData.rangeLow,
          rangeHigh: stepData.rangeHigh,
          comparing: stepData.comparing || []
        };
        
      default:
        return {
          ...baseState,
          active: !!stepData.type.includes('transform'),
          indices: stepData.indices || [],
          operation: stepData.operation
        };
    }
  };

  /**
   * Generates animations for the current transformation
   * @param {Object} stepData - Data for the current step
   * @param {string} transformType - Type of transformation
   * @param {number} duration - Animation duration in milliseconds
   * @returns {Array} Array of animation definitions
   * @private
   */
  const generateAnimations = (stepData, transformType, duration) => {
    // Early return if step data doesn't contain transformation info
    if (!stepData.type) {
      return [];
    }
    
    const animations = [];
    
    // Generate animation based on transformation type
    switch (transformType) {
      case TRANSFORM_TYPES.PANCAKE:
        if (stepData.type === 'pancake-flip' && stepData.flipIndex !== undefined) {
          // Generate flip animation
          const flipIndex = stepData.flipIndex;
          
          for (let i = 0; i <= Math.floor(flipIndex / 2); i++) {
            animations.push({
              type: 'swap',
              index1: i,
              index2: flipIndex - i,
              duration: duration,
              delay: i * (duration / 10)
            });
          }
        }
        break;
        
      case TRANSFORM_TYPES.CYCLE:
        if (stepData.type === 'cycle-rotation' && Array.isArray(stepData.cycleIndices)) {
          // Generate cycle rotation animation
          const cycleIndices = stepData.cycleIndices;
          
          for (let i = 0; i < cycleIndices.length - 1; i++) {
            animations.push({
              type: 'move',
              fromIndex: cycleIndices[i],
              toIndex: cycleIndices[i + 1],
              duration: duration / cycleIndices.length,
              delay: i * (duration / cycleIndices.length)
            });
          }
          
          // Complete the cycle
          if (cycleIndices.length > 1) {
            animations.push({
              type: 'move',
              fromIndex: cycleIndices[cycleIndices.length - 1],
              toIndex: cycleIndices[0],
              duration: duration / cycleIndices.length,
              delay: (cycleIndices.length - 1) * (duration / cycleIndices.length)
            });
          }
        }
        break;
        
      case TRANSFORM_TYPES.SHELL:
        if (stepData.type === 'shell-sort-pass' && stepData.gap !== undefined) {
          // Generate shell sort group animations
          const groups = stepData.groups || [];
          
          groups.forEach((group, groupIndex) => {
            group.forEach((index, i) => {
              if (i < group.length - 1) {
                animations.push({
                  type: 'compare',
                  index1: index,
                  index2: group[i + 1],
                  duration: duration / 2,
                  delay: groupIndex * (duration / groups.length)
                });
              }
            });
          });
        }
        break;
        
      case TRANSFORM_TYPES.PIGEONHOLE:
        if (stepData.type === 'distribution') {
          // Generate distribution animations
          const distributionMap = stepData.distributionMap || [];
          
          distributionMap.forEach((targetBucket, sourceIndex) => {
            animations.push({
              type: 'move-to-bucket',
              fromIndex: sourceIndex,
              toBucket: targetBucket,
              duration: duration,
              delay: sourceIndex * (duration / distributionMap.length / 2)
            });
          });
        } else if (stepData.type === 'collection') {
          // Generate collection animations
          const buckets = stepData.buckets || [];
          let currentIndex = 0;
          
          buckets.forEach((bucket, bucketIndex) => {
            bucket.forEach((value, valueIndex) => {
              animations.push({
                type: 'move-from-bucket',
                fromBucket: bucketIndex,
                bucketIndex: valueIndex,
                toIndex: currentIndex,
                duration: duration,
                delay: currentIndex * (duration / data.length / 2)
              });
              currentIndex++;
            });
          });
        }
        break;
        
      case TRANSFORM_TYPES.COMB:
        if (stepData.type === 'comb-comparison' && Array.isArray(stepData.comparingPairs)) {
          // Generate comb comparison animations
          stepData.comparingPairs.forEach((pair, pairIndex) => {
            animations.push({
              type: 'compare',
              index1: pair[0],
              index2: pair[1],
              duration: duration / 2,
              delay: pairIndex * (duration / stepData.comparingPairs.length)
            });
            
            // If there was a swap
            if (stepData.swappedPairs && stepData.swappedPairs.some(swapPair => 
              swapPair[0] === pair[0] && swapPair[1] === pair[1])) {
              animations.push({
                type: 'swap',
                index1: pair[0],
                index2: pair[1],
                duration: duration / 2,
                delay: pairIndex * (duration / stepData.comparingPairs.length) + duration / 2
              });
            }
          });
        }
        break;
        
      case TRANSFORM_TYPES.ODD_EVEN:
        if ((stepData.type === 'odd-phase' || stepData.type === 'even-phase') && 
            Array.isArray(stepData.comparingPairs)) {
          // Generate odd-even phase animations
          stepData.comparingPairs.forEach((pair, pairIndex) => {
            animations.push({
              type: 'compare',
              index1: pair[0],
              index2: pair[1],
              duration: duration / 3,
              delay: pairIndex * (duration / stepData.comparingPairs.length / 3)
            });
            
            // If there was a swap
            if (stepData.swappedPairs && stepData.swappedPairs.some(swapPair => 
              swapPair[0] === pair[0] && swapPair[1] === pair[1])) {
              animations.push({
                type: 'swap',
                index1: pair[0],
                index2: pair[1],
                duration: duration / 3,
                delay: pairIndex * (duration / stepData.comparingPairs.length / 3) + duration / 3
              });
            }
          });
        }
        break;
        
      case TRANSFORM_TYPES.GNOME:
        if (stepData.type === 'gnome-step' && stepData.position !== undefined) {
          // Generate gnome step animation
          if (stepData.direction === 'backward' && stepData.comparing && 
              stepData.comparing.length === 2) {
            animations.push({
              type: 'swap',
              index1: stepData.comparing[0],
              index2: stepData.comparing[1],
              duration: duration,
              delay: 0
            });
          } else if (stepData.direction === 'forward') {
            animations.push({
              type: 'highlight',
              index: stepData.position,
              duration: duration,
              delay: 0
            });
          }
        }
        break;
        
      case TRANSFORM_TYPES.COCKTAIL:
        if (stepData.type === 'cocktail-step' && stepData.comparing && 
            stepData.comparing.length === 2) {
          // Generate cocktail step animation
          animations.push({
            type: 'compare',
            index1: stepData.comparing[0],
            index2: stepData.comparing[1],
            duration: duration / 2,
            delay: 0
          });
          
          // If there was a swap
          if (stepData.swapped) {
            animations.push({
              type: 'swap',
              index1: stepData.comparing[0],
              index2: stepData.comparing[1],
              duration: duration / 2,
              delay: duration / 2
            });
          }
        }
        break;
        
      default:
        // Generic transformation animations
        if (stepData.indices && stepData.indices.length > 0) {
          stepData.indices.forEach(index => {
            animations.push({
              type: 'highlight',
              index: index,
              duration: duration,
              delay: 0
            });
          });
        }
    }
    
    return animations;
  };

  /**
   * Returns the appropriate component to visualize the current transformation
   * @returns {JSX.Element} The specialized visualization component
   */
  const renderTransformVisualization = () => {
    switch (transformationType) {
      case TRANSFORM_TYPES.PANCAKE:
        return renderPancakeVisualization();
      case TRANSFORM_TYPES.CYCLE:
        return renderCycleVisualization();
      case TRANSFORM_TYPES.SHELL:
        return renderShellVisualization();
      case TRANSFORM_TYPES.PIGEONHOLE:
        return renderPigeonholeVisualization();
      case TRANSFORM_TYPES.COMB:
        return renderCombVisualization();
      case TRANSFORM_TYPES.ODD_EVEN:
        return renderOddEvenVisualization();
      case TRANSFORM_TYPES.GNOME:
        return renderGnomeVisualization();
      case TRANSFORM_TYPES.COCKTAIL:
        return renderCocktailVisualization();
      default:
        return renderGenericVisualization();
    }
  };

  /**
   * Renders the pancake sorting visualization - specialized for prefix reversal operations
   * @returns {JSX.Element} SVG-based visualization
   * @private
   */
  const renderPancakeVisualization = () => {
    const { flipIndex, isFlipping } = transformState;
    
    return (
      <svg width={width} height={height} ref={svgRef}>
        {/* Background and grid */}
        {showGrid && renderGrid()}
        
        {/* Axes */}
        {showAxes && renderAxes()}
        
        {/* Base array visualization */}
        <g transform={`translate(${AXIS_PADDING}, ${AXIS_PADDING})`}>
          {/* Render the array bars */}
          {renderedData.map((value, index) => {
            const isHighlighted = highlightedIndices.includes(index);
            const isFlipped = flipIndex !== undefined && index <= flipIndex;
            
            // Calculate bar properties
            const barHeight = (value / maxValue) * availableHeight;
            const x = index * (barWidth + BAR_PADDING);
            const y = availableHeight - barHeight;
            
            // Animation transformations
            let transform = '';
            if (isFlipping && isFlipped) {
              // Calculate rotation based on position in the flip range
              const relativePos = (flipIndex - index) / flipIndex;
              const rotationAxis = (flipIndex * (barWidth + BAR_PADDING)) / 2;
              transform = `rotate(${180 * relativePos}, ${rotationAxis}, ${availableHeight / 2})`;
            }
            
            // Determine bar color
            let fill = mergedPalette.barDefault;
            if (isHighlighted) {
              fill = mergedPalette.barHighlight;
            } else if (isFlipped) {
              fill = mergedPalette.pancakeFlip;
            }
            
            return (
              <rect
                key={`bar-${index}`}
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                fill={fill}
                stroke={isHighlighted ? '#000' : 'none'}
                strokeWidth={isHighlighted ? 1 : 0}
                transform={transform}
                style={{ transition: 'all 0.3s ease-in-out' }}
              />
            );
          })}
          
          {/* Pancake flip visualization */}
          {flipIndex !== undefined && (
            <g>
              {/* Flip axis indicator */}
              <line
                x1={0}
                y1={availableHeight + 5}
                x2={(flipIndex + 1) * (barWidth + BAR_PADDING) - BAR_PADDING}
                y2={availableHeight + 5}
                stroke={mergedPalette.pancakeFlip}
                strokeWidth={3}
                strokeDasharray="5,3"
              />
              
              {/* Flip arrow */}
              <path
                d={`M${(flipIndex + 1) * (barWidth + BAR_PADDING) / 2},${availableHeight + 15} 
                    A${availableWidth / 4},${availableHeight / 4} 0 0,1 
                    ${(flipIndex + 1) * (barWidth + BAR_PADDING) - BAR_PADDING},${availableHeight + 15}`}
                fill="none"
                stroke={mergedPalette.pancakeFlip}
                strokeWidth={2}
                markerEnd="url(#arrowhead)"
                opacity={isFlipping ? 1 : 0.5}
              />
              
              {/* Arrow marker definition */}
              <defs>
                <marker
                  id="arrowhead"
                  markerWidth="10"
                  markerHeight="7"
                  refX="10"
                  refY="3.5"
                  orient="auto"
                >
                  <polygon
                    points="0 0, 10 3.5, 0 7"
                    fill={mergedPalette.pancakeFlip}
                  />
                </marker>
              </defs>
            </g>
          )}
        </g>
        
        {/* Labels */}
        {showLabels && renderLabels()}
      </svg>
    );
  };

  /**
   * Renders the cycle sort visualization - specialized for cycle detection and rotation
   * @returns {JSX.Element} SVG-based visualization
   * @private
   */
  const renderCycleVisualization = () => {
    const { cycleStart, cycleIndices, isRotating, currentPosition } = transformState;
    
    return (
      <svg width={width} height={height} ref={svgRef}>
        {/* Background and grid */}
        {showGrid && renderGrid()}
        
        {/* Axes */}
        {showAxes && renderAxes()}
        
        {/* Base array visualization */}
        <g transform={`translate(${AXIS_PADDING}, ${AXIS_PADDING})`}>
          {/* Render the array bars */}
          {renderedData.map((value, index) => {
            const isHighlighted = highlightedIndices.includes(index);
            const isInCycle = cycleIndices && cycleIndices.includes(index);
            const isCycleStart = index === cycleStart;
            const isCurrentPosition = index === currentPosition;
            
            // Calculate bar properties
            const barHeight = (value / maxValue) * availableHeight;
            const x = index * (barWidth + BAR_PADDING);
            const y = availableHeight - barHeight;
            
            // Determine bar color
            let fill = mergedPalette.barDefault;
            if (isCurrentPosition) {
              fill = mergedPalette.barHighlight;
            } else if (isCycleStart) {
              fill = mergedPalette.barSwap;
            } else if (isInCycle) {
              fill = mergedPalette.cycleDetection;
            } else if (isHighlighted) {
              fill = mergedPalette.barHighlight;
            }
            
            return (
              <rect
                key={`bar-${index}`}
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                fill={fill}
                stroke={isHighlighted || isInCycle ? '#000' : 'none'}
                strokeWidth={isHighlighted || isInCycle ? 1 : 0}
                style={{ transition: 'all 0.3s ease-in-out' }}
              />
            );
          })}
          
          {/* Cycle visualization */}
          {cycleIndices && cycleIndices.length > 0 && (
            <g>
              {/* Cycle connections */}
              {cycleIndices.map((index, i) => {
                const nextIndex = cycleIndices[(i + 1) % cycleIndices.length];
                const startX = index * (barWidth + BAR_PADDING) + barWidth / 2;
                const startY = availableHeight - (renderedData[index] / maxValue) * availableHeight - 10;
                const endX = nextIndex * (barWidth + BAR_PADDING) + barWidth / 2;
                const endY = availableHeight - (renderedData[nextIndex] / maxValue) * availableHeight - 10;
                
                // Create curved path between cycle elements
                const controlPointY = Math.min(startY, endY) - 50;
                
                return (
                  <path
                    key={`cycle-${i}`}
                    d={`M${startX},${startY} C${startX},${controlPointY} ${endX},${controlPointY} ${endX},${endY}`}
                    fill="none"
                    stroke={mergedPalette.cycleDetection}
                    strokeWidth={2}
                    strokeDasharray={isRotating ? "5,5" : "none"}
                    markerEnd="url(#cycleArrow)"
                    opacity={0.7}
                    style={{ transition: 'all 0.3s ease-in-out' }}
                  />
                );
              })}
              
              {/* Arrow marker definition */}
              <defs>
                <marker
                  id="cycleArrow"
                  markerWidth="10"
                  markerHeight="7"
                  refX="10"
                  refY="3.5"
                  orient="auto"
                >
                  <polygon
                    points="0 0, 10 3.5, 0 7"
                    fill={mergedPalette.cycleDetection}
                  />
                </marker>
              </defs>
            </g>
          )}
        </g>
        
        {/* Labels */}
        {showLabels && renderLabels()}
      </svg>
    );
  };

  /**
   * Renders the shell sort visualization - specialized for interleaved subsequence sorting
   * @returns {JSX.Element} SVG-based visualization
   * @private
   */
  const renderShellVisualization = () => {
    const { gap, groups, currentGroup } = transformState;
    
    return (
      <svg width={width} height={height} ref={svgRef}>
        {/* Background and grid */}
        {showGrid && renderGrid()}
        
        {/* Axes */}
        {showAxes && renderAxes()}
        
        {/* Base array visualization */}
        <g transform={`translate(${AXIS_PADDING}, ${AXIS_PADDING})`}>
          {/* Gap visualization */}
          {gap && groups && groups.length > 0 && (
            <g>
              {groups.map((group, groupIndex) => {
                const isCurrentGroup = groupIndex === currentGroup;
                
                return (
                  <g key={`group-${groupIndex}`}>
                    {group.map((index, i) => {
                      // Only connect consecutive elements in the same group
                      if (i < group.length - 1) {
                        const startX = index * (barWidth + BAR_PADDING) + barWidth / 2;
                        const endX = group[i + 1] * (barWidth + BAR_PADDING) + barWidth / 2;
                        
                        return (
                          <line
                            key={`connection-${groupIndex}-${i}`}
                            x1={startX}
                            y1={availableHeight + 15}
                            x2={endX}
                            y2={availableHeight + 15}
                            stroke={isCurrentGroup ? mergedPalette.shellGap : mergedPalette.gridLines}
                            strokeWidth={isCurrentGroup ? 2 : 1}
                            strokeDasharray={isCurrentGroup ? "none" : "5,5"}
                          />
                        );
                      }
                      return null;
                    })}
                  </g>
                );
              })}
            </g>
          )}
          
          {/* Render the array bars */}
          {renderedData.map((value, index) => {
            const isHighlighted = highlightedIndices.includes(index);
            
            // Determine if this index is part of the current group
            const isCurrentGroupElement = groups && 
              currentGroup !== undefined && 
              groups[currentGroup] && 
              groups[currentGroup].includes(index);
            
            // Calculate bar properties
            const barHeight = (value / maxValue) * availableHeight;
            const x = index * (barWidth + BAR_PADDING);
            const y = availableHeight - barHeight;
            
            // Determine bar color
            let fill = mergedPalette.barDefault;
            if (isHighlighted) {
              fill = mergedPalette.barHighlight;
            } else if (isCurrentGroupElement) {
              fill = mergedPalette.shellGap;
            }
            
            return (
              <rect
                key={`bar-${index}`}
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                fill={fill}
                stroke={isHighlighted || isCurrentGroupElement ? '#000' : 'none'}
                strokeWidth={isHighlighted || isCurrentGroupElement ? 1 : 0}
                style={{ transition: 'all 0.3s ease-in-out' }}
              />
            );
          })}
          
          {/* Gap indicator */}
          {gap && (
            <text
              x={availableWidth - 60}
              y={30}
              fill={mergedPalette.textPrimary}
              fontSize={14}
              fontWeight="bold"
            >
              Gap: {gap}
            </text>
          )}
        </g>
        
        {/* Labels */}
        {showLabels && renderLabels()}
      </svg>
    );
  };

  /**
   * Renders the pigeonhole sort visualization - specialized for distribution and collection
   * @returns {JSX.Element} SVG-based visualization
   * @private
   */
  const renderPigeonholeVisualization = () => {
    const { phase, buckets, distributionMap } = transformState;
    const isDistribution = phase === 'distribution';
    const isCollection = phase === 'collection';
    
    // Bucket rendering constants
    const bucketWidth = Math.min(50, availableWidth / (buckets?.length || 1) - 10);
    const bucketSpacing = 10;
    const bucketY = availableHeight / 2;
    const bucketHeight = availableHeight / 2;
    
    return (
      <svg width={width} height={height} ref={svgRef}>
        {/* Background and grid */}
        {showGrid && renderGrid()}
        
        {/* Axes */}
        {showAxes && renderAxes()}
        
        {/* Render the array bars */}
        <g transform={`translate(${AXIS_PADDING}, ${AXIS_PADDING})`}>
          {renderedData.map((value, index) => {
            const isHighlighted = highlightedIndices.includes(index);
            const isDistributing = isDistribution && distributionMap && distributionMap[index] !== undefined;
            
            // Calculate bar properties
            const barHeight = (value / maxValue) * availableHeight / 2; // Half height for distribution view
            const x = index * (barWidth + BAR_PADDING);
            const y = (availableHeight / 2) - barHeight; // Position in top half
            
            // Determine bar color
            let fill = mergedPalette.barDefault;
            if (isHighlighted) {
              fill = mergedPalette.barHighlight;
            } else if (isDistributing) {
              fill = mergedPalette.pigeonholeDistribution;
            }
            
            // For collection phase, don't render original array
            if (isCollection) {
              return null;
            }
            
            return (
              <rect
                key={`bar-${index}`}
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                fill={fill}
                stroke={isHighlighted ? '#000' : 'none'}
                strokeWidth={isHighlighted ? 1 : 0}
                style={{ transition: 'all 0.3s ease-in-out' }}
              />
            );
          })}
        </g>
        
        {/* Distribution arrows */}
        {isDistribution && distributionMap && (
          <g transform={`translate(${AXIS_PADDING}, ${AXIS_PADDING})`}>
            {distributionMap.map((bucketIndex, arrayIndex) => {
              const sourceX = arrayIndex * (barWidth + BAR_PADDING) + barWidth / 2;
              const sourceY = availableHeight / 2;
              const targetX = (bucketWidth + bucketSpacing) * bucketIndex + bucketWidth / 2;
              const targetY = bucketY;
              
              return (
                <line
                  key={`dist-arrow-${arrayIndex}`}
                  x1={sourceX}
                  y1={sourceY}
                  x2={targetX}
                  y2={targetY}
                  stroke={mergedPalette.pigeonholeDistribution}
                  strokeWidth={1}
                  strokeDasharray="5,3"
                  markerEnd="url(#pigeonholeArrow)"
                />
              );
            })}
            
            {/* Arrow marker definition */}
            <defs>
              <marker
                id="pigeonholeArrow"
                markerWidth="10"
                markerHeight="7"
                refX="10"
                refY="3.5"
                orient="auto"
              >
                <polygon
                  points="0 0, 10 3.5, 0 7"
                  fill={mergedPalette.pigeonholeDistribution}
                />
              </marker>
            </defs>
          </g>
        )}
        
        {/* Buckets visualization */}
        {buckets && buckets.length > 0 && (
          <g transform={`translate(${AXIS_PADDING}, ${AXIS_PADDING})`}>
            {buckets.map((bucket, bucketIndex) => {
              return (
                <g key={`bucket-${bucketIndex}`}>
                  {/* Bucket outline */}
                  <rect
                    x={(bucketWidth + bucketSpacing) * bucketIndex}
                    y={bucketY}
                    width={bucketWidth}
                    height={bucketHeight}
                    fill={mergedPalette.background}
                    stroke={mergedPalette.gridLines}
                    strokeWidth={2}
                  />
                  
                  {/* Bucket label */}
                  <text
                    x={(bucketWidth + bucketSpacing) * bucketIndex + bucketWidth / 2}
                    y={bucketY - 5}
                    textAnchor="middle"
                    fill={mergedPalette.textPrimary}
                    fontSize={12}
                  >
                    {bucketIndex}
                  </text>
                  
                  {/* Bucket contents */}
                  {bucket.map((value, valueIndex) => {
                    const itemHeight = Math.min(20, (bucketHeight - 10) / bucket.length);
                    const itemY = bucketY + 5 + valueIndex * itemHeight;
                    
                    return (
                      <rect
                        key={`bucket-item-${bucketIndex}-${valueIndex}`}
                        x={(bucketWidth + bucketSpacing) * bucketIndex + 5}
                        y={itemY}
                        width={bucketWidth - 10}
                        height={itemHeight - 2}
                        fill={mergedPalette.pigeonholeDistribution}
                        rx={2}
                        ry={2}
                      />
                    );
                  })}
                </g>
              );
            })}
          </g>
        )}
        
        {/* Phase indicator */}
        {(isDistribution || isCollection) && (
          <text
            x={width - 150}
            y={30}
            fill={mergedPalette.textPrimary}
            fontSize={14}
            fontWeight="bold"
          >
            Phase: {phase}
          </text>
        )}
        
        {/* Labels */}
        {showLabels && renderLabels()}
      </svg>
    );
  };

  /**
   * Renders the comb sort visualization - specialized for varying gap comparisons
   * @returns {JSX.Element} SVG-based visualization
   * @private
   */
  const renderCombVisualization = () => {
    const { gap, comparingPairs, shrinkFactor } = transformState;
    
    return (
      <svg width={width} height={height} ref={svgRef}>
        {/* Background and grid */}
        {showGrid && renderGrid()}
        
        {/* Axes */}
        {showAxes && renderAxes()}
        
        {/* Base array visualization */}
        <g transform={`translate(${AXIS_PADDING}, ${AXIS_PADDING})`}>
          {/* Render the array bars */}
          {renderedData.map((value, index) => {
            const isHighlighted = highlightedIndices.includes(index);
            const isComparing = comparingPairs && 
              comparingPairs.some(pair => pair.includes(index));
            
            // Calculate bar properties
            const barHeight = (value / maxValue) * availableHeight;
            const x = index * (barWidth + BAR_PADDING);
            const y = availableHeight - barHeight;
            
            // Determine bar color
            let fill = mergedPalette.barDefault;
            if (isHighlighted) {
              fill = mergedPalette.barHighlight;
            } else if (isComparing) {
              fill = mergedPalette.combGap;
            }
            
            return (
              <rect
                key={`bar-${index}`}
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                fill={fill}
                stroke={isHighlighted || isComparing ? '#000' : 'none'}
                strokeWidth={isHighlighted || isComparing ? 1 : 0}
                style={{ transition: 'all 0.3s ease-in-out' }}
              />
            );
          })}
          
          {/* Gap connections */}
          {comparingPairs && comparingPairs.length > 0 && (
            <g>
              {comparingPairs.map((pair, pairIndex) => {
                if (pair && pair.length === 2) {
                  const index1 = pair[0];
                  const index2 = pair[1];
                  const x1 = index1 * (barWidth + BAR_PADDING) + barWidth / 2;
                  const x2 = index2 * (barWidth + BAR_PADDING) + barWidth / 2;
                  
                  return (
                    <g key={`comb-pair-${pairIndex}`}>
                      <line
                        x1={x1}
                        y1={availableHeight + 10}
                        x2={x2}
                        y2={availableHeight + 10}
                        stroke={mergedPalette.combGap}
                        strokeWidth={2}
                      />
                      
                      {/* Gap indicator */}
                      <text
                        x={(x1 + x2) / 2}
                        y={availableHeight + 25}
                        textAnchor="middle"
                        fill={mergedPalette.textPrimary}
                        fontSize={12}
                      >
                        gap: {index2 - index1}
                      </text>
                    </g>
                  );
                }
                return null;
              })}
            </g>
          )}
          
          {/* Shrink factor indicator */}
          {shrinkFactor && (
            <text
              x={availableWidth - 140}
              y={30}
              fill={mergedPalette.textPrimary}
              fontSize={14}
              fontWeight="bold"
            >
              Shrink factor: {shrinkFactor.toFixed(2)}
            </text>
          )}
        </g>
        
        {/* Labels */}
        {showLabels && renderLabels()}
      </svg>
    );
  };

  /**
   * Renders the odd-even sort visualization - specialized for alternating phases
   * @returns {JSX.Element} SVG-based visualization
   * @private
   */
  const renderOddEvenVisualization = () => {
    const { phase, comparingPairs, swappedPairs } = transformState;
    
    return (
      <svg width={width} height={height} ref={svgRef}>
        {/* Background and grid */}
        {showGrid && renderGrid()}
        
        {/* Axes */}
        {showAxes && renderAxes()}
        
        {/* Phase indicator - colored band for odd/even phase */}
        <rect
          x={0}
          y={0}
          width={width}
          height={AXIS_PADDING - 5}
          fill={phase === 'odd' ? mergedPalette.oddEvenPhase : mergedPalette.textSecondary}
          opacity={0.2}
        />
        
        <text
          x={width / 2}
          y={AXIS_PADDING - 10}
          textAnchor="middle"
          fill={mergedPalette.textPrimary}
          fontSize={14}
          fontWeight="bold"
        >
          {phase === 'odd' ? 'Odd Phase' : 'Even Phase'}
        </text>
        
        {/* Base array visualization */}
        <g transform={`translate(${AXIS_PADDING}, ${AXIS_PADDING})`}>
          {/* Render the array bars */}
          {renderedData.map((value, index) => {
            const isHighlighted = highlightedIndices.includes(index);
            const isComparing = comparingPairs && 
              comparingPairs.some(pair => pair.includes(index));
            const isSwapped = swappedPairs && 
              swappedPairs.some(pair => pair.includes(index));
            
            // Calculate bar properties
            const barHeight = (value / maxValue) * availableHeight;
            const x = index * (barWidth + BAR_PADDING);
            const y = availableHeight - barHeight;
            
            // Determine bar color
            let fill = mergedPalette.barDefault;
            if (isSwapped) {
              fill = mergedPalette.barSwap;
            } else if (isComparing) {
              fill = mergedPalette.oddEvenPhase;
            } else if (isHighlighted) {
              fill = mergedPalette.barHighlight;
            }
            
            // Determine if this is in an active pair based on phase
            const isActivePositionInPhase = 
              (phase === 'odd' && index % 2 === 0) || 
              (phase === 'even' && index % 2 === 1);
            
            return (
              <g key={`bar-${index}`}>
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={barHeight}
                  fill={fill}
                  stroke={isHighlighted || isComparing ? '#000' : 'none'}
                  strokeWidth={isHighlighted || isComparing ? 1 : 0}
                  style={{ transition: 'all 0.3s ease-in-out' }}
                />
                
                {/* Phase position indicator */}
                {isActivePositionInPhase && index < renderedData.length - 1 && (
                  <line
                    x1={x + barWidth}
                    y1={availableHeight + 5}
                    x2={(index + 1) * (barWidth + BAR_PADDING)}
                    y2={availableHeight + 5}
                    stroke={phase === 'odd' ? mergedPalette.oddEvenPhase : mergedPalette.textSecondary}
                    strokeWidth={2}
                  />
                )}
              </g>
            );
          })}
          
          {/* Comparison connections */}
          {comparingPairs && comparingPairs.length > 0 && (
            <g>
              {comparingPairs.map((pair, pairIndex) => {
                if (pair && pair.length === 2) {
                  const index1 = pair[0];
                  const index2 = pair[1];
                  const x1 = index1 * (barWidth + BAR_PADDING) + barWidth / 2;
                  const x2 = index2 * (barWidth + BAR_PADDING) + barWidth / 2;
                  const y1 = availableHeight - (renderedData[index1] / maxValue) * availableHeight;
                  const y2 = availableHeight - (renderedData[index2] / maxValue) * availableHeight;
                  
                  // Check if this pair was swapped
                  const wasSwapped = swappedPairs && 
                    swappedPairs.some(swapPair => 
                      swapPair[0] === pair[0] && swapPair[1] === pair[1]);
                  
                  return (
                    <g key={`comparison-${pairIndex}`}>
                      <line
                        x1={x1}
                        y1={Math.min(y1, y2) - 5}
                        x2={x2}
                        y2={Math.min(y1, y2) - 5}
                        stroke={wasSwapped ? mergedPalette.barSwap : mergedPalette.oddEvenPhase}
                        strokeWidth={wasSwapped ? 2 : 1}
                        strokeDasharray={wasSwapped ? "none" : "5,3"}
                      />
                    </g>
                  );
                }
                return null;
              })}
            </g>
          )}
        </g>
        
        {/* Labels */}
        {showLabels && renderLabels()}
      </svg>
    );
  };

  /**
   * Renders the gnome sort visualization - specialized for local backward stepping
   * @returns {JSX.Element} SVG-based visualization
   * @private
   */
  const renderGnomeVisualization = () => {
    const { position, direction, comparing } = transformState;
    
    return (
      <svg width={width} height={height} ref={svgRef}>
        {/* Background and grid */}
        {showGrid && renderGrid()}
        
        {/* Axes */}
        {showAxes && renderAxes()}
        
        {/* Base array visualization */}
        <g transform={`translate(${AXIS_PADDING}, ${AXIS_PADDING})`}>
          {/* Render the array bars */}
          {renderedData.map((value, index) => {
            const isHighlighted = highlightedIndices.includes(index);
            const isCurrentPosition = index === position;
            const isComparing = comparing && comparing.includes(index);
            
            // Calculate bar properties
            const barHeight = (value / maxValue) * availableHeight;
            const x = index * (barWidth + BAR_PADDING);
            const y = availableHeight - barHeight;
            
            // Determine bar color
            let fill = mergedPalette.barDefault;
            if (isCurrentPosition) {
              fill = mergedPalette.gnomeStep;
            } else if (isComparing) {
              fill = direction === 'backward' ? mergedPalette.barSwap : mergedPalette.barComparing;
            } else if (isHighlighted) {
              fill = mergedPalette.barHighlight;
            }
            
            return (
              <rect
                key={`bar-${index}`}
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                fill={fill}
                stroke={(isHighlighted || isCurrentPosition || isComparing) ? '#000' : 'none'}
                strokeWidth={(isHighlighted || isCurrentPosition || isComparing) ? 1 : 0}
                style={{ transition: 'all 0.3s ease-in-out' }}
              />
            );
          })}
          
          {/* Direction indicator */}
          {position !== undefined && direction && (
            <g>
              {/* Movement arrow */}
              <path
                d={
                  direction === 'forward'
                    ? `M${position * (barWidth + BAR_PADDING) + barWidth / 2},${availableHeight + 15} 
                       l10,0 l-5,-8 z`
                    : `M${position * (barWidth + BAR_PADDING) + barWidth / 2},${availableHeight + 15} 
                       l-10,0 l5,-8 z`
                }
                fill={direction === 'forward' ? mergedPalette.barDefault : mergedPalette.gnomeStep}
                stroke="none"
              />
              
              {/* Position indicator line */}
              <line
                x1={position * (barWidth + BAR_PADDING) + barWidth / 2}
                y1={availableHeight + 5}
                x2={position * (barWidth + BAR_PADDING) + barWidth / 2}
                y2={availableHeight + 25}
                stroke={mergedPalette.gnomeStep}
                strokeWidth={2}
              />
            </g>
          )}
        </g>
        
        {/* Labels */}
        {showLabels && renderLabels()}
      </svg>
    );
  };

  /**
   * Renders the cocktail sort visualization - specialized for bidirectional passes
   * @returns {JSX.Element} SVG-based visualization
   * @private
   */
  const renderCocktailVisualization = () => {
    const { direction, rangeLow, rangeHigh, comparing } = transformState;
    
    return (
      <svg width={width} height={height} ref={svgRef}>
        {/* Background and grid */}
        {showGrid && renderGrid()}
        
        {/* Axes */}
        {showAxes && renderAxes()}
        
        {/* Direction indicator */}
        <rect
          x={0}
          y={0}
          width={width}
          height={AXIS_PADDING - 5}
          fill={direction === 'forward' ? mergedPalette.cocktailDirection : mergedPalette.barHighlight}
          opacity={0.2}
        />
        
        <text
          x={width / 2}
          y={AXIS_PADDING - 10}
          textAnchor="middle"
          fill={mergedPalette.textPrimary}
          fontSize={14}
          fontWeight="bold"
        >
          {direction === 'forward' ? 'Forward Pass' : 'Backward Pass'}
        </text>
        
        {/* Base array visualization */}
        <g transform={`translate(${AXIS_PADDING}, ${AXIS_PADDING})`}>
          {/* Active range indicator */}
          {rangeLow !== undefined && rangeHigh !== undefined && (
            <rect
              x={rangeLow * (barWidth + BAR_PADDING)}
              y={0}
              width={(rangeHigh - rangeLow + 1) * (barWidth + BAR_PADDING) - BAR_PADDING}
              height={availableHeight}
              fill={direction === 'forward' ? mergedPalette.cocktailDirection : mergedPalette.barHighlight}
              opacity={0.1}
            />
          )}
          
          {/* Render the array bars */}
          {renderedData.map((value, index) => {
            const isHighlighted = highlightedIndices.includes(index);
            const isComparing = comparing && comparing.includes(index);
            const isInActiveRange = rangeLow !== undefined && 
              rangeHigh !== undefined && 
              index >= rangeLow && 
              index <= rangeHigh;
            
            // Calculate bar properties
            const barHeight = (value / maxValue) * availableHeight;
            const x = index * (barWidth + BAR_PADDING);
            const y = availableHeight - barHeight;
            
            // Determine bar color
            let fill = mergedPalette.barDefault;
            if (isComparing) {
              fill = mergedPalette.cocktailDirection;
            } else if (isHighlighted) {
              fill = mergedPalette.barHighlight;
            } else if (isInActiveRange) {
              fill = mergedPalette.barDefault;
            } else {
              fill = mergedPalette.barSorted; // Elements outside the range are sorted
            }
            
            return (
              <rect
                key={`bar-${index}`}
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                fill={fill}
                stroke={(isHighlighted || isComparing) ? '#000' : 'none'}
                strokeWidth={(isHighlighted || isComparing) ? 1 : 0}
                style={{ transition: 'all 0.3s ease-in-out' }}
              />
            );
          })}
          
          {/* Direction arrow */}
          {direction && (
            <path
              d={
                direction === 'forward'
                  ? `M${rangeLow * (barWidth + BAR_PADDING)},${availableHeight + 15} 
                     H${rangeHigh * (barWidth + BAR_PADDING) + barWidth} 
                     l-8,-5 v10 l8,-5`
                  : `M${rangeHigh * (barWidth + BAR_PADDING) + barWidth},${availableHeight + 15} 
                     H${rangeLow * (barWidth + BAR_PADDING)} 
                     l8,-5 v10 l-8,-5`
              }
              fill="none"
              stroke={direction === 'forward' ? mergedPalette.cocktailDirection : mergedPalette.barHighlight}
              strokeWidth={2}
            />
          )}
        </g>
        
        {/* Labels */}
        {showLabels && renderLabels()}
      </svg>
    );
  };

  /**
   * Renders a generic transformation visualization for algorithms not specifically handled
   * @returns {JSX.Element} SVG-based visualization
   * @private
   */
  const renderGenericVisualization = () => {
    return (
      <svg width={width} height={height} ref={svgRef}>
        {/* Background and grid */}
        {showGrid && renderGrid()}
        
        {/* Axes */}
        {showAxes && renderAxes()}
        
        {/* Base array visualization */}
        <g transform={`translate(${AXIS_PADDING}, ${AXIS_PADDING})`}>
          {/* Render the array bars */}
          {renderedData.map((value, index) => {
            const isHighlighted = highlightedIndices.includes(index);
            
            // Calculate bar properties
            const barHeight = (value / maxValue) * availableHeight;
            const x = index * (barWidth + BAR_PADDING);
            const y = availableHeight - barHeight;
            
            // Determine bar color
            const fill = isHighlighted ? mergedPalette.barHighlight : mergedPalette.barDefault;
            
            return (
              <rect
                key={`bar-${index}`}
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                fill={fill}
                stroke={isHighlighted ? '#000' : 'none'}
                strokeWidth={isHighlighted ? 1 : 0}
                style={{ transition: 'all 0.3s ease-in-out' }}
              />
            );
          })}
        </g>
        
        {/* Labels */}
        {showLabels && renderLabels()}
      </svg>
    );
  };

  /**
   * Renders the grid for the visualization background
   * @returns {JSX.Element} SVG grid
   * @private
   */
  const renderGrid = () => {
    const gridSize = 20;
    const horizontalLines = Math.floor(height / gridSize);
    const verticalLines = Math.floor(width / gridSize);
    
    return (
      <g className="grid">
        {/* Horizontal grid lines */}
        {Array.from({length: horizontalLines}).map((_, i) => (
          <line
            key={`h-grid-${i}`}
            x1={0}
            y1={i * gridSize}
            x2={width}
            y2={i * gridSize}
            stroke={mergedPalette.gridLines}
            strokeWidth={0.5}
          />
        ))}
        
        {/* Vertical grid lines */}
        {Array.from({length: verticalLines}).map((_, i) => (
          <line
            key={`v-grid-${i}`}
            x1={i * gridSize}
            y1={0}
            x2={i * gridSize}
            y2={height}
            stroke={mergedPalette.gridLines}
            strokeWidth={0.5}
          />
        ))}
      </g>
    );
  };

  /**
   * Renders axes for the visualization
   * @returns {JSX.Element} SVG axes
   * @private
   */
  const renderAxes = () => {
    return (
      <g className="axes">
        {/* X axis */}
        <line
          x1={AXIS_PADDING}
          y1={height - AXIS_PADDING}
          x2={width - AXIS_PADDING}
          y2={height - AXIS_PADDING}
          stroke={mergedPalette.axisLines}
          strokeWidth={1}
        />
        
        {/* Y axis */}
        <line
          x1={AXIS_PADDING}
          y1={AXIS_PADDING}
          x2={AXIS_PADDING}
          y2={height - AXIS_PADDING}
          stroke={mergedPalette.axisLines}
          strokeWidth={1}
        />
        
        {/* Axis labels */}
        <text
          x={width / 2}
          y={height - 10}
          textAnchor="middle"
          fill={mergedPalette.textPrimary}
          fontSize={12}
        >
          Element Index
        </text>
        
        <text
          x={15}
          y={height / 2}
          textAnchor="middle"
          transform={`rotate(-90, 15, ${height / 2})`}
          fill={mergedPalette.textPrimary}
          fontSize={12}
        >
          Element Value
        </text>
      </g>
    );
  };

  /**
   * Renders value labels for the array elements
   * @returns {JSX.Element} SVG labels
   * @private
   */
  const renderLabels = () => {
    return (
      <g className="labels" transform={`translate(${AXIS_PADDING}, ${AXIS_PADDING})`}>
        {renderedData.map((value, index) => {
          // Skip labels if there are too many elements to display clearly
          if (renderedData.length > 30 && !highlightedIndices.includes(index)) {
            return null;
          }
          
          const x = index * (barWidth + BAR_PADDING) + barWidth / 2;
          const y = availableHeight + LABEL_HEIGHT - 5;
          
          return (
            <text
              key={`label-${index}`}
              x={x}
              y={y}
              textAnchor="middle"
              fill={mergedPalette.textPrimary}
              fontSize={10}
            >
              {value}
            </text>
          );
        })}
      </g>
    );
  };

  return (
    <div
      className="transform-visualizer"
      ref={containerRef}
      style={{
        width: width,
        height: height,
        position: 'relative',
        backgroundColor: mergedPalette.background,
        overflow: 'hidden',
        borderRadius: '4px',
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)'
      }}
    >
      {renderTransformVisualization()}
      
      {/* Algorithm message/description overlay */}
      {transformState.message && (
        <div
          className="transform-message"
          style={{
            position: 'absolute',
            bottom: 10,
            left: 10,
            right: 10,
            padding: '8px 12px',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            color: '#fff',
            borderRadius: '4px',
            fontSize: '14px',
            maxWidth: '90%',
            maxHeight: '80px',
            overflow: 'auto'
          }}
        >
          {transformState.message}
        </div>
      )}
    </div>
  );
};

// PropTypes validation
TransformVisualizer.propTypes = {
  /**
   * Array of numerical values to visualize
   */
  data: PropTypes.arrayOf(PropTypes.number).isRequired,
  
  /**
   * Type of transformation being visualized (from TRANSFORM_TYPES)
   */
  transformationType: PropTypes.oneOf(Object.values(TRANSFORM_TYPES)).isRequired,
  
  /**
   * Current step index in the algorithm execution
   */
  currentStep: PropTypes.number.isRequired,
  
  /**
   * Array of step history data from algorithm execution
   */
  stepHistory: PropTypes.arrayOf(PropTypes.object).isRequired,
  
  /**
   * Width of the visualization component
   */
  width: PropTypes.number,
  
  /**
   * Height of the visualization component
   */
  height: PropTypes.number,
  
  /**
   * Custom color palette overrides
   */
  colorPalette: PropTypes.object,
  
  /**
   * Duration of animations in milliseconds
   */
  animationDuration: PropTypes.number,
  
  /**
   * Whether to show value labels
   */
  showLabels: PropTypes.bool,
  
  /**
   * Whether to show coordinate axes
   */
  showAxes: PropTypes.bool,
  
  /**
   * Whether to show background grid
   */
  showGrid: PropTypes.bool
};

// Default props
TransformVisualizer.defaultProps = {
  width: 600,
  height: 400,
  colorPalette: {},
  animationDuration: 300,
  showLabels: true,
  showAxes: true,
  showGrid: false
};

export { TransformVisualizer, TRANSFORM_TYPES };
