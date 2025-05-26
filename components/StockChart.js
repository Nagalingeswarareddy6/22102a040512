import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { calculateMean } from '../utils/formulas';
import { getStockPriceHistory } from '../api/stockApi';
import Select from 'react-select'; // Using react-select for better dropdown UI
import 'react-tooltip/dist/react-tooltip.css';
import { Tooltip as ReactTooltip } from 'react-tooltip';

const timeIntervalOptions = [
    { value: 5, label: 'Last 5 Minutes' },
    { value: 10, label: 'Last 10 Minutes' },
    { value: 30, label: 'Last 30 Minutes' },
    { value: 60, label: 'Last 1 Hour' },
    { value: 120, label: 'Last 2 Hours' },
    { value: 240, label: 'Last 4 Hours' },
];

const StockChart = ({ selectedStock }) => {
    const [priceHistory, setPriceHistory] = useState([]);
    const [timeInterval, setTimeInterval] = useState(timeIntervalOptions[0].value); // Default to 5 minutes
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchStockData = async () => {
            if (!selectedStock) {
                setPriceHistory([]);
                return;
            }
            setLoading(true);
            setError(null);
            try {
                const data = await getStockPriceHistory(selectedStock.ticker, timeInterval);
                const formattedData = data.map(item => ({
                    ...item,
                    lastUpdatedAt: new Date(item.lastUpdatedAt).toLocaleTimeString(), // Format for display
                }));
                setPriceHistory(formattedData);
            } catch (err) {
                setError('Failed to fetch stock data.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchStockData();
        const intervalId = setInterval(fetchStockData, 30000); // Refresh every 30 seconds

        return () => clearInterval(intervalId); // Cleanup on unmount
    }, [selectedStock, timeInterval]);

    const prices = priceHistory.map(item => item.price);
    const averagePrice = calculateMean(prices);

    if (!selectedStock) {
        return <div className="no-stock-selected">Please select a stock to view its chart.</div>;
    }

    return (
        <div className="stock-chart-container">
            <h3>{selectedStock.name} ({selectedStock.ticker}) Price History</h3>
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

            {loading && <div className="loading">Loading chart data...</div>}
            {error && <div className="error-message">{error}</div>}

            {!loading && !error && priceHistory.length === 0 && (
                <div className="no-data">No data available for the selected time interval.</div>
            )}

            {!loading && !error && priceHistory.length > 0 && (
                <ResponsiveContainer width="100%" height={400}>
                    <LineChart
                        data={priceHistory}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="lastUpdatedAt" />
                        <YAxis />
                        <Tooltip
                            content={({ active, payload, label }) => {
                                if (active && payload && payload.length) {
                                    return (
                                        <div className="custom-tooltip">
                                            <p className="label">{`Time: ${label}`}</p>
                                            <p className="intro">{`Price: $${payload[0].value.toFixed(2)}`}</p>
                                        </div>
                                    );
                                }
                                return null;
                            }}
                        />
                        <Legend />
                        <Line
                            type="monotone"
                            dataKey="price"
                            stroke="#8884d8"
                            activeDot={{ r: 8 }}
                            data-tooltip-id="price-tooltip"
                            data-tooltip-content={(entry) => `Price: $${entry.payload.price.toFixed(2)} at ${entry.payload.lastUpdatedAt}`}
                        />
                        {averagePrice > 0 && (
                            <ReferenceLine
                                y={averagePrice}
                                label={{ value: `Avg: $${averagePrice.toFixed(2)}`, position: 'insideTopRight' }}
                                stroke="green"
                                strokeDasharray="3 3"
                            />
                        )}
                    </LineChart>
                </ResponsiveContainer>
            )}
            <ReactTooltip id="price-tooltip" />
        </div>
    );
};

export default StockChart;