# algorithms/sorting/bitonic_sort.py

from typing import List, Any, Dict, Optional, Callable, Tuple, Set
from algorithms.base_algorithm import Algorithm
import time
import math

class BitonicSort(Algorithm):
    """
    Implementation of Bitonic Sort algorithm with visualization of the sorting network.
    
    Bitonic Sort is a parallel sorting algorithm that leverages a sorting network architecture.
    It works by:
    1. Recursively constructing a bitonic sequence (a sequence that first increases then decreases)
    2. Recursively splitting and merging bitonic sequences to sort the array
    
    Key properties:
    - Highly parallelizable with O(log²n) time complexity on n processors
    - Fixed data-independent comparison sequence, making it suitable for hardware implementation
    - Works optimally on arrays with length = 2^n
    
    This implementation includes:
    - Visualization of the bitonic sorting network
    - Parallelization simulation
    - Support for non-power-of-2 array sizes
    - Stage-by-stage execution for educational purposes
    
    Time Complexity:
    - Best/Average/Worst: O(log²n) with n processors
    - Sequential implementation: O(n log²n)
    
    Space Complexity: O(1) - in-place sorting algorithm
    """
    
    def __init__(self, options: Dict[str, Any] = None):
        """
        Initialize Bitonic Sort with options.
        
        Args:
            options: Dictionary of options including:
                - visualize_network: Visualize the sorting network
                - simulate_parallelism: Simulate parallel execution
                - support_non_power_of_two: Support non-power-of-2 array sizes
                - stage_by_stage: Execute and visualize stage by stage
        """
        super().__init__("Bitonic Sort", "parallel", options)
        
        # Default options
        self.options.update({
            "visualize_network": True,       # Visualize the sorting network
            "simulate_parallelism": True,    # Simulate parallel execution
            "support_non_power_of_two": True, # Support non-power-of-2 array sizes
            "stage_by_stage": True,          # Execute and visualize stage by stage
            "animation_delay": 0             # Delay between steps for visualization
        })
        
        # Override with provided options
        if options:
            self.options.update(options)
        
        # Network visualization data
        self.network = {
            "stages": [],          # Stages of the sorting network
            "comparators": [],     # Comparator connections
            "current_stage": 0,    # Current stage being executed
            "total_stages": 0      # Total number of stages
        }

    def run(self, array: List[Any], options: Dict[str, Any]) -> List[Any]:
        """
        Execute Bitonic Sort on the provided array.
        
        Args:
            array: The array to sort
            options: Runtime options
            
        Returns:
            The sorted array
        """
        # Make a copy to avoid modifying the original
        result = array.copy()
        n = len(result)
        
        # Early return for small arrays
        if n <= 1:
            return result
            
        self.set_phase("initialization")
        
        # Handle non-power-of-2 array sizes if enabled
        if options["support_non_power_of_two"]:
            padded_array = self.pad_to_power_of_two(result)
            
            # Record padding operation
            if len(padded_array) > n:
                self.record_state(padded_array, {
                    "type": "padding",
                    "original_length": n,
                    "padded_length": len(padded_array),
                    "message": f"Padded array to length {len(padded_array)} (next power of 2)"
                })
            
            # Sort the padded array
            self.bitonic_sort(padded_array, 0, len(padded_array), True, options)
            
            # Return only the original elements (removing padding)
            return padded_array[:n]
        
        # Sort the array directly if it's already a power of 2
        self.bitonic_sort(result, 0, n, True, options)
        
        self.set_phase("completed")
        return result

    def bitonic_sort(self, array: List[Any], low: int, count: int, direction: bool, options: Dict[str, Any]) -> None:
        """
        Main Bitonic Sort recursive implementation.
        
        Args:
            array: Array to sort
            low: Starting index
            count: Number of elements to sort
            direction: Sorting direction (True for ascending, False for descending)
            options: Runtime options
        """
        if count <= 1:
            return
        
        # Introduce delay for visualization if specified
        if options["animation_delay"] > 0:
            time.sleep(options["animation_delay"] / 1000)
        
        # Divide the array into two halves
        mid = count // 2
        
        # Record the division
        self.record_state(array, {
            "type": "divide",
            "low": low,
            "mid": low + mid,
            "high": low + count - 1,
            "message": f"Dividing array section [{low}...{low + count - 1}] at {low + mid - 1}"
        })
        
        # Recursively sort the first half in ascending order
        self.bitonic_sort(array, low, mid, True, options)
        
        # Recursively sort the second half in descending order (to create bitonic sequence)
        self.bitonic_sort(array, low + mid, mid, False, options)
        
        # Merge the bitonic sequence
        self.bitonic_merge(array, low, count, direction, options)

    def bitonic_merge(self, array: List[Any], low: int, count: int, direction: bool, options: Dict[str, Any]) -> None:
        """
        Merge a bitonic sequence.
        
        Args:
            array: Array containing the bitonic sequence
            low: Starting index
            count: Number of elements to merge
            direction: Merge direction (True for ascending, False for descending)
            options: Runtime options
        """
        if count <= 1:
            return
        
        # Introduce delay for visualization if specified
        if options["animation_delay"] > 0:
            time.sleep(options["animation_delay"] / 1000)
        
        mid = count // 2
        
        # Perform comparisons between pairs of elements
        for i in range(low, low + mid):
            self.bitonic_compare(array, i, i + mid, direction, options)
        
        # Record the comparison phase
        if options["visualize_network"]:
            stage_info = {
                "type": "merge-stage",
                "low": low,
                "count": count,
                "comparisons": [[low + i, low + mid + i] for i in range(mid)],
                "direction": direction,
                "message": f"Merging bitonic sequence [{low}...{low + count - 1}], direction: {'ascending' if direction else 'descending'}"
            }
            
            self.network["stages"].append(stage_info)
            self.network["current_stage"] = len(self.network["stages"]) - 1
            self.network["total_stages"] = len(self.network["stages"])
            
            self.record_state(array, {
                **stage_info,
                "network": self.network.copy()
            })
        
        # Recursively merge the two halves
        self.bitonic_merge(array, low, mid, direction, options)
        self.bitonic_merge(array, low + mid, mid, direction, options)

    def bitonic_compare(self, array: List[Any], i: int, j: int, direction: bool, options: Dict[str, Any]) -> None:
        """
        Perform a bitonic compare-exchange operation.
        
        Args:
            array: Array to operate on
            i: First index
            j: Second index
            direction: Comparison direction (True for ascending, False for descending)
            options: Runtime options
        """
        # Skip if indices are out of bounds
        if i >= len(array) or j >= len(array):
            return
        
        # Introduce delay for visualization if specified
        if options["animation_delay"] > 0:
            time.sleep(options["animation_delay"] / 1000)
        
        # Compare elements
        comp_result = self.compare(array[i], array[j])
        
        # Swap if needed based on direction
        if (direction and comp_result > 0) or (not direction and comp_result < 0):
            self.swap(array, i, j)
            
            # Record the swap
            self.record_state(array, {
                "type": "compare-exchange",
                "indices": [i, j],
                "direction": direction,
                "message": f"Compare-exchange: Swapped elements at indices {i} and {j} (direction: {'ascending' if direction else 'descending'})"
            })
        else:
            # Record the comparison (no swap needed)
            self.record_state(array, {
                "type": "compare-no-exchange",
                "indices": [i, j],
                "direction": direction,
                "message": f"Compare-exchange: No swap needed between indices {i} and {j} (direction: {'ascending' if direction else 'descending'})"
            })
        
        # Add this comparator to the network visualization
        if options["visualize_network"]:
            self.network["comparators"].append({
                "from": i,
                "to": j,
                "direction": direction,
                "swapped": (direction and comp_result > 0) or (not direction and comp_result < 0)
            })

    def pad_to_power_of_two(self, array: List[Any]) -> List[Any]:
        """
        Pad array to next power of 2 for Bitonic Sort.
        
        Args:
            array: Original array
            
        Returns:
            Padded array with length = next power of 2
        """
        n = len(array)
        
        # Check if already a power of 2
        if (n & (n - 1)) == 0:
            return array.copy()
        
        # Calculate next power of 2
        next_pow2 = 2 ** math.ceil(math.log2(n))
        
        # Create padded array
        result = array.copy()
        
        # Find max value to use for padding
        max_val = max(array + [float('-inf')]) + 1
        
        # Fill remaining slots with a value larger than any in the original array
        # This ensures these elements end up at the end after sorting
        for i in range(n, next_pow2):
            result.append(max_val)
        
        return result

    def get_complexity(self) -> Dict[str, Dict[str, str]]:
        """
        Get the time and space complexity of Bitonic Sort.
        
        Returns:
            Complexity information dictionary
        """
        return {
            "time": {
                "best": "O(log²n)",      # With n processors
                "average": "O(log²n)",   # With n processors
                "worst": "O(log²n)",     # With n processors
                "sequential": "O(n log²n)"  # Sequential implementation
            },
            "space": {
                "best": "O(1)",
                "average": "O(1)",
                "worst": "O(1)"
            },
            "comparisons": {
                "total": "O(n log²n)"
            }
        }

    def is_stable(self) -> bool:
        """
        Whether Bitonic Sort is stable (preserves relative order of equal elements).
        
        Returns:
            False as Bitonic Sort is not stable
        """
        return False

    def is_in_place(self) -> bool:
        """
        Whether Bitonic Sort is in-place (uses O(1) auxiliary space).
        
        Returns:
            True as Bitonic Sort is in-place
        """
        return True
    
    def get_info(self) -> Dict[str, Any]:
        """
        Get detailed information about the algorithm.
        
        Returns:
            Dictionary with algorithm details
        """
        info = super().get_info()
        
        # Add bitonic sort specific information
        info.update({
            "optimization": {
                "visualize_network": self.options.get("visualize_network", True),
                "simulate_parallelism": self.options.get("simulate_parallelism", True),
                "support_non_power_of_two": self.options.get("support_non_power_of_two", True),
                "stage_by_stage": self.options.get("stage_by_stage", True)
            },
            "properties": {
                "comparison_based": True,
                "stable": False,
                "in_place": True,
                "online": False,
                "parallelizable": True,
                "deterministic_network": True
            },
            "suitable_for": {
                "parallel_hardware": True,
                "gpu_implementation": True,
                "fixed_size_arrays": True,
                "power_of_two_sizes": True,
                "fpga_implementation": True
            },
            "variants": [
                "Standard Bitonic Sort",
                "Odd-Even Bitonic Merge Sort",
                "Parallel Bitonic Sort",
                "Adaptive Bitonic Sort"
            ],
            "advantages": [
                "Highly parallelizable with O(log²n) parallel time complexity",
                "Fixed comparison pattern regardless of input data",
                "Well-suited for hardware implementation (FPGA, GPU)",
                "In-place with O(1) auxiliary space",
                "Predictable performance across all inputs"
            ],
            "disadvantages": [
                "Not stable (does not preserve order of equal elements)",
                "Requires power-of-2 array size (or padding)",
                "O(n log²n) sequential time complexity is worse than O(n log n) algorithms",
                "Complex to understand and implement correctly",
                "Less efficient for serial processing compared to quicksort or mergesort"
            ],
            "applications": [
                "GPU sorting implementations",
                "FPGA-based sorting networks",
                "High-performance computing where parallel resources are available",
                "Fixed-size sorting applications in hardware",
                "Data routing in network switches"
            ]
        })
        
        return info


# Example usage
if __name__ == "__main__":
    # Create and run a simple test
    sorter = BitonicSort({
        "visualize_network": True,
        "support_non_power_of_two": True
    })
    
    test_array = [5, 3, 8, 4, 2, 9, 1, 7, 6]
    
    result = sorter.execute(test_array)
    print(f"Original: {test_array}")
    print(f"Sorted: {result}")
    print(f"Comparisons: {sorter.metrics['comparisons']}")
    print(f"Swaps: {sorter.metrics['swaps']}")
