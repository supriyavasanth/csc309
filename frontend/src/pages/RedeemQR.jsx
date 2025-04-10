import React, { useEffect, useState } from "react";
import { useAuth } from "../context/useAuth";
import axios from "axios";
import Sidebar from "../layout/Sidebar";
import { QRCodeCanvas } from "qrcode.react";
import "./Login.css";

export default function RedemptionQRCodePage() {
  const { token } = useAuth();
  const [transaction, setTransaction] = useState(null);
  const [message, setMessage] = useState("");

  const fetchUnprocessedRedemption = async () => {
    try {
      const res = await axios.get("http://localhost:8000/transactions/unprocessed-redeem", {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });

      if (res.data) {
        setTransaction(res.data);
      } else {
        setMessage("No unprocessed redemption requests found.");
      }
    } catch (err) {
      console.error("Failed to fetch unprocessed redemption:", err);
      setMessage("An error occurred while fetching your request.");
    }
  };

  useEffect(() => {
    fetchUnprocessedRedemption();
  }, []);

  return (
    <div className="page-layout">
      <Sidebar />
      <div className="page-content">
        <h2 className="title">Redemption QR Code</h2>

        {transaction ? (
          <div className="qr-card">
            <p>Scan this QR code to process your redemption of <strong>{transaction.amount} points</strong>.</p>
            <QRCodeCanvas
              value={JSON.stringify({
                type: "redeem",
                transactionId: transaction.id,
                amount: transaction.amount,
              })}
              size={256}
              includeMargin={true}
            />
            <p><strong>Remark:</strong> {transaction.remark || "None"}</p>
          </div>
        ) : (
          <p>{message}</p>
        )}
      </div>
    </div>
  );
}
