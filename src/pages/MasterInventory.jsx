import { useEffect, useMemo, useState } from "react";

import {
  getMasterInventory,
} from "../services/masterInventoryService";


export default function MasterInventory() {


  const [items, setItems] = useState([]);

  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);



  useEffect(()=>{

    loadMasterInventory();

  },[]);



  async function loadMasterInventory(){


    try{


      setLoading(true);


      const data =
        await getMasterInventory();


      setItems(data || []);


    }
    catch(error){


      console.log(error);


    }
    finally{


      setLoading(false);


    }


  }




  const totalStockValue = useMemo(()=>{


    return items.reduce(

      (sum,item)=>

        sum + Number(item.stock_value || 0),

      0

    );


  },[items]);





  const filteredItems = items.filter((item)=>{


    const key =
      search.toLowerCase();



  return (

      item.display_name
      ?.toLowerCase()
      .includes(key)

      ||

      item.category
      ?.toLowerCase()
      .includes(key)

    );


  });





  return (

    <div className="p-6 bg-gradient-to-br from-slate-100 via-blue-50 to-indigo-100 min-h-screen">


      {/* HEADER */}

      <div
className="
mb-6
rounded-3xl
bg-gradient-to-r
from-indigo-700
via-blue-600
to-cyan-500
p-6
shadow-2xl
border
border-white/20
"
>

  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">

  <div className="flex items-center gap-5">

    <div className="h-16 w-16 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center text-3xl shadow-lg">
      📦
    </div>

    <div>

      <h1 className="text-3xl font-bold text-white">
        Master Inventory
      </h1>

      <p className="mt-1 text-blue-100">
        Overall Product Stock Summary
      </p>

    </div>

  </div>

  <div className="bg-white/15 backdrop-blur-md rounded-2xl px-6 py-4 shadow-lg">

    <p className="text-sm text-bold text- -100">
      Total Stock Value
    </p>

    <h2 className="mt-2 text-4xl font-bold text-white">
      ₹ {Number(totalStockValue).toLocaleString(undefined,{
        minimumFractionDigits:2,
        maximumFractionDigits:2
      })}
    </h2>

  </div>

</div>

</div>

      {/* SEARCH */}


    <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-5 mb-6">

    <input
        type="text"
        placeholder="🔍 Search Product or Category..."
        value={search}
        onChange={(e)=>setSearch(e.target.value)}
        className="w-full rounded-xl border-2 border-slate-200 bg-slate-50 px-5 py-3 text-sm outline-none transition-all duration-300 focus:border-indigo-500 focus:bg-white"
    />

</div>





      {/* TABLE */}


      <div className="overflow-hidden rounded-3xl bg-white shadow-2xl border border-slate-200">


        {
          loading ?


          (

            <div className="flex items-center justify-center h-48">

    <div className="text-center">

        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-indigo-600 mx-auto mb-4"></div>

        <p className="text-slate-600 font-medium">

            Loading Master Inventory...

        </p>

    </div>

</div>


          )


          :


          (

            <table className="w-full border-collapse border-2 border-black text-xs">


              <thead className="bg-teal-700 text-white  ">

                <tr>


                  <th className="border-2 border-black px-2 py-2 text-center text-sm font-semibold">

                    Product

                  </th>



                  <th className="border-2 border-black px-2 py-2 text-center test-sm font-semibold">

                    Category

                  </th>



                   <th className="border-2 border-black px-2 py-2 text-center test-sm font-semibold">

                    Total Quantity

                  </th>



                   <th className="border-2 border-black px-2 py-2 text-center test-sm font-semibold">

                    Used Quantity

                  </th>



                   <th className="border-2 border-black px-2 py-2 text-center test-sm font-semibold">

                    Remaining

                  </th>


                </tr>


              </thead>



              <tbody>


              {


                filteredItems.length === 0 ?


                (

                  <tr>

                    <td
colSpan="5"
className="border border-black py-4 text-center text-gray-500"
>

                      No stock found.

                    </td>


                  </tr>


                )


                :


                (


                  filteredItems.map((item)=>(


                    <tr

                      key={
                        item.product_name +
                        item.category
                      }

                      className="border border-slate-00 hover:bg-indigo-50 hover:shadow-sm transition-all duration-300"

                    >


                      <td className="border-2 border-black px-2 py-2 text-center">
                      {item.display_name}
                       </td>



                      <td className="border-2 border-black px-2 py-2 text-center">

                        {item.category}

                      </td>



                      <td className="border-2 border-black px-2 py-2 text-center">

                        {item.total_quantity}

                        {" "}

                        {item.unit}

                      </td>



                     <td className="border-2 border-black px-2 py-2 text-center">

                        {item.used_quantity}

                        {" "}

                        {item.unit}

                      </td>



                      <td className="border-2 border-black px-2 py-2 text-center">
    <span className="font-bold text-green-700">
    {item.remaining} {item.unit}
</span>
</td>


                    </tr>


                  ))


                )


              }


              </tbody>


            </table>


          )


        }


      </div>


    </div>

  );

}