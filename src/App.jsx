import Investments from "./pages/Investments";
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
import Settings from "./pages/Settings";
import FinanceLedger from "./pages/FinanceLedger";
import CustomerPayments from "./pages/CustomerPayments";
import Billing from "./pages/Billing";
import Invoice from "./pages/Invoice";
import CreateInvoice from "./pages/CreateInvoice";


export default function App() {
  
const location = useLocation();



  const [currentUser, setCurrentUser] = useState(() => {

  const saved =
    localStorage.getItem("erp_user") ||
    sessionStorage.getItem("erp_user");

  return saved ? JSON.parse(saved) : null;

});

const [userLoaded, setUserLoaded] = useState(false);


useEffect(()=>{
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

  setCurrentUser(null);

  navigate("/login");

}

if(!userLoaded){

  return null;

}

 return (

!currentUser ? (

<Routes>

<Route
path="/login"
element={
<Login setCurrentUser={setCurrentUser}/>
}
/>

<Route
path="*"
element={<Navigate to="/login" />}
/>

</Routes>

)

:

(
<div className="h-screen flex bg-gray-100">

      {/* Sidebar */}
      <aside
className="
w-64
bg-gradient-to-b
from-[#064E3B]
via-[#065F46]
to-[#0F766E]
text-white
flex
flex-col
shadow-2xl
"
>
        <div
className="
p-5
border-b
border-white/20
"
>

<div className="flex items-center gap-3">

<div
className="
h-12
w-12
rounded-2xl
bg-white/20
backdrop-blur
flex
items-center
justify-center
shadow-lg
"
>
⚡
</div>


<div>

<h1 className="text-xl font-bold">
Solar ERP
</h1>

<p className="text-xs text-emerald-100">
Shiv Shakti Solar
</p>

</div>

</div>

</div>

       <nav className="flex-1 p-4 space-y-2">

  <Link 
   className="
block
px-4
py-3
rounded-xl
text-sm
font-medium
text-emerald-50
hover:bg-white/20
hover:translate-x-1
transition-all
duration-200
"
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
  Material Consumption
</Link>

)
}

  {
hasPermission("billing") && (

<Link 
  className="block px-3 py-2 rounded hover:bg-gray-700" 
  to="/finance"
>
  Finance Ledger
</Link>

)
}


{
  hasPermission("investments") && (

    <Link
      className="block px-3 py-2 rounded hover:bg-gray-700"
      to="/investments"
    >
      Investments
    </Link>

  )
}

{
  hasPermission("invoices") && (

    <Link
      className="block px-3 py-2 rounded hover:bg-gray-700"
      to="/invoice"
    >
      Invoice
    </Link>

  )
}

{
  hasPermission("settings") && (

    <Link
      className="block px-3 py-2 rounded hover:bg-gray-700"
      to="/plant-costing"
    >
      Plant Costing
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

<div
className="
p-4
border-t
border-white/20
bg-black/10
"
>

{
currentUser && (

<div className="mb-4">

<p className="
font-bold
text-white
flex
items-center
gap-2
">
👤 {currentUser.full_name}
</p>

<p className="text-sm text-emerald-100/80">
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
py-0.5
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
          <Route
 path="/"
 element={
   <ProtectedRoute>
     <Dashboard />
   </ProtectedRoute>
 }
/>
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

<Route
  path="/investments"
  element={
    <ProtectedRoute permission="investments">
      <Investments />
    </ProtectedRoute>
  }
/>

<Route
  path="/finance"
  element={
    <ProtectedRoute permission="billing">
      <FinanceLedger />
    </ProtectedRoute>
  }
/>

<Route
  path="/billing"
  element={
    <ProtectedRoute permission="billing">
      <Billing />
    </ProtectedRoute>
  }
/>

<Route
  path="/invoice"
  element={
    <ProtectedRoute permission="invoices">
      <Invoice />
    </ProtectedRoute>
  }
/>

<Route
  path="/invoice/new"
  element={
    <ProtectedRoute permission="invoices">
      <CreateInvoice />
    </ProtectedRoute>
  }
/>

<Route
  path="/plant-costing"
  element={
    <ProtectedRoute permission="settings">
      <PlantCosting />
    </ProtectedRoute>
  }
/>

<Route
  path="/plant-costing/:size"
  element={
    <ProtectedRoute permission="settings">
      <PlantCosting />
    </ProtectedRoute>
  }
/>
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
         
          
        </Routes>
      </div>
</div>
        </div>

)



  );
}