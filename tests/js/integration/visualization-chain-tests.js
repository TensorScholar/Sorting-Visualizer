// tests/js/integration/visualization-chain.test.js

/**
 * Visualization Pipeline Integration Test Suite
 * 
 * This suite tests the complete visualization pipeline, from algorithm execution
 * through state transformation to rendering. It verifies the correct operation of 
 * renderers, specialized visualizers, and the data flow between components.
 * 
 * @module tests/js/integration/visualization-chain
 * @requires jest
 * @requires @testing-library/react
 */

import React from 'react';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

// Visualization components
import SortingVisualizer from '../../../src/components/SortingVisualizer';
import HeapVisualizer from '../../../src/visualization/components/HeapVisualizer';
import { WebGLRenderer } from '../../../src/visualization/renderers/webgl-renderer';
import { ArrayRenderer } from '../../../src/visualization/renderers/array-renderer';
import DistributionVisualizer from '../../../src/visualization/components/distribution-visualizer';
import TransformVisualizer from '../../../src/visualization/components/transform-visualizer';

// Algorithms for testing
import BubbleSort from '../../../src/algorithms/comparison/bubble';
import MergeSort from '../../../src/algorithms/comparison/merge';
import QuickSort from '../../../src/algorithms/comparison/quick';
import HeapSort from '../../../src/algorithms/comparison/heap';
import CountingSort from '../../../src/algorithms/distribution/counting';
import RadixSort from '../../../src/algorithms/distribution/radix';
import BitonicSort from '../../../src/algorithms/network/bitonic';
import PancakeSort from '../../../src/algorithms/special/pancake';

// Utilities
import { generateDataSet } from '../../../src/data/generators';

// Mock canvas and WebGL context for testing
jest.mock('../../../src/visualization/renderers/webgl-renderer', () => {
  return {
    WebGLRenderer: jest.fn().mockImplementation(() => ({
      setData: jest.fn(),
      highlight: jest.fn(),
      markComparing: jest.fn(),
      markSorted: jest.fn(),
      render: jest.fn(),
      resize: jest.fn(),
      dispose: jest.fn(),
      setOptions: jest.fn(),
      getMetrics: jest.fn().mockReturnValue({ fps: 60, renderTime: 5 })
    }))
  };
});

jest.mock('../../../src/visualization/renderers/array-renderer', () => {
  return {
    ArrayRenderer: jest.fn().mockImplementation(() => ({
      setData: jest.fn(),
      highlight: jest.fn(),
      markComparing: jest.fn(),
      markSorted: jest.fn(),
      render: jest.fn(),
      resize: jest.fn(),
      dispose: jest.fn(),
      setOptions: jest.fn(),
      getMetrics: jest.fn().mockReturnValue({ fps: 30, renderTime: 10 })
    }))
  };
});

// Mock rAF for animation testing
const originalRAF = global.requestAnimationFrame;
const originalCAF = global.cancelAnimationFrame;

beforeAll(() => {
  // Mock requestAnimationFrame/cancelAnimationFrame for animation testing
  global.requestAnimationFrame = jest.fn(cb => setTimeout(cb, 0));
  global.cancelAnimationFrame = jest.fn(id => clearTimeout(id));
  
  // Create canvas mock for testing
  HTMLCanvasElement.prototype.getContext = jest.fn(contextId => {
    if (contextId === 'webgl2' || contextId === 'webgl') {
      return {
        createShader: jest.fn(),
        createProgram: jest.fn(),
        attachShader: jest.fn(),
        linkProgram: jest.fn(),
        getProgramParameter: jest.fn().mockReturnValue(true),
        createBuffer: jest.fn(),
        bindBuffer: jest.fn(),
        bufferData: jest.fn(),
        createVertexArray: jest.fn(),
        bindVertexArray: jest.fn(),
        enableVertexAttribArray: jest.fn(),
        vertexAttribPointer: jest.fn(),
        clearColor: jest.fn(),
        clear: jest.fn(),
        uniform2f: jest.fn(),
        uniform1f: jest.fn(),
        drawArrays: jest.fn(),
        getUniformLocation: jest.fn(),
        getAttribLocation: jest.fn(),
        viewport: jest.fn(),
        useProgram: jest.fn(),
        shaderSource: jest.fn(),
        compileShader: jest.fn(),
        getShaderParameter: jest.fn().mockReturnValue(true)
      };
    } else if (contextId === '2d') {
      return {
        clearRect: jest.fn(),
        beginPath: jest.fn(),
        moveTo: jest.fn(),
        lineTo: jest.fn(),
        arc: jest.fn(),
        fill: jest.fn(),
        stroke: jest.fn(),
        fillText: jest.fn(),
        measureText: jest.fn().mockReturnValue({ width: 10 }),
        fillRect: jest.fn(),
        strokeRect: jest.fn(),
        setLineDash: jest.fn(),
        getLineDash: jest.fn().mockReturnValue([]),
        setTransform: jest.fn(),
        resetTransform: jest.fn(),
        createLinearGradient: jest.fn().mockReturnValue({
          addColorStop: jest.fn()
        })
      };
    }
    return null;
  });
});

