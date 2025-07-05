#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Base Algorithm Test Class

This module defines the foundational testing infrastructure for all sorting algorithm
tests. It provides a comprehensive framework for evaluating correctness, performance,
and behavioral characteristics of sorting algorithms.

The BaseAlgorithmTest class implements common test patterns, data generation,
validity checking, and performance analysis that can be reused across all
algorithm-specific test classes. This ensures consistent methodology and reduces
duplication while maintaining a formal verification approach.

Author: Algorithm Visualization Platform Team
License: MIT
"""

import unittest
import time
import random
import copy
import statistics
import sys
import gc
import inspect
import numpy as np
from typing import List, Any, Dict, Tuple, Callable, Type, Optional, Union, Set
from abc import ABC, abstractmethod
import matplotlib.pyplot as plt
from contextlib import contextmanager
import logging
import os
import io

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('algorithm_tests')

# Import base algorithm class - relative to the project structure
# Adjust import paths as needed for your specific setup
import sys
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../python')))
from core.base_algorithm import Algorithm


class BaseAlgorithmTest(unittest.TestCase):
    """
    Base class for all sorting algorithm unit tests.
    
    This class provides a comprehensive testing framework for sorting algorithms,
    including test data generation, correctness verification, performance measurement,
    and behavioral analysis.
    
    Derived test classes should:
    1. Implement the abstract method get_algorithm_class() to return the algorithm class under test
    2. Optionally override setup_algorithm_instance() to configure algorithm-specific options
    3. Add algorithm-specific test methods if needed
    
    All common test patterns are implemented here and will be executed for any
    algorithm when the derived test class is run.
    """
    
    # Class constants for test configuration
    SMALL_SIZE = 10          # For detailed step tracing and boundary tests
    MEDIUM_SIZE = 100        # For typical algorithm behavior tests
    LARGE_SIZE = 1000        # For performance and scaling tests
    PERFORMANCE_SIZE = 10000 # For dedicated performance tests
    
    # Performance related constants
    PERFORMANCE_RUNS = 5     # Number of runs for performance averaging
    WARMUP_RUNS = 2          # Number of warmup runs before performance measurement
    
    # Timeout for tests (seconds) - prevents infinite loops in buggy implementations
    TEST_TIMEOUT = 30
    
    # Enable/disable specific test categories
    ENABLE_PERFORMANCE_TESTS = True
    ENABLE_VISUALIZATION_TESTS = True
    ENABLE_MEMORY_TESTS = True
    ENABLE_EDGE_CASE_TESTS = True
    
    @abstractmethod
    def get_algorithm_class(self) -> Type[Algorithm]:
        """
        Abstract method to get the algorithm class being tested.
        
        Must be implemented by derived test classes to provide the algorithm
        class (not instance) that is being tested.
        
        Returns:
            Type[Algorithm]: The algorithm class being tested
        """
        pass
    
    def setup_algorithm_instance(self, options: Dict[str, Any] = None) -> Algorithm:
        """
        Create and configure an instance of the algorithm under test.
        
        This method creates an algorithm instance with default or specified options.
        Derived classes may override this to provide algorithm-specific configuration.
        
        Args:
            options (Dict[str, Any], optional): Algorithm-specific options. Defaults to None.
            
        Returns:
            Algorithm: Configured algorithm instance ready for testing
        """
        algorithm_class = self.get_algorithm_class()
        return algorithm_class(options or {})
    
    def setUp(self):
        """
        Set up the test environment before each test method.
        
        This method is called automatically before each test method runs.
        It creates a fresh algorithm instance and prepares the test environment.
        """
        self.algorithm = self.setup_algorithm_instance()
        
        # Store algorithm metadata for test reporting
        self.algorithm_name = self.algorithm.name
        self.algorithm_category = self.algorithm.category
        
        # Capture algorithm complexity for later analysis
        self.complexity = self.algorithm.get_complexity()
        
        # Set up test reporting
        logger.info(f"Testing {self.algorithm_name} ({self.algorithm_category})")
        logger.info(f"Complexity: Best={self.complexity['time']['best']}, "
                    f"Average={self.complexity['time']['average']}, "
                    f"Worst={self.complexity['time']['worst']}")
    
    def tearDown(self):
        """
        Clean up the test environment after each test method.
        
        This method is called automatically after each test method runs.
        It releases resources and performs cleanup to prevent test interference.
        """
        # Force garbage collection to prevent memory leaks affecting subsequent tests
        gc.collect()
    
    # ========================================================================
    # Data Generation Methods
    # ========================================================================
    
    def generate_random_data(self, size: int, min_val: int = 0, max_val: int = 1000) -> List[int]:
        """
        Generate a random array of integers.
        
        Args:
            size (int): Size of the array to generate
            min_val (int, optional): Minimum value in the array. Defaults to 0.
            max_val (int, optional): Maximum value in the array. Defaults to 1000.
            
        Returns:
            List[int]: Randomly generated array
        """
        return [random.randint(min_val, max_val) for _ in range(size)]
    
    def generate_sorted_data(self, size: int, min_val: int = 0, max_val: int = 1000) -> List[int]:
        """
        Generate a sorted array of integers.
        
        Args:
            size (int): Size of the array to generate
            min_val (int, optional): Minimum value in the array. Defaults to 0.
            max_val (int, optional): Maximum value in the array. Defaults to 1000.
            
        Returns:
            List[int]: Sorted array
        """
        if size <= 1:
            return [min_val] * size
            
        step = (max_val - min_val) / (size - 1)
        return [int(min_val + i * step) for i in range(size)]
    
    def generate_reversed_data(self, size: int, min_val: int = 0, max_val: int = 1000) -> List[int]:
        """
        Generate a reversed (descending) array of integers.
        
        Args:
            size (int): Size of the array to generate
            min_val (int, optional): Minimum value in the array. Defaults to 0.
            max_val (int, optional): Maximum value in the array. Defaults to 1000.
            
        Returns:
            List[int]: Reversed sorted array
        """
        if size <= 1:
            return [max_val] * size
            
        step = (max_val - min_val) / (size - 1)
        return [int(max_val - i * step) for i in range(size)]
    
    def generate_nearly_sorted_data(self, size: int, perturbation: float = 0.1, 
                                    min_val: int = 0, max_val: int = 1000) -> List[int]:
        """
        Generate a nearly sorted array with controlled perturbation.
        
        Args:
            size (int): Size of the array to generate
            perturbation (float, optional): Fraction of elements to perturb. Defaults to 0.1.
            min_val (int, optional): Minimum value in the array. Defaults to 0.
            max_val (int, optional): Maximum value in the array. Defaults to 1000.
            
        Returns:
            List[int]: Nearly sorted array
        """
        # Generate sorted array
        data = self.generate_sorted_data(size, min_val, max_val)
        
        # Determine how many elements to swap
        swaps = int(size * perturbation)
        
        # Perform random swaps
        for _ in range(swaps):
            i = random.randint(0, size - 2)
            # Swap with nearby element to maintain "nearly" sorted property
            j = min(i + random.randint(1, 3), size - 1)
            data[i], data[j] = data[j], data[i]
            
        return data
    
    def generate_few_unique_data(self, size: int, unique_values: int = 5,
                                min_val: int = 0, max_val: int = 1000) -> List[int]:
        """
        Generate array with few unique values (many duplicates).
        
        Args:
            size (int): Size of the array to generate
            unique_values (int, optional): Number of distinct values. Defaults to 5.
            min_val (int, optional): Minimum value in the array. Defaults to 0.
            max_val (int, optional): Maximum value in the array. Defaults to 1000.
            
        Returns:
            List[int]: Array with few unique values
        """
        # Ensure unique_values is reasonable
        unique_values = min(unique_values, size, max_val - min_val + 1)
        
        # Generate the unique values
        values = sorted(random.sample(range(min_val, max_val + 1), unique_values))
        
        # Generate array by randomly selecting from unique values
        return [random.choice(values) for _ in range(size)]
    
    def generate_equal_data(self, size: int, value: int = 42) -> List[int]:
        """
        Generate array with all equal values.
        
        Args:
            size (int): Size of the array to generate
            value (int, optional): Value to fill the array with. Defaults to 42.
            
        Returns:
            List[int]: Array with all equal values
        """
        return [value] * size
    
    def generate_custom_data(self, data_spec: Dict[str, Any]) -> List[int]:
        """
        Generate custom test data based on a specification.
        
        This flexible method allows test cases to specify custom data
        generation parameters through a dictionary configuration.
        
        Args:
            data_spec (Dict[str, Any]): Specification for data generation
                Contains keys:
                - 'type': Type of data ('random', 'sorted', 'reversed', etc.)
                - Other type-specific parameters
            
        Returns:
            List[int]: Generated data according to specification
        """
        data_type = data_spec.get('type', 'random')
        size = data_spec.get('size', self.MEDIUM_SIZE)
        min_val = data_spec.get('min_val', 0)
        max_val = data_spec.get('max_val', 1000)
        
        if data_type == 'random':
            return self.generate_random_data(size, min_val, max_val)
        elif data_type == 'sorted':
            return self.generate_sorted_data(size, min_val, max_val)
        elif data_type == 'reversed':
            return self.generate_reversed_data(size, min_val, max_val)
        elif data_type == 'nearly_sorted':
            perturbation = data_spec.get('perturbation', 0.1)
            return self.generate_nearly_sorted_data(size, perturbation, min_val, max_val)
        elif data_type == 'few_unique':
            unique_values = data_spec.get('unique_values', 5)
            return self.generate_few_unique_data(size, unique_values, min_val, max_val)
        elif data_type == 'equal':
            value = data_spec.get('value', 42)
            return self.generate_equal_data(size, value)
        elif data_type == 'custom_pattern':
            # For completely custom patterns defined in the spec
            return data_spec.get('data', [])
        else:
            raise ValueError(f"Unknown data type: {data_type}")
    
    def generate_object_data(self, size: int, key_range: int = 10) -> List[Dict[str, Any]]:
        """
        Generate array of objects for testing algorithm stability.
        
        This creates objects with 'key' for sorting and 'original_index'
        to track the original position, allowing stability verification.
        
        Args:
            size (int): Size of the array to generate
            key_range (int, optional): Range of key values (smaller = more duplicates). 
                                      Defaults to 10.
            
        Returns:
            List[Dict[str, Any]]: Array of objects with keys and indexes
        """
        return [
            {
                'key': i % key_range,              # Key to sort by (will have duplicates)
                'original_index': i,              # Original position (for checking stability)
                'value': random.randint(0, 1000)  # Random additional value
            }
            for i in range(size)
        ]
    
    # ========================================================================
    # Verification Methods
    # ========================================================================
    
    def verify_sorted(self, original: List[Any], result: List[Any], 
                      stability_check: bool = False) -> bool:
        """
        Verify that the result is correctly sorted and contains the same elements.
        
        This method performs a comprehensive check that:
        1. The result array has the same length as the original
        2. The result contains exactly the same elements as the original
        3. The result is in ascending order
        4. (Optionally) The result maintains relative order of equal elements (stability)
        
        Args:
            original (List[Any]): Original unsorted array
            result (List[Any]): Sorted array to verify
            stability_check (bool, optional): Whether to check algorithm stability. 
                                             Defaults to False.
            
        Returns:
            bool: True if result is correctly sorted, False otherwise
            
        Raises:
            AssertionError: If verification fails with detailed explanation
        """
        # 1. Check length
        self.assertEqual(len(original), len(result), 
                         "Sorted array length differs from original")
        
        # 2. Check content (same elements)
        # Use Counter for efficient element counting and comparison
        from collections import Counter
        self.assertEqual(Counter(original), Counter(result),
                         "Sorted array contains different elements than original")
        
        # 3. Check order (sorted in ascending order)
        for i in range(1, len(result)):
            # Proper handling for custom objects that may use 'key' for sorting
            if isinstance(result[0], dict) and 'key' in result[0]:
                self.assertLessEqual(result[i-1]['key'], result[i]['key'],
                                    f"Elements at positions {i-1} and {i} are not in sorted order")
            else:
                self.assertLessEqual(result[i-1], result[i],
                                    f"Elements at positions {i-1} and {i} are not in sorted order")
        
        # 4. Check stability if needed
        if stability_check and isinstance(result[0], dict) and 'original_index' in result[0]:
            for i in range(1, len(result)):
                if result[i-1]['key'] == result[i]['key']:
                    self.assertLess(result[i-1]['original_index'], result[i]['original_index'],
                                   f"Equal elements at positions {i-1} and {i} are not in original order")
        
        return True
    
    def verify_metrics(self, metrics: Dict[str, Any], expected: Dict[str, Any]) -> bool:
        """
        Verify that algorithm metrics match expected values.
        
        This allows testing that algorithms perform operations within
        expected bounds or match theoretical predictions.
        
        Args:
            metrics (Dict[str, Any]): Actual metrics from algorithm execution
            expected (Dict[str, Any]): Expected metrics or ranges
            
        Returns:
            bool: True if metrics meet expectations, False otherwise
            
        Raises:
            AssertionError: If any metric is outside expected bounds
        """
        for key, expected_value in expected.items():
            if key in metrics:
                actual_value = metrics[key]
                
                # Handle different types of expectations
                if isinstance(expected_value, tuple) and len(expected_value) == 2:
                    # Range check (min, max)
                    min_val, max_val = expected_value
                    self.assertGreaterEqual(actual_value, min_val,
                                           f"Metric {key} ({actual_value}) is below minimum expected value {min_val}")
                    self.assertLessEqual(actual_value, max_val,
                                        f"Metric {key} ({actual_value}) exceeds maximum expected value {max_val}")
                else:
                    # Exact value check
                    self.assertEqual(actual_value, expected_value,
                                    f"Metric {key} ({actual_value}) does not match expected value {expected_value}")
            else:
                self.fail(f"Expected metric {key} not found in actual metrics")
        
        return True
    
    def verify_history(self, history: List[Dict[str, Any]]) -> bool:
        """
        Verify that algorithm history is correctly recorded.
        
        This checks that the algorithm properly records its execution
        steps for visualization and analysis.
        
        Args:
            history (List[Dict[str, Any]]): Algorithm execution history
            
        Returns:
            bool: True if history is valid, False otherwise
            
        Raises:
            AssertionError: If history has invalid structure or inconsistencies
        """
        # Basic history validity checks
        self.assertGreater(len(history), 0, "Algorithm history is empty")
        
        # Check for required fields in history entries
        required_fields = {'array', 'type', 'timestamp'}
        for i, step in enumerate(history):
            for field in required_fields:
                self.assertIn(field, step, f"Step {i} missing required field '{field}'")
            
            # Verify array in each step has same length
            if i > 0:
                self.assertEqual(len(history[0]['array']), len(step['array']),
                                f"Step {i} has different array length than initial step")
        
        # Verify operations are properly recorded
        op_types = {'comparison', 'swap', 'read', 'write'}
        has_operations = any(step.get('type') in op_types for step in history)
        self.assertTrue(has_operations, "No operation events (comparison/swap/read/write) recorded in history")
        
        # Verify algorithm progression (intermediate states lead to final sorted state)
        if len(history) > 1:
            final_state = history[-1]['array']
            is_sorted = all(final_state[i] <= final_state[i+1] for i in range(len(final_state)-1))
            self.assertTrue(is_sorted, "Final state in history is not sorted")
        
        return True
    
    # ========================================================================
    # Test Execution Methods
    # ========================================================================
    
    def run_sort_test(self, test_data: List[Any], options: Dict[str, Any] = None, 
                      stability_check: bool = False, expected_metrics: Dict[str, Any] = None,
                      check_history: bool = False) -> Tuple[List[Any], Dict[str, Any]]:
        """
        Run a sorting test with given test data and verify results.
        
        This is the core test execution method that:
        1. Creates a fresh algorithm instance
        2. Runs the algorithm on the test data
        3. Verifies the result is correctly sorted
        4. Optionally verifies metrics and history
        
        Args:
            test_data (List[Any]): Data to sort
            options (Dict[str, Any], optional): Algorithm-specific options. Defaults to None.
            stability_check (bool, optional): Whether to check algorithm stability. Defaults to False.
            expected_metrics (Dict[str, Any], optional): Expected metrics. Defaults to None.
            check_history (bool, optional): Whether to verify history. Defaults to False.
            
        Returns:
            Tuple[List[Any], Dict[str, Any]]: Tuple of (sorted result, metrics)
            
        Raises:
            AssertionError: If any verification fails
        """
        # Create a fresh algorithm instance with options
        algorithm = self.setup_algorithm_instance(options)
        
        # Clone test data to avoid modifying original
        test_data_copy = copy.deepcopy(test_data)
        
        # Execute algorithm
        result = algorithm.execute(test_data_copy)
        
        # Verify result is correctly sorted
        self.verify_sorted(test_data, result, stability_check)
        
        # Verify metrics if expectations provided
        if expected_metrics:
            self.verify_metrics(algorithm.metrics, expected_metrics)
        
        # Verify history recording if requested
        if check_history:
            self.verify_history(algorithm.history)
        
        return result, algorithm.metrics
    
    @contextmanager
    def assert_performance(self, max_time_ms: float):
        """
        Context manager for asserting code block execution time.
        
        Args:
            max_time_ms (float): Maximum allowed execution time in milliseconds
            
        Raises:
            AssertionError: If the code block takes longer than max_time_ms
        
        Usage:
            with self.assert_performance(100):
                result = algorithm.execute(data)
        """
        start_time = time.time()
        yield
        execution_time = (time.time() - start_time) * 1000  # Convert to ms
        
        self.assertLessEqual(
            execution_time, 
            max_time_ms,
            f"Execution took {execution_time:.2f}ms, exceeding the limit of {max_time_ms}ms"
        )
    
    def measure_performance(self, data: List[Any], runs: int = 5, 
                           warmup_runs: int = 2) -> Dict[str, float]:
        """
        Measure algorithm performance metrics over multiple runs.
        
        Args:
            data (List[Any]): Test data to use for measurement
            runs (int, optional): Number of measurement runs. Defaults to 5.
            warmup_runs (int, optional): Number of warmup runs. Defaults to 2.
            
        Returns:
            Dict[str, float]: Performance metrics including averages and variance
        """
        algorithm = self.setup_algorithm_instance()
        execution_times = []
        operation_counts = []
        
        # Perform warmup runs to eliminate JIT, cache effects, etc.
        for _ in range(warmup_runs):
            data_copy = copy.deepcopy(data)
            algorithm.reset()
            algorithm.execute(data_copy)
        
        # Perform measurement runs
        for _ in range(runs):
            data_copy = copy.deepcopy(data)
            algorithm.reset()
            
            start_time = time.time()
            algorithm.execute(data_copy)
            execution_time = (time.time() - start_time) * 1000  # Convert to ms
            
            execution_times.append(execution_time)
            operation_counts.append(algorithm.metrics['comparisons'] + 
                                   algorithm.metrics['swaps'])
        
        # Calculate performance metrics
        return {
            'min_time_ms': min(execution_times),
            'max_time_ms': max(execution_times),
            'avg_time_ms': statistics.mean(execution_times),
            'median_time_ms': statistics.median(execution_times),
            'stddev_time_ms': statistics.stdev(execution_times) if runs > 1 else 0,
            'avg_operations': statistics.mean(operation_counts),
            'operations_per_ms': statistics.mean(operation_counts) / statistics.mean(execution_times),
            'runs': runs
        }
    
    def analyze_scaling(self, size_range: List[int], 
                       data_gen_func: Callable[[int], List[Any]] = None) -> Dict[str, List[float]]:
        """
        Analyze how algorithm performance scales with input size.
        
        Args:
            size_range (List[int]): List of input sizes to test
            data_gen_func (Callable[[int], List[Any]], optional): 
                Function to generate test data. Defaults to generate_random_data.
            
        Returns:
            Dict[str, List[float]]: Scaling metrics for different input sizes
        """
        if data_gen_func is None:
            data_gen_func = self.generate_random_data
        
        scaling_data = {
            'sizes': size_range,
            'times_ms': [],
            'comparisons': [],
            'swaps': []
        }
        
        algorithm = self.setup_algorithm_instance()
        
        for size in size_range:
            # Generate test data
            test_data = data_gen_func(size)
            
            # Measure execution
            algorithm.reset()
            start_time = time.time()
            algorithm.execute(test_data)
            execution_time = (time.time() - start_time) * 1000  # Convert to ms
            
            # Record metrics
            scaling_data['times_ms'].append(execution_time)
            scaling_data['comparisons'].append(algorithm.metrics['comparisons'])
            scaling_data['swaps'].append(algorithm.metrics['swaps'])
        
        return scaling_data
    
    # ========================================================================
    # Common Test Methods
    # ========================================================================
    
    def test_empty_array(self):
        """Test sorting an empty array."""
        empty_data = []
        result, _ = self.run_sort_test(empty_data)
        self.assertEqual(result, [])
    
    def test_single_element(self):
        """Test sorting an array with a single element."""
        single_data = [42]
        result, _ = self.run_sort_test(single_data)
        self.assertEqual(result, [42])
    
    def test_small_random(self):
        """Test sorting a small random array."""
        data = self.generate_random_data(self.SMALL_SIZE)
        self.run_sort_test(data)
    
    def test_medium_random(self):
        """Test sorting a medium-sized random array."""
        data = self.generate_random_data(self.MEDIUM_SIZE)
        self.run_sort_test(data)
    
    def test_already_sorted(self):
        """Test sorting an already sorted array."""
        data = self.generate_sorted_data(self.MEDIUM_SIZE)
        self.run_sort_test(data)
    
    def test_reversed(self):
        """Test sorting a reversed array."""
        data = self.generate_reversed_data(self.MEDIUM_SIZE)
        self.run_sort_test(data)
    
    def test_all_equal(self):
        """Test sorting an array with all equal elements."""
        data = self.generate_equal_data(self.MEDIUM_SIZE)
        self.run_sort_test(data)
    
    def test_nearly_sorted(self):
        """Test sorting a nearly sorted array."""
        data = self.generate_nearly_sorted_data(self.MEDIUM_SIZE)
        self.run_sort_test(data)
    
    def test_few_unique(self):
        """Test sorting an array with few unique values."""
        data = self.generate_few_unique_data(self.MEDIUM_SIZE)
        self.run_sort_test(data)
    
    def test_stability(self):
        """Test algorithm stability with objects."""
        # Skip if algorithm is known to be unstable
        if not self.algorithm.is_stable():
            self.skipTest("Algorithm is not stable")
        
        data = self.generate_object_data(self.MEDIUM_SIZE)
        self.run_sort_test(data, stability_check=True)
    
    def test_large_array(self):
        """Test sorting a large array."""
        data = self.generate_random_data(self.LARGE_SIZE)
        self.run_sort_test(data)
    
    def test_with_history_recording(self):
        """Test that algorithm correctly records its execution history."""
        data = self.generate_random_data(self.SMALL_SIZE)
        _, _ = self.run_sort_test(data, check_history=True)
    
    def test_algorithm_reproducibility(self):
        """Test that algorithm produces the same result with the same input."""
        data = self.generate_random_data(self.MEDIUM_SIZE)
        
        # First run
        algorithm1 = self.setup_algorithm_instance()
        result1 = algorithm1.execute(data.copy())
        
        # Second run
        algorithm2 = self.setup_algorithm_instance()
        result2 = algorithm2.execute(data.copy())
        
        # Results should be identical
        self.assertEqual(result1, result2,
                         "Algorithm does not produce consistent results with the same input")
    
    def test_custom_comparator(self):
        """Test algorithm with custom comparator."""
        # Check if algorithm supports custom comparator
        if not hasattr(self.algorithm, 'compare'):
            self.skipTest("Algorithm does not support custom comparator")
        
        # Test with reverse sorting
        data = self.generate_random_data(self.MEDIUM_SIZE)
        
        # Create algorithm instance with custom comparator
        algorithm = self.setup_algorithm_instance({
            'comparator': lambda a, b: -1 if a > b else 1 if a < b else 0
        })
        
        result = algorithm.execute(data.copy())
        
        # Verify result is sorted in descending order
        for i in range(1, len(result)):
            self.assertGreaterEqual(result[i-1], result[i],
                                   f"Elements at positions {i-1} and {i} are not in descending order")
    
    # ========================================================================
    # Performance Tests
    # ========================================================================
    
    def test_performance_scaling(self):
        """Test how algorithm performance scales with input size."""
        if not self.ENABLE_PERFORMANCE_TESTS:
            self.skipTest("Performance tests disabled")
        
        # Define test sizes (exponential growth)
        sizes = [10, 100, 1000]
        
        # Use smaller sizes if algorithm is known to be slow (O(n²))
        complexity = self.algorithm.get_complexity()['time']['worst']
        if 'O(n²)' in complexity:
            sizes = [10, 50, 100, 500]
        
        # Analyze scaling with random data
        scaling_data = self.analyze_scaling(sizes, self.generate_random_data)
        
        # Log scaling results
        logger.info(f"Performance scaling for {self.algorithm_name}:")
        for i, size in enumerate(scaling_data['sizes']):
            logger.info(f"Size {size:5d}: {scaling_data['times_ms'][i]:8.2f}ms, "
                       f"{scaling_data['comparisons'][i]:10d} comparisons, "
                       f"{scaling_data['swaps'][i]:8d} swaps")
        
        # For visual analysis, create scaling plot if matplotlib available
        if self.ENABLE_VISUALIZATION_TESTS:
            try:
                plt.figure(figsize=(10, 6))
                plt.plot(scaling_data['sizes'], scaling_data['times_ms'], 'o-', label='Execution Time (ms)')
                plt.xlabel('Input Size')
                plt.ylabel('Time (ms)')
                plt.title(f'{self.algorithm_name} Performance Scaling')
                plt.grid(True)
                plt.savefig(f"{self.algorithm_name.replace(' ', '_').lower()}_scaling.png")
                plt.close()
            except Exception as e:
                logger.warning(f"Could not create scaling plot: {e}")
    
    def test_best_case_performance(self):
        """Test algorithm performance on its best-case input."""
        if not self.ENABLE_PERFORMANCE_TESTS:
            self.skipTest("Performance tests disabled")
        
        # Determine best case data based on algorithm characteristics
        is_adaptive = hasattr(self.algorithm, 'is_adaptive') and self.algorithm.is_adaptive()
        
        # For adaptive algorithms, best case is often already sorted
        if is_adaptive:
            data = self.generate_sorted_data(self.LARGE_SIZE)
        else:
            # For non-adaptive algorithms, use random data as a baseline
            data = self.generate_random_data(self.LARGE_SIZE)
        
        performance = self.measure_performance(data)
        
        logger.info(f"Best case performance for {self.algorithm_name}:")
        logger.info(f"Average time: {performance['avg_time_ms']:.2f}ms")
        logger.info(f"Operations per ms: {performance['operations_per_ms']:.2f}")
    
    def test_worst_case_performance(self):
        """Test algorithm performance on its worst-case input."""
        if not self.ENABLE_PERFORMANCE_TESTS:
            self.skipTest("Performance tests disabled")
        
        # Determine worst case data based on algorithm characteristics
        complexity = self.algorithm.get_complexity()['time']['worst']
        
        # For many comparison sorts, reversed data is worst case
        # For others, it might be specific patterns
        if 'O(n²)' in complexity:
            # Use a smaller size for quadratic algorithms
            data = self.generate_reversed_data(self.MEDIUM_SIZE)
        else:
            data = self.generate_reversed_data(self.LARGE_SIZE)
        
        performance = self.measure_performance(data)
        
        logger.info(f"Worst case performance for {self.algorithm_name}:")
        logger.info(f"Average time: {performance['avg_time_ms']:.2f}ms")
        logger.info(f"Operations per ms: {performance['operations_per_ms']:.2f}")


# Enable running this module directly for debugging
if __name__ == "__main__":
    unittest.main()
