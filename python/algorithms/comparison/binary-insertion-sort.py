# algorithms/sorting/binary_insertion_sort.py

from typing import List, Any, Dict, Optional, Callable, Tuple
from algorithms.base_algorithm import Algorithm
import time

class BinaryInsertionSort(Algorithm):
    """
    Implementation of Binary Insertion Sort algorithm with comprehensive instrumentation.
    
    Binary Insertion Sort is an optimization of the standard insertion sort that uses
    binary search to find the correct insertion position, thereby reducing the number
    of comparisons needed. The algorithm still requires O(n²) time complexity in the 
    worst case due to the shifting operations, but the number of comparisons is
    reduced to O(n log n).
    
    Key characteristics:
    - Reduces comparisons from O(n²) to O(n log n) compared to standard insertion sort
    - Particularly effective when comparison operations are expensive
    - Maintains O(n²) worst-case time complexity due to shifting operations
    - Stable sorting algorithm that preserves the relative order of equal elements
    - In-place sorting with O(1) auxiliary space
    
    Time Complexity:
    - Best:    O(n) when array is already sorted
    - Average: O(n²)
    - Worst:   O(n²) when array is in reverse order
    
    Comparison Complexity:
    - Best:    O(n log n)
    - Average: O(n log n)
    - Worst:   O(n log n)
    
    Space Complexity:
    - O(1) (in-place sorting algorithm)
    """
    
    def __init__(self, options: Dict[str, Any] = None):
        """
        Initialize Binary Insertion Sort with options.
        
        Args:
            options: Dictionary of options including:
                - optimize_shifts: Use block shifting optimization
                - early_termination: Enable early termination when array is sorted
                - binary_threshold: Minimum array size for using binary search
                - animation_delay: Delay between steps for visualization
        """
        super().__init__("Binary Insertion Sort", "comparison", options)
        
        # Default options
        self.options.update({
            "optimize_shifts": True,      # Use optimized shifting technique
            "early_termination": True,    # Early termination optimization
            "binary_threshold": 10,       # Minimum size to use binary search (smaller arrays use linear search)
            "animation_delay": 0          # Delay between steps for visualization
        })
        
        # Override with provided options
        if options:
            self.options.update(options)

    def run(self, array: List[Any], options: Dict[str, Any]) -> List[Any]:
        """
        Execute Binary Insertion Sort on the provided array.
        
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
        
        # Flag to detect if any elements were moved
        any_swaps = False
        
        # Main loop - start from second element
        for i in range(1, n):
            # Current element to be inserted
            key = self.read(result, i)
            
            # Introduce delay for visualization if specified
            if options["animation_delay"] > 0:
                time.sleep(options["animation_delay"] / 1000)
            
            # Record the current state before insertion
            self.record_state(result, {
                "type": "insertion-start",
                "current": i,
                "key": key,
                "sorted_portion": i,
                "message": f"Inserting element {key} into sorted portion [0...{i-1}]"
            })
            
            # Find the insertion position using binary search if array is large enough
            if i >= options["binary_threshold"]:
                insert_pos = self.binary_search(result, key, 0, i - 1)
                
                self.record_state(result, {
                    "type": "binary-search",
                    "current": i,
                    "key": key,
                    "insert_position": insert_pos,
                    "message": f"Binary search found insertion position {insert_pos} for element {key}"
                })
            else:
                # For small arrays, use simple linear search for better performance
                insert_pos = self.linear_search(result, key, 0, i - 1)
                
                self.record_state(result, {
                    "type": "linear-search",
                    "current": i,
                    "key": key,
                    "insert_position": insert_pos,
                    "message": f"Linear search found insertion position {insert_pos} for element {key}"
                })
            
            # If the element is already in the correct position, skip shifting
            if insert_pos == i:
                self.record_state(result, {
                    "type": "skip-insertion",
                    "current": i,
                    "message": f"Element {key} is already in correct position {i}"
                })
                continue
            
            # Shifting elements to make room for insertion
            if options["optimize_shifts"]:
                # Optimized block shifting - faster for large arrays
                self.block_shift(result, insert_pos, i)
                any_swaps = True
            else:
                # Standard one-by-one shifting
                for j in range(i, insert_pos, -1):
                    self.write(result, j, self.read(result, j - 1))
                any_swaps = True
            
            # Insert the element at the correct position
            self.write(result, insert_pos, key)
            
            # Record the state after insertion
            self.record_state(result, {
                "type": "insertion-complete",
                "current": i,
                "key": key,
                "insert_position": insert_pos,
                "message": f"Inserted element {key} at position {insert_pos}"
            })
        
        self.set_phase("completed")
        
        # Record adaptive optimization information
        if options["early_termination"]:
            self.record_state(result, {
                "type": "optimization-info",
                "any_swaps": any_swaps,
                "message": "Some elements were reordered during sorting" 
                           if any_swaps else 
                           "Array was already sorted - could have terminated early"
            })
        
        return result

    def binary_search(self, array: List[Any], key: Any, low: int, high: int) -> int:
        """
        Perform binary search to find insertion position.
        
        Args:
            array: The array to search in
            key: The element to insert
            low: Start index of search range
            high: End index of search range
            
        Returns:
            Index where key should be inserted
        """
        self.record_state(array, {
            "type": "binary-search-start",
            "key": key,
            "range": [low, high],
            "message": f"Starting binary search for {key} in range [{low}...{high}]"
        })
        
        # Iterative binary search
        while low <= high:
            mid = low + (high - low) // 2
            
            mid_val = self.read(array, mid)
            comparison = self.compare(mid_val, key)
            
            self.record_state(array, {
                "type": "binary-search-step",
                "key": key,
                "mid": mid,
                "mid_value": mid_val,
                "comparison": comparison,
                "range": [low, high],
                "message": f"Comparing {key} with {mid_val} at position {mid}"
            })
            
            if comparison < 0:
                # Key is greater, search right half
                low = mid + 1
            elif comparison > 0:
                # Key is smaller, search left half
                high = mid - 1
            else:
                # Key already exists, insert after the last equal element
                # This maintains stability
                low = mid + 1
        
        self.record_state(array, {
            "type": "binary-search-end",
            "key": key,
            "position": low,
            "message": f"Binary search determined insertion position {low} for element {key}"
        })
        
        # 'low' is the insertion point
        return low

    def linear_search(self, array: List[Any], key: Any, low: int, high: int) -> int:
        """
        Perform linear search to find insertion position.
        Used for small arrays where binary search overhead is not justified.
        
        Args:
            array: The array to search in
            key: The element to insert
            low: Start index of search range
            high: End index of search range
            
        Returns:
            Index where key should be inserted
        """
        for i in range(low, high + 1):
            val = self.read(array, i)
            if self.compare(val, key) > 0:
                return i
        return high + 1

    def block_shift(self, array: List[Any], insert_pos: int, current: int) -> None:
        """
        Optimized block shift operation.
        Shifts elements from position [insert_pos...current-1] one position to the right.
        
        Args:
            array: Array to modify
            insert_pos: Start position for shifting
            current: End position (exclusive) for shifting
        """
        # Save the element that will be overwritten
        temp = self.read(array, current)
        
        # Shift elements to make room for insertion
        for j in range(current, insert_pos, -1):
            self.write(array, j, self.read(array, j - 1))
        
        # Record the shift operation
        self.record_state(array, {
            "type": "block-shift",
            "range": [insert_pos, current],
            "message": f"Shifted elements in range [{insert_pos}...{current-1}] one position right"
        })

    def get_complexity(self) -> Dict[str, Dict[str, str]]:
        """
        Get the time and space complexity of Binary Insertion Sort.
        
        Returns:
            Complexity information dictionary
        """
        return {
            "time": {
                "best": "O(n)",  # Already sorted array
                "average": "O(n²)",
                "worst": "O(n²)"  # Reverse sorted array
            },
            "comparisons": {
                "best": "O(n log n)",
                "average": "O(n log n)",
                "worst": "O(n log n)"
            },
            "space": {
                "best": "O(1)",
                "average": "O(1)",
                "worst": "O(1)"
            }
        }

    def is_stable(self) -> bool:
        """
        Whether Binary Insertion Sort is stable (preserves relative order of equal elements).
        
        Returns:
            True as Binary Insertion Sort is stable
        """
        return True

    def is_in_place(self) -> bool:
        """
        Whether Binary Insertion Sort is in-place (uses O(1) auxiliary space).
        
        Returns:
            True as Binary Insertion Sort is in-place
        """
        return True
    
    def get_info(self) -> Dict[str, Any]:
        """
        Get detailed information about the algorithm.
        
        Returns:
            Dictionary with algorithm details
        """
        info = super().get_info()
        
        # Add binary insertion sort specific information
        info.update({
            "optimization": {
                "optimize_shifts": self.options.get("optimize_shifts", True),
                "early_termination": self.options.get("early_termination", True),
                "binary_threshold": self.options.get("binary_threshold", 10)
            },
            "properties": {
                "comparison_based": True,
                "stable": True,
                "in_place": True,
                "online": True,  # Can sort as elements arrive
                "adaptive": True  # Performance improves with partially sorted input
            },
            "suitable_for": {
                "small_arrays": True,
                "nearly_sorted_arrays": True,
                "expensive_comparisons": True,  # Key advantage with binary search
                "online_processing": True  # Good for streaming data
            },
            "advantages": [
                "Reduces comparisons from O(n²) to O(n log n) compared to standard insertion sort",
                "Maintains stability, preserving order of equal elements",
                "Adaptive performance - efficient for nearly sorted arrays",
                "In-place sorting with minimal memory overhead",
                "Particularly effective when comparison operations are expensive"
            ],
            "disadvantages": [
                "Still requires O(n²) operations in worst case due to shifting operations",
                "Binary search overhead can actually slow down sorting for small arrays",
                "Less cache-efficient than standard insertion sort for small arrays",
                "Not suitable for large datasets compared to O(n log n) algorithms"
            ],
            "relationships": {
                "parent": "Insertion Sort",
                "variations": [
                    "Standard Insertion Sort",
                    "Shell Sort (gap insertion)",
                    "Library Sort (gapped insertion sort)"
                ]
            }
        })
        
        return info


# Example usage
if __name__ == "__main__":
    # Create and run a simple test
    sorter = BinaryInsertionSort({
        "optimize_shifts": True,
        "early_termination": True,
        "binary_threshold": 5
    })
    
    test_array = [5, 3, 8, 4, 2, 9, 1, 7, 6]
    
    result = sorter.execute(test_array)
    print(f"Original: {test_array}")
    print(f"Sorted: {result}")
    print(f"Comparisons: {sorter.metrics['comparisons']}")
    print(f"Writes: {sorter.metrics['writes']}")
