import { useState } from "react";
import "../styles/Reports.css";
export default function Reports() {
  const [sel, setSel] = useState(null);
  return (
    <>
      <h1>Reports</h1>
      <div className="reports">
        {["Weekly", "Daily", "Monthly", "Expenses", "Overall Report"].map(
          (x) => (
            <button
              className={sel === x ? "active" : ""}
              onClick={() => setSel(x)}
              key={x}
            >
              {x}
            </button>
          ),
        )}
      </div>
      {sel && (
        <section className="panel">
          <h2>{sel}</h2>
          <div className="form">
            <label>From Date</label>
            <input type="date" />
            <label>To Date</label>
            <input type="date" />
          </div>
          <button className="primary">Generate Report</button>
        </section>
      )}
    </>
  );
}