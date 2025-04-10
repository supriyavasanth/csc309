import React from "react";
import "./Login.css";

export default function UnauthorizedPage() {
  return (
    <div className="login-page">
      <div className="login-box">
        <div className="title">Access Denied</div>
        <div className="subtitle">You do not have permission to view this page.</div>

        <p className="error-message" style={{ marginTop: "1rem" }}>
          This section is restricted based on your user role.
        </p>

        <a className="btn btn-primary full-width" href="/dashboard" style={{ marginTop: "1.5rem" }}>
          Return to Dashboard
        </a>
      </div>
    </div>
  );
}
