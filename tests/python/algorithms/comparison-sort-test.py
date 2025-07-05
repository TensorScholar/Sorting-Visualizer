#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Comparison Sort Algorithm Test Suite

This module implements a comprehensive test suite for comparison-based sorting
algorithms, with specialized test cases that focus on the unique characteristics
and edge cases specific to comparison sorts.

Building on the BaseAlgorithmTest class, this module implements test classes for
each comparison sort algorithm, with algorithm-specific test methods where needed.
It evaluates correctness, stability, performance, and specific behavioral 
characteristics like adaptivity and optimization effectiveness.

Author: Algorithm Visualization Platform Team
License: MIT
"""

import unittest
import os
import sys
import numpy as np
import math
import time
from typing import List, Dict, Any, Type, Tuple, Optional, Set, Union
import random
import logging
import matplotlib.pyplot as plt
from functools import partial
from collections import defaultdict

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('comparison_sort_tests')

# Import base test class
from base_algorithm_test import BaseAlgorithmTest

# Import path handling for algorithm modules
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../python')))

# Import base algorithm and algorithm implementations
from core.base_algorithm import Algorithm
from algorithms.comparison.bubble_sort import BubbleSort
from algorithms.comparison.cocktail_shaker_sort import CocktailShakerSort
from algorithms.comparison.comb_sort import CombSort
from algorithms.comparison.cycle_sort import CycleSort
from algorithms.comparison.gnome_sort import GnomeSort
from algorithms.comparison.heap_sort import HeapSort
from algorithms.comparison.insertion_sort import InsertionSort
from algorithms.comparison.binary_insertion_sort import BinaryInsertionSort
from algorithms.comparison.intro_sort import IntroSort
from algorithms.comparison.merge_sort import MergeSort
from algorithms.comparison.odd_even_sort import OddEvenSort
from algorithms.comparison.quick_sort import QuickSort
from algorithms.comparison.selection_sort import SelectionSort
from algorithms.comparison.shell_sort import ShellSort
from algorithms.comparison.tim_sort import TimSort


class ComparisonSortBaseTest(BaseAlgorithmTest):
    """
    Base class for comparison sort tests with common test methods.
    
    This class extends BaseAlgorithmTest with test methods specific
    to comparison sorts, such as testing stability, adaptive behavior,
    and optimization effectiveness.
    """
    
    def test_compare_operations_bound(self):
        """
        Test that the number of compare operations is within theoretical bounds.
        
        Comparison sorts have specific lower and upper bounds on the number
        of comparisons needed to sort an array. This test verifies the algorithm
        stays within these bounds.
        """
        data = self.generate_random_data(self.MEDIUM_SIZE)
        
        # Execute algorithm
        algorithm = self.setup_algorithm_instance()
        algorithm.execute(data.copy())
        
        # Get complexity class
        complexity = algorithm.get_complexity()
        worst_case = complexity['time']['worst']
        
        # Determine expected bounds based on complexity
        n = len(data)
        
        # Lower bound for comparison-based sorts is Ω(n log n) except for special cases
        lower_bound = n if n <= 1 else n * math.log2(n) * 0.5  # 0.5 factor for theoretical min
        
        # Upper bound depends on algorithm's complexity class
        if 'O(n log n)' in worst_case:
            # For O(n log n) algorithms, use a generous constant factor
            upper_bound = n * math.log2(n) * 2.5  # 2.5 factor for practical implementations
        elif 'O(n²)' in worst_case:
            # For O(n²) algorithms, quadratic bound
            upper_bound = n * n * 1.5  # 1.5 factor for practical implementations
        else:
            # Default case
            upper_bound = n * n  # Conservative default
        
        # Verify comparison count
        comparisons = algorithm.metrics['comparisons']
        self.assertGreaterEqual(comparisons, lower_bound,
                               f"Comparison count {comparisons} is below theoretical minimum {lower_bound}")
        self.assertLessEqual(comparisons, upper_bound,
                            f"Comparison count {comparisons} exceeds expected maximum {upper_bound}")
    
    def test_swap_operations(self):
        """
        Test that the number of swap operations is tracked correctly.
        
        Swap operations are fundamental to many comparison sorts. This test
        verifies that swaps are correctly tracked and are within reasonable bounds.
        """
        data = self.generate_random_data(self.MEDIUM_SIZE)
        
        # Execute algorithm
        algorithm = self.setup_algorithm_instance()
        algorithm.execute(data.copy())
        
        # Verify swap count (very permissive bounds, just checking tracking)
        n = len(data)
        swaps = algorithm.metrics['swaps']
        
        # The exact swap count depends heavily on the algorithm and data,
        # but we can check it's within reasonable bounds
        self.assertGreaterEqual(swaps, 0,
                               "Swap count cannot be negative")
        self.assertLessEqual(swaps, n * n,
                            f"Swap count {swaps} seems unreasonably high for array size {n}")
    
    def test_adaptive_behavior(self):
        """
        Test if the algorithm shows adaptive behavior on partially sorted arrays.
        
        Adaptive sorting algorithms perform better on partially sorted arrays.
        This test checks if algorithms that claim to be adaptive actually show
        this behavior.
        """
        # Skip if algorithm doesn't claim to be adaptive
        is_adaptive = hasattr(self.algorithm, 'is_adaptive') and self.algorithm.is_adaptive()
        if not is_adaptive:
            self.skipTest("Algorithm does not claim adaptive behavior")
        
        # Create nearly sorted and random arrays of the same size
        n = self.MEDIUM_SIZE
        nearly_sorted = self.generate_nearly_sorted_data(n, perturbation=0.1)
        random_data = self.generate_random_data(n)
        
        # Measure performance on both
        algorithm1 = self.setup_algorithm_instance()
        algorithm2 = self.setup_algorithm_instance()
        
        start_time1 = time.time()
        algorithm1.execute(nearly_sorted.copy())
        time1 = time.time() - start_time1
        
        start_time2 = time.time()
        algorithm2.execute(random_data.copy())
        time2 = time.time() - start_time2
        
        # Compare metrics - an adaptive algorithm should perform fewer operations
        # on nearly sorted data
        ops1 = algorithm1.metrics['comparisons'] + algorithm1.metrics['swaps']
        ops2 = algorithm2.metrics['comparisons'] + algorithm2.metrics['swaps']
        
        # For genuinely adaptive algorithms, there should be a significant difference
        # (using a factor of 1.3 as an arbitrary threshold for "significant")
        self.assertLess(ops1, ops2 / 1.3,
                       f"Algorithm doesn't show significant adaptive behavior: "
                       f"{ops1} operations on nearly sorted vs {ops2} on random")
        
        logger.info(f"Adaptive behavior for {self.algorithm_name}:")
        logger.info(f"Operations on nearly sorted: {ops1}")
        logger.info(f"Operations on random data: {ops2}")
        logger.info(f"Ratio (random/nearly sorted): {ops2/ops1:.2f}")
    
    def test_optimization_impact(self):
        """
        Test the impact of algorithm optimizations.
        
        Many comparison sorts have optimizations that can be enabled/disabled.
        This test measures their effectiveness.
        """
        # Skip if algorithm doesn't support disabling optimizations
        if not hasattr(self.algorithm, 'options') or 'optimize' not in self.algorithm.options:
            self.skipTest("Algorithm doesn't support optimization toggling")
        
        data = self.generate_random_data(self.MEDIUM_SIZE)
        
        # Run with optimizations enabled
        algorithm_optimized = self.setup_algorithm_instance({'optimize': True})
        start_time1 = time.time()
        algorithm_optimized.execute(data.copy())
        time1 = time.time() - start_time1
        
        # Run with optimizations disabled
        algorithm_basic = self.setup_algorithm_instance({'optimize': False})
        start_time2 = time.time()
        algorithm_basic.execute(data.copy())
        time2 = time.time() - start_time2
        
        # Compare operation counts
        ops1 = algorithm_optimized.metrics['comparisons'] + algorithm_optimized.metrics['swaps']
        ops2 = algorithm_basic.metrics['comparisons'] + algorithm_basic.metrics['swaps']
        
        # Log optimization impact
        logger.info(f"Optimization impact for {self.algorithm_name}:")
        logger.info(f"Operations with optimization: {ops1}")
        logger.info(f"Operations without optimization: {ops2}")
        logger.info(f"Improvement factor: {ops2/ops1:.2f}x")
        
        # No strict assertion - some optimizations might not help on random data
        # This test is primarily for logging/information
    
    def test_comparison_count_sensitivity(self):
        """
        Test sensitivity of comparison counts to input patterns.
        
        Different input patterns can drastically affect the number of
        comparisons needed. This test characterizes that sensitivity.
        """
        # Generate different input patterns
        n = self.MEDIUM_SIZE
        data_patterns = {
            'random': self.generate_random_data(n),
            'sorted': self.generate_sorted_data(n),
            'reversed': self.generate_reversed_data(n),
            'nearly_sorted': self.generate_nearly_sorted_data(n, 0.1),
            'few_unique': self.generate_few_unique_data(n, 5)
        }
        
        # Collect comparison counts for each pattern
        results = {}
        for pattern_name, data in data_patterns.items():
            algorithm = self.setup_algorithm_instance()
            algorithm.execute(data.copy())
            results[pattern_name] = algorithm.metrics['comparisons']
        
        # Log results
        logger.info(f"Comparison count sensitivity for {self.algorithm_name}:")
        for pattern, count in results.items():
            logger.info(f"{pattern:15s}: {count:8d} comparisons")
        
        # Calculate theoretical comparison count for a perfect algorithm
        # (information-theoretic lower bound)
        theoretical_min = n * math.log2(n) if n > 1 else 0
        
        # Visualize if enabled
        if self.ENABLE_VISUALIZATION_TESTS:
            try:
                plt.figure(figsize=(10, 6))
                plt.bar(results.keys(), results.values())
                plt.axhline(y=theoretical_min, color='r', linestyle='--', label='Theoretical minimum')
                plt.xlabel('Input Pattern')
                plt.ylabel('Comparison Count')
                plt.title(f'{self.algorithm_name} Comparison Count Sensitivity')
                plt.legend()
                plt.xticks(rotation=45)
                plt.tight_layout()
                plt.savefig(f"{self.algorithm_name.replace(' ', '_').lower()}_sensitivity.png")
                plt.close()
            except Exception as e:
                logger.warning(f"Could not create sensitivity plot: {e}")
    
    def test_inplace_property(self):
        """
        Test that in-place algorithms don't use excessive auxiliary space.
        
        In-place algorithms should only use O(1) extra space beyond the input array.
        """
        # Skip if algorithm doesn't claim to be in-place
        is_inplace = self.algorithm.is_in_place()
        if not is_inplace:
            self.skipTest("Algorithm does not claim to be in-place")
        
        data = self.generate_random_data(self.LARGE_SIZE)
        
        # Execute algorithm
        algorithm = self.setup_algorithm_instance()
        algorithm.execute(data.copy())
        
        # Check auxiliary space usage
        # This is a rough check - the exact measurement depends on implementation
        auxiliary_space = algorithm.metrics.get('auxiliary_space', 0)
        
        # For in-place algorithms, auxiliary space should be much less than input size
        # Allow a small constant factor for implementation details
        self.assertLessEqual(auxiliary_space, len(data) * 0.1,
                            f"In-place algorithm used excessive auxiliary space: {auxiliary_space}")
    
    def test_stability_consistency(self):
        """
        Test that the algorithm's claimed stability matches its actual behavior.
        
        Verifies that algorithms correctly report whether they preserve the
        relative order of equal elements.
        """
        # Determine claimed stability
        claimed_stable = self.algorithm.is_stable()
        
        # Test with data that has duplicate keys
        data = self.generate_object_data(self.MEDIUM_SIZE, key_range=5)  # Ensure duplicates
        
        # Execute algorithm
        algorithm = self.setup_algorithm_instance()
        result = algorithm.execute(data.copy())
        
        # Check actual stability
        actual_stable = True
        
        # Group elements by key
        key_groups = defaultdict(list)
        for item in data:
            key_groups[item['key']].append(item['original_index'])
        
        # Check that each group's original indices appear in the same order after sorting
        for key, original_indices in key_groups.items():
            if len(original_indices) <= 1:
                continue  # No stability concern with single elements
                
            # Find these elements in the sorted result
            result_indices = []
            for item in result:
                if item['key'] == key:
                    result_indices.append(item['original_index'])
            
            # Check if original order is preserved
            if result_indices != sorted(original_indices):
                actual_stable = False
                break
        
        # The claimed stability should match actual behavior
        self.assertEqual(claimed_stable, actual_stable,
                        f"Algorithm stability claim ({claimed_stable}) does not match "
                        f"actual behavior ({actual_stable})")


# Now define individual test classes for each algorithm

class BubbleSortTest(ComparisonSortBaseTest):
    """Test suite for Bubble Sort algorithm."""
    
    def get_algorithm_class(self) -> Type[Algorithm]:
        return BubbleSort
    
    def test_early_termination(self):
        """Test early termination on already sorted data."""
        # Bubble sort should detect when array becomes sorted and terminate early
        data = self.generate_sorted_data(self.MEDIUM_SIZE)
        
        algorithm = self.setup_algorithm_instance({'optimize': True})
        algorithm.execute(data.copy())
        
        # Should only need one pass through the array (n-1 comparisons)
        n = len(data)
        self.assertLessEqual(algorithm.metrics['comparisons'], n,
                            f"Bubble sort didn't terminate early on sorted data: "
                            f"{algorithm.metrics['comparisons']} comparisons for size {n}")


class CocktailShakerSortTest(ComparisonSortBaseTest):
    """Test suite for Cocktail Shaker Sort algorithm."""
    
    def get_algorithm_class(self) -> Type[Algorithm]:
        return CocktailShakerSort
    
    def test_bidirectional_efficiency(self):
        """Test that bidirectional traversal improves efficiency for certain patterns."""
        # Create data with small values at both ends
        n = self.MEDIUM_SIZE
        data = self.generate_sorted_data(n)
        
        # Move smallest and largest elements to ends
        middle = data[1:-1]
        random.shuffle(middle)
        data = [data[0]] + middle + [data[-1]]
        
        # Run cocktail shaker sort
        cocktail_algorithm = self.setup_algorithm_instance()
        cocktail_result = cocktail_algorithm.execute(data.copy())
        cocktail_comps = cocktail_algorithm.metrics['comparisons']
        
        # Run regular bubble sort for comparison
        bubble_algorithm = BubbleSort()
        bubble_result = bubble_algorithm.execute(data.copy())
        bubble_comps = bubble_algorithm.metrics['comparisons']
        
        # Log results
        logger.info(f"Bidirectional efficiency comparison:")
        logger.info(f"Cocktail sort comparisons: {cocktail_comps}")
        logger.info(f"Bubble sort comparisons: {bubble_comps}")
        
        # Cocktail should typically be more efficient on this pattern
        # (not a strict requirement, but indicates correct implementation)
        self.assertLessEqual(cocktail_comps, bubble_comps,
                            "Cocktail Shaker Sort should be more efficient than Bubble Sort "
                            "for this input pattern")


class HeapSortTest(ComparisonSortBaseTest):
    """Test suite for Heap Sort algorithm."""
    
    def get_algorithm_class(self) -> Type[Algorithm]:
        return HeapSort
    
    def test_heap_property(self):
        """Test that the algorithm maintains the heap property during execution."""
        data = self.generate_random_data(self.SMALL_SIZE)
        
        # Execute with history recording
        algorithm = self.setup_algorithm_instance({
            'record_history': True,
            'visualize_heap': True
        })
        algorithm.execute(data.copy())
        
        # Find heapify operations in history
        heap_states = [step for step in algorithm.history 
                       if step.get('type') == 'heap-complete']
        
        if not heap_states:
            self.skipTest("No heap states recorded in algorithm history")
        
        # Verify heap property in at least one state
        def verify_heap_property(heap_array, root_idx=0):
            """Recursively verify the max-heap property."""
            left_idx = 2 * root_idx + 1
            right_idx = 2 * root_idx + 2
            largest = root_idx
            
            if left_idx < len(heap_array) and heap_array[left_idx] > heap_array[largest]:
                largest = left_idx
                
            if right_idx < len(heap_array) and heap_array[right_idx] > heap_array[largest]:
                largest = right_idx
                
            if largest != root_idx:
                return False  # Heap property violated
                
            # Recursively check children
            if left_idx < len(heap_array):
                if not verify_heap_property(heap_array, left_idx):
                    return False
                    
            if right_idx < len(heap_array):
                if not verify_heap_property(heap_array, right_idx):
                    return False
                    
            return True  # Heap property holds
        
        # Check at least the first documented heap state
        heap_array = heap_states[0]['array']
        is_valid_heap = verify_heap_property(heap_array, 0)
        
        self.assertTrue(is_valid_heap, "Heap property not maintained during execution")


class InsertionSortTest(ComparisonSortBaseTest):
    """Test suite for Insertion Sort algorithm."""
    
    def get_algorithm_class(self) -> Type[Algorithm]:
        return InsertionSort
    
    def test_adaptive_efficiency(self):
        """Test insertion sort's adaptive efficiency on nearly sorted data."""
        # Insertion sort should be very efficient on nearly sorted data
        n = self.MEDIUM_SIZE
        nearly_sorted = self.generate_nearly_sorted_data(n, perturbation=0.05)
        random_data = self.generate_random_data(n)
        
        # Run on nearly sorted data
        algorithm1 = self.setup_algorithm_instance()
        start1 = time.time()
        algorithm1.execute(nearly_sorted.copy())
        time1 = time.time() - start1
        
        # Run on random data
        algorithm2 = self.setup_algorithm_instance()
        start2 = time.time()
        algorithm2.execute(random_data.copy())
        time2 = time.time() - start2
        
        # Calculate operations ratio
        ops1 = algorithm1.metrics['comparisons'] + algorithm1.metrics['swaps']
        ops2 = algorithm2.metrics['comparisons'] + algorithm2.metrics['swaps']
        
        # For small perturbations, insertion sort should be much more efficient
        logger.info(f"Insertion Sort adaptive efficiency:")
        logger.info(f"Operations on nearly sorted: {ops1}")
        logger.info(f"Operations on random data: {ops2}")
        logger.info(f"Efficiency ratio: {ops2/ops1:.2f}x")
        
        # With 5% perturbation, should be at least 3x more efficient
        self.assertGreater(ops2/ops1, 3,
                          "Insertion sort should be significantly more efficient on nearly sorted data")


