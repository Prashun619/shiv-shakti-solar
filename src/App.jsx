import { BrowserRouter, Routes, Route } from "react-router-dom";

import Header from "./components/Header";
import Sidebar from "./components/Sidebar";

import DashboardPage from "./Pages/DashboardPage";
import CustomersPage from "./Pages/CustomersPage";
import InventoryPage from "./Pages/InventoryPage";
import FinanceLedgerPage from "./Pages/FinanceLedgerPage";
import ReportsPage from "./Pages/ReportsPage";

function App() {
  return (
    <BrowserRouter>
      <Header />

      <div style={{ display: "flex" }}>
  <Sidebar />

  <div
    style={{
      flex: 1,
      padding: "15px 20px 20px 10px", // top right bottom left
      background: "#f4f7fb",
      minHeight: "100vh",
    }}  
  >
    <Routes>
      <Route path="/" element={<DashboardPage />} />
      <Route path="/customers" element={<CustomersPage />} />
      <Route path="/inventory" element={<InventoryPage />} />
      <Route path="/finance" element={<FinanceLedgerPage />} />
      <Route path="/reports" element={<ReportsPage />} />
    </Routes>
  </div>
</div>
    </BrowserRouter>
  );
}

export default App;