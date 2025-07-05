"""
Algorithm Visualization Data Generation Utilities

This module provides sophisticated facilities for generating diverse data patterns 
specifically optimized for sorting algorithm visualization, analysis, and education.
It implements a comprehensive taxonomy of data distributions and edge cases
that collectively exercise the full range of algorithmic behaviors.

The generators follow a unified interface with a rich set of parameters for precise
control over statistical properties, distribution characteristics, and adversarial patterns.

Key features:
- Standard test sequences (random, sorted, reversed, nearly-sorted)
- Statistical distributions (uniform, gaussian, exponential, bimodal, etc.)
- Algorithm-specific adversarial cases with tailored worst-case patterns
- Specialized patterns for educational visualization
- Parameterized control of distribution properties
- Advanced analytical utilities for dataset characterization

Implementation priorities:
- Computational efficiency (O(n) generation for most patterns)
- Statistical fidelity (accurate representation of theoretical distributions)
- Reproducibility (deterministic output with optional seeding)
- Educational clarity (patterns designed to illuminate algorithmic principles)

For algorithm research, the adversarial case generators provide targeted test cases
for exploring worst-case complexity scenarios and algorithm-specific vulnerabilities.

Authors:
    Algorithm Visualization Platform Team

Version:
    2.1.0
"""

import random
import math
import statistics
from typing import List, Dict, Any, Union, Tuple, Callable, Optional, TypeVar, Set
import numpy as np
from collections import defaultdict

# Type aliases for improved code clarity and static analysis
Numeric = TypeVar('Numeric', int, float)
DataArray = List[Numeric]
IndexPair = Tuple[int, int]
Distribution = Dict[str, Any]

# Default random number generator for reproducibility control
_RNG = random.Random()


def set_seed(seed: Optional[int] = None) -> None:
    """
    Set the random seed for reproducible data generation.
    
    This affects all generators in this module that use randomness. Setting a fixed
    seed enables reproducible results, which is critical for algorithm comparison
    and regression testing.
    
    Args:
        seed: Integer seed for the random number generator. If None, uses a random seed.
    """
    global _RNG
    if seed is not None:
        _RNG = random.Random(seed)
        np.random.seed(seed)
    else:
        _RNG = random.Random()
        np.random.seed(None)


def generate_dataset(data_type: str, size: int, **options) -> DataArray:
    """
    Generate a dataset of specified type and characteristics.
    
    This function serves as the primary interface to the data generation system,
    dispatching to specialized generators based on the requested data type.
    
    Time complexity: O(n) for most generators
    Space complexity: O(n)
    
    Args:
        data_type: Type of data to generate (e.g. 'random', 'nearly-sorted', etc.)
        size: Number of elements in the dataset
        **options: Additional options specific to each generator type
    
    Returns:
        Generated data array with specified characteristics
    
    Raises:
        ValueError: If data_type is unrecognized
    
    Examples:
        >>> generate_dataset('random', 10, min_val=1, max_val=100)
        [42, 27, 98, 55, 37, 12, 76, 4, 68, 91]
        
        >>> generate_dataset('nearly-sorted', 10, min_val=1, max_val=10, perturbation=0.2)
        [1, 2, 3, 5, 4, 6, 7, 9, 8, 10]
    """
    # Process and normalize options with defaults
    options = {
        'min_val': options.get('min_val', 1),
        'max_val': options.get('max_val', 100),
        'unique_values': options.get('unique_values', 10),
        'sorted_ratio': options.get('sorted_ratio', 0.9),
        'reversed_ratio': options.get('reversed_ratio', 0.9),
        'perturbation': options.get('perturbation', 0.1),
        'distribution_params': options.get('distribution_params', {}),
        'seed': options.get('seed', None)
    }
    
    # Set seed if provided
    if options['seed'] is not None:
        set_seed(options['seed'])
    
    # Map data type to appropriate generator function
    generator_map = {
        'random': generate_random_data,
        'sorted': generate_sorted_data,
        'reversed': generate_reversed_data,
        'nearly-sorted': generate_nearly_sorted_data,
        'few-unique': generate_few_unique_data,
        'sawtooth': generate_sawtooth_data,
        'plateau': generate_plateau_data,
        'gaussian': lambda s, **opts: generate_distribution('gaussian', s, **opts),
        'exponential': lambda s, **opts: generate_distribution('exponential', s, **opts),
        'bimodal': lambda s, **opts: generate_distribution('bimodal', s, **opts),
        'k-sorted': generate_k_sorted_array
    }
    
    # Get appropriate generator function
    generator = generator_map.get(data_type.lower())
    
    if not generator:
        # Check for algorithm-specific adversarial case
        if data_type.lower().endswith('-adversarial'):
            algorithm = data_type.lower().split('-')[0]
            return generate_adversarial_case(algorithm, size, **options)
        else:
            raise ValueError(f"Unknown data type: {data_type}. "
                            f"Available types: {', '.join(generator_map.keys())}")
    
    # Generate and return the dataset
    return generator(size, **options)


def generate_random_data(size: int, min_val: int = 1, max_val: int = 100, **kwargs) -> DataArray:
    """
    Generate an array of random integers uniformly distributed in the given range.
    
    This is the fundamental generator, producing uniformly distributed random values.
    It serves as a baseline for algorithm performance testing and visualization.
    
    Time complexity: O(n)
    Space complexity: O(n)
    
    Args:
        size: Number of elements to generate
        min_val: Minimum value (inclusive)
        max_val: Maximum value (inclusive)
        **kwargs: Additional parameters (ignored)
    
    Returns:
        List of random integers
    
    Examples:
        >>> random.seed(42)  # For reproducible testing
        >>> generate_random_data(5, 1, 10)
        [7, 6, 1, 8, 4]
    """
    if size < 0:
        raise ValueError("Size must be non-negative")
    
    if min_val > max_val:
        raise ValueError("min_val must be less than or equal to max_val")
    
    return [_RNG.randint(min_val, max_val) for _ in range(size)]


def generate_sorted_data(size: int, min_val: int = 1, max_val: int = 100, **kwargs) -> DataArray:
    """
    Generate a sorted array of integers, evenly distributed across the range.
    
    This function creates an array where values increase monotonically. It's useful
    for testing best-case scenarios for many sorting algorithms and for verifying
    the stability of algorithms when processing already-sorted data.
    
    Time complexity: O(n)
    Space complexity: O(n)
    
    Args:
        size: Number of elements to generate
        min_val: Minimum value (inclusive)
        max_val: Maximum value (inclusive)
        **kwargs: Additional parameters (ignored)
    
    Returns:
        Sorted list of integers
    
    Examples:
        >>> generate_sorted_data(5, 1, 10)
        [1, 3, 5, 8, 10]
    """
    if size < 0:
        raise ValueError("Size must be non-negative")
    
    if min_val > max_val:
        raise ValueError("min_val must be less than or equal to max_val")
    
    if size <= 1:
        return [min_val] * size
    
    # Calculate the step size
    step = (max_val - min_val) / (size - 1)
    
    # Generate evenly distributed values
    return [min_val + round(i * step) for i in range(size)]


