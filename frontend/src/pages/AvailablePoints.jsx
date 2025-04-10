import React from "react";
import Sidebar from "../layout/Sidebar";
import { useAuth } from "../context/useAuth";
import "./Dashboard.css";

export default function AvailablePoints() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="page-layout">
      <Sidebar />
      <div className="page-content">
        <h2 className="title">Available Points</h2>

        <div className="info-card">
          <p>
            Hello, <strong>{user.name || user.utorid}</strong>!
          </p>
          <p>
            You currently have <strong>{user.points ?? 0} points</strong> available.
          </p>
        </div>
      </div>
    </div>
  );
}
