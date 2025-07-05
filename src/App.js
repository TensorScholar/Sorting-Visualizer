/**
 * Advanced Sorting Algorithm Visualization Platform
 * Main Application Component
 * 
 * This component serves as the application's root UI controller,
 * orchestrating algorithm selection, visualization mode switching,
 * and managing the primary interface components.
 */

import React, { useState } from 'react';
import SortingVisualizer from './components/SortingVisualizer';
import AlgorithmComparison from './components/AlgorithmComparison';
import './styles/App.css';

// Import algorithm implementations directly
// These will be replaced with the index-based imports once established
import BubbleSort from './algorithms/comparison/bubble';
import MergeSort from './algorithms/comparison/merge';
import QuickSort from './algorithms/comparison/quick';
import HeapSort from './algorithms/comparison/heap';

/**
 * Main application component that manages algorithm selection,
 * visualization view, and coordination between components.
 */
function App() {
  // State for active algorithm and view
  const [activeAlgorithm, setActiveAlgorithm] = useState('merge-sort');
  const [view, setView] = useState('visualizer'); // 'visualizer' or 'comparison'
  
  /**
   * Algorithm instance registry with appropriate configuration options
   * for demonstration and educational purposes
   */
  const algorithms = {
    'bubble-sort': new BubbleSort({ 
      optimize: true, 
      adaptive: true 
    }),
    'merge-sort': new MergeSort({ 
      adaptive: true, 
      insertionThreshold: 10,
      optimizeMerge: true
    }),
    'quick-sort': new QuickSort({
      pivotStrategy: 'median-of-three',
      insertionThreshold: 10,
      threeWayPartition: true
    }),
    'heap-sort': new HeapSort({
      visualizeHeap: true,
      optimizeLeafChecks: true
    })
  };
  
  /**
   * Retrieves the current algorithm instance based on user selection
   * @returns {Object} The configured algorithm instance
   */
  const getCurrentAlgorithm = () => {
    return algorithms[activeAlgorithm];
  };
  
  /**
   * Handles algorithm selection change from UI controls
   * @param {Event} e - The change event from select element
   */
  const handleAlgorithmChange = (e) => {
    setActiveAlgorithm(e.target.value);
  };
  
  /**
   * Handles visualization view mode change
   * @param {Event} e - The change event from select element
   */
  const handleViewChange = (e) => {
    setView(e.target.value);
  };
  
  return (
    <div className="App">
      <header className="App-header">
        <h1>Advanced Sorting Algorithm Visualization Platform</h1>
        
        <div className="controls">
          <div className="control-group">
            <label>Algorithm:</label>
            <select 
              value={activeAlgorithm} 
              onChange={handleAlgorithmChange}
            >
              <option value="bubble-sort">Bubble Sort</option>
              <option value="merge-sort">Merge Sort</option>
              <option value="quick-sort">Quick Sort</option>
              <option value="heap-sort">Heap Sort</option>
            </select>
          </div>
          
          <div className="control-group">
            <label>View:</label>
            <select 
              value={view} 
              onChange={handleViewChange}
            >
              <option value="visualizer">Algorithm Visualizer</option>
              <option value="comparison">JS-Python Comparison</option>
            </select>
          </div>
        </div>
      </header>
      
      <main>
        {view === 'visualizer' ? (
          <SortingVisualizer 
            algorithm={getCurrentAlgorithm()} 
            options={{
              colorScheme: 'spectrum',
              barWidth: 6,
              spacing: 2
            }}
          />
        ) : (
          <AlgorithmComparison />
        )}
      </main>
      
      <footer>
        <p>
          Advanced Sorting Algorithm Visualization Platform
          <span className="separator">|</span>
          <a href="https://github.com/your-username/sorting-visualizer" target="_blank" rel="noopener noreferrer">
            GitHub Repository
          </a>
        </p>
      </footer>
    </div>
  );
}

export default App;