import React from "react";
import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom";
import Home from "./Home";
import UploadFile from "./UploadFile"; // This will contain your existing code
import WorkloadDashboard from "./WorkloadDashboard";
import Navbar from "./Navbar"; // Import the Navbar component
import TransactionList from "./TransactionList";


function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/upload-file" element={<UploadFile />} />
        <Route path="/workload-dashboard" element={<WorkloadDashboard />} />
        <Route path="/transactions" element={<TransactionList />} /> {/* Add route for transactions */}
        <Route path="*" element={<Navigate to="/" />} /> {/* Redirect for unknown routes */}
      </Routes>
    </Router>
  );
}

export default App;