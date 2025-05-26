// src/components/CorrelationHeatmap.js
import React, { useState, useEffect, useCallback } from 'react';
import { getStocks, getStockPriceHistory } from '../api/stockApi';
import { calculateMean, calculateStandardDeviation, calculatePearsonCorrelation } from '../utils/formulas';
import Select from 'react-select';
import 'react-tooltip/dist/react-tooltip.css';
import { Tooltip as ReactTooltip } from 'react-tooltip';
import './CorrelationHeatmap.css'; // Create this CSS file

const timeIntervalOptions = [
    { value: 5, label: 'Last 5 Minutes' },
    { value: 10, label: 'Last 10 Minutes' },
    { value: 30, label: 'Last 30 Minutes' },
    { value: 60, label: 'Last 1 Hour' },
    { value: 120, label: 'Last 2 Hours' },
    { value: 240, label: 'Last 4 Hours' },
];

const CorrelationHeatmap = () => {
    const [stocks, setStocks] = useState({});
    const [stockTickers, setStockTickers] = useState([]);
    const [priceHistories, setPriceHistories] = useState({}); // { ticker: [prices] }
    const [correlations, setCorrelations] = useState({}); // { ticker1: { ticker2: correlationValue } }
    const [timeInterval, setTimeInterval] = useState(timeIntervalOptions[0].value);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [hoveredStockStats, setHoveredStockStats] = useState(null); // { ticker, mean, stdDev }

    const fetchAllStockData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const allStocks = await getStocks();
            setStocks(allStocks);
            const tickers = Object.values(allStocks);
            setStockTickers(tickers);

            const newPriceHistories = {};
            const fetchPromises = tickers.map(async (ticker) => {
                const history = await getStockPriceHistory(ticker, timeInterval);
                newPriceHistories[ticker] = history.map(item => item.price);
            });
            await Promise.all(fetchPromises);
            setPriceHistories(newPriceHistories);

            // Calculate correlations
            const newCorrelations = {};
            for (let i = 0; i < tickers.length; i++) {
                const ticker1 = tickers[i];
                newCorrelations[ticker1] = {};
                for (let j = 0; j < tickers.length; j++) {
                    const ticker2 = tickers[j];
                    if (ticker1 === ticker2) {
                        newCorrelations[ticker1][ticker2] = 1; // Perfect correlation with itself
                    } else {
                        const prices1 = newPriceHistories[ticker1] || [];
                        const prices2 = newPriceHistories[ticker2] || [];
                        // Ensure both arrays have data and are of similar length for meaningful correlation
                        if (prices1.length > 1 && prices2.length > 1) {
                            // To calculate correlation, we need aligned data points.
                            // For simplicity here, we assume API returns data for the *same* m minutes,
                            // even if timestamps don't perfectly align. A more robust solution
                            // would involve aligning data by timestamp or using a fixed sampling rate.
                            const minLength = Math.min(prices1.length, prices2.length);
                            const correlation = calculatePearsonCorrelation(
                                prices1.slice(0, minLength),
                                prices2.slice(0, minLength)
                            );
                            newCorrelations[ticker1][ticker2] = isNaN(correlation) ? 0 : correlation; // Handle cases where std dev is 0
                        } else {
                            newCorrelations[ticker1][ticker2] = 0; // No data or insufficient data
                        }
                    }
                }
            }
            setCorrelations(newCorrelations);

        } catch (err) {
            setError('Failed to fetch stock data for heatmap.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [timeInterval]);

    useEffect(() => {
        fetchAllStockData();
        const intervalId = setInterval(fetchAllStockData, 60000); // Refresh every minute
        return () => clearInterval(intervalId);
    }, [fetchAllStockData]);

    const getCorrelationColor = (correlation) => {
        // Map correlation from -1 to 1 to a color scale
        // Example: Blue for positive, Red for negative, White/Grey for near zero
        const absCorr = Math.abs(correlation);
        let r, g, b;

        if (correlation > 0) { // Positive correlation (blue scale)
            r = 255 * (1 - absCorr);
            g = 255 * (1 - absCorr);
            b = 255;
        } else if (correlation < 0) { // Negative correlation (red scale)
            r = 255;
            g = 255 * (1 - absCorr);
            b = 255 * (1 - absCorr);
        } else { // No correlation (white/grey)
            r = g = b = 200;
        }
        return `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;
    };

    const handleLabelHover = (ticker) => {
        const prices = priceHistories[ticker] || [];
        if (prices.length > 0) {
            const mean = calculateMean(prices);
            const stdDev = calculateStandardDeviation(prices);
            setHoveredStockStats({ ticker, mean, stdDev });
        } else {
            setHoveredStockStats(null);
        }
    };

    const handleLabelLeave = () => {
        setHoveredStockStats(null);
    };

    if (loading) {
        return <div className="loading">Loading correlation heatmap...</div>;
    }

    if (error) {
        return <div className="error-message">{error}</div>;
    }

    return (
        <div className="heatmap-container">
            <h2>Stock Correlation Heatmap</h2>
            <div className="time-interval-selector">
                <label>Select Time Interval:</label>
                <Select
                    options={timeIntervalOptions}
                    defaultValue={timeIntervalOptions[0]}
                    onChange={(option) => setTimeInterval(option.value)}
                    className="time-interval-dropdown"
                    classNamePrefix="select"
                />
            </div>

            {stockTickers.length === 0 ? (
                <div className="no-data">No stock data available to generate heatmap.</div>
            ) : (
                <>
                    <div className="heatmap-grid-wrapper">
                        <div className="heatmap-grid">
                            <div className="heatmap-row-header">
                                <div className="heatmap-cell empty-cell"></div>
                                {stockTickers.map(ticker => (
                                    <div
                                        key={`col-header-${ticker}`}
                                        className="heatmap-cell header-cell"
                                        onMouseEnter={() => handleLabelHover(ticker)}
                                        onMouseLeave={handleLabelLeave}
                                        data-tooltip-id="stock-stats-tooltip"
                                        data-tooltip-content={hoveredStockStats && hoveredStockStats.ticker === ticker ?
                                            `Mean: $${hoveredStockStats.mean.toFixed(2)} | Std Dev: $${hoveredStockStats.stdDev.toFixed(2)}` : ''
                                        }
                                    >
                                        {ticker}
                                    </div>
                                ))}
                            </div>
                            {stockTickers.map(rowTicker => (
                                <div key={`row-${rowTicker}`} className="heatmap-row">
                                    <div
                                        className="heatmap-cell header-cell"
                                        onMouseEnter={() => handleLabelHover(rowTicker)}
                                        onMouseLeave={handleLabelLeave}
                                        data-tooltip-id="stock-stats-tooltip"
                                        data-tooltip-content={hoveredStockStats && hoveredStockStats.ticker === rowTicker ?
                                            `Mean: $${hoveredStockStats.mean.toFixed(2)} | Std Dev: $${hoveredStockStats.stdDev.toFixed(2)}` : ''
                                        }
                                    >
                                        {rowTicker}
                                    </div>
                                    {stockTickers.map(colTicker => {
                                        const correlation = correlations[rowTicker]?.[colTicker];
                                        const color = getCorrelationColor(correlation);
                                        return (
                                            <div
                                                key={`${rowTicker}-${colTicker}`}
                                                className="heatmap-cell data-cell"
                                                style={{ backgroundColor: color }}
                                                data-tooltip-id="correlation-tooltip"
                                                data-tooltip-content={`Correlation (${rowTicker} - ${colTicker}): ${correlation !== undefined ? correlation.toFixed(4) : 'N/A'}`}
                                            >
                                                {/* Optionally display correlation value */}
                                                {/* {correlation !== undefined ? correlation.toFixed(2) : ''} */}
                                            </div>
                                        );
                                    })}
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="color-legend">
                        <h4>Correlation Strength</h4>
                        <div className="legend-gradient-positive"></div>
                        <div className="legend-labels">
                            <span>Strong Positive (+1)</span>
                            <span>Neutral (0)</span>
                            <span>Strong Negative (-1)</span>
                        </div>
                    </div>
                </>
            )}
            <ReactTooltip id="stock-stats-tooltip" place="top" effect="solid" />
            <ReactTooltip id="correlation-tooltip" place="top" effect="solid" />
        </div>
    );
};

export default CorrelationHeatmap;