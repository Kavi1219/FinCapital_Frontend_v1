import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
import {
  findCustomer,
  precloseLoan,
  recordLoanPayment,
} from "../utils/customerStorage";
import { getPhoto } from "../utils/photoStorage";
import "../styles/CustomerProfile.css";


const SESSION_KEY = "fincapital_session";

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


function formatMoney(value) {
  return Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatDate(value) {
  if (!value) return "-";

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split("-");
    return `${day}/${month}/${year}`;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("en-IN");
}

function formatCreatedDate(value) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = String(date.getFullYear()).slice(-2);

  return `${day}-${month}-${year}`;
}

function getTodayLocalDate() {
  const today = new Date();

  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getPaymentDateTime(payment) {
  const value = payment?.paymentDate;

  if (/^\d{4}-\d{2}-\d{2}$/.test(value || "")) {
    const [year, month, day] = value
      .split("-")
      .map(Number);

    return new Date(
      year,
      month - 1,
      day,
      0,
      0,
      0,
      0
    ).getTime();
  }

  if (
    /^\d{1,2}\/\d{1,2}\/\d{4}$/.test(
      value || ""
    )
  ) {
    const [day, month, year] = value
      .split("/")
      .map(Number);

    return new Date(
      year,
      month - 1,
      day,
      0,
      0,
      0,
      0
    ).getTime();
  }

  const fallback = new Date(
    payment?.paidAt || 0
  ).getTime();

  return Number.isNaN(fallback)
    ? 0
    : fallback;
}

/* =========================================================
   LOAN OUTSTANDING
========================================================= */

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

  const repayableAmount = Number(
    loan.totalRepayment ??
      loan.loanAmount ??
      0
  );

  const collectedAmount = Number(
    loan.collectedAmount || 0
  );

  return Math.max(
    0,
    repayableAmount - collectedAmount
  );
}

/* =========================================================
   CYCLE DISPLAY

   Daily   -> Daily
   Weekly  -> Monday / Weekly
   Monthly -> 19th / Monthly
========================================================= */

function getLoanCycleDisplay(loan) {
  const cycle = loan?.cycle || "-";
  const loanDate = loan?.loanDate;

  if (!loanDate) {
    return cycle;
  }

  const date = new Date(
    `${loanDate}T00:00:00`
  );

  if (Number.isNaN(date.getTime())) {
    return cycle;
  }

  if (cycle === "Weekly") {
    const weekday =
      date.toLocaleDateString(
        "en-US",
        {
          weekday: "long",
        }
      );

    return `${weekday} / Weekly`;
  }

  if (cycle === "Monthly") {
    const day = date.getDate();

    const suffix =
      day % 10 === 1 && day !== 11
        ? "st"
        : day % 10 === 2 &&
          day !== 12
        ? "nd"
        : day % 10 === 3 &&
          day !== 13
        ? "rd"
        : "th";

    return `${day}${suffix} / Monthly`;
  }

  return "Daily";
}

/* =========================================================
   LOAN COUNTS
========================================================= */

function getLoanHistoryStats(loan) {
  const history =
    Array.isArray(
      loan?.paymentHistory
    )
      ? loan.paymentHistory
      : [];

  const duePayments =
    history.filter(
      (payment) =>
        payment.paymentType ===
        "Due"
    );

  const finePayments =
    history.filter(
      (payment) =>
        payment.paymentType ===
        "Fine"
    );

  const paidCount =
    duePayments.filter(
      (payment) =>
        Number(
          payment.amount || 0
        ) > 0
    ).length;

  /*
    Pending Count should represent the CURRENT pending amount,
    not the number of old payment-history rows that once had pending.
  */

  const currentPending =
    Number(
      loan?.pendingDue || 0
    );

  const currentDueAmount =
    Number(
      loan?.collectionAmount || 0
    );

  const pendingCount =
    currentPending > 0 &&
    currentDueAmount > 0
      ? Math.ceil(
          currentPending /
            currentDueAmount
        )
      : 0;

  /*
    For now a payment is counted as late
    when it had previous pending or creates pending.

    Later we can make this 100% date-based
    using scheduled due dates.
  */

  const latePaymentCount =
    duePayments.filter(
      (payment) =>
        Number(
          payment.previousPending ||
            0
        ) > 0 ||
        Number(
          payment.pendingAfter ||
            0
        ) > 0
    ).length;

  const finePaidCount =
    finePayments.filter(
      (payment) =>
        Number(
          payment.amount || 0
        ) > 0
    ).length;

  const totalFinePaid =
    finePayments.reduce(
      (sum, payment) =>
        sum +
        Number(
          payment.amount ??
            payment.fineAmount ??
            0
        ),
      0
    );

  const totalAmountReceived =
    history.reduce(
      (sum, payment) => {
        const type =
          payment.paymentType ||
          "Due";

        /*
          Loan Given / Borrow is outgoing.
          Do not count it as amount received.
        */

        if (
          type === "Loan Given"
        ) {
          return sum;
        }

        return (
          sum +
          Number(
            payment.amount ??
              payment.fineAmount ??
              payment.fineAdded ??
              0
          )
        );
      },
      0
    );

  const duration =
    Number(
      loan?.duration || 0
    );

  const outstandingCount =
    loan?.status === "Active"
      ? Math.max(
          0,
          duration - paidCount
        )
      : 0;

  return {
    paidCount,
    pendingCount,
    latePaymentCount,
    finePaidCount,
    totalFinePaid,
    totalAmountReceived,
    outstandingCount,
  };
}

