
import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Save } from "lucide-react";

import { getCustomers } from "../services/customersService";
import {
  addWorkCompletionReport,
  updateWorkCompletionReport,
  getWorkCompletionReportById,
} from "../services/workCompletionReportService";

const sections = [
  {
    title: "A. Details of the Solar PV Module",
    fields: [
  ["module_model", "Model No."],
  ["module_manufacturer", "Name and address of manufacturer", "select"],
  ["module_capacity", "Capacity of each module (Wp)", "select"],
  ["module_quantity", "No. of modules", "select"],
  ["module_total_capacity", "Total capacity (kWp)", "number"],
  ["module_installation_date", "Date of installation", "date"],
],
  },
  {
    title: "B. Details of the Inverter",
    fields: [
  ["inverter_manufacturer", "Name and address of manufacturer", "select"],
  ["inverter_brand", "Brand name"],
  ["inverter_model", "Model No."],
  ["inverter_individual_capacity", "AC capacity of individual inverter (kW)", "number"],
  ["inverter_quantity", "No. of inverters installed", "number"],
  ["inverter_total_capacity", "Total AC capacity (kW)", "number"],
  ["inverter_serial_numbers", "Serial Nos.", "text"],
  ["inverter_installation_date", "Date of installation", "date"],
],
  },
 {
  title: "C. Details of DC Cables",
  fields: [
    ["dc_cable_manufacturer", "Make / Name of manufacturer", "select"],
    ["dc_cable_size_type", "Size & Type", "fixed"],
  ],
},
{
  title: "D. Details of AC Wiring",
  fields: [
    ["ac_wiring_manufacturer", "Make / Name of manufacturer", "select"],
    ["ac_wiring_size_type", "Size & Type", "fixed"],
  ],
},
{
  title: "E. Details of DC Distribution Box",
  fields: [
    ["dc_box_manufacturer", "Make / Name of manufacturer", "select"],
    ["dc_box_serial", "Sl. No.", "fixed"],
    ["dc_surge_protection", "DC Surge Protection Device", "fixed"],
    ["dc_mcb_quantity_capacity", "MCB/Isolator quantity & capacity", "fixed"],
    ["dc_box_size_type", "Size & Type", "fixed"],
  ],
},
{
  title: "F. Details of AC Distribution Box",
  fields: [
    ["ac_box_manufacturer", "Make / Name of manufacturer", "linked"],
    ["ac_box_serial", "Sl. No.", "fixed"],
    ["ac_surge_protection", "AC Surge Protection Device", "fixed"],
    ["ac_mcb_quantity_capacity", "MCB/MCCB quantity & capacity", "fixed"],
    ["ac_box_size_type", "Size & Type", "fixed"],
  ],
},
  {
  title: "G. Details of Battery Bank",
  fields: [
    ["battery_manufacturer", "Make / Name of manufacturer", "battery"],
    ["battery_manufacturer_name", "Enter manufacturer name"],
    ["battery_type", "Type of battery"],
    ["battery_serial_numbers", "Serial Nos.", "text"],
  ],
},
  {
  title: "H. Details of Earthing",
  fields: [],
},
  {
    title: "I. Details of Net Meter Details (Please enclose the test report of the bi-directional meter tested at the laboratory of the Discom)",
    fields: [],
},
  {
  title: "J. Details of Caution Signage",
  fields: [],
},
  {
  title: "K. Manual and Automatic Switches: Yes",
  fields: [],
},
  {
    title: "L. GPS Coordinates",
    fields: [
      ["latitude", "Latitude"],
      ["longitude", "Longitude"],
    ],
  },
  {
    title: "M. Operation and Maintenance Manual: Yes",
    fields: [],
  },
];

const inspectionFields = [
  ["consumer_number", "Electricity consumer number"],
  ["inspection_dc_capacity", "Solar PV module capacity (DC) in kWp", "number"],
  ["inspection_ac_capacity", "Inverter capacity (AC) in kW", "number"],
  ["installation_commissioning_date", "Date of installation / commissioning", "date"],
  ["joint_inspection_date", "Date of joint inspection", "date"],
];

