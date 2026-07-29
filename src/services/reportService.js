import { supabase } from "./supabase";
import jsPDF from "jspdf";

export async function getCustomerReport() {
  const { data, error } = await supabase
    .from("customers")
    .select(`
      id,
      customer_name,
      mobile,
      email,
      address,
      location,
      plant_size,
      payment_type
    `)
    .order("customer_name", { ascending: true });

  if (error) throw error;

  return data || [];
}


export async function getProjectReport() {

  const { data, error } = await supabase
    .from("projects")
    .select(`
      id,
      project_no,
      project_date,
      project_size,
      status,
      total_amount,
      received,
      remaining,
      customers (
        customer_name
      )
    `)
    .order("project_date", { ascending: false });

  if (error) throw error;

  return data || [];
}

export function exportProjectReport(projects, payments) {
  const doc = new jsPDF({
  orientation: "landscape",
  unit: "mm",
  format: "a4",
});

  doc.text("PROJECT REPORT", 10, 10);

  let y = 20;

  projects.forEach((p) => {
    const received = payments
      .filter((pay) => pay.project_id === p.id)
      .reduce((sum, pay) => sum + Number(pay.amount || 0), 0);

    doc.text(
      `${p.project_name} | Total: ₹${p.total_amount} | Received: ₹${received}`,
      10,
      y
    );

    y += 10;
  });

  doc.save("report.pdf");
}
export function exportCustomerCSV(customers) {

  const headers = [
  "S.No",
  "Customer Name",
  "Mobile",
  "Location",
  "Plant Size",
  "Payment Type",
];

  const rows = customers.map((customer, index) => [
  index + 1,
  customer.customer_name || "",
  customer.mobile || "",
  customer.location || "",
  customer.plant_size || "",
  customer.payment_type || "",
]);

  const csv = [
    headers,
    ...rows,
  ]
    .map(row =>
      row.map(value => `"${String(value).replace(/"/g, '""')}"`).join(",")
    )
    .join("\n");

  const blob = new Blob([csv], {
    type: "text/csv;charset=utf-8;",
  });

  const link = document.createElement("a");

  link.href = URL.createObjectURL(blob);

  link.download = "Customer Report.csv";

  link.click();
}

