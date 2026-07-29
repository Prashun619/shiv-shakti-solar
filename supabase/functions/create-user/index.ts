import "@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";


Deno.serve(async (req) => {


  // CORS
  if (req.method === "OPTIONS") {

    return new Response(
      "ok",
      {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Headers":
            "authorization, x-client-info, apikey, content-type",
        },
      }
    );

  }



  try {


    const body = await req.json();


    const {

      full_name,
      username,
      password,
      role,

      customers,
      projects,
      inventory,
      used_inventory,
      payments,
      reports,
      quotations,
      settings,

    } = body;



    if (
      !full_name ||
      !username ||
      !password
    ) {

      return new Response(

        JSON.stringify({
          error:"Missing required fields"
        }),

        {
          status:400,
          headers:{
            "Content-Type":"application/json",
            "Access-Control-Allow-Origin":"*",
          }
        }

      );

    }



    const supabaseAdmin =
      createClient(

        Deno.env.get(
          "SUPABASE_URL"
        )!,

        Deno.env.get(
          "SUPABASE_SERVICE_ROLE_KEY"
        )!

      );




    // Create Supabase Auth User

    const {
      data:userData,
      error:userError

    } =
    await supabaseAdmin.auth.admin.createUser({

      email:
        `${username}@shivshaktisolar.local`,

      password,

      email_confirm:true,

    });



    if(userError){

      throw userError;

    }




    // Insert ERP User

    const {
      error:dbError

    } =
    await supabaseAdmin

      .from("users")

      .insert({

        id:userData.user.id,

        full_name,

        username,

        email:
          `${username}@shivshaktisolar.local`,

        password,

        role,

        active:true,


        customers:
          customers ?? false,

        projects:
          projects ?? false,

        inventory:
          inventory ?? false,

        used_inventory:
          used_inventory ?? false,

        payments:
          payments ?? false,

        reports:
          reports ?? false,

        quotations:
          quotations ?? false,

        settings:
          settings ?? false,

      });




    if(dbError){

      throw dbError;

    }




    return new Response(

      JSON.stringify({

        success:true,

        message:
          "User created successfully"

      }),

      {
        headers:{
          "Content-Type":"application/json",
          "Access-Control-Allow-Origin":"*",
        }
      }

    );



  }

  catch(error){

  const message =
    error instanceof Error
      ? error.message
      : String(error);


  return new Response(

    JSON.stringify({

      error: message

    }),

    {
      status:500,

      headers:{
        "Content-Type":"application/json",
        "Access-Control-Allow-Origin":"*",
      }
    }

  );

}


});