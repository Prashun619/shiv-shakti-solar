
import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Download } from "lucide-react";
import html2pdf from "html2pdf.js";
import { getWorkCompletionReportById } from "../services/workCompletionReportService";

export default function WorkCompletionReportPreview() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const reportId = searchParams.get("id");
  const printRef = useRef(null);

  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadReport() {
      try {
        if (!reportId) throw new Error("Report ID is missing.");

        const saved = await getWorkCompletionReportById(reportId);
        setReport(saved?.report_data || {});
      } catch (err) {
        console.error("Unable to load report preview:", err);
        setError(err.message || "Unable to load report.");
      } finally {
        setLoading(false);
      }
    }

    loadReport();
  }, [reportId]);

  const value = (key) => report?.[key] || "—";

  const downloadPDF = () => {
    if (!printRef.current || !report) return;

    const options = {
      margin: [10, 12, 10, 12],
      filename: `Work-Completion-Report-${report.customer_name || "Report"}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      pagebreak: { mode: ["css", "legacy"] },
    };

    html2pdf().set(options).from(printRef.current).save();
  };

  if (loading) {
    return <div className="p-8 text-center">Loading report...</div>;
  }

  if (error || !report) {
    return (
      <div className="p-8 text-center text-red-600">
        {error || "Report not found."}
        <button
          onClick={() => navigate("/work-completion-report")}
          className="ml-3 text-blue-600 underline"
        >
          Back
        </button>
      </div>
    );
  }

  const Field = ({ number, label, field }) => (
    <tr>
      <td className="border border-black px-2 py-1">{number}</td>
      <td className="border border-black px-2 py-1">{label}</td>
      <td className="border border-black px-2 py-1 font-medium">
        {value(field)}
      </td>
    </tr>
  );

  const Section = ({ title, children }) => (
    <section className="mb-5">
      <h3 className="mb-2 font-bold">{title}</h3>
      {children}
    </section>
  );

  const table = (rows) => (
    <table className="w-full border-collapse border border-black text-sm">
      <tbody>{rows}</tbody>
    </table>
  );

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-6">
      <div className="mx-auto mb-5 flex max-w-5xl justify-between gap-3">
        <button
          onClick={() => navigate("/work-completion-report")}
          className="flex items-center gap-2 rounded-lg border bg-white px-4 py-2 font-semibold"
        >
          <ArrowLeft size={18} /> Back
        </button>

        <button
          onClick={downloadPDF}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2 font-semibold text-white hover:bg-blue-700"
        >
          <Download size={18} /> Download PDF
        </button>
      </div>

      <div
        ref={printRef}
        className="mx-auto max-w-[210mm] bg-white p-[18mm] text-[13px] leading-relaxed text-black shadow-lg"
        style={{ fontFamily: "Arial, sans-serif" }}
      >
        <header className="mb-6 text-center">
          <h1 className="text-xl font-bold underline">
            Work Completion Report
          </h1>
          <p className="font-semibold">(To be submitted by the applicant)</p>
        </header>

        <div className="mb-5">
          <p>To,</p>
          <div className="ml-10">
            <p>The Executive Engineer</p>
            <p>CHHATARPUR Division O&M-City</p>
            <p>NOWGONG (T) Zone</p>
            <p>
              Madhya Pradesh Madhya Poorv Vidyut Vitran Company
            </p>
          </div>
        </div>

        <p className="mb-3">Sir/Madam,</p>

        <p className="mb-3">
          <b>Sub:</b> Submission of work completion report (to be submitted
          by the applicant) for system documentation requirements.
        </p>

        <p className="mb-4">
          <b>Ref:</b> Our Approval No.: {value("approval_number")} &nbsp;
          dt: {value("approval_date")} and Application No.:{" "}
          {value("application_number")}
        </p>

        <p className="mb-5 text-justify">
          With reference to the above, I hereby confirm to you that we have
          completed the work of installation of the renewable energy system
          and submit the following basic information for your perusal and
          request you to arrange to inspect and commission the system at the
          earliest:
        </p>

        <Section title="A. Details of the Solar PV Module">
          {table([
            <Field number="1." label="Model No." field="module_model" />,
            <Field number="2." label="Name and address of manufacturer" field="module_manufacturer" />,
            <Field number="3." label="Capacity of each Module (Wp)" field="module_capacity" />,
            <Field number="4." label="No. of Modules" field="module_quantity" />,
            <Field number="5." label="Total Capacity (kWp)" field="module_total_capacity" />,
            <Field number="6." label="Date of installation" field="module_installation_date" />,
          ])}
        </Section>

        <Section title="B. Details of the Inverter">
          {table([
            <Field number="1." label="Name and address of the inverter manufacturer" field="inverter_manufacturer" />,
            <Field number="2." label="Brand Name of the inverter" field="inverter_brand" />,
            <Field number="3." label="Model No." field="inverter_model" />,
            <Field number="4." label="AC capacity of individual inverter (kW)" field="inverter_individual_capacity" />,
            <Field number="5." label="No. of inverters installed" field="inverter_quantity" />,
            <Field number="6." label="Total AC capacity of inverter (kW)" field="inverter_total_capacity" />,
            <Field number="7." label="Serial Nos." field="inverter_serial_numbers" />,
            <Field number="8." label="Date of installation" field="inverter_installation_date" />,
          ])}
        </Section>

        <Section title="C. Details of the Cables: DC">
          {table([
            <Field number="1." label="Make / Name of manufacturer" field="dc_cable_manufacturer" />,
            <Field number="2." label="Size & Type" field="dc_cable_size_type" />,
          ])}
        </Section>

        <Section title="D. Details of the AC wiring">
          {table([
            <Field number="1." label="Make / Name of manufacturer" field="ac_wiring_manufacturer" />,
            <Field number="2." label="Size & Type" field="ac_wiring_size_type" />,
          ])}
        </Section>

        <Section title="E. Details of the DC distribution box">
          {table([
            <Field number="1." label="Make / Name of manufacturer" field="dc_box_manufacturer" />,
            <Field number="2." label="Sl. No." field="dc_box_serial" />,
            <Field number="3." label="DC Surge Protection Device" field="dc_surge_protection" />,
            <Field number="4." label="MCB/Isolator quantity & capacity" field="dc_mcb_quantity_capacity" />,
            <Field number="5." label="Size & Type" field="dc_box_size_type" />,
          ])}
        </Section>

        <Section title="F. Details of the AC distribution box">
          {table([
            <Field number="1." label="Make / Name of manufacturer" field="ac_box_manufacturer" />,
            <Field number="2." label="Sl. No." field="ac_box_serial" />,
            <Field number="3." label="AC Surge Protection Device" field="ac_surge_protection" />,
            <Field number="4." label="MCB/MCCB quantity & capacity" field="ac_mcb_quantity_capacity" />,
            <Field number="5." label="Size & Type" field="ac_box_size_type" />,
          ])}
        </Section>

        <Section title="G. Details of Battery Bank (if applicable)">
          {table([
            <Field number="1." label="Make / Name of manufacturer" field="battery_manufacturer_name" />,
            <Field number="2." label="Type of battery" field="battery_type" />,
            <Field number="3." label="Sr. Nos." field="battery_serial_numbers" />,
            <Field number="4." label="Capacity of each cell (V / AH)" field="battery_cell_capacity" />,
            <Field number="5." label="Number of Cells in Series" field="battery_series" />,
            <Field number="6." label="Number of Cells in Parallel" field="battery_parallel" />,
            <Field number="7." label="Total Capacity in AH" field="battery_total_ah" />,
            <Field number="8." label="Total Battery Bank Voltage" field="battery_total_voltage" />,
          ])}
        </Section>

        <Section title="H. Details of the Earthing">
          {table([
            <Field number="1." label="Earth resistance (Shall be less than 2 Ohms)" field="earth_resistance" />,
            <Field number="2." label="Size of the Earth wire / flat*" field="earth_wire_size" />,
            <Field number="3." label="Modules & DC Surge arrester earthing" field="earth_points_modules" />,
            <Field number="4." label="Inverter, AC Surge protection device & Lightning Arrester earthing" field="earth_points_inverter" />,
            <Field number="5." label="Size & Type" field="earth_size_type" />,
          ])}
        </Section>

        <Section title="I. Details of the Net meter details">
          <p className="mb-2">
            (Please enclose the test report of the bi-directional meter tested
            at the laboratory of the Discom)
          </p>
          {table([
            <Field number="1." label="Make" field="net_meter_make" />,
            <Field number="2." label="Serial No." field="net_meter_serial_no" />,
            <Field number="3." label="Capacity" field="net_meter_capacity" />,
            <Field number="4." label="Type / Model" field="net_meter_type_model" />,
            <Field number="5." label="Single ph. / Three ph." field="net_meter_phase" />,
            <Field number="6." label="CT Ratio" field="net_meter_ct_ratio" />,
            <Field number="7." label="Date of Test by MT, Discom" field="net_meter_test_date" />,
          ])}
        </Section>

        <Section title="J. Details of the Caution signage">
          <p>{value("caution_signage")}</p>
        </Section>

        <Section title="K. Provision of manual and automatic switches">
          <p>{value("manual_automatic_switches")}</p>
        </Section>

        <Section title="L. G.P.S. Co-ordinates of the Renewable Energy System Installation">
          <p>(i) Latitude: {value("latitude")}</p>
          <p>(ii) Longitude: {value("longitude")}</p>
        </Section>

        <Section title="M. Whether Operation and Maintenance Manual provided to the consumer">
          <p>{value("om_manual")}</p>
        </Section>

        <p className="my-6 text-justify">
          Certified that the above said renewable energy system was installed
          and the equipment used comply with the Technical and Safety
          standards as specified by the Discom under net metering program.
        </p>

        <div className="mb-8 grid grid-cols-2 gap-8 pt-10">
          <div>
            <p className="font-bold">Signature of Applicant</p>
            <p className="mt-8">Name & Address of Applicant</p>
            <p>{value("applicant_name")}</p>
            <p>{value("applicant_address")}</p>
            <p className="mt-5">Date: ______________</p>
          </div>

          <div>
            <p className="font-bold">Seal & Signature of the System Installer</p>
            <p className="mt-8">Name of the firm and address</p>
            <p>M/s. Shiv Shakti Solar Energy</p>
            <p>Flat No. 01, Ward No. 07, Opposite Stadium, Nowgong</p>
            <p className="mt-5">Date: ______________</p>
          </div>
        </div>

        <Section title="Enclosures">
          <ol className="list-decimal space-y-1 pl-5">
            <li>Test Report of net meter tested at the laboratory of the Discom.</li>
            <li>Copy of IEC/IS Test certificates of PV Modules, Inverters etc.</li>
            <li>Data Sheets/Drawing for the array mounting system.</li>
            <li>Actual single line wiring diagram (SLD) of the PV System.</li>
            <li>
              Copy of the Maintenance & Operation information manual provided
              by the system installer. Copy of Interconnection Agreement on
              non-judicial stamp paper of Rs. 500/- with Discom.
            </li>
          </ol>
        </Section>

        <div className="my-8 text-right">
          <p>Sincerely</p>
          <p className="mt-2 font-bold">Shiv Shakti Solar Energy</p>
        </div>

        <div className="my-8 border-t-2 border-black pt-6">
          <h2 className="mb-5 text-center text-xl font-bold underline">
            Joint Inspection Report
          </h2>

          <p className="mb-4">
            It is to certify that a Grid Connected Solar PV Power Plant has
            been installed with following credentials:
          </p>

          {table([
            <Field number="1." label="Name of Beneficiary" field="customer_name" />,
            <Field number="2." label="Address of installation with pin code" field="installation_address" />,
            <Field number="3." label="Electricity consumer number" field="consumer_number" />,
            <Field number="4." label="Solar PV module capacity (DC) in kWp" field="inspection_dc_capacity" />,
            <Field number="5." label="Inverter capacity (AC) in kW" field="inspection_ac_capacity" />,
            <Field number="6." label="Date of Installation / Commissioning" field="installation_commissioning_date" />,
            <Field number="7." label="Date of Joint inspection" field="joint_inspection_date" />,
            <Field number="8." label="Metering arrangement" field="metering_arrangement" />,
          ])}

          <p className="my-5">
            The above system is as per BIS/MNRE specifications and has been
            checked for its performance and it is working satisfactorily.
          </p>

          <div className="mb-8 grid grid-cols-3 gap-4 text-center">
            <div>
              <b>DISCOM</b>
              <p className="mt-4">Name: MPPKVVCL</p>
              <p>Designation: JE</p>
              <p>Date: __________</p>
              <p>Sign: __________</p>
              <p>Seal: __________</p>
            </div>
            <div>
              <b>EMPANELLED AGENCY</b>
              <p className="mt-4">M/s. Shiv Shakti Solar Energy</p>
              <p>Manager - Operations</p>
              <p>Date: __________</p>
              <p>Sign: __________</p>
              <p>Seal: __________</p>
            </div>
            <div>
              <b>CONSUMER</b>
              <p className="mt-4">Name: {value("customer_name")}</p>
              <p>Date: __________</p>
              <p>Sign: __________</p>
            </div>
          </div>

          <p className="my-5">
            It is to certify that the above system has been purchased with
            following details:
          </p>

          {table([
            <Field number="1." label="Total project cost (₹)" field="total_project_cost" />,
            <Field number="2." label="Subsidy Amount (₹)" field="subsidy_amount" />,
            <Field number="3." label="Amount Paid by Beneficiary (₹)" field="beneficiary_paid_amount" />,
          ])}

          <div className="mt-12 grid grid-cols-2 gap-8 text-center">
            <div>
              <b>EMPANELLED AGENCY</b>
              <p className="mt-6">Name: Shiv Shakti Solar Energy</p>
              <p>Signature: __________</p>
            </div>
            <div>
              <b>CONSUMER NAME & SIGN</b>
              <p className="mt-6">{value("customer_name")}</p>
              <p>Signature: __________</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
