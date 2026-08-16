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
// INITIAL FORM
// =====================================================

const INITIAL_FORM = {
  partner_id: "",
  investment_date: new Date().toISOString().split("T")[0],
  investment_type: "Additional Investment",
  dealer_name: "",
  vendor_name: "",
  amount: "",
  payment_mode: "Bank",
  reference_no: "",
  purpose: "",
  remarks: "",
};

// =====================================================
// INVESTMENTS PAGE
// =====================================================

export default function Investments() {
  const [partners, setPartners] = useState([]);
  const [investments, setInvestments] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [showModal, setShowModal] = useState(false);

  const [editingInvestment, setEditingInvestment] = useState(null);

  const [form, setForm] = useState(INITIAL_FORM);

  const [search, setSearch] = useState("");

  // ===================================================
  // LOAD DATA
  // ===================================================

  const loadData = async () => {
    try {
      setLoading(true);

      const [partnersData, investmentsData] = await Promise.all([
        getPartners(),
        getInvestments(),
      ]);

      setPartners(partnersData);
      setInvestments(investmentsData);
    } catch (error) {
      console.error("Error loading investments:", error);
      alert("Unable to load investment data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // ===================================================
  // FORM CHANGE
  // ===================================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // ===================================================
  // OPEN ADD MODAL
  // ===================================================

  const openAddModal = () => {
    setEditingInvestment(null);

    setForm({
      ...INITIAL_FORM,
      investment_date: new Date().toISOString().split("T")[0],
    });

    setShowModal(true);
  };

  // ===================================================
  // OPEN EDIT MODAL
  // ===================================================

  const openEditModal = (investment) => {
    setEditingInvestment(investment);

    setForm({
      partner_id: investment.partner_id || "",
      investment_date:
        investment.investment_date ||
        new Date().toISOString().split("T")[0],
      investment_type:
        investment.investment_type || "Additional Investment",
      dealer_name: investment.dealer_name || "",
vendor_name: investment.vendor_name || "",
amount:
        investment.amount !== null && investment.amount !== undefined
          ? String(investment.amount)
          : "",
      payment_mode: investment.payment_mode || "Bank",
      reference_no: investment.reference_no || "",
      purpose: investment.purpose || "",
      remarks: investment.remarks || "",
    });

    setShowModal(true);
  };

  // ===================================================
  // CLOSE MODAL
  // ===================================================

  const closeModal = () => {
    if (saving) return;

    setShowModal(false);
    setEditingInvestment(null);
    setForm(INITIAL_FORM);
  };

  // ===================================================
  // SAVE INVESTMENT
  // ===================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.partner_id) {
      alert("Please select an investor.");
      return;
    }

    if (!form.investment_date) {
      alert("Please select investment date.");
      return;
    }

    if (!form.amount || Number(form.amount) <= 0) {
      alert("Please enter a valid amount.");
      return;
    }

    if (
  form.investment_type === "Dealer Payment" &&
  !form.dealer_name.trim()
) {
  alert("Please enter dealer name.");
  return;
}

if (
  form.investment_type === "Vendor Payment" &&
  !form.vendor_name.trim()
) {
  alert("Please enter vendor name.");
  return;
}

    try {
      setSaving(true);

      const payload = {
        partner_id: form.partner_id,
        investment_date: form.investment_date,
        investment_type: form.investment_type,
        dealer_name:
  form.investment_type === "Dealer Payment"
    ? form.dealer_name.trim()
    : null,

vendor_name:
  form.investment_type === "Vendor Payment"
    ? form.vendor_name.trim()
    : null,

amount: Number(form.amount),
        payment_mode: form.payment_mode,
        reference_no: form.reference_no.trim() || null,
        purpose: form.purpose.trim() || null,
        remarks: form.remarks.trim() || null,
      };

      if (editingInvestment) {
        await updateInvestment(editingInvestment.id, payload);
      } else {
        await addInvestment(payload);
      }

      closeModal();
      await loadData();
    } catch (error) {
      console.error("Error saving investment:", error);
      alert(
        error?.message ||
          "Unable to save investment. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  // ===================================================
  // DELETE INVESTMENT
  // ===================================================

  const handleDelete = async (investment) => {
    const investorName =
      investment.partners?.partner_name || "this investor";

    const confirmed = window.confirm(
      `Delete this investment of ₹${Number(
        investment.amount || 0
      ).toLocaleString("en-IN")} by ${investorName}?`
    );

    if (!confirmed) return;

    try {
      await deleteInvestment(investment.id);
      await loadData();
    } catch (error) {
      console.error("Error deleting investment:", error);
      alert(
        error?.message ||
          "Unable to delete investment. Please try again."
      );
    }
  };

  // ===================================================
  // FILTER INVESTMENTS
  // ===================================================

  const filteredInvestments = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return investments;

    return investments.filter((investment) => {
      const investorName =
        investment.partners?.partner_name || "";

      return [
        investorName,
        investment.investment_type,
        investment.dealer_name,
        investment.payment_mode,
        investment.reference_no,
        investment.purpose,
        investment.remarks,
      ]
        .filter(Boolean)
        .some((value) =>
          String(value).toLowerCase().includes(query)
        );
    });
  }, [investments, search]);

  // ===================================================
  // TOTAL INVESTMENT
  // ===================================================

  const totalInvestment = useMemo(() => {
    return investments.reduce(
      (total, investment) =>
        total + Number(investment.amount || 0),
      0
    );
  }, [investments]);

  // ===================================================
  // PARTNER TOTALS
  // ===================================================

  const partnerTotals = useMemo(() => {
    const totals = {};

    partners.forEach((partner) => {
      totals[partner.id] = 0;
    });

    investments.forEach((investment) => {
      if (investment.partner_id) {
        totals[investment.partner_id] =
          (totals[investment.partner_id] || 0) +
          Number(investment.amount || 0);
      }
    });

    return totals;
  }, [partners, investments]);

  // ===================================================
  // FORMAT CURRENCY
  // ===================================================

  const formatCurrency = (amount) => {
    return `₹${Number(amount || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  // ===================================================
  // FORMAT DATE
  // ===================================================

  const formatDate = (date) => {
    if (!date) return "-";

    const d = new Date(`${date}T00:00:00`);

    return d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // ===================================================
  // UI
  // ===================================================

  return (
    <div className="p-6 space-y-6">
      {/* =================================================
          HEADER
      ================================================= */}

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Investments
          </h1>

          <p className="text-sm text-gray-500 mt-1">
            Manage partner investments and dealer payments.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-green-600 text-white font-medium hover:bg-green-700 transition"
        >
          <Plus size={18} />
          Add Investment
        </button>
      </div>

      {/* =================================================
          SUMMARY CARDS
      ================================================= */}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
        {/* TOTAL */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">
                Total Investment
              </p>

              <h2 className="text-xl font-bold text-gray-800 mt-2">
                {formatCurrency(totalInvestment)}
              </h2>
            </div>

            <div className="p-3 rounded-lg bg-green-100 text-green-600">
              <IndianRupee size={22} />
            </div>
          </div>
        </div>

        {/* PARTNERS */}
        {partners.map((partner) => (
          <div
            key={partner.id}
            className="bg-white rounded-xl border border-gray-200 shadow-sm p-5"
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm text-gray-500">
                  {partner.partner_name}
                </p>

                <h2 className="text-xl font-bold text-gray-800 mt-2">
                  {formatCurrency(
                    partnerTotals[partner.id] || 0
                  )}
                </h2>
              </div>

              <div className="p-3 rounded-lg bg-blue-100 text-blue-600">
                <Users size={22} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* =================================================
          SEARCH
      ================================================= */}

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search investor, type, dealer, payment mode..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <button
            onClick={() => setSearch("")}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            <RotateCcw size={17} />
            Reset
          </button>
        </div>
      </div>

      {/* =================================================
          TABLE
      ================================================= */}

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-gray-800">
              Investment History
            </h2>

            <p className="text-xs text-gray-500 mt-1">
              {filteredInvestments.length} transaction
              {filteredInvestments.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-black">
            <thead className="bg-indigo-700 text-white">
              <tr className="text-center text-xs  font-semibold text-white ">
                <th className="border border-black px-2 py-1 text-center text-sm font-semibold">
  Date
</th>

<th className="border border-black px-2 py-1 text-center text-sm font-semibold">
  Investor
</th>

<th className="border border-black px-2 py-1 text-center text-sm font-semibold">
  Investment Type
</th>

<th className="border border-black px-2 py-1 text-center text-sm font-semibold">
  Party / Name
</th>

<th className="border border-black px-2 py-1 text-center text-sm font-semibold">
  Amount
</th>

<th className="border border-black px-2 py-1 text-center text-sm font-semibold">
  Payment Mode
</th>


<th className="border border-black px-2 py-1 text-center text-sm font-semibold">
  Description
</th>

<th className="border border-black px-2 py-1 text-center text-sm font-semibold">
  Action
</th>

              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td
                    colSpan="9"
                    className="px-5 py-10 text-center text-gray-500"
                  >
                    Loading investments...
                  </td>
                </tr>
              ) : filteredInvestments.length === 0 ? (
                <tr>
                  <td
                    colSpan="8"
                    className="px-5 py-10 text-center text-gray-500"
                  >
                    No investment records found.
                  </td>
                </tr>
              ) : (
                filteredInvestments.map((investment) => (
                  <tr
  key={investment.id}
  className="hover:bg-emerald-50"
>
                    <td className="border border-black px-2 py-1 text-center text-sm text-black">
                      {formatDate(
                        investment.investment_date
                      )}
                    </td>

                    <td className="border border-black px-2 py-1 text-center text-sm text-black">
                      {investment.partners?.partner_name ||
                        "-"}
                    </td>

                    <td className="border border-black px-2 py-1 text-center text-sm">
  <span
    className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${
      investment.investment_type === "Additional Investment"
        ? "bg-green-100 text-green-800"
        : investment.investment_type === "Dealer Payment"
        ? "bg-orange-100 text-orange-800"
        : investment.investment_type === "Vendor Payment"
        ? "bg-blue-100 text-blue-800"
        : investment.investment_type === "Miscellaneous"
        ? "bg-purple-100 text-purple-800"
        : "bg-gray-100 text-gray-800"
    }`}
  >
    {investment.investment_type}
  </span>
</td>

                    <td className="border border-black px-2 py-1 text-center text-sm text-black">
  {investment.investment_type === "Dealer Payment"
    ? investment.dealer_name || "-"
    : investment.investment_type === "Vendor Payment"
    ? investment.vendor_name || "-"
    : "-"}
</td>

                    <td className="border border-black px-1 py-1 text-center text-sm font-bold text-green-700">
  ₹ {Number(investment.amount || 0).toLocaleString("en-IN")}
</td>

                    <td className="border border-black px-2 py-1 text-center text-sm text-black">
                      <span className="inline-flex items-center gap-1.5">
                        <CreditCard size={15} />
                        {investment.payment_mode || "-"}
                      </span>
                    </td>

                    

<td className="border border-black px-2 py-1 text-center text-sm text-black">
  {investment.purpose || "-"}
</td>

                    <td className="border border-black px-2 py-1 text-center text-sm text-black">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() =>
                            openEditModal(investment)
                          }
                          className="p-2 rounded-lg text-blue-600 hover:bg-blue-50"
                          title="Edit"
                        >
                          <Edit size={17} />
                        </button>

                        <button
                          onClick={() =>
                            handleDelete(investment)
                          }
                          className="p-2 rounded-lg text-red-600 hover:bg-red-50"
                          title="Delete"
                        >
                          <Trash2 size={17} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* =================================================
          ADD / EDIT MODAL
      ================================================= */}

           {/* =================================================
          ADD / EDIT MODAL
      ================================================= */}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-white rounded-xl shadow-xl">
            {/* MODAL HEADER */}
            <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-800">
                  {editingInvestment
                    ? "Edit Investment"
                    : "Add Investment"}
                </h2>

                <p className="text-xs text-gray-500 mt-1">
                  Record partner investment or payment.
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"
              >
                <X size={20} />
              </button>
            </div>

            {/* FORM */}
            <form
              onSubmit={handleSubmit}
              className="p-6 space-y-5"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                {/* INVESTOR */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Investor Name *
                  </label>

                  <select
                    name="partner_id"
                    value={form.partner_id}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-green-500 bg-white"
                  >
                    <option value="">
                      Select Investor
                    </option>

                    {partners.map((partner) => (
                      <option
                        key={partner.id}
                        value={partner.id}
                      >
                        {partner.partner_name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* INVESTMENT TYPE */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Investment Type *
                  </label>

                  <select
                    name="investment_type"
                    value={form.investment_type}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-green-500 bg-white"
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
                  </select>
                </div>

                {/* DEALER NAME */}
                {form.investment_type === "Dealer Payment" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Dealer Name *
                    </label>

                    <input
                      type="text"
                      name="dealer_name"
                      value={form.dealer_name}
                      onChange={handleChange}
                      required
                      placeholder="Enter dealer name"
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                )}

                {/* VENDOR NAME */}
                {form.investment_type === "Vendor Payment" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Vendor Name *
                    </label>

                    <input
                      type="text"
                      name="vendor_name"
                      value={form.vendor_name}
                      onChange={handleChange}
                      required
                      placeholder="Enter vendor name"
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                )}

                {/* INVESTMENT DATE */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Investment Date *
                  </label>

                  <div className="relative">
                    <CalendarDays
                      size={17}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    />

                    <input
                      type="date"
                      name="investment_date"
                      value={form.investment_date}
                      onChange={handleChange}
                      required
                      className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                </div>

                {/* AMOUNT */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Amount *
                  </label>

                  <div className="relative">
                    <IndianRupee
                      size={17}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    />

                    <input
                      type="number"
                      name="amount"
                      value={form.amount}
                      onChange={handleChange}
                      required
                      min="0.01"
                      step="0.01"
                      placeholder="Enter amount"
                      className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                </div>

                {/* PAYMENT MODE */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Payment Mode *
                  </label>

                  <select
                    name="payment_mode"
                    value={form.payment_mode}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-green-500 bg-white"
                  >
                    <option value="Cash">Cash</option>
                    <option value="Bank">Bank</option>
                    <option value="UPI">UPI</option>
                    <option value="Cheque">Cheque</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                {/* REFERENCE NUMBER */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Reference No.
                  </label>

                  <input
                    type="text"
                    name="reference_no"
                    value={form.reference_no}
                    onChange={handleChange}
                    placeholder="UTR / Cheque No. / Transaction No."
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                {/* DESCRIPTION */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Description
                  </label>

                  <input
                    type="text"
                    name="purpose"
                    value={form.purpose}
                    onChange={handleChange}
                    placeholder="Enter description"
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>

              {/* REMARKS */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Remarks
                </label>

                <textarea
                  name="remarks"
                  value={form.remarks}
                  onChange={handleChange}
                  rows="3"
                  placeholder="Enter remarks"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-green-500 resize-none"
                />
              </div>

              {/* ACTIONS */}
              <div className="flex justify-end gap-3 pt-3 border-t border-gray-200">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="px-5 py-2.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 rounded-lg bg-green-600 text-white font-medium hover:bg-green-700 disabled:opacity-50"
                >
                  {saving
                    ? "Saving..."
                    : editingInvestment
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