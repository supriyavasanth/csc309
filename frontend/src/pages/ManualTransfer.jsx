import React, { useState } from "react";
import { useAuth } from "../context/useAuth";
import Sidebar from "../layout/Sidebar";
import axios from "axios";
import "./Login.css";

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
    <div className="page-layout">
      <Sidebar />
      <div className="page-content">
        <h2 className="title">Manual Point Transfer</h2>

        <div className="form-card">
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
  );
}
