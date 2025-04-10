import React from "react";
import axios from "axios";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import Dashboard from "./pages/Dashboard";
import UnauthorizedPage from "./pages/UnauthorizedPage";
import ProfilePage from "./pages/ProfilePage";
import { AuthProvider } from "./context/useAuth";
import ProtectedRoute from "./components/ProtectedRoute";
import TransactionPage from "./pages/TransactionPage";
import TransactionManagement from "./pages/TransactionManagement";
import UserManagement from "./pages/UserManagement";
import PromotionsPage from "./pages/PromotionsPage";
import EventsPage from "./pages/EventsPage";
import UserList from "./pages/UserList";
import CreatePromotions from "./pages/CreatePromotions";
import CreateEvents from "./pages/CreateEvents";
import EventManagement from "./pages/EventManagement";
import EventUserManagement from "./pages/EventUserManagement";
import "./App.css";
import AvailablePoints from "./pages/AvailablePoints";
import ManualTransferPage from "./pages/ManualTransfer";
import AvailablePromotionsPage from "./pages/ShowPromotions";
import PublishedEventsPage from "./pages/ShowEvents";
import EventRSVPPage from "./pages/RSVP";
import CreateTransactionPage from "./pages/CreateTransaction";

axios.defaults.withCredentials = true;

function Layout({ children }) {
  return (
    <div className="app-layout">
      <main className="main-content">{children}</main>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route
            path="/register"
            element={
              <ProtectedRoute allowedRoles={["CASHIER", "MANAGER", "SUPERUSER"]}>
                <Layout><RegisterPage /></Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute allowedRoles={["REGULAR", "CASHIER", "MANAGER", "SUPERUSER"]}>
                <Layout><Dashboard /></Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/profile"
            element={
              <ProtectedRoute allowedRoles={["REGULAR", "CASHIER", "MANAGER", "SUPERUSER"]}>
                <Layout><ProfilePage /></Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/userList"
            element={
              <ProtectedRoute allowedRoles={["MANAGER", "SUPERUSER"]}>
                <Layout><UserList /></Layout>
              </ProtectedRoute>
            }
          />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />
          <Route path="*" element={<LoginPage />} />
          <Route path="/transactions" element={<ProtectedRoute allowedRoles={["MANAGER", "SUPERUSER"]}><Layout><TransactionPage /></Layout></ProtectedRoute>} />
          <Route path="/createTransaction" element={<ProtectedRoute allowedRoles={["CASHIER", "MANAGER", "SUPERUSER"]}><Layout><CreateTransactionPage /></Layout></ProtectedRoute>} />
          <Route path="/createPromotions" element={<ProtectedRoute allowedRoles={["MANAGER", "SUPERUSER"]}><Layout><CreatePromotions /></Layout></ProtectedRoute>} />
          <Route path="/transactionManagement" element={<ProtectedRoute allowedRoles={["MANAGER", "SUPERUSER"]}><Layout><TransactionManagement /></Layout></ProtectedRoute>} />
          <Route path="/users" element={<ProtectedRoute allowedRoles={["MANAGER", "SUPERUSER"]}> <Layout><UserManagement /></Layout></ProtectedRoute>} />
          <Route path="/promotions" element={<ProtectedRoute allowedRoles={["MANAGER", "SUPERUSER"]}><Layout><PromotionsPage /></Layout></ProtectedRoute>} />
          <Route path="/createEvents" element={<ProtectedRoute allowedRoles={["MANAGER", "SUPERUSER"]}><Layout><CreateEvents /></Layout></ProtectedRoute>} />
          <Route path="/events" element={<ProtectedRoute allowedRoles={["MANAGER", "SUPERUSER"]}><Layout><EventsPage /></Layout></ProtectedRoute>} />
          <Route path="/eventManagement" element={<ProtectedRoute allowedRoles={["MANAGER", "SUPERUSER"]}><Layout><EventManagement /></Layout></ProtectedRoute>} />
          <Route path="/eventUserManagement" element={<ProtectedRoute allowedRoles={["MANAGER", "SUPERUSER"]}><Layout><EventUserManagement /></Layout></ProtectedRoute>} />
          <Route path="/points" element={<ProtectedRoute allowedRoles={["REGULAR", "CASHIER", "MANAGER", "SUPERUSER"]}><Layout><AvailablePoints /></Layout></ProtectedRoute>} />
          <Route path="/manualTransfer" element={<ProtectedRoute allowedRoles={["REGULAR", "CASHIER", "MANAGER", "SUPERUSER"]}><Layout><ManualTransferPage /></Layout></ProtectedRoute>} />
          <Route path="/showPromotions" element={<ProtectedRoute allowedRoles={["REGULAR", "CASHIER", "MANAGER", "SUPERUSER"]}><Layout><AvailablePromotionsPage /></Layout></ProtectedRoute>} />
          <Route path="/showEvents" element={<ProtectedRoute allowedRoles={["REGULAR", "CASHIER", "MANAGER", "SUPERUSER"]}><Layout><PublishedEventsPage /></Layout></ProtectedRoute>} />
          <Route path="/RSVP" element={<ProtectedRoute allowedRoles={["REGULAR", "CASHIER", "MANAGER", "SUPERUSER"]}><Layout><EventRSVPPage /></Layout></ProtectedRoute>} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
