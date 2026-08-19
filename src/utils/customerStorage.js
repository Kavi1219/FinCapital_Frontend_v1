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

    pendingDue: Number(
      loan.pendingDue || 0
    ),

    fineDue: Number(
      loan.fineDue || 0
    ),

    finePaidTotal: Number(
      loan.finePaidTotal || 0
    ),

    paymentHistory:
      Array.isArray(loan.paymentHistory)
        ? loan.paymentHistory
        : [],

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

    loans: sourceLoans.map(
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

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(
        normalized
      )
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

export function saveCustomers(
  customers
) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(customers)
  );
}

export function findCustomer(
  customerId
) {
  return (
    loadCustomers().find(
      (item) =>
        item?.customer
          ?.customerId ===
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
        item?.customer
          ?.customerId
    );

  const next =
    getLargestNumber(
      ids,
      "SFC-"
    ) + 1;

  return `SFC-${String(
    next
  ).padStart(4, "0")}`;
}

export function getNextLoanId(
  customers = []
) {
  const ids =
    customers.flatMap(
      (item) =>
        (
          item?.loans || []
        ).map(
          (loan) =>
            loan?.loanId
        )
    );

  const next =
    getLargestNumber(
      ids,
      "SFCLN-"
    ) + 1;

  return `SFCLN-${String(
    next
  ).padStart(5, "0")}`;
}

export function addLoanToCustomer(
  customerId,
  newLoan
) {
  const customers =
    loadCustomers();

  let found = false;

  const updatedCustomers =
    customers.map(
      (item) => {
        if (
          item?.customer
            ?.customerId !==
          customerId
        ) {
          return item;
        }

        found = true;

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
      }
    );

  if (!found) {
    return null;
  }

  saveCustomers(
    updatedCustomers
  );

  return (
    updatedCustomers.find(
      (item) =>
        item?.customer
          ?.customerId ===
        customerId
    ) || null
  );
}

export function recordLoanPayment(
  customerId,
  loanId,
  payment
) {
  const customers =
    loadCustomers();

  let paymentResult =
    null;

  const updatedCustomers =
    customers.map(
      (item) => {
        if (
          item?.customer
            ?.customerId !==
          customerId
        ) {
          return item;
        }

        const updatedLoans =
          (
            item.loans || []
          ).map(
            (loan) => {
              if (
                loan.loanId !==
                  loanId ||
                loan.status !==
                  "Active"
              ) {
                return loan;
              }

              const now =
                new Date();

              const paidAt =
                now.toISOString();

              const paymentTime =
                now.toLocaleTimeString(
                  "en-IN",
                  {
                    hour:
                      "2-digit",

                    minute:
                      "2-digit",
                  }
                );

              const paymentDate =
                payment.paymentDate ||
                paidAt.slice(
                  0,
                  10
                );

              // =================================================
              // DUE PAYMENT
              // Incoming money
              // =================================================

              if (
                payment.paymentType ===
                "Due"
              ) {
                const amount =
                  Number(
                    payment.amount ||
                      0
                  );

                const dueAmount =
                  Number(
                    payment.dueAmount ??
                      loan.collectionAmount ??
                      0
                  );

                const previousPending =
                  Number(
                    loan.pendingDue ||
                      0
                  );

                const totalDue =
                  dueAmount +
                  previousPending;

                const pendingAfter =
                  Math.max(
                    0,
                    totalDue -
                      amount
                  );

                const collectedAmount =
                  Number(
                    loan.collectedAmount ||
                      0
                  ) + amount;

                let principalPending =
                  Number(
                    loan.principalPending ??
                      loan.loanAmount ??
                      0
                  );

                let status =
                  loan.status;

                let closedAt =
                  loan.closedAt ||
                  null;

                if (
                  loan.loanType !==
                  "IO"
                ) {
                  const repayableAmount =
                    Number(
                      loan.totalRepayment ??
                        loan.loanAmount ??
                        0
                    );

                  principalPending =
                    Math.max(
                      0,
                      repayableAmount -
                        collectedAmount
                    );

                  if (
                    principalPending <=
                    0
                  ) {
                    status =
                      "Closed";

                    closedAt =
                      paidAt;
                  }
                }

                const historyItem = {
                  id:
                    `PAY-${Date.now()}`,

                  paymentType:
                    "Due",

                  direction:
                    "Incoming",

                  paymentDate,

                  paymentTime,

                  collectedBy:
                    payment.collectedBy ||
                    "Owner",

                  amount,

                  dueAmount,

                  previousPending,

                  totalDue,

                  pendingAfter,

                  paidAt,
                };

                const updatedLoan = {
                  ...loan,

                  collectedAmount,

                  principalPending,

                  pendingDue:
                    pendingAfter,

                  status,

                  closedAt,

                  paymentHistory: [
                    ...(loan.paymentHistory ||
                      []),

                    historyItem,
                  ],
                };

                paymentResult = {
                  loan:
                    updatedLoan,

                  historyItem,
                };

                return updatedLoan;
              }

              // =================================================
              // FINE PAYMENT
              // Incoming money
              // Does not reduce principal
              // =================================================

              if (
                payment.paymentType ===
                "Fine"
              ) {
                const amount =
                  Number(
                    payment.fineAmount ??
                      payment.amount ??
                      0
                  );

                if (
                  amount <= 0
                ) {
                  throw new Error(
                    "Fine amount must be greater than zero."
                  );
                }

                const finePaidTotal =
                  Number(
                    loan.finePaidTotal ||
                      0
                  ) + amount;

                const historyItem = {
                  id:
                    `FINE-${Date.now()}`,

                  paymentType:
                    "Fine",

                  direction:
                    "Incoming",

                  paymentDate,

                  paymentTime,

                  collectedBy:
                    payment.collectedBy ||
                    "Owner",

                  amount,

                  pendingAfter:
                    null,

                  paidAt,
                };

                const updatedLoan = {
                  ...loan,

                  finePaidTotal,

                  paymentHistory: [
                    ...(loan.paymentHistory ||
                      []),

                    historyItem,
                  ],
                };

                paymentResult = {
                  loan:
                    updatedLoan,

                  historyItem,
                };

                return updatedLoan;
              }

              return loan;
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
      }
    );

  saveCustomers(
    updatedCustomers
  );

  return paymentResult;
}

export function precloseLoan(
  customerId,
  loanId
) {
  const customers =
    loadCustomers();

  let precloseResult =
    null;

  const updatedCustomers =
    customers.map(
      (item) => {
        if (
          item?.customer
            ?.customerId !==
          customerId
        ) {
          return item;
        }

        const updatedLoans =
          (
            item.loans || []
          ).map(
            (loan) => {
              if (
                loan.loanId !==
                  loanId ||
                loan.status !==
                  "Active"
              ) {
                return loan;
              }

              const loanAmount =
                Number(
                  loan.loanAmount ||
                    0
                );

              const collectedAmount =
                Number(
                  loan.collectedAmount ||
                    0
                );

              const repayableAmount =
                Number(
                  loan.totalRepayment ??
                    loanAmount
                );

              const precloseAmount =
                loan.loanType ===
                  "IO"
                  ? Number(
                      loan.principalPending ??
                        loanAmount
                    )
                  : Math.max(
                      0,
                      repayableAmount -
                        collectedAmount
                    );

              const preclosedAt =
                new Date()
                  .toISOString();

              const precloseDate =
                preclosedAt.slice(
                  0,
                  10
                );

              // =================================================
              // PRECLOSE PAYMENT
              // Incoming money
              // =================================================

              const precloseHistoryItem = {
                id:
                  `PRECLOSE-${Date.now()}`,

                paymentType:
                  "Preclose",

                direction:
                  "Incoming",

                paymentDate:
                  precloseDate,

                collectedBy:
                  "Owner",

                amount:
                  precloseAmount,

                pendingAfter:
                  0,

                paidAt:
                  preclosedAt,
              };

              const updatedLoan = {
                ...loan,

                status:
                  "Preclosed",

                precloseAmount,

                preclosedAt,

                principalPending:
                  0,

                pendingDue:
                  0,

                collectedAmount:
                  collectedAmount +
                  precloseAmount,

                paymentHistory: [
                  ...(loan.paymentHistory ||
                    []),

                  precloseHistoryItem,
                ],
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
      }
    );

  saveCustomers(
    updatedCustomers
  );

  return precloseResult;
}