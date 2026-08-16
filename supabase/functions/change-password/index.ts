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
    // AUTHENTICATED USER CLIENT
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
    // VERIFY CURRENT APP USER
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

    // =====================================================
    // REQUEST DATA
    // =====================================================

    const {
      id,
      newPassword,
    } = await req.json();

    if (
      !id ||
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
    // AUTHORIZATION
    //
    // A normal user can change only their own password.
    // Admin can change another user's password.
    // =====================================================

    const isAdmin =
      currentUser.role === "Admin" &&
      currentUser.active === true;

    const isChangingOwnPassword =
      authUser.id === id;

    if (
      !isAdmin &&
      !isChangingOwnPassword
    ) {
      return new Response(
        JSON.stringify({
          error:
            "You are not allowed to change this user's password.",
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
          active
        `)
        .eq(
          "id",
          id
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
    // UPDATE SUPABASE AUTH PASSWORD ONLY
    //
    // IMPORTANT:
    // DO NOT write password to public.users
    // =====================================================

    const {
      error: updateError,
    } =
      await supabaseAdmin.auth.admin.updateUserById(
        id,
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
          "Password changed successfully.",
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