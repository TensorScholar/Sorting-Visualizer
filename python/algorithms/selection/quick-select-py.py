# algorithms/selection/quick_select.py

from typing import List, Any, Dict, Optional, Callable, Tuple
from algorithms.base_algorithm import Algorithm
import time
import random
import math

class QuickSelect(Algorithm):
    """
    Implementation of Quick Select algorithm with multiple optimization strategies.
    
    Quick Select is an efficient selection algorithm to find the k-th smallest element
    in an unordered list. It's based on the partitioning method from QuickSort but
    only recursively processes one side of the partition.
    
    This implementation includes optimizations:
    - Multiple pivot selection strategies
    - Small array optimization with insertion sort
    - Deterministic selection with median-of-medians option
    - Detailed visualization of partitioning process
    
    Average-case time complexity: O(n)
    Worst-case time complexity: O(n²) with basic implementation, O(n) with median-of-medians
    """
    
    def __init__(self, options: Dict[str, Any] = None):
        """
        Initialize Quick Select with options.
        
        Args:
            options: Dictionary of options including:
                - pivot_strategy: Strategy for selecting pivot
                - use_median_of_medians: Use deterministic median-of-medians approach
                - insertion_threshold: Threshold for switching to insertion sort
                - visualize_partitioning: Show detailed partitioning steps
        """
        super().__init__("Quick Select", "selection", options)
        
        # Default options
        self.options.update({
            "pivot_strategy": "median-of-three",  # Strategy for selecting pivot
            "use_median_of_medians": False,       # Use deterministic median-of-medians approach
            "insertion_threshold": 10,            # Threshold for switching to insertion sort
            "visualize_partitioning": True,       # Show detailed partitioning steps
            "animation_delay": 0                  # Delay between steps for visualization
        })
        
        # Override with provided options
        if options:
            self.options.update(options)

    def run(self, array: List[Any], options: Dict[str, Any]) -> Any:
        """
        Execute Quick Select to find the k-th smallest element.
        
        Args:
            array: Input array
            options: Runtime options including k (element to select)
            
        Returns:
            The k-th smallest element
        """
        # Make a copy to avoid modifying the original
        result = array.copy()
        n = len(result)
        
        # Get k (1-based index of element to find)
        k = options.get("k", 1)
        
        # Validate k
        if k < 1 or k > n:
            raise ValueError(f"Invalid value of k: {k}. Must be between 1 and {n}")
        
        # Convert to 0-based index
        index = k - 1
        
        self.set_phase("selection")
        
        # Find the k-th element
        if self.options["use_median_of_medians"]:
            kth_element = self.median_of_medians_select(result, 0, n - 1, index, options)
        else:
            kth_element = self.quick_select(result, 0, n - 1, index, options)
        
        self.set_phase("completed")
        
        # For visualization purposes, mark the k-th element
        self.record_state(result, {
            "type": "final-selection",
            "selected_index": index,
            "selected_value": kth_element,
            "message": f"Found the {k}-th smallest element: {kth_element}"
        })
        
        return kth_element

    def quick_select(self, 
                    array: List[Any], 
                    low: int, 
                    high: int, 
                    k: int, 
                    options: Dict[str, Any]) -> Any:
        """
        Standard Quick Select implementation.
        
        Args:
            array: Array to search in
            low: Start index
            high: End index
            k: Index of element to find (0-based)
            options: Runtime options
            
        Returns:
            The k-th element
        """
        # Introduce delay for visualization if specified
        if options["animation_delay"] > 0:
            time.sleep(options["animation_delay"] / 1000)
        
        # Record the current state
        self.record_state(array, {
            "type": "selection-step",
            "range": [low, high],
            "target": k,
            "message": f"Looking for element at position {k} in range [{low}...{high}]"
        })
        
        # Base case: small array, find element by sorting
        if high - low < self.options["insertion_threshold"]:
            self.insertion_sort(array, low, high)
            return array[k]
        
        # Select pivot using chosen strategy
        pivot_idx = self.select_pivot(array, low, high, self.options["pivot_strategy"])
        
        # Record pivot selection
        self.record_state(array, {
            "type": "pivot-selection",
            "pivot": pivot_idx,
            "pivot_value": array[pivot_idx],
            "message": f"Selected pivot at index {pivot_idx} with value {array[pivot_idx]}"
        })
        
        # Partition the array and get the final position of the pivot
        pivot_pos = self.partition(array, low, high, pivot_idx, options)
        
        # Record partition completion
        self.record_state(array, {
            "type": "partition-complete",
            "pivot": pivot_pos,
            "pivot_value": array[pivot_pos],
            "message": f"Partition complete. Pivot value {array[pivot_pos]} is now at position {pivot_pos}"
        })
        
        # If pivot is at k, we found our element
        if pivot_pos == k:
            return array[pivot_pos]
        
        # Recursively search in the appropriate partition
        if pivot_pos > k:
            # The k-th element is in the left partition
            return self.quick_select(array, low, pivot_pos - 1, k, options)
        else:
            # The k-th element is in the right partition
            return self.quick_select(array, pivot_pos + 1, high, k, options)

    def median_of_medians_select(self, 
                                array: List[Any], 
                                low: int, 
                                high: int, 
                                k: int, 
                                options: Dict[str, Any]) -> Any:
        """
        Deterministic median-of-medians selection algorithm.
        Guarantees O(n) worst-case time complexity.
        
        Args:
            array: Array to search in
            low: Start index
            high: End index
            k: Index of element to find (0-based)
            options: Runtime options
            
        Returns:
            The k-th element
        """
        size = high - low + 1
        
        # Introduce delay for visualization if specified
        if options["animation_delay"] > 0:
            time.sleep(options["animation_delay"] / 1000)
        
        # Base case: small array, use insertion sort
        if size <= self.options["insertion_threshold"]:
            self.insertion_sort(array, low, high)
            return array[k]
        
        # Record the current state
        self.record_state(array, {
            "type": "median-step",
            "range": [low, high],
            "target": k,
            "message": f"Using median-of-medians to find element at position {k} in range [{low}...{high}]"
        })
        
        # Divide array into groups of 5 and find median of each group
        num_groups = math.ceil(size / 5)
        medians = []
        
        for i in range(num_groups):
            group_start = low + i * 5
            group_end = min(group_start + 4, high)
            
            # Find median of this group
            self.insertion_sort(array, group_start, group_end)
            median_idx = group_start + ((group_end - group_start) // 2)
            medians.append(array[median_idx])
            
            # Record group median identification
            if self.options["visualize_partitioning"]:
                self.record_state(array, {
                    "type": "group-median",
                    "group": [group_start, group_end],
                    "median": median_idx,
                    "median_value": array[median_idx],
                    "message": f"Found median of group [{group_start}...{group_end}]: {array[median_idx]}"
                })
        
        # Find the median of medians recursively
        median_of_medians = medians[0] if len(medians) == 1 else self.median_of_medians_select(
            medians, 0, len(medians) - 1, len(medians) // 2, options
        )
        
        # Record median of medians
        self.record_state(array, {
            "type": "median-of-medians",
            "median_value": median_of_medians,
            "message": f"Found median of medians: {median_of_medians}"
        })
        
        # Find the index of the median of medians in the original array
        pivot_idx = low
        for i in range(low, high + 1):
            if array[i] == median_of_medians:
                pivot_idx = i
                break
        
        # Partition around the median of medians
        pivot_pos = self.partition(array, low, high, pivot_idx, options)
        
        # Record partition completion
        self.record_state(array, {
            "type": "partition-complete",
            "pivot": pivot_pos,
            "pivot_value": array[pivot_pos],
            "message": f"Partition complete. Pivot value {array[pivot_pos]} is now at position {pivot_pos}"
        })
        
        # If pivot is at k, we found our element
        if pivot_pos == k:
            return array[pivot_pos]
        
        # Recursively search in the appropriate partition
        if pivot_pos > k:
            # The k-th element is in the left partition
            return self.median_of_medians_select(array, low, pivot_pos - 1, k, options)
        else:
            # The k-th element is in the right partition
            return self.median_of_medians_select(array, pivot_pos + 1, high, k, options)

    def partition(self, 
                 array: List[Any], 
                 low: int, 
                 high: int, 
                 pivot_idx: int, 
                 options: Dict[str, Any]) -> int:
        """
        Partition the array around a pivot.
        
        Args:
            array: Array to partition
            low: Start index
            high: End index
            pivot_idx: Index of the pivot element
            options: Runtime options
            
        Returns:
            Final position of the pivot
        """
        # Move pivot to the end temporarily
        self.swap(array, pivot_idx, high)
        
        # Record pivot movement
        if self.options["visualize_partitioning"]:
            self.record_state(array, {
                "type": "pivot-move",
                "from": pivot_idx,
                "to": high,
                "message": f"Moving pivot from index {pivot_idx} to {high}"
            })
        
        # Get pivot value
        pivot = self.read(array, high)
        
        # Partition the array
        i = low  # Position for elements less than pivot
        
        for j in range(low, high):
            # Introduce delay for visualization if specified
            if options["animation_delay"] > 0:
                time.sleep(options["animation_delay"] / 1000)
            
            # Compare current element with pivot
            if self.compare(self.read(array, j), pivot) < 0:
                # Element is less than pivot, move to left partition
                self.swap(array, i, j)
                
                # Record the swap for visualization
                if self.options["visualize_partitioning"]:
                    self.record_state(array, {
                        "type": "partition-swap",
                        "indices": [i, j],
                        "message": f"Moving element {array[i]} (< pivot) to left partition"
                    })
                
                i += 1
            else:
                # Element stays in right partition
                if self.options["visualize_partitioning"]:
                    self.record_state(array, {
                        "type": "partition-compare",
                        "index": j,
                        "message": f"Element {array[j]} ≥ pivot, stays in right partition"
                    })
        
        # Move pivot to its final position
        self.swap(array, i, high)
        
        # Record final pivot position
        self.record_state(array, {
            "type": "pivot-final",
            "index": i,
            "message": f"Placed pivot {array[i]} at its final position {i}"
        })
        
        return i

    def select_pivot(self, 
                    array: List[Any], 
                    low: int, 
                    high: int, 
                    strategy: str) -> int:
        """
        Select a pivot index based on the specified strategy.
        
        Args:
            array: The array
            low: Start index
            high: End index
            strategy: Pivot selection strategy
            
        Returns:
            Index of the selected pivot
        """
        if low == high:
            return low
        
        if strategy == "first":
            return low
        
        elif strategy == "last":
            return high
        
        elif strategy == "middle":
            return (low + high) // 2
        
        elif strategy == "random":
            return random.randint(low, high)
        
        elif strategy == "median-of-three":
            # Select median of first, middle, and last elements
            mid = (low + high) // 2
            
            # Find median directly
            if self.compare(array[low], array[mid]) > 0:
                if self.compare(array[low], array[high]) <= 0:
                    return low
                elif self.compare(array[mid], array[high]) > 0:
                    return mid
                else:
                    return high
            else:
                if self.compare(array[mid], array[high]) <= 0:
                    return mid
                elif self.compare(array[low], array[high]) > 0:
                    return low
                else:
                    return high
        
        else:
            print(f"Unknown pivot strategy: {strategy}, using median-of-three")
            return self.select_pivot(array, low, high, "median-of-three")

    def insertion_sort(self, array: List[Any], low: int, high: int) -> None:
        """
        Insertion sort for small subarrays.
        
        Args:
            array: The array to sort
            low: Start index
            high: End index
        """
        for i in range(low + 1, high + 1):
            key = self.read(array, i)
            j = i - 1
            
            while j >= low and self.compare(self.read(array, j), key) > 0:
                self.write(array, j + 1, self.read(array, j))
                j -= 1
            
            if j + 1 != i:
                self.write(array, j + 1, key)

    def get_complexity(self) -> Dict[str, Dict[str, str]]:
        """
        Get the time and space complexity of Quick Select.
        
        Returns:
            Complexity information dictionary
        """
        worst_time = "O(n)" if self.options["use_median_of_medians"] else "O(n²)"
        
        return {
            "time": {
                "best": "O(n)",
                "average": "O(n)",
                "worst": worst_time
            },
            "space": {
                "best": "O(log n)",
                "average": "O(log n)",
                "worst": "O(n)"
            }
        }

    def is_stable(self) -> bool:
        """
        Whether Quick Select is stable (preserves relative order of equal elements).
        
        Returns:
            Always false as QuickSelect isn't stable
        """
        return False

    def is_in_place(self) -> bool:
        """
        Whether Quick Select is in-place (uses O(1) auxiliary space).
        
        Returns:
            True as QuickSelect is in-place
        """
        return True
    
    def get_info(self) -> Dict[str, Any]:
        """
        Get detailed information about the algorithm.
        
        Returns:
            Dictionary with algorithm details
        """
        info = super().get_info()
        
        # Add QuickSelect specific information
        info.update({
            "optimization": {
                "pivot_strategy": self.options.get("pivot_strategy", "median-of-three"),
                "use_median_of_medians": self.options.get("use_median_of_medians", False),
                "insertion_threshold": self.options.get("insertion_threshold", 10),
                "visualize_partitioning": self.options.get("visualize_partitioning", True)
            },
            "properties": {
                "selection_algorithm": True,
                "in_place": True,
                "stable": False,
                "deterministic": self.options.get("use_median_of_medians", False)
            },
            "applications": [
                "Finding k-th smallest/largest element",
                "Computing medians and quantiles",
                "Order statistics",
                "Nearest neighbor search",
                "Data stream processing"
            ],
            "variants": [
                "Basic Quick Select",
                "Median-of-Medians (BFPRT algorithm)",
                "Introselect (hybrid algorithm)",
                "Dual-pivot Quick Select"
            ],
            "advantages": [
                "Average O(n) time complexity",
                "In-place algorithm with low memory usage",
                "Can be made deterministic with median-of-medians approach",
                "Efficient for finding order statistics",
                "Works well with virtual memory systems"
            ],
            "disadvantages": [
                "Not stable (doesn't preserve relative order of equal elements)",
                "Basic version has O(n²) worst-case time complexity",
                "Median-of-medians variant has higher overhead",
                "Randomized version lacks guarantees for critical applications"
            ]
        })
        
        return info


# Example usage
if __name__ == "__main__":
    # Create and run a simple test
    selector = QuickSelect({
        "pivot_strategy": "median-of-three",
        "use_median_of_medians": False,
        "visualize_partitioning": True
    })
    
    test_array = [5, 3, 8, 4, 2, 9, 1, 7, 6]
    k = 5  # Find the 5th smallest element (which should be 5)
    
    result = selector.execute(test_array, {"k": k})
    print(f"Original array: {test_array}")
    print(f"{k}-th smallest element: {result}")
    print(f"Comparisons: {selector.metrics['comparisons']}")
    print(f"Swaps: {selector.metrics['swaps']}")
