import { supabase } from "./supabase";


// Get company settings

export async function getCompanySettings() {

  const { data, error } =
    await supabase
      .from("company_settings")
      .select("*")
      .limit(1)
      .single();


  if (error && error.code !== "PGRST116") {
    throw error;
  }


  return data || null;

}



// Save / Update company settings

export async function saveCompanySettings(settings) {


  const existing =
    await getCompanySettings();



  let result;



  if(existing){


    result =
      await supabase
        .from("company_settings")
        .update(settings)
        .eq(
          "id",
          existing.id
        )
        .select()
        .single();


  }
  else{


    result =
      await supabase
        .from("company_settings")
        .insert([settings])
        .select()
        .single();


  }



  if(result.error)
    throw result.error;



  return result.data;

}

export async function uploadCompanyFile(file, folder) {


  if(!file)
    return null;



  const fileExt =
    file.name.split(".").pop();



  const fileName =
    `${folder}-${Date.now()}.${fileExt}`;



  const filePath =
    `${folder}/${fileName}`;



  const { error: uploadError } =
    await supabase
      .storage
      .from("company-assets")
      .upload(
        filePath,
        file
      );



  if(uploadError)
    throw uploadError;



  const { data } =
    supabase
      .storage
      .from("company-assets")
      .getPublicUrl(
        filePath
      );



  return data.publicUrl;

}