class BinaryInsertionSortTest(ComparisonSortBaseTest):
    """Test suite for Binary Insertion Sort algorithm."""
    
    def get_algorithm_class(self) -> Type[Algorithm]:
        return BinaryInsertionSort
    
    def test_comparison_reduction(self):
        """Test that binary insertion sort reduces comparisons vs regular insertion sort."""
        data = self.generate_random_data(self.MEDIUM_SIZE)
        
        # Run binary insertion sort
        binary_algorithm = self.setup_algorithm_instance()
        binary_algorithm.execute(data.copy())
        binary_comps = binary_algorithm.metrics['comparisons']
        
        # Run regular insertion sort
        regular_algorithm = InsertionSort()
        regular_algorithm.execute(data.copy())
        regular_comps = regular_algorithm.metrics['comparisons']
        
        # Binary search should reduce comparisons
        logger.info(f"Comparison count comparison:")
        logger.info(f"Binary insertion sort: {binary_comps} comparisons")
        logger.info(f"Regular insertion sort: {regular_comps} comparisons")
        logger.info(f"Reduction factor: {regular_comps/binary_comps:.2f}x")
        
        # Should have noticeably fewer comparisons (threshold is an approximation)
        self.assertLess(binary_comps, regular_comps * 0.7,
                       "Binary insertion sort should significantly reduce comparisons")


