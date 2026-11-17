
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Home, Eye, Pencil, Trash2, RefreshCw } from "lucide-react";
import {
  getWorkCompletionReports,
  deleteWorkCompletionReport,
} from "../services/workCompletionReportService";

export default function WorkCompletionReport() {
  const navigate = useNavigate();

  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadReports = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getWorkCompletionReports();
      setReports(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error loading work completion reports:", err);
      setError(err.message || "Unable to load reports.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this report?")) {
      return;
    }

    try {
      await deleteWorkCompletionReport(id);
      await loadReports();
    } catch (err) {
      console.error("Error deleting report:", err);
      alert(err.message || "Unable to delete report.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      {/* PAGE HEADER */}
      <div className="relative mb-6 overflow-hidden rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600 p-6 text-white shadow-lg sm:p-8">
        <div className="absolute -right-8 -top-12 h-40 w-40 rounded-full bg-pink-400/30 blur-2xl" />
        <div className="absolute -bottom-12 left-1/3 h-32 w-32 rounded-full bg-cyan-300/30 blur-2xl" />

        <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">
              Work Completion Report
            </h1>

            <p className="mt-2 text-sm text-white/90">
              Manage and view all your work completion reports
            </p>

            <div className="mt-4 h-1 w-20 rounded-full bg-gradient-to-r from-yellow-300 to-pink-300" />
          </div>

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

      {/* ACTION BUTTONS */}
      <div className="mb-5 flex justify-end gap-3">
        <button
          type="button"
          onClick={loadReports}
          className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-3 font-semibold text-gray-700 hover:bg-gray-100"
        >
          <RefreshCw size={18} />
          Refresh
        </button>

        <button
          type="button"
          onClick={() => navigate("/work-completion-report/new")}
          className="rounded-lg bg-blue-600 px-6 py-3 font-bold text-white hover:bg-blue-700"
        >
          + Create Report
        </button>
      </div>

      {/* REPORTS TABLE */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 px-5 py-4">
          <h2 className="text-lg font-bold text-gray-800">
            Saved Reports
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Total reports: {reports.length}
          </p>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-500">
            Loading reports...
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <p className="font-medium text-red-600">{error}</p>
            <button
              type="button"
              onClick={loadReports}
              className="mt-3 rounded-lg bg-blue-600 px-4 py-2 text-white"
            >
              Try Again
            </button>
          </div>
        ) : reports.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No work completion reports found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[750px] text-left text-sm">
              <thead className="bg-gray-100 text-xs uppercase text-gray-600">
                <tr>
                  <th className="px-5 py-4">S.No.</th>
                  <th className="px-5 py-4">Report No.</th>
                  <th className="px-5 py-4">Customer Name</th>
                  <th className="px-5 py-4">Report Date</th>
                  <th className="px-5 py-4">Plant Capacity</th>
                  <th className="px-5 py-4 text-center">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {reports.map((report, index) => {
                  const details = report.report_data || {};

                  return (
                    <tr key={report.id} className="hover:bg-blue-50/50">
                      <td className="px-5 py-4">{index + 1}</td>
                      <td className="px-5 py-4">
  <button
    type="button"
    onClick={() =>
      navigate(`/work-completion-report/new?id=${report.id}&view=1`)
    }
    className="font-semibold text-blue-600 hover:text-blue-800 hover:underline"
  >
    {report.report_no || `WCR-${report.id}`}
  </button>
</td>
                      <td className="px-5 py-4">
                        {details.customer_name || "—"}
                      </td>
                      <td className="px-5 py-4">
                        {details.report_date || "—"}
                      </td>
                      <td className="px-5 py-4">
                        {details.plant_capacity || details.plant_size || "—"}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex justify-center gap-2">
                          <button
                            type="button"
                            title="View Report"
                            onClick={() =>
                              navigate(`/work-completion-report/new?id=${report.id}&view=1`)
                            }
                            className="rounded-lg bg-blue-50 p-2 text-blue-600 hover:bg-blue-100"
                          >
                            <Eye size={18} />
                          </button>

                          <button
                            type="button"
                            title="Edit Report"
                            onClick={() =>
                              navigate(`/work-completion-report/new?id=${report.id}`)
                            }
                            className="rounded-lg bg-amber-50 p-2 text-amber-600 hover:bg-amber-100"
                          >
                            <Pencil size={18} />
                          </button>

                          <button
                            type="button"
                            title="Delete Report"
                            onClick={() => handleDelete(report.id)}
                            className="rounded-lg bg-red-50 p-2 text-red-600 hover:bg-red-100"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
