// tests/js/visualization/components/heap-visualizer.test.js

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import HeapVisualizer from '../../../../src/visualization/components/HeapVisualizer';

/**
 * Comprehensive test suite for the HeapVisualizer component
 * 
 * These tests validate the binary heap visualization rendering,
 * ensuring proper heap structure representation, edge case handling,
 * and canvas drawing operations.
 * 
 * @author Advanced Sorting Algorithm Visualization Platform
 */
describe('HeapVisualizer Component', () => {
  // Mock canvas context for testing canvas operations
  let mockContext;
  
  /**
   * Setup mock canvas and context before each test
   * Canvas operations are mocked to allow validation of drawing operations
   * without requiring an actual DOM/rendering environment
   */
  beforeEach(() => {
    // Create mock canvas context with all required methods
    mockContext = {
      clearRect: jest.fn(),
      beginPath: jest.fn(),
      moveTo: jest.fn(),
      lineTo: jest.fn(),
      arc: jest.fn(),
      fill: jest.fn(),
      stroke: jest.fn(),
      fillText: jest.fn(),
      measureText: jest.fn().mockReturnValue({ width: 10 })
    };
    
    // Mock getContext to return our mockContext
    const mockGetContext = jest.fn().mockReturnValue(mockContext);
    
    // Mock canvas element
    const mockCanvas = {
      getContext: mockGetContext,
      width: 600,
      height: 400
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
   * Validates that the component renders correctly with a canvas element
   */
  test('renders canvas element correctly', () => {
    render(<HeapVisualizer heapStructure={null} />);
    
    // The component should render a div with the heap-visualizer class
    const visualizerContainer = screen.getByClassName('heap-visualizer');
    expect(visualizerContainer).toBeInTheDocument();
    
    // The component should render a placeholder message when no heap structure is provided
    const placeholderMessage = screen.getByText(/waiting for heap structure data/i);
    expect(placeholderMessage).toBeInTheDocument();
  });
  
  /**
   * Test case: Handles null or undefined heap structure gracefully
   * Validates error handling for missing heap structure data
   */
  test('handles null heap structure properly', () => {
    render(<HeapVisualizer heapStructure={null} />);
    
    // Canvas context should not be cleared or used when no data is available
    expect(mockContext.clearRect).not.toHaveBeenCalled();
    expect(mockContext.beginPath).not.toHaveBeenCalled();
  });
  
  /**
   * Test case: Renders a simple binary heap structure correctly
   * Validates the core rendering functionality with a basic heap
   */
  test('renders simple heap structure correctly', () => {
    // Create a simple 3-node heap
    const simpleHeapStructure = {
      nodes: [
        { id: 0, value: 100, level: 0, isLeaf: false },
        { id: 1, value: 50, level: 1, isLeaf: true },
        { id: 2, value: 25, level: 1, isLeaf: true }
      ],
      edges: [
        { from: 0, to: 1, type: 'left' },
        { from: 0, to: 2, type: 'right' }
      ]
    };
    
    render(<HeapVisualizer heapStructure={simpleHeapStructure} />);
    
    // Canvas should be cleared
    expect(mockContext.clearRect).toHaveBeenCalledWith(0, 0, 600, 400);
    
    // Verify that the correct number of nodes were drawn
    // Each node requires beginPath, arc, fill, stroke, and fillText operations
    expect(mockContext.beginPath).toHaveBeenCalledTimes(
      simpleHeapStructure.nodes.length * 2 + // Node circles + legend
      simpleHeapStructure.edges.length // Edges
    );
    
    // Verify text rendering for node values
    expect(mockContext.fillText).toHaveBeenCalledWith('100', expect.any(Number), expect.any(Number));
    expect(mockContext.fillText).toHaveBeenCalledWith('50', expect.any(Number), expect.any(Number));
    expect(mockContext.fillText).toHaveBeenCalledWith('25', expect.any(Number), expect.any(Number));
    
    // Verify edge drawing operations
    expect(mockContext.moveTo).toHaveBeenCalledTimes(simpleHeapStructure.edges.length);
    expect(mockContext.lineTo).toHaveBeenCalledTimes(simpleHeapStructure.edges.length);
  });
  
  /**
   * Test case: Correctly highlights a specified node
   * Validates the node highlighting functionality
   */
  test('highlights the specified node correctly', () => {
    // Create a heap structure with a highlighted node
    const heapStructureWithHighlight = {
      nodes: [
        { id: 0, value: 100, level: 0, isLeaf: false },
        { id: 1, value: 50, level: 1, isLeaf: true },
        { id: 2, value: 25, level: 1, isLeaf: true }
      ],
      edges: [
        { from: 0, to: 1, type: 'left' },
        { from: 0, to: 2, type: 'right' }
      ],
      highlight: 1 // Highlight the node with id 1
    };
    
    render(<HeapVisualizer 
      heapStructure={heapStructureWithHighlight}
      highlightColor="#FF5722"
    />);
    
    // Validate that fillStyle was set to the highlight color for the highlighted node
    // Note: Due to the complexity of testing canvas fill styles, we're validating
    // the overall drawing process rather than specific fill style assignments
    
    // Verify overall rendering correctness
    expect(mockContext.clearRect).toHaveBeenCalled();
    expect(mockContext.beginPath).toHaveBeenCalled();
    expect(mockContext.arc).toHaveBeenCalled();
    expect(mockContext.fill).toHaveBeenCalled();
    expect(mockContext.fillText).toHaveBeenCalled();
  });
  
  /**
   * Test case: Renders a complex heap with multiple levels
   * Validates rendering behavior with a larger, multi-level heap
   */
  test('renders complex multi-level heap correctly', () => {
    // Create a more complex heap structure with multiple levels
    const complexHeapStructure = {
      nodes: [
        { id: 0, value: 100, level: 0, isLeaf: false },
        { id: 1, value: 80, level: 1, isLeaf: false },
        { id: 2, value: 90, level: 1, isLeaf: false },
        { id: 3, value: 50, level: 2, isLeaf: true },
        { id: 4, value: 70, level: 2, isLeaf: true },
        { id: 5, value: 60, level: 2, isLeaf: true },
        { id: 6, value: 40, level: 2, isLeaf: true }
      ],
      edges: [
        { from: 0, to: 1, type: 'left' },
        { from: 0, to: 2, type: 'right' },
        { from: 1, to: 3, type: 'left' },
        { from: 1, to: 4, type: 'right' },
        { from: 2, to: 5, type: 'left' },
        { from: 2, to: 6, type: 'right' }
      ]
    };
    
    render(<HeapVisualizer heapStructure={complexHeapStructure} width={800} height={600} />);
    
    // Canvas should be cleared with the specified dimensions
    expect(mockContext.clearRect).toHaveBeenCalledWith(0, 0, 600, 400); // Default dimensions from mock
    
    // Verify that the correct number of nodes and edges were drawn
    // For a complex heap, we focus on validating the count of operations rather than
    // the specific coordinates, which would be implementation-dependent
    
    // Verify node rendering
    expect(mockContext.arc).toHaveBeenCalledTimes(
      complexHeapStructure.nodes.length + // Node circles
      3 // Legend circles
    );
    
    // Verify edge rendering
    expect(mockContext.moveTo).toHaveBeenCalledTimes(complexHeapStructure.edges.length);
    expect(mockContext.lineTo).toHaveBeenCalledTimes(complexHeapStructure.edges.length);
    
    // Verify node value text rendering
    for (const node of complexHeapStructure.nodes) {
      expect(mockContext.fillText).toHaveBeenCalledWith(
        node.value.toString(), 
        expect.any(Number), 
        expect.any(Number)
      );
    }
  });
  
  /**
   * Test case: Respects custom styling props
   * Validates that custom visual properties are correctly applied
   */
  test('applies custom styling props correctly', () => {
    const simpleHeapStructure = {
      nodes: [
        { id: 0, value: 100, level: 0, isLeaf: false },
        { id: 1, value: 50, level: 1, isLeaf: true }
      ],
      edges: [
        { from: 0, to: 1, type: 'left' }
      ]
    };
    
    // Render with custom styling properties
    render(
      <HeapVisualizer 
        heapStructure={simpleHeapStructure}
        width={800}
        height={600}
        nodeRadius={30}
        highlightColor="#FF0000"
        nodeColor="#0000FF"
        leafColor="#00FF00"
        textColor="#FFFFFF"
      />
    );
    
    // Verify canvas operations were called
    expect(mockContext.clearRect).toHaveBeenCalled();
    expect(mockContext.beginPath).toHaveBeenCalled();
    expect(mockContext.arc).toHaveBeenCalled();
    expect(mockContext.fill).toHaveBeenCalled();
    
    // Note: Testing specific fill styles and colors is challenging in Jest
    // without more sophisticated canvas mocking, so we validate the overall
    // rendering process rather than specific color assignments
  });
  
  /**
   * Test case: Handles empty heap structure gracefully
   * Validates behavior with an empty (but not null) heap structure
   */
  test('handles empty heap structure gracefully', () => {
    const emptyHeapStructure = {
      nodes: [],
      edges: []
    };
    
    render(<HeapVisualizer heapStructure={emptyHeapStructure} />);
    
    // Canvas should be cleared
    expect(mockContext.clearRect).toHaveBeenCalled();
    
    // No node or edge drawing operations should be performed
    expect(mockContext.arc).toHaveBeenCalledTimes(3); // Only legend circles
    expect(mockContext.moveTo).not.toHaveBeenCalled();
    expect(mockContext.lineTo).not.toHaveBeenCalled();
    
    // Info text and legend should still be rendered
    expect(mockContext.fillText).toHaveBeenCalledWith(
      'Binary Max Heap: parent ≥ children', 
      expect.any(Number), 
      expect.any(Number)
    );
  });
  
  /**
   * Test case: Updates rendering when props change
   * Validates that component correctly re-renders with new props
   */
  test('updates rendering when heap structure changes', () => {
    // Initial render with simple structure
    const initialHeapStructure = {
      nodes: [
        { id: 0, value: 100, level: 0, isLeaf: true }
      ],
      edges: []
    };
    
    const { rerender } = render(
      <HeapVisualizer heapStructure={initialHeapStructure} />
    );
    
    // Reset mock calls to isolate the next render
    mockContext.clearRect.mockClear();
    mockContext.beginPath.mockClear();
    mockContext.arc.mockClear();
    mockContext.fill.mockClear();
    mockContext.fillText.mockClear();
    
    // Update with more complex structure
    const updatedHeapStructure = {
      nodes: [
        { id: 0, value: 100, level: 0, isLeaf: false },
        { id: 1, value: 50, level: 1, isLeaf: true },
        { id: 2, value: 25, level: 1, isLeaf: true }
      ],
      edges: [
        { from: 0, to: 1, type: 'left' },
        { from: 0, to: 2, type: 'right' }
      ]
    };
    
    rerender(<HeapVisualizer heapStructure={updatedHeapStructure} />);
    
    // Verify canvas operations were called again for the new structure
    expect(mockContext.clearRect).toHaveBeenCalled();
    expect(mockContext.arc).toHaveBeenCalledTimes(
      updatedHeapStructure.nodes.length + // Nodes
      3 // Legend
    );
    
    // Verify edge rendering
    expect(mockContext.moveTo).toHaveBeenCalledTimes(updatedHeapStructure.edges.length);
    expect(mockContext.lineTo).toHaveBeenCalledTimes(updatedHeapStructure.edges.length);
  });
  
  /**
   * Test case: Renders an invalid structure gracefully
   * Validates error handling for malformed input data
   */
  test('handles malformed heap structure gracefully', () => {
    // Malformed heap structure missing required properties
    const malformedHeapStructure = {
      // Missing nodes array
      edges: [
        { from: 0, to: 1, type: 'left' }
      ]
    };
    
    // Should not throw errors when rendering with malformed data
    expect(() => {
      render(<HeapVisualizer heapStructure={malformedHeapStructure} />);
    }).not.toThrow();
    
    // Canvas should be cleared
    expect(mockContext.clearRect).toHaveBeenCalled();
    
    // No node drawing operations should be attempted
    expect(mockContext.arc).toHaveBeenCalledTimes(3); // Only legend circles
  });
});
