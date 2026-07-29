import {
  getCustomerReport,
  getProjectReport,
  exportCustomerCSV,
} from "../services/reportService";
import { getInventory } from "../services/inventoryService";
import { getAllPayments } from "../services/paymentsService";
import { exportCustomerPDF } from "../services/reports/customerPDF";
import { exportProjectCSV } from "../services/reports/projectCSV";
import { exportProjectPDF } from "../services/reports/projectPDF";
import { exportInventoryCSV } from "../services/reports/inventoryCSV";
import { exportInventoryPDF } from "../services/reports/inventoryPDF";
import { exportPaymentCSV } from "../services/reports/paymentCSV";
import { exportPaymentPDF } from "../services/reports/paymentPDF";
import { useEffect, useMemo, useState } from "react";

import {
  Users,
  FolderKanban,
  IndianRupee,
  Boxes,
  Search,
  Download,
  FileText,
} from "lucide-react";

console.log(getAllPayments);

export default function Reports() {
  const [selectedReport, setSelectedReport] = useState("");
  console.log("Selected Report:", selectedReport);
  const [customers, setCustomers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [inventory, setInventory] = useState([]); 
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
const [projectSummary, setProjectSummary] = useState({
  totalProjects: 0,
  totalValue: 0,
  totalReceived: 0,
  totalRemaining: 0,
});
  const reports = [
    {
      id: "customers",
      title: "Customer Report",
      icon: Users,
      color: "blue",
    },
    {
      id: "projects",
      title: "Project Report",
      icon: FolderKanban,
      color: "emerald",
    },
    {
      id: "payments",
      title: "Payment Report",
      icon: IndianRupee,
      color: "amber",
    },
    {
      id: "inventory",
      title: "Inventory Report",
      icon: Boxes,
      color: "purple",
    },
   
  ];

  useEffect(() => {
  if (selectedReport === "customers") {
    loadCustomers();
  }
}, [selectedReport]);

async function loadCustomers() {
  try {
    setLoading(true);

    const data = await getCustomerReport();

    setCustomers(data);
  } catch (err) {
    console.error(err);
  } finally {
    setLoading(false);
  }
}

async function loadProjects() {

  setLoading(true);

  try {

    const data = await getProjectReport();

    setProjects(data);

  } catch (err) {

    console.error(err);

  } finally {

    setLoading(false);

  }

}

async function loadInventory() {

  try {

    setLoading(true);

    const data = await getInventory();
    console.log("Inventory Data:", data);

    setInventory(data);

  } catch (err) {

    console.error(err);

  } finally {

    setLoading(false);

  }

}

async function loadUsedInventory() {

  try {

    setLoading(true);

    const data = await getUsedInventory();

    setUsedInventory(data);

  } catch (err) {

    console.error(err);

  } finally {

    setLoading(false);

  }

}

async function loadPayments() {

  try {

    setLoading(true);

    const data = await getAllPayments();
console.log("Payments Data:", data);
    setPayments(data);

  } catch (err) {

    console.error(err);

  } finally {

    setLoading(false);

  }

}

const filteredCustomers = useMemo(() => {
  const value = search.toLowerCase();

  return customers.filter((customer) => {
    return (
      customer.customer_name?.toLowerCase().includes(value) ||
      customer.mobile?.toLowerCase().includes(value) ||
      customer.email?.toLowerCase().includes(value) ||
      customer.location?.toLowerCase().includes(value)
    );
  });
}, [customers, search]);

const filteredProjects = useMemo(() => {

  return projects.filter((project) => {

    const text = search.toLowerCase();

    return (

      (project.project_no || "")
        .toLowerCase()
        .includes(text)

      ||

      (project.customers?.customer_name || "")
        .toLowerCase()
        .includes(text)

      ||

      (project.status || "")
        .toLowerCase()
        .includes(text)

    );

  });

}, [projects, search]);

const filteredInventory = useMemo(() => {

  const text = search.toLowerCase();

  return inventory.filter((item) =>

    (item.product_name || "")
      .toLowerCase()
      .includes(text)

    ||

    (item.category || "")
      .toLowerCase()
      .includes(text)

    ||

    (item.company || "")
      .toLowerCase()
      .includes(text)

  );

}, [inventory, search]);
const filteredPayments = useMemo(() => {

  const text = search.toLowerCase();

  return payments.filter((payment) =>

    (payment.projects?.customers?.customer_name || "")
      .toLowerCase()
      .includes(text)

    ||

    (payment.projects?.project_no || "")
      .toLowerCase()
      .includes(text)

    ||

    (payment.payment_type || "")
      .toLowerCase()
      .includes(text)

    ||

    (payment.payment_mode || "")
      .toLowerCase()
      .includes(text)

  );

}, [payments, search]);

const filteredUsedInventory = useMemo(() => {

  const text = search.toLowerCase();

 

}, [search]);

return (
    <div className="p-6 bg-gray-100 min-h-screen">

      {/* Header */}

      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl text-white p-6 shadow-lg mb-6">

        <h1 className="text-3xl font-bold">
          Reports
        </h1>

        <p className="mt-2 text-blue-100">
          View, filter and export all business reports.
        </p>

      </div>

      {/* Report Cards */}

      <div className="grid grid-cols-5 gap-5 mb-6">

        {reports.map((report) => {

          const Icon = report.icon;

          return (

            <button
              key={report.id}
              onClick={() => {

  setSelectedReport(report.id);

  if (report.id === "customers") {

    loadCustomers();

  }

  if (report.id === "projects") {

    loadProjects();

  }

if (report.id === "inventory") {

  loadInventory();

}


if (report.id === "payments") {

  loadPayments();

}

}}
              className={`rounded-2xl p-5 bg-white shadow hover:shadow-xl border-2 transition-all text-left ${
                selectedReport === report.id
                  ? "border-blue-600"
                  : "border-transparent"
              }`}
            >

              <Icon
                size={34}
                className="text-blue-600 mb-3"
              />

              <h3 className="font-bold text-gray-800">
                {report.title}
              </h3>

            </button>

          );
        })}
      </div>

      {/* Toolbar */}

      <div className="bg-white rounded-xl shadow p-4 flex justify-between items-center mb-5">

        <div className="relative w-96">

          <Search
            className="absolute left-3 top-3 text-gray-400"
            size={18}
          />

          <input
  type="text"
  value={search}
  onChange={(e) => setSearch(e.target.value)}
  placeholder="Search customer..."
  className="border rounded-lg pl-10 pr-4 py-2 w-full"
/>

        </div>

        <div className="flex gap-3">

         <button
 onClick={() => {

  if (selectedReport === "customers") {
    exportCustomerCSV(filteredCustomers);
  }

  if (selectedReport === "projects") {
    exportProjectCSV(filteredProjects);
  }

  if (selectedReport === "inventory") {
    exportInventoryCSV(filteredInventory);
  }

  if (selectedReport === "payments") {
    exportPaymentCSV(filteredPayments);
  }


}}

  className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg disabled:opacity-50"
  disabled={!selectedReport}
>

  <Download size={18} />

  CSV

</button>

          <button
  onClick={() => {

  if (selectedReport === "customers") {
    exportCustomerPDF(filteredCustomers);
  }

  if (selectedReport === "projects") {
    exportProjectPDF(filteredProjects);
  }

  if (selectedReport === "inventory") {
    exportInventoryPDF(filteredInventory);
  }

  if (selectedReport === "payments") {
    exportPaymentPDF(filteredPayments);
  }

  
}}

  className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg disabled:opacity-50"
  disabled={!selectedReport}
>

  <FileText size={18} />

  PDF

</button>

        </div>

      </div>

      {/* Report Viewer */}

      <div className="bg-white rounded-2xl shadow min-h-[500px]">

        {!selectedReport ? (

          <div className="flex items-center justify-center h-[500px] text-gray-400 text-xl">

            Select a report to view.

          </div>

        ) : (

          <div className="p-6">

<div className="flex justify-between items-center mb-4">

  <h2 className="text-2xl font-bold text-slate-700">
    {reports.find(r => r.id === selectedReport)?.title}
  </h2>

  {selectedReport === "customers" && (
    <p className="text-lg font-semibold text-blue-700">
      Total Customers - {filteredCustomers.length}
    </p>
  )}



  {selectedReport === "projects" && (
    <p className="text-lg font-semibold text-emerald-700">
      Total Projects - {filteredProjects.length}
    </p>
  )}

{selectedReport === "inventory" && (
  <p className="text-lg font-semibold text-purple-700">
    Total Products - {filteredInventory.length}
  </p>
)}

{selectedReport === "payments" && (
  <p className="text-lg font-semibold text-amber-700">
    Total Payments - {filteredPayments.length}
  </p>
)}



</div>

{selectedReport === "inventory" && (

  <>

    <div className="overflow-x-auto rounded-xl border">

      <table className="min-w-full">

        <thead className="bg-purple-600 text-white">

          <tr>

            <th className="p-3">S.No</th>

            <th className="p-3 text-left">
  Product
</th>

            <th className="p-3 text-left">
              Category
            </th>

            <th className="p-3 text-center">
              Available Qty
            </th>

            <th className="p-3 text-center">
              Unit
            </th>

            <th className="p-3 text-right">
              Unit Cost
            </th>

            <th className="p-3 text-right">
              Stock Value
            </th>

          </tr>

        </thead>

        <tbody>

          {loading ? (

            <tr>

              <td
                colSpan={8}
                className="text-center py-10"
              >
                Loading...
              </td>

            </tr>

          ) : filteredInventory.length === 0 ? (

            <tr>

              <td
                colSpan={8}
                className="text-center py-10"
              >
                No Inventory Found
              </td>

            </tr>

          ) : (

            filteredInventory.map((item, index) => (

              <tr
                key={item.id}
                className="border-b hover:bg-purple-50 even:bg-gray-50"
              >

                <td className="p-3 text-center">
                  {index + 1}
                </td>

                <td className="p-3">

  {
    [
      item.company,
      item.product_name,
      item.specification
    ]
    .filter(Boolean)
    .join(" ")

  }

</td>

                

                <td className="p-3">
                  {item.category}
                </td>

                <td className="p-3 text-center">
                  {item.quantity}
                </td>

                <td className="p-3 text-center">
                  {item.unit}
                </td>

                <td className="p-3 text-right">
                  ₹ {Math.round(item.unit_cost || 0)}
                </td>

                <td className="p-3 text-right font-semibold text-purple-700">
                  ₹ {Math.round(
                    (item.quantity || 0) *
                    (item.unit_cost || 0)
                  )}
                </td>

              </tr>

            ))

          )}

        </tbody>

      </table>

    </div>

  </>

)}


            
{selectedReport === "customers" && (

  <>
    

    <div className="overflow-x-auto rounded-xl border">

      <table className="min-w-full">

        <thead className="bg-teal-600 text-white">

          <tr>

            <th className="p-3">S.No</th>

            <th className="p-3 text-left">
              Customer Name
            </th>

            <th className="p-3">
              Mobile
            </th>

            

            <th className="p-3 text-left">
              Location
            </th>

            <th className="p-3">
              Plant Size
            </th>

            <th className="p-3">
              Payment Type
            </th>

          </tr>

        </thead>

        <tbody>

          {loading ? (

            <tr>

              <td
                colSpan="8"
                className="text-center py-10"
              >

                Loading...

              </td>

            </tr>

          ) : filteredCustomers.length === 0 ? (

            <tr>

              <td
                colSpan="8"
                className="text-center py-10"
              >

                No Customers Found

              </td>

            </tr>

          ) : (

            filteredCustomers.map((customer, index) => (

              <tr
                key={customer.id}
                className="border-b hover:bg-blue-50 even:bg-gray-50"
              >

                <td className="p-3 text-center">
                  {index + 1}
                </td>

                <td className="p-3">
                  {customer.customer_name}
                </td>

                <td className="p-3 text-center">
                  {customer.mobile}
                </td>


                <td className="p-3">
                  {customer.location}
                </td>

                <td className="p-3 text-center">
                  {customer.plant_size}
                </td>

                <td className="p-3 text-center">
                  {customer.payment_type}
                </td>

              </tr>

            ))

          )}

        </tbody>

      </table>

    </div>

  </>
)}

{selectedReport === "payments" && (
  <>
    <div className="overflow-x-auto rounded-xl border">

      <table className="min-w-full">

        <thead className="bg-amber-600 text-white">
          <tr>
            <th className="p-3">S.No</th>
            <th className="p-3">Date</th>
            <th className="p-3 text-left">Customer</th>
            <th className="p-3">Project No</th>
            <th className="p-3">Payment Type</th>
            <th className="p-3">Payment Mode</th>
            <th className="p-3 text-right">
  Amount
</th>

<th className="p-3 text-right">
  Received Amount
</th>


            <th className="p-3">Reference No</th>
          </tr>
        </thead>

        <tbody>

          {loading ? (

            <tr>
              <td colSpan={8} className="text-center py-10">
                Loading...
              </td>
            </tr>

          ) : filteredPayments.length === 0 ? (

            <tr>
              <td colSpan={8} className="text-center py-10">
                No Payments Found
              </td>
            </tr>

          ) : (


            
            filteredPayments.map((payment, index) => (

              <tr
                key={payment.id}
                className="border-b hover:bg-amber-50 even:bg-gray-50"
              >

                <td className="p-3 text-center">
                  {index + 1}
                </td>

                <td className="p-3 text-center">
                  {payment.payment_date
                    ? new Date(payment.payment_date).toLocaleDateString(
                        "en-GB",
                        {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        }
                      )
                    : "-"}
                </td>

                <td className="p-3">
                  {payment.projects?.customers?.customer_name || "-"}
                </td>

                <td className="p-3 text-center">
                  {payment.projects?.project_no || "-"}
                </td>

                <td className="p-3 text-center">
                  {payment.payment_type || "-"}
                </td>

                <td className="p-3 text-center">
                  {payment.payment_mode || "-"}
                </td>

                <td className="p-3 text-right font-semibold text-green-700">
                  ₹ {Number(payment.amount || 0).toFixed(2)}
                </td>

                <td className="p-3 text-right font-semibold text-blue-700">
  ₹ {Number(
    payment.projects?.received || 0
  ).toFixed(2)}
</td>

                <td className="p-3 text-center">
                  {payment.reference_no || "-"}
                </td>

              </tr>

            ))

          )}

        </tbody>

      </table>

    </div>
  </>
)}



{selectedReport === "projects" && (
  <>

   
    {/* Table */}

    <div className="overflow-x-auto rounded-xl border">

      <table className="min-w-full">

        <thead className="bg-emerald-600 text-white">

          <tr>

            <th className="p-3">S.No</th>

            <th className="p-3 text-left">
              Project No
            </th>

            <th className="p-3 text-left">
              Customer
            </th>

            <th className="p-3">
              Project Date
            </th>

            <th className="p-3">
              Plant Size
            </th>

            <th className="p-3">
              Status
            </th>

            <th className="p-3 text-right">
              Total Amount
            </th>

            <th className="p-3 text-right">
              Received
            </th>

            <th className="p-3 text-right">
              Remaining
            </th>

          </tr>

        </thead>

        <tbody>

          {loading ? (

            <tr>

              <td
                colSpan={9}
                className="text-center py-10"
              >
                Loading...
              </td>

            </tr>

          ) : filteredProjects.length === 0 ? (

            <tr>

              <td
                colSpan={9}
                className="text-center py-10"
              >
                No Projects Found
              </td>

            </tr>

          ) : (

            filteredProjects.map((project, index) => (

              <tr
                key={project.id}
                className="border-b hover:bg-emerald-50 even:bg-gray-50"
              >

                <td className="p-3 text-center">
                  {index + 1}
                </td>

                <td className="p-3">
                  {project.project_no}
                </td>

                <td className="p-3">
                  {project.customers?.customer_name}
                </td>

                <td className="p-3 text-center">

                  {project.project_date
                    ? new Date(project.project_date).toLocaleDateString(
                        "en-GB",
                        {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        }
                      )
                    : "-"}

                </td>

                <td className="p-3 text-center">
                  {project.project_size}
                </td>

                <td className="p-3 text-center">

                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold
                    ${
                      project.status === "Completed"
                        ? "bg-green-100 text-green-700"
                        : project.status === "Pending"
                        ? "bg-yellow-100 text-yellow-700"
                        : project.status === "Cancelled"
                        ? "bg-red-100 text-red-700"
                        : "bg-blue-100 text-blue-700"
                    }`}
                  >

                    {project.status}

                  </span>

                </td>

                <td className="p-3 text-right">
                  ₹ {Number(project.total_amount || 0).toFixed(2)}
                </td>

                <td className="p-3 text-right">
                  ₹ {Number(project.received || 0).toFixed(2)}
                </td>

                <td className="p-3 text-right font-semibold text-red-600">
                  ₹ {Number(project.remaining || 0).toFixed(2)}
                </td>

              </tr>

            ))

          )}

        </tbody>

      </table>

    </div>

  </>
)}



          </div>

        )}

      </div>

    </div>
  );
}