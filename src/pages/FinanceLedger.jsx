import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../services/supabase";


export default function FinanceLedger(){


const navigate = useNavigate();


const openingBalance = 15000;



const [summary,setSummary] = useState({

 totalValue:0,
 totalReceived:0,
 remaining:0

});



const [closingBalance,setClosingBalance] = useState(
 openingBalance
);






useEffect(()=>{


loadFinanceSummary();


window.addEventListener(
 "focus",
 loadFinanceSummary
);



return()=>{


window.removeEventListener(
 "focus",
 loadFinanceSummary
);


};


},[]);









async function loadFinanceSummary(){



const {

data:projects,
error

}=await supabase

.from("projects")

.select(`
 total_amount,
 received,
 remaining
`);




if(error){

console.log(error);
return;

}






let totalValue=0;

let totalReceived=0;

let remaining=0;






projects.forEach(item=>{


totalValue += Number(
item.total_amount || 0
);



totalReceived += Number(
item.received || 0
);



remaining += Number(
item.remaining || 0
);



});









const {

data:billing,
error:billingError

}=await supabase

.from("billing")

.select(`
payment_type,
amount
`);





if(billingError){

console.log(billingError);
return;

}







let credit=0;

let debit=0;







billing.forEach(item=>{


if(item.payment_type==="Credit"){


credit += Number(
item.amount || 0
);


}



if(item.payment_type==="Debit"){


debit += Number(
item.amount || 0
);


}



});







setSummary({

totalValue,

totalReceived,

remaining

});





setClosingBalance(

openingBalance
+
credit
-
debit

);




}









return(


<div className="p-4 bg-gray-100 min-h-screen">







{/* HEADER */}



<div className="mb-8">


<h1 className="text-3xl font-bold text-gray-800">

Finance Ledger

</h1>


<p className="text-gray-500 mt-1">

Manage customer payments and company billing

</p>


</div>









{/* TOP SUMMARY */}





<div className="grid grid-cols-3 gap-6 mb-8 items-start">







{/* PROJECT SUMMARY */}



<div className="col-span-2 bg-gradient-to-br from-blue-50 to-white rounded-xl shadow-lg border border-blue-100 p-4 h-full">

  <div className="flex items-center gap-2 mb-3">
    <span className="text-xl">📊</span>

    <h2 className="text-lg font-bold text-blue-700">
      Project Summary
    </h2>
  </div>

  <div className="grid grid-cols-3 gap-3">

    <div className="bg-white rounded-lg shadow border p-3">
      <p className="text-xs text-gray-500">Total Value</p>
      <h3 className="text-lg font-bold text-blue-700 mt-1">
        ₹ {summary.totalValue.toFixed(2)}
      </h3>
    </div>

    <div className="bg-white rounded-lg shadow border p-3">
      <p className="text-xs text-gray-500">Total Received</p>
      <h3 className="text-lg font-bold text-green-600 mt-1">
        ₹ {summary.totalReceived.toFixed(2)}
      </h3>
    </div>

    <div className="bg-white rounded-lg shadow border p-3">
      <p className="text-xs text-gray-500">Remaining</p>
      <h3 className="text-lg font-bold text-red-600 mt-1">
        ₹ {summary.remaining.toFixed(2)}
      </h3>
    </div>

  </div>

</div>


{/* BALANCE SUMMARY */}
<div className="bg-gradient-to-br from-green-50 to-white rounded-xl shadow-lg border border-green-100 p-4 h-full">
    
  <div className="flex items-center gap-2 mb-4">
    <span className="text-xl">💰</span>
    <h2 className="text-lg font-bold text-green-700">
      Balance Summary
    </h2>
  </div>

  <div className="grid grid-cols-2 gap-3">

    <div className="bg-white border rounded-lg p-3 text-center">
      <p className="text-xs text-gray-500 uppercase tracking-wide">
        Opening
      </p>

      <p className="text-lg font-bold text-green-700 mt-1">
        ₹ {openingBalance.toFixed(2)}
      </p>
    </div>

    <div className="bg-white border rounded-lg p-3 text-center">
      <p className="text-xs text-gray-500 uppercase tracking-wide">
        Closing
      </p>

      <p className="text-lg font-bold text-purple-700 mt-1">
        ₹ {closingBalance.toFixed(2)}
      </p>
    </div>

  </div>

</div>



</div>









{/* MODULES */}



<div className="grid grid-cols-2 gap-6">







{/* CUSTOMER PAYMENTS */}



<div className="bg-gradient-to-br from-blue-50 to-white rounded-xl shadow-lg border border-blue-100 p-8">


<h2 className="text-xl font-bold text-blue-700 mb-3">

👥 Customer Payments

</h2>




<p className="text-gray-600 mb-6">

View project payments, received amount,
remaining balance and customer payment history.

</p>




<button

onClick={()=>navigate("/customer-payments")}

className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg"

>

Open Customer Payments

</button>



</div>









{/* BILLING */}



<div className="bg-gradient-to-br from-green-50 to-white rounded-xl shadow-lg border border-green-100 p-8">


<h2 className="text-xl font-bold text-green-700 mb-3">

🧾 Billing

</h2>




<p className="text-gray-600 mb-6">

Manage company billing entries,
credit/debit transactions and payment modes.

</p>




<button

onClick={()=>navigate("/billing")}

className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg"

>

Open Billing

</button>



</div>







</div>







</div>


);


}