export default function InvoiceBillTo({

  customerName,
  setCustomerName,

  customerAddress,
  setCustomerAddress,

  customers,
  customerId,
  setCustomerId,

  invoiceNumber,
  setInvoiceNumber,

  invoiceDate,
  setInvoiceDate,

}) {  


  function handleCustomer(e) {


    const id = e.target.value;


    setCustomerId(id);



    const customer =
      customers.find(
        c => String(c.id) === String(id)
      );



    if (!customer) return;



    setCustomerName(
      customer.customer_name || ""
    );



    setCustomerAddress(
      customer.address || ""
    );


  }





  function formatDate(date){


    if(!date) return "";


    return new Date(date).toLocaleDateString(
      "en-GB",
      {
        day:"2-digit",
        month:"short",
        year:"numeric"
      }
    );


  }






return (

<div className="border-2 border-green-700">


<div className="grid grid-cols-2">



{/* ================= BILL TO ================= */}



<div className="border-r-2 border-green-700">


<div className="bg-green-700 text-white font-bold p-2">

BILL TO

</div>




<div className="p-3">



<label className="font-semibold">

Customer

</label>



<select

className="
w-full
border
mt-2
p-2
rounded
"

value={customerId}

onChange={handleCustomer}

>


<option value="">

Select Customer

</option>



{
customers.map(customer=>(

<option

key={customer.id}

value={customer.id}

>

{customer.customer_name}

</option>


))

}



</select>






<div className="mt-4">


<div className="font-semibold">

Customer Name

</div>



<div

className="
border
mt-2
p-2
min-h-[42px]
"

contentEditable

suppressContentEditableWarning


onBlur={(e)=>

setCustomerName(
e.currentTarget.innerText
)

}

>

{customerName}


</div>


</div>









<div className="mt-4">


<div className="font-semibold">

Address

</div>



<div

className="
border
mt-2
p-2
min-h-[80px]
whitespace-pre-line
"

contentEditable

suppressContentEditableWarning


onBlur={(e)=>

setCustomerAddress(
e.currentTarget.innerText
)

}

>

{customerAddress}


</div>



</div>




</div>


</div>









{/* ================= INVOICE DETAILS ================= */}



<div>


<div className="bg-green-700 text-white font-bold p-2">

Invoice Details

</div>





<table className="w-full">


<tbody>



<tr>

  <td className="border p-3 font-semibold">
    Invoice Number
  </td>

  <td className="border p-3">

    <input
      value={invoiceNumber}
      onChange={(e) =>
        setInvoiceNumber(e.target.value)
      }
      className="w-full outline-none bg-transparent"
    />

  </td>

</tr>

<tr>

  <td className="border p-3 font-semibold">
    Invoice Date
  </td>

  <td className="border p-3">

    <input
      type="date"
      value={invoiceDate}
      onChange={(e) =>
        setInvoiceDate(e.target.value)
      }
      className="w-full outline-none bg-transparent"
    />

  </td>

</tr>




  </tbody>


  </table>



  </div>





  </div>


  </div>


  );


  }