class MergeSortTest(ComparisonSortBaseTest):
    """Test suite for Merge Sort algorithm."""
    
    def get_algorithm_class(self) -> Type[Algorithm]:
        return MergeSort
    
    def test_auxiliary_memory_usage(self):
        """Test that merge sort uses additional memory as expected."""
        # Merge sort typically uses O(n) auxiliary space
        data = self.generate_random_data(self.MEDIUM_SIZE)
        
        algorithm = self.setup_algorithm_instance()
        algorithm.execute(data.copy())
        
        if 'auxiliary_space' in algorithm.metrics:
            aux_space = algorithm.metrics['auxiliary_space']
            logger.info(f"Merge Sort auxiliary space: {aux_space} units")
            
            # Standard merge sort should use approximately O(n) space
            # This is an approximate validation based on implementation details
            if algorithm.options.get('in_place_merge', False):
                # In-place variants should use less memory
                self.assertLess(aux_space, len(data) * 0.5)
            else:
                # Standard variants should use roughly O(n) memory
                self.assertGreaterEqual(aux_space, len(data) * 0.5)
                self.assertLessEqual(aux_space, len(data) * 1.5)


class QuickSortTest(ComparisonSortBaseTest):
    """Test suite for Quick Sort algorithm."""
    
    def get_algorithm_class(self) -> Type[Algorithm]:
        return QuickSort
    
    def test_pivot_strategies(self):
        """Test different pivot selection strategies."""
        n = self.MEDIUM_SIZE
        data = self.generate_random_data(n)
        
        # Try different pivot strategies
        pivot_strategies = ['first', 'last', 'random', 'median-of-three']
        results = {}
        
        for strategy in pivot_strategies:
            algorithm = self.setup_algorithm_instance({'pivot_strategy': strategy})
            algorithm.execute(data.copy())
            results[strategy] = {
                'comparisons': algorithm.metrics['comparisons'],
                'swaps': algorithm.metrics['swaps']
            }
        
        # Log results
        logger.info(f"Quick Sort pivot strategy comparison:")
        for strategy, metrics in results.items():
            logger.info(f"{strategy:15s}: {metrics['comparisons']:8d} comparisons, "
                       f"{metrics['swaps']:8d} swaps")
        
        # No strict assertions - different strategies can perform differently
        # on different data. This test is for information/logging.


