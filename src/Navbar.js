// Navbar.js
import React from 'react';
import { Link } from 'react-router-dom';
import './Navbar.css'; // Create this CSS file for styling

const Navbar = () => {
  return (
    <nav className="navbar">
      <h1 className="navbar-title">qbit-glitch</h1>
      <ul className="navbar-links">
        <li>
          <Link to="/">Home</Link>
        </li>
        <li>
          <Link to="/upload-file">Upload File</Link>
        </li>
        <li>
          <Link to="/workload-dashboard">Workload Dashboard</Link>
        </li>
      </ul>
    </nav>
  );
};

export default Navbar;