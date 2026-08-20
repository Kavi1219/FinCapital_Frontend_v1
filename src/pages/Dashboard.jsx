import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { findCustomer, recordLoanPayment } from "../utils/customerStorage";
import "../styles/Dashboard.css";

const SESSION_KEY = "fincapital_session";

const cards = [
  ["Expected Today", "₹42,000", "blue", "expected"],
  ["Collected Today", "₹28,500", "green", "collected"],
  ["Pending / Overdue", "₹13,500", "red", "pending"],
  ["Active Loans", "42", "navy", "activeLoans"],
  ["Today's Expenses", "₹1,250", "orange", "expenses"],
];

const collections = {
  DAILY: [
    {
      id: "SFC-0008",
      name: "Kumar",
      cycle: "Daily",
      amount: 300,
      status: "Due Today",
    },
    {
      id: "SFC-0012",
      name: "Suresh",
      cycle: "Daily",
      amount: 500,
      status: "Pending",
    },
  ],

  WEEKLY: [
    {
      id: "SFC-0001",
      name: "Ravi Kumar",
      cycle: "Weekly",
      amount: 1000,
      status: "Due Today",
    },
    {
      id: "SFC-0006",
      name: "Karthik",
      cycle: "Weekly",
      amount: 1500,
      status: "Pending",
    },
  ],

  MONTHLY: [
    {
      id: "SFC-0018",
      name: "Arun",
      cycle: "Monthly",
      amount: 3000,
      status: "Due Today",
    },
  ],
};

const activeLoanCustomers = {
  DAILY: [
    {
      id: "SFC-0008",
      name: "Kumar",
      amount: 1000,
      status: "Active",
    },
    {
      id: "SFC-0012",
      name: "Suresh",
      amount: 2000,
      status: "Active",
    },
    {
      id: "SFC-0015",
      name: "Mani",
      amount: 1500,
      status: "Active",
    },
    {
      id: "SFC-0020",
      name: "Selvam",
      amount: 3000,
      status: "Active",
    },
  ],

  WEEKLY: [
    {
      id: "SFC-0001",
      name: "Ravi Kumar",
      amount: 10000,
      status: "Active",
    },
    {
      id: "SFC-0006",
      name: "Karthik",
      amount: 6000,
      status: "Active",
    },
    {
      id: "SFC-0011",
      name: "Mohan",
      amount: 8000,
      status: "Active",
    },
  ],

  MONTHLY: [
    {
      id: "SFC-0018",
      name: "Arun",
      amount: 9000,
      status: "Active",
    },
    {
      id: "SFC-0021",
      name: "Prakash",
      amount: 15000,
      status: "Active",
    },
  ],
};

const activeLoanCounts = {
  DAILY: 18,
  WEEKLY: 16,
  MONTHLY: 8,
};

const cardDetails = {
  expected: {
    title: "Expected Today",
    amount: "₹42,000",
    rows: [
      ["SFC-0001", "Ravi Kumar", "Weekly", "₹1,000"],
      ["SFC-0008", "Kumar", "Daily", "₹300"],
      ["SFC-0012", "Suresh", "Daily", "₹500"],
    ],
  },

  collected: {
    title: "Collected Today",
    amount: "₹28,500",
    rows: [
      ["SFC-0003", "Mohan", "Weekly", "₹2,000"],
      ["SFC-0005", "Arul", "Daily", "₹700"],
      ["SFC-0015", "Kannan", "Monthly", "₹3,000"],
    ],
  },

  pending: {
    title: "Pending / Overdue",
    amount: "₹13,500",
    rows: [
      ["SFC-0006", "Karthik", "Weekly", "₹1,500"],
      ["SFC-0012", "Suresh", "Daily", "₹500"],
      ["SFC-0021", "Mani", "Monthly", "₹4,000"],
    ],
  },

  expenses: {
    title: "Today's Expenses",
    amount: "₹1,250",
    rows: [
      ["-", "Petrol", "Owner", "₹500"],
      ["-", "Tea", "Owner", "₹250"],
      ["-", "Travel", "Agent 1", "₹500"],
    ],
  },
};

