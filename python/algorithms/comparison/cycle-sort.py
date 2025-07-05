# algorithms/sorting/cycle_sort.py

from typing import List, Any, Dict, Optional, Callable, Tuple
from algorithms.base_algorithm import Algorithm
import time

class CycleSort(Algorithm):
    """
    Implementation of Cycle Sort algorithm with comprehensive instrumentation.
    
    Cycle Sort is an in-place, unstable comparison sorting algorithm that is
    theoretically optimal in terms of the number of memory writes. It works by
    dividing the array into cycles where each element is placed directly into
    its correct position, minimizing the total number of writes.
    
    Key characteristics:
    - Optimal in terms of memory writes (each element is written exactly once to its final position)
    - Useful when write operations are significantly more expensive than reads
    - Not stable (does not preserve the relative order of equal elements)
    - In-place sorting algorithm (requires O(1) auxiliary space)
    
    Time Complexity:
    - Best:    O(n²)
    - Average: O(n²)
    - Worst:   O(n²)
    
    Space Complexity:
    - O(1) (in-place sorting algorithm)
    
    Number of writes: O(n) (the key advantage of Cycle Sort)
    """
    
    def __init__(self, options: Dict[str, Any] = None):
        """
        Initialize Cycle Sort with options.
        
        Args:
            options: Dictionary of options including:
                - enable_optimization: Enable optimization for repeated elements
                - count_cycles: Track and report cycle information
                - animation_delay: Delay between steps for visualization
        """
        super().__init__("Cycle Sort", "comparison", options)
        
        # Default options
        self.options.update({
            "enable_optimization": True,  # Optimization for handling repeated elements
            "count_cycles": True,         # Count and report cycle information
            "animation_delay": 0          # Delay between steps for visualization
        })
        
        # Override with provided options
        if options:
            self.options.update(options)
        
        # Additional metrics specific to Cycle Sort
        self.metrics["cycles"] = 0         # Number of cycles found
        self.metrics["cycle_length"] = 0   # Total length of all cycles
        self.metrics["max_cycle_length"] = 0  # Length of longest cycle

    def run(self, array: List[Any], options: Dict[str, Any]) -> List[Any]:
        """
        Execute Cycle Sort on the provided array.
        
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
        
        # Reset cycle metrics
        self.metrics["cycles"] = 0
        self.metrics["cycle_length"] = 0
        self.metrics["max_cycle_length"] = 0
        
        # For each array element
        for cycle_start in range(n - 1):
            item = self.read(result, cycle_start)
            
            # Find correct position for the current element
            pos = cycle_start
            for i in range(cycle_start + 1, n):
                if self.compare(self.read(result, i), item) < 0:
                    pos += 1
            
            # If the element is already in the correct position
            if pos == cycle_start:
                self.record_state(result, {
                    "type": "skip-cycle",
                    "index": cycle_start,
                    "message": f"Element {item} at index {cycle_start} is already in its correct position"
                })
                continue
            
            # Handle repeated elements
            # For duplicate elements, pos is the position of the first occurrence
            if options["enable_optimization"]:
                while item == self.read(result, pos):
                    pos += 1
            
            # Start tracking this cycle
            cycle_length = 1
            cycle_elements = [item]
            self.metrics["cycles"] += 1
            
            # Introduce delay for visualization if specified
            if options["animation_delay"] > 0:
                time.sleep(options["animation_delay"] / 1000)
            
            # Put the item into its correct position and rotate the cycle
            temp = self.read(result, pos)
            self.write(result, pos, item)
            item = temp
            cycle_elements.append(item)
            
            self.record_state(result, {
                "type": "cycle-start",
                "index": cycle_start,
                "position": pos,
                "item": item,
                "message": f"Starting cycle at index {cycle_start}, moved element {cycle_elements[0]} to position {pos}"
            })
            
            # Continue the cycle by placing each displaced element
            while pos != cycle_start:
                # Find the correct position for the current item
                pos = cycle_start
                for i in range(cycle_start + 1, n):
                    if self.compare(self.read(result, i), item) < 0:
                        pos += 1
                
                # Handle repeated elements
                if options["enable_optimization"]:
                    while item == self.read(result, pos):
                        pos += 1
                
                # Continue the cycle with the next element
                cycle_length += 1
                
                # Introduce delay for visualization if specified
                if options["animation_delay"] > 0:
                    time.sleep(options["animation_delay"] / 1000)
                
                # Swap the current item with the element at its correct position
                temp = self.read(result, pos)
                self.write(result, pos, item)
                item = temp
                cycle_elements.append(item)
                
                self.record_state(result, {
                    "type": "cycle-continue",
                    "position": pos,
                    "cycle_start": cycle_start,
                    "item": item,
                    "cycle_length": cycle_length,
                    "message": f"Continuing cycle from index {cycle_start}, placed element at position {pos}"
                })
            
            # Update cycle metrics
            self.metrics["cycle_length"] += cycle_length
            self.metrics["max_cycle_length"] = max(self.metrics["max_cycle_length"], cycle_length)
            
            # Record the completion of a cycle
            self.record_state(result, {
                "type": "cycle-complete",
                "cycle_start": cycle_start,
                "cycle_length": cycle_length,
                "cycle_elements": cycle_elements,
                "message": f"Completed cycle of length {cycle_length} starting at index {cycle_start}"
            })
        
        self.set_phase("completed")
        
        # Record final analysis
        avg_cycle_length = self.metrics["cycle_length"] / (self.metrics["cycles"] or 1)
        self.record_state(result, {
            "type": "analysis",
            "cycles": self.metrics["cycles"],
            "avg_cycle_length": avg_cycle_length,
            "max_cycle_length": self.metrics["max_cycle_length"],
            "message": f"Found {self.metrics['cycles']} cycles with average length {avg_cycle_length:.2f}"
        })
        
        return result

    def get_complexity(self) -> Dict[str, Dict[str, str]]:
        """
        Get the time and space complexity of Cycle Sort.
        
        Returns:
            Complexity information dictionary
        """
        return {
            "time": {
                "best": "O(n²)",
                "average": "O(n²)",
                "worst": "O(n²)"
            },
            "space": {
                "best": "O(1)",
                "average": "O(1)",
                "worst": "O(1)"
            }
        }

    def is_stable(self) -> bool:
        """
        Whether Cycle Sort is stable (preserves relative order of equal elements).
        
        Returns:
            False as Cycle Sort is not stable
        """
        return False

    def is_in_place(self) -> bool:
        """
        Whether Cycle Sort is in-place (uses O(1) auxiliary space).
        
        Returns:
            True as Cycle Sort is in-place
        """
        return True
    
    def get_info(self) -> Dict[str, Any]:
        """
        Get detailed information about the algorithm.
        
        Returns:
            Dictionary with algorithm details
        """
        info = super().get_info()
        
        # Add cycle sort specific information
        info.update({
            "optimization": {
                "enable_optimization": self.options.get("enable_optimization", True),
                "count_cycles": self.options.get("count_cycles", True)
            },
            "properties": {
                "comparison_based": True,
                "stable": False,
                "in_place": True,
                "online": False,
                "write_optimal": True  # Key characteristic of Cycle Sort
            },
            "suitable_for": {
                "small_arrays": False,
                "nearly_sorted_arrays": False,
                "large_arrays": False,
                "expensive_writes": True   # Optimal when writes are expensive
            },
            "advantages": [
                "Minimizes the number of memory writes (each value is written exactly once to its final position)",
                "Useful for flash memory or EEPROM where writes are expensive",
                "In-place algorithm requiring no additional memory",
                "Simple implementation with no recursion"
            ],
            "disadvantages": [
                "Quadratic time complexity in all cases (O(n²))",
                "Not stable (does not preserve order of equal elements)",
                "Performs poorly compared to other quadratic sorts like insertion sort in practice",
                "Not adaptive to partially sorted input"
            ],
            "performance": {
                "writes": "O(n)",  # The key advantage of Cycle Sort
                "reads": "O(n²)",  # But requires many reads
                "comparisons": "O(n²)"
            }
        })
        
        # Add cycle statistics if available
        if self.options.get("count_cycles", True) and self.metrics["cycles"] > 0:
            info["cycle_statistics"] = {
                "total_cycles": self.metrics["cycles"],
                "average_cycle_length": self.metrics["cycle_length"] / self.metrics["cycles"],
                "max_cycle_length": self.metrics["max_cycle_length"]
            }
        
        return info


# Example usage
if __name__ == "__main__":
    # Create and run a simple test
    sorter = CycleSort({
        "enable_optimization": True,
        "count_cycles": True
    })
    
    test_array = [5, 3, 8, 4, 2, 9, 1, 7, 6]
    
    result = sorter.execute(test_array)
    print(f"Original: {test_array}")
    print(f"Sorted: {result}")
    print(f"Comparisons: {sorter.metrics['comparisons']}")
    print(f"Writes: {sorter.metrics['writes']}")
    print(f"Cycles: {sorter.metrics['cycles']}")
    print(f"Average cycle length: {sorter.metrics['cycle_length'] / sorter.metrics['cycles']:.2f}")
