#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Distribution Sort Test Suite

This module provides comprehensive testing for distribution-based sorting algorithms.
It verifies correctness, stability, performance characteristics, and edge cases
for counting sort, radix sort, bucket sort, and pigeonhole sort.

The test suite employs a rigorous methodology to validate both functional correctness
and algorithmic complexity assertions, using parameterized tests to evaluate
algorithm behavior across various input distributions and edge cases.

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

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

# Import sorting algorithms
from algorithms.distribution.counting_sort import CountingSort
from algorithms.distribution.radix_sort import RadixSort
from algorithms.distribution.bucket_sort import BucketSort
from algorithms.distribution.pigeonhole_sort import PigeonholeSort

# Import utility functions
from algorithms.core.base_algorithm import Algorithm


class DistributionSortTest(unittest.TestCase):
    """
    Comprehensive test suite for distribution-based sorting algorithms.
    
    This class provides extensive testing for all distribution sort implementations,
    with particular focus on validating their linear-time complexity characteristics
    and behavior under varied input distributions.
    """
    
    def setUp(self) -> None:
        """
        Initialize test environment and instantiate algorithm implementations.
        
        Creates instances of each distribution sort algorithm and prepares
        test data generators.
        """
        # Initialize algorithm instances with default options
        self.counting_sort = CountingSort()
        self.radix_sort = RadixSort()
        self.bucket_sort = BucketSort()
        self.pigeonhole_sort = PigeonholeSort()
        
        # Define algorithm mapping for parameterized tests
        self.algorithms = {
            "counting_sort": self.counting_sort,
            "radix_sort": self.radix_sort,
            "bucket_sort": self.bucket_sort,
            "pigeonhole_sort": self.pigeonhole_sort
        }
        
        # Set seed for reproducible tests
        random.seed(42)
        np.random.seed(42)
    
    def generate_test_arrays(self) -> Dict[str, List[int]]:
        """
        Generate diverse test arrays for comprehensive algorithm evaluation.
        
        Returns:
            Dict containing various test arrays categorized by their characteristics.
        """
        test_arrays = {
            "empty": [],
            "single": [42],
            "two_elements": [42, 17],
            "already_sorted": list(range(100)),
            "reverse_sorted": list(range(100, 0, -1)),
            "random_small": random.sample(range(1000), 100),
            "random_medium": random.sample(range(10000), 1000),
            "few_unique": [random.randint(1, 10) for _ in range(100)],
            "many_duplicates": [random.randint(1, 10) for _ in range(500)],
            "all_same": [7] * 100,
            "binary": [random.randint(0, 1) for _ in range(100)],
            "large_range": [random.randint(0, 10**6) for _ in range(100)],
            "small_range": [random.randint(0, 50) for _ in range(1000)],
            "alternating": [i % 2 for i in range(100)],
            "gaussian": np.random.normal(1000, 100, 200).astype(int).tolist(),
            "power_law": np.random.power(0.5, 100).astype(int).tolist(),
            "exponential": np.random.exponential(10, 100).astype(int).tolist()
        }
        
        # Ensure positive values for algorithms that require non-negative inputs
        for key in ["gaussian", "power_law", "exponential"]:
            test_arrays[key] = [max(0, x) for x in test_arrays[key]]
            
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
    
    def measure_execution_time(self, algorithm: Algorithm, array: List[int], 
                               repetitions: int = 3) -> float:
        """
        Measure execution time of an algorithm with statistical robustness.
        
        Args:
            algorithm: Algorithm instance to evaluate
            array: Input array to sort
            repetitions: Number of times to repeat sorting for reliable measurement
            
        Returns:
            float: Average execution time in seconds
        """
        times = []
        
        # Run multiple times to get stable measurements
        for _ in range(repetitions):
            array_copy = array.copy()
            
            start_time = time.time()
            algorithm.execute(array_copy)
            end_time = time.time()
            
            times.append(end_time - start_time)
            
        # Return average time
        return sum(times) / repetitions
    
    def test_basic_correctness(self) -> None:
        """
        Test basic correctness of all distribution sort implementations.
        
        Verifies that each algorithm correctly sorts various input arrays.
        """
        test_arrays = self.generate_test_arrays()
        
        for name, algorithm in self.algorithms.items():
            for array_name, array in test_arrays.items():
                # Skip empty arrays for algorithms that don't support them
                if array_name == "empty" and name in ["radix_sort"]:
                    continue
                    
                # Skip large range arrays for algorithms with range limitations
                if array_name == "large_range" and name in ["counting_sort", "pigeonhole_sort"]:
                    continue
                
                with self.subTest(algorithm=name, array=array_name):
                    original = array.copy()
                    result = algorithm.execute(array)
                    
                    # Verify sorting
                    self.assertTrue(
                        self.verify_sorted(original, result),
                        f"{name} failed to correctly sort {array_name} array"
                    )
    
    def test_algorithm_stability(self) -> None:
        """
        Test stability of distribution sort algorithms.
        
        Verifies that algorithms preserve the relative order of equal elements.
        """
        # Create array with duplicate values
        test_array = [(i % 10, i) for i in range(100)]
        
        # Dictionary noting which algorithms should be stable
        stability_expected = {
            "counting_sort": True,
            "radix_sort": True,
            "bucket_sort": True,  # Depends on implementation details
            "pigeonhole_sort": True
        }
        
        for name, algorithm in self.algorithms.items():
            # Skip if algorithm cannot sort objects
            if name in ["counting_sort", "pigeonhole_sort"]:
                continue
                
            with self.subTest(algorithm=name):
                # Modify algorithm to use custom comparison based on first element
                custom_options = {"key_function": lambda x: x[0]}
                
                # Create algorithm with custom options
                algorithm_instance = self.algorithms[name].__class__(custom_options)
                
                original = test_array.copy()
                result = algorithm_instance.execute(original)
                
                # Verify stability - equal elements should maintain their relative order
                for i in range(1, len(result)):
                    if result[i][0] == result[i-1][0]:
                        if stability_expected[name]:
                            self.assertLess(
                                result[i-1][1], 
                                result[i][1],
                                f"{name} is not stable: equal elements changed order"
                            )
    
    def test_linear_time_complexity(self) -> None:
        """
        Test the linear time complexity claims of distribution sort algorithms.
        
        Verifies that execution time scales linearly with input size for algorithms
        that promise O(n) or O(n+k) complexity.
        """
        # Algorithms and their expected time complexity factors
        complexity_factors = {
            "counting_sort": lambda n, k: n + k,  # O(n + k)
            "radix_sort": lambda n, d: n * d,     # O(d * n) where d is digit count
            "bucket_sort": lambda n, k: n,        # O(n) average case with good distribution
            "pigeonhole_sort": lambda n, k: n + k  # O(n + k)
        }
        
        # Generate test arrays of various sizes with controlled range
        sizes = [1000, 2000, 4000, 8000]
        range_max = 1000  # Keep range fixed to isolate size factor
        
        for name, algorithm in self.algorithms.items():
            execution_times = []
            
            for size in sizes:
                # Generate array with values in controlled range
                test_array = [random.randint(0, range_max) for _ in range(size)]
                
                # Measure execution time
                execution_time = self.measure_execution_time(algorithm, test_array)
                execution_times.append(execution_time)
                
            # Calculate digitcount for radix sort
            digits = int(math.log10(range_max)) + 1
                
            # Verify linear scaling by comparing ratios of time to size
            # We validate that time increases approximately linearly with theoretical complexity
            for i in range(1, len(sizes)):
                expected_ratio = complexity_factors[name](sizes[i], range_max) / \
                                 complexity_factors[name](sizes[i-1], range_max)
                                 
                actual_ratio = execution_times[i] / execution_times[i-1]
                
                # Allow for some variation due to system overhead and measurement error
                self.assertLess(
                    abs(actual_ratio - expected_ratio),
                    0.5,  # Tolerance factor
                    f"{name} does not exhibit expected time complexity scaling"
                )
    
    def test_edge_cases(self) -> None:
        """
        Test algorithm behavior on edge cases like empty arrays and large ranges.
        
        Verifies that algorithms handle extreme inputs correctly and gracefully.
        """
        # Test empty array
        for name, algorithm in self.algorithms.items():
            # Some algorithms may not support empty arrays
            if name in ["radix_sort"]:
                continue
                
            with self.subTest(algorithm=name, case="empty_array"):
                result = algorithm.execute([])
                self.assertEqual([], result, f"{name} failed on empty array")
        
        # Test single element array
        for name, algorithm in self.algorithms.items():
            with self.subTest(algorithm=name, case="single_element"):
                result = algorithm.execute([42])
                self.assertEqual([42], result, f"{name} failed on single element array")
        
        # Test all identical elements
        for name, algorithm in self.algorithms.items():
            with self.subTest(algorithm=name, case="identical_elements"):
                test_array = [7] * 100
                result = algorithm.execute(test_array)
                self.assertEqual(test_array, result, f"{name} failed on array with identical elements")
    
    def test_specific_algorithm_behavior(self) -> None:
        """
        Test algorithm-specific behaviors and limitations.
        
        Validates special characteristics and constraints of each algorithm.
        """
        # Test counting sort with negative numbers (should fail or handle specially)
        with self.subTest(algorithm="counting_sort", case="negative_numbers"):
            # Some implementations may forbid negative numbers
            try:
                result = self.counting_sort.execute([-5, 10, -3, 7, 0])
                expected = [-5, -3, 0, 7, 10]
                self.assertEqual(expected, result, "Counting sort incorrect with negative numbers")
            except ValueError:
                # This is acceptable if the implementation doesn't support negative numbers
                pass
                
        # Test radix sort with different bases
        with self.subTest(algorithm="radix_sort", case="different_bases"):
            test_array = [random.randint(0, 1000) for _ in range(100)]
            
            # Compare results with different bases
            radix_sort_base10 = RadixSort({"radix": 10})
            radix_sort_base4 = RadixSort({"radix": 4})
            
            result_base10 = radix_sort_base10.execute(test_array.copy())
            result_base4 = radix_sort_base4.execute(test_array.copy())
            
            # Both should produce identical sorted results
            self.assertEqual(result_base10, result_base4, 
                             "Radix sort gives different results with different bases")
        
        # Test bucket sort with different bucket counts
        with self.subTest(algorithm="bucket_sort", case="bucket_counts"):
            test_array = [random.random() for _ in range(1000)]  # Use [0,1) values
            
            bucket_sort_10 = BucketSort({"bucket_count": 10})
            bucket_sort_100 = BucketSort({"bucket_count": 100})
            
            result_10 = bucket_sort_10.execute(test_array.copy())
            result_100 = bucket_sort_100.execute(test_array.copy())
            
            # Verify both produce correctly sorted arrays
            self.assertTrue(self.verify_sorted(test_array, result_10))
            self.assertTrue(self.verify_sorted(test_array, result_100))
            
            # More buckets should generally be faster for uniformly distributed data
            # Measure execution time with each
            time_10 = self.measure_execution_time(bucket_sort_10, test_array)
            time_100 = self.measure_execution_time(bucket_sort_100, test_array)
            
            # This assertion may not always hold due to overhead,
            # but for sufficiently large datasets it should
            if len(test_array) >= 1000:
                self.assertLessEqual(time_100, time_10 * 1.2,
                                    "More buckets did not improve performance for uniform data")

    def test_metrics_collection(self) -> None:
        """
        Test that algorithms properly collect performance metrics.
        
        Verifies the instrumentation system correctly tracks operations.
        """
        test_array = [random.randint(0, 100) for _ in range(100)]
        
        for name, algorithm in self.algorithms.items():
            with self.subTest(algorithm=name):
                # Execute algorithm and check metrics
                algorithm.execute(test_array.copy())
                
                # Verify metrics existence
                self.assertIsNotNone(algorithm.metrics)
                
                # Specific metrics that should be present
                essential_metrics = ["execution_time", "memory_accesses"]
                for metric in essential_metrics:
                    self.assertIn(metric, algorithm.metrics,
                                 f"{name} did not collect '{metric}' metric")
                
                # Verify execution time is reasonable (positive and not too large)
                self.assertGreater(algorithm.metrics["execution_time"], 0,
                                  f"{name} reported non-positive execution time")
                self.assertLess(algorithm.metrics["execution_time"], 10,
                               f"{name} took unreasonably long time")


if __name__ == "__main__":
    unittest.main()
