import React, { useState } from "react";
import { ethers } from "ethers";
import { uploadToPinata } from "./config";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useNavigate } from 'react-router-dom'; // Import useNavigate
import "./App.css";
import  axios  from "axios";

function UploadFile() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [ipfsHash, setIpfsHash] = useState("");
  const [storedHash, setStoredHash] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const navigate = useNavigate(); // Initialize useNavigate

  const contractAddress = "0x9725e10a6aeb15a936d8d3e4d7d84945c35015ff";
  const contractABI = [
    {
      "inputs": [
        {
          "internalType": "string",
          "name": "_ipfsHash",
          "type": "string"
        }
      ],
      "name": "setIPFSHash",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "getIPFSHash",
      "outputs": [
        {
          "internalType": "string",
          "name": "",
          "type": "string"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    }
  ];

  const changeHandler = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      toast.info("File selected: " + file.name);
    }
  };

  const handleSubmission = async () => {
    try {
      if (!selectedFile) {
        toast.error("Please select a file first!");
        return;
      }

      setIsLoading(true);
      
      // Request account access
      if (!window.ethereum) {
        toast.error("Please install MetaMask!");
        return;
      }
      
      await window.ethereum.request({ method: 'eth_requestAccounts' });

      // Upload to IPFS via Pinata
      const response = await uploadToPinata(selectedFile);
      
      if (response.IpfsHash) {
        setIpfsHash(response.IpfsHash);
        toast.success("File uploaded to IPFS!");

        // Store hash on blockchain
        await storeHashOnBlockchain(response.IpfsHash);

        // Add to recent transactions
        setRecentTransactions(prev => [...prev, response.IpfsHash]);

        // Store the hash in the database
        await axios.post("http://localhost:5000/api/transactions", {
        hash: response.IpfsHash,
        });

        // Redirect to home after successful upload
        navigate("/");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error(error.message || "Failed to upload file");
    } finally {
      setIsLoading(false);
    }
  };

  const storeHashOnBlockchain = async (hash) => {
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(contractAddress, contractABI, signer);

      const tx = await contract.setIPFSHash(hash);
      toast.info("Storing hash on blockchain...");
      
      await tx.wait();
      toast.success("Hash stored on blockchain!");
    } catch (error) {
      console.error("Blockchain error:", error);
      toast.error("Failed to store hash on blockchain: " + error.message);
      throw error;
    }
  };

  const retrieveHashFromBlockchain = async () => {
    try {
      setIsLoading(true);
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const contract = new ethers.Contract(contractAddress, contractABI, provider);

      const retrievedHash = await contract.getIPFSHash();
      setStoredHash(retrievedHash);
      
      if (retrievedHash) {
        toast.success("Hash retrieved successfully!");
      } else {
        toast.info("No hash found");
      }
    } catch (error) {
      console.error("Retrieval error:", error);
      toast.error("Failed to retrieve hash: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="app-container">
      <ToastContainer position="top-right" />
      
      <div className="upload-section">
        <label className="form-label">Choose File</label>
        <input 
          type="file" 
          onChange={changeHandler} 
          className="file-input"
          disabled={isLoading}
        />
        <button 
          onClick={handleSubmission} 
          className="submit-button"
          disabled={isLoading || !selectedFile}
        >
          {isLoading ? "Processing..." : "Submit"}
        </button>
      </div>

      {ipfsHash && (
        <div className="result-section">
          <p><strong>IPFS Hash:</strong> {ipfsHash}</p>
          <a 
            href={`https://gateway.pinata.cloud/ipfs/${ipfsHash}`} 
            target="_blank" 
            rel="noopener noreferrer"
            className="view-link"
          >
            View on IPFS
          </a>
        </div>
      )}

      <div className="retrieve-section">
        <button 
          onClick={retrieveHashFromBlockchain} 
          className="retrieve-button"
          disabled={isLoading}
        >
          {isLoading ? "Retrieving..." : "Retrieve Stored Hash"}
        </button>
        {storedHash && (
          <p><strong>Stored IPFS Hash:</strong> {storedHash}</p>
        )}
      </div>

      {recentTransactions.length > 0 && (
        <div className="recent-transactions">
          <h3>Recent Transactions</h3>
          <ul>
            {recentTransactions.map((hash, index) => (
              <li key={index}>
                <a href={`https://gateway.pinata.cloud/ipfs/${hash}`} target="_blank" rel="noopener noreferrer">
                  {hash}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

    </div>
  );
}

export default UploadFile;