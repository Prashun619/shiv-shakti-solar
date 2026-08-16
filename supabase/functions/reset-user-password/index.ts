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
    // ENVIRONMENT
    // =====================================================

    const supabaseUrl =
      Deno.env.get("SUPABASE_URL");

    const supabaseAnonKey =
      Deno.env.get("SUPABASE_ANON_KEY");

    const serviceRoleKey =
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (
      !supabaseUrl ||
      !supabaseAnonKey ||
      !serviceRoleKey
    ) {
      throw new Error(
        "Supabase environment variables are missing."
      );
    }

    // =====================================================
    // CLIENT USING CALLER JWT
    // =====================================================

    const supabaseUser =
      createClient(
        supabaseUrl,
        supabaseAnonKey,
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
    // VERIFY CALLER
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
    // VERIFY CALLER IS ADMIN
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
            "Only Admin users can reset passwords.",
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
    // READ REQUEST
    // =====================================================

    const {
      userId,
      newPassword,
    } = await req.json();

    // =====================================================
    // VALIDATION
    // =====================================================

    if (
      !userId ||
      !newPassword
    ) {
      return new Response(
        JSON.stringify({
          error:
            "User ID and new password are required.",
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

    if (
      String(newPassword).length < 8
    ) {
      return new Response(
        JSON.stringify({
          error:
            "Password must be at least 8 characters.",
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

    // =====================================================
    // VERIFY TARGET USER EXISTS
    // =====================================================

    const {
      data: targetUser,
      error: targetUserError,
    } =
      await supabaseAdmin
        .from("users")
        .select(`
          id,
          full_name,
          active
        `)
        .eq(
          "id",
          userId
        )
        .single();

    if (
      targetUserError ||
      !targetUser
    ) {
      return new Response(
        JSON.stringify({
          error:
            "Target user was not found.",
        }),
        {
          status: 404,
          headers: {
            ...corsHeaders,
            "Content-Type":
              "application/json",
          },
        }
      );
    }

    // =====================================================
    // UPDATE SUPABASE AUTH PASSWORD
    //
    // IMPORTANT:
    // Nothing is written to public.users.password
    // =====================================================

    const {
      error: updateError,
    } =
      await supabaseAdmin.auth.admin.updateUserById(
        userId,
        {
          password: newPassword,
        }
      );

    if (updateError) {
      throw updateError;
    }

    // =====================================================
    // SUCCESS
    // =====================================================

    return new Response(
      JSON.stringify({
        success: true,
        message:
          "Password reset successfully.",
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