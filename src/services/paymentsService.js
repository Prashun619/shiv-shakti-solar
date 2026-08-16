import { supabase } from "./supabase";




/* ===========================
   GET ALL PAYMENTS
=========================== */
export async function getAllPayments() {

  // Get payment entries
  const { data: payments, error: paymentError } =
    await supabase
      .from("payments")
      .select(`
        *,
        projects (
          project_no,
          initial_received,
          customers (
            customer_name
          )
        )
      `);

  if (paymentError) throw paymentError;

  // Get project advances
  const { data: projects, error: projectError } =
    await supabase
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
      .gt("initial_received", 0);

  if (projectError) throw projectError;

  // Convert advances into payment-like records
  const advancePayments = projects.map((project) => ({
    id: `advance-${project.id}`,
    payment_date: project.project_date,
    payment_type: "Advance",
    payment_mode: "Initial",
    amount: project.initial_received,
    reference_no: "-",
    remarks: "Advance received during project creation",
    projects: {
      project_no: project.project_no,
      customers: project.customers,
    },
  }));

  // Merge and sort
  return [...advancePayments, ...(payments || [])].sort(
    (a, b) => new Date(b.payment_date) - new Date(a.payment_date)
  );
}


/* ===========================
   ADD PAYMENT
=========================== */
export async function addPayment(payment) {


  const { data, error } =
    await supabase
      .from("payments")
      .insert([payment])
      .select()
      .single();


 

  if (error) throw error;


  await updateProjectPayment(
    payment.project_id
  );


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

  const { data, error } =
    await supabase
      .from("payments")
      .update(payment)
      .eq(
        "id",
        paymentId
      )
      .select()
      .single();


  if (error) throw error;


  await updateProjectPayment(
    projectId
  );


  return data;

}



/* ===========================
   DELETE PAYMENT
=========================== */
export async function deletePayment(
  paymentId,
  projectId
) {


  const { error } =
    await supabase
      .from("payments")
      .delete()
      .eq(
        "id",
        paymentId
      );


  if (error) throw error;


  await updateProjectPayment(
    projectId
  );

}






/* ===========================
   UPDATE PROJECT RECEIVED
=========================== */
async function updateProjectPayment(projectId) {

  // Get project details
  const { data: project, error: projectError } =
    await supabase
      .from("projects")
      .select("total_amount, initial_received")
      .eq("id", projectId)
      .single();

  if (projectError) throw projectError;

  // Get all payments for this project
  const { data: payments, error } =
    await supabase
      .from("payments")
      .select("amount")
      .eq("project_id", projectId);

  if (error) throw error;

  // Sum all payments
  const paymentTotal = payments.reduce(
    (sum, p) => sum + Number(p.amount || 0),
    0
  );

  // Total received = Initial received + Payment entries
  const received =
    Number(project.initial_received || 0) +
    paymentTotal;

  const total =
    Number(project.total_amount || 0);

  const remaining =
    Math.max(total - received, 0);

  const status =
    remaining === 0 && total > 0
      ? "Completed"
      : "Pending";

  const { error: updateError } =
    await supabase
      .from("projects")
      .update({
        received,
        remaining,
        status,
      })
      .eq("id", projectId);

    if (updateError) throw updateError;

}

/* ===========================
   GET PAYMENTS BY PROJECT
=========================== */

export async function getPaymentsByProject(projectId) {

  const { data, error } =
    await supabase
      .from("payments")
      .select("*")
      .eq("project_id", projectId)
      .order("payment_date", {
        ascending: false,
      });


  if(error)
    throw error;


  return data || [];

}

export const getProjectPayments = getPaymentsByProject;