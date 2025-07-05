# algorithms/sorting/bucket_sort.py

from typing import List, Any, Dict, Optional, Callable, Tuple
from algorithms.base_algorithm import Algorithm
import time
import math

class BucketSort(Algorithm):
    """
    Implementation of Bucket Sort with adaptive bucket sizing and multiple bucket variants.
    
    Bucket Sort is a distribution sort algorithm that:
    1. Distributes elements into a number of buckets based on their values
    2. Sorts each bucket individually (using another sorting algorithm)
    3. Concatenates the sorted buckets to produce the final sorted array
    
    Time Complexity:
    - Best:    O(n + k) when elements uniformly distributed and insertion sort on small buckets
    - Average: O(n + k) when elements uniformly distributed
    - Worst:   O(n²) when all elements fall into one bucket
    
    Space Complexity: O(n + k) where k is the number of buckets
    """
    
    def __init__(self, options: Dict[str, Any] = None):
        """
        Initialize Bucket Sort with options.
        
        Args:
            options: Dictionary of options including:
                - bucket_count: Number of buckets to use
                - bucket_sizing: Bucket sizing strategy ('uniform', 'adaptive', 'sqrt')
                - bucket_sort: Algorithm to sort individual buckets
                - optimize_singleton: Skip sorting for buckets with 0-1 elements
                - detect_uniformity: Detect and optimize for uniform distributions
        """
        super().__init__("Bucket Sort", "distribution", options)
        
        # Default options
        self.options.update({
            "bucket_count": 10,             # Number of buckets to use
            "bucket_sizing": "adaptive",    # 'uniform', 'adaptive', or 'sqrt'
            "bucket_sort": "insertion",     # Algorithm to sort individual buckets
            "optimize_singleton": True,     # Skip sorting for buckets with 0-1 elements
            "detect_uniformity": True,      # Detect and optimize for uniform distributions
            "animation_delay": 0            # Delay between steps for visualization
        })
        
        # Override with provided options
        if options:
            self.options.update(options)

    def run(self, array: List[Any], options: Dict[str, Any]) -> List[Any]:
        """
        Execute Bucket Sort on the provided array.
        
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
        
        # Analyze the array
        analysis = self._analyze_array(result)
        min_val, max_val = analysis["min"], analysis["max"]
        value_range = analysis["range"]
        is_integer, has_negative = analysis["is_integer"], analysis["has_negative"]
        
        # Record the analysis
        self.record_state(result, {
            "type": "array-analysis",
            "analysis": analysis,
            "message": f"Analyzed array: range [{min_val} to {max_val}], {('integer' if is_integer else 'float')} values, negative numbers: {has_negative}"
        })
        
        # Handle negative numbers if present
        if has_negative:
            return self._handle_negative_numbers(result, analysis, options)
        
        # Determine optimal bucket count
        bucket_count = self._determine_bucket_count(n, value_range, options)
        
        self.record_state(result, {
            "type": "bucket-setup",
            "bucket_count": bucket_count,
            "message": f"Using {bucket_count} buckets with {options['bucket_sizing']} sizing strategy"
        })
        
        self.set_phase("distribution")
        
        # Create buckets
        buckets = [[] for _ in range(bucket_count)]
        
        # Distribute elements into buckets
        for i in range(n):
            value = self.read(result, i)
            bucket_index = self._get_bucket_index(value, min_val, max_val, bucket_count)
            
            buckets[bucket_index].append(value)
            
            # Record significant distribution steps
            if i % max(1, n // 20) == 0 or i == n - 1:
                self.record_state(result, {
                    "type": "element-distribution",
                    "index": i,
                    "value": value,
                    "bucket_index": bucket_index,
                    "message": f"Placed element {value} into bucket {bucket_index}"
                })
            
            # Introduce delay for visualization if specified
            if options["animation_delay"] > 0:
                time.sleep(options["animation_delay"] / 1000)
        
        # Record bucket distribution
        bucket_sizes = [len(b) for b in buckets]
        self.record_state(result, {
            "type": "buckets-filled",
            "buckets": [bucket.copy() for bucket in buckets],
            "bucket_sizes": bucket_sizes,
            "message": f"Distributed elements into buckets: [{', '.join(map(str, bucket_sizes))}]"
        })
        
        self.set_phase("bucket-sorting")
        
        # Sort individual buckets
        for i in range(bucket_count):
            bucket = buckets[i]
            
            # Skip empty buckets or singleton buckets if optimization enabled
            if len(bucket) <= (1 if options["optimize_singleton"] else 0):
                if len(bucket) == 1:
                    self.record_state(result, {
                        "type": "singleton-optimization",
                        "bucket_index": i,
                        "message": f"Skipped sorting bucket {i} with single element"
                    })
                continue
            
            self.record_state(result, {
                "type": "bucket-sort-start",
                "bucket_index": i,
                "bucket_size": len(bucket),
                "message": f"Sorting bucket {i} with {len(bucket)} elements"
            })
            
            # Choose sorting algorithm for this bucket
            self._sort_bucket(bucket, options)
            
            self.record_state(result, {
                "type": "bucket-sorted",
                "bucket_index": i,
                "bucket": bucket.copy(),
                "message": f"Completed sorting bucket {i}"
            })
        
        self.set_phase("concatenation")
        
        # Concatenate sorted buckets
        index = 0
        for i in range(bucket_count):
            bucket = buckets[i]
            
            # Record bucket concatenation
            if bucket:
                self.record_state(result, {
                    "type": "bucket-concatenation",
                    "bucket_index": i,
                    "bucket_size": len(bucket),
                    "output_index": index,
                    "message": f"Concatenating bucket {i} to positions {index} through {index + len(bucket) - 1}"
                })
            
            # Copy bucket elements to the result array
            for value in bucket:
                self.write(result, index, value)
                index += 1
        
        self.set_phase("completed")
        return result

    def _analyze_array(self, array: List[Any]) -> Dict[str, Any]:
        """
        Analyze the array to determine key properties for sorting.
        
        Args:
            array: Array to analyze
            
        Returns:
            Analysis results dictionary
        """
        n = len(array)
        min_val = float('inf')
        max_val = float('-inf')
        sum_val = 0
        is_integer = True
        has_negative = False
        
        # Scan array to find min, max, and detect if all elements are integers
        for value in array:
            min_val = min(min_val, value)
            max_val = max(max_val, value)
            sum_val += value
            
            if value < 0:
                has_negative = True
            
            if is_integer and not isinstance(value, int):
                is_integer = False
        
        value_range = max_val - min_val
        average = sum_val / n if n > 0 else 0
        
        # Calculate distribution properties
        variance = sum((x - average) ** 2 for x in array) / n if n > 0 else 0
        standard_deviation = math.sqrt(variance)
        coefficient = standard_deviation / average if average != 0 else float('inf')
        
        # Detect uniform distribution
        is_uniform = coefficient < 0.25  # Heuristic for uniform-like distribution
        
        return {
            "min": min_val,
            "max": max_val,
            "range": value_range,
            "average": average,
            "variance": variance,
            "standard_deviation": standard_deviation,
            "coefficient": coefficient,
            "is_integer": is_integer,
            "has_negative": has_negative,
            "is_uniform": is_uniform
        }

    def _determine_bucket_count(self, n: int, value_range: float, options: Dict[str, Any]) -> int:
        """
        Determine the optimal number of buckets based on array properties.
        
        Args:
            n: Array length
            value_range: Range of values in the array
            options: Runtime options
            
        Returns:
            Number of buckets to use
        """
        if options["bucket_sizing"] == "sqrt":
            # Square root of array size - common heuristic
            return max(2, int(math.sqrt(n)))
        elif options["bucket_sizing"] == "adaptive":
            # Adaptive bucket count based on array size and range
            if n < 10:
                return min(n, 5)
            elif n < 100:
                return min(n, 10)
            elif n < 1000:
                return min(n, max(10, n // 50))
            else:
                return min(n, max(20, int(math.sqrt(n))))
        else:
            # Default to fixed bucket count
            return options["bucket_count"]

    def _get_bucket_index(self, value: float, min_val: float, max_val: float, bucket_count: int) -> int:
        """
        Determine the bucket index for a given value.
        
        Args:
            value: Value to place in a bucket
            min_val: Minimum value in the array
            max_val: Maximum value in the array
            bucket_count: Number of buckets
            
        Returns:
            Bucket index
        """
        # Handle edge case where all values are the same
        if max_val == min_val:
            return 0
        
        # Normalize the value to 0-1 range, then scale to bucket count
        normalized_value = (value - min_val) / (max_val - min_val)
        bucket_index = int(normalized_value * bucket_count)
        
        # Ensure index is within bounds (for floating point precision issues)
        return min(bucket_count - 1, max(0, bucket_index))

    def _sort_bucket(self, bucket: List[Any], options: Dict[str, Any]) -> None:
        """
        Sort elements within a bucket.
        
        Args:
            bucket: Bucket to sort
            options: Runtime options
        """
        bucket_sort = options["bucket_sort"]
        
        if bucket_sort == "insertion":
            self._insertion_sort(bucket)
        elif bucket_sort == "quick":
            self._quick_sort(bucket, 0, len(bucket) - 1)
        elif bucket_sort == "merge":
            self._merge_sort(bucket, 0, len(bucket) - 1)
        else:
            # Default to insertion sort for small buckets
            self._insertion_sort(bucket)

    def _insertion_sort(self, array: List[Any]) -> None:
        """
        Insertion sort implementation for bucket sorting.
        
        Args:
            array: Array to sort
        """
        for i in range(1, len(array)):
            key = array[i]
            j = i - 1
            
            while j >= 0 and array[j] > key:
                array[j + 1] = array[j]
                j -= 1
            
            array[j + 1] = key

    def _quick_sort(self, array: List[Any], low: int, high: int) -> None:
        """
        Quick sort implementation for bucket sorting.
        
        Args:
            array: Array to sort
            low: Start index
            high: End index
        """
        if low < high:
            pivot_index = self._partition(array, low, high)
            self._quick_sort(array, low, pivot_index - 1)
            self._quick_sort(array, pivot_index + 1, high)

    def _partition(self, array: List[Any], low: int, high: int) -> int:
        """
        Helper function for quicksort.
        
        Args:
            array: Array to partition
            low: Start index
            high: End index
            
        Returns:
            Pivot index
        """
        # Use middle element as pivot to avoid worst case for sorted arrays
        mid = (low + high) // 2
        pivot_value = array[mid]
        
        # Move pivot to end
        array[mid], array[high] = array[high], array[mid]
        
        i = low
        
        for j in range(low, high):
            if array[j] < pivot_value:
                array[i], array[j] = array[j], array[i]
                i += 1
        
        array[i], array[high] = array[high], array[i]
        return i

    def _merge_sort(self, array: List[Any], left: int, right: int) -> None:
        """
        Merge sort implementation for bucket sorting.
        
        Args:
            array: Array to sort
            left: Start index
            right: End index
        """
        if left < right:
            mid = (left + right) // 2
            
            self._merge_sort(array, left, mid)
            self._merge_sort(array, mid + 1, right)
            
            self._merge(array, left, mid, right)

    def _merge(self, array: List[Any], left: int, mid: int, right: int) -> None:
        """
        Helper function for merge sort.
        
        Args:
            array: Array to merge
            left: Left start index
            mid: Middle index
            right: Right end index
        """
        n1 = mid - left + 1
        n2 = right - mid
        
        # Create temporary arrays
        left_array = [0] * n1
        right_array = [0] * n2
        
        # Copy data to temporary arrays
        for i in range(n1):
            left_array[i] = array[left + i]
        for j in range(n2):
            right_array[j] = array[mid + 1 + j]
        
        # Merge the arrays back
        i, j, k = 0, 0, left
        
        while i < n1 and j < n2:
            if left_array[i] <= right_array[j]:
                array[k] = left_array[i]
                i += 1
            else:
                array[k] = right_array[j]
                j += 1
            k += 1
        
        # Copy remaining elements
        while i < n1:
            array[k] = left_array[i]
            i += 1
            k += 1
        
        while j < n2:
            array[k] = right_array[j]
            j += 1
            k += 1

    def _handle_negative_numbers(self, array: List[Any], analysis: Dict[str, Any], options: Dict[str, Any]) -> List[Any]:
        """
        Handle arrays with negative numbers by splitting and sorting separately.
        
        Args:
            array: Array with negative numbers
            analysis: Array analysis results
            options: Runtime options
            
        Returns:
            Sorted array
        """
        self.set_phase("handling-negatives")
        
        n = len(array)
        positives = []
        negatives = []
        zeros = []
        
        # Separate positive, negative and zero values
        for i in range(n):
            value = self.read(array, i)
            if value < 0:
                negatives.append(-value)  # Store as positive for sorting
            elif value > 0:
                positives.append(value)
            else:
                zeros.append(value)  # Keep zeros separate
        
        self.record_state(array, {
            "type": "negative-handling",
            "positive_count": len(positives),
            "negative_count": len(negatives),
            "zero_count": len(zeros),
            "message": f"Separated into {len(positives)} positive, {len(negatives)} negative, and {len(zeros)} zero values"
        })
        
        # Create positive analysis
        positive_analysis = self._analyze_array(positives) if positives else None
        
        # Create negative analysis (using absolute values)
        negative_analysis = self._analyze_array(negatives) if negatives else None
        
        # Sort positive numbers if any
        if positives:
            self.record_state(array, {
                "type": "sorting-positives",
                "count": len(positives),
                "message": f"Sorting {len(positives)} positive values"
            })
            
            # Determine bucket count for positives
            positive_bucket_count = self._determine_bucket_count(
                len(positives), 
                positive_analysis["range"], 
                options
            )
            
            # Create buckets for positives
            positive_buckets = [[] for _ in range(positive_bucket_count)]
            
            # Distribute positive elements
            for value in positives:
                bucket_index = self._get_bucket_index(
                    value, 
                    positive_analysis["min"], 
                    positive_analysis["max"], 
                    positive_bucket_count
                )
                positive_buckets[bucket_index].append(value)
            
            # Sort each positive bucket
            for i, bucket in enumerate(positive_buckets):
                if bucket:
                    self._sort_bucket(bucket, options)
            
            # Concatenate positive buckets
            positives.clear()
            for bucket in positive_buckets:
                positives.extend(bucket)
        
        # Sort negative numbers if any
        if negatives:
            self.record_state(array, {
                "type": "sorting-negatives",
                "count": len(negatives),
                "message": f"Sorting {len(negatives)} negative values (as absolute values)"
            })
            
            # Determine bucket count for negatives
            negative_bucket_count = self._determine_bucket_count(
                len(negatives), 
                negative_analysis["range"], 
                options
            )
            
            # Create buckets for negatives
            negative_buckets = [[] for _ in range(negative_bucket_count)]
            
            # Distribute negative elements (as positive values)
            for value in negatives:
                bucket_index = self._get_bucket_index(
                    value, 
                    negative_analysis["min"], 
                    negative_analysis["max"], 
                    negative_bucket_count
                )
                negative_buckets[bucket_index].append(value)
            
            # Sort each negative bucket
            for i, bucket in enumerate(negative_buckets):
                if bucket:
                    self._sort_bucket(bucket, options)
            
            # Concatenate negative buckets and negate values
            negatives = []
            for bucket in reversed(negative_buckets):
                negatives.extend(-value for value in reversed(bucket))
        
        # Combine results: negatives + zeros + positives
        result = negatives + zeros + positives
        
        # Copy back to original array
        for i, value in enumerate(result):
            self.write(array, i, value)
        
        self.record_state(array, {
            "type": "combined-result",
            "message": "Combined sorted negative, zero, and positive values"
        })
        
        return array

    def get_complexity(self) -> Dict[str, Dict[str, str]]:
        """
        Get the time and space complexity of Bucket Sort.
        
        Returns:
            Complexity information dictionary
        """
        return {
            "time": {
                "best": "O(n + k)",
                "average": "O(n + k)",
                "worst": "O(n²)"
            },
            "space": {
                "best": "O(n + k)",
                "average": "O(n + k)",
                "worst": "O(n + k)"
            }
        }

    def is_stable(self) -> bool:
        """
        Whether Bucket Sort is stable (preserves relative order of equal elements).
        
        Returns:
            True if using stable sort for buckets
        """
        # Stability depends on the bucket sorting algorithm
        return self.options["bucket_sort"] in ["insertion", "merge"]

    def is_in_place(self) -> bool:
        """
        Whether Bucket Sort is in-place (uses O(1) auxiliary space).
        
        Returns:
            False as Bucket Sort requires auxiliary space
        """
        return False  # Requires O(n) auxiliary space
    
    def get_info(self) -> Dict[str, Any]:
        """
        Get detailed information about the algorithm.
        
        Returns:
            Dictionary with algorithm details
        """
        info = super().get_info()
        
        # Add bucket sort specific information
        info.update({
            "optimization": {
                "bucket_count": self.options.get("bucket_count", 10),
                "bucket_sizing": self.options.get("bucket_sizing", "adaptive"),
                "bucket_sort": self.options.get("bucket_sort", "insertion"),
                "optimize_singleton": self.options.get("optimize_singleton", True),
                "detect_uniformity": self.options.get("detect_uniformity", True)
            },
            "properties": {
                "comparison_based": False,  # The distribution phase is not comparison-based
                "stable": self.is_stable(),
                "in_place": self.is_in_place(),
                "online": False,
                "divide_and_conquer": True  # Splits problem into independent parts
            },
            "suitable_for": {
                "small_arrays": False,
                "uniform_distribution": True,
                "floating_point_data": True,
                "limited_range": True
            },
            "variants": [
                "Standard Bucket Sort",
                "Adaptive Bucket Sort (dynamic bucket sizing)",
                "Proxmap Sort (specialized hash function)",
                "Histogram Sort (counting-based variation)",
                "Postman Sort (specialized for postal codes)"
            ],
            "advantages": [
                "Linear time complexity O(n) for uniform distributions",
                "Works well with floating-point numbers",
                "Parallelizable across buckets",
                "Adaptive to data distribution with proper bucket sizing",
                "Can outperform comparison sorts for suitable data"
            ],
            "disadvantages": [
                "Highly sensitive to data distribution (all elements in one bucket is worst case)",
                "Requires additional space proportional to input size",
                "Performance depends on efficiency of bucket sorting algorithm",
                "Not suitable for linked lists or external sorting",
                "Determining optimal bucket count requires data analysis"
            ]
        })
        
        return info


# Example usage
if __name__ == "__main__":
    # Create and run a simple test
    sorter = BucketSort({
        "bucket_count": 5,
        "bucket_sizing": "adaptive",
        "bucket_sort": "insertion"
    })
    
    test_array = [0.42, 0.32, 0.33, 0.52, 0.37, 0.47, 0.51, 0.12, 0.78]
    
    result = sorter.execute(test_array)
    print(f"Original: {test_array}")
    print(f"Sorted: {result}")
    print(f"Metrics: {sorter.metrics}")
