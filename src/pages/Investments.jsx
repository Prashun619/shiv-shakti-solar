import { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Search,
  RotateCcw,
  X,
  Edit,
  Trash2,
  IndianRupee,
  CalendarDays,
  Users,
  CreditCard,
} from "lucide-react";

import {
  getPartners,
  getInvestments,
  addInvestment,
  updateInvestment,
  deleteInvestment,
} from "../services/investmentService";

// =====================================================
// HELPERS
// =====================================================

function money(value) {
  const amount = Number(value || 0);

  return `₹ ${Math.round(amount).toLocaleString("en-IN")}`;
}

function formatInvestmentDate(date) {
  if (!date) return "-";

  const d = new Date(date);

  if (Number.isNaN(d.getTime())) {
    return date;
  }

  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getInvestmentTypeStyle(type) {
  switch (type) {
    case "Additional Investment":
      return "bg-emerald-100 text-emerald-800 border border-emerald-300";

    case "Dealer Payment":
      return "bg-blue-100 text-blue-800 border border-blue-300";

    case "Vendor Payment":
      return "bg-orange-100 text-orange-800 border border-orange-300";

    case "Miscellaneous":
      return "bg-purple-100 text-purple-800 border border-purple-300";

    case "Expense Investment":
      return "bg-red-100 text-red-800 border border-red-300";

    default:
      return "bg-slate-100 text-slate-800 border border-slate-300";
  }
}

// =====================================================
// INITIAL FORM
// =====================================================

const INITIAL_FORM = {
  partner_id: "",
  investment_date: "",
  investment_type: "Additional Investment",
  dealer_name: "",
  vendor_name: "",
  amount: "",
  payment_mode: "Cash",
  reference_no: "",
  purpose: "",
  remarks: "",
};

// =====================================================
// COMPONENT
// =====================================================

export default function Investments() {
  const [partners, setPartners] = useState([]);
  const [investments, setInvestments] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [showModal, setShowModal] = useState(false);

const [viewInvestment, setViewInvestment] = useState(null);

const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState(INITIAL_FORM);

  const [search, setSearch] = useState("");

  // =====================================================
  // LOAD DATA
  // =====================================================

  async function loadData() {
    try {
      setLoading(true);

      const [partnersData, investmentsData] =
        await Promise.all([
          getPartners(),
          getInvestments(),
        ]);

      setPartners(partnersData || []);
      setInvestments(investmentsData || []);
    } catch (error) {
      console.error(
        "INVESTMENTS LOAD ERROR:",
        error
      );

      alert(
        error.message ||
          "Failed to load investments."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  // =====================================================
  // FILTER
  // =====================================================

  const filteredInvestments = useMemo(() => {
    const value = search
      .trim()
      .toLowerCase();

    if (!value) {
      return investments;
    }

    return investments.filter((investment) => {
      const investor =
        investment.partners?.partner_name || "";

      return (
        String(investor)
          .toLowerCase()
          .includes(value) ||
        String(
          investment.investment_type || ""
        )
          .toLowerCase()
          .includes(value) ||
        String(
          investment.dealer_name || ""
        )
          .toLowerCase()
          .includes(value) ||
        String(
          investment.vendor_name || ""
        )
          .toLowerCase()
          .includes(value) ||
        String(
          investment.purpose || ""
        )
          .toLowerCase()
          .includes(value) ||
        String(
          investment.remarks || ""
        )
          .toLowerCase()
          .includes(value) ||
        String(
          investment.payment_mode || ""
        )
          .toLowerCase()
          .includes(value)
      );
    });
  }, [investments, search]);

  // =====================================================
  // TOTAL INVESTMENT
  // =====================================================

  const totalInvestment = useMemo(() => {
    return investments.reduce(
      (sum, investment) =>
        sum +
        Number(
          investment.amount || 0
        ),
      0
    );
  }, [investments]);

  // =====================================================
  // OPEN ADD MODAL
  // =====================================================

  function handleAdd() {
    setEditingId(null);

    setForm({
      ...INITIAL_FORM,
      investment_date:
        new Date()
          .toISOString()
          .split("T")[0],
    });

    setShowModal(true);
  }

  // =====================================================
  // EDIT
  // =====================================================

  function handleView(investment) {
  setViewInvestment(investment);
}
  
  function handleEdit(investment) {
    setEditingId(investment.id);

    setForm({
      partner_id:
        investment.partner_id || "",

      investment_date:
        investment.investment_date || "",

      investment_type:
        investment.investment_type ||
        "Additional Investment",

      dealer_name:
        investment.dealer_name || "",

      vendor_name:
        investment.vendor_name || "",

      amount:
        investment.amount ?? "",

      payment_mode:
        investment.payment_mode ||
        "Cash",

      reference_no:
        investment.reference_no || "",

      purpose:
        investment.purpose || "",

      remarks:
        investment.remarks || "",
    });

    setShowModal(true);
  }

  // =====================================================
  // DELETE
  // =====================================================

  async function handleDelete(id) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this investment?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setLoading(true);

      await deleteInvestment(id);

      await loadData();
    } catch (error) {
      console.error(
        "DELETE INVESTMENT ERROR:",
        error
      );

      alert(
        error.message ||
          "Failed to delete investment."
      );
    } finally {
      setLoading(false);
    }
  }

  // =====================================================
  // FORM CHANGE
  // =====================================================

  function handleChange(e) {
    const {
      name,
      value,
    } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  // =====================================================
  // SAVE
  // =====================================================

  async function handleSubmit(e) {
    e.preventDefault();

    if (!form.partner_id) {
      alert("Please select an investor.");
      return;
    }

    if (!form.investment_date) {
      alert("Please select a date.");
      return;
    }

    if (!form.amount || Number(form.amount) <= 0) {
      alert("Please enter a valid amount.");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        partner_id:
          form.partner_id,

        investment_date:
          form.investment_date,

        investment_type:
          form.investment_type,

        dealer_name:
          form.dealer_name || null,

        vendor_name:
          form.vendor_name || null,

        amount:
          Number(form.amount),

        payment_mode:
          form.payment_mode,

        reference_no:
          form.reference_no || null,

        purpose:
          form.purpose || null,

        remarks:
          form.remarks || null,
      };

      if (editingId) {
        await updateInvestment(
          editingId,
          payload
        );
      } else {
        await addInvestment(
          payload
        );
      }

      setShowModal(false);
      setEditingId(null);
      setForm(INITIAL_FORM);

      await loadData();
    } catch (error) {
      console.error(
        "SAVE INVESTMENT ERROR:",
        error
      );

      alert(
        error.message ||
          "Failed to save investment."
      );
    } finally {
      setSaving(false);
    }
  }

  // =====================================================
  // CLOSE MODAL
  // =====================================================

  function closeModal() {
    if (saving) return;

    setShowModal(false);
    setEditingId(null);
    setForm(INITIAL_FORM);
  }

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className="min-h-screen p-6 space-y-6 bg-gradient-to-br from-sky-50 via-white to-emerald-50">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

        <div>
          <h1 className="text-3xl font-extrabold bg-gradient-to-r from-indigo-600 via-purple-600 to-fuchsia-600 bg-clip-text text-transparent">
            Investments
          </h1>

          <p className="text-sm text-slate-600 mt-1">
            Manage investor investments and
            related transactions
          </p>
        </div>

        <button
          onClick={handleAdd}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-white font-bold bg-gradient-to-r from-emerald-500 to-green-600 shadow-lg hover:from-emerald-600 hover:to-green-700 transition-all"
        >
          <Plus size={20} />
          Add Investment
        </button>
      </div>

      

      {/* =====================================================
          INVESTOR CARDS
      ===================================================== */}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">

        {partners.map(
          (partner, index) => {
            const partnerTotal =
              investments
                .filter(
                  (investment) =>
                    String(
                      investment.partner_id
                    ) ===
                    String(
                      partner.id
                    )
                )
                .reduce(
                  (
                    sum,
                    investment
                  ) =>
                    sum +
                    Number(
                      investment.amount ||
                        0
                    ),
                  0
                );

            const gradients = [
              "from-blue-500 to-indigo-600",
              "from-purple-500 to-fuchsia-600",
              "from-orange-500 to-amber-600",
              "from-cyan-500 to-sky-600",
            ];

            return (
              <div
                key={partner.id}
                className={`rounded-2xl p-5 text-white shadow-lg bg-gradient-to-br ${
                  gradients[
                    index %
                      gradients.length
                  ]
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold opacity-90">
                      {partner.partner_name}
                    </p>

                    <p className="text-2xl font-extrabold mt-2">
                      {money(
                        partnerTotal
                      )}
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-white/20">
                    <Users size={24} />
                  </div>
                </div>
              </div>
            );
          }
        )}

      </div>

      {/* =====================================================
          SEARCH
      ===================================================== */}

      <div className="rounded-2xl p-5 bg-white shadow-md border border-indigo-100">

        <div className="flex flex-col md:flex-row gap-3">

          <div className="relative flex-1">

            <Search
              size={19}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-500"
            />

            <input
              type="text"
              value={search}
              onChange={(e) =>
                setSearch(
                  e.target.value
                )
              }
              placeholder="Search investments..."
              className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-indigo-100 focus:border-indigo-500 focus:outline-none"
            />

          </div>

          <button
            onClick={() =>
              setSearch("")
            }
            className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-slate-100 text-slate-700 font-semibold hover:bg-slate-200"
          >
            <RotateCcw size={18} />
            Reset
          </button>

        </div>

      </div>

      {/* =====================================================
          INVESTMENT HISTORY
      ===================================================== */}

      <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-indigo-100">

        <div className="px-6 py-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-fuchsia-600 text-white">

          <h2 className="text-xl font-bold">
            Investment History
          </h2>

          <p className="text-sm opacity-90 mt-1">
            All investment transactions
          </p>

        </div>

        <div className="overflow-x-auto">

          <table className="w-full border-collapse">

            {/* =================================================
                TABLE HEADER
            ================================================= */}

            <thead>
              <tr className="bg-gradient-to-r from-indigo-600 via-purple-600 to-fuchsia-600 text-white">

                <th className="border border-black px-3 py-2 text-center text-sm font-semibold">
                  Date
                </th>

                <th className="border border-black px-3 py-2 text-center text-sm font-semibold">
                  Investor
                </th>

                <th className="border border-black px-3 py-2 text-center text-sm font-semibold">
                  Investment Type
                </th>

                <th className="border border-black px-3 py-2 text-center text-sm font-semibold">
                  Description
                </th>

                <th className="border border-black px-3 py-2 text-center text-sm font-semibold">
                  Amount
                </th>

                <th className="border border-black px-3 py-2 text-center text-sm font-semibold">
                  Payment Mode
                </th>

                <th className="border border-black px-3 py-2 text-center text-sm font-semibold">
                  Action
                </th>

              </tr>
            </thead>

            {/* =================================================
                TABLE BODY
            ================================================= */}

            <tbody>

              {loading ? (
                <tr>
                  <td
                    colSpan={7}
                    className="text-center py-10 text-slate-500"
                  >
                    Loading investments...
                  </td>
                </tr>
              ) : filteredInvestments.length ===
                0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="text-center py-10 text-slate-500"
                  >
                    No investments found.
                  </td>
                </tr>
              ) : (
                filteredInvestments.map(
                  (investment) => (
                    <tr
                      key={
                        investment.id
                      }
                      className="hover:bg-indigo-50 transition-colors"
                    >

                      {/* DATE */}

                      <td className="border border-black px-3 py-2 text-center text-sm text-black">
  <button
    type="button"
    onClick={() =>
      handleView(investment)
    }
    className="font-semibold text-indigo-700 hover:text-indigo-900 hover:bg-indigo-50 px-2 py-1 rounded cursor-pointer"
  >
    {formatInvestmentDate(
      investment.investment_date
    )}
  </button>
</td>

                      {/* INVESTOR */}

                      <td className="border border-black px-3 py-2 text-center text-sm font-semibold text-black">
                        {investment
                          .partners
                          ?.partner_name ||
                          "-"}
                      </td>

                      {/* INVESTMENT TYPE */}

                      <td className="border border-black px-3 py-2 text-center text-sm font-semibold">

                        <span
                          className={`inline-flex justify-center px-2.5 py-1 rounded-full text-xs font-bold ${getInvestmentTypeStyle(
                            investment.investment_type
                          )}`}
                        >
                          {investment.investment_type ||
                            "-"}
                        </span>

                      </td>

                      {/* DESCRIPTION */}

                      <td className="border border-black px-3 py-2 text-center text-sm text-black">
                        {investment.remarks ||
                          investment.purpose ||
                          "-"}
                      </td>

                      {/* AMOUNT */}

                      <td className="border border-black px-3 py-2 text-center text-sm font-bold text-green-700">

                        ₹{" "}
                        {Number(
                          investment.amount ||
                            0
                        ).toLocaleString(
                          "en-IN"
                        )}

                      </td>

                      {/* PAYMENT MODE */}

                      <td className="border border-black px-3 py-2 text-center text-sm text-black">
                        {investment.payment_mode ||
                          "-"}
                      </td>

                      {/* ACTION */}

                      <td className="border border-black px-3 py-2 text-center">

                        <div className="flex justify-center items-center gap-2">

                          <button
                            onClick={() =>
                              handleEdit(
                                investment
                              )
                            }
                            className="p-2 rounded-lg bg-blue-100 text-blue-700 hover:bg-blue-200"
                            title="Edit"
                          >
                            <Edit
                              size={16}
                            />
                          </button>

                          <button
                            onClick={() =>
                              handleDelete(
                                investment.id
                              )
                            }
                            className="p-2 rounded-lg bg-red-100 text-red-700 hover:bg-red-200"
                            title="Delete"
                          >
                            <Trash2
                              size={16}
                            />
                          </button>

                        </div>

                      </td>

                    </tr>
                  )
                )
              )}

            </tbody>

          </table>

        </div>

      </div>

{/* =====================================================
    VIEW INVESTMENT MODAL
===================================================== */}

{viewInvestment && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">

    <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border-2 border-black overflow-hidden">

      {/* HEADER */}

      <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-fuchsia-600 text-white">

        <div>
          <h2 className="text-xl font-bold">
            Investment Details
          </h2>

          <p className="text-sm opacity-90 mt-1">
            View investment transaction
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            setViewInvestment(null)
          }
          className="p-2 rounded-lg hover:bg-white/20"
        >
          <X size={22} />
        </button>

      </div>

      {/* DETAILS */}

      <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">

        <div className="border-2 border-black rounded-lg p-3">
          <p className="text-xs font-bold text-slate-500">
            Date
          </p>

          <p className="font-bold text-indigo-700 mt-1">
            {formatInvestmentDate(
              viewInvestment.investment_date
            )}
          </p>
        </div>

        <div className="border-2 border-black rounded-lg p-3">
          <p className="text-xs font-bold text-slate-500">
            Investor
          </p>

          <p className="font-semibold mt-1">
            {viewInvestment.partners?.partner_name || "-"}
          </p>
        </div>

        <div className="border-2 border-black rounded-lg p-3">
          <p className="text-xs font-bold text-slate-500">
            Investment Type
          </p>

          <p className="font-semibold mt-1">
            {viewInvestment.investment_type || "-"}
          </p>
        </div>

        <div className="border-2 border-black rounded-lg p-3">
          <p className="text-xs font-bold text-slate-500">
            Amount
          </p>

          <p className="font-bold text-green-700 mt-1">
            {money(viewInvestment.amount)}
          </p>
        </div>

        <div className="border-2 border-black rounded-lg p-3">
          <p className="text-xs font-bold text-slate-500">
            Payment Mode
          </p>

          <p className="font-semibold mt-1">
            {viewInvestment.payment_mode || "-"}
          </p>
        </div>

        <div className="border-2 border-black rounded-lg p-3">
          <p className="text-xs font-bold text-slate-500">
            Reference No.
          </p>

          <p className="font-semibold mt-1">
            {viewInvestment.reference_no || "-"}
          </p>
        </div>

        {viewInvestment.dealer_name && (
          <div className="border-2 border-black rounded-lg p-3">
            <p className="text-xs font-bold text-slate-500">
              Dealer Name
            </p>

            <p className="font-semibold mt-1">
              {viewInvestment.dealer_name}
            </p>
          </div>
        )}

        {viewInvestment.vendor_name && (
          <div className="border-2 border-black rounded-lg p-3">
            <p className="text-xs font-bold text-slate-500">
              Vendor Name
            </p>

            <p className="font-semibold mt-1">
              {viewInvestment.vendor_name}
            </p>
          </div>
        )}

        <div className="border-2 border-black rounded-lg p-3 md:col-span-2">
          <p className="text-xs font-bold text-slate-500">
            Description
          </p>

          <p className="font-semibold mt-1">
            {viewInvestment.remarks ||
              viewInvestment.purpose ||
              "-"}
          </p>
        </div>

      </div>

      {/* CLOSE */}

      <div className="flex justify-end px-6 pb-6">

        <button
          type="button"
          onClick={() =>
            setViewInvestment(null)
          }
          className="px-6 py-2 rounded-xl bg-slate-800 text-white font-bold hover:bg-black"
        >
          Close
        </button>

      </div>

    </div>

  </div>
)}

      {/* =====================================================
          ADD / EDIT MODAL
      ===================================================== */}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">

          <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl">

            {/* MODAL HEADER */}

            <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-fuchsia-600 text-white">

              <div>
                <h2 className="text-xl font-bold">
                  {editingId
                    ? "Edit Investment"
                    : "Add Investment"}
                </h2>

                <p className="text-sm opacity-90">
                  Enter investment details
                </p>
              </div>

              <button
                onClick={closeModal}
                className="p-2 rounded-lg hover:bg-white/20"
              >
                <X size={22} />
              </button>

            </div>

            {/* FORM */}

            <form
              onSubmit={
                handleSubmit
              }
              className="p-6 space-y-5"
            >

              {/* INVESTOR + DATE */}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                <div>
                  <label className="block mb-1 text-sm font-bold text-slate-700">
                    Investor
                  </label>

                  <select
                    name="partner_id"
                    value={
                      form.partner_id
                    }
                    onChange={
                      handleChange
                    }
                    className="w-full border-2 border-slate-200 rounded-xl p-3 focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="">
                      Select Investor
                    </option>

                    {partners.map(
                      (partner) => (
                        <option
                          key={
                            partner.id
                          }
                          value={
                            partner.id
                          }
                        >
                          {
                            partner.partner_name
                          }
                        </option>
                      )
                    )}
                  </select>
                </div>

                <div>
                  <label className="block mb-1 text-sm font-bold text-slate-700">
                    Date
                  </label>

                  <div className="relative">

                    <CalendarDays
                      size={18}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-500"
                    />

                    <input
                      type="date"
                      name="investment_date"
                      value={
                        form.investment_date
                      }
                      onChange={
                        handleChange
                      }
                      className="w-full border-2 border-slate-200 rounded-xl p-3 pl-10 focus:border-indigo-500 focus:outline-none"
                    />

                  </div>
                </div>

              </div>

              {/* INVESTMENT TYPE */}

              <div>
                <label className="block mb-1 text-sm font-bold text-slate-700">
                  Investment Type
                </label>

                <select
                  name="investment_type"
                  value={
                    form.investment_type
                  }
                  onChange={
                    handleChange
                  }
                  className="w-full border-2 border-slate-200 rounded-xl p-3 focus:border-indigo-500 focus:outline-none"
                >
                  <option value="Additional Investment">
                    Additional Investment
                  </option>

                  <option value="Dealer Payment">
                    Dealer Payment
                  </option>

                  <option value="Vendor Payment">
                    Vendor Payment
                  </option>

                  <option value="Miscellaneous">
                    Miscellaneous
                  </option>

                  <option value="Expense Investment">
                    Expense Investment
                  </option>
                </select>
              </div>

              {/* DEALER */}

              {form.investment_type ===
                "Dealer Payment" && (
                <div>
                  <label className="block mb-1 text-sm font-bold text-slate-700">
                    Dealer Name
                  </label>

                  <input
                    type="text"
                    name="dealer_name"
                    value={
                      form.dealer_name
                    }
                    onChange={
                      handleChange
                    }
                    className="w-full border-2 border-slate-200 rounded-xl p-3 focus:border-blue-500 focus:outline-none"
                    placeholder="Enter dealer name"
                  />
                </div>
              )}

              {/* VENDOR */}

              {form.investment_type ===
                "Vendor Payment" && (
                <div>
                  <label className="block mb-1 text-sm font-bold text-slate-700">
                    Vendor Name
                  </label>

                  <input
                    type="text"
                    name="vendor_name"
                    value={
                      form.vendor_name
                    }
                    onChange={
                      handleChange
                    }
                    className="w-full border-2 border-slate-200 rounded-xl p-3 focus:border-orange-500 focus:outline-none"
                    placeholder="Enter vendor name"
                  />
                </div>
              )}

              {/* AMOUNT + PAYMENT MODE */}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                <div>
                  <label className="block mb-1 text-sm font-bold text-slate-700">
                    Amount
                  </label>

                  <div className="relative">

                    <IndianRupee
                      size={18}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-600"
                    />

                    <input
                      type="number"
                      name="amount"
                      value={
                        form.amount
                      }
                      onChange={
                        handleChange
                      }
                      min="0"
                      step="0.01"
                      className="w-full border-2 border-slate-200 rounded-xl p-3 pl-10 focus:border-emerald-500 focus:outline-none"
                      placeholder="Enter amount"
                    />

                  </div>
                </div>

                <div>
                  <label className="block mb-1 text-sm font-bold text-slate-700">
                    Payment Mode
                  </label>

                  <select
                    name="payment_mode"
                    value={
                      form.payment_mode
                    }
                    onChange={
                      handleChange
                    }
                    className="w-full border-2 border-slate-200 rounded-xl p-3 focus:border-purple-500 focus:outline-none"
                  >
                    <option value="Cash">
                      Cash
                    </option>

                    <option value="Bank">
                      Bank
                    </option>

                    <option value="UPI">
                      UPI
                    </option>

                    <option value="Cheque">
                      Cheque
                    </option>
                  </select>
                </div>

              </div>

              {/* REFERENCE */}

              <div>
                <label className="block mb-1 text-sm font-bold text-slate-700">
                  Reference No.
                </label>

                <input
                  type="text"
                  name="reference_no"
                  value={
                    form.reference_no
                  }
                  onChange={
                    handleChange
                  }
                  className="w-full border-2 border-slate-200 rounded-xl p-3 focus:border-indigo-500 focus:outline-none"
                  placeholder="Enter reference number"
                />
              </div>

              {/* PURPOSE */}

              <div>
                <label className="block mb-1 text-sm font-bold text-slate-700">
                  Purpose
                </label>

                <input
                  type="text"
                  name="purpose"
                  value={
                    form.purpose
                  }
                  onChange={
                    handleChange
                  }
                  className="w-full border-2 border-slate-200 rounded-xl p-3 focus:border-indigo-500 focus:outline-none"
                  placeholder="Enter purpose"
                />
              </div>

              {/* REMARKS */}

              <div>
                <label className="block mb-1 text-sm font-bold text-slate-700">
                  Remarks
                </label>

                <textarea
                  name="remarks"
                  value={
                    form.remarks
                  }
                  onChange={
                    handleChange
                  }
                  rows={3}
                  className="w-full border-2 border-slate-200 rounded-xl p-3 focus:border-indigo-500 focus:outline-none resize-none"
                  placeholder="Enter remarks"
                />
              </div>

              {/* BUTTONS */}

              <div className="flex justify-end gap-3 pt-3">

                <button
                  type="button"
                  onClick={
                    closeModal
                  }
                  disabled={saving}
                  className="px-5 py-3 rounded-xl bg-slate-200 text-slate-700 font-bold hover:bg-slate-300 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-3 rounded-xl text-white font-bold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50"
                >
                  {saving
                    ? "Saving..."
                    : editingId
                    ? "Update Investment"
                    : "Save Investment"}
                </button>

              </div>

            </form>

          </div>

        </div>
      )}

    </div>
  );
}
