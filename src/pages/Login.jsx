import { useState } from "react";
import { supabase } from "../services/supabase";
import { useNavigate } from "react-router-dom";

export default function Login({ setCurrentUser }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);

  const navigate = useNavigate();

  async function handleLogin(e) {
    e.preventDefault();

    try {
      // Find user
      const {
        data: loginEmail,
        error: emailError,
      } = await supabase.rpc("get_login_email", {
        p_username: username.trim(),
      });

      if (emailError || !loginEmail) {
        alert("Username not found");
        return;
      }

      // Auth login using username converted email
      const { data, error } =
        await supabase.auth.signInWithPassword({
          email: loginEmail,
          password,
        });

      const {
        data: { session },
      } = await supabase.auth.getSession();

      console.log("JWT email:", session?.user?.email);

      if (error) {
        alert(error.message);
        return;
      }

      const {
        data: user,
        error: userError,
      } = await supabase
        .from("users")
        .select(`
          id,
          full_name,
          username,
          email,
          role,
          active,
          customers,
          inventory,
          used_inventory,
          payments,
          reports,
          quotations,
          settings,
          billing,
          investments,
          invoices
        `)
        .eq("email", loginEmail)
        .single();

      if (userError || !user) {
        alert("Unable to load user profile.");
        return;
      }

      if (!user.active) {
        alert("User account is inactive");
        return;
      }

      // Store user details
      const userSession = {
        id: user.id,
        full_name: user.full_name,
        username: user.username,
        email: user.email,
        role: user.role,

        customers: user.customers,
        inventory: user.inventory,
        used_inventory: user.used_inventory,
        payments: user.payments,
        reports: user.reports,
        quotations: user.quotations,
        settings: user.settings,
        billing: user.billing,
        investments: user.investments,
        invoices: user.invoices,
      };

      if (remember) {
        localStorage.setItem(
          "erp_user",
          JSON.stringify(userSession)
        );

        console.log(
          "Saved user:",
          localStorage.getItem("erp_user") ||
            sessionStorage.getItem("erp_user")
        );
      } else {
        sessionStorage.setItem(
          "erp_user",
          JSON.stringify(userSession)
        );
      }

      setCurrentUser(userSession);

      navigate("/");
    } catch (error) {
      console.log(error);
      alert(error.message);
    }
  }

  return (
    <div
      className="
        relative
        min-h-screen
        w-full
        overflow-hidden
        flex
        items-center
        justify-center
        px-4
        py-8
      "
      style={{
        background:
          "linear-gradient(180deg, #d7c291 0%, #d4bd89 48%, #d1b984 100%)",
      }}
    >
      {/* =========================================================
          BACKGROUND
      ========================================================= */}

      <div className="absolute inset-0 overflow-hidden pointer-events-none">

        {/* Soft upper background glow */}
        <div
          className="
            absolute
            top-0
            left-0
            w-full
            h-[42%]
          "
          style={{
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.16), rgba(255,255,255,0))",
          }}
        />

        {/* ================= TOP LEFT LARGE SPHERE ================= */}

        <div
          className="
            absolute
            -top-2
            left-[19%]
            w-[190px]
            h-[190px]
            rounded-full
          "
          style={{
            background:
              "radial-gradient(circle at 35% 28%, #fff1ad 0%, #f9d56b 35%, #eab33f 68%, #d69a25 100%)",
            boxShadow:
              "inset -20px -25px 35px rgba(173,112,13,0.22), 15px 25px 35px rgba(112,80,20,0.18)",
          }}
        />

        {/* ================= TOP CENTER SMALL SPHERE ================= */}

        <div
          className="
            absolute
            top-[8%]
            left-[57%]
            w-[75px]
            h-[75px]
            rounded-full
          "
          style={{
            background:
              "radial-gradient(circle at 32% 25%, #fff0ad 0%, #f6cf68 42%, #dca02e 100%)",
            boxShadow:
              "inset -8px -10px 18px rgba(166,105,15,0.18), 8px 14px 20px rgba(112,80,20,0.16)",
          }}
        />

        {/* ================= TOP RIGHT SMALL SPHERE ================= */}

        <div
          className="
            absolute
            top-[23%]
            right-[8%]
            w-[56px]
            h-[56px]
            rounded-full
          "
          style={{
            background:
              "radial-gradient(circle at 32% 25%, #fff0a8 0%, #f2cb64 45%, #dc9d2b 100%)",
            boxShadow:
              "inset -7px -8px 15px rgba(166,105,15,0.18), 7px 10px 18px rgba(112,80,20,0.15)",
          }}
        />

        {/* ================= LEFT CENTER SPHERE ================= */}

        <div
          className="
            absolute
            top-[47%]
            -left-[32px]
            w-[90px]
            h-[90px]
            rounded-full
          "
          style={{
            background:
              "radial-gradient(circle at 32% 25%, #fff0aa 0%, #f5ce68 42%, #dc9e2e 100%)",
            boxShadow:
              "inset -8px -10px 18px rgba(166,105,15,0.18), 8px 14px 20px rgba(112,80,20,0.16)",
          }}
        />

        {/* ================= BOTTOM LEFT LARGE SPHERE ================= */}

        <div
          className="
            absolute
            -bottom-[15px]
            left-[5%]
            w-[205px]
            h-[205px]
            rounded-full
          "
          style={{
            background:
              "radial-gradient(circle at 35% 25%, #ffedaa 0%, #f7cf62 38%, #e7ad36 70%, #d79620 100%)",
            boxShadow:
              "inset -22px -28px 40px rgba(173,112,13,0.24), 18px 25px 40px rgba(112,80,20,0.18)",
          }}
        />

        {/* ================= BOTTOM RIGHT LARGE SPHERE ================= */}

        <div
          className="
            absolute
            -bottom-[28px]
            right-[-45px]
            w-[245px]
            h-[245px]
            rounded-full
          "
          style={{
            background:
              "radial-gradient(circle at 35% 25%, #fff0aa 0%, #f8d269 38%, #e9b13a 70%, #d99b26 100%)",
            boxShadow:
              "inset -25px -30px 45px rgba(173,112,13,0.24), 18px 25px 40px rgba(112,80,20,0.18)",
          }}
        />

      </div>


      {/* =========================================================
          GLASS CIRCLE
      ========================================================= */}

      <div
        className="
          relative
          z-10
          w-[min(92vw,500px)]
          h-[min(92vw,500px)]
          rounded-full
          flex
          items-center
          justify-center
        "
        style={{
          background:
            "linear-gradient(135deg, rgba(255,255,255,0.27), rgba(255,255,255,0.10))",
          border:
            "1px solid rgba(255,255,255,0.48)",
          boxShadow:
            "inset 0 1px 1px rgba(255,255,255,0.45), 0 10px 35px rgba(117,89,35,0.10)",
          backdropFilter: "blur(7px)",
          WebkitBackdropFilter: "blur(7px)",
        }}
      >

        {/* =====================================================
            LOGIN CONTENT
        ===================================================== */}

        <div
          className="
            w-[58%]
            min-w-[260px]
            max-w-[310px]
          "
        >

          {/* Heading */}

          <h1
            className="
              text-white
              text-[42px]
              leading-none
              font-bold
              tracking-tight
              mb-9
            "
            style={{
              textShadow: "0 2px 5px rgba(120,90,25,0.15)",
            }}
          >
            Login
          </h1>


          <form onSubmit={handleLogin}>

            {/* =================================================
                EMAIL / USERNAME
            ================================================= */}

            <div className="relative mb-4">

              <span
                className="
                  absolute
                  left-4
                  top-1/2
                  -translate-y-1/2
                  text-[#b59a58]
                  text-[16px]
                  z-10
                "
              >
                ✉
              </span>

              <input
                type="text"
                placeholder="Email"
                value={username}
                onChange={(e) =>
                  setUsername(e.target.value.trim())
                }
                className="
                  w-full
                  h-[44px]
                  rounded-[4px]
                  bg-white
                  border-none
                  outline-none
                  pl-11
                  pr-4
                  text-[#806b35]
                  placeholder-[#b09b61]
                  text-[14px]
                  shadow-[0_2px_8px_rgba(120,90,30,0.08)]
                  focus:ring-2
                  focus:ring-[#e4bf58]/40
                "
              />

            </div>


            {/* =================================================
                PASSWORD
            ================================================= */}

            <div className="relative mb-4">

              <span
                className="
                  absolute
                  left-4
                  top-1/2
                  -translate-y-1/2
                  text-[#b59a58]
                  text-[16px]
                  z-10
                "
              >
                🔒
              </span>

              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) =>
                  setPassword(e.target.value)
                }
                className="
                  w-full
                  h-[44px]
                  rounded-[4px]
                  bg-white
                  border-none
                  outline-none
                  pl-11
                  pr-12
                  text-[#806b35]
                  placeholder-[#b09b61]
                  text-[14px]
                  shadow-[0_2px_8px_rgba(120,90,30,0.08)]
                  focus:ring-2
                  focus:ring-[#e4bf58]/40
                "
              />

              <button
                type="button"
                onClick={() =>
                  setShowPassword(!showPassword)
                }
                className="
                  absolute
                  right-3
                  top-1/2
                  -translate-y-1/2
                  text-[#b59a58]
                  hover:text-[#8d7437]
                  transition
                  text-[15px]
                "
              >
                {showPassword ? "🙈" : "👁"}
              </button>

            </div>


            {/* =================================================
                FORGOT PASSWORD
            ================================================= */}

            <div className="flex justify-end mb-8">

              <button
                type="button"
                className="
                  text-white
                  text-[12px]
                  hover:underline
                  transition
                  drop-shadow-[0_1px_2px_rgba(100,70,20,0.15)]
                "
              >
                Forgot Password?
              </button>

            </div>


            {/* =================================================
                LOGIN BUTTON
            ================================================= */}

            <button
              type="submit"
              className="
                w-full
                h-[44px]
                rounded-[10px]
                bg-white
                text-[#b28b2e]
                font-bold
                text-[17px]
                shadow-[0_3px_10px_rgba(120,90,30,0.10)]
                hover:bg-[#fffdf7]
                hover:shadow-[0_5px_15px_rgba(120,90,30,0.18)]
                active:scale-[0.98]
                transition-all
                duration-200
              "
            >
              Login
            </button>

          </form>

        </div>

      </div>


      {/* =========================================================
          SMALL SCREEN OVERLAY SO SPHERES STAY SUBTLE
      ========================================================= */}

      <div
        className="
          absolute
          inset-0
          pointer-events-none
        "
        style={{
          background:
            "radial-gradient(circle at 50% 50%, rgba(255,255,255,0.05), transparent 45%)",
        }}
      />

    </div>
  );
}