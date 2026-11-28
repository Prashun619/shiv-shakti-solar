
import { useState } from "react";
import { supabase } from "../services/supabase";
import { Eye, EyeOff } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Login({ setCurrentUser }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  async function handleLogin(e) {
    e.preventDefault();

    if (loading) return;

    setLoading(true);

    try {
      // Find login email using username
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

      // Supabase authentication
      const { data, error } =
        await supabase.auth.signInWithPassword({
          email: loginEmail,
          password,
        });

      if (error) {
        console.error("SUPABASE LOGIN ERROR:", error);
        alert(error.message);
        return;
      }

      // Verify authenticated session
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (
        sessionError ||
        !session ||
        !session.access_token ||
        session.user.id !== data.user?.id
      ) {
        console.error("SUPABASE SESSION ERROR:", sessionError);

        await supabase.auth.signOut();

        alert(
          "Login succeeded but the authenticated session could not be verified. Please login again."
        );
        return;
      }

      console.log("Authenticated session verified:", {
        email: session.user.email,
        userId: session.user.id,
        hasAccessToken: !!session.access_token,
      });

      // Load user profile and permissions
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

      sessionStorage.setItem(
        "erp_user",
        JSON.stringify(userSession)
      );

      setCurrentUser(userSession);

      navigate("/");
    } catch (error) {
      console.error(error);
      alert(error.message);
    } finally {
      setLoading(false);
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
        bg-[#071426]
      "
      style={{
        backgroundImage: `
          linear-gradient(
            120deg,
            rgba(4, 18, 37, 0.22),
            rgba(4, 18, 37, 0.05)
          ),
          url('/solar-login-bg.png')
        `,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >

      {/* DARK OVERLAY */}

      <div
        className="
          absolute
          inset-0
          pointer-events-none
        "
        style={{
          background:
            "linear-gradient(90deg, rgba(3,15,32,0.35), rgba(3,15,32,0.05), rgba(3,15,32,0.20))",
        }}
      />

      
{/* COMPANY BRANDING */}

<div
  className="
    absolute
    top-6
    left-6
    md:top-8
    md:left-10
    z-20
  "
>
  <div className="flex items-center gap-3">

    <img
  src="/logo.png"
  alt="Shiv Shakti Solar Energy"
  className="
    h-20
    w-20
    md:h-28
    md:w-28
    object-contain
    drop-shadow-lg
    shrink-0
  "
/>

    <div className="leading-tight">

      
<h2 className="
  text-[#45D9FF]
  font-extrabold
  text-lg
  md:text-5xl
  tracking-wide
  whitespace-nowrap
">
  Shiv Shakti Solar Energy
</h2>

<p className="
  text-white/75
  text-[12px]
  md:text-xl
  tracking-wide
  whitespace-nowrap
">
  Powering a Brighter & Greener Tomorrow
</p>


    </div>

  </div>
</div>


      {/* LOGIN CARD */}

      <div
        className="
          relative
          z-10
          w-full
          max-w-[480px]
          mt-16
          md:ml-[850px]
          rounded-2xl
          p-5
sm:p-8
md:p-10
          border
          border-white/30
        "
        style={{
          background:
            "linear-gradient(135deg, rgba(5,22,40,0.86), rgba(25,38,49,0.70))",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          boxShadow:
            "0 25px 80px rgba(0,0,0,0.35), inset 0 1px 1px rgba(255,255,255,0.15)",
        }}
      >

        {/* HEADING */}

        <div className="text-center mb-6 md:mb-9">

          <h1
            className="
              text-white
              text-4xl
              font-semibold
              tracking-wide
            "
          >
            Login
          </h1>

          <div
            className="
              w-24
              h-1
              mx-auto
              mt-4
              rounded-full
            "
            style={{
              background:
                "linear-gradient(90deg, #f59e0b, #ffdf62)",
              boxShadow:
                "0 0 15px rgba(245,158,11,0.45)",
            }}
          />

          <p className="text-white/60 text-sm mt-4">
            Welcome back! Sign in to continue.
          </p>

        </div>

        <form onSubmit={handleLogin}>

          {/* USERNAME */}

          <div className="mb-6">

            <label
              className="
                block
                text-white/90
                text-sm
                font-medium
                mb-2
              "
            >
              Username
            </label>

            <div className="relative">

              <span
                className="
                  absolute
                  left-4
                  top-1/2
                  -translate-y-1/2
                  text-amber-400
                  text-lg
                "
              >
                ✉
              </span>

              <input
                type="text"
                placeholder="Enter your username"
                value={username}
                onChange={(e) =>
                  setUsername(e.target.value)
                }
                required
                autoComplete="username"
                className="
                  w-full
                  h-14
                  rounded-xl
                  bg-white/10
                  border
                  border-white/30
                  text-white
                  placeholder-white/45
                  pl-12
                  pr-4
                  outline-none
                  transition-all
                  duration-200
                  focus:border-amber-400
                  focus:ring-2
                  focus:ring-amber-400/20
                "
              />

            </div>

          </div>

          {/* PASSWORD */}

          <div className="mb-8">

            <label
              className="
                block
                text-white/90
                text-sm
                font-medium
                mb-2
              "
            >
              Password
            </label>

            <div className="relative">

              <span
                className="
                  absolute
                  left-4
                  top-1/2
                  -translate-y-1/2
                  text-amber-400
                  text-lg
                "
              >
                🔒
              </span>

              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) =>
                  setPassword(e.target.value)
                }
                required
                autoComplete="current-password"
                className="
                  w-full
                  h-14
                  rounded-xl
                  bg-white/10
                  border
                  border-white/30
                  text-white
                  placeholder-white/45
                  pl-12
                  pr-14
                  outline-none
                  transition-all
                  duration-200
                  focus:border-amber-400
                  focus:ring-2
                  focus:ring-amber-400/20
                "
              />

              
<button
  type="button"
  onClick={() => setShowPassword(!showPassword)}
  aria-label={showPassword ? "Hide password" : "Show password"}
  className="
    absolute
    right-4
    top-1/2
    -translate-y-1/2
    text-[#C49A35]
    hover:text-[#F5C75E]
    transition-all
    duration-200
    hover:scale-110
  "
>
  {showPassword ? (
    <EyeOff size={22} strokeWidth={1.8} />
  ) : (
    <Eye size={22} strokeWidth={1.8} />
  )}
</button>


            </div>

          </div>

          {/* LOGIN BUTTON */}

          <button
            type="submit"
            disabled={loading}
            className="
              w-full
              h-14
              rounded-xl
              text-white
              text-lg
              font-bold
              tracking-wide
              transition-all
              duration-300
              hover:scale-[1.02]
              active:scale-[0.98]
              disabled:opacity-60
              disabled:cursor-not-allowed
            "
            style={{
              background:
                "linear-gradient(100deg, #f59e0b, #ffbd35, #f59e0b)",
              boxShadow:
                "0 5px 25px rgba(245,158,11,0.30)",
            }}
          >
            {loading ? "Signing in..." : "Login"}
          </button>

        </form>

        {/* FOOTER */}

        <div
          className="
            text-center
            text-white/50
            text-xs
            mt-7
          "
        >
          Secure Access · Solar Management System
        </div>

      </div>

    </div>
  );
}
