import { useEffect, useState } from "react";

import UsedInventoryModal from "../components/UsedInventoryModal";

import ViewUsedInventoryModal from "../components/ViewUsedInventoryModal";

import {
  getUsedInventory,
  deleteUsedInventory,
} from "../services/usedInventoryService";


import {
  downloadUsedInventoryPDF,
  downloadUsedInventoryExcel,
} from "../services/usedInventoryExport";



export default function UsedInventory() {


  const [items,setItems] =
    useState([]);



  const [search,setSearch] =
    useState("");



  const [showModal,setShowModal] =
    useState(false);



  const [editingItem,setEditingItem] =
    useState(null);



  const [viewItem,setViewItem] =
    useState(null);







  useEffect(()=>{

    loadUsedInventory();

  },[]);







  async function loadUsedInventory() {

  try {

    const data = await getUsedInventory();

    setItems(data);

    return data;

  }
  catch(error) {

    console.log(error);

    return [];

  }

}







  async function handleDelete(id){


    if(
      !window.confirm(
        "Delete this customer used inventory?"
      )
    )
      return;




    try{


      await deleteUsedInventory(id);


      loadUsedInventory();


    }
    catch(error){

      console.log(error);

    }


  }




const groupedItems = Object.values(

  items.reduce((acc, item) => {

    const key =
      `${item.customer_id}_${item.plant_size}_${item.location}`;


    if (!acc[key]) {

      acc[key] = {

        ...item,

        allEntries: [item],

        products: [
          ...(item.products || [])
        ],

        total_plant_cost:
          Number(item.total_plant_cost || 0),

      };

    }
    else {


      acc[key].allEntries.push(item);


      acc[key].products.push(
        ...(item.products || [])
      );


      acc[key].total_plant_cost +=
        Number(item.total_plant_cost || 0);


    }


    return acc;


  }, {})

);


  const filteredItems =
    groupedItems.filter((item)=>{


      const key =
        search.toLowerCase();
    


      return (

        item.customers
        ?.customer_name
        ?.toLowerCase()
        .includes(key)


        ||

        item.location
        ?.toLowerCase()
        .includes(key)

      );


    });








  return (

  <div className="p-6 bg-gradient-to-br from-slate-100 via-blue-50 to-indigo-100 min-h-screen">

    {/* Header */}

    <div className="mb-6 rounded-3xl bg-gradient-to-r from-indigo-700 via-blue-600 to-cyan-500 p-6 shadow-2xl">

      <div className="flex justify-between items-center">

        <div>

          <h1 className="text-4xl font-extrabold text-white tracking-wide">

            Used Inventory

          </h1>

          <p className="text-blue-100 mt-2 text-lg">

            Material Consumption Management

          </p>

        </div>

        <button

          onClick={() => {

            setEditingItem(null);

            setShowModal(true);

          }}

          className="px-6 py-3 rounded-xl bg-white text-indigo-700 font-bold shadow-lg hover:shadow-2xl hover:scale-105 transition-all duration-300"

        >

          + Add Used Inventory

        </button>

      </div>

    </div>



    {/* Search */}

    <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-5 mb-6">

      <input

        className="w-full rounded-xl border-2 border-slate-200 bg-slate-50 px-5 py-3 text-lg outline-none transition-all duration-300 focus:border-indigo-500 focus:bg-white"

        placeholder="Search Customer or Location..."

        value={search}

        onChange={(e) =>

          setSearch(e.target.value)

        }

      />

    </div>



    {/* Table */}

    <div className="overflow-hidden rounded-2xl bg-white shadow-2xl border border-slate-200">

      <div className="overflow-x-auto">

        <table className="w-full">

          <thead className="bg-gradient-to-r from-slate-800 via-slate-700 to-slate-900 text-white">

            <tr>

              <th className="px-6 py-4 text-left text-sm font-bold uppercase tracking-wider">

                Customer

              </th>

              <th className="px-6 py-4 text-left text-sm font-bold uppercase tracking-wider">

                Plant Size

              </th>

              <th className="px-6 py-4 text-left text-sm font-bold uppercase tracking-wider">

                Location

              </th>

              <th className="px-6 py-4 text-center text-sm font-bold uppercase tracking-wider">

                Action

              </th>

            </tr>

          </thead>

          <tbody>

  {filteredItems.map((item) => (

    <tr
      key={item.id}
      className="border-b border-slate-200 hover:bg-slate-50 transition"
    >

      <td className="px-6 py-4 font-semibold text-slate-800">
        {item.customers?.customer_name}
      </td>

      <td className="px-6 py-4">
        {item.plant_size || "-"}
      </td>

      <td className="px-6 py-4">
        {item.location || "-"}
      </td>

      <td className="px-6 py-4">
        <div className="flex gap-2 flex-wrap justify-center">

          <button
            onClick={() => setViewItem(item)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded-lg"
          >
            View
          </button>

          <button
            onClick={() => {
              setEditingItem(item);
              setShowModal(true);
            }}
            className="bg-sky-600 hover:bg-sky-700 text-white px-3 py-1 rounded-lg"
          >
            Edit
          </button>

          <button
            onClick={() => handleDelete(item.id)}
            className="bg-rose-600 hover:bg-rose-700 text-white px-3 py-1 rounded-lg"
          >
            Delete
          </button>

          <button
            onClick={() => downloadUsedInventoryPDF(item)}
            className="bg-orange-600 hover:bg-orange-700 text-white px-3 py-1 rounded-lg"
          >
            PDF
          </button>

          <button
            onClick={() => downloadUsedInventoryExcel(item)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1 rounded-lg"
          >
            Excel
          </button>

        </div>
      </td>

    </tr>

  ))}

</tbody>

</table>



           </div>
    </div>

    <UsedInventoryModal
      open={showModal}
      item={editingItem}
      onClose={() => {
        setShowModal(false);
        setEditingItem(null);
      }}
      onSaved={async () => {

  await loadUsedInventory();

  setShowModal(false);

  setEditingItem(null);

  setViewItem(null);

}}
    />

    <ViewUsedInventoryModal
      open={!!viewItem}
      item={viewItem}
      onClose={() => {
        setViewItem(null);
      }}
    />
  </div>
);

}