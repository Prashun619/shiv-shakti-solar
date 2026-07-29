import "@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {

  "Access-Control-Allow-Origin": "*",

  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",

};

Deno.serve(async (req) => {

  if (req.method === "OPTIONS") {

  return new Response(

    "ok",

    {

      headers: corsHeaders,

    }

  );

}

  try {

    const { id } = await req.json();

    if (!id) {

      return Response.json(

  {

    error: "User ID is required"

  },

  {

    status: 400,

    headers: corsHeaders,

  }

);

    }

    const supabaseAdmin = createClient(

      Deno.env.get("SUPABASE_URL")!,

      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!

    );

    // Delete from Auth

    const {
  error: authError
} = await supabaseAdmin.auth.admin.deleteUser(id);

// Ignore if Auth user doesn't exist
if (
  authError &&
  !authError.message.toLowerCase().includes("not found")
) {
  throw authError;
}

    // Delete from ERP users table

    const {

      error: dbError

    } = await supabaseAdmin
      .from("users")
      .delete()
      .eq("id", id);

    if (dbError) {

      throw dbError;

    }

   return Response.json(

  {

    success: true,

  },

  {

    headers: corsHeaders,

  }

);

  }

catch (error: any) {

  console.error("DELETE USER ERROR:", error);

  return Response.json(

    {
      error: error?.message ?? "Unknown error",
      details: error,
    },

    {
      status: 500,
      headers: corsHeaders,
    }

  );

}

});