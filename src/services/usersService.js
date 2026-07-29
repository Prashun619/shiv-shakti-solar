import { supabase } from "./supabase";

export async function getUsers() {

  const { data, error } = await supabase
    .from("users")
    .select("*")
    .order("full_name");

  if (error) throw error;

  return data || [];
}

export async function createUser(user) {

  const { data, error } =
    await supabase.functions.invoke(
      "create-user",
      {
        body: user,
      }
    );


  if(error){

    throw error;

  }


  if(data?.error){

    throw new Error(
      data.error
    );

  }


  return data;

}

export async function updateUser(id, values) {

  const { error } = await supabase
    .from("users")
    .update(values)
    .eq("id", id);

  if (error) throw error;
}

export async function deleteUser(id) {

  const { data, error } =
    await supabase.functions.invoke(
      "delete-user",
      {
        body: { id },
      }
    );

  if (error) {

    throw error;

  }

  if (data?.error) {

    throw new Error(data.error);

  }

  return data;

}

export async function changePassword(
  id,
  newPassword
) {

  const { data, error } =
    await supabase.functions.invoke(
      "change-password",
      {
        body: {
          id,
          newPassword,
        },
      }
    );

  if (error) {

    throw error;

  }

  if (data?.error) {

    throw new Error(data.error);

  }

  return data;

}
export async function resetUserPassword(
  userId,
  newPassword
) {

  const { data, error } =
    await supabase.functions.invoke(
      "reset-user-password",
      {
        body: {
          userId,
          newPassword,
        },
      }
    );


  if(error){

    throw error;

  }


  if(data?.error){

    throw new Error(
      data.error
    );

  }


  return data;

}