import InvoiceFooter from "../components/invoice/InvoiceFooter";
import InvoiceHeader from "../components/invoice/InvoiceHeader";
import InvoiceItems from "../components/InvoiceItems";
import InvoiceBillTo from "../components/invoice/InvoiceBillTo";

import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import {
  getInvoiceCustomers,
  getLastInvoiceNumber,
  saveInvoice,
  getInvoiceById,
  updateInvoice,    
  getInvoices,
  deleteInvoice,
} from "../services/invoiceService";



function amountToWords(num) {


  const ones = [
    "",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
    "Ten",
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen"
  ];


  const tens = [
    "",
    "",
    "Twenty",
    "Thirty",
    "Forty",
    "Fifty",
    "Sixty",
    "Seventy",
    "Eighty",
    "Ninety"
  ];



  function convert(n){


    if(n < 20)
      return ones[n];


    if(n < 100)
      return tens[Math.floor(n/10)] + " " + ones[n%10];


    if(n < 1000)
      return ones[Math.floor(n/100)] + " Hundred " + convert(n%100);


    if(n < 100000)
      return convert(Math.floor(n/1000)) 
      + " Thousand " 
      + convert(n%1000);



    if(n < 10000000)
      return convert(Math.floor(n/100000)) 
      + " Lakh " 
      + convert(n%100000);



    return convert(Math.floor(n/10000000)) 
    + " Crore " 
    + convert(n%10000000);


  }



  return num
    ? convert(Number(num)).trim() + " Rupees Only"
    : "";

}





export default function CreateInvoice(){
    const navigate = useNavigate();
const [searchParams] = useSearchParams();

const invoiceId =
searchParams.get("id");


const [editMode,setEditMode] =
useState(false);


const [invoiceNumber,setInvoiceNumber] = useState("");



const [invoiceDate,setInvoiceDate] = useState(
  new Date().toISOString().split("T")[0]
);



const [customers,setCustomers] = useState([]);



const [customerId,setCustomerId] = useState("");



const [customerName,setCustomerName] = useState("");



const [customerAddress,setCustomerAddress] = useState("");



const [items,setItems] = useState([]);



const [total,setTotal] = useState("");



const [invoiceList,setInvoiceList] = useState([]);





const subtotal = total;


const finalTotal = total;





const amountInWords =
total
?
amountToWords(total)
:
"";







useEffect(()=>{

loadPage();

},[]);








async function loadPage(){


const customerList =
await getInvoiceCustomers();

setCustomers(customerList);



const invoices =
await getInvoices();

setInvoiceList(invoices);





if(invoiceId){


const invoice =
await getInvoiceById(invoiceId);



setEditMode(true);



setInvoiceNumber(
invoice.invoice_number
);


setInvoiceDate(
invoice.invoice_date
);


setCustomerId(
invoice.customer_id
);


setCustomerName(
invoice.customer_name
);


setCustomerAddress(
invoice.customer_address
);



setItems(
invoice.items || []
);



setTotal(
invoice.total
);



}
else{


const nextInvoice =
await getLastInvoiceNumber();


setInvoiceNumber(nextInvoice);


}



}

async function handleSave(){

try{


const invoiceData = {


invoice_number:invoiceNumber,

invoice_date:invoiceDate,

customer_id:customerId,

customer_name:customerName,

customer_address:customerAddress,

items,

subtotal:total,

total,

amount_in_words:amountInWords,


};



if(editMode){


await updateInvoice(
invoiceId,
invoiceData
);


alert(
"Invoice updated successfully."
);


navigate("/invoice");


}
else{


await saveInvoice(
invoiceData
);


alert(
"Invoice saved successfully."
);


navigate("/invoice");


}


}

catch(err){


console.error(err);


alert(
"Unable to save invoice."
);


}


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



loadPage();



}

catch(err){

console.error(err);

alert(
"Unable to delete invoice."
);

}



}
return(


<div className="p-6">


<div className="flex justify-between items-center mb-8">


<h1 className="text-3xl font-bold">

Create Invoice

</h1>



<button

type="button"

onClick={()=>navigate("/invoice")}

className="
bg-gray-600
text-white
px-5
py-2
rounded-lg
"

>

← Back

</button>



</div>





<div className="bg-white rounded-2xl shadow p-6">






{/* HEADER */}

<InvoiceHeader />







{/* BILL TO + INVOICE DETAILS */}


<InvoiceBillTo

  customers={customers}

  customerId={customerId}
  setCustomerId={setCustomerId}

  customerName={customerName}
  setCustomerName={setCustomerName}

  customerAddress={customerAddress}
  setCustomerAddress={setCustomerAddress}

  invoiceNumber={invoiceNumber}
  setInvoiceNumber={setInvoiceNumber}

  invoiceDate={invoiceDate}
  setInvoiceDate={setInvoiceDate}

/>









{/* PRODUCT TABLE */}



<InvoiceItems


items={items}


setItems={setItems}


/>









{/* SUMMARY SECTION */}



<div className="mt-6 border border-green-600">



<div className="flex justify-end">



<div className="w-80">






{/* TOTAL */}


<div className="flex justify-between border-b border-green-600 p-3">


<span className="font-semibold">

Total

</span>




<input


type="number"


value={total}


onChange={(e)=>
setTotal(e.target.value)
}



className="
w-36
text-right
outline-none
bg-transparent
"



/>



</div>









{/* SUBTOTAL */}



<div className="flex justify-between border-b border-green-600 p-3">


<span className="font-semibold">

Subtotal

</span>




<span className="font-bold">


₹ {Number(subtotal || 0).toFixed(2)}


</span>



</div>









{/* FINAL TOTAL */}



<div className="flex justify-between p-3">


<span className="font-bold">

TOTAL

</span>



<span className="font-bold">


₹ {Number(finalTotal || 0).toFixed(2)}


</span>



</div>








</div>



</div>



</div>









{/* AMOUNT IN WORDS */}



<div

className="
border
border-green-600
border-t-0
p-4
"

>



<label className="font-semibold">


Amount In Words


</label>




<textarea



rows="2"



readOnly



value={amountInWords}



className="
w-full
mt-2
outline-none
bg-transparent
"



/>



</div>









{/* FOOTER */}



<InvoiceFooter />









{/* SAVE BUTTON */}



<div className="mt-8">


<button


type="button"



onClick={handleSave}



className="
w-full
bg-green-600
hover:bg-green-700
text-white
py-3
rounded-xl
font-semibold
"



>


Save Invoice


</button>



</div>

</div>

</div>

);

}