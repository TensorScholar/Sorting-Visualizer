#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Selection Algorithm Test Suite

This module provides comprehensive testing for selection algorithms,
including QuickSelect and Median of Medians. It verifies correctness,
performance characteristics, and the theoretical guarantees specific
to these algorithms.

The test suite validates both the functional behavior (finding the
correct k-th element) and the algorithmic complexity, with particular
attention to worst-case guarantees for deterministic selection
algorithms.

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
import statistics
import copy

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

# Import selection algorithms
from algorithms.selection.quick_select import QuickSelect
from algorithms.selection.median_of_medians import MedianOfMedians

# Import utility functions
from algorithms.core.base_algorithm import Algorithm


class SelectionAlgorithmTest(unittest.TestCase):
    """
    Comprehensive test suite for selection algorithms.
    
    This class provides extensive testing for algorithms that find the k-th
    smallest element in an array, with focus on validating complexity bounds
    and correctness across diverse inputs.
    """
    
    def setUp(self) -> None:
        """
        Initialize test environment and instantiate algorithm implementations.
        
        Creates instances of each selection algorithm and prepares
        test data generators.
        """
        # Initialize algorithm instances with default options
        self.quick_select = QuickSelect()
        self.median_of_medians = MedianOfMedians()
        
        # Define algorithm mapping for parameterized tests
        self.algorithms = {
            "quick_select": self.quick_select,
            "median_of_medians": self.median_of_medians
        }
        
        # Define which algorithms have guaranteed worst-case complexity
        self.deterministic_algorithms = ["median_of_medians"]
        
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
            "three_elements": [42, 17, 30],
            "small_random": [random.randint(0, 100) for _ in range(10)],
            "medium_random": [random.randint(0, 1000) for _ in range(100)],
            "large_random": [random.randint(0, 10000) for _ in range(1000)],
            "already_sorted": list(range(100)),
            "reverse_sorted": list(range(100, 0, -1)),
            "mostly_sorted": list(range(100)),  # Will be perturbed in specific tests
            "few_unique": [random.randint(1, 10) for _ in range(100)],
            "many_duplicates": [random.randint(1, 10) for _ in range(500)],
            "all_same": [7] * 100,
            "adversarial": [x for x in range(100)]  # Will be rearranged in specific tests
        }
            
        return test_arrays
    
    def find_kth_element_naive(self, array: List[int], k: int) -> int:
        """
        Find the k-th smallest element using a simple sorting approach.
        
        This is used as a reference implementation to validate results
        from the tested algorithms.
        
        Args:
            array: Input array
            k: The k value (0-indexed)
            
        Returns:
            The k-th smallest element
        """
        if not array or k < 0 or k >= len(array):
            raise ValueError("Invalid array or k value")
        
        # Sort and return the k-th element
        sorted_array = sorted(array)
        return sorted_array[k]
    
    def measure_execution_time(self, algorithm: Algorithm, array: List[int], 
                               k: int, repetitions: int = 3) -> float:
        """
        Measure execution time of a selection algorithm with statistical robustness.
        
        Args:
            algorithm: Algorithm instance to evaluate
            array: Input array
            k: The k value to find
            repetitions: Number of times to repeat for reliable measurement
            
        Returns:
            float: Average execution time in seconds
        """
        times = []
        
        # Run multiple times to get stable measurements
        for _ in range(repetitions):
            array_copy = array.copy()
            
            start_time = time.time()
            algorithm.select(array_copy, k)
            end_time = time.time()
            
            times.append(end_time - start_time)
            
        # Return average time
        return sum(times) / repetitions
    
    def create_adversarial_quickselect(self, size: int) -> List[int]:
        """
        Create an adversarial array for QuickSelect.
        
        This constructs an array that forces QuickSelect to degenerate
        to worst-case O(n²) behavior when using the first or last element
        as pivot.
        
        Args:
            size: Size of the array to create
            
        Returns:
            An array designed to induce worst-case behavior in QuickSelect
        """
        # For simplicty, create a reverse-sorted array
        # This is worst-case for QuickSelect with first element as pivot
        return list(range(size, 0, -1))
    
    def test_basic_correctness(self) -> None:
        """
        Test basic correctness of all selection algorithm implementations.
        
        Verifies that each algorithm correctly finds the k-th smallest
        element in various input arrays.
        """
        test_arrays = self.generate_test_arrays()
        
        for name, algorithm in self.algorithms.items():
            for array_name, array in test_arrays.items():
                # Skip empty arrays
                if array_name == "empty":
                    continue
                
                # Try different k values
                k_values = [0]  # Minimum element
                
                if len(array) > 1:
                    k_values.extend([
                        len(array) // 2,  # Median
                        len(array) - 1    # Maximum element
                    ])
                    
                    # Also try a few random positions if array is large enough
                    if len(array) >= 10:
                        k_values.extend([
                            random.randint(1, len(array) // 4),
                            random.randint(3 * len(array) // 4, len(array) - 2)
                        ])
                
                for k in k_values:
                    with self.subTest(algorithm=name, array=array_name, k=k):
                        original = array.copy()
                        
                        # Find expected result using naive approach
                        expected = self.find_kth_element_naive(original, k)
                        
                        # Find result using the algorithm
                        result = algorithm.select(original.copy(), k)
                        
                        # Verify correctness
                        self.assertEqual(
                            expected,
                            result,
                            f"{name} returned incorrect element for k={k} in {array_name} array"
                        )
    
    def test_array_preservation(self) -> None:
        """
        Test that algorithms preserve the input array's elements.
        
        Selection algorithms may rearrange elements but should not
        add or remove elements from the array.
        """
        test_arrays = self.generate_test_arrays()
        
        for name, algorithm in self.algorithms.items():
            for array_name, array in test_arrays.items():
                # Skip empty arrays
                if array_name == "empty":
                    continue
                    
                # Try median if array has sufficient elements
                k = len(array) // 2 if len(array) > 2 else 0
                
                with self.subTest(algorithm=name, array=array_name, k=k):
                    original = array.copy()
                    work_array = array.copy()
                    
                    # Execute algorithm
                    algorithm.select(work_array, k)
                    
                    # Verify array elements are preserved (may be rearranged)
                    from collections import Counter
                    self.assertEqual(
                        Counter(original),
                        Counter(work_array),
                        f"{name} modified the elements in the array"
                    )
    
    def test_linear_time_complexity(self) -> None:
        """
        Test the linear time complexity claims of selection algorithms.
        
        Verifies that execution time scales linearly with input size,
        particularly for algorithms with guaranteed worst-case bounds.
        """
        # Test with various array sizes
        sizes = [1000, 2000, 4000, 8000]
        
        for name, algorithm in self.algorithms.items():
            execution_times = []
            
            for size in sizes:
                # Generate random array
                test_array = [random.randint(0, 10000) for _ in range(size)]
                
                # Find median
                k = size // 2
                
                # Measure execution time
                execution_time = self.measure_execution_time(algorithm, test_array, k)
                execution_times.append(execution_time)
                
            # Verify linear scaling by comparing ratios of time to size
            for i in range(1, len(sizes)):
                size_ratio = sizes[i] / sizes[i-1]
                time_ratio = execution_times[i] / execution_times[i-1]
                
                # For deterministic algorithms, strictly check linear scaling
                if name in self.deterministic_algorithms:
                    self.assertLess(
                        time_ratio,
                        size_ratio * 1.5,  # Allow some leeway
                        f"{name} does not exhibit expected linear time complexity"
                    )
                else:
                    # For randomized algorithms, be more lenient with average case
                    self.assertLess(
                        time_ratio,
                        size_ratio * 2.5,  # Much more leeway for randomized algorithms
                        f"{name} shows worse than expected average time complexity"
                    )
    
    def test_worst_case_behavior(self) -> None:
        """
        Test algorithm behavior on adversarial inputs designed to
        trigger worst-case performance.
        
        Verifies that deterministic algorithms maintain their complexity
        guarantees even on adversarial inputs.
        """
        # Test with various array sizes
        sizes = [100, 200, 400]
        
        for name, algorithm in self.algorithms.items():
            execution_times = []
            
            for size in sizes:
                # Generate adversarial array
                test_array = self.create_adversarial_quickselect(size)
                
                # Find median
                k = size // 2
                
                # Measure execution time
                execution_time = self.measure_execution_time(algorithm, test_array, k)
                execution_times.append(execution_time)
                
            # Verify scaling on adversarial inputs
            for i in range(1, len(sizes)):
                size_ratio = sizes[i] / sizes[i-1]
                time_ratio = execution_times[i] / execution_times[i-1]
                
                # For deterministic algorithms, should still maintain linear time
                if name in self.deterministic_algorithms:
                    self.assertLess(
                        time_ratio,
                        size_ratio * 2.0,  # Allow more leeway for adversarial inputs
                        f"{name} failed to maintain complexity bound on adversarial input"
                    )
                else:
                    # QuickSelect can degenerate to O(n²) on adversarial inputs
                    # so we don't assert anything about its performance here
                    pass
    
    def test_median_finding(self) -> None:
        """
        Test efficiency of algorithms when specifically finding medians.
        
        Finding the median is a common use case for selection algorithms,
        so this test focuses on this specific scenario.
        """
        # Test with different array types that are challenging for median finding
        test_arrays = {
            "random": [random.randint(0, 10000) for _ in range(1000)],
            "bimodal": sorted([random.randint(0, 100) for _ in range(500)] + 
                             [random.randint(900, 1000) for _ in range(500)]),
            "almost_sorted": sorted([random.randint(0, 10000) for _ in range(1000)])
        }
        
        # Perturb the almost_sorted array slightly
        for _ in range(50):
            i, j = random.sample(range(1000), 2)
            test_arrays["almost_sorted"][i], test_arrays["almost_sorted"][j] = \
                test_arrays["almost_sorted"][j], test_arrays["almost_sorted"][i]
        
        for array_name, array in test_arrays.items():
            # Find the true median using sorting
            true_median = sorted(array)[len(array) // 2]
            
            for name, algorithm in self.algorithms.items():
                with self.subTest(algorithm=name, array=array_name):
                    # Reset metrics
                    algorithm.reset()
                    
                    # Find median
                    result = algorithm.select(array.copy(), len(array) // 2)
                    
                    # Verify correct median
                    self.assertEqual(
                        true_median,
                        result,
                        f"{name} found incorrect median for {array_name} array"
                    )
                    
                    # Check operation metrics for median finding
                    self.assertIn("comparisons", algorithm.metrics)
                    self.assertLessEqual(
                        algorithm.metrics["comparisons"],
                        len(array) * math.log2(len(array)) * 2,  # Liberal upper bound
                        f"{name} used excessive comparisons for median finding"
                    )
    
    def test_rearrangement_correctness(self) -> None:
        """
        Test that algorithms correctly partition the array around the kth element.
        
        Selection algorithms should rearrange the array such that elements
        smaller than the kth element are before it, and larger elements after it.
        """
        test_array = [random.randint(0, 1000) for _ in range(100)]
        
        for name, algorithm in self.algorithms.items():
            with self.subTest(algorithm=name):
                # Try different k values
                for k in [10, 50, 90]:
                    array_copy = test_array.copy()
                    
                    # Find kth element
                    result = algorithm.select(array_copy, k)
                    
                    # Verify partitioning
                    for i in range(len(array_copy)):
                        if i < k:
                            self.assertLessEqual(
                                array_copy[i],
                                result,
                                f"{name} left elements greater than kth element before position k"
                            )
                        elif i > k:
                            self.assertGreaterEqual(
                                array_copy[i],
                                result,
                                f"{name} left elements smaller than kth element after position k"
                            )
                        else:  # i == k
                            self.assertEqual(
                                array_copy[i],
                                result,
                                f"{name} did not place kth element at position k"
                            )
    
    def test_validation_and_error_handling(self) -> None:
        """
        Test how algorithms handle invalid inputs and edge cases.
        
        Verifies correct error handling for out-of-bounds k values
        and empty arrays.
        """
        # Test with empty array
        for name, algorithm in self.algorithms.items():
            with self.subTest(algorithm=name, case="empty_array"):
                # Selection on empty array should raise an error
                with self.assertRaises(Exception):
                    algorithm.select([], 0)
        
        # Test with out-of-bounds k values
        test_array = [1, 2, 3, 4, 5]
        
        for name, algorithm in self.algorithms.items():
            # Test k < 0
            with self.subTest(algorithm=name, case="negative_k"):
                with self.assertRaises(Exception):
                    algorithm.select(test_array.copy(), -1)
            
            # Test k >= len(array)
            with self.subTest(algorithm=name, case="k_too_large"):
                with self.assertRaises(Exception):
                    algorithm.select(test_array.copy(), len(test_array))
    
    def test_median_of_medians_specifics(self) -> None:
        """
        Test specific properties of the Median of Medians algorithm.
        
        Verifies that the algorithm correctly implements the pivoting
        strategy that guarantees linear worst-case time complexity.
        """
        # Skip if MedianOfMedians is not available
        if "median_of_medians" not in self.algorithms:
            self.skipTest("MedianOfMedians algorithm not available")
        
        # Create a sufficiently large array to test pivot selection
        test_array = [random.randint(0, 10000) for _ in range(200)]
        
        # Reset metrics and history
        self.median_of_medians.reset()
        
        # Execute median finding
        k = len(test_array) // 2
        self.median_of_medians.select(test_array.copy(), k)
        
        # Check if the algorithm records pivot selections
        pivot_selections = [
            step for step in self.median_of_medians.history
            if step.get("type") == "pivot_selection" or
               step.get("type") == "median_of_medians"
        ]
        
        # Should have at least one pivot selection step
        self.assertGreater(
            len(pivot_selections),
            0,
            "MedianOfMedians does not record pivot selection steps"
        )
        
        # Check for group formation in history
        group_formations = [
            step for step in self.median_of_medians.history
            if step.get("type") == "group_formation" or
               "groups" in step
        ]
        
        # Should track group formation
        self.assertGreater(
            len(group_formations),
            0,
            "MedianOfMedians does not record group formation steps"
        )
        
        # Verify group size - standard implementation uses groups of 5
        if len(group_formations) > 0 and "groups" in group_formations[0]:
            groups = group_formations[0]["groups"]
            
            # Most groups should be of the expected size (typically 5)
            if len(groups) > 1:  # Need multiple groups to check size pattern
                group_sizes = [len(group) for group in groups]
                most_common_size = max(set(group_sizes), key=group_sizes.count)
                
                # The algorithm should use a consistent group size except possibly for the last group
                consistent_sizes = sum(1 for size in group_sizes if size == most_common_size)
                
                self.assertGreater(
                    consistent_sizes / len(group_sizes),
                    0.7,  # At least 70% of groups should have the standard size
                    f"MedianOfMedians uses inconsistent group sizes: {group_sizes}"
                )
    
    def test_quick_select_specifics(self) -> None:
        """
        Test specific properties of the QuickSelect algorithm.
        
        Verifies that the algorithm implements an efficient pivoting
        strategy for good average-case performance.
        """
        # Skip if QuickSelect is not available
        if "quick_select" not in self.algorithms:
            self.skipTest("QuickSelect algorithm not available")
        
        # Create a sufficiently large array to test pivot selection
        test_array = [random.randint(0, 10000) for _ in range(200)]
        
        # Reset metrics and history
        self.quick_select.reset()
        
        # Execute median finding
        k = len(test_array) // 2
        self.quick_select.select(test_array.copy(), k)
        
        # Check if the algorithm records pivot selections
        pivot_selections = [
            step for step in self.quick_select.history
            if step.get("type") == "pivot_selection"
        ]
        
        # Should have at least one pivot selection step
        self.assertGreater(
            len(pivot_selections),
            0,
            "QuickSelect does not record pivot selection steps"
        )
        
        # Check for partitioning in history
        partitioning_steps = [
            step for step in self.quick_select.history
            if step.get("type") == "partition" or
               step.get("type") == "partitioning"
        ]
        
        # Should track partitioning
        self.assertGreater(
            len(partitioning_steps),
            0,
            "QuickSelect does not record partitioning steps"
        )
        
        # Examine metrics for QuickSelect
        # Should record recursive calls
        self.assertIn(
            "recursive_calls",
            self.quick_select.metrics,
            "QuickSelect does not track recursive_calls metric"
        )
        
        # Number of recursive calls should be reasonable
        # For median finding in array of size n, expect O(log n) calls on average
        self.assertLessEqual(
            self.quick_select.metrics["recursive_calls"],
            2 * math.log2(len(test_array)),  # Allow generous bound
            "QuickSelect made excessive recursive calls"
        )
    
    def test_metrics_collection(self) -> None:
        """
        Test that algorithms properly collect performance metrics.
        
        Verifies the instrumentation system correctly tracks operations
        specific to selection algorithms.
        """
        test_array = [random.randint(0, 100) for _ in range(100)]
        k = len(test_array) // 2
        
        for name, algorithm in self.algorithms.items():
            with self.subTest(algorithm=name):
                # Reset metrics
                algorithm.reset()
                
                # Execute algorithm
                algorithm.select(test_array.copy(), k)
                
                # Verify essential metrics are collected
                essential_metrics = ["comparisons", "swaps", "execution_time"]
                for metric in essential_metrics:
                    self.assertIn(
                        metric,
                        algorithm.metrics,
                        f"{name} does not collect '{metric}' metric"
                    )
                
                # All metrics should have reasonable values
                self.assertGreater(
                    algorithm.metrics["comparisons"],
                    0,
                    f"{name} reported zero comparisons"
                )
                
                self.assertGreaterEqual(
                    algorithm.metrics["swaps"],
                    0,
                    f"{name} reported negative swaps"
                )
                
                self.assertGreater(
                    algorithm.metrics["execution_time"],
                    0,
                    f"{name} reported non-positive execution time"
                )


if __name__ == "__main__":
    unittest.main()
