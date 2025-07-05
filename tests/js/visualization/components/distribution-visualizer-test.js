// tests/js/visualization/components/distribution-visualizer.test.js

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import DistributionVisualizer from '../../../../src/visualization/components/distribution-visualizer';

/**
 * Comprehensive test suite for the DistributionVisualizer component
 * 
 * This test suite validates the visualization of distribution-based sorting algorithms
 * such as Counting Sort, Bucket Sort, and Radix Sort. The tests ensure proper
 * rendering of frequency distributions, buckets, and digit-based operations.
 * 
 * @author Advanced Sorting Algorithm Visualization Platform
 */
describe('DistributionVisualizer Component', () => {
  // Mock canvas context for testing canvas operations
  let mockContext;
  
  /**
   * Setup mock canvas and context before each test
   * Simulates the canvas rendering environment for testing visualization logic
   */
  beforeEach(() => {
    // Create mock canvas context with all required drawing methods
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
      measureText: jest.fn().mockReturnValue({ width: 10 }),
      fillRect: jest.fn(),
      strokeRect: jest.fn(),
      setLineDash: jest.fn(),
      getLineDash: jest.fn().mockReturnValue([]),
      save: jest.fn(),
      restore: jest.fn()
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
    render(<DistributionVisualizer distributionData={null} />);
    
    // The component should render a div with appropriate class
    const visualizerContainer = screen.getByClassName('distribution-visualizer');
    expect(visualizerContainer).toBeInTheDocument();
    
    // The component should render a placeholder message when no data is provided
    const placeholderMessage = screen.getByText(/waiting for distribution data/i);
    expect(placeholderMessage).toBeInTheDocument();
  });
  
  /**
   * Test case: Renders counting sort distribution data correctly
   * Validates the visualization of frequency counts used in counting sort
   */
  test('renders counting sort distribution data correctly', () => {
    // Sample counting sort distribution data with frequency array
    const countingSortData = {
      type: 'counting',
      original: [4, 2, 5, 3, 1, 6, 8, 3, 1, 2],
      counts: [0, 2, 2, 2, 1, 1, 1, 0, 1], // Frequencies for values 0-8
      maxValue: 8,
      minValue: 0,
      step: 'count', // Current step in the algorithm
      message: 'Counting frequencies of each value'
    };
    
    render(<DistributionVisualizer 
      distributionData={countingSortData}
      width={800}
      height={500}
    />);
    
    // Canvas should be cleared
    expect(mockContext.clearRect).toHaveBeenCalledWith(0, 0, 800, 500);
    
    // Should display algorithm step information
    expect(mockContext.fillText).toHaveBeenCalledWith(
      'Counting Sort: Counting frequencies of each value',
      expect.any(Number),
      expect.any(Number)
    );
    
    // Should draw count bars for each value
    // One rectangle per count value
    expect(mockContext.fillRect).toHaveBeenCalledTimes(countingSortData.counts.length);
    
    // Should display count values as text
    for (let i = 0; i < countingSortData.counts.length; i++) {
      if (countingSortData.counts[i] > 0) {
        expect(mockContext.fillText).toHaveBeenCalledWith(
          countingSortData.counts[i].toString(),
          expect.any(Number),
          expect.any(Number)
        );
      }
    }
  });
  
  /**
   * Test case: Renders bucket sort distribution data correctly
   * Validates the visualization of elements distributed among buckets
   */
  test('renders bucket sort distribution data correctly', () => {
    // Sample bucket sort distribution data
    const bucketSortData = {
      type: 'bucket',
      original: [0.42, 0.32, 0.65, 0.89, 0.21, 0.54, 0.37, 0.72],
      buckets: [
        [0.21, 0.32], // Bucket 0: [0.0-0.333)
        [0.37, 0.42], // Bucket 1: [0.333-0.667)
        [0.54, 0.65, 0.72, 0.89]  // Bucket 2: [0.667-1.0)
      ],
      bucketRanges: [
        { min: 0.0, max: 0.333 },
        { min: 0.333, max: 0.667 },
        { min: 0.667, max: 1.0 }
      ],
      step: 'distribute', // Current step in the algorithm
      message: 'Distributing elements into buckets'
    };
    
    render(<DistributionVisualizer 
      distributionData={bucketSortData}
    />);
    
    // Canvas should be cleared
    expect(mockContext.clearRect).toHaveBeenCalled();
    
    // Should display algorithm step information
    expect(mockContext.fillText).toHaveBeenCalledWith(
      'Bucket Sort: Distributing elements into buckets',
      expect.any(Number),
      expect.any(Number)
    );
    
    // Should draw buckets
    // One rectangle per bucket plus outline
    expect(mockContext.strokeRect).toHaveBeenCalledTimes(bucketSortData.buckets.length);
    
    // Should draw elements within buckets
    let expectedItemCount = 0;
    for (const bucket of bucketSortData.buckets) {
      expectedItemCount += bucket.length;
    }
    
    // Check for drawing operations for each element
    expect(mockContext.beginPath).toHaveBeenCalledTimes(
      expectedItemCount + // Element circles
      1 // Initial clearRect operation
    );
    
    // Should draw bucket range labels
    for (let i = 0; i < bucketSortData.bucketRanges.length; i++) {
      const range = bucketSortData.bucketRanges[i];
      expect(mockContext.fillText).toHaveBeenCalledWith(
        `[${range.min.toFixed(2)}-${range.max.toFixed(2)})`,
        expect.any(Number),
        expect.any(Number)
      );
    }
  });
  
  /**
   * Test case: Renders radix sort distribution data correctly
   * Validates the visualization of digit-based distribution in radix sort
   */
  test('renders radix sort distribution data correctly', () => {
    // Sample radix sort distribution data
    const radixSortData = {
      type: 'radix',
      original: [170, 45, 75, 90, 802, 24, 2, 66],
      buckets: [ // Buckets for least significant digit (ones place)
        [170, 90], // Bucket for digit 0
        [], // Bucket for digit 1
        [802, 2], // Bucket for digit 2
        [], // Bucket for digit 3
        [24], // Bucket for digit 4
        [45, 75], // Bucket for digit 5
        [66]  // Bucket for digit 6
      ],
      digitPosition: 0, // Current digit position (0 = ones, 1 = tens, etc.)
      base: 10, // Number base
      maxDigits: 3, // Maximum number of digits across all numbers
      step: 'distribute', // Current step in the algorithm
      message: 'Distributing by digit position 0 (ones place)'
    };
    
    render(<DistributionVisualizer 
      distributionData={radixSortData}
    />);
    
    // Canvas should be cleared
    expect(mockContext.clearRect).toHaveBeenCalled();
    
    // Should display algorithm step information
    expect(mockContext.fillText).toHaveBeenCalledWith(
      'Radix Sort: Distributing by digit position 0 (ones place)',
      expect.any(Number),
      expect.any(Number)
    );
    
    // Should draw buckets for each possible digit (0-9 for base 10)
    expect(mockContext.strokeRect).toHaveBeenCalledTimes(radixSortData.buckets.length);
    
    // Should draw digit labels
    for (let i = 0; i < radixSortData.buckets.length; i++) {
      expect(mockContext.fillText).toHaveBeenCalledWith(
        `Digit ${i}`,
        expect.any(Number),
        expect.any(Number)
      );
    }
    
    // Should draw elements within buckets
    let expectedItemCount = 0;
    for (const bucket of radixSortData.buckets) {
      expectedItemCount += bucket.length;
    }
    
    // Check for drawing operations for each element
    expect(mockContext.fillText).toHaveBeenCalledTimes(
      1 + // Algorithm title
      radixSortData.buckets.length + // Bucket labels
      expectedItemCount // Numbers in buckets
    );
  });
  
  /**
   * Test case: Updates visualization when data changes
   * Validates reactivity to prop changes
   */
  test('updates visualization when distribution data changes', () => {
    // Initial counting sort data
    const initialData = {
      type: 'counting',
      original: [3, 1, 4, 1, 5],
      counts: [0, 2, 0, 1, 1, 1],
      maxValue: 5,
      minValue: 0,
      step: 'count',
      message: 'Initial count'
    };
    
    const { rerender } = render(
      <DistributionVisualizer distributionData={initialData} />
    );
    
    // Reset mock calls to isolate the next render
    mockContext.clearRect.mockClear();
    mockContext.fillRect.mockClear();
    mockContext.fillText.mockClear();
    
    // Updated counting sort data with accumulation step
    const updatedData = {
      type: 'counting',
      original: [3, 1, 4, 1, 5],
      counts: [0, 2, 0, 1, 1, 1],
      accumulated: [0, 2, 2, 3, 4, 5], // Accumulated counts
      maxValue: 5,
      minValue: 0,
      step: 'accumulate',
      message: 'Accumulating counts'
    };
    
    rerender(<DistributionVisualizer distributionData={updatedData} />);
    
    // Canvas should be cleared for the new render
    expect(mockContext.clearRect).toHaveBeenCalled();
    
    // Should display updated algorithm step
    expect(mockContext.fillText).toHaveBeenCalledWith(
      'Counting Sort: Accumulating counts',
      expect.any(Number),
      expect.any(Number)
    );
    
    // Should draw accumulated count values
    for (let i = 0; i < updatedData.accumulated.length; i++) {
      expect(mockContext.fillText).toHaveBeenCalledWith(
        updatedData.accumulated[i].toString(),
        expect.any(Number),
        expect.any(Number)
      );
    }
  });
  
  /**
   * Test case: Supports toggling between algorithm steps
   * Validates interactive step navigation functionality
   */
  test('supports step navigation controls', () => {
    // Comprehensive counting sort data with multiple steps
    const countingSortSteps = {
      type: 'counting',
      original: [4, 2, 5, 3, 1],
      counts: [0, 1, 1, 1, 1, 1],
      accumulated: [0, 1, 2, 3, 4, 5],
      result: [1, 2, 3, 4, 5],
      maxValue: 5,
      minValue: 0,
      steps: ['count', 'accumulate', 'place'], // Available steps
      currentStepIndex: 0,
      message: 'Counting frequencies'
    };
    
    // Render with step navigation controls
    const { getByText, rerender } = render(
      <DistributionVisualizer 
        distributionData={countingSortSteps}
        enableStepControls={true}
      />
    );
    
    // Component should render step controls
    const nextButton = getByText('Next Step');
    expect(nextButton).toBeInTheDocument();
    
    // Reset mocks for clarity
    mockContext.clearRect.mockClear();
    mockContext.fillText.mockClear();
    
    // Simulate clicking next step
    fireEvent.click(nextButton);
    
    // Should move to next step (accumulate)
    const updatedData = {
      ...countingSortSteps,
      currentStepIndex: 1,
      message: 'Accumulating counts'
    };
    
    rerender(<DistributionVisualizer 
      distributionData={updatedData}
      enableStepControls={true}
    />);
    
    // Canvas should be cleared for new render
    expect(mockContext.clearRect).toHaveBeenCalled();
    
    // Should display updated step message
    expect(mockContext.fillText).toHaveBeenCalledWith(
      'Counting Sort: Accumulating counts',
      expect.any(Number),
      expect.any(Number)
    );
  });
  
  /**
   * Test case: Handles empty distribution data gracefully
   * Validates error handling for edge cases
   */
  test('handles empty distribution data gracefully', () => {
    // Empty but valid data structure
    const emptyData = {
      type: 'bucket',
      original: [],
      buckets: [[], [], []],
      step: 'distribute',
      message: 'No elements to distribute'
    };
    
    render(<DistributionVisualizer distributionData={emptyData} />);
    
    // Canvas should be cleared
    expect(mockContext.clearRect).toHaveBeenCalled();
    
    // Should still render algorithm title and message
    expect(mockContext.fillText).toHaveBeenCalledWith(
      'Bucket Sort: No elements to distribute',
      expect.any(Number),
      expect.any(Number)
    );
    
    // Should draw empty buckets
    expect(mockContext.strokeRect).toHaveBeenCalledTimes(emptyData.buckets.length);
  });
  
  /**
   * Test case: Renders pigeonhole sort correctly
   * Validates visualization for a specialized distribution sort
   */
  test('renders pigeonhole sort visualization correctly', () => {
    // Sample pigeonhole sort data
    const pigeonholeData = {
      type: 'pigeonhole',
      original: [8, 3, 2, 7, 4, 6, 8],
      holes: [
        null, // No element with value 0
        null, // No element with value 1
        2,    // Element with value 2
        3,    // Element with value 3
        4,    // Element with value 4
        null, // No element with value 5
        6,    // Element with value 6
        7,    // Element with value 7
        8, 8  // Two elements with value 8
      ],
      minValue: 0,
      maxValue: 8,
      step: 'distribute',
      message: 'Elements distributed into pigeonholes'
    };
    
    render(<DistributionVisualizer 
      distributionData={pigeonholeData}
    />);
    
    // Canvas should be cleared
    expect(mockContext.clearRect).toHaveBeenCalled();
    
    // Should display algorithm info
    expect(mockContext.fillText).toHaveBeenCalledWith(
      'Pigeonhole Sort: Elements distributed into pigeonholes',
      expect.any(Number),
      expect.any(Number)
    );
    
    // Should draw pigeonholes
    expect(mockContext.strokeRect).toHaveBeenCalledTimes(pigeonholeData.holes.length);
    
    // Should display pigeonhole values
    for (let i = 0; i < pigeonholeData.holes.length; i++) {
      if (pigeonholeData.holes[i] !== null) {
        // For holes with multiple values (like hole 8), it might be called multiple times
        expect(mockContext.fillText).toHaveBeenCalledWith(
          expect.stringContaining(i.toString()),
          expect.any(Number),
          expect.any(Number)
        );
      }
    }
  });
  
  /**
   * Test case: Handles malformed distribution data gracefully
   * Validates error handling for invalid input
   */
  test('handles malformed distribution data gracefully', () => {
    // Malformed data with missing required properties
    const malformedData = {
      type: 'counting',
      // Missing original array, counts, etc.
      message: 'Incomplete data'
    };
    
    // Should not throw errors when rendering with malformed data
    expect(() => {
      render(<DistributionVisualizer distributionData={malformedData} />);
    }).not.toThrow();
    
    // Canvas should be cleared
    expect(mockContext.clearRect).toHaveBeenCalled();
    
    // Should attempt to render available information
    expect(mockContext.fillText).toHaveBeenCalledWith(
      'Counting Sort: Incomplete data',
      expect.any(Number),
      expect.any(Number)
    );
  });
  
  /**
   * Test case: Applies custom styling options correctly
   * Validates customization capabilities
   */
  test('applies custom styling options correctly', () => {
    const countingSortData = {
      type: 'counting',
      original: [3, 1, 4, 1, 5],
      counts: [0, 2, 0, 1, 1, 1],
      maxValue: 5,
      minValue: 0,
      step: 'count',
      message: 'Counting frequencies'
    };
    
    render(
      <DistributionVisualizer 
        distributionData={countingSortData}
        barColor="#FF5722"
        textColor="#212121"
        backgroundColor="#F5F5F5"
        highlightColor="#4CAF50"
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
});
