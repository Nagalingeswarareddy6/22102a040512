// src/pages/StockPage.js
import React, { useState, useEffect } from 'react';
import { getStocks } from '../api/stockApi';
import StockChart from '../components/StockChart';
import Select from 'react-select'; // For a nicer dropdown

const StockPage = () => {
    const [stocks, setStocks] = useState({});
    const [selectedStock, setSelectedStock] = useState(null);
    const [loadingStocks, setLoadingStocks] = useState(true);
    const [errorStocks, setErrorStocks] = useState(null);

    useEffect(() => {
        const fetchStocks = async () => {
            try {
                const data = await getStocks();
                setStocks(data);
            } catch (err) {
                setErrorStocks('Failed to fetch stock list.');
                console.error(err);
            } finally {
                setLoadingStocks(false);
            }
        };
        fetchStocks();
    }, []);

    const stockOptions = Object.keys(stocks).map(name => ({
        value: stocks[name], // ticker
        label: `${name} (${stocks[name]})`,
        name: name,
        ticker: stocks[name],
    }));

    return (
        <div className="page-container">
            <h1>Stock Price Chart</h1>
            <div className="stock-selector">
                <label>Select a Stock:</label>
                {loadingStocks && <div className="loading">Loading stocks...</div>}
                {errorStocks && <div className="error-message">{errorStocks}</div>}
                {!loadingStocks && !errorStocks && (
                    <Select
                        options={stockOptions}
                        onChange={setSelectedStock}
                        placeholder="Search for a stock..."
                        isClearable
                        className="stock-dropdown"
                        classNamePrefix="select"
                    />
                )}
            </div>
            <StockChart selectedStock={selectedStock} />
        </div>
    );
};

export default StockPage;