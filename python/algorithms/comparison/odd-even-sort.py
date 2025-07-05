# python/algorithms/comparison/odd_even_sort.py

from typing import List, Any, Dict, Optional, Callable, Tuple
from algorithms.base_algorithm import Algorithm
import time

class OddEvenSort(Algorithm):
    """
    Implementation of Odd-Even Sort (Brick Sort) algorithm with comprehensive instrumentation.
    
    Odd-Even Sort is a parallel comparison-based sorting algorithm that operates in two phases:
    1. Compare and swap odd-indexed elements with their even-indexed neighbors
    2. Compare and swap even-indexed elements with their odd-indexed neighbors
    
    This implementation includes:
    - Complete instrumentation for educational visualization
    - Early termination optimization
    - Detailed phase tracking for performance analysis
    - Parallel sorting simulation capabilities
    
    Time Complexity:
    - Best:    O(n)     when array is already sorted
    - Average: O(n²)    for most input distributions
    - Worst:   O(n²)    for adversarial inputs (e.g., reverse sorted)
    
    Space Complexity: O(1) - truly in-place with constant auxiliary space
    
    Stability: Stable - preserves relative order of equal elements
    
    Parallelization: Naturally parallel algorithm with potential for O(n) time using O(n) processors
    """
    
    def __init__(self, options: Dict[str, Any] = None):
        """
        Initialize Odd-Even Sort with options.
        
        Args:
            options: Dictionary of options including:
                - early_termination: Enable early termination when no swaps occur
                - simulate_parallel: Simulate parallel execution visualization
                - detailed_phase_tracking: Track odd and even phases separately
        """
        super().__init__("Odd-Even Sort", "comparison", options)
        
        # Default options
        self.options.update({
            "early_termination": True,        # Enable early termination optimization
            "simulate_parallel": False,       # Simulate parallel execution visualization
            "detailed_phase_tracking": True,  # Track odd and even phases separately
            "animation_delay": 0              # Delay between steps for visualization
        })
        
        # Override with provided options
        if options:
            self.options.update(options)

    def run(self, array: List[Any], options: Dict[str, Any]) -> List[Any]:
        """
        Execute Odd-Even Sort on the provided array.
        
        Args:
            array: The array to sort
            options: Runtime options
            
        Returns:
            The sorted array
        """
        # Make a copy to avoid modifying the original
        result = array.copy()
        n = len(result)
        
        # Early return for trivially sorted arrays
        if n <= 1:
            return result
        
        # Track if array is sorted
        is_sorted = False
        
        # Iterate until the array is sorted
        phase = 0
        
        self.set_phase("sorting")
        
        while not is_sorted:
            phase += 1
            is_sorted = True  # Assume sorted until a swap occurs
            
            # Odd phase (odd-indexed elements compared with their even-indexed neighbors)
            if self.options["detailed_phase_tracking"]:
                self.record_state(result, {
                    "type": "phase-start",
                    "phase": phase,
                    "sub_phase": "odd",
                    "message": f"Starting odd-indexed comparison phase {phase}"
                })
            
            # Process all odd-indexed pairs
            swapped = self.execute_phase(result, 1, n, "odd", phase)
            if swapped:
                is_sorted = False
            
            # If no swaps occurred during both phases and early termination is enabled, we can exit
            if is_sorted and self.options["early_termination"]:
                self.record_state(result, {
                    "type": "early-termination",
                    "phase": phase,
                    "message": f"Early termination after phase {phase} - array is sorted"
                })
                break
            
            # Even phase (even-indexed elements compared with their odd-indexed neighbors)
            if self.options["detailed_phase_tracking"]:
                self.record_state(result, {
                    "type": "phase-start",
                    "phase": phase,
                    "sub_phase": "even",
                    "message": f"Starting even-indexed comparison phase {phase}"
                })
            
            # Process all even-indexed pairs
            swapped = self.execute_phase(result, 0, n - 1, "even", phase)
            if swapped:
                is_sorted = False
            
            # Record the state after each complete phase
            self.record_state(result, {
                "type": "phase-complete",
                "phase": phase,
                "sorted": is_sorted,
                "message": f"Completed phase {phase}{' - array is sorted' if is_sorted else ''}"
            })
        
        self.set_phase("completed")
        return result

    def execute_phase(self, 
                     array: List[Any], 
                     start: int, 
                     end: int, 
                     phase_type: str, 
                     phase_number: int) -> bool:
        """
        Execute a single phase (odd or even) of the Odd-Even Sort.
        
        Args:
            array: The array being sorted
            start: Starting index for this phase
            end: Ending index for this phase
            phase_type: Type of phase ('odd' or 'even')
            phase_number: Current phase number
            
        Returns:
            Boolean indicating whether any swaps occurred
        """
        # Track if any swaps occurred during this phase
        swapped = False
        
        # In the parallel simulation, all comparisons in a phase happen simultaneously
        # We'll collect all swap operations and apply them at once to simulate this
        swap_pairs = []
        
        # Introduce delay for visualization if specified
        if self.options["animation_delay"] > 0:
            time.sleep(self.options["animation_delay"] / 1000)
        
        # First pass: Identify all pairs that need swapping
        for i in range(start, end, 2):
            # Ensure the second element exists
            if i + 1 < end:
                # Record the comparison operation
                self.record_state(array, {
                    "type": "comparison",
                    "indices": [i, i + 1],
                    "phase": phase_number,
                    "sub_phase": phase_type,
                    "message": f"Comparing element at index {i} with element at index {i + 1}"
                })
                
                # Compare adjacent elements
                if self.compare(array[i], array[i + 1]) > 0:
                    # In parallel mode, we just record the swap for later execution
                    if self.options["simulate_parallel"]:
                        swap_pairs.append((i, i + 1))
                    else:
                        # In sequential mode, perform the swap immediately
                        self.swap(array, i, i + 1)
                        swapped = True
                        
                        # Record the swap operation
                        self.record_state(array, {
                            "type": "swap",
                            "indices": [i, i + 1],
                            "phase": phase_number,
                            "sub_phase": phase_type,
                            "message": f"Swapped elements at indices {i} and {i + 1}"
                        })
        
        # In parallel simulation mode, apply all swaps simultaneously
        if self.options["simulate_parallel"] and swap_pairs:
            # Create a copy of the array for visualization purposes
            before_swap = array.copy()
            
            # Apply all swaps
            for i, j in swap_pairs:
                self.swap(array, i, j)
                swapped = True
            
            # Record the parallel swap operation
            self.record_state(array, {
                "type": "parallel-swap",
                "swap_pairs": swap_pairs,
                "before_state": before_swap,
                "phase": phase_number,
                "sub_phase": phase_type,
                "message": f"Performed {len(swap_pairs)} swaps in parallel during {phase_type} phase {phase_number}"
            })
        
        return swapped

    def get_complexity(self) -> Dict[str, Dict[str, str]]:
        """
        Get the time and space complexity of Odd-Even Sort.
        
        Returns:
            Complexity information dictionary
        """
        return {
            "time": {
                "best": "O(n)",
                "average": "O(n²)",
                "worst": "O(n²)",
                "parallel": "O(n) with O(n) processors"
            },
            "space": {
                "best": "O(1)",
                "average": "O(1)",
                "worst": "O(1)"
            }
        }

    def is_stable(self) -> bool:
        """
        Whether Odd-Even Sort is stable (preserves relative order of equal elements).
        
        Returns:
            True as Odd-Even Sort is stable
        """
        return True

    def is_in_place(self) -> bool:
        """
        Whether Odd-Even Sort is in-place (uses O(1) auxiliary space).
        
        Returns:
            True as Odd-Even Sort is in-place
        """
        return True
    
    def get_info(self) -> Dict[str, Any]:
        """
        Get detailed information about the algorithm.
        
        Returns:
            Dictionary with algorithm details
        """
        info = super().get_info()
        
        # Add Odd-Even Sort specific information
        info.update({
            "optimization": {
                "early_termination": self.options.get("early_termination", True),
                "simulate_parallel": self.options.get("simulate_parallel", False),
                "detailed_phase_tracking": self.options.get("detailed_phase_tracking", True)
            },
            "properties": {
                "comparison_based": True,
                "stable": True,
                "in_place": True,
                "online": False,
                "parallelizable": True
            },
            "parallel_characteristics": {
                "data_distribution": "Evenly distributed",
                "synchronization_points": "Between odd and even phases",
                "theoretical_parallel_time": "O(n) with O(n) processors",
                "communication_overhead": "Minimal - only adjacent processors communicate",
                "architecture_affinity": "Excellent for SIMD architectures and mesh-connected parallel computers"
            },
            "applications": [
                "Parallel computing environments",
                "SIMD (Single Instruction Multiple Data) architectures",
                "Systolic arrays and mesh-connected parallel computers",
                "Educational illustration of parallel sorting algorithms",
                "Hardware implementations where simplicity is valued over performance"
            ],
            "advantages": [
                "Simple implementation with no complex data structures",
                "Naturally parallelizable with minimal communication overhead",
                "Stable sorting (preserves order of equal elements)",
                "In-place with constant extra memory usage",
                "Predictable performance characteristics"
            ],
            "disadvantages": [
                "Inefficient O(n²) sequential time complexity",
                "Not adaptive to pre-sorted or partially sorted inputs",
                "Performs unnecessary comparisons even when array is sorted",
                "Requires O(n) processors for optimal parallel performance",
                "Not competitive with more sophisticated algorithms for sequential processing"
            ],
            "related_algorithms": [
                "Bubble Sort (similar sequential behavior)",
                "Cocktail Shaker Sort (bidirectional variant)",
                "Shell Sort (more efficient generalization)",
                "Bitonic Sort (another parallelizable sorting network)"
            ]
        })
        
        return info


# Example usage
if __name__ == "__main__":
    # Create and run a simple test
    sorter = OddEvenSort({
        "early_termination": True,
        "detailed_phase_tracking": True
    })
    
    test_array = [5, 3, 8, 4, 2, 9, 1, 7, 6]
    
    result = sorter.execute(test_array)
    print(f"Original: {test_array}")
    print(f"Sorted: {result}")
    print(f"Phases: {sorter.metrics.get('phases', 0)}")
    print(f"Comparisons: {sorter.metrics['comparisons']}")
    print(f"Swaps: {sorter.metrics['swaps']}")