const costFields = [
  ["total_project_cost", "Total project cost (₹)", "number"],
  ["subsidy_amount", "Subsidy amount (₹)", "number"],
  ["beneficiary_paid_amount", "Amount paid by beneficiary (₹)", "number"],
];

export default function WorkCompletionReportForm() {
  const navigate = useNavigate();
const location = useLocation();
const searchParams = new URLSearchParams(location.search);

const reportId = searchParams.get("id");
const isViewMode = searchParams.get("view") === "1";
const isEditMode = Boolean(reportId) && !isViewMode;
  const [customers, setCustomers] = useState([]);
  const [customerId, setCustomerId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [applicantAddress, setApplicantAddress] = useState("");
  const [installationAddress, setInstallationAddress] = useState("");

  const [form, setForm] = useState({
    report_date: new Date().toISOString().slice(0, 10),
    approval_number: "",
    approval_date: "",
    application_number: "",
    applicant_name: "",
    applicant_address: "",
    installation_address: "",
    ...Object.fromEntries(
      [...sections, { fields: inspectionFields }, { fields: costFields }]
        .flatMap((section) => section.fields)
        .map(([key]) => [key, ""])
    ),
    metering_arrangement: "Net Meter",
    net_meter_make: "N/A",
net_meter_serial_no: "N/A",
net_meter_capacity: "N/A",
net_meter_type_model: "SMART METER",
net_meter_phase: "Single Ph.",
net_meter_ct_ratio: "N/A",
net_meter_test_date: "N/A",
    battery_series: "",
battery_parallel: "",
battery_total_ah: "",
battery_total_voltage: "",
    earth_resistance: "< 2 Ohms",
    dc_cable_size_type: "1C x 4sqmm.",
ac_wiring_size_type: "1C x 4sqmm.",

dc_box_serial: "DC1.1",
dc_surge_protection: "600V",
dc_mcb_quantity_capacity: "1 x 1000V",
dc_box_size_type: "180 x 120 mm. (1in 1out)",

ac_box_serial: "AC1.1",
ac_surge_protection: "40kA",
ac_mcb_quantity_capacity: "1 x 32A",
ac_box_size_type: "180 x 120 mm. (Single Ph.)",
    earth_wire_size: "4 sqmm.",
    earth_points_modules: "Yes",
    earth_points_inverter: "Yes",
    earth_size_type: "1m x 14.2mm. x 3 (CBR)",
    manual_automatic_switches: "Yes",
    om_manual: "Yes",
    subsidy_amount: "78000",
  });

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function loadCustomers() {
      try {
        const data = await getCustomers();

console.log("Customers returned:", data);

setCustomers(Array.isArray(data) ? data : data?.data || []);
      } catch (error) {
        console.error("Unable to load customers:", error);
        setErrorMessage("Unable to load customers.");
      }
    }

    loadCustomers();
  }, []);

  useEffect(() => {
  if (!reportId) return;

  async function loadReport() {
    try {
      setLoading(true);
      setErrorMessage("");

      const report = await getWorkCompletionReportById(reportId);
      const data = report?.report_data || {};

      setForm((previous) => ({
        ...previous,
        ...data,
      }));

      setCustomerId(String(data.customer_id || ""));
      setCustomerName(data.customer_name || "");
      setApplicantAddress(data.applicant_address || "");
      setInstallationAddress(data.installation_address || "");
    } catch (error) {
      console.error("Unable to load work completion report:", error);
      setErrorMessage(error.message || "Unable to load the report.");
    } finally {
      setLoading(false);
    }
  }

  loadReport();
}, [reportId]);

 function updateField(key, value) {
  setForm((previous) => {
    const updated = {
      ...previous,
      [key]: value,
    };

    // A. Automatically calculate module total capacity
    if (key === "module_capacity" || key === "module_quantity") {
      const capacity = Number(
        key === "module_capacity" ? value : updated.module_capacity
      );

      const quantity = Number(
        key === "module_quantity" ? value : updated.module_quantity
      );

      updated.module_total_capacity =
        capacity && quantity
          ? ((capacity * quantity) / 1000).toFixed(3)
          : "";
    }

    // B. Automatically select inverter brand
    if (key === "inverter_manufacturer") {
      const brandMap = {
        "Waaree Energies Ltd": "Waaree",
        Adani: "Adani",
        Luminous: "Luminous",
        Polycab: "Polycab",
      };

      updated.inverter_brand = brandMap[value] || "";
    }

    // B. Individual inverter capacity = Total AC capacity
    if (key === "inverter_individual_capacity") {
      updated.inverter_total_capacity = value;
    }

    if (key === "inverter_total_capacity") {
      updated.inverter_individual_capacity = value;
    }

    // A and B installation dates remain identical
if (key === "module_installation_date") {
  updated.inverter_installation_date = value;
  updated.installation_commissioning_date = value;
}

if (key === "inverter_installation_date") {
  updated.module_installation_date = value;
  updated.installation_commissioning_date = value;
}

// Joint Inspection capacities follow Sections A and B
if (key === "module_capacity" || key === "module_quantity") {
  updated.inspection_dc_capacity = updated.module_total_capacity;
}

if (
  key === "inverter_individual_capacity" ||
  key === "inverter_total_capacity"
) {
  updated.inspection_ac_capacity = updated.inverter_total_capacity;
}

    // AC distribution box manufacturer follows DC manufacturer
if (key === "dc_box_manufacturer") {
  updated.ac_box_manufacturer = value;
}

// Battery Bank N/A handling
if (key === "battery_manufacturer") {
  if (value === "N/A") {
    updated.battery_manufacturer_name = "N/A";
    updated.battery_type = "N/A";
    updated.battery_serial_numbers = "N/A";
    updated.battery_cell_capacity = "N/A";
    updated.battery_series = "N/A";
    updated.battery_parallel = "N/A";
    updated.battery_total_ah = "N/A";
    updated.battery_total_voltage = "N/A";
  } else {
    updated.battery_manufacturer_name = "";
    updated.battery_type = "";
    updated.battery_serial_numbers = "";
    updated.battery_cell_capacity = "";
    updated.battery_series = "";
    updated.battery_parallel = "";
    updated.battery_total_ah = "";
    updated.battery_total_voltage = "";
  }
}

// Automatically calculate amount paid by beneficiary
if (key === "total_project_cost" || key === "subsidy_amount") {
  const totalCost = Number(updated.total_project_cost) || 0;
  const subsidy = Number(updated.subsidy_amount) || 0;

  updated.beneficiary_paid_amount =
    updated.total_project_cost === ""
      ? ""
      : String(totalCost - subsidy);
}

    return updated;
  });
}

  function getCustomerAddress(customer) {
  return [
    customer.city,
    customer.pincode,
  ]
    .filter(Boolean)
    .join(", ");
}

  function handleCustomerChange(id) {
    setCustomerId(id);

    const customer = customers.find(
      (item) => String(item.id) === String(id)
    );

    if (!customer) {
      setCustomerName("");
      setApplicantAddress("");
      setInstallationAddress("");

      setForm((previous) => ({
        ...previous,
        applicant_name: "",
        applicant_address: "",
        installation_address: "",
      }));

      return;
    }

    const name = customer.customer_name || "";
    const address = getCustomerAddress(customer);

    setCustomerName(name);
    setApplicantAddress(address);
    setInstallationAddress(address);

    setForm((previous) => ({
      ...previous,
      applicant_name: name,
      applicant_address: address,
      installation_address: address,
    }));
  }

  async function handleSave() {
    if (!customerId) {
      setErrorMessage("Please select a customer.");
      return;
    }

    try {
      setLoading(true);
      setErrorMessage("");

      const reportData = {
        ...form,
        customer_id: customerId,
        customer_name: customerName,
        applicant_address: applicantAddress,
        installation_address: installationAddress,
        installer_name: "M/s. Shiv Shakti Solar Energy",
        installer_address:
          "Flat No. 01, Ward No. 07, Opposite Stadium, Nowgong",
        installer_designation: "Manager - Operations",
        metering_arrangement: "Net Meter",
      };

      if (reportId) {
  await updateWorkCompletionReport(reportId, reportData);
} else {
  await addWorkCompletionReport(reportData);
}

navigate("/work-completion-report");
    } catch (error) {
      console.error("Unable to save report:", error);
      setErrorMessage(
        error?.message || "Unable to save the report. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  function formatCoordinate(value) {
  if (value === "" || value === null || value === undefined) {
    return "";
  }

  const number = Number(String(value).replace("°", "").trim());

  return Number.isFinite(number) ? `${number.toFixed(6)}°` : "";
}

  function renderField(field) {
  const [key, label, type = "text"] = field;

  const dropdownOptions = {
    module_manufacturer: ["Waaree Energies LTD", "Adani"],
    module_capacity: ["580", "585", "600", "620"],
    module_quantity: Array.from({ length: 20 }, (_, index) =>
      String(index + 1)
    ),
    inverter_manufacturer: ["Waaree Energies Ltd", "Luminous", "Polycab"],
    dc_cable_manufacturer: ["Havells", "Polycab", "Waacab"],
    ac_wiring_manufacturer: ["Havells", "Polycab", "Waacab"],
    dc_box_manufacturer: ["Havells", "Polycab", "Waaree"],
    battery_manufacturer: ["Enter Details", "N/A"],
  };

  return (
    <div key={key} className="space-y-1">
      <label className="block text-sm font-semibold text-gray-700">
        {label}
      </label>

      {type === "fixed" || type === "linked" ? (
        <input
          type="text"
          value={form[key] || ""}
          readOnly
          className="w-full rounded-lg border border-gray-300 bg-gray-100 px-3 py-2"
        />
      ) : type === "select" || type === "battery" ? (
        <select
          value={form[key] || ""}
          onChange={(event) => updateField(key, event.target.value)}
          disabled={isViewMode}
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        >
          <option value="">Select {label}</option>

          {(dropdownOptions[key] || []).map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      ) : type === "textarea" ? (
        <textarea
          rows={3}
          value={form[key] || ""}
          readOnly={isViewMode}
          onChange={(event) => updateField(key, event.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        />
      ) : (
        <input
          type={type}
          value={form[key] || ""}
          readOnly={
  isViewMode ||
  [
    "inverter_brand",
    "module_total_capacity",
    "inspection_dc_capacity",
    "inspection_ac_capacity",
    "installation_commissioning_date",
    "beneficiary_paid_amount",
  ].includes(key)
}
          onChange={(event) => updateField(key, event.target.value)}
          className={`w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 ${
            key === "inverter_brand" ||
            key === "module_total_capacity"
              ? "bg-gray-100"
              : ""
          }`}
        />
      )}
    </div>
  );
}

if (loading && reportId) {
  return (
    <div className="min-h-screen bg-gray-50 p-8 text-center text-gray-600">
      Loading report...
    </div>
  );
}

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      {/* FORM HEADER */}
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            {isViewMode
  ? "View Work Completion Report"
  : isEditMode
    ? "Edit Work Completion Report"
    : "Create Work Completion Report"}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Enter the details required for the work completion report.
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate("/work-completion-report")}
          className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 font-semibold text-gray-700 hover:bg-gray-100"
        >
          <ArrowLeft size={18} />
          Back
        </button>
      </div>

      {/* REPORT DETAILS */}
      <div className="mb-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-lg font-bold text-gray-800">
          Report Details
        </h2>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          
          {renderField(["approval_number", "Approval No."])}
          {renderField(["approval_date", "Approval Date", "date"])}
          {renderField(["application_number", "Application No."])}
        </div>
      </div>

      {/* CUSTOMER DETAILS */}
      <div className="mb-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-lg font-bold text-gray-800">
          Customer Details
        </h2>

        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-semibold text-gray-700">
              Select Customer *
            </label>

            <select
  value={customerId}
  disabled={isViewMode}
  onChange={(event) => handleCustomerChange(event.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="">Select Customer</option>

              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.customer_name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-semibold text-gray-700">
                Applicant Name
              </label>
              <input
                value={customerName}
                readOnly
                className="w-full rounded-lg border border-gray-200 bg-gray-100 px-3 py-2"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold text-gray-700">
                Applicant Address
              </label>
              <textarea
                rows={3}
                value={applicantAddress}
                readOnly
                className="w-full rounded-lg border border-gray-200 bg-gray-100 px-3 py-2"
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-semibold text-gray-700">
                Installation Address
              </label>
              <textarea
                rows={3}
                value={installationAddress}
                readOnly
                className="w-full rounded-lg border border-gray-200 bg-gray-100 px-3 py-2"
              />
            </div>
          </div>
        </div>
      </div>

      {/* SECTIONS A TO M */}
      {sections.map((section) => (
        <div
          key={section.title}
          className="mb-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
        >
          <h2 className="mb-4 border-b border-gray-100 pb-3 text-lg font-bold text-gray-800">
            {section.title}
          </h2>

    {section.title === "H. Details of Earthing" ? (
  <div className="overflow-x-auto">
    <table className="w-full border-collapse border border-gray-300 text-sm">
      <thead>
        <tr className="bg-gray-100">
          <th className="w-16 border border-gray-300 p-3 text-center">
            S. No.
          </th>
          <th className="border border-gray-300 p-3 text-left">
            Particulars
          </th>
          <th className="w-64 border border-gray-300 p-3 text-left">
            Details
          </th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td className="border border-gray-300 p-3 text-center">1.</td>
          <td className="border border-gray-300 p-3">
            Earth resistance (Shall be less than 2 Ohms)
          </td>
          <td className="border border-gray-300 p-3 font-semibold">
            {form.earth_resistance}
          </td>
        </tr>
        <tr>
          <td className="border border-gray-300 p-3 text-center">2.</td>
          <td className="border border-gray-300 p-3">
            Size of the Earth wire / flat*
          </td>
          <td className="border border-gray-300 p-3 font-semibold">
            {form.earth_wire_size}
          </td>
        </tr>
        <tr>
          <td className="border border-gray-300 p-3 text-center">3.</td>
          <td className="border border-gray-300 p-3">
            <div className="font-medium mb-2">
              Two separate Earthing points
            </div>
            <div className="py-1">Modules & DC Surge arrester</div>
            <div className="py-1">
              Inverter, AC Surge protection device & Lightning Arrester
            </div>
          </td>
          <td className="border border-gray-300 p-3 font-semibold">
            <div className="py-1">{form.earth_points_modules}</div>
            <div className="py-1">{form.earth_points_inverter}</div>
          </td>
        </tr>
        <tr>
          <td className="border border-gray-300 p-3 text-center">4.</td>
          <td className="border border-gray-300 p-3">Size & Type</td>
          <td className="border border-gray-300 p-3 font-semibold">
            {form.earth_size_type}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
) : section.title ===
  "I. Details of Net Meter Details (Please enclose the test report of the bi-directional meter tested at the laboratory of the Discom)" ? (
  <div className="overflow-x-auto">
    <table className="w-full border-collapse border border-gray-300 text-sm">
      <thead>
        <tr className="bg-gray-100">
          <th className="w-16 border border-gray-300 p-3 text-center">
            S. No.
          </th>
          <th className="border border-gray-300 p-3 text-left">
            Particulars
          </th>
          <th className="w-64 border border-gray-300 p-3 text-left">
            Details
          </th>
        </tr>
      </thead>
      <tbody>
        {[
          ["1.", "Make", form.net_meter_make],
          ["2.", "Serial No.", form.net_meter_serial_no],
          ["3.", "Capacity", form.net_meter_capacity],
          ["4.", "Type / Model", form.net_meter_type_model],
          ["5.", "Single phase / Three phase", form.net_meter_phase],
          ["6.", "CT Ratio", form.net_meter_ct_ratio],
          ["7.", "Date of test by MT, DISCOM", form.net_meter_test_date],
        ].map(([number, label, value]) => (
          <tr key={number}>
            <td className="border border-gray-300 p-3 text-center">
              {number}
            </td>
            <td className="border border-gray-300 p-3">{label}</td>
            <td className="border border-gray-300 p-3 font-semibold">
              {value}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
) : (
  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
    {section.fields.map(renderField)}
  </div>
)}

{section.title === "G. Details of Battery Bank" && (
  <div className="mt-5 overflow-x-auto">
    <table className="w-full border-collapse border border-gray-300 text-sm">
      <thead>
        <tr className="bg-gray-100">
          <th className="border border-gray-300 p-3 text-left">S. No.</th>
          <th className="border border-gray-300 p-3 text-left">Details</th>
          <th className="border border-gray-300 p-3 text-left">Value</th>
        </tr>
      </thead>
      <tbody>
        {[
          ["1", "Number of cells in series", "battery_series"],
          ["2", "Number of cells in parallel", "battery_parallel"],
          ["3", "Total capacity in AH", "battery_total_ah"],
          ["4", "Total battery bank voltage", "battery_total_voltage"],
        ].map(([number, label, key]) => (
          <tr key={key}>
            <td className="border border-gray-300 p-3">{number}</td>
            <td className="border border-gray-300 p-3">{label}</td>
            <td className="border border-gray-300 p-2">
              <input
                type="text"
                value={form[key] || ""}
                readOnly={isViewMode || form.battery_manufacturer === "N/A"}
                onChange={(event) => updateField(key, event.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2"
              />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
)}
        </div>
      ))}

      {/* JOINT INSPECTION */}
      <div className="mb-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 border-b border-gray-100 pb-3 text-lg font-bold text-gray-800">
          Joint Inspection Report
        </h2>

        <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-semibold text-gray-700">
              Name of Beneficiary
            </label>
            <input
              value={customerName}
              readOnly
              className="w-full rounded-lg border border-gray-200 bg-gray-100 px-3 py-2"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-gray-700">
              Address of installation with PIN code
            </label>
            <textarea
              rows={2}
              value={installationAddress}
              readOnly
              className="w-full rounded-lg border border-gray-200 bg-gray-100 px-3 py-2"
            />
          </div>

          {inspectionFields.map(renderField)}

          <div className="space-y-1">
  <label className="block text-sm font-semibold text-gray-700">
    Latitude
  </label>
  <input
    type="text"
    value={formatCoordinate(form.latitude)}
    readOnly
    className="w-full rounded-lg border border-gray-200 bg-gray-100 px-3 py-2"
  />
</div>

<div className="space-y-1">
  <label className="block text-sm font-semibold text-gray-700">
    Longitude
  </label>
  <input
    type="text"
    value={formatCoordinate(form.longitude)}
    readOnly
    className="w-full rounded-lg border border-gray-200 bg-gray-100 px-3 py-2"
  />
</div>
        </div>
      </div>

      {/* PROJECT COST */}
      <div className="mb-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-lg font-bold text-gray-800">
          Project Cost Details
        </h2>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {costFields.map(renderField)}
        </div>
      </div>

      {/* SAVE */}
      {!isViewMode && (
  <div className="mb-8 flex justify-end">
    {/* Keep your existing Save Report button here */}
  </div>
)}

      <div className="mb-8 flex justify-end">
        <button
          type="button"
          onClick={handleSave}
          disabled={loading}
          className="flex items-center gap-2 rounded-xl bg-green-600 px-7 py-3 font-bold text-white shadow-sm transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Save size={19} />
          {loading ? "Saving..." : "Save Report"}
        </button>
      </div>
    </div>
  );
}
