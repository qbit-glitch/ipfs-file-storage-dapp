// TransactionList.js
import React, { useEffect, useState } from 'react';
import axios from 'axios';

const TransactionList = () => {
  const [transactions, setTransactions] = useState([]);
  const [limit, setLimit] = useState(10);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/api/transactions?limit=${limit}`);
        setTransactions(response.data);
      } catch (error) {
        console.error("Error fetching transactions:", error);
      }
    };

    fetchTransactions();
  }, [limit]);

  return (
    <div>
      <h2>Recent Transactions</h2>
      <ul>
        {transactions.map(transaction => (
          <li key={transaction.id}>
            Hash: {transaction.hash} | Timestamp: {new Date(transaction.timestamp).toLocaleString()}
          </li>
        ))}
      </ul>
      <button onClick={() => setLimit(limit + 10)}>Load More</button>
    </div>
  );
};

export default TransactionList;