def generate_reversed_data(size: int, min_val: int = 1, max_val: int = 100, 
                           reversed_ratio: float = 1.0, **kwargs) -> DataArray:
    """
    Generate a reversed (descending) array of integers.
    
    This function creates an array where values decrease monotonically. It's useful
    for testing worst-case scenarios for many comparison-based sorting algorithms.
    The reversed_ratio parameter allows for creating partially reversed arrays.
    
    Time complexity: O(n)
    Space complexity: O(n)
    
    Args:
        size: Number of elements to generate
        min_val: Minimum value (inclusive)
        max_val: Maximum value (inclusive)
        reversed_ratio: How reversed the array should be (0.0-1.0)
                       1.0 = fully reversed, 0.0 = random order
        **kwargs: Additional parameters (ignored)
    
    Returns:
        Reversed list of integers
    
    Examples:
        >>> generate_reversed_data(5, 1, 10)
        [10, 8, 5, 3, 1]
        
        >>> generate_reversed_data(5, 1, 10, reversed_ratio=0.5)
        [10, 8, 3, 5, 1]  # Partially reversed
    """
    if size < 0:
        raise ValueError("Size must be non-negative")
    
    if min_val > max_val:
        raise ValueError("min_val must be less than or equal to max_val")
    
    if not 0.0 <= reversed_ratio <= 1.0:
        raise ValueError("reversed_ratio must be between 0.0 and 1.0")
    
    if size <= 1:
        return [min_val] * size
    
    # First generate a sorted array
    sorted_data = generate_sorted_data(size, min_val, max_val)
    
    # Reverse it
    reversed_data = sorted_data[::-1]
    
    # If fully reversed is requested, return immediately
    if reversed_ratio >= 1.0:
        return reversed_data
    
    # Otherwise, perturb the order based on the reversed_ratio
    result = reversed_data.copy()
    
    # Number of elements to shuffle
    shuffle_count = int(size * (1.0 - reversed_ratio))
    
    # Shuffle random pairs
    for _ in range(shuffle_count):
        i = _RNG.randint(0, size - 1)
        j = _RNG.randint(0, size - 1)
        result[i], result[j] = result[j], result[i]
    
    return result


def generate_nearly_sorted_data(size: int, min_val: int = 1, max_val: int = 100,
                               sorted_ratio: float = 0.9, **kwargs) -> DataArray:
    """
    Generate a nearly-sorted array with controlled perturbation.
    
    This creates an array that is mostly in sorted order, but with some elements
    out of place. The sorted_ratio parameter controls how sorted the array is.
    This is useful for testing adaptive sorting algorithms that perform well on
    nearly-sorted data.
    
    Time complexity: O(n)
    Space complexity: O(n)
    
    Args:
        size: Number of elements to generate
        min_val: Minimum value (inclusive)
        max_val: Maximum value (inclusive)
        sorted_ratio: How sorted the array should be (0.0-1.0)
                     1.0 = fully sorted, 0.0 = random order
        **kwargs: Additional parameters (ignored)
    
    Returns:
        Nearly-sorted list of integers
    
    Examples:
        >>> random.seed(42)
        >>> generate_nearly_sorted_data(10, 1, 10, sorted_ratio=0.8)
        [1, 2, 4, 3, 5, 6, 7, 9, 8, 10]
    """
    if size < 0:
        raise ValueError("Size must be non-negative")
    
    if min_val > max_val:
        raise ValueError("min_val must be less than or equal to max_val")
    
    if not 0.0 <= sorted_ratio <= 1.0:
        raise ValueError("sorted_ratio must be between 0.0 and 1.0")
    
    # Generate sorted array first
    result = generate_sorted_data(size, min_val, max_val)
    
    # Fully sorted case
    if sorted_ratio >= 1.0:
        return result
    
    # Random case
    if sorted_ratio <= 0.0:
        return generate_random_data(size, min_val, max_val)
    
    # Calculate how many elements to perturb
    perturbation_count = int(size * (1.0 - sorted_ratio))
    
    # For more realistic nearly-sorted data, perform local swaps
    max_displacement = max(3, int(size * 0.1))  # Limit displacement to maintain "nearly-sorted" property
    
    for _ in range(perturbation_count):
        idx = _RNG.randint(0, size - 1)
        # Choose a displacement within the max range, but keep it within array bounds
        displacement = _RNG.randint(-max_displacement, max_displacement)
        swap_idx = max(0, min(size - 1, idx + displacement))
        
        # Swap the elements
        result[idx], result[swap_idx] = result[swap_idx], result[idx]
    
    return result


def generate_few_unique_data(size: int, min_val: int = 1, max_val: int = 100,
                            unique_values: int = 10, **kwargs) -> DataArray:
    """
    Generate an array with few unique values.
    
    This creates an array where elements are drawn from a small set of unique values.
    This is useful for testing algorithms that may have special optimizations for
    datasets with low cardinality (e.g. counting sort).
    
    Time complexity: O(n)
    Space complexity: O(n)
    
    Args:
        size: Number of elements to generate
        min_val: Minimum value (inclusive)
        max_val: Maximum value (inclusive)
        unique_values: Number of unique values in the array
        **kwargs: Additional parameters (ignored)
    
    Returns:
        List of integers with few unique values
    
    Examples:
        >>> random.seed(42)
        >>> generate_few_unique_data(10, 1, 100, unique_values=3)
        [42, 42, 13, 13, 13, 42, 13, 13, 42, 42]
    """
    if size < 0:
        raise ValueError("Size must be non-negative")
    
    if min_val > max_val:
        raise ValueError("min_val must be less than or equal to max_val")
    
    # Cap unique_values to be at most the range size
    unique_values = min(unique_values, max_val - min_val + 1)
    
    # Generate the unique values evenly distributed across the range
    value_range = max_val - min_val + 1
    unique_set = []
    
    if unique_values <= 1:
        unique_set = [min_val]
    else:
        step = value_range / (unique_values - 1)
        unique_set = [min_val + int(i * step) for i in range(unique_values)]
    
    # Generate the array by randomly selecting from unique values
    return [_RNG.choice(unique_set) for _ in range(size)]