class IntroSortTest(ComparisonSortBaseTest):
    """Test suite for Intro Sort algorithm."""
    
    def get_algorithm_class(self) -> Type[Algorithm]:
        return IntroSort
    
    def test_hybrid_behavior(self):
        """Test that Introsort demonstrates hybrid behavior on pathological inputs."""
        # Create a pathological case for quicksort (already sorted)
        n = self.LARGE_SIZE
        pathological = self.generate_sorted_data(n)
        
        # Run Introsort
        intro_algorithm = self.setup_algorithm_instance()
        intro_algorithm.execute(pathological.copy())
        intro_time = intro_algorithm.metrics['execution_time']
        
        # Run regular Quicksort for comparison
        quick_algorithm = QuickSort({'pivot_strategy': 'first'})  # Worst case for sorted
        quick_algorithm.execute(pathological.copy())
        quick_time = quick_algorithm.metrics['execution_time']
        
        # Log results
        logger.info(f"Introsort vs Quicksort on pathological input:")
        logger.info(f"Introsort: {intro_time:.6f}s")
        logger.info(f"Quicksort: {quick_time:.6f}s")
        
        # Introsort should handle pathological cases better
        # Note: This may be affected by other optimizations in QuickSort
        # so we use a permissive threshold
        self.assertLessEqual(intro_time, quick_time * 1.5,
                           "Introsort should handle pathological cases efficiently")


