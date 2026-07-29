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







/* ===========================
   ADD CUSTOMER
=========================== */

export async function addCustomer(customer){


  const payload = {

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

    .insert(payload)

    .select()

    .single();






  if(error)
    throw error;



  return data;


}







/* ===========================
   UPDATE CUSTOMER
=========================== */

export async function updateCustomer(
  id,
  customer
){


  const payload = {

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

    .update(payload)

    .eq(
      "id",
      id
    )

    .select()

    .single();







  if(error)
    throw error;



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