import React from "react";
import { useNavigate } from "react-router-dom"; // Import useNavigate for navigation
import './Home.css'; // Import the CSS file

function Home() {
  const navigate = useNavigate(); // Initialize useNavigate

  const handleGetStarted = () => {
    navigate("/upload-file"); // Navigate to UploadFile component
  };

  return (
    <div className="home-container">
      <h1 className="animated-text">Welcome to the IPFS File Upload DApp</h1>
      <p className="animated-text">Simple IPFS Storage DApp built on Ethereum Sepolia testnet. It is implemented using AWS PostgreSQL to store the transactions and and with a feature to view recent transactions.</p>
      <button className="get-started-button" onClick={handleGetStarted}>Get Started</button> {/* Add onClick handler */}
    </div>
  );
}

export default Home;