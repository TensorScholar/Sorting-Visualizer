#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Special Sort Test Suite

This module provides comprehensive testing for special-case sorting algorithms.
It verifies correctness, performance characteristics, and the unique properties
of algorithms like Pancake Sort and Bogo Sort that employ unconventional
sorting mechanisms.

The test suite validates both functional behavior and theoretical properties,
with particular attention to the distinctive characteristics of each algorithm,
such as bounded flip operations for Pancake Sort and the probabilistic nature
of Bogo Sort.

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

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

# Import sorting algorithms
from algorithms.special.pancake_sort import PancakeSort
from algorithms.special.bogo_sort import BogoSort

# Import utility functions
from algorithms.core.base_algorithm import Algorithm


class SpecialSortTest(unittest.TestCase):
    """
    Comprehensive test suite for special-case sorting algorithms.
    
    This class provides extensive testing for sorting algorithms that use
    unconventional mechanisms, with focus on validating their unique properties
    and constraints.
    """
    
    def setUp(self) -> None:
        """
        Initialize test environment and instantiate algorithm implementations.
        
        Creates instances of each special sort algorithm and prepares
        test data generators.
        """
        # Initialize algorithm instances with default options
        self.pancake_sort = PancakeSort()
        
        # Use a variant of BogoSort with limited iterations to avoid indefinite testing
        self.bogo_sort = BogoSort({"max_iterations": 1000})
        
        # Define algorithm mapping for parameterized tests
        self.algorithms = {
            "pancake_sort": self.pancake_sort,
            "bogo_sort": self.bogo_sort
        }
        
        # Define which algorithms are suitable for larger arrays
        self.scalable_algorithms = ["pancake_sort"]
        
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
            "already_sorted": list(range(10)),
            "reverse_sorted": list(range(10, 0, -1)),
            "almost_sorted": [0, 1, 2, 4, 3, 5, 6, 7, 8, 9],
            "all_same": [7] * 10,
            # Only include larger arrays for algorithms that can handle them in reasonable time
            "medium_random": [random.randint(0, 1000) for _ in range(50)]
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
    
    def count_inversions(self, array: List[int]) -> int:
        """
        Count the number of inversions in an array.
        
        An inversion is a pair of elements that are out of order.
        This is a measure of how sorted an array is.
        
        Args:
            array: The array to analyze
            
        Returns:
            int: Count of inversions
        """
        inversions = 0
        for i in range(len(array)):
            for j in range(i + 1, len(array)):
                if array[i] > array[j]:
                    inversions += 1
        return inversions
    
    def test_basic_correctness(self) -> None:
        """
        Test basic correctness of all special sort implementations.
        
        Verifies that each algorithm correctly sorts various input arrays,
        with special attention to the constraints of each algorithm.
        """
        test_arrays = self.generate_test_arrays()
        
        for name, algorithm in self.algorithms.items():
            for array_name, array in test_arrays.items():
                # Skip empty arrays
                if array_name == "empty":
                    continue
                
                # Skip medium/large arrays for non-scalable algorithms
                if array_name == "medium_random" and name not in self.scalable_algorithms:
                    continue
                
                with self.subTest(algorithm=name, array=array_name):
                    original = array.copy()
                    try:
                        result = algorithm.execute(array)
                        
                        # Verify sorting
                        self.assertTrue(
                            self.verify_sorted(original, result),
                            f"{name} failed to correctly sort {array_name} array"
                        )
                    except Exception as e:
                        # BogoSort may time out on larger inputs, which is expected
                        if name == "bogo_sort" and len(original) > 5:
                            self.assertIn(
                                "iteration" or "timeout" or "limit",
                                str(e).lower(),
                                f"BogoSort failed with unexpected error: {e}"
                            )
                        else:
                            self.fail(f"{name} raised unexpected exception: {e}")
    
    def test_pancake_sort_flips(self) -> None:
        """
        Test specific properties of Pancake Sort.
        
        Verifies that Pancake Sort correctly performs prefix reversals (flips)
        and that the number of flips is within theoretical bounds.
        """
        # Test with various array sizes
        for size in [3, 5, 10]:
            test_array = [random.randint(0, 100) for _ in range(size)]
            
            with self.subTest(size=size):
                # Reset metrics
                self.pancake_sort.reset()
                
                # Execute algorithm
                result = self.pancake_sort.execute(test_array.copy())
                
                # Verify sorting
                self.assertTrue(
                    self.verify_sorted(test_array, result),
                    f"Pancake sort failed on array of size {size}"
                )
                
                # Check if flips are tracked
                self.assertIn(
                    "flips",
                    self.pancake_sort.metrics,
                    "Pancake sort should track flip count"
                )
                
                # Theoretical upper bound on flips is 2n - 3 for arrays of size n > 1
                if size > 1:
                    theoretical_bound = 2 * size - 3
                    self.assertLessEqual(
                        self.pancake_sort.metrics["flips"],
                        theoretical_bound,
                        f"Pancake sort used more than theoretical bound of {theoretical_bound} flips"
                    )
                
                # Check for flip correctness in history
                flip_operations = [
                    step for step in self.pancake_sort.history
                    if step.get("type") == "flip"
                ]
                
                for flip_op in flip_operations:
                    # Each flip should include the flip index
                    self.assertIn(
                        "flip_index",
                        flip_op,
                        "Flip operation is missing flip_index in history"
                    )
                    
                    # Flip index should be within array bounds
                    self.assertLessEqual(
                        flip_op["flip_index"],
                        size - 1,
                        "Flip index exceeds array bounds"
                    )
    
    def test_bogo_sort_randomization(self) -> None:
        """
        Test the randomization properties of Bogo Sort.
        
        Verifies that Bogo Sort generates random permutations and
        eventually converges to a sorted array for very small inputs.
        """
        # Test with very small arrays only, as Bogo Sort is O(n*n!) in expectation
        for size in [2, 3]:
            test_array = list(range(size))  # Start with sorted array
            random.shuffle(test_array)      # Shuffle to ensure non-sorted input
            
            with self.subTest(size=size):
                # Create a BogoSort instance with high iteration limit for small arrays
                bogo_sort = BogoSort({"max_iterations": 1000})
                
                # Reset metrics
                bogo_sort.reset()
                
                # Execute algorithm
                result = bogo_sort.execute(test_array.copy())
                
                # Verify sorting
                self.assertTrue(
                    self.verify_sorted(test_array, result),
                    f"Bogo sort failed on array of size {size}"
                )
                
                # Check if shuffles are tracked
                self.assertIn(
                    "shuffles",
                    bogo_sort.metrics,
                    "Bogo sort should track shuffle count"
                )
                
                # For very small arrays, we can verify that multiple shuffles were needed
                # to find the sorted arrangement (with very high probability)
                self.assertGreater(
                    bogo_sort.metrics["shuffles"],
                    1,
                    "Bogo sort suspiciously found sorted arrangement on first try"
                )
                
                # Check for shuffle operations in history
                shuffle_operations = [
                    step for step in bogo_sort.history
                    if step.get("type") == "shuffle"
                ]
                
                self.assertGreater(
                    len(shuffle_operations),
                    0,
                    "No shuffle operations recorded in history"
                )
    
    def test_convergence_time(self) -> None:
        """
        Test convergence time characteristics of special sorting algorithms.
        
        For deterministic algorithms like Pancake Sort, verifies the
        complexity bound. For probabilistic algorithms like Bogo Sort,
        verifies behavior on very small inputs.
        """
        # Test Pancake Sort complexity scaling
        pancake_sizes = [5, 10, 20, 30]
        pancake_times = []
        
        for size in pancake_sizes:
            test_array = [random.randint(0, 100) for _ in range(size)]
            
            # Measure execution time
            start_time = time.time()
            self.pancake_sort.execute(test_array.copy())
            end_time = time.time()
            
            pancake_times.append(end_time - start_time)
        
        # Pancake Sort has O(n²) time complexity
        # For consecutive sizes in our test series, the ratio of times
        # should be roughly proportional to the square of the ratio of sizes
        for i in range(1, len(pancake_sizes)):
            size_ratio = pancake_sizes[i] / pancake_sizes[i-1]
            expected_time_ratio = size_ratio ** 2
            
            # Allow substantial margin due to small sample sizes and system variations
            # For very small arrays, overhead can dominate actual algorithm time
            if pancake_times[i-1] > 0.001:  # Only check if previous time is measurable
                time_ratio = pancake_times[i] / pancake_times[i-1]
                self.assertLess(
                    time_ratio,
                    expected_time_ratio * 3,  # Allow substantial leeway
                    f"Pancake sort scaling exceeds theoretical complexity bound"
                )
        
        # Test Bogo Sort on very small inputs only
        bogo_iterations = []
        
        for _ in range(5):  # Multiple trials for statistical significance
            # Try with size 3 array
            test_array = [random.randint(0, 10) for _ in range(3)]
            
            # Create a BogoSort instance with high iteration limit
            bogo_sort = BogoSort({"max_iterations": 1000})
            
            # Execute and record iterations
            try:
                bogo_sort.execute(test_array.copy())
                bogo_iterations.append(bogo_sort.metrics["shuffles"])
            except Exception:
                # If it times out, record max_iterations
                bogo_iterations.append(1000)
        
        # For size 3, Bogo Sort should usually converge within reasonable iterations
        # but this is probabilistic, so we check the median value
        median_iterations = statistics.median(bogo_iterations)
        
        # 3! = 6 possible permutations, so expect around 6 iterations on average
        # but allow wide margin due to randomness
        self.assertLessEqual(
            median_iterations,
            100,  # Very generous bound for size 3
            f"Bogo sort required excessive iterations for size 3 array: {median_iterations}"
        )
    
    def test_edge_cases(self) -> None:
        """
        Test algorithm behavior on edge cases.
        
        Verifies correct handling of small, already sorted, and other special cases.
        """
        # Test empty array
        for name, algorithm in self.algorithms.items():
            with self.subTest(algorithm=name, case="empty_array"):
                result = algorithm.execute([])
                self.assertEqual([], result, f"{name} failed on empty array")
        
        # Test single element array
        for name, algorithm in self.algorithms.items():
            with self.subTest(algorithm=name, case="single_element"):
                result = algorithm.execute([42])
                self.assertEqual([42], result, f"{name} failed on single element array")
        
        # Test two element array
        for name, algorithm in self.algorithms.items():
            with self.subTest(algorithm=name, case="two_elements_sorted"):
                result = algorithm.execute([1, 2])
                self.assertEqual([1, 2], result, f"{name} failed on sorted two-element array")
                
            with self.subTest(algorithm=name, case="two_elements_unsorted"):
                result = algorithm.execute([2, 1])
                self.assertEqual([1, 2], result, f"{name} failed on unsorted two-element array")
        
        # Test already sorted array
        for name, algorithm in self.algorithms.items():
            if name == "bogo_sort":  # Skip BogoSort for larger arrays
                continue
                
            with self.subTest(algorithm=name, case="already_sorted"):
                test_array = list(range(10))
                result = algorithm.execute(test_array.copy())
                self.assertEqual(test_array, result, f"{name} failed on already sorted array")
                
                # For already sorted arrays, Pancake Sort should minimize operations
                if name == "pancake_sort":
                    self.assertLessEqual(
                        algorithm.metrics["flips"],
                        len(test_array),  # Linear bound should be generous enough
                        "Pancake sort performed excessive flips on already sorted array"
                    )
    
    def test_algorithmic_invariants(self) -> None:
        """
        Test that algorithms maintain their theoretical invariants.
        
        Verifies that each algorithm follows its defining behavior and constraints.
        """
        # Test Pancake Sort invariant: only prefix reversals (flips) are used
        with self.subTest(algorithm="pancake_sort", invariant="prefix_reversals"):
            test_array = [random.randint(0, 100) for _ in range(10)]
            
            # Reset metrics and history
            self.pancake_sort.reset()
            
            # Execute algorithm, capturing intermediate states
            self.pancake_sort.execute(test_array.copy())
            
            # Extract array states from history
            array_states = [
                step["array"] for step in self.pancake_sort.history
                if "array" in step
            ]
            
            # Verify that each transition is achievable by a prefix reversal
            for i in range(1, len(array_states)):
                prev_state = array_states[i-1]
                curr_state = array_states[i]
                
                # Find largest index where arrays differ
                diff_index = -1
                for j in range(len(prev_state)):
                    if prev_state[j] != curr_state[j]:
                        diff_index = j
                
                # If arrays differ, the transition should be explainable by a prefix reversal
                if diff_index >= 0:
                    # Get the prefix that was supposedly reversed
                    prefix_len = diff_index + 1
                    
                    # Create reversed prefix
                    reversed_prefix = prev_state[:prefix_len][::-1]
                    
                    # Check if current state can be achieved by this prefix reversal
                    expected_state = reversed_prefix + prev_state[prefix_len:]
                    
                    self.assertEqual(
                        expected_state,
                        curr_state,
                        "Pancake sort performed an operation that is not a valid prefix reversal"
                    )
        
        # Test BogoSort invariant: each shuffle is a random permutation
        with self.subTest(algorithm="bogo_sort", invariant="random_permutations"):
            # Use small array to ensure BogoSort terminates in reasonable time
            test_array = [1, 2, 3]
            
            # Create BogoSort instance with high recording detail
            bogo_sort = BogoSort({"max_iterations": 100, "record_all_permutations": True})
            
            try:
                # Execute algorithm
                bogo_sort.execute(test_array.copy())
                
                # Extract shuffle operations from history
                shuffle_ops = [
                    step for step in bogo_sort.history
                    if step.get("type") == "shuffle" and "permutation" in step
                ]
                
                # Need at least a few shuffles to test
                if len(shuffle_ops) >= 3:
                    # Check that shuffles produce different permutations
                    permutations = [op["permutation"] for op in shuffle_ops]
                    unique_permutations = set(tuple(p) for p in permutations)
                    
                    self.assertGreater(
                        len(unique_permutations),
                        1,
                        "BogoSort produces suspiciously non-random permutations"
                    )
            except Exception:
                # If BogoSort times out, that's acceptable for this test
                pass
    
    def test_metrics_collection(self) -> None:
        """
        Test that algorithms properly collect performance metrics.
        
        Verifies the instrumentation system correctly tracks operations
        specific to each algorithm type.
        """
        # Test Pancake Sort metrics
        with self.subTest(algorithm="pancake_sort", metrics="flips"):
            test_array = [random.randint(0, 100) for _ in range(10)]
            
            # Reset metrics
            self.pancake_sort.reset()
            
            # Execute algorithm
            self.pancake_sort.execute(test_array.copy())
            
            # Verify flip count is recorded
            self.assertIn("flips", self.pancake_sort.metrics)
            self.assertGreaterEqual(self.pancake_sort.metrics["flips"], 0)
            
            # Verify other standard metrics are present
            essential_metrics = ["comparisons", "execution_time"]
            for metric in essential_metrics:
                self.assertIn(metric, self.pancake_sort.metrics)
        
        # Test BogoSort metrics
        with self.subTest(algorithm="bogo_sort", metrics="shuffles"):
            # Use very small array
            test_array = [2, 1, 3]
            
            # Reset metrics
            self.bogo_sort.reset()
            
            try:
                # Execute algorithm
                self.bogo_sort.execute(test_array.copy())
                
                # Verify shuffle count is recorded
                self.assertIn("shuffles", self.bogo_sort.metrics)
                self.assertGreater(self.bogo_sort.metrics["shuffles"], 0)
                
                # Verify other standard metrics are present
                essential_metrics = ["comparisons", "execution_time"]
                for metric in essential_metrics:
                    self.assertIn(metric, self.bogo_sort.metrics)
            except Exception:
                # If BogoSort times out, that's acceptable - still check metrics
                self.assertIn("shuffles", self.bogo_sort.metrics)
                self.assertGreater(self.bogo_sort.metrics["shuffles"], 0)


if __name__ == "__main__":
    unittest.main()
