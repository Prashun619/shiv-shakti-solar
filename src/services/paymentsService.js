import { supabase } from "./supabase";

/* ===========================
   GET ALL PAYMENTS
=========================== */
export async function getAllPayments() {

  const {
    data: payments,
    error: paymentError
  } = await supabase
    .from("payments")
    .select(`
      *,
      projects (
        id,
        project_no,
        initial_received,
        customers (
          customer_name
        )
      )
    `);

  if (paymentError)
    throw paymentError;


  const {
    data: projects,
    error: projectError
  } = await supabase
    .from("projects")
    .select(`
      id,
      project_date,
      initial_received,
      project_no,
      customers (
        customer_name
      )
    `)
    .gt(
      "initial_received",
      0
    );

  if (projectError)
    throw projectError;


  const advancePayments =
    (projects || []).map(
      (project) => ({

        id:
          `advance-${project.id}`,

        payment_date:
          project.project_date,

        payment_type:
          "Advance",

        payment_mode:
          "Initial",

        amount:
          project.initial_received,

        reference_no:
          "-",

        remarks:
          "Advance received during project creation",

        projects: {

          id:
            project.id,

          project_no:
            project.project_no,

          customers:
            project.customers,

        },

      })
    );


  return [
    ...advancePayments,
    ...(payments || [])
  ].sort(
    (a, b) =>
      new Date(b.payment_date) -
      new Date(a.payment_date)
  );

}

/* ===========================
   ADD PAYMENT
=========================== */
export async function addPayment(payment) {

  /*
    IMPORTANT:
    UUID fields must NEVER receive "".

    Convert empty project_id to null.
  */

  const payload = {
    ...payment,

    project_id:
      payment?.project_id || null,
  };

  /*
    Customer ID should also never be
    an empty string if your payments
    table contains customer_id.
  */

  if (
    Object.prototype.hasOwnProperty.call(
      payload,
      "customer_id"
    )
  ) {
    payload.customer_id =
      payload.customer_id || null;
  }


  const {
    data,
    error,
  } = await supabase
    .from("payments")
    .insert([payload])
    .select()
    .single();


  if (error) {
    throw error;
  }


  /*
    Only update project totals when
    this payment belongs to a project.
  */

  if (payload.project_id) {

    await updateProjectPayment(
      payload.project_id
    );
  }


  return data;
}


/* ===========================
   UPDATE PAYMENT
=========================== */
export async function updatePayment(
  paymentId,
  payment,
  projectId
) {

  /*
    UUID fields must never receive "".
  */

  const payload = {
    ...payment,

    project_id:
      payment?.project_id ||
      projectId ||
      null,
  };


  if (
    Object.prototype.hasOwnProperty.call(
      payload,
      "customer_id"
    )
  ) {
    payload.customer_id =
      payload.customer_id || null;
  }


  const {
    data,
    error,
  } = await supabase
    .from("payments")
    .update(payload)
    .eq(
      "id",
      paymentId
    )
    .select()
    .single();


  if (error) {
    throw error;
  }


  /*
    Only update project totals when
    there is a valid project.
  */

  const finalProjectId =
    payload.project_id;


  if (finalProjectId) {

    await updateProjectPayment(
      finalProjectId
    );
  }


  /*
    If the old payment belonged to a
    different project and was moved,
    recalculate the old project too.
  */

  if (
    projectId &&
    projectId !== finalProjectId
  ) {

    await updateProjectPayment(
      projectId
    );
  }


  return data;
}


/* ===========================
   DELETE PAYMENT
=========================== */
export async function deletePayment(
  paymentId,
  projectId
) {

  const {
    error,
  } = await supabase
    .from("payments")
    .delete()
    .eq(
      "id",
      paymentId
    );


  if (error) {
    throw error;
  }


  /*
    Do not query projects with
    an empty UUID.
  */

  if (projectId) {

    await updateProjectPayment(
      projectId
    );
  }
}


/* ===========================
   UPDATE PROJECT RECEIVED
=========================== */
export async function updateProjectPayment(
  projectId
) {

  /*
    Never send an empty string to
    a UUID column.
  */

  if (!projectId) {
    return;
  }


  // Get project details
  const {
    data: project,
    error: projectError,
  } = await supabase
    .from("projects")
    .select(
      "total_amount, initial_received"
    )
    .eq(
      "id",
      projectId
    )
    .single();


  if (projectError) {
    throw projectError;
  }


  if (!project) {
    return;
  }


  // Get all payments for this project
  const {
    data: payments,
    error,
  } = await supabase
    .from("payments")
    .select("amount")
    .eq(
      "project_id",
      projectId
    );


  if (error) {
    throw error;
  }


  // Sum all payment records
  const paymentTotal =
    (payments || []).reduce(
      (sum, payment) =>
        sum +
        Number(
          payment.amount || 0
        ),
      0
    );


  // Initial amount received
  const initialReceived =
    Number(
      project.initial_received || 0
    );


  // Total received
  const received =
    initialReceived +
    paymentTotal;


  // Current project total
  const total =
    Number(
      project.total_amount || 0
    );


  // Remaining amount
  const remaining =
    Math.max(
      total - received,
      0
    );


  // Project status
  const status =
    remaining === 0 &&
    total > 0
      ? "Completed"
      : "Pending";


  const {
    error: updateError,
  } = await supabase
    .from("projects")
    .update({
      received,
      remaining,
      status,
    })
    .eq(
      "id",
      projectId
    );


  if (updateError) {
    throw updateError;
  }
}


/* ===========================
   GET PAYMENTS BY PROJECT
=========================== */
export async function getPaymentsByProject(
  projectId
) {

  /*
    Prevent invalid UUID query.
  */

  if (!projectId) {
    return [];
  }


  const {
    data,
    error,
  } = await supabase
    .from("payments")
    .select("*")
    .eq(
      "project_id",
      projectId
    )
    .order(
      "payment_date",
      {
        ascending: false,
      }
    );


  if (error) {
    throw error;
  }


  return data || [];
}


export const getProjectPayments =
  getPaymentsByProject;
