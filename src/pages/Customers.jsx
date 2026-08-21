import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";

import {
  loadCustomers,
  recordLoanPayment,
} from "../utils/customerStorage";

import "../styles/Customers.css";


const SESSION_KEY = "fincapital_session";


/* =========================================================
   CURRENT USER / COLLECTOR
========================================================= */

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
      (session.role === "agent"
        ? "Agent"
        : "Owner")
    );
  } catch {
    return "Owner";
  }
}


/* =========================================================
   TODAY
========================================================= */

function getTodayLocalDate() {
  const today = new Date();

  const year = today.getFullYear();

  const month = String(
    today.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    today.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}


/* =========================================================
   MONEY
========================================================= */

function formatMoney(value) {
  return Number(value || 0).toLocaleString(
    "en-IN",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }
  );
}


/* =========================================================
   OUTSTANDING
========================================================= */

function getLoanOutstanding(loan) {
  if (!loan) {
    return 0;
  }

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

  const totalRepayment = Number(
    loan.totalRepayment ??
      loan.loanAmount ??
      0
  );

  const collectedAmount = Number(
    loan.collectedAmount || 0
  );

  return Math.max(
    0,
    totalRepayment - collectedAmount
  );
}


/* =========================================================
   CUSTOMERS
========================================================= */

