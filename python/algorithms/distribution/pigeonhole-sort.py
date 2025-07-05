# algorithms/sorting/pigeonhole_sort.py

from typing import List, Any, Dict, Optional, Callable, Tuple, Union
from algorithms.base_algorithm import Algorithm
import time
from collections import defaultdict

class PigeonholeSort(Algorithm):
    """
    Implementation of Pigeonhole Sort algorithm with comprehensive instrumentation.
    
    Pigeonhole Sort is a non-comparison sorting algorithm that works efficiently
    when the range of keys (m) is small compared to the number of items (n).
    The algorithm creates "pigeonholes" for each possible key value, distributes
    elements into their respective pigeonholes, and then collects them in order.
    
    Key characteristics:
    - Linear time complexity O(n + m) where m is the range of values
    - Efficient for integer sorting with limited range
    - Stable sorting (preserves relative order of equal elements)
    - Not in-place (requires additional space proportional to range)
    - Particularly suitable for uniformly distributed data
    
    Time Complexity:
    - Best:    O(n + m) where m is the range (max - min + 1)
    - Average: O(n + m)
    - Worst:   O(n + m)
    
    Space Complexity:
    - O(n + m) for the pigeonholes
    """
    
    def __init__(self, options: Dict[str, Any] = None):
        """
        Initialize Pigeonhole Sort with options.
        
        Args:
            options: Dictionary of options including:
                - detect_range: Auto-detect value range
                - use_defaultdict: Use defaultdict for faster empty pigeonhole check
                - dynamic_pigeonholes: Use dict for sparse data
                - min_value: Minimum value in range (auto-detected if not provided)
                - max_value: Maximum value in range (auto-detected if not provided)
                - pigeonhole_factory: Custom function to create pigeonholes
                - animation_delay: Delay between steps for visualization
        """
        super().__init__("Pigeonhole Sort", "distribution", options)
        
        # Default options
        self.options.update({
            "detect_range": True,             # Auto-detect the range of values
            "use_defaultdict": True,          # Use defaultdict for faster empty pigeonhole check
            "dynamic_pigeonholes": True,      # Use dict for sparse data
            "min_value": None,                # Minimum value in range (auto-detected if not provided)
            "max_value": None,                # Maximum value in range (auto-detected if not provided)
            "pigeonhole_factory": None,       # Custom function to create pigeonholes
            "animation_delay": 0              # Delay between steps for visualization
        })
        
        # Override with provided options
        if options:
            self.options.update(options)
        
        # Additional metrics specific to Pigeonhole Sort
        self.metrics["range"] = 0                     # Range of values (max - min + 1)
        self.metrics["empty_pigeonholes"] = 0         # Number of empty pigeonholes
        self.metrics["pigeonhole_distribution"] = {}  # Distribution of elements in pigeonholes

    def run(self, array: List[Any], options: Dict[str, Any]) -> List[Any]:
        """
        Execute Pigeonhole Sort on the provided array.
        
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
            
        self.set_phase("analysis")
        
        # Determine the range of values
        min_val, max_val = None, None
        
        if options["detect_range"] or options["min_value"] is None or options["max_value"] is None:
            min_val, max_val = self.find_min_max(result)
            
            self.record_state(result, {
                "type": "range-detection",
                "min": min_val,
                "max": max_val,
                "range": max_val - min_val + 1,
                "message": f"Detected value range: [{min_val}, {max_val}]"
            })
        else:
            min_val = options["min_value"]
            max_val = options["max_value"]
            
            self.record_state(result, {
                "type": "range-provided",
                "min": min_val,
                "max": max_val,
                "range": max_val - min_val + 1,
                "message": f"Using provided value range: [{min_val}, {max_val}]"
            })
        
        # Calculate range and update metrics
        range_size = max_val - min_val + 1
        self.metrics["range"] = range_size
        
        # Check if range is too large for efficient sorting
        import math
        if range_size > n * math.log(n) and not options.get("force_pigeonhole", False):
            self.record_state(result, {
                "type": "range-warning",
                "range": range_size,
                "elements": n,
                "message": f"Range {range_size} significantly larger than element count {n}, consider a different algorithm"
            })
        
        self.set_phase("sorting")
        
        # Create pigeonholes based on the range
        pigeonholes = self.create_pigeonholes(range_size, options)
        
        self.record_state(result, {
            "type": "pigeonholes-created",
            "count": range_size,
            "message": f"Created {range_size} pigeonholes for sorting"
        })
        
        # Introduce delay for visualization if specified
        if options["animation_delay"] > 0:
            time.sleep(options["animation_delay"] / 1000)
        
        # 1. Distribution phase: Put each element into its pigeonhole
        for i in range(n):
            value = self.read(result, i)
            index = value - min_val  # Normalize value to pigeonhole index
            
            self.insert_into_pigeonhole(pigeonholes, index, value, options)
            
            # Record the distribution step
            self.record_state(result, {
                "type": "distribution",
                "value": value,
                "pigeonhole": index,
                "message": f"Distributed element {value} to pigeonhole {index}"
            })
        
        # Gather statistics about pigeonhole distribution
        self.analyze_pigeonhole_distribution(pigeonholes, range_size, options)
        
        self.set_phase("collection")
        
        # 2. Collection phase: Collect elements in order
        index = 0
        
        for i in range(range_size):
            # Get the current pigeonhole
            current_pigeonhole = self.get_pigeonhole(pigeonholes, i, options)
            
            if self.is_pigeonhole_empty(current_pigeonhole, options):
                # Skip empty pigeonhole
                continue
            
            # Process elements in the current pigeonhole
            self.collect_from_pigeonhole(result, current_pigeonhole, i, index, min_val, options)
            
            # Advance index by the number of elements in this pigeonhole
            index += len(current_pigeonhole)
            
            # Record the collection step
            self.record_state(result, {
                "type": "collection",
                "pigeonhole": i,
                "collected_count": index,
                "message": f"Collected elements from pigeonhole {i}, total collected: {index}"
            })
        
        self.set_phase("completed")
        
        # Final analysis
        self.record_state(result, {
            "type": "sorting-complete",
            "range": range_size,
            "empty_pigeonholes": self.metrics["empty_pigeonholes"],
            "message": f"Sorting completed with {range_size} pigeonholes, {self.metrics['empty_pigeonholes']} were empty"
        })
        
        return result

    def find_min_max(self, array: List[Any]) -> Tuple[Any, Any]:
        """
        Find the minimum and maximum values in the array.
        
        Args:
            array: The input array
            
        Returns:
            Tuple of (min, max) values
        """
        min_val = float('inf')
        max_val = float('-inf')
        
        for i in range(len(array)):
            value = self.read(array, i)
            
            if value < min_val:
                min_val = value
            if value > max_val:
                max_val = value
        
        return min_val, max_val

    def create_pigeonholes(self, range_size: int, options: Dict[str, Any]) -> Any:
        """
        Create pigeonholes based on the range.
        
        Args:
            range_size: Range of values
            options: Algorithm options
            
        Returns:
            Pigeonhole data structure
        """
        # Use custom factory if provided
        if callable(options["pigeonhole_factory"]):
            return options["pigeonhole_factory"](range_size)
        
        # Choose the appropriate data structure based on options
        if options["dynamic_pigeonholes"]:
            # Use defaultdict for sparse data (when range is large but many pigeonholes might be empty)
            if options["use_defaultdict"]:
                return defaultdict(list)
            else:
                return {}  # Regular dict
        else:
            # Use list for dense data (when most pigeonholes will be used)
            return [[] for _ in range(range_size)]

    def insert_into_pigeonhole(self, pigeonholes: Any, index: int, value: Any, options: Dict[str, Any]) -> None:
        """
        Insert a value into its pigeonhole.
        
        Args:
            pigeonholes: Pigeonhole data structure
            index: Pigeonhole index
            value: Value to insert
            options: Algorithm options
        """
        if options["dynamic_pigeonholes"]:
            # Using dict or defaultdict
            if options["use_defaultdict"]:
                # With defaultdict, the list is created automatically if it doesn't exist
                pigeonholes[index].append(value)
            else:
                # With regular dict, we need to check if the key exists
                if index not in pigeonholes:
                    pigeonholes[index] = []
                pigeonholes[index].append(value)
        else:
            # Using list
            pigeonholes[index].append(value)
        
        # Update metrics
        if index not in self.metrics["pigeonhole_distribution"]:
            self.metrics["pigeonhole_distribution"][index] = 0
        self.metrics["pigeonhole_distribution"][index] += 1

    def get_pigeonhole(self, pigeonholes: Any, index: int, options: Dict[str, Any]) -> List[Any]:
        """
        Get a specific pigeonhole.
        
        Args:
            pigeonholes: Pigeonhole data structure
            index: Pigeonhole index
            options: Algorithm options
            
        Returns:
            The pigeonhole container (list of values)
        """
        if options["dynamic_pigeonholes"]:
            # Using dict or defaultdict
            if options["use_defaultdict"]:
                # With defaultdict, this will return an empty list if the key doesn't exist
                return pigeonholes[index]
            else:
                # With regular dict, we need to handle the case when the key doesn't exist
                return pigeonholes.get(index, [])
        else:
            # Using list
            return pigeonholes[index]

    def is_pigeonhole_empty(self, pigeonhole: List[Any], options: Dict[str, Any]) -> bool:
        """
        Check if a pigeonhole is empty.
        
        Args:
            pigeonhole: The pigeonhole to check
            options: Algorithm options
            
        Returns:
            True if the pigeonhole is empty
        """
        return not pigeonhole or len(pigeonhole) == 0

    def collect_from_pigeonhole(self, result: List[Any], pigeonhole: List[Any], 
                               pigeonhole_index: int, result_index: int, 
                               min_val: Any, options: Dict[str, Any]) -> None:
        """
        Collect elements from a pigeonhole into the result array.
        
        Args:
            result: Result array
            pigeonhole: The pigeonhole to collect from
            pigeonhole_index: Index of the pigeonhole
            result_index: Current index in result array
            min_val: Minimum value for normalization
            options: Algorithm options
        """
        # Process all elements in the current pigeonhole
        for j, value in enumerate(pigeonhole):
            self.write(result, result_index + j, value)
            
            # Introduce delay for visualization if specified
            if options["animation_delay"] > 0:
                time.sleep(options["animation_delay"] / 1000)
            
            # Record individual element placement
            self.record_state(result, {
                "type": "placement",
                "value": value,
                "pigeonhole": pigeonhole_index,
                "position": result_index + j,
                "message": f"Placed element {value} from pigeonhole {pigeonhole_index} at position {result_index + j}"
            })

    def analyze_pigeonhole_distribution(self, pigeonholes: Any, range_size: int, options: Dict[str, Any]) -> None:
        """
        Analyze pigeonhole distribution for metrics.
        
        Args:
            pigeonholes: Pigeonhole data structure
            range_size: Range of values
            options: Algorithm options
        """
        empty_count = 0
        
        if options["dynamic_pigeonholes"]:
            # For dict-based pigeonholes
            if options["use_defaultdict"]:
                # Count non-empty pigeonholes with defaultdict
                non_empty = sum(1 for hole in pigeonholes.values() if hole)
                empty_count = range_size - non_empty
            else:
                # For regular dict
                empty_count = range_size - len(pigeonholes)
        else:
            # For list-based pigeonholes
            empty_count = sum(1 for hole in pigeonholes if not hole)
        
        self.metrics["empty_pigeonholes"] = empty_count
        
        # Record distribution analysis
        self.record_state([], {
            "type": "distribution-analysis",
            "empty_pigeonholes": empty_count,
            "empty_percentage": (empty_count / range_size) * 100,
            "distribution": self.metrics["pigeonhole_distribution"],
            "message": f"Distribution analysis: {empty_count} empty pigeonholes ({(empty_count / range_size) * 100:.2f}%)"
        })

    def get_complexity(self) -> Dict[str, Dict[str, str]]:
        """
        Get the time and space complexity of Pigeonhole Sort.
        
        Returns:
            Complexity information dictionary
        """
        return {
            "time": {
                "best": "O(n + m)",    # When range is small
                "average": "O(n + m)", # Where m is the range (max - min + 1)
                "worst": "O(n + m)"    # When range is large
            },
            "space": {
                "best": "O(n + m)",
                "average": "O(n + m)",
                "worst": "O(n + m)"
            }
        }

    def is_stable(self) -> bool:
        """
        Whether Pigeonhole Sort is stable (preserves relative order of equal elements).
        
        Returns:
            True as Pigeonhole Sort is stable
        """
        return True

    def is_in_place(self) -> bool:
        """
        Whether Pigeonhole Sort is in-place (uses O(1) auxiliary space).
        
        Returns:
            False as Pigeonhole Sort is not in-place
        """
        return False
    
    def get_info(self) -> Dict[str, Any]:
        """
        Get detailed information about the algorithm.
        
        Returns:
            Dictionary with algorithm details
        """
        info = super().get_info()
        
        # Add pigeonhole sort specific information
        info.update({
            "optimization": {
                "detect_range": self.options.get("detect_range", True),
                "use_defaultdict": self.options.get("use_defaultdict", True),
                "dynamic_pigeonholes": self.options.get("dynamic_pigeonholes", True),
                "min_value": self.options.get("min_value"),
                "max_value": self.options.get("max_value")
            },
            "properties": {
                "comparison_based": False,  # Non-comparison sort
                "stable": True,
                "in_place": False,
                "online": False,
                "distribution_sensitive": True  # Sensitive to the distribution of input data
            },
            "suitable_for": {
                "small_arrays": True,
                "uniform_data": True,         # Best for uniform distributions
                "limited_range": True,        # Best when range is small
                "integer_sorting": True       # Ideal for integer sorting
            },
            "advantages": [
                "Linear time complexity O(n + m) where m is the range",
                "Very efficient when the range of values is small",
                "Simple implementation with predictable performance",
                "Stable sort that preserves the relative order of equal elements",
                "Useful for pre-processing in more complex algorithms"
            ],
            "disadvantages": [
                "Requires additional space proportional to the range of values",
                "Inefficient when the range is significantly larger than n",
                "Not suitable for floating-point values without modification",
                "Not adaptable to different data distributions",
                "Cannot be easily parallelized"
            ],
            "relationships": {
                "family": "Distribution Sorts",
                "related": [
                    "Counting Sort",
                    "Bucket Sort",
                    "Radix Sort"
                ]
            }
        })
        
        # Add range statistics if available
        if self.metrics["range"] > 0:
            info["range_statistics"] = {
                "range": self.metrics["range"],
                "empty_pigeonholes": self.metrics["empty_pigeonholes"],
                "empty_percentage": (self.metrics["empty_pigeonholes"] / self.metrics["range"]) * 100,
                "efficiency_ratio": self.metrics["range"] / (self.metrics["reads"] or 1)
            }
        
        return info


# Example usage
if __name__ == "__main__":
    # Create and run a simple test
    sorter = PigeonholeSort({
        "detect_range": True,
        "use_defaultdict": True,
        "dynamic_pigeonholes": True
    })
    
    test_array = [5, 3, 8, 4, 2, 9, 1, 7, 6]
    
    result = sorter.execute(test_array)
    print(f"Original: {test_array}")
    print(f"Sorted: {result}")
    print(f"Range: {sorter.metrics['range']}")
    print(f"Empty pigeonholes: {sorter.metrics['empty_pigeonholes']}")
    print(f"Distribution: {sorter.metrics['pigeonhole_distribution']}")
