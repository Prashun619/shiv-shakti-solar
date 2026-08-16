import { generateProjectNumber } from "./projectsService";
import { supabase } from "./supabase";



/* ===========================
   GET CUSTOMERS
=========================== */

export async function getCustomers(search = "") {


  let query =
    supabase
      .from("customers")
      .select("*")
      .order(
        "created_at",
        {
          ascending: false
        }
      );



  if(search){


    query =
      query.ilike(
        "customer_name",
        `%${search}%`
      );


  }



  const {
    data,
    error
  } = await query;




  if(error)
    throw error;



  return data || [];


}

export async function getCustomerWithProject(id){

  const { data: customer, error } =
  await supabase
  .from("customers")
  .select("*")
  .eq("id", id)
  .single();

  if(error) throw error;

  const { data: project } =
  await supabase
  .from("projects")
  .select("*")
  .eq("customer_id", id)
  .single();

 return {
  ...customer,

  project_id: project?.id || null,
  project_no: project?.project_no || "",

  project_size: project?.project_size || "",
  total_amount: project?.total_amount || 0,

  received: project?.received || 0,
  remaining: project?.remaining || 0,

  status: project?.status || "Pending",

  remarks: project?.remarks || "",
};

}





/* ===========================
   ADD CUSTOMER
=========================== */

export async function addCustomer(customer) {

  // Save customer
  const customerPayload = {

    customer_name: customer.customer_name,
    mobile: customer.mobile,
    email: customer.email,
    address: customer.address,
    location: customer.location,
    plant_size: customer.plant_size,
    payment_type: customer.payment_type,

  };

  const {
    data: newCustomer,
    error: customerError
  } = await supabase
    .from("customers")
    .insert(customerPayload)
    .select()
    .single();

  if (customerError)
    throw customerError;

  // Automatically create project

const generatedProjectNo = await generateProjectNumber();

console.log("GENERATED PROJECT NO:", generatedProjectNo);


const {
  data: newProject,
  error: projectError
} = await supabase
  .from("projects")
  .insert({

    customer_id: newCustomer.id,

    project_no: generatedProjectNo,

    project_size: customer.plant_size,

    total_amount:
      Number(customer.total_amount || 0),

    initial_received: 0,

    received: 0,

    remaining:
      Number(customer.total_amount || 0),

    status:
      Number(customer.total_amount || 0) > 0
      ? "Pending"
      : "Pending",

    remarks:
      customer.remarks || "",

  })
  .select()
  .single();


if (projectError)
  throw projectError;

  

  return newCustomer;
   }


/* ===========================
   UPDATE CUSTOMER
=========================== */

export async function updateCustomer(
  id,
  customer
){

  // Update customer
  const customerPayload = {

    customer_name: customer.customer_name,

    mobile: customer.mobile,

    email: customer.email,

    address: customer.address,

    location: customer.location,

    plant_size: customer.plant_size,

    payment_type: customer.payment_type,

  };

  const {
    data,
    error
  } = await supabase
    .from("customers")
    .update(customerPayload)
    .eq("id", id)
    .select()
    .single();

  if(error)
    throw error;

  // Get existing project
  const {
    data: project,
    error: projectError
  } = await supabase
    .from("projects")
    .select("*")
    .eq("customer_id", id)
    .single();

  if(projectError)
    throw projectError;

  // Update project
  const updatePayload = {

  project_size: customer.plant_size,

  total_amount:
    Number(customer.total_amount || 0),

  remarks:
    customer.remarks || "",

};

  const {
    error: updateProjectError
  } = await supabase
    .from("projects")
    .update(updatePayload)
    .eq("id", project.id);

  if(updateProjectError)
    throw updateProjectError;

  return data;

}

/* ===========================
   DELETE CUSTOMER
=========================== */

export async function deleteCustomer(id){


  const {
    error
  } = await supabase

    .from("customers")

    .delete()

    .eq(
      "id",
      id
    );




  if(error)
    throw error;


}