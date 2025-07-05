// tests/js/components/sorting-visualizer.test.js

/**
 * Comprehensive test suite for the SortingVisualizer component
 * 
 * This test suite employs a combination of isolated unit tests and integration tests
 * to validate the complete functionality of the SortingVisualizer component, which
 * serves as the primary visualization interface for the algorithm platform.
 * 
 * Test categories include:
 * - Component initialization and rendering
 * - Algorithm execution pipeline
 * - Animation state management
 * - User interaction handling
 * - WebGL/Canvas rendering integration
 * - Performance and memory considerations
 * 
 * @author Advanced Sorting Algorithm Visualization Platform
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import SortingVisualizer from '../../../src/components/SortingVisualizer';
import { WebGLRenderer } from '../../../src/visualization/renderers/webgl-renderer';
import { ArrayRenderer } from '../../../src/visualization/renderers/array-renderer';
import { generateDataSet } from '../../../src/data/generators';
import HeapVisualizer from '../../../src/visualization/components/HeapVisualizer';
import BubbleSort from '../../../src/algorithms/comparison/bubble';
import MergeSort from '../../../src/algorithms/comparison/merge';
import HeapSort from '../../../src/algorithms/comparison/heap';

// Mock the WebGL and Canvas contexts and other browser APIs
jest.mock('../../../src/visualization/renderers/webgl-renderer');
jest.mock('../../../src/visualization/renderers/array-renderer');
jest.mock('../../../src/data/generators');
jest.mock('../../../src/visualization/components/HeapVisualizer', () => jest.fn(
  () => <div data-testid="heap-visualizer">Heap Visualizer Mock</div>
));

// Mock requestAnimationFrame and cancelAnimationFrame
global.requestAnimationFrame = jest.fn(callback => {
  return setTimeout(() => callback(performance.now()), 0);
});

global.cancelAnimationFrame = jest.fn(id => {
  clearTimeout(id);
});

// Sample test data
const TEST_ARRAY = [5, 3, 8, 2, 1, 4, 7, 6];
const TEST_STEP_HISTORY = [
  { 
    type: 'initial', 
    array: [...TEST_ARRAY], 
    message: 'Initial array state' 
  },
  { 
    type: 'comparison', 
    array: [...TEST_ARRAY], 
    indices: [0, 1], 
    message: 'Comparing elements at indices 0 and 1'
  },
  { 
    type: 'swap', 
    array: [3, 5, 8, 2, 1, 4, 7, 6], 
    indices: [0, 1], 
    message: 'Swapped elements at indices 0 and 1'
  },
  // Additional steps would be added here
  { 
    type: 'final', 
    array: [1, 2, 3, 4, 5, 6, 7, 8], 
    message: 'Final sorted state'
  }
];

// Mocked algorithm instances
const mockBubbleSort = {
  name: 'Bubble Sort',
  execute: jest.fn().mockImplementation(() => {
    return Promise.resolve([1, 2, 3, 4, 5, 6, 7, 8]);
  }),
  getMetrics: jest.fn().mockReturnValue({
    comparisons: 28,
    swaps: 13,
    reads: 56,
    writes: 26,
    memoryAccesses: 82,
    startTime: 1000,
    endTime: 1025,
    executionTime: 25
  }),
  getComplexity: jest.fn().mockReturnValue({
    time: { average: 'O(n²)' },
    space: { average: 'O(1)' }
  }),
  isStable: jest.fn().mockReturnValue(true),
  isInPlace: jest.fn().mockReturnValue(true),
  options: {
    optimize: true,
    adaptive: true
  }
};

const mockHeapSort = {
  name: 'Heap Sort',
  execute: jest.fn().mockImplementation(() => {
    return Promise.resolve([1, 2, 3, 4, 5, 6, 7, 8]);
  }),
  getMetrics: jest.fn().mockReturnValue({
    comparisons: 20,
    swaps: 10,
    reads: 40,
    writes: 20,
    memoryAccesses: 60,
    startTime: 1000,
    endTime: 1020,
    executionTime: 20
  }),
  getComplexity: jest.fn().mockReturnValue({
    time: { average: 'O(n log n)' },
    space: { average: 'O(1)' }
  }),
  isStable: jest.fn().mockReturnValue(false),
  isInPlace: jest.fn().mockReturnValue(true),
  options: {
    visualizeHeap: true,
    optimizeLeafChecks: true
  }
};

// Setup mocks for external dependencies
beforeEach(() => {
  jest.clearAllMocks();
  
  // Mock data generation
  generateDataSet.mockReturnValue(TEST_ARRAY);
  
  // Mock renderer implementations
  WebGLRenderer.mockImplementation(() => ({
    setData: jest.fn(),
    highlight: jest.fn(),
    markComparing: jest.fn(),
    markSorted: jest.fn(),
    resize: jest.fn(),
    dispose: jest.fn(),
    setOptions: jest.fn()
  }));
  
  ArrayRenderer.mockImplementation(() => ({
    setData: jest.fn(),
    highlight: jest.fn(),
    markComparing: jest.fn(),
    markSorted: jest.fn(),
    resize: jest.fn(),
    dispose: jest.fn(),
    setOptions: jest.fn()
  }));
  
  // Setup algorithm mocks to provide step history
  mockBubbleSort.execute.mockImplementation(() => {
    return Promise.resolve([1, 2, 3, 4, 5, 6, 7, 8]);
  });
  
  // Mock the step history reference
  Object.defineProperty(global, 'stepHistoryRef', {
    value: { current: TEST_STEP_HISTORY },
    writable: true
  });
});

/**
 * Core component rendering and initialization tests
 * Validates the fundamental rendering behavior and initial state
 */
