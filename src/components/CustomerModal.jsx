import { useEffect, useState } from "react";

import {
  addCustomer,
  updateCustomer,
} from "../services/customersService";



export default function CustomerModal({
  open,
  onClose,
  onSaved,
  customer,
}) {



const initialForm = {

customer_name:"",
mobile:"",
email:"",
address:"",
location:"",
plant_size:"",
payment_type:"Cash",

};




const [form,setForm] = useState(initialForm);





useEffect(()=>{


if(customer?.id){


setForm({

customer_name: customer.customer_name || "",
mobile: customer.mobile || "",
email: customer.email || "",
address: customer.address || "",
location: customer.location || "",
plant_size: customer.plant_size || "",
payment_type: customer.payment_type || "Cash",

});


}
else{


setForm(initialForm);


}


},[customer,open]);









function handleChange(e){


setForm({

...form,

[e.target.name]:e.target.value,

});


}









async function handleSubmit(e){


e.preventDefault();



if(
!form.customer_name?.trim() ||
!form.mobile?.trim() ||
!form.location?.trim() ||
!form.plant_size
){

alert(
"Customer Name, Mobile Number, Location and Plant Size are mandatory."
);

return;

}





try{


if(customer?.id){


await updateCustomer(

customer.id,

form

);


}
else{


await addCustomer(

form

);


}




onSaved();

onClose();



}
catch(error){


console.log(error);

alert(error.message);


}



}








if(!open)

return null;









return(


<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">



<div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg p-6">





<h2 className="text-2xl font-bold text-gray-800 mb-5">


{
customer?.id
?
"Edit Customer"
:
"Add Customer"
}


</h2>








<form

onSubmit={handleSubmit}

className="space-y-4"

>







{/* Customer Name */}


<input

type="text"

name="customer_name"

placeholder="Customer Name"

value={form.customer_name}

onChange={handleChange}

className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500"

required

/>










<input

name="mobile"

placeholder="Mobile Number"

value={form.mobile}

onChange={handleChange}

className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500"

required

/>

<input

name="email"

type="email"

placeholder="Email Address"

value={form.email}

onChange={handleChange}

className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500"

/>







<textarea

name="address"

placeholder="Address"

value={form.address}

onChange={handleChange}

className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500"

/>









<input

name="location"

placeholder="Location"

value={form.location}

onChange={handleChange}

className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500"

required

/>









<input

name="plant_size"

placeholder="Plant Size (kW)"

value={form.plant_size}

onChange={handleChange}

className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500"

required

/>









{/* Payment Type */}


<select

name="payment_type"

value={form.payment_type}

onChange={handleChange}

className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500"

>


<option value="Cash">

Cash

</option>


<option value="Finance">

Finance

</option>



</select>








<div className="flex justify-end gap-3 mt-6">





<button

type="button"

onClick={onClose}

className="border border-gray-300 px-5 py-2 rounded-lg hover:bg-gray-100"

>

Cancel

</button>








<button

className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-lg"

>


{
customer?.id
?
"Update"
:
"Save"
}


</button>






</div>





</form>






</div>






</div>


);



}