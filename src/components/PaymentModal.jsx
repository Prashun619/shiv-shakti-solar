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

const [customers, setCustomers] = useState([]);

const [selectedCustomer, setSelectedCustomer] = useState("");

const [selectedProject, setSelectedProject] = useState("");

useEffect(() => {

  if (open) {


    loadCustomers();


    setPaymentDate(
      new Date().toISOString().split("T")[0]
    );

    setAmount("");

    setPaymentType("Installment");

    setPaymentMode("Cash");

    setReferenceNo("");

    setRemarks("");

    setSelectedCustomer("");

    setSelectedProject("");


  }

}, [open]);

async function loadCustomers(){

  try {

    // Get customers
    const { data: customersData, error: customerError } =
      await supabase
        .from("customers")
        .select(`
          id,
          customer_name
        `)
        .order("customer_name");


    if(customerError)
      throw customerError;



    // Get projects
    const { data: projectsData, error: projectError } =
      await supabase
        .from("projects")
        .select(`
          id,
          project_no,
          customer_id
        `);


    if(projectError)
      throw projectError;



    // Attach projects manually
    const finalCustomers =
      customersData.map((customer)=>({

        ...customer,

        projects:
          projectsData.filter(
            (project)=>
              project.customer_id === customer.id
          )

      }));


    setCustomers(finalCustomers);


  }
  
  catch(error){

  console.error("FULL CUSTOMER LOAD ERROR:", error);

  alert(
    error.message || "Failed to load customers."
  );

}

}

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


        project_id: projectId || selectedProject,


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


    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">


      <div className="bg-white w-full max-w-md rounded-xl p-6 max-h-[90vh] overflow-y-auto">



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
Customer
</label>


<select

className="border p-2 w-full rounded"

value={selectedCustomer}

onChange={(e)=>{

const customerId = e.target.value;

setSelectedCustomer(customerId);


const customer = customers.find(
(c)=>c.id === customerId
);


const project = customer?.projects?.[0];



setSelectedProject(
  project?.id || ""
);


}}

>


<option value="">
Select Customer
</option>


{customers.map((customer)=>(

<option
key={customer.id}
value={customer.id}
>

{customer.customer_name}

</option>

))}


</select>


</div>

<div>

<label>
Project No
</label>


<input

type="text"

className="border p-2 w-full rounded bg-slate-50"

value={
  customers
    .find(
      (customer)=>customer.id === selectedCustomer
    )
    ?.projects?.[0]?.project_no || ""
}

readOnly

placeholder="Select customer first"

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