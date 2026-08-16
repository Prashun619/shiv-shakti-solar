import { useEffect, useState } from "react";

import ProjectModal from "../components/ProjectModal";
import PaymentModal from "../components/PaymentModal";
import KpiCard from "../components/ui/KpiCard";
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

const totalProjects = projects.length;

const completedProjects = projects.filter(
  (p) => p.status === "Completed"
).length;

const pendingProjects = projects.filter(
  (p) => p.status !== "Completed"
).length;

const totalRevenue = projects.reduce(
  (sum, p) => sum + Number(p.total_amount || 0),
  0
);

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

    <div className="flex justify-between items-center mb-6">

  <div>
    <h1 className="text-2xl font-bold">
      Projects
    </h1>

    <p className="text-gray-500">
      Customer Project Management
    </p>
  </div>


  <div className="flex gap-3">

<button
  onClick={() => setShowProjectModal(true)}
  className="px-4 py-2 bg-blue-600 text-white rounded-lg"
>
  + Add Project
</button>


    <button
      onClick={() => setShowPaymentModal(true)}
      className="px-4 py-2 rounded-lg bg-green-600 text-white"
    >
      + Add Payment
    </button>

  </div>

</div>
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-5 mb-6">

  <input
    className="w-full rounded-xl border-2 border-slate-200 bg-slate-50 px-5 py-3 outline-none transition-all duration-300 focus:border-indigo-500 focus:bg-white"
    placeholder="Search Project Number or Customer..."
    value={search}
    onChange={(e)=>setSearch(e.target.value)}
  />

</div>

{/* KPI Cards */}

<div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">

  <div className="scale-90 origin-top">
    <KpiCard
      title="Projects"
      value={totalProjects}
      color="blue"
    />
  </div>

  <div className="scale-90 origin-top">
    <KpiCard
      title="Completed"
      value={completedProjects}
      color="green"
    />
  </div>

  <div className="scale-90 origin-top">
    <KpiCard
      title="Pending"
      value={pendingProjects}
      color="orange"
    />
  </div>

  <div className="scale-90 origin-top">
    <KpiCard
      title="Revenue"
      value={`₹${totalRevenue.toLocaleString()}`}
      color="purple"
    />
  </div>

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

<td className="px-6 py-4">

  <div className="flex items-center gap-3">

    <div className="w-11 h-11 rounded-full bg-gradient-to-r from-indigo-600 to-blue-500 text-white flex items-center justify-center font-bold text-lg shadow-md">

      {p.customers?.customer_name?.charAt(0).toUpperCase()}

    </div>

    <div>

      <p className="font-semibold text-slate-800">
        {p.customers?.customer_name}
      </p>

      <p className="text-xs text-slate-500">
        {p.project_no}
      </p>

    </div>

  </div>

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



           <td className="px-6 py-4 text-center">

<span
className={`inline-flex items-center px-4 py-1.5 rounded-full text-xs font-bold shadow-sm ${
p.status === "Completed"
? "bg-green-100 text-green-700 border border-green-200"
: p.status === "In Progress"
? "bg-yellow-100 text-yellow-700 border border-yellow-200"
: "bg-red-100 text-red-700 border border-red-200"
}`}
>

{p.status}

</span>

</td>





              <td className="border border-slate-400 px-3 py-3 align-middle">

      <div className="flex justify-center gap-2">

{/* Edit */}
<button
  onClick={async () => {
    setEditingProject(p);
    setShowProjectModal(true);
  }}
  title="Edit Project"
  className="w-10 h-10 rounded-full bg-sky-100 text-sky-700 hover:bg-sky-600 hover:text-white transition-all duration-200 flex items-center justify-center shadow"
>
  ✏️
</button>



{/* Payment History */}
<button
  onClick={() => openPayments(p)}
  title="Payment History"
  className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 hover:bg-indigo-600 hover:text-white transition-all duration-200 flex items-center justify-center shadow"
>
  📄
</button>

{/* Delete */}
<button
  onClick={() => handleDeleteProject(p.id)}
  title="Delete Project"
  className="w-10 h-10 rounded-full bg-red-100 text-red-700 hover:bg-red-600 hover:text-white transition-all duration-200 flex items-center justify-center shadow"
>
  🗑️
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