import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  getBilling,
  addBilling,
  deleteBilling,
  updateBilling
} from "../services/billingService";


import {
 exportBillingExcel,
 exportBillingPDF
} from "../services/billingExport";



export default function Billing(){



const navigate = useNavigate();



const [billing,setBilling]=useState([]);

const [showForm,setShowForm]=useState(false);

const [editId,setEditId]=useState(null);





const [form,setForm]=useState({


date:"",

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


const data = await getBilling();


setBilling(data || []);


}







async function saveBilling(){



if(editId){


await updateBilling(
editId,
form
);


}
else{


await addBilling(form);


}






setShowForm(false);

setEditId(null);




setForm({


date:"",

company:"",

paid_by:"",



payment_mode:"Cash",

amount:"",

remarks:""


});




loadBilling();



}









function edit(item){


setForm(item);

setEditId(item.id);

setShowForm(true);


}







async function remove(id){


await deleteBilling(id);


loadBilling();


}









function exportExcel(){


exportBillingExcel(
billing
);


}



function exportPDF(){


exportBillingPDF(
billing
);


}










return(


<div className="p-6 bg-gray-100 min-h-screen">







{/* HEADER */}



<div className="flex justify-between items-center mb-8">





<div>


<h1 className="text-3xl font-bold text-gray-800">

Billing

</h1>


<p className="text-gray-500 mt-1">

Manage company financial transactions

</p>


</div>







<div>



<button

onClick={()=>setShowForm(true)}

className="bg-blue-600 text-white px-4 py-2 rounded-lg mr-3"

>

+ Add Billing

</button>







<button

onClick={exportExcel}

className="bg-green-600 text-white px-4 py-2 rounded-lg mr-3"

>

Export Excel

</button>







<button

onClick={exportPDF}

className="bg-red-600 text-white px-4 py-2 rounded-lg mr-3"

>

Export PDF

</button>







<button

onClick={()=>navigate("/finance")}

className="bg-gray-700 text-white px-4 py-2 rounded-lg"

>

← Back

</button>





</div>





</div>









{/* SUMMARY */}



<div className="grid grid-cols-3 gap-6 mb-8">





<div className="bg-gradient-to-br from-blue-50 to-white border rounded-xl shadow p-5">


<p className="text-gray-500">

Total Entries

</p>


<h2 className="text-3xl font-bold text-blue-700">

{billing.length}

</h2>


</div>







<div className="bg-gradient-to-br from-green-50 to-white border rounded-xl shadow p-5">

<p className="text-gray-500">
Total Expenses
</p>

<h2 className="text-2xl font-bold text-red-600">
₹ {
billing
.reduce(
(sum, x) => sum + Number(x.amount || 0),
0
)
.toFixed(2)
}
</h2>


</div>

</div>


{/* FORM */}





{

showForm &&


<div className="bg-white rounded-xl shadow p-6 mb-8 border">


<h2 className="text-xl font-bold mb-5">

{editId ? "Edit Billing" : "Add Billing"}

</h2>






<div className="grid grid-cols-3 gap-4">



<input

type="date"

className="border p-3 rounded"

value={form.date}

onChange={e=>setForm({

...form,

date:e.target.value

})}

/>






<input

className="border p-3 rounded"

placeholder="Company"

value={form.company}

onChange={e=>setForm({

...form,

company:e.target.value

})}

/>






<input

className="border p-3 rounded"

placeholder="Paid By"

value={form.paid_by}

onChange={e=>setForm({

...form,

paid_by:e.target.value

})}

/>







<select
  className="border p-3 rounded bg-gray-100 cursor-not-allowed"
  value="Debit"
  disabled
>
  <option value="Debit">Expense</option>
</select>






<select

className="border p-3 rounded"

value={form.payment_mode}

onChange={e=>setForm({

...form,

payment_mode:e.target.value

})}

>


<option>Cash</option>

<option>UPI</option>

<option>Bank</option>

<option>Cheque</option>


</select>







<input

className="border p-3 rounded"

placeholder="Amount"

value={form.amount}

onChange={e=>setForm({

...form,

amount:e.target.value

})}

/>







<input

className="border p-3 rounded"

placeholder="Remarks"

value={form.remarks}

onChange={e=>setForm({

...form,

remarks:e.target.value

})}

/>




</div>







<button

onClick={saveBilling}

className="mt-5 bg-green-600 text-white px-6 py-3 rounded-lg"

>

Save Billing

</button>




</div>



}









{/* TABLE */}





<div className="bg-white rounded-xl shadow border overflow-hidden">



<div className="bg-green-600 text-white px-6 py-4">

<h2 className="text-lg font-semibold">

Billing Records

</h2>


</div>







<table className="w-full">



<thead className="bg-gray-100">


<tr>

<th className="p-4 text-left">Date</th>

<th className="p-4 text-left">Company</th>

<th className="p-4 text-left">Paid By</th>

<th className="p-4 text-left">Category</th>

<th className="p-4 text-left">Mode</th>

<th className="p-4 text-left">Amount</th>

<th className="p-4 text-left">Action</th>


</tr>


</thead>







<tbody>


{

billing.map(item=>(


<tr

key={item.id}

className="border-t hover:bg-green-50"

>


<td className="p-4">

{item.date}

</td>


<td className="p-4">

{item.company}

</td>


<td className="p-4">

{item.paid_by}

</td>

<td className="p-4">

{item.payment_mode}

</td>


<td className="p-4 font-semibold">

₹ {Number(item.amount).toFixed(2)}

</td>


<td className="p-4">


<button

onClick={()=>edit(item)}

className="bg-blue-600 text-white px-3 py-1 rounded mr-2"

>

Edit

</button>





<button

onClick={()=>remove(item.id)}

className="bg-red-600 text-white px-3 py-1 rounded"

>

Delete

</button>



</td>


</tr>


))


}



</tbody>



</table>







</div>






</div>


);


}