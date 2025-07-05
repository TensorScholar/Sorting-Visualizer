// tests/js/visualization/components/selection-visualizer.test.js

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import SelectionVisualizer from '../../../../src/visualization/components/selection-visualizer';

/**
 * Comprehensive test suite for the SelectionVisualizer component
 * 
 * This test suite validates the visualization of selection algorithms such as
 * QuickSelect and Median of Medians. It ensures proper rendering of partitioning,
 * pivot selection, and selection process visualization.
 * 
 * @author Advanced Sorting Algorithm Visualization Platform
 */
describe('SelectionVisualizer Component', () => {
  // Mock canvas context for testing canvas operations
  let mockContext;
  
  /**
   * Setup mock canvas and context before each test
   * Simulates the canvas rendering environment for testing visualization logic
   */
  beforeEach(() => {
    // Create mock canvas context with all required methods
    mockContext = {
      clearRect: jest.fn(),
      beginPath: jest.fn(),
      moveTo: jest.fn(),
      lineTo: jest.fn(),
      rect: jest.fn(),
      arc: jest.fn(),
      fill: jest.fn(),
      stroke: jest.fn(),
      fillText: jest.fn(),
      strokeText: jest.fn(),
      fillRect: jest.fn(),
      strokeRect: jest.fn(),
      setLineDash: jest.fn(),
      getLineDash: jest.fn().mockReturnValue([]),
      save: jest.fn(),
      restore: jest.fn(),
      measureText: jest.fn().mockReturnValue({ width: 10 })
    };
    
    // Mock getContext to return our mockContext
    const mockGetContext = jest.fn().mockReturnValue(mockContext);
    
    // Mock canvas element
    const mockCanvas = {
      getContext: mockGetContext,
      width: 800,
      height: 500
    };
    
    // Replace the canvas ref with our mock
    jest.spyOn(React, 'useRef').mockReturnValue({
      current: mockCanvas
    });
  });
  
  /**
   * Reset all mocks after each test to ensure isolated test cases
   */
  afterEach(() => {
    jest.restoreAllMocks();
  });

  /**
   * Test case: Component renders with proper structure
   * Validates basic rendering functionality with appropriate DOM elements
   */
  test('renders canvas element correctly', () => {
    render(<SelectionVisualizer selectionData={null} />);
    
    // The component should render a div with appropriate class
    const visualizerContainer = screen.getByClassName('selection-visualizer');
    expect(visualizerContainer).toBeInTheDocument();
    
    // The component should render a placeholder message when no data is provided
    const placeholderMessage = screen.getByText(/waiting for selection algorithm data/i);
    expect(placeholderMessage).toBeInTheDocument();
  });
  
  /**
   * Test case: Renders QuickSelect visualization correctly
   * Validates visualization of the QuickSelect algorithm partitioning process
   */
  test('renders quickselect visualization correctly', () => {
    // Sample QuickSelect algorithm state
    const quickSelectData = {
      type: 'quickselect',
      original: [10, 5, 8, 2, 15, 7, 9, 3],
      array: [3, 2, 5, 7, 9, 8, 15, 10], // Current state after partitioning
      k: 4, // Looking for 4th smallest element (index 3 after sorting)
      pivotIndex: 3, // Pivot is at index 3 (value 7)
      pivotValue: 7,
      targetIndex: 3, // Desired k-th element index
      partitionStart: 0,
      partitionEnd: 7,
      leftElements: [3, 2, 5], // Elements < pivot
      rightElements: [9, 8, 15, 10], // Elements > pivot
      stage: 'partition', // Current algorithm stage
      message: 'Partitioning around pivot value 7'
    };
    
    render(<SelectionVisualizer 
      selectionData={quickSelectData}
      width={800}
      height={500}
    />);
    
    // Canvas should be cleared
    expect(mockContext.clearRect).toHaveBeenCalledWith(0, 0, 800, 500);
    
    // Should display algorithm information
    expect(mockContext.fillText).toHaveBeenCalledWith(
      'QuickSelect: Partitioning around pivot value 7',
      expect.any(Number),
      expect.any(Number)
    );
    
    // Should render target information
    expect(mockContext.fillText).toHaveBeenCalledWith(
      'Finding 4th smallest element',
      expect.any(Number),
      expect.any(Number)
    );
    
    // Should render array elements with appropriate highlighting
    for (let i = 0; i < quickSelectData.array.length; i++) {
      // Each element should have its value displayed
      expect(mockContext.fillText).toHaveBeenCalledWith(
        quickSelectData.array[i].toString(),
        expect.any(Number),
        expect.any(Number)
      );
    }
    
    // Should render partition indicators
    expect(mockContext.beginPath).toHaveBeenCalled();
    expect(mockContext.moveTo).toHaveBeenCalled();
    expect(mockContext.lineTo).toHaveBeenCalled();
    
    // Should highlight the pivot element
    // We can't directly test the fillStyle color, but we can check that
    // the pivot element's value is rendered
    expect(mockContext.fillText).toHaveBeenCalledWith(
      quickSelectData.pivotValue.toString(),
      expect.any(Number),
      expect.any(Number)
    );
  });
  
  /**
   * Test case: Renders Median of Medians visualization correctly
   * Validates visualization of the deterministic selection algorithm
   */
  test('renders median of medians visualization correctly', () => {
    // Sample Median of Medians algorithm state
    const medianOfMediansData = {
      type: 'median-of-medians',
      original: [9, 1, 0, 2, 3, 4, 6, 8, 7, 10, 5],
      array: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10], // Current state
      groups: [
        [0, 1, 2, 3, 4], // First group of 5
        [5, 6, 7, 8, 9], // Second group of 5
        [10]             // Last group (partial)
      ],
      medians: [2, 7, 10], // Medians of each group
      pivotValue: 7, // Selected pivot (median of medians)
      pivotIndex: 6, // Index of pivot in array
      stage: 'find-pivot', // Current algorithm stage
      message: 'Finding pivot using median of medians',
      k: 5 // Looking for 5th smallest element
    };
    
    render(<SelectionVisualizer 
      selectionData={medianOfMediansData}
    />);
    
    // Canvas should be cleared
    expect(mockContext.clearRect).toHaveBeenCalled();
    
    // Should display algorithm information
    expect(mockContext.fillText).toHaveBeenCalledWith(
      'Median of Medians: Finding pivot using median of medians',
      expect.any(Number),
      expect.any(Number)
    );
    
    // Should render target information
    expect(mockContext.fillText).toHaveBeenCalledWith(
      'Finding 5th smallest element',
      expect.any(Number),
      expect.any(Number)
    );
    
    // Should render groups
    for (let i = 0; i < medianOfMediansData.groups.length; i++) {
      // Should draw group container
      expect(mockContext.strokeRect).toHaveBeenCalled();
      
      // Should render group elements
      for (const value of medianOfMediansData.groups[i]) {
        expect(mockContext.fillText).toHaveBeenCalledWith(
          value.toString(),
          expect.any(Number),
          expect.any(Number)
        );
      }
    }
    
    // Should highlight group medians
    for (const median of medianOfMediansData.medians) {
      expect(mockContext.fillText).toHaveBeenCalledWith(
        median.toString(),
        expect.any(Number),
        expect.any(Number)
      );
    }
    
    // Should highlight the pivot element
    expect(mockContext.fillText).toHaveBeenCalledWith(
      medianOfMediansData.pivotValue.toString(),
      expect.any(Number),
      expect.any(Number)
    );
  });
  
  /**
   * Test case: Renders recursion visualization correctly
   * Validates visualization of recursive calls in selection algorithms
   */
  test('renders recursion visualization correctly', () => {
    // Sample recursion state in QuickSelect
    const recursionData = {
      type: 'quickselect',
      original: [10, 5, 8, 2, 15, 7, 9, 3],
      array: [3, 2, 5, 7, 9, 8, 15, 10], // Current state
      k: 4, // Looking for 4th smallest element
      pivotIndex: 3, // Pivot is at index 3 (value 7)
      pivotValue: 7,
      targetIndex: 3, // Desired k-th element index
      partitionStart: 0,
      partitionEnd: 7,
      leftElements: [3, 2, 5], // Elements < pivot
      rightElements: [9, 8, 15, 10], // Elements > pivot
      stage: 'recurse', // Current algorithm stage - recursing
      message: 'Pivot index equals target index, found the element!',
      recursionLevel: 2, // Current recursion depth
      recursionHistory: [
        { range: [0, 7], pivot: 10, k: 4 },
        { range: [0, 5], pivot: 7, k: 4 }
      ]
    };
    
    render(<SelectionVisualizer 
      selectionData={recursionData}
    />);
    
    // Canvas should be cleared
    expect(mockContext.clearRect).toHaveBeenCalled();
    
    // Should display algorithm information with recursion level
    expect(mockContext.fillText).toHaveBeenCalledWith(
      'QuickSelect (Recursion Level 2): Pivot index equals target index, found the element!',
      expect.any(Number),
      expect.any(Number)
    );
    
    // Should display recursion history
    for (const entry of recursionData.recursionHistory) {
      // Should render text with recursion information
      expect(mockContext.fillText).toHaveBeenCalledWith(
        expect.stringContaining(entry.pivot.toString()),
        expect.any(Number),
        expect.any(Number)
      );
    }
    
    // Should highlight the pivot element at the target index
    expect(mockContext.fillText).toHaveBeenCalledWith(
      recursionData.pivotValue.toString(),
      expect.any(Number),
      expect.any(Number)
    );
  });
  
  /**
   * Test case: Animates transitions between states
   * Validates smooth animated visualization between algorithm steps
   */
  test('animates transitions between algorithm states', () => {
    // Initial state
    const initialState = {
      type: 'quickselect',
      original: [10, 5, 8, 2, 15, 7, 9, 3],
      array: [10, 5, 8, 2, 15, 7, 9, 3], // Unsorted
      k: 4,
      pivotIndex: 0, // Initial pivot
      pivotValue: 10,
      targetIndex: 3,
      partitionStart: 0,
      partitionEnd: 7,
      stage: 'select-pivot',
      message: 'Selecting pivot element'
    };
    
    const { rerender } = render(
      <SelectionVisualizer 
        selectionData={initialState}
        enableAnimation={true}
      />
    );
    
    // Reset mocks to isolate next render
    mockContext.clearRect.mockClear();
    mockContext.fillText.mockClear();
    mockContext.fillRect.mockClear();
    
    // Updated state after partitioning
    const updatedState = {
      type: 'quickselect',
      original: [10, 5, 8, 2, 15, 7, 9, 3],
      array: [5, 8, 2, 3, 7, 9, 15, 10], // After partitioning
      k: 4,
      pivotIndex: 7, // Pivot moved to end
      pivotValue: 10,
      targetIndex: 3,
      partitionStart: 0,
      partitionEnd: 7,
      leftElements: [5, 8, 2, 3, 7, 9], // Elements < pivot
      rightElements: [15], // Elements > pivot
      stage: 'partition',
      message: 'Partitioning around pivot value 10'
    };
    
    // Mock requestAnimationFrame for animation testing
    jest.spyOn(window, 'requestAnimationFrame').mockImplementation(cb => {
      cb(performance.now() + 100); // Simulate 100ms passing
      return 1;
    });
    
    rerender(<SelectionVisualizer 
      selectionData={updatedState}
      enableAnimation={true}
    />);
    
    // Canvas should be cleared for the animation
    expect(mockContext.clearRect).toHaveBeenCalled();
    
    // Should display updated algorithm information
    expect(mockContext.fillText).toHaveBeenCalledWith(
      'QuickSelect: Partitioning around pivot value 10',
      expect.any(Number),
      expect.any(Number)
    );
    
    // Should render the updated array state
    for (let i = 0; i < updatedState.array.length; i++) {
      expect(mockContext.fillText).toHaveBeenCalledWith(
        updatedState.array[i].toString(),
        expect.any(Number),
        expect.any(Number)
      );
    }
    
    // Clean up
    window.requestAnimationFrame.mockRestore();
  });
  
  /**
   * Test case: Visualizes completion state correctly
   * Validates visualization of the final state when selection is complete
   */
  test('visualizes completion state correctly', () => {
    // Selection completion state
    const completionState = {
      type: 'quickselect',
      original: [10, 5, 8, 2, 15, 7, 9, 3],
      array: [3, 2, 5, 7, 8, 9, 10, 15], // Partially sorted array
      k: 4,
      selectedElement: 7, // The found k-th element
      selectedIndex: 3, // Index of the found element
      stage: 'complete',
      message: 'Found the 4th smallest element: 7'
    };
    
    render(<SelectionVisualizer 
      selectionData={completionState}
    />);
    
    // Canvas should be cleared
    expect(mockContext.clearRect).toHaveBeenCalled();
    
    // Should display completion message
    expect(mockContext.fillText).toHaveBeenCalledWith(
      'QuickSelect: Found the 4th smallest element: 7',
      expect.any(Number),
      expect.any(Number)
    );
    
    // Should highlight the selected element
    // We can't directly test the fillStyle color, but we can check that
    // the element rendering operations were called
    expect(mockContext.fillRect).toHaveBeenCalled();
    
    // Should render the final array state
    for (let i = 0; i < completionState.array.length; i++) {
      expect(mockContext.fillText).toHaveBeenCalledWith(
        completionState.array[i].toString(),
        expect.any(Number),
        expect.any(Number)
      );
    }
    
    // Should prominently display the result
    expect(mockContext.fillText).toHaveBeenCalledWith(
      expect.stringContaining('7'),
      expect.any(Number),
      expect.any(Number)
    );
  });
  
  /**
   * Test case: Renders partition comparison operations
   * Validates visualization of element comparisons during partitioning
   */
  test('renders partition comparison operations', () => {
    // State showing comparison during partitioning
    const comparisonState = {
      type: 'quickselect',
      original: [10, 5, 8, 2, 15, 7, 9, 3],
      array: [5, 2, 3, 8, 15, 7, 9, 10], // Current state
      k: 4,
      pivotIndex: 7,
      pivotValue: 10,
      comparingIndices: [3, 7], // Currently comparing these elements
      comparingValues: [8, 10], // Values being compared
      comparisonResult: '<', // 8 < 10
      partitionStart: 0,
      partitionEnd: 7,
      stage: 'compare',
      message: 'Comparing 8 with pivot 10'
    };
    
    render(<SelectionVisualizer 
      selectionData={comparisonState}
    />);
    
    // Canvas should be cleared
    expect(mockContext.clearRect).toHaveBeenCalled();
    
    // Should display comparison message
    expect(mockContext.fillText).toHaveBeenCalledWith(
      'QuickSelect: Comparing 8 with pivot 10',
      expect.any(Number),
      expect.any(Number)
    );
    
    // Should highlight the elements being compared
    for (const value of comparisonState.comparingValues) {
      expect(mockContext.fillText).toHaveBeenCalledWith(
        value.toString(),
        expect.any(Number),
        expect.any(Number)
      );
    }
    
    // Should render comparison arrow or indicator
    expect(mockContext.beginPath).toHaveBeenCalled();
    expect(mockContext.moveTo).toHaveBeenCalled();
    expect(mockContext.lineTo).toHaveBeenCalled();
    expect(mockContext.stroke).toHaveBeenCalled();
  });
  
  /**
   * Test case: Handles empty selection data gracefully
   * Validates error handling for edge cases
   */
  test('handles empty selection data gracefully', () => {
    // Empty but valid data structure
    const emptyData = {
      type: 'quickselect',
      original: [],
      array: [],
      k: 0,
      stage: 'error',
      message: 'Cannot find element in empty array'
    };
    
    render(<SelectionVisualizer selectionData={emptyData} />);
    
    // Canvas should be cleared
    expect(mockContext.clearRect).toHaveBeenCalled();
    
    // Should display error message
    expect(mockContext.fillText).toHaveBeenCalledWith(
      'QuickSelect: Cannot find element in empty array',
      expect.any(Number),
      expect.any(Number)
    );
    
    // Should not attempt to render elements
    expect(mockContext.fillRect).not.toHaveBeenCalled();
  });
  
  /**
   * Test case: Applies custom styling options correctly
   * Validates customization capabilities
   */
  test('applies custom styling options correctly', () => {
    const quickSelectData = {
      type: 'quickselect',
      original: [10, 5, 8, 2, 15, 7, 9, 3],
      array: [5, 2, 3, 7, 8, 9, 15, 10],
      k: 4,
      pivotIndex: 7,
      pivotValue: 10,
      stage: 'partition',
      message: 'Partitioning around pivot'
    };
    
    render(
      <SelectionVisualizer 
        selectionData={quickSelectData}
        elementColor="#3F51B5"
        pivotColor="#F44336"
        targetColor="#4CAF50"
        textColor="#212121"
        backgroundColor="#F5F5F5"
      />
    );
    
    // Canvas should be cleared
    expect(mockContext.clearRect).toHaveBeenCalled();
    
    // Custom styling would affect fillStyle properties which are difficult
    // to validate in Jest without more sophisticated canvas mocking
    // We verify the overall rendering process occurred
    expect(mockContext.fillRect).toHaveBeenCalled();
    expect(mockContext.fillText).toHaveBeenCalled();
  });
  
  /**
   * Test case: Handles malformed selection data gracefully
   * Validates error handling for invalid input
   */
  test('handles malformed selection data gracefully', () => {
    // Malformed data with missing required properties
    const malformedData = {
      type: 'quickselect',
      // Missing original array, k, etc.
      message: 'Incomplete data'
    };
    
    // Should not throw errors when rendering with malformed data
    expect(() => {
      render(<SelectionVisualizer selectionData={malformedData} />);
    }).not.toThrow();
    
    // Canvas should be cleared
    expect(mockContext.clearRect).toHaveBeenCalled();
    
    // Should attempt to render available information
    expect(mockContext.fillText).toHaveBeenCalledWith(
      'QuickSelect: Incomplete data',
      expect.any(Number),
      expect.any(Number)
    );
  });
});
