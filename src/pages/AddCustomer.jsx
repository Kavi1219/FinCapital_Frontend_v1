import { useMemo, useState } from "react";
export default function AddCustomer() {
  const [cycle, setCycle] = useState("Weekly");
  const [type, setType] = useState("EMI");
  const [amount, setAmount] = useState(10000);
  const [rate, setRate] = useState(2);
  const interest = useMemo(() => (amount * rate) / 100, [amount, rate]);
  const duration = cycle === "Daily" ? 100 : 10;
  const collection = type === "IO" ? interest : amount / duration;
  return (
    <section className="panel">
      <h1>Add Customer</h1>
      <div className="form">
        <label>Customer Name *</label>
        <input />
        <label>Customer ID</label>
        <input value="SFC-0001" readOnly />
        <label>Mobile *</label>
        <input />
        <label>Loan ID</label>
        <input value="SFCLN-00001" readOnly />
        <label>Address *</label>
        <textarea />
        <label>Loan Amount *</label>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(Number(e.target.value))}
        />
        <label>Cycle *</label>
        <div className="choices">
          {["Daily", "Weekly", "Monthly"].map((x) => (
            <button
              className={cycle === x ? "active" : ""}
              onClick={() => setCycle(x)}
              key={x}
            >
              {x}
            </button>
          ))}
        </div>
        <label>Loan Type *</label>
        <div className="choices">
          {["EMI", "IO"].map((x) => (
            <button
              className={type === x ? "active" : ""}
              onClick={() => setType(x)}
              key={x}
            >
              {x}
            </button>
          ))}
        </div>
        <label>Interest Rate *</label>
        <input
          type="number"
          value={rate}
          onChange={(e) => setRate(Number(e.target.value))}
        />
        <label>Interest Amount</label>
        <input value={"₹" + interest.toLocaleString("en-IN")} readOnly />
        <label>Amount Given</label>
        <input
          value={"₹" + (amount - interest).toLocaleString("en-IN")}
          readOnly
        />
        <label>Collection Amount</label>
        <input value={"₹" + collection.toFixed(2)} readOnly />
      </div>
    </section>
  );
}
