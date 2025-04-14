/**
 * Data Processing Utilities
 * Contains functions for interpolation and anomaly detection
 */

/**
 * Performs linear interpolation between missing data points
 * @param {Array} data - Array of data values
 * @returns {Array} - Interpolated data
 */
export const linearInterpolation = (data) => {
  const result = [...data];
  
  // Find segments with null/undefined values and interpolate
  for (let i = 0; i < result.length; i++) {
    if (result[i] === null || result[i] === undefined) {
      // Find the next valid value
      let nextValidIndex = i + 1;
      while (nextValidIndex < result.length && 
            (result[nextValidIndex] === null || result[nextValidIndex] === undefined)) {
        nextValidIndex++;
      }
      
      // If we have values on both ends, interpolate
      if (i > 0 && nextValidIndex < result.length) {
        const startValue = result[i-1];
        const endValue = result[nextValidIndex];
        const totalSteps = nextValidIndex - (i-1);
        
        // Fill in intermediate values
        for (let j = i; j < nextValidIndex; j++) {
          const step = j - (i-1);
          result[j] = startValue + (endValue - startValue) * (step / totalSteps);
        }
      }
    }
  }
  
  return result;
};

/**
 * Detect anomalies using Z-score method
 * @param {Array} data - Array of data values
 * @param {Number} threshold - Z-score threshold (default: 3)
 * @returns {Array} - Array of booleans indicating anomalies
 */
export const detectAnomalies = (data, threshold = 3.0) => {
  // Filter out null/undefined values for statistical calculations
  const validData = data.filter(value => value !== null && value !== undefined);
  
  if (validData.length < 2) return data.map(() => false);
  
  // Calculate mean
  const mean = validData.reduce((sum, value) => sum + value, 0) / validData.length;
  
  // Calculate standard deviation
  const squaredDiffs = validData.map(value => (value - mean) ** 2);
  const variance = squaredDiffs.reduce((sum, value) => sum + value, 0) / validData.length;
  const stdDev = Math.sqrt(variance);
  
  // If stdDev is close to zero, avoid division by zero issues
  if (stdDev < 0.0001) return data.map(() => false);
  
  // Calculate z-scores and detect anomalies
  return data.map(value => {
    if (value === null || value === undefined) return false;
    const zScore = Math.abs((value - mean) / stdDev);
    return zScore > threshold;
  });
};

/**
 * Generates a color for anomalies based on the variable index
 * @param {Number} index - Variable index
 * @returns {String} - RGBA color string for anomalies
 */
export const getAnomalyColor = (index) => {
  // Array of distinct colors for anomalies
  const anomalyColors = [
    'rgba(255, 0, 0, 1)',      // Red
    'rgba(255, 165, 0, 1)',    // Orange
    'rgba(128, 0, 128, 1)',    // Purple
    'rgba(0, 128, 0, 1)',      // Green
    'rgba(0, 0, 255, 1)',      // Blue
    'rgba(255, 0, 255, 1)',    // Magenta
    'rgba(165, 42, 42, 1)',    // Brown
    'rgba(64, 224, 208, 1)',   // Turquoise
    'rgba(255, 192, 203, 1)',  // Pink
    'rgba(128, 128, 0, 1)',    // Olive
  ];
  
  return anomalyColors[index % anomalyColors.length];
};
