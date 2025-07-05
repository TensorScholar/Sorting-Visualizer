/**
 * Data Generation Utilities Module
 * 
 * This module provides comprehensive data generation capabilities for algorithm visualization,
 * supporting various distribution patterns, statistical properties, and specialized test cases
 * that highlight specific algorithm behaviors and performance characteristics.
 * 
 * The utilities follow a unified interface pattern for consistent integration with
 * visualization components, instrumentation systems, and comparative analysis tools.
 */

/**
 * Generate a data set based on specified type and parameters
 * 
 * @param {string} type - Type of data set to generate
 * @param {number} size - Size of data set
 * @param {Object} options - Additional options for generation
 * @returns {Array<number>} - The generated data set
 */
export function generateDataSet(type, size, options = {}) {
  // Apply defaults
  const opts = {
    min: 1,
    max: 100,
    uniqueValues: 10,
    sortedRatio: 0.9,
    reversedRatio: 0.9,
    ...options
  };
  
  // Select appropriate generator
  switch (type) {
    case 'random':
      return generateRandomData(size, opts.min, opts.max);
    case 'nearly-sorted':
      return generateNearlySortedData(size, opts.min, opts.max, opts.sortedRatio);
    case 'reversed':
      return generateReversedData(size, opts.min, opts.max, opts.reversedRatio);
    case 'few-unique':
      return generateFewUniqueData(size, opts.min, opts.max, opts.uniqueValues);
    case 'sorted':
      return generateSortedData(size, opts.min, opts.max);
    case 'sawtooth':
      return generateSawtoothData(size, opts.min, opts.max);
    case 'plateau':
      return generatePlateauData(size, opts.min, opts.max);
    default:
      console.warn(`Unknown data set type: ${type}, using random instead`);
      return generateRandomData(size, opts.min, opts.max);
  }
}

/**
 * Generate a random array of numbers
 * 
 * @param {number} size - Size of array
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {Array<number>} - Random array
 */
export function generateRandomData(size, min = 1, max = 100) {
  return Array.from({ length: size }, () => 
    Math.floor(Math.random() * (max - min + 1)) + min
  );
}

/**
 * Generate a sorted array of numbers
 * 
 * @param {number} size - Size of array
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {Array<number>} - Sorted array
 */
export function generateSortedData(size, min = 1, max = 100) {
  const step = (max - min) / (size - 1 || 1);
  return Array.from({ length: size }, (_, i) => 
    Math.floor(min + i * step)
  );
}

/**
 * Generate a reversed array of numbers
 * 
 * @param {number} size - Size of array
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @param {number} ratio - How reversed the array should be (0-1)
 * @returns {Array<number>} - Reversed array
 */
export function generateReversedData(size, min = 1, max = 100, ratio = 0.9) {
  const step = (max - min) / (size - 1 || 1);
  const sorted = Array.from({ length: size }, (_, i) => 
    Math.floor(min + i * step)
  );
  
  // Completely reversed
  if (ratio >= 1) {
    return sorted.reverse();
  }
  
  // Partially reversed
  const reversed = sorted.reverse();
  const result = [...reversed];
  
  // Shuffle some elements to make it less perfectly reversed
  const shuffleCount = Math.floor(size * (1 - ratio));
  for (let i = 0; i < shuffleCount; i++) {
    const idx1 = Math.floor(Math.random() * size);
    const idx2 = Math.floor(Math.random() * size);
    [result[idx1], result[idx2]] = [result[idx2], result[idx1]];
  }
  
  return result;
}

/**
 * Generate a nearly sorted array of numbers
 * 
 * @param {number} size - Size of array
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @param {number} ratio - How sorted the array should be (0-1)
 * @returns {Array<number>} - Nearly sorted array
 */
export function generateNearlySortedData(size, min = 1, max = 100, ratio = 0.9) {
  // Generate sorted array
  const step = (max - min) / (size - 1 || 1);
  const result = Array.from({ length: size }, (_, i) => 
    Math.floor(min + i * step)
  );
  
  // Determine how many elements to shuffle
  const shuffleCount = Math.floor(size * (1 - ratio));
  
  // Shuffle random pairs of elements
  for (let i = 0; i < shuffleCount; i++) {
    const idx1 = Math.floor(Math.random() * size);
    // Keep swaps relatively local for more realistic nearly-sorted data
    const maxDistance = Math.max(5, Math.floor(size * 0.1));
    const offset = Math.floor(Math.random() * maxDistance) - Math.floor(maxDistance / 2);
    const idx2 = Math.max(0, Math.min(size - 1, idx1 + offset));
    
    [result[idx1], result[idx2]] = [result[idx2], result[idx1]];
  }
  
  return result;
}

/**
 * Generate an array with few unique values
 * 
 * @param {number} size - Size of array
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @param {number} uniqueCount - Number of unique values
 * @returns {Array<number>} - Array with few unique values
 */
export function generateFewUniqueData(size, min = 1, max = 100, uniqueCount = 10) {
  // Ensure uniqueCount isn't larger than the possible range
  uniqueCount = Math.min(uniqueCount, max - min + 1);
  
  // Generate the unique values
  const uniqueValues = [];
  for (let i = 0; i < uniqueCount; i++) {
    const value = Math.floor(min + (i * (max - min) / (uniqueCount - 1 || 1)));
    uniqueValues.push(value);
  }
  
  // Create array by randomly selecting from unique values
  return Array.from({ length: size }, () => 
    uniqueValues[Math.floor(Math.random() * uniqueCount)]
  );
}

/**
 * Generate a sawtooth pattern array
 * 
 * @param {number} size - Size of array
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {Array<number>} - Sawtooth pattern array
 */
export function generateSawtoothData(size, min = 1, max = 100) {
  // Determine pattern frequency - how many teeth in the saw
  const teethCount = Math.max(2, Math.floor(size / 20));
  const teethSize = Math.floor(size / teethCount);
  
  const result = [];
  
  for (let i = 0; i < size; i++) {
    // Determine which tooth this element belongs to
    const toothIdx = Math.floor(i / teethSize);
    // Position within the current tooth
    const posInTooth = i % teethSize;
    // Value increases within each tooth, then drops for the next tooth
    const progress = posInTooth / teethSize;
    const value = min + Math.floor(progress * (max - min));
    
    result.push(value);
  }
  
  return result;
}

/**
 * Generate a plateau pattern array (sections of same values)
 * 
 * @param {number} size - Size of array
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {Array<number>} - Plateau pattern array
 */
export function generatePlateauData(size, min = 1, max = 100) {
  // Determine number of plateaus
  const plateauCount = Math.max(2, Math.floor(Math.sqrt(size)));
  const plateauSize = Math.floor(size / plateauCount);
  const result = [];
  
  // Generate plateau values in ascending order
  const plateauValues = [];
  for (let i = 0; i < plateauCount; i++) {
    plateauValues.push(min + Math.floor((i / (plateauCount - 1)) * (max - min)));
  }
  
  // Build the array
  for (let i = 0; i < size; i++) {
    const plateauIdx = Math.min(plateauCount - 1, Math.floor(i / plateauSize));
    result.push(plateauValues[plateauIdx]);
  }
  
  return result;
}

// Default export for flexible importing
const generators = {
  generateDataSet,
  generateRandomData,
  generateSortedData,
  generateReversedData,
  generateNearlySortedData,
  generateFewUniqueData,
  generateSawtoothData,
  generatePlateauData
};

export default generators;