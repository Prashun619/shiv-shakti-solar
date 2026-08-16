import KpiCard from "../components/ui/KpiCard";
import { useEffect, useState } from "react";



import {
  getBilling,
  addBilling,
  deleteBilling,
  updateBilling,
} from "../services/billingService";


export default function FinanceLedger() {


  const [billing,setBilling] = useState([]);
  const [loading,setLoading] = useState(true);
const [search,setSearch] = useState("");


  const [showForm,setShowForm] = useState(false);


  const [editId,setEditId] = useState(null);


  const [closingBalance,setClosingBalance] = useState(0);



 const [form,setForm] = useState({

    date:"",
    type:"Expense",
    company:"",
    paid_by:"",
    payment_mode:"Cash",
    amount:"",
    remarks:""

});



  useEffect(()=>{

    loadBilling();

  },[]);



  async function loadBilling(){

try{

setLoading(true);


const data = await getBilling();


setBilling(data || []);


calculateClosing(data || []);


}
catch(error){

console.log(error);

}
finally{

setLoading(false);

}

}



 function calculateClosing(data){

let balance = 0;


data.forEach(item=>{


if(item.type === "Income"){

balance += Number(item.amount || 0);

}
else{

balance -= Number(item.amount || 0);

}


});


setClosingBalance(balance);

}



const totalExpense = billing.reduce(
(sum,item)=>

item.type === "Expense"

?

sum + Number(item.amount || 0)

:

sum,

0
);


const totalIncome = billing.reduce(
(sum,item)=>

item.type === "Income"

?

sum + Number(item.amount || 0)

:

sum,

0
);


const currentBalance = totalIncome - totalExpense;

 // Search
const searchText = search.toLowerCase();

const filteredBilling = billing.filter((item) => {

  return (
    item.company?.toLowerCase().includes(searchText) ||
    item.paid_by?.toLowerCase().includes(searchText) ||
    item.remarks?.toLowerCase().includes(searchText)
  );

});

// Calculate running balance from oldest → newest
const ascendingBilling = [...filteredBilling].sort((a, b) => {

  if (a.date === b.date) {
    return a.id - b.id;
  }

  return new Date(a.date) - new Date(b.date);

});

let balance = 0;

const billingWithBalance = ascendingBilling.map((item) => {

  if (item.type === "Income") {
    balance += Number(item.amount || 0);
  } else {
    balance -= Number(item.amount || 0);
  }

  return {
    ...item,
    runningBalance: balance,
  };

});

// Display newest first
billingWithBalance.reverse();

function resetForm(){

  setForm({

    date:"",
    type:"Expense",
    company:"",
    paid_by:"",
    payment_mode:"Cash",
    amount:"",
    remarks:""

  });

  setEditId(null);

}
  
return (

<div className="p-4 bg-gray-100 min-h-screen">


{/* HEADER */}

<div className="mb-6 rounded-2xl 
bg-gradient-to-r from-emerald-700 via-indigo-600 to-teal-500 
p-5 shadow-xl">


<div className="flex items-center justify-between">


<div>

<h1 className="text-3xl font-bold text-white">

Finance Ledger

</h1>


<p className="text-green-100 mt-1">

Manage company expenses and cash flow

</p>


</div>



<button

onClick={()=>{

resetForm();

setShowForm(true);

}}

className="
bg-white 
text-emerald-700
px-4
py-2
rounded-lg
font-semibold
shadow
hover:bg-gray-100
"

>

+ Add Transaction

</button>


</div>


</div>





{/* KPI CARDS */}


<div className="grid grid-cols-3 gap-4 mb-6">



<KpiCard

title="Closing Balance"

value={`₹ ${closingBalance.toLocaleString("en-IN")}`}

color={
closingBalance >= 0
?
"green"
:
"red"
}

/>



<KpiCard

title="Total Transactions"

value={billing.length}

color="blue"

/>



<KpiCard

title="Total Expenses"

value={`₹ ${totalExpense.toLocaleString("en-IN")}`}

color="red"

/>



</div>




{/* TRANSACTION FORM */}


{showForm && (

<div className="
bg-white
rounded-xl
shadow
border
p-6
mb-6
">


<h2 className="text-xl font-bold mb-5">

{editId ? "Edit Transaction" : "Add Transaction"}

</h2>




<div className="grid grid-cols-3 gap-4">

<select

className="border border-black p-3 rounded"

value={form.type}

onChange={(e)=>

setForm({

...form,

type:e.target.value

})

}

>

<option value="Expense">
Expense
</option>

<option value="Income">
Income
</option>

</select>

<input
type="date"
className="border border-black p-3 rounded"
value={form.date}
onChange={(e)=>
setForm({
...form,
date:e.target.value
})
}
/>

<input

className="border border-black p-3 rounded"

placeholder="Company"

value={form.company}

onChange={(e)=>

setForm({

...form,

company:e.target.value

})

}

/>





<input

className="border border-black p-3 rounded"

placeholder="Paid By"

value={form.paid_by}

onChange={(e)=>

setForm({

...form,

paid_by:e.target.value

})

}

/>





<select

className="border border-black p-3 rounded"

value={form.payment_mode}

onChange={(e)=>

setForm({

...form,

payment_mode:e.target.value

})

}

>


<option>Cash</option>

<option>UPI</option>

<option>Bank</option>

<option>Cheque</option>


</select>





<input

type="number"

className="border border-black p-3 rounded"

placeholder="Amount"

value={form.amount}

onChange={(e)=>

setForm({

...form,

amount:e.target.value

})

}

/>





<input

className="border border-black p-3 rounded"

placeholder="Remarks"

value={form.remarks}

onChange={(e)=>

setForm({

...form,

remarks:e.target.value

})

}

/>


</div>





<div className="flex gap-3 mt-5">


<button

className="
bg-green-600
text-white
px-6
py-3
rounded-lg
"


onClick={async()=>{

// Check date
if(!form.date){

alert("Please select a transaction date.");

return;

}

console.log("FORM DATA:", form);

const billingData = {
  date: form.date,
  type: form.type,
  company: form.company,
  paid_by: form.paid_by,
  payment_mode: form.payment_mode,
  amount: form.amount,
  remarks: form.remarks,
};

if (editId) {

  await updateBilling(editId, billingData);

} else {

  await addBilling(billingData);

}

setShowForm(false);

resetForm();

loadBilling();

}}


>


Save Transaction

</button>





<button

className="
bg-gray-500
text-white
px-6
py-3
rounded-lg
"


onClick={()=>{


setShowForm(false);

resetForm();


}}

>


Cancel

</button>



</div>


</div>


)}

{/* SEARCH AND EXPORT */}

<div className="
flex 
justify-between 
items-center 
mb-3
">


<div className="flex gap-3">


<input

type="text"

placeholder="🔍 Search transaction"

value={search}

onChange={(e)=>setSearch(e.target.value)}

className="
border
border-black
rounded-lg
px-3
py-2
w-64
"

/>





</div>


</div>

{/* TRANSACTION TABLE */}


<div className="
bg-white
rounded-xl
shadow
border
overflow-hidden
mt-6
">


<div className="
bg-gradient-to-r
from-slate-800
to-emerald-600
text-white
px-4
py-2
">


<h2 className="text-sm font-semibold">

Transaction Records

</h2>


</div>





<div className="overflow-x-auto">


<table className="
w-full
border
border-black
border-collapse
">


<thead className="
bg-gradient-to-r
from-indigo-600
to-emerald-500
text-white
">


<tr>


<th className="
px-3
py-2
text-center
text-sm
font-semibold
border
border-black
">

Date

</th>

<th className="
px-3
py-2
text-center
text-sm
font-semibold
border
border-black
">
Type
</th>


<th className="
px-3
py-2
text-center
text-sm
font-semibold
border
border-black
">

Company

</th>



<th className="
px-3
py-2
text-center
text-sm
font-semibold
border
border-black
">

Paid By

</th>



<th className="
px-3
py-2
text-center
text-sm
font-semibold
border
border-black
">

Mode

</th>





<th className="
px-3
py-2
text-center
text-sm
font-semibold
border
border-black
">
Payment Type
</th>



<th
className="
px-3
py-2
text-center
text-sm
font-semibold
border
border-black
">
Running Balance
</th>

<th className="
px-3
py-2
text-center
text-sm
font-semibold
border
border-black
">

Remarks

</th>



<th className="
px-3
py-2
text-center
text-sm
font-semibold
border
border-black
">

Action

</th>


</tr>


</thead>





<tbody>


{

loading ? (

<tr>

<td
colSpan="10"
className="
text-center
py-6
font-semibold
"
>

Loading transactions...

</td>

</tr>


)

:

filteredBilling.length === 0 ? (


<tr>

<td

colSpan="7"

className="
text-center
py-6
text-gray-500
font-semibold
"

>

No transactions found

</td>

</tr>


)

:

billingWithBalance.map((item)=>(


<tr

key={item.id}

className="
hover:bg-green-50
"


>



<td className="
px-3
py-2
text-sm
text-center
border
border-black
">


{
new Date(item.date)

.toLocaleDateString(
"en-GB",
{
day:"numeric",
month:"short",
year:"numeric"
}

)

.replaceAll(" ","-")
}



</td>

<td className="
px-3
py-2
text-sm
text-center
border
border-black
">

{item.type || "Expense"}

</td>

<td className="
px-3
py-2
text-sm
text-center
border
border-black
">


{item.company}


</td>






<td className="
px-3
py-2
text-sm
text-center
border
border-black
">


{item.paid_by}


</td>





<td className="
px-3
py-2
text-sm
text-center
border
border-black
">


{item.payment_mode}


</td>

<td className="
px-3
py-2
text-sm
font-semibold
text-red-600
text-center
border
border-black
">

<td
  className={`px-3 py-2 text-sm font-semibold ${
    item.type === "Income"
      ? "text-green-600"
      : "text-red-600"
  }`}
>
  ₹ {Number(item.amount || 0).toLocaleString("en-IN")}
</td>

</td>



<td
className={`
px-3
py-2
text-sm
font-semibold
text-center
border
border-black
${item.runningBalance >= 0 ? "text-green-700" : "text-red-600"}
`}
>
₹ {item.runningBalance.toLocaleString("en-IN")}
</td>

<td className="
px-3
py-2
text-sm
text-center
border
border-black
">


{item.remarks || "-"}


</td>






<td className="
px-3
py-2
text-sm
text-center
border
border-black
">


{item.source_type !== "Investment" && (
  <button
    className="
    bg-blue-600
    text-white
    px-3
    py-1
    rounded
    mr-2
    "
    onClick={() => {

      setForm({
        ...item,
        date: item.date
          ? item.date.substring(0, 10)
          : "",
      });

      setEditId(item.id);

      setShowForm(true);

    }}
  >
    Edit
  </button>
)}





{item.source_type !== "Investment" && (
  <button
    className="
    bg-red-600
    text-white
    px-3
    py-1
    rounded
    "
    onClick={async () => {

      if (
        window.confirm(
          "Are you sure you want to delete this transaction?"
        )
      ) {

        await deleteBilling(item.id);

        loadBilling();

      }

    }}
  >
    Delete
  </button>
)}


</td>



</tr>


))


}


</tbody>



</table>


</div>

</div>



</div>

);
}