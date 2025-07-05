// tests/js/visualization/components/transform-visualizer.test.js

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import TransformVisualizer from '../../../../src/visualization/components/transform-visualizer';

/**
 * Comprehensive test suite for the TransformVisualizer component
 * 
 * This test suite validates the visualization of transformation-based 
 * sorting algorithms such as Pancake Sort, Cycle Sort, and others that involve
 * unusual array manipulations. It ensures proper rendering of array flips,
 * cycle detections, and other specialized operations.
 * 
 * @author Advanced Sorting Algorithm Visualization Platform
 */
describe('TransformVisualizer Component', () => {
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
      arc: jest.fn(),
      bezierCurveTo: jest.fn(),
      quadraticCurveTo: jest.fn(),
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
      translate: jest.fn(),
      rotate: jest.fn(),
      scale: jest.fn(),
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
    render(<TransformVisualizer transformData={null} />);
    
    // The component should render a div with appropriate class
    const visualizerContainer = screen.getByClassName('transform-visualizer');
    expect(visualizerContainer).toBeInTheDocument();
    
    // The component should render a placeholder message when no data is provided
    const placeholderMessage = screen.getByText(/waiting for transform algorithm data/i);
    expect(placeholderMessage).toBeInTheDocument();
  });
  
  /**
   * Test case: Renders pancake sort visualization correctly
   * Validates visualization of array flipping operations in Pancake Sort
   */
  test('renders pancake sort visualization correctly', () => {
    // Sample Pancake Sort algorithm state
    const pancakeSortData = {
      type: 'pancake',
      original: [5, 2, 4, 1, 3],
      array: [5, 2, 4, 1, 3], // Current state
      maxIndex: 0, // Index of the maximum element in the current unsorted portion
      maxValue: 5, // Value of the maximum element
      flipIndex: 0, // Index up to which to flip the array
      flippedSection: [0, 0], // Range being flipped [start, end]
      step: 'findMax', // Current step: finding maximum
      isFlipping: false, // Whether currently performing a flip
      sortedIndex: 0, // Index from which the array is already sorted
      message: 'Finding maximum element in unsorted portion'
    };
    
    render(<TransformVisualizer 
      transformData={pancakeSortData}
      width={800}
      height={500}
    />);
    
    // Canvas should be cleared
    expect(mockContext.clearRect).toHaveBeenCalledWith(0, 0, 800, 500);
    
    // Should display algorithm information
    expect(mockContext.fillText).toHaveBeenCalledWith(
      'Pancake Sort: Finding maximum element in unsorted portion',
      expect.any(Number),
      expect.any(Number)
    );
    
    // Should render array elements
    for (let i = 0; i < pancakeSortData.array.length; i++) {
      expect(mockContext.fillText).toHaveBeenCalledWith(
        pancakeSortData.array[i].toString(),
        expect.any(Number),
        expect.any(Number)
      );
    }
    
    // Should highlight the maximum element
    expect(mockContext.fillRect).toHaveBeenCalled();
  });
  
  /**
   * Test case: Renders array flipping animation correctly
   * Validates visualization of the key pancake flipping operation
   */
  test('renders pancake flip animation correctly', () => {
    // Pancake Sort during flip operation
    const flipAnimationData = {
      type: 'pancake',
      original: [5, 2, 4, 1, 3],
      array: [4, 2, 5, 1, 3], // Array during flip transition
      maxIndex: 2, // Index of the maximum element (5)
      maxValue: 5, // Value of the maximum element
      flipIndex: 2, // Flipping up to index 2
      flippedSection: [0, 2], // Range being flipped [0, 2]
      step: 'flip', // Currently flipping
      isFlipping: true, // Animation in progress
      flipProgress: 0.5, // 50% through the flip animation
      sortedIndex: 0, // No elements sorted yet
      message: 'Flipping array from index 0 to 2'
    };
    
    render(<TransformVisualizer 
      transformData={flipAnimationData}
    />);
    
    // Canvas should be cleared
    expect(mockContext.clearRect).toHaveBeenCalled();
    
    // Should display algorithm information
    expect(mockContext.fillText).toHaveBeenCalledWith(
      'Pancake Sort: Flipping array from index 0 to 2',
      expect.any(Number),
      expect.any(Number)
    );
    
    // For flip animation, should use transform operations
    expect(mockContext.save).toHaveBeenCalled();
    
    // Should draw the flipping elements with transformation
    // Elements in the flipped section should be drawn with rotation/translation
    for (let i = 0; i <= flipAnimationData.flipIndex; i++) {
      expect(mockContext.fillText).toHaveBeenCalledWith(
        flipAnimationData.array[i].toString(),
        expect.any(Number),
        expect.any(Number)
      );
    }
    
    // Should restore context after transformations
    expect(mockContext.restore).toHaveBeenCalled();
  });
  
  /**
   * Test case: Renders cycle sort visualization correctly
   * Validates visualization of cycle detection and element placement
   */
  test('renders cycle sort visualization correctly', () => {
    // Sample Cycle Sort algorithm state
    const cycleSortData = {
      type: 'cycle',
      original: [5, 2, 4, 1, 3],
      array: [1, 2, 3, 4, 5], // Current state (partially sorted)
      activeIndex: 0, // Current index being processed
      activeValue: 5, // Value at active index
      cycleStart: 0, // Start of current cycle
      currentPosition: 4, // Calculated correct position for active value
      writes: 3, // Number of writes performed so far
      cycle: [0, 4, 3, 2, 1], // Indices in the current cycle
      step: 'findPosition', // Current step: finding correct position
      message: 'Finding correct position for element 5'
    };
    
    render(<TransformVisualizer 
      transformData={cycleSortData}
    />);
    
    // Canvas should be cleared
    expect(mockContext.clearRect).toHaveBeenCalled();
    
    // Should display algorithm information
    expect(mockContext.fillText).toHaveBeenCalledWith(
      'Cycle Sort: Finding correct position for element 5',
      expect.any(Number),
      expect.any(Number)
    );
    
    // Should render array elements
    for (let i = 0; i < cycleSortData.array.length; i++) {
      expect(mockContext.fillText).toHaveBeenCalledWith(
        cycleSortData.array[i].toString(),
        expect.any(Number),
        expect.any(Number)
      );
    }
    
    // Should highlight the active element
    expect(mockContext.fillRect).toHaveBeenCalled();
    
    // Should display cycle information
    expect(mockContext.fillText).toHaveBeenCalledWith(
      expect.stringContaining('Cycle'),
      expect.any(Number),
      expect.any(Number)
    );
    
    // Should draw cycle connections
    expect(mockContext.beginPath).toHaveBeenCalled();
    expect(mockContext.moveTo).toHaveBeenCalled();
    expect(mockContext.lineTo).toHaveBeenCalled();
    expect(mockContext.stroke).toHaveBeenCalled();
  });
  
  /**
   * Test case: Renders comb sort visualization correctly
   * Validates visualization of varying gap comparisons
   */
  test('renders comb sort visualization correctly', () => {
    // Sample Comb Sort algorithm state
    const combSortData = {
      type: 'comb',
      original: [5, 2, 4, 1, 3],
      array: [2, 1, 3, 5, 4], // Current state
      gap: 2, // Current gap value
      initialGap: 5, // Initial gap value
      shrinkFactor: 1.3, // Gap shrink factor
      swapped: false, // Whether any swaps occurred in the current pass
      comparingIndices: [0, 2], // Indices being compared (gap apart)
      comparingValues: [2, 3], // Values being compared
      step: 'compare', // Current step: comparing elements
      message: 'Comparing elements at indices 0 and 2 with gap 2'
    };
    
    render(<TransformVisualizer 
      transformData={combSortData}
    />);
    
    // Canvas should be cleared
    expect(mockContext.clearRect).toHaveBeenCalled();
    
    // Should display algorithm information
    expect(mockContext.fillText).toHaveBeenCalledWith(
      'Comb Sort: Comparing elements at indices 0 and 2 with gap 2',
      expect.any(Number),
      expect.any(Number)
    );
    
    // Should render array elements
    for (let i = 0; i < combSortData.array.length; i++) {
      expect(mockContext.fillText).toHaveBeenCalledWith(
        combSortData.array[i].toString(),
        expect.any(Number),
        expect.any(Number)
      );
    }
    
    // Should highlight elements being compared
    expect(mockContext.fillRect).toHaveBeenCalledTimes(combSortData.comparingIndices.length);
    
    // Should draw gap connection
    expect(mockContext.beginPath).toHaveBeenCalled();
    expect(mockContext.moveTo).toHaveBeenCalled();
    expect(mockContext.lineTo).toHaveBeenCalled();
    expect(mockContext.stroke).toHaveBeenCalled();
    
    // Should display gap information
    expect(mockContext.fillText).toHaveBeenCalledWith(
      expect.stringContaining('Gap: 2'),
      expect.any(Number),
      expect.any(Number)
    );
  });
  
  /**
   * Test case: Renders gnome sort visualization correctly
   * Validates visualization of the "looking back" behavior
   */
  test('renders gnome sort visualization correctly', () => {
    // Sample Gnome Sort algorithm state
    const gnomeSortData = {
      type: 'gnome',
      original: [5, 2, 4, 1, 3],
      array: [2, 4, 5, 1, 3], // Current state
      position: 3, // Current position
      lookingBack: true, // Whether currently looking backward
      comparingIndices: [2, 3], // Indices being compared
      comparingValues: [5, 1], // Values being compared
      step: 'compare', // Current step: comparing elements
      message: 'Comparing elements 5 and 1'
    };
    
    render(<TransformVisualizer 
      transformData={gnomeSortData}
    />);
    
    // Canvas should be cleared
    expect(mockContext.clearRect).toHaveBeenCalled();
    
    // Should display algorithm information
    expect(mockContext.fillText).toHaveBeenCalledWith(
      'Gnome Sort: Comparing elements 5 and 1',
      expect.any(Number),
      expect.any(Number)
    );
    
    // Should render array elements
    for (let i = 0; i < gnomeSortData.array.length; i++) {
      expect(mockContext.fillText).toHaveBeenCalledWith(
        gnomeSortData.array[i].toString(),
        expect.any(Number),
        expect.any(Number)
      );
    }
    
    // Should highlight elements being compared
    expect(mockContext.fillRect).toHaveBeenCalledTimes(gnomeSortData.comparingIndices.length);
    
    // Should indicate movement direction (looking back)
    expect(mockContext.beginPath).toHaveBeenCalled();
    expect(mockContext.moveTo).toHaveBeenCalled();
    expect(mockContext.lineTo).toHaveBeenCalled();
    expect(mockContext.stroke).toHaveBeenCalled();
  });
  
  /**
   * Test case: Renders odd-even sort visualization correctly
   * Validates visualization of the parallel comparison passes
   */
  test('renders odd-even sort visualization correctly', () => {
    // Sample Odd-Even Sort algorithm state
    const oddEvenSortData = {
      type: 'odd-even',
      original: [5, 2, 4, 1, 3],
      array: [2, 5, 1, 4, 3], // Current state
      phase: 'odd', // Current phase: odd or even
      phaseNumber: 2, // Current phase number (for tracking progress)
      comparingPairs: [ // Pairs being compared in current phase
        { indices: [1, 2], values: [5, 1] },
        { indices: [3, 4], values: [4, 3] }
      ],
      sorted: false, // Whether the array is sorted
      step: 'compare', // Current step: comparing elements
      message: 'Comparing elements at odd indices with their right neighbors'
    };
    
    render(<TransformVisualizer 
      transformData={oddEvenSortData}
    />);
    
    // Canvas should be cleared
    expect(mockContext.clearRect).toHaveBeenCalled();
    
    // Should display algorithm information
    expect(mockContext.fillText).toHaveBeenCalledWith(
      'Odd-Even Sort: Comparing elements at odd indices with their right neighbors',
      expect.any(Number),
      expect.any(Number)
    );
    
    // Should render array elements
    for (let i = 0; i < oddEvenSortData.array.length; i++) {
      expect(mockContext.fillText).toHaveBeenCalledWith(
        oddEvenSortData.array[i].toString(),
        expect.any(Number),
        expect.any(Number)
      );
    }
    
    // Should highlight pairs being compared
    let expectedHighlightCount = 0;
    for (const pair of oddEvenSortData.comparingPairs) {
      expectedHighlightCount += pair.indices.length;
    }
    expect(mockContext.fillRect).toHaveBeenCalledTimes(expectedHighlightCount);
    
    // Should draw connection lines between pairs
    expect(mockContext.beginPath).toHaveBeenCalled();
    expect(mockContext.moveTo).toHaveBeenCalled();
    expect(mockContext.lineTo).toHaveBeenCalled();
    expect(mockContext.stroke).toHaveBeenCalled();
    
    // Should display phase information
    expect(mockContext.fillText).toHaveBeenCalledWith(
      expect.stringContaining('Phase: Odd'),
      expect.any(Number),
      expect.any(Number)
    );
  });
  
  /**
   * Test case: Updates visualization when transform data changes
   * Validates reactivity to prop changes
   */
  test('updates visualization when transform data changes', () => {
    // Initial state
    const initialState = {
      type: 'pancake',
      original: [5, 2, 4, 1, 3],
      array: [5, 2, 4, 1, 3],
      maxIndex: -1,
      step: 'init',
      message: 'Initializing pancake sort'
    };
    
    const { rerender } = render(
      <TransformVisualizer transformData={initialState} />
    );
    
    // Reset mock calls to isolate the next render
    mockContext.clearRect.mockClear();
    mockContext.fillRect.mockClear();
    mockContext.fillText.mockClear();
    
    // Updated state after finding maximum
    const updatedState = {
      type: 'pancake',
      original: [5, 2, 4, 1, 3],
      array: [5, 2, 4, 1, 3],
      maxIndex: 0,
      maxValue: 5,
      step: 'findMax',
      message: 'Found maximum element 5 at index 0'
    };
    
    rerender(<TransformVisualizer transformData={updatedState} />);
    
    // Canvas should be cleared for the new render
    expect(mockContext.clearRect).toHaveBeenCalled();
    
    // Should display updated algorithm step
    expect(mockContext.fillText).toHaveBeenCalledWith(
      'Pancake Sort: Found maximum element 5 at index 0',
      expect.any(Number),
      expect.any(Number)
    );
    
    // Should highlight the maximum element
    expect(mockContext.fillRect).toHaveBeenCalled();
  });
  
  /**
   * Test case: Renders bogo sort visualization correctly
   * Validates visualization of the random permutation generation
   */
  test('renders bogo sort visualization correctly', () => {
    // Sample Bogo Sort algorithm state
    const bogoSortData = {
      type: 'bogo',
      original: [3, 1, 4, 2],
      array: [2, 3, 1, 4], // Current random permutation
      isSorted: false, // Whether the current permutation is sorted
      attemptCount: 5, // Number of permutations tried
      step: 'shuffle', // Current step: shuffling the array
      message: 'Generating random permutation (attempt 5)'
    };
    
    render(<TransformVisualizer 
      transformData={bogoSortData}
    />);
    
    // Canvas should be cleared
    expect(mockContext.clearRect).toHaveBeenCalled();
    
    // Should display algorithm information
    expect(mockContext.fillText).toHaveBeenCalledWith(
      'Bogo Sort: Generating random permutation (attempt 5)',
      expect.any(Number),
      expect.any(Number)
    );
    
    // Should render array elements
    for (let i = 0; i < bogoSortData.array.length; i++) {
      expect(mockContext.fillText).toHaveBeenCalledWith(
        bogoSortData.array[i].toString(),
        expect.any(Number),
        expect.any(Number)
      );
    }
    
    // Should display attempt count information
    expect(mockContext.fillText).toHaveBeenCalledWith(
      expect.stringContaining('Attempt: 5'),
      expect.any(Number),
      expect.any(Number)
    );
  });
  
  /**
   * Test case: Handles empty transform data gracefully
   * Validates error handling for edge cases
   */
  test('handles empty transform data gracefully', () => {
    // Empty but valid data structure
    const emptyData = {
      type: 'pancake',
      original: [],
      array: [],
      step: 'error',
      message: 'Cannot sort empty array'
    };
    
    render(<TransformVisualizer transformData={emptyData} />);
    
    // Canvas should be cleared
    expect(mockContext.clearRect).toHaveBeenCalled();
    
    // Should display error message
    expect(mockContext.fillText).toHaveBeenCalledWith(
      'Pancake Sort: Cannot sort empty array',
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
    const pancakeSortData = {
      type: 'pancake',
      original: [5, 2, 4, 1, 3],
      array: [5, 2, 4, 1, 3],
      maxIndex: 0,
      step: 'findMax',
      message: 'Found maximum element'
    };
    
    render(
      <TransformVisualizer 
        transformData={pancakeSortData}
        elementColor="#3F51B5"
        activeColor="#F44336"
        textColor="#212121"
        backgroundColor="#F5F5F5"
        connectionColor="#4CAF50"
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
   * Test case: Handles malformed transform data gracefully
   * Validates error handling for invalid input
   */
  test('handles malformed transform data gracefully', () => {
    // Malformed data with missing required properties
    const malformedData = {
      type: 'pancake',
      // Missing array, step, etc.
      message: 'Incomplete data'
    };
    
    // Should not throw errors when rendering with malformed data
    expect(() => {
      render(<TransformVisualizer transformData={malformedData} />);
    }).not.toThrow();
    
    // Canvas should be cleared
    expect(mockContext.clearRect).toHaveBeenCalled();
    
    // Should attempt to render available information
    expect(mockContext.fillText).toHaveBeenCalledWith(
      'Pancake Sort: Incomplete data',
      expect.any(Number),
      expect.any(Number)
    );
  });
  
  /**
   * Test case: Renders step-by-step explanation correctly
   * Validates the educational explanation component
   */
  test('renders step-by-step explanation correctly', () => {
    const cycleSortData = {
      type: 'cycle',
      original: [5, 2, 4, 1, 3],
      array: [2, 5, 1, 4, 3],
      activeIndex: 0,
      step: 'findPosition',
      message: 'Finding correct position',
      explanation: [
        'Cycle Sort works by finding the correct position for each element',
        'For element 5, we count how many elements are smaller (4)',
        'Therefore, element 5 belongs at index 4 (0-based)'
      ]
    };
    
    render(
      <TransformVisualizer 
        transformData={cycleSortData}
        showExplanations={true}
      />
    );
    
    // Should render explanation text
    for (const line of cycleSortData.explanation) {
      expect(mockContext.fillText).toHaveBeenCalledWith(
        line,
        expect.any(Number),
        expect.any(Number)
      );
    }
  });
});
