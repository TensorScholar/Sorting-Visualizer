#!/usr/bin/env python3
"""
Advanced Sorting Algorithm Visualization Platform - Python Bridge Server

This module implements a Flask-based API bridge that facilitates communication between
the JavaScript frontend and Python algorithm implementations. It provides endpoints for:

1. Algorithm execution with instrumentation
2. Performance metrics collection
3. Algorithm state serialization for visualization
4. Comparative algorithm analysis

The server enables educational exploration of algorithm behavior across language
implementations, supporting deep understanding of algorithmic patterns and performance
characteristics through visual and quantitative analysis.

Author: [Your Name]
License: MIT
"""

import os
import sys
import json
import time
import importlib
import traceback
from typing import Dict, Any, List, Tuple, Optional, Union

# Add parent directory to path to enable module imports
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(os.path.dirname(current_dir))
sys.path.append(parent_dir)

try:
    from flask import Flask, request, jsonify, Response
    from flask_cors import CORS
except ImportError:
    print("Required dependencies not found. Install with:")
    print("pip install flask flask-cors numpy")
    sys.exit(1)

# Import core modules and algorithm implementations
try:
    from python.core.base_algorithm import Algorithm
except ImportError:
    print("Algorithm base class not found. Ensure the project structure is correct.")
    sys.exit(1)

# Initialize Flask application with CORS support
app = Flask(__name__)
CORS(app)

# Configuration
DEBUG = True
PORT = 5000
HOST = '0.0.0.0' if not DEBUG else '127.0.0.1'

# Algorithm registry - maps algorithm keys to module paths
ALGORITHM_REGISTRY = {
    # Comparison sorts
    'bubble-sort': ('python.algorithms.comparison.bubble_sort', 'BubbleSort'),
    'merge-sort': ('python.algorithms.comparison.merge_sort', 'MergeSort'),
    'quick-sort': ('python.algorithms.comparison.quick_sort', 'QuickSort'),
    'heap-sort': ('python.algorithms.comparison.heap_sort', 'HeapSort'),
    'insertion-sort': ('python.algorithms.comparison.insertion_sort', 'InsertionSort'),
    'selection-sort': ('python.algorithms.comparison.selection_sort', 'SelectionSort'),
    'shell-sort': ('python.algorithms.comparison.shell_sort', 'ShellSort'),
    
    # Distribution sorts
    'counting-sort': ('python.algorithms.distribution.counting_sort', 'CountingSort'),
    'radix-sort': ('python.algorithms.distribution.radix_sort', 'RadixSort'),
    'bucket-sort': ('python.algorithms.distribution.bucket_sort', 'BucketSort'),
    
    # Special sorts
    'bogo-sort': ('python.algorithms.special.bogo_sort', 'BogoSort'),
    'pancake-sort': ('python.algorithms.special.pancake_sort', 'PancakeSort'),
    
    # Selection algorithms
    'quick-select': ('python.algorithms.selection.quick_select', 'QuickSelect')
}

# ------- Utility Functions -------

def import_algorithm(algorithm_key: str) -> Tuple[Any, Optional[str]]:
    """
    Dynamically import an algorithm class based on registry key.
    
    Args:
        algorithm_key: Identifier for the algorithm in the registry
        
    Returns:
        Tuple of (AlgorithmClass, error_message)
    """
    if algorithm_key not in ALGORITHM_REGISTRY:
        return None, f"Algorithm '{algorithm_key}' not found in registry"
    
    try:
        module_path, class_name = ALGORITHM_REGISTRY[algorithm_key]
        module = importlib.import_module(module_path)
        algorithm_class = getattr(module, class_name)
        return algorithm_class, None
    except (ImportError, AttributeError) as e:
        return None, f"Failed to import {algorithm_key}: {str(e)}"

def convert_options(options: Dict[str, Any]) -> Dict[str, Any]:
    """
    Convert JavaScript-style options to Python-style options.
    
    Args:
        options: JavaScript-style options dictionary
        
    Returns:
        Python-style options dictionary
    """
    python_options = {}
    
    # Convert camelCase to snake_case
    for key, value in options.items():
        snake_key = ''.join(['_' + c.lower() if c.isupper() else c for c in key]).lstrip('_')
        python_options[snake_key] = value
    
    return python_options

