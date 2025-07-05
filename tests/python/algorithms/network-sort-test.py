#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Network Sort Test Suite

This module provides comprehensive testing for network and parallel sorting algorithms.
It verifies correctness, parallelizability, step complexity, and theoretical properties
of bitonic sort, odd-even merge sort, and other network-based sorting algorithms.

The test suite employs a specialized methodology to validate both functional correctness
and the network structure properties, including the zero-one principle validation
and network depth analysis.

Author: Advanced Sorting Algorithm Visualization Project
"""

import unittest
import random
import time
import math
import numpy as np
from typing import List, Callable, Dict, Any, Tuple, Type
from pathlib import Path
import sys
import itertools

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

# Import sorting algorithms
from algorithms.network.bitonic_sort import BitonicSort
from algorithms.network.odd_even_merge_sort import OddEvenMergeSort

# Import utility functions
from algorithms.core.base_algorithm import Algorithm


class NetworkSortTest(unittest.TestCase):
    """
    Comprehensive test suite for network and parallel sorting algorithms.
    
    This class provides extensive testing for network-based sorting implementations,
    with particular focus on validating their parallel properties, network depth,
    and conformance to the zero-one principle.
    """
    
    def setUp(self) -> None:
        """
        Initialize test environment and instantiate algorithm implementations.
        
        Creates instances of each network sort algorithm and prepares
        test data generators.
        """
        # Initialize algorithm instances with default options
        self.bitonic_sort = BitonicSort()
        self.odd_even_merge_sort = OddEvenMergeSort()
        
        # Define algorithm mapping for parameterized tests
        self.algorithms = {
            "bitonic_sort": self.bitonic_sort,
            "odd_even_merge_sort": self.odd_even_merge_sort
        }
        
        # Set seed for reproducible tests
        random.seed(42)
        np.random.seed(42)
    
    def generate_test_arrays(self) -> Dict[str, List[int]]:
        """
        Generate diverse test arrays for comprehensive algorithm evaluation.
        
        Returns:
            Dict containing various test arrays categorized by their characteristics,
            specifically crafted to test network sort properties.
        """
        test_arrays = {
            "empty": [],
            "single": [42],
            "two_elements": [42, 17],
            "power_of_two": [random.randint(0, 1000) for _ in range(64)],  # 2^6
            "non_power_of_two": [random.randint(0, 1000) for _ in range(100)],
            "already_sorted": list(range(32)),
            "reverse_sorted": list(range(32, 0, -1)),
            "binary": [random.randint(0, 1) for _ in range(64)],  # For zero-one principle
            "all_same": [7] * 32,
            "alternating": [i % 2 for i in range(64)],  # Good for testing network properties
            "power_of_two_large": [random.randint(0, 1000) for _ in range(256)]  # 2^8
        }
            
        return test_arrays
    
    def verify_sorted(self, original: List[int], sorted_array: List[int]) -> bool:
        """
        Verify that an array is correctly sorted and contains all original elements.
        
        Args:
            original: The original unsorted array
            sorted_array: The supposedly sorted array
            
        Returns:
            bool: True if array is correctly sorted and contains all original elements
        """
        # Check length
        if len(original) != len(sorted_array):
            return False
            
        # Check if sorted
        for i in range(1, len(sorted_array)):
            if sorted_array[i] < sorted_array[i-1]:
                return False
                
        # Check if same elements (use frequency count for efficiency)
        from collections import Counter
        return Counter(original) == Counter(sorted_array)
    
    def generate_all_binary_arrays(self, length: int) -> List[List[int]]:
        """
        Generate all possible binary arrays of a given length.
        
        This is used for exhaustive testing of the zero-one principle
        for small array sizes.
        
        Args:
            length: Length of binary arrays to generate
            
        Returns:
            List of all possible binary arrays of the given length
        """
        return [list(seq) for seq in itertools.product([0, 1], repeat=length)]
    
    def test_basic_correctness(self) -> None:
        """
        Test basic correctness of all network sort implementations.
        
        Verifies that each algorithm correctly sorts various input arrays.
        """
        test_arrays = self.generate_test_arrays()
        
        for name, algorithm in self.algorithms.items():
            for array_name, array in test_arrays.items():
                # Skip empty arrays as network sorts typically require non-empty arrays
                if array_name == "empty":
                    continue
                    
                with self.subTest(algorithm=name, array=array_name):
                    original = array.copy()
                    result = algorithm.execute(array)
                    
                    # Verify sorting
                    self.assertTrue(
                        self.verify_sorted(original, result),
                        f"{name} failed to correctly sort {array_name} array"
                    )
    
    def test_zero_one_principle(self) -> None:
        """
        Test the zero-one principle for network sorting algorithms.
        
        The zero-one principle states that a sorting network is correct if and
        only if it correctly sorts all sequences of 0s and 1s. This test validates
        this property for small array sizes.
        """
        # Test with small arrays to make exhaustive testing feasible
        for size in [2, 4, 8]:  # Powers of 2 for network sorts
            # Generate all possible binary arrays of the given size
            binary_arrays = self.generate_all_binary_arrays(size)
            
            for name, algorithm in self.algorithms.items():
                with self.subTest(algorithm=name, size=size):
                    # Test each binary array
                    for array in binary_arrays:
                        original = array.copy()
                        result = algorithm.execute(original)
                        
                        # Verify sorting
                        self.assertTrue(
                            self.verify_sorted(original, result),
                            f"{name} failed to sort binary array {original}"
                        )
    
    def test_network_depth(self) -> None:
        """
        Test the theoretical network depth properties of sorting networks.
        
        Verifies that algorithms maintain their expected step complexity
        by analyzing the parallelize-able steps in their operation counts.
        """
        # Theoretical network depths for each algorithm
        # O(log^2 n) for bitonic sort, where n is a power of 2
        # O(log^2 n) for odd-even merge sort as well
        expected_depth_complexity = {
            "bitonic_sort": lambda n: (math.log2(n) * (math.log2(n) + 1)) / 2,
            "odd_even_merge_sort": lambda n: math.log2(n) * (math.log2(n) + 1) / 2
        }
        
        # Test with different power-of-2 sizes
        for size in [8, 16, 32, 64]:
            test_array = [random.randint(0, 1000) for _ in range(size)]
            
            for name, algorithm in self.algorithms.items():
                with self.subTest(algorithm=name, size=size):
                    # Reset metrics
                    algorithm.reset()
                    
                    # Execute algorithm
                    algorithm.execute(test_array.copy())
                    
                    # Check if metrics for parallel steps are collected
                    if hasattr(algorithm, 'metrics') and 'network_depth' in algorithm.metrics:
                        actual_depth = algorithm.metrics['network_depth']
                        theoretical_depth = expected_depth_complexity[name](size)
                        
                        # Network depth should be proportional to theoretical complexity
                        # Allow for implementation-specific constants
                        self.assertLessEqual(
                            actual_depth,
                            theoretical_depth * 2,  # Allow some leeway for implementation details
                            f"{name} network depth exceeds theoretical bound"
                        )
    
    def test_power_of_two_handling(self) -> None:
        """
        Test how algorithms handle non-power-of-two array sizes.
        
        Network sorts are typically designed for arrays with lengths that are
        powers of 2. This test verifies correct handling of other array sizes.
        """
        non_power_of_two_sizes = [3, 5, 10, 15, 100]
        
        for size in non_power_of_two_sizes:
            test_array = [random.randint(0, 1000) for _ in range(size)]
            
            for name, algorithm in self.algorithms.items():
                with self.subTest(algorithm=name, size=size):
                    # Try sorting the array
                    try:
                        result = algorithm.execute(test_array.copy())
                        
                        # If it succeeds, verify the result is sorted
                        self.assertTrue(
                            self.verify_sorted(test_array, result),
                            f"{name} incorrectly sorted non-power-of-two array of size {size}"
                        )
                    except Exception as e:
                        # Some implementations might explicitly reject non-power-of-two sizes
                        # If so, check that the error message mentions this limitation
                        self.assertIn(
                            "power of two" or "power-of-two" or "power of 2" or "size",
                            str(e).lower(),
                            f"{name} failed on non-power-of-two array with unhelpful error: {e}"
                        )
    
    def test_operation_count(self) -> None:
        """
        Test that operation counts match theoretical expectations.
        
        Verifies that the number of comparisons and swaps aligns with
        the theoretical bounds for each network sorting algorithm.
        """
        # Theoretical bounds for comparison and swap counts
        # These are expressed as asymptotic bounds; the actual constants
        # may vary based on implementation details
        expected_comparisons = {
            "bitonic_sort": lambda n: n * math.log2(n) * (math.log2(n) + 1) / 4,
            "odd_even_merge_sort": lambda n: n * math.log2(n) * (math.log2(n) + 1) / 4
        }
        
        # Test with power-of-2 sizes to match the algorithms' design
        for size in [8, 16, 32, 64]:
            test_array = [random.randint(0, 1000) for _ in range(size)]
            
            for name, algorithm in self.algorithms.items():
                with self.subTest(algorithm=name, size=size):
                    # Reset metrics
                    algorithm.reset()
                    
                    # Execute algorithm
                    algorithm.execute(test_array.copy())
                    
                    # Check comparison count
                    theoretical_comparisons = expected_comparisons[name](size)
                    actual_comparisons = algorithm.metrics['comparisons']
                    
                    # Comparison count should be proportional to theoretical expectation
                    # Allow for implementation-specific constants and small variations
                    self.assertLessEqual(
                        actual_comparisons,
                        theoretical_comparisons * 3,  # Allow leeway for implementation details
                        f"{name} made more comparisons than theoretical expectation"
                    )
                    
                    # In a proper network sort, comparison count and swap count are related
                    # Network sorts typically perform a comparison-conditional swap as an atomic operation
                    self.assertLessEqual(
                        algorithm.metrics['swaps'],
                        algorithm.metrics['comparisons'],
                        f"{name} performed more swaps than comparisons, which is unusual for network sorts"
                    )
    
    def test_parallel_step_recording(self) -> None:
        """
        Test that algorithms properly record parallel step information.
        
        For network sorts, operations within the same network level can be
        performed in parallel. This test verifies that this information is
        correctly tracked in the algorithm's history.
        """
        # Use a small array for detailed history analysis
        test_array = [random.randint(0, 100) for _ in range(16)]
        
        for name, algorithm in self.algorithms.items():
            with self.subTest(algorithm=name):
                # Execute algorithm
                algorithm.execute(test_array.copy())
                
                # Check if history includes parallel step information
                has_parallel_info = False
                for step in algorithm.history:
                    if 'parallel_level' in step or 'network_level' in step:
                        has_parallel_info = True
                        break
                
                # Most network sort implementations should track parallelism information
                self.assertTrue(
                    has_parallel_info,
                    f"{name} does not record parallel execution information in its history"
                )
    
    def test_determinism(self) -> None:
        """
        Test that the algorithms are deterministic.
        
        Verifies that repeated executions with the same input produce identical results
        and operation sequences.
        """
        # Use a fixed test array
        test_array = [random.randint(0, 100) for _ in range(32)]
        
        for name, algorithm in self.algorithms.items():
            with self.subTest(algorithm=name):
                # First execution
                algorithm.reset()
                result1 = algorithm.execute(test_array.copy())
                history1 = algorithm.history.copy()
                metrics1 = algorithm.metrics.copy()
                
                # Second execution
                algorithm.reset()
                result2 = algorithm.execute(test_array.copy())
                history2 = algorithm.history.copy()
                metrics2 = algorithm.metrics.copy()
                
                # Results should be identical
                self.assertEqual(result1, result2, f"{name} produced different results on identical inputs")
                
                # Metrics should be identical
                for key in metrics1:
                    if key not in ['start_time', 'end_time', 'execution_time']:  # Timing may vary slightly
                        self.assertEqual(
                            metrics1[key],
                            metrics2[key],
                            f"{name} had different '{key}' count on identical inputs"
                        )
                
                # History steps should match (except for timestamps)
                self.assertEqual(
                    len(history1),
                    len(history2),
                    f"{name} produced different number of history steps on identical inputs"
                )


if __name__ == "__main__":
    unittest.main()
