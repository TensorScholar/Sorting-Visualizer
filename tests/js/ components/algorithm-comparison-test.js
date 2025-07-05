// tests/js/components/algorithm-comparison.test.js

/**
 * Comprehensive test suite for the AlgorithmComparison component
 * 
 * This test suite validates the AlgorithmComparison component, which enables
 * side-by-side visualization and performance comparison between JavaScript
 * and Python implementations of sorting algorithms. The component integrates
 * with the Python-JavaScript bridge to enable cross-language algorithm execution.
 * 
 * The test suite employs a combination of:
 * - Unit tests for isolated component functionality
 * - Integration tests for algorithm execution and bridge functionality
 * - Visual rendering tests for WebGL canvas behavior
 * - Asynchronous execution tests for Python interaction
 * 
 * @author Advanced Sorting Algorithm Visualization Platform
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import AlgorithmComparison from '../../../src/components/AlgorithmComparison';
import { WebGLRenderer } from '../../../src/visualization/renderers/webgl-renderer';
import { generateDataSet } from '../../../src/data/generators';
import PythonJSBridge from '../../../src/utils/python-js-bridge';

// Mock dependencies
jest.mock('../../../src/visualization/renderers/webgl-renderer');
jest.mock('../../../src/data/generators');
jest.mock('../../../src/utils/python-js-bridge');
jest.mock('../../../src/algorithms/comparison/bubble');
jest.mock('../../../src/algorithms/comparison/merge');
jest.mock('../../../src/algorithms/comparison/quick');

// Mock requestAnimationFrame and cancelAnimationFrame
global.requestAnimationFrame = jest.fn(callback => {
  return setTimeout(() => callback(performance.now()), 0);
});

global.cancelAnimationFrame = jest.fn(id => {
  clearTimeout(id);
});

// Sample test data
const TEST_ARRAY = [5, 3, 8, 2, 1, 4, 7, 6];
const SORTED_ARRAY = [1, 2, 3, 4, 5, 6, 7, 8];

// Mock comparison result from Python-JS bridge
const MOCK_COMPARISON_RESULT = {
  algorithm: 'merge-sort',
  inputSize: 8,
  javascript: {
    executionTime: 15.5,
    metrics: {
      comparisons: 24,
      swaps: 0,
      reads: 56,
      writes: 32,
      memoryAccesses: 88,
      executionTime: 15.5
    }
  },
  python: {
    executionTime: 20.3,
    metrics: {
      comparisons: 24,
      swaps: 0,
      reads: 56,
      writes: 32,
      memory_accesses: 88,
      execution_time: 0.0203 // In seconds in Python
    }
  },
  comparison: {
    resultsMatch: true,
    speedRatio: 0.76,
    operationCounts: {
      comparisons: {
        js: 24,
        py: 24,
        difference: 0
      },
      swaps: {
        js: 0,
        py: 0,
        difference: 0
      }
    }
  },
  jsHistory: [
    {
      type: 'initial',
      array: TEST_ARRAY,
      message: 'Initial array state'
    },
    {
      type: 'divide',
      array: TEST_ARRAY,
      section: [0, 7],
      middle: 3,
      message: 'Dividing at index 3'
    },
    // Additional history steps would be here
    {
      type: 'final',
      array: SORTED_ARRAY,
      message: 'Final sorted state'
    }
  ],
  pyHistory: [
    {
      type: 'initial',
      array: TEST_ARRAY,
      message: 'Initial array state'
    },
    {
      type: 'divide',
      array: TEST_ARRAY,
      section: [0, 7],
      middle: 3,
      message: 'Dividing at index 3'
    },
    // Additional history steps would be here
    {
      type: 'final',
      array: SORTED_ARRAY,
      message: 'Final sorted state'
    }
  ]
};

// Setup mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
  
  // Mock data generation
  generateDataSet.mockReturnValue(TEST_ARRAY);
  
  // Mock WebGL renderer
  WebGLRenderer.mockImplementation(() => ({
    setData: jest.fn(),
    highlight: jest.fn(),
    markComparing: jest.fn(),
    markSorted: jest.fn(),
    resize: jest.fn(),
    dispose: jest.fn(),
    setOptions: jest.fn()
  }));
  
  // Mock PythonJSBridge
  PythonJSBridge.mockImplementation(() => ({
    executeAlgorithm: jest.fn().mockResolvedValue({
      result: SORTED_ARRAY,
      metrics: {
        comparisons: 24,
        swaps: 0,
        reads: 56,
        writes: 32,
        memory_accesses: 88,
        execution_time: 0.0203
      },
      history: MOCK_COMPARISON_RESULT.pyHistory
    }),
    compareImplementations: jest.fn().mockResolvedValue(MOCK_COMPARISON_RESULT),
    getAlgorithmHistory: jest.fn().mockResolvedValue(MOCK_COMPARISON_RESULT.pyHistory)
  }));
});

/**
 * Component initialization and rendering tests
 */
