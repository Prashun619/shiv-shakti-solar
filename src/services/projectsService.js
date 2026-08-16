import { supabase } from "./supabase";



/* ===========================
   Generate Project Number
=========================== */

export async function generateProjectNumber() {

  const year =
    new Date().getFullYear();


  const { data, error } =
    await supabase
      .from("projects")
      .select("project_no")
      .like(
        "project_no",
        `PRJ-${year}-%`
      )
      .order(
        "project_no",
        {
          ascending:false
        }
      )
      .limit(1);



  if(error)
    throw error;



  let next = 1;



  if(data && data.length > 0){

    const last =
      data[0].project_no;


    const lastNumber =
      parseInt(
        last.split("-")[2],
        10
      );


    next =
      lastNumber + 1;

  }



  return `PRJ-${year}-${String(next).padStart(4,"0")}`;

}







/* ===========================
   Remaining Amount
=========================== */

export function calculateRemainingAmount(
  total = 0,
  received = 0
){

  const t =
    Number(total) || 0;


  const r =
    Number(received) || 0;



  return Math.max(
    t-r,
    0
  );

}







/* ===========================
   Status
=========================== */

export function calculateProjectStatus(
  total = 0,
  received = 0
){

  const remaining =
    calculateRemainingAmount(
      total,
      received
    );


  if(
    remaining === 0 &&
    Number(total)>0
  ){

    return "Completed";

  }


  return "Pending";

}







/* ===========================
   Get All Projects
=========================== */

export async function getProjects() {

  const { data, error } = await supabase
    .from("projects")
    .select(`
      *,
      customers(
        id,
        customer_name
      )
    `)
    .order("project_no", {
      ascending: true
    });


  if (error) throw error;

  return data || [];
}







/* ===========================
   Get Single Project
=========================== */

export async function getProject(id){

  const {data,error} =
    await supabase
      .from("projects")
      .select(`
        *,
        customers(
          id,
          customer_name
        )
      `)
      .eq(
        "id",
        id
      )
      .single();



  if(error)
    throw error;



  return data;

}







/* ===========================
   Create Project
=========================== */

export async function createProject(project){


  const project_no =
    await generateProjectNumber();



  const total =
    Number(project.total_amount || 0);


  const received =
    Number(project.received || 0);



  const payload = {

  ...project,

  project_no,

  total_amount: total,

  // Store the advance received at project creation
  initial_received: received,

  // Current received starts with the advance
  received: received,

  remaining: calculateRemainingAmount(
    total,
    received
  ),

  status: calculateProjectStatus(
    total,
    received
  )

};





  const {data,error} =
    await supabase
      .from("projects")
      .insert(payload)
      .select(`
        *,
        customers(
          id,
          customer_name
        )
      `)
      .single();



  if (error)
  throw error;


// ======================================
// LINK CUSTOMER TO PROJECT
// ======================================
if (data?.customer_id) {

  const { error: customerError } =
    await supabase
      .from("customers")
      .update({
        project_id: data.id,
      })
      .eq("id", data.customer_id);

  if (customerError)
    throw customerError;

}


return data;

}







/* ===========================
   Update Project
=========================== */

export async function updateProject(
  id,
  project
){


  const total =
    Number(project.total_amount || 0);


  const received =
    Number(project.received || 0);



  const payload = {

  ...project,

  total_amount: total,

  // Keep the initial advance in sync when editing a project
  initial_received: received,

  received: received,

  remaining: calculateRemainingAmount(
    total,
    received
  ),

  status: calculateProjectStatus(
    total,
    received
  )

};





  const {data,error} =
    await supabase
      .from("projects")
      .update(payload)
      .eq(
        "id",
        id
      )
      .select(`
        *,
        customers(
          id,
          customer_name
        )
      `)
      .single();



  if(error)
    throw error;



  return data;

}







/* ===========================
   Delete Project
=========================== */

export async function deleteProject(id){


  const {error} =
    await supabase
      .from("projects")
      .delete()
      .eq(
        "id",
        id
      );



  if(error)
    throw error;

}







/* ===========================
   Search Projects
=========================== */

export async function searchProjects(keyword){


  const projects =
    await getProjects();



  const search =
    keyword.toLowerCase();




  return projects.filter((p)=>{


    return (

      p.project_no
        ?.toLowerCase()
        .includes(search)


      ||

      p.customers?.customer_name
        ?.toLowerCase()
        .includes(search)

    );


  });


}