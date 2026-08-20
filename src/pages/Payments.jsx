import "../styles/Payments.css";
export default function Payments() {
  return (
    <>
      <h1>Payment History</h1>
      <section className="cash">
        <article>
          <span>Total Incoming</span>
          <b className="success">₹27,000</b>
        </article>
        <article>
          <span>New Customer Given</span>
          <b className="danger">₹8,000</b>
        </article>
        <article>
          <span>Total Expenses</span>
          <b className="danger">₹250</b>
        </article>
        <article>
          <span>Net Cash Flow</span>
          <b className="primarytext">₹18,750</b>
        </article>
      </section>
      <section className="panel">
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
              <tr>
                <td>Weekly</td>
                <td>₹30,000</td>
                <td className="success">₹27,000</td>
                <td className="danger">₹3,000</td>
              </tr>
              <tr>
                <td>Daily</td>
                <td>₹18,000</td>
                <td className="success">₹16,500</td>
                <td className="danger">₹1,500</td>
              </tr>
              <tr>
                <td>Monthly</td>
                <td>₹50,000</td>
                <td className="success">₹42,000</td>
                <td className="danger">₹8,000</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}