const upcoming = [
  {
    date: "21 Aug",
    id: "SFC-0001",
    name: "Ravi Kumar",
    cycle: "Weekly",
    amount: 500,
    status: "Upcoming",
  },
  {
    date: "22 Aug",
    id: "SFC-0008",
    name: "Kumar",
    cycle: "Daily",
    amount: 300,
    status: "Upcoming",
  },
  {
    date: "23 Aug",
    id: "SFC-0012",
    name: "Suresh",
    cycle: "Daily",
    amount: 700,
    status: "Upcoming",
  },
  {
    date: "24 Aug",
    id: "SFC-0018",
    name: "Arun",
    cycle: "Monthly",
    amount: 3000,
    status: "Upcoming",
  },
];

function money(value) {
  return Number(value || 0).toLocaleString("en-IN");
}

function getTodayLocalDate() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getCurrentCollector() {
  try {
    const saved = localStorage.getItem(SESSION_KEY);

    if (!saved) {
      return "Owner";
    }

    const session = JSON.parse(saved);

    return (
      session.displayName ||
      session.profileName ||
      session.name ||
      (session.role === "agent" ? "Agent" : "Owner")
    );
  } catch {
    return "Owner";
  }
}

function getLoanOutstanding(loan) {
  if (!loan) return 0;

  if (
    loan.status === "Closed" ||
    loan.status === "Preclosed"
  ) {
    return 0;
  }

  if (loan.loanType === "IO") {
    return Math.max(
      0,
      Number(
        loan.principalPending ??
          loan.loanAmount ??
          0
      )
    );
  }

  return Math.max(
    0,
    Number(
      loan.totalRepayment ??
        loan.loanAmount ??
        0
    ) -
      Number(
        loan.collectedAmount || 0
      )
  );
}

