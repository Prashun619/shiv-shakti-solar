import { supabase } from "../services/supabase";
import { useEffect, useState } from "react";

import {
  getCustomers,
  getCustomerWithProject,
  deleteCustomer,
} from "../services/customersService";

import {
  updatePayment,
  deletePayment,
} from "../services/paymentsService";

import CustomerModal from "../components/CustomerModal";
import KpiCard from "../components/ui/KpiCard";
import PaymentModal from "../components/PaymentModal";

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [openModal, setOpenModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [openPaymentModal, setOpenPaymentModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
const [selectedCustomer, setSelectedCustomer] = useState(null);
const [deleting, setDeleting] = useState(false);
const [viewCustomer, setViewCustomer] = useState(null);
const [editPayment, setEditPayment] = useState(null);
const [deletePaymentModal, setDeletePaymentModal] = useState(false);
const [selectedPayment, setSelectedPayment] = useState(null);
const [paymentAmount, setPaymentAmount] = useState("");
const [paymentMode, setPaymentMode] = useState("");
const [paymentReference, setPaymentReference] = useState("");
const today = new Date().toISOString().split("T")[0];

const totalCustomers = customers.length;

const cashCustomers = customers.filter(
  (customer) => customer.payment_type === "Cash"
).length;

const financeCustomers = customers.filter(
  (customer) => customer.payment_type === "Finance"
).length;

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


const customersWithProjects = await Promise.all(
  data.map(async (customer)=>{

    const {
  data: projects,
  error: projectError,
} = await supabase
  .from("projects")
  .select("*")
  .eq("customer_id", customer.id);

console.log(
  "Customer:",
  customer.customer_name,
  customer.id,
  projects,
  projectError
);

if (projectError) {
  console.error("Project Error:", projectError);
}

const project = projects?.[0] || null;

console.log(
  customer.customer_name,
  customer.id,
  project
);
    return {
  ...customer,

  project,

  project_id: project?.id || null,
  project_no: project?.project_no || "",

  total_amount: project?.total_amount || 0,
  received: project?.received || 0,
  remaining: project?.remaining || 0,

  status: project?.status || "Pending",
};


  })
);


customersWithProjects.sort((a, b) => {

  if (!a.project) return 1;
  if (!b.project) return -1;

  return a.project.project_no.localeCompare(
  b.project.project_no
);

});


setCustomers(customersWithProjects);
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


    const customersWithProjects = await Promise.all(
      data.map(async (customer)=>{

        const { data: project } = await supabase
          .from("projects")
          .select("*")
          .eq("customer_id", customer.id)
          .single();


        return {
  ...customer,

  project,

  project_id: project?.id || null,
  project_no: project?.project_no || "",

  total_amount: project?.total_amount || 0,
  received: project?.received || 0,
  remaining: project?.remaining || 0,

  status: project?.status || "Pending",
};  

      })
    );


    customersWithProjects.sort((a, b) => {

  if (!a.project) return 1;
  if (!b.project) return -1;

  return a.project.project_no.localeCompare(
  b.project.project_no
);

});


setCustomers(customersWithProjects);


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

  async function handleEditCustomer(customer){

  try{

    const fullCustomer =
      await getCustomerWithProject(customer.id);

    setEditingCustomer(fullCustomer);

    setOpenModal(true);

  }
  catch(err){

    console.error(err);

    alert("Unable to load customer.");

  }

}

async function handleViewCustomer(customer) {

  console.log("CUSTOMER CLICK:", customer);

  const { data: project, error } = await supabase
    .from("projects")
    .select("*")
    .eq("customer_id", customer.id)
    .maybeSingle();


  console.log("PROJECT DATA:", project);
  console.log("PROJECT ERROR:", error);


  let payments = [];


  if(project){

    const { data, error: paymentError } = await supabase
      .from("payments")
      .select("*")
      .eq("project_id", project.id)
      .order("payment_date", {
        ascending:false
      });


    console.log("PAYMENTS:", data);
    console.log("PAYMENT ERROR:", paymentError);


    payments = data || [];

  }


  setViewCustomer({
    ...customer,
    project,
    payments
  });

}
function openEditPayment(payment){

  setEditPayment(payment);

  setPaymentAmount(payment.amount);

  setPaymentMode(payment.payment_mode || "");

  setPaymentReference(payment.reference_no || "");

}


async function saveEditedPayment(){

await updatePayment(
 editPayment.id,
 {
   amount:Number(paymentAmount),
   payment_mode:paymentMode,
   reference_no:paymentReference
 },
 viewCustomer.project.id
);


setEditPayment(null);

loadCustomers();

}


  function removePayment(payment){

  setSelectedPayment(payment);

  setDeletePaymentModal(true);

}


async function confirmDeletePayment(){

await deletePayment(
 selectedPayment.id,
 viewCustomer.project.id
);


setDeletePaymentModal(false);

setSelectedPayment(null);

loadCustomers();

}

  return (
    <div className="p-4 bg-[#f4f6fb] min-h-screen w-full">

     {/* Header */}

<div className="bg-gradient-to-r from-slate-900 via-indigo-900 to-blue-700 rounded-2xl shadow-xl px-6 py-5 mb-6">

  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">

    <div>
      <h1 className="text-3xl font-bold text-white">
        Customers
      </h1>

      <p className="text-blue-100 mt-1">
        Manage Customer Information
      </p>
    </div>

   <div className="flex flex-wrap gap-3">

  <button
    onClick={() => setOpenPaymentModal(true)}
    className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold px-6 py-3 rounded-xl shadow-lg transition-all duration-200 hover:-translate-y-0.5"
  >
    + Add Payment
  </button>

  <button
    onClick={handleAddCustomer}
    className="bg-white text-indigo-700 border border-indigo-200 font-semibold px-6 py-3 rounded-xl shadow-lg hover:bg-indigo-50 transition-all duration-200 hover:-translate-y-0.5"
  >
    + Add Customer
  </button>

</div>
  </div>

</div>
   
        

      {/* Search */}

<div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-5 mb-6">

  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

    {/* Search Box */}
    <div className="relative w-full md:max-w-md">

      <svg
        className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z"
        />
      </svg>

      <input
        type="text"
        placeholder="Search customer by name, mobile or email..."
        value={search}
        onChange={(e) => handleSearch(e.target.value)}
        className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 outline-none transition"
      />

    </div>


  <div className="text-sm text-gray-500 font-medium">
  Showing <span className="font-bold text-indigo-600">{customers.length}</span> customer(s)
</div>

</div>
</div>


      {/* KPI Cards */}

<div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">

  <KpiCard
    title="Total Customers"
    value={totalCustomers}
    color="blue"
  />

  <KpiCard
    title="Cash Customers"
    value={cashCustomers}
    color="green"
  />

  <KpiCard
    title="Finance Customers"
    value={financeCustomers}
    color="purple"
  />

  <KpiCard
    title="Today's Customers"
    value={newCustomers}
    color="orange"
  />

</div>


      {/* Table */}

     <div className="overflow-hidden rounded-2xl bg-white shadow-xl border border-slate-200">
  <div className="overflow-x-auto rounded-2xl">

       <table className="w-full text-xs border border-black border-collapse">

           <thead className="bg-slate-900 text-white border border-black">

            <tr>

<th className="px-3 py-3 text-left whitespace-nowrap border border-black">
  Project No
</th>

<th className="px-3 py-3 text-center whitespace-nowrap border border-black">
  Customer Name
</th>

<th className="px-3 py-3 text-center whitespace-nowrap border border-black">
  Mobile
</th>

<th className="px-3 py-3 text-center whitespace-nowrap border border-black">
Payment Type
</th>

<th className="px-3 py-3 text-center whitespace-nowrap border border-black">
  Plant Size
</th>

<th className="px-3 py-3 text-center whitespace-nowrap border border-black">
  Total Cost
</th>

<th className="px-3 py-3 text-center whitespace-nowrap border border-black">
  Received
</th>

<th className="px-3 py-3 text-center whitespace-nowrap border border-black">
  Remaining
</th>

<th className="px-3 py-3 text-center whitespace-nowrap border border-black">
  Status
</th>

<th className="px-3 py-3 text-center whitespace-nowrap border border-black">
  Actions
</th>

</tr>

          </thead>

          <tbody>

            {loading ? (

              <tr>

                <td
  colSpan="5"
  className="py-16 text-center text-slate-400 text-lg"
>
                  Loading...
                </td>

              </tr>

            ) : customers.length === 0 ? (

              <tr>

                <td
  colSpan="5"
  className="py-16 text-center"
>
                  <div className="flex flex-col items-center">

  <div className="text-5xl mb-3">
    📭
  </div>

  <h3 className="text-lg font-semibold text-slate-700">
    No Customers Found
  </h3>

  <p className="text-slate-500 mt-1">
    Try changing your search or add a new customer.
  </p>

</div>
                </td>

              </tr>

            ) : (

              customers.map((customer) => (

                <tr
  key={customer.id}
  className="odd:bg-white even:bg-slate-50 hover:bg-indigo-50 transition-all duration-200"
>

                  

  <td className="px-3 py-3 border border-black">

  <button
    type="button"
    onClick={() => handleViewCustomer(customer)}
    className="font-bold text-indigo-700 hover:text-blue-600 hover:underline cursor-pointer"
  >
    {customer.project_no || "-"}
  </button>

</td>

<td className="px-3 py-3 border border-black">

  <p className="font-semibold text-slate-800">
    {customer.customer_name}
  </p>

</td>


<td className="px-3 py-3 border border-black text-sm text-slate-700 whitespace-nowrap">
  {customer.mobile || "-"}
</td>


<td className="px-3 py-3 border border-black text-center whitespace-nowrap">

<span
className={`px-3 py-1 rounded-full text-xs font-semibold ${
customer.payment_type === "Finance"
? "bg-purple-100 text-purple-700"
: "bg-green-100 text-green-700"
}`}
>
{customer.payment_type || "-"}
</span>

</td>


<td className="px-3 py-3 border border-black text-center text-sm text-slate-700">
  {customer.project?.project_size || customer.plant_size || "-"} kW
</td>


<td className="px-3 py-3 border border-black text-center font-semibold">
  ₹ {Number(customer.project?.total_amount || 0).toLocaleString()}
</td>


<td className="px-3 py-3 border border-black text-center text-green-600 font-semibold">
  ₹ {Number(customer.project?.received || 0).toLocaleString()}
</td>


<td className="px-3 py-3 border border-black text-center text-red-600 font-semibold">
  ₹ {Number(customer.project?.remaining || 0).toLocaleString()}
</td>


<td className="px-3 py-3 border border-black text-center whitespace-nowrap">

  <span
    className={`px-3 py-1 rounded-full text-xs font-bold ${
      customer.project?.status === "Completed"
        ? "bg-green-100 text-green-700"
        : "bg-orange-100 text-orange-700"
    }`}
  >
    {customer.project?.status || "Pending"}
  </span>

</td>


<td className="px-3 py-3 border border-black whitespace-nowrap">

  <div className="flex justify-center gap-3">

    <button
      onClick={() => handleEditCustomer(customer)}
      title="Edit Customer"
      className="w-10 h-10 rounded-full bg-sky-100 text-sky-700 hover:bg-sky-600 hover:text-white transition-all duration-200 flex items-center justify-center shadow"
    >
      ✏️
    </button>


    <button
      onClick={() => handleDelete(customer)}
      title="Delete Customer"
      className="w-10 h-10 rounded-full bg-red-100 text-red-700 hover:bg-red-600 hover:text-white transition-all duration-200 flex items-center justify-center shadow"
    >
      🗑️
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

<PaymentModal
  open={openPaymentModal}
  onClose={() => setOpenPaymentModal(false)}
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
  <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">

    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-7xl max-h-[92vh] overflow-y-auto">

      {/* Header */}

      <div className="bg-gradient-to-r from-slate-900 via-indigo-900 to-blue-700 px-8 py-6 flex items-center justify-between sticky top-0 z-10">

        <h2 className="text-2xl font-bold text-white">
          Customer Details
        </h2>

        <button
          onClick={() => setViewCustomer(null)}
          className="text-3xl text-white hover:text-red-300"
        >
          ×
        </button>

      </div>

   {/* Body */}

<div className="p-6">

  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">


    {/* CUSTOMER PROFILE */}

    <div className="lg:col-span-12">


      <div className="flex items-center gap-4 mb-5">

        <div className="w-14 h-14 rounded-full bg-gradient-to-r from-indigo-600 to-blue-500 text-white flex items-center justify-center text-xl font-bold shadow-md">

          {viewCustomer.customer_name?.charAt(0).toUpperCase()}

        </div>


        <div>

          <h3 className="text-xl font-bold text-slate-800">
            {viewCustomer.customer_name}
          </h3>

          <p className="text-sm text-slate-500">
            Customer Profile
          </p>

        </div>


      </div>



      {/* CUSTOMER INFORMATION ROW */}

      <div className="grid grid-cols-4 gap-4">


        <div className="bg-slate-50 rounded-xl border p-4">

          <p className="text-xs uppercase text-slate-500">
            Mobile
          </p>

          <p className="font-semibold text-sm mt-1">
            {viewCustomer.mobile || "-"}
          </p>

        </div>




        <div className="bg-slate-50 rounded-xl border p-4">

          <p className="text-xs uppercase text-slate-500">
            Email
          </p>

          <p className="font-semibold text-xs mt-1 whitespace-nowrap">
            {viewCustomer.email || "-"}
          </p>

        </div>




        <div className="bg-slate-50 rounded-xl border p-4">

          <p className="text-xs uppercase text-slate-500">
            Location
          </p>

          <p className="font-semibold text-sm mt-1">
            {viewCustomer.location || "-"}
          </p>

        </div>




        <div className="bg-slate-50 rounded-xl border p-4">

          <p className="text-xs uppercase text-slate-500">
            Plant Size
          </p>

          <p className="font-semibold text-sm mt-1">
            {viewCustomer.plant_size || "-"}
          </p>

        </div>


      </div>



      {/* ADDRESS */}

      <div className="mt-4">

        <p className="text-xs uppercase text-slate-500 mb-2">
          Address
        </p>


        <div className="bg-slate-50 rounded-xl border p-4 text-sm min-h-[90px] whitespace-pre-wrap">

          {viewCustomer.address || "-"}

        </div>


      </div>


    </div>





    {/* PROJECT INFORMATION */}


    <div className="lg:col-span-12 mt-2">


      <h3 className="text-lg font-bold mb-5">
        Project Information
      </h3>




      <div className="grid grid-cols-6 gap-4">



        <div className="bg-slate-50 rounded-xl border p-4">

          <p className="text-xs uppercase text-slate-500">
            Project No
          </p>

          <p className="text-sm font-bold mt-1">
            {viewCustomer.project?.project_no || "-"}
          </p>

        </div>





        <div className="bg-slate-50 rounded-xl border p-4">

          <p className="text-xs uppercase text-slate-500">
            Plant Size
          </p>

          <p className="text-sm font-bold mt-1">
            {viewCustomer.project?.project_size || viewCustomer.plant_size || "-"} kW
          </p>

        </div>





        <div className="bg-slate-50 rounded-xl border p-4">

          <p className="text-xs uppercase text-slate-500">
            Total Amount
          </p>

          <p className="text-sm font-bold mt-1">
            ₹ {Number(viewCustomer.project?.total_amount || 0).toLocaleString()}
          </p>

        </div>





        <div className="bg-slate-50 rounded-xl border p-4">

          <p className="text-xs uppercase text-slate-500">
            Received
          </p>

          <p className="text-sm font-bold text-green-600 mt-1">
            ₹ {Number(viewCustomer.project?.received || 0).toLocaleString()}
          </p>

        </div>





        <div className="bg-slate-50 rounded-xl border p-4">

          <p className="text-xs uppercase text-slate-500">
            Remaining
          </p>

          <p className="text-sm font-bold text-red-600 mt-1">
            ₹ {Number(viewCustomer.project?.remaining || 0).toLocaleString()}
          </p>

        </div>





        <div className="bg-slate-50 rounded-xl border p-4">

          <p className="text-xs uppercase text-slate-500">
            Status
          </p>

          <p className="text-sm font-bold mt-1">
            {viewCustomer.project?.status || "-"}
          </p>

        </div>


      </div>


    </div>





  {/* PAYMENT HISTORY */}

<div className="lg:col-span-12 mt-4">


<h3 className="text-lg font-bold mb-4">
Payment History
</h3>


<div className="overflow-x-auto border rounded-xl">


<table className="w-full">


<thead className="bg-slate-100">

<tr>

<th className="px-4 py-3 text-left text-sm">
Date
</th>

<th className="px-4 py-3 text-left text-sm">
Amount
</th>

<th className="px-4 py-3 text-left text-sm">
Mode
</th>

<th className="px-4 py-3 text-left text-sm">
Reference
</th>

<th className="px-4 py-3 text-center text-sm">
Action
</th>

</tr>

</thead>


<tbody>


{viewCustomer.payments?.length ? (

viewCustomer.payments.map((payment)=>(


<tr key={payment.id} className="border-t">


<td className="px-4 py-3 text-sm">
{payment.payment_date}
</td>


<td className="px-4 py-3 text-sm font-semibold text-green-700">

₹ {Number(payment.amount).toLocaleString()}

</td>


<td className="px-4 py-3 text-sm">
{payment.payment_mode || "-"}
</td>


<td className="px-4 py-3 text-sm">
{payment.reference_no || "-"}
</td>


<td className="px-4 py-3">

<div className="flex justify-center gap-2">


<button

onClick={()=>openEditPayment(payment)}

className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 hover:bg-blue-600 hover:text-white"

>
✏️
</button>



<button

onClick={()=>removePayment(payment)}

className="w-9 h-9 rounded-full bg-red-100 text-red-700 hover:bg-red-600 hover:text-white"

>
🗑️
</button>


</div>

</td>


</tr>


))

):(


<tr>

<td colSpan="5" className="text-center py-8 text-gray-400">

No Payments

</td>

</tr>


)}


</tbody>


</table>


</div>


</div>

  </div>


</div>

{/* EDIT PAYMENT MODAL */}

{editPayment && (

<div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">


<div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">


<h2 className="text-xl font-bold mb-5">
Edit Payment
</h2>



<div className="space-y-4">


<div>

<label className="text-sm font-medium">
Amount
</label>

<input

type="number"

value={paymentAmount}

onChange={(e)=>setPaymentAmount(e.target.value)}

className="border p-2 w-full rounded-lg"

/>

</div>



<div>

<label className="text-sm font-medium">
Payment Mode
</label>


<select

value={paymentMode}

onChange={(e)=>setPaymentMode(e.target.value)}

className="border p-2 w-full rounded-lg"

>


<option>
Cash
</option>


<option>
UPI
</option>


<option>
Bank Transfer
</option>


<option>
Cheque
</option>


</select>


</div>



<div>

<label className="text-sm font-medium">
Reference No
</label>


<input

value={paymentReference}

onChange={(e)=>setPaymentReference(e.target.value)}

className="border p-2 w-full rounded-lg"

/>


</div>



</div>




<div className="flex justify-end gap-3 mt-6">


<button

onClick={()=>setEditPayment(null)}

className="px-5 py-2 border rounded-lg"

>
Cancel
</button>



<button

onClick={saveEditedPayment}

className="px-5 py-2 bg-green-600 text-white rounded-lg"

>
Update Payment
</button>


</div>



</div>


</div>

)}

{/* DELETE PAYMENT MODAL */}

{deletePaymentModal && (

<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">


<div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">


<div className="flex justify-center mb-4">

<div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center text-3xl">

⚠️

</div>

</div>


<h2 className="text-xl font-bold text-center">

Delete Payment

</h2>


<p className="text-center text-gray-600 mt-3">

Are you sure you want to delete

<br/>

<span className="font-bold text-gray-800">

₹ {Number(selectedPayment?.amount || 0).toLocaleString()}

</span>

payment?

</p>



<div className="flex justify-center gap-3 mt-6">


<button

onClick={()=>{

setDeletePaymentModal(false);

setSelectedPayment(null);

}}

className="px-5 py-2 border rounded-lg"

>

Cancel

</button>



<button

onClick={confirmDeletePayment}

className="px-5 py-2 bg-red-600 text-white rounded-lg"

>

Delete

</button>


</div>


</div>


</div>

)}

      {/* Footer */}

      <div className="sticky bottom-0 border-t bg-white px-8 py-4 flex justify-end shadow-[0_-2px_8px_rgba(0,0,0,0.08)]">

        <button
          onClick={() => setViewCustomer(null)}
          className="px-6 py-2 rounded-lg border hover:bg-gray-100"
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