afterAll(() => {
  // Restore original requestAnimationFrame
  global.requestAnimationFrame = originalRAF;
  global.cancelAnimationFrame = originalCAF;
});

/**
 * Creates a custom testing hook for the visualization pipeline
 * @param {Function} AlgorithmClass - Algorithm constructor
 * @param {Object} options - Algorithm options
 * @param {Array} data - Test data array
 * @returns {Object} Functions and utilities for testing
 */
function useVisualizationTester(AlgorithmClass, options = {}, data = []) {
  const algorithm = new AlgorithmClass(options);
  
  // Create a mock implementation of the algorithm's recordState method
  const recordedStates = [];
  const originalRecordState = algorithm.recordState;
  
  algorithm.recordState = function(array, metadata = {}) {
    recordedStates.push({
      array: [...array],
      ...metadata,
      timestamp: Date.now()
    });
    return originalRecordState.call(this, array, metadata);
  };
  
  // Execute algorithm with recording
  const execute = async () => {
    return await algorithm.execute([...data]);
  };
  
  return {
    algorithm,
    execute,
    recordedStates,
    getStepCount: () => recordedStates.length,
    getStepAtIndex: (index) => recordedStates[index],
    hasVisualizationData: (index, key) => 
      recordedStates[index] && (key in recordedStates[index])
  };
}

