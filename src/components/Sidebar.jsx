import { useState } from "react";
import {
  NavLink,
  useLocation,
} from "react-router";

import "../styles/SharedPages.css";

export default function Sidebar({
  open,
  onClose,
}) {
  const location =
    useLocation();

  const [
    customersOpen,
    setCustomersOpen,
  ] = useState(
    location.pathname.startsWith(
      "/customers"
    )
  );

  const [
    loansOpen,
    setLoansOpen,
  ] = useState(
    location.pathname.startsWith(
      "/loans"
    )
  );

  const cls = ({
    isActive,
  }) =>
    "navlink " +
    (isActive
      ? "active"
      : "");

  const customersActive =
    location.pathname.startsWith(
      "/customers"
    );

  const loansActive =
    location.pathname.startsWith(
      "/loans"
    );

  function handleNavigate() {
    onClose();
  }

  return (
    <>

      <div
        className={
          "backdrop " +
          (open ? "open" : "")
        }
        onClick={onClose}
      />


      <aside
        className={
          "sidebar " +
          (open ? "open" : "")
        }
      >

        <div className="sidebrand">

          <span className="avatar">
            S
          </span>

          <span>

            <b>
              Sangam Fin Capital
            </b>

            <small>
              Main Branch
            </small>

          </span>

        </div>


        <nav>

          {/* HOME */}

          <NavLink
            className={cls}
            to="/dashboard"
            onClick={
              handleNavigate
            }
          >
            <span className="sidebar-icon">
              ⌂
            </span>

            <span>
              Home
            </span>
          </NavLink>


          {/* CUSTOMERS */}

          <button
            type="button"
            className={
              "sidebar-dropdown-title " +
              (
                customersActive
                  ? "active"
                  : ""
              )
            }
            onClick={() =>
              setCustomersOpen(
                (value) =>
                  !value
              )
            }
          >

            <span className="sidebar-dropdown-left">

              <span className="sidebar-icon">
                ◎
              </span>

              <span>
                Customers
              </span>

            </span>

            <span
              className={
                "sidebar-dropdown-arrow " +
                (
                  customersOpen
                    ? "open"
                    : ""
                )
              }
            >
              ⌄
            </span>

          </button>


          {customersOpen && (

            <div className="sidebar-submenu">

              <NavLink
                className={cls}
                to="/customers/daily"
                onClick={
                  handleNavigate
                }
              >
                <span className="submenu-dot">
                  •
                </span>

                Daily
              </NavLink>

              <NavLink
                className={cls}
                to="/customers/weekly"
                onClick={
                  handleNavigate
                }
              >
                <span className="submenu-dot">
                  •
                </span>

                Weekly
              </NavLink>

              <NavLink
                className={cls}
                to="/customers/monthly"
                onClick={
                  handleNavigate
                }
              >
                <span className="submenu-dot">
                  •
                </span>

                Monthly
              </NavLink>

            </div>

          )}


          {/* LOANS */}

          <button
            type="button"
            className={
              "sidebar-dropdown-title " +
              (
                loansActive
                  ? "active"
                  : ""
              )
            }
            onClick={() =>
              setLoansOpen(
                (value) =>
                  !value
              )
            }
          >

            <span className="sidebar-dropdown-left">

              <span className="sidebar-icon">
                ₹
              </span>

              <span>
                Loans
              </span>

            </span>

            <span
              className={
                "sidebar-dropdown-arrow " +
                (
                  loansOpen
                    ? "open"
                    : ""
                )
              }
            >
              ⌄
            </span>

          </button>


          {loansOpen && (

            <div className="sidebar-submenu">

              <NavLink
                className={cls}
                to="/loans"
                onClick={
                  handleNavigate
                }
              >
                <span className="submenu-dot">
                  •
                </span>

                All Loans
              </NavLink>

              <NavLink
                className={cls}
                to="/loans/create"
                onClick={
                  handleNavigate
                }
              >
                <span className="submenu-dot">
                  •
                </span>

                Create Loans
              </NavLink>

            </div>

          )}


          {/* COLLECTION */}

          <NavLink
            className={cls}
            to="/collection"
            onClick={
              handleNavigate
            }
          >
            <span className="sidebar-icon">
              ₹
            </span>

            <span>
              Collection
            </span>
          </NavLink>


          {/* PAYMENTS */}

          <NavLink
            className={cls}
            to="/payments"
            onClick={
              handleNavigate
            }
          >
            <span className="sidebar-icon">
              ⇄
            </span>

            <span>
              History
            </span>
          </NavLink>


          {/* EXPENSES */}

          <NavLink
            className={cls}
            to="/expenses"
            onClick={
              handleNavigate
            }
          >
            <span className="sidebar-icon">
              −
            </span>

            <span>
              Expenses
            </span>
          </NavLink>


          {/* REPORTS */}

          <NavLink
            className={cls}
            to="/reports"
            onClick={
              handleNavigate
            }
          >
            <span className="sidebar-icon">
              ▦
            </span>

            <span>
              Reports
            </span>
          </NavLink>

          {/* OVERVIEW */}

<NavLink
  className={cls}
  to="/reports"
  onClick={
    handleNavigate
  }
>
  <span className="sidebar-icon">
    ▦
  </span>

  <span>
    Overview
  </span>
</NavLink>


          {/* AGENTS */}

          <NavLink
            className={cls}
            to="/agents"
            onClick={
              handleNavigate
            }
          >
            <span className="sidebar-icon">
              ♙
            </span>

            <span>
              Agents
            </span>
          </NavLink>


          {/* DOCUMENTS */}

          <NavLink
            className={cls}
            to="/documents"
            onClick={
              handleNavigate
            }
          >
            <span className="sidebar-icon">
              ▤
            </span>

            <span>
              Documents
            </span>
          </NavLink>


          {/* SETTINGS */}

          <NavLink
            className={cls}
            to="/settings"
            onClick={
              handleNavigate
            }
          >
            <span className="sidebar-icon">
              ⚙
            </span>

            <span>
              Settings
            </span>
          </NavLink>

        </nav>

      </aside>

    </>
  );
}