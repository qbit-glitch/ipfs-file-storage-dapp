import React, { useState, useEffect } from "react";
import './WorkloadDashboard.css';

function WorkloadDashboard() {
  const [numTransactions, setNumTransactions] = useState(5);
  const [transactions, setTransactions] = useState([]);
  const [totalTransactions, setTotalTransactions] = useState(0);
  const [error, setError] = useState(null);

  // Backend base URL - adjust as needed
  const BASE_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

  // Fetch total transactions
  useEffect(() => {
    const fetchTotalTransactions = async () => {
      try {
        const response = await fetch(`${BASE_URL}/api/transactions/count`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setTotalTransactions(data.count);
      } catch (error) {
        console.error("Error fetching total transactions:", error);
        setError(error.message);
      }
    };

    fetchTotalTransactions();
  }, []);

  const handleRetrieveTransactions = async () => {
    try {
      const response = await fetch(`${BASE_URL}/api/transactions?limit=${numTransactions}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setTransactions(data.transactions);
      setError(null);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      setError(error.message);
      setTransactions([]);
    }
  };

  const progressValue = transactions.length;

  return (
    <div className="dashboard-container">
      <h1 className="dashboard-title">Transactions Dashboard</h1>
      <div>
        <label>Retrieve Last </label>
        <input
          type="number"
          value={numTransactions}
          onChange={(e) => setNumTransactions(e.target.value)}
          min="1"
        />
        <button onClick={handleRetrieveTransactions}>Retrieve</button>
      </div>
      {error && (
        <div style={{ color: 'red', marginBottom: '10px' }}>
          Error: {error}
          <p>Please check your backend connection and CORS settings.</p>
        </div>
      )}
      
      {/* Progress Bar */}
      <div className="progress-container">
        <label>Transactions</label>
        <div className="progress-bar">
          <div className="progress" style={{ width: `${(progressValue / totalTransactions) * 100}%` }}></div>
        </div>
        <div className="progress-text">{progressValue} / {totalTransactions}</div>
      </div>

      <div className="transactions-list">
        <h3>Recent Transactions</h3>
        <ul>
          {transactions.map((transaction) => (
            <li key={transaction.id}>
              <a href={`https://gateway.pinata.cloud/ipfs/${transaction.hash}`} target="_blank" rel="noopener noreferrer">
                {transaction.hash}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default WorkloadDashboard;
