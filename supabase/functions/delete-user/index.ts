import "@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods":
    "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseAnonKey || !serviceRoleKey) {
      throw new Error("Supabase environment variables are missing.");
    }

    // -----------------------------------------------------
    // VERIFY CALLER
    // -----------------------------------------------------

    const supabaseUser = createClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        global: {
          headers: {
            Authorization:
              req.headers.get("Authorization") || "",
          },
        },
      }
    );

    const {
      data: { user: authUser },
      error: authError,
    } = await supabaseUser.auth.getUser();

    if (authError || !authUser) {
      return new Response(
        JSON.stringify({
          error: "Unauthorized. Please login first.",
        }),
        {
          status: 401,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    // -----------------------------------------------------
    // ADMIN CLIENT
    // -----------------------------------------------------

    const supabaseAdmin = createClient(
      supabaseUrl,
      serviceRoleKey
    );

    // -----------------------------------------------------
    // VERIFY CURRENT USER IS ADMIN
    // -----------------------------------------------------

    const {
      data: currentUser,
      error: currentUserError,
    } = await supabaseAdmin
      .from("users")
      .select("id, role, active")
      .eq("id", authUser.id)
      .single();

    if (currentUserError || !currentUser) {
      return new Response(
        JSON.stringify({
          error: "Unable to verify current user.",
        }),
        {
          status: 403,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    if (
      !currentUser.active ||
      currentUser.role !== "Admin"
    ) {
      return new Response(
        JSON.stringify({
          error: "Only Admin users can delete users.",
        }),
        {
          status: 403,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    // -----------------------------------------------------
    // REQUEST
    // -----------------------------------------------------

    const { id } = await req.json();

    if (!id) {
      return new Response(
        JSON.stringify({
          error: "User ID is required.",
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    // -----------------------------------------------------
    // PREVENT SELF DELETE
    // -----------------------------------------------------

    if (id === authUser.id) {
      return new Response(
        JSON.stringify({
          error: "You cannot delete your own account.",
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    // -----------------------------------------------------
    // FIND TARGET USER
    // -----------------------------------------------------

    const {
      data: targetUser,
      error: targetUserError,
    } = await supabaseAdmin
      .from("users")
      .select(`
        id,
        full_name,
        username,
        email,
        role,
        active
      `)
      .eq("id", id)
      .single();

    if (targetUserError || !targetUser) {
      return new Response(
        JSON.stringify({
          error: "Target user was not found.",
        }),
        {
          status: 404,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    // -----------------------------------------------------
    // PREVENT ADMIN DELETE
    // -----------------------------------------------------

    if (targetUser.role === "Admin") {
      return new Response(
        JSON.stringify({
          error: "Admin users cannot be deleted.",
        }),
        {
          status: 403,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    // -----------------------------------------------------
    // DELETE AUTH USER FIRST
    // -----------------------------------------------------

    const {
      error: authDeleteError,
    } = await supabaseAdmin.auth.admin.deleteUser(id);

    if (authDeleteError) {
      throw authDeleteError;
    }

    // -----------------------------------------------------
    // DELETE ERP USER PROFILE
    //
    // user_permissions are deleted automatically because:
    //
    // user_permissions.user_id
    //        →
    // users.id
    //        ON DELETE CASCADE
    // -----------------------------------------------------

    const {
      error: profileDeleteError,
    } = await supabaseAdmin
      .from("users")
      .delete()
      .eq("id", id);

    if (profileDeleteError) {
      throw profileDeleteError;
    }

    // -----------------------------------------------------
    // SUCCESS
    // -----------------------------------------------------

    return new Response(
      JSON.stringify({
        success: true,
        message: "User deleted successfully.",
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );

  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : String(error);

    console.error("DELETE USER ERROR:", error);

    return new Response(
      JSON.stringify({
        error: message,
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});