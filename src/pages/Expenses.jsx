import { useEffect, useMemo, useState } from "react";

import "../styles/Expenses.css";
const STORAGE_KEY = "fincapital_expenses_v2";
const SESSION_KEY = "fincapital_session";

function getToday() {
  return new Date().toLocaleDateString("en-CA");
}

function money(value) {
  return Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 0,
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

function getSession() {
  const saved = readJson(SESSION_KEY, null);

  if (saved) {
    return {
      role: saved.role || "owner",
      profileId: saved.profileId || saved.id || "OWNER",
      displayName:
        saved.displayName ||
        saved.profileName ||
        saved.name ||
        (saved.role === "agent" ? "Agent" : "Owner"),
    };
  }

  // Temporary fallback until backend login is connected.
  return {
    role: "owner",
    profileId: "OWNER",
    displayName: "Owner",
  };
}

function csvValue(value) {
  const text = String(value ?? "");
  return `"${text.replaceAll('"', '""')}"`;
}

export default function Expenses() {
  const today = getToday();

  const [session] = useState(getSession);
  const [items, setItems] = useState(() => readJson(STORAGE_KEY, []));

  const [activeTab, setActiveTab] = useState("today");
  const [formOpen, setFormOpen] = useState(false);

  const [purpose, setPurpose] = useState("");
  const [amount, setAmount] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [filterAgent, setFilterAgent] = useState("ALL");

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const todayExpenses = useMemo(
    () =>
      items
        .filter((item) => item.date === today)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [items, today]
  );

  const overallExpenses = useMemo(
    () =>
      [...items].sort((a, b) => {
        const byDate = b.date.localeCompare(a.date);
        if (byDate !== 0) return byDate;
        return b.createdAt.localeCompare(a.createdAt);
      }),
    [items]
  );

  const agentOptions = useMemo(() => {
    const map = new Map();

    map.set(String(session.profileId), {
      id: String(session.profileId),
      name: session.displayName,
    });

    items.forEach((item) => {
      if (item.agentId) {
        map.set(String(item.agentId), {
          id: String(item.agentId),
          name: item.agentName || "Agent",
        });
      }
    });

    return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [items, session]);

  const todayTotal = useMemo(
    () => todayExpenses.reduce((sum, item) => sum + Number(item.amount), 0),
    [todayExpenses]
  );

  const overallTotal = useMemo(
    () => overallExpenses.reduce((sum, item) => sum + Number(item.amount), 0),
    [overallExpenses]
  );

  const filteredHistory = useMemo(() => {
    return overallExpenses.filter((item) => {
      if (fromDate && item.date < fromDate) return false;
      if (toDate && item.date > toDate) return false;
      if (
        filterAgent !== "ALL" &&
        String(item.agentId) !== String(filterAgent)
      ) {
        return false;
      }
      return true;
    });
  }, [overallExpenses, fromDate, toDate, filterAgent]);

  const filteredTotal = useMemo(
    () => filteredHistory.reduce((sum, item) => sum + Number(item.amount), 0),
    [filteredHistory]
  );

  function resetForm() {
    setPurpose("");
    setAmount("");
    setEditingId(null);
    setFormOpen(false);
  }

  function openAddExpense() {
    setEditingId(null);
    setPurpose("");
    setAmount("");
    setFormOpen(true);
  }

  function saveExpense() {
    const cleanPurpose = purpose.trim();
    const numericAmount = Number(amount);

    if (!cleanPurpose || !Number.isFinite(numericAmount) || numericAmount <= 0) {
      return;
    }

    if (editingId) {
      setItems((current) =>
        current.map((item) =>
          item.id === editingId
            ? {
                ...item,
                purpose: cleanPurpose,
                amount: numericAmount,
                updatedAt: new Date().toISOString(),
              }
            : item
        )
      );
    } else {
      setItems((current) => [
        ...current,
        {
          id:
            globalThis.crypto?.randomUUID?.() ||
            `${Date.now()}-${Math.random()}`,
          date: today,
          purpose: cleanPurpose,
          amount: numericAmount,

          // Automatically captured from logged-in profile.
          agentId: String(session.profileId),
          agentName: session.displayName,
          agentRole: session.role,

          createdAt: new Date().toISOString(),
        },
      ]);
    }

    resetForm();
  }

  function startEdit(item) {
    setEditingId(item.id);
    setPurpose(item.purpose);
    setAmount(String(item.amount));
    setFormOpen(true);
  }

  function confirmDelete() {
    if (!deleteTarget) return;

    setItems((current) =>
      current.filter((item) => item.id !== deleteTarget.id)
    );

    if (editingId === deleteTarget.id) {
      resetForm();
    }

    setDeleteTarget(null);
  }

  function clearFilters() {
    setFromDate("");
    setToDate("");
    setFilterAgent("ALL");
  }

  function downloadReport() {
    if (filteredHistory.length === 0) return;

    const rows = [
      ["Date", "Purpose", "Amount", "Agent Used"],
      ...filteredHistory.map((item) => [
        item.date,
        item.purpose,
        Number(item.amount).toFixed(2),
        item.agentName || "Owner",
      ]),
      ["", "Total", filteredTotal.toFixed(2), ""],
    ];

    const csv =
      "\uFEFF" +
      rows.map((row) => row.map(csvValue).join(",")).join("\r\n");

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    const start = fromDate || "all";
    const end = toDate || "all";
    const agent =
      filterAgent === "ALL"
        ? "all-agents"
        : (
            agentOptions.find(
              (x) => String(x.id) === String(filterAgent)
            )?.name || filterAgent
          )
            .toLowerCase()
            .replaceAll(" ", "-");

    link.href = url;
    link.download = `expense-report_${start}_to_${end}_${agent}.csv`;

    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);
  }

  return (
    <div className="expenses-page">
      <header className="expenses-topbar">
        <div>
          <h1>Expenses</h1>
          <p className="expenses-desktop-subtitle">
            Daily expense tracking and date-wise reports
          </p>
        </div>

        <button className="primary expense-add-button" onClick={openAddExpense}>
          + Add Expense
        </button>
      </header>

      <section className="expense-summary-strip">
        <div>
          <span>Today</span>
          <strong>₹{money(todayTotal)}</strong>
        </div>

        <div>
          <span>Overall</span>
          <strong>₹{money(overallTotal)}</strong>
        </div>
      </section>

      <div className="expense-tabs">
        <button
          className={activeTab === "today" ? "active" : ""}
          onClick={() => setActiveTab("today")}
        >
          Today
        </button>

        <button
          className={activeTab === "history" ? "active" : ""}
          onClick={() => setActiveTab("history")}
        >
          History & Report
        </button>
      </div>

      {activeTab === "today" && (
        <section className="panel expense-content-panel">
          <div className="expense-panel-heading">
            <div>
              <h2>Today's Expenses</h2>
              <span>{today}</span>
            </div>

            <strong>₹{money(todayTotal)}</strong>
          </div>

          {todayExpenses.length === 0 ? (
            <div className="expense-empty-state">
              <strong>No expenses today</strong>
              <span>Tap “Add Expense” to create the first entry.</span>
            </div>
          ) : (
            <>
              <div className="expense-desktop-table">
                <table className="expense-table">
                  <thead>
                    <tr>
                      <th>Purpose</th>
                      <th>Amount</th>
                      <th>Agent Used</th>
                      <th>Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {todayExpenses.map((item) => (
                      <tr key={item.id}>
                        <td>
                          <strong>{item.purpose}</strong>
                        </td>
                        <td className="expense-money">
                          ₹{money(item.amount)}
                        </td>
                        <td>{item.agentName || "Owner"}</td>
                        <td>
                          <div className="expense-row-actions">
                            <button
                              className="expense-edit-btn"
                              onClick={() => startEdit(item)}
                            >
                              Edit
                            </button>
                            <button
                              className="expense-delete-btn"
                              onClick={() => setDeleteTarget(item)}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="expense-mobile-list">
                {todayExpenses.map((item) => (
                  <article className="expense-mobile-card" key={item.id}>
                    <div className="expense-mobile-main">
                      <div>
                        <strong>{item.purpose}</strong>
                        <span>{item.agentName || "Owner"}</span>
                      </div>
                      <b>₹{money(item.amount)}</b>
                    </div>

                    <div className="expense-mobile-actions">
                      <button
                        className="expense-edit-btn"
                        onClick={() => startEdit(item)}
                      >
                        Edit
                      </button>
                      <button
                        className="expense-delete-btn"
                        onClick={() => setDeleteTarget(item)}
                      >
                        Delete
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </>
          )}
        </section>
      )}

      {activeTab === "history" && (
        <section className="panel expense-content-panel">
          <div className="expense-panel-heading">
            <div>
              <h2>Expense History</h2>
              <span>Filter by date and agent</span>
            </div>
          </div>

          <div className="expense-report-filters">
            <label>
              <span>From</span>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
              />
            </label>

            <label>
              <span>To</span>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
              />
            </label>

            <label className="expense-agent-filter">
              <span>Agent</span>
              <select
                value={filterAgent}
                onChange={(e) => setFilterAgent(e.target.value)}
              >
                <option value="ALL">All Agents</option>
                {agentOptions.map((agent) => (
                  <option value={agent.id} key={agent.id}>
                    {agent.name}
                  </option>
                ))}
              </select>
            </label>

            <button className="expense-clear-btn" onClick={clearFilters}>
              Clear
            </button>
          </div>

          <div className="expense-report-total">
            <span>Filtered Total</span>
            <strong>₹{money(filteredTotal)}</strong>
          </div>

          <button
            className="primary expense-download-button"
            onClick={downloadReport}
            disabled={filteredHistory.length === 0}
          >
            Download Report
          </button>

          {filteredHistory.length === 0 ? (
            <div className="expense-empty-state history-empty">
              <strong>No expenses found</strong>
              <span>Change the selected date or agent filter.</span>
            </div>
          ) : (
            <>
              <div className="expense-desktop-table">
                <table className="expense-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Purpose</th>
                      <th>Amount</th>
                      <th>Agent Used</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredHistory.map((item) => (
                      <tr key={`history-${item.id}`}>
                        <td>{item.date}</td>
                        <td>{item.purpose}</td>
                        <td className="expense-money">
                          ₹{money(item.amount)}
                        </td>
                        <td>{item.agentName || "Owner"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="expense-mobile-list">
                {filteredHistory.map((item) => (
                  <article
                    className="expense-mobile-card history-card"
                    key={`mobile-history-${item.id}`}
                  >
                    <div className="expense-mobile-main">
                      <div>
                        <strong>{item.purpose}</strong>
                        <span>
                          {item.date} • {item.agentName || "Owner"}
                        </span>
                      </div>
                      <b>₹{money(item.amount)}</b>
                    </div>
                  </article>
                ))}
              </div>
            </>
          )}
        </section>
      )}

      {formOpen && (
        <div className="expense-modal-backdrop" onMouseDown={resetForm}>
          <div
            className="expense-form-modal"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="expense-modal-title">
              <div>
                <h3>{editingId ? "Edit Expense" : "Add Expense"}</h3>
                <span>{today}</span>
              </div>
              <button onClick={resetForm} aria-label="Close">
                ×
              </button>
            </div>

            <label className="expense-modal-field">
              <span>Purpose</span>
              <input
                autoFocus
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                placeholder="Example: Petrol"
              />
            </label>

            <label className="expense-modal-field">
              <span>Amount</span>
              <input
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="₹0"
              />
            </label>

            <div className="expense-auto-agent">
              <span>Agent Used</span>
              <strong>{session.displayName}</strong>
              <small>Automatically selected from profile ID</small>
            </div>

            <button className="primary expense-save-button" onClick={saveExpense}>
              {editingId ? "Save Changes" : "Save Expense"}
            </button>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div
          className="expense-modal-backdrop"
          onMouseDown={() => setDeleteTarget(null)}
        >
          <div
            className="expense-delete-modal"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="expense-delete-icon">!</div>

            <h3>Delete Expense?</h3>

            <p>
              Delete <strong>{deleteTarget.purpose}</strong> for{" "}
              <strong>₹{money(deleteTarget.amount)}</strong>?
            </p>

            <div className="expense-delete-modal-actions">
              <button
                className="expense-clear-btn"
                onClick={() => setDeleteTarget(null)}
              >
                Cancel
              </button>

              <button
                className="expense-confirm-delete-btn"
                onClick={confirmDelete}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}