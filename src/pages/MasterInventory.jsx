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

      item.product_name
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

      <div className="mb-2 rounded-xl bg-gradient-to-r from-indigo-700 via-blue-600 to-cyan-500 p-6 shadow-2xl">

  <div className="flex justify-between items-center">

    <div>

      <h1 className="text-2xl font-extrabold text-white tracking-wide">
        Master Inventory
      </h1>

      <p className="text-blue-100 mt text-sm">
        Overall Product Stock Summary
      </p>

    </div>

    <div className="text-right">

      <p className="text-blue-100">
        Total Stock Value
      </p>

      <h2 className="text-3xl font-bold text-white">
        ₹ {Number(totalStockValue).toLocaleString(undefined,{
          minimumFractionDigits:2,
          maximumFractionDigits:2
        })}
      </h2>

    </div>

  </div>

</div>




      {/* SEARCH */}


     <div className="sm-cyan rounded-xl shadow-xl border border-slate-200 p-4 mb-5">

    <input
        type="text"
        placeholder="Search Product or Category..."
        value={search}
        onChange={(e)=>setSearch(e.target.value)}
        className="w-full rounded-xl border-2 border-slate-200 bg-slate-50 px-4 py-2 outline-none focus:border-indigo-500 focus:bg-white"
    />

</div>





      {/* TABLE */}


      <div className="overflow-hidden rounded-xl bg-white shadow-2xl border border-slate-200">


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

            <table className="w-full overflow-hidden rounded-2xl text-xs">


              <thead className="bg-gradient-to-r from-slate-800 via-slate-700 to-slate-900 text-white">


                <tr>


                  <th className="border border-slate-200 px-2 py-1 text-center text-xs font-bold tracking-wider">

                    Product

                  </th>



                  <th className="border border-slate-200 px-2 py-1 text-center text-xs font-bold tracking-wider">

                    Category

                  </th>



                   <th className="border border-slate-200 px-2 py-1 text-center text-xs font-bold tracking-wider">

                    Total Quantity

                  </th>



                   <th className="border border-slate-200 px-2 py-1 text-center text-xs font-bold tracking-wider">

                    Used Quantity

                  </th>



                   <th className="border border-slate-200 px-2 py-1 text-center text-xs font-bold tracking-wider">

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
className="py-16 text-center text-slate-500 text-lg font-medium"
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


                      <td className="border border-slate-300 px-2 py-1 text-center font-bold text-xs text-slate-800">
    {item.product_name}
</td>



                      <td className="border border-slate-300 px-2 py-1 text-center text-xs">

                        {item.category}

                      </td>



                      <td className="border border-slate-300 px-2 py-1 text-center text-xs">

                        {item.total_quantity}

                        {" "}

                        {item.unit}

                      </td>



                     <td className="border border-slate-300 px-2 py-1 text-center text-xs">

                        {item.used_quantity}

                        {" "}

                        {item.unit}

                      </td>



                      <td className="border border-slate-300 p-3 text-center">
    <span className="bg-green-100 text-green-700 px-4 py-1 rounded-full font-bold">
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