export default function Dashboard() {
  const nav = useNavigate();

  const [cycle, setCycle] = useState("DAILY");

  const [menuOpen, setMenuOpen] = useState(false);

  const [moreOpen, setMoreOpen] = useState(false);

  const [overviewOpen, setOverviewOpen] = useState(false);

  const [detailKey, setDetailKey] = useState(null);

  const [activeLoanCycle, setActiveLoanCycle] = useState(null);

  const [paymentCustomer, setPaymentCustomer] = useState(null);
  const [paymentLoan, setPaymentLoan] = useState(null);
  const [paymentTab, setPaymentTab] = useState("Due");
  const [paymentDate, setPaymentDate] = useState(getTodayLocalDate);
  const [amountReceived, setAmountReceived] = useState("");
  const [fineAmount, setFineAmount] = useState("");

  const collectedBy = useMemo(
    () => getCurrentCollector(),
    []
  );

  const currentRows = useMemo(
    () => collections[cycle] || [],
    [cycle]
  );

  const detail =
    detailKey && detailKey !== "activeLoans"
      ? cardDetails[detailKey]
      : null;

  // =========================================================
  // OPEN DASHBOARD CARD
  // =========================================================

  function openCardDetail(key) {
    setDetailKey(key);

    if (key === "activeLoans") {
      setActiveLoanCycle(null);
    }
  }

  // =========================================================
  // PAY CUSTOMER
  // =========================================================

  function payCustomer(customer) {
    const record = findCustomer(customer.id);

    if (!record) {
      alert(`Customer ${customer.id} was not found.`);
      return;
    }

    const activeLoans = (record.loans || []).filter(
      (loan) => loan.status === "Active"
    );

    const matchingLoan =
      activeLoans.find(
        (loan) =>
          String(loan.cycle || "").toLowerCase() ===
          String(customer.cycle || "").toLowerCase()
      ) || activeLoans[0];

    if (!matchingLoan) {
      alert("No active loan is available for this customer.");
      return;
    }

    setPaymentCustomer({
      id: customer.id,
      name: record.customer?.name || customer.name,
    });

    setPaymentLoan(matchingLoan);
    setPaymentTab("Due");
    setPaymentDate(getTodayLocalDate());

    setAmountReceived(
      String(
        Number(matchingLoan.collectionAmount || 0) +
          Number(matchingLoan.pendingDue || 0)
      )
    );

    setFineAmount("");
  }

  function closeDashboardPayment() {
    setPaymentCustomer(null);
    setPaymentLoan(null);
    setPaymentTab("Due");
    setPaymentDate(getTodayLocalDate());
    setAmountReceived("");
    setFineAmount("");
  }

  function saveDashboardDuePayment() {
    if (!paymentCustomer || !paymentLoan) return;

    if (!paymentDate) {
      alert("Please select payment date.");
      return;
    }

    if (paymentDate > getTodayLocalDate()) {
      alert("Future payment date is not allowed.");
      return;
    }

    const paid = Number(amountReceived || 0);

    if (paid <= 0) {
      alert("Please enter amount received.");
      return;
    }

    const result = recordLoanPayment(
      paymentCustomer.id,
      paymentLoan.loanId,
      {
        paymentType: "Due",
        paymentDate,
        dueAmount: Number(paymentLoan.collectionAmount || 0),
        amount: paid,
        collectedBy,
      }
    );

    if (!result) {
      alert("Unable to save payment.");
      return;
    }

    closeDashboardPayment();
    alert("Payment saved successfully.");
  }

  function saveDashboardFinePayment() {
    if (!paymentCustomer || !paymentLoan) return;

    if (!paymentDate) {
      alert("Please select payment date.");
      return;
    }

    if (paymentDate > getTodayLocalDate()) {
      alert("Future payment date is not allowed.");
      return;
    }

    const amount = Number(fineAmount || 0);

    if (amount <= 0) {
      alert("Please enter fine amount.");
      return;
    }

    const result = recordLoanPayment(
      paymentCustomer.id,
      paymentLoan.loanId,
      {
        paymentType: "Fine",
        paymentDate,
        fineAmount: amount,
        collectedBy,
      }
    );

    if (!result) {
      alert("Unable to save fine.");
      return;
    }

    closeDashboardPayment();
    alert("Fine saved successfully.");
  }

  return (
    <div className="dashboard-page">

      {/* =====================================================
          DASHBOARD HEADER
      ===================================================== */}

      <div className="dashboard-titlebar">

        <div>
          <h1>Dashboard</h1>

          <p>
            Track collections, pending dues, loans and expenses.
          </p>
        </div>

        <div className="dashboard-title-actions">

          <span className="date dashboard-date">
            17 Aug 2026
          </span>

          <div className="dashboard-menu-wrap">

            <button
              className="dashboard-more-button"
              onClick={() =>
                setMenuOpen(
                  (value) => !value
                )
              }
              aria-label="Open dashboard menu"
            >
              ⋮
            </button>

            {menuOpen && (

              <div className="dashboard-top-menu">

                <button
                  onClick={() =>
                    nav("/reports")
                  }
                >
                  Reports
                </button>

                <button
                  onClick={() =>
                    nav("/documents")
                  }
                >
                  Documents
                </button>

                <button
                  onClick={() =>
                    nav("/settings")
                  }
                >
                  Settings
                </button>

                <button
                  onClick={() =>
                    nav("/profile")
                  }
                >
                  Profile
                </button>

              </div>

            )}

          </div>

        </div>

      </div>

      {/* =====================================================
          SUMMARY CARDS
      ===================================================== */}

      <section
        className="
          cards
          dashboard-summary-cards
          dashboard-summary-five
        "
      >

        {cards.map(
          (card) => (

            <article

              className={
                "card dashboard-click-card " +
                card[2]
              }

              key={card[0]}

              onClick={() =>
                openCardDetail(
                  card[3]
                )
              }
            >

              <div className="dashboard-card-copy">

                <span>
                  {card[0]}
                </span>

                <b>
                  {card[1]}
                </b>

              </div>

              <span className="dashboard-card-arrow">
                ›
              </span>

            </article>

          )
        )}

      </section>

      {/* =====================================================
          TODAY'S COLLECTION
      ===================================================== */}

      <section className="panel dashboard-collection-panel">

        <div className="dashboard-section-head">

          <div>

            <h2>
              Today's Collection
            </h2>

            <p>
              Customers scheduled for collection today.
            </p>

          </div>

          <div className="dashboard-cycle-tabs">

            {[
              "DAILY",
              "WEEKLY",
              "MONTHLY",
            ].map(
              (item) => (

                <button

                  key={item}

                  className={
                    cycle === item
                      ? "active"
                      : ""
                  }

                  onClick={() =>
                    setCycle(item)
                  }
                >

                  {item[0] +
                    item
                      .slice(1)
                      .toLowerCase()}

                </button>

              )
            )}

          </div>

        </div>

        {/* =================================================
            DESKTOP TABLE
        ================================================= */}

        <div className="dashboard-desktop-table tablewrap">

          <table>

            <thead>

              <tr>

                <th>
                  Customer ID
                </th>

                <th>
                  Name
                </th>

                <th>
                  Cycle
                </th>

                <th>
                  Amount to Pay
                </th>

                <th>
                  Status
                </th>

                <th>
                  Actions
                </th>

              </tr>

            </thead>

            <tbody>

              {currentRows.map(
                (row) => (

                  <tr key={row.id}>

                    <td>
                      {row.id}
                    </td>

                    <td>
                      {row.name}
                    </td>

                    <td>
                      {row.cycle}
                    </td>

                    <td className="dashboard-amount">
                      ₹{money(row.amount)}
                    </td>

                    <td>

                      <span
                        className={
                          "dashboard-status " +
                          (
                            row.status === "Pending"
                              ? "pending"
                              : "due"
                          )
                        }
                      >

                        {row.status}

                      </span>

                    </td>

                    <td>

                      <div className="dashboard-action-buttons">

                        {/* PAY BUTTON */}

                        <button
                          className="dashboard-pay-btn"
                          onClick={() =>
                            payCustomer(row)
                          }
                        >
                          Pay
                        </button>

                        {/* VIEW BUTTON */}

                        <button

                          className="dashboard-view-btn"

                          onClick={() =>
                            nav(
                              `/customers/profile/${row.id}`
                            )
                          }
                        >
                          View
                        </button>

                      </div>

                    </td>

                  </tr>

                )
              )}

            </tbody>

          </table>

        </div>

        {/* =================================================
            MOBILE COLLECTION CARDS
        ================================================= */}

        <div className="dashboard-mobile-list">

          {currentRows.map(
            (row) => (

              <article
                className="dashboard-collection-card"
                key={`mobile-${row.id}`}
              >

                <div className="dashboard-collection-top">

                  <div>

                    <span>
                      {row.id}
                    </span>

                    <strong>
                      {row.name}
                    </strong>

                  </div>

                  <b>
                    ₹{money(row.amount)}
                  </b>

                </div>

                <div className="dashboard-collection-bottom">

                  <span>
                    {row.cycle}
                    {" • "}
                    {row.status}
                  </span>

                  <div className="dashboard-mobile-row-actions">

                    <button
                      className="dashboard-pay-btn"
                      onClick={() =>
                        payCustomer(row)
                      }
                    >
                      Pay
                    </button>

                    <button

                      className="dashboard-view-btn"

                      onClick={() =>
                        nav(
                          `/customers/profile/${row.id}`
                        )
                      }
                    >
                      View
                    </button>

                  </div>

                </div>

              </article>

            )
          )}

        </div>

      </section>

      {/* =====================================================
          UPCOMING 7 DAYS
      ===================================================== */}

      <section className="panel dashboard-upcoming-panel">

        <div className="dashboard-section-head">

          <div>

            <h2>
              Upcoming 7 Days
            </h2>

            <p>
              Collections due over the next seven days.
            </p>

          </div>

        </div>

        <div className="dashboard-upcoming-list">

          {upcoming.map((row) => (

            <article
              className="dashboard-upcoming-item"
              key={`${row.date}-${row.id}`}
            >

              <div className="dashboard-upcoming-date">
                {row.date}
              </div>

              <div className="dashboard-upcoming-main">

                <strong>
                  {row.name}
                </strong>

                <span>
                  {row.id} • {row.cycle}
                </span>

              </div>

              <div className="dashboard-upcoming-right">

                <b>
                  ₹{money(row.amount)}
                </b>

                <div className="dashboard-upcoming-actions">

                  <button
                    type="button"
                    className="dashboard-pay-btn"
                    onClick={() =>
                      payCustomer(row)
                    }
                  >
                    Pay
                  </button>

                  <button
                    type="button"
                    className="dashboard-view-btn"
                    onClick={() =>
                      nav(
                        `/customers/profile/${row.id}`
                      )
                    }
                  >
                    View
                  </button>

                </div>

              </div>

            </article>

          ))}

        </div>

      </section>

      {/* =====================================================
          FLOATING ADD BUTTON
      ===================================================== */}

      <button

        className="dashboard-fab"

        aria-label="Add customer"

        onClick={() =>
          nav("/customers/new")
        }
      >
        +
      </button>

      {/* =====================================================
          MOBILE BOTTOM NAVIGATION
      ===================================================== */}

      <nav
        className="
          dashboard-mobile-nav
          dashboard-mobile-nav-five
        "
      >

        <button
          className="active"
          onClick={() =>
            nav("/dashboard")
          }
        >
          <span>⌂</span>
          <small>Home</small>
        </button>

        <button
          onClick={() =>
            nav("/customers")
          }
        >
          <span>◎</span>
          <small>Customers</small>
        </button>

        <button
          onClick={() =>
            nav("/collection")
          }
        >
          <span>₹</span>
          <small>Collection</small>
        </button>

        <button
          onClick={() =>
            setOverviewOpen(true)
          }
        >
          <span>▦</span>
          <small>Overview</small>
        </button>

        <button
          onClick={() =>
            setMoreOpen(
              (value) => !value
            )
          }
        >
          <span>•••</span>
          <small>More</small>
        </button>

      </nav>

      {/* =====================================================
          GENERAL CARD DETAIL POPUP
      ===================================================== */}

      {detail && (

        <div
          className="dashboard-detail-backdrop"
          onClick={() =>
            setDetailKey(null)
          }
        >

          <section

            className="dashboard-detail-sheet"

            onClick={
              (event) =>
                event.stopPropagation()
            }
          >

            <div className="dashboard-detail-head">

              <div>

                <h3>
                  {detail.title}
                </h3>

                <strong>
                  {detail.amount}
                </strong>

              </div>

              <button
                onClick={() =>
                  setDetailKey(null)
                }
              >
                ×
              </button>

            </div>

            <div className="dashboard-detail-list">

              {detail.rows.map(
                (row, index) => (

                  <article
                    key={`${row[0]}-${index}`}
                  >

                    <div>

                      <span>
                        {row[0]}
                      </span>

                      <strong>
                        {row[1]}
                      </strong>

                      <small>
                        {row[2]}
                      </small>

                    </div>

                    <b>
                      {row[3]}
                    </b>

                  </article>

                )
              )}

            </div>

          </section>

        </div>

      )}

      {/* =====================================================
          ACTIVE LOANS POPUP
      ===================================================== */}

      {detailKey === "activeLoans" && (

        <div
          className="dashboard-detail-backdrop"
          onClick={() =>
            setDetailKey(null)
          }
        >

          <section

            className="
              dashboard-detail-sheet
              dashboard-active-loans-sheet
            "

            onClick={
              (event) =>
                event.stopPropagation()
            }
          >

            <div className="dashboard-detail-head">

              <div>

                <h3>
                  Active Loans
                </h3>

                <strong>
                  42 Loans
                </strong>

              </div>

              <button
                onClick={() =>
                  setDetailKey(null)
                }
              >
                ×
              </button>

            </div>

            <div className="dashboard-active-cycle-grid">

              {[
                "DAILY",
                "WEEKLY",
                "MONTHLY",
              ].map(
                (item) => (

                  <button

                    key={item}

                    className={
                      activeLoanCycle === item
                        ? "active"
                        : ""
                    }

                    onClick={() =>
                      setActiveLoanCycle(item)
                    }
                  >

                    <span>
                      {item[0] +
                        item
                          .slice(1)
                          .toLowerCase()}
                    </span>

                    <strong>
                      {activeLoanCounts[item]}
                    </strong>

                    <small>
                      Active Loans
                    </small>

                  </button>

                )
              )}

            </div>

            {!activeLoanCycle ? (

              <div className="dashboard-active-hint">

                <strong>
                  Select a cycle
                </strong>

                <span>
                  Tap Daily, Weekly or Monthly to view active customers.
                </span>

              </div>

            ) : (

              <>

                <div className="dashboard-active-list-head">

                  <div>

                    <h4>

                      {activeLoanCycle[0] +
                        activeLoanCycle
                          .slice(1)
                          .toLowerCase()}

                      {" "}Active Loans

                    </h4>

                    <span>
                      {activeLoanCounts[
                        activeLoanCycle
                      ]} active loans
                    </span>

                  </div>

                  <button
                    onClick={() =>
                      setActiveLoanCycle(null)
                    }
                  >
                    Back
                  </button>

                </div>

                <div className="dashboard-active-customer-list">

                  {activeLoanCustomers[
                    activeLoanCycle
                  ].map(
                    (customer) => (

                      <article
                        key={customer.id}
                      >

                        <div>

                          <span>
                            {customer.id}
                          </span>

                          <strong>
                            {customer.name}
                          </strong>

                          <small>

                            {activeLoanCycle[0] +
                              activeLoanCycle
                                .slice(1)
                                .toLowerCase()}

                            {" • "}

                            {customer.status}

                          </small>

                        </div>

                        <div className="dashboard-active-customer-right">

                          <b>
                            ₹{money(
                              customer.amount
                            )}
                          </b>

                          <button
                            onClick={() =>
                              nav(
                                `/customers/profile/${customer.id}`
                              )
                            }
                          >
                            View
                          </button>

                        </div>

                      </article>

                    )
                  )}

                </div>

              </>

            )}

          </section>

        </div>

      )}

      {/* =====================================================
          OVERVIEW
      ===================================================== */}

      {overviewOpen && (

        <div

          className="dashboard-more-sheet-backdrop"

          onClick={() =>
            setOverviewOpen(false)
          }
        >

          <section

            className="
              dashboard-more-sheet
              dashboard-overview-sheet
            "

            onClick={
              (event) =>
                event.stopPropagation()
            }
          >

            <div className="dashboard-more-sheet-head">

              <div>

                <h3>
                  Overview
                </h3>

                <p>
                  Quick snapshot of today's business activity
                </p>

              </div>

              <button
                onClick={() =>
                  setOverviewOpen(false)
                }
              >
                ×
              </button>

            </div>

            <div className="dashboard-overview-grid">

              <article>
                <span>
                  Collection Rate
                </span>
                <strong>
                  67.8%
                </strong>
              </article>

              <article>
                <span>
                  Pending Amount
                </span>
                <strong>
                  ₹13,500
                </strong>
              </article>

              <article>
                <span>
                  Today's Expenses
                </span>
                <strong>
                  ₹1,250
                </strong>
              </article>

              <article>
                <span>
                  Active Loans
                </span>
                <strong>
                  42
                </strong>
              </article>

            </div>

            <div className="dashboard-overview-actions">

              <button
                onClick={() =>
                  nav("/reports")
                }
              >
                Open Reports
              </button>

              <button
                onClick={() =>
                  nav("/payments")
                }
              >
                Open Payments
              </button>

              <button
                onClick={() =>
                  nav("/expenses")
                }
              >
                Open Expenses
              </button>

            </div>

          </section>

        </div>

      )}

      {/* =====================================================
          DASHBOARD PAYMENT POPUP
      ===================================================== */}

      {paymentLoan && paymentCustomer && (
        <div
          className="payment-modal-backdrop"
          onClick={closeDashboardPayment}
        >
          <div
            className="payment-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="payment-modal-header">
              <div>
                <h3>Pay Now</h3>
                <p>
                  {paymentCustomer.name}
                  {" • "}
                  {paymentLoan.loanId}
                </p>
              </div>

              <button
                type="button"
                className="photo-viewer-close"
                onClick={closeDashboardPayment}
              >
                ×
              </button>
            </div>

            <div className="payment-tabs">
              <button
                type="button"
                className={paymentTab === "Due" ? "active" : ""}
                onClick={() => setPaymentTab("Due")}
              >
                Due
              </button>

              <button
                type="button"
                className={paymentTab === "Fine" ? "active" : ""}
                onClick={() => setPaymentTab("Fine")}
              >
                Fine
              </button>
            </div>

            <div className="payment-modal-body">
              <label className="payment-field">
                <span>Date *</span>
                <input
                  type="date"
                  value={paymentDate}
                  max={getTodayLocalDate()}
                  onChange={(event) => setPaymentDate(event.target.value)}
                />
              </label>

              {paymentTab === "Due" && (
                <>
                  <div className="payment-summary-grid">
                    <div>
                      <span>Due</span>
                      <b>₹{money(paymentLoan.collectionAmount)}</b>
                    </div>

                    <div>
                      <span>Pending</span>
                      <b>₹{money(paymentLoan.pendingDue || 0)}</b>
                    </div>

                    <div>
                      <span>Outstanding</span>
                      <b>₹{money(getLoanOutstanding(paymentLoan))}</b>
                    </div>
                  </div>

                  <label className="payment-field">
                    <span>Amount Received *</span>
                    <input
                      type="number"
                      min="0"
                      value={amountReceived}
                      onChange={(event) => setAmountReceived(event.target.value)}
                    />
                  </label>

                  <button
                    type="button"
                    className="primary full"
                    onClick={saveDashboardDuePayment}
                  >
                    Confirm Payment
                  </button>
                </>
              )}

              {paymentTab === "Fine" && (
                <>
                  <label className="payment-field">
                    <span>Fine Amount *</span>
                    <input
                      type="number"
                      min="0"
                      placeholder="Enter fine amount"
                      value={fineAmount}
                      onChange={(event) => setFineAmount(event.target.value)}
                    />
                  </label>

                  <button
                    type="button"
                    className="primary full"
                    onClick={saveDashboardFinePayment}
                  >
                    Confirm Fine
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =====================================================
          MORE MENU
      ===================================================== */}

      {moreOpen && (

        <div

          className="dashboard-more-sheet-backdrop"

          onClick={() =>
            setMoreOpen(false)
          }
        >

          <section

            className="dashboard-more-sheet"

            onClick={
              (event) =>
                event.stopPropagation()
            }
          >

            <div className="dashboard-more-sheet-head">

              <div>

                <h3>
                  More
                </h3>

                <p>
                  Open another Fin Capital section
                </p>

              </div>

              <button
                onClick={() =>
                  setMoreOpen(false)
                }
              >
                ×
              </button>

            </div>

            <div className="dashboard-more-grid">

              <button
                onClick={() =>
                  nav("/loans")
                }
              >
                Loans
              </button>

              <button
                onClick={() =>
                  nav("/payments")
                }
              >
                Payments
              </button>

              <button
                onClick={() =>
                  nav("/expenses")
                }
              >
                Expenses
              </button>

              <button
                onClick={() =>
                  nav("/reports")
                }
              >
                Reports
              </button>

              <button
                onClick={() =>
                  nav("/agents")
                }
              >
                Agents
              </button>

              <button
                onClick={() =>
                  nav("/documents")
                }
              >
                Documents
              </button>

              <button
                onClick={() =>
                  nav("/settings")
                }
              >
                Settings
              </button>

            </div>

          </section>

        </div>

      )}

    </div>
  );
}