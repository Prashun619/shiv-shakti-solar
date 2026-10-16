import html2pdf from "html2pdf.js";

import { useCallback, useEffect, useState } from "react";
import {
  ReceiptText,
  CalendarDays,
  RotateCcw,
  Printer,
  Plus,
  X,
  Save,
  Pencil,
  Trash2,
  Search,
} from "lucide-react";
import { supabase } from "../services/supabase";

const today = () => {
  const date = new Date();
  const localDate = new Date(
    date.getTime() - date.getTimezoneOffset() * 60000
  );
  return localDate.toISOString().split("T")[0];
};


const emptyForm = () => ({
  receiptNumber: "",
  customerName: "",
  paymentDate: today(),
  amount: "",
  paymentMode: "Cash",
  remarks: "",
  bankName: "",
  customBankName: "",
});


const predefinedBankNames = [
  "Central Bank of India",
  "Canara Bank",
  "Indian Bank",
  "Madhya Pradesh Gramin Bank",
  "Punjab National Bank",
  "State Bank of India",
  "Union Bank of India",
];

function getBankFormValues(remarks) {
  const bank = String(remarks || "").trim();

  if (predefinedBankNames.includes(bank)) {
    return {
      bankName: bank,
      customBankName: "",
    };
  }

  return {
    bankName: bank ? "Other" : "",
    customBankName: bank,
  };
}



const inputClass =
  "w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-800 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100";

const formatDate = (date) => {
  if (!date) return "";

  const [year, month, day] = String(date).slice(0, 10).split("-");
  if (!year || !month || !day) return date;

  const monthName = new Date(
    Number(year),
    Number(month) - 1,
    Number(day)
  ).toLocaleString("en-GB", { month: "short" });

  return `${day}-${monthName}-${year}`;
};


function amountInWords(value) {
  const amount = Number(value || 0);

  if (!Number.isFinite(amount) || amount < 0) return "Zero Rupees Only";

  const whole = Math.floor(amount);
  const paise = Math.round((amount - whole) * 100);

  const ones = [
    "Zero", "One", "Two", "Three", "Four", "Five", "Six",
    "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve",
    "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen",
    "Eighteen", "Nineteen",
  ];

  const tens = [
    "", "", "Twenty", "Thirty", "Forty", "Fifty",
    "Sixty", "Seventy", "Eighty", "Ninety",
  ];

  function belowThousand(n) {
    let result = "";

    if (n >= 100) {
      result += ones[Math.floor(n / 100)] + " Hundred";
      n %= 100;
      if (n) result += " ";
    }

    if (n >= 20) {
      result += tens[Math.floor(n / 10)];
      n %= 10;
      if (n) result += " " + ones[n];
    } else if (n > 0) {
      result += ones[n];
    }

    return result;
  }

  function indianNumber(n) {
    if (n === 0) return "Zero";

    const parts = [];

    const crore = Math.floor(n / 10000000);
    n %= 10000000;

    const lakh = Math.floor(n / 100000);
    n %= 100000;

    const thousand = Math.floor(n / 1000);
    n %= 1000;

    if (crore) parts.push(belowThousand(crore) + " Crore");
    if (lakh) parts.push(belowThousand(lakh) + " Lakh");
    if (thousand) parts.push(belowThousand(thousand) + " Thousand");
    if (n) parts.push(belowThousand(n));

    return parts.join(" ");
  }

  let words = indianNumber(whole) + " Rupees";

  if (paise > 0) {
    words += " and " + belowThousand(paise) + " Paise";
  }

  return words + " Only";
}