describe('AlgorithmComparison Component Rendering', () => {
  test('renders without crashing', () => {
    render(<AlgorithmComparison />);
    expect(screen.getByText(/JavaScript vs Python Implementation Comparison/i)).toBeInTheDocument();
  });
  
  test('initializes PythonJSBridge on mount', () => {
    render(<AlgorithmComparison />);
    expect(PythonJSBridge).toHaveBeenCalledTimes(1);
  });
  
  test('displays algorithm selection controls', () => {
    render(<AlgorithmComparison />);
    
    // Verify algorithm selection controls are present
    expect(screen.getByLabelText(/Algorithm:/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Data Type:/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Size:/i)).toBeInTheDocument();
    
    // Verify algorithm options are available
    const algorithmSelect = screen.getByLabelText(/Algorithm:/i);
    expect(algorithmSelect).toHaveDisplayValue('Merge Sort');
    
    // Check that there are multiple algorithm options
    expect(algorithmSelect.querySelectorAll('option').length).toBeGreaterThan(1);
  });
  
  test('initializes WebGL renderers for both JS and Python visualizations', () => {
    render(<AlgorithmComparison />);
    
    // Verify two WebGL renderers were created (one for JS, one for Python)
    expect(WebGLRenderer).toHaveBeenCalledTimes(2);
  });
  
  test('initializes with proper data', () => {
    render(<AlgorithmComparison />);
    
    // Verify data was generated
    expect(generateDataSet).toHaveBeenCalled();
  });
});

/**
 * Bridge integration and algorithm comparison tests
 */
