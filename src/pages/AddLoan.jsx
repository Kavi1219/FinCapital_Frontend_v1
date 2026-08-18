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

  const [type, setType] =
    useState("EMI");

  const [amount, setAmount] =
    useState(10000);

  const [rate, setRate] =
    useState(2);

  const [ioDuration, setIoDuration] =
    useState(10);

  const interest = useMemo(
    () => (amount * rate) / 100,
    [amount, rate]
  );

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
  }, [
    type,
    interest,
    amount,
    emiDuration,
  ]);

  const amountGiven =
    amount - interest;

  const durationUnit =
    cycle === "Daily"
      ? "Days"
      : cycle === "Weekly"
      ? "Weeks"
      : "Months";

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

  const handleSaveLoan = () => {
    if (!amount || amount <= 0) {
      alert(
        "Please enter a valid loan amount"
      );
      return;
    }

    if (rate < 0) {
      alert(
        "Please enter a valid interest rate"
      );
      return;
    }

    if (
      type === "IO" &&
      (!ioDuration || ioDuration <= 0)
    ) {
      alert(
        "Please enter a valid IO duration"
      );
      return;
    }

    const newLoan = {
      loanId,
      loanAmount: amount,
      cycle,
      loanType: type,
      interestRate: rate,
      interestAmount: interest,
      amountGiven,
      duration:
        type === "EMI"
          ? emiDuration
          : ioDuration,
      durationUnit,
      collectionAmount: collection,

      status: "Active",
      collectedAmount: 0,
      principalPending: amount,

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
      alert("Unable to add loan.");
      return;
    }

    alert(
      `New loan added successfully!\n\nLoan ID: ${loanId}`
    );

    navigate(
      `/customers/profile/${customerId}`
    );
  };

  return (
    <section className="panel add-customer-panel">

      <div className="add-customer-header">
        <h1>Add New Loan</h1>

        <p>
          Existing Customer:{" "}
          <b>
            {customerRecord.customer.name}
          </b>{" "}
          ({customerId})
        </p>
      </div>

      <div className="form-section-title">
        Loan Details
      </div>

      <div className="customer-form">

        <div className="form-field">
          <label>Loan ID</label>

          <input
            value={loanId}
            readOnly
          />
        </div>

        <div className="form-field">
          <label>Loan Amount *</label>

          <input
            type="number"
            min="1"
            value={amount}
            onChange={(e) =>
              setAmount(
                Number(e.target.value)
              )
            }
          />
        </div>

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

        <div className="form-field">
          <label>Loan Type *</label>

          <div className="choices">

            {["EMI", "IO"].map((x) => (
              <button
                type="button"
                key={x}
                className={
                  type === x
                    ? "active"
                    : ""
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
                Number(e.target.value)
              )
            }
          />
        </div>

        <div className="form-field">
          <label>
            Interest Amount
          </label>

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

        {type === "EMI" ? (
          <div className="form-field">
            <label>Duration</label>

            <input
              value={`${emiDuration} ${durationUnit}`}
              readOnly
            />
          </div>
        ) : (
          <div className="form-field">
            <label>
              IO Duration (
              {durationUnit}) *
            </label>

            <input
              type="number"
              min="1"
              value={ioDuration}
              onChange={(e) =>
                setIoDuration(
                  Number(
                    e.target.value
                  )
                )
              }
            />
          </div>
        )}

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

      </div>

      <div className="customer-actions">

        <button
          type="button"
          className="cancel-button"
          onClick={() => navigate(-1)}
        >
          ← Back
        </button>

        <button
          type="button"
          className="primary save-customer-button"
          onClick={handleSaveLoan}
        >
          Save New Loan
        </button>

      </div>

    </section>
  );
}