def serialize_algorithm_state(state: Dict[str, Any]) -> Dict[str, Any]:
    """
    Prepare algorithm state for JSON serialization.
    
    Args:
        state: Algorithm state dictionary
        
    Returns:
        Serializable state dictionary
    """
    serialized = {}
    
    for key, value in state.items():
        # Convert numpy arrays to lists
        if hasattr(value, 'tolist'):
            serialized[key] = value.tolist()
        # Convert sets to lists
        elif isinstance(value, set):
            serialized[key] = list(value)
        # Handle nested dictionaries
        elif isinstance(value, dict):
            serialized[key] = serialize_algorithm_state(value)
        # Handle nested lists
        elif isinstance(value, list):
            serialized[key] = [
                serialize_algorithm_state(item) if isinstance(item, dict) 
                else item for item in value
            ]
        else:
            serialized[key] = value
    
    return serialized

# ------- API Endpoints -------

@app.route('/status', methods=['GET'])
def status() -> Response:
    """
    Health check endpoint to verify server is running.
    
    Returns:
        JSON response with server status
    """
    return jsonify({
        'status': 'running',
        'algorithms': list(ALGORITHM_REGISTRY.keys()),
        'message': 'Python algorithm bridge server is operational'
    })

@app.route('/execute', methods=['POST'])
def execute_algorithm() -> Response:
    """
    Execute an algorithm on provided data with instrumentation.
    
    Expected request body:
    {
        "algorithm": "algorithm-key",
        "data": [...],
        "options": {...}
    }
    
    Returns:
        JSON response with algorithm results and metrics
    """
    try:
        # Parse request data
        request_data = request.json
        if not request_data:
            return jsonify({'error': 'Invalid request format'}), 400
        
        algorithm_key = request_data.get('algorithm')
        data = request_data.get('data', [])
        options = request_data.get('options', {})
        
        if not algorithm_key:
            return jsonify({'error': 'Algorithm key is required'}), 400
        
        # Import algorithm class
        algorithm_class, error = import_algorithm(algorithm_key)
        if error:
            return jsonify({'error': error}), 404
        
        # Convert options to Python style
        python_options = convert_options(options)
        
        # Initialize and execute algorithm
        algorithm = algorithm_class(python_options)
        result = algorithm.execute(data)
        
        # Prepare response with results and metrics
        response = {
            'result': result,
            'metrics': serialize_algorithm_state(algorithm.metrics),
            'history': [
                serialize_algorithm_state(state) for state in algorithm.history
            ]
        }
        
        return jsonify(response)
    
    except Exception as e:
        # Provide detailed error information in debug mode
        if DEBUG:
            return jsonify({
                'error': str(e),
                'traceback': traceback.format_exc()
            }), 500
        
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/compare', methods=['POST'])
def compare_algorithms() -> Response:
    """
    Compare multiple algorithms on the same dataset.
    
    Expected request body:
    {
        "algorithms": ["algorithm-key-1", "algorithm-key-2", ...],
        "data": [...],
        "options": {
            "algorithm-key-1": {...},
            "algorithm-key-2": {...},
            ...
        }
    }
    
    Returns:
        JSON response with comparative results
    """
    try:
        # Parse request data
        request_data = request.json
        if not request_data:
            return jsonify({'error': 'Invalid request format'}), 400
        
        algorithms = request_data.get('algorithms', [])
        data = request_data.get('data', [])
        options_map = request_data.get('options', {})
        
        if not algorithms:
            return jsonify({'error': 'At least one algorithm is required'}), 400
        
        results = {}
        
        # Execute each algorithm
        for algorithm_key in algorithms:
            # Import algorithm class
            algorithm_class, error = import_algorithm(algorithm_key)
            if error:
                results[algorithm_key] = {'error': error}
                continue
            
            # Get algorithm-specific options
            options = options_map.get(algorithm_key, {})
            python_options = convert_options(options)
            
            # Initialize and execute algorithm
            algorithm = algorithm_class(python_options)
            start_time = time.time()
            sorted_data = algorithm.execute(data)
            execution_time = time.time() - start_time
            
            # Store results
            results[algorithm_key] = {
                'result': sorted_data,
                'metrics': serialize_algorithm_state(algorithm.metrics),
                'execution_time': execution_time
            }
        
        return jsonify({
            'comparison': results,
            'input_size': len(data)
        })
    
    except Exception as e:
        # Provide detailed error information in debug mode
        if DEBUG:
            return jsonify({
                'error': str(e),
                'traceback': traceback.format_exc()
            }), 500
        
        return jsonify({'error': 'Internal server error'}), 500

# ------- Server Initialization -------

if __name__ == '__main__':
    print(f"Starting Python bridge server on http://{HOST}:{PORT}")
    print(f"Available algorithms: {', '.join(ALGORITHM_REGISTRY.keys())}")
    app.run(host=HOST, port=PORT, debug=DEBUG)