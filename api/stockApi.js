import axios from 'axios';
const API_BASE_URL = 'http://20.244.56.144/evaluation-service';
export const getStocks = async () => {
    try {
        const response = await axios.get(`${API_BASE_URL}/stocks`);
        return response.data.stocks;
    } catch (error) {
        console.error('Error fetching stocks:', error);
        return {};
    }
};
export const getStockPriceHistory = async (ticker, minutes) => {
    try {
        const response = await axios.get(`${API_BASE_URL}/stocks/${ticker}?minutes=${minutes}`);
        // The API returns an array directly, but the provided screenshot showed an object
        // Adapting to the array structure based on the provided screenshot of the response
        return response.data;
    } catch (error) {
        console.error(`Error fetching price history for ${ticker} over ${minutes} minutes:`, error);
        return [];
    }
};