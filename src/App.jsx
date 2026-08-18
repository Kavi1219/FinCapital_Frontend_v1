import {
  Navigate,
  Route,
  Routes,
} from "react-router";

import AppLayout from "./components/AppLayout";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";

import Customers from "./pages/Customers";
import AddCustomer from "./pages/AddCustomer";
import CustomerProfile from "./pages/CustomerProfile";
import AddLoan from "./pages/AddLoan";

import SimplePage from "./pages/SimplePage";
import Payments from "./pages/Payments";
import Expenses from "./pages/Expenses";
import Reports from "./pages/Reports";

export default function App() {
  return (
    <Routes>

      {/* LOGIN */}

      <Route
        path="/login"
        element={<Login />}
      />


      {/* MAIN APPLICATION */}

      <Route element={<AppLayout />}>

        <Route
          path="/"
          element={
            <Navigate
              to="/dashboard"
              replace
            />
          }
        />


        {/* DASHBOARD */}

        <Route
          path="/dashboard"
          element={<Dashboard />}
        />


        {/* =========================
            CUSTOMER ROUTES
        ========================= */}

        <Route
          path="/customers/new"
          element={<AddCustomer />}
        />

        <Route
          path="/customers/profile/:customerId"
          element={<CustomerProfile />}
        />

        <Route
          path="/customers/:customerId/add-loan"
          element={<AddLoan />}
        />

        <Route
          path="/customers/:cycle?"
          element={<Customers />}
        />


        {/* =========================
            LOAN ROUTES
        ========================= */}

        <Route
          path="/loans/create"
          element={<AddCustomer />}
        />

        <Route
          path="/loans"
          element={
            <SimplePage title="All Loans" />
          }
        />


        {/* COLLECTION */}

        <Route
          path="/collection"
          element={
            <SimplePage title="Collection" />
          }
        />


        {/* PAYMENTS */}

        <Route
          path="/payments"
          element={<Payments />}
        />


        {/* EXPENSES */}

        <Route
          path="/expenses"
          element={<Expenses />}
        />


        {/* REPORTS */}

        <Route
          path="/reports"
          element={<Reports />}
        />


        {/* AGENTS */}

        <Route
          path="/agents"
          element={
            <SimplePage title="Agents" />
          }
        />


        {/* DOCUMENTS */}

        <Route
          path="/documents"
          element={
            <SimplePage title="Documents" />
          }
        />


        {/* SETTINGS */}

        <Route
          path="/settings"
          element={
            <SimplePage title="Settings" />
          }
        />

      </Route>


      {/* UNKNOWN URL */}

      <Route
        path="*"
        element={
          <Navigate
            to="/dashboard"
            replace
          />
        }
      />

    </Routes>
  );
}