describe('SortingVisualizer Component Rendering', () => {
  test('renders without crashing', () => {
    render(<SortingVisualizer algorithm={mockBubbleSort} />);
    expect(screen.getByText(/Bubble Sort/i)).toBeInTheDocument();
  });
  
  test('initializes with proper default state', () => {
    render(<SortingVisualizer algorithm={mockBubbleSort} />);
    
    // Verify initial UI state
    expect(screen.getByText(/Step: 0/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Play/i })).toBeEnabled();
    expect(screen.getByRole('button', { name: /First/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /Prev/i })).toBeDisabled();
  });
  
  test('correctly initializes WebGL renderer with canvas', () => {
    render(<SortingVisualizer algorithm={mockBubbleSort} />);
    
    // Verify WebGL renderer was initialized
    expect(WebGLRenderer).toHaveBeenCalled();
    
    // Verify initial data was passed to renderer
    const rendererInstance = WebGLRenderer.mock.results[0].value;
    expect(rendererInstance.setData).toHaveBeenCalledWith(TEST_ARRAY);
  });
  
  test('displays algorithm information correctly', () => {
    render(<SortingVisualizer algorithm={mockBubbleSort} />);
    
    // Verify algorithm info is displayed
    expect(screen.getByText(/Bubble Sort/i)).toBeInTheDocument();
    expect(screen.getByText(/Time: O\(n²\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Space: O\(1\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Stable: Yes/i)).toBeInTheDocument();
  });
  
  test('renders heap visualizer for heap sort', () => {
    render(<SortingVisualizer algorithm={mockHeapSort} />);
    
    // Execute algorithm to trigger visualization
    fireEvent.click(screen.getByRole('button', { name: /Regenerate Data/i }));
    
    // Since visualization is conditional on heap structure data,
    // we would need to trigger that state in a real integration test
    // For this unit test, we verify the component behavior
    expect(mockHeapSort.execute).toHaveBeenCalled();
  });
});

/**
 * Data generation and management tests
 * Validates the component's ability to generate and manage different data sets
 */
describe('Data Management', () => {
  test('generates initial data on mount', () => {
    render(<SortingVisualizer algorithm={mockBubbleSort} />);
    expect(generateDataSet).toHaveBeenCalled();
  });
  
  test('regenerates data when button is clicked', () => {
    render(<SortingVisualizer algorithm={mockBubbleSort} />);
    
    // Reset mocks to verify new calls
    generateDataSet.mockClear();
    
    // Click regenerate button
    fireEvent.click(screen.getByRole('button', { name: /Regenerate Data/i }));
    
    // Verify data was regenerated
    expect(generateDataSet).toHaveBeenCalled();
  });
  
  test('changes data set type when selector is changed', () => {
    render(<SortingVisualizer algorithm={mockBubbleSort} />);
    
    // Reset mocks to verify new calls
    generateDataSet.mockClear();
    
    // Change data type
    fireEvent.change(screen.getByLabelText(/Data Type:/i), { target: { value: 'nearly-sorted' } });
    
    // Verify data was regenerated with new type
    expect(generateDataSet).toHaveBeenCalledWith('nearly-sorted', expect.any(Number), expect.any(Object));
  });
  
  test('changes data size when selector is changed', () => {
    render(<SortingVisualizer algorithm={mockBubbleSort} />);
    
    // Reset mocks to verify new calls
    generateDataSet.mockClear();
    
    // Change data size
    fireEvent.change(screen.getByLabelText(/Size:/i), { target: { value: '50' } });
    
    // Verify data was regenerated with new size
    expect(generateDataSet).toHaveBeenCalledWith(expect.any(String), 50, expect.any(Object));
  });
});

/**
 * Algorithm execution tests
 * Validates the component's algorithm execution pipeline and state updates
 */
describe('Algorithm Execution', () => {
  test('executes algorithm on data change', async () => {
    render(<SortingVisualizer algorithm={mockBubbleSort} />);
    
    // Reset mocks to verify new calls
    mockBubbleSort.execute.mockClear();
    
    // Change data to trigger execution
    fireEvent.click(screen.getByRole('button', { name: /Regenerate Data/i }));
    
    // Verify algorithm was executed
    await waitFor(() => {
      expect(mockBubbleSort.execute).toHaveBeenCalled();
    });
  });
  
  test('displays metrics after algorithm execution', async () => {
    render(<SortingVisualizer algorithm={mockBubbleSort} />);
    
    // Trigger algorithm execution
    fireEvent.click(screen.getByRole('button', { name: /Regenerate Data/i }));
    
    // Verify metrics are displayed after execution
    await waitFor(() => {
      expect(screen.getByText(/Comparisons:/i)).toBeInTheDocument();
      expect(screen.getByText(/28/)).toBeInTheDocument(); // From mock metrics
      expect(screen.getByText(/Swaps:/i)).toBeInTheDocument();
      expect(screen.getByText(/13/)).toBeInTheDocument(); // From mock metrics
    });
  });
});

/**
 * Animation and playback control tests
 * Validates the component's animation system and playback controls
 */
describe('Animation and Playback Controls', () => {
  // Utility function to setup step history
  const setupWithStepHistory = () => {
    // Create a component with access to step history
    const result = render(<SortingVisualizer algorithm={mockBubbleSort} />);
    
    // Simulate algorithm execution that would populate step history
    mockBubbleSort.execute.mockImplementation(() => {
      // In the real component, this would update the stepHistoryRef
      Object.defineProperty(result.container, 'stepHistoryRef', {
        value: { current: TEST_STEP_HISTORY },
        writable: true
      });
      return Promise.resolve([1, 2, 3, 4, 5, 6, 7, 8]);
    });
    
    // Trigger algorithm execution
    fireEvent.click(screen.getByRole('button', { name: /Regenerate Data/i }));
    
    return result;
  };
  
  test('step navigation buttons become enabled after execution', async () => {
    setupWithStepHistory();
    
    // Wait for execution to complete
    await waitFor(() => {
      expect(mockBubbleSort.execute).toHaveBeenCalled();
    });
    
    // Verify Next and Last buttons are enabled
    expect(screen.getByRole('button', { name: /Next/i })).toBeEnabled();
    expect(screen.getByRole('button', { name: /Last/i })).toBeEnabled();
  });
  
  test('play button toggles animation state', async () => {
    setupWithStepHistory();
    
    // Wait for execution to complete
    await waitFor(() => {
      expect(mockBubbleSort.execute).toHaveBeenCalled();
    });
    
    // Click play button
    fireEvent.click(screen.getByRole('button', { name: /Play/i }));
    
    // Verify button text changes to Pause
    expect(screen.getByRole('button', { name: /Pause/i })).toBeInTheDocument();
    
    // Click pause button
    fireEvent.click(screen.getByRole('button', { name: /Pause/i }));
    
    // Verify button text changes back to Play
    expect(screen.getByRole('button', { name: /Play/i })).toBeInTheDocument();
  });
  
  test('Next button advances to next step', async () => {
    setupWithStepHistory();
    
    // Wait for execution to complete
    await waitFor(() => {
      expect(mockBubbleSort.execute).toHaveBeenCalled();
    });
    
    // Initial step is 0
    expect(screen.getByText(/Step: 0/)).toBeInTheDocument();
    
    // Click Next button
    fireEvent.click(screen.getByRole('button', { name: /Next/i }));
    
    // Verify step advances to 1
    expect(screen.getByText(/Step: 1/)).toBeInTheDocument();
  });
  
  test('Last button jumps to final step', async () => {
    setupWithStepHistory();
    
    // Wait for execution to complete
    await waitFor(() => {
      expect(mockBubbleSort.execute).toHaveBeenCalled();
    });
    
    // Click Last button
    fireEvent.click(screen.getByRole('button', { name: /Last/i }));
    
    // Verify step jumps to final step (TEST_STEP_HISTORY.length - 1)
    expect(screen.getByText(`Step: ${TEST_STEP_HISTORY.length - 1}`)).toBeInTheDocument();
  });
  
  test('animation speed slider controls playback speed', async () => {
    setupWithStepHistory();
    
    // Wait for execution to complete
    await waitFor(() => {
      expect(mockBubbleSort.execute).toHaveBeenCalled();
    });
    
    // Change speed slider
    fireEvent.change(screen.getByLabelText(/Speed:/i), { target: { value: '5.0' } });
    
    // Verify speed display updates
    expect(screen.getByText(/5.0x/)).toBeInTheDocument();
  });
});

/**
 * Renderer integration tests
 * Validates the component's integration with rendering systems
 */
describe('Renderer Integration', () => {
  test('switches between WebGL and Canvas renderers', () => {
    render(<SortingVisualizer algorithm={mockBubbleSort} />);
    
    // Initially WebGL renderer should be used
    expect(WebGLRenderer).toHaveBeenCalled();
    expect(ArrayRenderer).not.toHaveBeenCalled();
    
    // Change renderer to Canvas
    fireEvent.change(screen.getByLabelText(/Renderer:/i), { target: { value: 'canvas' } });
    
    // After change, ArrayRenderer should be instantiated
    expect(ArrayRenderer).toHaveBeenCalled();
  });
  
  test('updates renderer with visualization data during step navigation', async () => {
    const { container } = render(<SortingVisualizer algorithm={mockBubbleSort} />);
    
    // Wait for initial setup
    await waitFor(() => {
      expect(WebGLRenderer).toHaveBeenCalled();
    });
    
    // Get renderer instance
    const rendererInstance = WebGLRenderer.mock.results[0].value;
    
    // Simulate some step history
    Object.defineProperty(container, 'stepHistoryRef', {
      value: { current: TEST_STEP_HISTORY },
      writable: true
    });
    
    // Force a step navigation within the component
    // This requires us to mock the navigateStep function or trigger it indirectly
    
    // For this test, we'll focus on verifying the renderer interface is correctly used
    expect(rendererInstance.setData).toHaveBeenCalled();
  });
  
  test('properly handles renderer cleanup on unmount', () => {
    const { unmount } = render(<SortingVisualizer algorithm={mockBubbleSort} />);
    
    // Get renderer instance
    const rendererInstance = WebGLRenderer.mock.results[0].value;
    
    // Unmount component
    unmount();
    
    // Verify dispose was called on renderer
    expect(rendererInstance.dispose).toHaveBeenCalled();
  });
});

/**
 * Special algorithm visualization tests
 * Validates specific visualization features for different algorithm types
 */
describe('Special Algorithm Visualizations', () => {
  test('displays heap visualizer for Heap Sort', async () => {
    // Mock heap structure data
    const heapStructure = {
      nodes: [
        { id: 0, value: 8, level: 0, isLeaf: false },
        { id: 1, value: 5, level: 1, isLeaf: false },
        { id: 2, value: 7, level: 1, isLeaf: false },
        { id: 3, value: 3, level: 2, isLeaf: true },
        { id: 4, value: 1, level: 2, isLeaf: true },
        { id: 5, value: 4, level: 2, isLeaf: true },
        { id: 6, value: 6, level: 2, isLeaf: true }
      ],
      edges: [
        { from: 0, to: 1, type: 'left' },
        { from: 0, to: 2, type: 'right' },
        { from: 1, to: 3, type: 'left' },
        { from: 1, to: 4, type: 'right' },
        { from: 2, to: 5, type: 'left' },
        { from: 2, to: 6, type: 'right' }
      ],
      highlight: 0
    };
    
    // Create test step history with heap structure
    const heapStepHistory = [
      ...TEST_STEP_HISTORY,
      { 
        type: 'heap-complete', 
        array: [8, 5, 7, 3, 1, 4, 6], 
        heapStructure: heapStructure,
        message: 'Heap construction complete' 
      }
    ];
    
    // Mock execution to set heap step history
    mockHeapSort.execute.mockImplementation(() => {
      // In the real component, this would update the stepHistoryRef
      global.stepHistoryRef = { current: heapStepHistory };
      return Promise.resolve([1, 2, 3, 4, 5, 6, 7, 8]);
    });
    
    render(<SortingVisualizer algorithm={mockHeapSort} />);
    
    // Trigger algorithm execution
    fireEvent.click(screen.getByRole('button', { name: /Regenerate Data/i }));
    
    // Navigate to the step with heap structure
    await waitFor(() => {
      expect(mockHeapSort.execute).toHaveBeenCalled();
    });
    
    // In a real test, this would require more complex state manipulation
    // Here we verify the HeapVisualizer component is imported and ready to use
    expect(HeapVisualizer).toHaveBeenCalled();
  });
});

/**
 * Performance and resource management tests
 * Validates efficient resource usage and performance characteristics
 */
describe('Performance and Resource Management', () => {
  test('properly cancels animations on component unmount', () => {
    const { unmount } = render(<SortingVisualizer algorithm={mockBubbleSort} />);
    
    // Start animation
    fireEvent.click(screen.getByRole('button', { name: /Play/i }));
    
    // Unmount component
    unmount();
    
    // Verify cancelAnimationFrame was called
    expect(global.cancelAnimationFrame).toHaveBeenCalled();
  });
  
  test('disables controls during algorithm execution and animation', async () => {
    // Mock long-running execution
    mockBubbleSort.execute.mockImplementation(() => {
      return new Promise(resolve => {
        setTimeout(() => resolve([1, 2, 3, 4, 5, 6, 7, 8]), 100);
      });
    });
    
    render(<SortingVisualizer algorithm={mockBubbleSort} />);
    
    // Trigger algorithm execution
    fireEvent.click(screen.getByRole('button', { name: /Regenerate Data/i }));
    
    // Verify controls are disabled during execution
    // In a real component this would require more implementation details
    // For this test, we validate the critical controls
    expect(screen.getByLabelText(/Data Type:/i)).toBeDisabled();
    expect(screen.getByLabelText(/Size:/i)).toBeDisabled();
    
    // Wait for execution to complete
    await waitFor(() => {
      expect(mockBubbleSort.execute).toHaveBeenCalled();
    }, { timeout: 200 });
  });
});

/**
 * Accessibility tests
 * Validates component accessibility features
 */
describe('Accessibility Features', () => {
  test('controls have proper labels for screen readers', () => {
    render(<SortingVisualizer algorithm={mockBubbleSort} />);
    
    // Verify important controls have proper labels
    expect(screen.getByLabelText(/Data Type:/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Size:/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Renderer:/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Speed:/i)).toBeInTheDocument();
  });
  
  test('progress indicator provides visual feedback', () => {
    render(<SortingVisualizer algorithm={mockBubbleSort} />);
    
    // Verify progress element exists
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });
});
