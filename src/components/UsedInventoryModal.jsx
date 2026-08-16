import { useEffect, useState } from "react";

import {
  getCustomers
} from "../services/customersService";

import {
  getProjects
} from "../services/projectsService";

import {
  getInventoryProducts,
  calculateUnitCost
} from "../services/inventoryService";

import {
  addUsedInventory,
  updateUsedInventory
} from "../services/usedInventoryService";



export default function UsedInventoryModal({
  open,
  onClose,
  onSaved,
  item,
}) {



const emptyProduct = {
  product_id: "",
  product_name: "",
  category: "",
  stock: "",
  unit: "",
  quantity: "",
  unit_price: "",
  total: "",
};


const initialForm = {

  customer_id:"",

  project_no:"",

  plant_size:"",

  location:"",


  products:[
    emptyProduct
  ],


  material_cost:0,


  installation_charges:0,
  civil_material:0,
  vendor_charges:0,
  agreement_charges:0,
  je_charges:0,
  name_change_charges:0,
  load_extension_charges:0,
  net_metering_charges:0,


  total_plant_cost:0,


  remarks:"",

};





const [customers,setCustomers] =
useState([]);


const [projects,setProjects] =
useState([]);


const [inventoryProducts,setInventoryProducts] =
useState([]);

const uniqueInventoryProducts = inventoryProducts.filter((product, index, array) => {

  const displayName =
    product.category === "Panel" || product.category === "Inverter"
      ? `${product.company || ""} ${product.category} ${product.specification || ""}`.trim()
      : product.product_name;

  const unitPrice = Math.round(calculateUnitCost(product));

  return (
    index ===
    array.findIndex((p) => {

      const otherName =
        p.category === "Panel" || p.category === "Inverter"
          ? `${p.company || ""} ${p.category} ${p.specification || ""}`.trim()
          : p.product_name;

      return (
        otherName === displayName &&
        Math.round(calculateUnitCost(p)) === unitPrice
      );
    })
  );

});

const [form,setForm] =
useState(initialForm);



useEffect(() => {

  const additionalCharges =

    Number(form.installation_charges || 0) +

    Number(form.civil_material || 0) +

    Number(form.vendor_charges || 0) +

    Number(form.agreement_charges || 0) +

    Number(form.je_charges || 0) +

    Number(form.name_change_charges || 0) +

    Number(form.load_extension_charges || 0) +

    Number(form.net_metering_charges || 0);



  const total =

    Number(form.material_cost || 0)

    +

    additionalCharges;



  setForm(prev => ({

    ...prev,

    total_plant_cost: total

  }));


},[
  form.material_cost,
  form.installation_charges,
  form.civil_material,
  form.vendor_charges,
  form.agreement_charges,
  form.je_charges,
  form.name_change_charges,
  form.load_extension_charges,
  form.net_metering_charges
]);



const [loading,setLoading] =
useState(false);


const [showChargeSelector, setShowChargeSelector] = useState(false);

const CHARGE_FIELDS = {
  installation_charges: "Installation Charges",
  civil_material: "Civil Material",
  vendor_charges: "Vendor Charges",
  agreement_charges: "Agreement Charges",
  je_charges: "JE",
  name_change_charges: "Meter Name Change",
  load_extension_charges: "Load Extension",
  net_metering_charges: "Net Metering Charges",
};

const CHARGE_OPTIONS = [
  {
    field: "installation_charges",
    label: "Installation Charges",
  },
  {
    field: "civil_material",
    label: "Civil Material",
  },
  {
    field: "vendor_charges",
    label: "Vendor Charges",
  },
  {
    field: "agreement_charges",
    label: "Agreement Charges",
  },
  {
    field: "je_charges",
    label: "JE",
  },
  {
    field: "name_change_charges",
    label: "Meter Name Change",
  },
  {
    field: "load_extension_charges",
    label: "Load Extension",
  },
  {
    field: "net_metering_charges",
    label: "Net Metering Charges",
  },
];

const [selectedCharges, setSelectedCharges] = useState([]);


/* ============================
   LOAD DATA
============================ */


async function loadData(){

try{


const customerData =
await getCustomers();



const projectData =
await getProjects();



const inventoryData =
await getInventoryProducts();




setCustomers(
customerData || []
);



setProjects(
projectData || []
);



setInventoryProducts(
inventoryData || []
);

console.log("FULL INVENTORY DATA", inventoryData);

}
catch(error){

console.log(error);

const projectData = await getProjects();

console.log("Project Data from Supabase:", projectData);

setProjects(projectData || []);

}


}





useEffect(()=>{


if(open){

loadData();

}



if(item){


setForm({

    ...initialForm,

    ...item,

    ...(item.additional_charges || {}),

    products: item.products?.length
        ? item.products
        : [emptyProduct],

});

if (item.additional_charges) {

    const selected = Object.entries(item.additional_charges)
        .filter(([_, value]) => Number(value) > 0)
        .map(([key]) => key);

    setSelectedCharges(selected);

}


}
else{


setForm(initialForm);


}



},[open,item]);







/* ============================
   CUSTOMER SELECT
============================ */


function handleCustomerChange(e){


const customerId =
e.target.value;



const customer =
customers.find(

(c)=>

String(c.id)
===
String(customerId)

);




const project =
projects.find(

(p)=>

String(p.customer_id)
===
String(customerId)

);




setForm({

...form,


customer_id:
customerId,


project_no:
project?.project_no || "",


plant_size:
customer?.plant_size || "",


location:
customer?.location || "",


});


}







/* ============================
   PRODUCT SELECT
============================ */


function handleProductSelect(
index,
productId
){


const selectedProduct =
uniqueInventoryProducts.find(
  (p) =>
    String(p.id) === String(productId)
);

console.log("Selected Product:", selectedProduct);

console.log(
  "Matching Products:",
  inventoryProducts.filter((p) =>
    p.category === selectedProduct.category &&
    (p.company || "") === (selectedProduct.company || "") &&
    (p.specification || "") === (selectedProduct.specification || "") &&
    Math.round(calculateUnitCost(p)) ===
      Math.round(calculateUnitCost(selectedProduct))
  )
);

const totalStock = inventoryProducts
.filter((p)=>{

return (

p.category === selectedProduct.category &&

(p.company || "") === (selectedProduct.company || "") &&

(p.specification || "") === (selectedProduct.specification || "")

);

})
.reduce(
(sum,p)=>sum + Number(p.quantity || 0),
0
);


console.log("FINAL TOTAL STOCK =", totalStock);

const alreadySelectedQty =
  form.products.reduce((sum, item, i) => {

    if (i !== index) {

      const sameProduct =
        item.category === selectedProduct.category &&
        item.company === selectedProduct.company &&
        item.specification === selectedProduct.specification;

      if (sameProduct) {

        return sum + Number(item.quantity || 0);

      }

    }

    return sum;

  }, 0);


const updatedProducts =
[
...form.products
];

console.log("Total Stock =", totalStock);
console.log(
  "Matching Quantities =",
  inventoryProducts
    .filter((p) => {
      return (
        p.category === selectedProduct?.category &&
        (p.company || "") === (selectedProduct?.company || "") &&
        (p.specification || "") === (selectedProduct?.specification || "") &&
        Math.round(calculateUnitCost(p)) ===
          Math.round(calculateUnitCost(selectedProduct))
      );
    })
    .map((p) => ({
      quantity: p.quantity,
      purchased_quantity: p.purchased_quantity,
      used_quantity: p.used_quantity,
    }))
);

updatedProducts[index]={


product_id:
selectedProduct?.id || "",

product_name: selectedProduct?.product_name || "",

company: selectedProduct?.company || "",

specification: selectedProduct?.specification || "",


category:
selectedProduct?.category || "",

stock:
totalStock - alreadySelectedQty,

unit: 
selectedProduct?.unit || "",

quantity:
updatedProducts[index].quantity || 0,


unit_price:
selectedProduct
?
calculateUnitCost(selectedProduct)
:
0,


total:

Number(
updatedProducts[index].quantity || 0
)

*

(
selectedProduct
?
calculateUnitCost(selectedProduct)
:
0
)


};


console.log("UPDATED PRODUCT ROW", updatedProducts[index]);


updateTotals(updatedProducts);



}
/* ============================
   QUANTITY CHANGE
============================ */


function handleQuantityChange(index, value) {

  const updatedProducts = [
    ...form.products
  ];


  updatedProducts[index].quantity = value;


  updatedProducts[index].total =
    Number(value || 0) *
    Number(updatedProducts[index].unit_price || 0);



  // Update stock for same product (company + specification based)
  updatedProducts.forEach((item, i) => {

    if (
      i !== index &&
      item.category === updatedProducts[index].category &&
      item.company === updatedProducts[index].company &&
      item.specification === updatedProducts[index].specification
    ) {


      const originalStock =
        inventoryProducts
          .filter(
            p =>
              p.category === item.category &&
              p.company === item.company &&
              p.specification === item.specification
          )
          .reduce(
            (sum, p) =>
              sum + Number(p.quantity || 0),
            0
          );


      const otherUsedQty =
        updatedProducts.reduce(
          (sum, p, j) => {

            if (
              j !== i &&
              p.category === item.category &&
              p.company === item.company &&
              p.specification === item.specification
            ) {

              return sum + Number(p.quantity || 0);

            }

            return sum;

          },
          0
        );


      item.stock =
        originalStock - otherUsedQty;


    }

  });



  updateTotals(updatedProducts);

}


/* ============================
   UPDATE TOTALS
============================ */
function updateTotals(products){


const materialCost = products.reduce(

(sum,item)=>

sum + Number(item.total || 0),

0

);



const additionalCharges =

Number(form.installation_charges || 0)

+

Number(form.civil_material || 0)

+

Number(form.vendor_charges || 0)

+

Number(form.agreement_charges || 0)

+

Number(form.je_charges || 0)

+

Number(form.name_change_charges || 0)

+

Number(form.load_extension_charges || 0)

+

Number(form.net_metering_charges || 0);



const totalPlantCost =
materialCost + additionalCharges;



setForm({

...form,

products: products,

material_cost: materialCost,

total_plant_cost: totalPlantCost

});


}

/* ============================
   ADD PRODUCT ROW
============================ */


function addProduct(){


setForm({

...form,


products:[

...form.products,


{

product_id:"",
product_name:"",
category:"",
quantity:"",
unit_price:"",
total:""

}


]


});


}









/* ============================
   REMOVE PRODUCT
============================ */


function removeProduct(index){


const updatedProducts =

form.products.filter(

(_,i)=>

i !== index

);



setForm({

...form,


products:

updatedProducts.length

?

updatedProducts

:

[emptyProduct]


});


}









/* ============================
   INPUT CHANGE
============================ */


function handleChange(e) {

    const { name, value } = e.target;

    const numericFields = [
        "installation_charges",
        "civil_material",
        "vendor_charges",
        "agreement_charges",
        "je_charges",
        "name_change_charges",
        "load_extension_charges",
        "net_metering_charges",
    ];

    setForm(prev => ({

        ...prev,

        [name]: numericFields.includes(name)
            ? Number(value || 0)
            : value,

    }));


}

/* ============================
   SAVE / UPDATE
============================ */


async function handleSubmit(e){


e.preventDefault();



try{


setLoading(true);



if(item){


await updateUsedInventory(

item.id,

form

);



}
else{


await addUsedInventory(

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

finally{


setLoading(false);


}



}







if(!open)

return null;
return (

<div className="fixed inset-0 bg-black/60 z-50">


<div className="bg-white w-full h-full overflow-y-auto p-8">



<div className="flex justify-between items-center mb-6">


<h2 className="text-3xl font-bold">

{item
?
"Edit Material Consumption"
:
"Add Material Consumption"}

</h2>



<button

onClick={onClose}

className="bg-red-600 text-white px-5 py-2 rounded"

>

Close

</button>


</div>





<form onSubmit={handleSubmit}>




{/* CUSTOMER DETAILS */}


<div className="grid grid-cols-5 gap-3 mb-8">


<div>

<label className="font-semibold">
Customer
</label>


<select

value={form.customer_id}

onChange={handleCustomerChange}

className="border p-1 rounded w-56"

>


<option value="">

Select Customer

</option>


{

customers.map((c)=>(

<option

key={c.id}

value={c.id}

>

{c.customer_name}

</option>


))

}


</select>


</div>






<div>

<label className="font-semibold">
Plant Size
</label>


<input

readOnly

value={form.plant_size}

className="border p-1 rounded w-56"

/>


</div>







<div>

<label className="font-semibold">
Location
</label>


<input

readOnly

value={form.location}

className="border p-1 rounded w-56"

/>


</div>

<div>

<label className="font-semibold">
Project Number
</label>

<input
readOnly
value={form.project_no}
className="border p-1 rounded w-56"
/>

</div>

<div>

<label className="font-semibold">
Total Plant Cost
</label>

<input
readOnly
value={`₹ ${Number(form.total_plant_cost || 0).toFixed(2)}`}
className="border p-1 rounded w-56 bg-green-100 font-bold text-green-700"
/>

</div>



</div>









{/* PRODUCTS */}



<div className="border rounded-xl p-5 mb-8">


<div className="flex justify-between items-center mb-4">


<h3 className="text-xl font-bold">
Products
</h3>


<button

type="button"

onClick={addProduct}

className="bg-blue-600 text-white px-4 py-2 rounded"

>

+ Add Product

</button>


</div>






<table className="w-full border">


<thead className="bg-gray-100">


<tr>

<th className="text-center p-2">
Product Name
</th>



<th className="text-center p-2">
Category
</th>

<th className="text-center p-2">
  Stock
</th>

<th className="text-center p-2">
Quantity
</th>


<th className="text-center p-2">
Unit Price
</th>


<th className="text-center p-2">
Total
</th>


<th className="p-2">
Action
</th>


</tr>


</thead>





<tbody>


{

form.products.map((product,index)=>(


<tr

key={index}

className="border-t"

>


<td className="p-3">


<select

value={product.product_id}

onChange={(e)=>

handleProductSelect(

index,

e.target.value

)

}

className="border p-2 rounded w-50"

>


<option value="">

Select Product

</option>

{uniqueInventoryProducts.map((p) => {

  const displayName =
    p.category === "Panel" || p.category === "Inverter"
      ? `${p.company || ""} ${p.category} ${p.specification || ""}`.trim()
      : p.product_name;

  return (
    <option
      key={p.id}
      value={p.id}
    >
      {`${displayName} | ₹${Math.round(calculateUnitCost(p))}`}
    </option>
  );

})}

</select>


</td>






<td className="p-3">


<input

readOnly

value={product.category}

className="border p-2 rounded bg-gray-100 w-50"

/>


</td>


<td className="p-3">

  <input
    readOnly
    value={`${product.stock || 0} ${product.unit || ""}`}

    className="border p-2 rounded bg-gray-100 w-30 text-center"
  />

</td>




<td className="p-3">


<input

type="number"

value={product.quantity}

onChange={(e)=>

handleQuantityChange(

index,

e.target.value

)

}

className="border p-2 rounded w-30"

/>


</td>






<td className="p-3">


<input

readOnly

  value={`₹ ${Math.round(product.unit_price || 0)}`}

className="border p-1 rounded w-30"

/>


</td>







<td className="p-3 text-left font-bold w-30">

₹ {Number(product.total || 0).toFixed(2)}

</td>
    <td className="text-center p-3">

<button
type="button"
className="bg-red-600 text-white px-3 py-1 rounded"
onClick={() => removeProduct(index)}
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

{/* ===========================
    ADDITIONAL CHARGES
=========================== */}

<div className="border rounded-xl p-6 mb-8 bg-white">

  <div className="flex items-center justify-between mb-6">

    <div>

      <h3 className="text-2xl font-bold">
        Additional Charges
      </h3>

      <p className="text-gray-500 text-sm">
        Add only the charges applicable to this customer.
      </p>

    </div>

    <button
      type="button"
      onClick={() => setShowChargeSelector(true)}
      className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-lg font-semibold"
    >
      + Add Additional Charges
    </button>

  </div>

  {selectedCharges.length === 0 ? (

    <div className="border border-dashed rounded-xl p-8 text-center text-gray-500">

      No Additional Charges Added

    </div>

  ) : (

    <div className="flex flex-wrap gap-4">

      {selectedCharges.map((field) => {

        const charge = CHARGE_OPTIONS.find(
          (c) => c.field === field
        );

        return (

          <div
  key={field}
  className="flex items-center gap-2 border rounded-lg px-3 py-2 bg-gray-50"
>

  <label className="font-medium whitespace-nowrap min-w-[170px]">
    {charge.label}
  </label>

  <input
    type="number"
    name={field}
    value={Number(form[field]) === 0 ? "" : form[field]}
    onChange={handleChange}
    placeholder="Amount"
    className="w-28 border rounded px-2 py-1 text-right"
  />

  <button
    type="button"
    className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded"
    onClick={() => {

      setSelectedCharges(
        selectedCharges.filter(item => item !== field)
      );

      setForm(prev => ({
        ...prev,
        [field]: 0
      }));

    }}
  >
    Delete
  </button>

</div>

        );

      })}

    </div>

  )}

</div>

<textarea

name="remarks"

value={form.remarks}

onChange={handleChange}

placeholder="Remarks"

className="border p-3 rounded w-full mb-6"

/>







<div className="flex justify-end gap-4">



<button

type="button"

onClick={onClose}

className="border px-5 py-2 rounded"

>

Cancel

</button>






<button

disabled={loading}

className="bg-green-600 text-white px-6 py-2 rounded"

>


{

loading

?

"Saving..."

:

item

?

"Update"

:

"Save"

}


</button>



</div>





</form>


</div>

{showChargeSelector && (

<div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">

  <div className="bg-white rounded-xl p-6 w-[420px]">

    <h2 className="text-xl font-bold mb-5">

      Select Additional Charges

    </h2>

    <div className="space-y-3">

      {CHARGE_OPTIONS.map((charge) => (

<label
key={charge.field}
className="flex items-center gap-3"
>

<input
type="checkbox"

checked={
selectedCharges.includes(charge.field)
}

onChange={(e)=>{

if(e.target.checked){

setSelectedCharges([
...selectedCharges,
charge.field
]);

}
else{

setSelectedCharges(
selectedCharges.filter(
c=>c!==charge.field
)
);

}

}}
/>

{charge.label}

</label>

))}

    </div>

    <div className="flex justify-end mt-6">

      <button

        type="button"

        onClick={() =>

          setShowChargeSelector(false)

        }

        className="bg-indigo-600 text-white px-5 py-2 rounded-lg"

      >

        Done

      </button>

    </div>

  </div>

</div>

)}
</div>


);


}