import { useEffect, useState } from "react";

import ProjectModal from "../components/ProjectModal";
import PaymentModal from "../components/PaymentModal";

import {
  getProjects,
  deleteProject,
} from "../services/projectsService";

import {
  getProjectPayments,
  deletePayment,
} from "../services/paymentsService";


export default function Projects() {

  const [projects, setProjects] = useState([]);

  const [search, setSearch] = useState("");

  const [showProjectModal, setShowProjectModal] =
    useState(false);

  const [showPaymentModal, setShowPaymentModal] =
    useState(false);


  const [editingProject, setEditingProject] =
    useState(null);


  const [selectedProject, setSelectedProject] =
    useState(null);


  const [payments, setPayments] =
    useState([]);



  useEffect(() => {

    loadProjects();

  }, []);




  async function loadProjects() {

    try {

      const data =
        await getProjects();

      setProjects(data);

    } catch(error) {

      console.log(error);

    }

  }





  async function refreshProjects() {

  const data = await getProjects();

  setProjects(data);

  if (selectedProject) {

    const updatedProject = data.find(
      (p) => p.id === selectedProject.id
    );

    if (updatedProject) {
      setSelectedProject(updatedProject);
    }

  }

}





  async function openPayments(project) {

    setSelectedProject(project);


    const data =
      await getProjectPayments(
        project.id
      );


    setPayments(data);

  }






  async function handleDeleteProject(id) {


    const confirm =
      window.confirm(
        "Delete this project?"
      );


    if(!confirm)
      return;



    try {

      await deleteProject(id);


      setProjects(
        projects.filter(
          p => p.id !== id
        )
      );


    } catch(error) {

      console.log(error);

    }

  }






  async function handleDeletePayment(id) {


    try {


      await deletePayment(
        id,
        selectedProject.id
      );



      const data =
        await getProjectPayments(
          selectedProject.id
        );


      setPayments(data);



      refreshProjects();



    } catch(error) {

      console.log(error);

    }

  }







  const filteredProjects =
    projects.filter((p)=>{


      const key =
        search.toLowerCase();



      return (

        p.project_no
        ?.toLowerCase()
        .includes(key)


        ||

        p.customers?.customer_name
        ?.toLowerCase()
        .includes(key)

      );


    });







  return (

   <div className="mb-6 rounded-3xl bg-gradient-to-r from-indigo-700 via-blue-600 to-cyan-500 p-6 shadow-2xl">

    <div className="flex justify-between items-center">

        <div>

            <h1 className="text-4xl font-extrabold text-white tracking-wide">
                Projects
            </h1>

            <p className="text-blue-100 mt-2 text-lg">
                Customer Project Management
            </p>

        </div>

        <button
            onClick={()=>{
                setEditingProject(null);
                setShowProjectModal(true);
            }}
            className="bg-white text-indigo-700 font-bold px-6 py-3 rounded-xl shadow-lg hover:shadow-2xl hover:scale-105 transition-all duration-300"
        >
            + Add Project
        </button>

    </div>





      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-5 mb-6">

  <input
    className="w-full rounded-xl border-2 border-slate-200 bg-slate-50 px-5 py-3 outline-none transition-all duration-300 focus:border-indigo-500 focus:bg-white"
    placeholder="Search Project Number or Customer..."
    value={search}
    onChange={(e)=>setSearch(e.target.value)}
  />

</div>







      <div className="overflow-x-auto rounded-2xl bg-white shadow-2xl border border-slate-200">


      <table className="w-full table-fixed border-collapse">

<colgroup>
  <col className="w-[150px]" />
  <col className="w-[80px]" />
  <col className="w-[120px]" />
  <col className="w-[120px]" />
  <col className="w-[120px]" />
  <col className="w-[100px]" />
  <col className="w-[220px]" />
</colgroup>

        <thead className="bg-gradient-to-r from-slate-800 via-slate-700 to-slate-900 text-white">


          <tr>


            


          <th className="border border-slate-400 px-2 py-2 text-center align-middle text-sm font-bold tracking-wider w-[150px] overflow-hidden">
  Customer
</th>


            <th className="border border-slate-400 px-1 py-2 text-center align-middle text-sm font-bold  tracking-wider w-[80px]">
              Size
            </th>


            <th className="border border-slate-400 px-1 py-2 text-center align-middle text-sm font-bold  tracking-wider w-[120px]">
              Amount
            </th>


            <th className="border border-slate-400 px-1 py-2 text-center align-middle text-sm font-bold  tracking-wider w-[120px]">
              Received
            </th>


            <th className="border border-slate-400 px-1 py-2 text-center align-middle text-sm font-bold  tracking-wider w-[120px]">
              Remaining
            </th>


            <th className="border border-slate-400 px-1 py-2 text-center align-middle text-sm font-bold  tracking-wider w-[100px]">
              Status
            </th>


            <th className="border border-slate-400 px-1 py-2 text-center align-middle text-sm font-bold  tracking-wider w-[220px]">
    Action
</th>
             


          </tr>


        </thead>






        <tbody>


        {filteredProjects.map((p)=>(


          <tr
            key={p.id}
            className="border border-slate-400 hover:bg-indigo-50 transition-all duration-300"
          >



           



            <td className="border border-slate-400 px-2 py-2 text-center align-middle whitespace-nowrap overflow-hidden text-ellipsis">
  {p.customers?.customer_name}
</td>



            <td className="border border-slate-400 px-3 py-3 text-center align-middle whitespace-nowrap w-24">
  {p.project_size}
  {p.project_size && !p.project_size.toString().toUpperCase().includes("KW")
    ? " KW"
    : ""}
</td>



            <td className="border border-slate-400 px-3 py-3 text-center align-middle whitespace-nowrap font-semibold w-44">

              ₹ {Number(
  p.total_amount || 0
).toLocaleString(undefined,{
  minimumFractionDigits:2,
  maximumFractionDigits:2
})}

            </td>



           <td className="border border-slate-400 px-3 py-3 text-center align-middle whitespace-nowrap font-semibold w-44">

              ₹ {Number(
  p.received || 0
).toLocaleString(undefined,{
  minimumFractionDigits:2,
  maximumFractionDigits:2
})}

            </td>



            <td className="border border-slate-400 px-3 py-3 text-center align-middle whitespace-nowrap font-semibold w-44">

              ₹ {Number(
  p.remaining || 0
).toLocaleString(undefined,{
  minimumFractionDigits:2,
  maximumFractionDigits:2
})}

            </td>



           <td className="border border-slate-400 px-3 py-3 text-center align-middle w-40">

    <span className="bg-blue-100 text-blue-700 px-4 py-1 rounded-full font-semibold">
        {p.status}
    </span>

</td>





              <td className="border border-slate-400 px-3 py-3 align-middle">

      <div className="flex justify-center items-center gap-1 flex-nowrap scale-90">

          <button
              onClick={async () => {

  setSelectedProject(p);

  const data = await getProjectPayments(p.id);

  setPayments(data);

  setShowPaymentModal(true);

}}
              className="bg-sky-600 hover:bg-sky-700 text-white px-2 py-1 text-xs rounded-lg shadow-md transition"
          >
              Edit
          </button>

          <button
              onClick={()=>{
                  setSelectedProject(p);
                  setShowPaymentModal(true);
              }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-2 py-1 text-xs rounded-lg shadow-md transition"
          >
            Add Payment
        </button>

        <button
            onClick={()=>openPayments(p)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-2 py-1 text-xs rounded-lg shadow-md transition"
        >
            Payments
        </button>

        <button
            onClick={()=>handleDeleteProject(p.id)}
            className="bg-rose-600 hover:bg-rose-700 text-white px-2 py-1 text-xs rounded-lg shadow-md transition"
        >
            Delete
        </button>

    </div>

</td>


          </tr>


        ))}


        </tbody>


      </table>


      </div>









      {/* PAYMENT HISTORY */}


      {selectedProject && (

        <div className="mt-6 bg-white rounded-2xl shadow-2xl border border-slate-200 p-6">


          <div className="flex justify-between mb-4">


            <h2 className="font-bold text-xl">

              Payments - {selectedProject.project_no}

            </h2>



            <b>

              Total Received: ₹{" "}

              {payments
              .reduce(
                (sum,p)=>
                sum + Number(p.amount || 0),
                0
              )
              .toLocaleString()}


            </b>


          </div>






          {payments.length === 0 ? (


            <p className="text-gray-500">
              No payments found
            </p>



          ) : (



            <table className="w-full table-fixed border border-slate-400 border-collapse">
<colgroup>
  <col className="w-[150px]" />
  <col className="w-[80px]" />
  <col className="w-[120px]" />
  <col className="w-[120px]" />
  <col className="w-[120px]" />
  <col className="w-[100px]" />
  <col className="w-[220px]" />
</colgroup>

              <thead className="bg-gradient-to-r from-indigo-700 to-blue-700 text-white">


                <tr>

                  <th className="p-2 text-left">
                    Date
                  </th>

                  <th className="p-2 text-left">
                    Amount
                  </th>

                  <th className="p-2 text-left">
                    Type
                  </th>

                  <th className="p-2 text-left">
                    Mode
                  </th>

                  <th className="p-2 text-left">
                    Reference
                  </th>

                  <th className="p-2 text-left">
                    Action
                  </th>

                </tr>


              </thead>





              <tbody>


              {payments.map((pay)=>(


                <tr
                  key={pay.id}
                  className="border-t"
                >


                  <td className="p-2">
                    {pay.payment_date}
                  </td>



                  <td className="p-2">
                    ₹ {Number(
                      pay.amount || 0
                    ).toLocaleString()}
                  </td>



                  <td className="p-2">
                    {pay.payment_type}
                  </td>



                  <td className="p-2">
                    {pay.payment_mode}
                  </td>



                  <td className="p-2">
                    {pay.reference_no || "-"}
                  </td>



                  <td className="p-2">


                    <button

                      onClick={()=>
                        handleDeletePayment(pay.id)
                      }

                      className="bg-red-600 text-white px-3 py-1 rounded"

                    >
                      Delete
                    </button>


                  </td>



                </tr>


              ))}


              </tbody>


            </table>


          )}


        </div>

      )}








      <ProjectModal

        open={showProjectModal}

        onClose={()=>
          setShowProjectModal(false)
        }

        project={editingProject}

        onSaved={refreshProjects}

      />






      <PaymentModal

  open={showPaymentModal}

  onClose={()=>
    setShowPaymentModal(false)
  }

  projectId={
    selectedProject?.id
  }

  onSaved={async ()=>{

  await refreshProjects();

  if(selectedProject){

    const data =
      await getProjectPayments(
        selectedProject.id
      );

    setPayments(data);

  }

}}

/>




    </div>

  );

}