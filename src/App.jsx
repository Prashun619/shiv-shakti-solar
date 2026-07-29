import { useLocation } from "react-router-dom";
import { Navigate } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import PlantCosting from "./pages/PlantCosting";
import { Routes, Route, Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "./services/supabase";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Customers from "./pages/Customers";
import Payments from "./pages/Payments";
import MasterInventory from "./pages/MasterInventory";
import Inventory from "./pages/Inventory";
import UsedInventory from "./pages/UsedInventory";
import Reports from "./pages/Reports";
import Projects from "./pages/Projects";
import Settings from "./pages/Settings";
import FinanceLedger from "./pages/FinanceLedger";
import CustomerPayments from "./pages/CustomerPayments";
import Billing from "./pages/Billing";
import QuotationInvoices from "./pages/QuotationInvoices";
import Invoice from "./pages/Invoice";
import CreateInvoice from "./pages/CreateInvoice";


export default function App() {
const location = useLocation();

const isLoginPage =
  location.pathname === "/login";

  const [currentUser, setCurrentUser] = useState(null);

const [userLoaded, setUserLoaded] = useState(false);


useEffect(()=>{

  const savedUser =
    localStorage.getItem("erp_user") ||
    sessionStorage.getItem("erp_user");


  if(savedUser){

    setCurrentUser(
      JSON.parse(savedUser)
    );

  }

  setUserLoaded(true);

},[]);

function hasPermission(permission){

  if(!currentUser)
    return false;


  if(currentUser.role === "Admin")
    return true;


  return currentUser[permission];

}

const navigate = useNavigate();


async function handleLogout(){

  await supabase.auth.signOut();

  localStorage.removeItem("erp_user");

  sessionStorage.removeItem("erp_user");

  navigate("/login");

}

if(!userLoaded){

  return null;

}

 return (


isLoginPage ? (

<Routes>

<Route
path="/login"
element={<Login />}
/>

</Routes>

)

:

(

<div className="h-screen flex bg-gray-100">

      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 text-white flex flex-col">
        <div className="p-5 text-2xl font-bold border-b border-gray-700">
          ⚡ Solar ERP
        </div>

       <nav className="flex-1 p-4 space-y-2">

  <Link 
    className="block px-3 py-2 rounded hover:bg-gray-700" 
    to="/"
  >
    Dashboard
  </Link>


  {
hasPermission("customers") && (

<Link 
  className="block px-3 py-2 rounded hover:bg-gray-700" 
  to="/customers"
>
  Customers
</Link>

)
}


  {
hasPermission("projects") && (

<Link 
  className="block px-3 py-2 rounded hover:bg-gray-700" 
  to="/projects"
>
  Projects
</Link>

)
}

{
hasPermission("master-inventory") && (

<Link 
  className="block px-3 py-2 rounded hover:bg-gray-700" 
  to="/master-inventory"
>
  Master Inventory
</Link>

)
}

  
  {
hasPermission("inventory") && (

<Link 
  className="block px-3 py-2 rounded hover:bg-gray-700" 
  to="/inventory"
>
  Inventory
</Link>

)
}

{
hasPermission("used-inventory") && (

<Link 
  className="block px-3 py-2 rounded hover:bg-gray-700" 
  to="/used-inventory"
>
  Used Inventory
</Link>

)
}

  {
hasPermission("finance") && (

<Link 
  className="block px-3 py-2 rounded hover:bg-gray-700" 
  to="/finance"
>
  Finance Ledger
</Link>

)
}


{
hasPermission("quotation-invoices") && (

<Link 
  className="block px-3 py-2 rounded hover:bg-gray-700" 
  to="/quotation-invoices"
>
  Quotation & Invoices
</Link>

)
}


{
hasPermission("reports") && (

<Link 
  className="block px-3 py-2 rounded hover:bg-gray-700" 
  to="/reports"
>
  Reports
</Link>

)
}


  {
hasPermission("settings") && (

<Link 
  className="block px-3 py-2 rounded hover:bg-gray-700" 
  to="/settings"
>
  Settings
</Link>

)
}


</nav>

<div className="p-4 border-t border-gray-700">

{
currentUser && (

<div className="mb-4">

<p className="font-bold text-white">
👤 {currentUser.full_name}
</p>

<p className="text-sm text-gray-400">
Role: {currentUser.role}
</p>

</div>

)
}


<button

onClick={handleLogout}

className="
w-full
bg-red-600
hover:bg-red-700
text-white
py-2
rounded-xl
font-semibold
"

>
🚪 Logout
</button>

</div>

      </aside>

      {/* Main Content */}
<div className="flex-1 p-6 overflow-x-hidden">
  <div className="max-w-[1200px] mx-auto">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route
path="/customers"
element={
<ProtectedRoute permission="customers">
<Customers />
</ProtectedRoute>
}
/>
          <Route
path="/master-inventory"
element={
<ProtectedRoute permission="inventory">
<MasterInventory />
</ProtectedRoute>
}
/>
          <Route
path="/finance"
element={
<ProtectedRoute permission="payments">
<FinanceLedger />
</ProtectedRoute>
}
/>
          <Route path="/customer-payments" element={<CustomerPayments />} />
          <Route path="/billing" element={<Billing />} />
        <Route
path="/inventory"
element={
<ProtectedRoute permission="inventory">

<Inventory />

</ProtectedRoute>
}
/>

         <Route
path="/used-inventory"
element={
<ProtectedRoute permission="used_inventory">
<UsedInventory />
</ProtectedRoute>
}
/>

<Route
path="/quotation-invoices"
element={
<ProtectedRoute permission="quotations">
<QuotationInvoices />
</ProtectedRoute>
}
/>

<Route
  path="/invoice"
  element={<Invoice />}
/>
<Route path="/plant-costing" element={<PlantCosting />} />
<Route path="/plant-costing/:size" element={<PlantCosting />} />
<Route
  path="/invoice/new"
  element={<CreateInvoice />}
/>



<Route
path="/settings"
element={
<ProtectedRoute permission="settings">

<Settings />

</ProtectedRoute>
}
/>
          <Route
path="/reports"
element={
<ProtectedRoute permission="reports">
<Reports />
</ProtectedRoute>
}
/>
         <Route
path="/projects"
element={
<ProtectedRoute permission="projects">
<Projects />
</ProtectedRoute>
}
/>
          
        </Routes>
      </div>
</div>
        </div>

)



  );
}