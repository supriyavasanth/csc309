import React, { useState } from "react"; 
import axios from "axios";
import Sidebar from "../layout/Sidebar";
import { useAuth } from "../context/useAuth";

export default function ProcessRedemption() {
  const { token } = useAuth();
  const [transactionId, setTransactionId] = useState("");
  const [message, setMessage] = useState("");

  const handleProcess = async () => {
    if (!transactionId) {
      setMessage("Please enter a transaction ID.");
      return;
    }

    try {
      const res = await axios.patch(
        `http://localhost:8000/transactions/${transactionId}/processed`,
        { processed: true },
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        }
      );

      setMessage(`Redemption processed for ${res.data.utorid}. Redeemed ${-res.data.redeemed} points.`);
    } catch (err) {
      console.error("Failed to process redemption:", err.response?.data || err.message);
      setMessage("Failed to process redemption. Please check the transaction ID.");
    }
  };

  return (
    <div className="page-layout">
      <Sidebar />
      <div className="page-content">
        <h2 className="title">Process Redemption Request</h2>

        <div className="form-card">
          <label htmlFor="transactionId">Transaction ID</label>
          <input
            id="transactionId"
            type="text"
            value={transactionId}
            onChange={(e) => setTransactionId(e.target.value)}
            placeholder="Enter transaction ID"
          />
          <button className="btn btn-primary" onClick={handleProcess}>
            Process
          </button>
          {message && <p className="info-message">{message}</p>}
        </div>
      </div>
    </div>
  );
}
