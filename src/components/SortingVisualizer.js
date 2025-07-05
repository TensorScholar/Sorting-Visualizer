/**
 * Advanced Sorting Algorithm Visualization Platform
 * Main Visualization Component
 * 
 * This component orchestrates algorithm execution, visualization rendering,
 * and interactive controls for educational exploration of sorting algorithms.
 * It implements a comprehensive visualization architecture with configurable
 * rendering strategies, adaptive display modes, and algorithm-specific visualizations.
 * 
 * @module SortingVisualizer
 * @author Advanced Algorithm Visualization Team
 * @version 2.0.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { WebGLRenderer } from '../visualization/renderers/webgl-renderer';
import { ArrayRenderer } from '../visualization/renderers/array-renderer';
import { generateDataSet } from '../data/generators';
import HeapVisualizer from '../visualization/components/HeapVisualizer';
import './SortingVisualizer.css';

/**
 * SortingVisualizer Component
 * 
 * Renders an interactive sorting algorithm visualization interface
 * with configurable algorithm selection, data generation, execution controls,
 * and specialized visualization modes for different algorithm types.
 * 
 * @param {Object} props - Component properties
 * @param {Object} props.algorithm - Algorithm instance to visualize
 * @param {Object} props.options - Visualization configuration options
 * @param {number} props.width - Canvas width
 * @param {number} props.height - Canvas height
 */
