#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Python testing configuration for the Sorting Algorithm Visualization Platform.

This module establishes the pytest configuration and fixtures required for
comprehensive testing of Python algorithm implementations. It provides utilities
for measuring performance, verifying algorithmic correctness, and testing
algorithm stability across different input distributions.

The configuration creates a robust environment for testing sorting algorithms
with a focus on correctness, performance, and edge case handling.

Author: Sorting Visualizer Team
"""

import os
import sys
import time
import json
import random
import pytest
import numpy as np
from typing import List, Dict, Any, Callable, Tuple, Optional, Union
from collections import defaultdict

# Add project root to Python path to enable absolute imports
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

# Constants for testing parameters
MAX_ARRAY_SIZE = 10000
PERFORMANCE_SAMPLE_COUNT = 5
STABILITY_TEST_SIZE = 1000


class AlgorithmTestBase:
    """Base class for algorithm test fixtures and utility methods."""
    
    @staticmethod
    def is_sorted(array: List[Any], reverse: bool = False) -> bool:
        """
        Check if an array is sorted in ascending or descending order.
        
        Args:
            array: The array to check
            reverse: If True, check for descending order, otherwise ascending
            
        Returns:
            bool: True if the array is sorted, False otherwise
        """
        if len(array) <= 1:
            return True
            
        compare = (lambda x, y: x > y) if reverse else (lambda x, y: x < y)
        
        for i in range(1, len(array)):
            if compare(array[i-1], array[i]):
                return False
                
        return True
    
    @staticmethod
    def measure_performance(sort_fn: Callable, input_array: List[Any]) -> Dict[str, float]:
        """
        Measure the performance of a sorting algorithm.
        
        Args:
            sort_fn: The sorting function to measure
            input_array: The input array to sort
            
        Returns:
            dict: Performance metrics including execution time
        """
        # Make a copy to avoid modifying the original array
        array_copy = input_array.copy()
        
        # Warm-up call to avoid initialization overhead
        sort_fn(array_copy.copy())
        
        # Measure multiple runs for more accurate timing
        times = []
        for _ in range(PERFORMANCE_SAMPLE_COUNT):
            start_time = time.time()
            sort_fn(array_copy.copy())
            end_time = time.time()
            times.append(end_time - start_time)
        
        # Calculate statistics
        mean_time = sum(times) / len(times)
        min_time = min(times)
        max_time = max(times)
        
        return {
            "mean_execution_time": mean_time,
            "min_execution_time": min_time,
            "max_execution_time": max_time,
            "array_size": len(input_array)
        }
    
    @staticmethod
    def check_stability(sort_fn: Callable, input_array: List[Tuple[Any, int]]) -> bool:
        """
        Check if a sorting algorithm preserves the relative order of equal elements.
        
        Args:
            sort_fn: The sorting function to test
            input_array: Array of (value, original_index) tuples
            
        Returns:
            bool: True if the algorithm is stable, False otherwise
        """
        # Custom comparator for sorting tuples by their first element only
        def comparator(x, y):
            return -1 if x[0] < y[0] else 1 if x[0] > y[0] else 0
            
        # Function to test stability by checking if equal elements maintain their original order
        def is_stable(result):
            for i in range(1, len(result)):
                if result[i][0] == result[i-1][0] and result[i][1] < result[i-1][1]:
                    return False
            return True
        
        # Sort the array using the algorithm
        result = sort_fn(input_array.copy(), key=lambda x: x[0])
        
        return is_stable(result)


# ========== Test Fixtures ==========

@pytest.fixture
def standard_test_arrays() -> Dict[str, List[int]]:
    """
    Fixture providing a standard set of test arrays for algorithm testing.
    
    Returns:
        dict: Dictionary mapping test case names to arrays
    """
    return {
        "empty": [],
        "single_element": [42],
        "sorted": list(range(100)),
        "reversed": list(range(100, 0, -1)),
        "random_small": [3, 1, 4, 1, 5, 9, 2, 6, 5, 3],
        "random_medium": random.sample(range(1000), 100),
        "repeated": [7] * 100 + [3] * 50 + [9] * 30,
        "nearly_sorted": sorted(random.sample(range(1000), 100))[:80] + random.sample(range(1000), 20),
        "many_duplicates": [random.randint(1, 10) for _ in range(100)],
        "alternating": [i % 10 for i in range(100)]
    }

@pytest.fixture
def edge_case_arrays() -> Dict[str, List[int]]:
    """
    Fixture providing edge case arrays for thorough algorithm testing.
    
    Returns:
        dict: Dictionary mapping edge case names to arrays
    """
    return {
        "all_equal": [42] * 100,
        "already_sorted": sorted(random.sample(range(1000), 100)),
        "reverse_sorted": sorted(random.sample(range(1000), 100), reverse=True),
        "almost_sorted": sorted(random.sample(range(1000), 98)) + [1000, 1001],
        "negative_numbers": [-x for x in random.sample(range(1000), 100)],
        "mixed_sign": [-x if i % 2 else x for i, x in enumerate(random.sample(range(1000), 100))],
        "float_values": [random.random() * 1000 for _ in range(100)],
        "large_range": [random.randint(-(10**9), 10**9) for _ in range(100)],
        "multiple_zeros": [0] * 20 + random.sample(range(100), 80)
    }

@pytest.fixture
def stability_test_arrays() -> Dict[str, List[Tuple[int, int]]]:
    """
    Fixture providing arrays for testing algorithm stability.
    
    Returns:
        dict: Dictionary mapping test case names to arrays with (value, original_index) tuples
    """
    # Create arrays with duplicate keys but unique identifiers
    random_array = [(random.randint(1, 20), i) for i in range(STABILITY_TEST_SIZE)]
    
    # Ensure we have duplicates
    for i in range(0, STABILITY_TEST_SIZE, 10):
        if i + 5 < STABILITY_TEST_SIZE:
            random_array[i+5] = (random_array[i][0], i+5)
    
    sorted_array = sorted(random_array, key=lambda x: x[0])
    reversed_array = sorted(random_array, key=lambda x: x[0], reverse=True)
    
    return {
        "random_with_duplicates": random_array,
        "sorted_with_duplicates": sorted_array,
        "reversed_with_duplicates": reversed_array
    }

@pytest.fixture
def performance_test_arrays() -> Dict[str, List[int]]:
    """
    Fixture providing arrays for performance testing.
    
    Returns:
        dict: Dictionary mapping test case names to arrays
    """
    return {
        "random_small": random.sample(range(10**4), 1000),
        "random_medium": random.sample(range(10**5), 5000),
        "random_large": random.sample(range(10**6), 10000),
        "sorted_medium": sorted(random.sample(range(10**5), 5000)),
        "reversed_medium": sorted(random.sample(range(10**5), 5000), reverse=True),
        "nearly_sorted_medium": sorted(random.sample(range(10**5), 4500)) + random.sample(range(10**5), 500)
    }

@pytest.fixture
def algorithm_test_util() -> AlgorithmTestBase:
    """
    Fixture providing algorithm testing utilities.
    
    Returns:
        AlgorithmTestBase: Instance of the test utility class
    """
    return AlgorithmTestBase()


# ========== Pytest Configuration ==========

def pytest_addoption(parser):
    """Add custom command line options to pytest."""
    parser.addoption(
        "--run-performance", 
        action="store_true", 
        default=False, 
        help="Run performance tests"
    )
    parser.addoption(
        "--max-array-size", 
        action="store", 
        default=MAX_ARRAY_SIZE, 
        type=int, 
        help="Maximum array size for tests"
    )
    parser.addoption(
        "--algorithm-filter", 
        action="store", 
        default=None, 
        help="Filter tests to specific algorithm(s)"
    )

def pytest_configure(config):
    """Configure pytest with custom markers."""
    config.addinivalue_line("markers", "performance: mark test as performance test")
    config.addinivalue_line("markers", "stability: mark test for algorithm stability")
    config.addinivalue_line("markers", "correctness: mark test for algorithm correctness")
    config.addinivalue_line("markers", "regression: mark test for regression testing")

def pytest_collection_modifyitems(config, items):
    """Modify test collection based on command line options."""
    if not config.getoption("--run-performance"):
        skip_performance = pytest.mark.skip(reason="Need --run-performance option to run")
        for item in items:
            if "performance" in item.keywords:
                item.add_marker(skip_performance)
    
    algorithm_filter = config.getoption("--algorithm-filter")
    if algorithm_filter:
        skip_other_algorithms = pytest.mark.skip(reason=f"Not in algorithm filter: {algorithm_filter}")
        for item in items:
            if algorithm_filter.lower() not in item.name.lower():
                item.add_marker(skip_other_algorithms)


# ========== Custom Test Assertions ==========

class SortingAlgorithmAssertions:
    """Custom assertion methods for sorting algorithm tests."""
    
    @staticmethod
    def assert_correctly_sorted(result, original, message=None):
        """Assert that 'result' is a correctly sorted version of 'original'."""
        assert len(result) == len(original), f"Sorted result has different length than original: {len(result)} != {len(original)}"
        assert sorted(original) == sorted(result), f"Sorted result has different elements than original"
        assert AlgorithmTestBase.is_sorted(result), message or "Result is not sorted correctly"
    
    @staticmethod
    def assert_stable_sort(sort_fn, array, message=None):
        """Assert that sorting algorithm maintains the relative order of equal elements."""
        # Create array with stability markers
        marked_array = [(val, idx) for idx, val in enumerate(array)]
        
        # Sort using function under test
        sorted_array = sort_fn(marked_array.copy(), key=lambda x: x[0])
        
        # Check stability
        for i in range(1, len(sorted_array)):
            if sorted_array[i][0] == sorted_array[i-1][0]:
                assert sorted_array[i][1] > sorted_array[i-1][1], message or f"Unstable sort: Equal elements at indices {i-1} and {i} have wrong order"
    
    @staticmethod
    def assert_performance(sort_fn, array, max_time_seconds, message=None):
        """Assert that sorting algorithm completes within expected time."""
        start_time = time.time()
        sort_fn(array.copy())
        execution_time = time.time() - start_time
        
        assert execution_time <= max_time_seconds, message or f"Algorithm took {execution_time:.4f}s, which exceeds the limit of {max_time_seconds:.4f}s"


# Register custom assertions with pytest
pytest.register_assert_rewrite("SortingAlgorithmAssertions")


# Export configuration
__all__ = [
    'AlgorithmTestBase',
    'standard_test_arrays',
    'edge_case_arrays',
    'stability_test_arrays',
    'performance_test_arrays',
    'algorithm_test_util',
    'SortingAlgorithmAssertions'
]

# When run directly, print configuration info
if __name__ == "__main__":
    print("Sorting Algorithm Testing Configuration")
    print(f"Maximum array size: {MAX_ARRAY_SIZE}")
    print(f"Performance sample count: {PERFORMANCE_SAMPLE_COUNT}")
    print(f"Stability test size: {STABILITY_TEST_SIZE}")
    print("\nAvailable test fixtures:")
    fixture_list = [
        "standard_test_arrays", 
        "edge_case_arrays",
        "stability_test_arrays", 
        "performance_test_arrays",
        "algorithm_test_util"
    ]
    for fixture in fixture_list:
        print(f"  - {fixture}")
    
    print("\nTo run tests with performance benchmarks:")
    print("  pytest --run-performance")
    print("\nTo filter tests by algorithm:")
    print("  pytest --algorithm-filter=quicksort")