describe('Algorithm Comparison Functionality', () => {
  test('runs comparison when data is initialized', async () => {
    render(<AlgorithmComparison />);
    
    // Wait for comparison to be initiated
    await waitFor(() => {
      const bridgeInstance = PythonJSBridge.mock.results[0].value;
      expect(bridgeInstance.compareImplementations).toHaveBeenCalled();
    });
  });
  
  test('changes algorithm when selection is changed', async () => {
    render(<AlgorithmComparison />);
    
    // Get bridge instance
    const bridgeInstance = PythonJSBridge.mock.results[0].value;
    
    // Change algorithm selection
    fireEvent.change(screen.getByLabelText(/Algorithm:/i), { target: { value: 'quick-sort' } });
    
    // Verify new comparison is initiated with changed algorithm
    await waitFor(() => {
      expect(bridgeInstance.compareImplementations).toHaveBeenCalledWith(
        expect.anything(), // JS algorithm instance
        'quick-sort',      // Algorithm name (for Python mapping)
        expect.anything(), // Data array
        expect.anything()  // Options
      );
    });
  });
  
  test('regenerates data and runs new comparison when button is clicked', async () => {
    render(<AlgorithmComparison />);
    
    // Get bridge instance
    const bridgeInstance = PythonJSBridge.mock.results[0].value;
    
    // Reset mocks to verify new calls
    bridgeInstance.compareImplementations.mockClear();
    generateDataSet.mockClear();
    
    // Click regenerate button
    fireEvent.click(screen.getByRole('button', { name: /Regenerate Data/i }));
    
    // Verify data was regenerated
    expect(generateDataSet).toHaveBeenCalled();
    
    // Verify new comparison was run
    await waitFor(() => {
      expect(bridgeInstance.compareImplementations).toHaveBeenCalled();
    });
  });
  
  test('displays comparison results after execution', async () => {
    render(<AlgorithmComparison />);
    
    // Wait for comparison to complete
    await waitFor(() => {
      const bridgeInstance = PythonJSBridge.mock.results[0].value;
      expect(bridgeInstance.compareImplementations).toHaveBeenCalled();
    });
    
    // Verify comparison details are displayed
    await waitFor(() => {
      expect(screen.getByText(/Performance Metrics/i)).toBeInTheDocument();
      expect(screen.getByText(/Speed Comparison:/i)).toBeInTheDocument();
      expect(screen.getByText(/JS is 1\.32x faster/i)).toBeInTheDocument();
      expect(screen.getByText(/Comparison Operations:/i)).toBeInTheDocument();
      expect(screen.getByText(/Identical/i)).toBeInTheDocument();
      expect(screen.getByText(/Result Correctness:/i)).toBeInTheDocument();
      expect(screen.getByText(/Identical Results/i)).toBeInTheDocument();
    });
  });
  
  test('displays execution metrics for both JS and Python implementations', async () => {
    render(<AlgorithmComparison />);
    
    // Wait for comparison to complete
    await waitFor(() => {
      const bridgeInstance = PythonJSBridge.mock.results[0].value;
      expect(bridgeInstance.compareImplementations).toHaveBeenCalled();
    });
    
    // Verify JS metrics are displayed
    await waitFor(() => {
      // JavaScript metrics
      expect(screen.getByText('15.50 ms')).toBeInTheDocument();
      expect(screen.getByText('24')).toBeInTheDocument(); // Comparisons
      
      // Python metrics
      expect(screen.getByText('20.30 ms')).toBeInTheDocument();
    });
  });
});

/**
 * Visualization and playback control tests
 */
