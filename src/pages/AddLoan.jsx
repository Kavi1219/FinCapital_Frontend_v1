import { useMemo, useState } from "react";
import {
  useNavigate,
  useParams,
} from "react-router";

import {
  addLoanToCustomer,
  findCustomer,
  getNextLoanId,
  loadCustomers,
} from "../utils/customerStorage";

import "../styles/AddLoan.css";

function getTodayDate() {
  const now = new Date();
  const offset = now.getTimezoneOffset();

  const localDate = new Date(
    now.getTime() - offset * 60 * 1000
  );

  return localDate.toISOString().split("T")[0];
}

export default function AddLoan() {
  const { customerId } = useParams();
  const navigate = useNavigate();

  const customerRecord =
    findCustomer(customerId);

  const [loanId] = useState(() =>
    getNextLoanId(loadCustomers())
  );

  const [cycle, setCycle] =
    useState("Weekly");

  const [loanType, setLoanType] =
    useState("EMI");

  const [loanDate, setLoanDate] =
    useState(getTodayDate());

  const [amount, setAmount] =
    useState(10000);

  const [period, setPeriod] =
    useState(10);

  const [rate, setRate] =
    useState(10);

  const [
    interestTakenUpfront,
    setInterestTakenUpfront,
  ] = useState(false);

  const [showSuccess, setShowSuccess] =
    useState(false);

  // =========================================================
  // CALCULATION
  // =========================================================

  const interestAmount = useMemo(() => {
    return (amount * rate) / 100;
  }, [amount, rate]);

  const amountGiven = useMemo(() => {
    if (interestTakenUpfront) {
      return amount - interestAmount;
    }

    return amount;
  }, [
    amount,
    interestAmount,
    interestTakenUpfront,
  ]);

  const totalRepayment = useMemo(() => {
    // =====================================================
    // IO = INTEREST ONLY
    // Principal is returned separately.
    // =====================================================

    if (loanType === "IO") {
      return amount;
    }

    // =====================================================
    // EMI
    // =====================================================

    if (interestTakenUpfront) {
      return amount;
    }

    return amount + interestAmount;
  }, [
    amount,
    interestAmount,
    interestTakenUpfront,
    loanType,
  ]);

  const collectionAmount = useMemo(() => {
    // =====================================================
    // IO
    // Collection is only interest amount every cycle.
    //
    // Example:
    // ₹10,000 @ 2%
    // Collection = ₹200/week
    // =====================================================

    if (loanType === "IO") {
      return interestAmount;
    }

    // =====================================================
    // EMI
    // =====================================================

    if (!period || period <= 0) {
      return 0;
    }

    return totalRepayment / period;
  }, [
    loanType,
    interestAmount,
    totalRepayment,
    period,
  ]);

  const principalPending = useMemo(() => {
    if (loanType === "IO") {
      return amount;
    }

    return totalRepayment;
  }, [
    loanType,
    amount,
    totalRepayment,
  ]);

  const durationUnit =
    cycle === "Daily"
      ? "Days"
      : cycle === "Weekly"
      ? "Weeks"
      : "Months";

  const collectionLabel =
    cycle === "Daily"
      ? "Collection / Day"
      : cycle === "Weekly"
      ? "Collection / Week"
      : "Collection / Month";

  // =========================================================
  // CUSTOMER NOT FOUND
  // =========================================================

  if (!customerRecord) {
    return (
      <section className="panel">
        <h1>Customer Not Found</h1>

        <button
          className="primary"
          onClick={() =>
            navigate("/customers/all")
          }
        >
          Back to Customers
        </button>
      </section>
    );
  }

  // =========================================================
  // SAVE LOAN
  // =========================================================

  const handleSaveLoan = () => {
    if (!loanDate) {
      alert(
        "Please select loan given date"
      );
      return;
    }

    if (!amount || amount <= 0) {
      alert(
        "Please enter a valid loan amount"
      );
      return;
    }

    if (!period || period <= 0) {
      alert(
        "Please enter a valid period"
      );
      return;
    }

    if (rate < 0) {
      alert(
        "Please enter a valid interest rate"
      );
      return;
    }

    if (amountGiven < 0) {
      alert(
        "Interest amount cannot be greater than loan amount"
      );
      return;
    }

    const newLoan = {
      loanId,
      loanDate,

      loanAmount: amount,

      cycle,

      loanType,

      interestRate: rate,
      interestAmount,

      interestTakenUpfront,

      amountGiven,

      duration: period,
      durationUnit,

      totalRepayment,
      collectionAmount,

      status: "Active",

      collectedAmount: 0,

      principalPending,

      pendingDue: 0,
      fineDue: 0,
      finePaidTotal: 0,

      paymentHistory: [
        {
          id: `BORROW-${Date.now()}`,

          paymentType: "Loan Given",

          direction: "Outgoing",

          paymentDate: loanDate,

          amount: amountGiven,

          collectedBy: "Owner",

          pendingAfter: null,

          paidAt:
            new Date().toISOString(),
        },
      ],

      precloseAmount: null,
      preclosedAt: null,
      closedAt: null,

      createdAt:
        new Date().toISOString(),
    };

    const updated =
      addLoanToCustomer(
        customerId,
        newLoan
      );

    if (!updated) {
      alert(
        "Unable to add loan."
      );
      return;
    }

    setShowSuccess(true);
  };

  const handleSuccessDone = () => {
    setShowSuccess(false);

    navigate(
      `/customers/profile/${customerId}`
    );
  };

  return (
    <>
      <section className="panel add-customer-panel">

        {/* =====================================================
            HEADER
        ===================================================== */}

        <div className="add-customer-header">
          <h1>Add New Loan</h1>

          <p>
            Existing Customer:{" "}
            <b>
              {
                customerRecord
                  .customer
                  .name
              }
            </b>{" "}
            ({customerId})
          </p>
        </div>

        <div className="form-section-title">
          Loan Details
        </div>

        <div className="customer-form">

          {/* =====================================================
              LOAN ID
          ===================================================== */}

          <div className="form-field">
            <label>Loan ID</label>

            <input
              value={loanId}
              readOnly
            />
          </div>

          {/* =====================================================
              COLLECTION CYCLE
          ===================================================== */}

          <div className="form-field">
            <label>
              Collection Cycle *
            </label>

            <div className="choices">
              {[
                "Daily",
                "Weekly",
                "Monthly",
              ].map((x) => (
                <button
                  type="button"
                  key={x}
                  className={
                    cycle === x
                      ? "active"
                      : ""
                  }
                  onClick={() =>
                    setCycle(x)
                  }
                >
                  {x}
                </button>
              ))}
            </div>
          </div>

          {/* =====================================================
              LOAN TYPE
          ===================================================== */}

          <div className="form-field">
            <label>
              Loan Type *
            </label>

            <div className="choices">

              <button
                type="button"
                className={
                  loanType === "EMI"
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setLoanType("EMI")
                }
              >
                EMI
              </button>

              <button
                type="button"
                className={
                  loanType === "IO"
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setLoanType("IO")
                }
              >
                Interest Only
              </button>

            </div>
          </div>

          {/* =====================================================
              DATE
          ===================================================== */}

          <div className="form-field">
            <label>
              Loan Given Date *
            </label>

            <input
              type="date"
              value={loanDate}
              onChange={(e) =>
                setLoanDate(
                  e.target.value
                )
              }
            />
          </div>

          {/* =====================================================
              LOAN AMOUNT
          ===================================================== */}

          <div className="form-field">
            <label>
              Loan Amount *
            </label>

            <input
              type="number"
              min="1"
              value={amount}
              onChange={(e) =>
                setAmount(
                  Number(
                    e.target.value
                  )
                )
              }
            />
          </div>

          {/* =====================================================
              PERIOD
          ===================================================== */}

          <div className="form-field">
            <label>
              Period ({durationUnit}) *
            </label>

            <input
              type="number"
              min="1"
              value={period}
              onChange={(e) =>
                setPeriod(
                  Number(
                    e.target.value
                  )
                )
              }
            />
          </div>

          {/* =====================================================
              INTEREST RATE
          ===================================================== */}

          <div className="form-field">
            <label>
              Interest Rate % *
            </label>

            <input
              type="number"
              min="0"
              step="0.01"
              value={rate}
              onChange={(e) =>
                setRate(
                  Number(
                    e.target.value
                  )
                )
              }
            />
          </div>

          {/* =====================================================
              INTEREST AMOUNT
          ===================================================== */}

          <div className="form-field">
            <label>
              Interest Amount
            </label>

            <input
              value={
                "₹" +
                interestAmount.toLocaleString(
                  "en-IN",
                  {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  }
                )
              }
              readOnly
            />
          </div>

          {/* =====================================================
              INTEREST TAKEN
          ===================================================== */}

          <div className="form-field">
            <label>
              Interest Amount Taken?
            </label>

            <div className="choices">

              <button
                type="button"
                className={
                  interestTakenUpfront
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setInterestTakenUpfront(
                    true
                  )
                }
              >
                Yes
              </button>

              <button
                type="button"
                className={
                  !interestTakenUpfront
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setInterestTakenUpfront(
                    false
                  )
                }
              >
                No
              </button>

            </div>
          </div>

          {/* =====================================================
              AMOUNT GIVEN
          ===================================================== */}

          <div className="form-field">
            <label>
              Amount Given
            </label>

            <input
              value={
                "₹" +
                amountGiven.toLocaleString(
                  "en-IN",
                  {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  }
                )
              }
              readOnly
            />
          </div>

          {/* =====================================================
              TOTAL REPAYMENT / PRINCIPAL
          ===================================================== */}

          <div className="form-field">
            <label>
              {loanType === "IO"
                ? "Principal Amount"
                : "Total Repayment"}
            </label>

            <input
              value={
                "₹" +
                totalRepayment.toLocaleString(
                  "en-IN",
                  {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  }
                )
              }
              readOnly
            />
          </div>

          {/* =====================================================
              COLLECTION AMOUNT
          ===================================================== */}

          <div className="form-field">
            <label>
              {collectionLabel}
            </label>

            <input
              value={
                "₹" +
                collectionAmount.toLocaleString(
                  "en-IN",
                  {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  }
                )
              }
              readOnly
            />
          </div>

          {/* =====================================================
              PRINCIPAL PENDING
          ===================================================== */}

          {loanType === "IO" && (
            <div className="form-field">
              <label>
                Principal Pending
              </label>

              <input
                value={
                  "₹" +
                  principalPending.toLocaleString(
                    "en-IN",
                    {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    }
                  )
                }
                readOnly
              />
            </div>
          )}

        </div>

        {/* =====================================================
            SUMMARY
        ===================================================== */}

        <div className="loan-summary-card">

          <div className="loan-summary-title">
            Loan Summary
          </div>

          <div className="loan-summary-grid">

            <div className="loan-summary-item">
              <span>
                Loan Amount
              </span>

              <strong>
                ₹{amount.toLocaleString(
                  "en-IN"
                )}
              </strong>
            </div>

            <div className="loan-summary-item">
              <span>
                Loan Type
              </span>

              <strong>
                {loanType}
              </strong>
            </div>

            <div className="loan-summary-item">
              <span>
                Interest
              </span>

              <strong>
                ₹{interestAmount.toLocaleString(
                  "en-IN"
                )}
              </strong>
            </div>

            <div className="loan-summary-item">
              <span>
                Amount Given
              </span>

              <strong>
                ₹{amountGiven.toLocaleString(
                  "en-IN"
                )}
              </strong>
            </div>

            {loanType === "IO" && (
              <div className="loan-summary-item">
                <span>
                  Principal Pending
                </span>

                <strong>
                  ₹{principalPending.toLocaleString(
                    "en-IN"
                  )}
                </strong>
              </div>
            )}

            <div className="loan-summary-item">
              <span>
                {collectionLabel}
              </span>

              <strong className="loan-summary-highlight">
                ₹{collectionAmount.toLocaleString(
                  "en-IN",
                  {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  }
                )}
              </strong>
            </div>

          </div>
        </div>

        {/* =====================================================
            ACTIONS
        ===================================================== */}

        <div className="customer-actions">

          <button
            type="button"
            className="cancel-button"
            onClick={() =>
              navigate(-1)
            }
          >
            ← Back
          </button>

          <button
            type="button"
            className="primary save-customer-button"
            onClick={
              handleSaveLoan
            }
          >
            Save New Loan
          </button>

        </div>

      </section>

      {/* =====================================================
          SUCCESS POPUP
      ===================================================== */}

      {showSuccess && (
        <div className="loan-success-overlay">

          <div className="loan-success-modal">

            <div className="loan-success-icon-wrap">
              <div className="loan-success-icon">
                ✓
              </div>
            </div>

            <h2>
              Loan Created
            </h2>

            <p className="loan-success-message">
              New loan has been added successfully for{" "}
              <strong>
                {
                  customerRecord
                    .customer
                    .name
                }
              </strong>
              .
            </p>

            <div className="loan-success-details">

              <div className="loan-success-row">
                <span>
                  Loan ID
                </span>

                <strong>
                  {loanId}
                </strong>
              </div>

              <div className="loan-success-divider" />

              <div className="loan-success-row">
                <span>
                  Loan Type
                </span>

                <strong>
                  {loanType}
                </strong>
              </div>

              <div className="loan-success-divider" />

              <div className="loan-success-row">
                <span>
                  Amount Given
                </span>

                <strong>
                  ₹{amountGiven.toLocaleString(
                    "en-IN"
                  )}
                </strong>
              </div>

              <div className="loan-success-divider" />

              <div className="loan-success-row">
                <span>
                  {collectionLabel}
                </span>

                <strong>
                  ₹{collectionAmount.toLocaleString(
                    "en-IN",
                    {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    }
                  )}
                </strong>
              </div>

              {loanType === "IO" && (
                <>
                  <div className="loan-success-divider" />

                  <div className="loan-success-row">
                    <span>
                      Principal Pending
                    </span>

                    <strong>
                      ₹{principalPending.toLocaleString(
                        "en-IN"
                      )}
                    </strong>
                  </div>
                </>
              )}

            </div>

            <button
              type="button"
              className="primary loan-success-button"
              onClick={
                handleSuccessDone
              }
            >
              View Customer
            </button>

          </div>

        </div>
      )}

    </>
  );
}