import React, { useState } from "react";
import { useAuth } from "../context/useAuth";
import Sidebar from "../layout/Sidebar";
import axios from "axios";
import "./Dashboard.css";

export default function ManualTransferPage() {
  const { token } = useAuth();
  const [recipient, setRecipient] = useState("");
  const [points, setPoints] = useState("");
  const [message, setMessage] = useState("");

  const handleTransfer = async () => {
    if (!recipient || !points || isNaN(points) || points <= 0) {
      setMessage("Please enter a valid UTORid and positive number of points.");
      return;
    }

    try {
      const res = await axios.post(
        "http://localhost:8000/transactions",
        {
          type: "transfer",
          utorid: recipient,
          amount: parseInt(points),
        },
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        }
      );

      setMessage(`Transfer successful! ${res.data.amount} points sent to ${res.data.recipient}.`);
      setRecipient("");
      setPoints("");
    } catch (err) {
      console.error("Transfer failed:", err);
      const errMsg = err.response?.data?.error || "Transfer failed. Please try again.";
      setMessage(errMsg);
    }
  };

  return (
    <div className="dashboard-container">
      <Sidebar />
      <div className="dashboard-content">
        <div className="dashboard-header">
          <h1 className="welcome-heading">Manual Point Transfer</h1>
          <h4 className="role-subheading">Send points to another user manually</h4>
        </div>

        <div className="dashboard-body">
          <div className="info-card">
            <label>Recipient UTORid:</label>
            <input
              type="text"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="e.g. johndoe1"
            />

            <label>Points to Transfer:</label>
            <input
              type="number"
              value={points}
              onChange={(e) => setPoints(e.target.value)}
              placeholder="e.g. 50"
            />

            <button className="small-primary-btn" onClick={handleTransfer}>
              Submit Transfer
            </button>

            {message && <p className="info-message">{message}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