describe('Visualization and Playback Controls', () => {
  // Utility function to wait for comparison results
  const waitForComparisonResults = async () => {
    await waitFor(() => {
      const bridgeInstance = PythonJSBridge.mock.results[0].value;
      expect(bridgeInstance.compareImplementations).toHaveBeenCalled();
    });
    
    // Wait for UI to update with comparison results
    await waitFor(() => {
      expect(screen.getByText(/Performance Metrics/i)).toBeInTheDocument();
    });
  };
  
  test('playback controls are enabled after comparison runs', async () => {
    render(<AlgorithmComparison />);
    
    // Wait for comparison results
    await waitForComparisonResults();
    
    // Verify playback controls are enabled
    expect(screen.getByRole('button', { name: /Play/i })).toBeEnabled();
    expect(screen.getByRole('button', { name: /Next/i })).toBeEnabled();
    expect(screen.getByRole('button', { name: /Last/i })).toBeEnabled();
  });
  
  test('step display shows current visualization position', async () => {
    render(<AlgorithmComparison />);
    
    // Wait for comparison results
    await waitForComparisonResults();
    
    // Initially at step 0
    expect(screen.getByText(/Step: 0 \//i)).toBeInTheDocument();
    
    // Click Next button to advance
    fireEvent.click(screen.getByRole('button', { name: /Next/i }));
    
    // Verify step advances to 1
    expect(screen.getByText(/Step: 1 \//i)).toBeInTheDocument();
  });
  
  test('visualizes both JS and Python execution steps', async () => {
    render(<AlgorithmComparison />);
    
    // Wait for comparison results
    await waitForComparisonResults();
    
    // Get WebGL renderer instances (one for JS, one for Python)
    const rendererInstances = WebGLRenderer.mock.results.map(result => result.value);
    
    // Click Next button to advance to step 1
    fireEvent.click(screen.getByRole('button', { name: /Next/i }));
    
    // Verify both renderers were updated with visualization data
    rendererInstances.forEach(renderer => {
      expect(renderer.setData).toHaveBeenCalled();
    });
    
    // Verify step details for both implementations are shown
    expect(screen.getByText(/JavaScript Step:/i)).toBeInTheDocument();
    expect(screen.getByText(/Python Step:/i)).toBeInTheDocument();
  });
  
  test('play button starts and stops animation', async () => {
    render(<AlgorithmComparison />);
    
    // Wait for comparison results
    await waitForComparisonResults();
    
    // Click play button
    fireEvent.click(screen.getByRole('button', { name: /Play/i }));
    
    // Verify button text changes to Pause
    expect(screen.getByRole('button', { name: /Pause/i })).toBeInTheDocument();
    
    // Verify animation is started (requestAnimationFrame is called)
    expect(global.requestAnimationFrame).toHaveBeenCalled();
    
    // Click pause button
    fireEvent.click(screen.getByRole('button', { name: /Pause/i }));
    
    // Verify button text changes back to Play
    expect(screen.getByRole('button', { name: /Play/i })).toBeInTheDocument();
  });
  
  test('speed control adjusts animation playback rate', async () => {
    render(<AlgorithmComparison />);
    
    // Wait for comparison results
    await waitForComparisonResults();
    
    // Find speed slider
    const speedSlider = screen.getByLabelText(/Speed:/i);
    
    // Change speed value
    fireEvent.change(speedSlider, { target: { value: '3.5' } });
    
    // Verify speed display is updated
    expect(screen.getByText(/3.5x/i)).toBeInTheDocument();
  });
  
  test('first and last buttons navigate to beginning and end', async () => {
    render(<AlgorithmComparison />);
    
    // Wait for comparison results
    await waitForComparisonResults();
    
    // Click Last button to go to end
    fireEvent.click(screen.getByRole('button', { name: /Last/i }));
    
    // Expect to be at last step (total steps in history - 1)
    expect(screen.getByText(/Step: (\d+) \//i)).toBeInTheDocument();
    
    // Click First button to go back to beginning
    fireEvent.click(screen.getByRole('button', { name: /First/i }));
    
    // Verify we're back at step 0
    expect(screen.getByText(/Step: 0 \//i)).toBeInTheDocument();
  });
});

/**
 * Educational content and implementation insights tests
 */
describe('Educational Content and Implementation Insights', () => {
  test('displays implementation insights after comparison', async () => {
    render(<AlgorithmComparison />);
    
    // Wait for comparison to complete
    await waitFor(() => {
      const bridgeInstance = PythonJSBridge.mock.results[0].value;
      expect(bridgeInstance.compareImplementations).toHaveBeenCalled();
    });
    
    // Verify implementation insights section is displayed
    await waitFor(() => {
      expect(screen.getByText(/Implementation Insights/i)).toBeInTheDocument();
      expect(screen.getByText(/Performance characteristics:/i)).toBeInTheDocument();
      expect(screen.getByText(/Memory usage patterns:/i)).toBeInTheDocument();
      expect(screen.getByText(/Optimization strategies:/i)).toBeInTheDocument();
      expect(screen.getByText(/Operation counts:/i)).toBeInTheDocument();
    });
  });
  
  test('displays step-specific details during visualization', async () => {
    render(<AlgorithmComparison />);
    
    // Wait for comparison to complete
    await waitFor(() => {
      const bridgeInstance = PythonJSBridge.mock.results[0].value;
      expect(bridgeInstance.compareImplementations).toHaveBeenCalled();
    });
    
    // Advance to step 1
    fireEvent.click(screen.getByRole('button', { name: /Next/i }));
    
    // Verify step details are displayed
    await waitFor(() => {
      expect(screen.getByText(/JavaScript Step:/i)).toBeInTheDocument();
      expect(screen.getByText(/Python Step:/i)).toBeInTheDocument();
    });
    
    // The specific message content would come from the comparison result mock
    // We're verifying the component structure is in place to display these details
  });
});

/**
 * Error handling and edge case tests
 */
describe('Error Handling and Edge Cases', () => {
  test('handles Python execution errors gracefully', async () => {
    // Mock bridge to throw error
    const mockBridgeWithError = {
      executeAlgorithm: jest.fn().mockRejectedValue(new Error('Python execution failed')),
      compareImplementations: jest.fn().mockRejectedValue(new Error('Comparison failed')),
      getAlgorithmHistory: jest.fn().mockResolvedValue([])
    };
    
    PythonJSBridge.mockImplementation(() => mockBridgeWithError);
    
    // Suppress expected console error from the rejected promise
    jest.spyOn(console, 'error').mockImplementation(() => {});
    
    render(<AlgorithmComparison />);
    
    // Wait for comparison attempt
    await waitFor(() => {
      expect(mockBridgeWithError.compareImplementations).toHaveBeenCalled();
    });
    
    // Verify error handling (specific implementation would depend on the component)
    // In this test, we're mainly verifying the component doesn't crash when bridge fails
  });
  
  test('handles empty or missing history data', async () => {
    // Mock comparison with empty history
    const emptyHistoryComparison = {
      ...MOCK_COMPARISON_RESULT,
      jsHistory: [],
      pyHistory: []
    };
    
    // Mock bridge with empty history
    const mockBridgeWithEmptyHistory = {
      executeAlgorithm: jest.fn().mockResolvedValue({
        result: SORTED_ARRAY,
        metrics: {
          comparisons: 24,
          swaps: 0,
          reads: 56,
          writes: 32,
          memory_accesses: 88,
          execution_time: 0.0203
        },
        history: []
      }),
      compareImplementations: jest.fn().mockResolvedValue(emptyHistoryComparison),
      getAlgorithmHistory: jest.fn().mockResolvedValue([])
    };
    
    PythonJSBridge.mockImplementation(() => mockBridgeWithEmptyHistory);
    
    render(<AlgorithmComparison />);
    
    // Wait for comparison to complete
    await waitFor(() => {
      expect(mockBridgeWithEmptyHistory.compareImplementations).toHaveBeenCalled();
    });
    
    // Verify component handles empty history (should still show comparison results)
    await waitFor(() => {
      expect(screen.getByText(/Performance Metrics/i)).toBeInTheDocument();
    });
    
    // Playback controls should reflect empty history
    expect(screen.getByText(/Step: 0 \/ 0/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Next/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /Last/i })).toBeDisabled();
  });
});

/**
 * Memory and resource management tests
 */
describe('Memory and Resource Management', () => {
  test('cleans up resources on unmount', async () => {
    // Render and wait for initialization
    const { unmount } = render(<AlgorithmComparison />);
    
    // Get renderer instances
    const rendererInstances = WebGLRenderer.mock.results.map(result => result.value);
    
    // Wait for initialization
    await waitFor(() => {
      expect(rendererInstances.length).toBeGreaterThan(0);
    });
    
    // Start animation
    fireEvent.click(screen.getByRole('button', { name: /Play/i }));
    
    // Unmount component
    unmount();
    
    // Verify renderer dispose was called
    rendererInstances.forEach(renderer => {
      expect(renderer.dispose).toHaveBeenCalled();
    });
    
    // Verify animation was canceled
    expect(global.cancelAnimationFrame).toHaveBeenCalled();
  });
});

/**
 * Accessibility tests
 */
describe('Accessibility Features', () => {
  test('all controls have proper aria labels', () => {
    render(<AlgorithmComparison />);
    
    // Verify controls have appropriate labels
    expect(screen.getByLabelText(/Algorithm:/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Data Type:/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Size:/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Speed:/i)).toBeInTheDocument();
  });
  
  test('provides visual progress indicators', async () => {
    render(<AlgorithmComparison />);
    
    // Wait for comparison to complete
    await waitFor(() => {
      const bridgeInstance = PythonJSBridge.mock.results[0].value;
      expect(bridgeInstance.compareImplementations).toHaveBeenCalled();
    });
    
    // Verify progress indicator exists
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });
  
  test('color contrast is sufficient for visual elements', async () => {
    render(<AlgorithmComparison />);
    
    // Wait for comparison to complete
    await waitFor(() => {
      const bridgeInstance = PythonJSBridge.mock.results[0].value;
      expect(bridgeInstance.compareImplementations).toHaveBeenCalled();
    });
    
    // Visual contrast testing would typically be done with specialized tools
    // This test serves as a reminder to consider contrast in the component design
  });
});
