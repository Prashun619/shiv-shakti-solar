import { useEffect, useState } from "react";
import { supabase } from "../services/supabase";
import {
  createProject,
  updateProject,
  generateProjectNumber,
} from "../services/projectsService";

export default function ProjectModal({
  open,
  onClose,
  project,
  onSaved,
}) {
  const [customers, setCustomers] = useState([]);

  const [customerId, setCustomerId] = useState("");
  const [projectNo, setProjectNo] = useState("");
  const [projectSize, setProjectSize] = useState("");
  const [amount, setAmount] = useState("");
  const [received, setReceived] = useState("");
  const [remarks, setRemarks] = useState("");

  const [loading, setLoading] = useState(false);


  /* LOAD CUSTOMERS */
  useEffect(() => {
    if (open) {
      loadCustomers();
    }
  }, [open]);


  async function loadCustomers() {

  const { data, error } = await supabase
    .from("customers")
    .select("id, customer_name, plant_size")
    .order("customer_name");


  if (error) {
    console.log(error);
    return;
  }

  setCustomers(data || []);

}



  /* LOAD DATA */
  useEffect(() => {

    async function loadData() {

      if (project) {

        setCustomerId(project.customer_id);
        setProjectNo(project.project_no);
        setProjectSize(project.project_size || "");
        setAmount(project.total_amount || "");
        setReceived(project.received || 0);
        setRemarks(project.remarks || "");

      } else {

        setCustomerId("");
        setProjectSize("");
        setAmount("");
        setReceived("");
        setRemarks("");

        const number =
          await generateProjectNumber();

        setProjectNo(number);
      }
    }


    if (open) {
      loadData();
    }

  }, [project, open]);




  async function handleSubmit(e) {

    e.preventDefault();


    if (
      !customerId ||
      !projectSize ||
      !amount
    ) {
      alert("Please fill required fields");
      return;
    }


    try {

      setLoading(true);


      const payload = {

        customer_id: customerId,

        project_size: projectSize,

        total_amount: Number(amount),

        received: Number(received || 0),

        remarks,

      };



      let saved;


      if (project) {

        saved =
          await updateProject(
            project.id,
            payload
          );

      } else {

        saved =
          await createProject(payload);

      }


      onSaved(saved);

      onClose();


    } catch(error) {

      console.log(error);
      alert(error.message);


    } finally {

      setLoading(false);

    }

  }





  if (!open) return null;



  return (

    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">


      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6">


        <h2 className="text-xl font-bold mb-4">

          {project
            ? "Edit Project"
            : "Add Project"}

        </h2>



        <form
          onSubmit={handleSubmit}
          className="space-y-4"
        >



          <div>

            <label className="block text-sm font-medium">
              Customer
            </label>


            <select

              className="border p-2 w-full rounded"

              value={customerId}

             onChange={(e)=>{

  const id = e.target.value;

  setCustomerId(id);


  const selectedCustomer =
    customers.find(
      (c)=>c.id === id
    );


  if(selectedCustomer?.plant_size){

    setProjectSize(
      selectedCustomer.plant_size
    );

  }

}}

            >

              <option value="">
                Select Customer
              </option>


              {customers.map((c)=>(

                <option
                  key={c.id}
                  value={c.id}
                >
                  {c.customer_name}
                </option>

              ))}


            </select>


          </div>





          <div>

            <label className="block text-sm font-medium">
              Project Number
            </label>


            <input

              className="border p-2 w-full rounded bg-gray-100"

              value={projectNo}

              readOnly

            />

          </div>





          <div>

            <label className="block text-sm font-medium">
              Project Size
            </label>


            <input

              className="border p-2 w-full rounded"

              placeholder="Example: 5 KW"

              value={projectSize}

              onChange={(e)=>
                setProjectSize(e.target.value)
              }

            />

          </div>





          <div>

            <label className="block text-sm font-medium">
              Project Amount
            </label>


            <input

              type="number"

              className="border p-2 w-full rounded"

              value={amount}

              onChange={(e)=>
                setAmount(e.target.value)
              }

            />

          </div>





          <div>

            <label className="block text-sm font-medium">
              Received Amount
            </label>


            <input

              type="number"

              className="border p-2 w-full rounded"

              value={received}

              onChange={(e)=>
                setReceived(e.target.value)
              }

            />

          </div>





          <div>

            <label className="block text-sm font-medium">
              Remarks
            </label>


            <textarea

              className="border p-2 w-full rounded"

              value={remarks}

              onChange={(e)=>
                setRemarks(e.target.value)
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
                : project
                ? "Update"
                : "Save"}

            </button>


          </div>


        </form>


      </div>


    </div>

  );
}