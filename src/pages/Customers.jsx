import { useEffect, useState } from "react";
import {
  getCustomers,
  deleteCustomer,
} from "../services/customersService";
import CustomerModal from "../components/CustomerModal";

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [openModal, setOpenModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [deleteModal, setDeleteModal] = useState(false);
const [selectedCustomer, setSelectedCustomer] = useState(null);
const [deleting, setDeleting] = useState(false);
const [viewCustomer, setViewCustomer] = useState(null);
const today = new Date().toISOString().split("T")[0];

const totalCustomers = customers.length;

const newCustomers = customers.filter((customer) => {
  if (!customer.created_at) return false;

  return customer.created_at.startsWith(today);
}).length;

  useEffect(() => {
    loadCustomers();
  }, []);

  async function loadCustomers() {
    setLoading(true);

    try {
      const data = await getCustomers(search);
      setCustomers(data);
    } catch (err) {
      console.error(err);
      alert("Failed to load customers.");
    }

    setLoading(false);
  }

  async function handleSearch(value) {
    setSearch(value);

    try {
      const data = await getCustomers(value);
      setCustomers(data);
    } catch (err) {
      console.error(err);
    }
  }

  function handleDelete(customer) {
  setSelectedCustomer(customer);
  setDeleteModal(true);
}
async function confirmDelete() {
  if (!selectedCustomer) return;

  setDeleting(true);

  try {
    await deleteCustomer(selectedCustomer.id);

    setDeleteModal(false);
    setSelectedCustomer(null);

    loadCustomers();

  } catch (err) {
    console.error(err);
    alert("Unable to delete customer.");
  } finally {
    setDeleting(false);
  }
}

  function handleAddCustomer() {
    setEditingCustomer(null);
    setOpenModal(true);
  }

  function handleEditCustomer(customer) {
    setEditingCustomer(customer);
    setOpenModal(true);
  }
function handleViewCustomer(customer) {
  setViewCustomer(customer);
}
  return (
    <div className="p-4 bg-gradient-to-br from-slate-100 via-blue-50 to-indigo-100 min-h-screen max-w-[1200px] mx-auto">

      {/* Header */}
<div className="bg-gradient-to-r from-slate-900 via-indigo-900 to-blue-700 rounded-2xl shadow-2xl px-5 py-4 mb-6">
  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">

    {/* Left */}
    <div>
      <h1 className="text-4xl font-extrabold text-white tracking-wide">
        Customers
      </h1>

      <p className="text-blue-100 mt-2 text-lg">
        Manage Customer Information
      </p>
    </div>

    {/* Center */}
    <div className="bg-white rounded-xl shadow-lg border border-slate-200 px-8 py-4">
      <p className="text-gray-500 text-sm text-center">
        Total Customers
      </p>

      <h2 className="text-3xl font-bold text-gray-800 text-center">
        {totalCustomers}
      </h2>
    </div>

    {/* Right */}
    <button
      onClick={handleAddCustomer}
      className="bg-white text-indigo-700 font-bold px-6 py-3 rounded-xl shadow-lg hover:shadow-2xl hover:scale-105 transition-all duration-300"
    >
      + Add Customer
    </button>

  </div>
</div>
        

      {/* Search */}

      <div className="bg-white rounded-xl shadow-xl border border-slate-200 p-4 mb-5">

        <input
type="text"
placeholder="Search customer..."
value={search}
onChange={(e) => handleSearch(e.target.value)}
className="w-full max-w-md rounded-xl border-2 border-slate-200 bg-slate-50 px-3 py-1 outline-none transition-all duration-300 focus:border-indigo-500 focus:bg-white"
/>

      </div>

      {/* Table */}

     <div className="overflow-hidden rounded-xl bg-white shadow-xl border-2 border-black">
  <div className="overflow-x-auto">

        <table className="w-full table-fixed">

          <thead className="bg-gradient-to-r from-slate-800 via-slate-700 to-slate-900 text-white"> 

            <tr>

              <th className="border border-black px-3 py-1.5 text-center align-middle text-sm font-semibold">
                Customer
              </th>

              <th className="border border-black px-3 py-1.5 text-center align-middle text-sm font-semibold">
                Mobile
              </th>

              <th className="border border-black px-3 py-1.5 text-center align-middle text-sm font-semibold">
                Email
              </th>

              <th className="border border-black px-3 py-1.5 text-center align-middle text-sm font-semibold">
  Payment Type
</th>

              <th className="border border-black px-3 py-1.5 text-center align-middle text-sm font-semibold">
                Actions
              </th>

            </tr>

          </thead>

          <tbody>

            {loading ? (

              <tr>

                <td
                  colSpan="5"
                  className="py-12 text-center text-slate-500 text-lg"
                >
                  Loading...
                </td>

              </tr>

            ) : customers.length === 0 ? (

              <tr>

                <td
                  colSpan="6"
                  className="text-center py-10 text-gray-500"
                >
                  No customers found.
                </td>

              </tr>

            ) : (

              customers.map((customer) => (

                <tr
                  key={customer.id}
                  className="hover:bg-indigo-50 transition-colors duration-200"
                >

                  <td className="border border-black px-3 py-1.5 text-center align-middle text-sm">

  <button
    type="button"
    onClick={() => handleViewCustomer(customer)}
    className="font-bold text-slate-800 hover:text-indigo-700 transition"
  >
    {customer.customer_name}
  </button>

</td>

<td className="border border-black px-3 py-1.5 text-center align-middle text-sm">
  {customer.mobile}
</td>

<td className="border border-black px-3 py-1.5 text-center align-middle text-sm">
  {customer.email}
</td>

<td className="border border-black px-3 py-1.5 text-center align-middle text-sm">

<span
className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
customer.payment_type === "Finance"
?
"bg-purple-100 text-purple-700"
:
"bg-green-100 text-green-700"
}`}
>

{customer.payment_type || "-"}

</span>

</td>

<td className="border border-black px-3 py-1.5 text-center align-middle text-sm">

  <div className="flex justify-center items-center gap-2 whitespace-nowrap">

    <button
      onClick={() => handleEditCustomer(customer)}
      className="bg-sky-600 hover:bg-sky-700 text-white px-3 py-1 text-sm rounded-md shadow transition"
    >
      Edit
    </button>

    <button
      onClick={() => handleDelete(customer)}
     className="bg-rose-600 hover:bg-rose-700 text-white px-3 py-1 text-sm rounded-md shadow transition"
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

 <CustomerModal
  open={openModal}
  customer={editingCustomer}
  onClose={() => setOpenModal(false)}
  onSaved={loadCustomers}
/>
{deleteModal && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">

    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">

      <div className="p-6">

        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mx-auto mb-5">

          <svg
            className="w-8 h-8 text-red-600"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v4m0 4h.01M10.29 3.86L1.82 18A2 2 0 003.53 21h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
            />
          </svg>

        </div>

        <h2 className="text-xl font-bold text-center text-gray-800">
          Delete Customer
        </h2>

        <p className="text-center text-gray-600 mt-3">

          Are you sure you want to delete

          <br />

          <span className="font-semibold text-gray-800">
            {selectedCustomer?.customer_name}
          </span>

          ?

        </p>

        <p className="text-center text-sm text-red-500 mt-2">
          This action cannot be undone.
        </p>

        <div className="flex justify-center gap-3 mt-8">

          <button
            onClick={() => {
              setDeleteModal(false);
              setSelectedCustomer(null);
            }}
            disabled={deleting}
            className="px-5 py-2 rounded-lg border border-gray-300 hover:bg-gray-100"
          >
            Cancel
          </button>

          <button
            onClick={confirmDelete}
            disabled={deleting}
            className="bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded-lg"
          >
            {deleting ? "Deleting..." : "Delete"}
          </button>

        </div>

      </div>

    </div>

  </div>
)}
{/* View Customer Modal */}

{viewCustomer && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">

    <div className="bg-white rounded-3xl shadow-[0_25px_80px_rgba(0,0,0,0.25)] border border-slate-200 w-full max-w-2xl overflow-hidden">

      {/* Header */}

      <div className="bg-gradient-to-r from-slate-900 via-indigo-900 to-blue-700 px-8 py-6 flex items-center justify-between">

        <h2 className="text-2 xl font-bold text-white">
    Customer Details
</h2>

        <button
          type="button"
          onClick={() => setViewCustomer(null)}
          className="text-2xl text-gray-500 hover:text-red-500 transition"
        >
          ✕
        </button>

      </div>

      {/* Body */}

      <div className="p-6 space-y-6">

        <div>
          <p className="text-sm text-gray-500 mb-1">
            Customer Name
          </p>

          <p className="text-lg font-semibold text-gray-800">
            {viewCustomer.customer_name}
          </p>
        </div>

        <div className="flex flex-wrap gap-4 mb-5">

          <div>
            <p className="text-sm text-gray-500 mb-1">
              Mobile
            </p>

            <p className="font-medium">
              {viewCustomer.mobile}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500 mb-1">
              Email
            </p>

            <p className="font-medium break-all">
              {viewCustomer.email || "-"}
            </p>
          </div>

        </div>

        <div>

          <p className="text-sm text-gray-500 mb-1">
            Address
          </p>

          <div className="border rounded-lg bg-gray-50 p-4 min-h-[90px]">

            <p className="text-gray-700 whitespace-pre-wrap">
              {viewCustomer.address || "-"}
            </p>

          </div>

        </div>

      </div>

      {/* Footer */}

      <div className="border-t px-6 py-4 flex justify-end">

        <button
          type="button"
          onClick={() => setViewCustomer(null)}
          className="px-6 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-100 transition"
        >
          Close
        </button>

      </div>

    </div>

  </div>
)}
    </div>
    
  );
}