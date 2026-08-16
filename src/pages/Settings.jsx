import { supabase } from "../services/supabase";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import Administration from "../components/settings/Administration";

import {
  validatePassword,
  getPasswordStrength,
} from "../utils/passwordValidation";

import {
  getCompanySettings,
  saveCompanySettings,
  uploadCompanyFile,
} from "../services/companySettingsService";

import {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
} from "../services/usersService";


export default function Settings() {


  const [form, setForm] = useState({

    company_name: "",
    address: "",
    mobile: "",
    email: "",
    gstin: "",
    website: "",
    logo_url: "",
    signature_url: "",

  });



  const [loading, setLoading] =
    useState(false);

const [logoUploading, setLogoUploading] =
  useState(false);

const [activeTab, setActiveTab] =
  useState("account");

  const [passwordForm, setPasswordForm] =
  useState({

    currentPassword: "",

    newPassword: "",

    confirmPassword: "",

  });

const [changingPassword, setChangingPassword] =
  useState(false);

const [showCurrentPassword, setShowCurrentPassword] = useState(false);
const [showNewPassword, setShowNewPassword] = useState(false);
const [showConfirmPassword, setShowConfirmPassword] = useState(false);

const [signatureUploading, setSignatureUploading] =
  useState(false);


  const [currentUser, setCurrentUser] =
    useState(null);

  useEffect(() => {

    const savedUser =
      localStorage.getItem("erp_user") ||
      sessionStorage.getItem("erp_user");

    if (savedUser) {

      setCurrentUser(
        JSON.parse(savedUser)
      );

    }

  }, []);


  useEffect(()=>{

    loadSettings();

  },[]);



  async function loadSettings(){

    try{

      const data =
        await getCompanySettings();


      if(data){

        setForm(data);

      }


    }
    catch(error){

      console.log(error);

    }

  }





  function handleChange(e){

    setForm({

      ...form,

      [e.target.name]:
        e.target.value

    });

  }


async function handleLogoUpload(e){

  const file =
    e.target.files[0];


  if(!file)
    return;


  try{

    setLogoUploading(true);


    const url =
      await uploadCompanyFile(
        file,
        "logo"
      );


    setForm({

      ...form,

      logo_url:url

    });


  }
  catch(error){

    console.log(error);

    alert(error.message);

  }
  finally{

    setLogoUploading(false);

  }

}


async function handleChangePassword() {

  const validation =
    validatePassword(passwordForm.newPassword);

  if (!validation.valid) {

    alert(
      validation.errors.join("\n")
    );

    return;

  }


  if (
    passwordForm.newPassword !==
    passwordForm.confirmPassword
  ) {

    alert(
      "Passwords do not match."
    );

    return;

  }


  const { error: loginError } =
    await supabase.auth.signInWithPassword({

      email: currentUser.email,

      password:
        passwordForm.currentPassword,

    });


  if(loginError){

    alert(
      "Current password is incorrect."
    );

    return;

  }


  try {

    setChangingPassword(true);


    const { error } =
      await supabase.auth.updateUser({

        password:
          passwordForm.newPassword,

      });


    if(error){

      throw error;

    }


    setPasswordForm({

      currentPassword: "",
      newPassword: "",
      confirmPassword: "",

    });


    alert(
      "Password changed successfully."
    );


  }

  catch(error){

    console.log(error);

    alert(error.message);

  }

  finally {

    setChangingPassword(false);

  }

}


async function handleSignatureUpload(e){

  const file =
    e.target.files[0];


  if(!file)
    return;


  try{

    setSignatureUploading(true);


    const url =
      await uploadCompanyFile(
        file,
        "signature"
      );


    setForm({

      ...form,

      signature_url:url

    });


  }
  catch(error){

    console.log(error);

    alert(error.message);

  }
  finally{

    setSignatureUploading(false);

  }

}


  async function handleSave(){


    try{

      setLoading(true);


      await saveCompanySettings(form);


      alert("Company Settings Saved");


    }
    catch(error){

      console.log(error);

      alert(error.message);

    }
    finally{

      setLoading(false);

    }


  }





  const inputClass =
    "border-2 border-slate-400 text-slate-900 placeholder:text-slate-500 rounded-xl p-3 outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-200 transition";



const passwordStrength =
  getPasswordStrength(passwordForm.newPassword);

  return (

    <div className="p-6 bg-slate-100 min-h-screen">


      <div className="bg-white rounded-2xl shadow-xl border border-slate-300 p-6">


        <div className="mb-8">

  <div className="flex justify-between items-start">

    <div>

      <h1 className="text-3xl font-extrabold text-slate-900">
        ⚙️ Settings
      </h1>

      

    </div>


  </div>

</div>

<div className="flex gap-3 flex-wrap mb-8">



<button
onClick={()=>setActiveTab("account")}
className={`px-5 py-3 rounded-xl font-semibold transition ${
activeTab==="account"
? "bg-indigo-600 text-white"
: "bg-white border border-slate-300 hover:bg-slate-100"
}`}
>
🔐 Account
</button>

{
currentUser?.role === "Admin" && (

<button
onClick={()=>setActiveTab("admin")}
className={`px-5 py-3 rounded-xl font-semibold transition ${
activeTab==="admin"
? "bg-indigo-600 text-white"
: "bg-white border border-slate-300 hover:bg-slate-100"
}`}
>
🛡️ Administration
</button>

)
}

<button
onClick={()=>setActiveTab("about")}
className={`px-5 py-3 rounded-xl font-semibold transition ${
activeTab==="about"
? "bg-indigo-600 text-white"
: "bg-white border border-slate-300 hover:bg-slate-100"
}`}
>
ℹ️ About
</button>

</div>



{activeTab==="account" && (

<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

<div className="border rounded-xl p-5 bg-slate-50 h-full">
  <h3 className="text-xl font-bold mb-6">
    👤 Account Details
  </h3>

    <div className="grid grid-cols-2 gap-x-6 gap-y-5">

    <div>
      <label className="text-sm text-slate-500">Full Name</label>
      <div className="font-semibold mt-1">
        {currentUser?.full_name}
      </div>
    </div>

    <div>
      <label className="text-sm text-slate-500">Username</label>
      <div className="font-semibold mt-1">
        {currentUser?.username}
      </div>
    </div>

    <div>
      <label className="text-sm text-slate-500">Email</label>
      <div className="font-semibold mt-1 break-all">
        {currentUser?.email}
      </div>
    </div>

    <div>
      <label className="text-sm text-slate-500">Role</label>
      <div className="font-semibold mt-1">
        {currentUser?.role}
      </div>
    </div>

  </div>
</div>

    {/* Right Side - Change Password */}

    <div className="border rounded-xl p-5 bg-slate-50">

  <h3 className="text-xl font-bold mb-6">
    🔑 Change Password
  </h3>

      <div className="relative mb-4">

  <input
    type={showCurrentPassword ? "text" : "password"}
    placeholder="Current Password"
    value={passwordForm.currentPassword}
    onChange={(e) =>
      setPasswordForm({
        ...passwordForm,
        currentPassword: e.target.value,
      })
    }
    className="w-full border rounded-lg p-3 pr-12"
  />

  <button
    type="button"
    onClick={() =>
      setShowCurrentPassword(!showCurrentPassword)
    }
    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-indigo-600 transition"
  >
    {showCurrentPassword ? (
  <EyeOff size={20} />
) : (
  <Eye size={20} />
)}
  </button>

</div>

     <div className="relative mb-4">

<input
type={showNewPassword ? "text" : "password"}
placeholder="New Password"
value={passwordForm.newPassword}
onChange={(e)=>
setPasswordForm({
...passwordForm,
newPassword:e.target.value
})
}
className="w-full border rounded-lg p-3 pr-12"
/>

<p className={`text-sm mb-4 ${passwordStrength.color}`}>
  Password Strength: {passwordStrength.label}
</p>

<button
type="button"
onClick={() =>
setShowNewPassword(!showNewPassword)
}
className="absolute right-3 top-3 text-slate-500 hover:text-slate-700"
>
{showNewPassword ? (
  <EyeOff size={20} />
) : (
  <Eye size={20} />
)}
</button>

</div>

      <div className="relative mb-4">

<input
type={showConfirmPassword ? "text" : "password"}
placeholder="Confirm Password"
value={passwordForm.confirmPassword}
onChange={(e)=>
setPasswordForm({
...passwordForm,
confirmPassword:e.target.value
})
}
className="w-full border rounded-lg p-3 pr-12"
/>

<button
type="button"
onClick={() =>
setShowConfirmPassword(!showConfirmPassword)
}
className="absolute right-3 top-3 text-slate-500 hover:text-slate-700"
>
{showConfirmPassword ? (
  <EyeOff size={20} />
) : (
  <Eye size={20} />
)}
</button>

</div>

      <button
        onClick={handleChangePassword}
        disabled={changingPassword}
        className="w-full mt-6 bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-semibold"
      >
        {changingPassword
          ? "Changing Password..."
          : "Change Password"}
      </button>

    </div>

  </div>



)}



{
activeTab==="admin" &&
currentUser?.role === "Admin" && (

<Administration />

)
}

{activeTab==="about" && (

<div>

<h2 className="text-2xl font-bold mb-4">
ℹ️ About
</h2>

<div className="bg-slate-50 border border-slate-300 rounded-xl p-6 space-y-2">

<p><strong>Application:</strong> Shiv Shakti Solar ERP</p>

<p><strong>Version:</strong> 1.0.0</p>

<p><strong>Developed By:</strong> Prashun Dixit</p>

<p><strong>© 2026 Shiv Shakti Solar Energy</strong></p>

</div>

</div>

)}

      </div>


    </div>

  );

}