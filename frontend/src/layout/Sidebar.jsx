import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import "./Sidebar.css";

export default function Sidebar() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="sidebar">
      <h2 className="sidebar-title">Loyalty Program</h2>
      <hr className="divider" />

      <nav className="nav-links">
        <Link to="/dashboard">Dashboard</Link>

        <Link to="/profile">Profile</Link>
        <Link to="/points">Points</Link>
        <Link to="/manualTransfer">Manual Transaction</Link>
        <Link to="/showPromotions">Promotions</Link>
        <Link to="/showEvents">Events</Link>
        <Link to="/RSVP">RSVP</Link>
        
        {(user.role === "CASHIER" || user.role === "MANAGER" || user.role === "SUPERUSER") && (
          <>
          <Link to="/createTransaction">Create Transaction</Link>
          </>
        )}

        {(user.role === "MANAGER" || user.role === "SUPERUSER") && (
          <>
            <Link to="/transactions">Filter Transactions</Link>
            <Link to="/users">User Management</Link>
            <Link to="/userList">User List</Link>
            <Link to="/promotions">Filter Promotions</Link>
            <Link to="/createPromotions">Create Promotions</Link>
            <Link to="/events">Filter Events</Link>
            <Link to="/createEvents">Create Events</Link>
            <Link to="/transactionManagement">Transaction Management</Link>
            <Link to="/eventManagement">Event Management</Link>
            <Link to="/eventUserManagement">Event User Management</Link>
          </>
        )}
      </nav>

      <hr className="divider" />

      <div className="nav-links">
        <button className="logout-button" onClick={handleLogout}>Logout</button>
      </div>
    </div>
  );
}
