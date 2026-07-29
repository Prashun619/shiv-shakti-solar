import { useState } from "react";
import { supabase } from "../services/supabase";
import { useNavigate } from "react-router-dom";


export default function Login({setCurrentUser}) {


  const [username,setUsername] =
    useState("");

  const [password,setPassword] =
    useState("");

  const [remember,setRemember] =
    useState(false);


  const navigate = useNavigate();



  async function handleLogin(e){

    e.preventDefault();


    try{


      // Find user

      const {
  data:user,
  error:userError
} =
await supabase
.from("users")
.select(`
  id,
  full_name,
  username,
  email,
  role,
  active,
  customers,
  projects,
  inventory,
  used_inventory,
  payments,
  reports,
  quotations,
  settings
`)
.eq(
  "username",
  username.trim()
)
.single();


      if(userError || !user){

        alert(
          "Username not found"
        );

        return;

      }



      if(!user.active){

        alert(
          "User account is inactive"
        );

        return;

      }



      // Auth login

      const { data, error } =
await supabase.auth.signInWithPassword({
  email: user.email,
  password,
});





      if(error){

        alert(
          error.message
        );

        return;

      }



      // Store user details

      const userSession = {

        id:user.id,

        full_name:
          user.full_name,

        username:
          user.username,

          email:user.email,

        role:
          user.role,


        customers:
          user.customers,

        projects:
          user.projects,

        inventory:
          user.inventory,

        used_inventory:
          user.used_inventory,

        payments:
          user.payments,

        reports:
          user.reports,

        quotations:
          user.quotations,

        settings:
          user.settings,

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



<input

type="password"

className="w-full border-2 border-slate-300 rounded-xl p-3 mb-4"

placeholder="Password"

value={password}

onChange={(e)=>
setPassword(e.target.value)
}

/>




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