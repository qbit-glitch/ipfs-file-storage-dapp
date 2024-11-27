import React, { useState, useEffect } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './WorkloadDashboard.css';

// Point to backend server
const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function WorkloadDashboard() {
  const [numTransactions, setNumTransactions] = useState(5);
  const [transactions, setTransactions] = useState([]);
  const [totalTransactions, setTotalTransactions] = useState(0);
  const [error, setError] = useState(null);
  const [userAddress, setUserAddress] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  // Listen for account changes
  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts) => {
        if (accounts.length > 0) {
          setUserAddress(accounts[0]);
          toast.info('Wallet account changed');
        } else {
          setUserAddress(null);
          toast.info('Wallet disconnected');
        }
      });
    }
    
    // Check if already connected
    checkConnection();

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', () => {});
      }
    };
  }, []);

  const checkConnection = async () => {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          setUserAddress(accounts[0]);
        }
      } catch (error) {
        console.error("Error checking connection:", error);
      }
    }
  };

  const connectMetamask = async () => {
    if (!window.ethereum) {
      toast.error("Please install MetaMask!");
      return;
    }

    setIsConnecting(true);
    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      setUserAddress(accounts[0]);
      toast.success("Wallet connected successfully!");
      
      // Fetch transactions immediately after connecting
      await fetchTotalTransactions(accounts[0]);
    } catch (error) {
      console.error("Failed to connect MetaMask:", error);
      toast.error(error.message || "Failed to connect wallet");
    } finally {
      setIsConnecting(false);
    }
  };

  const fetchTotalTransactions = async (address) => {
    try {
      const response = await fetch(`${BASE_URL}/api/transactions/count?address=${address || userAddress}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setTotalTransactions(data.count);
    } catch (error) {
      console.error("Error fetching total transactions:", error);
      toast.error("Failed to fetch total transactions");
      setError(error.message);
    }
  };

  useEffect(() => {
    if (userAddress) {
      fetchTotalTransactions();
    }
  }, [userAddress]);

  const handleRetrieveTransactions = async () => {
    if (!userAddress) {
      toast.warning("Please connect MetaMask first");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/api/transactions?limit=${numTransactions}&address=${userAddress}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      
      setTransactions(data.transactions);
      setError(null);
      toast.success(`Retrieved ${data.transactions.length} transactions`);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      toast.error("Failed to fetch transactions");
      setError(error.message);
      setTransactions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const progressValue = transactions.length;

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  const truncateAddress = (address) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <div className="dashboard-container">
      <ToastContainer position="top-right" />
      
      <h1 className="dashboard-title">Transactions Dashboard</h1>
      
      <div className="wallet-section">
        {!userAddress ? (
          <button 
            onClick={connectMetamask} 
            disabled={isConnecting}
            className="connect-button"
          >
            {isConnecting ? "Connecting..." : "Connect MetaMask"}
          </button>
        ) : (
          <div className="wallet-info">
            <span>Connected: {truncateAddress(userAddress)}</span>
          </div>
        )}
      </div>

      {userAddress && (
        <div className="controls-section">
          <label>Retrieve Last </label>
          <input
            type="number"
            value={numTransactions}
            onChange={(e) => setNumTransactions(Number(e.target.value))}
            min="1"
            max="100"
            className="transaction-input"
          />
          <button 
            onClick={handleRetrieveTransactions}
            disabled={isLoading}
            className="retrieve-button"
          >
            {isLoading ? "Retrieving..." : "Retrieve"}
          </button>
        </div>
      )}

      {userAddress && (
        <div className="progress-container">
          <label>Total number of Transactions stored in Cloud Database</label>
          <div className="progress-bar">
            <div 
              className="progress" 
              style={{ 
                width: `${totalTransactions > 0 ? (progressValue / totalTransactions) * 100 : 0}%` 
              }}
            ></div>
          </div>
          <div className="progress-text">{progressValue} / {totalTransactions}</div>
        </div>
      )}

      {error && <div className="error-message">{error}</div>}

      <div className="transactions-list">
        {transactions.length > 0 && <h3>Recent Transactions</h3>}
        <ul>
          {transactions.map((transaction) => (
            <li key={transaction.id} className="transaction-item">
              <div className="transaction-info">
                <a 
                  href={`https://gateway.pinata.cloud/ipfs/${transaction.hash}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hash-link"
                >
                  {transaction.hash}
                </a>
                <span className="transaction-timestamp">
                  {formatDate(transaction.timestamp)}
                </span>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default WorkloadDashboard;