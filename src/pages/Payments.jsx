import { useEffect, useState } from "react";
import { supabase } from "../services/supabase";

export default function Payments() {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState("");

  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [projects, setProjects] = useState([]);

  const [selectedProject, setSelectedProject] = useState(null);

const [paymentAmount, setPaymentAmount] = useState("");
const [paymentMode, setPaymentMode] = useState("Cash");
const paymentType = "Credit";

  /* LOAD CUSTOMERS */
  useEffect(() => {
    loadCustomers();
  }, []);

  async function loadCustomers() {
    const { data } = await supabase.from("customers").select("*");
    setCustomers(data || []);
  }

  /* SEARCH FILTER (NO UI LIST) */
  const filteredCustomers = customers.filter((c) =>
    c.customer_name.toLowerCase().includes(search.toLowerCase())
  );

  /* ENTER KEY AUTO SELECT */
  function handleSearchKeyDown(e) {
    if (e.key === "Enter" && filteredCustomers.length > 0) {
      selectCustomer(filteredCustomers[0]);
    }
  }

  /* SELECT CUSTOMER */
  async function selectCustomer(customer) {
    setSelectedCustomer(customer);
    setSearch(customer.customer_name);

    const { data } = await supabase
      .from("projects")
      .select("*")
      .eq("customer_id", customer.id)
      .order("created_at", { ascending: false });

    setProjects(data || []);
  }

 


  /* ADD PAYMENT */
async function addPayment(){

  if(!selectedProject || !paymentAmount){
    alert("Enter payment amount");
    return;
  }


  const amount = Number(paymentAmount);


 // 1. Insert payment history
const { data: paymentData, error: paymentError } = await supabase
  .from("payments")
  .insert({

    project_id: selectedProject.id,

    payment_date: new Date().toISOString(),

    payment_type: paymentType,

    payment_mode: paymentMode,

    amount: amount,

    remarks: "Payment received from customer"

  })
  .select()
  .single();


if(paymentError){

  console.log(paymentError);

  alert(paymentError.message);

  return;

}


console.log("Payment created:", paymentData);

  // 2. Update project received amount

  const oldReceived =
    Number(selectedProject.received || 0);


  const total =
    Number(selectedProject.total_amount || 0);


  const newReceived =
    oldReceived + amount;


  const remaining =
    Math.max(
      total - newReceived,
      0
    );


  const status =
    remaining === 0 && total > 0
    ?
    "Completed"
    :
    "Pending";



  const {data,error} = await supabase
    .from("projects")
    .update({

      received: newReceived,

      remaining: remaining,

      status: status

    })
    .eq(
      "id",
      selectedProject.id
    )
    .select()
    .single();



  if(error){

    console.log(error);
    alert(error.message);
    return;

  }



  // update screen
  setProjects(
  projects.map((p)=>
    p.id === data.id
    ? data
    : p
  )
);


  setSelectedProject(null);

  setPaymentAmount("");

  alert("Payment added successfully");

window.location.reload();

}

  return (
    <div className="p-4 space-y-6">

      {/* SEARCH ONLY */}
      <input
        className="border p-2 w-full"
        placeholder="Search customer..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        onKeyDown={handleSearchKeyDown}
      />

    {selectedProject && (

<div className="border rounded-xl p-4 bg-gray-50 space-y-3">

<h3 className="font-bold">
Add Payment - {selectedProject.project_no}
</h3>


<input
className="border p-2 w-full"
placeholder="Amount"
type="number"
value={paymentAmount}
onChange={(e)=>setPaymentAmount(e.target.value)}
/>


<select
className="border p-2 w-full"
value={paymentMode}
onChange={(e)=>setPaymentMode(e.target.value)}
>

<option>Cash</option>
<option>Bank</option>
<option>UPI</option>
<option>Cheque</option>

</select>



<button
onClick={addPayment}
className="bg-blue-600 text-white px-4 py-2 rounded"
>
Save Payment
</button>


<button
onClick={()=>setSelectedProject(null)}
className="border px-4 py-2 rounded ml-2"
>
Cancel
</button>


</div>

)}

      {/* PROJECT LIST */}
      <div className="border p-3">
        <h2 className="font-bold mb-2">Projects</h2>

        {projects.length === 0 ? (
          <p className="text-gray-500">No projects found</p>
        ) : (
          projects.map((p) => {
            

            return (
              <div
                key={p.id}
                className="flex justify-between items-center border-b py-2"
              >
                {/* ONE LINE PROJECT INFO */}
                
                <div className="text-sm">
  <b>{p.project_no}</b> | {p.project_name} | ₹{p.total_amount} |
  Size: {p.project_size}
</div>

                {/* ACTIONS */}
               
               <div className="flex gap-2">

<button
onClick={()=>setSelectedProject(p)}
className="bg-green-600 text-white px-2 rounded"
>
Add Payment
</button>

</div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}