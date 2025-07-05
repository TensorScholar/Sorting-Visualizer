/**
 * HeapVisualizer Component
 * 
 * A specialized visualization component that renders the implicit binary tree structure
 * of a heap data structure through geometric canvas rendering. This component provides
 * deep educational insights into heap operations by visualizing parent-child relationships
 * and value distributions.
 * 
 * Implementation follows the Canvas API rendering paradigm with O(n) rendering complexity
 * and leverages geometric spacing algorithms for optimal tree layout visualization.
 * 
 * @module visualization/components/HeapVisualizer
 * @requires React
 * @author Advanced Algorithm Visualization Platform
 */

import React, { useRef, useEffect } from 'react';

/**
 * Renders a binary heap structure visualization
 * 
 * @param {Object} props - Component properties
 * @param {Object} props.heapStructure - Heap structure data with nodes and edges
 * @param {number} [props.width=600] - Canvas width in pixels
 * @param {number} [props.height=400] - Canvas height in pixels 
 * @param {number} [props.nodeRadius=25] - Radius of tree nodes in pixels
 * @param {string} [props.highlightColor='#FF5722'] - Color for highlighted nodes
 * @param {string} [props.nodeColor='#3F51B5'] - Color for regular nodes
 * @param {string} [props.leafColor='#4CAF50'] - Color for leaf nodes
 * @param {string} [props.textColor='#FFFFFF'] - Color for node text
 */
const HeapVisualizer = ({ 
  heapStructure, 
  width = 600, 
  height = 400, 
  nodeRadius = 25,
  highlightColor = '#FF5722',
  nodeColor = '#3F51B5',
  leafColor = '#4CAF50',
  textColor = '#FFFFFF'
}) => {
  // Reference to the canvas element for imperative rendering
  const canvasRef = useRef(null);
  
  /**
   * Canvas rendering effect to visualize the heap structure
   */
  useEffect(() => {
    if (!heapStructure || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Clear canvas with high-performance clearing method
    ctx.clearRect(0, 0, width, height);
    
    // Calculate max depth of the heap for level positioning
    const maxLevel = Math.max(...heapStructure.nodes.map(node => node.level), 0);
    
    // Calculate layout parameters with mathematical precision
    const levelHeight = height / (maxLevel + 2);  // Vertical distance between levels
    const xPadding = 20;                         // Horizontal padding
    const availableWidth = width - 2 * xPadding; // Available width for nodes
    
    // Draw edges first (so they're behind nodes)
    ctx.strokeStyle = '#888888';
    ctx.lineWidth = 2;
    
    heapStructure.edges.forEach(edge => {
      const fromNode = heapStructure.nodes.find(n => n.id === edge.from);
      const toNode = heapStructure.nodes.find(n => n.id === edge.to);
      
      if (!fromNode || !toNode) return;
      
      // Calculate node positions using mathematical formula for complete binary tree
      const fromX = xPadding + (fromNode.id + 1) * availableWidth / Math.pow(2, fromNode.level + 1);
      const fromY = (fromNode.level + 1) * levelHeight;
      
      const toX = xPadding + (toNode.id + 1) * availableWidth / Math.pow(2, toNode.level + 1);
      const toY = (toNode.level + 1) * levelHeight;
      
      // Draw edge with anti-aliasing
      ctx.beginPath();
      ctx.moveTo(fromX, fromY);
      ctx.lineTo(toX, toY);
      ctx.stroke();
      
      // Draw small label for edge type (left/right)
      const midX = (fromX + toX) / 2;
      const midY = (fromY + toY) / 2;
      
      ctx.fillStyle = '#888888';
      ctx.font = '10px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(edge.type, midX, midY - 8);
    });
    
    // Draw nodes with proper styling
    heapStructure.nodes.forEach(node => {
      // Calculate node position based on level and position in level
      const x = xPadding + (node.id + 1) * availableWidth / Math.pow(2, node.level + 1);
      const y = (node.level + 1) * levelHeight;
      
      // Determine node color based on state and type
      let fillColor = node.isLeaf ? leafColor : nodeColor;
      
      // Highlight the focused node if specified
      if (heapStructure.highlight !== undefined && node.id === heapStructure.highlight) {
        fillColor = highlightColor;
      }
      
      // Draw node circle with high-quality anti-aliasing
      ctx.beginPath();
      ctx.arc(x, y, nodeRadius, 0, 2 * Math.PI);
      ctx.fillStyle = fillColor;
      ctx.fill();
      
      // Draw node outline for definition
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Draw node value with appropriate text styling
      ctx.fillStyle = textColor;
      
      // Scale font size based on content length for readability
      const valueText = node.value.toString();
      const fontSize = valueText.length > 2 ? 14 : 16;
      
      ctx.font = `bold ${fontSize}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(valueText, x, y);
      
      // Draw node index below for educational context
      ctx.fillStyle = '#000000';
      ctx.font = '12px Arial';
      ctx.fillText(`idx: ${node.id}`, x, y + nodeRadius + 15);
    });
    
    // Draw heap property information
    ctx.fillStyle = '#333333';
    ctx.font = '14px Arial';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('Binary Max Heap: parent ≥ children', 10, 10);
    
    // Draw legend at bottom
    const legendY = height - 40;
    
    // Regular node
    ctx.beginPath();
    ctx.arc(30, legendY, 10, 0, 2 * Math.PI);
    ctx.fillStyle = nodeColor;
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#333333';
    ctx.textAlign = 'left';
    ctx.fillText('Internal Node', 50, legendY - 5);
    
    // Leaf node
    ctx.beginPath();
    ctx.arc(150, legendY, 10, 0, 2 * Math.PI);
    ctx.fillStyle = leafColor;
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#333333';
    ctx.fillText('Leaf Node', 170, legendY - 5);
    
    // Highlighted node
    ctx.beginPath();
    ctx.arc(270, legendY, 10, 0, 2 * Math.PI);
    ctx.fillStyle = highlightColor;
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#333333';
    ctx.fillText('Current Node', 290, legendY - 5);
    
  }, [heapStructure, width, height, nodeRadius, highlightColor, nodeColor, leafColor, textColor]);
  
  return (
    <div className="heap-visualizer">
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="heap-canvas"
        style={{ 
          border: '1px solid #ddd', 
          borderRadius: '4px',
          display: 'block'
        }}
      />
      {!heapStructure && (
        <div className="heap-placeholder" style={{ 
          position: 'absolute', 
          top: '50%', 
          left: '50%', 
          transform: 'translate(-50%, -50%)',
          color: '#888',
          fontSize: '16px'
        }}>
          Awaiting heap structure data...
        </div>
      )}
    </div>
  );
};

export default HeapVisualizer;
