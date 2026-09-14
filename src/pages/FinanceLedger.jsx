import { supabase } from "../services/supabase";
import KpiCard from "../components/ui/KpiCard";
import { useEffect, useState } from "react";

import {
  getBilling,
  addBilling,
  deleteBilling,
  updateBilling,
} from "../services/billingService";

import {
  syncExpenseInvestment,
  deleteExpenseInvestment,
} from "../services/investmentService";

import { getAllPayments } from "../services/paymentsService.js";

// ============================================================
// INVESTOR NAMES
// Dealer payments made by these people belong under Investment
// ============================================================

const INVESTOR_NAMES = [
  "shubhendu",
  "vipin",
  "prashun",
  "saurabh",
];

// ============================================================
// EXPENSE INVESTOR NAMES
//
// Expense transactions paid by these people are treated
// as Investment transactions.
// ============================================================

const EXPENSE_INVESTOR_NAMES = [
  "prashun dixit",
  "shaubhendu dixit",
  "vipin saxena",
];

// ============================================================
// HELPERS
// ============================================================

function money(value) {
  const amount = Number(value || 0);

  return `₹ ${Math.round(amount).toLocaleString("en-IN")}`;
}

function normalizeName(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function isInvestor(name) {
  const normalized = normalizeName(name);

  return INVESTOR_NAMES.some((investor) =>
    normalized.includes(investor)
  );
}

// ============================================================
// PLANT SIZE FORMATTER
// 3       -> 3 KW
// 3KW     -> 3 KW
// 3 kw    -> 3 KW
// 3.5     -> 3.5 KW
// ============================================================

function formatPlantSize(value) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "-";
  }

  const text = String(value).trim();

  if (!text) {
    return "-";
  }

  const cleaned = text
    .replace(/\s+/g, "")
    .replace(/kw$/i, "");

  return `${cleaned} KW`;
}

// ============================================================
// COMPONENT
// ============================================================

