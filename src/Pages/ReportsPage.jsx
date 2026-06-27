import { useState } from "react";
import { supabase } from "../services/supabase";


function ReportsPage() {

  const [reportName, setReportName] = useState("Customer Report");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(false);

  async function downloadReport() {

    try {

      setLoading(true);

      let data = [];

      switch (reportName) {

        case "Customer Report": {

          let query = supabase
            .from("customers")
            .select("*");

          if (fromDate)
            query = query.gte("created_at", fromDate);

          if (toDate)
            query = query.lte("created_at", toDate);

          const { data: customers, error } = await query;

          if (error) throw error;

          data = customers || [];

          break;
        }

        case "Expense Report": {

          let query = supabase
            .from("expenses")
            .select("*");

          if (fromDate)
            query = query.gte("created_at", fromDate);

          if (toDate)
            query = query.lte("created_at", toDate);

          const { data: expenses, error } = await query;

          if (error) throw error;

          data = expenses || [];

          break;
        }

        case "Revenue Report": {

          let query = supabase
            .from("customers")
            .select("name,quotation,created_at");

          if (fromDate)
            query = query.gte("created_at", fromDate);

          if (toDate)
            query = query.lte("created_at", toDate);

          const { data: revenue, error } = await query;

          if (error) throw error;

          data = revenue || [];

          break;
        }

        case "Profit & Loss Report": {

          const { data: customers } = await supabase
            .from("customers")
            .select("quotation");

          const { data: expenses } = await supabase
            .from("expenses")
            .select("amount");

          const totalRevenue =
            customers?.reduce(
              (sum, c) => sum + Number(c.quotation || 0),
              0
            ) || 0;

          const totalExpense =
            expenses?.reduce(
              (sum, e) => sum + Number(e.amount || 0),
              0
            ) || 0;

          data = [
            {
              Revenue: totalRevenue,
              Expenses: totalExpense,
              Profit: totalRevenue - totalExpense,
            },
          ];

          break;
        }

        case "Complete Business Report": {

          const { data: customers } = await supabase
            .from("customers")
            .select("*");

          const { data: expenses } = await supabase
            .from("expenses")
            .select("*");

          data = [

            ...(customers || []).map((c) => ({
              Type: "Customer",
              Name: c.name,
              Mobile: c.mobile,
              Amount: c.quotation,
              Date: c.created_at,
            })),

            ...(expenses || []).map((e) => ({
              Type: "Expense",
              Name: e.title || "Expense",
              Amount: e.amount,
              Date: e.created_at,
            })),

          ];

          break;
        }

        default:
          data = [];
      }

      setReportData(data);

      if (data.length === 0) {
        alert("No data found.");
        return;
      }

      const headers = Object.keys(data[0]);

const csvRows = [];

csvRows.push(headers.join(","));

data.forEach((row) => {
  const values = headers.map((header) =>
    `"${String(row[header] ?? "").replace(/"/g, '""')}"`
  );
  csvRows.push(values.join(","));
});

const csv = csvRows.join("\n");

const blob = new Blob([csv], {
  type: "text/csv;charset=utf-8;",
}); 

      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");

      link.href = url;

      link.download =
        `${reportName.replace(/\s+/g, "_")}.csv`;

      link.click();

      URL.revokeObjectURL(url);

    } catch (err) {

      console.error(err);
      alert(err.message);

    } finally {

      setLoading(false);

    }

  }
    return (
    <div
      style={{
        padding: "30px",
        minHeight: "100vh",
        background: "#f5f7fa",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <h1
        style={{
          textAlign: "center",
          color: "#ff9800",
          fontWeight: "bold",
          marginBottom: "30px",
        }}
      >
        ☀️ Solar ERP Reports
      </h1>

      <div
        style={{
          maxWidth: "950px",
          margin: "0 auto",
          background: "#fff",
          padding: "25px",
          borderRadius: "12px",
          boxShadow: "0 4px 15px rgba(0,0,0,0.15)",
        }}
      >
        <h2
          style={{
            textAlign: "center",
            color: "#000",
            fontWeight: "bold",
            marginBottom: "25px",
          }}
        >
          Report Generator
        </h2>

        <div
          style={{
            display: "flex",
            gap: "20px",
            justifyContent: "center",
            alignItems: "flex-end",
            flexWrap: "wrap",
          }}
        >
          <div>
            <label style={{ fontWeight: "bold", color: "#000" }}>
              Report Name
            </label>
            <br />
            <select
              value={reportName}
              onChange={(e) => setReportName(e.target.value)}
              style={inputStyle}
            >
              <option>Customer Report</option>
              <option>Expense Report</option>
              <option>Revenue Report</option>
              <option>Profit & Loss Report</option>
              <option>Complete Business Report</option>
            </select>
          </div>

          <div>
            <label style={{ fontWeight: "bold", color: "#000" }}>
              From Date
            </label>
            <br />
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              style={inputStyle}
            />
          </div>

          <div>
            <label style={{ fontWeight: "bold", color: "#000" }}>
              To Date
            </label>
            <br />
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              style={inputStyle}
            />
          </div>

          <div>
            <button
              onClick={downloadReport}
              style={buttonStyle}
              disabled={loading}
            >
              {loading ? "Downloading..." : "📥 Download CSV"}
            </button>
          </div>
        </div>
      </div>

      
    </div>
  );
}
const inputStyle = {
  width: "200px",
  height: "42px",
  padding: "8px 12px",
  border: "2px solid black",
  borderRadius: "8px",
  fontSize: "14px",
  fontWeight: "bold",
  color: "#000",
  background: "#fff",
  boxSizing: "border-box",

  // date picker fix
  colorScheme: "light",
};
const buttonStyle = {
  width: "180px",
  height: "40px",
  background: "#ff9800",
  color: "#000",
  fontWeight: "bold",
  fontSize: "14px",
  border: "2px solid #000",
  borderRadius: "8px",
  cursor: "pointer",
};

export default ReportsPage;