def generate_sawtooth_data(size: int, min_val: int = 1, max_val: int = 100,
                          teeth: int = None, **kwargs) -> DataArray:
    """
    Generate a sawtooth pattern array where values repeatedly increase and reset.
    
    This creates an array with multiple "teeth" where values rise linearly and then
    drop back to the minimum. This pattern is useful for testing algorithms that may
    benefit from or be challenged by repeated patterns.
    
    Time complexity: O(n)
    Space complexity: O(n)
    
    Args:
        size: Number of elements to generate
        min_val: Minimum value (inclusive)
        max_val: Maximum value (inclusive)
        teeth: Number of sawtooth patterns (defaults to size/20)
        **kwargs: Additional parameters (ignored)
    
    Returns:
        List of integers in a sawtooth pattern
    
    Examples:
        >>> generate_sawtooth_data(10, 1, 10, teeth=2)
        [1, 3, 5, 7, 9, 1, 3, 5, 7, 9]
    """
    if size < 0:
        raise ValueError("Size must be non-negative")
    
    if min_val > max_val:
        raise ValueError("min_val must be less than or equal to max_val")
    
    if size == 0:
        return []
    
    # Default teeth count if not specified
    if teeth is None:
        teeth = max(2, size // 20)
    
    teeth = max(1, min(teeth, size))  # Ensure at least 1 tooth, at most size teeth
    
    # Calculate elements per tooth
    elements_per_tooth = size / teeth
    value_range = max_val - min_val
    
    result = []
    for i in range(size):
        # Position within the current tooth (0 to 1)
        tooth_idx = i / elements_per_tooth
        position = tooth_idx - math.floor(tooth_idx)  # Fractional part
        
        # Linear ramp from min_val to max_val
        value = min_val + int(position * value_range)
        result.append(value)
    
    return result


def generate_plateau_data(size: int, min_val: int = 1, max_val: int = 100,
                         plateaus: int = None, **kwargs) -> DataArray:
    """
    Generate a plateau pattern with sections of constant values.
    
    This creates an array with "plateaus" where sections of the array have identical values.
    This pattern is useful for testing stability in sorting algorithms and for
    visualizing how algorithms handle regions of equal values.
    
    Time complexity: O(n)
    Space complexity: O(n)
    
    Args:
        size: Number of elements to generate
        min_val: Minimum value (inclusive)
        max_val: Maximum value (inclusive)
        plateaus: Number of constant-value sections (defaults to sqrt(size))
        **kwargs: Additional parameters (ignored)
    
    Returns:
        List of integers with plateau pattern
    
    Examples:
        >>> generate_plateau_data(10, 1, 100, plateaus=2)
        [1, 1, 1, 1, 1, 100, 100, 100, 100, 100]
    """
    if size < 0:
        raise ValueError("Size must be non-negative")
    
    if min_val > max_val:
        raise ValueError("min_val must be less than or equal to max_val")
    
    if size == 0:
        return []
    
    # Default plateaus count if not specified
    if plateaus is None:
        plateaus = max(2, int(math.sqrt(size)))
    
    plateaus = max(1, min(plateaus, size))  # Ensure at least 1 plateau, at most size plateaus
    
    # Calculate elements per plateau
    elements_per_plateau = math.ceil(size / plateaus)
    
    # Generate plateau values (ascending order for clarity)
    if plateaus == 1:
        plateau_values = [min_val]
    else:
        step = (max_val - min_val) / (plateaus - 1)
        plateau_values = [min_val + int(i * step) for i in range(plateaus)]
    
    # Build the array
    result = []
    for i in range(plateaus):
        value = plateau_values[i]
        count = min(elements_per_plateau, size - len(result))
        result.extend([value] * count)
    
    return result


def generate_distribution(distribution_type: str, size: int, min_val: int = 1, 
                         max_val: int = 100, **kwargs) -> DataArray:
    """
    Generate an array with values following a specified statistical distribution.
    
    This function creates datasets with various statistical properties, useful for
    testing algorithm behavior on data with specific distributions.
    
    Time complexity: Varies by distribution, generally O(n)
    Space complexity: O(n)
    
    Args:
        distribution_type: Type of distribution ('gaussian', 'uniform', etc.)
        size: Number of elements to generate
        min_val: Minimum value (inclusive)
        max_val: Maximum value (inclusive)
        **kwargs: Distribution-specific parameters
    
    Returns:
        List of integers following the specified distribution
    
    Raises:
        ValueError: If distribution_type is unrecognized
    
    Examples:
        >>> random.seed(42)
        >>> generate_distribution('gaussian', 10, 1, 100, mean=50, std_dev=10)
        [52, 58, 46, 48, 59, 41, 53, 50, 45, 39]
    """
    if size < 0:
        raise ValueError("Size must be non-negative")
    
    if min_val > max_val:
        raise ValueError("min_val must be less than or equal to max_val")
    
    # Map distribution type to generation function
    distribution_map = {
        'uniform': generate_uniform_distribution,
        'gaussian': generate_gaussian_distribution,
        'normal': generate_gaussian_distribution,  # Alias
        'exponential': generate_exponential_distribution,
        'bimodal': generate_bimodal_distribution,
        'pareto': generate_pareto_distribution,
        'log-normal': generate_lognormal_distribution
    }
    
    generator = distribution_map.get(distribution_type.lower())
    
    if not generator:
        raise ValueError(f"Unknown distribution type: {distribution_type}. "
                        f"Available types: {', '.join(distribution_map.keys())}")
    
    # Forward the call to the appropriate generator
    return generator(size, min_val, max_val, **kwargs)


def generate_uniform_distribution(size: int, min_val: int = 1, max_val: int = 100, **kwargs) -> DataArray:
    """
    Generate uniformly distributed random values.
    
    This is simply an alias for generate_random_data for consistency in the API.
    
    Args:
        size: Number of elements to generate
        min_val: Minimum value (inclusive)
        max_val: Maximum value (inclusive)
        **kwargs: Additional parameters (ignored)
    
    Returns:
        List of uniformly distributed random integers
    """
    return generate_random_data(size, min_val, max_val)


def generate_gaussian_distribution(size: int, min_val: int = 1, max_val: int = 100,
                                 mean: Optional[float] = None, std_dev: Optional[float] = None,
                                 **kwargs) -> DataArray:
    """
    Generate values following a Gaussian (normal) distribution.
    
    This function creates an array with values clustered around a central mean,
    following the classic bell curve pattern. Values are clamped to the specified
    range.
    
    Time complexity: O(n)
    Space complexity: O(n)
    
    Args:
        size: Number of elements to generate
        min_val: Minimum value (inclusive)
        max_val: Maximum value (inclusive)
        mean: Center of the distribution (defaults to midpoint of range)
        std_dev: Standard deviation (defaults to 1/6 of the range)
        **kwargs: Additional parameters (ignored)
    
    Returns:
        List of integers following a Gaussian distribution
    
    Examples:
        >>> random.seed(42)
        >>> generate_gaussian_distribution(5, 1, 100, mean=50, std_dev=10)
        [52, 58, 46, 48, 59]
    """
    if size < 0:
        raise ValueError("Size must be non-negative")
    
    if min_val > max_val:
        raise ValueError("min_val must be less than or equal to max_val")
    
    # Default mean and standard deviation if not provided
    if mean is None:
        mean = (min_val + max_val) / 2
    
    if std_dev is None:
        # Default to 1/6 of the range, which puts about 99.7% of values within range
        std_dev = (max_val - min_val) / 6
    
    result = []
    
    # Generate values using Box-Muller transform or numpy
    if np:
        # NumPy is more efficient for large arrays
        raw_values = np.random.normal(mean, std_dev, size)
        # Clamp values to range and convert to integers
        result = [int(max(min_val, min(max_val, val))) for val in raw_values]
    else:
        # Fallback to direct implementation if NumPy isn't available
        while len(result) < size:
            # Box-Muller transform to generate normally distributed values
            u1 = _RNG.random()
            u2 = _RNG.random()
            z0 = math.sqrt(-2.0 * math.log(u1)) * math.cos(2.0 * math.pi * u2)
            val = int(mean + z0 * std_dev)
            
            # Only add if in range
            if min_val <= val <= max_val:
                result.append(val)
    
    return result


def generate_exponential_distribution(size: int, min_val: int = 1, max_val: int = 100,
                                    lambda_param: float = 0.1, **kwargs) -> DataArray:
    """
    Generate values following an exponential distribution.
    
    This function creates an array where values are distributed according to an
    exponential decay pattern. Values are more concentrated near the minimum and
    become increasingly sparse toward the maximum.
    
    Time complexity: O(n)
    Space complexity: O(n)
    
    Args:
        size: Number of elements to generate
        min_val: Minimum value (inclusive)
        max_val: Maximum value (inclusive)
        lambda_param: Rate parameter for exponential (smaller = more spread out)
        **kwargs: Additional parameters (ignored)
    
    Returns:
        List of integers following an exponential distribution
    
    Examples:
        >>> random.seed(42)
        >>> generate_exponential_distribution(5, 1, 100, lambda_param=0.05)
        [1, 25, 8, 14, 97]
    """
    if size < 0:
        raise ValueError("Size must be non-negative")
    
    if min_val > max_val:
        raise ValueError("min_val must be less than or equal to max_val")
    
    if lambda_param <= 0:
        raise ValueError("lambda_param must be positive")
    
    result = []
    value_range = max_val - min_val
    
    if np:
        # More efficient implementation with NumPy
        raw_values = np.random.exponential(1/lambda_param, size)
        
        # Scale to range and convert to integers
        result = [min_val + int(min(value_range, val % value_range)) for val in raw_values]
    else:
        # Direct implementation
        for _ in range(size):
            u = _RNG.random()
            # Inverse CDF for exponential distribution
            val = min_val + int((-math.log(1 - u) / lambda_param) % value_range)
            result.append(min(max_val, val))
    
    return result


def generate_bimodal_distribution(size: int, min_val: int = 1, max_val: int = 100,
                                mean1: Optional[float] = None, std_dev1: Optional[float] = None,
                                mean2: Optional[float] = None, std_dev2: Optional[float] = None,
                                mix: float = 0.5, **kwargs) -> DataArray:
    """
    Generate values following a bimodal distribution (mixture of two Gaussians).
    
    This function creates an array with values clustered around two different means,
    creating a two-peaked distribution. This is useful for testing algorithms on data
    with multiple clusters.
    
    Time complexity: O(n)
    Space complexity: O(n)
    
    Args:
        size: Number of elements to generate
        min_val: Minimum value (inclusive)
        max_val: Maximum value (inclusive)
        mean1: Center of first peak (default: 1/3 of range)
        std_dev1: Standard deviation of first peak (default: 1/10 of range)
        mean2: Center of second peak (default: 2/3 of range)
        std_dev2: Standard deviation of second peak (default: 1/10 of range)
        mix: Mixing parameter between the two distributions (0-1)
        **kwargs: Additional parameters (ignored)
    
    Returns:
        List of integers following a bimodal distribution
    
    Examples:
        >>> random.seed(42)
        >>> generate_bimodal_distribution(10, 1, 100, mean1=25, mean2=75)
        [28, 79, 20, 67, 71, 17, 78, 29, 79, 32]
    """
    if size < 0:
        raise ValueError("Size must be non-negative")
    
    if min_val > max_val:
        raise ValueError("min_val must be less than or equal to max_val")
    
    if not 0 <= mix <= 1:
        raise ValueError("mix parameter must be between 0 and 1")
    
    value_range = max_val - min_val
    
    # Default parameters if not provided
    if mean1 is None:
        mean1 = min_val + value_range / 3
    
    if std_dev1 is None:
        std_dev1 = value_range / 10
    
    if mean2 is None:
        mean2 = min_val + 2 * value_range / 3
    
    if std_dev2 is None:
        std_dev2 = value_range / 10
    
    result = []
    
    if np:
        # Efficient NumPy implementation
        # Determine number of samples from each distribution
        n1 = int(size * mix)
        n2 = size - n1
        
        # Generate samples from each distribution
        dist1 = np.random.normal(mean1, std_dev1, n1)
        dist2 = np.random.normal(mean2, std_dev2, n2)
        
        # Combine and convert to integers within range
        combined = np.concatenate([dist1, dist2])
        np.random.shuffle(combined)  # Shuffle to mix the distributions
        
        result = [int(max(min_val, min(max_val, val))) for val in combined]
    else:
        # Direct implementation
        for _ in range(size):
            # Choose which distribution to sample from
            if _RNG.random() < mix:
                # Sample from first distribution
                u1 = _RNG.random()
                u2 = _RNG.random()
                z0 = math.sqrt(-2.0 * math.log(u1)) * math.cos(2.0 * math.pi * u2)
                val = int(mean1 + z0 * std_dev1)
            else:
                # Sample from second distribution
                u1 = _RNG.random()
                u2 = _RNG.random()
                z0 = math.sqrt(-2.0 * math.log(u1)) * math.cos(2.0 * math.pi * u2)
                val = int(mean2 + z0 * std_dev2)
            
            # Clamp to range
            val = max(min_val, min(max_val, val))
            result.append(val)
    
    return result


def generate_pareto_distribution(size: int, min_val: int = 1, max_val: int = 100,
                               alpha: float = 1.5, **kwargs) -> DataArray:
    """
    Generate values following a Pareto (power-law) distribution.
    
    This function creates an array where values follow the "80/20 rule" or similar
    power-law distributions. This is useful for modeling many real-world phenomena
    with long-tail distributions.
    
    Time complexity: O(n)
    Space complexity: O(n)
    
    Args:
        size: Number of elements to generate
        min_val: Minimum value (inclusive)
        max_val: Maximum value (inclusive)
        alpha: Shape parameter (smaller values = heavier tail)
        **kwargs: Additional parameters (ignored)
    
    Returns:
        List of integers following a Pareto distribution
    
    Examples:
        >>> random.seed(42)
        >>> generate_pareto_distribution(5, 1, 100, alpha=1.5)
        [1, 3, 1, 2, 22]
    """
    if size < 0:
        raise ValueError("Size must be non-negative")
    
    if min_val > max_val:
        raise ValueError("min_val must be less than or equal to max_val")
    
    if alpha <= 0:
        raise ValueError("alpha parameter must be positive")
    
    result = []
    value_range = max_val - min_val
    
    if np:
        # Efficient NumPy implementation
        raw_values = np.random.pareto(alpha, size)
        
        # Scale to range and convert to integers
        scaled_values = raw_values * (value_range / 20)  # Scale factor can be adjusted
        result = [min_val + int(min(value_range, val)) for val in scaled_values]
    else:
        # Direct implementation
        for _ in range(size):
            u = _RNG.random()
            # Inverse CDF for Pareto distribution
            raw_val = (1 / ((1 - u) ** (1 / alpha))) - 1
            
            # Scale to range
            scaled_val = raw_val * (value_range / 20)  # Scale factor can be adjusted
            val = min_val + int(min(value_range, scaled_val))
            result.append(val)
    
    return result


def generate_lognormal_distribution(size: int, min_val: int = 1, max_val: int = 100,
                                  mu: float = 0, sigma: float = 1, **kwargs) -> DataArray:
    """
    Generate values following a log-normal distribution.
    
    This function creates an array where the logarithm of the values follows a normal
    distribution. This creates a right-skewed distribution useful for modeling many
    natural processes.
    
    Time complexity: O(n)
    Space complexity: O(n)
    
    Args:
        size: Number of elements to generate
        min_val: Minimum value (inclusive)
        max_val: Maximum value (inclusive)
        mu: Mean of the underlying normal distribution
        sigma: Standard deviation of the underlying normal distribution
        **kwargs: Additional parameters (ignored)
    
    Returns:
        List of integers following a log-normal distribution
    
    Examples:
        >>> random.seed(42)
        >>> generate_lognormal_distribution(5, 1, 100)
        [3, 8, 2, 5, 31]
    """
    if size < 0:
        raise ValueError("Size must be non-negative")
    
    if min_val > max_val:
        raise ValueError("min_val must be less than or equal to max_val")
    
    if sigma <= 0:
        raise ValueError("sigma parameter must be positive")
    
    result = []
    value_range = max_val - min_val
    
    if np:
        # Efficient NumPy implementation
        raw_values = np.random.lognormal(mu, sigma, size)
        
        # Scale to range and convert to integers
        # Find the 95th percentile to normalize the distribution
        p95 = np.percentile(raw_values, 95)
        scaling_factor = value_range / p95
        
        scaled_values = raw_values * scaling_factor
        result = [min_val + int(min(value_range, val)) for val in scaled_values]
    else:
        # Generate log-normal values directly
        values = []
        for _ in range(size):
            u1 = _RNG.random()
            u2 = _RNG.random()
            
            # Box-Muller transform to get normal distribution
            z = math.sqrt(-2.0 * math.log(u1)) * math.cos(2.0 * math.pi * u2)
            
            # Apply log-normal transformation
            lognormal = math.exp(mu + sigma * z)
            values.append(lognormal)
        
        # Scale to range
        p95 = sorted(values)[int(0.95 * len(values))]
        scaling_factor = value_range / p95
        
        for val in values:
            scaled_val = val * scaling_factor
            result.append(min_val + int(min(value_range, scaled_val)))
    
    return result


def generate_k_sorted_array(size: int, k: int = 10, min_val: int = 1, max_val: int = 100,
                           **kwargs) -> DataArray:
    """
    Generate a k-sorted array where each element is at most k positions away from its sorted position.
    
    This creates an array that is partially sorted, with each element within a limited
    distance of its final position. This is useful for testing adaptive sorting algorithms
    that can take advantage of partial ordering.
    
    Time complexity: O(n)
    Space complexity: O(n)
    
    Args:
        size: Number of elements to generate
        k: Maximum displacement from sorted position
        min_val: Minimum value (inclusive)
        max_val: Maximum value (inclusive)
        **kwargs: Additional parameters (ignored)
    
    Returns:
        K-sorted list of integers
    
    Examples:
        >>> random.seed(42)
        >>> generate_k_sorted_array(10, k=2, min_val=1, max_val=10)
        [1, 2, 5, 3, 4, 7, 6, 8, 9, 10]
    """
    if size < 0:
        raise ValueError("Size must be non-negative")
    
    if min_val > max_val:
        raise ValueError("min_val must be less than or equal to max_val")
    
    if k < 0:
        raise ValueError("k must be non-negative")
    
    # Generate a sorted array first
    sorted_array = generate_sorted_data(size, min_val, max_val)
    
    # Early return for special cases
    if size <= 1 or k == 0:
        return sorted_array
    
    # Make a copy to avoid modifying the original
    result = sorted_array.copy()
    
    # Perturb the array by moving elements at most k positions
    for i in range(size):
        # Maximum possible displacement while staying in bounds
        max_displacement = min(k, min(i, size - 1 - i))
        
        if max_displacement == 0:
            continue
        
        # Choose a displacement within +/- max_displacement
        displacement = _RNG.randint(-max_displacement, max_displacement)
        
        # Calculate the new position
        new_pos = i + displacement
        
        # Swap elements
        result[i], result[new_pos] = result[new_pos], result[i]
    
    return result


def generate_sorted_runs(size: int, run_size: int = 10, min_val: int = 1, max_val: int = 100,
                        **kwargs) -> DataArray:
    """
    Generate an array with sorted runs (subarrays) of a specified average size.
    
    This creates an array consisting of multiple sorted subarrays concatenated together.
    This is useful for testing algorithms like natural merge sort that can exploit
    existing runs in the data.
    
    Time complexity: O(n)
    Space complexity: O(n)
    
    Args:
        size: Number of elements to generate
        run_size: Average length of each sorted run
        min_val: Minimum value (inclusive)
        max_val: Maximum value (inclusive)
        **kwargs: Additional parameters (ignored)
    
    Returns:
        List of integers with sorted runs
    
    Examples:
        >>> random.seed(42)
        >>> generate_sorted_runs(10, run_size=3, min_val=1, max_val=100)
        [42, 68, 87, 7, 28, 73, 16, 21, 56, 87]
    """
    if size < 0:
        raise ValueError("Size must be non-negative")
    
    if min_val > max_val:
        raise ValueError("min_val must be less than or equal to max_val")
    
    if run_size < 1:
        raise ValueError("run_size must be at least 1")
    
    result = []
    current_position = 0
    
    while current_position < size:
        # Determine the size of this run (add some randomness)
        current_run_size = min(
            size - current_position,
            max(1, int(run_size * (0.5 + _RNG.random())))
        )
        
        # Generate a sorted run with random min/max values
        run_min = _RNG.randint(min_val, max_val)
        run_max = _RNG.randint(run_min, max_val)
        
        run = generate_sorted_data(current_run_size, run_min, run_max)
        
        # Add to result
        result.extend(run)
        current_position += current_run_size
    
    return result


def generate_rotated_sorted_array(size: int, rotation_point: Optional[int] = None, 
                                min_val: int = 1, max_val: int = 100, **kwargs) -> DataArray:
    """
    Generate a rotated sorted array (a sorted array rotated at a particular point).
    
    This creates an array that is sorted but has been rotated around a pivot point.
    This pattern is useful for testing specialized search algorithms like those used
    in rotated array search.
    
    Time complexity: O(n)
    Space complexity: O(n)
    
    Args:
        size: Number of elements to generate
        rotation_point: Index to rotate at (None for random rotation)
        min_val: Minimum value (inclusive)
        max_val: Maximum value (inclusive)
        **kwargs: Additional parameters (ignored)
    
    Returns:
        Rotated sorted list of integers
    
    Examples:
        >>> generate_rotated_sorted_array(7, rotation_point=3, min_val=1, max_val=7)
        [4, 5, 6, 7, 1, 2, 3]
    """
    if size < 0:
        raise ValueError("Size must be non-negative")
    
    if min_val > max_val:
        raise ValueError("min_val must be less than or equal to max_val")
    
    # Generate sorted array
    sorted_array = generate_sorted_data(size, min_val, max_val)
    
    # Choose rotation point if not specified
    if rotation_point is None:
        rotation_point = _RNG.randint(0, size - 1) if size > 0 else 0
    
    # Ensure rotation point is valid
    rotation_point = max(0, min(size - 1, rotation_point))
    
    # Perform rotation
    if size <= 1 or rotation_point >= size - 1:
        return sorted_array
    
    return sorted_array[rotation_point+1:] + sorted_array[:rotation_point+1]


def generate_adversarial_case(algorithm: str, size: int, min_val: int = 1, max_val: int = 100,
                            **kwargs) -> DataArray:
    """
    Generate an adversarial case designed to challenge a specific sorting algorithm.
    
    This function creates data patterns that trigger worst-case behavior for
    particular algorithms. These adversarial cases are valuable for understanding
    algorithmic weaknesses and for educational visualization.
    
    Time complexity: Varies by algorithm
    Space complexity: O(n)
    
    Args:
        algorithm: Algorithm name to generate adversarial data for
        size: Number of elements to generate
        min_val: Minimum value (inclusive)
        max_val: Maximum value (inclusive)
        **kwargs: Algorithm-specific parameters
    
    Returns:
        List of integers forming an adversarial case
    
    Raises:
        ValueError: If algorithm is unrecognized
    
    Examples:
        >>> generate_adversarial_case('quicksort', 5, 1, 10, pivot_strategy='first')
        [10, 8, 6, 4, 2]  # Reversed array challenges "first element" pivot strategy
    """
    if size < 0:
        raise ValueError("Size must be non-negative")
    
    if min_val > max_val:
        raise ValueError("min_val must be less than or equal to max_val")
    
    # Map algorithm to specialized generator
    adversarial_map = {
        'quicksort': _generate_quicksort_adversarial,
        'mergesort': _generate_mergesort_adversarial,
        'heapsort': _generate_heapsort_adversarial,
        'insertionsort': _generate_insertion_adversarial,
        'shellsort': _generate_shellsort_adversarial,
        'bubblesort': _generate_bubble_adversarial,
        'timsort': _generate_timsort_adversarial
    }
    
    # Get appropriate generator function
    generator = adversarial_map.get(algorithm.lower())
    
    if not generator:
        # Default to reversed for unknown algorithms
        print(f"No specific adversarial case for {algorithm}, using reversed array")
        return generate_reversed_data(size, min_val, max_val)
    
    # Generate and return the adversarial case
    return generator(size, min_val, max_val, **kwargs)


def _generate_quicksort_adversarial(size: int, min_val: int = 1, max_val: int = 100,
                                   pivot_strategy: str = 'first', **kwargs) -> DataArray:
    """
    Generate an adversarial case for QuickSort based on the pivot strategy.
    
    This creates data patterns that cause QuickSort to exhibit worst-case O(n²) behavior
    by forcing unbalanced partitions based on the pivot selection strategy.
    
    Args:
        size: Number of elements to generate
        min_val: Minimum value (inclusive)
        max_val: Maximum value (inclusive)
        pivot_strategy: Pivot selection strategy ('first', 'last', 'middle', 'median')
        **kwargs: Additional parameters (ignored)
    
    Returns:
        Adversarial array for QuickSort
    """
    if size < 0:
        raise ValueError("Size must be non-negative")
    
    if min_val > max_val:
        raise ValueError("min_val must be less than or equal to max_val")
    
    # Choose appropriate adversarial case based on pivot strategy
    pivot_strategy = pivot_strategy.lower()
    
    if pivot_strategy == 'first':
        # Worst case for first-element pivot is already sorted (descending)
        return generate_reversed_data(size, min_val, max_val)
    
    elif pivot_strategy == 'last':
        # Worst case for last-element pivot is already sorted (ascending)
        return generate_sorted_data(size, min_val, max_val)
    
    elif pivot_strategy == 'middle':
        # For middle pivot, create a pattern where middle elements are bad pivots
        return _generate_middle_pivot_adversarial(size, min_val, max_val)
    
    elif pivot_strategy == 'median' or pivot_strategy == 'median-of-three':
        # For median-of-three, create a more complex adversarial pattern
        return _generate_median_pivot_adversarial(size, min_val, max_val)
    
    else:
        # Default adversarial case
        return generate_reversed_data(size, min_val, max_val)


def _generate_middle_pivot_adversarial(size: int, min_val: int, max_val: int) -> DataArray:
    """
    Generate an adversarial case for QuickSort with middle element pivot.
    
    This creates a pattern where the middle element consistently results in
    highly unbalanced partitions.
    
    Args:
        size: Number of elements to generate
        min_val: Minimum value (inclusive)
        max_val: Maximum value (inclusive)
    
    Returns:
        Adversarial array for middle-pivot QuickSort
    """
    if size <= 1:
        return [min_val] * size
    
    result = []
    value_range = max_val - min_val
    half_size = size // 2
    
    # Build a pattern that causes middle pivot to be near the min or max value
    for i in range(size):
        if i < half_size:
            # First half gets increasing values starting near min_val
            value = min_val + int((i / half_size) * (value_range / 3))
        else:
            # Second half gets values near max_val
            value = min_val + int(value_range * 2/3 + ((i - half_size) / (size - half_size)) * (value_range / 3))
        
        result.append(value)
    
    return result


def _generate_median_pivot_adversarial(size: int, min_val: int, max_val: int) -> DataArray:
    """
    Generate an adversarial case for QuickSort with median-of-three pivot.
    
    This is a more complex case as median-of-three was specifically designed to
    avoid simple adversarial patterns. This implementation creates a pattern that
    still leads to unbalanced partitions.
    
    Args:
        size: Number of elements to generate
        min_val: Minimum value (inclusive)
        max_val: Maximum value (inclusive)
    
    Returns:
        Adversarial array for median-of-three QuickSort
    """
    if size <= 2:
        return generate_sorted_data(size, min_val, max_val)
    
    result = []
    value_range = max_val - min_val
    step = value_range / (size - 1)
    
    # Create a pattern where median-of-three tends to select poor pivots
    # This is an approximation, as true adversarial cases for median-of-three
    # are complex and depend on specific implementation details
    for i in range(size):
        if i % 3 == 0:
            # First of every three elements is large
            value = max_val - int((i // 3) * step)
        elif i % 3 == 1:
            # Second of every three is small
            value = min_val + int((i // 3) * step)
        else:
            # Third of every three is median value but placed to create imbalance
            value = min_val + int(value_range / 2)
            
        result.append(value)
    
    return result


def _generate_mergesort_adversarial(size: int, min_val: int = 1, max_val: int = 100,
                                  **kwargs) -> DataArray:
    """
    Generate an adversarial case for MergeSort.
    
    MergeSort has guaranteed O(n log n) performance regardless of input, but
    certain patterns can increase the constant factors or maximize the number
    of comparisons required.
    
    Args:
        size: Number of elements to generate
        min_val: Minimum value (inclusive)
        max_val: Maximum value (inclusive)
        **kwargs: Additional parameters (ignored)
    
    Returns:
        Challenging array for MergeSort
    """
    if size <= 1:
        return [min_val] * size
    
    # Merge sort is typically O(n log n) regardless of input
    # but a pattern that maximizes comparisons can be constructed
    result = []
    value_range = max_val - min_val
    step = value_range / (size - 1)
    
    # Pattern designed to increase merge complexity
    for i in range(size):
        if i % 2 == 0:
            # Even indices get values from high to low
            value = max_val - int((i // 2) * step * 2)
        else:
            # Odd indices get values from low to high
            value = min_val + int((i // 2) * step * 2)
            
        result.append(value)
    
    return result


def _generate_heapsort_adversarial(size: int, min_val: int = 1, max_val: int = 100,
                                 **kwargs) -> DataArray:
    """
    Generate an adversarial case for HeapSort.
    
    HeapSort has guaranteed O(n log n) performance, but certain patterns can
    maximize the number of sift operations and comparison overhead.
    
    Args:
        size: Number of elements to generate
        min_val: Minimum value (inclusive)
        max_val: Maximum value (inclusive)
        **kwargs: Additional parameters (ignored)
    
    Returns:
        Challenging array for HeapSort
    """
    if size <= 1:
        return [min_val] * size
    
    # Heap sort is typically O(n log n) regardless of input
    # but certain patterns can maximize the number of heapify operations
    result = []
    value_range = max_val - min_val
    
    # Create a "sawtooth" pattern with alternating large and small values
    # This tends to require more work during heap construction
    for i in range(size):
        if i % 2 == 0:
            # Even positions get small values
            value = min_val + int((i / size) * (value_range / 2))
        else:
            # Odd positions get large values
            value = min_val + int(value_range / 2 + (i / size) * (value_range / 2))
            
        result.append(value)
    
    return result


def _generate_insertion_adversarial(size: int, min_val: int = 1, max_val: int = 100,
                                  **kwargs) -> DataArray:
    """
    Generate an adversarial case for Insertion Sort.
    
    The worst case for insertion sort is a completely reversed array, which
    requires the maximum number of comparisons and shifts.
    
    Args:
        size: Number of elements to generate
        min_val: Minimum value (inclusive)
        max_val: Maximum value (inclusive)
        **kwargs: Additional parameters (ignored)
    
    Returns:
        Adversarial array for Insertion Sort
    """
    # Worst case is reversed order
    return generate_reversed_data(size, min_val, max_val)


def _generate_shellsort_adversarial(size: int, min_val: int = 1, max_val: int = 100,
                                  gap_sequence: str = 'shell', **kwargs) -> DataArray:
    """
    Generate an adversarial case for Shell Sort based on gap sequence.
    
    Different gap sequences in Shell Sort have different worst-case behaviors.
    This function attempts to create challenging cases for specific sequences.
    
    Args:
        size: Number of elements to generate
        min_val: Minimum value (inclusive)
        max_val: Maximum value (inclusive)
        gap_sequence: Name of gap sequence ('shell', 'knuth', 'tokuda', etc.)
        **kwargs: Additional parameters (ignored)
    
    Returns:
        Challenging array for Shell Sort
    """
    if size <= 1:
        return [min_val] * size
    
    # For Shell's original sequence (powers of 2), reversed can be challenging
    if gap_sequence.lower() == 'shell':
        return generate_reversed_data(size, min_val, max_val)
    
    # For other sequences, create patterns that challenge the gap structure
    # This is a simplification - true adversarial cases depend on exact sequence
    result = []
    value_range = max_val - min_val
    step = value_range / (size - 1)
    
    # Create an array with a repeating pattern that aligns with common gaps
    pattern_size = 8  # Adjust based on gap sequence
    for i in range(size):
        pattern_index = i % pattern_size
        
        if pattern_index < pattern_size // 2:
            # First half of pattern has high values
            value = max_val - int((pattern_index / (pattern_size // 2)) * step * (pattern_size // 2))
        else:
            # Second half has low values
            adjusted_index = pattern_index - pattern_size // 2
            value = min_val + int((adjusted_index / (pattern_size // 2)) * step * (pattern_size // 2))
            
        result.append(value)
    
    return result


def _generate_bubble_adversarial(size: int, min_val: int = 1, max_val: int = 100,
                               **kwargs) -> DataArray:
    """
    Generate an adversarial case for Bubble Sort.
    
    The worst case for bubble sort is a completely reversed array, requiring
    the maximum number of passes and swaps.
    
    Args:
        size: Number of elements to generate
        min_val: Minimum value (inclusive)
        max_val: Maximum value (inclusive)
        **kwargs: Additional parameters (ignored)
    
    Returns:
        Adversarial array for Bubble Sort
    """
    # Worst case is reversed order
    return generate_reversed_data(size, min_val, max_val)


def _generate_timsort_adversarial(size: int, min_val: int = 1, max_val: int = 100,
                                **kwargs) -> DataArray:
    """
    Generate a challenging case for TimSort.
    
    TimSort is an adaptive algorithm that works well on partially ordered data.
    This function creates a pattern that challenges its run detection and merging logic.
    
    Args:
        size: Number of elements to generate
        min_val: Minimum value (inclusive)
        max_val: Maximum value (inclusive)
        **kwargs: Additional parameters (ignored)
    
    Returns:
        Challenging array for TimSort
    """
    if size <= 1:
        return [min_val] * size
    
    # TimSort performs well on real-world data with some natural ordering
    # To challenge it, create data with many short runs that need merging
    
    # Create an array with very short ascending and descending runs
    result = []
    min_run_size = kwargs.get('min_run', 4)  # TimSort typically uses min_run around 16-64
    run_size = max(2, min(min_run_size - 1, size // 8))  # Just below min_run size
    
    value_range = max_val - min_val
    value_step = value_range / size
    
    position = 0
    while position < size:
        # Determine run length (alternating between ascending and descending)
        current_run_size = min(run_size, size - position)
        
        # Create an ascending or descending run
        if (position // run_size) % 2 == 0:
            # Ascending
            for i in range(current_run_size):
                value = min_val + int((position + i) * value_step)
                result.append(value)
        else:
            # Descending
            for i in range(current_run_size):
                value = max_val - int((position + i) * value_step)
                result.append(value)
        
        position += current_run_size
    
    return result


def generate_dutch_flag_problem(size: int, unique_values: int = 3, **kwargs) -> DataArray:
    """
    Generate test data for the Dutch national flag problem.
    
    This creates an array with a small number of unique values (typically 3) randomly
    distributed. It's used for testing partitioning algorithms and the three-way
    partitioning approach used in some QuickSort variants.
    
    Time complexity: O(n)
    Space complexity: O(n)
    
    Args:
        size: Number of elements to generate
        unique_values: Number of unique values (typically 3 for Dutch flag)
        **kwargs: Additional parameters (ignored)
    
    Returns:
        Array of integers with few unique values
    
    Examples:
        >>> random.seed(42)
        >>> generate_dutch_flag_problem(10, unique_values=3)
        [2, 2, 0, 0, 0, 2, 0, 0, 2, 2]
    """
    if size < 0:
        raise ValueError("Size must be non-negative")
    
    if unique_values < 1:
        raise ValueError("unique_values must be positive")
    
    # Generate array with specified number of unique values
    return [_RNG.randint(0, unique_values - 1) for _ in range(size)]


def generate_objects_for_stability_test(size: int, key_range: int = 10, **kwargs) -> List[Dict[str, Any]]:
    """
    Create an array of custom objects for testing the stability of sorting algorithms.
    
    This function creates objects with key-value pairs where the key is used for sorting
    but multiple objects share the same key. This allows testing whether algorithms
    preserve the relative order of equal elements.
    
    Time complexity: O(n)
    Space complexity: O(n)
    
    Args:
        size: Number of elements to generate
        key_range: Range of key values (smaller = more duplicates)
        **kwargs: Additional parameters (ignored)
    
    Returns:
        List of dictionaries with key, value, and original_index fields
    
    Examples:
        >>> random.seed(42)
        >>> generate_objects_for_stability_test(5, key_range=3)
        [{'key': 0, 'value': 42, 'original_index': 0},
         {'key': 1, 'value': 27, 'original_index': 1},
         {'key': 2, 'value': 87, 'original_index': 2},
         {'key': 0, 'value': 53, 'original_index': 3},
         {'key': 1, 'value': 72, 'original_index': 4}]
    """
    if size < 0:
        raise ValueError("Size must be non-negative")
    
    if key_range < 1:
        raise ValueError("key_range must be positive")
    
    # Create objects with key, value, and original index
    objects = []
    for i in range(size):
        obj = {
            'key': i % key_range,             # Key to sort by (will have duplicates)
            'value': _RNG.randint(1, 100),    # Random value
            'original_index': i               # Original position (for stability checking)
        }
        objects.append(obj)
    
    return objects


def is_sorted(array: DataArray, reverse: bool = False,
            key: Optional[Callable] = None) -> bool:
    """
    Check if an array is sorted.
    
    This utility function verifies whether an array is properly sorted,
    optionally in reverse order or using a key function for comparison.
    
    Time complexity: O(n)
    Space complexity: O(1)
    
    Args:
        array: The array to check
        reverse: If True, check for descending order
        key: Optional key function for comparison
    
    Returns:
        True if the array is sorted, False otherwise
    
    Examples:
        >>> is_sorted([1, 2, 3, 4, 5])
        True
        >>> is_sorted([5, 4, 3, 2, 1], reverse=True)
        True
        >>> is_sorted([1, 2, 4, 3, 5])
        False
    """
    if not array:
        return True
    
    # Apply key function if provided
    if key:
        transformed = [key(x) for x in array]
    else:
        transformed = array
    
    # Check if array is sorted
    for i in range(1, len(transformed)):
        if reverse:
            if transformed[i] > transformed[i-1]:
                return False
        else:
            if transformed[i] < transformed[i-1]:
                return False
    
    return True


def verify_stability(sorted_objects: List[Dict[str, Any]]) -> bool:
    """
    Verify if a sorting algorithm maintained stability on an array of objects.
    
    This checks whether objects with the same key maintained their relative order
    after sorting. This is an important property for many applications.
    
    Time complexity: O(n log n)
    Space complexity: O(n)
    
    Args:
        sorted_objects: Sorted list of objects with 'key' and 'original_index' fields
    
    Returns:
        True if sorting was stable, False otherwise
    
    Examples:
        >>> objects = [
        ...     {'key': 2, 'original_index': 0},
        ...     {'key': 1, 'original_index': 1},
        ...     {'key': 1, 'original_index': 2}
        ... ]
        >>> # After stable sort: [{'key': 1, 'original_index': 1},
        >>> #                     {'key': 1, 'original_index': 2},
        >>> #                     {'key': 2, 'original_index': 0}]
        >>> verify_stability(sorted_objects)
        True
    """
    if not sorted_objects:
        return True
    
    # Group objects by key
    key_groups = defaultdict(list)
    for obj in sorted_objects:
        key_groups[obj['key']].append(obj['original_index'])
    
    # Check if original indices are in ascending order within each key group
    for indices in key_groups.values():
        if indices != sorted(indices):
            return False
    
    return True


def calculate_inversions(array: DataArray) -> int:
    """
    Calculate the number of inversions in an array.
    
    An inversion is a pair of elements that are out of order. This is a measure of
    how far an array is from being sorted. A fully sorted array has 0 inversions,
    while a reversed array has n(n-1)/2 inversions.
    
    Time complexity: O(n log n) using merge sort algorithm
    Space complexity: O(n)
    
    Args:
        array: Input array
    
    Returns:
        Number of inversions
    
    Examples:
        >>> calculate_inversions([1, 2, 3, 4])
        0
        >>> calculate_inversions([4, 3, 2, 1])
        6
        >>> calculate_inversions([1, 3, 2, 4])
        1
    """
    if not array:
        return 0
    
    # Use merge sort to count inversions
    def _merge_sort_count_inversions(arr):
        if len(arr) <= 1:
            return arr, 0
        
        # Divide array into two halves
        mid = len(arr) // 2
        left, inv_left = _merge_sort_count_inversions(arr[:mid])
        right, inv_right = _merge_sort_count_inversions(arr[mid:])
        
        # Merge and count split inversions
        merged, inv_split = _merge_and_count_split_inversions(left, right)
        
        # Total inversions = left + right + split
        return merged, inv_left + inv_right + inv_split
    
    def _merge_and_count_split_inversions(left, right):
        merged = []
        inv_count = 0
        i = j = 0
        
        while i < len(left) and j < len(right):
            if left[i] <= right[j]:
                merged.append(left[i])
                i += 1
            else:
                merged.append(right[j])
                j += 1
                # Count inversions - all remaining elements in left are inversions
                inv_count += len(left) - i
        
        # Add remaining elements
        merged.extend(left[i:])
        merged.extend(right[j:])
        
        return merged, inv_count
    
    _, inversions = _merge_sort_count_inversions(array)
    return inversions


def analyze_dataset(array: DataArray) -> Dict[str, Any]:
    """
    Analyze a dataset and return statistical properties.
    
    This function provides a comprehensive analysis of the distribution and
    ordering properties of a dataset, useful for understanding algorithm
    performance characteristics.
    
    Time complexity: O(n log n)
    Space complexity: O(n)
    
    Args:
        array: Input array
    
    Returns:
        Dictionary with statistical properties
    
    Examples:
        >>> analyze_dataset([4, 2, 7, 5, 1, 3, 8, 6])
        {
            'size': 8,
            'min': 1,
            'max': 8,
            'mean': 4.5,
            'median': 4.5,
            'is_sorted': False,
            'inversions': 13,
            'runs': 5,
            'unique_values': 8,
            ...
        }
    """
    if not array:
        return {
            'size': 0,
            'min': None,
            'max': None,
            'is_sorted': True,
            'inversions': 0,
            'runs': 0,
            'unique_values': 0
        }
    
    # Basic statistics
    result = {
        'size': len(array),
        'min': min(array),
        'max': max(array),
        'mean': sum(array) / len(array),
        'range': max(array) - min(array)
    }
    
    # Median calculation
    sorted_array = sorted(array)
    mid = len(array) // 2
    if len(array) % 2 == 0:
        result['median'] = (sorted_array[mid-1] + sorted_array[mid]) / 2
    else:
        result['median'] = sorted_array[mid]
    
    # Sorting properties
    result['is_sorted'] = is_sorted(array)
    result['is_reverse_sorted'] = is_sorted(array, reverse=True)
    result['inversions'] = calculate_inversions(array)
    result['inversion_ratio'] = result['inversions'] / (len(array) * (len(array) - 1) / 2)
    
    # Runs analysis
    runs = 1
    for i in range(1, len(array)):
        if (array[i] < array[i-1]):
            runs += 1
    result['runs'] = runs
    
    # Uniqueness analysis
    unique_values = len(set(array))
    result['unique_values'] = unique_values
    result['uniqueness_ratio'] = unique_values / len(array)
    
    # Distribution analysis if numpy is available
    if np:
        result['std_dev'] = np.std(array)
        result['skewness'] = calculate_skewness(array)
        result['kurtosis'] = calculate_kurtosis(array)
    
    return result


def calculate_skewness(array: DataArray) -> float:
    """
    Calculate the skewness of a distribution.
    
    Skewness measures the asymmetry of a distribution. Positive skewness indicates
    a right-skewed distribution, negative indicates left-skewed.
    
    Args:
        array: Input array
    
    Returns:
        Skewness value
    """
    if len(array) < 3:
        return 0.0
    
    try:
        return float(statistics.skew(array))
    except AttributeError:
        # Manual calculation if statistics.skew is not available
        n = len(array)
        mean = sum(array) / n
        m3 = sum((x - mean) ** 3 for x in array) / n
        m2 = sum((x - mean) ** 2 for x in array) / n
        
        # Avoid division by zero
        if m2 == 0:
            return 0.0
            
        return m3 / (m2 ** 1.5)


def calculate_kurtosis(array: DataArray) -> float:
    """
    Calculate the kurtosis of a distribution.
    
    Kurtosis measures the "tailedness" of a distribution. Higher values indicate
    heavier tails and more outliers.
    
    Args:
        array: Input array
    
    Returns:
        Kurtosis value
    """
    if len(array) < 4:
        return 0.0
    
    try:
        return float(statistics.kurtosis(array))
    except AttributeError:
        # Manual calculation if statistics.kurtosis is not available
        n = len(array)
        mean = sum(array) / n
        m4 = sum((x - mean) ** 4 for x in array) / n
        m2 = sum((x - mean) ** 2 for x in array) / n
        
        # Avoid division by zero
        if m2 == 0:
            return 0.0
            
        return m4 / (m2 ** 2) - 3  # Excess kurtosis (normal = 0)


if __name__ == "__main__":
    # Simple examples and tests
    set_seed(42)  # For reproducible examples
    
    # Generate and print some example datasets
    print("Random data:", generate_random_data(10, 1, 100))
    print("Sorted data:", generate_sorted_data(10, 1, 100))
    print("Nearly sorted data:", generate_nearly_sorted_data(10, 1, 100, sorted_ratio=0.8))
    print("Gaussian distribution:", generate_distribution('gaussian', 10, 1, 100, mean=50, std_dev=15))
    print("QuickSort adversarial case:", generate_adversarial_case('quicksort', 10, 1, 100, pivot_strategy='first'))
