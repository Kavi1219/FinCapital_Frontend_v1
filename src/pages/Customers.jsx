import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { loadCustomers } from "../utils/customerStorage";

export default function Customers() {
  const { cycle = "all" } = useParams();

  const navigate = useNavigate();

  const [customers, setCustomers] = useState([]);

  useEffect(() => {
    setCustomers(loadCustomers());
  }, []);

  // Convert each customer's loans into individual rows
  const rows = customers.flatMap((item) =>
    (item.loans || []).map((loan, index) => ({
      customerRecord: item,
      loan,
      loanSlot: index + 1,
    }))
  );

  // Filter Daily / Weekly / Monthly
  const filteredRows =
    cycle.toLowerCase() === "all"
      ? rows
      : rows.filter(
          ({ loan }) =>
            loan.cycle?.toLowerCase() === cycle.toLowerCase()
        );

  const cycleTitle =
    cycle.charAt(0).toUpperCase() + cycle.slice(1);

  return (
    <section className="panel">

      <div className="title">
        <div>
          <h1>{cycleTitle} Customers</h1>

          <p className="muted">
            {filteredRows.length} loan
            {filteredRows.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {filteredRows.length === 0 ? (

        <div className="empty-customers">
          <h3>No customers found</h3>

          <p>
            Add a new customer and they will appear here.
          </p>
        </div>

      ) : (

        <div className="customer-list">

          {filteredRows.map(
            ({ customerRecord: item, loan, loanSlot }) => (

              <div
                className="customer-list-card clickable-customer-card"
                key={`${item.customer.customerId}-${loan.loanId}`}

                onClick={() =>
                  navigate(
                    `/customers/profile/${item.customer.customerId}`
                  )
                }

                role="button"
                tabIndex={0}

                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    navigate(
                      `/customers/profile/${item.customer.customerId}`
                    );
                  }
                }}
              >

                {/* CUSTOMER */}

                <div className="customer-list-main">

                  <div className="customer-list-photo">

                    <span>
                      {item.customer.name
                        ?.charAt(0)
                        .toUpperCase()}
                    </span>

                  </div>


                  <div className="customer-list-info">

                    <h3>
                      {item.customer.name}
                    </h3>

                    <p>
                      {item.customer.customerId}
                    </p>

                    <p>
                      📱 {item.customer.mobile}
                    </p>

                    {item.loans.length > 1 && (
                      <p>
                        Loan Slot {loanSlot} of{" "}
                        {item.loans.length}
                      </p>
                    )}

                  </div>

                </div>


                {/* LOAN */}

                <div className="customer-loan-info">

                  <div>
                    <span>Loan ID</span>
                    <b>{loan.loanId}</b>
                  </div>


                  <div>
                    <span>Loan Amount</span>

                    <b>
                      ₹
                      {Number(
                        loan.loanAmount
                      ).toLocaleString("en-IN")}
                    </b>
                  </div>


                  <div>
                    <span>Cycle</span>
                    <b>{loan.cycle}</b>
                  </div>


                  <div>
                    <span>Type</span>
                    <b>{loan.loanType}</b>
                  </div>


                  <div>
                    <span>Collection</span>

                    <b>
                      ₹
                      {Number(
                        loan.collectionAmount
                      ).toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </b>
                  </div>


                  <div>
                    <span>Status</span>

                    <b>
                      {loan.status || "Active"}
                    </b>
                  </div>

                </div>

              </div>
            )
          )}

        </div>
      )}

    </section>
  );
}