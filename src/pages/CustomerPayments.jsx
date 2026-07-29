import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../services/supabase";

import {
  exportCustomerPaymentsExcel,
  exportCustomerPaymentsPDF
} from "../services/customerPaymentsExport";


export default function CustomerPayments(){


const navigate = useNavigate();


const [payments,setPayments] = useState([]);

const [showHistory,setShowHistory] = useState(false);

const [history,setHistory] = useState([]);

const [selectedCustomer,setSelectedCustomer] = useState("");






useEffect(()=>{

loadPayments();

},[]);






async function loadPayments(){


const {

data,
error

}=await supabase

.from("projects")

.select(`

id,
project_no,
project_size,
total_amount,
received,
remaining,

customers(
customer_name
)

`);




if(error){

console.log(error);

return;

}


setPayments(data || []);


}








async function viewPaymentHistory(item){



setSelectedCustomer(
item.customers?.customer_name || "-"
);





const {

data,
error

}=await supabase

.from("payments")

.select(`

payment_date,
amount,
payment_type,
payment_mode

`)

.eq(
"project_id",
item.id
)

.order(
"payment_date",
{
ascending:false
}
);






if(error){

console.log(error);

return;

}



setHistory(data || []);

setShowHistory(true);


}









function exportExcel(){

exportCustomerPaymentsExcel(
payments
);

}



function exportPDF(){

exportCustomerPaymentsPDF(
payments
);

}









return(


<div className="p-6 bg-gray-100 min-h-screen">






{/* HEADER */}



<div className="flex justify-between items-center mb-8">


<div>


<h1 className="text-3xl font-bold text-gray-800">

Customer Payments

</h1>


<p className="text-gray-500">

Project payment tracking and customer outstanding

</p>


</div>







<div>


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





<div className="bg-gradient-to-br from-blue-50 to-white border border-blue-200 rounded-xl shadow p-5">


<p className="text-gray-500">

Total Projects

</p>


<h2 className="text-3xl font-bold text-blue-700">

{payments.length}

</h2>


</div>







<div className="bg-gradient-to-br from-green-50 to-white border border-green-200 rounded-xl shadow p-5">


<p className="text-gray-500">

Total Received

</p>


<h2 className="text-2xl font-bold text-green-600">


₹ {

payments.reduce(

(sum,item)=>

sum + Number(item.received || 0)

,0)

.toFixed(2)

}


</h2>


</div>







<div className="bg-gradient-to-br from-red-50 to-white border border-red-200 rounded-xl shadow p-5">


<p className="text-gray-500">

Total Remaining

</p>


<h2 className="text-2xl font-bold text-red-600">


₹ {

payments.reduce(

(sum,item)=>

sum + Number(item.remaining || 0)

,0)

.toFixed(2)

}


</h2>


</div>




</div>









{/* TABLE */}





<div className="bg-white rounded-xl shadow-lg border overflow-hidden">



<div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white px-6 py-4">


<h2 className="text-lg font-semibold">

Customer Payment Details

</h2>


</div>







<table className="w-full border-collapse">



<thead className="bg-gray-100">


<tr>


<th className="border px-4 py-3 text-left">

Project No

</th>


<th className="border px-4 py-3 text-left">

Customer Name

</th>


<th className="border px-4 py-3 text-left">

Plant Size

</th>


<th className="border px-4 py-3 text-left">

Project Amount

</th>


<th className="border px-4 py-3 text-left">

Received

</th>


<th className="border px-4 py-3 text-left">

Remaining

</th>


<th className="border px-4 py-3 text-left">

Action

</th>



</tr>


</thead>







<tbody>



{

payments.map(item=>(


<tr

key={item.id}

className="hover:bg-blue-50"

>


<td className="border px-4 py-3">

{item.project_no || "-"}

</td>



<td className="border px-4 py-3">

{item.customers?.customer_name || "-"}

</td>




<td className="border px-4 py-3">

{item.project_size || "-"}

</td>




<td className="border px-4 py-3">

₹ {Number(item.total_amount || 0).toFixed(2)}

</td>




<td className="border px-4 py-3 text-green-600 font-semibold">

₹ {Number(item.received || 0).toFixed(2)}

</td>




<td className="border px-4 py-3 text-red-600 font-semibold">

₹ {Number(item.remaining || 0).toFixed(2)}

</td>





<td className="border px-4 py-3">


<button

onClick={()=>viewPaymentHistory(item)}

className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"

>

Payment History

</button>


</td>





</tr>


))


}



</tbody>



</table>







</div>









{/* PAYMENT HISTORY MODAL */}





{

showHistory &&


<div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">



<div className="bg-white rounded-2xl shadow-2xl w-3/4 overflow-hidden">






<div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-6 flex justify-between items-center">



<div>


<h2 className="text-2xl font-bold">

Payment History

</h2>


<p className="text-blue-100">

Customer : {selectedCustomer}

</p>


</div>




<button

onClick={()=>setShowHistory(false)}

className="bg-white text-red-600 px-4 py-2 rounded-lg font-semibold"

>

Close

</button>



</div>







<div className="p-6">





<table className="w-full border-collapse border">



<thead className="bg-gray-100">


<tr>


<th className="border px-4 py-3 text-left">

Date

</th>


<th className="border px-4 py-3 text-left">

Amount

</th>


<th className="border px-4 py-3 text-left">

Type

</th>


<th className="border px-4 py-3 text-left">

Mode

</th>


</tr>


</thead>







<tbody>



{

history.length > 0 ?


history.map((item,index)=>(


<tr

key={index}

className="hover:bg-blue-50"

>



<td className="border px-4 py-3">

{item.payment_date}

</td>





<td className="border px-4 py-3 font-bold text-green-600">

₹ {Number(item.amount || 0).toFixed(2)}

</td>





<td className="border px-4 py-3">


<span className={

item.payment_type==="Credit"

?

"bg-green-100 text-green-700 px-3 py-1 rounded-full"

:

"bg-red-100 text-red-700 px-3 py-1 rounded-full"

}>

{item.payment_type}

</span>


</td>






<td className="border px-4 py-3">


<span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full">

{item.payment_mode}

</span>


</td>




</tr>


))


:


<tr>


<td

colSpan="4"

className="border px-4 py-5 text-center text-gray-500"

>

No Payment History Found

</td>


</tr>



}



</tbody>



</table>







</div>







</div>



</div>


}





</div>


);


}