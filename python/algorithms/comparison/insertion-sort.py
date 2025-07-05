# algorithms/sorting/insertion_sort.py

from typing import List, Any, Dict, Optional, Callable, Tuple
from algorithms.base_algorithm import Algorithm
import time
import math

class InsertionSort(Algorithm):
    """
    Implementation of Insertion Sort with multiple optimization variants.
    
    Insertion Sort builds the final sorted array one item at a time by repeatedly
    taking the next unsorted element and inserting it into its correct position
    within the already-sorted portion of the array.
    
    This implementation includes optimizations:
    - Binary search for finding insertion position (reduces comparisons)
    - Early termination when no shifts occur in a pass
    - Gap insertion for improved performance on certain datasets
    
    Time Complexity:
    - Best:    O(n) when array is already sorted
    - Average: O(n²)
    - Worst:   O(n²) when array is in reverse order
    
    Space Complexity: O(1) - truly in-place
    """
    
    def __init__(self, options: Dict[str, Any] = None):
        """
        Initialize Insertion Sort with options.
        
        Args:
            options: Dictionary of options including:
                - use_binary_search: Use binary search to find insertion position
                - early_termination: Stop when no shifts occur
                - gap_size: Gap between compared elements (1 for classic)
        """
        super().__init__("Insertion Sort", "comparison", options)
        
        # Default options
        self.options.update({
            "use_binary_search": False,  # Use binary search to find insertion position
            "early_termination": True,   # Stop when no shifts occur in a pass
            "gap_size": 1,               # Gap between compared elements (1 for classic)
            "animation_delay": 0         # Delay between steps for visualization
        })
        
        # Override with provided options
        if options:
            self.options.update(options)

    def run(self, array: List[Any], options: Dict[str, Any]) -> List[Any]:
        """
        Execute Insertion Sort on the provided array.
        
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
        
        self.set_phase("sorting")
        
        # Select appropriate insertion sort variant
        if options["use_binary_search"]:
            self._binary_insertion_sort(result, options)
        elif options["gap_size"] > 1:
            self._gap_insertion_sort(result, options)
        else:
            self._classic_insertion_sort(result, options)
        
        self.set_phase("completed")
        return result

    def _classic_insertion_sort(self, array: List[Any], options: Dict[str, Any]) -> None:
        """
        Classic implementation of Insertion Sort.
        
        Args:
            array: Array to be sorted
            options: Runtime options
        """
        n = len(array)
        shifts = 0
        
        for i in range(1, n):
            # Record the current position being processed
            self.record_state(array, {
                "type": "insertion-start",
                "index": i,
                "message": f"Starting insertion for element at index {i}"
            })
            
            # Introduce delay for visualization if specified
            if options["animation_delay"] > 0:
                time.sleep(options["animation_delay"] / 1000)
            
            # Current element to be inserted into sorted portion
            key = self.read(array, i)
            j = i - 1
            
            # Find position for key in the sorted portion
            position_found = False
            
            while j >= 0 and self.compare(self.read(array, j), key) > 0:
                # Shift elements to make room for key
                self.write(array, j + 1, self.read(array, j))
                j -= 1
                shifts += 1
                
                # Introduce delay for visualization if specified
                if options["animation_delay"] > 0:
                    time.sleep(options["animation_delay"] / 1000)
                
                # Record significant shifting steps
                if j % 5 == 0 or j == 0:
                    self.record_state(array, {
                        "type": "shift-operation",
                        "moved_from": j + 1,
                        "moved_to": j + 2,
                        "message": f"Shifted element right to make room for {key}"
                    })
            
            # Insert the key at its correct position
            if j + 1 != i:
                self.write(array, j + 1, key)
                
                # Record the insertion
                self.record_state(array, {
                    "type": "insertion-complete",
                    "index": j + 1,
                    "element": key,
                    "message": f"Inserted element {key} at position {j + 1}"
                })
            else:
                # Element already in correct position
                self.record_state(array, {
                    "type": "no-movement",
                    "index": i,
                    "message": f"Element {key} already in correct position"
                })
            
            # Mark sorted region
            self.record_state(array, {
                "type": "sorted-region",
                "end_index": i,
                "message": f"Array is now sorted up to index {i}"
            })
        
        # Check if early termination could be applied (for educational purposes)
        if options["early_termination"] and shifts == 0:
            self.record_state(array, {
                "type": "early-termination",
                "message": "Array was already sorted, could have terminated early"
            })

    def _binary_insertion_sort(self, array: List[Any], options: Dict[str, Any]) -> None:
        """
        Binary Insertion Sort - uses binary search to find insertion position.
        Reduces number of comparisons but not assignments.
        
        Args:
            array: Array to be sorted
            options: Runtime options
        """
        n = len(array)
        shifts = 0
        
        for i in range(1, n):
            # Record the current position being processed
            self.record_state(array, {
                "type": "insertion-start",
                "index": i,
                "message": f"Starting binary insertion for element at index {i}"
            })
            
            # Introduce delay for visualization if specified
            if options["animation_delay"] > 0:
                time.sleep(options["animation_delay"] / 1000)
            
            # Current element to be inserted
            key = self.read(array, i)
            
            # Use binary search to find insertion position
            insertion_pos = self._find_insertion_position(array, key, 0, i - 1)
            
            # Record binary search result
            self.record_state(array, {
                "type": "binary-search",
                "element": key,
                "position": insertion_pos,
                "message": f"Binary search found insertion position {insertion_pos} for element {key}"
            })
            
            # If the element is already in correct position, skip shifting
            if insertion_pos == i:
                self.record_state(array, {
                    "type": "no-movement",
                    "index": i,
                    "message": f"Element {key} already in correct position"
                })
                continue
            
            # Shift all elements to the right
            for j in range(i - 1, insertion_pos - 1, -1):
                self.write(array, j + 1, self.read(array, j))
                shifts += 1
                
                # Introduce delay for visualization if specified
                if options["animation_delay"] > 0:
                    time.sleep(options["animation_delay"] / 1000)
                
                # Record significant shifting steps
                if (j - insertion_pos) % 5 == 0 or j == insertion_pos:
                    self.record_state(array, {
                        "type": "shift-operation",
                        "moved_from": j,
                        "moved_to": j + 1,
                        "message": f"Shifted element right to make room for {key}"
                    })
            
            # Insert the element
            self.write(array, insertion_pos, key)
            
            # Record the insertion
            self.record_state(array, {
                "type": "insertion-complete",
                "index": insertion_pos,
                "element": key,
                "message": f"Inserted element {key} at position {insertion_pos}"
            })
            
            # Mark sorted region
            self.record_state(array, {
                "type": "sorted-region",
                "end_index": i,
                "message": f"Array is now sorted up to index {i}"
            })

    def _gap_insertion_sort(self, array: List[Any], options: Dict[str, Any]) -> None:
        """
        Gap Insertion Sort - generalization that allows sorting with a gap.
        Setting gap > 1 implements a single pass of Shell Sort.
        
        Args:
            array: Array to be sorted
            options: Runtime options
        """
        n = len(array)
        gap = options["gap_size"]
        
        self.record_state(array, {
            "type": "gap-insertion",
            "gap": gap,
            "message": f"Performing insertion sort with gap size {gap}"
        })
        
        # Sort each subarray defined by the gap
        for start in range(gap):
            # Record subarray start
            self.record_state(array, {
                "type": "gap-subarray",
                "start": start,
                "gap": gap,
                "message": f"Sorting subarray starting at index {start} with gap {gap}"
            })
            
            # Insertion sort on the subarray
            for i in range(start + gap, n, gap):
                key = self.read(array, i)
                j = i - gap
                
                # Introduce delay for visualization if specified
                if options["animation_delay"] > 0:
                    time.sleep(options["animation_delay"] / 1000)
                
                while j >= 0 and self.compare(self.read(array, j), key) > 0:
                    self.write(array, j + gap, self.read(array, j))
                    j -= gap
                    
                    # Record shift operation
                    self.record_state(array, {
                        "type": "gap-shift",
                        "from": j + gap,
                        "to": j + 2 * gap,
                        "gap": gap,
                        "message": f"Shifted element at index {j + gap} with gap {gap}"
                    })
                
                self.write(array, j + gap, key)
                
                # Record insertion with gap
                self.record_state(array, {
                    "type": "gap-insertion-complete",
                    "index": j + gap,
                    "element": key,
                    "gap": gap,
                    "message": f"Inserted element {key} at position {j + gap} with gap {gap}"
                })
        
        # Final state after all subarrays sorted
        self.record_state(array, {
            "type": "gap-complete",
            "gap": gap,
            "message": f"Completed insertion sort with gap size {gap}"
        })

    def _find_insertion_position(self, array: List[Any], key: Any, low: int, high: int) -> int:
        """
        Binary search to find insertion position.
        Optimization to reduce the number of comparisons.
        
        Args:
            array: The array to search in
            key: The element to insert
            low: Start index of sorted portion
            high: End index of sorted portion
            
        Returns:
            Index where key should be inserted
        """
        # Record binary search start
        self.record_state(array, {
            "type": "binary-search-start",
            "element": key,
            "low": low,
            "high": high,
            "message": f"Starting binary search for position of {key} between indices {low} and {high}"
        })
        
        # Base case: narrowed down to a single position
        if high <= low:
            return low + 1 if self.compare(key, self.read(array, low)) >= 0 else low
        
        # Find the middle point
        mid = (low + high) // 2
        
        # Record comparison at middle
        self.record_state(array, {
            "type": "binary-comparison",
            "element": key,
            "compare_index": mid,
            "compare_value": array[mid],
            "message": f"Comparing {key} with element at index {mid} ({array[mid]})"
        })
        
        # Recursive search in appropriate half
        if self.compare(key, self.read(array, mid)) < 0:
            return self._find_insertion_position(array, key, low, mid - 1)
        else:
            return self._find_insertion_position(array, key, mid + 1, high)

    def get_complexity(self) -> Dict[str, Dict[str, str]]:
        """
        Get the time and space complexity of Insertion Sort.
        
        Returns:
            Complexity information dictionary
        """
        use_binary_search = self.options["use_binary_search"]
        
        return {
            "time": {
                "best": "O(n)",
                "average": "O(n²)",
                "worst": "O(n²)"
            },
            "space": {
                "best": "O(1)",
                "average": "O(1)",
                "worst": "O(1)"
            },
            "comparisons": {
                "best": "O(n)",
                "average": "O(n log n)" if use_binary_search else "O(n²)",
                "worst": "O(n log n)" if use_binary_search else "O(n²)"
            },
            "assignments": {
                "best": "O(n)",
                "average": "O(n²)",
                "worst": "O(n²)"
            }
        }

    def is_stable(self) -> bool:
        """
        Whether Insertion Sort is stable (preserves relative order of equal elements).
        
        Returns:
            True as Insertion Sort is stable
        """
        return True

    def is_in_place(self) -> bool:
        """
        Whether Insertion Sort is in-place (uses O(1) auxiliary space).
        
        Returns:
            True as Insertion Sort is in-place
        """
        return True
    
    def get_info(self) -> Dict[str, Any]:
        """
        Get detailed information about the algorithm.
        
        Returns:
            Dictionary with algorithm details
        """
        info = super().get_info()
        
        # Add insertion sort specific information
        info.update({
            "optimization": {
                "use_binary_search": self.options.get("use_binary_search", False),
                "early_termination": self.options.get("early_termination", True),
                "gap_size": self.options.get("gap_size", 1)
            },
            "properties": {
                "comparison_based": True,
                "stable": True,
                "in_place": True,
                "online": True,  # Can sort as elements arrive
                "adaptive": True  # Performance improves with partially sorted arrays
            },
            "suitable_for": {
                "small_arrays": True,
                "nearly_sorted_arrays": True,
                "continuous_input": True,  # Good for ongoing/streaming data
                "large_arrays": False
            },
            "variants": [
                "Classic Insertion Sort",
                "Binary Insertion Sort",
                "Gap Insertion Sort (Shell Sort with single gap)",
                "Two-way Insertion Sort",
                "Linked List Insertion Sort"
            ],
            "advantages": [
                "Simple implementation with minimal code",
                "Efficient for small datasets (often used as a base case in recursive sorts)",
                "Adaptive - O(n) time for nearly sorted data",
                "Stable - preserves relative order of equal elements",
                "In-place - requires minimal extra memory",
                "Online - can sort as new elements arrive"
            ],
            "disadvantages": [
                "O(n²) time complexity makes it inefficient for large datasets",
                "Many writes/shifts even when using binary search optimization",
                "Much slower than advanced algorithms like quicksort and mergesort",
                "Poor cache performance due to shifting elements"
            ],
            "educational_insights": [
                "Demonstrates the concept of growing a sorted region incrementally",
                "Provides intuition for adaptive sorting behavior",
                "Foundation for understanding more complex algorithms like Shell Sort and Timsort",
                "Illustrates the distinction between comparison efficiency and write efficiency"
            ]
        })
        
        return info


# Example usage
if __name__ == "__main__":
    # Create and run a simple test
    sorter = InsertionSort({
        "use_binary_search": True,
        "early_termination": True
    })
    
    test_array = [5, 2, 4, 6, 1, 3]
    
    result = sorter.execute(test_array)
    print(f"Original: {test_array}")
    print(f"Sorted: {result}")
    print(f"Comparisons: {sorter.metrics['comparisons']}")
    print(f"Metrics: {sorter.metrics}")