class TimSortTest(ComparisonSortBaseTest):
    """Test suite for Tim Sort algorithm."""
    
    def get_algorithm_class(self) -> Type[Algorithm]:
        return TimSort
    
    def test_natural_run_detection(self):
        """Test that TimSort effectively identifies and utilizes natural runs."""
        # Create data with natural runs (alternating ascending/descending sequences)
        n = self.MEDIUM_SIZE
        runs = 5
        run_length = n // runs
        
        data = []
        for i in range(runs):
            if i % 2 == 0:
                # Ascending run
                run = list(range(i * run_length, (i + 1) * run_length))
            else:
                # Descending run
                run = list(range((i + 1) * run_length - 1, i * run_length - 1, -1))
            data.extend(run)
        
        # Run TimSort
        algorithm = self.setup_algorithm_instance()
        algorithm.execute(data.copy())
        
        # Check if run count is recorded
        if hasattr(algorithm, 'run_count') and algorithm.run_count > 0:
            logger.info(f"TimSort detected {algorithm.run_count} natural runs")
            
            # Should detect approximately the number of runs we created
            # (may not be exact due to run merging/splitting heuristics)
            self.assertGreaterEqual(algorithm.run_count, runs * 0.5)
            self.assertLessEqual(algorithm.run_count, runs * 2)


