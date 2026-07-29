import { supabase } from "../services/supabase";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Administration from "../components/settings/Administration";
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
const navigate = useNavigate();

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
  useState("company");

  const [passwordForm, setPasswordForm] =
  useState({

    currentPassword: "",

    newPassword: "",

    confirmPassword: "",

  });

const [changingPassword, setChangingPassword] =
  useState(false);

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

async function handleLogout(){

  try{

    await supabase.auth.signOut();

    localStorage.removeItem("erp_user");

    sessionStorage.removeItem("erp_user");

    navigate("/login");

  }

  catch(error){

    console.log(error);

    alert(error.message);

  }

}

async function handleChangePassword() {

    

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

  if (
    passwordForm.newPassword.length < 6
  ) {

    alert(
      "Password must be at least 6 characters."
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

    // Update stored user

    

  const storageUser =
  localStorage.getItem("erp_user")
    ? localStorage
    : sessionStorage;


storageUser.setItem(
  "erp_user",
  JSON.stringify(currentUser)
);

    setPasswordForm({

      currentPassword: "",

      newPassword: "",

      confirmPassword: "",

    });

    alert(
      "Password changed successfully."
    );

  }

  catch (error) {

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





  return (

    <div className="p-6 bg-slate-100 min-h-screen">


      <div className="bg-white rounded-2xl shadow-xl border border-slate-300 p-6">


        <div className="mb-8">

  <div className="flex justify-between items-start">

    <div>

      <h1 className="text-3xl font-extrabold text-slate-900">
        ⚙️ Settings
      </h1>

      <p className="text-slate-600 mt-2">
        Manage application preferences and company information
      </p>

    </div>

    <span className="px-4 py-2 rounded-full bg-indigo-100 text-indigo-700 font-semibold border border-indigo-200">
      🛡️ Administrator
    </span>

  </div>

</div>

<div className="flex gap-3 flex-wrap mb-8">

<button
onClick={()=>setActiveTab("company")}
className={`px-5 py-3 rounded-xl font-semibold transition ${
activeTab==="company"
? "bg-indigo-600 text-white"
: "bg-white border border-slate-300 hover:bg-slate-100"
}`}
>
🏢 Company Information
</button>

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

{activeTab==="company" && (
<>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">


          <input
            name="company_name"
            value={form.company_name}
            onChange={handleChange}
            placeholder="Company Name"
            className={inputClass}
          />



          <input
            name="mobile"
            value={form.mobile}
            onChange={handleChange}
            placeholder="Mobile Number"
            className={inputClass}
          />



          <input
            name="email"
            value={form.email}
            onChange={handleChange}
            placeholder="Email"
            className={inputClass}
          />



          <input
            name="gstin"
            value={form.gstin}
            onChange={handleChange}
            placeholder="GSTIN"
            className={inputClass}
          />



          <input
            name="website"
            value={form.website}
            onChange={handleChange}
            placeholder="Website"
            className={inputClass}
          />



          <div>

<label className="block font-semibold text-slate-800 mb-2">
  Company Logo
</label>

<input
  type="file"
  accept="image/*"
  onChange={handleLogoUpload}
  className={inputClass}
/>


{logoUploading && (
  <p className="text-sm text-indigo-600 mt-2">
    Uploading logo...
  </p>
)}


{form.logo_url && (
  <img
    src={form.logo_url}
    className="h-20 mt-3 border rounded-lg p-2"
  />
)}

</div>



          <div>

<label className="block font-semibold text-slate-800 mb-2">
  Signature
</label>

<input
  type="file"
  accept="image/*"
  onChange={handleSignatureUpload}
  className={inputClass}
/>


{signatureUploading && (
  <p className="text-sm text-indigo-600 mt-2">
    Uploading signature...
  </p>
)}


{form.signature_url && (
  <img
    src={form.signature_url}
    className="h-20 mt-3 border rounded-lg p-2"
  />
)}

</div>



        </div>




        <textarea

          name="address"

          value={form.address}

          onChange={handleChange}

          placeholder="Company Address"

          rows="4"

          className={`${inputClass} w-full mt-5`}

        />





        <button

          onClick={handleSave}

          disabled={loading}

          className="
          mt-6
          bg-indigo-700
          hover:bg-indigo-800
          text-white
          px-8
          py-3
          rounded-xl
          font-bold
          shadow-lg
          transition
          "

        >

          {loading ? "Saving..." : "Save Settings"}

        </button>

</>

)}

{activeTab==="account" && (

<div>

<h2 className="text-2xl font-bold mb-6">
🔐 Change Password
</h2>

<div className="max-w-lg bg-white border rounded-2xl p-6 shadow">

<input
type="password"
placeholder="Current Password"
value={passwordForm.currentPassword}
onChange={(e)=>
setPasswordForm({
...passwordForm,
currentPassword:e.target.value
})
}
className="w-full border rounded-lg p-3 mb-4"
/>

<input
type="password"
placeholder="New Password"
value={passwordForm.newPassword}
onChange={(e)=>
setPasswordForm({
...passwordForm,
newPassword:e.target.value
})
}
className="w-full border rounded-lg p-3 mb-4"
/>

<input
type="password"
placeholder="Confirm Password"
value={passwordForm.confirmPassword}
onChange={(e)=>
setPasswordForm({
...passwordForm,
confirmPassword:e.target.value
})
}
className="w-full border rounded-lg p-3"
/>

<button

onClick={handleChangePassword}

disabled={changingPassword}

className="mt-6 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-semibold"

>

{changingPassword

? "Changing Password..."

: "Change Password"}

</button>

</div>

{/* Logout Section */}

<div className="max-w-lg mt-6 bg-white border rounded-2xl p-6 shadow">


<h3 className="text-xl font-bold mb-3">
🚪 Logout
</h3>


<p className="text-slate-600 mb-4">
Sign out from this device.
</p>


<button

onClick={handleLogout}

className="
bg-red-600
hover:bg-red-700
text-white
px-6
py-3
rounded-xl
font-semibold
"

>

Logout

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