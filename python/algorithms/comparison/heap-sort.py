# algorithms/sorting/heap_sort.py

from typing import List, Any, Dict, Optional, Callable, Tuple
from algorithms.base_algorithm import Algorithm
import time
import math

class HeapSort(Algorithm):
    """
    Implementation of Heap Sort algorithm with multiple optimization strategies.
    
    Heap Sort works by:
    1. Building a max-heap from the input array
    2. Repeatedly extracting the maximum element and rebuilding the heap
    
    This implementation includes optimizations:
    - Floyd's "build heap" method to optimize heap construction
    - Tail recursion elimination for heapify operations
    - Optimized leaf node detection
    - Sift-up/sift-down variants for heap operations
    
    Time Complexity:
    - Best:    O(n log n)
    - Average: O(n log n)
    - Worst:   O(n log n)
    
    Space Complexity:
    - O(1) (in-place sorting algorithm)
    """
    
    def __init__(self, options: Dict[str, Any] = None):
        """
        Initialize Heap Sort with options.
        
        Args:
            options: Dictionary of options including:
                - visualize_heap: Visualize the implicit heap structure
                - optimize_leaf_checks: Optimize leaf node detection
                - bottom_up_heapify: Use bottom-up heapify (Floyd's method)
                - tail_recursion: Use tail recursion for heapify
        """
        super().__init__("Heap Sort", "comparison", options)
        
        # Default options
        self.options.update({
            "visualize_heap": True,        # Visualize the implicit heap structure
            "optimize_leaf_checks": True,  # Optimize leaf node detection
            "bottom_up_heapify": True,     # Use bottom-up heapify (Floyd's method)
            "tail_recursion": False,       # Use tail recursion for heapify
            "animation_delay": 0           # Delay between steps for visualization
        })
        
        # Override with provided options
        if options:
            self.options.update(options)

    def run(self, array: List[Any], options: Dict[str, Any]) -> List[Any]:
        """
        Execute Heap Sort on the provided array.
        
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
            
        self.set_phase("heap-construction")
        
        # Build max heap (rearrange array)
        self.build_max_heap(result, n, options)
        
        self.set_phase("sorting")
        
        # Extract elements from heap one by one
        for i in range(n - 1, 0, -1):
            # Move current root to end
            self.swap(result, 0, i)
            
            # Introduce delay for visualization if specified
            if options["animation_delay"] > 0:
                time.sleep(options["animation_delay"] / 1000)
            
            # Record the state after swap
            self.record_state(result, {
                "type": "extract-max",
                "index": i,
                "value": result[i],
                "message": f"Extracted maximum element {result[i]} and placed at position {i}"
            })
            
            # Call heapify on the reduced heap
            self.heapify(result, 0, i, options)
            
            # Mark the last element as sorted
            self.record_state(result, {
                "type": "sorted",
                "indices": list(range(i, n)),
                "message": f"Elements from index {i} to {n-1} are now sorted"
            })
        
        self.set_phase("completed")
        return result

    def build_max_heap(self, array: List[Any], size: int, options: Dict[str, Any]) -> None:
        """
        Build a max heap from the array.
        
        Args:
            array: Array to heapify
            size: Size of the heap
            options: Runtime options
        """
        self.record_state(array, {
            "type": "heap-start",
            "message": "Starting heap construction"
        })
        
        # Floyd's "build heap" method - start from the last non-leaf node
        # This is more efficient than inserting one by one (O(n) vs O(n log n))
        start_idx = (size // 2) - 1
        
        for i in range(start_idx, -1, -1):
            self.heapify(array, i, size, options)
        
        self.record_state(array, {
            "type": "heap-complete",
            "message": "Heap construction complete",
            "heap_structure": self.extract_heap_structure(array, size)
        })

    def heapify(self, array: List[Any], i: int, size: int, options: Dict[str, Any]) -> None:
        """
        Heapify a subtree rooted at node i.
        
        Args:
            array: Array representing the heap
            i: Index of the root of the subtree
            size: Size of the heap
            options: Runtime options
        """
        # Iterative implementation to avoid call stack issues with large arrays
        current = i
        
        while True:
            largest = current
            left = 2 * current + 1
            right = 2 * current + 2
            
            # Check if this is a leaf node to avoid unnecessary comparisons
            if options["optimize_leaf_checks"] and left >= size:
                # Current node is a leaf, no heapify needed
                break
            
            # Introduce delay for visualization if specified
            if options["animation_delay"] > 0:
                time.sleep(options["animation_delay"] / 1000)
            
            # Visualize the current node and its children
            if options["visualize_heap"]:
                self.record_state(array, {
                    "type": "heapify",
                    "node": current,
                    "children": [idx for idx in [left, right] if idx < size],
                    "message": f"Heapifying subtree rooted at index {current}",
                    "heap_structure": self.extract_heap_structure(array, size, current)
                })
            
            # Compare with left child
            if left < size and self.compare(array[left], array[largest]) > 0:
                largest = left
            
            # Compare with right child
            if right < size and self.compare(array[right], array[largest]) > 0:
                largest = right
            
            # If largest is not the current node, swap and continue heapifying
            if largest != current:
                self.swap(array, current, largest)
                
                self.record_state(array, {
                    "type": "heapify-swap",
                    "indices": [current, largest],
                    "message": f"Swapped {array[largest]} and {array[current]} to maintain heap property"
                })
                
                # Move down to the child for next iteration
                current = largest
            else:
                # Heap property is satisfied, exit the loop
                break

    def extract_heap_structure(self, array: List[Any], size: int, highlight: int = -1) -> Dict[str, Any]:
        """
        Extract the implicit heap structure for visualization.
        
        Args:
            array: Array representing the heap
            size: Size of the heap
            highlight: Optional index to highlight
            
        Returns:
            Dictionary representing the heap structure
        """
        # Create a representation of the binary heap for visualization
        structure = {
            "nodes": [],
            "edges": [],
            "highlight": highlight
        }
        
        # Add nodes with their values and positions
        for i in range(size):
            structure["nodes"].append({
                "id": i,
                "value": array[i],
                "level": math.floor(math.log2(i + 1)),
                "is_leaf": 2 * i + 1 >= size
            })
            
            # Add edges to children
            left = 2 * i + 1
            right = 2 * i + 2
            
            if left < size:
                structure["edges"].append({"from": i, "to": left, "type": "left"})
            
            if right < size:
                structure["edges"].append({"from": i, "to": right, "type": "right"})
        
        return structure

    def get_complexity(self) -> Dict[str, Dict[str, str]]:
        """
        Get the time and space complexity of Heap Sort.
        
        Returns:
            Complexity information dictionary
        """
        return {
            "time": {
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
        Whether Heap Sort is stable (preserves relative order of equal elements).
        
        Returns:
            False as Heap Sort is not stable
        """
        return False

    def is_in_place(self) -> bool:
        """
        Whether Heap Sort is in-place (uses O(1) auxiliary space).
        
        Returns:
            True as Heap Sort is in-place
        """
        return True
    
    def get_info(self) -> Dict[str, Any]:
        """
        Get detailed information about the algorithm.
        
        Returns:
            Dictionary with algorithm details
        """
        info = super().get_info()
        
        # Add heap sort specific information
        info.update({
            "optimization": {
                "visualize_heap": self.options.get("visualize_heap", True),
                "optimize_leaf_checks": self.options.get("optimize_leaf_checks", True),
                "bottom_up_heapify": self.options.get("bottom_up_heapify", True),
                "tail_recursion": self.options.get("tail_recursion", False)
            },
            "properties": {
                "comparison_based": True,
                "stable": False,
                "in_place": True,
                "online": False,
                "divide_and_conquer": False,
                "uses_binary_heap": True
            },
            "suitable_for": {
                "small_arrays": False,
                "nearly_sorted_arrays": False,
                "large_arrays": True,
                "limited_memory": True
            },
            "variants": [
                "Standard Heap Sort",
                "Bottom-up Heap Sort",
                "Smooth Sort (variant using Leonardo numbers)",
                "Weak Heap Sort",
                "Binary Heap Sort with optimized leaf detection"
            ],
            "advantages": [
                "Guaranteed O(n log n) performance in all cases",
                "In-place sorting with no extra memory needed",
                "Good for sorting large datasets with limited memory",
                "Useful as a priority queue implementation",
                "Predictable performance regardless of input distribution"
            ],
            "disadvantages": [
                "Not stable (does not preserve order of equal elements)",
                "Relatively poor cache performance due to non-local memory access",
                "Usually outperformed by quicksort on average cases",
                "Complex to parallelize due to heap property maintenance"
            ]
        })
        
        return info


# Example usage
if __name__ == "__main__":
    # Create and run a simple test
    sorter = HeapSort({
        "visualize_heap": True,
        "optimize_leaf_checks": True
    })
    
    test_array = [5, 3, 8, 4, 2, 9, 1, 7, 6]
    
    result = sorter.execute(test_array)
    print(f"Original: {test_array}")
    print(f"Sorted: {result}")
    print(f"Comparisons: {sorter.metrics['comparisons']}")
    print(f"Swaps: {sorter.metrics['swaps']}")
