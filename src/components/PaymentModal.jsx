import { useEffect, useState } from "react";
import { addPayment } from "../services/paymentsService";
import { supabase } from "../services/supabase";


export default function PaymentModal({
  open,
  onClose,
  projectId,
  onSaved,
}) {


  const [paymentDate, setPaymentDate] =
    useState(
      new Date()
      .toISOString()
      .split("T")[0]
    );


  const [amount, setAmount] =
    useState("");


  const [paymentType, setPaymentType] =
  useState("Installment");


  const [paymentMode, setPaymentMode] =
    useState("Cash");


  const [referenceNo, setReferenceNo] =
    useState("");


  const [remarks, setRemarks] =
    useState("");


  const [loading, setLoading] =
    useState(false);


useEffect(() => {

  if (open) {

    setPaymentDate(
      new Date().toISOString().split("T")[0]
    );

    setAmount("");

    setPaymentType("Installment");

    setPaymentMode("Cash");

    setReferenceNo("");

    setRemarks("");

  }

}, [open]);


  async function handleSubmit(e) {

    e.preventDefault();



    if(!amount){

      alert(
        "Enter payment amount"
      );

      return;

    }




    try {


      setLoading(true);



      const payment = {


        project_id: projectId,


        payment_date:
          paymentDate,


        amount:
          Number(amount),


        payment_type:
          paymentType,


        payment_mode:
          paymentMode,


        reference_no:
          referenceNo,


        remarks,

      };


console.log("Saving Payment:", payment);
console.log("Payment Payload Before Save:", payment);
      const data =
  await addPayment(payment);



      onSaved(data);



      onClose();



    } catch(error) {


      console.log(error);

      alert(error.message);



    } finally {


      setLoading(false);


    }


  }






  if(!open)
    return null;





  return (


    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">


      <div className="bg-white w-full max-w-md rounded-xl p-6">



        <h2 className="text-xl font-bold mb-4">
          Add Payment
        </h2>





        <form
          onSubmit={handleSubmit}
          className="space-y-4"
        >





          <div>

            <label>
              Payment Date
            </label>


            <input

              type="date"

              className="border p-2 w-full rounded"

              value={paymentDate}

              onChange={(e)=>
                    setPaymentDate(
                  e.target.value
                )
              }

            />

          </div>






          <div>

            <label>
              Amount
            </label>


            <input

              type="number"

              className="border p-2 w-full rounded"

              value={amount}

              onChange={(e)=>
                setAmount(
                  e.target.value
                )
              }

            />

          </div>






          <div>

            <label>
              Payment Type
            </label>


            <select

  className="border p-2 w-full rounded"

  value={paymentType}

  onChange={(e)=>
    setPaymentType(
      e.target.value
    )
  }

>

  <option>
    Installment
  </option>

  <option>
    Final Payment
  </option>


</select>


          </div>







          <div>

            <label>
              Payment Mode
            </label>


            <select

              className="border p-2 w-full rounded"

              value={paymentMode}

              onChange={(e)=>
                setPaymentMode(
                  e.target.value
                )
              }

            >

              <option>
                Cash
              </option>


              <option>
                UPI
              </option>


              <option>
                Bank Transfer
              </option>


              <option>
                Cheque
              </option>


            </select>


          </div>







          <div>

            <label>
              Reference No
            </label>


            <input

              className="border p-2 w-full rounded"

              value={referenceNo}

              onChange={(e)=>
                setReferenceNo(
                  e.target.value
                )
              }

            />

          </div>







          <div>

            <label>
              Remarks
            </label>


            <textarea

              className="border p-2 w-full rounded"

              value={remarks}

              onChange={(e)=>
                setRemarks(
                  e.target.value
                )
              }

            />

          </div>








          <div className="flex justify-end gap-3">


            <button

              type="button"

              onClick={onClose}

              className="border px-4 py-2 rounded"

            >
              Cancel
            </button>




            <button

              type="submit"

              disabled={loading}

              className="bg-green-600 text-white px-4 py-2 rounded"

            >

              {loading
              ? "Saving..."
              : "Save Payment"}


            </button>



          </div>






        </form>


      </div>


    </div>

  );


}