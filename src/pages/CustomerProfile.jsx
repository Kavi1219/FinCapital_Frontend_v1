import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
import {
  findCustomer,
  precloseLoan,
} from "../utils/customerStorage";
import { getPhoto } from "../utils/photoStorage";

function formatMoney(value) {
  return Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatDate(value) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("en-IN");
}

export default function CustomerProfile() {
  const { customerId } = useParams();
  const navigate = useNavigate();
  const [viewPhoto, setViewPhoto] = useState(null);

  const [record, setRecord] = useState(null);

  const [customerPhotoUrl, setCustomerPhotoUrl] =
    useState("");
  const [jaminPhotoUrl, setJaminPhotoUrl] =
    useState("");
  const [customerDocumentUrl, setCustomerDocumentUrl] =
    useState("");
  const [jaminDocumentUrl, setJaminDocumentUrl] =
    useState("");

  const reloadCustomer = () => {
    setRecord(findCustomer(customerId));
  };

  useEffect(() => {
    reloadCustomer();
  }, [customerId]);

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
          getPhoto(customerId, "customerPhoto"),
          getPhoto(customerId, "jaminPhoto"),
          getPhoto(customerId, "customerDocument"),
          getPhoto(customerId, "jaminDocument"),
        ]);

        if (!active) return;

        if (customerPhoto) {
          const url = URL.createObjectURL(customerPhoto);
          urls.push(url);
          setCustomerPhotoUrl(url);
        }

        if (jaminPhoto) {
          const url = URL.createObjectURL(jaminPhoto);
          urls.push(url);
          setJaminPhotoUrl(url);
        }

        if (customerDocument) {
          const url = URL.createObjectURL(customerDocument);
          urls.push(url);
          setCustomerDocumentUrl(url);
        }

        if (jaminDocument) {
          const url = URL.createObjectURL(jaminDocument);
          urls.push(url);
          setJaminDocumentUrl(url);
        }
      } catch (error) {
        console.error("LOAD PROFILE MEDIA ERROR:", error);
      }
    }

    loadMedia();

    return () => {
      active = false;
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [customerId]);

  const activeLoanCount = useMemo(
    () =>
      (record?.loans || []).filter(
        (loan) => loan.status === "Active"
      ).length,
    [record]
  );

  const handlePreclose = (loan) => {
    const loanAmount = Number(loan.loanAmount || 0);
    const collectedAmount = Number(
      loan.collectedAmount || 0
    );

    const amountToPreclose =
      loan.loanType === "IO"
        ? Number(
            loan.principalPending ?? loanAmount
          )
        : Math.max(
            0,
            loanAmount - collectedAmount
          );

    const confirmed = window.confirm(
      `Preclose this loan?\n\nLoan ID: ${loan.loanId}\nPreclose Amount: ₹${formatMoney(
        amountToPreclose
      )}`
    );

    if (!confirmed) return;

    const result = precloseLoan(
      customerId,
      loan.loanId
    );

    if (!result) {
      alert("Unable to preclose this loan.");
      return;
    }

    alert(
      `Loan preclosed successfully.\n\nAmount: ₹${formatMoney(
        result.precloseAmount
      )}`
    );

    reloadCustomer();
  };

  if (!record) {
    return (
      <section className="panel">
        <h1>Customer Not Found</h1>

        <button
          className="primary"
          onClick={() => navigate("/customers/all")}
        >
          Back to Customers
        </button>
      </section>
    );
  }

  const customer = record.customer || {};
  const jamin = record.jamin || {};
  const loans = record.loans || [];

  return (
    <section className="panel customer-profile">

      {/* PROFILE HEADER */}

      <div className="profile-top">

        <div className="profile-person">

          <div className="profile-photo-large">
            {customerPhotoUrl ? (
              <img
                src={customerPhotoUrl}
                alt={customer.name}
                className="clickable-profile-photo"
                onClick={() =>
                  setViewPhoto({
                    src: customerPhotoUrl,
                    title: `${customer.name} - Customer Photo`,
                  })
                }
              />
            ) : (
              <span>
                {customer.name
                  ?.charAt(0)
                  .toUpperCase() || "C"}
              </span>
            )}
          </div>

          <div>
            <h1>{customer.name}</h1>

            <p className="muted">
              {customer.customerId} • {customer.mobile}
            </p>

            <div className="profile-badges">
              <span className="status-badge active">
                {record.status || "Active"}
              </span>

              <span className="status-badge">
                {activeLoanCount} Active Loan
                {activeLoanCount !== 1 ? "s" : ""}
              </span>
            </div>
          </div>

        </div>

        <div className="profile-actions">

          <button
            className="cancel-button"
            onClick={() => navigate(-1)}
          >
            ← Back
          </button>

          <button
            className="primary"
            onClick={() =>
              navigate(
                `/customers/${customer.customerId}/add-loan`
              )
            }
          >
            + Add New Loan
          </button>

        </div>

      </div>


      {/* CUSTOMER DETAILS */}

      <div className="profile-section">

        <div className="form-section-title">
          Customer Information
        </div>

        <div className="profile-info-grid">

          <div>
            <span>Father's Name</span>
            <b>{customer.fatherName || "-"}</b>
          </div>

          <div>
            <span>Work</span>
            <b>{customer.work || "-"}</b>
          </div>

          <div>
            <span>Date</span>
            <b>{formatDate(customer.date)}</b>
          </div>

          <div>
            <span>Document Type</span>
            <b>{customer.documentType || "-"}</b>
          </div>

          <div className="profile-full">
            <span>Address</span>
            <b>{customer.address || "-"}</b>
          </div>

        </div>

        {customerDocumentUrl && (
          <button
            className="document-button"
            onClick={() =>
              window.open(
                customerDocumentUrl,
                "_blank"
              )
            }
          >
            View Customer Document
          </button>
        )}

      </div>


      {/* JAMIN DETAILS */}

      <div className="profile-section">

        <div className="form-section-title">
          Jamin Information
        </div>

        <div className="jamin-profile-layout">

          <div className="jamin-photo">
            {jaminPhotoUrl ? (
              <img
                src={jaminPhotoUrl}
                alt={jamin.name}
                className="clickable-profile-photo"
                onClick={() =>
                  setViewPhoto({
                    src: jaminPhotoUrl,
                    title: `${jamin.name} - Jamin Photo`,
                  })
                }
              />
            ) : (
              <span>
                {jamin.name
                  ?.charAt(0)
                  .toUpperCase() || "J"}
              </span>
            )}
          </div>

          <div className="profile-info-grid">

            <div>
              <span>Name</span>
              <b>{jamin.name || "-"}</b>
            </div>

            <div>
              <span>Mobile</span>
              <b>{jamin.mobile || "-"}</b>
            </div>

            <div>
              <span>Father's Name</span>
              <b>{jamin.fatherName || "-"}</b>
            </div>

            <div>
              <span>Work</span>
              <b>{jamin.work || "-"}</b>
            </div>

            <div>
              <span>Date</span>
              <b>{formatDate(jamin.date)}</b>
            </div>

            <div>
              <span>Document Type</span>
              <b>{jamin.documentType || "-"}</b>
            </div>

            <div className="profile-full">
              <span>Address</span>
              <b>{jamin.address || "-"}</b>
            </div>

          </div>

        </div>

        {jaminDocumentUrl && (
          <button
            className="document-button"
            onClick={() =>
              window.open(
                jaminDocumentUrl,
                "_blank"
              )
            }
          >
            View Jamin Document
          </button>
        )}

      </div>


      {/* LOAN SLOTS */}

      <div className="profile-section">

        <div className="profile-loan-heading">
          <div className="form-section-title">
            Loan Slots
          </div>

          <button
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

        {loans.length === 0 ? (
          <div className="empty-customers">
            <h3>No loans</h3>
          </div>
        ) : (
          <div className="loan-slot-list">

            {loans.map((loan, index) => {

              const loanAmount =
                Number(loan.loanAmount || 0);

              const collectedAmount =
                Number(loan.collectedAmount || 0);

              const outstanding =
                loan.loanType === "IO"
                  ? Number(
                      loan.principalPending ??
                        loanAmount
                    )
                  : Math.max(
                      0,
                      loanAmount -
                        collectedAmount
                    );

              return (
                <article
                  className="loan-slot-card"
                  key={loan.loanId}
                >

                  <div className="loan-slot-header">

                    <div>
                      <span className="loan-slot-number">
                        Loan Slot {index + 1}
                      </span>

                      <h3>{loan.loanId}</h3>
                    </div>

                    <span
                      className={`status-badge ${String(
                        loan.status || "Active"
                      ).toLowerCase()}`}
                    >
                      {loan.status || "Active"}
                    </span>

                  </div>

                  <div className="loan-slot-grid">

                    <div>
                      <span>Loan Amount</span>
                      <b>
                        ₹{formatMoney(
                          loan.loanAmount
                        )}
                      </b>
                    </div>

                    <div>
                      <span>Amount Given</span>
                      <b>
                        ₹{formatMoney(
                          loan.amountGiven
                        )}
                      </b>
                    </div>

                    <div>
                      <span>Cycle</span>
                      <b>{loan.cycle}</b>
                    </div>

                    <div>
                      <span>Loan Type</span>
                      <b>{loan.loanType}</b>
                    </div>

                    <div>
                      <span>Interest</span>
                      <b>
                        {loan.interestRate}% / ₹
                        {formatMoney(
                          loan.interestAmount
                        )}
                      </b>
                    </div>

                    <div>
                      <span>Collection</span>
                      <b>
                        ₹{formatMoney(
                          loan.collectionAmount
                        )}
                      </b>
                    </div>

                    <div>
                      <span>Duration</span>
                      <b>
                        {loan.duration}{" "}
                        {loan.durationUnit}
                      </b>
                    </div>

                    <div>
                      <span>Outstanding</span>
                      <b>
                        ₹{formatMoney(outstanding)}
                      </b>
                    </div>

                    {loan.status === "Preclosed" && (
                      <>
                        <div>
                          <span>
                            Preclose Amount
                          </span>
                          <b>
                            ₹{formatMoney(
                              loan.precloseAmount
                            )}
                          </b>
                        </div>

                        <div>
                          <span>
                            Preclosed Date
                          </span>
                          <b>
                            {formatDate(
                              loan.preclosedAt
                            )}
                          </b>
                        </div>
                      </>
                    )}

                  </div>

                  {loan.status === "Active" && (
                    <div className="loan-slot-actions">

                      <button
                        className="preclose-button"
                        onClick={() =>
                          handlePreclose(loan)
                        }
                      >
                        Preclose Loan
                      </button>

                    </div>
                  )}

                </article>
              );
            })}

          </div>
        )}

      </div>

      {/* PHOTO VIEWER */}
      {viewPhoto && (
        <div
          className="photo-viewer-backdrop"
          onClick={() => setViewPhoto(null)}
        >
          <div
            className="photo-viewer"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="photo-viewer-header">
              <h3>{viewPhoto.title}</h3>

              <button
                type="button"
                className="photo-viewer-close"
                onClick={() => setViewPhoto(null)}
              >
                ×
              </button>
            </div>

            <div className="photo-viewer-body">
              <img
                src={viewPhoto.src}
                alt={viewPhoto.title}
              />
            </div>
          </div>
        </div>
      )}

    </section>
  );
}