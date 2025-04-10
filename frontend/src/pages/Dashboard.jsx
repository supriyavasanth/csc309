import React, { useState } from "react";
import { useAuth } from "../context/useAuth";
import Sidebar from "../layout/Sidebar";
import CreateUserForm from "../components/CreateUserForm";
import "./Login.css";
import "./Dashboard.css";

export default function Dashboard() {
  const { user } = useAuth();
  const [showCreateUser, setShowCreateUser] = useState(false);

  if (!user) return null;

  const toggleCreateUser = () => setShowCreateUser(prev => !prev);

  return (
    <div className="dashboard-container">
      <Sidebar />

      <div className="dashboard-content">
        <div className="dashboard-header">
          <h1 className="welcome-heading">Welcome, {user.name || user.utorid}!</h1>
          <h4 className="role-subheading">{user.role} Dashboard</h4>
        </div>

        <div className="dashboard-body">
          {user.role === "REGULAR" && (
            <div className="info-card">
              <p>You have <strong>{user.points ?? 0} points</strong>.</p>
              <p>Use your QR code, make transfers, and view past transactions.</p>
            </div>
          )}

          {["CASHIER", "MANAGER", "SUPERUSER"].includes(user.role) && (
            <>
              <div className="info-card">
                <p>
                  {user.role === "CASHIER"
                    ? "You can create purchase transactions and process redemptions."
                    : "You have access to user management, events, and promotions."}
                </p>

                <button className="small-primary-btn" onClick={toggleCreateUser}>
                  {showCreateUser ? "Close" : "Create New User"}
                </button>
              </div>

              {showCreateUser && (
                <div className="form-card">
                  <CreateUserForm />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
