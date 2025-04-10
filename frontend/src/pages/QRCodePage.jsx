import React from "react";
import { QRCodeCanvas } from 'qrcode.react';
import { useAuth } from "../context/useAuth";
import Sidebar from "../layout/Sidebar";

export default function QRCodePage() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="page-layout">
      <Sidebar />
      <div className="page-content">
        <h2 className="title">Your QR Code</h2>
        <div className="qr-container">
          <p>Show this QR code to initiate a transaction:</p>
          <QRCodeCanvas value={user.utorid} size={200} />
          <p className="utorid-text">{user.utorid}</p>
        </div>
      </div>
    </div>
  );
}
