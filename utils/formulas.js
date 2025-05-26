export const calculateMean = (data) => {
    if (!data || data.length === 0) return 0;
    const sum = data.reduce((acc, val) => acc + val, 0);
    return sum / data.length;
};

export const calculateStandardDeviation = (data) => {
    if (!data || data.length < 2) return 0;
    const mean = calculateMean(data);
    const variance = data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / (data.length - 1);
    return Math.sqrt(variance);
};

export const calculateCovariance = (data1, data2) => {
    if (!data1 || !data2 || data1.length !== data2.length || data1.length < 2) return 0;
    const mean1 = calculateMean(data1);
    const mean2 = calculateMean(data2);
    let covariance = 0;
    for (let i = 0; i < data1.length; i++) {
        covariance += (data1[i] - mean1) * (data2[i] - mean2);
    }
    return covariance / (data1.length - 1);
};

export const calculatePearsonCorrelation = (data1, data2) => {
    if (!data1 || !data2 || data1.length !== data2.length || data1.length < 2) return 0;
    const stdDev1 = calculateStandardDeviation(data1);
    const stdDev2 = calculateStandardDeviation(data2);
    if (stdDev1 === 0 || stdDev2 === 0) return 0; // Avoid division by zero
    const covariance = calculateCovariance(data1, data2);
    return covariance / (stdDev1 * stdDev2);
};