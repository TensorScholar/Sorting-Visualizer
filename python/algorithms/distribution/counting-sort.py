# algorithms/sorting/counting_sort.py

from typing import List, Any, Dict, Optional
from algorithms.base_algorithm import Algorithm
import time

class CountingSort(Algorithm):
    """
    Implementation of Counting Sort algorithm with multiple visualization options.
    
    Counting Sort works by:
    1. Counting occurrences of each element in the input array
    2. Computing cumulative counts to determine positions
    3. Building the output array by placing elements in their correct positions
    
    This is a non-comparison based sort with O(n+k) time complexity,
    where k is the range of input values.
    
    Time Complexity:
    - Best:    O(n+k)
    - Average: O(n+k)
    - Worst:   O(n+k)
    
    Space Complexity:
    - O(n+k) for counting array and output array
    """
    
    def __init__(self, options: Dict[str, Any] = None):
        """
        Initialize Counting Sort with options.
        
        Args:
            options: Dictionary of options including:
                - visualize_counting_array: Visualize the counting array
                - visualize_cumulative_counts: Visualize cumulative count calculation
                - stable_sort: Use stable sorting for equal elements
                - auto_detect_range: Automatically detect input range
                - min_value: Minimum value in array (used if auto_detect_range is false)
                - max_value: Maximum value in array (used if auto_detect_range is false)
        """
        super().__init__("Counting Sort", "distribution", options)
        
        # Default options
        self.options.update({
            "visualize_counting_array": True,     # Visualize the counting array
            "visualize_cumulative_counts": True,  # Visualize cumulative count calculation
            "stable_sort": True,                  # Use stable sorting for equal elements
            "auto_detect_range": True,            # Automatically detect input range
            "min_value": 0,                       # Minimum value in array (used if auto_detect_range is false)
            "max_value": 100,                     # Maximum value in array (used if auto_detect_range is false)
            "animation_delay": 0                  # Delay between steps for visualization
        })
        
        # Override with provided options
        if options:
            self.options.update(options)

    def run(self, array: List[Any], options: Dict[str, Any]) -> List[Any]:
        """
        Execute Counting Sort on the provided array.
        
        Args:
            array: The array to sort
            options: Runtime options
            
        Returns:
            The sorted array
        """
        # Make a copy to avoid modifying the original
        result = array.copy()
        n = len(result)
        
        # Early return for empty or single-element arrays
        if n <= 1:
            return result
            
        self.set_phase("range-detection")
        
        # Determine range of values
        min_value = options["min_value"]
        max_value = options["max_value"]
        
        if options["auto_detect_range"]:
            min_value = float('inf')
            max_value = float('-inf')
            
            for i in range(n):
                value = self.read(result, i)
                if value < min_value:
                    min_value = value
                if value > max_value:
                    max_value = value
            
            self.record_state(result, {
                "type": "range-detection",
                "min": min_value,
                "max": max_value,
                "message": f"Detected value range: [{min_value}, {max_value}]"
            })
        
        self.set_phase("counting")
        
        # Create counting array
        range_size = max_value - min_value + 1
        count = [0] * range_size
        
        # Count occurrences of each element
        for i in range(n):
            value = self.read(result, i)
            index = value - min_value
            count[index] += 1
            
            # Introduce delay for visualization if specified
            if options["animation_delay"] > 0:
                time.sleep(options["animation_delay"] / 1000)
            
            if options["visualize_counting_array"]:
                self.record_state(result, {
                    "type": "counting",
                    "value": value,
                    "count_index": index,
                    "count_array": count.copy(),
                    "message": f"Counting occurrences: count[{value}] = {count[index]}"
                })
        
        self.set_phase("cumulative-counting")
        
        # Compute cumulative counts
        if options["visualize_cumulative_counts"]:
            self.record_state(result, {
                "type": "cumulative-init",
                "count_array": count.copy(),
                "message": f"Initial counting array: {count}"
            })
        
        for i in range(1, range_size):
            count[i] += count[i - 1]
            
            # Introduce delay for visualization if specified
            if options["animation_delay"] > 0:
                time.sleep(options["animation_delay"] / 1000)
            
            if options["visualize_cumulative_counts"]:
                self.record_state(result, {
                    "type": "cumulative-update",
                    "index": i,
                    "count_array": count.copy(),
                    "message": f"Updated cumulative count: count[{i + min_value}] = {count[i]}"
                })
        
        self.set_phase("building-output")
        
        # Build the output array
        output = [0] * n
        
        # Process array from right to left for stability
        for i in range(n - 1, -1, -1):
            value = self.read(result, i)
            count_index = value - min_value
            position = count[count_index] - 1
            
            self.write(output, position, value)
            count[count_index] -= 1
            
            # Introduce delay for visualization if specified
            if options["animation_delay"] > 0:
                time.sleep(options["animation_delay"] / 1000)
            
            self.record_state(output.copy(), {
                "type": "placement",
                "value": value,
                "source_index": i,
                "target_index": position,
                "count_array": count.copy(),
                "original_array": result.copy(),
                "message": f"Placing value {value} from index {i} to position {position}"
            })
        
        # Copy output back to result array
        for i in range(n):
            self.write(result, i, output[i])
        
        self.set_phase("completed")
        
        self.record_state(result, {
            "type": "final",
            "message": "Sorting completed"
        })
        
        return result

    def get_complexity(self) -> Dict[str, Dict[str, str]]:
        """
        Get the time and space complexity of Counting Sort.
        
        Returns:
            Complexity information dictionary
        """
        return {
            "time": {
                "best": "O(n+k)",
                "average": "O(n+k)",
                "worst": "O(n+k)"
            },
            "space": {
                "best": "O(n+k)",
                "average": "O(n+k)",
                "worst": "O(n+k)"
            }
        }

    def is_stable(self) -> bool:
        """
        Whether Counting Sort is stable (preserves relative order of equal elements).
        
        Returns:
            True if using stable sort option
        """
        return self.options["stable_sort"]

    def is_in_place(self) -> bool:
        """
        Whether Counting Sort is in-place (uses O(1) auxiliary space).
        
        Returns:
            False as Counting Sort requires O(n+k) extra space
        """
        return False
    
    def get_info(self) -> Dict[str, Any]:
        """
        Get detailed information about the algorithm.
        
        Returns:
            Dictionary with algorithm details
        """
        info = super().get_info()
        
        # Add counting sort specific information
        info.update({
            "optimization": {
                "visualize_counting_array": self.options.get("visualize_counting_array", True),
                "visualize_cumulative_counts": self.options.get("visualize_cumulative_counts", True),
                "stable_sort": self.options.get("stable_sort", True),
                "auto_detect_range": self.options.get("auto_detect_range", True)
            },
            "properties": {
                "comparison_based": False,
                "stable": self.options.get("stable_sort", True),
                "in_place": False,
                "online": False,
                "distributional": True
            },
            "suitable_for": {
                "small_arrays": True,
                "nearly_sorted_arrays": True,
                "large_arrays": True,
                "limited_range": True
            },
            "variants": [
                "Standard Counting Sort",
                "Counting Sort with stability preservation",
                "Object Counting Sort (sorting objects by keys)",
                "Radix Sort (uses Counting Sort as a subroutine)"
            ],
            "advantages": [
                "O(n+k) time complexity, which can be O(n) when k is O(n)",
                "Can be faster than comparison-based sorts for suitable inputs",
                "Stable sorting when implemented properly",
                "Works well for discrete data with limited range"
            ],
            "disadvantages": [
                "Requires O(n+k) extra space",
                "Inefficient when the range (k) is much larger than the input size (n)",
                "Only applicable to non-negative integers or data that can be mapped to them",
                "Requires knowledge of the range of input values"
            ]
        })
        
        return info


# Example usage
if __name__ == "__main__":
    # Create and run a simple test
    sorter = CountingSort({
        "visualize_counting_array": True,
        "stable_sort": True
    })
    
    test_array = [5, 3, 8, 4, 2, 9, 1, 7, 6, 4, 2]
    
    result = sorter.execute(test_array)
    print(f"Original: {test_array}")
    print(f"Sorted: {result}")
    print(f"Operations: {sorter.metrics}")