const SortingVisualizer = ({ 
  algorithm, 
  options = {},
  width = 800,
  height = 400
}) => {
  // Canvas references
  const canvasRef = useRef(null);
  const fallbackCanvasRef = useRef(null);
  
  // Visualization state
  const [renderer, setRenderer] = useState(null);
  const [data, setData] = useState([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [totalSteps, setTotalSteps] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [metrics, setMetrics] = useState({});
  const [selectedDataSet, setSelectedDataSet] = useState('random');
  const [dataSize, setDataSize] = useState(30);
  const [renderMode, setRenderMode] = useState('webgl');
  
  // Additional visualization state
  const [heapStructure, setHeapStructure] = useState(null);
  const [showHeapView, setShowHeapView] = useState(false);
  const [currentStepData, setCurrentStepData] = useState(null);
  const [algorithmType, setAlgorithmType] = useState('comparison');
  
  // Animation references
  const animationRef = useRef(null);
  const stepHistoryRef = useRef([]);

  /**
   * Detects the algorithm type to configure appropriate visualizations
   * 
   * @param {Object} algorithmInstance - The algorithm to analyze
   */
  const detectAlgorithmType = useCallback((algorithmInstance) => {
    if (!algorithmInstance) return 'comparison';
    
    // Determine algorithm type based on name and category
    const name = algorithmInstance.name || '';
    const category = algorithmInstance.category || '';
    
    if (name === 'Heap Sort' || name.toLowerCase().includes('heap')) {
      setShowHeapView(true);
      return 'heap';
    } else if (category === 'distribution' || 
               name.toLowerCase().includes('bucket') || 
               name.toLowerCase().includes('counting') || 
               name.toLowerCase().includes('radix')) {
      return 'distribution';
    } else if (category === 'network' || 
               name.toLowerCase().includes('bitonic') || 
               name.toLowerCase().includes('merge-network')) {
      return 'network';
    } else if (name.toLowerCase().includes('selection') || 
               name.toLowerCase().includes('quickselect') || 
               name.toLowerCase().includes('median')) {
      return 'selection';
    }
    
    return 'comparison';
  }, []);
  
  /**
   * Initialize the renderer with current options and canvas references
   */
  const initializeRenderer = useCallback(() => {
    const canvas = canvasRef.current;
    const fallbackCanvas = fallbackCanvasRef.current;
    
    if (!canvas || !fallbackCanvas) return;
    
    try {
      let newRenderer;
      
      if (renderMode === 'webgl') {
        try {
          newRenderer = new WebGLRenderer(canvas, {
            ...options,
            maxElements: 100000,
            colorScheme: options.colorScheme || 'spectrum',
            barWidth: options.barWidth || 4,
            spacing: options.spacing || 1
          });
          
          // Hide fallback canvas
          canvas.style.display = 'block';
          fallbackCanvas.style.display = 'none';
        } catch (e) {
          console.warn('WebGL renderer initialization failed, falling back to Canvas renderer', e);
          setRenderMode('canvas');
          throw e; // Force fallback
        }
      }
      
      if (renderMode === 'canvas') {
        newRenderer = new ArrayRenderer(fallbackCanvas, {
          ...options,
          maxElements: 10000,
          colorScheme: options.colorScheme || 'spectrum',
          barWidth: options.barWidth || 4,
          spacing: options.spacing || 1
        });
        
        // Hide WebGL canvas
        canvas.style.display = 'none';
        fallbackCanvas.style.display = 'block';
      }
      
      setRenderer(newRenderer);
      
      // Update data if we have it
      if (data.length > 0 && newRenderer) {
        newRenderer.setData(data);
      }
    } catch (e) {
      console.error('Failed to initialize renderer', e);
    }
  }, [data, options, renderMode]);
  
  /**
   * Generate initial data based on selected parameters
   */
  const generateInitialData = useCallback(() => {
    const newData = generateDataSet(selectedDataSet, dataSize, {
      min: 1,
      max: 100,
      ...options
    });
    
    setData(newData);
    
    if (renderer) {
      renderer.setData(newData);
    }
  }, [dataSize, options, renderer, selectedDataSet]);
  
  // Initialize renderer and data
  useEffect(() => {
    // Initialize algorithm type
    const detectedType = detectAlgorithmType(algorithm);
    setAlgorithmType(detectedType);
    
    // Initialize data
    generateInitialData();
    
    // Initialize renderer
    initializeRenderer();
    
    // Window resize event
    const handleResize = () => {
      if (renderer) {
        renderer.resize();
      }
    };
    
    window.addEventListener('resize', handleResize);
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      if (renderer) {
        renderer.dispose();
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  
  // Update renderer when options or render mode changes
  useEffect(() => {
    if (renderer) {
      renderer.setOptions({
        colorScheme: options.colorScheme || 'spectrum',
        barWidth: options.barWidth || 4,
        spacing: options.spacing || 1,
        ...options
      });
    }
  }, [options, renderer]);
  
  // Update data when algorithm execution completes
  useEffect(() => {
    if (algorithm && data.length > 0) {
      executeAlgorithm();
    }
  }, [algorithm, data.length, selectedDataSet, dataSize]); // eslint-disable-line react-hooks/exhaustive-deps
  
  // Detect if algorithm is Heap Sort to enable heap visualization
  useEffect(() => {
    if (algorithm) {
      const detectedType = detectAlgorithmType(algorithm);
      setAlgorithmType(detectedType);
      setShowHeapView(detectedType === 'heap');
    }
  }, [algorithm]); // eslint-disable-line react-hooks/exhaustive-deps
  
  // Update heap structure when step changes
  useEffect(() => {
    if (currentStepData && currentStepData.heapStructure) {
      setHeapStructure(currentStepData.heapStructure);
    } else if (currentStepData && currentStepData.heap_structure) {
      // Handle Python-style property naming
      setHeapStructure(currentStepData.heap_structure);
    } else if (showHeapView && currentStep === 0) {
      // Reset heap view when returning to first step
      setHeapStructure(null);
    }
  }, [currentStepData, showHeapView, currentStep]);
  
  /**
   * Execute the current algorithm on the data
   */
  const executeAlgorithm = useCallback(async () => {
    if (!algorithm || data.length === 0) return;
    
    // Reset visualization state
    setIsPlaying(false);
    setCurrentStep(0);
    stepHistoryRef.current = [];
    setHeapStructure(null);
    
    // Clone the data to avoid mutation issues
    const dataToSort = [...data];
    
    try {
      // Execute algorithm with instrumentation
      const startTime = performance.now();
      
      const result = await algorithm.execute(dataToSort, {
        onStep: (step) => {
          stepHistoryRef.current.push(step);
        }
      });
      
      const endTime = performance.now();
      
      // Update state with results
      setMetrics({
        ...algorithm.getMetrics(),
        executionTime: endTime - startTime
      });
      
      setTotalSteps(stepHistoryRef.current.length);
      
      // Update renderer with sorted data
      if (renderer) {
        renderer.setData(result);
      }
      
    } catch (error) {
      console.error('Algorithm execution failed', error);
    }
  }, [algorithm, data, renderer]);
  
  /**
   * Handle step navigation (forward/backward)
   * 
   * @param {number} step - Target step index
   */
  const navigateStep = useCallback((step) => {
    if (step < 0 || step >= stepHistoryRef.current.length) return;
    
    setCurrentStep(step);
    
    const stepData = stepHistoryRef.current[step];
    setCurrentStepData(stepData);
    
    if (renderer && stepData) {
      // Update renderer with current step data
      renderer.setData(stepData.array, false);
      
      // Highlight relevant elements
      if (stepData.type === 'comparison' && stepData.indices) {
        renderer.markComparing(stepData.indices);
      } else if (stepData.type === 'swap' && stepData.indices) {
        renderer.highlight(stepData.indices);
      } else if (stepData.type === 'sorted' && stepData.indices) {
        renderer.markSorted(stepData.indices);
      } else if (stepData.type === 'heapify' && stepData.node !== undefined) {
        // For heap sort, highlight the current node being heapified
        renderer.highlight([stepData.node]);
        
        // Also highlight children if available
        if (stepData.children && stepData.children.length) {
          renderer.markComparing(stepData.children);
        }
      } else if (stepData.type === 'heapify-swap' && stepData.indices) {
        renderer.highlight(stepData.indices);
      }
    }
  }, [renderer]);
  
  /**
   * Start or stop animation playback
   */
  const togglePlayback = useCallback(() => {
    const newPlayingState = !isPlaying;
    setIsPlaying(newPlayingState);
    
    if (newPlayingState) {
      // Start animation
      const lastTimestamp = performance.now();
      const animate = (timestamp) => {
        if (!isPlaying) return;
        
        // Control animation speed
        const elapsed = timestamp - lastTimestamp;
        
        if (elapsed > (1000 / (playbackSpeed * 10))) {
          // Time to advance step
          const nextStep = (currentStep + 1) % (totalSteps || 1);
          
          if (nextStep === 0) {
            // Reached the end, stop playback
            setIsPlaying(false);
            return;
          }
          
          navigateStep(nextStep);
        }
        
        animationRef.current = requestAnimationFrame(animate);
      };
      
      animationRef.current = requestAnimationFrame(animate);
    } else {
      // Stop animation
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    }
  }, [currentStep, isPlaying, navigateStep, playbackSpeed, totalSteps]);
  
  /**
   * Change the data set type
   * 
   * @param {Event} event - Change event
   */
  const handleDataSetChange = useCallback((event) => {
    setSelectedDataSet(event.target.value);
  }, []);
  
  /**
   * Change the data set size
   * 
   * @param {Event} event - Change event
   */
  const handleSizeChange = useCallback((event) => {
    setDataSize(parseInt(event.target.value));
  }, []);
  
  /**
   * Regenerate data with current settings
   */
  const handleRegenerateData = useCallback(() => {
    generateInitialData();
  }, [generateInitialData]);
  
  /**
   * Change the render mode
   * 
   * @param {Event} event - Change event
   */
  const handleRenderModeChange = useCallback((event) => {
    setRenderMode(event.target.value);
    
    // We need to initialize a new renderer
    setTimeout(() => {
      initializeRenderer();
    }, 0);
  }, [initializeRenderer]);
  
  return (
    <div className="sorting-visualizer">
      <div className="visualization-container">
        <canvas 
          ref={canvasRef}
          width={width}
          height={height}
          className="visualization-canvas"
        />
        <canvas
          ref={fallbackCanvasRef}
          width={width}
          height={height}
          className="visualization-canvas fallback"
        />
        
        {algorithm && (
          <div className="algorithm-info">
            <h3>{algorithm.name}</h3>
            <div className="complexity-info">
              <div>Time: {algorithm.getComplexity().time.average}</div>
              <div>Space: {algorithm.getComplexity().space.average}</div>
              <div>Stable: {algorithm.isStable() ? 'Yes' : 'No'}</div>
            </div>
          </div>
        )}
        
        {/* Heap visualization when appropriate */}
        {showHeapView && heapStructure && (
          <div className="heap-view-container">
            <h4>Binary Heap Structure</h4>
            <HeapVisualizer 
              heapStructure={heapStructure} 
              width={width} 
              height={300} 
            />
          </div>
        )}
      </div>
      
      <div className="controls-container">
        <div className="playback-controls">
          <button 
            onClick={() => navigateStep(0)}
            disabled={currentStep === 0 || isPlaying}
          >
            <span role="img" aria-label="First Step">⏮️</span> First
          </button>
          <button 
            onClick={() => navigateStep(currentStep - 1)}
            disabled={currentStep === 0 || isPlaying}
          >
            <span role="img" aria-label="Previous Step">⏪</span> Prev
          </button>
          <button onClick={togglePlayback}>
            {isPlaying ? 
              <span role="img" aria-label="Pause">⏸️</span> : 
              <span role="img" aria-label="Play">▶️</span>
            } {isPlaying ? 'Pause' : 'Play'}
          </button>
          <button 
            onClick={() => navigateStep(currentStep + 1)}
            disabled={currentStep >= totalSteps - 1 || isPlaying}
          >
            <span role="img" aria-label="Next Step">⏩</span> Next
          </button>
          <button 
            onClick={() => navigateStep(totalSteps - 1)}
            disabled={currentStep >= totalSteps - 1 || isPlaying}
          >
            <span role="img" aria-label="Last Step">⏭️</span> Last
          </button>
        </div>
        
        <div className="speed-control">
          <label>Speed: </label>
          <input
            type="range"
            min="0.1"
            max="10"
            step="0.1"
            value={playbackSpeed}
            onChange={(e) => setPlaybackSpeed(parseFloat(e.target.value))}
            disabled={isPlaying}
          />
          <span>{playbackSpeed.toFixed(1)}x</span>
        </div>
        
        <div className="progress-indicator">
          <div className="step-counter">
            Step: {currentStep} / {totalSteps}
          </div>
          <progress value={currentStep} max={totalSteps || 100} />
        </div>
        
        <div className="data-controls">
          <div className="control-group">
            <label>Data Type:</label>
            <select value={selectedDataSet} onChange={handleDataSetChange} disabled={isPlaying}>
              <option value="random">Random</option>
              <option value="nearly-sorted">Nearly Sorted</option>
              <option value="reversed">Reversed</option>
              <option value="few-unique">Few Unique Values</option>
              <option value="sorted">Already Sorted</option>
              <option value="sawtooth">Sawtooth Pattern</option>
            </select>
          </div>
          
          <div className="control-group">
            <label>Size:</label>
            <select value={dataSize} onChange={handleSizeChange} disabled={isPlaying}>
              <option value="10">Tiny (10)</option>
              <option value="30">Small (30)</option>
              <option value="50">Medium (50)</option>
              <option value="100">Large (100)</option>
              <option value="250">X-Large (250)</option>
              <option value="1000">Huge (1,000)</option>
              <option value="10000">Extreme (10,000)</option>
            </select>
          </div>
          
          <div className="control-group">
            <label>Renderer:</label>
            <select value={renderMode} onChange={handleRenderModeChange} disabled={isPlaying}>
              <option value="webgl">WebGL (Fast)</option>
              <option value="canvas">Canvas (Compatible)</option>
            </select>
          </div>
          
          <button onClick={handleRegenerateData} disabled={isPlaying}>
            Regenerate Data
          </button>
        </div>
        
        {metrics && Object.keys(metrics).length > 0 && (
          <div className="metrics-panel">
            <h4>Performance Metrics</h4>
            <div className="metrics-grid">
              <div className="metric">
                <label>Comparisons:</label>
                <span>{metrics.comparisons?.toLocaleString()}</span>
              </div>
              <div className="metric">
                <label>Swaps:</label>
                <span>{metrics.swaps?.toLocaleString()}</span>
              </div>
              <div className="metric">
                <label>Array Accesses:</label>
                <span>{(metrics.reads + metrics.writes)?.toLocaleString()}</span>
              </div>
              <div className="metric">
                <label>Execution Time:</label>
                <span>{metrics.executionTime?.toFixed(2)} ms</span>
              </div>
            </div>
          </div>
        )}
        
        {currentStepData && (
          <div className="step-info">
            <h4>Current Step</h4>
            <div className="step-message">{currentStepData.message || 'No message for this step'}</div>
            <div className="step-details">
              <div>Type: {currentStepData.type || 'unknown'}</div>
              {currentStepData.indices && (
                <div>Indices: {currentStepData.indices.join(', ')}</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SortingVisualizer;