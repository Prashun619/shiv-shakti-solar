import { supabase } from "../../services/supabase";
import { useEffect, useState } from "react";

import {
  validatePassword,
  getPasswordStrength,
} from "../../utils/passwordValidation";

import {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  resetUserPassword,
} from "../../services/usersService";

export default function Administration() {

  const [users, setUsers] = useState([]);

  const [showUserModal, setShowUserModal] = useState(false);
  const [showResetModal, setShowResetModal] =
  useState(false);


const [selectedUser, setSelectedUser] =
  useState(null);


const [resetPassword, setResetPassword] =
  useState("");

  const [showResetPassword, setShowResetPassword] =
  useState(false);

const [resetPasswordStrength, setResetPasswordStrength] =
  useState({
    label:"",
    color:""
  });

  const [showPassword, setShowPassword] =
  useState(false);

const [passwordStrength, setPasswordStrength] =
  useState({
    label:"",
    color:""
  });

  const [editingUser, setEditingUser] = useState(null);

const [newUser, setNewUser] = useState({
  full_name: "",
  username: "",
  password: "",
  role: "User",
  active: true,

  customers: false,
  projects: false,
  inventory: false,
  used_inventory: false,
  payments: false,
  reports: false,
  quotations: false,
  settings: false,
  billing: false,
  investments: false,
  invoices: false,
});

  useEffect(() => {

  loadUsers();

}, []);

  async function loadUsers() {

  try {

    const data = await getUsers();

    setUsers(data);

  }
  catch (error) {

    console.log(error);

  }

}

function handleEditUser(user) {

  setEditingUser(user);

  setNewUser({

  full_name: user.full_name,
  username: user.username,

  password: "",

  role: user.role,
  active: user.active,

  customers: user.customers,
  projects: user.projects,
  inventory: user.inventory,
  used_inventory: user.used_inventory,
  payments: user.payments,
  reports: user.reports,
  quotations: user.quotations,
  settings: user.settings,
  billing: user.billing,
  investments: user.investments,
  invoices: user.invoices,

});

  setShowUserModal(true);

}

async function handleCreateUser() {

  try {

    if (editingUser) {

      await updateUser(

        editingUser.id,

        {

          full_name: newUser.full_name,

          role: newUser.role,

          active: newUser.active,

          customers: newUser.customers,
          projects: newUser.projects,
          inventory: newUser.inventory,
          used_inventory: newUser.used_inventory,
          payments: newUser.payments,
          reports: newUser.reports,
          quotations: newUser.quotations,
          settings: newUser.settings,

        }

      );

    }

    else {


      const validation =
        validatePassword(newUser.password);


      if(!validation.valid){

        alert(
          validation.errors.join("\n")
        );

        return;

      }


      await createUser(newUser);

    }


    await loadUsers();


    setShowUserModal(false);

    setEditingUser(null);


    setNewUser({

      full_name: "",
      username: "",
      password: "",
      role: "User",
      active: true,

      customers: false,
      projects: false,
      inventory: false,
      used_inventory: false,
      payments: false,
      reports: false,
      quotations: false,
      settings: false,

    });


    alert(

      editingUser

      ? "User updated successfully."

      : "User created successfully."

    );


  }

  catch (error) {

  console.error("CREATE USER ERROR:", error);

  alert(
    typeof error?.message === "string"
      ? error.message
      : JSON.stringify(error)
  );

}

}

function openResetPassword(user){

  console.log("Reset clicked:", user);

  setSelectedUser(user);

  setResetPassword("");

  setShowResetModal(true);

}

async function handleResetPassword() {

  try {

    if(!resetPassword){

      alert("Please enter new password.");

      return;

    }

const validation =
validatePassword(resetPassword);

if(!validation.valid){

alert(
validation.errors.join("\n")
);

return;

}


    await resetUserPassword(

      selectedUser.id,

      resetPassword

    );


    setShowResetModal(false);

    setSelectedUser(null);

    setResetPassword("");


    alert(
      "Password reset successfully."
    );


  }

  catch(error){

    console.log(error);

    alert(error.message);

  }

}

async function handleDeleteUser(user) {

  const confirmed = window.confirm(

    `Delete ${user.full_name}?`

  );

  if (!confirmed) return;

  try {

    await deleteUser(user.id);

    await loadUsers();

    alert("User deleted successfully.");

  }

  catch (error) {

    console.log(error);

    alert(error.message);

  }

}

  return (

    <div>

      <div className="flex justify-between items-center mb-6">

        <h2 className="text-2xl font-bold text-slate-800">
          User Management
        </h2>

       <button
  onClick={() => setShowUserModal(true)}
  className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-xl font-semibold"
>
  + Create User
</button>

      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-300">

        <table className="w-full">

          <thead className="bg-slate-800 text-white">

            <tr>

              <th className="p-3 text-left">Name</th>

              <th className="p-3 text-left">Username</th>

              <th className="p-3 text-center">Role</th>

              <th className="p-3 text-center">Status</th>

              <th className="p-3 text-center">Action</th>

            </tr>

          </thead>

          <tbody>

{users.length === 0 ? (

<tr>

<td
colSpan={5}
className="text-center py-10 text-slate-500"
>

No Users Found

</td>

</tr>

) : (

users.map((user) => (

<tr
key={user.id}
className="border-t"
>

<td className="p-3">
{user.full_name}
</td>

<td className="p-3">
{user.username}
</td>

<td className="p-3 text-center">

<span className={`px-3 py-1 rounded-full text-sm font-semibold ${
user.role === "Admin"
? "bg-red-100 text-red-700"
: "bg-blue-100 text-blue-700"
}`}>

{user.role}

</span>

</td>

<td className="p-3 text-center">

<span className={`px-3 py-1 rounded-full text-sm font-semibold ${
user.active
? "bg-green-100 text-green-700"
: "bg-slate-200 text-slate-700"
}`}>

{user.active ? "Active" : "Inactive"}

</span>

</td>

<td className="p-3 text-center space-x-3">

<button
onClick={() => handleEditUser(user)}
className="text-indigo-600 font-semibold"
>
Edit
</button>


<button
onClick={() => openResetPassword(user)}
className="text-orange-600 font-semibold"
>
Reset Password
</button>


<button
onClick={() => handleDeleteUser(user)}
className="text-red-600 font-semibold"
>
Delete
</button>

</td>

</tr>

))

)}

</tbody>

        </table>

      </div>

{showUserModal && (

<div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">

  <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-lg">

    <h2 className="text-2xl font-bold mb-5">
  {editingUser ? "Edit User" : "Create User"}
</h2>

    <div className="space-y-4">

      <input
        placeholder="Full Name"
        value={newUser.full_name}
        onChange={(e)=>
          setNewUser({
            ...newUser,
            full_name:e.target.value
          })
        }
        className="w-full border rounded-lg p-3"
      />

      <input
  placeholder="Username"
  value={newUser.username}
  disabled={editingUser !== null}
  onChange={(e)=>
    setNewUser({
      ...newUser,
      username:e.target.value
    })
  }
  className="w-full border rounded-lg p-3"
/>

{
!editingUser && (

<div>

<div className="relative">

<input
  type={showPassword ? "text" : "password"}
  placeholder="Password"
  value={newUser.password}
  onChange={(e)=>{

    const value = e.target.value;

    setNewUser({
      ...newUser,
      password:value
    });

    setPasswordStrength(
      getPasswordStrength(value)
    );

  }}
  className="w-full border rounded-lg p-3 pr-12"
/>


<button
type="button"
onClick={() =>
setShowPassword(!showPassword)
}
className="absolute right-3 top-3 text-slate-500"
>
{showPassword ? "🙈" : "👁"}
</button>

</div>


<p className={`text-sm mt-2 ${passwordStrength.color}`}>
Password Strength: {passwordStrength.label}
</p>


</div>

)
}
     
<select
  value={newUser.role}
  onChange={(e)=>{

    const role = e.target.value;

    setNewUser({

      ...newUser,

      role,

      customers: role === "Admin" ? true : newUser.customers,
      projects: role === "Admin" ? true : newUser.projects,
      inventory: role === "Admin" ? true : newUser.inventory,
      used_inventory: role === "Admin" ? true : newUser.used_inventory,
      payments: role === "Admin" ? true : newUser.payments,
      reports: role === "Admin" ? true : newUser.reports,
      quotations: role === "Admin" ? true : newUser.quotations,
      settings: role === "Admin" ? true : newUser.settings,
      billing: role === "Admin" ? true : newUser.billing,
       investments: role === "Admin" ? true : newUser.investments,
        invoices: role === "Admin" ? true : newUser.invoices,

    });

  }}
  className="w-full border rounded-lg p-3"
>
  <option>User</option>
  <option>Admin</option>
</select>

<div className="border rounded-xl p-4 bg-slate-50">

  <h3 className="font-bold text-slate-800 mb-3">
    Module Permissions
  </h3>

  <div className="grid grid-cols-2 gap-3">

    {
    [
  ["customers", "Customers"],
  ["projects", "Projects"],
  ["inventory", "Inventory"],
  ["used_inventory", "Used Inventory"],
  ["payments", "Payments"],
  ["reports", "Reports"],
  ["quotations", "Quotation"],
  ["billing", "Finance Ledger"],
  ["investments", "Investments"],
  ["invoices", "Invoices"],
  ["settings", "Settings"],
]
    .map(([key,label])=>(

      <label
        key={key}
        className="flex items-center gap-2 cursor-pointer"
      >

        <input
          type="checkbox"
          checked={newUser[key]}
          disabled={newUser.role==="Admin"}
          onChange={(e)=>
            setNewUser({
              ...newUser,
              [key]:e.target.checked
            })
          }
        />

        {label}

      </label>

    ))}

  </div>

</div>

    </div>

    <div className="flex justify-end gap-3 mt-6">

      <button
  onClick={() => {

    setShowUserModal(false);

    setEditingUser(null);

  }}
  className="px-5 py-2 rounded-lg border"
>
  Cancel
</button>

      <button
  onClick={handleCreateUser}
  className="bg-indigo-600 text-white px-5 py-2 rounded-lg"
>
  {editingUser ? "Update User" : "Save User"}
</button>

    </div>

  </div>

</div>

)}

{showResetModal && (

<div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">

  <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md">

    <h2 className="text-2xl font-bold mb-4">
      Reset Password
    </h2>


    <p className="text-slate-600 mb-4">
      User: 
      <span className="font-semibold">
        {" "}
        {selectedUser?.full_name}
      </span>
    </p>


  <div className="relative">

<input
  type={
    showResetPassword
    ? "text"
    : "password"
  }
  placeholder="Enter New Password"
  value={resetPassword}
  onChange={(e)=>{

    const value = e.target.value;

    setResetPassword(value);

    setResetPasswordStrength(
      getPasswordStrength(value)
    );

  }}
  className="w-full border rounded-lg p-3 pr-12"
/>


<button
type="button"
onClick={() =>
setShowResetPassword(!showResetPassword)
}
className="absolute right-3 top-3 text-slate-500"
>
{
showResetPassword
?
"🙈"
:
"👁"
}
</button>

</div>


<p className={`text-sm mt-2 ${resetPasswordStrength.color}`}>
Password Strength: {resetPasswordStrength.label}
</p>


    <div className="flex justify-end gap-3 mt-6">


      <button
        onClick={()=>{
          setShowResetModal(false);
          setSelectedUser(null);
          setResetPassword("");
        }}
        className="px-5 py-2 rounded-lg border"
      >
        Cancel
      </button>


      <button
        onClick={handleResetPassword}
        className="bg-orange-600 text-white px-5 py-2 rounded-lg"
      >
        Reset Password
      </button>


    </div>

  </div>

</div>

)}

    </div>

  );

}