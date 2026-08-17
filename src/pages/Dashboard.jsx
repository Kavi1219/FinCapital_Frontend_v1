const cards = [
  ["Expected Today", "₹42,000", "blue"],
  ["Collected Today", "₹28,500", "green"],
  ["Pending / Overdue", "₹13,500", "red"],
  ["Upcoming 7 Days", "₹1,85,000", "purple"],
  ["Active Loans", "42", "navy"],
  ["Today's Expenses", "₹1,250", "orange"],
];
export default function Dashboard() {
  return (
    <>
      <div className="title">
        <div>
          <h1>Dashboard</h1>
          <p>Track collections, pending dues, loans and expenses.</p>
        </div>
        <span className="date">17 Aug 2026</span>
      </div>
      <section className="cards">
        {cards.map((c) => (
          <article className={"card " + c[2]} key={c[0]}>
            <span>{c[0]}</span>
            <b>{c[1]}</b>
          </article>
        ))}
      </section>
      <section className="panel">
        <h2>Pending / Overdue</h2>
        <div className="tablewrap">
          <table>
            <thead>
              <tr>
                <th>Customer ID</th>
                <th>Name</th>
                <th>Cycle</th>
                <th>Amount</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>SFC-0001</td>
                <td>Ravi Kumar</td>
                <td>Weekly</td>
                <td className="danger">₹1,000</td>
                <td>
                  <button>View</button>
                </td>
              </tr>
              <tr>
                <td>SFC-0008</td>
                <td>Kumar</td>
                <td>Daily</td>
                <td className="danger">₹300</td>
                <td>
                  <button>View</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
