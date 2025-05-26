import React from 'react';
import { Link } from 'react-router-dom';
import './Navbar.css'; // Create this CSS file
const Navbar = () => {
    return (
        <nav className="navbar">
            <Link to="/" className="navbar-brand">Stock Aggregator</Link>
            <ul className="navbar-nav">
                <li className="nav-item">
                    <Link to="/" className="nav-link">Stock Page</Link>
                </li>
                <li className="nav-item">
                    <Link to="/heatmap" className="nav-link">Correlation Heatmap</Link>
                </li>
            </ul>
        </nav>
    );
};
export default Navbar;