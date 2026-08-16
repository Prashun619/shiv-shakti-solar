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

  // =====================================================
  // CORS
  // =====================================================

  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders,
    });
  }

  try {

    // =====================================================
    // CREATE USER CLIENT
    // Uses caller's JWT
    // =====================================================

    const supabaseUrl =
      Deno.env.get("SUPABASE_URL");

    const serviceRoleKey =
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error(
        "Supabase environment variables are missing."
      );
    }

    const supabaseUser =
      createClient(
        supabaseUrl,
        Deno.env.get("SUPABASE_ANON_KEY") || "",
        {
          global: {
            headers: {
              Authorization:
                req.headers.get(
                  "Authorization"
                ) || "",
            },
          },
        }
      );

    // =====================================================
    // VERIFY LOGGED-IN USER
    // =====================================================

    const {
      data: {
        user: authUser,
      },
      error: authError,
    } =
      await supabaseUser.auth.getUser();

    if (
      authError ||
      !authUser
    ) {
      return new Response(
        JSON.stringify({
          error:
            "Unauthorized. Please login first.",
        }),
        {
          status: 401,
          headers: {
            ...corsHeaders,
            "Content-Type":
              "application/json",
          },
        }
      );
    }

    // =====================================================
    // ADMIN CLIENT
    // =====================================================

    const supabaseAdmin =
      createClient(
        supabaseUrl,
        serviceRoleKey
      );

    // =====================================================
    // VERIFY CURRENT USER IS ADMIN
    // =====================================================

    const {
      data: currentUser,
      error: currentUserError,
    } =
      await supabaseAdmin
        .from("users")
        .select(`
          id,
          role,
          active
        `)
        .eq(
          "id",
          authUser.id
        )
        .single();

    if (
      currentUserError ||
      !currentUser
    ) {
      return new Response(
        JSON.stringify({
          error:
            "Unable to verify current user.",
        }),
        {
          status: 403,
          headers: {
            ...corsHeaders,
            "Content-Type":
              "application/json",
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
          error:
            "Only Admin users can create users.",
        }),
        {
          status: 403,
          headers: {
            ...corsHeaders,
            "Content-Type":
              "application/json",
          },
        }
      );
    }

    // =====================================================
    // READ REQUEST BODY
    // =====================================================

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
      billing,
      investments,
      invoices,
    } = body;

    // =====================================================
    // VALIDATION
    // =====================================================

    if (
      !full_name?.trim() ||
      !username?.trim() ||
      !password
    ) {
      return new Response(
        JSON.stringify({
          error:
            "Missing required fields.",
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type":
              "application/json",
          },
        }
      );
    }

    const cleanUsername =
      username.trim();

    const authEmail =
      `${cleanUsername}@shivshaktisolar.local`;

    // =====================================================
    // CREATE SUPABASE AUTH USER
    // =====================================================

    const {
      data: userData,
      error: userError,
    } =
      await supabaseAdmin.auth.admin.createUser({
        email: authEmail,
        password,
        email_confirm: true,
      });

    if (userError) {
      throw userError;
    }

    const authUserId =
      userData?.user?.id;

    if (!authUserId) {
      throw new Error(
        "Auth user was created but no user ID was returned."
      );
    }

    // =====================================================
    // INSERT ERP USER
    //
    // IMPORTANT:
    // NO PASSWORD IS STORED HERE
    // =====================================================

    const {
      error: dbError,
    } =
      await supabaseAdmin
        .from("users")
        .insert({
          id: authUserId,

          full_name:
            full_name.trim(),

          username:
            cleanUsername,

          email:
            authEmail,

          role:
            role || "User",

          active: true,

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

          billing:
            billing ?? false,

          investments:
            investments ?? false,

          invoices:
            invoices ?? false,
        });

    // =====================================================
    // ROLLBACK AUTH USER IF DATABASE INSERT FAILS
    // =====================================================

    if (dbError) {

      await supabaseAdmin.auth.admin.deleteUser(
        authUserId
      );

      throw dbError;
    }

    // =====================================================
    // SUCCESS
    // =====================================================

    return new Response(
      JSON.stringify({
        success: true,
        message:
          "User created successfully.",
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type":
            "application/json",
        },
      }
    );

  } catch (error) {

    const message =
      error instanceof Error
        ? error.message
        : String(error);

    return new Response(
      JSON.stringify({
        error: message,
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type":
            "application/json",
        },
      }
    );
  }
});