import { useState } from "react";
export default function Expenses() {
  const [items, setItems] = useState([
    { id: 1, p: "Tea", a: 50 },
    { id: 2, p: "Petrol", a: 500 },
  ]);
  const [p, setP] = useState("");
  const [a, setA] = useState("");
  const total = items.reduce((s, x) => s + x.a, 0);
  function add() {
    if (!p || Number(a) <= 0) return;
    setItems([...items, { id: Date.now(), p, a: Number(a) }]);
    setP("");
    setA("");
  }
  return (
    <>
      <h1>Expenses</h1>
      <section className="cash">
        <article>
          <span>Today's Expenses</span>
          <b className="danger">₹{total}</b>
        </article>
        <article>
          <span>Overall Expenses</span>
          <b>₹{total}</b>
        </article>
        <article>
          <span>Today's Entries</span>
          <b>{items.length}</b>
        </article>
      </section>
      <section className="panel">
        <div className="expenseform">
          <input
            value={p}
            onChange={(e) => setP(e.target.value)}
            placeholder="Purpose"
          />
          <input
            type="number"
            value={a}
            onChange={(e) => setA(e.target.value)}
            placeholder="Amount"
          />
          <button className="primary" onClick={add}>
            + Add
          </button>
        </div>
        {items.map((x) => (
          <div className="expense" key={x.id}>
            <b>{x.p}</b>
            <span className="danger">₹{x.a}</span>
            <button
              onClick={() => setItems(items.filter((i) => i.id !== x.id))}
            >
              Delete
            </button>
          </div>
        ))}
      </section>
    </>
  );
}
