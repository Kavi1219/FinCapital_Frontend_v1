import { useMemo, useState } from "react";

import {
  getNextCustomerId,
  getNextLoanId,
  loadCustomers,
  saveCustomers,
} from "../utils/customerStorage";

import { savePhoto } from "../utils/photoStorage";

export default function AddCustomer() {
  const [step, setStep] = useState(1);
  const [customerId, setCustomerId] = useState(() =>
    getNextCustomerId(loadCustomers())
  );
  const [loanId, setLoanId] = useState(() =>
    getNextLoanId(loadCustomers())
  );

  // =========================================================
  // NEW CUSTOMER DETAILS
  // =========================================================

  const [customerName, setCustomerName] = useState("");
const [customerMobile, setCustomerMobile] = useState("");
const [customerFatherName, setCustomerFatherName] = useState("");
const [customerWork, setCustomerWork] = useState("");
const [customerDate, setCustomerDate] = useState("");
const [customerAddress, setCustomerAddress] = useState("");
const [customerDocumentType, setCustomerDocumentType] = useState("");

  const [customerPhoto, setCustomerPhoto] = useState(null);
  const [customerPhotoPreview, setCustomerPhotoPreview] = useState("");

  const [customerDocument, setCustomerDocument] = useState(null);
  const [customerDocumentPreview, setCustomerDocumentPreview] = useState("");

  // =========================================================
  // JAMIN DETAILS
  // =========================================================

  const [jaminName, setJaminName] = useState("");
const [jaminMobile, setJaminMobile] = useState("");
const [jaminFatherName, setJaminFatherName] = useState("");
const [jaminWork, setJaminWork] = useState("");
const [jaminDate, setJaminDate] = useState("");
const [jaminAddress, setJaminAddress] = useState("");
const [jaminDocumentType, setJaminDocumentType] = useState("");

  const [jaminPhoto, setJaminPhoto] = useState(null);
  const [jaminPhotoPreview, setJaminPhotoPreview] = useState("");

  const [jaminDocument, setJaminDocument] = useState(null);
  const [jaminDocumentPreview, setJaminDocumentPreview] = useState("");

  // =========================================================
  // LOAN DETAILS
  // =========================================================

  const [cycle, setCycle] = useState("Weekly");
  const [type, setType] = useState("EMI");

  const [amount, setAmount] = useState(10000);
  const [rate, setRate] = useState(2);

  // IO duration can be entered manually
  const [ioDuration, setIoDuration] = useState(10);

  // =========================================================
  // LOAN CALCULATIONS
  // =========================================================

  const interest = useMemo(() => {
    return (amount * rate) / 100;
  }, [amount, rate]);
  // Daily   = 100 days
  // Weekly  = 10 weeks
  // Monthly = 10 months
  const emiDuration = useMemo(() => {
    if (cycle === "Daily") return 100;
    if (cycle === "Weekly") return 10;
    if (cycle === "Monthly") return 10;

    return 10;
  }, [cycle]);

  const collection = useMemo(() => {
    if (type === "IO") {
      return interest;
    }

    return amount / emiDuration;
  }, [type, interest, amount, emiDuration]);

  const amountGiven = useMemo(() => {
    return amount - interest;
  }, [amount, interest]);

  const durationUnit =
    cycle === "Daily"
      ? "Days"
      : cycle === "Weekly"
      ? "Weeks"
      : "Months";

  // =========================================================
  // PHOTO / DOCUMENT PREVIEW
  // =========================================================

  const handleImage = (file, setFile, setPreview) => {
    if (!file) return;

    setFile(file);

    const reader = new FileReader();

    reader.onloadend = () => {
      setPreview(reader.result);
    };

    reader.readAsDataURL(file);
  };

  // =========================================================
  // CUSTOMER VALIDATION
  // =========================================================

  const goToJamin = () => {
    if (!customerName.trim()) {
      alert("Please enter customer name");
      return;
    }

    if (customerMobile.length !== 10) {
      alert("Please enter a valid 10 digit customer mobile number");
      return;
    }

    if (!customerFatherName.trim()) {
      alert("Please enter customer's father name");
      return;
    }

    if (!customerWork.trim()) {
      alert("Please enter customer work");
      return;
    }
    if (!customerDate) {
  alert("Please select customer date");
  return;
}

    if (!customerAddress.trim()) {
      alert("Please enter customer address");
      return;
    }

    if (!customerDocumentType) {
      alert("Please select customer document type");
      return;
    }

    setStep(2);
  };

  // =========================================================
  // JAMIN VALIDATION
  // =========================================================

  const goToLoan = () => {
    if (!jaminName.trim()) {
      alert("Please enter Jamin name");
      return;
    }

    if (jaminMobile.length !== 10) {
      alert("Please enter a valid 10 digit Jamin mobile number");
      return;
    }

    if (!jaminFatherName.trim()) {
      alert("Please enter Jamin's father name");
      return;
    }

    if (!jaminWork.trim()) {
      alert("Please enter Jamin work");
      return;
    }
    if (!jaminDate) {
  alert("Please select Jamin date");
  return;
}

    if (!jaminAddress.trim()) {
      alert("Please enter Jamin address");
      return;
    }

    if (!jaminDocumentType) {
      alert("Please select Jamin document type");
      return;
    }

    setStep(3);
  };

  // =========================================================
  // SAVE CUSTOMER
  // Frontend only for now
  // =========================================================

  const handleSave = async () => {
    if (!amount || amount <= 0) {
      alert("Please enter a valid loan amount");
      return;
    }

    if (rate < 0) {
      alert("Please enter a valid interest rate");
      return;
    }

    if (type === "IO" && (!ioDuration || ioDuration <= 0)) {
      alert("Please enter valid IO duration");
      return;
    }

    try {
      const existingCustomers = loadCustomers();

      const newLoan = {
        loanId,
        loanAmount: amount,
        cycle,
        loanType: type,
        interestRate: rate,
        interestAmount: interest,
        amountGiven,
        duration: type === "EMI" ? emiDuration : ioDuration,
        durationUnit,
        collectionAmount: collection,

        // Multi-loan / preclose fields
        status: "Active",
        collectedAmount: 0,
        principalPending: amount,
        preclosedAt: null,
        closedAt: null,
        createdAt: new Date().toISOString(),
      };

      const customerData = {
        customer: {
          customerId,
          name: customerName,
          mobile: customerMobile,
          fatherName: customerFatherName,
          work: customerWork,
          date: customerDate,
          address: customerAddress,
          documentType: customerDocumentType,

          // Keep only file names in localStorage.
          // Actual images will be stored separately when we add profile photo storage.
          documentPhotoName: customerDocument?.name || "",
          customerPhotoName: customerPhoto?.name || "",
        },

        jamin: {
          name: jaminName,
          mobile: jaminMobile,
          fatherName: jaminFatherName,
          work: jaminWork,
          date: jaminDate,
          address: jaminAddress,
          documentType: jaminDocumentType,
          documentPhotoName: jaminDocument?.name || "",
          jaminPhotoName: jaminPhoto?.name || "",
        },

        // IMPORTANT: one customer can now have many loans
        loans: [newLoan],

        status: "Active",
        createdAt: new Date().toISOString(),
      };

      const updatedCustomers = [...existingCustomers, customerData];
      saveCustomers(updatedCustomers);
      // =======================================
// SAVE CUSTOMER / JAMIN PHOTOS
// =======================================

await Promise.all([
  customerPhoto
    ? savePhoto(
        customerId,
        "customerPhoto",
        customerPhoto
      )
    : Promise.resolve(),

  customerDocument
    ? savePhoto(
        customerId,
        "customerDocument",
        customerDocument
      )
    : Promise.resolve(),

  jaminPhoto
    ? savePhoto(
        customerId,
        "jaminPhoto",
        jaminPhoto
      )
    : Promise.resolve(),

  jaminDocument
    ? savePhoto(
        customerId,
        "jaminDocument",
        jaminDocument
      )
    : Promise.resolve(),
]);

      console.log("CUSTOMER SAVED:", customerData);

      alert(
        `Customer saved successfully!\n\nCustomer ID: ${customerId}\nLoan ID: ${loanId}`
      );

      // Reset customer
      setCustomerName("");
      setCustomerMobile("");
      setCustomerFatherName("");
      setCustomerWork("");
      setCustomerDate("");
      setCustomerAddress("");
      setCustomerDocumentType("");
      setCustomerPhoto(null);
      setCustomerPhotoPreview("");
      setCustomerDocument(null);
      setCustomerDocumentPreview("");

      // Reset Jamin
      setJaminName("");
      setJaminMobile("");
      setJaminFatherName("");
      setJaminWork("");
      setJaminDate("");
      setJaminAddress("");
      setJaminDocumentType("");
      setJaminPhoto(null);
      setJaminPhotoPreview("");
      setJaminDocument(null);
      setJaminDocumentPreview("");

      // Reset loan
      setAmount(10000);
      setRate(2);
      setCycle("Weekly");
      setType("EMI");
      setIoDuration(10);

      // Generate IDs for the next new customer/loan
      setCustomerId(getNextCustomerId(updatedCustomers));
      setLoanId(getNextLoanId(updatedCustomers));

      setStep(1);
    } catch (error) {
      console.error("SAVE CUSTOMER ERROR:", error);
      alert("Unable to save customer. Check the browser console for the error.");
    }
  };

  return (
    <section className="panel add-customer-panel">

      {/* =====================================================
          PAGE HEADER
      ===================================================== */}

      <div className="add-customer-header">
        <h1>New Customer</h1>
        <p>Enter customer, Jamin and loan details</p>
      </div>

      {/* =====================================================
          STEP INDICATOR
      ===================================================== */}

      <div className="customer-steps">

        <div
          className={
            step >= 1
              ? "customer-step active"
              : "customer-step"
          }
        >
          <span>1</span>
          <b>New Customer</b>
        </div>

        <div className="step-line"></div>

        <div
          className={
            step >= 2
              ? "customer-step active"
              : "customer-step"
          }
        >
          <span>2</span>
          <b>Jamin Details</b>
        </div>

        <div className="step-line"></div>

        <div
          className={
            step >= 3
              ? "customer-step active"
              : "customer-step"
          }
        >
          <span>3</span>
          <b>Loan Details</b>
        </div>

      </div>

      {/* =====================================================
          STEP 1
          NEW CUSTOMER
      ===================================================== */}

      {step === 1 && (
        <>
          <div className="form-section-title">
            New Customer Details
          </div>

          <div className="customer-form">

            {/* NAME */}

            <div className="form-field">
              <label>Customer Name *</label>

              <input
                type="text"
                placeholder="Enter customer name"
                value={customerName}
                onChange={(e) =>
                  setCustomerName(e.target.value)
                }
              />
            </div>

            {/* CUSTOMER ID */}

            <div className="form-field">
              <label>Customer ID</label>

              <input
                value={customerId}
                readOnly
              />
            </div>

            {/* MOBILE */}

            <div className="form-field">
              <label>Mobile Number *</label>

              <input
                type="tel"
                placeholder="Enter 10 digit mobile number"
                maxLength="10"
                value={customerMobile}
                onChange={(e) => {
                  const value =
                    e.target.value.replace(/\D/g, "");

                  setCustomerMobile(value);
                }}
              />
            </div>

            {/* FATHER NAME */}

            <div className="form-field">
              <label>Father's Name *</label>

              <input
                type="text"
                placeholder="Enter father's name"
                value={customerFatherName}
                onChange={(e) =>
                  setCustomerFatherName(e.target.value)
                }
              />
            </div>

            {/* WORK */}

            <div className="form-field">
              <label>Work *</label>

              <input
                type="text"
                placeholder="Enter occupation / work"
                value={customerWork}
                onChange={(e) =>
                  setCustomerWork(e.target.value)
                }
              />
            </div>
            <div className="form-field">
  <label>Date *</label>

  <input
    type="date"
    value={customerDate}
    onChange={(e) =>
      setCustomerDate(e.target.value)
    }
  />
</div>

            {/* DOCUMENT TYPE */}

            <div className="form-field">
              <label>Document Type *</label>

              <select
                value={customerDocumentType}
                onChange={(e) =>
                  setCustomerDocumentType(e.target.value)
                }
              >
                <option value="">
                  Select document type
                </option>

                <option value="Aadhaar Card">
                  Aadhaar Card
                </option>

                <option value="PAN Card">
                  PAN Card
                </option>

                <option value="Voter ID">
                  Voter ID
                </option>

                <option value="Driving Licence">
                  Driving Licence
                </option>

                <option value="Ration Card">
                  Ration Card
                </option>

                <option value="Other">
                  Other
                </option>

              </select>
            </div>

            {/* ADDRESS */}

            <div className="form-field full-width-field">
              <label>Address *</label>

              <textarea
                placeholder="Enter full customer address"
                value={customerAddress}
                onChange={(e) =>
                  setCustomerAddress(e.target.value)
                }
              />
            </div>

            {/* CUSTOMER PHOTO */}

            <div className="form-field">

              <label>Customer Photo</label>

              <label className="photo-upload-box">

                {customerPhotoPreview ? (
                  <img
                    src={customerPhotoPreview}
                    alt="Customer"
                  />
                ) : (
                  <div className="upload-placeholder">

                    <strong>
                      + Upload Customer Photo
                    </strong>

                    <small>
                      JPG / PNG
                    </small>

                  </div>
                )}

                <input
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={(e) =>
                    handleImage(
                      e.target.files[0],
                      setCustomerPhoto,
                      setCustomerPhotoPreview
                    )
                  }
                />

              </label>

            </div>

            {/* DOCUMENT PHOTO */}

            <div className="form-field">

              <label>Document Photo</label>

              <label className="photo-upload-box">

                {customerDocumentPreview ? (
                  <img
                    src={customerDocumentPreview}
                    alt="Customer Document"
                  />
                ) : (
                  <div className="upload-placeholder">

                    <strong>
                      + Upload Document Photo
                    </strong>

                    <small>
                      {customerDocumentType ||
                        "Aadhaar / ID Document"}
                    </small>

                  </div>
                )}

                <input
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={(e) =>
                    handleImage(
                      e.target.files[0],
                      setCustomerDocument,
                      setCustomerDocumentPreview
                    )
                  }
                />

              </label>

            </div>

          </div>

          <div className="customer-actions">

            <button
              type="button"
              className="primary save-customer-button"
              onClick={goToJamin}
            >
              Next: Jamin Details →
            </button>

          </div>
        </>
      )}

      {/* =====================================================
          STEP 2
          JAMIN
      ===================================================== */}

      {step === 2 && (
        <>
          <div className="form-section-title">
            Jamin Details
          </div>

          <div className="customer-form">

            {/* JAMIN NAME */}

            <div className="form-field">
              <label>Jamin Name *</label>

              <input
                type="text"
                placeholder="Enter Jamin name"
                value={jaminName}
                onChange={(e) =>
                  setJaminName(e.target.value)
                }
              />
            </div>

            {/* MOBILE */}

            <div className="form-field">
              <label>Mobile Number *</label>

              <input
                type="tel"
                placeholder="Enter 10 digit mobile number"
                maxLength="10"
                value={jaminMobile}
                onChange={(e) => {
                  const value =
                    e.target.value.replace(/\D/g, "");

                  setJaminMobile(value);
                }}
              />
            </div>

            {/* FATHER NAME */}

            <div className="form-field">
              <label>Father's Name *</label>

              <input
                type="text"
                placeholder="Enter father's name"
                value={jaminFatherName}
                onChange={(e) =>
                  setJaminFatherName(e.target.value)
                }
              />
            </div>

            {/* WORK */}

            <div className="form-field">
              <label>Work *</label>

              <input
                type="text"
                placeholder="Enter occupation / work"
                value={jaminWork}
                onChange={(e) =>
                  setJaminWork(e.target.value)
                }
              />
            </div>
            <div className="form-field">
  <label>Date *</label>

  <input
    type="date"
    value={jaminDate}
    onChange={(e) =>
      setJaminDate(e.target.value)
    }
  />
</div>

            {/* DOCUMENT TYPE */}

            <div className="form-field">
              <label>Document Type *</label>

              <select
                value={jaminDocumentType}
                onChange={(e) =>
                  setJaminDocumentType(e.target.value)
                }
              >
                <option value="">
                  Select document type
                </option>

                <option value="Aadhaar Card">
                  Aadhaar Card
                </option>

                <option value="PAN Card">
                  PAN Card
                </option>

                <option value="Voter ID">
                  Voter ID
                </option>

                <option value="Driving Licence">
                  Driving Licence
                </option>

                <option value="Ration Card">
                  Ration Card
                </option>

                <option value="Other">
                  Other
                </option>

              </select>
            </div>

            {/* ADDRESS */}

            <div className="form-field full-width-field">
              <label>Address *</label>

              <textarea
                placeholder="Enter full Jamin address"
                value={jaminAddress}
                onChange={(e) =>
                  setJaminAddress(e.target.value)
                }
              />
            </div>

            {/* JAMIN PHOTO */}

            <div className="form-field">

              <label>Jamin Photo</label>

              <label className="photo-upload-box">

                {jaminPhotoPreview ? (
                  <img
                    src={jaminPhotoPreview}
                    alt="Jamin"
                  />
                ) : (
                  <div className="upload-placeholder">

                    <strong>
                      + Upload Jamin Photo
                    </strong>

                    <small>
                      JPG / PNG
                    </small>

                  </div>
                )}

                <input
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={(e) =>
                    handleImage(
                      e.target.files[0],
                      setJaminPhoto,
                      setJaminPhotoPreview
                    )
                  }
                />

              </label>

            </div>

            {/* JAMIN DOCUMENT */}

            <div className="form-field">

              <label>Document Photo</label>

              <label className="photo-upload-box">

                {jaminDocumentPreview ? (
                  <img
                    src={jaminDocumentPreview}
                    alt="Jamin Document"
                  />
                ) : (
                  <div className="upload-placeholder">

                    <strong>
                      + Upload Document Photo
                    </strong>

                    <small>
                      {jaminDocumentType ||
                        "Aadhaar / ID Document"}
                    </small>

                  </div>
                )}

                <input
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={(e) =>
                    handleImage(
                      e.target.files[0],
                      setJaminDocument,
                      setJaminDocumentPreview
                    )
                  }
                />

              </label>

            </div>

          </div>

          <div className="customer-actions">

            <button
              type="button"
              className="cancel-button"
              onClick={() => setStep(1)}
            >
              ← Back
            </button>

            <button
              type="button"
              className="primary save-customer-button"
              onClick={goToLoan}
            >
              Next: Loan Details →
            </button>

          </div>
        </>
      )}

      {/* =====================================================
          STEP 3
          LOAN DETAILS
      ===================================================== */}

      {step === 3 && (
        <>
          <div className="form-section-title">
            Loan Details
          </div>

          <div className="customer-form">

            {/* LOAN ID */}

            <div className="form-field">
              <label>Loan ID</label>

              <input
                value={loanId}
                readOnly
              />
            </div>

            {/* LOAN AMOUNT */}

            <div className="form-field">
              <label>Loan Amount *</label>

              <input
                type="number"
                min="1"
                value={amount}
                onChange={(e) =>
                  setAmount(Number(e.target.value))
                }
              />
            </div>

            {/* CYCLE */}

            <div className="form-field">
              <label>Collection Cycle *</label>

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
                      cycle === x ? "active" : ""
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

            {/* LOAN TYPE */}

            <div className="form-field">
              <label>Loan Type *</label>

              <div className="choices">

                {["EMI", "IO"].map((x) => (
                  <button
                    type="button"
                    key={x}
                    className={
                      type === x ? "active" : ""
                    }
                    onClick={() =>
                      setType(x)
                    }
                  >
                    {x}
                  </button>
                ))}

              </div>
            </div>

            {/* INTEREST RATE */}

            <div className="form-field">
              <label>Interest Rate % *</label>

              <input
                type="number"
                min="0"
                step="0.01"
                value={rate}
                onChange={(e) =>
                  setRate(Number(e.target.value))
                }
              />
            </div>

            {/* INTEREST AMOUNT */}

            <div className="form-field">
              <label>Interest Amount</label>

              <input
                value={
                  "₹" +
                  interest.toLocaleString(
                    "en-IN"
                  )
                }
                readOnly
              />
            </div>

            {/* AMOUNT GIVEN */}

            <div className="form-field">
              <label>Amount Given</label>

              <input
                value={
                  "₹" +
                  amountGiven.toLocaleString(
                    "en-IN"
                  )
                }
                readOnly
              />
            </div>

            {/* EMI DURATION */}

            {type === "EMI" && (
              <div className="form-field">

                <label>
                  Duration
                </label>

                <input
                  value={`${emiDuration} ${durationUnit}`}
                  readOnly
                />

              </div>
            )}

            {/* IO DURATION */}

            {type === "IO" && (
              <div className="form-field">

                <label>
                  IO Duration ({durationUnit}) *
                </label>

                <input
                  type="number"
                  min="1"
                  value={ioDuration}
                  onChange={(e) =>
                    setIoDuration(
                      Number(e.target.value)
                    )
                  }
                />

              </div>
            )}

            {/* COLLECTION AMOUNT */}

            <div className="form-field">
              <label>
                {type === "IO"
                  ? `Interest Collection / ${cycle}`
                  : `${cycle} Collection Amount`}
              </label>

              <input
                value={
                  "₹" +
                  collection.toLocaleString(
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

            {/* IO PRINCIPAL */}

            {type === "IO" && (
              <div className="form-field">

                <label>
                  Principal Amount Pending
                </label>

                <input
                  value={
                    "₹" +
                    amount.toLocaleString(
                      "en-IN"
                    )
                  }
                  readOnly
                />

              </div>
            )}

          </div>

          <div className="customer-actions">

            <button
              type="button"
              className="cancel-button"
              onClick={() => setStep(2)}
            >
              ← Back
            </button>

            <button
              type="button"
              className="primary save-customer-button"
              onClick={handleSave}
            >
              Save Customer
            </button>

          </div>

        </>
      )}

    </section>
  );
}