/* =========================================================
   PAYMENT TYPE LABEL
========================================================= */

function getPaymentTypeLabel(
  paymentType
) {
  if (
    paymentType === "Loan Given"
  ) {
    return "Borrow";
  }

  if (
    paymentType === "Preclose"
  ) {
    return "Preclose";
  }

  if (
    paymentType === "Fine"
  ) {
    return "Fine";
  }

  return "Due";
}

/* =========================================================
   CUSTOMER PROFILE
========================================================= */

export default function CustomerProfile() {
  const { customerId } =
    useParams();

  const navigate =
    useNavigate();

  const [
    viewPhoto,
    setViewPhoto,
  ] = useState(null);

  /* PAYMENT */

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
    getTodayLocalDate
  );

  const [
    amountReceived,
    setAmountReceived,
  ] = useState("");

  const [
    fineAmount,
    setFineAmount,
  ] = useState("");

  const [collectedBy] = useState(getCurrentCollector);

  /* PRECLOSE */

  const [
    precloseLoanData,
    setPrecloseLoanData,
  ] = useState(null);

  /* CUSTOMER */

  const [
    record,
    setRecord,
  ] = useState(null);

  /* LOAN SLOT ACCORDION */

  const [
    expandedLoanSlots,
    setExpandedLoanSlots,
  ] = useState({});

  /* PHOTOS */

  const [
    customerPhotoUrl,
    setCustomerPhotoUrl,
  ] = useState("");

  const [
    jaminPhotoUrl,
    setJaminPhotoUrl,
  ] = useState("");

  const [
    customerDocumentUrl,
    setCustomerDocumentUrl,
  ] = useState("");

  const [
    jaminDocumentUrl,
    setJaminDocumentUrl,
  ] = useState("");

  /* =========================================================
     RELOAD CUSTOMER
  ========================================================= */

  const reloadCustomer = () => {
    setRecord(
      findCustomer(customerId)
    );
  };

  useEffect(() => {
    reloadCustomer();
  }, [customerId]);

  useEffect(() => {
    const loans =
      record?.loans || [];

    if (loans.length === 0) {
      return;
    }

    setExpandedLoanSlots(
      (current) => {
        const next = {
          ...current,
        };

        loans.forEach(
          (loan) => {
            if (
              Object.prototype.hasOwnProperty.call(
                next,
                loan.loanId
              )
            ) {
              return;
            }

            /*
              Active loan = open by default.
              Closed / Preclosed loan = collapsed by default.
            */
            next[loan.loanId] =
              loan.status ===
              "Active";
          }
        );

        return next;
      }
    );
  }, [record]);

  const toggleLoanSlot =
    (loanId) => {
      setExpandedLoanSlots(
        (current) => ({
          ...current,

          [loanId]:
            !current[loanId],
        })
      );
    };

  /* =========================================================
     LOAD PHOTOS
  ========================================================= */

  useEffect(() => {
    let active = true;

    const urls = [];

    async function loadMedia() {
      try {
        const [
          customerPhoto,
          jaminPhoto,
          customerDocument,
          jaminDocument,
        ] = await Promise.all([
          getPhoto(
            customerId,
            "customerPhoto"
          ),

          getPhoto(
            customerId,
            "jaminPhoto"
          ),

          getPhoto(
            customerId,
            "customerDocument"
          ),

          getPhoto(
            customerId,
            "jaminDocument"
          ),
        ]);

        if (!active) return;

        if (customerPhoto) {
          const url =
            URL.createObjectURL(
              customerPhoto
            );

          urls.push(url);

          setCustomerPhotoUrl(
            url
          );
        }

        if (jaminPhoto) {
          const url =
            URL.createObjectURL(
              jaminPhoto
            );

          urls.push(url);

          setJaminPhotoUrl(
            url
          );
        }

        if (customerDocument) {
          const url =
            URL.createObjectURL(
              customerDocument
            );

          urls.push(url);

          setCustomerDocumentUrl(
            url
          );
        }

        if (jaminDocument) {
          const url =
            URL.createObjectURL(
              jaminDocument
            );

          urls.push(url);

          setJaminDocumentUrl(
            url
          );
        }
      } catch (error) {
        console.error(
          "LOAD PROFILE MEDIA ERROR:",
          error
        );
      }
    }

    loadMedia();

    return () => {
      active = false;

      urls.forEach(
        (url) =>
          URL.revokeObjectURL(
            url
          )
      );
    };
  }, [customerId]);

  /* =========================================================
     HEADER COUNTS
  ========================================================= */

  const activeLoanCount =
    useMemo(
      () =>
        (
          record?.loans || []
        ).filter(
          (loan) =>
            loan.status ===
            "Active"
        ).length,
      [record]
    );

  const closedLoanCount =
    useMemo(
      () =>
        (
          record?.loans || []
        ).filter(
          (loan) =>
            loan.status ===
              "Closed" ||
            loan.status ===
              "Preclosed"
        ).length,
      [record]
    );

  const overallOutstanding =
    useMemo(
      () =>
        (
          record?.loans || []
        ).reduce(
          (sum, loan) =>
            sum +
            getLoanOutstanding(
              loan
            ),
          0
        ),
      [record]
    );

  const overallPending =
    useMemo(
      () =>
        (
          record?.loans || []
        ).reduce(
          (sum, loan) =>
            sum +
            Number(
              loan.pendingDue ||
                0
            ),
          0
        ),
      [record]
    );

  const customerStatus =
    activeLoanCount > 0
      ? "Active"
      : "Closed";

  /* =========================================================
     PRECLOSE
  ========================================================= */

  const handlePreclose = (
    loan
  ) => {
    const amountToPreclose =
      getLoanOutstanding(
        loan
      );

    setPrecloseLoanData({
      loan,
      amountToPreclose,
    });
  };

  const closePreclosePopup =
    () => {
      setPrecloseLoanData(
        null
      );
    };

  const confirmPrecloseLoan =
    () => {
      if (
        !precloseLoanData
      ) {
        return;
      }

      const result =
        precloseLoan(
          customerId,

          precloseLoanData
            .loan.loanId
        );

      if (!result) {
        alert(
          "Unable to preclose this loan."
        );

        return;
      }

      setPrecloseLoanData(
        null
      );

      reloadCustomer();
    };

  /* =========================================================
     OPEN PAYMENT
  ========================================================= */

  const openPayment = (
    loan
  ) => {
    setPaymentLoan(loan);

    setPaymentTab(
      "Due"
    );

    setPaymentDate(
      getTodayLocalDate()
    );

    setAmountReceived(
      String(
        Number(
          loan.collectionAmount ||
            0
        ) +
          Number(
            loan.pendingDue ||
              0
          )
      )
    );

    setFineAmount("");
  };

  const closePayment = () => {
    setPaymentLoan(null);

    setPaymentTab("Due");

    setPaymentDate(
      getTodayLocalDate()
    );

    setAmountReceived("");

    setFineAmount("");
  };
  /* =========================================================
     SAVE DUE
  ========================================================= */

  const handleSaveDuePayment =
    () => {
      if (!paymentLoan) {
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

      const due =
        Number(
          paymentLoan.collectionAmount ||
            0
        );

      const paid =
        Number(
          amountReceived ||
            0
        );

      if (paid <= 0) {
        alert(
          "Please enter amount received."
        );

        return;
      }

      const result =
        recordLoanPayment(
          customerId,

          paymentLoan.loanId,

          {
            paymentType:
              "Due",

            paymentDate,

            dueAmount:
              due,

            amount:
              paid,

            collectedBy,
          }
        );

      if (!result) {
        alert(
          "Unable to save due payment."
        );

        return;
      }

      closePayment();

      reloadCustomer();
    };

  /* =========================================================
     SAVE FINE
  ========================================================= */

  const handleSaveFinePayment =
    () => {
      if (!paymentLoan) {
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

      const amount =
        Number(
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
          customerId,

          paymentLoan.loanId,

          {
            paymentType:
              "Fine",

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

      reloadCustomer();
    };

  /* =========================================================
     CUSTOMER NOT FOUND
  ========================================================= */

  if (!record) {
    return (
      <section className="panel">

        <h1>
          Customer Not Found
        </h1>

        <button
          className="primary"

          onClick={() =>
            navigate(
              "/customers/all"
            )
          }
        >
          Back to Customers
        </button>

      </section>
    );
  }

  const customer =
    record.customer || {};

  const jamin =
    record.jamin || {};

  const loans =
    record.loans || [];

  /* =========================================================
     PAYMENT HISTORY
  ========================================================= */

  const paymentHistory =
    loans
      .flatMap(
        (loan) =>
          (
            loan.paymentHistory ||
            []
          ).map(
            (payment) => ({
              ...payment,

              loanId:
                loan.loanId,
            })
          )
      )
      .sort(
        (a, b) => {
          const dateDifference =
            getPaymentDateTime(
              b
            ) -
            getPaymentDateTime(
              a
            );

          if (
            dateDifference !== 0
          ) {
            return dateDifference;
          }

          const aSavedTime =
            new Date(
              a.paidAt || 0
            ).getTime();

          const bSavedTime =
            new Date(
              b.paidAt || 0
            ).getTime();

          return (
            bSavedTime -
            aSavedTime
          );
        }
      );

  return (
    <section className="panel customer-profile">

      {/* =====================================================
          CUSTOMER HEADER
      ===================================================== */}

      <div className="customer-profile-header-card">

        <div className="customer-profile-header-main">

          <div className="profile-photo-large">

            {customerPhotoUrl ? (
              <img
                src={
                  customerPhotoUrl
                }

                alt={
                  customer.name
                }

                className="clickable-profile-photo"

                onClick={() =>
                  setViewPhoto({
                    src:
                      customerPhotoUrl,

                    title:
                      `${customer.name} - Customer Photo`,
                  })
                }
              />
            ) : (
              <span>
                {customer.name
                  ?.charAt(0)
                  .toUpperCase() ||
                  "C"}
              </span>
            )}

          </div>

          <div className="customer-profile-header-info">

            <h1>
              {customer.name}
            </h1>

            <div className="customer-header-contact">

              <span>
                {
                  customer.customerId
                }
              </span>

              <span>
                •
              </span>

              <span>
                {
                  customer.mobile
                }
              </span>

            </div>

            <div className="profile-badges">

              <span
                className={`status-badge ${customerStatus.toLowerCase()}`}
              >
                {
                  customerStatus
                }
              </span>

              {activeLoanCount >
                0 && (
                <span className="status-badge active">
                  {
                    activeLoanCount
                  }{" "}
                  Active
                </span>
              )}

              {closedLoanCount >
                0 && (
                <span className="status-badge closed">
                  {
                    closedLoanCount
                  }{" "}
                  Closed
                </span>
              )}

            </div>

          </div>

        </div>

        <div className="customer-header-summary">

          <div className="customer-header-stat">

            <span>
              Overall Outstanding
            </span>

            <strong>
              ₹
              {formatMoney(
                overallOutstanding
              )}
            </strong>

          </div>

          <div className="customer-header-stat">

            <span>
              Overall Pending
            </span>

            <strong>
              ₹
              {formatMoney(
                overallPending
              )}
            </strong>

          </div>

        </div>

        <div className="customer-header-actions">

          <button
            type="button"

            className="primary"

            onClick={() =>
              navigate(
                `/customers/${customer.customerId}/add-loan`
              )
            }
          >
            + Add Loan
          </button>

        </div>

      </div>

      {/* =====================================================
          CUSTOMER INFORMATION
      ===================================================== */}

      <div className="profile-section">

        <div className="form-section-title">
          Customer Information
        </div>

        <div className="profile-info-grid">

          <div>
            <span>
              Account Created On
            </span>

            <b>
              {formatCreatedDate(
                record.createdAt
              )}
            </b>
          </div>

          <div>
            <span>
              Father's Name
            </span>

            <b>
              {
                customer.fatherName ||
                "-"
              }
            </b>
          </div>

          <div>
            <span>
              Work
            </span>

            <b>
              {
                customer.work ||
                "-"
              }
            </b>
          </div>

          <div>
            <span>
              Document
            </span>

            <b>
              {
                customer.documentType ||
                "-"
              }
            </b>
          </div>

          <div className="profile-full">

            <span>
              Address
            </span>

            <b>
              {
                customer.address ||
                "-"
              }
            </b>

          </div>

        </div>

        {customerDocumentUrl && (
          <button
            type="button"

            className="document-button"

            onClick={() =>
              window.open(
                customerDocumentUrl,
                "_blank"
              )
            }
          >
            View Document
          </button>
        )}

      </div>

      {/* =====================================================
          JAMIN INFORMATION
      ===================================================== */}

      <div className="profile-section">

        <div className="form-section-title">
          Jamin Information
        </div>

        <div className="jamin-profile-layout">

          <div className="jamin-photo">

            {jaminPhotoUrl ? (
              <img
                src={
                  jaminPhotoUrl
                }

                alt={
                  jamin.name
                }

                className="clickable-profile-photo"

                onClick={() =>
                  setViewPhoto({
                    src:
                      jaminPhotoUrl,

                    title:
                      `${jamin.name} - Jamin Photo`,
                  })
                }
              />
            ) : (
              <span>
                {jamin.name
                  ?.charAt(0)
                  .toUpperCase() ||
                  "J"}
              </span>
            )}

          </div>

          <div className="profile-info-grid">

            <div>
              <span>
                Name
              </span>

              <b>
                {
                  jamin.name ||
                  "-"
                }
              </b>
            </div>

            <div>
              <span>
                Father's Name
              </span>

              <b>
                {
                  jamin.fatherName ||
                  "-"
                }
              </b>
            </div>

            <div>
              <span>
                Mobile Number
              </span>

              <b>
                {
                  jamin.mobile ||
                  "-"
                }
              </b>
            </div>

            <div>
              <span>
                Work
              </span>

              <b>
                {
                  jamin.work ||
                  "-"
                }
              </b>
            </div>

            <div>
              <span>
                Document
              </span>

              <b>
                {
                  jamin.documentType ||
                  "-"
                }
              </b>
            </div>

            <div className="profile-full">

              <span>
                Address
              </span>

              <b>
                {
                  jamin.address ||
                  "-"
                }
              </b>

            </div>

          </div>

        </div>

        {jaminDocumentUrl && (
          <button
            type="button"

            className="document-button"

            onClick={() =>
              window.open(
                jaminDocumentUrl,
                "_blank"
              )
            }
          >
            View Document
          </button>
        )}

      </div>

      {/* =====================================================
          LOAN SLOTS
      ===================================================== */}

      <div className="profile-section">

        <div className="form-section-title">
          Loan Slots
        </div>

        {loans.length === 0 ? (
          <div className="empty-customers">

            <h3>
              No loans
            </h3>

          </div>
        ) : (
          <div className="loan-slot-list">

            {loans.map(
              (
                loan,
                index
              ) => {
                const outstanding =
                  getLoanOutstanding(
                    loan
                  );

                const pending =
                  Number(
                    loan.pendingDue ||
                      0
                  );

                const finePending =
                  Number(
                    loan.fineDue ||
                      0
                  );

                const finePaid =
                  Number(
                    loan.finePaidTotal ||
                      0
                  );

                const stats =
                  getLoanHistoryStats(
                    loan
                  );

                const isClosed =
                  loan.status ===
                    "Closed" ||
                  loan.status ===
                    "Preclosed";

                const closeType =
                  loan.status ===
                  "Preclosed"
                    ? "Preclose"
                    : "Due Closed";

                const isExpanded =
                  expandedLoanSlots[
                    loan.loanId
                  ] ??
                  (
                    loan.status ===
                    "Active"
                  );

                return (
                  <article
                    className={
                      "loan-slot-card " +
                      (
                        isExpanded
                          ? "loan-slot-expanded"
                          : "loan-slot-collapsed"
                      )
                    }

                    key={
                      loan.loanId
                    }
                  >

                    {/* LOAN HEADER / DROPDOWN */}

                    <div className="loan-slot-header loan-slot-accordion-header">

                      <div className="loan-slot-title-area">

                        <span className="loan-slot-number">
                          Loan Slot{" "}
                          {
                            index +
                            1
                          }
                        </span>

                        <h3>
                          {
                            loan.loanId
                          }
                        </h3>

                        <small className="loan-created-date">

                          Created:{" "}

                          {formatCreatedDate(
                            loan.createdAt
                          )}

                        </small>

                      </div>

                      <div className="loan-slot-header-controls">

                        <div className="loan-slot-collapsed-summary">

                          <span>
                            ₹
                            {formatMoney(
                              loan.loanAmount
                            )}
                          </span>

                          <small>
                            {loan.cycle || "-"}
                          </small>

                        </div>

                        <span
                          className={`status-badge ${String(
                            loan.status ||
                              "Active"
                          ).toLowerCase()}`}
                        >
                          {loan.status ||
                            "Active"}
                        </span>

                        <button
                          type="button"

                          className={
                            "loan-slot-toggle-button " +
                            (
                              isExpanded
                                ? "open"
                                : ""
                            )
                          }

                          aria-label={
                            isExpanded
                              ? `Collapse ${loan.loanId}`
                              : `Expand ${loan.loanId}`
                          }

                          aria-expanded={
                            isExpanded
                          }

                          onClick={() =>
                            toggleLoanSlot(
                              loan.loanId
                            )
                          }
                        >
                          ⌄
                        </button>

                      </div>

                    </div>

                    {isExpanded && (

                      <div className="loan-slot-expand-content">

                        {/* COUNTS */}

                        {(stats.outstandingCount >
                          0 ||
                          stats.paidCount >
                            0 ||
                          stats.pendingCount >
                            0 ||
                          stats.finePaidCount >
                            0) && (

                          <div className="loan-count-summary">

                            {stats.outstandingCount >
                              0 && (
                              <div>

                                <span>
                                  Outstanding Count
                                </span>

                                <strong>
                                  {
                                    stats.outstandingCount
                                  }
                                </strong>

                              </div>
                            )}

                            {stats.paidCount >
                              0 && (
                              <div>

                                <span>
                                  Paid Count
                                </span>

                                <strong>
                                  {
                                    stats.paidCount
                                  }
                                </strong>

                              </div>
                            )}

                            {stats.pendingCount >
                              0 && (
                              <div>

                                <span>
                                  Pending Count
                                </span>

                                <strong>
                                  {
                                    stats.pendingCount
                                  }
                                </strong>

                              </div>
                            )}

                            {stats.finePaidCount >
                              0 && (
                              <div>

                                <span>
                                  Fine Paid Count
                                </span>

                                <strong>
                                  {
                                    stats.finePaidCount
                                  }
                                </strong>

                              </div>
                            )}

                          </div>
                        )}

                        {/* LOAN DETAILS */}

                        <div className="loan-slot-grid">

                          <div>

                            <span>
                              Loan Amount
                            </span>

                            <b>
                              ₹
                              {formatMoney(
                                loan.loanAmount
                              )}
                            </b>

                          </div>

                          <div>

                            <span>
                              Cycle
                            </span>

                            <b>
                              {getLoanCycleDisplay(
                                loan
                              )}
                            </b>

                          </div>

                          <div>

                            <span>
                              Loan Type
                            </span>

                            <b>
                              {
                                loan.loanType ||
                                "-"
                              }
                            </b>

                          </div>

                          <div>

                            <span>
                              Interest Rate
                            </span>

                            <b>
                              {Number(
                                loan.interestRate ||
                                  0
                              )}
                              %
                            </b>

                          </div>

                          <div>

                            <span>
                              Duration
                            </span>

                            <b>
                              {
                                loan.duration ||
                                0
                              }{" "}
                              {
                                loan.durationUnit ||
                                ""
                              }
                            </b>

                          </div>

                          <div>

                            <span>
                              Due Amount
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
                              Outstanding
                            </span>

                            <b>
                              ₹
                              {formatMoney(
                                outstanding
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
                                pending
                              )}
                            </b>

                          </div>

                          <div>

                            <span>
                              Fine Pending
                            </span>

                            <b>
                              ₹
                              {formatMoney(
                                finePending
                              )}
                            </b>

                          </div>

                          <div>

                            <span>
                              Fine Paid
                            </span>

                            <b>
                              ₹
                              {formatMoney(
                                finePaid
                              )}
                            </b>

                          </div>

                        </div>

                        {/* CLOSED LOAN */}

                        {isClosed && (

                          <div className="closed-loan-summary">

                            <div>

                              <span>
                                Late Payment Count
                              </span>

                              <strong>
                                {
                                  stats.latePaymentCount
                                }
                              </strong>

                            </div>

                            <div>

                              <span>
                                Total Fine Paid
                              </span>

                              <strong>
                                ₹
                                {formatMoney(
                                  stats.totalFinePaid
                                )}
                              </strong>

                            </div>

                            <div>

                              <span>
                                Total Amount Received
                              </span>

                              <strong>
                                ₹
                                {formatMoney(
                                  stats.totalAmountReceived
                                )}
                              </strong>

                            </div>

                            <div>

                              <span>
                                Close Type
                              </span>

                              <strong>
                                {
                                  closeType
                                }
                              </strong>

                            </div>

                            <div>

                              <span>
                                Closed On
                              </span>

                              <strong>
                                {formatDate(
                                  loan.preclosedAt ||
                                    loan.closedAt
                                )}
                              </strong>

                            </div>

                          </div>
                        )}

                        {/* ACTIONS */}

                        {loan.status ===
                          "Active" && (

                          <div className="loan-slot-actions">

                            <button
                              type="button"

                              className="primary pay-now-button"

                              onClick={() =>
                                openPayment(
                                  loan
                                )
                              }
                            >
                              Pay
                            </button>

                            <button
                              type="button"

                              className="preclose-button"

                              onClick={() =>
                                handlePreclose(
                                  loan
                                )
                              }
                            >
                              Preclose
                            </button>

                          </div>
                        )}

                      </div>

                    )}

                  </article>
                );
              }
            )}

          </div>
        )}

      </div>


      {/* =====================================================
          PAYMENT HISTORY
      ===================================================== */}

      <div className="profile-section">

        <div className="form-section-title">
          Payment History
        </div>

        {paymentHistory.length ===
        0 ? (

          <div className="payment-history-empty">
            No payment history yet.
          </div>

        ) : (

          <div className="payment-history-wrap">

            <table className="payment-history-table">

              <thead>
                <tr>

                  <th>
                    Date
                  </th>

                  <th>
                    Loan ID
                  </th>

                  <th>
                    Type
                  </th>

                  <th>
                    Amount
                  </th>

                  <th>
                    Collected By
                  </th>

                </tr>
              </thead>

              <tbody>

                {paymentHistory.map(
                  (
                    payment
                  ) => {

                    const rawType =
                      payment.paymentType ||
                      "Due";

                    const type =
                      getPaymentTypeLabel(
                        rawType
                      );

                    const amount =
                      Number(
                        payment.amount ??
                          payment.fineAmount ??
                          payment.fineAdded ??
                          0
                      );

                    const isBorrow =
                      rawType ===
                      "Loan Given";

                    return (
                      <tr
                        key={`${payment.loanId}-${payment.id}`}

                        className={`payment-history-row ${rawType
                          .toLowerCase()
                          .replaceAll(
                            " ",
                            "-"
                          )}`}
                      >

                        <td>
                          {formatDate(
                            payment.paymentDate ||
                              payment.paidAt
                          )}
                        </td>

                        <td>

                          <b>
                            {
                              payment.loanId
                            }
                          </b>

                        </td>

                        <td>

                          <span
                            className={`payment-type-badge ${rawType
                              .toLowerCase()
                              .replaceAll(
                                " ",
                                "-"
                              )}`}
                          >
                            {
                              type
                            }
                          </span>

                        </td>

                        <td>

                          <b
                            className={
                              isBorrow
                                ? "cash-amount-outgoing"
                                : "cash-amount-incoming"
                            }
                          >

                            {isBorrow
                              ? "−"
                              : "+"}

                            ₹
                            {formatMoney(
                              amount
                            )}

                          </b>

                        </td>

                        <td>

                          {payment.collectedBy ||
                            (isBorrow
                              ? "Owner"
                              : "-")}

                        </td>

                      </tr>
                    );
                  }
                )}

              </tbody>

            </table>

          </div>
        )}

      </div>

      {/* =====================================================
          PRECLOSE POPUP
      ===================================================== */}

      {precloseLoanData && (

        <div
          className="preclose-modal-backdrop"

          onClick={
            closePreclosePopup
          }
        >

          <div
            className="preclose-modal"

            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <div className="preclose-modal-icon">
              !
            </div>

            <h2>
              Preclose Loan?
            </h2>

            <p className="preclose-modal-message">
              Please confirm that you want to close this loan early.
            </p>

            <div className="preclose-modal-details">

              <div>

                <span>
                  Loan ID
                </span>

                <strong>
                  {
                    precloseLoanData
                      .loan.loanId
                  }
                </strong>

              </div>

              <div>

                <span>
                  Preclose Amount
                </span>

                <strong>
                  ₹
                  {formatMoney(
                    precloseLoanData
                      .amountToPreclose
                  )}
                </strong>

              </div>

            </div>

            <div className="preclose-modal-actions">

              <button
                type="button"

                className="cancel-button"

                onClick={
                  closePreclosePopup
                }
              >
                Cancel
              </button>

              <button
                type="button"

                className="preclose-confirm-button"

                onClick={
                  confirmPrecloseLoan
                }
              >
                Confirm Preclose
              </button>

            </div>

          </div>

        </div>
      )}

      {/* =====================================================
          PAYMENT POPUP
      ===================================================== */}

      {paymentLoan && (

        <div
          className="payment-modal-backdrop"

          onClick={
            closePayment
          }
        >

          <div
            className="payment-modal"

            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <div className="payment-modal-header">

              <div>

                <h3>
                  Pay Now
                </h3>

                <p>
                  {customer.name}
                  {" • "}
                  {
                    paymentLoan.loanId
                  }
                </p>

              </div>

              <button
                type="button"

                className="photo-viewer-close"

                onClick={
                  closePayment
                }
              >
                ×
              </button>

            </div>

            <div className="payment-tabs">

              <button
                type="button"

                className={
                  paymentTab ===
                  "Due"
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
                  paymentTab ===
                  "Fine"
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

            <div className="payment-modal-body">

              <label className="payment-field">

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

                  onChange={(e) =>
                    setPaymentDate(
                      e.target.value
                    )
                  }
                />

              </label>

              

                




              {paymentTab ===
                "Due" && (
                <>

                  <div className="payment-summary-grid">

                    <div>

                      <span>
                        Due
                      </span>

                      <b>
                        ₹
                        {formatMoney(
                          paymentLoan.collectionAmount
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
                          paymentLoan.pendingDue ||
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

                  <label className="payment-field">

                    <span>
                      Amount Received *
                    </span>

                    <input
                      type="number"

                      min="0"

                      value={
                        amountReceived
                      }

                      onChange={(e) =>
                        setAmountReceived(
                          e.target.value
                        )
                      }
                    />

                  </label>

                  <button
                    type="button"

                    className="primary full"

                    onClick={
                      handleSaveDuePayment
                    }
                  >
                    Confirm Payment
                  </button>

                </>
              )}

              {paymentTab ===
                "Fine" && (
                <>

                  <label className="payment-field">

                    <span>
                      Fine Amount *
                    </span>

                    <input
                      type="number"

                      min="0"

                      placeholder="Enter fine amount"

                      value={
                        fineAmount
                      }

                      onChange={(e) =>
                        setFineAmount(
                          e.target.value
                        )
                      }
                    />

                  </label>

                  <button
                    type="button"

                    className="primary full"

                    onClick={
                      handleSaveFinePayment
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

      {/* =====================================================
          PHOTO VIEWER
      ===================================================== */}

      {viewPhoto && (

        <div
          className="photo-viewer-backdrop"

          onClick={() =>
            setViewPhoto(
              null
            )
          }
        >

          <div
            className="photo-viewer"

            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <div className="photo-viewer-header">

              <h3>
                {
                  viewPhoto.title
                }
              </h3>

              <button
                type="button"

                className="photo-viewer-close"

                onClick={() =>
                  setViewPhoto(
                    null
                  )
                }
              >
                ×
              </button>

            </div>

            <div className="photo-viewer-body">

              <img
                src={
                  viewPhoto.src
                }

                alt={
                  viewPhoto.title
                }
              />

            </div>

          </div>

        </div>
      )}

    </section>
  );
}