import { useEffect, useState } from "react";
import { supabase } from "../services/supabase";

function Dashboard() {
  const [stats, setStats] = useState({ customers: 0, revenue: 0, expenses: 0, profit: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      try {
        setLoading(true);
        const { data: customers } = await supabase.from("customers").select("quotation");
        const { data: expenses } = await supabase.from("expenses").select("amount");

        const totalRev = customers?.reduce((sum, c) => sum + Number(c.quotation || 0), 0) || 0;
        const totalExp = expenses?.reduce((sum, e) => sum + Number(e.amount || 0), 0) || 0;

        setStats({
          customers: customers?.length || 0,
          revenue: totalRev,
          expenses: totalExp,
          profit: totalRev - totalExp
        });
      } catch (err) {
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, []);

  if (loading) return <div style={{ padding: "20px" }}>Loading data...</div>;

  return (
    <div style={{ padding: "25px", fontFamily: "sans-serif" }}>
      <h1 style={{ textAlign: "center", color: "#333" }}>Solar Dashboard</h1>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "20px" }}>
        <StatCard title="Total Customers" value={stats.customers.toLocaleString()} />
        <StatCard title="Total Revenue" value={stats.revenue.toLocaleString("en-IN")} color="green" />
        <StatCard title="Total Expenses" value={stats.expenses.toLocaleString("en-IN")} color="red" />
        <StatCard title="Net Profit" value={stats.profit.toLocaleString("en-IN")} color={stats.profit >= 0 ? "green" : "red"} />
      </div>
    </div>
  );
}

function StatCard({ title, value, color = "#333" }) {
  return (
    <div style={{ 
      background: "#f9f9f9", 
      padding: "20px", 
      borderRadius: "8px", 
      border: "1px solid #ddd", 
      textAlign: "center" 
    }}>
      <h3 style={{ color: "#555", fontSize: "14px", margin: "0 0 10px 0" }}>{title}</h3>
      <h1 style={{ color, fontSize: "24px", margin: "0" }}>{value}</h1>
    </div>
  );
}

export default Dashboard;