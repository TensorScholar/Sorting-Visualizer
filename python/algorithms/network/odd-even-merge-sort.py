# algorithms/network/odd_even_merge_sort.py

from typing import List, Any, Dict, Optional, Callable, Tuple
from algorithms.base_algorithm import Algorithm
import time
import math

class OddEvenMergeSort(Algorithm):
    """
    Implementation of Odd-Even Merge Sort (Batcher's Merge Exchange Sort).
    
    Odd-Even Merge Sort is a parallel sorting algorithm that can be represented as a sorting
    network. It divides the input into two halves, recursively sorts them, and then performs
    a specialized merge operation by comparing and exchanging elements at specific distances.
    
    This implementation includes:
    - Detailed visualization of the network structure
    - Step-by-step execution of the comparator operations
    - Analysis of sorting network properties
    - Multiple optimization strategies
    
    Time Complexity:
    - Sequential implementation: O(n log²(n))
    - Parallel implementation: O(log²(n)) with O(n log²(n)) processors
    
    Space Complexity: O(1) (in-place sorting)
    
    Note: Although the algorithm is designed for parallel execution, this implementation
    simulates the parallel behavior sequentially while preserving the original operation
    order to correctly visualize the sorting network structure.
    """
    
    def __init__(self, options: Dict[str, Any] = None):
        """
        Initialize Odd-Even Merge Sort with options.
        
        Args:
            options: Dictionary of options including:
                - visualize_network: Visualize the sorting network structure
                - optimize_comparators: Optimize redundant comparator operations
                - adaptive_termination: Early termination if array becomes sorted
        """
        super().__init__("Odd-Even Merge Sort", "network", options)
        
        # Default options
        self.options.update({
            "visualize_network": True,     # Visualize the sorting network structure
            "optimize_comparators": True,  # Optimize redundant comparator operations
            "adaptive_termination": True,  # Early termination if array becomes sorted
            "animation_delay": 0           # Delay between steps for visualization
        })
        
        # Override with provided options
        if options:
            self.options.update(options)
        
        # Keep track of the comparator network structure
        self.network_structure = {
            "stages": [],
            "total_comparators": 0
        }

    def run(self, array: List[Any], options: Dict[str, Any]) -> List[Any]:
        """
        Execute Odd-Even Merge Sort on the provided array.
        
        Args:
            array: The array to sort
            options: Runtime options
            
        Returns:
            The sorted array
        """
        # Make a copy to avoid modifying the original
        result = array.copy()
        n = len(result)
        
        # For Odd-Even Merge Sort, n should ideally be a power of 2
        # If not, we can pad the array with large values that will be filtered out later
        original_length = n
        next_power_of_2 = 2 ** math.ceil(math.log2(n))
        
        if n != next_power_of_2:
            # Record padding operation
            self.record_state(result, {
                "type": "padding",
                "original_length": n,
                "padded_length": next_power_of_2,
                "message": f"Padding array from length {n} to {next_power_of_2} for Odd-Even Merge Sort"
            })
            
            # Find the largest value in the array to use for padding
            max_value = max(result) if result else float('inf')
            # Pad with values larger than any in the array
            padding = [max_value + 1] * (next_power_of_2 - n)
            result.extend(padding)
            n = next_power_of_2
        
        self.set_phase("sorting")
        
        # Reset network structure
        self.network_structure = {
            "stages": [],
            "total_comparators": 0
        }
        
        # Execute the odd-even merge sort
        self.odd_even_merge_sort(result, 0, n, options)
        
        # If we padded the array, remove the padding
        if original_length != next_power_of_2:
            result = result[:original_length]
            
            # Record unpadding operation
            self.record_state(result, {
                "type": "unpadding",
                "message": f"Removing padding to restore original array length of {original_length}"
            })
        
        self.set_phase("completed")
        
        # Record final network statistics
        if self.options["visualize_network"]:
            self.record_state(result, {
                "type": "network_statistics",
                "stages": len(self.network_structure["stages"]),
                "comparators": self.network_structure["total_comparators"],
                "message": f"Sorting network: {len(self.network_structure['stages'])} stages with {self.network_structure['total_comparators']} comparators"
            })
        
        return result

    def odd_even_merge_sort(self, 
                           array: List[Any], 
                           lo: int, 
                           n: int, 
                           options: Dict[str, Any]) -> None:
        """
        Recursively apply Odd-Even Merge Sort to the array.
        
        Args:
            array: The array to sort
            lo: Low index of the section to sort
            n: Size of the section to sort
            options: Runtime options
        """
        # Base case: array with 1 element is already sorted
        if n <= 1:
            return
        
        # Record current recursive call
        self.record_state(array, {
            "type": "recursive_call",
            "section": [lo, lo + n - 1],
            "size": n,
            "message": f"Sorting section from index {lo} to {lo + n - 1} (size {n})"
        })
        
        # Introduce delay for visualization if specified
        if options["animation_delay"] > 0:
            time.sleep(options["animation_delay"] / 1000)
        
        # Divide the array into two halves and sort them recursively
        m = n // 2
        
        # Sort the first half
        self.odd_even_merge_sort(array, lo, m, options)
        
        # Sort the second half
        self.odd_even_merge_sort(array, lo + m, m, options)
        
        # Merge the two halves using odd-even merge
        if n > 1:
            self.record_state(array, {
                "type": "merge_start",
                "first_half": [lo, lo + m - 1],
                "second_half": [lo + m, lo + n - 1],
                "message": f"Merging sections [{lo}...{lo + m - 1}] and [{lo + m}...{lo + n - 1}]"
            })
            
            self.odd_even_merge(array, lo, n, 1, options)
            
            self.record_state(array, {
                "type": "merge_complete",
                "section": [lo, lo + n - 1],
                "message": f"Completed merge of section [{lo}...{lo + n - 1}]"
            })

    def odd_even_merge(self, 
                      array: List[Any], 
                      lo: int, 
                      n: int, 
                      r: int, 
                      options: Dict[str, Any]) -> None:
        """
        Merge operation for Odd-Even Merge Sort.
        
        Args:
            array: The array being sorted
            lo: Low index of the section to merge
            n: Size of the section to merge
            r: Distance between elements to compare
            options: Runtime options
        """
        # Create a new stage for the network visualization
        current_stage = {
            "comparators": [],
            "distance": r
        }
        
        # Adaptive termination check
        if options["adaptive_termination"] and self._is_sorted(array, lo, lo + n - 1):
            self.record_state(array, {
                "type": "early_termination",
                "section": [lo, lo + n - 1],
                "message": f"Section [{lo}...{lo + n - 1}] is already sorted, skipping merge"
            })
            return
        
        # Base case: Compare a single pair of elements
        if n == 2:
            self.compare_and_swap(array, lo, lo + r, current_stage)
            if self.options["visualize_network"] and current_stage["comparators"]:
                self.network_structure["stages"].append(current_stage)
            return
        
        # Recursive case: Divide and merge
        m = 2 * r
        
        # Recursively handle odd-even merge
        self.odd_even_merge(array, lo, n, m, options)
        self.odd_even_merge(array, lo + r, n, m, options)
        
        # Compare and swap elements at distance r
        for i in range(lo + r, lo + n - r, m):
            self.compare_and_swap(array, i, i + r, current_stage)
        
        # Add the stage to the network structure if it contains comparators
        if self.options["visualize_network"] and current_stage["comparators"]:
            self.network_structure["stages"].append(current_stage)
            self.network_structure["total_comparators"] += len(current_stage["comparators"])

    def compare_and_swap(self, 
                        array: List[Any], 
                        i: int, 
                        j: int, 
                        stage: Dict[str, Any]) -> None:
        """
        Compare and swap two elements if they are in the wrong order.
        
        Args:
            array: The array being sorted
            i: First index
            j: Second index
            stage: Current network stage for recording comparators
        """
        # Skip invalid indices
        if i >= len(array) or j >= len(array):
            return
        
        # Skip optimization if elements are already in order
        if self.options["optimize_comparators"]:
            if self.compare(array[i], array[j]) <= 0:
                # Elements are already in order, record comparison but don't swap
                if self.options["visualize_network"]:
                    stage["comparators"].append({
                        "indices": [i, j],
                        "swapped": False
                    })
                return
        
        # Compare elements and swap if needed
        if self.compare(array[i], array[j]) > 0:
            self.swap(array, i, j)
            
            # Record the comparator operation
            if self.options["visualize_network"]:
                stage["comparators"].append({
                    "indices": [i, j],
                    "swapped": True
                })
            
            # Record the state after swap
            self.record_state(array, {
                "type": "comparator_swap",
                "indices": [i, j],
                "distance": j - i,
                "values": [array[i], array[j]],
                "message": f"Swapped elements at indices {i} and {j} (distance {j - i})"
            })
        else:
            # Record the comparator operation (no swap)
            if self.options["visualize_network"]:
                stage["comparators"].append({
                    "indices": [i, j],
                    "swapped": False
                })

    def _is_sorted(self, array: List[Any], start: int, end: int) -> bool:
        """
        Check if a section of the array is already sorted.
        
        Args:
            array: The array to check
            start: Start index
            end: End index
            
        Returns:
            True if the section is sorted, False otherwise
        """
        for i in range(start, end):
            if self.compare(array[i], array[i + 1]) > 0:
                return False
        return True

    def get_complexity(self) -> Dict[str, Dict[str, str]]:
        """
        Get the time and space complexity of Odd-Even Merge Sort.
        
        Returns:
            Complexity information dictionary
        """
        return {
            "time": {
                "best": "O(n log²(n))",
                "average": "O(n log²(n))",
                "worst": "O(n log²(n))"
            },
            "space": {
                "best": "O(1)",
                "average": "O(1)",
                "worst": "O(1)"
            },
            "parallel": {
                "time": "O(log²(n))",
                "processors": "O(n log²(n))"
            }
        }

    def is_stable(self) -> bool:
        """
        Whether Odd-Even Merge Sort is stable (preserves relative order of equal elements).
        
        Returns:
            False as the standard implementation is not stable
        """
        return False

    def is_in_place(self) -> bool:
        """
        Whether Odd-Even Merge Sort is in-place (uses O(1) auxiliary space).
        
        Returns:
            True as Odd-Even Merge Sort is in-place
        """
        return True
    
    def get_info(self) -> Dict[str, Any]:
        """
        Get detailed information about the algorithm.
        
        Returns:
            Dictionary with algorithm details
        """
        info = super().get_info()
        
        # Add Odd-Even Merge Sort specific information
        info.update({
            "optimization": {
                "visualize_network": self.options.get("visualize_network", True),
                "optimize_comparators": self.options.get("optimize_comparators", True),
                "adaptive_termination": self.options.get("adaptive_termination", True)
            },
            "properties": {
                "comparison_based": True,
                "stable": False,
                "in_place": True,
                "parallel": True,
                "sorting_network": True
            },
            "network_properties": {
                "depth": "O(log²(n))",
                "size": "O(n log²(n))",
                "comparators": "O(n log²(n))"
            },
            "applications": [
                "Hardware sorting implementations",
                "Parallel computing environments",
                "FPGA and ASIC sorting circuits",
                "Multi-core CPU and GPU sorting",
                "Distributed systems with fixed communication patterns"
            ],
            "advantages": [
                "Fixed communication pattern ideal for hardware implementation",
                "Highly parallelizable with clear communication topology",
                "Efficient for specialized hardware implementations",
                "Predictable performance regardless of input distribution",
                "Well-suited for vectorization and SIMD operations"
            ],
            "disadvantages": [
                "Less efficient than other algorithms in sequential implementations",
                "Higher complexity than optimal comparison-based sorts",
                "Not adaptive to already-sorted or partially-sorted inputs",
                "More complex implementation compared to standard sorting algorithms",
                "Not stable in its standard implementation"
            ],
            "historical_significance": "Developed by Kenneth E. Batcher in 1968, Odd-Even Merge Sort was one of the first practical parallel sorting algorithms and remains important in hardware implementation of sorting networks."
        })
        
        return info


# Example usage
if __name__ == "__main__":
    # Create and run a simple test
    sorter = OddEvenMergeSort({
        "visualize_network": True,
        "optimize_comparators": True
    })
    
    test_array = [5, 3, 8, 4, 2, 9, 1, 7, 6]
    
    result = sorter.execute(test_array)
    print(f"Original array: {test_array}")
    print(f"Sorted array: {result}")
    print(f"Comparisons: {sorter.metrics['comparisons']}")
    print(f"Swaps: {sorter.metrics['swaps']}")
    
    # Print network statistics
    if sorter.options["visualize_network"]:
        print(f"Network stages: {len(sorter.network_structure['stages'])}")
        print(f"Total comparators: {sorter.network_structure['total_comparators']}")