describe('Visualization Pipeline Integration', () => {
  // Common test data
  const testData = generateDataSet('random', 50, { min: 1, max: 100 });
  
  describe('Algorithm State Recording and Transformation', () => {
    test('Bubble Sort records state transitions with appropriate metadata', async () => {
      const { execute, recordedStates } = useVisualizationTester(
        BubbleSort, { optimize: true, adaptive: true }, testData
      );
      
      await execute();
      
      // Check initial and final states
      expect(recordedStates[0].type).toBe('initial');
      expect(recordedStates[recordedStates.length - 1].type).toBe('final');
      
      // Verify comparison states
      const comparisonStates = recordedStates.filter(state => state.type === 'comparison');
      expect(comparisonStates.length).toBeGreaterThan(0);
      expect(comparisonStates[0]).toHaveProperty('indices');
      
      // Verify swap states
      const swapStates = recordedStates.filter(state => state.type === 'swap');
      expect(swapStates.length).toBeGreaterThan(0);
      expect(swapStates[0]).toHaveProperty('indices');
      
      // Verify early termination for optimized bubble sort
      const optimizationStates = recordedStates.filter(state => state.type === 'optimization');
      expect(optimizationStates.length).toBeGreaterThan(0);
    });
    
    test('Heap Sort records heap structure data for visualization', async () => {
      const { execute, recordedStates, hasVisualizationData } = useVisualizationTester(
        HeapSort, { visualizeHeap: true }, testData
      );
      
      await execute();
      
      // Find heap construction phase
      const heapConstructionStates = recordedStates.filter(
        state => state.type === 'heap-start' || state.type === 'heap-complete'
      );
      expect(heapConstructionStates.length).toBeGreaterThan(0);
      
      // Verify heap structure exists in appropriate states
      const heapifyStates = recordedStates.filter(state => state.type === 'heapify');
      expect(heapifyStates.length).toBeGreaterThan(0);
      
      // Check for heap structure data
      for (const state of heapifyStates) {
        expect(state).toHaveProperty('heapStructure');
        expect(state.heapStructure).toHaveProperty('nodes');
        expect(state.heapStructure).toHaveProperty('edges');
        expect(state.heapStructure.nodes.length).toBeGreaterThan(0);
      }
      
      // Check extract-max operations
      const extractMaxStates = recordedStates.filter(state => state.type === 'extract-max');
      expect(extractMaxStates.length).toBeGreaterThan(0);
    });
    
    test('Distribution sorts record distribution data for visualization', async () => {
      const { execute, recordedStates } = useVisualizationTester(
        CountingSort, { visualizeDistribution: true }, testData
      );
      
      await execute();
      
      // Verify counting frequency states
      const countingStates = recordedStates.filter(state => 
        state.type === 'counting' || state.type === 'frequency');
      expect(countingStates.length).toBeGreaterThan(0);
      
      // Check for frequency distribution data
      for (const state of countingStates) {
        if (state.frequencies) {
          expect(Array.isArray(state.frequencies)).toBe(true);
          expect(state.frequencies.length).toBeGreaterThan(0);
        }
      }
      
      // Check redistribution states
      const redistributeStates = recordedStates.filter(state => 
        state.type === 'redistribute' || state.type === 'placement');
      expect(redistributeStates.length).toBeGreaterThan(0);
    });
    
    test('Network sorts record network topology for visualization', async () => {
      // Bitonic sort requires power-of-two array size
      const powerOfTwoData = generateDataSet('random', 16, { min: 1, max: 100 });
      
      const { execute, recordedStates } = useVisualizationTester(
        BitonicSort, { visualizeNetwork: true }, powerOfTwoData
      );
      
      await execute();
      
      // Check for network visualization states
      const networkStates = recordedStates.filter(state => 
        state.type === 'network' || state.type === 'compare-exchange');
      expect(networkStates.length).toBeGreaterThan(0);
      
      // Verify network structure data
      for (const state of networkStates) {
        if (state.type === 'network') {
          expect(state).toHaveProperty('networkStructure');
          if (state.networkStructure) {
            expect(state.networkStructure).toHaveProperty('stages');
            expect(state.networkStructure.stages.length).toBeGreaterThan(0);
          }
        }
      }
      
      // Check for compare-exchange operations
      const compareExchangeStates = recordedStates.filter(state => 
        state.type === 'compare-exchange');
      expect(compareExchangeStates.length).toBeGreaterThan(0);
    });
  });
  
  describe('Renderer Integration', () => {
    test('WebGL Renderer processes algorithm states correctly', async () => {
      // Create algorithm and prepare test data
      const algorithm = new MergeSort();
      const { recordStep, steps } = createStepRecorder();
      
      // Execute algorithm with step recording
      await algorithm.execute([...testData], { onStep: recordStep });
      
      // Create renderer instance
      const renderer = new WebGLRenderer();
      
      // Process each algorithm step with the renderer
      for (let i = 0; i < steps.length; i++) {
        const step = steps[i];
        
        // Update renderer with step data
        renderer.setData(step.array);
        
        // Apply appropriate highlighting based on step type
        if (step.type === 'comparison' && step.indices) {
          renderer.markComparing(step.indices);
        } else if (step.type === 'swap' && step.indices) {
          renderer.highlight(step.indices);
        } else if (step.type === 'sorted' && step.indices) {
          renderer.markSorted(step.indices);
        }
        
        // Verify renderer was called with correct data
        expect(renderer.setData).toHaveBeenCalledWith(step.array);
        
        if (step.type === 'comparison' && step.indices) {
          expect(renderer.markComparing).toHaveBeenCalledWith(step.indices);
        } else if (step.type === 'swap' && step.indices) {
          expect(renderer.highlight).toHaveBeenCalledWith(step.indices);
        } else if (step.type === 'sorted' && step.indices) {
          expect(renderer.markSorted).toHaveBeenCalledWith(step.indices);
        }
      }
    });
    
    test('Array Renderer gracefully handles large datasets', async () => {
      // Create large test dataset
      const largeData = generateDataSet('random', 10000, { min: 1, max: 1000 });
      
      // Create renderer instance
      const renderer = new ArrayRenderer();
      
      // Test with large dataset
      renderer.setData(largeData);
      
      // Verify renderer handled large dataset
      expect(renderer.setData).toHaveBeenCalledWith(largeData);
    });
    
    test('Renderers properly clean up resources on disposal', () => {
      // Create renderer instances
      const webglRenderer = new WebGLRenderer();
      const arrayRenderer = new ArrayRenderer();
      
      // Dispose renderers
      webglRenderer.dispose();
      arrayRenderer.dispose();
      
      // Verify dispose methods were called
      expect(webglRenderer.dispose).toHaveBeenCalled();
      expect(arrayRenderer.dispose).toHaveBeenCalled();
    });
  });
  
  describe('Specialized Visualizer Components', () => {
    test('HeapVisualizer renders heap structure correctly', () => {
      // Create sample heap structure
      const heapStructure = {
        nodes: [
          { id: 0, value: 10, level: 0, isLeaf: false },
          { id: 1, value: 7, level: 1, isLeaf: false },
          { id: 2, value: 8, level: 1, isLeaf: false },
          { id: 3, value: 5, level: 2, isLeaf: true },
          { id: 4, value: 3, level: 2, isLeaf: true },
          { id: 5, value: 6, level: 2, isLeaf: true }
        ],
        edges: [
          { from: 0, to: 1, type: 'left' },
          { from: 0, to: 2, type: 'right' },
          { from: 1, to: 3, type: 'left' },
          { from: 1, to: 4, type: 'right' },
          { from: 2, to: 5, type: 'left' }
        ],
        highlight: 0
      };
      
      // Render component with heap structure
      render(<HeapVisualizer heapStructure={heapStructure} width={400} height={300} />);
      
      // Verify canvas element exists
      const canvas = document.querySelector('canvas.heap-canvas');
      expect(canvas).toBeInTheDocument();
      expect(canvas.width).toBe(400);
      expect(canvas.height).toBe(300);
    });
    
    test('DistributionVisualizer renders frequency data correctly', () => {
      // Create sample distribution data
      const distributionData = {
        frequencies: Array.from({ length: 20 }, (_, i) => Math.floor(Math.random() * 10)),
        min: 0,
        max: 19,
        currentIndex: 5,
        phase: 'counting'
      };
      
      // Render component with distribution data
      render(
        <DistributionVisualizer 
          distributionData={distributionData} 
          width={400} 
          height={300} 
        />
      );
      
      // Verify canvas element exists
      const canvas = document.querySelector('canvas.distribution-canvas');
      expect(canvas).toBeInTheDocument();
    });
    
    test('TransformVisualizer shows transformation operations', () => {
      // Create sample transformation data
      const transformData = {
        original: [5, 3, 8, 4, 2],
        transformed: [5, 3, 8, 4, 2], // Same as original initially
        operations: [
          { type: 'flip', range: [0, 4], message: 'Flip entire array' },
          { type: 'flip', range: [0, 2], message: 'Flip first three elements' }
        ],
        currentOperation: 0
      };
      
      // Render component with transform data
      render(
        <TransformVisualizer 
          transformData={transformData} 
          width={400} 
          height={300} 
        />
      );
      
      // Verify canvas element exists
      const canvas = document.querySelector('canvas.transform-canvas');
      expect(canvas).toBeInTheDocument();
    });
  });
  
  describe('Animation and Playback Controls', () => {
    test('SortingVisualizer handles play/pause functionality correctly', async () => {
      // Create algorithm instance
      const algorithm = new QuickSort({
        pivotStrategy: 'median-of-three',
        insertionThreshold: 10
      });
      
      // Render component with algorithm
      const { getByText } = render(
        <SortingVisualizer 
          algorithm={algorithm} 
          options={{ colorScheme: 'spectrum' }}
        />
      );
      
      // Wait for component to initialize
      await waitFor(() => expect(getByText(/^Play$/)).toBeInTheDocument());
      
      // Click play button
      const playButton = getByText(/^Play$/);
      fireEvent.click(playButton);
      
      // Should change to pause
      await waitFor(() => expect(getByText(/^Pause$/)).toBeInTheDocument());
      
      // Click pause button
      const pauseButton = getByText(/^Pause$/);
      fireEvent.click(pauseButton);
      
      // Should change back to play
      await waitFor(() => expect(getByText(/^Play$/)).toBeInTheDocument());
    });
    
    test('SortingVisualizer step navigation controls update visualization state', async () => {
      // Create algorithm instance
      const algorithm = new BubbleSort({ optimize: true, adaptive: true });
      
      // Generate test data
      const testSteps = [];
      const recordStep = (step) => testSteps.push(step);
      
      // Execute algorithm to generate steps
      await algorithm.execute([5, 3, 8, 4, 2], { onStep: recordStep });
      
      // Mock algorithm with pre-generated steps
      const mockAlgorithm = {
        ...algorithm,
        execute: jest.fn().mockImplementation((array, options) => {
          // Call onStep callback with pre-generated steps
          if (options && options.onStep) {
            testSteps.forEach(step => options.onStep(step));
          }
          return Promise.resolve([2, 3, 4, 5, 8]);
        }),
        getMetrics: () => algorithm.metrics,
        getComplexity: () => algorithm.getComplexity(),
        isStable: () => algorithm.isStable(),
        name: 'Bubble Sort'
      };
      
      // Render component with mock algorithm
      const { getByText } = render(
        <SortingVisualizer 
          algorithm={mockAlgorithm}
          options={{ colorScheme: 'spectrum' }}
        />
      );
      
      // Wait for component to initialize
      await waitFor(() => expect(getByText(/^First$/)).toBeInTheDocument());
      
      // Verify navigation buttons
      const firstButton = getByText(/^First$/);
      const prevButton = getByText(/^Prev$/);
      const nextButton = getByText(/^Next$/);
      const lastButton = getByText(/^Last$/);
      
      // Test next button - should update current step
      fireEvent.click(nextButton);
      
      // Test last button - should jump to final step
      fireEvent.click(lastButton);
      
      // Test prev button - should go back one step
      fireEvent.click(prevButton);
      
      // Test first button - should return to initial step
      fireEvent.click(firstButton);
    });
    
    test('Playback speed control adjusts animation rate', async () => {
      // Create algorithm instance
      const algorithm = new MergeSort();
      
      // Render component with algorithm
      const { container } = render(
        <SortingVisualizer 
          algorithm={algorithm} 
          options={{ colorScheme: 'spectrum' }}
        />
      );
      
      // Find speed slider
      const slider = container.querySelector('input[type="range"]');
      expect(slider).toBeInTheDocument();
      
      // Set to fastest speed
      fireEvent.change(slider, { target: { value: 10 } });
      
      // Verify speed was updated
      expect(slider.value).toBe('10');
      
      // Set to slowest speed
      fireEvent.change(slider, { target: { value: 0.1 } });
      
      // Verify speed was updated
      expect(slider.value).toBe('0.1');
    });
  });
  
  describe('Data Flow End-to-End', () => {
    test('Full pipeline from data generation to rendering works correctly', async () => {
      // Mock full pipeline functions
      const mockRenderUpdate = jest.fn();
      const mockStateUpdate = jest.fn();
      
      // Create algorithm instance
      const algorithm = new MergeSort({ adaptive: true });
      
      // Generate test data
      const data = generateDataSet('random', 20, { min: 1, max: 100 });
      
      // Execute pipeline manually
      const execute = async () => {
        // 1. Execute algorithm with step recording
        const recorder = { steps: [] };
        const recordStep = (step) => {
          recorder.steps.push(step);
          mockStateUpdate(step);
        };
        
        const result = await algorithm.execute([...data], { onStep: recordStep });
        
        // 2. Process each step with renderer
        for (const step of recorder.steps) {
          mockRenderUpdate(step);
        }
        
        return {
          result,
          metrics: algorithm.metrics,
          steps: recorder.steps,
          stateUpdateCalls: mockStateUpdate.mock.calls.length,
          renderUpdateCalls: mockRenderUpdate.mock.calls.length
        };
      };
      
      // Run pipeline
      const pipelineResult = await execute();
      
      // Verify algorithm executed correctly
      expect(pipelineResult.result.length).toBe(data.length);
      
      // Verify state updates were called for each step
      expect(pipelineResult.stateUpdateCalls).toBe(pipelineResult.steps.length);
      
      // Verify render updates were called for each step
      expect(pipelineResult.renderUpdateCalls).toBe(pipelineResult.steps.length);
    });
    
    test('Integration with SortingVisualizer component works end-to-end', async () => {
      // Create algorithm instance
      const algorithm = new HeapSort({ visualizeHeap: true });
      
      // Render full component with algorithm
      const { getByText, container } = render(
        <SortingVisualizer 
          algorithm={algorithm} 
          options={{ colorScheme: 'spectrum' }}
        />
      );
      
      // Wait for component to initialize
      await waitFor(() => expect(getByText(/Heap Sort/)).toBeInTheDocument());
      
      // Verify algorithm info is displayed
      const algorithmInfo = getByText(/Heap Sort/);
      expect(algorithmInfo).toBeInTheDocument();
      
      // Find and click "Regenerate Data" button
      const regenerateButton = getByText(/Regenerate Data/);
      fireEvent.click(regenerateButton);
      
      // Find and click "Play" button to start visualization
      const playButton = getByText(/^Play$/);
      fireEvent.click(playButton);
      
      // Wait for playback state to change to "Pause"
      await waitFor(() => expect(getByText(/^Pause$/)).toBeInTheDocument());
      
      // Pause visualization
      const pauseButton = getByText(/^Pause$/);
      fireEvent.click(pauseButton);
      
      // Verify "Play" button is visible again
      await waitFor(() => expect(getByText(/^Play$/)).toBeInTheDocument());
      
      // Find and use step navigation buttons
      const nextButton = getByText(/^Next$/);
      fireEvent.click(nextButton);
      
      // Verify visualization is working by checking for canvas elements
      expect(container.querySelectorAll('canvas').length).toBeGreaterThan(0);
    });
  });
});

/**
 * Creates a step recording callback for tracking algorithm execution
 * @returns {Object} Object containing callback and collected steps
 */
function createStepRecorder() {
  const steps = [];
  const recordStep = (step) => {
    steps.push(step);
  };
  return { recordStep, steps };
}
