import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { useNavigate } from "react-router";

import {
  loadCustomers,
} from "../utils/customerStorage";

import "../styles/Payments.css";

const EXPENSE_STORAGE_KEY = "fincapital_expenses_v2";

function money(value) {
  return Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function readJson(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
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

function getSortTime(value) {
  if (!value) return 0;

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return new Date(`${value}T00:00:00`).getTime();
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? 0
    : date.getTime();
}

function getTypeLabel(type) {
  if (type === "Loan Given") return "New Customer";
  if (type === "Fine") return "Fine";
  if (type === "Preclose") return "Preclose";
  if (type === "Principal Return") return "Principal Return";
  if (type === "Expense") return "Expense";

  return "Collection";
}

function isOutgoing(type) {
  return type === "Loan Given" || type === "Expense";
}

export default function Payments() {
  const navigate = useNavigate();

  const [customers, setCustomers] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [filter, setFilter] = useState("ALL");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  useEffect(() => {
    setCustomers(loadCustomers());
    setExpenses(readJson(EXPENSE_STORAGE_KEY, []));
  }, []);

  const loanTransactions = useMemo(() => {
    const rows = [];

    customers.forEach((record) => {
      const customer = record.customer || {};

      (record.loans || []).forEach((loan) => {
        (loan.paymentHistory || []).forEach((payment, index) => {
          const rawType = payment.paymentType || "Due";

          const amount = Number(
            payment.amount ??
            payment.fineAmount ??
            payment.fineAdded ??
            0
          );

          const dateValue =
            payment.paymentDate ||
            payment.paidAt ||
            payment.createdAt;

          rows.push({
            id: payment.id || `${loan.loanId}-${index}`,
            customerId: customer.customerId || "-",
            customerName: customer.name || "-",
            loanId: loan.loanId || "-",
            cycle: loan.cycle || "-",
            rawType,
            type: getTypeLabel(rawType),
            amount,
            paymentDate: dateValue,
            details:
              rawType === "Loan Given"
                ? "Loan disbursement"
                : `${loan.cycle || "-"} loan`,
            collectedBy:
              payment.collectedBy ||
              payment.collectedByName ||
              (rawType === "Loan Given" ? "Owner" : "-"),
            mode:
              payment.mode ||
              payment.paymentMode ||
              "Cash",
            sortTime: getSortTime(dateValue),
          });
        });
      });
    });

    return rows;
  }, [customers]);

  const expenseTransactions = useMemo(
    () =>
      expenses.map((item) => ({
        id: `expense-${item.id}`,
        customerId: "-",
        customerName: item.purpose || "Expense",
        loanId: "-",
        cycle: "-",
        rawType: "Expense",
        type: "Expense",
        amount: Number(item.amount || 0),
        paymentDate: item.date || item.createdAt,
        details: item.purpose || "Expense",
        collectedBy: item.agentName || "Owner",
        mode: item.mode || "Cash",
        sortTime: getSortTime(item.createdAt || item.date),
      })),
    [expenses]
  );

  const transactions = useMemo(
    () =>
      [...loanTransactions, ...expenseTransactions].sort(
        (a, b) => b.sortTime - a.sortTime
      ),
    [loanTransactions, expenseTransactions]
  );

  const filteredTransactions = useMemo(() => {
    let rows = transactions;

    if (filter === "COLLECTIONS") {
      rows = rows.filter(
        (transaction) =>
          transaction.rawType === "Due" ||
          transaction.rawType === "Fine" ||
          transaction.rawType === "Preclose" ||
          transaction.rawType === "Principal Return"
      );
    }

    if (filter === "NEW_CUSTOMER") {
      rows = rows.filter(
        (transaction) => transaction.rawType === "Loan Given"
      );
    }

    if (filter === "EXPENSES") {
      rows = rows.filter(
        (transaction) => transaction.rawType === "Expense"
      );
    }

    if (fromDate) {
      const fromTime = new Date(
        `${fromDate}T00:00:00`
      ).getTime();

      rows = rows.filter(
        (transaction) =>
          transaction.sortTime >= fromTime
      );
    }

    if (toDate) {
      const toTime = new Date(
        `${toDate}T23:59:59`
      ).getTime();

      rows = rows.filter(
        (transaction) =>
          transaction.sortTime <= toTime
      );
    }

    return rows;
  }, [
    transactions,
    filter,
    fromDate,
    toDate,
  ]);

  const totalIncoming = useMemo(
    () =>
      transactions
        .filter((transaction) => !isOutgoing(transaction.rawType))
        .reduce(
          (total, transaction) =>
            total + Number(transaction.amount || 0),
          0
        ),
    [transactions]
  );

  const newCustomerGiven = useMemo(
    () =>
      transactions
        .filter(
          (transaction) => transaction.rawType === "Loan Given"
        )
        .reduce(
          (total, transaction) =>
            total + Number(transaction.amount || 0),
          0
        ),
    [transactions]
  );

  const totalExpenses = useMemo(
    () =>
      expenseTransactions.reduce(
        (total, transaction) =>
          total + Number(transaction.amount || 0),
        0
      ),
    [expenseTransactions]
  );

  const netCashFlow =
    totalIncoming -
    newCustomerGiven -
    totalExpenses;

  const cycleSummary = useMemo(() => {
    const result = {
      Weekly: {
        target: 0,
        collected: 0,
        pending: 0,
      },
      Daily: {
        target: 0,
        collected: 0,
        pending: 0,
      },
      Monthly: {
        target: 0,
        collected: 0,
        pending: 0,
      },
    };

    customers.forEach((record) => {
      (record.loans || []).forEach((loan) => {
        const cycle = loan.cycle;

        if (!result[cycle]) return;

        result[cycle].target += Number(
          loan.totalRepayment ??
          loan.loanAmount ??
          0
        );

        result[cycle].collected += Number(
          loan.collectedAmount || 0
        );

        result[cycle].pending += Number(
          loan.pendingDue || 0
        );
      });
    });

    return result;
  }, [customers]);

  return (
    <section className="payments-page">

      <div className="payments-title">
        <div>
          <h1>Payment History</h1>

          <p>
            Complete collections, disbursements and expense
            transaction history.
          </p>
        </div>
      </div>

      <section className="cash">

        <article>
          <span>Total Incoming</span>
          <b className="success">
            ₹{money(totalIncoming)}
          </b>
        </article>

        <article>
          <span>New Customer Given</span>
          <b className="danger">
            ₹{money(newCustomerGiven)}
          </b>
        </article>

        <article>
          <span>Total Expenses</span>
          <b className="danger">
            ₹{money(totalExpenses)}
          </b>
        </article>

        <article>
          <span>Net Cash Flow</span>
          <b className="primarytext">
            ₹{money(netCashFlow)}
          </b>
        </article>

      </section>

      <section className="panel payments-summary-panel">

        <div className="tablewrap">
          <table>

            <thead>
              <tr>
                <th>Category</th>
                <th>Target</th>
                <th>Collected</th>
                <th>Pending</th>
              </tr>
            </thead>

            <tbody>
              {["Weekly", "Daily", "Monthly"].map((cycle) => (
                <tr key={cycle}>
                  <td>{cycle}</td>

                  <td>
                    ₹{money(cycleSummary[cycle].target)}
                  </td>

                  <td className="success">
                    ₹{money(cycleSummary[cycle].collected)}
                  </td>

                  <td className="danger">
                    ₹{money(cycleSummary[cycle].pending)}
                  </td>
                </tr>
              ))}
            </tbody>

          </table>
        </div>

      </section>

      <section className="panel all-transactions-panel">

        <div className="transactions-header">

          <div>
            <h2>All Transactions</h2>

            <p>
              Collections, new customer disbursements and expenses.
            </p>
          </div>

          <div className="transaction-date-filter">

            <label>
              <span>From</span>

              <input
                type="date"
                value={fromDate}
                onChange={(e) =>
                  setFromDate(e.target.value)
                }
              />
            </label>

            <label>
              <span>To</span>

              <input
                type="date"
                value={toDate}
                onChange={(e) =>
                  setToDate(e.target.value)
                }
              />
            </label>

            {(fromDate || toDate) && (
              <button
                type="button"
                className="transaction-date-clear"
                onClick={() => {
                  setFromDate("");
                  setToDate("");
                }}
              >
                Clear
              </button>
            )}

          </div>
        </div>

        <div className="transaction-filters">

          <button
            type="button"
            className={filter === "ALL" ? "active" : ""}
            onClick={() => setFilter("ALL")}
          >
            All
          </button>

          <button
            type="button"
            className={
              filter === "COLLECTIONS"
                ? "active"
                : ""
            }
            onClick={() => setFilter("COLLECTIONS")}
          >
            Collections
          </button>

          <button
            type="button"
            className={
              filter === "NEW_CUSTOMER"
                ? "active"
                : ""
            }
            onClick={() => setFilter("NEW_CUSTOMER")}
          >
            New Customer
          </button>

          <button
            type="button"
            className={
              filter === "EXPENSES"
                ? "active"
                : ""
            }
            onClick={() => setFilter("EXPENSES")}
          >
            Expenses
          </button>

        </div>

        {filteredTransactions.length === 0 ? (

          <div className="transactions-empty">
            No transactions found.
          </div>

        ) : (

          <div className="tablewrap transactions-table-wrap">

            <table className="transactions-table">

              <thead>
                <tr>
                  <th>Date</th>
                  <th>Details</th>
                  <th>Customer / Purpose</th>
                  <th>Loan ID</th>
                  <th>Type</th>
                  <th>Amount</th>
                  <th>Agent Used</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>

                {filteredTransactions.map((transaction) => {
                  const outgoing = isOutgoing(transaction.rawType);
                  const isExpense = transaction.rawType === "Expense";

                  return (
                    <tr key={transaction.id}>

                      <td>
                        {formatDate(transaction.paymentDate)}
                      </td>

                      <td>
                        {transaction.details}
                      </td>

                      <td>
                        <div className="transaction-customer">

                          <strong>
                            {transaction.customerName}
                          </strong>

                          {!isExpense && (
                            <small>
                              {transaction.customerId}
                            </small>
                          )}

                        </div>
                      </td>

                      <td>
                        {transaction.loanId}
                      </td>

                      <td>
                        <span
                          className={
                            `transaction-type ${transaction.rawType
                              .toLowerCase()
                              .replaceAll(" ", "-")}`
                          }
                        >
                          {transaction.type}
                        </span>
                      </td>

                      <td>
                        <b
                          className={
                            outgoing
                              ? "transaction-outgoing"
                              : "transaction-incoming"
                          }
                        >
                          {outgoing ? "−" : "+"}
                          ₹{money(transaction.amount)}
                        </b>
                      </td>

                      <td>
                        {transaction.collectedBy}
                      </td>

                      <td>
                        {isExpense ? (
                          <span className="transaction-no-action">
                            —
                          </span>
                        ) : (
                          <button
                            type="button"
                            className="transaction-view-button"
                            onClick={() =>
                              navigate(
                                `/customers/profile/${transaction.customerId}`
                              )
                            }
                          >
                            View
                          </button>
                        )}
                      </td>

                    </tr>
                  );
                })}

              </tbody>
            </table>

          </div>

        )}

      </section>

    </section>
  );
}