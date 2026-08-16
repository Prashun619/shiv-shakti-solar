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

<div className="min-h-screen bg-slate-100 flex items-center justify-center p-5">


<div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-slate-300 p-8">


<div className="text-center mb-8">


<img

src="/logo.png"

className="h-24 mx-auto mb-4"

/>


<h1 className="text-2xl font-bold text-slate-900">

Shiv Shakti Solar ERP

</h1>


<p className="text-slate-600 mt-2">

Login to continue

</p>


</div>




<form onSubmit={handleLogin}>


<input

className="w-full border-2 border-slate-300 rounded-xl p-3 mb-4"

placeholder="Username"

value={username}

onChange={(e)=>
setUsername(e.target.value.trim())
}

/>



<div className="relative mb-2">

<input
type={showPassword ? "text" : "password"}
className="w-full border-2 border-slate-300 rounded-xl p-3 pr-12"
placeholder="Password"
value={password}
onChange={(e)=>setPassword(e.target.value)}
/>

<button
type="button"
className="absolute right-3 top-3 text-slate-500"
onClick={() => setShowPassword(!showPassword)}
>
{showPassword ? "🙈" : "👁"}
</button>

</div>




<div className="flex items-center mb-6">


<input

type="checkbox"

checked={remember}

onChange={(e)=>
setRemember(e.target.checked)
}

/>


<span className="ml-2 text-slate-700">

Remember Me

</span>


</div>




<button

type="submit"

className="w-full bg-indigo-700 hover:bg-indigo-800 text-white py-3 rounded-xl font-bold"

>

Login

</button>



</form>


</div>


</div>

);


}