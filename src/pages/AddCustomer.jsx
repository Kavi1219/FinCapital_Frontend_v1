import { useRef, useState } from "react";
import { useNavigate } from "react-router";

import {
  getNextCustomerId,
  loadCustomers,
  saveCustomers,
} from "../utils/customerStorage";

import { savePhoto } from "../utils/photoStorage";

const DOCUMENT_TYPES = [
  "Aadhaar Card",
  "PAN Card",
  "Voter ID",
  "Driving Licence",
  "Ration Card",
  "Other",
];

function createDocumentItem() {
  return {
    id: `${Date.now()}-${Math.random()}`,
    type: "",
    file: null,
    preview: "",
  };
}

export default function AddCustomer() {
  const navigate = useNavigate();

  const [step, setStep] = useState(1);

  const [customerId] = useState(() =>
    getNextCustomerId(loadCustomers())
  );

  // =========================================================
  // OWN APP POPUPS
  // =========================================================

  const [messagePopup, setMessagePopup] = useState(null);

  const [showSuccess, setShowSuccess] = useState(false);
  const [savedCustomerId, setSavedCustomerId] = useState("");
  const [savedCustomerName, setSavedCustomerName] = useState("");

  const [uploadPicker, setUploadPicker] = useState(null);

  const showMessage = (
    title,
    message,
    type = "warning"
  ) => {
    setMessagePopup({
      title,
      message,
      type,
    });
  };

  const closeMessage = () => {
    setMessagePopup(null);
  };

  // =========================================================
  // CUSTOMER DETAILS
  // =========================================================

  const [customerName, setCustomerName] = useState("");
  const [customerMobile, setCustomerMobile] = useState("");
  const [customerFatherName, setCustomerFatherName] = useState("");
  const [customerWork, setCustomerWork] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");

  const [customerPhoto, setCustomerPhoto] = useState(null);
  const [customerPhotoPreview, setCustomerPhotoPreview] = useState("");

  const [customerDocuments, setCustomerDocuments] = useState([
    createDocumentItem(),
  ]);

  // =========================================================
  // JAMIN DETAILS
  // =========================================================

  const [jaminName, setJaminName] = useState("");
  const [jaminMobile, setJaminMobile] = useState("");
  const [jaminFatherName, setJaminFatherName] = useState("");
  const [jaminWork, setJaminWork] = useState("");
  const [jaminAddress, setJaminAddress] = useState("");

  const [jaminPhoto, setJaminPhoto] = useState(null);
  const [jaminPhotoPreview, setJaminPhotoPreview] = useState("");

  const [jaminDocuments, setJaminDocuments] = useState([
    createDocumentItem(),
  ]);

  // =========================================================
  // HIDDEN FILE INPUTS
  // =========================================================

  const customerPhotoCameraRef = useRef(null);
  const customerPhotoFilesRef = useRef(null);

  const jaminPhotoCameraRef = useRef(null);
  const jaminPhotoFilesRef = useRef(null);

  const customerDocumentCameraRef = useRef(null);
  const customerDocumentFilesRef = useRef(null);

  const jaminDocumentCameraRef = useRef(null);
  const jaminDocumentFilesRef = useRef(null);

  // =========================================================
  // FILE / IMAGE HELPERS
  // =========================================================

  const readPreview = (file, callback) => {
    if (!file) return;

    const reader = new FileReader();

    reader.onloadend = () => {
      callback(reader.result);
    };

    reader.readAsDataURL(file);
  };

  const handleCustomerPhoto = (file) => {
    if (!file) return;

    setCustomerPhoto(file);

    readPreview(
      file,
      setCustomerPhotoPreview
    );

    setUploadPicker(null);
  };

  const handleJaminPhoto = (file) => {
    if (!file) return;

    setJaminPhoto(file);

    readPreview(
      file,
      setJaminPhotoPreview
    );

    setUploadPicker(null);
  };

  const updateDocumentType = (
    owner,
    id,
    type
  ) => {
    const setter =
      owner === "customer"
        ? setCustomerDocuments
        : setJaminDocuments;

    setter((current) =>
      current.map((doc) =>
        doc.id === id
          ? {
              ...doc,
              type,
            }
          : doc
      )
    );
  };

  const updateDocumentFile = (
    owner,
    id,
    file
  ) => {
    if (!file) return;

    const setter =
      owner === "customer"
        ? setCustomerDocuments
        : setJaminDocuments;

    readPreview(file, (preview) => {
      setter((current) =>
        current.map((doc) =>
          doc.id === id
            ? {
                ...doc,
                file,
                preview,
              }
            : doc
        )
      );
    });

    setUploadPicker(null);
  };

  const addDocument = (owner) => {
    const setter =
      owner === "customer"
        ? setCustomerDocuments
        : setJaminDocuments;

    setter((current) => [
      ...current,
      createDocumentItem(),
    ]);
  };

  const removeDocument = (
    owner,
    id
  ) => {
    const setter =
      owner === "customer"
        ? setCustomerDocuments
        : setJaminDocuments;

    setter((current) => {
      if (current.length === 1) {
        return [
          createDocumentItem(),
        ];
      }

      return current.filter(
        (doc) => doc.id !== id
      );
    });
  };

  const openUploadPicker = (
    target,
    documentId = null
  ) => {
    setUploadPicker({
      target,
      documentId,
    });
  };

  const chooseCamera = () => {
    if (!uploadPicker) return;

    if (
      uploadPicker.target ===
      "customerPhoto"
    ) {
      customerPhotoCameraRef.current?.click();
      return;
    }

    if (
      uploadPicker.target ===
      "jaminPhoto"
    ) {
      jaminPhotoCameraRef.current?.click();
      return;
    }

    if (
      uploadPicker.target ===
      "customerDocument"
    ) {
      customerDocumentCameraRef.current?.click();
      return;
    }

    if (
      uploadPicker.target ===
      "jaminDocument"
    ) {
      jaminDocumentCameraRef.current?.click();
    }
  };

  const chooseFiles = () => {
    if (!uploadPicker) return;

    if (
      uploadPicker.target ===
      "customerPhoto"
    ) {
      customerPhotoFilesRef.current?.click();
      return;
    }

    if (
      uploadPicker.target ===
      "jaminPhoto"
    ) {
      jaminPhotoFilesRef.current?.click();
      return;
    }

    if (
      uploadPicker.target ===
      "customerDocument"
    ) {
      customerDocumentFilesRef.current?.click();
      return;
    }

    if (
      uploadPicker.target ===
      "jaminDocument"
    ) {
      jaminDocumentFilesRef.current?.click();
    }
  };

  // =========================================================
  // CUSTOMER VALIDATION
  // =========================================================

  const goToJamin = () => {
    if (!customerName.trim()) {
      showMessage(
        "Customer Name Required",
        "Please enter customer name."
      );
      return;
    }

    if (
      customerMobile.length !== 10
    ) {
      showMessage(
        "Invalid Mobile Number",
        "Please enter a valid 10 digit customer mobile number."
      );
      return;
    }

    if (
      !customerFatherName.trim()
    ) {
      showMessage(
        "Father's Name Required",
        "Please enter customer's father name."
      );
      return;
    }

    if (!customerWork.trim()) {
      showMessage(
        "Work Required",
        "Please enter customer work."
      );
      return;
    }

    if (
      !customerAddress.trim()
    ) {
      showMessage(
        "Address Required",
        "Please enter customer address."
      );
      return;
    }

    const incompleteDocument =
      customerDocuments.find(
        (doc) =>
          (doc.type && !doc.file) ||
          (!doc.type && doc.file)
      );

    if (incompleteDocument) {
      showMessage(
        "Complete Customer Document",
        "Please select both document type and document photo."
      );
      return;
    }

    setStep(2);
  };

  // =========================================================
  // SAVE CUSTOMER ONLY
  // =========================================================

  const handleSaveCustomer = async () => {
    if (!jaminName.trim()) {
      showMessage(
        "Jamin Name Required",
        "Please enter Jamin name."
      );
      return;
    }

    if (
      jaminMobile.length !== 10
    ) {
      showMessage(
        "Invalid Mobile Number",
        "Please enter a valid 10 digit Jamin mobile number."
      );
      return;
    }

    if (
      !jaminFatherName.trim()
    ) {
      showMessage(
        "Father's Name Required",
        "Please enter Jamin's father name."
      );
      return;
    }

    if (!jaminWork.trim()) {
      showMessage(
        "Work Required",
        "Please enter Jamin work."
      );
      return;
    }

    if (!jaminAddress.trim()) {
      showMessage(
        "Address Required",
        "Please enter Jamin address."
      );
      return;
    }

    const incompleteDocument =
      jaminDocuments.find(
        (doc) =>
          (doc.type && !doc.file) ||
          (!doc.type && doc.file)
      );

    if (incompleteDocument) {
      showMessage(
        "Complete Jamin Document",
        "Please select both document type and document photo."
      );
      return;
    }

    try {
      const existingCustomers =
        loadCustomers();

      const validCustomerDocuments =
        customerDocuments.filter(
          (doc) =>
            doc.type &&
            doc.file
        );

      const validJaminDocuments =
        jaminDocuments.filter(
          (doc) =>
            doc.type &&
            doc.file
        );

      const customerData = {
        customer: {
          customerId,
          name: customerName,
          mobile: customerMobile,
          fatherName:
            customerFatherName,
          work: customerWork,
          address:
            customerAddress,

          customerPhotoName:
            customerPhoto?.name ||
            "",

          // Keep old fields for compatibility
          documentType:
            validCustomerDocuments[0]
              ?.type || "",

          documentPhotoName:
            validCustomerDocuments[0]
              ?.file?.name || "",

          // New multiple documents
          documents:
            validCustomerDocuments.map(
              (doc, index) => ({
                id:
                  `customer-document-${index + 1}`,
                type: doc.type,
                fileName:
                  doc.file.name,
                storageKey:
                  index === 0
                    ? "customerDocument"
                    : `customerDocument_${index}`,
              })
            ),
        },

        jamin: {
          name: jaminName,
          mobile: jaminMobile,
          fatherName:
            jaminFatherName,
          work: jaminWork,
          address:
            jaminAddress,

          jaminPhotoName:
            jaminPhoto?.name ||
            "",

          // Keep old fields for compatibility
          documentType:
            validJaminDocuments[0]
              ?.type || "",

          documentPhotoName:
            validJaminDocuments[0]
              ?.file?.name || "",

          // New multiple documents
          documents:
            validJaminDocuments.map(
              (doc, index) => ({
                id:
                  `jamin-document-${index + 1}`,
                type: doc.type,
                fileName:
                  doc.file.name,
                storageKey:
                  index === 0
                    ? "jaminDocument"
                    : `jaminDocument_${index}`,
              })
            ),
        },

        loans: [],

        status: "Active",

        createdAt:
          new Date().toISOString(),
      };

      const updatedCustomers = [
        ...existingCustomers,
        customerData,
      ];

      saveCustomers(
        updatedCustomers
      );

      const photoSaveTasks = [];

      if (customerPhoto) {
        photoSaveTasks.push(
          savePhoto(
            customerId,
            "customerPhoto",
            customerPhoto
          )
        );
      }

      if (jaminPhoto) {
        photoSaveTasks.push(
          savePhoto(
            customerId,
            "jaminPhoto",
            jaminPhoto
          )
        );
      }

      validCustomerDocuments.forEach(
        (doc, index) => {
          photoSaveTasks.push(
            savePhoto(
              customerId,
              index === 0
                ? "customerDocument"
                : `customerDocument_${index}`,
              doc.file
            )
          );
        }
      );

      validJaminDocuments.forEach(
        (doc, index) => {
          photoSaveTasks.push(
            savePhoto(
              customerId,
              index === 0
                ? "jaminDocument"
                : `jaminDocument_${index}`,
              doc.file
            )
          );
        }
      );

      await Promise.all(
        photoSaveTasks
      );

      setSavedCustomerId(
        customerId
      );

      setSavedCustomerName(
        customerName
      );

      setShowSuccess(true);
    } catch (error) {
      console.error(
        "SAVE CUSTOMER ERROR:",
        error
      );

      showMessage(
        "Unable to Save Customer",
        "Something went wrong while saving the customer. Please try again.",
        "error"
      );
    }
  };

  // =========================================================
  // AFTER SUCCESS
  // =========================================================

  const goToCustomerProfile =
    () => {
      setShowSuccess(false);

      navigate(
        `/customers/profile/${savedCustomerId}`
      );
    };

  const goToAddLoan = () => {
    setShowSuccess(false);

    navigate(
      `/customers/${savedCustomerId}/add-loan`
    );
  };

  // =========================================================
  // DOCUMENT UI
  // =========================================================

  const renderDocuments = (
    owner,
    documents
  ) => (
    <div className="multi-document-section">

      <div className="multi-document-heading">
        <div>
          <h3>Documents</h3>
          <p>
            Add one or more customer documents.
          </p>
        </div>

        <button
          type="button"
          className="add-document-button"
          onClick={() =>
            addDocument(owner)
          }
        >
          + Document
        </button>
      </div>

      <div className="document-list">
        {documents.map(
          (doc, index) => (
            <div
              className="document-entry-card"
              key={doc.id}
            >
              <div className="document-entry-header">
                <strong>
                  Document {index + 1}
                </strong>

                <button
                  type="button"
                  className="remove-document-button"
                  onClick={() =>
                    removeDocument(
                      owner,
                      doc.id
                    )
                  }
                >
                  ×
                </button>
              </div>

              <div className="document-entry-grid">

                <div className="form-field">
                  <label>
                    Document Type
                  </label>

                  <select
                    value={doc.type}
                    onChange={(e) =>
                      updateDocumentType(
                        owner,
                        doc.id,
                        e.target.value
                      )
                    }
                  >
                    <option value="">
                      Select document type
                    </option>

                    {DOCUMENT_TYPES.map(
                      (type) => (
                        <option
                          value={type}
                          key={type}
                        >
                          {type}
                        </option>
                      )
                    )}
                  </select>
                </div>

                <div className="form-field">
                  <label>
                    Document Photo
                  </label>

                  <button
                    type="button"
                    className="document-upload-button"
                    onClick={() =>
                      openUploadPicker(
                        owner === "customer"
                          ? "customerDocument"
                          : "jaminDocument",
                        doc.id
                      )
                    }
                  >
                    {doc.preview
                      ? "Change Document"
                      : "+ Document"}
                  </button>

                  {doc.preview && (
                    <div className="document-preview-small">
                      <img
                        src={doc.preview}
                        alt={`${owner} document`}
                      />

                      <span>
                        {doc.file?.name}
                      </span>
                    </div>
                  )}
                </div>

              </div>
            </div>
          )
        )}
      </div>

    </div>
  );

  return (
    <>
      <section className="panel add-customer-panel">

        <div className="add-customer-header">
          <h1>New Customer</h1>

          <p>
            Create customer profile first. Loan can be added after customer creation.
          </p>
        </div>

        <div className="customer-steps">

          <div
            className={
              step >= 1
                ? "customer-step active"
                : "customer-step"
            }
          >
            <span>1</span>
            <b>Customer Details</b>
          </div>

          <div className="step-line" />

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

        </div>

        {/* =====================================================
            STEP 1 - CUSTOMER
        ===================================================== */}

        {step === 1 && (
          <>
            <div className="form-section-title">
              Customer Details
            </div>

            <div className="customer-form">

              <div className="form-field">
                <label>
                  Customer Name *
                </label>

                <input
                  type="text"
                  placeholder="Enter customer name"
                  value={customerName}
                  onChange={(e) =>
                    setCustomerName(
                      e.target.value
                    )
                  }
                />
              </div>

              <div className="form-field">
                <label>
                  Customer ID
                </label>

                <input
                  value={customerId}
                  readOnly
                />
              </div>

              <div className="form-field">
                <label>
                  Mobile Number *
                </label>

                <input
                  type="tel"
                  placeholder="Enter 10 digit mobile number"
                  maxLength="10"
                  value={customerMobile}
                  onChange={(e) =>
                    setCustomerMobile(
                      e.target.value.replace(
                        /\D/g,
                        ""
                      )
                    )
                  }
                />
              </div>

              <div className="form-field">
                <label>
                  Father's Name *
                </label>

                <input
                  type="text"
                  placeholder="Enter father's name"
                  value={customerFatherName}
                  onChange={(e) =>
                    setCustomerFatherName(
                      e.target.value
                    )
                  }
                />
              </div>

              <div className="form-field">
                <label>
                  Work *
                </label>

                <input
                  type="text"
                  placeholder="Enter occupation / work"
                  value={customerWork}
                  onChange={(e) =>
                    setCustomerWork(
                      e.target.value
                    )
                  }
                />
              </div>

              <div className="form-field full-width-field">
                <label>
                  Address *
                </label>

                <textarea
                  placeholder="Enter full customer address"
                  value={customerAddress}
                  onChange={(e) =>
                    setCustomerAddress(
                      e.target.value
                    )
                  }
                />
              </div>

              <div className="form-field full-width-field">
                <label>
                  Customer Photo
                </label>

                <button
                  type="button"
                  className="single-photo-upload"
                  onClick={() =>
                    openUploadPicker(
                      "customerPhoto"
                    )
                  }
                >
                  {customerPhotoPreview ? (
                    <img
                      src={customerPhotoPreview}
                      alt="Customer"
                    />
                  ) : (
                    <div className="upload-placeholder">
                      <strong>
                        + Customer Photo
                      </strong>

                      <small>
                        Camera or Files
                      </small>
                    </div>
                  )}
                </button>
              </div>

            </div>

            {renderDocuments(
              "customer",
              customerDocuments
            )}

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
            STEP 2 - JAMIN
        ===================================================== */}

        {step === 2 && (
          <>
            <div className="form-section-title">
              Jamin Details
            </div>

            <div className="customer-form">

              <div className="form-field">
                <label>
                  Jamin Name *
                </label>

                <input
                  type="text"
                  placeholder="Enter Jamin name"
                  value={jaminName}
                  onChange={(e) =>
                    setJaminName(
                      e.target.value
                    )
                  }
                />
              </div>

              <div className="form-field">
                <label>
                  Mobile Number *
                </label>

                <input
                  type="tel"
                  placeholder="Enter 10 digit mobile number"
                  maxLength="10"
                  value={jaminMobile}
                  onChange={(e) =>
                    setJaminMobile(
                      e.target.value.replace(
                        /\D/g,
                        ""
                      )
                    )
                  }
                />
              </div>

              <div className="form-field">
                <label>
                  Father's Name *
                </label>

                <input
                  type="text"
                  placeholder="Enter father's name"
                  value={jaminFatherName}
                  onChange={(e) =>
                    setJaminFatherName(
                      e.target.value
                    )
                  }
                />
              </div>

              <div className="form-field">
                <label>
                  Work *
                </label>

                <input
                  type="text"
                  placeholder="Enter occupation / work"
                  value={jaminWork}
                  onChange={(e) =>
                    setJaminWork(
                      e.target.value
                    )
                  }
                />
              </div>

              <div className="form-field full-width-field">
                <label>
                  Address *
                </label>

                <textarea
                  placeholder="Enter full Jamin address"
                  value={jaminAddress}
                  onChange={(e) =>
                    setJaminAddress(
                      e.target.value
                    )
                  }
                />
              </div>

              <div className="form-field full-width-field">
                <label>
                  Jamin Photo
                </label>

                <button
                  type="button"
                  className="single-photo-upload"
                  onClick={() =>
                    openUploadPicker(
                      "jaminPhoto"
                    )
                  }
                >
                  {jaminPhotoPreview ? (
                    <img
                      src={jaminPhotoPreview}
                      alt="Jamin"
                    />
                  ) : (
                    <div className="upload-placeholder">
                      <strong>
                        + Jamin Photo
                      </strong>

                      <small>
                        Camera or Files
                      </small>
                    </div>
                  )}
                </button>
              </div>

            </div>

            {renderDocuments(
              "jamin",
              jaminDocuments
            )}

            <div className="customer-actions">

              <button
                type="button"
                className="cancel-button"
                onClick={() =>
                  setStep(1)
                }
              >
                ← Back
              </button>

              <button
                type="button"
                className="primary save-customer-button"
                onClick={
                  handleSaveCustomer
                }
              >
                Create Customer Profile
              </button>

            </div>
          </>
        )}

      </section>

      {/* =====================================================
          HIDDEN INPUTS
      ===================================================== */}

      <input
        ref={customerPhotoCameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        hidden
        onChange={(e) =>
          handleCustomerPhoto(
            e.target.files?.[0]
          )
        }
      />

      <input
        ref={customerPhotoFilesRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) =>
          handleCustomerPhoto(
            e.target.files?.[0]
          )
        }
      />

      <input
        ref={jaminPhotoCameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        hidden
        onChange={(e) =>
          handleJaminPhoto(
            e.target.files?.[0]
          )
        }
      />

      <input
        ref={jaminPhotoFilesRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) =>
          handleJaminPhoto(
            e.target.files?.[0]
          )
        }
      />

      <input
        ref={customerDocumentCameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        hidden
        onChange={(e) =>
          updateDocumentFile(
            "customer",
            uploadPicker?.documentId,
            e.target.files?.[0]
          )
        }
      />

      <input
        ref={customerDocumentFilesRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) =>
          updateDocumentFile(
            "customer",
            uploadPicker?.documentId,
            e.target.files?.[0]
          )
        }
      />

      <input
        ref={jaminDocumentCameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        hidden
        onChange={(e) =>
          updateDocumentFile(
            "jamin",
            uploadPicker?.documentId,
            e.target.files?.[0]
          )
        }
      />

      <input
        ref={jaminDocumentFilesRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) =>
          updateDocumentFile(
            "jamin",
            uploadPicker?.documentId,
            e.target.files?.[0]
          )
        }
      />

      {/* =====================================================
          CAMERA / FILE PICKER POPUP
      ===================================================== */}

      {uploadPicker && (
        <div
          className="app-modal-backdrop"
          onClick={() =>
            setUploadPicker(null)
          }
        >
          <div
            className="app-modal upload-source-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >
            <div className="app-modal-icon blue">
              +
            </div>

            <h2>
              Choose Upload Method
            </h2>

            <p>
              Take a new photo or choose an existing image from your device.
            </p>

            <div className="upload-source-actions">

              <button
                type="button"
                className="upload-source-button"
                onClick={chooseCamera}
              >
                <span className="upload-source-symbol">
                  📷
                </span>

                <strong>
                  Camera
                </strong>

                <small>
                  Take a new photo
                </small>
              </button>

              <button
                type="button"
                className="upload-source-button"
                onClick={chooseFiles}
              >
                <span className="upload-source-symbol">
                  📁
                </span>

                <strong>
                  Files
                </strong>

                <small>
                  Choose from device
                </small>
              </button>

            </div>

            <button
              type="button"
              className="cancel-button app-modal-cancel"
              onClick={() =>
                setUploadPicker(null)
              }
            >
              Cancel
            </button>

          </div>
        </div>
      )}

      {/* =====================================================
          VALIDATION / ERROR POPUP
      ===================================================== */}

      {messagePopup && (
        <div
          className="app-modal-backdrop"
          onClick={closeMessage}
        >
          <div
            className="app-modal message-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >
            <div
              className={`app-modal-icon ${messagePopup.type}`}
            >
              {messagePopup.type === "error"
                ? "×"
                : "!"}
            </div>

            <h2>
              {messagePopup.title}
            </h2>

            <p>
              {messagePopup.message}
            </p>

            <button
              type="button"
              className="primary app-modal-full-button"
              onClick={closeMessage}
            >
              OK
            </button>

          </div>
        </div>
      )}

      {/* =====================================================
          SUCCESS POPUP
      ===================================================== */}

      {showSuccess && (
        <div className="app-modal-backdrop">

          <div className="app-modal customer-success-modal">

            <div className="app-modal-icon success">
              ✓
            </div>

            <h2>
              Customer Profile Created
            </h2>

            <p>
              {savedCustomerName} has been added successfully.
            </p>

            <div className="customer-success-details">
              <span>
                Customer ID
              </span>

              <strong>
                {savedCustomerId}
              </strong>
            </div>

            <button
              type="button"
              className="primary app-modal-full-button"
              onClick={goToAddLoan}
            >
              + Add Loan
            </button>

            <button
              type="button"
              className="cancel-button app-modal-full-button"
              onClick={
                goToCustomerProfile
              }
            >
              View Customer Profile
            </button>

          </div>

        </div>
      )}

    </>
  );
}