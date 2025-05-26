import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar';
import StockPage from './pages/StockPage';
import HeatmapPage from './pages/HeatmapPage';
import './App.css'; // Global CSS for styling

function App() {
    return (
        <Router>
            <Navbar />
            <div className="content">
                <Routes>
                    <Route path="/" element={<StockPage />} />
                    <Route path="/heatmap" element={<HeatmapPage />} />
                </Routes>
            </div>
        </Router>
    );
}

export default App;