export default function ProjectTable({
  projects,
  loading,
  onEdit,
  onDelete,
}) {
  const statusClass = (status) => {
    switch (status) {
      case "Completed":
        return "bg-green-100 text-green-700";

      case "Cancelled":
        return "bg-red-100 text-red-700";

      default:
        return "bg-yellow-100 text-yellow-700";
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow p-10 text-center">
        <p className="text-gray-500">Loading projects...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow overflow-hidden">
      <div className="overflow-x-auto">

        <table className="min-w-full text-sm">

          <thead className="bg-gray-100">

            <tr className="border-b">

              <th className="px-4 py-3 text-left font-semibold">
                Project No
              </th>

              <th className="px-4 py-3 text-left font-semibold">
                Customer
              </th>

              <th className="px-4 py-3 text-left font-semibold">
                Project Name
              </th>

              <th className="px-4 py-3 text-left font-semibold">
                Date
              </th>

              <th className="px-4 py-3 text-center font-semibold">
                Status
              </th>

              <th className="px-4 py-3 text-right font-semibold">
                Total
              </th>

              <th className="px-4 py-3 text-right font-semibold">
                Received
              </th>

              <th className="px-4 py-3 text-right font-semibold">
                Pending
              </th>

              <th className="px-4 py-3 text-center font-semibold">
                Actions
              </th>

            </tr>

          </thead>

          <tbody>

            {projects.length === 0 ? (

              <tr>

                <td
                  colSpan={9}
                  className="text-center py-10 text-gray-500"
                >
                  No Projects Found
                </td>

              </tr>

            ) : (

              projects.map((project) => (

                <tr
                  key={project.id}
                  className="border-b hover:bg-gray-50"
                >

                  <td className="px-4 py-3 font-medium">
                    {project.project_no}
                  </td>

                  <td className="px-4 py-3">
                    {project.customers?.customer_name || "-"}
                  </td>

                  <td className="px-4 py-3">
                    {project.project_name}
                  </td>

                  <td className="px-4 py-3">
                    {project.project_date}
                  </td>

                  <td className="px-4 py-3 text-center">

                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${statusClass(
                        project.status
                      )}`}
                    >
                      {project.status}
                    </span>

                  </td>

                  <td className="px-4 py-3 text-right">
                    ₹
                    {Number(project.total_amount).toLocaleString(
                      "en-IN"
                    )}
                  </td>

                  <td className="px-4 py-3 text-right">
                    ₹
                    {Number(project.received_amount).toLocaleString(
                      "en-IN"
                    )}
                  </td>

                  <td className="px-4 py-3 text-right font-semibold text-red-600">
                    ₹
                    {Number(project.pending_amount).toLocaleString(
                      "en-IN"
                    )}
                  </td>

                  <td className="px-4 py-3">

                    <div className="flex justify-center gap-2">

                      <button
                        onClick={() => onEdit(project)}
                        className="px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700"
                      >
                        Edit
                      </button>

                      <button
                        onClick={() => onDelete(project.id)}
                        className="px-3 py-1 rounded bg-red-600 text-white hover:bg-red-700"
                      >
                        Delete
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
  );
}