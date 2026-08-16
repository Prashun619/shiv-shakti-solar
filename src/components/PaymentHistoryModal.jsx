import { useEffect, useState } from "react";
import { supabase } from "../services/supabase";


export default function PaymentHistoryModal({
  projectId,
  closeModal
}) {


  const [history,setHistory] = useState([]);



  useEffect(()=>{

    loadHistory();

  },[]);




  async function loadHistory(){


    const {data,error}=await supabase

      .from("payments")

      .select(`
        payment_date,
        amount,
        payment_type,
        payment_mode
      `)

      .eq(
        "project_id",
        projectId
      )

      .order(
        "payment_date",
        {
          ascending:false
        }
      );



    if(error){

      console.log(error);
      return;

    }


    setHistory(data || []);


  }






  return (

    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">


      <div className="bg-white rounded-lg p-6 w-3/4">


        <div className="flex justify-between mb-5">


          <h2 className="text-xl font-bold">
            Payment History
          </h2>


          <button
            onClick={closeModal}
          >
            ✕
          </button>


        </div>





        <table className="w-full border">


          <thead>

            <tr>

              <th className="border p-2">
                Date
              </th>

              <th className="border p-2">
                Amount
              </th>

              <th className="border p-2">
                Type
              </th>

              <th className="border p-2">
                Mode
              </th>


            </tr>

          </thead>



          <tbody>


          {
            history.map((item,index)=>(


              <tr key={index}>


                <td className="border p-2">
  {new Date(item.payment_date).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  })}
</td>


                <td className="border p-2">
                  ₹ {Number(item.amount).toFixed(2)}
                </td>


                <td className="border p-2">
                  {item.payment_type}
                </td>


                <td className="border p-2">
                  {item.payment_mode}
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