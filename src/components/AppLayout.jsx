import {
  Outlet,
  useLocation,
  useNavigate,
} from "react-router";

import { useState } from "react";

import Sidebar from "./Sidebar";

import "../styles/SharedPages.css";

export default function AppLayout() {

  const [open, setOpen] =
    useState(false);

  const [moreOpen, setMoreOpen] =
    useState(false);

  const nav = useNavigate();

  const location = useLocation();

  function isActive(path) {
    return location.pathname.startsWith(path);
  }

  function goTo(path) {
    nav(path);
    setMoreOpen(false);
  }

  return (
    <div>

      {/* =====================================================
          TOP HEADER
      ===================================================== */}

      <header className="header">

        <button
          className="brand"
          onClick={() =>
            setOpen(true)
          }
        >
          <span className="avatar">
            S
          </span>

          <span>
            <b>
              Sangam Fin Capital
            </b>

            <small>
              Main Branch • Branch Location
            </small>
          </span>
        </button>

        {/*
          Top-right area intentionally empty.

          We removed the old:
          + Customer

          We can add another function here later.
        */}

        <div className="header-right-placeholder" />

      </header>

      {/* =====================================================
          SIDEBAR
      ===================================================== */}

      <Sidebar
        open={open}
        onClose={() =>
          setOpen(false)
        }
      />

      {/* =====================================================
          DESKTOP FLOATING NAVIGATION
      ===================================================== */}

      <nav
  className={
    "desktop-floating-dock " +
    (open ? "sidebar-open" : "")
  }
>

        {/* HOME */}

        <button
          className={
            isActive("/dashboard")
              ? "active"
              : ""
          }
          onClick={() =>
            goTo("/dashboard")
          }
          type="button"
        >
          <span>⌂</span>
          <small>Home</small>
        </button>

        {/* CUSTOMERS */}

        <button
          className={
            isActive("/customers")
              ? "active"
              : ""
          }
          onClick={() =>
            goTo("/customers")
          }
          type="button"
        >
          <span>◎</span>
          <small>Customers</small>
        </button>

        {/* COLLECTION */}

        <button
          className={
            isActive("/collection")
              ? "active"
              : ""
          }
          onClick={() =>
            goTo("/collection")
          }
          type="button"
        >
          <span>₹</span>
          <small>Collection</small>
        </button>

        {/* OVERVIEW */}

        {/* EXPENSES */}

<button
  className={
    isActive("/expenses")
      ? "active"
      : ""
  }
  onClick={() =>
    goTo("/expenses")
  }
  type="button"
>
  <span>−</span>
  <small>Expenses</small>
</button>

        {/* MORE */}

        <button
          className={
            moreOpen
              ? "active"
              : ""
          }
          onClick={() =>
            setMoreOpen(
              (value) => !value
            )
          }
          type="button"
        >
          <span>•••</span>
          <small>More</small>
        </button>

      </nav>

      {/* =====================================================
          DESKTOP MORE MENU
      ===================================================== */}

      {moreOpen && (
        <>

          <div
            className="desktop-dock-more-backdrop"
            onClick={() =>
              setMoreOpen(false)
            }
          />

          <section className="desktop-dock-more-menu">

            <button
              type="button"
              onClick={() =>
                goTo("/loans")
              }
            >
              Loans
            </button>

            <button
              type="button"
              onClick={() =>
                goTo("/payments")
              }
            >
              Payments
            </button>

            <button
              type="button"
              onClick={() =>
                goTo("/expenses")
              }
            >
              Expenses
            </button>

            <button
              type="button"
              onClick={() =>
                goTo("/reports")
              }
            >
              Reports
            </button>

            <button
              type="button"
              onClick={() =>
                goTo("/agents")
              }
            >
              Agents
            </button>

            <button
              type="button"
              onClick={() =>
                goTo("/documents")
              }
            >
              Documents
            </button>

            <button
              type="button"
              onClick={() =>
                goTo("/settings")
              }
            >
              Settings
            </button>

          </section>

        </>
      )}

      {/* =====================================================
          PAGE CONTENT
      ===================================================== */}

      <main className="container">
        <Outlet />
      </main>

    </div>
  );
}