export default function PaymentReceipt() {
  const [showForm, setShowForm] = useState(false);
  const [receipts, setReceipts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("success");
  const [searchTerm, setSearchTerm] = useState("");
const [selectedReceipt, setSelectedReceipt] = useState(null);
const [viewMode, setViewMode] = useState(false);
const [isOtherBank, setIsOtherBank] = useState(false);
  const currentYear = new Date().getFullYear();

  const notify = (text, type = "success") => {
    setMessage(text);
    setMessageType(type);
  };

  const loadCustomers = useCallback(async () => {
    const { data, error } = await supabase
      .from("customers")
      .select("id, customer_name, created_at")
      .order("created_at", { ascending: true });

    if (error) {
      notify(`Unable to load customers: ${error.message}`, "error");
      return;
    }

    setCustomers(data || []);
  }, []);

  const loadReceipts = useCallback(async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("payment_receipts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      notify(`Unable to load receipts: ${error.message}`, "error");
    } else {
      setReceipts(data || []);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    loadReceipts();
    loadCustomers();
  }, [loadReceipts, loadCustomers]);

  // Automatically open the form in the new tab.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    if (params.get("createReceipt") === "1") {
      openNewForm();
    }
  }, []);

  async function getNextReceiptNumber() {
    const prefix = `PR-${currentYear}-`;

    const { data, error } = await supabase
      .from("payment_receipts")
      .select("receipt_number")
      .like("receipt_number", `${prefix}%`);

    if (error) throw error;

    const usedNumbers = new Set(
      (data || [])
        .map((receipt) => {
          const match = receipt.receipt_number?.match(
            new RegExp(`^PR-${currentYear}-(\\d+)$`)
          );
          return match ? Number(match[1]) : null;
        })
        .filter((number) => number !== null)
    );

    let next = 1;
    while (usedNumbers.has(next)) next += 1;

    return `${prefix}${String(next).padStart(3, "0")}`;
  }

  function updateField(field, value) {
    setForm((previous) => ({ ...previous, [field]: value }));
  }

  async function openNewForm() {
    setEditingId(null);
    setForm(emptyForm());
    setMessage("");
    setShowForm(true);

    try {
      const nextNumber = await getNextReceiptNumber();
      setForm((previous) => ({
        ...previous,
        receiptNumber: nextNumber,
      }));
    } catch (error) {
      notify(`Unable to generate receipt number: ${error.message}`, "error");
    }
  }


async function openFormInNewWindow() {
  setEditingId(null);
  setSelectedReceipt(null);
  setViewMode(false);
  setMessage("");
  setForm(emptyForm());
  setShowForm(true);

  try {
    const nextNumber = await getNextReceiptNumber();

    setForm((previous) => ({
      ...previous,
      receiptNumber: nextNumber,
    }));
  } catch (error) {
    notify(
      `Unable to generate receipt number: ${error.message}`,
      "error"
    );
  }
}


