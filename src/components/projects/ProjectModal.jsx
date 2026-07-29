export default function ProjectModal({
  open,
  form,
  setForm,
  customers,
  editing,
  onClose,
  onSave,
}) {
  if (!open) return null;

  function handleChange(e) {
    const { name, value } = e.target;

    setForm({
      ...form,
      [name]: value,
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-2xl rounded-xl bg-white shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="text-xl font-semibold">
            {editing ? "Edit Project" : "New Project"}
          </h2>

          <button
            onClick={onClose}
            className="text-2xl text-gray-500 hover:text-red-600"
          >
            ×
          </button>
        </div>

        {/* Form */}
        <form onSubmit={onSave} className="p-6">
          <div className="grid grid-cols-2 gap-4">

            {/* Customer */}
            <div className="col-span-2">
              <label className="mb-1 block text-sm font-medium">
                Customer
              </label>

              <select
                name="customer_id"
                value={form.customer_id}
                onChange={handleChange}
                className="w-full rounded-lg border p-2"
                required
              >
                <option value="">Select Customer</option>

                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.customer_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Project Name */}
            <div className="col-span-2">
              <label className="mb-1 block text-sm font-medium">
                Project Name
              </label>

              <input
                type="text"
                name="project_name"
                value={form.project_name}
                onChange={handleChange}
                className="w-full rounded-lg border p-2"
                required
              />
            </div>

            {/* Date */}
            <div>
              <label className="mb-1 block text-sm font-medium">
                Project Date
              </label>

              <input
                type="date"
                name="project_date"
                value={form.project_date}
                onChange={handleChange}
                className="w-full rounded-lg border p-2"
              />
            </div>

            {/* Status */}
            <div>
              <label className="mb-1 block text-sm font-medium">
                Status
              </label>

              <select
                name="status"
                value={form.status}
                onChange={handleChange}
                className="w-full rounded-lg border p-2"
              >
                <option value="Pending">Pending</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>

            {/* Total Amount */}
            <div className="col-span-2">
              <label className="mb-1 block text-sm font-medium">
                Total Amount
              </label>

              <input
                type="number"
                min="0"
                name="total_amount"
                value={form.total_amount}
                onChange={handleChange}
                className="w-full rounded-lg border p-2"
              />
            </div>

            {/* Remarks */}
            <div className="col-span-2">
              <label className="mb-1 block text-sm font-medium">
                Remarks
              </label>

              <textarea
                rows={3}
                name="remarks"
                value={form.remarks}
                onChange={handleChange}
                className="w-full rounded-lg border p-2"
              />
            </div>

          </div>

          {/* Footer */}
          <div className="mt-6 flex justify-end gap-3">

            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border px-5 py-2 hover:bg-gray-100"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="rounded-lg bg-blue-600 px-5 py-2 text-white hover:bg-blue-700"
            >
              {editing ? "Update Project" : "Save Project"}
            </button>

          </div>
        </form>
      </div>
    </div>
  );
}