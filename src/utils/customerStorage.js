const STORAGE_KEY = "finCapitalCustomers";

function normalizeLoan(loan = {}) {
  return {
    ...loan,

    status: loan.status || "Active",

    collectedAmount: Number(
      loan.collectedAmount || 0
    ),

    principalPending:
      loan.principalPending !== undefined
        ? Number(loan.principalPending)
        : Number(loan.loanAmount || 0),

    precloseAmount:
      loan.precloseAmount !== undefined
        ? Number(loan.precloseAmount)
        : null,

    preclosedAt:
      loan.preclosedAt || null,

    closedAt:
      loan.closedAt || null,
  };
}

function normalizeCustomerRecord(record = {}) {
  const sourceLoans =
    Array.isArray(record.loans)
      ? record.loans
      : record.loan
      ? [record.loan]
      : [];

  const {
    loan,
    loans,
    ...rest
  } = record;

  return {
    ...rest,

    loans:
      sourceLoans.map(
        normalizeLoan
      ),
  };
}

export function loadCustomers() {
  try {
    const raw =
      localStorage.getItem(
        STORAGE_KEY
      );

    if (!raw) {
      return [];
    }

    const parsed =
      JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      return [];
    }

    const normalized =
      parsed.map(
        normalizeCustomerRecord
      );

    // Automatically convert old:
    // loan: {...}
    //
    // into:
    // loans: [{...}]

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(normalized)
    );

    return normalized;

  } catch (error) {

    console.error(
      "LOAD CUSTOMERS ERROR:",
      error
    );

    return [];
  }
}

export function saveCustomers(customers) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(customers)
  );
}

export function findCustomer(customerId) {
  return (
    loadCustomers().find(
      (item) =>
        item?.customer?.customerId ===
        customerId
    ) || null
  );
}

function getLargestNumber(
  ids,
  prefix
) {
  let largest = 0;

  for (const id of ids) {

    if (
      !id ||
      typeof id !== "string"
    ) {
      continue;
    }

    const match =
      id.match(
        new RegExp(
          `^${prefix}(\\d+)$`
        )
      );

    if (match) {
      largest =
        Math.max(
          largest,
          Number(match[1])
        );
    }
  }

  return largest;
}

export function getNextCustomerId(
  customers = []
) {
  const ids =
    customers.map(
      (item) =>
        item?.customer?.customerId
    );

  const next =
    getLargestNumber(
      ids,
      "SFC-"
    ) + 1;

  return (
    "SFC-" +
    String(next).padStart(
      4,
      "0"
    )
  );
}

export function getNextLoanId(
  customers = []
) {
  const ids =
    customers.flatMap(
      (item) =>
        (item?.loans || []).map(
          (loan) =>
            loan?.loanId
        )
    );

  const next =
    getLargestNumber(
      ids,
      "SFCLN-"
    ) + 1;

  return (
    "SFCLN-" +
    String(next).padStart(
      5,
      "0"
    )
  );
}

export function addLoanToCustomer(
  customerId,
  newLoan
) {
  const customers =
    loadCustomers();

  const updatedCustomers =
    customers.map((item) => {

      if (
        item?.customer?.customerId !==
        customerId
      ) {
        return item;
      }

      return {
        ...item,

        status: "Active",

        loans: [
          ...(item.loans || []),

          normalizeLoan(
            newLoan
          ),
        ],
      };
    });

  saveCustomers(
    updatedCustomers
  );

  return (
    updatedCustomers.find(
      (item) =>
        item?.customer?.customerId ===
        customerId
    ) || null
  );
}

export function precloseLoan(
  customerId,
  loanId
) {
  const customers =
    loadCustomers();

  let precloseResult = null;

  const updatedCustomers =
    customers.map((item) => {

      if (
        item?.customer?.customerId !==
        customerId
      ) {
        return item;
      }

      const updatedLoans =
        (item.loans || []).map(
          (loan) => {

            if (
              loan.loanId !== loanId ||
              loan.status !== "Active"
            ) {
              return loan;
            }

            const loanAmount =
              Number(
                loan.loanAmount || 0
              );

            const collectedAmount =
              Number(
                loan.collectedAmount || 0
              );

            const precloseAmount =
              loan.loanType === "IO"
                ? Number(
                    loan.principalPending ??
                      loanAmount
                  )
                : Math.max(
                    0,
                    loanAmount -
                      collectedAmount
                  );

            const updatedLoan = {
              ...loan,

              status:
                "Preclosed",

              precloseAmount:
                precloseAmount,

              preclosedAt:
                new Date().toISOString(),

              principalPending:
                0,

              collectedAmount:
                loan.loanType === "IO"
                  ? collectedAmount
                  : loanAmount,
            };

            precloseResult =
              updatedLoan;

            return updatedLoan;
          }
        );

      const hasActiveLoan =
        updatedLoans.some(
          (loan) =>
            loan.status ===
            "Active"
        );

      return {
        ...item,

        status:
          hasActiveLoan
            ? "Active"
            : "Closed",

        loans:
          updatedLoans,
      };
    });

  saveCustomers(
    updatedCustomers
  );

  return precloseResult;
}