export default function Customers() {
  const { cycle = "all" } = useParams();

  const navigate = useNavigate();


  /* =======================================================
     CUSTOMERS
  ======================================================= */

  const [
    customers,
    setCustomers,
  ] = useState([]);

  const [
    search,
    setSearch,
  ] = useState("");


  /* =======================================================
     PAYMENT
  ======================================================= */

  const [
    paymentCustomer,
    setPaymentCustomer,
  ] = useState(null);

  const [
    paymentLoan,
    setPaymentLoan,
  ] = useState(null);

  const [
    paymentTab,
    setPaymentTab,
  ] = useState("Due");

  const [
    paymentDate,
    setPaymentDate,
  ] = useState(
    getTodayLocalDate()
  );

  const [
    amountReceived,
    setAmountReceived,
  ] = useState("");

  const [
    fineAmount,
    setFineAmount,
  ] = useState("");

  const [
    collectedBy,
  ] = useState(
    getCurrentCollector
  );


  /* =======================================================
     LOAD CUSTOMERS
  ======================================================= */

  function refreshCustomers() {
    setCustomers(
      loadCustomers()
    );
  }


  useEffect(() => {
    refreshCustomers();
  }, []);


  /* =======================================================
     CUSTOMER LOAN ROWS
  ======================================================= */

  const rows = customers.flatMap(
    (item) =>
      (item.loans || []).map(
        (loan, index) => ({
          customerRecord: item,
          loan,
          loanSlot: index + 1,
        })
      )
  );


  /* =======================================================
     FILTER CYCLE
  ======================================================= */

  const filteredRows = rows.filter(
    ({
      customerRecord: item,
      loan,
    }) => {

      const cycleMatch =
        cycle.toLowerCase() === "all" ||
        loan.cycle?.toLowerCase() ===
          cycle.toLowerCase();

      if (!cycleMatch) {
        return false;
      }

      const query =
        search
          .trim()
          .toLowerCase();

      if (!query) {
        return true;
      }

      return (
        item.customer.name
          ?.toLowerCase()
          .includes(query) ||

        item.customer.customerId
          ?.toLowerCase()
          .includes(query) ||

        String(
          item.customer.mobile || ""
        )
          .toLowerCase()
          .includes(query) ||

        loan.loanId
          ?.toLowerCase()
          .includes(query)
      );
    }
  );

const cycleTitle =
    cycle.charAt(0).toUpperCase() +
    cycle.slice(1);


  /* =======================================================
     OPEN CUSTOMER
  ======================================================= */

  function openCustomer(
    customerId
  ) {
    navigate(
      `/customers/profile/${customerId}`
    );
  }


  /* =======================================================
     VIEW BUTTON
  ======================================================= */

  function handleView(
    event,
    customerId
  ) {
    event.stopPropagation();

    navigate(
      `/customers/profile/${customerId}`
    );
  }


  /* =======================================================
     OPEN PAYMENT
  ======================================================= */

  function openPayment(
    event,
    item,
    loan
  ) {
    event.stopPropagation();

    if (
      loan.status === "Closed" ||
      loan.status === "Preclosed"
    ) {
      return;
    }

    setPaymentCustomer({
      id:
        item.customer.customerId,

      name:
        item.customer.name,
    });

    setPaymentLoan(
      loan
    );

    setPaymentTab(
      "Due"
    );

    setPaymentDate(
      getTodayLocalDate()
    );

    setAmountReceived(
      String(
        Number(
          loan.collectionAmount || 0
        ) +
          Number(
            loan.pendingDue || 0
          )
      )
    );

    setFineAmount("");
  }


  /* =======================================================
     CLOSE PAYMENT
  ======================================================= */

  function closePayment() {
    setPaymentCustomer(
      null
    );

    setPaymentLoan(
      null
    );

    setPaymentTab(
      "Due"
    );

    setPaymentDate(
      getTodayLocalDate()
    );

    setAmountReceived("");

    setFineAmount("");
  }


  /* =======================================================
     SAVE DUE PAYMENT
  ======================================================= */

  function saveDuePayment() {
    if (
      !paymentCustomer ||
      !paymentLoan
    ) {
      return;
    }


    if (!paymentDate) {
      alert(
        "Please select payment date."
      );

      return;
    }


    if (
      paymentDate >
      getTodayLocalDate()
    ) {
      alert(
        "Future payment date is not allowed."
      );

      return;
    }


    const amount = Number(
      amountReceived || 0
    );


    if (amount <= 0) {
      alert(
        "Please enter amount received."
      );

      return;
    }


    const result =
      recordLoanPayment(
        paymentCustomer.id,

        paymentLoan.loanId,

        {
          paymentType: "Due",

          paymentDate,

          dueAmount:
            Number(
              paymentLoan.collectionAmount ||
                0
            ),

          amount,

          collectedBy,
        }
      );


    if (!result) {
      alert(
        "Unable to save payment."
      );

      return;
    }


    closePayment();

    refreshCustomers();

    alert(
      "Payment saved successfully."
    );
  }


  /* =======================================================
     SAVE FINE
  ======================================================= */

  function saveFinePayment() {
    if (
      !paymentCustomer ||
      !paymentLoan
    ) {
      return;
    }


    if (!paymentDate) {
      alert(
        "Please select payment date."
      );

      return;
    }


    if (
      paymentDate >
      getTodayLocalDate()
    ) {
      alert(
        "Future payment date is not allowed."
      );

      return;
    }


    const amount = Number(
      fineAmount || 0
    );


    if (amount <= 0) {
      alert(
        "Please enter fine amount."
      );

      return;
    }


    const result =
      recordLoanPayment(
        paymentCustomer.id,

        paymentLoan.loanId,

        {
          paymentType: "Fine",

          paymentDate,

          fineAmount:
            amount,

          collectedBy,
        }
      );


    if (!result) {
      alert(
        "Unable to save fine."
      );

      return;
    }


    closePayment();

    refreshCustomers();

    alert(
      "Fine saved successfully."
    );
  }


  /* =======================================================
     PAGE
  ======================================================= */

  return (
    <section className="panel customers-page">

      {/* ===================================================
          TITLE
      =================================================== */}

      <div className="title customer-list-title">

        <div>

          <h1>
            {cycleTitle} Customers
          </h1>

          <p className="muted">

            {filteredRows.length} loan

            {filteredRows.length !== 1
              ? "s"
              : ""}

          </p>

        </div>

        <div className="customer-search-box">

          <span className="customer-search-icon">
            ⌕
          </span>

          <input
            type="search"
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value
              )
            }
            placeholder="Search name, ID, mobile or loan ID"
          />

          {search && (

            <button
              type="button"
              aria-label="Clear search"
              onClick={() =>
                setSearch("")
              }
            >
              ×
            </button>

          )}

        </div>

      </div>


      {/* ===================================================
          EMPTY
      =================================================== */}

      {filteredRows.length === 0 ? (

        <div className="empty-customers">

          <h3>
            No customers found
          </h3>

          <p>
            Add a new customer and they will
            appear here.
          </p>

        </div>

      ) : (

        /* =================================================
           CUSTOMER LIST
        ================================================= */

        <div className="customer-list">

          {filteredRows.map(
            ({
              customerRecord: item,
              loan,
              loanSlot,
            }) => {

              const customerId =
                item.customer.customerId;

              const loanStatus =
                loan.status ||
                "Active";

              const isActive =
                loanStatus ===
                "Active";


              return (

                <div

                  className="
                    customer-list-card
                    clickable-customer-card
                  "

                  key={`${customerId}-${loan.loanId}`}

                  onClick={() =>
                    openCustomer(
                      customerId
                    )
                  }

                  role="button"

                  tabIndex={0}

                  onKeyDown={(event) => {

                    if (
                      event.key ===
                      "Enter"
                    ) {

                      openCustomer(
                        customerId
                      );

                    }

                  }}
                >


                  {/* =======================================
                      CUSTOMER
                  ======================================= */}

                  <div className="customer-list-main">

                    <div className="customer-list-photo">

                      <span>

                        {item.customer.name
                          ?.charAt(0)
                          .toUpperCase()}

                      </span>

                    </div>


                    <div className="customer-list-info">

                      <h3>
                        {item.customer.name}
                      </h3>

                      <p>
                        {customerId}
                      </p>

                      <p>
                        📱 {item.customer.mobile}
                      </p>


                      {item.loans.length >
                        1 && (

                        <p>

                          Loan Slot{" "}
                          {loanSlot} of{" "}
                          {item.loans.length}

                        </p>

                      )}

                    </div>

                  </div>


                  {/* =======================================
                      LOAN
                  ======================================= */}

                  <div className="customer-loan-info">


                    <div>

                      <span>
                        Loan ID
                      </span>

                      <b>
                        {loan.loanId}
                      </b>

                    </div>


                    <div>

                      <span>
                        Loan Amount
                      </span>

                      <b>

                        ₹
                        {Number(
                          loan.loanAmount
                        ).toLocaleString(
                          "en-IN"
                        )}

                      </b>

                    </div>


                    <div>

                      <span>
                        Cycle
                      </span>

                      <b>
                        {loan.cycle}
                      </b>

                    </div>


                    <div>

                      <span>
                        Type
                      </span>

                      <b>
                        {loan.loanType}
                      </b>

                    </div>


                    <div>

                      <span>
                        Collection
                      </span>

                      <b>

                        ₹
                        {formatMoney(
                          loan.collectionAmount
                        )}

                      </b>

                    </div>


                    <div>

                      <span>
                        Status
                      </span>

                      <b>
                        {loanStatus}
                      </b>

                    </div>


                    {/* =====================================
                        ACTION BUTTONS
                    ===================================== */}

                    <div
                      className="customer-card-actions"

                      onClick={(event) =>
                        event.stopPropagation()
                      }
                    >

                      {isActive && (

                        <button

                          type="button"

                          className="customer-pay-btn"

                          onClick={(event) =>
                            openPayment(
                              event,
                              item,
                              loan
                            )
                          }
                        >

                          Pay

                        </button>

                      )}


                      <button

                        type="button"

                        className="customer-view-btn"

                        onClick={(event) =>
                          handleView(
                            event,
                            customerId
                          )
                        }
                      >

                        View

                      </button>

                    </div>

                  </div>

                </div>

              );

            }
          )}

        </div>

      )}


      {/* ===================================================
          PAYMENT POPUP
      =================================================== */}

      {paymentLoan &&
        paymentCustomer && (

        <div

          className="customer-payment-backdrop"

          onClick={
            closePayment
          }
        >

          <div

            className="customer-payment-modal"

            onClick={(event) =>
              event.stopPropagation()
            }
          >


            {/* =============================================
                HEADER
            ============================================= */}

            <div className="customer-payment-header">

              <div>

                <h3>
                  Pay Now
                </h3>

                <p>

                  {paymentCustomer.name}

                  {" • "}

                  {paymentLoan.loanId}

                </p>

              </div>


              <button

                type="button"

                className="customer-payment-close"

                onClick={
                  closePayment
                }
              >

                ×

              </button>

            </div>


            {/* =============================================
                TABS
            ============================================= */}

            <div className="customer-payment-tabs">


              <button

                type="button"

                className={
                  paymentTab === "Due"
                    ? "active"
                    : ""
                }

                onClick={() =>
                  setPaymentTab(
                    "Due"
                  )
                }
              >

                Due

              </button>


              <button

                type="button"

                className={
                  paymentTab === "Fine"
                    ? "active"
                    : ""
                }

                onClick={() =>
                  setPaymentTab(
                    "Fine"
                  )
                }
              >

                Fine

              </button>

            </div>


            {/* =============================================
                BODY
            ============================================= */}

            <div className="customer-payment-body">


              <label className="customer-payment-field">

                <span>
                  Date *
                </span>

                <input

                  type="date"

                  value={
                    paymentDate
                  }

                  max={
                    getTodayLocalDate()
                  }

                  onChange={(event) =>
                    setPaymentDate(
                      event.target.value
                    )
                  }
                />

              </label>


              {/* ===========================================
                  DUE
              =========================================== */}

              {paymentTab ===
                "Due" && (

                <>

                  <div className="customer-payment-summary">


                    <div>

                      <span>
                        Due
                      </span>

                      <b>

                        ₹
                        {formatMoney(
                          paymentLoan
                            .collectionAmount
                        )}

                      </b>

                    </div>


                    <div>

                      <span>
                        Pending
                      </span>

                      <b>

                        ₹
                        {formatMoney(
                          paymentLoan
                            .pendingDue ||
                            0
                        )}

                      </b>

                    </div>


                    <div>

                      <span>
                        Outstanding
                      </span>

                      <b>

                        ₹
                        {formatMoney(
                          getLoanOutstanding(
                            paymentLoan
                          )
                        )}

                      </b>

                    </div>

                  </div>


                  <label className="customer-payment-field">

                    <span>
                      Amount Received *
                    </span>

                    <input

                      type="number"

                      min="0"

                      value={
                        amountReceived
                      }

                      onChange={(event) =>
                        setAmountReceived(
                          event.target.value
                        )
                      }
                    />

                  </label>


                  <button

                    type="button"

                    className="
                      customer-payment-confirm
                      primary
                    "

                    onClick={
                      saveDuePayment
                    }
                  >

                    Confirm Payment

                  </button>

                </>

              )}


              {/* ===========================================
                  FINE
              =========================================== */}

              {paymentTab ===
                "Fine" && (

                <>

                  <label className="customer-payment-field">

                    <span>
                      Fine Amount *
                    </span>

                    <input

                      type="number"

                      min="0"

                      placeholder="
                        Enter fine amount
                      "

                      value={
                        fineAmount
                      }

                      onChange={(event) =>
                        setFineAmount(
                          event.target.value
                        )
                      }
                    />

                  </label>


                  <button

                    type="button"

                    className="
                      customer-payment-confirm
                      primary
                    "

                    onClick={
                      saveFinePayment
                    }
                  >

                    Confirm Fine

                  </button>

                </>

              )}

            </div>

          </div>

        </div>

      )}

    </section>
  );
}