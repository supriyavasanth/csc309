import React from "react";
import Sidebar from "../layout/Sidebar";
import "./Dashboard.css";

export default function UnauthorizedPage() {
  return (
    <div className="dashboard-container">
      <Sidebar />
      <div className="dashboard-content">
        <div className="dashboard-header">
          <h1 className="welcome-heading">Access Denied</h1>
          <h4 className="role-subheading">You do not have permission to view this page.</h4>
        </div>

        <div className="info-card" style={{ maxWidth: "500px" }}>
          <p className="error-message">
            This section is restricted based on your user role.
          </p>
          <a className="btn btn-primary full-width" href="/dashboard" style={{ marginTop: "1.5rem" }}>
            Return to Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}
