import { useState } from "react";
import { supabase } from "../services/supabase";
import { useNavigate } from "react-router-dom";

export default function Login({setCurrentUser}) {


  const [username,setUsername] =
    useState("");

  const [password, setPassword] = useState("");

    const [showPassword, setShowPassword] = useState(false);

  const [remember,setRemember] =
    useState(false);


  const navigate = useNavigate();



  async function handleLogin(e){

    e.preventDefault();

    

    try{


      // Find user

      const {
  data: loginEmail,
  error: emailError,
} = await supabase.rpc(
  "get_login_email",
  {
    p_username: username.trim(),
  }
);



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


      if(error){

        alert(
          error.message
        );

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



      if(remember){

        localStorage.setItem(
          "erp_user",
          JSON.stringify(userSession)
        );

console.log(
  "Saved user:",
  localStorage.getItem("erp_user") ||
  sessionStorage.getItem("erp_user")
);

      }
      else{

        sessionStorage.setItem(
          "erp_user",
          JSON.stringify(userSession)
        );

      }

     

setCurrentUser(userSession);


navigate("/");


    }

    catch(error){

      console.log(error);

      alert(error.message);

    }


  }


return (
  <div className="min-h-screen relative overflow-hidden bg-[#050816] flex items-center justify-center p-5">

    {/* ================= NEON BACKGROUND ================= */}

    <div className="absolute inset-0 overflow-hidden">

      {/* Blue glow */}
      <div
        className="
          absolute
          -top-32
          -left-32
          w-[500px]
          h-[500px]
          bg-cyan-500/20
          rounded-full
          blur-[120px]
        "
      />

      {/* Purple glow */}
      <div
        className="
          absolute
          top-1/3
          -right-40
          w-[550px]
          h-[550px]
          bg-purple-600/25
          rounded-full
          blur-[130px]
        "
      />

      {/* Pink glow */}
      <div
        className="
          absolute
          -bottom-40
          left-1/3
          w-[500px]
          h-[500px]
          bg-fuchsia-500/15
          rounded-full
          blur-[120px]
        "
      />

      {/* Neon gradient light */}
      <div
        className="
          absolute
          inset-0
          bg-gradient-to-br
          from-cyan-500/5
          via-purple-600/10
          to-fuchsia-500/5
        "
      />

    </div>


    {/* ================= LOGIN CARD ================= */}

    <div
  className="
    neon-login-card
    relative
    z-10
    w-full
    max-w-md
    rounded-3xl
    p-[2px]
  "
>

      <div
        className="
          bg-[#080d1f]/95
          backdrop-blur-2xl
          rounded-3xl
          p-8
          border
          border-white/10
        "
      >

        {/* ================= LOGO ================= */}

        <div className="text-center mb-8">

          <div
            className="
              relative
              inline-flex
              items-center
              justify-center
              mb-5
            "
          >

            {/* Logo glow */}
            <div
              className="
                absolute
                w-32
                h-32
                rounded-full
                bg-cyan-400/20
                blur-2xl
              "
            />

            <img
              src="/logo.png"
              className="
                relative
                h-24
                w-auto
                object-contain
                drop-shadow-[0_0_18px_rgba(34,211,238,0.7)]
              "
            />

          </div>


          <h1
            className="
              text-3xl
              font-bold
              text-white
              tracking-wide
            "
          >
            Shiv Shakti Solar
          </h1>


          <p className="text-slate-400 mt-2">
            Login to continue
          </p>

        </div>


        {/* ================= FORM ================= */}

        <form onSubmit={handleLogin}>

          {/* Username */}

          <div className="mb-4">

            <input
              className="
                w-full
                bg-white/[0.04]
                border
                border-white/15
                rounded-xl
                p-3.5
                text-white
                placeholder-slate-500
                outline-none
                transition-all
                duration-300

                focus:border-cyan-400
                focus:ring-2
                focus:ring-cyan-400/20
                focus:shadow-[0_0_18px_rgba(34,211,238,0.15)]
              "
              placeholder="Username"
              value={username}
              onChange={(e) =>
                setUsername(e.target.value.trim())
              }
            />

          </div>


          {/* Password */}

          <div className="relative mb-4">

            <input
              type={showPassword ? "text" : "password"}
              className="
                w-full
                bg-white/[0.04]
                border
                border-white/15
                rounded-xl
                p-3.5
                pr-12
                text-white
                placeholder-slate-500
                outline-none
                transition-all
                duration-300

                focus:border-purple-400
                focus:ring-2
                focus:ring-purple-400/20
                focus:shadow-[0_0_18px_rgba(168,85,247,0.18)]
              "
              placeholder="Password"
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
            />


            <button
              type="button"
              className="
                absolute
                right-3
                top-3
                text-slate-400
                hover:text-cyan-400
                transition
              "
              onClick={() =>
                setShowPassword(!showPassword)
              }
            >
              {showPassword ? "🙈" : "👁"}
            </button>

          </div>


          {/* Remember Me */}

          <div className="flex items-center mb-7">

            <input
              type="checkbox"
              checked={remember}
              onChange={(e) =>
                setRemember(e.target.checked)
              }
              className="
                w-4
                h-4
                accent-cyan-400
                cursor-pointer
              "
            />

            <span className="ml-2 text-slate-400 text-sm">
              Remember Me
            </span>

          </div>


          {/* ================= LOGIN BUTTON ================= */}

          <button
            type="submit"
            className="
              group
              relative
              w-full
              overflow-hidden
              rounded-xl
              py-3.5
              font-bold
              text-white

              bg-gradient-to-r
              from-cyan-500
              via-purple-600
              to-fuchsia-500

              shadow-[0_0_25px_rgba(139,92,246,0.45)]

              hover:shadow-[0_0_40px_rgba(34,211,238,0.55)]

              transition-all
              duration-300

              hover:scale-[1.01]
              active:scale-[0.99]
            "
          >

            {/* Moving shine */}

            <span
              className="
                absolute
                inset-0
                bg-gradient-to-r
                from-transparent
                via-white/20
                to-transparent
                -translate-x-full
                group-hover:translate-x-full
                transition-transform
                duration-700
              "
            />

            <span className="relative z-10">
              Login
            </span>

          </button>

        </form>


        {/* Bottom glow */}

        <div
          className="
            mt-8
            h-px
            bg-gradient-to-r
            from-transparent
            via-cyan-400/40
            to-transparent
          "
        />

        <p className="text-center text-xs text-slate-600 mt-4">
          Shiv Shakti Solar ERP
        </p>

      </div>

    </div>

  </div>
);
}