function handleReset() {
    if (editingId) {
      const receipt = receipts.find((item) => item.id === editingId);

      if (receipt) {
        setForm({
          receiptNumber: receipt.receipt_number || "",
          customerName: receipt.customer_name || "",
          paymentDate: receipt.payment_date || today(),
          amount: String(receipt.amount ?? ""),
          paymentMode: receipt.payment_mode || "Cash",
          remarks: receipt.remarks || "",
...getBankFormValues(receipt.remarks),
        });
        return;
      }
    }

    setForm(emptyForm());

    getNextReceiptNumber()
      .then((number) => {
        setForm((previous) => ({
          ...previous,
          receiptNumber: number,
        }));
      })
      .catch((error) => {
        notify(`Unable to generate receipt number: ${error.message}`, "error");
      });
  }

  async function handleSave(event) {
    event.preventDefault();
    setMessage("");

    const receiptNumber = form.receiptNumber.trim();
    const customerName = form.customerName.trim();
    const amount = Number(form.amount);

    if (!receiptNumber || !customerName || !form.paymentDate) {
      notify("Please fill in all required fields.", "error");
      return;
    }

    if (!Number.isFinite(amount) || amount < 0) {
      notify("Please enter a valid amount.", "error");
      return;
    }

    setSaving(true);

    try {
      let duplicateQuery = supabase
        .from("payment_receipts")
        .select("id")
        .eq("receipt_number", receiptNumber);

      if (editingId) {
        duplicateQuery = duplicateQuery.neq("id", editingId);
      }

      const { data: duplicates, error: duplicateError } =
        await duplicateQuery;

      if (duplicateError) throw duplicateError;

      if (duplicates?.length) {
        notify(
          "This receipt number already exists. Please use another number.",
          "error"
        );
        return;
      }

      
const payload = {
  receipt_number: receiptNumber,
  customer_name: customerName,
  payment_date: form.paymentDate,
  amount,
  payment_mode: form.paymentMode,
  remarks: (
    form.bankName === "Other"
      ? form.customBankName
      : form.bankName
  ).trim(),
};


      const result = editingId
        ? await supabase
            .from("payment_receipts")
            .update(payload)
            .eq("id", editingId)
        : await supabase
            .from("payment_receipts")
            .insert([payload]);

      if (result.error) {
        if (result.error.code === "23505") {
          throw new Error("This receipt number already exists.");
        }
        throw result.error;
      }

      notify(
        editingId
          ? "Receipt updated successfully."
          : "Receipt saved successfully."
      );

      setEditingId(null);
      setForm(emptyForm());
      setShowForm(false);

      await loadReceipts();
    } catch (error) {
      notify(`Unable to save receipt: ${error.message}`, "error");
    } finally {
      setSaving(false);
    }
  }

  function handleEdit(receipt) {
    setEditingId(receipt.id);
    setForm({
      receiptNumber: receipt.receipt_number || "",
      customerName: receipt.customer_name || "",
      paymentDate: receipt.payment_date || today(),
      amount: String(receipt.amount ?? ""),
      paymentMode: receipt.payment_mode || "Cash",
      remarks: receipt.remarks || "",
...getBankFormValues(receipt.remarks),
    });
    setMessage("");
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleDelete(receipt) {
    const confirmed = window.confirm(
      `Delete receipt ${receipt.receipt_number} for ${receipt.customer_name}? This action cannot be undone.`
    );

    if (!confirmed) return;

    const { error } = await supabase
      .from("payment_receipts")
      .delete()
      .eq("id", receipt.id);

    if (error) {
      notify(`Unable to delete receipt: ${error.message}`, "error");
      return;
    }

    if (editingId === receipt.id) {
      setEditingId(null);
      setForm(emptyForm());
      setShowForm(false);
    }

    notify("Receipt deleted successfully. Its number is available for reuse.");
    await loadReceipts();
  }

  function handlePrint(event) {
    event.preventDefault();
    window.print();
  }

async function handleDownloadPDF() {
  const receipt = document.getElementById("receipt-document");

  if (!receipt || !viewMode) {
    notify("Open a saved receipt before downloading its PDF.", "error");
    return;
  }

  try {
    const options = {
      margin: [10, 10, 10, 10],
      filename: `${form.receiptNumber || "Payment-Receipt"}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
      },
      jsPDF: {
        unit: "mm",
        format: "a4",
        orientation: "portrait",
      },
    };

    await html2pdf().set(options).from(receipt).save();
  } catch (error) {
    notify(`Unable to download PDF: ${error.message}`, "error");
  }
}

  // Clicking a receipt number opens the receipt for editing.

function handleView(receipt) {
  setSelectedReceipt(receipt);
  setViewMode(true);
  setEditingId(null);

  setForm({
    receiptNumber: receipt.receipt_number || "",
    customerName: receipt.customer_name || "",
    paymentDate: receipt.payment_date || today(),
    amount: String(receipt.amount ?? ""),
    paymentMode: receipt.payment_mode || "Cash",
    remarks: receipt.remarks || "",
...getBankFormValues(receipt.remarks),
  });

  setMessage("");
  setShowForm(true);

  window.scrollTo({ top: 0, behavior: "smooth" });
}


  const filteredReceipts = receipts.filter((receipt) => {
    const query = searchTerm.trim().toLowerCase();

    if (!query) return true;

    return [
      receipt.receipt_number,
      receipt.customer_name,
      formatDate(receipt.payment_date),
      receipt.payment_date,
      receipt.payment_mode,
      receipt.amount,
      receipt.remarks,
    ].some((value) =>
      String(value ?? "").toLowerCase().includes(query)
    );
  });

  const tableCellClass =
    "border border-black px-4 py-3 text-center align-middle text-black";

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="mx-auto max-w-5xl space-y-6">
        {/* PAGE HEADER */}
        <div className="overflow-hidden rounded-2xl bg-gradient-to-r from-blue-700 via-indigo-600 to-purple-600 p-6 text-white shadow-lg">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-white/20 bg-white/15">
              <ReceiptText size={30} />
            </div>

            <div>
              <h1 className="text-2xl font-bold sm:text-3xl">
                Payment Receipt
              </h1>
              <p className="mt-1 text-sm text-blue-100">
                Shiv Shakti Solar Energy
              </p>
            </div>
          </div>
        </div>

        {/* NOTIFICATION */}
        {message && (
          <div
            role="status"
            className={`rounded-xl border px-4 py-3 text-sm font-medium ${
              messageType === "error"
                ? "border-red-200 bg-red-50 text-red-700"
                : "border-green-200 bg-green-50 text-green-700"
            }`}
          >
            {message}
          </div>
        )}

        {/* CREATE RECEIPT BUTTON */}
        <div className="flex justify-end">
          <button
            type="button"
            onClick={openFormInNewWindow}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-700 to-indigo-600 px-5 py-3 font-semibold text-white shadow-md transition hover:from-blue-800 hover:to-indigo-700 active:scale-[0.98]"
          >
            <Plus size={19} />
            Create Payment Receipt
          </button>
        </div>

        {/* RECEIPT FORM */}
        {showForm && (
          <div className="receipt-form-card rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-7">
            <div className="mb-7 flex items-center justify-between gap-3 border-b border-gray-200 pb-5">
              <div className="flex items-center gap-3">
                <div className="h-10 w-1.5 shrink-0 rounded-full bg-indigo-600" />
                <div>
                  <h2 className="text-xl font-bold text-gray-800 sm:text-2xl">
                    {editingId
                      ? "Edit Payment Receipt"
                      : "Create Payment Receipt"}
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Enter the customer and payment details below.
                  </p>
                </div>
              </div>
            </div>

{viewMode && (
  <div className="mb-5 flex justify-end gap-3 receipt-view-actions">
    <button
      type="button"
      onClick={handleDownloadPDF}
      className="inline-flex items-center gap-2 rounded-xl bg-blue-700 px-5 py-3 font-semibold text-white hover:bg-blue-800"
    >
      <Save size={18} />
      Download PDF
    </button>

    <button
      type="button"
      onClick={() => {
        setShowForm(false);
        setViewMode(false);
        setSelectedReceipt(null);
        setEditingId(null);
      }}
      className="inline-flex items-center gap-2 rounded-xl border border-gray-300 px-5 py-3 font-semibold text-gray-700 hover:bg-gray-100"
    >
      <X size={18} />
      Close
    </button>
  </div>
)}
        
{/* PRINTABLE PAYMENT RECEIPT */}
<div
  id="receipt-document"
  className={`receipt-document ${viewMode ? "is-viewing" : ""}`}
>
  <div className="receipt-document-header">
    <img
      src="/logo.png"
      alt="Shiv Shakti Solar Energy Logo"
      className="receipt-document-logo"
    />

    <div className="receipt-company-details">
      <h1>SHIV SHAKTI SOLAR ENERGY</h1>
      <p>PAYMENT RECEIPT</p>
    </div>
  </div>

  <div className="receipt-document-title">
    PAYMENT ACKNOWLEDGEMENT
  </div>

  <div className="receipt-document-meta">
<div>
  <span>Receipt Number :</span>
  <strong>{form.receiptNumber || "—"}</strong>
</div>

<div>
  <span>Payment Date :</span>
  <strong>{formatDate(form.paymentDate) || "—"}</strong>
</div>
  </div>


<div className="receipt-document-row">
  <span style={{ fontSize: "18px", fontWeight: 700 }}>
    Customer Name :
  </span>
  <strong>{form.customerName || "—"}</strong>
</div>

<div className="receipt-document-row">
  <span style={{ fontSize: "18px", fontWeight: 700 }}>
    Received From :</span>
  <strong>
    {(form.bankName === "Other"
      ? form.customBankName
      : form.bankName) || "—"}
  </strong>
</div>


    
<div className="receipt-document-amount-block">
  <div className="receipt-document-amount">
    <span>AMOUNT RECEIVED</span>
    <strong>
      ₹
      {Number(form.amount || 0).toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}
    </strong>
  </div>

  
<div className="receipt-amount-words">
  <span>Amount in Words</span>
  <strong>{amountInWords(form.amount)}</strong>
</div>

</div>

    <p className="receipt-document-confirmation">
      Received the above payment from the customer mentioned in this
      receipt. This receipt is issued as acknowledgement of payment.
    </p>
  </div>

  <div className="receipt-document-footer">
    <div className="receipt-document-footer-note">
      <strong>Thank you for choosing Shiv Shakti Solar Energy.</strong>
      <p>Please retain this receipt for your records.</p>
    </div>

    <div className="receipt-signature">
      <div className="receipt-signature-space" />
      <strong>Authorized Signatory</strong>
      <span>Shiv Shakti Solar Energy</span>
    </div>
  </div>


            {!viewMode && (
  <form
    onSubmit={handleSave}
    className="receipt-print-area grid grid-cols-1 gap-x-6 gap-y-5 md:grid-cols-2"
  >

              {/* RECEIPT NUMBER */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Receipt Number
                </label>
                <input
                  value={form.receiptNumber}
                  onChange={(event) =>
                    updateField("receiptNumber", event.target.value)
                  }
                  placeholder={`PR-${currentYear}-001`}
                  className={inputClass}
                  required
                />
                <p className="mt-1 text-xs text-gray-500">
                  Automatically generated; you can edit it.
                </p>
              </div>

              {/* PAYMENT DATE */}
              <div>
                <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <CalendarDays size={16} className="text-indigo-600" />
                  Payment Date
                </label>

                <div className="relative">
                  <input
                    type="text"
                    value={formatDate(form.paymentDate)}
                    placeholder="DD-MMM-YYYY"
                    readOnly
                    className={inputClass}
                  />

                  <input
                    type="date"
                    value={form.paymentDate}
                    onChange={(event) =>
                      updateField("paymentDate", event.target.value)
                    }
                    required
                    aria-label="Choose payment date"
                    className="absolute right-0 top-0 h-full w-12 cursor-pointer opacity-0"
                  />

                  <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
                    <CalendarDays size={18} className="text-indigo-600" />
                  </div>
                </div>
              </div>

              

              {/* CUSTOMER NAME */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Customer Name
                </label>

                <select
                  value={form.customerName}
                  onChange={(event) =>
                    updateField("customerName", event.target.value)
                  }
                  className={inputClass}
                  required
                >
                  <option value="">Select Customer</option>

                  {customers
                    .filter((customer) => {
                      const customerName = customer.customer_name;
                      if (!customerName) return false;

                      const alreadyHasReceipt = receipts.some(
                        (receipt) =>
                          receipt.customer_name?.trim() ===
                            customerName.trim() &&
                          receipt.id !== editingId
                      );

                      const isCurrentReceiptCustomer =
                        editingId &&
                        receipts.some(
                          (receipt) =>
                            receipt.id === editingId &&
                            receipt.customer_name?.trim() ===
                              customerName.trim()
                        );

                      return !alreadyHasReceipt || isCurrentReceiptCustomer;
                    })
                    .map((customer) => (
                      <option key={customer.id} value={customer.customer_name}>
                        {customer.customer_name}
                      </option>
                    ))}
                </select>
              </div>

              {/* AMOUNT */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Amount (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.amount}
                  onChange={(event) =>
                    updateField("amount", event.target.value)
                  }
                  placeholder="Enter amount"
                  className={inputClass}
                  required
                />
              </div>

{/* Bank Name */}
<div>
  <label className="mb-2 block text-sm font-semibold text-gray-700">
    Received From
  </label>

  <select
    value={
      [
        "Central Bank of India",
        "Canara Bank",
        "Indian Bank",
        "Madhya Pradesh Gramin Bank",
        "Punjab National Bank",
        "State Bank of India",
        "Union Bank of India",
        
      ].includes(form.bankName)
        ? form.bankName
        : form.bankName
          ? "Other"
          : ""
    }
    onChange={(event) => {
  const value = event.target.value;

  updateField("bankName", value);
  updateField("customBankName", "");
}}
    className={inputClass}
  >
    <option value="">Select Bank Name</option>
     <option value="Central Bank of India">Central Bank of India</option>
    <option value="Canara Bank">Canara Bank</option>
    <option value="Indian Bank">Indian Bank</option>
    <option value="Madhya Pradesh Gramin Bank">Madhya Pradesh Gramin Bank</option>
    <option value="Punjab National Bank">Punjab National Bank</option>
    <option value="State Bank of India">State Bank of India</option>
    <option value="Union Bank of India">Union Bank of India</option>
    <option value="Other">Other</option>
  </select>

  {form.bankName === "Other" && (
  <input
    value={form.customBankName || ""}
    onChange={(event) =>
      updateField("customBankName", event.target.value)
    }
    placeholder="Enter bank name"
    className={`${inputClass} mt-2`}
  />
)}
</div>

            
{/* ACTION BUTTONS */}
<div className="receipt-form-actions flex flex-wrap gap-3 border-t border-gray-200 pt-5 md:col-span-2">

  {!viewMode && (
    <button
      type="submit"
      disabled={saving}
      className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-700 to-indigo-600 px-6 py-3 font-semibold text-white shadow-md transition hover:from-blue-800 hover:to-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
    >
      <Save size={18} />
      {saving
        ? "Saving..."
        : editingId
          ? "Update Receipt"
          : "Save Receipt"}
    </button>
  )}





  {!viewMode && (
    <button
      type="button"
      onClick={handleReset}
      className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-6 py-3 font-semibold text-gray-700 transition hover:bg-gray-100"
    >
      <RotateCcw size={18} />
      Reset
    </button>
  )}

  <button
    type="button"
    onClick={() => {
      setEditingId(null);
      setSelectedReceipt(null);
      setViewMode(false);
      setForm(emptyForm());
      setShowForm(false);
      setMessage("");
    }}
    className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-6 py-3 font-semibold text-gray-700 transition hover:bg-gray-100"
  >
    <X size={18} />
    Close Form
  </button>

</div>

              </form>
)}
          </div>
        )}

        {/* SAVED RECEIPTS */}
        <div className="overflow-hidden rounded-2xl border border-black bg-white shadow-sm receipts-list">
          <div className="flex flex-col gap-4 border-b border-black p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-bold text-black">
                Saved Payment Receipts
              </h2>
              <p className="mt-1 text-sm text-black">
                Search, view, edit, or delete saved receipts.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="relative w-full sm:w-64">
                <Search
                  size={18}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
                />
                <input
                  type="search"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search receipts..."
                  className="w-full rounded-xl border border-black py-2.5 pl-10 pr-3 text-sm text-black outline-none focus:ring-2 focus:ring-indigo-200"
                />
              </div>

              <span className="whitespace-nowrap rounded-full border border-black px-3 py-1 text-sm font-semibold text-black">
                {filteredReceipts.length} receipts
              </span>
            </div>
          </div>

          {loading ? (
            <div className="p-8 text-center text-black">
              Loading receipts...
            </div>
          ) : filteredReceipts.length === 0 ? (
            <div className="p-8 text-center text-black">
              {receipts.length === 0
                ? 'No saved receipts yet. Click "Create Payment Receipt" to begin.'
                : "No receipts match your search."}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] border-collapse border border-black text-center text-sm text-black">
                <thead className="bg-gray-100 text-xs uppercase tracking-wide text-black">
                  <tr>
                    <th className={tableCellClass}>Receipt Number</th>
                    <th className={tableCellClass}>Date</th>
                    <th className={tableCellClass}>Customer</th>
                    <th className={tableCellClass}>Amount</th>
                    <th className={tableCellClass}>Mode</th>
                    <th className={tableCellClass}>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredReceipts.map((receipt) => (
                    <tr
                      key={receipt.id}
                      className="transition hover:bg-gray-50"
                    >
                      <td className={tableCellClass}>
                        <button
                          type="button"
                          title="Open receipt"
                          onClick={() => handleView(receipt)}
                          className="font-semibold text-indigo-700 underline hover:text-indigo-900"
                        >
                          {receipt.receipt_number}
                        </button>
                      </td>

                      <td className={tableCellClass}>
                        {formatDate(receipt.payment_date) || "—"}
                      </td>

                      <td className={tableCellClass}>
                        {receipt.customer_name || "—"}
                      </td>

                      <td className={tableCellClass}>
                        ₹
                        {Number(receipt.amount || 0).toLocaleString("en-IN", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>

                      <td className={tableCellClass}>
                        {receipt.payment_mode || "—"}
                      </td>

                      <td className={tableCellClass}>
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            title="Edit receipt"
                            onClick={() => handleEdit(receipt)}
                            className="rounded-lg border border-indigo-700 p-2 text-indigo-700 transition hover:bg-indigo-50"
                          >
                            <Pencil size={16} />
                          </button>

                          <button
                            type="button"
                            title="Delete receipt"
                            onClick={() => handleDelete(receipt)}
                            className="rounded-lg border border-red-700 p-2 text-red-700 transition hover:bg-red-50"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* PRINT STYLES */}
    


<style>{`
  .receipt-document {
    display: none;
    box-sizing: border-box;
    width: 100%;
    padding: 22px;
    background: #ffffff;
    color: #000000;
    font-family: Arial, sans-serif;
    border: 2px solid #000000;
    border-radius: 10px;
  }

  .receipt-document.is-viewing {
    display: block;
  }

  .receipt-document-header {
    display: flex;
    align-items: center;
    gap: 20px;
    padding: 22px;
    background: linear-gradient(120deg, #1e3a8a, #4338ca, #7e22ce);
    color: #ffffff;
    border: 2px solid #000000;
    border-radius: 7px;
  }

  .receipt-document-logo {
    width: 85px;
    height: 85px;
    object-fit: contain;
    background: #ffffff;
    border: 1px solid #000000;
    border-radius: 6px;
    padding: 5px;
  }

  .receipt-company-details h1 {
    margin: 0;
    font-size: 23px;
    font-weight: 800;
    color: #ffffff;
  }

  .receipt-company-details p {
    margin: 8px 0 0;
    font-size: 14px;
    font-weight: 700;
    letter-spacing: 3px;
    color: #ffffff;
  }

  .receipt-document-title {
    margin: 24px 0;
    padding: 13px;
    text-align: center;
    font-size: 18px;
    font-weight: 800;
    color: #000000;
    background: #fde68a;
    border: 2px solid #000000;
    border-radius: 6px;
    letter-spacing: 1px;
  }

  .receipt-document-meta {
    display: flex;
    justify-content: space-between;
    align-items: center;
    grid-template-columns: 1fr 1fr;
    border: 2px solid #000000;
    border-radius: 6px;
    margin-bottom: 22px;
    overflow: hidden;
  }

  .receipt-document-meta > div {
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    min-width: 0;
    background: #dbeafe;
  }

  .receipt-document-meta > div + div {
    border-left: 2px solid #000000;
    background: #ede9fe;
  }

  .receipt-document-meta span,
  .receipt-document-row span,
  .receipt-document-amount span,
  .receipt-amount-words span {
    font-size: 12px;
    font-weight: 700;
    color: #000000;
  }

  .receipt-document-meta strong,
  .receipt-document-row strong {
    font-size: 15px;
    color: #000000;
    overflow-wrap: anywhere;
  }

  .receipt-document-body {
    border: 2px solid #000000;
    border-radius: 6px;
    padding: 22px;
    background: #ffffff;
  }

  .receipt-document-row {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 20px;
    padding: 18px 0;
    border-bottom: 1px solid #000000;
  }

  .receipt-document-row strong {
    text-align: right;
    max-width: 65%;
  }

  .receipt-document-amount {
    margin-top: 22px;
    padding: 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    background: linear-gradient(120deg, #bfdbfe, #ddd6fe);
    border: 2px solid #000000;
    border-radius: 6px 6px 0 0;
  }

  .receipt-document-amount span {
    font-weight: 800;
  }

  .receipt-document-amount strong {
    font-size: 24px;
    font-weight: 800;
    color: #000000;
    overflow-wrap: anywhere;
  }

  /* Amount in words */
  .receipt-amount-words {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding: 12px 14px;
    background: #dcfce7;
    border: 2px solid #000000;
    border-top: none;
    border-radius: 0 0 6px 6px;
  }

  .receipt-amount-words span {
    font-size: 12px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .receipt-amount-words strong {
    font-size: 14px;
    line-height: 1.8;
    font-weight: 700;
    color: #000000;
    overflow-wrap: anywhere;
  }

  .receipt-document-confirmation {
    margin: 24px 0 0;
    font-size: 13px;
    line-height: 1.8;
    color: #000000;
  }

  .receipt-document-footer {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    gap: 30px;
    margin-top: 55px;
    page-break-inside: avoid;
  }

  .receipt-document-footer-note {
    font-size: 12px;
    line-height: 1.8;
    color: #000000;
  }

  .receipt-document-footer-note strong {
    color: #000000;
  }

  .receipt-document-footer-note p {
    margin-top: 5px;
    color: #000000;
  }

  .receipt-signature {
    width: 210px;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    font-size: 12px;
    color: #000000;
  }

  .receipt-signature-space {
    width: 100%;
    height: 65px;
    border-bottom: 2px solid #000000;
    margin-bottom: 10px;
  }

  .receipt-signature span {
    margin-top: 5px;
    color: #000000;
  }

  @media (max-width: 640px) {
    .receipt-document {
      padding: 10px;
    }

    .receipt-document-header {
      gap: 12px;
      padding: 14px;
    }

    .receipt-document-logo {
      width: 60px;
      height: 60px;
    }

    .receipt-company-details h1 {
      font-size: 17px;
    }

    .receipt-company-details p {
      font-size: 10px;
      letter-spacing: 2px;
    }

    .receipt-document-body {
      padding: 12px;
    }

    .receipt-document-amount {
      padding: 13px;
    }

    .receipt-document-amount strong {
      font-size: 19px;
    }

    .receipt-amount-words {
      padding: 13px;
    }

    .receipt-document-footer {
      gap: 16px;
    }
  }
`}</style>

    </div>
  );
}
