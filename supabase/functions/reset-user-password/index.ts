import "@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";


const corsHeaders = {

  "Access-Control-Allow-Origin": "*",

  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",

};


Deno.serve(async (req) => {


  if(req.method === "OPTIONS"){

    return new Response(
      "ok",
      {
        headers:corsHeaders
      }
    );

  }


  try{


    const {
      userId,
      newPassword

    } = await req.json();



    if(!userId || !newPassword){

      return Response.json(

        {
          error:"User ID and password required"
        },

        {
          status:400,
          headers:corsHeaders
        }

      );

    }



    const supabaseAdmin =
      createClient(

        Deno.env.get("SUPABASE_URL")!,

        Deno.env.get(
          "SUPABASE_SERVICE_ROLE_KEY"
        )!

      );



    const {

      error

    } = await supabaseAdmin.auth.admin.updateUserById(

      userId,

      {

        password:newPassword

      }

    );



    if(error){

      throw error;

    }



    return Response.json(

      {
        success:true
      },

      {
        headers:corsHeaders
      }

    );


  }

  catch(error:any){


    return Response.json(

      {
        error:error.message
      },

      {

        status:500,

        headers:corsHeaders

      }

    );


  }


});