export default function FinanceLedger() {
  // ==========================================================
  // STATE
  // ==========================================================

  const [billing, setBilling] = useState([]);

  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");

  const [showForm, setShowForm] = useState(false);

  const [editId, setEditId] = useState(null);

const [selectedBlock, setSelectedBlock] = useState(null);

const [plantExpenses, setPlantExpenses] = useState([]);

// ==========================================================
// VIEW DETAILS
// ==========================================================

const [viewTransaction, setViewTransaction] = useState(null);

const [viewPlantExpense, setViewPlantExpense] = useState(null);

  const [form, setForm] = useState({
    date: "",
    type: "Expense",
    company: "",
    paid_by: "Shiv Shakti Solar",
    payment_mode: "Cash",
    amount: "",
    remarks: "",
  });

  // ==========================================================
  // LOAD PLANT EXPENSES
  //
  // Customer/project information:
  // projects + customers
  //
  // Expense:
  // used_inventory.total_plant_cost
  // ==========================================================

  async function loadPlantExpenses() {
    try {
      // ======================================================
      // PROJECTS + CUSTOMER DETAILS
      // ======================================================

      const {
        data: projects,
        error: projectError,
      } = await supabase
        .from("projects")
        .select(`
          id,
          project_no,
          customer_id,
          total_amount,
          project_size,
          project_date,
          customers (
            id,
            customer_name,
            location,
            plant_size,
            payment_type
          )
        `);

      if (projectError) {
        throw projectError;
      }

      // ======================================================
      // MATERIAL CONSUMPTION
      // ======================================================

      const {
        data: consumption,
        error: consumptionError,
      } = await supabase
        .from("used_inventory")
        .select(`
          id,
          customer_id,
          project_no,
          plant_size,
          location,
          total_plant_cost
        `);

      if (consumptionError) {
        throw consumptionError;
      }

      // ======================================================
      // PROJECT LOOKUPS
      // ======================================================

      const projectMap = new Map();

      (projects || []).forEach((project) => {
        const projectNo = String(
          project.project_no || ""
        )
          .trim()
          .toLowerCase();

        if (projectNo) {
          projectMap.set(projectNo, project);
        }

        if (project.id) {
          projectMap.set(
            `id-${project.id}`,
            project
          );
        }
      });

      // ======================================================
      // BUILD PROJECT-WISE EXPENSE
      // ======================================================

      const expenseMap = new Map();

      (consumption || []).forEach((item) => {
        const projectNo = String(
          item.project_no || ""
        ).trim();

        const project =
          projectMap.get(
            projectNo.toLowerCase()
          ) ||
          (item.customer_id
            ? projectMap.get(
                `id-${item.customer_id}`
              )
            : null);

        const customer =
          project?.customers || null;

        const key =
          project?.id ||
          `${item.customer_id || ""}-${projectNo}`;

        if (!expenseMap.has(key)) {
          expenseMap.set(key, {
            project_id:
              project?.id || null,

            project_no:
              project?.project_no ||
              item.project_no ||
              "-",

            customer_name:
              customer?.customer_name ||
              "-",

            plant_size:
              customer?.plant_size ||
              project?.project_size ||
              item.plant_size ||
              "-",

            location:
              customer?.location ||
              item.location ||
              "-",

            payment_type:
              customer?.payment_type ||
              "-",

            total_cost:
              Number(
                project?.total_amount || 0
              ),

            total_expense: 0,
          });
        }

        const row =
          expenseMap.get(key);

        row.total_expense += Number(
          item.total_plant_cost || 0
        );
      });

      // ======================================================
      // SORT STRICTLY BY PROJECT NUMBER
      //
      // PRJ-2026-0001
      // PRJ-2026-0002
      // PRJ-2026-0003
      // ...
      //
      // DO NOT SORT BY PROJECT DATE.
      // ======================================================

      const rows =
        Array.from(
          expenseMap.values()
        ).sort((a, b) => {
          const projectA =
            String(
              a.project_no || ""
            ).trim();

          const projectB =
            String(
              b.project_no || ""
            ).trim();

          // Extract final numeric part.

          const matchA =
            projectA.match(/(\d+)$/);

          const matchB =
            projectB.match(/(\d+)$/);

          const numberA = matchA
            ? Number(matchA[1])
            : Number.MAX_SAFE_INTEGER;

          const numberB = matchB
            ? Number(matchB[1])
            : Number.MAX_SAFE_INTEGER;

          // Primary sort:
          // project sequence number

          if (numberA !== numberB) {
            return numberA - numberB;
          }

          // Secondary sort:
          // complete project number

          return projectA.localeCompare(
            projectB,
            undefined,
            {
              numeric: true,
              sensitivity: "base",
            }
          );
        });

      setPlantExpenses(rows);
    } catch (error) {
      console.error(
        "PLANT EXPENSE LOAD ERROR:",
        error
      );

      setPlantExpenses([]);
    }
  }

  // ==========================================================
  // LOAD BILLING + CUSTOMER PAYMENTS
  // ==========================================================

  useEffect(() => {
    loadBilling();
    loadPlantExpenses();
  }, []);

  async function loadBilling() {
    try {
      setLoading(true);

      // ------------------------------------------------------
      // FINANCE LEDGER ENTRIES
      // ------------------------------------------------------

      const billingData =
        await getBilling();

      // ------------------------------------------------------
      // CUSTOMER PAYMENTS
      // ------------------------------------------------------

      const customerPayments =
        await getAllPayments();

      // ------------------------------------------------------
      // CONVERT CUSTOMER PAYMENTS
      // ------------------------------------------------------

      const customerPaymentRows =
        (customerPayments || [])
          .filter(
            (payment) =>
              payment?.source_type !==
              "Investment"
          )
          .map((payment) => {
            const customerName =
              payment?.projects
                ?.customers
                ?.customer_name ||
              "Customer";

            const projectNo =
              payment?.projects
                ?.project_no ||
              "";

            return {
              id:
                `customer-payment-${payment.id}`,

              source_id:
                payment.id,

              source_type:
                "Customer Payment",

              date:
                payment.payment_date ||
                payment.projects?.project_date ||
                "",

              type:
                "Income",

              // Customer payment always shows
              // Solar Payment.
              company:
                "Solar Payment",

              paid_by:
                customerName,

              payment_mode:
                payment.payment_mode ||
                payment.payment_type ||
                "Cash",

              amount:
                Number(
                  payment.amount || 0
                ),

              payment_type:
                "Credit",

              // Only project number.
              remarks:
                projectNo,

              project_id:
                payment.project_id ||
                payment.projects?.id ||
                null,

              customer_name:
                customerName,

              project_no:
                projectNo,
            };
          });

      // ------------------------------------------------------
      // MERGE
      // ------------------------------------------------------

      const mergedData = [
        ...(billingData || []),
        ...customerPaymentRows,
      ];

      // ------------------------------------------------------
      // SORT OLDEST -> NEWEST
      // ------------------------------------------------------

      mergedData.sort((a, b) => {
        const dateA =
          new Date(
            a.date || 0
          ).getTime();

        const dateB =
          new Date(
            b.date || 0
          ).getTime();

        if (dateA !== dateB) {
          return dateA - dateB;
        }

        return (
          Number(a.id || 0) -
          Number(b.id || 0)
        );
      });

      // ------------------------------------------------------
      // RUNNING BALANCE
      // ------------------------------------------------------

      let balance = 0;

      const transactionsWithBalance =
        mergedData.map((item) => {
          const amount =
            Number(
              item.amount || 0
            );

          if (item.type === "Income") {
            balance += amount;
          } else {
            balance -= amount;
          }

          return {
            ...item,
            runningBalance: balance,
          };
        });

      // Newest first.
      transactionsWithBalance.reverse();

      setBilling(
        transactionsWithBalance
      );
    } catch (error) {
      console.error(
        "FINANCE LEDGER LOAD ERROR:",
        error
      );
    } finally {
      setLoading(false);
    }
  }

  // ==========================================================
  // CLASSIFICATION
  // ==========================================================

  // ----------------------------------------------------------
  // CUSTOMER PAYMENTS
  // ----------------------------------------------------------

  const customerPaymentTransactions =
    billing.filter(
      (item) =>
        item.source_type ===
        "Customer Payment"
    );

  // ----------------------------------------------------------
  // EXPENSE
  //
  // Normal expenses only.
  //
  // Expense paid by:
  // Shiv Shakti Solar -> Expense
  //
  // Expense paid by:
  // Prashun Dixit
  // Shaubhendu Dixit
  // Vipin Saxena
  //
  // -> Investment
  //
  // Therefore investor-paid Expense transactions are
  // intentionally excluded from this section.
  // ----------------------------------------------------------

  const expenseTransactions =
    billing.filter((item) => {
      if (
        item.source_type ===
        "Customer Payment"
      ) {
        return false;
      }

      const type =
        normalizeName(item.type);

      const paidBy =
        normalizeName(item.paid_by);

      // ------------------------------------------------------
      // EXPENSE PAID BY INVESTOR
      // ------------------------------------------------------

      const isExpenseInvestment =
        type === "expense" &&
        EXPENSE_INVESTOR_NAMES.includes(
          paidBy
        );

      // Do NOT show investor-paid expenses
      // under normal Expense.
      if (isExpenseInvestment) {
        return false;
      }

      return (
        type === "expense" ||
        type === "vendor payment" ||
        type === "installation charges" ||
        type === "je charge"
      );
    });

  const totalNormalExpense =
    expenseTransactions.reduce(
      (sum, item) =>
        sum +
        Number(item.amount || 0),
      0
    );

  // ----------------------------------------------------------
  // DEALER PAYMENTS
  //
  // Only dealer payments made by Shiv Shakti Solar.
  //
  // Investor-paid dealer payments are NOT included here.
  // ----------------------------------------------------------

  const dealerPaymentTransactions =
    billing.filter((item) => {
      if (
        item.source_type ===
        "Customer Payment"
      ) {
        return false;
      }

      const type =
        normalizeName(item.type);

      const remarks =
        normalizeName(item.remarks);

      const paidBy =
        normalizeName(item.paid_by);

      // New Transaction Type
      const isDealerPaymentType =
        type === "dealer payment";

      // Old records that used remarks
      const isDealerPaymentRemark =
        remarks === "dealer payment" ||
        remarks.includes(
          "dealer payment"
        );

      if (
        !isDealerPaymentType &&
        !isDealerPaymentRemark
      ) {
        return false;
      }

      // Investor-paid dealer payment
      // continues to go under Investment.
      if (isInvestor(paidBy)) {
        return false;
      }

      return true;
    });

  // ----------------------------------------------------------
  // INVESTMENT
  //
  // 1. Normal investment entries
  // 2. Dealer payments made by investors
  // 3. Expense transactions paid by:
  //    - Prashun Dixit
  //    - Shaubhendu Dixit
  //    - Vipin Saxena
  // ----------------------------------------------------------

  const investmentTransactions =
    billing.filter((item) => {
      if (
        item.source_type ===
        "Customer Payment"
      ) {
        return false;
      }

      const sourceType =
        normalizeName(
          item.source_type
        );

      const type =
        normalizeName(item.type);

      const remarks =
        normalizeName(item.remarks);

      const paidBy =
        normalizeName(item.paid_by);

      // ------------------------------------------------------
      // NORMAL INVESTMENT
      // ------------------------------------------------------

      if (
        sourceType ===
        "investment"
      ) {
        return true;
      }

      // ------------------------------------------------------
      // EXPENSE PAID BY INDIVIDUAL INVESTOR
      //
      // This is the NEW requested behavior.
      // ------------------------------------------------------

      const isExpenseInvestment =
        type === "expense" &&
        EXPENSE_INVESTOR_NAMES.includes(
          paidBy
        );

      if (isExpenseInvestment) {
        return true;
      }

      // ------------------------------------------------------
      // INVESTOR-PAID DEALER PAYMENT
      //
      // Existing logic remains unchanged.
      // ------------------------------------------------------

      const isDealerPayment =
        sourceType ===
          "dealer payment" ||
        remarks ===
          "dealer payment" ||
        remarks.includes(
          "dealer payment"
        );

      if (
        isDealerPayment &&
        isInvestor(paidBy)
      ) {
        return true;
      }

      return false;
    });

  // ==========================================================
  // KPI TOTALS
  // ==========================================================

  const totalCustomerPayment =
    customerPaymentTransactions.reduce(
      (sum, item) =>
        sum +
        Number(
          item.amount || 0
        ),
      0
    );

  const totalDealerPayment =
    dealerPaymentTransactions.reduce(
      (sum, item) =>
        sum +
        Number(
          item.amount || 0
        ),
      0
    );

  const totalInvestment =
    investmentTransactions.reduce(
      (sum, item) =>
        sum +
        Number(
          item.amount || 0
        ),
      0
    );

  // ==========================================================
  // TOTAL PLANT EXPENSE
  //
  // IMPORTANT:
  // This comes from Material Consumption:
  // used_inventory.total_plant_cost
  //
  // NOT from billing.
  // ==========================================================

  const totalPlantExpense =
    plantExpenses.reduce(
      (sum, item) =>
        sum +
        Number(
          item.total_expense || 0
        ),
      0
    );

  // ==========================================================
  // TOTAL INCOME / EXPENSE
  //
  // These are Finance Ledger transactions only.
  // ==========================================================

  const totalIncome =
    totalCustomerPayment +
    totalInvestment;

  const totalExpense =
    totalNormalExpense +
    totalDealerPayment;

  const netBalance =
    totalIncome -
    totalExpense;

  // ==========================================================
  // CASH BALANCE
  // ==========================================================

  const cashBalance =
    billing.reduce(
      (sum, item) => {
        const amount =
          Number(
            item.amount || 0
          );

        const mode =
          normalizeName(
            item.payment_mode
          );

        if (mode !== "cash") {
          return sum;
        }

        if (item.type === "Income") {
          return sum + amount;
        }

        return sum - amount;
      },
      0
    );

  // ==========================================================
  // BANK / UPI / CHEQUE
  // ==========================================================

  const bankBalance =
    billing.reduce(
      (sum, item) => {
        const amount =
          Number(
            item.amount || 0
          );

        const mode =
          normalizeName(
            item.payment_mode
          );

        const isBank =
          mode === "bank" ||
          mode === "upi" ||
          mode === "cheque";

        if (!isBank) {
          return sum;
        }

        if (item.type === "Income") {
          return sum + amount;
        }

        return sum - amount;
      },
      0
    );

  // ==========================================================
  // CASH IN HAND
  //
  // User requested:
  //
  // Physical Cash + Bank/UPI Balance
  // ==========================================================

  const cashInHand =
    cashBalance + bankBalance;

  // ==========================================================
  // SEARCH
  // ==========================================================

  const searchText =
    search
      .toLowerCase()
      .trim();

  function filterTransactions(data) {
    if (!searchText) {
      return data;
    }

    return data.filter((item) => {
      return (
        item.company
          ?.toLowerCase()
          .includes(searchText) ||

        item.paid_by
          ?.toLowerCase()
          .includes(searchText) ||

        item.customer_name
          ?.toLowerCase()
          .includes(searchText) ||

        item.remarks
          ?.toLowerCase()
          .includes(searchText) ||

        item.project_no
          ?.toLowerCase()
          .includes(searchText)
      );
    });
  }

  // ==========================================================
  // SELECTED BLOCK TRANSACTIONS
  // ==========================================================

  let selectedTransactions = [];

  if (
    selectedBlock ===
    "customer"
  ) {
    selectedTransactions =
      filterTransactions(
        customerPaymentTransactions
      );
  }

  if (
    selectedBlock ===
    "dealer"
  ) {
    selectedTransactions =
      filterTransactions(
        dealerPaymentTransactions
      );
  }

  if (
    selectedBlock ===
    "investment"
  ) {
    selectedTransactions =
      filterTransactions(
        investmentTransactions
      );
  }

  if (
    selectedBlock ===
    "expense"
  ) {
    selectedTransactions =
      filterTransactions(
        expenseTransactions
      );
  }

  // ==========================================================
  // FORM RESET
  // ==========================================================

  function resetForm() {
    setForm({
      date: "",
      type: "Expense",
      company: "",
      paid_by: "Shiv Shakti Solar",
      payment_mode: "Cash",
      amount: "",
      remarks: "",
    });

    setEditId(null);
  }

  // ==========================================================
  // EDIT TRANSACTION
  // ==========================================================

  function startEdit(item) {
    setForm({
      date: item.date
        ? String(item.date).substring(
            0,
            10
          )
        : "",

      type:
        item.type ||
        "Expense",

      company:
        item.company || "",

      paid_by:
        item.paid_by ||
        "Shiv Shakti Solar",

      payment_mode:
        item.payment_mode ||
        "Cash",

      amount:
        item.amount || "",

      remarks:
        item.remarks || "",
    });

    setEditId(item.id);

    setShowForm(true);
  }

  // ==========================================================
// VIEW TRANSACTION
// ==========================================================

function openTransactionView(item) {
  setViewTransaction(item);
}

  // ==========================================================
  // SAVE TRANSACTION
  // ==========================================================

  async function saveTransaction() {
    if (!form.date) {
      alert(
        "Please select a transaction date."
      );
      return;
    }

    if (!form.amount) {
      alert(
        "Please enter amount."
      );
      return;
    }

    try {
      const billingData = {
        date: form.date,

        type: form.type,

        company:
          form.company,

        paid_by:
          form.paid_by,

        payment_mode:
          form.payment_mode,

        amount:
          Number(form.amount),

        remarks:
          form.remarks,
      };

      let savedBilling;

      if (editId) {
        savedBilling =
          await updateBilling(
            editId,
            billingData
          );
      } else {
        savedBilling =
          await addBilling(
            billingData
          );
      }

      // ======================================================
      // EXPENSE → INVESTMENT SYNC
      //
      // Only Expense transactions are handled here.
      // All other transaction types remain unchanged.
      // ======================================================

      if (
        String(
          billingData.type || ""
        )
          .trim()
          .toLowerCase() ===
        "expense"
      ) {
        await syncExpenseInvestment({
          ...billingData,
          id: savedBilling.id,
        });
      }

      setShowForm(false);

      resetForm();

      await loadBilling();
    } catch (error) {
      console.error(
        "SAVE TRANSACTION ERROR:",
        error
      );

      alert(
        "Unable to save transaction."
      );
    }
  }

  // ==========================================================
  // DELETE
  // ==========================================================

  async function handleDelete(item) {
    if (
      !window.confirm(
        "Are you sure you want to delete this transaction?"
      )
    ) {
      return;
    }

    try {
      // ======================================================
      // REMOVE LINKED EXPENSE INVESTMENT FIRST
      // ======================================================

     await deleteBilling(item.id);

      await loadBilling();
    } catch (error) {
      console.error(
        "DELETE TRANSACTION ERROR:",
        error
      );

      alert(
        "Unable to delete this transaction."
      );
    }
  }

  // ==========================================================
  // TRANSACTION TABLE
  // ==========================================================

  function TransactionTable() {
  return (
      <div
        className="
          bg-white
          rounded-xl
          shadow
          border-2
          border-black
          overflow-hidden
        "
      >
        {/* HEADER */}

        <div
          className="
            bg-gradient-to-r
            from-slate-800
            to-emerald-600
            text-white
            px-4
            py-3
            flex
            items-center
            justify-between
          "
        >
          <div>
            <h2 className="text-lg font-bold">
              {selectedBlock ===
                "customer" &&
                "Customer Payments"}

              {selectedBlock ===
                "dealer" &&
                "Dealer Payments"}

              {selectedBlock ===
                "expense" &&
                "Expenses"}

              {selectedBlock ===
                "investment" &&
                "Investments"}
            </h2>

            <p className="text-xs text-white/80">
              {
                selectedTransactions.length
              }{" "}
              transaction
              {selectedTransactions.length !==
              1
                ? "s"
                : ""}
            </p>
          </div>

          <button
            onClick={() => {
              setSelectedBlock(null);
              setSearch("");
            }}
            className="
              bg-white
              text-slate-800
              px-4
              py-2
              rounded-lg
              font-semibold
              hover:bg-gray-100
            "
          >
            ← Back
          </button>
        </div>

        {/* SEARCH */}

        <div className="p-4">
          <div className="mb-4">
            <input
              type="text"
              placeholder="🔍 Search transaction"
              value={search}
              onChange={(e) =>
                setSearch(
                  e.target.value
                )
              }
              className="
                border-2
                border-black
                rounded-lg
                px-3
                py-2
                w-72
                outline-none
              "
            />
          </div>

          <div className="overflow-x-auto">
            <table
              className="
                w-full
                border-2
                border-black
                border-collapse
                whitespace-nowrap
              "
            >
              <thead
                className="
                  bg-gradient-to-r
                  from-indigo-600
                  to-emerald-500
                  text-white
                "
              >
                <tr>
                  <th className="px-3 py-2 text-center text-sm border border-black">
                    Date
                  </th>

                  <th className="px-3 py-2 text-center text-sm border border-black">
                    Paid By
                  </th>

                  <th className="px-3 py-2 text-center text-sm border border-black">
                    Description
                  </th>

                  <th className="px-3 py-2 text-center text-sm border border-black">
                    Mode
                  </th>

                  <th className="px-3 py-2 text-center text-sm border border-black">
                    Payment Type
                  </th>

                  <th className="px-3 py-2 text-center text-sm border border-black">
                    Amount
                  </th>

                  <th className="px-3 py-2 text-center text-sm border border-black">
  Description
</th>

                  
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="
                        text-center
                        py-6
                        font-semibold
                        border
                        border-black
                      "
                    >
                      Loading transactions...
                    </td>
                  </tr>
                ) : selectedTransactions.length ===
                  0 ? (
                  <tr>
                    <td
                      colSpan={
                        showActionColumn
                          ? 8
                          : 7
                      }
                      className="
                        text-center
                        py-6
                        text-gray-500
                        font-semibold
                        border
                        border-black
                      "
                    >
                      No transactions found
                    </td>
                  </tr>
                ) : (
                  selectedTransactions.map(
                    (item) => (
                      <tr
                        key={item.id}
                        className="
                          hover:bg-green-50
                          whitespace-nowrap
                        "
                      >
                        {/* DATE */}

                        <td
  className="
    px-3
    py-2
    text-sm
    text-center
    border
    border-black
    whitespace-nowrap
  "
>
  <button
    type="button"
    onClick={() =>
      openTransactionView(item)
    }
    className="
      font-semibold
      text-blue-700
      hover:text-blue-900
      hover:bg-blue-50
      px-2
      py-1
      rounded
      cursor-pointer
    "
  >
    {item.date
      ? new Date(
          item.date
        )
          .toLocaleDateString(
            "en-GB",
            {
              day: "numeric",
              month: "short",
              year: "numeric",
            }
          )
          .replaceAll(
            " ",
            "-"
          )
      : "-"}
  </button>
</td>

                        {/* PAID BY */}

                        <td
                          className="
                            px-3
                            py-2
                            text-sm
                            text-center
                            border
                            border-black
                            whitespace-nowrap
                          "
                        >
                          {item.paid_by ||
                            "-"}
                        </td>

                        {/* DESCRIPTION */}

                        <td
                          className="
                            px-3
                            py-2
                            text-sm
                            text-center
                            border
                            border-black
                            whitespace-nowrap
                          "
                        >
                          {item.company ||
                            "-"}
                        </td>

                        {/* MODE */}

                        <td
                          className="
                            px-3
                            py-2
                            text-sm
                            text-center
                            border
                            border-black
                            whitespace-nowrap
                          "
                        >
                          {item.payment_mode ||
                            "-"}
                        </td>

                        {/* PAYMENT TYPE */}

                        <td
                          className={`
                            px-3
                            py-2
                            text-sm
                            font-semibold
                            text-center
                            border
                            border-black
                            whitespace-nowrap
                            ${
                              item.type ===
                              "Income"
                                ? "text-green-600"
                                : "text-red-600"
                            }
                          `}
                        >
                          {item.type ===
                          "Income"
                            ? "Credit"
                            : "Debit"}
                        </td>

                        {/* AMOUNT */}

                        <td
                          className={`
                            px-3
                            py-2
                            text-sm
                            font-semibold
                            text-center
                            border
                            border-black
                            whitespace-nowrap
                            ${
                              item.type ===
                              "Income"
                                ? "text-green-700"
                                : "text-red-600"
                            }
                          `}
                        >
                          {money(
                            item.amount
                          )}
                        </td>

                      {/* DESCRIPTION */}

<td
  className="
    px-3
    py-2
    text-sm
    text-center
    border
    border-black
    whitespace-nowrap
  "
>
  {item.remarks || "-"}
</td>

 
                      </tr>
                    )
                  )
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================================
  // PLANT EXPENSE TABLE
  // ==========================================================

  function PlantExpenseTable() {
    return (
      <div
        className="
          bg-white
          rounded-2xl
          shadow-xl
          border-2
          border-black
          overflow-hidden
        "
      >
        {/* HEADER */}

        <div
          className="
            px-5
            py-4
            bg-gradient-to-r
            from-orange-500
            to-amber-600
            text-white
            flex
            items-center
            justify-between
          "
        >
          <div>
            <h2 className="text-xl font-bold">
              Plant cost
            </h2>

            <p className="text-sm text-white/80">
              Project-wise plant cost and actual material
              consumption expense
            </p>
          </div>

          <div className="text-center">
            <p className="text-xs text-white/80">
              Total Expense
            </p>

            <p className="text-2xl font-bold">
              {money(totalPlantExpense)}
            </p>
          </div>
        </div>

        {/* BACK BUTTON */}

        <div className="p-3 border-b-2 border-black">
          <button
            onClick={() => {
              setSelectedBlock(null);
              setSearch("");
            }}
            className="
              bg-gray-800
              text-white
              px-4
              py-2
              rounded-lg
              font-semibold
              hover:bg-black
            "
          >
            ← Back
          </button>
        </div>

        {/* TABLE */}

        <div className="overflow-x-auto">
          <table
            className="
              min-w-full
              border-collapse
              border-2
              border-black
              whitespace-nowrap
            "
          >
            {/* HEADER */}

            <thead className="bg-orange-600 text-white">
              <tr>
                <th
                  className="
                    px-4
                    py-3
                    border
                    border-black
                    text-center
                  "
                >
                  Project No
                </th>

                <th
                  className="
                    px-4
                    py-3
                    border
                    border-black
                    text-center
                  "
                >
                  Customer Name
                </th>

                <th
                  className="
                    px-4
                    py-3
                    border
                    border-black
                    text-center
                  "
                >
                  Plant Size
                </th>

                <th
                  className="
                    px-4
                    py-3
                    border
                    border-black
                    text-center
                  "
                >
                  Location
                </th>

                <th
                  className="
                    px-4
                    py-3
                    border
                    border-black
                    text-center
                  "
                >
                  Payment Type
                </th>

                <th
                  className="
                    px-4
                    py-3
                    border
                    border-black
                    text-center
                  "
                >
                  Total Cost
                </th>

                <th
                  className="
                    px-4
                    py-3
                    border
                    border-black
                    text-center
                  "
                >
                  Total Expense
                </th>
              </tr>
            </thead>

            {/* BODY */}

            <tbody>
              {plantExpenses.length === 0 ? (
                <tr>
                  <td
                    colSpan="7"
                    className="
                      px-4
                      py-8
                      text-center
                      border
                      border-black
                      text-gray-500
                      font-semibold
                    "
                  >
                    No plant expense records found
                  </td>
                </tr>
              ) : (
                plantExpenses.map(
                  (item, index) => (
                    <tr
                      key={`${
                        item.project_id ||
                        item.project_no
                      }-${index}`}
                      className="
                        hover:bg-orange-50
                        whitespace-nowrap
                      "
                    >
                      {/* PROJECT NO */}

                      <td
  className="
    px-4
    py-3
    border
    border-black
    text-center
    font-semibold
  "
>
  <button
    type="button"
    onClick={() =>
      setViewPlantExpense(item)
    }
    className="
      text-blue-700
      hover:text-blue-900
      hover:bg-orange-50
      px-2
      py-1
      rounded
      cursor-pointer
    "
  >
    {item.project_no}
  </button>
</td>

                      {/* CUSTOMER */}

                      <td
                        className="
                          px-4
                          py-3
                          border
                          border-black
                          text-center
                          font-semibold
                        "
                      >
                        {item.customer_name}
                      </td>

                      {/* PLANT SIZE */}

                      <td
                        className="
                          px-4
                          py-3
                          border
                          border-black
                          text-center
                          font-semibold
                        "
                      >
                        {formatPlantSize(
                          item.plant_size
                        )}
                      </td>

                      {/* LOCATION */}

                      <td
                        className="
                          px-4
                          py-3
                          border
                          border-black
                          text-center
                        "
                      >
                        {item.location}
                      </td>

                      {/* PAYMENT TYPE */}

                      <td
                        className="
                          px-4
                          py-3
                          border
                          border-black
                          text-center
                        "
                      >
                        {item.payment_type}
                      </td>

                      {/* TOTAL COST */}

                      <td
                        className="
                          px-4
                          py-3
                          border
                          border-black
                          text-center
                          font-semibold
                        "
                      >
                        {money(
                          item.total_cost
                        )}
                      </td>

                      {/* TOTAL EXPENSE */}

                      <td
                        className="
                          px-4
                          py-3
                          border
                          border-black
                          text-center
                          font-bold
                          text-orange-700
                        "
                      >
                        {money(
                          item.total_expense
                        )}
                      </td>
                    </tr>
                  )
                )
              )}
            </tbody>

            {/* TOTALS */}

            {plantExpenses.length > 0 && (
              <tfoot>
                <tr
                  className="
                    bg-orange-100
                    font-bold
                  "
                >
                  {/* TOTAL LABEL */}

                  <td
                    colSpan="5"
                    className="
                      px-4
                      py-3
                      border
                      border-black
                      text-center
                    "
                  >
                    TOTAL
                  </td>

                  {/* TOTAL COST */}

                  <td
                    className="
                      px-4
                      py-3
                      border
                      border-black
                      text-center
                      text-blue-800
                    "
                  >
                    {money(
                      plantExpenses.reduce(
                        (sum, item) =>
                          sum +
                          Number(
                            item.total_cost || 0
                          ),
                        0
                      )
                    )}
                  </td>

                  {/* TOTAL EXPENSE */}

                  <td
                    className="
                      px-4
                      py-3
                      border
                      border-black
                      text-center
                      text-orange-700
                    "
                  >
                    {money(
                      totalPlantExpense
                    )}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    );
  }

  // ==========================================================
  // ATTRACTIVE FINANCE BLOCK
  // ==========================================================

  function LedgerBlock({
    title,
    description,
    amount,
    count,
    color,
    onClick,
  }) {
    const colorClasses = {
      green: {
        border: "border-emerald-300",
        bg: "from-emerald-50 via-white to-cyan-100",
        icon: "from-emerald-500 to-cyan-500",
        title: "text-emerald-800",
        amount: "text-emerald-700",
        badge:
          "bg-emerald-100 text-emerald-700",
        hover:
          "hover:from-emerald-100 hover:to-cyan-200",
      },

      red: {
        border: "border-rose-300",
        bg: "from-rose-50 via-white to-orange-100",
        icon: "from-rose-500 to-orange-500",
        title: "text-rose-800",
        amount: "text-rose-700",
        badge:
          "bg-rose-100 text-rose-700",
        hover:
          "hover:from-rose-100 hover:to-orange-200",
      },

      purple: {
        border: "border-violet-300",
        bg: "from-violet-50 via-white to-indigo-100",
        icon: "from-violet-500 to-indigo-500",
        title: "text-violet-800",
        amount: "text-violet-700",
        badge:
          "bg-violet-100 text-violet-700",
        hover:
          "hover:from-violet-100 hover:to-indigo-200",
      },

      orange: {
        border: "border-orange-300",
        bg: "from-orange-50 via-white to-amber-100",
        icon: "from-orange-500 to-amber-500",
        title: "text-orange-800",
        amount: "text-orange-700",
        badge:
          "bg-orange-100 text-orange-700",
        hover:
          "hover:from-orange-100 hover:to-amber-200",
      },
    };

    const theme =
      colorClasses[color] ||
      colorClasses.green;

    return (
      <button
        onClick={onClick}
        className={`
          group
          relative
          w-full
          text-left
          overflow-hidden
          rounded-2xl
          border
          ${theme.border}
          bg-gradient-to-br
          ${theme.bg}
          p-5
          shadow-md
          hover:shadow-2xl
          hover:-translate-y-1
          transition-all
          duration-300
          ${theme.hover}
        `}
      >
        {/* TOP DECORATIVE STRIP */}

        <div
          className={`
            absolute
            top-0
            left-0
            right-0
            h-1
            bg-gradient-to-r
            ${theme.icon}
          `}
        />

        {/* MAIN CONTENT */}

        <div className="flex items-center justify-between gap-4">
          {/* LEFT */}

          <div className="flex items-center gap-4 min-w-0">
            {/* ICON */}

            <div
              className={`
                w-14
                h-14
                rounded-2xl
                bg-gradient-to-br
                ${theme.icon}
                flex
                items-center
                justify-center
                text-white
                shadow-lg
                flex-shrink-0
                group-hover:scale-105
                transition-transform
                duration-300
              `}
            >
              <span className="text-2xl font-black">
                ₹
              </span>
            </div>

            {/* TEXT */}

            <div className="min-w-0">
              <h2
                className={`
                  text-lg
                  md:text-xl
                  font-extrabold
                  ${theme.title}
                  truncate
                `}
              >
                {title}
              </h2>

              <p className="text-xs md:text-sm text-gray-600 mt-1 line-clamp-2">
                {description}
              </p>
            </div>
          </div>

          {/* AMOUNT */}

          <div className="text-right flex-shrink-0">
            <p className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">
              Amount
            </p>

            <p
              className={`
                text-xl
                md:text-2xl
                font-black
                ${theme.amount}
                whitespace-nowrap
                mt-1
              `}
            >
              {money(amount)}
            </p>
          </div>
        </div>

        {/* FOOTER */}

        <div className="mt-5 flex items-center justify-between">
          <span
            className={`
              px-3
              py-1
              rounded-full
              text-xs
              font-bold
              ${theme.badge}
            `}
          >
            {count} transaction
            {count !== 1 ? "s" : ""}
          </span>

          <span
            className={`
              text-sm
              font-bold
              ${theme.title}
              group-hover:translate-x-1
              transition-transform
            `}
          >
            View →
          </span>
        </div>
      </button>
    );
  }

  // ==========================================================
  // MAIN UI
  // ==========================================================

  return (
    <div
      className="
        p-4
        bg-gray-100
        min-h-screen
      "
    >
      {/* ======================================================
          HEADER
      ====================================================== */}

      <div
        className="
          mb-5
          rounded-2xl
          bg-gradient-to-r
          from-emerald-700
          via-indigo-600
          to-teal-500
          p-5
          shadow-xl
        "
      >
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">
              Finance Ledger
            </h1>

            <p className="text-green-100 mt-1">
              Complete financial transaction overview
            </p>
          </div>

          <button
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
            className="
              bg-white
              text-emerald-700
              px-4
              py-2
              rounded-lg
              font-semibold
              shadow
              hover:bg-gray-100
              whitespace-nowrap
            "
          >
            + Add Transaction
          </button>
        </div>
      </div>

      {/* ======================================================
          KPI CARDS
      ====================================================== */}

      <div className="flex justify-right mb-5">
        <div className="w-full max-w-xs">
          <KpiCard
            title="Net Balance"
            value={money(netBalance)}
            color="purple"
          />
        </div>
      </div>

{/* ======================================================
    VIEW TRANSACTION MODAL
====================================================== */}

{viewTransaction && (
  <div
    className="
      fixed
      inset-0
      z-50
      bg-black/50
      flex
      items-center
      justify-center
      p-4
    "
  >
    <div
      className="
        bg-white
        rounded-2xl
        shadow-2xl
        border-2
        border-black
        p-5
        w-full
        max-w-xl
      "
    >
      {/* HEADER */}

      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl font-bold text-slate-800">
          Transaction Details
        </h2>

        <button
          type="button"
          onClick={() =>
            setViewTransaction(null)
          }
          className="
            text-gray-600
            hover:text-black
            text-xl
            font-bold
          "
        >
          ✕
        </button>
      </div>

      {/* DETAILS */}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        <div className="border-2 border-black rounded-lg p-3">
          <p className="text-xs font-bold text-gray-500">
            Date
          </p>

          <p className="font-semibold mt-1">
            {viewTransaction.date
              ? new Date(
                  viewTransaction.date
                )
                  .toLocaleDateString(
                    "en-GB",
                    {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    }
                  )
                  .replaceAll(
                    " ",
                    "-"
                  )
              : "-"}
          </p>
        </div>

        <div className="border-2 border-black rounded-lg p-3">
          <p className="text-xs font-bold text-gray-500">
            Transaction Type
          </p>

          <p className="font-semibold mt-1">
            {viewTransaction.type || "-"}
          </p>
        </div>

        <div className="border-2 border-black rounded-lg p-3">
          <p className="text-xs font-bold text-gray-500">
            Paid By
          </p>

          <p className="font-semibold mt-1">
            {viewTransaction.paid_by || "-"}
          </p>
        </div>

        <div className="border-2 border-black rounded-lg p-3">
          <p className="text-xs font-bold text-gray-500">
            Description
          </p>

          <p className="font-semibold mt-1">
            {viewTransaction.company || "-"}
          </p>
        </div>

        <div className="border-2 border-black rounded-lg p-3">
          <p className="text-xs font-bold text-gray-500">
            Payment Mode
          </p>

          <p className="font-semibold mt-1">
            {viewTransaction.payment_mode || "-"}
          </p>
        </div>

        <div className="border-2 border-black rounded-lg p-3">
          <p className="text-xs font-bold text-gray-500">
            Payment Type
          </p>

          <p
            className={`font-bold mt-1 ${
              viewTransaction.type === "Income"
                ? "text-green-600"
                : "text-red-600"
            }`}
          >
            {viewTransaction.type === "Income"
              ? "Credit"
              : "Debit"}
          </p>
        </div>

        <div className="border-2 border-black rounded-lg p-3">
          <p className="text-xs font-bold text-gray-500">
            Amount
          </p>

          <p
            className={`font-bold text-lg mt-1 ${
              viewTransaction.type === "Income"
                ? "text-green-700"
                : "text-red-600"
            }`}
          >
            {money(viewTransaction.amount)}
          </p>
        </div>

        <div className="border-2 border-black rounded-lg p-3">
          <p className="text-xs font-bold text-gray-500">
            Remarks
          </p>

          <p className="font-semibold mt-1">
            {viewTransaction.remarks || "-"}
          </p>
        </div>

      </div>

      {/* CLOSE */}

      <div className="flex justify-end mt-5">
        <button
          type="button"
          onClick={() =>
            setViewTransaction(null)
          }
          className="
            bg-gray-800
            text-white
            px-6
            py-2
            rounded-lg
            font-semibold
            hover:bg-black
          "
        >
          Close
        </button>
      </div>
    </div>
  </div>
)}

{/* ======================================================
    VIEW PLANT EXPENSE MODAL
====================================================== */}

{viewPlantExpense && (
  <div
    className="
      fixed
      inset-0
      z-50
      bg-black/50
      flex
      items-center
      justify-center
      p-4
    "
  >
    <div
      className="
        bg-white
        rounded-2xl
        shadow-2xl
        border-2
        border-black
        p-5
        w-full
        max-w-xl
      "
    >
      {/* HEADER */}

      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl font-bold text-orange-700">
          Plant Cost Details
        </h2>

        <button
          type="button"
          onClick={() =>
            setViewPlantExpense(null)
          }
          className="
            text-gray-600
            hover:text-black
            text-xl
            font-bold
          "
        >
          ✕
        </button>
      </div>

      {/* DETAILS */}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        <div className="border-2 border-black rounded-lg p-3">
          <p className="text-xs font-bold text-gray-500">
            Project No
          </p>

          <p className="font-bold text-orange-700 mt-1">
            {viewPlantExpense.project_no || "-"}
          </p>
        </div>

        <div className="border-2 border-black rounded-lg p-3">
          <p className="text-xs font-bold text-gray-500">
            Customer Name
          </p>

          <p className="font-semibold mt-1">
            {viewPlantExpense.customer_name || "-"}
          </p>
        </div>

        <div className="border-2 border-black rounded-lg p-3">
          <p className="text-xs font-bold text-gray-500">
            Plant Size
          </p>

          <p className="font-semibold mt-1">
            {formatPlantSize(
              viewPlantExpense.plant_size
            )}
          </p>
        </div>

        <div className="border-2 border-black rounded-lg p-3">
          <p className="text-xs font-bold text-gray-500">
            Location
          </p>

          <p className="font-semibold mt-1">
            {viewPlantExpense.location || "-"}
          </p>
        </div>

        <div className="border-2 border-black rounded-lg p-3">
          <p className="text-xs font-bold text-gray-500">
            Payment Type
          </p>

          <p className="font-semibold mt-1">
            {viewPlantExpense.payment_type || "-"}
          </p>
        </div>

        <div className="border-2 border-black rounded-lg p-3">
          <p className="text-xs font-bold text-gray-500">
            Total Cost
          </p>

          <p className="font-bold text-blue-700 mt-1">
            {money(
              viewPlantExpense.total_cost
            )}
          </p>
        </div>

        <div className="border-2 border-black rounded-lg p-3 md:col-span-2">
          <p className="text-xs font-bold text-gray-500">
            Total Expense
          </p>

          <p className="font-bold text-xl text-orange-700 mt-1">
            {money(
              viewPlantExpense.total_expense
            )}
          </p>
        </div>

      </div>

      {/* CLOSE */}

      <div className="flex justify-end mt-5">
        <button
          type="button"
          onClick={() =>
            setViewPlantExpense(null)
          }
          className="
            bg-gray-800
            text-white
            px-6
            py-2
            rounded-lg
            font-semibold
            hover:bg-black
          "
        >
          Close
        </button>
      </div>
    </div>
  </div>
)}

      {/* ======================================================
          ADD / EDIT FORM
      ====================================================== */}

      {showForm && (
        <div
          className="
            fixed
            inset-0
            z-50
            bg-black/50
            flex
            items-center
            justify-center
            p-4
          "
        >
          <div
            className="
              bg-white
              rounded-2xl
              shadow-2xl
              border-2
              border-black
              p-5
              w-full
              max-w-2xl
              max-h-[90vh]
              overflow-y-auto
            "
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold">
                {editId
                  ? "Edit Transaction"
                  : "Add Transaction"}
              </h2>

              <button
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
                className="
                  text-gray-600
                  hover:text-black
                  text-xl
                  font-bold
                "
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* TYPE */}

              <select
                className="
                  border-2
                  border-black
                  p-3
                  rounded
                "
                value={form.type}
                onChange={(e) => {
                  const type =
                    e.target.value;

                  let company =
                    form.company;

                  if (
                    type ===
                    "Installation Charges"
                  ) {
                    company =
                      "Shailendra";
                  }

                  if (
                    type ===
                    "JE Charge"
                  ) {
                    company =
                      "MPEB";
                  }

                  if (
                    type ===
                      "Expense" ||
                    type ===
                      "Dealer Payment" ||
                    type ===
                      "Vendor Payment"
                  ) {
                    company = "";
                  }

                  setForm({
                    ...form,
                    type,
                    company,
                  });
                }}
              >
                <option value="Expense">
                  Expense
                </option>

                <option value="Dealer Payment">
                  Dealer Payment
                </option>

                <option value="Vendor Payment">
                  Vendor Payment
                </option>

                <option value="Installation Charges">
                  Installation Charges
                </option>

                <option value="JE Charge">
                  JE Charge
                </option>
              </select>

              {/* DATE */}

              <input
                type="date"
                className="
                  border-2
                  border-black
                  p-3
                  rounded
                "
                value={form.date}
                onChange={(e) =>
                  setForm({
                    ...form,
                    date:
                      e.target.value,
                  })
                }
              />

              {/* COMPANY / DESCRIPTION */}

              <input
                className="
                  border-2
                  border-black
                  p-3
                  rounded
                  bg-gray-50
                "
                placeholder="Company / Description"
                value={form.company}
                readOnly={
                  form.type ===
                    "Installation Charges" ||
                  form.type ===
                    "JE Charge"
                }
                onChange={(e) =>
                  setForm({
                    ...form,
                    company:
                      e.target.value,
                  })
                }
              />

              {/* PAID BY */}

              {form.type === "Expense" ? (
                <select
                  className="
                    border-2
                    border-black
                    p-3
                    rounded
                  "
                  value={form.paid_by}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      paid_by:
                        e.target.value,
                    })
                  }
                >
                  <option value="Shiv Shakti Solar">
                    Shiv Shakti Solar
                  </option>

                  <option value="Prashun Dixit">
                    Prashun Dixit
                  </option>

                  <option value="Shaubhendu Dixit">
                    Shaubhendu Dixit
                  </option>

                  <option value="Vipin Saxena">
                    Vipin Saxena
                  </option>
                </select>
              ) : (
                <div
                  className="
                    border-2
                    border-emerald-300
                    bg-emerald-50
                    p-3
                    rounded
                    font-semibold
                    text-emerald-800
                  "
                >
                  Shiv Shakti Solar
                </div>
              )}

              {/* MODE */}

              <select
                className="
                  border-2
                  border-black
                  p-3
                  rounded
                "
                value={
                  form.payment_mode
                }
                onChange={(e) =>
                  setForm({
                    ...form,
                    payment_mode:
                      e.target.value,
                  })
                }
              >
                <option value="Cash">
                  Cash
                </option>

                <option value="UPI">
                  UPI
                </option>

                <option value="Bank">
                  Bank
                </option>

                <option value="Cheque">
                  Cheque
                </option>
              </select>

              {/* AMOUNT */}

              <input
                type="number"
                className="
                  border-2
                  border-black
                  p-3
                  rounded
                "
                placeholder="Amount"
                value={form.amount}
                onChange={(e) =>
                  setForm({
                    ...form,
                    amount:
                      e.target.value,
                  })
                }
              />

              {/* REMARKS */}

              <input
                className="
                  border-2
                  border-black
                  p-3
                  rounded
                  md:col-span-2
                "
                placeholder="Remarks"
                value={form.remarks}
                onChange={(e) =>
                  setForm({
                    ...form,
                    remarks:
                      e.target.value,
                  })
                }
              />
            </div>

            <div className="flex gap-3 mt-5">
              <button
                onClick={
                  saveTransaction
                }
                className="
                  bg-green-600
                  text-white
                  px-6
                  py-3
                  rounded-lg
                  font-semibold
                  hover:bg-green-700
                "
              >
                {editId
                  ? "Update Transaction"
                  : "Save Transaction"}
              </button>

              <button
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
                className="
                  bg-gray-500
                  text-white
                  px-6
                  py-3
                  rounded-lg
                  font-semibold
                  hover:bg-gray-600
                "
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================
          BLOCKS
      ====================================================== */}

      {!selectedBlock && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* CUSTOMER PAYMENT */}

          <LedgerBlock
            title="Customer Payment"
            description="All customer payments"
            amount={
              totalCustomerPayment
            }
            count={
              customerPaymentTransactions.length
            }
            color="green"
            onClick={() =>
              setSelectedBlock(
                "customer"
              )
            }
          />

          {/* DEALER PAYMENT */}

          <LedgerBlock
            title="Dealer Payment"
            description="Payments made by Shiv Shakti Solar"
            amount={
              totalDealerPayment
            }
            count={
              dealerPaymentTransactions.length
            }
            color="red"
            onClick={() =>
              setSelectedBlock(
                "dealer"
              )
            }
          />

          {/* EXPENSE */}

          <LedgerBlock
            title="Expense"
            description="Normal expenses and vendor payments"
            amount={
              totalNormalExpense
            }
            count={
              expenseTransactions.length
            }
            color="red"
            onClick={() =>
              setSelectedBlock(
                "expense"
              )
            }
          />

          {/* INVESTMENT */}

          <LedgerBlock
            title="Investment"
            description="Investments, investor-paid expenses and investor-paid dealer payments"
            amount={
              totalInvestment
            }
            count={
              investmentTransactions.length
            }
            color="purple"
            onClick={() =>
              setSelectedBlock(
                "investment"
              )
            }
          />

          {/* TOTAL PLANT EXPENSE */}

          <button
            onClick={() =>
              setSelectedBlock(
                "plantExpense"
              )
            }
            className="
              w-full
              text-left
              bg-white
              rounded-xl
              border-2
              border-black
              shadow
              p-5
              hover:bg-orange-50
              hover:shadow-xl
              hover:-translate-y-1
              transition-all
            "
          >
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <h2 className="text-xl font-bold text-orange-700">
                  Plant cost
                </h2>

                <p className="text-sm text-gray-500 mt-1">
                  Project-wise plant cost and actual expense
                </p>
              </div>

              <div
                className="
                  text-2xl
                  font-bold
                  text-orange-700
                  whitespace-nowrap
                "
              >
                {money(
                  totalPlantExpense
                )}
              </div>
            </div>

            <div className="mt-4 text-sm font-semibold text-gray-500">
              {plantExpenses.length} project
              {plantExpenses.length !==
              1
                ? "s"
                : ""}

              <span className="float-right">
                View →
              </span>
            </div>
          </button>
        </div>
      )}

      {/* ======================================================
          SELECTED CUSTOMER / DEALER / INVESTMENT
      ====================================================== */}

      {selectedBlock &&
        selectedBlock !==
          "plantExpense" && (
          <TransactionTable />
        )}

      {/* ======================================================
          SELECTED PLANT EXPENSE
      ====================================================== */}

      {selectedBlock ===
        "plantExpense" && (
        <PlantExpenseTable />
      )}
    </div>
  );
}