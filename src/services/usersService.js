import { supabase } from "./supabase";

export async function getUsers() {

  const { data, error } = await supabase
    .from("users")
    .select(`
      id,
      full_name,
      username,
      email,
      role,
      active,
      customers,
      projects,
      inventory,
      used_inventory,
      payments,
      reports,
      quotations,
      settings,
      billing,
      investments,
      invoices
    `)
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

  if (error) {
    console.error("CREATE USER ERROR:", error);

    let responseBody = null;

    try {
      if (error.context) {
        responseBody = await error.context.json();
        console.error(
          "CREATE USER RESPONSE:",
          responseBody
        );
      }
    } catch (parseError) {
      console.error(
        "CREATE USER RESPONSE PARSE ERROR:",
        parseError
      );
    }

    const message =
      responseBody?.error?.message ||
      responseBody?.error ||
      error.message ||
      "Unable to create user.";

    throw new Error(
      typeof message === "string"
        ? message
        : JSON.stringify(message)
    );
  }

  if (data?.error) {
    const message =
      data.error?.message ||
      data.error;

    throw new Error(
      typeof message === "string"
        ? message
        : JSON.stringify(message)
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