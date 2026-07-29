import "@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {

  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders,
    });
  }

  try {

    const {
      id,
      newPassword,
    } = await req.json();

    if (!id || !newPassword) {

      return Response.json(
        {
          error: "Missing required fields",
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

    // Update Auth password

    const {
      error: authError,
    } =
    await supabaseAdmin.auth.admin.updateUserById(
      id,
      {
        password: newPassword,
      }
    );

    if (authError) throw authError;

    // Update users table password

    const {
      error: dbError,
    } =
    await supabaseAdmin
      .from("users")
      .update({
        password: newPassword,
      })
      .eq("id", id);

    if (dbError) throw dbError;

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

    return Response.json(

      {
        error: error.message,
      },

      {
        status: 500,
        headers: corsHeaders,
      }

    );

  }

});