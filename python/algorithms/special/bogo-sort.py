# algorithms/sorting/bogo_sort.py

from typing import List, Any, Dict, Optional, Callable, Tuple
from algorithms.base_algorithm import Algorithm
import time
import random
import math

class BogoSort(Algorithm):
    """
    Implementation of Bogo Sort (also known as Permutation Sort, Stupid Sort, or Slowsort).
    
    Bogo Sort is a highly inefficient sorting algorithm based on randomly generating permutations
    of the input array until finding one that is sorted. It serves primarily as an educational
    example of an exceptionally inefficient algorithm with probabilistic runtime analysis.
    
    Mathematical Foundation:
    ------------------------
    The algorithm's expected running time can be calculated using probability theory:
    - For n elements, there are n! possible permutations
    - Only one permutation is correctly sorted
    - The probability of randomly generating the sorted permutation is 1/n!
    - Using geometric distribution, the expected number of iterations is n!
    - Each iteration requires O(n) time to check if sorted and generate a new permutation
    - Therefore, the expected running time is O(n × n!)
    
    Educational Progression Levels:
    -----------------------------
    L1: Understanding the concept of permutations and checking for sortedness
    L2: Analyzing the probability aspects of random permutation generation
    L3: Calculating the expected runtime using mathematical foundations
    L4: Comparing with deterministic algorithms to understand efficiency concepts
    L5: Exploring the implications for computational complexity theory
    
    Time Complexity:
    - Best:    O(n) when already sorted (extremely unlikely)
    - Average: O(n × n!) expected number of iterations is n!
    - Worst:   Unbounded (theoretically could run forever)
    
    Space Complexity:
    - O(1) (in-place sorting algorithm)
    """
    
    def __init__(self, options: Dict[str, Any] = None):
        """
        Initialize Bogo Sort with options.
        
        Args:
            options: Dictionary of options including:
                - detailed_permutations: Track detailed permutation information
                - optimized_shuffle: Use optimized Fisher-Yates shuffle
                - deterministic_seed: Use deterministic random seed
                - max_iterations: Maximum iterations before giving up
                - provide_learning_insights: Provide educational insights
                - animation_delay: Delay between steps for visualization
        """
        super().__init__("Bogo Sort", "comparison", options)
        
        # Default options
        self.options.update({
            "detailed_permutations": True,      # Track detailed permutation information
            "optimized_shuffle": True,          # Use optimized Fisher-Yates shuffle
            "deterministic_seed": False,        # Use deterministic random seed
            "max_iterations": 1000,             # Maximum iterations before giving up
            "provide_learning_insights": True,  # Provide educational insights
            "animation_delay": 0                # Delay between steps for visualization
        })
        
        # Override with provided options
        if options:
            self.options.update(options)
        
        # Set deterministic seed if requested
        if self.options["deterministic_seed"]:
            random.seed(123456789)  # Fixed seed for reproducibility
            
        # Track the number of permutations generated
        self.permutation_count = 0

    def run(self, array: List[Any], options: Dict[str, Any]) -> List[Any]:
        """
        Execute Bogo Sort on the provided array.
        
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
            
        # Educational insight: probability calculation
        if options["provide_learning_insights"] and n > 3:
            factorial = self._calculate_factorial(n)
            probability = 1 / factorial
            expected_iterations = factorial
            
            self.record_state(result, {
                "type": "educational",
                "concept": "probability",
                "message": f"For an array of {n} elements:",
                "details": [
                    f"Total possible permutations: {n}! = {self._format_large_number(factorial)}",
                    f"Probability of randomly generating sorted array: 1/{self._format_large_number(factorial)} ≈ {probability:.6e}",
                    f"Expected number of iterations: {self._format_large_number(expected_iterations)}",
                    f"This highlights why Bogo Sort is impractical for arrays larger than size 10"
                ]
            })
        
        self.set_phase("sorting")
        self.permutation_count = 0
        
        # Record initial array state
        self.record_state(result, {
            "type": "initial",
            "message": "Starting Bogo Sort with initial array"
        })
        
        iterations = 0
        
        # Keep generating permutations until sorted or max iterations reached
        while not self._is_sorted(result) and iterations < options["max_iterations"]:
            # Introduce delay for visualization if specified
            if options["animation_delay"] > 0:
                time.sleep(options["animation_delay"] / 1000)
            
            # Shuffle the array
            self._shuffle(result, options)
            iterations += 1
            self.permutation_count += 1
            
            # Record the permutation
            if options["detailed_permutations"]:
                self.record_state(result, {
                    "type": "permutation",
                    "iteration": iterations,
                    "message": f"Generated permutation #{iterations}",
                    "is_sorted": self._is_sorted(result, False)  # Check without recording
                })
            elif iterations % 10 == 0 or iterations < 10:
                # Record fewer states for performance
                self.record_state(result, {
                    "type": "progress",
                    "iteration": iterations,
                    "message": f"Generated {iterations} permutations so far"
                })
            
            # Educational insight: demonstrate futility of large arrays
            if options["provide_learning_insights"] and iterations == 100 and n > 7:
                self.record_state(result, {
                    "type": "educational",
                    "concept": "computational-limits",
                    "message": "Practical Limitation Demonstration:",
                    "details": [
                        f"After {iterations} random permutations, probability suggests we've explored only " +
                        f"{(iterations / self._calculate_factorial(n) * 100):.6e}% of possible arrangements",
                        "This illustrates why randomized approaches with exponential search spaces are impractical",
                        "Compare with deterministic algorithms that guarantee O(n log n) complexity"
                    ]
                })
        
        # Mark termination status
        if self._is_sorted(result):
            self.record_state(result, {
                "type": "sorted",
                "indices": list(range(n)),
                "iterations": iterations,
                "message": f"Array sorted after {iterations} permutations"
            })
        else:
            self.record_state(result, {
                "type": "timeout",
                "iterations": iterations,
                "message": f"Maximum iterations ({options['max_iterations']}) reached without finding sorted permutation"
            })
            
            # Educational insight: sorting manually for demonstration
            if options["provide_learning_insights"]:
                # Sort the array using a reliable method for educational purposes
                result.sort(key=lambda x: x)  # Use simple sort for demonstration
                
                self.record_state(result, {
                    "type": "educational",
                    "concept": "algorithm-selection",
                    "message": "Key Learning Outcome:",
                    "details": [
                        "Bogo Sort failed to sort the array within a reasonable time frame",
                        "This demonstrates why algorithm selection is critical for practical applications",
                        "Deterministic algorithms like Merge Sort, Quick Sort, or Heap Sort provide guaranteed performance",
                        "For this demonstration, we've applied a deterministic sort to complete the visualization"
                    ]
                })
        
        self.set_phase("completed")
        return result

    def _shuffle(self, array: List[Any], options: Dict[str, Any]) -> None:
        """
        Shuffle an array using Fisher-Yates algorithm.
        
        Args:
            array: The array to shuffle
            options: Runtime options
        """
        n = len(array)
        
        if options["optimized_shuffle"]:
            # Optimized Fisher-Yates shuffle
            for i in range(n - 1, 0, -1):
                # Generate a random index from 0 to i
                j = random.randint(0, i)
                
                # Swap elements at i and j
                self.swap(array, i, j)
        else:
            # Naive shuffle (less efficient but easier to understand)
            for i in range(n):
                # Generate a random index from 0 to n-1
                j = random.randint(0, n - 1)
                
                # Swap elements at i and j
                self.swap(array, i, j)

    def _is_sorted(self, array: List[Any], record: bool = True) -> bool:
        """
        Check if an array is sorted.
        
        Args:
            array: The array to check
            record: Whether to record comparisons
            
        Returns:
            True if the array is sorted
        """
        for i in range(1, len(array)):
            # Check if current element is less than previous element
            if record:
                if self.compare(array[i - 1], array[i]) > 0:
                    return False
            else:
                # Don't record the comparison for efficiency
                if array[i - 1] > array[i]:
                    return False
        return True

    def _calculate_factorial(self, n: int) -> int:
        """
        Calculate factorial of n (n!).
        
        Args:
            n: Input value
            
        Returns:
            n!
        """
        if n <= 1:
            return 1
        
        result = 1
        for i in range(2, n + 1):
            result *= i
        return result

    def _format_large_number(self, num: int) -> str:
        """
        Format large numbers for display.
        
        Args:
            num: Number to format
            
        Returns:
            Formatted number string
        """
        if num < 1000:
            return str(num)
        
        if num < 1000000:
            return f"{num / 1000:.2f}K"
        
        if num < 1000000000:
            return f"{num / 1000000:.2f}M"
        
        if num < 1000000000000:
            return f"{num / 1000000000:.2f}B"
        
        return f"{num:.6e}"

    def get_complexity(self) -> Dict[str, Dict[str, str]]:
        """
        Get the time and space complexity of Bogo Sort.
        
        Returns:
            Complexity information dictionary
        """
        return {
            "time": {
                "best": "O(n)",  # When already sorted (extremely unlikely)
                "average": "O(n × n!)",  # Expected number of iterations is n!
                "worst": "Unbounded"  # Theoretically could run forever
            },
            "space": {
                "best": "O(1)",
                "average": "O(1)",
                "worst": "O(1)"
            }
        }

    def is_stable(self) -> bool:
        """
        Whether Bogo Sort is stable (preserves relative order of equal elements).
        
        Returns:
            False as Bogo Sort is not stable
        """
        return False

    def is_in_place(self) -> bool:
        """
        Whether Bogo Sort is in-place (uses O(1) auxiliary space).
        
        Returns:
            True as Bogo Sort is in-place
        """
        return True
    
    def get_info(self) -> Dict[str, Any]:
        """
        Get detailed information about the algorithm.
        
        Returns:
            Dictionary with algorithm details
        """
        info = super().get_info()
        
        # Add algorithm-specific information
        info.update({
            "optimization": {
                "detailed_permutations": self.options.get("detailed_permutations", True),
                "optimized_shuffle": self.options.get("optimized_shuffle", True),
                "deterministic_seed": self.options.get("deterministic_seed", False),
                "max_iterations": self.options.get("max_iterations", 1000)
            },
            "properties": {
                "comparison_based": True,
                "stable": False,
                "in_place": True,
                "deterministic": False,
                "probabilistic": True
            },
            "suitable_for": {
                "small_arrays": False,
                "large_arrays": False,
                "practical_use": False,
                "educational_context": True
            },
            "mathematical_foundations": {
                "probability_model": "Uniform random permutation generation",
                "expected_iterations": "n! (factorial of array length)",
                "worst_case_scenario": "Unbounded (theoretically infinite)",
                "convergence_properties": "Almost surely converges to the solution as iterations approach infinity"
            },
            "learning_objectives": [
                {
                    "level": "Foundational",
                    "concept": "Permutation Generation",
                    "understanding": "Learn how random permutations are generated and how to implement the Fisher-Yates shuffle"
                },
                {
                    "level": "Intermediate",
                    "concept": "Probability Theory",
                    "understanding": "Calculate the probability of randomly generating a sorted permutation and understand expected running time"
                },
                {
                    "level": "Advanced",
                    "concept": "Algorithmic Efficiency",
                    "understanding": "Compare randomized algorithms with deterministic approaches and understand complexity classes"
                },
                {
                    "level": "Expert",
                    "concept": "Computational Limitations",
                    "understanding": "Explore the boundaries of computability and the practical limitations of randomized approaches"
                }
            ],
            "reflective_questions": [
                "How would the expected running time change if we only kept permutations that improved the number of elements in their correct positions?",
                "What mathematical principle explains why Bogo Sort becomes exponentially more inefficient as array size increases?",
                "How does Bogo Sort illustrate the difference between theoretical computability and practical feasibility?",
                "In what scenarios might randomized algorithms actually outperform deterministic ones, unlike Bogo Sort?"
            ],
            "historical_context": {
                "origin": "Created primarily as a joke or educational example",
                "significance": "Serves as a canonical example of an inefficient algorithm in computer science education",
                "alternatives": "Variants include Bogobogosort (recursively apply Bogo Sort) and Quantum Bogosort (theoretical joke algorithm)"
            }
        })
        
        return info


# Example usage
if __name__ == "__main__":
    # Create and run a simple test
    sorter = BogoSort({
        "detailed_permutations": True,
        "optimized_shuffle": True,
        "max_iterations": 100
    })
    
    # Use a very small array since Bogo Sort is extremely inefficient
    test_array = [3, 1, 4, 2]
    
    result = sorter.execute(test_array)
    print(f"Original: {test_array}")
    print(f"Sorted: {result}")
    print(f"Permutations tried: {sorter.permutation_count}")
    print(f"Comparisons: {sorter.metrics['comparisons']}")
    print(f"Swaps: {sorter.metrics['swaps']}")
