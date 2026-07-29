import { generateInvoicePDF } from "../services/invoicePdf";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  getInvoices,
  deleteInvoice,
} from "../services/invoiceService";


export default function Invoice() {


  const navigate = useNavigate();


  const [search,setSearch] = useState("");


  const [invoices,setInvoices] = useState([]);




  useEffect(()=>{

    loadInvoices();

  },[]);




  async function loadInvoices(){


    const data =
    await getInvoices();


    setInvoices(data);


  }



  async function handleDelete(id){


    const confirmDelete =
    window.confirm(
      "Delete this invoice?"
    );


    if(!confirmDelete)
      return;



    try{


      await deleteInvoice(id);


      loadInvoices();


    }
    catch(err){


      console.error(err);


      alert(
        "Unable to delete invoice"
      );


    }


  }





  const filteredInvoices =
  invoices.filter(invoice=>{


    const value =
    search.toLowerCase();



    return (

      invoice.invoice_number
      ?.toLowerCase()
      .includes(value)


      ||


      invoice.customer_name
      ?.toLowerCase()
      .includes(value)

    );


  });







return(


<div className="p-6">



<div className="flex justify-between items-center mb-8">



<h1 className="text-3xl font-bold">

Invoice

</h1>



<button

onClick={()=>navigate("/invoice/new")}

className="
bg-green-600
hover:bg-green-700
text-white
px-5
py-3
rounded-xl
"

>

+ Create Invoice

</button>


</div>







<input

type="text"

placeholder="Search Invoice Number or Customer"

value={search}

onChange={(e)=>
setSearch(e.target.value)
}

className="
w-full
border
rounded-xl
px-4
py-3
mb-6
"

/>







<div className="bg-white rounded-xl shadow overflow-hidden">


<table className="w-full">


<thead className="bg-gray-100">


<tr>


<th className="p-3 text-left">
Invoice No
</th>


<th className="p-3 text-left">
Date
</th>


<th className="p-3 text-left">
Customer
</th>


<th className="p-3 text-left">
Amount
</th>


<th className="p-3 text-center">
Action
</th>


</tr>


</thead>





<tbody>


{
filteredInvoices.map(invoice=>(


<tr
key={invoice.id}
className="border-t"
>


<td className="p-3">

{invoice.invoice_number}

</td>



<td className="p-3">

{new Date(invoice.invoice_date)
  .toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
  .replace(/ /g, "-")}

</td>



<td className="p-3">

{invoice.customer_name}

</td>



<td className="p-3">

₹ {Number(invoice.total || 0).toFixed(2)}

</td>



<td className="p-3">

<div className="flex gap-2 justify-center">


<button

onClick={() =>
generateInvoicePDF(invoice)
}

className="
bg-green-600
text-white
px-3
py-1
rounded-lg
"

>
PDF
</button>


<button
  onClick={() => generateInvoicePDF(invoice, false)}
  className="
  bg-gray-600
  text-white
  px-3
  py-1
  rounded-lg
  "
>
View
</button>

<button

onClick={()=>navigate(
`/invoice/new?id=${invoice.id}`
)}

className="
bg-blue-600
text-white
px-3
py-1
rounded-lg
"

>
Edit
</button>




<button

onClick={() =>
handleDelete(invoice.id)
}

className="
bg-red-600
text-white
px-3
py-1
rounded-lg
"

>
Delete
</button>


</div>

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