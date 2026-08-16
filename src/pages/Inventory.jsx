import { useEffect, useMemo, useState } from "react";

import InventoryModal from "../components/InventoryModal";

import {
  getInventory,
  deleteInventory,
} from "../services/inventoryService";


export default function Inventory() {


  const [items, setItems] = useState([]);

  const [search, setSearch] = useState("");

  const [showModal, setShowModal] = useState(false);

  const [editingProduct, setEditingProduct] = useState(null);

  const [loading, setLoading] = useState(true);



  useEffect(() => {

    loadInventory();

  }, []);



  useEffect(() => {

    loadInventory();

  }, [search]);



  async function loadInventory() {

    try {

      setLoading(true);

      const data = await getInventory();

      setItems(data || []);

    }

    catch(error) {

      console.log(error);

    }

    finally {

      setLoading(false);

    }

  }




  async function handleDelete(id) {


    if(!window.confirm("Delete this purchase?"))
      return;


    try {


      await deleteInventory(id);

      loadInventory();


    }
    catch(error) {

      console.log(error);

      alert(error.message);

    }

  }




  const totalPurchaseValue = useMemo(()=>{


    return items.reduce(

      (sum,item)=>

        sum + Number(item.total_amount || 0),

      0

    );


  },[items]);





 const filteredItems = items.filter((item) => {

  const key = search.toLowerCase();

  return (

    item.product_name?.toLowerCase().includes(key) ||

    item.category?.toLowerCase().includes(key) ||

    item.company?.toLowerCase().includes(key) ||

    item.specification?.toLowerCase().includes(key) ||

    item.supplier?.toLowerCase().includes(key)

  );

});




  return (

   <div className="w-full overflow-hidden p-3">


      {/* HEADER */}

      <div className="mb-2 rounded-xl bg-gradient-to-r from-indigo-700 via-blue-600 to-cyan-500 p-6 shadow-2xl">

  <div className="flex justify-between items-center">

    <div>

      <h1 className="text-2xl font-extrabold text-white tracking-wide">
        Inventory
      </h1>

      <p className="text-blue-100 mt text-sm">
        Purchase & Stock Management
      </p>

    </div>

    <div className="text-right">

      <p className="text-blue-100">
        Total Purchase Value
      </p>

      <h2 className="text-3xl font-bold text-white">
        ₹ {Number(totalPurchaseValue).toLocaleString()}
      </h2>

    </div>

  </div>

</div>




      {/* SEARCH + ADD */}


      <div className="sm-cyan rounded-xl shadow-xl border border-slate-200 p-4 mb-5">

  <div className="flex justify-between items-center gap-3">

    <input
      type="text"
      placeholder="Search Product, Category or Supplier..."
      value={search}
      onChange={(e)=>setSearch(e.target.value)}
      className="flex-1 rounded-xl border-2 border-slate-200 bg-slate-50 px-4 py-2 outline-none focus:border-indigo-500"
    />

    <button
      onClick={() => {
  setEditingProduct(null);
  setShowModal(true);
}}
      className="bg-gradient-to-r from-green-600 to-emerald-600 hover:scale-105 transition-all text-white px-6 py-3 rounded-xl shadow-lg"
    >
      + Add Purchase
    </button>

  </div>

</div>
     

     <div className="w-full overflow-x-auto rounded-lg bg-white shadow-md border border-slate-200">


        {loading ? (


          <div className="p-10 text-center">

            Loading Inventory...

          </div>


        ) : (


           <table className="w-full overflow-hidden rounded-2xl text-xs">


            <thead className="bg-gradient-to-r from-indigo-900 via-slate-800 to-slate-900 text-white shadow-md">


              <tr>


              <th className="border border-black px-5 py-4 text-center text-sm font-semibold whitespace-nowrap">
  Date
</th>


   <th className="border border-black px-5 py-4 text-center text-sm font-semibold whitespace-nowrap">
  Supplier
</th>


   <th className="border border-black px-5 py-4 text-center text-sm font-semibold whitespace-nowrap">
  Product
</th>

<th className="border border-black px-5 py-4 text-center text-sm font-semibold whitespace-nowrap">
  Company
</th>

<th className="border border-black px-5 py-4 text-center text-sm font-semibold whitespace-nowrap">
  Specification
</th>

<th className="border border-black px-5 py-4 text-center text-sm font-semibold whitespace-nowrap">
  Quantity
</th>

<th className="border border-black px-5 py-4 text-center text-sm font-semibold whitespace-nowrap">
  Unit Cost
</th>

<th className="border border-black px-5 py-4 text-center text-sm font-semibold whitespace-nowrap">
  Total Amount
</th>


  <th className="border border-black px-5 py-4 text-center text-sm font-semibold whitespace-nowrap">
  Actions
</th>


              </tr>


            </thead>



            <tbody>


              {
                filteredItems.length === 0 ? (


                  <tr>


                    <td

                      colSpan="8"

                      className="text-center py-10 text-gray-500"

                    >

                      No purchases found.


                    </td>


                  </tr>


                ) : (


                  filteredItems.map((item)=>(


                    <tr

                      key={item.id}

                      className="border-b border-gray-200 even:bg-slate-50 hover:bg-green-50 transition-all duration-200 hover:shadow-sm" >


                      <td className="border border-black w-24 h-1 px-3 py-2 text-center align-middle whitespace-nowrap">

                        {item.date
  ? new Date(item.date)
      .toLocaleDateString("en-GB")
      .replace(/\//g, "-")
  : "-"}

                      </td>



                      <td className="border border-black w-24 h-1 px-3 py-2 text-center  whitespace-nowrap">

                        {item.supplier || "-"}

                      </td>



                      <td className="border border-black w-24 h-1 px-3 py-2 text-center font-semibold text-slate-800 whitespace-nowrap">

                        {item.product_name}

                      </td>



                      
<td className="border border-black w-24 h-1 px-3 py-2 text-center whitespace-nowrap">
  {item.company || "-"}
</td>

<td className="border border-black w-24 h-1 px-3 py-2 text-center whitespace-nowrap">
  {item.specification || "-"}
</td>

<td className="border border-black w-24 h-1 px-3 py-2 text-center whitespace-nowrap">
  {item.quantity} {item.unit || ""}
</td>

<td className="border border-black w-24 h-1 px-3 py-2 text-center font-semibold whitespace-nowrap">
  ₹ {Number(item.unit_cost || 0).toFixed(2)}
</td>

<td className="border border-black w-24 h-1 px-3 py-2 text-center font-bold text-green-700 whitespace-nowrap">
  ₹ {Number(item.total_amount || 0).toLocaleString()}
</td>


                      <td className="border border-black w-20 h-1 px-1 py-1 text-center whitespace-nowrap">


                        <div className="flex justify-center gap-2">


                          <button

                            onClick={()=>{

                              setEditingProduct(item);

console.log("EDIT ITEM:", item);

                              setShowModal(true);

                            }}

                            className="bg-sky-600 hover:bg-sky-700 text-white px-4 py-2 rounded-lg shadow-md transition-all duration-300 hover:scale-105"

                          >

                            Edit

                          </button>



                          <button

                            onClick={()=>handleDelete(item.id)}

                            className="bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-lg shadow-md transition-all duration-300 hover:scale-105"

                          >

                            Delete

                          </button>


                        </div>


                      </td>



                    </tr>


                  ))


                )

              }


            </tbody>


          </table>


        )}


      </div>
   

      <InventoryModal

        open={showModal}

        product={editingProduct}


        onClose={()=>{

          setShowModal(false);

          setEditingProduct(null);

        }}


        onSaved={()=>{

          loadInventory();

          setShowModal(false);

          setEditingProduct(null);

        }}

      />
          </div>

  );

}