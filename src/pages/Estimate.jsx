
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../services/supabase";
import { Home } from "lucide-react";

const money = (value) =>
  Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export default function Estimate() {
  const navigate = useNavigate();

  const [estimates, setEstimates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadEstimates = useCallback(async () => {
    setLoading(true);
    setError("");

    const { data, error: fetchError } = await supabase
      .from("estimates")
      .select("*")
      .order("estimate_date", { ascending: false });

    if (fetchError) {
      console.error("Error loading estimates:", fetchError);
      setError(fetchError.message);
      setEstimates([]);
    } else {
      setEstimates(data || []);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    loadEstimates();
  }, [loadEstimates]);

  const deleteEstimate = async (estimate) => {
    const confirmed = window.confirm(
      `Delete the estimate for "${estimate.customer_name}"? This cannot be undone.`
    );

    if (!confirmed) return;

    const { error: deleteError } = await supabase
      .from("estimates")
      .delete()
      .eq("id", estimate.id);

    if (deleteError) {
      alert(`Unable to delete estimate: ${deleteError.message}`);
      return;
    }

    setEstimates((current) =>
      current.filter((item) => item.id !== estimate.id)
    );
  };

  
const openEstimate = (estimate, mode) => {
  navigate(`/estimate/new?id=${encodeURIComponent(estimate.id)}&mode=${mode}`);
};


  return (
    
<div className="p-6">
  {/* PAGE HEADER */}
  <div className="relative mb-6 overflow-hidden rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600 p-6 text-white shadow-lg sm:p-8">
    <div className="absolute -right-8 -top-12 h-40 w-40 rounded-full bg-pink-400/30 blur-2xl" />
    <div className="absolute -bottom-12 left-1/3 h-32 w-32 rounded-full bg-cyan-300/30 blur-2xl" />

    <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">
          Estimate
        </h1>
        <p className="mt-2 text-sm text-white/90">
          Manage and view all your estimates
        </p>
        <div className="mt-4 h-1 w-20 rounded-full bg-gradient-to-r from-yellow-300 to-pink-300" />
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate("/estimate/new")}
          className="rounded-xl bg-white px-5 py-3 font-bold text-green-700 shadow-sm transition hover:bg-green-50"
        >
          + Create Estimate
        </button>

        <button
          type="button"
          onClick={() => navigate("/customer-service")}
          title="Back to Customer Service"
          aria-label="Back to Customer Service"
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-white/40 bg-white/20 text-white transition hover:bg-white/30"
        >
          <Home size={24} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  </div>

  <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
    <div className="flex flex-wrap items-center justify-between gap-3 border-b p-5">
      <h2 className="text-xl font-bold text-slate-800">
        Saved Estimates
      </h2>


          <button
            type="button"
            onClick={loadEstimates}
            className="rounded-lg border px-4 py-2 font-semibold text-slate-700 hover:bg-slate-50"
          >
            Refresh
          </button>
        </div>

        {error && (
          <div className="m-5 rounded-lg bg-red-50 p-4 text-sm text-red-700">
            <p className="font-semibold">Could not load estimates.</p>
            <p className="mt-1">{error}</p>
            <p className="mt-2">
              Check that the estimates table and its Supabase permissions
              are configured.
            </p>
          </div>
        )}

        {loading ? (
          <p className="p-8 text-center text-slate-500">
            Loading estimates...
          </p>
        ) : !error && estimates.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-lg font-semibold text-slate-700">
              No saved estimates yet
            </p>
            <p className="mt-2 text-sm text-slate-500">
              Click Create Estimate to prepare your first quotation.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] border-collapse text-left text-sm">
              <thead className="bg-slate-100 text-slate-700">
                <tr>
                  {[
                    "Sr. No.",
                    "Date",
                    "Customer Name",
                    "Location",
                    "Plant Size",
                    "Total (₹)",
                    "Actions",
                  ].map((heading) => (
                    <th
                      key={heading}
                      className="border-b px-4 py-3 font-bold"
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {estimates.map((estimate, index) => (
                  <tr
                    key={estimate.id}
                    className="hover:bg-slate-50"
                  >
                    <td className="border-b px-4 py-3">{index + 1}</td>
                    <td className="border-b px-4 py-3">
                      {estimate.estimate_date || "-"}
                    </td>
                    <td className="border-b px-4 py-3 font-semibold">
                      {estimate.customer_name || "-"}
                    </td>
                    <td className="border-b px-4 py-3">
                      {estimate.location || "-"}
                    </td>
                    <td className="border-b px-4 py-3">
                      {estimate.plant_size
                        ? `${estimate.plant_size} KW`
                        : "-"}
                    </td>
                    <td className="border-b px-4 py-3 font-semibold">
                      ₹{money(estimate.total)}
                    </td>
                    <td className="border-b px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => openEstimate(estimate, "view")}
                          className="rounded-md bg-blue-100 px-3 py-1.5 font-semibold text-blue-700 hover:bg-blue-200"
                        >
                          View
                        </button>

                        <button
                          type="button"
                          onClick={() => openEstimate(estimate, "edit")}
                          className="rounded-md bg-amber-100 px-3 py-1.5 font-semibold text-amber-800 hover:bg-amber-200"
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() => deleteEstimate(estimate)}
                          className="rounded-md bg-red-100 px-3 py-1.5 font-semibold text-red-700 hover:bg-red-200"
                        >
                          Delete
                        </button>

                        <button
  type="button"
  onClick={() => openEstimate(estimate, "pdf")}
  className="rounded-md bg-green-100 px-3 py-1.5 font-semibold text-green-700 hover:bg-green-200"
>
  Download PDF
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
  );
}
