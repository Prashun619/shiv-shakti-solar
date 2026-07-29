import { supabase } from "./supabase";



/* ==============================
   GET ALL BILLING ENTRIES
============================== */

export async function getBilling(){

  const {data,error}=await supabase

    .from("billing")

    .select("*")

    .order("date",{
      ascending:false
    });



  if(error)
    throw error;


  return data;

}





/* ==============================
   ADD BILLING
============================== */

export async function addBilling(entry){


  const {data,error}=await supabase

    .from("billing")

    .insert([entry])

    .select();



  if(error)
    throw error;


  return data[0];

}







/* ==============================
   DELETE BILLING
============================== */

export async function deleteBilling(id){


  const {error}=await supabase

    .from("billing")

    .delete()

    .eq("id",id);



  if(error)
    throw error;


}







/* ==============================
   UPDATE BILLING
============================== */

export async function updateBilling(id,entry){


  const {data,error}=await supabase

    .from("billing")

    .update(entry)

    .eq("id",id)

    .select();



  if(error)
    throw error;


  return data[0];

}