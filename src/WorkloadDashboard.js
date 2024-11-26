import React, { useState, useEffect } from "react";
import './WorkloadDashboard.css'; // Import the CSS file

function WorkloadDashboard() {
  const [numTransactions, setNumTransactions] = useState(5); // Default number of transactions
  const [transactions, setTransactions] = useState([]);
  const [totalTransactions, setTotalTransactions] = useState(0); // Total number of records
  const [error, setError] = useState(null); // State to hold any error messages

  // Fetch the total number of transactions when the component mounts
  useEffect(() => {
    const fetchTotalTransactions = async () => {
        try {
            const response = await fetch(`http://localhost:5000/api/transactions/count`);
            if (!response.ok) {
                throw new Error("Failed to fetch total transactions");
            }
            const data = await response.json();
            setTotalTransactions(data.count); // Assuming the API returns an object with a count property
        } catch (error) {
            console.error("Error fetching total transactions:", error);
            setError(error.message); // Set error message
        }
    };

    fetchTotalTransactions();
}, []);

  const handleRetrieveTransactions = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/transactions?limit=${numTransactions}`);
      if (!response.ok) {
        throw new Error("Failed to fetch transactions");
      }
      const fetchedTransactions = await response.json();
      setTransactions(fetchedTransactions);
      setError(null); // Clear any previous errors
    } catch (error) {
      console.error("Error fetching transactions:", error);
      setError(error.message); // Set error message
      setTransactions([]); // Clear transactions on error
    }
  };

  const progressValue = transactions.length; // Current number of displayed transactions

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
      {error && <div style={{ color: 'red' }}>{error}</div>} {/* Display error if any */}
      
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