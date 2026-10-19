import PaymentReceipt from "./pages/PaymentReceipt";
import NewInvoice from "./pages/NewInvoice";
import Investments from "./pages/Investments";

import { Navigate } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import PlantCosting from "./pages/PlantCosting";

import {
  Routes,
  Route,
  NavLink,
  useNavigate,
} from "react-router-dom";

import { useEffect, useState } from "react";

import { supabase } from "./services/supabase";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Customers from "./pages/Customers";
import MasterInventory from "./pages/MasterInventory";
import Inventory from "./pages/Inventory";
import UsedInventory from "./pages/UsedInventory";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import FinanceLedger from "./pages/FinanceLedger";
import Billing from "./pages/Billing";
import CreateInvoice from "./pages/CreateInvoice";


// ============================================================
// SIDEBAR ICONS
// ============================================================

function SidebarIcon({ type }) {

  const common = {
    width: 24,
    height: 24,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round",
    strokeLinejoin: "round",
  };


  // Dashboard

  if (type === "dashboard") {
    return (
      <svg {...common}>
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    );
  }


  // Customers

  if (type === "customers") {
    return (
      <svg {...common}>
        <circle cx="9" cy="8" r="3" />
        <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" />
        <path d="M16 5.5a3 3 0 0 1 0 5.8" />
        <path d="M18 14c1.8.8 3 2.5 3 5" />
      </svg>
    );
  }


  // Inventory

  if (type === "inventory") {
    return (
      <svg {...common}>
        <path d="M4 7h16v13H4z" />
        <path d="M7 7V4h10v3" />
        <path d="M8 11h8" />
      </svg>
    );
  }


  // Material Consumption

  if (type === "material") {
    return (
      <svg {...common}>
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <path d="M7 8h10" />
        <path d="M7 12h6" />
        <path d="M7 16h8" />
      </svg>
    );
  }


  // Finance

  if (type === "finance") {
    return (
      <svg {...common}>
        <rect x="3" y="5" width="18" height="15" rx="2" />
        <path d="M7 5V3h10v2" />
        <path d="M7 10h10" />
        <path d="M8 15h3" />
        <path d="M15 15h1" />
      </svg>
    );
  }


  // Investments

  if (type === "investment") {
    return (
      <svg {...common}>
        <path d="M4 19V9" />
        <path d="M10 19V5" />
        <path d="M16 19v-7" />
        <path d="M22 19V3" />
      </svg>
    );
  }


  // Invoice

  if (type === "invoice") {
    return (
      <svg {...common}>
        <path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3z" />
        <path d="M9 8h6" />
        <path d="M9 12h6" />
        <path d="M9 16h4" />
      </svg>
    );
  }

  // Payment Receipt
if (type === "payment-receipt") {
  return (
    <svg {...common}>
      <path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3z" />
      <path d="M9 8h6" />
      <path d="M9 12h6" />
      <path d="M9 16h3" />
      <path d="M16 15v4" />
    </svg>
  );
}

  // Plant Costing

  if (type === "plant") {
    return (
      <svg {...common}>
        <path d="M12 21V10" />
        <path d="M12 14c-4 0-6-2-6-6 4 0 6 2 6 6z" />
        <path d="M12 11c0-4 2-6 6-6 0 4-2 6-6 6z" />
        <path d="M8 21h8" />
      </svg>
    );
  }


  // Reports

  if (type === "reports") {
    return (
      <svg {...common}>
        <path d="M4 19V5" />
        <path d="M4 19h16" />
        <path d="M7 16v-5" />
        <path d="M12 16V8" />
        <path d="M17 16v-9" />
      </svg>
    );
  }


  // Settings

  if (type === "settings") {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="3" />

        <path
          d="
            M19.4 15
            a1.7 1.7 0 0 0 .3 1.9
            l.1.1
            -1.8 1.8
            -.1-.1
            a1.7 1.7 0 0 0-1.9-.3
            1.7 1.7 0 0 0-1 1.6
            V20
            h-2.6
            v-.1
            a1.7 1.7 0 0 0-1-1.6
            1.7 1.7 0 0 0-1.9.3
            l-.1.1
            -1.8-1.8
            .1-.1
            a1.7 1.7 0 0 0 .3-1.9
            1.7 1.7 0 0 0-1.6-1
            H6
            v-2.6
            h.1
            a1.7 1.7 0 0 0 1.6-1
            1.7 1.7 0 0 0-.3-1.9
            l-.1-.1
            1.8-1.8
            .1.1
            a1.7 1.7 0 0 0 1.9.3
            1.7 1.7 0 0 0 1-1.6
            V4
            h2.6
            v.1
            a1.7 1.7 0 0 0 1 1.6
            1.7 1.7 0 0 0 1.9-.3
            l.1-.1
            1.8 1.8
            -.1.1
            a1.7 1.7 0 0 0-.3 1.9
            1.7 1.7 0 0 0 1.6 1
            h.1
            v2.6
            h-.1
            a1.7 1.7 0 0 0-1.6 1z
          "
        />
      </svg>
    );
  }


  // Logout

  if (type === "logout") {
    return (
      <svg {...common}>
        <path d="M10 17l5-5-5-5" />
        <path d="M15 12H3" />
        <path d="M14 4h5v16h-5" />
      </svg>
    );
  }


  return null;
}


// ============================================================
// SIDEBAR LINK CLASS
// ============================================================

function sidebarLinkClass({ isActive }) {

  return `
    w-full
    h-12
    px-4
    rounded-[17px]
    flex
    items-center
    gap-3
    shrink-0
    transition-all
    duration-200

    ${
      isActive
        ? "bg-blue-600 text-white shadow-md shadow-blue-200"
        : "text-slate-500 hover:bg-slate-100 hover:text-blue-600"
    }
  `;
}


// ============================================================
// MAIN APP
// ============================================================

export default function App() {


  const [currentUser, setCurrentUser] = useState(() => {

    const saved =
      localStorage.getItem("erp_user") ||
      sessionStorage.getItem("erp_user");

    return saved ? JSON.parse(saved) : null;
  });


  const [userLoaded, setUserLoaded] = useState(false);

  const [mobileMenuOpen, setMobileMenuOpen] =
    useState(false);


  useEffect(() => {

    setUserLoaded(true);

  }, []);


  // ============================================================
  // PERMISSIONS
  // ============================================================

  function hasPermission(permission) {

    if (!currentUser) {
      return false;
    }

    if (currentUser.role === "Admin") {
      return true;
    }

    return currentUser[permission];
  }


  const navigate = useNavigate();


  // ============================================================
  // LOGOUT
  // ============================================================

  async function handleLogout() {

    await supabase.auth.signOut();

    localStorage.removeItem("erp_user");
    sessionStorage.removeItem("erp_user");

    setCurrentUser(null);

    navigate("/login");
  }


  // ============================================================
  // LOADING
  // ============================================================

  if (!userLoaded) {
    return null;
  }


    // ============================================================
    // LOGIN
    // ============================================================

    if (!currentUser) {

      return (
        <Routes>

          <Route
            path="/login"
            element={
              <Login setCurrentUser={setCurrentUser} />
            }
          />

          <Route
            path="*"
            element={
              <Navigate to="/login" />
            }
          />

        </Routes>
      );
    }


  // ============================================================
  // APPLICATION
  // ============================================================

  return (
    <>


      {/* ========================================================
          MAIN APPLICATION
      ======================================================== */}

      <div
        className="
          h-screen
          flex
          bg-gradient-to-br
          from-slate-50
          via-cyan-100
          to-purple-100
          overflow-hidden
        "
      >


        {/* ======================================================
            MOBILE OVERLAY
        ====================================================== */}

        {mobileMenuOpen && (
          <div
            className="
              fixed
              inset-0
              bg-black/60
              z-40
              lg:hidden
            "
            onClick={() => setMobileMenuOpen(false)}
          />
        )}


        {/* ======================================================
            SIDEBAR
        ====================================================== */}

        <aside
          className={`
            fixed
            inset-y-0
            left-0
            w-64
            bg-white
            border-r
            border-slate-200
            shadow-[2px_0_10px_rgba(0,0,0,0.04)]
            z-50
            overflow-hidden

            transform
            transition-transform
            duration-300
            ease-in-out

            lg:relative
            lg:translate-x-0
            lg:z-40

            ${mobileMenuOpen
              ? "translate-x-0"
              : "-translate-x-full"
            }
          `}
        >

          <div className="h-full flex flex-col items-center">


            {/* ==================================================
                LOGO
            ================================================== */}

            <div
              className="
                h-[82px]
                w-full
                flex
                items-center
                justify-center
                shrink-0
              "
            >

              <img
                src="/logo.png"
                alt="Shiv Shakti Solar"
                className="
                  w-28
                  h-28
                  object-contain
                "
              />

            </div>


            {/* ==================================================
                NAVIGATION
            ================================================== */}

            <nav
              className="
                flex-1
                w-full
                flex
                flex-col
                items-center
                gap-3
                px-3
                py-5
                overflow-y-auto
                scrollbar-thin
              "
            >

              


              {/* ==================================================
                  DASHBOARD
              ================================================== */}

              <NavLink
                to="/"
                title="Dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className={sidebarLinkClass}
              >

                <SidebarIcon type="dashboard" />

                <span>
                  Dashboard
                </span>

              </NavLink>


              {/* ==================================================
                  CUSTOMERS
              ================================================== */}

              {hasPermission("customers") && (

                <NavLink
                  to="/customers"
                  title="Customers"
                  onClick={() => setMobileMenuOpen(false)}
                  className={sidebarLinkClass}
                >

                  <SidebarIcon type="customers" />

                  <span>
                    Customers
                  </span>

                </NavLink>

              )}


              {/* ==================================================
                  MASTER INVENTORY
              ================================================== */}

              {hasPermission("inventory") && (

                <NavLink
                  to="/master-inventory"
                  title="Master Inventory"
                  onClick={() => setMobileMenuOpen(false)}
                  className={sidebarLinkClass}
                >

                  <SidebarIcon type="inventory" />

                  <span>
                    Master Inventory
                  </span>

                </NavLink>

              )}


              {/* ==================================================
                  INVENTORY
              ================================================== */}

              {hasPermission("inventory") && (

                <NavLink
                  to="/inventory"
                  title="Inventory"
                  onClick={() => setMobileMenuOpen(false)}
                  className={sidebarLinkClass}
                >

                  <SidebarIcon type="inventory" />

                  <span>
                    Inventory
                  </span>

                </NavLink>

              )}


              {/* ==================================================
                  MATERIAL CONSUMPTION
              ================================================== */}

              {hasPermission("used_inventory") && (

                <NavLink
                  to="/used-inventory"
                  title="Material Consumption"
                  onClick={() => setMobileMenuOpen(false)}
                  className={sidebarLinkClass}
                >

                  <SidebarIcon type="material" />

                  <span>
                    Material Consumption
                  </span>

                </NavLink>

              )}


              {/* ==================================================
                  FINANCE LEDGER
              ================================================== */}

              {hasPermission("billing") && (

                <NavLink
                  to="/finance"
                  title="Finance Ledger"
                  onClick={() => setMobileMenuOpen(false)}
                  className={sidebarLinkClass}
                >

                  <SidebarIcon type="finance" />

                  <span>
                    Finance Ledger
                  </span>

                </NavLink>

              )}


              {/* ==================================================
                  INVESTMENTS
              ================================================== */}

              {hasPermission("investments") && (

                <NavLink
                  to="/investments"
                  title="Investments"
                  onClick={() => setMobileMenuOpen(false)}
                  className={sidebarLinkClass}
                >

                  <SidebarIcon type="investment" />

                  <span>
                    Investments
                  </span>

                </NavLink>

              )}


              {/* ==================================================
                  INVOICE
              ================================================== */}

              {hasPermission("invoices") && (

                <NavLink
  to="/invoice/new-design"
  title="Invoice"
  onClick={() => setMobileMenuOpen(false)}
  className={sidebarLinkClass}
>
  <SidebarIcon type="invoice" />

  <span>
    Invoice
  </span>
</NavLink>

              )}

              {/* ==================================================}
                  Payment Receipt
              ================================================== */}
             
             {hasPermission("invoices") && (

            <NavLink
  to="/payment-receipt"
  title="Payment Receipt"
  onClick={() => setMobileMenuOpen(false)}
  className={sidebarLinkClass}
>
 <SidebarIcon type="payment-receipt" />

<span>
  Payment Receipt
</span>
</NavLink>
  )}

              {/* ==================================================
                  PLANT COSTING
              ================================================== */}

              {hasPermission("settings") && (

                <NavLink
                  to="/plant-costing"
                  title="Plant Costing"
                  onClick={() => setMobileMenuOpen(false)}
                  className={sidebarLinkClass}
                >

                  <SidebarIcon type="plant" />

                  <span>
                    Plant Costing
                  </span>

                </NavLink>

              )}


              {/* ==================================================
                  REPORTS
              ================================================== */}

              {hasPermission("reports") && (

                <NavLink
                  to="/reports"
                  title="Reports"
                  onClick={() => setMobileMenuOpen(false)}
                  className={sidebarLinkClass}
                >

                  <SidebarIcon type="reports" />

                  <span>
                    Reports
                  </span>

                </NavLink>

              )}


              {/* ==================================================
                  SETTINGS
              ================================================== */}

              {hasPermission("settings") && (

                <NavLink
                  to="/settings"
                  title="Settings"
                  onClick={() => setMobileMenuOpen(false)}
                  className={sidebarLinkClass}
                >

                  <SidebarIcon type="settings" />

                  <span>
                    Settings
                  </span>

                </NavLink>

              )}

            </nav>


            {/* ==================================================
                LOGOUT
            ================================================== */}

            <div
              className="
                w-full
                flex
                justify-center
                px-3
                pb-5
                shrink-0
              "
            >

              <button
                onClick={handleLogout}
                title={`Logout ${currentUser?.full_name || ""}`}
                className="
                  w-full
                  h-12
                  px-4
                  rounded-[17px]
                  flex
                  items-center
                  gap-3
                  text-slate-500
                  hover:bg-red-50
                  hover:text-red-600
                  transition-all
                  duration-200
                "
              >

                <SidebarIcon type="logout" />

                <span>
                  Logout
                </span>

              </button>

            </div>

          </div>

        </aside>


        {/* ======================================================
            MAIN CONTENT
        ====================================================== */}

        <div
          className="
            flex-1
            min-w-0
            p-3
            sm:p-4
            lg:p-6
            overflow-x-hidden
            overflow-y-auto
          "
        >


          {/* ====================================================
              MOBILE HEADER
          ==================================================== */}

          <div
            className="
              lg:hidden
              flex
              items-center
              justify-between
              mb-4
            "
          >

            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="
                w-11
                h-11
                rounded-xl
                bg-slate-900
                text-cyan-300
                border
                border-cyan-400/30
                shadow-lg
                flex
                items-center
                justify-center
                text-2xl
                active:scale-95
                transition
              "
              aria-label="Open menu"
            >
              ☰
            </button>


            <div className="flex items-center gap-2">

              <img
                src="/logo.png"
                alt="Shiv Shakti Solar"
                className="
                  h-9
                  w-auto
                  object-contain
                "
              />

              <span
                className="
                  text-white
                  text-sm
                  font-bold
                "
              >
                Shiv Shakti Solar
              </span>

            </div>


            <div className="w-11" />

          </div>


          {/* ====================================================
              ROUTES CONTAINER
          ==================================================== */}

          <div
            className="
              w-full
              max-w-[1200px]
              mx-auto
              min-w-0
            "
          >

    <Routes>

  {/* Redirect logged-in users away from the login page */}
  <Route
    path="/login"
    element={<Navigate to="/" replace />}
  />


              {/* ==================================================
                  DASHBOARD
              ================================================== */}

              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />


              {/* ==================================================
                  CUSTOMERS
              ================================================== */}

              <Route
                path="/customers"
                element={
                  <ProtectedRoute permission="customers">
                    <Customers />
                  </ProtectedRoute>
                }
              />


              {/* ==================================================
                  MASTER INVENTORY
              ================================================== */}

              <Route
                path="/master-inventory"
                element={
                  <ProtectedRoute permission="inventory">
                    <MasterInventory />
                  </ProtectedRoute>
                }
              />


              {/* ==================================================
                  INVENTORY
              ================================================== */}

              <Route
                path="/inventory"
                element={
                  <ProtectedRoute permission="inventory">
                    <Inventory />
                  </ProtectedRoute>
                }
              />


              {/* ==================================================
                  MATERIAL CONSUMPTION
              ================================================== */}

              <Route
                path="/used-inventory"
                element={
                  <ProtectedRoute permission="used_inventory">
                    <UsedInventory />
                  </ProtectedRoute>
                }
              />


              {/* ==================================================
                  FINANCE
              ================================================== */}

              <Route
                path="/finance"
                element={
                  <ProtectedRoute permission="billing">
                    <FinanceLedger />
                  </ProtectedRoute>
                }
              />


              {/* ==================================================
                  INVESTMENTS
              ================================================== */}

              <Route
                path="/investments"
                element={
                  <ProtectedRoute permission="investments">
                    <Investments />
                  </ProtectedRoute>
                }
              />


              {/* ==================================================
                  BILLING
              ================================================== */}

              <Route
                path="/billing"
                element={
                  <ProtectedRoute permission="billing">
                    <Billing />
                  </ProtectedRoute>
                }
              />



              {/* ==================================================
                  INVOICE
              ================================================== */}

             

<Route
  path="/invoice/new-design"
  element={
    <ProtectedRoute permission="invoices">
      <NewInvoice />
    </ProtectedRoute>
  }
/>
              {/* ==================================================
                  CREATE INVOICE
              ================================================== */}

              <Route
                path="/invoice/new"
                element={
                  <ProtectedRoute permission="invoices">
                    <CreateInvoice />
                  </ProtectedRoute>
                }
              />

{/* ==================================================}
      PAYMENT RECEIPT
  ================================================== */}
  <Route
  path="/payment-receipt"
  element={
    <ProtectedRoute permission="invoices">
      <PaymentReceipt />
    </ProtectedRoute>
  }
/>


              {/* ==================================================
                  PLANT COSTING
              ================================================== */}

              <Route
                path="/plant-costing"
                element={
                  <ProtectedRoute permission="settings">
                    <PlantCosting />
                  </ProtectedRoute>
                }
              />


              {/* ==================================================
                  PLANT COSTING BY SIZE
              ================================================== */}

              <Route
                path="/plant-costing/:size"
                element={
                  <ProtectedRoute permission="settings">
                    <PlantCosting />
                  </ProtectedRoute>
                }
              />


              {/* ==================================================
                  SETTINGS
              ================================================== */}

              <Route
                path="/settings"
                element={
                  <ProtectedRoute permission="settings">
                    <Settings />
                  </ProtectedRoute>
                }
              />


              {/* ==================================================
                  REPORTS
              ================================================== */}

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

    </>
  );
}