class ShellSortTest(ComparisonSortBaseTest):
    """Test suite for Shell Sort algorithm."""
    
    def get_algorithm_class(self) -> Type[Algorithm]:
        return ShellSort
    
    def test_gap_sequence_impact(self):
        """Test the impact of different gap sequences on Shell Sort performance."""
        n = self.MEDIUM_SIZE
        data = self.generate_random_data(n)
        
        # Test different gap sequences if supported
        gap_sequences = {
            'shell': [n//2**i for i in range(20) if n//2**i > 0],  # Original Shell sequence
            'knuth': [1, 4, 13, 40, 121, 364, 1093],  # Knuth sequence: h=3h+1
            'sedgewick': [1, 8, 23, 77, 281, 1073, 4193, 16577]  # Sedgewick sequence
        }
        
        results = {}
        
        for name, sequence in gap_sequences.items():
            try:
                algorithm = self.setup_algorithm_instance({'gap_sequence': sequence})
                algorithm.execute(data.copy())
                results[name] = {
                    'comparisons': algorithm.metrics['comparisons'],
                    'swaps': algorithm.metrics['swaps']
                }
            except Exception as e:
                logger.warning(f"Couldn't test gap sequence '{name}': {e}")
        
        # Log results
        if results:
            logger.info(f"Shell Sort gap sequence comparison:")
            for name, metrics in results.items():
                logger.info(f"{name:10s}: {metrics['comparisons']:8d} comparisons, "
                           f"{metrics['swaps']:8d} swaps")
            
            # No strict assertions - different sequences perform differently
            # on different data. This test is for information/logging.


class SelectionSortTest(ComparisonSortBaseTest):
    """Test suite for Selection Sort algorithm."""
    
    def get_algorithm_class(self) -> Type[Algorithm]:
        return SelectionSort
    
    def test_swap_constancy(self):
        """Test that Selection Sort performs exactly n-1 swaps regardless of input."""
        # Selection sort should always perform exactly n-1 swaps
        data_sets = {
            'random': self.generate_random_data(self.MEDIUM_SIZE),
            'sorted': self.generate_sorted_data(self.MEDIUM_SIZE),
            'reversed': self.generate_reversed_data(self.MEDIUM_SIZE),
            'few_unique': self.generate_few_unique_data(self.MEDIUM_SIZE)
        }
        
        results = {}
        
        for name, data in data_sets.items():
            algorithm = self.setup_algorithm_instance()
            algorithm.execute(data.copy())
            results[name] = algorithm.metrics['swaps']
            
            # Verify swap count matches expectation
            n = len(data)
            expected_swaps = n - 1  # Should always be n-1
            
            self.assertEqual(algorithm.metrics['swaps'], expected_swaps,
                            f"Selection sort performed {algorithm.metrics['swaps']} swaps "
                            f"instead of expected {expected_swaps} on {name} data")
        
        # Log results
        logger.info(f"Selection Sort swap counts:")
        for name, swaps in results.items():
            logger.info(f"{name:12s}: {swaps:5d} swaps")


# Add more algorithm-specific test classes here

# Example for running specific tests when module is executed directly
if __name__ == "__main__":
    # Create test suite with all comparison sort tests
    test_suite = unittest.TestSuite()
    
    # Add test cases for each algorithm
    test_classes = [
        BubbleSortTest,
        CocktailShakerSortTest,
        HeapSortTest,
        InsertionSortTest,
        BinaryInsertionSortTest,
        MergeSortTest,
        QuickSortTest,
        IntroSortTest,
        TimSortTest,
        ShellSortTest,
        SelectionSortTest
    ]
    
    for test_class in test_classes:
        tests = unittest.defaultTestLoader.loadTestsFromTestCase(test_class)
        test_suite.addTests(tests)
    
    # Run the tests
    test_runner = unittest.TextTestRunner(verbosity=2)
    test_runner.run(test_suite)
