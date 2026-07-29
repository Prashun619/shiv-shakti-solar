import { useNavigate } from "react-router-dom";

export default function QuotationInvoices() {


const navigate = useNavigate();


return(

<div className="p-6 bg-gray-100 min-h-screen">



{/* HEADER */}

<div className="bg-gradient-to-r from-slate-900 via-indigo-900 to-blue-700 rounded-3xl shadow-xl p-8 text-white">


<h1 className="text-3xl font-bold">

Quotation & Invoices

</h1>


<p className="text-blue-100 mt-2">

Manage quotations, invoices and plant costing

</p>


</div>








{/* MODULE CARDS */}



<div className="grid grid-cols-3 gap-6 mt-8">







{/* QUOTATIONS */}



<div className="bg-gradient-to-br from-blue-50 to-white border border-blue-200 rounded-2xl shadow-xl p-8">


<h2 className="text-2xl font-bold text-blue-700">

📄 Quotations

</h2>


<p className="text-gray-600 mt-3">

Create and manage customer quotations.

</p>



<button

className="mt-6 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl shadow-lg transition-all"

>

Create Quotation

</button>


</div>



{/* INVOICES */}



<div className="bg-gradient-to-br from-green-50 to-white border border-green-200 rounded-2xl shadow-xl p-8">


<h2 className="text-2xl font-bold text-green-700">

🧾 Invoices

</h2>


<p className="text-gray-600 mt-3">

Create and manage customer invoices.

</p>


<button
  onClick={() => navigate("/invoice")}
  className="mt-6 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl shadow-lg transition-all"
>
  Invoice
</button>

</div>


{/* PLANT COSTING */}

<div className="bg-gradient-to-br from-orange-50 to-white border border-orange-200 rounded-2xl shadow-xl p-8">

  <h2 className="text-2xl font-bold text-orange-700">
    ⚙️ Plant Costing
  </h2>

  <p className="text-gray-600 mt-3">
    Calculate complete plant material cost, labour cost and final project costing.
  </p>

  <button
    onClick={() => navigate("/plant-costing")}
    className="mt-6 bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-xl shadow-lg transition-all"
  >
    Calculate
  </button>

</div>
</div>

</div>
);
}
