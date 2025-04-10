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

        {(user.role === "CASHIER" || user.role === "MANAGER" || user.role === "SUPERUSER") && (
          <>
          <Link to="/transactions">Transaction History</Link>
          <Link to="/createTransaction">Transaction</Link>
          <Link to="/processRedemption">Manual Transaction</Link>
          </>
        )}

        {(user.role === "MANAGER" || user.role === "SUPERUSER") && (
          <>
            <Link to="/users">User Management</Link>
            <Link to="/userList">User List</Link>
            <Link to="/promotions">Promotions</Link>
            <Link to="/createPromotions">Create Promotions</Link>
            <Link to="/events">Events</Link>
            <Link to="/createEvents">Create Events</Link>
            <Link to="/transactionManagement">Transaction Management</Link>
            <Link to="/promotionManagement">Promotion Management</Link>
            <Link to="/eventManagement">Event Management</Link>
            <Link to="/eventUserManagement">Event User Management</Link>
          </>
        )}

        {user.role === "REGULAR" && (
          <Link to="/rewards">My Rewards</Link>
        )}

        <Link to="/profile">Profile</Link>
        <Link to="/points">Points</Link>
        <Link to="/qr">QR Code</Link>
        <Link to="/manualTransfer">Manual Transaction</Link>
        <Link to="/redeem">Redemption Request</Link>
        <Link to="/redeemQR">QR Redemption Requests</Link>
        <Link to="/showPromotions">Promotions</Link>
        <Link to="/showEvents">Events</Link>
        <Link to="/RSVP">RSVP</Link>
        <Link to="/transactionHistory">Transaction History</Link>
      </nav>

      <hr className="divider" />

      <div className="nav-links">
        <button className="logout-button" onClick={handleLogout}>Logout</button>
      </div>
    </div>
  );
}
