// src/components/AlgorithmComparison.js

import React, { useState, useEffect, useRef } from 'react';
import { WebGLRenderer } from '../visualization/renderers/webgl-renderer';
import { generateDataSet } from '../data/generators';
import HeapVisualizer from '../visualization/components/HeapVisualizer';
import PythonJSBridge from '../utils/python-js-bridge';

// Import algorithms
import BubbleSort from '../algorithms/comparison/bubble';
import MergeSort from '../algorithms/comparison/merge';
import QuickSort from '../algorithms/comparison/quick';
import HeapSort from '../algorithms/comparison/heap';

/**
 * Side-by-side comparison of JavaScript and Python algorithm implementations
 * Visualizes execution metrics, performance differences, and step-by-step execution
 */
const AlgorithmComparison = ({ width = 1200, height = 600 }) => {
  // Algorithm selection
  const [selectedAlgorithm, setSelectedAlgorithm] = useState('merge-sort');
  const [jsImplementation, setJsImplementation] = useState(null);
  
  // Data configuration
  const [selectedDataSet, setSelectedDataSet] = useState('random');
  const [dataSize, setDataSize] = useState(50);
  const [data, setData] = useState([]);
  
  // Visualization state
  const [jsRenderer, setJsRenderer] = useState(null);
  const [pyRenderer, setPyRenderer] = useState(null);
  const [comparison, setComparison] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [maxSteps, setMaxSteps] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  
  // Heap visualization state
  const [heapStructureData, setHeapStructureData] = useState(null);
  
  // Canvas references
  const jsCanvasRef = useRef(null);
  const pyCanvasRef = useRef(null);
  
  // Animation reference
  const animationRef = useRef(null);
  
  // Bridge for Python communication
  const bridgeRef = useRef(null);
  
  // Initialize bridge and data
  useEffect(() => {
    bridgeRef.current = new PythonJSBridge({ debug: true });
    generateInitialData();
    
    return () => {
      // Cleanup
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);
  
  // Initialize renderers when canvas refs are available
  useEffect(() => {
    if (jsCanvasRef.current && pyCanvasRef.current) {
      initializeRenderers();
    }
  }, [jsCanvasRef.current, pyCanvasRef.current]);
  
  // Update implementation when algorithm changes
  useEffect(() => {
    updateAlgorithmImplementation();
  }, [selectedAlgorithm]);
  
  // Run comparison when data or algorithm changes
  useEffect(() => {
    if (jsImplementation && data.length > 0) {
      runComparison();
    }
  }, [jsImplementation, data]);
  
  // Update heap structure data when step changes
  useEffect(() => {
    if (comparison && currentStep < comparison.jsHistory.length) {
      const stepData = comparison.jsHistory[currentStep];
      
      // Check if the current step has heap structure data
      if (stepData && (stepData.heapStructure || stepData.heap_structure)) {
        setHeapStructureData(stepData.heapStructure || stepData.heap_structure);
      }
    }
  }, [comparison, currentStep]);
  
  /**
   * Initialize WebGL renderers for both JS and Python visualizations
   */
  const initializeRenderers = () => {
    if (!jsCanvasRef.current || !pyCanvasRef.current) return;
    
    try {
      // Create JavaScript implementation renderer
      const jsRenderer = new WebGLRenderer(jsCanvasRef.current, {
        colorScheme: 'spectrum',
        barWidth: 8,
        spacing: 2,
        background: [0.1, 0.1, 0.2, 1.0]
      });
      setJsRenderer(jsRenderer);
      
      // Create Python implementation renderer
      const pyRenderer = new WebGLRenderer(pyCanvasRef.current, {
        colorScheme: 'heatmap',
        barWidth: 8,
        spacing: 2,
        background: [0.1, 0.2, 0.1, 1.0]
      });
      setPyRenderer(pyRenderer);
      
      // Set initial data if available
      if (data.length > 0) {
        jsRenderer.setData(data);
        pyRenderer.setData(data);
      }
    } catch (error) {
      console.error('Failed to initialize renderers:', error);
    }
  };
  
  /**
   * Generate initial data based on selected parameters
   */
  const generateInitialData = () => {
    const newData = generateDataSet(selectedDataSet, dataSize, {
      min: 5,
      max: 100
    });
    
    setData(newData);
    
    // Update renderers if available
    if (jsRenderer) {
      jsRenderer.setData(newData);
    }
    
    if (pyRenderer) {
      pyRenderer.setData(newData);
    }
  };
  
  /**
   * Update the active algorithm implementation
   */
  const updateAlgorithmImplementation = () => {
    let implementation;
    
    switch (selectedAlgorithm) {
      case 'bubble-sort':
        implementation = new BubbleSort({ optimize: true, adaptive: true });
        break;
      case 'quick-sort':
        implementation = new QuickSort({
          pivotStrategy: 'median-of-three',
          insertionThreshold: 10
        });
        break;
      case 'merge-sort':
        implementation = new MergeSort({
          bottomUp: false,
          adaptive: true,
          insertionThreshold: 10
        });
        break;
      case 'heap-sort':
        implementation = new HeapSort({
          visualizeHeap: true,
          optimizeLeafChecks: true
        });
        break;
      default:
        implementation = new MergeSort();
    }
    
    setJsImplementation(implementation);
  };
  
  /**
   * Run comparison between JavaScript and Python implementations
   */
  const runComparison = async () => {
    if (!jsImplementation || !bridgeRef.current) return;
    
    try {
      // Reset visualization state
      setIsPlaying(false);
      setCurrentStep(0);
      setHeapStructureData(null);
      
      // Run comparison
      const result = await bridgeRef.current.compareImplementations(
        jsImplementation,
        selectedAlgorithm,
        data,
        jsImplementation.options
      );
      
      setComparison(result);
      
      // Update max steps for animation
      const maxSteps = Math.min(
        result.jsHistory.length,
        result.pyHistory.length
      );
      setMaxSteps(maxSteps);
      
      // Update renderers with initial state
      if (jsRenderer && pyRenderer) {
        jsRenderer.setData(data);
        pyRenderer.setData(data);
      }
    } catch (error) {
      console.error('Comparison failed:', error);
    }
  };
  
  /**
   * Navigate to a specific step in the algorithm execution
   */
  const navigateToStep = (step) => {
    if (!comparison || step < 0 || step >= maxSteps) return;
    
    setCurrentStep(step);
    
    // Update renderers with step data
    const jsState = comparison.jsHistory[step];
    const pyState = comparison.pyHistory[step];
    
    if (jsRenderer && jsState) {
      jsRenderer.setData(jsState.array);
      
      // Update highlights based on operation type
      if (jsState.type === 'comparison' && jsState.indices) {
        jsRenderer.markComparing(jsState.indices);
      } else if (jsState.type === 'swap' && jsState.indices) {
        jsRenderer.highlight(jsState.indices);
      } else if (jsState.type === 'sorted' && jsState.indices) {
        jsRenderer.markSorted(jsState.indices);
      }
      
      // Update heap structure data if available
      if (jsState.heapStructure || jsState.heap_structure) {
        setHeapStructureData(jsState.heapStructure || jsState.heap_structure);
      }
    }
    
    if (pyRenderer && pyState) {
      pyRenderer.setData(pyState.array);
      
      // Update highlights based on operation type
      if (pyState.type === 'comparison' && pyState.indices) {
        pyRenderer.markComparing(pyState.indices);
      } else if (pyState.type === 'swap' && pyState.indices) {
        pyRenderer.highlight(pyState.indices);
      } else if (pyState.type === 'sorted' && pyState.indices) {
        pyRenderer.markSorted(pyState.indices);
      }
    }
  };
  
  /**
   * Toggle animation playback
   */
  const togglePlayback = () => {
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
          const nextStep = (currentStep + 1) % maxSteps;
          
          if (nextStep === 0) {
            // Reached the end, stop playback
            setIsPlaying(false);
            return;
          }
          
          navigateToStep(nextStep);
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
  };
  
  /**
   * Handle algorithm selection change
   */
  const handleAlgorithmChange = (e) => {
    setSelectedAlgorithm(e.target.value);
  };
  
  /**
   * Handle data set type change
   */
  const handleDataSetChange = (e) => {
    setSelectedDataSet(e.target.value);
  };
  
  /**
   * Handle data size change
   */
  const handleSizeChange = (e) => {
    setDataSize(parseInt(e.target.value));
  };
  
  /**
   * Regenerate data with current settings
   */
  const handleRegenerateData = () => {
    generateInitialData();
  };
  
  /**
   * Format time in ms for display
   */
  const formatTime = (timeMs) => {
    return timeMs < 1 ? 
      `${(timeMs * 1000).toFixed(2)} μs` : 
      `${timeMs.toFixed(2)} ms`;
  };
  
  /**
   * Get color for metric comparison
   */
  const getComparisonColor = (jsValue, pyValue) => {
    const diff = jsValue - pyValue;
    if (Math.abs(diff) < 0.01) return 'text-gray-700';
    return diff < 0 ? 'text-green-600' : 'text-red-600'; 
  };
  
  /**
   * Determine if heap visualization should be shown
   */
  const shouldShowHeapVisualization = () => {
    return selectedAlgorithm === 'heap-sort' && heapStructureData !== null;
  };
  
  return (
    <div className="algorithm-comparison">
      <h2 className="text-2xl font-bold mb-4">JavaScript vs Python Implementation Comparison</h2>
      
      <div className="controls mb-6 grid grid-cols-4 gap-4">
        <div className="control-group">
          <label className="block text-sm font-medium mb-1">Algorithm:</label>
          <select 
            value={selectedAlgorithm}
            onChange={handleAlgorithmChange}
            className="w-full p-2 border rounded"
            disabled={isPlaying}
          >
            <option value="merge-sort">Merge Sort</option>
            <option value="quick-sort">Quick Sort</option>
            <option value="bubble-sort">Bubble Sort</option>
            <option value="heap-sort">Heap Sort</option>
          </select>
        </div>
        
        <div className="control-group">
          <label className="block text-sm font-medium mb-1">Data Type:</label>
          <select 
            value={selectedDataSet}
            onChange={handleDataSetChange}
            className="w-full p-2 border rounded"
            disabled={isPlaying}
          >
            <option value="random">Random</option>
            <option value="nearly-sorted">Nearly Sorted</option>
            <option value="reversed">Reversed</option>
            <option value="few-unique">Few Unique Values</option>
            <option value="sorted">Already Sorted</option>
          </select>
        </div>
        
        <div className="control-group">
          <label className="block text-sm font-medium mb-1">Size:</label>
          <select 
            value={dataSize}
            onChange={handleSizeChange}
            className="w-full p-2 border rounded"
            disabled={isPlaying}
          >
            <option value="10">10 elements</option>
            <option value="25">25 elements</option>
            <option value="50">50 elements</option>
            <option value="100">100 elements</option>
            <option value="250">250 elements</option>
          </select>
        </div>
        
        <div className="control-group flex items-end">
          <button 
            onClick={handleRegenerateData}
            className="w-full p-2 bg-blue-600 text-white rounded"
            disabled={isPlaying}
          >
            Regenerate Data
          </button>
        </div>
      </div>
      
      {/* Heap visualization if applicable */}
      {shouldShowHeapVisualization() && (
        <div className="heap-visualization mb-6">
          <h3 className="text-xl font-semibold mb-2">Heap Structure Visualization</h3>
          <HeapVisualizer 
            heapStructure={heapStructureData} 
            width={width - 40} 
            height={300}
          />
        </div>
      )}
      
      <div className="visualizations grid grid-cols-2 gap-6">
        <div className="js-visualization">
          <div className="bg-gray-100 p-4 rounded shadow-md">
            <h3 className="text-xl font-semibold mb-2">JavaScript Implementation</h3>
            <canvas 
              ref={jsCanvasRef}
              width={width / 2 - 50}
              height={height / 2}
              className="bg-gray-900 rounded w-full"
            />
            
            {comparison && (
              <div className="metrics mt-4 grid grid-cols-2 gap-4">
                <div className="metric p-2 bg-white rounded shadow">
                  <span className="block text-sm font-medium">Execution Time:</span>
                  <span className="text-lg font-bold">{formatTime(comparison.javascript.executionTime)}</span>
                </div>
                <div className="metric p-2 bg-white rounded shadow">
                  <span className="block text-sm font-medium">Comparisons:</span>
                  <span className="text-lg font-bold">{comparison.javascript.metrics.comparisons}</span>
                </div>
                <div className="metric p-2 bg-white rounded shadow">
                  <span className="block text-sm font-medium">Swaps:</span>
                  <span className="text-lg font-bold">{comparison.javascript.metrics.swaps}</span>
                </div>
                <div className="metric p-2 bg-white rounded shadow">
                  <span className="block text-sm font-medium">Memory Access:</span>
                  <span className="text-lg font-bold">{comparison.javascript.metrics.memoryAccesses}</span>
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="py-visualization">
          <div className="bg-gray-100 p-4 rounded shadow-md">
            <h3 className="text-xl font-semibold mb-2">Python Implementation</h3>
            <canvas 
              ref={pyCanvasRef}
              width={width / 2 - 50}
              height={height / 2}
              className="bg-gray-900 rounded w-full"
            />
            
            {comparison && (
              <div className="metrics mt-4 grid grid-cols-2 gap-4">
                <div className="metric p-2 bg-white rounded shadow">
                  <span className="block text-sm font-medium">Execution Time:</span>
                  <span className="text-lg font-bold">{formatTime(comparison.python.executionTime)}</span>
                </div>
                <div className="metric p-2 bg-white rounded shadow">
                  <span className="block text-sm font-medium">Comparisons:</span>
                  <span className="text-lg font-bold">{comparison.python.metrics.comparisons}</span>
                </div>
                <div className="metric p-2 bg-white rounded shadow">
                  <span className="block text-sm font-medium">Swaps:</span>
                  <span className="text-lg font-bold">{comparison.python.metrics.swaps}</span>
                </div>
                <div className="metric p-2 bg-white rounded shadow">
                  <span className="block text-sm font-medium">Memory Access:</span>
                  <span className="text-lg font-bold">{comparison.python.metrics.memory_accesses}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="comparison-details mt-6">
        {comparison && (
          <div className="bg-white p-6 rounded shadow-lg">
            <h3 className="text-xl font-semibold mb-4">Implementation Comparison</h3>
            
            <div className="mb-6">
              <h4 className="text-lg font-medium mb-2">Performance Metrics</h4>
              <div className="grid grid-cols-3 gap-6">
                <div className="stat p-4 bg-gray-50 rounded shadow">
                  <span className="block text-sm font-medium mb-1">Speed Comparison:</span>
                  <span className={`text-xl font-bold ${getComparisonColor(1, comparison.comparison.speedRatio)}`}>
                    {comparison.comparison.speedRatio < 1 
                      ? `JS is ${(1 / comparison.comparison.speedRatio).toFixed(2)}x faster`
                      : `Python is ${comparison.comparison.speedRatio.toFixed(2)}x faster`}
                  </span>
                </div>
                
                <div className="stat p-4 bg-gray-50 rounded shadow">
                  <span className="block text-sm font-medium mb-1">Comparison Operations:</span>
                  <span className={`text-xl font-bold ${getComparisonColor(
                    comparison.javascript.metrics.comparisons,
                    comparison.python.metrics.comparisons
                  )}`}>
                    {Math.abs(comparison.comparison.operationCounts.comparisons.difference) === 0
                      ? "Identical"
                      : comparison.comparison.operationCounts.comparisons.difference > 0
                        ? `JS uses ${comparison.comparison.operationCounts.comparisons.difference} more`
                        : `Python uses ${Math.abs(comparison.comparison.operationCounts.comparisons.difference)} more`}
                  </span>
                </div>
                
                <div className="stat p-4 bg-gray-50 rounded shadow">
                  <span className="block text-sm font-medium mb-1">Result Correctness:</span>
                  <span className={`text-xl font-bold ${comparison.comparison.resultsMatch ? 'text-green-600' : 'text-red-600'}`}>
                    {comparison.comparison.resultsMatch ? "Identical Results" : "Results Differ"}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="step-visualization mb-6">
              <h4 className="text-lg font-medium mb-2">Execution Steps Visualization</h4>
              
              <div className="playback-controls flex items-center space-x-4 mb-4">
                <button 
                  onClick={() => navigateToStep(0)}
                  disabled={currentStep === 0 || isPlaying}
                  className="p-2 bg-gray-200 rounded disabled:opacity-50"
                >
                  ⏮️ First
                </button>
                <button 
                  onClick={() => navigateToStep(currentStep - 1)}
                  disabled={currentStep === 0 || isPlaying}
                  className="p-2 bg-gray-200 rounded disabled:opacity-50"
                >
                  ⏪ Prev
                </button>
                <button 
                  onClick={togglePlayback}
                  className="px-4 py-2 bg-blue-600 text-white rounded"
                >
                  {isPlaying ? '⏸️ Pause' : '▶️ Play'}
                </button>
                <button 
                  onClick={() => navigateToStep(currentStep + 1)}
                  disabled={currentStep >= maxSteps - 1 || isPlaying}
                  className="p-2 bg-gray-200 rounded disabled:opacity-50"
                >
                  ⏩ Next
                </button>
                <button 
                  onClick={() => navigateToStep(maxSteps - 1)}
                  disabled={currentStep >= maxSteps - 1 || isPlaying}
                  className="p-2 bg-gray-200 rounded disabled:opacity-50"
                >
                  ⏭️ Last
                </button>
                
                <div className="flex items-center ml-4">
                  <label className="mr-2 text-sm">Speed:</label>
                  <input
                    type="range"
                    min="0.1"
                    max="5"
                    step="0.1"
                    value={playbackSpeed}
                    onChange={(e) => setPlaybackSpeed(parseFloat(e.target.value))}
                    className="w-32"
                  />
                  <span className="ml-2 text-sm">{playbackSpeed}x</span>
                </div>
                
                <div className="ml-4 text-sm">
                  Step: {currentStep} / {maxSteps}
                </div>
              </div>
              
              <div className="progress w-full bg-gray-200 rounded overflow-hidden">
                <div 
                  className="bg-blue-600 h-2 transition-all"
                  style={{ width: `${(currentStep / (maxSteps || 1)) * 100}%` }}
                ></div>
              </div>
              
              {/* Current step details */}
              {currentStep < maxSteps && comparison && (
                <div className="step-details mt-4 grid grid-cols-2 gap-6">
                  <div className="js-step p-3 bg-blue-50 rounded">
                    <h5 className="font-medium">JavaScript Step:</h5>
                    <p className="mt-1 text-sm">{comparison.jsHistory[currentStep]?.message || 'No message'}</p>
                  </div>
                  
                  <div className="py-step p-3 bg-green-50 rounded">
                    <h5 className="font-medium">Python Step:</h5>
                    <p className="mt-1 text-sm">{comparison.pyHistory[currentStep]?.message || 'No message'}</p>
                  </div>
                </div>
              )}
            </div>
            
            <div className="algorithm-insights">
              <h4 className="text-lg font-medium mb-2">Implementation Insights</h4>
              <div className="bg-gray-50 p-4 rounded">
                <p className="mb-2">
                  This comparison demonstrates key differences between the JavaScript and Python implementations:
                </p>
                <ul className="list-disc pl-5 text-sm space-y-1">
                  <li>
                    <strong>Performance characteristics:</strong> JavaScript typically executes faster in the browser environment,
                    while Python may have more consistent performance across different input sizes.
                  </li>
                  <li>
                    <strong>Memory usage patterns:</strong> The JavaScript implementation uses memory differently
                    due to the language's approach to arrays and objects.
                  </li>
                  <li>
                    <strong>Optimization strategies:</strong> Both implementations share core algorithmic concepts but
                    may implement optimizations in language-specific ways.
                  </li>
                  <li>
                    <strong>Operation counts:</strong> Slight differences in comparisons and swaps can be attributed to
                    implementation-specific decisions around boundary conditions and optimizations.
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AlgorithmComparison;