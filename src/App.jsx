import Investments from "./pages/Investments";

import { Navigate } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import PlantCosting from "./pages/PlantCosting";

import {
  Routes,
  Route,
  Link,
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
import Invoice from "./pages/Invoice";
import CreateInvoice from "./pages/CreateInvoice";


export default function App() {

  const [currentUser, setCurrentUser] = useState(() => {

    const saved =
      localStorage.getItem("erp_user") ||
      sessionStorage.getItem("erp_user");

    return saved ? JSON.parse(saved) : null;
  });


  const [userLoaded, setUserLoaded] = useState(false);


  useEffect(() => {
    setUserLoaded(true);
  }, []);


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


  async function handleLogout() {

    await supabase.auth.signOut();

    localStorage.removeItem("erp_user");
    sessionStorage.removeItem("erp_user");

    setCurrentUser(null);

    navigate("/login");
  }


  if (!userLoaded) {
    return null;
  }


  /* =====================================================
     LOGIN
  ===================================================== */

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


  /* =====================================================
     APPLICATION
  ===================================================== */

  return (
    <>
      <style>{`

        /* =================================================
           SIDEBAR NEON ANIMATION
        ================================================= */

        @keyframes sidebarNeonMove {

          0% {
            background-position: 0% 0%;
          }

          50% {
            background-position: 0% 100%;
          }

          100% {
            background-position: 0% 0%;
          }

        }


        @keyframes sidebarGlowPulse {

          0% {
            opacity: 0.35;
          }

          50% {
            opacity: 0.75;
          }

          100% {
            opacity: 0.35;
          }

        }


        .sidebar-neon-line {

          background-size: 100% 300%;

          animation:
            sidebarNeonMove 5s linear infinite;

        }


        .sidebar-neon-glow {

          background-size: 100% 300%;

          animation:
            sidebarNeonMove 5s linear infinite,
            sidebarGlowPulse 3s ease-in-out infinite;

        }

      `}</style>


      {/* =================================================
          MAIN APPLICATION
      ================================================= */}

      <div className="h-screen flex bg-[#050816]">


        {/* =================================================
            SIDEBAR
        ================================================= */}

        <aside
          className="
            relative
            w-64
            text-white
            flex
            flex-col
            shadow-2xl
            z-40
            overflow-hidden
            bg-[#050816]
          "
        >


          {/* =================================================
              SIDEBAR BACKGROUND — SAME AS LOGIN
          ================================================= */}


          {/* Cyan Glow */}

          <div
            className="
              pointer-events-none
              absolute
              -top-32
              -left-32
              w-[400px]
              h-[400px]
              bg-cyan-500/20
              rounded-full
              blur-[110px]
            "
          />


          {/* Purple Glow */}

          <div
            className="
              pointer-events-none
              absolute
              top-1/3
              -right-40
              w-[450px]
              h-[450px]
              bg-purple-600/25
              rounded-full
              blur-[120px]
            "
          />


          {/* Pink Glow */}

          <div
            className="
              pointer-events-none
              absolute
              -bottom-40
              left-1/3
              w-[400px]
              h-[400px]
              bg-fuchsia-500/15
              rounded-full
              blur-[110px]
            "
          />


          {/* Overall Neon Gradient */}

          <div
            className="
              pointer-events-none
              absolute
              inset-0
              bg-gradient-to-br
              from-cyan-500/5
              via-purple-600/10
              to-fuchsia-500/5
            "
          />


          {/* =================================================
              MOVING NEON EDGE
          ================================================= */}

          <div
            className="
              sidebar-neon-line
              pointer-events-none
              absolute
              top-0
              right-0
              h-full
              w-[3px]
              z-50
            "
            style={{
              background:
                "linear-gradient(180deg, #22d3ee, #3b82f6, #8b5cf6, #d946ef, #22d3ee)",
              backgroundSize: "100% 300%",
            }}
          />


          {/* Neon Blur */}

          <div
            className="
              sidebar-neon-glow
              pointer-events-none
              absolute
              top-0
              right-[-7px]
              h-full
              w-[18px]
              z-40
            "
            style={{
              background:
                "linear-gradient(180deg, #22d3ee, #3b82f6, #8b5cf6, #d946ef, #22d3ee)",
              backgroundSize: "100% 300%",
              filter: "blur(10px)",
              opacity: 0.65,
            }}
          />


          {/* =================================================
              SIDEBAR CONTENT
          ================================================= */}

          <div className="relative z-10 flex flex-col h-full">


            {/* =================================================
                HEADER
            ================================================= */}

            <div
              className="
                p-5
                border-b
                border-white/10
                bg-white/[0.02]
              "
            >

              <div className="flex items-center gap-3">


                {/* Logo */}

                <div
                  className="
                    relative
                    w-11
                    h-11
                    flex
                    items-center
                    justify-center
                  "
                >

                  {/* Logo Glow */}

                  <div
                    className="
                      absolute
                      inset-0
                      rounded-full
                      bg-cyan-400/20
                      blur-xl
                    "
                  />


                  <img
                    src="/logo.png"
                    className="
                      relative
                      h-10
                      w-auto
                      object-contain
                      drop-shadow-[0_0_12px_rgba(34,211,238,0.7)]
                    "
                    alt="Shiv Shakti Solar"
                  />

                </div>


                {/* Title */}

                <div>

                  <h1
                    className="
                      text-sm
                      font-bold
                      text-white
                      tracking-wide
                    "
                  >
                    Shiv Shakti Solar
                  </h1>

                  <p
                    className="
                      text-xs
                      text-cyan-300/70
                    "
                  >
                  
                  </p>

                </div>

              </div>

            </div>


            {/* =================================================
                NAVIGATION
            ================================================= */}

            <nav
              className="
                flex-1
                p-4
                space-y-2
                overflow-y-auto
              "
            >


              {/* Dashboard */}

              <Link
                className="
                  block
                  px-4
                  py-3
                  rounded-xl
                  text-sm
                  font-medium
                  text-slate-200
                  hover:bg-cyan-400/10
                  hover:text-cyan-300
                  hover:translate-x-1
                  transition-all
                  duration-200
                "
                to="/"
              >
                Dashboard
              </Link>


              {/* Customers */}

              {hasPermission("customers") && (
                <Link
                  className="
                    block
                    px-4
                    py-3
                    rounded-xl
                    text-sm
                    font-medium
                    text-slate-200
                    hover:bg-cyan-400/10
                    hover:text-cyan-300
                    hover:translate-x-1
                    transition-all
                    duration-200
                  "
                  to="/customers"
                >
                  Customers
                </Link>
              )}


              {/* Master Inventory */}

              {hasPermission("inventory") && (
                <Link
                  className="
                    block
                    px-4
                    py-3
                    rounded-xl
                    text-sm
                    font-medium
                    text-slate-200
                    hover:bg-cyan-400/10
                    hover:text-cyan-300
                    hover:translate-x-1
                    transition-all
                    duration-200
                  "
                  to="/master-inventory"
                >
                  Master Inventory
                </Link>
              )}


              {/* Inventory */}

              {hasPermission("inventory") && (
                <Link
                  className="
                    block
                    px-4
                    py-3
                    rounded-xl
                    text-sm
                    font-medium
                    text-slate-200
                    hover:bg-cyan-400/10
                    hover:text-cyan-300
                    hover:translate-x-1
                    transition-all
                    duration-200
                  "
                  to="/inventory"
                >
                  Inventory
                </Link>
              )}


              {/* Material Consumption */}

              {hasPermission("used_inventory") && (
                <Link
                  className="
                    block
                    px-4
                    py-3
                    rounded-xl
                    text-sm
                    font-medium
                    text-slate-200
                    hover:bg-cyan-400/10
                    hover:text-cyan-300
                    hover:translate-x-1
                    transition-all
                    duration-200
                  "
                  to="/used-inventory"
                >
                  Material Consumption
                </Link>
              )}


              {/* Finance Ledger */}

              {hasPermission("billing") && (
                <Link
                  className="
                    block
                    px-4
                    py-3
                    rounded-xl
                    text-sm
                    font-medium
                    text-slate-200
                    hover:bg-cyan-400/10
                    hover:text-cyan-300
                    hover:translate-x-1
                    transition-all
                    duration-200
                  "
                  to="/finance"
                >
                  Finance Ledger
                </Link>
              )}


              {/* Investments */}

              {hasPermission("investments") && (
                <Link
                  className="
                    block
                    px-4
                    py-3
                    rounded-xl
                    text-sm
                    font-medium
                    text-slate-200
                    hover:bg-cyan-400/10
                    hover:text-cyan-300
                    hover:translate-x-1
                    transition-all
                    duration-200
                  "
                  to="/investments"
                >
                  Investments
                </Link>
              )}


              {/* Invoice */}

              {hasPermission("invoices") && (
                <Link
                  className="
                    block
                    px-4
                    py-3
                    rounded-xl
                    text-sm
                    font-medium
                    text-slate-200
                    hover:bg-cyan-400/10
                    hover:text-cyan-300
                    hover:translate-x-1
                    transition-all
                    duration-200
                  "
                  to="/invoice"
                >
                  Invoice
                </Link>
              )}


              {/* Plant Costing */}

              {hasPermission("settings") && (
                <Link
                  className="
                    block
                    px-4
                    py-3
                    rounded-xl
                    text-sm
                    font-medium
                    text-slate-200
                    hover:bg-cyan-400/10
                    hover:text-cyan-300
                    hover:translate-x-1
                    transition-all
                    duration-200
                  "
                  to="/plant-costing"
                >
                  Plant Costing
                </Link>
              )}


              {/* Reports */}

              {hasPermission("reports") && (
                <Link
                  className="
                    block
                    px-4
                    py-3
                    rounded-xl
                    text-sm
                    font-medium
                    text-slate-200
                    hover:bg-cyan-400/10
                    hover:text-cyan-300
                    hover:translate-x-1
                    transition-all
                    duration-200
                  "
                  to="/reports"
                >
                  Reports
                </Link>
              )}


              {/* Settings */}

              {hasPermission("settings") && (
                <Link
                  className="
                    block
                    px-4
                    py-3
                    rounded-xl
                    text-sm
                    font-medium
                    text-slate-200
                    hover:bg-cyan-400/10
                    hover:text-cyan-300
                    hover:translate-x-1
                    transition-all
                    duration-200
                  "
                  to="/settings"
                >
                  Settings
                </Link>
              )}

            </nav>


            {/* =================================================
                USER / LOGOUT
            ================================================= */}

            <div
              className="
                relative
                p-4
                border-t
                border-white/10
                bg-white/[0.02]
              "
            >

              {currentUser && (
                <div className="mb-4">

                  <p
                    className="
                      font-bold
                      text-white
                      flex
                      items-center
                      gap-2
                    "
                  >
                    👤 {currentUser.full_name}
                  </p>

                  <p
                    className="
                      text-sm
                      text-slate-400
                      mt-1
                    "
                  >
                    Role: {currentUser.role}
                  </p>

                </div>
              )}


              <button
                onClick={handleLogout}
                className="
                  w-full
                  bg-gradient-to-r
                  from-red-500/80
                  to-fuchsia-600/80
                  hover:from-red-500
                  hover:to-fuchsia-500
                  text-white
                  py-2
                  rounded-xl
                  font-semibold
                  shadow-[0_0_15px_rgba(217,70,239,0.2)]
                  hover:shadow-[0_0_25px_rgba(217,70,239,0.4)]
                  transition-all
                "
              >
                🚪 Logout
              </button>

            </div>

          </div>

        </aside>


        {/* =================================================
            MAIN CONTENT
        ================================================= */}

        <div
          className="
            flex-1
            p-6
            overflow-x-hidden
            overflow-y-auto
          "
        >

          <div className="max-w-[1200px] mx-auto">

            <Routes>


              {/* Dashboard */}

              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />


              {/* Customers */}

              <Route
                path="/customers"
                element={
                  <ProtectedRoute permission="customers">
                    <Customers />
                  </ProtectedRoute>
                }
              />


              {/* Master Inventory */}

              <Route
                path="/master-inventory"
                element={
                  <ProtectedRoute permission="inventory">
                    <MasterInventory />
                  </ProtectedRoute>
                }
              />


              {/* Inventory */}

              <Route
                path="/inventory"
                element={
                  <ProtectedRoute permission="inventory">
                    <Inventory />
                  </ProtectedRoute>
                }
              />


              {/* Material Consumption */}

              <Route
                path="/used-inventory"
                element={
                  <ProtectedRoute permission="used_inventory">
                    <UsedInventory />
                  </ProtectedRoute>
                }
              />


              {/* Finance */}

              <Route
                path="/finance"
                element={
                  <ProtectedRoute permission="billing">
                    <FinanceLedger />
                  </ProtectedRoute>
                }
              />


              {/* Investments */}

              <Route
                path="/investments"
                element={
                  <ProtectedRoute permission="investments">
                    <Investments />
                  </ProtectedRoute>
                }
              />


              {/* Billing */}

              <Route
                path="/billing"
                element={
                  <ProtectedRoute permission="billing">
                    <Billing />
                  </ProtectedRoute>
                }
              />


              {/* Invoice */}

              <Route
                path="/invoice"
                element={
                  <ProtectedRoute permission="invoices">
                    <Invoice />
                  </ProtectedRoute>
                }
              />


              {/* Create Invoice */}

              <Route
                path="/invoice/new"
                element={
                  <ProtectedRoute permission="invoices">
                    <CreateInvoice />
                  </ProtectedRoute>
                }
              />


              {/* Plant Costing */}

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


              {/* Settings */}

              <Route
                path="/settings"
                element={
                  <ProtectedRoute permission="settings">
                    <Settings />
                  </ProtectedRoute>
                }
              />


              {/* Reports */}

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